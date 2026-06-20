# -*- coding: utf-8 -*-
"""
H/MIX GALLERY - 曲ページ自動生成スクリプト
=========================================================
現行サイト構造に対応した相対パス版。

ディレクトリ構造:
  /hmix/
    index.html
    music-library.html
    /music/
      n72.html          ← 曲ページ（ID.html形式）
      n82.html
      /n/n72.mp3        ← MP3（prefixごとに分類）
      /c/c1.mp3
    /assets/
      /css/style.css
      /css/music-page.css
      /js/app.js
      /js/tracks.js
    /data/

使い方:
  cd C:/Users/hiro/projects/hmix
  python generate_music_pages.py

出力:
  /music/{id}.html  (各曲ページ)
  /music/index.html (曲一覧)
  sitemap.xml

パスルール（/music/{id}.html から見た相対パス）:
  CSS:     ../assets/css/style.css
  JS:      ../assets/js/app.js
  MP3:     ./{prefix}/{id}.mp3   例: ./n/n72.mp3
  Library: ../music-library.html
  Home:    ../
"""

import json
import os
import re
from datetime import datetime

# ─────────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────────
SITE_DIR   = os.path.dirname(os.path.abspath(__file__))
BASE_URL   = os.environ.get("HMIX_BASE_URL", "https://www.hmix.net").rstrip("/")
OUTPUT_DIR = os.environ.get("HMIX_OUTPUT_DIR", os.path.join(SITE_DIR, "music"))

# カテゴリ表示名
CATEGORY_LABELS = {
    "japanese": "和風 / Japanese",
    "horror":   "ホラー / Horror",
    "sad":      "悲しい / Sad",
    "healing":  "癒し / Healing",
    "battle":   "バトル / Battle",
    "fantasy":  "ファンタジー / Fantasy",
    "happy":    "楽しい / Happy",
}

# カテゴリ絵文字
CATEGORY_ICONS = {
    "japanese": "⛩",
    "horror":   "👻",
    "sad":      "💧",
    "healing":  "🌿",
    "battle":   "⚔",
    "fantasy":  "✨",
    "happy":    "🌸",
}

