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

  whenFirebaseReady(function () {
    var app;
    try { app = (firebase.apps && firebase.apps.length) ? firebase.app() : firebase.initializeApp(CONFIG); }
    catch (e) { try { app = firebase.app(); } catch (_) { setStatus('local'); return; } }

    var auth, db;
    try { auth = firebase.auth(); db = firebase.firestore(); } catch (e) { setStatus('local'); return; }
    try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}

    var docRef = null, lastSyncedSig = null, debTimer = null, started = false;

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
      }).then(function () { setStatus('synced'); })
        .catch(function () { lastSyncedSig = prev; setStatus('local'); });
    }

    function scheduleUpload() {
      if (debTimer) clearTimeout(debTimer);
      debTimer = setTimeout(upload, DEBOUNCE_MS);
    }

    function start(uid) {
      if (started) return; started = true;
      docRef = db.collection('favorites').doc(uid);

      docRef.get().then(function (snap) {
        if (snap.exists) {
          var d = snap.data();
          if (d && d.state) { try { FAV.merge(d.state); } catch (e) {} lastSyncedSig = canon(d.state); }  // ローカルへLWW統合
        }
        upload();                                                          // 統合後がリモートと異なる時だけ書く（純粋な復元では書かない）

        // リアルタイム購読：他端末/他タブの変更を取り込む（自分のエコー/同一内容はスキップ）
        docRef.onSnapshot(function (snap2) {
          if (!snap2.exists) return;
          if (snap2.metadata && snap2.metadata.hasPendingWrites) return;   // 自分のローカル書き込みエコーは無視
          var d2 = snap2.data(); if (!d2 || !d2.state) return;
          var remoteSig = canon(d2.state);
          if (remoteSig === lastSyncedSig) return;                         // 自分が上げた内容/既知 → 無視
          try { FAV.merge(d2.state); } catch (e) { return; }
          lastSyncedSig = remoteSig;                                       // このリモート版を消化済みに
          upload();                                                        // 統合で新しいローカルが生じた時だけ書き戻し
        }, function () { /* listen error: ローカルのみで継続 */ });
      }).catch(function () { setStatus('local'); });

      window.addEventListener('favorites:updated', scheduleUpload);        // ローカル変更 → デバウンス同期
      setStatus('synced');
    }

    setStatus('local');
    auth.onAuthStateChanged(function (user) {
      if (user) { start(user.uid); }
      else { auth.signInAnonymously().catch(function () { setStatus('local'); }); }
    });
  });

  // スライス2（メールマジックリンク昇格）から使う公開フック
  window.HMIX_FAV_SYNC = {
    status: function () { return window.__HMIX_SYNC_STATUS || 'local'; }
  };
})();
