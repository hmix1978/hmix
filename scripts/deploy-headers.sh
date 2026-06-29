#!/usr/bin/env bash
# H/MIX — 2026-06-23 デプロイ: モバイルnav修正(app.js) + シアター同期(cockpit-tag/scene-dive) + ヘッダー統一(曲ページ/z系)
# .env.ftp(Xserver) 使用。1ファイルずつ curl -T。
set -u
cd "$(dirname "$0")/.." || exit 1
source ./.env.ftp

ASSETS=( "assets/js/app.js" "theater/js/cockpit-tag.js" "theater/js/scene-dive.js" )
# 曲ページ全部(ヘッダー変更) ＋ app.js参照ページ(?vバンプ) ＋ theater JS参照ページ
mapfile -t MUSIC < <(ls music/*.html 2>/dev/null)
mapfile -t APPPAGES < <(grep -rl 'app\.js' --include='*.html' . 2>/dev/null | sed 's#^\./##' | grep -vE 'backups/|_archive|archive-restored|_mockup|node_modules|index\.newtop')
mapfile -t THPAGES < <(grep -rlE '(cockpit-tag|scene-dive)\.js' --include='*.html' . 2>/dev/null | sed 's#^\./##' | grep -vE 'backups/|_archive|archive-restored|_mockup|node_modules')

# 重複排除
declare -A seen
FILES=()
for f in "${ASSETS[@]}" "${MUSIC[@]}" "${APPPAGES[@]}" "${THPAGES[@]}"; do
  [ -n "${seen[$f]:-}" ] && continue; seen[$f]=1; FILES+=( "$f" )
done

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
