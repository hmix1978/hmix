/* ============================================================
   星渡し — cockpit-tag.js
   Drives the transparent player dock for tag-cockpit.html.
   - auto-plays the docked tag's music the moment it locks
   - full transport: play/pause · prev/next · seek · shuffle · repeat
   - お気に入り (favorites) · 旅のしおり (visited stations) · 旅の記憶 (history)
     all persisted to localStorage
   Reads window.JSTATE published by journey-tag.js.
   ============================================================ */
(function(){
  const HM = window.HMIX;
  const $  = s => document.querySelector(s);
  const pad2 = n => String(n).padStart(2,'0');
  const fmt  = s => { s=Math.max(0,Math.round(s||0)); return Math.floor(s/60)+':'+pad2(s%60); };

  /* ---- icons ------------------------------------------------ */
  const I = {
    play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/></svg>',
    prev:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5.5" width="2.4" height="13" rx="1"/><path d="M20 5.8v12.4L9.5 12z"/></svg>',
    next:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="16.6" y="5.5" width="2.4" height="13" rx="1"/><path d="M4 5.8v12.4L14.5 12z"/></svg>',
    shuffle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h3.5c1.4 0 2.4.9 3.3 2M21 6h-3.5c-2.6 0-3.9 3-5.5 6s-2.9 6-5.5 6H3"/><path d="M21 18h-3.5c-1.4 0-2.4-.9-3.3-2"/><path d="M18.5 3.5 21 6l-2.5 2.5M18.5 15.5 21 18l-2.5 2.5"/></svg>',
    repeat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 20 5.5 17 8.5"/><path d="M20 5.5H7A4 4 0 0 0 3 9.5v1"/><path d="M7 21.5 4 18.5 7 15.5"/><path d="M4 18.5h13a4 4 0 0 0 4-4v-1"/></svg>',
    heartO:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 20s-7-4.5-9.3-9C1.2 8.1 2.6 5 5.8 5 8 5 9.3 6.5 12 9c2.7-2.5 4-4 6.2-4 3.2 0 4.6 3.1 3.1 6-2.3 4.5-9.3 9-9.3 9z"/></svg>',
    heartF:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.5-9.3-9C1.2 8.1 2.6 5 5.8 5 8 5 9.3 6.5 12 9c2.7-2.5 4-4 6.2-4 3.2 0 4.6 3.1 3.1 6-2.3 4.5-9.3 9-9.3 9z"/></svg>',
  };

  /* ---- persistence ------------------------------------------ */
  /* お気に入りは本サイト共通キー (fav-modal.js と同形式: track id の配列) に揃える */
  const KF='hmix_favorites', KH='hmix.hist.v1', KT='hmix.trip.v1', KV='hmix.vol.v1';
  const load=(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } };
  const save=(k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  let favs = new Set(load(KF,[]));     // track ids
  let hist = load(KH,[]);              // track ids, most-recent first
  let trip = load(KT,[]);              // tag ids, most-recent first

  /* ---- track / tag indexes ---------------------------------- */
  const TRACKS = HM.TRACKS||[];
  const trackById = {}; TRACKS.forEach(t=>trackById[t.id]=t);
  const allTags = [...(HM.TAGS_INNER||[]), ...(HM.TAGS_OUTER||[])];
  const tagById = {}; allTags.forEach(t=>tagById[t.id]=t);
  const RING_TINT = { feeling:'246,210,150', story:'206,168,236', scene:'188,224,246', style:'188,224,246' };

  /* ---- dom -------------------------------------------------- */
  const audio = $('#cpaudio');
  const el = {
    sector:$('.np-sector'), state:$('.np-state'), stateDot:$('.np-state .dot'),
    title:$('.np-title'), sub:$('.np-sub'),
    cur:$('.np-time.cur'), dur:$('.np-time.dur'),
    bar:$('.np-bar'), fill:$('.np-bar .fill'), buf:$('.np-bar .buf'), knob:$('.np-bar .knob'),
    play:$('.np-play'), prev:$('.np-prev'), next:$('.np-next'),
    shuffle:$('.np-shuffle'), repeat:$('.np-repeat'), fav:$('.np-fav'),
    queueList:$('.queue-list'), queueCount:$('.dp-count.queue'),
    logLists:{ fav:$('.log-list[data-list="fav"]'), trip:$('.log-list[data-list="trip"]'), mem:$('.log-list[data-list="mem"]') },
    reticle:$('.cp-reticle .lock'),
  };

  /* ---- player state ----------------------------------------- */
  let queue=[];        // array of track objects
  let qi=-1;           // current index in queue
  let cur=null;        // current track
  let repeat='off';    // off | all | one
  let shuffle=false;
  let dragging=false;
  let pinned=false;    // 曲を固定して星巡り: 他の星に降りても今の曲をリピートし続ける

  audio.volume = load(KV, 0.85);

  /* ---- 音量バー (dock 右下) ---------------------------------- */
  const VOL_ON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  const VOL_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/></svg>';
  (function(){
    const wrap=document.querySelector('.np-vol'); if(!wrap) return;
    const ico=wrap.querySelector('.nv-ico'), bar=wrap.querySelector('.nv-bar'),
          fill=bar.querySelector('.fill'), knob=bar.querySelector('.knob');
    let prevVol=audio.volume||0.85;
    const paint=()=>{ const v=audio.muted?0:audio.volume; const w=(v*100)+'%';
      fill.style.width=w; knob.style.left=w;
      ico.innerHTML=(audio.muted||v===0)?VOL_OFF:VOL_ON; };
    const setV=x=>{ const r=bar.getBoundingClientRect();
      audio.muted=false; audio.volume=Math.min(1,Math.max(0,(x-r.left)/r.width)); };
    let vd=false;
    bar.addEventListener('pointerdown',e=>{ vd=true; bar.classList.add('drag'); bar.setPointerCapture(e.pointerId); setV(e.clientX); });
    bar.addEventListener('pointermove',e=>{ if(vd) setV(e.clientX); });
    bar.addEventListener('pointerup',()=>{ vd=false; bar.classList.remove('drag'); });
    ico.addEventListener('click',()=>{
      if(audio.muted||audio.volume===0){ audio.muted=false; if(audio.volume===0) audio.volume=prevVol||0.85; }
      else { prevVol=audio.volume; audio.muted=true; }
    });
    audio.addEventListener('volumechange',paint);
    paint();
  })();

  /* ---- 商用ライセンス導線: お気に入りにチェック → 別窓で申請 ---- */
  const licSel = window.HMIX_LIC_SEL = window.HMIX_LIC_SEL || new Set();
  const licUrl=()=>'/license-request.html#tracks='+[...licSel].join(',');
  function updateLicenseUI(){
    const b=document.querySelector('.cv-license');
    if(b){
      const n=licSel.size;
      b.disabled=!n;
      b.textContent=n?`◇ ライセンス申請（${n}曲）▸`:'◇ 曲にチェックを入れて申請';
    }
    window.dispatchEvent(new CustomEvent('hmix:licsel'));
  }
  function toggleLic(id,on){
    if(on) licSel.add(String(id)); else licSel.delete(String(id));
    updateLicenseUI();
  }
  window.HMIX_LIC_TOGGLE=toggleLic;          // 景色の中 (scene-dive) と共用
  window.HMIX_LIC_URL=licUrl;

  /* ---- helpers ---------------------------------------------- */
  function tagOfTrack(tk){
    for(const key of ['feeling','story','scene','style']){
      const arr=tk[key]||[]; for(const id of arr){ if(tagById[id]) return tagById[id]; }
    }
    return null;
  }
  function subLabel(tk){
    const tg=tagOfTrack(tk);
    return (tk.title_en||'') + (tg?('  ·  '+tg.jp):'');
  }

  /* ---- now-playing render ----------------------------------- */
  function renderNP(){
    if(!cur){
      el.title.textContent='—';
      el.sub.textContent='タグを選んで航行を開始';
      el.fav.innerHTML=I.heartO; el.fav.classList.remove('on');
      return;
    }
    el.title.textContent=cur.title;
    el.sub.textContent=subLabel(cur);
    const on=favs.has(cur.id);
    el.fav.innerHTML=on?I.heartF:I.heartO; el.fav.classList.toggle('on',on);
  }
  function setPlayIcon(){
    const playing = cur && !audio.paused;
    el.play.innerHTML = playing ? I.pause : I.play;
    el.state.classList.toggle('paused', !playing);
    el.state.querySelector('.txt').textContent = playing ? 'NOW PLAYING' : (cur?'PAUSED':'STANDBY');
  }

  /* ---- 曲の固定 (この曲で星巡り) ------------------------------ */
  function updatePinUI(){
    document.querySelectorAll('.np-pin,.sd-pin').forEach(b=>{
      b.classList.toggle('on',pinned);
      b.setAttribute('aria-pressed',pinned?'true':'false');
      b.disabled=!cur&&!pinned;
      b.innerHTML=pinned?'✦ 曲を固定中':'✧ この曲で星巡り';
      b.title=pinned
        ?'固定を解除する（曲を選び直すと自動で解除されます）'
        :'この曲を流したまま、星図や他の星の景色をめぐる。別の曲を再生するまでリピートします';
    });
  }
  function togglePin(){
    if(!cur&&!pinned) return;
    pinned=!pinned;
    updatePinUI();
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('.np-pin,.sd-pin');
    if(b) togglePin();
  });

  /* ---- transport core --------------------------------------- */
  function playTrack(tk){
    if(!tk) return;
    const changed=!!(cur&&cur.id!==tk.id);
    if(changed&&pinned){ pinned=false; }   // 別の曲を明示的に再生 → 固定解除
    cur=tk;
    updatePinUI();
    const url=HM.trackUrl(tk);
    if(url){ audio.src=url; audio.play().catch(()=>{ setPlayIcon(); }); }
    pushHistory(tk.id);
    if(changed&&window.__trackPulse) window.__trackPulse();   /* 曲替わり — 中央の文字が輝いて弾ける */
    renderNP(); setPlayIcon(); renderSector(); renderRoute();
    el.cur.textContent='0:00';
    el.dur.textContent=fmt(tk.durationSec);
    el.fill.style.width='0%'; el.knob.style.left='0%'; el.buf.style.width='0%';
    markPlaying();
  }
  function setQueue(tracks, i){
    queue = tracks.slice(); qi = i;
    renderQueue();
    playTrack(queue[qi]);
  }
  function nextIndex(dir){
    if(!queue.length) return -1;
    if(shuffle && dir>0){
      if(queue.length===1) return qi;
      let n; do{ n=Math.floor(Math.random()*queue.length); }while(n===qi);
      return n;
    }
    let n=qi+dir;
    if(n>=queue.length) return repeat==='off' ? -1 : 0;
    if(n<0) return queue.length-1;
    return n;
  }
  function advance(dir){
    const n=nextIndex(dir);
    if(n<0){ audio.pause(); setPlayIcon(); return; }
    qi=n; playTrack(queue[qi]);
  }
  function togglePlay(){
    if(!cur){ if(queue.length) setQueue(queue,0); return; }
    if(audio.paused) audio.play().catch(()=>{}); else audio.pause();
    setPlayIcon();
  }

  el.play.addEventListener('click', togglePlay);
  el.next.addEventListener('click', ()=>advance(1));
  el.prev.addEventListener('click', ()=>{ if(audio.currentTime>3){ audio.currentTime=0; } else advance(-1); });
  el.shuffle.addEventListener('click', ()=>{ shuffle=!shuffle; el.shuffle.classList.toggle('on',shuffle); });
  el.repeat.addEventListener('click', ()=>{
    repeat = repeat==='off'?'all':repeat==='all'?'one':'off';
    el.repeat.classList.toggle('on', repeat!=='off');
    el.repeat.classList.toggle('np-repeat-one', repeat==='one');
  });
  el.fav.addEventListener('click', ()=>{ if(cur) toggleFav(cur.id); });

  audio.addEventListener('play', setPlayIcon);
  audio.addEventListener('pause', setPlayIcon);
  audio.addEventListener('ended', ()=>{ if(pinned||repeat==='one'){ audio.currentTime=0; audio.play().catch(()=>{}); } else advance(1); });
  audio.addEventListener('timeupdate', ()=>{
    if(dragging) return;
    const d=audio.duration||cur&&cur.durationSec||0;
    const p=d?audio.currentTime/d:0;
    el.fill.style.width=(p*100).toFixed(2)+'%';
    el.knob.style.left=(p*100).toFixed(2)+'%';
    el.cur.textContent=fmt(audio.currentTime);
    if(audio.duration) el.dur.textContent=fmt(audio.duration);
  });
  audio.addEventListener('progress', ()=>{
    try{ if(audio.buffered.length){ const d=audio.duration||1; el.buf.style.width=((audio.buffered.end(audio.buffered.length-1)/d)*100).toFixed(1)+'%'; } }catch(e){}
  });
  audio.addEventListener('volumechange', ()=>save(KV, audio.volume));

  /* ---- seek bar (click + drag) ------------------------------ */
  function seekTo(clientX){
    const r=el.bar.getBoundingClientRect();
    const p=Math.min(1,Math.max(0,(clientX-r.left)/r.width));
    const d=audio.duration||cur&&cur.durationSec||0;
    el.fill.style.width=(p*100)+'%'; el.knob.style.left=(p*100)+'%';
    el.cur.textContent=fmt(p*d);
    return p*d;
  }
  el.bar.addEventListener('pointerdown', e=>{ if(!cur) return; dragging=true; el.bar.classList.add('drag'); el.bar.setPointerCapture(e.pointerId); seekTo(e.clientX); });
  el.bar.addEventListener('pointermove', e=>{ if(dragging) seekTo(e.clientX); });
  el.bar.addEventListener('pointerup',   e=>{ if(!dragging) return; const t=seekTo(e.clientX); if(audio.duration) audio.currentTime=t; dragging=false; el.bar.classList.remove('drag'); });

  /* ---- favorites / history / itinerary ---------------------- */
  function toggleFav(id){
    if(favs.has(id)) favs.delete(id); else favs.add(id);
    save(KF,[...favs]);
    renderNP(); renderFav(); markPlaying();
  }
  function pushHistory(id){
    hist = [id, ...hist.filter(x=>x!==id)].slice(0,40);
    save(KH,hist); renderMem();
  }
  function pushTrip(tagId){
    trip = [tagId, ...trip.filter(x=>x!==tagId)].slice(0,40);
    save(KT,trip); renderMem();
  }

  /* ---- sector readout : position inside this tag ------------ */
  function renderSector(){
    if(qi>=0&&queue.length) el.sector.textContent='SECTOR '+pad2(qi+1)+' / '+pad2(queue.length);
    else el.sector.textContent='SECTOR — / —';
  }

  /* ---- 航路 : 星図 ─ 種別 ─ タグ ─ ♪ 現在曲 ------------------- */
  function renderRoute(){
    const r=document.getElementById('cpRoute'); if(!r) return;
    const st=window.JSTATE&&window.JSTATE.scene;
    if(!st){ r.innerHTML=''; return; }
    const parts=[
      '<span class="rt-node">星図</span>',
      '<span class="rt-node">'+st.jpSub+'</span>',
      '<span class="rt-node on">'+st.jp+'</span>'];
    if(cur) parts.push('<span class="rt-node tr">♪ '+cur.title+'</span>');
    r.innerHTML=parts.join('<i class="rt-dash"></i>');
  }

  /* ---- row builder ------------------------------------------ */
  function trackRow(tk, idx, listTracks, withCheck){
    const li=document.createElement('li'); li.className='row'; li.dataset.tid=tk.id;
    const faved=favs.has(tk.id);
    li.innerHTML=`
      ${withCheck?`<label class="r-check" title="この曲を商用ライセンス申請に選ぶ"><input type="checkbox"${licSel.has(String(tk.id))?' checked':''}><span class="rc-txt">申請</span></label>`:''}
      <span class="r-eq"><i></i><i></i><i></i></span>
      <span class="r-idx">${idx==null?'·':pad2(idx+1)}</span>
      <span class="r-name">${tk.title}</span>
      <span class="r-meta">${fmt(tk.durationSec)}</span>
      <a class="r-lic" href="/license-request.html" target="_blank" rel="noopener" title="商用ライセンスを取得">LICENSE</a>
      <span class="r-fav ${faved?'on':''}" title="お気に入り">${faved?I.heartF:I.heartO}</span>`;
    const chk=li.querySelector('.r-check input');
    if(chk) chk.addEventListener('change',()=>toggleLic(tk.id, chk.checked));
    li.addEventListener('click', e=>{
      if(e.target.closest('.r-check')){ e.stopPropagation(); return; }
      if(e.target.closest('.r-lic')){ e.stopPropagation(); return; }
      if(e.target.closest('.r-fav')){ toggleFav(tk.id); return; }
      const i=listTracks.indexOf(tk); setQueue(listTracks, i<0?0:i);
    });
    return li;
  }
  function fillList(ul, tracks, emptyMsg, withCheck){
    ul.innerHTML='';
    if(!tracks.length){ ul.innerHTML=`<div class="list-empty">${emptyMsg}</div>`; return; }
    tracks.forEach((tk,i)=>ul.appendChild(trackRow(tk,i,tracks,withCheck)));
    markPlaying();
  }

  function renderQueue(){
    fillList(el.queueList, queue, '信号なし');
    if(el.queueCount) el.queueCount.textContent=pad2(queue.length);
    const qsc=document.querySelector('.qs-count');
    if(qsc) qsc.textContent=queue.length?pad2(queue.length)+' TRACKS':'—';
    renderSector();
  }
  function renderFav(){
    const tracks=[...favs].map(id=>trackById[id]).filter(Boolean);
    fillList(el.logLists.fav, tracks, 'まだお気に入りはありません。<br>♡ を押してこの旅の一曲を残そう。', true);
    updateLicenseUI();
    const n=document.querySelector('.lm-btn[data-vision="fav"] .lm-n');
    if(n) n.textContent=tracks.length?String(tracks.length):'';
  }
  /* 旅のしおり — the open page for the star we are docked at */
  function renderShiori(){
    const ul=el.logLists.trip; ul.innerHTML='';
    const st=window.JSTATE&&window.JSTATE.scene;
    if(!st){ ul.innerHTML='<div class="list-empty">タグへ潜ると、この星のしおりがひらきます。</div>'; return; }
    const sc=st._scene||{};
    const canScene=!!(window.__hasScenery&&window.__hasScenery(st.id));
    const n=(st._tracks||[]).length;
    ul.innerHTML=`
      <div class="sh-meta"><b>${st.jpSub}</b><i>·</i>近い情景　${sc.jp||'—'}（${sc.jpSub||''}）<i>·</i>${n}曲</div>
      <div class="sh-line">${st.line||''}</div>
      <div class="sh-actions">
        <button class="sh-act primary" data-act="scene" type="button" ${canScene?'':'disabled="disabled" title="この星の景色はまだ準備中です"'}>✦ 景色の中へ</button>
        <button class="sh-act" data-act="hub" type="button">◄ タグの輪へ戻る</button>
        <a class="sh-act" href="./">◈ シアター TOPへ</a>
      </div>`;
    const sBtn=ul.querySelector('[data-act="scene"]');
    sBtn.addEventListener('click',()=>{ const b=document.getElementById('btnScenery'); if(b&&!b.disabled) b.click(); });
    ul.querySelector('[data-act="hub"]').addEventListener('click',()=>{ window.__back&&window.__back(); });
  }

  /* 旅の記憶 — recent tracks + recent stars + way back */
  function renderMem(){
    const ul=el.logLists.mem; ul.innerHTML='';
    const tracks=hist.map(id=>trackById[id]).filter(Boolean).slice(0,6);
    const tags=trip.map(id=>tagById[id]).filter(Boolean).slice(0,4);
    if(!tracks.length&&!tags.length){
      ul.innerHTML='<div class="list-empty">まだ記憶はありません。<br>聴いた曲と訪れた星がここに刻まれます。</div>'; return;
    }
    if(tracks.length){
      const h=document.createElement('div'); h.className='mem-h'; h.textContent='直近で聴いた曲'; ul.appendChild(h);
      tracks.forEach(tk=>ul.appendChild(trackRow(tk,null,tracks)));
    }
    if(tags.length){
      const h=document.createElement('div'); h.className='mem-h'; h.textContent='辿った星'; ul.appendChild(h);
      tags.forEach(tg=>{
        const tint=RING_TINT[tg.type]||'216,180,106';
        const nn=tg.count!=null?tg.count:(HM.tracksForTag(tg)||[]).length;
        const li=document.createElement('li'); li.className='row';
        li.innerHTML=`
          <span class="r-chip" style="color:rgb(${tint})"></span>
          <span class="r-name">${tg.jp}</span>
          <span class="r-meta">${nn}曲</span>`;
        li.addEventListener('click', ()=>{ if(window.__diveTagId) window.__diveTagId(tg.id); });
        ul.appendChild(li);
      });
      if(tags[1]){
        const b=document.createElement('button'); b.className='sh-act mem-prev'; b.type='button';
        b.textContent='◄ 前の星へ戻る';
        b.addEventListener('click',()=>{ if(window.__diveTagId) window.__diveTagId(tags[1].id); });
        ul.appendChild(b);
      }
    }
    markPlaying();
  }

  function markPlaying(){
    document.querySelectorAll('.dock .row, #queueSheet .row').forEach(r=>{
      const on = cur && r.dataset.tid===cur.id;
      r.classList.toggle('playing', !!on);
    });
  }

  /* ---- log menu → 八角形のビジョン ------------------------- */
  const vision=document.getElementById('cpVision');
  const cvTitle=document.getElementById('cvTitle');
  const lmBtns=[...document.querySelectorAll('.lm-btn')];
  const VISION_TITLES={ fav:'お気に入り', trip:'旅のしおり', mem:'旅の記憶' };
  let visionOpen=null, visionHideT=null;
  function openVision(name){
    if(!vision) return;
    clearTimeout(visionHideT);
    visionOpen=name;
    cvTitle.textContent=VISION_TITLES[name]||'';
    Object.entries(el.logLists).forEach(([k,ul])=>{ if(ul) ul.hidden=(k!==name); });
    lmBtns.forEach(b=>b.classList.toggle('on', b.dataset.vision===name));
    if(name==='fav') renderFav(); else if(name==='trip') renderShiori(); else renderMem();
    const cvLic=document.querySelector('.cv-license');
    if(cvLic) cvLic.hidden=(name!=='fav');
    const cvHint=document.querySelector('.cv-hint');
    if(cvHint) cvHint.hidden=(name!=='fav');
    if(vision.hidden){ vision.hidden=false; requestAnimationFrame(()=>requestAnimationFrame(()=>vision.classList.add('show'))); }
    else vision.classList.add('show');
  }
  function closeVision(){
    if(!vision||!visionOpen) return;
    visionOpen=null;
    vision.classList.remove('show');
    lmBtns.forEach(b=>b.classList.remove('on'));
    clearTimeout(visionHideT);
    visionHideT=setTimeout(()=>{ if(!visionOpen) vision.hidden=true; },480);
  }
  lmBtns.forEach(b=>b.addEventListener('click',()=>{
    const n=b.dataset.vision;
    if(visionOpen===n) closeVision(); else openVision(n);
  }));
  const cvClose=document.querySelector('.cv-close');
  if(cvClose) cvClose.addEventListener('click',closeVision);

  /* 「商用ライセンスを取得」→ お気に入りを開き、チェックボックスへ誘導 */
  const npLic=document.querySelector('.np-lic');
  if(npLic) npLic.addEventListener('click',()=>{
    openVision('fav');
    updateLicenseUI();
  });
  const cvLicBtn=document.querySelector('.cv-license');
  if(cvLicBtn) cvLicBtn.addEventListener('click',()=>{
    if(licSel.size) window.open(licUrl(),'_blank','noopener');
  });
  /* 景色の中での選択変更をビジョンにも反映 */
  window.addEventListener('hmix:licsel',()=>{
    if(visionOpen==='fav'){
      el.logLists.fav.querySelectorAll('.r-check input').forEach(c=>{
        const tid=c.closest('.row').dataset.tid;
        const on=licSel.has(String(tid));
        if(c.checked!==on) c.checked=on;
      });
      const b=document.querySelector('.cv-license');
      if(b){ const n=licSel.size; b.disabled=!n; b.textContent=n?`◇ ライセンス申請（${n}曲）▸`:'◇ 曲にチェックを入れて申請'; }
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&visionOpen&&!document.body.dataset.scene) closeVision();
  });

  /* ---- dock follows JSTATE (dock detection + aura tint) ------ */
  let lastDockedId=null, hadScene=false;
  function frame(){
    const S=window.JSTATE||{act:-1,scene:null};
    const scene=S.scene;
    const docked = scene && S.act>=0;

    /* tint cockpit accents to the scene aura while docked */
    const cockpit=document.getElementById('cockpit');
    if(docked && scene._rgb){ cockpit.style.setProperty('--aura', scene._rgb.join(',')); }
    else if(!scene){ cockpit.style.setProperty('--aura','216,180,106'); }

    /* on a fresh lock: log the station + auto-play its music */
    if(docked && scene.id!==lastDockedId){
      lastDockedId=scene.id; hadScene=true;
      pushTrip(scene.id);
      renderShiori(); renderRoute();
      const tracks=(scene._tracks||HM.tracksForTag({id:scene.id})||[]).slice();
      /* 旅のたびに並びを変える: 登録順のままだと どのタグでも同じ古い曲から始まるため */
      for(let i=tracks.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [tracks[i],tracks[j]]=[tracks[j],tracks[i]]; }
      if(pinned&&cur){
        /* 曲を固定中: 今の曲を流したまま、リストだけこの星のものに替える */
        queue=tracks; qi=queue.findIndex(t=>t.id===cur.id);
        renderQueue(); renderNP(); renderSector(); renderRoute(); markPlaying();
      }
      else if(tracks.length) setQueue(tracks, 0);
      else { queue=[]; qi=-1; cur=null; renderQueue(); renderNP(); setPlayIcon(); renderRoute(); }
    }
    if(!scene && hadScene){ hadScene=false; lastDockedId=null; renderShiori(); renderRoute(); }
    if(!scene) lastDockedId=null;
  }
  window.__cpFrame=frame;

  /* keep the dock logic alive even when the tab is backgrounded
     (rAF pauses while hidden; fall back to a timer) */
  let loop=null;
  function tick(){ frame(); loop=requestAnimationFrame(tick); }
  function tickHidden(){ frame(); loop=setTimeout(tickHidden,120); }
  function startLoop(){ if(loop){ cancelAnimationFrame(loop); clearTimeout(loop); }
    if(document.hidden) tickHidden(); else tick(); }
  document.addEventListener('visibilitychange', startLoop);

  /* ---- boot ------------------------------------------------- */
  function init(){
    el.play.innerHTML=I.play; el.prev.innerHTML=I.prev; el.next.innerHTML=I.next;
    el.shuffle.innerHTML=I.shuffle; el.repeat.innerHTML=I.repeat; el.fav.innerHTML=I.heartO;
    /* この星の音楽リスト (queue sheet): dock の上にせり上がる読みやすいリスト */
    const sheet=document.getElementById('queueSheet');
    const sheetBtn=document.getElementById('btnQueueSheet');
    if(sheet&&sheetBtn){
      const setOpen=(open)=>{
        sheetBtn.setAttribute('aria-expanded', open?'true':'false');
        if(open){
          sheet.hidden=false;
          requestAnimationFrame(()=>requestAnimationFrame(()=>{
            sheet.classList.add('open');
            const p=sheet.querySelector('.row.playing');
            if(p) p.scrollIntoView({block:'center'});
          }));
        }else{
          sheet.classList.remove('open');
          setTimeout(()=>{ if(!sheet.classList.contains('open')) sheet.hidden=true; }, 520);
        }
      };
      sheetBtn.addEventListener('click', ()=>setOpen(sheet.hidden));
      sheet.querySelector('.qs-close').addEventListener('click', ()=>setOpen(false));
      document.addEventListener('keydown', e=>{ if(e.key==='Escape'&&!sheet.hidden) setOpen(false); });
      document.addEventListener('click', e=>{
        if(sheet.hidden) return;
        /* 行クリックで再描画されると e.target が DOM から外れるため、
           dispatch 時点の経路 (composedPath) で内外を判定する */
        const path=e.composedPath?e.composedPath():[];
        if(path.includes(sheet)||path.includes(sheetBtn)) return;
        setOpen(false);
      });
      /* ダイブや星図へ戻ったら閉じる */
      new MutationObserver(()=>{
        if(document.body.dataset.mode!=='dock'&&!sheet.hidden){
          sheet.classList.remove('open'); sheet.hidden=true;
          sheetBtn.setAttribute('aria-expanded','false');
        }
      }).observe(document.body,{attributes:true,attributeFilter:['data-mode']});
    }
    renderNP(); setPlayIcon(); renderSector();
    renderFav(); renderMem(); renderShiori(); renderQueue(); renderRoute();
    startLoop();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
