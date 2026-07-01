/* P1-7 オートバインド単体テスト：license-success.html の bindCertToNotebook を抽出して検証。
 *   実行: node scripts/test-license-bind.js   (jsdom 不要)
 */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'license-success.html'), 'utf8');
const m = html.match(/function bindCertToNotebook\(data\)\s*\{[\s\S]*?\n  \}/);
if (!m) { console.log('✗ bindCertToNotebook 抽出失敗（関数名/整形が変わった可能性）'); process.exit(1); }

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } };
let calls = [];
const mkWin = fav => ({ HMIX_FAV: fav });
const fav = { attachCertificate: (certId, cid) => { calls.push({ certId, cid }); return true; } };
const fn = new Function('window', m[0] + '; return bindCertToNotebook;')(mkWin(fav));

calls = []; fn({ licenseId: 'HMX-1', collectionId: 'proj1' });
ok(calls.length === 1 && calls[0].certId === 'HMX-1' && calls[0].cid === 'proj1', '通常章→attachCertificate(certId,cid)');
calls = []; fn({ licenseId: 'HMX-2', collectionId: 'default' });
ok(calls.length === 0, '未分類(default)→スキップ');
calls = []; fn({ licenseId: 'HMX-3' });
ok(calls.length === 0, 'collectionId無し→スキップ');
calls = []; fn(null);
ok(calls.length === 0, 'data無し→スキップ');
let threw = false; try { new Function('window', m[0] + '; return bindCertToNotebook;')({})({ licenseId: 'X', collectionId: 'p' }); } catch (e) { threw = true; }
ok(!threw, 'FavStore未読込でも非クラッシュ');

console.log('\n=== bind: ' + pass + ' passed, ' + fail + ' failed ===');
process.exit(fail ? 1 : 0);
