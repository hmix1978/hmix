# ★ Current Handoff — 2026-06-24 — Windows（最新・まずここを読む）

> Mac側へ: `git pull origin main` → 下記を把握 → 続行。古い節は履歴。`.env.ftp`はGit管理外（Macに別途設定要）。

## 2026-06-24 Mac hotfix（本番反映済み）
- **音楽手帖の商用利用申請チェックボックス修正**: `assets/js/fav-notebook.js` のチェックボックスクリックが行クリックへ伝播して選択状態が維持されない問題を修正。`aria-label` も追加。ついでに0曲時の空状態が `hidden` のまま表示されない問題も修正。`fav-notebook.js?v=20260624e` としてXserver本番へ反映済み。
- **音楽手帖の申請導線を選択曲に一本化**: 「この章をまるごと申請」は削除。チェック欄の直上に「全てチェック」「解除」を追加し、下部固定エリアは「選択曲を申請」のみ表示。選択0曲なら無効、選択時は「選択曲（N曲）を申請」として有効化。`fav-notebook.js?v=20260624g` / `fav-notebook.css?v=20260624d` としてXserver本番へ反映済み。
- **制作ツールボックス緊急復旧（完全ロールバック）**: 直前の「音楽手帖プレビュー波形と制作ツール同期」で入れた範囲共有処理が制作ツールボックス本体のクリック反応/波形表示を不安定化したため、`player-panel.js` を安定版へロールバックし、未完成の音楽手帖同期UI/保存口も撤去。HTML参照は `player-panel.js?v=20260624h` / `fav-store.js?v=20260624b` / `fav-notebook.js?v=20260624k` / `fav-notebook.css?v=20260624f` に更新しXserver本番へ反映済み。本番スモークで制作ツールボックスが開き、波形プレビューCanvas/タブ群が表示され、console errorなしを確認。同期機能は `player-panel.js` に干渉しない別設計で再実装すること。
- **TOPページの制作ツール初期化エラー修正**: TOPだけ `player-panel.js` が `defer` 読み込みのため、EQ/コンプ変数の初期化前に `_eqcSnapshot()` が呼ばれ `undefined.map` で落ちていた。`_eqcSnapshot()` に初期化前のデフォルト返却ガードを追加し、HTML参照を `player-panel.js?v=20260624i` に更新。本番TOPで下部プレイヤーの「ツール」ボタンからパネルが開き、タブ群/波形Canvasが表示されることを確認。
- **波形範囲が停止で消える問題を修正**: 下部プレイヤーの停止は `currentIndex=-1` にするため、ツール側が「現在曲なし」と解釈して範囲を消していた。範囲選択中は `_rangeTrackId` から対象曲を参照し、停止イベントでは範囲を記憶・維持するよう修正。HTML参照を `player-panel.js?v=20260624j` に更新してXserver本番へ反映済み。本番TOPで範囲選択→停止後も開始/終了/長さUIと波形Canvasが残ることを確認。
- **制作ツール/音楽手帖QAと停止中表示の微修正**: 音楽素材ページ本番で、手帖の全チェック/解除/選択曲申請、追加→リロード→手帖反映→削除復元、制作ツールの波形/EQ・コンプ/メモ/表記コピー/シェアを確認。console errorなし。範囲選択後に停止すると範囲は残るが「区間リピート中」表示のままだったため、停止イベント時だけ `選択範囲: ...（停止中）` に更新するよう修正。HTML参照を `player-panel.js?v=20260624k` に更新しXserver本番へ反映済み。
- **ライセンス申請ルーティング修正**: `license-request.html#usage=...&tracks=...` / `#tracks=...&usage=...` で用途だけ残り曲が0件になる問題を修正。`usage`/`plan` だけURLから除去し、`tracks` は `loadSelection()` へ残す。さらに `usage` と `plan` の15秒sessionStorage引き継ぎが混線しないよう相互クリア。
- **ライセンス申請JS二重ロードガード**: `license-request.html` はPJAX用動的ロード＋下部scriptで同じJSを2回読むため、`window.HMIX_LICENSE_REQUEST_LOADED` ガードを追加。DOM重複やイベント二重化を抑止。
- **本番検証OK**: `https://www.hmix.net/license-request.html?qa=...#usage=web_ad&tracks=n74,c7` → 2曲選択・Professional `¥11,000`。`#plan=facility&tracks=n74,c7` → 2曲選択・施設パス `¥19,800/年`。フォーム数1、選択曲カード2、console errorなし。
- 注意: Mac側の古い `.private/.env.ftp` は `hmix.temporarydomain.net` / `hmix.net` を指していた。今回の本番デプロイはAI-Memoryルール通り `sv16845.xserver.jp` / `hmix.net/public_html` に上書き指定して実施。

