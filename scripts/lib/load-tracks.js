/**
 * H/MIX GALLERY — load-tracks.js
 * tracks.js から TRACKS 配列 / TAGS_META / タグ名マップを抽出する共通ローダ。
 * inject-seo.js のパーサロジックを抽出・再利用。
 *
 * 使い方:
 *   const { loadTracksData } = require('./lib/load-tracks');
 *   const { tracks, tagsMeta, tagNames, tagNamesEn } = loadTracksData();
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_TRACKS_JS = path.resolve(__dirname, '../../assets/js/tracks.js');

// ── 「const <NAME>」の直後の最初の開き括弧から、深さ0に戻るまでの範囲を抽出 ──
function extractBlock(src, constName, openChar, closeChar) {
  const anchor = src.indexOf(`const ${constName}`);
  if (anchor < 0) throw new Error(`[load-tracks] '${constName}' not found in tracks.js`);
  const start = src.indexOf(openChar, anchor);
  if (start < 0) throw new Error(`[load-tracks] opening '${openChar}' not found after '${constName}'`);
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === openChar) depth++;
    if (src[i] === closeChar) depth--;
    if (depth === 0) return src.substring(start, i + 1);
  }
  throw new Error(`[load-tracks] unbalanced '${openChar}' ... '${closeChar}' for '${constName}'`);
}

function loadTracksData(tracksJsPath) {
  const p = tracksJsPath || DEFAULT_TRACKS_JS;
  const src = fs.readFileSync(p, 'utf8');

  const tracksJson = extractBlock(src, 'TRACKS', '[', ']');
  const metaJson   = extractBlock(src, 'TAGS_META', '{', '}');

  let tracks, tagsMeta;
  try { tracks = JSON.parse(tracksJson); }
  catch (e) { throw new Error('[load-tracks] TRACKS parse failed: ' + e.message); }
  try { tagsMeta = JSON.parse(metaJson); }
  catch (e) { throw new Error('[load-tracks] TAGS_META parse failed: ' + e.message); }

  // タグID → 日本語名 / 英語名 のマップ
  const tagNames   = {};
  const tagNamesEn = {};
  for (const cat in tagsMeta) {
    (tagsMeta[cat] || []).forEach(t => {
      if (t && t.id) {
        tagNames[t.id]   = t.name    || t.id;
        tagNamesEn[t.id] = t.name_en || t.name || t.id;
      }
    });
  }

  return { tracks, tagsMeta, tagNames, tagNamesEn };
}

module.exports = { loadTracksData };
