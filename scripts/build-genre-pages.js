/**
 * H/MIX GALLERY 窶・繧ｸ繝｣繝ｳ繝ｫ蛻･繝ｩ繝ｳ繝・ぅ繝ｳ繧ｰ繝壹・繧ｸ閾ｪ蜍慕函謌・ * tracks.js 縺九ｉ莉｣陦ｨ譖ｲ繧呈歓蜃ｺ縺励・撕逧ЗTML 縺ｨ縺励※ /genre/*.html 縺ｫ蜃ｺ蜉・ */
const fs = require('fs');
const path = require('path');

const TRACKS_JS = path.resolve(__dirname, '../assets/js/tracks.js');
const GENRE_DIR = path.resolve(__dirname, '../genre');

// tracks.js 隱ｭ縺ｿ霎ｼ縺ｿ
const content = fs.readFileSync(TRACKS_JS, 'utf8');
const tStart = content.indexOf('[', content.indexOf('const TRACKS'));
let depth = 0, idx = tStart;
for (; idx < content.length; idx++) { if (content[idx] === '[') depth++; if (content[idx] === ']') depth--; if (depth === 0) break; }
const tracks = JSON.parse(content.substring(tStart, idx + 1));
const trackOriginalIndex = new Map(tracks.map((t, i) => [t.id, i]));

// TAGS_META
const mStart = content.indexOf('{', content.indexOf('const TAGS_META'));
depth = 0; idx = mStart;
for (; idx < content.length; idx++) { if (content[idx] === '{') depth++; if (content[idx] === '}') depth--; if (depth === 0) break; }

// 譌ｧ繧ｵ繧､繝医・繧ｸ繝｣繝ｳ繝ｫ/繧､繝｡繝ｼ繧ｸ蛻･繝壹・繧ｸ縺ｫ謗ｲ霈峨＆繧後※縺・◆鬆・ｺ上・
// 譌ｧ繧ｵ繧､繝医↓諷｣繧後◆莠ｺ縺悟酔縺俶─隕壹〒謗｢縺帙ｋ繧医≧縲∽ｻ｣陦ｨ譖ｲ縺ｮ荳ｦ縺ｳ鬆・↓蜿肴丐縺吶ｋ縲・
const LEGACY_GENRE_ORDER = {
  // music_gallery/image/asian.htm
  japanese: ['n103', 'n82', 'n72', 'n97', 'n149', 'n112', 'n76', 'n111', 'n96', 'n39', 'n69', 'n59', 'n61', 'n127', 'n123', 'n74', 'n75', 'n95', 'n46', 'n6', 'n71', 'n57', 'n42', 'n55', 'n56', 'n8', 'm1', 'n23', 'n32', 'n33', 'k4', 'k14', 'n2', 'n15'],
  // music_gallery/image/horror.htm
  horror: ['n129', 'r4', 'n44', 'n98', 'n80', 'n3', 'n9', 'n100', 'n132', 'n137', 'n110', 'k16', 'r7', 'k6', 'v2', 'n105', 'f2', 'n48', 'r2', 'd2', 'd3', 'n30', 'v7', 'k8', 'v3', 'n27', 'r8', 'r9', 'k18', 'v6', 'v1', 'o5', 'n24', 'z44', 'r3', 'n49', 'se1', 'z2', 'z16', 'z17', 'z24', 'z19', 'z20', 'z21', 'z15', 'z13', 'z9', 'z8', 'z5', 'se3', 'z4', 'n1', 'z25', 'z26', 'z27', 'z28', 'z29', 'z30', 'z31', 'z32', 'z33', 'z34', 'z35', 'z36', 'z37', 'z38', 'z39', 'z40', 'z41', 'z42', 'z43', 'z10', 'z22', 'z23', 'z7', 'z11', 'z12', 'z14', 'z6', 'z18', 'z45', 'z46', 'z47', 'z48', 'z49', 'z50'],
  // music_gallery/image/index.htm
  fantasy: ['n51', 'n78', 'n31', 'n58', 'c5', 'n135', 'c7', 'c1', 'o14', 'n23', 'n68', 'n17', 'n91', 'n120', 'c8', 'n47', 'n64', 'n19', 'm1', 'n85', 'n7', 'o11', 'n73', 'f1', 'n54', 'o10'],
  // music_gallery/image/buttle.htm
  battle: ['n144', 'n147', 'n28', 'n36', 'n65', 'n93', 'n136', 'n79', 'n80', 'n137', 'n1', 'n76', 'n20', 'n3', 'n38', 'n15', 'n40', 'n41', 'n32', 'n34', 'n13', 'n2', 'n94', 'n19', 'o4', 'f4', 'n4', 'n74', 'n71', 'n55', 'n56', 'n82'],
  // music_gallery/feeling/cures.htm
  healing: ['n145', 'n123', 'n124', 'n74', 'c2', 'n72', 'n103', 'n118', 'n46', 'c5', 'c7', 'c1', 'n131', 'o14', 'n31', 'c8', 'n58', 'n130', 'n120', 'n122', 'n135', 'c4', 'n115', 'n97', 'n85', 'n77', 'n99', 'n133', 'n134', 'n113', 'n107', 'r1', 'k1', 'n54', 'c29', 'o1', 'c10', 'c23', 'c28', 'n116', 'n39', 'f5', 'n45', 'n84', 'n83', 'n90', 'n33', 'n32', 'n114', 'c6', 'c13', 'n89', 'n75', 'n61', 'n81', 'n23', 'c15', 'n108', 'n47', 'n59', 'o9', 'c11', 'c12', 'n53', 'n7', 'o6', 'k12', 'k2', 'h6', 'n5', 'n60', 'c20', 'c18', 'k20', 'k21', 'v11', 'f1'],
  // music_gallery/feeling/sadness.htm
  sad: ['n145', 'n74', 'n75', 'n95', 'n130', 'n70', 'n135', 'o10', 'o11', 'v2', 'n91', 'n92', 'v9', 'r4', 'n33', 'n32', 'f1', 'r1', 'r12', 'c1', 'c22', 'n60', 'c14', 'c25', 'n16', 'k7', 'k12', 'k17', 'k19', 'c24', 'c26', 'k5', 'v11', 'n14', 'n22'],
  // music_gallery/image/grand.htm
  epic: ['n123', 'n62', 'n32', 'n65', 'n67', 'n10', 'n18', 'n34', 'n103', 'n21', 'n113', 'n51', 'n28', 'n36', 'n56', 'n71', 'n38', 'n11', 'c13', 'n114', 'n99', 'k15', 'c27', 'm2', 'n26', 'c12', 'k1', 'c15', 'k2', 'f5', 'k14'],
  // music_gallery/feeling/happy.htm
  happy: ['n99', 'n104', 'n114', 'o12', 'n25', 'n29', 'n140', 'n141', 'n143', 'c3', 'n119', 'n18', 'd5', 'v5', 'c6', 'n113', 'v4', 'n88', 'n66', 'n109', 'f3', 'o13', 'd1', 'n116', 'd9', 'c12', 'n148', 'n37', 'c2', 'n122', 'n5', 'c30', 'c19', 'o14', 'c13', 'n26', 'n46', 'n62', 'c11', 'm2', 'c17', 'c20', 'c21', 'r6', 'r11', 'k15', 'o9', 'n11', 'n43', 'n67'],
  // music_gallery/feeling/suspense.htm
  suspense: ['n139', 'n3', 'n9', 'z2', 'n55', 'n43', 'n100', 'n94', 'n80', 'n14', 'n87', 'n23', 'k8', 'r8', 'z44', 'r3', 'v3', 'v6', 'se1', 'n44', 'k4', 'z17', 'z24', 'v7', 'o7', 'n13', 'r7', 'z13', 'z9', 'z8', 'z5', 'se3', 'z4', 'z25', 'z27', 'z28', 'z29', 'z30', 'z31', 'z32', 'z33', 'z34', 'z35', 'z36', 'z37', 'z38', 'z39', 'z40', 'z41', 'z42', 'z43', 'z10', 'z23', 'z7', 'z11', 'z12', 'z14', 'z6', 'z18'],
  // music_gallery/image/world.htm
  celtic: ['n51', 'm2', 'n123', 'n124', 'n135', 'n78', 'n136', 'n122', 'n104', 'n25', 'n113', 'c13', 'o12', 'n99', 'n89', 'n21', 'k15', 'c27', 'v4', 'c12', 'n77', 'n47', 'n65', 'n36'],
  // music_gallery/image/future.htm
  electronic: ['n63', 'n139', 'n121', 'n35', 'o11', 'n23', 'n13', 'n80', 'k8', 'n58', 'o7', 'v7', 'n15', 'n14'],
};

