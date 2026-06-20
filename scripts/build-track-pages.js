/**
 * H/MIX GALLERY — build-track-pages.js
 * tracks.js → /music/{id}.html の <body> 主要領域を静的に焼き込む。
 * Googlebot の初回スナップショットに曲名・本文・タグ・DLリンクを見せるのが目的。
 *
 * 使い方:
 *   node scripts/build-track-pages.js                # 全303曲ビルド
 *   node scripts/build-track-pages.js --only n1,n2   # 指定ID のみ（dry-run）
 *   node scripts/build-track-pages.js --counts-only  # 件数プレースホルダ置換のみ
 *   node scripts/build-track-pages.js --no-counts    # 件数置換をスキップ
 *   node scripts/build-track-pages.js --no-backup    # 自動バックアップをスキップ
 *
 * 副作用:
 *   - 走る前に scripts/backup-music.js を実行し music/*.html をスナップショット退避。
 *   - P6: index.html / genre/*.html / music-library.html / terms.html / composer.html の
 *         `{{COUNT:xxx}}` プレースホルダを置換する。
 */
const fs = require('fs');
const path = require('path');
const { loadTracksData } = require('./lib/load-tracks');
const { countTracks, applyCountPlaceholders } = require('./lib/count-tracks');
const { getPrimaryTag, sceneWebp } = require('./inject-seo');
const backupMusic = require('./backup-music');

const ROOT        = path.resolve(__dirname, '..');
const MUSIC_DIR   = path.join(ROOT, 'music');
const SCENES_DIR  = path.join(ROOT, 'assets/images/scenes');
const SITE        = 'https://www.hmix.net';

// ── CLI 引数パース ──
function parseArgs(argv) {
  const out = { only: null, countsOnly: false, noCounts: false, noBackup: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--only=')) {
      out.only = a.substring('--only='.length).split(',').map(s => s.trim()).filter(Boolean);
    } else if (a === '--only') {
      // 別トークンで渡された場合は次のargvで拾う（簡易実装のためここはエラー扱い）
      console.warn('[build-track-pages] --only は --only=n1,n2 形式で指定してください');
    } else if (a === '--counts-only') out.countsOnly = true;
    else if (a === '--no-counts') out.noCounts = true;
    else if (a === '--no-backup') out.noBackup = true;
    else if (a.startsWith('--only ')) {
      out.only = a.substring('--only '.length).split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return out;
}
// --only n1,n2（スペース区切り）もサポート
function normalizeArgs(argv) {
  const out = { only: null, countsOnly: false, noCounts: false, noBackup: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only' && argv[i + 1]) {
      out.only = argv[i + 1].split(',').map(s => s.trim()).filter(Boolean);
      i++;
    } else if (a.startsWith('--only=')) {
      out.only = a.substring('--only='.length).split(',').map(s => s.trim()).filter(Boolean);
    }
    else if (a === '--counts-only') out.countsOnly = true;
    else if (a === '--no-counts')   out.noCounts = true;
    else if (a === '--no-backup')   out.noBackup = true;
  }
  return out;
}

// ── HTML エスケープ ──
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 改行を保持してHTMLへ出力（description の多行テキスト用）
// 前後の空白は除去。内部の連続改行は単一の <br> に圧縮。
function multiline(s) {
  const trimmed = String(s || '').replace(/^\s+|\s+$/g, '');
  return esc(trimmed).replace(/\n+/g, '<br>');
}

// ── scene 画像パス（music/配下の相対パス）──
function sceneRelative(track) {
  const primary = getPrimaryTag(track);
  const name = (primary && fs.existsSync(path.join(SCENES_DIR, `${primary}.webp`))) ? `${primary}.webp` : 'dark.webp';
  return `../assets/images/scenes/${name}`;
}

// ── タグID → 日本語ラベル（tagNames から）。未登録はIDをそのまま返す ──
function tagLabel(id, tagNames) {
  return (tagNames && tagNames[id]) || id;
}