## このコミットの主変更（すべて本番 hmix.net 反映済み）
1. **お気に入りの心臓一本化（Phase 0）**: `assets/js/fav-store.js`（新規・`window.HMIX_FAV`）。リッチ構造`hmix_favorites_v2`＋後方互換ミラー`hmix_favorites`、setItemラップで未改修コードも自動和解、冪等マイグレータ＋90日バックアップ／LWW＋tombstone＋LexoRank／Undo。テスト`node scripts/test-fav-store.js`(34)。主要消費者(music-library/player/fav-modal/track-detail)をHMIX_FAV直結＋削除はUndo化。
2. **音楽手帖UI（P1）本番稼働**: `assets/js/fav-notebook.js`＋`assets/css/fav-notebook.css`（新規・`window.HMIX_NOTEBOOK`）。見開き3ペイン/章/A-B/メモ/金CTA/モバイルボトムシート。`fav-modal.js`の`openModal()`＋♡ハブを「手帖があれば手帖／無ければ旧モーダル」に変更＝**全保存リスト入口が手帖に統一**。申請は`/license-request.html#tracks=`へ。
3. **星巡り(theater/tag-cockpit.html)**: コックピット右下♡→八角形ビジョン(cockpit-tag.js capture委譲)、景色は従来モーダル、景色固有fav箱削除しハブ一本化＋左下退避。**theater配下に手帖は注入していない**。
4. **PJAX制作ツールボックス＆メモ引き継ぎ**(`player-panel.js`): ナビリンクで誤って閉じていたのを修正(`a[href]`は閉じない)。遷移後も開・タブ・メモ(`hmix_memos_v1`)・波形/EQ維持。
5. **professional-license.html**: 料金表`.ptbl`CSS欠落の崩れ修正。TOPの旧お気に入りショーケース削除。

## ⚠️ Mac側で必ず注意（重要）
- **`music/`は丸ごと.gitignore（生成物扱い）**。305曲ページとmp3はGit未追跡。本番の`music/*.html`には favbox読込(fav-store/fav-notebook/css)・track-detail.js?v=20260623h・player-panel.js?v=20260624a・fav-modal.js?v=20260624c が**注入済みだがコミットされていない**。
- **`scripts/build-track-pages.js`はfavbox読込を生成しない** → 曲ページを再生成してデプロイすると**favboxが消えた旧状態に戻る（リグレッション）**。再生成する場合は生成後にfavbox読込の再注入が必要（build-track-pages.js側テンプレ追加がTODO）。
- 共有JS/CSSを変えたら各ページの`?v=`バンプ必須（7日キャッシュ）。WinはBash安全判定が時々落ちる→PowerShellの`curl.exe -T ... --output NUL`で代替（Macは通常のbash curlでOK）。

## 検討中（次の論点）
- 移転初日ログ: 転送38.6GB/日(月1.1TB)の**91.7%がmp3**。対策案=①Cloudflare(無料)でmp3エッジキャッシュ=本命 ②.htaccessホットリンク保護 ③robots/UAでボット(YisouSpider/AhrefsBot/curl)抑制 ④単一IP 211.1.105.65(651MB)調査。SEOは直リンクでなく検索＋YouTube(16%)＋ページ(schema済)で。mp3への`X-Robots-Tag: noindex`/`Link: rel=canonical`は検討段階(cross-type canonicalは効果不確実)。
- favbox残: 申請4ステップ手帖内化／Firebase同期(P1-3)／soft gateメール／インボイスPDF。正典=`hmix-works/お気に入りボックス-確定仕様-熟成版.md`。

---

# H/MIX GALLERY — 引継ぎメモ
更新: 2026-04-03

## Current Handoff - 2026-06-21 - Mac

Owner side: Mac
Branch: main
Latest commit before work: f434684 Stabilize theater playlist fallback

### Done
- Added a standalone theater effect tuning page:
  - `theater/effects-lab.html`
  - Full theater preview using the existing theater night and starmap assets.
  - Adjustable effect meters for dust, fireflies, stars, projection beam, screen glow, aurora, curtain glow, fog, rain, petals, film grain, vignette, speed, size, and hue.
  - Four presets: forest screening, star atlas, rainy night, and festival afterglow.
  - Current settings can be copied as JSON for later migration into the main theater page.

### Files touched
- `theater/effects-lab.html`
- `HANDOFF.md`

