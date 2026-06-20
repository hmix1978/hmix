// Three BGM video design variants. Each is a self-contained component
// that renders a 1920x1080 frame (scaled to artboard size by parent),
// with the source video looping in the background and synthetic
// audio-reactive ornaments animated on top.

const { useEffect, useRef, useState } = React;

// ─────────────────────────────────────────────────────────────────────
// Shared: pseudo-music amplitude generator. Returns 0..1.
// Used so all three designs share a consistent "musicality" even though
// none of them are reading real audio.
// ─────────────────────────────────────────────────────────────────────
function waveAmp(t, i = 0) {
  // Multiple sines + bass envelope; tuned to feel lo-fi-ish.
  const beat = (Math.sin(t * Math.PI * 1.8) * 0.5 + 0.5) ** 2; // 0..1, kicks
  const mid = Math.sin(t * 4.1 + i * 0.31) * 0.45;
  const hi = Math.sin(t * 9.7 + i * 0.83) * 0.25;
  const drift = Math.sin(t * 0.6 + i * 0.07) * 0.18;
  const raw = Math.abs(mid + hi + drift) * 0.7 + beat * 0.35;
  return Math.max(0.05, Math.min(1, raw));
}

// Animation tick hook (returns elapsed seconds since mount).
function useTick() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf, start = performance.now();
    const loop = (now) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

