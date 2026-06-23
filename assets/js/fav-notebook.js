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
          '<div class="hnb-empty__sub">♡で曲を栞のように挟むと、ここに綴じられていきます。章に束ねて、まるごと使用許諾を申請できます。</div>' +
          '<div class="hnb-empty__cta"><button class="hnb-cta" id="hnb-empty-browse" style="width:auto;padding:12px 22px">図書館で探す</button></div>' +
        '</div>' +
        '<div class="hnb-foot">' +
          '<div class="hnb-bulk" id="hnb-bulk">' +
            '<span class="hnb-bulk__n" id="hnb-bulk-n">0曲選択中</span>' +
            '<button class="hnb-bulk__btn" data-act="copy">別の章へコピー</button>' +
            '<button class="hnb-bulk__btn" data-act="apply">まとめて申請</button>' +
            '<button class="hnb-bulk__btn" data-act="clear">選択解除</button>' +
          '</div>' +
          '<button class="hnb-cta" id="hnb-cta"></button>' +
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
    els.cta = root.querySelector('#hnb-cta');
    els.bulk = root.querySelector('#hnb-bulk');
    els.bulkN = root.querySelector('#hnb-bulk-n');
    els.search = root.querySelector('#hnb-search');

    root.querySelector('#hnb-close').addEventListener('click', close);
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.getAttribute('aria-hidden') === 'false') close(); });
    els.search.addEventListener('input', renderPages);
    els.cta.addEventListener('click', applyChapter);
    root.querySelector('#hnb-empty-browse').addEventListener('click', function () { location.href = (window.HMIX_BASE_PATH || '') + '/music-library.html'; });
    els.bulk.addEventListener('click', function (e) {
      var b = e.target.closest('.hnb-bulk__btn'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'clear') { state.selected = {}; render(); }
      else if (act === 'apply') applySelected();
      else if (act === 'copy') copySelected();
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
    els.empty.style.display = isEmpty ? 'flex' : 'none';
    els.pages.style.display = isEmpty ? 'none' : '';
    els.preview.style.display = isEmpty ? 'none' : '';
    renderSpine(cols);
    if (!isEmpty) { renderPages(); renderPreview(); }
    renderFoot(cols);
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
    var shown = 0;
    rows.forEach(function (it) {
      var tk = tm[it.trackId];
      var title = (tk && tk.title) || it.trackId;
      var tags = tagsOf(tk);
      if (q && (title.toLowerCase().indexOf(q) === -1 && tags.toLowerCase().indexOf(q) === -1)) return;
      shown++;
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
    var bars = '';
    for (var i = 0; i < 36; i++) { var h = 16 + Math.round(64 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.21))); bars += '<span style="height:' + h + '%"></span>'; }
    var memo = (F().state().tracks[tk.id] && F().state().tracks[tk.id].favMemo) || '';
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
      '<div class="hnb-wave">' + bars + '</div>' +
      '<div class="hnb-preview__row"><button class="hnb-iconbtn hnb-pv-play" title="再生">▶</button><span class="hnb-row__dur">' + escapeHtml(durOf(tk)) + '</span></div>' +
      abHtml +
      '<div class="hnb-preview__sect">曲メモ</div>' +
      '<textarea class="hnb-memo" placeholder="この曲を選んだ理由・使う場面…">' + escapeHtml(memo) + '</textarea>' +
      '<button class="hnb-apply-one">この曲を申請 ▸</button>';
    els.preview.querySelector('.hnb-memo').addEventListener('change', function (e) { F().setTrackMemo(tk.id, e.target.value); });
    els.preview.querySelector('.hnb-apply-one').addEventListener('click', function () { gotoLicense([tk.id]); });
    var pvPlay = els.preview.querySelector('.hnb-pv-play');
    if (pvPlay) pvPlay.addEventListener('click', function () { playId(tk.id); });
    var sc = els.preview.querySelector('.hnb-sheet-close');
    if (sc) sc.addEventListener('click', closeSheet);
    els.preview.querySelectorAll('.hnb-ab__btn').forEach(function (btn) {
      btn.addEventListener('click', function () { playId(btn.dataset.ab === 'b' ? state.prevPreviewId : tk.id); });
    });
  }
  function playId(id) { if (id && window.HMIX_PLAYER && window.HMIX_PLAYER.playTrackById) window.HMIX_PLAYER.playTrackById(id); }

  function renderFoot(cols) {
    var col = cols.filter(function (c) { return c.id === state.activeCol; })[0];
    var n = col ? F().collectionCount(col.id) : 0;
    els.cta.textContent = 'この章（' + n + '曲）をまるごと申請 →';
    els.cta.disabled = n === 0;
    els.cta.style.opacity = n === 0 ? '.5' : '1';
  }

  function renderBulk() {
    var ids = Object.keys(state.selected);
    els.bulk.classList.toggle('is-on', ids.length > 0);
    els.bulkN.textContent = ids.length + '曲選択中';
  }

  /* ---- 操作 ---- */
  function chapterTrackIds() { return F().getView({ collectionId: state.activeCol, sort: 'order' }).map(function (it) { return it.trackId; }); }
  function applyChapter() { var ids = chapterTrackIds(); if (ids.length) gotoLicense(ids); }
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
