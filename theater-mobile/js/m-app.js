/* ============================================================
   TAG COCKPIT — MOBILE  /  m-app.js
   App shell: shared icons, boots the star canvas, applies tweaks,
   wires the Tweaks panel + host protocol, and starts every module.
   Exposes: window.MX  (ICONS, setTweak)
   ============================================================ */
(function () {
  const ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    playSm: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 6v12h2V6H7zm3 6l9 6V6l-9 6z"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6v12h2V6h-2zM5 18l9-6-9-6v12z"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.3 2 5 5.2 5c2 0 3.3 1.2 4.1 2.4l.7 1 .7-1C11.5 6.2 12.8 5 14.8 5 18 5 19.5 8.3 18 11.7 15.5 16.4 12 21 12 21z"/></svg>'
  };

  let panel, tweaksOn = false;

  function applyTweak(key, val, persist) {
    window.MTWEAKS[key] = val;
    if (key === 'atlasMode') { window.MTWEAKS.atlasMode = 'hybrid'; window.MAtlas && window.MAtlas.setMode('hybrid', true); }
    if (key === 'mood') document.body.classList.toggle('mood-clear', val === 'clear');
    if (key === 'accent' && document.body.dataset.screen === 'atlas') {
      MStars.setAura(val.split(',').map(Number));
      document.getElementById('app').style.setProperty('--aura', val);
    }
    if (persist) window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
    syncPanel();
  }
  function syncPanel() {
    if (!panel) return;
    setRadio('twSheet', window.MTWEAKS.sheetOpen);
    setRadio('twMood', window.MTWEAKS.mood);
    panel.querySelectorAll('#twAccent button').forEach(b => b.classList.toggle('on', b.dataset.v === window.MTWEAKS.accent));
    document.getElementById('twEffects').classList.toggle('on', !!window.MTWEAKS.effects);
  }
  function setRadio(id, v) { const g = document.getElementById(id); if (g) g.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); }

  function wireTweaks() {
    panel = document.getElementById('tweaks');
    panel.querySelector('#twClose').addEventListener('click', () => { setTweaks(false); window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); });
    panel.querySelectorAll('#twSheet button').forEach(b => b.addEventListener('click', () => applyTweak('sheetOpen', b.dataset.v, true)));
    panel.querySelectorAll('#twMood button').forEach(b => b.addEventListener('click', () => applyTweak('mood', b.dataset.v, true)));
    panel.querySelectorAll('#twAccent button').forEach(b => b.addEventListener('click', () => applyTweak('accent', b.dataset.v, true)));
    document.getElementById('twEffects').addEventListener('click', () => applyTweak('effects', !window.MTWEAKS.effects, true));

    window.addEventListener('message', e => {
      const t = e.data && e.data.type;
      if (t === '__activate_edit_mode') setTweaks(true);
      else if (t === '__deactivate_edit_mode') setTweaks(false);
    });
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  }
  function setTweaks(on) { tweaksOn = on; panel.classList.toggle('on', on); if (on) syncPanel(); }

  window.MX = { ICONS, setTweak: (k, v) => applyTweak(k, v, true) };

  function boot() {
    const canvas = document.getElementById('starCanvas');
    MStars.init(canvas, document.getElementById('app'));
    MStars.setAura((window.MTWEAKS.accent || '216,180,106').split(',').map(Number));
    document.getElementById('app').style.setProperty('--aura', window.MTWEAKS.accent || '216,180,106');
    if (window.MTWEAKS.mood === 'clear') document.body.classList.add('mood-clear');

    window.MAtlas.init();
    window.MCockpit.init();
    window.MScenery.init();
    wireTweaks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
