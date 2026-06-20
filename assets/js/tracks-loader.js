/**
 * H/MIX GALLERY — tracks-loader.js
 *
 * tracks.json を非同期で取得し、window.TRACKS / window.HMIX_BASE_PATH を設定する。
 *
 * 提供するAPI:
 *   window.loadTracks()     → Promise<TRACKS[]>  全曲データを取得
 *   window.prefetchTracks() → void               初期描画後の先読み（index.html向け）
 *
 * 後方互換:
 *   window.TRACKS           取得完了後に設定（既存コードがtypeof TRACKS チェックで動作）
 *   window.HMIX_BASE_PATH   即時設定（既存通り）
 *   'tracks:ready' イベント  window.TRACKS 設定完了時に dispatchEvent
 *
 * mp3パス再構築ルール:
 *   id "n1" → HMIX_BASE_PATH + "/music/n/n1.mp3"
 *   id "c5" → HMIX_BASE_PATH + "/music/c/c5.mp3"
 *   汎用:     HMIX_BASE_PATH + "/music/" + id[0] + "/" + id + ".mp3"
 */

(function () {
  'use strict';

  // ─── BASE_PATH 設定（tracks.js と同一ロジック） ────────────────────────
  const BASE_PATH = (function () {
    if (typeof window !== 'undefined') {
      if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.manus.computer')
      ) {
        return '';
      }
    }
    return '';
  })();

  // BASE_PATH は即時公開（既存コードの互換）
  window.HMIX_BASE_PATH = BASE_PATH;

  // ─── キャッシュキー: 日次回転 ─────────────────────────────────────
  // 旧: Date.now() (秒精度) → ページ遷移ごとに 8000+行の tracks.js を再ダウンロード
  // 新: YYYYMMDD (日次回転) → 同日内はブラウザキャッシュヒット、日替わりで自動更新
  // 新曲追加時は翌日には全ブラウザに自動伝播するため、手動バンプ不要
  const TRACKS_VERSION = (function () {
    var d = new Date();
    return d.getFullYear()
      + String(d.getMonth() + 1).padStart(2, '0')
      + String(d.getDate()).padStart(2, '0');
  })();

  // ─── tracks.json のパス解決 ─────────────────────────────────────────
  // document.currentScript.src からスクリプト自身の位置を基準に解決する。
  // これにより、サブディレクトリへのデプロイや BASE_PATH 不一致を防げる。
  // 例: https://example.com/sub/assets/js/tracks-loader.js
  //     → https://example.com/sub/assets/data/tracks.json
  const _scriptSrc = (document.currentScript || {}).src || '';
  const _scriptBase = _scriptSrc
    ? _scriptSrc.replace(/\/assets\/js\/[^/]+$/, '')
    : BASE_PATH;

  // JSONではなく、ユーザーが直接編集する tracks.js をロード元にする
  const SCRIPT_URL = _scriptBase + '/assets/js/tracks.js?v=' + TRACKS_VERSION;

  // ─── メモリキャッシュ ─────────────────────────────────────────────────
  let _cache = null;       // 取得済みデータ（TRACKS[]）
  let _promise = null;     // 進行中のfetch Promise（二重fetch防止）

  // ─── mp3パス付与 ──────────────────────────────────────────────────────
  function attachMp3(tracks) {
    tracks.forEach(function (t) {
      t.mp3 = BASE_PATH + '/music/' + t.id.charAt(0) + '/' + t.id + '.mp3';
    });
    return tracks;
  }

  // ─── 英語タイトル付与 ─────────────────────────────────────────────────
  // title_en.json を fetch してマージする。
  // tracks.js がタグエディタで上書きされても title_en が消えないようにするための仕組み。
  var TITLE_EN_URL = _scriptBase + '/assets/data/title_en.json?v=' + TRACKS_VERSION;
  function attachTitleEn(tracks) {
    return fetch(TITLE_EN_URL)
      .then(function(r) { return r.json(); })
      .then(function(map) {
        tracks.forEach(function(t) {
          if (!t.title_en && map[t.id]) t.title_en = map[t.id];
        });
        return tracks;
      })
      .catch(function() { return tracks; }); // 失敗しても無音でスキップ
  }

  // ─── loadTracks() ─────────────────────────────────────────────────────
  /**
   * 全楽曲データを取得して返す。
   * キャッシュがあれば即時解決、なければfetchして返す。
   * @returns {Promise<Array>} TRACKS 配列
   */
  function loadTracks() {
    // キャッシュヒット
    if (_cache) {
      return Promise.resolve(_cache);
    }

    // 進行中のfetchがあれば同じPromiseを返す（二重fetch防止）
    if (_promise) {
      return _promise;
    }

    _promise = new Promise(function(resolve, reject) {
      // 既に window.TRACKS があれば即時完了
      if (window.TRACKS && window.TRACKS.length > 0) {
        _cache = window.TRACKS;
        attachMp3(_cache);
        attachTitleEn(_cache).then(resolve).catch(function() { resolve(_cache); });
        return;
      }
      
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = function() {
        if (!window.TRACKS || !window.TRACKS.length) {
          reject(new Error('[tracks-loader] tracks.js loaded but window.TRACKS is empty.'));
          return;
        }
        _cache = window.TRACKS;
        attachMp3(_cache);
        attachTitleEn(_cache).then(function(tracks) {
          // 'tracks:ready' イベントを発火（非同期連携用）
          window.dispatchEvent(new CustomEvent('tracks:ready', { detail: { tracks: tracks } }));
          resolve(tracks);
        }).catch(function() {
          window.dispatchEvent(new CustomEvent('tracks:ready', { detail: { tracks: _cache } }));
          resolve(_cache);
        });
      };
      script.onerror = function() {
        _promise = null;
        reject(new Error('[tracks-loader] Failed to load ' + SCRIPT_URL));
      };
      document.head.appendChild(script);
    });

    return _promise;
  }

  // ─── prefetchTracks() ─────────────────────────────────────────────────
  /**
   * 初期描画をブロックせずにバックグラウンドで先読みを開始する。
   * index.html 向け：DOMContentLoaded 後に呼ぶことで
   * ユーザーが Scene Search を使う前にデータが揃う。
   */
  function prefetchTracks() {
    if (_cache || _promise) return; // 既にキャッシュ or 取得中なら不要
    // requestIdleCallback があれば使い、なければ setTimeout で非同期化
    var schedule = window.requestIdleCallback || function (fn) { setTimeout(fn, 100); };
    schedule(function () {
      loadTracks().catch(function () {}); // エラーはloadTracks内でログ済み
    });
  }

  // ─── グローバル公開 ────────────────────────────────────────────────────
  window.loadTracks     = loadTracks;
  window.prefetchTracks = prefetchTracks;

})();
