/* =============================================================
   HOWTO SCROLL — スクロール連動アニメ
     - 章が視界に入ったら is-visible クラスを付与
     - 中央の道 (SVG) をスクロール位置に応じて描画
     - 粒子をランダム生成
     - タイトル文字を1字ずつ分割して波状にフェードイン

   PJAX 対応 (2026-04-27):
     hmix:page:init / hmix:page:before-leave で再初期化・破棄を実施。
     旧版は IIFE 一回実行のみで、PJAX 戻り時にタイトルと縦線だけ残る不具合があった。
   ============================================================= */
(function() {
  'use strict';

  var _io = null;
  var _onScroll = null;

  function init() {
    var section = document.getElementById('howto-scroll');
    if (!section) return;
    if (section.dataset.hsInit === '1') return; // 二重初期化防止
    section.dataset.hsInit = '1';

    /* ---------- 1. タイトルを1字ずつ span 化 ---------- */
    var titleEls = section.querySelectorAll('.hs-title .hs-split');
    titleEls.forEach(function(el) {
      // 既に分割済み (再初期化時) はスキップ
      if (el.querySelector('.hs-char')) return;
      var text = el.textContent;
      el.textContent = '';
      text.split('').forEach(function(ch, i) {
        if (ch === ' ' || ch === '　') {
          el.appendChild(document.createTextNode(ch));
          return;
        }
        var span = document.createElement('span');
        span.className = 'hs-char';
        span.style.setProperty('--delay', (i * 0.06) + 's');
        span.textContent = ch;
        el.appendChild(span);
      });
    });

    /* ---------- 2. 粒子をランダム配置 ---------- */
    var particles = section.querySelector('.hs-particles');
    if (particles) {
      // 再初期化時は古い粒子をクリア
      particles.innerHTML = '';
      var DOT_COUNT = 22;
      for (var i = 0; i < DOT_COUNT; i++) {
        var dot = document.createElement('span');
        dot.className = 'hs-dot';
        dot.style.left = Math.random() * 100 + '%';
        dot.style.top  = Math.random() * 100 + '%';
        var size = 2 + Math.random() * 3;
        dot.style.width  = size + 'px';
        dot.style.height = size + 'px';
        dot.style.setProperty('--dx', (Math.random() * 30 - 15) + 'px');
        dot.style.setProperty('--dy', (15 + Math.random() * 30) + 'px');
        dot.style.setProperty('--dur', (7 + Math.random() * 7) + 's');
        dot.style.setProperty('--delay', (Math.random() * 5) + 's');
        particles.appendChild(dot);
      }
    }

    /* ---------- 3. 章のフェードイン (IntersectionObserver) ---------- */
    var chapters = section.querySelectorAll('.hs-chapter');
    var gate     = section.querySelector('.hs-gate');
    var pathNodes = section.querySelectorAll('.hs-path-node');

    if ('IntersectionObserver' in window) {
      _io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          _io.unobserve(entry.target);
        });
      }, { threshold: 0.25, rootMargin: '0px 0px -60px 0px' });

      chapters.forEach(function(ch) { _io.observe(ch); });
      if (gate) _io.observe(gate);
      pathNodes.forEach(function(node) { _io.observe(node); });
    } else {
      chapters.forEach(function(ch) { ch.classList.add('is-visible'); });
      if (gate) gate.classList.add('is-visible');
      pathNodes.forEach(function(n) { n.classList.add('is-active'); });
    }

    /* ---------- 4. 中央の道を描画 (スクロール位置に応じて) ---------- */
    var pathLine = section.querySelector('.hs-path-line');
    if (pathLine && typeof pathLine.getTotalLength === 'function') {
      var len = pathLine.getTotalLength();
      pathLine.style.setProperty('--path-length', len);
      pathLine.style.strokeDasharray = '4 6';
    }

    /* ---------- 5. スクロール連動: 道の濃さとノードのアクティブ化 ---------- */
    var ticking = false;
    _onScroll = function() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function() {
        var rect = section.getBoundingClientRect();
        var vh = window.innerHeight;
        var progress = 0;
        if (rect.top < vh && rect.bottom > 0) {
          var total = rect.height;
          var passed = Math.max(0, vh - rect.top);
          progress = Math.min(1, passed / total);
        }
        if (pathLine) {
          pathLine.style.opacity = (0.2 + progress * 0.6).toFixed(3);
        }
        pathNodes.forEach(function(n, idx) {
          var trigger = (idx + 1) / (pathNodes.length + 1);
          if (progress >= trigger - 0.1) n.classList.add('is-active');
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', _onScroll, { passive: true });
    _onScroll();
  }

  function destroy() {
    // IntersectionObserver と scroll listener を解除して GC される元の DOM への参照を断つ
    if (_io) {
      try { _io.disconnect(); } catch (e) {}
      _io = null;
    }
    if (_onScroll) {
      window.removeEventListener('scroll', _onScroll);
      _onScroll = null;
    }
  }

  // 公開 API
  window.HMIX_INIT_HOWTO_SCROLL = init;

  // 初回ロード
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // PJAX: 遷移開始時に破棄、コンテンツ差し替え後に再初期化
  window.addEventListener('hmix:page:before-leave', destroy);
  window.addEventListener('hmix:page:init', function() { init(); });

})();
