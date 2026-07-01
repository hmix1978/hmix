/**
 * H/MIX GALLERY — Music Library JS v3.0
 * 新タグ構造: feeling / style / scene / story
 * 機能: Hero検索・QuickScene・FilterPanel・ActiveFilters・カード生成・Load More・試聴・URLパラメータ
 */

(function () {
  'use strict';


  // ─── 設定 ───────────────────────────────────────
  const PAGE_SIZE = 24;

  // Quick Scene カード定義（SVGインライン）— 新8タグ
  const QUICK_SCENES = [
    { label: 'Japanese', labelJp: '和風',   cat: 'style',   val: 'japanese', svgFile: 'japanese.svg' },
    { label: 'Battle',   labelJp: '戦闘',   cat: 'scene',   val: 'battle',   svgFile: 'battle.svg' },
    { label: 'Forest',   labelJp: '森',     cat: 'scene',   val: 'forest',   svgFile: 'forest.svg' },
    { label: 'Night',    labelJp: '夜',     cat: 'scene',   val: 'night',    svgFile: 'night.svg' },
    { label: 'Travel',   labelJp: '旅',     cat: 'scene',   val: 'travel',   svgFile: 'travel.svg' },
    { label: 'Sad',      labelJp: '切ない', cat: 'feeling', val: 'sad',      svgFile: 'sad.svg' },
    { label: 'Horror',   labelJp: 'ホラー', cat: 'feeling', val: 'scary',    svgFile: 'horror.svg' },
    { label: 'Happy',    labelJp: '楽しい', cat: 'feeling', val: 'happy',    svgFile: 'happy.svg' },
  ];

  // SVGインライン定義（currentColorでCSS色制御可能）— 新8タグ対応
  const SCENE_SVG = {
    'japanese.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16h40"/><path d="M18 24h28"/><path d="M20 16l4 8"/><path d="M44 16l-4 8"/><path d="M22 24v24"/><path d="M42 24v24"/><path d="M16 48h32"/></g></svg>`,
    'battle.svg':   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10l8 8-4 4 16 16-6 6-16-16-4 4-8-8 14-14z"/><path d="M46 10l-8 8 4 4-16 16 6 6 16-16 4 4 8-8-14-14z"/><path d="M24 46l-6 6"/><path d="M40 46l6 6"/></g></svg>`,
    'forest.svg':   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M32 8l12 16H20L32 8z"/><path d="M32 18l14 18H18L32 18z"/><path d="M32 30l16 20H16l16-20z"/><path d="M32 50v8"/><path d="M24 58h16"/></g></svg>`,
    'night.svg':    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M40 12c-10 2-18 11-18 22 0 12 10 22 22 22 8 0 15-4 19-11-2 .5-4 .8-6 .8-13 0-24-11-24-24 0-3 .3-6 1-9 2 0 4-.2 6-.8z"/><path d="M18 16v6"/><path d="M15 19h6"/><path d="M48 18v4"/><path d="M46 20h4"/></g></svg>`,
    'travel.svg':   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="4"/><path d="M32 12l6 14-6 6-6-6 6-14z"/><path d="M52 32l-14 6-6-6 6-6 14 6z" opacity=".7"/></g></svg>`,
    'sad.svg':      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M40 10C30 12 22 21 22 32c0 12 10 22 22 22 8 0 15-4 18-11-2 1-4 1-6 1-13 0-23-10-23-23 0-4 1-8 3-11z"/><path d="M22 38l-4 10"/><path d="M30 44l-2 10"/><path d="M38 44l2 8"/></g></svg>`,
    'horror.svg':   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 52L32 12l20 40z"/><path d="M19 41C24 34 40 34 45 41C40 48 24 48 19 41z"/><circle cx="32" cy="41" r="5"/><path d="M32 6v6"/></g></svg>`,
    'happy.svg':    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 42L18 20L42 14L42 36"/><circle cx="12" cy="42" r="7"/><circle cx="36" cy="36" r="7"/><path d="M18 30L42 24"/></g></svg>`,
  };

  // タグ日本語ラベル
  const TAG_LABELS = {
    // feeling
    gentle: '優しい', sad: '悲しい', happy: '楽しい', epic: '勇壮',
    dark: '暗い', mysterious: '神秘', suspense: '緊迫', scary: '怖い', horror: 'ホラー', japanese_horror: '和風ホラー', western_horror: '洋風ホラー',
    // style
    fantasy: 'ファンタジー', japanese: '和風', celtic: 'ケルト', medieval: '中世',
    oriental: 'アジアン', futuristic: '近未来', electronic: '電子音',
    // scene
    battle: '戦闘', boss: 'ボス', town: '街', village: '村', field: 'フィールド',
    forest: '森', night: '夜', travel: '旅', dungeon: 'ダンジョン', ruins: '遺跡',
    cave: '洞窟', festival: '祭り', opening: 'オープニング', ending: 'エンディング',
    onsen: '温泉', shrine: '神社', samurai: 'サムライ',
    // story
    memory: '思い出', reunion: '再会', farewell: '別れ', victory: '勝利',
    defeat: '敗北', peaceful: '平和', dream: '夢', conspiracy: '陰謀',
  };

  // タグ英語ラベル（TAGS_META の name_en フィールドから構築）
  const TAG_LABELS_EN = {};

  // tracks.js でエクスポートされたユーザー定義の全タグメタデータがあれば、マージする
  if (typeof window !== 'undefined' && typeof window.TAGS_META !== 'undefined') {
    for (const cat in window.TAGS_META) {
      window.TAGS_META[cat].forEach(t => {
        TAG_LABELS[t.id] = t.name;
        if (t.name_en) TAG_LABELS_EN[t.id] = t.name_en;
      });
    }
  }

  // ─── 言語ユーティリティ ──────────────────────────
  function getCurrentLang() {
    return window.HMIX_LANG || (function() {
      try { return sessionStorage.getItem('hmix_lang') || 'ja'; } catch(e) { return 'ja'; }
    })();
  }

  function trackEvent(eventName, params) {
    if (!eventName) return;
    if (window.hmixTrack) {
      window.hmixTrack(eventName, params || {});
    } else if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, Object.assign({
        page_type: document.body.getAttribute('data-page-type') || '',
        source_path: location.pathname,
        lang: getCurrentLang()
      }, params || {}));
    }
  }

  function findTrackById(trackId) {
    return allTracks.find(function (track) {
      return String(track.id) === String(trackId);
    }) || null;
  }

  function buildTrackParams(trackId, surface, extra) {
    var track = typeof trackId === 'object' ? trackId : findTrackById(trackId);
    var params = {
      surface: surface || 'music_library',
      track_id: track ? String(track.id) : String(trackId || ''),
      track_title: track ? (track.title || '') : '',
      track_title_en: track ? (track.title_en || '') : ''
    };
    extra = extra || {};
    Object.keys(extra).forEach(function (key) {
      params[key] = extra[key];
    });
    return params;
  }

  function getTrackTitle(track) {
    return (getCurrentLang() === 'en' && track.title_en) ? track.title_en : (track.title || '');
  }

  function getTrackDescription(track) {
    return (getCurrentLang() === 'en' && track.description_en)
      ? track.description_en
      : (track.description || '');
  }

  function getTrackDescriptionShort(track) {
    const desc = getTrackDescription(track);
    return desc ? desc.slice(0, 60) + (desc.length > 60 ? '…' : '') : '';
  }

  function getCardUiText() {
    const isEn = getCurrentLang() === 'en';
    return {
      play: isEn ? 'Play' : '試聴',
      tools: isEn ? 'Tools' : '制作ツール',
      detail: isEn ? 'Details' : '詳細を見る',
      tagAria: isEn ? 'Tags' : 'タグ',
      playAria: isEn ? 'Play preview of ' : ' を試聴',
      toolsAria: isEn ? 'Open creator tools for ' : ' の制作ツールを開く',
      detailAria: isEn ? 'View details for ' : ' の詳細を見る',
      favAria: isEn ? 'Add to favorites: ' : ' をお気に入りに追加',
      downloadAria: isEn ? 'Download ' : ' をダウンロード'
    };
  }

  function getTagLabel(id) {
    const isEn = getCurrentLang() === 'en';
    return (isEn ? TAG_LABELS_EN[id] : TAG_LABELS[id]) || id;
  }

  // ─── 静的テキストの言語切替 ──────────────────────
  function applyLangToPage() {
    const isEn = getCurrentLang() === 'en';

    // data-ja / data-en を持つ全要素のテキストを切替
    document.querySelectorAll('[data-ja][data-en]').forEach(el => {
      el.textContent = isEn ? el.dataset.en : el.dataset.ja;
    });

    // プレースホルダー切替
    document.querySelectorAll('[data-placeholder-ja][data-placeholder-en]').forEach(el => {
      el.placeholder = isEn ? el.dataset.placeholderEn : el.dataset.placeholderJa;
    });

    // トグルボタンの表示を更新（グローブ + JP/EN 強調表示）
    const btn = document.getElementById('ml-lang-toggle');
    if (btn) btn.innerHTML = '<svg class="lang-globe" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" width="11" height="11" aria-hidden="true"><circle cx="6" cy="6" r="5.3"/><path d="M1.5 4.5h9M1.5 7.5h9M6 0.7C4.3 2.5 3.5 4.2 3.5 6s.8 3.5 2.5 5.3M6 0.7C7.7 2.5 8.5 4.2 8.5 6s-.8 3.5-2.5 5.3"/></svg>' +
      (isEn ? '<span class="lang-opt">JP</span><span class="lang-sep"> / </span><span class="lang-opt lang-opt--active">EN</span>'
             : '<span class="lang-opt lang-opt--active">JP</span><span class="lang-sep"> / </span><span class="lang-opt">EN</span>');
  }

  function syncVisibleCardsLang() {
    document.querySelectorAll('.ml-card').forEach(function (card) {
      var trackId = card.dataset.trackId;
      var track = allTracks.find(function (t) { return String(t.id) === String(trackId); });
      if (!track) return;
      var displayTags = [
        ...(track.scene   || []).slice(0, 1),
        ...(track.feeling || []).slice(0, 1),
        ...(track.style   || []).slice(0, 1),
      ].slice(0, 2);
      var titleEl = card.querySelector('.ml-card-title');
      if (titleEl) titleEl.textContent = getTrackTitle(track);
      var descEl = card.querySelector('.ml-card-desc');
      var descShort = getTrackDescriptionShort(track);
      if (descEl) {
        descEl.textContent = descShort;
      } else if (descShort) {
        var tagsElForInsert = card.querySelector('.ml-card-tags');
        if (tagsElForInsert) {
          var p = document.createElement('p');
          p.className = 'ml-card-desc';
          p.textContent = descShort;
          tagsElForInsert.parentNode.insertBefore(p, tagsElForInsert);
        }
      }
      var tagsEl = card.querySelector('.ml-card-tags');
      if (tagsEl) {
        tagsEl.setAttribute('aria-label', getCardUiText().tagAria);
        tagsEl.innerHTML = displayTags.map(function (t) {
          return '<span class="ml-card-tag">' + escHtml(getTagLabel(t)) + '</span>';
        }).join('');
      }
      var ui = getCardUiText();
      var playBtn = card.querySelector('.ml-btn-play');
      var playLabel = card.querySelector('.play-label');
      var toolsBtn = card.querySelector('.ml-btn-tools');
      var toolsLabel = toolsBtn ? toolsBtn.querySelector('.tools-label') : null;
      var detailLink = card.querySelector('.ml-btn-detail');
      var favBtn = card.querySelector('.ml-btn-fav');
      var dlLink = card.querySelector('.ml-btn-dl');
      var displayTitle = getTrackTitle(track);
      if (playLabel) playLabel.textContent = ui.play;
      if (playBtn) playBtn.setAttribute('aria-label', getCurrentLang() === 'en' ? ui.playAria + displayTitle : displayTitle + ui.playAria);
      if (toolsLabel) toolsLabel.textContent = ui.tools;
      if (toolsBtn) toolsBtn.setAttribute('aria-label', getCurrentLang() === 'en' ? ui.toolsAria + displayTitle : displayTitle + ui.toolsAria);
      if (detailLink) {
        detailLink.setAttribute('aria-label', getCurrentLang() === 'en' ? ui.detailAria + displayTitle : displayTitle + ui.detailAria);
      }
      if (favBtn) favBtn.setAttribute('aria-label', getCurrentLang() === 'en' ? ui.favAria + displayTitle : displayTitle + ui.favAria);
      if (dlLink) dlLink.setAttribute('aria-label', getCurrentLang() === 'en' ? ui.downloadAria + displayTitle : displayTitle + ui.downloadAria);
    });
  }

  function syncLibraryLanguage() {
    applyLangToPage();
    buildFilterChips();
    syncFilterUI();
    updateActiveFiltersBar();
    syncVisibleCardsLang();
    updateResultsCondition();
  }

  // ─── 状態 ───────────────────────────────────────
  let allTracks = [];
  let filteredTracks = [];
  let displayedCount = 0;
  let searchTrackTimer = 0;
  let lastTrackedSearchLength = 0;
  let _initScheduled = false; // 同一フレーム内の二重初期化防止
  let _globalListenersInitialized = false; // グローバルリスナーの二重登録防止

  // ─── お気に入り ──────────────────────────────────
  // FavStore（window.HMIX_FAV）= 単一の心臓。localStorage直接アクセスはしない。
  const favorites = new Set(window.HMIX_FAV ? window.HMIX_FAV.ids() : []);

  function saveFavorites() {
    // in-memoryキャッシュ favorites を FavStore へ差分反映（発火はFavStore側）。
    if (!window.HMIX_FAV) return;
    var want = new Set([...favorites].map(String));
    var have = new Set(window.HMIX_FAV.ids());
    have.forEach(function (id) { if (!want.has(id)) window.HMIX_FAV.remove(id); });
    want.forEach(function (id) { if (!have.has(id)) window.HMIX_FAV.add(id); });
  }

  // favorites:updated（player.js など外部から発火）→ カードUI を再同期
  function syncFavButtons() {
    // localStorage を正とし、in-memory Set を更新
    try {
      const fresh = new Set(window.HMIX_FAV ? window.HMIX_FAV.ids() : []);
      favorites.clear();
      fresh.forEach(id => favorites.add(id));
    } catch(e) {}
    // 表示中の全カードボタンを更新
    document.querySelectorAll('.ml-btn-fav[data-track-id]').forEach(btn => {
      const faved = favorites.has(btn.dataset.trackId);
      btn.classList.toggle('is-fav', faved);
      btn.textContent = faved ? '♥' : '♡';
      btn.setAttribute('aria-pressed', String(faved));
    });
  }

  // favorites:updated は initGlobalListeners 内に集約

  // recent:updated は initGlobalListeners 内に集約

  // ═══════════════════════════════════════════════════════
  //  Phase 2 — お気に入りリストモーダル
  // ═══════════════════════════════════════════════════════


  const activeFilters = {
    feeling: new Set(),
    style:   new Set(),
    scene:   new Set(),
    story:   new Set(),
  };

  let showFavOnly    = false;
  let showRecentOnly = false;
  let activeDurationFilter = '';  // '', 'short', 'medium', 'long'
  let currentSort = 'popular';   // 既定=人気順。他: 'default'(おすすめ), 'newest', 'duration-asc', 'duration-desc', 'title'

  const RECENT_KEY = 'hmix_recent_tracks';
  function getRecentIds() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').map(String); }
    catch(e) { return []; }
  }

  // ─── 人気スコア（再生・お気に入りの時間減衰集計） ─────────
  // getRankings は CDN キャッシュ10分。取得後は sessionStorage に10分キャッシュ。
  const RANKINGS_URL = 'https://asia-northeast1-hmix-footprints.cloudfunctions.net/getRankings';
  const RANKINGS_CACHE_KEY = 'hmix_rankings_v1';
  const POPULARITY_EXCLUDED_IDS = new Set(['n1']);
  function isPopularityExcluded(id) {
    return POPULARITY_EXCLUDED_IDS.has(String(id || ''));
  }
  let popularScores = null;        // { trackId: score }
  let popularFetching = null;
  function fetchPopularScores() {
    if (popularScores) return Promise.resolve(popularScores);
    if (popularFetching) return popularFetching;
    try {
      const c = JSON.parse(sessionStorage.getItem(RANKINGS_CACHE_KEY) || 'null');
      if (c && c.scores && Date.now() - c.ts < 10 * 60 * 1000) {
        popularScores = c.scores;
        return Promise.resolve(popularScores);
      }
    } catch (e) {}
    popularFetching = fetch(RANKINGS_URL)
      .then(r => r.json())
      .then(j => {
        popularScores = (j && j.scores) || {};
        try { sessionStorage.setItem(RANKINGS_CACHE_KEY, JSON.stringify({ ts: Date.now(), scores: popularScores })); } catch (e) {}
        return popularScores;
      })
      .catch(() => (popularScores = {}))
      .finally(() => { popularFetching = null; });
    return popularFetching;
  }
  // ─── 人気ランク（上位N曲にバッジ）。popularScores変化で自動再計算 ───
  const POPULAR_BADGE_TOP_N = 10;
  let popularRankMap = null, popularRankSrc = null;
  function getPopularRankMap() {
    if (!popularScores) return null;
    if (popularRankMap && popularRankSrc === popularScores) return popularRankMap;
    const s = popularScores;
    const ids = Object.keys(s).filter(id => !isPopularityExcluded(id) && (s[id] || 0) > 0).sort((a, b) => (s[b] || 0) - (s[a] || 0));
    const m = {};
    for (let i = 0; i < Math.min(ids.length, POPULAR_BADGE_TOP_N); i++) m[ids[i]] = i + 1;
    popularRankMap = m; popularRankSrc = s;
    return m;
  }

  // ─── DOM取得 ────────────────────────────────────
  let grid, searchInput, searchClear, resultCount, resultsCond;
  let emptyState, emptyReset, loadMoreWrap, loadMoreBtn, loadMoreCount;
  let filterResetBtn, activeFiltersEl, activeChipsEl, clearAllBtn;
  let audio, quickSceneGrid, sortSelect;
  let journeyGlowTimer = null;

  // ─── 人気ランキング ──────────────────────────────────────
  // 1位から順に定義。ランク外の曲は後ろに続く（新曲優先）
  const POPULARITY_RANKS = {
    'n74':  1,  // Moment
    'c7':   2,  // 星寂の散歩道
    'n51':  3,  // 伝承の丘
    'c2':   4,  // 日時計の丘
    'n72':  5,  // 宵祭りの風
    'n103': 6,  // 志は死なない
    'n46':  7,  // Dear Childhood Friend
    'n123': 8,  // いつかの大地へ
  };

  // ─── デフォルトソート（人気順 → 新曲優先）────────────────
  const ML_PREFIX_ORDER = ['n','c','k','z','v','r','o','f','d','m'];

  function sortTracksNewFirst(arr) {
    return arr.slice().sort((a, b) => {
      const ra = POPULARITY_RANKS[a.id] ?? Infinity;
      const rb = POPULARITY_RANKS[b.id] ?? Infinity;
      // ランク付きは先頭に（昇順）
      if (ra !== rb) return ra - rb;
      // ランク外は既存の新曲優先ロジック
      const ma = a.id.match(/^([a-z]+)(\d+)$/);
      const mb = b.id.match(/^([a-z]+)(\d+)$/);
      if (!ma || !mb) return 0;
      const oa = ML_PREFIX_ORDER.indexOf(ma[1]);
      const ob = ML_PREFIX_ORDER.indexOf(mb[1]);
      const orderA = oa < 0 ? 99 : oa;
      const orderB = ob < 0 ? 99 : ob;
      if (orderA !== orderB) return orderA - orderB;
      return parseInt(mb[2]) - parseInt(ma[2]);
    });
  }

  // ─── 初期化 ───────────────────────────────────────────
  function init() {
    // ライブラリページでなければスキップ
    var pageEl = document.getElementById('page-content');
    if (!pageEl || pageEl.dataset.pageType !== 'library') return;

    // 同一フレーム内の二重呼び出し防止（DOMContentLoaded + hmix:page:init 同時発火対策）
    if (_initScheduled) return;
    _initScheduled = true;
    requestAnimationFrame(function () { _initScheduled = false; });


    initGlobalListeners();
    _initCore();
  }

  function initGlobalListeners() {
    if (_globalListenersInitialized) return;
    _globalListenersInitialized = true;


    // ─── タグチップ クリック（イベント委譲・一度だけ登録）────────
    // querySelectorAll の一回スキャンではなく document レベルで捕捉することで
    // PJAX遷移直後でも確実に反応する
    document.addEventListener('click', function(e) {
      const chip = e.target.closest('.ml-chip[data-cat]');
      if (!chip) return;
      const pageEl = document.getElementById('page-content');
      if (!pageEl || pageEl.dataset.pageType !== 'library') return;
      toggleFilter(chip.dataset.cat, chip.dataset.val);
    });

    // ─── Hero内人気タグ クリック（イベント委譲・一度だけ登録）────
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.ml-hero-tag-btn[data-cat]');
      if (!btn) return;
      const pageEl = document.getElementById('page-content');
      if (!pageEl || pageEl.dataset.pageType !== 'library') return;
      toggleFilter(btn.dataset.cat, btn.dataset.val);
      document.getElementById('ml-filter-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // プレイヤー状態のグローバル同期
    window.addEventListener('hmix:player:state', (e) => {
      const { trackId, isPlaying } = e.detail;
      syncPlayerUI(trackId, isPlaying);
    });

    // お気に入り・最近再生の更新
    window.addEventListener('favorites:updated', () => {
      syncFavButtons();
      if (showFavOnly) applyFilters();
      // お気に入りモーダルが開いていれば再描画（モーダル内ノードへのクロージャ回避のため毎回DOM検索）
      const modal = document.getElementById('fav-modal');
      if (modal && !modal.hidden) {
        // renderList を外部に逃がすか、ここで都度実行
        window.dispatchEvent(new CustomEvent('hmix:favmodal:render'));
      }
    });

    window.addEventListener('recent:updated', () => {
      if (showRecentOnly) applyFilters();
    });

    // ─── 言語トグル（イベント委譲・一度だけ登録）────────────────
    // ※ setupEventListeners() 内に書くと PJAX 遷移のたびにリスナーが積み重なるため
    //    ここで一度だけ登録し、library ページ以外ではスキップ
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('#ml-lang-toggle');
      if (!btn) return;
      var pageEl = document.getElementById('page-content');
      if (!pageEl || pageEl.dataset.pageType !== 'library') return;
      var next = getCurrentLang() === 'en' ? 'ja' : 'en';
      window.HMIX_LANG = next;
      sessionStorage.setItem('hmix_lang', next);
      try { window.dispatchEvent(new CustomEvent('hmix:lang', { detail: { lang: next } })); } catch (e2) {}
      syncLibraryLanguage();
    });

    window.addEventListener('hmix:lang', function () {
      var pageEl = document.getElementById('page-content');
      if (!pageEl || pageEl.dataset.pageType !== 'library') return;
      syncLibraryLanguage();
    });
  }

  function _initCore() {
    window.__hmixLibRunId = (window.__hmixLibRunId || 0) + 1;
    const runId = window.__hmixLibRunId;

    grid            = document.getElementById('ml-grid');
    if (!grid) {
      return;
    }
    applyCardDesignVariant();
    grid.innerHTML = ''; // PJAX再遷移時の残留カードをリセット

    searchInput     = document.getElementById('ml-search');
    searchClear     = document.getElementById('ml-search-clear');
    resultCount     = document.getElementById('ml-result-count');
    resultsCond     = document.getElementById('ml-results-condition');
    emptyState      = document.getElementById('ml-empty');
    emptyReset      = document.getElementById('ml-empty-reset');
    loadMoreWrap    = document.getElementById('ml-loadmore-wrap');
    loadMoreBtn     = document.getElementById('ml-loadmore-btn');
    loadMoreCount   = document.getElementById('ml-loadmore-count');
    filterResetBtn  = document.getElementById('ml-filter-reset');
    activeFiltersEl = document.getElementById('ml-active-filters');
    activeChipsEl   = document.getElementById('ml-active-chips');
    clearAllBtn     = document.getElementById('ml-active-clear-all');
    audio           = document.getElementById('ml-audio');
    quickSceneGrid  = document.getElementById('ml-quick-scene-grid');
    sortSelect      = document.getElementById('ml-sort-select');

    // 言語設定の復元（sessionStorage → window.HMIX_LANG）
    var savedLang = sessionStorage.getItem('hmix_lang');
    if (savedLang === 'en' || savedLang === 'ja') window.HMIX_LANG = savedLang;
    applyLangToPage();

    // セットアップ（TRACKS不要）
    buildQuickSceneCards();
    setupEventListeners();

    // END CTA
    document.getElementById('end-cta-fav-btn')?.addEventListener('click', () => {
      document.getElementById('fav-modal-trigger')?.click();
    });

    // TRACKS 準備完了後に描画
    initLibraryWhenReady(runId);
  }

  // ─── TRACKS 待機 → 描画 ───────────────────────────
  function initLibraryWhenReady(runId) {
    const rawTracks = window.TRACKS;
    if (rawTracks && rawTracks.length) {
      _renderWithTracks(rawTracks);
      return;
    }

    window.addEventListener('tracks:ready', function onTracksReady() {
      window.removeEventListener('tracks:ready', onTracksReady);
      _renderWithTracks(window.TRACKS || []);
    });
  }

  function _renderWithTracks(rawTracks) {

    // tracks.jsがロードされてTAGS_METAが確実に存在するタイミングで生成
    // TAG_LABELS / TAG_LABELS_EN をここで確実に構築する
    if (window.TAGS_META) {
      for (const cat in window.TAGS_META) {
        window.TAGS_META[cat].forEach(t => {
          TAG_LABELS[t.id] = t.name;
          if (t.name_en) TAG_LABELS_EN[t.id] = t.name_en;
        });
      }
    }
    buildFilterChips();
    // ボタン生成後にURLパラメータからアクティブ状態を反映する
    applyURLParams();

    // MP3ファイルが存在しない曲を除外（r10等：durationSecがない＝MP3解析できなかった）
    allTracks = sortTracksNewFirst(rawTracks.filter(t => t.durationSec));
    applyFilters();
    syncFavButtons();
    
    // PJAX復帰時や初回ロード時に現在の再生状態を反映
    if (window.HMIX_PLAYER) {
      const pState = window.HMIX_PLAYER.getState();
      const track = pState.queue[pState.currentIndex];
      syncPlayerUI(track ? track.id : null, pState.isPlaying);
    }
  }

  // ─── フィルターチップ自動生成 ──────────────────────
  function buildFilterChips() {
    
    let renderedCount = 0;

    ['feeling', 'style', 'scene', 'story'].forEach(cat => {
      const container = document.getElementById('filter-' + cat);
      
      if (!container) return;
      container.innerHTML = ''; // HTMLの直書きをクリア
      
      let tags = [];
      if (typeof window !== 'undefined' && window.TAGS_META && window.TAGS_META[cat]) {
        tags = window.TAGS_META[cat];
      }
      
      const frag = document.createDocumentFragment();
      tags.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'ml-chip';
        btn.dataset.cat = cat;
        btn.dataset.val = t.id;
        btn.textContent = (getCurrentLang() === 'en' && t.name_en) ? t.name_en : t.name;
        frag.appendChild(btn);
        renderedCount++;
      });
      container.appendChild(frag);
    });
    
  }

  // ─── タグチップの候補数更新（0件のチップを disabled に）──
  function updateChipAvailability() {
    document.querySelectorAll('.ml-chip[data-cat][data-val]').forEach(chip => {
      const cat = chip.dataset.cat;
      const val = chip.dataset.val;

      // duration チップはスキップ（別ロジック）
      if (cat === 'duration') return;

      // このチップが既に active なら常に有効
      if (activeFilters[cat] && activeFilters[cat].has(val)) {
        chip.classList.remove('ml-chip--empty');
        chip.disabled = false;
        return;
      }

      // 「もしこのタグを追加したら何曲残るか」をシミュレーション
      const count = filteredTracks.filter(track => {
        const trackTags = track[cat] || [];
        return trackTags.includes(val);
      }).length;

      if (count === 0) {
        chip.classList.add('ml-chip--empty');
        chip.disabled = true;
      } else {
        chip.classList.remove('ml-chip--empty');
        chip.disabled = false;
      }
    });
  }

  // ─── Quick Scene カード生成 ──────────────────────
  function buildQuickSceneCards() {
    if (!quickSceneGrid) return;
    const frag = document.createDocumentFragment();
    QUICK_SCENES.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'ml-qs-card';
      btn.dataset.cat = s.cat;
      btn.dataset.val = s.val;
      const svgMarkup = SCENE_SVG[s.svgFile] || '';
      btn.innerHTML = `
        <span class="ml-qs-icon scene-icon" aria-hidden="true">${svgMarkup}</span>
        <span class="ml-qs-label">${s.label}</span>
        <span class="ml-qs-label-jp">${s.labelJp}</span>
      `;
      btn.addEventListener('click', () => {
        toggleFilter(s.cat, s.val);
      });
      frag.appendChild(btn);
    });
    quickSceneGrid.appendChild(frag);
  }

  // ─── URLパラメータ処理 ───────────────────────────
  function applyURLParams() {
    const params = new URLSearchParams(window.location.search);

    // PJAXによる再初期化の際、前回の状態が残らないようすべてクリアする
    ['feeling', 'style', 'scene', 'story'].forEach(cat => activeFilters[cat].clear());
    showFavOnly = false;
    showRecentOnly = false;
    activeDurationFilter = '';
    currentSort = 'popular';

    const q = params.get('q');
    if (q && searchInput) {
      searchInput.value = q;
      searchClear.hidden = false;
    } else if (searchInput) {
      searchInput.value = '';
      searchClear.hidden = true;
    }

    const journeyCats = ['feeling', 'style', 'scene', 'story'];
    journeyCats.forEach(cat => {
      params.getAll(cat).forEach(val => {
        if (!val) return;
        val.split(',').forEach(v => {
          const trimmed = v.trim();
          if (!trimmed) return;
          const embeddedParam = trimmed.match(/^([a-z]+)=(.+)$/);
          if (embeddedParam && activeFilters[embeddedParam[1]]) {
            activeFilters[embeddedParam[1]].add(embeddedParam[2].trim());
            return;
          }
          activeFilters[cat].add(trimmed);
        });
      });
    });
    const hasInitialJourney =
      journeyCats.some(cat => activeFilters[cat].size > 0);

    const sort = params.get('sort');
    const allowedSorts = ['default', 'popular', 'newest', 'duration-asc', 'duration-desc', 'title'];
    currentSort = allowedSorts.includes(sort) ? sort : 'popular';
    if (sortSelect) sortSelect.value = currentSort;
    if (currentSort === 'popular') {
      fetchPopularScores().then(() => applyFilters());
    }

    syncFilterUI();
    if (hasInitialJourney) {
      scheduleJourneyConditionPowerUp();
    }
  }

  // ─── フィルターUI同期 ────────────────────────────
  function syncFilterUI() {
    document.querySelectorAll('.ml-chip[data-cat]').forEach(chip => {
      const cat = chip.dataset.cat;
      const val = chip.dataset.val;
      if (cat === 'duration') {
        // duration は排他
        const isActive = activeDurationFilter === val;
        chip.classList.toggle('active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
      } else if (activeFilters[cat] && activeFilters[cat].has(val)) {
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
      } else {
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
      }
    });
    // Quick Scene カードも同期
    document.querySelectorAll('.ml-qs-card').forEach(card => {
      const cat = card.dataset.cat;
      const val = card.dataset.val;
      if (activeFilters[cat] && activeFilters[cat].has(val)) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
    // 最近再生フィルターボタンの状態同期
    const recentFilterBtn = document.getElementById('ml-recent-filter-btn');
    if (recentFilterBtn) {
      recentFilterBtn.setAttribute('aria-pressed', String(showRecentOnly));
    }

    // お気に入りフィルターボタンの状態同期
    const favFilterBtn = document.getElementById('ml-fav-filter-btn');
    if (favFilterBtn) {
      favFilterBtn.setAttribute('aria-pressed', String(showFavOnly));
      const off = favFilterBtn.querySelector('.icon-fav-off');
      const on  = favFilterBtn.querySelector('.icon-fav-on');
      if (off) off.style.display = showFavOnly ? 'none' : '';
      if (on)  on.style.display  = showFavOnly ? '' : 'none';
    }
    updateActiveFiltersBar();
  }

  // ─── Active Filters Bar 更新 ─────────────────────
  function updateActiveFiltersBar() {
    if (!activeChipsEl) return;
    activeChipsEl.innerHTML = '';

    let hasAny = false;

    // 最近再生フィルターチップ
    if (showRecentOnly) {
      hasAny = true;
      const chip = document.createElement('button');
      chip.className = 'ml-active-chip ml-active-chip--recent';
      chip.innerHTML = `🕐 最近再生 <span aria-hidden="true">×</span>`;
      chip.setAttribute('aria-label', '最近再生フィルターを解除');
      chip.addEventListener('click', () => {
        showRecentOnly = false;
        syncFilterUI();
        applyFilters();
      });
      activeChipsEl.appendChild(chip);
    }

    // お気に入りフィルターチップ
    if (showFavOnly) {
      hasAny = true;
      const chip = document.createElement('button');
      chip.className = 'ml-active-chip ml-active-chip--fav';
      chip.innerHTML = `♡ お気に入りのみ <span aria-hidden="true">×</span>`;
      chip.setAttribute('aria-label', 'お気に入りフィルターを解除');
      chip.addEventListener('click', () => {
        showFavOnly = false;
        syncFilterUI();
        applyFilters();
      });
      activeChipsEl.appendChild(chip);
    }

    // 時間フィルターチップ
    if (activeDurationFilter) {
      hasAny = true;
      const dLabels = { jingle: '25秒以内', vshort: '1分以内', short: '2分以内', medium: '2〜4分', long: '4分以上' };
      const dLabel = dLabels[activeDurationFilter] || activeDurationFilter;
      const chip = document.createElement('button');
      chip.className = 'ml-active-chip ml-active-chip--duration';
      chip.innerHTML = `◷ ${dLabel} <span aria-hidden="true">×</span>`;
      chip.setAttribute('aria-label', `${dLabel} フィルターを解除`);
      chip.addEventListener('click', () => {
        activeDurationFilter = '';
        syncFilterUI();
        applyFilters();
      });
      activeChipsEl.appendChild(chip);
    }

    ['feeling', 'style', 'scene', 'story'].forEach(cat => {
      activeFilters[cat].forEach(val => {
        hasAny = true;
        const label = getTagLabel(val);
        const chip = document.createElement('button');
        chip.className = 'ml-active-chip ml-selected-condition-chip';
        chip.dataset.cat = cat;
        chip.dataset.val = val;
        chip.innerHTML = `${label} <span aria-hidden="true">×</span>`;
        chip.setAttribute('aria-label', `${label} を解除`);
        chip.addEventListener('click', () => {
          toggleFilter(cat, val);
        });
        activeChipsEl.appendChild(chip);
      });
    });

    if (activeFiltersEl) {
      activeFiltersEl.hidden = !hasAny;
    }
  }

  function pulseJourneyConditions() {
    const targets = Array.from(document.querySelectorAll(
      '#ml-active-chips .ml-selected-condition-chip, ' +
      '#ml-active-chips .ml-active-chip, ' +
      '.ml-left-tag-list .ml-chip[aria-pressed="true"], ' +
      '.ml-left-tag-list .ml-chip.active, ' +
      '#ml-filter-panel .ml-chip[aria-pressed="true"], ' +
      '#ml-filter-panel .ml-chip.active'
    ));
    if (!targets.length) return;
    targets.forEach(el => {
      const group = el.closest('.ml-left-tag-group');
      if (group) {
        group.classList.add('is-open');
        const toggle = group.querySelector('.ml-left-tag-group__title');
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
      }
      el.classList.remove('is-quest-burst');
      void el.offsetWidth;
      el.classList.add('is-quest-burst');
      if (typeof el.animate === 'function') {
        el.animate([
          {
            transform: 'scale(1)',
            filter: 'brightness(1) saturate(1)',
            boxShadow: '0 0 0 1px rgba(255,235,126,0.28), 0 0 10px rgba(255,231,94,0.54), 0 0 22px rgba(76,236,142,0.28), inset 0 0 10px rgba(255,255,255,0.16)'
          },
          {
            transform: 'scale(1.22)',
            filter: 'brightness(2.05) saturate(1.55)',
            boxShadow: '0 0 0 6px rgba(255,244,160,0.5), 0 0 32px rgba(255,246,155,1), 0 0 78px rgba(255,210,64,1), 0 0 132px rgba(74,255,152,0.8), inset 0 0 34px rgba(255,255,255,0.5)',
            offset: 0.16
          },
          {
            transform: 'scale(1.08)',
            filter: 'brightness(1.55) saturate(1.3)',
            boxShadow: '0 0 0 3px rgba(255,244,160,0.28), 0 0 24px rgba(255,246,155,0.82), 0 0 58px rgba(255,210,64,0.72), 0 0 92px rgba(74,255,152,0.48), inset 0 0 22px rgba(255,255,255,0.32)',
            offset: 0.42
          },
          {
            transform: 'scale(1)',
            filter: 'brightness(1) saturate(1)',
            boxShadow: '0 0 0 1px rgba(255,235,126,0.28), 0 0 10px rgba(255,231,94,0.54), 0 0 22px rgba(76,236,142,0.28), inset 0 0 10px rgba(255,255,255,0.16)'
          }
        ], {
          duration: 2000,
          easing: 'cubic-bezier(.16, 1, .3, 1)'
        });
      }
    });
    clearTimeout(journeyGlowTimer);
    journeyGlowTimer = setTimeout(() => {
      targets.forEach(el => el.classList.remove('is-quest-burst'));
    }, 2050);
  }
  window.HMIX_PULSE_JOURNEY_CONDITIONS = pulseJourneyConditions;

  function scheduleJourneyConditionPowerUp() {
    [250, 900, 1600].forEach(delay => {
      setTimeout(pulseJourneyConditions, delay);
    });
  }

  // ─── フィルタートグル ────────────────────────────
  function toggleFilter(cat, val) {
    let shouldGlow = false;
    // duration は排他選択（1つだけ）
    if (cat === 'duration') {
      const wasDurationActive = activeDurationFilter === val;
      shouldGlow = activeDurationFilter !== val && !!val;
      activeDurationFilter = (activeDurationFilter === val) ? '' : val;
      syncFilterUI();
      applyFilters();
      trackEvent(wasDurationActive ? 'filter_remove' : 'filter_apply', {
        surface: 'music_library',
        filter_category: cat,
        filter_value: val,
        results_count: filteredTracks.length
      });
      if (shouldGlow) pulseJourneyConditions();
      return;
    }
    if (!activeFilters[cat]) return;
    const wasActive = activeFilters[cat].has(val);
    if (wasActive) {
      activeFilters[cat].delete(val);
    } else {
      activeFilters[cat].add(val);
      shouldGlow = true;
    }
    syncFilterUI();
    applyFilters();
    trackEvent(wasActive ? 'filter_remove' : 'filter_apply', {
      surface: 'music_library',
      filter_category: cat,
      filter_value: val,
      results_count: filteredTracks.length
    });
    if (shouldGlow) pulseJourneyConditions();
  }

  function scheduleSearchTrack() {
    if (!searchInput) return;
    window.clearTimeout(searchTrackTimer);
    searchTrackTimer = window.setTimeout(function () {
      const queryLength = searchInput.value.trim().length;
      if (queryLength < 2 || queryLength === lastTrackedSearchLength) return;
      lastTrackedSearchLength = queryLength;
      trackEvent('search', {
        surface: 'music_library',
        search_term_length: queryLength,
        results_count: filteredTracks.length
      });
    }, 600);
  }

  // ─── イベントリスナー ────────────────────────────
  function setupEventListeners() {
    // キーワード検索
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        searchClear.hidden = searchInput.value.length === 0;
        applyFilters();
        scheduleSearchTrack();
      });
    }
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.hidden = true;
        applyFilters();
        lastTrackedSearchLength = 0;
        trackEvent('search_clear', {
          surface: 'music_library',
          results_count: filteredTracks.length
        });
        searchInput.focus();
      });
    }

    // タグチップ（フィルターパネル内）— initGlobalListeners() に移動済み（イベント委譲）
    // Hero内人気タグ — initGlobalListeners() に移動済み（イベント委譲）

    // フィルターグループ アコーディオン
    // PC (>=768px): Feeling/Style/Scene/Story のどれかをクリックで4つ全部一括開閉（連動）
    // モバイル: 各カテゴリ個別開閉
    // Duration はサイズ問わず常に個別開閉
    const MAIN_CATS = ['feeling', 'style', 'scene', 'story'];
    document.querySelectorAll('.ml-filter-group-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        const cat = toggle.closest('.ml-filter-group')?.getAttribute('data-category');
        const isPC = window.matchMedia('(min-width: 768px)').matches;
        const isMainCat = MAIN_CATS.includes(cat);

        if (isPC && isMainCat) {
          // PC: 4主要カテゴリを一括反転
          const willExpand = !expanded;
          MAIN_CATS.forEach(c => {
            const t = document.querySelector('.ml-filter-group[data-category="' + c + '"] .ml-filter-group-toggle');
            const chips = document.getElementById('filter-' + c);
            if (t) t.setAttribute('aria-expanded', String(willExpand));
            if (chips) chips.classList.toggle('collapsed', !willExpand);
          });
        } else {
          // モバイル または Duration: 個別開閉
          toggle.setAttribute('aria-expanded', String(!expanded));
          const target = document.getElementById(toggle.getAttribute('aria-controls'));
          if (target) target.classList.toggle('collapsed', expanded);
        }
      });
    });

    // 「すべて開く / 閉じる」一括トグル（PC のみ表示・モバイルは CSS で非表示）
    const expandAllBtn = document.getElementById('ml-filter-expand-all');
    if (expandAllBtn) {
      const TARGET_CATS = ['feeling', 'style', 'scene', 'story'];
      const labelEl = expandAllBtn.querySelector('.ml-filter-expand-all-label');
      expandAllBtn.addEventListener('click', () => {
        const willExpand = expandAllBtn.getAttribute('aria-pressed') !== 'true';
        TARGET_CATS.forEach(cat => {
          const toggle = document.querySelector('.ml-filter-group[data-category="' + cat + '"] .ml-filter-group-toggle');
          const chips = document.getElementById('filter-' + cat);
          if (toggle) toggle.setAttribute('aria-expanded', String(willExpand));
          if (chips) chips.classList.toggle('collapsed', !willExpand);
        });
        expandAllBtn.setAttribute('aria-pressed', String(willExpand));
        if (labelEl) {
          const isJa = document.documentElement.getAttribute('lang') !== 'en';
          labelEl.textContent = willExpand
            ? (isJa ? 'すべて閉じる' : 'Collapse all')
            : (isJa ? 'すべて開く' : 'Expand all');
          labelEl.setAttribute('data-ja', willExpand ? 'すべて閉じる' : 'すべて開く');
          labelEl.setAttribute('data-en', willExpand ? 'Collapse all' : 'Expand all');
        }
        expandAllBtn.classList.toggle('is-expanded', willExpand);
      });
    }

    // 最近再生フィルタートグル
    const recentFilterBtn = document.getElementById('ml-recent-filter-btn');
    if (recentFilterBtn) {
      recentFilterBtn.addEventListener('click', () => {
        showRecentOnly = !showRecentOnly;
        syncFilterUI();
        applyFilters();
        trackEvent(showRecentOnly ? 'filter_apply' : 'filter_remove', {
          surface: 'music_library',
          filter_category: 'recent',
          filter_value: 'recently_played',
          results_count: filteredTracks.length
        });
      });
    }

    // お気に入りフィルタートグル
    const favFilterBtn = document.getElementById('ml-fav-filter-btn');
    if (favFilterBtn) {
      favFilterBtn.addEventListener('click', () => {
        showFavOnly = !showFavOnly;
        syncFilterUI();
        applyFilters();
        trackEvent(showFavOnly ? 'filter_apply' : 'filter_remove', {
          surface: 'music_library',
          filter_category: 'favorite',
          filter_value: 'favorites',
          results_count: filteredTracks.length
        });
      });
    }

    // フィルターリセット
    if (filterResetBtn) {
      filterResetBtn.addEventListener('click', clearAllFilters);
    }
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', clearAllFilters);
    }
    if (emptyReset) {
      emptyReset.addEventListener('click', clearAllFilters);
    }

    // 言語トグルは initGlobalListeners() にて一度だけ登録済み

    // ─── カードアクションのイベント委譲 ───
    if (grid) {
      grid.addEventListener('click', (e) => {
        const dlLink = e.target.closest('.ml-btn-dl');
        if (dlLink) {
          const card = e.target.closest('.ml-card');
          if (card) {
            trackEvent('download_track', buildTrackParams(card.dataset.trackId, 'music_library_card'));
          }
          return;
        }

        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const card = e.target.closest('.ml-card');
        if (!card) return;

        const action = btn.dataset.action;
        const trackId = card.dataset.trackId;
        
        if (action === 'play') {
          togglePlay(trackId);
        } else if (action === 'fav') {
          trackEvent(btn.classList.contains('is-fav') ? 'favorite_remove' : 'favorite_add', buildTrackParams(trackId, 'music_library_card'));
          toggleFav(trackId, btn);
        } else if (action === 'tools') {
          openCreatorTools(trackId);
        }
      });
    }

    // ソート切替
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        trackEvent('sort_change', {
          surface: 'music_library',
          sort_value: currentSort,
          results_count: filteredTracks.length
        });
        if (currentSort === 'popular' && !popularScores) {
          // スコア取得後に並べ直す（取得まで一瞬は現状順のまま）
          fetchPopularScores().then(() => { if (currentSort === 'popular') applyFilters(); });
        }
        applyFilters();
      });
    }

    // Load More
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        trackEvent('load_more_tracks', {
          surface: 'music_library',
          visible_count: displayedCount,
          results_count: filteredTracks.length
        });
        loadMore();
      });
    }
  }

  // ─── フィルタリング ──────────────────────────────
  let isRendering = false;

  function applyFilters() {
    if (isRendering) {
      return;
    }
    isRendering = true;
    try {
      _applyFiltersCore();
    } finally {
      isRendering = false;
    }
  }

  function _applyFiltersCore() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    filteredTracks = allTracks.filter(track => {
      // テキスト検索
      if (query) {
        const fields = [
          track.title,
          track.title_en,
          track.description,
          track.description_en,
          ...(track.feeling || []),
          ...(track.style   || []),
          ...(track.scene   || []),
          ...(track.story   || []),
        ].filter(Boolean).map(s => s.toLowerCase());

        // 日本語タグラベルも検索対象に
        const tagLabels = [
          ...(track.feeling || []),
          ...(track.style   || []),
          ...(track.scene   || []),
          ...(track.story   || []),
        ].map(v => TAG_LABELS[v] || '').filter(Boolean).map(s => s.toLowerCase());

        const allSearchable = [...fields, ...tagLabels];
        if (!allSearchable.some(s => s.includes(query))) return false;
      }

      // タグフィルター（カテゴリ内・カテゴリ間ともに AND = 全タグを満たす曲のみ）
      for (const cat of ['feeling', 'style', 'scene', 'story']) {
        if (activeFilters[cat].size === 0) continue;
        const trackTags = track[cat] || [];
        const match = [...activeFilters[cat]].every(v => trackTags.includes(v));
        if (!match) return false;
      }

      // お気に入りフィルター
      if (showFavOnly && !favorites.has(String(track.id))) return false;

      // 最近再生フィルター
      if (showRecentOnly) {
        const recentSet = new Set(getRecentIds());
        if (!recentSet.has(String(track.id))) return false;
      }

      // 時間フィルター
      if (activeDurationFilter) {
        const sec = track.durationSec || 0;
        if (activeDurationFilter === 'jingle' && sec > 25) return false;
        if (activeDurationFilter === 'vshort' && sec > 60) return false;
        if (activeDurationFilter === 'short' && sec > 120) return false;
        if (activeDurationFilter === 'medium' && (sec <= 120 || sec > 240)) return false;
        if (activeDurationFilter === 'long' && sec <= 240) return false;
      }

      return true;
    });

    // ソート適用
    if (showRecentOnly) {
      // 最近再生モード: localStorage の順序（最新→古い）で並べ直す
      const recentIds = getRecentIds();
      filteredTracks.sort((a, b) =>
        recentIds.indexOf(String(a.id)) - recentIds.indexOf(String(b.id))
      );
    } else if (currentSort === 'popular') {
      const s = popularScores || {};
      // スコア降順。同点（未集計の曲など）は既存の並びを保つ（sort は安定）
      filteredTracks.sort((a, b) => (isPopularityExcluded(b.id) ? 0 : (s[b.id] || 0)) - (isPopularityExcluded(a.id) ? 0 : (s[a.id] || 0)));
    } else if (currentSort === 'newest') {
      filteredTracks = sortTracksNewFirst(filteredTracks);
    } else if (currentSort === 'duration-asc') {
      filteredTracks.sort((a, b) => (a.durationSec || 0) - (b.durationSec || 0));
    } else if (currentSort === 'duration-desc') {
      filteredTracks.sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0));
    } else if (currentSort === 'title') {
      filteredTracks.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ja'));
    }

    displayedCount = 0;
    const runId = window.__hmixLibRunId || 0;

    // ─── ユーザー指示のDOM生存確認ログ ───
    const liveGrid = document.getElementById('ml-grid');
    if (!liveGrid) {
      console.error('[HMIX_INIT_LIBRARY] CRITICAL ERROR: ml-grid がDOM内に存在しません！');
      return; 
    }
    if (grid !== liveGrid) {
      console.warn('[HMIX_INIT_LIBRARY] WARNING: grid変数の参照が古いです。再バインドします。');
      grid = liveGrid;
    }
    
    if (grid) {
      const style = getComputedStyle(grid);
    }
    
    // 補助UIの検証 (Stale reference check)
    const liveResultCount = document.getElementById('ml-result-count');
    if (resultCount !== liveResultCount) {
      console.warn('[HMIX_INIT_LIBRARY] WARNING: resultCountの参照が古いです。');
      resultCount = liveResultCount;
    }

    const clearRunId = window.__hmixLibRunId || 0;
    const caller = new Error().stack.split('\\n')[2]?.trim() || 'unknown';
    grid.innerHTML = '';

    renderCards();
    updateResultCount();
    updateResultsCondition();
    updateChipAvailability();

    // 描画直後に現在のプレイヤー状態を反映
    if (window.HMIX_PLAYER) {
      const pState = window.HMIX_PLAYER.getState();
      const track = pState.queue[pState.currentIndex];
      syncPlayerUI(track ? track.id : null, pState.isPlaying);
    }
  }

  // ─── カード描画 ──────────────────────────────────
  function renderCards() {
    const runId = window.__hmixLibRunId || 0;
    const start = displayedCount;
    const end = Math.min(start + PAGE_SIZE, filteredTracks.length);
    const frag = document.createDocumentFragment();


    for (let i = start; i < end; i++) {
      frag.appendChild(createCard(filteredTracks[i]));
    }
    grid.appendChild(frag);
    displayedCount = end;


    // ─── ユーザー指示のレイアウト診断ログ (描画完了後) ───
    requestAnimationFrame(() => {
      if (!grid) return;
      
      const gRect = grid.getBoundingClientRect();
      const gStyle = getComputedStyle(grid);

      const first = grid.firstElementChild;
      if (first) {
        const fStyle = getComputedStyle(first);
      } else {
      }

      const parent = grid.closest('.ml-main') || grid.parentElement;
      if (parent) {
        const pStyle = getComputedStyle(parent);
      }
    });

    // 空状態
    if (emptyState) {
      emptyState.hidden = filteredTracks.length > 0;
    }

    // Load More
    const remaining = filteredTracks.length - displayedCount;
    if (loadMoreWrap) {
      loadMoreWrap.hidden = remaining <= 0;
      if (loadMoreCount) loadMoreCount.textContent = `(+${Math.min(remaining, PAGE_SIZE)})`;
    }
  }

  function loadMore() {
    renderCards();
  }

  // ─── カード生成 ──────────────────────────────────
  function createCard(track) {
    const card = document.createElement('article');
    card.className = 'ml-card';
    card.dataset.trackId = track.id;
    card.setAttribute('role', 'listitem');

    // 表示タグ（feeling/scene/style から最大２個）
    const displayTags = [
      ...(track.scene   || []).slice(0, 1),
      ...(track.feeling || []).slice(0, 1),
      ...(track.style   || []).slice(0, 1),
    ].slice(0, 2);

    // タグ別グラデーション用のプライマリタグを决定
    const TAG_PRIORITY = [
      'scary', 'japanese_horror', 'western_horror', 'battle', 'boss', 'sad', 'mysterious', 'dark',
      'epic', 'japanese', 'oriental', 'shrine', 'fantasy', 'celtic', 'medieval',
      'gentle', 'peaceful'
    ];
    const allTagsFlat = [
      ...(track.feeling || []),
      ...(track.style   || []),
      ...(track.scene   || []),
      ...(track.story   || []),
    ];
    const primaryTag = TAG_PRIORITY.find(t => allTagsFlat.includes(t)) || allTagsFlat[0] || '';
    if (primaryTag) card.dataset.tagPrimary = primaryTag;

    const detailUrl = `./music/${escHtml(track.id)}.html`;
    const descShort = getTrackDescriptionShort(track);
    const ui = getCardUiText();
    const isFav = favorites.has(track.id);
    const mp3Path = track.mp3 || '';

    // メタ情報バッジ（duration + bpm + loop）
    const metaBadges = [];
    if (track.duration) metaBadges.push(`<span class="ml-card-meta-badge ml-card-meta-badge--duration">${escHtml(track.duration)}</span>`);
    if (track.bpm) metaBadges.push(`<span class="ml-card-meta-badge ml-card-meta-badge--bpm">${escHtml(String(track.bpm))} BPM</span>`);
    if (track.loop) metaBadges.push(`<span class="ml-card-meta-badge ml-card-meta-badge--loop">Loop</span>`);

    // 人気ランクバッジ（ライブ人気スコア上位N曲）
    const _rankMap = getPopularRankMap();
    const popRank = _rankMap ? _rankMap[track.id] : 0;
    const rankAria = popRank ? (getCurrentLang() === 'en' ? `Popularity rank ${popRank}` : `人気${popRank}位`) : '';
    const rankBadge = popRank
      ? `<div class="ml-card-rank${popRank <= 3 ? ' is-top3' : ''}" role="img" aria-label="${rankAria}"><span class="ml-card-rank__star" aria-hidden="true">★</span><span class="ml-card-rank__n">${popRank}</span></div>`
      : '';

    card.innerHTML = `
      ${rankBadge}
      <div class="ml-card-jacket" aria-hidden="true"></div>
      <div class="ml-card-inner">
        <div class="ml-card-header">
          <div class="ml-card-meta">
            ${metaBadges.join('')}
          </div>
        </div>
        <h3 class="ml-card-title">${escHtml(getTrackTitle(track))}</h3>
        ${descShort ? `<p class="ml-card-desc">${escHtml(descShort)}</p>` : ''}
        <div class="ml-card-tags" aria-label="${ui.tagAria}">
          ${displayTags.map(t => `<span class="ml-card-tag">${escHtml(getTagLabel(t))}</span>`).join('')}
        </div>
        <div class="ml-card-playing-bar" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div class="ml-card-actions">
          <button type="button" class="ml-btn-play" data-action="play" aria-label="${escHtml(getCurrentLang() === 'en' ? ui.playAria + getTrackTitle(track) : getTrackTitle(track) + ui.playAria)}">
            <svg class="play-icon-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span class="play-label">${ui.play}</span>
          </button>
          <button type="button" class="ml-btn-tools" data-action="tools" aria-label="${escHtml(getCurrentLang() === 'en' ? ui.toolsAria + getTrackTitle(track) : getTrackTitle(track) + ui.toolsAria)}">
            <span class="tools-pip" aria-hidden="true"></span>
            <span class="tools-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M4 14h4"/><path d="M16 14h4"/><path d="M10 14a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M4 7h10"/><path d="M20 7h-2"/><path d="M14 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M4 21h2"/><path d="M12 21h8"/><path d="M6 21a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/></svg>
            </span>
            <span class="tools-label">${ui.tools}</span>
          </button>
          <div class="ml-card-icon-actions">
            <a class="ml-btn-detail" href="${detailUrl}" aria-label="${escHtml(getCurrentLang() === 'en' ? ui.detailAria + getTrackTitle(track) : getTrackTitle(track) + ui.detailAria)}"><span aria-hidden="true">↗</span></a>
          <button type="button" class="ml-btn-fav${isFav ? ' is-fav' : ''}" data-action="fav" data-track-id="${escHtml(track.id)}" aria-label="${escHtml(getCurrentLang() === 'en' ? ui.favAria + getTrackTitle(track) : getTrackTitle(track) + ui.favAria)}" aria-pressed="${isFav}">${isFav ? '♥' : '♡'}</button>
          <a class="ml-btn-dl" href="${escHtml(mp3Path)}" download="${escHtml(track.title || track.id)}" aria-label="${escHtml(getCurrentLang() === 'en' ? ui.downloadAria + getTrackTitle(track) : getTrackTitle(track) + ui.downloadAria)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></a>
          </div>
        </div>
      </div>
    `;

    // 個別のイベントリスナー登録は廃止（親要素 grid でのイベント委譲に統一）

    if (document.body.getAttribute('data-cardtools') === 'forest-glass') {
      return _fgWrapCard(card);
    }

    return card;
  }

  // ─── 試聴・お気に入り制御 (イベント委譲用) ─────────────────
  function _fgWrapCard(card) {
    const wrap = document.createElement('div');
    wrap.className = 'fg-perspective';
    wrap.style.display = 'block';

    const jacket = card.querySelector('.ml-card-jacket');
    const fxHtml =
      '<div class="fg-noise" aria-hidden="true"></div>' +
      '<div class="fg-iridescent" aria-hidden="true"></div>' +
      '<div class="fg-iridescent fg-iridescent--sharp" aria-hidden="true"></div>' +
      '<div class="fg-specular" aria-hidden="true"></div>' +
      '<div class="fg-gloss" aria-hidden="true"></div>' +
      '<div class="fg-halo" aria-hidden="true"></div>';
    if (jacket) {
      jacket.insertAdjacentHTML('afterend', fxHtml);
    } else {
      card.insertAdjacentHTML('afterbegin', fxHtml);
    }

    _fgAttachPointer(wrap, card);
    wrap.appendChild(card);
    return wrap;
  }

  let _fgPointerRaf = false;
  const _fgPointerQueue = new Map();

  function _fgFlushPointer() {
    _fgPointerRaf = false;
    _fgPointerQueue.forEach((p, card) => {
      card.style.setProperty('--mx', p.mx);
      card.style.setProperty('--my', p.my);
      card.style.setProperty('--rx', p.rx);
      card.style.setProperty('--ry', p.ry);
    });
    _fgPointerQueue.clear();
  }

  function _fgAttachPointer(wrap, card) {
    card.style.setProperty('--mx', '50');
    card.style.setProperty('--my', '50');
    card.style.setProperty('--rx', '0');
    card.style.setProperty('--ry', '0');

    wrap.addEventListener('pointermove', function (event) {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const mx = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const my = Math.max(0, Math.min(100, (y / rect.height) * 100));
      const rx = Math.max(-1, Math.min(1, (x / rect.width) * 2 - 1));
      const ry = Math.max(-1, Math.min(1, (y / rect.height) * 2 - 1));
      _fgPointerQueue.set(card, { mx: mx, my: my, rx: rx, ry: ry });
      if (!_fgPointerRaf) {
        _fgPointerRaf = true;
        requestAnimationFrame(_fgFlushPointer);
      }
    });

    wrap.addEventListener('pointerleave', function () {
      card.style.setProperty('--mx', '50');
      card.style.setProperty('--my', '50');
      card.style.setProperty('--rx', '0');
      card.style.setProperty('--ry', '0');
    });
  }

  function toggleFav(trackId, btn) {
    if (favorites.has(trackId)) {
      favorites.delete(trackId);
      btn.classList.remove('is-fav');
      btn.textContent = '♡';
      btn.setAttribute('aria-pressed', 'false');
      // 0-5 Undo: 削除は即commitせず「元に戻す」トースト経由で確定
      if (window.HMIX_FAV) window.HMIX_FAV.removeWithUndo(trackId); else saveFavorites();
    } else {
      favorites.add(trackId);
      btn.classList.add('is-fav');
      btn.textContent = '♥';
      btn.setAttribute('aria-pressed', 'true');
      if (window.HMIX_FAV) window.HMIX_FAV.add(trackId); else saveFavorites();
    }
  }

  function togglePlay(id) {
    if (window.HMIX_PLAYER) {
      // プレイヤーに任せる（同じIDなら中でstop()される）
      window.HMIX_PLAYER.playTrackById(id);
      trackEvent('play_track', buildTrackParams(id, 'music_library_card'));
    } else {
      console.warn('[LIBRARY] HMIX_PLAYER not found');
    }
  }

  function openCreatorTools(id) {
    if (!window.HMIX_PLAYER) {
      console.warn('[LIBRARY] HMIX_PLAYER not found');
      return;
    }
    trackEvent('creator_tools_open', buildTrackParams(id, 'music_library_card'));

    const state = window.HMIX_PLAYER.getState ? window.HMIX_PLAYER.getState() : null;
    const current = state && state.queue && state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;
    if (!current || current.id !== id) {
      window.HMIX_PLAYER.playTrackById(id);
    }

    setTimeout(() => {
      const panel = document.getElementById('player-panel');
      const toggle = document.getElementById('player-tool-btn');
      if (toggle && panel && !panel.classList.contains('is-open')) {
        toggle.click();
      }
      const durationTab = document.querySelector('.player-panel__tab[data-tab="duration"]');
      if (durationTab) durationTab.click();
    }, 120);
  }

  function syncPlayerUI(activeTrackId, isPlaying) {
    // 全てのカードのUIをリセットまたはアクティブ化
    document.querySelectorAll('.ml-card[data-track-id]').forEach(card => {
      const cardTrackId = card.dataset.trackId;
      const isCurrent = (cardTrackId === activeTrackId && isPlaying);
      
      card.classList.toggle('is-playing', isCurrent);
      
      const btn = card.querySelector('.ml-btn-play');
      if (btn) {
        btn.classList.toggle('playing', isCurrent);
        const svg = btn.querySelector('.play-icon-svg');
        const label = btn.querySelector('.play-label');
        
        if (isCurrent) {
          if (svg) svg.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
          if (label) label.textContent = getCurrentLang() === 'en' ? 'Stop' : '停止';
        } else {
          if (svg) svg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
          if (label) label.textContent = getCardUiText().play;
        }
      }
    });
  }

  // ─── 結果件数更新 ────────────────────────────────
  function updateResultCount() {
    const n = filteredTracks.length;
    if (resultCount) resultCount.textContent = `${n} tracks`;
  }

  function updateResultsCondition() {
    if (!resultsCond) return;
    const conditions = [];
    ['feeling', 'style', 'scene', 'story'].forEach(cat => {
      activeFilters[cat].forEach(val => {
        conditions.push(getTagLabel(val));
      });
    });
    const q = searchInput ? searchInput.value.trim() : '';
    if (q) conditions.unshift(`"${q}"`);
    const suffix = getCurrentLang() === 'en' ? ' matching tracks' : ' に一致する楽曲';
    resultsCond.textContent = conditions.length > 0 ? `${conditions.join(' / ')}${suffix}` : '';
  }

  // ─── フィルタークリア ────────────────────────────
  function clearAllFilters() {
    ['feeling', 'style', 'scene', 'story'].forEach(cat => activeFilters[cat].clear());
    showFavOnly    = false;
    showRecentOnly = false;
    activeDurationFilter = '';
    currentSort = 'popular';
    if (sortSelect) sortSelect.value = 'popular';
    if (popularScores) { /* 取得済みならそのまま */ } else { fetchPopularScores().then(function(){ if (currentSort === 'popular') applyFilters(); }); }
    if (searchInput) { searchInput.value = ''; }
    if (searchClear) { searchClear.hidden = true; }
    syncFilterUI();
    applyFilters();
    // タグ選択背景をリセット → scenic-bg.js が図書館背景に戻す
    window.dispatchEvent(new CustomEvent('hmix:filterreset'));
  }

  // ─── ユーティリティ ──────────────────────────────
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function applyCardDesignVariant() {
    const params = new URLSearchParams(window.location.search || '');
    const raw = (params.get('cardtools') || 'forest-glass').toLowerCase();
    const variant = ['glass', 'game', 'fantasy', 'bold'].includes(raw) ? raw : '';
    document.body.classList.remove(
      'ml-card-style-glass',
      'ml-card-style-game',
      'ml-card-style-fantasy',
      'ml-card-style-bold',
      'ml-card-style-forest-glass'
    );
    document.body.removeAttribute('data-cardtools');
    if (raw === 'forest-glass') {
      document.body.setAttribute('data-cardtools', 'forest-glass');
    } else if (variant) {
      document.body.classList.add(`ml-card-style-${variant}`);
    }
  }

  // ─── 起動 ────────────────────────────────────────
  window.HMIX_INIT_LIBRARY = init;

  // 初回ロード（DOMContentLoaded）と PJAX遷移後（hmix:page:init）の両方で初期化
  // init() 内部の page-type チェックにより、ライブラリページ以外ではスキップされる
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });

  window.addEventListener('hmix:page:init', (e) => {
    init();
  });

  document.addEventListener('hmix:page:init', (e) => {
    // document 側で発火されている可能性も考慮してチェック（window側で既に init が走っていれば _initScheduled で弾かれる）
    init();
  });

  // データ取得を即時開始（tracks-loader.js がある場合のみ）
  // PJAXによる重複ロードを避けるため、未取得時のみ
  // TOPページでは tracks データは不要のため、music-library 系ページ or トラック要素がある場合のみ取得
  // (Critical Path からの 290KB 除外 — TOP 初期ロード削減)
  var _needsTracksNow = (function(){
    try {
      if (/\/music-library\.html/.test(location.pathname)) return true;
      if (document.getElementById('track-list')) return true;
      if (document.querySelector('[data-needs-tracks]')) return true;
    } catch(e) {}
    return false;
  })();
  if (_needsTracksNow && typeof window.loadTracks === 'function' && (!window.TRACKS || !window.TRACKS.length)) {
    window.loadTracks().catch(function () {});
  }

})();
