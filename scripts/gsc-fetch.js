#!/usr/bin/env node
/**
 * H/MIX GALLERY — Search Console fetch (Phase 2 site-audit)
 *
 * 目的: 直近28日の検索クエリ・ページ・CTR・平均掲載順位を取得。
 * 使い方: node scripts/gsc-fetch.js
 * 前提: site-audit-phase2-setup.md の Step 1-5 完了
 *   - .private/.env.ga4 に GSC_SITE_URL
 *   - Search Console API enable 済み
 *   - Hiro アカウントに GSC 所有権
 *
 * 出力: /tmp/gsc-summary.json
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.private', '.env.ga4');
if (!fs.existsSync(envPath)) {
  console.error('❌ ' + envPath + ' が必要');
  process.exit(1);
}
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
);
const SITE_URL = env.GSC_SITE_URL || 'https://www.hmix.net/';

let google;
try { ({ google } = require('googleapis')); }
catch (e) {
  console.error('❌ googleapis パッケージ未インストール');
  console.error('  → npm install --no-save googleapis');
  process.exit(1);
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const webmasters = google.webmasters({ version: 'v3', auth });

  const end = new Date();
  const start = new Date(end.getTime() - 28 * 86400000);
  const fmt = d => d.toISOString().slice(0, 10);
  const dateRange = { startDate: fmt(start), endDate: fmt(end) };

  const out = {
    fetchedAt: new Date().toISOString(),
    siteUrl: SITE_URL,
    dateRange,
    reports: {},
  };

  async function query(dimensions, rowLimit = 50) {
    const res = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: { ...dateRange, dimensions, rowLimit },
    });
    return (res.data.rows || []).map(r => ({
      keys: r.keys,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: (r.ctr * 100).toFixed(2),
      position: r.position.toFixed(1),
    }));
  }

  out.reports.topQueries    = await query(['query'], 50);
  out.reports.topPages      = await query(['page'], 30);
  out.reports.byDevice      = await query(['device']);
  out.reports.byCountry     = await query(['country'], 10);
  out.reports.byQueryPage   = await query(['query', 'page'], 30);

  fs.writeFileSync('/tmp/gsc-summary.json', JSON.stringify(out, null, 2));
  console.log('✓ /tmp/gsc-summary.json 出力完了');
  console.log('  top query:', out.reports.topQueries[0]?.keys?.[0], out.reports.topQueries[0]?.clicks, 'clicks');
  console.log('  クエリ数:', out.reports.topQueries.length);
}

main().catch(e => {
  console.error('❌ GSC fetch 失敗:', e.message);
  if (e.code === 403) console.error('  → GSC で該当プロパティの権限確認');
  if (e.code === 401) console.error('  → gcloud auth application-default login 必要');
  process.exit(1);
});
