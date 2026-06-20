/**
 * H/MIX GALLERY — SEOメタデータ静的注入スクリプト
 * tracks.js → 各 /music/*.html の <head> に title / description / OGP / JSON-LD(@graph) を注入
 *
 * 使い方: node scripts/inject-seo.js
 *
 * 2026-04 更新:
 *  - MusicRecording を @graph 化して BreadcrumbList と同居
 *  - Offer 3種（フリー/単曲¥2,200/プロジェクトパック¥7,480）を明示
 *  - audio / inAlbum / publisher / keywords / alternateName / genre / image を拡充
 *  - 共通ローダ scripts/lib/load-tracks.js に移行
 */
const fs = require('fs');
const path = require('path');
const { loadTracksData } = require('./lib/load-tracks');

const MUSIC_DIR = path.resolve(__dirname, '../music');
const SITE = 'https://www.hmix.net';
const SCENES_ABS = SITE + '/assets/images/scenes/';
const FALLBACK_SCENE = 'dark.webp';

// 存在するシーン画像の集合（ビルド時一回だけ読む）
const SCENES_DIR_LOCAL = path.resolve(__dirname, '../assets/images/scenes');
let SCENE_SET = new Set();
try {
  SCENE_SET = new Set(
    fs.readdirSync(SCENES_DIR_LOCAL).filter(f => f.endsWith('.webp'))
  );
} catch (e) { /* 画像ディレクトリ無しでも走る */ }

// 優先タグ（primaryTag 決定用）
const TAG_PRIORITY = [
  'horror', 'scary', 'japanese_horror', 'western_horror',
  'battle', 'boss', 'samurai',
  'sad', 'mysterious', 'dark', 'epic',
  'japanese', 'oriental', 'shrine',
  'fantasy', 'celtic', 'medieval',
  'happy', 'cute', 'gentle', 'peaceful',
  'festival', 'forest', 'night', 'travel',
];

function getPrimaryTag(track) {
  const all = [
    ...(track.feeling || []),
    ...(track.style   || []),
    ...(track.scene   || []),
    ...(track.story   || []),
  ];
  return TAG_PRIORITY.find(t => all.includes(t)) || all[0] || '';
}

function sceneWebp(tag) {
  const name = (tag && SCENE_SET.has(`${tag}.webp`)) ? `${tag}.webp` : FALLBACK_SCENE;
  return SCENES_ABS + name;
}

