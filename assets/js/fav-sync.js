/* =====================================================================
 * fav-sync.js ── お気に入りクラウド同期（スライス1）
 * ---------------------------------------------------------------------
 * 匿名Auth（永続）＋ Firestore `favorites/{uid}` ミラー ＋ レコード単位LWWマージ。
 *  - 真実源＝ローカル(FavStore)、Firestoreは複製（確定仕様書 §4-1）。
 *  - 起動時: サーバ値を取得→ HMIX_FAV.merge でLWW統合→ 統合結果を書き戻し→ 購読開始。
 *  - 変更時: `favorites:updated` をデバウンスして丸ごと set（read/write最小化＝低コスト）。
 *  - 自分の書き込みエコー/同一内容はスキップしループ防止。
 * 依存: window.HMIX_FAV(fav-store.js, merge対応版) ＋ firebase compat SDK(app/auth/firestore)。
 * スライス2（メールマジックリンクで端末間同期）は HMIX_FAV_SYNC.promote* で後付けする。
 * ===================================================================== */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  var FAV = window.HMIX_FAV;
  if (!FAV || typeof FAV.merge !== 'function' || typeof FAV.export !== 'function') return; // merge対応FavStore必須
  if (window.__HMIX_FAV_SYNC_BOOTED) return; window.__HMIX_FAV_SYNC_BOOTED = true;

  var CONFIG = {
    apiKey: 'AIzaSyBczT5L6PRDJOVAGy3DQ61l-UFbAqI6ESg',
    authDomain: 'hmix-footprints.firebaseapp.com',
    projectId: 'hmix-footprints',
    storageBucket: 'hmix-footprints.firebasestorage.app',
    messagingSenderId: '477684733173',
    appId: '1:477684733173:web:ae0d0986a92a426b08e1bc'
  };
  var DEBOUNCE_MS = 2500;
  var EMAIL_KEY = 'hmix.sync.email';
  function L(ja, en) { return (window.HMIX_LANG === 'en') ? en : ja; }
  // 診断ログ（既定OFF。window.__FS_DEBUG=true でトラブル時に window.__fsLog へ記録）
  function fslog(m) { if (!window.__FS_DEBUG) return; try { (window.__fsLog = window.__fsLog || []).push(window.__fsLog.length + ':' + m); } catch (e) {} }

  // 同期の小さなトースト（世界観に合わせた深緑×金）
  function syncToast(msg, ms) {
    try {
      var d = document; if (!d || !d.body) return;
      var host = d.getElementById('hmix-sync-toast');
      if (!host) {
        host = d.createElement('div'); host.id = 'hmix-sync-toast';
        host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite');
        host.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(104px + env(safe-area-inset-bottom,0px));z-index:2147483600;max-width:92vw;background:rgba(10,20,14,.96);color:#eef3ec;border:1px solid rgba(202,164,78,.5);border-radius:12px;padding:13px 18px;font:500 13.5px/1.65 "Noto Sans JP",sans-serif;box-shadow:0 14px 44px -14px rgba(0,0,0,.75);text-align:center;opacity:0;transition:opacity .4s ease;';
        d.body.appendChild(host);
      }
      host.textContent = msg; host.style.display = 'block';
      requestAnimationFrame(function () { host.style.opacity = '1'; });
      clearTimeout(host.__t); host.__t = setTimeout(function () { host.style.opacity = '0'; setTimeout(function () { host.style.display = 'none'; }, 450); }, ms || 5200);
    } catch (e) {}
  }

  // Firestore は map のキー順を保持しないため、JSON文字列の単純一致では
  // 「自分が上げた内容」を判定できず再アップロードのループになる。
  // → オブジェクトキーを再帰ソートした正準形(canon)で比較する（配列順は保持）。
  function canon(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) { var a = []; for (var i = 0; i < v.length; i++) a.push(canon(v[i])); return '[' + a.join(',') + ']'; }
    var keys = Object.keys(v).sort(), out = [];
    for (var j = 0; j < keys.length; j++) out.push(JSON.stringify(keys[j]) + ':' + canon(v[keys[j]]));
    return '{' + out.join(',') + '}';
  }
  function curSig() { try { return canon(JSON.parse(FAV.export())); } catch (e) { return null; } }
  function plainState() { try { return JSON.parse(FAV.export()); } catch (e) { return null; } }

  function whenFirebaseReady(cb) {
    var n = 0;
    (function wait() {
      if (window.firebase && firebase.auth && firebase.firestore) { cb(); return; }
      if (n++ > 80) return;            // ~8s で諦め（オフライン/SDK未読込）
      setTimeout(wait, 100);
    })();
  }

  function setStatus(s) {
    window.__HMIX_SYNC_STATUS = s;
    try {
      var el = document.getElementById('hnb-sync');
      if (!el) return;
      var en = (window.HMIX_LANG === 'en');
      var map = {
        syncing: en ? 'Syncing…' : '同期中…',
        synced:  en ? 'Synced to your account' : 'アカウントに同期',
        local:   en ? 'Saved on this device' : 'この端末に保存'
      };
      if (map[s]) el.textContent = map[s];
    } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('favsync:status', { detail: { status: s } })); } catch (e) {}
  }

  fslog('script-exec');
  whenFirebaseReady(function () {
    fslog('fb-ready apps=' + (firebase.apps ? firebase.apps.length : '?'));
    var app;
    try { app = (firebase.apps && firebase.apps.length) ? firebase.app() : firebase.initializeApp(CONFIG); }
    catch (e) { fslog('init-fail ' + e); try { app = firebase.app(); } catch (_) { setStatus('local'); return; } }

    var auth, db;
    try { auth = firebase.auth(); db = firebase.firestore(); } catch (e) { fslog('auth/db-fail ' + e); setStatus('local'); return; }
    try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) { fslog('persist-fail ' + e); }

    var docRef = null, lastSyncedSig = null, debTimer = null;
    var currentUid = null, unsub = null, graceTimer = null, favListenerAdded = false;

    function upload() {
      if (!docRef) return;
      var cur = curSig();
      if (cur === null || cur === lastSyncedSig) return;   // 変化なし → 書かない（ループ防止）
      var state = plainState(); if (!state) return;
      var prev = lastSyncedSig; lastSyncedSig = cur;        // 楽観的（失敗時に戻す）
      setStatus('syncing');
      docRef.set({
        state: state,
        schemaVersion: 2,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        client: (navigator.userAgent || '').slice(0, 180)
      }).then(function () { fslog('set-ok'); setStatus('synced'); })
        .catch(function (e) { fslog('set-fail ' + (e && e.code || e)); lastSyncedSig = prev; setStatus('local'); });
    }

    function scheduleUpload() {
      if (debTimer) clearTimeout(debTimer);
      debTimer = setTimeout(upload, DEBOUNCE_MS);
    }

    // uid へ（再）バインド。footprints等との二重サインインで uid が入れ替わっても
    // 最終的な currentUser に追従し、古い uid の doc を読んで permission-denied になるのを防ぐ。
    function bind(uid) {
      if (uid === currentUid) return;            // 既に同 uid
      currentUid = uid;
      if (unsub) { try { unsub(); } catch (e) {} unsub = null; }   // 旧購読を解除
      docRef = db.collection('favorites').doc(uid);
      lastSyncedSig = null;
      fslog('bind uid=' + uid.slice(0, 6));

      docRef.get().then(function (snap) {
        if (currentUid !== uid) return;          // バインド中にさらに uid が変わった → 中止
        fslog('get-ok exists=' + snap.exists);
        if (snap.exists) {
          var d = snap.data();
          if (d && d.state) { try { FAV.merge(d.state); } catch (e) {} lastSyncedSig = canon(d.state); }  // ローカルへLWW統合
        }
        upload();                                                          // 統合後がリモートと異なる時だけ書く（純粋な復元では書かない）
        setStatus('synced');

        // リアルタイム購読：他端末/他タブの変更を取り込む（自分のエコー/同一内容はスキップ）
        unsub = docRef.onSnapshot(function (snap2) {
          if (!snap2.exists) return;
          if (snap2.metadata && snap2.metadata.hasPendingWrites) return;   // 自分のローカル書き込みエコーは無視
          var d2 = snap2.data(); if (!d2 || !d2.state) return;
          var remoteSig = canon(d2.state);
          if (remoteSig === lastSyncedSig) return;                         // 自分が上げた内容/既知 → 無視
          try { FAV.merge(d2.state); } catch (e) { return; }
          lastSyncedSig = remoteSig;                                       // このリモート版を消化済みに
          upload();                                                        // 統合で新しいローカルが生じた時だけ書き戻し
        }, function (e) { fslog('snap-err ' + e); /* listen error: ローカルのみで継続 */ });
      }).catch(function (e) { fslog('get-fail ' + (e && e.code || e)); setStatus('local'); });

      if (!favListenerAdded) { favListenerAdded = true; window.addEventListener('favorites:updated', scheduleUpload); }
    }

    // 既存サインイン（footprints 等）を待ってから自前サインイン＝匿名ユーザーの二重生成を避ける
    function ensureUser() {
      if (auth.currentUser) { bind(auth.currentUser.uid); return; }
      if (graceTimer) return;
      graceTimer = setTimeout(function () {
        graceTimer = null;
        if (!auth.currentUser) {
          auth.signInAnonymously().then(function () { fslog('anon-ok'); })
            .catch(function (e) { fslog('anon-fail ' + (e && e.code || e)); setStatus('local'); });
        }
      }, 1600);
    }

    setStatus('local');
    auth.onAuthStateChanged(function (user) {
      fslog('authChange user=' + (user ? user.uid.slice(0, 6) : 'null'));
      if (user) {
        if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; }
        bind(user.uid);                          // 最新 user に常に追従（再バインド）
      } else {
        ensureUser();
      }
    });
    ensureUser();                                // 既にサインイン済みなら即バインド

    /* =================================================================
     * スライス2 — メールマジックリンクで端末間同期（匿名→アカウント昇格）
     *   送信: sendSignInLinkToEmail（戻り先=現在ページ／認可ドメイン済）。
     *   復帰: isSignInWithEmailLink → 匿名なら linkWithCredential で“同じuidを昇格”、
     *         既存アカウントなら signInWithEmailLink で切替（bindがローカルをLWWマージ）。
     *   ※ Firebase Console で「メール/パスワード→メールリンク」を有効化していないと
     *     operation-not-allowed。その時は穏当に案内する。
     * ================================================================= */
    function account() {
      var u = auth.currentUser, linked = !!(u && !u.isAnonymous && u.email);
      return { linked: linked, email: linked ? u.email : null };
    }
    function cleanUrl() {
      try {
        var u = new URL(location.href);
        ['apiKey', 'oobCode', 'mode', 'lang', 'continueUrl', 'tenantId'].forEach(function (k) { u.searchParams.delete(k); });
        history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
      } catch (e) {}
    }
    function startEmailSync(email) {
      email = String(email || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Promise.reject({ code: 'bad-email' });
      try { localStorage.setItem(EMAIL_KEY, email); } catch (e) {}
      return auth.sendSignInLinkToEmail(email, { url: location.origin + location.pathname, handleCodeInApp: true });
    }
    function signOutSync() {
      try { localStorage.removeItem(EMAIL_KEY); } catch (e) {}
      return auth.signOut();   // onAuthStateChanged(null)→ensureUser で匿名に戻る（ローカルのお気に入りは保持）
    }
    // Google ログインで端末間同期（メール開封不要・ワンタップ）。匿名は同uid昇格、既存は切替→bindがマージ。
    function syncWithGoogle() {
      var provider;
      try { provider = new firebase.auth.GoogleAuthProvider(); } catch (e) { return Promise.reject({ code: 'no-google' }); }
      try { provider.setCustomParameters({ prompt: 'select_account' }); } catch (e) {}
      var u = auth.currentUser;
      var attempt = (u && u.isAnonymous)
        ? u.linkWithPopup(provider).catch(function (e) {
            if (e && (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use')) return auth.signInWithPopup(provider);
            throw e;
          })
        : auth.signInWithPopup(provider);
      return attempt.then(function () {
        setStatus('synced'); refreshLauncher();
        syncToast(L('Googleアカウントで、端末間の同期がはじまりました。', 'Now syncing across devices with your Google account.'));
      }).catch(function (e) {
        var code = e && e.code || '';
        if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request' || code === 'auth/operation-not-supported-in-this-environment') {
          try { (u && u.isAnonymous) ? u.linkWithRedirect(provider) : auth.signInWithRedirect(provider); return; } catch (e2) {}
        }
        if (code === 'auth/popup-closed-by-user') return;   // ユーザーが閉じただけ
        syncToast(L('Google同期に失敗しました', 'Google sync failed') + (code ? ' (' + code + ')' : ''));
      });
    }
    // リダイレクト方式でGoogleに行って戻ってきた場合の後始末（モバイル等）
    function completeRedirectIfPresent() {
      try {
        auth.getRedirectResult().then(function (res) {
          if (res && res.user) { setStatus('synced'); refreshLauncher(); syncToast(L('Googleアカウントで同期がはじまりました。', 'Now syncing with your Google account.')); }
        }).catch(function (e) {
          var c = e && e.code;
          if (c === 'auth/credential-already-in-use' || c === 'auth/email-already-in-use') {
            try { var cred = firebase.auth.GoogleAuthProvider.credentialFromError && firebase.auth.GoogleAuthProvider.credentialFromError(e); if (cred) auth.signInWithCredential(cred); } catch (e2) {}
          }
        });
      } catch (e) {}
    }
    function completeEmailLinkIfPresent() {
      var isLink = false;
      try { isLink = auth.isSignInWithEmailLink && auth.isSignInWithEmailLink(location.href); } catch (e) {}
      if (!isLink) return;
      var email = ''; try { email = localStorage.getItem(EMAIL_KEY) || ''; } catch (e) {}
      if (!email) { try { email = window.prompt(L('同期するメールアドレスをもう一度入力してください', 'Re-enter your email to finish syncing')) || ''; } catch (e) {} }
      if (!email) { cleanUrl(); return; }
      var link = location.href, cred;
      try { cred = firebase.auth.EmailAuthProvider.credentialWithLink(email, link); } catch (e) { cleanUrl(); return; }
      var u = auth.currentUser, p;
      setStatus('syncing');
      if (u && u.isAnonymous) {
        p = u.linkWithCredential(cred).catch(function (e) {
          if (e && (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use')) {
            return auth.signInWithEmailLink(email, link);   // 既存アカウント → 切替（bindがマージ）
          }
          throw e;
        });
      } else {
        p = auth.signInWithEmailLink(email, link);
      }
      p.then(function () {
        try { localStorage.removeItem(EMAIL_KEY); } catch (e) {}
        cleanUrl(); setStatus('synced'); refreshLauncher();
        syncToast(L('この手帖が、別の端末ともつながりました。', 'Your notebook now syncs across your devices.'));
      }).catch(function (e) {
        cleanUrl();
        syncToast(L('同期リンクの確認に失敗しました', 'Could not complete the sync link') + (e && e.code ? ' (' + e.code + ')' : ''));
      });
    }

    /* ---- 同期UI（モーダル） ---- */
    function closeModal() { var m = document.getElementById('hmix-sync-modal'); if (m && m.parentNode) m.parentNode.removeChild(m); }
    function openSync() {
      closeModal();
      var en = (window.HMIX_LANG === 'en'), a = account();
      var m = document.createElement('div'); m.id = 'hmix-sync-modal';
      m.style.cssText = 'position:fixed;inset:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;background:rgba(4,8,6,.62);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);padding:20px;';
      var card = document.createElement('div');
      card.style.cssText = 'max-width:420px;width:100%;background:linear-gradient(180deg,rgba(14,24,17,.98),rgba(9,16,12,.98));border:1px solid rgba(202,164,78,.34);border-radius:16px;padding:24px 22px;box-shadow:0 30px 80px -24px rgba(0,0,0,.8);font-family:"Noto Sans JP",sans-serif;color:#eef3ec;';
      var inner = '';
      inner += '<div style="font-family:\'Noto Serif JP\',serif;font-size:1.18rem;letter-spacing:.04em;color:#f3ecd9;margin-bottom:6px;">' + (a.linked ? L('端末間で同期中', 'Synced across devices') : L('別の端末でも、この手帖を', 'Use this notebook on another device')) + '</div>';
      if (a.linked) {
        inner += '<p style="margin:.4rem 0 1.1rem;font-size:13px;line-height:1.8;color:rgba(232,240,228,.74);">' + L('いま ', 'Signed in as ') + '<b style="color:#e7ca7c;">' + a.email.replace(/[<>&]/g, '') + '</b>' + L(' で同期しています。同じメールでログインすれば、別の端末でも同じ手帖が開きます。', '. Sign in with the same email on any device to open the same notebook.') + '</p>';
        inner += '<button id="hmix-sync-out" type="button" style="width:100%;min-height:46px;cursor:pointer;background:transparent;color:rgba(232,240,228,.8);border:1px solid rgba(160,180,165,.4);border-radius:10px;font:600 14px/1 \'Noto Sans JP\',sans-serif;">' + L('この端末の同期を解除', 'Stop syncing on this device') + '</button>';
      } else {
        inner += '<p style="margin:.4rem 0 1rem;font-size:13px;line-height:1.85;color:rgba(232,240,228,.74);">' + L('メールアドレスにログイン用のリンクをお送りします。リンクを開くだけで、パスワード不要で同期がはじまります。', 'We will email you a one-tap link. Open it to start syncing — no password needed.') + '</p>';
        inner += '<input id="hmix-sync-email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" style="width:100%;box-sizing:border-box;padding:13px 14px;margin-bottom:10px;background:rgba(6,12,9,.7);border:1px solid rgba(160,180,165,.4);border-radius:10px;color:#fff;font-size:15px;">';
        inner += '<div id="hmix-sync-msg" style="min-height:18px;margin-bottom:8px;font-size:12.5px;line-height:1.6;color:rgba(232,240,228,.7);"></div>';
        inner += '<button id="hmix-sync-send" type="button" style="width:100%;min-height:48px;cursor:pointer;background:linear-gradient(135deg,#e7ca7c,#caa44e);color:#16271c;border:none;border-radius:10px;font:700 15px/1 \'Noto Sans JP\',sans-serif;box-shadow:0 12px 30px -12px rgba(202,164,78,.6);">' + L('同期リンクを送る', 'Send the sync link') + '</button>';
        inner += '<div style="display:flex;align-items:center;gap:10px;margin:15px 0 12px;color:rgba(232,240,228,.38);font-size:11px;letter-spacing:.18em;"><span style="flex:1;height:1px;background:rgba(160,180,165,.28);"></span>' + L('または', 'OR') + '<span style="flex:1;height:1px;background:rgba(160,180,165,.28);"></span></div>';
        inner += '<button id="hmix-sync-google" type="button" style="width:100%;min-height:46px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:#1f1f1f;border:none;border-radius:10px;font:600 14px/1 \'Noto Sans JP\',sans-serif;box-shadow:0 8px 22px -10px rgba(0,0,0,.5);">' +
          '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.6 13.2l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z"/><path fill="#FBBC05" d="M10.5 28.3c-.5-1.4-.8-2.9-.8-4.3s.3-3 .8-4.3l-7.9-6.1C1 16.7 0 20.2 0 24s1 7.3 2.6 10.4l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.4-4.6 2.2-7.9 2.2-6.3 0-11.7-3.7-13.5-9.1l-7.9 6.1C6.4 42.6 14.6 48 24 48z"/></svg>' +
          L('Googleで同期', 'Sync with Google') + '</button>';
      }
      inner += '<button id="hmix-sync-close" type="button" aria-label="' + L('閉じる', 'Close') + '" style="position:absolute;top:14px;right:16px;width:40px;height:40px;cursor:pointer;background:none;border:none;color:rgba(232,240,228,.66);font-size:18px;line-height:1;">✕</button>';
      card.style.position = 'relative'; card.innerHTML = inner; m.appendChild(card); document.body.appendChild(m);
      m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
      var cl = card.querySelector('#hmix-sync-close'); if (cl) cl.addEventListener('click', closeModal);
      var out = card.querySelector('#hmix-sync-out'); if (out) out.addEventListener('click', function () { signOutSync(); closeModal(); syncToast(L('この端末の同期を解除しました（お気に入りは残ります）', 'Stopped syncing on this device (your favorites stay here)')); });
      var g = card.querySelector('#hmix-sync-google'); if (g) g.addEventListener('click', function () { closeModal(); syncWithGoogle(); });
      var send = card.querySelector('#hmix-sync-send');
      if (send) send.addEventListener('click', function () {
        var inp = card.querySelector('#hmix-sync-email'), msg = card.querySelector('#hmix-sync-msg');
        var email = inp ? inp.value : '';
        msg.style.color = 'rgba(232,240,228,.7)'; msg.textContent = L('送信中…', 'Sending…'); send.disabled = true;
        startEmailSync(email).then(function () {
          msg.style.color = '#bfe6c8';
          msg.textContent = L('「' + email + '」にリンクを送りました。メールを開いて、リンクをタップしてください。', 'A link was sent to ' + email + '. Open it and tap the link.');
          send.textContent = L('送信しました ✓', 'Sent ✓');
        }).catch(function (e) {
          send.disabled = false; msg.style.color = '#f6b8a0';
          if (e && e.code === 'bad-email') msg.textContent = L('メールアドレスの形式をご確認ください。', 'Please check the email address.');
          else if (e && e.code === 'auth/operation-not-allowed') msg.textContent = L('この機能は現在準備中です（メールリンク認証が未設定）。', 'This feature is being set up (email-link sign-in not enabled yet).');
          else msg.textContent = L('送信に失敗しました', 'Failed to send') + (e && e.code ? ' (' + e.code + ')' : '');
        });
      });
    }

    /* ---- 手帖ヘッダーに導線を差し込む（fav-notebook.js は触らず注入） ---- */
    function launcherLabel() { return account().linked ? L('✓ 同期中', '✓ Synced') : L('別の端末でも使う', 'Sync to another device'); }
    function refreshLauncher() { var b = document.getElementById('hnb-sync-cta'); if (b) b.textContent = launcherLabel(); }
    function injectLauncher() {
      var head = document.querySelector('.hnb-head'); if (!head || head.querySelector('#hnb-sync-cta')) return;
      var btn = document.createElement('button'); btn.id = 'hnb-sync-cta'; btn.type = 'button'; btn.textContent = launcherLabel();
      btn.style.cssText = 'flex:0 0 auto;cursor:pointer;background:rgba(202,164,78,.12);color:#e7ca7c;border:1px solid rgba(202,164,78,.4);border-radius:999px;padding:7px 13px;font:600 11.5px/1 "Noto Sans JP",sans-serif;letter-spacing:.04em;white-space:nowrap;margin-left:auto;';
      btn.addEventListener('click', openSync);
      var close = head.querySelector('#hnb-close');
      if (close) head.insertBefore(btn, close); else head.appendChild(btn);
    }
    function hookNotebook() {
      if (window.HMIX_NOTEBOOK && window.HMIX_NOTEBOOK.open && !window.HMIX_NOTEBOOK.__syncHooked) {
        var orig = window.HMIX_NOTEBOOK.open; window.HMIX_NOTEBOOK.__syncHooked = true;
        window.HMIX_NOTEBOOK.open = function () { var r = orig.apply(this, arguments); setTimeout(injectLauncher, 60); return r; };
        return;
      }
      if (!hookNotebook._n) hookNotebook._n = 0;
      if (hookNotebook._n++ < 40) setTimeout(hookNotebook, 400);   // fav-notebook.js のロード待ち
    }

    // 公開フックを本実装で上書き
    window.HMIX_FAV_SYNC.account = account;
    window.HMIX_FAV_SYNC.startEmailSync = startEmailSync;
    window.HMIX_FAV_SYNC.syncWithGoogle = syncWithGoogle;
    window.HMIX_FAV_SYNC.signOutSync = signOutSync;
    window.HMIX_FAV_SYNC.openSync = openSync;

    completeEmailLinkIfPresent();
    completeRedirectIfPresent();
    hookNotebook();
    window.addEventListener('hmix:lang', refreshLauncher);
  });

  // スライス2（メールマジックリンク昇格）の公開フック（firebase 準備後に本実装で上書き）
  window.HMIX_FAV_SYNC = {
    status: function () { return window.__HMIX_SYNC_STATUS || 'local'; },
    account: function () { return { linked: false, email: null }; },
    syncWithGoogle: function () { try { syncToast(L('同期はまだ準備中です', 'Sync is still warming up')); } catch (e) {} },
    openSync: function () { try { syncToast(L('同期はまだ準備中です', 'Sync is still warming up')); } catch (e) {} }
  };
})();
