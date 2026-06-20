// H/MIX GALLERY — SEO局所修正スクリプト (Node.js版)
const fs   = require('fs');
const path = require('path');

const MUSIC_DIR = path.join(__dirname, 'music');
const SITEMAP   = path.join(__dirname, 'sitemap.xml');
const BASE_URL  = 'https://www.hmix.net';

const OLD_CANONICAL = '  <link rel="canonical" id="page-canonical" href="https://www.hmix.net/">';

// 1. 個別曲ページ
let fixed = 0, skipped = 0, alreadyDone = 0;

const files = fs.readdirSync(MUSIC_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const filename of files) {
  const filepath = path.join(MUSIC_DIR, filename);
  const trackId  = filename.replace('.html', '');
  const pageUrl  = `${BASE_URL}/music/${trackId}.html`;

  let content = fs.readFileSync(filepath, 'utf8');

  if (content.includes(`href="${pageUrl}"`) && content.includes('og:url')) {
    alreadyDone++;
    continue;
  }

  if (!content.includes(OLD_CANONICAL)) {
    console.log(`  [WARN] canonical行が見つかりません: ${filename}`);
    skipped++;
    continue;
  }

  const newBlock =
    `  <meta property="og:url" id="og-url" content="${pageUrl}">\n` +
    `  <link rel="canonical" id="page-canonical" href="${pageUrl}">`;

  content = content.replace(OLD_CANONICAL, newBlock);
  fs.writeFileSync(filepath, content, 'utf8');
  fixed++;
}

console.log(`[1] 個別曲ページ: ${fixed}件修正 / ${alreadyDone}件スキップ(修正済) / ${skipped}件警告`);

// 2. music/index.html
const indexPath = path.join(MUSIC_DIR, 'index.html');
let idx = fs.readFileSync(indexPath, 'utf8');
const oldIdx = 'href="https://www.hmix.net/test2026/music/"';
const newIdx = `href="${BASE_URL}/music/"`;
if (idx.includes(oldIdx)) {
  idx = idx.replace(oldIdx, newIdx);
  fs.writeFileSync(indexPath, idx, 'utf8');
  console.log('[2] music/index.html: canonical修正完了');
} else {
  console.log('[2] music/index.html: 対象行なし（修正済み?）');
}

// 3. sitemap.xml
let sitemap = fs.readFileSync(SITEMAP, 'utf8');
const oldPrefix = `${BASE_URL}/test2026/`;
const newPrefix = `${BASE_URL}/`;
const count = (sitemap.match(new RegExp(oldPrefix.replace(/\//g, '\\/'), 'g')) || []).length;
if (count > 0) {
  sitemap = sitemap.split(oldPrefix).join(newPrefix);
  fs.writeFileSync(SITEMAP, sitemap, 'utf8');
  console.log(`[3] sitemap.xml: ${count}件のtest2026 URL修正完了`);
} else {
  console.log('[3] sitemap.xml: 対象なし（修正済み?）');
}

console.log('\n完了。');
