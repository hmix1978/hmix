#!/usr/bin/env bash
# H/MIX — CTA入り曲ページ + play-counter.js を Xserver 本番へデプロイ
# 使い方(Git Bash): bash scripts/deploy-cta.sh
# .env.ftp(=Xserver: sv16845/ hmix.net/public_html) を読み、1ファイルずつ curl -T で送る。
set -u
cd "$(dirname "$0")/.." || exit 1
source ./.env.ftp

# 対象: play-counter.js（404解消）＋ お気に入りPhase1の変更アセット ＋ 全曲ページ(CTA追加分)
# ※ track-detail.js は曲ページ♡の既存バグ修正＋同期、fav-modal.js/.css はライセンス矢印導線。
# ※ 注意: 曲ページは ...?v=20260609-editorial1 でこれらJSを参照。同名上書きのため、確実な反映には
#   各ページの ?v= を新しい値に上げる(キャッシュバスター更新)のが望ましい（別途）。
FILES=(
  "assets/js/play-counter.js"
  "assets/js/track-detail.js"
  "assets/js/fav-modal.js"
  "assets/css/fav-modal.css"
)
for f in music/*.html; do FILES+=( "$f" ); done

total=${#FILES[@]}; ok=0; fail=0; i=0
echo "デプロイ先: ftp://${FTP_HOST}/${FTP_ROOT}/  ファイル数: ${total}"
for f in "${FILES[@]}"; do
  i=$((i+1))
  # 2回までリトライ
  success=0
  for try in 1 2; do
    if curl -sS -T "$f" "ftp://${FTP_HOST}/${FTP_ROOT}/${f}" \
        --user "${FTP_USER}:${FTP_PASS}" --ftp-create-dirs \
        --connect-timeout 30 --max-time 120 -o /dev/null; then
      success=1; break
    fi
    sleep 1
  done
  if [ "$success" = "1" ]; then ok=$((ok+1)); else fail=$((fail+1)); echo "  FAIL: $f"; fi
  if [ $((i % 25)) -eq 0 ] || [ "$i" = "$total" ]; then echo "  ...${i}/${total} (ok=${ok} fail=${fail})"; fi
done
echo "完了: ok=${ok} fail=${fail} / ${total}"
echo "確認: https://www.hmix.net/music/n1.html （CTA表示）/ https://www.hmix.net/assets/js/play-counter.js （200）"
