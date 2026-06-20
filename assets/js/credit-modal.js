/**
 * H/MIX GALLERY — credit-modal.js
 * ダウンロード時のクレジットコピーモーダル
 *
 * music-library.html のダウンロードボタン（.ml-btn-dl）クリック時に発動。
 * ダウンロード自体はブラウザのデフォルト動作で実行し、
 * 同時にモーダルを表示してクレジット文をコピーしてもらう。
 */

(function () {
  'use strict';

  // ─── 言語ユーティリティ ───────────────────────────
  function getLang() {
    return window.HMIX_LANG || (function () {
      try { return sessionStorage.getItem('hmix_lang') || 'ja'; } catch (e) { return 'ja'; }
    })();
  }

  // ─── モーダルHTML生成（初回のみ） ────────────────
  function buildModal() {
    if (document.getElementById('credit-dl-modal')) return;

    var modal = document.createElement('div');
    modal.id = 'credit-dl-modal';
    modal.className = 'fav-modal';
    modal.setAttribute('hidden', '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'credit-dl-modal-title');

    modal.innerHTML = [
      '<div class="fav-modal__backdrop" id="credit-dl-backdrop"></div>',
      '<div class="fav-modal__panel credit-dl-panel">',
      '  <div class="fav-modal__header">',
      '    <h2 class="fav-modal__title" id="credit-dl-modal-title">',
      '      <span class="cdm-title-ja">ありがとうございます！</span>',
      '      <span class="cdm-title-en" style="display:none;">Thank you!</span>',
      '    </h2>',
      '    <button type="button" class="fav-modal__close" id="credit-dl-close" aria-label="閉じる">',
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">',
      '        <path d="M18 6L6 18M6 6l12 12"/>',
      '      </svg>',
      '    </button>',
      '  </div>',
      '  <div class="credit-dl-body">',
      '    <p class="credit-dl-micro cdm-micro-ja">',
      '      この文を概要欄に貼っていただけると、秋山が次の曲を作る励みになります。',
      '    </p>',
      '    <p class="credit-dl-micro cdm-micro-en" style="display:none;">',
      '      Pasting this in your description helps Hirokazu create more free music.',
      '    </p>',
      '    <textarea class="credit-dl-textarea" id="credit-dl-text" readonly rows="3"></textarea>',
      '    <div class="credit-dl-actions" style="margin-bottom:12px;">',
      '      <button type="button" class="credit-dl-btn credit-dl-btn--primary" id="credit-dl-copy">',
      '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="15" height="15">',
      '          <rect x="9" y="9" width="13" height="13" rx="2"/>',
      '          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
      '        </svg>',
      '        <span class="cdm-copy-label-ja">コピーする</span>',
      '        <span class="cdm-copy-label-en" style="display:none;">Copy</span>',
      '      </button>',
      '      <button type="button" class="credit-dl-btn credit-dl-btn--secondary" id="credit-dl-save">',
      '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">',
      '          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
      '          <polyline points="7 10 12 15 17 10"/>',
      '          <line x1="12" y1="15" x2="12" y2="3"/>',
      '        </svg>',
      '        <span>.txt で保存</span>',
      '      </button>',
      '    </div>',
      '    <div class="credit-dl-hashtag-section">',
      '      <p class="credit-dl-hashtag-label cdm-micro-ja">投稿用ハッシュタグ</p>',
      '      <p class="credit-dl-hashtag-label cdm-micro-en" style="display:none;">Hashtags</p>',
      '      <div class="credit-dl-hashtag-row">',
      '        <span class="credit-dl-hashtag-text" id="credit-dl-hashtags"></span>',
      '        <button type="button" class="credit-dl-btn credit-dl-btn--small" id="credit-dl-hashtag-copy">',
      '          <span class="cdm-copy-label-ja">コピー</span>',
      '          <span class="cdm-copy-label-en" style="display:none;">Copy</span>',
      '        </button>',
      '      </div>',
      '    </div>',
      '    <button type="button" class="credit-dl-dismiss" id="credit-dl-dismiss">',
      '      <span class="cdm-dismiss-ja">閉じる</span>',
      '      <span class="cdm-dismiss-en" style="display:none;">Close</span>',
      '    </button>',
      '  </div>',
      '</div>',
    ].join('\n');

    document.body.appendChild(modal);

    // ── イベント登録 ──────────────────────────────
    document.getElementById('credit-dl-backdrop').addEventListener('click', closeModal);
    document.getElementById('credit-dl-close').addEventListener('click', closeModal);
    document.getElementById('credit-dl-dismiss').addEventListener('click', closeModal);

    document.getElementById('credit-dl-copy').addEventListener('click', function () {
      var textarea = document.getElementById('credit-dl-text');
      var text = textarea.value;
      var btn = this;
      var isJa = getLang() !== 'en';

      function onCopied() {
        var labelJa = btn.querySelector('.cdm-copy-label-ja');
        var labelEn = btn.querySelector('.cdm-copy-label-en');
        var activeLabel = isJa ? labelJa : labelEn;
        if (activeLabel) {
          var origText = activeLabel.textContent;
          activeLabel.textContent = isJa ? 'コピーしました ✓' : 'Copied ✓';
          btn.classList.add('copied');
          setTimeout(function () {
            activeLabel.textContent = origText;
            btn.classList.remove('copied');
          }, 2000);
        }
      }

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(onCopied).catch(function () {
          fallbackCopy(textarea);
          onCopied();
        });
      } else {
        fallbackCopy(textarea);
        onCopied();
      }
    });

    document.getElementById('credit-dl-save').addEventListener('click', function () {
      var text = document.getElementById('credit-dl-text').value;
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'credit_hmix.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // ハッシュタグコピー
    document.getElementById('credit-dl-hashtag-copy').addEventListener('click', function () {
      var hashEl = document.getElementById('credit-dl-hashtags');
      if (!hashEl) return;
      var text = hashEl.textContent;
      var btn = this;
      var isJa = getLang() !== 'en';
      navigator.clipboard.writeText(text).then(function () {
        var label = btn.querySelector(isJa ? '.cdm-copy-label-ja' : '.cdm-copy-label-en');
        if (label) {
          var orig = label.textContent;
          label.textContent = '✓';
          setTimeout(function () { label.textContent = orig; }, 2000);
        }
      }).catch(function () {});
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function fallbackCopy(textarea) {
    textarea.select();
    try { document.execCommand('copy'); } catch (e) {}
  }

  // ─── モーダルを開く ──────────────────────────────
  // ハッシュタグ生成
  function _genHashtags(trackTitle) {
    var tags = ['#フリーBGM', '#HMIXGALLERY'];
    // 再生中の曲からジャンルタグを取得
    if (window.HMIX_PLAYER) {
      var st = window.HMIX_PLAYER.getState();
      if (st && st.queue && st.currentIndex >= 0) {
        var track = st.queue[st.currentIndex];
        if (track) {
          var allTags = [].concat(track.feeling || [], track.style || [], track.scene || []);
          var map = {
            japanese: '#和風BGM #JapaneseMusic', oriental: '#和風BGM',
            fantasy: '#ファンタジーBGM #FantasyBGM', scary: '#ホラーBGM #HorrorBGM',
            japanese_horror: '#和風ホラーBGM #JapaneseHorror', western_horror: '#洋風ホラーBGM #WesternHorror',
            sad: '#感動BGM #Emotional', gentle: '#癒しBGM #Healing',
            epic: '#壮大BGM #EpicMusic', battle: '#戦闘BGM #BattleMusic',
            celtic: '#ケルトBGM #CelticMusic', night: '#夜BGM', cute: '#かわいいBGM'
          };
          allTags.forEach(function (t) { if (map[t]) tags.push(map[t]); });
        }
      }
    }
    // 重複排除して6個まで
    var unique = [];
    tags.join(' ').split(' ').forEach(function (t) { if (t && unique.indexOf(t) < 0) unique.push(t); });
    return unique.slice(0, 8).join(' ');
  }

  function openModal(trackTitle) {
    var lang = getLang();
    var isEn = (lang === 'en');

    // テキスト生成
    var text = isEn
      ? 'Music: ' + trackTitle + ' by H/MIX GALLERY (Hirokazu Akiyama)\nhttps://www.hmix.net | Free music for YouTube'
      : 'BGM：' + trackTitle + ' / H/MIX GALLERY（秋山裕和）\nhttps://www.hmix.net';

    var textarea = document.getElementById('credit-dl-text');
    if (textarea) textarea.value = text;

    // ハッシュタグ
    var hashEl = document.getElementById('credit-dl-hashtags');
    if (hashEl) hashEl.textContent = _genHashtags(trackTitle);

    // 言語切替
    var jaEls = document.querySelectorAll('#credit-dl-modal .cdm-title-ja, #credit-dl-modal .cdm-micro-ja, #credit-dl-modal .cdm-copy-label-ja, #credit-dl-modal .cdm-dismiss-ja');
    var enEls = document.querySelectorAll('#credit-dl-modal .cdm-title-en, #credit-dl-modal .cdm-micro-en, #credit-dl-modal .cdm-copy-label-en, #credit-dl-modal .cdm-dismiss-en');
    jaEls.forEach(function (el) { el.style.display = isEn ? 'none' : ''; });
    enEls.forEach(function (el) { el.style.display = isEn ? '' : 'none'; });

    var modal = document.getElementById('credit-dl-modal');
    modal.removeAttribute('hidden');
    document.body.classList.add('fav-modal-open');

    // フォーカスをコピーボタンへ
    var copyBtn = document.getElementById('credit-dl-copy');
    if (copyBtn) setTimeout(function () { copyBtn.focus(); }, 50);
  }

  // ─── モーダルを閉じる ────────────────────────────
  function closeModal() {
    var modal = document.getElementById('credit-dl-modal');
    if (modal) modal.setAttribute('hidden', '');
    document.body.classList.remove('fav-modal-open');
  }

  // ─── ダウンロードボタンへのフック ────────────────
  function hookDownloadButtons() {
    var pageEl = document.getElementById('page-content');
    if (!pageEl) return;
    var pageType = pageEl.dataset.pageType;

    if (pageType === 'library') {
      // ─── Music Library: グリッド全体にイベント委譲 ───
      var grid = document.getElementById('ml-grid');
      if (!grid) return;

      grid.addEventListener('click', function (e) {
        var dlBtn = e.target.closest('.ml-btn-dl');
        if (!dlBtn) return;

        var card = dlBtn.closest('.ml-card');
        if (!card) return;

        var trackId = card.dataset.trackId;
        var trackTitle = '';
        if (window.TRACKS && trackId) {
          var track = window.TRACKS.find(function (t) { return String(t.id) === String(trackId); });
          if (track) {
            var lang = getLang();
            trackTitle = (lang === 'en' && track.title_en) ? track.title_en : (track.title || trackId);
          }
        }
        if (!trackTitle) trackTitle = dlBtn.getAttribute('aria-label') || trackId || 'Track';
        trackTitle = trackTitle.replace(/\s*をダウンロード$/, '').replace(/\s*to download$/, '');

        openModal(trackTitle);
      }, true);

    } else if (pageType === 'track-detail') {
      // ─── 個別曲ページ: #td2-download-btn に直接フック ───
      var dlBtn = document.getElementById('td2-download-btn');
      if (!dlBtn) return;

      // 既にフック済みなら二重登録しない
      if (dlBtn.dataset.creditHooked) return;
      dlBtn.dataset.creditHooked = '1';

      dlBtn.addEventListener('click', function (e) {
        // ダウンロード自体はブラウザのデフォルト動作で実行、モーダルを追加表示
        var trackTitle = '';
        // HMIX_PLAYER の現在曲 or TRACKS からIDを解決
        var trackId = dlBtn.href
          ? dlBtn.href.split('/').pop().replace(/\.mp3$/, '')
          : '';
        if (window.TRACKS && trackId) {
          var track = window.TRACKS.find(function (t) { return String(t.id) === String(trackId); });
          if (track) {
            var lang = getLang();
            trackTitle = (lang === 'en' && track.title_en) ? track.title_en : (track.title || trackId);
          }
        }
        if (!trackTitle) {
          // track-detail.js が設定した #td2-hero-title を参照
          var titleEl = document.getElementById('td2-hero-title');
          if (titleEl) trackTitle = titleEl.textContent.trim();
        }
        if (!trackTitle) trackTitle = 'Track';

        openModal(trackTitle);
      }, true);
    }
  }

  // ─── 初期化 ──────────────────────────────────────
  function init() {
    buildModal();
    hookDownloadButtons();
  }

  // DOMContentLoaded と PJAX 両方に対応
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('hmix:page:init', init);

  // 外部からも呼び出せるように公開
  window.HMIX_CREDIT_MODAL = {
    open: openModal,
    close: closeModal,
  };

})();
