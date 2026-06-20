# Handoff: Night Breeze Player

A static-HTML, single-file BGM video player + screen-recording stage built around a Japanese minimal-cinematic visual language. The player runs all 22 tracks of the “夜風 / Night Breeze” playlist (~1 hour, 02:39 to be exact), animates a tasteful track-change transition between songs, and exposes a "production mode" that hides the chrome and goes full-screen so the user can OBS-capture a YouTube-ready video.

This bundle is a **design reference + working prototype**. The HTML/JSX in here renders a real, interactive player. Treat it as a design spec — recreate the design in the target codebase's existing environment using the codebase's patterns, OR ship the bundle as-is if no codebase exists.

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, transitions, and behavior are all settled. The visual language is intentional and should be matched pixel-for-pixel: warm cream type on a deep navy-black ground, accent gold (`#d4b483`), Shippori Mincho for Japanese, DM Serif Display italic for English, Inter for UI.

---

## What's in this bundle

```
design_handoff_night_breeze_player/
├── index.html                  ← main player (renamed from "Night Breeze Player.html")
├── designs.jsx                 ← original 3-direction explorations + shared waveAmp / fmtTime helpers
├── live-cinema.jsx             ← the production LiveCinema component + BgVideoStack
├── tracks.js                   ← playlist data (22 tracks, durations measured from mp3 metadata)
├── assets/
│   ├── audio/                  ← t01.mp3 ... t22.mp3 (22 tracks; ASCII-renamed; original titles in tracks.js)
│   ├── bg/                     ← hoshi01–05.mp4 (4 looping 5-second background clips, 1920×1080)
│   └── thumb_base.jpg          ← still frame from hoshi01 at t=2.5s, used as base for thumbnails
└── reference/
    ├── Night_Breeze_thumbnail.png  ← rendered 2-hour YouTube thumbnail (1280×720)
    ├── Night_Breeze_banner_1h.png  ← rendered 1-hour site banner   (1280×720)
    └── YouTube Description.txt     ← 2-round YouTube description + 44 chapter timestamps
```

## How to run

It's static HTML. Open `index.html` over **any local HTTP server** (file:// URLs break ES module + crossorigin audio):

```sh
cd design_handoff_night_breeze_player
python3 -m http.server 8000
# then visit http://localhost:8000/
```

No build step. React + Babel are loaded from `unpkg` at fixed versions with integrity hashes (see `<script>` tags in `index.html`).

---

## Screens / Views

There's effectively one screen — the player — with three operating modes.

### 1. Default mode (page-with-chrome)
What the designer uses to QA the player. The 1920×1080 stage scales to fit the page width inside a card with a top bar, control bar (prev/play/next/restart/REC, scrub, volume), and a 22-item playlist grid below.

- **Top bar** — `BGM PLAYER · 1 ROUND` tag (accent gold), `夜風` title (Shippori Mincho 24px) + ` — Night Breeze` italic subtitle (DM Serif Display 18px, ink-dim)
- **Stage** — 16:9 aspect-ratio card, 10px radius, 1px border `#23262f`, deep shadow. The 1920×1080 stage inside is scaled by JS to fit the card width.
- **Control bar** — prev / play (accent-gold filled) / next / restart-sample / 本番モード buttons; seek bar (4px track, accent fill); current track readout in Shippori Mincho; volume slider
- **Playlist** — 2-column grid below, each row: track number (mono 12px) · 日本語 / English title · cumulative timestamp. Active row gets a faint accent background and gold border.

### 2. Production mode (full-screen recording)
Activated by clicking the **本番モード** button. CSS class `production-mode` on `<body>`:
- Hides `.topbar`, `.controls`, `.playlist-wrap`, `.hint`
- Pins `.stage-wrap` to viewport (`position: fixed; inset: 0`)
- Triggers `el.requestFullscreen()` so the browser chrome disappears too
- Shows a fade-in start overlay (`.prod-start`) with `夜風 / Night Breeze — 2 hour playlist / ▶ START` until the user begins
- After START: a **1.2s breathing pause** before audio actually starts, so the START button finishes fading out (0.6s) and the cursor goes idle BEFORE the first note
- Cursor auto-hides after 2.5s of inactivity (`body.idle { cursor: none }`)
- `Esc` exits production mode and fullscreen together

### 3. The 1920×1080 stage (the design itself, see `live-cinema.jsx → LiveCinema`)