function hasAny(track, cat, ids) {
  const values = track[cat] || [];
  return ids.some(id => values.includes(id));
}

const GENRE_FILTERS = {
  japanese: t => hasAny(t, 'style', ['japanese', 'japanese_horror', 'oriental']),
  horror: t => hasAny(t, 'feeling', ['scary']) || hasAny(t, 'style', ['japanese_horror', 'western_horror']),
  fantasy: t => hasAny(t, 'style', ['fantasy']),
  battle: t => hasAny(t, 'scene', ['battle', 'boss']),
  healing: t => hasAny(t, 'feeling', ['gentle']) || hasAny(t, 'story', ['peaceful']),
  sad: t => hasAny(t, 'feeling', ['sad']),
  epic: t => hasAny(t, 'feeling', ['epic']),
  happy: t => hasAny(t, 'feeling', ['happy', 'cute']),
  suspense: t => hasAny(t, 'feeling', ['suspense']),
  celtic: t => hasAny(t, 'style', ['celtic']),
  electronic: t => hasAny(t, 'style', ['electronic', 'futuristic']),
};

const GENRE_QUERY = {
  horror: 'feeling=scary&bg=horror',
};

const GENRE_TAG_WEIGHTS = {
  japanese: [
    { cat: 'style', ids: ['japanese'], weight: 8 },
    { cat: 'style', ids: ['japanese_horror', 'oriental'], weight: 6 },
    { cat: 'scene', ids: ['shrine', 'samurai', 'festival'], weight: 3 },
    { cat: 'feeling', ids: ['epic', 'gentle'], weight: 1 },
  ],
  horror: [
    { cat: 'feeling', ids: ['scary'], weight: 8 },
    { cat: 'style', ids: ['japanese_horror', 'western_horror'], weight: 6 },
    { cat: 'feeling', ids: ['suspense', 'dark'], weight: 2 },
    { cat: 'scene', ids: ['dungeon', 'cave', 'night'], weight: 1 },
  ],
  fantasy: [
    { cat: 'style', ids: ['fantasy'], weight: 8 },
    { cat: 'style', ids: ['celtic', 'medieval'], weight: 3 },
    { cat: 'scene', ids: ['field', 'forest', 'dungeon', 'ruins', 'village'], weight: 2 },
    { cat: 'feeling', ids: ['epic', 'mysterious', 'gentle'], weight: 1 },
  ],
  battle: [
    { cat: 'scene', ids: ['battle', 'boss'], weight: 8 },
    { cat: 'feeling', ids: ['epic', 'suspense'], weight: 3 },
    { cat: 'style', ids: ['japanese', 'fantasy'], weight: 1 },
  ],
  healing: [
    { cat: 'feeling', ids: ['gentle'], weight: 8 },
    { cat: 'story', ids: ['peaceful', 'memory', 'dream'], weight: 3 },
    { cat: 'scene', ids: ['forest', 'field', 'village', 'night'], weight: 1 },
  ],
  sad: [
    { cat: 'feeling', ids: ['sad'], weight: 8 },
    { cat: 'story', ids: ['farewell', 'memory', 'defeat'], weight: 3 },
    { cat: 'feeling', ids: ['gentle', 'dark'], weight: 1 },
  ],
  epic: [
    { cat: 'feeling', ids: ['epic'], weight: 8 },
    { cat: 'scene', ids: ['battle', 'boss', 'opening'], weight: 3 },
    { cat: 'style', ids: ['fantasy', 'japanese', 'celtic'], weight: 1 },
  ],
  happy: [
    { cat: 'feeling', ids: ['happy', 'cute'], weight: 8 },
    { cat: 'scene', ids: ['festival', 'town', 'village'], weight: 2 },
    { cat: 'story', ids: ['peaceful', 'victory'], weight: 1 },
  ],
  suspense: [
    { cat: 'feeling', ids: ['suspense'], weight: 8 },
    { cat: 'feeling', ids: ['dark', 'scary'], weight: 3 },
    { cat: 'scene', ids: ['dungeon', 'cave', 'night'], weight: 1 },
  ],
  celtic: [
    { cat: 'style', ids: ['celtic'], weight: 8 },
    { cat: 'style', ids: ['fantasy', 'medieval'], weight: 2 },
    { cat: 'scene', ids: ['field', 'forest', 'travel'], weight: 1 },
  ],
  electronic: [
    { cat: 'style', ids: ['electronic', 'futuristic'], weight: 8 },
    { cat: 'feeling', ids: ['suspense', 'dark'], weight: 2 },
    { cat: 'scene', ids: ['night'], weight: 1 },
  ],
};

