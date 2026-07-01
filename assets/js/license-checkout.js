/* =====================================================================
 * license-checkout.js ── 商用ライセンス決済の単一ソース（window.HMIX_LICENSE）
 *
 * license-request.js（申請ページ）と fav-notebook.js（音楽手帖の申請ウィザード）
 * の両方から読み込み、価格定数と Stripe Checkout 生成（多重安全策つき）を共有する。
 * 手帖は全334+ページで開くが license-request.js は申請ページにしか無いため、
 * 決済ロジックは「どのページでも使える」この軽量モジュールに集約する。
 *
 * 公開API:
 *   window.HMIX_LICENSE = {
 *     PRICES, STORE_PRICES, PRO_USAGE,
 *     proUsagePrice(v), storeAnnualTotal(plan, count),
 *     estimate(type, trackCount, usage, plan, storeCount),
 *     generateLicenseId(),
 *     checkout(payload, ui),   // ← Stripe Checkout へ遷移
 *     STRIPE_API_URL
 *   }
 *   window.HMIX_LICENSE_CHECKOUT = checkout   // 後方互換エイリアス
 * ===================================================================== */
(function () {
  'use strict';
  if (window.HMIX_LICENSE && window.HMIX_LICENSE.checkout) return;

  // ── Firebase Cloud Functions（Stripe Checkout Session 生成）──
  var STRIPE_API_URL = 'https://createcheckout-r5y6n4kfwq-an.a.run.app';
  var PURCHASE_KEY   = 'hmix_pending_purchase';

  // ── 価格（すべて税込・消費税10%）。サーバ側 PRICE マップと一致させること ──
  var PRICES = { single: 2200, pack: 7480 };
  var STORE_PRICES = { store_base: 9900, store_add: 4950, facility: 19800 }; // 税込/年

  // Professional（B表）用途 → 価格（税込/曲）。サーバ側 PRO_USAGE_BAND と一致させること。
  var PRO_USAGE = [
    { v: 'film_festival',   ja: '映画祭・コンペ出品',            en: 'Film festival / competition',        price: 3300 },
    { v: 'audiobook',       ja: 'オーディオブック / 音声ドラマ', en: 'Audiobook / audio drama',            price: 3300 },
    { v: 'training',        ja: '企業研修 / eラーニング',        en: 'Corporate training / e-learning',    price: 4400 },
    { v: 'web_ad',          ja: 'Web広告（中規模）',             en: 'Web advertising (mid-scale)',        price: 5500 },
    { v: 'stage',           ja: '舞台・商業イベント（1公演）',   en: 'Theater / commercial event (1 run)', price: 5500 },
    { v: 'radio',           ja: 'ラジオ放送・ラジオCM',          en: 'Radio broadcast / radio CM',         price: 5500 },
    { v: 'package',         ja: 'パッケージ販売（DVD/CD収録）',  en: 'Packaged media (DVD/CD)',            price: 5500 },
    { v: 'enterprise_vp',   ja: '企業VP（大企業）',              en: 'Enterprise VP (large corp.)',        price: 16500 },
    { v: 'tv_program',      ja: 'TV番組・ドキュメンタリー',      en: 'TV program / documentary',           price: 16500 },
    { v: 'large_game',      ja: '大規模商用ゲーム',              en: 'Major commercial game',              price: 16500 },
    { v: 'theatrical_film', ja: '劇場映画（配給）',              en: 'Theatrical film (distribution)',     price: 27500 }
  ];

  function proUsagePrice(v) {
    var u = PRO_USAGE.find(function (x) { return x.v === v; });
    return u ? u.price : null;
  }
  function storeAnnualTotal(plan, count) {
    if (plan === 'facility') return STORE_PRICES.facility;
    var n = parseInt(count, 10);
    if (!isFinite(n) || n < 1) n = 1;
    if (n > 50) n = 50;
    return STORE_PRICES.store_base + STORE_PRICES.store_add * (n - 1);
  }
  function estimate(type, trackCount, usage, plan, storeCount) {
    if (type === 'single')       return PRICES.single * Math.max(trackCount || 0, 1);
    if (type === 'pack')         return PRICES.pack;
    if (type === 'professional') return (proUsagePrice(usage) || 0) * Math.max(trackCount || 0, 1);
    if (type === 'store')        return storeAnnualTotal(plan, storeCount || 1);
    return 0;
  }

  function generateLicenseId() {
    var date = new Date();
    var d = date.getFullYear().toString() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0');
    var rand = Math.random().toString(36).toUpperCase().slice(2, 6);
    return 'HMX-' + d + '-' + rand;
  }

  function getLang() {
    return window.HMIX_LANG || (function () {
      try { return sessionStorage.getItem('hmix_lang') || 'ja'; } catch (e) { return 'ja'; }
    })();
  }
  function trackEvent(eventName, params) {
    if (!eventName) return;
    if (window.hmixTrack) {
      window.hmixTrack(eventName, params || {});
    } else if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, Object.assign({
        page_type: (document.body && document.body.getAttribute('data-page-type')) || 'license_checkout',
        source_path: location.pathname,
        lang: getLang()
      }, params || {}));
    }
  }

  // ── 共有決済処理 ─────────────────────────────────────────
  //   p  = { licenseType, tracks:[{id,title}], trackCount, name, email, purpose,
  //          usage, usageLabelJa, usageLabelEn, storePlan, storeCount,
  //          storeName, storeAddress, projectName, surface }
  //   ui = { payLabel, preparingLabel, setBusy(label,busy), onError(reason) }
  var _checkoutInFlight = false;
  function checkout(p, ui) {
    p = p || {}; ui = ui || {};
    var isEn = getLang() === 'en';
    var setBusy = ui.setBusy || function () {};
    var onError = ui.onError || function () {};
    var payLabel = ui.payLabel || (isEn ? 'Pay with Stripe' : 'Stripe で決済する');
    var preparingLabel = ui.preparingLabel || (isEn ? 'Preparing checkout…' : '決済ページを準備中…');
    var surface = p.surface || 'license_request';

    if (_checkoutInFlight) return;

    var purchaseData = {
      licenseId:    generateLicenseId(),
      licenseType:  p.licenseType,
      tracks:       p.tracks || [],
      name:         p.name || '',
      email:        p.email || '',
      purpose:      p.purpose || '',
      usage:        p.usage || '',
      usageLabelJa: p.usageLabelJa || '',
      usageLabelEn: p.usageLabelEn || '',
      // 店舗BGMパス（サブスク）
      storePlan:    p.storePlan || '',
      storeCount:   p.storeCount || 0,
      storeName:    p.storeName || '',
      storeAddress: p.storeAddress || '',
      // Project Pack（プロジェクト単位）
      projectName:  p.projectName || '',
      // 音楽手帖オートバインド用：申請元の章ID（手帖からの申請時のみ。Stripe には送らない）
      collectionId: p.collectionId || '',
      purchaseDate: new Date().toISOString().slice(0, 10)
    };
    // 成功ページで使用するため sessionStorage に保存
    try { sessionStorage.setItem(PURCHASE_KEY, JSON.stringify(purchaseData)); } catch (e) {}

    var trackCount = (p.trackCount != null) ? p.trackCount : (purchaseData.tracks ? purchaseData.tracks.length : 0);
    var checkoutValue = estimate(purchaseData.licenseType, trackCount, purchaseData.usage, purchaseData.storePlan, purchaseData.storeCount);
    trackEvent('begin_checkout', {
      surface: surface,
      license_type: purchaseData.licenseType,
      track_count: trackCount,
      usage: purchaseData.usage,
      store_plan: purchaseData.storePlan,
      store_count: purchaseData.storeCount,
      value: checkoutValue,
      currency: 'JPY'
    });

    _checkoutInFlight = true;
    // どの失敗経路でもボタンを必ず復帰し、明確に案内（課金なしを明記）
    function failRecover(reason) {
      _checkoutInFlight = false;
      setBusy(payLabel, false);
      trackEvent('checkout_error', {
        surface: surface,
        license_type: purchaseData.licenseType,
        reason: String(reason || 'unknown').slice(0, 100)
      });
      onError(reason);
    }

    // 設定欠落ガード
    if (!STRIPE_API_URL) { failRecover('config'); return; }

    setBusy(preparingLabel, true);

    // タイムアウト（応答が来なくても固まらない）
    var ac = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timedOut = false;
    var timer = setTimeout(function () { timedOut = true; if (ac) try { ac.abort(); } catch (e) {} }, 25000);
    var settled = false;
    fetch(STRIPE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseType: purchaseData.licenseType,
        tracks: purchaseData.tracks,
        email: purchaseData.email,
        licenseId: purchaseData.licenseId,
        usage: purchaseData.usage,
        storePlan: purchaseData.storePlan,
        storeCount: purchaseData.storeCount,
        storeName: purchaseData.storeName,
        storeAddress: purchaseData.storeAddress,
        projectName: purchaseData.projectName,
        lang: getLang()
      }),
      signal: ac ? ac.signal : undefined
    })
    // JSON 以外が返っても落ちないよう text() 経由で安全パース
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
      // Stripe の正規ドメインのみ遷移を許可（不正/誤URLへ飛ばさない）
      if (typeof url === 'string' && /^https:\/\/(checkout|buy|donate)\.stripe\.com\//.test(url)) {
        settled = true; clearTimeout(timer); _checkoutInFlight = false;
        trackEvent('checkout_redirect', {
          surface: surface,
          license_type: purchaseData.licenseType,
          track_count: trackCount,
          value: checkoutValue,
          currency: 'JPY'
        });
        window.location.href = url;
      } else {
        // 不正URLは settled にせず throw → catch が案内を表示
        throw new Error((data && data.error) || 'invalid_checkout_url');
      }
    })
    .catch(function (err) {
      if (settled) return;
      settled = true; clearTimeout(timer);
      console.error('Checkout error:', err && err.message ? err.message : err);
      failRecover(timedOut ? 'timeout' : (err && err.message));
    });
  }

  window.HMIX_LICENSE = {
    PRICES: PRICES,
    STORE_PRICES: STORE_PRICES,
    PRO_USAGE: PRO_USAGE,
    proUsagePrice: proUsagePrice,
    storeAnnualTotal: storeAnnualTotal,
    estimate: estimate,
    generateLicenseId: generateLicenseId,
    checkout: checkout,
    STRIPE_API_URL: STRIPE_API_URL,
    PURCHASE_KEY: PURCHASE_KEY
  };
  // 後方互換: 直接呼び出し用エイリアス
  window.HMIX_LICENSE_CHECKOUT = checkout;
})();
