#!/usr/bin/env bash
# H/MIX — 全体デプロイ: お気に入りPhase1アセット + CTA曲ページ + キャッシュバスター更新ページ + play-counter.js
# モバイル4ファイルは別途アップ済み。.env.ftp(Xserver) を使用。1ファイルずつ curl -T。
set -u
cd "$(dirname "$0")/.." || exit 1
source ./.env.ftp

# アセット4種
ASSETS=( "assets/js/play-counter.js" "assets/js/track-detail.js" "assets/js/fav-modal.js" "assets/css/fav-modal.css" )
# 実HTMLページ（3アセットを参照=cache-bust済み / CTA曲ページ含む。backups/archive/mockup/newtop/node_modules 除外）
mapfile -t PAGES < <(grep -rlE '(track-detail|fav-modal)\.(js|css)' --include='*.html' . 2>/dev/null \
  | sed 's#^\./##' | grep -vE 'backups/|_archive|archive-restored|_mockup|node_modules|index\.newtop\.html' | sort)

FILES=( "${ASSETS[@]}" "${PAGES[@]}" )
total=${#FILES[@]}; ok=0; fail=0; i=0
echo "デプロイ先: ftp://${FTP_HOST}/${FTP_ROOT}/  ファイル数: ${total}（アセット${#ASSETS[@]}＋ページ${#PAGES[@]}）"
for f in "${FILES[@]}"; do
  i=$((i+1))
  success=0
  for try in 1 2; do
    if curl -sS -T "$f" "ftp://${FTP_HOST}/${FTP_ROOT}/${f}" \
        --user "${FTP_USER}:${FTP_PASS}" --ftp-create-dirs \
        --connect-timeout 30 --max-time 120 -o /dev/null; then success=1; break; fi
    sleep 1
  done
  if [ "$success" = "1" ]; then ok=$((ok+1)); else fail=$((fail+1)); echo "  FAIL: $f"; fi
  if [ $((i % 40)) -eq 0 ] || [ "$i" = "$total" ]; then echo "  ...${i}/${total} (ok=${ok} fail=${fail})"; fi
done
echo "完了: ok=${ok} fail=${fail} / ${total}"
