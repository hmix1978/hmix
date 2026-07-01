#!/usr/bin/env node
/**
 * H/MIX GALLERY — GA4 fetch (Phase 2 site-audit)
 *
 * 目的: 直近7日の主要 GA4 指標を取得して JSON 出力。
 * 使い方: node scripts/ga4-fetch.js
 * 前提: site-audit-phase2-setup.md の Step 1-5 完了済み
 *   - .private/.env.ga4 に GA4_PROPERTY_ID
 *   - gcloud auth application-default login 完了
 *   - Analytics Data API enable 済み
 *   - @google-analytics/data パッケージ利用可
 *
 * 出力: /tmp/ga4-summary.json（audit セッションが読む）
 */
const fs = require('fs');
const path = require('path');

// ── env ──
const envPath = path.join(__dirname, '..', '.private', '.env.ga4');
if (!fs.existsSync(envPath)) {
  console.error('❌ ' + envPath + ' がありません');
  console.error('  → site-audit-phase2-setup.md Step 5 を実施してください');
  process.exit(1);
}
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
);
const PROPERTY_ID = env.GA4_PROPERTY_ID;
if (!PROPERTY_ID) { console.error('❌ GA4_PROPERTY_ID 未設定'); process.exit(1); }

// ── GA4 Data API ──
let BetaAnalyticsDataClient;
try {
  ({ BetaAnalyticsDataClient } = require('@google-analytics/data'));
} catch (e) {
  console.error('❌ @google-analytics/data パッケージ未インストール');
  console.error('  → npm install --no-save @google-analytics/data');
  process.exit(1);
}
const client = new BetaAnalyticsDataClient();
const property = `properties/${PROPERTY_ID}`;

const DATE_RANGE = { startDate: '7daysAgo', endDate: 'today' };

async function runReport(dimensions, metrics, limit = 50) {
  const [resp] = await client.runReport({
    property,
    dateRanges: [DATE_RANGE],
    dimensions: dimensions.map(name => ({ name })),
    metrics:    metrics.map(name => ({ name })),
    limit,
  });
  return (resp.rows || []).map(r => ({
    dims: r.dimensionValues.map(v => v.value),
    metrics: r.metricValues.map(v => v.value),
  }));
}

async function main() {
  const out = {
    fetchedAt: new Date().toISOString(),
    propertyId: PROPERTY_ID,
    dateRange: DATE_RANGE,
    reports: {},
  };

  // A. 全体サマリ
  out.reports.summary = await runReport(
    [],
    ['activeUsers', 'newUsers', 'screenPageViews', 'engagedSessions', 'averageSessionDuration'],
    1
  );

  // B. ページ別ユーザー数
  out.reports.topPages = await runReport(
    ['pagePath'],
    ['activeUsers', 'screenPageViews', 'averageSessionDuration'],
    20
  );

  // C. デバイス比率
  out.reports.byDevice = await runReport(
    ['deviceCategory'],
    ['activeUsers'],
    5
  );

  // D. 参照元
  out.reports.trafficSource = await runReport(
    ['sessionSource', 'sessionMedium'],
    ['sessions', 'activeUsers'],
    15
  );

  // E. イベント発火数（Codex GA4 instrumentation で仕込んだもの）
  out.reports.events = await runReport(
    ['eventName'],
    ['eventCount', 'totalUsers'],
    30
  );

  // F. コンバージョン: begin_checkout / purchase
  out.reports.funnel = {
    beginCheckout: (await runReport([], ['eventCount'], 1, { eventName: 'begin_checkout' }))[0]?.metrics?.[0] || '0',
    purchase:      (await runReport([], ['eventCount'], 1, { eventName: 'purchase' }))[0]?.metrics?.[0] || '0',
    // 注: フィルタ実装は SDK 側の filterExpression が必要（TODO: 実装確認後追加）
  };

  fs.writeFileSync('/tmp/ga4-summary.json', JSON.stringify(out, null, 2));
  console.log('✓ /tmp/ga4-summary.json 出力完了');
  console.log('  ユーザー数(7日):', out.reports.summary[0]?.metrics?.[0] || 'N/A');
  console.log('  イベント種類:', out.reports.events.length);
}

main().catch(e => {
  console.error('❌ GA4 fetch 失敗:', e.message);
  if (e.code === 7) console.error('  → property ID 誤りまたは権限不足');
  if (e.code === 16) console.error('  → gcloud auth application-default login 必要');
  process.exit(1);
});
