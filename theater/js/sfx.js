/* ============================================================
   H/MIX THEATER — 効果音 (Web Audio 合成・ファイル不要)
   星間転送(ワープ)の「ふわっとした空気の流れ＋淡い倍音シマー＋やわらかな着地」。
   - 再生中の音楽と喧嘩しないよう控えめ音量。
   - window.__theaterSfx.set(false) / localStorage 'hmix.sfx' で ON/OFF。
   - 後日、秋山さんの生録SE(<audio>)に差し替え可能（window.__warpSfx を上書きするだけ）。
   ============================================================ */
(function () {
  var KEY = 'hmix.sfx';
  // 既定はOFF（鳴らさない）。将来「旅のしおり」の設定で '1' にすれば有効化。
  var on = (function () { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } })();
  var ctx = null;

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  // 星間ワープ — 0.9秒ほどの上品なシュイーン＋シマー
  function warp() {
    if (!on) return;
    var c = ac(); if (!c) return;
    var t = c.currentTime, dur = 0.9;

    var master = c.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.22, t + 0.10);
    master.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    master.connect(c.destination);

    // 空気の流れ: バンドパスを通したノイズが周波数を上→下へスイープ
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.4);
    var ns = c.createBufferSource(); ns.buffer = buf;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(320, t);
    bp.frequency.exponentialRampToValueAtTime(2800, t + 0.52);
    bp.frequency.exponentialRampToValueAtTime(620, t + dur);
    var nGain = c.createGain(); nGain.gain.value = 0.7;
    ns.connect(bp); bp.connect(nGain); nGain.connect(master);
    ns.start(t); ns.stop(t + dur);

    // 倍音シマー: わずかにデチューンした2つのサインがふわっと立ち上がる
    [1, 1.5].forEach(function (mul) {
      var o = c.createOscillator(); o.type = 'sine';
      var og = c.createGain();
      o.frequency.setValueAtTime(420 * mul, t);
      o.frequency.exponentialRampToValueAtTime(840 * mul, t + 0.55);
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(0.05, t + 0.16);
      og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(og); og.connect(master);
      o.start(t); o.stop(t + dur);
    });

    // やわらかな着地音 — 余韻の終わりに低めのベル
    var b = c.createOscillator(); b.type = 'triangle';
    var bg = c.createGain();
    b.frequency.setValueAtTime(300, t + 0.5);
    bg.gain.setValueAtTime(0.0001, t + 0.5);
    bg.gain.exponentialRampToValueAtTime(0.07, t + 0.62);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    b.connect(bg); bg.connect(master);
    b.start(t + 0.5); b.stop(t + dur + 0.2);
  }

  // 足跡を残したときの淡いチャイム（Chunk②で使用）
  function chime() {
    if (!on) return;
    var c = ac(); if (!c) return;
    var t = c.currentTime;
    [660, 990].forEach(function (f, k) {
      var o = c.createOscillator(); o.type = 'sine';
      var g = c.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + k * 0.08);
      g.gain.exponentialRampToValueAtTime(0.08, t + k * 0.08 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.08 + 0.5);
      o.connect(g); g.connect(c.destination);
      o.start(t + k * 0.08); o.stop(t + k * 0.08 + 0.5);
    });
  }

  window.__theaterSfx = {
    warp: warp,
    chime: chime,
    set: function (v) { on = !!v; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} },
    get: function () { return on; }
  };
  // journey-tag.js から呼ぶフック（生録SEに差し替える場合はここを上書き）
  window.__warpSfx = function () { warp(); };
})();
