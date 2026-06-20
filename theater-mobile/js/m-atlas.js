/* ============================================================
   TAG COCKPIT — MOBILE  /  m-atlas.js
   The star atlas: browse 58 tags in the fixed hybrid layout —
   a compact constellation band plus a searchable category list.
   Tap any tag to dive into the cockpit.
   Exposes: window.MAtlas
   ============================================================ */
(function () {
  const HM = window.HMIX;
  const RINGS = HM.TAGS_RINGS;           // [feeling, story, place]
  const RING_NAME = ['感情', '物語', '情景・様式'];
  const RING_EN = ['FEELING', 'STORY', 'SCENE · STYLE'];
  const RING_COL = ['var(--r-feel)', 'var(--r-story)', 'var(--r-place)'];
  const sceneOf = id => HM.SCENES.find(s => s.id === id) || HM.SCENES[0];
  const auraOf = id => sceneOf(id).aura.split(',').map(Number);

  // flatten with ring index
  const ALL = [];
  RINGS.forEach((tags, ri) => tags.forEach(t => ALL.push(Object.assign({ ri }, t))));

  let listEl, skyEl, fieldEl, hintEl, searchInput, searchWrap, searchBtn;
  const curMode = 'hybrid';
  let layoutDone = false;

  function init() {
    listEl = document.getElementById('atlasList');
    skyEl = document.getElementById('atlasSky');
    fieldEl = document.getElementById('skyField');
    hintEl = document.getElementById('skyHint');
    searchInput = document.getElementById('searchInput');
    searchWrap = document.getElementById('searchWrap');
    searchBtn = document.getElementById('searchToggle');

    buildList('');
    searchBtn.addEventListener('click', () => {
      const open = searchWrap.classList.toggle('open');
      searchBtn.classList.toggle('on', open);
      if (open) { setTimeout(() => searchInput.focus(), 60); }
      else { searchInput.value = ''; buildList(''); }
    });
    searchInput.addEventListener('input', () => buildList(searchInput.value.trim()));
    window.addEventListener('resize', () => { layoutDone = false; layoutSky(); }, { passive: true });

    setMode('hybrid', true);
  }

  function setMode(mode, silent) {
    document.body.dataset.atlasmode = 'hybrid';
    layoutDone = false;
    layoutSky();
    if (!silent) window.MX && window.MX.setTweak && window.MX.setTweak('atlasMode', 'hybrid');
  }


  /* ---------- LIST (also bottom of hybrid) ---------- */
  function buildList(q) {
    q = (q || '').toLowerCase();
    listEl.innerHTML = '';
    let any = false;
    RINGS.forEach((tags, ri) => {
      const matches = tags.filter(t => !q || t.jp.toLowerCase().includes(q) || (t.en || '').toLowerCase().includes(q));
      if (!matches.length) return;
      any = true;
      const sec = document.createElement('div'); sec.className = 'tag-section';
      const h = document.createElement('h2');
      h.innerHTML = `<i style="background:${RING_COL[ri]}"></i>${RING_NAME[ri]}<span class="en">${RING_EN[ri]}</span>`;
      sec.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'chip-grid';
      matches.forEach(t => {
        const c = document.createElement('button'); c.className = 'chip r' + ri; c.type = 'button';
        c.innerHTML = `<span class="jp">${t.jp}</span><span class="n">${t.count}</span>`;
        c.addEventListener('click', () => dive(t, ri));
        grid.appendChild(c);
      });
      sec.appendChild(grid); listEl.appendChild(sec);
    });
    if (!any) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = '「' + q + '」に合う星は見つかりませんでした。'; listEl.appendChild(e); }
  }

  /* ---------- SKY (constellation) ---------- */
  function layoutSky() {
    if (layoutDone) return;
    const full = curMode === 'sky';
    fieldEl.innerHTML = '';
    const W = skyEl.clientWidth || 376;
    let H;
    const set = full ? ALL : pickFeatured();
    if (full) {
      // tall scrollable star map
      const rows = Math.ceil(set.length / 3);
      H = Math.max(skyEl.clientHeight, rows * 92 + 120);
    } else {
      H = skyEl.clientHeight || 200;
    }
    fieldEl.style.height = H + 'px';
    const margin = 46, usableW = W - margin * 2, top = full ? 70 : 24, bottom = full ? 70 : 24;
    const usableH = H - top - bottom;
    const cols = 3;
    // fixed constellation slots for the compact (hybrid) band — no overlap
    const SLOTS = [[18, 26], [50, 16], [82, 30], [30, 54], [66, 52], [16, 78], [48, 82], [84, 74]];
    set.forEach((t, i) => {
      let x, y;
      if (full) {
        const r = Math.floor(i / cols), c = i % cols;
        const jx = (rand(t.id + 'x') - .5) * (usableW / cols) * 0.55;
        const jy = (rand(t.id + 'y') - .5) * 44;
        x = margin + (usableW / cols) * (c + .5) + jx;
        y = top + (usableH / Math.ceil(set.length / cols)) * (r + .5) + jy;
      } else {
        const sl = SLOTS[i % SLOTS.length];
        x = margin + (sl[0] / 100) * usableW;
        y = top + (sl[1] / 100) * usableH;
      }
      const sz = full ? (15 + rand(t.id) * 4) : 16;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'skylbl r' + t.ri;
      b.style.left = x + 'px'; b.style.top = y + 'px';
      b.innerHTML = `<span class="jp" style="font-size:${sz}px">${t.jp}</span><span class="meta">${(t.en || '').toUpperCase()} · ${t.count}</span>`;
      b.addEventListener('click', () => dive(t, t.ri));
      fieldEl.appendChild(b);
    });
    if (hintEl) hintEl.style.display = full ? '' : 'none';
    layoutDone = true;
  }
  let _featured = null;
  function pickFeatured() {
    if (_featured) return _featured;
    // one or two evocative tags from each ring
    const out = [];
    RINGS.forEach((tags, ri) => {
      const sorted = tags.slice().sort((a, b) => b.count - a.count);
      out.push(...sorted.slice(0, ri === 2 ? 4 : 2));
    });
    _featured = out.slice(0, 8);
    return _featured;
  }
  // deterministic pseudo-random from a string seed
  function rand(seed) {
    let h = 2166136261; for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    h = (h >>> 0) / 4294967295; return h;
  }

  /* ---------- dive ---------- */
  function dive(tag, ri) {
    const station = {
      id: tag.id, jp: tag.jp, en: (tag.en || tag.jp).toUpperCase(),
      ri, ringName: RING_NAME[ri], ringEn: RING_EN[ri],
      sceneId: tag.sceneId, aura: auraOf(tag.sceneId), scene: sceneOf(tag.sceneId),
      count: tag.count, tracks: HM.shuffled(HM.tracksForTag(tag))
    };
    window.MCockpit.dive(station);
  }

  window.MAtlas = { init, setMode, dive, ALL };
})();
