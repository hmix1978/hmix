/**
 * H/MIX GALLERY — player-panel.js
 * SNS BGM コンソール：プレイヤー拡張パネル
 * Tab 1: 使える？（利用可否）
 * Tab 2: 表記コピー（クレジットジェネレーター）
 * Tab 3: シェア（SNS共有）
 */
(function () {
  'use strict';

  var _panel = null;
  var _toggleBtn = null;
  var _initialized = false;
  var _videoWorkbench = {
    node: null,
    video: null,
    fileInput: null,
    objectUrl: '',
    fileName: '',
    fileSize: 0,
    duration: 0,
    observer: null,
    clips: [],
    drag: null,
    resize: null,
    dragClip: null,
    selectedClipId: '',
    syncingMusic: false,
    syncingWaveToClip: false,
    loadingTrackId: '',
    lastSyncAt: 0,
    audioWasMuted: false,
    nextTone: 0,
    repeat: false,
    displayMode: 'hidden',
    goalTime: -1,
    qPointTime: -1,
    qPointEnabled: true,
    guardInstalled: false,
    allowTrackSwitchOnce: false,
    allowNativeControlClick: false,
    lastBrowseTrackId: '',
    timelineThumbs: [],
    thumbToken: 0,
    residentLargeBrowse: true,
    mixRaf: 0,
    videoVolumeCurrent: -1,
    musicVolumeCurrent: -1
  };

  // ── 波形関連 ──
  var _audioCtx = null;
  var _waveformData = null;
  var _waveformTrackId = null;
  var _waveformCanvas = null;
  var _waveformCtx = null;
  var _animFrameId = null;
  var _rangeStart = -1;   // 区間リピート開始（秒）
  var _rangeEnd = -1;     // 区間リピート終了（秒）
  var _rangeDragging = false;
  var _rangeActive = false;
  var _rangeTrackId = '';
  var _rangeMemoryByTrackId = {};
  var _rangeCheckInterval = null;
  var _dragCurrentSec = -1;  // ドラッグ中の現在カーソル位置（秒）
  var _rangeDragVisualMode = ''; // 'new' の時だけ新規範囲プレビューを描く
  var _hoverSec = -1;        // ホバー位置（秒）— 縦ガイドライン用
  var _memoMarkers = [];     // メモから抽出した位置・範囲マーカー
  var _fadeInSec = 0;        // フェードイン秒数（範囲ループ・エクスポート用）
  var _fadeOutSec = 2;       // フェードアウト秒数（既存 _fadeSec を引き継ぎ・初期値2s）
  var _fadeDragMode = '';    // 'in' | 'out' | '' (フェードハンドルドラッグ中)
  // ── ループ制作フェーズ1+2 用の状態 ──
  var _audioBuffer = null;            // デコード済 AudioBuffer（ゼロクロス検出・WAV/解析用）
  var _audioBufferTrackId = null;
  var _zeroCrossSnap = true;          // ゼロクロッシング自動吸着 ON/OFF
  var _crossfadeMs = 0;               // ループ繋ぎ目のクロスフェード時間 (ms)
  var _seamlessScore = -1;            // シームレス度スコア (0〜100, -1=未計算)
  var _loopType = 'forward';          // 'forward' | 'pingpong' | 'reverse'
  var _bpm = 0;                       // 手動入力 BPM (0=未設定)
  var _bpmGridOffsetSec = 0;          // 1拍目の位置（秒）
  var _loopRegions = null;            // {intro, loop, outro} の3リージョン
  var _loopPreviewMode = false;       // 繋ぎ目プレビューモード

  // ── 現在再生中の曲情報を取得 ──
  function _getCurrentTrack() {
    if (!window.HMIX_PLAYER) return null;
    if (typeof window.HMIX_PLAYER.getState !== 'function') return null;
    var state = null;
    try {
      state = window.HMIX_PLAYER.getState();
    } catch (e) {
      return null;
    }
    if (!state || !state.queue || state.currentIndex < 0) return null;
    return state.queue[state.currentIndex] || null;
  }

  function _getTrackTitle(track) {
    if (!track) return '';
    var lang = window.HMIX_LANG;
    return (lang === 'en' && track.title_en) ? track.title_en : (track.title || track.id);
  }

  function _isEn() {
    if (window.HMIX_LANG) return window.HMIX_LANG === 'en';
    try { return sessionStorage.getItem('hmix_lang') === 'en'; } catch (e) { return false; }
  }

  function _applyToggleLang() {
    if (!_toggleBtn) return;
    var isOpen = _panel && _panel.classList.contains('is-open');
    var label = _isEn()
      ? (isOpen ? 'Close tools panel' : 'Open tools panel')
      : (isOpen ? 'ツールパネルを閉じる' : 'ツールパネルを開く');
    _toggleBtn.setAttribute('aria-label', label);
    _toggleBtn.title = label;
    var text = _toggleBtn.querySelector('[data-ja]');
    if (text) text.textContent = _isEn() ? (text.dataset.en || text.dataset.ja) : text.dataset.ja;
  }

  function _txt(ja, en) {
    return _isEn() ? en : ja;
  }

  function _videoText(ja, en) {
    return _txt(ja, en || ja);
  }

  function _setVideoText(root, selector, ja, en) {
    var node = root && root.querySelector ? root.querySelector(selector) : document.querySelector(selector);
    if (node) node.textContent = _videoText(ja, en);
  }

  function _setVideoAttr(root, selector, attr, ja, en) {
    var node = root && root.querySelector ? root.querySelector(selector) : document.querySelector(selector);
    if (node) node.setAttribute(attr, _videoText(ja, en));
  }

  function _localizeVideoWorkbenchUI(root) {
    var dock = root || _videoWorkbench.node || document.getElementById('pp-video-workbench');
    if (!dock) return;
    dock.setAttribute('aria-label', _videoText('制作中の動画', 'Video workbench'));
    _setVideoText(dock, '.pp-vw-empty strong', '制作中の動画', 'Video in progress');
    _setVideoText(dock, '.pp-vw-empty span:not(.pp-vw-empty__icon)', '動画をアップロード', 'Upload a video');
    _setVideoText(dock, '.pp-vw-mode-btn--resident', '常駐化', 'Float');
    _setVideoText(dock, '.pp-vw-mode-btn--resident-large', '最大化', 'Large');
    _setVideoText(dock, '.pp-vw-mode-btn--edit', '編集画面へ', 'Edit view');
    _setVideoAttr(dock, '.pp-vw-mode-switch', 'aria-label', '動画ツール表示', 'Video tool view');
    _setVideoAttr(dock, '.pp-vw-mode-btn--hidden', 'aria-label', '非表示', 'Hide');
    _setVideoText(dock, '#pp-vw-upload span', '動画をアップロード', 'Upload video');
    _setVideoText(dock, '#pp-vw-insert-current span', '楽曲を挿入', 'Insert music');
    _setVideoText(dock, '#pp-vw-insert-memo span', 'メモ帳へ反映', 'Send to memo');
    _setVideoText(dock, '#pp-vw-copy-memo span', '編集メモ', 'Edit memo');
    _setVideoText(dock, '#pp-vw-delete-clip span', '選択削除', 'Delete selected');
    _setVideoText(dock, '#pp-vw-update-clip span', '範囲更新', 'Update range');
    _setVideoText(dock, '.pp-vw-lane--video .pp-vw-lane-head > span', '動画', 'Video');
    _setVideoText(dock, '.pp-vw-lane--music .pp-vw-lane-head > span', '楽曲', 'Music');
    _setVideoText(dock, '.pp-vw-video-volume > span', '動画音声', 'Video audio');
    _setVideoText(dock, '.pp-vw-music-volume > span', '楽曲音量', 'Music volume');
    _setVideoText(dock, '.pp-vw-mute > span', '動画の音声をミュート', 'Mute video audio');
    _setVideoText(dock, '.pp-vw-mute > em', '楽曲のフェードでクロスフェード', 'Crossfade with music fades');
    _setVideoText(dock, '.pp-vw-qpoint > span', 'Qポイント', 'Q point');
    _setVideoText(dock, '#pp-vw-qpoint-set', '現在位置に設定', 'Set current');
    _setVideoText(dock, '#pp-vw-qpoint-clear', '解除', 'Clear');
    _setVideoText(dock, '.pp-vw-goal > span', '合わせ位置', 'Sync point');
    _setVideoText(dock, '#pp-vw-goal-set', '現在位置に設定', 'Set current');
    _setVideoText(dock, '#pp-vw-goal-align', '選択曲の先頭を合わせる', 'Align selected start');
    _setVideoText(dock, '.pp-vw-editor__head strong', '配置音源の調整', 'Placed music settings');
    _setVideoText(dock, '.pp-vw-qmenu__panel > strong', 'Qポイント', 'Q point');
    _setVideoText(dock, '.pp-vw-qmenu__panel > span:not(.pp-vw-qmenu__actions)', 'Qは「この場面から曲を当てたい」位置です。編集では楽曲の入り、常駐では試聴を始める場面になります。', 'Q marks the scene where you want music to start. In edit view it sets the music entry point; in floating mode it becomes the video scene used for auditioning.');
    _setVideoAttr(dock, '#pp-vw-video-volume', 'aria-label', '動画音声の音量', 'Video audio volume');
    _setVideoAttr(dock, '.pp-vw-transport', 'aria-label', '動画の操作', 'Video controls');
    _setVideoAttr(dock, '.pp-vw-lane-transport', 'aria-label', '動画の操作', 'Video controls');
    _setVideoAttr(dock, '#pp-vw-close', 'aria-label', '動画を削除', 'Remove video');
    _setVideoAttr(dock, '#pp-vw-close', 'title', '動画を削除', 'Remove video');
    _setVideoText(dock, '#pp-vw-close span', '動画を削除', 'Remove video');

    var editorLabels = [
      ['#pp-vw-edit-video-start', '動画開始 ', 'Video start ', '秒', 'sec'],
      ['#pp-vw-edit-music-start', '曲開始 ', 'Music start ', '秒', 'sec'],
      ['#pp-vw-edit-length', '長さ ', 'Length ', '秒', 'sec'],
      ['#pp-vw-edit-fade-in', 'フェードIN ', 'Fade in ', '秒', 'sec'],
      ['#pp-vw-edit-fade-out', 'フェードOUT ', 'Fade out ', '秒', 'sec']
    ];
    editorLabels.forEach(function (item) {
      var input = dock.querySelector(item[0]);
      var label = input && input.closest('label');
      if (!label) return;
      var nodes = Array.prototype.slice.call(label.childNodes);
      nodes.forEach(function (node) {
        if (node.nodeType === 3) node.nodeValue = _videoText(item[1], item[2]);
      });
      var unit = label.querySelector('span');
      if (unit) unit.textContent = _videoText(item[3], item[4]);
    });

    dock.querySelectorAll('[data-vw-q-action="set"]').forEach(function (btn) {
      btn.textContent = _videoText('現在位置に設定', 'Set current');
    });
    dock.querySelectorAll('[data-vw-q-action="clear"]').forEach(function (btn) {
      btn.textContent = _videoText('解除', 'Clear');
    });
    var syncStatus = dock.querySelector('#pp-vw-sync-status');
    if (syncStatus && (!syncStatus.textContent || /動画停止|Video stopped/.test(syncStatus.textContent))) {
      syncStatus.textContent = _videoText('動画停止 / BGM停止', 'Video stopped / BGM stopped');
    }
    var clipStatus = dock.querySelector('#pp-vw-clip-status');
    if (clipStatus && (!clipStatus.textContent || /未配置|Not placed/.test(clipStatus.textContent))) {
      clipStatus.textContent = _videoText('未配置', 'Not placed');
    }
    _syncVideoTransportControls();
  }

  function _videoControlSymbol(type) {
    if (type === 'pause') return '❚❚';
    if (type === 'stop') return '■';
    if (type === 'repeat') return '↻';
    return '▶';
  }

  function _videoControlLabel(type, active) {
    if (type === 'pause') return _txt('動画を一時停止', 'Pause video');
    if (type === 'stop') return _txt('動画を停止', 'Stop video');
    if (type === 'repeat') return active ? _txt('動画ループを解除', 'Turn video loop off') : _txt('動画をループ再生', 'Loop video');
    return active ? _txt('動画を再生中', 'Video playing') : _txt('動画を再生', 'Play video');
  }

  function _setVideoControlButton(btn, type, active) {
    if (!btn) return;
    var isRepeat = type === 'repeat';
    ['play', 'pause', 'stop', 'repeat'].forEach(function (name) {
      btn.classList.remove('pp-vw-control-btn--' + name);
    });
    btn.classList.add('pp-vw-control-btn', 'pp-vw-control-btn--' + type);
    btn.classList.toggle('is-active', isRepeat ? !!active : (type === 'play' && !!active));
    if (isRepeat) btn.setAttribute('aria-pressed', String(!!active));
    var label = _videoControlLabel(type, active);
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.innerHTML =
      '<span class="pp-vw-control-symbol" aria-hidden="true">' + _videoControlSymbol(type) + '</span>' +
      (isRepeat ? '<span class="pp-vw-control-state" aria-hidden="true">' + (active ? 'ON' : 'OFF') + '</span>' : '');
  }

  function _syncVideoTransportControls() {
    var v = _videoWorkbench.video;
    var playing = !!(v && !v.paused);
    [
      ['pp-vw-play-inline', 'play', playing],
      ['pp-vw-pause-inline', 'pause', false],
      ['pp-vw-stop-inline', 'stop', false],
      ['pp-vw-repeat-inline', 'repeat', _videoWorkbench.repeat],
      ['pp-vw-lane-play', 'play', playing],
      ['pp-vw-lane-pause', 'pause', false],
      ['pp-vw-lane-stop', 'stop', false],
      ['pp-vw-lane-repeat', 'repeat', _videoWorkbench.repeat],
      ['pp-vw-play', playing ? 'pause' : 'play', playing]
    ].forEach(function (item) {
      _setVideoControlButton(document.getElementById(item[0]), item[1], item[2]);
    });
    var hero = document.getElementById('pp-vw-hero-play');
    if (hero) {
      hero.classList.toggle('is-active', playing);
      hero.setAttribute('aria-label', _videoControlLabel('play', playing));
      hero.setAttribute('title', _videoControlLabel('play', playing));
      var label = hero.querySelector('span');
      if (label) label.textContent = '';
    }
  }

  function _formatVideoTime(sec) {
    sec = Math.max(0, Number(sec) || 0);
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function _formatVideoSize(bytes) {
    if (!bytes) return '';
    var mb = bytes / 1024 / 1024;
    return mb >= 10 ? Math.round(mb) + 'MB' : mb.toFixed(1) + 'MB';
  }

  function _getPlayerAudio() {
    if (!window.HMIX_PLAYER) return null;
    if (typeof window.HMIX_PLAYER.getAudio === 'function') {
      try {
        return window.HMIX_PLAYER.getAudio();
      } catch (e) {
        return null;
      }
    }
    var state = null;
    try {
      state = window.HMIX_PLAYER.getState ? window.HMIX_PLAYER.getState() : null;
    } catch (e2) {
      state = null;
    }
    return state && state.audio ? state.audio : null;
  }

  function _getAllTracks() {
    return Array.isArray(window.TRACKS) ? window.TRACKS : [];
  }

  function _getTrackById(id) {
    id = String(id || '');
    return _getAllTracks().find(function (track) { return String(track.id) === id; }) || null;
  }

  function _getTrackDuration(track) {
    if (!track) return 0;
    var a = _getPlayerAudio();
    var current = _getCurrentTrack();
    if (current && String(current.id) === String(track.id) && a && isFinite(a.duration)) return a.duration || 0;
    var fullTrack = track.id != null ? _getTrackById(track.id) : null;
    var sources = [track, fullTrack].filter(Boolean);
    for (var i = 0; i < sources.length; i++) {
      var src = sources[i];
      var numeric = Number(src.durationSec || src.duration_sec || src.lengthSec || 0);
      if (numeric > 0) return numeric;
      var text = String(src.duration || src.length || '');
      var m = text.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
      if (m) {
        if (m[3] != null) return (Number(m[1]) * 3600) + (Number(m[2]) * 60) + Number(m[3]);
        return (Number(m[1]) * 60) + Number(m[2]);
      }
    }
    return 0;
  }

  function _finitePositiveSec(value) {
    value = Number(value);
    return isFinite(value) && value > 0 ? value : 0;
  }

  function _getWaveformTimelineDuration(track) {
    track = track || _getCurrentTrack();
    var audioEl = _getPlayerAudio();
    var current = _getCurrentTrack();
    var canUseAudioDuration = !track || !current || String(current.id) === String(track.id);
    var dur = canUseAudioDuration ? _finitePositiveSec(audioEl && audioEl.duration) : 0;
    if (dur) return dur;
    if (_audioBuffer && (!track || !_audioBufferTrackId || String(_audioBufferTrackId) === String(track.id))) {
      dur = _finitePositiveSec(_audioBuffer.duration);
      if (dur) return dur;
    }
    dur = _finitePositiveSec(_getTrackDuration(track));
    if (dur) return dur;
    if (_rangeActive && isFinite(_rangeEnd) && _rangeEnd > 0) return _rangeEnd;
    return 0;
  }

  function _rememberRangeForTrackId(trackId) {
    var id = trackId != null ? String(trackId) : '';
    if (!id || !_rangeActive || !isFinite(_rangeStart) || !isFinite(_rangeEnd) || _rangeEnd <= _rangeStart) return;
    _rangeMemoryByTrackId[id] = {
      start: _rangeStart,
      end: _rangeEnd,
      fadeIn: _fadeInSec || 0,
      fadeOut: _fadeOutSec || 0
    };
    _persistRangeMemory(id, _rangeMemoryByTrackId[id]);
  }

  function _rememberCurrentRangeForTrack(trackId) {
    var current = _getCurrentTrack();
    var id = trackId || _rangeTrackId || (current && current.id);
    if (!id) return;
    if (_rangeActive && _rangeStart >= 0 && _rangeEnd > _rangeStart) {
      _rangeMemoryByTrackId[String(id)] = {
        start: _rangeStart,
        end: _rangeEnd,
        fadeIn: _fadeInSec || 0,
        fadeOut: _fadeOutSec || 0
      };
      _persistRangeMemory(String(id), _rangeMemoryByTrackId[String(id)]);
    }
  }

  function _forgetCurrentRangeForTrack(trackId) {
    var current = _getCurrentTrack();
    var id = trackId || _rangeTrackId || (current && current.id);
    if (id) {
      delete _rangeMemoryByTrackId[String(id)];
      _persistRangeMemory(String(id), null);
    }
  }

  function _persistRangeMemory(trackId, range) {
    try {
      var key = 'hmix_toolbox_ranges_v1';
      var all = JSON.parse(localStorage.getItem(key) || '{}');
      if (range && range.end > range.start) {
        all[trackId] = {
          start: Number(range.start) || 0,
          end: Number(range.end) || 0,
          fadeIn: Number(range.fadeIn) || 0,
          fadeOut: Number(range.fadeOut) || 0,
          updatedAt: new Date().toISOString()
        };
      } else {
        delete all[trackId];
      }
      localStorage.setItem(key, JSON.stringify(all));
      var node = document.getElementById('hmix-toolbox-state-store');
      if (!node) {
        node = document.createElement('script');
        node.type = 'application/json';
        node.id = 'hmix-toolbox-state-store';
        document.documentElement.appendChild(node);
      }
      node.textContent = JSON.stringify(all);
    } catch (e) {}
  }

  function _restoreRangeForTrack(track) {
    var id = track && track.id != null ? String(track.id) : '';
    _rangeTrackId = id;
    var saved = id ? _rangeMemoryByTrackId[id] : null;
    if (!saved || saved.end <= saved.start) {
      _rangeActive = false;
      _rangeStart = -1;
      _rangeEnd = -1;
      return false;
    }
    var dur = _getTrackDuration(track) || saved.end;
    _rangeStart = Math.max(0, Math.min(saved.start, Math.max(0, dur - 0.5)));
    _rangeEnd = Math.max(_rangeStart + 0.5, Math.min(saved.end, dur || saved.end));
    _fadeInSec = Math.max(0, Number(saved.fadeIn) || 0);
    _fadeOutSec = Math.max(0, Number(saved.fadeOut) || 0);
    _rangeActive = true;
    return true;
  }

  function _syncPersistentRangeWithCurrentTrack() {
    var track = _getCurrentTrack();
    var nextId = track && track.id != null ? String(track.id) : '';
    if (_rangeTrackId && _rangeTrackId !== nextId) _rememberCurrentRangeForTrack(_rangeTrackId);
    if (nextId && _rangeTrackId !== nextId) _restoreRangeForTrack(track);
    if (!nextId) {
      _rangeTrackId = '';
      _rangeActive = false;
      _rangeStart = -1;
      _rangeEnd = -1;
    }
    if (typeof _updateRangeUI === 'function') _updateRangeUI();
  }

  function _bindIf(root, selector, type, handler) {
    var node = root && root.querySelector ? root.querySelector(selector) : null;
    if (node) node.addEventListener(type, handler);
    return node;
  }

  function _bindId(id, type, handler) {
    var node = document.getElementById(id);
    if (node) node.addEventListener(type, handler);
    return node;
  }

  function _readNumberInput(id, fallback) {
    var input = document.getElementById(id);
    if (!input) return fallback;
    var value = Number(input.value);
    return isFinite(value) ? value : fallback;
  }

  function _getFavoriteTracksForVideo() {
    var ids = [];
    try { ids = JSON.parse(localStorage.getItem('hmix_favorites') || '[]').map(String); } catch (e) {}
    return ids.map(_getTrackById).filter(Boolean);
  }

  function _getInsertionRangeForTrack(track) {
    var current = _getCurrentTrack();
    var fullDur = _getTrackDuration(track) || _getVideoDurationForTimeline() || 30;
    var saved = track && track.id != null ? _rangeMemoryByTrackId[String(track.id)] : null;
    var useWaveRange = !!(track && current && String(track.id) === String(current.id) && _rangeActive && _rangeStart >= 0 && _rangeEnd > _rangeStart);
    var useSavedRange = !useWaveRange && !!(saved && saved.end - saved.start >= 0.5);
    var start = useWaveRange ? _rangeStart : (useSavedRange ? saved.start : 0);
    var end = useWaveRange ? _rangeEnd : (useSavedRange ? saved.end : fullDur);
    start = Math.max(0, Math.min(start, Math.max(0, fullDur - 0.5)));
    end = Math.max(start + 0.5, Math.min(end, fullDur));
    return {
      track: track,
      start: start,
      end: end,
      hasRange: useWaveRange || useSavedRange,
      fullDur: fullDur
    };
  }

  function _getVideoInsertStart(videoDur, clipDur) {
    var v = _videoWorkbench.video;
    var useQPoint = _isVideoQPointActive();
    var preferred = useQPoint ? _videoWorkbench.qPointTime : (v ? (v.currentTime || 0) : 0);
    var safeClip = Math.max(0.5, Math.min(Number(clipDur) || 0.5, Number(videoDur) || 0.5));
    if (!videoDur || videoDur <= 0) return 0;
    if (useQPoint) return Math.max(0, Math.min(preferred, Math.max(0, videoDur - 0.5)));
    return Math.max(0, Math.min(preferred, Math.max(0, videoDur - safeClip)));
  }

  function _initVideoWorkbench() {
    if (_videoWorkbench.node || document.getElementById('pp-video-workbench')) {
      _videoWorkbench.node = document.getElementById('pp-video-workbench');
      _videoWorkbench.video = document.getElementById('pp-vw-video');
      _syncVideoWorkbenchMode();
      return;
    }

    var dock = document.createElement('section');
    dock.id = 'pp-video-workbench';
    dock.className = 'pp-video-workbench pp-video-workbench--empty pp-video-workbench--compact';
    dock.setAttribute('aria-label', '制作中の動画');
    dock.innerHTML =
      '<input class="pp-vw-file" id="pp-vw-file" type="file" accept="video/*" hidden>' +
      '<div class="pp-vw-shell">' +
        '<div class="pp-vw-preview">' +
          '<video class="pp-vw-video" id="pp-vw-video" playsinline muted></video>' +
          '<button type="button" class="pp-vw-hero-play" id="pp-vw-hero-play" aria-label="動画を再生"><span>再生</span></button>' +
          '<button type="button" class="pp-vw-empty" id="pp-vw-empty">' +
            '<span class="pp-vw-empty__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 10l4.5-2.5v9L15 14"/><rect x="3" y="6" width="12" height="12" rx="2"/><path d="M8 11v2"/><path d="M10 12H6"/></svg></span>' +
            '<strong>制作中の動画</strong>' +
            '<span>動画をアップロード</span>' +
          '</button>' +
        '</div>' +
        '<div class="pp-vw-body">' +
          '<div class="pp-vw-head">' +
            '<div class="pp-vw-titlewrap">' +
              '<span class="pp-vw-kicker">VIDEO WORKBENCH</span>' +
              '<strong class="pp-vw-title" id="pp-vw-title">制作中の動画</strong>' +
            '</div>' +
            '<div class="pp-vw-mode-switch" role="group" aria-label="動画ツール表示">' +
              '<button type="button" class="pp-vw-mode-btn pp-vw-mode-btn--resident" data-vw-mode="resident">常駐化</button>' +
              '<button type="button" class="pp-vw-mode-btn pp-vw-mode-btn--resident-large" data-vw-mode="residentLarge">最大化</button>' +
              '<button type="button" class="pp-vw-mode-btn pp-vw-mode-btn--edit" data-vw-edit>編集画面へ</button>' +
              '<button type="button" class="pp-vw-mode-btn pp-vw-mode-btn--qpoint" id="pp-vw-qpoint-toggle" aria-pressed="true">Q ON</button>' +
              '<button type="button" class="pp-vw-mode-btn pp-vw-mode-btn--hidden" data-vw-mode="hidden" aria-label="非表示">＿</button>' +
            '</div>' +
            '<button type="button" class="pp-vw-icon pp-vw-close" id="pp-vw-close" aria-label="動画を外す"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
            '<button type="button" class="pp-vw-btn pp-vw-btn--fav" id="pp-vw-insert-fav"><span>お気に入りから挿入</span></button>' +
            '<button type="button" class="pp-vw-btn pp-vw-btn--memo" id="pp-vw-insert-memo"><span>メモ帳へ反映</span></button>' +
          '</div>' +
          '<div class="pp-vw-transport" aria-label="動画の操作"><button type="button" id="pp-vw-play-inline">再生</button><button type="button" id="pp-vw-pause-inline">一時停止</button><button type="button" id="pp-vw-stop-inline">停止</button><button type="button" id="pp-vw-repeat-inline" aria-pressed="false">リピート OFF</button></div>' +
          '<label class="pp-vw-video-volume"><span>動画音声</span><input type="range" id="pp-vw-video-volume" min="0" max="100" value="100" aria-label="動画音声の音量"><strong id="pp-vw-video-volume-label">100%</strong></label>' +
          '<div class="pp-vw-timeline-board">' +
            '<div class="pp-vw-lane pp-vw-lane--video"><div class="pp-vw-lane-head"><span>動画</span><strong id="pp-vw-video-label">0:00</strong></div><div class="pp-vw-lane-track" id="pp-vw-video-lane"><i class="pp-vw-playhead" id="pp-vw-video-head"></i></div></div>' +
            '<div class="pp-vw-lane pp-vw-lane--music"><div class="pp-vw-lane-head"><span>楽曲</span><strong id="pp-vw-music-label">未配置</strong></div><div class="pp-vw-lane-track" id="pp-vw-music-lane"></div></div>' +
            '<div class="pp-vw-music-volume"><span>楽曲音量</span><input type="range" id="pp-vw-music-volume" min="0" max="100" value="100"><strong id="pp-vw-music-volume-label">100%</strong></div>' +
          '</div>' +
          '<label class="pp-vw-mute"><input type="checkbox" id="pp-vw-mute-video" checked><span>動画の音声をミュート</span><em>楽曲のフェードでクロスフェード</em></label>' +
          '<div class="pp-vw-statusbar"><span id="pp-vw-sync-status">動画停止 / BGM停止</span><span id="pp-vw-clip-status">未配置</span></div>' +
          '<div class="pp-vw-qpoint"><span>Qポイント</span><strong id="pp-vw-qpoint-label">未設定</strong><button type="button" id="pp-vw-qpoint-set">現在位置に設定</button><button type="button" id="pp-vw-qpoint-clear">解除</button></div>' +
          '<div class="pp-vw-goal"><span>合わせ位置</span><strong id="pp-vw-goal-label">未設定</strong><button type="button" id="pp-vw-goal-set">現在位置に設定</button><button type="button" id="pp-vw-goal-align">選択曲の先頭を合わせる</button></div>' +
          '<div class="pp-vw-editor" id="pp-vw-editor" hidden><div class="pp-vw-editor__head"><strong>配置音源の調整</strong><span id="pp-vw-editor-title">未選択</span></div><label>動画開始 <input type="number" id="pp-vw-edit-video-start" min="0" step="0.1" value="0"><span>秒</span></label><label>曲開始 <input type="number" id="pp-vw-edit-music-start" min="0" step="0.1" value="0"><span>秒</span></label><label>長さ <input type="number" id="pp-vw-edit-length" min="0.5" step="0.1" value="1"><span>秒</span></label><label>フェードIN <input type="number" id="pp-vw-edit-fade-in" min="0" step="0.1" value="0"><span>秒</span></label><label>フェードOUT <input type="number" id="pp-vw-edit-fade-out" min="0" step="0.1" value="0"><span>秒</span></label></div>' +
          '<div class="pp-vw-actions">' +
            '<button type="button" class="pp-vw-btn pp-vw-play" id="pp-vw-play"><svg class="pp-vw-playicon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="7 4 19 12 7 20 7 4"/></svg><span>再生</span></button>' +
            '<button type="button" class="pp-vw-btn" id="pp-vw-upload"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5"/></svg><span>動画を選ぶ</span></button>' +
            '<button type="button" class="pp-vw-btn pp-vw-btn--delete" id="pp-vw-delete-clip" disabled><span>選択削除</span></button>' +
            '<button type="button" class="pp-vw-btn pp-vw-btn--update" id="pp-vw-update-clip" disabled><span>範囲更新</span></button>' +
            '<button type="button" class="pp-vw-btn pp-vw-btn--memo" id="pp-vw-copy-memo"><span>編集メモ</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';

    (document.getElementById('pp-tab-video') || document.body).appendChild(dock);
    _videoWorkbench.node = dock;
    _videoWorkbench.video = dock.querySelector('#pp-vw-video');
    _videoWorkbench.fileInput = dock.querySelector('#pp-vw-file');
    var actions = dock.querySelector('.pp-vw-actions');
    ['#pp-vw-insert-fav', '#pp-vw-insert-memo'].forEach(function (selector) {
      var btn = dock.querySelector(selector);
      if (actions && btn) actions.appendChild(btn);
    });
    ['click', 'pointerdown', 'mousedown', 'touchstart'].forEach(function (type) {
      dock.addEventListener(type, function (e) { e.stopPropagation(); });
    });
    if (!dock.querySelector('.pp-vw-timeline-board')) {
      var timelineAnchor = dock.querySelector('.pp-vw-body') || dock;
      timelineAnchor.insertAdjacentHTML('beforeend',
        '<div class="pp-vw-timeline-board">' +
          '<div class="pp-vw-lane pp-vw-lane--video"><div class="pp-vw-lane-head"><span>動画</span><strong id="pp-vw-video-label">0:00</strong></div><div class="pp-vw-lane-track" id="pp-vw-video-lane"><i class="pp-vw-playhead" id="pp-vw-video-head"></i></div></div>' +
          '<div class="pp-vw-lane pp-vw-lane--music"><div class="pp-vw-lane-head"><span>楽曲</span><strong id="pp-vw-music-label">未配置</strong></div><div class="pp-vw-lane-track" id="pp-vw-music-lane"></div></div>' +
        '</div>' +
        '<label class="pp-vw-mute"><input type="checkbox" id="pp-vw-mute-video" checked><span>動画の音声をミュート</span><em>楽曲のフェードでクロスフェード</em></label>');
    }
    var actionBar = dock.querySelector('.pp-vw-actions');
    if (actionBar) {
      actionBar.insertAdjacentHTML('afterbegin',
        '<button type="button" class="pp-vw-btn pp-vw-btn--insert" id="pp-vw-insert-current"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/><path d="M4 6h3"/><path d="M17 18h3"/></svg><span>楽曲を挿入</span></button>');
    }
    _refineVideoWorkbenchActions(dock);
    _localizeVideoWorkbenchUI(dock);
    var shell = dock.querySelector('.pp-vw-shell');
    if (shell) {
      shell.insertAdjacentHTML('beforeend',
        '<button type="button" class="pp-vw-drag-handle" id="pp-vw-drag-handle" aria-label="動画ツールを移動"></button>' +
        '<span class="pp-vw-resize-handle pp-vw-resize-handle--nw" data-vw-resize="nw" aria-hidden="true"></span>' +
        '<span class="pp-vw-resize-handle pp-vw-resize-handle--ne" data-vw-resize="ne" aria-hidden="true"></span>' +
        '<span class="pp-vw-resize-handle pp-vw-resize-handle--sw" data-vw-resize="sw" aria-hidden="true"></span>' +
        '<span class="pp-vw-resize-handle pp-vw-resize-handle--se" data-vw-resize="se" aria-hidden="true"></span>');
    }

    _bindIf(dock, '#pp-vw-empty', 'click', function () { _videoWorkbench.fileInput.click(); });
    _bindIf(dock, '#pp-vw-upload', 'click', function () { _videoWorkbench.fileInput.click(); });
    _bindIf(dock, '#pp-vw-play', 'click', _toggleVideoWorkbenchPlayback);
    _bindIf(dock, '#pp-vw-play-inline', 'click', _playVideoWorkbench);
    _bindIf(dock, '#pp-vw-hero-play', 'click', _playVideoWorkbench);
    _bindIf(dock, '#pp-vw-pause-inline', 'click', _pauseVideoWorkbench);
    _bindIf(dock, '#pp-vw-stop-inline', 'click', _stopVideoWorkbench);
    _bindIf(dock, '#pp-vw-repeat-inline', 'click', _toggleVideoWorkbenchRepeat);
    _bindIf(dock, '#pp-vw-music-volume', 'input', _updateVideoWorkbenchMusicVolume);
    _bindIf(dock, '#pp-vw-video-volume', 'input', _updateVideoAudioMix);
    _bindIf(dock, '#pp-vw-close', 'click', _clearVideoWorkbench);
    _bindIf(dock, '#pp-vw-qpoint-set', 'click', _setVideoQPointAtCurrentTime);
    _bindIf(dock, '#pp-vw-qpoint-clear', 'click', _clearVideoQPoint);
    _bindIf(dock, '#pp-vw-qpoint-toggle', 'click', _toggleVideoQPointEnabled);
    _bindIf(dock, '#pp-vw-goal-set', 'click', _setVideoGoalAtCurrentTime);
    _bindIf(dock, '#pp-vw-goal-align', 'click', _alignSelectedClipToVideoGoal);
    _bindIf(dock, '#pp-vw-lane-play', 'click', _playVideoWorkbench);
    _bindIf(dock, '#pp-vw-lane-pause', 'click', _pauseVideoWorkbench);
    _bindIf(dock, '#pp-vw-lane-stop', 'click', _stopVideoWorkbench);
    _bindIf(dock, '#pp-vw-lane-repeat', 'click', _toggleVideoWorkbenchRepeat);
    _bindIf(dock, '#pp-vw-lane-qpoint-toggle', 'click', _toggleVideoQPointEnabled);
    _bindIf(dock, '#pp-vw-insert-current', 'click', _toggleVideoInsertMenu);
    _bindIf(dock, '#pp-vw-insert-menu-toggle', 'click', _toggleVideoInsertMenu);
    _bindIf(dock, '#pp-vw-insert-menu-current', 'click', function () { _closeVideoInsertMenu(); _insertCurrentRangeToVideo(); });
    _bindIf(dock, '#pp-vw-insert-menu-fav', 'click', function () { _closeVideoInsertMenu(); _openVideoFavoritePicker(); });
    _bindIf(dock, '#pp-vw-delete-clip', 'click', _deleteSelectedVideoClip);
    _bindIf(dock, '#pp-vw-update-clip', 'click', _updateSelectedVideoClipFromCurrentRange);
    _bindIf(dock, '#pp-vw-copy-memo', 'click', _copyVideoWorkbenchMemo);
    _bindIf(dock, '#pp-vw-insert-fav', 'click', _openVideoFavoritePicker);
    _bindIf(dock, '#pp-vw-insert-memo', 'click', _insertVideoWorkbenchMemoToNotepad);
    _bindIf(dock, '#pp-vw-mute-video', 'change', _updateVideoAudioMix);
    dock.querySelectorAll('[data-vw-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var nextMode = btn.getAttribute('data-vw-mode') || 'max';
        _setVideoWorkbenchDisplayMode(nextMode);
      });
    });
    dock.querySelectorAll('[data-vw-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _openVideoEditChoiceDialog();
      });
    });
    ['video-start', 'music-start', 'length', 'fade-in', 'fade-out'].forEach(function (name) {
      var input = dock.querySelector('#pp-vw-edit-' + name);
      if (input) input.addEventListener('input', _updateSelectedVideoClipFromEditor);
    });
    _bindIf(dock, '#pp-vw-drag-handle', 'pointerdown', _startVideoWorkbenchDrag);
    _bindIf(dock, '.pp-vw-shell', 'pointerdown', _maybeStartVideoWorkbenchDrag);
    dock.querySelectorAll('[data-vw-resize]').forEach(function (handle) {
      handle.addEventListener('pointerdown', _startVideoWorkbenchResize);
    });
    _bindIf(dock, '#pp-vw-video-lane', 'pointerdown', _seekVideoWorkbenchFromLane);
    _bindIf(dock, '#pp-vw-music-lane', 'pointerdown', _startVideoClipDrag);
    _bindIf(dock, '#pp-vw-music-lane', 'click', _handleVideoClipClick);
    _bindIf(dock, '#pp-vw-file', 'change', function () {
      var file = this.files && this.files[0];
      if (file) _setVideoWorkbenchFile(file);
      this.value = '';
    });
    _videoWorkbench.video.addEventListener('loadedmetadata', function () {
      _videoWorkbench.duration = _videoWorkbench.video.duration || 0;
      _generateVideoTimelineThumbs();
      var aspect = (_videoWorkbench.video.videoWidth && _videoWorkbench.video.videoHeight)
        ? (_videoWorkbench.video.videoWidth / _videoWorkbench.video.videoHeight)
        : (16 / 9);
      if (_videoWorkbench.node) _videoWorkbench.node.style.setProperty('--vw-aspect', String(aspect));
      _updateVideoWorkbenchDetails();
      _updateVideoWorkbenchTime();
      _renderVideoWorkbenchTimeline();
      _updateVideoAudioMix();
    });
    _videoWorkbench.video.addEventListener('timeupdate', _updateVideoWorkbenchTime);
    _videoWorkbench.video.addEventListener('seeking', function () { _syncMusicToVideo(true, !_videoWorkbench.video.paused); });
    _videoWorkbench.video.addEventListener('ended', function () {
      if (_videoWorkbench.repeat) {
        _videoWorkbench.video.currentTime = Math.max(0, _isVideoQPointActive() ? _videoWorkbench.qPointTime : 0);
        _videoWorkbench.video.play().then(function () { _syncMusicToVideo(true, true); }).catch(function () {});
      } else {
        _pauseWorkbenchMusic(_videoText('動画終了 / BGM停止', 'Video ended / BGM stopped'));
      }
    });
    _videoWorkbench.video.addEventListener('play', _updateVideoWorkbenchPlayState);
    _videoWorkbench.video.addEventListener('pause', _updateVideoWorkbenchPlayState);
    document.addEventListener('keydown', function (e) {
      if (!_videoWorkbench.node || !_videoWorkbench.selectedClipId) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (!_videoWorkbench.node.classList.contains('pp-video-workbench--focus')) return;
      e.preventDefault();
      _deleteSelectedVideoClip();
    });

    if (_panel && !_videoWorkbench.observer) {
      _videoWorkbench.observer = new MutationObserver(_syncVideoWorkbenchMode);
      _videoWorkbench.observer.observe(_panel, { attributes: true, attributeFilter: ['class'] });
    }

    _syncVideoWorkbenchMode();
    _updateVideoWorkbenchDetails();
    _renderVideoWorkbenchTimeline();
    _localizeVideoWorkbenchUI(dock);
  }

  function _setVideoWorkbenchDisplayMode(mode) {
    if (mode === 'residentMedium') mode = 'resident';
    if (mode !== 'small' && mode !== 'resident' && mode !== 'residentLarge' && mode !== 'hidden') mode = 'max';
    if (mode === 'residentLarge' && _videoWorkbench.displayMode !== 'residentLarge') {
      _videoWorkbench.residentLargeBrowse = _isVideoWorkbenchBrowseMode(_videoWorkbench.displayMode);
    }
    if (mode === 'resident') _videoWorkbench.residentLargeBrowse = true;
    if (mode === 'max') _videoWorkbench.residentLargeBrowse = false;
    _videoWorkbench.displayMode = mode;
    if (!_isVideoWorkbenchResidentMode(mode) && mode !== 'hidden' && _panel && !_panel.classList.contains('is-open')) {
      _panel.classList.add('is-open');
      if (_toggleBtn) {
        _toggleBtn.classList.add('is-open');
        _applyToggleLang();
      }
    }
    _placeVideoWorkbenchNodeForMode(mode);
    if (_isVideoWorkbenchResidentMode(mode)) {
      _closeToolPanelForResidentVideo();
      _restoreGlobalPlayerVolume();
    }
    if (_videoWorkbench.node) {
      _videoWorkbench.node.style.left = '';
      _videoWorkbench.node.style.top = '';
      _videoWorkbench.node.style.right = '';
      _videoWorkbench.node.style.bottom = '';
      _videoWorkbench.node.style.width = '';
      _videoWorkbench.node.style.height = '';
      _videoWorkbench.node.style.transform = '';
    }
    _syncVideoWorkbenchMode();
    if (mode === 'residentLarge' && !_isVideoWorkbenchBrowseMode(mode)) {
      _syncMusicToVideo(true, !!(_videoWorkbench.video && !_videoWorkbench.video.paused));
    }
  }

  function _closeToolPanelForResidentVideo() {
    if (_panel) _panel.classList.remove('is-open');
    if (_toggleBtn) {
      _toggleBtn.classList.remove('is-open');
      _applyToggleLang();
    }
  }

  function _showVideoWorkbenchFromPanel() {
    if (_isVideoToolBlockedForMobile()) {
      _showVideoMobileBlockedNotice();
      _syncVideoToolAvailability();
      return;
    }
    _setVideoWorkbenchDisplayMode('max');
    _openToolboxTab('video');
    if (!_videoWorkbench.objectUrl && _videoWorkbench.fileInput) {
      setTimeout(function () { _videoWorkbench.fileInput.click(); }, 80);
    }
  }

  function _isVideoToolBlockedForMobile() {
    return !!(window.matchMedia && window.matchMedia('(max-width: 767px)').matches);
  }

  function _showVideoMobileBlockedNotice() {
    _showPanelToast('\u52d5\u753b\u30c4\u30fc\u30eb\u306fPC\u7248\u3067\u3054\u5229\u7528\u304f\u3060\u3055\u3044\u3002');
  }

  function _markToolboxV2AndVideoBeta() {
    if (!_panel) return;
    var title = _panel.querySelector('.player-panel__stage-title strong');
    if (title) {
      title.dataset.ja = '\u5236\u4f5c\u30c4\u30fc\u30eb\u30dc\u30c3\u30af\u30b9 V2';
      title.dataset.en = 'Creator Toolbox V2';
      title.textContent = _isEn() ? title.dataset.en : title.dataset.ja;
    }
    var videoTab = _panel.querySelector('.player-panel__tab[data-tab="video"]');
    if (videoTab) {
      videoTab.classList.add('is-beta');
      videoTab.setAttribute('data-beta', 'Beta');
    }
    var launch = document.getElementById('pp-video-launch');
    if (launch) {
      launch.classList.add('is-beta');
      launch.setAttribute('data-beta', 'Beta');
    }
  }

  function _syncVideoToolAvailability() {
    if (!_panel) return;
    var blocked = _isVideoToolBlockedForMobile();
    var message = _videoText('動画ツールはPC版でご利用ください。', 'Video tools are available on desktop.');
    var tab = _panel.querySelector('.player-panel__tab[data-tab="video"]');
    var launch = document.getElementById('pp-video-launch');
    [tab, launch].forEach(function (node) {
      if (!node) return;
      node.classList.toggle('is-mobile-disabled', blocked);
      node.setAttribute('aria-disabled', String(blocked));
      if (blocked) node.setAttribute('title', message);
      else node.removeAttribute('title');
    });
    if (blocked && _videoWorkbench.displayMode !== 'hidden') {
      _videoWorkbench.displayMode = 'hidden';
      _syncVideoWorkbenchMode();
    }
    if (blocked && tab && tab.classList.contains('is-active')) {
      var fallbackTab = _panel.querySelector('.player-panel__tab[data-tab="license"]');
      var fallbackContent = document.getElementById('pp-tab-license');
      _panel.querySelectorAll('.player-panel__tab').forEach(function (t) { t.classList.remove('is-active'); });
      _panel.querySelectorAll('.player-panel__content').forEach(function (c) { c.classList.remove('is-active'); });
      if (fallbackTab) fallbackTab.classList.add('is-active');
      if (fallbackContent) fallbackContent.classList.add('is-active');
    }
  }

  function _isVideoWorkbenchResidentMode(mode) {
    mode = mode || _videoWorkbench.displayMode;
    return mode === 'resident' || mode === 'residentMedium' || mode === 'residentLarge';
  }

  function _canMoveVideoWorkbench() {
    return _isVideoWorkbenchResidentMode();
  }

  function _isVideoWorkbenchBrowseMode(mode) {
    mode = mode || _videoWorkbench.displayMode;
    return mode === 'resident' || (mode === 'residentLarge' && _videoWorkbench.residentLargeBrowse !== false);
  }

  function _hasVideoWorkbenchVideo() {
    var v = _videoWorkbench.video;
    return !!(v && (v.src || _videoWorkbench.objectUrl));
  }

  function _isVideoWorkbenchEditingMode() {
    return _hasVideoWorkbenchVideo() && _videoWorkbench.displayMode === 'max';
  }

  function _getCurrentTrackId() {
    var track = _getCurrentTrack();
    return track && track.id != null ? String(track.id) : '';
  }

  function _getTrackTitleById(id) {
    var track = _getTrackById(id);
    return track ? _getTrackTitle(track) : (id || _videoText('現在の曲', 'Current track'));
  }

  function _restartVideoAtQPoint(shouldPlay) {
    var v = _videoWorkbench.video;
    if (!v || !v.src) return;
    var dur = v.duration || _videoWorkbench.duration || 0;
    var target = (_videoWorkbench.qPointEnabled && _videoWorkbench.qPointTime >= 0) ? _videoWorkbench.qPointTime : 0;
    if (dur) target = Math.max(0, Math.min(target, Math.max(0, dur - 0.05)));
    try { v.currentTime = target; } catch (e) {}
    _updateVideoWorkbenchTime();
    if (shouldPlay) v.play().then(function () { _syncMusicToVideo(true, true); }).catch(function () {});
  }

  function _restoreGlobalPlayerVolume() {
    var audio = _getPlayerAudio();
    var volEl = document.getElementById('player-volume');
    if (!audio || !volEl) return;
    audio.volume = Math.max(0, Math.min(1, (parseInt(volEl.value, 10) || 0) / 100));
  }

  function _placeVideoWorkbenchNodeForMode(mode) {
    if (!_videoWorkbench.node) return;
    var host = _isVideoWorkbenchResidentMode(mode) ? document.body : (document.getElementById('pp-tab-video') || document.body);
    if (_videoWorkbench.node.parentNode !== host) host.appendChild(_videoWorkbench.node);
  }

  function _selectToolTab(name) {
    if (!_panel) return;
    var tab = _panel.querySelector('.player-panel__tab[data-tab="' + name + '"]');
    if (tab) tab.click();
  }

  function _openToolboxTab(name) {
    if (_panel) {
      _panel.classList.add('is-open');
    }
    if (_toggleBtn) {
      _toggleBtn.classList.add('is-open');
      _applyToggleLang();
    }
    _selectToolTab(name);
  }

  function _openVideoWorkbenchEditorTab() {
    _setVideoWorkbenchDisplayMode('max');
    _openToolboxTab('video');
  }

  function _prepareVideoWorkbenchClipForEditing(clip) {
    if (!clip) return false;
    _videoWorkbench.selectedClipId = clip.id;
    _syncWaveRangeToClip(clip);
    _renderVideoWorkbenchTimeline();
    _renderVideoWorkbenchClipEditor();
    return true;
  }

  function _getVideoWorkbenchClipForTrack(track) {
    if (!track || track.id == null) return null;
    var trackId = String(track.id);
    return (_videoWorkbench.clips || []).find(function (clip) {
      return clip && clip.trackId != null && String(clip.trackId) === trackId;
    }) || null;
  }

  function _syncVideoWorkbenchModeButtons() {
    if (!_videoWorkbench.node) return;
    _videoWorkbench.node.querySelectorAll('[data-vw-mode]').forEach(function (btn) {
      var active = btn.getAttribute('data-vw-mode') === (_videoWorkbench.displayMode || 'max');
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function _syncGlobalPlayerVideoLock() {
    var player = document.getElementById('global-player');
    var v = _videoWorkbench.video;
    var locked = !!(v && v.src && !v.paused && !_isVideoWorkbenchBrowseMode());
    if (!player) return;
    player.classList.toggle('video-workbench-locked', locked);
    player.setAttribute('data-video-lock', locked ? 'true' : 'false');
    player.querySelectorAll('#player-btn-play, #player-btn-prev, #player-btn-next, #player-seekbar').forEach(function (node) {
      if (locked) {
        node.setAttribute('aria-disabled', 'true');
        node.setAttribute('title', _videoText('動画再生中はこのボタンで楽曲を再生できません', 'Music playback is locked while the video is playing'));
      } else {
        node.removeAttribute('aria-disabled');
        node.removeAttribute('title');
      }
    });
  }

  function _showGlobalPlayerLockNotice() {
    var player = document.getElementById('global-player');
    if (!player || !player.classList.contains('video-workbench-locked')) return;
    var notice = document.getElementById('player-video-lock-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'player-video-lock-notice';
      notice.className = 'player-video-lock-notice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      player.appendChild(notice);
    }
    notice.textContent = _videoText('動画を再生中はこのボタンで楽曲を再生できません', 'Music playback is locked while the video is playing');
    notice.classList.remove('is-show');
    window.clearTimeout(notice._timer);
    requestAnimationFrame(function () {
      notice.classList.add('is-show');
      notice._timer = window.setTimeout(function () {
        notice.classList.remove('is-show');
      }, 1900);
    });
  }

  function _installGlobalPlayerLockNotice(player) {
    if (!player || player._videoLockNoticeInstalled) return;
    player._videoLockNoticeInstalled = true;
    var center = player.querySelector('.player-center');
    if (center) {
      center.addEventListener('pointerenter', _showGlobalPlayerLockNotice);
      center.addEventListener('pointerdown', _showGlobalPlayerLockNotice);
      center.addEventListener('click', _showGlobalPlayerLockNotice);
    }
    player.addEventListener('pointerdown', function (e) {
      if (!player.classList.contains('video-workbench-locked')) return;
      if (e.target && e.target.closest && e.target.closest('.player-center, .player-controls, .seekbar')) {
        _showGlobalPlayerLockNotice();
      }
    }, true);
  }

  function _refineVideoWorkbenchActions(dock) {
    if (!dock) return;
    var head = dock.querySelector('.pp-vw-head');
    var actions = dock.querySelector('.pp-vw-actions');
    var preview = dock.querySelector('.pp-vw-preview');
    var body = dock.querySelector('.pp-vw-body');
    var upload = dock.querySelector('#pp-vw-upload');
    dock.querySelectorAll('.pp-vw-meta, .pp-vw-progress, .pp-vw-statusbar').forEach(function (node) {
      node.remove();
    });
    if (head && upload) {
      upload.classList.add('pp-vw-btn--video-menu');
      var uploadLabel = upload.querySelector('span');
      if (uploadLabel) uploadLabel.textContent = '\u52d5\u753b\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9';
      head.appendChild(upload);
    }
    var close = dock.querySelector('#pp-vw-close');
    if (close) {
      close.setAttribute('aria-label', '\u52d5\u753b\u3092\u524a\u9664');
      close.setAttribute('title', '\u52d5\u753b\u3092\u524a\u9664');
      close.innerHTML = '<span>\u52d5\u753b\u3092\u524a\u9664</span>';
    }
    ['#pp-vw-play', '#pp-vw-delete-clip', '#pp-vw-update-clip', '#pp-vw-copy-memo', '#pp-vw-insert-fav'].forEach(function (selector) {
      var node = dock.querySelector(selector);
      if (node) node.remove();
    });
    var insert = dock.querySelector('#pp-vw-insert-current');
    if (actions && insert && !dock.querySelector('#pp-vw-insert-menu-toggle')) {
      var insertLabel = insert.querySelector('span');
      if (insertLabel) insertLabel.textContent = '\u697d\u66f2\u3092\u633f\u5165';
      var wrap = document.createElement('div');
      wrap.className = 'pp-vw-insert-menu';
      insert.parentNode.insertBefore(wrap, insert);
      wrap.appendChild(insert);
      insert.insertAdjacentHTML('afterend',
        '<button type="button" class="pp-vw-btn pp-vw-btn--insert-toggle" id="pp-vw-insert-menu-toggle" aria-expanded="false" aria-label="\u697d\u66f2\u633f\u5165\u30e1\u30cb\u30e5\u30fc">\u2304</button>' +
        '<div class="pp-vw-insert-menu__panel" id="pp-vw-insert-menu-panel" hidden>' +
          '<button type="button" id="pp-vw-insert-menu-current"><strong>\u73fe\u5728\u306e\u66f2\u3092\u633f\u5165</strong><span>\u6ce2\u5f62\u306e\u9078\u629e\u7bc4\u56f2\u3092\u52d5\u753b\u306b\u914d\u7f6e</span></button>' +
          '<button type="button" id="pp-vw-insert-menu-fav"><strong>\u304a\u6c17\u306b\u5165\u308a\u304b\u3089\u633f\u5165</strong><span>\u4fdd\u5b58\u6e08\u307f\u306e\u5019\u88dc\u304b\u3089\u9078\u3076</span></button>' +
        '</div>');
    }
    var transport = dock.querySelector('.pp-vw-transport');
    if (preview && transport && transport.parentNode !== preview) {
      preview.appendChild(transport);
    }
    var menu = dock.querySelector('.pp-vw-insert-menu');
    var videoHead = dock.querySelector('.pp-vw-lane--video .pp-vw-lane-head');
    var musicHead = dock.querySelector('.pp-vw-lane--music .pp-vw-lane-head');
    if (videoHead && !videoHead.querySelector('.pp-vw-lane-transport')) {
      videoHead.insertAdjacentHTML('beforeend',
        '<div class="pp-vw-lane-transport" aria-label="\u52d5\u753b\u306e\u64cd\u4f5c">' +
          '<button type="button" id="pp-vw-lane-play">\u518d\u751f</button>' +
          '<button type="button" id="pp-vw-lane-pause">\u4e00\u6642\u505c\u6b62</button>' +
          '<button type="button" id="pp-vw-lane-stop">\u505c\u6b62</button>' +
          '<button type="button" id="pp-vw-lane-repeat" aria-pressed="false">\u30eb\u30fc\u30d7OFF</button>' +
          '<button type="button" id="pp-vw-lane-qpoint-toggle" aria-pressed="true">Q ON</button>' +
        '</div>');
    }
    _ensureVideoQPointMenus(dock);
    if (musicHead && menu && menu.parentNode !== musicHead) {
      musicHead.appendChild(menu);
    }
    if (preview && head && head.parentNode !== preview) {
      preview.insertBefore(head, preview.firstChild);
    }
    _placeVideoWorkbenchVolumeControl();
    _syncVideoTransportControls();
  }

  function _placeVideoWorkbenchVolumeControl() {
    var dock = _videoWorkbench.node;
    if (!dock) return;
    var videoVolume = dock.querySelector('.pp-vw-video-volume');
    if (!videoVolume) return;
    var mode = _videoWorkbench.displayMode || 'max';
    var body = dock.querySelector('.pp-vw-body');
    var videoLane = dock.querySelector('.pp-vw-lane--video');
    if (_isVideoWorkbenchResidentMode(mode)) {
      if (body && videoVolume.parentNode !== body) body.appendChild(videoVolume);
    } else if (videoLane && videoVolume.parentNode !== videoLane) {
      videoLane.appendChild(videoVolume);
    }
  }

  function _toggleVideoInsertMenu(e) {
    if (e) e.stopPropagation();
    var panel = document.getElementById('pp-vw-insert-menu-panel');
    var toggle = document.getElementById('pp-vw-insert-menu-toggle');
    if (!panel) return;
    var nextHidden = !panel.hidden ? true : false;
    panel.hidden = nextHidden;
    if (toggle) toggle.setAttribute('aria-expanded', String(!nextHidden));
  }

  function _closeVideoInsertMenu() {
    var panel = document.getElementById('pp-vw-insert-menu-panel');
    var toggle = document.getElementById('pp-vw-insert-menu-toggle');
    if (panel) panel.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function _placeRangeControlsNearWaveform() {
    var waveform = document.getElementById('pp-waveform-wrap');
    var controls = document.getElementById('pp-range-controls');
    if (waveform && controls && controls.previousElementSibling !== waveform) {
      waveform.insertAdjacentElement('afterend', controls);
    }
    _ensureRangeFadeControls();
  }

  function _ensureRangeFadeControls() {
    var controls = document.getElementById('pp-range-controls');
    if (!controls || controls.querySelector('.pp-range-fade-side')) return;
    controls.insertAdjacentHTML('afterbegin',
      '<div class="pp-range-fade-side pp-range-fade-side--in" aria-label="\u30d5\u30a7\u30fc\u30c9\u5165">' +
        '<span>\u30d5\u30a7\u30fc\u30c9\u5165</span>' +
        '<button type="button" data-range-fade-in="0">OFF</button><button type="button" data-range-fade-in="0.5">0.5s</button><button type="button" data-range-fade-in="1">1s</button><button type="button" data-range-fade-in="2">2s</button><button type="button" data-range-fade-in="3">3s</button>' +
      '</div>');
    controls.insertAdjacentHTML('beforeend',
      '<div class="pp-range-fade-side pp-range-fade-side--out" aria-label="\u30d5\u30a7\u30fc\u30c9\u51fa">' +
        '<span>\u30d5\u30a7\u30fc\u30c9\u51fa</span>' +
        '<button type="button" data-range-fade-out="0">OFF</button><button type="button" data-range-fade-out="1">1s</button><button type="button" data-range-fade-out="2">2s</button><button type="button" data-range-fade-out="3">3s</button><button type="button" data-range-fade-out="5">5s</button>' +
      '</div>');
    controls.querySelectorAll('[data-range-fade-in]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _fadeInSec = parseFloat(btn.dataset.rangeFadeIn) || 0;
        _syncRangeFadeUI();
        _syncSelectedVideoClipFromWaveform();
        if (typeof _drawWaveform === 'function') _drawWaveform();
      });
    });
    controls.querySelectorAll('[data-range-fade-out]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _fadeOutSec = parseFloat(btn.dataset.rangeFadeOut) || 0;
        _syncRangeFadeUI();
        _syncSelectedVideoClipFromWaveform();
        if (typeof _drawWaveform === 'function') _drawWaveform();
      });
    });
    _syncRangeFadeUI();
  }

  function _syncRangeFadeUI() {
    var controls = document.getElementById('pp-range-controls');
    if (!controls) return;
    controls.querySelectorAll('[data-range-fade-in]').forEach(function (btn) {
      btn.classList.toggle('is-active', Math.abs((parseFloat(btn.dataset.rangeFadeIn) || 0) - _fadeInSec) < 0.05);
    });
    controls.querySelectorAll('[data-range-fade-out]').forEach(function (btn) {
      btn.classList.toggle('is-active', Math.abs((parseFloat(btn.dataset.rangeFadeOut) || 0) - _fadeOutSec) < 0.05);
    });
  }

  function _setVideoWorkbenchFile(file) {
    if (!_videoWorkbench.video || !_videoWorkbench.node) return;
    if (_videoWorkbench.objectUrl) URL.revokeObjectURL(_videoWorkbench.objectUrl);
    _videoWorkbench.objectUrl = URL.createObjectURL(file);
    _videoWorkbench.fileName = file.name || 'uploaded video';
    _videoWorkbench.fileSize = file.size || 0;
    _videoWorkbench.duration = 0;
    _videoWorkbench.goalTime = -1;
    _videoWorkbench.qPointTime = -1;
    _videoWorkbench.timelineThumbs = [];
    _videoWorkbench.thumbToken++;
    _videoWorkbench.video.src = _videoWorkbench.objectUrl;
    _videoWorkbench.video.muted = true;
    _videoWorkbench.node.classList.remove('pp-video-workbench--empty');
    _videoWorkbench.node.classList.add('is-loaded', 'is-attention');
    setTimeout(function () { if (_videoWorkbench.node) _videoWorkbench.node.classList.remove('is-attention'); }, 900);
    _updateVideoWorkbenchDetails();
    _syncVideoWorkbenchMode();
  }

  function _clearVideoWorkbench() {
    var v = _videoWorkbench.video;
    if (!v || !_videoWorkbench.node) return;
    v.pause();
    v.removeAttribute('src');
    v.load();
    if (_videoWorkbench.objectUrl) URL.revokeObjectURL(_videoWorkbench.objectUrl);
    _videoWorkbench.objectUrl = '';
    _videoWorkbench.fileName = '';
    _videoWorkbench.fileSize = 0;
    _videoWorkbench.duration = 0;
    _videoWorkbench.timelineThumbs = [];
    _videoWorkbench.thumbToken++;
    _videoWorkbench.node.classList.add('pp-video-workbench--empty');
    _videoWorkbench.node.classList.remove('is-loaded', 'is-playing');
    _videoWorkbench.clips = [];
    _videoWorkbench.selectedClipId = '';
    _pauseWorkbenchMusic();
    _updateVideoWorkbenchDetails();
    _updateVideoQPointUI();
    _updateVideoGoalUI();
    _updateVideoWorkbenchTime();
    _renderVideoWorkbenchTimeline();
  }

  function _toggleVideoWorkbenchPlayback() {
    var v = _videoWorkbench.video;
    if (!v || !v.src) {
      if (_videoWorkbench.fileInput) _videoWorkbench.fileInput.click();
      return;
    }
    if (v.paused) {
    v.play().then(function () {
        _applyVideoWorkbenchMix(true);
        _syncMusicToVideo(true, true);
      }).catch(function () {});
    } else {
      v.pause();
    }
  }

  function _playVideoWorkbench() {
    var v = _videoWorkbench.video;
    if (!v || !v.src) {
      if (_videoWorkbench.fileInput) _videoWorkbench.fileInput.click();
      return;
    }
    if (_isVideoQPointActive() && (v.duration || _videoWorkbench.duration)) {
      var dur = v.duration || _videoWorkbench.duration || 0;
      v.currentTime = Math.max(0, Math.min(_videoWorkbench.qPointTime, dur));
    }
    _suspendWaveformRangePlaybackForVideo();
    _applyVideoWorkbenchMix(true);
    v.play().then(function () { _syncMusicToVideo(true, true); }).catch(function () {});
  }

  function _pauseVideoWorkbench() {
    var v = _videoWorkbench.video;
    if (v) v.pause();
    _pauseWorkbenchMusic(_videoText('動画一時停止 / BGM停止', 'Video paused / BGM stopped'));
  }

  function _stopVideoWorkbench() {
    var v = _videoWorkbench.video;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    _pauseWorkbenchMusic(_videoText('動画停止 / BGM停止', 'Video stopped / BGM stopped'));
    _updateVideoWorkbenchTime();
    _syncMusicToVideo(true, false);
  }

  function _toggleVideoWorkbenchRepeat() {
    _videoWorkbench.repeat = !_videoWorkbench.repeat;
    _syncVideoTransportControls();
  }

  function _updateVideoWorkbenchMusicVolume(e) {
    var slider = document.getElementById('pp-vw-music-volume');
    var label = document.getElementById('pp-vw-music-volume-label');
    var audio = _getPlayerAudio();
    var value = slider ? Math.max(0, Math.min(100, Number(slider.value) || 0)) : 100;
    if (audio && !_isVideoWorkbenchBrowseMode()) _applyVideoWorkbenchMix(!!(e && e.type));
    if (label) label.textContent = value + '%';
  }

  function _easeVideoFadeRatio(value) {
    value = Math.max(0, Math.min(1, Number(value) || 0));
    return value * value * (3 - (2 * value));
  }

  function _getVideoWorkbenchFadeGain(clip, videoTime) {
    if (!clip) return 1;
    var len = Math.max(0.1, clip.musicEnd - clip.musicStart);
    var rel = Math.max(0, Math.min(len, (Number(videoTime) || 0) - clip.videoStart));
    var fadeIn = Math.max(0, Math.min(Number(clip.fadeIn) || 0, len / 2));
    var fadeOut = Math.max(0, Math.min(Number(clip.fadeOut) || 0, len / 2));
    var gain = 1;
    if (fadeIn > 0 && rel < fadeIn) gain = Math.min(gain, rel / fadeIn);
    if (fadeOut > 0 && len - rel < fadeOut) gain = Math.min(gain, Math.max(0, (len - rel) / fadeOut));
    return _easeVideoFadeRatio(gain);
  }

  function _getVideoWorkbenchMusicBaseVolume() {
    var slider = document.getElementById('pp-vw-music-volume');
    return slider ? Math.max(0, Math.min(100, Number(slider.value) || 0)) / 100 : 1;
  }

  function _getVideoWorkbenchMusicVolume() {
    var base = _getVideoWorkbenchMusicBaseVolume();
    var v = _videoWorkbench.video;
    var clip = v ? _getActiveVideoClip(v.currentTime || 0) : null;
    if (!clip && !_isVideoWorkbenchBrowseMode()) return 0;
    return base * _getVideoWorkbenchFadeGain(clip, v ? v.currentTime || 0 : 0);
  }

  function _setVideoWorkbenchMediaVolume(media, target, stateKey, force) {
    if (!media) return;
    target = Math.max(0, Math.min(1, Number(target) || 0));
    var current = Number(_videoWorkbench[stateKey]);
    if (force || !isFinite(current) || current < 0) {
      current = target;
    } else {
      current += (target - current) * 0.34;
      if (Math.abs(current - target) < 0.004) current = target;
    }
    _videoWorkbench[stateKey] = current;
    try { media.volume = Math.max(0, Math.min(1, current)); } catch (e) {}
  }

  function _getVideoWorkbenchMixTargets() {
    var v = _videoWorkbench.video;
    var muteCtl = document.getElementById('pp-vw-mute-video');
    var videoVolCtl = document.getElementById('pp-vw-video-volume');
    var videoBase = videoVolCtl ? Math.max(0, Math.min(100, Number(videoVolCtl.value) || 0)) / 100 : 1;
    var muted = !!(muteCtl && muteCtl.checked);
    var activeClip = v ? _getActiveVideoClip(v.currentTime || 0) : null;
    var musicGain = activeClip ? _getVideoWorkbenchFadeGain(activeClip, v ? v.currentTime || 0 : 0) : 0;
    var videoGain = 1;
    if (muted && activeClip) {
      videoGain = Math.sqrt(Math.max(0, 1 - (musicGain * musicGain)));
    }
    return {
      video: videoBase * videoGain,
      music: _getVideoWorkbenchMusicBaseVolume() * musicGain,
      muted: muted,
      activeClip: activeClip,
      videoBase: videoBase
    };
  }

  function _applyVideoWorkbenchMix(force) {
    var v = _videoWorkbench.video;
    if (!v) return;
    var targets = _getVideoWorkbenchMixTargets();
    v.muted = false;
    _setVideoWorkbenchMediaVolume(v, targets.video, 'videoVolumeCurrent', force);
    var audio = _getPlayerAudio();
    if (audio && !_isVideoWorkbenchBrowseMode()) {
      _setVideoWorkbenchMediaVolume(audio, targets.music, 'musicVolumeCurrent', force);
    }
    var volLabel = document.getElementById('pp-vw-video-volume-label');
    if (volLabel) volLabel.textContent = Math.round(targets.videoBase * 100) + '%';
    var clip = _getSelectedVideoClip();
    if (clip) clip.muteVideo = targets.muted;
  }

  function _startVideoWorkbenchMixLoop() {
    if (_videoWorkbench.mixRaf) return;
    var tick = function () {
      _videoWorkbench.mixRaf = 0;
      _applyVideoWorkbenchMix(false);
      var v = _videoWorkbench.video;
      if (v && !v.paused && !_isVideoWorkbenchBrowseMode()) {
        _videoWorkbench.mixRaf = requestAnimationFrame(tick);
      }
    };
    _videoWorkbench.mixRaf = requestAnimationFrame(tick);
  }

  function _stopVideoWorkbenchMixLoop() {
    if (!_videoWorkbench.mixRaf) return;
    cancelAnimationFrame(_videoWorkbench.mixRaf);
    _videoWorkbench.mixRaf = 0;
  }

  function _syncVideoWorkbenchMode() {
    if (!_videoWorkbench.node) return;
    var focus = !!(_panel && _panel.classList.contains('is-open'));
    var mode = _videoWorkbench.displayMode || 'max';
    _placeVideoWorkbenchNodeForMode(mode);
    _videoWorkbench.node.classList.toggle('pp-video-workbench--hidden', mode === 'hidden');
    _videoWorkbench.node.classList.toggle('pp-video-workbench--focus', focus && mode === 'max');
    _videoWorkbench.node.classList.toggle('pp-video-workbench--compact', (!focus && !_isVideoWorkbenchResidentMode(mode) && mode !== 'hidden') || mode === 'small');
    _videoWorkbench.node.classList.toggle('pp-video-workbench--small', focus && mode === 'small');
    _videoWorkbench.node.classList.toggle('pp-video-workbench--resident', _isVideoWorkbenchResidentMode(mode));
    _videoWorkbench.node.classList.toggle('pp-video-workbench--resident-medium', false);
    _videoWorkbench.node.classList.toggle('pp-video-workbench--resident-large', mode === 'residentLarge');
    _placeVideoWorkbenchVolumeControl();
    _syncVideoWorkbenchModeButtons();
    _updateVideoQPointToggle();
  }

  function _updateVideoWorkbenchDetails() {
    var title = document.getElementById('pp-vw-title');
    if (!title) return;
    if (!_videoWorkbench.objectUrl) {
      title.textContent = _videoText('制作中の動画', 'Video in progress');
      return;
    }
    title.textContent = _videoWorkbench.fileName || _videoText('制作中の動画', 'Video in progress');
  }

  function _updateVideoWorkbenchTime() {
    var v = _videoWorkbench.video;
    if (!v) return;
    var dur = v.duration || _videoWorkbench.duration || 0;
    var head = document.getElementById('pp-vw-video-head');
    var videoLabel = document.getElementById('pp-vw-video-label');
    if (head) head.style.left = dur ? Math.max(0, Math.min(100, ((v.currentTime || 0) / dur) * 100)) + '%' : '0%';
    if (videoLabel) videoLabel.textContent = dur ? _formatVideoTime(v.currentTime || 0) + ' / ' + _formatVideoTime(dur) : '0:00';
    var musicHead = document.getElementById('pp-vw-music-head');
    var active = _getActiveVideoClip(v.currentTime || 0) || _getSelectedVideoClip();
    if (musicHead && active && dur) {
      var len = Math.max(0.1, active.musicEnd - active.musicStart);
      var rel = Math.max(0, Math.min(len, (v.currentTime || 0) - active.videoStart));
      musicHead.style.left = Math.max(0, Math.min(100, ((active.videoStart + rel) / dur) * 100)) + '%';
      musicHead.hidden = (v.currentTime || 0) < active.videoStart || (v.currentTime || 0) > active.videoStart + len;
    } else if (musicHead) {
      musicHead.hidden = true;
    }
    _updateVideoAudioMix();
    _updateVideoWorkbenchMusicVolume();
    _updateVideoQPointUI();
    _updateVideoGoalUI();
    if (!v.paused && !_isVideoWorkbenchBrowseMode()) _syncMusicToVideo(false, true);
  }

  function _renderVideoTimelineThumbs() {
    var lane = document.getElementById('pp-vw-video-lane');
    if (!lane) return;
    var wrap = document.getElementById('pp-vw-video-thumbs');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'pp-vw-video-thumbs';
      wrap.className = 'pp-vw-video-thumbs';
      lane.insertBefore(wrap, lane.firstChild);
    }
    if (!_videoWorkbench.timelineThumbs || !_videoWorkbench.timelineThumbs.length) {
      wrap.innerHTML = '';
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    wrap.innerHTML = _videoWorkbench.timelineThumbs.map(function (src, index) {
      return '<img src="' + _esc(src) + '" alt="" loading="lazy" style="--thumb-index:' + index + '">';
    }).join('');
  }

  function _generateVideoTimelineThumbs() {
    var src = _videoWorkbench.objectUrl;
    var dur = _getVideoDurationForTimeline();
    var sourceVideo = _videoWorkbench.video;
    if (!src || !dur || !sourceVideo) return;
    var token = ++_videoWorkbench.thumbToken;
    _videoWorkbench.timelineThumbs = [];
    _renderVideoTimelineThumbs();
    var count = Math.max(3, Math.min(8, Math.ceil(dur / 3)));
    var video = document.createElement('video');
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = src;
    var shots = [];
    var captureAt = function (time) {
      return new Promise(function (resolve) {
        var done = false;
        var finish = function () {
          if (done) return;
          done = true;
          try {
            canvas.width = 160;
            canvas.height = Math.max(1, Math.round(160 / ((sourceVideo.videoWidth && sourceVideo.videoHeight) ? (sourceVideo.videoWidth / sourceVideo.videoHeight) : (16 / 9))));
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            shots.push(canvas.toDataURL('image/jpeg', 0.62));
          } catch (e) {}
          resolve();
        };
        video.onseeked = finish;
        window.setTimeout(finish, 900);
        try { video.currentTime = Math.max(0, Math.min(dur - 0.05, time)); } catch (e) { resolve(); }
      });
    };
    video.addEventListener('loadedmetadata', function () {
      (async function () {
        for (var i = 0; i < count; i++) {
          if (token !== _videoWorkbench.thumbToken) return;
          var t = count === 1 ? 0 : (dur * i / (count - 1));
          await captureAt(t);
        }
        if (token !== _videoWorkbench.thumbToken) return;
        _videoWorkbench.timelineThumbs = shots;
        _renderVideoTimelineThumbs();
      })();
    }, { once: true });
  }

  function _updateVideoWorkbenchPlayState() {
    var v = _videoWorkbench.video;
    var dock = _videoWorkbench.node;
    if (!v || !dock) return;
    var playing = !v.paused;
    dock.classList.toggle('is-playing', playing);
    if (!playing && !_isVideoWorkbenchBrowseMode()) _pauseWorkbenchMusic(_videoText('動画停止 / BGM停止', 'Video stopped / BGM stopped'));
    else if (playing && !_isVideoWorkbenchBrowseMode()) _syncMusicToVideo(true, true);
    if (playing && !_isVideoWorkbenchBrowseMode()) _startVideoWorkbenchMixLoop();
    else _stopVideoWorkbenchMixLoop();
    _syncGlobalPlayerVideoLock();
    _syncVideoTransportControls();
  }

  function _getActiveVideoClip(time) {
    time = Number(time) || 0;
    var edgeSlack = 0.12;
    return _videoWorkbench.clips.find(function (clip) {
      var len = Math.max(0.1, clip.musicEnd - clip.musicStart);
      return time >= clip.videoStart - edgeSlack && time <= clip.videoStart + len + edgeSlack;
    }) || null;
  }

  function _setVideoWorkbenchStatus(syncText, clipText) {
    var sync = document.getElementById('pp-vw-sync-status');
    var clip = document.getElementById('pp-vw-clip-status');
    if (sync && syncText) sync.textContent = syncText;
    if (clip && clipText) clip.textContent = clipText;
  }

  function _showVideoDecisionDialog(options) {
    options = options || {};
    return new Promise(function (resolve) {
      var old = document.querySelector('.pp-vw-decision');
      if (old) old.remove();
      var overlay = document.createElement('div');
      overlay.className = 'pp-vw-decision';
      overlay.innerHTML =
        '<div class="pp-vw-decision__panel" role="dialog" aria-modal="true">' +
          '<span class="pp-vw-decision__kicker">VIDEO WORKBENCH</span>' +
          '<strong>' + _esc(options.title || '') + '</strong>' +
          '<p>' + _esc(options.body || '') + '</p>' +
          '<div class="pp-vw-decision__actions"></div>' +
        '</div>';
      var actions = overlay.querySelector('.pp-vw-decision__actions');
      (options.buttons || []).forEach(function (btn) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = btn.primary ? 'is-primary' : '';
        b.textContent = btn.label;
        b.addEventListener('click', function () {
          overlay.remove();
          resolve(btn.value);
        });
        actions.appendChild(b);
      });
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.remove();
          resolve(options.cancelValue || 'cancel');
        }
      });
      document.body.appendChild(overlay);
      var first = overlay.querySelector('button');
      if (first) first.focus();
    });
  }

  function _confirmSwitchToResidentForTrack(trackId, action) {
    var title = trackId ? _getTrackTitleById(trackId) : _videoText('次の曲', 'the next track');
    _showVideoDecisionDialog({
      title: _videoText('動画編集中です', 'Video editing is active'),
      body: _videoText('動画を常駐モードに切り替えます。', 'Switch the video to floating mode. ') + title + _videoText(' を試聴しながら動画も確認できます。', ' can be auditioned while checking the video.'),
      cancelValue: 'no',
      buttons: [
        { label: 'Yes', value: 'yes', primary: true },
        { label: 'No', value: 'no' }
      ]
    }).then(function (choice) {
      if (choice !== 'yes') return;
      _setVideoWorkbenchDisplayMode('resident');
      _restartVideoAtQPoint(true);
      if (typeof action === 'function') action();
    });
  }

  function _openVideoEditChoiceDialog() {
    if (!_hasVideoWorkbenchVideo() || !_isVideoWorkbenchBrowseMode()) {
      _openVideoWorkbenchEditorTab();
      return;
    }
    var current = _getCurrentTrack();
    var title = current ? _getTrackTitle(current) : _videoText('現在の曲', 'current track');
    _showVideoDecisionDialog({
      title: _videoText('動画編集に戻ります', 'Return to video editing'),
      body: _videoText('作業中の配置をそのまま開くか、', 'Choose whether to reopen the current arrangement or start editing with ') + title + _videoText(' で編集を始めるか選べます。', '.'),
      cancelValue: 'continue',
      buttons: [
        { label: _videoText('作業の続きに戻る', 'Continue current edit'), value: 'continue', primary: true },
        { label: _videoText('現在の曲（', 'Start with current track (') + title + _videoText('）で編集を開始する', ')'), value: 'current' }
      ]
    }).then(function (choice) {
      _openVideoWorkbenchEditorTab();
      if (choice === 'current' && current) {
        setTimeout(function () {
          var clip = _getVideoWorkbenchClipForTrack(current) || _insertTrackRangeToVideo(current);
          if (clip) _prepareVideoWorkbenchClipForEditing(clip);
        }, 80);
      } else {
        setTimeout(function () {
          _prepareVideoWorkbenchClipForEditing(_getSelectedVideoClip() || (_videoWorkbench.clips && _videoWorkbench.clips[0]));
          _syncMusicToVideo(true, !!(_videoWorkbench.video && !_videoWorkbench.video.paused));
        }, 120);
      }
    });
  }

  function _updateVideoQPointUI() {
    var label = document.getElementById('pp-vw-qpoint-label');
    var dur = _getVideoDurationForTimeline();
    var hasQ = dur && _videoWorkbench.qPointTime >= 0;
    if (label) label.textContent = hasQ ? _formatVideoTime(_videoWorkbench.qPointTime) : _videoText('未設定', 'Not set');
    var lane = document.getElementById('pp-vw-video-lane');
    if (!lane) return;
    var marker = document.getElementById('pp-vw-qpoint-marker');
    if (!marker) {
      marker = document.createElement('i');
      marker.id = 'pp-vw-qpoint-marker';
      marker.className = 'pp-vw-qpoint-marker';
      marker.title = _videoText('Qポイント', 'Q point');
      marker.addEventListener('pointerdown', _startVideoQPointDrag);
      lane.appendChild(marker);
    }
    marker.hidden = !hasQ;
    if (hasQ) marker.style.left = Math.max(0, Math.min(100, (_videoWorkbench.qPointTime / dur) * 100)) + '%';
  }

  function _isVideoQPointActive() {
    return !!(_videoWorkbench.qPointEnabled && _videoWorkbench.qPointTime >= 0);
  }

  function _setVideoQPointAtCurrentTime(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    var v = _videoWorkbench.video;
    if (!v || !v.src) {
      if (_videoWorkbench.fileInput) _videoWorkbench.fileInput.click();
      return;
    }
    var dur = _getVideoDurationForTimeline();
    _videoWorkbench.qPointTime = Math.max(0, Math.min(dur || 0, v.currentTime || 0));
    _updateVideoQPointUI();
  }

  function _clearVideoQPoint(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    _videoWorkbench.qPointTime = -1;
    _updateVideoQPointUI();
  }

  function _toggleVideoQPointEnabled(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    _videoWorkbench.qPointEnabled = !_videoWorkbench.qPointEnabled;
    _updateVideoQPointToggle();
  }

  function _startVideoQPointDrag(e) {
    var lane = document.getElementById('pp-vw-video-lane');
    var dur = _getVideoDurationForTimeline();
    if (!lane || !dur) return;
    e.preventDefault();
    e.stopPropagation();
    _videoWorkbench.dragQPoint = {
      lane: lane.getBoundingClientRect(),
      dur: dur
    };
    _moveVideoQPoint(e);
    if (_videoWorkbench.node) _videoWorkbench.node.classList.add('is-dragging-qpoint');
    window.addEventListener('pointermove', _moveVideoQPoint);
    window.addEventListener('pointerup', _endVideoQPointDrag, { once: true });
  }

  function _moveVideoQPoint(e) {
    var d = _videoWorkbench.dragQPoint;
    if (!d) return;
    e.preventDefault();
    var ratio = Math.max(0, Math.min(1, (e.clientX - d.lane.left) / Math.max(1, d.lane.width)));
    _videoWorkbench.qPointTime = ratio * d.dur;
    _updateVideoQPointUI();
  }

  function _endVideoQPointDrag() {
    _videoWorkbench.dragQPoint = null;
    if (_videoWorkbench.node) _videoWorkbench.node.classList.remove('is-dragging-qpoint');
    window.removeEventListener('pointermove', _moveVideoQPoint);
  }

  function _ensureVideoQPointMenus(dock) {
    if (!dock) return;
    dock.querySelectorAll('#pp-vw-lane-qpoint-set').forEach(function (node) { node.remove(); });
    dock.querySelectorAll('#pp-vw-qpoint-toggle, #pp-vw-lane-qpoint-toggle').forEach(function (btn) {
      if (btn.closest('.pp-vw-qmenu')) return;
      var wrap = document.createElement('span');
      wrap.className = 'pp-vw-qmenu';
      btn.parentNode.insertBefore(wrap, btn);
      wrap.appendChild(btn);
      wrap.insertAdjacentHTML('beforeend',
        '<span class="pp-vw-qmenu__panel" role="tooltip">' +
          '<strong>' + _videoText('Qポイント', 'Q point') + '</strong>' +
          '<span>' + _videoText('Qは「この場面から曲を当てたい」位置です。編集では楽曲の入り、常駐では試聴を始める場面になります。', 'Q marks the scene where you want music to start. In edit view it sets the music entry point; in floating mode it becomes the video scene used for auditioning.') + '</span>' +
          '<span class="pp-vw-qmenu__actions">' +
            '<button type="button" data-vw-q-action="set">' + _videoText('現在位置に設定', 'Set current') + '</button>' +
            '<button type="button" data-vw-q-action="clear">' + _videoText('解除', 'Clear') + '</button>' +
          '</span>' +
        '</span>');
    });
    dock.querySelectorAll('[data-vw-q-action]').forEach(function (btn) {
      if (btn._vwQActionBound) return;
      btn._vwQActionBound = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (btn.dataset.vwQAction === 'set') _setVideoQPointAtCurrentTime();
        if (btn.dataset.vwQAction === 'clear') _clearVideoQPoint();
      });
    });
  }

  function _updateVideoQPointToggle() {
    document.querySelectorAll('#pp-vw-qpoint-toggle, #pp-vw-lane-qpoint-toggle').forEach(function (btn) {
      btn.textContent = _videoWorkbench.qPointEnabled ? 'Q ON' : 'Q OFF';
      btn.classList.toggle('is-active', !!_videoWorkbench.qPointEnabled);
      btn.setAttribute('aria-pressed', String(!!_videoWorkbench.qPointEnabled));
    });
  }

  function _updateVideoGoalUI() {
    var label = document.getElementById('pp-vw-goal-label');
    var align = document.getElementById('pp-vw-goal-align');
    var dur = _getVideoDurationForTimeline();
    var hasGoal = dur && _videoWorkbench.goalTime >= 0;
    if (label) label.textContent = hasGoal ? _formatVideoTime(_videoWorkbench.goalTime) : _videoText('未設定', 'Not set');
    if (align) align.disabled = !hasGoal || !_getSelectedVideoClip();
    var lane = document.getElementById('pp-vw-video-lane');
    if (!lane) return;
    var marker = document.getElementById('pp-vw-goal-marker');
    if (!marker) {
      marker = document.createElement('i');
      marker.id = 'pp-vw-goal-marker';
      marker.className = 'pp-vw-goal-marker';
      marker.title = _videoText('合わせ位置', 'Sync point');
      lane.appendChild(marker);
    }
    marker.hidden = !hasGoal;
    if (hasGoal) marker.style.left = Math.max(0, Math.min(100, (_videoWorkbench.goalTime / dur) * 100)) + '%';
  }

  function _setVideoGoalAtCurrentTime() {
    var v = _videoWorkbench.video;
    if (!v || !v.src) {
      if (_videoWorkbench.fileInput) _videoWorkbench.fileInput.click();
      return;
    }
    var dur = _getVideoDurationForTimeline();
    _videoWorkbench.goalTime = Math.max(0, Math.min(dur || 0, v.currentTime || 0));
    _updateVideoGoalUI();
    _setVideoWorkbenchStatus(_videoText('合わせ位置を設定', 'Sync point set'), null);
  }

  function _alignSelectedClipToVideoGoal() {
    var clip = _getSelectedVideoClip() || (_videoWorkbench.clips && _videoWorkbench.clips[0]);
    var dur = _getVideoDurationForTimeline();
    if (!clip || !dur || _videoWorkbench.goalTime < 0) return;
    var length = Math.max(0.5, clip.musicEnd - clip.musicStart);
    clip.videoStart = Math.max(0, Math.min(Math.max(0, dur - Math.min(length, dur)), _videoWorkbench.goalTime));
    _videoWorkbench.selectedClipId = clip.id;
    _syncWaveRangeToClip(clip);
    _renderVideoWorkbenchTimeline();
    _updateVideoGoalUI();
    if (_videoWorkbench.video && !_videoWorkbench.video.paused) _syncMusicToVideo(true, true);
    _setVideoWorkbenchStatus(_videoText('合わせ位置へ移動', 'Moved to sync point'), clip.title || 'BGM');
  }

  function _pauseWorkbenchMusic(reason) {
    if (_isVideoWorkbenchBrowseMode()) {
      _setVideoWorkbenchStatus(reason || _videoText('BGM停止', 'BGM stopped'), null);
      return;
    }
    if (!window.HMIX_PLAYER) {
      _setVideoWorkbenchStatus(reason || _videoText('BGM停止', 'BGM stopped'), null);
      return;
    }
    if (typeof window.HMIX_PLAYER.pause === 'function') {
      try { window.HMIX_PLAYER.pause(); } catch (e) {}
    }
    var a = _getPlayerAudio();
    if (a && !a.paused) a.pause();
    var volEl = document.getElementById('player-volume');
    if (a && volEl) {
      a.volume = parseInt(volEl.value, 10) / 100;
      _videoWorkbench.musicVolumeCurrent = -1;
    }
    _setVideoWorkbenchStatus(reason || _videoText('BGM停止', 'BGM stopped'), null);
  }

  function _seekWaveformManually(sec, shouldPlay) {
    var nowMs = (window.performance && performance.now) ? performance.now() : Date.now();
    _videoWorkbench.manualAudioUntil = nowMs + 1800;
    if (_videoWorkbench.video && _videoWorkbench.video.src && !_videoWorkbench.video.paused &&
        !_isVideoWorkbenchBrowseMode()) {
      try { _videoWorkbench.video.pause(); } catch (e) {}
      _setVideoWorkbenchStatus(_videoText('波形操作 / 動画停止', 'Waveform control / video stopped'), null);
    }
    var player = window.HMIX_PLAYER;
    if (!player) return;
    var audioEl = player.getAudio && player.getAudio();
    var volEl = document.getElementById('player-volume');
    if (audioEl && volEl) audioEl.volume = parseInt(volEl.value, 10) / 100;
    if (player.seek) player.seek(sec);
    else if (audioEl) audioEl.currentTime = sec;
    if (shouldPlay && audioEl && audioEl.paused) audioEl.play().catch(function () {});
  }

  function _syncMusicToVideo(force, shouldPlay) {
    if (_isVideoWorkbenchBrowseMode()) return;
    if (_videoWorkbench.syncingMusic || !window.HMIX_PLAYER || !window.HMIX_PLAYER.getState) return;
    if (shouldPlay) _suspendWaveformRangePlaybackForVideo();
    var v = _videoWorkbench.video;
    if (!v || !v.src) return;
    var nowMs = (window.performance && performance.now) ? performance.now() : Date.now();
    if (_videoWorkbench.manualAudioUntil && nowMs < _videoWorkbench.manualAudioUntil) return;
    if (_videoWorkbench.manualAudioUntil && nowMs >= _videoWorkbench.manualAudioUntil) _videoWorkbench.manualAudioUntil = 0;
    if (!force && _videoWorkbench.lastSyncAt && nowMs - _videoWorkbench.lastSyncAt < 220) return;
    _videoWorkbench.lastSyncAt = nowMs;
    var clip = _getActiveVideoClip(v.currentTime || 0);
    if (!clip) {
      if (shouldPlay && _videoWorkbench.clips && _videoWorkbench.clips.length) _pauseWorkbenchMusic(_videoText('範囲外 / BGM停止', 'Outside range / BGM stopped'));
      _updateVideoAudioMix();
      return;
    }
    var currentVideoTime = v.currentTime || 0;
    var clipLen = Math.max(0.1, clip.musicEnd - clip.musicStart);
    var clipOffset = Math.max(0, Math.min(clipLen, currentVideoTime - clip.videoStart));
    var targetMusicTime = clip.musicStart + clipOffset;
    var state = window.HMIX_PLAYER.getState();
    var current = state && state.queue && state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;
    var audio = _getPlayerAudio();
    var syncNow = function () {
      try {
        var freshState = window.HMIX_PLAYER.getState ? window.HMIX_PLAYER.getState() : state;
        var freshTrack = freshState && freshState.queue && freshState.currentIndex >= 0 ? freshState.queue[freshState.currentIndex] : null;
        if (!freshTrack || String(freshTrack.id) !== String(clip.trackId)) {
          _videoWorkbench.syncingMusic = false;
          _updateVideoAudioMix();
          return;
        }
        _videoWorkbench.loadingTrackId = '';
        audio = _getPlayerAudio() || audio;
        var currentAudioTime = audio ? (audio.currentTime || 0) : 0;
        if (force || !audio || Math.abs(currentAudioTime - targetMusicTime) > 0.55) {
          if (window.HMIX_PLAYER.seek) window.HMIX_PLAYER.seek(targetMusicTime);
          else if (audio) audio.currentTime = targetMusicTime;
        }
        var wantsPlay = shouldPlay && _videoWorkbench.video && !_videoWorkbench.video.paused;
        _applyVideoWorkbenchMix(force);
        _updateVideoWorkbenchMusicVolume();
        if (wantsPlay && audio && audio.paused) audio.play().catch(function () {});
        if (!wantsPlay && audio && !audio.paused) audio.pause();
        _setVideoWorkbenchStatus(wantsPlay ? _videoText('動画に同期中', 'Synced to video') : _videoText('動画位置に待機', 'Waiting at video position'), clip.title || 'BGM');
      } catch (e) {}
      _videoWorkbench.syncingMusic = false;
      _updateVideoAudioMix();
    };
    _videoWorkbench.syncingMusic = true;
    if (!current || String(current.id) !== String(clip.trackId)) {
      if (!shouldPlay) {
        _setVideoWorkbenchStatus(_videoText('再生待機 / BGM未開始', 'Ready / BGM not started'), clip.title || 'BGM');
        _videoWorkbench.syncingMusic = false;
        _updateVideoAudioMix();
        return;
      }
      if (String(_videoWorkbench.loadingTrackId) === String(clip.trackId)) {
        _videoWorkbench.syncingMusic = false;
        _updateVideoAudioMix();
        return;
      }
      _videoWorkbench.loadingTrackId = String(clip.trackId);
      window.HMIX_PLAYER.playTrackById(clip.trackId);
      setTimeout(syncNow, 320);
      return;
    }
    _videoWorkbench.loadingTrackId = '';
    if (force || !audio || Math.abs((audio.currentTime || 0) - targetMusicTime) > 0.55) {
      syncNow();
    } else {
      var wantsPlay = shouldPlay && _videoWorkbench.video && !_videoWorkbench.video.paused;
      _applyVideoWorkbenchMix(false);
      _updateVideoWorkbenchMusicVolume();
      if (wantsPlay && audio && audio.paused) audio.play().catch(function () {});
      if (!wantsPlay && audio && !audio.paused) audio.pause();
      _setVideoWorkbenchStatus(wantsPlay ? _videoText('動画に同期中', 'Synced to video') : _videoText('動画位置に待機', 'Waiting at video position'), clip.title || 'BGM');
      _videoWorkbench.syncingMusic = false;
      _updateVideoAudioMix();
    }
  }

  function _suspendWaveformRangePlaybackForVideo() {
    if (_rangeCheckInterval) {
      clearInterval(_rangeCheckInterval);
      _rangeCheckInterval = null;
    }
    var audio = _getPlayerAudio();
    var volEl = document.getElementById('player-volume');
    if (audio && volEl && !_isVideoWorkbenchBrowseMode()) {
      audio.volume = parseInt(volEl.value, 10) / 100;
      _videoWorkbench.musicVolumeCurrent = -1;
    }
  }

  function _updateVideoAudioMix(force) {
    _applyVideoWorkbenchMix(!!(force && force.type ? true : force));
  }

  function _getVideoDurationForTimeline() {
    var v = _videoWorkbench.video;
    var dur = _finitePositiveSec(v && v.duration);
    if (dur) return dur;
    return _finitePositiveSec(_videoWorkbench.duration);
  }

  function _getCurrentRangeForVideoInsert() {
    var track = _getCurrentTrack();
    return _getInsertionRangeForTrack(track);
  }

  function _insertCurrentRangeToVideo() {
    var v = _videoWorkbench.video;
    if (!v || !v.src) {
      if (_videoWorkbench.fileInput) _videoWorkbench.fileInput.click();
      return;
    }
    var dur = _getVideoDurationForTimeline();
    if (!dur) return;
    var range = _getCurrentRangeForVideoInsert();
    if (!range.track || !range.end || range.end <= range.start) {
      _showPanelToast(_videoText('先に楽曲を再生するか、波形で範囲を選んでください。', 'Play a track first, or select a range in the waveform.'));
      return;
    }
    var clipDur = range.end - range.start;
    clipDur = Math.max(0.5, Math.min(clipDur, dur));
    var videoStart = _getVideoInsertStart(dur, clipDur);
    clipDur = Math.min(clipDur, Math.max(0.5, dur - videoStart));
    var newClip = {
      id: 'clip-' + Date.now(),
      trackId: range.track.id || '',
      title: _getTrackTitle(range.track),
      videoStart: videoStart,
      musicStart: range.start,
      musicEnd: range.start + clipDur,
      fadeIn: Math.max(0, _fadeInSec || 0),
      fadeOut: Math.max(0, _fadeOutSec || 0),
      muteVideo: !!(document.getElementById('pp-vw-mute-video') && document.getElementById('pp-vw-mute-video').checked),
      tone: (_videoWorkbench.nextTone++ % 6) + 1
    };
    _videoWorkbench.clips = [newClip];
    _videoWorkbench.selectedClipId = newClip.id;
    _syncWaveRangeToClip(newClip);
    _renderVideoWorkbenchTimeline();
    _syncMusicToVideo(true, !_videoWorkbench.video.paused);
    _showPanelToast(_videoText('動画タイムラインに配置しました。', 'Placed on the video timeline.'));
  }

  function _insertTrackRangeToVideo(track) {
    var v = _videoWorkbench.video;
    if (!v || !v.src) {
      if (_videoWorkbench.fileInput) _videoWorkbench.fileInput.click();
      return null;
    }
    var dur = _getVideoDurationForTimeline();
    if (!dur || !track) return null;
    var range = _getInsertionRangeForTrack(track);
    if (!range.end || range.end <= range.start) {
      _showPanelToast(_videoText('この曲の長さを取得できませんでした。', 'Could not read the length of this track.'));
      return null;
    }
    var clipDur = range.end - range.start;
    clipDur = Math.max(0.5, Math.min(clipDur, dur));
    var videoStart = _getVideoInsertStart(dur, clipDur);
    clipDur = Math.min(clipDur, Math.max(0.5, dur - videoStart));
    var newClip = {
      id: 'clip-' + Date.now() + '-' + Math.floor(Math.random() * 999),
      trackId: track.id || '',
      title: _getTrackTitle(track),
      videoStart: videoStart,
      musicStart: range.start,
      musicEnd: range.start + clipDur,
      fadeIn: Math.max(0, _fadeInSec || 0),
      fadeOut: Math.max(0, _fadeOutSec || 0),
      muteVideo: !!(document.getElementById('pp-vw-mute-video') && document.getElementById('pp-vw-mute-video').checked),
      tone: (_videoWorkbench.nextTone++ % 6) + 1
    };
    _videoWorkbench.clips = [newClip];
    _videoWorkbench.selectedClipId = newClip.id;
    _syncWaveRangeToClip(newClip);
    _renderVideoWorkbenchTimeline();
    _syncMusicToVideo(true, !_videoWorkbench.video.paused);
    _showPanelToast(_videoText('動画タイムラインに配置しました。', 'Placed on the video timeline.'));
    return newClip;
  }

  function _getSelectedVideoClip() {
    if (!_videoWorkbench.selectedClipId) return null;
    return _videoWorkbench.clips.find(function (c) { return c.id === _videoWorkbench.selectedClipId; }) || null;
  }

  function _deleteSelectedVideoClip() {
    var clip = _getSelectedVideoClip();
    if (!clip) return;
    _videoWorkbench.clips = _videoWorkbench.clips.filter(function (c) { return c.id !== clip.id; });
    _videoWorkbench.selectedClipId = '';
    _pauseWorkbenchMusic(_videoText('クリップ削除 / BGM停止', 'Clip deleted / BGM stopped'));
    _updateVideoAudioMix();
    _renderVideoWorkbenchTimeline();
    _showPanelToast('選択した配置を削除しました。');
  }

  function _updateSelectedVideoClipFromCurrentRange() {
    var clip = _getSelectedVideoClip();
    if (!clip) {
      _showPanelToast(_videoText('先に動画タイムラインの配置を選択してください。', 'Select a placement on the video timeline first.'));
      return;
    }
    var range = _getCurrentRangeForVideoInsert();
    if (!range.track || !range.end || range.end <= range.start) {
      _showPanelToast(_videoText('先に楽曲を再生するか、波形で範囲を選んでください。', 'Play a track first, or select a range in the waveform.'));
      return;
    }
    clip.trackId = range.track.id || clip.trackId;
    clip.title = _getTrackTitle(range.track);
    clip.musicStart = range.start;
    clip.musicEnd = range.end;
    clip.fadeIn = Math.max(0, _fadeInSec || 0);
    clip.fadeOut = Math.max(0, _fadeOutSec || 0);
    clip.muteVideo = !!(document.getElementById('pp-vw-mute-video') && document.getElementById('pp-vw-mute-video').checked);
    _syncWaveRangeToClip(clip);
    _renderVideoWorkbenchTimeline();
    _syncMusicToVideo(true, !_videoWorkbench.video.paused);
    _showPanelToast(_videoText('選択中の配置を現在の波形範囲で更新しました。', 'Updated the selected placement from the current waveform range.'));
  }

  function _syncSelectedVideoClipFromWaveform() {
    var clip = _getSelectedVideoClip();
    if (!clip || !_rangeActive || _rangeStart < 0 || _rangeEnd <= _rangeStart) return false;
    var current = _getCurrentTrack();
    if (current && (!clip.trackId || String(current.id) === String(clip.trackId))) {
      clip.trackId = current.id || clip.trackId;
      clip.title = _getTrackTitle(current);
    }
    clip.musicStart = Math.max(0, _rangeStart);
    clip.musicEnd = Math.max(clip.musicStart + 0.5, _rangeEnd);
    var length = Math.max(0.5, clip.musicEnd - clip.musicStart);
    clip.fadeIn = Math.min(Math.max(0, _fadeInSec || 0), length / 2);
    clip.fadeOut = Math.min(Math.max(0, _fadeOutSec || 0), length / 2);
    clip.muteVideo = !!(document.getElementById('pp-vw-mute-video') && document.getElementById('pp-vw-mute-video').checked);
    _renderVideoWorkbenchTimeline();
    if (_videoWorkbench.video && !_videoWorkbench.video.paused) _syncMusicToVideo(true, true);
    return true;
  }

  function _copyVideoWorkbenchMemo() {
    var lines = [];
    lines.push(_videoText('H/MIX GALLERY 動画BGMメモ', 'H/MIX GALLERY Video BGM Memo'));
    lines.push(_videoText('動画: ', 'Video: ') + (_videoWorkbench.fileName || _videoText('未選択', 'Not selected')));
    if (_videoWorkbench.duration) lines.push(_videoText('動画尺: ', 'Video length: ') + _formatVideoTime(_videoWorkbench.duration));
    if (!_videoWorkbench.clips.length) {
      lines.push(_videoText('配置: 未配置', 'Placement: none'));
    } else {
      _videoWorkbench.clips
        .slice()
        .sort(function (a, b) { return a.videoStart - b.videoStart; })
        .forEach(function (clip, i) {
          var len = Math.max(0.1, clip.musicEnd - clip.musicStart);
          lines.push('');
          lines.push((i + 1) + '. ' + (clip.title || clip.trackId || 'BGM'));
          lines.push(_videoText('動画位置: ', 'Video position: ') + _formatVideoTime(clip.videoStart) + ' - ' + _formatVideoTime(clip.videoStart + len));
          lines.push(_videoText('楽曲範囲: ', 'Music range: ') + _formatVideoTime(clip.musicStart) + ' - ' + _formatVideoTime(clip.musicEnd));
          lines.push(_videoText('フェード: IN ', 'Fade: IN ') + (clip.fadeIn || 0).toFixed(1) + 's / OUT ' + (clip.fadeOut || 0).toFixed(1) + 's');
          lines.push(_videoText('動画音声: ', 'Video audio: ') + (clip.muteVideo ? _videoText('BGM区間でミュート/クロスフェード', 'muted/crossfaded during BGM') : _videoText('そのまま', 'unchanged')));
        });
    }
    _copyText(lines.join('\n')).then(function () {
      _showPanelToast(_videoText('動画BGMメモをコピーしました。', 'Copied the video BGM memo.'));
    }).catch(function () {
      _showPanelToast(_videoText('コピーに失敗しました。', 'Copy failed.'));
    });
  }

  function _formatVideoWorkbenchMemoText() {
    var lines = [];
    lines.push(_videoText('【動画BGM配置メモ】', '[Video BGM Placement Memo]'));
    lines.push(_videoText('動画: ', 'Video: ') + (_videoWorkbench.fileName || _videoText('未選択', 'Not selected')));
    if (_videoWorkbench.duration) lines.push(_videoText('動画尺: ', 'Video length: ') + _formatVideoTime(_videoWorkbench.duration));
    if (!_videoWorkbench.clips.length) {
      lines.push(_videoText('配置: 未配置', 'Placement: none'));
      return lines.join('\n');
    }
    _videoWorkbench.clips
      .slice()
      .sort(function (a, b) { return a.videoStart - b.videoStart; })
      .forEach(function (clip, i) {
        var len = Math.max(0.1, clip.musicEnd - clip.musicStart);
        lines.push('');
        lines.push((i + 1) + '. ' + (clip.title || clip.trackId || 'BGM'));
        lines.push(_videoText('動画: ', 'Video: ') + _formatVideoTime(clip.videoStart) + _videoText(' から ', ' for ') + _formatVideoTime(len));
        lines.push(_videoText('曲: ', 'Music: ') + _formatVideoTime(clip.musicStart) + ' - ' + _formatVideoTime(clip.musicEnd));
        lines.push(_videoText('フェード: IN ', 'Fade: IN ') + (clip.fadeIn || 0).toFixed(1) + 's / OUT ' + (clip.fadeOut || 0).toFixed(1) + 's');
        lines.push(_videoText('動画音声: ', 'Video audio: ') + (clip.muteVideo ? _videoText('BGM区間でミュート', 'muted during BGM') : _videoText('そのまま', 'unchanged')));
      });
    return lines.join('\n');
  }

  function _insertVideoWorkbenchMemoToNotepad() {
    var textEl = document.getElementById('memo-text');
    if (!textEl) {
      _copyText(_formatVideoWorkbenchMemoText()).then(function () {
        _showPanelToast(_videoText('メモ帳が見つからないため、動画BGMメモをコピーしました。', 'Memo was not available, so the video BGM memo was copied.'));
      });
      return;
    }
    var block = _formatVideoWorkbenchMemoText();
    var prefix = textEl.value && !/\n$/.test(textEl.value) ? '\n\n' : '';
    textEl.value += prefix + block + '\n';
    textEl.dispatchEvent(new Event('input', { bubbles: true }));
    _showPanelToast(_videoText('動画BGMメモをメモ帳へ反映しました。', 'Sent the video BGM memo to the memo pad.'));
  }

  function _openVideoFavoritePicker() {
    if ((!window.TRACKS || !window.TRACKS.length) && typeof window.loadTracks === 'function') {
      window.loadTracks().then(_openVideoFavoritePicker).catch(function () {
        _showPanelToast(_videoText('楽曲データを読み込めませんでした。', 'Could not load track data.'));
      });
      return;
    }
    var existing = document.getElementById('pp-vw-fav-picker');
    if (existing) { existing.remove(); return; }
    var tracks = _getFavoriteTracksForVideo();
    var picker = document.createElement('div');
    picker.id = 'pp-vw-fav-picker';
    picker.className = 'pp-vw-fav-picker';
    var html = '<div class="pp-vw-fav-picker__head"><strong>' + _videoText('お気に入りから挿入', 'Insert from favorites') + '</strong><button type="button" id="pp-vw-fav-close">×</button></div>';
    if (!tracks.length) {
      html += '<p class="pp-vw-fav-empty">' + _videoText('お気に入り楽曲がありません。', 'No favorite tracks yet.') + '</p>';
    } else {
      html += '<div class="pp-vw-fav-list">';
      tracks.forEach(function (track) {
        html += '<button type="button" class="pp-vw-fav-item" data-track-id="' + _esc(track.id) + '"><strong>' + _esc(_getTrackTitle(track)) + '</strong><span>' + _formatVideoTime(_getTrackDuration(track)) + '</span></button>';
      });
      html += '</div>';
    }
    picker.innerHTML = html;
    (_videoWorkbench.node || document.body).appendChild(picker);
    picker.querySelector('#pp-vw-fav-close').addEventListener('click', function () { picker.remove(); });
    picker.querySelectorAll('.pp-vw-fav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var track = _getTrackById(this.dataset.trackId);
        if (track) _insertTrackRangeToVideo(track);
        picker.remove();
      });
    });
  }

  function _renderVideoWorkbenchClipEditor() {
    var editor = document.getElementById('pp-vw-editor');
    if (!editor) return;
    var clip = _getSelectedVideoClip();
    editor.hidden = !clip;
    if (!clip) return;
    var len = Math.max(0.5, clip.musicEnd - clip.musicStart);
    var title = document.getElementById('pp-vw-editor-title');
    if (title) title.textContent = clip.title || 'BGM';
    var fields = {
      'video-start': clip.videoStart,
      'music-start': clip.musicStart,
      'length': len,
      'fade-in': clip.fadeIn || 0,
      'fade-out': clip.fadeOut || 0
    };
    Object.keys(fields).forEach(function (name) {
      var input = document.getElementById('pp-vw-edit-' + name);
      if (input && document.activeElement !== input) input.value = (Math.round(fields[name] * 10) / 10).toFixed(1);
    });
    var muteCtl = document.getElementById('pp-vw-mute-video');
    if (muteCtl) muteCtl.checked = !!clip.muteVideo;
  }

  function _updateSelectedVideoClipFromEditor() {
    var clip = _getSelectedVideoClip();
    if (!clip) return;
    var dur = _getVideoDurationForTimeline();
    var videoStart = _readNumberInput('pp-vw-edit-video-start', 0);
    var musicStart = _readNumberInput('pp-vw-edit-music-start', 0);
    var length = Math.max(0.5, _readNumberInput('pp-vw-edit-length', 0.5));
    var fadeIn = Math.max(0, _readNumberInput('pp-vw-edit-fade-in', 0));
    var fadeOut = Math.max(0, _readNumberInput('pp-vw-edit-fade-out', 0));
    clip.videoStart = Math.max(0, Math.min(videoStart, Math.max(0, dur - Math.min(length, dur || length))));
    clip.musicStart = Math.max(0, musicStart);
    clip.musicEnd = clip.musicStart + length;
    clip.fadeIn = Math.min(fadeIn, length / 2);
    clip.fadeOut = Math.min(fadeOut, length / 2);
    _fadeInSec = clip.fadeIn;
    _fadeOutSec = clip.fadeOut;
    _syncWaveRangeToClip(clip);
    _renderVideoWorkbenchTimeline();
    if (_videoWorkbench.video && !_videoWorkbench.video.paused) _syncMusicToVideo(true, true);
  }

  function _renderVideoWorkbenchTimeline() {
    var lane = document.getElementById('pp-vw-music-lane');
    var label = document.getElementById('pp-vw-music-label');
    if (!lane || !label) return;
    var dur = _getVideoDurationForTimeline();
    _updateVideoQPointUI();
    _updateVideoGoalUI();
    _renderVideoTimelineThumbs();
    lane.querySelectorAll('.pp-vw-clip').forEach(function (el) { el.remove(); });
    var musicHead = document.getElementById('pp-vw-music-head');
    if (!musicHead) {
      musicHead = document.createElement('i');
      musicHead.id = 'pp-vw-music-head';
      musicHead.className = 'pp-vw-playhead pp-vw-playhead--music';
      musicHead.hidden = true;
      lane.appendChild(musicHead);
    }
    if (!dur || !_videoWorkbench.clips.length) {
      label.textContent = _videoText('未配置', 'Not placed');
      _setVideoWorkbenchStatus(null, _videoText('未配置', 'Not placed'));
      _updateVideoWorkbenchClipButtons();
      _renderVideoWorkbenchClipEditor();
      return;
    }
    label.textContent = '';
    _setVideoWorkbenchStatus(null, _getSelectedVideoClip() ? _videoText('選択中: ', 'Selected: ') + (_getSelectedVideoClip().title || 'BGM') : _videoText('配置あり', 'Placed'));
    _videoWorkbench.clips.forEach(function (clip, index) {
      var length = Math.max(0.25, clip.musicEnd - clip.musicStart);
      var left = Math.max(0, Math.min(100, (clip.videoStart / dur) * 100));
      var width = Math.max(5, Math.min(100 - left, (length / dur) * 100));
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'pp-vw-clip pp-vw-clip--tone-' + (clip.tone || ((index % 6) + 1)) + (clip.muteVideo ? ' pp-vw-clip--mute' : '') + (clip.id === _videoWorkbench.selectedClipId ? ' is-selected' : '');
      el.dataset.clipId = clip.id;
      el.style.left = left + '%';
      el.style.width = width + '%';
      el.style.setProperty('--fade-in-pos', Math.min(44, (clip.fadeIn / Math.max(0.1, length)) * 100) + '%');
      el.style.setProperty('--fade-out-pos', Math.min(44, (clip.fadeOut / Math.max(0.1, length)) * 100) + '%');
      var fadeInTip = _videoText('フェードイン: ', 'Fade in: ') + (Number(clip.fadeIn || 0).toFixed(1).replace(/\.0$/, '')) + 's';
      var fadeOutTip = _videoText('フェードアウト: ', 'Fade out: ') + (Number(clip.fadeOut || 0).toFixed(1).replace(/\.0$/, '')) + 's';
      el.innerHTML =
        '<span class="pp-vw-clip-order">' + (index + 1) + '</span>' +
        '<span class="pp-vw-clip-remove" data-remove="1" aria-label="' + _videoText('この楽曲配置を削除', 'Remove this music placement') + '">×</span>' +
        '<i class="pp-vw-clip-handle pp-vw-clip-handle--start" data-handle="start"></i>' +
        '<i class="pp-vw-clip-handle pp-vw-clip-handle--end" data-handle="end"></i>' +
        '<i class="pp-vw-clip-fade-handle pp-vw-clip-fade-handle--in" data-handle="fadein" title="' + _esc(fadeInTip) + '" data-tip="' + _esc(fadeInTip) + '"></i>' +
        '<i class="pp-vw-clip-fade-handle pp-vw-clip-fade-handle--out" data-handle="fadeout" title="' + _esc(fadeOutTip) + '" data-tip="' + _esc(fadeOutTip) + '"></i>' +
        '<span class="pp-vw-clip-title">' + _esc(clip.title || 'BGM') + '</span>' +
        '<span class="pp-vw-clip-meta">' + _formatVideoTime(clip.videoStart) + ' / ' + _formatVideoTime(length) + (clip.muteVideo ? _videoText(' / 動画音声ミュート', ' / video audio muted') : '') + '</span>' +
        '<span class="pp-vw-clip-wavehint" data-waveform-link="1">' + _videoText('波形プレビューでも編集できます', 'Edit this in the waveform preview too') + '</span>' +
        '<i class="pp-vw-clip-fade pp-vw-clip-fade--in" style="width:' + Math.min(45, (clip.fadeIn / Math.max(0.1, length)) * 100) + '%"></i>' +
        '<i class="pp-vw-clip-fade pp-vw-clip-fade--out" style="width:' + Math.min(45, (clip.fadeOut / Math.max(0.1, length)) * 100) + '%"></i>';
      lane.appendChild(el);
    });
    _updateVideoWorkbenchClipButtons();
    _renderVideoWorkbenchClipEditor();
  }

  function _updateVideoWorkbenchClipButtons() {
    var hasSelected = !!_getSelectedVideoClip();
    var del = document.getElementById('pp-vw-delete-clip');
    var upd = document.getElementById('pp-vw-update-clip');
    if (del) del.disabled = !hasSelected;
    if (upd) upd.disabled = !hasSelected;
  }

  function _syncWaveRangeToClip(clip) {
    if (!clip) return;
    var track = clip.trackId ? _getTrackById(clip.trackId) : _getCurrentTrack();
    var trackDur = _getWaveformTimelineDuration(track);
    var rawStart = _finitePositiveSec(clip.musicStart);
    var rawEnd = _finitePositiveSec(clip.musicEnd);
    if (!rawEnd || rawEnd <= rawStart) rawEnd = rawStart + 0.5;
    var minLen = trackDur > 0 ? Math.min(0.5, Math.max(0.05, trackDur)) : 0.5;
    if (trackDur > 0) {
      rawStart = Math.max(0, Math.min(rawStart, Math.max(0, trackDur - minLen)));
      rawEnd = Math.max(rawStart + minLen, Math.min(rawEnd, trackDur));
    }
    _rangeStart = Math.max(0, rawStart);
    _rangeEnd = Math.max(_rangeStart + minLen, rawEnd);
    _rangeActive = true;
    _rangeTrackId = clip.trackId ? String(clip.trackId) : _rangeTrackId;
    _fadeInSec = Math.max(0, clip.fadeIn || 0);
    _fadeOutSec = Math.max(0, clip.fadeOut || 0);
    _rememberRangeForTrackId(_rangeTrackId);
    if (typeof _updateRangeUI === 'function') _updateRangeUI();
    if (typeof _updateRangeStatus === 'function') _updateRangeStatus();
    if (typeof _updateExportPreflight === 'function') _updateExportPreflight();
    if (typeof _drawWaveform === 'function') _drawWaveform();
  }

  function _startVideoWorkbenchDrag(e) {
    if (!_videoWorkbench.node || !_canMoveVideoWorkbench()) return;
    e.preventDefault();
    var rect = _videoWorkbench.node.getBoundingClientRect();
    _videoWorkbench.drag = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
    _videoWorkbench.node.classList.add('is-moving');
    window.addEventListener('pointermove', _moveVideoWorkbench);
    window.addEventListener('pointerup', _endVideoWorkbenchDrag, { once: true });
  }

  function _maybeStartVideoWorkbenchDrag(e) {
    if (!_videoWorkbench.node || !_canMoveVideoWorkbench() || (e.button && e.button !== 0)) return;
    if (e.target.closest('button, a, input, select, textarea, video, .pp-vw-lane-track, .pp-vw-resize-handle, .pp-vw-clip')) return;
    _startVideoWorkbenchDrag(e);
  }

  function _moveVideoWorkbench(e) {
    var d = _videoWorkbench.drag;
    if (!d || !_videoWorkbench.node) return;
    var nextLeft = Math.max(8, Math.min(window.innerWidth - _videoWorkbench.node.offsetWidth - 8, d.left + e.clientX - d.x));
    var nextTop = Math.max(8, Math.min(window.innerHeight - _videoWorkbench.node.offsetHeight - 96, d.top + e.clientY - d.y));
    _videoWorkbench.node.style.left = nextLeft + 'px';
    _videoWorkbench.node.style.top = nextTop + 'px';
    _videoWorkbench.node.style.right = 'auto';
    _videoWorkbench.node.style.bottom = 'auto';
    _videoWorkbench.node.style.transform = 'none';
  }

  function _endVideoWorkbenchDrag() {
    if (_videoWorkbench.node) _videoWorkbench.node.classList.remove('is-moving');
    _videoWorkbench.drag = null;
    window.removeEventListener('pointermove', _moveVideoWorkbench);
  }

  function _startVideoWorkbenchResize(e) {
    if (!_videoWorkbench.node || !_canMoveVideoWorkbench()) return;
    e.preventDefault();
    e.stopPropagation();
    var rect = _videoWorkbench.node.getBoundingClientRect();
    _videoWorkbench.resize = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height, left: rect.left, top: rect.top, edge: e.currentTarget.getAttribute('data-vw-resize') || 'se' };
    _videoWorkbench.node.classList.add('is-resizing');
    window.addEventListener('pointermove', _resizeVideoWorkbench);
    window.addEventListener('pointerup', _endVideoWorkbenchResize, { once: true });
  }

  function _resizeVideoWorkbench(e) {
    var r = _videoWorkbench.resize;
    if (!r || !_videoWorkbench.node) return;
    var dx = e.clientX - r.x;
    var dy = e.clientY - r.y;
    var west = r.edge.indexOf('w') !== -1;
    var north = r.edge.indexOf('n') !== -1;
    var rawW = west ? r.w - dx : r.w + dx;
    var rawH = north ? r.h - dy : r.h + dy;
    var w = Math.max(300, Math.min(window.innerWidth - 24, rawW));
    var h = Math.max(120, Math.min(window.innerHeight - 80, rawH));
    if (west) _videoWorkbench.node.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + (r.w - w))) + 'px';
    if (north) _videoWorkbench.node.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, r.top + (r.h - h))) + 'px';
    _videoWorkbench.node.style.width = w + 'px';
    _videoWorkbench.node.style.height = h + 'px';
    _videoWorkbench.node.style.right = 'auto';
    _videoWorkbench.node.style.bottom = 'auto';
    _videoWorkbench.node.style.transform = 'none';
  }

  function _endVideoWorkbenchResize() {
    if (_videoWorkbench.node) _videoWorkbench.node.classList.remove('is-resizing');
    _videoWorkbench.resize = null;
    window.removeEventListener('pointermove', _resizeVideoWorkbench);
  }

  function _startVideoClipDrag(e) {
    var clipEl = e.target.closest('.pp-vw-clip');
    if (!clipEl) {
      _seekVideoWorkbenchFromLane(e);
      return;
    }
    var clip = _videoWorkbench.clips.find(function (c) { return c.id === clipEl.dataset.clipId; });
    var lane = document.getElementById('pp-vw-music-lane');
    var dur = _getVideoDurationForTimeline();
    if (!clip || !lane || !dur) return;
    if (e.target.closest('[data-waveform-link]')) return;
    e.preventDefault();
    e.stopPropagation();
    _videoWorkbench.selectedClipId = clip.id;
    if (e.target.closest('[data-remove]')) {
      _deleteSelectedVideoClip();
      return;
    }
    _syncWaveRangeToClip(clip);
    var handle = e.target.closest('.pp-vw-clip-handle, .pp-vw-clip-fade-handle');
    _videoWorkbench.dragClip = {
      id: clip.id,
      x: e.clientX,
      start: clip.videoStart,
      musicStart: clip.musicStart,
      musicEnd: clip.musicEnd,
      fadeIn: clip.fadeIn || 0,
      fadeOut: clip.fadeOut || 0,
      mode: handle ? handle.dataset.handle : 'move',
      lane: lane.getBoundingClientRect(),
      dur: dur
    };
    _renderVideoWorkbenchTimeline();
    window.addEventListener('pointermove', _moveVideoClip);
    window.addEventListener('pointerup', _endVideoClipDrag, { once: true });
  }

  function _handleVideoClipClick(e) {
    var wave = e.target && e.target.closest ? e.target.closest('[data-waveform-link]') : null;
    if (wave) {
      var waveClipEl = wave.closest('.pp-vw-clip');
      var waveClip = waveClipEl ? _videoWorkbench.clips.find(function (c) { return c.id === waveClipEl.dataset.clipId; }) : null;
      if (!waveClip) return;
      e.preventDefault();
      e.stopPropagation();
      _openWaveformTabForClip(waveClip);
      return;
    }
    var remove = e.target && e.target.closest ? e.target.closest('[data-remove]') : null;
    if (!remove) return;
    var clipEl = remove.closest('.pp-vw-clip');
    if (!clipEl) return;
    e.preventDefault();
    e.stopPropagation();
    _videoWorkbench.selectedClipId = clipEl.dataset.clipId || '';
    _deleteSelectedVideoClip();
  }

  function _openWaveformTabForClip(clip) {
    if (!clip) return;
    _videoWorkbench.selectedClipId = clip.id;
    var current = _getCurrentTrack();
    var needsTrack = clip.trackId && (!current || String(current.id) !== String(clip.trackId));
    if (needsTrack && window.HMIX_PLAYER && typeof window.HMIX_PLAYER.playTrackById === 'function') {
      try {
        _videoWorkbench.allowTrackSwitchOnce = true;
        window.HMIX_PLAYER.playTrackById(clip.trackId);
      } finally {
        _videoWorkbench.allowTrackSwitchOnce = false;
      }
    }
    function openWhenReady(attempt) {
      var active = _getCurrentTrack();
      var stillWaiting = clip.trackId && (!active || String(active.id) !== String(clip.trackId));
      if (stillWaiting && attempt < 10) {
        setTimeout(function () { openWhenReady(attempt + 1); }, 120);
        return;
      }
      _syncWaveRangeToClip(clip);
      _openToolboxTab('duration');
      setTimeout(function () {
        _syncWaveRangeToClip(clip);
        if (typeof _loadWaveform === 'function') _loadWaveform();
        if (typeof _drawWaveform === 'function') _drawWaveform();
        _seekWaveformManually(clip.musicStart || 0, false);
      }, 80);
      var audio = _getPlayerAudio();
      if (audio && !audio.paused) audio.pause();
    }
    openWhenReady(needsTrack ? 0 : 10);
  }

  function _shouldAskVideoBrowseSwitch(trackId) {
    if (!_isVideoWorkbenchEditingMode()) return false;
    if (_videoWorkbench.syncingMusic) return false;
    if (_videoWorkbench.allowTrackSwitchOnce) return false;
    trackId = trackId != null ? String(trackId) : '';
    var currentId = _getCurrentTrackId();
    return !!(trackId && trackId !== currentId);
  }

  function _handleBrowseModeTrackChange(trackId, isPlaying) {
    if (!_isVideoWorkbenchBrowseMode() || !_hasVideoWorkbenchVideo()) {
      _videoWorkbench.lastBrowseTrackId = '';
      return;
    }
    if (!isPlaying) return;
    trackId = trackId != null ? String(trackId) : '';
    if (!trackId || trackId === _videoWorkbench.lastBrowseTrackId) return;
    _videoWorkbench.lastBrowseTrackId = trackId;
    _restoreGlobalPlayerVolume();
    setTimeout(_restoreGlobalPlayerVolume, 120);
    if (_videoWorkbench.qPointEnabled) _restartVideoAtQPoint(true);
  }

  function _installVideoTrackSwitchGuard() {
    if (_videoWorkbench.guardInstalled) return;
    _videoWorkbench.guardInstalled = true;
    var install = function () {
      if (!window.HMIX_PLAYER || window.HMIX_PLAYER.__hmixVideoGuard) return;
      var player = window.HMIX_PLAYER;
      var originalById = player.playTrackById;
      var originalPlayTrack = player.playTrack;
      if (typeof originalById === 'function') {
        player.playTrackById = function (id) {
          if (_shouldAskVideoBrowseSwitch(id)) {
            _confirmSwitchToResidentForTrack(id, function () {
              try {
                _videoWorkbench.allowTrackSwitchOnce = true;
                originalById.call(player, id);
              } finally {
                _videoWorkbench.allowTrackSwitchOnce = false;
              }
            });
            return;
          }
          return originalById.apply(player, arguments);
        };
      }
      if (typeof originalPlayTrack === 'function') {
        player.playTrack = function (track, queue) {
          var id = track && track.id;
          if (_shouldAskVideoBrowseSwitch(id)) {
            _confirmSwitchToResidentForTrack(id, function () {
              try {
                _videoWorkbench.allowTrackSwitchOnce = true;
                originalPlayTrack.call(player, track, queue);
              } finally {
                _videoWorkbench.allowTrackSwitchOnce = false;
              }
            });
            return;
          }
          return originalPlayTrack.apply(player, arguments);
        };
      }
      player.__hmixVideoGuard = true;
    };
    install();
    setTimeout(install, 500);
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('#player-btn-next, #player-btn-prev') : null;
      if (!btn || !_isVideoWorkbenchEditingMode() || _videoWorkbench.allowNativeControlClick) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    _confirmSwitchToResidentForTrack('', function () {
      try {
        _videoWorkbench.allowNativeControlClick = true;
        btn.click();
      } finally {
        _videoWorkbench.allowNativeControlClick = false;
      }
    });
  }, true);
  }

  function _seekVideoWorkbenchFromLane(e) {
    if (!e || !_videoWorkbench.video) return;
    if (e.target && e.target.closest && e.target.closest('.pp-vw-clip, .pp-vw-clip-handle, .pp-vw-clip-fade-handle, .pp-vw-clip-remove, button, input')) return;
    var lane = e.currentTarget && e.currentTarget.getBoundingClientRect ? e.currentTarget : null;
    if (!lane || !lane.classList || !lane.classList.contains('pp-vw-lane-track')) {
      lane = e.target && e.target.closest ? e.target.closest('.pp-vw-lane-track') : null;
    }
    var dur = _getVideoDurationForTimeline();
    if (!lane || !dur) return;
    var rect = lane.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    e.preventDefault();
    var wasPlaying = !_videoWorkbench.video.paused;
    _videoWorkbench.video.currentTime = ratio * dur;
    _updateVideoWorkbenchTime();
    _syncMusicToVideo(true, wasPlaying);
  }

  function _moveVideoClip(e) {
    var d = _videoWorkbench.dragClip;
    if (!d) return;
    var clip = _videoWorkbench.clips.find(function (c) { return c.id === d.id; });
    if (!clip) return;
    var deltaSec = Math.round((((e.clientX - d.x) / Math.max(1, d.lane.width)) * d.dur) * 10) / 10;
    var pointerSec = Math.max(0, Math.min(d.dur, ((e.clientX - d.lane.left) / Math.max(1, d.lane.width)) * d.dur));
    var length = clip.musicEnd - clip.musicStart;
    if (d.mode === 'start') {
      var nextMusicStart = Math.max(0, Math.min(d.musicEnd - 0.5, d.musicStart + deltaSec));
      var actualDelta = nextMusicStart - d.musicStart;
      clip.musicStart = nextMusicStart;
      clip.videoStart = Math.max(0, Math.min(d.dur - 0.5, d.start + actualDelta));
      clip.fadeIn = Math.min(clip.fadeIn || 0, (clip.musicEnd - clip.musicStart) / 2);
    } else if (d.mode === 'end') {
      var maxMusicEnd = _getWaveformTimelineDuration(_getTrackById(clip.trackId)) || _getTrackDuration(_getTrackById(clip.trackId)) || 0;
      var nextLength = Math.max(0.5, pointerSec - clip.videoStart);
      nextLength = Math.min(nextLength, Math.max(0.5, d.dur - clip.videoStart), Math.max(0.5, maxMusicEnd - clip.musicStart));
      clip.musicEnd = clip.musicStart + nextLength;
      clip.fadeOut = Math.min(clip.fadeOut || 0, nextLength / 2);
    } else if (d.mode === 'fadein') {
      clip.fadeIn = Math.max(0, Math.min(length / 2, d.fadeIn + deltaSec));
      _fadeInSec = clip.fadeIn;
    } else if (d.mode === 'fadeout') {
      clip.fadeOut = Math.max(0, Math.min(length / 2, d.fadeOut - deltaSec));
      _fadeOutSec = clip.fadeOut;
    } else {
      clip.videoStart = Math.max(0, Math.min(d.dur - Math.min(length, d.dur), d.start + deltaSec));
    }
    _syncWaveRangeToClip(clip);
    _renderVideoWorkbenchTimeline();
    if (_videoWorkbench.video && !_videoWorkbench.video.paused) _syncMusicToVideo(true, true);
  }

  function _endVideoClipDrag() {
    var clip = _videoWorkbench.dragClip && _videoWorkbench.clips.find(function (c) { return c.id === _videoWorkbench.dragClip.id; });
    if (clip) _syncWaveRangeToClip(clip);
    _videoWorkbench.dragClip = null;
    window.removeEventListener('pointermove', _moveVideoClip);
    if (_videoWorkbench.video && !_videoWorkbench.video.paused) _syncMusicToVideo(true, true);
  }

  function _getTrackTitleEn(track) {
    return track ? (track.title_en || track.title || track.id) : '';
  }

  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _genHashtags(track) {
    var isEn = _isEn();
    if (!track) return isEn ? '#FreeBGM #HMIXGALLERY #VideoBGM #GameMusic' : '#フリーBGM #HMIXGALLERY #動画BGM #ゲーム音楽';
    var tags = _getTrackTagIds(track);
    var tagNames = _getTagNameMap();
    var map = {
      japanese: isEn ? ['#JapaneseMusic', '#WafuuBGM'] : ['#和風BGM', '#JapaneseMusic'],
      oriental: isEn ? ['#OrientalMusic', '#OrientalBGM'] : ['#オリエンタルBGM', '#OrientalMusic'],
      fantasy: isEn ? ['#FantasyBGM', '#FantasyMusic'] : ['#ファンタジーBGM', '#FantasyBGM'],
      scary: isEn ? ['#HorrorBGM', '#ScaryMusic'] : ['#ホラーBGM', '#HorrorBGM'],
      japanese_horror: isEn ? ['#JapaneseHorror', '#HorrorBGM'] : ['#和風ホラーBGM', '#JapaneseHorror'],
      western_horror: isEn ? ['#WesternHorror', '#HorrorMusic'] : ['#洋風ホラーBGM', '#WesternHorror'],
      sad: isEn ? ['#EmotionalMusic', '#SadBGM'] : ['#感動BGM', '#EmotionalMusic'],
      gentle: isEn ? ['#HealingMusic', '#GentleBGM'] : ['#癒しBGM', '#HealingMusic'],
      epic: isEn ? ['#EpicMusic', '#EpicBGM'] : ['#壮大BGM', '#EpicMusic'],
      battle: isEn ? ['#BattleMusic', '#BattleBGM'] : ['#戦闘BGM', '#BattleMusic'],
      celtic: isEn ? ['#CelticMusic', '#CelticBGM'] : ['#ケルトBGM', '#CelticMusic'],
      night: isEn ? ['#NightMusic', '#NightBGM'] : ['#夜BGM', '#NightMusic'],
      travel: isEn ? ['#TravelMusic', '#TravelBGM'] : ['#旅BGM', '#TravelMusic'],
      happy: isEn ? ['#HappyMusic', '#HappyBGM'] : ['#楽しいBGM', '#HappyMusic'],
      opening: isEn ? ['#OpeningBGM'] : ['#オープニングBGM'],
      ending: isEn ? ['#EndingBGM'] : ['#エンディングBGM'],
      field: isEn ? ['#FieldBGM'] : ['#フィールドBGM'],
      town: isEn ? ['#TownBGM'] : ['#街BGM']
    };
    var result = isEn
      ? ['#FreeBGM', '#HMIXGALLERY', '#VideoBGM', '#GameMusic', '#RoyaltyFreeMusic']
      : ['#フリーBGM', '#HMIXGALLERY', '#動画BGM', '#ゲーム音楽', '#配信用BGM'];
    function addTag(tag) {
      if (!tag || result.indexOf(tag) >= 0) return;
      result.push(tag);
    }
    function toHashLabel(name) {
      return String(name || '').replace(/[\s　・\/]+/g, '');
    }
    tags.forEach(function (id) {
      (map[id] || []).forEach(addTag);
      var name = toHashLabel(isEn ? _getTagLabelEn(id) : (tagNames[id] || id));
      if (name) addTag('#' + name + 'BGM');
    });
    return result.slice(0, 18).join(' ');
  }

  function _getTagLabelEn(id) {
    var map = {
      battle: 'Battle', bonds: 'Bonds', boss: 'Boss', cave: 'Cave', celtic: 'Celtic',
      church: 'Church', conspiracy: 'Conspiracy', cute: 'Cute', dailylife: 'DailyLife',
      dark: 'Dark', defeat: 'Defeat', despair: 'Despair', destiny: 'Destiny', dream: 'Dream',
      dungeon: 'Dungeon', electronic: 'Electronic', ending: 'Ending', epic: 'Epic',
      fantasy: 'Fantasy', farewell: 'Farewell', festival: 'Festival', field: 'Field',
      flashback: 'Flashback', flower: 'Flower', forest: 'Forest', futuristic: 'Futuristic',
      gentle: 'Gentle', happy: 'Happy', hope: 'Hope', horror: 'Horror',
      japanese: 'Japanese', japanese_horror: 'JapaneseHorror', mansion: 'Mansion',
      medieval: 'Medieval', memory: 'Memory', modern: 'Modern', morning: 'Morning',
      musicbox: 'MusicBox', mysterious: 'Mysterious', night: 'Night', omen: 'Omen',
      onsen: 'Onsen', opening: 'Opening', oriental: 'Oriental', peaceful: 'Peaceful',
      pursuit: 'Pursuit', resolve: 'Resolve', reunion: 'Reunion', ruins: 'Ruins',
      sad: 'Sad', samurai: 'Samurai', scary: 'Scary', shrine: 'Shrine', snow: 'Snow',
      suspense: 'Suspense', town: 'Town', travel: 'Travel', victory: 'Victory',
      village: 'Village', western_horror: 'WesternHorror'
    };
    return map[id] || String(id || '').replace(/(^|_)([a-z])/g, function (_, sep, c) { return c.toUpperCase(); });
  }

  function _getTagNameMap() {
    var names = {};
    if (window.TAGS_META) {
      Object.keys(window.TAGS_META).forEach(function (cat) {
        (window.TAGS_META[cat] || []).forEach(function (t) {
          names[t.id] = t.name || t.id;
        });
      });
    }
    return names;
  }

  function _getTrackTagIds(track) {
    if (!track) return [];
    var seen = {};
    return [].concat(track.feeling || [], track.style || [], track.scene || []).filter(function (id) {
      if (!id || seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function _getShareImageCandidates(track) {
    var names = _getTagNameMap();
    var map = {
      battle: 'battle', bonds: 'bonds', boss: 'boss', cave: 'cave', celtic: 'celtic',
      church: 'church', conspiracy: 'conspiracy', cute: 'cute', dailylife: 'dailylife',
      dark: 'dark', defeat: 'defeat', despair: 'despair', destiny: 'destiny', dream: 'dream',
      dungeon: 'dungeon', electronic: 'electronic', ending: 'ending', epic: 'epic',
      fantasy: 'fantasy', farewell: 'farewell', festival: 'festival', field: 'field',
      flashback: 'flashback', flower: 'flower', forest: 'forest', futuristic: 'futuristic',
      gentle: 'gentle', happy: 'happy', hope: 'hope', horror: 'horror',
      japanese: 'japanese', japanese_horror: 'japanese_horror', mansion: 'mansion',
      medieval: 'medieval', memory: 'memory', modern: 'modern', morning: 'morning',
      musicbox: 'musicbox', mysterious: 'mysterious', night: 'night', omen: 'omen',
      onsen: 'onsen', opening: 'opening', oriental: 'oriental', peaceful: 'peaceful',
      pursuit: 'pursuit', resolve: 'resolve', reunion: 'reunion', ruins: 'ruins',
      sad: 'sad', samurai: 'samurai', scary: 'scary', shrine: 'shrine', snow: 'snow',
      suspense: 'suspense', town: 'town', travel: 'travel', victory: 'victory',
      village: 'village', western_horror: 'western_horror'
    };
    var result = _getTrackTagIds(track).map(function (id) {
      var file = map[id];
      if (!file) return null;
      return {
        id: id,
        label: _isEn() ? _getTagLabelEn(id) : (names[id] || id),
        src: '/assets/images/scenes/' + file + '.webp'
      };
    }).filter(Boolean);
    if (!result.length) {
      result = [
        { id: 'fantasy', label: _txt('幻想', 'Fantasy'), src: '/assets/images/scenes/fantasy.webp' },
        { id: 'japanese', label: _txt('和風', 'Japanese'), src: '/assets/images/scenes/japanese.webp' },
        { id: 'night', label: _txt('夜', 'Night'), src: '/assets/images/scenes/night.webp' }
      ];
    }
    return result.slice(0, 4);
  }

  function _showPanelToast(message) {
    var host = _panel || document.body;
    var toast = document.getElementById('pp-panel-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pp-panel-toast';
      toast.className = 'pp-panel-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      host.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('is-show');
    window.clearTimeout(toast._timer);
    requestAnimationFrame(function () {
      toast.classList.add('is-show');
      toast._timer = window.setTimeout(function () {
        toast.classList.remove('is-show');
      }, 1800);
    });
  }

  // ── パネルHTML生成 ──
  function _copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      area.style.top = '0';
      document.body.appendChild(area);
      area.focus();
      area.select();
      try {
        if (document.execCommand('copy')) resolve();
        else reject(new Error('copy failed'));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(area);
      }
    });
  }

  function _buildPanel() {
    var div = document.createElement('div');
    div.id = 'player-panel';
    div.className = 'player-panel';
    div.innerHTML =
      '<div class="player-panel__inner">' +
        '<div class="player-panel__stage-head">' +
          '<div class="player-panel__stage-mark" aria-hidden="true"><span></span><span></span><span></span></div>' +
          '<div class="player-panel__stage-title">' +
            '<span class="player-panel__stage-kicker" data-ja="音の調理場" data-en="Sound Kitchen">音の調理場</span>' +
            '<strong data-ja="制作ツールボックス" data-en="Creator Toolbox">制作ツールボックス</strong>' +
          '</div>' +
          '<div class="player-panel__stage-copy" data-ja="見つけた音を、作品へ持ち帰る。" data-en="Shape the music and bring it into your work.">見つけた音を、作品へ持ち帰る。</div>' +
          '<button type="button" class="player-panel__video-launch" id="pp-video-launch">' +
            '<span data-ja="動画をアップロードして音楽を合わせる" data-en="Upload a video and sync music">動画をアップロードして音楽を合わせる</span>' +
          '</button>' +
          '<div class="player-panel__stage-status" aria-label="音の状態">' +
            '<div class="pp-stage-pill pp-stage-pill--fx"><span data-ja="音作り" data-en="FX">音作り</span><strong id="pp-stage-fx-state">原音</strong></div>' +
            '<div class="pp-stage-pill pp-stage-pill--limit"><span data-ja="リミッター" data-en="Limiter">リミッター</span><strong id="pp-stage-limit-state">OFF</strong></div>' +
            '<div class="pp-stage-pill pp-stage-pill--peak"><span data-ja="音割れ" data-en="Clip">音割れ</span><strong id="pp-stage-peak-db">-∞dB</strong><em id="pp-stage-peak-state">OK</em></div>' +
          '</div>' +
        '</div>' +
        '<div class="player-panel__tabs">' +
          '<button class="player-panel__tab is-active" data-tab="license" data-ja="使える？" data-en="License?">使える？</button>' +
          '<button class="player-panel__tab" data-tab="credit" data-ja="表記コピー" data-en="Credit">表記コピー</button>' +
          '<button class="player-panel__tab" data-tab="share" data-ja="シェア" data-en="Share">シェア</button>' +
          '<button class="player-panel__tab" data-tab="video" data-ja="動画" data-en="Video">動画</button>' +
          '<button class="player-panel__tab" data-tab="duration" data-ja="波形プレビュー" data-en="Waveform">波形プレビュー</button>' +
          '<button class="player-panel__tab" data-tab="eqcomp" data-ja="EQ・コンプ" data-en="EQ / Comp">EQ・コンプ</button>' +
          '<button class="player-panel__tab" data-tab="memo" data-ja="メモ" data-en="Memo">メモ</button>' +
          '<span class="player-panel__tabs-spacer"></span>' +
          '<a class="player-panel__action" id="pp-btn-dl" download aria-label="ダウンロード">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
            '<span data-ja="DL" data-en="DL">DL</span></a>' +
          '<a class="player-panel__action" id="pp-btn-detail" aria-label="詳細ページ">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
            '<span data-ja="詳細" data-en="Detail">詳細</span></a>' +
        '</div>' +

        // Tab 1: 使える？
        '<div class="player-panel__content is-active" id="pp-tab-license">' +
          '<ul class="pp-license-list">' +
            '<li class="pp-license-item"><span class="pp-license-icon">✅</span><span class="pp-license-name" data-ja="YouTube動画（収益化OK）" data-en="YouTube (monetization OK)">YouTube動画（収益化OK）</span><span class="pp-license-status pp-license-status--free" data-ja="無料" data-en="Free">無料</span></li>' +
            '<li class="pp-license-item"><span class="pp-license-icon">✅</span><span class="pp-license-name">YouTube Shorts</span><span class="pp-license-status pp-license-status--free" data-ja="無料" data-en="Free">無料</span></li>' +
            '<li class="pp-license-item"><span class="pp-license-icon">✅</span><span class="pp-license-name">TikTok</span><span class="pp-license-status pp-license-status--warn" data-ja="無料（60秒目安）" data-en="Free (60s guideline)">無料（60秒目安）</span></li>' +
            '<li class="pp-license-item"><span class="pp-license-icon">✅</span><span class="pp-license-name">Instagram Reels</span><span class="pp-license-status pp-license-status--free" data-ja="無料" data-en="Free">無料</span></li>' +
            '<li class="pp-license-item"><span class="pp-license-icon">✅</span><span class="pp-license-name" data-ja="個人ゲーム・同人作品" data-en="Indie games & doujin">個人ゲーム・同人作品</span><span class="pp-license-status pp-license-status--free" data-ja="無料" data-en="Free">無料</span></li>' +
            '<li class="pp-license-item"><span class="pp-license-icon">💼</span><span class="pp-license-name" data-ja="広告・企業VP" data-en="Ads & Corporate">広告・企業VP</span><span class="pp-license-status pp-license-status--paid" data-ja="ライセンス ¥2,200〜" data-en="License ¥2,200+">ライセンス ¥2,200〜</span></li>' +
            '<li class="pp-license-item"><span class="pp-license-icon">❌</span><span class="pp-license-name" data-ja="Content ID登録" data-en="Content ID registration">Content ID登録</span><span class="pp-license-status pp-license-status--no" data-ja="禁止" data-en="Prohibited">禁止</span></li>' +
            '<li class="pp-license-item"><span class="pp-license-icon">❌</span><span class="pp-license-name" data-ja="AI学習データ" data-en="AI training data">AI学習データ</span><span class="pp-license-status pp-license-status--no" data-ja="禁止" data-en="Prohibited">禁止</span></li>' +
          '</ul>' +
          '<p class="pp-license-note" data-ja="📋 クレジット表記：任意（していただけると嬉しいです）" data-en="📋 Credit: Optional (appreciated)">📋 クレジット表記：任意（していただけると嬉しいです）<br><a href="/terms.html" data-ja="詳しくは利用規約へ →" data-en="See License Terms →">詳しくは利用規約へ →</a></p>' +
        '</div>' +

        // Tab 2: 表記コピー
        '<div class="player-panel__content" id="pp-tab-credit"></div>' +

        // Tab 3: シェア
        '<div class="player-panel__content" id="pp-tab-share"><p class="pp-empty-hint" data-ja="曲を再生するとシェアリンクが表示されます" data-en="Play a track to see share links">曲を再生するとシェアリンクが表示されます</p></div>' +

        '<div class="player-panel__content pp-tab-video" id="pp-tab-video"></div>' +

        // Tab 4: 尺で試聴
        '<div class="player-panel__content" id="pp-tab-duration">' +
          '<div class="pp-waveform-wrap" id="pp-waveform-wrap"><canvas id="pp-waveform"></canvas><div class="pp-waveform-tooltip" id="pp-waveform-tooltip"></div></div>' +
          '<p class="pp-waveform-hint" id="pp-waveform-hint" data-ja="ドラッグで区間選択 / 選択範囲内をドラッグで長さそのまま移動 / Space=再生・Esc=解除" data-en="Drag to select / Drag inside selection to move it / Space=play · Esc=clear">ドラッグで区間選択 / 選択範囲内をドラッグで長さそのまま移動 / Space=再生・Esc=解除</p>' +

          '<div class="pp-export-check" id="pp-export-check">' +
            '<div class="pp-export-check__head">' +
              '<span data-ja="書き出し前チェック" data-en="Export Check">書き出し前チェック</span>' +
              '<strong id="pp-export-check-state">READY</strong>' +
            '</div>' +
            '<div class="pp-export-check__grid">' +
              '<div><span data-ja="範囲" data-en="Range">範囲</span><strong id="pp-export-check-range">曲全体</strong></div>' +
              '<div><span data-ja="音作り" data-en="Tone">音作り</span><strong id="pp-export-check-fx">原音</strong></div>' +
              '<div><span data-ja="安全" data-en="Safety">安全</span><strong id="pp-export-check-safe">音割れOK</strong></div>' +
              '<div><span data-ja="用途" data-en="Use">用途</span><strong id="pp-export-check-use">利用条件を確認</strong></div>' +
            '</div>' +
          '</div>' +

          // ── WAV書き出し (常時表示) ──
          '<div class="pp-wav-export-row">' +
            '<button class="pp-wav-export-btn" id="pp-export-full-wav" title="楽曲全体を WAV ファイルとして保存">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
              '<span data-ja="曲全体をWAV保存" data-en="Save full track as WAV">曲全体をWAV保存</span>' +
            '</button>' +
            '<button class="pp-wav-export-btn pp-wav-export-btn--range" id="pp-range-export" disabled title="波形をドラッグして範囲を選んでから押せます（範囲未選択）">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
              '<span data-ja="選択範囲をWAV保存" data-en="Save selected range as WAV">選択範囲をWAV保存</span>' +
            '</button>' +
          '</div>' +

          // ── 範囲情報バー (範囲選択時のみ表示) ──
          '<div class="pp-range-controls" id="pp-range-controls" hidden>' +
            '<div class="pp-range-info">' +
              '<span class="pp-range-time" id="pp-range-start" aria-label="開始">0:00.00</span>' +
              '<span class="pp-range-arrow" aria-hidden="true">→</span>' +
              '<span class="pp-range-time" id="pp-range-end" aria-label="終了">0:00.00</span>' +
              '<span class="pp-range-duration" id="pp-range-duration" aria-label="長さ">(0:00.00)</span>' +
            '</div>' +
            '<div class="pp-range-buttons">' +
              '<button class="pp-range-btn" id="pp-range-cue" aria-label="範囲の先頭へ" title="範囲先頭にプレイヘッド (J)">⏮ 先頭へ</button>' +
              '<button class="pp-range-btn pp-range-btn--primary" id="pp-range-play" aria-label="選択範囲を再生・ループ" title="選択範囲を再生 (Shift+Space)">▶ 範囲再生</button>' +
              '<button class="pp-range-btn" id="pp-range-clear" aria-label="範囲を解除" title="範囲解除 (Esc)">✕ 解除</button>' +
            '</div>' +
          '</div>' +

          // ── ループ制作 (折りたたみ・上級者向け) ──
          '<details class="pp-loop-advanced" id="pp-loop-advanced">' +
            '<summary class="pp-loop-advanced-summary" data-ja="ループ制作（上級者向け：ゲーム/動画素材化）" data-en="Loop crafting (advanced)">ループ制作（上級者向け：ゲーム/動画素材化）</summary>' +
            '<div class="pp-loop-advanced-body">' +
              '<p class="pp-loop-advanced-note" data-ja="楽曲をシームレスにループ可能なWAVへ変換します。BGM・SE・素材化用途。範囲を選んでから操作してください。" data-en="Convert music into seamlessly loopable WAV files for game/video use. Select a range first.">楽曲をシームレスにループ可能なWAVへ変換します。BGM・SE・素材化用途。範囲を選んでから操作してください。</p>' +
              '<div class="pp-loop-actions">' +
                '<button class="pp-range-btn" id="pp-loop-seam-preview" title="OUT直前+IN直後を連結ループ再生">🔁 繋ぎ目プレビュー</button>' +
                '<button class="pp-range-btn pp-range-btn--loop" id="pp-range-export-loop" title="smpl chunk 付き = FMOD/Unity/Kontakt 自動ループ対応">🎯 ループWAV書き出し</button>' +
              '</div>' +
              '<div class="pp-loop-options">' +
                '<label class="pp-loop-opt"><input type="checkbox" id="pp-zerocross-toggle" checked> <span>ゼロクロス吸着</span></label>' +
                '<label class="pp-loop-opt"><span>クロスフェード</span> <select id="pp-crossfade-ms"><option value="0">OFF</option><option value="10">10ms</option><option value="50">50ms</option><option value="100">100ms</option><option value="300">300ms</option></select></label>' +
                '<label class="pp-loop-opt"><span>ループ種別</span> <select id="pp-loop-type"><option value="forward">Forward</option><option value="pingpong">Ping-Pong</option><option value="reverse">Reverse</option></select></label>' +
                '<label class="pp-loop-opt"><span>BPM</span> <input type="number" id="pp-bpm-input" min="40" max="240" step="1" placeholder="auto" style="width:54px"></label>' +
              '</div>' +
              '<div class="pp-loop-bars">' +
                '<span class="pp-loop-bars__label">小節吸着:</span>' +
                '<button class="pp-loop-bars-btn" data-bars="1">1</button>' +
                '<button class="pp-loop-bars-btn" data-bars="2">2</button>' +
                '<button class="pp-loop-bars-btn" data-bars="4">4</button>' +
                '<button class="pp-loop-bars-btn" data-bars="8">8</button>' +
                '<button class="pp-loop-bars-btn" data-bars="16">16</button>' +
                '<button class="pp-loop-bars-btn" data-bars="32">32</button>' +
                '<span class="pp-loop-bars__hint">小節（要BPM入力）</span>' +
              '</div>' +
              '<div class="pp-seamless-display" id="pp-seamless-display">' +
                '<span class="pp-seamless-label">シームレス度</span>' +
                '<div class="pp-seamless-bar"><div class="pp-seamless-fill" id="pp-seamless-fill"></div></div>' +
                '<span class="pp-seamless-score" id="pp-seamless-score">—</span>' +
              '</div>' +
              '<div class="pp-seam-zoom-wrap" id="pp-seam-zoom-wrap">' +
                '<span class="pp-seam-zoom__label">繋ぎ目拡大</span>' +
                '<canvas class="pp-seam-zoom-canvas" id="pp-seam-zoom-canvas" width="800" height="60"></canvas>' +
              '</div>' +
              '<div class="pp-loop-regions">' +
                '<span class="pp-loop-regions__label">構造マーカー:</span>' +
                '<button class="pp-loop-region-btn pp-loop-region-btn--intro" id="pp-set-intro" title="現在の範囲を Intro に登録">📍 Intro</button>' +
                '<button class="pp-loop-region-btn pp-loop-region-btn--loop" id="pp-set-loop" title="現在の範囲を Loop body に登録">🔁 Loop</button>' +
                '<button class="pp-loop-region-btn pp-loop-region-btn--outro" id="pp-set-outro" title="現在の範囲を Outro に登録">📍 Outro</button>' +
                '<button class="pp-loop-region-btn" id="pp-clear-regions" title="すべて解除">✕</button>' +
                '<button class="pp-loop-region-btn pp-loop-region-btn--zip" id="pp-export-tail-zip" title="Loop + Outro を ZIP で同梱ダウンロード">📦 Loop+Outro ZIP</button>' +
              '</div>' +
              '<div class="pp-auto-loop">' +
                '<button class="pp-loop-region-btn pp-loop-region-btn--auto" id="pp-auto-detect" title="楽曲全体から類似度の高いループ点候補を自動検出">🤖 ループ点 自動検出</button>' +
                '<span class="pp-auto-loop__hint" id="pp-auto-loop-status">候補をクリックすると範囲に適用</span>' +
              '</div>' +
            '</div>' +
          '</details>' +
          '<p class="pp-duration-desc" data-ja="動画に合う尺を試せます。ボタンを押すと先頭からその秒数だけ再生します。" data-en="Try different lengths for your video. Press a button to play from the start for that duration.">動画に合う尺を試せます。ボタンを押すと先頭からその秒数だけ再生します。</p>' +
          '<div class="pp-duration-presets">' +
            '<button class="pp-duration-btn" data-sec="15">15秒</button>' +
            '<button class="pp-duration-btn" data-sec="30">30秒</button>' +
            '<button class="pp-duration-btn" data-sec="60">60秒</button>' +
            '<button class="pp-duration-btn" data-sec="90">90秒</button>' +
            '<button class="pp-duration-btn pp-duration-btn--full" data-sec="0" data-ja="フル再生" data-en="Full">フル再生</button>' +
            '<button class="pp-climax-btn" id="pp-climax-play" data-ja="サビから再生" data-en="Play Climax">サビから再生</button>' +
          '</div>' +
          '<div class="pp-duration-status" id="pp-duration-status"></div>' +
          '<div class="pp-controls-grid">' +
            '<div class="pp-fade-row">' +
              '<span class="pp-speed-label" data-ja="フェード入" data-en="Fade In">フェード入</span>' +
              '<button class="pp-fadein-btn is-active" data-fadein="0">OFF</button>' +
              '<button class="pp-fadein-btn" data-fadein="0.5">0.5s</button>' +
              '<button class="pp-fadein-btn" data-fadein="1">1s</button>' +
              '<button class="pp-fadein-btn" data-fadein="2">2s</button>' +
              '<button class="pp-fadein-btn" data-fadein="3">3s</button>' +
            '</div>' +
            '<div class="pp-fade-row">' +
              '<span class="pp-speed-label" data-ja="フェード出" data-en="Fade Out">フェード出</span>' +
              '<button class="pp-fade-btn" data-fade="0">OFF</button>' +
              '<button class="pp-fade-btn" data-fade="1">1s</button>' +
              '<button class="pp-fade-btn is-active" data-fade="2">2s</button>' +
              '<button class="pp-fade-btn" data-fade="3">3s</button>' +
              '<button class="pp-fade-btn" data-fade="5">5s</button>' +
            '</div>' +
            '<div class="pp-speed-row">' +
              '<span class="pp-speed-label" data-ja="速度" data-en="Speed">速度</span>' +
              '<button class="pp-speed-btn" data-speed="0.5">0.5x</button>' +
              '<button class="pp-speed-btn is-active" data-speed="1">1x</button>' +
              '<button class="pp-speed-btn" data-speed="1.5">1.5x</button>' +
              '<button class="pp-speed-btn" data-speed="2">2x</button>' +
            '</div>' +
            '<label class="pp-duration-loop"><input type="checkbox" id="pp-duration-loop"> <span data-ja="ループ" data-en="Loop">ループ</span></label>' +
          '</div>' +
        '</div>' +

        // Tab 5: EQ・コンプ（試聴用エフェクト。曲を切り替えると Flat/Bypass に戻る）
        '<div class="player-panel__content" id="pp-tab-eqcomp">' +
          '<div class="pp-eqcomp-head">' +
            '<div class="pp-eqcomp-title">' +
              '<strong data-ja="EQ・コンプ" data-en="EQ / Comp">EQ・コンプ</strong>' +
              '<span class="pp-eqcomp-badge" id="pp-eqcomp-badge" hidden data-ja="加工中" data-en="PREVIEW FX">加工中</span>' +
            '</div>' +
            '<div class="pp-eqcomp-actions-top">' +
              '<button class="pp-eqcomp-mini" id="pp-eqcomp-bypass" data-ja="一時停止" data-en="Bypass" title="加工を一時停止して原音と聴き比べ">一時停止</button>' +
              '<button class="pp-eqcomp-mini" id="pp-eqcomp-reset" data-ja="リセット" data-en="Reset">リセット</button>' +
            '</div>' +
          '</div>' +
          '<p class="pp-eqcomp-note" data-ja="※ 選んだ音作りはWAV保存にも反映されます。MP3配布元は変更しません。" data-en="※ Selected tone shaping is applied to WAV downloads. Source MP3 files are not modified.">※ 選んだ音作りはWAV保存にも反映されます。MP3配布元は変更しません。</p>' +

          '<div class="pp-eqcomp-preset-row pp-eqcomp-preset-row--scene">' +
            '<div class="pp-eqcomp-preset-row-label" data-ja="用途" data-en="Use"><strong>用途</strong><span class="pp-eqcomp-preset-sub">One touch</span></div>' +
            '<div class="pp-eqcomp-chip-grid">' +
              '<button class="pp-eqcomp-chip is-active" data-masterpreset="asis" data-ja="原曲のまま" data-en="As-Is" title="加工せず原曲のまま">原曲のまま</button>' +
              '<button class="pp-eqcomp-chip" data-masterpreset="voicebed" data-ja="動画ナレ下" data-en="Voice Bed" title="ナレーションを乗せやすいように声の帯域を少し空ける">動画ナレ下</button>' +
              '<button class="pp-eqcomp-chip" data-masterpreset="youtube" data-ja="YouTube整音" data-en="YouTube" title="動画BGM向けに軽く整えて音量差を抑える">YouTube整音</button>' +
              '<button class="pp-eqcomp-chip" data-masterpreset="shortstrong" data-ja="ショート用強め" data-en="Short Strong" title="短尺動画で前に出る強めの整音">ショート用強め</button>' +
              '<button class="pp-eqcomp-chip" data-masterpreset="trailer" data-ja="シネマ予告" data-en="Trailer" title="低域と空気感を少し足して映画予告風にする">シネマ予告</button>' +
              '<button class="pp-eqcomp-chip" data-masterpreset="forward" data-ja="静かな曲を前へ" data-en="Bring Forward" title="小さめの曲を動画内で聞こえやすくする">静かな曲を前へ</button>' +
              '<button class="pp-eqcomp-chip" data-masterpreset="cleanlow" data-ja="低音すっきり" data-en="Low Clean" title="低域の濁りを抑えて軽くする">低音すっきり</button>' +
            '</div>' +
          '</div>' +
          // 音色プリセット (EQベース)
          '<div class="pp-eqcomp-preset-row">' +
            '<div class="pp-eqcomp-preset-row-label" data-ja="音色" data-en="Tone"><strong>音色</strong><span class="pp-eqcomp-preset-sub">Tone</span></div>' +
            '<div class="pp-eqcomp-chip-grid">' +
              '<button class="pp-eqcomp-chip is-active" data-eqpreset="flat" data-ja="素のまま" data-en="As-Is" title="EQはオフ">素のまま</button>' +
              '<button class="pp-eqcomp-chip" data-eqpreset="warm" data-ja="あたたかく" data-en="Warm" title="低中域を少し足し、高域をやさしく">あたたかく</button>' +
              '<button class="pp-eqcomp-chip" data-eqpreset="bright" data-ja="明るく" data-en="Bright" title="高域を持ち上げて空気感を足す">明るく</button>' +
              '<button class="pp-eqcomp-chip" data-eqpreset="lowboost" data-ja="低音強化" data-en="Bass+" title="80Hz/250Hzを少し補強。控えめなブースト">低音強化</button>' +
              '<button class="pp-eqcomp-chip" data-eqpreset="narration" data-ja="ナレ下" data-en="Voice EQ" title="動画ナレーション下に置く時、声と被る帯域を控える">ナレ下</button>' +
              '<button class="pp-eqcomp-chip" data-eqpreset="cinematic" data-ja="映画感" data-en="Cinematic" title="低域に厚み、空気感に広がり">映画感</button>' +
              '<button class="pp-eqcomp-chip" data-eqpreset="lofi" data-ja="Lo-fi" data-en="Lo-fi" title="高域を削り、低中域を少し残してざらっと">Lo-fi</button>' +
            '</div>' +
          '</div>' +
          // 質感プリセット (コンプベース)
          '<div class="pp-eqcomp-preset-row">' +
            '<div class="pp-eqcomp-preset-row-label" data-ja="質感" data-en="Dynamics"><strong>質感</strong><span class="pp-eqcomp-preset-sub">Dynamics</span></div>' +
            '<div class="pp-eqcomp-chip-grid">' +
              '<button class="pp-eqcomp-chip is-active" data-comppreset="off" data-ja="コンプなし" data-en="Off" title="コンプ完全オフ。原曲のダイナミクスのまま">コンプなし</button>' +
              '<button class="pp-eqcomp-chip" data-comppreset="natural" data-ja="軽く整える" data-en="Natural" title="原曲の空気を残した軽い整音">軽く整える</button>' +
              '<button class="pp-eqcomp-chip" data-comppreset="glue" data-ja="まとまり" data-en="Glue" title="オーケストラ・幻想・和風BGMをまとめる">まとまり</button>' +
              '<button class="pp-eqcomp-chip" data-comppreset="voicebed" data-ja="動画ナレ下" data-en="Voice Bed" title="ナレーション下に敷く時の急な盛り上がりを抑える">動画ナレ下</button>' +
              '<button class="pp-eqcomp-chip" data-comppreset="shortpunch" data-ja="SNS向け" data-en="Short Punch" title="短尺SNS・予告編で少し前に出す">SNS向け</button>' +
              '<button class="pp-eqcomp-chip" data-comppreset="peakguard" data-ja="ピーク保護" data-en="Peak Guard" title="大きなピークだけを抑える保険">ピーク保護</button>' +
            '</div>' +
          '</div>' +
          // メーター行
          '<div class="pp-eqcomp-meter-row">' +
            '<div class="pp-eqcomp-meter"><span data-ja="入力" data-en="IN">入力</span><div class="pp-eqcomp-meter-bar"><i id="pp-eqcomp-mtr-in"></i></div></div>' +
            '<div class="pp-eqcomp-meter"><span data-ja="出力" data-en="OUT">出力</span><div class="pp-eqcomp-meter-bar"><i id="pp-eqcomp-mtr-out"></i></div></div>' +
            '<div class="pp-eqcomp-meter"><span data-ja="抑え量" data-en="GR">抑え量</span><div class="pp-eqcomp-meter-bar pp-eqcomp-meter-bar--gr"><i id="pp-eqcomp-mtr-gr"></i></div></div>' +
            '<span class="pp-eqcomp-gr" id="pp-eqcomp-gr-readout">0.0dB</span>' +
            '<div class="pp-eqcomp-peak" id="pp-eqcomp-peak"><span data-ja="音割れ確認" data-en="Clip Check">音割れ確認</span><strong id="pp-eqcomp-peak-db">-∞dB</strong><em id="pp-eqcomp-peak-state" data-ja="OK" data-en="OK">OK</em></div>' +
          '</div>' +
          // 詳細セクション (折りたたみ)
          '<details class="pp-eqcomp-details" id="pp-eqcomp-details">' +
            '<summary class="pp-eqcomp-details-summary" data-ja="詳細パラメータ (上級者向け)" data-en="Detailed parameters (advanced)">詳細パラメータ (上級者向け)</summary>' +
            '<div class="pp-eqcomp-details-body">' +
              '<div class="pp-eqcomp-grid">' +
                '<div class="pp-eqcomp-display">' +
                  '<div class="pp-eqcomp-canvas-wrap">' +
                    '<canvas class="pp-eqcomp-canvas" id="pp-eqcomp-canvas" width="720" height="220"></canvas>' +
                    '<div class="pp-eqcomp-axis-x"><span>40</span><span>80</span><span>250</span><span>1k</span><span>4k</span><span>10k</span><span>18k</span></div>' +
                    '<div class="pp-eqcomp-axis-y"><span>+9</span><span>0</span><span>-9</span></div>' +
                  '</div>' +
                  '<div class="pp-eqcomp-bands" id="pp-eqcomp-bands"></div>' +
                '</div>' +
                '<div class="pp-eqcomp-controls">' +
                  '<div class="pp-eqcomp-section">' +
                    '<div class="pp-eqcomp-section-head">' +
                      '<span data-ja="コンプレッサー" data-en="Compressor">コンプレッサー</span>' +
                    '</div>' +
                    '<div class="pp-eqcomp-comp" id="pp-eqcomp-comp"></div>' +
                  '</div>' +
                  '<div class="pp-eqcomp-actions">' +
                    '<button class="pp-eqcomp-mini" id="pp-eqcomp-ab">A/B: A</button>' +
                    '<button class="pp-eqcomp-mini" id="pp-eqcomp-copy" data-ja="設定コピー" data-en="Copy">設定コピー</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</details>' +
        '</div>' +

        // Tab 6: メモ
        '<div class="player-panel__content" id="pp-tab-memo">' +
          '<div class="pp-memo-toolbar">' +
            '<button class="pp-memo-btn" id="memo-insert-title" data-ja="♪ 曲名" data-en="♪ Title">♪ 曲名</button>' +
            '<button class="pp-memo-btn" id="memo-insert-time" data-ja="⏱ 位置" data-en="⏱ Time">⏱ 位置</button>' +
            '<button class="pp-memo-btn" id="memo-insert-range" data-ja="↔ 範囲" data-en="↔ Range">↔ 範囲</button>' +
            '<button class="pp-memo-btn" id="memo-insert-info" data-ja="📋 曲情報" data-en="📋 Info">📋 曲情報</button>' +
            '<button class="pp-memo-btn pp-memo-btn--log" id="memo-insert-prodlog" data-ja="制作ログ" data-en="Work Log">制作ログ</button>' +
            '<button class="pp-memo-btn pp-memo-btn--log" id="memo-insert-exportcheck" data-ja="書出確認" data-en="Export Check">書出確認</button>' +
            '<button class="pp-memo-btn pp-memo-btn--eq" id="memo-insert-eqcomp" data-ja="EQ記録" data-en="Save EQ">EQ記録</button>' +
            '<button class="pp-memo-btn pp-memo-btn--eq" id="memo-apply-eqcomp" data-ja="EQ反映" data-en="Apply EQ">EQ反映</button>' +
            '<button class="pp-memo-btn pp-memo-btn--clear" id="memo-clear" data-ja="クリア" data-en="Clear">クリア</button>' +
            '<button class="pp-memo-btn pp-memo-btn--help" id="memo-help-btn">?</button>' +
            '<span class="pp-memo-spacer"></span>' +
            '<input class="pp-memo-tag-input" id="memo-tag" type="text" data-placeholder-ja="プロジェクト名..." data-placeholder-en="Project name..."  placeholder="プロジェクト名...">' +
          '</div>' +
          '<textarea class="pp-memo-area" id="memo-text" placeholder="曲を聴きながらメモ..." data-placeholder-ja="曲を聴きながらメモ..." data-placeholder-en="Take notes while listening..."></textarea>' +
          '<div class="pp-memo-footer">' +
            '<span class="pp-memo-status" id="memo-status"></span>' +
            '<button class="pp-memo-btn" id="memo-copy" data-ja="コピー" data-en="Copy">コピー</button>' +
            '<button class="pp-memo-btn" id="memo-export-txt" data-ja="この曲.txt" data-en="Track.txt">この曲.txt</button>' +
            '<button class="pp-memo-btn" id="memo-export-all" data-ja="全メモ.txt" data-en="All.txt">全メモ.txt</button>' +
            '<button class="pp-memo-btn" id="memo-export-md" data-ja="全メモ.md" data-en="All.md">全メモ.md</button>' +
            '<button class="pp-memo-btn" id="memo-share-url" data-ja="共有URL" data-en="Share URL">共有URL</button>' +
            '<button class="pp-memo-btn" id="memo-list-btn" data-ja="一覧" data-en="List">一覧(<span id="memo-count">0</span>)</button>' +
          '</div>' +
          '<div class="pp-memo-list" id="memo-list" hidden></div>' +
        '</div>' +

      '</div>';
    return div;
  }

  // ── Tab 2 更新 ──
  function _updateCreditTab() {
    var el = document.getElementById('pp-tab-credit');
    if (!el) return;
    var track = _getCurrentTrack();
    if (!track) {
      el.innerHTML = '<p class="pp-empty-hint" data-ja="曲を再生するとクレジット表記が生成されます" data-en="Play a track to generate credit text">' + _txt('曲を再生するとクレジット表記が生成されます', 'Play a track to generate credit text') + '</p>';
      return;
    }
    var title = _getTrackTitle(track);
    var titleEn = _getTrackTitleEn(track);
    var hashtags = _genHashtags(track);
    var placeholder = title;

    el.innerHTML =
      _creditBlock(_txt('YouTube概要欄（推奨）', 'YouTube description'), 'BGM：' + placeholder + ' / H/MIX GALLERY（秋山裕和）\nhttps://www.hmix.net', true) +
      _creditBlock(_txt('短縮版', 'Short credit'), 'BGM：H/MIX GALLERY  https://www.hmix.net', false) +
      _creditBlock('English', 'Music: ' + (titleEn || placeholder) + ' by H/MIX GALLERY (Hirokazu Akiyama)\nhttps://www.hmix.net', false) +
      _creditBlock(_txt('ハッシュタグ', 'Hashtags'), hashtags, false);

    el.querySelectorAll('.pp-copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.dataset.text;
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = _txt('✓ コピー済み', '✓ Copied');
          btn.classList.add('copied');
          setTimeout(function () { btn.textContent = _txt('コピー', 'Copy'); btn.classList.remove('copied'); }, 2000);
          _ga('credit_copy', { template: btn.closest('.pp-credit-block').querySelector('.pp-credit-label').textContent.trim() });
        });
      });
    });
  }

  function _creditBlock(label, text, rec) {
    return '<div class="pp-credit-block">' +
      '<div class="pp-credit-label">' + _esc(label) + (rec ? ' <span class="pp-rec">' + _txt('おすすめ', 'Recommended') + '</span>' : '') + '</div>' +
      '<div class="pp-credit-body">' +
        '<span class="pp-credit-text">' + _esc(text) + '</span>' +
        '<button class="pp-copy-btn" data-text="' + _esc(text).replace(/\n/g, '&#10;') + '">' + _txt('コピー', 'Copy') + '</button>' +
      '</div></div>';
  }

  // ── Tab 3 更新 ──
  function _updateShareTab() {
    var el = document.getElementById('pp-tab-share');
    if (!el) return;
    var track = _getCurrentTrack();
    if (!track) {
      el.innerHTML = '<p class="pp-share-hint">' + _txt('曲を再生するとシェアリンクが表示されます', 'Play a track to show share links.') + '</p>';
      return;
    }
    var title = _getTrackTitle(track);
    var url = 'https://www.hmix.net/music/' + track.id + '.html';
    var hashtags = _genHashtags(track);
    var strongHashtags = hashtags.split(/\s+/).filter(Boolean).slice(0, 5).join(' ');
    var shortHashtags = hashtags.split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
    var creditText = title ? 'BGM: ' + title + ' / H/MIX GALLERY' : 'BGM: H/MIX GALLERY';
    var postTemplates = {
      long: title + ' / H/MIX GALLERY\n' +
        _txt('作品づくりに使いたくなるBGMを見つけました。映像やゲームの空気づくりに合いそうです。', 'Found BGM I want to use in a project. It feels useful for shaping the mood of video or game scenes.') + '\n\n' +
        creditText + '\n' + url + '\n\n' + hashtags,
      normal: title + ' / H/MIX GALLERY\n' +
        _txt('作品づくりに使いたくなるBGMを見つけました。', 'Found BGM I want to use in a project.') + '\n' +
        url + '\n' + hashtags,
      short: title + ' / H/MIX GALLERY\n' + url + '\n' + hashtags
    };
    postTemplates = _isEn() ? {
      long1: 'H/MIX GALLERY has been renewed.\n' +
        'The Music Library helps you find tracks by emotion and scene tags, while the Sound Theater lets you discover BGM through an immersive listening experience.\n\n' +
        'Featured track: ' + title + '\n' +
        url + '\n\n' + strongHashtags,
      long2: 'The H/MIX GALLERY Creator Toolbox is getting stronger.\n' +
        'Preview waveforms, select ranges, export clips, and shape BGM for video with EQ, compression, and production notes.\n\n' +
        'Track to hear: ' + title + '\n' +
        url + '\n\n' + strongHashtags,
      long3: 'H/MIX GALLERY is evolving into a music site that connects BGM discovery, production notes, editing, saving, and licensing.\n' +
        'Manage candidates with the favorites box and move smoothly toward commercial use when needed.\n\n' +
        'Now playing: ' + title + '\n' +
        url + '\n\n' + strongHashtags,
      normal: title + ' / H/MIX GALLERY\n' +
        'A free music library with emotion and scene tags, an immersive Sound Theater, and creator tools for waveform editing, EQ, and compression.\n' +
        url + '\n' + strongHashtags,
      short: title + ' / H/MIX GALLERY\n' + url + '\n' + shortHashtags
    } : {
      long1: 'H/MIX GALLERY リニューアル公開中\n' +
        '感情やシーンタグから音楽を探せる「音の図書館」と、没入しながらBGMに出会える「音の劇場」を新設しました。\n\n' +
        '今回のおすすめ曲：' + title + '\n' +
        url + '\n\n' + strongHashtags,
      long2: 'H/MIX GALLERY の制作ツールボックスを強化しました。\n' +
        '波形を見ながら範囲を決め、切り取ってダウンロード。EQ/コンプやメモ機能も使いながら、動画制作に合わせてBGMを整えられます。\n\n' +
        '試聴曲：' + title + '\n' +
        url + '\n\n' + strongHashtags,
      long3: 'H/MIX GALLERY は、BGM探しから制作メモ、編集、保存までをひとつにつなげる音楽サイトへ進化中です。\n' +
        '高機能なお気に入りボックスで候補を管理し、商用利用まで迷わず進められるように整えています。\n\n' +
        '今聴ける曲：' + title + '\n' +
        url + '\n\n' + strongHashtags,
      normal: title + ' / H/MIX GALLERY\n' +
        '感情やシーンタグで探せる音の図書館、没入してBGMに出会える音の劇場、波形編集やEQ/コンプに対応した制作ツールボックスを公開中です。\n' +
        url + '\n' + strongHashtags,
      short: title + ' / H/MIX GALLERY\n' + url + '\n' + shortHashtags
    };
    var postText = postTemplates.normal;
    var imageCandidates = _getShareImageCandidates(track);
    var imageHtml = imageCandidates.map(function (img, i) {
      return '<button class="pp-share-image' + (i === 0 ? ' is-active' : '') + '" data-insert-image="' + _esc(img.src) + '" data-image-label="' + _esc(img.label) + '" title="' + _esc(img.label) + '">' +
        '<img src="' + _esc(img.src) + '" alt="' + _esc(img.label) + '" loading="lazy">' +
        '<span>' + _esc(img.label) + '</span>' +
      '</button>';
    }).join('');
    var tagChips = hashtags.split(/\s+/).filter(Boolean).map(function (tag) {
      return '<button class="pp-share-tag" data-insert-tag="' + _esc(tag) + '">' + _esc(tag) + '</button>';
    }).join('');
    var mailSubject = encodeURIComponent(title ? title + ' - H/MIX GALLERY' : 'H/MIX GALLERY');

    el.innerHTML =
      '<div class="pp-share-lab">' +
        '<section class="pp-share-card pp-share-card--post">' +
          '<div class="pp-share-card-head">' +
            '<span>' + _txt('投稿エディタ', 'Post Editor') + '</span>' +
            '<strong>' + _esc(title) + '</strong>' +
          '</div>' +
          '<div class="pp-share-presets" aria-label="' + _txt('投稿文の長さ', 'Post length') + '">' +
            '<button class="pp-share-preset" data-share-template="long1">' + _txt('長め1', 'Long 1') + '</button>' +
            '<button class="pp-share-preset" data-share-template="long2">' + _txt('長め2', 'Long 2') + '</button>' +
            '<button class="pp-share-preset" data-share-template="long3">' + _txt('長め3', 'Long 3') + '</button>' +
            '<button class="pp-share-preset is-active" data-share-template="normal">' + _txt('普通', 'Normal') + '</button>' +
            '<button class="pp-share-preset" data-share-template="short">' + _txt('短め', 'Short') + '</button>' +
          '</div>' +
          '<textarea class="pp-share-editor" id="pp-share-editor" rows="5" spellcheck="false">' + _esc(postText) + '</textarea>' +
          '<div class="pp-share-editor-meta">' +
            '<span id="pp-share-editor-count">' + postText.length + '</span>' +
            '<button class="pp-share-reset" id="pp-share-reset">' + _txt('初期文に戻す', 'Reset') + '</button>' +
          '</div>' +
          '<div class="pp-share-primary-row">' +
            '<button class="pp-share-big pp-share-big--primary" id="pp-share-copy-post" data-copy-text="' + _esc(postText) + '">' +
              '<span>' + _txt('投稿文をコピー', 'Copy Post') + '</span><em>' + _txt('編集した本文をコピー', 'Copy edited text') + '</em></button>' +
          '</div>' +
          '<div class="pp-share-social-row" aria-label="' + _txt('SNSにシェア', 'Share to social') + '">' +
            '<a class="pp-share-social" id="pp-share-open-x" href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(postText) + '" target="_blank" rel="noopener"><strong>X</strong><span>' + _txt('投稿フォームを開く', 'Open composer') + '</span></a>' +
            '<a class="pp-share-social" id="pp-share-open-bluesky" href="https://bsky.app/intent/compose?text=' + encodeURIComponent(postText) + '" target="_blank" rel="noopener"><strong>Bluesky</strong><span>' + _txt('投稿フォームを開く', 'Open composer') + '</span></a>' +
            '<a class="pp-share-social" id="pp-share-open-line" href="https://line.me/R/msg/text/?' + encodeURIComponent(postText) + '" target="_blank" rel="noopener"><strong>LINE</strong><span>' + _txt('送信画面を開く', 'Open sender') + '</span></a>' +
            '<a class="pp-share-social" id="pp-share-open-mail" href="mailto:?subject=' + mailSubject + '&body=' + encodeURIComponent(postText) + '"><strong>Mail</strong><span>' + _txt('メールを開く', 'Open email') + '</span></a>' +
          '</div>' +
        '</section>' +
        '<section class="pp-share-card pp-share-card--kit">' +
          '<div class="pp-share-card-head">' +
            '<span>' + _txt('ハッシュタグ', 'Hashtags') + '</span>' +
            '<strong>' + _txt('クリックで左へ追加', 'Click to add') + '</strong>' +
          '</div>' +
          '<div class="pp-share-tags pp-share-tags--main">' + tagChips + '</div>' +
        '</section>' +
        '<section class="pp-share-card pp-share-card--visual">' +
          '<div class="pp-share-card-head">' +
            '<span>' + _txt('画像素材', 'Image Assets') + '</span>' +
            '<strong>' + _txt('クリックで左へ追加', 'Click to add') + '</strong>' +
          '</div>' +
          '<div class="pp-share-images">' + imageHtml + '</div>' +
        '</section>' +
      '</div>';

    var editor = document.getElementById('pp-share-editor');
    var countEl = document.getElementById('pp-share-editor-count');
    var copyPostBtn = document.getElementById('pp-share-copy-post');
    var xLink = document.getElementById('pp-share-open-x');
    var blueskyLink = document.getElementById('pp-share-open-bluesky');
    var lineLink = document.getElementById('pp-share-open-line');
    var mailLink = document.getElementById('pp-share-open-mail');
    function syncPostTargets() {
      var text = editor ? editor.value : postText;
      if (countEl) countEl.textContent = text.length;
      if (copyPostBtn) copyPostBtn.setAttribute('data-copy-text', text);
      if (xLink) xLink.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
      if (blueskyLink) blueskyLink.href = 'https://bsky.app/intent/compose?text=' + encodeURIComponent(text);
      if (lineLink) lineLink.href = 'https://line.me/R/msg/text/?' + encodeURIComponent(text);
      if (mailLink) mailLink.href = 'mailto:?subject=' + mailSubject + '&body=' + encodeURIComponent(text);
    }
    if (editor) {
      editor.addEventListener('input', syncPostTargets);
      syncPostTargets();
    }
    function appendToEditor(text, notice) {
      if (!editor || !text) return;
      var base = editor.value.replace(/\s+$/g, '');
      editor.value = base ? base + '\n' + text : text;
      syncPostTargets();
      _showPanelToast(notice || _txt('投稿文に追加しました', 'Added to post'));
    }
    el.querySelectorAll('[data-share-template]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-share-template');
        if (!editor || !postTemplates[key]) return;
        editor.value = postTemplates[key];
        el.querySelectorAll('[data-share-template]').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        syncPostTargets();
      });
    });
    var resetBtn = document.getElementById('pp-share-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!editor) return;
        editor.value = postTemplates.normal;
        el.querySelectorAll('[data-share-template]').forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-share-template') === 'normal');
        });
        syncPostTargets();
      });
    }
    el.querySelectorAll('[data-insert-tag]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tag = btn.getAttribute('data-insert-tag') || '';
        if (!tag) return;
        appendToEditor(tag, _txt('タグを追加しました: ', 'Added tag: ') + tag);
      });
    });
    el.querySelectorAll('[data-insert-image]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-insert-image') || '';
        var label = btn.getAttribute('data-image-label') || _txt('画像候補', 'Image idea');
        if (!src) return;
        var absolute = src.indexOf('http') === 0 ? src : 'https://www.hmix.net' + src;
        appendToEditor(_txt('画像候補: ', 'Image idea: ') + label + '\n' + absolute, _txt('画像候補を追加しました: ', 'Added image idea: ') + label);
      });
    });

    el.querySelectorAll('[data-copy-text]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy-text') || '';
        var label = btn.querySelector('strong, span');
        var copiedName = label ? label.textContent.trim() : _txt('内容', 'Text');
        btn.classList.add('is-copied');
        btn.setAttribute('data-copied-label', _txt('コピー済み', 'Copied'));
        _showPanelToast(_txt('コピーしました: ', 'Copied: ') + copiedName);
        _copyText(text).catch(function () {
          _showPanelToast(_txt('コピーに失敗しました。ブラウザの権限を確認してください。', 'Copy failed. Please check browser permissions.'));
        });
        setTimeout(function () {
          btn.classList.remove('is-copied');
          btn.removeAttribute('data-copied-label');
        }, 1500);
        _ga('sns_share', { platform: 'copy' });
      });
    });
    el.querySelectorAll('.pp-share-social').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        var opened = null;
        try {
          opened = window.open(href, '_blank', 'noopener');
        } catch (err) {}
        if (!opened && href.indexOf('mailto:') === 0) {
          window.location.href = href;
        } else if (!opened) {
          window.location.href = href;
        }
        _ga('sns_share', { platform: (link.querySelector('strong') ? link.querySelector('strong').textContent : 'social') });
      });
    });
  }

  function _updateActionButtons() {
    var track = _getCurrentTrack();
    // パネル内 + プレイヤー本体のDL/詳細を両方更新
    var dlBtns = [document.getElementById('pp-btn-dl'), document.getElementById('player-btn-dl')];
    var detailBtns = [document.getElementById('pp-btn-detail'), document.getElementById('player-btn-detail')];
    dlBtns.forEach(function (btn) {
      if (!btn) return;
      if (track && track.mp3) {
        btn.href = track.mp3;
        btn.setAttribute('download', (track.title || track.id));
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        // クレジットモーダル（1回だけフック）
        if (!btn.dataset.creditHooked) {
          btn.dataset.creditHooked = '1';
          btn.addEventListener('click', function () {
            if (window.HMIX_CREDIT_MODAL) {
              var t = _getCurrentTrack();
              window.HMIX_CREDIT_MODAL.open(_getTrackTitle(t) || 'Track');
            }
          });
        }
      } else {
        btn.removeAttribute('href');
        btn.style.opacity = '0.3';
        btn.style.pointerEvents = 'none';
      }
    });
    detailBtns.forEach(function (btn) {
      if (!btn) return;
      if (track) {
        btn.href = '/music/' + track.id + '.html';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      } else {
        btn.removeAttribute('href');
        btn.style.opacity = '0.3';
        btn.style.pointerEvents = 'none';
      }
    });
  }

  // ── 波形：Canvas 初期化 ──
  function _initWaveformCanvas() {
    var canvas = document.getElementById('pp-waveform');
    if (!canvas) return null;
    var wrap = canvas.parentElement;
    if (!wrap) return null;
    var dpr = window.devicePixelRatio || 1;
    var displayW = wrap.clientWidth;
    var displayH = wrap.clientHeight;
    if (displayW < 10) return null;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    _waveformCanvas = canvas;
    _waveformCtx = ctx;
    canvas._displayW = displayW;
    canvas._displayH = displayH;
    return canvas;
  }

  // ── 波形：AudioBuffer からダウンサンプル ──
  function _extractWaveform(audioBuffer, numBars) {
    var rawData = audioBuffer.getChannelData(0);
    var samples = rawData.length;
    var blockSize = Math.floor(samples / numBars);
    var result = new Float32Array(numBars);
    for (var i = 0; i < numBars; i++) {
      var start = i * blockSize;
      var max = 0;
      for (var j = 0; j < blockSize; j++) {
        var abs = Math.abs(rawData[start + j]);
        if (abs > max) max = abs;
      }
      result[i] = max;
    }
    return result;
  }

  // ── タイムコード詳細フォーマット (M:SS.ms) ──
  function _formatTimeDetailed(sec) {
    if (sec < 0 || !isFinite(sec)) return '0:00.00';
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
  }

  function _getEqCompSummary() {
    var isEn = _isEn();
    if (typeof _eqcSnapshot !== 'function') return isEn ? 'Original' : '原音';
    var s = _eqcSnapshot();
    if (s.bypass) return isEn ? 'Bypass' : '一時停止';
    var names = {
      asis: isEn ? 'Original' : '原音',
      voicebed: isEn ? 'Under narration' : '動画ナレ下',
      youtube: isEn ? 'YouTube polish' : 'YouTube整音',
      shortstrong: isEn ? 'Shorts punch' : 'ショート用強め',
      trailer: isEn ? 'Trailer' : 'シネマ予告',
      forward: isEn ? 'Bring quiet track forward' : '静かな曲を前へ',
      cleanlow: isEn ? 'Clean low end' : '低音すっきり'
    };
    if (s.masterPreset && names[s.masterPreset]) return names[s.masterPreset];
    var anyEq = (s.eq || []).some(function (v) { return Math.abs(v || 0) > 0.05; });
    var compOn = s.comp && (s.comp.ratio > 1.05 || Math.abs(s.comp.makeup || 0) > 0.05 || s.comp.threshold < -1);
    return (anyEq || compOn || (s.limit && s.limit.enabled)) ? (isEn ? 'Custom processing' : 'カスタム加工') : (isEn ? 'Original' : '原音');
  }

  function _updateExportPreflight(peakStateText) {
    var stateEl = document.getElementById('pp-export-check-state');
    var rangeEl = document.getElementById('pp-export-check-range');
    var fxEl = document.getElementById('pp-export-check-fx');
    var safeEl = document.getElementById('pp-export-check-safe');
    var useEl = document.getElementById('pp-export-check-use');
    var box = document.getElementById('pp-export-check');
    if (!box) return;
    var isEn = _isEn();
    var hasRange = _rangeActive && _rangeStart >= 0 && _rangeEnd > _rangeStart;
    var track = _getCurrentTrack();
    var peakEl = document.getElementById('pp-stage-peak-state');
    var state = peakStateText || (peakEl ? peakEl.textContent : 'OK') || 'OK';
    if (rangeEl) {
      rangeEl.textContent = hasRange
        ? _formatTimeDetailed(_rangeStart) + ' - ' + _formatTimeDetailed(_rangeEnd)
        : (isEn ? 'Full track' : '曲全体');
    }
    if (fxEl) fxEl.textContent = _getEqCompSummary();
    var isWarn = state === '注意' || state === 'WARN';
    if (safeEl) safeEl.textContent = state === 'CLIP' ? (isEn ? 'Clipping risk' : '音割れ注意') : (isWarn ? (isEn ? 'Peak warning' : 'ピーク注意') : (isEn ? 'Peak OK' : '音割れOK'));
    if (useEl) useEl.textContent = track ? (isEn ? 'License checked / credit optional' : '規約確認・クレジット任意') : (isEn ? 'Play a track to check' : '曲を再生して確認');
    box.classList.remove('is-warn', 'is-clip');
    if (state === 'CLIP') box.classList.add('is-clip');
    else if (isWarn) box.classList.add('is-warn');
    if (stateEl) stateEl.textContent = state === 'CLIP' ? 'CHECK' : (isWarn ? 'WATCH' : 'READY');
  }

  // ── 範囲コントロール UI 更新 (タイムコード/可視性) ──
  function _updateRangeUI() {
    _placeRangeControlsNearWaveform();
    var ctrl = document.getElementById('pp-range-controls');
    var rangeExportBtn = document.getElementById('pp-range-export');
    var hasRange = _rangeActive && _rangeStart >= 0 && _rangeEnd > _rangeStart;
    if (ctrl) {
      if (hasRange) {
        ctrl.hidden = false;
        var startEl = document.getElementById('pp-range-start');
        var endEl = document.getElementById('pp-range-end');
        var durEl = document.getElementById('pp-range-duration');
        if (startEl) startEl.textContent = _formatTimeDetailed(_rangeStart);
        if (endEl) endEl.textContent = _formatTimeDetailed(_rangeEnd);
        if (durEl) durEl.textContent = '(' + _formatTimeDetailed(_rangeEnd - _rangeStart) + ')';
        // シームレス度スコアも更新
        if (typeof _updateSeamlessScore === 'function') _updateSeamlessScore();
        if (typeof _drawSeamZoom === 'function') _drawSeamZoom();
      } else {
        ctrl.hidden = true;
      }
    }
    // 「選択範囲をWAV保存」ボタンは常時表示。範囲未選択時は disabled でツールチップで案内。
    if (rangeExportBtn) {
      rangeExportBtn.disabled = !hasRange;
      rangeExportBtn.title = hasRange
        ? '選択範囲を WAV ファイルとして保存（フェード適用）'
        : '波形をドラッグして範囲を選んでから押せます（範囲未選択）';
    }
    _updateExportPreflight();
    _syncRangeFadeUI();
    if (hasRange) _syncSelectedVideoClipFromWaveform();
  }

  // ===== ループ制作 ユーティリティ関数群 =====

  // ── ゼロクロッシング吸着（最寄りのゼロ振幅通過点に吸着）──
  // sec: 対象秒数 / windowMs: 探索範囲（±ms）
  function _snapToZeroCross(sec, windowMs) {
    if (!_audioBuffer || sec < 0) return sec;
    var sr = _audioBuffer.sampleRate;
    var w = (windowMs || 30) * 0.001;  // デフォルト ±30ms
    var ch = _audioBuffer.getChannelData(0);
    var center = Math.floor(sec * sr);
    var maxOffset = Math.floor(w * sr);
    var bestOffset = 0;
    var bestAbs = Math.abs(ch[center] || 0);
    for (var off = 1; off <= maxOffset; off++) {
      [center + off, center - off].forEach(function(p) {
        if (p < 1 || p >= ch.length) return;
        var prev = ch[p - 1];
        var cur = ch[p];
        // 符号が反転した点 = ゼロクロス
        if (prev * cur < 0 || cur === 0) {
          var d = Math.abs(p - center);
          if (d < Math.abs(bestOffset) || bestAbs > 0.001) {
            bestOffset = p - center;
            bestAbs = 0;  // ゼロクロス検出済
          }
        }
      });
      if (bestAbs === 0) break;
    }
    return Math.max(0, (center + bestOffset) / sr);
  }

  // ── シームレス度スコア計算 (0〜100, 高いほど自然) ──
  function _calculateSeamlessScore(startSec, endSec) {
    if (!_audioBuffer || startSec < 0 || endSec <= startSec) return -1;
    var sr = _audioBuffer.sampleRate;
    var ch = _audioBuffer.getChannelData(0);
    var inIdx = Math.floor(startSec * sr);
    var outIdx = Math.floor(endSec * sr);
    if (inIdx >= ch.length || outIdx >= ch.length) return -1;

    // 1. 振幅差（IN 直後と OUT 直前の絶対値差）
    var winSize = Math.min(256, Math.floor(sr * 0.01));
    var inEnergy = 0, outEnergy = 0;
    for (var i = 0; i < winSize; i++) {
      var inS = ch[inIdx + i] || 0;
      var outS = ch[outIdx - winSize + i] || 0;
      inEnergy += inS * inS;
      outEnergy += outS * outS;
    }
    inEnergy = Math.sqrt(inEnergy / winSize);
    outEnergy = Math.sqrt(outEnergy / winSize);
    var ampDiff = Math.abs(inEnergy - outEnergy);  // 0〜2 程度

    // 2. 接続点の振幅差（直接の不連続）
    var directDiff = Math.abs((ch[inIdx] || 0) - (ch[outIdx] || 0));

    // 3. 簡易スペクトル差（隣接サンプルの差分の RMS）
    var inDelta = 0, outDelta = 0;
    for (var j = 1; j < winSize; j++) {
      inDelta += Math.abs((ch[inIdx + j] || 0) - (ch[inIdx + j - 1] || 0));
      outDelta += Math.abs((ch[outIdx - winSize + j] || 0) - (ch[outIdx - winSize + j - 1] || 0));
    }
    inDelta /= winSize;
    outDelta /= winSize;
    var specDiff = Math.abs(inDelta - outDelta);

    // 合成スコア（重み付き）
    var raw = 1 - (ampDiff * 0.4 + directDiff * 0.4 + specDiff * 5);
    return Math.max(0, Math.min(100, Math.round(raw * 100)));
  }

  // ── 繋ぎ目プレビュー再生（OUT 直前 N 秒 + IN 直後 N 秒 をループ）──
  var _seamPreviewSource = null;
  function _toggleSeamPreview() {
    var btn = document.getElementById('pp-loop-seam-preview');
    if (_seamPreviewSource) {
      try { _seamPreviewSource.stop(); } catch (e) {}
      _seamPreviewSource = null;
      _loopPreviewMode = false;
      if (btn) { btn.classList.remove('is-active'); btn.textContent = '🔁 繋ぎ目プレビュー'; }
      // 通常再生再開
      var p = window.HMIX_PLAYER;
      if (p) { var a = p.getAudio(); if (a) { a.muted = false; } }
      return;
    }
    if (!_audioBuffer || !_rangeActive || _rangeStart < 0 || _rangeEnd <= _rangeStart) {
      alert('範囲を選択してください');
      return;
    }
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var sr = _audioBuffer.sampleRate;
    var preSec = 1.5; // OUT 直前
    var postSec = 1.5; // IN 直後
    var outStart = Math.max(0, Math.floor((_rangeEnd - preSec) * sr));
    var outEnd = Math.floor(_rangeEnd * sr);
    var inStart = Math.floor(_rangeStart * sr);
    var inEnd = Math.min(_audioBuffer.length, Math.floor((_rangeStart + postSec) * sr));
    var lenA = outEnd - outStart;
    var lenB = inEnd - inStart;
    var totalLen = lenA + lenB;
    var numCh = _audioBuffer.numberOfChannels;
    var seamBuf = _audioCtx.createBuffer(numCh, totalLen, sr);
    for (var c = 0; c < numCh; c++) {
      var src = _audioBuffer.getChannelData(c);
      var dst = seamBuf.getChannelData(c);
      for (var i = 0; i < lenA; i++) dst[i] = src[outStart + i];
      for (var k = 0; k < lenB; k++) dst[lenA + k] = src[inStart + k];
    }
    var src2 = _audioCtx.createBufferSource();
    src2.buffer = seamBuf;
    src2.loop = true;
    src2.connect(_audioCtx.destination);
    var p2 = window.HMIX_PLAYER;
    if (p2) { var a2 = p2.getAudio(); if (a2 && !a2.paused) a2.pause(); }
    src2.start();
    _seamPreviewSource = src2;
    _loopPreviewMode = true;
    if (btn) { btn.classList.add('is-active'); btn.textContent = '⏹ 繋ぎ目停止'; }
  }

  // ── ファイル名用の秒数フォーマット (例: 0:32 → 0m32s) ──
  function _formatSecForFile(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + 'm' + (s < 10 ? '0' : '') + s + 's';
  }

  // ── ASCII 文字列を DataView に書き込むヘルパー ──
  function _setWavStr(view, offset, str) {
    for (var i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  // ── AudioBuffer → WAV (PCM 16-bit LE) Blob ──
  // opts: { loop: {start, end}, info: {bpm, key, title, artist, comment}, listInfo: bool }
  // loop が指定されると smpl chunk + cue chunk を埋め込む（DAW/サンプラー対応）
  function _audioBufferToWav(buffer, opts) {
    opts = opts || {};
    var numCh = buffer.numberOfChannels;
    var sr = buffer.sampleRate;
    var dataLen = buffer.length * numCh * 2;

    // smpl chunk: ループポイント
    var smplBytes = null;
    if (opts.loop && opts.loop.end > opts.loop.start) {
      // smpl chunk: 36 bytes header + 24 bytes per loop = 60 bytes for 1 loop
      var smplArr = new ArrayBuffer(8 + 36 + 24);
      var smplView = new DataView(smplArr);
      _setWavStr(smplView, 0, 'smpl');
      smplView.setUint32(4, 36 + 24, true);  // chunk size (excluding 'smpl' + size)
      smplView.setUint32(8, 0, true);   // dwManufacturer
      smplView.setUint32(12, 0, true);  // dwProduct
      smplView.setUint32(16, Math.floor(1000000000 / sr), true); // dwSamplePeriod (ns)
      smplView.setUint32(20, 60, true); // MIDI unity note (C4)
      smplView.setUint32(24, 0, true);  // MIDI pitch fraction
      smplView.setUint32(28, 0, true);  // SMPTE format
      smplView.setUint32(32, 0, true);  // SMPTE offset
      smplView.setUint32(36, 1, true);  // num sample loops
      smplView.setUint32(40, 0, true);  // sampler data size
      // Loop entry (24 bytes)
      smplView.setUint32(44, 0, true);  // identifier
      smplView.setUint32(48, 0, true);  // type (0 = forward)
      smplView.setUint32(52, opts.loop.start, true);  // start sample
      smplView.setUint32(56, opts.loop.end, true);    // end sample
      smplView.setUint32(60, 0, true);  // fraction
      smplView.setUint32(64, 0, true);  // play count (0 = infinite)
      smplBytes = smplArr;
    }

    // cue chunk
    var cueBytes = null;
    if (opts.loop && opts.loop.end > opts.loop.start) {
      var cueArr = new ArrayBuffer(8 + 4 + 24 * 2);
      var cueView = new DataView(cueArr);
      _setWavStr(cueView, 0, 'cue ');
      cueView.setUint32(4, 4 + 24 * 2, true);
      cueView.setUint32(8, 2, true);  // num cue points
      // Cue 1: loop start
      cueView.setUint32(12, 1, true);
      cueView.setUint32(16, opts.loop.start, true);
      _setWavStr(cueView, 20, 'data');
      cueView.setUint32(24, 0, true);
      cueView.setUint32(28, 0, true);
      cueView.setUint32(32, opts.loop.start, true);
      // Cue 2: loop end
      cueView.setUint32(36, 2, true);
      cueView.setUint32(40, opts.loop.end, true);
      _setWavStr(cueView, 44, 'data');
      cueView.setUint32(48, 0, true);
      cueView.setUint32(52, 0, true);
      cueView.setUint32(56, opts.loop.end, true);
      cueBytes = cueArr;
    }

    // LIST INFO chunk (メタデータ: タイトル・作者・BPM 等)
    var listBytes = null;
    if (opts.info) {
      var infos = [];
      if (opts.info.title) infos.push(['INAM', opts.info.title]);
      if (opts.info.artist) infos.push(['IART', opts.info.artist]);
      if (opts.info.comment) infos.push(['ICMT', opts.info.comment]);
      if (opts.info.bpm) infos.push(['ICMT', 'BPM=' + opts.info.bpm + ' ' + (opts.info.comment || '')]);
      var infoSize = 4; // 'INFO'
      infos.forEach(function(p) {
        var len = p[1].length + 1;
        if (len % 2) len++;
        infoSize += 8 + len;
      });
      var listArr = new ArrayBuffer(8 + infoSize);
      var listView = new DataView(listArr);
      _setWavStr(listView, 0, 'LIST');
      listView.setUint32(4, infoSize, true);
      _setWavStr(listView, 8, 'INFO');
      var off = 12;
      infos.forEach(function(p) {
        _setWavStr(listView, off, p[0]);
        var s = p[1] + '\0';
        if (s.length % 2) s += '\0';
        listView.setUint32(off + 4, s.length, true);
        for (var k = 0; k < s.length; k++) listView.setUint8(off + 8 + k, s.charCodeAt(k));
        off += 8 + s.length;
      });
      listBytes = listArr;
    }

    var extraLen = (smplBytes ? smplBytes.byteLength : 0) +
                   (cueBytes ? cueBytes.byteLength : 0) +
                   (listBytes ? listBytes.byteLength : 0);
    var fileLen = 44 + dataLen + extraLen;
    var arr = new ArrayBuffer(fileLen);
    var view = new DataView(arr);
    _setWavStr(view, 0, 'RIFF');
    view.setUint32(4, fileLen - 8, true);
    _setWavStr(view, 8, 'WAVE');
    _setWavStr(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * numCh * 2, true);
    view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true);
    _setWavStr(view, 36, 'data');
    view.setUint32(40, dataLen, true);
    var offset = 44;
    var chData = [];
    for (var c = 0; c < numCh; c++) chData.push(buffer.getChannelData(c));
    for (var i = 0; i < buffer.length; i++) {
      for (var c2 = 0; c2 < numCh; c2++) {
        var s = Math.max(-1, Math.min(1, chData[c2][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    // 追加チャンクをコピー
    var dst = new Uint8Array(arr);
    if (smplBytes) { dst.set(new Uint8Array(smplBytes), offset); offset += smplBytes.byteLength; }
    if (cueBytes) { dst.set(new Uint8Array(cueBytes), offset); offset += cueBytes.byteLength; }
    if (listBytes) { dst.set(new Uint8Array(listBytes), offset); offset += listBytes.byteLength; }
    return new Blob([arr], { type: 'audio/wav' });
  }

  // ── 範囲を WAV としてエクスポート（フェード適用済） ──
  function _eqcShouldRenderForExport() {
    if (_eqcBypass) return false;
    if (_eqcBands.some(function (b) { return Math.abs(b.gain) > 0.05; })) return true;
    if (_eqcComp.ratio > 1.05 || _eqcComp.threshold < -0.05 || Math.abs(_eqcComp.makeup) > 0.05) return true;
    return !!(_eqcLimit && _eqcLimit.enabled);
  }

  function _eqcNormalizeToCeiling(buffer, ceilingDb) {
    var ceiling = Math.pow(10, (typeof ceilingDb === 'number' ? ceilingDb : -1) / 20);
    var peak = 0;
    for (var c = 0; c < buffer.numberOfChannels; c++) {
      var data = buffer.getChannelData(c);
      for (var i = 0; i < data.length; i++) {
        var a = Math.abs(data[i]);
        if (a > peak) peak = a;
      }
    }
    if (peak <= ceiling || peak <= 0) return buffer;
    var gain = ceiling / peak;
    for (var c2 = 0; c2 < buffer.numberOfChannels; c2++) {
      var data2 = buffer.getChannelData(c2);
      for (var j = 0; j < data2.length; j++) data2[j] *= gain;
    }
    return buffer;
  }

  function _eqcBufferPeakDb(buffer) {
    var peak = 0;
    for (var c = 0; c < buffer.numberOfChannels; c++) {
      var data = buffer.getChannelData(c);
      for (var i = 0; i < data.length; i++) {
        var a = Math.abs(data[i]);
        if (a > peak) peak = a;
      }
    }
    return peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  }

  function _eqcRenderBufferForExport(sourceBuffer) {
    if (!_eqcShouldRenderForExport()) return Promise.resolve(sourceBuffer);
    var OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineCtx) {
      console.warn('[eqcomp] OfflineAudioContext is not available; exporting source audio.');
      return Promise.resolve(sourceBuffer);
    }

    var offline = new OfflineCtx(sourceBuffer.numberOfChannels, sourceBuffer.length, sourceBuffer.sampleRate);
    var source = offline.createBufferSource();
    source.buffer = sourceBuffer;

    var node = source;
    _eqcBands.forEach(function (b) {
      var f = offline.createBiquadFilter();
      f.type = b.type;
      f.frequency.value = b.freq;
      f.Q.value = b.q;
      f.gain.value = b.gain;
      node.connect(f);
      node = f;
    });

    var comp = offline.createDynamicsCompressor();
    comp.threshold.value = _eqcComp.threshold;
    comp.ratio.value = _eqcComp.ratio;
    comp.attack.value = _eqcComp.attack / 1000;
    comp.release.value = _eqcComp.release / 1000;
    comp.knee.value = 18;
    node.connect(comp);
    node = comp;

    var makeup = offline.createGain();
    makeup.gain.value = Math.pow(10, _eqcComp.makeup / 20);
    node.connect(makeup);
    node = makeup;

    if (_eqcLimit && _eqcLimit.enabled) {
      var limiter = offline.createDynamicsCompressor();
      limiter.threshold.value = _eqcLimit.threshold;
      limiter.knee.value = 0;
      limiter.ratio.value = _eqcLimit.ratio;
      limiter.attack.value = _eqcLimit.attack / 1000;
      limiter.release.value = _eqcLimit.release / 1000;
      node.connect(limiter);
      node = limiter;
    }

    node.connect(offline.destination);
    source.start(0);
    return offline.startRendering().then(function (rendered) {
      _eqcNormalizeToCeiling(rendered, (_eqcLimit && _eqcLimit.enabled) ? _eqcLimit.ceiling : -1);
      return rendered;
    });
  }

  function _exportRangeAsWav() {
    if (!_rangeActive || _rangeStart < 0 || _rangeEnd <= _rangeStart) {
      alert('範囲を選択してください（波形をドラッグ）');
      return;
    }
    var track = _getCurrentTrack();
    if (!track || !track.mp3) { alert('楽曲データがありません'); return; }

    var btn = document.getElementById('pp-range-export');
    var origLabel = btn ? btn.textContent : '';
    if (btn) { btn.textContent = '⏳ 書き出し中...'; btn.disabled = true; }

    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    fetch(track.mp3)
      .then(function(res) { return res.arrayBuffer(); })
      .then(function(buf) { return _audioCtx.decodeAudioData(buf); })
      .then(function(audioBuffer) { return _eqcRenderBufferForExport(audioBuffer); })
      .then(function(audioBuffer) {
        var sr = audioBuffer.sampleRate;
        var startSample = Math.max(0, Math.floor(_rangeStart * sr));
        var endSample = Math.min(audioBuffer.length, Math.floor(_rangeEnd * sr));
        var len = endSample - startSample;
        if (len <= 0) throw new Error('範囲が無効です');
        var numCh = audioBuffer.numberOfChannels;
        var fadeInSamples = Math.min(Math.floor(_fadeInSec * sr), Math.floor(len / 2));
        var fadeOutSamples = Math.min(Math.floor(_fadeOutSec * sr), Math.floor(len / 2));

        var sliced = _audioCtx.createBuffer(numCh, len, sr);
        for (var c = 0; c < numCh; c++) {
          var src = audioBuffer.getChannelData(c);
          var dst = sliced.getChannelData(c);
          for (var i = 0; i < len; i++) {
            var s = src[startSample + i];
            if (fadeInSamples > 0 && i < fadeInSamples) s *= (i / fadeInSamples);
            if (fadeOutSamples > 0 && i >= len - fadeOutSamples) s *= ((len - i) / fadeOutSamples);
            dst[i] = s;
          }
        }

        var blob = _audioBufferToWav(sliced);
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = track.id + '_' + _formatSecForFile(_rangeStart) + '-' + _formatSecForFile(_rangeEnd) + '.wav';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        if (btn) { btn.textContent = '✓ 完了'; setTimeout(function(){ btn.textContent = origLabel; btn.disabled = false; }, 1500); }
      })
      .catch(function(err) {
        console.error('[wav export]', err);
        alert('WAV エクスポートに失敗しました: ' + err.message);
        if (btn) { btn.textContent = origLabel; btn.disabled = false; }
      });
  }

  // ── 曲全体を WAV で書き出し (常時有効) ──
  function _exportFullWav() {
    var track = _getCurrentTrack();
    if (!track || !track.mp3) { alert('楽曲データがありません'); return; }

    var btn = document.getElementById('pp-export-full-wav');
    var labelSpan = btn ? btn.querySelector('span') : null;
    var origLabel = labelSpan ? labelSpan.textContent : '';
    if (labelSpan) labelSpan.textContent = '書き出し中...';
    if (btn) btn.disabled = true;

    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // 既に AudioBuffer がデコード済みなら再利用
    var bufPromise;
    if (_audioBuffer && _audioBufferTrackId === track.id) {
      bufPromise = Promise.resolve(_audioBuffer);
    } else {
      bufPromise = fetch(track.mp3)
        .then(function(res) { return res.arrayBuffer(); })
        .then(function(buf) { return _audioCtx.decodeAudioData(buf); });
    }

    bufPromise
      .then(function(audioBuffer) { return _eqcRenderBufferForExport(audioBuffer); })
      .then(function(audioBuffer) {
        var blob = _audioBufferToWav(audioBuffer);
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = track.id + '.wav';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        if (labelSpan) {
          labelSpan.textContent = '✓ 完了';
          setTimeout(function(){ labelSpan.textContent = origLabel; if (btn) btn.disabled = false; }, 1500);
        } else if (btn) {
          btn.disabled = false;
        }
      })
      .catch(function(err) {
        console.error('[wav export full]', err);
        alert('WAV書き出しに失敗しました: ' + err.message);
        if (labelSpan) labelSpan.textContent = origLabel;
        if (btn) btn.disabled = false;
      });
  }

  // ── ループ用 WAV エクスポート（smpl chunk + ループタイプ + クロスフェード）──
  function _exportRangeAsLoopWav() {
    if (!_rangeActive || _rangeStart < 0 || _rangeEnd <= _rangeStart) {
      alert('範囲を選択してください'); return;
    }
    if (!_audioBuffer) { alert('音源データの読み込み待ちです。少ししてから再試行してください'); return; }
    var track = _getCurrentTrack();
    var btn = document.getElementById('pp-range-export-loop');
    var origLabel = btn ? btn.textContent : '';
    if (btn) { btn.textContent = '⏳ 書き出し中...'; btn.disabled = true; }
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    _eqcRenderBufferForExport(_audioBuffer).then(function(exportBuffer) {
      try {
        var sr = exportBuffer.sampleRate;
        var startSample = Math.max(0, Math.floor(_rangeStart * sr));
        var endSample = Math.min(exportBuffer.length, Math.floor(_rangeEnd * sr));
        var len = endSample - startSample;
        if (len <= 0) throw new Error('範囲が無効');
        var numCh = exportBuffer.numberOfChannels;
        var crossfadeSamples = Math.min(Math.floor(_crossfadeMs * 0.001 * sr), Math.floor(len / 4));
        var sliced;

        if (_loopType === 'pingpong') {
          var totalLen = len * 2 - 1;
          sliced = _audioCtx.createBuffer(numCh, totalLen, sr);
          for (var c = 0; c < numCh; c++) {
            var src = exportBuffer.getChannelData(c);
            var dst = sliced.getChannelData(c);
            for (var i = 0; i < len; i++) dst[i] = src[startSample + i];
            for (var j = 0; j < len - 1; j++) dst[len + j] = src[endSample - 2 - j];
          }
        } else if (_loopType === 'reverse') {
          sliced = _audioCtx.createBuffer(numCh, len, sr);
          for (var c2 = 0; c2 < numCh; c2++) {
            var src2 = exportBuffer.getChannelData(c2);
            var dst2 = sliced.getChannelData(c2);
            for (var i2 = 0; i2 < len; i2++) dst2[i2] = src2[endSample - 1 - i2];
          }
        } else {
          sliced = _audioCtx.createBuffer(numCh, len, sr);
          for (var c3 = 0; c3 < numCh; c3++) {
            var src3 = exportBuffer.getChannelData(c3);
            var dst3 = sliced.getChannelData(c3);
            for (var i3 = 0; i3 < len; i3++) dst3[i3] = src3[startSample + i3];
          }
        }

        // クロスフェード（forward のみ意味あり：末尾と先頭をブレンド）
        if (crossfadeSamples > 0 && _loopType === 'forward') {
          for (var c4 = 0; c4 < numCh; c4++) {
            var dst4 = sliced.getChannelData(c4);
            for (var k = 0; k < crossfadeSamples; k++) {
              var t = k / crossfadeSamples;
              var headGain = Math.cos((1 - t) * Math.PI / 2);
              var tailGain = Math.cos(t * Math.PI / 2);
              var blendIdx = sliced.length - crossfadeSamples + k;
              dst4[blendIdx] = dst4[blendIdx] * tailGain + dst4[k] * headGain;
            }
          }
        }

        var bpmIn = document.getElementById('pp-bpm-input');
        var bpmVal = bpmIn && bpmIn.value ? parseInt(bpmIn.value) : 0;
        _eqcNormalizeToCeiling(sliced, -1);
        var blob = _audioBufferToWav(sliced, {
          loop: { start: 0, end: sliced.length - 1 },
          info: {
            title: track ? (track.title_en || track.title) + ' (Loop)' : 'Loop',
            artist: 'Hirokazu Akiyama',
            comment: 'H/MIX GALLERY loop, type=' + _loopType + (bpmVal ? ', BPM=' + bpmVal : '') + (_crossfadeMs ? ', crossfade=' + _crossfadeMs + 'ms' : ''),
            bpm: bpmVal
          }
        });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (track ? track.id : 'loop') + '_loop_' + _loopType + '_' + _formatSecForFile(_rangeStart) + '-' + _formatSecForFile(_rangeEnd) + '.wav';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        if (btn) { btn.textContent = '✓ 完了'; setTimeout(function(){ btn.textContent = origLabel; btn.disabled = false; }, 1500); }
      } catch (err) {
        console.error('[loop wav]', err);
        alert('ループ WAV エクスポート失敗: ' + err.message);
        if (btn) { btn.textContent = origLabel; btn.disabled = false; }
      }
    }).catch(function(err) {
      console.error('[loop wav render]', err);
      alert('Loop WAV export failed: ' + err.message);
      if (btn) { btn.textContent = origLabel; btn.disabled = false; }
    });
  }

  // ── 繋ぎ目拡大表示（OUT 直前 + IN 直後 を高解像度で並列描画）──
  function _drawSeamZoom() {
    var canvas = document.getElementById('pp-seam-zoom-canvas');
    if (!canvas || !_audioBuffer || !_rangeActive) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    var sr = _audioBuffer.sampleRate;
    var ch = _audioBuffer.getChannelData(0);
    var winSamples = Math.floor(0.05 * sr); // ±50ms
    var outIdx = Math.floor(_rangeEnd * sr);
    var inIdx = Math.floor(_rangeStart * sr);
    var halfW = w / 2;
    // 中央仕切り線
    ctx.strokeStyle = 'rgba(255, 220, 130, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(halfW, 0); ctx.lineTo(halfW, h); ctx.stroke();
    // ラベル
    ctx.fillStyle = 'rgba(220, 200, 150, 0.55)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('OUT 直前', 4, 11);
    ctx.textAlign = 'right';
    ctx.fillText('IN 直後', w - 4, 11);
    // 0 ライン
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    // OUT 直前を左半分に描画
    ctx.strokeStyle = 'rgba(255, 180, 160, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (var i = 0; i < winSamples; i++) {
      var idx = outIdx - winSamples + i;
      if (idx < 0 || idx >= ch.length) continue;
      var x = (i / winSamples) * halfW;
      var y = h/2 - ch[idx] * (h/2) * 0.9;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // IN 直後を右半分に描画
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.85)';
    ctx.beginPath();
    for (var j = 0; j < winSamples; j++) {
      var idx2 = inIdx + j;
      if (idx2 < 0 || idx2 >= ch.length) continue;
      var x2 = halfW + (j / winSamples) * halfW;
      var y2 = h/2 - ch[idx2] * (h/2) * 0.9;
      if (j === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  }

  // ── Intro/Loop/Outro リージョン設定 ──
  function _setRegion(name) {
    if (!_rangeActive || _rangeStart < 0 || _rangeEnd <= _rangeStart) {
      alert('範囲を選択してから登録してください'); return;
    }
    if (!_loopRegions) _loopRegions = {};
    _loopRegions[name] = { start: _rangeStart, end: _rangeEnd };
    _updateRegionButtons();
  }
  function _clearRegions() {
    _loopRegions = null;
    _updateRegionButtons();
  }
  function _updateRegionButtons() {
    var ids = { intro: 'pp-set-intro', loop: 'pp-set-loop', outro: 'pp-set-outro' };
    Object.keys(ids).forEach(function(k) {
      var b = document.getElementById(ids[k]);
      if (!b) return;
      if (_loopRegions && _loopRegions[k]) {
        b.classList.add('is-set');
        var dur = _loopRegions[k].end - _loopRegions[k].start;
        b.title = (k === 'intro' ? 'Intro' : k === 'loop' ? 'Loop' : 'Outro') + ': ' + _formatTimeDetailed(_loopRegions[k].start) + '〜' + _formatTimeDetailed(_loopRegions[k].end) + ' (' + dur.toFixed(1) + 's)';
      } else {
        b.classList.remove('is-set');
      }
    });
    // テイル ZIP ボタンの有効/無効
    var zipBtn = document.getElementById('pp-export-tail-zip');
    if (zipBtn) {
      var canZip = _loopRegions && _loopRegions.loop && _loopRegions.outro;
      zipBtn.disabled = !canZip;
      zipBtn.style.opacity = canZip ? '1' : '0.4';
    }
  }

  // ── テイル ZIP（Loop + Outro を WAV として ZIP 同梱）──
  // JSZip を CDN から動的読み込み
  function _loadJSZip(callback) {
    if (window.JSZip) { callback(window.JSZip); return; }
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = function() { callback(window.JSZip); };
    script.onerror = function() { alert('JSZip の読み込みに失敗しました'); };
    document.head.appendChild(script);
  }

  function _exportTailZip() {
    if (!_loopRegions || !_loopRegions.loop || !_loopRegions.outro) {
      alert('Loop と Outro 両方を登録してください'); return;
    }
    if (!_audioBuffer) { alert('音源データの読み込み待ちです'); return; }
    var btn = document.getElementById('pp-export-tail-zip');
    var origLabel = btn ? btn.textContent : '';
    if (btn) { btn.textContent = '⏳ ZIP 生成中...'; btn.disabled = true; }
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    _loadJSZip(function(JSZip) {
      _eqcRenderBufferForExport(_audioBuffer).then(function(exportBuffer) {
      try {
        var sr = exportBuffer.sampleRate;
        var numCh = exportBuffer.numberOfChannels;
        var track = _getCurrentTrack();
        var trackId = track ? track.id : 'track';

        function makeBuf(region) {
          var ss = Math.floor(region.start * sr);
          var ee = Math.floor(region.end * sr);
          var len = ee - ss;
          var buf = _audioCtx.createBuffer(numCh, len, sr);
          for (var c = 0; c < numCh; c++) {
            var src = exportBuffer.getChannelData(c);
            var dst = buf.getChannelData(c);
            for (var i = 0; i < len; i++) dst[i] = src[ss + i];
          }
          return buf;
        }

        var loopBuf = makeBuf(_loopRegions.loop);
        var outroBuf = makeBuf(_loopRegions.outro);
        _eqcNormalizeToCeiling(loopBuf, -1);
        _eqcNormalizeToCeiling(outroBuf, -1);
        var loopBlob = _audioBufferToWav(loopBuf, {
          loop: { start: 0, end: loopBuf.length - 1 },
          info: { title: trackId + ' Loop', artist: 'Hirokazu Akiyama', comment: 'H/MIX GALLERY loop body' }
        });
        var outroBlob = _audioBufferToWav(outroBuf, {
          info: { title: trackId + ' Outro', artist: 'Hirokazu Akiyama', comment: 'H/MIX GALLERY outro / tail-out' }
        });

        var introBlob = null;
        if (_loopRegions.intro) {
          var introBuf = makeBuf(_loopRegions.intro);
          _eqcNormalizeToCeiling(introBuf, -1);
          introBlob = _audioBufferToWav(introBuf, {
            info: { title: trackId + ' Intro', artist: 'Hirokazu Akiyama', comment: 'H/MIX GALLERY intro' }
          });
        }

        var readme = '# ' + trackId + ' — Loop / Outro pack\n\n' +
          'H/MIX GALLERY (composer: Hirokazu Akiyama / 秋山裕和) よりお届けするループ素材パックです。\n\n' +
          '## 同梱ファイル\n\n' +
          (introBlob ? '- `' + trackId + '_intro.wav` — イントロ部分\n' : '') +
          '- `' + trackId + '_loop.wav` — メインループ本体（smpl chunk 付き、DAW/FMOD/Unity で自動ループ再生）\n' +
          '- `' + trackId + '_outro.wav` — ループ離脱用テイル / アウトロ\n\n' +
          '## ゲームエンジンでの使い方\n\n' +
          '### FMOD Studio\n' +
          'ループ用 WAV を Asset として読み込み、Audio Track にドロップ → smpl chunk から自動でループ点が読み取られます。\n\n' +
          '### Unity\n' +
          'AudioClip としてインポート、AudioSource の `Loop` を有効化。Loop ファイルが終わるタイミングで Outro ファイルを再生する遷移を組むと自然な離脱になります。\n\n' +
          '### Unreal MetaSound\n' +
          'WAV をインポート → MetaSound でループ再生ノードに接続。\n\n' +
          '## ライセンス\n\n' +
          'H/MIX GALLERY 利用規約に従ってください: https://www.hmix.net/terms.html\n';

        var zip = new JSZip();
        if (introBlob) zip.file(trackId + '_intro.wav', introBlob);
        zip.file(trackId + '_loop.wav', loopBlob);
        zip.file(trackId + '_outro.wav', outroBlob);
        zip.file('README.md', readme);

        zip.generateAsync({ type: 'blob' }).then(function(blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = trackId + '_loop_outro_pack.zip';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
          if (btn) { btn.textContent = '✓ 完了'; setTimeout(function(){ btn.textContent = origLabel; btn.disabled = false; }, 1500); }
        });
      } catch (err) {
        console.error('[tail zip]', err);
        alert('ZIP 生成失敗: ' + err.message);
        if (btn) { btn.textContent = origLabel; btn.disabled = false; }
      }
      }).catch(function(err) {
        console.error('[tail zip render]', err);
        alert('ZIP export failed: ' + err.message);
        if (btn) { btn.textContent = origLabel; btn.disabled = false; }
      });
    });
  }

  // ── 自動ループ点検出（簡易自己類似度ピーク検出）──
  var _autoLoopCandidates = null;
  function _autoDetectLoopPoints() {
    if (!_audioBuffer) { alert('音源データの読み込み待ちです'); return; }
    var btn = document.getElementById('pp-auto-detect');
    var statusEl = document.getElementById('pp-auto-loop-status');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 解析中...'; }
    if (statusEl) statusEl.textContent = '';

    setTimeout(function() {
      try {
        var sr = _audioBuffer.sampleRate;
        var ch = _audioBuffer.getChannelData(0);
        var dur = _audioBuffer.duration;
        // 0.5秒単位で特徴量（RMS + ZCR）を計算
        var step = Math.floor(0.5 * sr);
        var blocks = Math.floor(ch.length / step);
        var feats = [];
        for (var b = 0; b < blocks; b++) {
          var sum = 0, zc = 0;
          for (var i = 0; i < step; i++) {
            var s = ch[b * step + i] || 0;
            sum += s * s;
            if (i > 0 && (ch[b * step + i - 1] || 0) * s < 0) zc++;
          }
          feats.push({ rms: Math.sqrt(sum / step), zcr: zc / step });
        }
        // 自己類似度行列の上位ペア（時間距離 5秒以上、類似度上位）
        var candidates = [];
        var minGap = Math.floor(5 / 0.5); // 5秒以上離れたペア
        for (var p = 0; p < blocks - minGap; p++) {
          for (var q = p + minGap; q < blocks; q++) {
            var rmsD = Math.abs(feats[p].rms - feats[q].rms);
            var zcrD = Math.abs(feats[p].zcr - feats[q].zcr);
            var sim = 1 - (rmsD * 2 + zcrD * 50);
            if (sim > 0.85) {
              candidates.push({
                start: p * 0.5,
                end: q * 0.5,
                similarity: Math.round(sim * 100)
              });
            }
          }
        }
        // 類似度順にソート、上位 5
        candidates.sort(function(a, b) { return b.similarity - a.similarity; });
        candidates = candidates.slice(0, 5);
        _autoLoopCandidates = candidates;
        // 結果表示
        if (statusEl) {
          if (candidates.length === 0) {
            statusEl.textContent = '候補が見つかりませんでした';
          } else {
            statusEl.innerHTML = '';
            candidates.forEach(function(c, idx) {
              var b2 = document.createElement('button');
              b2.className = 'pp-auto-loop-candidate';
              b2.textContent = '候補' + (idx + 1) + ' ' + _formatTimeDetailed(c.start) + '→' + _formatTimeDetailed(c.end) + ' (' + c.similarity + '%)';
              b2.addEventListener('click', function() {
                _rangeStart = c.start;
                _rangeEnd = c.end;
                _rangeActive = true;
                if (_zeroCrossSnap) {
                  _rangeStart = _snapToZeroCross(_rangeStart, 50);
                  _rangeEnd = _snapToZeroCross(_rangeEnd, 50);
                }
                _updateRangeUI();
                _updateRangeStatus && _updateRangeStatus();
              });
              statusEl.appendChild(b2);
            });
          }
        }
        if (btn) { btn.disabled = false; btn.textContent = '🤖 ループ点 自動検出'; }
      } catch (err) {
        console.error('[auto loop]', err);
        if (statusEl) statusEl.textContent = '解析失敗: ' + err.message;
        if (btn) { btn.disabled = false; btn.textContent = '🤖 ループ点 自動検出'; }
      }
    }, 100);
  }

  // ── シームレス度スコア表示更新 ──
  function _updateSeamlessScore() {
    var fillEl = document.getElementById('pp-seamless-fill');
    var scoreEl = document.getElementById('pp-seamless-score');
    if (!fillEl || !scoreEl) return;
    if (!_rangeActive || _rangeStart < 0 || _rangeEnd <= _rangeStart || !_audioBuffer) {
      fillEl.style.width = '0%';
      scoreEl.textContent = '—';
      return;
    }
    var score = _calculateSeamlessScore(_rangeStart, _rangeEnd);
    if (score >= 0) {
      fillEl.style.width = score + '%';
      scoreEl.textContent = score + '/100';
      var color = score < 50 ? '#e07070' : score < 75 ? '#e0c070' : '#70d090';
      fillEl.style.background = color;
    }
  }

  // ── メモから時刻 (⏱ M:SS) と範囲 (↔ M:SS〜M:SS) を抽出して波形マーカーに ──
  function _refreshMemoMarkers() {
    var textEl = document.getElementById('memo-text');
    if (!textEl) { _memoMarkers = []; return; }
    var text = textEl.value || '';
    var markers = [];
    var lines = text.split('\n');
    var rangeRe = /↔\s*(\d+):(\d{2})\s*[-–〜~]\s*(\d+):(\d{2})/;
    var timeRe = /⏱\s*(\d+):(\d{2})/;
    lines.forEach(function(line) {
      var label = line.trim().substr(0, 60);
      var rm = rangeRe.exec(line);
      if (rm) {
        var s = parseInt(rm[1])*60 + parseInt(rm[2]);
        var e = parseInt(rm[3])*60 + parseInt(rm[4]);
        if (e > s) markers.push({ type: 'range', start: s, end: e, label: label });
      } else {
        var tm = timeRe.exec(line);
        if (tm) {
          var t = parseInt(tm[1])*60 + parseInt(tm[2]);
          markers.push({ type: 'time', sec: t, label: label });
        }
      }
    });
    _memoMarkers = markers;
  }

  // ── 波形：描画 ──
  function _drawWaveform() {
    if (!_waveformCanvas || !_waveformData || !_waveformCtx) return;
    var w = _waveformCanvas._displayW;
    var h = _waveformCanvas._displayH;
    var ctx = _waveformCtx;
    var barW = 3;
    var gap = 1.5;
    var step = barW + gap;
    var numBars = Math.floor(w / step);
    var radius = 1.5;

    ctx.clearRect(0, 0, w, h);

    var player = window.HMIX_PLAYER;
    var audioEl = player ? player.getAudio() : null;
    var waveDuration = _getWaveformTimelineDuration();
    var currentRatio = 0;
    var rangeEndRatio = 0;
    if (audioEl && waveDuration > 0 && isFinite(audioEl.currentTime)) {
      currentRatio = Math.max(0, Math.min(1, audioEl.currentTime / waveDuration));
    }
    var activeBtn = _panel ? _panel.querySelector('.pp-duration-btn.is-active') : null;
    if (activeBtn && waveDuration > 0) {
      var sec = parseInt(activeBtn.dataset.sec);
      if (sec > 0) rangeEndRatio = Math.min(sec / waveDuration, 1);
    }

    // 再生位置のグローライン
    if (currentRatio > 0 && currentRatio < 1) {
      var cx = currentRatio * w;
      var grad = ctx.createLinearGradient(cx - 8, 0, cx + 8, 0);
      grad.addColorStop(0, 'rgba(126, 203, 149, 0)');
      grad.addColorStop(0.5, 'rgba(126, 203, 149, 0.15)');
      grad.addColorStop(1, 'rgba(126, 203, 149, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - 8, 0, 16, h);
    }

    for (var i = 0; i < numBars && i < _waveformData.length; i++) {
      var x = i * step;
      var barH = Math.max(2, _waveformData[i] * h * 0.88);
      var y = (h - barH) / 2;
      var ratio = i / numBars;

      if (ratio <= currentRatio) {
        ctx.fillStyle = 'rgba(126, 203, 149, 0.90)';
      } else if (rangeEndRatio > 0 && ratio <= rangeEndRatio) {
        ctx.fillStyle = 'rgba(126, 203, 149, 0.25)';
      } else {
        ctx.fillStyle = 'rgba(180, 210, 195, 0.12)';
      }

      // 角丸バー
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barW - radius, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
      ctx.lineTo(x + barW, y + barH - radius);
      ctx.quadraticCurveTo(x + barW, y + barH, x + barW - radius, y + barH);
      ctx.lineTo(x + radius, y + barH);
      ctx.quadraticCurveTo(x, y + barH, x, y + barH - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();
    }

    // 区間リピート範囲ハイライト（確定後）
    if (_rangeActive && _rangeStart >= 0 && _rangeEnd > _rangeStart && waveDuration > 0) {
      var rs = (_rangeStart / waveDuration) * w;
      var re = (_rangeEnd / waveDuration) * w;
      // 範囲外を暗く
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, rs, h);
      ctx.fillRect(re, 0, w - re, h);
      // 範囲内ハイライト
      ctx.fillStyle = 'rgba(200, 170, 80, 0.16)';
      ctx.fillRect(rs, 0, re - rs, h);
      // 開始・終了マーカー（太め）
      ctx.fillStyle = 'rgba(220, 190, 100, 0.95)';
      ctx.fillRect(rs - 1, 0, 2, h);
      ctx.fillRect(re - 1, 0, 2, h);
      // 端のハンドル（三角形）
      ctx.fillStyle = 'rgba(220, 190, 100, 1)';
      ctx.beginPath();
      ctx.moveTo(rs, h * 0.35); ctx.lineTo(rs - 6, h * 0.5); ctx.lineTo(rs, h * 0.65);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(re, h * 0.35); ctx.lineTo(re + 6, h * 0.5); ctx.lineTo(re, h * 0.65);
      ctx.closePath(); ctx.fill();

      // フェードイン/アウトのカーブ視覚化
      var pxPerSec = w / waveDuration;
      // フェードイン（範囲先頭から fadeInSec 秒分、上向き三角）
      if (_fadeInSec > 0) {
        var inEnd = Math.min(rs + _fadeInSec * pxPerSec, re);
        ctx.fillStyle = 'rgba(160, 220, 255, 0.18)';
        ctx.beginPath();
        ctx.moveTo(rs, h);
        ctx.lineTo(inEnd, 0);
        ctx.lineTo(rs, 0);
        ctx.closePath(); ctx.fill();
        // 斜めライン (太め+グロー: ドラッグ可をアピール)
        ctx.strokeStyle = 'rgba(180, 230, 255, 0.95)';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = 'rgba(160, 220, 255, 0.5)';
        ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.moveTo(rs, h); ctx.lineTo(inEnd, 0); ctx.stroke();
        ctx.shadowBlur = 0;
        // ハンドル（大きめの丸 + リング）
        ctx.fillStyle = 'rgba(200, 240, 255, 1)';
        ctx.beginPath(); ctx.arc(inEnd, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // フェードアウト（範囲終端から fadeOutSec 秒前から、下向き三角）
      if (_fadeOutSec > 0) {
        var outStart = Math.max(re - _fadeOutSec * pxPerSec, rs);
        ctx.fillStyle = 'rgba(255, 180, 160, 0.18)';
        ctx.beginPath();
        ctx.moveTo(re, h);
        ctx.lineTo(outStart, 0);
        ctx.lineTo(re, 0);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 200, 180, 0.95)';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = 'rgba(255, 180, 160, 0.5)';
        ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.moveTo(re, h); ctx.lineTo(outStart, 0); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 215, 195, 1)';
        ctx.beginPath(); ctx.arc(outStart, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // ドラッグ中のプレビュー（"してる感" を強化）
    if (_rangeDragging && _rangeDragVisualMode === 'new' && _rangeStart >= 0 && _dragCurrentSec >= 0 && waveDuration > 0) {
      var ds = (_rangeStart / waveDuration) * w;
      var de = (_dragCurrentSec / waveDuration) * w;
      var dxLeft = Math.min(ds, de);
      var dxRight = Math.max(ds, de);
      // ドラッグ範囲を黄色半透明で塗る（リアルタイムフィードバック）
      ctx.fillStyle = 'rgba(255, 200, 90, 0.28)';
      ctx.fillRect(dxLeft, 0, dxRight - dxLeft, h);
      // 開始位置と現在位置の縦線（太め）
      ctx.fillStyle = 'rgba(255, 220, 130, 0.95)';
      ctx.fillRect(ds - 1, 0, 2, h);
      ctx.fillRect(de - 1, 0, 2, h);
      // marching-ants 風の点線エフェクト（端）
      var dashOffset = (Date.now() / 80) % 8;
      ctx.strokeStyle = 'rgba(255, 240, 180, 0.85)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -dashOffset;
      ctx.beginPath(); ctx.moveTo(dxLeft, 0); ctx.lineTo(dxLeft, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dxRight, 0); ctx.lineTo(dxRight, h); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }

    // ホバー時の縦ガイドライン + 時刻ツールチップ位置（ドラッグ中でない時）
    if (!_rangeDragging && _hoverSec >= 0 && waveDuration > 0) {
      var hx = (_hoverSec / waveDuration) * w;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, h); ctx.stroke();
    }

    // 尺ガイドライン（15s / 30s / 60s）
    if (waveDuration > 0) {
      var guides = [15, 30, 60];
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      for (var g = 0; g < guides.length; g++) {
        var gSec = guides[g];
        if (gSec >= waveDuration) continue;
        var gx = (gSec / waveDuration) * w;
        ctx.strokeStyle = 'rgba(200, 180, 120, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(200, 180, 120, 0.45)';
        ctx.fillText(gSec + 's', gx, 9);
      }
    }

    // セクションマーカー（手動登録のサビのみ）
    if (_sections && waveDuration > 0) {
      ctx.font = '9px sans-serif';
      for (var si = 0; si < _sections.length; si++) {
        var sec2 = _sections[si];
        var sx = (sec2.start / waveDuration) * w;
        // 範囲がある場合は半透明帯
        if (sec2.end != null && sec2.end > sec2.start) {
          var sxe = (sec2.end / waveDuration) * w;
          ctx.fillStyle = 'rgba(220, 100, 180, 0.10)';
          ctx.fillRect(sx, 0, sxe - sx, h);
        }
        // マーカーライン（点線）
        ctx.strokeStyle = 'rgba(220, 100, 180, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, h); ctx.stroke();
        ctx.setLineDash([]);
        // ラベル（上部）
        ctx.fillStyle = 'rgba(255, 180, 220, 0.95)';
        ctx.textAlign = 'left';
        ctx.fillText(sec2.label, sx + 3, 11);
      }
    }

    // Intro/Loop/Outro リージョン描画（手動登録）
    if (_loopRegions && waveDuration > 0) {
      var regionStyles = {
        intro: { fill: 'rgba(120, 180, 230, 0.10)', line: 'rgba(140, 200, 240, 0.7)', label: 'Intro' },
        loop:  { fill: 'rgba(220, 190, 100, 0.10)', line: 'rgba(255, 220, 130, 0.85)', label: 'Loop' },
        outro: { fill: 'rgba(230, 130, 130, 0.10)', line: 'rgba(255, 160, 140, 0.85)', label: 'Outro' }
      };
      ctx.font = 'bold 9px sans-serif';
      ['intro','loop','outro'].forEach(function(k) {
        var r = _loopRegions[k];
        if (!r) return;
        var st = regionStyles[k];
        var rx1 = (r.start / waveDuration) * w;
        var rx2 = (r.end / waveDuration) * w;
        ctx.fillStyle = st.fill;
        ctx.fillRect(rx1, h * 0.05, rx2 - rx1, h * 0.18);
        ctx.fillStyle = st.line;
        ctx.fillRect(rx1 - 0.5, h * 0.05, 1, h * 0.18);
        ctx.fillRect(rx2 - 0.5, h * 0.05, 1, h * 0.18);
        ctx.textAlign = 'left';
        ctx.fillText(st.label, rx1 + 3, h * 0.05 + 11);
      });
    }

    // メモ連動マーカー（位置/範囲）
    if (_memoMarkers && _memoMarkers.length > 0 && waveDuration > 0) {
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      for (var mki = 0; mki < _memoMarkers.length; mki++) {
        var mk = _memoMarkers[mki];
        if (mk.type === 'range' && mk.start < waveDuration) {
          var rxa = (mk.start / waveDuration) * w;
          var rxb = (Math.min(mk.end, waveDuration) / waveDuration) * w;
          // メモ範囲は波形下部に細い帯
          ctx.fillStyle = 'rgba(120, 180, 230, 0.16)';
          ctx.fillRect(rxa, h * 0.78, rxb - rxa, h * 0.22);
          ctx.fillStyle = 'rgba(140, 200, 240, 0.85)';
          ctx.fillRect(rxa - 0.5, h * 0.78, 1, h * 0.22);
          ctx.fillRect(rxb - 0.5, h * 0.78, 1, h * 0.22);
          // ラベル（先頭部分のみ表示）
          var lblR = mk.label.replace(/↔\s*\d+:\d+\s*[-–〜~]\s*\d+:\d+\s*/g, '').trim().substr(0, 14);
          if (lblR) {
            ctx.fillStyle = 'rgba(180, 220, 255, 0.92)';
            ctx.fillText(lblR, rxa + 3, h - 3);
          }
        } else if (mk.type === 'time' && mk.sec < waveDuration) {
          var tx = (mk.sec / waveDuration) * w;
          // 三角マーカー（上向き、下端固定）
          ctx.fillStyle = 'rgba(140, 200, 240, 0.95)';
          ctx.beginPath();
          ctx.moveTo(tx - 5, h);
          ctx.lineTo(tx + 5, h);
          ctx.lineTo(tx, h - 7);
          ctx.closePath(); ctx.fill();
          // 細い縦線（下半分のみ）
          ctx.strokeStyle = 'rgba(140, 200, 240, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(tx, h * 0.6); ctx.lineTo(tx, h - 7); ctx.stroke();
          // ラベル
          var lblT = mk.label.replace(/⏱\s*\d+:\d+\s*/g, '').trim().substr(0, 14);
          if (lblT) {
            ctx.fillStyle = 'rgba(180, 220, 255, 0.85)';
            ctx.fillText(lblT, tx + 6, h - 8);
          }
        }
      }
    }

    // 再生位置の縦カーソル
    if (currentRatio > 0 && currentRatio < 1) {
      var cx2 = currentRatio * w;
      ctx.fillStyle = 'rgba(154, 223, 180, 0.80)';
      ctx.fillRect(cx2 - 0.5, 0, 1, h);
    }
  }

  // ── 波形：アニメーションループ ──
  function _startWaveformAnim() {
    _stopWaveformAnim();
    function loop() {
      _drawWaveform();
      _animFrameId = requestAnimationFrame(loop);
    }
    _animFrameId = requestAnimationFrame(loop);
  }

  function _stopWaveformAnim() {
    if (_animFrameId) { cancelAnimationFrame(_animFrameId); _animFrameId = null; }
  }

  // ── 波形：曲の波形データをロード ──
  function _loadWaveform() {
    var track = _getCurrentTrack();
    if (!track) return;
    _syncPersistentRangeWithCurrentTrack();
    if (track.id === _waveformTrackId && _waveformData) return;
    // 曲が変わった: 区間リピート選択・ループマーカーをリセット (前の曲の選択を引きずらない)
    if (_waveformTrackId && track.id !== _waveformTrackId) {
      _syncPersistentRangeWithCurrentTrack();
      if (typeof _loopRegions !== 'undefined') _loopRegions = {};
      if (typeof _updateRangeUI === 'function') _updateRangeUI();
      if (typeof _updateRangeStatus === 'function') {
        try { _updateRangeStatus(); } catch (e) {}
      }
    }
	    _waveformTrackId = track.id;
	    if (!_rangeTrackId) _rangeTrackId = track.id;
	    _waveformData = null;

    if (!_waveformCanvas) _initWaveformCanvas();
    if (!_waveformCanvas) return;

    // ローディング表示
    var ctx = _waveformCtx;
    var w = _waveformCanvas._displayW;
    var h = _waveformCanvas._displayH;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading waveform…', w / 2, h / 2 + 4);

    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    var barW = 2, gap = 1, step = barW + gap;
    var numBars = Math.floor(w / step);

    fetch(track.mp3)
      .then(function (res) { return res.arrayBuffer(); })
      .then(function (buf) { return _audioCtx.decodeAudioData(buf); })
      .then(function (audioBuffer) {
        if (_waveformTrackId !== track.id) return;
        _waveformData = _extractWaveform(audioBuffer, numBars);
        // ループ制作機能用に AudioBuffer を保持（ゼロクロス検出・WAV エクスポート・解析用）
        _audioBuffer = audioBuffer;
        _audioBufferTrackId = track.id;
        // 手動 climax 登録があればサビとして表示。自動検出 (Intro/Main/Climax/Outro) は廃止
        if (track.climax && track.climax.start != null) {
          _sections = [{ label: 'サビ', start: track.climax.start, end: track.climax.end }];
        } else {
          _sections = null;
        }
        _refreshMemoMarkers();
        if (_panel && _panel.classList.contains('is-open')) {
          _startWaveformAnim();
        }
      })
      .catch(function (err) {
        console.warn('[waveform] load failed:', err.message);
        _waveformData = null;
        if (_waveformCanvas && _waveformCtx) {
          _waveformCtx.clearRect(0, 0, w, h);
        }
      });
  }

  // ── セクション自動検出（波形の音量変化から推定）──
  var _sections = null;

  function _detectSections(waveData, duration) {
    if (!waveData || waveData.length < 20 || !duration) return null;
    var len = waveData.length;
    // 10分割して各ブロックの平均音量を計算
    var blocks = 10;
    var blockSize = Math.floor(len / blocks);
    var avgs = [];
    for (var i = 0; i < blocks; i++) {
      var sum = 0;
      for (var j = 0; j < blockSize; j++) sum += waveData[i * blockSize + j];
      avgs.push(sum / blockSize);
    }
    var maxAvg = Math.max.apply(null, avgs);
    if (maxAvg < 0.01) return null;

    // 正規化
    var norm = avgs.map(function (v) { return v / maxAvg; });

    var sections = [];
    // Intro: 最初の静かな部分
    sections.push({ label: 'Intro', start: 0 });

    // Main: 最初に音量が50%以上になる位置
    for (var m = 1; m < blocks; m++) {
      if (norm[m] > 0.5 && norm[m] > norm[m - 1] * 1.3) {
        sections.push({ label: 'Main', start: (m / blocks) * duration });
        break;
      }
    }

    // Climax: 最大音量の位置
    var climaxIdx = norm.indexOf(Math.max.apply(null, norm));
    if (climaxIdx > 1 && climaxIdx < blocks - 1) {
      var climaxSec = (climaxIdx / blocks) * duration;
      if (!sections.some(function (s) { return Math.abs(s.start - climaxSec) < duration * 0.1; })) {
        sections.push({ label: 'Climax', start: climaxSec });
      }
    }

    // Outro: 最後に音量が下がり始める位置
    for (var o = blocks - 2; o > climaxIdx; o--) {
      if (norm[o] < 0.4 && norm[o] < norm[o - 1] * 0.7) {
        sections.push({ label: 'Outro', start: (o / blocks) * duration });
        break;
      }
    }

    sections.sort(function (a, b) { return a.start - b.start; });
    return sections.length > 1 ? sections : null;
  }

  // ── GA4 ──
  function _ga(event, params) {
    if (typeof gtag === 'function') {
      gtag('event', event, params || {});
    }
  }

  // ── 初期化 ──
  function init() {
    if (_initialized) return;
    _initialized = true;

    // ── キーボードショートカット (パネルが開いている時のみ動作) ──
    document.addEventListener('keydown', function(e) {
      if (!_panel || !_panel.classList.contains('is-open')) return;
      var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
      var p = window.HMIX_PLAYER;
      if (!p) return;
      var a = p.getAudio();
      if (!a) return;

      // Space: 再生/停止 (Shift+Space: 範囲先頭から再生)
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey && _rangeActive && _rangeStart >= 0 && _rangeEnd > _rangeStart) {
          _seekWaveformManually(_rangeStart, true);
          if (a.paused) a.play().catch(function(){});
        } else {
          if (a.paused) a.play().catch(function(){}); else a.pause();
        }
        return;
      }
      // J: 範囲先頭ジャンプ / K: 範囲終了直前ジャンプ
      if ((e.key === 'j' || e.key === 'J') && _rangeActive && _rangeStart >= 0) {
        e.preventDefault(); _seekWaveformManually(_rangeStart, false); return;
      }
      if ((e.key === 'k' || e.key === 'K') && _rangeActive && _rangeEnd > 0) {
        e.preventDefault(); _seekWaveformManually(Math.max(0, _rangeEnd - 0.1), false); return;
      }
      // Esc: 範囲解除
      if (e.key === 'Escape' && _rangeActive) {
        e.preventDefault();
        _forgetCurrentRangeForTrack();
        _rangeActive = false; _rangeStart = -1; _rangeEnd = -1;
        if (_rangeCheckInterval) { clearInterval(_rangeCheckInterval); _rangeCheckInterval = null; }
        _updateRangeUI();
        var statusEl = document.getElementById('pp-duration-status');
        if (statusEl) statusEl.textContent = '';
        return;
      }
      // Home/End
      if (e.key === 'Home') { e.preventDefault(); _seekWaveformManually(0, false); return; }
      if (e.key === 'End') {
        e.preventDefault();
        var endDuration = _getWaveformTimelineDuration();
        if (endDuration) _seekWaveformManually(Math.max(0, endDuration - 0.1), false);
        return;
      }
      // ←/→: 1秒、Shift+←/→: 5秒
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        p.seek(Math.max(0, a.currentTime - (e.shiftKey ? 5 : 1)));
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        var arrowDuration = _getWaveformTimelineDuration();
        var arrowNext = a.currentTime + (e.shiftKey ? 5 : 1);
        p.seek(arrowDuration ? Math.min(arrowDuration, arrowNext) : arrowNext);
        return;
      }
    });

    var player = document.getElementById('global-player');
    if (!player) return;
    _installGlobalPlayerLockNotice(player);

    // パネル挿入
    _panel = _buildPanel();
    player.parentNode.insertBefore(_panel, player);
    _markToolboxV2AndVideoBeta();
    _placeRangeControlsNearWaveform();
    _initVideoWorkbench();
    _installVideoTrackSwitchGuard();
    _syncVideoToolAvailability();
    window.addEventListener('resize', _syncVideoToolAvailability);
    var videoLaunch = document.getElementById('pp-video-launch');
    if (videoLaunch) videoLaunch.addEventListener('click', _showVideoWorkbenchFromPanel);

    // トグルボタンをプレイヤーに追加
    var playerRight = player.querySelector('.player-right');
    if (playerRight) {
      _toggleBtn = document.createElement('button');
      _toggleBtn.className = 'player-tool-btn';
      _toggleBtn.id = 'player-tool-btn';
      _toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span data-ja="ツール" data-en="Tools">ツール</span>';
      _applyToggleLang();

      // volume-wrapの前に挿入
      var volWrap = playerRight.querySelector('.volume-wrap');
      if (volWrap) playerRight.insertBefore(_toggleBtn, volWrap);
      else playerRight.appendChild(_toggleBtn);
    }

    // トグル
    if (_toggleBtn) {
      _toggleBtn.addEventListener('click', function () {
        var isOpen = _panel.classList.toggle('is-open');
        _toggleBtn.classList.toggle('is-open', isOpen);
        _applyToggleLang();
        _syncVideoWorkbenchMode();
        if (isOpen) {
          _updateCreditTab();
          _updateShareTab();
          // 波形：尺タブがアクティブなら開始
          var activeTab = _panel.querySelector('.player-panel__tab.is-active');
          if (activeTab && activeTab.dataset.tab === 'duration') {
            setTimeout(function() {
              if (!_waveformCanvas || _waveformCanvas._displayW < 10) _initWaveformCanvas();
              _loadWaveform();
              _startWaveformAnim();
            }, 150);
          }
          _ga('tool_panel_open');
        } else {
          // パネル閉じ時：尺プリセットのタイマーをクリア + 波形アニメ停止 + 区間リピート解除
          _clearPreset();
          _stopWaveformAnim();
          _rangeActive = false; _rangeStart = -1; _rangeEnd = -1;
          if (_rangeCheckInterval) { clearInterval(_rangeCheckInterval); _rangeCheckInterval = null; }
          if (_activeDurationBtn) {
            _activeDurationBtn.classList.remove('is-active');
            _activeDurationBtn = null;
          }
          var statusEl = document.getElementById('pp-duration-status');
          if (statusEl) statusEl.textContent = '';
        }
      });
    }

    // タブ切り替え
    _panel.querySelectorAll('.player-panel__tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        if (tab.dataset.tab === 'video' && _isVideoToolBlockedForMobile()) {
          _showVideoMobileBlockedNotice();
          _syncVideoToolAvailability();
          return;
        }
        _panel.querySelectorAll('.player-panel__tab').forEach(function (t) { t.classList.remove('is-active'); });
        _panel.querySelectorAll('.player-panel__content').forEach(function (c) { c.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var target = document.getElementById('pp-tab-' + tab.dataset.tab);
        if (target) target.classList.add('is-active');
        if (tab.dataset.tab === 'credit') _updateCreditTab();
        if (tab.dataset.tab === 'share') _updateShareTab();
        if (tab.dataset.tab === 'video') _setVideoWorkbenchDisplayMode('max');
        if (tab.dataset.tab === 'eqcomp') _activateEqComp();
        if (tab.dataset.tab === 'duration') {
          // 尺タブがアクティブになったらCanvas初期化+波形ロード
          setTimeout(function() {
            if (!_waveformCanvas || _waveformCanvas._displayW < 10) {
              _initWaveformCanvas();
            }
            _loadWaveform();
            _updateExportPreflight();
            _startWaveformAnim();
            // クリックイベント（1回だけ）
            if (_waveformCanvas && !_waveformCanvas._clickHooked) {
              _waveformCanvas._clickHooked = true;

              var _dragStartX = -1;
              var _dragMoved = false;
              var _dragMode = ''; // 'new' | 'start' | 'end'
              var _rangeFading = false;
              var _rangeMoveOffset = 0;

              function _getSecFromEvent(e, rect) {
                var duration = _getWaveformTimelineDuration();
                if (!duration || !rect || !rect.width) return -1;
                var point = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
                var clientX = point.clientX;
                var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                return ratio * duration;
              }

              function _getClientX(e) {
                var point = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
                return point.clientX;
              }

              function _formatSec(s) {
                if (!isFinite(s) || s < 0) return '0:00';
                var m = Math.floor(s / 60), ss = Math.floor(s % 60);
                return m + ':' + (ss < 10 ? '0' : '') + ss;
              }

              function _updateRangeStatus() {
                var statusEl = document.getElementById('pp-duration-status');
                if (!statusEl) return;
	                if (_rangeActive) {
	                  statusEl.textContent = _formatSec(_rangeStart) + ' 〜 ' + _formatSec(_rangeEnd) +
	                    ' 区間リピート中（範囲内ドラッグで横移動 / クリックで再生位置 / 端ドラッグで調整）';
	                  _rememberCurrentRangeForTrack(_rangeTrackId || _waveformTrackId);
	                } else {
                  statusEl.textContent = '';
                }
              }

              function _moveRangeKeepingWidth(sec) {
                if (!_rangeActive || _savedRangeStart < 0 || _savedRangeEnd <= _savedRangeStart) return;
                var duration = _getWaveformTimelineDuration();
                if (!duration || sec < 0) return;
                var width = _savedRangeEnd - _savedRangeStart;
                var nextStart = sec - _rangeMoveOffset;
                nextStart = Math.max(0, Math.min(duration - width, nextStart));
                _rangeStart = nextStart;
                _rangeEnd = nextStart + width;
              }

              function _startRangeLoop() {
                _rangeActive = true;
                _rangeFading = false;
                var player = window.HMIX_PLAYER;
                if (player) {
                  _seekWaveformManually(_rangeStart, false);
                  var audioEl = player.getAudio();
                  if (audioEl) {
                    _applyRangeFadeIn(audioEl);
                    if (audioEl.paused) audioEl.play().catch(function(){});
                  }
                }
                _updateRangeStatus();
                _updateRangeUI();

                if (_rangeCheckInterval) clearInterval(_rangeCheckInterval);
                _rangeCheckInterval = setInterval(function() {
                  if (!_rangeActive) { clearInterval(_rangeCheckInterval); _rangeCheckInterval = null; return; }
                  var p = window.HMIX_PLAYER;
                  if (!p) return;
                  var a = p.getAudio();
                  if (!a) return;

                  // フェード処理
                  // 注: _fadeSec ではなくモジュール直の _fadeOutSec を参照
                  // (旧コードは _fadeSec ローカル変数で、ドラッグ更新が反映されなかった)
                  var fadeD = _fadeOutSec || 0;
                  if (fadeD > 0 && !_rangeFading) {
                    var timeLeft = _rangeEnd - a.currentTime;
                    if (timeLeft <= fadeD && timeLeft > 0) {
                      _rangeFading = true;
                      var volEl = document.getElementById('player-volume');
                      var origVol = volEl ? parseInt(volEl.value) / 100 : 0.8;
                      var fadeStep = 50;
                      var volDec = origVol / (fadeD * 1000 / fadeStep);
                      var fadeInt = setInterval(function() {
                        if (!_rangeActive || a.currentTime < _rangeStart) {
                          clearInterval(fadeInt);
                          a.volume = origVol;
                          _rangeFading = false;
                          return;
                        }
                        if (a.volume - volDec > 0.01) {
                          a.volume -= volDec;
                        } else {
                          clearInterval(fadeInt);
                          // 折り返し: seek 後に fade-in を再適用
                          p.seek(_rangeStart);
                          _applyRangeFadeIn(a);
                          _rangeFading = false;
                        }
                      }, fadeStep);
                    }
                  } else if (fadeD === 0 && a.currentTime >= _rangeEnd) {
                    // フェード無しで折り返し: ここでも fade-in があれば再適用
                    p.seek(_rangeStart);
                    _applyRangeFadeIn(a);
                  }
                }, 80);
              }

              // フェードイン適用 (毎ループ・初回両方で使う)
              function _applyRangeFadeIn(audioEl) {
                if (!audioEl) return;
                var volElIn = document.getElementById('player-volume');
                var targetIn = volElIn ? parseInt(volElIn.value) / 100 : 0.8;
                if (_fadeInSec <= 0) {
                  audioEl.volume = targetIn;
                  return;
                }
                audioEl.volume = 0;
                var stepMs = 50;
                var stepsIn = Math.max(1, Math.floor(_fadeInSec * 1000 / stepMs));
                var incIn = targetIn / stepsIn;
                var cntIn = 0;
                var fadeInInt = setInterval(function() {
                  if (!_rangeActive) { clearInterval(fadeInInt); audioEl.volume = targetIn; return; }
                  cntIn++;
                  audioEl.volume = Math.min(targetIn, audioEl.volume + incIn);
                  if (cntIn >= stepsIn) { clearInterval(fadeInInt); audioEl.volume = targetIn; }
                }, stepMs);
              }

              function _stopRange() {
                _forgetCurrentRangeForTrack();
                _rangeActive = false;
                _rangeStart = -1;
                _rangeEnd = -1;
                _dragCurrentSec = -1;
                _rangeDragVisualMode = '';
                _rangeFading = false;
                if (_rangeCheckInterval) { clearInterval(_rangeCheckInterval); _rangeCheckInterval = null; }
                _updateRangeStatus();
                _updateRangeUI();
                // 音量を復元
                var player = window.HMIX_PLAYER;
                if (player) {
                  var a = player.getAudio();
                  var volEl = document.getElementById('player-volume');
                  if (a && volEl) a.volume = parseInt(volEl.value) / 100;
                }
              }

              // 端のドラッグ判定（マーカーの±8px以内）
              function _hitTestEdge(sec, rect) {
                if (!_rangeActive) return '';
                var duration = _getWaveformTimelineDuration();
                if (!duration) return '';
                var pxPerSec = rect.width / duration;
                var startPx = _rangeStart * pxPerSec;
                var endPx = _rangeEnd * pxPerSec;
                var secPx = sec * pxPerSec;
                if (Math.abs(secPx - startPx) < 10) return 'start';
                if (Math.abs(secPx - endPx) < 10) return 'end';
                return '';
              }

              // フェードハンドルのヒットテスト
              // 検出対象: (1) 上端の丸ハンドル / (2) 斜めライン本体 / (3) フェード三角形の内側
              // 「斜めバーをドラッグして調整」直感に合わせて広めに取る。
              function _hitTestFadeHandle(e, rect) {
                if (!_rangeActive || _rangeStart < 0 || _rangeEnd <= _rangeStart) return '';
                var duration = _getWaveformTimelineDuration();
                if (!duration) return '';
                var point = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
                var clientX = point.clientX;
                var clientY = point.clientY;
                var localX = clientX - rect.left;
                var localY = clientY - rect.top;
                var h = rect.height;
                var pxPerSec = rect.width / duration;
                var rsX = _rangeStart * pxPerSec;
                var reX = _rangeEnd * pxPerSec;

                // 範囲端 (rsX/reX) の 8px 以内は edge ドラッグを優先(フェード判定から除外)
                var nearStartEdge = Math.abs(localX - rsX) < 8;
                var nearEndEdge   = Math.abs(localX - reX) < 8;

                // フェード三角形が細すぎると掴めないため、最小ヒット幅を確保 (HIT_MIN)
                var HIT_MIN = 30;

                // フェードイン: 三角形 (rsX, h) → (rsX, 0) → (inEnd, 0)
                if (_fadeInSec > 0 && !nearStartEdge) {
                  var inEnd = rsX + _fadeInSec * pxPerSec;
                  var fiHitEnd = Math.max(inEnd, rsX + HIT_MIN);
                  // 上端ハンドル
                  if (localY <= 14 && Math.abs(localX - inEnd) < 14) return 'fadein';
                  // 拡張ヒット: 範囲先頭から fiHitEnd まで, 上端寄り (上半分) なら fadein
                  if (localX >= rsX + 6 && localX <= fiHitEnd + 4 && localY < h * 0.7) return 'fadein';
                }

                // フェードアウト: 三角形 (outStart, 0) → (reX, 0) → (reX, h)
                if (_fadeOutSec > 0 && !nearEndEdge) {
                  var outStart = reX - _fadeOutSec * pxPerSec;
                  var foHitStart = Math.min(outStart, reX - HIT_MIN);
                  if (localY <= 14 && Math.abs(localX - outStart) < 14) return 'fadeout';
                  // 拡張ヒット: foHitStart 〜 範囲終端の手前, 上端寄り (上半分) なら fadeout
                  if (localX >= foHitStart - 4 && localX <= reX - 6 && localY < h * 0.7) return 'fadeout';
                }
                return '';
              }

              // フェード時間が変わったらプリセットボタンの is-active を同期
              function _syncFadePresetUI() {
                _panel.querySelectorAll('.pp-fadein-btn').forEach(function(b) {
                  var v = parseFloat(b.dataset.fadein);
                  b.classList.toggle('is-active', Math.abs(v - _fadeInSec) < 0.05);
                });
                _panel.querySelectorAll('.pp-fade-btn').forEach(function(b) {
                  var v = parseInt(b.dataset.fade);
                  b.classList.toggle('is-active', Math.abs(v - _fadeOutSec) < 0.1);
                });
              }

              // マウスカーソル：フェードハンドル / 範囲端 / それ以外
              _waveformCanvas.addEventListener('mousemove', function(e) {
                if (_rangeDragging) return;
                var rect = _waveformCanvas.getBoundingClientRect();
                var fadeHit = _hitTestFadeHandle(e, rect);
                if (fadeHit) {
                  _waveformCanvas.style.cursor = 'ew-resize';
                  _waveformCanvas.title = fadeHit === 'fadein'
                    ? 'フェードイン: ' + _fadeInSec.toFixed(1) + 's（ドラッグで調整）'
                    : 'フェードアウト: ' + _fadeOutSec.toFixed(1) + 's（ドラッグで調整）';
                  return;
                }
                var sec = _getSecFromEvent(e, rect);
                var edge = _hitTestEdge(sec, rect);
                if (edge) {
                  _waveformCanvas.style.cursor = 'col-resize';
                  _waveformCanvas.title = '端をドラッグして範囲を調整';
                } else if (_rangeActive && sec >= _rangeStart && sec <= _rangeEnd) {
                  _waveformCanvas.style.cursor = 'grab';
                  _waveformCanvas.title = '範囲をドラッグして長さそのまま横移動 / クリックで再生位置';
                } else {
                  _waveformCanvas.style.cursor = 'pointer';
                  _waveformCanvas.title = '';
                }
              });

              var _savedRangeStart = -1;
              var _savedRangeEnd = -1;

              _waveformCanvas.addEventListener('mousedown', function(e) {
                _dragStartX = _getClientX(e);
                _dragMoved = false;
                var rect = _waveformCanvas.getBoundingClientRect();
                var sec = _getSecFromEvent(e, rect);

                // 区間リピート中の値を保存
                _savedRangeStart = _rangeStart;
                _savedRangeEnd = _rangeEnd;

                // フェードハンドル優先判定
                var fadeHit = _hitTestFadeHandle(e, rect);
                if (fadeHit) {
                  _dragMode = fadeHit;  // 'fadein' or 'fadeout'
                  _rangeDragVisualMode = fadeHit;
                  _rangeDragging = true;
                  e.preventDefault();
                  return;
                }

                var edge = _hitTestEdge(sec, rect);
                if (edge) {
                  _dragMode = edge;
                } else if (_rangeActive && sec >= _rangeStart && sec <= _rangeEnd) {
                  _dragMode = 'move-range';
                  _rangeMoveOffset = sec - _rangeStart;
                  _waveformCanvas.style.cursor = 'grabbing';
                } else {
                  _dragMode = 'new';
                  _rangeStart = sec;
                }
                _rangeDragVisualMode = _dragMode;
                _rangeDragging = true;
              });

              document.addEventListener('mousemove', function(e) {
                if (!_rangeDragging) return;
                if (Math.abs(_getClientX(e) - _dragStartX) > 5) _dragMoved = true;
                var rect = _waveformCanvas.getBoundingClientRect();
                var sec = _getSecFromEvent(e, rect);
                _dragCurrentSec = sec;  // ドラッグ中のリアルタイム位置（描画用）
                if (_dragMoved && _dragMode !== 'new') {
                  if (sec < 0) return;
                  // 端をドラッグ
                  if (_dragMode === 'start') {
                    _rangeStart = Math.min(sec, _rangeEnd - 0.5);
                  } else if (_dragMode === 'end') {
                    _rangeEnd = Math.max(sec, _rangeStart + 0.5);
                  } else if (_dragMode === 'move-range') {
                    _moveRangeKeepingWidth(sec);
                    _waveformCanvas.style.cursor = 'grabbing';
                  } else if (_dragMode === 'fadein') {
                    // フェードイン端ドラッグ：先頭からのオフセット
                    var maxFade = (_rangeEnd - _rangeStart) / 2;
                    _fadeInSec = Math.max(0, Math.min(sec - _rangeStart, maxFade));
                    _syncFadePresetUI();
                    _waveformCanvas.title = 'フェードイン: ' + _fadeInSec.toFixed(1) + 's';
                  } else if (_dragMode === 'fadeout') {
                    var maxFade2 = (_rangeEnd - _rangeStart) / 2;
                    _fadeOutSec = Math.max(0, Math.min(_rangeEnd - sec, maxFade2));
                    _syncFadePresetUI();
                    _waveformCanvas.title = 'フェードアウト: ' + _fadeOutSec.toFixed(1) + 's';
                  }
                  _updateRangeStatus();
                  if (typeof _updateRangeUI === 'function') _updateRangeUI();
                }
              });

              document.addEventListener('mouseup', function(e) {
                if (!_rangeDragging) return;
                _rangeDragging = false;
                _dragCurrentSec = -1;  // ドラッグ終了でリセット
                _rangeDragVisualMode = '';
                var rect = _waveformCanvas.getBoundingClientRect();
                var endSec = _getSecFromEvent(e, rect);

                // フェードハンドルのドラッグ完了
                if (_dragMode === 'fadein' || _dragMode === 'fadeout') {
                  _dragMode = '';
                  _waveformCanvas.title = '';
                  return;
                }

                // 端のドラッグ完了
                if (_dragMode === 'start' || _dragMode === 'end') {
                  if (_dragMoved && _rangeEnd - _rangeStart >= 0.5) {
                    // 端を動かした → ループ継続、位置だけ更新
                    _updateRangeStatus();
                  }
                  _dragMode = '';
                  return;
                }

                if (_dragMode === 'move-range') {
                  if (!_dragMoved) {
                    _rangeStart = _savedRangeStart;
                    _rangeEnd = _savedRangeEnd;
                    var clickSec = _getSecFromEvent(e, rect);
                    var player = window.HMIX_PLAYER;
                    if (player) {
                      _rangeFading = false;
                      var audioEl = player.getAudio();
                      var volEl = document.getElementById('player-volume');
                      if (audioEl && volEl) audioEl.volume = parseInt(volEl.value) / 100;
                      _seekWaveformManually(clickSec, true);
                    }
                  } else {
                    _updateRangeStatus();
                    if (typeof _updateRangeUI === 'function') _updateRangeUI();
                  }
                  _dragMode = '';
                  _waveformCanvas.style.cursor = 'grab';
                  return;
                }

                // 新規ドラッグ or クリック
                if (!_dragMoved) {
                  if (_dragMode === 'seek-in-range') {
                    // 区間内クリック → その位置から再生（範囲は完全に維持）
                    _rangeStart = _savedRangeStart;
                    _rangeEnd = _savedRangeEnd;
                    var clickSec = _getSecFromEvent(e, rect);
                    var player = window.HMIX_PLAYER;
                    if (player) {
                      _rangeFading = false;
                      var audioEl = player.getAudio();
                      var volEl = document.getElementById('player-volume');
                      if (audioEl && volEl) audioEl.volume = parseInt(volEl.value) / 100;
                      _seekWaveformManually(clickSec, true);
                    }
                  } else if (_rangeActive) {
                    // 区間外クリック → 解除
                    _stopRange();
                  } else {
                    // 通常シーク
                    var player = window.HMIX_PLAYER;
                    if (player) {
                      _seekWaveformManually(_rangeStart, true);
                      var audioEl = player.getAudio();
                      if (audioEl && audioEl.paused) audioEl.play().catch(function(){});
                    }
                    _rangeStart = -1;
                  }
                  _dragMode = '';
                  return;
                }

                // ドラッグ完了 → 区間リピート開始
                if (endSec < _rangeStart) { var tmp = _rangeStart; _rangeStart = endSec; endSec = tmp; }
                if (endSec - _rangeStart < 1) { _rangeStart = -1; _dragMode = ''; return; }
                _rangeEnd = endSec;
                // ゼロクロス吸着（クリックノイズ防止）
                if (_zeroCrossSnap && _audioBuffer) {
                  _rangeStart = _snapToZeroCross(_rangeStart, 30);
                  _rangeEnd = _snapToZeroCross(_rangeEnd, 30);
                }
	                _startRangeLoop();
	                _rememberRangeForTrackId(_rangeTrackId || _waveformTrackId);
	                _dragMode = '';
              });

              // タッチ操作: モバイルでもマウスと同じ範囲選択フローに通す
              _waveformCanvas.addEventListener('touchstart', function(e) {
                if (!e.touches || e.touches.length !== 1) return;
                _dragStartX = _getClientX(e);
                _dragMoved = false;
                var rect = _waveformCanvas.getBoundingClientRect();
                var sec = _getSecFromEvent(e, rect);
                if (sec < 0) return;

                _savedRangeStart = _rangeStart;
                _savedRangeEnd = _rangeEnd;

                var fadeHit = _hitTestFadeHandle(e, rect);
                if (fadeHit) {
                  _dragMode = fadeHit;
                } else {
                  var edge = _hitTestEdge(sec, rect);
                  if (edge) {
                    _dragMode = edge;
                  } else if (_rangeActive && sec >= _rangeStart && sec <= _rangeEnd) {
                    _dragMode = 'move-range';
                    _rangeMoveOffset = sec - _rangeStart;
                  } else {
                    _dragMode = 'new';
                    _rangeStart = sec;
                  }
                }
                _rangeDragVisualMode = _dragMode;
                _rangeDragging = true;
                e.preventDefault();
              }, { passive: false });

              document.addEventListener('touchmove', function(e) {
                if (!_rangeDragging) return;
                if (!e.touches || e.touches.length !== 1) return;
                if (Math.abs(_getClientX(e) - _dragStartX) > 5) _dragMoved = true;
                var rect = _waveformCanvas.getBoundingClientRect();
                var sec = _getSecFromEvent(e, rect);
                _dragCurrentSec = sec;
                if (_dragMoved && _dragMode !== 'new') {
                  if (sec < 0) return;
                  if (_dragMode === 'start') {
                    _rangeStart = Math.min(sec, _rangeEnd - 0.5);
                  } else if (_dragMode === 'end') {
                    _rangeEnd = Math.max(sec, _rangeStart + 0.5);
                  } else if (_dragMode === 'move-range') {
                    _moveRangeKeepingWidth(sec);
                  } else if (_dragMode === 'fadein') {
                    var maxFade = (_rangeEnd - _rangeStart) / 2;
                    _fadeInSec = Math.max(0, Math.min(sec - _rangeStart, maxFade));
                    _syncFadePresetUI();
                  } else if (_dragMode === 'fadeout') {
                    var maxFade2 = (_rangeEnd - _rangeStart) / 2;
                    _fadeOutSec = Math.max(0, Math.min(_rangeEnd - sec, maxFade2));
                    _syncFadePresetUI();
                  }
                  _updateRangeStatus();
                  if (typeof _updateRangeUI === 'function') _updateRangeUI();
                }
                e.preventDefault();
              }, { passive: false });

              document.addEventListener('touchend', function(e) {
                if (!_rangeDragging) return;
                _rangeDragging = false;
                _dragCurrentSec = -1;
                _rangeDragVisualMode = '';
                var rect = _waveformCanvas.getBoundingClientRect();
                var endSec = _getSecFromEvent(e, rect);

                if (_dragMode === 'fadein' || _dragMode === 'fadeout') {
                  _dragMode = '';
                  return;
                }

                if (_dragMode === 'start' || _dragMode === 'end') {
                  if (_dragMoved && _rangeEnd - _rangeStart >= 0.5) _updateRangeStatus();
                  _dragMode = '';
                  return;
                }

                if (_dragMode === 'move-range') {
                  if (!_dragMoved) {
                    _rangeStart = _savedRangeStart;
                    _rangeEnd = _savedRangeEnd;
                    var clickSec = _getSecFromEvent(e, rect);
                    var player = window.HMIX_PLAYER;
                    if (player) {
                      _rangeFading = false;
                      var audioEl = player.getAudio();
                      var volEl = document.getElementById('player-volume');
                      if (audioEl && volEl) audioEl.volume = parseInt(volEl.value) / 100;
                      _seekWaveformManually(clickSec, true);
                    }
                  } else {
                    _updateRangeStatus();
                    if (typeof _updateRangeUI === 'function') _updateRangeUI();
                  }
                  _dragMode = '';
                  e.preventDefault();
                  return;
                }

                if (!_dragMoved) {
                  if (_dragMode === 'seek-in-range') {
                    _rangeStart = _savedRangeStart;
                    _rangeEnd = _savedRangeEnd;
                    var clickSec = _getSecFromEvent(e, rect);
                    var player = window.HMIX_PLAYER;
                    if (player) {
                      _rangeFading = false;
                      var audioEl = player.getAudio();
                      var volEl = document.getElementById('player-volume');
                      if (audioEl && volEl) audioEl.volume = parseInt(volEl.value) / 100;
                      _seekWaveformManually(clickSec, true);
                    }
                  } else if (_rangeActive) {
                    _stopRange();
                  } else {
                    var player2 = window.HMIX_PLAYER;
                    if (player2) {
                      _seekWaveformManually(_rangeStart, true);
                      var audioEl2 = player2.getAudio();
                      if (audioEl2 && audioEl2.paused) audioEl2.play().catch(function(){});
                    }
                    _rangeStart = -1;
                  }
                  _dragMode = '';
                  return;
                }

                if (endSec < _rangeStart) { var tmp = _rangeStart; _rangeStart = endSec; endSec = tmp; }
                if (endSec - _rangeStart < 1) { _rangeStart = -1; _dragMode = ''; return; }
                _rangeEnd = endSec;
                if (_zeroCrossSnap && _audioBuffer) {
                  _rangeStart = _snapToZeroCross(_rangeStart, 30);
                  _rangeEnd = _snapToZeroCross(_rangeEnd, 30);
                }
	                _startRangeLoop();
	                _rememberRangeForTrackId(_rangeTrackId || _waveformTrackId);
	                _dragMode = '';
                e.preventDefault();
              }, { passive: false });
              // 時間ツールチップ + ホバー縦ガイドライン
              var tooltip = document.getElementById('pp-waveform-tooltip');
              _waveformCanvas.addEventListener('mousemove', function(e) {
                var player = window.HMIX_PLAYER;
                if (!player || !tooltip) return;
                var duration = _getWaveformTimelineDuration();
                if (!duration) return;
                var rect = _waveformCanvas.getBoundingClientRect();
                var ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                var sec = ratio * duration;
                _hoverSec = sec;  // 描画用ホバー位置
                var m = Math.floor(sec / 60);
                var s = Math.floor(sec % 60);
                var ms = Math.floor((sec - Math.floor(sec)) * 100);
                tooltip.textContent = m + ':' + (s < 10 ? '0' : '') + s + '.' + (ms < 10 ? '0' : '') + ms;
                tooltip.style.left = (e.clientX - rect.left) + 'px';
                tooltip.style.opacity = '1';
              });
              _waveformCanvas.addEventListener('mouseleave', function() {
                if (tooltip) tooltip.style.opacity = '0';
                _hoverSec = -1;
              });

              // 範囲コントロール 3 ボタンのイベント
              var cueBtn = document.getElementById('pp-range-cue');
              var playBtn = document.getElementById('pp-range-play');
              var clearBtn = document.getElementById('pp-range-clear');
              if (cueBtn) cueBtn.addEventListener('click', function() {
                if (!_rangeActive || _rangeStart < 0) return;
                _seekWaveformManually(_rangeStart, false);
              });
              if (playBtn) playBtn.addEventListener('click', function() {
                if (!_rangeActive || _rangeStart < 0 || _rangeEnd <= _rangeStart) return;
	                _startRangeLoop();
	                _rememberRangeForTrackId(_rangeTrackId || _waveformTrackId);
	              });
              if (clearBtn) clearBtn.addEventListener('click', function() {
                _stopRange();
                _updateRangeUI();
              });
              var exportBtn = document.getElementById('pp-range-export');
              if (exportBtn) exportBtn.addEventListener('click', _exportRangeAsWav);

              // 曲全体 WAV エクスポート (常時有効)
              var fullExportBtn = document.getElementById('pp-export-full-wav');
              if (fullExportBtn) fullExportBtn.addEventListener('click', _exportFullWav);

              // ループ用 WAV エクスポート
              var loopExportBtn = document.getElementById('pp-range-export-loop');
              if (loopExportBtn) loopExportBtn.addEventListener('click', _exportRangeAsLoopWav);

              // 繋ぎ目プレビュー
              var seamPreviewBtn = document.getElementById('pp-loop-seam-preview');
              if (seamPreviewBtn) seamPreviewBtn.addEventListener('click', _toggleSeamPreview);

              // ゼロクロス吸着 ON/OFF
              var zcToggle = document.getElementById('pp-zerocross-toggle');
              if (zcToggle) zcToggle.addEventListener('change', function(ev) { _zeroCrossSnap = ev.target.checked; });

              // クロスフェード ms
              var cfSel = document.getElementById('pp-crossfade-ms');
              if (cfSel) cfSel.addEventListener('change', function(ev) { _crossfadeMs = parseInt(ev.target.value); });

              // ループタイプ
              var ltSel = document.getElementById('pp-loop-type');
              if (ltSel) ltSel.addEventListener('change', function(ev) { _loopType = ev.target.value; });

              // BPM 入力
              var bpmIn = document.getElementById('pp-bpm-input');
              if (bpmIn) bpmIn.addEventListener('input', function(ev) { _bpm = parseInt(ev.target.value) || 0; });

              // ループ長プリセット（小節数 → 範囲終端を BPM から算出）
              _panel.querySelectorAll('.pp-loop-bars-btn').forEach(function(b) {
                b.addEventListener('click', function() {
                  if (!_bpm) { alert('BPM を入力してください（または自動検出後）'); return; }
                  if (!_rangeActive || _rangeStart < 0) { alert('範囲の先頭を波形でクリックしてください'); return; }
                  var bars = parseInt(b.dataset.bars);
                  var loopSec = (60 / _bpm) * 4 * bars; // 4/4拍子前提
                  var maxDur = _getWaveformTimelineDuration();
                  _rangeEnd = Math.min(_rangeStart + loopSec, maxDur);
                  if (_zeroCrossSnap) {
                    _rangeEnd = _snapToZeroCross(_rangeEnd, 50);
                  }
                  _updateRangeUI();
                  _updateRangeStatus();
                });
              });

              // Intro / Loop / Outro マーカー
              var setIntroBtn = document.getElementById('pp-set-intro');
              var setLoopBtn = document.getElementById('pp-set-loop');
              var setOutroBtn = document.getElementById('pp-set-outro');
              var clearRegionsBtn = document.getElementById('pp-clear-regions');
              var tailZipBtn = document.getElementById('pp-export-tail-zip');
              var autoDetectBtn = document.getElementById('pp-auto-detect');
              if (setIntroBtn) setIntroBtn.addEventListener('click', function() { _setRegion('intro'); });
              if (setLoopBtn) setLoopBtn.addEventListener('click', function() { _setRegion('loop'); });
              if (setOutroBtn) setOutroBtn.addEventListener('click', function() { _setRegion('outro'); });
              if (clearRegionsBtn) clearRegionsBtn.addEventListener('click', _clearRegions);
              if (tailZipBtn) { tailZipBtn.addEventListener('click', _exportTailZip); _updateRegionButtons(); }
              if (autoDetectBtn) autoDetectBtn.addEventListener('click', _autoDetectLoopPoints);
            }
          }, 150);
        }
        _ga('tab_switch', { tab: tab.dataset.tab });
      });
    });

    // ── 尺プリセット試聴 ──
    var _durationTimer = null;
    var _durationFadeTimer = null;
    var _activeDurationBtn = null;

    // 尺プリセット：フェードアウト→次曲の制御を1つの関数にまとめる
    var _presetSec = 0;
    var _presetActive = false;
    function _clearPreset() {
      clearTimeout(_durationTimer);
      if (_durationFadeTimer) { clearInterval(_durationFadeTimer); _durationFadeTimer = null; }
      _presetActive = false;
      // 音量を復元
      var player = window.HMIX_PLAYER;
      if (player) {
        var a = player.getAudio();
        var volEl = document.getElementById('player-volume');
        if (a && volEl) a.volume = parseInt(volEl.value) / 100;
      }
    }

    function _startPresetTimer() {
      var player = window.HMIX_PLAYER;
      if (!player || !player.getAudio) return;
      var audioEl = player.getAudio();
      var statusEl = document.getElementById('pp-duration-status');
      var loopEl = document.getElementById('pp-duration-loop');
      var volEl = document.getElementById('player-volume');
      var targetVol = volEl ? parseInt(volEl.value) / 100 : 0.8;
      var sec = _presetSec;

      if (!_presetActive || sec === 0) return;

      audioEl.volume = targetVol;
      if (statusEl) statusEl.textContent = sec + '秒試聴中…';

      var fadeDur = _fadeSec || 2;
      var fadeStart = Math.max(0, sec - fadeDur) * 1000;
      _durationTimer = setTimeout(function () {
        var origVol = audioEl.volume;
        var steps = 20;
        var fadeStep = 50;
        var volDec = origVol / steps;
        _durationFadeTimer = setInterval(function () {
          if (audioEl.volume - volDec > 0.01) {
            audioEl.volume -= volDec;
          } else {
            clearInterval(_durationFadeTimer);
            _durationFadeTimer = null;
            audioEl.pause();
            audioEl.volume = targetVol;

            if (!_presetActive) return;

            if (loopEl && loopEl.checked) {
              // ループ：先頭に戻って再開
              player.seek(0);
              audioEl.play().catch(function(){});
              _startPresetTimer();
            } else {
              // 完了：停止
              if (statusEl) statusEl.textContent = sec + '秒再生完了';
              if (_activeDurationBtn) _activeDurationBtn.classList.remove('is-active');
              _activeDurationBtn = null;
              _presetActive = false;
            }
          }
        }, fadeStep);
      }, fadeStart);
    }

    // サビから再生
    var climaxBtn = document.getElementById('pp-climax-play');
    if (climaxBtn) {
      // サビデータの有無でボタンの見た目を更新
      window._updateClimaxBtn = function() {
        var btn = document.getElementById('pp-climax-play');
        if (!btn) return;
        var track = _getCurrentTrack();
        if (track && track.climax && track.climax.start != null) {
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
        } else {
          btn.style.opacity = '0.3';
          btn.style.pointerEvents = 'none';
        }
      };
      window._updateClimaxBtn();

      climaxBtn.addEventListener('click', function() {
        var track = _getCurrentTrack();
        var player = window.HMIX_PLAYER;
        if (!track || !track.climax || !player) return;

        var audioEl = player.getAudio();
        var volEl = document.getElementById('player-volume');
        if (audioEl && volEl) audioEl.volume = parseInt(volEl.value) / 100;
        player.seek(track.climax.start);
        if (audioEl && audioEl.paused) audioEl.play().catch(function(){});
        var statusEl = document.getElementById('pp-duration-status');
        if (statusEl) statusEl.textContent = 'サビから再生中';
      });
    }

    // フェードアウト秒数選択（既存 _fadeSec はモジュールスコープの _fadeOutSec を更新）
    var _fadeSec = _fadeOutSec; // ローカル参照（互換用、_fadeOutSec の値を反映）
    _panel.querySelectorAll('.pp-fade-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _fadeOutSec = parseInt(btn.dataset.fade);
        _fadeSec = _fadeOutSec;
        _panel.querySelectorAll('.pp-fade-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        _syncSelectedVideoClipFromWaveform();
      });
    });

    // フェードイン秒数選択
    _panel.querySelectorAll('.pp-fadein-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _fadeInSec = parseFloat(btn.dataset.fadein);
        _panel.querySelectorAll('.pp-fadein-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        _syncSelectedVideoClipFromWaveform();
      });
    });

    // 再生速度切替
    _panel.querySelectorAll('.pp-speed-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var speed = parseFloat(btn.dataset.speed);
        var player = window.HMIX_PLAYER;
        if (!player) return;
        var audioEl = player.getAudio();
        if (audioEl) audioEl.playbackRate = speed;
        _panel.querySelectorAll('.pp-speed-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
      });
    });

    _panel.querySelectorAll('.pp-duration-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sec = parseInt(btn.dataset.sec);
        var player = window.HMIX_PLAYER;
        if (!player || !player.getAudio) return;
        var state = player.getState();
        if (!state || !state.queue || state.currentIndex < 0) return;

        _clearPreset();
        if (_activeDurationBtn) _activeDurationBtn.classList.remove('is-active');
        _activeDurationBtn = btn;
        btn.classList.add('is-active');
        _presetSec = sec;
        _presetActive = true;

        var audioEl = player.getAudio();
        var volEl = document.getElementById('player-volume');
        var targetVol = volEl ? parseInt(volEl.value) / 100 : 0.8;
        audioEl.volume = targetVol;
        player.seek(0);
        if (audioEl.paused) {
          audioEl.play().catch(function(){});
        }

        var statusEl = document.getElementById('pp-duration-status');
        if (sec === 0) {
          _presetActive = false;
          if (statusEl) statusEl.textContent = 'フル再生中';
          return;
        }

        _startPresetTimer();
        _ga('duration_preset', { seconds: sec });
      });
    });

    // パネル外クリックで閉じる
    document.addEventListener('click', function (e) {
      if (!_panel || !_panel.classList.contains('is-open')) return;
      // パネル内 or トグルボタン内ならスキップ
      if (_panel.contains(e.target)) return;
      if (_toggleBtn && _toggleBtn.contains(e.target)) return;
      if (_videoWorkbench.node && _videoWorkbench.node.contains(e.target)) return;
      // プレイヤー内もスキップ（DL/詳細ボタン等）
      var player = document.getElementById('global-player');
      if (player && player.contains(e.target)) return;
      // ページ内リンク遷移(PJAX)では閉じない＝ツールボックスとメモを遷移後も開いたまま引き継ぐ。
      // パネル/プレイヤーは #page-content の外側に常駐するためDOMごと生き残る。
      if (e.target.closest && e.target.closest('a[href]')) return;
      // それ以外 → 閉じる
      _panel.classList.remove('is-open');
      _toggleBtn.classList.remove('is-open');
      _applyToggleLang();
      _clearPreset();
      _stopWaveformAnim();
      if (_activeDurationBtn) { _activeDurationBtn.classList.remove('is-active'); _activeDurationBtn = null; }
      var statusEl = document.getElementById('pp-duration-status');
      if (statusEl) statusEl.textContent = '';
    });

    // 曲が変わったらタブ内容とアクションボタンを更新
    window.addEventListener('hmix:player:state', function (e) {
      var detail = e && e.detail ? e.detail : {};
      _handleBrowseModeTrackChange(detail.trackId, detail.isPlaying);
      _syncPersistentRangeWithCurrentTrack();
      _updateActionButtons();
      if (window._updateClimaxBtn) window._updateClimaxBtn();
      if (_panel && _panel.classList.contains('is-open')) {
        _updateCreditTab();
        _updateShareTab();
        _loadWaveform();
      }
    });

    _updatePanelLang();
  }

  function _getToolboxStateForTrack(trackId) {
    var id = trackId != null ? String(trackId) : '';
    if (!id) return null;
    var current = _getCurrentTrack();
    var currentId = current && current.id != null ? String(current.id) : '';
    if (currentId === id) _rememberCurrentRangeForTrack(id);
    var saved = _rangeMemoryByTrackId[id] || null;
    var activeForTrack = currentId === id && _rangeActive && _rangeStart >= 0 && _rangeEnd > _rangeStart;
    var range = activeForTrack
      ? { start: _rangeStart, end: _rangeEnd, fadeIn: _fadeInSec || 0, fadeOut: _fadeOutSec || 0 }
      : (saved && saved.end > saved.start ? {
          start: Number(saved.start) || 0,
          end: Number(saved.end) || 0,
          fadeIn: Number(saved.fadeIn) || 0,
          fadeOut: Number(saved.fadeOut) || 0
        } : null);
    var memos = _loadMemos();
    var memo = memos[id] || null;
    var track = _getTrackById(id) || (currentId === id ? current : null);
    return {
      trackId: id,
      title: track ? _getTrackTitle(track) : id,
      duration: _getTrackDuration(track) || 0,
      range: range,
      memo: memo ? { text: memo.text || '', tag: memo.tag || '', updatedAt: memo.updatedAt || '' } : null,
      syncedAt: new Date().toISOString()
    };
  }

  window.HMIX_TOOLBOX_SYNC = window.HMIX_TOOLBOX_SYNC || {};
  window.HMIX_TOOLBOX_SYNC.getTrackState = _getToolboxStateForTrack;

  // ── DOM Ready ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ══════════════════════════════════════════
  // メモ機能
  // ══════════════════════════════════════════
  var MEMO_KEY = 'hmix_memos_v1';
  var _memoCurrentTrackId = null;

  function _loadMemos() {
    try { return JSON.parse(localStorage.getItem(MEMO_KEY) || '{}'); } catch(e) { return {}; }
  }
  function _saveMemos(memos) {
    try { localStorage.setItem(MEMO_KEY, JSON.stringify(memos)); } catch(e) {}
  }

  function _fmtTime(sec) {
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _initMemo() {
    var textEl = document.getElementById('memo-text');
    var tagEl = document.getElementById('memo-tag');
    var statusEl = document.getElementById('memo-status');
    if (!textEl) return;

    // 曲変更時にメモを読み込み
    function loadMemoForTrack() {
      var track = _getCurrentTrack();
      var trackId = track ? track.id : null;
      if (trackId === _memoCurrentTrackId) return;
      // 前の曲のメモを保存
      _saveMemoForCurrentTrack();
      _memoCurrentTrackId = trackId;
      var memos = _loadMemos();
      var memo = memos[trackId] || {};
      textEl.value = memo.text || '';
      if (tagEl) tagEl.value = memo.tag || '';
      _updateMemoStatus();
      _updateMemoCount();
    }

    function _saveMemoForCurrentTrack() {
      if (!_memoCurrentTrackId) return;
      var text = textEl.value.trim();
      var tag = tagEl ? tagEl.value.trim() : '';
      var memos = _loadMemos();
      if (text) {
        memos[_memoCurrentTrackId] = {
          text: text,
          tag: tag,
          updatedAt: new Date().toISOString()
        };
      } else {
        delete memos[_memoCurrentTrackId];
      }
      _saveMemos(memos);
      _updateMemoStatus();
      _updateMemoCount();
    }

    function _updateMemoStatus() {
      if (statusEl) {
        var memos = _loadMemos();
        var memo = memos[_memoCurrentTrackId];
        statusEl.textContent = memo ? '保存済み' : '';
      }
    }

    function _updateMemoCount() {
      var countEl = document.getElementById('memo-count');
      if (countEl) {
        var memos = _loadMemos();
        countEl.textContent = Object.keys(memos).length;
      }
    }

    // 自動保存（入力停止1秒後）+ メモマーカー即時更新
    var _saveTimer = null;
    textEl.addEventListener('input', function() {
      clearTimeout(_saveTimer);
      _saveTimer = setTimeout(_saveMemoForCurrentTrack, 1000);
      if (statusEl) statusEl.textContent = '入力中...';
      // 波形上のメモマーカーをリアルタイム更新
      _refreshMemoMarkers();
    });
    if (tagEl) tagEl.addEventListener('input', function() {
      clearTimeout(_saveTimer);
      _saveTimer = setTimeout(_saveMemoForCurrentTrack, 1000);
    });

    // 挿入ボタン群
    function _insertText(str) {
      var start = textEl.selectionStart;
      var before = textEl.value.slice(0, start);
      var after = textEl.value.slice(textEl.selectionEnd);
      textEl.value = before + str + after;
      textEl.selectionStart = textEl.selectionEnd = start + str.length;
      textEl.focus();
      clearTimeout(_saveTimer);
      _saveTimer = setTimeout(_saveMemoForCurrentTrack, 500);
    }

    function _memoEqValue(v) {
      return (typeof v === 'number' && isFinite(v)) ? Number(v.toFixed(2)) : v;
    }

    function _formatEqCompMemoBlock() {
      var s = _eqcSnapshot();
      var lines = [
        '[EQ_COMP]',
        'masterPreset=' + (s.masterPreset || 'custom'),
        'eqPreset=' + (s.eqPreset || 'custom'),
        'compPreset=' + (s.compPreset || 'custom')
      ];
      _eqcBands.forEach(function (b, i) {
        lines.push('eq.' + b.id + '=' + _memoEqValue(s.eq[i]));
      });
      ['threshold', 'ratio', 'attack', 'release', 'makeup'].forEach(function (key) {
        lines.push('comp.' + key + '=' + _memoEqValue(s.comp[key]));
      });
      lines.push('limit.enabled=' + (!!s.limit.enabled));
      ['threshold', 'ratio', 'attack', 'release', 'ceiling'].forEach(function (key) {
        lines.push('limit.' + key + '=' + _memoEqValue(s.limit[key]));
      });
      lines.push('[/EQ_COMP]');
      return lines.join('\n') + '\n';
    }

    function _formatMemoRangeLabel() {
      if (_rangeActive && _rangeStart >= 0 && _rangeEnd > _rangeStart) {
        return _formatTimeDetailed(_rangeStart) + ' - ' + _formatTimeDetailed(_rangeEnd)
          + ' (' + _formatTimeDetailed(_rangeEnd - _rangeStart) + ')';
      }
      return _isEn() ? 'Full track' : '曲全体';
    }

    function _formatMemoLimitLabel(snapshot) {
      var limit = snapshot && snapshot.limit;
      if (!limit || !limit.enabled) return 'OFF';
      return 'ON ceiling=' + _memoEqValue(limit.ceiling) + 'dB threshold=' + _memoEqValue(limit.threshold) + 'dB';
    }

    function _formatProductionLogBlock() {
      var isEn = _isEn();
      var track = _getCurrentTrack();
      var title = track ? _getTrackTitle(track) : (isEn ? 'Not selected' : '未選択');
      var id = track ? track.id : '';
      var url = id ? 'https://www.hmix.net/music/' + id + '.html' : '';
      var date = new Date().toISOString().slice(0, 10);
      var lines = isEn ? [
        '[Production Log]',
        'Date=' + date,
        'Track=' + title,
        'URL=' + (url || 'Not selected'),
        'Use=Video / Theater / Background',
        'Terms=License checked / credit optional',
        'Range=' + _formatMemoRangeLabel(),
        'Tone=' + _getEqCompSummary(),
        'Export=WAV / 44.1kHz / EQ and comp applied',
        'Memo=',
        '[/Production Log]'
      ] : [
        '[制作ログ]',
        '日付=' + date,
        '曲=' + title,
        'URL=' + (url || '未選択'),
        '用途=動画 / シアター / 背景',
        '利用条件=規約確認 / クレジット任意',
        '範囲=' + _formatMemoRangeLabel(),
        '音作り=' + _getEqCompSummary(),
        '書き出し=WAV / 44.1kHz / EQ・コンプ反映あり',
        'メモ=',
        '[/制作ログ]'
      ];
      return lines.join('\n') + '\n';
    }

    function _formatExportCheckBlock() {
      var isEn = _isEn();
      var track = _getCurrentTrack();
      var title = track ? _getTrackTitle(track) : (isEn ? 'Not selected' : '未選択');
      var peakStateEl = document.getElementById('pp-stage-peak-state');
      var peakDbEl = document.getElementById('pp-stage-peak-db');
      var snapshot = _eqcSnapshot();
      var peakState = peakStateEl ? peakStateEl.textContent : 'OK';
      var peakDb = peakDbEl ? peakDbEl.textContent : '-∞dB';
      var lines = isEn ? [
        '[Export Check]',
        'Track=' + title,
        'Range=' + _formatMemoRangeLabel(),
        'Tone=' + _getEqCompSummary(),
        'Peak=' + peakState + ' / peak=' + peakDb,
        'Limiter=' + _formatMemoLimitLabel(snapshot),
        'WAV=EQ / comp / limiter applied',
        'Credit=BGM: ' + title + ' / H/MIX GALLERY (Hirokazu Akiyama)',
        '[/Export Check]'
      ] : [
        '[書き出し確認]',
        '曲=' + title,
        '範囲=' + _formatMemoRangeLabel(),
        '音作り=' + _getEqCompSummary(),
        '音割れ=' + peakState + ' / peak=' + peakDb,
        'リミッター=' + _formatMemoLimitLabel(snapshot),
        'WAV=EQ・コンプ・リミッター反映あり',
        'クレジット=BGM：' + title + ' / H/MIX GALLERY（秋山裕和）',
        '[/書き出し確認]'
      ];
      return lines.join('\n') + '\n';
    }

    function _insertMemoBlock(block) {
      var prefix = textEl.value && !/\n$/.test(textEl.value) ? '\n\n' : (textEl.value ? '\n' : '');
      _insertText(prefix + block);
      _refreshMemoMarkers();
    }

    function _replaceOrInsertEqCompBlock(block) {
      var re = /\[EQ_COMP\][\s\S]*?\[\/EQ_COMP\]\n?/g;
      var text = textEl.value;
      if (re.test(text)) {
        textEl.value = text.replace(re, block);
      } else {
        var prefix = text && !/\n$/.test(text) ? '\n\n' : (text ? '\n' : '');
        textEl.value = text + prefix + block;
      }
      textEl.focus();
      _refreshMemoMarkers();
      _saveMemoForCurrentTrack();
    }

    function _parseEqCompMemoBlock() {
      var matches = textEl.value.match(/\[EQ_COMP\][\s\S]*?\[\/EQ_COMP\]/g);
      if (!matches || !matches.length) return null;
      var block = matches[matches.length - 1];
      var data = {};
      block.split(/\r?\n/).forEach(function (line) {
        line = line.trim();
        if (!line || line.charAt(0) === '[' || line.indexOf('=') < 0) return;
        var idx = line.indexOf('=');
        data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      });
      return data;
    }

    function _numFromMemo(data, key, fallback) {
      if (!(key in data)) return fallback;
      var n = parseFloat(data[key]);
      return isFinite(n) ? n : fallback;
    }

    function _applyEqCompFromMemo() {
      var data = _parseEqCompMemoBlock();
      if (!data) {
        alert('メモ内に [EQ_COMP] ブロックがありません。先に「EQ記録」を押してください。');
        return;
      }
      var snapshot = _eqcSnapshot();
      var eqById = {};
      _eqcBands.forEach(function (b, i) { eqById[b.id] = i; });
      Object.keys(eqById).forEach(function (id) {
        snapshot.eq[eqById[id]] = _numFromMemo(data, 'eq.' + id, snapshot.eq[eqById[id]]);
      });
      ['threshold', 'ratio', 'attack', 'release', 'makeup'].forEach(function (key) {
        snapshot.comp[key] = _numFromMemo(data, 'comp.' + key, snapshot.comp[key]);
      });
      if ('limit.enabled' in data) {
        snapshot.limit.enabled = /^(true|1|on|yes)$/i.test(data['limit.enabled']);
      }
      ['threshold', 'ratio', 'attack', 'release', 'ceiling'].forEach(function (key) {
        snapshot.limit[key] = _numFromMemo(data, 'limit.' + key, snapshot.limit[key]);
      });
      snapshot.eqPreset = null;
      snapshot.compPreset = null;
      snapshot.masterPreset = null;
      snapshot.bypass = false;
      _ensureEqCompAudio();
      _eqcRestore(snapshot);
      if (statusEl) {
        statusEl.textContent = 'EQ/コンプを反映しました';
        setTimeout(function () { _updateMemoStatus(); }, 2200);
      }
    }

    _bindId('memo-insert-title', 'click', function() {
      var track = _getCurrentTrack();
      if (track) _insertText('♪ ' + _getTrackTitle(track) + '\n');
    });

    _bindId('memo-insert-time', 'click', function() {
      var player = window.HMIX_PLAYER;
      if (!player) return;
      var audioEl = player.getAudio();
      if (audioEl) _insertText('[' + _fmtTime(audioEl.currentTime) + '] ');
    });

    _bindId('memo-insert-range', 'click', function() {
      if (_rangeActive && _rangeStart >= 0 && _rangeEnd > 0) {
        _insertText('[' + _fmtTime(_rangeStart) + '〜' + _fmtTime(_rangeEnd) + '] ');
      } else {
        var player = window.HMIX_PLAYER;
        if (player) {
          var audioEl = player.getAudio();
          if (audioEl) _insertText('[' + _fmtTime(audioEl.currentTime) + '〜] ');
        }
      }
    });

    _bindId('memo-insert-info', 'click', function() {
      var track = _getCurrentTrack();
      if (!track) return;
      // タグ名を解決
      var _tagNameMap = {};
      if (window.TAGS_META) {
        for (var cat in window.TAGS_META) {
          (window.TAGS_META[cat] || []).forEach(function(t) { _tagNameMap[t.id] = t.name; });
        }
      }
      var tags = [].concat(track.feeling||[], track.style||[], track.scene||[])
        .map(function(t) { return _tagNameMap[t] || t; }).join(', ');
      var info = '━━━━━━━━━━\n'
        + '♪ ' + (track.title || track.id) + '\n'
        + (track.title_en ? '  ' + track.title_en + '\n' : '')
        + '  再生時間: ' + (track.duration || '---') + '\n'
        + '  タグ: ' + (tags || '---') + '\n'
        + (track.climax ? '  サビ: ' + _fmtTime(track.climax.start) + '〜' + _fmtTime(track.climax.end) + '\n' : '')
        + '  URL: https://www.hmix.net/music/' + track.id + '.html\n'
        + '━━━━━━━━━━\n';
      _insertText(info);
    });

    _bindId('memo-insert-prodlog', 'click', function() {
      _insertMemoBlock(_formatProductionLogBlock());
      if (statusEl) {
        statusEl.textContent = '制作ログを記入しました';
        setTimeout(function () { _updateMemoStatus(); }, 2200);
      }
    });

    _bindId('memo-insert-exportcheck', 'click', function() {
      _insertMemoBlock(_formatExportCheckBlock());
      if (statusEl) {
        statusEl.textContent = '書き出し確認を記入しました';
        setTimeout(function () { _updateMemoStatus(); }, 2200);
      }
    });

    // コピー
    _bindId('memo-insert-eqcomp', 'click', function() {
      _replaceOrInsertEqCompBlock(_formatEqCompMemoBlock());
      if (statusEl) {
        statusEl.textContent = 'EQ/コンプ設定を記録しました';
        setTimeout(function () { _updateMemoStatus(); }, 2200);
      }
    });

    _bindId('memo-apply-eqcomp', 'click', function() {
      _applyEqCompFromMemo();
    });

    _bindId('memo-copy', 'click', function() {
      navigator.clipboard.writeText(textEl.value).then(function() {
        if (statusEl) { statusEl.textContent = 'コピー済み'; setTimeout(function() { _updateMemoStatus(); }, 2000); }
      });
    });

    // .txt 書き出し
    _bindId('memo-export-txt', 'click', function() {
      var track = _getCurrentTrack();
      var filename = (track ? track.id + '_memo' : 'hmix_memo') + '.txt';
      var blob = new Blob([textEl.value], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    });

    // メモ一覧
    _bindId('memo-list-btn', 'click', function() {
      var listEl = document.getElementById('memo-list');
      if (!listEl) return;
      if (!listEl.hidden) { listEl.hidden = true; return; }
      var memos = _loadMemos();
      var keys = Object.keys(memos);
      if (!keys.length) { listEl.innerHTML = '<p style="padding:8px;color:rgba(180,220,195,0.4);font-size:0.75rem;">メモはまだありません</p>'; listEl.hidden = false; return; }

      // タグでグループ化
      var groups = {};
      keys.forEach(function(id) {
        var tag = memos[id].tag || '未分類';
        if (!groups[tag]) groups[tag] = [];
        var track = (window.TRACKS || []).find(function(t) { return t.id === id; });
        groups[tag].push({ id: id, title: track ? (track.title || id) : id, text: memos[id].text, updatedAt: memos[id].updatedAt });
      });

      var html = '';
      Object.keys(groups).forEach(function(tag) {
        html += '<div class="pp-memo-group-label">' + _esc(tag) + ' (' + groups[tag].length + ')</div>';
        groups[tag].forEach(function(item) {
          html += '<div class="pp-memo-list-item" data-id="' + item.id + '">'
            + '<span class="pp-memo-list-title">' + _esc(item.title) + '</span>'
            + '<span class="pp-memo-list-preview">' + _esc(item.text.slice(0, 40)) + '</span>'
            + '</div>';
        });
      });
      listEl.innerHTML = html;
      listEl.hidden = false;

      // クリックで読み込み
      listEl.querySelectorAll('.pp-memo-list-item').forEach(function(el) {
        el.addEventListener('click', function() {
          var id = el.dataset.id;
          // その曲を再生
          if (window.HMIX_PLAYER) window.HMIX_PLAYER.playTrackById(id);
          listEl.hidden = true;
        });
      });
    });

    // タイムスタンプクリック再生（メモ内の [1:23] パターン）
    textEl.addEventListener('click', function(e) {
      var pos = textEl.selectionStart;
      var text = textEl.value;
      // カーソル位置周辺で [M:SS] パターンを検索
      var before = text.slice(Math.max(0, pos - 8), pos + 8);
      var match = before.match(/\[(\d+):(\d{2})\]/);
      if (match) {
        var sec = parseInt(match[1]) * 60 + parseInt(match[2]);
        var player = window.HMIX_PLAYER;
        if (player) {
          player.seek(sec);
          var audioEl = player.getAudio();
          if (audioEl && audioEl.paused) audioEl.play().catch(function(){});
        }
      }
    });

    // クリア
    _bindId('memo-clear', 'click', function() {
      if (!textEl.value.trim()) return;
      if (!confirm('このメモをクリアしますか？')) return;
      textEl.value = '';
      _saveMemoForCurrentTrack();
    });

    // 全メモ一括書き出し（テキスト）
    _bindId('memo-export-all', 'click', function() {
      var memos = _loadMemos();
      var keys = Object.keys(memos);
      if (!keys.length) { alert('メモがありません'); return; }

      var groups = {};
      keys.forEach(function(id) {
        var tag = memos[id].tag || '未分類';
        if (!groups[tag]) groups[tag] = [];
        var track = (window.TRACKS || []).find(function(t) { return t.id === id; });
        groups[tag].push({ id: id, title: track ? (track.title || id) : id, titleEn: track ? track.title_en : '', duration: track ? track.duration : '', text: memos[id].text });
      });

      var output = 'H/MIX GALLERY メモ一覧\n出力日: ' + new Date().toLocaleDateString('ja-JP') + '\n\n';
      Object.keys(groups).forEach(function(tag) {
        output += '■ ' + tag + ' (' + groups[tag].length + '曲)\n';
        output += '════════════════════\n\n';
        groups[tag].forEach(function(item) {
          output += '♪ ' + item.title + ' (' + item.id + ')';
          if (item.duration) output += ' [' + item.duration + ']';
          output += '\n';
          if (item.titleEn) output += '  ' + item.titleEn + '\n';
          output += '──────────\n';
          output += item.text + '\n\n';
        });
      });

      var blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'hmix_memos_all.txt';
      a.click();
    });

    // 全メモ Markdown 書き出し
    _bindId('memo-export-md', 'click', function() {
      var memos = _loadMemos();
      var keys = Object.keys(memos);
      if (!keys.length) { alert('メモがありません'); return; }

      var groups = {};
      keys.forEach(function(id) {
        var tag = memos[id].tag || '未分類';
        if (!groups[tag]) groups[tag] = [];
        var track = (window.TRACKS || []).find(function(t) { return t.id === id; });
        var tags = track ? [].concat(track.feeling||[], track.style||[], track.scene||[]).join(', ') : '';
        groups[tag].push({ id: id, title: track ? (track.title || id) : id, titleEn: track ? track.title_en : '', duration: track ? track.duration : '', tags: tags, climax: track ? track.climax : null, text: memos[id].text, url: 'https://www.hmix.net/music/' + id + '.html' });
      });

      var md = '# H/MIX GALLERY メモ一覧\n\n';
      md += '> 出力日: ' + new Date().toLocaleDateString('ja-JP') + '  \n';
      md += '> サイト: https://www.hmix.net\n\n';

      Object.keys(groups).forEach(function(tag) {
        md += '## ' + tag + ' (' + groups[tag].length + '曲)\n\n';
        groups[tag].forEach(function(item) {
          md += '### ♪ ' + item.title;
          if (item.titleEn) md += ' / ' + item.titleEn;
          md += '\n\n';
          md += '| 項目 | 内容 |\n|------|------|\n';
          md += '| ID | `' + item.id + '` |\n';
          if (item.duration) md += '| 再生時間 | ' + item.duration + ' |\n';
          if (item.tags) md += '| タグ | ' + item.tags + ' |\n';
          if (item.climax) md += '| サビ | ' + _fmtTime(item.climax.start) + '〜' + _fmtTime(item.climax.end) + ' |\n';
          md += '| URL | ' + item.url + ' |\n\n';
          md += '**メモ:**\n\n';
          md += item.text.split('\n').map(function(l) { return '> ' + l; }).join('\n') + '\n\n---\n\n';
        });
      });

      var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'hmix_memos.md';
      a.click();
    });

    // 共有URL生成
    _bindId('memo-share-url', 'click', function() {
      var track = _getCurrentTrack();
      if (!track || !textEl.value.trim()) { alert('メモを書いてから共有してください'); return; }
      var data = {
        id: track.id,
        title: track.title,
        tag: tagEl ? tagEl.value : '',
        text: textEl.value
      };
      // LZ圧縮の代わりにBase64エンコード（軽量版）
      try {
        var json = JSON.stringify(data);
        var encoded = btoa(unescape(encodeURIComponent(json)));
        var url = 'https://www.hmix.net/music/' + track.id + '.html#memo=' + encoded;

        navigator.clipboard.writeText(url).then(function() {
          if (statusEl) { statusEl.textContent = '共有URLをコピーしました'; setTimeout(_updateMemoStatus, 3000); }
        });
      } catch(e) {
        alert('URLの生成に失敗しました');
      }
    });

    // ヘルプ
    _bindId('memo-help-btn', 'click', function() {
      var existing = document.getElementById('memo-help-overlay');
      if (existing) { existing.remove(); return; }

      var overlay = document.createElement('div');
      overlay.id = 'memo-help-overlay';
      overlay.className = 'pp-memo-help-overlay';
      overlay.innerHTML =
        '<div class="pp-memo-help-panel">' +
          '<div class="pp-memo-help-header">' +
            '<span>メモ機能の使い方</span>' +
            '<button class="pp-memo-help-close" id="memo-help-close">×</button>' +
          '</div>' +
          '<div class="pp-memo-help-body">' +
            '<p class="pp-memo-help-intro">曲を聴きながら、選曲や制作のメモを残せます。<br>メモは曲ごとに自動保存されます。</p>' +

            '<h3>ワンタッチ挿入</h3>' +
            '<table class="pp-memo-help-table">' +
              '<tr><td><b>♪ 曲名</b></td><td>再生中の曲名を挿入</td></tr>' +
              '<tr><td><b>⏱ 位置</b></td><td>現在の再生位置 <code>[1:23]</code> を挿入</td></tr>' +
              '<tr><td><b>↔ 範囲</b></td><td>波形で選んだ区間 <code>[0:25〜1:05]</code> を挿入</td></tr>' +
              '<tr><td><b>📋 曲情報</b></td><td>曲名・時間・タグ・サビ・URLをまとめて挿入</td></tr>' +
            '</table>' +

            '<h3>タイムスタンプ再生</h3>' +
            '<p>メモ内の <code>[1:23]</code> をクリックすると、その位置から再生されます。</p>' +

            '<h3>プロジェクト名</h3>' +
            '<p>右上の入力欄に案件名を入力すると、メモ一覧でグループ化されます。<br>例: <code>動画A用</code> <code>ゲームBGM候補</code></p>' +

            '<h3>書き出し・共有</h3>' +
            '<table class="pp-memo-help-table">' +
              '<tr><td><b>コピー</b></td><td>この曲のメモをクリップボードへ</td></tr>' +
              '<tr><td><b>この曲.txt</b></td><td>この曲のメモをテキスト保存</td></tr>' +
              '<tr><td><b>全メモ.txt</b></td><td>全曲のメモをプロジェクト別にまとめて保存</td></tr>' +
              '<tr><td><b>全メモ.md</b></td><td>Markdown形式で書き出し（Notion/GitHub向け）</td></tr>' +
              '<tr><td><b>共有URL</b></td><td>メモ付きのURLを生成してクリップボードへ</td></tr>' +
              '<tr><td><b>クリア</b></td><td>この曲のメモをクリア</td></tr>' +
            '</table>' +

            '<h3>活用例</h3>' +
            '<pre class="pp-memo-help-example">♪ 星降る夜のバラード\n[0:15〜0:45] オープニングに使えそう\n[1:20] ここからサビ。クライマックスに合う\nフェード2秒で自然に終わる</pre>' +

            '<p class="pp-memo-help-note">※ メモはブラウザに保存されます。大切なメモは書き出しで外部に保存してください。</p>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      _bindId('memo-help-close', 'click', function() { overlay.remove(); });
      overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    });

    // 初回読み込み
    loadMemoForTrack();

    // 曲変更時
    window.addEventListener('hmix:player:state', function() {
      loadMemoForTrack();
    });
  }

  // init の最後で呼ぶ
  setTimeout(_initMemo, 200);

  // PJAX 対応
  window.addEventListener('hmix:page:init', function () {
    if (_panel && _panel.classList.contains('is-open')) {
      _updateCreditTab();
      _updateShareTab();
    }
  });

  // 言語切替対応
  function _updatePanelLang() {
    _applyToggleLang();
    if (!_panel) return;
    var isEn = _isEn();
    _panel.querySelectorAll('[data-ja]').forEach(function (el) {
      el.textContent = isEn ? (el.dataset.en || el.dataset.ja) : el.dataset.ja;
    });
    // placeholder も切替
    _panel.querySelectorAll('[data-placeholder-ja]').forEach(function (el) {
      el.placeholder = isEn ? (el.dataset.placeholderEn || el.dataset.placeholderJa) : el.dataset.placeholderJa;
    });
    // タブ内容も更新
    if (_panel.classList.contains('is-open')) {
      _updateCreditTab();
      _updateShareTab();
    }
    _syncVideoTransportControls();
    _localizeVideoWorkbenchUI(_videoWorkbench.node);
    _updateVideoWorkbenchDetails();
    _updateVideoQPointUI();
    _updateVideoGoalUI();
    _renderVideoWorkbenchTimeline();
    if (typeof _updateExportPreflight === 'function') _updateExportPreflight();
  }
  window.addEventListener('hmix:lang', _updatePanelLang);


  // ============================================================
  // EQ・コンプタブ (preset-first design / lazy audio init)
  // ------------------------------------------------------------
  // 設計方針:
  // - 試聴用エフェクト。ダウンロードファイルは加工しない。
  // - 動画制作者ターゲット → プリセット中心。EQバンド/コンプノブは折りたたみ。
  // - 音色プリセット (EQ) と 質感プリセット (コンプ) を独立。
  //   ユーザーは「あたたかく + まとまり」のように組み合わせられる。
  // - 既定は EQ:素のまま + コンプ:なし (どちらも処理オフ)。曲切替で初期に戻す。
  // - createMediaElementSource(audio) は audio 要素に1回しか使えないので
  //   _eqcSource を保持して二重生成を避ける。
  // - **タブ開いただけでは AudioContext を作らない (lazy init)**。
  //   最初にプリセット/スライダー/Bypass を触った時にだけ捕まえる。
  //   こうしないと、再生中曲が ctx 経由になった瞬間 suspend → 無音になる。
  // ============================================================
  var _eqcCtx = null;
  var _eqcSource = null;
  var _eqcInputAnalyser = null;
  var _eqcOutputAnalyser = null;
  var _eqcInputGain = null;
  var _eqcOutputGain = null;
  var _eqcCompressor = null;
  var _eqcLimiter = null;
  var _eqcFilters = [];
  var _eqcBypass = false;
  var _eqcInited = false;       // UI 構築済みか
  var _eqcAudioInited = false;  // AudioGraph 構築済みか (= 音をキャプチャ済み)
  var _eqcAnimRaf = 0;
  var _eqcAB = { slot: 'A', A: null, B: null };
  var _eqcLastTrackId = null;

  var _eqcBands = [
    { id: 'low',      name: 'LOW',      freq: 80,    type: 'lowshelf',  q: 0.7, gain: 0 },
    { id: 'lowMid',   name: 'LOW-MID',  freq: 250,   type: 'peaking',   q: 0.9, gain: 0 },
    { id: 'body',     name: 'BODY',     freq: 1000,  type: 'peaking',   q: 1.0, gain: 0 },
    { id: 'presence', name: 'PRESENCE', freq: 4000,  type: 'peaking',   q: 1.0, gain: 0 },
    { id: 'air',      name: 'AIR',      freq: 10000, type: 'highshelf', q: 0.7, gain: 0 }
  ];
  var _eqcComp = { threshold: 0, ratio: 1.0, attack: 20, release: 200, makeup: 0 }; // initial = off
  var _eqcLimit = { enabled: false, threshold: -1, ratio: 20, attack: 1, release: 80, ceiling: -1 };

  // ── 音色プリセット (EQ のみ) ──
  // ASIS は完全フラット。コンプは触らない。
  var _eqcEqPresets = {
    flat:      [0,    0,    0,    0,    0   ],
    warm:      [2.5,  1.5,  0.5,  -1,   -2  ],
    bright:    [-1,   -1,   0,    2.5,  3.5 ],
    lowboost:  [3.2,  1.4,  -0.3, 0,    0.4 ],
    narration: [-1.5, -1,  -1.8, -2.5, -0.5 ],
    cinematic: [2,    -1,   0,    1.5,  2   ],
    lofi:      [-4,   2,    0,    -3,   -7  ]
  };

  // ── 質感プリセット (コンプ のみ) ──
  // CODEX 提案 (2026-05-01) に準拠。Off は完全ニュートラル。
  var _eqcCompPresets = {
    off:        { threshold: 0,   ratio: 1.0, attack: 20, release: 200, makeup: 0    },
    natural:    { threshold: -14, ratio: 1.4, attack: 35, release: 260, makeup: 0    },
    glue:       { threshold: -20, ratio: 2.0, attack: 30, release: 280, makeup: 0.4  },
    voicebed:   { threshold: -24, ratio: 2.6, attack: 18, release: 180, makeup: -0.4 },
    shortpunch: { threshold: -22, ratio: 3.2, attack: 8,  release: 100, makeup: 0.7  },
    peakguard:  { threshold: -10, ratio: 6.0, attack: 2,  release: 80,  makeup: 0    }
  };

  // 現在の preset 名 (UI ハイライト用)。null = カスタム
  var _eqcMasterPresets = {
    asis: { eq: 'flat', comp: 'off', limit: { enabled: false, threshold: -1, ratio: 20, attack: 1, release: 80, ceiling: -1 } },
    voicebed: { eq: 'narration', comp: { threshold: -24, ratio: 2.4, attack: 18, release: 180, makeup: -1.0 }, limit: { enabled: true, threshold: -2, ratio: 20, attack: 1, release: 90, ceiling: -1 } },
    youtube: { eq: [-0.8, -0.3, 0.4, 1.2, 0.8], comp: { threshold: -18, ratio: 1.8, attack: 25, release: 220, makeup: 0.4 }, limit: { enabled: true, threshold: -1.5, ratio: 20, attack: 1, release: 90, ceiling: -1 } },
    shortstrong: { eq: [-1.2, 0.5, 0.8, 2.0, 1.3], comp: { threshold: -23, ratio: 3.2, attack: 8, release: 110, makeup: 1.1 }, limit: { enabled: true, threshold: -2.5, ratio: 20, attack: 1, release: 70, ceiling: -1 } },
    trailer: { eq: [2.0, -0.9, 0.2, 1.3, 1.8], comp: { threshold: -20, ratio: 2.2, attack: 22, release: 260, makeup: 0.6 }, limit: { enabled: true, threshold: -2, ratio: 20, attack: 1, release: 100, ceiling: -1 } },
    forward: { eq: [0.3, 0.8, 0.8, 1.4, 0.6], comp: { threshold: -26, ratio: 2.8, attack: 15, release: 180, makeup: 1.4 }, limit: { enabled: true, threshold: -2.5, ratio: 20, attack: 1, release: 90, ceiling: -1 } },
    cleanlow: { eq: [-3.2, -1.4, 0.2, 0.9, 0.6], comp: { threshold: -14, ratio: 1.5, attack: 30, release: 240, makeup: 0 }, limit: { enabled: true, threshold: -1.5, ratio: 20, attack: 1, release: 90, ceiling: -1 } }
  };
  var _eqcCurrentEqPreset = 'flat';
  var _eqcCurrentCompPreset = 'off';
  var _eqcCurrentMasterPreset = 'asis';

  function _eqcIsActive() {
    if (_eqcBypass) return false;
    var anyEq = _eqcBands.some(function (b) { return Math.abs(b.gain) > 0.05; });
    var compOn = _eqcCurrentCompPreset !== 'off' || _eqcComp.ratio > 1.05 || Math.abs(_eqcComp.makeup) > 0.05;
    return anyEq || compOn;
  }

  // ── タブ activate: UI だけ用意。Audio はまだ捕まえない ──
  function _activateEqComp() {
    _initEqCompUI();
    _startEqCompTick();
  }

  // ── ユーザーが何か触った時に呼ばれる: ここで初めて Audio Context を作る ──
  function _ensureEqCompAudio() {
    if (_eqcAudioInited) {
      if (_eqcCtx && _eqcCtx.state === 'suspended') {
        _eqcCtx.resume().catch(function () {});
      }
      return true;
    }
    return _initEqCompAudio();
  }

  function _initEqCompUI() {
    if (_eqcInited) return;
    _eqcInited = true;

    var bandsEl = document.getElementById('pp-eqcomp-bands');
    var compEl  = document.getElementById('pp-eqcomp-comp');

    // バンドスライダー (詳細セクション)
    if (bandsEl) {
      bandsEl.innerHTML = _eqcBands.map(function (b, i) {
        var freqLabel = b.freq >= 1000 ? (b.freq / 1000) + 'k' : String(b.freq);
        return '<div class="pp-eqcomp-band">' +
                 '<div class="pp-eqcomp-band-head">' +
                   '<span class="pp-eqcomp-band-name">' + b.name + '</span>' +
                   '<span class="pp-eqcomp-band-freq">' + freqLabel + 'Hz</span>' +
                   '<span class="pp-eqcomp-band-val" id="pp-eqcomp-band-val-' + i + '">0.0dB</span>' +
                 '</div>' +
                 '<input type="range" class="pp-eqcomp-band-slider" data-band="' + i + '" min="-9" max="9" step="0.1" value="' + b.gain + '">' +
               '</div>';
      }).join('');
      bandsEl.querySelectorAll('input[type="range"]').forEach(function (input) {
        input.addEventListener('input', function () {
          _ensureEqCompAudio();
          var i = parseInt(input.dataset.band, 10);
          _eqcBands[i].gain = parseFloat(input.value);
          _eqcCurrentEqPreset = null;
          _eqcCurrentMasterPreset = null;
          _eqcApplyAll();
        });
        input.addEventListener('dblclick', function () {
          _ensureEqCompAudio();
          var i = parseInt(input.dataset.band, 10);
          _eqcBands[i].gain = 0;
          input.value = 0;
          _eqcCurrentEqPreset = null;
          _eqcCurrentMasterPreset = null;
          _eqcApplyAll();
        });
      });
    }

    // コンプスライダー (詳細セクション)
    if (compEl) {
      var compDefs = [
        { key: 'threshold', label: 'Threshold', min: -50, max: 0,    step: 0.5, unit: 'dB' },
        { key: 'ratio',     label: 'Ratio',     min: 1,   max: 12,   step: 0.1, unit: ':1' },
        { key: 'attack',    label: 'Attack',    min: 1,   max: 120,  step: 1,   unit: 'ms' },
        { key: 'release',   label: 'Release',   min: 30,  max: 600,  step: 5,   unit: 'ms' },
        { key: 'makeup',    label: 'Makeup',    min: -6,  max: 9,    step: 0.1, unit: 'dB' }
      ];
      compEl.innerHTML = compDefs.map(function (d) {
        return '<div class="pp-eqcomp-comp-row" data-comp-key="' + d.key + '">' +
                 '<label class="pp-eqcomp-comp-label">' + d.label + '<span class="pp-eqcomp-comp-val" id="pp-eqcomp-comp-val-' + d.key + '"></span></label>' +
                 '<input type="range" class="pp-eqcomp-comp-slider" data-comp="' + d.key + '" data-unit="' + d.unit + '" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '" value="' + _eqcComp[d.key] + '">' +
               '</div>';
      }).join('');
      compEl.querySelectorAll('input[type="range"]').forEach(function (input) {
        input.addEventListener('input', function () {
          _ensureEqCompAudio();
          _eqcComp[input.dataset.comp] = parseFloat(input.value);
          _eqcCurrentCompPreset = null;
          _eqcCurrentMasterPreset = null;
          _eqcApplyAll();
        });
      });
    }

    // 音色プリセット (data-eqpreset)
    _panel.querySelectorAll('[data-masterpreset]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        _ensureEqCompAudio();
        _eqcApplyMasterPreset(chip.dataset.masterpreset);
      });
    });

    _panel.querySelectorAll('[data-eqpreset]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        _ensureEqCompAudio();
        _eqcCurrentMasterPreset = null;
        _eqcApplyEqPreset(chip.dataset.eqpreset);
      });
    });

    // 質感プリセット (data-comppreset)
    _panel.querySelectorAll('[data-comppreset]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        _ensureEqCompAudio();
        _eqcCurrentMasterPreset = null;
        _eqcApplyCompPreset(chip.dataset.comppreset);
      });
    });

    // Bypass (一時停止)
    var bypassBtn = document.getElementById('pp-eqcomp-bypass');
    if (bypassBtn) {
      bypassBtn.addEventListener('click', function () {
        _ensureEqCompAudio();
        _eqcBypass = !_eqcBypass;
        bypassBtn.classList.toggle('is-active', _eqcBypass);
        _eqcRebuildGraph();
        _eqcUpdateBadge();
      });
    }
    // Reset
    var resetBtn = document.getElementById('pp-eqcomp-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        _ensureEqCompAudio();
        _eqcApplyMasterPreset('asis');
        _eqcBypass = false;
        if (bypassBtn) bypassBtn.classList.remove('is-active');
        _eqcRebuildGraph();
      });
    }
    // A/B
    var abBtn = document.getElementById('pp-eqcomp-ab');
    if (abBtn) {
      abBtn.addEventListener('click', function () {
        _ensureEqCompAudio();
        _eqcAB[_eqcAB.slot] = _eqcSnapshot();
        _eqcAB.slot = (_eqcAB.slot === 'A') ? 'B' : 'A';
        if (_eqcAB[_eqcAB.slot]) _eqcRestore(_eqcAB[_eqcAB.slot]);
        abBtn.textContent = 'A/B: ' + _eqcAB.slot;
      });
    }
    // 設定コピー
    var copyBtn = document.getElementById('pp-eqcomp-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = JSON.stringify(_eqcSnapshot(), null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            var orig = copyBtn.textContent;
            copyBtn.textContent = '✓ ' + orig;
            copyBtn.classList.add('is-copied');
            setTimeout(function () { copyBtn.textContent = orig; copyBtn.classList.remove('is-copied'); }, 1600);
          }).catch(function () {});
        }
      });
    }

    _eqcUpdateUI();
    _eqcUpdateBadge();
  }

  function _initEqCompAudio() {
    var p = window.HMIX_PLAYER;
    var audio = p && p.getAudio && p.getAudio();
    if (!audio) return false;

    try {
      _eqcCtx = new (window.AudioContext || window.webkitAudioContext)();

      // **重要**: createMediaElementSource() より先に resume() を発行する。
      // resume() は Promise を返すが、ctx.state は同期的に 'running' に切り替わる。
      // suspend のまま source を作ると capture 直後に無音化し、ブラウザによっては
      // そのまま戻れなくなる (= 「曲が止まった」ように見える) ので必ず先。
      if (_eqcCtx.state === 'suspended') {
        try {
          _eqcCtx.resume();
        } catch (e) { console.warn('[eqcomp] ctx.resume threw:', e); }
      }

      _eqcSource = _eqcCtx.createMediaElementSource(audio);
      _eqcInputGain = _eqcCtx.createGain();
      _eqcOutputGain = _eqcCtx.createGain();
      _eqcCompressor = _eqcCtx.createDynamicsCompressor();
      _eqcLimiter = _eqcCtx.createDynamicsCompressor();
      _eqcInputAnalyser = _eqcCtx.createAnalyser();
      _eqcOutputAnalyser = _eqcCtx.createAnalyser();
      _eqcInputAnalyser.fftSize = 1024;
      _eqcOutputAnalyser.fftSize = 1024;
      _eqcFilters = _eqcBands.map(function (b) {
        var f = _eqcCtx.createBiquadFilter();
        f.type = b.type;
        f.frequency.value = b.freq;
        f.Q.value = b.q;
        f.gain.value = b.gain;
        return f;
      });
      _eqcSource.connect(_eqcInputAnalyser);
      _eqcSource.connect(_eqcInputGain);
      // **重要**: rebuildGraph/applyAll より先に inited フラグを立てる。
      // でないと両関数の guard で early-return し、source が destination に繋がらないまま終わる。
      _eqcAudioInited = true;
      _eqcRebuildGraph();
      _eqcApplyAll();

      // 後続の play でも resume (タブを切り替えた後など)
      audio.addEventListener('play', function () {
        if (_eqcCtx && _eqcCtx.state === 'suspended') _eqcCtx.resume().catch(function () {});
      });
      return true;
    } catch (e) {
      console.warn('[eqcomp] audio init failed:', e);
      return false;
    }
  }

  function _eqcRebuildGraph() {
    if (!_eqcAudioInited) return;
    try { _eqcInputGain.disconnect(); } catch (e) {}
    try { _eqcCompressor.disconnect(); } catch (e) {}
    try { _eqcLimiter.disconnect(); } catch (e) {}
    try { _eqcOutputGain.disconnect(); } catch (e) {}
    _eqcFilters.forEach(function (f) { try { f.disconnect(); } catch (e) {} });
    if (_eqcBypass) {
      _eqcInputGain.connect(_eqcOutputGain);
    } else {
      _eqcInputGain.connect(_eqcFilters[0]);
      for (var i = 0; i < _eqcFilters.length - 1; i++) {
        _eqcFilters[i].connect(_eqcFilters[i + 1]);
      }
      _eqcFilters[_eqcFilters.length - 1].connect(_eqcCompressor);
      _eqcCompressor.connect(_eqcOutputGain);
    }
    if (_eqcLimit && _eqcLimit.enabled && _eqcLimiter) {
      _eqcOutputGain.connect(_eqcLimiter);
      _eqcLimiter.connect(_eqcOutputAnalyser);
    } else {
      _eqcOutputGain.connect(_eqcOutputAnalyser);
    }
    _eqcOutputAnalyser.connect(_eqcCtx.destination);
  }

  function _eqcApplyAll() {
    if (_eqcAudioInited && _eqcCtx) {
      var t = _eqcCtx.currentTime;
      _eqcBands.forEach(function (b, i) {
        var f = _eqcFilters[i];
        if (!f) return;
        f.gain.setTargetAtTime(b.gain, t, 0.01);
      });
      if (_eqcCompressor) {
        _eqcCompressor.threshold.value = _eqcComp.threshold;
        _eqcCompressor.ratio.value = _eqcComp.ratio;
        _eqcCompressor.attack.value = _eqcComp.attack / 1000;
        _eqcCompressor.release.value = _eqcComp.release / 1000;
        _eqcCompressor.knee.value = 18;
      }
      if (_eqcOutputGain) {
        _eqcOutputGain.gain.value = Math.pow(10, _eqcComp.makeup / 20);
      }
      if (_eqcLimiter) {
        _eqcLimiter.threshold.value = _eqcLimit.threshold;
        _eqcLimiter.ratio.value = _eqcLimit.ratio;
        _eqcLimiter.attack.value = _eqcLimit.attack / 1000;
        _eqcLimiter.release.value = _eqcLimit.release / 1000;
        _eqcLimiter.knee.value = 0;
      }
    }
    _eqcUpdateUI();
    _eqcUpdateBadge();
    _eqcDrawCanvas();
  }

  function _eqcUpdateUI() {
    _eqcBands.forEach(function (b, i) {
      var v = document.getElementById('pp-eqcomp-band-val-' + i);
      var s = _panel ? _panel.querySelector('input[data-band="' + i + '"]') : null;
      if (v) v.textContent = (b.gain > 0 ? '+' : '') + b.gain.toFixed(1) + 'dB';
      if (s && parseFloat(s.value) !== b.gain) s.value = b.gain;
    });
    if (_panel) {
      _panel.querySelectorAll('input[data-comp]').forEach(function (input) {
        var key = input.dataset.comp;
        var unit = input.dataset.unit || '';
        if (parseFloat(input.value) !== _eqcComp[key]) input.value = _eqcComp[key];
        var v = document.getElementById('pp-eqcomp-comp-val-' + key);
        if (v) {
          var val = _eqcComp[key];
          v.textContent = (key === 'ratio') ? val.toFixed(1) + unit : val + unit;
        }
      });
      _panel.querySelectorAll('[data-eqpreset]').forEach(function (chip) {
        chip.classList.toggle('is-active', chip.dataset.eqpreset === _eqcCurrentEqPreset);
      });
      _panel.querySelectorAll('[data-comppreset]').forEach(function (chip) {
        chip.classList.toggle('is-active', chip.dataset.comppreset === _eqcCurrentCompPreset);
      });
      _panel.querySelectorAll('[data-masterpreset]').forEach(function (chip) {
        chip.classList.toggle('is-active', chip.dataset.masterpreset === _eqcCurrentMasterPreset);
      });
    }
  }

  function _eqcUpdateBadge() {
    var badge = document.getElementById('pp-eqcomp-badge');
    if (badge) badge.hidden = !_eqcIsActive();
    _eqcUpdateStageStatus();
  }

  function _eqcSetStateClass(el, state) {
    if (!el) return;
    el.classList.remove('is-on', 'is-warn', 'is-clip', 'is-muted');
    if (state) el.classList.add(state);
  }

  function _eqcUpdateStageStatus(outPeak, gr) {
    var fxEl = document.getElementById('pp-stage-fx-state');
    var limitEl = document.getElementById('pp-stage-limit-state');
    var peakDbEl = document.getElementById('pp-stage-peak-db');
    var peakStateEl = document.getElementById('pp-stage-peak-state');
    var fxPill = _panel ? _panel.querySelector('.pp-stage-pill--fx') : null;
    var limitPill = _panel ? _panel.querySelector('.pp-stage-pill--limit') : null;
    var peakPill = _panel ? _panel.querySelector('.pp-stage-pill--peak') : null;
    var isEn = _isEn();

    var fxActive = _eqcIsActive();
    if (fxEl) fxEl.textContent = _eqcBypass ? (isEn ? 'Bypass' : '一時停止') : (fxActive ? (isEn ? 'Active' : '加工中') : (isEn ? 'Original' : '原音'));
    _eqcSetStateClass(fxPill, _eqcBypass ? 'is-muted' : (fxActive ? 'is-on' : ''));

    var limitOn = !!(_eqcLimit && _eqcLimit.enabled && !_eqcBypass);
    if (limitEl) limitEl.textContent = limitOn ? 'ON ' + _eqcLimit.ceiling + 'dB' : 'OFF';
    _eqcSetStateClass(limitPill, limitOn ? 'is-on' : '');

    var peakDb = (typeof outPeak === 'number' && outPeak > 0) ? 20 * Math.log10(outPeak) : -Infinity;
    var peakText = isFinite(peakDb) ? peakDb.toFixed(1) + 'dB' : '-∞dB';
    var peakState = 'OK';
    var peakClass = '';
    if (typeof outPeak === 'number' && outPeak >= 0.985) {
      peakState = 'CLIP';
      peakClass = 'is-clip';
    } else if (typeof outPeak === 'number' && outPeak >= 0.89) {
      peakState = isEn ? 'WARN' : '注意';
      peakClass = 'is-warn';
    }
    if (peakDbEl) peakDbEl.textContent = peakText;
    if (peakStateEl) {
      peakStateEl.textContent = peakState;
      peakStateEl.classList.remove('is-warn', 'is-clip');
      if (peakClass) peakStateEl.classList.add(peakClass);
    }
    _eqcSetStateClass(peakPill, peakClass);
    _updateExportPreflight(peakState);
  }

  function _eqcApplyEqPreset(name) {
    var p = _eqcEqPresets[name];
    if (!p) return;
    _eqcBands.forEach(function (b, i) { b.gain = p[i]; });
    _eqcCurrentEqPreset = name;
    _eqcApplyAll();
  }

  function _eqcApplyCompPreset(name) {
    var p = _eqcCompPresets[name];
    if (!p) return;
    Object.assign(_eqcComp, p);
    _eqcCurrentCompPreset = name;
    _eqcApplyAll();
  }

  function _eqcApplyMasterPreset(name) {
    var p = _eqcMasterPresets[name];
    if (!p) return;

    var eq = Array.isArray(p.eq) ? p.eq : _eqcEqPresets[p.eq];
    if (eq) {
      _eqcBands.forEach(function (b, i) { b.gain = eq[i]; });
      _eqcCurrentEqPreset = Array.isArray(p.eq) ? null : p.eq;
    }

    var comp = (typeof p.comp === 'string') ? _eqcCompPresets[p.comp] : p.comp;
    if (comp) {
      Object.assign(_eqcComp, comp);
      _eqcCurrentCompPreset = (typeof p.comp === 'string') ? p.comp : null;
    }

    Object.assign(_eqcLimit, p.limit || { enabled: false });
    _eqcCurrentMasterPreset = name;
    if (_eqcAudioInited) _eqcRebuildGraph();
    _eqcApplyAll();
  }

  function _eqcSnapshot() {
    return {
      eq: _eqcBands.map(function (b) { return b.gain; }),
      comp: Object.assign({}, _eqcComp),
      limit: Object.assign({}, _eqcLimit),
      bypass: _eqcBypass,
      eqPreset: _eqcCurrentEqPreset,
      compPreset: _eqcCurrentCompPreset,
      masterPreset: _eqcCurrentMasterPreset
    };
  }

  function _eqcRestore(s) {
    if (!s) return;
    _eqcBands.forEach(function (b, i) { b.gain = s.eq[i]; });
    Object.assign(_eqcComp, s.comp);
    Object.assign(_eqcLimit, s.limit || { enabled: false, threshold: -1, ratio: 20, attack: 1, release: 80, ceiling: -1 });
    _eqcBypass = !!s.bypass;
    _eqcCurrentEqPreset = s.eqPreset || null;
    _eqcCurrentCompPreset = s.compPreset || null;
    _eqcCurrentMasterPreset = s.masterPreset || null;
    var bypassBtn = document.getElementById('pp-eqcomp-bypass');
    if (bypassBtn) bypassBtn.classList.toggle('is-active', _eqcBypass);
    _eqcRebuildGraph();
    _eqcApplyAll();
  }

  function _eqcResetSoft() {
    _eqcApplyMasterPreset('asis');
    _eqcBypass = false;
    var bypassBtn = document.getElementById('pp-eqcomp-bypass');
    if (bypassBtn) bypassBtn.classList.remove('is-active');
    _eqcAB = { slot: 'A', A: null, B: null };
    var abBtn = document.getElementById('pp-eqcomp-ab');
    if (abBtn) abBtn.textContent = 'A/B: A';
    if (_eqcAudioInited) _eqcRebuildGraph();
  }

  // ── 描画とメーター ──
  function _eqcXForFreq(canvas, freq) {
    var min = Math.log10(30), max = Math.log10(20000);
    return (Math.log10(freq) - min) / (max - min) * canvas.width;
  }
  function _eqcYForGain(canvas, gain) {
    return canvas.height / 2 - (gain / 18) * canvas.height * 0.86;
  }

  function _eqcDrawCanvas() {
    var canvas = document.getElementById('pp-eqcomp-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    var grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(154, 223, 180, 0.05)');
    grad.addColorStop(1, 'rgba(154, 223, 180, 0.02)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    var freqArr = new Uint8Array(160);
    if (_eqcOutputAnalyser) _eqcOutputAnalyser.getByteFrequencyData(freqArr);
    ctx.beginPath();
    for (var i = 0; i < 160; i++) {
      var x = i / 159 * w;
      var v = freqArr[i] / 255;
      var y = h - 14 - v * h * 0.55;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = 'rgba(154, 223, 180, 0.10)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.strokeStyle = 'rgba(180, 220, 195, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    for (var px = 0; px < w; px++) {
      var freq = Math.pow(10, Math.log10(30) + (px / w) * (Math.log10(20000) - Math.log10(30)));
      var gain = 0;
      _eqcBands.forEach(function (b) {
        var dist = Math.abs(Math.log2(freq / b.freq));
        var width = b.type === 'peaking' ? 1.3 / b.q : 1.9;
        var influence;
        if (b.type === 'lowshelf')        influence = 1 / (1 + Math.pow(freq / b.freq, 2));
        else if (b.type === 'highshelf')  influence = 1 / (1 + Math.pow(b.freq / freq, 2));
        else                              influence = Math.exp(-(dist * dist) / (width * width));
        gain += b.gain * influence;
      });
      var py = _eqcYForGain(canvas, Math.max(-12, Math.min(12, gain)));
      if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = _eqcBypass ? 'rgba(180, 220, 195, 0.30)' : '#d9b566';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(217, 181, 102, 0.35)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    _eqcBands.forEach(function (b, i) {
      var nx = _eqcXForFreq(canvas, b.freq);
      var ny = _eqcYForGain(canvas, b.gain);
      ctx.beginPath();
      ctx.arc(nx, ny, 7, 0, Math.PI * 2);
      ctx.fillStyle = _eqcBypass ? 'rgba(180, 220, 195, 0.4)' : '#ffe1a0';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#11170f';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), nx, ny + 0.5);
    });
  }

  function _eqcRms(buf) {
    var sum = 0;
    for (var i = 0; i < buf.length; i++) {
      var v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / buf.length);
  }

  function _eqcPeak(buf) {
    var peak = 0;
    for (var i = 0; i < buf.length; i++) {
      var v = Math.abs((buf[i] - 128) / 128);
      if (v > peak) peak = v;
    }
    return peak;
  }

  function _eqcTickStep() {
    var tab = document.getElementById('pp-tab-eqcomp');
    var panelOpen = _panel && _panel.classList.contains('is-open');
    if (!panelOpen) {
      _eqcAnimRaf = 0;
      return;
    }
    var eqTabActive = !!(tab && tab.classList.contains('is-active'));
    var p = window.HMIX_PLAYER;
    var audio = p && p.getAudio && p.getAudio();
    var inLevel = 0, outLevel = 0, outPeak = 0, gr = 0;
    if (_eqcAudioInited && _eqcInputAnalyser && audio && audio.src && !audio.paused) {
      var inBuf = new Uint8Array(_eqcInputAnalyser.frequencyBinCount);
      _eqcInputAnalyser.getByteTimeDomainData(inBuf);
      inLevel = _eqcRms(inBuf);
      var outBuf = new Uint8Array(_eqcOutputAnalyser.frequencyBinCount);
      _eqcOutputAnalyser.getByteTimeDomainData(outBuf);
      outLevel = _eqcRms(outBuf);
      outPeak = _eqcPeak(outBuf);
    }
    if (_eqcCompressor) gr = Math.abs(_eqcCompressor.reduction || 0);

    var inEl = document.getElementById('pp-eqcomp-mtr-in');
    var outEl = document.getElementById('pp-eqcomp-mtr-out');
    var grEl = document.getElementById('pp-eqcomp-mtr-gr');
    var grOut = document.getElementById('pp-eqcomp-gr-readout');
    var peakDbEl = document.getElementById('pp-eqcomp-peak-db');
    var peakStateEl = document.getElementById('pp-eqcomp-peak-state');
    if (inEl)  inEl.style.height  = Math.min(100, inLevel * 220) + '%';
    if (outEl) outEl.style.height = Math.min(100, outLevel * 220) + '%';
    if (grEl)  grEl.style.height  = Math.min(100, gr * 7) + '%';
    if (grOut) grOut.textContent  = gr.toFixed(1) + 'dB';
    if (peakDbEl && peakStateEl) {
      var peakDb = outPeak > 0 ? 20 * Math.log10(outPeak) : -Infinity;
      peakDbEl.textContent = isFinite(peakDb) ? peakDb.toFixed(1) + 'dB' : '-∞dB';
      peakStateEl.classList.remove('is-warn', 'is-clip');
      if (outPeak >= 0.985) {
        peakStateEl.textContent = 'CLIP';
        peakStateEl.classList.add('is-clip');
      } else if (outPeak >= 0.89) {
        peakStateEl.textContent = '注意';
        peakStateEl.classList.add('is-warn');
      } else {
        peakStateEl.textContent = 'OK';
      }
    }
    _eqcUpdateStageStatus(outPeak, gr);

    var nowId = (p && p._currentTrack && p._currentTrack.id) || (audio && audio.src) || null;
    if (nowId !== _eqcLastTrackId) {
      if (_eqcLastTrackId !== null) _eqcResetSoft();
      _eqcLastTrackId = nowId;
    }

    if (eqTabActive) _eqcDrawCanvas();
    _eqcAnimRaf = requestAnimationFrame(_eqcTickStep);
  }

  function _startEqCompTick() {
    if (_eqcAnimRaf) return;
    _eqcAnimRaf = requestAnimationFrame(_eqcTickStep);
  }

})();
