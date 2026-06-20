// Production player for Night Breeze.
// Two components:
//   • BgVideoStack — two layered video elements that crossfade between
//     hoshi01/02/03 by weight, sprinkling hoshi05 every ~60s.
//   • LiveCinema — the B design parameterised by track data. Drives the
//     circular EQ ring from a real AnalyserNode when supplied; otherwise
//     falls back to the synthetic waveAmp() from designs.jsx.

const { useEffect, useRef, useState, useCallback } = React;

// ─────────────────────────────────────────────────────────────────────
// Background video stack
// ─────────────────────────────────────────────────────────────────────
const BG_VARIANTS = [
  { src: 'assets/bg/hoshi01.mp4', weight: 5 },
  { src: 'assets/bg/hoshi02.mp4', weight: 3 },
  { src: 'assets/bg/hoshi03.mp4', weight: 2 },
];
const BG_SPECIAL = 'assets/bg/hoshi05.mp4';
const BG_SPECIAL_INTERVAL_SEC = 60;
const TOTAL_BG_WEIGHT = BG_VARIANTS.reduce((s, v) => s + v.weight, 0);

function pickWeighted(excludeSrc) {
  for (let tries = 0; tries < 8; tries++) {
    let r = Math.random() * TOTAL_BG_WEIGHT;
    for (const v of BG_VARIANTS) {
      r -= v.weight;
      if (r <= 0) {
        if (v.src !== excludeSrc) return v.src;
        break;
      }
    }
  }
  return BG_VARIANTS[0].src;
}

