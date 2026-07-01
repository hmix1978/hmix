/**
 * H/MIX GALLERY — build-track-pages.js
 * tracks.js → /music/{id}.html の <body> 主要領域を静的に焼き込む。
 * Googlebot の初回スナップショットに曲名・本文・タグ・DLリンクを見せるのが目的。
 *
 * 使い方:
 *   node scripts/build-track-pages.js                # 全303曲ビルド
 *   node scripts/build-track-pages.js --only n1,n2   # 指定ID のみ（dry-run）
 *   node scripts/build-track-pages.js --counts-only  # 件数プレースホルダ置換のみ
 *   node scripts/build-track-pages.js --no-counts    # 件数置換をスキップ
 *   node scripts/build-track-pages.js --no-backup    # 自動バックアップをスキップ
 *
 * 副作用:
 *   - 走る前に scripts/backup-music.js を実行し music/*.html をスナップショット退避。
 *   - P6: index.html / genre/*.html / music-library.html / terms.html / composer.html の
 *         `{{COUNT:xxx}}` プレースホルダを置換する。
 */
const fs = require('fs');
const path = require('path');
const { loadTracksData } = require('./lib/load-tracks');
const { countTracks, applyCountPlaceholders } = require('./lib/count-tracks');
const { getPrimaryTag, sceneWebp } = require('./inject-seo');
const backupMusic = require('./backup-music');

const ROOT        = path.resolve(__dirname, '..');
const MUSIC_DIR   = path.join(ROOT, 'music');
const SCENES_DIR  = path.join(ROOT, 'assets/images/scenes');
const SITE        = 'https://www.hmix.net';

// 再生成時のリグレッション防止用: 本番に注入済みのアセット ?v= 値。
// 共有JS/CSSをバンプしたらここも更新する。
// 更新日: 2026-07-01 (Mac Claude, audit week2)
const FAV_VERSIONS = Object.freeze({
  favModalCss:       '20260629c',
  favNotebookCss:    '20260630lic',
  favNotebookIceCss: '20260630frost',   // 2026-06-30 追加テーマ
  favStoreJs:        '20260630t',
  favSyncJs:         '20260630w',       // 2026-06-30 cloud sync 追加
  favNotebookJs:     '20260701',
  favModalJs:        '20260630g',
});

// ── CLI 引数パース ──
function parseArgs(argv) {
  const out = { only: null, countsOnly: false, noCounts: false, noBackup: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--only=')) {
      out.only = a.substring('--only='.length).split(',').map(s => s.trim()).filter(Boolean);
    } else if (a === '--only') {
      // 別トークンで渡された場合は次のargvで拾う（簡易実装のためここはエラー扱い）
      console.warn('[build-track-pages] --only は --only=n1,n2 形式で指定してください');
    } else if (a === '--counts-only') out.countsOnly = true;
    else if (a === '--no-counts') out.noCounts = true;
    else if (a === '--no-backup') out.noBackup = true;
    else if (a.startsWith('--only ')) {
      out.only = a.substring('--only '.length).split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return out;
}
// --only n1,n2（スペース区切り）もサポート
function normalizeArgs(argv) {
  const out = { only: null, countsOnly: false, noCounts: false, noBackup: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only' && argv[i + 1]) {
      out.only = argv[i + 1].split(',').map(s => s.trim()).filter(Boolean);
      i++;
    } else if (a.startsWith('--only=')) {
      out.only = a.substring('--only='.length).split(',').map(s => s.trim()).filter(Boolean);
    }
    else if (a === '--counts-only') out.countsOnly = true;
    else if (a === '--no-counts')   out.noCounts = true;
    else if (a === '--no-backup')   out.noBackup = true;
  }
  return out;
}

// ── HTML エスケープ ──
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 改行を保持してHTMLへ出力（description の多行テキスト用）
// 前後の空白は除去。内部の連続改行は単一の <br> に圧縮。
function multiline(s) {
  const trimmed = String(s || '').replace(/^\s+|\s+$/g, '');
  return esc(trimmed).replace(/\n+/g, '<br>');
}

// ── scene 画像パス（music/配下の相対パス）──
function sceneRelative(track) {
  const primary = getPrimaryTag(track);
  const name = (primary && fs.existsSync(path.join(SCENES_DIR, `${primary}.webp`))) ? `${primary}.webp` : 'dark.webp';
  return `../assets/images/scenes/${name}`;
}