# ─────────────────────────────────────────────────
# tracks.js を直接読み込む（唯一のデータソース）
# ─────────────────────────────────────────────────
def load_tracks():
    """
    assets/js/tracks.js を読み込んでトラックリストを返す。
    tracks.js は唯一のデータソース。
    """
    import re as _re
    js_path = os.path.join(SITE_DIR, 'assets', 'js', 'tracks.js')
    with open(js_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    
    # const TRACKS = [ ... ]; の中身を抽出（旧版の const tracks にも対応）
    m = _re.search(r'const\s+(?:TRACKS|tracks)\s*=\s*(\[.*?\])\s*;', raw, _re.DOTALL)
    if not m:
        raise ValueError('tracks.js のデータ構造が読み取れません。const TRACKS = [...] 形式で記述してください。')
    
    # JSの配列をPythonのJSONに変換
    js_array = m.group(1)
    
    # JSのコメントを削除
    js_array = _re.sub(r'//[^\n]*', '', js_array)
    js_array = _re.sub(r'/\*.*?\*/', '', js_array, flags=_re.DOTALL)
    
    # トレイリングカンマを削除（JSON不要）
    js_array = _re.sub(r',\s*(\])', r'\1', js_array)
    js_array = _re.sub(r',\s*(\})', r'\1', js_array)
    
    # プロパティ名にクォートを追加（JSON形式に変換）
    js_array = _re.sub(r'([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', js_array)
    
    # シングルクォートをダブルクォートに変換（値のみ、プロパティ名は除く）
    js_array = _re.sub(r":\s*'([^']*)'", lambda m: ': "' + m.group(1).replace('"', '\\"') + '"', js_array)
    js_array = _re.sub(r"\[\s*'([^']*)'", lambda m: '["' + m.group(1).replace('"', '\\"') + '"', js_array)
    js_array = _re.sub(r",\s*'([^']*)'", lambda m: ', "' + m.group(1).replace('"', '\\"') + '"', js_array)
    
    import json as _json
    try:
        tracks = _json.loads(js_array)
    except _json.JSONDecodeError as e:
        # エラー箇所をデバッグ出力
        pos = e.pos
        context = js_array[max(0, pos-80):pos+80]
        raise ValueError(f'tracks.js JSONパースエラー (pos={pos}): ...{context}...') from e
    return tracks

# ─────────────────────────────────────────────────
# MP3の絶対パス → 相対パス変換
#   /music/n/n72.mp3  →  ./n/n72.mp3
# ─────────────────────────────────────────────────
def mp3_to_relative(mp3_abs):
    """
    tracks.jsの絶対パス形式 /music/{prefix}/{id}.mp3 を
    /music/{id}.html から見た相対パス ./prefix/id.mp3 に変換する
    """
    # /music/n/n72.mp3 → ./n/n72.mp3
    m = re.match(r'^/music/([a-z]+)/([a-z0-9]+\.mp3)$', mp3_abs)
    if m:
        return f"./{m.group(1)}/{m.group(2)}"
    # パターン外はそのまま返す（フォールバック）
    return mp3_abs

# ─────────────────────────────────────────────────
# Related Tracks を計算する
# ─────────────────────────────────────────────────
def get_related_tracks(track, all_tracks, count=4):
    scores = []
    for other in all_tracks:
        if other["id"] == track["id"]:
            continue
        score = 0
        # feelingの一致
        common_feeling = set(other.get("feeling", [])) & set(track.get("feeling", []))
        score += len(common_feeling) * 3
        # styleの一致
        common_style = set(other.get("style", [])) & set(track.get("style", []))
        score += len(common_style) * 2
        # sceneの一致
        common_scene = set(other.get("scene", [])) & set(track.get("scene", []))
        score += len(common_scene) * 3
        # storyの一致
        common_story = set(other.get("story", [])) & set(track.get("story", []))
        score += len(common_story) * 2
        if score > 0:
            scores.append((score, other))
    scores.sort(key=lambda x: -x[0])
    return [t for _, t in scores[:count]]

# ─────────────────────────────────────────────────
# 曲ページHTMLを生成する
# ─────────────────────────────────────────────────
# タグの日本語ラベル
TAG_LABELS_JA = {
    # feeling
    "epic": "勇壮", "gentle": "優しい", "sad": "悲しい", "happy": "楽しい",
    "dark": "暗い", "mysterious": "神秘", "suspense": "緊迫", "horror": "ホラー",
    # style
    "japanese": "和風", "fantasy": "ファンタジー", "celtic": "ケルト",
    "medieval": "中世", "asian": "アジアン", "futuristic": "近未来",
    "electronic": "電子音", "oriental": "オリエンタル",
    "piano": "ピアノ", "acoustic": "アコースティック",
    # scene
    "battle": "戦闘", "boss": "ボス", "town": "町", "village": "村",
    "field": "フィールド", "forest": "森", "night": "夜", "travel": "旅",
    "dungeon": "ダンジョン", "ruins": "遷跡", "cave": "洞窟",
    "festival": "祭り", "opening": "オープニング", "ending": "エンディング",
    "hot_spring": "温泉", "shrine": "神社", "samurai": "侍",
    # story
    "memory": "思い出", "reunion": "再会", "farewell": "別れ",
    "victory": "勝利", "defeat": "敗北", "peaceful": "平和",
    "dream": "夢", "conspiracy": "陰謀"
}

GENRE_LINK_RULES = [
    ("japanese", "和風BGM", {"style": ["japanese", "japanese_horror", "oriental"], "scene": ["shrine", "samurai", "festival"]}),
    ("horror", "ホラーBGM", {"feeling": ["scary"], "style": ["japanese_horror", "western_horror"]}),
    ("sad", "悲しいBGM・切ないBGM", {"feeling": ["sad"], "story": ["farewell", "memory", "defeat"]}),
    ("healing", "癒しBGM", {"feeling": ["gentle"], "story": ["peaceful", "dream"]}),
    ("fantasy", "ファンタジーBGM", {"style": ["fantasy", "medieval"], "scene": ["field", "forest", "dungeon", "ruins", "village"]}),
    ("battle", "戦闘BGM", {"scene": ["battle", "boss"], "feeling": ["epic", "suspense"]}),
    ("suspense", "サスペンスBGM", {"feeling": ["suspense", "dark"], "scene": ["dungeon", "cave", "night"]}),
    ("celtic", "ケルト風BGM", {"style": ["celtic"], "scene": ["field", "forest", "travel"]}),
    ("electronic", "近未来BGM", {"style": ["electronic", "futuristic"]}),
    ("happy", "楽しいBGM・明るいBGM", {"feeling": ["happy", "cute"], "story": ["victory", "peaceful"]}),
    ("epic", "壮大なBGM", {"feeling": ["epic"], "scene": ["opening", "battle", "boss"]}),
]

def get_track_genre_links(track, limit=4):
    values_by_cat = {
        "feeling": set(track.get("feeling", [])),
        "style": set(track.get("style", [])),
        "scene": set(track.get("scene", [])),
        "story": set(track.get("story", [])),
    }
    scored = []
    for slug, label, rules in GENRE_LINK_RULES:
        score = 0
        for cat, ids in rules.items():
            score += len(values_by_cat.get(cat, set()) & set(ids))
        if score:
            scored.append((score, slug, label))
    scored.sort(key=lambda item: (-item[0], item[1]))
    return [(slug, label) for _, slug, label in scored[:limit]]

def generate_track_page(track, all_tracks):
    track_id   = track["id"]        # 例: n72
    title      = track["title"]
    mp3_abs    = track["mp3"]       # 例: /music/n/n72.mp3
    mp3_rel    = mp3_to_relative(mp3_abs)   # 例: ./n/n72.mp3
    description = track.get("description", "")
    feeling    = track.get("feeling", [])
    style      = track.get("style", [])
    scene      = track.get("scene", [])
    story      = track.get("story", [])
    duration   = track.get("duration", "")

    # カテゴリは新タグ構造から自動判定
    # styleの先頭を使用、なければfeelingの先頭
    category = style[0] if style else (feeling[0] if feeling else "")

    # Related Tracks
    related = get_related_tracks(track, all_tracks, count=4)

    # カテゴリラベル
    cat_label = CATEGORY_LABELS.get(category, TAG_LABELS_JA.get(category, category))
    cat_icon  = CATEGORY_ICONS.get(category, "♪")

    # 全タグをまとめる
    all_tags = feeling + style + scene + story

    # SEO keywords
    keywords = ", ".join(all_tags + ["free bgm", "royalty free music", "H/MIX GALLERY"])

    # Related Tracks HTML
    # 関連曲のリンクも ../music/{id}.html 形式（同じ /music/ 階層なので {id}.html）
    related_html = ""
    for r in related:
        r_style     = r.get("style", [])
        r_feeling   = r.get("feeling", [])
        r_category  = r_style[0] if r_style else (r_feeling[0] if r_feeling else "")
        r_cat_icon  = CATEGORY_ICONS.get(r_category, "♪")
        r_all_tags  = r_feeling + r_style + r.get("scene", []) + r.get("story", [])
        r_tags_html = "".join(f'<span class="tag">{TAG_LABELS_JA.get(t, t)}</span>' for t in r_all_tags[:3])
        r_mp3_rel   = mp3_to_relative(r["mp3"])
        related_html += f"""
        <article class="related-card">
          <div class="related-card-header">
            <span class="related-cat">{r_cat_icon}</span>
            <div class="related-info">
              <h3 class="related-title">{r["title"]}</h3>
              <p class="related-title-en">{r.get("titleEn", "")}</p>
            </div>
            <span class="related-duration">{r.get("duration", "")}</span>
          </div>
          <div class="related-tags">{r_tags_html}</div>
          <div class="related-actions">
            <button class="btn-play-small" onclick="playTrack('{r_mp3_rel}', '{r["title"]}')" aria-label="{r["title"]}を再生">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Play
            </button>
            <a href="./{r["id"]}.html" class="btn-detail-small">Detail</a>
          </div>
        </article>"""

    # Scene Tags HTML（sceneタグからMusic Libraryへのリンク）
    scene_links_html = ""
    for st in scene[:5]:
        label = TAG_LABELS_JA.get(st, st)
        scene_links_html += f'<a href="../music-library.html?scene={st}" class="scene-link">{label}</a>\n'
    # sceneがなければfeelingタグを使用
    if not scene:
        for ft in feeling[:3]:
            label = TAG_LABELS_JA.get(ft, ft)
            scene_links_html += f'<a href="../music-library.html?feeling={ft}" class="scene-link">{label}</a>\n'

    genre_links_html = ""
    for slug, label in get_track_genre_links(track):
        genre_links_html += f'<a href="../genre/{slug}.html" class="genre-link">{label}</a>\n'
    if not genre_links_html:
        genre_links_html = '<a href="../music-library.html" class="genre-link">フリーBGM一覧</a>\n'

    # Tags HTML（新タグ構造対応）
    feeling_html = "".join(f'<span class="tag tag-feeling tag-{t}">{TAG_LABELS_JA.get(t, t)}</span>' for t in feeling)
    style_html   = "".join(f'<span class="tag tag-style tag-{t}">{TAG_LABELS_JA.get(t, t)}</span>' for t in style)
    scene_html   = "".join(f'<span class="tag tag-scene tag-{t}">{TAG_LABELS_JA.get(t, t)}</span>' for t in scene)
    story_html   = "".join(f'<span class="tag tag-story tag-{t}">{TAG_LABELS_JA.get(t, t)}</span>' for t in story)
    tags_html    = feeling_html + style_html + scene_html + story_html
    mood_html    = ""  # 旧フィールドは廃止

    # JSON-LD 構造化データ
    json_ld = {
        "@context": "https://schema.org",
        "@type": "MusicRecording",
        "name": title,
        "description": description,
        "genre": cat_label,
        "duration": f"PT{duration.replace(':', 'M')}S" if duration else "",
        "url": f"{BASE_URL}/music/{track_id}.html",
        "audio": {
            "@type": "AudioObject",
            "contentUrl": f"https://www.hmix.net{mp3_abs}",
            "encodingFormat": "audio/mpeg"
        },
        "byArtist": {
            "@type": "Person",
            "name": "Hirokazu Akiyama",
            "url": "https://www.hmix.net/composer.html"
        },
        "inAlbum": {
            "@type": "MusicAlbum",
            "name": "H/MIX GALLERY",
            "url": "https://www.hmix.net/"
        },
        "license": "https://www.hmix.net/music_gallery/info.htm",
        "keywords": keywords
    }

    # BreadcrumbList
    breadcrumb_ld = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "H/MIX GALLERY",  "item": "https://www.hmix.net/"},
            {"@type": "ListItem", "position": 2, "name": "Music Library",  "item": f"{BASE_URL}/music-library.html"},
            {"@type": "ListItem", "position": 3, "name": title,            "item": f"{BASE_URL}/music/{track_id}.html"}
        ]
    }

    html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- SEO -->
  <title>{title} - {cat_label} | H/MIX GALLERY</title>
  <meta name="description" content="{description} Free for YouTube, games and films.">
  <meta name="keywords" content="{keywords}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{BASE_URL}/music/{track_id}.html">

  <!-- Open Graph -->
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="{title} | H/MIX GALLERY">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{BASE_URL}/music/{track_id}.html">
  <meta property="og:site_name" content="H/MIX GALLERY">
  <meta property="og:locale" content="ja_JP">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{title} | H/MIX GALLERY">
  <meta name="twitter:description" content="{description}">

  <!-- Structured Data: MusicRecording -->
  <script type="application/ld+json">
{json.dumps(json_ld, ensure_ascii=False, indent=2)}
  </script>

  <!-- Structured Data: BreadcrumbList -->
  <script type="application/ld+json">
{json.dumps(breadcrumb_ld, ensure_ascii=False, indent=2)}
  </script>

  <!-- Styles（/music/{track_id}.html から ../assets/css/ を参照） -->
  <link rel="stylesheet" href="../assets/css/style.css">
  <link rel="stylesheet" href="../assets/css/music-page.css">
