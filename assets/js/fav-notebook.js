/* =====================================================================
 * fav-notebook.js ── 音楽手帖（お気に入りボックス）見開きUI
 * window.HMIX_NOTEBOOK.open(collectionId?) / .close()
 * データは FavStore(window.HMIX_FAV) + 楽曲メタ(window.TRACKS) から描画。
 * ※ 旧 fav-modal とは併存（本スライスはローカル構築・未配線）。
 * 日英対応: window.HMIX_LANG / sessionStorage('hmix_lang') を読み L(ja,en) で出し分け。
 * ===================================================================== */
(function () {
  'use strict';
  if (window.HMIX_NOTEBOOK) return;

  /* ---- 言語 ---- */
  function curLang() {
    var v = window.HMIX_LANG;
    if (v !== 'en' && v !== 'ja') {
      try { v = sessionStorage.getItem('hmix_lang') || localStorage.getItem('hmix_lang'); } catch (e) { v = null; }
    }
    return v === 'en' ? 'en' : 'ja';
  }
  function L(ja, en) { return curLang() === 'en' ? en : ja; }
  function nTracks(n) { return curLang() === 'en' ? (n + ' ' + (n === 1 ? 'track' : 'tracks')) : (n + '曲'); }
  function nChapters(n) { return curLang() === 'en' ? (n + ' ' + (n === 1 ? 'chapter' : 'chapters')) : (n + '章'); }
  function statusLabel(s) {
    return curLang() === 'en'
      ? ({ draft: 'Draft', confirmed: 'Confirmed', licensed: 'Licensed' }[s] || 'Draft')
      : ({ draft: '検討中', confirmed: '確定', licensed: '証書を綴じた章' }[s] || '検討中');
  }

  var LOCK_SVG = '<svg class="hnb-chapter__lock" viewBox="0 0 24 24" fill="none" stroke="#e7ca7c" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  /* ---- 楽曲メタ ---- */
  function trackMap() {
    var m = {}; (window.TRACKS || []).forEach(function (t) { m[t.id] = t; }); return m;
  }
  var _tagLabels = null;
  function tagLabels() {
    if (_tagLabels) return _tagLabels;
    _tagLabels = {};
    var meta = window.TAGS_META || {};
    Object.keys(meta).forEach(function (cat) {
      (meta[cat] || []).forEach(function (t) { _tagLabels[t.id] = (curLang() === 'en' ? (t.name_en || t.name) : t.name) || t.id; });
    });
    return _tagLabels;
  }
  function tagsOf(tk) {
    if (!tk) return '';
    var L2 = tagLabels();
    var ids = [].concat(tk.feeling || [], tk.scene || []).slice(0, 3);
    return ids.map(function (id) { return L2[id] || id; }).join(curLang() === 'en' ? ' · ' : '・');
  }
  function durOf(tk) { return tk && (tk.duration || '') || ''; }

  /* ---- 状態 ---- */
  var state = { activeCol: 'default', selected: {}, previewId: null, prevPreviewId: null };
  var _dragIds = null; // ドラッグ中のtrackId群（曲→章へ移動）
  function isMobile() { try { return window.matchMedia('(max-width:760px)').matches; } catch (e) { return false; } }
  function selectPreview(id) {
    if (state.previewId && state.previewId !== id) state.prevPreviewId = state.previewId;
    state.previewId = id;
    renderPages(); renderPreview();
    if (isMobile() && els.preview) els.preview.classList.add('is-open');
  }
  function closeSheet() { if (els.preview) els.preview.classList.remove('is-open'); }

  /* ---- DOM 構築 ---- */
  var root, shell, els = {};
  function build() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'hmix-notebook';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('hidden', '');
    root.setAttribute('data-binding', 'forest');
    root.innerHTML =
      '<div class="hmix-notebook" role="dialog" aria-modal="true" aria-label="' + L('音楽手帖', 'Music Notebook') + '">' +
        '<div class="hnb-head">' +
          '<div><span class="hnb-head__kicker">Music Notebook</span>' +
          '<span class="hnb-head__title">' + L('音楽手帖', 'Music Notebook') + '</span><span class="hnb-head__count" id="hnb-count"></span></div>' +
          '<div class="hnb-head__spacer"></div>' +
          '<input class="hnb-search" id="hnb-search" type="search" placeholder="' + L('手帖の中を検索', 'Search your notebook') + '">' +
          // 同期ステータス表示はスライス2（メール昇格＝端末間同期）で正確な導線として再導入する。
          // スライス1は静かにクラウドへバックアップするため、誤解を招く「この端末に保存」は出さない。
          '<button class="hnb-close" id="hnb-close" aria-label="' + L('とじる', 'Close') + '">✕</button>' +
        '</div>' +
        '<nav class="hnb-spine" id="hnb-spine" aria-label="' + L('章（本棚）', 'Chapters (bookshelf)') + '"></nav>' +
        '<div class="hnb-pages" id="hnb-pages"></div>' +
        '<aside class="hnb-preview" id="hnb-preview"></aside>' +
        '<div class="hnb-empty" id="hnb-empty" hidden>' +
          '<div class="hnb-empty__mark">♡</div>' +
          '<div class="hnb-empty__lead">' + L('最初のページを開きましょう', 'Open your first page') + '</div>' +
          '<div class="hnb-empty__sub">' + L('♡で曲を栞のように挟むと、ここに綴じられていきます。章に束ねて、まるごと使用許諾を申請できます。', 'Tap ♡ to bookmark tracks like pressed flowers — they gather here. Bundle them into chapters and request a license all at once.') + '</div>' +
          '<div class="hnb-empty__cta"><button class="hnb-cta" id="hnb-empty-browse" style="width:auto;padding:12px 22px">' + L('図書館で探す', 'Browse the library') + '</button></div>' +
        '</div>' +
        '<div class="hnb-foot">' +
          '<div class="hnb-bulk" id="hnb-bulk">' +
            '<span class="hnb-bulk__n" id="hnb-bulk-n"></span>' +
            '<button class="hnb-bulk__btn" data-act="addto">' + L('章へ入れる ▾', 'Add to chapter ▾') + '</button>' +
          '</div>' +
          '<div class="hnb-apply-actions">' +
            '<button class="hnb-cta hnb-cta--download" id="hnb-download-cta"></button>' +
            '<button class="hnb-cta hnb-cta--selected" id="hnb-selected-cta"></button>' +
          '</div>' +
          '<span class="hnb-cta__sub">' + L('使う曲だけ選べます・保険の曲は課金されません', 'Pick only the tracks you use — backups are never charged') + '</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    shell = root.querySelector('.hmix-notebook');
    els.count = root.querySelector('#hnb-count');
    els.spine = root.querySelector('#hnb-spine');
    els.pages = root.querySelector('#hnb-pages');
    els.preview = root.querySelector('#hnb-preview');
    els.empty = root.querySelector('#hnb-empty');
    els.foot = root.querySelector('.hnb-foot');
    els.downloadCta = root.querySelector('#hnb-download-cta');
    els.selectedCta = root.querySelector('#hnb-selected-cta');
    els.bulk = root.querySelector('#hnb-bulk');
    els.bulkN = root.querySelector('#hnb-bulk-n');
    els.search = root.querySelector('#hnb-search');

    root.querySelector('#hnb-close').addEventListener('click', close);
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.getAttribute('aria-hidden') === 'false') close(); });
    els.search.addEventListener('input', renderPages);
    els.downloadCta.addEventListener('click', downloadSelectedZip);
    els.selectedCta.addEventListener('click', applySelected);
    root.querySelector('#hnb-empty-browse').addEventListener('click', function () { location.href = (window.HMIX_BASE_PATH || '') + '/music-library.html'; });
    els.bulk.addEventListener('click', function (e) {
      var b = e.target.closest('.hnb-bulk__btn'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'addto') openChapterPicker(Object.keys(state.selected), { clearAfter: true });
    });
    window.addEventListener('favorites:updated', function () { if (root.getAttribute('aria-hidden') === 'false') render(); });
    // サイト共通プレーヤーの再生/停止に追従して ▶/■ を更新
    window.addEventListener('hmix:player:state', function () { refreshPlayUI(); });
    window.addEventListener('hmix:trackplay', function () { refreshPlayUI(); });
  }

  /* ---- 描画 ---- */
  function F() { return window.HMIX_FAV; }
  function render() {
    if (!F()) return;
    var cols = F().collections();
    if (!cols.some(function (c) { return c.id === state.activeCol; })) state.activeCol = (cols[0] && cols[0].id) || 'default';
    var total = F().uniqueCount();
    els.count.textContent = curLang() === 'en' ? (nTracks(total) + ' · ' + nChapters(cols.length)) : (total + '曲・' + cols.length + '章');
    // 空状態
    var isEmpty = total === 0;
    els.empty.hidden = !isEmpty;
    els.empty.style.display = isEmpty ? 'flex' : 'none';
    els.pages.style.display = isEmpty ? 'none' : '';
    els.preview.style.display = isEmpty ? 'none' : '';
    renderSpine(cols);
    if (!isEmpty) { renderPages(); renderPreview(); }
    renderBulk();
  }

  function renderSpine(cols) {
    els.spine.innerHTML = '<div class="hnb-spine__h">' + L('本棚 — 章', 'Bookshelf — Chapters') + '</div>';
    cols.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'hnb-chapter' + (c.id === state.activeCol ? ' is-active' : '');
      b.setAttribute('data-lic', c.status || 'draft');
      b.innerHTML =
        '<div class="hnb-chapter__name">' + (c.status === 'licensed' ? LOCK_SVG : '') + escapeHtml(c.name) + '</div>' +
        '<div class="hnb-chapter__meta"><b>' + F().collectionCount(c.id) + '</b> ' + L('曲', 'tracks') + ' · ' + statusLabel(c.status) + '</div>';
      b.addEventListener('click', function () { state.activeCol = c.id; state.previewId = null; render(); });
      // ドロップ先（曲をドラッグ＝その章へ移動）
      b.addEventListener('dragover', function (e) { if (!_dragIds || c.id === state.activeCol) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; b.classList.add('hnb-drop-hover'); });
      b.addEventListener('dragleave', function () { b.classList.remove('hnb-drop-hover'); });
      b.addEventListener('drop', function (e) {
        e.preventDefault(); b.classList.remove('hnb-drop-hover');
        if (!_dragIds || c.id === state.activeCol) return;
        var ids = _dragIds.slice(); F().copyItems(ids, c.id); state.selected = {};
        nbToast(L(ids.length + '曲を「' + c.name + '」に入れました（元の章にも残ります）', 'Added ' + nTracks(ids.length) + ' to "' + c.name + '" (kept in the original chapter too)')); render();
      });
      els.spine.appendChild(b);
    });
    var add = document.createElement('button');
    add.className = 'hnb-newchapter'; add.textContent = L('＋ 新しい章', '+ New chapter');
    add.addEventListener('click', function () {
      var name = prompt(L('新しい章の名前（例：〇〇案件 / 戦闘シーン候補）', 'Name your new chapter (e.g. Project X / Battle scene picks)'));
      if (name) { var id = F().createCollection(name.trim()); state.activeCol = id; render(); }
    });
    // 「新しい章」へドロップ＝章を作ってそこへ移動
    add.addEventListener('dragover', function (e) { if (!_dragIds) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; add.classList.add('hnb-drop-hover'); });
    add.addEventListener('dragleave', function () { add.classList.remove('hnb-drop-hover'); });
    add.addEventListener('drop', function (e) {
      e.preventDefault(); add.classList.remove('hnb-drop-hover');
      if (!_dragIds) return;
      var ids = _dragIds.slice();
      var name = prompt(L('新しい章の名前（例：〇〇案件 / 戦闘シーン候補）', 'Name your new chapter (e.g. Project X / Battle scene picks)')); if (!name) return;
      var id = F().createCollection(name.trim()); F().copyItems(ids, id); state.selected = {}; state.activeCol = id;
      nbToast(L(ids.length + '曲を「' + name.trim() + '」に入れました（元の章にも残ります）', 'Added ' + nTracks(ids.length) + ' to "' + name.trim() + '" (kept in the original chapter too)')); render();
    });
    els.spine.appendChild(add);
  }

  function renderPages() {
    var tm = trackMap();
    var q = (els.search.value || '').trim().toLowerCase();
    var rows = F().getView({ collectionId: state.activeCol, sort: 'order' });
    var pstate = playState();
    els.pages.innerHTML = '';
    var tools = document.createElement('div');
    tools.className = 'hnb-select-tools';
    tools.innerHTML =
      '<span class="hnb-select-tools__label">' + L('商用利用する曲', 'Tracks to license') + '</span>' +
      '<button type="button" class="hnb-select-tools__btn" data-select-act="all">' + L('全てチェック', 'Check all') + '</button>' +
      '<button type="button" class="hnb-select-tools__btn" data-select-act="none">' + L('解除', 'Clear') + '</button>';
    els.pages.appendChild(tools);
    var shownIds = [];
    tools.addEventListener('click', function (e) {
      var b = e.target.closest('[data-select-act]'); if (!b) return;
      e.stopPropagation();
      if (b.dataset.selectAct === 'all') {
        shownIds.forEach(function (id) { state.selected[id] = true; });
      } else {
        shownIds.forEach(function (id) { delete state.selected[id]; });
      }
      renderPages();
      renderBulk();
    });
    var shown = 0;
    rows.forEach(function (it) {
      var tk = tm[it.trackId];
      var title = (tk && tk.title) || it.trackId;
      var tags = tagsOf(tk);
      if (q && (title.toLowerCase().indexOf(q) === -1 && tags.toLowerCase().indexOf(q) === -1)) return;
      shown++;
      shownIds.push(it.trackId);
      var col = F().collections().filter(function (c) { return c.id === state.activeCol; })[0] || {};
      var rowPlaying = (pstate.id === it.trackId && pstate.playing);
      var row = document.createElement('div');
      row.className = 'hnb-row' + (state.previewId === it.trackId ? ' is-active' : '') + (rowPlaying ? ' is-playing' : '');
      row.innerHTML =
        '<input type="checkbox" class="hnb-check"' + (state.selected[it.trackId] ? ' checked' : '') + '>' +
        '<button class="hnb-iconbtn hnb-fav is-on" title="' + L('栞を外す', 'Remove bookmark') + '">♥</button>' +
        '<button class="hnb-iconbtn hnb-play' + (rowPlaying ? ' is-playing' : '') + '" title="' + (rowPlaying ? L('停止', 'Stop') : L('再生', 'Play')) + '">' + (rowPlaying ? '■' : '▶') + '</button>' +
        '<div class="hnb-row__main"><div class="hnb-row__title">' + escapeHtml(title) + '</div><div class="hnb-row__tags">' + escapeHtml(tags) + '</div></div>' +
        '<span class="hnb-row__dur">' + escapeHtml(durOf(tk)) + '</span>' +
        '<span class="hnb-badge" data-lic="' + (col.status || 'draft') + '">' + statusLabel(col.status) + '</span>';
      row.querySelector('.hnb-check').setAttribute('aria-label', L(title + 'を商用利用申請の候補に選択', 'Select "' + title + '" for the license request'));
      row.querySelector('.hnb-check').addEventListener('click', function (e) {
        e.stopPropagation();
      });
      row.querySelector('.hnb-check').addEventListener('change', function (e) {
        e.stopPropagation();
        if (e.target.checked) state.selected[it.trackId] = true; else delete state.selected[it.trackId];
        renderBulk();
      });
      row.querySelector('.hnb-fav').addEventListener('click', function (e) { e.stopPropagation(); F().removeWithUndo(it.trackId, { label: title }); });
      row.querySelector('.hnb-play').addEventListener('click', function (e) {
        e.stopPropagation();
        doPlay(it.trackId);
      });
      row.addEventListener('click', function () { selectPreview(it.trackId); });
      // ドラッグで章へ移動（選択中の曲を掴んだ場合は選択分まとめて、それ以外はこの1曲）
      row.setAttribute('draggable', 'true');
      row.addEventListener('dragstart', function (e) {
        _dragIds = (state.selected[it.trackId] && Object.keys(state.selected).length) ? Object.keys(state.selected) : [it.trackId];
        try { e.dataTransfer.setData('text/plain', _dragIds.join(',')); e.dataTransfer.effectAllowed = 'move'; } catch (_e) {}
        row.classList.add('hnb-row--dragging');
      });
      row.addEventListener('dragend', function () {
        row.classList.remove('hnb-row--dragging'); _dragIds = null;
        els.spine.querySelectorAll('.hnb-drop-hover').forEach(function (x) { x.classList.remove('hnb-drop-hover'); });
      });
      els.pages.appendChild(row);
    });
    if (!shown) {
      if (q) {
        els.pages.innerHTML = '<div class="hnb-preview__empty" style="padding:40px">' + L('「' + escapeHtml(els.search.value) + '」に一致する曲がありません。', 'No tracks match "' + escapeHtml(els.search.value) + '".') + '</div>';
      } else {
        els.pages.innerHTML =
          '<div class="hnb-empty-chapter">' +
            '<div class="hnb-empty-chapter__mark">❏</div>' +
            '<div class="hnb-empty-chapter__lead">' + L('この章はまだ空です', 'This chapter is still empty') + '</div>' +
            '<div class="hnb-empty-chapter__sub">' + L('他の章から曲を「章へ入れる」で移すか、図書館で探して♡しましょう。', 'Move tracks here with "Add to chapter", or browse the library and tap ♡.') + '</div>' +
            '<div class="hnb-empty-chapter__cta">' +
              (state.activeCol !== 'default' ? '<button class="hnb-cta" data-go="default" style="width:auto;padding:11px 20px">' + L('未分類を開く', 'Open Unsorted') + '</button>' : '') +
              '<button class="hnb-cta hnb-cta--ghost" data-go="lib" style="width:auto;padding:11px 20px">' + L('図書館で探す', 'Browse the library') + '</button>' +
            '</div>' +
          '</div>';
        els.pages.querySelector('.hnb-empty-chapter').addEventListener('click', function (e) {
          var b = e.target.closest('[data-go]'); if (!b) return;
          if (b.dataset.go === 'default') { state.activeCol = 'default'; state.previewId = null; render(); }
          else location.href = (window.HMIX_BASE_PATH || '') + '/music-library.html';
        });
      }
    }
  }

  function renderPreview() {
    var tm = trackMap();
    var tk = state.previewId ? tm[state.previewId] : null;
    if (!tk) {
      els.preview.innerHTML = '<div class="hnb-sheet-handle"></div><div class="hnb-preview__empty">' + L('曲を選ぶと、ここに波形とメモが開きます。', 'Pick a track to open its waveform and notes here.') + '</div>';
      return;
    }
    var bars = '';
    for (var i = 0; i < 36; i++) { var h = 16 + Math.round(64 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.21))); bars += '<span style="height:' + h + '%"></span>'; }
    var memo = (F().state().tracks[tk.id] && F().state().tracks[tk.id].favMemo) || '';
    var pvState = playState();
    var pvPlaying = (pvState.id === tk.id && pvState.playing);
    var bTk = state.prevPreviewId ? tm[state.prevPreviewId] : null;
    var abHtml = '<div class="hnb-preview__sect">' + L('A / B 聴き比べ', 'A / B compare') + '</div>' +
      '<div class="hnb-ab">' +
        '<button class="hnb-ab__btn" data-ab="a"><b>A</b> ' + escapeHtml((tk.title || tk.id)) + '</button>' +
        (bTk ? '<button class="hnb-ab__btn" data-ab="b"><b>B</b> ' + escapeHtml(bTk.title || bTk.id) + '</button>'
             : '<span class="hnb-ab__hint">' + L('別の曲を選ぶとBに入ります', 'Pick another track to set it as B') + '</span>') +
      '</div>';
    els.preview.innerHTML =
      '<div class="hnb-sheet-handle"></div>' +
      '<button class="hnb-sheet-close" aria-label="' + L('閉じる', 'Close') + '">✕</button>' +
      '<div class="hnb-preview__title">' + escapeHtml(tk.title || tk.id) + '</div>' +
      '<div class="hnb-preview__tags">' + escapeHtml(tagsOf(tk)) + '</div>' +
      '<div class="hnb-wave">' + bars + '</div>' +
      '<div class="hnb-preview__row"><button class="hnb-iconbtn hnb-pv-play' + (pvPlaying ? ' is-playing' : '') + '" title="' + (pvPlaying ? L('停止', 'Stop') : L('再生', 'Play')) + '">' + (pvPlaying ? '■' : '▶') + '</button><span class="hnb-row__dur">' + escapeHtml(durOf(tk)) + '</span></div>' +
      abHtml +
      '<div class="hnb-preview__sect">' + L('曲メモ', 'Track notes') + '</div>' +
      '<textarea class="hnb-memo" placeholder="' + L('この曲を選んだ理由・使う場面…', 'Why you picked it, where you\'ll use it…') + '">' + escapeHtml(memo) + '</textarea>' +
      '<div class="hnb-preview__btns">' +
        '<button class="hnb-addch-one">' + L('＋ 章へ入れる', '+ Add to chapter') + '</button>' +
        '<button class="hnb-apply-one">' + L('この曲を商用利用申請 ▸', 'License this track ▸') + '</button>' +
      '</div>';
    els.preview.querySelector('.hnb-memo').addEventListener('change', function (e) { F().setTrackMemo(tk.id, e.target.value); });
    els.preview.querySelector('.hnb-apply-one').addEventListener('click', function () { gotoLicense([tk.id]); });
    els.preview.querySelector('.hnb-addch-one').addEventListener('click', function () { openChapterPicker([tk.id]); });
    var pvPlay = els.preview.querySelector('.hnb-pv-play');
    if (pvPlay) pvPlay.addEventListener('click', function () { playId(tk.id); });
    var sc = els.preview.querySelector('.hnb-sheet-close');
    if (sc) sc.addEventListener('click', closeSheet);
    els.preview.querySelectorAll('.hnb-ab__btn').forEach(function (btn) {
      btn.addEventListener('click', function () { playId(btn.dataset.ab === 'b' ? state.prevPreviewId : tk.id); });
    });
  }
  /* 再生: 通常はサイト共通プレーヤー(HMIX_PLAYER)。
     シアター等 HMIX_PLAYER 未読込のページでは内蔵Audioでフォールバック試聴（▶/■トグル）。 */
  var nbAudio = null, nbAudioId = null;
  function nbFallbackPlay(id) {
    var tk = trackMap()[id]; if (!tk) return;
    var src = tk.mp3 || tk.file || ''; if (!src) return;
    if (!nbAudio) {
      nbAudio = new Audio();
      nbAudio.addEventListener('ended', function () { nbAudioId = null; refreshPlayUI(); });
      nbAudio.addEventListener('pause', refreshPlayUI);
      nbAudio.addEventListener('play', refreshPlayUI);
    }
    if (nbAudioId === id && !nbAudio.paused) { nbAudio.pause(); nbAudioId = null; refreshPlayUI(); return; }
    try { nbAudio.src = src; nbAudio.currentTime = 0; var pr = nbAudio.play(); if (pr && pr.catch) pr.catch(function(){}); nbAudioId = id; } catch (e) {}
    refreshPlayUI();
  }
  function refreshPlayUI() { try { if (root && root.getAttribute('aria-hidden') === 'false') { renderPages(); renderPreview(); } } catch (e) {} }
  function doPlay(id) {
    if (!id) return;
    if (window.HMIX_PLAYER && window.HMIX_PLAYER.playTrackById) {
      // 再生中の同一曲をもう一度押したら停止（▶/■トグル）
      var ps = playState();
      if (ps.id === id && ps.playing) { if (window.HMIX_PLAYER.pause) window.HMIX_PLAYER.pause(); refreshPlayUI(); return; }
      window.HMIX_PLAYER.playTrackById(id);
    } else {
      nbFallbackPlay(id);
    }
  }
  function playId(id) { doPlay(id); }

  var ZIP_LIMIT = 30;
  var zipBusy = false;
  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-hmix-jszip]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.JSZip); });
        existing.addEventListener('error', reject);
        return;
      }
      var s = document.createElement('script');
      s.src = (window.HMIX_BASE_PATH || '') + '/assets/js/vendor/jszip.min.js?v=3.10.1';
      s.async = true;
      s.setAttribute('data-hmix-jszip', '1');
      s.onload = function () { window.JSZip ? resolve(window.JSZip) : reject(new Error('JSZip missing')); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function zipTextDate() {
    var d = new Date();
    function pad(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function safeFileName(s) {
    return String(s || 'track').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || 'track';
  }
  function uniqueFileName(base, used) {
    var name = base, ext = '', n = 2, dot = base.lastIndexOf('.');
    if (dot > 0) { name = base.slice(0, dot); ext = base.slice(dot); }
    var out = base;
    while (used[out]) out = name + ' (' + (n++) + ')' + ext;
    used[out] = true;
    return out;
  }
  function trackUrl(tk) {
    var src = tk && (tk.mp3 || tk.file || tk.url || tk.download);
    if (!src) return '';
    try { return new URL(src, location.origin).href; } catch (e) { return src; }
  }
  function selectedTracks(ids) {
    var tm = trackMap();
    return ids.map(function (id) { return tm[id]; }).filter(Boolean);
  }
  function buildZipTexts(tracks, files, failed) {
    var made = zipTextDate();
    var lines = tracks.map(function (t, i) {
      var file = files[t.id] || '';
      var detail = location.origin + '/music/' + encodeURIComponent(t.id) + '.html';
      return [
        (i + 1) + '. ' + (t.title || t.id),
        '   ID: ' + t.id,
        '   Duration: ' + (t.duration || ''),
        '   File: ' + file,
        '   Detail: ' + detail
      ].join('\n');
    }).join('\n\n');
    return {
      readme: [
        'H/MIX GALLERY selected tracks',
        '',
        'Created: ' + made,
        'Track count: ' + tracks.length,
        '',
        'This ZIP was created from the H/MIX GALLERY favorites box for listening and production organization.',
        'It does not mean that a commercial license has already been granted.',
        'For terms, credit, and commercial use, please check:',
        'https://www.hmix.net/terms.html',
        'https://www.hmix.net/professional-license.html',
        '',
        failed.length ? ('Skipped files:\n' + failed.map(function (x) { return '- ' + x; }).join('\n')) : 'Skipped files: none'
      ].join('\n'),
      list: 'Track list\n\n' + lines + '\n',
      credit: [
        'Credit examples',
        '',
        'Music: H/MIX GALLERY',
        'Composer: Hirokazu Akiyama',
        'Website: https://www.hmix.net/',
        '',
        'Japanese credit example:',
        '音楽: H/MIX GALLERY / 秋山裕和',
        '',
        'Please confirm the latest terms before publishing your work.'
      ].join('\n')
    };
  }
  async function downloadSelectedZip() {
    if (zipBusy) return;
    var ids = Object.keys(state.selected);
    if (!ids.length) return;
    if (ids.length > ZIP_LIMIT) {
      nbToast(L('ZIPは一度に' + ZIP_LIMIT + '曲までです', 'ZIP download is limited to ' + ZIP_LIMIT + ' tracks at a time'));
      return;
    }
    var tracks = selectedTracks(ids);
    if (!tracks.length) return;
    zipBusy = true;
    renderBulk();
    try {
      var JSZipCtor = await loadJSZip();
      var zip = new JSZipCtor();
      var music = zip.folder('music');
      var files = {}, failed = [], used = {};
      for (var i = 0; i < tracks.length; i++) {
        var tk = tracks[i], url = trackUrl(tk);
        if (!url) { failed.push((tk.title || tk.id) + ' (no mp3 URL)'); continue; }
        try {
          var res = await fetch(url, { credentials: 'same-origin' });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          var blob = await res.blob();
          var fn = uniqueFileName(safeFileName(tk.title || tk.id) + '.mp3', used);
          files[tk.id] = 'music/' + fn;
          music.file(fn, blob);
        } catch (e) {
          failed.push((tk.title || tk.id) + ' (' + (e && e.message ? e.message : 'download failed') + ')');
        }
      }
      var texts = buildZipTexts(tracks, files, failed);
      zip.file('README.txt', texts.readme);
      zip.file('track-list.txt', texts.list);
      zip.file('credit.txt', texts.credit);
      var out = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      var a = document.createElement('a');
      var stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.href = URL.createObjectURL(out);
      a.download = 'hmix-selected-tracks-' + stamp + '.zip';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 12000);
      try {
        if (window.hmixTrack) window.hmixTrack('fav_download_zip', { surface: 'fav_notebook', track_count: tracks.length, failed_count: failed.length });
      } catch (e) {}
      nbToast(failed.length ? L('ZIPを作成しました（一部スキップ）', 'ZIP created with some skipped files') : L('ZIPを作成しました', 'ZIP created'));
    } catch (e) {
      nbToast(L('ZIP作成に失敗しました', 'ZIP creation failed'));
    } finally {
      zipBusy = false;
      renderBulk();
    }
  }

  function renderBulk() {
    var ids = Object.keys(state.selected);
    els.bulk.classList.toggle('is-on', ids.length > 0);
    els.bulkN.textContent = L(ids.length + '曲選択中', nTracks(ids.length) + ' selected');
    els.downloadCta.textContent = zipBusy
      ? L('ZIP作成中...', 'Building ZIP...')
      : (ids.length
        ? L('選択曲（' + ids.length + '曲）をZIPでDL ↓', 'Download selected ZIP (' + nTracks(ids.length) + ') ↓')
        : L('選択曲をZIPでDL ↓', 'Download selected ZIP ↓'));
    els.downloadCta.disabled = ids.length === 0 || zipBusy;
    els.downloadCta.style.opacity = (ids.length === 0 || zipBusy) ? '.5' : '1';
    els.selectedCta.textContent = ids.length
      ? L('選択曲（' + ids.length + '曲）を商用利用申請 →', 'License selected (' + nTracks(ids.length) + ') →')
      : L('選択曲を商用利用申請 →', 'License selected tracks →');
    els.selectedCta.disabled = ids.length === 0;
    els.selectedCta.style.opacity = ids.length === 0 ? '.5' : '1';
  }

  /* ---- 操作 ---- */
  function applySelected() { var ids = Object.keys(state.selected); if (ids.length) gotoLicense(ids); }

  /* 章ピッカー: 選択/単曲を「既存章 or 新規章」へ入れる（既定コピー・非破壊、移動も選べる） */
  function openChapterPicker(trackIds, opts) {
    opts = opts || {};
    trackIds = (trackIds || []).filter(Boolean);
    if (!trackIds.length) return;
    var shell = root.querySelector('.hmix-notebook');
    var pop = document.createElement('div');
    pop.className = 'hnb-picker';
    var others = F().collections().filter(function (c) { return c.id !== state.activeCol; });
    var listHtml = others.length
      ? others.map(function (c) {
          return '<button class="hnb-picker__item" data-cid="' + c.id + '" data-lic="' + (c.status || 'draft') + '">' +
            '<span class="hnb-picker__name">' + escapeHtml(c.name) + '</span><span class="hnb-picker__n">' + nTracks(F().collectionCount(c.id)) + '</span></button>';
        }).join('')
      : '<div class="hnb-picker__none">' + L('まだ他の章がありません。下から作れます。', 'No other chapters yet. Create one below.') + '</div>';
    pop.innerHTML =
      '<div class="hnb-picker__backdrop"></div>' +
      '<div class="hnb-picker__panel" role="dialog" aria-modal="true" aria-label="' + L('章へ入れる', 'Add to chapter') + '">' +
        '<div class="hnb-picker__head">' + L(trackIds.length + '曲を章へ入れる', 'Add ' + nTracks(trackIds.length) + ' to a chapter') + '</div>' +
        '<div class="hnb-picker__list">' + listHtml + '</div>' +
        '<button class="hnb-picker__new">' + L('＋ 新しい章を作って入れる', '+ Create a new chapter and add') + '</button>' +
        '<label class="hnb-picker__move"><input type="checkbox"> ' + L('元の章から移動（コピーしない）', 'Move from original (don\'t copy)') + '</label>' +
        '<button class="hnb-picker__close">' + L('とじる', 'Close') + '</button>' +
      '</div>';
    shell.appendChild(pop);
    requestAnimationFrame(function () { pop.classList.add('is-open'); });
    var moveMode = false;
    function closePop() { pop.classList.remove('is-open'); setTimeout(function () { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 200); }
    function apply(cid, label) {
      if (moveMode) F().moveItems(trackIds, cid); else F().copyItems(trackIds, cid);
      if (opts.clearAfter) state.selected = {};
      closePop();
      nbToast(L(trackIds.length + '曲を「' + label + '」に' + (moveMode ? '移しました' : '入れました'),
               (moveMode ? 'Moved ' : 'Added ') + nTracks(trackIds.length) + ' to "' + label + '"'));
      render();
    }
    pop.querySelector('.hnb-picker__move input').addEventListener('change', function (e) { moveMode = e.target.checked; });
    pop.querySelectorAll('.hnb-picker__item').forEach(function (b) {
      b.addEventListener('click', function () { apply(b.dataset.cid, b.querySelector('.hnb-picker__name').textContent); });
    });
    pop.querySelector('.hnb-picker__new').addEventListener('click', function () {
      var name = prompt(L('新しい章の名前（例：〇〇案件 / 戦闘シーン候補）', 'Name your new chapter (e.g. Project X / Battle scene picks)')); if (!name) return;
      var cid = F().createCollection(name.trim()); apply(cid, name.trim());
    });
    pop.querySelector('.hnb-picker__close').addEventListener('click', closePop);
    pop.querySelector('.hnb-picker__backdrop').addEventListener('click', closePop);
  }

  var _toastT = null;
  function nbToast(msg) {
    var t = root.querySelector('.hnb-toast');
    if (!t) { t = document.createElement('div'); t.className = 'hnb-toast'; root.querySelector('.hmix-notebook').appendChild(t); }
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(_toastT); _toastT = setTimeout(function () { t.classList.remove('is-on'); }, 2200);
  }
  // 申請（旧導線）: 共有モジュール未読込のページでは従来どおり申請ページへ遷移して継続。
  function redirectToLicensePage(ids) {
    location.href = (window.HMIX_BASE_PATH || '') + '/license-request.html#tracks=' + ids.join(',');
  }
  // 申請: 手帖内の4ステップウィザードを開く（決済まで内製）。
  function gotoLicense(ids) {
    ids = (ids || []).filter(Boolean);
    if (!ids.length) return;
    if (!(window.HMIX_LICENSE && typeof window.HMIX_LICENSE.checkout === 'function')) {
      redirectToLicensePage(ids);   // 保険: 共有モジュール未読込なら申請ページへ
      return;
    }
    openLicenseWizard(ids);
  }

  /* ===================================================================
   * 申請ウィザード（4ステップ：曲を選ぶ → ライセンス → お客様情報 → 確認）
   * 決済は window.HMIX_LICENSE.checkout（license-checkout.js）に委譲＝単一ソース。
   * =================================================================== */
  function yen(n) { return '¥' + (Number(n) || 0).toLocaleString(); }
  function openLicenseWizard(ids) {
    var HL = window.HMIX_LICENSE;
    var tm = trackMap();
    var isEn = curLang() === 'en';
    // 候補曲（章から渡された ids）。Step1 で使う曲だけに絞れる（保険曲を外す）。
    var cand = ids.map(function (id) { return { id: id, title: (tm[id] && tm[id].title) || id }; });
    var chosen = {}; cand.forEach(function (t) { chosen[t.id] = true; });   // 既定=全部チェック

    var wz = {
      step: 1,
      type: cand.length >= 4 ? 'pack' : 'single',  // 4曲以上はパックが割安＝初期選択
      usage: '',
      name: '',
      email: '',
      projectName: ''
    };

    var shellEl = root.querySelector('.hmix-notebook');
    var pop = document.createElement('div');
    pop.className = 'hnb-wizard';
    pop.innerHTML =
      '<div class="hnb-wizard__backdrop"></div>' +
      '<div class="hnb-wizard__panel" role="dialog" aria-modal="true" aria-label="' + L('商用利用申請', 'License request') + '">' +
        '<div class="hnb-wizard__head">' +
          '<div class="hnb-wizard__steps" id="wz-steps"></div>' +
          '<button class="hnb-wizard__x" aria-label="' + L('とじる', 'Close') + '">✕</button>' +
        '</div>' +
        '<div class="hnb-wizard__body" id="wz-body"></div>' +
        '<div class="hnb-wizard__foot">' +
          '<button class="hnb-wizard__back" id="wz-back">' + L('← 戻る', '← Back') + '</button>' +
          '<div class="hnb-wizard__total" id="wz-total"></div>' +
          '<button class="hnb-wizard__next" id="wz-next"></button>' +
        '</div>' +
      '</div>';
    shellEl.appendChild(pop);
    requestAnimationFrame(function () { pop.classList.add('is-open'); });

    var elBody = pop.querySelector('#wz-body');
    var elSteps = pop.querySelector('#wz-steps');
    var elBack = pop.querySelector('#wz-back');
    var elNext = pop.querySelector('#wz-next');
    var elTotal = pop.querySelector('#wz-total');

    function closeWz() { pop.classList.remove('is-open'); setTimeout(function () { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 200); }
    pop.querySelector('.hnb-wizard__x').addEventListener('click', closeWz);
    pop.querySelector('.hnb-wizard__backdrop').addEventListener('click', closeWz);

    function chosenIds() { return cand.filter(function (t) { return chosen[t.id]; }).map(function (t) { return t.id; }); }
    function chosenCount() { return chosenIds().length; }
    function total() {
      var n = chosenCount();
      return HL.estimate(wz.type, n, wz.usage, '', 0);
    }
    function usageObj() { return HL.PRO_USAGE.find(function (u) { return u.v === wz.usage; }); }
    function emailOk() { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((wz.email || '').trim()); }

    var STEP_TITLES = [
      L('曲を選ぶ', 'Choose tracks'),
      L('ライセンス', 'License'),
      L('お客様情報', 'Your info'),
      L('確認', 'Review')
    ];
    function renderSteps() {
      elSteps.innerHTML = STEP_TITLES.map(function (t, i) {
        var n = i + 1;
        var cls = 'hnb-wizard__step' + (n === wz.step ? ' is-on' : '') + (n < wz.step ? ' is-done' : '');
        return '<span class="' + cls + '"><b>' + n + '</b>' + escapeHtml(t) + '</span>';
      }).join('<span class="hnb-wizard__arrow">›</span>');
    }

    // ── Step 1: 曲を選ぶ ──
    function renderStep1() {
      var rows = cand.map(function (t) {
        return '<label class="wz-trackrow">' +
          '<input type="checkbox" class="wz-trk" data-id="' + escapeHtml(t.id) + '"' + (chosen[t.id] ? ' checked' : '') + '>' +
          '<span class="wz-trackrow__title">' + escapeHtml(t.title) + '</span>' +
          '</label>';
      }).join('');
      elBody.innerHTML =
        '<p class="wz-lead">' + L('この申請に含める曲を選んでください。使わない「保険の曲」はチェックを外せます（課金されません）。',
                                  'Pick the tracks for this request. Uncheck any backup tracks you won\'t use — they\'re never charged.') + '</p>' +
        '<div class="wz-tracklist">' + rows + '</div>';
      elBody.querySelectorAll('.wz-trk').forEach(function (c) {
        c.addEventListener('change', function () {
          if (c.checked) chosen[c.dataset.id] = true; else delete chosen[c.dataset.id];
          syncFoot();
        });
      });
    }

    // ── Step 2: ライセンスを選ぶ ──
    function licenseCardsHtml() {
      var n = chosenCount();
      var packBetter = n >= 4;
      function card(type, badge, name, priceHtml, desc) {
        return '<button type="button" class="wz-card' + (wz.type === type ? ' is-sel' : '') + '" data-type="' + type + '">' +
          (badge ? '<span class="wz-card__badge">' + badge + '</span>' : '') +
          '<span class="wz-card__name">' + name + '</span>' +
          '<span class="wz-card__price">' + priceHtml + '</span>' +
          '<span class="wz-card__desc">' + desc + '</span>' +
        '</button>';
      }
      var singlePrice = yen(HL.PRICES.single) + '<small>' + L(' 税込/曲', ' /track') + '</small>';
      var packPrice = yen(HL.PRICES.pack) + '<small>' + L(' 税込・曲数無制限', ' · unlimited tracks') + '</small>';
      var proPrice = (wz.usage ? yen(HL.proUsagePrice(wz.usage)) : yen(3300) + '〜') + '<small>' + L(' 税込/曲', ' /track') + '</small>';
      return '<div class="wz-cards">' +
        card('single', '', L('Standard（単曲）', 'Standard (per track)'), singlePrice,
             L('Web動画・配信・ゲーム等の一般的な商用利用。', 'General commercial use: web video, streaming, games, etc.')) +
        card('pack', packBetter ? L('お得', 'Best value') : '', L('Project Pack', 'Project Pack'), packPrice,
             L('1プロジェクトで曲数無制限。4曲以上ならこちらが割安。', 'Unlimited tracks for one project. Cheaper from 4 tracks.')) +
        card('professional', '', L('Professional（用途別）', 'Professional (by use)'), proPrice,
             L('映画・TV・大規模広告など。用途で価格が変わります。', 'Film, TV, large-scale ads. Price varies by use.')) +
      '</div>';
    }
    function proUsageHtml() {
      if (wz.type !== 'professional') return '';
      var opts = '<option value="">' + L('用途を選択…', 'Select a use…') + '</option>' +
        HL.PRO_USAGE.map(function (u) {
          return '<option value="' + u.v + '"' + (wz.usage === u.v ? ' selected' : '') + '>' +
            escapeHtml(isEn ? u.en : u.ja) + '（' + yen(u.price) + L('/曲', '/track') + '）</option>';
        }).join('');
      return '<div class="wz-usage"><label class="wz-usage__label">' + L('用途', 'Use') + '</label>' +
        '<select class="wz-usage__sel" id="wz-usage">' + opts + '</select></div>';
    }
    function renderStep2() {
      elBody.innerHTML =
        '<p class="wz-lead">' + L('ご利用内容に合うライセンスを選んでください。', 'Choose the license that fits your use.') + '</p>' +
        licenseCardsHtml() +
        '<div id="wz-usage-wrap">' + proUsageHtml() + '</div>';
      elBody.querySelectorAll('.wz-card').forEach(function (b) {
        b.addEventListener('click', function () {
          wz.type = b.dataset.type;
          if (wz.type !== 'professional') wz.usage = '';
          renderStep2(); syncFoot();
        });
      });
      var sel = elBody.querySelector('#wz-usage');
      if (sel) sel.addEventListener('change', function () {
        wz.usage = sel.value;
        // カード価格表示を更新
        var pc = elBody.querySelector('.wz-card[data-type="professional"] .wz-card__price');
        if (pc) pc.innerHTML = (wz.usage ? yen(HL.proUsagePrice(wz.usage)) : yen(3300) + '〜') + '<small>' + L(' 税込/曲', ' /track') + '</small>';
        syncFoot();
      });
    }

    // ── Step 3: お客様情報 ──
    function renderStep3() {
      var projHtml = (wz.type === 'pack')
        ? '<label class="wz-field"><span class="wz-field__lbl">' + L('プロジェクト名（任意）', 'Project name (optional)') + '</span>' +
          '<input type="text" id="wz-proj" class="wz-input" value="' + escapeHtml(wz.projectName) + '" placeholder="' + L('〇〇 PV / ゲームタイトル 等', 'e.g. Project X PV / Game title') + '"></label>'
        : '';
      elBody.innerHTML =
        '<p class="wz-lead">' + L('証明書に記載するお名前と、控えの送付先メールを入力してください。',
                                  'Enter the name for your certificate and the email for your receipt.') + '</p>' +
        '<label class="wz-field"><span class="wz-field__lbl">' + L('お名前 / 会社名', 'Name / Company') + ' <i>*</i></span>' +
          '<input type="text" id="wz-name" class="wz-input" value="' + escapeHtml(wz.name) + '" autocomplete="name"></label>' +
        '<label class="wz-field"><span class="wz-field__lbl">' + L('メールアドレス', 'Email') + ' <i>*</i></span>' +
          '<input type="email" id="wz-email" class="wz-input" value="' + escapeHtml(wz.email) + '" autocomplete="email" inputmode="email"></label>' +
        projHtml +
        '<div class="wz-err" id="wz-info-err" hidden></div>';
      var nm = elBody.querySelector('#wz-name'); if (nm) nm.addEventListener('input', function () { wz.name = nm.value; syncFoot(); });
      var em = elBody.querySelector('#wz-email'); if (em) em.addEventListener('input', function () { wz.email = em.value; syncFoot(); });
      var pj = elBody.querySelector('#wz-proj'); if (pj) pj.addEventListener('input', function () { wz.projectName = pj.value; });
    }

    // ── Step 4: 確認 ──
    function renderStep4() {
      var n = chosenCount();
      var typeName = wz.type === 'single' ? L('Standard（単曲）', 'Standard (per track)')
                   : wz.type === 'pack' ? L('Project Pack', 'Project Pack')
                   : L('Professional', 'Professional');
      var uo = usageObj();
      var trackLines = (wz.type === 'pack')
        ? '<div class="wz-sum__row"><span>' + L('対象', 'Scope') + '</span><b>' + L('1プロジェクト（曲数無制限）', 'One project (unlimited tracks)') + '</b></div>'
        : '<div class="wz-sum__row"><span>' + L('曲数', 'Tracks') + '</span><b>' + nTracks(n) + '</b></div>';
      var usageLine = (wz.type === 'professional' && uo)
        ? '<div class="wz-sum__row"><span>' + L('用途', 'Use') + '</span><b>' + escapeHtml(isEn ? uo.en : uo.ja) + '</b></div>' : '';
      var projLine = (wz.type === 'pack' && wz.projectName)
        ? '<div class="wz-sum__row"><span>' + L('プロジェクト', 'Project') + '</span><b>' + escapeHtml(wz.projectName) + '</b></div>' : '';
      elBody.innerHTML =
        '<div class="wz-sum">' +
          '<div class="wz-sum__row"><span>' + L('ライセンス', 'License') + '</span><b>' + typeName + '</b></div>' +
          trackLines + usageLine + projLine +
          '<div class="wz-sum__row"><span>' + L('お名前', 'Name') + '</span><b>' + escapeHtml(wz.name) + '</b></div>' +
          '<div class="wz-sum__row"><span>' + L('メール', 'Email') + '</span><b>' + escapeHtml(wz.email) + '</b></div>' +
          '<div class="wz-sum__total"><span>' + L('お支払い合計（税込）', 'Total (incl. tax)') + '</span><b>' + yen(total()) + '</b></div>' +
        '</div>' +
        '<p class="wz-note">' + L('「決済へ進む」を押すと Stripe の安全な決済ページへ移動します。決済が完了するまで料金は発生しません。',
                                  'Pressing "Proceed to payment" opens Stripe\'s secure checkout. You are not charged until payment completes.') + '</p>' +
        '<div class="wz-err" id="wz-pay-err" hidden></div>';
    }

    function renderStepBody() {
      if (wz.step === 1) renderStep1();
      else if (wz.step === 2) renderStep2();
      else if (wz.step === 3) renderStep3();
      else renderStep4();
      renderSteps();
      syncFoot();
    }

    function nextLabel() {
      if (wz.step < 4) return L('次へ →', 'Next →');
      return L('決済へ進む →', 'Proceed to payment →');
    }
    function canAdvance() {
      if (wz.step === 1) return chosenCount() > 0;
      if (wz.step === 2) return wz.type === 'professional' ? !!wz.usage : !!wz.type;
      if (wz.step === 3) return !!(wz.name || '').trim() && emailOk();
      return true;
    }
    function syncFoot() {
      elBack.style.visibility = wz.step > 1 ? 'visible' : 'hidden';
      elNext.textContent = nextLabel();
      var ok = canAdvance();
      elNext.disabled = !ok;
      elNext.style.opacity = ok ? '1' : '.5';
      // 合計は Step2 以降で表示
      elTotal.innerHTML = (wz.step >= 2)
        ? '<span class="wz-total__lbl">' + L('合計', 'Total') + '</span> ' + yen(total())
        : '';
    }

    elBack.addEventListener('click', function () { if (wz.step > 1) { wz.step--; renderStepBody(); } });
    elNext.addEventListener('click', function () {
      if (!canAdvance()) {
        // Step3 のバリデーションエラーを明示
        if (wz.step === 3) {
          var e = elBody.querySelector('#wz-info-err');
          if (e) { e.hidden = false; e.textContent = !( (wz.name||'').trim() ) ? L('お名前を入力してください。', 'Please enter your name.') : L('メールアドレスの形式が正しくありません。', 'Please enter a valid email address.'); }
        }
        return;
      }
      if (wz.step < 4) { wz.step++; renderStepBody(); return; }
      submitWizard();
    });

    function submitWizard() {
      var uo = usageObj();
      var sendTracks = (wz.type === 'single' || wz.type === 'professional')
        ? chosenIds().map(function (id) { return { id: String(id), title: (tm[id] && tm[id].title) || String(id) }; })
        : [];
      var errEl = elBody.querySelector('#wz-pay-err');
      var payLabel = L('決済へ進む →', 'Proceed to payment →');
      HL.checkout({
        licenseType:  wz.type,
        tracks:       sendTracks,
        trackCount:   chosenCount(),
        name:         (wz.name || '').trim(),
        email:        (wz.email || '').trim(),
        usage:        wz.type === 'professional' ? wz.usage : '',
        usageLabelJa: uo ? uo.ja : '',
        usageLabelEn: uo ? uo.en : '',
        projectName:  wz.type === 'pack' ? (wz.projectName || '').trim() : '',
        collectionId: state.activeCol,   // 購入後に license-success がこの章へ証書を綴じ込む（P1-7）
        surface:      'music_notebook'
      }, {
        payLabel: payLabel,
        preparingLabel: L('決済ページを準備中…', 'Preparing checkout…'),
        setBusy: function (label, busy) {
          elNext.textContent = label == null ? payLabel : label;
          elNext.disabled = !!busy;
          elNext.style.opacity = busy ? '.6' : '1';
          elBack.disabled = !!busy;
        },
        onError: function (reason) {
          if (!errEl) return;
          errEl.hidden = false;
          errEl.textContent = (reason === 'timeout')
            ? L('通信がタイムアウトしました。料金は発生していません。もう一度お試しください。', 'The request timed out. You were not charged. Please try again.')
            : L('決済ページを開けませんでした。料金は発生していません。もう一度お試しください。', 'Could not open checkout. You were not charged. Please try again.');
        }
      });
    }

    renderStepBody();
  }

  function playState() {
    try { if (window.HMIX_PLAYER && window.HMIX_PLAYER.getState) { var s = window.HMIX_PLAYER.getState(); var t = s.queue && s.queue[s.currentIndex]; return { id: t && (t.id || t), playing: !!s.isPlaying }; } } catch (e) {}
    if (nbAudioId && nbAudio && !nbAudio.paused) return { id: nbAudioId, playing: true };  // 内蔵フォールバック再生中
    return { id: null, playing: false };
  }

  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  /* ---- 開閉 ---- */
  function open(collectionId) {
    build();
    if (collectionId) state.activeCol = collectionId;
    render();
    root.removeAttribute('hidden');
    requestAnimationFrame(function () { root.setAttribute('aria-hidden', 'false'); });
  }
  function close() {
    if (!root) return;
    root.setAttribute('aria-hidden', 'true');
    setTimeout(function () { if (root.getAttribute('aria-hidden') === 'true') root.setAttribute('hidden', ''); }, 360);
  }

  window.HMIX_NOTEBOOK = { open: open, close: close, _build: build };
})();
