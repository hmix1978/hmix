/* =====================================================================
 * test-fav-store.js ── FavStore データ契約の自動検証（Node）
 * 受け入れ基準：§9-1 集約 / §9-2 無損失・冪等移行＋退避 / §9-3 LWW＋tombstone
 *               §4-1 マイグレーション・テストハーネス / export-import roundtrip
 *  実行: node scripts/test-fav-store.js
 * ===================================================================== */
'use strict';
const path = require('path');

/* ---- 最小ブラウザ環境シム ---- */
function makeLS() {
  const m = {};
  const api = {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
    get length() { return Object.keys(m).length; },
    key: (i) => Object.keys(m)[i],
    _dump: () => m
  };
  return api;
}

let FAIL = 0, PASS = 0, events = [];
function assert(cond, msg) { if (cond) { PASS++; } else { FAIL++; console.error('  ✗ ' + msg); } }
function section(t) { console.log('\n' + t); }

/* グローバルを用意してから fav-store.js を新規ロードする関数 */
let CLOCK = 1000;
function freshStore(initialFlat, initialV2) {
  // モジュールキャッシュを捨てて再評価
  delete require.cache[require.resolve(path.join(__dirname, '..', 'assets', 'js', 'fav-store.js'))];
  const ls = makeLS();
  if (initialFlat !== undefined) ls.setItem('hmix_favorites', JSON.stringify(initialFlat));
  if (initialV2 !== undefined) ls.setItem('hmix_favorites_v2', JSON.stringify(initialV2));
  events = [];
  global.HMIX_FAV = undefined;       // 二重ロードガードを毎回リセット（テスト独立性）
  global.window = global;            // ROOT = window = global
  global.localStorage = ls;
  global.document = undefined;       // DOMなし（トーストはスキップ）
  global.CustomEvent = function (type, opts) { this.type = type; this.detail = opts && opts.detail; };
  global.dispatchEvent = (ev) => { if (ev.type === 'favorites:updated') events.push(ev.detail); return true; };
  global.addEventListener = () => {};
  global.setTimeout = (fn) => { return { fn }; };   // 自動発火させない（手動commitで検証）
  global.clearTimeout = () => {};
  const store = require(path.join(__dirname, '..', 'assets', 'js', 'fav-store.js'));
  store._now = () => CLOCK;          // 時刻固定
  return { store, ls };
}

/* ===== 1. 集約：件数の単一導出 ===== */
section('1. 集約 / uniqueCount 単一導出');
{
  const { store } = freshStore(['a', 'b', 'b', 'c']);  // 重複あり
  assert(store.uniqueCount() === 3, 'uniqueCount は重複排除（a,b,c=3） → ' + store.uniqueCount());
  assert(store.has('a') && store.has('c') && !store.has('z'), 'has() が正しい');
  assert(JSON.stringify(store.ids().sort()) === JSON.stringify(['a','b','c']), 'ids() が可視ID集合');
}

/* ===== 2. 無損失・冪等移行＋バックアップ退避 ===== */
section('2. flat→v2 無損失・冪等・退避');
{
  const { store, ls } = freshStore(['x', 'y', 'z']);
  const st = store.state();
  assert(st.schemaVersion === 2, 'schemaVersion=2');
  assert(st.collections[0].id === 'default' && st.collections[0].items.length === 3, '規定章に3曲移行');
  assert(st.collections[0].items.every(it => it.order && it.updatedAt && it.deleted === false), '各itemに order/updatedAt/tombstone初期値');
  // バックアップ退避
  const backupKeys = Object.keys(ls._dump()).filter(k => k.indexOf('hmix_favorites_backup_') === 0);
  assert(backupKeys.length === 1, '旧JSONをタイムスタンプ付きで退避 → ' + backupKeys.length);
  assert(ls.getItem(backupKeys[0]) === JSON.stringify(['x','y','z']), '退避内容が旧フラットと一致');
  // 冪等：v2 を再ロードしても件数不変・二重移行しない
  const v2 = ls.getItem('hmix_favorites_v2');
  const again = freshStore(['x','y','z'], JSON.parse(v2));
  assert(again.store.uniqueCount() === 3, '再ロードで件数不変（冪等） → ' + again.store.uniqueCount());
}

/* ===== 3. tombstone（物理削除しない）＋ LWW 復活 ===== */
section('3. tombstone / LWW');
{
  const { store } = freshStore(['a', 'b']);
  CLOCK = 2000;
  store.remove('a');                       // tombstone
  assert(!store.has('a'), 'remove で可視から消える');
  assert(store.uniqueCount() === 1, '件数1');
  // 物理削除されず deleted=true で残る
  const item = store.state().collections[0].items.find(it => it.trackId === 'a');
  assert(item && item.deleted === true && item.deletedAt === 2000, 'tombstone（deleted/deletedAt保持）');
  // 再追加＝LWW復活（物理レコード使い回し）
  CLOCK = 3000;
  store.add('a');
  assert(store.has('a') && store.uniqueCount() === 2, '再追加で復活');
  const item2 = store.state().collections[0].items.find(it => it.trackId === 'a');
  assert(item2.deleted === false && item2.updatedAt === 3000, '復活時に updatedAt 更新');
}