function getGenreTracks(genre) {
  const filter = GENRE_FILTERS[genre.slug] || (t => hasAny(t, genre.cat, [genre.tag]));
  return tracks.filter(t => filter(t) && t.durationSec);
}

function genreTagScore(slug, track) {
  return (GENRE_TAG_WEIGHTS[slug] || []).reduce((score, rule) => (
    hasAny(track, rule.cat, rule.ids) ? score + rule.weight : score
  ), 0);
}

function sortByLegacyGenre(slug, list) {
  const order = LEGACY_GENRE_ORDER[slug] || [];
  const orderIndex = new Map(order.map((id, i) => [id, i]));
  return list.slice().sort((a, b) => {
    const aLegacy = orderIndex.has(a.id);
    const bLegacy = orderIndex.has(b.id);
    const legacyBaseA = aLegacy ? orderIndex.get(a.id) * 12 : order.length * 12 + ((trackOriginalIndex.get(a.id) || 0) / 20);
    const legacyBaseB = bLegacy ? orderIndex.get(b.id) * 12 : order.length * 12 + ((trackOriginalIndex.get(b.id) || 0) / 20);
    const ai = legacyBaseA - genreTagScore(slug, a) * 4;
    const bi = legacyBaseB - genreTagScore(slug, b) * 4;
    if (ai !== bi) return ai - bi;
    return (trackOriginalIndex.get(a.id) || 0) - (trackOriginalIndex.get(b.id) || 0);
  });
}