### Verification
- `npm run build:counts` passed.
- Local HTTP check passed: `http://127.0.0.1:4173/theater/effects-lab.html` returned `200 OK`.
- Inline `<script>` syntax check passed with `effects-lab scripts ok: 1`.

### Deployment
- Not done. This effect lab remains local/GitHub only until Hiro explicitly approves production deployment.

### Next
- Hiro should review the lab page visually and pick favorite presets / ranges.
- After approval, migrate the chosen effect layers into `theater/index.html`.
- Continue P1 playlist used-track mapping and wide-screen panel adjustment.

### Risks / Holds
- Codex could not directly control the in-app browser window due app safety restrictions, so visual review is pending in the normal browser.
- `popular.html` remains on hold per `MAC_WIN_SYNC.md`.

---

## ⚠️ Cowork へ — 削除禁止ファイル

> **`tag-editor.html` は絶対に削除しないでください。**
>
> Antigravity のグラさんが開発・管理している楽曲タグ管理ツールです。
> 「開発用ファイル」に見えますが、現役の運用ツールです。
> 2026-04-03 の Cowork 診断レポートに基づく削除対応で誤って消してしまいましたが、
> **Antigravity（グラさん）によってこの会話内で完全復元済みです（2026-04-03）。**
>
> 今後このファイルは **削除・移動・上書き禁止** でお願いします。

---

## AI チーム体制

| 担当 | ツール | 役割 |
|------|--------|------|
| 設計・実装・判断 | **Claude（Cowork）** | HTML/CSS/JS実装、世界観判断、HANDOFF管理 |
| タグ管理・楽曲DB | **グラさん（Antigravity）** | `tag-editor.html` の開発・運用、tracks.js管理 |
| リサーチ | **Genspark** | SEO調査、競合分析、トレンドリサーチ（4/12再稼働予定） |
| 大量・反復作業 | **Manus AI** | 大量ページの一括処理、自動化タスク（4/12再稼働予定） |
| コード実装（大規模） | **Claude Code（クロちゃん）** | バッチ処理、JS改修、本番デプロイ前の最終確認 |

> **グラさんへ**: tag-editor.htmlに関する作業・変更があれば、このHANDOFF.mdに追記してください。

---

## プロジェクト概要

- **サイト**: H/MIX GALLERY（フリー音楽素材サイト）
- **作曲家**: 秋山裕和
- **作業フォルダ**: `/hmix/`
- **本番URL**: https://www.hmix.net/
- **現サーバー**: Ablenet（SSLなし）
- **移行先サーバー**: Xserver（SSL無料、サイトアップ済みだがドメイン未移行）

---

## サーバー移行状況

- **SSL**: 2026-04-02 Ablenet（www.hmix.net）でSSL有料導入済み → HTTPS有効
- **公開予定**: 数日以内に新デザインをAblenetにアップロード
- **ドメイン移行**: 60日ロック解除後（2026年5月中旬）にXserverへ移管予定

---

## 未解決のバグ

### BUG 1: License Purchase ページが PJAX 遷移後に「読み込み中...」のまま
**→ 山田君が作業中。報告待ち。**

- 他ページから `/license-request.html` にPJAX遷移すると `#lr-main` が描画されない
- F5（直接アクセス）では正常
- 原因: `license-request.js` が `#page-content` 外にあり、PJAX遷移時にロードされない
- デバッグバッジ設置済み（右下固定の緑バッジ）

### BUG 2: ホームページのヘッダー配色が Music Library と違う
- `style.css` に修正CSSを追加済みだが、反映未確認
- セレクタ優先度の問題の可能性あり

---

## 第2セッションで完了した作業

### 1. 装飾デザイン（SVG + CSS）
- **コーナー装飾**: `corner-tl/tr/bl/br.svg`（120x120、三重フレーム、スクロール装飾、葉、金ドット）
- **セクション区切り**: `divider.svg`（600x60、紋章シールド、竪琴、冠、月桂樹、スクロールワーク）
- **ornaments.css**: `.orn-divider`, `.orn-framed`, `.orn-hero-frame`, `.orn-vine-top`, `.orn-gold-line`, `.orn-pattern-overlay`
- ヘッダーブラケット、背景クレストは削除済み（ユーザー指示）
- `bracket-left.svg`, `bracket-right.svg`, `crest.svg` は削除済み

