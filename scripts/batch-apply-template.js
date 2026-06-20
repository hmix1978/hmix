/**
 * Step 5: 全305ページを track-detail v2 テンプレートで一括置換
 * テンプレート: music/z9-redesign.html
 * 対象: music/*.html (z9-redesign.html を除く)
 */
const fs   = require('fs');
const path = require('path');

const musicDir    = path.join(__dirname, '..', 'music');
const templatePath = path.join(musicDir, 'z9-redesign.html');

const template = fs.readFileSync(templatePath, 'utf8');

// music/*.html を列挙（z9-redesign.html 除外）
const files = fs.readdirSync(musicDir)
  .filter(f => f.endsWith('.html') && f !== 'z9-redesign.html');

console.log('対象ファイル数:', files.length);
console.log('テンプレートサイズ:', template.length, 'bytes');
console.log('');

let count = 0;
files.forEach(filename => {
  const destPath = path.join(musicDir, filename);
  fs.writeFileSync(destPath, template, 'utf8');
  count++;
});

console.log('完了: ' + count + '件を置換しました。');
console.log('');

// サンプル確認
const sample = fs.readFileSync(path.join(musicDir, 'c1.html'), 'utf8');
console.log('c1.html 確認:');
console.log('  - td2-hero:', sample.includes('td2-hero') ? '✓' : '✗');
console.log('  - track-detail.js:', sample.includes('track-detail.js') ? '✓' : '✗');
console.log('  - tracks-loader.js:', sample.includes('tracks-loader.js') ? '✓' : '✗');
console.log('  - hardcoded 暗躍:', sample.includes('暗躍') ? '✗ (残っている)' : '✓ (なし)');
console.log('  - 行数:', sample.split('\n').length);
