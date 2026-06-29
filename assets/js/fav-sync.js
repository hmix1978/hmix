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
  // 診断ログ（既定OFF。window.__FS_DEBUG=true でトラブル時に window.__fsLog へ記録）
  function fslog(m) { if (!window.__FS_DEBUG) return; try { (window.__fsLog = window.__fsLog || []).push(window.__fsLog.length + ':' + m); } catch (e) {} }

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
  });

  // スライス2（メールマジックリンク昇格）から使う公開フック
  window.HMIX_FAV_SYNC = {
    status: function () { return window.__HMIX_SYNC_STATUS || 'local'; }
  };
})();
