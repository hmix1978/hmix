/**
 * H/MIX GALLERY — footprints.js
 * 旅人の足跡：コアモジュール
 *
 * Phase 0: localStorage のみ（USE_FIREBASE = false）
 * Phase 1: Firebase Firestore + 匿名Auth（USE_FIREBASE = true）
 *
 * 同期 API を維持しつつ Firebase をバックグラウンドで同期する
 * → footprints-theater.js 等の呼び出し側に変更不要
 */
(function () {
  'use strict';

  // ── 機能停止フラグ ─────────────────────────────────────
  // 履歴: 2026年初頭、共有モジュールのスキーマと firestore.rules の不整合により
  //       「自分の投稿しか見えない」現象が発生し一時停止していた。
  //       2026-04-27 にスキーマ統一を実施し再有効化。
  var FEATURE_DISABLED = false;

  // ── 設定 ─────────────────────────────────────────────────
  var STORAGE_KEY   = 'hmix_footprints_v1';
  var RATE_KEY      = 'hmix_fp_rate_v1';
  var MAX_BODY      = 60;
  var MAX_PER_TRACK = 50;
  var RATE_MS       = 30000; // 30秒以内の同曲連投を禁止
  var CACHE_TTL     = 2 * 60 * 1000; // リモートキャッシュ有効期間 2分

  // ── Phase 1 設定 ─────────────────────────────────────────
  // Firebase 設定完了後に true に変更する
  var USE_FIREBASE = true;

  // Firebase Console > プロジェクト設定 > マイアプリ > SDKの設定と構成 からコピー
  var FIREBASE_CONFIG = {
    apiKey:            'AIzaSyBczT5L6PRDJOVAGy3DQ61l-UFbAqI6ESg',
    authDomain:        'hmix-footprints.firebaseapp.com',
    projectId:         'hmix-footprints',
    storageBucket:     'hmix-footprints.firebasestorage.app',
    messagingSenderId: '477684733173',
    appId:             '1:477684733173:web:ae0d0986a92a426b08e1bc',
  };

  // ── 内部状態 ─────────────────────────────────────────────
  var _db          = null;   // Firestore インスタンス
  var _auth        = null;   // Firebase Auth インスタンス
  var _currentUid  = null;   // 匿名 UID（本人確認用）
  var _authReady   = false;  // Auth 準備完了フラグ
  var _remoteCache = {};     // { trackId: { ts: number, items: [] } }
  var _pending     = {};     // バックグラウンド取得中フラグ { trackId: bool }

  // ── バリデーション ────────────────────────────────────────
  var URL_RE   = /https?:\/\/|www\./i;
  var SPACE_RE = /^\s*$/;

  function validate(body) {
    var s = (body || '').trim();
    if (SPACE_RE.test(s)) return { ok: false, error: '本文を入力してください。' };
    if (s.length > MAX_BODY) return { ok: false, error: MAX_BODY + '文字以内で入力してください。' };
    if (URL_RE.test(s)) return { ok: false, error: 'URLの投稿はできません。' };
    return { ok: true };
  }

  // ── レート制限 ────────────────────────────────────────────
  function isRateLimited(trackId) {
    try {
      var r = JSON.parse(localStorage.getItem(RATE_KEY) || '{}');
      return r[trackId] && (Date.now() - r[trackId]) < RATE_MS;
    } catch (e) { return false; }
  }

  function _markRate(trackId) {
    try {
      var r = JSON.parse(localStorage.getItem(RATE_KEY) || '{}');
      r[trackId] = Date.now();
      localStorage.setItem(RATE_KEY, JSON.stringify(r));
    } catch (e) {}
  }

  // ── 日付フォーマット ──────────────────────────────────────
  function formatDate(isoStr) {
    try {
      var d = new Date(isoStr);
      return d.getFullYear() + '.' +
        String(d.getMonth() + 1).padStart(2, '0') + '.' +
        String(d.getDate()).padStart(2, '0');
    } catch (e) { return ''; }
  }

  // ── localStorage (Phase 0 互換) ───────────────────────────
  function _loadLocal() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; }
  }

  function _saveLocal(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  }

  function _getLocal(trackId) {
    var all = _loadLocal();
    return (all[trackId] || []).filter(function (c) { return c.status === 'approved'; });
  }

  function _postLocal(trackId, body, nickname, source, trackTitle) {
    var all = _loadLocal();
    if (!all[trackId]) all[trackId] = [];
    var item = {
      commentId:  'fp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      nickname:   ((nickname || '').trim()) || '旅人',
      body:       body.trim().replace(/\n{3,}/g, '\n\n').slice(0, MAX_BODY),
      createdAt:  new Date().toISOString(),
      status:     'approved',
      source:     source || 'detail',
      trackTitle: (trackTitle || '').trim() || '',
      isOwn:      true,
    };
    all[trackId].unshift(item);
    if (all[trackId].length > MAX_PER_TRACK) {
      all[trackId] = all[trackId].slice(0, MAX_PER_TRACK);
    }
    if (!_saveLocal(all)) return { ok: false, error: '保存に失敗しました。' };
    return { ok: true, item: item };
  }

  function _removeLocal(trackId, commentId) {
    var all = _loadLocal();
    if (!all[trackId]) return false;
    var before = all[trackId].length;
    all[trackId] = all[trackId].filter(function (it) { return it.commentId !== commentId; });
    if (all[trackId].length === before) return false;
    _saveLocal(all);
    return true;
  }

  function _removeAllLocal(trackId) {
    var all = _loadLocal();
    if (trackId) {
      all[trackId] = [];
    } else {
      Object.keys(all).forEach(function (k) { all[k] = []; });
    }
    _saveLocal(all);
  }

  // ── Firebase 初期化 ───────────────────────────────────────
  function _initFirebase() {
    if (!USE_FIREBASE || _db) return;
    if (typeof firebase === 'undefined') {
      console.warn('[HMIX Footprints] Firebase SDK が未ロードです。USE_FIREBASE を false に戻します。');
      USE_FIREBASE = false;
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      _db   = firebase.firestore();
      _auth = firebase.auth();

      // 匿名サインイン（静かに実行、UI には何も表示しない）
      _auth.signInAnonymously()
        .then(function (credential) {
          _currentUid = credential.user.uid;
          _authReady  = true;
        })
        .catch(function (e) {
          console.warn('[HMIX Footprints] 匿名サインイン失敗（書き込み・削除が制限されます）:', e.code);
          _authReady = true; // 読み取りのみ可能な状態で続行
        });
    } catch (e) {
      console.warn('[HMIX Footprints] Firebase 初期化エラー:', e);
      USE_FIREBASE = false;
    }
  }

  // ── Firebase バックグラウンド取得 ─────────────────────────
  // キャッシュが古くなったら Firebase から再取得し、完了後に UI へ通知
  function _refreshFromFirebase(trackId) {
    if (!_db || !trackId || _pending[trackId]) return;
    // キャッシュが有効ならスキップ
    if (_remoteCache[trackId] && Date.now() - _remoteCache[trackId].ts < CACHE_TTL) return;

    _pending[trackId] = true;
    // hidden==false でルール経由読み取り可能。複合インデックスが必要 (firestore.indexes.json 参照)
    _db.collection('footprints')
      .where('trackId', '==', trackId)
      .where('hidden', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()
      .then(function (snapshot) {
        var uid = _currentUid;
        var items = snapshot.docs.map(function (doc) {
          var d = doc.data();
          return {
            commentId:  doc.id,
            // ルール準拠フィールド(author/message)と旧フィールド(nickname/body)の両方に対応
            nickname:   d.nickname  || d.author  || '旅人',
            body:       d.body      || d.message || '',
            createdAt:  d.createdAt ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
            status:     'approved',
            source:     d.source    || 'detail',
            trackTitle: d.trackTitle || '',
            isOwn:      !!(uid && d.uid === uid),
          };
        });
        _remoteCache[trackId] = { ts: Date.now(), items: items };
        _pending[trackId] = false;
        // 取得完了 → UI に通知（footprints-theater.js の footprints:updated ハンドラが反応）
        window.dispatchEvent(new CustomEvent('footprints:updated', {
          detail: { trackId: trackId }
        }));
      })
      .catch(function (e) {
        console.warn('[HMIX Footprints] Firebase 読み取りエラー:', e);
        _pending[trackId] = false;
      });
  }

  // ── Firebase バックグラウンド書き込み ─────────────────────
  // localStorage の commentId を Firestore のドキュメント ID として使う（ID 統一）
  function _postToFirebase(trackId, item) {
    if (!_db) return;
    var data = {
      // firestore.rules の isValidFootprint が要求する必須フィールド
      message:    item.body,
      author:     ((item.nickname || '旅人') + '').slice(0, 20),
      trackId:    trackId,
      hidden:     false,
      reports:    0,
      // 既存読み取り側と互換性のための拡張フィールド
      trackTitle: item.trackTitle || '',
      nickname:   item.nickname,
      body:       item.body,
      source:     item.source,
      status:     'approved',
      uid:        _currentUid || 'anonymous',
      createdAt:  firebase.firestore.FieldValue.serverTimestamp(),
    };
    _db.collection('footprints').doc(item.commentId).set(data)
      .then(function () {
        // 書き込み成功 → キャッシュを無効化して次回 get で最新データを取得
        delete _remoteCache[trackId];
      })
      .catch(function (e) {
        console.warn('[HMIX Footprints] Firebase 書き込みエラー:', e);
      });
  }

  function _removeFromFirebase(trackId, commentId) {
    if (!_db) return;
    _db.collection('footprints').doc(commentId).delete()
      .then(function () {
        delete _remoteCache[trackId];
      })
      .catch(function (e) {
        console.warn('[HMIX Footprints] Firebase 削除エラー:', e);
      });
  }

  function _removeAllFromFirebase(trackId) {
    if (!_db || !_currentUid) return;
    // 自分（uid が一致する）投稿のみ削除
    _db.collection('footprints')
      .where('trackId', '==', trackId)
      .where('uid', '==', _currentUid)
      .get()
      .then(function (snapshot) {
        if (snapshot.empty) return;
        var batch = _db.batch();
        snapshot.docs.forEach(function (doc) { batch.delete(doc.ref); });
        return batch.commit();
      })
      .then(function () {
        delete _remoteCache[trackId];
      })
      .catch(function (e) {
        console.warn('[HMIX Footprints] Firebase 全削除エラー:', e);
      });
  }

  // ── 公開 API（同期 API を維持） ───────────────────────────
  // get(): Firebase キャッシュがあればそれを返す。なければ localStorage を返しつつ
  //        バックグラウンドで Firebase から取得開始 → 完了後に footprints:updated で通知
  function getByTrack(trackId) {
    if (USE_FIREBASE && _db) {
      if (_remoteCache[trackId]) {
        if (Date.now() - _remoteCache[trackId].ts >= CACHE_TTL) {
          _refreshFromFirebase(trackId);
        }
        // Firebase データに localStorage の isOwn 情報をマージ
        var remoteItems = _remoteCache[trackId].items;
        var localItems = _getLocal(trackId);
        var localOwnIds = new Set();
        localItems.forEach(function(it) { if (it.isOwn) localOwnIds.add(it.commentId); });
        remoteItems.forEach(function(it) {
          if (localOwnIds.has(it.commentId)) it.isOwn = true;
          if (!it.isOwn && _currentUid && it.uid === _currentUid) it.isOwn = true;
          if (!it.trackId) it.trackId = trackId;
        });
        return remoteItems;
      }
      _refreshFromFirebase(trackId);
      var items = _getLocal(trackId);
      items.forEach(function(it) { if (!it.trackId) it.trackId = trackId; });
      return items;
    }
    var items = _getLocal(trackId);
    items.forEach(function(it) { if (!it.trackId) it.trackId = trackId; });
    return items;
  }

  // post(): localStorage に即書き込み + Firebase にバックグラウンド同期（楽観的更新）
  function post(trackId, body, nickname, source, trackTitle) {
    if (FEATURE_DISABLED) return { ok: false, error: 'この機能は現在準備中です。' };
    var v = validate(body);
    if (!v.ok) return { ok: false, error: v.error };
    if (isRateLimited(trackId)) return { ok: false, error: 'しばらく時間をおいてから投稿できます。' };

    var result = _postLocal(trackId, body, nickname, source, trackTitle);
    if (!result.ok) return result;

    _markRate(trackId);

    // Firebase にバックグラウンド同期
    if (USE_FIREBASE && _db) {
      _postToFirebase(trackId, result.item);
    }

    window.dispatchEvent(new CustomEvent('footprints:updated', {
      detail: { trackId: trackId, item: result.item }
    }));

    return result;
  }

  // remove(): localStorage + Firebase キャッシュから即削除 + Firebase もバックグラウンドで削除
  function remove(trackId, commentId) {
    var success = _removeLocal(trackId, commentId);
    // Firebase キャッシュからも即除去（再表示防止）
    if (_remoteCache[trackId] && _remoteCache[trackId].items) {
      _remoteCache[trackId].items = _remoteCache[trackId].items.filter(function(it) {
        return it.commentId !== commentId;
      });
      success = true;
    }
    if (success) {
      if (USE_FIREBASE && _db) _removeFromFirebase(trackId, commentId);
      window.dispatchEvent(new CustomEvent('footprints:updated', { detail: { trackId: trackId } }));
    }
    return success;
  }

  // removeAll(): 自分の投稿を全削除（localStorage + Firebase キャッシュ + Firebase）
  function removeAll(trackId) {
    _removeAllLocal(trackId);
    // Firebase キャッシュから自分の投稿を即除去
    if (trackId && _remoteCache[trackId] && _remoteCache[trackId].items) {
      _remoteCache[trackId].items = _remoteCache[trackId].items.filter(function(it) {
        return !it.isOwn;
      });
    }
    if (USE_FIREBASE && _db) _removeAllFromFirebase(trackId);
    if (trackId) {
      window.dispatchEvent(new CustomEvent('footprints:updated', { detail: { trackId: trackId } }));
    }
  }

  // getAll(): 全曲の足跡を { trackId: [items] } 形式で返す
  // localStorage の isOwn 情報を Firebase データにもマージする
  function getAll() {
    var local = _loadLocal();
    var merged = {};

    // localStorage のデータ（isOwn 付き、trackId プロパティを補完）
    for (var tid in local) {
      if (local[tid] && local[tid].length) {
        merged[tid] = local[tid].map(function(item) {
          if (!item.trackId) item.trackId = tid;
          return item;
        });
      }
    }

    // Firebase キャッシュがあればマージ（localStorage に無い分だけ追加）
    for (var tid2 in _remoteCache) {
      var cached = _remoteCache[tid2];
      if (!cached || !cached.items || !cached.items.length) continue;

      if (!merged[tid2]) {
        // localStorage にない曲 → Firebase データをそのまま使用
        merged[tid2] = cached.items.map(function(item) {
          if (!item.trackId) item.trackId = tid2;
          // isOwn を現在の uid で再判定
          if (!item.isOwn && _currentUid && item.uid === _currentUid) item.isOwn = true;
          return item;
        });
      } else {
        // localStorage にある曲 → Firebase にしかないデータを追加
        var localIds = new Set(merged[tid2].map(function(it) { return it.commentId; }));
        cached.items.forEach(function(item) {
          if (!localIds.has(item.commentId)) {
            if (!item.trackId) item.trackId = tid2;
            if (!item.isOwn && _currentUid && item.uid === _currentUid) item.isOwn = true;
            merged[tid2].push(item);
          }
        });
      }
    }

    return merged;
  }

  // purge(): localStorage + Firebase キャッシュを完全クリア（デバッグ・管理用）
  function purge() {
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    try { localStorage.removeItem(RATE_KEY); } catch(e) {}
    _remoteCache = {};
    window.dispatchEvent(new CustomEvent('footprints:updated'));
  }

  window.HMIX_FOOTPRINTS = {
    get:        getByTrack,
    getAll:     getAll,
    post:       post,
    remove:     remove,
    removeAll:  removeAll,
    validate:   validate,
    formatDate: formatDate,
    purge:      purge,
    disabled:   FEATURE_DISABLED,
  };

  // Firebase 初期化（DOM 準備完了後に実行）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initFirebase);
  } else {
    _initFirebase();
  }

})();
