/**
 * H/MIX GALLERY — fav-modal.js
 * お気に入りリストモーダル（スタンドアロン版）
 * music-library.js 非依存。TOP / Library 共用可。
 * 外部呼び出し: window.HMIX_FAV_MODAL.open() / .close()
 */
(function () {
  'use strict';

  const FAV_KEY = 'hmix_favorites';

  // ライセンス申請のために選択中のトラックID（モーダルセッション内で保持）
  var _licenseSelection = new Set();

  const TAG_LABELS = {
    gentle: '優しい', sad: '悲しい', happy: '楽しい', epic: '勇壮',
    dark: '暗い', mysterious: '神秘', suspense: '緊迫', scary: '怖い', horror: 'ホラー', japanese_horror: '和風ホラー', western_horror: '洋風ホラー', cute: 'かわいい',
    fantasy: 'ファンタジー', japanese: '和風', celtic: 'ケルト', medieval: '中世',
    oriental: 'アジアン', futuristic: '近未来', electronic: '電子音', modern: '現代的', musicbox: 'オルゴール',
    battle: '戦闘', boss: 'ボス', town: '街', village: '村', field: 'フィールド',
    forest: '森', night: '夜', travel: '旅', dungeon: 'ダンジョン', ruins: '遺跡',
    cave: '洞窟', festival: '祭り', shrine: '神社', samurai: 'サムライ',
    snow: '雪', mansion: '洋館', moning: '朝', church: '教会',
    memory: '思い出', reunion: '再会', farewell: '別れ', victory: '勝利',
    defeat: '敗北', peaceful: '平和', dream: '夢', conspiracy: '陰謀',
    dailylife: '日常', destiny: '運命', omen: '予兆', resolve: '決意',
    bonds: '絆', pursuit: '追跡', hope: '希望', flashback: '回想', despair: '絶望',
  };

  const TAG_LABELS_EN = {
    gentle: 'Gentle', sad: 'Sad', happy: 'Happy', epic: 'Epic',
    dark: 'Dark', mysterious: 'Mysterious', suspense: 'Suspense', scary: 'Scary', horror: 'Horror', japanese_horror: 'Japanese Horror', western_horror: 'Western Horror', cute: 'Cute',
    fantasy: 'Fantasy', japanese: 'Japanese', celtic: 'Celtic', medieval: 'Medieval',
    oriental: 'Asian', futuristic: 'Futuristic', electronic: 'Electronic', modern: 'Modern', musicbox: 'Music Box',
    battle: 'Battle', boss: 'Boss', town: 'Town', village: 'Village', field: 'Field',
    forest: 'Forest', night: 'Night', travel: 'Travel', dungeon: 'Dungeon', ruins: 'Ruins',
    cave: 'Cave', festival: 'Festival', shrine: 'Shrine', samurai: 'Samurai',
    snow: 'Snow', mansion: 'Mansion', moning: 'Morning', church: 'Church',
    memory: 'Memory', reunion: 'Reunion', farewell: 'Farewell', victory: 'Victory',
    defeat: 'Defeat', peaceful: 'Peaceful', dream: 'Dream', conspiracy: 'Conspiracy',
    dailylife: 'Daily Life', destiny: 'Destiny', omen: 'Omen', resolve: 'Resolve',
    bonds: 'Bonds', pursuit: 'Pursuit', hope: 'Hope', flashback: 'Flashback', despair: 'Despair',
  };

  function getLang() {
    if (window.HMIX_LANG) return window.HMIX_LANG;
    try { return sessionStorage.getItem('hmix_lang') || 'ja'; } catch (e) { return 'ja'; }
  }
  function text(ja, en) { return getLang() === 'en' ? en : ja; }
  function getTagLabel(id) {
    return (getLang() === 'en' ? TAG_LABELS_EN[id] : TAG_LABELS[id]) || id;
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function getFavIds() {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]').map(String)); }
    catch (e) { return new Set(); }
  }

  function saveFavIds(set) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
      window.dispatchEvent(new CustomEvent('favorites:updated', {
        detail: { count: set.size, ids: [...set] }
      }));
    } catch (e) {}
  }

  // ── DOM ──────────────────────────────────────────────
  const modal    = document.getElementById('fav-modal');
  if (!modal) return;

  const backdrop   = document.getElementById('fav-modal-backdrop');
  const closeBtn   = document.getElementById('fav-modal-close');
  const listEl     = document.getElementById('fav-modal-list');
  const totalEl    = document.getElementById('fav-modal-total');
  const emptyEl    = document.getElementById('fav-modal-empty');
  const footerEl   = document.getElementById('fav-modal-footer');
  const clearBtn   = document.getElementById('fav-modal-clear');
  const triggerBtn = document.getElementById('fav-modal-trigger');
  const playAllBtn = document.getElementById('fav-modal-play-all');
  const shuffleBtn = document.getElementById('fav-modal-shuffle-all');
  const dlAllBtn   = document.getElementById('fav-modal-dl-all');
  const playTheaterBtn = document.getElementById('fav-modal-play-theater');
  var   applyLicenseBtn = null;

  function applyStaticLang() {
    var heading = document.getElementById('fav-modal-heading');
    if (heading && heading.firstChild) {
      heading.firstChild.nodeValue = text('保存した曲 ', 'Saved tracks ');
    }
    if (closeBtn) closeBtn.setAttribute('aria-label', text('閉じる', 'Close'));
    if (listEl) listEl.setAttribute('aria-label', text('お気に入りの曲一覧', 'Saved tracks list'));
    if (emptyEl) {
      emptyEl.innerHTML = text(
        'まだ保存した曲はありません。<br><span>♡ を押して旅の記録を残しましょう。</span>',
        'No saved tracks yet.<br><span>Press ♡ to keep a listening list.</span>'
      );
    }
    if (playAllBtn) playAllBtn.textContent = text('再生', 'Play');
    if (shuffleBtn) shuffleBtn.textContent = text('シャッフル', 'Shuffle');
    if (playTheaterBtn) playTheaterBtn.textContent = text('シアター没入再生', 'Theater');
    if (dlAllBtn) dlAllBtn.textContent = text('まとめてDL', 'Download All');
    if (clearBtn) clearBtn.textContent = text('すべて削除', 'Clear All');
    modal.querySelectorAll('[data-ja]').forEach(function (el) {
      el.textContent = text(el.dataset.ja, el.dataset.en || el.dataset.ja);
    });
  }

  // ── 開く / 閉じる ──────────────────────────────────
  function openModal() {
    applyStaticLang();
    renderList();
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fav-modal-open');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('fav-modal-open');
    if (triggerBtn) triggerBtn.focus();
  }

  // ── 申請ボタン更新 ────────────────────────────────
  function updateApplyBtn() {
    if (!applyLicenseBtn) return;
    var favIds = getFavIds();
    var validCount = 0;
    _licenseSelection.forEach(function (id) {
      if (favIds.has(id)) validCount++;
    });
    applyLicenseBtn.disabled = validCount === 0;
    var countEl = applyLicenseBtn.querySelector('.fav-modal__apply-count');
    if (countEl) countEl.textContent = validCount > 0
      ? (getLang() === 'en' ? ' (' + validCount + ')' : '（' + validCount + '曲）') : '';
  }

  // ── リスト描画 ────────────────────────────────────
  function renderList() {
    const ids = getFavIds();
    const tracks = window.TRACKS || [];
    const favTracks = tracks.filter(t => ids.has(String(t.id)));

    if (totalEl) totalEl.textContent = getLang() === 'en'
      ? favTracks.length + ' tracks'
      : favTracks.length + '曲';
    if (emptyEl) emptyEl.hidden = favTracks.length > 0;
    if (footerEl) footerEl.hidden = favTracks.length === 0;
    if (playAllBtn) playAllBtn.disabled = favTracks.length === 0;
    if (shuffleBtn) shuffleBtn.disabled = favTracks.length === 0;
    if (playTheaterBtn) playTheaterBtn.disabled = favTracks.length === 0;
    if (dlAllBtn)   dlAllBtn.disabled   = favTracks.length === 0;
    if (!listEl) return;

    listEl.innerHTML = '';

    favTracks.forEach(function (track) {
      const allTagValues = [].concat(track.feeling || [], track.style || [], track.scene || []);
      const tagText = allTagValues.slice(0, 3).map(t => getTagLabel(t)).join(' · ');
      const trackId = String(track.id);
      var displayTitle = (getLang() === 'en' && track.title_en) ? track.title_en : (track.title || '—');

      const li = document.createElement('li');
      li.className = 'fav-modal__item';
      li.dataset.id = track.id;

      // チェックボックス（申請選択用）
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'fav-modal__select';
      var checkboxLabel = getLang() === 'en'
        ? 'Select ' + (displayTitle || track.id) + ' for license request'
        : (track.title || track.id) + 'を申請対象に選択';
      cb.setAttribute('aria-label', escHtml(checkboxLabel));
      cb.dataset.trackId = trackId;
      cb.checked = _licenseSelection.has(trackId);
      cb.addEventListener('change', function () {
        if (this.checked) {
          _licenseSelection.add(this.dataset.trackId);
        } else {
          _licenseSelection.delete(this.dataset.trackId);
        }
        updateApplyBtn();
      });
      li.appendChild(cb);

      // 再生・情報・削除ボタン（innerHTML で追加）
      const innerDiv = document.createElement('div');
      innerDiv.className = 'fav-modal__item-inner';
      innerDiv.innerHTML =
        '<button class="fav-modal__play" aria-label="' + escHtml(text(displayTitle + 'を再生', 'Play ' + displayTitle)) + '">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>' +
        '</button>' +
        '<div class="fav-modal__info">' +
          '<span class="fav-modal__track-title">' + escHtml(displayTitle) + '</span>' +
          '<span class="fav-modal__track-tags">' + escHtml(tagText) + '</span>' +
        '</div>' +
        '<button class="fav-modal__remove" aria-label="' + escHtml(text(displayTitle + 'を削除', 'Remove ' + displayTitle)) + '" title="' + escHtml(text('削除', 'Remove')) + '">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '</button>';
      li.appendChild(innerDiv);

      innerDiv.querySelector('.fav-modal__play').addEventListener('click', function () {
        if (window.HMIX_PLAYER) window.HMIX_PLAYER.playTrack(track, window.TRACKS || []);
        closeModal();
      });

      innerDiv.querySelector('.fav-modal__remove').addEventListener('click', function () {
        // 申請選択からも除去
        _licenseSelection.delete(trackId);

        var current = getFavIds();
        current.delete(trackId);
        saveFavIds(current);
        li.classList.add('fav-modal__item--removing');
        setTimeout(function () {
          li.remove();
          var remaining = listEl.querySelectorAll('.fav-modal__item').length;
          if (totalEl) totalEl.textContent = getLang() === 'en'
            ? remaining + ' tracks'
            : remaining + '曲';
          if (emptyEl) emptyEl.hidden = remaining > 0;
          if (footerEl) footerEl.hidden = remaining === 0;
          if (playAllBtn) playAllBtn.disabled = remaining === 0;
          if (shuffleBtn) shuffleBtn.disabled = remaining === 0;
          if (playTheaterBtn) playTheaterBtn.disabled = remaining === 0;
          if (dlAllBtn)   dlAllBtn.disabled   = remaining === 0;
          updateApplyBtn();
        }, 220);
      });

      listEl.appendChild(li);
    });

    updateApplyBtn();
  }

  // ── 開閉イベント ──────────────────────────────────
  if (triggerBtn) triggerBtn.addEventListener('click', openModal);
  if (closeBtn)   closeBtn.addEventListener('click', closeModal);
  if (backdrop)   backdrop.addEventListener('click', closeModal);

  var panelEl = modal.querySelector('.fav-modal__panel');
  if (panelEl) panelEl.addEventListener('click', function (e) { e.stopPropagation(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  // ── すべて削除 ────────────────────────────────────
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      saveFavIds(new Set());
      _licenseSelection.clear();
      renderList();
    });
  }

  // ── キュー再生 ────────────────────────────────────
  function buildFavQueue(doShuffle) {
    var ids = getFavIds();
    var tracks = window.TRACKS || [];
    var queue = tracks.filter(t => ids.has(String(t.id)));
    if (!queue.length) return;
    if (doShuffle) {
      queue = queue.slice();
      for (var i = queue.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = queue[i]; queue[i] = queue[j]; queue[j] = tmp;
      }
    }
    if (window.HMIX_PLAYER) window.HMIX_PLAYER.setQueue(queue, 0);
    closeModal();
  }

  if (playAllBtn) playAllBtn.addEventListener('click', function () { buildFavQueue(false); });
  if (shuffleBtn) shuffleBtn.addEventListener('click', function () { buildFavQueue(true); });
  if (playTheaterBtn) {
    playTheaterBtn.addEventListener('click', function () {
      if (window.HMIX_THEATER && window.HMIX_THEATER.openWithFavorites) {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('fav-modal-open');
        window.HMIX_THEATER.openWithFavorites();
      } else {
        closeModal();
      }
    });
  }

  // ── まとめてDL ────────────────────────────────────
  if (dlAllBtn) {
    dlAllBtn.addEventListener('click', async function () {
      var ids = getFavIds();
      var tracks = window.TRACKS || [];
      var favTracks = tracks.filter(t => ids.has(String(t.id)));
      if (!favTracks.length) return;
      var ok = getLang() === 'en'
        ? window.confirm('Download all ' + favTracks.length + ' saved tracks?')
        : window.confirm('お気に入りの ' + favTracks.length + ' 曲をまとめてダウンロードします。\nよろしいですか？');
      if (!ok) return;
      for (var i = 0; i < favTracks.length; i++) {
        var t = favTracks[i];
        if (!t.mp3) continue;
        var a = document.createElement('a');
        a.href = t.mp3;
        a.download = (t.title || t.id) + '.mp3';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (i < favTracks.length - 1) await new Promise(r => setTimeout(r, 250));
      }
    });
  }

  // ── ライセンス申請ボタン注入 ─────────────────────
  if (footerEl) {
    var licenseDom = document.createElement('div');
    licenseDom.className = 'fav-modal__footer-license';
    licenseDom.innerHTML =
      '<button type="button" class="fav-modal__apply-license" disabled>' +
        '<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="flex-shrink:0">' +
          '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>' +
          '<polyline points="14 2 14 8 20 8"/>' +
          '<line x1="16" y1="13" x2="8" y2="13"/>' +
          '<line x1="16" y1="17" x2="8" y2="17"/>' +
          '<polyline points="10 9 9 9 8 9"/>' +
        '</svg>' +
        '<span data-ja="商用ライセンスを申請する" data-en="Request Commercial License">商用ライセンスを申請する</span>' +
        '<span class="fav-modal__apply-count"></span>' +
      '</button>';
    footerEl.appendChild(licenseDom);
    applyLicenseBtn = licenseDom.querySelector('.fav-modal__apply-license');

    applyLicenseBtn.addEventListener('click', function () {
      var favIds = getFavIds();
      var validIds = [..._licenseSelection].filter(function (id) { return favIds.has(id); });
      if (!validIds.length) return;
      var tracks = window.TRACKS || [];
      var selectedTracks = validIds.map(function (id) {
        var t = tracks.find(function (tr) { return String(tr.id) === id; });
        return t ? { id: String(t.id), title: t.title || id } : { id: id, title: id };
      });
      try {
        sessionStorage.setItem('hmix_license_selection', JSON.stringify(selectedTracks));
      } catch (e) {}
      closeModal();
      window.location.href = (window.HMIX_BASE_PATH || '') + '/license-request.html';
    });
  }

  // ── favorites:updated → 開いていれば再描画 ────────
  window.addEventListener('favorites:updated', function () {
    if (!modal.hidden) renderList();
  });

  window.addEventListener('hmix:lang', function () {
    applyStaticLang();
    if (!modal.hidden) renderList();
  });

  applyStaticLang();

  // ── 外部 API ─────────────────────────────────────
  window.HMIX_FAV_MODAL = { open: openModal, close: closeModal };

})();