Layered, back to front:
- **`<BgVideoStack>`** — two `<video>` elements stacked; one plays a randomly-weighted hoshi loop (50% hoshi01, 30% hoshi02, 20% hoshi03; hoshi05 inserted every ~60s), the other preloads the next variant at frame 0 paused. On `ended`, hard-cut swap. No crossfade — the assets are designed to butt-cut cleanly. Filter: `contrast(1.08) saturate(0.92) brightness(0.74)`.
- **Radial grade** — `radial-gradient(ellipse at 60% 45%, transparent 0%, rgba(8,10,22,0.4) 50%, rgba(4,6,16,0.85) 100%)`
- **Circular EQ ring** — `<canvas>` 1100×1100 centered, scaled to 920px square. 180 radial ticks around a circle of radius 0.36·min(W,H). Each tick's length is driven by a real `AnalyserNode` (fftSize 512, smoothingTimeConstant 0.82) — `frequencyBinCount` mirrored so the ring is left/right symmetric. Stroke `rgba(245,235,215, 0.3 + a*0.6)`, line width 2.2, `lineCap: round`. Two thin guide circles at ±70px and -14px from the base radius. `mix-blend-mode: screen`.
- **Vertical 夜 / 風 slab** — left 96px, vertically centered. Two characters stacked (`<br>` between), Shippori Mincho 700, 168px, color `#f5ebd7`, text-shadow `0 6px 40px rgba(0,0,0,0.5)`. Thin vertical rule below (1×90px, 50% opacity). Below that, vertically-set `NIGHT BREEZE` in Inter 500 18px, letter-spacing 0.42em, `writing-mode: vertical-rl`.
- **Right block (per-track)** — right 96px, vertically centered, text-align right, max-width 720px:
  - Kicker: `TRACK NN · 夜風 PLAYLIST` — Inter 500 15px, letter-spacing 0.36em, uppercase, 75% ink
  - JP title: Shippori Mincho 600 92px, line-height 1.18, letter-spacing 0.02em, ink, shadow `0 6px 40px rgba(0,0,0,0.55)`
  - EN title (italic): DM Serif Display italic 34px, line-height 1.25, 92% ink
  - Composer line: Inter 400 16px, 65% ink, letter-spacing 0.04em; `HIROKAZU AKIYAMA` in 500 weight, 100% ink, letter-spacing 0.18em
- **Bottom credits strip** — left 96px / right 96px / bottom 78px row, Inter 500 13px, letter-spacing 0.18em, uppercase:
  - Left: `TRACK NN` (55% ink) + track title (100% ink)
  - Center: 6px dim-pulsing dot + `MM:SS / MM:SS` track time in JetBrains Mono
  - Right: `H/MIX GALLERY` (70% ink, letter-spacing 0.4em)
- **Corner crosshairs** — 18×18px L-shapes at all four 80px insets, 1px lines, 50% ink

---

## Track-change transition (the central animation)

When the audio has **1.4s remaining** in the current track, `transitionState` flips from `stable` → `outro`. When `ended` fires, `idx` increments, state flips → `intro`. After 1.6s, back to `stable`.

The whole sequence is roughly **2.9 seconds** end-to-end, spanning the audio boundary.

| Element | Outro (1.4s before end) | Audio swap | Intro (after ended) |
|---|---|---|---|
| Kicker | fade up + slide up 14px, 0.55s ease-in | — | fade down 0.65s 0.25s delay |
| JP title | slide up 44px + blur 5px + fade out, 0.85s `cubic-bezier(0.6,0,0.4,1)` | — | slide up FROM 46px + blur, 1.05s 0.10s delay `(0.2,0.6,0.2,1)` |
| EN title | fade out, 0.55s 0.08s | — | fade in, 0.80s 0.45s |
| Composer | fade out, 0.55s 0.04s | — | fade in, 0.80s 0.55s |
| Credit (bottom-left) | fade out, 0.55s | — | fade in, 0.65s 0.25s delay |
| **Bloom** | one `nbBloomArc` `2.9s cubic-bezier(0.4,0,0.4,1)`: opacity 0 → 0.55 (30%) → 1 (48%) → 0.85 (62%) → 0 (100%); scale 0.92 → 1 → 1.12 | (Bloom peaks **exactly at the boundary**) | (Same animation continues — single keyframe) |

The bloom is `radial-gradient(ellipse at 50% 45%, rgba(255,245,220,0.55) 0%, rgba(255,235,200,0.18) 30%, transparent 65%)`, `mix-blend-mode: screen`. It's a single animation keyed off `bloomKey` (incremented once when outro starts), not two separate up/down animations — that single arc was the key fix to make the light feel like one continuous breath rather than two discrete steps.