### 2. 特定商取引法ページ（新規）
- **`tokushoho.html`** — 特商法の表記を独立ページとして作成
- terms.html からは§7セクションを削除し、控えめなテキストリンクに置換
- JP/EN言語切替対応
- パンくず: Home → ご利用規約 → 特定商取引法
- 販売価格にStandard / Project Pack / Professional の3ティアを記載

### 3. Professional License ページ（新規）
- **`professional-license.html`** — プロフェッショナルライセンスの料金ガイド
- 3段ライセンス比較カード（Free ¥0 / Standard ¥2,200 / Professional ¥5,000〜）
- 用途別料金テーブル（16カテゴリ、3段階の価格帯）:
  - **¥5,000〜**: Web広告、映画祭、店舗BGM、研修、舞台、ラジオ、パッケージ販売、オーディオブック
  - **¥25,000〜**: テレビ放送、劇場映画、大規模ゲーム、企業VP（大企業）、交通機関
  - **¥50,000〜**: TVCM、ジングル/サウンドロゴ
  - **要相談**: パチンコ/遊技機
- 備考欄（ボリュームディスカウント、地域・期間で変動等）
- CTA → Contact ページへの導線

### 4. terms.html §6 導線変更
- 「お問い合わせください」→ ゴールドカラーで Professional License への誘導リンクに変更
- JP/EN 両方対応

### 5. クレジットコピーに「フリー音楽素材」追加（SEO）
- 日本語3パターン（Simple/Standard/Full）に「フリー音楽素材」を追加
- 英語3パターンに「Free BGM」を追加
- ユーザーがYouTube説明欄にコピペ → 自然なバックリンク効果

### 6. composer.html フッター追加 & 色統一
- site-footer を追加（他ページと同じ構成、特商法リンク含む）
- composer.css にフッター用ダークテーマ変数をオーバーライド
  ```css
  .composer-page .site-footer {
    --color-bg-2: #080e0b;
    --color-border: rgba(100, 180, 130, 0.12);
    /* etc. */
  }
  ```

### 7. 言語切替の初期化修正
- terms.html: `sessionStorage` に値がない場合でも `setLang('ja')` を必ず呼ぶように修正
- §7 特商法セクションが初回アクセス時に表示されない問題の対策

---

## ページ構成（現在）

| ページ | ファイル | 備考 |
|--------|----------|------|
| Home | `index.html` | body.top-page |
| Music Library | `music-library.html` | ダークテーマ |
| License & Terms | `terms.html` | ダークテーマ、装飾あり |
| Composer | `composer.html` | 独自テーマ、フッター追加済み |
| Contact | `contact.html` | ダークテーマ |
| License Purchase | `license-request.html` | BUG 1あり |
| Professional License | `professional-license.html` | **NEW** 料金ガイド |
| 特定商取引法 | `tokushoho.html` | **NEW** 法定表記 |

---

## ファイル構成（主要）

```
hmix/
├── index.html
├── music-library.html
├── terms.html
├── composer.html
├── contact.html
├── license-request.html
├── professional-license.html    ← NEW
├── tokushoho.html               ← NEW
├── ornament-preview.html        ← 開発用プレビュー（本番前に削除）
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── music-library.css
│   │   ├── music-library-dark.css
│   │   ├── info-page.css         ← 情報ページ共通スタイル
│   │   ├── ornaments.css         ← 装飾CSS
│   │   ├── composer.css          ← フッターテーマ追加
│   │   ├── scenic-bg.css
│   │   ├── player.css
│   │   ├── theater.css
│   │   └── fav-modal.css
│   ├── js/
│   │   ├── router.js             ← PJAXルーター
│   │   ├── tracks-loader.js
│   │   ├── player.js
│   │   ├── music-library.js
│   │   ├── composer.js
│   │   └── license-request.js
│   └── img/
├── images/
│   └── ornaments/
│       ├── corner-tl.svg
│       ├── corner-tr.svg
│       ├── corner-bl.svg
│       ├── corner-br.svg
│       └── divider.svg
├── HANDOFF.md                   ← このファイル
└── SEO_MIGRATION_TRACKING.md
```

---

## 第3セッションで完了した作業

### トラック詳細ページ 全面リデザイン（v2）

サンプルファイル: `music/z9-redesign.html`

**デザインコンセプト「息をのむほど美しい」:**
- 四角いジャケット画像を廃止 → タグに対応したシーン画像（`assets/images/scenes/*.webp`）をフルブリードヒーローとして使用
- 85vh ヒーローセクション（シネマティックグラデーション + ゆっくりズームアニメーション + ゴールドパーティクル）
- タグカテゴリ別カラーリング（Feeling:紫 / Style:青 / Scene:緑 / Story:金）
- Related Tracks: シーン画像カード化、ホバーで再生アイコン表示
- ヘッダー: library-page--dark と完全統一（#9adfb4グリーン発光ロゴ、#b0c8b8ナビリンク）

