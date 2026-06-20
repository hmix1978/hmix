/**
 * H/MIX GALLERY — build-library-static-links.js
 * music-library.html の JS グリッド内に、初回HTMLで読める代表曲リンクを焼き込む。
 * music-library.js は初期化時に #ml-grid を空にして再描画するため、通常体験は変えない。
 */
const fs = require('fs');
const path = require('path');
const { loadTracksData } = require('./lib/load-tracks');

const ROOT = path.resolve(__dirname, '..');
const LIBRARY_HTML = path.join(ROOT, 'music-library.html');
const LIMIT = 36;
const PREFIX_ORDER = ['n', 'c', 'k', 'z', 'v', 'r', 'o', 'f', 'd', 'm'];

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sortTracksNewFirst(arr) {
  return arr.slice().sort((a, b) => {
    const ma = String(a.id || '').match(/^([a-z]+)(\d+)$/);
    const mb = String(b.id || '').match(/^([a-z]+)(\d+)$/);
    if (!ma || !mb) return 0;
    const pa = PREFIX_ORDER.indexOf(ma[1]);
    const pb = PREFIX_ORDER.indexOf(mb[1]);
    const orderA = pa < 0 ? 99 : pa;
    const orderB = pb < 0 ? 99 : pb;
    if (orderA !== orderB) return orderA - orderB;
    return parseInt(mb[2], 10) - parseInt(ma[2], 10);
  });
}

function tagLabel(id, tagNames) {
  return tagNames[id] || id;
}

function excerpt(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > 96 ? clean.slice(0, 96) + '...' : clean;
}

function buildCard(track, tagNames) {
  const tags = []
    .concat(track.feeling || [], track.style || [], track.scene || [], track.story || [])
    .slice(0, 4);
  const tagHtml = tags.map(t => `<span class="ml-static-tag">${esc(tagLabel(t, tagNames))}</span>`).join('');
  return `    <article class="ml-static-card" role="listitem" data-track-id="${esc(track.id)}">
      <a class="ml-static-card__link" href="/music/${esc(track.id)}.html">
        <span class="ml-static-card__title">${esc(track.title || track.id)}</span>
        <span class="ml-static-card__meta">${esc(track.title_en || '')}${track.duration ? ` / ${esc(track.duration)}` : ''}</span>
        <span class="ml-static-card__desc">${esc(excerpt(track.description))}</span>
        <span class="ml-static-card__tags">${tagHtml}</span>
      </a>
    </article>`;
}

function buildStaticBlock(tracks, tagNames) {
  const cards = sortTracksNewFirst(tracks).slice(0, LIMIT).map(t => buildCard(t, tagNames)).join('\n');
  return `\n    <!-- Static fallback links for crawlers and no-JS visitors. Replaced by music-library.js on load. -->\n${cards}\n  `;
}

function main() {
  const { tracks, tagNames } = loadTracksData();
  const html = fs.readFileSync(LIBRARY_HTML, 'utf8');
  const block = buildStaticBlock(tracks, tagNames);
  const re = /(<div class="ml-grid" id="ml-grid" role="list" aria-label="楽曲一覧">)([\s\S]*?)(<\/div>)/;
  if (!re.test(html)) {
    throw new Error('[build-library-static-links] #ml-grid not found');
  }
  const next = html.replace(re, `$1${block}$3`);
  fs.writeFileSync(LIBRARY_HTML, next, 'utf8');
  console.log(`[build-library-static-links] inserted ${Math.min(LIMIT, tracks.length)} static links into music-library.html`);
}

if (require.main === module) main();
