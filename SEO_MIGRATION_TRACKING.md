# SEO移行 管理表・判断基準資料

最終更新: 2026-03-19（追記: 2026-03-19）

---

## 移行状況一覧

| # | 旧URL | 新URL | 方法 | 状態 | 備考 |
|---|-------|-------|------|------|------|
| 1 | /music_gallery/image/asian.htm | /music-library.html?style=japanese | 301 | ✅ 完了 | .htaccess設定済み |
| 2 | /music_gallery/image/buttle.htm | /music-library.html?scene=battle | 301 | ✅ 完了 | .htaccess設定済み |
| 3 | /music_gallery/image/index.htm | /music-library.html?style=fantasy | 301 | ✅ 完了 | .htaccess設定済み |
| 4 | /music_gallery/image/horror.htm | /music-library.html?feeling=horror | 301 | ✅ 完了 | .htaccess設定済み |
| 5 | /music_gallery/image/world.htm | /music-library.html?style=fantasy | 301 | ✅ 完了 | .htaccess設定済み |
| 6 | /music_gallery/image/grand.htm | /music-library.html?feeling=epic | 301 | ✅ 完了 | .htaccess設定済み |
| 7 | /music_gallery/image/future.htm | /music-library.html?style=fantasy | 301 | ✅ 完了 | .htaccess設定済み |
| 8 | /music_gallery/feeling/cures.htm | /music-library.html?feeling=gentle | 301 | ✅ 完了 | .htaccess設定済み |
| 9 | /music_gallery/feeling/sadness.htm | /music-library.html?feeling=sad | 301 | ✅ 完了 | .htaccess設定済み |
| 10 | /music_gallery/feeling/happy.htm | /music-library.html?feeling=happy | 301 | ✅ 完了 | .htaccess設定済み |
| 11 | /music_gallery/feeling/hard.htm | /music-library.html?scene=battle | 301 | ✅ 完了 | .htaccess設定済み |
| 12 | /music_gallery/feeling/suspense.htm | /music-library.html?feeling=suspense | 301 | ✅ 完了 | .htaccess設定済み |
| 13 | /music_gallery/list/ | /music-library.html | 301 | ✅ 完了 | .htaccess設定済み |
| 14 | /music_gallery/index.htm | — | 移行なし | ⏸ 対象外 | 規約ページ。旧ページを維持 |
| 15 | /music_gallery/music_top.htm | /music-library.html | 301 | ✅ 完了 | 2026-04-02 新サイト公開に合わせて301に昇格。旧ページは新サイト上に存在しなくなるため |
| 16 | /music_gallery/image/opening.htm | /music-library.html?feeling=epic | 301 | ✅ 完了 | .htaccess設定済み |
| 17 | /music_gallery/image/cute.htm | /music-library.html?feeling=happy | 301 | ✅ 完了 | .htaccess設定済み |
| 18 | /music_gallery/image/halloween.htm | /music-library.html?feeling=horror | 301 | ✅ 完了 | .htaccess設定済み |
| 19 | /music_gallery/image/christmas.htm | /music-library.html?scene=festival | 301 | ✅ 完了 | .htaccess設定済み |
| 20 | /music_gallery/image/marriage.htm | /music-library.html?feeling=gentle | 301 | ✅ 完了 | .htaccess設定済み |
| 21 | /music_gallery/image/relaxation.htm | /music-library.html?feeling=gentle | 301 | ✅ 完了 | .htaccess設定済み |

---

## Search Console 監視項目

移行後1〜3ヶ月、以下の指標を月次で確認する。

| 確認項目 | 確認頻度 | 判断基準 |
|----------|----------|----------|
| 旧URLへのクリック数（#1〜#13、#16〜#21）| 月1回 | 0に近づいていればリダイレクト成功 |
| 新URL（music-library.html）のインデックス登録 | 月1回 | インデックス数が増加していること |
| music_top.htm のクリック数・表示回数 | 月1回 | 推移を記録（下記判断基準に使用） |
| カバレッジエラー（404等） | 月1回 | 旧URL以外で新規404が出ていないこと |

---

## GA4 監視項目

| 確認項目 | 確認頻度 | 判断基準 |
|----------|----------|----------|
| music-library.html へのセッション数 | 月1回 | 旧カテゴリURLからの流入が確認できること |
| music_top.htm からのバナークリック率 | 月1回 | 移行誘導の効果確認 |
| 直帰率・滞在時間（music-library.html） | 月1回 | 移行後にユーザー品質が維持されていること |

