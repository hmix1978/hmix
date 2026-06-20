/**
 * z9-redesign.html を汎用テンプレートに変換するスクリプト
 * Step 4: HTML テンプレート化
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'music', 'z9-redesign.html');
let c = fs.readFileSync(filePath, 'utf8');

// 1. <head> メタタグ更新
c = c.replace(
  '<title>暗躍 — H/MIX GALLERY</title>\n  <meta name="description" content="日常に怪異が忍び寄る — H/MIX GALLERYの無料BGM">',
  [
    '<title id="page-title">楽曲詳細 — H/MIX GALLERY</title>',
    '  <meta name="description" id="page-desc" content="H/MIX GALLERY の楽曲詳細ページ">',
    '  <meta name="robots" content="index, follow">',
    '  <meta property="og:type" content="music.song">',
    '  <meta property="og:site_name" content="H/MIX GALLERY">',
    '  <meta property="og:title" id="og-title" content="楽曲詳細 — H/MIX GALLERY">',
    '  <meta property="og:description" id="og-desc" content="">',
    '  <link rel="canonical" id="page-canonical" href="https://www.hmix.net/music/">',
  ].join('\n')
);

// 2. ブレッドクラム末尾: 暗躍テキスト → span with id
c = c.replace(
  '<span>/</span>暗躍\n        </nav>',
  '<span>/</span><span id="td2-breadcrumb-title"></span>\n        </nav>'
);

// 3. ヒーローID badge → id追加 & 空に
c = c.replace(
  '<div class="td2-hero__id td2-fade-in td2-fade-in--d1">Z9</div>',
  '<div class="td2-hero__id td2-fade-in td2-fade-in--d1" id="td2-hero-id"></div>'
);

// 4. ヒーロータイトル → id追加 & 空に
c = c.replace(
  '<h1 class="td2-hero__title td2-fade-in td2-fade-in--d2">暗躍</h1>',
  '<h1 class="td2-hero__title td2-fade-in td2-fade-in--d2" id="td2-hero-title"></h1>'
);

// 5. ヒーロー説明 → id追加 & 空に
c = c.replace(
  '<p class="td2-hero__desc td2-fade-in td2-fade-in--d3">日常に怪異が忍び寄る</p>',
  '<p class="td2-hero__desc td2-fade-in td2-fade-in--d3" id="td2-hero-desc"></p>'
);

// 6. タグ Feeling グループ → data-cat & クリア
c = c.replace(
  `<div class="td2-tag-group">
          <span class="td2-tag-group__label">Feeling</span>
          <div class="td2-tag-group__list">
            <a class="td2-tag td2-tag--feeling" href="../music-library.html?feeling=horror">ホラー</a>
            <a class="td2-tag td2-tag--feeling" href="../music-library.html?feeling=dark">暗い</a>
            <a class="td2-tag td2-tag--feeling" href="../music-library.html?feeling=suspense">緊迫</a>
          </div>
        </div>`,
  `<div class="td2-tag-group" data-cat="feeling">
          <span class="td2-tag-group__label">Feeling</span>
          <div class="td2-tag-group__list"></div>
        </div>`
);

// 6b. タグ Style グループ → data-cat & クリア
c = c.replace(
  `<div class="td2-tag-group">
          <span class="td2-tag-group__label">Style</span>
          <div class="td2-tag-group__list">
            <a class="td2-tag td2-tag--style" href="../music-library.html?style=fantasy">ファンタジー</a>
          </div>
        </div>`,
  `<div class="td2-tag-group" data-cat="style">
          <span class="td2-tag-group__label">Style</span>
          <div class="td2-tag-group__list"></div>
        </div>`
);

// 6c. Story グループの前に Scene グループを挿入 & Story に data-cat & クリア
c = c.replace(
  `<div class="td2-tag-group">
          <span class="td2-tag-group__label">Story</span>
          <div class="td2-tag-group__list">
            <a class="td2-tag td2-tag--story" href="../music-library.html?story=conspiracy">陰謀</a>
          </div>
        </div>`,
  `<div class="td2-tag-group" data-cat="scene">
          <span class="td2-tag-group__label">Scene</span>
          <div class="td2-tag-group__list"></div>
        </div>
        <div class="td2-tag-group" data-cat="story">
          <span class="td2-tag-group__label">Story</span>
          <div class="td2-tag-group__list"></div>
        </div>`
);

// 7. ダウンロードリンク: id追加 & href動的化
c = c.replace(
  '<a class="td2-download" href="/music/z/z9.mp3" download="z9.mp3">',
  '<a class="td2-download" id="td2-download-btn" href="#">'
);

// 8. Related Tracks セクション: id追加
c = c.replace(
  '<!-- ── Related Tracks ── -->\n      <section class="td2-related">',
  '<!-- ── Related Tracks ── -->\n      <section class="td2-related" id="track-related">'
);

// 9. Related グリッド: id追加 & ハードコードカード削除
c = c.replace(
  /<div class="td2-related__grid">[\s\S]*?<\/div>\n      <\/section>/,
  '<div class="td2-related__grid" id="track-related-grid"></div>\n      </section>'
);

// 10. インラインスクリプトブロック削除 & track-detail.js 追加
c = c.replace(
  /\n\n  <script>\n    \/\/ Header scroll[\s\S]*?<\/script>/,
  ''
);

// track-detail.js を fav-modal.js の後に追加
c = c.replace(
  '  <script src="../assets/js/fav-modal.js"></script>',
  '  <script src="../assets/js/fav-modal.js"></script>\n  <script src="../assets/js/track-detail.js"></script>'
);

fs.writeFileSync(filePath, c, 'utf8');
console.log('Done. Total lines:', c.split('\n').length);
console.log('');
// Verify key replacements
const checks = [
  ['id="page-title"', 'meta page-title'],
  ['id="td2-hero-id"', 'hero id badge'],
  ['id="td2-hero-title"', 'hero title'],
  ['id="td2-hero-desc"', 'hero desc'],
  ['id="td2-breadcrumb-title"', 'breadcrumb title'],
  ['data-cat="feeling"', 'feeling group'],
  ['data-cat="style"', 'style group'],
  ['data-cat="scene"', 'scene group'],
  ['data-cat="story"', 'story group'],
  ['id="td2-download-btn"', 'download btn'],
  ['id="track-related"', 'related section'],
  ['id="track-related-grid"', 'related grid'],
  ['track-detail.js', 'track-detail.js script'],
];
checks.forEach(([needle, label]) => {
  const found = c.includes(needle);
  console.log((found ? '✓' : '✗') + ' ' + label);
});