/* ===== 4. フラット外部書き込みの和解（後方互換） ===== */
section('4. フラットミラー和解（未改修消費者の直接書き込み）');
{
  const { store, ls } = freshStore(['a', 'b']);
  CLOCK = 4000;
  // 未改修消費者が直接フラットに 'c' 追加・'a' 削除したと仮定
  ls.setItem('hmix_favorites', JSON.stringify(['b', 'c']));
  store._internal.reconcileFromFlat(store.state(), true);
  assert(store.has('c') && !store.has('a') && store.has('b'), '外部追加c反映・外部削除a反映');
  assert(store.uniqueCount() === 2, '和解後件数2 → ' + store.uniqueCount());
  const a = store.state().collections[0].items.find(it => it.trackId === 'a');
  assert(a.deleted === true, '外部削除は tombstone 化');
}

/* ===== 5. Undo（pendingRemovals がミラーから除外され、commitで確定） ===== */
section('5. Undo / pendingRemovals');
{
  const { store } = freshStore(['a', 'b', 'c']);
  store.removeWithUndo('b');               // 保留（タイマー自動発火しないシム）
  assert(!store.has('b'), '保留中はミラーから消える');
  assert(store.uniqueCount() === 2, '保留中の件数2');
  // tombstone はまだ付かない（commit前）
  const bItem = store.state().collections[0].items.find(it => it.trackId === 'b');
  assert(bItem.deleted === false, 'commit前は tombstone 化しない');
  // Undo で復活
  store.undoRemove('b');
  assert(store.has('b') && store.uniqueCount() === 3, 'Undoで復活');
  // 改めて removeWithUndo → 手動commit
  store.removeWithUndo('b');
  store._commitRemoval('b');
  assert(!store.has('b'), 'commit後は消える');
  assert(store.state().collections[0].items.find(it => it.trackId === 'b').deleted === true, 'commitで tombstone 化');
}

/* ===== 6. 原子的バッチ（move / copy / bulkDelete） ===== */
section('6. moveItems / copyItems / bulkDelete');
{
  const { store } = freshStore(['a', 'b', 'c']);
  const cid = store.createCollection('ボス戦');
  store.moveItems(['a'], cid);
  assert(store.collectionCount('default') === 2 && store.collectionCount(cid) === 1, 'move: default2/章1');
  assert(store.uniqueCount() === 3, 'move後も総ユニーク3（重複でない） → ' + store.uniqueCount());
  store.copyItems(['b'], cid);
  assert(store.collectionCount(cid) === 2, 'copy: 章2');
  assert(store.uniqueCount() === 3, 'copy後も総ユニーク3（延べ≠ユニーク）');
  store.bulkDelete(['c']);
  assert(!store.has('c') && store.uniqueCount() === 2, 'bulkDelete反映');
}

/* ===== 7. LexoRank：間に挿入可能 ===== */
section('7. LexoRank rankBetween');
{
  const { store } = freshStore([]);
  const rb = store._internal.rankBetween;
  const r1 = rb('', '');           // 最初
  const r2 = rb(r1, '');           // 後ろ
  const mid = rb(r1, r2);          // 間
  assert(r1 < r2, 'append が後方に並ぶ');
  assert(r1 < mid && mid < r2, '間に挿入できる文字列を生成 → ' + r1 + ' < ' + mid + ' < ' + r2);
}

/* ===== 8. export → import ラウンドトリップ ===== */
section('8. export/import roundtrip');
{
  const { store } = freshStore(['a', 'b']);
  store.createCollection('町・平和');
  store.setNote('a', 'default', 'オープニング候補');
  const dump = store.export();
  // 別ストアへインポート
  const fresh2 = freshStore([]);
  assert(fresh2.store.import(dump), 'import 成功');
  assert(fresh2.store.uniqueCount() === 2, 'import後の件数一致');
  assert(JSON.stringify(JSON.parse(fresh2.store.export())) === JSON.stringify(JSON.parse(dump)), 'export→import→export が一致（ラウンドトリップ無損失）');
}

/* ===== 9. favorites:updated 発火（count, ids 互換） ===== */
section('9. favorites:updated イベント契約');
{
  const { store } = freshStore(['a']);
  events = [];
  store.add('b');
  const last = events[events.length - 1];
  assert(last && last.count === 2 && Array.isArray(last.ids) && last.ids.indexOf('b') !== -1, 'detail:{count,ids} 互換 → ' + JSON.stringify(last));
}

/* ===== 結果 ===== */
console.log('\n────────────────────────────');
console.log(`PASS ${PASS} / FAIL ${FAIL}`);
process.exit(FAIL ? 1 : 0);