**ライセンス & ダウンロードセクション:**
- LEFT — FREE LICENSE
  - YouTube OK バッジ（ゴールド）: 「広告収益ありでもリンク記載だけでOK」
  - クレジットコピー欄（曲名あり/なし タブ切り替え + ワンクリックコピー）
  - ダウンロードボタン（MP3）
- RIGHT — 商用利用
  - 単曲ライセンス ¥2,200 / プロジェクトパック ¥7,480 の均等2段テーブル
  - ご利用規約を確認ボタン

**機能:**
- グローバルプレイヤー（♡お気に入り + 保存リストボタン付き）
- ヒーローの♡ボタン（ゴールド、localStorage同期）
- fav-modal.js 完全統合

---

## 第4セッションで完了した作業

### 1. Library Gateway セクション リデザイン（CC-TASK-2 完了）
- コピーを「あの感情に出会える、曲がある。」に変更
- 統計グリッド（302/Free/20+Years）削除、CTA を1本に絞る
- 背景グラデーション調整（黒→深森グリーン、`.lgw-glow` をサイトカラーに統一）
- `theater-interlude` 重複CSS解消（`theater.css` の定義を削除、`style.css` に統一・48px）
- `featured-music` 底パディング圧縮（`8rem 0 4rem`）でシアターとの継ぎ目を改善

### 2. TOPページ Composer セクション
- `作曲者について` リンクを `/composer.html` に修正（絶対パス統一）
- YouTube と X のアイコンボタンをアルバムリンク隣に追加（`.composer-social-btn` 新規スタイル）

### 3. TOPページ License セクション（最新ルールに更新）
- 「YouTube動画（広告なし）」→「YouTube（収益化OK）＋説明欄リンク記載」に変更
- 商用カードの内容を用途別具体例（広告/企業VP/ゲーム/舞台）に刷新
- 商用CTAを「ご利用規約を確認」（terms.html誘導）に変更

### 4. クレジット表記文言の更新（terms.html + contact.html）
- YouTube言及・Content ID言及を削除（別セクションでカバー済みのため）
- 「エンドロール・ゲームクレジット・公演パンフレットへの記載をお願い」に統一

### 5. プロフェッショナルライセンス価格改定
- `terms.html` 日英: `¥15,000〜` → `¥5,500〜`

### 6. ornaments.css を情報ページ全体に適用
- `contact.html`、`license-request.html`、`tokushoho.html` に ornaments.css 追加
- 各ページのメインカード／セクションに `orn-framed` ＋ `orn-framed-bottom` 適用

### 7. 特定商取引法ページ 住所追記
- `〒160-0023 東京都新宿区西新宿３丁目３番１３号　西新宿水間ビル2F`（日英両方）

---

## 第5セッションで完了した作業

### CC-TASK-1: トラック詳細ページ テンプレート化 & 全件適用

- `assets/css/track-detail-v2.css` 新規作成（z9-redesign.html のインラインCSSを分離、ヘッダー重複定義削除、`.td2-footer` に明示的 `background` 追加）
- `assets/js/track-detail.js` 全面書き直し:
  - `TAG_BG` マップ（42タグ → シーン画像パス）
  - `renderTrackV2()`: ヒーロー背景・テキスト・クレジット・タグ・ダウンロード・♡ボタン同期
  - `renderRelatedV2()`: シーン画像カード生成
  - `window.HMIX_INIT_TRACK_DETAIL` 公開（PJAX再初期化エントリポイント）
- `assets/js/router.js`: track-detail ページタイプのPJAX処理を追加
- 全305ページ（`music/*.html`）をテンプレートに一括置換:
  - `<body class="library-page library-page--dark">` 追加（ダークテーマ適用）
  - `<div id="page-content" data-page-type="track-detail">` ラッパー追加（PJAX対応）
  - `tracks.js`（同期）を使用（`tracks-loader.js` 非同期ではなく）

---

## 第7セッションで完了した作業（Cowork）

### 1. composer.html — 楽曲提供実績セクション追加

- `<!-- ===== CREDITS ===== -->` セクションを Streaming と COLLABORATION CTA の間に新規追加
- **美少女万華鏡 オリジナルサウンドトラック**（ωstar、音楽CD 6枚組、2026年2月27日発売）を初回実績として掲載
- リンク先: `https://www.omega-star.jp/biman_ost/biman_ost.html`
- アダルトゲーム原作のため、サイト内での詳細説明は行わず実績名・レーベル・年のみの静かな掲載にした
- JP/EN 言語切替対応

