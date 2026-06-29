#!/usr/bin/env bash
set -u; cd "$(dirname "$0")/.." || exit 1; source ./.env.ftp
mapfile -t FILES < /c/tmp/deploy-favstore.txt
t=${#FILES[@]}; ok=0; fail=0; i=0
echo "deploy先 ${FTP_ROOT} 計${t}"
for f in "${FILES[@]}"; do
  i=$((i+1)); s=0
  for try in 1 2; do
    if curl -sS -T "$f" "ftp://${FTP_HOST}/${FTP_ROOT}/${f}" --user "${FTP_USER}:${FTP_PASS}" --ftp-create-dirs --connect-timeout 30 --max-time 120 -o /dev/null; then s=1; break; fi
    sleep 1
  done
  if [ "$s" = "1" ]; then ok=$((ok+1)); else fail=$((fail+1)); echo "FAIL $f"; fi
  if [ $((i % 60)) -eq 0 ] || [ "$i" = "$t" ]; then echo " ...$i/$t ok=$ok fail=$fail"; fi
done
echo "完了 ok=$ok fail=$fail /$t"
