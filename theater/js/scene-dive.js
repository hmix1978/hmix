/* ============================================================
   星渡し — scene-dive.js
   「景色の中へ」 — dive THROUGH the docked tag's lettering into
   a full-bleed scenery view.

   Timeline:
     dive   (0 → 2.55s) : the word's particles ignite into sparkles
                          and fly past the camera; behind the
                          scattering strokes the world is only
                          SCENTED — a faint, blurred halo that
                          never opens wide.
     pulse  (2.3 → 3.15) : the one extra beat — as the word
                          finishes spreading, a heartbeat of
                          aura-tinted light blooms…
     black  (2.55 → 4.35): …and everything snaps into darkness.
     reveal (4.35 → …)   : VERY slow fade-in — world, tag name,
                          track title, scenery UI (CSS .reveal).

   Music keeps flowing through the cockpit's <audio>; the scenery
   transport simply drives the cockpit's own buttons.
   ============================================================ */
(function(){
  function L(ja,en){ try{ var v=window.HMIX_LANG||sessionStorage.getItem('hmix_lang')||localStorage.getItem('hmix_lang'); return v==='en'?en:ja; }catch(e){ return window.HMIX_LANG==='en'?en:ja; } }
  const TAU=Math.PI*2;
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const easeIn=t=>t*t*t;
  const $=s=>document.querySelector(s);

  /* 全タグが景色を持つ: タグごとの専用画像 /assets/images/scenes/<tagId>.webp を使う。
     差し替えたいタグは SCENERY_SPECIAL で上書きする。 */
  const SCENERY_SPECIAL={};
  const SCENERY=(()=>{
    const m={}, HM=window.HMIX||{};
    [...(HM.TAGS_INNER||[]),...(HM.TAGS_OUTER||[])].forEach(t=>{ m[t.id]='../assets/images/scenes/'+t.id+'.webp'; });
    return Object.assign(m, SCENERY_SPECIAL);
  })();
  window.__hasScenery=id=>!!SCENERY[id];

  /* ---- dom -------------------------------------------------- */
  const sd=$('#sceneDive'); if(!sd) return;
  const img=$('#sdImg'), world=sd.querySelector('.sd-world');
  const veilB=sd.querySelector('.sd-veil-back'), veilF=sd.querySelector('.sd-veil');
  const canvas=$('#sdCanvas'), ctx=canvas.getContext('2d');
  const btn=$('#btnScenery');
  const tagJp=sd.querySelector('.sd-tag-jp'), tagEn=sd.querySelector('.sd-tag-en');
  const tTitle=sd.querySelector('.sd-t-title'), tSub=sd.querySelector('.sd-t-sub');
  const bPlay=sd.querySelector('.sd-play'), bPrev=sd.querySelector('.sd-prev'), bNext=sd.querySelector('.sd-next');
  const exitCp=sd.querySelector('.sd-exit.l'), exitHub=sd.querySelector('.sd-exit.r');
  /* 透明UI: シーク / ♡ / メニュー / パネル */
  const audioEl=$('#cpaudio');
  const sBar=sd.querySelector('.sd-bar'), sFill=sd.querySelector('.sd-bar .fill'), sKnob=sd.querySelector('.sd-bar .knob');
  const sCur=sd.querySelector('.sd-time.cur'), sDur=sd.querySelector('.sd-time.dur');
  const bFav=sd.querySelector('.sd-fav');
  const panels=[...sd.querySelectorAll('.sd-panel')];
  const mbtns=[...sd.querySelectorAll('.sd-mbtn')];
  const fmt=s=>{ s=Math.max(0,Math.round(s||0)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };

  const I={
    play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/></svg>',
    prev:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5.5" width="2.4" height="13" rx="1"/><path d="M20 5.8v12.4L9.5 12z"/></svg>',
    next:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="16.6" y="5.5" width="2.4" height="13" rx="1"/><path d="M4 5.8v12.4L14.5 12z"/></svg>',
    heartO:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 20s-7-4.5-9.3-9C1.2 8.1 2.6 5 5.8 5 8 5 9.3 6.5 12 9c2.7-2.5 4-4 6.2-4 3.2 0 4.6 3.1 3.1 6-2.3 4.5-9.3 9-9.3 9z"/></svg>',
    heartF:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.5-9.3-9C1.2 8.1 2.6 5 5.8 5 8 5 9.3 6.5 12 9c2.7-2.5 4-4 6.2-4 3.2 0 4.6 3.1 3.1 6-2.3 4.5-9.3 9-9.3 9z"/></svg>',
  };
  bPrev.innerHTML=I.prev; bNext.innerHTML=I.next; bPlay.innerHTML=I.play;

  /* ---- canvas ----------------------------------------------- */
  const dpr=Math.min(window.devicePixelRatio||1,2);
  let W=0,H=0;
  function resize(){ W=innerWidth; H=innerHeight;
    canvas.width=W*dpr; canvas.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  addEventListener('resize',resize,{passive:true});

  /* same glyph sampler as journey-tag.js (denser) — so the
     sparkle word sits exactly on the cockpit's particle word */
  function sampleWord(text){
    const S=240, oc=document.createElement('canvas'); oc.width=oc.height=S;
    const o=oc.getContext('2d'); o.fillStyle='#fff'; o.textAlign='center'; o.textBaseline='middle';
    const chars=[...text];
    if(chars.length<=1){ o.font='600 '+Math.round(S*0.5)+'px "Noto Serif JP",serif'; o.fillText(text,S/2,S/2); }
    else if(chars.length===2){ o.font='600 '+Math.round(S*0.44)+'px "Noto Serif JP",serif'; o.fillText(chars[0],S*0.29,S/2); o.fillText(chars[1],S*0.71,S/2); }
    else { let fs=Math.round(S*0.9/chars.length); fs=clamp(fs,24,Math.round(S*0.3));
           o.font='600 '+fs+'px "Noto Serif JP",serif'; o.fillText(text,S/2,S/2); }
    const data=o.getImageData(0,0,S,S).data, pts=[]; const step=2;
    for(let y=0;y<S;y+=step)for(let x=0;x<S;x+=step){ if(data[(y*S+x)*4+3]>128) pts.push([(x/S)*2-1,(y/S)*2-1]); }
    for(let i=pts.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [pts[i],pts[j]]=[pts[j],pts[i]]; }
    return pts.slice(0,1100);
  }

  /* ---- state ------------------------------------------------ */
  let phase='off';            // off · dive · black · scene · leave
  let t0=0,last=0,raf=null;
  let P=[],motes=[],orbs=[],aura=[170,220,240],revealT=0;

  function buildParticles(word){
    const pts=sampleWord(word);
    const box=Math.min(W,H)*0.40, kcx=W/2, kcy=H*0.455;
    return pts.map(tp=>({
      ox:kcx+tp[0]*box*0.5, oy:kcy+tp[1]*box*0.5,
      jang:rnd(0,TAU), jmag:rnd(0,22),
      r:rnd(0.7,1.9), ph:rnd(0,TAU), tws:rnd(0.6,2),
      sp:rnd(0.7,1.5),
      col:Math.random()<0.55?[255,255,255]:aura.slice(),
    }));
  }
  function buildMotes(){
    motes=Array.from({length:reduce?20:64},()=>({
      x:rnd(0,W), y:rnd(0,H), vx:rnd(-5,5), vy:rnd(-15,-3),
      r:rnd(0.6,1.9), ph:rnd(0,TAU), a:rnd(0.07,0.26) }));
  }
  /* 優しい風に舞うオーブ — 奉納の終着点、最高の癒し */
  function buildOrbs(){
    const base=Math.min(W,H);
    orbs=Array.from({length:reduce?8:20},()=>{
      const warm=Math.random()<0.55;
      return {
        x:rnd(0,W), yb:rnd(H*0.18,H*1.05),
        r:rnd(0.018,0.085)*base+rnd(5,12),
        d:rnd(0.35,1),                              // depth: near orbs drift faster, glow brighter
        ph:rnd(0,TAU), bob:rnd(0,TAU), bobA:rnd(10,30), bobS:rnd(0.5,1.3),
        a:rnd(0.25,0.5),
        col:warm?[255,248,238]:[(aura[0]+255)>>1,(aura[1]+255)>>1,(aura[2]+255)>>1]
      };
    });
  }

  /* a tiny four-point gleam */
  function star(x,y,r,a,col){
    const c=`${col[0]|0},${col[1]|0},${col[2]|0}`;
    ctx.fillStyle=`rgba(${c},${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill();
    ctx.fillStyle=`rgba(${c},${(a*0.16).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x,y,r*3,0,TAU); ctx.fill();
    if(r>1.15){
      ctx.strokeStyle=`rgba(${c},${(a*0.5).toFixed(3)})`;
      ctx.lineWidth=Math.max(0.5,r*0.28);
      const L=r*3.6;
      ctx.beginPath(); ctx.moveTo(x-L,y); ctx.lineTo(x+L,y);
      ctx.moveTo(x,y-L); ctx.lineTo(x,y+L); ctx.stroke();
    }
  }

  function drawDive(t,z,fade,T){
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    const kcx=W/2, kcy=H*0.455, zoom=1+z*16;
    const ain=Math.min(1,T*3.5);
    for(const p of P){
      const zp=1+(zoom-1)*p.sp;
      const px=kcx+(p.ox-kcx)*zp+Math.cos(p.jang)*(zp-1)*p.jmag;
      const py=kcy+(p.oy-kcy)*zp+Math.sin(p.jang)*(zp-1)*p.jmag;
      if(px<-60||px>W+60||py<-60||py>H+60) continue;
      const tw=0.62+0.38*Math.sin(t*0.006*p.tws+p.ph);
      const a=Math.pow(Math.max(0,1-z),0.55)*tw*ain*fade;
      if(a<=0.012) continue;
      star(px,py,p.r*(1+z*7),Math.min(1,a),p.col);
    }
    ctx.globalCompositeOperation='source-over';
  }

  function drawMotes(t,dt){
    ctx.clearRect(0,0,W,H);
    const ain=Math.min(1,(t-revealT)/5000);
    const oain=clamp((t-revealT-7000)/6000,0,1);   // オーブは景色が見えてから遅れて滲み出る
    ctx.globalCompositeOperation='lighter';

    /* 優しい風 — ゆるやかな突風が行きつ戻りつ */
    const wind=Math.sin(t*0.00006)+0.6*Math.sin(t*0.000131+1.7);
    for(const o of orbs){
      if(!reduce){
        o.x+=(wind*14*o.d+Math.cos(t*0.00021+o.ph)*3.2*o.d)*dt;
        o.yb+=-4*o.d*dt;
        if(o.x<-90) o.x=W+90; else if(o.x>W+90) o.x=-90;
        if(o.yb<-100){ o.yb=H+100; o.x=rnd(0,W); }
      }
      const y=o.yb+Math.sin(t*0.0004*o.bobS+o.bob)*o.bobA;
      const br=(0.62+0.38*Math.sin(t*0.00045+o.ph))*o.a*oain;   // 呼吸する輝き
      if(br<=0.004) continue;
      const c=`${o.col[0]},${o.col[1]},${o.col[2]}`;
      const g=ctx.createRadialGradient(o.x,y,0,o.x,y,o.r);
      g.addColorStop(0,`rgba(${c},${(br*0.95).toFixed(3)})`);
      g.addColorStop(0.4,`rgba(${c},${(br*0.4).toFixed(3)})`);
      g.addColorStop(1,`rgba(${c},0)`);
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(o.x,y,o.r,0,TAU); ctx.fill();
      if(o.d>0.78){ ctx.fillStyle=`rgba(255,255,252,${(br*0.85).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(o.x,y,Math.max(1.4,o.r*0.09),0,TAU); ctx.fill(); }
    }

    for(const m of motes){
      if(!reduce){ m.x+=m.vx*dt; m.y+=m.vy*dt;
        if(m.y<-8){ m.y=H+8; m.x=rnd(0,W); }
        if(m.x<-8) m.x=W+8; else if(m.x>W+8) m.x=-8; }
      const tw=0.55+0.45*Math.sin(t*0.0012+m.ph);
      const a=m.a*tw*ain;
      ctx.fillStyle=`rgba(255,255,252,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(m.x,m.y,m.r,0,TAU); ctx.fill();
      ctx.fillStyle=`rgba(255,255,252,${(a*0.2).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(m.x,m.y,m.r*2.6,0,TAU); ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
  }

  /* climax bloom — the one extra beat as the word finishes
     spreading: a heartbeat of aura-tinted light, then darkness.
     Drawn on the canvas (above the front veil) so its afterglow
     carries into the first instants of the blackout. */
  function drawPulse(T){
    const u=(T-2.3)/0.85; if(u<=0||u>=1) return;
    const a=Math.pow(Math.sin(Math.PI*u),1.4);
    const kcx=W/2, kcy=H*0.455;
    const R=Math.min(W,H)*(0.16+u*0.6);
    const c=`${aura[0]|0},${aura[1]|0},${aura[2]|0}`;
    const g=ctx.createRadialGradient(kcx,kcy,0,kcx,kcy,R);
    g.addColorStop(0,`rgba(255,255,255,${(a*0.5).toFixed(3)})`);
    g.addColorStop(0.3,`rgba(${c},${(a*0.26).toFixed(3)})`);
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(kcx,kcy,R,0,TAU); ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }

  /* ---- timeline --------------------------------------------- */
  function frame(t,dt){
    const T=(t-t0)/1000;
    if(phase==='dive'){
      const z=easeIn(clamp(T/2.5,0,1));
      veilB.style.opacity=(Math.min(1,T/0.45)*0.95).toFixed(3);
      const k=clamp((z-0.5)/0.5,0,1);                   // aperture: late + faint — a scent of the world
      if(k>0){
        const r=4.5+k*12;                                // small halo, never opens wide
        const m=`radial-gradient(circle at 50% 45.5%, rgba(0,0,0,1) ${(r*0.4).toFixed(1)}vmax, rgba(0,0,0,0) ${r.toFixed(1)}vmax)`;
        world.style.webkitMaskImage=m; world.style.maskImage=m;
        world.style.opacity=(k*0.36).toFixed(3);
        world.style.filter='brightness(.55) saturate(.9) blur(6px)';
      }
      drawDive(t,z,1,T);
      drawPulse(T);
      if(T>=2.55){ phase='black';
        veilF.style.transition='opacity .55s ease-in'; veilF.style.opacity='1'; }
    }
    else if(phase==='black'){
      const z=clamp(easeIn(clamp(T/2.5,0,1))+(T-2.5)*0.3,0,1.2);
      const fade=clamp(1-(T-2.55)/0.85,0,1);
      drawDive(t,Math.min(z,1),fade,T);
      drawPulse(T);
      if(T>=4.35) reveal(t);
    }
    else if(phase==='scene'||phase==='leave'){
      drawMotes(t,dt);
      if(phase==='scene') updateSeek();
    }
  }

  function reveal(t){
    phase='scene'; revealT=t;
    world.style.webkitMaskImage='none'; world.style.maskImage='none';
    world.style.opacity='1'; world.style.filter='none';
    veilB.style.opacity='1';
    sd.classList.add('reveal');
    veilF.getBoundingClientRect();                       // commit opacity:1
    veilF.style.transition=reduce?'opacity 2s ease':'opacity 7.5s cubic-bezier(.33,.06,.22,1)';
    veilF.style.opacity='0';
    buildMotes();
    buildOrbs();
    ctx.clearRect(0,0,W,H);
    wake();                                              // 安らぎモードの見張りを開始
    fpStart();                                           // 足跡がただよいはじめる
  }

  /* ---- 安らぎモード: 触れないでいると UI が眠る ------------- */
  let restTimer=null;
  function wake(){
    if(phase!=='scene') return;
    if(sd.classList.contains('rest')){ sd.classList.remove('rest'); }
    clearTimeout(restTimer);
    restTimer=setTimeout(()=>{ if(phase==='scene'){ sd.classList.add('awake','rest'); } },7000);
  }
  ['pointermove','pointerdown','keydown','wheel'].forEach(ev=>
    document.addEventListener(ev,wake,{passive:true}));

  /* ---- 足跡 — この曲に寄せられた言葉が、景色の向こうをただよう ----
     本実装では現行シアターの足跡APIから「現在の曲についた足跡」を取得する。
     window.HMIX_FOOTPRINTS.forTrack(trackId) を提供すればそのまま差し替わる。
     (未提供の間はデザイン確認用のデモ足跡を表示 — 公開前に必ずAPIへ接続) */
  const fpLayer=sd.querySelector('.sd-fp');
  const FP_DEMO=[
    {text:L('この曲で、物語の結末が決まりました。','This piece decided how my story would end.'), author:L('旅人','a traveler')},
    {text:L('夜の作業のおともに、ずっと。','My companion through late-night work, always.'), author:''},
    {text:L('ゲームのエンディングで使わせていただきました。','I used it for the ending of my game.'), author:L('制作者K','Creator K')},
    {text:L('雨の日に聴くと、景色がひろがる。','On rainy days it opens up a whole landscape.'), author:''},
    {text:L('十年前から、ここの音と旅しています。','For ten years I have traveled with the music here.'), author:L('古い旅人','an old traveler')},
    {text:L('主人公の旅立ちの場面が、これで完成しました。','This completed my hero’s departure scene.'), author:L('脚本書き','a scriptwriter')},
    {text:L('いつか、この曲のような場所へ。','Someday, to a place like this music.'), author:L('小さな冒険者','a little adventurer')},
    {text:L('ありがとう。言葉はそれだけで充分。','Thank you. That word alone is enough.'), author:''},
  ];
  let fpList=[], fpTimer=null, fpKey='';
  const fpHistTop=()=>{ try{ return (JSON.parse(localStorage.getItem('hmix.hist.v1'))||[])[0]||''; }catch(e){ return ''; } };
  const fpHash=s=>{ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; };
  function fpLoad(key){
    if(window.HMIX_FOOTPRINTS&&window.HMIX_FOOTPRINTS.forTrack){
      /* 新着10件まで。足跡の表示OFF時は空に。 */
      if(window.__fpHidden) return Promise.resolve([]);
      return Promise.resolve(window.HMIX_FOOTPRINTS.forTrack(key)).then(l=>(l||[]).slice(0,10)).catch(()=>[]);
    }
    if(window.__fpHidden) return Promise.resolve([]);
    const h=fpHash(String(key)), n=2+h%3, out=[];   /* デモ: 曲ごとに2〜4件を決定的に */
    for(let i=0;i<n;i++) out.push(FP_DEMO[(h+i*7)%FP_DEMO.length]);
    return Promise.resolve(out);
  }
  function fpSpawn(){
    if(phase!=='scene'||!fpList.length||!fpLayer||window.__fpHidden) return;
    if(fpLayer.children.length>=2) return;            /* 同時に2つまで — ひっそりと */
    /* 直前に出した足跡・いま画面に出ている足跡は避ける。
       候補が無ければ何も出さない（少数なら自然に間が空き、静寂のまま）。連続重複しない。 */
    const onScreen=[...fpLayer.children].map(c=>c.dataset.fi);
    const cand=[];
    for(let i=0;i<fpList.length;i++){
      if(String(i)===String(fpSpawn._last)) continue;
      if(onScreen.indexOf(String(i))>=0) continue;
      if(fpList[i]&&fpList[i].text) cand.push(i);
    }
    if(!cand.length) return;
    const idx=cand[Math.floor(Math.random()*cand.length)];
    fpSpawn._last=idx;
    const f=fpList[idx];
    const el=document.createElement('div'); el.className='fp'; el.dataset.fi=String(idx);
    el.textContent=f.text;
    if(f.author){ const by=document.createElement('span'); by.className='by'; by.textContent='— '+f.author; el.appendChild(by); }
    /* 同時に出る言葉は左右・上下のたなに分けて、重なりを避ける */
    fpSpawn._slot=1-(fpSpawn._slot||0);
    const s=fpSpawn._slot;
    el.style.left=(s? rnd(46,62) : rnd(8,26))+'%';
    el.style.top =(s? rnd(42,58) : rnd(20,34))+'%';
    el.style.setProperty('--fp-dur',rnd(22,34).toFixed(1)+'s');
    el.style.setProperty('--fp-dx',(-rnd(30,80)).toFixed(0)+'px');
    el.style.setProperty('--fp-max',rnd(.32,.5).toFixed(2));
    el.addEventListener('animationend',()=>el.remove());
    fpLayer.appendChild(el);
  }
  function fpStart(){
    if(!fpLayer) return;
    fpStop();
    fpKey=fpHistTop()||tTitle.textContent;
    fpLoad(fpKey).then(l=>{ fpList=l||[]; });
    fpTimer=setInterval(fpSpawn,7000);
    setTimeout(fpSpawn,3000);
  }
  function fpStop(){
    clearInterval(fpTimer); fpTimer=null; fpList=[];
    if(fpLayer) fpLayer.innerHTML='';
  }
  function fpTrackChanged(){
    if(phase!=='scene'||!fpLayer) return;
    const k=fpHistTop()||tTitle.textContent;
    if(k===fpKey) return;
    fpKey=k;
    [...fpLayer.children].forEach(el=>{               /* いまの言葉は静かに退場 */
      const cs=getComputedStyle(el);
      el.style.transform=cs.transform; el.style.opacity=cs.opacity;
      el.style.animation='none';
      el.getBoundingClientRect();
      el.style.transition='opacity 2s ease'; el.style.opacity='0';
      setTimeout(()=>el.remove(),2100);
    });
    fpLoad(k).then(l=>{ fpList=l||[]; });
  }

  function loop(t){
    const dt=Math.min(0.05,(t-last)/1000||0.016); last=t;
    try{ frame(t,dt); }catch(e){ if(!loop._l){ loop._l=1; console.error('scene-dive:',e); } }
    if(phase!=='off') raf=requestAnimationFrame(loop);
  }

  /* ---- enter / leave ----------------------------------------- */
  function start(){
    const S=window.JSTATE, st=S&&S.scene;
    if(!st||!SCENERY[st.id]||document.body.dataset.mode!=='dock') return;
    aura=(st._rgb||[170,220,240]).slice();
    img.src=SCENERY[st.id];
    tagJp.textContent=st.jp;
    tagEn.textContent=(st.en||st.jp).toUpperCase();
    syncTrack();
    resize();
    closePanels();
    P=buildParticles(st.jp);
    sd.classList.remove('reveal'); sd.hidden=false;
    document.body.dataset.scene='on';
    world.style.opacity='0'; world.style.webkitMaskImage=''; world.style.maskImage='';
    veilB.style.opacity='0';
    veilF.style.transition='none'; veilF.style.opacity='0';
    t0=performance.now(); last=t0;
    if(reduce){                                          // no dive — gentle fade only
      veilB.style.opacity='1'; veilF.style.opacity='1';
      veilF.getBoundingClientRect();
      reveal(t0);
    } else { phase='dive'; }
    if(raf) cancelAnimationFrame(raf);
    raf=requestAnimationFrame(loop);
  }

  function leave(toHub){
    if(phase==='off'||phase==='leave') return;
    phase='leave';
    veilF.style.transition='opacity .8s ease'; veilF.style.opacity='1';
    setTimeout(()=>{
      if(raf) cancelAnimationFrame(raf); raf=null;
      sd.hidden=true; sd.classList.remove('reveal','rest','awake');
      clearTimeout(restTimer);
      fpStop();
      closePanels();
      delete document.body.dataset.scene;
      world.style.opacity='0'; world.style.webkitMaskImage=''; world.style.maskImage='';
      veilB.style.opacity='0';
      veilF.style.transition='none'; veilF.style.opacity='0';
      ctx.clearRect(0,0,W,H);
      phase='off';
      if(toHub&&window.__back) window.__back();
    },900);
  }

  btn&&btn.addEventListener('click',()=>{ if(!btn.disabled) start(); });
  exitCp.addEventListener('click',()=>leave(false));
  exitHub.addEventListener('click',()=>leave(true));
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||phase!=='scene') return;
    if(panels.some(p=>!p.hidden)){ closePanels(); return; }
    leave(false);
  });

  /* ---- the scenery transport drives the cockpit player ------- */
  bPlay.addEventListener('click',()=>{ const b=$('.np-play'); b&&b.click(); });
  bPrev.addEventListener('click',()=>{ const b=$('.np-prev'); b&&b.click(); });
  bNext.addEventListener('click',()=>{ const b=$('.np-next'); b&&b.click(); });
  bFav.innerHTML=I.heartO;
  bFav.addEventListener('click',()=>{ const b=$('.np-fav'); if(b){ b.click(); syncTrack();
    const fp=panels.find(p=>p.dataset.panel==='fav'); if(fp&&!fp.hidden) renderFavPanel(); } });
  // 「ひとつの心臓」: 他サーフェスでの♡変更を受けて景色ダイブの♡も同期（cockpit更新後に走るようdefer）
  window.addEventListener('favorites:updated', ()=>{ setTimeout(()=>{ try{ syncTrack();
    const fp=panels.find(p=>p.dataset.panel==='fav'); if(fp&&!fp.hidden) renderFavPanel(); }catch(e){} }, 0); });

  /* ---- シークバー (本体の audio を直接操作) ----------------- */
  function updateSeek(){
    if(!audioEl||!sBar) return;
    const d=audioEl.duration||0, c=audioEl.currentTime||0, p=d?c/d:0;
    const w=(p*100).toFixed(2)+'%';
    sFill.style.width=w; sKnob.style.left=w;
    sCur.textContent=fmt(c); sDur.textContent=fmt(d);
  }
  let seekDrag=false;
  function seekAt(x){ const r=sBar.getBoundingClientRect();
    const p=Math.min(1,Math.max(0,(x-r.left)/r.width));
    if(audioEl&&audioEl.duration) audioEl.currentTime=p*audioEl.duration; }
  if(sBar){
    sBar.addEventListener('pointerdown',e=>{ seekDrag=true; sBar.setPointerCapture(e.pointerId); seekAt(e.clientX); });
    sBar.addEventListener('pointermove',e=>{ if(seekDrag) seekAt(e.clientX); });
    sBar.addEventListener('pointerup',()=>{ seekDrag=false; });
  }

  /* ---- 音量バー (すりガラスのプレイヤー内) -------------------- */
  const VOL_ON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  const VOL_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/></svg>';
  (function(){
    const vIco=sd.querySelector('.sd-vico'), vBar=sd.querySelector('.sd-vbar');
    if(!vBar||!audioEl) return;
    const vFill=vBar.querySelector('.fill'), vKnob=vBar.querySelector('.knob');
    let prevVol=audioEl.volume||0.85;
    const paint=()=>{ const v=audioEl.muted?0:audioEl.volume; const w=(v*100)+'%';
      vFill.style.width=w; vKnob.style.left=w;
      vIco.innerHTML=(audioEl.muted||v===0)?VOL_OFF:VOL_ON; };
    const setV=x=>{ const r=vBar.getBoundingClientRect();
      audioEl.muted=false; audioEl.volume=Math.min(1,Math.max(0,(x-r.left)/r.width)); };
    let vd=false;
    vBar.addEventListener('pointerdown',e=>{ vd=true; vBar.setPointerCapture(e.pointerId); setV(e.clientX); });
    vBar.addEventListener('pointermove',e=>{ if(vd) setV(e.clientX); });
    vBar.addEventListener('pointerup',()=>{ vd=false; });
    vIco.addEventListener('click',()=>{
      if(audioEl.muted||audioEl.volume===0){ audioEl.muted=false; if(audioEl.volume===0) audioEl.volume=prevVol||0.85; }
      else { prevVol=audioEl.volume; audioEl.muted=true; }
    });
    audioEl.addEventListener('volumechange',paint);
    paint();
  })();

  /* ---- メニュー & パネル -------------------------------------- */
  function closePanels(){ panels.forEach(p=>p.hidden=true); mbtns.forEach(b=>b.classList.remove('on')); }
  mbtns.forEach(b=>b.addEventListener('click',()=>{
    const name=b.dataset.panel;
    const target=panels.find(p=>p.dataset.panel===name);
    const opening=target.hidden;
    closePanels();
    if(opening){
      target.hidden=false; b.classList.add('on');
      if(name==='fav') renderFavPanel();
      else if(name==='list') renderListPanel();
      else if(name==='fp') renderFpPost();
      else renderTripPanel();
    }
  }));

  /* ---- 足跡を残す（投稿） ---------------------------------------- */
  function renderFpPost(){
    const msg=document.getElementById('sdFpMsg'); if(msg){ msg.textContent=''; msg.className='sd-fp-msg'; }
    const ta=document.getElementById('sdFpText'); if(ta) setTimeout(()=>ta.focus(),60);
  }
  (function bindFpPost(){
    const submit=document.getElementById('sdFpSubmit');
    if(!submit) return;
    submit.addEventListener('click',()=>{
      const ta=document.getElementById('sdFpText'), nm=document.getElementById('sdFpName'), msg=document.getElementById('sdFpMsg');
      const text=(ta&&ta.value||'').trim();
      if(!text){ if(msg){ msg.textContent=L('ひとこと書いてみてください。','Please write a few words.'); msg.className='sd-fp-msg err'; } if(ta) ta.focus(); return; }
      if(!(window.HMIX_FOOTPRINTS&&window.HMIX_FOOTPRINTS.post)){ if(msg){ msg.textContent=L('いまは投稿できません。時間をおいて。','Posting is unavailable right now. Please try again later.'); msg.className='sd-fp-msg err'; } return; }
      const tid=fpHistTop()||'';
      if(!tid){ if(msg){ msg.textContent=L('曲が流れてから残せます。','You can leave a note once a track is playing.'); msg.className='sd-fp-msg err'; } return; }
      const title=tTitle.textContent||'';
      submit.disabled=true; if(msg){ msg.textContent=L('残しています…','Leaving your note…'); msg.className='sd-fp-msg'; }
      window.HMIX_FOOTPRINTS.post(tid, text, (nm&&nm.value)||'', title).then(()=>{
        submit.disabled=false;
        if(msg){ msg.textContent=L('✦ 足跡を残しました。ありがとう。','✦ Your footprint is left. Thank you.'); msg.className='sd-fp-msg ok'; }
        if(ta) ta.value=''; if(nm) nm.value='';
        if(window.__theaterSfx&&window.__theaterSfx.chime) window.__theaterSfx.chime();
        /* 自分の足跡が景色に流れてくるよう、リストを取り直す */
        fpKey=''; fpTrackChanged();
      }).catch((e)=>{
        submit.disabled=false;
        if(msg){ msg.textContent=L('うまく残せませんでした。通信状況をご確認ください。','Could not leave your note. Please check your connection.'); msg.className='sd-fp-msg err'; }
      });
    });
  })();
  sd.querySelectorAll('.sd-pclose').forEach(b=>b.addEventListener('click',closePanels));

  /* 「商用ライセンスを取得」→ お気に入りパネルを開き、チェックボックスへ誘導 */
  const sdLic=sd.querySelector('.sd-lic');
  if(sdLic) sdLic.addEventListener('click',()=>{
    // 景色の中では通常のお気に入りボックス（fav-modal）を開いてライセンス申請へ
    if(window.HMIX_FAV_MODAL&&window.HMIX_FAV_MODAL.open) window.HMIX_FAV_MODAL.open();
  });
  const sdLicBtn=sd.querySelector('.sd-license');
  if(sdLicBtn) sdLicBtn.addEventListener('click',()=>{
    const sel=window.HMIX_LIC_SEL||new Set();
    if(sel.size&&window.HMIX_LIC_URL) window.open(window.HMIX_LIC_URL(),'_blank','noopener');
  });
  /* 操縦席側での選択変更を追従 */
  window.addEventListener('hmix:licsel',()=>{
    const favPanel=panels.find(p=>p.dataset.panel==='fav');
    if(favPanel&&!favPanel.hidden) renderFavPanel(); else updateDiveLicenseUI();
  });

  /* お気に入りは本サイト共通キー (fav-modal.js / cockpit-tag.js と同じ) */
  const favIds=()=>{ try{ return JSON.parse(localStorage.getItem('hmix_favorites'))||[]; }catch(e){ return []; } };
  const trackIdx={}; ((window.HMIX&&window.HMIX.TRACKS)||[]).forEach(t=>trackIdx[t.id]=t);

  function renderFavPanel(){
    const panel=panels.find(p=>p.dataset.panel==='fav');
    if(!panel) return;
    const ul=panel.querySelector('.sd-plist');
    ul.innerHTML='';
    const ids=favIds();
    const sel=window.HMIX_LIC_SEL;
    updateDiveLicenseUI();
    if(!ids.length){ ul.innerHTML='<li class="sd-empty">'+L('まだお気に入りはありません。<br>♡ を押してこの旅の一曲を残そう。','No favorites yet.<br>Press ♡ to keep a song from this journey.')+'</li>'; return; }
    ids.forEach(id=>{
      const tk=trackIdx[id]; if(!tk) return;
      const li=document.createElement('li'); li.className='sd-row';
      li.innerHTML=`<label class="chk" title="${L('この曲を商用ライセンス申請に選ぶ','Select this track for a commercial license request')}"><input type="checkbox"${sel&&sel.has(String(id))?' checked':''}><span class="ck-txt">${L('申請','Request')}</span></label><span class="n">${tk.title}</span><span class="m">${fmt(tk.durationSec)}</span><button class="h" type="button" title="${L('お気に入りから外す','Remove from favorites')}">♥</button>`;
      const chk=li.querySelector('.chk input');
      chk.addEventListener('change',()=>{ window.HMIX_LIC_TOGGLE&&window.HMIX_LIC_TOGGLE(id,chk.checked); updateDiveLicenseUI(); });
      li.addEventListener('click',e=>{
        if(e.target.closest('.chk')) return;
        if(e.target.closest('.h')){
          const r=document.querySelector(`#cpVision .log-list[data-list="fav"] .row[data-tid="${id}"] .r-fav`);
          if(r) r.click();
          renderFavPanel(); syncTrack();
          return;
        }
        const row=document.querySelector(`#cpVision .log-list[data-list="fav"] .row[data-tid="${id}"]`);
        if(row) row.click();
      });
      ul.appendChild(li);
    });
  }

  /* ライセンス申請ボタン (favパネル下部) */
  function updateDiveLicenseUI(){
    const panel=panels.find(p=>p.dataset.panel==='fav'); if(!panel) return;
    const b=panel.querySelector('.sd-license');
    const sel=window.HMIX_LIC_SEL||new Set();
    if(b){
      b.hidden=false;
      b.disabled=!sel.size;
      b.textContent=sel.size?L(`◇ ライセンス申請（${sel.size}曲）▸`,`◇ Request license (${sel.size}) ▸`):L('◇ 曲にチェックを入れて申請','◇ Check tracks to request');
    }
  }

  /* 曲のリスト — コックピットのキュー (#queueSheet) を映す。クリックで本体の行へ委譲 */
  function renderListPanel(){
    const panel=panels.find(p=>p.dataset.panel==='list'); if(!panel) return;
    const ul=panel.querySelector('.sd-plist');
    ul.innerHTML='';
    const rows=[...document.querySelectorAll('#queueSheet .queue-list .row')];
    const playing=document.querySelector('#queueSheet .queue-list .row.playing');
    panel._curTid=playing?playing.dataset.tid:'';
    if(!rows.length){ ul.innerHTML='<li class="sd-empty">'+L('この星の曲はまだ積まれていません。','No tracks are loaded for this star yet.')+'</li>'; return; }
    rows.forEach(src=>{
      const li=document.createElement('li');
      li.className='sd-row'+(src.classList.contains('playing')?' playing':'');
      const n=src.querySelector('.r-name'), m=src.querySelector('.r-meta');
      li.innerHTML=`<span class="n">${n?n.textContent:''}</span><span class="m">${m?m.textContent:''}</span>`;
      li.addEventListener('click',()=>{ src.click(); setTimeout(()=>{ renderListPanel(); syncTrack(); },120); });
      ul.appendChild(li);
    });
    const pl=ul.querySelector('.playing'); if(pl) pl.scrollIntoView({block:'center'});
  }

  function renderTripPanel(){
    const bx=panels.find(p=>p.dataset.panel==='trip').querySelector('.sd-pbody');
    const S=window.JSTATE, st=S&&S.scene;
    if(!st){ bx.innerHTML='<div class="sd-empty">'+L('しおりはまだひらきません。','The bookmark cannot open yet.')+'</div>'; return; }
    const sc=st._scene||{};
    bx.innerHTML=`
      <div class="sd-shmeta"><b>${st.jpSub}</b> · ${st.jp}${L('（'+((st._tracks||[]).length)+'曲）','('+((st._tracks||[]).length)+')')}</div>
      <div class="sd-shline">${st.line||''}</div>
      <div class="sd-shacts">
        <button data-act="cockpit" type="button">${L('◄ 操縦席へ','◄ To cockpit')}</button>
        <button data-act="hub" type="button">${L('✦ 星図へ','✦ To star map')}</button>
      </div>`;
    bx.querySelector('[data-act="cockpit"]').addEventListener('click',()=>leave(false));
    bx.querySelector('[data-act="hub"]').addEventListener('click',()=>leave(true));
  }

  function syncTrack(){
    const ti=$('.np-title'), su=$('.np-sub'), stt=$('.np-state');
    if(ti) tTitle.textContent=ti.textContent;
    if(su) tSub.textContent=su.textContent;
    if(stt) bPlay.innerHTML=stt.classList.contains('paused')?I.play:I.pause;
    const npf=$('.np-fav');
    if(npf&&bFav){ const on=npf.classList.contains('on');
      if(bFav._on!==on){ bFav._on=on; bFav.classList.toggle('on',on); bFav.innerHTML=on?I.heartF:I.heartO; } }
    fpTrackChanged();
  }

  /* ---- entry-button availability + live sync ------------------ */
  setInterval(()=>{
    if(btn){
      const S=window.JSTATE, st=S&&S.scene;
      const ok=!!(st&&document.body.dataset.mode==='dock'&&SCENERY[st.id]);
      btn.disabled=!ok;
      btn.title=ok?L('この星の景色へダイブ','Dive into this star’s scenery'):L('この星の景色はまだ準備中です','This star’s scenery is still in preparation');
      const wbs=btn.querySelector('.wb-scene');
      if(wbs){
        const src=ok?SCENERY[st.id]:null;
        if(src&&wbs.dataset.src!==src){ wbs.dataset.src=src; wbs.style.backgroundImage=`url("${src}")`; }
        wbs.classList.toggle('show',!!src);
      }
    }
    if(phase==='scene'){
      syncTrack();
      /* 曲のリストを開いている間、曲が替わったら再生中マークを追従させる */
      const lp=panels.find(p=>p.dataset.panel==='list');
      if(lp&&!lp.hidden){
        const playing=document.querySelector('#queueSheet .queue-list .row.playing');
        const tid=playing?playing.dataset.tid:'';
        if(lp._curTid!==tid) renderListPanel();
      }
    }
  },400);

  /* 言語切替に追従: 表示中のパネル/ボタンのラベルだけを安全に再描画（状態は壊さない） */
  window.addEventListener('hmix:lang', function(){
    try{
      const open=panels.find(p=>!p.hidden);
      if(open){
        const name=open.dataset.panel;
        if(name==='fav') renderFavPanel();
        else if(name==='list') renderListPanel();
        else if(name==='trip') renderTripPanel();
      }
      updateDiveLicenseUI();
    }catch(e){}
  });
})();
