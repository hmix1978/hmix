/* ============================================================
   H/MIX THEATER — 「劇場に戻る」共通ボタン
   全画面コンテンツ（夜風・星の旅 等）に同一の見た目・位置で差し込む。
   中の世界観/フォントに左右されない劇場側のUI。右上固定・最前面。
   普段は静かに気配だけ、マウスが近づくほど主張して展開する（金のピル）。
   使い方: <script src="/theater/js/return-to-theater.js" defer></script>
   任意属性: data-href（戻り先・既定 "/theater/"）, data-label（既定 "劇場に戻る"）
   ============================================================ */
(function () {
  if (window.__hmixTheaterReturn) return;
  window.__hmixTheaterReturn = true;

  function boot() {
    if (document.getElementById('hmix-theater-return')) return;

    var cur = document.currentScript || (function () {
      var s = document.querySelectorAll('script[src*="return-to-theater"]'); return s[s.length - 1];
    })();
    var href = (cur && cur.getAttribute('data-href')) || '/theater/';
    var label = (cur && cur.getAttribute('data-label')) || '劇場に戻る';

    // 劇場のフォント（中ページに無くても揃うよう読み込む）
    if (!document.querySelector('link[data-htr-font]')) {
      var fl = document.createElement('link');
      fl.rel = 'stylesheet'; fl.setAttribute('data-htr-font', '1');
      fl.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+JP:wght@400;500;700&display=swap';
      document.head.appendChild(fl);
    }

    var css =
      '#hmix-theater-return{' +
        'position:fixed; top:clamp(14px,1.8vw,24px); right:clamp(16px,2.4vw,34px); z-index:2147483600;' +
        'display:inline-flex; align-items:center; height:44px; padding:0 14px; box-sizing:border-box;' +
        'border-radius:24px; text-decoration:none; cursor:pointer; -webkit-tap-highlight-color:transparent;' +
        'font-family:"Noto Sans JP",system-ui,sans-serif; color:#e7ca7c; white-space:nowrap; overflow:hidden;' +
        '-webkit-backdrop-filter:blur(7px); backdrop-filter:blur(7px);' +
        'background:rgba(10,18,13,calc(.30 + .46*var(--p,0)));' +
        'border:1px solid rgba(202,164,78,calc(.28 + .62*var(--p,0)));' +
        'box-shadow:0 8px 28px -12px rgba(0,0,0,calc(.35 + .4*var(--p,0))), 0 0 calc(20px*var(--p,0)) rgba(202,164,78,calc(.5*var(--p,0)));' +
        'opacity:calc(.5 + .48*var(--p,0)); transform:scale(calc(1 + .06*var(--p,0))); transform-origin:top right;' +
        'transition:opacity .35s ease, transform .35s ease, background .35s ease, border-color .35s ease, box-shadow .35s ease;' +
      '}' +
      '#hmix-theater-return:hover, #hmix-theater-return:focus-visible{ --p:1 !important; outline:none; }' +
      '#hmix-theater-return .htr-ico{ flex:0 0 auto; font-size:16px; line-height:1; }' +
      '#hmix-theater-return .htr-kicker{ flex:0 0 auto; font-family:"Bebas Neue",sans-serif; font-size:14px; letter-spacing:.22em;' +
        'margin-left:calc(9px*var(--p,0)); max-width:calc(96px*var(--p,0)); opacity:var(--p,0); overflow:hidden;' +
        'transition:max-width .45s cubic-bezier(.16,1,.3,1), opacity .35s ease, margin-left .45s ease; color:#e7ca7c;' +
      '}' +
      '#hmix-theater-return .htr-label{ flex:0 0 auto; font-size:12.5px; font-weight:500; letter-spacing:.08em;' +
        'margin-left:calc(8px*var(--p,0)); max-width:calc(120px*var(--p,0)); opacity:var(--p,0); overflow:hidden;' +
        'color:rgba(238,240,234,.92);' +
        'transition:max-width .45s cubic-bezier(.16,1,.3,1), opacity .35s ease, margin-left .45s ease;' +
      '}' +
      '@media (hover:none){ #hmix-theater-return{ --p:1; } }' +
      '@media print{ #hmix-theater-return{ display:none; } }';

    var st = document.createElement('style'); st.setAttribute('data-htr', '1'); st.textContent = css;
    document.head.appendChild(st);

    var a = document.createElement('a');
    a.id = 'hmix-theater-return';
    a.href = href;
    a.setAttribute('aria-label', label);
    a.style.setProperty('--p', '0');
    a.innerHTML =
      '<span class="htr-ico" aria-hidden="true">◂</span>' +
      '<span class="htr-kicker" aria-hidden="true">THEATER</span>' +
      '<span class="htr-label">' + label + '</span>';
    document.body.appendChild(a);

    // マウス接近で主張（右上固定なので右端・上端基準で安定して測る）
    // 遠い段階から反応させ、気づかれやすくする（rFar を大きく）。
    var rFar = 780, rNear = 110, raf = 0;
    function setP(p) { a.style.setProperty('--p', p.toFixed(3)); }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = a.getBoundingClientRect();
        var cx = r.right - 22, cy = r.top + r.height / 2;   // 展開しても動かない基準点
        var d = Math.hypot(e.clientX - cx, e.clientY - cy);
        var p = d <= rNear ? 1 : (d >= rFar ? 0 : (rFar - d) / (rFar - rNear));
        setP(p);
      });
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
