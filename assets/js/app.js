/**
 * H/MIX GALLERY - Main Application Script
 * 音楽の小さな神社
 */

'use strict';

// ===== HEADER SCROLL EFFECT =====
const header = document.getElementById('site-header');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (scrollY > 60) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
  lastScrollY = scrollY;
}, { passive: true });

// ===== MOBILE NAV TOGGLE =====
const navToggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav-list');

function closeNav() {
  navList.classList.remove('open');
  navList.querySelectorAll('.nav-item--submenu-open').forEach((item) => {
    item.classList.remove('nav-item--submenu-open');
    const link = item.querySelector('.nav-link');
    if (link) link.setAttribute('aria-expanded', 'false');
  });
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.classList.remove('active');
}

if (navToggle && navList) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
    navToggle.classList.toggle('active', isOpen);
  });

  // aria初期化のみ（クリックのトグルは下の委譲ハンドラに一本化）
  // ※以前はここでも click を張っており、委譲ハンドラと二重発火→即開閉でモバイルのドロップダウンが開かなかった
  navList.querySelectorAll('.nav-item--dropdown > .nav-link').forEach((dropdownLink) => {
    dropdownLink.setAttribute('aria-expanded', 'false');
  });

  // メニュー項目クリックで閉じる
  navList.addEventListener('click', (e) => {
    const dropdownLink = e.target.closest('.nav-item--dropdown > .nav-link');
    if (dropdownLink && navList.classList.contains('open')) {
      e.preventDefault();
      const item = dropdownLink.closest('.nav-item--dropdown');
      const isOpen = item.classList.toggle('nav-item--submenu-open');
      dropdownLink.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      return;
    }

    if (e.target.closest('.nav-link')) {
      closeNav();
    }
  });

  // メニュー外クリックで閉じる
  document.addEventListener('click', (e) => {
    if (navList.classList.contains('open') &&
        !navList.contains(e.target) &&
        !navToggle.contains(e.target)) {
      closeNav();
    }
  });
}

// ===== HERO PARTICLES =====
function initParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  const count = 30;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const x = Math.random() * 100;
    const delay = Math.random() * 15;
    const duration = 10 + Math.random() * 20;
    const size = Math.random() < 0.3 ? 3 : 2;
    const opacity = 0.3 + Math.random() * 0.5;

    particle.style.cssText = `
      left: ${x}%;
      bottom: -10px;
      width: ${size}px;
      height: ${size}px;
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
      opacity: ${opacity};
    `;

    container.appendChild(particle);
  }
}

// ===== TODAY'S MUSIC =====
function initTodaysMusic() {
  if (typeof TODAYS_PICKS === 'undefined') return;

  // 日付ベースで今日の曲を選択
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const track = TODAYS_PICKS[dayOfYear % TODAYS_PICKS.length];

  // DOM更新
  const titleEl = document.getElementById('todays-title');
  const titleEnEl = document.getElementById('todays-title-en');
  const categoryEl = document.getElementById('todays-category');
  const descEl = document.getElementById('todays-desc');
  const audioSrc = document.getElementById('todays-audio-src');
  const linkEl = document.getElementById('todays-link');

  if (titleEl) titleEl.textContent = track.title;
  if (titleEnEl) titleEnEl.textContent = track.titleEn;
  if (categoryEl) categoryEl.textContent = track.category;
  if (descEl) descEl.textContent = track.desc;
  if (audioSrc) audioSrc.src = track.mp3;
  if (linkEl) linkEl.href = track.page;

  // 音楽プレイヤー
  const audio = document.getElementById('todays-audio');
  const playBtn = document.getElementById('todays-play-btn');
  const progressBar = document.getElementById('todays-progress');
  const currentTimeEl = document.getElementById('todays-current-time');
  const durationEl = document.getElementById('todays-duration');
  const playIcon = playBtn?.querySelector('.play-icon');
  const pauseIcon = playBtn?.querySelector('.pause-icon');

  if (!audio || !playBtn) return;

  // 音源を再ロード
  audio.load();

  audio.addEventListener('loadedmetadata', () => {
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressBar) progressBar.style.width = pct + '%';
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('ended', () => {
    setPlayState(false);
    if (progressBar) progressBar.style.width = '0%';
    if (currentTimeEl) currentTimeEl.textContent = '0:00';
  });

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(e => console.warn('Audio play failed:', e));
      setPlayState(true);
    } else {
      audio.pause();
      setPlayState(false);
    }
  });

  // プログレスバークリック
  const progressWrap = document.querySelector('.progress-bar-wrap');
  if (progressWrap) {
    progressWrap.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = progressWrap.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    });
  }

  function setPlayState(playing) {
    playBtn.classList.toggle('playing', playing);
    if (playIcon) playIcon.style.display = playing ? 'none' : '';
    if (pauseIcon) pauseIcon.style.display = playing ? '' : 'none';
  }
}

