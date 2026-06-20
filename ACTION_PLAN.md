# H/MIX GALLERY 神サイト化 アクションプラン
更新: 2026-03-31

---

## 担当凡例

- **CC** = Claude Code（コード修正・一括処理・技術的作業に強い）
- **CW** = Cowork（デザイン・コンテンツ・リサーチ・ブラウザ確認に強い）
- **秋山** = 秋山さん本人が判断・実行すべきもの

---

## Phase 1: 公開前の必須修正 ← 最優先

### CC担当（スクリプト・一括処理系）

| # | タスク | 詳細 | 工数目安 |
|---|--------|------|----------|
| 1-1 | **リンク切れ一括修正** | 全トラックページ（305ファイル）のナビリンクを修正。`/music_gallery/info.htm` → `/terms.html`、`/contact.htm` → `/contact.html`。sed/スクリプトで一括置換 | 30分 |
| 1-2 | **console.log 除去** | `music-library.js`（42箇所）、`app.js`、`player.js`、`router.js` から全 console.log を削除 | 15分 |
| 1-3 | **開発用ファイル削除** | `ornament-preview.html`、`tag-editor.html`、`test-loader.html`、`midjourney_prompts.html`、`fix_seo_head.js`、`music-library.css.bak`、`/music/s/index.bak` | 10分 |
| 1-4 | **ルート直下の重複CSS整理** | ルートにある `composer-page.css`、`composer.css`、`music-library.css`、`music-page.css`、`scene-search.css`、`style.css`、`honyaku.css` を確認。使われていなければ削除、使われていれば `/assets/css/` に統合 | 30分 |
| 1-5 | **/test2026/ パスチェック除去** | `tracks.js`、`tracks-loader.js` 内の `/test2026/` 条件分岐を削除 | 10分 |
| 1-6 | **akiyama.png 削除** | `assets/img/akiyama.png`（1.2MB）を削除。jpg + webp のみ残す | 5分 |
| 1-7 | **sitemap.xml 修正** | `/history.htm` エントリを削除、`professional-license.html` と `tokushoho.html` を追加 | 10分 |
| 1-8 | **全ページのフッター統一** | トラック詳細ページ（305ファイル）にsite-footerが入っているか確認。なければ追加 | 30分 |

### CW担当（デザイン・コンテンツ系）

| # | タスク | 詳細 | 工数目安 |
|---|--------|------|----------|
| 1-9 | **OGP画像の作成** | サイト共通のOGP画像（1200x630）を作成。H/MIX GALLERYのロゴ + 世界観を反映したデザイン。ジャンル別（和風、ホラー、ファンタジー等）もあると理想 | 1時間 |
| 1-10 | **全ページにOGPメタタグ追加** | og:image、og:title、og:description を全主要ページに設定 | 30分 |
| 1-11 | **BUG 2 確認**（ヘッダー配色） | ブラウザでindex.htmlを開いてヘッダーの色がMusic Libraryと一致しているか目視確認。不一致ならCSS修正 | 15分 |

### 秋山さん判断待ち

| # | タスク | 詳細 |
|---|--------|------|
| 1-12 | **BUG 1** | 山田君の報告待ち（License Purchase PJAX問題） |
| 1-13 | **Ablenetサポート返答** | 60日ロック適用状況の確認メール送信 |

---

## Phase 2: SEO強化（公開直後〜1ヶ月）

### CC担当

| # | タスク | 詳細 | 工数目安 |
|---|--------|------|----------|
| 2-1 | **構造化データ追加** | JSON-LD: `Person`（composer）、`BreadcrumbList`（info系ページ）、`MusicGroup`（サイト全体） | 1時間 |
| 2-2 | **composer.html に canonical・OGタグ追加** | 作曲者名検索の強化 | 15分 |
| 2-3 | **トラックページのog:url修正** | 現在 c1.html にハードコードされている og:url を各ページ固有に修正（305ファイル一括） | 30分 |
| 2-4 | **CSSバージョンパラメータ統一** | player.css、fav-modal.css 等にも `?v=` パラメータを追加 | 15分 |

### CW担当

| # | タスク | 詳細 | 工数目安 |
|---|--------|------|----------|
| 2-5 | **.htaccess 301リダイレクト最終確認** | SEO_MIGRATION_TRACKING.md の21URLを再確認、music_top.htm の方針決定 | 30分 |
| 2-6 | **Google Search Console 設定** | 移行後のインデックス監視体制の構築（秋山さんと協力） | 30分 |

---

## Phase 3: 体験の強化（1〜3ヶ月）

### CC担当

| # | タスク | 詳細 | 工数目安 |
|---|--------|------|----------|
| 3-1 | **Storyタグ拡充** | 17候補を tracks.json に追加、music-library.js のフィルタUIに反映 | 1時間 |
| 3-2 | **言語切替の全ページ統一** | Music Library にもJP/ENトグルを実装 | 2時間 |
| 3-3 | **「似た雰囲気の曲」レコメンド** | タグの類似度ベースで関連曲を表示する機能をトラック詳細ページに追加 | 3時間 |

### CW担当

| # | タスク | 詳細 | 工数目安 |
|---|--------|------|----------|
| 3-4 | **トラック詳細ページのデザイン強化** | 装飾の追加、Waveform表示の検討 | 2時間 |
| 3-5 | **ジャンル別ランディングページ設計** | 和風BGM、ホラーBGM、ファンタジーBGM等のLP構成案 | 1時間 |

---

## Phase 4: 収益化の加速（3〜6ヶ月）

### CC担当

| # | タスク | 詳細 |
|---|--------|------|
| 4-1 | **ライセンス購入フロー改善** | BUG 1解決後、UXの簡略化 |
| 4-2 | **Professional License専用お問い合わせフォーム** | 用途選択→自動見積もり→送信の導線 |

### CW担当

| # | タスク | 詳細 |
|---|--------|------|
| 4-3 | **実績・導入事例ページ作成** | 東京コレクション等の実績をビジュアルで紹介するページ |
| 4-4 | **メールマガジン/新曲通知の設計** | 配信フォーマットと登録導線の設計 |

---

## Phase 5: ブランド昇華（6ヶ月〜）

| # | 担当 | タスク | 詳細 |
|---|------|--------|------|
| 5-1 | CW | **世界観の統合演出** | シアターモードと連動した没入体験の設計 |
| 5-2 | CC | **API提供** | ゲームエンジン/動画編集ソフト向けプラグイン |
| 5-3 | CW | **多言語LP** | 中国語・韓国語のランディングページ |
| 5-4 | 秋山 | **新曲リリース戦略** | ストリーミングとサイトの連動プロモーション |

---

## Claude Code への申し送り

このファイルを読んだら、Phase 1 の CC担当タスク（1-1〜1-8）から着手してください。
特に **1-1（リンク切れ1,559箇所の一括修正）** が最優先です。

### リンク修正の対象パターン:
```
/music_gallery/info.htm  →  /terms.html
/contact.htm             →  /contact.html
```

### 対象ディレクトリ:
- `/hmix/music/` 配下の全 .html ファイル（305ファイル）
- `/hmix/` 直下の主要ページ（index.html、music-library.html 等）

### 注意事項:
- `terms.html` `tokushoho.html` `professional-license.html` は Cowork セッションで更新済み。上書きしないこと
- `composer.html` のフッターも追加済み
- `HANDOFF.md` に最新の技術情報あり