// 笏笏 繧ｸ繝｣繝ｳ繝ｫ螳夂ｾｩ 笏笏
const GENRES = [
  { slug: 'japanese', tag: 'japanese', cat: 'style', title: '和風BGM フリー素材', titleEn: 'Japanese BGM - Free Music', metaDesc: '和風・神社・侍・祭りなどのシーンに合うフリーBGM素材集。三味線や尺八を使った和楽器BGMから幻想的な和風ファンタジーまで、YouTube・ゲーム・映像制作に無料で利用できます。', intro: '琴・三味線・尺八・太鼓など和楽器を用いた和風BGMを集めました。神社仏閣の静かな空気、侍の生き様、祭りの賑わい、時代劇の緊張感など、日本的な風景に寄り添う音楽です。', useCases: ['時代劇・歴史ドラマ', '和風ゲーム', '神社・寺院の映像', '日本文化紹介動画', '祭り・伝統行事'], relatedGenres: [{ slug: 'fantasy', label: 'ファンタジーBGM' }, { slug: 'healing', label: '癒しBGM' }, { slug: 'battle', label: '戦闘BGM' }] },
  { slug: 'horror', tag: 'horror', cat: 'feeling', title: 'ホラーBGM フリー素材', titleEn: 'Horror BGM - Free Music', metaDesc: 'ホラー・お化け屋敷・怪談・ダークファンタジー向けのフリーBGM素材集。恐怖や不安、緊張感を演出する音楽を無料で利用できます。', intro: '背筋が冷たくなるような恐怖、不安、暗い幻想を描くBGMを集めました。怪談、ホラーゲーム、サスペンス映像、不穏な演出に向いた音楽です。', useCases: ['ホラーゲーム', '怪談動画', 'お化け屋敷', 'ダークファンタジー', '不穏な演出'], relatedGenres: [{ slug: 'suspense', label: 'サスペンスBGM' }, { slug: 'fantasy', label: 'ファンタジーBGM' }, { slug: 'battle', label: '戦闘BGM' }] },
  { slug: 'fantasy', tag: 'fantasy', cat: 'style', title: 'ファンタジーBGM フリー素材', titleEn: 'Fantasy BGM - Free Music', metaDesc: 'ファンタジー・RPG・冒険向けのフリーBGM素材集。神秘的で幻想的な音楽からオーケストラの壮大な曲まで、YouTube・ゲーム・映像制作に無料で利用できます。', intro: '異世界の冒険、魔法の森、古代遺跡、天空の城。ファンタジーの世界を彩るBGMを集めました。RPGのフィールド、物語動画、配信BGMなどにおすすめです。', useCases: ['RPG・冒険ゲーム', 'ファンタジー映像', '異世界アニメ', 'TRPG配信', '物語動画'], relatedGenres: [{ slug: 'battle', label: '戦闘BGM' }, { slug: 'healing', label: '癒しBGM' }, { slug: 'epic', label: '壮大なBGM' }] },
  { slug: 'battle', tag: 'battle', cat: 'scene', title: '戦闘BGM フリー素材', titleEn: 'Battle BGM - Free Music', metaDesc: '戦闘・バトルシーン向けのフリーBGM素材集。ボス戦、通常戦闘、追跡など激しいシーンを盛り上げる音楽を無料で利用できます。', intro: '剣戟、炎、迫る強敵、決意の一撃。戦闘シーンを熱くするBGMを集めました。RPG、アクションゲーム、映像作品のバトル演出におすすめです。', useCases: ['ゲーム戦闘シーン', 'ボス戦', 'アクション映像', 'バトルアニメ', 'PV・トレーラー'], relatedGenres: [{ slug: 'epic', label: '壮大なBGM' }, { slug: 'fantasy', label: 'ファンタジーBGM' }, { slug: 'japanese', label: '和風BGM' }] },
  { slug: 'healing', tag: 'healing', cat: 'feeling', title: '癒しBGM フリー素材', titleEn: 'Healing BGM - Free Music', metaDesc: '癒し・穏やか・リラックスしたシーンに合うフリーBGM素材集。ピアノ、ストリングス、アコースティック曲を中心に、YouTube動画・ゲーム・映像制作に無料で利用できます。', intro: '木漏れ日の中で聴こえてくるような、優しく穏やかなBGMを集めました。作業用BGM、睡眠導入、リラクゼーション映像、ヒーリング動画に最適です。', useCases: ['作業用BGM', '睡眠導入・瞑想', 'Vlog・日常動画', 'リラクゼーション映像', '優しいゲームBGM'], relatedGenres: [{ slug: 'sad', label: '悲しいBGM・切ないBGM' }, { slug: 'happy', label: '楽しいBGM・明るいBGM' }, { slug: 'fantasy', label: 'ファンタジーBGM' }] },
  { slug: 'sad', tag: 'sadness', cat: 'feeling', title: '悲しいBGM・切ないBGM フリー素材', titleEn: 'Sad BGM - Free Music', metaDesc: '悲しい場面、別れ、回想、感動シーンに合う切ないフリーBGM素材集。ピアノやストリングスを中心に、映像制作・YouTube・ゲームに無料で使えます。', intro: '別れ、喪失、静かな回想、胸の奥に残る余韻。悲しい場面や切ない物語に寄り添うBGMを集めました。', useCases: ['別れのシーン', '回想・追憶', '感動動画', 'ノベルゲーム', '静かなエンディング'], relatedGenres: [{ slug: 'healing', label: '癒しBGM' }, { slug: 'suspense', label: 'サスペンスBGM' }, { slug: 'fantasy', label: 'ファンタジーBGM' }] },
  { slug: 'epic', tag: 'epic', cat: 'feeling', title: '壮大なBGM・勇壮なBGM フリー素材', titleEn: 'Epic BGM - Free Music', metaDesc: '壮大・勇壮・感動的なシーンに合うフリーBGM素材集。オーケストラ、ファンタジー、クライマックス向け音楽を無料で利用できます。', intro: '大きな運命が動き出す瞬間、旅の果てにたどり着く景色、勝利と決意が重なるクライマックス。壮大で勇壮なBGMを集めました。', useCases: ['RPGクライマックス', 'トレーラー映像', '勝利・決意の場面', '壮大なオープニング', '感動エンディング'], relatedGenres: [{ slug: 'battle', label: '戦闘BGM' }, { slug: 'fantasy', label: 'ファンタジーBGM' }, { slug: 'japanese', label: '和風BGM' }] },
  { slug: 'happy', tag: 'happy', cat: 'feeling', title: '楽しいBGM・明るいBGM フリー素材', titleEn: 'Happy BGM - Free Music', metaDesc: '楽しい・明るい・かわいいシーンに合うフリーBGM素材集。日常動画、子ども向け作品、ゲーム、YouTubeに無料で使える軽快な音楽を掲載。', intro: '明るい日常、楽しい会話、かわいいキャラクター、軽やかなイベントシーンに合うBGMを集めました。', useCases: ['Vlog・日常動画', '子ども向け作品', 'カジュアルゲーム', 'イベント紹介', '明るい解説動画'], relatedGenres: [{ slug: 'healing', label: '癒しBGM' }, { slug: 'fantasy', label: 'ファンタジーBGM' }, { slug: 'electronic', label: '近未来BGM' }] },
  { slug: 'suspense', tag: 'suspense', cat: 'feeling', title: 'サスペンスBGM・緊迫感BGM フリー素材', titleEn: 'Suspense BGM - Free Music', metaDesc: '緊張感・不安・謎解き・ミステリー演出に合うフリーBGM素材集。YouTube、ゲーム、ホラー、サスペンス映像に無料で利用できます。', intro: '張りつめた空気、迫る危機、謎が深まる場面。サスペンスやミステリー演出に合う緊迫感のあるBGMを集めました。', useCases: ['推理・謎解き', 'ホラー動画', '緊迫したゲーム場面', '事件解説', '不穏な演出'], relatedGenres: [{ slug: 'horror', label: 'ホラーBGM' }, { slug: 'sad', label: '悲しいBGM' }, { slug: 'battle', label: '戦闘BGM' }] },
  { slug: 'celtic', tag: 'celtic', cat: 'style', title: 'ケルト風BGM・北欧風BGM フリー素材', titleEn: 'Celtic BGM - Free Music', metaDesc: 'ケルト風・北欧風・民族音楽系のフリーBGM素材集。ファンタジー、旅、村、自然、RPG向けの音楽をYouTube・ゲーム・映像制作に無料で利用できます。', intro: '草原を渡る風、古い村の祭り、旅人の足取り、北の森に残る伝承。ケルト風・北欧風の響きを持つBGMを集めました。', useCases: ['RPGの村・フィールド', '旅動画', 'ファンタジー作品', '自然映像', '民族調の演出'], relatedGenres: [{ slug: 'fantasy', label: 'ファンタジーBGM' }, { slug: 'healing', label: '癒しBGM' }, { slug: 'japanese', label: '和風BGM' }] },
  { slug: 'electronic', tag: 'electronic', cat: 'style', title: '近未来BGM・電子音BGM フリー素材', titleEn: 'Electronic BGM - Free Music', metaDesc: '近未来・電子音・SF・サイバーな演出に合うフリーBGM素材集。ゲーム、映像制作、YouTube、テクノロジー系コンテンツに無料で利用できます。', intro: '未来都市の光、電子回路の鼓動、静かに進むテクノロジーの気配。近未来・電子音系のBGMを集めました。', useCases: ['SF・近未来映像', 'ゲームUI', 'テクノロジー紹介', 'サイバー演出', '電子音系BGM'], relatedGenres: [{ slug: 'suspense', label: 'サスペンスBGM' }, { slug: 'happy', label: '明るいBGM' }, { slug: 'battle', label: '戦闘BGM' }] },
];
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 笏笏 蜷・ず繝｣繝ｳ繝ｫ繝壹・繧ｸ逕滓・ 笏笏
for (const g of GENRES) {
  const matched = getGenreTracks(g);
  const genreTracks = sortByLegacyGenre(g.slug, matched);
  const filterQuery = GENRE_QUERY[g.slug] || `${g.cat}=${g.tag}`;

  // JSON-LD: MusicPlaylist
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: g.title,
    description: g.metaDesc,
    url: `https://www.hmix.net/genre/${g.slug}.html`,
    numTracks: matched.length,
    track: genreTracks.map((t, i) => ({
      '@type': 'MusicRecording',
      position: i + 1,
      name: t.title,
      url: `https://www.hmix.net/music/${t.id}.html`,
      duration: t.duration ? `PT${t.duration.replace(':', 'M')}S` : undefined,
      byArtist: { '@type': 'Person', name: '遘句ｱｱ陬募柱' },
    })),
  };

  const trackListHtml = genreTracks.map(t =>
    `          <li class="genre-track">
            <a href="/music/${t.id}.html" class="genre-track__link">
              <span class="genre-track__title">${esc(t.title)}</span>
              <span class="genre-track__title-en">${esc(t.title_en || '')}</span>
              <span class="genre-track__duration">${esc(t.duration || '')}</span>
            </a>
            <button type="button" class="genre-track__fav" data-track-id="${esc(t.id)}" data-track-title="${esc(t.title)}" aria-label="${esc(t.title)}繧偵♀豌励↓蜈･繧翫↓霑ｽ蜉" aria-pressed="false">
              <span class="genre-track__fav-off" aria-hidden="true">笙｡</span>
              <span class="genre-track__fav-on" aria-hidden="true">笙･</span>
            </button>
          </li>`
  ).join('\n');

  const relatedHtml = g.relatedGenres.map(r =>
    `        <a href="/genre/${r.slug}.html" class="genre-related__link">${esc(r.label)}</a>`
  ).join('\n');

  const useCaseHtml = g.useCases.map(u =>
    `          <li>${esc(u)}</li>`
  ).join('\n');

  const genreSideNavHtml = GENRES.map(item => {
    const sideTitle = item.title.replace(' フリー素材', '').replace('・切ないBGM', '').replace('・勇壮なBGM', '').replace('・明るいBGM', '').replace('・緊迫感BGM', '').replace('・北欧風BGM', '').replace('・電子音BGM', '');
    return `            <li><a href="/genre/${item.slug}.html"${item.slug === g.slug ? ' aria-current="page"' : ''}>${esc(sideTitle)}</a></li>`;
  }).join('\n');

  const playerHtml = `<div id="global-player" class="player" aria-label="髻ｳ讌ｽ繝励Ξ繧､繝､繝ｼ">
  <div class="player-bg"></div>
  <div class="player-glow"></div>
  <div class="player-pattern"></div>
  <div class="player-inner">
    <div class="player-left">
      <div class="track-title" id="player-track-title">窶・譖ｲ繧帝∈繧薙〒蜀咲函 窶・/div>
      <div class="track-tags" id="player-track-tags"></div>
    </div>
    <div class="player-center">
      <div class="player-controls">
        <button class="btn-prev" id="player-btn-prev" aria-label="蜑阪・譖ｲ"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg></button>
        <button class="btn-play" id="player-btn-play" aria-label="蜀咲函">
          <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg>
          <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" width="22" height="22" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </button>
        <button class="btn-next" id="player-btn-next" aria-label="谺｡縺ｮ譖ｲ"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 6v12l8.5-6zm8 0h2v12h-2z"/></svg></button>
      </div>
      <div class="seekbar" id="player-seekbar">
        <div class="seek-progress" id="player-seek-progress"></div>
        <div class="seek-thumb" id="player-seek-thumb"></div>
      </div>
      <div class="time" id="player-time">0:00 / 0:00</div>
    </div>
    <div class="player-right">
      <button class="btn-fav" id="player-btn-fav" aria-label="縺頑ｰ励↓蜈･繧翫↓霑ｽ蜉" aria-pressed="false">
        <svg class="icon-heart-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <svg class="icon-heart-on" viewBox="0 0 24 24" fill="currentColor" width="15" height="15" style="display:none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
      <button class="fav-list-btn" id="fav-modal-trigger" title="菫晏ｭ倥Μ繧ｹ繝医ｒ髢九￥" aria-label="菫晏ｭ倥＠縺滓峇縺ｮ荳隕ｧ繧帝幕縺・>
        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z"/></svg>
        <span class="fav-list-btn__label" data-ja="菫晏ｭ倥Μ繧ｹ繝・ data-en="Saved">菫晏ｭ倥Μ繧ｹ繝・/span><span class="fav-list-btn__count">・・span id="player-fav-count">0</span>・・/span>
      </button>
      <button class="btn-repeat" id="player-btn-repeat" aria-label="繝ｪ繝斐・繝・ data-mode="none"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg></button>
      <button class="btn-shuffle" id="player-btn-shuffle" aria-label="繧ｷ繝｣繝・ヵ繝ｫ" data-active="false"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg></button>
      <a class="player-action-btn" id="player-btn-dl" download aria-label="繝繧ｦ繝ｳ繝ｭ繝ｼ繝・ style="opacity:0.3;pointer-events:none;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </a>
      <a class="player-action-btn" id="player-btn-detail" aria-label="隧ｳ邏ｰ繝壹・繧ｸ" style="opacity:0.3;pointer-events:none;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
      <div class="volume-wrap">
        <svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
        <input type="range" class="volume" id="player-volume" min="0" max="100" value="80" aria-label="髻ｳ驥・>
      </div>
    </div>
  </div>
</div>`;

  const favModalHtml = `<div id="fav-modal" class="fav-modal" role="dialog" aria-modal="true" aria-labelledby="fav-modal-heading" hidden>
  <div class="fav-modal__backdrop" id="fav-modal-backdrop"></div>
  <div class="fav-modal__panel">
    <div class="fav-modal__header">
      <h2 class="fav-modal__title" id="fav-modal-heading">
        <span data-ja="菫晏ｭ倥＠縺滓峇" data-en="Saved tracks">菫晏ｭ倥＠縺滓峇</span>
        <span class="fav-modal__total" id="fav-modal-total">0譖ｲ</span>
      </h2>
      <button class="fav-modal__close" id="fav-modal-close" aria-label="髢峨§繧・>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="18" height="18"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="fav-modal__body">
      <ul class="fav-modal__list" id="fav-modal-list" aria-label="縺頑ｰ励↓蜈･繧翫・譖ｲ荳隕ｧ"></ul>
      <p class="fav-modal__empty" id="fav-modal-empty" hidden>
        <span data-ja="縺ｾ縺菫晏ｭ倥＠縺滓峇縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・ data-en="No saved tracks yet.">縺ｾ縺菫晏ｭ倥＠縺滓峇縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・/span><br>
        <span data-ja="笙｡ 繧呈款縺励※譌・・險倬鹸繧呈ｮ九＠縺ｾ縺励ｇ縺・・ data-en="Press 笙｡ to save tracks you love.">笙｡ 繧呈款縺励※譌・・險倬鹸繧呈ｮ九＠縺ｾ縺励ｇ縺・・/span>
      </p>
    </div>
    <div class="fav-modal__footer" id="fav-modal-footer" hidden>
      <div class="fav-modal__footer-play">
        <button type="button" class="fav-modal__play-all" id="fav-modal-play-all" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5v14l11-7z"/></svg>
          <span data-ja="蜀咲函" data-en="Play all">蜀咲函</span>
        </button>
        <button type="button" class="fav-modal__shuffle-all" id="fav-modal-shuffle-all" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          <span data-ja="繧ｷ繝｣繝・ヵ繝ｫ" data-en="Shuffle">繧ｷ繝｣繝・ヵ繝ｫ</span>
        </button>
        <button type="button" class="fav-modal__play-theater" id="fav-modal-play-theater" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M4 4h16v16H4z"/></svg>
          <span data-ja="繧ｷ繧｢繧ｿ繝ｼ豐｡蜈･蜀咲函" data-en="Theater mode">繧ｷ繧｢繧ｿ繝ｼ豐｡蜈･蜀咲函</span>
        </button>
        <button type="button" class="fav-modal__dl-all" id="fav-modal-dl-all" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          <span data-ja="縺ｾ縺ｨ繧√※DL" data-en="Download all">縺ｾ縺ｨ繧√※DL</span>
        </button>
      </div>
      <button type="button" class="fav-modal__clear" id="fav-modal-clear" data-ja="縺吶∋縺ｦ蜑企勁" data-en="Clear all">縺吶∋縺ｦ蜑企勁</button>
    </div>
  </div>
</div>`;

  const clickPlayScript = `<script>
(function () {
  'use strict';
  if (window.HMIX_GENRE_CLICK_PLAY_BOUND) return;
  window.HMIX_GENRE_CLICK_PLAY_BOUND = true;
  var FAV_KEY = 'hmix_favorites';

  function getTrackId(link) {
    try {
      var url = new URL(link.getAttribute('href'), window.location.href);
      var match = url.pathname.match(/\\/music\\/([^\\/.?#]+)\\.html$/);
      return match ? match[1] : '';
    } catch (e) {
      return '';
    }
  }

  function waitForGenrePlayer() {
    return new Promise(function (resolve) {
      var tries = 0;
      (function check() {
        if (window.HMIX_PLAYER && typeof window.HMIX_PLAYER.playTrackById === 'function') {
          resolve(window.HMIX_PLAYER);
          return;
        }
        tries += 1;
        if (tries >= 30) {
          resolve(null);
          return;
        }
        setTimeout(check, 50);
      })();
    });
  }

  document.addEventListener('click', async function (event) {
    var link = event.target && event.target.closest ? event.target.closest('.genre-track__link[href]') : null;
    if (!link) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== '_self') return;

    var trackId = getTrackId(link);
    if (!trackId) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();

    try {
      if (typeof window.loadTracks === 'function') {
        await window.loadTracks();
      }
      var player = await waitForGenrePlayer();
      if (player) {
        player.playTrackById(trackId);
        return;
      }
    } catch (e) {
      console.warn('[GENRE] click-to-play failed', e);
    }
  }, true);

  function getFavSet() {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]').map(String)); }
    catch (e) { return new Set(); }
  }

  function saveFavSet(set) {
    try {
      var ids = Array.from(set);
      localStorage.setItem(FAV_KEY, JSON.stringify(ids));
      window.dispatchEvent(new CustomEvent('favorites:updated', { detail: { count: set.size, ids: ids } }));
    } catch (e) {}
  }

  function syncFavButtons() {
    var favs = getFavSet();
    document.querySelectorAll('.genre-track__fav[data-track-id]').forEach(function (button) {
      var id = String(button.getAttribute('data-track-id') || '');
      var title = String(button.getAttribute('data-track-title') || '縺薙・譖ｲ');
      var isFav = favs.has(id);
      button.classList.toggle('is-fav', isFav);
      button.setAttribute('aria-pressed', String(isFav));
      button.setAttribute('aria-label', title + (isFav ? '繧偵♀豌励↓蜈･繧翫°繧牙炎髯､' : '繧偵♀豌励↓蜈･繧翫↓霑ｽ蜉'));
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('.genre-track__fav[data-track-id]') : null;
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    var id = String(button.getAttribute('data-track-id') || '');
    if (!id) return;
    var favs = getFavSet();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    saveFavSet(favs);
    syncFavButtons();
  }, true);

  syncFavButtons();
  window.addEventListener('favorites:updated', syncFavButtons);
})();
</script>`;

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XV5T8CSJTJ"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XV5T8CSJTJ');
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(g.title)}・懃┌譁吶ム繧ｦ繝ｳ繝ｭ繝ｼ繝・窶・H/MIX GALLERY</title>
  <meta name="description" content="${esc(g.metaDesc)}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${esc(g.title)} 窶・H/MIX GALLERY">
  <meta property="og:description" content="${esc(g.metaDesc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.hmix.net/genre/${g.slug}.html">
  <meta property="og:site_name" content="H/MIX GALLERY">
  <meta property="og:image" content="https://www.hmix.net/assets/images/scenes/${g.tag === 'gentle' ? 'field' : g.slug === 'battle' ? 'boss' : g.tag}.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(g.title)} 窶・H/MIX GALLERY">
  <meta name="twitter:description" content="${esc(g.metaDesc)}">
  <link rel="canonical" href="https://www.hmix.net/genre/${g.slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;700&family=Cinzel:wght@400;600&family=Noto+Sans+JP:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css?v=20260602-navsync">
  <link rel="stylesheet" href="/assets/css/music-library.css">
  <link rel="stylesheet" href="/assets/css/music-library-dark.css">
  <link rel="stylesheet" href="/assets/css/player.css">
  <link rel="stylesheet" href="/assets/css/player-panel.css?v=20260531-video46">
  <link rel="stylesheet" href="/assets/css/fav-modal.css?v=20260331-7">
  <link rel="stylesheet" href="/assets/css/genre-page.css?v=20260602-vinevideo">
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>
<body class="library-page library-page--dark genre-route-page">

