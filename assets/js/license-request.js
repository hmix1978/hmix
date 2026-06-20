/**
 * H/MIX GALLERY — license-request.js
 * 商用ライセンス購入フロー（Stripe Payment Link連携）
 *
 * ============================================================
 * # Stripe設定: 以下のURLを実際のPayment Linkに差し替えてください
 * ============================================================
 */
(function () {
  'use strict';

  // ── Stripe Checkout Session API ──────────────────────────────
  // Firebase Cloud Functions のエンドポイント
  var STRIPE_API_URL = 'https://createcheckout-r5y6n4kfwq-an.a.run.app';

  var PRICES = { single: 2200, pack: 7480 }; // すべて税込（消費税10%）

  // ── 店舗BGMパス（A表・年額サブスク）─────────────────────────
  // STORE_PASS_ENABLED: Stripe で年額サブスク3商品を作成し、バックエンドの
  //   STORE_PRICES_LIVE に Price ID を登録できたら true にしてデプロイする。
  //   false の間は店舗カードを従来どおり professional-license.html へのリンクで表示する
  //   （まだオンライン購入できないため、誤って決済エラーに当たらないようにする安全装置）。
  var STORE_PASS_ENABLED = true;
  var STORE_PRICES = { store_base: 9900, store_add: 4950, facility: 19800 }; // 税込/年
  function storeAnnualTotal(plan, count) {
    if (plan === 'facility') return STORE_PRICES.facility;
    var n = parseInt(count, 10);
    if (!isFinite(n) || n < 1) n = 1;
    if (n > 50) n = 50;
    return STORE_PRICES.store_base + STORE_PRICES.store_add * (n - 1);
  }

  // Professional（B表）用途 → 価格（税込/曲）。値・キーはサーバ側 PRO_USAGE_BAND と一致させること。
  var PRO_USAGE = [
    { v: 'film_festival',   ja: '映画祭・コンペ出品',            en: 'Film festival / competition',     price: 3300 },
    { v: 'audiobook',       ja: 'オーディオブック / 音声ドラマ', en: 'Audiobook / audio drama',         price: 3300 },
    { v: 'training',        ja: '企業研修 / eラーニング',        en: 'Corporate training / e-learning', price: 4400 },
    { v: 'web_ad',          ja: 'Web広告（中規模）',             en: 'Web advertising (mid-scale)',     price: 5500 },
    { v: 'stage',           ja: '舞台・商業イベント（1公演）',   en: 'Theater / commercial event (1 run)', price: 5500 },
    { v: 'radio',           ja: 'ラジオ放送・ラジオCM',          en: 'Radio broadcast / radio CM',      price: 5500 },
    { v: 'package',         ja: 'パッケージ販売（DVD/CD収録）',  en: 'Packaged media (DVD/CD)',         price: 5500 },
    { v: 'enterprise_vp',   ja: '企業VP（大企業）',              en: 'Enterprise VP (large corp.)',     price: 16500 },
    { v: 'tv_program',      ja: 'TV番組・ドキュメンタリー',      en: 'TV program / documentary',        price: 16500 },
    { v: 'large_game',      ja: '大規模商用ゲーム',              en: 'Major commercial game',           price: 16500 },
    { v: 'theatrical_film', ja: '劇場映画（配給）',              en: 'Theatrical film (distribution)',  price: 27500 },
  ];
  function proUsagePrice(v) {
    var u = PRO_USAGE.find(function (x) { return x.v === v; });
    return u ? u.price : null;
  }
  var STORAGE_KEY      = 'hmix_license_selection';
  var PURCHASE_KEY     = 'hmix_pending_purchase';

  // professional-license.html の「即時購入」から #usage=KEY（PJAXでクエリは落ちるためハッシュ）
  // で来たときに引き継ぐ用途。query ?usage= も後方互換で受ける。
  // 初回ロードで init が複数回走る（bottom script + inline + router）ため sessionStorage で全呼び出しに渡す。
  // ただし「設定直後の短時間だけ有効」とし、後の別動線（お気に入り経由など）に用途が残らないようにする。
  var USAGE_KEY = 'hmix_incoming_usage';
  var USAGE_FRESH_MS = 15000;   // 再init（数秒以内）には効き、別動線には残さない鮮度窓
  function parseIncomingUsage() {
    try {
      var m = (location.hash || '').match(/(?:^|[#&])usage=([^&]+)/) ||
              (location.search || '').match(/[?&]usage=([^&]+)/);
      var v = m ? decodeURIComponent(m[1]) : '';
      if (v && PRO_USAGE.some(function (u) { return u.v === v; })) {
        try { sessionStorage.setItem(USAGE_KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
        // ハッシュ/クエリを消す（loadSelection の tracks= 処理と衝突しないよう先に）
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
      }
    } catch (e) {}
  }
  function getIncomingUsage() {
    try {
      var raw = sessionStorage.getItem(USAGE_KEY);
      if (!raw) return '';
      var o = JSON.parse(raw);
      if (o && o.v && (Date.now() - (o.t || 0)) < USAGE_FRESH_MS) return o.v;
      sessionStorage.removeItem(USAGE_KEY);   // 鮮度切れ → 破棄
      return '';
    } catch (e) { return ''; }
  }
  function clearIncomingUsage() {
    try { sessionStorage.removeItem(USAGE_KEY); } catch (e) {}
  }

  // professional-license.html の店舗BGMパス「購入」から #plan=store / #plan=facility で来たとき、
  // 曲が0件でも購入フロー（店舗モード）を開けるようにするための引き継ぎ。usage と同じ鮮度窓。
  var PLAN_KEY = 'hmix_incoming_plan';
  function parseIncomingPlan() {
    try {
      var m = (location.hash || '').match(/(?:^|[#&])plan=([^&]+)/) ||
              (location.search || '').match(/[?&]plan=([^&]+)/);
      var v = m ? decodeURIComponent(m[1]) : '';
      if (v === 'store' || v === 'facility') {
        try { sessionStorage.setItem(PLAN_KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
      }
    } catch (e) {}
  }
  function getIncomingPlan() {
    if (!STORE_PASS_ENABLED) return '';
    try {
      var raw = sessionStorage.getItem(PLAN_KEY);
      if (!raw) return '';
      var o = JSON.parse(raw);
      if (o && o.v && (Date.now() - (o.t || 0)) < USAGE_FRESH_MS) return o.v;
      sessionStorage.removeItem(PLAN_KEY);
      return '';
    } catch (e) { return ''; }
  }
  function clearIncomingPlan() {
    try { sessionStorage.removeItem(PLAN_KEY); } catch (e) {}
  }

  var TAG_LABELS = {
    gentle:'優しい', sad:'悲しい', happy:'楽しい', epic:'勇壮',
    dark:'暗い', mysterious:'神秘', suspense:'緊迫', scary:'怖い', horror:'ホラー', japanese_horror:'和風ホラー', western_horror:'洋風ホラー',
    fantasy:'ファンタジー', japanese:'和風', celtic:'ケルト', medieval:'中世',
    oriental:'アジアン', futuristic:'近未来', electronic:'電子音',
    battle:'戦闘', boss:'ボス', town:'街', village:'村', field:'フィールド',
    forest:'森', night:'夜', travel:'旅', dungeon:'ダンジョン', ruins:'遺跡',
    cave:'洞窟', festival:'祭り', shrine:'神社', samurai:'サムライ',
    memory:'思い出', reunion:'再会', farewell:'別れ', victory:'勝利',
    defeat:'敗北', peaceful:'平和', dream:'夢',
  };

  function getLang() {
    return window.HMIX_LANG || (function() {
      try { return sessionStorage.getItem('hmix_lang') || 'ja'; } catch(e) { return 'ja'; }
    })();
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
    });
  }

  function getTagText(track) {
    var all = [].concat(track.feeling || [], track.style || [], track.scene || []);
    return all.slice(0, 3).map(function (t) { return TAG_LABELS[t] || t; }).join(' · ');
  }

  function generateLicenseId() {
    var date = new Date();
    var d = date.getFullYear().toString() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0');
    var rand = Math.random().toString(36).toUpperCase().slice(2, 6);
    return 'HMX-' + d + '-' + rand;
  }

  function loadSelection() {
    // URLハッシュ (#tracks=id1,id2,...) からの受け渡しに対応 (シアター等からの外部遷移)
    try {
      if (typeof location !== 'undefined' && location.hash) {
        var m = location.hash.match(/(?:^|[#&])tracks=([^&]+)/);
        if (m && m[1]) {
          var ids = decodeURIComponent(m[1]).split(',').map(function(s){ return s.trim(); }).filter(Boolean);
          if (ids.length > 0) {
            var items = ids.map(function(id){ return { id: id }; });
            // sessionStorage に保存して以降の遷移で維持
            try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch(e) {}
            // ハッシュをクリア (履歴を汚さない)
            try { history.replaceState(null, '', location.pathname + location.search); } catch(e) {}
            return items;
          }
        }
      }
    } catch(e) {}
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function saveSelection(list) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function enrichSelection(items) {
    var tracks = window.TRACKS || [];
    return items.map(function (item) {
      return tracks.find(function (t) { return String(t.id) === String(item.id); }) || item;
    });
  }

  // ── 曲名で追加（サジェスト） ──────────────────────────────
  // 曲名が分かっている人向け。入力すると候補曲が出る（未入力時は何も出さない）。
  function buildAddTrackHTML() {
    var isEn = getLang() === 'en';
    return '<div class="lr-add-track">' +
      '<div class="lr-add-track__box">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
        '<input type="text" id="lr-add-input" class="lr-add-track__input" autocomplete="off" ' +
          'placeholder="' + (isEn ? 'Add a track by name…' : '曲名で追加（例：いつかの大地）') + '">' +
      '</div>' +
      '<ul class="lr-suggest" id="lr-add-suggest" hidden></ul>' +
    '</div>';
  }

  function attachTrackSearch(scope, onPick, getExistingIds) {
    var input = scope.querySelector('#lr-add-input');
    var box   = scope.querySelector('#lr-add-suggest');
    if (!input || !box) return;
    var isEn = getLang() === 'en';

    function close() { box.hidden = true; box.innerHTML = ''; }

    function render(q) {
      var tracks = window.TRACKS || [];
      var existing = (getExistingIds && getExistingIds()) || [];
      var ql = q.toLowerCase();
      var hits = [];
      for (var i = 0; i < tracks.length && hits.length < 8; i++) {
        var t = tracks[i];
        if (existing.indexOf(String(t.id)) !== -1) continue;
        var ja = (t.title || '').toLowerCase();
        var en = (t.title_en || '').toLowerCase();
        if (ja.indexOf(ql) !== -1 || en.indexOf(ql) !== -1) hits.push(t);
      }
      if (!hits.length) {
        box.innerHTML = '<li class="lr-suggest__empty">' + (isEn ? 'No matching tracks' : '該当する曲がありません') + '</li>';
        box.hidden = false; return;
      }
      box.innerHTML = hits.map(function (t) {
        var tags = getTagText(t);
        return '<li class="lr-suggest__item" data-id="' + escHtml(String(t.id)) + '">' +
          '<span class="lr-suggest__title">' + escHtml(t.title || String(t.id)) + '</span>' +
          (tags ? '<span class="lr-suggest__tags">' + escHtml(tags) + '</span>' : '') +
        '</li>';
      }).join('');
      box.hidden = false;
    }

    input.addEventListener('input', function () {
      var q = input.value.trim();
      if (!q) { close(); return; }   // 未入力時は候補を出さない
      render(q);
    });
    // mousedown は input の blur より先に発火するので選択が確実に通る
    box.addEventListener('mousedown', function (e) {
      var li = e.target.closest('.lr-suggest__item');
      if (!li) return;
      e.preventDefault();
      var t = (window.TRACKS || []).find(function (x) { return String(x.id) === String(li.dataset.id); });
      if (t && onPick) { onPick(t); input.value = ''; close(); input.focus(); }
    });
    input.addEventListener('blur', function () { setTimeout(close, 150); });
  }

  // ── 初期化 ───────────────────────────────────────────────
  function init() {
    var pageEl = document.getElementById('page-content');
    if (!pageEl || pageEl.dataset.pageType !== 'license-request') return;

    parseIncomingUsage();
    parseIncomingPlan();
    var selectionRaw = loadSelection();

    function onTracksReady() {
      var selectedTracks = enrichSelection(selectionRaw);
      renderPage(pageEl, selectedTracks);
    }

    if (window.loadTracks) {
      // Promise経由で取得：キャッシュ済み・取得中・未取得すべてに対応（イベント取りこぼしなし）
      window.loadTracks().then(onTracksReady).catch(function () { onTracksReady(); });
    } else if (window.TRACKS && window.TRACKS.length > 0) {
      onTracksReady();
    } else {
      window.addEventListener('tracks:ready', onTracksReady, { once: true });
    }
  }

  // ── ページ描画 ───────────────────────────────────────────
  function renderPage(pageEl, selectedTracks) {
    var mainEl = pageEl.querySelector('#lr-main');
    if (!mainEl) return;

    // 常に購入フロー（ライセンス選択カード）を表示する。
    // 店舗BGMパスは全曲対象で曲選択が不要なため、曲0でも最初から選べる必要がある。
    // 曲ベース（Standard/Pack/Professional）は曲セクションで追加を促す（曲0なら送信不可）。
    renderFlow(mainEl, selectedTracks);
  }

  // ── メインフロー描画 ─────────────────────────────────────
  function renderFlow(container, initialTracks) {
    var currentTracks = initialTracks.slice();
    var selectedType  = null; // 'single' | 'pack' | 'professional' | 'store'
    var selectedUsage = '';   // Professional 選択時の用途キー
    var storePlan     = 'store'; // 'store' | 'facility'（店舗BGMパス選択時）

    container.innerHTML = buildFlowHTML(currentTracks);

    var trackList   = container.querySelector('.selected-tracks__list');
    var countEl     = container.querySelector('.selected-tracks__count');
    var tracksSection = container.querySelector('#lr-tracks-section');
    var priceEl     = container.querySelector('#lr-price-display');
    var submitBtn   = container.querySelector('#lr-submit-btn');
    var singleCard  = container.querySelector('[data-type="single"]');
    var packCard    = container.querySelector('[data-type="pack"]');
    var proCard     = container.querySelector('[data-type="professional"]');
    var storeCard   = container.querySelector('[data-type="store"]');
    var proUsageBlock = container.querySelector('#lr-pro-usage');
    var proUsageSel = container.querySelector('#lr-usage');
    var proPriceEl  = container.querySelector('#lr-pro-price');
    var storeBlock  = container.querySelector('#lr-store-block');
    var storeCountInput = container.querySelector('#lr-store-count');
    var storeCountRow   = container.querySelector('#lr-store-count-row');
    var storeCountHint  = container.querySelector('#lr-store-count-hint');
    var packBlock   = container.querySelector('#lr-pack-block');
    var packProjectInput = container.querySelector('#lr-pack-project');
    var selectCards = [singleCard, packCard, proCard, storeCard].filter(Boolean);
    var form        = container.querySelector('#lr-form');

    // 曲カード描画
    function renderCards() {
      if (!trackList) return;
      trackList.innerHTML = '';
      if (currentTracks.length === 0) {
        var isEn0 = getLang() === 'en';
        var hint = document.createElement('li');
        hint.className = 'selected-tracks__placeholder';
        hint.textContent = isEn0
          ? 'No tracks yet — add the track you want to license below ↓'
          : 'まだ曲が選ばれていません。下の入力欄から購入したい曲を追加してください ↓';
        trackList.appendChild(hint);
      }
      currentTracks.forEach(function (track) {
        var li = document.createElement('li');
        li.className = 'selected-track-card';
        li.dataset.trackId = String(track.id);
        var tagText = getTagText(track);
        li.innerHTML =
          '<button type="button" class="selected-track-card__preview" aria-label="' + escHtml(track.title||'') + 'を試聴">' +
            '<svg viewBox="0 0 24 24" width="11" height="11"><path d="M8 5v14l11-7z"/></svg>' +
          '</button>' +
          '<div class="selected-track-card__info">' +
            '<div class="selected-track-card__title">' + escHtml(track.title||'—') + '</div>' +
            (tagText ? '<div class="selected-track-card__tags">' + escHtml(tagText) + '</div>' : '') +
          '</div>' +
          '<button type="button" class="selected-track-card__remove" title="外す">' +
            '<svg viewBox="0 0 24 24" width="12" height="12"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>' +
          '</button>';

        li.querySelector('.selected-track-card__preview').addEventListener('click', function () {
          if (window.HMIX_PLAYER && track.mp3) window.HMIX_PLAYER.playTrack(track, window.TRACKS || []);
        });
        li.querySelector('.selected-track-card__remove').addEventListener('click', function () {
          li.classList.add('selected-track-card--removing');
          setTimeout(function () {
            currentTracks.splice(currentTracks.indexOf(track), 1);
            saveSelection(currentTracks.map(function (t) { return { id: String(t.id), title: t.title||String(t.id) }; }));
            li.remove();
            if (currentTracks.length === 0) renderCards(); // 0曲になったらプレースホルダを表示
            updateCount();
            updateLicenseOptions();
            updatePrice(); // 曲ベースは送信不可に戻す（store は曲非依存で影響なし）
          }, 280);
        });
        trackList.appendChild(li);
      });
      updateCount();
    }

    function updateCount() {
      if (countEl) countEl.textContent = currentTracks.length + '曲選択中';
    }

    // ライセンス選択の状態更新
    function updateLicenseOptions() {
      if (!singleCard || !packCard) return;
      var count = currentTracks.length;

      // 4曲以上ならProject Packを推奨ハイライト（Standard/単曲は常に選択可能）
      // ※ 3曲では単曲計¥6,600 < パック¥7,480 のためパックは割安にならない。
      //    「お得」表示は実際に割安となる4曲以上に限定する。
      packCard.classList.toggle('lr-license-card--recommended', count >= 4);

      updateSavingsHint();
    }

    // パック誘導・差額アンカリング（4曲以上でのみ「お得」を表示）
    function updateSavingsHint() {
      var hint = container.querySelector('#lr-pack-hint');
      if (!hint) return;
      var count = currentTracks.length;
      var isEn = getLang() === 'en';
      if (count < 4) { hint.hidden = true; hint.innerHTML = ''; return; }

      var singleTotal = count * PRICES.single;
      var saved = singleTotal - PRICES.pack;
      hint.hidden = false;
      if (saved > 0) {
        hint.innerHTML = isEn
          ? 'Standard × ' + count + ' = ¥' + singleTotal.toLocaleString() +
            ' → Project Pack ¥' + PRICES.pack.toLocaleString() +
            ' (save ¥' + saved.toLocaleString() + ')'
          : '単曲 × ' + count + ' = ¥' + singleTotal.toLocaleString() +
            ' → プロジェクトパックなら ¥' + PRICES.pack.toLocaleString() +
            '（¥' + saved.toLocaleString() + 'お得）';
      } else {
        hint.innerHTML = isEn
          ? 'Licensing many tracks? Project Pack covers unlimited tracks for one project at ¥' + PRICES.pack.toLocaleString() + '.'
          : '多くの曲を使うなら、曲数無制限のプロジェクトパック（¥' + PRICES.pack.toLocaleString() + '）もご検討ください。';
      }
    }

    function updatePrice() {
      if (!priceEl) return;
      var isEn = getLang() === 'en';
      // 種別未選択 → まずカードを選ぶよう促す（曲セクションは隠れているので曲追加は促さない）
      if (!selectedType) {
        priceEl.innerHTML = '<span class="lr-price-prompt">' +
          (isEn ? 'Select a license type above ↑' : 'まず上でライセンスを選んでください ↑') + '</span>';
        if (submitBtn) submitBtn.disabled = true;
        return;
      }
      // 店舗BGMパス: 曲に依存しない年額サブスク（曲チェックより先に処理）
      if (selectedType === 'store') {
        var stotal = storeAnnualTotal(storePlan, storeCountInput ? storeCountInput.value : 1);
        priceEl.innerHTML = '<span class="lr-price-label">' + (isEn ? 'Store BGM Pass' : '店舗BGMパス') + '</span>' +
          '<span class="lr-price-amount">¥' + stotal.toLocaleString() +
          '<small style="font-size:0.55em;opacity:0.65;margin-left:4px;">' +
          (isEn ? '/year (incl. tax)' : '/年（税込）') + '</small></span>';
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      // Project Pack: 1プロジェクト曲数無制限の固定額（曲選択不要・曲チェックより先に処理）
      if (selectedType === 'pack') {
        priceEl.innerHTML = '<span class="lr-price-label">Project Pack</span>' +
          '<span class="lr-price-amount">¥' + PRICES.pack.toLocaleString() +
          '<small style="font-size:0.55em;opacity:0.65;margin-left:4px;">' + (isEn ? 'incl. tax' : '税込') + '</small></span>';
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      // 曲が未選択 → 曲の追加を促す
      if (currentTracks.length === 0) {
        priceEl.innerHTML = '<span class="lr-price-prompt">' +
          (isEn ? 'Add a track to license below ↑' : '購入する曲を上で追加してください ↑') + '</span>';
        if (submitBtn) submitBtn.disabled = true;
        return;
      }
      // 未選択、または Professional だが用途未選択 → 価格非表示・送信不可
      if (!selectedType || (selectedType === 'professional' && !selectedUsage)) {
        priceEl.innerHTML = '&nbsp;';
        if (submitBtn) submitBtn.disabled = true;
        return;
      }
      var count = currentTracks.length || 1;
      var label, html;
      if (selectedType === 'professional') {
        var unit = proUsagePrice(selectedUsage);
        var total = unit * count;
        label = 'Professional License';
        html = '<span class="lr-price-label">' + label + '</span>' +
          '<span class="lr-price-amount">¥' + total.toLocaleString() +
          '<small style="font-size:0.55em;opacity:0.65;margin-left:4px;">' +
          (isEn ? '(¥' + unit.toLocaleString() + ' × ' + count + ' tracks, incl. tax)' : '（¥' + unit.toLocaleString() + ' × ' + count + '曲・税込）') +
          '</small></span>';
      } else if (selectedType === 'single') {
        var sTotal = PRICES.single * count;
        label = 'Standard License';
        html = '<span class="lr-price-label">' + label + '</span>' +
          '<span class="lr-price-amount">¥' + sTotal.toLocaleString() +
          '<small style="font-size:0.55em;opacity:0.65;margin-left:4px;">' +
          (isEn ? '(¥' + PRICES.single.toLocaleString() + ' × ' + count + ' tracks, incl. tax)' : '（¥' + PRICES.single.toLocaleString() + ' × ' + count + '曲・税込）') +
          '</small></span>';
      } else {
        label = 'Project Pack License';
        html = '<span class="lr-price-label">' + label + '</span>' +
          '<span class="lr-price-amount">¥' + PRICES.pack.toLocaleString() + '<small style="font-size:0.55em;opacity:0.65;margin-left:4px;">税込</small></span>';
      }
      priceEl.innerHTML = html;
      if (submitBtn) submitBtn.disabled = false;
      updateSavingsHint();
    }

    // 種別に応じてUIの見え方を切り替える（用途プルダウン／店舗ブロック／Packブロック／曲セクション）
    function applyModeUI(type) {
      if (proUsageBlock) proUsageBlock.hidden = (type !== 'professional');
      if (storeBlock) storeBlock.hidden = (type !== 'store');
      if (packBlock) packBlock.hidden = (type !== 'pack');
      // 曲選択が必要なのは曲数で課金する Standard / Professional のみ。
      // Project Pack（曲数無制限）・店舗パス（全曲）は曲不要なので曲セクションを隠す。
      if (tracksSection) tracksSection.hidden = !(type === 'single' || type === 'professional');
      if (type !== 'professional') { selectedUsage = ''; if (proUsageSel) proUsageSel.value = ''; clearIncomingUsage(); }
      if (type !== 'store') { clearIncomingPlan(); }
    }

    // ライセンス選択カードのクリック
    selectCards.forEach(function (card) {
      if (!card) return;
      card.addEventListener('click', function () {
        if (card.classList.contains('lr-license-card--disabled')) return;
        var type = card.dataset.type;
        selectedType = type;
        selectCards.forEach(function (c) { if (c) c.classList.remove('lr-license-card--selected'); });
        card.classList.add('lr-license-card--selected');
        applyModeUI(type);
        if (type === 'store') updateStoreCountUI();
        updatePrice();
      });
    });

    // 店舗BGMパス: プラン切替（店舗パス / 施設パス）
    var storePlanRadios = container.querySelectorAll('input[name="lr-store-plan"]');
    storePlanRadios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        storePlan = this.value === 'facility' ? 'facility' : 'store';
        container.querySelectorAll('.lr-store-plan').forEach(function (el) {
          el.classList.toggle('lr-store-plan--selected', el.dataset.plan === storePlan);
        });
        // 施設パスは店舗数の概念がないので店舗数入力を隠す
        if (storeCountRow) storeCountRow.hidden = (storePlan === 'facility');
        updateStoreCountUI();
        updatePrice();
      });
    });
    if (storeCountInput) {
      storeCountInput.addEventListener('input', function () { updateStoreCountUI(); updatePrice(); });
    }

    function updateStoreCountUI() {
      if (!storeCountHint) return;
      var isEn = getLang() === 'en';
      if (storePlan === 'facility') { storeCountHint.textContent = ''; return; }
      var n = parseInt(storeCountInput && storeCountInput.value, 10);
      if (!isFinite(n) || n < 1) n = 1;
      if (n <= 1) { storeCountHint.textContent = isEn ? '1 store' : '1店舗'; return; }
      storeCountHint.textContent = isEn
        ? '¥9,900 + ¥4,950 × ' + (n - 1)
        : '内訳: ¥9,900 ＋ ¥4,950 × ' + (n - 1) + '店舗';
    }

    // Professional 用途の選択
    if (proUsageSel) {
      proUsageSel.addEventListener('change', function () {
        selectedUsage = this.value;
        // カード内の価格表示を選択用途に合わせて更新
        if (proPriceEl) {
          var u = proUsagePrice(selectedUsage);
          proPriceEl.innerHTML = u
            ? '¥' + u.toLocaleString() + '<small style="font-size:0.6em;opacity:0.65;margin-left:3px;">税込/曲</small>'
            : '¥3,300<small style="font-size:0.6em;opacity:0.65;margin-left:3px;">〜 税込/曲</small>';
        }
        updatePrice();
      });
    }

    // フォーム送信
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var name  = form.querySelector('#lr-name').value.trim();
        var email = form.querySelector('#lr-email').value.trim();

        // バリデーション
        var valid = true;
        if (!name)  { form.querySelector('#lrf-name').classList.add('lr-field-invalid');  valid = false; } else { form.querySelector('#lrf-name').classList.remove('lr-field-invalid'); }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { form.querySelector('#lrf-email').classList.add('lr-field-invalid'); valid = false; } else { form.querySelector('#lrf-email').classList.remove('lr-field-invalid'); }
        if (!selectedType) { showTypeError(container); valid = false; }
        if (selectedType === 'professional' && !selectedUsage) {
          if (proUsageSel) proUsageSel.classList.add('lr-field-invalid');
          showTypeError(container);
          valid = false;
        } else if (proUsageSel) {
          proUsageSel.classList.remove('lr-field-invalid');
        }

        // 店舗BGMパス: 店舗名・所在地は証明書記載のため必須
        var storeName = '', storeAddress = '', storeCount = 1;
        if (selectedType === 'store') {
          // 店舗ブロックはフォーム外（License Type セクション内）にあるため container から拾う
          var snEl = container.querySelector('#lr-store-name');
          var saEl = container.querySelector('#lr-store-address');
          storeName    = snEl ? snEl.value.trim() : '';
          storeAddress = saEl ? saEl.value.trim() : '';
          storeCount   = storePlan === 'facility' ? 1 : (parseInt(storeCountInput && storeCountInput.value, 10) || 1);
          var snField = container.querySelector('#lrf-store-name');
          var saField = container.querySelector('#lrf-store-address');
          if (!storeName)    { if (snField) snField.classList.add('lr-field-invalid'); valid = false; } else if (snField) { snField.classList.remove('lr-field-invalid'); }
          if (!storeAddress) { if (saField) saField.classList.add('lr-field-invalid'); valid = false; } else if (saField) { saField.classList.remove('lr-field-invalid'); }
        }

        // Project Pack: プロジェクト名（任意・未入力でも購入可）
        var projectName = '';
        if (selectedType === 'pack' && packProjectInput) {
          projectName = packProjectInput.value.trim();
        }
        if (!valid) return;

        var usageObj = PRO_USAGE.find(function (u) { return u.v === selectedUsage; });

        // 曲リストは曲数課金の Standard / Professional のみ送る（Pack・店舗は曲不要）
        var sendTracks = (selectedType === 'single' || selectedType === 'professional')
          ? currentTracks.map(function (t) { return { id: String(t.id), title: t.title || String(t.id) }; })
          : [];

        // 購入データを準備
        var purchaseData = {
          licenseId:   generateLicenseId(),
          licenseType: selectedType,
          tracks:      sendTracks,
          name:        name,
          email:       email,
          purpose:     (form.querySelector('#lr-purpose') || {}).value || '',
          usage:       selectedUsage,
          usageLabelJa: usageObj ? usageObj.ja : '',
          usageLabelEn: usageObj ? usageObj.en : '',
          // 店舗BGMパス（サブスク）
          storePlan:    selectedType === 'store' ? storePlan : '',
          storeCount:   selectedType === 'store' ? storeCount : 0,
          storeName:    storeName,
          storeAddress: storeAddress,
          // Project Pack（プロジェクト単位）
          projectName:  selectedType === 'pack' ? projectName : '',
          purchaseDate: new Date().toISOString().slice(0, 10)
        };
        // 成功ページで使用するためsessionStorageに保存
        try { sessionStorage.setItem(PURCHASE_KEY, JSON.stringify(purchaseData)); } catch (e) {}
        clearIncomingUsage();   // 用途は消費済み

        // ── 決済への遷移（多重安全策） ──────────────────────────
        var submitBtn = form.querySelector('#lr-submit-btn');
        var isEn = getLang() === 'en';
        var PAY_LABEL = isEn ? 'Pay with Stripe' : 'Stripe で決済する';

        // 安全策1: 二重送信ガード（Enter連打・ダブルクリック対策）
        if (submitBtn && submitBtn.dataset.submitting === '1') return;

        function setBtn(txt, busy) {
          if (!submitBtn) return;
          submitBtn.disabled = !!busy;
          submitBtn.dataset.submitting = busy ? '1' : '';
          var sp = submitBtn.querySelector('span');
          if (sp) sp.textContent = txt;
        }
        // 安全策2: どの失敗経路でもボタンを必ず復帰し、明確に案内（課金なしを明記）
        function failRecover(reason) {
          setBtn(PAY_LABEL, false);
          showCheckoutError(container, reason);
        }

        // 安全策3: 設定欠落ガード
        if (!STRIPE_API_URL) { failRecover('config'); return; }

        setBtn(isEn ? 'Preparing checkout…' : '決済ページを準備中…', true);

        // 安全策4: タイムアウト（応答が来なくても固まらない）
        var ac = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timedOut = false;
        var timer = setTimeout(function () { timedOut = true; if (ac) try { ac.abort(); } catch (e) {} }, 25000);
        var settled = false;
        fetch(STRIPE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseType: selectedType,
            tracks: purchaseData.tracks,
            email: email,
            licenseId: purchaseData.licenseId,
            usage: selectedUsage,
            storePlan: purchaseData.storePlan,
            storeCount: purchaseData.storeCount,
            storeName: purchaseData.storeName,
            storeAddress: purchaseData.storeAddress,
            projectName: purchaseData.projectName,
            lang: getLang()
          }),
          signal: ac ? ac.signal : undefined
        })
        // 安全策5: JSON 以外が返っても落ちないよう text() 経由で安全パース
        .then(function (res) {
          return res.text().then(function (text) {
            var data = {};
            try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }
            if (!res.ok) throw new Error((data && data.error) || ('HTTP ' + res.status));
            return data;
          });
        })
        .then(function (data) {
          if (settled) return;   // タイムアウト済みなら何もしない
          var url = data && data.url;
          // 安全策6: Stripe の正規ドメインのみ遷移を許可（不正/誤URLへ飛ばさない）
          if (typeof url === 'string' && /^https:\/\/(checkout|buy|donate)\.stripe\.com\//.test(url)) {
            settled = true; clearTimeout(timer);
            window.location.href = url;
          } else {
            // 不正URLは settled にせず throw → 下の catch が案内を表示
            throw new Error((data && data.error) || 'invalid_checkout_url');
          }
        })
        .catch(function (err) {
          if (settled) return;
          settled = true; clearTimeout(timer);
          console.error('Checkout error:', err && err.message ? err.message : err);
          failRecover(timedOut ? 'timeout' : (err && err.message));
        });
      });
    }

    // 曲名サジェストで曲を追加
    attachTrackSearch(container, function (track) {
      if (currentTracks.some(function (t) { return String(t.id) === String(track.id); })) return;
      currentTracks.push(track);
      saveSelection(currentTracks.map(function (t) { return { id: String(t.id), title: t.title || String(t.id) }; }));
      renderCards();
      updateLicenseOptions();
      updatePrice();
    }, function () {
      return currentTracks.map(function (t) { return String(t.id); });
    });

    // お気に入りモーダルから曲を選ぶショートカット
    var favOpenBtn = container.querySelector('#lr-open-favs-flow');
    if (favOpenBtn) favOpenBtn.addEventListener('click', function () {
      if (window.HMIX_FAV_MODAL) window.HMIX_FAV_MODAL.open();
    });

    renderCards();
    updateLicenseOptions();

    // professional-license.html の「即時購入」から用途付きで来たら Professional を事前選択
    // （init が複数回走るため、ここでは消費しない。消費は送信時／別種別選択時）
    var preUsage = getIncomingUsage();
    if (preUsage && proCard) {
      proCard.click();
      if (proUsageSel) {
        proUsageSel.value = preUsage;
        proUsageSel.dispatchEvent(new Event('change'));
      }
    }

    // 店舗BGMパス動線（#plan=store / #plan=facility）から来たら店舗カードを事前選択
    var prePlan = getIncomingPlan();
    if (prePlan && storeCard) {
      storeCard.click();
      if (prePlan === 'facility') {
        var facRadio = container.querySelector('input[name="lr-store-plan"][value="facility"]');
        if (facRadio) { facRadio.checked = true; facRadio.dispatchEvent(new Event('change')); }
      }
    }

    updatePrice();
  }

  // ── フローHTML ───────────────────────────────────────────
  function buildFlowHTML(tracks) {
    return '' +
      '<section class="lr-section" aria-labelledby="lr-license-heading">' +
        '<p class="lr-section__heading" id="lr-license-heading"><span data-ja="① ライセンスを選ぶ" data-en="① Choose a license">① ライセンスを選ぶ</span></p>' +
        '<p class="lr-section__lead" style="margin:-6px 0 16px;font-size:13.5px;color:#6B6456;line-height:1.7"><span data-ja="ご利用内容に合うタイプを選んでください。選ぶと、必要な入力欄だけが下に表示されます。" data-en="Pick the type that fits your use. Selecting one reveals just the fields you need below.">ご利用内容に合うタイプを選んでください。選ぶと、必要な入力欄だけが下に表示されます。</span></p>' +
        '<div class="lr-license-cards">' +

          '<div class="lr-license-card" data-type="single" role="button" tabindex="0">' +
            '<div class="lr-license-card__badge"><span data-ja="曲ごとに購入" data-en="Per track">曲ごとに購入</span></div>' +
            '<div class="lr-license-card__name">Standard</div>' +
            '<div class="lr-license-card__price">¥2,200<small style="font-size:0.6em;opacity:0.65;margin-left:3px;"><span data-ja="税込/曲" data-en="/track, tax incl.">税込/曲</span></small></div>' +
            '<ul class="lr-license-card__features">' +
              '<li><span data-ja="1曲ごと・1プロジェクト・永続買い切り" data-en="Per track, one project, perpetual">1曲ごと・1プロジェクト・永続買い切り</span></li>' +
              '<li><span data-ja="YouTube・ゲーム・映像すべて対応" data-en="YouTube, games, film — all covered">YouTube・ゲーム・映像すべて対応</span></li>' +
              '<li><span data-ja="選ぶと下で曲を選択（¥2,200×曲数）" data-en="Select, then choose tracks below (¥2,200 × tracks)">選ぶと下で曲を選択（¥2,200×曲数）</span></li>' +
            '</ul>' +
          '</div>' +

          '<div class="lr-license-card" data-type="pack" role="button" tabindex="0">' +
            '<div class="lr-license-card__badge"><span data-ja="曲数無制限" data-en="Unlimited tracks">曲数無制限</span></div>' +
            '<div class="lr-license-card__name">Project Pack</div>' +
            '<div class="lr-license-card__price">¥7,480<small style="font-size:0.6em;opacity:0.65;margin-left:3px;">税込</small></div>' +
            '<ul class="lr-license-card__features">' +
              '<li><span data-ja="曲数無制限・1プロジェクト・永続買い切り" data-en="Unlimited tracks, one project, perpetual">曲数無制限・1プロジェクト・永続買い切り</span></li>' +
              '<li><span data-ja="YouTube・ゲーム・映像すべて対応" data-en="YouTube, games, film — all covered">YouTube・ゲーム・映像すべて対応</span></li>' +
              '<li><span data-ja="曲選択は不要（プロジェクト単位）" data-en="No track selection — project-based">曲選択は不要（プロジェクト単位）</span></li>' +
            '</ul>' +
          '</div>' +

          // Professional 帯（選択式・用途で価格が決まる B表）
          '<div class="lr-license-card lr-license-card--pro" data-type="professional" role="button" tabindex="0">' +
            '<div class="lr-license-card__badge lr-license-card__badge--pro"><span data-ja="広告・放送・映画" data-en="Ads / Broadcast / Film">広告・放送・映画</span></div>' +
            '<div class="lr-license-card__name">Professional</div>' +
            '<div class="lr-license-card__price" id="lr-pro-price">¥3,300<small style="font-size:0.6em;opacity:0.65;margin-left:3px;">〜 税込/曲</small></div>' +
            '<ul class="lr-license-card__features">' +
              '<li><span data-ja="広告出稿・商業舞台・パッケージ収録" data-en="Paid ads, commercial stage, packaged media">広告出稿・商業舞台・パッケージ収録</span></li>' +
              '<li><span data-ja="TV・CM・劇場・大規模タイトル" data-en="TV, commercials, film, large titles">TV・CM・劇場・大規模タイトル</span></li>' +
              '<li><span data-ja="選ぶと下で用途を選択 → 価格決定" data-en="Select, then choose a use below">選ぶと下で用途を選択 → 価格決定</span></li>' +
            '</ul>' +
          '</div>' +

          // 店舗BGMパス 帯（年額サブスク）
          // STORE_PASS_ENABLED=true: 選択式カード（data-type="store"）→ 下で店舗情報を入力
          // false: 従来どおり professional-license.html へのリンク（オンライン購入は後追い）
          (STORE_PASS_ENABLED
            ? '<div class="lr-license-card lr-license-card--pro lr-license-card--store" data-type="store" role="button" tabindex="0">' +
                '<div class="lr-license-card__badge lr-license-card__badge--pro"><span data-ja="店舗・施設BGM" data-en="Store / Venue BGM">店舗・施設BGM</span></div>' +
                '<div class="lr-license-card__name">店舗BGMパス</div>' +
                '<div class="lr-license-card__price">¥9,900<small style="font-size:0.6em;opacity:0.65;margin-left:3px;">〜/年 税込</small></div>' +
                '<ul class="lr-license-card__features">' +
                  '<li><span data-ja="1店舗・全曲使い放題・年額" data-en="One store, all tracks, annual">1店舗・全曲使い放題・年額</span></li>' +
                  '<li><span data-ja="証明書を本部・家主へ提出可能" data-en="Certificate for head office / landlord">証明書を本部・家主へ提出可能</span></li>' +
                  '<li><span data-ja="選ぶと下で店舗情報を入力" data-en="Select, then enter store details below">選ぶと下で店舗情報を入力</span></li>' +
                '</ul>' +
              '</div>'
            : '<a class="lr-license-card lr-license-card--pro-link lr-license-card--store" href="/professional-license.html">' +
                '<div class="lr-license-card__badge lr-license-card__badge--pro"><span data-ja="店舗・施設BGM" data-en="Store / Venue BGM">店舗・施設BGM</span></div>' +
                '<div class="lr-license-card__name">店舗BGMパス</div>' +
                '<div class="lr-license-card__price">¥9,900<small style="font-size:0.6em;opacity:0.65;margin-left:3px;">/年 税込</small></div>' +
                '<ul class="lr-license-card__features">' +
                  '<li><span data-ja="1店舗・全曲使い放題・年額" data-en="One store, all tracks, annual">1店舗・全曲使い放題・年額</span></li>' +
                  '<li><span data-ja="証明書を本部・家主へ提出可能" data-en="Certificate for head office / landlord">証明書を本部・家主へ提出可能</span></li>' +
                  '<li><span data-ja="お問い合わせで受付中 →" data-en="Now open via inquiry →">お問い合わせで受付中 →</span></li>' +
                '</ul>' +
              '</a>') +

        '</div>' +
        '<div class="lr-pro-usage" id="lr-pro-usage" hidden>' +
          '<label class="lr-label lr-label--required" for="lr-usage"><span data-ja="Professional の用途" data-en="Professional use case">Professional の用途</span></label>' +
          '<select id="lr-usage" class="lr-select">' +
            '<option value="" data-ja="用途を選択してください" data-en="Select a use case">用途を選択してください</option>' +
            PRO_USAGE.map(function (u) {
              return '<option value="' + u.v + '" data-ja="' + u.ja + '（¥' + u.price.toLocaleString() + '/曲）" data-en="' + u.en + ' (¥' + u.price.toLocaleString() + '/track)">' + u.ja + '（¥' + u.price.toLocaleString() + '/曲）</option>';
            }).join('') +
          '</select>' +
          '<p class="lr-hint"><span data-ja="TVCM・ジングル/サウンドロゴ・遊技機・交通機関などは要見積もりです。" data-en="TV commercials, jingles/sound logos, amusement machines, and transportation are by quote.">TVCM・ジングル/サウンドロゴ・遊技機・交通機関などは要見積もりです。</span> <a href="/contact.html" style="color:var(--color-green-light,#9adfb4);" data-ja="お問い合わせ →" data-en="Contact us →">お問い合わせ →</a></p>' +
        '</div>' +

        // 店舗BGMパス：店舗情報入力（store 選択時のみ表示）
        '<div class="lr-store-block" id="lr-store-block" hidden>' +
          '<div class="lr-store-plans" role="radiogroup" aria-label="店舗BGMパスの種類">' +
            '<label class="lr-store-plan lr-store-plan--selected" data-plan="store">' +
              '<input type="radio" name="lr-store-plan" value="store" checked>' +
              '<span class="lr-store-plan__name" data-ja="店舗パス" data-en="Store pass">店舗パス</span>' +
              '<span class="lr-store-plan__desc" data-ja="1店舗 ¥9,900/年 ＋ 追加店舗 ¥4,950/年" data-en="1 store ¥9,900/yr + ¥4,950/yr each more">1店舗 ¥9,900/年 ＋ 追加店舗 ¥4,950/年</span>' +
            '</label>' +
            '<label class="lr-store-plan" data-plan="facility">' +
              '<input type="radio" name="lr-store-plan" value="facility">' +
              '<span class="lr-store-plan__name" data-ja="施設パス" data-en="Facility pass">施設パス</span>' +
              '<span class="lr-store-plan__desc" data-ja="ホテル・商業施設・クリニック等の館内 ¥19,800/年" data-en="Hotels, malls, clinics, etc. ¥19,800/yr">ホテル・商業施設・クリニック等の館内 ¥19,800/年</span>' +
            '</label>' +
          '</div>' +
          '<div class="lr-store-count" id="lr-store-count-row">' +
            '<label class="lr-label" for="lr-store-count"><span data-ja="店舗数" data-en="Number of stores">店舗数</span></label>' +
            '<input type="number" id="lr-store-count" class="lr-input lr-input--num" min="1" max="50" step="1" value="1" inputmode="numeric">' +
            '<span class="lr-store-count__hint" id="lr-store-count-hint"></span>' +
          '</div>' +
          '<div class="lr-field-row">' +
            '<div class="license-request-field" id="lrf-store-name">' +
              '<label class="lr-label lr-label--required" for="lr-store-name"><span data-ja="店舗名・施設名" data-en="Store / facility name">店舗名・施設名</span></label>' +
              '<input type="text" id="lr-store-name" class="lr-input" autocomplete="organization" placeholder="例：カフェ・ミルティーユ 表参道店">' +
              '<span class="lr-error" data-ja="店舗名を入力してください" data-en="Please enter the store name">店舗名を入力してください</span>' +
            '</div>' +
          '</div>' +
          '<div class="lr-field-row">' +
            '<div class="license-request-field" id="lrf-store-address">' +
              '<label class="lr-label lr-label--required" for="lr-store-address"><span data-ja="所在地" data-en="Address">所在地</span></label>' +
              '<input type="text" id="lr-store-address" class="lr-input" autocomplete="street-address" placeholder="例：東京都渋谷区神宮前0-0-0">' +
              '<span class="lr-error" data-ja="所在地を入力してください" data-en="Please enter the address">所在地を入力してください</span>' +
            '</div>' +
          '</div>' +
          '<p class="lr-hint"><span data-ja="店舗名・所在地は発行する証明書に記載され、本部・オーナー・家主への提出にご利用いただけます。複数店舗は店舗数でまとめて購入できます（各店舗名は購入後メールでお知らせください）。" data-en="The store name and address appear on the issued certificate for submission to head office, owners, or landlords. Multiple stores can be purchased together by count (send each store name by email after purchase).">店舗名・所在地は発行する証明書に記載され、本部・オーナー・家主への提出にご利用いただけます。複数店舗は店舗数でまとめて購入できます（各店舗名は購入後メールでお知らせください）。</span></p>' +
          '<p class="lr-hint"><span data-ja="年額サブスクリプションです。Stripeのカスタマーポータルからいつでも解約・カード変更ができます（解約後は証明書が失効します）。" data-en="This is an annual subscription. You can cancel or update your card anytime via the Stripe customer portal (the certificate expires upon cancellation).">年額サブスクリプションです。Stripeのカスタマーポータルからいつでも解約・カード変更ができます（解約後は証明書が失効します）。</span></p>' +
        '</div>' +

        // Project Pack: プロジェクト名（任意）。曲数無制限・曲選択不要。
        '<div class="lr-pack-block" id="lr-pack-block" hidden>' +
          '<div class="license-request-field">' +
            '<label class="lr-label lr-label--optional" for="lr-pack-project"><span data-ja="プロジェクト名・作品名" data-en="Project / work name">プロジェクト名・作品名</span></label>' +
            '<input type="text" id="lr-pack-project" class="lr-input" autocomplete="off" placeholder="例：短編アニメ「星の旅人」／○○社 PR動画">' +
          '</div>' +
          '<p class="lr-hint"><span data-ja="このパックは1つのプロジェクト内で曲数無制限です（曲を選ぶ必要はありません）。プロジェクト名は発行する証明書に記載されます（任意・後から曲を追加してもOK）。" data-en="This pack covers unlimited tracks within one project (no track selection needed). The project name appears on the issued certificate (optional — you may add more tracks later).">このパックは1つのプロジェクト内で曲数無制限です（曲を選ぶ必要はありません）。プロジェクト名は発行する証明書に記載されます（任意・後から曲を追加してもOK）。</span></p>' +
        '</div>' +

        '<p class="lr-pack-hint" id="lr-pack-hint" hidden></p>' +
        '<div id="lr-type-error" class="lr-error-msg" hidden>ライセンス種別を選択してください</div>' +
      '</section>' +

      // ② 曲を選ぶ（Standard / Professional を選んだときだけ表示。Pack・店舗は曲不要のため非表示）
      '<section class="selected-tracks lr-section" id="lr-tracks-section" aria-labelledby="lr-tracks-heading" hidden>' +
        '<p class="lr-section__heading" id="lr-tracks-heading"><span data-ja="② 曲を選ぶ" data-en="② Choose tracks">② 曲を選ぶ</span>' +
          '<span class="selected-tracks__count" style="margin-left:10px;font-size:13px;color:#6B6456;font-weight:400">' + tracks.length + '曲選択中</span>' +
        '</p>' +
        '<ul class="selected-tracks__list" id="lr-track-list"></ul>' +
        buildAddTrackHTML() +
        '<button type="button" class="lr-fav-open" id="lr-open-favs-flow" ' +
          'style="margin-top:10px;background:none;border:1px solid #E6DFCF;border-radius:8px;padding:8px 14px;font-size:13px;color:#16382A;cursor:pointer;display:inline-flex;align-items:center;gap:6px">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          '<span data-ja="お気に入りから選ぶ" data-en="Pick from Saved List">お気に入りから選ぶ</span>' +
        '</button>' +
      '</section>' +

      '<form id="lr-form" novalidate>' +
        '<section class="lr-section" aria-labelledby="lr-info-heading">' +
          '<p class="lr-section__heading" id="lr-info-heading">Your Info</p>' +
          '<div class="lr-field-row">' +
            '<div class="license-request-field" id="lrf-name">' +
              '<label class="lr-label lr-label--required" for="lr-name">お名前 / Name</label>' +
              '<input type="text" id="lr-name" name="name" class="lr-input" placeholder="例：山田 太郎" autocomplete="name" required>' +
              '<span class="lr-error">お名前を入力してください</span>' +
            '</div>' +
            '<div class="license-request-field" id="lrf-email">' +
              '<label class="lr-label lr-label--required" for="lr-email">メールアドレス / Email</label>' +
              '<input type="email" id="lr-email" name="email" class="lr-input" placeholder="example@email.com" autocomplete="email" required>' +
              '<span class="lr-error">有効なメールアドレスを入力してください</span>' +
            '</div>' +
          '</div>' +
          '<div class="license-request-field">' +
            '<label class="lr-label lr-label--optional" for="lr-purpose">主な用途 / Usage (optional)</label>' +
            '<select id="lr-purpose" name="purpose" class="lr-select">' +
              '<option value="">選択してください（任意）</option>' +
              '<option value="game">ゲーム・アプリ</option>' +
              '<option value="video">映像作品・YouTube</option>' +
              '<option value="ad">広告・VP映像</option>' +
              '<option value="stage">舞台・イベント</option>' +
              '<option value="other">その他</option>' +
            '</select>' +
          '</div>' +
        '</section>' +

        '<div class="license-request-actions">' +
          '<div id="lr-price-display" class="lr-price-display">&nbsp;</div>' +
          '<button type="submit" id="lr-submit-btn" class="lr-submit-btn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' +
            '<span data-ja="Stripe で決済する" data-en="Pay with Stripe">Stripe で決済する</span>' +
          '</button>' +
          '<p class="license-request-note">' +
            '<span data-ja="安全なStripe決済ページに移動します。" data-en="You will be redirected to a secure Stripe checkout page.">安全なStripe決済ページに移動します。</span>' +
          '</p>' +
        '</div>' +
      '</form>';
  }

  function showTypeError(container) {
    var el = container.querySelector('#lr-type-error');
    if (el) { el.hidden = false; setTimeout(function () { el.hidden = true; }, 3000); }
  }

  // 決済に進めなかったときの案内（課金が発生していないことを明記し、再試行と問い合わせ手段を提示）
  function showCheckoutError(container, reason) {
    var isEn = getLang() === 'en';
    var id = 'lr-checkout-error';
    var box = container.querySelector('#' + id);
    if (!box) {
      box = document.createElement('div');
      box.id = id;
      box.setAttribute('role', 'alert');
      box.style.cssText = 'margin:14px 0 0;padding:14px 16px;border-radius:10px;background:#FBECE6;border:1px solid #E2B6A5;color:#7A2E18;font-size:13px;line-height:1.8';
      var actions = container.querySelector('.license-request-actions');
      if (actions && actions.parentNode) actions.parentNode.insertBefore(box, actions.nextSibling);
      else container.appendChild(box);
    }
    var mail = 'hmixtube@gmail.com';
    box.innerHTML = isEn
      ? '<strong>Could not open the checkout page.</strong> No charge has been made. Please check your connection and press “Pay with Stripe” again. If it keeps failing, email us at <a href="mailto:' + mail + '" style="color:#7A2E18;font-weight:700;text-decoration:underline">' + mail + '</a> (your selection is saved).'
      : '<strong>決済ページに進めませんでした。</strong>料金は発生していません。通信状況をご確認のうえ、もう一度「Stripe で決済する」を押してください。解決しない場合は <a href="mailto:' + mail + '" style="color:#7A2E18;font-weight:700;text-decoration:underline">' + mail + '</a> までご連絡ください（選択内容は保存されています）。';
    box.hidden = false;
    try { box.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
  }

  // ── 公開API ──────────────────────────────────────────────
  window.HMIX_INIT_LICENSE_REQUEST = init;

  // 直接アクセス時のみ自動初期化（PJAX時は router.js が HMIX_INIT_LICENSE_REQUEST() を呼ぶ）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
