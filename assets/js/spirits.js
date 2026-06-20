/**
 * H/MIX GALLERY — Spirits Layer  v1.0
 * 精霊・蛍・光の粒 / 浮遊する背景演出
 *
 * z-index 構造:
 *   body background (#0b1510)
 *   └─ #scene-bg      (fixed, z-index:1) ← scenic image
 *   └─ content sections (z-index:2)      ← UI
 *   └─ #spirits-canvas (fixed, z-index:3) ← spirits（コンテンツ上に重なるが pointer-events:none）
 *   └─ global player  (z-index:1200)     ← player
 *
 * パフォーマンス設計:
 *   - 22fps に絞って描画負荷を最小化
 *   - shadowBlur で GPU合成を使いぼやけた発光を表現
 *   - visibilitychange で非表示時は停止
 *   - prefers-reduced-motion で全停止
 */
(function () {
  'use strict';

  /* ── 前提チェック ─────────────────────────────── */
  if (!document.body.classList.contains('library-page--dark')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── Canvas セットアップ ──────────────────────── */
  var canvas = document.createElement('canvas');
  canvas.id = 'spirits-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position:fixed',
    'top:0', 'left:0',
    'width:100%', 'height:100%',
    'pointer-events:none',
    'z-index:3',           /* content (z-index:2) の上 / player (z-index:1200) の下 */
  ].join(';');

  /* scene-bg の直後に挿入 → z-index 同値でも後順なので scene-bg の上 */
  var sceneBg = document.getElementById('scene-bg');
  if (sceneBg) {
    sceneBg.insertAdjacentElement('afterend', canvas);
  } else {
    document.body.insertBefore(canvas, document.body.firstChild);
  }

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;
  var spirits = [];
  var rafId = null;
  var lastTime = 0;
  var FRAME_MS = 1000 / 22;   /* ~22fps — 精霊の動きはゆったりで十分 */

  /* ── カラーパレット ─────────────────────────────
     翡翠グリーン 70% / ランタンゴールド 30%          */
  var PALETTE = [
    [126, 203, 149],   /* 翡翠 */
    [154, 223, 180],   /* 明翡翠 */
    [200, 245, 218],   /* 白翡翠 — 高輝度ハイライト */
    [126, 203, 149],
    [196, 164,  69],   /* ランタン金 */
    [225, 196, 100],   /* 明金 */
    [245, 225, 150],   /* 白金 — 高輝度ハイライト */
  ];

  /* ── 深度レイヤー定義 ───────────────────────────
     奥(far)・中景(mid)・手前(near) の 3 層で奥行きを表現。
     count: 粒子数 / sz: サイズ範囲 / spd: 上昇速度 / op: 不透明度範囲  */
  var LAYERS = [
    { count: 15, sz: [1.0, 1.8], spd: [0.022, 0.052], op: [0.20, 0.45] },  /* far  */
    { count: 11, sz: [1.6, 2.8], spd: [0.050, 0.090], op: [0.35, 0.62] },  /* mid  */
    { count:  7, sz: [2.5, 4.2], spd: [0.075, 0.135], op: [0.50, 0.80] },  /* near */
  ];

  /* ── Spirit クラス ──────────────────────────────*/
  function Spirit(layer, initial) {
    this.L = layer;
    this.reset(initial);
  }

  Spirit.prototype.reset = function (initial) {
    var L = this.L;
    this.x          = Math.random() * W;
    this.y          = initial ? Math.random() * (H * 1.1) : H + 14;
    this.size       = L.sz[0]  + Math.random() * (L.sz[1]  - L.sz[0]);
    this.vy         = -(L.spd[0] + Math.random() * (L.spd[1] - L.spd[0]));
    this.vx         = (Math.random() - 0.5) * 0.045;
    this.driftAmp   = 0.055 + Math.random() * 0.155;
    this.driftFreq  = 0.0025 + Math.random() * 0.005;
    this.driftPhase = Math.random() * Math.PI * 2;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpd   = 0.009 + Math.random() * 0.016;
    this.baseOp     = L.op[0]  + Math.random() * (L.op[1]  - L.op[0]);
    var c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    this.r = c[0]; this.g = c[1]; this.b = c[2];
    this.blurR = this.size * (6 + Math.random() * 8);  /* 発光半径を大きく */
  };

  Spirit.prototype.update = function () {
    this.driftPhase += this.driftFreq;
    this.pulsePhase += this.pulseSpd;
    this.x  += this.vx + Math.sin(this.driftPhase) * this.driftAmp;
    this.y  += this.vy;
    this.op  = this.baseOp * (0.58 + 0.42 * Math.sin(this.pulsePhase));
    if (this.y < -(this.size * 10)) this.reset(false);
  };

  Spirit.prototype.draw = function (c) {
    /* 外側の大きなグロー */
    c.shadowBlur  = this.blurR;
    c.shadowColor = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + Math.min(this.op * 2.5, 0.92) + ')';
    c.fillStyle   = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.op + ')';
    c.beginPath();
    c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    c.fill();
    /* 中心の明るいコア — 小さく白に近い点 */
    c.shadowBlur  = this.blurR * 0.3;
    c.shadowColor = 'rgba(255,255,255,' + Math.min(this.op * 1.2, 0.6) + ')';
    c.fillStyle   = 'rgba(255,255,255,' + Math.min(this.op * 0.8, 0.5) + ')';
    c.beginPath();
    c.arc(this.x, this.y, this.size * 0.35, 0, Math.PI * 2);
    c.fill();
  };

  /* ── 初期化 ─────────────────────────────────────*/
  function init() {
    resize();
    spirits = [];
    LAYERS.forEach(function (L) {
      for (var i = 0; i < L.count; i++) {
        spirits.push(new Spirit(L, true));
      }
    });
    rafId = requestAnimationFrame(loop);
  }

  /* ── メインループ ───────────────────────────────*/
  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    if (ts - lastTime < FRAME_MS) return;
    lastTime = ts - ((ts - lastTime) % FRAME_MS);

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    spirits.forEach(function (s) { s.update(); s.draw(ctx); });
    ctx.restore();
  }

  /* ── リサイズ対応 ───────────────────────────────*/
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── 省電力: タブ非アクティブ時に停止 ─────────*/
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      lastTime = 0;
      rafId = requestAnimationFrame(loop);
    }
  });

  window.addEventListener('resize', resize, { passive: true });

  init();
})();
