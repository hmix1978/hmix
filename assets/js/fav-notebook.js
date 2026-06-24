/* =====================================================================
 * fav-notebook.js ── 音楽手帖（お気に入りボックス）見開きUI
 * window.HMIX_NOTEBOOK.open(collectionId?) / .close()
 * データは FavStore(window.HMIX_FAV) + 楽曲メタ(window.TRACKS) から描画。
 * ※ 旧 fav-modal とは併存（本スライスはローカル構築・未配線）。
 * ===================================================================== */
(function () {
  'use strict';
  if (window.HMIX_NOTEBOOK) return;

  var STATUS_LABEL = { draft: '検討中', confirmed: '確定', licensed: '証書を綴じた章' };
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
      (meta[cat] || []).forEach(function (t) { _tagLabels[t.id] = (window.HMIX_LANG === 'en' ? (t.name_en || t.name) : t.name) || t.id; });
    });
    return _tagLabels;
  }
  function tagsOf(tk) {
    if (!tk) return '';
    var L = tagLabels();
    var ids = [].concat(tk.feeling || [], tk.scene || []).slice(0, 3);
    return ids.map(function (id) { return L[id] || id; }).join('・');
  }
  function durOf(tk) { return tk && (tk.duration || '') || ''; }
  function fmtSec(sec) {
    sec = Number(sec) || 0;
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
  }
  function genericWaveBars() {
    var bars = '';
    for (var i = 0; i < 36; i++) {
      var h = 16 + Math.round(64 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.21)));
      bars += '<span style="height:' + h + '%"></span>';
    }
    return bars;
  }
  function waveBarsFromValues(values) {
    if (!values || !values.length) return genericWaveBars();
    var bars = '';
    values.forEach(function (v) {
      var h = Math.max(10, Math.min(92, Math.round(12 + (Number(v) || 0) * 78)));
      bars += '<span style="height:' + h + '%"></span>';
    });
    return bars;
  }
  function audioContext() {
    if (!window.__HMIX_NOTEBOOK_AUDIO_CTX) window.__HMIX_NOTEBOOK_AUDIO_CTX = new (window.AudioContext || window.webkitAudioContext)();
    return window.__HMIX_NOTEBOOK_AUDIO_CTX;
  }
  function extractRangeWaveform(audioBuffer, startSec, endSec, bars) {
    bars = bars || 36;
    var raw = audioBuffer.getChannelData(0);
    var start = Math.max(0, Math.floor((Number(startSec) || 0) * audioBuffer.sampleRate));
    var end = Math.min(raw.length, Math.floor((Number(endSec) || audioBuffer.duration) * audioBuffer.sampleRate));
    if (end <= start) { start = 0; end = raw.length; }
    var len = Math.max(1, end - start);
    var block = Math.max(1, Math.floor(len / bars));
    var out = [], peak = 0;
    for (var i = 0; i < bars; i++) {
      var s = start + i * block;
      var e = i === bars - 1 ? end : Math.min(end, s + block);
      var max = 0;
      for (var j = s; j < e; j++) {
        var abs = Math.abs(raw[j] || 0);
        if (abs > max) max = abs;
      }
      out.push(max);
      if (max > peak) peak = max;
    }
    peak = peak || 1;
    return out.map(function (v) { return Math.round((v / peak) * 1000) / 1000; });
  }
  function loadToolboxWaveform(tk, range) {
    if (!tk || !tk.mp3 || !range || range.end <= range.start) return Promise.resolve(null);
    return fetch(tk.mp3)
      .then(function (res) { if (!res.ok) throw new Error('mp3 fetch failed'); return res.arrayBuffer(); })
      .then(function (buf) { return audioContext().decodeAudioData(buf); })
      .then(function (audioBuffer) { return extractRangeWaveform(audioBuffer, range.start, range.end, 36); });
  }
  function readToolboxState(tk) {
    var api = window.HMIX_TOOLBOX_SYNC;
    if (api && typeof api.getTrackState === 'function') {
      var apiState = api.getTrackState(tk.id);
      if (apiState && apiState.range) return apiState;
    }
    var ranges = {};
    var memos = {};
    try { ranges = JSON.parse(localStorage.getItem('hmix_toolbox_ranges_v1') || '{}'); } catch (e) {}
    if (!ranges[String(tk.id)]) {
      try {
        var node = document.getElementById('hmix-toolbox-state-store');
        if (node && node.textContent) ranges = JSON.parse(node.textContent || '{}');
      } catch (e1) {}
    }
    try { memos = JSON.parse(localStorage.getItem('hmix_memos_v1') || '{}'); } catch (e2) {}
    var range = ranges[String(tk.id)] || null;
    return {
      trackId: tk.id,
      title: tk.title || tk.id,
      duration: 0,
      range: range && range.end > range.start ? range : null,
      memo: memos[String(tk.id)] || null,
      syncedAt: new Date().toISOString()
    };
  }

  /* ---- 状態 ---- */
  var state = { activeCol: 'default', selected: {}, previewId: null, prevPreviewId: null };
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
      '<div class="hmix-notebook" role="dialog" aria-modal="true" aria-label="音楽手帖">' +
        '<div class="hnb-head">' +
          '<div><span class="hnb-head__kicker">Music Notebook</span>' +
          '<span class="hnb-head__title">音楽手帖</span><span class="hnb-head__count" id="hnb-count"></span></div>' +
          '<div class="hnb-head__spacer"></div>' +
          '<input class="hnb-search" id="hnb-search" type="search" placeholder="手帖の中を検索">' +
          '<span class="hnb-sync" id="hnb-sync">この端末に保存</span>' +
          '<button class="hnb-close" id="hnb-close" aria-label="とじる">✕</button>' +
        '</div>' +
        '<nav class="hnb-spine" id="hnb-spine" aria-label="章（本棚）"></nav>' +
        '<div class="hnb-pages" id="hnb-pages"></div>' +
        '<aside class="hnb-preview" id="hnb-preview"></aside>' +
        '<div class="hnb-empty" id="hnb-empty" hidden>' +
          '<div class="hnb-empty__mark">♡</div>' +
          '<div class="hnb-empty__lead">最初のページを開きましょう</div>' +
          '<div class="hnb-empty__sub">♡で曲を栞のように挟むと、ここに綴じられていきます。使う曲にチェックを入れて、まとめて申請できます。</div>' +
          '<div class="hnb-empty__cta"><button class="hnb-cta" id="hnb-empty-browse" style="width:auto;padding:12px 22px">図書館で探す</button></div>' +
        '</div>' +
        '<div class="hnb-foot">' +
          '<div class="hnb-bulk" id="hnb-bulk">' +
            '<span class="hnb-bulk__n" id="hnb-bulk-n">0曲選択中</span>' +
            '<button class="hnb-bulk__btn" data-act="copy">別の章へコピー</button>' +
          '</div>' +
          '<div class="hnb-apply-actions">' +
            '<button class="hnb-cta hnb-cta--selected" id="hnb-selected-cta"></button>' +
          '</div>' +
          '<span class="hnb-cta__sub">使う曲だけ選べます・保険の曲は課金されません</span>' +
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
      if (act === 'copy') copySelected();
    });
    window.addEventListener('favorites:updated', function () { if (root.getAttribute('aria-hidden') === 'false') render(); });
  }

  /* ---- 描画 ---- */
  function F() { return window.HMIX_FAV; }
  function render() {
    if (!F()) return;
    var cols = F().collections();
    if (!cols.some(function (c) { return c.id === state.activeCol; })) state.activeCol = (cols[0] && cols[0].id) || 'default';
    var total = F().uniqueCount();
    els.count.textContent = total + '曲・' + cols.length + '章';
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
    els.spine.innerHTML = '<div class="hnb-spine__h">本棚 — 章</div>';
    cols.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'hnb-chapter' + (c.id === state.activeCol ? ' is-active' : '');
      b.setAttribute('data-lic', c.status || 'draft');
      b.innerHTML =
        '<div class="hnb-chapter__name">' + (c.status === 'licensed' ? LOCK_SVG : '') + escapeHtml(c.name) + '</div>' +
        '<div class="hnb-chapter__meta"><b>' + F().collectionCount(c.id) + '</b> 曲 · ' + (STATUS_LABEL[c.status] || '検討中') + '</div>';
      b.addEventListener('click', function () { state.activeCol = c.id; state.previewId = null; render(); });
      els.spine.appendChild(b);
    });
    var add = document.createElement('button');
    add.className = 'hnb-newchapter'; add.textContent = '＋ 新しい章';
    add.addEventListener('click', function () {
      var name = prompt('新しい章の名前（例：〇〇案件 / 戦闘シーン候補）');
      if (name) { var id = F().createCollection(name.trim()); state.activeCol = id; render(); }
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
      '<span class="hnb-select-tools__label">申請する曲</span>' +
      '<button type="button" class="hnb-select-tools__btn" data-select-act="all">全てチェック</button>' +
      '<button type="button" class="hnb-select-tools__btn" data-select-act="none">解除</button>';
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
      var row = document.createElement('div');
      row.className = 'hnb-row' + (state.previewId === it.trackId ? ' is-active' : '') + (pstate.id === it.trackId && pstate.playing ? ' is-playing' : '');
      row.innerHTML =
        '<input type="checkbox" class="hnb-check"' + (state.selected[it.trackId] ? ' checked' : '') + '>' +
        '<button class="hnb-iconbtn hnb-fav is-on" title="栞を外す">♥</button>' +
        '<button class="hnb-iconbtn hnb-play" title="再生">▶</button>' +
        '<div class="hnb-row__main"><div class="hnb-row__title">' + escapeHtml(title) + '</div><div class="hnb-row__tags">' + escapeHtml(tags) + '</div></div>' +
        '<span class="hnb-row__dur">' + escapeHtml(durOf(tk)) + '</span>' +
        '<span class="hnb-badge" data-lic="' + (col.status || 'draft') + '">' + (STATUS_LABEL[col.status] || '検討中') + '</span>';
      row.querySelector('.hnb-check').setAttribute('aria-label', title + 'を商用利用申請の候補に選択');
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
        if (window.HMIX_PLAYER && window.HMIX_PLAYER.playTrackById) window.HMIX_PLAYER.playTrackById(it.trackId);
      });
      row.addEventListener('click', function () { selectPreview(it.trackId); });
      els.pages.appendChild(row);
    });
    if (!shown) els.pages.innerHTML = '<div class="hnb-preview__empty" style="padding:40px">この章にはまだ曲がありません。</div>';
  }

  function renderPreview() {
    var tm = trackMap();
    var tk = state.previewId ? tm[state.previewId] : null;
    if (!tk) {
      els.preview.innerHTML = '<div class="hnb-sheet-handle"></div><div class="hnb-preview__empty">曲を選ぶと、ここに波形とメモが開きます。</div>';
      return;
    }
    var trackState = (F().state().tracks[tk.id] || {});
    var toolbox = trackState.toolbox || null;
    var bars = toolbox && toolbox.waveform ? waveBarsFromValues(toolbox.waveform) : genericWaveBars();
    var memo = trackState.favMemo || '';
    var syncInfo = toolbox && toolbox.range
      ? '<div class="hnb-tool-sync__info">同期済み: ' + escapeHtml(fmtSec(toolbox.range.start)) + ' - ' + escapeHtml(fmtSec(toolbox.range.end)) +
        ' / IN ' + escapeHtml(String(Number(toolbox.range.fadeIn || 0).toFixed(1)).replace(/\.0$/, '')) +
        's / OUT ' + escapeHtml(String(Number(toolbox.range.fadeOut || 0).toFixed(1)).replace(/\.0$/, '')) + 's</div>'
      : '<div class="hnb-tool-sync__info">通常波形を表示中</div>';
    var bTk = state.prevPreviewId ? tm[state.prevPreviewId] : null;
    var abHtml = '<div class="hnb-preview__sect">A / B 聴き比べ</div>' +
      '<div class="hnb-ab">' +
        '<button class="hnb-ab__btn" data-ab="a"><b>A</b> ' + escapeHtml((tk.title || tk.id)) + '</button>' +
        (bTk ? '<button class="hnb-ab__btn" data-ab="b"><b>B</b> ' + escapeHtml(bTk.title || bTk.id) + '</button>'
             : '<span class="hnb-ab__hint">別の曲を選ぶとBに入ります</span>') +
      '</div>';
    els.preview.innerHTML =
      '<div class="hnb-sheet-handle"></div>' +
      '<button class="hnb-sheet-close" aria-label="閉じる">✕</button>' +
      '<div class="hnb-preview__title">' + escapeHtml(tk.title || tk.id) + '</div>' +
      '<div class="hnb-preview__tags">' + escapeHtml(tagsOf(tk)) + '</div>' +
      '<div class="hnb-tool-sync">' +
        '<button type="button" class="hnb-tool-sync__btn">ツールボックスの内容を同期する</button>' +
        syncInfo +
      '</div>' +
      '<div class="hnb-wave' + (toolbox && toolbox.waveform ? ' is-synced' : '') + '">' + bars + '</div>' +
      '<div class="hnb-preview__row"><button class="hnb-iconbtn hnb-pv-play" title="再生">▶</button><span class="hnb-row__dur">' + escapeHtml(durOf(tk)) + '</span></div>' +
      abHtml +
      '<div class="hnb-preview__sect">曲メモ</div>' +
      '<textarea class="hnb-memo" placeholder="この曲を選んだ理由・使う場面…">' + escapeHtml(memo) + '</textarea>' +
      '<button class="hnb-apply-one">この曲を申請 ▸</button>';
    els.preview.querySelector('.hnb-memo').addEventListener('change', function (e) { F().setTrackMemo(tk.id, e.target.value); });
    els.preview.querySelector('.hnb-apply-one').addEventListener('click', function () { gotoLicense([tk.id]); });
    els.preview.querySelector('.hnb-tool-sync__btn').addEventListener('click', function (e) { syncToolboxToTrack(tk, e.currentTarget); });
    var pvPlay = els.preview.querySelector('.hnb-pv-play');
    if (pvPlay) pvPlay.addEventListener('click', function () { playId(tk.id); });
    var sc = els.preview.querySelector('.hnb-sheet-close');
    if (sc) sc.addEventListener('click', closeSheet);
    els.preview.querySelectorAll('.hnb-ab__btn').forEach(function (btn) {
      btn.addEventListener('click', function () { playId(btn.dataset.ab === 'b' ? state.prevPreviewId : tk.id); });
    });
  }
  function playId(id) { if (id && window.HMIX_PLAYER && window.HMIX_PLAYER.playTrackById) window.HMIX_PLAYER.playTrackById(id); }

  function syncToolboxToTrack(tk, btn) {
    if (!tk || !tk.id) return;
    var data = readToolboxState(tk);
    if (!data || !data.range || data.range.end <= data.range.start) {
      var info = els.preview.querySelector('.hnb-tool-sync__info');
      if (info) info.textContent = 'この曲の同期できる選択範囲がまだありません';
      alert('この曲の選択範囲がまだありません。制作ツールボックスで範囲を選んでから同期してください。');
      return;
    }
    var oldText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '波形を読み込み中...';
    loadToolboxWaveform(tk, data.range)
      .then(function (waveform) {
        if (!waveform || !waveform.length) throw new Error('waveform empty');
        var toolbox = {
          syncedAt: data.syncedAt || new Date().toISOString(),
          trackId: tk.id,
          title: data.title || tk.title || tk.id,
          range: {
            start: Number(data.range.start) || 0,
            end: Number(data.range.end) || 0,
            fadeIn: Number(data.range.fadeIn) || 0,
            fadeOut: Number(data.range.fadeOut) || 0
          },
          memo: data.memo || null,
          waveform: waveform
        };
        F().setTrackToolbox(tk.id, toolbox);
        if (data.memo && data.memo.text) F().setTrackMemo(tk.id, data.memo.text);
        renderPreview();
      })
      .catch(function () {
        alert('波形の読み込みに失敗しました。曲を再生してからもう一度同期してください。');
        btn.disabled = false;
        btn.textContent = oldText;
      });
  }

  function renderBulk() {
    var ids = Object.keys(state.selected);
    els.bulk.classList.toggle('is-on', ids.length > 0);
    els.bulkN.textContent = ids.length + '曲選択中';
    els.selectedCta.textContent = ids.length ? '選択曲（' + ids.length + '曲）を申請 →' : '選択曲を申請 →';
    els.selectedCta.disabled = ids.length === 0;
    els.selectedCta.style.opacity = ids.length === 0 ? '.5' : '1';
  }

  /* ---- 操作 ---- */
  function applySelected() { var ids = Object.keys(state.selected); if (ids.length) gotoLicense(ids); }
  function copySelected() {
    var ids = Object.keys(state.selected); if (!ids.length) return;
    var name = prompt('コピー先の章名（新規作成）'); if (!name) return;
    var cid = F().createCollection(name.trim()); F().copyItems(ids, cid); state.selected = {}; render();
  }
  function gotoLicense(ids) {
    location.href = (window.HMIX_BASE_PATH || '') + '/license-request.html#tracks=' + ids.join(',');
  }

  function playState() {
    try { if (window.HMIX_PLAYER && window.HMIX_PLAYER.getState) { var s = window.HMIX_PLAYER.getState(); var t = s.queue && s.queue[s.currentIndex]; return { id: t && (t.id || t), playing: !!s.isPlaying }; } } catch (e) {}
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
