/* 音楽手帖アセットの注入＋キャッシュバスター一括更新（Mac/Win両対応・相対パス）
 *
 * 役割:
 *   1) license-checkout.js を fav-notebook.js の <script> 直前に注入（未注入ページのみ・同じ接頭辞を維持）
 *   2) 指定アセットの ?v= を新バージョンへバンプ
 *
 * 使い方（hmix リポジトリ直下で実行）:
 *   node scripts/bump-fav-assets.js <version> [asset1 asset2 ...] [--apply]
 *   例) node scripts/bump-fav-assets.js 20260702 fav-notebook.js license-checkout.js --apply
 *   asset 省略時は既定セット（license-checkout.js fav-notebook.js fav-notebook.css）をバンプ。
 *   --apply 無しは dry-run。
 *
 * 対象: backups/node_modules/.git を除く全 *.html のうち fav-notebook.js を参照するページ。
 * 注意: HTML はリポジトリと本番(FTP)が乖離しがち。実行後は必ず本番へ再アップして md5 一致を確認すること。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const rest = args.filter(a => a !== '--apply');
const VER = rest[0];
if (!VER) { console.error('usage: node scripts/bump-fav-assets.js <version> [assets...] [--apply]'); process.exit(1); }
const ASSETS = rest.slice(1).length ? rest.slice(1) : ['license-checkout.js', 'fav-notebook.js', 'fav-notebook.css'];
const reFavNb = /<script src="((?:\.\.\/|\/)?assets\/js\/)fav-notebook\.js\?v=[^"]*"><\/script>/;

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    let st; try { st = fs.statSync(fp); } catch (e) { continue; }
    if (st.isDirectory()) { if (/(^|[\\/])(backups|node_modules|\.git)$/i.test(fp)) continue; walk(fp, acc); }
    else if (/\.html?$/i.test(name)) acc.push(fp);
  }
  return acc;
}

let injected = 0, changed = 0;
for (const fp of walk(ROOT, [])) {
  let html; try { html = fs.readFileSync(fp, 'utf8'); } catch (e) { continue; }
  if (!reFavNb.test(html)) continue;
  const before = html;

  // 1) license-checkout.js 注入（対象アセットに含まれ、かつ未注入なら）
  if (ASSETS.indexOf('license-checkout.js') !== -1 && html.indexOf('license-checkout.js') === -1) {
    const m = html.match(reFavNb); const prefix = m[1], line = m[0];
    const idx = html.indexOf(line);
    const indent = html.slice(html.lastIndexOf('\n', idx) + 1, idx);
    html = html.slice(0, idx) + '<script src="' + prefix + 'license-checkout.js?v=' + VER + '"></script>\n' + indent + line + html.slice(idx + line.length);
    injected++;
  }
  // 2) ?v バンプ
  for (const a of ASSETS) {
    const ext = a.endsWith('.css') ? 'css' : 'js';
    const re = new RegExp(a.replace('.', '\\.') + '\\?v=[^"\'\\s]*', 'g');
    html = html.replace(re, a + '?v=' + VER);
  }
  if (html !== before) { changed++; if (APPLY) fs.writeFileSync(fp, html, 'utf8'); }
}
console.log((APPLY ? 'APPLIED' : 'DRY-RUN') + ' ver=' + VER + ' assets=[' + ASSETS.join(',') + ']');
console.log('injected license-checkout:', injected, '| html changed:', changed);