// Looping muted bg video used by all variants
function BgVideo({ style }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);
  return (
    <video
      ref={ref}
      src="assets/hoshi.mp4"
      autoPlay loop muted playsInline
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', ...style,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// A · LO-FI MINIMAL
// All info consolidated into a soft left "info column" so the artwork
// on the right side of the frame (sky, character, foxes) stays clean
// and visible. The column is a dark-to-transparent gradient panel so
// the type reads regardless of what's playing behind it.
// ─────────────────────────────────────────────────────────────────────
function DesignLofi() {
  const t = useTick();
  const BARS = 28;
  // total seconds for the synthetic playhead
  const playSec = 74 + t;
  const totalSec = 272;
  return (
    <div style={lofiStyles.root}>
      <BgVideo style={{ filter: 'saturate(0.88) brightness(0.82)' }} />
      {/* base global grade */}
      <div style={lofiStyles.grade} />
      {/* left dark panel — anchors the info column */}
      <div style={lofiStyles.leftPanel} />
      {/* subtle vignette + grain */}
      <div style={lofiStyles.vignette} />
      <div style={lofiStyles.grain} />

      {/* INFO COLUMN — single left stack */}
      <div style={lofiStyles.column}>
        {/* channel mark */}
        <div style={lofiStyles.channel}>
          <div style={{
            ...lofiStyles.dot,
            opacity: 0.55 + 0.45 * Math.sin(t * 3.2),
          }} />
          <span style={{ letterSpacing: '0.42em' }}>HOSHI &nbsp;·&nbsp; LO-FI RADIO</span>
        </div>

        {/* primary title block */}
        <div style={lofiStyles.titleBlock}>
          <div style={lofiStyles.subtitle}>now playing — track 03</div>
          <div style={lofiStyles.title}>midnight<br/>rooftop</div>
          <div style={lofiStyles.artist}>星のうた &nbsp;/&nbsp; hoshi no uta</div>
        </div>

        {/* spacer */}
        <div style={{ flex: 1 }} />

        {/* now-playing card */}
        <div style={lofiStyles.card}>
          <div style={lofiStyles.cardArt}>
            <img src="assets/hoshi.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '30% 40%' }} />
          </div>
          <div style={lofiStyles.cardText}>
            <div style={lofiStyles.cardLabel}>VOL.01 · SIDE A</div>
            <div style={lofiStyles.cardTitle}>Sleepless Rooftops</div>
            <div style={lofiStyles.cardSub}>12 tracks · 54 min</div>
          </div>
        </div>

        {/* waveform + progress */}
        <div style={lofiStyles.waveBlock}>
          <div style={lofiStyles.wave}>
            {Array.from({ length: BARS }).map((_, i) => {
              const a = waveAmp(t + i * 0.025, i);
              const env = Math.sin((i / (BARS - 1)) * Math.PI) ** 0.6;
              const h = 4 + a * env * 44;
              const isPast = (i / BARS) < (playSec / totalSec);
              return (
                <div key={i} style={{
                  width: 5, height: h, borderRadius: 4,
                  background: isPast ? '#ffb98a' : '#f6e8d6',
                  opacity: isPast ? 0.85 : 0.4 + a * 0.35,
                }} />
              );
            })}
          </div>
          <div style={lofiStyles.timeRow}>
            <span style={{ color: '#ffb98a' }}>{fmtTime(playSec)}</span>
            <span style={{ opacity: 0.4 }}>{fmtTime(totalSec)}</span>
          </div>
        </div>

        {/* footer meta */}
        <div style={lofiStyles.footer}>
          <span>♪ &nbsp; chill · instrumental · 72 bpm</span>
        </div>
      </div>
    </div>
  );
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function fmtLong(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const lofiStyles = {
  root: {
    position: 'absolute', inset: 0, overflow: 'hidden',
    background: '#0d0f17',
    fontFamily: '"DM Serif Display", "Cormorant Garamond", "Hiragino Mincho ProN", serif',
    color: '#f6ead4',
  },
  grade: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, rgba(20,16,30,0.25) 0%, rgba(40,20,8,0.05) 40%, rgba(8,6,16,0.55) 100%)',
    mixBlendMode: 'multiply',
  },
  // dark gradient that anchors the right info column without hard-edging
  leftPanel: {
    position: 'absolute', inset: 0,
    background:
      'linear-gradient(270deg, rgba(8,6,14,0.92) 0%, rgba(8,6,14,0.82) 28%, rgba(8,6,14,0.45) 48%, rgba(8,6,14,0.0) 62%)',
    pointerEvents: 'none',
  },
  vignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 30% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)',
    pointerEvents: 'none',
  },
  grain: {
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.07,
    backgroundImage:
      'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
  },
  // ── INFO COLUMN (right side) ──────────────────────────────────
  column: {
    position: 'absolute', top: 0, bottom: 0, right: 0,
    width: 720, padding: '88px 96px 88px 96px',
    display: 'flex', flexDirection: 'column',
  },
  channel: {
    fontFamily: '"Inter", "Helvetica Neue", sans-serif',
    fontSize: 17, fontWeight: 500,
    color: 'rgba(246, 234, 212, 0.85)',
    display: 'flex', alignItems: 'center', gap: 14,
  },
  dot: {
    width: 9, height: 9, borderRadius: 999, background: '#ff8a4c',
    boxShadow: '0 0 12px rgba(255,138,76,0.7)',
  },
  titleBlock: { marginTop: 72 },
  subtitle: {
    fontFamily: '"Inter", sans-serif', fontSize: 15, letterSpacing: '0.32em',
    textTransform: 'uppercase', color: 'rgba(246, 234, 212, 0.6)',
    marginBottom: 24,
  },
  title: {
    fontSize: 116, lineHeight: 0.95, fontWeight: 400,
    letterSpacing: '-0.02em',
    color: '#f6ead4',
    textShadow: '0 6px 40px rgba(0,0,0,0.55)',
  },
  artist: {
    marginTop: 32,
    fontFamily: '"Inter", sans-serif', fontSize: 19, letterSpacing: '0.16em',
    color: 'rgba(246, 234, 212, 0.75)',
  },
  // ── NOW-PLAYING CARD ──────────────────────────────────────────
  card: {
    display: 'flex', alignItems: 'center', gap: 20,
    padding: '18px 24px 18px 18px',
    background: 'rgba(20, 16, 28, 0.55)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderRadius: 12,
    border: '1px solid rgba(246, 234, 212, 0.12)',
    marginBottom: 38,
  },
  cardArt: {
    width: 68, height: 68, borderRadius: 6, overflow: 'hidden',
    boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
    flex: '0 0 auto',
  },
  cardText: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  cardLabel: {
    fontFamily: '"Inter", sans-serif', fontSize: 11, fontWeight: 600,
    letterSpacing: '0.32em', color: 'rgba(255, 200, 160, 0.85)',
  },
  cardTitle: { fontSize: 22, fontWeight: 400, letterSpacing: '-0.005em' },
  cardSub: {
    fontFamily: '"Inter", sans-serif', fontSize: 13,
    color: 'rgba(246, 234, 212, 0.55)', letterSpacing: '0.06em',
  },
  // ── WAVEFORM + TIME ───────────────────────────────────────────
  waveBlock: { marginBottom: 28 },
  wave: {
    height: 60, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    marginTop: 14,
    display: 'flex', justifyContent: 'space-between',
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
    fontSize: 16, letterSpacing: '0.04em',
    color: 'rgba(246, 234, 212, 0.85)',
  },
  footer: {
    display: 'flex', justifyContent: 'flex-start',
    fontFamily: '"Inter", sans-serif', fontSize: 12, letterSpacing: '0.32em',
    textTransform: 'uppercase',
    color: 'rgba(246, 234, 212, 0.55)',
  },
  _legacy_timer_unused: {
    position: 'absolute', right: 64, bottom: 200,
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
    fontSize: 28, letterSpacing: '0.06em',
    color: 'rgba(246, 234, 212, 0.85)',
  },
  wave: {
    position: 'absolute', left: 64, right: 64, bottom: 100,
    height: 48, display: 'flex', alignItems: 'center',
    gap: 5,
    justifyContent: 'space-between',
  },
  footer: {
    position: 'absolute', left: 64, right: 64, bottom: 48,
    display: 'flex', justifyContent: 'space-between',
    fontFamily: '"Inter", sans-serif', fontSize: 13, letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'rgba(246, 234, 212, 0.55)',
  },
};