// ===== MUSIC LIBRARY =====
let currentAudio = null;
let currentTrackId = null;

function initMusicLibrary() {
  // 新実装(music-library.js)がロード済みの場合はスキップ
  if (typeof window.HMIX_INIT_LIBRARY === 'function') return;
  if (typeof TRACKS === 'undefined') return;

  const trackList = document.getElementById('track-list');
  const searchInput = document.getElementById('library-search');
  const tagBtns = document.querySelectorAll('.tag-btn');

  let currentTag = 'all';
  let currentQuery = '';

  function renderTracks(tracks) {
    if (!trackList) return;
    trackList.innerHTML = '';

    if (tracks.length === 0) {
      trackList.innerHTML = `
        <div style="text-align:center; padding: 3rem; color: var(--color-text-dim); font-size: 0.875rem;">
          該当する楽曲が見つかりませんでした。
        </div>
      `;
      return;
    }

    tracks.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = 'track-item fade-in-up';
      item.dataset.trackId = track.id;

      const tagHtml = track.tags.map(t => `<span class="track-tag">${tagLabel(t)}</span>`).join('');

      item.innerHTML = `
        <span class="track-num">${String(index + 1).padStart(2, '0')}</span>
        <div class="track-info">
          <div class="track-title">${escapeHtml(track.title)}</div>
          <div class="track-title-en">${escapeHtml(track.titleEn)}</div>
        </div>
        <div class="track-tags">${tagHtml}</div>
        <span class="track-duration">${track.duration}</span>
        <button class="track-play-btn" aria-label="${escapeHtml(track.title)}を再生">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      `;

      // クリックで再生
      const playBtn = item.querySelector('.track-play-btn');
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playTrack(track, item);
      });

      item.addEventListener('click', () => {
        playTrack(track, item);
      });

      trackList.appendChild(item);
    });

    // フェードインアニメーション
    requestAnimationFrame(() => {
      const items = trackList.querySelectorAll('.fade-in-up');
      items.forEach((item, i) => {
        setTimeout(() => item.classList.add('visible'), i * 40);
      });
    });
  }

  function filterTracks() {
    let filtered = TRACKS;

    if (currentTag !== 'all') {
      filtered = filtered.filter(t => t.tags.includes(currentTag));
    }

    if (currentQuery) {
      const q = currentQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.titleEn.toLowerCase().includes(q)
      );
    }

    renderTracks(filtered);
  }

  // タグフィルター
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tagBtns.forEach(b => b.classList.remove('tag-btn--active'));
      btn.classList.add('tag-btn--active');
      currentTag = btn.dataset.tag;
      filterTracks();
    });
  });

  // 検索
  if (searchInput) {
    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentQuery = searchInput.value.trim();
        filterTracks();
      }, 250);
    });
  }

  // 初期表示（最初の12曲）
  renderTracks(TRACKS.slice(0, 12));
}

