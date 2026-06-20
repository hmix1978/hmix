/**
 * H/MIX GALLERY — tutorial.js
 * 段階的チュートリアル：機能の存在を"気配"として見せる
 *
 * Step 1: お気に入り — 「心に留める」
 * Step 2: シアターモード — 「この曲の内側へ。」
 * Step 3: 足跡 — 「この余韻に、ひとこと。」（FEATURE_DISABLED 時はスキップ）
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'hmix_tutorial_v1';
  var SESSION_TIMEOUT = 30 * 60 * 1000; // 30分

  // ── 状態管理 ──────────────────────────────────────────
  var _state = null;
  var _initialized = false;
  var _activeHint = null;
  var _timers = [];

  function _loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function _saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    } catch (e) {}
  }

  function _defaultState() {
    return {
      version: 1,
      sessionCount: 0,
      lastActiveAt: 0,
      completedSteps: {
        favorite: false,
        theater: false,
        footprint: false
      },
      shownInCurrentSession: {
        favorite: false,
        theater: false,
        footprint: false
      }
    };
  }

  function _initState() {
    _state = _loadState() || _defaultState();
    // セッション判定
    var now = Date.now();
    if (now - _state.lastActiveAt > SESSION_TIMEOUT) {
      _state.sessionCount++;
      _state.shownInCurrentSession = { favorite: false, theater: false, footprint: false };
    }
    _state.lastActiveAt = now;
    _saveState();
  }

  // 他タブ同期
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        var other = JSON.parse(e.newValue);
        if (other.completedSteps) {
          _state.completedSteps = other.completedSteps;
        }
      } catch (err) {}
    }
  });

  // ── ヒントUI ──────────────────────────────────────────
  function _clearTimers() {
    _timers.forEach(function (t) { clearTimeout(t); });
    _timers = [];
  }

  function _removeHint() {
    if (_activeHint && _activeHint.parentNode) {
      _activeHint.classList.remove('is-visible');
      setTimeout(function () {
        if (_activeHint && _activeHint.parentNode) {
          _activeHint.parentNode.removeChild(_activeHint);
        }
        _activeHint = null;
      }, 800);
    }
  }

  function _showHint(anchor, text, stepId, options) {
    if (_activeHint) return; // 同時に1つだけ
    if (!anchor) return;

    options = options || {};
    var hint = document.createElement('div');
    hint.className = 'tutorial-hint';
    hint.setAttribute('role', 'status');
    hint.setAttribute('aria-live', 'polite');
    hint.innerHTML = '<div class="tutorial-hint__bubble">' + _esc(text) + '</div>';

    // 位置決定
    var parent = anchor.offsetParent || anchor.parentElement;
    if (!parent) return;
    // relative 化されていなければ設定
    var pStyle = getComputedStyle(parent);
    if (pStyle.position === 'static') parent.style.position = 'relative';

    var rect = anchor.getBoundingClientRect();
    var parentRect = parent.getBoundingClientRect();

    hint.style.left = (rect.left - parentRect.left + rect.width / 2) + 'px';
    hint.style.transform = 'translateX(-50%) translateY(6px)';

    if (options.position === 'above') {
      hint.style.bottom = (parentRect.bottom - rect.top + 8) + 'px';
      hint.style.top = 'auto';
    } else {
      hint.style.top = (rect.bottom - parentRect.top + 8) + 'px';
    }

    parent.appendChild(hint);
    _activeHint = hint;

    // パルスアニメーション on anchor
    if (options.pulse) {
      anchor.classList.add('tutorial-pulse');
      setTimeout(function () { anchor.classList.remove('tutorial-pulse'); }, 2500);
    }

    // フェードイン
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hint.classList.add('is-visible');
      });
    });

    // 自動フェードアウト（8秒後）
    var autoHide = setTimeout(function () {
      _removeHint();
    }, 8000);
    _timers.push(autoHide);

    // GA4（将来用のフック）
    _sendEvent('tutorial_impression', stepId);
  }

  function _showComplete(anchor, text, stepId) {
    _removeHint();
    if (!anchor) return;

    var hint = document.createElement('div');
    hint.className = 'tutorial-hint tutorial-hint--complete';
    hint.innerHTML = '<div class="tutorial-hint__bubble">' + _esc(text) + '</div>';

    var parent = anchor.offsetParent || anchor.parentElement;
    if (!parent) return;
    var pStyle = getComputedStyle(parent);
    if (pStyle.position === 'static') parent.style.position = 'relative';

    var rect = anchor.getBoundingClientRect();
    var parentRect = parent.getBoundingClientRect();
    hint.style.left = (rect.left - parentRect.left + rect.width / 2) + 'px';
    hint.style.transform = 'translateX(-50%) translateY(6px)';
    hint.style.top = (rect.bottom - parentRect.top + 8) + 'px';

    parent.appendChild(hint);
    _activeHint = hint;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hint.classList.add('is-visible');
      });
    });

    var t = setTimeout(function () {
      _removeHint();
    }, 2500);
    _timers.push(t);

    _sendEvent('tutorial_complete', stepId);
  }

  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── GA4 送信（将来用、今は空） ────────────────────────
  function _sendEvent(eventName, stepId) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        step_id: stepId,
        session_count: _state ? _state.sessionCount : 0
      });
    }
  }

  // ── Step 1: お気に入り ────────────────────────────────
  function _tryFavoriteHint() {
    if (!_state) return;
    if (_state.completedSteps.favorite) return;
    if (_state.shownInCurrentSession.favorite) return;
    if (_state.sessionCount > 2) return; // 1-2回目のみ

    // お気に入り未使用チェック
    try {
      var favs = JSON.parse(localStorage.getItem('hmix_favorites') || '[]');
      if (favs.length > 0) {
        _state.completedSteps.favorite = true;
        _saveState();
        return;
      }
    } catch (e) {}

    // 再生開始を待つ
    var onPlay = function () {
      window.removeEventListener('hmix:player:play', onPlay);
      var delay = 10000 + Math.random() * 5000; // 10-15秒
      var t = setTimeout(function () {
        if (_activeHint) return;
        if (_state.shownInCurrentSession.favorite) return;

        // ♡ボタンを探す
        var favBtn = document.getElementById('player-btn-fav');
        if (!favBtn) return;

        _state.shownInCurrentSession.favorite = true;
        _saveState();
        _showHint(favBtn, '心に留める', 'favorite', { pulse: true, position: 'above' });
      }, delay);
      _timers.push(t);
    };

    window.addEventListener('hmix:player:state', function _onState(e) {
      if (e.detail && e.detail.state === 'playing') {
        window.removeEventListener('hmix:player:state', _onState);
        onPlay();
      }
    });

    // お気に入り完了を監視
    var onFav = function () {
      window.removeEventListener('favorites:updated', onFav);
      if (_state.completedSteps.favorite) return;
      _state.completedSteps.favorite = true;
      _saveState();
      _removeHint();

      var favBtn = document.getElementById('player-btn-fav');
      _showComplete(favBtn, '記憶に刻まれました', 'favorite');
    };
    window.addEventListener('favorites:updated', onFav);
  }

  // ── Step 2: シアターモード ────────────────────────────
  function _tryTheaterHint() {
    if (!_state) return;
    if (_state.completedSteps.theater) return;
    if (_state.shownInCurrentSession.theater) return;
    if (_state.sessionCount < 2) return; // 2回目以降

    // シアター使用済みチェック
    try {
      if (localStorage.getItem('hmix_shiori_shown')) {
        _state.completedSteps.theater = true;
        _saveState();
        return;
      }
    } catch (e) {}

    var onPlay = function () {
      window.removeEventListener('hmix:player:play', onPlay);
      var delay = 15000 + Math.random() * 15000; // 15-30秒
      var t = setTimeout(function () {
        if (_activeHint) return;
        if (_state.shownInCurrentSession.theater) return;

        // シアターゲートカードを探す
        var theaterBtn = document.getElementById('fm-open-theater');
        if (!theaterBtn) return;

        _state.shownInCurrentSession.theater = true;
        _saveState();
        _showHint(theaterBtn, 'この曲の内側へ。', 'theater', { pulse: false });
      }, delay);
      _timers.push(t);
    };

    window.addEventListener('hmix:player:state', function _onState(e) {
      if (e.detail && e.detail.state === 'playing') {
        window.removeEventListener('hmix:player:state', _onState);
        onPlay();
      }
    });

    // シアター開始を監視
    var onOpen = function () {
      window.removeEventListener('theater:open', onOpen);
      if (_state.completedSteps.theater) return;
      _state.completedSteps.theater = true;
      _saveState();
      _removeHint();
    };
    // theater:open がない場合のフォールバック: theater:track:change
    window.addEventListener('theater:open', onOpen);
    window.addEventListener('theater:track:change', function onTrack() {
      window.removeEventListener('theater:track:change', onTrack);
      if (!_state.completedSteps.theater) {
        _state.completedSteps.theater = true;
        _saveState();
        _removeHint();
      }
    });
  }

  // ── Step 3: 足跡（FEATURE_DISABLED 時はスキップ）─────
  function _tryFootprintHint() {
    if (!_state) return;
    if (_state.completedSteps.footprint) return;
    if (_state.shownInCurrentSession.footprint) return;
    if (_state.sessionCount < 3) return; // 3回目以降

    // 足跡が無効ならスキップ
    if (window.HMIX_FOOTPRINTS && window.HMIX_FOOTPRINTS.disabled) return;

    // 足跡使用済みチェック
    try {
      var fps = JSON.parse(localStorage.getItem('hmix_footprints_v1') || '{}');
      if (Object.keys(fps).length > 0) {
        _state.completedSteps.footprint = true;
        _saveState();
        return;
      }
    } catch (e) {}

    // 曲の完了 or シアター体験後
    var onEnded = function () {
      window.removeEventListener('hmix:player:ended', onEnded);
      var t = setTimeout(function () {
        if (_activeHint) return;
        if (_state.shownInCurrentSession.footprint) return;

        var fpBtn = document.getElementById('player-btn-footprint');
        if (!fpBtn) return;

        _state.shownInCurrentSession.footprint = true;
        _saveState();
        _showHint(fpBtn, 'この余韻に、ひとこと。', 'footprint', { pulse: true, position: 'above' });
      }, 3000);
      _timers.push(t);
    };

    window.addEventListener('hmix:player:state', function _onEnd(e) {
      if (e.detail && e.detail.state === 'stopped') {
        window.removeEventListener('hmix:player:state', _onEnd);
        onEnded();
      }
    });
    window.addEventListener('theater:close', function onClose() {
      window.removeEventListener('theater:close', onClose);
      onEnded();
    });
  }

  // ── メイン初期化 ──────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    _initState();

    // 4回目以降は完全終了
    if (_state.sessionCount > 4) return;

    // 全ステップ完了なら何もしない
    if (_state.completedSteps.favorite &&
        _state.completedSteps.theater &&
        _state.completedSteps.footprint) return;

    // 未完了の最初のステップだけを試みる
    if (!_state.completedSteps.favorite) {
      _tryFavoriteHint();
    } else if (!_state.completedSteps.theater) {
      _tryTheaterHint();
    } else if (!_state.completedSteps.footprint) {
      _tryFootprintHint();
    }
  }

  function _reinit() {
    _clearTimers();
    _removeHint();
    _initialized = false;
    init();
  }

  // ── DOM Ready ─────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // PJAX 対応
  window.addEventListener('hmix:page:init', function () {
    _reinit();
  });

})();
