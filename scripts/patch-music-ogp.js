/**
 * 全305 music/*.html に静的OGPフォールバックを追加
 * - og:locale (static: ja_JP)
 * - og:image (static: japanese.webp — JS が上書きする前の fallback)
 * - twitter:card, twitter:site, twitter:image (static fallback)
 * Twitter/OGP クローラーは JS を実行しないため、静的タグが必要
 */
const fs   = require('fs');
const path = require('path');
const dir  = 'C:/Users/hiro/projects/hmix/music';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

// 挿入するタグブロック（og:description の直後に挿入）
const OGP_PATCH = `  <meta property="og:image" content="https://www.hmix.net/assets/images/scenes/japanese.webp">
  <meta property="og:locale" content="ja_JP">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@hmix_net">
  <meta name="twitter:image" content="https://www.hmix.net/assets/images/scenes/japanese.webp">`;

let count = 0;
files.forEach(filename => {
  const fp = path.join(dir, filename);
  let c = fs.readFileSync(fp, 'utf8');

  // 既に適用済みならスキップ
  if (c.includes('twitter:card')) { return; }

  // <link rel="canonical" の直前に挿入
  const target = '  <link rel="canonical"';
  const idx = c.indexOf(target);
  if (idx === -1) {
    console.warn('canonical 未発見:', filename);
    return;
  }

  c = c.slice(0, idx) + OGP_PATCH + '\n' + c.slice(idx);
  fs.writeFileSync(fp, c, 'utf8');
  count++;
});

console.log('更新:', count, '件');

// 確認
const sample = fs.readFileSync(path.join(dir, 'c1.html'), 'utf8');
console.log('og:image:', sample.includes('og:image') ? '✓' : '✗');
console.log('twitter:card:', sample.includes('twitter:card') ? '✓' : '✗');