The intro stagger (kicker delay 0.25s, title delay 0.10s, EN 0.45s, composer 0.55s) reads the new track from large to small, top to bottom, like a print masthead.

---

## State & data flow

`<App>` (inside `index.html`) is the only stateful component. State:

| Variable | Type | Purpose |
|---|---|---|
| `idx` | number | Current track index into `SEQ` (0–21) |
| `isPlaying` | bool | Mirrors `<audio>` play/pause for icon swap |
| `shouldPlayRef` | ref bool | **Intent flag.** Set true when user pressed play, kept across the `ended` → `pause` race so auto-advance survives |
| `curTime` | number | Current track elapsed seconds |
| `transitionState` | 'stable' \| 'outro' \| 'intro' | Drives CSS classes |
| `transitionKey` | number | Increments on each intro, keys the React fragment to replay CSS animations |
| `bloomKey` | number | Increments once per cycle at outro start (so the 2.9s arc keyed-replays once) |
| `transitionTriggeredRef` | ref bool | Prevents outro firing multiple times in a single track |
| `sampleSeekedRef` | ref bool | One-shot guard for the demo-mode sample seek |

### Crucial bug-fix: the `shouldPlayRef` pattern

HTML5 `<audio>` fires a synthetic `pause` event right before `ended` when a track finishes naturally. That `pause` event sets `isPlaying` to false. Without `shouldPlayRef`, the next track's load effect saw `isPlaying === false` and didn't autoplay → playback stopped after every track.

**Pattern:** keep a `useRef(true)` flag that represents the user's *intent* (set to true on play, false on explicit pause, never touched on natural end). The load effect plays the next track if `shouldPlayRef.current` is true, regardless of React state. Don't remove this.

```js
const shouldPlayRef = useRef(false);

// In load-on-idx-change effect:
audio.src = track.file;
audio.load();
if (shouldPlayRef.current) {
  const tryPlay = () => audio.play().catch(() => {});
  if (audio.readyState >= 2) tryPlay();
  else audio.addEventListener('canplay', tryPlay, { once: true });
}

// In onEnded:
if (idx < SEQ.length - 1) {
  shouldPlayRef.current = true;   // ← critical
  setIdx(i => i + 1);
  ...
}

// In togglePlay:
if (audio.paused) { shouldPlayRef.current = true;  audio.play(); }
else              { shouldPlayRef.current = false; audio.pause(); }
```

### Stage scale fit

The 1920×1080 stage is positioned absolute inside a 16:9 wrap. JS scales it via `transform: scale()`:

- **Default mode**: scale by width only — `transform: scale(wrap.clientWidth / 1920)`
- **Production mode**: contain inside the viewport, letterbox if needed:
  ```js
  const s = Math.min(vw / 1920, vh / 1080);
  const sw = 1920 * s, sh = 1080 * s;
  stage.style.transform = `translate(${(vw - sw) / 2}px, ${(vh - sh) / 2}px) scale(${s})`;
  ```

`ResizeObserver` on `wrap` + `fullscreenchange` listener + a burst refit `[50, 200, 500, 1000]ms` after the latter — fullscreen entry can complete in stages and `ResizeObserver` doesn't always catch the second resize.

---

## Design tokens

```css
--bg:       #0d0e13;     /* page background */
--panel:    #14161d;     /* controls / cards */
--line:     #23262f;     /* borders / dividers */
--ink:      #ecedf2;     /* primary text */
--ink-dim:  #8a8d99;     /* secondary text */
--accent:   #d4b483;     /* warm gold — H/MIX accent */

/* Stage palette (inside the 1920×1080 frame) */
stage-bg:        #0a0c14
stage-cream:     #f5ebd7   /* primary type on stage */
stage-cream-90:  rgba(245, 235, 215, 0.92)
stage-cream-75:  rgba(245, 235, 215, 0.75)
stage-cream-55:  rgba(245, 235, 215, 0.55)
deep-shadow:     0 6px 40px rgba(0,0,0,0.55)
text-shadow-title: 0 6px 40px rgba(0,0,0,0.55)
bloom-light:     rgba(255, 245, 220, 0.55) → transparent
```

### Typography

