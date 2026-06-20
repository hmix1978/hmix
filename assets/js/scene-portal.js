/**
 * H/MIX GALLERY — scene-portal.js
 * 8-scene section: hover時にカード画像をセクション背景へクロスフェード
 *
 * PJAX 対応 (2026-04-27):
 *   hmix:page:init で再初期化。旧版は IIFE 一回実行のみで、PJAX 戻り後に
 *   ホバー背景チェンジが効かなくなる不具合があった。
 */
(function () {
  'use strict';

  var _handlers = []; // [{el, handler}] - PJAX before-leave で剥がす用

  function init() {
    var section = document.getElementById('featured-scenes');
    if (!section) return;

    /* タッチ専用デバイスは無効（hover不可） */
    if (!window.matchMedia('(hover: hover)').matches) return;

    var cards  = Array.prototype.slice.call(
      section.querySelectorAll('.featured-scene-card[data-bg]')
    );
    var layers = Array.prototype.slice.call(
      section.querySelectorAll('.fs-bg-layer')
    );

    if (cards.length === 0 || layers.length < 2) return;

    var active  = 0;   /* 現在表示中のレイヤー番号 (0 or 1) */
    var current = '/images/library-bg.webp';  /* デフォルト: 図書館背景 */

    function switchBg(src) {
      if (src === current) return;
      current = src;

      var next = active === 0 ? 1 : 0;

      layers[next].style.backgroundImage = 'url("' + src + '")';
      layers[next].classList.add('is-active');
      layers[active].classList.remove('is-active');

      active = next;
    }

    cards.forEach(function (card) {
      var handler = function () { switchBg(card.dataset.bg); };
      card.addEventListener('mouseenter', handler);
      _handlers.push({ el: card, handler: handler });
    });
  }

  function destroy() {
    _handlers.forEach(function (h) {
      try { h.el.removeEventListener('mouseenter', h.handler); } catch (e) {}
    });
    _handlers = [];
  }

  window.HMIX_INIT_SCENE_PORTAL = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('hmix:page:before-leave', destroy);
  window.addEventListener('hmix:page:init', function () { init(); });

})();