// ─────────────────────────────────────────────────────────────────────
// B · CINEMATIC EDITORIAL
// Film-poster scale. Vertical Japanese title slab on the left, big
// circular EQ ring centered around the focal moon, letterbox bars,
// tiny credit-block info bar at the very bottom.
// ─────────────────────────────────────────────────────────────────────
function DesignCinema() {
  const t = useTick();
  const ringRef = useRef(null);

  // draw circular EQ ring on canvas
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
      const tt = performance.now() / 1000;
      const N = 180;
      // outer ring of ticks
      ctx.lineCap = 'round';
      for (let i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
        const a = waveAmp(tt + i * 0.018, i);
        const len = 8 + a * 46;
        const x1 = cx + Math.cos(ang) * r0;
        const y1 = cy + Math.sin(ang) * r0;
        const x2 = cx + Math.cos(ang) * (r0 + len);
        const y2 = cy + Math.sin(ang) * (r0 + len);
        ctx.strokeStyle = `rgba(245, 235, 215, ${0.35 + a * 0.55})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      // thin guide circle
      ctx.strokeStyle = 'rgba(245, 235, 215, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r0 - 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r0 + 70, 0, Math.PI * 2);
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={cinemaStyles.root}>
      {/* slow-zoom video bg */}
      <div style={cinemaStyles.zoom}>
        <BgVideo style={{ filter: 'contrast(1.08) saturate(0.9) brightness(0.72)' }} />
      </div>
      <div style={cinemaStyles.grade} />

      {/* letterbox bars */}
      <div style={{ ...cinemaStyles.bar, top: 0 }} />
      <div style={{ ...cinemaStyles.bar, bottom: 0 }} />

      {/* circular EQ ring */}
      <canvas
        ref={ringRef}
        width={1100}
        height={1100}
        style={cinemaStyles.ring}
      />

      {/* vertical Japanese playlist-name slab, left */}
      <div style={cinemaStyles.vSlab}>
        <div style={cinemaStyles.vTitle}>
          夜<br/>風
        </div>
        <div style={cinemaStyles.vRule} />
        <div style={cinemaStyles.vMeta}>NIGHT&nbsp;BREEZE</div>
      </div>

      {/* horizontal title block, right side */}
      <div style={cinemaStyles.hBlock}>
        <div style={cinemaStyles.hKicker}>夜風 PLAYLIST &nbsp;·&nbsp; 02:00:00</div>
        <div style={cinemaStyles.hTitleJp}>花よ川よ<br/>この大地よ</div>
        <div style={cinemaStyles.hTitleEn}>Flowers, Rivers, <em>and Earth</em></div>
        <div style={cinemaStyles.hLead}>
          composed by &nbsp; <strong style={{ color: '#f5ebd7', fontWeight: 500, letterSpacing: '0.18em' }}>HIROKAZU&nbsp;AKIYAMA</strong>
        </div>
      </div>

      {/* corner crosshairs */}
      {[
        { top: 80, left: 80 }, { top: 80, right: 80 },
        { bottom: 80, left: 80 }, { bottom: 80, right: 80 },
      ].map((p, i) => (
        <div key={i} style={{ position: 'absolute', width: 18, height: 18, ...p }}>
          <div style={{ position: 'absolute', inset: 0, borderTop: '1px solid rgba(245,235,215,0.5)', borderLeft: '1px solid rgba(245,235,215,0.5)' }} />
        </div>
      ))}

      {/* bottom credit strip */}
      <div style={cinemaStyles.credits}>
        <div>
          <span style={{ opacity: 0.55 }}>TRACK&nbsp;03</span>&nbsp;&nbsp;
          <span>花よ川よこの大地よ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999, background: '#f5ebd7',
            opacity: 0.4 + 0.6 * Math.sin(t * 2.8),
          }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtLong(4472 + t)} &nbsp;/&nbsp; 02:00:00</span>
        </div>
        <div style={{ opacity: 0.7, letterSpacing: '0.4em' }}>H/MIX&nbsp;GALLERY</div>
      </div>
    </div>
  );
}

const cinemaStyles = {
  root: {
    position: 'absolute', inset: 0, overflow: 'hidden',
    background: '#0a0c14',
    fontFamily: '"DM Serif Display", "Cormorant Garamond", "Hiragino Mincho ProN", serif',
    color: '#f5ebd7',
  },
  zoom: {
    position: 'absolute', inset: 0,
    animation: 'cinemaZoom 24s ease-in-out infinite alternate',
  },
  grade: {
    position: 'absolute', inset: 0,
    background:
      'radial-gradient(ellipse at 60% 45%, transparent 0%, rgba(8,10,22,0.4) 50%, rgba(4,6,16,0.85) 100%)',
    pointerEvents: 'none',
  },
  bar: {
    position: 'absolute', left: 0, right: 0, height: 56,
    background: '#050610',
  },
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
    fontWeight: 600, color: '#f5ebd7',
    writingMode: 'horizontal-tb',
    textAlign: 'center',
    textShadow: '0 6px 40px rgba(0,0,0,0.5)',
  },
  vRule: { width: 1, height: 90, background: 'rgba(245,235,215,0.5)' },
  vMeta: {
    fontFamily: '"Inter", sans-serif', fontSize: 18, letterSpacing: '0.42em',
    fontWeight: 500,
    color: 'rgba(245,235,215,0.75)',
    writingMode: 'vertical-rl',
  },
  hBlock: {
    position: 'absolute', right: 96, top: '50%',
    transform: 'translateY(-50%)',
    maxWidth: 580, textAlign: 'right',
  },
  hKicker: {
    fontFamily: '"Inter", sans-serif', fontSize: 15, fontWeight: 500, letterSpacing: '0.36em',
    color: 'rgba(245,235,215,0.75)', marginBottom: 30,
    textTransform: 'uppercase',
  },
  hTitleJp: {
    fontSize: 96, lineHeight: 1.1, letterSpacing: '0.04em',
    fontFamily: '"Shippori Mincho", "Hiragino Mincho ProN", serif',
    fontWeight: 600,
    color: '#f5ebd7',
    textShadow: '0 6px 40px rgba(0,0,0,0.55)',
  },
  hTitleEn: {
    marginTop: 18,
    fontFamily: '"DM Serif Display", serif',
    fontSize: 36, lineHeight: 1.2,
    color: 'rgba(245,235,215,0.92)',
    letterSpacing: '-0.005em',
  },
  hLead: {
    marginTop: 36,
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
};

// ─────────────────────────────────────────────────────────────────────
// C · NEON VAPORWAVE
// High-contrast, Japanese-channel vibe. Mirrored bar visualizer along
// the bottom, vertical glowing katakana down the right edge, scanline
// overlay, top scrolling ticker.
// ─────────────────────────────────────────────────────────────────────
function DesignNeon() {
  const t = useTick();
  const BARS = 64;
  return (
    <div style={neonStyles.root}>
      <BgVideo style={{ filter: 'saturate(1.15) contrast(1.05) brightness(0.7) hue-rotate(-8deg)' }} />
      {/* magenta/cyan grade */}
      <div style={neonStyles.grade} />
      {/* scanlines */}
      <div style={neonStyles.scanlines} />
      {/* chromatic edge tint */}
      <div style={neonStyles.tint} />

      {/* top ticker */}
      <div style={neonStyles.tickerWrap}>
        <div style={{ ...neonStyles.tickerInner, animation: 'tickerSlide 22s linear infinite' }}>
          <span>★ HOSHI FM</span>
          <span>·</span>
          <span>NOW PLAYING — 星のうた / midnight rooftop</span>
          <span>·</span>
          <span>SLEEP &amp; STUDY MIX VOL.01</span>
          <span>·</span>
          <span>72 BPM</span>
          <span>·</span>
          <span>★ HOSHI FM</span>
          <span>·</span>
          <span>NOW PLAYING — 星のうた / midnight rooftop</span>
          <span>·</span>
          <span>SLEEP &amp; STUDY MIX VOL.01</span>
          <span>·</span>
          <span>72 BPM</span>
          <span>·</span>
        </div>
      </div>

      {/* logo */}
      <div style={neonStyles.logo}>
        <div style={neonStyles.logoMark}>★</div>
        <div>
          <div style={neonStyles.logoTop}>HOSHI · FM</div>
          <div style={neonStyles.logoBot}>放 送 中</div>
        </div>
      </div>

      {/* live badge */}
      <div style={neonStyles.live}>
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: 999,
          background: '#ff3ea8', marginRight: 10,
          boxShadow: '0 0 10px #ff3ea8',
          opacity: 0.5 + 0.5 * Math.sin(t * 6),
        }} />
        ON AIR
      </div>

      {/* vertical katakana, right edge */}
      <div style={neonStyles.kana}>
        <div style={neonStyles.kanaChar}>ホ</div>
        <div style={neonStyles.kanaChar}>シ</div>
        <div style={neonStyles.kanaChar}>ノ</div>
        <div style={neonStyles.kanaChar}>ウ</div>
        <div style={neonStyles.kanaChar}>タ</div>
      </div>

      {/* big track title */}
      <div style={neonStyles.titleBlock}>
        <div style={neonStyles.kicker}>♫ &nbsp; TRACK 03 &nbsp; / &nbsp; 12</div>
        <div style={neonStyles.title}>MIDNIGHT<br/>ROOFTOP</div>
        <div style={neonStyles.sub}>星のうた &nbsp;—&nbsp; for stargazing at 2 a.m.</div>
      </div>

      {/* mirrored waveform */}
      <div style={neonStyles.waveBox}>
        {Array.from({ length: BARS }).map((_, i) => {
          const a = waveAmp(t + i * 0.02, i);
          const env = Math.sin((i / (BARS - 1)) * Math.PI) ** 0.6;
          const h = 6 + a * env * 130;
          // color gradient across bars
          const tcol = i / (BARS - 1);
          const r = Math.round(255 * (1 - tcol * 0.6));
          const g = Math.round(60 + tcol * 60);
          const b = Math.round(168 + tcol * 60);
          const col = `rgb(${r},${g},${b})`;
          return (
            <div key={i} style={{
              width: 14, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <div style={{
                width: '100%', height: h, borderRadius: 3,
                background: `linear-gradient(180deg, ${col}, rgba(${r},${g},${b},0.2))`,
                boxShadow: `0 0 14px ${col}88`,
              }} />
              <div style={{
                width: '100%', height: h * 0.55, borderRadius: 3,
                background: `linear-gradient(0deg, ${col}, rgba(${r},${g},${b},0.15))`,
                opacity: 0.55,
                filter: 'blur(0.5px)',
              }} />
            </div>
          );
        })}
      </div>

      {/* bottom progress + time */}
      <div style={neonStyles.progressWrap}>
        <span style={neonStyles.timeNow}>{fmtTime(74 + t)}</span>
        <div style={neonStyles.track}>
          <div style={{
            ...neonStyles.fill,
            width: `${Math.min(100, ((74 + t) / 272) * 100)}%`,
          }}>
            <div style={neonStyles.fillKnob} />
          </div>
        </div>
        <span style={neonStyles.timeEnd}>04:32</span>
      </div>

      {/* chrome corners */}
      <div style={{ ...neonStyles.corner, top: 0, left: 0, borderTop: '2px solid #ff3ea8', borderLeft: '2px solid #ff3ea8' }} />
      <div style={{ ...neonStyles.corner, top: 0, right: 0, borderTop: '2px solid #38e1ff', borderRight: '2px solid #38e1ff' }} />
      <div style={{ ...neonStyles.corner, bottom: 0, left: 0, borderBottom: '2px solid #38e1ff', borderLeft: '2px solid #38e1ff' }} />
      <div style={{ ...neonStyles.corner, bottom: 0, right: 0, borderBottom: '2px solid #ff3ea8', borderRight: '2px solid #ff3ea8' }} />
    </div>
  );
}

const neonStyles = {
  root: {
    position: 'absolute', inset: 0, overflow: 'hidden',
    background: '#080216',
    fontFamily: '"Bebas Neue", "Inter", sans-serif',
    color: '#fff',
  },
  grade: {
    position: 'absolute', inset: 0,
    background:
      'linear-gradient(135deg, rgba(255,62,168,0.18) 0%, transparent 40%, rgba(56,225,255,0.18) 100%)',
    mixBlendMode: 'screen',
    pointerEvents: 'none',
  },
  scanlines: {
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18,
    backgroundImage:
      'repeating-linear-gradient(0deg, rgba(0,0,0,0.65) 0px, rgba(0,0,0,0.65) 1px, transparent 1px, transparent 3px)',
  },
  tint: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background:
      'radial-gradient(ellipse at top, transparent 50%, rgba(8,2,22,0.75) 100%)',
  },
  tickerWrap: {
    position: 'absolute', top: 36, left: 0, right: 0,
    height: 36, overflow: 'hidden',
    borderTop: '1px solid rgba(56,225,255,0.4)',
    borderBottom: '1px solid rgba(56,225,255,0.4)',
    background: 'rgba(8,2,22,0.55)',
    display: 'flex', alignItems: 'center',
  },
  tickerInner: {
    display: 'flex', gap: 36, whiteSpace: 'nowrap',
    fontFamily: '"Inter", sans-serif', fontSize: 16, fontWeight: 600,
    color: '#9ff0ff', letterSpacing: '0.22em',
    paddingLeft: '100%',
  },
  logo: {
    position: 'absolute', top: 116, left: 80,
    display: 'flex', alignItems: 'center', gap: 16,
  },
  logoMark: {
    fontSize: 44, color: '#ff3ea8',
    textShadow: '0 0 16px rgba(255,62,168,0.8)',
    lineHeight: 1,
  },
  logoTop: {
    fontFamily: '"Bebas Neue", sans-serif', fontSize: 28,
    letterSpacing: '0.22em', color: '#fff',
    textShadow: '0 0 8px rgba(56,225,255,0.6)',
  },
  logoBot: {
    fontFamily: '"Shippori Mincho", "Hiragino Mincho ProN", serif',
    fontSize: 14, letterSpacing: '0.6em', color: '#38e1ff',
    marginTop: 4,
  },
  live: {
    position: 'absolute', top: 132, right: 96,
    padding: '8px 18px',
    fontFamily: '"Inter", sans-serif', fontSize: 14, fontWeight: 700,
    letterSpacing: '0.32em',
    border: '1px solid #ff3ea8', color: '#ff3ea8',
    background: 'rgba(255,62,168,0.08)',
    display: 'flex', alignItems: 'center',
  },
  kana: {
    position: 'absolute', top: '50%', right: 64,
    transform: 'translateY(-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  kanaChar: {
    fontSize: 78, lineHeight: 1,
    fontFamily: '"Shippori Mincho", "Hiragino Mincho ProN", serif',
    fontWeight: 700, color: '#fff',
    textShadow: '0 0 18px rgba(56,225,255,0.7), 0 0 4px rgba(255,62,168,0.5)',
  },
  titleBlock: {
    position: 'absolute', left: 96, top: 280,
    maxWidth: 1100,
  },
  kicker: {
    fontFamily: '"Inter", sans-serif', fontSize: 18, fontWeight: 700,
    letterSpacing: '0.4em', color: '#38e1ff',
    textShadow: '0 0 10px rgba(56,225,255,0.6)',
    marginBottom: 22,
  },
  title: {
    fontSize: 188, lineHeight: 0.92, fontWeight: 400,
    letterSpacing: '0.04em',
    fontFamily: '"Bebas Neue", "Anton", sans-serif',
    color: '#fff',
    textShadow:
      '0 0 14px rgba(255,62,168,0.55), 0 0 32px rgba(56,225,255,0.35), 0 0 2px #fff',
  },
  sub: {
    marginTop: 32,
    fontFamily: '"Inter", sans-serif', fontSize: 22, fontWeight: 500,
    letterSpacing: '0.18em', color: 'rgba(255,255,255,0.85)',
  },
  waveBox: {
    position: 'absolute', left: 96, right: 240, bottom: 156,
    height: 220, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressWrap: {
    position: 'absolute', left: 96, right: 96, bottom: 80,
    display: 'flex', alignItems: 'center', gap: 24,
    fontFamily: '"JetBrains Mono", monospace', fontSize: 22,
    color: '#fff',
  },
  timeNow: { color: '#38e1ff', textShadow: '0 0 8px rgba(56,225,255,0.7)' },
  timeEnd: { color: 'rgba(255,255,255,0.55)' },
  track: {
    flex: 1, height: 4, background: 'rgba(255,255,255,0.18)',
    borderRadius: 999, position: 'relative', overflow: 'visible',
  },
  fill: {
    height: '100%', borderRadius: 999, position: 'relative',
    background: 'linear-gradient(90deg, #38e1ff, #ff3ea8)',
    boxShadow: '0 0 12px rgba(255,62,168,0.7)',
  },
  fillKnob: {
    position: 'absolute', right: -8, top: '50%',
    transform: 'translateY(-50%)',
    width: 16, height: 16, borderRadius: 999,
    background: '#fff',
    boxShadow: '0 0 18px #ff3ea8, 0 0 6px #fff',
  },
  corner: {
    position: 'absolute', width: 64, height: 64, pointerEvents: 'none',
  },
};

// Expose to other scripts
Object.assign(window, { DesignLofi, DesignCinema, DesignNeon });