function playTrack(track, itemEl) {
  // 既存の再生を停止
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  // 既存のアクティブ状態を解除
  document.querySelectorAll('.track-item.playing').forEach(el => {
    el.classList.remove('playing');
    const btn = el.querySelector('.track-play-btn');
    if (btn) btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M8 5v14l11-7z"/>
      </svg>
    `;
  });

  if (currentTrackId === track.id) {
    currentTrackId = null;
    currentAudio = null;
    return;
  }

  // 新しい曲を再生
  const audio = new Audio(track.mp3);
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');
  audio.preload = 'metadata';
  currentAudio = audio;
  currentTrackId = track.id;

  itemEl.classList.add('playing');
  const btn = itemEl.querySelector('.track-play-btn');
  if (btn) btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  `;

  audio.play().catch(e => console.warn('Audio play failed:', e));

  audio.addEventListener('ended', () => {
    itemEl.classList.remove('playing');
    if (btn) btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M8 5v14l11-7z"/>
      </svg>
    `;
    currentTrackId = null;
    currentAudio = null;
  });
}

// ===== SCROLL ANIMATION =====
function initScrollAnimation() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
  });

  document.querySelectorAll('.fade-in-up').forEach(el => {
    observer.observe(el);
  });
}

// ===== UTILITY =====
function formatTime(seconds) {
  if (isNaN(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tagLabel(tag) {
  const labels = {
    japanese: '和風',
    scary: '怖い', horror: 'ホラー', japanese_horror: '和風ホラー', western_horror: '洋風ホラー',
    fun: '楽しい',
    sad: '悲しい',
    battle: 'バトル',
    suspense: 'サスペンス',
    healing: '癒し',
    epic: '壮大',
  };
  return labels[tag] || tag;
}

// ===== SCENE SEARCH UI =====
function initSceneSearch() {
  const input = document.getElementById('scene-search-input');
  const searchBtn = document.getElementById('scene-search-btn');
  const clearBtn = document.getElementById('scene-search-clear');
  const resultsEl = document.getElementById('scene-results');
  const hintBtns = document.querySelectorAll('.scene-hint-btn');

  if (!input || !resultsEl) return;

  // クリアボタンの表示制御
  input.addEventListener('input', () => {
    if (clearBtn) clearBtn.style.display = input.value ? '' : 'none';
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    resultsEl.innerHTML = '';
    input.focus();
  });

  // ヒントボタン
  hintBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.query;
      if (clearBtn) clearBtn.style.display = '';
      runSceneSearch();
    });
  });

  // 検索実行
  searchBtn?.addEventListener('click', runSceneSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSceneSearch();
  });

  function runSceneSearch() {
    const query = input.value.trim();
    if (!query) {
      resultsEl.innerHTML = '';
      return;
    }

    // scene-search.jsの関数を呼び出す
    if (typeof searchByScene !== 'function') {
      console.warn('searchByScene is not loaded');
      return;
    }

    const tracksData = (typeof window.TRACKS !== 'undefined') ? window.TRACKS
                    : (typeof TRACKS !== 'undefined') ? TRACKS : [];
    const results = searchByScene(query, tracksData, 8);
    renderSceneResults(results, query);

    // 結果エリアにスクロール
    setTimeout(() => {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  function renderSceneResults(results, query) {
    if (results.length === 0) {
      resultsEl.innerHTML = `
        <div class="scene-results-status">
          <span class="status-icon">♪</span>
          <p>「${escapeHtml(query)}」に合う楽曲が見つかりませんでした。</p>
          <p style="margin-top: 0.5rem; font-size: 0.75rem;">別のキーワードで試してみてください。</p>
        </div>
      `;
      return;
    }

    const maxScore = results[0].score;

    const header = `
      <div class="scene-results-header">
        <span class="scene-results-label">Search Results</span>
        <span class="scene-results-count">${results.length}曲が見つかりました</span>
      </div>
    `;

    const cards = results.map(({ track, score }, index) => {
      const scorePct = Math.min(100, Math.round((score / maxScore) * 100));

      // タグ表示（最大3つ）
      const _allTags = [...(track.feeling||[]), ...(track.style||[]), ...(track.scene||[])];
      const tagHtml = _allTags.slice(0, 3).map(t =>
        `<span class="scene-card-tag">${escapeHtml(tagLabel(t))}</span>`
      ).join('');
      const moodHtml = '';

      const animDelay = index * 0.06;

      return `
        <div class="scene-result-card" style="animation-delay: ${animDelay}s;">
          <div class="scene-card-score">
            <div class="scene-card-score-bar">
              <div class="scene-card-score-fill" style="width: ${scorePct}%;"></div>
            </div>
            <span class="scene-card-score-num">${score}pt</span>
          </div>

          <div class="scene-card-title-area">
            <div class="scene-card-track-title">${escapeHtml(track.title)}</div>
          </div>

          <p class="scene-card-desc">${escapeHtml(track.description || '')}</p>

          <div class="scene-card-tags">
            ${tagHtml}
            ${moodHtml}
          </div>

          <div class="scene-card-actions">
            <button
              class="scene-card-play-btn"
              data-mp3="${escapeHtml(track.mp3)}"
              data-id="${track.id}"
              aria-label="${escapeHtml(track.title)}を再生"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Play
            </button>
            <a href="${escapeHtml(track.page)}" class="scene-card-detail-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Detail
            </a>
            <a href="${escapeHtml(track.mp3)}" class="scene-card-dl-btn" download>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              MP3
            </a>
          </div>
        </div>
      `;
    }).join('');

    const seeAllBtn = `
      <div class="scene-results-footer">
        <a href="/music-library.html?q=${encodeURIComponent(query)}" class="btn btn--ghost scene-results-see-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          「${escapeHtml(query)}」で Music Library を全件検索
        </a>
      </div>
    `;
    resultsEl.innerHTML = header + `<div class="scene-results-grid">${cards}</div>` + seeAllBtn;

    // Playボタンのイベント登録
    resultsEl.querySelectorAll('.scene-card-play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mp3 = btn.dataset.mp3;
        const id = parseInt(btn.dataset.id);
        const isPlaying = btn.classList.contains('playing');

        // グローバルプレイヤーに接続
        if (window.HMIX_PLAYER) {
          const allTracks = (typeof window.TRACKS !== 'undefined') ? window.TRACKS
                          : (typeof TRACKS !== 'undefined') ? TRACKS : [];
          const track = allTracks.find(t => t.id === id);
          if (track) {
            window.HMIX_PLAYER.playTrack(track, allTracks);
            // ビジュアルフィードバック
            resultsEl.querySelectorAll('.scene-card-play-btn').forEach(b => {
              b.classList.remove('playing');
              b.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5v14l11-7z"/></svg> Play`;
            });
            btn.classList.add('playing');
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Stop`;
          }
          return;
        }

        // フォールバック
        // 全カードの再生状態をリセット
        resultsEl.querySelectorAll('.scene-card-play-btn').forEach(b => {
          b.classList.remove('playing');
          b.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play
          `;
        });

        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }

        if (isPlaying || currentTrackId === id) {
          currentAudio = null;
          currentTrackId = null;
          return;
        }

        const audio = new Audio(mp3);
        audio.setAttribute('playsinline', '');
        audio.setAttribute('webkit-playsinline', '');
        audio.preload = 'metadata';
        currentAudio = audio;
        currentTrackId = id;

        btn.classList.add('playing');
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
          Stop
        `;

        audio.play().catch(e => console.warn('Audio play failed:', e));

        audio.addEventListener('ended', () => {
          btn.classList.remove('playing');
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play
          `;
          currentAudio = null;
          currentTrackId = null;
        });
      });
    });
  }
}

