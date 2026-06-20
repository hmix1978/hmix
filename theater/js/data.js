/* ============================================================
   H/MIX GALLERY — THEATER  /  data layer
   Binds to the real tracks.js (TRACKS, TAGS_META) loaded before this.
   Adds: scene auras + imagery, two-ring tag selection, helpers.
   ============================================================ */

const IMG = id => '../assets/images/scenes/' + id + '.webp';

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

/* ---- tag poems — 全タグに専用の一行詩 ----------------------
   星図で星を選んだときに表示される。情景(SCENES)の line を
   継承すると8種しかなく被るため、タグごとに書き下ろした。 */
const TAG_LINES = {
  /* feeling */
  gentle:        '手のひらのぬくもりが、そっと音になって降りつもる。',
  sad:           '言えなかった言葉が、雨音にまぎれて流れていく。',
  happy:         'はずむ足音に、世界が少しだけ明るく笑う。',
  epic:          '旗が風を打ち、大地がゆっくりと目を覚ます。',
  dark:          '灯りの届かない場所で、何かが静かに息をひそめる。',
  mysterious:    '霧のむこうで、まだ名前のない光がまたたく。',
  suspense:      '時計の針が、ひと呼吸ぶんだけ遅れて鳴る。',
  scary:         '振り向いた廊下の奥で、闇がかたちを変えた。',
  cute:          '小さな足どりが、花びらの上をはねていく。',
  /* story */
  memory:        '古いひきだしの奥で、色あせない時間が待っている。',
  reunion:       '改札のむこうの人ごみに、見覚えのある背中を見つける。',
  farewell:      'ひとひらの花に、雨がそっと別れを置いていく。',
  victory:       '折れなかった旗が、朝日の中で高くひるがえる。',
  defeat:        '膝をついた大地の冷たさを、いつか強さと呼ぶ日がくる。',
  peaceful:      '昼下がりの陽だまりで、世界がうたた寝をしている。',
  dream:         'まばたきのあいだに、空を歩く自分とすれちがう。',
  conspiracy:    '笑顔の裏側で、見えない糸が静かに張られていく。',
  dailylife:     '湯気の立つカップの横で、いつもの一日が動きだす。',
  destiny:       '星々の配置が、まだ誰も知らない約束を結んでいる。',
  omen:          '風の向きが変わり、鳥たちがいっせいに空へ散る。',
  resolve:       '迷いを脱ぎすてて、最初の一歩が大地を踏む。',
  bonds:         '離れていても、同じ月を見上げている誰かがいる。',
  pursuit:       '足音と足音が、夜の路地で距離を縮めていく。',
  hope:          '焼け跡の土から、小さな緑が顔を出す。',
  flashback:     'セピアの景色のなかで、あの日の声がよみがえる。',
  despair:       '出口のない夜に、それでも心臓は鳴りつづける。',
  /* scene */
  battle:        '剣と剣がぶつかる火花に、運命が照らされる。',
  boss:          '玉座の影が立ち上がり、最後の扉が音を立てて閉じる。',
  town:          '市場のざわめきに、今日もだれかの物語がはじまる。',
  village:       '夕餉の煙がのぼり、畑のむこうで鐘が鳴る。',
  field:         '草の海をわたる風が、旅人の背中を押していく。',
  forest:        '枝葉のすきまから、森のささやきがこぼれてくる。',
  night:         '街灯がひとつ消えて、夜がほんとうの顔を見せる。',
  travel:        '地図の余白に、まだ書かれていない道がのびている。',
  dungeon:       '松明のあかりが、地の底の闇をわずかに削る。',
  ruins:         '崩れた柱のあいだを、千年前の風が通りぬける。',
  cave:          '水滴の音だけが、深い闇の時間を数えている。',
  festival:      '太鼓がひとつ鳴るたび、夜空に花がひらいていく。',
  opening:       '幕があがる。物語はいま、最初のひと息を吸う。',
  ending:        '長い旅の足あとが、夕焼けの中に溶けていく。',
  onsen:         '湯けむりのむこうで、疲れがゆっくりほどけていく。',
  shrine:        '灯がともり、鳥居の奥がしずかに息をする。',
  samurai:       '鞘走りの音が、張りつめた静寂を二つに分ける。',
  snow:          '降りつもる白に、足音までもが眠ってしまう。',
  mansion:       '蝋燭の火がゆれて、肖像画の視線が動いた気がする。',
  morning:       'カーテンのすきまから、生まれたての光がさしこむ。',
  church:        '高い窓から落ちる光に、祈りの声がかさなる。',
  /* style */
  fantasy:       'ページをめくれば、竜の影が雲を横切る。',
  japanese:      '風鈴がひとつ鳴って、遠い社の気配がとどく。',
  celtic:        '緑の丘をわたる笛の音に、妖精たちが耳をすます。',
  medieval:      '石畳の路地に、吟遊詩人の弦がひびく。',
  oriental:      '香の煙がゆれて、絹の道の夢をはこぶ。',
  futuristic:    'ネオンの雨のむこうに、まだ見ぬ朝が点滅する。',
  electronic:    '光の粒がはじけて、夜の回路を駆けぬける。',
  modern:        '街の窓ひとつひとつに、ちいさな物語が灯る。',
  musicbox:      'ねじを巻けば、眠っていた時間がまわりだす。',
  japanese_horror:'障子のむこうの影が、いつのまにかこちらを見ている。',
  western_horror:'古い館の鏡に、いないはずの誰かが映る。',
};

/* ---- three rings — ALL tags from the real TAGS_META --------
   inner = feeling / middle = story / outer = scene + style   */
function _ringAll(cats){
  return cats.flatMap(cat=>(TAGS_META[cat]||[]).map(m=>({
    id:m.id, jp:m.name, en:m.name_en, type:cat, sceneId:TAG_SCENE[m.id]||'fantasy',
    line:TAG_LINES[m.id]||''
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

/* tag counts from the real library */
[...TAGS_INNER, ...TAGS_OUTER].forEach(t=>{ t.count = tracksForTag(t).length; });

window.HMIX = { SCENES, TAGS_INNER, TAGS_OUTER, TAGS_RINGS, tracksForScene, tracksForTag, sceneOfTrack, trackUrl,
  get TRACKS(){ return typeof TRACKS!=='undefined'?TRACKS:[]; } };
