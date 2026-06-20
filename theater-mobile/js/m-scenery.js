/* ============================================================
   TAG COCKPIT — MOBILE  /  m-scenery.js
   "Into the scenery" — the full-bleed immersion. The scene image
   opens slowly; footprints (words left on this music) drift past
   the view; a near-invisible glass player condenses on touch.
   After 7s of stillness the UI sleeps; the scenery breathes on.
   Exposes: window.MScenery
   ============================================================ */
(function () {
  const fmt = s => { s = Math.max(0, s | 0); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); };

  /* Fallback footprints — production prefers window.HMIX_FOOTPRINTS.forTrack(trackId). */
  const FP = {
    japanese: [['鳥居をくぐると、空気が一段しずかになった。', '— 旅人'], ['祖母の家の、夏の朝を思い出す。', '— あかり'], ['この曲で神社の絵を描きました。', '— 絵描き']],
    forest: [['朝の散歩のおともに。苔のにおいまで届く。', '— みどり'], ['深呼吸したくなる一曲。', '— 通りすがり'], ['木洩れ日がそのまま音になったみたい。', '']],
    battle: [['締め切り前の戦いに、毎回これを。', '— 開発者'], ['心臓の鼓動が速くなる。最高。', '— ゲーマー'], ['ラスボス戦に使わせてもらいました。', '— 制作者']],
    farewell: [['駅で見送ったあの日を思い出して、泣いた。', '— 匿名'], ['さよならにも、こんなに優しい音がある。', '— かなで'], ['雨の窓辺で何度も聴いています。', '']],
    horror: [['夜中に聴くと本当にこわい…でも好き。', '— 肝試し'], ['影が伸びてくる気配がする。', '— 匿名'], ['ホラーゲームのBGMにぴったり。', '— 制作者']],
    festival: [['お囃子が遠くから近づいてくる感じ。', '— 祭好き'], ['縁日の夜のわくわくがよみがえる。', '— ことね'], ['気持ちが明るくなる、お守りの曲。', '']],
    night: [['星を見上げながら、ひとりで聴く。', '— 夜ふかし'], ['眠れない夜にそっと寄りそってくれる。', '— 匿名'], ['草はらに寝ころんだ気分になれた。', '— すばる']],
    fantasy: [['まだ見ぬ地平へ、踏み出す勇気をくれる。', '— 旅立つ人'], ['空をこえていく雲の上を歩くみたい。', '— つばさ'], ['冒険の始まりに、いつもこの曲を。', '— 制作者']]
  };

  let E = {}, station = null;
  let restTimer = null, condTimer = null;

  function init() {
    const $ = id => document.getElementById(id);
    E = {
      view: $('view-scenery'), img: $('sdImg'), fp: $('sdFp'), head: $('sdHead'), foot: $('sdFoot'),
      jp: $('sdJp'), en: $('sdEn'), title: $('sdTitle'), sub: $('sdSub'),
      cur: $('sdCur'), dur: $('sdDur'), bar: $('sdBar'), fill: $('sdFill'), knob: $('sdKnob'),
      prev: $('sdPrev'), play: $('sdPlay'), next: $('sdNext'), fav: $('sdFav'),
      back: $('sdBack'), atlas: $('sdAtlas')
    };
    const I = window.MX.ICONS;
    E.prev.innerHTML = I.prev; E.next.innerHTML = I.next; E.fav.innerHTML = I.heart;

    E.play.addEventListener('click', () => MPlayer.toggle());
    E.prev.addEventListener('click', () => MPlayer.prev());
    E.next.addEventListener('click', () => MPlayer.next());
    E.fav.addEventListener('click', () => { MPlayer.toggleFav(); syncFav(); });
    E.back.addEventListener('click', exitToCockpit);
    E.atlas.addEventListener('click', exitToAtlas);

    // condense glass on touch/hover of the player
    E.foot.addEventListener('pointerenter', condense);
    E.foot.addEventListener('pointerdown', condense);
    E.view.addEventListener('pointerdown', wake);

    attachSeek(E.bar, f => MPlayer.seekFrac(f));

    MPlayer.on('change', d => { if (active()) onChange(d); });
    MPlayer.on('state', d => { if (active()) E.play.innerHTML = d.playing ? window.MX.ICONS.pause : window.MX.ICONS.play; });
    MPlayer.on('time', d => { if (!active()) return; const p = (d.frac * 100).toFixed(2) + '%'; E.fill.style.width = p; E.knob.style.left = p; E.cur.textContent = fmt(d.pos); E.dur.textContent = fmt(d.dur); });
  }
  const active = () => document.body.dataset.screen === 'scenery';

  function enter(st) {
    station = st;
    document.body.dataset.screen = 'scenery';
    E.view.hidden = false;
    E.img.onload = () => fadeImg();
    E.img.src = st.scene.img;
    if (E.img.complete) fadeImg();
    E.jp.textContent = st.jp; E.en.textContent = st.en;
    document.getElementById('app').style.setProperty('--aura', st.aura.join(','));
    E.view.style.setProperty('--aura', st.aura.join(','));
    const cur = MPlayer.current;
    if (cur) { E.title.textContent = cur.title; E.sub.textContent = cur.title_en || ''; }
    E.play.innerHTML = MPlayer.state.playing ? window.MX.ICONS.pause : window.MX.ICONS.play;
    syncFav();
    startFootprints(st.sceneId);
    wake();
  }
  function onChange(d) {
    const t = d.track; if (!t) return;
    E.title.textContent = t.title; E.sub.textContent = t.title_en || '';
    syncFav(); startFootprints(station && station.sceneId);
  }
  function syncFav() { const id = MPlayer.current && MPlayer.current.id; E.fav.classList.toggle('on', id && MPlayer.isFav(id)); }

  /* rAF-driven fade so the scenery always opens, independent of CSS-transition timing */
  let fadeRaf = null;
  function fadeImg() {
    cancelAnimationFrame(fadeRaf);
    E.img.style.opacity = '0';
    const t0 = performance.now(), dur = 2600;
    const stepFade = t => {
      const k = Math.min(1, (t - t0) / dur);
      E.img.style.opacity = (0.92 * (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)).toFixed(3);
      if (k < 1 && active()) fadeRaf = requestAnimationFrame(stepFade);
    };
    fadeRaf = requestAnimationFrame(stepFade);
    // safety: if the animation timeline is paused, the image must still appear
    setTimeout(() => { if (active() && parseFloat(E.img.style.opacity || 0) < 0.05) E.img.style.opacity = '0.92'; }, 220);
  }

  function exitToCockpit() { stopFootprints(); document.body.dataset.screen = 'cockpit'; }
  function exitToAtlas() {
    stopFootprints(); document.body.dataset.screen = 'atlas';
    MStars.release();
  }

  /* ---------- rest mode ---------- */
  function wake() {
    E.view.classList.remove('rest');
    clearTimeout(restTimer);
    restTimer = setTimeout(() => { if (active()) E.view.classList.add('rest'); }, 7000);
  }
  function condense() {
    E.foot.classList.add('cond'); wake();
    clearTimeout(condTimer); condTimer = setTimeout(() => E.foot.classList.remove('cond'), 3500);
  }

  /* ---------- footprints ---------- */
  let fpTimer = null, fpIdx = 0, fpSlot = 0, fpRun = 0;
  function startFootprints(sceneId) {
    stopFootprints();
    const run = ++fpRun;
    const fallback = (FP[sceneId] || FP.fantasy).map(([text, author]) => ({ text, author: author.replace(/^—\s*/, '') }));
    renderFootprints(fallback);

    const trackId = MPlayer.current && MPlayer.current.id;
    if (!trackId || !window.HMIX_FOOTPRINTS || !window.HMIX_FOOTPRINTS.forTrack) return;
    Promise.resolve(window.HMIX_FOOTPRINTS.forTrack(trackId)).then(lines => {
      if (run !== fpRun || !active() || !Array.isArray(lines) || !lines.length) return;
      renderFootprints(lines.filter(f => f && f.text).map(f => ({ text: f.text, author: f.author || '' })));
    }).catch(() => {});
  }
  function renderFootprints(lines) {
    clearInterval(fpTimer); fpTimer = null; if (E.fp) E.fp.innerHTML = '';
    if (!lines || !lines.length) return;
    fpIdx = 0; fpSlot = 0;
    const showNext = () => {
      const data = lines[fpIdx % lines.length]; fpIdx++;
      const el = document.createElement('div'); el.className = 'fp';
      // alternate slot: top-left / bottom-right
      if (fpSlot % 2 === 0) { el.style.left = '8%'; el.style.top = (16 + Math.random() * 12) + '%'; }
      else { el.style.right = '8%'; el.style.bottom = (22 + Math.random() * 12) + '%'; el.style.textAlign = 'right'; }
      fpSlot++;
      const text = document.createElement('div');
      text.className = 'fp-text';
      text.textContent = data.text;
      el.appendChild(text);
      if (data.author) {
        const author = document.createElement('div');
        author.className = 'fp-author';
        author.textContent = '— ' + data.author;
        el.appendChild(author);
      }
      E.fp.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 2600); }, 6500);
    };
    showNext();
    fpTimer = setInterval(showNext, 7000);
  }
  function stopFootprints() { fpRun++; clearInterval(fpTimer); fpTimer = null; if (E.fp) E.fp.innerHTML = ''; }

  function attachSeek(bar, cb) {
    let dragging = false;
    const frac = e => { const r = bar.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; return Math.max(0, Math.min(1, x / r.width)); };
    bar.addEventListener('pointerdown', e => { dragging = true; condense(); cb(frac(e)); });
    window.addEventListener('pointermove', e => { if (dragging) cb(frac(e)); });
    window.addEventListener('pointerup', () => { dragging = false; });
  }

  window.MScenery = { init, enter };
})();