### 2. composer.css — Credits スタイル追加

- `.credits-list`, `.credits-item`, `.credits-item__title`, `.credits-item__meta`, `.credits-item__link` を新規追加
- グリッドレイアウト（タイトル＋メタ左 / リンク右）
- 今後の実績追加は `.credits-item` を増やすだけで対応可能

### 3. YouTube宣伝動画 制作計画（企画段階）

2バージョン制作方針を決定：
- **ブランディング動画**（後回し）
- **使い方動画**（優先）: 60〜90秒、Hook → サイト概要 → 楽曲の探し方 → 実際に使う → CTA の5幕構成
- スクリプト・サムネイル案・説明欄テンプレートは秋山さんの準備後に着手予定

### 4. 3AI連携体制の確立

- Genspark（リサーチ担当）、Manus AI（大量・反復作業担当）を副官として定義
- 両AIとも2026年4月12日頃にクレジット再稼働予定。再稼働後に役割分担して活用する

---

## 【Claude Code へ】最新作業の共有依頼

**Claude Codeへ: このHANDOFF.mdを読んだら、第6セッション以降（第5セッション完了後）に
あなた（Claude Code）が実施した全作業をこのファイルの「第6セッションで完了した作業」欄に
追記・更新してください。**

現在HANDOFF.mdに記載されている第6セッションの内容（OGP/構造化データ等）は
Claude Codeが実施したものと思われますが、詳細が不完全な可能性があります。
実際に行った作業・変更ファイル・技術メモを正確に反映させてください。

更新フォーマット：
```
## 第6セッションで完了した作業（Claude Code）
### 1. [作業名]
- [変更内容]
- [変更ファイル]
```

---

## 【Claude Code へ】外部コンサルタント診断レポート（2026-04-03）

ファイルを実際に精査した結果、**HANDOFF.mdの「完了」記録と実態が乖離している**箇所が複数確認されました。以下を確認・対処してください。

---

### 🔴 最優先で対処してください

**① index.html のデバッグバッジを削除（488〜506行）**
`#dev-badge` および `#dev-header-color` の確認スクリプトが本番ページに残存しています。
このまま公開するとユーザーに緑色のデバッグUIが見えてしまいます。該当ブロックを丸ごと削除してください。

**② assets/images/scenes/ の PNG ファイル42枚を削除**
WebP変換済みにもかかわらず元PNGが全件残存しています（合計約126MB）。
WebPファイルは正常に存在しているため、`.png` のみ全削除可能です。
削除対象: `assets/images/scenes/*.png`

---

### 🟡 高優先（公開前に対処推奨）

**③ HANDOFF.md「第5セッション完了」と記録されているが実際には残存しているファイル**

以下のファイルが削除されていません。実際に削除を実施してください：

| ファイル | 種別 |
|----------|------|
| ~~`tag-editor.html`~~ | **⚠️ 削除禁止** — グラさん（Antigravity）の運用ツール。削除不可 |
| `history.htm` | 旧ファイル（.htaccessでリダイレクト済み） |
| `profile.htm` | 旧ファイル（.htaccessでリダイレクト済み） |
| `contact.htm` | 旧ファイル（.htaccessでリダイレクト済み） |
| `style.css`（ルート直下） | 重複CSS |
| `assets/css/composer-page.css` | 重複CSS |
| `assets/css/music-page.css` | 重複CSS |
| `assets/css/scene-search.css` | 重複CSS |
| `__pycache__/` | Python開発ファイル |
| `assets/img/vol1.jpg`（2.9MB） | 最適化済みのWebP/JPGがあるため不要 |

**④ ルート直下 img/（旧サイト画像、10MB）**
`Thumbs.db`、`022.jpg`、`ameba_top.gif` など旧サイトの画像が残存。
新サイトで参照していないことを確認後、フォルダごと削除推奨。

**⑤ images/ の重量ファイル**
- `images/hero-background.jpg`（6.3MB）→ `hero-bg.webp` があるので不要
- `images/library-bg-source.png`（5.7MB）→ ソース画像、本番不要
- `images/history/`（旧サイト画像2枚）→ 不要

---

### 🟡 中優先

**⑥ OGP画像の最適化**
現在 `japanese.webp`（992KB）をOGP画像に使用中。SNSシェア時に重すぎます。
専用OGP画像（1200×630px、200KB以下）の作成を推奨。現状は機能はしています。

