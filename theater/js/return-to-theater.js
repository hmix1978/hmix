/* ============================================================
   H/MIX THEATER — 近接で展開する「金のピル」ナビ（共通）
   ・劇場に戻る（全画面コンテンツ共通・右上）
   ・星図に戻る（コックピット中・左上）   ※tag-cockpitのみ
   ・操縦席へ戻る（景色の中・左上）        ※tag-cockpitのみ
   普段は気配だけ、マウスが近づくほど主張して展開（--p:0→1）。
   使い方: <script src="/theater/js/return-to-theater.js" defer></script>
   任意属性: data-href（戻り先・既定 "/theater/"）, data-label（既定 "劇場に戻る"）
   公開: window.HMIX_makeReturnPill(opts)
   ============================================================ */
(function () {
  if (window.__hmixTheaterReturn) return;
  window.__hmixTheaterReturn = true;

  function lang(){ try{ var v=window.HMIX_LANG||sessionStorage.getItem('hmix_lang')||localStorage.getItem('hmix_lang'); return v==='en'?'en':'ja'; }catch(e){ return window.HMIX_LANG==='en'?'en':'ja'; } }

  function ensureFont(){
    if (document.querySelector('link[data-htr-font]')) return;
    var fl = document.createElement('link');
    fl.rel = 'stylesheet'; fl.setAttribute('data-htr-font', '1');
    fl.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+JP:wght@400;500;700&display=swap';
    document.head.appendChild(fl);
  }

  function ensureCSS(){
    if (document.querySelector('style[data-htr]')) return;
    var css =
      '.htr-pill{' +
        'position:fixed; top:clamp(14px,1.8vw,24px); z-index:2147483600;' +
        'display:inline-flex; align-items:center; height:44px; padding:0 14px; box-sizing:border-box;' +
        'border-radius:24px; text-decoration:none; cursor:pointer; -webkit-tap-highlight-color:transparent;' +
        'font-family:"Noto Sans JP",system-ui,sans-serif; color:#e7ca7c; white-space:nowrap; overflow:hidden;' +
        '-webkit-backdrop-filter:blur(7px); backdrop-filter:blur(7px);' +
        'background:rgba(10,18,13,calc(.30 + .46*var(--p,0)));' +
        'border:1px solid rgba(202,164,78,calc(.28 + .62*var(--p,0)));' +
        'box-shadow:0 8px 28px -12px rgba(0,0,0,calc(.35 + .4*var(--p,0))), 0 0 calc(20px*var(--p,0)) rgba(202,164,78,calc(.5*var(--p,0)));' +
        'opacity:calc(.5 + .48*var(--p,0));' +
        'transition:opacity .35s ease, transform .35s ease, background .35s ease, border-color .35s ease, box-shadow .35s ease;' +
      '}' +
      '.htr-pill.htr-r{ right:clamp(16px,2.4vw,34px); transform-origin:top right; transform:scale(calc(1 + .06*var(--p,0))); }' +
      '.htr-pill.htr-l{ left:clamp(16px,2.4vw,34px); transform-origin:top left; transform:scale(calc(1 + .06*var(--p,0))); }' +
      '.htr-pill:hover, .htr-pill:focus-visible{ --p:1 !important; outline:none; }' +
      '.htr-pill .htr-ico{ flex:0 0 auto; font-size:16px; line-height:1; }' +
      '.htr-pill .htr-kicker{ flex:0 0 auto; font-family:"Bebas Neue",sans-serif; font-size:14px; letter-spacing:.22em;' +
        'margin-left:calc(9px*var(--p,0)); max-width:calc(130px*var(--p,0)); opacity:var(--p,0); overflow:hidden; color:#e7ca7c;' +
        'transition:max-width .45s cubic-bezier(.16,1,.3,1), opacity .35s ease, margin-left .45s ease;' +
      '}' +
      '.htr-pill .htr-label{ flex:0 0 auto; font-size:12.5px; font-weight:500; letter-spacing:.08em;' +
        'margin-left:calc(8px*var(--p,0)); max-width:calc(170px*var(--p,0)); opacity:var(--p,0); overflow:hidden; color:rgba(238,240,234,.92);' +
        'transition:max-width .45s cubic-bezier(.16,1,.3,1), opacity .35s ease, margin-left .45s ease;' +
      '}' +
      /* 文脈ピル: 状態で出し入れ（既定は隠す） */
      '#htr-cockpit, #htr-scene{ opacity:0; pointer-events:none; transform:translateY(-7px) scale(.98); }' +
      'body[data-mode="dock"]:not([data-scene="on"]) #htr-cockpit{ opacity:calc(.5 + .48*var(--p,0)); pointer-events:auto; transform:scale(calc(1 + .06*var(--p,0))); }' +
      'body[data-scene="on"] #htr-scene{ opacity:calc(.5 + .48*var(--p,0)); pointer-events:auto; transform:scale(calc(1 + .06*var(--p,0))); }' +
      /* 左肩に残るchromeは衝突回避で右へずらす */
      'body[data-mode="dock"] .cp-top .seg-l{ padding-left:58px; }' +
      'body[data-scene="on"] .sd-exits{ left:86px; }' +
      '@media (hover:none){ .htr-pill{ --p:1; } }' +
      '@media print{ .htr-pill{ display:none; } }';
    var st = document.createElement('style'); st.setAttribute('data-htr', '1'); st.textContent = css;
    document.head.appendChild(st);
  }

  // opts: {id, side:'right'|'left', href?, onClick?, icon, kicker, label, labelEn}
  window.HMIX_makeReturnPill = function (opts) {
    opts = opts || {};
    ensureFont(); ensureCSS();
    if (opts.id && document.getElementById(opts.id)) return document.getElementById(opts.id);
    var sideCls = opts.side === 'left' ? 'htr-l' : 'htr-r';
    var el = opts.href ? document.createElement('a') : document.createElement('button');
    el.className = 'htr-pill ' + sideCls;
    if (opts.id) el.id = opts.id;
    if (opts.href) { el.href = opts.href; } else { el.type = 'button'; }
    el.style.setProperty('--p', '0');
    function curLabel(){ return (lang() === 'en' && opts.labelEn) ? opts.labelEn : opts.label; }
    function render(){
      var lb = curLabel();
      el.setAttribute('aria-label', lb);
      el.innerHTML =
        '<span class="htr-ico" aria-hidden="true">' + (opts.icon || '◂') + '</span>' +
        (opts.kicker ? '<span class="htr-kicker" aria-hidden="true">' + opts.kicker + '</span>' : '') +
        '<span class="htr-label">' + lb + '</span>';
    }
    render();
    if (opts.onClick) el.addEventListener('click', function (e) { if (!opts.href) e.preventDefault(); opts.onClick(e); });
    document.body.appendChild(el);
    window.addEventListener('hmix:lang', render);
    // 近接で主張（固定位置なので端基準で安定して測る）
    var rFar = 780, rNear = 110, raf = 0;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = el.getBoundingClientRect();
        var cx = (sideCls === 'htr-l') ? (r.left + 22) : (r.right - 22);
        var cy = r.top + r.height / 2;
        var d = Math.hypot(e.clientX - cx, e.clientY - cy);
        var p = d <= rNear ? 1 : (d >= rFar ? 0 : (rFar - d) / (rFar - rNear));
        el.style.setProperty('--p', p.toFixed(3));
      });
    }, { passive: true });
    return el;
  };

  function boot() {
    var cur = document.currentScript || (function () {
      var s = document.querySelectorAll('script[src*="return-to-theater"]'); return s[s.length - 1];
    })();
    var href = (cur && cur.getAttribute('data-href')) || '/theater/';
    var label = (cur && cur.getAttribute('data-label')) || '劇場に戻る';
    var labelEn = (cur && cur.getAttribute('data-label-en')) || (label === '劇場に戻る' ? 'Back to theater' : label);

    // 1) 劇場に戻る（全コンテンツ共通・右上）
    window.HMIX_makeReturnPill({ id: 'hmix-theater-return', side: 'right', href: href, icon: '◂', kicker: 'THEATER', label: label, labelEn: labelEn });

    // 2) tag-cockpit のみ: 星図に戻る / 操縦席へ戻る（左上・文脈で出現）
    if (document.getElementById('sceneDive')) {
      window.HMIX_makeReturnPill({ id: 'htr-cockpit', side: 'left', icon: '◂', kicker: 'STAR MAP', label: '星図に戻る', labelEn: 'To star map',
        onClick: function(){ if (window.__back) window.__back(); } });
      window.HMIX_makeReturnPill({ id: 'htr-scene', side: 'left', icon: '◂', kicker: 'COCKPIT', label: '操縦席へ戻る', labelEn: 'To cockpit',
        onClick: function(){ if (window.__toCockpit) window.__toCockpit(); } });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