<header class="site-header" id="site-header">
  <div class="header-inner">
    <a href="/" class="site-logo" aria-label="H/MIX GALLERY 繝帙・繝">
      <span class="logo-text">H/MIX GALLERY</span>
      <span class="logo-sub">Free Music Library</span>
    </a>
    <nav class="site-nav" aria-label="繝｡繧､繝ｳ繝翫ン繧ｲ繝ｼ繧ｷ繝ｧ繝ｳ">
      <ul class="nav-list">
        <li><a href="/" class="nav-link">Home</a></li>
        <li class="nav-item nav-item--dropdown">
          <a href="/music-library.html" class="nav-link">髻ｳ讌ｽ邏譚・/a>
          <ul class="nav-submenu" aria-label="髻ｳ讌ｽ邏譚舌Γ繝九Η繝ｼ">
            <li><a href="/music-library.html" class="nav-submenu__link">髻ｳ讌ｽ蝗ｳ譖ｸ鬢ｨ縺ｧ謗｢縺・/a></li>
            <li><a href="/music_gallery/music_top.htm" class="nav-submenu__link nav-submenu__link--active">譌ｧ繧ｵ繧､繝磯｢ｨ縺ｫ謗｢縺・/a></li>
          </ul>
        </li>
        <li><a href="/theater/" class="nav-link nav-link--theater" data-ja="髻ｳ縺ｮ蜉・ｴ" data-en="Theater">髻ｳ縺ｮ蜉・ｴ</a></li>
        <li><a href="/terms.html" class="nav-link">蛻ｩ逕ｨ隕冗ｴ・/a></li>
        <li><a href="/composer.html" class="nav-link">Composer</a></li>
        <li><a href="/contact.html" class="nav-link nav-link--cta">Contact</a></li>
      </ul>
      <button id="ml-lang-toggle" class="nav-lang-toggle" aria-label="Switch language"><svg class="lang-globe" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" width="11" height="11"><circle cx="6" cy="6" r="5.3"/><path d="M1.5 4.5h9M1.5 7.5h9M6 0.7C4.3 2.5 3.5 4.2 3.5 6s.8 3.5 2.5 5.3M6 0.7C7.7 2.5 8.5 4.2 8.5 6s-.8 3.5-2.5 5.3"/></svg><span class="lang-opt lang-opt--active">JP</span><span class="lang-sep"> / </span><span class="lang-opt">EN</span></button>
      <button class="nav-toggle" aria-label="繝｡繝九Η繝ｼ繧帝幕縺・ aria-expanded="false"><span></span><span></span><span></span></button>
    </nav>
  </div>
