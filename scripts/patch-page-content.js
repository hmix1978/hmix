/**
 * 全305ページに id="page-content" ラッパーを追加
 * hero + main + footer を囲む → PJAXが部分スワップできるようになる
 */
const fs   = require('fs');
const path = require('path');
const dir  = 'C:/Users/hiro/projects/hmix/music';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const OPEN  = '\n  <div id="page-content" data-page-type="track-detail">\n';
const CLOSE = '\n  </div><!-- /#page-content -->\n\n';

let count = 0;
files.forEach(filename => {
  const fp = path.join(dir, filename);
  let c = fs.readFileSync(fp, 'utf8');

  // 既に適用済みならスキップ
  if (c.includes('id="page-content"')) { return; }

  // <section class="td2-hero"> の直前に開きタグ挿入
  c = c.replace(
    '\n  <!-- ===== HERO',
    OPEN + '  <!-- ===== HERO'
  );

  // </footer> の直後（global-player の直前）に閉じタグ挿入
  c = c.replace(
    '\n\n  <!-- ===== GLOBAL PLAYER',
    CLOSE + '  <!-- ===== GLOBAL PLAYER'
  );

  fs.writeFileSync(fp, c, 'utf8');
  count++;
});

console.log('更新:', count, '件');

// 確認
const sample = fs.readFileSync(path.join(dir, 'c1.html'), 'utf8');
console.log('page-content wrapper:', sample.includes('id="page-content"') ? '✓' : '✗');
console.log('data-page-type:', sample.includes('data-page-type="track-detail"') ? '✓' : '✗');

// 構造確認
const lines = sample.split('\n');
const pcLine = lines.findIndex(l => l.includes('id="page-content"'));
const closeLine = lines.findIndex(l => l.includes('/#page-content'));
const playerLine = lines.findIndex(l => l.includes('GLOBAL PLAYER'));
console.log('page-content open: line', pcLine + 1);
console.log('page-content close: line', closeLine + 1);
console.log('global-player: line', playerLine + 1);
