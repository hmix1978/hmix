/**
 * Theater Mode Logic
 */
(function () {
  'use strict';

  // --- UI Elements (Refreshed on init) ---
  var btnOpen, modal, btnClose, btnPlay, scenery, btnFav, btnDl, btnPrev, btnNext, btnFS, btnReturn;
  var btnLoop, btnShare, btnSceneBtn, btnSceneClose, scenePickerEl, btnLicense, btnFavList;
  var seekbar, timeCurrentEl, timeDurationEl, volumeBar;
  var favPanel = null, favPanelList = null, favCountEl = null;
  var _dragSrc = null;
  var _activeTagsCache = null;  // INP改善: _buildSceneTags のキャッシュ
  var isSeeking = false;
  var _hideTimer = null;
  var _controlsListenerAdded = false;

  var currentAudio = null;
  var isPlaying = false;
  var trackPath = '';
  var currentTrackId = 'n31';
  var FAV_KEY = 'hmix_favorites';

  // ── MediaSession: シアター側 ──
  // グローバルプレイヤー (player.js) と同居してロック画面から2重再生を起こさないため、
  // シアター起動中は window.HMIX_THEATER_ACTIVE = true にして、
  // MediaSession の metadata / actionHandler をシアター側 currentAudio に差し替える。
  // シアター終了時は null に戻し、player.js 側のハンドラが復活する。
  var TAG_PRIORITY_MS_THEATER = [
    'horror', 'scary', 'japanese_horror', 'western_horror',
    'battle', 'boss', 'samurai',
    'sad', 'mysterious', 'dark', 'epic',
    'japanese', 'oriental', 'shrine',
    'fantasy', 'celtic', 'medieval',
    'happy', 'cute', 'gentle', 'peaceful',
    'festival', 'forest', 'night', 'travel'
  ];
  function _getPrimaryTagTheater(track) {
    if (!track) return '';
    var all = [].concat(track.feeling || [], track.style || [], track.scene || [], track.story || []);
    for (var i = 0; i < TAG_PRIORITY_MS_THEATER.length; i++) {
      if (all.indexOf(TAG_PRIORITY_MS_THEATER[i]) !== -1) return TAG_PRIORITY_MS_THEATER[i];
    }
    return all[0] || '';
  }
  function _setTheaterMediaSessionMetadata() {
    if (!('mediaSession' in navigator)) return;
    try {
      var allTracks = window.TRACKS || [];
      var t = allTracks.find(function(tr) { return tr.id === currentTrackId; });
      var title = t ? ((window.HMIX_LANG === 'en' && t.title_en) ? t.title_en : (t.title || currentTrackId)) : currentTrackId;
      var primary = _getPrimaryTagTheater(t);
      var artUrl = primary
        ? 'https://www.hmix.net/assets/images/scenes/' + primary + '.webp'
        : 'https://www.hmix.net/assets/images/scenes/dark.webp';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: 'Hirokazu Akiyama',
        album: 'H/MIX GALLERY (Theater)',
        artwork: [
          { src: artUrl, sizes: '512x512', type: 'image/webp' },
          { src: artUrl, sizes: '256x256', type: 'image/webp' },
          { src: artUrl, sizes: '96x96',  type: 'image/webp' }
        ]
      });
    } catch (e) {}
  }
  function _bindTheaterMediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', function() {
        if (!currentAudio) return;
        currentAudio.play().then(function() {
          isPlaying = true;
          updatePlayBtn();
        }).catch(function(){});
      });
      navigator.mediaSession.setActionHandler('pause', function() {
        if (!currentAudio) return;
        currentAudio.pause();
        isPlaying = false;
        updatePlayBtn();
      });
      navigator.mediaSession.setActionHandler('previoustrack', function() {
        goPrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', function() {
        goNext();
      });
      navigator.mediaSession.setActionHandler('seekto', function(details) {
        if (!currentAudio) return;
        if (details && details.seekTime != null && isFinite(details.seekTime)) {
          try { currentAudio.currentTime = details.seekTime; } catch(e) {}
        }
      });
      try {
        navigator.mediaSession.setActionHandler('stop', function() {
          closeTheater();
        });
      } catch(e) {}
    } catch (e) {}
  }
  function _unbindTheaterMediaSession() {
    if (!('mediaSession' in navigator)) return;
    // 全ハンドラを null 化 → player.js 側を再バインドできるよう _mediaSessionHandlersBound も復旧させる
    ['play','pause','previoustrack','nexttrack','seekto','stop'].forEach(function(action) {
      try { navigator.mediaSession.setActionHandler(action, null); } catch(e) {}
    });
    try { navigator.mediaSession.metadata = null; } catch(e) {}
    try { navigator.mediaSession.playbackState = 'none'; } catch(e) {}
    // player.js 側の再バインド要請
    window.dispatchEvent(new CustomEvent('hmix:mediasession:rebind'));
  }
  function _updateTheaterPlaybackState(stateStr) {
    if (!('mediaSession' in navigator)) return;
    try { navigator.mediaSession.playbackState = stateStr; } catch(e) {}
  }
  var _lastTheaterPositionUpdate = 0;
  function _updateTheaterPositionState() {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    var now = Date.now();
    if (now - _lastTheaterPositionUpdate < 250) return;
    _lastTheaterPositionUpdate = now;
    try {
      if (!currentAudio) return;
      var d = currentAudio.duration;
      var t = currentAudio.currentTime;
      if (!isFinite(d) || d <= 0) return;
      navigator.mediaSession.setPositionState({
        duration: d,
        playbackRate: currentAudio.playbackRate || 1,
        position: Math.min(Math.max(t, 0), d)
      });
    } catch(e) {}
  }

  // 人気ランキング順（Moment, 星寂の散歩道, 伝承の丘, 日時計の丘, 宵祭りの風, 志は死なない, Dear Childhood Friend, いつかの大地へ）
  var POPULARITY_IDS = ['n74', 'c7', 'n51', 'c2', 'n72', 'n103', 'n46', 'n123'];
  var DEFAULT_THEATER_TRACKS = [];
  var THEATER_TRACKS = [];
  var currentDataIndex = 0;
  var isTransitioning = false;

  // ── 時間帯プレイリスト ────────────────────────────────────
  // 朝（6-11）: 穏やか・希望  昼（11-16）: 冒険・壮大
  // 夕（16-20）: 郷愁・切なさ  夜（20-6）: 幻想・神秘
  function getTimeOfDayPlaylist() {
    var S = './assets/images/scenes/';
    var h = new Date().getHours();
    if (h >= 6 && h < 11) {
      // 朝 — 穏やかな目覚め
      return [
        { id: 'c2',   bg: S + 'field.webp'    }, // 日時計の丘
        { id: 'c7',   bg: S + 'travel.webp'   }, // 星寂の散歩道
        { id: 'n46',  bg: S + 'field.webp'    }, // Dear Childhood Friend
        { id: 'n51',  bg: S + 'field.webp'    }, // 伝承の丘
        { id: 'n72',  bg: S + 'festival.webp' }, // 宵祭りの風
        { id: 'n123', bg: S + 'field.webp'    }, // いつかの大地へ
        { id: 'n74',  bg: S + 'japanese.webp' }, // Moment
        { id: 'n103', bg: S + 'japanese.webp' }, // 志は死なない
      ];
    } else if (h >= 11 && h < 16) {
      // 昼 — 冒険・壮大
      return [
        { id: 'n103', bg: S + 'japanese.webp' }, // 志は死なない
        { id: 'n74',  bg: S + 'japanese.webp' }, // Moment
        { id: 'n51',  bg: S + 'field.webp'    }, // 伝承の丘
        { id: 'n72',  bg: S + 'festival.webp' }, // 宵祭りの風
        { id: 'n123', bg: S + 'field.webp'    }, // いつかの大地へ
        { id: 'c2',   bg: S + 'field.webp'    }, // 日時計の丘
        { id: 'c7',   bg: S + 'travel.webp'   }, // 星寂の散歩道
        { id: 'n46',  bg: S + 'field.webp'    }, // Dear Childhood Friend
      ];
    } else if (h >= 16 && h < 20) {
      // 夕方 — 郷愁・切なさ
      return [
        { id: 'n74',  bg: S + 'japanese.webp' }, // Moment
        { id: 'n46',  bg: S + 'field.webp'    }, // Dear Childhood Friend
        { id: 'n123', bg: S + 'field.webp'    }, // いつかの大地へ
        { id: 'c7',   bg: S + 'travel.webp'   }, // 星寂の散歩道
        { id: 'n72',  bg: S + 'festival.webp' }, // 宵祭りの風
        { id: 'n51',  bg: S + 'field.webp'    }, // 伝承の丘
        { id: 'c2',   bg: S + 'field.webp'    }, // 日時計の丘
        { id: 'n103', bg: S + 'japanese.webp' }, // 志は死なない
      ];
    } else {
      // 夜 — 幻想・神秘
      return [
        { id: 'c7',   bg: S + 'night.webp'    }, // 星寂の散歩道
        { id: 'n74',  bg: S + 'japanese.webp' }, // Moment
        { id: 'n123', bg: S + 'forest.webp'   }, // いつかの大地へ
        { id: 'n51',  bg: S + 'night.webp'    }, // 伝承の丘
        { id: 'n46',  bg: S + 'night.webp'    }, // Dear Childhood Friend
        { id: 'c2',   bg: S + 'field.webp'    }, // 日時計の丘
        { id: 'n72',  bg: S + 'festival.webp' }, // 宵祭りの風
        { id: 'n103', bg: S + 'japanese.webp' }, // 志は死なない
      ];
    }
  }

  function initUI() {
    DEFAULT_THEATER_TRACKS = getTimeOfDayPlaylist();
    THEATER_TRACKS = DEFAULT_THEATER_TRACKS.slice();

    btnOpen  = document.getElementById('fm-open-theater');
    modal    = document.getElementById('theater-modal');
    btnClose = document.getElementById('theater-close');
    btnPlay  = document.getElementById('theater-play-btn');
    scenery  = document.getElementById('theater-scenery');
    btnFav   = document.getElementById('theater-btn-fav');
    btnDl    = document.getElementById('theater-btn-dl');
    // ダウンロード時にクレジットモーダルを表示（初回のみフック）
    if (btnDl && !btnDl.dataset.creditHooked) {
      btnDl.dataset.creditHooked = '1';
      btnDl.addEventListener('click', function () {
        var title = '';
        if (window.TRACKS && currentTrackId) {
          var t = window.TRACKS.find(function(tr) { return tr.id === currentTrackId; });
          if (t) title = (window.HMIX_LANG === 'en' && t.title_en) ? t.title_en : (t.title || currentTrackId);
        }
        if (!title) {
          var el = document.getElementById('theater-title');
          if (el) title = el.textContent.trim();
        }
        // HMIX_CREDIT_MODAL が既にロード済みなら即呼び出し
        // 未ロードの場合はスクリプトを動的に挿入してから呼び出す
        function _showCreditModal() {
          if (window.HMIX_CREDIT_MODAL) {
            window.HMIX_CREDIT_MODAL.open(title || 'Track');
          }
        }
        if (window.HMIX_CREDIT_MODAL) {
          _showCreditModal();
        } else {
          if (!document.querySelector('link[href*="credit-modal.css"]')) {
            var css = document.createElement('link');
            css.rel = 'stylesheet'; css.href = './assets/css/credit-modal.css';
            document.head.appendChild(css);
          }
          var js = document.createElement('script');
          js.src = './assets/js/credit-modal.js';
          js.onload = _showCreditModal;
          document.head.appendChild(js);
        }
      });
    }
    btnPrev  = document.getElementById('theater-nav-prev');
    btnNext  = document.getElementById('theater-nav-next');
    btnFS     = document.getElementById('theater-fullscreen-btn');
    btnReturn = document.getElementById('theater-return-btn');

    if (!modal) return;

    btnLoop       = document.getElementById('theater-btn-loop');
    btnShare      = document.getElementById('theater-btn-share');
    btnSceneBtn   = document.getElementById('theater-scene-btn');
    btnSceneClose = document.getElementById('theater-scene-close');
    scenePickerEl = document.getElementById('theater-scene-picker');
    btnLicense    = document.getElementById('theater-license-btn');
    btnFavList    = document.getElementById('theater-fav-list-btn');
    favPanel      = document.getElementById('theater-fav-panel');
    favPanelList  = document.getElementById('theater-fav-panel-list');
    favCountEl    = document.getElementById('theater-fav-count');
    seekbar       = document.getElementById('theater-seekbar');
    timeCurrentEl = document.getElementById('theater-time-current');
    timeDurationEl= document.getElementById('theater-time-duration');
    volumeBar     = document.getElementById('theater-volume-bar');

    if (btnClose) btnClose.onclick = closeTheater;
    if (btnPlay)  btnPlay.onclick  = togglePlay;
    if (btnPrev)  btnPrev.onclick  = goPrev;
    if (btnNext)  btnNext.onclick  = goNext;
    if (btnFav) {
      btnFav.onclick = function() {
        if (!currentTrackId) return;
        toggleFav(currentTrackId);
        syncFavBtn(currentTrackId);
      };
    }
    if (btnFS)     btnFS.onclick     = toggleFullscreen;
    // 帰還ボタン: 全画面中は全画面を終了するだけ、通常時はシアターを閉じる
    if (btnReturn) btnReturn.onclick = function() {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(function(){});
      } else {
        closeTheater();
      }
    };
    if (btnLoop)  btnLoop.onclick  = toggleLoop;
    if (btnShare) btnShare.onclick = toggleSharePopup;
    // シェアポップアップ 各ボタン
    var btnShareX        = document.getElementById('theater-share-x');
    var btnShareFacebook = document.getElementById('theater-share-facebook');
    var btnShareLine     = document.getElementById('theater-share-line');
    var btnShareBsky     = document.getElementById('theater-share-bluesky');
    var btnShareCopy     = document.getElementById('theater-share-copy');
    if (btnShareX)        btnShareX.onclick        = function() { _doShare('x'); };
    if (btnShareFacebook) btnShareFacebook.onclick = function() { _doShare('facebook'); };
    if (btnShareLine)     btnShareLine.onclick     = function() { _doShare('line'); };
    if (btnShareBsky)     btnShareBsky.onclick     = function() { _doShare('bluesky'); };
    if (btnShareCopy)     btnShareCopy.onclick     = function() { _doShare('copy'); };
    // 情景ボタン: トグル動作に変更 (2回め問題の修正)
    if (btnSceneBtn) btnSceneBtn.onclick = function() {
      if (scenePickerEl && !scenePickerEl.hasAttribute('hidden')) {
        closeScenePicker();
      } else {
        openScenePicker();
      }
    };
    if (btnSceneClose) btnSceneClose.onclick = closeScenePicker;
    // お気に入りパネルボタン
    if (btnFavList) btnFavList.onclick = function() {
      if (favPanel && favPanel.classList.contains('is-open')) {
        closeFavPanel();
      } else {
        openFavPanel();
      }
    };
    // ライセンスボタン → お気に入りパネルを開いてガイド表示
    if (btnLicense) {
      btnLicense.onclick = function(e) {
        e.preventDefault();
        // まずお気に入りに現在の曲を追加
        if (currentTrackId) toggleFav(currentTrackId);
        syncFavBtn(currentTrackId);
        // お気に入りパネルを開く
        openFavPanel();
        // ガイド表示
        _showLicenseGuide();
      };
    }

    var btnFavPanelClose = document.getElementById('theater-fav-panel-close');
    if (btnFavPanelClose) btnFavPanelClose.onclick = closeFavPanel;
    var btnFavPlayAll = document.getElementById('theater-fav-play-all');
    if (btnFavPlayAll) btnFavPlayAll.onclick = playAllFavs;

    // 旅のしおり再表示ボタン
    var btnShiori = document.getElementById('theater-shiori-btn');
    if (btnShiori) btnShiori.onclick = function() { _showShiori(true); };

    // シアター内 商用ライセンス申請ボタン
    var btnTheaterLicense = document.getElementById('theater-fav-license');
    if (btnTheaterLicense) btnTheaterLicense.onclick = function() {
      var ids = _getFavIds();
      var validIds = [];
      _theaterLicenseSelection.forEach(function(id) {
        if (ids.indexOf(id) !== -1) validIds.push(id);
      });
      if (!validIds.length) return;
      var allTracks = window.TRACKS || [];
      var selected = validIds.map(function(id) {
        var t = allTracks.find(function(tr) { return tr.id === id; });
        return t ? { id: String(t.id), title: t.title || id } : { id: id, title: id };
      });
      try { sessionStorage.setItem('hmix_license_selection', JSON.stringify(selected)); } catch(e) {}
      // 音楽をフェードアウトしてから遷移
      if (currentAudio && !currentAudio.paused) {
        fadeOutAudio(currentAudio, 1200, function() {
          window.location.href = '/license-request.html';
        });
      } else {
        window.location.href = '/license-request.html';
      }
    };
    if (seekbar) {
      seekbar.onmousedown  = function() { isSeeking = true; };
      seekbar.ontouchstart = function() { isSeeking = true; };
      seekbar.onchange = function() {
        isSeeking = false;
        if (currentAudio && currentAudio.duration && !isNaN(currentAudio.duration)) {
          currentAudio.currentTime = (parseFloat(seekbar.value) / 100) * currentAudio.duration;
        }
      };
      seekbar.oninput = function() {
        if (currentAudio && currentAudio.duration && !isNaN(currentAudio.duration) && timeCurrentEl) {
          timeCurrentEl.textContent = formatTime((parseFloat(seekbar.value) / 100) * currentAudio.duration);
        }
      };
    }
    if (volumeBar) {
      volumeBar.oninput = function() {
        if (currentAudio) currentAudio.volume = parseInt(volumeBar.value) / 100;
      };
    }
    // コントロール自動非表示リスナー (theater-modal は PJAX で置換されないため一度だけ登録)
    if (modal && !_controlsListenerAdded) {
      modal.addEventListener('mousemove', showControls);
      modal.addEventListener('mousedown', showControls);
      modal.addEventListener('touchstart', showControls, { passive: true });
      _controlsListenerAdded = true;
    }
  }

  function isFav(id) {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY) || '[]').indexOf(id) !== -1;
    } catch(e) { return false; }
  }

  function toggleFav(id) {
    try {
      var list = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      var idx = list.indexOf(id);
      if (idx === -1) list.push(id);
      else list.splice(idx, 1);
      localStorage.setItem(FAV_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('favorites:updated'));
    } catch(e) {}
  }

  function syncFavBtn(id) {
    if (!btnFav) return;
    var on = isFav(id);
    btnFav.classList.toggle('is-fav', on);
    btnFav.setAttribute('aria-label', on ? 'お気に入りから削除' : 'お気に入りに追加');
  }

  var _loadGeneration = 0;  // 遷移の世代管理（古いコールバックを無効化）

  function loadTheaterTrack(idx, autoPlay) {
    if (idx < 0) idx = THEATER_TRACKS.length - 1;
    if (idx >= THEATER_TRACKS.length) idx = 0;
    currentDataIndex = idx;
    var data = THEATER_TRACKS[idx];
    isTransitioning = true;
    var thisGen = ++_loadGeneration;  // この呼び出しの世代

    var realTrack = (window.TRACKS || []).find(function(t) { return t.id === data.id; });
    var titleText = realTrack
      ? ((window.HMIX_LANG === 'en' && realTrack.title_en) ? realTrack.title_en : realTrack.title)
      : data.id;
    var compText = 'Hirokazu Akiyama / H/MIX GALLERY';

    // 前の曲と同じ背景画像の場合、楽曲のタグから別の画像を選ぶ
    var _prevBg = scenery ? scenery.style.backgroundImage : '';
    if (data.bg && _prevBg && _prevBg.indexOf(data.bg.split('/').pop()) >= 0 && realTrack) {
      var S = './assets/images/scenes/';
      var allTags = [].concat(realTrack.feeling || [], realTrack.style || [], realTrack.scene || [], realTrack.story || []);
      var TAG_BG = window._scenicTagBg || {};
      // scenic-bg.js のTAG_BGが利用可能ならそこから探す
      for (var ti = 0; ti < allTags.length; ti++) {
        var candidate = S + allTags[ti] + '.webp';
        if (candidate !== data.bg && _prevBg.indexOf(allTags[ti] + '.webp') < 0) {
          data.bg = candidate;
          break;
        }
      }
    }

    if (scenery) {
      scenery.style.transition = 'opacity 0.8s ease, filter 2s ease';
      scenery.style.opacity = 0;
    }

    var nextPrefix = data.id.charAt(0);
    var nextTrackPath = './music/' + nextPrefix + '/' + data.id + '.mp3';

    function finishTransition() {
      // 古い世代のコールバックなら無視
      if (thisGen !== _loadGeneration) return;
      var titleEl = document.getElementById('theater-title');
      var compEl  = document.getElementById('theater-composer');
      if (titleEl) titleEl.textContent = titleText;
      if (compEl)  compEl.textContent = compText;
      // UI非表示時の曲名表示を更新
      var blTitle = document.getElementById('theater-bl-title');
      if (blTitle) blTitle.textContent = titleText;
      if (scenery) {
        scenery.style.backgroundImage = 'url("' + data.bg + '")';
        // 開場シーケンス中は opacity を開場側が制御するので触らない
        if (!modal || !modal.classList.contains('theater-opening')) {
          scenery.style.opacity = 1;
        }
      }
      
      currentTrackId = data.id;
      trackPath = nextTrackPath;
      syncFavBtn(currentTrackId);
      // パネルが開いていれば再生中ハイライトを更新
      if (favPanel && favPanel.classList.contains('is-open')) renderFavPanel();
      // 足跡レイヤーへ曲変更を通知
      window.dispatchEvent(new CustomEvent('theater:track:change', { detail: { trackId: currentTrackId, trackTitle: titleText } }));
      if (btnDl) {
        btnDl.href = trackPath;
        btnDl.download = currentTrackId + '.mp3';
      }
      // ライセンスボタンは お気に入りパネルへの導線に変更（theater体験を中断しない）
      if (seekbar)       seekbar.value       = 0;
      if (timeCurrentEl) timeCurrentEl.textContent = '0:00';
      if (timeDurationEl) timeDurationEl.textContent = '--:--';

      if (!currentAudio) {
        currentAudio = new Audio(trackPath);
        currentAudio.setAttribute('playsinline', '');
        currentAudio.setAttribute('webkit-playsinline', '');
        currentAudio.preload = 'metadata';
        currentAudio.onended = function() {
          if (isPlaying) goNext();
          else {
            isPlaying = false;
            updatePlayBtn();
            _updateTheaterPlaybackState('paused');
            if (scenery) scenery.style.filter = 'brightness(0.8) contrast(1.1)';
          }
        };
        currentAudio.ontimeupdate = function() {
          // MediaSession: ロック画面のスクラブバー位置更新（250ms throttle）
          if (window.HMIX_THEATER_ACTIVE) _updateTheaterPositionState();
          if (isSeeking || !seekbar || !timeCurrentEl) return;
          var cur = currentAudio.currentTime;
          var dur = currentAudio.duration || 0;
          if (dur > 0) seekbar.value = (cur / dur) * 100;
          timeCurrentEl.textContent = formatTime(cur);
        };
        currentAudio.onloadedmetadata = function() {
          if (timeDurationEl) timeDurationEl.textContent = formatTime(currentAudio.duration || 0);
        };
        currentAudio.addEventListener('play', function() {
          if (window.HMIX_THEATER_ACTIVE) _updateTheaterPlaybackState('playing');
        });
        currentAudio.addEventListener('pause', function() {
          if (window.HMIX_THEATER_ACTIVE) _updateTheaterPlaybackState('paused');
        });
      } else {
        currentAudio.src = trackPath;
        // 前トラック ended 後に src 変更した場合、一部ブラウザで ended 状態が残り
        // 次の play() 後に 'ended' が再発火せず連続再生が止まるため、明示的に load() する
        try { currentAudio.load(); } catch(e) {}
      }
      // 防御的: onended が何らかの理由で失われていたら再設定（連続再生の安全弁）
      if (currentAudio && !currentAudio.onended) {
        currentAudio.onended = function() {
          if (isPlaying) goNext();
          else {
            isPlaying = false;
            updatePlayBtn();
            _updateTheaterPlaybackState('paused');
            if (scenery) scenery.style.filter = 'brightness(0.8) contrast(1.1)';
          }
        };
      }
      // 曲切替時に MediaSession metadata を更新（シアターアクティブ時のみ）
      if (window.HMIX_THEATER_ACTIVE) _setTheaterMediaSessionMetadata();

      var isOpening = modal && modal.classList.contains('theater-opening');
      if (autoPlay && !isOpening) {
        currentAudio.volume = volumeBar ? (parseInt(volumeBar.value) / 100) : 1;
        currentAudio.play().catch(function(err){
          console.warn('[theater] play() failed:', err);
        });
        isPlaying = true;
        if (scenery) scenery.style.filter = 'brightness(0.9) contrast(1.05) sepia(0.1)';
      } else if (!isOpening) {
        isPlaying = false;
        if (scenery) scenery.style.filter = 'brightness(0.8) contrast(1.05)';
      }
      updatePlayBtn();
      setTimeout(function(){ isTransitioning = false; }, 800);
    }

    if (currentAudio && !currentAudio.paused && isPlaying) {
      fadeOutAudio(currentAudio, 800, finishTransition);
    } else {
      setTimeout(finishTransition, 400);
    }
  }

  function goPrev() { if (!isTransitioning) loadTheaterTrack(currentDataIndex - 1, isPlaying); }
  function goNext() { if (!isTransitioning) loadTheaterTrack(currentDataIndex + 1, isPlaying); }

  function getBgForTrack(track) {
    if (!track) return './assets/images/history/bg-journey.png';
    var sc  = track.scene   || [];
    var fe  = track.feeling || [];
    var st  = track.style   || [];
    var S   = './assets/images/scenes/';
    // シーン優先マッチング
    var sceneMap = [
      // ホラー・ダーク系
      ['boss',       S+'boss.webp'],
      ['dungeon',    S+'dungeon.webp'],
      ['cave',       S+'cave.webp'],
      ['ruins',      S+'ruins.webp'],
      ['conspiracy', S+'conspiracy.webp'],
      // 和風・神社系
      ['shrine',     S+'shrine.webp'],
      ['onsen',      S+'onsen.webp'],
      ['festival',   S+'festival.webp'],
      // フィールド・旅
      ['field',      S+'field.webp'],
      ['travel',     S+'travel.webp'],
      ['forest',     S+'forest.webp'],
      ['night',      S+'night.webp'],
      ['town',       S+'town.webp'],
      ['village',    S+'village.webp'],
      // エンディング系
      ['ending',     S+'ending.webp'],
      ['opening',    S+'opening.webp'],
    ];
    for (var i = 0; i < sceneMap.length; i++) {
      if (sc.indexOf(sceneMap[i][0]) !== -1) return sceneMap[i][1];
    }
    // スタイル優先マッチング
    var styleMap = [
      ['japanese',   S+'japanese.webp'],
      ['oriental',   S+'oriental.webp'],
      ['medieval',   S+'medieval.webp'],
      ['celtic',     S+'celtic.webp'],
      ['fantasy',    S+'fantasy.webp'],
      ['electronic', S+'electronic.webp'],
      ['futuristic', S+'futuristic.webp'],
    ];
    for (var j = 0; j < styleMap.length; j++) {
      if (st.indexOf(styleMap[j][0]) !== -1) return styleMap[j][1];
    }
    // 感情優先マッチング
    var feelMap = [
      ['horror',     S+'horror.webp'],
      ['dark',       S+'dark.webp'],
      ['suspense',   S+'suspense.webp'],
      ['mysterious', S+'mysterious.webp'],
      ['epic',       S+'epic.webp'],
      ['battle',     S+'battle.webp'],
      ['sad',        S+'sad.webp'],
      ['memory',     S+'memory.webp'],
      ['farewell',   S+'farewell.webp'],
      ['defeat',     S+'defeat.webp'],
      ['gentle',     S+'gentle.webp'],
      ['peaceful',   S+'peaceful.webp'],
      ['dream',      S+'dream.webp'],
      ['happy',      S+'happy.webp'],
      ['victory',    S+'victory.webp'],
      ['reunion',    S+'reunion.webp'],
    ];
    for (var k = 0; k < feelMap.length; k++) {
      if (fe.indexOf(feelMap[k][0]) !== -1) return feelMap[k][1];
    }
    return './assets/images/history/bg-journey.png';
  }

  // ══════════════════════════════════════════════════════
  // お気に入りパネル
  // ══════════════════════════════════════════════════════
  function _getFavIds() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch(e) { return []; }
  }

  function _saveFavIds(ids) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(ids));
      window.dispatchEvent(new CustomEvent('favorites:updated'));
    } catch(e) {}
  }

  function _escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _trackTitle(t) {
    return (window.HMIX_LANG === 'en' && t.title_en) ? t.title_en : (t.title || t.id);
  }

  var _theaterLicenseSelection = new Set();

  function _syncTheaterLicenseBtn() {
    var btn = document.getElementById('theater-fav-license');
    if (!btn) return;
    var count = _theaterLicenseSelection.size;
    btn.disabled = count === 0;
    var isEn = window.HMIX_LANG === 'en';
    btn.textContent = count > 0
      ? (isEn ? 'Request License (' + count + ')' : '商用ライセンスを申請（' + count + '曲）')
      : (isEn ? 'Request License' : '商用ライセンスを申請');
  }

  function renderFavPanel() {
    if (!favPanelList) return;
    var ids = _getFavIds();
    var allTracks = window.TRACKS || [];

    if (favCountEl) favCountEl.textContent = ids.length ? ids.length + '曲' : '';

    // 削除された曲を選択から外す
    _theaterLicenseSelection.forEach(function(id) {
      if (ids.indexOf(id) === -1) _theaterLicenseSelection.delete(id);
    });

    if (!ids.length) {
      favPanelList.innerHTML = '<li class="theater-fav-panel__empty">お気に入りがありません</li>';
      _syncTheaterLicenseBtn();
      return;
    }

    favPanelList.innerHTML = ids.map(function(id, i) {
      var t = allTracks.find(function(tr) { return tr.id === id; });
      var title = t ? _trackTitle(t) : id;
      var playing = id === currentTrackId;
      var checked = _theaterLicenseSelection.has(id);
      return '<li class="theater-fav-item' + (playing ? ' is-playing' : '') + '" draggable="true" data-id="' + _escHtml(id) + '">' +
        '<input type="checkbox" class="theater-fav-item__check" data-id="' + _escHtml(id) + '"' + (checked ? ' checked' : '') + ' title="商用ライセンス選択">' +
        '<span class="theater-fav-item__drag" aria-hidden="true">⠿</span>' +
        '<span class="theater-fav-item__index">' + (i + 1) + '</span>' +
        '<span class="theater-fav-item__name">' + _escHtml(title) + '</span>' +
        (playing ? '<span class="theater-fav-item__playing" aria-hidden="true">▶</span>' : '') +
        '<button class="theater-fav-item__remove" data-id="' + _escHtml(id) + '" aria-label="お気に入りから削除" title="削除">♥</button>' +
      '</li>';
    }).join('');

    _syncTheaterLicenseBtn();

    // ── イベント付与 ──────────────────────────────
    favPanelList.querySelectorAll('.theater-fav-item').forEach(function(li) {
      // ドラッグ&ドロップ
      li.addEventListener('dragstart', function(e) {
        _dragSrc = li;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(function() { li.classList.add('is-dragging'); }, 0);
      });
      li.addEventListener('dragend', function() {
        li.classList.remove('is-dragging');
        favPanelList.querySelectorAll('.theater-fav-item').forEach(function(el) {
          el.classList.remove('drag-over');
        });
        _dragSrc = null;
      });
      li.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (_dragSrc && li !== _dragSrc) li.classList.add('drag-over');
      });
      li.addEventListener('dragleave', function() {
        li.classList.remove('drag-over');
      });
      li.addEventListener('drop', function(e) {
        e.preventDefault();
        li.classList.remove('drag-over');
        if (!_dragSrc || li === _dragSrc) return;
        var ids = _getFavIds();
        var fromId = _dragSrc.dataset.id;
        var toId   = li.dataset.id;
        var fi = ids.indexOf(fromId), ti = ids.indexOf(toId);
        if (fi !== -1 && ti !== -1) {
          ids.splice(fi, 1);
          ids.splice(ti, 0, fromId);
          _saveFavIds(ids);
          renderFavPanel();
        }
      });

      // 曲名クリック → 即再生
      var nameEl = li.querySelector('.theater-fav-item__name');
      if (nameEl) nameEl.addEventListener('click', function() {
        var id = li.dataset.id;
        var ids = _getFavIds();
        var allTracks = window.TRACKS || [];
        THEATER_TRACKS = ids.map(function(fid) {
          var t = allTracks.find(function(tr) { return tr.id === fid; });
          return { id: fid, bg: t ? getBgForTrack(t) : DEFAULT_THEATER_TRACKS[0].bg };
        });
        var idx = THEATER_TRACKS.findIndex(function(t) { return t.id === id; });
        if (idx !== -1) loadTheaterTrack(idx, true);
        // パネルはそのまま開いておく（曲を変えながら操作できる）
        setTimeout(renderFavPanel, 200); // 再生開始後にハイライト更新
      });
    });

    // 削除ボタン
    favPanelList.querySelectorAll('.theater-fav-item__remove').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.dataset.id;
        var ids = _getFavIds().filter(function(fid) { return fid !== id; });
        _saveFavIds(ids);
        _theaterLicenseSelection.delete(id);
        THEATER_TRACKS = THEATER_TRACKS.filter(function(t) { return t.id !== id; });
        renderFavPanel();
      });
    });

    // 商用ライセンス チェックボックス
    favPanelList.querySelectorAll('.theater-fav-item__check').forEach(function(cb) {
      cb.addEventListener('change', function(e) {
        e.stopPropagation();
        if (this.checked) {
          _theaterLicenseSelection.add(this.dataset.id);
        } else {
          _theaterLicenseSelection.delete(this.dataset.id);
        }
        _syncTheaterLicenseBtn();
      });
    });
  }

  function openFavPanel() {
    if (!favPanel) return;
    renderFavPanel();
    favPanel.removeAttribute('hidden');
    // アニメのため次フレームで is-open を付与
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        favPanel.classList.add('is-open');
      });
    });
    // コントロールを表示し続ける
    if (modal) modal.classList.remove('controls-hidden');
    clearTimeout(_hideTimer);
  }

  function closeFavPanel() {
    if (!favPanel) return;
    favPanel.classList.remove('is-open');
    favPanel.addEventListener('transitionend', function handler() {
      favPanel.removeEventListener('transitionend', handler);
      if (!favPanel.classList.contains('is-open')) {
        favPanel.setAttribute('hidden', '');
      }
    });
  }

  function playAllFavs() {
    var ids = _getFavIds();
    if (!ids.length) return;
    var allTracks = window.TRACKS || [];
    THEATER_TRACKS = ids.map(function(id) {
      var t = allTracks.find(function(tr) { return tr.id === id; });
      return { id: id, bg: t ? getBgForTrack(t) : DEFAULT_THEATER_TRACKS[0].bg };
    });
    loadTheaterTrack(0, true);
    closeFavPanel();
  }

  function openWithFavorites() {
    var rawIds = [];
    try { rawIds = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch(e){}
    if (!rawIds.length) return;
    THEATER_TRACKS = [];
    var allTracks = window.TRACKS || [];
    for (var i = 0; i < rawIds.length; i++) {
      var tId = rawIds[i];
      var target = (allTracks).find(function(t){ return t.id === tId; });
      if (target) THEATER_TRACKS.push({ id: tId, bg: getBgForTrack(target) });
    }
    if (!THEATER_TRACKS.length) THEATER_TRACKS = DEFAULT_THEATER_TRACKS.slice();
    _executeTheaterOpen(0, true);
  }

  function openTheater(trigger) {
    // PJAX遷移でmodalがnullになっている場合は再取得
    if (!modal) {
      initUI();
    }
    if (!modal) return; // それでもなければ中止

    var trackId = (trigger && trigger.dataset.trackId) || DEFAULT_THEATER_TRACKS[0].id;
    THEATER_TRACKS = DEFAULT_THEATER_TRACKS.slice();
    var foundIdx = THEATER_TRACKS.findIndex(function(t){ return t.id === trackId; });
    _executeTheaterOpen(foundIdx !== -1 ? foundIdx : 0, false);
  }

  var _savedScrollY = 0;

  var _theaterHistoryPushed = false;

  function _executeTheaterOpen(initialIdx, autoPlay) {
    var globalAudio = document.getElementById('player-audio-el');
    if (globalAudio && !globalAudio.paused) globalAudio.pause();
    var p = window.HMIX_PLAYER;
    if (p && typeof p.stop === 'function') {
      // グローバルプレイヤーを完全停止（audio.currentTime=0、state.isPlaying=false）
      // pauseだとロック画面から resume された時に二重鳴りのリスクが残るため stop を使う
      try { p.stop(); } catch(e) {
        if (typeof p.pause === 'function') p.pause();
      }
    } else if (p && typeof p.pause === 'function') {
      p.pause();
    }

    // ── MediaSession をシアター側に付け替え ──
    // これ以降ロック画面の play/pause/prev/next はシアター側 currentAudio を操作する
    window.HMIX_THEATER_ACTIVE = true;
    _bindTheaterMediaSession();

    // ブラウザ戻るボタンでシアターを閉じるための履歴エントリ
    if (!_theaterHistoryPushed) {
      history.pushState({ theater: true }, '', window.location.href);
      _theaterHistoryPushed = true;
    }

    // スクロール位置を保存してCSSクラスで固定（強制リフロー1回に削減）
    _savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.setProperty('--theater-scroll-y', '-' + _savedScrollY + 'px');
    document.body.classList.add('theater-body-lock');

    if (modal) {
      // ── 開場シーケンス：「間」の演出 ──
      // 0ms: 暗転（モーダル表示、背景はまだ暗い）
      modal.classList.add('is-open');
      modal.classList.add('theater-opening');  // 開場中フラグ
      modal.classList.add('controls-hidden');  // UIは最初は隠す

      // 背景を先に準備（非表示・暗め）
      if (scenery) {
        scenery.style.opacity = 0;
        scenery.style.transition = 'none';
        scenery.style.filter = 'brightness(0.5) contrast(1.05)';
      }

      // トラックデータを先にセット（setTimeout 0 でクリックタスクから分離 → INP改善）
      setTimeout(function() {
        loadTheaterTrack(initialIdx, false);
      }, 0);

      // 1.5s: 背景がゆっくり浮かび上がる（暗めから徐々に明るく）
      setTimeout(function() {
        if (scenery) {
          scenery.style.transition = 'opacity 2.5s ease-in, filter 4s ease-in';
          scenery.style.opacity = 1;
          scenery.style.filter = 'brightness(0.85) contrast(1.05) sepia(0.1)';
        }
      }, 1500);

      // 3s: 蛍がぽつぽつ光り始める
      setTimeout(function() {
        spawnFireflies();
      }, 3000);

      // 3.5s: 1曲目が静かに始まる
      setTimeout(function() {
        if (currentAudio) {
          currentAudio.volume = 0;
          currentAudio.play().catch(function(){});
          isPlaying = true;
          updatePlayBtn();
          // 音量をゆっくり上げる（2秒かけて）
          var targetVol = volumeBar ? (parseInt(volumeBar.value) / 100) : 0.8;
          var fadeStep = 50;
          var volInc = targetVol / (2000 / fadeStep);
          var fadeIn = setInterval(function() {
            if (currentAudio.volume + volInc < targetVol) {
              currentAudio.volume += volInc;
            } else {
              currentAudio.volume = targetVol;
              clearInterval(fadeIn);
            }
          }, fadeStep);
          if (scenery) {
            scenery.style.transition = 'opacity 2.5s ease-in, filter 3s ease';
            scenery.style.filter = 'brightness(0.9) contrast(1.05) sepia(0.1)';
          }
        }
      }, 3500);

      // 5.5s: UIコントロールがひっそり現れる
      setTimeout(function() {
        if (modal) modal.classList.remove('theater-opening');
        showControls();
      }, 5500);

      // 6s: 旅のしおり（初回のみ）
      setTimeout(function() {
        _showShiori();
      }, 6000);
    }
  }

  // ── 旅のしおり ──────────────────────────────────────────
  var SHIORI_KEY = 'hmix_shiori_shown';
  var _shioriTimer = null;

  function _showShiori(force) {
    var el = document.getElementById('theater-shiori');
    if (!el) return;

    // 初回のみ（force=true で再表示用ボタンからは常時表示）
    if (!force) {
      try {
        if (localStorage.getItem(SHIORI_KEY)) return;
      } catch(e) {}
    }

    el.removeAttribute('hidden');
    el.classList.remove('is-fading');
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.classList.add('is-visible');
      });
    });

    // 初回表示を記録
    try { localStorage.setItem(SHIORI_KEY, '1'); } catch(e) {}

    // 12秒後に自動フェードアウト
    clearTimeout(_shioriTimer);
    _shioriTimer = setTimeout(function() {
      _hideShiori();
    }, 12000);

    // クリックで即消え
    el.addEventListener('click', function onShioriClick() {
      el.removeEventListener('click', onShioriClick);
      clearTimeout(_shioriTimer);
      _hideShiori();
    });
  }

  function _hideShiori() {
    var el = document.getElementById('theater-shiori');
    if (!el) return;
    el.classList.add('is-fading');
    el.classList.remove('is-visible');
    setTimeout(function() {
      el.setAttribute('hidden', '');
      el.classList.remove('is-fading');
    }, 1500);
  }

  // ── コントロール自動表示 ─────────────────────────────────
  function showControls() {
    if (!modal) return;
    modal.classList.remove('controls-hidden');
    clearTimeout(_hideTimer);
    if (isPlaying && (!scenePickerEl || scenePickerEl.hasAttribute('hidden'))) {
      _hideTimer = setTimeout(function() {
        if (modal && isPlaying) modal.classList.add('controls-hidden');
      }, 3500);
    }
  }

  // ── ライセンスガイド（お気に入りパネル内に表示） ──
  function _showLicenseGuide() {
    // 既存のガイドがあれば削除
    var old = document.getElementById('theater-license-guide');
    if (old) old.remove();

    var guide = document.createElement('div');
    guide.id = 'theater-license-guide';
    guide.style.cssText = 'padding:12px 16px;margin:8px 0;border:1px solid rgba(200,170,80,0.30);border-radius:8px;background:rgba(200,170,80,0.06);font-size:0.78rem;line-height:1.7;color:rgba(255,250,230,0.85);position:relative;';
    guide.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
        '<span style="font-size:1.4rem;animation:guideArrowBlink 1.2s ease-in-out infinite;">→</span>' +
        '<strong style="color:rgba(220,190,100,0.95);font-family:\'Noto Serif JP\',serif;font-size:0.85rem;">商用ライセンスのご案内</strong>' +
      '</div>' +
      '<p style="margin:0;">お気に入り一覧のチェックボックスに印をつけると、<br>商用利用の申請ができます。</p>' +
      '<p style="margin:6px 0 0;font-size:0.72rem;color:rgba(200,180,140,0.60);">¥2,200〜 / 1曲（広告・企業VP・ゲーム収録等）</p>' +
      '<style>@keyframes guideArrowBlink { 0%,100%{opacity:0.4;transform:translateX(0)} 50%{opacity:1;transform:translateX(4px)} }</style>';

    // お気に入りパネルリストの前に挿入
    var panelList = document.getElementById('theater-fav-panel-list');
    if (panelList && panelList.parentNode) {
      panelList.parentNode.insertBefore(guide, panelList);
    }
  }

  function closeTheater() {
    // ×ボタン等から閉じた場合、pushした履歴エントリを除去
    if (_theaterHistoryPushed) {
      _theaterHistoryPushed = false;
      // popstate を発火させずに履歴だけ戻す
      history.back();
    }
    window.dispatchEvent(new CustomEvent('theater:close'));
    if (document.fullscreenElement === modal) {
      document.exitFullscreen().catch(function(){});
    }
    clearTimeout(_hideTimer);
    if (modal) modal.classList.remove('controls-hidden');

    // スクロール位置を復元（モバイルでTOPに飛ぶ問題の修正）
    document.body.classList.remove('theater-body-lock');
    document.body.style.removeProperty('--theater-scroll-y');
    window.scrollTo(0, _savedScrollY);

    if (modal) {
      modal.classList.remove('is-open');
      modal.classList.remove('theater-opening');
      modal.classList.remove('controls-hidden');
    }
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    isPlaying = false;
    updatePlayBtn();

    // ── MediaSession をグローバル側に返却 ──
    window.HMIX_THEATER_ACTIVE = false;
    _unbindTheaterMediaSession();
  }

  function togglePlay() {
    if (!currentAudio || !currentAudio.src) {
      currentAudio = new Audio(trackPath);
      currentAudio.setAttribute('playsinline', '');
      currentAudio.setAttribute('webkit-playsinline', '');
      currentAudio.preload = 'metadata';
      currentAudio.onended = function() {
        isPlaying = false;
        updatePlayBtn();
        if (scenery) scenery.style.filter = 'brightness(0.8) contrast(1.1)';
      };
    }
    if (isPlaying) {
      currentAudio.pause();
      isPlaying = false;
      window.dispatchEvent(new CustomEvent('theater:pause'));
      if (window.HMIX_THEATER_ACTIVE) _updateTheaterPlaybackState('paused');
      if (scenery) scenery.style.filter = 'brightness(0.8) contrast(1.05)';
    } else {
      currentAudio.volume = volumeBar ? (parseInt(volumeBar.value) / 100) : 1;
      currentAudio.play().catch(function(e){ console.warn(e); });
      isPlaying = true;
      window.dispatchEvent(new CustomEvent('theater:play'));
      if (window.HMIX_THEATER_ACTIVE) _updateTheaterPlaybackState('playing');
      if (scenery) scenery.style.filter = 'brightness(0.9) contrast(1.05) sepia(0.1)';
    }
    updatePlayBtn();
  }

  function updatePlayBtn() {
    if (!btnPlay) return;
    var p = btnPlay.querySelector('.tp-play');
    var s = btnPlay.querySelector('.tp-stop');
    if(p) p.style.display = isPlaying ? 'none' : '';
    if(s) s.style.display = isPlaying ? '' : 'none';
    if (modal) modal.classList.toggle('is-playing', isPlaying);
    // 一時停止時はコントロールを常に表示
    if (!isPlaying) {
      clearTimeout(_hideTimer);
      if (modal) modal.classList.remove('controls-hidden');
    } else {
      showControls();
    }
  }

  function toggleFullscreen() {
    var el = modal;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      // 1. まず全体を暗転（modal自体を黒にして白飛びを防ぐ）
      if (scenery) {
        scenery.style.transition = 'none';
        scenery.style.opacity = 0;
      }
      if (el) {
        el.classList.add('controls-hidden');
        el.style.background = '#000';
      }

      // 2. 全画面に入る
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(function(){});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }

      // 3. fullscreenchange イベントでレイアウト安定を待ってからフェードイン
      var _fsFadeHandler = function() {
        document.removeEventListener('fullscreenchange', _fsFadeHandler);
        document.removeEventListener('webkitfullscreenchange', _fsFadeHandler);
        // レイアウトが完全に安定するまで待つ
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            setTimeout(function() {
              if (scenery) {
                scenery.style.transition = 'opacity 2.5s ease-in, filter 3s ease';
                scenery.style.opacity = 1;
              }
              if (el) el.style.background = '';
              setTimeout(function() {
                showControls();
              }, 2500);
            }, 200);
          });
        });
      };
      document.addEventListener('fullscreenchange', _fsFadeHandler);
      document.addEventListener('webkitfullscreenchange', _fsFadeHandler);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  // ── Loop ──────────────────────────────────────────────────
  function toggleLoop() {
    if (!currentAudio) return;
    currentAudio.loop = !currentAudio.loop;
    if (btnLoop) {
      btnLoop.classList.toggle('is-active', currentAudio.loop);
      btnLoop.setAttribute('aria-label', currentAudio.loop ? 'ループ再生オン' : 'ループ再生オフ');
    }
  }

  // ── Share ─────────────────────────────────────────────────
  var _sharePopupEl = null;

  function _getShareInfo() {
    var titleEl = document.getElementById('theater-title');
    var title   = titleEl ? titleEl.textContent.trim() : '';
    var trackUrl = currentTrackId
      ? 'https://www.hmix.net/music/' + currentTrackId + '.html'
      : 'https://www.hmix.net';
    var isEn = window.HMIX_LANG === 'en';
    var text = isEn
      ? '"' + title + '" \u2014 Japanese BGM | H/MIX GALLERY'
      : '\u300c' + title + '\u300d \u2014 H/MIX GALLERY';
    return { title: title, url: trackUrl, text: text };
  }

  function toggleSharePopup() {
    if (!_sharePopupEl) _sharePopupEl = document.getElementById('theater-share-popup');
    if (!_sharePopupEl) return;
    if (_sharePopupEl.hasAttribute('hidden')) {
      _sharePopupEl.removeAttribute('hidden');
      // 外クリックで閉じる
      setTimeout(function() {
        document.addEventListener('click', _closeSharePopupOutside);
      }, 0);
    } else {
      _closeSharePopup();
    }
  }

  function _closeSharePopup() {
    if (_sharePopupEl) _sharePopupEl.setAttribute('hidden', '');
    document.removeEventListener('click', _closeSharePopupOutside);
  }

  function _closeSharePopupOutside(e) {
    var wrap = document.getElementById('theater-share-wrap');
    if (wrap && !wrap.contains(e.target)) _closeSharePopup();
  }

  function _doShare(platform) {
    var info = _getShareInfo();
    var shareUrl;
    if (platform === 'x') {
      shareUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(info.text + ' ' + info.url);
    } else if (platform === 'facebook') {
      shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(info.url);
    } else if (platform === 'line') {
      shareUrl = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(info.url) + '&text=' + encodeURIComponent(info.text);
    } else if (platform === 'bluesky') {
      shareUrl = 'https://bsky.app/intent/compose?text=' + encodeURIComponent(info.text + ' ' + info.url);
    } else if (platform === 'copy') {
      _copyTrackUrl(info.url);
      return;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
    _closeSharePopup();
  }

  function _copyTrackUrl(url) {
    var labelEl = document.getElementById('theater-share-copy-label');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function() {
        if (labelEl) { labelEl.textContent = 'コピーしました'; setTimeout(function(){ labelEl.textContent = 'URLをコピー'; }, 2000); }
        _closeSharePopup();
      }).catch(function() { _fallbackCopy(url, labelEl); });
    } else {
      _fallbackCopy(url, labelEl);
    }
  }

  function _fallbackCopy(url, labelEl) {
    var ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (labelEl) { labelEl.textContent = 'コピーしました'; setTimeout(function(){ labelEl.textContent = 'URLをコピー'; }, 2000); }
    } catch(e) {}
    document.body.removeChild(ta);
    _closeSharePopup();
  }

  // ── Time format ───────────────────────────────────────────
  function formatTime(sec) {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ── Scene Picker ──────────────────────────────────────────
  var SCENE_CATEGORIES = [
    { key: 'forest',     type: 'scene',   ja: '森',         en: 'Forest'      },
    { key: 'night',      type: 'scene',   ja: '夜',         en: 'Night'       },
    { key: 'shrine',     type: 'scene',   ja: '神社',       en: 'Shrine'      },
    { key: 'field',      type: 'scene',   ja: '草原',       en: 'Field'       },
    { key: 'travel',     type: 'scene',   ja: '旅',         en: 'Travel'      },
    { key: 'battle',     type: 'feeling', ja: 'バトル',     en: 'Battle'      },
    { key: 'boss',       type: 'scene',   ja: 'ボス戦',     en: 'Boss'        },
    { key: 'dungeon',    type: 'scene',   ja: 'ダンジョン', en: 'Dungeon'     },
    { key: 'japanese',   type: 'style',   ja: '和風',       en: 'Japanese'    },
    { key: 'fantasy',    type: 'style',   ja: '幻想',       en: 'Fantasy'     },
    { key: 'peaceful',   type: 'feeling', ja: '安らぎ',     en: 'Peaceful'    },
    { key: 'sad',        type: 'feeling', ja: '哀愁',       en: 'Sad'         },
    { key: 'epic',       type: 'feeling', ja: '壮大',       en: 'Epic'        },
    { key: 'dark',       type: 'feeling', ja: 'ダーク',     en: 'Dark'        },
    { key: 'mysterious', type: 'feeling', ja: '神秘',       en: 'Mysterious'  },
  ];

  // タグカテゴリの表示順・日本語ラベル定義
  var TAG_CATEGORY_LABEL = {
    scene:   { ja: 'シーン',  en: 'Scene'   },
    feeling: { ja: '雰囲気',  en: 'Feeling' },
    style:   { ja: 'スタイル', en: 'Style'  },
    story:   { ja: 'ストーリー', en: 'Story' },
  };
  var TAG_CATEGORY_ORDER = ['scene', 'feeling', 'style', 'story'];

  function _buildSceneTags() {
    var tagsEl = document.getElementById('theater-scene-tags');
    if (!tagsEl) return;

    // キャッシュ済みならDOM再構築のみ（O(n×m)ループをスキップ）
    if (_activeTagsCache) {
      _renderSceneTagsFromCache(tagsEl, _activeTagsCache);
      return;
    }

    var meta = window.TAGS_META;
    var allTracks = window.TRACKS || [];

    // キャッシュを構築（初回のみ O(n×m) のループが走る）
    _activeTagsCache = {};
    if (meta) {
      TAG_CATEGORY_ORDER.forEach(function(cat) {
        var tags = meta[cat];
        if (!tags || !tags.length) return;
        _activeTagsCache[cat] = tags.filter(function(t) {
          return allTracks.some(function(tr) {
            return (tr[cat] || []).indexOf(t.id) !== -1;
          });
        });
      });
    }

    _renderSceneTagsFromCache(tagsEl, _activeTagsCache);
  }

  function _renderSceneTagsFromCache(tagsEl, cache) {
    tagsEl.innerHTML = '';
    var isEn = window.HMIX_LANG === 'en';
    var meta = window.TAGS_META;

    if (meta) {
      TAG_CATEGORY_ORDER.forEach(function(cat) {
        var activeTags = cache[cat];
        if (!activeTags || !activeTags.length) return;

        var group = document.createElement('div');
        group.className = 'theater-scene-group';

        var label = document.createElement('p');
        label.className = 'theater-scene-group__label';
        label.textContent = isEn ? TAG_CATEGORY_LABEL[cat].en : TAG_CATEGORY_LABEL[cat].ja;
        group.appendChild(label);

        var wrap = document.createElement('div');
        wrap.className = 'theater-scene-group__tags';
        activeTags.forEach(function(t) {
          var btn = document.createElement('button');
          btn.className = 'theater-scene-tag';
          btn.setAttribute('type', 'button');
          btn.textContent = isEn ? (t.name_en || t.name) : t.name;
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            selectScene({ key: t.id, type: cat });
          });
          wrap.appendChild(btn);
        });
        group.appendChild(wrap);
        tagsEl.appendChild(group);
      });
    } else {
      var wrap = document.createElement('div');
      wrap.className = 'theater-scene-group__tags';
      wrap.style.padding = '0.8rem 1rem';
      SCENE_CATEGORIES.forEach(function(cat) {
        var btn = document.createElement('button');
        btn.className = 'theater-scene-tag';
        btn.setAttribute('type', 'button');
        btn.textContent = isEn ? cat.en : cat.ja;
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          selectScene(cat);
        });
        wrap.appendChild(btn);
      });
      tagsEl.appendChild(wrap);
    }
  }

  function openScenePicker() {
    if (!scenePickerEl) return;
    _buildSceneTags();
    scenePickerEl.removeAttribute('hidden');
    // シーンピッカー内のタッチがコントロール非表示タイマーを誤発火させないようにする
    scenePickerEl.addEventListener('touchstart', function(e) { e.stopPropagation(); }, { passive: true });
    scenePickerEl.addEventListener('click', function(e) { e.stopPropagation(); });
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        scenePickerEl.classList.add('is-open');
      });
    });
    clearTimeout(_hideTimer);
    if (modal) modal.classList.remove('controls-hidden');
  }

  function closeScenePicker() {
    if (!scenePickerEl) return;
    scenePickerEl.classList.remove('is-open');
    scenePickerEl.addEventListener('transitionend', function handler() {
      scenePickerEl.removeEventListener('transitionend', handler);
      if (!scenePickerEl.classList.contains('is-open')) {
        scenePickerEl.setAttribute('hidden', '');
      }
    });
    showControls();
  }

  function selectScene(cat) {
    console.log('[theater] selectScene:', cat);
    var allTracks = window.TRACKS || [];
    if (!cat || !cat.type || !cat.key) {
      console.warn('[theater] Invalid scene category:', cat);
      closeScenePicker();
      return;
    }
    var matched = allTracks.filter(function(t) {
      return (t[cat.type] || []).indexOf(cat.key) !== -1;
    });
    if (!matched.length) {
      console.warn('[theater] No tracks matched for', cat.key);
      closeScenePicker();
      return;
    }
    matched = matched.slice().sort(function() { return Math.random() - 0.5; });
    THEATER_TRACKS = matched.map(function(t) {
      return { id: t.id, bg: getBgForTrack(t) };
    });
    closeScenePicker();
    // 情景切替は新しいプレイリストなので isTransitioning を強制解除
    isTransitioning = false;
    loadTheaterTrack(0, true);
  }

  function _onFullscreenChange() {
    if (modal) {
      var isFull = (document.fullscreenElement === modal) ||
                   (document.webkitFullscreenElement === modal);
      // 全画面解除時もフェード
      if (!isFull && modal.classList.contains('is-fullscreen')) {
        if (scenery) {
          scenery.style.transition = 'none';
          scenery.style.opacity = 0;
        }
        modal.classList.remove('is-fullscreen');
        setTimeout(function() {
          if (scenery) {
            scenery.style.transition = 'opacity 1.2s ease-in';
            scenery.style.opacity = 1;
          }
          showControls();
        }, 200);
      } else {
        modal.classList.toggle('is-fullscreen', isFull);
      }
    }
  }
  document.addEventListener('fullscreenchange', _onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', _onFullscreenChange);

  function fadeOutAudio(audio, duration, callback) {
    if (!audio || audio.volume <= 0) {
      if (callback) callback();
      return;
    }
    var step = 50;
    var startVol = audio.volume;
    var volStep = startVol / (duration / step);
    if (volStep < 0.001) volStep = 0.01; // 極小値ガード
    var elapsed = 0;
    var fade = setInterval(function() {
      elapsed += step;
      if (audio.volume - volStep > 0 && elapsed < duration + 200) {
        audio.volume -= volStep;
      } else {
        audio.volume = 0;
        clearInterval(fade);
        if (callback) callback();
      }
    }, step);
  }

  function spawnFireflies() {
    var wrap = document.getElementById('theater-particles');
    if (!wrap || wrap.hasChildNodes()) return;
    var n = 20;
    function rand(a, b) { return Math.random() * (b - a) + a; }

    // CSS animation で動かす — setInterval 不使用でメインスレッドへの干渉ゼロ
    for (var i = 0; i < n; i++) {
      var el = document.createElement('span');
      el.className = 'window-firefly';
      var size     = rand(3, 8);
      var left     = rand(5, 95);
      var top      = rand(5, 95);
      var duration = rand(5, 12);
      var delay    = rand(0, 6);
      var driftX   = rand(5, 15);
      var driftY   = rand(5, 15);

      el.style.cssText = [
        'position:absolute',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'left:' + left + '%',
        'top:' + top + '%',
        '--ff-dur:' + duration + 's',
        '--ff-delay:' + delay + 's',
        '--ff-dx:' + driftX + '%',
        '--ff-dy:' + driftY + '%',
      ].join(';');

      wrap.appendChild(el);
    }
  }

  // Event Delegation for Open Button
  document.addEventListener('click', function(e) {
    var trigger = e.target.closest('#fm-open-theater');
    if (trigger) openTheater(trigger);
  });

  // Favorites updated
  window.addEventListener('favorites:updated', function () {
    if (currentTrackId) syncFavBtn(currentTrackId);
    // パネルが開いていれば再描画
    if (favPanel && favPanel.classList.contains('is-open')) renderFavPanel();
  });

  // ブラウザ戻るボタンでシアターを閉じる
  window.addEventListener('popstate', function(e) {
    if (_theaterHistoryPushed || (modal && modal.classList.contains('is-open'))) {
      _theaterHistoryPushed = false;
      // closeTheater の本体処理を直接実行（history.back 不要）
      window.dispatchEvent(new CustomEvent('theater:close'));
      if (document.fullscreenElement === modal) {
        document.exitFullscreen().catch(function(){});
      }
      clearTimeout(_hideTimer);
      if (modal) modal.classList.remove('controls-hidden');
      document.body.classList.remove('theater-body-lock');
      document.body.style.removeProperty('--theater-scroll-y');
      window.scrollTo(0, _savedScrollY);
      if (modal) {
        modal.classList.remove('is-open');
        modal.classList.remove('theater-opening');
        modal.classList.remove('controls-hidden');
      }
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      isPlaying = false;
      updatePlayBtn();

      // MediaSession をグローバル側に返却
      window.HMIX_THEATER_ACTIVE = false;
      _unbindTheaterMediaSession();
    }
  });

  // PJAX re-init
  window.addEventListener('hmix:page:init', function() {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        initUI();
      });
    });
  });

  // 楽曲データ準備完了時（非同期ロード対応）
  window.addEventListener('tracks:ready', function () {
    _activeTagsCache = null;  // キャッシュをクリアして次回再構築させる
  });

  // Initial Load
  initUI();

  window.HMIX_THEATER = {
    openWithFavorites: openWithFavorites,
    // 指定IDの曲をシアターで再生（既存キューにあればそこへジャンプ、なければ単曲キューで再生）
    playById: function(trackId) {
      var allTracks = window.TRACKS || [];
      var t = allTracks.find(function(tr) { return tr.id === trackId; });
      if (!t) return;
      var existingIdx = THEATER_TRACKS.findIndex(function(tt) { return tt.id === trackId; });
      if (existingIdx !== -1) {
        loadTheaterTrack(existingIdx, true);
      } else {
        THEATER_TRACKS = [{ id: trackId, bg: getBgForTrack(t) }];
        loadTheaterTrack(0, true);
      }
    }
  };

})();
