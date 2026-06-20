/**
 * H/MIX GALLERY — site-history.js
 * "記憶の回廊" — scroll-linked horizontal gallery
 *
 * PJAX 対応:
 *   hmix:page:before-leave → destroy() でリスナー解除
 *   hmix:page:init         → init()   で DOM 再取得・再起動
 */
(function () {
  'use strict';

  // ─── アクティブなリスナー参照（teardown 用）
  var _scrollHandler = null;
  var _resizeHandler = null;

  // ─── 解除：遷移前 or 再初期化前に必ず呼ぶ ──────────────────────────────
  function destroy() {
    if (_scrollHandler) {
      window.removeEventListener('scroll', _scrollHandler);
      _scrollHandler = null;
    }
    if (_resizeHandler) {
      window.removeEventListener('resize', _resizeHandler);
      _resizeHandler = null;
    }
  }

  // ─── 初期化：毎回 DOM を取り直して登録する ─────────────────────────────
  function init() {
    destroy(); // 前回インスタンスのリスナーをクリア

    // DOM 取得（存在しないページでは何もしない）
    var section = document.getElementById('site-history');
    if (!section) return;

    var track    = document.getElementById('sh-track');
    var cards    = Array.prototype.slice.call(section.querySelectorAll('.sh-card'));
    var dots     = Array.prototype.slice.call(section.querySelectorAll('.sh-dot'));
    var headerEl = section.querySelector('.sh-header');
    var finaleEl = section.querySelector('.sh-finale');

    if (!track || cards.length === 0) return;

    var CARD_COUNT = cards.length;
    var cardW   = 0;
    var gapW    = 180;
    var spacing = 0;
    var stageW  = 0;
    var ticking = false;

    // ── ユーティリティ ──────────────────────────────────────────────────
    function smoothstep(t) {
      t = Math.max(0, Math.min(1, t));
      return t * t * (3 - 2 * t);
    }

    function measure() {
      var stage = section.querySelector('.sh-stage');
      stageW = stage ? stage.offsetWidth : window.innerWidth;
      cardW  = cards[0] ? cards[0].offsetWidth : 700;

      var computed = window.getComputedStyle(track);
      var cg = parseFloat(computed.columnGap || computed.gap);
      gapW = isNaN(cg) || cg === 0 ? 180 : cg;
      spacing = cardW + gapW;
    }

    // ── メインアップデート ──────────────────────────────────────────────
    function update() {
      ticking = false;

      var scrollY    = window.scrollY || window.pageYOffset;
      var panelH     = window.innerHeight;
      var sectionTop = section.getBoundingClientRect().top + scrollY;
      var scrollable = section.offsetHeight - panelH;
      var progress   = scrollable > 0
        ? Math.max(0, Math.min(1, (scrollY - sectionTop) / scrollable))
        : 0;

      /* Track translation: card[0] centred at 0, card[N-1] centred at 1 */
      var totalTravel = spacing * (CARD_COUNT - 1);
      var tx = (stageW / 2 - cardW / 2) - progress * totalTravel;
      track.style.transform = 'translateX(' + tx.toFixed(2) + 'px)';

      var activeDot = 0;
      var maxProx   = 0;

      cards.forEach(function (card, i) {
        var cardCenter = tx + i * spacing + cardW / 2;
        var dist       = Math.abs(cardCenter - stageW / 2);

        /* Scale: 1.0 (far) → 1.20 (centre) */
        var proximity = Math.max(0, 1 - dist / (spacing * 0.72));
        var scale     = 1 + 0.20 * proximity;
        card.style.transform = 'scale(' + scale.toFixed(4) + ')';

        /* Cinematic filter */
        var img = card.querySelector('.sh-screenshot');
        if (img) {
          var proxSmooth = smoothstep(proximity);
          var bright = 0.35 + 0.65 * proxSmooth;
          var sepia  = 0.5  * (1 - proxSmooth);
          img.style.filter = 'brightness(' + bright.toFixed(3) + ') sepia(' + sepia.toFixed(3) + ') contrast(1.05)';
        }

        /* is-center: CSS glow + breath */
        card.classList.toggle('is-center', proximity > 0.68);

        /* Era text fade */
        var era = card.querySelector('.sh-era');
        if (era) {
          var eraT = smoothstep(Math.max(0, 1 - dist / (spacing * 0.38)));
          era.style.opacity   = eraT;
          era.style.transform = 'translateY(' + ((1 - eraT) * 14).toFixed(1) + 'px)';
        }

        if (proximity > maxProx) { maxProx = proximity; activeDot = i; }
      });

      /* Dots */
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === activeDot && maxProx > 0.45);
      });

      /* Title */
      if (headerEl) {
        var entry = Math.max(0, 1 - progress * 2.5);
        headerEl.style.opacity = (0.58 + 0.42 * smoothstep(entry)).toFixed(3);
      }

      /* Finale */
      if (finaleEl) {
        var fp = smoothstep(Math.max(0, (progress - 0.82) / 0.18));
        finaleEl.style.opacity   = fp.toFixed(3);
        finaleEl.style.transform = 'translateY(' + ((1 - fp) * 18).toFixed(1) + 'px)';
      }
    }

    // ── イベント登録（参照を保存して teardown 可能にする）──────────────
    _scrollHandler = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    _resizeHandler = function () {
      measure();
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', _scrollHandler, { passive: true });
    window.addEventListener('resize', _resizeHandler);

    // 初回描画
    measure();
    requestAnimationFrame(update);
  }

  // ─── 2フレーム遅延させてから初期化（DOM反映・レイアウト確定を待つ） ─────
  function initSafe() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        init();
      });
    });
  }

  // ─── 公開 API（app.js から任意で呼べる）
  window.HMIX_INIT_SITE_HISTORY = initSafe;

  // ─── 初回ロード ──────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSafe);
  } else {
    initSafe();
  }

  // ─── PJAX: 遷移開始時にリスナー解除 ─────────────────────────────────
  window.addEventListener('hmix:page:before-leave', destroy);

  // ─── PJAX: コンテンツ差し替え完了後に再起動 ─────────────────────────
  window.addEventListener('hmix:page:init', function () {
    // ページ遷移時は確実に 2フレーム待ってから寸法を測る
    initSafe();
  });

})();