// ── タグID → 日本語ラベル（tagNames から）。未登録はIDをそのまま返す ──
function tagLabel(id, tagNames) {
  return (tagNames && tagNames[id]) || id;
}

// favbox(お気に入りボックス/音楽手帖) 関連の CSS/モーダル/JS を冪等に注入。
// fav-notebook.js を既に読み込んでいるページはスキップ。
function injectFavboxAssets(html) {
  if (/assets\/js\/fav-notebook\.js/.test(html)) return html;

  if (!/assets\/css\/fav-modal\.css/.test(html)) {
    html = html.replace(
      /(<link[^>]*href="\.\.\/assets\/css\/player\.css"[^>]*>)/,
      `$1\n  <link rel="stylesheet" href="../assets/css/fav-modal.css?v=${FAV_VERSIONS.favModalCss}">`
    );
  }
  if (!/assets\/css\/fav-notebook\.css/.test(html)) {
    html = html.replace(
      /(<\/head>)/,
      `  <link rel="stylesheet" href="../assets/css/fav-notebook.css?v=${FAV_VERSIONS.favNotebookCss}">\n$1`
    );
  }
  if (!/assets\/css\/fav-notebook-ice\.css/.test(html)) {
    html = html.replace(
      /(<\/head>)/,
      `  <link rel="stylesheet" href="../assets/css/fav-notebook-ice.css?v=${FAV_VERSIONS.favNotebookIceCss}">\n$1`
    );
  }

  if (!/id="fav-modal"/.test(html)) {
    const modalBlock =
`  <div class="fav-modal" id="fav-modal" aria-hidden="true" hidden>
    <div class="fav-modal__backdrop" data-fav-modal-close></div>
    <div class="fav-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="fav-modal-heading">
      <div class="fav-modal__header">
        <div>
          <p class="fav-modal__eyebrow">My Library</p>
          <h2 id="fav-modal-heading">保存した楽曲 <span id="fav-modal-count">0</span></h2>
        </div>
        <button class="fav-modal__close" type="button" aria-label="閉じる" data-fav-modal-close>&times;</button>
      </div>
      <div class="fav-modal__body">
        <p class="fav-modal__empty" id="fav-modal-empty">まだ保存された楽曲がありません。</p>
        <ul class="fav-modal__list" id="fav-modal-list"></ul>
      </div>
      <div class="fav-modal__footer">
        <button type="button" id="fav-modal-play-all">再生</button>
        <button type="button" id="fav-modal-shuffle-all">シャッフル</button>
        <button type="button" id="fav-modal-play-theater">シアター</button>
        <button type="button" id="fav-modal-dl-all">一括DL</button>
        <button type="button" id="fav-modal-clear">全削除</button>
      </div>
    </div>
  </div>

`;
    const langScriptRe = /(\n\s*<script>\s*\n\s*\(function \(\) \{[\s\S]*?HMIX_LANG[\s\S]*?<\/script>)/;
    if (langScriptRe.test(html)) {
      html = html.replace(langScriptRe, `\n${modalBlock}$1`);
    } else {
      html = html.replace(
        /(<script[^>]*src="\.\.\/assets\/js\/tracks\.js"[^>]*><\/script>)/,
        `${modalBlock}  $1`
      );
    }
  }

  const wantScripts = [
    { re: /assets\/js\/fav-store\.js/,    line: `  <script src="../assets/js/fav-store.js?v=${FAV_VERSIONS.favStoreJs}"></script>\n` },
    { re: /assets\/js\/fav-sync\.js/,     line: `  <script src="../assets/js/fav-sync.js?v=${FAV_VERSIONS.favSyncJs}"></script>\n` },
    { re: /assets\/js\/fav-notebook\.js/, line: `<script src="../assets/js/fav-notebook.js?v=${FAV_VERSIONS.favNotebookJs}"></script>\n` },
    { re: /assets\/js\/fav-modal\.js/,    line: `  <script src="../assets/js/fav-modal.js?v=${FAV_VERSIONS.favModalJs}"></script>\n` },
  ];
  const missingScripts = wantScripts.filter(s => !s.re.test(html)).map(s => s.line).join('');
  if (missingScripts) {
    html = html.replace(/(<\/body>)/, `${missingScripts}$1`);
  }

  return html;
}

// ヘッダーの「作曲家」リンクをドロップダウンに置換（冪等）。
function injectComposerDropdown(html) {
  if (/aria-label="作曲家メニュー"/.test(html)) return html;
  const simple = /<li><a href="\/composer\.html" class="nav-link" data-ja="作曲家" data-en="Composer">作曲家<\/a><\/li>/;
  if (!simple.test(html)) return html;
  const dropdown =
    `<li class="nav-item nav-item--dropdown"><a href="/composer.html" class="nav-link" data-ja="作曲家" data-en="Composer">作曲家</a>` +
    `<ul class="nav-submenu" aria-label="作曲家メニュー">` +
    `<li><a href="/composer.html" class="nav-submenu__link" data-ja="作曲家について" data-en="About the Composer">作曲家について</a></li>` +
    `<li><a href="https://www.youtube.com/@hmixbgm" target="_blank" rel="noopener" class="nav-submenu__link" data-ja="YouTube" data-en="YouTube">YouTube</a></li>` +
    `<li><a href="https://x.com/hmix_net" target="_blank" rel="noopener" class="nav-submenu__link" data-ja="X (旧Twitter)" data-en="X (Twitter)">X (旧Twitter)</a></li>` +
    `<li><a href="https://linkco.re/CFhnqas5" target="_blank" rel="noopener" class="nav-submenu__link" data-ja="発売中のCD" data-en="CD on Sale">発売中のCD</a></li>` +
    `</ul></li>`;
  return html.replace(simple, dropdown);
}

// ── 1ファイル分の body 置換 ──
function transformHtml(html, track, tagNames) {
  const id = track.id;
  const idUpper = id.toUpperCase();
  const title = track.title || idUpper;
  const desc  = track.description || '';
  const sceneUrl = sceneRelative(track);
  const mp3 = track.mp3 || `/music/${id[0]}/${id}.mp3`;

  // ── <h1 id="td2-hero-title"> ──
  html = html.replace(
    /(<h1[^>]*id="td2-hero-title"[^>]*>)([\s\S]*?)(<\/h1>)/,
    `$1${esc(title)}$3`
  );

  // ── #td2-hero-id ──
  html = html.replace(
    /(<div[^>]*id="td2-hero-id"[^>]*>)([\s\S]*?)(<\/div>)/,
    `$1${esc(idUpper)}$3`
  );

  // ── #td2-breadcrumb-title ──
  html = html.replace(
    /(<span[^>]*id="td2-breadcrumb-title"[^>]*>)([\s\S]*?)(<\/span>)/,
    `$1${esc(title)}$3`
  );

  // ── #td2-hero-desc ──
  // 既に内側に <br> 等があっても丸ごと置換
  html = html.replace(
    /(<p[^>]*id="td2-hero-desc"[^>]*>)([\s\S]*?)(<\/p>)/,
    `$1${multiline(desc)}$3`
  );

  // ── .td2-hero__image の style 属性に背景画像を焼き込む ──
  // 元HTMLは <div class="td2-hero__image" aria-hidden="true"></div>
  const heroBgRe = /(<div[^>]*class="td2-hero__image"[^>]*?)(\s+style="[^"]*")?(\s*(?:aria-hidden="[^"]*")?\s*>)/;
  if (heroBgRe.test(html)) {
    html = html.replace(heroBgRe, (m, pre, _style, post) => {
      return `${pre} style="background-image:url('${esc(sceneUrl)}')"${post}`;
    });
  }

  // ── タグリスト（4カテゴリ） ──
  ['feeling', 'style', 'scene', 'story'].forEach(cat => {
    const tags = Array.isArray(track[cat]) ? track[cat] : [];
    const groupRe = new RegExp(
      `(<div[^>]*class="td2-tag-group"[^>]*data-cat="${cat}"[^>]*>)([\\s\\S]*?)(<\\/div>\\s*(?=<div[^>]*class="td2-tag-group"|<\\/section>))`,
      'i'
    );
    // より単純なアプローチ: data-cat="{cat}" グループ内の .td2-tag-group__list の内側だけを差し替え
    const listInnerRe = new RegExp(
      `(<div[^>]*class="td2-tag-group"[^>]*data-cat="${cat}"[^>]*>[\\s\\S]*?<div[^>]*class="td2-tag-group__list"[^>]*>)([\\s\\S]*?)(<\\/div>)`,
      'i'
    );

    if (tags.length === 0) {
      // タグ無し → グループ全体を hidden
      html = html.replace(
        new RegExp(`(<div[^>]*class="td2-tag-group")([^>]*data-cat="${cat}"[^>]*)(>)`, 'i'),
        (m, pre, mid, post) => {
          if (/\bhidden\b/.test(mid)) return m;
          return `${pre}${mid} hidden${post}`;
        }
      );
      // リスト内を空化
      html = html.replace(listInnerRe, `$1$3`);
      return;
    }

    const items = tags.map(t => {
      const label = tagLabel(t, tagNames);
      return `<a class="td2-tag td2-tag--${esc(cat)}" href="../music-library.html?${esc(cat)}=${esc(t)}" data-tag="${esc(t)}">${esc(label)}</a>`;
    }).join('');

    html = html.replace(listInnerRe, `$1${items}$3`);
  });

  // ── #td2-download-btn の href / download 属性 ──
  html = html.replace(
    /(<a[^>]*id="td2-download-btn"[^>]*?)(\s+href="[^"]*")?([^>]*>)/,
    (m, pre, _oldHref, post) => {
      // download 属性が無ければ追加
      let body = `${pre} href="${esc(mp3)}"${post}`;
      if (!/\bdownload=/i.test(body)) {
        body = body.replace(/>$/, ` download="${esc(id)}.mp3">`);
      } else {
        body = body.replace(/\bdownload="[^"]*"/, `download="${esc(id)}.mp3"`);
      }
      return body;
    }
  );

  // ── #credit-text 初期値（曲名あり・日本語） ──
  const creditText = `BGM：${title} / H/MIX GALLERY（秋山裕和）\nhttps://www.hmix.net`;
  html = html.replace(
    /(<code[^>]*id="credit-text"[^>]*>)([\s\S]*?)(<\/code>)/,
    `$1${esc(creditText)}$3`
  );

  // ── #hero-play-btn に data-track-id を付与（既存JSのフック補助） ──
  html = html.replace(
    /(<button[^>]*id="hero-play-btn"[^>]*?)(\s+data-track-id="[^"]*")?([^>]*>)/,
    (m, pre, _old, post) => `${pre} data-track-id="${esc(id)}"${post}`
  );

  // ── コンバージョン導線: ヒーローに「この曲を商用利用する」CTAを追加（お気に入りの隣・冪等） ──
  // 5AI評価の最優先=「気に入った曲→ライセンス購入」への目立つ導線。曲IDを引き継いで既存Stripe導線へ。
  if (!/td2-hero__license/.test(html)) {
    const heroCta =
      `\n            <a class="td2-hero__license editorial-fav-cta" href="/license-request.html#tracks=${esc(id)}" data-license-cta="${esc(id)}">` +
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>` +
      `<span class="editorial-fav-label">この曲を商用利用する</span></a>`;
    if (/class="hero-actions"/.test(html)) {
      // n系デザイン（.hero-actions 内・お気に入りの隣）
      html = html.replace(
        /(<div[^>]*class="hero-actions"[^>]*>[\s\S]*?<\/button>)(\s*<\/div>)/,
        (m, pre, post) => `${pre}${heroCta}${post}`
      );
    } else if (/class="td2-hero__actions/.test(html)) {
      // z系デザイン（td2-hero__actions 内・#hero-fav-btn の直後・td2スタイル流用）
      const heroCtaZ =
        `\n          <a class="td2-hero__license td2-hero__fav" href="/license-request.html#tracks=${esc(id)}" data-license-cta="${esc(id)}" aria-label="この曲を商用利用する">` +
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>` +
        `<span>この曲を商用利用する</span></a>`;
      html = html.replace(
        /(<button[^>]*id="hero-fav-btn"[^>]*>[\s\S]*?<\/button>)/,
        (m, favBtn) => `${favBtn}${heroCtaZ}`
      );
    }
  }

  // ── コンバージョン導線: 商用セクションのフッタに購入CTAを追加（規約ボタンの前・冪等） ──
  if (!/td2-comm-cta/.test(html)) {
    const commCta =
      `<a class="td2-comm-cta dl-btn" style="text-decoration:none;width:auto" href="/license-request.html#tracks=${esc(id)}">` +
      `<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>` +
      `この曲を商用利用する（¥2,200〜）-></a>\n          `;
    if (/class="comm-foot/.test(html)) {
      // n系デザイン（.comm-foot の規約ボタンの前）
      html = html.replace(
        /(<div[^>]*class="comm-foot[^"]*"[^>]*>\s*)(<a[^>]*class="ghost-btn")/,
        (m, pre, post) => `${pre}${commCta}${post}`
      );
    } else if (/td2-license__commercial/.test(html)) {
      // z系デザイン（.td2-license__commercial の「ご利用規約を確認」ボタンの前・td2スタイル流用）
      const commCtaZ =
        `<a class="td2-license-btn td2-comm-cta" href="/license-request.html#tracks=${esc(id)}">` +
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>` +
        `この曲を商用利用する（¥2,200〜）-></a>\n          `;
      html = html.replace(
        /(<a[^>]*class="td2-license-btn"[^>]*href="[^"]*terms[^"]*")/,
        (m) => `${commCtaZ}${m}`
      );
    }
  }

  html = injectFavboxAssets(html);
  html = injectComposerDropdown(html);

  return html;
}

// ── 件数プレースホルダ置換対象ファイル一覧（13箇所） ──
const COUNT_TARGETS = [
  'index.html',
  'music-library.html',
  'terms.html',
  'composer.html',
  'genre/battle.html',
  'genre/celtic.html',
  'genre/electronic.html',
  'genre/epic.html',
  'genre/fantasy.html',
  'genre/happy.html',
  'genre/healing.html',
  'genre/horror.html',
  'genre/japanese.html',
  'genre/sad.html',
  'genre/suspense.html',
];

function applyCounts(counts) {
  let touched = 0;
  let totalReplaced = 0;
  const unresolvedAll = [];
  for (const rel of COUNT_TARGETS) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const orig = fs.readFileSync(p, 'utf8');
    const { html, replaced, unresolved } = applyCountPlaceholders(orig, counts);
    if (replaced > 0) {
      fs.writeFileSync(p, html, 'utf8');
      touched++;
      totalReplaced += replaced;
      console.log(`[counts] ${rel}: ${replaced} placeholders replaced`);
    }
    if (unresolved.length) {
      unresolvedAll.push({ file: rel, specs: [...new Set(unresolved)] });
    }
  }
  console.log(`[counts] touched ${touched} files, ${totalReplaced} total replacements`);
  if (unresolvedAll.length) {
    console.warn('[counts] unresolved placeholders:', JSON.stringify(unresolvedAll, null, 2));
  }
}

function main() {
  const args = normalizeArgs(process.argv);
  const { tracks, tagNames } = loadTracksData();
  const counts = countTracks(tracks);

  // ── 件数プレースホルダのみを実行（ページ生成抜き） ──
  if (args.countsOnly) {
    applyCounts(counts);
    return;
  }

  // ── バックアップ ──
  if (!args.noBackup) {
    try { backupMusic(); }
    catch (e) { console.warn('[backup] failed:', e.message); }
  }

  const target = args.only && args.only.length
    ? tracks.filter(t => args.only.includes(t.id))
    : tracks;

  if (args.only && target.length !== args.only.length) {
    const found = new Set(target.map(t => t.id));
    const missing = args.only.filter(id => !found.has(id));
    if (missing.length) console.warn('[build] missing IDs:', missing.join(','));
  }

  let updated = 0, skipped = 0, errors = 0;
  for (const t of target) {
    if (!t.title) {
      console.error(`[build] ERROR: title missing for id=${t.id} — 即時中断対象`);
      errors++;
      continue;
    }
    const htmlPath = path.join(MUSIC_DIR, `${t.id}.html`);
    if (!fs.existsSync(htmlPath)) {
      skipped++;
      continue;
    }
    try {
      const orig = fs.readFileSync(htmlPath, 'utf8');
      const out = transformHtml(orig, t, tagNames);
      if (out !== orig) {
        fs.writeFileSync(htmlPath, out, 'utf8');
        updated++;
      } else {
        skipped++;
      }
    } catch (e) {
      console.error(`[build] ${t.id}: ${e.message}`);
      errors++;
    }
  }

  console.log(`[build-track-pages] 対象=${target.length} 更新=${updated} スキップ=${skipped} エラー=${errors}`);

  // ── 件数プレースホルダ置換（ビルドと同時にデフォルトで実行） ──
  if (!args.noCounts && !args.only) {
    applyCounts(counts);
  } else if (args.only) {
    console.log('[counts] --only 指定時は件数置換を省略（全体ビルド時のみ実行）');
  }
}

if (require.main === module) main();

module.exports = { transformHtml, applyCounts };