---

## music_top.htm 301移行の判断基準

**現状**: バナー設置済み（案B'）。段階移行中。

**301リダイレクトを実行するタイミング（以下のいずれかを満たした時点）:**

- [ ] Search ConsoleでのSEO評価（表示回数・クリック数）が music-library.html に十分移転している
- [ ] music_top.htm の月間クリック数が3ヶ月連続で減少傾向にある
- [ ] 移行バナー設置から3ヶ月が経過し、ユーザーへの周知が完了したと判断できる

**実行手順:**
1. `.htaccess` に以下を追加:
   ```apache
   Redirect 301 /music_gallery/music_top.htm /music-library.html
   ```
2. Search Console で URLの変更を通知（旧URL削除リクエスト）
3. 本表の #15 の状態を「✅ 完了」に更新

---

## UX強化フェーズ: 再生連動背景演出（2026-03-20 完了）

**概要**: music-library.html に再生状態と連動する背景画像演出を実装。

| 項目 | 内容 |
|------|------|
| idle背景 | `/images/library-bg.webp`（図書館・36KB）— ページ読み込み時から opacity 0.10 で常時表示 |
| 再生時背景 | カテゴリ別 scenic WebP（nightmare / sorrow / happy / shrine / healing / rpg）— opacity 0.13 |
| フェード | アウト 650ms → 画像差し替え → イン 1800ms（初回は即表示） |
| タグ判定 | feeling / style / scene / story タグを照合し SCENE_MAP で優先順位付きマッチ |
| 停止・一時停止 | idle背景に戻す |
| アクセシビリティ | `prefers-reduced-motion: reduce` で transition: none |
| 画像最適化 | sharp（Node.js）でWebP変換。元PNG合計約12MB → 合計約669KB |

**ファイル構成:**
- `assets/css/scenic-bg.css` — #scene-bg レイヤー定義
- `assets/js/scenic-bg.js` — イベント購読・背景切替ロジック
- `images/library-bg.webp` — idle背景（36KB）
- `images/library-bg-source.png` — Ghibli元絵マスター保管
- `images/scenic-*.webp` × 6 — カテゴリ別情景画像
- `package.json` + `node_modules/sharp` — 画像変換ツール（開発用・`.gitignore`済み）

**301リダイレクト**: 本フェーズでは未実施。SEO移行判断基準（上記）に従い別途対応。

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-03-19 | .htaccess作成（#1〜#13 の301リダイレクト設定）|
| 2026-03-19 | music_top.htm にバナー設置（案B'）|
| 2026-03-19 | 本ファイル作成 |
| 2026-03-19 | music_top.htm に canonical 追加（→ /music-library.html）|
| 2026-03-19 | .htaccess に #16〜#21 の6件を追加（opening / cute / halloween / christmas / marriage / relaxation）|
| 2026-03-19 | index.html フッターの無効パラメータ（?scene=shrine）を修正 |
| 2026-03-20 | music/*.html（304件）canonical を各ページURLに修正・og:url 追加 |
| 2026-03-20 | music/index.html canonical から test2026 除去 |
| 2026-03-20 | sitemap.xml 全URL から /test2026/ 除去（157件）|
| 2026-03-20 | music_top.htm h2直下に新MusicLibrary告知バナー追加（案A）|
| 2026-03-20 | music_top.htm サイドバー「楽曲メニュー」に新Music Libraryリンク追加（案B）|
| 2026-03-20 | scenic-bg.css / scenic-bg.js 新規作成（再生連動背景演出）|
| 2026-03-20 | music-library.html に #scene-bg 要素・scenic-bg CSS/JS を組み込み |
| 2026-03-20 | library-bg.webp 生成（36KB / 元PNG 5.9MB → 99%削減）idle背景として採用 |
| 2026-03-20 | scenic 系 WebP 6枚生成（78〜170KB / 元PNG 平均1.7MB → 約90%削減）|
| 2026-03-20 | 元 scenic PNG 6枚・二重拡張子PNG 削除。Ghibli元絵は library-bg-source.png に保管 |
| 2026-04-02 | .htaccess に HTTP→HTTPS リダイレクト（mod_rewrite）追加 |
| 2026-04-02 | .htaccess に /music_gallery/music_top.htm 301追加（新サイト公開に合わせて昇格） |
| 2026-04-02 | .htaccess に /music_gallery/game.htm, /music_gallery/sound_effect.htm, /music_gallery/iphone.htm, /history.htm の301追加 |
