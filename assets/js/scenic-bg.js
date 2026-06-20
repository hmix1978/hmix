/* ================================================================
   SCENIC BG — 再生連動の背景演出
   無音時: library-bg.webp（図書館・idle背景）
   再生時: カテゴリ背景（shrine / nightmare / healing など）
   停止時: library-bg.webp に戻る

   依存: player.js（hmix:trackplay CustomEvent を発火すること）
   対象ページ: #scene-bg 要素があるページのみ動作
   ================================================================ */

(function () {
  'use strict';

  // 常に最新のDOMツリーから要素を取得する（PJAX対策）
  function getBgEl() {
    return document.getElementById('scene-bg');
  }

  // ─── 背景画像パス ────────────────────────────────────
  const IDLE_BG = '/images/library-bg.webp'; // 無音時デフォルト

  const BG_IMAGES = {
    nightmare: '/images/scenic-nightmare-purple.webp',
    sorrow:    '/images/scenic-sorrow-memory.webp',
    happy:     '/images/scenic-happy-festival.webp',
    shrine:    '/images/scenic-shrine-sakura.webp',
    healing:   '/images/scenic-healing-forest.webp',
    rpg:       '/images/scenic-rpg-town.webp',
  };

  // ─── 40タグ専用背景（タグ選択時・再生連動より優先） ────
  const S = '/assets/images/scenes/';
  const TAG_BG = {
    // 既存8タグ
    japanese:   S+'japanese.webp',
    battle:     S+'battle.webp',
    forest:     S+'forest.webp',
    night:      S+'night.webp',
    travel:     S+'travel.webp',
    sad:        S+'sad.webp',
    horror:     S+'horror.webp',
    scary:      S+'scary.webp',
    japanese_horror: S+'japanese_horror.webp',
    western_horror:  S+'western_horror.webp',
    happy:      S+'happy.webp',
    // 新タグ — 感情系
    gentle:     S+'gentle.webp',
    mysterious: S+'mysterious.webp',
    suspense:   S+'suspense.webp',
    epic:       S+'epic.webp',
    peaceful:   S+'peaceful.webp',
    dark:       S+'dark.webp',
    victory:    S+'victory.webp',
    defeat:     S+'defeat.webp',
    memory:     S+'memory.webp',
    farewell:   S+'farewell.webp',
    reunion:    S+'reunion.webp',
    dream:      S+'dream.webp',
    happy2:     S+'happy2.webp',
    horror2:    S+'horror2.webp',
    // 新タグ — スタイル系
    oriental:   S+'oriental.webp',
    medieval:   S+'medieval.webp',
    celtic:     S+'celtic.webp',
    fantasy:    S+'fantasy.webp',
    electronic: S+'electronic.webp',
    futuristic: S+'futuristic.webp',
    forest2:    S+'forest2.webp',
    // 新タグ — シーン系
    samurai:    S+'samurai.webp',
    snow:       S+'snow.webp',
    mansion:    S+'mansion.webp',
    morning:    S+'morning.webp',
    church:     S+'church.webp',
    musicbox:   S+'musicbox.webp',
    modern:     S+'modern.webp',
    cute:       S+'cute.webp',
    shrine:     S+'shrine.webp',
    onsen:      S+'onsen.webp',
    festival:   S+'festival.webp',
    cave:       S+'cave.webp',
    ruins:      S+'ruins.webp',
    dungeon:    S+'dungeon.webp',
    field:      S+'field.webp',
    town:       S+'town.webp',
    village:    S+'village.webp',
    boss:       S+'boss.webp',
    ending:     S+'ending.webp',
    opening:    S+'opening.webp',
    conspiracy: S+'conspiracy.webp',
    dailylife:  S+'dailylife.webp',
    destiny:    S+'destiny.webp',
    omen:       S+'omen.webp',
    resolve:    S+'resolve.webp',
    bonds:      S+'bonds.webp',
    pursuit:    S+'pursuit.webp',
    hope:       S+'hope.webp',
    flashback:  S+'flashback.webp',
    despair:    S+'despair.webp',
    flower:     S+'flower.webp',
  };

  // ─── カテゴリ判定マップ（優先順） ────────────────────
  const SCENE_MAP = [
    { key: 'nightmare', tags: ['scary', 'japanese_horror', 'western_horror', 'horror', 'horror2', 'dark', 'cave', 'dungeon',
                                'ruins', 'conspiracy', 'suspense', 'boss'] },
    { key: 'sorrow',    tags: ['sad', 'memory', 'farewell', 'defeat', 'ending'] },
    { key: 'happy',     tags: ['happy', 'happy2', 'festival', 'victory',
                                'peaceful', 'opening', 'reunion'] },
    { key: 'shrine',    tags: ['japanese', 'shrine', 'samurai', 'oriental',
                                'asian', 'onsen'] },
    { key: 'healing',   tags: ['gentle', 'dream', 'forest2', 'peaceful'] },
    { key: 'rpg',       tags: ['fantasy', 'epic', 'battle', 'boss', 'celtic',
                                'medieval', 'field', 'travel', 'forest', 'mysterious',
                                'futuristic', 'electronic', 'town', 'village',
                                'night', 'dungeon', 'ruins', 'cave'] },
  ];

  // ─── 状態 ────────────────────────────────────────────
  var currentUrl       = null;  // 現在 backgroundImage に設定されている URL
  var changeTimer      = null;
  var activeTagKey     = null;  // 選択中の大タグ（null = タグ未選択）
  var currentPlayTrack = null;  // 再生中のトラック（タグ解除時に再生連動へ戻すため）

  // ─── 全タグ取得 ──────────────────────────────────────
  function getAllTags(track) {
    return [].concat(
      track.feeling || [],
      track.style   || [],
      track.scene   || [],
      track.story   || []
    );
  }

  // ─── カテゴリキー判定 ────────────────────────────────
  function getCategoryKey(track) {
    var tags = getAllTags(track);
    for (var i = 0; i < SCENE_MAP.length; i++) {
      var entry = SCENE_MAP[i];
      for (var j = 0; j < entry.tags.length; j++) {
        if (tags.indexOf(entry.tags[j]) !== -1) return entry.key;
      }
    }
    return null; // マッチなし → idle に戻す
  }

  // ─── 背景を切り替える ────────────────────────────────
  // フェードアウト → 画像差し替え → フェードイン
  // fadeDur: フェードアウト待ち時間(ms)。省略時は自動判定
  function switchBg(newUrl, opacityClass, fadeDur) {
    const el = getBgEl();
    if (!el) return;
    opacityClass = opacityClass || 'is-visible';

    if (newUrl === currentUrl) {
      // 同じ画像ならクラスだけ確認
      el.classList.remove('is-idle', 'is-visible');
      el.classList.add(opacityClass);
      return;
    }

    if (changeTimer) clearTimeout(changeTimer);

    // フェードアウト
    el.classList.remove('is-idle', 'is-visible');

    var fd = (fadeDur !== undefined) ? fadeDur
           : (currentUrl ? 500 : 0); // 初回は即座に、以降は 500ms

    changeTimer = setTimeout(function () {
      el.style.backgroundImage = 'url("' + newUrl + '")';
      currentUrl = newUrl;

      // 少し待ってからフェードイン（画像ロード余裕）
      setTimeout(function () {
        el.classList.add(opacityClass);
      }, 60);
    }, fd);
  }

  // ─── idle背景に戻す ──────────────────────────────────
  function restoreIdle() {
    switchBg(IDLE_BG, 'is-idle');
  }

  // ─── タグ解除時: 再生状態に応じた背景に戻す ──────────
  function revertToPlayback() {
    if (currentPlayTrack) {
      var key = getCategoryKey(currentPlayTrack);
      switchBg(key ? BG_IMAGES[key] : IDLE_BG, key ? 'is-visible' : 'is-idle', 400);
    } else {
      restoreIdle();
    }
  }

  // ─── タグクリック: イベント委譲で捕捉 ────────────────
  // .ml-qs-card（上部8タグ）と .ml-chip（下部フィルターパネル全タグ）両対応
  // music-library.js が動的生成するため document レベルで委譲し、
  // toggleFilter が active クラスを付け外しした後に判定する
  document.addEventListener('click', function (e) {
    var el = e.target.closest('.ml-qs-card, .ml-chip[data-val]');
    if (!el) return;

    var tagVal = el.dataset.val;
    if (!tagVal || !TAG_BG[tagVal]) return; // 背景マッピングがないタグは無視

    // toggleFilter が active クラスを付け外しした後に判定
    setTimeout(function () {
      if (el.classList.contains('active')) {
        // アクティブになった → 対応背景を表示
        activeTagKey = tagVal;
        switchBg(TAG_BG[tagVal], 'is-visible', 300);
      } else if (activeTagKey === tagVal) {
        // 同じタグが再クリックで非アクティブに → 他のアクティブタグを探す
        activeTagKey = null;
        var otherActive = document.querySelector('.ml-qs-card.active[data-val], .ml-chip.active[data-val]');
        if (otherActive && TAG_BG[otherActive.dataset.val]) {
          activeTagKey = otherActive.dataset.val;
          switchBg(TAG_BG[activeTagKey], 'is-visible', 300);
        } else {
          revertToPlayback();
        }
      }
    }, 30); // music-library.js の toggleFilter 完了を待つ
  }, false);

  // ─── 初期化: 背景を表示（URL引継ぎ対応） ────────────
  window.HMIX_INIT_SCENIC_BG = function() {
    const el = getBgEl();
    if (!el) return;
    
    // ?bg=<key> があればその情景背景、なければ library-bg
    var urlBgKey = (function () {
      try {
        var k = new URLSearchParams(window.location.search).get('bg');
        return (k && TAG_BG[k]) ? k : null;
      } catch (e) { return null; }
    })();

    var initUrl = urlBgKey ? TAG_BG[urlBgKey] : IDLE_BG;
    var initCls = urlBgKey ? 'is-visible' : 'is-idle';

    el.style.backgroundImage = 'url("' + initUrl + '")';
    currentUrl = initUrl;
    setTimeout(function () {
      el.classList.add(initCls);
    }, 200); // DOMContentLoaded または PJAX 後に確実にフェードイン
  };

  // ─── 再生開始 → カテゴリ背景へ（タグ選択中は無視） ──
  window.addEventListener('hmix:trackplay', function (e) {
    var track = e.detail && e.detail.track;
    if (!track) return;
    currentPlayTrack = track;
    if (activeTagKey) return; // タグ選択中は再生連動より優先
    var key = getCategoryKey(track);
    var bgUrl = key ? BG_IMAGES[key] : IDLE_BG;
    var cls   = key ? 'is-visible' : 'is-idle';
    switchBg(bgUrl, cls);
  });

  // ─── 停止・一時停止 → idle背景に戻す（タグ選択中は維持）
  window.addEventListener('hmix:trackpause', function () {
    currentPlayTrack = null;
    if (activeTagKey) return; // タグ選択中は背景を維持
    restoreIdle();
  });

  // ─── 全てリセット → 図書館背景に戻す ─────────────────
  window.addEventListener('hmix:filterreset', function () {
    activeTagKey = null;
    restoreIdle();
  });

})();
