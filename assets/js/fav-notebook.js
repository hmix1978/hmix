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
    els.selectedCta = root.querySelector('#hnb-selected-cta');
    els.bulk = root.querySelector('#hnb-bulk');
    els.bulkN = root.querySelector('#hnb-bulk-n');
    els.search = root.querySelector('#hnb-search');

    root.querySelector('#hnb-close').addEventListener('click', close);
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.getAttribute('aria-hidden') === 'false') close(); });
    els.search.addEventListener('input', renderPages);
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

  function renderBulk() {
    var ids = Object.keys(state.selected);
    els.bulk.classList.toggle('is-on', ids.length > 0);
    els.bulkN.textContent = L(ids.length + '曲選択中', nTracks(ids.length) + ' selected');
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
  function gotoLicense(ids) {
    location.href = (window.HMIX_BASE_PATH || '') + '/license-request.html#tracks=' + ids.join(',');
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
