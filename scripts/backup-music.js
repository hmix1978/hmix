/**
 * H/MIX GALLERY — backup-music.js
 * music/*.html を丸ごとタイムスタンプ付きフォルダに退避する。
 * 直近5世代（HTMLスナップショット）を保持し、それ以前は削除。
 *
 * 使い方:
 *   node scripts/backup-music.js              # CLI
 *   require('./backup-music')()               # ライブラリとして呼び出し
 *
 * 方針:
 *   - archiver 依存を避け Node 標準APIのみ使用（fs.cpSync）
 *   - music/ 配下の *.html のみを対象（mp3 は巨大かつ変更しないため除外）
 *   - 退避先: backups/music-{ISO日時}/
 */
const fs = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const MUSIC_DIR = path.join(ROOT, 'music');
const BACKUP_ROOT = path.join(ROOT, 'backups');
const RETAIN = 5;

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyHtmlFiles(srcDir, dstDir) {
  ensureDir(dstDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  let count = 0;
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.endsWith('.html')) continue;
    const src = path.join(srcDir, e.name);
    const dst = path.join(dstDir, e.name);
    fs.copyFileSync(src, dst);
    count++;
  }
  return count;
}

function listBackups() {
  if (!fs.existsSync(BACKUP_ROOT)) return [];
  return fs.readdirSync(BACKUP_ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name.startsWith('music-'))
    .map(e => e.name)
    .sort(); // ISO stamp なのでソート順 = 古い順
}

function prune(keep) {
  const all = listBackups();
  if (all.length <= keep) return 0;
  const toDelete = all.slice(0, all.length - keep);
  let removed = 0;
  for (const name of toDelete) {
    const p = path.join(BACKUP_ROOT, name);
    try {
      fs.rmSync(p, { recursive: true, force: true });
      removed++;
      console.log(`[backup-music] pruned: ${name}`);
    } catch (e) {
      console.warn(`[backup-music] prune failed: ${name} — ${e.message}`);
    }
  }
  return removed;
}

function backup() {
  if (!fs.existsSync(MUSIC_DIR)) {
    throw new Error(`[backup-music] music directory not found: ${MUSIC_DIR}`);
  }
  ensureDir(BACKUP_ROOT);

  const name = `music-${stamp()}`;
  const dst  = path.join(BACKUP_ROOT, name);
  const count = copyHtmlFiles(MUSIC_DIR, dst);

  console.log(`[backup-music] ${count} files → backups/${name}/`);
  prune(RETAIN);
  return dst;
}

module.exports = backup;

if (require.main === module) {
  try { backup(); }
  catch (e) { console.error(e.message); process.exit(1); }
}
