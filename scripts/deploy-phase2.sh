#!/usr/bin/env bash
# H/MIX — Phase2 脈拍演出デプロイ: player.js/player.css + ?vバンプした参照ページ
set -u
cd "$(dirname "$0")/.." || exit 1
source ./.env.ftp
ASSETS=( "assets/js/player.js" "assets/css/player.css" )
mapfile -t PAGES < <(grep -rlE 'player\.(js|css)' --include='*.html' . 2>/dev/null | sed 's#^\./##' | grep -vE 'backups/|_archive|archive-restored|_mockup|node_modules|newtop' | sort -u)
declare -A seen; FILES=()
for f in "${ASSETS[@]}" "${PAGES[@]}"; do [ -n "${seen[$f]:-}" ] && continue; seen[$f]=1; FILES+=( "$f" ); done
total=${#FILES[@]}; ok=0; fail=0; i=0
echo "デプロイ先: ftp://${FTP_HOST}/${FTP_ROOT}/  ファイル数: ${total}"
for f in "${FILES[@]}"; do
  i=$((i+1)); success=0
  for try in 1 2; do
    if curl -sS -T "$f" "ftp://${FTP_HOST}/${FTP_ROOT}/${f}" --user "${FTP_USER}:${FTP_PASS}" --ftp-create-dirs --connect-timeout 30 --max-time 120 -o /dev/null; then success=1; break; fi
    sleep 1
  done
  if [ "$success" = "1" ]; then ok=$((ok+1)); else fail=$((fail+1)); echo "  FAIL: $f"; fi
  if [ $((i % 40)) -eq 0 ] || [ "$i" = "$total" ]; then echo "  ...${i}/${total} (ok=${ok} fail=${fail})"; fi
done
echo "完了: ok=${ok} fail=${fail} / ${total}"
