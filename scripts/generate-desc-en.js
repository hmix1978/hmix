/**
 * H/MIX GALLERY — description_en 一括生成スクリプト
 * Anthropic API (claude-haiku-4-5-20251001) で日本語説明文を英訳し tracks.js に追記
 *
 * 使い方: ANTHROPIC_API_KEY=sk-... node scripts/generate-desc-en.js
 */
const fs = require('fs');
const path = require('path');

const TRACKS_JS = path.resolve(__dirname, '../assets/js/tracks.js');
const TRACKS_TMP = TRACKS_JS + '.tmp';
const MODEL = 'claude-haiku-4-5-20251001';
const API_URL = 'https://api.anthropic.com/v1/messages';
const DELAY_MS = 500;

const SYSTEM_PROMPT = `You are a professional translator specializing in music and game BGM descriptions.
Translate Japanese music descriptions into natural, atmospheric English.
Preserve the poetic and evocative tone of the original.
Output only the translated text with no explanations or extra formatting.
Keep the result under 160 characters total.`;

// ── tracks.js からデータ読み込み ──
function loadData() {
  const c = fs.readFileSync(TRACKS_JS, 'utf8');

  const tStart = c.indexOf('[', c.indexOf('const TRACKS'));
  let depth = 0, i = tStart;
  for (; i < c.length; i++) { if (c[i] === '[') depth++; if (c[i] === ']') depth--; if (depth === 0) break; }
  const tracks = JSON.parse(c.substring(tStart, i + 1));

  // TAGS_META → name_en マップ
  const mStart = c.indexOf('{', c.indexOf('const TAGS_META'));
  depth = 0; i = mStart;
  for (; i < c.length; i++) { if (c[i] === '{') depth++; if (c[i] === '}') depth--; if (depth === 0) break; }
  const meta = JSON.parse(c.substring(mStart, i + 1));
  const tagNamesEn = {};
  for (const cat in meta) {
    meta[cat].forEach(t => { tagNamesEn[t.id] = t.name_en || t.name; });
  }

  return { tracks, tagNamesEn, rawContent: c };
}

// ── Anthropic API 呼び出し ──
async function translate(track, tagNamesEn) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const tags = [
    ...(track.feeling || []),
    ...(track.style || []),
    ...(track.scene || []),
  ].map(id => tagNamesEn[id] || id).join(', ');

  const userPrompt = `Title: ${track.title_en || track.title}\nTags: ${tags}\nJapanese description: ${track.description}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.substring(0, 200)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text?.trim() || '';
  return text;
}

// ── tracks.js に description_en を注入 ──
function injectDescEn(rawContent, id, descEn) {
  // "description": "..." の直後に "description_en": "..." を挿入
  const escaped = descEn.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  // id のエントリ内で description の後に挿入
  const idPattern = new RegExp(
    `("id":\\s*"${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?"description":\\s*"[\\s\\S]*?")`,
    'm'
  );
  const match = rawContent.match(idPattern);
  if (!match) return rawContent;

  // description の閉じ引用符の位置を特定
  const matchStart = rawContent.indexOf(match[0]);
  const matchEnd = matchStart + match[0].length;

  // 次の行のインデントを取得
  const nextLine = rawContent.substring(matchEnd).match(/,\s*\n(\s*)/);
  const indent = nextLine ? nextLine[1] : '    ';

  return rawContent.substring(0, matchEnd) +
    `,\n${indent}"description_en": "${escaped}"` +
    rawContent.substring(matchEnd);
}

// ── メイン ──
async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY 環境変数を設定してください');
    process.exit(1);
  }

  const { tracks, tagNamesEn, rawContent } = loadData();
  const needTranslation = tracks.filter(t => !t.description_en && t.description);
  console.log(`対象: ${needTranslation.length}曲（description_en 未定義）`);

  if (needTranslation.length === 0) {
    console.log('全曲に description_en が設定済みです。');
    return;
  }

  let content = rawContent;
  let success = 0;
  const failures = [];

  for (let idx = 0; idx < needTranslation.length; idx++) {
    const track = needTranslation[idx];

    try {
      const descEn = await translate(track, tagNamesEn);
      if (descEn) {
        content = injectDescEn(content, track.id, descEn);
        success++;
      } else {
        failures.push({ id: track.id, error: 'Empty response' });
      }
    } catch (err) {
      console.error(`[ERROR] ${track.id}: ${err.message}`);
      failures.push({ id: track.id, error: err.message });
    }

    if ((idx + 1) % 10 === 0) {
      console.log(`${idx + 1}/${needTranslation.length} 完了`);
    }

    // レート制限回避
    if (idx < needTranslation.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  // アトミック書き込み
  fs.writeFileSync(TRACKS_TMP, content, 'utf8');
  fs.renameSync(TRACKS_TMP, TRACKS_JS);

  console.log(`\n=== 完了: ${success} 成功, ${failures.length} 失敗 ===`);

  if (failures.length > 0) {
    console.log('\n失敗した曲:');
    failures.forEach(f => console.log(`  ${f.id}: ${f.error}`));
  }

  // サンプル5曲出力
  const updatedContent = fs.readFileSync(TRACKS_JS, 'utf8');
  const tStart = updatedContent.indexOf('[', updatedContent.indexOf('const TRACKS'));
  let depth = 0, i = tStart;
  for (; i < updatedContent.length; i++) { if (updatedContent[i] === '[') depth++; if (updatedContent[i] === ']') depth--; if (depth === 0) break; }
  const updatedTracks = JSON.parse(updatedContent.substring(tStart, i + 1));
  const samples = updatedTracks.filter(t => t.description_en).slice(0, 5);

  console.log('\n─── サンプル 5曲 ───');
  samples.forEach(t => {
    console.log(`\n${t.id} (${t.title_en || t.title}):`);
    console.log(`  ${t.description_en}`);
  });
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