function BgVideoStack({ filter = 'contrast(1.08) saturate(0.92) brightness(0.74)' }) {
  const aRef = useRef(null);
  const bRef = useRef(null);
  const state = useRef({
    front: 'a',
    startedAt: performance.now() / 1000,
    lastSpecialAt: 0,
    currentSrc: null,
  });

  const nextVariant = useCallback(() => {
    const s = state.current;
    const elapsed = performance.now() / 1000 - s.startedAt;
    if (elapsed - s.lastSpecialAt > BG_SPECIAL_INTERVAL_SEC) {
      s.lastSpecialAt = elapsed;
      return BG_SPECIAL;
    }
    return pickWeighted(s.currentSrc);
  }, []);

  useEffect(() => {
    const a = aRef.current, b = bRef.current;
    if (!a || !b) return;
    a.muted = true; b.muted = true;
    a.playsInline = true; b.playsInline = true;

    const v1 = pickWeighted();
    const v2 = pickWeighted(v1);
    a.src = v1; b.src = v2;
    state.current.currentSrc = v1;
    a.load(); b.load();
    a.style.opacity = '1';
    b.style.opacity = '0';
    a.play().catch(() => {});

    // Hard-cut handoff: when the current clip ends, instantly show the
    // other element (which has been preloaded + paused at frame 0), then
    // queue the next variant into the now-hidden element.
    const onEnd = (which) => () => {
      const s = state.current;
      const ending   = which === 'a' ? a : b;
      const starting = which === 'a' ? b : a;
      try { starting.currentTime = 0; } catch (e) {}
      const p = starting.play();
      if (p && p.catch) p.catch(() => {});
      starting.style.opacity = '1';
      ending.style.opacity = '0';
      s.front = which === 'a' ? 'b' : 'a';
      s.currentSrc = starting.src;
      // Prep the ending element with the next-next variant
      setTimeout(() => {
        try {
          ending.pause();
          const fresh = nextVariant();
          ending.src = fresh;
          ending.load();
        } catch (e) {}
      }, 60);
    };
    const onEndA = onEnd('a');
    const onEndB = onEnd('b');
    a.addEventListener('ended', onEndA);
    b.addEventListener('ended', onEndB);
    return () => {
      a.removeEventListener('ended', onEndA);
      b.removeEventListener('ended', onEndB);
    };
  }, [nextVariant]);

  const base = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'cover',
    filter,
  };
  return (
    <>
      <video ref={aRef} autoPlay muted playsInline preload="auto" style={base} />
      <video ref={bRef} muted playsInline preload="auto" style={{ ...base, opacity: 0 }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LiveCinema — the B design, parameterised by track + analyser
// ─────────────────────────────────────────────────────────────────────
function LiveCinema({
  track,             // { num, jp, en } current
  transitionState,   // 'stable' | 'outro' | 'intro'
  transitionKey,     // changes on each new intro so CSS animations replay
  bloomKey,          // changes once per transition cycle (at outro start)
  trackElapsed,      // current track elapsed seconds
  trackDur,          // current track duration seconds
  analyser,          // AnalyserNode | null
}) {
  const ringRef = useRef(null);
  const t0Ref = useRef(performance.now() / 1000);

  useEffect(() => {
    const c = ringRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let raf;
    const draw = () => {
      const W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const r0 = Math.min(W, H) * 0.36;
      const N = 180;

      let data = null;
      if (analyser) {
        data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
      }

      ctx.lineCap = 'round';
      for (let i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
        let a;
        if (data) {
          // mirror the spectrum so the ring is symmetrical
          const half = N / 2;
          const idx = Math.floor(((i < half ? i : N - 1 - i) / half) * (data.length * 0.7));
          a = (data[idx] || 0) / 255;
          a = Math.pow(a, 0.7) * 1.05;
        } else {
          a = waveAmp(performance.now() / 1000 - t0Ref.current + i * 0.018, i);
        }
        const len = 8 + a * 56;
        const x1 = cx + Math.cos(ang) * r0;
        const y1 = cy + Math.sin(ang) * r0;
        const x2 = cx + Math.cos(ang) * (r0 + len);
        const y2 = cy + Math.sin(ang) * (r0 + len);
        ctx.strokeStyle = `rgba(245, 235, 215, ${0.3 + a * 0.6})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(245,235,215,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r0 - 14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r0 + 70, 0, Math.PI * 2); ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  // pulse for credit dot
  const [pulseT, setPulseT] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => { setPulseT(performance.now() / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const trans = transitionState || 'stable';
  const blockClass = `nb-hBlock nb-trans-${trans}`;

  return (
    <div style={liveStyles.root}>
      <BgVideoStack />
      <div style={liveStyles.grade} />

      {/* letterbox bars (intentionally disabled for YouTube full-bleed) */}
      {/* <div style={{ ...liveStyles.bar, top: 0 }} />
      <div style={{ ...liveStyles.bar, bottom: 0 }} /> */}

      {/* circular EQ ring */}
      <canvas ref={ringRef} width={1100} height={1100} style={liveStyles.ring} />

      {/* vertical 夜風 slab — constant across tracks */}
      <div style={liveStyles.vSlab}>
        <div style={liveStyles.vTitle}>夜<br />風</div>
        <div style={liveStyles.vRule} />
        <div style={liveStyles.vMeta}>NIGHT&nbsp;BREEZE</div>
      </div>

      {/* horizontal title block — animates on track change */}
      <div className={blockClass} key={transitionKey} style={liveStyles.hBlock}>
        <div className="nb-t-kicker" style={liveStyles.hKicker}>
          TRACK&nbsp;{String(track.num).padStart(2, '0')} &nbsp;·&nbsp; 夜風 PLAYLIST
        </div>
        <div className="nb-t-jp" style={liveStyles.hTitleJp}>{track.jp}</div>
        <div className="nb-t-en" style={liveStyles.hTitleEn}><em>{track.en}</em></div>
        <div className="nb-t-lead" style={liveStyles.hLead}>
          composed by &nbsp;
          <strong style={{ color: '#f5ebd7', fontWeight: 500, letterSpacing: '0.18em' }}>
            HIROKAZU&nbsp;AKIYAMA
          </strong>
        </div>
      </div>

      {/* white bloom overlay — a single smooth arc spanning outro+intro */}
      <div
        className={'nb-bloom' + (trans === 'stable' ? '' : ' nb-bloom-arc')}
        key={'b-' + (bloomKey || 0)}
        style={liveStyles.bloom}
      />

      {/* corner crosshairs */}
      {[
        { top: 80, left: 80,  b: 'lt' }, { top: 80, right: 80, b: 'rt' },
        { bottom: 80, left: 80, b: 'lb' }, { bottom: 80, right: 80, b: 'rb' },
      ].map((p, i) => (
        <div key={i} style={{ position: 'absolute', width: 18, height: 18,
          top: p.top, left: p.left, right: p.right, bottom: p.bottom }}>
          <div style={{ position: 'absolute', inset: 0,
            borderTop: p.b.includes('t') ? '1px solid rgba(245,235,215,0.5)' : undefined,
            borderBottom: p.b.includes('b') ? '1px solid rgba(245,235,215,0.5)' : undefined,
            borderLeft: p.b.includes('l') ? '1px solid rgba(245,235,215,0.5)' : undefined,
            borderRight: p.b.includes('r') ? '1px solid rgba(245,235,215,0.5)' : undefined,
          }} />
        </div>
      ))}

      {/* bottom credits */}
      <div style={liveStyles.credits}>
        <div key={'c-' + transitionKey} className={`nb-credit-track nb-trans-${trans}`} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <span style={{ opacity: 0.55 }}>TRACK&nbsp;{String(track.num).padStart(2, '0')}</span>
          <span>{track.jp}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#f5ebd7',
            opacity: 0.4 + 0.6 * Math.sin(pulseT * 2.8) }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {fmtTime(trackElapsed || 0)} &nbsp;/&nbsp; {fmtTime(trackDur || 0)}
          </span>
        </div>
        <div style={{ opacity: 0.7, letterSpacing: '0.4em' }}>H/MIX&nbsp;GALLERY</div>
      </div>
    </div>
  );
}

const liveStyles = {
  root: {
    position: 'absolute', inset: 0, overflow: 'hidden',
    background: '#0a0c14',
    fontFamily: '"DM Serif Display", "Cormorant Garamond", "Hiragino Mincho ProN", serif',
    color: '#f5ebd7',
  },
  grade: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at 60% 45%, transparent 0%, rgba(8,10,22,0.4) 50%, rgba(4,6,16,0.85) 100%)',
  },
  bar: { position: 'absolute', left: 0, right: 0, height: 56, background: '#050610' },
  ring: {
    position: 'absolute', top: '50%', left: '50%',
    width: 920, height: 920,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    mixBlendMode: 'screen',
    opacity: 0.95,
  },
  vSlab: {
    position: 'absolute', left: 96, top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
  },
  vTitle: {
    fontSize: 168, lineHeight: 1.05,
    fontFamily: '"Shippori Mincho", "Hiragino Mincho ProN", serif',
    fontWeight: 600, color: '#f5ebd7', textAlign: 'center',
    textShadow: '0 6px 40px rgba(0,0,0,0.5)',
  },
  vRule: { width: 1, height: 90, background: 'rgba(245,235,215,0.5)' },
  vMeta: {
    fontFamily: '"Inter", sans-serif', fontSize: 18, letterSpacing: '0.42em',
    fontWeight: 500, color: 'rgba(245,235,215,0.75)',
    writingMode: 'vertical-rl',
  },
  hBlock: {
    position: 'absolute', right: 96, top: '50%',
    transform: 'translateY(-50%)',
    maxWidth: 720, textAlign: 'right',
  },
  hKicker: {
    fontFamily: '"Inter", sans-serif', fontSize: 15, fontWeight: 500,
    letterSpacing: '0.36em', textTransform: 'uppercase',
    color: 'rgba(245,235,215,0.75)', marginBottom: 30,
  },
  hTitleJp: {
    fontSize: 92, lineHeight: 1.18, letterSpacing: '0.02em',
    fontFamily: '"Shippori Mincho", "Hiragino Mincho ProN", serif',
    fontWeight: 600, color: '#f5ebd7',
    textShadow: '0 6px 40px rgba(0,0,0,0.55)',
  },
  hTitleEn: {
    marginTop: 18,
    fontFamily: '"DM Serif Display", serif',
    fontSize: 34, lineHeight: 1.25,
    color: 'rgba(245,235,215,0.92)',
    letterSpacing: '-0.005em',
  },
  hLead: {
    marginTop: 30,
    fontFamily: '"Inter", sans-serif', fontSize: 16, lineHeight: 1.55,
    color: 'rgba(245,235,215,0.65)', letterSpacing: '0.04em',
  },
  credits: {
    position: 'absolute', left: 96, right: 96, bottom: 78,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontFamily: '"Inter", sans-serif', fontSize: 13,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: '#f5ebd7',
  },
  bloom: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background:
      'radial-gradient(ellipse at 50% 45%, rgba(255,245,220,0.55) 0%, rgba(255,235,200,0.18) 30%, transparent 65%)',
    opacity: 0,
    mixBlendMode: 'screen',
  },
};

window.LiveCinema = LiveCinema;
window.BgVideoStack = BgVideoStack;
