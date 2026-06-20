/**
 * Phase 1 クリーンアップスクリプト
 * 1. console.log 除去 (music-library.js, player.js, app.js, router.js)
 * 2. /test2026/ パスチェック除去 (tracks.js, tracks-loader.js)
 */
const fs = require('fs');
const path = require('path');
const BASE = 'C:/Users/hiro/projects/hmix';

// ── 1. console.log 除去 ──────────────────────────────────────────────────────
// 行単位で削除（すべて単行の console.log(...)）
const LOG_FILES = [
  'assets/js/music-library.js',
  'assets/js/player.js',
  'assets/js/app.js',
  'assets/js/router.js',
  'assets/js/track-detail.js',
];

let totalRemoved = 0;

LOG_FILES.forEach(rel => {
  const fp = path.join(BASE, rel);
  if (!fs.existsSync(fp)) { console.log('SKIP (not found):', rel); return; }

  const lines = fs.readFileSync(fp, 'utf8').split('\n');
  const filtered = lines.filter(line => {
    // console.log( を含む行を除去
    return !line.match(/^\s*console\.log\s*\(/);
  });

  const removed = lines.length - filtered.length;
  if (removed > 0) {
    fs.writeFileSync(fp, filtered.join('\n'), 'utf8');
    console.log(`✓ ${rel}: ${removed} 行削除`);
    totalRemoved += removed;
  } else {
    console.log(`  ${rel}: 変更なし`);
  }
});

console.log(`\nconsole.log 合計削除: ${totalRemoved} 行\n`);

// ── 2. /test2026/ パスチェック除去 ────────────────────────────────────────────
// tracks.js: HMIX_BASE_PATH の if分岐から test2026 行を削除し、常に '' を返す
const tracksPath = path.join(BASE, 'assets/js/tracks.js');
let tracksContent = fs.readFileSync(tracksPath, 'utf8');

const tracksOld = `const HMIX_BASE_PATH = (function() {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/test2026/') || window.location.pathname === '/test2026') return '/test2026';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return '';
  }
  return '';
})();`;

const tracksNew = `const HMIX_BASE_PATH = '';`;

if (tracksContent.includes("startsWith('/test2026/')")) {
  tracksContent = tracksContent.replace(tracksOld, tracksNew);
  fs.writeFileSync(tracksPath, tracksContent, 'utf8');
  console.log('✓ tracks.js: /test2026/ チェック除去');
} else {
  console.log('  tracks.js: 既に除去済み');
}

// tracks-loader.js: test2026 チェックのある basePath 関数を修正
const loaderPath = path.join(BASE, 'assets/js/tracks-loader.js');
if (fs.existsSync(loaderPath)) {
  let loaderContent = fs.readFileSync(loaderPath, 'utf8');
  // test2026 を含む行を除去
  const loaderLines = loaderContent.split('\n');
  const loaderFiltered = loaderLines.filter(l => !l.includes('/test2026'));
  const loaderRemoved = loaderLines.length - loaderFiltered.length;
  if (loaderRemoved > 0) {
    fs.writeFileSync(loaderPath, loaderFiltered.join('\n'), 'utf8');
    console.log(`✓ tracks-loader.js: /test2026/ チェック ${loaderRemoved} 行除去`);
  } else {
    console.log('  tracks-loader.js: 既に除去済み');
  }
} else {
  console.log('  tracks-loader.js: ファイルなし');
}

console.log('\n✅ Phase 1 JS クリーンアップ完了');
