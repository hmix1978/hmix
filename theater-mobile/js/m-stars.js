/* ============================================================
   TAG COCKPIT — MOBILE  /  m-stars.js
   Self-contained particle "windshield": a living starfield that
   can reconstruct a tag's kanji from drifting particles, emit
   living sparks + a lock burst, pulse on track change and warp
   between stars. Sized to its container (the phone screen), so it
   works inside a device frame. Faithful port of the desktop
   journey-tag.js feel, retuned for a portrait viewport.
   Exposes: window.MStars
   ============================================================ */
(function () {
  const TAU = Math.PI * 2;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const css = a => `${a[0] | 0},${a[1] | 0},${a[2] | 0}`;

  const GOLD = [216, 180, 106], DEEP = [14, 13, 20];

  let canvas, ctx, host;
  let W = 0, H = 0, cx = 0, cy = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // particle field
  let P = [], COUNT = 1400;
  const ZFAR = 1400, FOCAL = 460, SPREAD = 2400;

  // kanji target points
  let glyphPts = null;
  let fontsReady = false;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fontsReady = true; });

  // dynamic state
  let mode = 'field';         // field | reconstruct | warp
  let asmTarget = 0, asm = 0;  // assembly amount (0..1)
  let aura = DEEP.slice(), auraTarget = DEEP.slice();
  let travel = 0, swirl = 0, vel = 0;
  let glowFlare = 0, flash = 0;
  let warpTimer = 0, warpDur = 0, warpCb = null;
  let kcyFactor = 0.40;        // kanji vertical center as fraction of H

  let burst = [], sparks = [], shoots = [], nextShoot = 0;

  function resize() {
    if (!host) return;
    W = host.clientWidth; H = host.clientHeight; cx = W / 2; cy = H / 2;
    canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const want = reduce ? 900 : Math.min(1900, Math.round(W * H / 520));
    if (Math.abs(want - COUNT) > 200 || !P.length) { COUNT = want; build(); }
  }

  function build() {
    P = new Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      P[i] = {
        x: rnd(-SPREAD, SPREAD), y: rnd(-SPREAD, SPREAD), z: rnd(1, ZFAR),
        tw: rnd(0, TAU), tws: rnd(.6, 2.2), bs: rnd(.7, 1.9), px: 0, py: 0, has: false
      };
    }
  }

  /* ---- sample a word into normalized [-1,1] points ---- */
  function sampleWord(text) {
    const S = 240, oc = document.createElement('canvas'); oc.width = oc.height = S;
    const o = oc.getContext('2d');
    o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
    const chars = [...text];
    if (chars.length <= 1) { o.font = '600 ' + Math.round(S * 0.52) + 'px "Noto Serif JP",serif'; o.fillText(text, S / 2, S / 2); }
    else if (chars.length === 2) { o.font = '600 ' + Math.round(S * 0.46) + 'px "Noto Serif JP",serif'; o.fillText(chars[0], S * 0.29, S / 2); o.fillText(chars[1], S * 0.71, S / 2); }
    else { let fs = Math.round(S * 0.92 / chars.length); fs = clamp(fs, 22, Math.round(S * 0.32)); o.font = '600 ' + fs + 'px "Noto Serif JP",serif'; o.fillText(text, S / 2, S / 2); }
    const data = o.getImageData(0, 0, S, S).data, pts = []; const step = 3;
    for (let y = 0; y < S; y += step)for (let x = 0; x < S; x += step) { if (data[(y * S + x) * 4 + 3] > 128) pts.push([(x / S) * 2 - 1, (y / S) * 2 - 1]); }
    for (let i = pts.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[pts[i], pts[j]] = [pts[j], pts[i]]; }
    return pts.slice(0, 720);
  }
  let pendingWord = null;
  function ensureGlyph() {
    if (pendingWord && fontsReady) { glyphPts = sampleWord(pendingWord); pendingWord = null; }
  }

  /* ============================================================ public API */
  const API = {
    init(canvasEl, hostEl) {
      canvas = canvasEl; host = hostEl || canvasEl.parentElement; ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', () => resize(), { passive: true });
      document.addEventListener('visibilitychange', start);
      start();
      return API;
    },
    resize,
    setAura(rgb) { auraTarget = (rgb && rgb.length === 3) ? rgb.slice() : DEEP.slice(); },
    field() { mode = 'field'; asmTarget = 0; auraTarget = DEEP.slice(); },
    /* reconstruct a kanji word, tinted by aura rgb */
    reconstruct(word, rgb, kcy) {
      pendingWord = word; glyphPts = null; ensureGlyph();
      if (rgb) auraTarget = rgb.slice();
      if (typeof kcy === 'number') kcyFactor = kcy;
      mode = 'reconstruct'; asmTarget = 1; vel = Math.max(vel, 0.9);
    },
    release() { asmTarget = 0; mode = 'field'; },
    pulse() {
      if (mode !== 'reconstruct') return;
      glowFlare = 1;
      if (!reduce) { fireBurst(); flash = Math.max(flash, 0.24); }
    },
    /* warp to next: scatter, overdrive tunnel, callback at peak */
    warp(ms, cb) { warpDur = (ms || 900) / 1000; warpTimer = 0; warpCb = cb || null; mode = 'warp'; },
    setKanjiCenter(f) { kcyFactor = f; },
    isReduced() { return reduce; }
  };
  window.MStars = API;

  /* ============================================================ loop */
  let raf = null, last = 0;
  function start() { if (raf) { cancelAnimationFrame(raf); clearTimeout(raf); } last = performance.now(); if (document.hidden) tickHidden(); else raf = requestAnimationFrame(tickRAF); }
  function tickRAF(t) { step(t); raf = requestAnimationFrame(tickRAF); }
  function tickHidden() { step(performance.now()); raf = setTimeout(tickHidden, 40); }

  function step(t) {
    try {
      const dt = Math.max(0, Math.min(.05, (t - last) / 1000 || .016)); last = t;
      ensureGlyph();
      if (mode === 'reconstruct') {
        asm = lerp(asm, glyphPts ? asmTarget : 0, Math.min(1, dt * 3.4));
        vel = lerp(vel, 0, Math.min(1, dt * 3));
      } else if (mode === 'warp') {
        warpTimer += dt;
        asm = Math.max(0, asm - dt * 2.6);
        vel = Math.min(2.6, vel + dt * 5);
        if (warpTimer >= warpDur * 0.6 && warpCb) { const c = warpCb; warpCb = null; flash = 1; c(); }
        if (warpTimer >= warpDur) { mode = (asmTarget > 0 ? 'reconstruct' : 'field'); }
      } else {
        asm = lerp(asm, 0, Math.min(1, dt * 3)); vel = lerp(vel, 0, Math.min(1, dt * 3));
      }
      const idle = reduce ? 14 : 24;
      travel += (idle + Math.min(1, vel * 2.4) * 760 + Math.max(0, vel - 1.1) * 720) * dt;
      swirl += (0.05 + Math.min(1, vel * 2) * 0.5) * dt;
      draw(t, dt);
    } catch (e) { if (!step._l) { step._l = 1; console.error('MStars:', e); } }
  }

  function draw(t, dt) {
    aura = mix(aura, auraTarget, Math.min(1, dt * 2.6));
    const A = aura, aCss = css(A);
    host && host.style.setProperty('--aura', aCss);

    ctx.clearRect(0, 0, W, H);
    let bg = ctx.createRadialGradient(cx, cy * 0.9, 0, cx, cy, Math.max(W, H) * 0.85);
    bg.addColorStop(0, `rgba(${aCss},0.11)`);
    bg.addColorStop(0.5, `rgba(${A[0] * .4 | 0},${A[1] * .4 | 0},${A[2] * .5 | 0},0.05)`);
    bg.addColorStop(1, 'rgba(4,3,7,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const useAsm = glyphPts ? easeIO(clamp(asm, 0, 1)) : 0;
    const ambient = 1 - useAsm * 0.78;
    const box = Math.min(W, H) * 0.50;
    const kcx = cx, kcy = H * kcyFactor;
    const cosR = Math.cos(swirl), sinR = Math.sin(swirl);
    const warp = Math.min(1, vel * 2.4);

    if (useAsm > 0.04) drawConstellation(t, kcx, kcy, box, useAsm, aCss);

    for (let i = 0; i < COUNT; i++) {
      const p = P[i];
      let z = p.z - (travel % ZFAR); if (z <= 1) z += ZFAR;
      const s = FOCAL / z;
      const rx = p.x * cosR - p.y * sinR, ry = p.x * sinR + p.y * cosR;
      let sx = cx + rx * s, sy = cy + ry * s;
      const depth = 1 - z / ZFAR, size = clamp(p.bs * s * 2.0, 0.25, 3.6);
      let dX = sx, dY = sy, dS = size, bright, col, assembled = false;
      const recruit = useAsm > 0 && (i % 5 !== 0) && glyphPts && (i < glyphPts.length * 5);
      if (recruit) {
        const tp = glyphPts[i % glyphPts.length];
        const tx = kcx + tp[0] * box * 0.5, ty = kcy + tp[1] * box * 0.5;
        const k = useAsm;
        dX = lerp(sx, tx, k); dY = lerp(sy, ty, k); dS = lerp(size, 1.6 + glowFlare * 1.4, k); assembled = k > 0.5;
        col = mix([255, 255, 255], A, 0.35 * k);
        if (glowFlare > 0.01) col = mix(col, [255, 255, 255], glowFlare * 0.65);
        bright = clamp(0.25 + depth * 0.5, 0, 1) * (1 - useAsm) + (0.55 + 0.45 * Math.sin(t * 0.004 + p.tw)) * useAsm;
        bright = clamp(bright + glowFlare * 0.55 * useAsm, 0, 1);
      } else {
        col = mix([214, 224, 255], A, 0.18);
        bright = clamp((0.22 + depth * 0.8), 0, 1) * ambient * (0.65 + 0.35 * Math.sin(t * 0.001 * p.tws + p.tw));
      }
      if (bright <= 0.01) { p.px = dX; p.py = dY; continue; }
      if (!assembled && warp > 0.15 && depth > 0.35 && p.has) {
        ctx.strokeStyle = `rgba(${css(col)},${(bright * warp * 0.7).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.5, dS * 0.8); ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(dX, dY); ctx.stroke();
      }
      ctx.fillStyle = `rgba(${css(col)},${bright.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(dX, dY, dS, 0, TAU); ctx.fill();
      if (assembled && dS > 1.4) { ctx.fillStyle = `rgba(${aCss},${(bright * (0.25 + glowFlare * 0.45)).toFixed(3)})`; ctx.beginPath(); ctx.arc(dX, dY, dS * 2.6, 0, TAU); ctx.fill(); }
      p.px = dX; p.py = dY; p.has = true;
    }

    if (useAsm > 0.05) {
      const g = ctx.createRadialGradient(kcx, kcy, 0, kcx, kcy, box * 0.95);
      g.addColorStop(0, `rgba(${aCss},${((0.14 + glowFlare * 0.22) * useAsm).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(kcx, kcy, box * 0.95, 0, TAU); ctx.fill();
    }
    if (glowFlare > 0) glowFlare = Math.max(0, glowFlare - dt * 1.5);

    drawBurst(dt);
    emitSparks(dt, useAsm, A, box, kcx, kcy);
    drawSparks(dt);
    maybeShoot(t, warp);

    if (flash > 0) {
      const g = ctx.createRadialGradient(kcx, kcy, 0, cx, cy, Math.max(W, H) * 0.8);
      g.addColorStop(0, `rgba(255,255,255,${(flash * 0.3).toFixed(3)})`);
      g.addColorStop(0.4, `rgba(${aCss},${(flash * 0.16).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      flash = Math.max(0, flash - dt * 1.5);
    }
  }

  /* ---- constellation ring around the kanji ---- */
  const RING = Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * TAU, r: rnd(0.82, 1.02), tw: rnd(0, TAU) }));
  function drawConstellation(t, x, y, box, asmV, aCss) {
    const R = box * 0.92, rot = t * 0.00006;
    const node = k => { const o = RING[k]; const ang = o.a + rot; return [x + Math.cos(ang) * R * o.r, y + Math.sin(ang) * R * o.r * 0.82]; };
    ctx.lineWidth = 1; ctx.strokeStyle = `rgba(${aCss},${(0.16 * asmV).toFixed(3)})`;
    ctx.beginPath(); for (let k = 0; k < RING.length; k++) { const n = node(k); k ? ctx.lineTo(n[0], n[1]) : ctx.moveTo(n[0], n[1]); } ctx.closePath(); ctx.stroke();
    for (let k = 0; k < RING.length; k++) { const n = node(k); const tw = 0.6 + 0.4 * Math.sin(t * 0.003 + RING[k].tw); ctx.fillStyle = `rgba(${aCss},${(asmV * tw * 0.9).toFixed(3)})`; ctx.beginPath(); ctx.arc(n[0], n[1], 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(${aCss},${(asmV * tw * 0.2).toFixed(3)})`; ctx.beginPath(); ctx.arc(n[0], n[1], 6, 0, TAU); ctx.fill(); }
  }

  function fireBurst() {
    if (!glyphPts) return;
    const box = Math.min(W, H) * 0.50, kcx = cx, kcy = H * kcyFactor, A = aura.slice();
    burst = []; const n = Math.min(150, glyphPts.length);
    for (let i = 0; i < n; i++) {
      const tp = glyphPts[(Math.random() * glyphPts.length) | 0];
      const x = kcx + tp[0] * box * 0.5, y = kcy + tp[1] * box * 0.5;
      const dx = x - kcx, dy = y - kcy, d = Math.hypot(dx, dy) || 1;
      const ang = Math.atan2(dy, dx) + rnd(-0.55, 0.55);
      const sp = (0.9 + d / box * 2.4) * rnd(1.5, 4.2);
      burst.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, decay: rnd(0.55, 1.15), r: rnd(0.8, 2.2), col: A });
    }
  }
  function drawBurst(dt) {
    for (let i = burst.length - 1; i >= 0; i--) {
      const b = burst[i]; b.x += b.vx; b.y += b.vy; b.vx *= 0.93; b.vy *= 0.93; b.life -= b.decay * dt;
      if (b.life <= 0) { burst.splice(i, 1); continue; }
      const a = clamp(b.life, 0, 1), rad = b.r * (0.55 + a * 0.9);
      const col = mix([255, 255, 255], b.col, 0.55 * (1 - a));
      ctx.fillStyle = `rgba(${css(col)},${(a * 0.95).toFixed(3)})`; ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${css(b.col)},${(a * 0.16).toFixed(3)})`; ctx.beginPath(); ctx.arc(b.x, b.y, rad * 3.2, 0, TAU); ctx.fill();
    }
  }
  function emitSparks(dt, asmV, A, box, kcx, kcy) {
    if (!glyphPts || asmV < 0.5) return;
    const rate = (reduce ? 6 : 18) * asmV, n = rate * dt, cnt = (n | 0) + (Math.random() < (n - (n | 0)) ? 1 : 0);
    for (let i = 0; i < cnt; i++) {
      const tp = glyphPts[(Math.random() * glyphPts.length) | 0];
      const x = kcx + tp[0] * box * 0.5, y = kcy + tp[1] * box * 0.5;
      const fling = Math.random() < 0.34, ang = Math.random() * TAU, sp = fling ? rnd(0.7, 2.0) : rnd(0.04, 0.4);
      sparks.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - (fling ? 0 : rnd(0, 0.12)), life: 1, decay: fling ? rnd(0.55, 0.95) : rnd(0.32, 0.6), r: fling ? rnd(0.7, 1.5) : rnd(0.5, 1.2), col: A.slice(), fling });
    }
    if (sparks.length > 340) sparks.splice(0, sparks.length - 340);
  }
  function drawSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vx *= 0.965; s.vy *= 0.965; s.life -= s.decay * dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const a = clamp(s.life, 0, 1), rad = s.r * (0.5 + a * 0.7), col = mix([255, 255, 255], s.col, 0.4 * (1 - a));
      if (s.fling && !reduce && a > 0.25) { ctx.strokeStyle = `rgba(${css(s.col)},${(a * 0.22).toFixed(3)})`; ctx.lineWidth = Math.max(0.5, rad * 0.7); ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4); ctx.stroke(); }
      ctx.fillStyle = `rgba(${css(col)},${(a * 0.9).toFixed(3)})`; ctx.beginPath(); ctx.arc(s.x, s.y, rad, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${css(s.col)},${(a * 0.13).toFixed(3)})`; ctx.beginPath(); ctx.arc(s.x, s.y, rad * 2.8, 0, TAU); ctx.fill();
    }
  }
  function maybeShoot(t, warp) {
    if (reduce) return;
    if (t > nextShoot && warp < 0.4) { nextShoot = t + rnd(3200, 7000); const ang = Math.PI * 0.2 + rnd(-.12, .12), sp = rnd(7, 12); shoots.push({ x: rnd(W * 0.1, W * 0.7), y: rnd(0, H * 0.3), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1 }); }
    for (let i = shoots.length - 1; i >= 0; i--) { const s = shoots[i]; s.x += s.vx; s.y += s.vy; s.life -= 0.016; ctx.strokeStyle = `rgba(245,224,170,${(Math.max(0, s.life) * 0.7).toFixed(3)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 9, s.y - s.vy * 9); ctx.stroke(); if (s.life <= 0 || s.x > W + 80 || s.y > H + 80) shoots.splice(i, 1); }
  }
})();
