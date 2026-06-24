/* =====================================================================
 * fav-store.js ── 音楽手帖 FavStore（サイトの心臓・単一の真実源）
 * ---------------------------------------------------------------------
 * Phase 0：0-1 集約 / 0-2 冪等マイグレータ＋前方互換 / 0-3 データ契約
 *          (レコード単位LWW＋tombstone＋LexoRank＋noteConflicts) / 0-5 Undo
 *
 * 設計契約（確定仕様書 §4 §8 §9）：
 *  - localStorage `hmix_favorites_v2` が schemaVersion 2 のリッチ正本。
 *  - localStorage `hmix_favorites`（フラット string[]）は後方互換ミラー。
 *    既存消費者（player.js/theater.js 等）はこのフラット配列をそのまま読める。
 *  - 未改修消費者がフラット配列へ直接書いた場合も setItem ラップで v2 へ和解。
 *  - 件数は uniqueCount() の単一導出のみ（各所の自前カウント禁止）。
 *  - `favorites:updated`（detail:{count, ids}）は FavStore のみが発火し互換維持。
 *
 * ブラウザでもNode（テスト）でも動くよう、グローバルは遅延参照する。
 * ===================================================================== */
(function () {
  'use strict';

  var ROOT = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  if (ROOT.HMIX_FAV && ROOT.HMIX_FAV.__real) return; // 二重ロード防止

  var KEY_V2      = 'hmix_favorites_v2';
  var KEY_FLAT    = 'hmix_favorites';            // 後方互換ミラー
  var KEY_BACKUP  = 'hmix_favorites_backup_';    // + timestamp
  var SCHEMA      = 2;
  var DEFAULT_ID  = 'default';
  var DEFAULT_NAME= '未分類（とりあえず保存）';
  var BACKUP_TTL  = 90 * 24 * 60 * 60 * 1000;    // 90日
  var UNDO_MS     = 6000;

  /* ---- 時刻（Date.now の薄いラッパ：テストで差し替え可能） ---- */
  function now() { return (FavStore._now ? FavStore._now() : Date.now()); }

  /* ---- localStorage（遅延参照・例外安全） ---- */
  function LS() {
    try { return ROOT.localStorage; } catch (e) { return null; }
  }
  function lsGet(k) { try { var s = LS(); return s ? s.getItem(k) : null; } catch (e) { return null; } }
  function lsSet(k, v) { try { var s = LS(); if (s) s.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { var s = LS(); if (s) s.removeItem(k); } catch (e) {} }

  /* =================================================================
   * LexoRank-lite：間に挿入可能な順序文字列（base-26 'a'..'z'）
   * ================================================================= */
  var A = 'a'.charCodeAt(0); // 97
  var Z = 'z'.charCodeAt(0); // 122
  var MID = String.fromCharCode(Math.floor((A + Z) / 2)); // 'n'

  function rankBetween(prev, next) {
    prev = prev || '';
    next = next || '';
    // prev < next を仮定。空はそれぞれ -∞ / +∞ 扱い。
    var i = 0, out = '';
    while (true) {
      var p = i < prev.length ? prev.charCodeAt(i) : (A - 1);
      var n = i < next.length ? next.charCodeAt(i) : (Z + 1);
      if (p === n) { out += String.fromCharCode(p); i++; continue; }
      var mid = Math.floor((p + n) / 2);
      if (mid > p) { return out + String.fromCharCode(mid); }
      // 隙間が無い → prev の桁を引き継いで一段深く
      out += String.fromCharCode(p < A ? A : p);
      i++;
      // next を使い切ったら以降は自由に中間値を置ける
      if (i >= next.length) next = '';
    }
  }
  function rankAfter(prev) { return rankBetween(prev, ''); }

  /* =================================================================
   * 既定の空ステート
   * ================================================================= */
  function emptyState() {
    return {
      schemaVersion: SCHEMA,
      tracks: {},
      collections: [{
        id: DEFAULT_ID, name: DEFAULT_NAME, order: MID, status: 'draft',
        licenseeName: null, certificateRef: null,
        meta: { client: null, dueDate: null, targetLength: null, projectStatus: null, usageUrls: [] },
        archived: false, deleted: false, deletedAt: null, updatedAt: 0,
        items: []
      }],
      consents: {
        transactional: { status: 'implied', policyVersion: '1.0' },
        marketing: { status: 'none', optedInAt: null, source: null, policyVersion: null, doubleOptInConfirmedAt: null, revokedAt: null }
      },
      _meta: { gateDismissedAt: null, loggedIn: false, purchased: false }
    };
  }

  function defaultCollection(state) {
    var c = null;
    for (var i = 0; i < state.collections.length; i++) {
      if (state.collections[i].id === DEFAULT_ID) { c = state.collections[i]; break; }
    }
    if (!c) { c = emptyState().collections[0]; state.collections.unshift(c); }
    return c;
  }

  /* =================================================================
   * 0-2 マイグレータ：flat string[] → schemaVersion 2（無損失・冪等）
   * ================================================================= */
  function migrateFlat(flatArr) {
    var st = emptyState();
    var col = st.collections[0];
    var t = now();
    var seen = {};
    var rank = col.order;
    (flatArr || []).forEach(function (raw) {
      var id = String(raw);
      if (!id || seen[id]) return;
      seen[id] = true;
      st.tracks[id] = { favMemo: '', addedAt: t, updatedAt: t, orphaned: false };
      rank = rankAfter(rank);
      col.items.push({ trackId: id, note: '', order: rank, updatedAt: t, deleted: false, deletedAt: null, noteConflicts: [] });
    });
    return st;
  }

  /* 未知フィールドを保持しつつ、欠損を補完（lossless passthrough） */
  function normalize(st) {
    if (!st || typeof st !== 'object') return emptyState();
    if (!st.tracks || typeof st.tracks !== 'object') st.tracks = {};
    if (!Array.isArray(st.collections) || !st.collections.length) st.collections = emptyState().collections;
    st.schemaVersion = SCHEMA;
    if (!st.consents) st.consents = emptyState().consents;
    if (!st._meta) st._meta = { gateDismissedAt: null, loggedIn: false, purchased: false };
    st.collections.forEach(function (c) {
      if (!Array.isArray(c.items)) c.items = [];
      if (c.order == null) c.order = MID;
      if (c.deleted == null) c.deleted = false;
      if (c.updatedAt == null) c.updatedAt = 0;
      if (!c.meta) c.meta = { client: null, dueDate: null, targetLength: null, projectStatus: null, usageUrls: [] };
      c.items.forEach(function (it) {
        if (it.note == null) it.note = '';
        if (it.order == null) it.order = MID;
        if (it.updatedAt == null) it.updatedAt = 0;
        if (it.deleted == null) it.deleted = false;
        if (it.deletedAt === undefined) it.deletedAt = null;
        if (!Array.isArray(it.noteConflicts)) it.noteConflicts = [];
      });
    });
    return st;
  }

  /* ストレージから状態をロード（必要なら移行＋バックアップ） */
  function loadState() {
    var rawV2 = lsGet(KEY_V2);
    if (rawV2) {
      try {
        var st = normalize(JSON.parse(rawV2));
        // v2 が既にある場合でも、フラットが外部更新されていれば和解
        reconcileFromFlat(st, false);
        return st;
      } catch (e) { /* 壊れていたら移行へフォールバック */ }
    }
    // 初回：フラットから移行
    var flat = [];
    try { flat = JSON.parse(lsGet(KEY_FLAT) || '[]'); } catch (e) { flat = []; }
    // 旧JSONをタイムスタンプ付きで退避（90日併存）
    if (lsGet(KEY_FLAT) != null) lsSet(KEY_BACKUP + now(), lsGet(KEY_FLAT));
    pruneBackups();
    return migrateFlat(flat);
  }

  function pruneBackups() {
    var s = LS(); if (!s) return;
    try {
      var t = now();
      for (var i = s.length - 1; i >= 0; i--) {
        var k = s.key(i);
        if (k && k.indexOf(KEY_BACKUP) === 0) {
          var ts = parseInt(k.slice(KEY_BACKUP.length), 10);
          if (ts && (t - ts) > BACKUP_TTL) s.removeItem(k);
        }
      }
    } catch (e) {}
  }

  /* =================================================================
   * 0-3 データ契約：フラット外部書き込みを v2 へ LWW＋tombstone で和解
   * ================================================================= */
  function reconcileFromFlat(st, persist) {
    var flat;
    try { flat = JSON.parse(lsGet(KEY_FLAT) || 'null'); } catch (e) { flat = null; }
    if (!Array.isArray(flat)) return false;
    var want = {}; flat.forEach(function (id) { want[String(id)] = true; });
    var have = visibleIdSet(st);
    var t = now(), changed = false;
    // 追加（フラットにあって手帖に無い）→ 規定章へ投入 or tombstone復活
    Object.keys(want).forEach(function (id) {
      if (!have[id]) { addItem(st, id, DEFAULT_ID, t); changed = true; }
    });
    // 削除（手帖にあってフラットに無い）→ tombstone
    Object.keys(have).forEach(function (id) {
      if (!want[id]) { tombstone(st, id, t); changed = true; }
    });
    if (changed && persist !== false) save(st);
    return changed;
  }

  function visibleIdSet(st) {
    var out = {};
    st.collections.forEach(function (c) {
      if (c.deleted) return;
      c.items.forEach(function (it) { if (!it.deleted) out[it.trackId] = true; });
    });
    return out;
  }

  function findItem(st, trackId, collectionId) {
    for (var i = 0; i < st.collections.length; i++) {
      var c = st.collections[i];
      if (collectionId && c.id !== collectionId) continue;
      for (var j = 0; j < c.items.length; j++) {
        if (c.items[j].trackId === trackId) return { col: c, item: c.items[j] };
      }
    }
    return null;
  }

  function addItem(st, trackId, collectionId, t) {
    t = t || now();
    collectionId = collectionId || DEFAULT_ID;
    var col = null;
    for (var i = 0; i < st.collections.length; i++) if (st.collections[i].id === collectionId) col = st.collections[i];
    if (!col) col = defaultCollection(st);
    if (!st.tracks[trackId]) st.tracks[trackId] = { favMemo: '', addedAt: t, updatedAt: t, orphaned: false };
    var hit = null;
    for (var j = 0; j < col.items.length; j++) if (col.items[j].trackId === trackId) hit = col.items[j];
    if (hit) {
      // tombstone を LWW で復活
      if (hit.deleted) { hit.deleted = false; hit.deletedAt = null; hit.updatedAt = t; }
      return hit;
    }
    var last = col.items.length ? col.items[col.items.length - 1].order : col.order;
    var it = { trackId: trackId, note: '', order: rankAfter(last), updatedAt: t, deleted: false, deletedAt: null, noteConflicts: [] };
    col.items.push(it);
    return it;
  }

  /* trackId をすべての章で tombstone（LWW） */
  function tombstone(st, trackId, t) {
    t = t || now();
    var any = false;
    st.collections.forEach(function (c) {
      c.items.forEach(function (it) {
        if (it.trackId === trackId && !it.deleted) {
          it.deleted = true; it.deletedAt = t; it.updatedAt = t; any = true;
        }
      });
    });
    return any;
  }

  /* =================================================================
   * 永続化＋イベント発火（ミラー同期）
   * ================================================================= */
  var _writingMirror = false; // 自己書き込みフラグ（ラップ検知の除外用）

  function save(st) {
    lsSet(KEY_V2, JSON.stringify(st));
    writeMirror(st);
  }

  function writeMirror(st) {
    var ids = computeVisibleIds(st);
    _writingMirror = true;
    lsSet(KEY_FLAT, JSON.stringify(ids));
    _writingMirror = false;
    emit(ids);
  }

  /* pendingRemovals を除いた可視ID（uniqueCount と一致する単一導出） */
  function computeVisibleIds(st) {
    var out = [], seen = {};
    st.collections.forEach(function (c) {
      if (c.deleted) return;
      c.items.forEach(function (it) {
        if (it.deleted) return;
        if (FavStore._pending[it.trackId]) return;
        if (!seen[it.trackId]) { seen[it.trackId] = true; out.push(it.trackId); }
      });
    });
    return out;
  }

  function emit(ids) {
    if (typeof ROOT.dispatchEvent !== 'function' || typeof ROOT.CustomEvent !== 'function') return;
    try {
      ROOT.dispatchEvent(new ROOT.CustomEvent('favorites:updated', { detail: { count: ids.length, ids: ids.slice() } }));
    } catch (e) {}
  }

  /* =================================================================
   * 公開 API （window.HMIX_FAV）
   * ================================================================= */
  var FavStore = {
    __real: true,
    _now: null,                 // テスト用フック
    _pending: {},               // pendingRemovals: trackId -> {timer, colItems}
    _state: null,

    /* --- 初期化 / リロード --- */
    _reload: function () { this._pending = {}; this._state = loadState(); save(this._state); return this; },
    state: function () { if (!this._state) this._reload(); return this._state; },

    /* --- 0-1 単一導出の件数 --- */
    uniqueCount: function () { return computeVisibleIds(this.state()).length; },
    ids: function () { return computeVisibleIds(this.state()); },
    has: function (id) { id = String(id); return computeVisibleIds(this.state()).indexOf(id) !== -1; },

    /* --- 基本操作（後方互換） --- */
    add: function (id, collectionId) {
      id = String(id);
      var st = this.state();
      if (this._pending[id]) { this.undoRemove(id); }
      addItem(st, id, collectionId || DEFAULT_ID, now());
      save(st); return true;
    },
    remove: function (id) { // 即時 tombstone（Undoなし経路）
      id = String(id);
      var st = this.state();
      if (this._pending[id]) this.undoRemove(id);
      var changed = tombstone(st, id, now());
      if (changed) save(st);
      return changed;
    },
    toggle: function (id) {
      return this.has(id) ? (this.remove(id), false) : (this.add(id), true);
    },

    /* --- 0-5 Undo：UIから即除去 → トースト → タイムアウトでcommit --- */
    removeWithUndo: function (id, opts) {
      id = String(id);
      opts = opts || {};
      var self = this;
      if (this._pending[id]) return; // 既に保留
      // 保留登録（ミラーからは即時に消える＝computeVisibleIds が除外）
      this._pending[id] = { committed: false, timer: null };
      writeMirror(this.state());
      // トースト（DOM がある時のみ）
      showUndoToast(id, opts.label, function undo() { self.undoRemove(id); }, function () {});
      this._pending[id].timer = setTimeoutSafe(function () {
        if (self._pending[id]) { self._commitRemoval(id); }
      }, opts.ms || UNDO_MS);
    },
    undoRemove: function (id) {
      id = String(id);
      var p = this._pending[id];
      if (!p) return false;
      if (p.timer) clearTimeoutSafe(p.timer);
      delete this._pending[id];
      writeMirror(this.state());
      hideUndoToast(id);
      return true;
    },
    _commitRemoval: function (id) {
      id = String(id);
      var p = this._pending[id];
      if (!p) return;
      if (p.timer) clearTimeoutSafe(p.timer);
      delete this._pending[id];
      var st = this.state();
      tombstone(st, id, now());
      save(st);
      hideUndoToast(id);
    },

    /* --- 章操作 --- */
    collections: function () { return this.state().collections.filter(function (c) { return !c.deleted; }); },
    createCollection: function (name) {
      var st = this.state(), t = now();
      var last = st.collections.length ? st.collections[st.collections.length - 1].order : MID;
      var id = 'c_' + t + '_' + Math.floor((computeVisibleIds(st).length + st.collections.length));
      var c = { id: id, name: name || '新しい章', order: rankAfter(last), status: 'draft',
        licenseeName: null, certificateRef: null,
        meta: { client: null, dueDate: null, targetLength: null, projectStatus: null, usageUrls: [] },
        archived: false, deleted: false, deletedAt: null, updatedAt: t, items: [] };
      st.collections.push(c); save(st); return id;
    },
    collectionCount: function (cid) {
      var c = null, st = this.state();
      st.collections.forEach(function (x) { if (x.id === cid) c = x; });
      if (!c || c.deleted) return 0;
      var n = 0; c.items.forEach(function (it) { if (!it.deleted && !FavStore._pending[it.trackId]) n++; });
      return n;
    },

    /* --- 原子的バッチ（1操作=1undo=1同期エンキュー） --- */
    moveItems: function (ids, toCollectionId) {
      var st = this.state(), t = now();
      ids.forEach(function (id) { id = String(id); tombstone(st, id, t); addItem(st, id, toCollectionId, t); });
      save(st); return true;
    },
    copyItems: function (ids, toCollectionId) {
      var st = this.state(), t = now();
      ids.forEach(function (id) { addItem(st, String(id), toCollectionId, t); });
      save(st); return true;
    },
    bulkDelete: function (ids) {
      var st = this.state(), t = now(), any = false;
      ids.forEach(function (id) { if (tombstone(st, String(id), t)) any = true; });
      if (any) save(st); return any;
    },

    /* --- メモ（フィールドLWW・敗者は noteConflicts へ） --- */
    setNote: function (id, collectionId, note) {
      var st = this.state(), hit = findItem(st, String(id), collectionId);
      if (!hit) return false;
      hit.item.note = note; hit.item.updatedAt = now(); save(st); return true;
    },
    setTrackMemo: function (id, memo) {
      var st = this.state(); id = String(id);
      if (!st.tracks[id]) st.tracks[id] = { favMemo: '', addedAt: now(), updatedAt: now(), orphaned: false };
      st.tracks[id].favMemo = memo; st.tracks[id].updatedAt = now(); save(st); return true;
    },

    /* --- メモ化派生ビュー（UIはストア直接走査しない） --- */
    getView: function (q) {
      q = q || {};
      var st = this.state();
      var col = null;
      st.collections.forEach(function (c) { if (c.id === (q.collectionId || DEFAULT_ID)) col = c; });
      if (!col) return [];
      var rows = col.items.filter(function (it) { return !it.deleted && !FavStore._pending[it.trackId]; });
      if (q.filter) {
        var f = String(q.filter).toLowerCase();
        rows = rows.filter(function (it) { return (it.note || '').toLowerCase().indexOf(f) !== -1 || it.trackId.toLowerCase().indexOf(f) !== -1; });
      }
      var sort = q.sort || 'order';
      rows = rows.slice().sort(function (a, b) {
        if (sort === 'added') return (st.tracks[a.trackId] ? st.tracks[a.trackId].addedAt : 0) - (st.tracks[b.trackId] ? st.tracks[b.trackId].addedAt : 0);
        if (sort === 'title') return a.trackId < b.trackId ? -1 : 1;
        return a.order < b.order ? -1 : (a.order > b.order ? 1 : 0);
      });
      return rows;
    },

    /* --- soft gate 表示可否の単一判定 --- */
    suppressGate: function () {
      var st = this.state(), m = st._meta || {}, c = st.consents.marketing || {};
      var dismissedRecently = m.gateDismissedAt && (now() - m.gateDismissedAt) < (7 * 24 * 60 * 60 * 1000);
      return !!(m.purchased || m.loggedIn || dismissedRecently || c.revokedAt || c.status === 'confirmed');
    },
    dismissGate: function () { var st = this.state(); st._meta.gateDismissedAt = now(); save(st); },

    /* --- 証書の冪等書戻し --- */
    attachCertificate: function (certId, collectionId) {
      var st = this.state(), t = now(), did = false;
      st.collections.forEach(function (c) {
        if (collectionId && c.id !== collectionId) return;
        if (c.certificateRef === certId) return; // no-op（冪等）
        if (!collectionId) return;
        c.certificateRef = certId; c.status = 'licensed'; c.updatedAt = t; did = true;
      });
      if (did) save(st); return did;
    },

    /* --- エクスポート / インポート（正本フォーマット・ラウンドトリップ） --- */
    export: function () { return JSON.stringify(this.state()); },
    import: function (json) {
      try {
        var incoming = normalize(typeof json === 'string' ? JSON.parse(json) : json);
        this._state = incoming; save(this._state); return true;
      } catch (e) { return false; }
    },

    /* --- 内部公開（テスト/デバッグ用） --- */
    _internal: { migrateFlat: migrateFlat, normalize: normalize, rankBetween: rankBetween, rankAfter: rankAfter, reconcileFromFlat: reconcileFromFlat }
  };

  /* =================================================================
   * タイマー（Node/ブラウザ両対応）
   * ================================================================= */
  function setTimeoutSafe(fn, ms) { try { return ROOT.setTimeout ? ROOT.setTimeout(fn, ms) : setTimeout(fn, ms); } catch (e) { return null; } }
  function clearTimeoutSafe(t) { try { (ROOT.clearTimeout || clearTimeout)(t); } catch (e) {} }

  /* =================================================================
   * 0-5 Undoトースト UI（DOMがある時のみ・親指域・44px）
   * ================================================================= */
  function showUndoToast(id, label, onUndo) {
    if (typeof ROOT.document === 'undefined' || !ROOT.document.body) return;
    var d = ROOT.document;
    var host = d.getElementById('hmix-undo-toast');
    if (!host) {
      host = d.createElement('div');
      host.id = 'hmix-undo-toast';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      host.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:2147483000;display:flex;gap:14px;align-items:center;background:rgba(12,22,15,.96);color:#eef0ea;border:1px solid rgba(202,164,78,.4);border-radius:12px;padding:12px 16px;font:500 14px/1.4 "Noto Sans JP",sans-serif;box-shadow:0 12px 40px -12px rgba(0,0,0,.7);max-width:92vw';
      d.body.appendChild(host);
    }
    host.dataset.trackId = id;
    host.innerHTML = '';
    var msg = d.createElement('span');
    msg.textContent = (label ? '「' + label + '」' : '栞') + 'を外しました';
    var btn = d.createElement('button');
    btn.type = 'button';
    btn.textContent = '元に戻す';
    btn.style.cssText = 'min-height:44px;min-width:44px;padding:0 16px;background:transparent;color:#e7ca7c;border:1px solid rgba(202,164,78,.55);border-radius:999px;font:700 14px/1 "Noto Sans JP",sans-serif;cursor:pointer';
    btn.addEventListener('click', function () { if (onUndo) onUndo(); });
    host.appendChild(msg); host.appendChild(btn);
    host.style.display = 'flex';
  }
  function hideUndoToast(id) {
    if (typeof ROOT.document === 'undefined') return;
    var host = ROOT.document.getElementById('hmix-undo-toast');
    if (host && (!id || host.dataset.trackId === id)) host.style.display = 'none';
  }

  /* =================================================================
   * 後方互換ミラー：フラットへの外部書き込み／他タブ更新を v2 へ和解
   * ================================================================= */
  function installMirrorWatch() {
    var s = LS(); if (!s) return;
    // setItem ラップ（同一タブ内の未改修消費者の直接書き込みを検知）
    try {
      var proto = (s.constructor && s.constructor.prototype) ? s.constructor.prototype : s;
      var orig = proto.setItem;
      if (orig && !orig.__hmixWrapped) {
        proto.setItem = function (k, v) {
          orig.apply(this, arguments);
          if (k === KEY_FLAT && !_writingMirror) {
            try { reconcileFromFlat(FavStore.state(), true); } catch (e) {}
          }
        };
        proto.setItem.__hmixWrapped = true;
      }
    } catch (e) {}
    // 他タブ更新
    if (typeof ROOT.addEventListener === 'function') {
      ROOT.addEventListener('storage', function (ev) {
        if (ev && ev.key === KEY_FLAT && !_writingMirror) {
          try { reconcileFromFlat(FavStore.state(), true); } catch (e) {}
        }
      });
    }
  }

  /* =================================================================
   * 起動
   * ================================================================= */
  ROOT.HMIX_FAV = FavStore;
  FavStore._reload();
  installMirrorWatch();

  if (typeof module !== 'undefined' && module.exports) module.exports = FavStore;
})();
