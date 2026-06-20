/**
 * H/MIX GALLERY — router.js
 * Progressive PJAX Shell
 * 音楽プレイヤーの再生を止めずに、メインコンテンツ(#page-content)だけを差し替えるルーター。
 */
(function() {
  'use strict';

  // 既に初期化済みならスキップ
  if (window.HMIX_ROUTER) return;

  const CONTENT_ID = 'page-content';
  let isNavigating = false;
  let cache = {}; // URL -> HTML text の簡易キャッシュ（必要に応じて拡張）

  // イベントディスパッチャヘルパー
  function emit(eventName, detail) {
    var event = new CustomEvent(eventName, { detail: detail || {} });
    window.dispatchEvent(event);
  }

  function suppressTheaterOverlayDuringNavigation() {
    var tm = document.getElementById('theater-modal');
    document.body.classList.remove('theater-body-lock');
    document.body.style.removeProperty('--theater-scroll-y');
    document.body.style.overflow = '';
    window.HMIX_THEATER_ACTIVE = false;
    if (!tm) return;
    tm.classList.remove('is-open', 'theater-opening', 'controls-hidden', 'is-fullscreen', 'is-playing');
    tm.setAttribute('aria-hidden', 'true');
    tm.style.display = 'none';
    tm.style.visibility = 'hidden';
    tm.style.opacity = '0';
    tm.style.pointerEvents = 'none';
  }

  function bindHeaderControls() {
    var header = document.getElementById('site-header');
    if (!header) return;
    var navToggle = header.querySelector('.nav-toggle');
    var navList = header.querySelector('.nav-list');
    if (!navToggle || !navList || navToggle.dataset.routerBound === '1') return;
    navToggle.dataset.routerBound = '1';

    function closeNav() {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.classList.remove('active');
    }

    navToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.classList.toggle('active', isOpen);
    });

    navList.addEventListener('click', function(e) {
      if (e.target.closest('.nav-link, .nav-submenu__link')) closeNav();
    });

    document.addEventListener('click', function(e) {
      if (navList.classList.contains('open') &&
          !navList.contains(e.target) &&
          !navToggle.contains(e.target)) {
        closeNav();
      }
    });
  }

  function syncHeader(newDoc) {
    var currentHeader = document.getElementById('site-header');
    var nextHeader = newDoc.getElementById('site-header');
    if (!currentHeader || !nextHeader) return;
    currentHeader.replaceWith(nextHeader.cloneNode(true));
    bindHeaderControls();
  }

  // リンクが同一起源(Same Origin)か判定
  function isSameOrigin(url) {
    const loc = window.location;
    const a = document.createElement('a');
    a.href = url;
    return a.hostname === loc.hostname &&
           a.port === loc.port &&
           a.protocol === loc.protocol;
  }

  // PJAXで遷移すべきリンクか判定
  function isEligibleLink(anchor, event) {
    // 修飾キーが押されている場合はネイティブ動作に任せる
    if (event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) return false;

    // そもそもURLがない、またはハッシュリンクのみの場合
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;

    // mailto, tel等
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;

    // target="_blank"
    if (anchor.target && anchor.target === '_blank') return false;

    // download属性
    if (anchor.hasAttribute('download')) return false;

    // 外部リンク
    if (!isSameOrigin(anchor.href)) return false; // anchor.href は絶対URL解決済み

    // 同じページのアンカーリンク（例: profile.htm#top）
    const loc = window.location;
    if (anchor.pathname === loc.pathname && anchor.hash && anchor.hash !== loc.hash) {
      return false; // 同一ページのアンカー移動はブラウザに任せる
    }

    // 既に同じURLにいるなら何もしない（フェッチ不要）
    // （※ただしクエリパラメータが変わる場合は遷移とみなす）
    if (anchor.href === loc.href) return false;

    return true;
  }

  // ─── インライン <style> 同期 ───────────────────────────────────────────
  // 遷移先ページの <head> 内 <style> を差し替える。
  // PJAX では <head> が更新されないため、<link> 同様に手動で同期する必要がある。
  function syncHeadStyles(newDoc) {
    // 前回のPJAX遷移で注入したインラインスタイルを削除
    document.querySelectorAll('style[data-pjax]').forEach(function(el) { el.remove(); });

    // 遷移先ページの <head> 内 <style> を注入
    newDoc.querySelectorAll('head style').forEach(function(styleEl) {
      var newStyle = document.createElement('style');
      newStyle.textContent = styleEl.textContent;
      newStyle.setAttribute('data-pjax', '');
      document.head.appendChild(newStyle);
    });
  }

  // ─── スタイルシート同期 ──────────────────────────────────────────────────
  // 遷移先ページの <link rel="stylesheet"> と現在のページのそれを比較し、
  // 差分を追加・削除することで CSS 状態を遷移先に合わせる。
  // これにより、PJAX でも F5 と同じ CSS が適用される。
  async function syncStylesheets(newDoc, newUrl) {
    const base = new URL(newUrl, window.location.origin);

    // 現在ページのスタイルシート: 絶対URL → element のマップ
    const current = new Map();
    document.querySelectorAll('link[rel="stylesheet"]').forEach(function(el) {
      try { current.set(new URL(el.href).href, el); } catch(e) {}
    });

    // 遷移先ページのスタイルシート: 絶対URL のセット
    const next = new Set();
    newDoc.querySelectorAll('link[rel="stylesheet"]').forEach(function(el) {
      try { next.add(new URL(el.getAttribute('href') || '', base).href); } catch(e) {}
    });

    // 追加: 遷移先にあって現在にないもの（ロード完了を待つPromiseを返す）
    var loadPromises = [];
    newDoc.querySelectorAll('link[rel="stylesheet"]').forEach(function(el) {
      try {
        const abs = new URL(el.getAttribute('href') || '', base).href;
        if (!current.has(abs)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = abs;
          var p = new Promise(function(resolve) {
            link.onload = resolve;
            link.onerror = resolve; // エラーでもブロックしない
            setTimeout(resolve, 2000); // 2秒タイムアウト
          });
          loadPromises.push(p);
          document.head.appendChild(link);
        }
      } catch(e) {}
    });

    // 新規CSSのロード完了を先に待つ
    if (loadPromises.length) await Promise.all(loadPromises);

    // 除去は新CSS適用後に行う
    current.forEach(function(el, abs) {
      if (!next.has(abs)) { el.remove(); }
    });
  }

  // ─── 外部 <script src> 同期 ──────────────────────────────────────────
  // PJAX 遷移先のページが必要とする外部スクリプトのうち、現在の document に
  // 未ロードなものを動的に注入する。
  // 例: track-detail ページから TOP / Music Library へ遷移した場合、
  //   app.js / tracks-loader.js / scenic-bg.js / scene-portal.js /
  //   howto-scroll.js / site-history.js / music-library.js などが
  //   検出ロード済みでないと、hmix:page:init のリスナーが存在せず、
  //   動的セクション (今日の音楽・旅路の手引き・サイト履歴・楽曲一覧等) が
  //   空のままになる。
  //
  // 比較は origin + pathname (キャッシュバスター ?v=... を無視)。
  // 順序保証のため async=false を明示し、新規分のロード完了を await する。
  async function syncBodyScripts(newDoc, newUrl) {
    var currentSrcs = new Set();
    document.querySelectorAll('script[src]').forEach(function(el) {
      try {
        var u = new URL(el.src, window.location.origin);
        currentSrcs.add(u.origin + u.pathname);
      } catch (e) {}
    });

    var base = new URL(newUrl, window.location.origin);
    var loadPromises = [];
    newDoc.querySelectorAll('body script[src]').forEach(function(el) {
      try {
        var rawSrc = el.getAttribute('src');
        if (!rawSrc) return;
        var abs = new URL(rawSrc, base);
        var key = abs.origin + abs.pathname;
        if (currentSrcs.has(key)) return;
        currentSrcs.add(key);

        var s = document.createElement('script');
        s.src = abs.href;
        s.async = false; // 順序保証
        var p = new Promise(function(resolve) {
          s.onload = resolve;
          s.onerror = resolve;
          setTimeout(resolve, 3000);
        });
        loadPromises.push(p);
        document.body.appendChild(s);
      } catch (e) {}
    });

    if (loadPromises.length) await Promise.all(loadPromises);
  }

  // ─── ヘッダーナビ data-ja/data-en 同期 ─────────────────────────────────
  // <header> は #page-content の外側にあるため PJAX で差し替えられない。
  // 一部のページ (特に楽曲詳細 music/*.html) のナビゲーションは英語固定で
  // data-ja/data-en 属性が無い。app.js の applyLang() はこの属性を見て
  // テキストを切り替えるため、属性の無い nav-link は英語のまま固定される。
  //
  // 遷移先ページの <header> から data-ja/data-en を href ベースで吸い上げ、
  // 現在の <header> の対応リンクに転写することで、PJAX 後に言語切替が機能する。
  function syncHeaderNavLinks(newDoc) {
    try {
      var newLinks = newDoc.querySelectorAll('.site-header .nav-link[data-ja][data-en]');
      if (!newLinks.length) return;

      var byPath = new Map();
      newLinks.forEach(function(el) {
        try {
          var href = el.getAttribute('href');
          if (!href) return;
          var key = new URL(href, window.location.origin).pathname;
          byPath.set(key, { ja: el.dataset.ja, en: el.dataset.en });
        } catch (e) {}
      });

      var curLinks = document.querySelectorAll('.site-header .nav-link');
      curLinks.forEach(function(el) {
        try {
          var href = el.getAttribute('href');
          if (!href) return;
          var key = new URL(href, window.location.origin).pathname;
          var meta = byPath.get(key);
          if (!meta) return;
          // 既に data-ja/data-en を持つ場合は触らない
          if (!el.dataset.ja) el.dataset.ja = meta.ja;
          if (!el.dataset.en) el.dataset.en = meta.en;
        } catch (e) {}
      });
    } catch (e) {}
  }

  // スクロール位置の保存
  function saveScrollPosition() {
    history.replaceState({
      scrollX: window.scrollX,
      scrollY: window.scrollY
    }, '', window.location.href);
  }

  // 画面遷移ロジック
  async function navigate(url, isPopState = false, targetScroll = null) {
    if (isNavigating) return;

    try {
      isNavigating = true;
      window.__HMIX_LIB_INIT_PAGE__ = null; // ページ遷移開始時に Library 初期化ロックを解除

      // ── PJAX遷移中はtheater-modalを強制非表示（bg-journeyフラッシュ防止）
      // CSSキャッシュに依存しないようJS inline styleで確実に隠す
      suppressTheaterOverlayDuringNavigation();

      emit('hmix:page:before-leave', { url });

      // ローディングUIなどを出す場合はここでクラス付与
      document.body.classList.add('is-navigating');

      // 旧ページ固有の背景要素をリセット（scenic-bg, 25周年等のフラッシュ防止）
      var scenicBg = document.getElementById('scenic-bg');
      if (scenicBg) { scenicBg.style.opacity = '0'; scenicBg.style.transition = 'none'; }

      // scenic-bg 復元保証: init後に背景が復元されなかった場合のフォールバック
      window.addEventListener('hmix:page:init', function _restoreScenicBg() {
        window.removeEventListener('hmix:page:init', _restoreScenicBg);
        var bg = document.getElementById('scenic-bg');
        if (bg && bg.style.opacity === '0') {
          bg.style.transition = 'opacity 0.4s ease';
          bg.style.opacity = '1';
        }
      });

      // 旧コンテンツをフェードアウト（白フラッシュ防止）
      var currentContentEarly = document.getElementById(CONTENT_ID);
      if (currentContentEarly) {
        currentContentEarly.style.transition = 'opacity 0.1s ease';
        currentContentEarly.style.opacity = '0';
      }

      // Fetch
      let htmlText = cache[url];
      if (!htmlText) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        htmlText = await res.text();
        // 簡易キャッシュに保存（メモリ肥大化に注意だが、小規模サイトならOK）
        cache[url] = htmlText;
      }

      // DOM解析
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // 新しいコンテンツ要素を取得
      const newContent = doc.getElementById(CONTENT_ID);
      if (!newContent) {
        throw new Error(`#${CONTENT_ID} not found in fetched HTML.`);
      }

      const currentContent = document.getElementById(CONTENT_ID);
      if (!currentContent) {
        throw new Error(`#${CONTENT_ID} not found in current document.`);
      }

      // ─── 兄弟 <footer> も一緒にスワップする（フッター消失防止）───
      // 一部のページは <footer> を #page-content の外側 sibling として配置している
      // (index.html, music-library.html 等) が、track-detail のような #page-content 内側に
      // <footer> を持つページもある。PJAX で前者→後者の遷移時、外側 footer が
      // 取り残される or 後者→前者で外側 footer が消失するため、兄弟 footer を検出して
      // 旧⇄新で同期する。
      function findSiblingFooter(contentEl) {
        var next = contentEl.nextElementSibling;
        return (next && next.tagName === 'FOOTER') ? next : null;
      }
      var currentSiblingFooter = findSiblingFooter(currentContent);
      var newSiblingFooter = findSiblingFooter(newContent);

      // ─── CSS 同期（DOMスワップ前に実行し、スタイル欠落を防ぐ）───
      await syncStylesheets(doc, url);
      syncHeadStyles(doc);

      // ─── Webフォント待機（FOUT防止、最大500ms）───
      if (document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise(function(resolve) { setTimeout(resolve, 500); })
        ]);
      }

      // ─── DOM スワップ（白フラッシュ防止）───
      newContent.style.opacity = '0';
      newContent.style.transition = 'none';

      // DOMスワップ
      currentContent.replaceWith(newContent);

      // ─── 兄弟 footer 同期 ───
      if (currentSiblingFooter && newSiblingFooter) {
        currentSiblingFooter.replaceWith(newSiblingFooter);
      } else if (currentSiblingFooter && !newSiblingFooter) {
        currentSiblingFooter.remove();
      } else if (!currentSiblingFooter && newSiblingFooter) {
        // newContent の直後に挿入
        newContent.parentNode.insertBefore(newSiblingFooter, newContent.nextSibling);
      }

      // ─── ページ専用オーバーレイ同期 ───
      // theater-modal は TOP / Music Library 用の実コンテンツ。
      // 旧サイト導線やジャンルページには存在しないため、PJAX元から残ったDOMは削除する。
      function syncBodyElementById(id) {
        var currentEl = document.getElementById(id);
        var nextEl = doc.getElementById(id);

        if (currentEl && nextEl) {
          currentEl.replaceWith(nextEl.cloneNode(true));
        } else if (currentEl && !nextEl) {
          currentEl.remove();
        } else if (!currentEl && nextEl) {
          document.body.appendChild(nextEl.cloneNode(true));
        }
      }
      syncBodyElementById('theater-modal');

      // タイトルの更新
      syncHeader(doc);
      document.title = doc.title;

      // body.className はスワップ後・rAF内で更新（コンテンツと同フレームで適用）
      requestAnimationFrame(function() {
        document.body.className = doc.body.className;
        requestAnimationFrame(function() {
          newContent.style.transition = 'opacity 0.15s ease';
          newContent.style.opacity = '1';
          setTimeout(function() {
            newContent.style.transition = '';
            newContent.style.opacity = '';
          }, 200);
        });
      });

      // ─── スクロールを即時リセット ───
      // DOMスワップ直後・init発火前にリセットする。
      // index.html の site-history が水平スクロールを持つため、
      // scrollX が残ったまま getBoundingClientRect() を呼ぶと
      // カードの x 座標が 3000+ に見えてしまう問題を防ぐ。
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
      window.scrollTo(0, 0);

      // ─── グローバルUIの状態更新 ───
      
      // ヘッダーナビゲーションのアクティブ状態更新
      document.querySelectorAll('.site-nav .nav-link').forEach(link => {
        if (link.closest('.nav-item--dropdown')) {
          link.classList.remove('nav-link--active');
          return;
        }
        const linkPath = new URL(link.href).pathname;
        const currentPath = new URL(url, window.location.origin).pathname;
        const isHomeLink = linkPath.endsWith('/') || linkPath.endsWith('/index.html');
        const isCurrentHome = currentPath.endsWith('/') || currentPath.endsWith('/index.html');
        
        if (linkPath === currentPath || (isHomeLink && isCurrentHome)) {
          link.classList.add('nav-link--active');
        } else {
          link.classList.remove('nav-link--active');
        }
      });

      // 遷移時に開いているモーダル（シアター・お気に入り）があれば閉じる
      // ※ overflow:hidden・is-open・theater-body-lock の残留を防ぐため、条件に関わらず必ずリセット
      suppressTheaterOverlayDuringNavigation();
      const favModalClose = document.getElementById('fav-modal-close');
      if (favModalClose && document.getElementById('fav-modal') && !document.getElementById('fav-modal').hidden) {
        favModalClose.click();
      }

      // （必要なら meta 情報の更新処理をここに書く）
      // ...

      // ─── History API ───
      if (!isPopState) {
        history.pushState({ scrollX: 0, scrollY: 0 }, doc.title, url);
        // scrollTo(0,0) はDOMスワップ直後に実行済み
      } else {
        if (targetScroll) {
          window.scrollTo(targetScroll.scrollX, targetScroll.scrollY);
        } else {
          window.scrollTo(0, 0);
        }
      }

      // スワップ完了（トランジション用などに利用可能）
      emit('hmix:page:after-swap', { url, doc });

      // ─── 不足している外部スクリプトを動的ロード ───
      // 例: track-detail から TOP/Music Library へ遷移した場合、TOP/Library が
      // 必要とする app.js / tracks-loader.js / scene-portal.js などが
      // 未ロードな状態。これらをここで注入し、ロード完了まで待つ。
      // (hmix:page:init を発火する前に、各スクリプトが listener 登録を完了する必要がある)
      await syncBodyScripts(doc, url);

      // ─── ヘッダーナビの data-ja/data-en を遷移先から転写 ───
      // (英語固定ヘッダー (詳細ページ等) → 二言語ヘッダーへの遷移時、
      //   現ヘッダーは sibling のため差し替わらないが、属性は補完できる)
      syncHeaderNavLinks(doc);

      // ─── インライン <script> を先に実行 ───
      // DOMParser で生成された <script> は注入しても自動実行されないため、
      // 新しい <script> 要素を作り直して実行する。
      // 重要: hmix:page:init より「先に」実行する必要がある。各ページのインライン
      // スクリプトはページ固有データを定義する場合があり、init 関数群がそれを参照するため。
      newContent.querySelectorAll('script').forEach(function(oldScript) {
        if (oldScript.src) return; // 外部スクリプトは再ロード不要（既にグローバルに読み込み済み）
        var newScript = document.createElement('script');
        if (oldScript.type) newScript.type = oldScript.type;
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      // 再初期化イベントを発火（インライン script 実行後・CSS 確定後）
      emit('hmix:page:init', { url, doc });

      // GA4: PJAX ページビュー送信
      if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
          page_title: document.title,
          page_location: url,
          page_path: new URL(url).pathname
        });
      }

      // ─── コンポーネント別の明示的初期化 (イベント受信漏れ対策) ───
      if (newContent && newContent.dataset && newContent.dataset.pageType === 'library') {
        if (typeof window.HMIX_INIT_LIBRARY === 'function') {
          window.HMIX_INIT_LIBRARY();
        }
      }
      if (newContent && newContent.dataset && newContent.dataset.pageType === 'composer') {
        if (typeof window.HMIX_INIT_COMPOSER === 'function') {
          window.HMIX_INIT_COMPOSER();
        }
        // composerページではtheater-modalを完全に非活性化
        var tmComposer = document.getElementById('theater-modal');
        if (tmComposer) {
          tmComposer.classList.remove('is-open');
          tmComposer.setAttribute('aria-hidden', 'true');
          tmComposer.style.display = 'none';
          tmComposer.style.visibility = 'hidden';
          tmComposer.style.pointerEvents = 'none';
        }
      }
      // genreページでもtheater-modalを非活性化
      if (newContent && newContent.dataset && newContent.dataset.pageType === 'genre') {
        var tmGenre = document.getElementById('theater-modal');
        if (tmGenre) {
          tmGenre.classList.remove('is-open');
          tmGenre.setAttribute('aria-hidden', 'true');
          tmGenre.style.display = 'none';
          tmGenre.style.visibility = 'hidden';
          tmGenre.style.pointerEvents = 'none';
        }
      }
      if (newContent && newContent.dataset && newContent.dataset.pageType === 'license-request') {
        if (typeof window.HMIX_INIT_LICENSE_REQUEST === 'function') {
          window.HMIX_INIT_LICENSE_REQUEST();
        } else {
          // license-request.js 未ロード（PJAX初回遷移）→ 動的ロードしてから init
          var lrScript = document.createElement('script');
          lrScript.src = '/assets/js/license-request.js';
          lrScript.onload = function() {
            if (typeof window.HMIX_INIT_LICENSE_REQUEST === 'function') {
              window.HMIX_INIT_LICENSE_REQUEST();
            }
          };
          document.head.appendChild(lrScript);
        }
      }
      if (newContent && newContent.dataset && newContent.dataset.pageType === 'track-detail') {
        if (typeof window.HMIX_INIT_TRACK_DETAIL === 'function') {
          // track-detail.js 既ロード済み → 再初期化
          window.HMIX_INIT_TRACK_DETAIL();
        } else {
          // track-detail.js 未ロード（PJAX初回遷移）
          // tracks データは tracks-loader.js の window.loadTracks() 経由で取得する
          // （以前は tracks.js を直接 <script> 注入していたが、重複取得とキャッシュ不整合を
          //   防ぐため 2026-04-21 に loadTracks 経由へ統一）
          var loadTrackDetailJs = function() {
            var tdScript = document.createElement('script');
            tdScript.src = '/assets/js/track-detail.js';
            document.head.appendChild(tdScript);
          };
          if (window.TRACKS && window.TRACKS.length) {
            loadTrackDetailJs();
          } else if (typeof window.loadTracks === 'function') {
            window.loadTracks().then(loadTrackDetailJs).catch(loadTrackDetailJs);
          } else {
            // 最終フォールバック: tracks-loader も未ロードの極端なケース
            var tracksScript = document.createElement('script');
            tracksScript.src = '/assets/js/tracks.js';
            tracksScript.onload = function() { loadTrackDetailJs(); };
            tracksScript.onerror = function() { loadTrackDetailJs(); };
            document.head.appendChild(tracksScript);
          }
        }
      }

    } catch (err) {
      console.error('[PJAX Error] Fallback to native navigation:', err);
      // エラー時は通常遷移にフォールバック
      window.location.href = url;
    } finally {
      isNavigating = false;
      document.body.classList.remove('is-navigating');
      // overflow:hidden 残留の最終安全策（エラー時も含め必ずリセット）
      document.body.style.overflow = '';
      // theater-modal は TOP / Library 専用。旧サイト導線やジャンルページでは
      // theater.css が外れて素のDOMとして露出するため、閉じている限り隠し続ける。
      var tmEl = document.getElementById('theater-modal');
      var currentPageType = document.getElementById('page-content') && document.getElementById('page-content').dataset.pageType;
      var pageAllowsTheater = currentPageType === 'home' || currentPageType === 'library';
      if (tmEl && !tmEl.classList.contains('is-open')) {
        if (pageAllowsTheater) {
          tmEl.style.display = '';
          tmEl.style.visibility = '';
          tmEl.style.pointerEvents = '';
        } else {
          tmEl.classList.remove('theater-opening', 'controls-hidden', 'is-fullscreen', 'is-playing');
          tmEl.setAttribute('aria-hidden', 'true');
          tmEl.style.display = 'none';
          tmEl.style.visibility = 'hidden';
          tmEl.style.pointerEvents = 'none';
        }
      }
    }
  }

  // ─── イベント登録 ───

  function getClickPlayTrackId(anchor) {
    try {
      var url = new URL(anchor.getAttribute('href') || '', window.location.href);
      var match = url.pathname.match(/\/music\/([^/.?#]+)\.html$/);
      return match ? match[1] : '';
    } catch(e) {
      return '';
    }
  }

  function waitForPlayerApi() {
    return new Promise(function(resolve) {
      var tries = 0;
      (function check() {
        if (window.HMIX_PLAYER && typeof window.HMIX_PLAYER.playTrackById === 'function') {
          resolve(window.HMIX_PLAYER);
          return;
        }
        tries += 1;
        if (tries >= 30) {
          resolve(null);
          return;
        }
        setTimeout(check, 50);
      })();
    });
  }

  async function playTrackLink(anchor) {
    var trackId = getClickPlayTrackId(anchor);
    if (!trackId) return false;

    try {
      if (typeof window.loadTracks === 'function') {
        await window.loadTracks();
      }
      var player = await waitForPlayerApi();
      if (player) {
        player.playTrackById(trackId);
        return true;
      }
    } catch(e) {
      console.warn('[router] click-to-play failed', e);
    }

    return false;
  }

  function getFavSet() {
    try { return new Set(JSON.parse(localStorage.getItem('hmix_favorites') || '[]').map(String)); }
    catch(e) { return new Set(); }
  }

  function saveFavSet(set) {
    try {
      var ids = Array.from(set);
      localStorage.setItem('hmix_favorites', JSON.stringify(ids));
      window.dispatchEvent(new CustomEvent('favorites:updated', {
        detail: { count: set.size, ids: ids }
      }));
    } catch(e) {}
  }

  function syncGenreFavButtons() {
    var favs = getFavSet();
    document.querySelectorAll('.genre-track__fav[data-track-id]').forEach(function(button) {
      var id = String(button.getAttribute('data-track-id') || '');
      var title = String(button.getAttribute('data-track-title') || 'この曲');
      var isFav = favs.has(id);
      button.classList.toggle('is-fav', isFav);
      button.setAttribute('aria-pressed', String(isFav));
      button.setAttribute('aria-label', title + (isFav ? 'をお気に入りから削除' : 'をお気に入りに追加'));
    });
  }

  document.addEventListener('click', function(e) {
    var button = e.target.closest && e.target.closest('.genre-track__fav[data-track-id]');
    if (!button) return;

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    var id = String(button.getAttribute('data-track-id') || '');
    if (!id) return;
    var favs = getFavSet();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    saveFavSet(favs);
    syncGenreFavButtons();
  }, true);

  window.addEventListener('favorites:updated', syncGenreFavButtons);
  window.addEventListener('hmix:page:init', syncGenreFavButtons);
  document.addEventListener('DOMContentLoaded', syncGenreFavButtons);

  // 旧サイト導線の曲名リンクはSEO用のhrefを残しつつ、通常クリックでは再生を優先する。
  document.addEventListener('click', function(e) {
    var anchor = e.target.closest && e.target.closest('.genre-track__link[href], .legacy-card li a[href]');
    if (!anchor) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (anchor.target && anchor.target !== '_self') return;
    if (!getClickPlayTrackId(anchor)) return;

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    playTrackLink(anchor);
  }, true);

  // クリックインターセプト
  document.addEventListener('click', function(e) {
    // aタグを探す（SVGアイコン内クリックなども考慮してclosestを使う）
    const anchor = e.target.closest('a');
    if (!anchor) return;

    if (isEligibleLink(anchor, e)) {
      e.preventDefault();
      saveScrollPosition();
      navigate(anchor.href, false);
    }
  });

  // 戻る/進む（PopState）インターセプト
  window.addEventListener('popstate', function(e) {
    if (e.state) {
      navigate(window.location.href, true, e.state);
    } else {
      navigate(window.location.href, true, { scrollX: 0, scrollY: 0 });
    }
  });

  // 初回ロード時に現在の状態をHistoryに保存しておく（戻ってきた時用）
  window.addEventListener('DOMContentLoaded', function() {
    history.replaceState({ scrollX: window.scrollX, scrollY: window.scrollY }, '', window.location.href);

    // 初回のページ初期化イベントも発火しておく（各JSがリッスンしやすいため）
    emit('hmix:page:init', { url: window.location.href });
  });

  // ─── bfcache 復元時のインライン style リセット ───
  // PJAX が #page-content 不在ページ (例: /theater/) への遷移で fallback して
  // window.location.href 再代入したとき、navigate() 序盤で設定した
  // currentContentEarly.style.opacity='0' / scenicBg.style.opacity='0' /
  // theaterModalEl.style.display='none' / body.is-navigating が DOM に残る。
  // ブラウザバックで bfcache 復元するとそれらの inline state がそのまま戻り、
  // 「ヘッダー・フッターはあるがコンテンツが透明」という症状になる。
  // pageshow.persisted=true で確実にリセットする。
  window.addEventListener('pageshow', function(e) {
    if (!e.persisted) return; // 通常ロードは対象外

    document.body.classList.remove('is-navigating');

    var pc = document.getElementById(CONTENT_ID);
    if (pc) {
      pc.style.opacity = '';
      pc.style.transition = '';
    }

    var sb = document.getElementById('scenic-bg');
    if (sb) {
      sb.style.opacity = '';
      sb.style.transition = '';
    }

    var tm = document.getElementById('theater-modal');
    if (tm && !tm.classList.contains('is-open')) {
      tm.style.display = '';
    }
  });

  // グローバルに公開（track-detail.js などから直接 navigate を呼び出せるようにする）
  window.HMIX_ROUTER = { navigate: navigate };

})();
