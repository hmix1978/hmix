/**
 * H/MIX GALLERY - footprints-detail.js
 * Listener footprints UI for track detail pages.
 */
(function () {
  'use strict';

  var _currentTrackId = null;

  var TEXT = {
    ja: {
      aria: '旅人の足跡',
      title: '旅人の足跡',
      sub: 'Notes from listeners',
      lead: 'この曲に触れて浮かんだ景色を、ひとこと残していけます。',
      disabled: 'この機能は現在準備中です。<br><span style="font-size:0.8em;">Coming soon...</span>',
      namePlaceholder: 'お名前（省略すると「旅人」）',
      bodyPlaceholder: '例：夜明け前の森を歩いているような静けさを感じた',
      submit: '足跡を残す',
      empty: 'まだ足跡はありません。<br><span>最初の旅人になりましょう。</span>',
      defaultName: '旅人',
      success: '足跡を残しました。ありがとうございます。',
      deleteTitle: 'この足跡を削除'
    },
    en: {
      aria: 'Listener Footprints',
      title: 'Listener Footprints',
      sub: 'Small notes left by travelers',
      lead: 'Leave a short note about the scene this track brought to mind.',
      disabled: 'This feature is being prepared.<br><span style="font-size:0.8em;">Coming soon...</span>',
      namePlaceholder: 'Name (optional, shown as “Traveler”)',
      bodyPlaceholder: 'Example: It felt like walking through a quiet forest before dawn',
      submit: 'Leave a Footprint',
      empty: 'No footprints yet.<br><span>Be the first traveler to leave one.</span>',
      defaultName: 'Traveler',
      success: 'Your footprint has been added. Thank you.',
      deleteTitle: 'Delete this footprint'
    }
  };

  function getLang() {
    try {
      var urlLang = new URLSearchParams(window.location.search).get('lang');
      if (urlLang === 'en' || urlLang === 'ja') return urlLang;
    } catch (e) {}
    try {
      var saved = sessionStorage.getItem('hmix_lang');
      if (saved === 'en' || saved === 'ja') return saved;
    } catch (e) {}
    return window.HMIX_LANG === 'en' ? 'en' : 'ja';
  }

  function t(key) {
    return (TEXT[getLang()] && TEXT[getLang()][key]) || TEXT.ja[key] || '';
  }

  function getTrackId() {
    var pageEl = document.getElementById('page-content');
    var explicitId = pageEl && pageEl.getAttribute('data-page-track-id');
    if (explicitId) return explicitId;

    var pathname = window.location.pathname;
    var filename = pathname.split('/').pop();
    if (filename && filename !== 'track.html' && filename.endsWith('.html')) {
      return filename.replace('.html', '');
    }
    try {
      return new URLSearchParams(window.location.search).get('id') || null;
    } catch (e) {
      return null;
    }
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildSectionHTML() {
    var isDisabled = window.HMIX_FOOTPRINTS && window.HMIX_FOOTPRINTS.disabled;
    var formHTML = isDisabled
      ? '<div class="fp-form" id="fp-form">' +
          '<p class="fp-lead fp-lead--disabled" style="text-align:center;opacity:0.6;">' + t('disabled') + '</p>' +
        '</div>'
      : '<div class="fp-form" id="fp-form">' +
          '<p class="fp-lead">' + esc(t('lead')) + '</p>' +
          '<div class="fp-fields">' +
            '<input class="fp-nickname" id="fp-nickname" type="text" maxlength="20" placeholder="' + esc(t('namePlaceholder')) + '" autocomplete="off">' +
            '<div class="fp-textarea-wrap">' +
              '<textarea class="fp-body" id="fp-body" maxlength="60" rows="2" placeholder="' + esc(t('bodyPlaceholder')) + '"></textarea>' +
              '<span class="fp-count"><span id="fp-body-count">0</span>/60</span>' +
            '</div>' +
            '<div class="fp-form-footer">' +
              '<p class="fp-note" id="fp-note"></p>' +
              '<button class="fp-submit" id="fp-submit" type="button">' + esc(t('submit')) + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

    return '<section class="block fp-section footprints-block" id="fp-section" aria-label="' + esc(t('aria')) + '" data-screen-label="Footprints">' +
      '<div class="wrap">' +
        '<div class="td2-divider">' +
          '<span class="td2-divider__line"></span>' +
          '<span class="td2-divider__gem"></span>' +
          '<span class="td2-divider__line"></span>' +
        '</div>' +
        '<div class="sec-head reveal">' +
          '<span class="idx">06</span>' +
          '<h2 class="fp-heading">' + esc(t('title')) + '</h2>' +
          '<span class="sub fp-subheading">' + esc(t('sub')) + '</span>' +
        '</div>' +
        '<div class="fp-stage reveal">' +
          formHTML +
          '<div class="fp-list-wrap">' +
            '<div class="fp-list" id="fp-list"></div>' +
            '<p class="fp-empty" id="fp-empty" hidden>' + t('empty') + '</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function renderList(trackId) {
    if (!window.HMIX_FOOTPRINTS) return;

    var list = document.getElementById('fp-list');
    var empty = document.getElementById('fp-empty');
    if (!list || !empty) return;

    var thisItems = window.HMIX_FOOTPRINTS.get(trackId) || [];
    var otherItems = [];

    if (window.HMIX_FOOTPRINTS.getAll) {
      var all = window.HMIX_FOOTPRINTS.getAll();
      Object.keys(all).forEach(function (tid) {
        if (tid === trackId) return;
        (all[tid] || []).forEach(function (item) { otherItems.push(item); });
      });
    }

    otherItems.sort(function (a, b) {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    var combined = thisItems.concat(otherItems);

    if (combined.length === 0) {
      list.innerHTML = '';
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    list.innerHTML = combined.map(function (item) {
      var trackTitle = item.trackTitle || '';
      var trackLink = '';
      if (trackTitle && item.trackId && item.trackId !== trackId) {
        trackLink = '<a href="/music/' + esc(item.trackId) + '.html" class="fp-card__track">♪ ' + esc(trackTitle) + '</a>';
      }

      var deleteBtn = '';
      if (item.isOwn && item.commentId) {
        deleteBtn = '<button class="fp-card__delete" data-track-id="' + esc(item.trackId || trackId) + '" data-comment-id="' + esc(item.commentId) + '" title="' + esc(t('deleteTitle')) + '">×</button>';
      }

      return '<article class="fp-card' + (item.isOwn ? ' fp-card--own' : '') + '">' +
        '<header class="fp-card__header">' +
          '<span class="fp-card__name">' + esc(item.nickname) + '</span>' +
          trackLink +
          '<time class="fp-card__date" datetime="' + esc(item.createdAt) + '">' +
            esc(window.HMIX_FOOTPRINTS.formatDate(item.createdAt)) +
          '</time>' +
          deleteBtn +
        '</header>' +
        '<p class="fp-card__body">' + esc(item.body).replace(/\n/g, '<br>') + '</p>' +
      '</article>';
    }).join('');

    list.querySelectorAll('.fp-card__delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!window.HMIX_FOOTPRINTS) return;
        window.HMIX_FOOTPRINTS.remove(btn.dataset.trackId, btn.dataset.commentId);
        renderList(trackId);
      });
    });
  }

  function initForm(trackId) {
    var bodyEl = document.getElementById('fp-body');
    var countEl = document.getElementById('fp-body-count');
    var noteEl = document.getElementById('fp-note');
    var submitEl = document.getElementById('fp-submit');

    if (!bodyEl || !submitEl) return;

    bodyEl.addEventListener('input', function () {
      if (countEl) countEl.textContent = bodyEl.value.length;
    });

    submitEl.addEventListener('click', function () {
      if (!window.HMIX_FOOTPRINTS) return;

      var nicknameEl = document.getElementById('fp-nickname');
      var nickname = nicknameEl && nicknameEl.value ? nicknameEl.value : t('defaultName');
      var heroEl = document.getElementById('td2-hero-title');
      var trackTitle = heroEl ? heroEl.textContent.trim() : '';
      var result = window.HMIX_FOOTPRINTS.post(trackId, bodyEl.value, nickname, 'detail', trackTitle);

      if (!result.ok) {
        if (noteEl) {
          noteEl.textContent = result.error;
          noteEl.className = 'fp-note fp-note--error';
        }
        return;
      }

      bodyEl.value = '';
      if (countEl) countEl.textContent = '0';
      if (noteEl) {
        noteEl.textContent = t('success');
        noteEl.className = 'fp-note fp-note--success';
        setTimeout(function () {
          noteEl.textContent = '';
          noteEl.className = 'fp-note';
        }, 3000);
      }
      renderList(trackId);
    });

    bodyEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitEl.click();
    });
  }

  function setupReveal(section) {
    var nodes = section.querySelectorAll('.reveal');
    if (!nodes.length) return;

    function revealVisibleNow() {
      var viewport = window.innerHeight || document.documentElement.clientHeight || 0;
      nodes.forEach(function (node) {
        if (node.classList.contains('in')) return;
        var rect = node.getBoundingClientRect();
        if (rect.top < viewport * 0.92 && rect.bottom > -80) node.classList.add('in');
      });
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.14 });
      nodes.forEach(function (node) { io.observe(node); });
    }

    window.addEventListener('scroll', revealVisibleNow, { passive: true });
    window.addEventListener('resize', revealVisibleNow);
    requestAnimationFrame(revealVisibleNow);
    setTimeout(revealVisibleNow, 450);
  }

  function init() {
    var pageEl = document.getElementById('page-content');
    if (!pageEl || pageEl.dataset.pageType !== 'track-detail') return;

    var trackId = getTrackId();
    if (!trackId) return;

    var existing = document.getElementById('fp-section');
    if (existing) existing.remove();

    var insertBeforeEl = document.querySelector('#page-content .site-footer') || document.querySelector('.td2-back');
    if (!insertBeforeEl) return;

    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildSectionHTML();
    var section = wrapper.firstChild;
    insertBeforeEl.parentNode.insertBefore(section, insertBeforeEl);
    setupReveal(section);

    _currentTrackId = trackId;

    function tryRender() {
      if (window.HMIX_FOOTPRINTS) {
        renderList(trackId);
        initForm(trackId);
      } else {
        setTimeout(tryRender, 100);
      }
    }
    tryRender();
  }

  window.addEventListener('footprints:updated', function (e) {
    if (!e.detail || e.detail.trackId === _currentTrackId) renderList(_currentTrackId);
  });

  window.addEventListener('hmix:page:init', function () {
    requestAnimationFrame(init);
  });

  window.addEventListener('hmix:lang', function () {
    requestAnimationFrame(init);
  });

  window.HMIX_FOOTPRINTS_DETAIL = { init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
