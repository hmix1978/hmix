/**
 * H/MIX GALLERY — track-detail.js
 * 個別曲ページの動的レンダリング
 *
 * URL形式:
 *   /music/[id].html  → id を HTML ファイル名から取得
 *   /music/track.html?id=[id] → クエリパラメータから取得（フォールバック）
 *
 * テンプレート検出:
 *   .td2-hero 要素が存在 → v2テンプレート（track-detail-v2.css使用）
 *   それ以外             → 旧テンプレート（track-detail.css使用）
 */

(function () {
  'use strict';

  // ─── タグ日本語ラベル ────────────────────────────────
  const TAG_LABELS = {
    gentle: '優しい', sad: '悲しい', happy: '楽しい', epic: '勇壮',
    dark: '暗い', mysterious: '神秘', suspense: '緊迫', horror: 'ホラー',
    fantasy: 'ファンタジー', japanese: '和風', celtic: 'ケルト', medieval: '中世',
    oriental: 'アジアン', futuristic: '近未来', electronic: '電子音',
    battle: '戦闘', boss: 'ボス', town: '街', village: '村', field: 'フィールド',
    forest: '森', night: '夜', travel: '旅', dungeon: 'ダンジョン', ruins: '遺跡',
    cave: '洞窟', festival: '祭り', opening: 'オープニング', ending: 'エンディング',
    shrine: '神社', samurai: 'サムライ',
    memory: '思い出', reunion: '再会', farewell: '別れ', victory: '勝利',
    defeat: '敗北', peaceful: '平和', dream: '夢', conspiracy: '陰謀',
  };

  // ─── タグ英語ラベル ─────────────────────────────────
  const TAG_LABELS_EN = {
    gentle: 'Gentle', sad: 'Sad', happy: 'Happy', epic: 'Epic',
    dark: 'Dark', mysterious: 'Mysterious', suspense: 'Suspense', horror: 'Horror',
    fantasy: 'Fantasy', japanese: 'Japanese', celtic: 'Celtic', medieval: 'Medieval',
    oriental: 'Asian', futuristic: 'Futuristic', electronic: 'Electronic',
    battle: 'Battle', boss: 'Boss', town: 'Town', village: 'Village', field: 'Field',
    forest: 'Forest', night: 'Night', travel: 'Travel', dungeon: 'Dungeon', ruins: 'Ruins',
    cave: 'Cave', festival: 'Festival', opening: 'Opening', ending: 'Ending',
    shrine: 'Shrine', samurai: 'Samurai',
    memory: 'Memory', reunion: 'Reunion', farewell: 'Farewell', victory: 'Victory',
    defeat: 'Defeat', peaceful: 'Peaceful', dream: 'Dream', conspiracy: 'Conspiracy',
  };

  // タグ優先度（シーン画像・ジャケット色決定用）
  const TAG_PRIORITY = [
    'horror', 'scary', 'japanese_horror', 'western_horror',
    'battle', 'boss', 'sad', 'mysterious', 'dark', 'suspense',
    'epic', 'japanese', 'samurai', 'oriental', 'shrine',
    'fantasy', 'celtic', 'medieval', 'gentle', 'peaceful',
    'happy', 'forest', 'night', 'travel'
  ];

  // ─── v2 シーン画像マップ ─────────────────────────────
  const S = '../assets/images/scenes/';
  const TAG_BG = {
    horror:     S + 'horror.webp',
    scary:      S + 'horror.webp',
    japanese_horror: S + 'horror.webp',
    western_horror:  S + 'horror.webp',
    battle:     S + 'battle.webp',
    boss:       S + 'boss.webp',
    dark:       S + 'dark.webp',
    mysterious: S + 'mysterious.webp',
    suspense:   S + 'suspense.webp',
    fantasy:    S + 'fantasy.webp',
    japanese:   S + 'japanese.webp',
    oriental:   S + 'oriental.webp',
    shrine:     S + 'shrine.webp',
    samurai:    S + 'japanese.webp',  // samurai.webp 未生成のためフォールバック
    celtic:     S + 'celtic.webp',
    medieval:   S + 'medieval.webp',
    gentle:     S + 'gentle.webp',
    peaceful:   S + 'peaceful.webp',
    sad:        S + 'sad.webp',
    happy:      S + 'happy.webp',
    cute:       S + 'happy.webp',
    epic:       S + 'epic.webp',
    futuristic: S + 'futuristic.webp',
    electronic: S + 'electronic.webp',
    modern:     S + 'electronic.webp',
    town:       S + 'town.webp',
    village:    S + 'village.webp',
    field:      S + 'field.webp',
    forest:     S + 'forest.webp',
    night:      S + 'night.webp',
    travel:     S + 'travel.webp',
    dungeon:    S + 'dungeon.webp',
    ruins:      S + 'ruins.webp',
    cave:       S + 'cave.webp',
    festival:   S + 'festival.webp',
    opening:    S + 'opening.webp',
    ending:     S + 'ending.webp',
    memory:     S + 'memory.webp',
    reunion:    S + 'reunion.webp',
    farewell:   S + 'farewell.webp',
    victory:    S + 'victory.webp',
    defeat:     S + 'defeat.webp',
    dream:      S + 'dream.webp',
    conspiracy: S + 'conspiracy.webp',
    musicbox:   S + 'gentle.webp',
    onsen:      S + 'peaceful.webp',
    mansion:    S + 'dark.webp',
    pursuit:    S + 'suspense.webp',
    dailylife:  S + 'peaceful.webp',
    hope:       S + 'epic.webp',
    resolve:    S + 'epic.webp',
    bonds:      S + 'gentle.webp',
    flashback:  S + 'memory.webp',
    omen:       S + 'mysterious.webp',
  };
  const FALLBACK_BG = S + 'dark.webp';

  // ─── IDの取得 ────────────────────────────────────────
  function getTrackId() {
    const explicitTrackEl = document.querySelector('[data-page-track-id], #hero-play-btn[data-track-id]');
    const explicitTrackId = explicitTrackEl && (explicitTrackEl.getAttribute('data-page-track-id') || explicitTrackEl.getAttribute('data-track-id'));
    if (explicitTrackId) return explicitTrackId;

    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop();
    if (filename && filename !== 'track.html' && filename.endsWith('.html')) {
      return filename.replace('.html', '');
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || null;
  }

  // ─── 関連曲取得 ──────────────────────────────────────
  function getRelatedTracks(track, allTracks, limit) {
    limit = limit || 6;
    const scored = [];

    allTracks.forEach(t => {
      if (t.id === track.id) return;

      let score = 0;
      const sceneMatch  = (track.scene   || []).filter(v => (t.scene   || []).includes(v)).length;
      const styleMatch  = (track.style   || []).filter(v => (t.style   || []).includes(v)).length;
      const feelingMatch= (track.feeling || []).filter(v => (t.feeling || []).includes(v)).length;
      const storyMatch  = (track.story   || []).filter(v => (t.story   || []).includes(v)).length;

      score += sceneMatch   * 8;
      score += styleMatch   * 4;
      score += feelingMatch * 2;
      score += storyMatch   * 1;

      // duration が近い曲を少し優遇（±30秒以内で+2、±60秒以内で+1）
      if (track.durationSec && t.durationSec) {
        const diff = Math.abs(track.durationSec - t.durationSec);
        if (diff <= 30) score += 2;
        else if (diff <= 60) score += 1;
      }

      if (score > 0) scored.push({ track: t, score });
    });

    scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);
    return scored.slice(0, limit).map(s => s.track);
  }

  // ─── DOM ヘルパー ────────────────────────────────────
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function el(id) { return document.getElementById(id); }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '—';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  // ─── primaryTag の取得 ──────────────────────────────
  function getPrimaryTag(track) {
    const allTagsFlat = [
      ...(track.feeling || []),
      ...(track.style   || []),
      ...(track.scene   || []),
      ...(track.story   || []),
    ];
    return TAG_PRIORITY.find(t => allTagsFlat.includes(t)) || allTagsFlat[0] || '';
  }

  // ─── 言語ヘルパー ────────────────────────────────────
  var currentTrack = null;
  var currentIsV2  = false;

  function getCurrentLang() {
    try {
      var params = new URLSearchParams(window.location.search);
      var urlLang = params.get('lang');
      if (urlLang === 'en' || urlLang === 'ja') return urlLang;
    } catch(e) {}
    return window.HMIX_LANG || (function() {
      try { return sessionStorage.getItem('hmix_lang') || 'ja'; } catch(e) { return 'ja'; }
    })();
  }

  function getTrackTitle(track) {
    return (getCurrentLang() === 'en' && track.title_en) ? track.title_en : (track.title || '');
  }

  function getTrackDescription(track) {
    return (getCurrentLang() === 'en' && track.description_en)
      ? track.description_en
      : (track.description || '');
  }

  function getTagLabel(tag) {
    var isEn = getCurrentLang() === 'en';
    var meta = window.TAGS_META || {};
    for (var cat in meta) {
      if (!Object.prototype.hasOwnProperty.call(meta, cat)) continue;
      var found = (meta[cat] || []).find(function(item) { return item.id === tag; });
      if (found) return isEn ? (found.name_en || found.name || tag) : (found.name || tag);
    }
    return isEn ? (TAG_LABELS_EN[tag] || tag) : (TAG_LABELS[tag] || tag);
  }

  // ════════════════════════════════════════════════════
  //   v2 テンプレート レンダリング
  // ════════════════════════════════════════════════════

  // ─── 同値ガード付き setText ──────────────────────────
  // SSG 済みの値と同じなら DOM を触らず不要な reflow を回避。
  function setText(node, val) {
    if (!node) return;
    var next = (val == null) ? '' : String(val);
    if (node.textContent === next) return;
    node.textContent = next;
  }
  // description は改行を <br> で保持（SSG と同形）。
  function setMultilineHtml(node, val) {
    if (!node) return;
    var s = String(val || '').replace(/^\s+|\s+$/g, '');
    var html = s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/\n+/g, '<br>');
    if (node.innerHTML === html) return;
    node.innerHTML = html;
  }

  function renderTrackV2(track) {
    const primaryTag = getPrimaryTag(track);

    // ① ヒーロー背景画像（タグから動的設定）
    const heroImg = document.querySelector('.td2-hero__image');
    if (heroImg) {
      const bgUrl = TAG_BG[primaryTag] || FALLBACK_BG;
      var nextBg = "url('" + bgUrl + "')";
      // SSG 済みの style.backgroundImage と一致すればスキップ
      if (heroImg.style.backgroundImage !== nextBg) {
        heroImg.style.backgroundImage = nextBg;
      }
    }

    // ② ヒーロー テキスト（同値ガード付き）
    setText(el('td2-hero-id'),        track.id.toUpperCase());
    setText(el('td2-hero-title'),     getTrackTitle(track));
    setMultilineHtml(el('td2-hero-desc'), getTrackDescription(track));
    setText(el('td2-breadcrumb-title'), getTrackTitle(track));

    // ③ クレジットコピーテキスト（初期値: 曲名あり）
    const creditText = el('credit-text');
    if (creditText) {
      var isEnInit = getCurrentLang() === 'en';
      creditText.textContent = isEnInit
        ? 'Music: ' + getTrackTitle(track) + ' by H/MIX GALLERY (Hirokazu Akiyama)\nhttps://www.hmix.net | Free music for YouTube'
        : 'BGM：' + getTrackTitle(track) + ' / H/MIX GALLERY（秋山裕和）\nhttps://www.hmix.net';
    }

    // クレジットタブ切り替え（credit-copy-area 内）
    const tabs = document.querySelectorAll('.td2-credit-copy__tab');
    function buildCreditText(mode) {
      var isEn = getCurrentLang() === 'en';
      if (mode === 'with-title') {
        return isEn
          ? 'Music: ' + getTrackTitle(track) + ' by H/MIX GALLERY (Hirokazu Akiyama)\nhttps://www.hmix.net | Free music for YouTube'
          : 'BGM：' + getTrackTitle(track) + ' / H/MIX GALLERY（秋山裕和）\nhttps://www.hmix.net';
      } else {
        return isEn
          ? 'Music by H/MIX GALLERY (Hirokazu Akiyama): https://www.hmix.net'
          : 'BGM：H/MIX GALLERY（秋山裕和）  https://www.hmix.net';
      }
    }
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var mode = tab.getAttribute('data-mode');
        if (creditText) creditText.textContent = buildCreditText(mode);
      });
    });

    // クレジットコピーボタン
    var copyBtn = el('credit-copy-btn');
    var copyLabel = el('credit-copy-label');
    if (copyBtn && creditText) {
      copyBtn.addEventListener('click', function() {
        var text = creditText.textContent || creditText.innerText;
        navigator.clipboard.writeText(text).then(function() {
          onCopied();
        }).catch(function() {
          var range = document.createRange();
          range.selectNodeContents(creditText);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('copy');
          onCopied();
        });
      });

      function onCopied() {
        copyBtn.classList.add('copied');
        if (copyLabel) copyLabel.textContent = 'Copied!';
        setTimeout(function() {
          copyBtn.classList.remove('copied');
          if (copyLabel) copyLabel.textContent = 'Copy';
        }, 2000);
      }
    }

    // ④ ヒーロー♡ボタン 初期状態 & クリック同期
    var heroFav = el('hero-fav-btn');
    if (heroFav) {
      function updateHeroFav() {
        try {
          var isFav = window.HMIX_FAV ? window.HMIX_FAV.has(track.id) : false;
          heroFav.classList.toggle('active', isFav);
          heroFav.setAttribute('aria-pressed', String(isFav));
        } catch(e) {}
      }

      heroFav.addEventListener('click', function() {
        // 実処理は unifiedHeroFav (capture) が単一ソースとして担う（この経路は保険）。
        // player-fav-count / player-btn-fav は player.js が favorites:updated で更新する。
        if (!window.HMIX_FAV) return;
        var id = String(track.id);
        if (window.HMIX_FAV.has(id)) window.HMIX_FAV.removeWithUndo(id); else window.HMIX_FAV.add(id);
        updateHeroFav();
      });

      updateHeroFav();
    }

    // ⑤ ヒーロー再生ボタン → グローバルプレイヤーに接続
    var heroPlayBtn = el('hero-play-btn');
    if (heroPlayBtn) {
      heroPlayBtn.addEventListener('click', function() {
        // 同じ曲が再生中なら停止、それ以外は再生（トグル）
        if (window.HMIX_PLAYER && window.HMIX_PLAYER.playTrackById) {
          window.HMIX_PLAYER.playTrackById(track.id);
        } else if (window.HMIX_PLAYER) {
          window.HMIX_PLAYER.playTrack(track, window.TRACKS || []);
        }
      });
    }

    // ⑥ ダウンロードリンク
    var dlBtn = el('td2-download-btn');
    if (dlBtn) {
      dlBtn.href = track.mp3;
      dlBtn.setAttribute('download', track.id + '.mp3');
    }

    // ⑦ タグリスト（v2カテゴリ別グループ）
    ['feeling', 'style', 'scene', 'story'].forEach(function(cat) {
      var group = document.querySelector('.td2-tag-group[data-cat="' + cat + '"]');
      var list  = group ? group.querySelector('.td2-tag-group__list') : null;
      if (!list) return;
      var tags = track[cat] || [];
      if (tags.length === 0) {
        if (group) group.hidden = true;
        return;
      }
      list.innerHTML = tags.map(function(tag) {
        return '<a class="td2-tag td2-tag--' + esc(cat) + '" href="../music-library.html?' + esc(cat) + '=' + esc(tag) + '" data-tag="' + esc(tag) + '">' + esc(getTagLabel(tag)) + '</a>';
      }).join('');
    });

    // ⑧ <title> / meta / OGP / 構造化データ
    var pageTitle = getTrackTitle(track) + ' — H/MIX GALLERY';
    document.title = pageTitle;
    var trackUrl = 'https://www.hmix.net/music/' + track.id + '.html';
    var sceneImg = TAG_BG[getPrimaryTag(track)] || FALLBACK_BG;
    // 相対パス → 絶対URL に変換（TAG_BG が ../assets/... 形式のため）
    var sceneImgAbs = sceneImg.replace(/^\.\.\//, 'https://www.hmix.net/');

    var descMeta = el('page-desc');
    if (descMeta) descMeta.setAttribute('content', getTrackDescription(track));

    var canonical = el('page-canonical');
    if (canonical) canonical.setAttribute('href', trackUrl);

    // og: 既存タグ更新
    var ogTitle = el('og-title');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    var ogDesc = el('og-desc');
    if (ogDesc) ogDesc.setAttribute('content', getTrackDescription(track));

    // og:image / og:url / og:locale / Twitter Card — 既存タグを上書き（重複防止）
    // 前回のPJAX遷移で追加した data-td2-meta タグがあれば削除
    document.querySelectorAll('meta[data-td2-meta]').forEach(function(m) { m.remove(); });

    var metaDefs = [
      { property: 'og:image',   content: sceneImgAbs },
      { property: 'og:url',     content: trackUrl },
      { property: 'og:locale',  content: 'ja_JP' },
      { name: 'twitter:card',   content: 'summary_large_image' },
      { name: 'twitter:site',   content: '@hmix_net' },
      { name: 'twitter:title',  content: pageTitle },
      { name: 'twitter:description', content: getTrackDescription(track) },
      { name: 'twitter:image',  content: sceneImgAbs },
    ];
    metaDefs.forEach(function(def) {
      // 既存タグを検索
      var selector = def.property
        ? 'meta[property="' + def.property + '"]'
        : 'meta[name="' + def.name + '"]';
      var existing = document.querySelector(selector);
      if (existing) {
        // 既存タグの content を上書き
        existing.setAttribute('content', def.content);
      } else {
        // 存在しなければ新規追加
        var m = document.createElement('meta');
        if (def.property) m.setAttribute('property', def.property);
        if (def.name)     m.setAttribute('name', def.name);
        m.setAttribute('content', def.content);
        m.setAttribute('data-td2-meta', '');
        document.head.appendChild(m);
      }
    });

    // 構造化データ: SSG 済みの <script type="application/ld+json"> を温存する。
    // 以前は JS 側で削除→再注入していたが、inject-seo.js が @graph 形式の
    // MusicRecording + BreadcrumbList を静的に焼き込んでいるため、JSでの再生成は廃止。
    // PJAX 遷移時のみ過去の data-td2-ld を掃除する（SSG ノードは残す）。
    document.querySelectorAll('script[data-td2-ld]').forEach(function(s) { s.remove(); });
  }

  // ─── v2 関連曲描画 ──────────────────────────────────
  function renderRelatedV2(track, allTracks) {
    var related = getRelatedTracks(track, allTracks, 6);
    var section = el('track-related');
    var grid    = el('track-related-grid');
    if (!grid) return;

    if (related.length === 0) {
      if (section) section.hidden = true;
      return;
    }

    var frag = document.createDocumentFragment();
    related.forEach(function(t) {
      var allTagsFlat = [
        ...(t.feeling || []),
        ...(t.style   || []),
        ...(t.scene   || []),
        ...(t.story   || []),
      ];
      var primaryTag = TAG_PRIORITY.find(function(tag) { return allTagsFlat.includes(tag); }) || allTagsFlat[0] || '';
      var bgUrl = TAG_BG[primaryTag] || FALLBACK_BG;

      var displayTags = [
        ...(t.scene   || []).slice(0, 1),
        ...(t.feeling || []).slice(0, 1),
        ...(t.style   || []).slice(0, 1),
      ].slice(0, 3);

      var card = document.createElement('a');
      card.className = 'td2-related-card';
      card.href = t.id + '.html';
      card.setAttribute('aria-label', getTrackTitle(t));

      card.innerHTML =
        '<div class="td2-related-card__bg" style="background-image: url(\'' + bgUrl + '\')"></div>' +
        '<div class="td2-related-card__overlay"></div>' +
        '<div class="td2-related-card__play" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>' +
        '</div>' +
        '<div class="td2-related-card__body">' +
          '<div class="td2-related-card__id">' + esc(t.id.toUpperCase()) + (t.duration ? ' <span class="td2-related-card__duration">' + esc(t.duration) + '</span>' : '') + '</div>' +
          '<div class="td2-related-card__title" data-track-id="' + esc(t.id) + '">' + esc(getTrackTitle(t)) + '</div>' +
          '<div class="td2-related-card__desc" data-track-id="' + esc(t.id) + '">' + esc(getTrackDescription(t)) + '</div>' +
          '<div class="td2-related-card__tags">' +
            displayTags.map(function(tag) {
              return '<span class="td2-related-card__tag" data-tag="' + esc(tag) + '">' + esc(getTagLabel(tag)) + '</span>';
            }).join('') +
          '</div>' +
        '</div>';

      // クリックで再生 + ページ遷移（音を途切れさせない）
      card.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.HMIX_PLAYER) {
          window.HMIX_PLAYER.playTrack(t, window.TRACKS || []);
        }
        // PJAX ルーターがあればそれを使う（音が途切れない）
        if (window.HMIX_ROUTER) {
          window.HMIX_ROUTER.navigate(t.id + '.html');
        } else {
          // ルーターがない場合もページ内で再描画（フルリロードしない）
          history.pushState(null, '', t.id + '.html');
          if (typeof initTrackDetail === 'function') {
            initTrackDetail();
          } else {
            // フォールバック：再生を維持したまま遷移
            setTimeout(function() { window.location.href = t.id + '.html'; }, 100);
          }
        }
      });

      frag.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(frag);
    if (section) section.hidden = false;

    // ── ジャンル LP へのリンク（SEO内部リンク強化）──
    _renderGenreLinks(track, section);
  }

  var GENRE_MAP = [
    { tag: 'japanese',   cat: 'style',   slug: 'japanese',   ja: '和風BGM一覧',          en: 'Japanese BGM' },
    { tag: 'horror',     cat: 'feeling', slug: 'horror',     ja: 'ホラーBGM一覧',        en: 'Horror BGM' },
    { tag: 'fantasy',    cat: 'style',   slug: 'fantasy',    ja: 'ファンタジーBGM一覧',  en: 'Fantasy BGM' },
    { tag: 'battle',     cat: 'scene',   slug: 'battle',     ja: '戦闘BGM一覧',          en: 'Battle BGM' },
    { tag: 'gentle',     cat: 'feeling', slug: 'healing',    ja: '癒しBGM一覧',          en: 'Healing BGM' },
    { tag: 'sad',        cat: 'feeling', slug: 'sad',        ja: '悲しいBGM一覧',        en: 'Sad BGM' },
    { tag: 'epic',       cat: 'feeling', slug: 'epic',       ja: '壮大なBGM一覧',        en: 'Epic BGM' },
    { tag: 'happy',      cat: 'feeling', slug: 'happy',      ja: '楽しいBGM一覧',        en: 'Happy BGM' },
    { tag: 'suspense',   cat: 'feeling', slug: 'suspense',   ja: 'サスペンスBGM一覧',    en: 'Suspense BGM' },
    { tag: 'celtic',     cat: 'style',   slug: 'celtic',     ja: 'ケルト風BGM一覧',      en: 'Celtic BGM' },
    { tag: 'electronic', cat: 'style',   slug: 'electronic', ja: '近未来BGM一覧',        en: 'Electronic BGM' },
  ];

  function _renderGenreLinks(track, afterEl) {
    if (!afterEl) return;
    // 既にあれば削除（PJAX再遷移対策）
    var existing = document.querySelector('.td2-genre-links');
    if (existing) existing.remove();

    var matched = GENRE_MAP.filter(function(g) {
      return (track[g.cat] || []).indexOf(g.tag) !== -1;
    });
    if (!matched.length) return;

    var isEn = window.HMIX_LANG === 'en';
    var container = document.createElement('div');
    container.className = 'td2-genre-links';
    container.innerHTML = matched.map(function(g) {
      var label = isEn ? g.en : g.ja;
      return '<a href="/genre/' + g.slug + '.html" class="td2-genre-link">' + label + '</a>';
    }).join('');

    afterEl.parentNode.insertBefore(container, afterEl.nextSibling);
  }

  // ════════════════════════════════════════════════════
  //   旧テンプレート レンダリング（v1 — 後方互換）
  // ════════════════════════════════════════════════════

  function renderTrack(track) {
    const basePath = (typeof window.HMIX_BASE_PATH !== 'undefined') ? window.HMIX_BASE_PATH : '';

    const pageTitle = getTrackTitle(track) + ' — H/MIX GALLERY';
    document.title = pageTitle;
    const descMeta = el('page-desc');
    if (descMeta) descMeta.setAttribute('content', getTrackDescription(track));
    const ogTitle = el('og-title');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    const ogDesc = el('og-desc');
    if (ogDesc) ogDesc.setAttribute('content', getTrackDescription(track));
    const canonical = el('page-canonical');
    if (canonical) canonical.setAttribute('href', 'https://www.hmix.net/music/' + track.id + '.html');

    const breadcrumb = el('breadcrumb-title');
    if (breadcrumb) breadcrumb.textContent = getTrackTitle(track);

    const jacket = el('track-jacket');
    const primaryTag = getPrimaryTag(track);
    if (jacket && primaryTag) jacket.setAttribute('data-tag', primaryTag);

    const jacketId = el('jacket-id');
    if (jacketId) jacketId.textContent = track.id.toUpperCase();

    const infoId = el('info-id');
    if (infoId) infoId.textContent = track.id.toUpperCase();
    const infoTitle = el('info-title');
    if (infoTitle) infoTitle.textContent = getTrackTitle(track);
    const infoDesc = el('info-desc');
    if (infoDesc) infoDesc.textContent = getTrackDescription(track);

    ['feeling', 'style', 'scene', 'story'].forEach(cat => {
      const list = el('tag-list-' + cat);
      const row  = el('tag-row-' + cat);
      if (!list) return;
      const tags = track[cat] || [];
      if (tags.length === 0) {
        if (row) row.hidden = true;
        return;
      }
      list.innerHTML = tags.map(tag => {
        const label = getTagLabel(tag);
        return `<a class="track-tag-chip" href="../music-library.html?${cat}=${esc(tag)}" aria-label="${esc(label)}で絞り込む" data-tag="${esc(tag)}">${esc(label)}</a>`;
      }).join('');
    });

    const licenseBox = document.querySelector('.track-license-box');
    if (licenseBox && !document.querySelector('.track-youtube-badge')) {
      const isJa = (document.documentElement.lang || 'ja').startsWith('ja');
      const badge = document.createElement('span');
      badge.className = 'track-youtube-badge';
      badge.textContent = isJa ? '✓ YouTubeライセンス対応' : '✓ YouTube Safe (license required)';
      licenseBox.insertAdjacentElement('beforebegin', badge);

      const ctaBox = document.createElement('div');
      ctaBox.className = 'track-license-cta';
      if (isJa) {
        ctaBox.innerHTML =
          '<p class="track-license-cta-text">YouTubeなど収益化コンテンツ・商用プロジェクトへのご利用には、商用ライセンスが必要です。</p>' +
          '<a class="track-license-cta-btn" href="/license-request.html">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
            '商用ライセンスを購入' +
          '</a>';
      } else {
        ctaBox.innerHTML =
          '<p class="track-license-cta-text">A commercial license is required for monetized YouTube videos and other commercial projects.</p>' +
          '<a class="track-license-cta-btn" href="/license-request.html">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
            'Get Commercial License' +
          '</a>';
      }
      licenseBox.insertAdjacentElement('beforebegin', ctaBox);
    }

    const dlBtn = el('track-download-btn');
    if (dlBtn) {
      dlBtn.href = basePath + track.mp3;
      dlBtn.setAttribute('download', track.id + '.mp3');
    }

    const audio   = el('track-audio');
    const playBtn = el('track-play-btn');
    const playIcon= playBtn ? playBtn.querySelector('.track-play-icon') : null;
    const playLabel = playBtn ? playBtn.querySelector('.track-play-label') : null;
    const progressFill = el('track-progress-fill');
    const timeCurrent  = el('track-time-current');
    const timeTotal    = el('track-time-total');
    const progressBar  = el('track-progress-bar');

    if (audio) {
      audio.src = track.mp3;
      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        if (progressFill) progressFill.style.width = pct + '%';
        if (timeCurrent) timeCurrent.textContent = formatTime(audio.currentTime);
      });
      audio.addEventListener('loadedmetadata', () => {
        if (timeTotal) timeTotal.textContent = formatTime(audio.duration);
      });
      audio.addEventListener('ended', () => { stopPlay(); });
      if (progressBar) {
        progressBar.addEventListener('click', (e) => {
          if (!audio.duration) return;
          const rect = progressBar.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          audio.currentTime = ratio * audio.duration;
        });
      }
    }

    let isPlaying = false;

    function startPlay() {
      if (!audio) return;
      audio.play().catch(err => console.warn('再生エラー:', err));
      isPlaying = true;
      if (jacket) jacket.classList.add('playing');
      if (playBtn) playBtn.classList.add('playing');
      if (playIcon) playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      if (playLabel) playLabel.textContent = '停止する';
    }

    function stopPlay() {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;
      if (jacket) jacket.classList.remove('playing');
      if (playBtn) playBtn.classList.remove('playing');
      if (playIcon) playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
      if (playLabel) playLabel.textContent = '試聴する';
      if (progressFill) progressFill.style.width = '0%';
      if (timeCurrent) timeCurrent.textContent = '0:00';
    }

    function setLocalPlayIcon(on){
      if (jacket) jacket.classList.toggle('playing', on);
      if (playBtn) playBtn.classList.toggle('playing', on);
      if (playIcon) playIcon.innerHTML = on ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<polygon points="5 3 19 12 5 21 5 3"/>';
      if (playLabel) playLabel.textContent = on ? '停止する' : '試聴する';
    }
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (window.HMIX_PLAYER && window.HMIX_PLAYER.playTrackById) {
          // グローバルプレイヤーをトグル（同じ曲再生中なら停止）。ローカルaudioは使わない＝停止が確実に効く
          window.HMIX_PLAYER.playTrackById(track.id);
          isPlaying = !isPlaying;
          setLocalPlayIcon(isPlaying);
          return;
        }
        if (window.HMIX_PLAYER) {
          const allTracks = (typeof window.TRACKS !== 'undefined') ? window.TRACKS : [];
          window.HMIX_PLAYER.playTrack(track, allTracks);
          isPlaying = true; setLocalPlayIcon(true);
          return;
        }
        if (isPlaying) stopPlay();
        else startPlay();
      });
    }

    const mainEl = el('track-main');
    if (mainEl) mainEl.hidden = false;
  }

  // ─── 旧テンプレート 関連曲描画 ──────────────────────
  function renderRelated(track, allTracks) {
    const related = getRelatedTracks(track, allTracks, 6);
    if (related.length === 0) return;

    const section = el('track-related');
    const grid    = el('track-related-grid');
    if (!section || !grid) return;

    const frag = document.createDocumentFragment();
    related.forEach(t => {
      const card = document.createElement('a');
      card.className = 'related-card';
      card.href = t.id + '.html';
      card.setAttribute('aria-label', t.title);

      const allTagsFlat = [...(t.feeling||[]), ...(t.style||[]), ...(t.scene||[]), ...(t.story||[])];
      const primaryTag = TAG_PRIORITY.find(tag => allTagsFlat.includes(tag)) || '';
      const displayTags = [
        ...(t.scene   || []).slice(0, 1),
        ...(t.feeling || []).slice(0, 1),
        ...(t.style   || []).slice(0, 1),
      ].slice(0, 3);

      card.innerHTML = `
        <div class="related-card-jacket" ${primaryTag ? `data-tag="${esc(primaryTag)}"` : ''}>
          <span class="related-card-jacket-id">${esc(t.id.toUpperCase())}</span>
        </div>
        <div class="related-card-body">
          <div class="related-card-title">${esc(t.title)}</div>
          <div class="related-card-tags">
            ${displayTags.map(tag => `<span class="related-card-tag">${esc(TAG_LABELS[tag] || tag)}</span>`).join('')}
          </div>
        </div>
      `;
      frag.appendChild(card);
    });

    grid.appendChild(frag);
    section.hidden = false;
  }

  // ─── 言語切替時テキスト更新（v2） ──────────────────
  function applyDataLang() {
    var isEn = getCurrentLang() === 'en';
    document.querySelectorAll('[data-ja][data-en]').forEach(function(elem) {
      elem.textContent = isEn ? elem.getAttribute('data-en') : elem.getAttribute('data-ja');
    });
    // body クラスも同期
    document.body.classList.toggle('lang-en', isEn);
    // ボタン表示更新
    var btn = document.getElementById('ml-lang-toggle');
    if (btn) {
      var GLOBE = '<svg class="lang-globe" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" width="11" height="11" aria-hidden="true"><circle cx="6" cy="6" r="5.3"/><path d="M1.5 4.5h9M1.5 7.5h9M6 0.7C4.3 2.5 3.5 4.2 3.5 6s.8 3.5 2.5 5.3M6 0.7C7.7 2.5 8.5 4.2 8.5 6s-.8 3.5-2.5 5.3"/></svg>';
      btn.innerHTML = GLOBE + (isEn
        ? '<span class="lang-opt">JP</span><span class="lang-sep"> / </span><span class="lang-opt lang-opt--active">EN</span>'
        : '<span class="lang-opt lang-opt--active">JP</span><span class="lang-sep"> / </span><span class="lang-opt">EN</span>');
    }
  }

  function updateLangV2(track) {
    var title = getTrackTitle(track);

    // data-ja / data-en 要素（ライセンスセクション等）を一括更新
    applyDataLang();

    setText(el('td2-hero-title'), title);
    setMultilineHtml(el('td2-hero-desc'), getTrackDescription(track));
    setText(el('td2-breadcrumb-title'), title);

    document.title = title + ' — H/MIX GALLERY';
    var desc = getTrackDescription(track);
    var descMeta = el('page-desc');
    if (descMeta) descMeta.setAttribute('content', desc);
    var ogDesc = el('og-desc');
    if (ogDesc) ogDesc.setAttribute('content', desc);
    var twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', desc);

    // クレジットテキスト（言語切替時に再生成）
    var creditText = el('credit-text');
    if (creditText) {
      var activeTab = document.querySelector('.td2-credit-copy__tab.active');
      var mode = activeTab ? activeTab.getAttribute('data-mode') : 'with-title';
      var isEnLang = getCurrentLang() === 'en';
      if (mode === 'with-title') {
        creditText.textContent = isEnLang
          ? 'Music: ' + title + ' by H/MIX GALLERY (Hirokazu Akiyama)\nhttps://www.hmix.net | Free music for YouTube'
          : 'BGM：' + title + ' / H/MIX GALLERY（秋山裕和）\nhttps://www.hmix.net';
      } else {
        creditText.textContent = isEnLang
          ? 'Music by H/MIX GALLERY (Hirokazu Akiyama): https://www.hmix.net'
          : 'BGM：H/MIX GALLERY（秋山裕和）  https://www.hmix.net';
      }
    }

    // タグラベル更新
    document.querySelectorAll('.td2-tag[data-tag]').forEach(function(tagEl) {
      tagEl.textContent = getTagLabel(tagEl.getAttribute('data-tag'));
    });

    // 関連曲カード タイトル & タグ更新
    document.querySelectorAll('.td2-related-card__title[data-track-id]').forEach(function(titleEl) {
      var t = (window.TRACKS || []).find(function(tr) { return tr.id === titleEl.getAttribute('data-track-id'); });
      if (t) {
        titleEl.textContent = getTrackTitle(t);
        titleEl.closest('.td2-related-card') && titleEl.closest('.td2-related-card').setAttribute('aria-label', getTrackTitle(t));
      }
    });
    document.querySelectorAll('.td2-related-card__desc[data-track-id]').forEach(function(descEl) {
      var t = (window.TRACKS || []).find(function(tr) { return tr.id === descEl.getAttribute('data-track-id'); });
      if (t) descEl.textContent = getTrackDescription(t);
    });
    document.querySelectorAll('.td2-related-card__tag[data-tag]').forEach(function(tagEl) {
      tagEl.textContent = getTagLabel(tagEl.getAttribute('data-tag'));
    });
  }

  // 言語変更イベント購読（モジュールレベルで一度だけ）
  window.addEventListener('hmix:lang', function() {
    if (currentIsV2 && currentTrack) updateLangV2(currentTrack);
    if (currentTrack) updateEditorialV2(currentTrack);
  });

  // ─── ヘッダーナビゲーション（スクロール制御） ────────
  function setNodeText(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function setNodeHtml(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.innerHTML = value;
  }


  function textLines(value) {
    return String(value || '').split(/\n+/).map(function(line) {
      return line.trim();
    }).filter(Boolean);
  }

  function firstEditorialSentence(value) {
    var line = textLines(value)[0] || String(value || '');
    var match = line.match(/^(.+?[。．！？!?])/);
    return (match ? match[1] : line).trim();
  }

  function catalogLabel(id) {
    var match = String(id || '').match(/^([a-z]+)(\d+)$/i);
    if (!match) return String(id || '').toUpperCase();
    return match[1].toUpperCase() + ' ' + match[2];
  }

  function editorialMetaLabel(track) {
    var tags = [
      ...((track.style || []).slice(0, 1)),
      ...((track.feeling || []).slice(0, 1))
    ].map(getTagLabel);
    return (tags.length ? tags.join(' / ') : (getCurrentLang() === 'en' ? 'Free BGM' : '無料BGM')) + ' - Free BGM';
  }

  function editorialDescriptionHtml(track) {
    var lines = textLines(getTrackDescription(track));
    if (!lines.length) lines = [getTrackTitle(track) + (getCurrentLang() === 'en' ? ' is a free BGM track from H/MIX GALLERY.' : 'はH/MIX GALLERYの無料BGMです。')];
    return lines.map(function(line, index) {
      var prefix = index === 0 ? '<span class="drop">' + esc(getTrackTitle(track)) + '</span> ' : '';
      return '<p>' + prefix + esc(line) + '</p>';
    }).join('');
  }

  function updateEditorialCredit(track) {
    var creditText = el('creditText');
    if (!creditText) return;
    var activeTab = document.querySelector('.tabs .tab.on') || document.querySelector('.tabs .tab[data-credit="with"]');
    var mode = activeTab ? activeTab.getAttribute('data-credit') : 'with';
    var isEn = getCurrentLang() === 'en';
    if (mode === 'without') {
      creditText.textContent = isEn
        ? 'Music by H/MIX GALLERY (Hirokazu Akiyama): https://www.hmix.net'
        : 'BGM：H/MIX GALLERY（秋山裕和） https://www.hmix.net';
    } else {
      creditText.textContent = isEn
        ? 'Music: ' + getTrackTitle(track) + ' by H/MIX GALLERY (Hirokazu Akiyama)\nhttps://www.hmix.net | Free music for YouTube'
        : 'BGM：' + getTrackTitle(track) + ' / H/MIX GALLERY（秋山裕和） https://www.hmix.net';
    }
  }

  function updateEditorialTags(track) {
    var catNames = {
      feeling: ['Feeling', '感情'],
      style: ['Style', '曲調'],
      scene: ['Scene', '場面'],
      story: ['Story', '物語']
    };
    Object.keys(catNames).forEach(function(cat) {
      var group = document.querySelector('.tag-group[data-cat="' + cat + '"]');
      if (!group) return;
      var tags = track[cat] || [];
      group.hidden = tags.length === 0;
      var labels = group.querySelectorAll('.gl span');
      if (labels[0]) labels[0].textContent = catNames[cat][0];
      if (labels[1]) labels[1].textContent = getCurrentLang() === 'en' ? catNames[cat][0] : catNames[cat][1];
      var chips = group.querySelector('.chips');
      if (!chips) return;
      chips.innerHTML = tags.map(function(tag) {
        return '<a class="chip" href="../music-library.html?' + esc(cat) + '=' + esc(tag) + '" data-tag="' + esc(tag) + '">' + esc(getTagLabel(tag)) + '</a>';
      }).join('');
    });
  }

  function renderEditorialRelated(track) {
    var grid = el('track-related-grid');
    if (!grid) return;
    var related = getRelatedTracks(track, window.TRACKS || [], 3);
    grid.innerHTML = related.map(function(t) {
      var bgUrl = TAG_BG[getPrimaryTag(t)] || FALLBACK_BG;
      var displayTags = [
        ...((t.scene || []).slice(0, 1)),
        ...((t.feeling || []).slice(0, 1)),
        ...((t.style || []).slice(0, 1))
      ].slice(0, 2);
      return '<a class="rel-card" href="' + esc(t.id) + '.html">' +
        '<img src="' + esc(bgUrl) + '" alt="">' +
        '<div class="rel-body">' +
          '<div class="rel-num">No. ' + esc(catalogLabel(t.id)) + '</div>' +
          '<div class="rel-name">' + esc(getTrackTitle(t)) + '</div>' +
          '<div class="rel-jp">' + esc(firstEditorialSentence(getCurrentLang() === 'en' ? (t.description_en || t.description) : t.description)) + '</div>' +
          '<div class="rel-tags">' + displayTags.map(function(tag) {
            return '<span data-tag="' + esc(tag) + '">' + esc(getTagLabel(tag)) + '</span>';
          }).join('') + '</div>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  function updateEditorialV2(track) {
    var page = document.querySelector('.editorial-v2');
    if (!page) return;

    var isEn = getCurrentLang() === 'en';
    document.documentElement.lang = isEn ? 'en' : 'ja';
    document.body.classList.toggle('lang-en', isEn);

    var title = getTrackTitle(track);
    var desc = getTrackDescription(track);
    var pageTitle = isEn
      ? title + ' - Royalty-Free BGM | H/MIX GALLERY'
      : title + ' - 無料BGM | H/MIX GALLERY';
    document.title = pageTitle;

    setNodeText('#td2-breadcrumb-title', title);
    setNodeText('#td2-hero-title', isEn ? (track.title_en || track.title || title) : title);
    setNodeText('#td2-hero-reading', isEn ? (track.title || title) : (track.title_en || title));
    setNodeText('.hero-cat .num', 'No. ' + catalogLabel(track.id));
    setNodeText('.hero-cat .meta', editorialMetaLabel(track));
    setNodeHtml('.hero-lead', esc(firstEditorialSentence(desc)));
    setNodeHtml('.about-lead', editorialDescriptionHtml(track));

    setNodeText('.about .sec-head h2', isEn ? 'About This Track' : 'この一曲について');
    setNodeText('.about .sec-head .sub', 'A quiet note on the piece');
    setNodeText('.tags .sec-head h2', isEn ? 'Sound Cues' : '音のキーワード');
    setNodeText('.tags .sec-head .sub', 'Feeling - Style - Scene - Story');
    setNodeText('.license .sec-head h2', isEn ? 'License & Download' : '利用とダウンロード');
    setNodeText('.license .sec-head .sub', 'Free to use');
    setNodeText('.commercial .sec-head h2', isEn ? 'Commercial License' : '商用ライセンス');
    setNodeText('.commercial .sec-head .sub', 'For broader use');
    setNodeText('.related .sec-head h2', isEn ? 'Similar Soundscapes' : '近い空気の曲');
    setNodeText('.related .sec-head .sub', 'Continue the journey');
    setNodeText('.back-link a', isEn ? 'Explore more free music' : '音楽素材をもっと探す');

    setNodeText('.facts .fact:nth-child(1) dd', title);
    setNodeText('.facts .fact:nth-child(2) dd', catalogLabel(track.id));
    setNodeText('.facts .fact:nth-child(3) dd', track.duration || '--:--');
    setNodeText('.facts .fact:nth-child(4) dd', isEn ? 'Free / Commercial use allowed' : '無料 / 商用利用可');
    setNodeText('.facts .fact:nth-child(5) dd', isEn ? 'Hirokazu Akiyama' : '秋山裕和');

    setNodeText('.card.free h3', isEn ? 'Free Download' : '無料ダウンロード');
    setNodeText('.card.free .desc', isEn
      ? 'You may use this track in monetized YouTube videos. A credit in the description is appreciated.'
      : 'YouTube収益化動画などにも無料でご利用いただけます。説明欄などにクレジットを入れていただけると励みになります。');
    setNodeText('.dl-btn', isEn ? 'Download MP3' : 'MP3をダウンロード');
    setNodeText('.card.credit h3', isEn ? 'Credit' : 'クレジット');
    setNodeText('.card.credit .ch', isEn ? 'Copy and paste this credit' : 'コピーして使える表記');
    setNodeText('.tab[data-credit="with"]', isEn ? 'With title' : '曲名あり');
    setNodeText('.tab[data-credit="without"]', isEn ? 'Without title' : '曲名なし');
    setNodeText('.card.credit .note', isEn
      ? 'For monetized YouTube videos, a credit in the description is appreciated. Please check the license terms for details.'
      : 'YouTube収益化動画では、説明欄などにクレジットを入れていただけると励みになります。詳しくは利用規約をご確認ください。');
    setNodeText('.price-card:nth-child(1) .pc-name', isEn ? 'Single Track License' : '単曲ライセンス');
    setNodeText('.price-card:nth-child(1) .pc-unit', isEn ? 'One track / one-time purchase' : '1曲 / 買い切り');
    setNodeText('.price-card:nth-child(2) .pc-name', isEn ? 'Project Pack' : 'プロジェクトパック');
    setNodeText('.price-card:nth-child(2) .pc-unit', isEn ? 'One project / all tracks' : '1プロジェクト / 全曲');
    setNodeText('.ghost-btn', isEn ? 'View License Terms ->' : '利用規約を見る ->');
    setNodeText('.comm-note', isEn ? 'Please check the terms for commercial use scope and prohibited uses.' : '商用利用の範囲や禁止事項は、利用規約をご確認ください。');
    setNodeText('.fav-list-btn__label', isEn ? 'Saved' : 'お気に入り');
    setNodeText('#player-track-title', isEn ? '- Select a track to play -' : '- 曲を選択してください -');

    var heroImg = el('heroImg');
    if (heroImg) {
      var bgUrl = TAG_BG[getPrimaryTag(track)] || FALLBACK_BG;
      heroImg.setAttribute('src', bgUrl);
    }

    var dlBtn = el('td2-download-btn');
    if (dlBtn) {
      dlBtn.href = track.mp3;
      dlBtn.setAttribute('download', track.id + '.mp3');
    }

    setNodeText('#heroTime', '0:00 / ' + (track.duration || '--:--'));
    updateEditorialTags(track);
    updateEditorialCredit(track);
    renderEditorialRelated(track);
    updateEditorialFavoriteLabel();

    var metaDesc = el('page-desc');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    var canonical = el('page-canonical');
    if (canonical) canonical.setAttribute('href', 'https://www.hmix.net/music/' + track.id + '.html');
    var ogTitle = el('og-title');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    var ogDesc = el('og-desc');
    if (ogDesc) ogDesc.setAttribute('content', desc);
  }

  function updateEditorialFavoriteLabel() {
    var heroFav = el('hero-fav-btn');
    var label = heroFav && heroFav.querySelector('.editorial-fav-label');
    if (!heroFav || !label) return;
    var isEn = getCurrentLang() === 'en';
    var active = heroFav.classList.contains('active') || heroFav.getAttribute('aria-pressed') === 'true';
    label.textContent = active ? (isEn ? 'Saved' : '保存済み') : (isEn ? 'Save to Favorites' : 'お気に入りに追加');
    heroFav.setAttribute('aria-label', active ? (isEn ? 'Remove from favorites' : 'お気に入りから外す') : (isEn ? 'Save to favorites' : 'お気に入りに追加'));
  }

  function setEditorialPlaying(isPlaying) {
    var heroBtn = el('hero-play-btn');
    var wave = el('heroWave');
    var label = el('heroPlayLabel');
    var playIcon = heroBtn && heroBtn.querySelector('.ico-play');
    var pauseIcon = heroBtn && heroBtn.querySelector('.ico-pause');
    var isEn = getCurrentLang() === 'en';
    if (heroBtn) {
      heroBtn.classList.toggle('playing', isPlaying);
      heroBtn.setAttribute('aria-label', isPlaying ? (isEn ? 'Pause' : '一時停止') : (isEn ? 'Play' : '再生'));
    }
    if (playIcon) playIcon.style.display = isPlaying ? 'none' : '';
    if (pauseIcon) pauseIcon.style.display = isPlaying ? '' : 'none';
    if (wave) wave.classList.toggle('live', isPlaying);
    if (label) label.textContent = isPlaying ? (isEn ? 'Playing' : '再生中') : (isEn ? 'Listen' : '試聴する');
  }

  function initEditorialV2(track) {
    var page = document.querySelector('.editorial-v2');
    if (!page) return;

    var wave = el('heroWave');
    if (wave && !wave.children.length) {
      [22,28,35,44,52,60,48,38,56,70,62,46,34,41,58,72,66,50,42,55,68,76,64,49,36,45,57,69,74,61,47,39,51,63,71,58,44,32,40,53,65,73,67,54,43,36,48,59,66,52,41,34,29,24,20,18].forEach(function(height, index) {
        var bar = document.createElement('span');
        bar.style.height = height + '%';
        bar.style.animationDelay = (index * 0.045) + 's';
        wave.appendChild(bar);
      });
    }

    var heroBtn = el('hero-play-btn');
    if (heroBtn && !heroBtn.dataset.editorialPlayBound) {
      heroBtn.dataset.editorialPlayBound = 'true';
      heroBtn.addEventListener('click', function() {
        try {
          // 同じ曲が再生中なら停止、それ以外は再生（トグル）。アイコンは hmix:player:state 監視で同期。
          if (window.HMIX_PLAYER && window.HMIX_PLAYER.playTrackById) {
            window.HMIX_PLAYER.playTrackById(track.id);
          } else if (window.HMIX_PLAYER) {
            window.HMIX_PLAYER.playTrack(track, window.TRACKS || []);
            setEditorialPlaying(true);
          }
        } catch (err) {
          console.warn('[track-detail] Player toggle failed:', err);
        }
      });
    }

    var heroFav = el('hero-fav-btn');
    if (heroFav && !heroFav.dataset.editorialFavBound) {
      heroFav.dataset.editorialFavBound = 'true';
      heroFav.addEventListener('click', function() { setTimeout(updateEditorialFavoriteLabel, 0); });
      new MutationObserver(updateEditorialFavoriteLabel).observe(heroFav, { attributes:true, attributeFilter:['class', 'aria-pressed'] });
    }

    document.querySelectorAll('.tabs .tab[data-credit]').forEach(function(tab) {
      if (tab.dataset.editorialCreditBound) return;
      tab.dataset.editorialCreditBound = 'true';
      tab.addEventListener('click', function() {
        document.querySelectorAll('.tabs .tab[data-credit]').forEach(function(t) { t.classList.remove('on'); });
        tab.classList.add('on');
        updateEditorialCredit(currentTrack || track);
      });
    });

    var copyBtn = el('copyBtn');
    var creditText = el('creditText');
    if (copyBtn && creditText && !copyBtn.dataset.editorialCopyBound) {
      copyBtn.dataset.editorialCopyBound = 'true';
      copyBtn.addEventListener('click', function() {
        var text = creditText.textContent || '';
        var done = function() {
          copyBtn.classList.add('done');
          var span = copyBtn.querySelector('span');
          if (span) span.textContent = 'Copied';
          setTimeout(function() {
            copyBtn.classList.remove('done');
            if (span) span.textContent = 'Copy';
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
          done();
        }
      });
    }

    if (!window.__hmixEditorialPlayerStateBound) {
      window.__hmixEditorialPlayerStateBound = true;
      window.addEventListener('hmix:player:state', function(event) {
        var detail = event.detail || {};
        var id = currentTrack && currentTrack.id;
        setEditorialPlaying(detail.trackId === id && detail.state === 'playing');
      });
    }

    if (!page.dataset.editorialRevealReady) {
      page.dataset.editorialRevealReady = 'true';
      page.classList.add('reveal-ready');
      var revealVisibleNow = function() {
        var viewport = window.innerHeight || document.documentElement.clientHeight || 0;
        document.querySelectorAll('#page-content .reveal:not(.in)').forEach(function(node) {
          var rect = node.getBoundingClientRect();
          if (rect.top < viewport * 0.92 && rect.bottom > -80) node.classList.add('in');
        });
      };
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold:0.14 });
      document.querySelectorAll('#page-content .reveal').forEach(function(node) { io.observe(node); });
      window.addEventListener('scroll', revealVisibleNow, { passive:true });
      window.addEventListener('resize', revealVisibleNow);
      requestAnimationFrame(revealVisibleNow);
      setTimeout(revealVisibleNow, 400);
    }

    updateEditorialV2(track);
  }
  function initHeader() {
    const header = el('site-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }, { passive: true });

    const toggle = header.querySelector('.nav-toggle');
    const navList = header.querySelector('.nav-list');
    if (toggle && navList && !toggle.dataset.trackDetailNavBound) {
      toggle.dataset.trackDetailNavBound = 'true';

      function closeNav() {
        navList.classList.remove('open');
        navList.querySelectorAll('.nav-item--submenu-open').forEach(function(item) {
          item.classList.remove('nav-item--submenu-open');
          var link = item.querySelector('.nav-link');
          if (link) link.setAttribute('aria-expanded', 'false');
        });
        toggle.setAttribute('aria-expanded', 'false');
        toggle.classList.remove('active');
      }

      toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = navList.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.classList.toggle('active', isOpen);
      });

      navList.querySelectorAll('.nav-item--dropdown > .nav-link').forEach(function(dropdownLink) {
        dropdownLink.setAttribute('aria-expanded', 'false');
        dropdownLink.addEventListener('click', function(e) {
          if (!navList.classList.contains('open')) return;
          e.preventDefault();
          e.stopPropagation();
          var item = dropdownLink.closest('.nav-item--dropdown');
          var isOpen = item.classList.toggle('nav-item--submenu-open');
          dropdownLink.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
      });

      navList.addEventListener('click', function(e) {
        var submenuLink = e.target.closest && e.target.closest('.nav-submenu__link');
        if (submenuLink) {
          closeNav();
          return;
        }

        var dropdownLink = e.target.closest && e.target.closest('.nav-item--dropdown > .nav-link');
        if (dropdownLink && navList.classList.contains('open')) {
          e.preventDefault();
          return;
        }

        if (e.target.closest && e.target.closest('.nav-link')) closeNav();
      });

      document.addEventListener('click', function(e) {
        if (navList.classList.contains('open') &&
            !navList.contains(e.target) &&
            !toggle.contains(e.target)) {
          closeNav();
        }
      });
    }

    // EN ボタンを注入（track-detail 静的 HTML にはないため）
    function switchTrackDetailLang(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      var next = getCurrentLang() === 'en' ? 'ja' : 'en';
      window.HMIX_LANG = next;
      try { sessionStorage.setItem('hmix_lang', next); } catch(e) {}
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('lang', next);
        history.replaceState(null, '', url.toString());
      } catch(e) {}
      try { window.dispatchEvent(new CustomEvent('hmix:lang', { detail: { lang: next } })); } catch(e) {}
    }
    if (navList && !document.getElementById('ml-lang-toggle')) {
      var langLi  = document.createElement('li');
      var langBtn = document.createElement('button');
      langBtn.id        = 'ml-lang-toggle';
      langBtn.className = 'nav-lang-toggle';
      langBtn.setAttribute('aria-label', 'Switch language / 言語切替');
      var curLang = getCurrentLang();
      var GLOBE = '<svg class="lang-globe" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" width="11" height="11" aria-hidden="true"><circle cx="6" cy="6" r="5.3"/><path d="M1.5 4.5h9M1.5 7.5h9M6 0.7C4.3 2.5 3.5 4.2 3.5 6s.8 3.5 2.5 5.3M6 0.7C7.7 2.5 8.5 4.2 8.5 6s-.8 3.5-2.5 5.3"/></svg>';
      langBtn.innerHTML = GLOBE + (curLang === 'en'
        ? '<span class="lang-opt">JP</span><span class="lang-sep"> / </span><span class="lang-opt lang-opt--active">EN</span>'
        : '<span class="lang-opt lang-opt--active">JP</span><span class="lang-sep"> / </span><span class="lang-opt">EN</span>');
      langLi.appendChild(langBtn);
      navList.appendChild(langLi);

      // クリックで言語トグル（app.js が読み込まれていない場合の自前処理）
      langBtn.dataset.trackDetailLangBound = 'true';
      langBtn.addEventListener('click', switchTrackDetailLang);
    }

    var currentLangBtn = document.getElementById('ml-lang-toggle');
    if (currentLangBtn && !currentLangBtn.dataset.trackDetailLangBound) {
      currentLangBtn.dataset.trackDetailLangBound = 'true';
      currentLangBtn.addEventListener('click', switchTrackDetailLang, true);
    }

    // 初期ロード時に data-ja/data-en を適用（EN モードで来た場合も反映）
    applyDataLang();
  }

  // ─── 初期化 ──────────────────────────────────────────
  function init() {
    const trackId = getTrackId();

    if (!trackId) {
      const notFound = el('track-not-found');
      if (notFound) notFound.hidden = false;
      return;
    }

    const isV2 = !!document.querySelector('.td2-hero');

    function onTracksReady() {
      const allTracks = window.TRACKS || [];
      const track = allTracks.find(t => t.id === trackId);

      if (!track) {
        const notFound = el('track-not-found');
        if (notFound) notFound.hidden = false;
        console.warn('[track-detail.js] 楽曲が見つかりません: id=' + trackId);
        return;
      }

      currentTrack = track;
      currentIsV2  = isV2;

      if (isV2) {
        if (document.querySelector('.editorial-v2')) {
          initEditorialV2(track);
        } else {
          renderTrackV2(track);
          renderRelatedV2(track, allTracks);
          updateLangV2(track);
        }
      } else {
        renderTrack(track);
        renderRelated(track, allTracks);
      }
    }

    if (window.loadTracks) {
      window.loadTracks().then(onTracksReady).catch(function() { onTracksReady(); });
    } else if (window.TRACKS && window.TRACKS.length > 0) {
      onTracksReady();
    } else {
      window.addEventListener('tracks:ready', onTracksReady, { once: true });
    }
  }

  // ─── 旅人の足跡の動的ロード（直アクセス時のみ）──────────
  // PJAX経由の場合は index.html が既に footprints.js/footprints-detail.js をロード済み。
  // 直接URLアクセス時は未ロードのため動的に挿入し、ロード完了後に init() を呼ぶ。
  function loadFootprints() {
    // PJAX経由 or 既ロード済み → 再 init のみ
    if (window.HMIX_FOOTPRINTS) {
      if (window.HMIX_FOOTPRINTS_DETAIL) window.HMIX_FOOTPRINTS_DETAIL.init();
      return;
    }
    // CSS
    if (!document.querySelector('link[href*="footprints.css"]')) {
      var cssEl = document.createElement('link');
      cssEl.rel = 'stylesheet';
      cssEl.href = '../assets/css/footprints.css?v=20260609-3';
      document.head.appendChild(cssEl);
    }
    // Core JS → Detail JS（順番にロード）
    if (!document.querySelector('script[src*="footprints.js"]')) {
      var jsCore = document.createElement('script');
      jsCore.src = '../assets/js/footprints.js?v=20260609-3';
      jsCore.onload = function () {
        var jsDetail = document.createElement('script');
        jsDetail.src = '../assets/js/footprints-detail.js?v=20260609-3';
        document.head.appendChild(jsDetail);
      };
      document.head.appendChild(jsCore);
    }
  }

  // ─── credit-modal の動的ロード（直アクセス時のみ）───────
  // PJAX経由の場合は music-library.html が既にロード済み。
  // 直接URLアクセス時は credit-modal.js が未ロードのため動的に挿入する。
  function loadCreditModal() {
    if (window.HMIX_CREDIT_MODAL) return; // 既にロード済み
    // CSS
    if (!document.querySelector('link[href*="credit-modal.css"]')) {
      var cssEl = document.createElement('link');
      cssEl.rel = 'stylesheet';
      cssEl.href = '../assets/css/credit-modal.css';
      document.head.appendChild(cssEl);
    }
    // JS
    var jsEl = document.createElement('script');
    jsEl.src = '../assets/js/credit-modal.js';
    document.head.appendChild(jsEl);
  }

  // ─── PJAX再初期化エントリポイント ───────────────────
  // router.js から呼ばれる。#page-content スワップ後に実行。
  window.HMIX_INIT_TRACK_DETAIL = function() {
    init();
    initHeader();
    loadFootprints();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { init(); initHeader(); loadCreditModal(); loadFootprints(); });
  } else {
    init();
    initHeader();
    loadCreditModal();
    loadFootprints();
  }

  // ─── 「ひとつの心臓」: 曲詳細ヒーロー♡の統一ハンドラ ───────────────
  // 既存は描画経路（renderTrack / renderTrackV2 / initEditorialV2）が分岐し、
  // 一部経路でヒーロー♡が全くトグルされない既存バグがあった（本番でも♡無反応）。
  // 経路非依存の単一ハンドラに集約し、トグル復活＋全サーフェス同期(favorites:updated)を保証する。
  // capture+stopImmediatePropagation で各経路の旧ハンドラの二重発火を抑止。
  (function unifiedHeroFav() {
    // FavStore（window.HMIX_FAV）= 単一の心臓へ委譲。localStorage直接アクセスはしない。
    function favHas(id) {
      if (window.HMIX_FAV) return window.HMIX_FAV.has(String(id));
      try { return JSON.parse(localStorage.getItem('hmix_favorites') || '[]').indexOf(String(id)) !== -1; } catch (e) { return false; }
    }
    function heroBtn() { return document.getElementById('hero-fav-btn'); }
    function syncBtn() {
      var btn = heroBtn(); if (!btn) return;
      var id = (typeof getTrackId === 'function') ? getTrackId() : null; if (!id) return;
      var on = favHas(id);
      btn.classList.toggle('active', on);
      btn.classList.toggle('is-fav', on);
      btn.setAttribute('aria-pressed', String(on));
      var off = btn.querySelector('.td2-hero__fav-off'); var onEl = btn.querySelector('.td2-hero__fav-on');
      if (off) off.style.display = on ? 'none' : '';
      if (onEl) onEl.style.display = on ? '' : 'none';
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('#hero-fav-btn');
      if (!btn) return;
      e.stopImmediatePropagation(); // 各描画経路の旧♡ハンドラの二重トグルを抑止
      var id = (typeof getTrackId === 'function') ? getTrackId() : null; if (!id) return;
      id = String(id);
      if (window.HMIX_FAV) {
        // 0-5 Undo: 削除はトースト経由で確定、追加は即時。発火・件数同期はFavStoreが担う。
        if (window.HMIX_FAV.has(id)) window.HMIX_FAV.removeWithUndo(id); else window.HMIX_FAV.add(id);
      } else {
        try {
          var favs = JSON.parse(localStorage.getItem('hmix_favorites') || '[]');
          var idx = favs.indexOf(id);
          if (idx === -1) favs.push(id); else favs.splice(idx, 1);
          localStorage.setItem('hmix_favorites', JSON.stringify(favs));
          window.dispatchEvent(new CustomEvent('favorites:updated', { detail: { count: favs.length, ids: favs.slice() } }));
        } catch (e2) {}
      }
      syncBtn();
    }, true);
    // 他サーフェスでの変更を受けてヒーロー♡を同期（繋がっている安心感）
    window.addEventListener('favorites:updated', syncBtn);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncBtn);
    else syncBtn();
  })();

})();