---

### ✅ 確認済み・問題なし

- `console.log`: 全JSファイルで0件 ✅
- ナビリンク: 全トラックページで正しいパス ✅
- PJAX対応: license-request・track-detail 両方実装済み ✅
- .htaccess: リダイレクト設定済み ✅
- sitemap.xml: history.htm削除済み ✅
- Formspree: contact.htmlで実装済み ✅

---

**作業完了後、HANDOFF.mdの「今後のタスク」欄を更新してください。**

---

## 第6セッションで完了した作業（Claude Code）

### 1. EN モード — 曲個別ページ全面対応

**変更ファイル**: `assets/js/track-detail.js`, `music/n1.html`

- `TAG_LABELS_EN` 定数追加（英語タグラベル）
- `getCurrentLang()` — `window.HMIX_LANG` → sessionStorage フォールバック
- `getTrackTitle(track)` — EN 時に `track.title_en` を返す
- `applyDataLang()` — `[data-ja][data-en]` 要素を一括更新
- `updateLangV2(track)` — 言語変更時のライブ更新（タイトル・パンくず・タグ・関連曲・ライセンスセクション）
- `initHeader()` — EN トグルボタンを注入、クリックハンドラ設定
- `hmix:lang` イベントリスナー（モジュールレベルで1回のみ）
- `n1.html` 内のライセンスセクション全要素に `data-ja`/`data-en` 付与

### 2. EN モード — Music Library 楽曲名表示修正

**変更ファイル**: `assets/js/music-library.js`

- `getCurrentLang()` が sessionStorage にフォールバックしていなかった問題を修正

### 3. 言語トグルボタン — デザイン刷新

**変更ファイル**: `assets/css/style.css`, `assets/js/app.js`, `assets/js/music-library.js`, `assets/js/track-detail.js`, 静的HTMLファイル9件

- Globe SVG + `JP / EN` 強調表示のピル型ボタンに変更
- アクティブ言語をグリーン太字で強調

### 4. Composer ページ — フッター重複解消

**変更ファイル**: `composer.html`

- フッターが `#page-content` 内にあり PJAX で二重表示されていた問題を修正
- ファイルが764行目で途中切断されていたため、プレイヤー・fav-modal・スクリプト類を補完

### 5. ライセンス申請ページ — 空状態の EN 対応

**変更ファイル**: `assets/js/license-request.js`

- `renderEmpty()` を日英切り替え対応に修正
- `hmix:lang` イベントで空状態を再描画

### 6. 全楽曲への英語タイトル追加（恒久対応）

**変更ファイル**: `assets/js/tracks.js`, `assets/js/tracks-loader.js`, `assets/data/title_en.json`（新規）

- 佐藤里奈（catalog）と Emma Clarke（marketing）が作成した英語タイトルを全303曲に適用
- `tracks-loader.js` が起動時に `assets/data/title_en.json` を fetch してマージする仕組みを実装
- タグエディタが `tracks.js` を上書きしても `title_en` が消えない構造に

### 7. ライセンスセクション — レイアウト修正

**変更ファイル**: `assets/css/track-detail-v2.css`

- 曲名が長い場合にフリーライセンス列が商用列を圧迫する問題を修正
- `grid-template-columns: 1fr 1fr` → `minmax(0, 1fr) minmax(0, 1fr)`

### 8. Cowork 診断レポート対応（2026-04-03）

**削除ファイル**:

| ファイル/フォルダ | 理由 |
|-----------------|------|
| `index.html` デバッグバッジ（#dev-badge） | 本番ページに緑UIが露出していた |
| `assets/images/scenes/*.png` (42枚, ~126MB) | WebP変換済み、不要 |
| ~~`tag-editor.html`~~ | **⚠️ 削除禁止** — グラさん（Antigravity）の運用ツール |
| `history.htm`, `profile.htm`, `contact.htm` | 旧ファイル（.htaccessでリダイレクト済み） |
| `style.css`（ルート直下） | 重複CSS |
| `assets/css/composer-page.css`, `music-page.css`, `scene-search.css` | 重複CSS |
| `assets/img/vol1.jpg` (2.9MB) | WebP版が存在 |
| `img/`（ルート直下、旧サイト画像、10MB） | 新サイトで未参照 |
| `images/hero-background.jpg` (6.3MB) | `hero-bg.webp` が存在 |
| `images/library-bg-source.png` (5.7MB) | ソース画像、本番不要 |
| `images/history/` | 旧サイト画像 |
| `__pycache__/` | Python開発ファイル |

