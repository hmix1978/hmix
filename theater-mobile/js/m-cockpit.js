/* ============================================================
   TAG COCKPIT — MOBILE  /  m-cockpit.js
   The operator deck. Dive into a tag: particles reconstruct its
   kanji, the queue auto-plays, and a transparent mini-bar expands
   into a full player sheet (now playing + manifest/fav/trip/mem).
   Plus warp-to-next-tag and the gateway into the scenery.
   Exposes: window.MCockpit
   ============================================================ */
(function () {
  const HM = window.HMIX;
  const sceneOf = id => HM.SCENES.find(s => s.id === id) || HM.SCENES[0];
  const auraOf = id => sceneOf(id).aura.split(',').map(Number);
  const RING_NAME = ['感情', '物語', '情景・様式'];
  const RING_EN = ['FEELING', 'STORY', 'SCENE · STYLE'];
  const fmt = s => { s = Math.max(0, s | 0); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); };

  let station = null, firstLoad = true, tab = 'manifest';
  let E = {};

  function init() {
    const $ = id => document.getElementById(id);
    E = {
      route: $('cpRoute'), heroCat: $('heroCat'), heroEn: $('heroEn'), heroMeta: $('heroMeta'), heroPoem: $('heroPoem'),
      warpSub: $('warpSub'), wingWarp: $('wingWarp'), wingScene: $('wingScene'),
      nbSwatch: $('nbSwatch'), nbTitle: $('nbTitle'), nbSub: $('nbSub'), nbPlay: $('nbPlay'), nbProg: $('nbProg'), nowbar: $('nowbar'),
      sheet: $('sheet'), scrim: $('sheetScrim'), handle: $('sheetHandle'),
      npSector: $('npSector'), npState: $('npState'), npTitle: $('npTitle'), npSub: $('npSub'),
      npCur: $('npCur'), npDur: $('npDur'), npBar: $('npBar'), npFill: $('npFill'), npKnob: $('npKnob'),
      btnShuffle: $('btnShuffle'), btnPrev: $('btnPrev'), btnPlay: $('btnPlay'), btnNext: $('btnNext'), btnRepeat: $('btnRepeat'), btnFav: $('btnFav'),
      tabs: $('sheetTabs'), body: $('sheetBody'), back: $('cpBack')
    };
    const I = window.MX.ICONS;
    E.btnPrev.innerHTML = I.prev; E.btnNext.innerHTML = I.next; E.btnShuffle.innerHTML = I.shuffle; E.btnRepeat.innerHTML = I.repeat; E.btnFav.innerHTML = I.heart;

    // transport
    E.btnPlay.addEventListener('click', () => MPlayer.toggle());
    E.nbPlay.addEventListener('click', e => { e.stopPropagation(); MPlayer.toggle(); });
    E.btnPrev.addEventListener('click', () => MPlayer.prev());
    E.btnNext.addEventListener('click', () => MPlayer.next());
    E.btnShuffle.addEventListener('click', () => MPlayer.setShuffle());
    E.btnRepeat.addEventListener('click', () => MPlayer.cycleRepeat());
    E.btnFav.addEventListener('click', () => MPlayer.toggleFav());

    // sheet open/close
    E.nowbar.addEventListener('click', openSheet);
    E.scrim.addEventListener('click', closeSheet);
    E.handle.addEventListener('click', closeSheet);
    attachSheetDrag();

    // tabs
    E.tabs.querySelectorAll('button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

    // wings
    E.wingWarp.addEventListener('click', warpNext);
    E.wingScene.addEventListener('click', () => station && window.MScenery.enter(station));

    // back
    E.back.addEventListener('click', backToAtlas);

    // seek
    attachSeek(E.npBar, f => MPlayer.seekFrac(f));

    // player events
    MPlayer.on('change', onChange);
    MPlayer.on('state', onState);
    MPlayer.on('time', onTime);
    MPlayer.on('mode', onMode);
    MPlayer.on('fav', () => { refreshFav(); if (tab !== 'manifest') renderTab(); });
  }

  /* ---------- dive ---------- */
  function dive(st) {
    station = st; firstLoad = true;
    document.body.dataset.screen = 'cockpit';
    document.body.dataset.cpready = '0';
    if (window.MTWEAKS.effects) MStars.reconstruct(st.jp, st.aura, 0.40);
    else MStars.setAura(st.aura);
    MStars.setAura(st.aura);
    E.route.textContent = `星図 › ${st.ringName} › ${st.jp}`;
    E.heroCat.textContent = st.ringEn + ' TAG';
    E.heroEn.textContent = st.en;
    E.heroMeta.textContent = `${st.ringEn} · ${st.tracks.length} TRACKS`;
    E.heroPoem.textContent = st.scene.line || '';
    E.wingScene.disabled = false;
    setTimeout(() => { document.body.dataset.cpready = '1'; }, 60);
    // queue
    MPlayer.setQueue(st.tracks, 0, { id: st.id, jp: st.jp, en: st.en, type: st.ringName, sceneId: st.sceneId });
    tab = 'manifest'; setTab('manifest');
    if ((window.MTWEAKS.sheetOpen || 'sheet') === 'auto') setTimeout(openSheet, 700);
    else closeSheet();
  }

  function backToAtlas() {
    closeSheet();
    document.body.dataset.screen = 'atlas';
    MStars.release();
  }

  /* ---------- warp to the next star (no return to atlas) ---------- */
  function warpNext() {
    if (!station) return;
    const ALL = window.MAtlas.ALL;
    const i = ALL.findIndex(t => t.id === station.id);
    const nt = ALL[(i + 1) % ALL.length];
    const next = stationFor(nt);
    E.warpSub.textContent = '▸ ' + next.jp + ' へ…';
    let applied = false;
    const go = () => { if (applied) return; applied = true; applyWarp(next); };
    if (window.MTWEAKS.effects) { MStars.warp(950, go); setTimeout(go, 1150); }
    else go();
  }
  function applyWarp(next) {
    station = next; firstLoad = true;
    if (window.MTWEAKS.effects) MStars.reconstruct(next.jp, next.aura, 0.40);
    MStars.setAura(next.aura);
    E.route.textContent = `星図 › ${next.ringName} › ${next.jp}`;
    E.heroCat.textContent = next.ringEn + ' TAG';
    E.heroEn.textContent = next.en; E.heroMeta.textContent = `${next.ringEn} · ${next.tracks.length} TRACKS`;
    E.heroPoem.textContent = next.scene.line || '';
    MPlayer.setQueue(next.tracks, 0, { id: next.id, jp: next.jp, en: next.en, type: next.ringName, sceneId: next.sceneId });
    setTimeout(() => { E.warpSub.textContent = '▸ 次の星へワープ'; }, 1200);
  }
  function stationFor(t) {
    return {
      id: t.id, jp: t.jp, en: (t.en || t.jp).toUpperCase(), ri: t.ri,
      ringName: RING_NAME[t.ri], ringEn: RING_EN[t.ri], sceneId: t.sceneId,
      aura: auraOf(t.sceneId), scene: sceneOf(t.sceneId), count: t.count, tracks: HM.shuffled(HM.tracksForTag(t))
    };
  }

  /* ---------- player event handlers ---------- */
  function onChange(d) {
    const t = d.track; if (!t) return;
    const idx = d.qi + 1, total = MPlayer.queueList.length;
    E.npSector.textContent = `TRACK ${String(idx).padStart(2, '0')} / ${total}`;
    E.npTitle.textContent = t.title; E.nbTitle.textContent = t.title;
    E.npSub.textContent = `${t.title_en || ''}  ·  ${station ? station.jp : ''}`;
    E.nbSub.textContent = (t.title_en || '').toUpperCase();
    refreshFav();
    if (tab === 'manifest') markPlaying();
    else renderTab();
    if (!firstLoad && window.MTWEAKS.effects) MStars.pulse();
    firstLoad = false;
  }
  function onState(d) {
    const I = window.MX.ICONS;
    E.btnPlay.innerHTML = d.playing ? I.pause : I.play;
    E.nbPlay.innerHTML = d.playing ? I.pause : I.playSm;
    E.npState.classList.toggle('playing', d.playing);
    E.npState.querySelector('.txt').textContent = d.playing ? 'NOW PLAYING' : (MPlayer.current ? 'PAUSED' : 'STANDBY');
  }
  function onTime(d) {
    const pct = (d.frac * 100).toFixed(2) + '%';
    E.npFill.style.width = pct; E.npKnob.style.left = pct; E.nbProg.style.width = pct;
    E.npCur.textContent = fmt(d.pos); E.npDur.textContent = fmt(d.dur);
  }
  function onMode(m) {
    E.btnShuffle.classList.toggle('on', m.shuffle);
    E.btnRepeat.classList.toggle('on', m.repeat !== 'off');
    const I = window.MX.ICONS;
    E.btnRepeat.innerHTML = m.repeat === 'one' ? I.repeat + '<span class="repeat-one">1</span>' : I.repeat;
  }
  function refreshFav() {
    const id = MPlayer.current && MPlayer.current.id;
    E.btnFav.classList.toggle('on', id && MPlayer.isFav(id));
  }

  /* ---------- sheet ---------- */
  function openSheet() { document.body.dataset.sheet = '1'; }
  function closeSheet() { document.body.dataset.sheet = '0'; }
  function attachSheetDrag() {
    let sy = 0, dy = 0, drag = false;
    const start = e => { drag = true; sy = (e.touches ? e.touches[0].clientY : e.clientY); dy = 0; E.sheet.style.transition = 'none'; };
    const move = e => {
      if (!drag) return; const y = (e.touches ? e.touches[0].clientY : e.clientY); dy = Math.max(0, y - sy);
      E.sheet.style.transform = `translateY(${dy}px)`;
    };
    const end = () => { if (!drag) return; drag = false; E.sheet.style.transition = ''; E.sheet.style.transform = ''; if (dy > 110) closeSheet(); };
    E.handle.addEventListener('touchstart', start, { passive: true }); E.handle.addEventListener('mousedown', start);
    window.addEventListener('touchmove', move, { passive: true }); window.addEventListener('mousemove', move);
    window.addEventListener('touchend', end); window.addEventListener('mouseup', end);
  }

  /* ---------- tabs ---------- */
  function setTab(t) { tab = t; E.tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t))); renderTab(); }
  function renderTab() {
    const I = window.MX.ICONS;
    E.body.innerHTML = '';
    if (tab === 'manifest') {
      const list = MPlayer.queueList;
      if (!list.length) return empty('この星にはまだ曲がありません。');
      head('MANIFEST · この星のうた', list.length + ' TRACKS');
      list.forEach((t, i) => E.body.appendChild(trackRow(t, i, true)));
      markPlaying();
    } else if (tab === 'fav') {
      const list = MPlayer.favTracks();
      if (!list.length) return empty('まだお気に入りはありません。♡ を押して\nこの旅の一曲を残そう。');
      head('FAVORITES · お気に入り', list.length + ' TRACKS');
      list.forEach((t, i) => E.body.appendChild(trackRow(t, i, false)));
    } else if (tab === 'mem') {
      const list = MPlayer.histTracks();
      if (!list.length) return empty('まだ旅の記憶はありません。');
      head('MEMORY · 旅の記憶', list.length + ' TRACKS');
      list.forEach((t, i) => E.body.appendChild(trackRow(t, i, false)));
    } else if (tab === 'trip') {
      const tags = MPlayer.tripTags();
      if (!tags.length) return empty('まだ旅のしおりはありません。\nタグを選ぶと、ここに足あとが残ります。');
      head('ITINERARY · 旅のしおり', tags.length + ' STARS');
      tags.forEach(tg => E.body.appendChild(tagRow(tg)));
    }
  }
  function head(l, r) { const d = document.createElement('div'); d.className = 'list-head'; d.innerHTML = `<span>${l}</span><span>${r || ''}</span>`; E.body.appendChild(d); }
  function empty(txt) { const d = document.createElement('div'); d.className = 'empty'; d.style.whiteSpace = 'pre-line'; d.textContent = txt; E.body.appendChild(d); }
  function trackRow(t, i, isQueue) {
    const I = window.MX.ICONS;
    const row = document.createElement('div'); row.className = 'row'; row.dataset.tid = t.id;
    row.innerHTML = `<span class="r-idx">${String(i + 1).padStart(2, '0')}</span>` +
      `<span class="r-eq"><i></i><i></i><i></i></span>` +
      `<div class="r-main"><div class="r-title">${t.title}</div><div class="r-meta">${t.title_en || ''} · ${t.duration || ''}</div></div>` +
      `<button class="r-fav ${MPlayer.isFav(t.id) ? 'on' : ''}" type="button">${I.heart}</button>`;
    row.querySelector('.r-main').addEventListener('click', () => {
      if (isQueue) MPlayer.playAt(i);
      else { MPlayer.setQueue([t], 0, MPlayer.currentTag || (station && { id: station.id, jp: station.jp })); }
    });
    row.querySelector('.r-fav').addEventListener('click', e => { e.stopPropagation(); MPlayer.toggleFav(t.id); row.querySelector('.r-fav').classList.toggle('on'); });
    return row;
  }
  function tagRow(tg) {
    const ri = HM.TAGS_INNER.includes(tg) ? (HM.SCENES, tg.type) : tg.type;
    const aura = auraOf(tg.sceneId);
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = `<span class="r-chip" style="background:rgb(${aura.join(',')})"></span>` +
      `<div class="r-main"><div class="r-title">${tg.jp}</div><div class="r-meta">${(tg.en || '').toUpperCase()} · ${tg.count || ''}曲</div></div>` +
      `<span class="r-idx">▸</span>`;
    row.addEventListener('click', () => { closeSheet(); window.MAtlas.dive(tg, tg.ri != null ? tg.ri : 0); });
    return row;
  }
  function markPlaying() {
    const id = MPlayer.current && MPlayer.current.id;
    E.body.querySelectorAll('.row').forEach(r => r.classList.toggle('playing', r.dataset.tid === id));
  }

  /* ---------- seek interaction ---------- */
  function attachSeek(bar, cb) {
    let dragging = false;
    const frac = e => { const r = bar.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; return Math.max(0, Math.min(1, x / r.width)); };
    const down = e => { dragging = true; bar.classList.add('active'); cb(frac(e)); };
    const move = e => { if (dragging) cb(frac(e)); };
    const up = () => { dragging = false; bar.classList.remove('active'); };
    bar.addEventListener('mousedown', down); bar.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('mousemove', move); window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', up); window.addEventListener('touchend', up);
  }

  window.MCockpit = { init, dive, get station() { return station; } };
})();