// ── 1ファイル分の body 置換 ──
function transformHtml(html, track, tagNames) {
  const id = track.id;
  const idUpper = id.toUpperCase();
  const title = track.title || idUpper;
  const desc  = track.description || '';
  const sceneUrl = sceneRelative(track);
  const mp3 = track.mp3 || `/music/${id[0]}/${id}.mp3`;

  // ── <h1 id="td2-hero-title"> ──
  html = html.replace(
    /(<h1[^>]*id="td2-hero-title"[^>]*>)([\s\S]*?)(<\/h1>)/,
    `$1${esc(title)}$3`
  );

  // ── #td2-hero-id ──
  html = html.replace(
    /(<div[^>]*id="td2-hero-id"[^>]*>)([\s\S]*?)(<\/div>)/,
    `$1${esc(idUpper)}$3`
  );

  // ── #td2-breadcrumb-title ──
  html = html.replace(
    /(<span[^>]*id="td2-breadcrumb-title"[^>]*>)([\s\S]*?)(<\/span>)/,
    `$1${esc(title)}$3`
  );

  // ── #td2-hero-desc ──
  // 既に内側に <br> 等があっても丸ごと置換
  html = html.replace(
    /(<p[^>]*id="td2-hero-desc"[^>]*>)([\s\S]*?)(<\/p>)/,
    `$1${multiline(desc)}$3`
  );

  // ── .td2-hero__image の style 属性に背景画像を焼き込む ──
  // 元HTMLは <div class="td2-hero__image" aria-hidden="true"></div>
  const heroBgRe = /(<div[^>]*class="td2-hero__image"[^>]*?)(\s+style="[^"]*")?(\s*(?:aria-hidden="[^"]*")?\s*>)/;
  if (heroBgRe.test(html)) {
    html = html.replace(heroBgRe, (m, pre, _style, post) => {
      return `${pre} style="background-image:url('${esc(sceneUrl)}')"${post}`;
    });
  }

  // ── タグリスト（4カテゴリ） ──
  ['feeling', 'style', 'scene', 'story'].forEach(cat => {
    const tags = Array.isArray(track[cat]) ? track[cat] : [];
    const groupRe = new RegExp(
      `(<div[^>]*class="td2-tag-group"[^>]*data-cat="${cat}"[^>]*>)([\\s\\S]*?)(<\\/div>\\s*(?=<div[^>]*class="td2-tag-group"|<\\/section>))`,
      'i'
    );
    // より単純なアプローチ: data-cat="{cat}" グループ内の .td2-tag-group__list の内側だけを差し替え
    const listInnerRe = new RegExp(
      `(<div[^>]*class="td2-tag-group"[^>]*data-cat="${cat}"[^>]*>[\\s\\S]*?<div[^>]*class="td2-tag-group__list"[^>]*>)([\\s\\S]*?)(<\\/div>)`,
      'i'
    );

    if (tags.length === 0) {
      // タグ無し → グループ全体を hidden
      html = html.replace(
        new RegExp(`(<div[^>]*class="td2-tag-group")([^>]*data-cat="${cat}"[^>]*)(>)`, 'i'),
        (m, pre, mid, post) => {
          if (/\bhidden\b/.test(mid)) return m;
          return `${pre}${mid} hidden${post}`;
        }
      );
      // リスト内を空化
      html = html.replace(listInnerRe, `$1$3`);
      return;
    }

    const items = tags.map(t => {
      const label = tagLabel(t, tagNames);
      return `<a class="td2-tag td2-tag--${esc(cat)}" href="../music-library.html?${esc(cat)}=${esc(t)}" data-tag="${esc(t)}">${esc(label)}</a>`;
    }).join('');

    html = html.replace(listInnerRe, `$1${items}$3`);
  });

  // ── #td2-download-btn の href / download 属性 ──
  html = html.replace(
    /(<a[^>]*id="td2-download-btn"[^>]*?)(\s+href="[^"]*")?([^>]*>)/,
    (m, pre, _oldHref, post) => {
      // download 属性が無ければ追加
      let body = `${pre} href="${esc(mp3)}"${post}`;
      if (!/\bdownload=/i.test(body)) {
        body = body.replace(/>$/, ` download="${esc(id)}.mp3">`);
      } else {
        body = body.replace(/\bdownload="[^"]*"/, `download="${esc(id)}.mp3"`);
      }
      return body;
    }
  );

  // ── #credit-text 初期値（曲名あり・日本語） ──
  const creditText = `BGM：${title} / H/MIX GALLERY（秋山裕和）\nhttps://www.hmix.net`;
  html = html.replace(
    /(<code[^>]*id="credit-text"[^>]*>)([\s\S]*?)(<\/code>)/,
    `$1${esc(creditText)}$3`
  );

  // ── #hero-play-btn に data-track-id を付与（既存JSのフック補助） ──
  html = html.replace(
    /(<button[^>]*id="hero-play-btn"[^>]*?)(\s+data-track-id="[^"]*")?([^>]*>)/,
    (m, pre, _old, post) => `${pre} data-track-id="${esc(id)}"${post}`
  );

  return html;
}