---

---

## Antigravityセッション（2026-04-03）で完了した作業

### 1. `tag-editor.html` 完全復元

**変更ファイル**: `tag-editor.html`（新規再作成）

- Cowork 診断レポートの「開発ツール削除」対応により誤って削除されたため、この会話内の閲覧履歴から完全復元
- 復元内容:
  - 3カラムレイアウト（ダッシュボード・曲リスト・フォーカスエディタ）
  - タグ集計ダッシュボード + ⚠️警告表示（タグ不足曲のハイライト）
  - 検索・カテゴリフィルター機能
  - 音楽プレイヤー（再生/シーク）
  - AIプロンプト生成・返答パース・ワンクリック適用ワークフロー（✨コピーボタン）
  - 「💾 ファイルに直接上書き」ボタン（File System Access API）
  - キャッシュバスター付き `tracks.js` 読み込み（`?t=Date.now()`）
  - カスタムタグ追加機能（＋追加ボタン）
- **削除禁止ファイルであることを HANDOFF.md の冒頭に明記済み**

---

### 2. `midjourney_prompts.html` 新規作成（旧ファイル再作成・強化版）

**変更ファイル**: `midjourney_prompts.html`（新規）

- 旧ファイル（Cowork により削除済み）を再作成
- 全タグの英語プロンプトをキーワード羅列から**情景描写スタイルの長文**に全面刷新
  - パターン: `A breathtaking [emotion] [genre] [scene], [detail], [atmosphere], masterpiece, [lighting], ultra detailed concept art, 8k`
  - ユーザー提供の例文（優しい・悲しい・ホラー）をベースに全タグ統一
- パラメータUIを追加:
  - Aspect: 16:9 / 1:1 / 9:16 / 2:1 / 3:4
  - Version: v6.1（デフォルト）/ v6.0 / v5.2 / niji 6
  - Style: --style raw（デフォルト）/ なし
  - Stylize: s250 / s750（デフォルト）/ s1000
- **17の新規タグに `NEW` バッジを表�
# Current Handoff - 2026-06-07 - Windows

This top section is the current readable handoff. Older content below may contain legacy notes and mojibake; do not treat it as the active status unless a specific item is referenced here.

## Coordination Rule

- Mac and Windows agents must read `MAC_WIN_SYNC.md` before editing.
- Use GitHub as the exchange point once `origin` is configured.
- Update this top section before handing work to the other machine.
- Do not ask Hiro to mediate routine sync questions; record the state here.

## Current Git State

- Local repository initialized at `C:\Users\hiro\projects\hmix`.
- Branch: `main`
- Latest local commits:
  - `3e0cfb0 Update generated track counts`
  - `ff0a2c0 Initialize H/MIX source sync`
- GitHub remote is not configured yet.
- Normal source sync excludes local secrets, logs, archives, `music/`, large audio, and large local tools.

## Recent Work Completed

- Added and deployed the global SEO gateway page: `royalty-free-music.html`.
- Added global creator entry links from TOP / Music Library / related pages.
- Added `かぜのこえ` composer note in Japanese and English.
- Added Git sync guardrails:
  - `.gitignore`
  - `.gitattributes`
  - `MAC_WIN_SYNC.md`
  - `.agents/skills/hmix-github-mac-sync/SKILL.md`
  - `docs/github-mac-sync.md`

## Verification

- Production SEO gateway was verified after deployment:
  - `https://www.hmix.net/royalty-free-music.html?codex=20260607`
  - `https://www.hmix.net/sitemap.xml?codex=20260607`
  - `https://www.hmix.net/?codex=20260607`
  - `https://www.hmix.net/music-library.html?codex=20260607`
- `npm.cmd run build:counts` passed on Windows and updated generated counts.
- Trivy could not be run in this session because the installed `trivy.exe` returned access denied.

## Holds

- Do not improve or rewrite `popular.html` / the popular songs page yet. Hiro said the content direction is not ready.

## Next For Mac Side

1. After GitHub remote exists, clone or pull `main`.
2. Read `MAC_WIN_SYNC.md`.
3. Run `npm install` if needed.
4. Run `npm run dev`.
5. Check:
   - `http://127.0.0.1:4173/`
   - `http://127.0.0.1:4173/music-library.html`
   - `http://127.0.0.1:4173/royalty-free-music.html`
6. If editing, update this top section before pushing back.

## Next For Windows Side

1. Configure GitHub remote when repo URL is available.
2. Push `main`.
3. Keep production deployment on Windows unless Mac receives its own local `.env.ftp`.

---