// ===== TODAY'S MUSIC: FAV HELPERS =====
// music-library.js と同一キーを使用して双方向同期
const _HERO_FAV_KEY = 'hmix_favorites';

function _heroIsFav(id) {
  try {
    const ids = JSON.parse(localStorage.getItem(_HERO_FAV_KEY) || '[]');
    return ids.map(String).includes(String(id));
  } catch (e) { return false; }
}

function _heroToggleFav(id) {
  try {
    let ids = JSON.parse(localStorage.getItem(_HERO_FAV_KEY) || '[]').map(String);
    const sid = String(id);
    if (ids.includes(sid)) {
      ids = ids.filter(x => x !== sid);
    } else {
      ids.push(sid);
    }
    localStorage.setItem(_HERO_FAV_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('favorites:updated', {
      detail: { count: ids.length, ids }
    }));
  } catch (e) {}
}

function _syncHeroFavBtn(btn, id) {
  const isFav = _heroIsFav(id);
  btn.classList.toggle('is-fav', isFav);
  btn.setAttribute('aria-label', isFav ? 'お気に入りから削除' : 'お気に入りに追加');
  btn.innerHTML = isFav
    ? `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`;
}

let _heroFavListener = null;

// ===== HERO TODAY'S MUSIC (1曲日替わり表示) v2 =====
function initHeroPlayer() {
  const trackEl = document.getElementById('hero-todays-list');
  const audio = document.getElementById('hero-audio');
  if (!trackEl || !audio) return;

  // tracks変数が利用可能か確認（window.TRACKS → TRACKS → tracks の順でフォールバック）
  const allTracks = (typeof window.TRACKS !== 'undefined') ? window.TRACKS
                  : (typeof TRACKS !== 'undefined') ? TRACKS
                  : (typeof tracks !== 'undefined') ? tracks : [];
  if (!allTracks.length) return;

  // ===== 指定9曲から日替わり1曲を選択 =====
  const DAILY_TITLES = [
    'アメノフトツハシラ',
    '宵祭りの風',
    '望郷の丘',
    'いつかの大地へ',
    '繚乱炎武',
    '伝承の丘',
    '日時計の丘',
    'Moment',
    '志は死なない',
  ];

  // 日付ベースで1日固定（リロードで変わらない）
  const today = new Date();
  const todayIndex = today.getDate() % DAILY_TITLES.length;
  const targetTitle = DAILY_TITLES[todayIndex];

  // tracks.jsから該当曲を取得（タイトル完全一致 → 部分一致でフォールバック）
  let track = allTracks.find(t => t.title === targetTitle)
           || allTracks.find(t => t.title && t.title.includes(targetTitle.slice(0, 4)));

  // 万一見つからない場合は日付シードで幻想系から選択
  if (!track) {
    const PRIORITY_TAGS = new Set(['japanese','fantasy','shrine','forest','gentle','mysterious','village','travel','festival','peaceful']);
    const candidates = allTracks.filter(t => {
      const all = [...(t.feeling||[]), ...(t.style||[]), ...(t.scene||[]), ...(t.story||[])];
      return all.some(x => PRIORITY_TAGS.has(x));
    });
    const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
    const idx = seed % (candidates.length || 1);
    track = candidates[idx] || allTracks[0];
  }

  // TAG_LABELS
  const TAG_LABELS = {
    gentle:'優しい', sad:'悲しい', happy:'楽しい', epic:'勇壮',
    dark:'暗い', mysterious:'神秘', suspense:'緊迫', horror:'ホラー',
    japanese:'和風', fantasy:'幻想', celtic:'ケルト', medieval:'中世',
    oriental:'アジアン', futuristic:'近未来', electronic:'電子音',
    battle:'戦闘', boss:'ボス', town:'街', village:'村', field:'フィールド',
    forest:'森', night:'夜', travel:'旅', dungeon:'ダンジョン', ruins:'遺跡',
    cave:'洞窟', festival:'祭り', opening:'オープニング', ending:'エンディング',
    shrine:'神社', samurai:'サムライ',
    memory:'思い出', reunion:'再会', farewell:'別れ', victory:'勝利',
    defeat:'敗北', peaceful:'平和', dream:'夢', conspiracy:'陰謀',
  };

  // タグ（最大2個）
  const allTags = [...(track.feeling||[]), ...(track.style||[]), ...(track.scene||[]), ...(track.story||[])];
  const tagHtml = allTags.slice(0, 2).map(t =>
    `<span class="hero-track-tag">${TAG_LABELS[t] || t}</span>`
  ).join('');

  let isPlaying = false;

  function stopTrack() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    const playBtn = trackEl.querySelector('.htp-play');
    const stopBtn = trackEl.querySelector('.htp-stop');
    const card = trackEl.querySelector('.hero-daily-card');
    if (playBtn) playBtn.style.display = '';
    if (stopBtn) stopBtn.style.display = 'none';
    if (card) card.classList.remove('playing');
  }

  // 1曲用カードHTML
  trackEl.innerHTML = `
    <div class="hero-daily-card" data-id="${escapeHtml(track.id)}">
      <div class="hero-todays-label">— 今日の音楽 —</div>
      <div class="hero-daily-body">
        <div class="hero-daily-name">${escapeHtml(track.title)}</div>
        <div class="hero-daily-tags">${tagHtml}</div>
      </div>
      <div class="hero-daily-controls">
        <button class="hero-daily-play-btn" aria-label="${escapeHtml(track.title)}を試聴">
          <svg class="htp-play" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
          <svg class="htp-stop" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </button>
        <div class="hero-daily-actions">
          <button class="hero-daily-fav-btn" data-id="${escapeHtml(track.id)}" aria-label="お気に入りに追加"></button>
          <a class="hero-daily-dl-btn" href="${escapeHtml(track.mp3)}" download="${escapeHtml(track.id)}.mp3" aria-label="ダウンロード">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </a>
        </div>
      </div>
      <a class="hero-daily-detail" href="./music/${escapeHtml(track.id)}.html">詳細を見る →</a>
    </div>
  `;

  const card    = trackEl.querySelector('.hero-daily-card');
  const playBtn = trackEl.querySelector('.hero-daily-play-btn');
  const favBtn  = trackEl.querySelector('.hero-daily-fav-btn');

  // 初期 fav 状態
  _syncHeroFavBtn(favBtn, track.id);

  // Fav ボタン
  favBtn.addEventListener('click', () => {
    _heroToggleFav(track.id);
    _syncHeroFavBtn(favBtn, track.id);
  });

  // favorites:updated（music-library.js 側の変更も受け取る）
  if (_heroFavListener) window.removeEventListener('favorites:updated', _heroFavListener);
  _heroFavListener = () => _syncHeroFavBtn(favBtn, track.id);
  window.addEventListener('favorites:updated', _heroFavListener);

  // 再生ボタン
  playBtn.addEventListener('click', () => {
    if (window.HMIX_PLAYER) {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
      const allTracks = (typeof window.TRACKS !== 'undefined') ? window.TRACKS
                      : (typeof TRACKS !== 'undefined') ? TRACKS : [];
      window.HMIX_PLAYER.playTrack(track, allTracks);
      return;
    }
    if (isPlaying) {
      stopTrack();
      return;
    }
    audio.src = track.mp3;
    audio.play().catch(() => {});
    isPlaying = true;
    card.classList.add('playing');
    playBtn.querySelector('.htp-play').style.display = 'none';
    playBtn.querySelector('.htp-stop').style.display = '';
  });

  audio.addEventListener('ended', () => stopTrack());
}