// ── 件数プレースホルダ置換対象ファイル一覧（13箇所） ──
const COUNT_TARGETS = [
  'index.html',
  'music-library.html',
  'terms.html',
  'composer.html',
  'genre/battle.html',
  'genre/celtic.html',
  'genre/electronic.html',
  'genre/epic.html',
  'genre/fantasy.html',
  'genre/happy.html',
  'genre/healing.html',
  'genre/horror.html',
  'genre/japanese.html',
  'genre/sad.html',
  'genre/suspense.html',
];

function applyCounts(counts) {
  let touched = 0;
  let totalReplaced = 0;
  const unresolvedAll = [];
  for (const rel of COUNT_TARGETS) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const orig = fs.readFileSync(p, 'utf8');
    const { html, replaced, unresolved } = applyCountPlaceholders(orig, counts);
    if (replaced > 0) {
      fs.writeFileSync(p, html, 'utf8');
      touched++;
      totalReplaced += replaced;
      console.log(`[counts] ${rel}: ${replaced} placeholders replaced`);
    }
    if (unresolved.length) {
      unresolvedAll.push({ file: rel, specs: [...new Set(unresolved)] });
    }
  }
  console.log(`[counts] touched ${touched} files, ${totalReplaced} total replacements`);
  if (unresolvedAll.length) {
    console.warn('[counts] unresolved placeholders:', JSON.stringify(unresolvedAll, null, 2));
  }
}

function main() {
  const args = normalizeArgs(process.argv);
  const { tracks, tagNames } = loadTracksData();
  const counts = countTracks(tracks);

  // ── 件数プレースホルダのみを実行（ページ生成抜き） ──
  if (args.countsOnly) {
    applyCounts(counts);
    return;
  }

  // ── バックアップ ──
  if (!args.noBackup) {
    try { backupMusic(); }
    catch (e) { console.warn('[backup] failed:', e.message); }
  }

  const target = args.only && args.only.length
    ? tracks.filter(t => args.only.includes(t.id))
    : tracks;

  if (args.only && target.length !== args.only.length) {
    const found = new Set(target.map(t => t.id));
    const missing = args.only.filter(id => !found.has(id));
    if (missing.length) console.warn('[build] missing IDs:', missing.join(','));
  }

  let updated = 0, skipped = 0, errors = 0;
  for (const t of target) {
    if (!t.title) {
      console.error(`[build] ERROR: title missing for id=${t.id} — 即時中断対象`);
      errors++;
      continue;
    }
    const htmlPath = path.join(MUSIC_DIR, `${t.id}.html`);
    if (!fs.existsSync(htmlPath)) {
      skipped++;
      continue;
    }
    try {
      const orig = fs.readFileSync(htmlPath, 'utf8');
      const out = transformHtml(orig, t, tagNames);
      if (out !== orig) {
        fs.writeFileSync(htmlPath, out, 'utf8');
        updated++;
      } else {
        skipped++;
      }
    } catch (e) {
      console.error(`[build] ${t.id}: ${e.message}`);
      errors++;
    }
  }

  console.log(`[build-track-pages] 対象=${target.length} 更新=${updated} スキップ=${skipped} エラー=${errors}`);

  // ── 件数プレースホルダ置換（ビルドと同時にデフォルトで実行） ──
  if (!args.noCounts && !args.only) {
    applyCounts(counts);
  } else if (args.only) {
    console.log('[counts] --only 指定時は件数置換を省略（全体ビルド時のみ実行）');
  }
}

if (require.main === module) main();

module.exports = { transformHtml, applyCounts };
