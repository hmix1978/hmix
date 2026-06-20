# DEPRECATED: tracks.json.deprecated-2026-04

## 概要

このフォルダの `tracks.json.deprecated-2026-04` は **2026年4月時点の旧データ** です。
**本番データは `/hmix/assets/js/tracks.js`（TRACKS 配列）に完全移行済み**。
参照禁止。

---

## 移行情報

| 項目 | 内容 |
|------|------|
| 移行日 | 2026-04-17 |
| 担当 | 佐藤 里奈（Catalog & Release マネージャー） |
| 承認 | CEO 黒田 誠 / 代表 秋山 裕和 |
| 旧ファイル曲数 | 151 曲（id 検出数） |
| 本番 tracks.js 曲数 | 303 曲 |
| 根拠レポート | `C:/Users/hiro/projects/hmix-works/ops/reports/2026-04_catalog_metadata-audit.md` |

---

## 旧版と本番の差異

| 観点 | tracks.json（旧・このファイル） | tracks.js（本番） |
|------|-------------------------------|-------------------|
| 曲数 | 151 | 303 |
| description 品質 | 十数字の内部メモレベル | 2〜4文、秋山監修済の本番品質 |
| description_en | 欠損（0曲） | 303曲 100% 充足 |
| title_en | 151曲のみ | 303曲 100% 充足 |
| climax（波形ハイライト） | 一部のみ | 302曲 |

---

## 参照状況（2026-04-17 時点の grep 結果）

サイトのランタイムからは一切参照されていないことを確認済み。

- `assets/js/tracks-loader.js` — コメント行に `tracks.json` と記載あるが、実装（L52）は既に `tracks.js` を読むよう修正済み。
- `tag-editor.html` — `tracks.json` はダウンロード時のファイル名として使用されるのみ（バックアップ命名規則）。ランタイムでは `tracks.js` を script タグで読む。
- `node_modules/tracks-loader.js` — 旧版のアーカイブ残骸。HTML の script src からは参照されていない（本番は `/assets/js/tracks-loader.js`）。
- `*.py`、バッチファイル、その他 JS — `tracks.json` への参照なし。
- `ACTION_PLAN.md` — ドキュメント記述のみ（コード参照ではない）。

---

## 復元手順（万が一必要な場合）

```bash
mv /hmix/assets/data/tracks.json.deprecated-2026-04 /hmix/assets/data/tracks.json
```

追加で、バックアップを以下に退避済み:

```
C:/Users/hiro/projects/hmix-works/catalog/backups/tracks-json-before-deprecate-2026-04-17.json
```

---

## 削除予定

**2026年末を目処に本ファイル（`tracks.json.deprecated-2026-04`）を削除予定**。
本 README は削除の記録として残す。

---

_Managed by 佐藤 里奈（HMIX WORKS Catalog & Release Manager）_