// ── duration を ISO 8601 に変換（例: "1:51" → "PT1M51S"）──
function toISO8601(dur) {
  if (!dur) return '';
  const parts = dur.split(':');
  if (parts.length === 2) return `PT${parts[0]}M${parts[1]}S`;
  if (parts.length === 3) return `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
  return '';
}

function buildKeywords(track, tagNames) {
  const tags = [
    ...(track.feeling || []),
    ...(track.style || []),
    ...(track.scene || []),
  ];
  const names = tags.map(id => tagNames[id] || id).filter(Boolean);
  return [...new Set(names)].join('・');
}

function buildGenre(track, tagNames) {
  // 日本語ラベルの genre 配列（先頭5つ）
  const tags = [
    ...(track.style   || []),
    ...(track.feeling || []),
    ...(track.scene   || []),
  ];
  const labels = tags.map(id => tagNames[id] || id).filter(Boolean);
  return [...new Set(labels)].slice(0, 5);
}

function truncate(str, n) {
  if (!str) return '';
  const clean = str.replace(/\n/g, '');
  return clean.length <= n ? clean : clean.substring(0, n) + '…';
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── MusicRecording + BreadcrumbList を @graph で構築 ──
function buildJsonLd(track, tagNames) {
  const descClean = (track.description || '').replace(/\n/g, '');
  const primary = getPrimaryTag(track);
  const imageAbs = sceneWebp(primary);
  const url  = `${SITE}/music/${track.id}.html`;
  const mp3Abs = /^https?:/i.test(track.mp3 || '') ? track.mp3 : SITE + (track.mp3 || '');

  const recording = {
    '@type': 'MusicRecording',
    '@id': `${url}#recording`,
    name: track.title,
    url,
    description: descClean,
    duration: toISO8601(track.duration),
    inLanguage: 'ja',
    genre: buildGenre(track, tagNames),
    keywords: (buildKeywords(track, tagNames) ? buildKeywords(track, tagNames) + '・' : '') + 'フリーBGM',
    image: imageAbs,
    audio: {
      '@type': 'AudioObject',
      contentUrl: mp3Abs,
      encodingFormat: 'audio/mpeg',
    },
    byArtist: {
      '@type': 'Person',
      '@id': `${SITE}/composer.html#person`,
      name: '秋山裕和',
      alternateName: 'Hirokazu Akiyama',
      url: `${SITE}/composer.html`,
    },
    inAlbum: {
      '@type': 'MusicAlbum',
      '@id': `${SITE}/#album`,
      name: 'H/MIX GALLERY',
      url: `${SITE}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'HMIX WORKS',
      url: `${SITE}/`,
    },
    offers: [
      {
        '@type': 'Offer',
        name: '無料利用（クレジット表記で可）',
        price: '0',
        priceCurrency: 'JPY',
        availability: 'https://schema.org/InStock',
        url: `${SITE}/terms.html`,
        eligibleRegion: 'World',
        category: 'free-with-attribution',
      },
      {
        '@type': 'Offer',
        name: '単曲商用ライセンス',
        price: '2200',
        priceCurrency: 'JPY',
        availability: 'https://schema.org/InStock',
        url: `${SITE}/terms.html`,
        category: 'single-track-license',
      },
      {
        '@type': 'Offer',
        name: 'プロジェクトパック（1プロジェクト内 無制限使用）',
        price: '7480',
        priceCurrency: 'JPY',
        availability: 'https://schema.org/InStock',
        url: `${SITE}/terms.html`,
        category: 'project-pack',
      },
    ],
  };

  if (track.title_en)       recording.alternateName = track.title_en;
  if (track.description_en) recording.disambiguatingDescription = track.description_en;

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',          item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Music Library', item: `${SITE}/music-library.html` },
      { '@type': 'ListItem', position: 3, name: track.title,     item: url },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [recording, breadcrumb],
  };
}

// ── メイン処理 ──
function main() {
  const { tracks, tagNames } = loadTracksData();
  let updated = 0;
  let skipped = 0;
  let ldValidationFailures = 0;

  for (const track of tracks) {
    const htmlPath = path.join(MUSIC_DIR, `${track.id}.html`);
    if (!fs.existsSync(htmlPath)) {
      skipped++;
      continue;
    }

    let html = fs.readFileSync(htmlPath, 'utf8');
    const desc = track.description || '';
    const keywords = buildKeywords(track, tagNames);
    const metaDesc = truncate(desc, 120) + (keywords ? `（${keywords}のフリーBGM）` : '');
    const ogDesc = truncate(desc, 80);
    const primary = getPrimaryTag(track);
    const imageAbs = sceneWebp(primary);

    // ── <title> 置換 ──
    html = html.replace(
      /<title[^>]*>.*?<\/title>/,
      `<title id="page-title">${esc(track.title)} — フリーBGM｜H/MIX GALLERY</title>`
    );

    // ── <meta name="description"> 置換 ──
    html = html.replace(
      /<meta\s+name="description"[^>]*>/,
      `<meta name="description" id="page-desc" content="${esc(metaDesc)}">`
    );

    // ── og:title 置換 ──
    html = html.replace(
      /<meta\s+property="og:title"[^>]*>/,
      `<meta property="og:title" id="og-title" content="${esc(track.title)} — H/MIX GALLERY">`
    );

    // ── og:description 置換 ──
    html = html.replace(
      /<meta\s+property="og:description"[^>]*>/,
      `<meta property="og:description" id="og-desc" content="${esc(ogDesc)}">`
    );

    // ── og:image 置換 / 挿入 ──
    const ogImgTag = `<meta property="og:image" content="${esc(imageAbs)}">`;
    if (/<meta\s+property="og:image"[^>]*>/.test(html)) {
      html = html.replace(/<meta\s+property="og:image"[^>]*>/, ogImgTag);
    } else {
      html = html.replace('</head>', `  ${ogImgTag}\n</head>`);
    }

    // ── og:url が未設定なら追加、あれば置換 ──
    const ogUrlTag = `<meta property="og:url" content="${SITE}/music/${track.id}.html">`;
    if (/<meta\s+property="og:url"[^>]*>/.test(html)) {
      html = html.replace(/<meta\s+property="og:url"[^>]*>/, ogUrlTag);
    } else {
      html = html.replace('</head>', `  ${ogUrlTag}\n</head>`);
    }

    // ── canonical 置換 ──
    html = html.replace(
      /<link\s+rel="canonical"[^>]*>/,
      `<link rel="canonical" id="page-canonical" href="${SITE}/music/${track.id}.html">`
    );

    // ── twitter:image 置換 / 挿入 ──
    const twImgTag = `<meta name="twitter:image" content="${esc(imageAbs)}">`;
    if (/<meta\s+name="twitter:image"[^>]*>/.test(html)) {
      html = html.replace(/<meta\s+name="twitter:image"[^>]*>/, twImgTag);
    } else {
      html = html.replace('</head>', `  ${twImgTag}\n</head>`);
    }

    // ── twitter:title / twitter:description ──
    function upsertMeta(h, attr, attrVal, content) {
      const re = new RegExp(`<meta\\s+${attr}="${attrVal}"[^>]*>`);
      const tag = `<meta ${attr}="${attrVal}" content="${esc(content)}">`;
      if (re.test(h)) return h.replace(re, tag);
      return h.replace('</head>', `  ${tag}\n</head>`);
    }
    html = upsertMeta(html, 'name', 'twitter:title', track.title + ' — H/MIX GALLERY');
    html = upsertMeta(html, 'name', 'twitter:description', truncate(desc, 100));

    // ── JSON-LD（既存分を全て削除してから @graph を1つ追加）──
    html = html.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g, '');

    const ld = buildJsonLd(track, tagNames);

    // 自己検証: JSON が壊れていないことを確認
    try { JSON.parse(JSON.stringify(ld)); }
    catch (e) {
      console.warn(`[inject-seo] LD validate failed for ${track.id}: ${e.message}`);
      ldValidationFailures++;
      continue;
    }

    const jsonLdScript = `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>\n`;
    html = html.replace('</head>', jsonLdScript + '</head>');

    fs.writeFileSync(htmlPath, html, 'utf8');
    updated++;
  }

  console.log(`[inject-seo] 完了: ${updated} 更新 / ${skipped} スキップ / ${ldValidationFailures} LD検証失敗`);
}

if (require.main === module) main();

module.exports = { buildJsonLd, getPrimaryTag, sceneWebp };