</header>

<div id="page-content" data-page-type="genre">
  <main class="genre-page">

    <!-- 繝代Φ縺上★ -->
    <nav class="genre-breadcrumb" aria-label="繝代Φ縺上★">
      <a href="/">繝帙・繝</a> <span class="genre-breadcrumb__sep">窶ｺ</span>
      <a href="/music_gallery/music_top.htm">髻ｳ讌ｽ邏譚慎OP</a> <span class="genre-breadcrumb__sep">窶ｺ</span>
      <span>${esc(g.title)}</span>
    </nav>

    <!-- 繝偵・繝ｭ繝ｼ -->
    <section class="genre-hero">
      <h1 class="genre-hero__title">${esc(g.title)}</h1>
      <p class="genre-hero__subtitle">${esc(g.titleEn)}</p>
      <p class="genre-hero__count">${matched.length}譖ｲ縺ｮ繝輔Μ繝ｼBGM</p>
    </section>

    <div class="genre-three-column">
      <aside class="genre-side genre-side--left" aria-label="譌ｧ繧ｵ繧､繝磯｢ｨ繧ｫ繝・ざ繝ｪ繝｡繝九Η繝ｼ">
        <section class="genre-side-box">
          <h2>繧ｫ繝・ざ繝ｪ蛻･</h2>
          <ul>
