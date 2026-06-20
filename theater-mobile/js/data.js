/* ============================================================
   H/MIX GALLERY — THEATER  /  data layer
   Binds to the real tracks.js (TRACKS, TAGS_META) loaded before this.
   Adds: scene auras + imagery, two-ring tag selection, helpers.
   ============================================================ */

const IMG = id => 'assets/scenes/' + id + '.webp';

/* ---- 8 情景 (scenes) — aura + imagery + track filter ------- */
const SCENES = [
  { id:'japanese', jp:'神域', jpSub:'和風・神社',     en:'The Sacred Gate',      enSub:'Shrine · Tradition', line:'灯がともり、鳥居の奥がしずかに息をする。', aura:'255,190,130', ink:'#f6d79a', img:IMG('japanese'), filter:{ style:['japanese'], scene:['shrine','samurai'] } },
  { id:'forest',   jp:'翠霊', jpSub:'森・癒し',       en:'Emerald Woodland',     enSub:'Forest · Rest',      line:'木洩れ日が、まだ眠っている苔をなでていく。', aura:'150,220,140', ink:'#bfe9a8', img:IMG('forest'),   filter:{ scene:['forest','onsen','village'] } },
  { id:'battle',   jp:'剣跡', jpSub:'バトル・冒険',   en:'Sword of Ember',       enSub:'Battle · Heroism',   line:'火の粉が舞い、鼓動が刃の上で速くなる。',     aura:'255,110,80',  ink:'#ff9a78', img:IMG('battle'),   filter:{ scene:['battle','boss'] } },
  { id:'farewell', jp:'雨花', jpSub:'切ない・別れ',   en:'Rain Upon a Flower',   enSub:'Sorrow · Farewell',  line:'ひとひらの花に、雨がそっと別れを置いていく。', aura:'130,170,220', ink:'#a9c4ec', img:IMG('farewell'), filter:{ feeling:['sad'] } },
  { id:'horror',   jp:'月蝕', jpSub:'ホラー・恐怖',   en:'Eclipse Hollow',       enSub:'Horror · Curse',     line:'月が欠け、影が床を這うように伸びていく。',   aura:'180,130,220', ink:'#cfa9ec', img:IMG('horror'),   filter:{ feeling:['scary'] } },
  { id:'festival', jp:'燈祭', jpSub:'楽しい・明るい', en:'The Lantern Festival', enSub:'Joy · Celebration',  line:'提灯がゆれ、遠い囃子が胸をくすぐる。',       aura:'255,180,100', ink:'#ffce8a', img:IMG('festival'), filter:{ feeling:['happy'], scene:['festival','town'] } },
  { id:'night',    jp:'星宿', jpSub:'夜・静寂',       en:'Stardust Meadow',      enSub:'Night · Solitude',   line:'草はらに寝ころべば、星が降りてくる。',       aura:'160,200,255', ink:'#bcd6ff', img:IMG('night'),    filter:{ scene:['night'] } },
  { id:'fantasy',  jp:'天穹', jpSub:'旅・出発',       en:'Castle in the Sky',    enSub:'Journey · Departure',line:'雲をこえた先に、まだ見ぬ地平がひらける。',   aura:'170,220,240', ink:'#bfeaf6', img:IMG('fantasy'),  filter:{ scene:['opening','ending','travel','field'] } },
];

/* tag → representative scene (for aura coloring in the atlas) */
const TAG_SCENE = {
  gentle:'forest', happy:'festival', epic:'battle', mysterious:'night', sad:'farewell',
  suspense:'battle', scary:'horror', dark:'horror', cute:'festival',
  memory:'farewell', reunion:'farewell', farewell:'farewell', victory:'battle', defeat:'horror',
  peaceful:'forest', dream:'fantasy', conspiracy:'horror', dailylife:'festival', destiny:'fantasy',
  omen:'horror', resolve:'battle', bonds:'farewell', pursuit:'battle', hope:'fantasy', flashback:'farewell', despair:'horror',
  battle:'battle', boss:'battle', town:'festival', village:'forest', field:'fantasy', forest:'forest',
  night:'night', travel:'fantasy', dungeon:'horror', ruins:'horror', cave:'horror', festival:'festival',
  opening:'fantasy', ending:'farewell', onsen:'forest', shrine:'japanese', samurai:'japanese',
  snow:'farewell', mansion:'horror', morning:'fantasy', church:'japanese',
  fantasy:'fantasy', japanese:'japanese', celtic:'forest', medieval:'battle', oriental:'japanese',
  futuristic:'night', electronic:'night', modern:'festival', musicbox:'farewell',
  japanese_horror:'horror', western_horror:'horror',
};

/* ---- three rings — ALL tags from the real TAGS_META --------
   inner = feeling / middle = story / outer = scene + style   */
function _ringAll(cats){
  return cats.flatMap(cat=>(TAGS_META[cat]||[]).map(m=>({
    id:m.id, jp:m.name, en:m.name_en, type:cat, sceneId:TAG_SCENE[m.id]||'fantasy'
  })));
}
const TAGS_FEELING=_ringAll(['feeling']);
const TAGS_STORY  =_ringAll(['story']);
const TAGS_PLACE  =_ringAll(['scene','style']);
const TAGS_RINGS  =[TAGS_FEELING, TAGS_STORY, TAGS_PLACE];
/* flat lists kept for tag lookup across the app */
const TAGS_INNER=[...TAGS_FEELING, ...TAGS_STORY];
const TAGS_OUTER=TAGS_PLACE;

/* ---- helpers (real field names: durationSec, description) -- */
function _matchesFilter(t, f){
  return (f.feeling && f.feeling.some(x=>(t.feeling||[]).includes(x))) ||
         (f.story   && f.story.some(x=>(t.story||[]).includes(x)))   ||
         (f.scene   && f.scene.some(x=>(t.scene||[]).includes(x)))   ||
         (f.style   && f.style.some(x=>(t.style||[]).includes(x)));
}
function tracksForScene(sceneId){
  const s=SCENES.find(x=>x.id===sceneId); if(!s||typeof TRACKS==='undefined') return [];
  return TRACKS.filter(t=>_matchesFilter(t, s.filter));
}
function tracksForTag(tag){
  if(typeof TRACKS==='undefined') return [];
  return TRACKS.filter(t=>
    (t.feeling||[]).includes(tag.id) || (t.story||[]).includes(tag.id) ||
    (t.scene||[]).includes(tag.id)   || (t.style||[]).includes(tag.id));
}
/* which scene a track best belongs to (banners / aura) */
function sceneOfTrack(track){
  for(const s of SCENES){ if(_matchesFilter(track, s.filter)) return s.id; }
  return 'fantasy';
}
/* resolve mp3 path through tracks.js base path */
function trackUrl(track){
  if(!track||!track.mp3) return null;
  const base=(typeof HMIX_BASE_PATH!=='undefined')?HMIX_BASE_PATH:'';
  return base + track.mp3;
}
/* 星に降りるたびに並びを変える (Fisher-Yates)。登録順のままだと
   どのタグでも同じ古い曲から始まり、同じ曲ばかり流れてしまうため。 */
function shuffled(arr){
  const a=(arr||[]).slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

/* tag counts from the real library */
[...TAGS_INNER, ...TAGS_OUTER].forEach(t=>{ t.count = tracksForTag(t).length; });

window.HMIX = { SCENES, TAGS_INNER, TAGS_OUTER, TAGS_RINGS, tracksForScene, tracksForTag, sceneOfTrack, trackUrl, shuffled,
  get TRACKS(){ return typeof TRACKS!=='undefined'?TRACKS:[]; } };
