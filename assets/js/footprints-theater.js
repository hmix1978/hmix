/**
 * H/MIX GALLERY — footprints-theater.js
 * 旅人の足跡：シアタールーム 漂う演出
 *
 * 責務: 足跡コメントを風景に静かに漂わせる
 * 依存: footprints.js, theater.js（theater:track:change 等のイベント発火）
 */
(function () {
  'use strict';

  var STORAGE_KEY    = 'hmix_fp_theater_on';
  var MAX_CONCURRENT = 3;    // 同時最大表示数
  var MIN_INTERVAL   = 14000; // 最短間隔 (ms)
  var MAX_INTERVAL   = 25000; // 最長間隔 (ms)
  var START_DELAY    = 4000;  // 初回表示までの待機 (ms)

  // ── デモ足跡（実データがない場合のフォールバック）────────
  var DEMO_POOL = [
    { body: '夜明け前の森を歩いているような静けさを感じた' },
    { body: '小さな村に灯りがともる情景が浮かんだ' },
    { body: '旅の途中で出会った風景を思い出させてくれる' },
    { body: '祈りのような静けさがある' },
    { body: '遠い記憶の中の夕暮れに似ている' },
    { body: '別れのシーンにぴったりだった' },
    { body: 'この音楽、ずっとそばに置いておきたい' },
    { body: '雨の夜に聴いて、心が落ち着いた' },
    { body: '懐かしい場所へ連れて行ってくれる気がした' },
    { body: 'ひとりで旅をしているような孤独と自由を感じる' },
  ];

  var _layer           = null;
  var _btn             = null;
  var _formEl          = null;
  var _btnFootprint    = null;
  var _isOn            = true;
  var _timer           = null;
  var _startTimer      = null;
  var _activeTrackId   = null;
  var _activeTrackTitle = null;
  var _pool            = [];
  var _poolIndex       = 0;
  var _activeCount     = 0;
  var _formOverrideTrackId        = null;
  var _formOverrideTitle          = null;
  var _playerOutsideListenerAdded = false;

  // ─── ON/OFF 状態 ─────────────────────────────────────
  function _readOn() {
    try { return localStorage.getItem(STORAGE_KEY) !== 'off'; } catch (e) { return true; }
  }

  function setOn(val) {
    _isOn = val;
    try { localStorage.setItem(STORAGE_KEY, val ? 'on' : 'off'); } catch (e) {}
    _updateBtn();
    if (val) {
      _startSequence();
    } else {
      _clearAll();
    }
  }

  function _updateBtn() {
    if (!_btn) return;
    if (_isOn) {
      _btn.textContent = '足跡を隠す';
      _btn.classList.add('is-active');
    } else {
      _btn.textContent = '足跡を漂わせる';
      _btn.classList.remove('is-active');
    }
  }

  // ─── コメントプール（ハイブリッド方式）─────────────────
  // この曲の足跡を優先、足りない分を全曲の足跡で補う
  // 他の曲の足跡には曲名が表示され、クリックで再生できる
  function _loadPool(trackId) {
    _poolIndex = 0;

    if (!window.HMIX_FOOTPRINTS) {
      _pool = DEMO_POOL.slice().sort(function () { return Math.random() - 0.5; });
      return;
    }

    // この曲の足跡（優先）
    var thisTrackItems = window.HMIX_FOOTPRINTS.get(trackId) || [];

    // 全曲の足跡を収集（この曲以外）
    var otherItems = [];
    if (window.HMIX_FOOTPRINTS.getAll) {
      var all = window.HMIX_FOOTPRINTS.getAll();
      for (var tid in all) {
        if (tid === trackId) continue;
        var items = all[tid];
        if (items && items.length) {
          items.forEach(function(item) {
            otherItems.push(item);
          });
        }
      }
    }

    // この曲の足跡を先頭に、他の曲の足跡をシャッフルして追加
    var shuffledOther = otherItems.sort(function () { return Math.random() - 0.5; });
    var combined = thisTrackItems.slice().concat(shuffledOther);

    // デモプールをフォールバック
    _pool = combined.length > 0 ? combined : DEMO_POOL.slice();
    // 最初のバッチ（この曲分）だけ順序維持、それ以降はシャッフル済み
  }

  // ─── フォーム用トラックID解決 ─────────────────────────
  // プレイヤーから開いた場合は override を、そうでなければ theater のアクティブ曲を使う
  function _getFormTrackId()    { return _formOverrideTrackId  || _activeTrackId;    }
  function _getFormTrackTitle() { return _formOverrideTitle    || _activeTrackTitle; }

  // ─── 乱数ヘルパー ────────────────────────────────────
  function _rand(min, max) { return Math.random() * (max - min) + min; }

  // ─── 重なり判定ヘルパー ───────────────────────────────
  // 既存アクティブ足跡の位置と近すぎないかチェック（%座標）
  function _isTooClose(topPct, leftPct) {
    var els = _layer ? _layer.querySelectorAll('.theater-footprint') : [];
    for (var i = 0; i < els.length; i++) {
      var t = parseFloat(els[i].style.top)  || 0;
      var l = parseFloat(els[i].style.left) || 0;
      if (Math.abs(topPct - t) < 16 && Math.abs(leftPct - l) < 28) return true;
    }
    return false;
  }

  // ─── 1件の足跡を生成・表示 ───────────────────────────
  function _spawn() {
    if (!_layer || !_isOn || _activeCount >= MAX_CONCURRENT) return;
    if (_pool.length === 0) return;

    var item = _pool[_poolIndex % _pool.length];
    _poolIndex++;

    var el = document.createElement('span');
    el.className = 'theater-footprint';

    // 本文
    var bodyNode = document.createElement('span');
    bodyNode.className = 'theater-footprint__body';
    bodyNode.textContent = item.body;
    el.appendChild(bodyNode);

    // 投稿者名 + クリッカブルな曲名メタ行
    var nick = (item.nickname || '').trim();
    var displayTitle = item.trackTitle || null;

    if (nick || displayTitle) {
      var metaNode = document.createElement('span');
      metaNode.className = 'theater-footprint__meta';

      if (nick) {
        var nickNode = document.createElement('span');
        nickNode.textContent = nick;
        metaNode.appendChild(nickNode);
      }

      if (nick && displayTitle) {
        metaNode.appendChild(document.createTextNode('\u3000\u00b7\u3000'));
      }

      if (displayTitle) {
        var titleNode = document.createElement('span');
        titleNode.className = 'theater-footprint__track-link';
        titleNode.textContent = '\u266a\u00a0' + displayTitle; // ♪ 曲名
        metaNode.appendChild(titleNode);
      }

      el.appendChild(metaNode);
    }

    // ── 足跡カード全体をクリックで該当曲を再生 ──
    // 条件: trackId が存在し、現在再生中の曲と異なる場合のみ
    // (PCシアターのシーン軸足跡は trackId なしのためクリック無効)
    var clickTrackId = (item.trackId && item.trackId !== _activeTrackId) ? item.trackId : null;
    if (clickTrackId) {
      el.classList.add('is-clickable');
      if (displayTitle) el.title = displayTitle + ' を再生';
      (function(tid) {
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          if (window.HMIX_THEATER && typeof window.HMIX_THEATER.playById === 'function') {
            window.HMIX_THEATER.playById(tid);
          }
        });
      })(clickTrackId);
    }

    // ── 表示位置（重なり回避・最大5回リトライ）──
    var useLower, topPct, leftPct, tries = 0;
    do {
      useLower = Math.random() > 0.5;
      topPct  = useLower ? _rand(45, 60) : _rand(10, 28);
      leftPct = _rand(6, 68);
      tries++;
    } while (_isTooClose(topPct, leftPct) && tries < 5);

    // ── ドリフト（上方向 + 微横揺れ）──
    var dy = _rand(-25, -55);
    var dx = _rand(-12, 12);
    var opacity = _rand(0.75, 0.95);
    var dur = _rand(18, 28);

    el.style.top  = topPct + '%';
    el.style.left = leftPct + '%';
    el.style.setProperty('--fp-dy', dy + 'px');
    el.style.setProperty('--fp-dx', dx + 'px');
    el.style.setProperty('--fp-opacity', opacity);
    el.style.setProperty('--fp-shimmer-dur', _rand(4, 7).toFixed(1) + 's');
    el.style.setProperty('--fp-shimmer-delay', _rand(0.8, 2.5).toFixed(1) + 's');
    el.style.animation = 'fp-drift ' + dur + 's linear forwards';

    _layer.appendChild(el);
    _activeCount++;

    // ── スパークル粒子を散らす ──
    _spawnSparkles(el, dur);

    el.addEventListener('animationend', function (e) {
      // 子要素（スパークル等）からのバブルアップを無視し、
      // fp-drift の完了のみで除去する
      if (e.target !== el) return;
      el.remove();
      _activeCount = Math.max(0, _activeCount - 1);
    });
  }

  // ─── スパークル粒子生成 ───────────────────────────────
  var SPARKLE_CHARS = ['\u2726', '\u2727', '\u22c6', '\u2605', '\u2729', '\u2736', '\u2733'];

  function _spawnSparkles(parentEl, driftDur) {
    // 初回バースト（出現直後）+ 持続的に再散布
    _burstSparkles(parentEl, 6, 0, driftDur * 0.35);
    // 中盤に再点火
    var midDelay = driftDur * 0.3 * 1000;
    setTimeout(function() {
      if (parentEl.parentNode) _burstSparkles(parentEl, 4, 0, driftDur * 0.25);
    }, midDelay);
  }

  function _burstSparkles(parentEl, count, delayBase, delayRange) {
    for (var i = 0; i < count; i++) {
      (function() {
        var delay = delayBase + _rand(0, delayRange);
        var sp = document.createElement('span');
        sp.className = 'theater-fp-sparkle';
        sp.setAttribute('aria-hidden', 'true');
        sp.textContent = SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)];
        var xPct  = _rand(-20, 110);
        var yPct  = _rand(-25, 115);
        var tx    = _rand(-14, 14);
        var ty    = _rand(-22, -8);
        var tx2   = _rand(-8, 8);
        var ty2   = _rand(-38, -18);
        var size  = _rand(0.7, 1.3).toFixed(2) + 'rem';
        var spDur = _rand(2.2, 3.8).toFixed(1) + 's';
        sp.style.setProperty('--sp-x',     xPct + '%');
        sp.style.setProperty('--sp-y',     yPct + '%');
        sp.style.setProperty('--sp-tx',    tx + 'px');
        sp.style.setProperty('--sp-ty',    ty + 'px');
        sp.style.setProperty('--sp-tx2',   tx2 + 'px');
        sp.style.setProperty('--sp-ty2',   ty2 + 'px');
        sp.style.setProperty('--sp-size',  size);
        sp.style.setProperty('--sp-dur',   spDur);
        sp.style.setProperty('--sp-delay', delay.toFixed(2) + 's');
        parentEl.appendChild(sp);
        var totalMs = (delay + parseFloat(spDur) + 0.3) * 1000;
        setTimeout(function() { if (sp.parentNode) sp.remove(); }, totalMs);
      })();
    }
  }

  // ─── 表示スケジュール ─────────────────────────────────
  function _scheduleNext() {
    clearTimeout(_timer);
    if (!_isOn || _pool.length === 0) return;
    var interval = _rand(MIN_INTERVAL, MAX_INTERVAL);
    _timer = setTimeout(function () {
      _spawn();
      _scheduleNext();
    }, interval);
  }

  function _startSequence() {
    clearTimeout(_startTimer);
    clearTimeout(_timer);
    if (!_isOn || _pool.length === 0) return;

    _startTimer = setTimeout(function () {
      _spawn();
      _scheduleNext();
    }, START_DELAY);
  }

  function _clearAll() {
    clearTimeout(_timer);
    clearTimeout(_startTimer);
    if (_layer) {
      var els = _layer.querySelectorAll('.theater-footprint');
      els.forEach(function (el) { el.remove(); });
    }
    _activeCount = 0;
  }

  // ─── theater.js イベント受信 ─────────────────────────
  window.addEventListener('theater:track:change', function (e) {
    if (!e.detail || !e.detail.trackId) return;
    _clearAll();
    _activeTrackId    = e.detail.trackId;
    _activeTrackTitle = e.detail.trackTitle || null;
    _loadPool(_activeTrackId);
    _updateListBadge();
    // 曲変更時は再生状態に関わらずシーケンスを開始
    // （autoPlay=true で呼ばれた場合も theater:play より先にこちらが発火するため）
    if (_isOn) _startSequence();
  });

  window.addEventListener('theater:play', function () {
    // プールが空でもデモデータを再ロードして対応
    if (_pool.length === 0) _loadPool(_activeTrackId);
    if (_isOn) _startSequence();
  });

  window.addEventListener('theater:pause', function () {
    clearTimeout(_timer);
    clearTimeout(_startTimer);
  });

  window.addEventListener('theater:close', function () {
    _clearAll();
  });

  // ─── 足跡追加・削除時にプールと表示を更新 ──────────
  window.addEventListener('footprints:updated', function (e) {
    if (e.detail && e.detail.trackId === _activeTrackId) {
      _loadPool(_activeTrackId);
      // 投稿直後に自分の足跡が出やすいようシーケンスを再起動
      if (_isOn) _startSequence();
      _updateListBadge();
    }
  });

  // ─── フォーム開閉 ────────────────────────────────────
  // overrideTrackId: プレイヤーから開く場合にセット（省略時は theater のアクティブ曲）
  function _openForm(overrideTrackId, overrideTitle) {
    if (!_formEl) return;
    _formOverrideTrackId = overrideTrackId || null;
    _formOverrideTitle   = overrideTitle   || null;

    var trackId  = _getFormTrackId();
    // 既投稿があれば一覧タブで開く
    var hasItems = !!(window.HMIX_FOOTPRINTS && trackId &&
      window.HMIX_FOOTPRINTS.get(trackId).length > 0);

    var tabPost = document.getElementById('theater-fp-tab-post');
    var tabList = document.getElementById('theater-fp-tab-list');
    var secPost = document.getElementById('theater-fp-post-section');
    var secList = document.getElementById('theater-fp-list-section');

    if (hasItems) {
      // 投稿済み → 一覧タブで開く
      if (tabPost) tabPost.classList.remove('is-active');
      if (tabList) tabList.classList.add('is-active');
      if (secPost) secPost.hidden = true;
      if (secList) secList.hidden = false;
      _renderList();
    } else {
      // 未投稿 → 投稿タブで開く
      if (tabPost) tabPost.classList.add('is-active');
      if (tabList) tabList.classList.remove('is-active');
      if (secPost) secPost.hidden = false;
      if (secList) secList.hidden = true;
      var noteEl = document.getElementById('theater-fp-note');
      if (noteEl) { noteEl.textContent = ''; noteEl.className = 'theater-fp-form__note'; }
      var bodyEl2 = document.getElementById('theater-fp-body');
      if (bodyEl2) bodyEl2.focus();
    }
    _updateListBadge();
    _formEl.removeAttribute('hidden');
  }

  function _closeForm() {
    if (!_formEl) return;
    _formOverrideTrackId = null;
    _formOverrideTitle   = null;
    _formEl.setAttribute('hidden', '');
  }

  // ─── UI初期化 ────────────────────────────────────────
  // ── 準備中ツールチップ ──
  var _disabledTooltip = null;
  var _tooltipTimer    = null;
  function _showDisabledTooltip(anchor) {
    if (!_disabledTooltip) {
      _disabledTooltip = document.createElement('div');
      _disabledTooltip.className = 'fp-disabled-tooltip';
      _disabledTooltip.textContent = 'この機能は現在準備中です';
      _disabledTooltip.style.cssText = 'position:fixed;z-index:9999;padding:6px 14px;border-radius:8px;font-size:0.75rem;letter-spacing:0.04em;pointer-events:none;opacity:0;transition:opacity 0.25s;font-family:"Noto Sans JP",sans-serif;background:rgba(10,20,15,0.92);color:rgba(200,230,210,0.9);border:1px solid rgba(100,180,130,0.25);box-shadow:0 4px 20px rgba(0,0,0,0.4);backdrop-filter:blur(8px);';
      document.body.appendChild(_disabledTooltip);
    }
    var rect = anchor.getBoundingClientRect();
    _disabledTooltip.style.left = rect.left + rect.width / 2 - 80 + 'px';
    _disabledTooltip.style.top  = rect.top - 40 + 'px';
    _disabledTooltip.style.opacity = '1';
    clearTimeout(_tooltipTimer);
    _tooltipTimer = setTimeout(function() {
      if (_disabledTooltip) _disabledTooltip.style.opacity = '0';
    }, 2000);
  }

  function _isFeatureDisabled() {
    return window.HMIX_FOOTPRINTS && window.HMIX_FOOTPRINTS.disabled;
  }

  function initUI() {
    _layer        = document.getElementById('theater-footprints-layer');
    _btn          = document.getElementById('theater-footprints-btn');
    _formEl       = document.getElementById('theater-fp-form');
    _btnFootprint = document.getElementById('theater-btn-footprint');
    _isOn  = _readOn();
    _updateBtn();

    if (_btn) {
      _btn.onclick = function () { setOn(!_isOn); };
    }

    // 足跡ボタン（ピン）→ フォーム開閉（disabled時はツールチップ）
    if (_btnFootprint) {
      _btnFootprint.onclick = function () {
        if (_isFeatureDisabled()) {
          _showDisabledTooltip(_btnFootprint);
          return;
        }
        if (_formEl && !_formEl.hasAttribute('hidden')) {
          _closeForm();
        } else {
          _openForm();
        }
      };
      if (_isFeatureDisabled()) {
        _btnFootprint.setAttribute('title', 'この機能は現在準備中です');
      }
    }

    // キャンセルボタン
    var cancelBtn = document.getElementById('theater-fp-cancel');
    if (cancelBtn) {
      cancelBtn.onclick = _closeForm;
    }

    // 文字カウンター
    var bodyEl = document.getElementById('theater-fp-body');
    var countEl = document.getElementById('theater-fp-count');
    if (bodyEl && countEl) {
      bodyEl.oninput = function () {
        countEl.textContent = bodyEl.value.length;
      };
    }

    // 送信ボタン
    var submitBtn = document.getElementById('theater-fp-submit');
    var noteEl    = document.getElementById('theater-fp-note');
    var nickEl    = document.getElementById('theater-fp-nickname');

    if (submitBtn) {
      submitBtn.onclick = function () {
        if (!window.HMIX_FOOTPRINTS) return;
        var trackId    = _getFormTrackId();
        var trackTitle = _getFormTrackTitle();
        var body       = bodyEl ? bodyEl.value : '';
        var nickname   = nickEl ? nickEl.value.trim() : '';
        var result     = window.HMIX_FOOTPRINTS.post(trackId, body, nickname, 'theater', trackTitle);

        if (noteEl) {
          noteEl.textContent = result.error || '';
          noteEl.className = 'theater-fp-form__note' +
            (result.ok ? ' theater-fp-form__note--success' : ' theater-fp-form__note--error');
        }

        if (result.ok) {
          if (bodyEl)  { bodyEl.value = ''; }
          if (countEl) { countEl.textContent = '0'; }
          _updateListBadge();
          // 足跡の余韻演出
          _spawnFootprintEcho(submitBtn);
          // 投稿後は一覧タブに切り替えて確認できるようにする
          var tabPost3 = document.getElementById('theater-fp-tab-post');
          var tabList3 = document.getElementById('theater-fp-tab-list');
          var secPost3 = document.getElementById('theater-fp-post-section');
          var secList3 = document.getElementById('theater-fp-list-section');
          if (tabPost3) tabPost3.classList.remove('is-active');
          if (tabList3) tabList3.classList.add('is-active');
          if (secPost3) secPost3.hidden = true;
          if (secList3) secList3.hidden = false;
          _renderList();
        }
      };
    }

    // タブ切替
    var tabPost = document.getElementById('theater-fp-tab-post');
    var tabList = document.getElementById('theater-fp-tab-list');
    var secPost = document.getElementById('theater-fp-post-section');
    var secList = document.getElementById('theater-fp-list-section');

    function _switchTab(tab) {
      var isPost = tab === 'post';
      if (tabPost) tabPost.classList.toggle('is-active', isPost);
      if (tabList) tabList.classList.toggle('is-active', !isPost);
      if (secPost) secPost.hidden = !isPost;
      if (secList) secList.hidden = isPost;
      if (!isPost) _renderList();
    }

    if (tabPost) tabPost.onclick = function() { _switchTab('post'); };
    if (tabList) tabList.onclick = function() { _switchTab('list'); };

    // 一覧「閉じる」
    var listCloseBtn = document.getElementById('theater-fp-list-close');
    if (listCloseBtn) listCloseBtn.onclick = _closeForm;

    // 一覧「全削除」
    var listClearBtn = document.getElementById('theater-fp-list-clear');
    if (listClearBtn) {
      listClearBtn.onclick = function() {
        var trackId = _getFormTrackId();
        if (!window.HMIX_FOOTPRINTS || !trackId) return;
        if (!confirm('あなたがこの曲に残した足跡をすべて削除しますか？（他の方の足跡には影響しません）')) return;
        window.HMIX_FOOTPRINTS.removeAll(trackId);
        _renderList();
        _updateListBadge();
      };
    }

    // プレイヤーへの足跡ボタン注入
    _injectPlayerButton();
  }

  // ─── 一覧レンダリング ─────────────────────────────────
  function _escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function _renderList() {
    var listEl = document.getElementById('theater-fp-list-items');
    if (!listEl || !window.HMIX_FOOTPRINTS) return;

    var trackId = _getFormTrackId();
    // ハイブリッド: この曲の足跡 + 他の曲の足跡
    var thisItems = window.HMIX_FOOTPRINTS.get(trackId) || [];
    var otherItems = [];
    if (window.HMIX_FOOTPRINTS.getAll) {
      var all = window.HMIX_FOOTPRINTS.getAll();
      for (var tid in all) {
        if (tid === trackId) continue;
        if (all[tid] && all[tid].length) {
          all[tid].forEach(function(item) {
            if (!item.trackId) item.trackId = tid;
            otherItems.push(item);
          });
        }
      }
    }
    otherItems.sort(function(a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    var items = thisItems.concat(otherItems);

    if (!items.length) {
      listEl.innerHTML = '<p class="theater-fp-list__empty">まだ足跡はありません。<br>最初の旅人になりましょう。</p>';
      return;
    }

    listEl.innerHTML = items.map(function(item) {
      var itemTrackId = item.trackId || trackId;
      var trackLabel = '';
      if (item.trackTitle && itemTrackId !== trackId) {
        trackLabel = '<span class="theater-fp-list__track">♪ ' + _escHtml(item.trackTitle) + '</span>';
      }
      var deleteBtn = item.isOwn
        ? '<button class="theater-fp-list__delete" data-track-id="' + _escHtml(itemTrackId) + '" data-comment-id="' + _escHtml(item.commentId) + '" aria-label="削除" title="この足跡を削除">×</button>'
        : '';
      return '<div class="theater-fp-list__item" data-comment-id="' + _escHtml(item.commentId) + '">' +
        '<div class="theater-fp-list__meta">' +
          '<span class="theater-fp-list__name">' + _escHtml(item.nickname || '旅人') + '</span>' +
          trackLabel +
          '<span class="theater-fp-list__date">' + _escHtml(window.HMIX_FOOTPRINTS.formatDate(item.createdAt)) + '</span>' +
          deleteBtn +
        '</div>' +
        '<p class="theater-fp-list__body">' + _escHtml(item.body) + '</p>' +
      '</div>';
    }).join('');

    // 削除ボタンのイベント（イベントデリゲーション）— trackId を各ボタンから取得
    listEl.onclick = function(e) {
      var btn = e.target.closest('.theater-fp-list__delete');
      if (!btn) return;
      var cid = btn.dataset.commentId;
      var tid = btn.dataset.trackId;
      if (cid && tid && window.HMIX_FOOTPRINTS) {
        window.HMIX_FOOTPRINTS.remove(tid, cid);
        _renderList();
        _updateListBadge();
      }
    };
  }

  function _updateListBadge() {
    var badgeEl = document.getElementById('theater-fp-badge');
    if (!badgeEl || !window.HMIX_FOOTPRINTS) return;
    var trackId = _getFormTrackId();
    if (!trackId) { badgeEl.textContent = ''; return; }
    var count = window.HMIX_FOOTPRINTS.get(trackId).length;
    badgeEl.textContent = count ? ' ' + count : '';
  }

  // ─── プレイヤーへの足跡ボタン注入 ───────────────────
  function _injectPlayerButton() {
    // ボタン
    if (!document.getElementById('player-btn-footprint')) {
      var playerRight = document.querySelector('.player-right');
      if (playerRight) {
        var btn = document.createElement('button');
        btn.id        = 'player-btn-footprint';
        btn.className = 'player-btn-footprint';
        btn.setAttribute('aria-label', '足跡を残す');
        btn.setAttribute('title', '足跡を残す');
        btn.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" aria-hidden="true">' +
            '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>' +
            '<line x1="16" y1="8" x2="2" y2="22"/>' +
            '<line x1="17.5" y1="15" x2="9" y2="15"/>' +
          '</svg>';
        var volWrap = playerRight.querySelector('.volume-wrap');
        if (volWrap) playerRight.insertBefore(btn, volWrap);
        else playerRight.appendChild(btn);
      }
    }

    // ポップアップ
    if (!document.getElementById('player-fp-popup')) {
      var popup = document.createElement('div');
      popup.id        = 'player-fp-popup';
      popup.className = 'player-fp-popup';
      popup.setAttribute('hidden', '');
      popup.innerHTML =
        '<div class="player-fp-popup__header">' +
          '<span class="player-fp-popup__track" id="player-fp-popup-track"></span>' +
          '<button class="player-fp-popup__close" id="player-fp-popup-close" aria-label="閉じる">×</button>' +
        '</div>' +
        '<div class="player-fp-popup__fields">' +
          '<input type="text" class="player-fp-popup__nick" id="player-fp-popup-nick" maxlength="20" placeholder="旅人（ニックネーム任意）" autocomplete="off">' +
          '<textarea class="player-fp-popup__body" id="player-fp-popup-body" maxlength="60" rows="2" placeholder="この音楽に触れた記憶を、ひとこと…"></textarea>' +
        '</div>' +
        '<div class="player-fp-popup__footer">' +
          '<span class="player-fp-popup__count"><span id="player-fp-popup-count">0</span>/60</span>' +
          '<button class="player-fp-popup__submit" id="player-fp-popup-submit" type="button">残す</button>' +
        '</div>' +
        '<p class="player-fp-popup__note" id="player-fp-popup-note"></p>';
      document.body.appendChild(popup);
    }

    // イベント再バインド（PJAX 再初期化時も対応）
    var fpBtn    = document.getElementById('player-btn-footprint');
    var fpPopup  = document.getElementById('player-fp-popup');
    var fpClose  = document.getElementById('player-fp-popup-close');
    var fpSubmit = document.getElementById('player-fp-popup-submit');
    var fpBody   = document.getElementById('player-fp-popup-body');
    var fpCount  = document.getElementById('player-fp-popup-count');
    var fpNick   = document.getElementById('player-fp-popup-nick');
    var fpNote   = document.getElementById('player-fp-popup-note');
    var fpTrack  = document.getElementById('player-fp-popup-track');

    var _playerFpTrackId    = null;
    var _playerFpTrackTitle = null;

    function _openPlayerPopup() {
      var ps = window.HMIX_PLAYER && window.HMIX_PLAYER.getState();
      var pt = ps && ps.queue && ps.queue[ps.currentIndex];
      if (!pt) return;
      _playerFpTrackId    = pt.id;
      _playerFpTrackTitle = (window.HMIX_LANG === 'en' && pt.title_en) ? pt.title_en : (pt.title || pt.id);
      if (fpTrack)  fpTrack.textContent  = _playerFpTrackTitle;
      if (fpBody)   { fpBody.value = ''; }
      if (fpNick)   fpNick.value  = '';
      if (fpCount)  fpCount.textContent  = '0';
      if (fpNote)   { fpNote.textContent = ''; fpNote.className = 'player-fp-popup__note'; }
      if (fpPopup)  fpPopup.removeAttribute('hidden');
      if (fpBody)   fpBody.focus();
    }

    function _closePlayerPopup() {
      if (fpPopup) fpPopup.setAttribute('hidden', '');
      _playerFpTrackId = null;
    }

    if (fpBtn) {
      if (_isFeatureDisabled()) {
        fpBtn.setAttribute('title', 'この機能は現在準備中です');
      }
      fpBtn.onclick = function(e) {
        e.stopPropagation();
        if (_isFeatureDisabled()) {
          _showDisabledTooltip(fpBtn);
          return;
        }
        if (fpPopup && !fpPopup.hasAttribute('hidden')) {
          _closePlayerPopup();
        } else {
          _openPlayerPopup();
        }
      };
    }

    if (fpClose)  fpClose.onclick  = _closePlayerPopup;

    if (fpBody && fpCount) {
      fpBody.oninput = function() { fpCount.textContent = fpBody.value.length; };
    }

    if (fpSubmit) {
      fpSubmit.onclick = function() {
        if (!window.HMIX_FOOTPRINTS || !_playerFpTrackId) return;
        var body     = fpBody ? fpBody.value : '';
        var nickname = fpNick ? fpNick.value.trim() : '';
        var result   = window.HMIX_FOOTPRINTS.post(_playerFpTrackId, body, nickname, 'player', _playerFpTrackTitle);
        if (fpNote) {
          fpNote.textContent = result.ok ? '' : (result.error || '');
          fpNote.className   = 'player-fp-popup__note' +
            (result.ok ? ' player-fp-popup__note--success' : ' player-fp-popup__note--error');
        }
        if (result.ok) {
          if (fpBody)  fpBody.value  = '';
          if (fpCount) fpCount.textContent = '0';
          _spawnFootprintEcho(fpSubmit);
          setTimeout(_closePlayerPopup, 2500);
        }
      };
    }

    // ポップアップ外クリックで閉じる（1回のみ登録）
    if (!_playerOutsideListenerAdded) {
      _playerOutsideListenerAdded = true;
      document.addEventListener('click', function(e) {
        var popup2 = document.getElementById('player-fp-popup');
        var btn2   = document.getElementById('player-btn-footprint');
        if (!popup2 || popup2.hasAttribute('hidden')) return;
        if (!popup2.contains(e.target) && e.target !== btn2) {
          popup2.setAttribute('hidden', '');
        }
      });
    }
  }

  // ─── PJAX 再初期化 ───────────────────────────────────
  window.addEventListener('hmix:page:init', function () {
    requestAnimationFrame(function () { initUI(); });
  });

  // ── 足跡の余韻演出 ──────────────────────────────────────
  function _spawnFootprintEcho(originEl) {
    // コンテナ（シアター内 or body）
    var container = document.getElementById('theater-modal') || document.body;
    var isTheater = container.id === 'theater-modal';

    // 起点座標
    var rect = originEl ? originEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
    var startX = rect.left + (rect.width || 0) / 2;
    var startY = rect.top;

    // 光の粒子を生成（5個）
    var particles = [];
    for (var i = 0; i < 5; i++) {
      var p = document.createElement('span');
      p.className = 'fp-echo-particle';
      var size = 4 + Math.random() * 6;
      p.style.cssText =
        'position:fixed;' +
        'left:' + (startX + (Math.random() - 0.5) * 30) + 'px;' +
        'top:' + startY + 'px;' +
        'width:' + size + 'px;' +
        'height:' + size + 'px;' +
        'border-radius:50%;' +
        'pointer-events:none;' +
        'z-index:10001;' +
        'opacity:0;' +
        'background:radial-gradient(circle, rgba(255,248,200,0.95) 0%, rgba(255,220,130,0.6) 40%, rgba(200,230,180,0.2) 70%, transparent 100%);' +
        'box-shadow:0 0 8px rgba(255,230,150,0.6), 0 0 20px rgba(255,220,120,0.3);' +
        'transition:all ' + (2.5 + Math.random() * 1.5) + 's ease-out;';
      container.appendChild(p);
      particles.push({
        el: p,
        dx: (Math.random() - 0.5) * 80,
        dy: -(60 + Math.random() * 100)
      });
    }

    // テキスト
    var text = document.createElement('div');
    text.className = 'fp-echo-text';
    text.textContent = '足跡が、ここに残りました';
    text.style.cssText =
      'position:fixed;' +
      'left:50%;top:50%;' +
      'transform:translate(-50%,-50%) translateY(10px);' +
      'font-family:"Noto Serif JP",serif;' +
      'font-size:0.85rem;' +
      'font-weight:300;' +
      'letter-spacing:0.12em;' +
      'color:rgba(255,248,220,0);' +
      'text-shadow:0 0 20px rgba(255,220,120,0.5), 0 0 40px rgba(200,180,100,0.3);' +
      'pointer-events:none;' +
      'z-index:10001;' +
      'white-space:nowrap;' +
      'transition:all 1.8s ease;';
    container.appendChild(text);

    // アニメーション開始
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        // 粒子を浮遊させる
        particles.forEach(function(p) {
          p.el.style.opacity = '0.9';
          p.el.style.left = (startX + p.dx) + 'px';
          p.el.style.top = (startY + p.dy) + 'px';
        });
        // テキストをフェードイン
        text.style.color = 'rgba(255,248,220,0.85)';
        text.style.transform = 'translate(-50%,-50%) translateY(0)';
      });
    });

    // 1.5秒後に粒子をフェードアウト
    setTimeout(function() {
      particles.forEach(function(p) {
        p.el.style.opacity = '0';
        p.el.style.transform = 'scale(0.3)';
      });
    }, 1500);

    // 2.5秒後にテキストをフェードアウト
    setTimeout(function() {
      text.style.color = 'rgba(255,248,220,0)';
      text.style.transform = 'translate(-50%,-50%) translateY(-15px)';
    }, 2500);

    // 4秒後にDOM削除
    setTimeout(function() {
      particles.forEach(function(p) {
        if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
      });
      if (text.parentNode) text.parentNode.removeChild(text);
    }, 4500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

})();