${genreSideNavHtml}
          </ul>
        </section>
        <section class="genre-side-box">
          <h2>譌ｧ繧ｵ繧､繝亥ｰ守ｷ・/h2>
          <ul>
            <li><a href="/music_gallery/music_top.htm">髻ｳ讌ｽ邏譚慎OP</a></li>
            <li><a href="/music-library.html">鬮俶ｩ溯・讀懃ｴ｢</a></li>
            <li><a href="/theater/">髻ｳ縺ｮ蜉・ｴ</a></li>
            <li><a href="/terms.html">蛻ｩ逕ｨ隕冗ｴ・/a></li>
          </ul>
        </section>
        <section class="genre-side-box">
          <h2>迴ｾ陦後し繧､繝・/h2>
          <ul>
            <li><a href="/music-library.html">髻ｳ讌ｽ蝗ｳ譖ｸ鬢ｨ</a></li>
            <li><a href="/theater/">髻ｳ縺ｮ蜉・ｴ</a></li>
            <li><a href="/terms.html">蛻ｩ逕ｨ隕冗ｴ・/a></li>
            <li><a href="/professional-license.html">蝠・畑蛻ｩ逕ｨ</a></li>
            <li><a href="/composer.html">Composer</a></li>
          </ul>
        </section>
      </aside>

      <div class="genre-main-column">
        <div class="genre-legacy-notice">
          <strong>旧サイト風に探す</strong>
          カテゴリを一覧で眺めながら、気になる曲をその場で再生できます。曲名は通常クリックで下部プレイヤーに読み込まれます。詳細ページへのURLは、SEOと新規タブ表示用として保持しています。
        </div>

        <!-- 隱ｬ譏取枚 -->
        <section class="genre-intro">
          <p>${esc(g.intro)}</p>
        </section>

        <!-- 讌ｽ譖ｲ荳隕ｧ・磯撕逧ЗTML・・-->
        <section class="genre-tracks">
          <h2 class="genre-section-title">讌ｽ譖ｲ荳隕ｧ</h2>
          <ul class="genre-track-list">