| Use | Family | Weight | Sizes |
|---|---|---|---|
| 日本語 titles | `Shippori Mincho`, `Hiragino Mincho ProN`, serif | 600–700 | 168, 92, 24, 18, 15 |
| EN editorial | `DM Serif Display`, Georgia, serif | 400 (italic for romaji subtitles) | 48, 34, 22 |
| UI / kickers / labels | `Inter`, system-ui | 400, 500, 600, 700 | 11–18 |
| Time codes | `JetBrains Mono`, monospace | 400, 500 | 11–16 |

Letter-spacing varies by role: 0.04em for body, 0.18em for cred-strip labels, 0.32–0.42em for kickers/uppercase labels.

### Spacing

Stage uses absolute positioning with these consistent insets:
- Corner crosshairs at 80px from edges
- Title slabs at 96px from left / right
- Bottom credits at 78px from bottom

Page chrome uses the standard scale: 14, 18, 24, 32, 56, 78, 96 px.

---

## Playlist data (`tracks.js`)

22 tracks, all composed by Hirokazu Akiyama (秋山 裕和) and licensed from H/MIX GALLERY (https://www.hmix.net/). Per the H/MIX terms, the composer + source must be credited in any uploaded video or page using these tracks. The credit lives both in the stage (composer line + bottom-right) and in the YouTube description.

Total: 3759 seconds (62:39). For the 2-hour YouTube version the spec is **record one pass, then concatenate twice in a video editor.** Don't loop in-browser for an hour — too many failure modes (memory, audio-context drift, etc).

---

## Backgrounds

`assets/bg/hoshi01–05.mp4` are seamlessly-looping 5-second 1920×1080 clips of the same hand-illustrated scene (woman + fox on a rooftop at night). Variant 5 has a flying bird mid-frame.

Mix weights (in `BG_VARIANTS` and `BG_SPECIAL_INTERVAL_SEC`):
- hoshi01: 50%
- hoshi02: 30%
- hoshi03: 20%
- hoshi05: every ~60s, replacing whatever would have been picked

The two-`<video>`-element preload pattern is what makes the hard-cut clean. Don't crossfade — the seamlessly-looping clips already match cleanly and a crossfade visibly washes out the cut.

---

## Behavior summary (for someone porting to a real framework)

1. On mount, set up the AudioContext + AnalyserNode lazily (must be a user gesture). The current code does this on first `togglePlay()` / first `START` button click.
2. Loading a track: set `audio.src = SEQ[idx].file`; `audio.load()`; if `shouldPlayRef.current`, play once `canplay` fires.
3. On `timeupdate`: if `audio.duration - audio.currentTime < 1.4` and not already transitioning and there's a next track → enter `outro` + bump `bloomKey`.
4. On `ended`: increment `idx`, set state to `intro`, set a 1.6s timer to return to `stable`. Hold `shouldPlayRef` true.
5. Re-render the right-side block with `key={transitionKey}` so CSS animations replay on every track change.
6. Background videos: `onEnded` on each `<video>` does the swap; preload-next happens with a 60ms delay so the new src loads asynchronously.

## Production-mode recording workflow (for the user)

This is documented in `README.md` (now `index.html`'s `.hint` banner). For Codex's awareness:

1. Open `index.html` over a local server
2. Click **本番モード** → goes fullscreen, shows START overlay
3. **Start OBS recording first**, then click START
4. Wait ~1h2m for the run to complete
5. `Esc` to exit
6. The user concatenates the recorded video twice in a video editor to make a 2-hour YouTube upload

The hint banner explains this in the page UI.

---

## Suggested next steps (if Codex is asked to extend)

- Move the playlist data into a JSON file with per-track BPM and a `chapter` field so chapter sections can introduce themselves
- Real waveform peaks: pre-render PCM peaks to a JSON file at build time instead of relying on Web Audio's live FFT. Slightly lower CPU.
- Per-track background tinting: each track could subtly shift the stage gradient hue (current is fixed deep navy)
- A genuinely seamless 2-hour mode: pre-decode + concatenate via Web Audio buffer chaining instead of `<audio>` element + src swap
- Volume normalization across tracks (current mp3s have varied LUFS levels)
- Speaker-notes-style "track up next" preview during the outro
- Move from CDN-loaded React+Babel to a proper Vite/Next setup if integrating into an existing site

## Notes on assets

- The MP3s are licensed from H/MIX GALLERY under their use terms. Re-use requires the composer credit; check current terms before bundling into any product.
- The video loop assets (hoshi01–05) came with the project; treat as proprietary unless told otherwise.
- The thumbnail and banner PNGs in `reference/` are 1280×720 rendered via canvas in this project; they are not the source for the player UI but are included as the brand-language reference and as drop-in YouTube/site assets.