</head>
<body class="track-page">

  <!-- ナビゲーション -->
  <header class="site-header" id="site-header">
    <div class="header-inner">
      <a href="../" class="site-logo" aria-label="H/MIX GALLERY ホーム">
        <span class="logo-text">H/MIX GALLERY</span>
        <span class="logo-sub">Free Music Library</span>
      </a>
      <nav class="site-nav" aria-label="メインナビゲーション">
        <ul class="nav-list">
          <li><a href="../" class="nav-link">Home</a></li>
          <li><a href="../music-library.html" class="nav-link">Music Library</a></li>
          <li><a href="https://www.hmix.net/music_gallery/info.htm" class="nav-link">License</a></li>
          <li><a href="../composer.html" class="nav-link">Composer</a></li>
          <li><a href="https://www.hmix.net/contact.htm" class="nav-link nav-link--cta">Contact</a></li>
        </ul>
        <button class="nav-toggle" aria-label="メニューを開く" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </nav>
    </div>
  </header>

  <!-- パンくずリスト -->
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li><a href="../">H/MIX GALLERY</a></li>
      <li><span aria-hidden="true">›</span></li>
      <li><a href="../music-library.html">Music Library</a></li>
      <li><span aria-hidden="true">›</span></li>
      <li aria-current="page">{title}</li>
    </ol>
  </nav>

  <!-- メインコンテンツ -->
  <main class="track-main">

    <!-- ヒーローセクション -->
    <section class="track-hero">
      <div class="track-hero-inner">
        <div class="track-category-badge">
          <span class="cat-icon">{cat_icon}</span>
          <span class="cat-label">{cat_label}</span>
        </div>
        <h1 class="track-title">{title}</h1>
        <p class="track-description">{description}</p>

        <!-- タグ -->
        <div class="track-tags" aria-label="Tags">
          {tags_html}
        </div>
        <div class="track-moods" aria-label="Mood">
          {mood_html}
        </div>
      </div>
    </section>

    <!-- プレイヤーセクション -->
    <section class="track-player-section">
      <div class="track-player-card">
        <div class="player-artwork">
          <div class="player-artwork-inner">
            <span class="player-cat-icon">{cat_icon}</span>
          </div>
          <div class="player-visualizer" id="visualizer">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        <div class="player-controls">
          <div class="player-info">
            <span class="player-title">{title}</span>
            <span class="player-duration">{duration}</span>
          </div>

          <!-- HTML5 Audio Player（MP3は相対パス: ./prefix/id.mp3） -->
          <audio id="main-audio" preload="metadata" playsinline webkit-playsinline>
            <source src="{mp3_rel}" type="audio/mpeg">
          </audio>

          <div class="player-buttons">
            <button class="btn-play-main" id="play-btn" onclick="togglePlay()" aria-label="再生/停止">
              <svg class="icon-play" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              <svg class="icon-pause" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="display:none">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
              <span class="play-label">Play</span>
            </button>

            <div class="player-progress">
              <input type="range" id="progress-bar" min="0" max="100" value="0" class="progress-input" aria-label="再生位置">
              <div class="progress-time">
                <span id="current-time">0:00</span>
                <span id="total-time">{duration}</span>
              </div>
            </div>
          </div>

          <!-- ダウンロード・アクション -->
          <div class="player-actions">
            <a href="{mp3_rel}" class="btn-download" download aria-label="MP3をダウンロード">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download MP3
            </a>
            <button class="btn-copy-credit" onclick="copyCreditUrl('/music/{track_id}.html')" aria-label="曲ページURLをコピー">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Credit URL
            </button>
          </div>

          <!-- ライセンス注記 -->
          <p class="license-note">
            非商用利用は無料。商用利用は<a href="https://www.hmix.net/contact.htm">お問い合わせ</a>ください。
            <a href="https://www.hmix.net/music_gallery/info.htm">ご利用規約 →</a>
          </p>
        </div>
      </div>
    </section>

    <!-- シーンタグセクション -->
    <section class="track-scenes">
      <div class="section-inner">
        <h2 class="section-title-small">シーンから探す <span class="section-title-en">Explore Similar Scenes</span></h2>
        <p class="section-subtitle">この曲に合うシーン。クリックすると似た雰囲気の曲が見つかります。</p>
        <div class="scene-tags-list">
          {scene_links_html}
        </div>
        <a href="../music-library.html" class="btn-scene-search">
          ← MUSIC LIBRARYで探す
        </a>
      </div>
    </section>

    <!-- Genre Links -->
    <section class="track-genre-links">
      <div class="section-inner">
        <h2 class="section-title-small">近い雰囲気のBGM <span class="section-title-en">Similar BGM Genres</span></h2>
        <p class="section-subtitle">この曲のタグに近いジャンルページです。用途や雰囲気から、続けて曲を探せます。</p>
        <div class="genre-links-list">
          {genre_links_html}
        </div>
      </div>
    </section>

    <!-- Related Tracks -->
    <section class="related-tracks">
      <div class="section-inner">
        <h2 class="section-title">
          <span class="section-icon">✦</span>
          同じ雰囲気の曲 <span class="section-title-en">Related Tracks</span>
        </h2>
        <p class="section-subtitle">この音楽と共鳴する精霊たち。</p>
        <div class="related-grid">
          {related_html}
        </div>
      </div>
    </section>

    <!-- 回遊導線 -->
    <section class="track-navigation">
      <div class="nav-links-grid">
        <a href="../" class="nav-link-card">
          <span class="nav-link-icon">🏠</span>
          <span class="nav-link-title">ホーム</span>
          <span class="nav-link-desc">H/MIX GALLERY — 音楽の旅の入口</span>
        </a>
        <a href="../music-library.html" class="nav-link-card">
          <span class="nav-link-icon">🎵</span>
          <span class="nav-link-title">Music Library</span>
          <span class="nav-link-desc">全曲を情景・雰囲気・用途から探す</span>
        </a>
        <a href="../music-library.html?scene=shrine" class="nav-link-card">
          <span class="nav-link-icon">⛩</span>
          <span class="nav-link-title">和風・神社</span>
          <span class="nav-link-desc">Japanese BGM — 和風・神社・祭りの音楽</span>
        </a>
        <a href="../music-library.html?scene=horror" class="nav-link-card">
          <span class="nav-link-icon">👻</span>
          <span class="nav-link-title">ホラー・怪異</span>
          <span class="nav-link-desc">Horror BGM — 怖い・暗い・ホラー系の音楽</span>
        </a>
      </div>
    </section>

  </main>

  <!-- フッター -->
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="footer-logo">H/MIX GALLERY</span>
          <p class="footer-tagline">音楽の心象風景を旅する。</p>
          <p class="footer-desc">物語・ゲーム・映像のための無料BGMライブラリ。</p>
        </div>
        <nav class="footer-nav" aria-label="フッターナビゲーション">
          <div class="footer-nav-col">
            <h4 class="footer-nav-heading">Music</h4>
            <ul class="footer-nav-list">
              <li><a href="../music-library.html">Music Library</a></li>
              <li><a href="../music-library.html?scene=shrine">和風BGM</a></li>
              <li><a href="../music-library.html?scene=horror">ホラーBGM</a></li>
              <li><a href="../music-library.html?feeling=healing">癒しBGM</a></li>
              <li><a href="../music-library.html?scene=battle">バトルBGM</a></li>
            </ul>
          </div>
          <div class="footer-nav-col">
            <h4 class="footer-nav-heading">Info</h4>
            <ul class="footer-nav-list">
              <li><a href="https://www.hmix.net/music_gallery/info.htm">ご利用規約</a></li>
              <li><a href="../composer.html">作曲家プロフィール</a></li>
              <li><a href="../contact.html">お問い合わせ</a></li>
            </ul>
          </div>
        </nav>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">&copy; 2002–2026 H/MIX GALLERY / Hirokazu Akiyama. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <!-- Shared App Script（../assets/js/app.js） -->
  <script src="../assets/js/app.js" defer></script>

  <!-- JavaScript -->
  <script>
    // ─── Audio Player ─────────────────────────────────────────────
    const audio = document.getElementById('main-audio');
    const playBtn = document.getElementById('play-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const visualizer = document.getElementById('visualizer');

    function togglePlay() {{
      if (audio.paused) {{
        audio.play();
        playBtn.querySelector('.icon-play').style.display = 'none';
        playBtn.querySelector('.icon-pause').style.display = 'inline';
        playBtn.querySelector('.play-label').textContent = 'Pause';
        visualizer.classList.add('playing');
      }} else {{
        audio.pause();
        playBtn.querySelector('.icon-play').style.display = 'inline';
        playBtn.querySelector('.icon-pause').style.display = 'none';
        playBtn.querySelector('.play-label').textContent = 'Play';
        visualizer.classList.remove('playing');
      }}
    }}

    audio.addEventListener('timeupdate', () => {{
      if (audio.duration) {{
        progressBar.value = (audio.currentTime / audio.duration) * 100;
        const m = Math.floor(audio.currentTime / 60);
        const s = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
        currentTimeEl.textContent = m + ':' + s;
      }}
    }});

    progressBar.addEventListener('input', () => {{
      if (audio.duration) {{
        audio.currentTime = (progressBar.value / 100) * audio.duration;
      }}
    }});

    audio.addEventListener('ended', () => {{
      playBtn.querySelector('.icon-play').style.display = 'inline';
      playBtn.querySelector('.icon-pause').style.display = 'none';
      playBtn.querySelector('.play-label').textContent = 'Play';
      visualizer.classList.remove('playing');
      progressBar.value = 0;
    }});

    // ─── Related Track Player ───────────────────
    function playTrack(src, title) {{
      audio.src = src;
      audio.play();
      playBtn.querySelector('.icon-play').style.display = 'none';
      playBtn.querySelector('.icon-pause').style.display = 'inline';
      playBtn.querySelector('.play-label').textContent = 'Pause';
      visualizer.classList.add('playing');
    }}

    // ─── Copy Credit URL ─────────────────────────────────
    function copyCreditUrl(pageUrl) {{
      const fullUrl = 'https://www.hmix.net' + pageUrl;
      navigator.clipboard.writeText(fullUrl).then(() => {{
        const btn = document.querySelector('.btn-copy-credit');
        const original = btn.innerHTML;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        btn.style.borderColor = 'rgba(45,90,61,0.6)';
        btn.style.color = '#2D5A3D';
        setTimeout(() => {{
          btn.innerHTML = original;
          btn.style.borderColor = '';
          btn.style.color = '';
        }}, 2000);
      }}).catch(() => {{
        const ta = document.createElement('textarea');
        ta.value = fullUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('URL copied: ' + fullUrl);
      }});
    }}
  </script>
</body>
</html>"""

    return html

# ─────────────────────────────────────────────────
# sitemap.xml を生成する
# ─────────────────────────────────────────────────
def generate_sitemap(tracks):
    today = datetime.now().strftime("%Y-%m-%d")
    urls = [
        f"""  <url>
    <loc>{BASE_URL}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>""",
        f"""  <url>
    <loc>{BASE_URL}/music-library.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>""",
    ]

    for track in tracks:
        urls.append(f"""  <url>
    <loc>{BASE_URL}/music/{track["id"]}.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>""")

    sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""
    return sitemap

# ─────────────────────────────────────────────────
# 曲一覧ページ（/music/index.html）を生成する
# ─────────────────────────────────────────────────
def generate_music_index(tracks):
    by_category = {}
    for t in tracks:
        # 新タグ構造対応: styleの先頭、なければfeelingの先頭、それもなければother
        t_style   = t.get("style", [])
        t_feeling = t.get("feeling", [])
        cat = t_style[0] if t_style else (t_feeling[0] if t_feeling else t.get("category", "other"))
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(t)

    sections_html = ""
    for cat, cat_tracks in by_category.items():
        icon  = CATEGORY_ICONS.get(cat, "♪")
        label = CATEGORY_LABELS.get(cat, TAG_LABELS_JA.get(cat, cat))
        tracks_html = ""
        for t in cat_tracks:
            t_style   = t.get("style", [])
            t_feeling = t.get("feeling", [])
            t_all_tags = t_feeling + t_style + t.get("scene", []) + t.get("story", [])
            t_tags_preview = "・".join(TAG_LABELS_JA.get(tg, tg) for tg in t_all_tags[:3])
            tracks_html += f"""
      <article class="index-track-card">
        <div class="index-track-info">
          <h3 class="index-track-title">{t["title"]}</h3>
          <p class="index-track-en">{t_tags_preview}</p>
          <p class="index-track-desc">{t.get("description", "")[:80]}...</p>
        </div>
        <div class="index-track-actions">
          <span class="index-duration">{t.get("duration", "")}</span>
          <a href="./{t["id"]}.html" class="btn-detail-index">Detail</a>
        </div>
      </article>"""

        sections_html += f"""
    <section class="index-category-section">
      <h2 class="index-cat-title">{icon} {label}</h2>
      <div class="index-track-list">
        {tracks_html}
      </div>
    </section>"""

    html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Music Library - All Tracks | H/MIX GALLERY</title>
  <meta name="description" content="Browse all free BGM tracks by H/MIX GALLERY. Japanese, horror, sad, healing, and battle music for YouTube videos, games and films.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{BASE_URL}/music/">
  <link rel="stylesheet" href="../assets/css/style.css">
  <link rel="stylesheet" href="../assets/css/music-page.css">
</head>
<body class="track-page music-index-page">
  <header class="site-header" id="site-header">
    <div class="header-inner">
      <a href="../" class="site-logo" aria-label="H/MIX GALLERY ホーム">
        <span class="logo-text">H/MIX GALLERY</span>
        <span class="logo-sub">Free Music Library</span>
      </a>
      <nav class="site-nav" aria-label="メインナビゲーション">
        <ul class="nav-list">
          <li><a href="../" class="nav-link">Home</a></li>
          <li><a href="../music-library.html" class="nav-link">Music Library</a></li>
          <li><a href="https://www.hmix.net/music_gallery/info.htm" class="nav-link">License</a></li>
          <li><a href="../composer.html" class="nav-link">Composer</a></li>
          <li><a href="https://www.hmix.net/contact.htm" class="nav-link nav-link--cta">Contact</a></li>
        </ul>
        <button class="nav-toggle" aria-label="メニューを開く" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </nav>
    </div>
  </header>

  <main class="music-index-main">
    <div class="music-index-header">
      <h1>Music Library</h1>
      <p>Free BGM for YouTube, games and films. {len(tracks)} tracks available.</p>
      <a href="../music-library.html" class="btn-scene-top">🔍 Find by Scene</a>
    </div>
    {sections_html}
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="footer-logo">H/MIX GALLERY</span>
          <p class="footer-tagline">音楽の心象風景を旅する。</p>
          <p class="footer-desc">物語・ゲーム・映像のための無料BGMライブラリ。</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">&copy; 2002–2026 H/MIX GALLERY / Hirokazu Akiyama. All rights reserved.</p>
      </div>
    </div>
  </footer>
  <script src="../assets/js/app.js" defer></script>
</body>
</html>"""
    return html

# ─────────────────────────────────────────────────
# メイン処理
# ─────────────────────────────────────────────────
def main():
    print("H/MIX GALLERY 曲ページ生成スクリプト")
    print("=" * 55)
    print(f"出力先: {OUTPUT_DIR}/")
    print(f"パス方式: 相対パス（../assets/css/ など）")
    print()

    # tracks_data.py を読み込む
    print("tracks_data.py を読み込み中...")
    tracks = load_tracks()
    print(f"  {len(tracks)} 曲を読み込みました")

    # 出力ディレクトリ作成
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 各曲ページを生成（/music/{id}.html 形式）
    print("\n曲ページを生成中...")
    generated = 0
    for track in tracks:
        track_id  = track["id"]
        page_path = os.path.join(OUTPUT_DIR, f"{track_id}.html")

        html = generate_track_page(track, tracks)
        with open(page_path, "w", encoding="utf-8") as f:
            f.write(html)

        generated += 1
        print(f"  [{generated:02d}/{len(tracks)}] /music/{track_id}.html ✓")

    # sitemap.xml を生成
    print("\nsitemap.xml を生成中...")
    sitemap = generate_sitemap(tracks)
    sitemap_path = os.path.join(SITE_DIR, "sitemap.xml")
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(sitemap)
    print(f"  sitemap.xml ✓ ({len(tracks) + 2} URLs)")

    # 曲一覧ページを生成
    print("\n曲一覧ページを生成中...")
    index_html = generate_music_index(tracks)
    index_path = os.path.join(OUTPUT_DIR, "index.html")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print(f"  /music/index.html ✓")

    print("\n" + "=" * 55)
    print(f"完了！ {generated} ページ生成しました")
    print()
    print("パス確認:")
    print("  CSS:  ../assets/css/style.css")
    print("  JS:   ../assets/js/app.js")
    print("  MP3:  ./n/n72.mp3（相対パス）")
    print("  Home: ../")
    print("  Lib:  ../music-library.html")
    print()
    print("拡張方法:")
    print("  tracks_data.py に曲データを追加して再実行するだけです。")

if __name__ == "__main__":
    if os.environ.get("HMIX_ALLOW_LEGACY_MUSIC_GENERATOR") != "1":
        raise SystemExit(
            "ABORTED: generate_music_pages.py rewrites /music/*.html with the legacy track-detail template. "
            "Do not run it for SEO/internal-link edits. Set HMIX_ALLOW_LEGACY_MUSIC_GENERATOR=1 only after "
            "backing up /music and confirming the current track-detail design template has been ported."
        )
    main()