${trackListHtml}
          </ul>
          <div class="genre-cta">
            <a href="/music-library.html?${filterQuery}" class="genre-cta__btn">
              蜈ｨ${matched.length}譖ｲ繧・Music Library 縺ｧ謗｢縺・竊・            </a>
          </div>
        </section>

        <!-- 縺薙ｓ縺ｪ逕ｨ騾斐↓ -->
        <section class="genre-usecases">
          <h2 class="genre-section-title">縺薙ｓ縺ｪ逕ｨ騾斐↓</h2>
          <ul class="genre-usecase-list">
${useCaseHtml}
          </ul>
        </section>

        <!-- 髢｢騾｣繧ｸ繝｣繝ｳ繝ｫ -->
        <section class="genre-related">
          <h2 class="genre-section-title">莉悶・繧ｸ繝｣繝ｳ繝ｫ繧よ爾縺・/h2>
          <div class="genre-related__links">
${relatedHtml}
          </div>
        </section>
      </div>

      <aside class="genre-side genre-side--right" aria-label="H/MIX GALLERY縺ｮ譁ｰ縺励＞蟆守ｷ・>
        <a class="genre-youtube-banner" href="https://www.youtube.com/channel/UCNPMwbX6-SclEmvFX5_ihCw" target="_blank" rel="noopener noreferrer">
          <img src="/img/youtube.jpg" width="170" height="105" alt="H/MIX GALLERY on YouTube">
        </a>
        <a class="genre-side-promo" href="https://www.hmix.net/theater/night-breeze/index-v3.html" style="--promo-img: url('/assets/images/promos/night-breeze-banner-324x640.png')" aria-label="螟憺｢ｨ縺ｮ繧ｷ繧｢繧ｿ繝ｼ繧帝幕縺・>
          <span class="genre-side-promo__body">
            <span class="genre-side-promo__kicker">諠・勹縺ｧ謗｢縺・/span>
            <strong>螟憺｢ｨ縺ｫ蜷医≧BGM</strong>
            <span>髱吶°縺ｪ螟懊∵怦蜈峨∝ｰ代＠縺縺台ｸ肴晁ｭｰ縺ｪ菴咎渊縲・/span>
          </span>
        </a>
        <a class="genre-side-promo" href="https://www.hmix.net/theater/index.html" style="--promo-img: url('/assets/images/promos/traveling-girl-banner-324x640.png')" aria-label="髻ｳ縺ｮ蜉・ｴ繧帝幕縺・>
          <span class="genre-side-promo__body">
            <span class="genre-side-promo__kicker">迚ｩ隱槭〒謗｢縺・/span>
            <strong>譌・☆繧句ｰ大･ｳ縺ｮ髻ｳ讌ｽ</strong>
            <span>闕牙次縲∬｡鈴％縲∝・莨壹＞縲ょｴ髱｢縺ｮ豁ｩ蟷・〒驕ｸ縺ｶ縲・/span>
          </span>
        </a>
        <div class="genre-x-timeline">
          <a class="twitter-timeline genre-x-timeline__fallback" data-height="360" data-chrome="nofooter noborders transparent" href="https://twitter.com/hmix_net?ref_src=twsrc%5Etfw">@hmix_net 縺九ｉ縺ｮ繝昴せ繝・/a>
        </div>
      </aside>
    </div>

  </main>
</div>

<footer class="site-footer">
  <div class="site-footer__inner">
    <div class="site-footer__intro">
      <p class="site-footer__logo">H/MIX GALLERY</p>
      <p class="site-footer__tagline">髻ｳ讌ｽ縺ｮ蠢・ｱ｡鬚ｨ譎ｯ繧呈羅縺吶ｋ縲・/p>
      <p class="site-footer__desc">迚ｩ隱槭・繧ｲ繝ｼ繝繝ｻ譏蜒上・縺溘ａ縺ｮ辟｡譁傳GM繝ｩ繧､繝悶Λ繝ｪ縲・/p>
    </div>
    <nav class="site-footer__nav" aria-label="繝輔ャ繧ｿ繝ｼ繝翫ン繧ｲ繝ｼ繧ｷ繝ｧ繝ｳ">
      <div class="site-footer__nav-group">
        <h4 class="site-footer__nav-heading">Info</h4>
        <ul class="site-footer__nav-list">
          <li><a href="/terms.html">縺泌茜逕ｨ隕冗ｴ・/a></li>
          <li><a href="/composer.html">Composer</a></li>
          <li><a href="/contact.html">縺雁撫縺・粋繧上○</a></li>
          <li><a href="/privacy.html">繝励Λ繧､繝舌す繝ｼ繝昴Μ繧ｷ繝ｼ</a></li>
        </ul>
      </div>
    </nav>
    <div class="site-footer__bottom">
      <p>&copy; H/MIX GALLERY All Rights Reserved.</p>
      <p>Composed by 遘句ｱｱ陬募柱.</p>
    </div>
  </div>
</footer>

${playerHtml}

${favModalHtml}

<script src="/assets/js/tracks-loader.js?v=3"></script>
<script src="/assets/js/player.js?v=20260526-video44"></script>
<script src="/assets/js/fav-modal.js?v=20260516-1"></script>
<script src="/assets/js/app.js?v=20260515-1"></script>
<script src="/assets/js/player-panel.js?v=20260531-video46"></script>
<script src="/assets/js/router.js?v=20260602-favfix"></script>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
${clickPlayScript}
</body>
</html>`;

  const outPath = path.join(GENRE_DIR, `${g.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`[OK] ${g.slug}.html 窶・${matched.length}譖ｲ繧貞・莉ｶ陦ｨ遉ｺ`);
}

console.log('\n螳御ｺ・ ' + GENRES.length + ' 繧ｸ繝｣繝ｳ繝ｫ繝壹・繧ｸ逕滓・');

