/* ============================================================
   星渡し — journey-tag.js
   The EXACT journey.js cockpit station (particle reconstruction,
   constellation ring, kinetic type, starfield, all constants),
   but for ONE tag chosen from the 58-tag rings. No scroll — you
   pick a tag in the hub, dive, and dock at that tag's station.
   Only the CONTENT differs from journey-cockpit; the design is the same.
   ============================================================ */
(function(){
  const TAU = Math.PI*2;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const lerp=(a,b,t)=>a+(b-a)*t;
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const smooth=(e0,e1,x)=>{ const t=clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); };
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const mix=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
  const css=a=>`${a[0]|0},${a[1]|0},${a[2]|0}`;

  const HM=window.HMIX, SC=HM.SCENES, RINGS=HM.TAGS_RINGS;
  const sceneOf=id=>SC.find(s=>s.id===id)||SC[0];
  const auraOf=id=>sceneOf(id).aura.split(',').map(Number);
  const GOLD=[216,180,106], DEEP=[14,13,20];
  const RING_TINT=[[246,210,150],[206,168,236],[188,224,246]];
  const RING_NAME=['感情','物語','情景・様式'], BR=[0.30,0.60,0.95];

  /* every tag as a hub star, banded by ring */
  const STARS=[];
  RINGS.forEach((tags,ri)=>{
    const pad=34, w=tags.map(t=>t.jp.length*16+pad), tot=w.reduce((a,b)=>a+b,0);
    let acc=0;
    tags.forEach((tag)=>{ const i=STARS.length-(STARS.filter(s=>s.ri===ri).length); });
    let a2=0;
    tags.forEach((tag,i)=>{ const ang=((a2+w[i]/2)/tot)*TAU; a2+=w[i];
      STARS.push({ tag, ri, ang, br:BR[ri], aura:auraOf(tag.sceneId), tint:RING_TINT[ri], el:null, ph:rnd(0,TAU) }); });
  });

  /* build a "station" (scene-shaped) object from a tag */
  const RING_EN=['FEELING TAG','STORY TAG','SCENE TAG'];
  function nearOf(star){
    let near=null;
    for(const o of STARS){
      if(o===star||o.tag.sceneId!==star.tag.sceneId) continue;
      if(!near) near=o.tag.jp;
      if(o.ri===star.ri){ near=o.tag.jp; break; }
    }
    return near;
  }
  function stationFor(star){
    const s=sceneOf(star.tag.sceneId);
    return {
      jp:star.tag.jp, en:(star.tag.en||star.tag.jp).toUpperCase(),
      enSub:RING_NAME[star.ri], jpSub:RING_NAME[star.ri], line:star.tag.line||s.line,
      _rgb:star.aura.slice(), _pts:null, _scene:s, _ringEn:RING_EN[star.ri], _near:nearOf(star),
      _tracks:HM.tracksForTag(star.tag), id:star.tag.id, count:star.tag.count
    };
  }

  /* ============================================================ DOM */
  const root=document.getElementById('journey');
  const canvas=document.getElementById('jCanvas'); const ctx=canvas.getContext('2d');
  const overlay=document.getElementById('jOverlay');
  const dotsBox=document.getElementById('jDots');
  const hubLayer=document.getElementById('tagHub');
  const dpr=Math.min(window.devicePixelRatio||1,2);
  let W=0,H=0,cx=0,cy=0,RX=0,RY=0;
  function resize(){ W=root.clientWidth; H=root.clientHeight; cx=W/2; cy=H/2;
    canvas.width=W*dpr; canvas.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    RX=Math.min(W*0.40,660); RY=Math.min(H*0.24,270); }   /* 縦幅を狭く（レターボックス寄りの星図） */

  /* ============================================================ GLYPH (variable length) */
  function sampleWord(text){
    const S=240, oc=document.createElement('canvas'); oc.width=oc.height=S;
    const o=oc.getContext('2d'); o.fillStyle='#fff'; o.textAlign='center'; o.textBaseline='middle';
    const chars=[...text];
    if(chars.length<=1){ o.font='600 '+Math.round(S*0.5)+'px "Noto Serif JP",serif'; o.fillText(text,S/2,S/2); }
    else if(chars.length===2){ o.font='600 '+Math.round(S*0.44)+'px "Noto Serif JP",serif'; o.fillText(chars[0],S*0.29,S/2); o.fillText(chars[1],S*0.71,S/2); }
    else { let fs=Math.round(S*0.9/chars.length); fs=clamp(fs,24,Math.round(S*0.3));
           o.font='600 '+fs+'px "Noto Serif JP",serif'; o.fillText(text,S/2,S/2); }
    const data=o.getImageData(0,0,S,S).data, pts=[]; const step=3;
    for(let y=0;y<S;y+=step)for(let x=0;x<S;x+=step){ if(data[(y*S+x)*4+3]>128) pts.push([(x/S)*2-1,(y/S)*2-1]); }
    for(let i=pts.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [pts[i],pts[j]]=[pts[j],pts[i]]; }
    return pts.slice(0,760);
  }
  let fontsReady=false; (document.fonts?document.fonts.ready:Promise.resolve()).then(()=>fontsReady=true);
  function ptsFor(st){ if(!st._pts && fontsReady) st._pts=sampleWord(st.jp); return st._pts; }

  /* ============================================================ PARTICLES (journey constants) */
  const COUNT=reduce?1100:Math.min(2600,Math.round(innerWidth*innerHeight/620));
  const ZFAR=1400, FOCAL=480, SPREAD=2600;
  let P=[];
  function build(){ P=new Array(COUNT); for(let i=0;i<COUNT;i++){ const p={};
    p.x=rnd(-SPREAD,SPREAD); p.y=rnd(-SPREAD,SPREAD); p.z=rnd(1,ZFAR);
    p.tw=rnd(0,TAU); p.tws=rnd(.6,2.2); p.bs=rnd(.7,1.9); p.px=0;p.py=0;p.has=false; P[i]=p; } }

  /* ============================================================ STATE */
  let mode='hub';           // hub · diving · dock
  let station=null, curStar=null;
  let dock=0, travel=0, swirl=0, vel=0, hubFade=1, aura=DEEP.slice();
  let warpT=0, warpStar=null, flash=0;   // 星間ワープ (タグを旅する)
  let hubRot=0,hubRotT=0,hubTilt=0.7,hubTiltT=0.7,dragMoved=false;  // 星図: 回転 + 視点の角度(初期は斜め俯瞰)
  const JSTATE={act:-1,eased:0,vel:0,scene:null,SEGS:3,N:1}; window.JSTATE=JSTATE;

  function selectStar(star){
    curStar=star; station=stationFor(star);
    buildStationOverlay(station);
    mode='diving'; dock=0; vel=0;
  }
  function backToHub(){ mode='hub'; station=null; curStar=null; }

  /* ============================================================ RENDER LOOP (journey scheduler) */
  let raf=null,last=0;
  function render(t){
    try{
    const dt=Math.max(0,Math.min(.05,(t-last)/1000||.016)); last=t;
    if(mode==='diving'){
      dock=Math.min(1,dock+dt/1.3);
      /* warp burst — ワープ明けは残速を引き継いで減速 */
      vel=Math.max(Math.sin(clamp(dock/0.7,0,1)*Math.PI)*1.1, vel*(1-Math.min(1,dt*3.2)));
      hubFade=Math.max(0,hubFade-dt*4);
      if(dock>=1){ mode='dock'; fireBurst(); }
    } else if(mode==='dock'){
      vel=lerp(vel,0,Math.min(1,dt*4)); hubFade=Math.max(0,hubFade-dt*4);
    } else if(mode==='warp'){
      /* 星図に戻らないワープ: 文字が後方へ散り、トンネルが灼ける */
      warpT+=dt;
      dock=Math.max(0,dock-dt*2.4);                      // word scatters backward
      vel=Math.min(2.6, vel+dt*5);                       // overdrive tunnel
      hubFade=Math.max(0,hubFade-dt*4);
      if(warpT>=0.95&&warpStar){ const s=warpStar; warpStar=null; flash=1; selectStar(s); }
    } else { /* hub */
      dock=Math.max(0,dock-dt*4); vel=lerp(vel,0,Math.min(1,dt*4)); hubFade=Math.min(1,hubFade+dt*3);
    }
    const idle=reduce?14:26;
    travel += (idle+Math.min(1,vel*2.4)*860+Math.max(0,vel-1.1)*760)*dt;
    swirl  += (0.06+Math.min(1,vel*2)*0.5)*dt;
    draw(t,dt);
    }catch(err){ if(!render._l){render._l=1;console.error('tag:',err);} }
  }
  function tickRAF(t){ render(t); raf=requestAnimationFrame(tickRAF); }
  function tickHidden(){ render(performance.now()); raf=setTimeout(tickHidden,33); }
  function start(){ if(raf){cancelAnimationFrame(raf);clearTimeout(raf);} last=performance.now();
    if(document.hidden) tickHidden(); else raf=requestAnimationFrame(tickRAF); }

  function draw(t,dt){
    dt=dt||0.016;
    /* aura */
    const targetA = (mode==='hub')?DEEP : station._rgb;
    aura=mix(aura, targetA, Math.min(1, (mode==='hub'?0.06:0.05)*1.6));
    const A=aura, aCss=css(A); root.style.setProperty('--aura',aCss);

    ctx.clearRect(0,0,W,H);
    let bg=ctx.createRadialGradient(cx,cy*0.92,0,cx,cy,Math.max(W,H)*0.8);
    bg.addColorStop(0,`rgba(${aCss},0.10)`);
    bg.addColorStop(0.45,`rgba(${Math.round(A[0]*0.4)},${Math.round(A[1]*0.4)},${Math.round(A[2]*0.5)},0.06)`);
    bg.addColorStop(1,'rgba(4,3,7,0)');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    const asm = (mode==='hub')?0 : (ptsFor(station)?easeIO(dock):0);
    const ambient = 1-asm*0.82;
    const pts = (mode==='hub')?null:ptsFor(station);
    const box=Math.min(W,H)*0.40, kcx=cx, kcy=H*0.455;
    const cosR=Math.cos(swirl), sinR=Math.sin(swirl);
    const warp=Math.min(1, vel*2.4);

    /* publish state for the cockpit HUD */
    JSTATE.act = (mode==='hub')?-1:(dock>0.5?0:-1);
    JSTATE.eased = 0.5*dock; JSTATE.vel=vel; JSTATE.scene = (mode==='hub')?null:station;

    if(asm>0.04) drawConstellation(t, kcx, kcy, box, asm, aCss);

    for(let i=0;i<COUNT;i++){
      const p=P[i];
      let z=p.z-(travel%ZFAR); if(z<=1) z+=ZFAR;
      const s=FOCAL/z;
      const rx=p.x*cosR-p.y*sinR, ry=p.x*sinR+p.y*cosR;
      let sx=cx+rx*s, sy=cy+ry*s;
      const depth=1-z/ZFAR, size=clamp(p.bs*s*2.0,0.25,4.0);
      let dX=sx,dY=sy,dS=size,bright,col,assembled=false;
      const recruit=asm>0&&(i%5!==0)&&pts&&(i<pts.length*5);
      if(recruit){
        const tp=pts[i%pts.length];
        const tx=kcx+tp[0]*box*0.5, ty=kcy+tp[1]*box*0.5;
        const k=asm;
        dX=lerp(sx,tx,k); dY=lerp(sy,ty,k); dS=lerp(size,1.7+glowFlare*1.4,k); assembled=k>0.5;
        col=mix([255,255,255],A,0.35*k);
        if(glowFlare>0.01) col=mix(col,[255,255,255],glowFlare*0.65);
        bright=clamp(0.25+depth*0.5,0,1)*(1-asm)+(0.55+0.45*Math.sin(t*0.004+p.tw))*asm;
        bright=clamp(bright+glowFlare*0.55*asm,0,1);
      } else {
        col=mix([214,224,255],A,0.18);
        bright=clamp((0.22+depth*0.8),0,1)*ambient*(0.65+0.35*Math.sin(t*0.001*p.tws+p.tw));
      }
      if(bright<=0.01){ p.px=dX;p.py=dY;continue; }
      if(!assembled&&warp>0.15&&depth>0.35&&p.has){
        ctx.strokeStyle=`rgba(${css(col)},${(bright*warp*0.7).toFixed(3)})`;
        ctx.lineWidth=Math.max(0.5,dS*0.8); ctx.beginPath(); ctx.moveTo(p.px,p.py); ctx.lineTo(dX,dY); ctx.stroke();
      }
      ctx.fillStyle=`rgba(${css(col)},${bright.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(dX,dY,dS,0,TAU); ctx.fill();
      if(assembled&&dS>1.4){ ctx.fillStyle=`rgba(${aCss},${(bright*(0.25+glowFlare*0.45)).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(dX,dY,dS*2.6,0,TAU); ctx.fill(); }
      p.px=dX;p.py=dY;p.has=true;
    }

    if(asm>0.05){
      const g=ctx.createRadialGradient(kcx,kcy,0,kcx,kcy,box*0.95);
      g.addColorStop(0,`rgba(${aCss},${((0.14+glowFlare*0.22)*asm).toFixed(3)})`); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(kcx,kcy,box*0.95,0,TAU); ctx.fill();
    }
    if(glowFlare>0) glowFlare=Math.max(0,glowFlare-dt*1.5);

    /* hub stars + labels (always update so labels fade fully to 0) */
    hubStars(t);

    drawBurst(dt);
    emitSparks(dt, asm, A, pts, box, kcx, kcy);
    drawSparks(dt);
    maybeShoot(t, warp);

    /* arrival flash — ワープ着弾の閃光 */
    if(flash>0){
      const g=ctx.createRadialGradient(cx,H*0.455,0,cx,cy,Math.max(W,H)*0.75);
      g.addColorStop(0,`rgba(255,255,255,${(flash*0.32).toFixed(3)})`);
      g.addColorStop(0.4,`rgba(${aCss},${(flash*0.16).toFixed(3)})`);
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      flash=Math.max(0,flash-dt*1.5);
    }

    syncOverlay();
  }

  /* ---- constellation ring (verbatim) ---- */
  const RING=Array.from({length:9},(_,i)=>({ a:(i/9)*TAU, r:rnd(0.82,1.02), tw:rnd(0,TAU) }));
  function drawConstellation(t,x,y,box,asm,aCss){
    const R=box*0.92, rot=t*0.00006;
    const node=k=>{ const o=RING[k]; const ang=o.a+rot; return [x+Math.cos(ang)*R*o.r, y+Math.sin(ang)*R*o.r*0.78]; };
    ctx.lineWidth=1; ctx.strokeStyle=`rgba(${aCss},${(0.18*asm).toFixed(3)})`;
    ctx.beginPath(); for(let k=0;k<RING.length;k++){ const n=node(k); k?ctx.lineTo(n[0],n[1]):ctx.moveTo(n[0],n[1]); } ctx.closePath(); ctx.stroke();
    for(let k=0;k<RING.length;k++){ const n=node(k); const tw=0.6+0.4*Math.sin(t*0.003+RING[k].tw);
      ctx.fillStyle=`rgba(${aCss},${(asm*tw*0.9).toFixed(3)})`; ctx.beginPath(); ctx.arc(n[0],n[1],1.8,0,TAU); ctx.fill();
      ctx.fillStyle=`rgba(${aCss},${(asm*tw*0.2).toFixed(3)})`; ctx.beginPath(); ctx.arc(n[0],n[1],6,0,TAU); ctx.fill(); }
  }

  /* ---- hub stars (banded rings) ---- */
  function hubStars(t){
    hubRot=lerp(hubRot,hubRotT,0.12);
    hubTilt=lerp(hubTilt,hubTiltT,0.12);
    const RYe=Math.min(RY*hubTilt, H*0.44);              // 視点の俰角 → 楕円の潰れ
    const e=clamp(1.05-hubTilt,0,0.85);                  // 傾くほど遠近感を強く
    const rot=swirl*0.4+hubRot;
    for(const st of STARS){
      const a=st.ang+rot, lx=Math.cos(a)*st.br, ly=Math.sin(a)*st.br;
      const x=cx+lx*RX, y=cy+ly*RYe;
      const far=-Math.sin(a);                            // 1=奥(上) / -1=手前(下)
      const s=clamp(1-far*0.30*e,0.62,1.34);             // 手前は大きく、奥は小さく
      const dp=clamp(1-far*0.38*e,0.42,1.25);            // 奥は淡く
      const hot=st.el&&st.el.classList.contains('hot');
      const tw=0.6+0.4*Math.sin(t*0.002+st.ph), g=(hot?2.6:1)*s;
      ctx.fillStyle=`rgba(${css(st.aura)},${(hubFade*tw*0.95*dp).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x,y,1.8*g,0,TAU); ctx.fill();
      ctx.fillStyle=`rgba(${css(st.aura)},${(hubFade*0.16*g*dp).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x,y,7*g,0,TAU); ctx.fill();
      if(st.el){ st.el.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) scale(${s.toFixed(3)})`;
        st.el.style.opacity=(hubFade*(0.45+0.55*dp)).toFixed(3);
        st.el.style.pointerEvents=(mode==='hub'&&hubFade>0.6)?'auto':'none'; }
    }
  }

  /* ============================================================ KANJI BURST
     At the instant the character locks, a slice of light flares out from
     its strokes — particles 弾け飛ぶ outward, then fade. */
  let burst=[];
  let glowFlare=0;   /* 曲替わりの輝き — 1→0 へ約0.7秒で減衰 */
  function fireBurst(){
    const pts = station && ptsFor(station); if(!pts) return;
    const box=Math.min(W,H)*0.40, kcx=cx, kcy=H*0.455, A=station._rgb;
    burst=[];
    const n=Math.min(160, pts.length);
    for(let i=0;i<n;i++){
      const tp=pts[(Math.random()*pts.length)|0];
      const x=kcx+tp[0]*box*0.5, y=kcy+tp[1]*box*0.5;
      const dx=x-kcx, dy=y-kcy, d=Math.hypot(dx,dy)||1;
      const ang=Math.atan2(dy,dx)+rnd(-0.55,0.55);
      const sp=(0.9+d/box*2.4)*rnd(1.6,4.4);
      burst.push({ x, y, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp,
        life:1, decay:rnd(0.55,1.15), r:rnd(0.8,2.3), col:A });
    }
  }
  function drawBurst(dt){
    if(!burst.length) return;
    for(let i=burst.length-1;i>=0;i--){
      const b=burst[i];
      b.x+=b.vx; b.y+=b.vy; b.vx*=0.93; b.vy*=0.93;
      b.life-=b.decay*dt;
      if(b.life<=0){ burst.splice(i,1); continue; }
      const a=clamp(b.life,0,1), rad=b.r*(0.55+a*0.9);
      const col=mix([255,255,255], b.col, 0.55*(1-a));
      ctx.fillStyle=`rgba(${css(col)},${(a*0.95).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(b.x,b.y,rad,0,TAU); ctx.fill();
      ctx.fillStyle=`rgba(${css(b.col)},${(a*0.16).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(b.x,b.y,rad*3.2,0,TAU); ctx.fill();
    }
  }

  /* ============================================================ LIVING SPARKS
     While the kanji holds, light grains keep welling up from its strokes
     and scatter off in random directions — the character stays alive. */
  let sparks=[];
  function emitSparks(dt, asm, A, pts, box, kcx, kcy){
    if(!pts || asm<0.5) return;
    const rate=(reduce?7:20)*asm;                 // grains per second
    const n=rate*dt, cnt=(n|0)+(Math.random()<(n-(n|0))?1:0);
    for(let i=0;i<cnt;i++){
      const tp=pts[(Math.random()*pts.length)|0];
      const x=kcx+tp[0]*box*0.5, y=kcy+tp[1]*box*0.5;
      const fling=Math.random()<0.34;             // most gently well up, some are flung
      const ang=Math.random()*TAU;                // any direction
      const sp=fling?rnd(0.7,2.1):rnd(0.04,0.4);
      sparks.push({ x, y,
        vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp-(fling?0:rnd(0,0.12)),
        life:1, decay:fling?rnd(0.55,0.95):rnd(0.32,0.6),
        r:fling?rnd(0.7,1.6):rnd(0.5,1.3), col:A.slice(), fling });
    }
    if(sparks.length>380) sparks.splice(0, sparks.length-380);
  }
  function drawSparks(dt){
    for(let i=sparks.length-1;i>=0;i--){
      const s=sparks[i];
      s.x+=s.vx; s.y+=s.vy; s.vx*=0.965; s.vy*=0.965;
      s.life-=s.decay*dt;
      if(s.life<=0){ sparks.splice(i,1); continue; }
      const a=clamp(s.life,0,1), rad=s.r*(0.5+a*0.7);
      const col=mix([255,255,255], s.col, 0.4*(1-a));
      if(s.fling && !reduce && a>0.25){
        ctx.strokeStyle=`rgba(${css(s.col)},${(a*0.22).toFixed(3)})`;
        ctx.lineWidth=Math.max(0.5,rad*0.7);
        ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(s.x-s.vx*4,s.y-s.vy*4); ctx.stroke();
      }
      ctx.fillStyle=`rgba(${css(col)},${(a*0.9).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(s.x,s.y,rad,0,TAU); ctx.fill();
      ctx.fillStyle=`rgba(${css(s.col)},${(a*0.13).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(s.x,s.y,rad*2.8,0,TAU); ctx.fill();
    }
  }

  let shoots=[],nextShoot=0;
  function maybeShoot(t,warp){ if(reduce) return;
    if(t>nextShoot&&warp<0.4){ nextShoot=t+rnd(2600,6000);
      const ang=Math.PI*0.22+rnd(-.12,.12),sp=rnd(8,14);
      shoots.push({x:rnd(W*0.1,W*0.7),y:rnd(0,H*0.32),vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:1}); }
    for(let i=shoots.length-1;i>=0;i--){ const s=shoots[i]; s.x+=s.vx;s.y+=s.vy;s.life-=0.016;
      ctx.strokeStyle=`rgba(245,224,170,${(Math.max(0,s.life)*0.7).toFixed(3)})`; ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(s.x-s.vx*9,s.y-s.vy*9); ctx.stroke();
      if(s.life<=0||s.x>W+80||s.y>H+80) shoots.splice(i,1); }
  }

  /* ============================================================ OVERLAY (journey kinetic type) */
  let stationEl=null;
  function splitChars(str){ return [...str].map((ch,i)=>ch===' '||ch==='　'
    ?`<span class="kc sp" style="--i:${i}"> </span>`
    :`<span class="kc" style="--i:${i}">${ch==='<'?'&lt;':ch}</span>`).join(''); }
  function buildStationOverlay(st){
    overlay.innerHTML='';
    const el=document.createElement('div'); el.className='station st-block';
    el.innerHTML=`
      <div class="st-top"><span class="st-idx">◇</span><span class="st-cat">${st.jpSub}</span></div>
      <div class="st-foot">
        <div class="st-en">${splitChars(st.en)}</div>
        <div class="st-sub">${st.enSub}</div>
        <div class="st-meta">${st._ringEn} · ${(st._tracks||[]).length} TRACKS${st._near?(' · NEAR: '+st._near):''}</div>
        <div class="st-poem">${splitChars(st.line)}</div>
      </div>`;
    overlay.appendChild(el); stationEl=el; el._on=false;
  }
  function syncOverlay(){
    if(!stationEl) return;
    const a=(mode==='hub')?0:dock;
    stationEl.style.opacity=a.toFixed(3);
    const on=a>0.45; if(on!==stationEl._on){ stationEl._on=on; stationEl.classList.toggle('on',on); }
  }

  /* ============================================================ HUB LABELS */
  // 言語対応: EN時はタグ名を英語主体に。日英は HMIX_LANG / sessionStorage を参照。
  function jEN(){ try{ var v=window.HMIX_LANG||sessionStorage.getItem('hmix_lang')||localStorage.getItem('hmix_lang'); return v==='en'; }catch(e){ return window.HMIX_LANG==='en'; } }
  function tagName(t){ return (jEN() && t.en) ? t.en : t.jp; }
  function tagLabelHtml(t){
    const main = jEN() ? (t.en || t.jp) : t.jp;
    const meta = jEN() ? (t.jp + ' · ' + t.count) : ((t.en||'').toUpperCase() + ' · ' + t.count);
    return `<span class="tl-jp">${main}</span><span class="tl-meta">${meta}</span>`;
  }
  function buildHub(){
    STARS.forEach(st=>{
      const b=document.createElement('button'); b.className='taglbl ring'+st.ri;
      b.innerHTML=tagLabelHtml(st.tag);
      b.addEventListener('pointerenter',()=>b.classList.add('hot'));
      b.addEventListener('pointerleave',()=>b.classList.remove('hot'));
      b.addEventListener('click',()=>{ if(dragMoved) return; selectStar(st); });
      st.el=b; hubLayer.appendChild(b);
    });
  }

  /* ============================================================ BOOT */
  function init(){
    resize(); build(); buildHub();
    document.body.dataset.mode='hub';
    /* keep body data-mode synced for CSS */
    setInterval(()=>{ document.body.dataset.mode=mode;
      /* 行き先表示: 前後の星の名を左ウィングへ */
      if(curStar&&mode==='dock'){
        const i=STARS.indexOf(curStar), L=STARS.length;
        const nx=tagName(STARS[(i+1)%L].tag), pv=tagName(STARS[(i-1+L)%L].tag);
        if(nextName&&nextName.textContent!==nx) nextName.textContent=nx;
        if(prevName&&prevName.textContent!==pv) prevName.textContent=pv;
      }
    }, 80);
    const nextName=document.getElementById('wtNextName');
    const prevName=document.getElementById('wtPrevName');
    window.addEventListener('resize',()=>resize(),{passive:true});
    // 言語切替に追従して星図ハブのタグ名を再描画
    window.addEventListener('hmix:lang',()=>{ STARS.forEach(st=>{ if(st.el) st.el.innerHTML=tagLabelHtml(st.tag); }); });
    document.addEventListener('visibilitychange',start);
    start();
    /* hooks */
    window.__hub=()=>{ backToHub(); draw(performance.now()); };
    window.__tag=i=>{ selectStar(STARS[i||0]); dock=1; mode='dock'; hubFade=0; aura=station._rgb.slice(); draw(performance.now()); };
    window.__back=backToHub;
    window.__diveTagId=id=>{ const s=STARS.find(s=>s.tag.id===id); if(s){ selectStar(s); } };

    /* 曲が次へ渡る瞬間 — 文字が輝き、ひと粒弾ける */
    window.__trackPulse=()=>{
      if(mode==='hub'||!station) return;
      glowFlare=1;
      if(!reduce){ fireBurst(); flash=Math.max(flash,0.26); }
    };

    /* 星図のドラッグ — 横: 回転 / 縦: 視点の角度 (俰角) */
    let dragId=null,dragSX=0,dragSY=0,lastX=0,lastY=0;
    document.addEventListener('pointerdown',e=>{
      if(mode!=='hub') return;
      if(e.button!==undefined&&e.button!==0) return;
      if(e.target.closest('#tagHubHead, .th-legend, a, button:not(.taglbl)')) return;
      dragId=e.pointerId; dragSX=lastX=e.clientX; dragSY=lastY=e.clientY; dragMoved=false;
    });
    document.addEventListener('pointermove',e=>{
      if(dragId!==e.pointerId) return;
      if(!dragMoved && Math.abs(e.clientX-dragSX)+Math.abs(e.clientY-dragSY)>6){
        dragMoved=true; document.body.classList.add('hub-dragging'); }
      if(!dragMoved){ return; }
      hubRotT+=(e.clientX-lastX)*0.0032;
      hubTiltT=clamp(hubTiltT+(e.clientY-lastY)*0.0034, 0.30, 1.5);
      lastX=e.clientX; lastY=e.clientY;
    });
    const endDrag=e=>{ if(dragId!==e.pointerId) return; dragId=null;
      document.body.classList.remove('hub-dragging');
      setTimeout(()=>{ dragMoved=false; },0); };
    document.addEventListener('pointerup',endDrag);
    document.addEventListener('pointercancel',endDrag);
    /* タグを旅する — 星図に戻らず前後の星へワープ */
    window.__warpNext=()=>{ if(mode!=='dock'||!curStar) return;
      const i=STARS.indexOf(curStar);
      warpT=0; warpStar=STARS[(i+1)%STARS.length]; mode='warp'; };
    window.__warpPrev=()=>{ if(mode!=='dock'||!curStar) return;
      const i=STARS.indexOf(curStar), L=STARS.length;
      warpT=0; warpStar=STARS[(i-1+L)%L]; mode='warp'; };
    const bN=document.getElementById('btnVoyageNext'), bP=document.getElementById('btnVoyagePrev');
    if(bN) bN.addEventListener('click',()=>{ window.__warpNext&&window.__warpNext(); });
    if(bP) bP.addEventListener('click',()=>{ window.__warpPrev&&window.__warpPrev(); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
