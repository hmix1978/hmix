/**
 * H/MIX GALLERY — play-counter.js
 * 楽曲人気度トラッキング（再生・お気に入り）
 *
 * - ページ内のあらゆる <audio> を document レベルで監視（プレイヤー実装に非依存）
 * - 実再生時間が累計30秒を超えたら 1再生 として記録（誤クリック・即スキップ除外）
 * - 同一曲は 1人1日1回まで（localStorage でデデュプ、クライアントIDは不要）
 * - 送信先: Firebase Functions recordPlay（fire-and-forget、失敗しても無視）
 * - お気に入りは各UIから window.HMIX_PLAYS.fav(trackId) を呼ぶ
 *
 * トラックIDの解決: 音源URL /music/<dir>/<id>.mp3 の basename = tracks.js の id
 */
(function () {
  'use strict';
  if (window.HMIX_PLAYS) return; // 二重読み込み防止

  var ENDPOINT = 'https://asia-northeast1-hmix-footprints.cloudfunctions.net/recordPlay';
  var SEEN_KEY = 'hmix_play_sent_v1';   // { "play:n1": 20260613, ... }
  var THRESHOLD_SEC = 30;

  // JST の YYYYMMDD
  function today() {
    var d = new Date(Date.now() + 9 * 3600000);
    return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  }

  function alreadySentToday(key) {
    try {
      var seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
      return seen[key] === today();
    } catch (e) { return false; }
  }

  function markSent(key) {
    try {
      var seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
      var t = today();
      // 古い記録は捨てる（当日分だけ保持）
      var next = {};
      for (var k in seen) { if (seen[k] === t) next[k] = t; }
      next[key] = t;
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch (e) {}
  }

  function send(trackId, kind) {
    var key = kind + ':' + trackId;
    if (alreadySentToday(key)) return;
    markSent(key);
    try {
      // text/plain にして preflight (OPTIONS) を回避。応答は読まない
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ trackId: trackId, kind: kind }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  function idFromSrc(src) {
    var m = /\/music\/(?:[a-z0-9_]+\/)*([a-z0-9_]{1,16})\.mp3(?:[?#]|$)/i.exec(src || '');
    return m ? m[1].toLowerCase() : null;
  }

  /* ---- 再生監視: timeupdate の増分を累計し、30秒で1再生 ---- */
  var states = new WeakMap(); // audioEl -> { id, last, acc, sent }

  document.addEventListener('timeupdate', function (e) {
    var a = e.target;
    if (!a || a.tagName !== 'AUDIO') return;
    var id = idFromSrc(a.currentSrc || a.src);
    if (!id) return;

    var st = states.get(a);
    if (!st || st.id !== id) {
      st = { id: id, last: a.currentTime, acc: 0, sent: false };
      states.set(a, st);
      return;
    }
    if (a.paused) { st.last = a.currentTime; return; }

    var t = a.currentTime;
    var d = t - st.last;
    st.last = t;
    if (d > 0 && d < 2) st.acc += d; // シーク・ループの巻き戻しは加算しない

    if (!st.sent && st.acc >= THRESHOLD_SEC) {
      st.sent = true;
      send(id, 'play');
    }
  }, true);

  /* ---- お気に入り監視: hmix_favorites への「追加」を一元検知 ----
     サイト・シアター・星図などお気に入りUIは多数あるが、保存先は全て
     localStorage の hmix_favorites (track id の配列)。setItem をラップして
     新規追加された id だけ記録する（解除は数えない・1人1日1回）。 */
  var FAV_KEY = 'hmix_favorites';
  function favSet(raw) {
    try { return new Set(JSON.parse(raw || '[]').map(String)); } catch (e) { return new Set(); }
  }
  var favPrev = favSet(localStorage.getItem(FAV_KEY));
  var _origSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    _origSetItem.apply(this, arguments);
    if (this === window.localStorage && key === FAV_KEY) {
      var now = favSet(value);
      now.forEach(function (id) {
        if (!favPrev.has(id)) send(String(id).toLowerCase(), 'fav');
      });
      favPrev = now;
    }
  };
  window.addEventListener('storage', function (ev) {
    if (ev.key === FAV_KEY) favPrev = favSet(ev.newValue); // 他タブでの変更を同期
  });

  /* ---- 公開 API ---- */
  window.HMIX_PLAYS = {
    /** お気に入り追加を直接記録したい場合に呼ぶ（通常は自動検知される） */
    fav: function (trackId) {
      if (trackId) send(String(trackId).toLowerCase(), 'fav');
    }
  };
})();
