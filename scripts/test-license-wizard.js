/* 音楽手帖 申請ウィザード end-to-end テスト（jsdom）
 *   実行: cd hmix && npm i -D jsdom && node scripts/test-license-wizard.js
 *   検証: 曲選択 → ライセンス(価格連動) → お客様情報 → 確認 → 決済fetch本文 → purchaseData
 *   対象: assets/js/license-checkout.js（window.HMIX_LICENSE）+ assets/js/fav-notebook.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HMIX = path.resolve(__dirname, '..');
const licSrc = fs.readFileSync(path.join(HMIX, 'assets/js/license-checkout.js'), 'utf8');
const nbSrc  = fs.readFileSync(path.join(HMIX, 'assets/js/fav-notebook.js'), 'utf8');

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ FAIL: ' + m); } }
function eq(a, b, m) { ok(a === b, m + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }

const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
const w = dom.window;

w.HMIX_LANG = 'ja';
w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
function memStore() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; }
Object.defineProperty(w, 'sessionStorage', { value: memStore(), configurable: true });
Object.defineProperty(w, 'localStorage', { value: memStore(), configurable: true });

let lastFetch = null;
w.fetch = (url, opts) => { lastFetch = { url, body: JSON.parse(opts.body) }; return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/test' })) }); };

w.TRACKS = [
  { id: 't1', title: '夜明けの森', duration: '2:30', mp3: 't1.mp3' },
  { id: 't2', title: '戦いの予感', duration: '1:50', mp3: 't2.mp3' },
  { id: 't3', title: '静寂の祈り', duration: '3:10', mp3: 't3.mp3' },
  { id: 't4', title: '勝利の凱旋', duration: '2:05', mp3: 't4.mp3' },
  { id: 't5', title: '黄昏の街', duration: '2:40', mp3: 't5.mp3' }
];
w.TAGS_META = {};
const favIds = ['t1', 't2', 't3', 't4', 't5'];
const trackState = {};
w.HMIX_FAV = {
  collections: () => [{ id: 'proj1', name: '案件A', status: 'draft' }],
  attachCertificate: () => true,
  uniqueCount: () => favIds.length, collectionCount: () => favIds.length,
  getView: () => favIds.map(id => ({ trackId: id })),
  state: () => ({ tracks: trackState }), setTrackMemo: (id, v) => { trackState[id] = { favMemo: v }; },
  removeWithUndo: () => {}, copyItems: () => {}, moveItems: () => {}, bulkDelete: () => {}, createCollection: () => 'c2'
};
const add = src => { const s = w.document.createElement('script'); s.textContent = src; w.document.body.appendChild(s); };
const tick = () => new Promise(r => setTimeout(r, 20));

(async () => {
  add(licSrc);
  ok(w.HMIX_LICENSE && typeof w.HMIX_LICENSE.checkout === 'function', 'window.HMIX_LICENSE.checkout 公開');
  eq(w.HMIX_LICENSE.estimate('single', 5), 11000, 'estimate single 5曲=11000');
  eq(w.HMIX_LICENSE.estimate('pack', 5), 7480, 'estimate pack=7480');
  eq(w.HMIX_LICENSE.estimate('professional', 5, 'web_ad'), 27500, 'estimate pro web_ad 5曲=27500');
  add(nbSrc);
  ok(w.HMIX_NOTEBOOK && typeof w.HMIX_NOTEBOOK.open === 'function', 'HMIX_NOTEBOOK.open 公開');

  w.HMIX_NOTEBOOK.open(); await tick();
  const rows = w.document.querySelectorAll('.hnb-row');
  eq(rows.length, 5, '手帖5行表示');
  rows.forEach(r => { const c = r.querySelector('.hnb-check'); c.checked = true; c.dispatchEvent(new w.Event('change', { bubbles: true })); });
  const selCta = w.document.querySelector('#hnb-selected-cta');
  ok(!selCta.disabled, '選択CTA有効');
  selCta.click(); await tick();
  const wiz = w.document.querySelector('.hnb-wizard');
  ok(!!wiz, 'ウィザード生成');

  const trk = wiz.querySelectorAll('.wz-trk');
  eq(trk.length, 5, 'Step1: 5曲候補'); eq([].filter.call(trk, c => c.checked).length, 5, 'Step1: 既定全チェック');
  trk[4].checked = false; trk[4].dispatchEvent(new w.Event('change', { bubbles: true })); await tick();
  wiz.querySelector('#wz-next').click(); await tick();
  ok(/7,480/.test(wiz.querySelector('#wz-total').textContent), 'Step2: 既定pack ¥7,480');
  wiz.querySelector('.wz-card[data-type="single"]').click(); await tick();
  ok(/8,800/.test(wiz.querySelector('#wz-total').textContent), 'single 4曲 ¥8,800');
  wiz.querySelector('.wz-card[data-type="professional"]').click(); await tick();
  ok(wiz.querySelector('#wz-next').disabled, 'pro 用途未選択で次へ不可');
  const us = wiz.querySelector('#wz-usage'); us.value = 'web_ad'; us.dispatchEvent(new w.Event('change', { bubbles: true })); await tick();
  ok(/22,000/.test(wiz.querySelector('#wz-total').textContent), 'pro web_ad 4曲 ¥22,000');
  wiz.querySelector('#wz-next').click(); await tick();
  ok(wiz.querySelector('#wz-next').disabled, 'Step3 未入力で不可');
  wiz.querySelector('#wz-name').value = '株式会社テスト'; wiz.querySelector('#wz-name').dispatchEvent(new w.Event('input', { bubbles: true }));
  wiz.querySelector('#wz-email').value = 'buyer@example.com'; wiz.querySelector('#wz-email').dispatchEvent(new w.Event('input', { bubbles: true })); await tick();
  ok(!wiz.querySelector('#wz-next').disabled, 'Step3 入力後 次へ可');
  wiz.querySelector('#wz-next').click(); await tick();
  ok(/22,000/.test(wiz.querySelector('.wz-sum__total').textContent), 'Step4 合計 ¥22,000');
  wiz.querySelector('#wz-next').click(); await tick(); await tick();
  ok(!!lastFetch, 'fetch 呼出');
  eq(lastFetch.body.licenseType, 'professional', '決済 licenseType');
  eq(lastFetch.body.usage, 'web_ad', '決済 usage');
  eq(lastFetch.body.tracks.length, 4, '決済 tracks=4');
  ok(lastFetch.body.collectionId === undefined, 'collectionId は Stripe 非送信');
  const pd = JSON.parse(w.sessionStorage.getItem('hmix_pending_purchase') || '{}');
  eq(pd.collectionId, 'proj1', 'purchaseData.collectionId 退避 [P1-7]');
  ok(/^HMX-\d{8}-/.test(pd.licenseId || ''), 'purchaseData.licenseId 形式');

  console.log('\n=== wizard: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})();