// ===== HERO PARALLAX =====
function ensureSplitHeroImages() {
  var libraryBg = document.querySelector('.hero-half--library .hero-half__bg');
  if (libraryBg && !libraryBg.style.backgroundImage) {
    libraryBg.style.backgroundImage = "url('/assets/images/scenes/medieval.webp')";
  }

  var theaterBg = document.querySelector('.hero-half--theater .hero-half__bg');
  if (theaterBg && !theaterBg.style.backgroundImage) {
    theaterBg.style.backgroundImage = "url('/assets/images/scenes/field.webp')";
  }
}

function initHeroParallax() {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;

  // モバイルではパララックスを無効化（パフォーマンス配慮）
  if (window.innerWidth < 768) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroHeight = document.querySelector('.hero')?.offsetHeight || window.innerHeight;
        // スクロール量の5〜10%の微弱移動
        const translateY = Math.min(scrollY * 0.07, heroHeight * 0.1);
        heroBg.style.transform = `translateY(${translateY}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ===== SECTION FADE-IN ON SCROLL =====
function initSectionFadeIn() {
  // 各セクションの子要素に.fade-in-upを付与
  const targets = document.querySelectorAll(
    '.todays-card, .scene-tags-wrap, .featured-scene-card, .lgw-inner, .library-gateway-inner, .composer-inner, .license-card, .section-title, .section-desc'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -30px 0px',
  });

  targets.forEach(el => {
    el.classList.add('fade-in-up');
    observer.observe(el);
  });
}

// ===== HERO FIREFLIES — 蛍のような光のアニメーション =====
function initHeroFireflies() {
  const container = document.querySelector(".hero__fireflies");
  if (!container) return;
  // 一度クリアする（PJAX遷移や再初期化時の重複描画を防ぐため）
  container.innerHTML = "";

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const count = isMobile ? 12 : 20;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "firefly";

    const size = rand(5, 11);
    const scale = rand(0.75, 1.25);
    const blur = rand(0, 1.6);
    const floatDur = rand(14, 26);
    const glowDur = rand(3.8, 7.2);
    const delay = rand(-20, 0);

    let baseX, baseY;
    const zone = Math.random();
    if (zone < 0.45) { baseX = rand(5, 60); baseY = rand(55, 90); }
    else if (zone < 0.70) { baseX = rand(20, 75); baseY = rand(30, 65); }
    else if (zone < 0.85) { baseX = rand(5, 50); baseY = rand(15, 40); }
    else { baseX = rand(65, 92); baseY = rand(25, 80); }

    el.style.setProperty("--size", `${size}px`);
    el.style.setProperty("--scale", scale.toFixed(2));
    el.style.setProperty("--blur", `${blur.toFixed(2)}px`);
    el.style.setProperty("--floatDur", `${floatDur.toFixed(2)}s`);
    el.style.setProperty("--glowDur", `${glowDur.toFixed(2)}s`);
    el.style.setProperty("--x0", `${baseX}vw`);
    el.style.setProperty("--y0", `${baseY}vh`);
    el.style.setProperty("--x1", `${baseX + rand(-6, 6)}vw`);
    el.style.setProperty("--y1", `${baseY + rand(-10, -2)}vh`);
    el.style.setProperty("--x2", `${baseX + rand(-10, 10)}vw`);
    el.style.setProperty("--y2", `${baseY + rand(-16, 4)}vh`);
    el.style.setProperty("--x3", `${baseX + rand(-8, 8)}vw`);
    el.style.setProperty("--y3", `${baseY + rand(-8, 8)}vh`);
    el.style.setProperty("--x4", `${baseX + rand(-5, 5)}vw`);
    el.style.setProperty("--y4", `${baseY + rand(-12, 2)}vh`);
    el.style.animationDelay = `${delay}s, ${rand(-8, 0).toFixed(2)}s`;

    container.appendChild(el);
  }
}

// ===== DATA-REVEAL スクロール表示 =====
// music-library-dark.css の [data-reveal] { opacity:0 } に対応するJS。
// PJAX遷移後は DOMContentLoaded が発火しないため、
// HMIX_INIT_APP 内で必ず呼ぶ。
function initRevealSections() {
  const reveals = document.querySelectorAll('[data-reveal]');
  if (!reveals.length) return;

  // prefers-reduced-motion: すぐに表示してアニメーションなし
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveals.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -20px 0px',
  });

  reveals.forEach(el => {
    // すでに is-revealed が付いている場合はスキップ（重複呼び出し対策）
    if (!el.classList.contains('is-revealed')) {
      observer.observe(el);
    }
  });
}

// ===== 共通ページ初期化関数（PJAX対応） =====
window.HMIX_INIT_APP = function() {
  ensureSplitHeroImages();
  initParticles();
  initHeroFireflies();
  initHeroPlayer();
  initHeroParallax();
  initSectionFadeIn();
  initRevealSections();   // ← data-reveal 要素の表示復元（PJAX後に必要）
  initTodaysMusic();
  initSceneSearch();
  const pageContent = document.getElementById('page-content');
  if (pageContent && pageContent.dataset.pageType === 'library') {
    if (typeof window.HMIX_INIT_LIBRARY === 'function') window.HMIX_INIT_LIBRARY();
    else if (typeof initMusicLibrary === 'function') initMusicLibrary();
  }
  
  if (typeof window.HMIX_INIT_SCENIC_BG === 'function') window.HMIX_INIT_SCENIC_BG();
  initScrollAnimation();
};

// ===== グローバル言語切替システム =====
// ヘッダー EN ボタン・[lang="ja"]/[lang="en"] ブロック・data-ja/data-en を一元管理。
// music-library ページは applyLangToPage() が追加処理を担うため、[lang] 処理は委任。
(function () {
  'use strict';

  /**
   * applyLang(lang) — ページ全体に言語を適用する。
   * @param {string} lang  'en' | 'ja'
   */
  function applyLang(lang) {
    var isEn = (lang === 'en');
    window.HMIX_LANG = isEn ? 'en' : 'ja';
    try { sessionStorage.setItem('hmix_lang', window.HMIX_LANG); } catch (e) {}

    // 1. body クラス（CSSフックとして）
    document.body.classList.toggle('lang-en', isEn);

    // 2. ヘッダーボタン（グローブ + JP/EN 強調表示）
    var btn = document.getElementById('ml-lang-toggle');
    if (btn) btn.innerHTML = '<svg class="lang-globe" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" width="11" height="11" aria-hidden="true"><circle cx="6" cy="6" r="5.3"/><path d="M1.5 4.5h9M1.5 7.5h9M6 0.7C4.3 2.5 3.5 4.2 3.5 6s.8 3.5 2.5 5.3M6 0.7C7.7 2.5 8.5 4.2 8.5 6s-.8 3.5-2.5 5.3"/></svg>' +
      (isEn ? '<span class="lang-opt">JP</span><span class="lang-sep"> / </span><span class="lang-opt lang-opt--active">EN</span>'
             : '<span class="lang-opt lang-opt--active">JP</span><span class="lang-sep"> / </span><span class="lang-opt">EN</span>');

    // 3. data-ja / data-en テキストノード（music-library.html でも動作）
    document.querySelectorAll('[data-ja][data-en]').forEach(function (el) {
      el.textContent = isEn ? el.dataset.en : el.dataset.ja;
    });

    // 4. 言語変更イベントを通知（player / theater が購読）
    try { window.dispatchEvent(new CustomEvent('hmix:lang', { detail: { lang: window.HMIX_LANG } })); } catch (e) {}

    // 5. [lang="ja"] / [lang="en"] コンテンツブロック（#page-content 内のみ）
    // music-library ページ（data-page-type="library"）は music-library.js が管理するため skip
    var _pc = document.getElementById('page-content');
    var _isLibrary = _pc && _pc.dataset.pageType === 'library';
    if (!_isLibrary) {
      var scope = _pc || document.body;
      scope.querySelectorAll('[lang="en"]').forEach(function (el) {
        el.style.display = isEn ? '' : 'none';
      });
      scope.querySelectorAll('[lang="ja"]').forEach(function (el) {
        el.style.display = isEn ? 'none' : '';
      });
    }
  }

  function initLang() {
    var saved = '';
    try { saved = sessionStorage.getItem('hmix_lang') || ''; } catch (e) {}
    applyLang(saved === 'en' ? 'en' : 'ja');
  }

  // ヘッダー EN ボタン クリック
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#ml-lang-toggle');
    if (!btn) return;
    // music-library ページ（data-page-type="library"）は music-library.js に委任
    var pc = document.getElementById('page-content');
    if (pc && pc.dataset.pageType === 'library') return;
    applyLang(window.HMIX_LANG === 'en' ? 'ja' : 'en');
  });

  // PJAX 遷移後 + 初回ロード時に適用
  // ※ router.js は遷移時 body.className を requestAnimationFrame 内で差し替える
  //   （＝一旦 lang-en が消える）。これより「後」に再適用するため二重 rAF で遅延。
  window.addEventListener('hmix:page:init', function () {
    requestAnimationFrame(function () { requestAnimationFrame(initLang); });
  });
  document.addEventListener('DOMContentLoaded', initLang);

  // 外部公開（各ページのインライン JS からも呼べるように）
  window.HMIX_APPLY_LANG = applyLang;
})();

document.addEventListener('DOMContentLoaded', () => {
  window.HMIX_INIT_APP();

  // tracks-loader.js 使用時: データ取得完了後に今日の音楽を再描画
  window.addEventListener('tracks:ready', function () { initHeroPlayer(); }, { once: true });

  // 初期描画後の非同期先読み（tracks-loader.js がある場合のみ）
  if (typeof window.prefetchTracks === 'function') { window.prefetchTracks(); }
});

// PJAX ルーター遷移時の再初期化フック
window.addEventListener('hmix:page:init', (e) => {
  window.HMIX_INIT_APP();
  
  // もしtracks-loaderが既にデータ取得済みならHeroPlayerも即座に再設定
  if (window.TRACKS && window.TRACKS.length > 0) {
    initHeroPlayer();
  }
});


// ===== FOOTER FAVORITES =====
(function () {
  const FAV_KEY = 'hmix_favorites';
  const countEl = document.getElementById('footer-fav-count');
  const listBtn = document.getElementById('footer-fav-list-btn');
  const dlBtn   = document.getElementById('footer-fav-dl-btn');

  function getFavIds() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function updateCount() {
    if (countEl) countEl.textContent = getFavIds().length;
  }

  // お気に入りリストを開く → fav-modal.js の API を使用
  if (listBtn) {
    listBtn.addEventListener('click', function () {
      if (window.HMIX_FAV_MODAL) {
        window.HMIX_FAV_MODAL.open();
      } else {
        window.location.href = '/music-library.html';
      }
    });
  }

  // まとめてダウンロード → fav-modal の DL ボタンと同じロジック
  if (dlBtn) {
    dlBtn.addEventListener('click', async function () {
      const ids = getFavIds();
      if (!ids.length) { alert('保存されている曲がありません。'); return; }
      const tracks = window.TRACKS || [];
      const idSet  = new Set(ids.map(String));
      const favTracks = tracks.filter(t => idSet.has(String(t.id)));
      if (!favTracks.length) { alert('曲データを読み込み中です。しばらくしてから再試行してください。'); return; }
      const ok = window.confirm(`お気に入りの ${favTracks.length} 曲をまとめてダウンロードします。\nよろしいですか？`);
      if (!ok) return;
      for (let i = 0; i < favTracks.length; i++) {
        const t = favTracks[i];
        if (!t.mp3) continue;
        const a = document.createElement('a');
        a.href = t.mp3;
        a.download = (t.title || t.id) + '.mp3';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (i < favTracks.length - 1) await new Promise(r => setTimeout(r, 250));
      }
    });
  }

  updateCount();
  window.addEventListener('favorites:updated', updateCount);
})();
