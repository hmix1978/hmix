/**
 * H/MIX GALLERY — composer.js
 * Composerページ専用の初期化・クリーンアップ。
 * プレイヤーには一切触れない。
 */
(function () {
  'use strict';

  var _observer = null;
  var _heroTimer = null;

  function destroyComposer() {
    if (_observer) {
      _observer.disconnect();
      _observer = null;
    }
    if (_heroTimer) {
      clearTimeout(_heroTimer);
      _heroTimer = null;
    }
  }

  function initScrollAnime() {
    // 多重 init 安全化: 既存リソースを必ず先に解放
    destroyComposer();

    var viewH = window.innerHeight;

    _observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    // PJAX後はレイアウト計算が間に合わず IntersectionObserver が発火しないことがある。
    // すでにビューポート内にある要素は即座に is-visible を付与し、
    // ビューポート外のものは Observer に委ねる。
    document.querySelectorAll('.reveal, .reveal-up, .reveal-blur')
      .forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < viewH - 50 && rect.bottom > 0) {
          el.classList.add('is-visible');
        } else {
          _observer.observe(el);
        }
      });

    _heroTimer = setTimeout(function () {
      document.querySelectorAll('.composer-hero__inner')
        .forEach(function (el) { el.classList.add('is-visible'); });
      _heroTimer = null;
    }, 100);
  }

  window.HMIX_INIT_COMPOSER = function () {
    // Composerページ上でなければ何もしない（二重init防止）
    if (!document.querySelector('[data-page-type="composer"]')) return;
    initScrollAnime();
  };

  // PJAX離脱時: ページ問わず常に解除（idempotent）
  window.addEventListener('hmix:page:before-leave', destroyComposer);

  // 直接アクセス時の初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.querySelector('[data-page-type="composer"]')) window.HMIX_INIT_COMPOSER();
    });
  } else {
    if (document.querySelector('[data-page-type="composer"]')) window.HMIX_INIT_COMPOSER();
  }

})();
