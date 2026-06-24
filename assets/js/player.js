/* ================================================================
   GLOBAL PLAYER — 神殿の祭壇
   音楽を召喚する祭壇。1つのAudioで全ページを貫く。
   ================================================================ */

(function () {
  'use strict';

  // ===== Audio（1つだけ） =====
  const audio = new Audio();
  audio.preload = 'none';
  // iOS Safari: 全画面化防止 + MediaSession API との相性向上
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');

  // ===== MediaSession API =====
  // iOS/Androidロック画面・Bluetooth機器・MacOS Control Center からの
  // 楽曲情報表示と操作を有効化する。
  const TAG_PRIORITY_MS = [
    'horror', 'scary', 'japanese_horror', 'western_horror',
    'battle', 'boss', 'samurai',
    'sad', 'mysterious', 'dark', 'epic',
    'japanese', 'oriental', 'shrine',
    'fantasy', 'celtic', 'medieval',
    'happy', 'cute', 'gentle', 'peaceful',
    'festival', 'forest', 'night', 'travel',
  ];
  function getPrimaryTagForMediaSession(track) {
    if (!track) return '';
    const all = [].concat(track.feeling || [], track.style || [], track.scene || [], track.story || []);
    return TAG_PRIORITY_MS.find(t => all.includes(t)) || all[0] || '';
  }
  function setMediaSessionMetadata(track) {
    if (!('mediaSession' in navigator) || !track) return;
    if (window.HMIX_THEATER_ACTIVE) return; // シアター側が管理している間は上書きしない
    try {
      const primary = getPrimaryTagForMediaSession(track);
      const artUrl = primary
        ? 'https://www.hmix.net/assets/images/scenes/' + primary + '.webp'
        : 'https://www.hmix.net/assets/images/scenes/dark.webp';
      const titleShown = (window.HMIX_LANG === 'en' && track.title_en) ? track.title_en : (track.title || '—');
      navigator.mediaSession.metadata = new MediaMetadata({
        title: titleShown,
        artist: 'Hirokazu Akiyama',
        album: 'H/MIX GALLERY',
        artwork: [
          { src: artUrl, sizes: '512x512', type: 'image/webp' },
          { src: artUrl, sizes: '256x256', type: 'image/webp' },
          { src: artUrl, sizes: '96x96',  type: 'image/webp' },
        ],
      });
    } catch (e) {
      // MediaMetadata が未サポートのブラウザでは静かに失敗
    }
  }
  // アクションハンドラは一度だけ登録（毎回の loadAndPlay では再登録不要）
  // ただしシアターモードがハンドラを奪った後に戻ってきた場合は再バインドする必要があるため、
  // フラグは theater 側からの 'hmix:mediasession:rebind' イベントでリセットする。
  let _mediaSessionHandlersBound = false;
  function bindMediaSessionHandlers() {
    if (_mediaSessionHandlersBound) return;
    if (!('mediaSession' in navigator)) return;
    // シアターがアクティブな間は登録しない（シアター側のハンドラを上書きしてしまうため）
    if (window.HMIX_THEATER_ACTIVE) return;
    _mediaSessionHandlersBound = true;
    const safe = (fn) => { try { fn(); } catch (e) {} };
    const gate = (fn) => () => {
      // シアターがアクティブな間はグローバルプレイヤーを反応させない（2重再生防止の最後の砦）
      if (window.HMIX_THEATER_ACTIVE) return;
      safe(fn);
    };
    try {
      navigator.mediaSession.setActionHandler('play',  gate(() => window.HMIX_PLAYER && window.HMIX_PLAYER.play()));
      navigator.mediaSession.setActionHandler('pause', gate(() => window.HMIX_PLAYER && window.HMIX_PLAYER.pause()));
      navigator.mediaSession.setActionHandler('previoustrack', gate(() => playPrev()));
      navigator.mediaSession.setActionHandler('nexttrack',     gate(() => playNext()));
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (window.HMIX_THEATER_ACTIVE) return;
        if (details && details.seekTime != null && isFinite(details.seekTime)) {
          safe(() => { audio.currentTime = details.seekTime; });
        }
      });
      navigator.mediaSession.setActionHandler('stop', gate(() => window.HMIX_PLAYER && window.HMIX_PLAYER.stop()));
    } catch (e) { /* 一部ハンドラ未サポートのブラウザは無視 */ }
  }

  // シアターモードがハンドラを剥がした後に、グローバル側へ戻す
  window.addEventListener('hmix:mediasession:rebind', function () {
    _mediaSessionHandlersBound = false;
    bindMediaSessionHandlers();
    // 現在の曲が残っていればメタデータも戻す
    const track = state.queue[state.currentIndex];
    if (track) setMediaSessionMetadata(track);
    updateMediaSessionPlaybackState(state.isPlaying ? 'playing' : 'paused');
  });
  // 位置情報（iOS ロック画面のスクラブバー対応）— throttle 250ms
  let _lastPositionUpdate = 0;
  function updateMediaSessionPositionState() {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    if (window.HMIX_THEATER_ACTIVE) return; // シアター側が管理している間は触らない
    const now = Date.now();
    if (now - _lastPositionUpdate < 250) return;
    _lastPositionUpdate = now;
    try {
      const d = audio.duration;
      const t = audio.currentTime;
      if (!isFinite(d) || d <= 0) return;
      navigator.mediaSession.setPositionState({
        duration: d,
        playbackRate: audio.playbackRate || 1,
        position: Math.min(Math.max(t, 0), d),
      });
    } catch (e) {}
  }
  function updateMediaSessionPlaybackState(stateStr) {
    if (!('mediaSession' in navigator)) return;
    if (window.HMIX_THEATER_ACTIVE) return; // シアター側が管理している間は触らない
    try { navigator.mediaSession.playbackState = stateStr; } catch (e) {}
  }

  // ===== 状態 =====
  const state = {
    queue: [],          // 再生キュー（tracks配列のサブセット）
    currentIndex: -1,   // キュー内のインデックス
    isPlaying: false,
    volume: 80,
    repeatMode: 'none', // 'none' | 'all' | 'one'
    shuffleOn: false,
    shuffleOrder: [],   // シャッフル時の順序
    _suppressAutoPlay: false, // 暴走防止フラグ
    lastStoppedIndex: -1,
  };

  // ===== TAG_LABELS =====
  const TAG_LABELS = {
    gentle:'優しい', sad:'悲しい', happy:'楽しい', epic:'勇壮',
    dark:'暗い', mysterious:'神秘', suspense:'緊迫', scary:'怖い', horror:'ホラー', japanese_horror:'和風ホラー', western_horror:'洋風ホラー',
    japanese:'和風', fantasy:'幻想', celtic:'ケルト', medieval:'中世',
    oriental:'アジアン', futuristic:'近未来', electronic:'電子音',
    battle:'戦闘', boss:'ボス', town:'街', village:'村', field:'フィールド',
    forest:'森', night:'夜', travel:'旅', dungeon:'ダンジョン', ruins:'遺跡',
    cave:'洞窟', festival:'祭り', opening:'オープニング', ending:'エンディング',
    shrine:'神社', samurai:'サムライ',
    memory:'思い出', reunion:'再会', farewell:'別れ', victory:'勝利',
    defeat:'敗北', peaceful:'平和', dream:'夢', conspiracy:'陰謀',
    onsen:'温泉',
  };
  const TAG_LABELS_EN = {
    gentle:'Gentle', sad:'Sad', happy:'Happy', epic:'Epic',
    dark:'Dark', mysterious:'Mysterious', suspense:'Suspense', scary:'Scary', horror:'Horror', japanese_horror:'Japanese Horror', western_horror:'Western Horror',
    japanese:'Japanese', fantasy:'Fantasy', celtic:'Celtic', medieval:'Medieval',
    oriental:'Asian', futuristic:'Futuristic', electronic:'Electronic',
    battle:'Battle', boss:'Boss', town:'Town', village:'Village', field:'Field',
    forest:'Forest', night:'Night', travel:'Travel', dungeon:'Dungeon', ruins:'Ruins',
    cave:'Cave', festival:'Festival', opening:'Opening', ending:'Ending',
    shrine:'Shrine', samurai:'Samurai',
    memory:'Memory', reunion:'Reunion', farewell:'Farewell', victory:'Victory',
    defeat:'Defeat', peaceful:'Peaceful', dream:'Dream', conspiracy:'Conspiracy',
    onsen:'Hot Spring',
  };

  function getTrackTitle(track) {
    return (window.HMIX_LANG === 'en' && track.title_en) ? track.title_en : (track.title || '—');
  }
  function getTagLabelPlayer(id) {
    return (window.HMIX_LANG === 'en' ? TAG_LABELS_EN[id] : TAG_LABELS[id]) || id;
  }

  // ===== お気に入り管理 — localStorage を source of truth =====
  const FAV_KEY    = 'hmix_favorites';
  const RECENT_KEY = 'hmix_recent_tracks';
  const RECENT_MAX = 20;

  // FavStore（window.HMIX_FAV）= 単一の心臓へ委譲。localStorage直接アクセスはしない。
  function getFavSet() {
    try { return new Set(window.HMIX_FAV ? window.HMIX_FAV.ids() : []); }
    catch(e) { return new Set(); }
  }

  function saveRecentTrack(id) {
    if (!id) return;
    try {
      let ids = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      ids = ids.filter(i => String(i) !== String(id));  // 重複排除
      ids.unshift(String(id));                           // 先頭に追加
      if (ids.length > RECENT_MAX) ids = ids.slice(0, RECENT_MAX);
      localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
      window.dispatchEvent(new CustomEvent('recent:updated', { detail: { ids } }));
    } catch(e) {}
  }

  function saveFavSet(set) {
    if (!window.HMIX_FAV) return;
    var want = new Set([...set].map(String));
    var have = new Set(window.HMIX_FAV.ids());
    have.forEach(function (id) { if (!want.has(id)) window.HMIX_FAV.remove(id); });
    want.forEach(function (id) { if (!have.has(id)) window.HMIX_FAV.add(id); });
    // 発火は FavStore 側（favorites:updated）が担う
  }

  function toggleFav(id) {
    if (!id) return;
    if (window.HMIX_FAV) {
      // 0-5 Undo: 削除はトースト経由で確定、追加は即時
      if (window.HMIX_FAV.has(String(id))) window.HMIX_FAV.removeWithUndo(String(id));
      else window.HMIX_FAV.add(String(id));
      return;
    }
    const set = getFavSet();
    if (set.has(id)) set.delete(id); else set.add(id);
    saveFavSet(set);
  }

  // ===== DOM要素 =====
  let elPlayer, elTitle, elTags, elPlay, elPrev, elNext;
  let elSeekbar, elProgress, elThumb, elTime;
  let elRepeat, elShuffle, elVolume;
  let elFavBtn, elFavCount;
  let _prevFavCount = -1;   // Phase2: 件数変化検出で脈動演出
  // 「ひとつの心臓」の鼓動: 要素を一瞬脈打たせる（reduced-motionはCSS側で無効化）
  function favPulse(el){
    if (!el) return;
    el.classList.remove('fav-pulse'); void el.offsetWidth; el.classList.add('fav-pulse');
    setTimeout(function(){ if (el) el.classList.remove('fav-pulse'); }, 680);
  }

  // ===== 初期化 =====
  function init() {
    elPlayer  = document.getElementById('global-player');
    if (!elPlayer) return; // プレイヤーがないページはスキップ

    elTitle   = document.getElementById('player-track-title');
    elTags    = document.getElementById('player-track-tags');
    elPlay    = document.getElementById('player-btn-play');
    elPrev    = document.getElementById('player-btn-prev');
    elNext    = document.getElementById('player-btn-next');
    elSeekbar = document.getElementById('player-seekbar');
    elProgress= document.getElementById('player-seek-progress');
    elThumb   = document.getElementById('player-seek-thumb');
    elTime    = document.getElementById('player-time');
    elRepeat  = document.getElementById('player-btn-repeat');
    elShuffle = document.getElementById('player-btn-shuffle');
    elVolume  = document.getElementById('player-volume');
    elFavBtn  = document.getElementById('player-btn-fav');
    elFavCount= document.getElementById('player-fav-count');

    // localStorageから状態を復元
    loadState();

    // tracks.jsが読み込まれていればキューを初期化
    const allTracks = getTracksData();
    if (allTracks.length && state.queue.length === 0) {
      state.queue = allTracks;
      buildShuffleOrder();
      restoreCurrentIndex();
    }

    // 音量を適用
    audio.volume = state.volume / 100;
    if (elVolume) elVolume.value = state.volume;

    // UIを復元
    updateUI();

    // イベントリスナー
    bindEvents();

    // 前のページで再生中だった場合は位置を復元（自動再生はしない）
    if (state.currentIndex >= 0 && state.queue[state.currentIndex]) {
      const track = state.queue[state.currentIndex];
      audio.src = resolveMp3(track.mp3);
      restoreAudioTime();
      setMediaSessionMetadata(track);
      bindMediaSessionHandlers();
      // 自動再生は行わない（ブラウザポリシー対応）
    }

    // グローバルに公開
    window.HMIX_PLAYER = {
      playTrack,
      playTrackById,
      setQueue,
      getState: () => state,
      pause: () => {
        if (state.isPlaying) {
          audio.pause();
          // state.isPlaying = false; // audio.pause リスナーで更新
          saveState();
        }
      },
      play: function () {
        if (!state.isPlaying && state.currentIndex >= 0) {
          audio.play().catch(function () {});
        }
      },
      seek: function (sec) { audio.currentTime = sec; },
      getAudio: function () { return audio; },
      stop: function () {
        if (state.currentIndex >= 0 && state.queue[state.currentIndex]) {
          state.lastStoppedIndex = state.currentIndex;
        }
        audio.pause();
        audio.currentTime = 0;
        state.isPlaying = false;
        state.currentIndex = -1;
        state._suppressAutoPlay = true; // 次のplay実行まで自動再生を抑制
        updateUI();
        saveState();
        dispatchStateEvent('stopped');
        updateMediaSessionPlaybackState('none');
      }
    };
  }

  // ===== 言語変更時に表示を更新 =====
  window.addEventListener('hmix:lang', function () { updateUI(); });

  // ===== 標準化されたイベント発信 =====
  function dispatchStateEvent(playerState) {
    const track = state.queue[state.currentIndex];
    const trackId = track ? track.id : null;
    
    const detail = {
      trackId: trackId,
      isPlaying: state.isPlaying,
      state: playerState // 'playing' | 'paused' | 'stopped' | 'error'
    };
    
    window.dispatchEvent(new CustomEvent('hmix:player:state', { detail }));
  }

  // ===== tracks.jsデータ取得（新曲優先ソート） =====
  // ソート順: n系を最優先、番号の大きい順（新曲→旧曲）
  // アルファベット優先順: n > c > k > z > v > r > o > f > d > m
  const PREFIX_ORDER = ['n','c','k','z','v','r','o','f','d','m'];

  function sortTracksNewFirst(arr) {
    return arr.slice().sort((a, b) => {
      const ma = a.id.match(/^([a-z]+)(\d+)$/);
      const mb = b.id.match(/^([a-z]+)(\d+)$/);
      if (!ma || !mb) return 0;
      const pa = PREFIX_ORDER.indexOf(ma[1]);
      const pb = PREFIX_ORDER.indexOf(mb[1]);
      const orderA = pa < 0 ? 99 : pa;
      const orderB = pb < 0 ? 99 : pb;
      // まずアルファベット順（n優先）
      if (orderA !== orderB) return orderA - orderB;
      // 同じアルファベット内は番号の大きい順（新曲優先）
      return parseInt(mb[2]) - parseInt(ma[2]);
    });
  }

  function getTracksData() {
    const raw = (typeof window.TRACKS !== 'undefined') ? window.TRACKS
              : (typeof TRACKS !== 'undefined') ? TRACKS
              : (typeof tracks !== 'undefined') ? tracks : [];
    return sortTracksNewFirst(raw);
  }

  // ===== localStorage =====
  const LS_KEY = 'hmix_player_state';
  const STATE_SAVE_INTERVAL = 5000;
  let _lastStateSaveAt = 0;

  function saveState() {
    try {
      const track = state.queue[state.currentIndex];
      const save = {
        currentId: track ? track.id : null,
        currentTime: track && isFinite(audio.currentTime) ? Math.floor(audio.currentTime) : 0,
        volume: state.volume,
        repeatMode: state.repeatMode,
        shuffleOn: state.shuffleOn,
      };
      localStorage.setItem(LS_KEY, JSON.stringify(save));
    } catch (e) {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.volume !== undefined) state.volume = saved.volume;
      if (saved.repeatMode) state.repeatMode = saved.repeatMode;
      if (saved.shuffleOn !== undefined) state.shuffleOn = saved.shuffleOn;
      // currentIdはキュー構築後に解決
      state._savedId = saved.currentId;
      state._savedTime = Number(saved.currentTime) || 0;
    } catch (e) {}
  }

  function restoreCurrentIndex() {
    if (!state._savedId) return;
    const idx = state.queue.findIndex(t => t.id === state._savedId);
    if (idx >= 0) state.currentIndex = idx;
    delete state._savedId;
  }

  function restoreAudioTime() {
    const sec = Number(state._savedTime) || 0;
    if (!sec) return;
    const apply = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = Math.min(sec, Math.max(0, audio.duration - 1));
      } else {
        audio.currentTime = sec;
      }
      delete state._savedTime;
      updateMediaSessionPositionState();
    };
    if (audio.readyState >= 1) apply();
    else audio.addEventListener('loadedmetadata', apply, { once: true });
  }

  function saveStateThrottled() {
    const now = Date.now();
    if (now - _lastStateSaveAt < STATE_SAVE_INTERVAL) return;
    _lastStateSaveAt = now;
    saveState();
  }

  // ===== シャッフル順序 =====
  function buildShuffleOrder() {
    state.shuffleOrder = state.queue.map((_, i) => i);
    // Fisher-Yates shuffle
    for (let i = state.shuffleOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.shuffleOrder[i], state.shuffleOrder[j]] = [state.shuffleOrder[j], state.shuffleOrder[i]];
    }
  }

  // ===== 曲を再生（外部から呼び出し可能） =====
  function playTrack(track, queue) {
    if (!track) return;

    // キューを設定
    if (queue && queue.length > 0) {
      state.queue = queue;
      buildShuffleOrder();
    } else if (state.queue.length === 0) {
      state.queue = getTracksData();
      buildShuffleOrder();
    }

    // インデックスを特定
    const idx = state.queue.findIndex(t => t.id === track.id);
    state.currentIndex = idx >= 0 ? idx : 0;
    delete state._savedTime;

    loadAndPlay(track);
  }

  function playTrackById(id) {
    const currentTrack = state.queue[state.currentIndex];
    if (currentTrack && currentTrack.id === id && state.isPlaying) {
      // 現在再生中の曲が再度呼ばれたら停止（カード側からのトグル動作）
      window.HMIX_PLAYER.stop();
      return;
    }

    const allTracks = getTracksData();
    const track = allTracks.find(t => t.id === id);
    if (track) playTrack(track, allTracks);
  }

  function setQueue(tracks, startIndex) {
    state.queue = tracks;
    state.currentIndex = startIndex || 0;
    buildShuffleOrder();
    loadAndPlay(tracks[state.currentIndex]);
  }

  // ===== 曲読み込み・再生 =====
  // ===== mp3パスにBASE_PATHを補完 =====
  function resolveMp3(mp3) {
    if (!mp3) return '';
    // すでに絶対フURLまたはdata:/blob:の場合はそのまま
    if (mp3.startsWith('http') || mp3.startsWith('data:') || mp3.startsWith('blob:')) return mp3;
    // mp3パスは常にサイトルート基準（/music/n/n1.mp3など）なので、BASE_PATHは付与しない
    // 理由: mp3ファイルは/test2026/配下ではなくサイトルートの/music/配下に存在する
    return mp3;
  }

  function loadAndPlay(track) {
    if (!track) return;

    // フェードアウト
    elPlayer && elPlayer.classList.add('track-changing');

    const mp3url = resolveMp3(track.mp3);

    state._suppressAutoPlay = false; // 新たな曲の再生要求なのでフラグ解除

    setTimeout(() => {
      if (state._suppressAutoPlay) return; // 待機中に stop() されたら中断

      // 既に同じソースなら先頭に戻すだけ
      if (audio.src !== mp3url) {
        audio.src = mp3url;
        audio.load();
      }
      audio.currentTime = 0;

      // MediaSession: ロック画面/Bluetooth機器に曲情報を表示
      setMediaSessionMetadata(track);
      bindMediaSessionHandlers();

      const doPlay = () => {
        if (state._suppressAutoPlay) {
          return;
        }

        audio.play().then(() => {
          state.isPlaying = true;
          updateUI();
          saveState();
          saveRecentTrack(track.id);  // 最近再生に記録
          elPlayer && elPlayer.classList.remove('track-changing');
          // 背景演出: 再生開始イベントを発火（scenic-bg.js が受信）
          window.dispatchEvent(new CustomEvent('hmix:trackplay', { detail: { track: track } }));
        }).catch((err) => {
          console.warn('[HMIX Player] play() failed:', err.name, err.message, mp3url);
          state.isPlaying = false;
          updateUI();
          elPlayer && elPlayer.classList.remove('track-changing');
          dispatchStateEvent('error');
        });
      };

      // メタデータ読み込み完了を待ってから再生
      if (audio.readyState >= 2) {
        doPlay();
      } else {
        audio.addEventListener('canplay', doPlay, { once: true });
        // タイムアウト保険（ネットワーク遅延対応）
        setTimeout(() => {
          if (!state.isPlaying && !state._suppressAutoPlay) doPlay();
        }, 2000);
      }
    }, 100);
  }

  // ===== 再生/停止トグル =====
  function togglePlay() {
    if (state.currentIndex < 0 || !state.queue[state.currentIndex]) {
      // 停止直後は止めた曲から再開し、完全未選択の場合だけ最初の曲を再生
      const allTracks = getTracksData();
      if (allTracks.length) {
        state.queue = allTracks;
        const resumeIndex = (state.lastStoppedIndex >= 0 && state.lastStoppedIndex < allTracks.length)
          ? state.lastStoppedIndex
          : 0;
        state.currentIndex = resumeIndex;
        buildShuffleOrder();
        loadAndPlay(allTracks[resumeIndex]);
      }
      return;
    }

    if (state.isPlaying) {
      window.HMIX_PLAYER.stop(); // プレイヤーボタンも完全停止動作に統一
      return;
    } else {
      const track = state.queue[state.currentIndex];
      const mp3url = resolveMp3(track.mp3);
      if (!audio.src || audio.src === window.location.href || audio.src !== mp3url) {
        audio.src = mp3url;
        audio.load();
      }
      const doResume = () => {
        audio.play().then(() => {
          state.isPlaying = true;
          updateUI();
          saveState();
          // 背景演出: resume 時も scenic-bg.js に通知
          window.dispatchEvent(new CustomEvent('hmix:trackplay', { detail: { track: track } }));
        }).catch((err) => {
          console.warn('[HMIX Player] resume failed:', err.name, err.message);
        });
      };
      if (audio.readyState >= 2) {
        doResume();
      } else {
        audio.addEventListener('canplay', doResume, { once: true });
        setTimeout(() => { if (!state.isPlaying) doResume(); }, 2000);
      }
    }
  }

  // ===== 次の曲 =====
  function playNext() {
    if (state.queue.length === 0) return;

    if (state.shuffleOn) {
      const curShufflePos = state.shuffleOrder.indexOf(state.currentIndex);
      const nextPos = (curShufflePos + 1) % state.shuffleOrder.length;
      state.currentIndex = state.shuffleOrder[nextPos];
    } else {
      state.currentIndex = (state.currentIndex + 1) % state.queue.length;
    }

    loadAndPlay(state.queue[state.currentIndex]);
  }

  // ===== 前の曲 =====
  function playPrev() {
    if (state.queue.length === 0) return;

    // 3秒以上再生済みなら先頭に戻る
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (state.shuffleOn) {
      const curShufflePos = state.shuffleOrder.indexOf(state.currentIndex);
      const prevPos = (curShufflePos - 1 + state.shuffleOrder.length) % state.shuffleOrder.length;
      state.currentIndex = state.shuffleOrder[prevPos];
    } else {
      state.currentIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length;
    }

    loadAndPlay(state.queue[state.currentIndex]);
  }

  // ===== リピートモード切り替え =====
  function cycleRepeat() {
    const modes = ['none', 'all', 'one'];
    const cur = modes.indexOf(state.repeatMode);
    state.repeatMode = modes[(cur + 1) % modes.length];
    updateRepeatUI();
    saveState();
  }

  // ===== シャッフル切り替え =====
  function toggleShuffle() {
    state.shuffleOn = !state.shuffleOn;
    if (state.shuffleOn) buildShuffleOrder();
    updateShuffleUI();
    saveState();
  }

  // ===== シーク =====
  let isSeeking = false;

  function onSeekbarClick(e) {
    const rect = elSeekbar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audio.duration && !isNaN(audio.duration)) {
      audio.currentTime = ratio * audio.duration;
    }
  }

  // ===== 時間フォーマット =====
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ===== UI更新 =====
  function updateUI() {
    if (!elPlayer) return;

    const track = state.queue[state.currentIndex];

    // 曲名・タグ
    if (track) {
      if (elTitle) elTitle.textContent = getTrackTitle(track);
      if (elTags) {
        const allTags = [...(track.feeling||[]), ...(track.style||[]), ...(track.scene||[])];
        elTags.innerHTML = allTags.slice(0, 3).map(t =>
          `<span class="player-tag">${getTagLabelPlayer(t)}</span>`
        ).join('');
      }
    }

    // 再生/停止アイコン
    if (elPlay) {
      const iconPlay  = elPlay.querySelector('.icon-play');
      const iconPause = elPlay.querySelector('.icon-pause');
      if (iconPlay)  iconPlay.style.display  = state.isPlaying ? 'none' : '';
      if (iconPause) iconPause.style.display = state.isPlaying ? '' : 'none';
    }

    // プレイヤー全体のクラス
    if (state.isPlaying) {
      elPlayer.classList.add('playing');
    } else {
      elPlayer.classList.remove('playing');
    }

    updateRepeatUI();
    updateShuffleUI();
    updateFavUI();
  }

  function updateFavUI() {
    const track = state.queue[state.currentIndex];
    const favSet = getFavSet();
    const faved  = track ? favSet.has(track.id) : false;
    const count  = favSet.size;

    if (elFavBtn) {
      // Phase 1.5C: 曲が選択されていない場合は無効化
      elFavBtn.disabled = !track;
      const off = elFavBtn.querySelector('.icon-heart-off');
      const on  = elFavBtn.querySelector('.icon-heart-on');
      if (off) off.style.display = faved ? 'none' : '';
      if (on)  on.style.display  = faved ? '' : 'none';
      elFavBtn.classList.toggle('is-fav', faved);
      elFavBtn.setAttribute('aria-pressed', String(faved));
      elFavBtn.setAttribute('aria-label', faved ? 'お気に入りから削除' : 'お気に入りに追加');
    }
    if (elFavCount) {
      elFavCount.textContent = count > 0 ? String(count) : '0';
    }
    // Phase2 脈拍: 件数が変わったらバッジが脈打つ。増えた時は♥も灯す。
    if (_prevFavCount !== -1 && count !== _prevFavCount) {
      favPulse(elFavCount);
      if (count > _prevFavCount) favPulse(elFavBtn);
    }
    _prevFavCount = count;
  }

  function updateRepeatUI() {
    if (!elRepeat) return;
    elRepeat.dataset.mode = state.repeatMode;
    const labels = { none: 'リピートなし', all: '全曲リピート', one: '1曲リピート' };
    elRepeat.title = labels[state.repeatMode] || '';
  }

  function updateShuffleUI() {
    if (!elShuffle) return;
    elShuffle.dataset.active = state.shuffleOn ? 'true' : 'false';
    elShuffle.title = state.shuffleOn ? 'シャッフルON' : 'シャッフルOFF';
  }

  // ===== イベントバインド =====
  function bindEvents() {
    if (elPlay)    elPlay.addEventListener('click', togglePlay);
    if (elPrev)    elPrev.addEventListener('click', playPrev);
    if (elNext)    elNext.addEventListener('click', playNext);
    if (elRepeat)  elRepeat.addEventListener('click', cycleRepeat);
    if (elShuffle) elShuffle.addEventListener('click', toggleShuffle);

    // お気に入り: プレイヤーから現在曲をトグル
    if (elFavBtn) {
      elFavBtn.addEventListener('click', () => {
        const track = state.queue[state.currentIndex];
        if (!track) return;
        toggleFav(track.id);
      });
    }

    // favorites:updated を受けて UI を再描画（カード側の操作にも追従）
    window.addEventListener('favorites:updated', updateFavUI);

    if (elSeekbar) {
      elSeekbar.addEventListener('click', onSeekbarClick);
      elSeekbar.addEventListener('mousedown', () => { isSeeking = true; });
      document.addEventListener('mouseup', () => { isSeeking = false; });
      elSeekbar.addEventListener('mousemove', (e) => {
        if (!isSeeking) return;
        onSeekbarClick(e);
      });
    }

    if (elVolume) {
      elVolume.addEventListener('input', () => {
        state.volume = parseInt(elVolume.value, 10);
        audio.volume = state.volume / 100;
        saveState();
      });
    }

    // Audio イベント
    audio.addEventListener('timeupdate', () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      const ratio = audio.currentTime / audio.duration;
      if (elProgress) elProgress.style.width = (ratio * 100) + '%';
      if (elThumb)    elThumb.style.left     = (ratio * 100) + '%';
      if (elTime)     elTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
      // MediaSession のスクラブバー位置更新（内部で 250ms throttle）
      updateMediaSessionPositionState();
      saveStateThrottled();
    });

    audio.addEventListener('play', () => {
      state.isPlaying = true;
      updateUI();
      dispatchStateEvent('playing');
      updateMediaSessionPlaybackState('playing');
    });

    audio.addEventListener('pause', () => {
      // state.isPlaying は HMIX_PLAYER.stop() の場合は既に false
      // audio.pause() だけの場合（ブラウザ介入やpause()呼び出し）に備える
      if (!state._suppressAutoPlay) {
        state.isPlaying = false;
      }
      updateUI();
      dispatchStateEvent(state._suppressAutoPlay ? 'stopped' : 'paused');
      updateMediaSessionPlaybackState(state._suppressAutoPlay ? 'none' : 'paused');
      // 背景演出: idle背景に戻す
      window.dispatchEvent(new CustomEvent('hmix:trackpause'));
    });

    audio.addEventListener('ended', () => {
      state.isPlaying = false;
      if (state.repeatMode === 'one') {
        const track = state.queue[state.currentIndex];
        if (track) loadAndPlay(track);
      } else if (state.repeatMode === 'all' || (state.currentIndex < state.queue.length - 1)) {
        playNext();
      } else {
        window.HMIX_PLAYER.stop();
      }
    });

    audio.addEventListener('error', () => {
      state.isPlaying = false;
      updateUI();
    });

    window.addEventListener('beforeunload', saveState);
  }

  // ===== DOMContentLoaded後に初期化 =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      // tracks.jsが後から読み込まれる場合の対応
      setTimeout(() => {
        const allTracks = getTracksData();
        if (allTracks.length && state.queue.length === 0) {
          state.queue = allTracks;
          buildShuffleOrder();
          restoreCurrentIndex();
          if (state.currentIndex >= 0 && state.queue[state.currentIndex]) {
            const track = state.queue[state.currentIndex];
            audio.src = resolveMp3(track.mp3);
            restoreAudioTime();
            setMediaSessionMetadata(track);
            bindMediaSessionHandlers();
          }
          updateUI();
        }
      }, 100);
    });
  } else {
    init();
    setTimeout(() => {
      const allTracks = getTracksData();
      if (allTracks.length && state.queue.length === 0) {
        state.queue = allTracks;
        buildShuffleOrder();
        restoreCurrentIndex();
        if (state.currentIndex >= 0 && state.queue[state.currentIndex]) {
          const track = state.queue[state.currentIndex];
          audio.src = resolveMp3(track.mp3);
          restoreAudioTime();
          setMediaSessionMetadata(track);
          bindMediaSessionHandlers();
        }
        updateUI();
      }
    }, 100);
  }

})();

/* 楽曲人気度トラッキング (play-counter.js) を自動ロード。
   player.js は音の鳴る全ページで読み込まれるため、ここから注入すれば
   各HTMLに script タグを足す必要がない（シアター系は個別に読み込む）。 */
(function () {
  if (window.HMIX_PLAYS || document.querySelector('script[data-hmix-plays]')) return;
  var s = document.createElement('script');
  s.src = '/assets/js/play-counter.js?v=20260613';
  s.defer = true;
  s.setAttribute('data-hmix-plays', '1');
  document.head.appendChild(s);
})();
