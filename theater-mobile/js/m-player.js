/* ============================================================
   TAG COCKPIT — MOBILE  /  m-player.js
   Audio engine + queue + favorites/history/trip. Tries real <audio>;
   if the source can't load (no mp3 in this prototype) it falls back
   to a simulated clock driven by track.durationSec so the whole UI
   stays alive — seek advances, tracks auto-advance, pulses fire.
   Uses the shared site favorite key plus mobile history/trip keys.
   Exposes: window.MPlayer  (on/off/emit, play/pause/next/prev/seek...)
   ============================================================ */
(function () {
  const HM = window.HMIX;
  const K = { fav: 'hmix_favorites', favLegacy: 'hmix.fav.v1', hist: 'hmix.hist.v1', trip: 'hmix.trip.v1', vol: 'hmix.vol.v1' };
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const uniq = a => Array.from(new Set((a || []).map(String).filter(Boolean)));
  const loadFav = () => uniq([].concat(load(K.fav, []), load(K.favLegacy, [])));
  const saveFav = v => { const ids = uniq(v); save(K.fav, ids); save(K.favLegacy, ids); };

  /* ---- persistent state ---- */
  let fav = loadFav();                // track ids
  let hist = load(K.hist, []);        // played track ids (newest first)
  let trip = load(K.trip, []);        // visited tag ids (newest first)
  let vol = load(K.vol, 0.8);

  /* ---- runtime state ---- */
  const audio = new Audio();
  audio.preload = 'none'; audio.crossOrigin = 'anonymous'; audio.volume = vol;
  let queue = [], qi = -1, cur = null;
  let repeat = 'off', shuffle = false;
  let playing = false;
  let pos = 0, dur = 0;          // seconds (virtual — authoritative for UI)
  let usingReal = false;          // true once real audio reports time
  let curTag = null;              // {id, jp, en, type, sceneId} of current star

  /* ---- tiny event bus ---- */
  const subs = {};
  function on(ev, fn) { (subs[ev] || (subs[ev] = [])).push(fn); return () => off(ev, fn); }
  function off(ev, fn) { if (subs[ev]) subs[ev] = subs[ev].filter(f => f !== fn); }
  function emit(ev, a) { (subs[ev] || []).forEach(f => { try { f(a); } catch (e) { console.error(e); } }); }

  /* ---- simulation clock ---- */
  let last = 0, raf = null;
  function tick(t) {
    const dt = Math.min(0.1, (t - last) / 1000 || 0.016); last = t;
    if (playing && cur) {
      if (usingReal && audio.currentTime > 0 && !audio.paused) {
        pos = audio.currentTime; if (audio.duration && isFinite(audio.duration)) dur = audio.duration;
      } else {
        pos += dt;
      }
      if (pos >= dur) { onEnded(); }
      else emit('time', { pos, dur, frac: dur ? pos / dur : 0 });
    }
    raf = requestAnimationFrame(tick);
  }
  function startClock() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  audio.addEventListener('timeupdate', () => { if (audio.currentTime > 0.15 && !audio.paused) usingReal = true; });
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('error', () => { usingReal = false; });

  function onEnded() {
    if (repeat === 'one') { seekTo(0); emit('pulse'); play(); return; }
    next(true);
  }

  /* ---- helpers ---- */
  function fmtTrackTag(tag) { curTag = tag || null; }
  function setQueue(tracks, index, tag) {
    queue = tracks.slice(); qi = clamp(index || 0, 0, queue.length - 1);
    if (tag) { fmtTrackTag(tag); pushTrip(tag.id); }
    loadIndex(qi, true);
    emit('queue', { queue, qi, tag: curTag });
  }
  function loadIndex(i, autoplay) {
    if (!queue.length) return;
    qi = (i + queue.length) % queue.length; cur = queue[qi];
    pos = 0; dur = (cur && cur.durationSec) || parseDur(cur && cur.duration) || 120; usingReal = false;
    const url = HM.trackUrl(cur);
    try { audio.src = url || ''; } catch (e) { }
    pushHist(cur.id);
    emit('change', { track: cur, qi, tag: curTag });
    emit('time', { pos, dur, frac: 0 });
    if (autoplay) play(); else setPlaying(false);
  }
  function parseDur(s) { if (!s) return 0; const m = String(s).split(':'); return m.length === 2 ? (+m[0]) * 60 + (+m[1]) : 0; }

  function setPlaying(v) { playing = v; emit('state', { playing }); if (v) startClock(); }

  function play() {
    if (!cur) return;
    setPlaying(true);
    audio.play().then(() => { }).catch(() => { /* no real audio — simulation carries the UI */ });
  }
  function pause() { setPlaying(false); try { audio.pause(); } catch (e) { } }
  function toggle() { playing ? pause() : play(); }

  function next(auto) {
    if (!queue.length) return;
    if (shuffle) { let n; do { n = Math.floor(Math.random() * queue.length); } while (queue.length > 1 && n === qi); loadIndex(n, true); return; }
    if (qi >= queue.length - 1) {
      if (repeat === 'all') loadIndex(0, true);
      else { loadIndex(queue.length - 1, false); if (auto) { pause(); seekTo(dur); } }
      return;
    }
    loadIndex(qi + 1, true);
  }
  function prev() {
    if (!queue.length) return;
    if (pos > 3) { seekTo(0); return; }
    if (qi <= 0) { loadIndex(repeat === 'all' ? queue.length - 1 : 0, true); return; }
    loadIndex(qi - 1, true);
  }
  function playAt(i) { loadIndex(i, true); }

  function seekTo(sec) { pos = clamp(sec, 0, dur); try { if (usingReal) audio.currentTime = pos; } catch (e) { } emit('time', { pos, dur, frac: dur ? pos / dur : 0 }); }
  function seekFrac(f) { seekTo(f * dur); }

  function setShuffle(v) { shuffle = v == null ? !shuffle : !!v; emit('mode', modeState()); }
  function cycleRepeat() { repeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'; emit('mode', modeState()); }
  function setVolume(v) { vol = clamp(v, 0, 1); audio.volume = vol; save(K.vol, vol); emit('vol', vol); }
  function modeState() { return { shuffle, repeat }; }

  /* ---- favorites ---- */
  function isFav(id) { return fav.includes(id); }
  function toggleFav(id) {
    id = id || (cur && cur.id); if (!id) return;
    if (fav.includes(id)) fav = fav.filter(x => x !== id); else fav = [id, ...fav];
    saveFav(fav);
    window.dispatchEvent(new CustomEvent('favorites:updated', { detail: { ids: fav } }));
    emit('fav', { fav, id });
  }
  function favTracks() { return fav.map(id => HM.TRACKS.find(t => t.id === id)).filter(Boolean); }

  /* ---- history (memory) ---- */
  function pushHist(id) { if (!id) return; hist = [id, ...hist.filter(x => x !== id)].slice(0, 40); save(K.hist, hist); emit('hist', hist); }
  function histTracks() { return hist.map(id => HM.TRACKS.find(t => t.id === id)).filter(Boolean); }

  /* ---- trip (itinerary of visited tags) ---- */
  function pushTrip(id) { if (!id) return; trip = [id, ...trip.filter(x => x !== id)].slice(0, 40); save(K.trip, trip); emit('trip', trip); }
  function tripTags() {
    const all = [...HM.TAGS_INNER, ...HM.TAGS_OUTER];
    return trip.map(id => all.find(t => t.id === id)).filter(Boolean);
  }

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  window.MPlayer = {
    on, off,
    setQueue, play, pause, toggle, next, prev, playAt, seekTo, seekFrac,
    setShuffle, cycleRepeat, setVolume,
    isFav, toggleFav, favTracks, histTracks, tripTags,
    get state() { return { cur, qi, queue, playing, pos, dur, repeat, shuffle, vol, tag: curTag }; },
    get current() { return cur; },
    get queueList() { return queue; },
    get currentTag() { return curTag; }
  };
})();
