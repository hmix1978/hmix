/**
 * H/MIX GALLERY - Scene Search Engine
 * 自然文シーン検索エンジン（外部AI不使用・vanilla JS）
 *
 * 検索の流れ:
 *  1. 入力文を正規化（小文字化・記号除去）
 *  2. 単語に分割
 *  3. 同義語辞書で関連キーワードに展開
 *  4. TRACKS の tags / mood / sceneTags / description / title と照合
 *  5. スコア計算 → 上位5〜8曲を返す
 */

'use strict';

// ===== 同義語辞書 =====
// キーワード → 関連タグ・ムードの配列
const SYNONYMS = {
  // 和風・日本
  samurai:    ['japanese', 'battle', 'traditional', 'epic', 'sword'],
  ninja:      ['japanese', 'battle', 'fast', 'action', 'dark'],
  shrine:     ['japanese', 'spiritual', 'prayer', 'night', 'sacred', 'traditional'],
  japanese:   ['japanese', 'traditional', 'shrine', 'spiritual'],
  japan:      ['japanese', 'traditional', 'shrine', 'spiritual'],
  katana:     ['japanese', 'battle', 'sword', 'samurai'],
  sakura:     ['japanese', 'spring', 'peaceful', 'gentle'],
  festival:   ['japanese', 'festival', 'night', 'cheerful', 'traditional'],
  matsuri:    ['japanese', 'festival', 'night', 'traditional'],
  torii:      ['japanese', 'shrine', 'spiritual', 'sacred'],
  geisha:     ['japanese', 'traditional', 'elegant', 'night'],
  yokai:      ['japanese', 'scary', 'ghost', 'spiritual', 'dark'],
  oni:        ['japanese', 'scary', 'battle', 'dark', 'scary'],

  // ホラー・恐怖
  horror:     ['scary', 'scary', 'dark', 'fear', 'suspense', 'ghost'],
  scary:      ['scary', 'scary', 'dark', 'fear', 'eerie'],
  ghost:      ['scary', 'ghost', 'dark', 'haunting', 'eerie'],
  haunted:    ['scary', 'ghost', 'dark', 'haunting', 'eerie'],
  fear:       ['scary', 'scary', 'dark', 'tense', 'fearful'],
  dark:       ['dark', 'scary', 'mystery', 'suspense', 'night'],
  creepy:     ['scary', 'scary', 'eerie', 'dark', 'suspense'],
  eerie:      ['scary', 'eerie', 'dark', 'mysterious', 'ghost'],
  spooky:     ['scary', 'scary', 'ghost', 'dark', 'eerie'],
  curse:      ['scary', 'dark', 'occult', 'japanese', 'scary'],
  demon:      ['scary', 'dark', 'battle', 'scary', 'japanese'],

  // 夜・静寂
  night:      ['night', 'quiet', 'dark', 'calm', 'mysterious'],
  midnight:   ['night', 'dark', 'quiet', 'mysterious', 'scary'],
  moon:       ['night', 'japanese', 'spiritual', 'calm', 'mysterious'],
  moonlit:    ['night', 'japanese', 'spiritual', 'calm', 'mysterious'],
  moonlight:  ['night', 'japanese', 'spiritual', 'calm', 'mysterious'],
  stars:      ['night', 'peaceful', 'dreamy', 'calm', 'fantasy'],
  stargazing: ['night', 'peaceful', 'dreamy', 'calm'],
  darkness:   ['dark', 'night', 'scary', 'mysterious'],

  // 悲しい・感情
  sad:        ['sad', 'emotional', 'melancholy', 'farewell', 'lonely', 'quiet'],
  sadness:    ['sad', 'emotional', 'melancholy', 'lonely'],
  emotional:  ['emotional', 'sad', 'nostalgic', 'tender'],
  farewell:   ['sad', 'emotional', 'farewell', 'lonely', 'journey'],
  goodbye:    ['sad', 'emotional', 'farewell', 'lonely'],
  lonely:     ['sad', 'lonely', 'quiet', 'melancholy'],
  tears:      ['sad', 'emotional', 'melancholy', 'tender'],
  crying:     ['sad', 'emotional', 'melancholy'],
  grief:      ['sad', 'emotional', 'melancholy', 'solemn'],
  nostalgic:  ['nostalgic', 'sad', 'tender', 'memory'],
  memory:     ['nostalgic', 'sad', 'tender', 'memory'],
  childhood:  ['nostalgic', 'sad', 'tender', 'memory', 'daily'],

  // バトル・アクション
  battle:     ['battle', 'epic', 'action', 'fight', 'intense'],
  fight:      ['battle', 'action', 'intense', 'fight'],
  war:        ['battle', 'epic', 'intense', 'orchestral', 'solemn'],
  combat:     ['battle', 'action', 'intense', 'fast'],
  action:     ['action', 'battle', 'intense', 'fast', 'epic'],
  boss:       ['battle', 'epic', 'intense', 'rpg', 'action'],
  epic:       ['epic', 'orchestral', 'grand', 'battle', 'adventure'],
  intense:    ['intense', 'battle', 'action', 'tense', 'fierce'],
  warrior:    ['battle', 'japanese', 'epic', 'samurai', 'heroic'],
  sword:      ['battle', 'japanese', 'samurai', 'action'],

  // RPG・ファンタジー
  rpg:        ['rpg', 'fantasy', 'adventure', 'battle', 'game'],
  fantasy:    ['fantasy', 'adventure', 'epic', 'magical', 'rpg'],
  adventure:  ['adventure', 'epic', 'journey', 'fantasy', 'rpg'],
  dungeon:    ['dungeon', 'rpg', 'dark', 'mystery', 'suspense'],
  dragon:     ['fantasy', 'battle', 'epic', 'rpg', 'intense'],
  magic:      ['fantasy', 'magical', 'spiritual', 'mysterious'],
  quest:      ['rpg', 'adventure', 'fantasy', 'journey', 'epic'],
  game:       ['rpg', 'game', 'battle', 'adventure', 'fantasy'],

  // 癒し・平和
  peaceful:   ['peaceful', 'calm', 'gentle', 'healing', 'quiet'],
  calm:       ['calm', 'peaceful', 'gentle', 'healing', 'quiet'],
  healing:    ['healing', 'peaceful', 'calm', 'gentle', 'nature'],
  relaxing:   ['healing', 'peaceful', 'calm', 'gentle'],
  relax:      ['healing', 'peaceful', 'calm', 'gentle'],
  gentle:     ['gentle', 'peaceful', 'calm', 'healing'],
  nature:     ['nature', 'peaceful', 'healing', 'gentle'],
  forest:     ['nature', 'peaceful', 'healing', 'fantasy', 'gentle'],
  garden:     ['nature', 'peaceful', 'healing', 'gentle'],
  rain:       ['peaceful', 'calm', 'sad', 'gentle', 'quiet'],

  // 旅・冒険
  journey:    ['journey', 'adventure', 'epic', 'sad', 'orchestral'],
  travel:     ['journey', 'adventure', 'epic', 'daily'],
  departure:  ['journey', 'sad', 'farewell', 'epic'],
  exploration:['adventure', 'rpg', 'dungeon', 'fantasy'],

  // 楽しい・明るい
  fun:        ['fun', 'cheerful', 'happy', 'light', 'daily'],
  happy:      ['fun', 'cheerful', 'happy', 'light'],
  cheerful:   ['fun', 'cheerful', 'happy', 'light'],
  cute:       ['fun', 'cute', 'light', 'cheerful'],
  spring:     ['spring', 'japanese', 'peaceful', 'gentle', 'fun'],

  // 日常・生活
  daily:      ['daily', 'peaceful', 'gentle', 'fun', 'light'],
  morning:    ['daily', 'peaceful', 'gentle', 'fun', 'light'],
  town:       ['daily', 'fun', 'peaceful', 'japanese'],
  village:    ['daily', 'peaceful', 'japanese', 'gentle'],

  // 神秘・精神
  spiritual:  ['spiritual', 'japanese', 'shrine', 'mysterious', 'sacred'],
  mystery:    ['mystery', 'suspense', 'dark', 'tense', 'mysterious'],
  mysterious: ['mysterious', 'mystery', 'dark', 'spiritual', 'night'],
  prayer:     ['spiritual', 'japanese', 'shrine', 'sacred', 'peaceful'],
  sacred:     ['sacred', 'spiritual', 'japanese', 'shrine', 'mysterious'],
  spirit:     ['spiritual', 'japanese', 'shrine', 'ghost', 'mysterious'],

  // 日本語キーワード（ひらがな・カタカナ対応）
  '和風':     ['japanese', 'traditional', 'shrine', 'spiritual'],
  '侍':       ['japanese', 'battle', 'samurai', 'traditional'],
  '神社':     ['japanese', 'shrine', 'spiritual', 'sacred', 'night'],
  'ホラー':   ['scary', 'scary', 'dark', 'ghost'],
  '怖い':     ['scary', 'scary', 'dark', 'fear'],
  '悲しい':   ['sad', 'emotional', 'melancholy', 'lonely'],
  '戦い':     ['battle', 'action', 'intense', 'epic'],
  '夜':       ['night', 'quiet', 'dark', 'mysterious'],
  '癒し':     ['healing', 'peaceful', 'calm', 'gentle'],
  '楽しい':   ['fun', 'cheerful', 'happy', 'light'],
  '旅':       ['journey', 'adventure', 'epic', 'sad'],
  '別れ':     ['sad', 'farewell', 'emotional', 'lonely'],
  '森':       ['nature', 'peaceful', 'healing', 'fantasy'],
  'バトル':   ['battle', 'action', 'intense', 'epic'],
  'RPG':      ['rpg', 'fantasy', 'adventure', 'battle'],
  'ゲーム':   ['rpg', 'game', 'battle', 'adventure'],
  // 追加同義語（指示書記載分）
  chase:      ['scary', 'action', 'tense', 'fast', 'suspense'],
  run:        ['action', 'fast', 'tense', 'battle'],
  escape:     ['scary', 'tense', 'suspense', 'action', 'dark'],
  ritual:     ['scary', 'dark', 'occult', 'japanese', 'spiritual'],
  occult:     ['scary', 'dark', 'occult', 'ritual', 'scary'],
  castle:     ['scary', 'ghost', 'dark', 'japanese', 'epic'],
  ruins:      ['scary', 'dark', 'suspense', 'atmospheric', 'abandoned'],
  abandoned:  ['scary', 'dark', 'eerie', 'suspense'],
  dreamlike:  ['fantasy', 'peaceful', 'mysterious', 'healing', 'night'],
  dreamy:     ['fantasy', 'peaceful', 'mysterious', 'healing', 'night'],
  mystical:   ['spiritual', 'mysterious', 'japanese', 'fantasy', 'sacred'],
  soft:       ['gentle', 'peaceful', 'healing', 'calm'],
  tender:     ['sad', 'emotional', 'gentle', 'quiet'],
  longing:    ['sad', 'emotional', 'nostalgic', 'farewell', 'lonely'],
  separation: ['sad', 'farewell', 'emotional', 'lonely'],
  parting:    ['sad', 'farewell', 'emotional', 'lonely'],
  heroic:     ['battle', 'epic', 'orchestral', 'triumphant', 'action'],
  triumph:    ['battle', 'epic', 'orchestral', 'heroic', 'triumphant'],
  field:      ['rpg', 'adventure', 'epic', 'journey', 'peaceful'],
  overworld:  ['rpg', 'adventure', 'epic', 'journey'],
  labyrinth:  ['rpg', 'dungeon', 'dark', 'mystery', 'suspense'],
  maze:       ['rpg', 'dungeon', 'dark', 'mystery', 'suspense'],
  '神秘':     ['mysterious', 'spiritual', 'japanese', 'dark', 'night'],
  '精霊':     ['spiritual', 'japanese', 'shrine', 'ghost', 'mysterious'],
  '幻想':     ['fantasy', 'rpg', 'mysterious', 'adventure'],
  '恐怖':     ['scary', 'scary', 'dark', 'fear', 'tense'],
  '山':       ['nature', 'peaceful', 'epic', 'japanese'],
  '川':       ['nature', 'peaceful', 'healing', 'japanese'],
  '海':       ['nature', 'peaceful', 'healing', 'nostalgic'],
  '戦場':     ['battle', 'epic', 'intense', 'orchestral', 'sad'],
  '辺り':     ['japanese', 'traditional', 'peaceful', 'daily'],
  '小屋':     ['japanese', 'traditional', 'peaceful', 'daily'],
};

// ===== スコア重み =====
// 指示書に基づく推奨スコア
const SCORE_WEIGHTS = {
  titleMatch:       5,   // タイトル（日本語・英語）に含まれる
  sceneTagExact:    4,   // sceneTags に含まれる（最高優先度）
  tagExact:         3,   // tags に完全一致
  moodExact:        2,   // mood に完全一致
  descriptionMatch: 1,   // description に含まれる
  synonymExpanded:  1,   // 同義語展開で一致
};

// ===== メイン検索関数 =====
/**
 * シーン検索を実行する
 * @param {string} query - ユーザーの入力文
 * @param {Array}  tracks - 楽曲データ配列（TRACKS）
 * @param {number} maxResults - 最大表示件数（デフォルト: 8）
 * @returns {Array} スコア付き楽曲配列（スコア降順）
 */
function searchByScene(query, tracks, maxResults = 8) {
  if (!query || !query.trim()) return [];

  // 1. 入力文の正規化
  const normalized = normalizeQuery(query);
  if (!normalized.length) return [];

  // 2. 同義語展開
  const expandedKeywords = expandWithSynonyms(normalized);

  // 3. 各曲のスコア計算
  const scored = tracks.map(track => {
    const score = calcScore(track, normalized, expandedKeywords);
    return { track, score };
  });

  // 4. スコア0を除外 → スコア降順ソート → 上位N件
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// ===== 入力文の正規化 =====
function normalizeQuery(query) {
  return query
    .toLowerCase()
    .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, ' ') // 記号除去（日本語保持）
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 0);
}

// ===== 同義語展開 =====
function expandWithSynonyms(words) {
  const expanded = new Set(words);
  words.forEach(word => {
    const synonyms = SYNONYMS[word];
    if (synonyms) {
      synonyms.forEach(s => expanded.add(s));
    }
    // 部分一致でも展開（例: "samurai" → "samu" でもヒット）
    Object.keys(SYNONYMS).forEach(key => {
      if (key.length > 3 && word.length > 3 && (key.includes(word) || word.includes(key))) {
        SYNONYMS[key].forEach(s => expanded.add(s));
      }
    });
  });
  return expanded;
}

// ===== スコア計算 =====
function calcScore(track, originalWords, expandedKeywords) {
  let score = 0;

  const titleJa  = track.title.toLowerCase();
  const titleEn  = (track.title_en || '').toLowerCase();
  const desc     = (track.description || '').toLowerCase();
  const tags     = [...(track.feeling || []), ...(track.style || []), ...(track.scene || []), ...(track.story || [])];
  const mood     = tags; // 旧フィールドなし、tags と共用
  const sceneTags = track.sceneTags || [];

  originalWords.forEach(word => {
    // タイトル一致
    if (titleJa.includes(word) || titleEn.includes(word)) {
      score += SCORE_WEIGHTS.titleMatch;
    }

    // description 一致
    if (desc.includes(word)) {
      score += SCORE_WEIGHTS.descriptionMatch;
    }

    // tags 完全一致
    if (tags.includes(word)) {
      score += SCORE_WEIGHTS.tagExact;
    }

    // mood 完全一致
    if (mood.includes(word)) {
      score += SCORE_WEIGHTS.moodExact;
    }

    // sceneTags 一致（フレーズ含む）
    if (sceneTags.some(st => st.toLowerCase().includes(word))) {
      score += SCORE_WEIGHTS.sceneTagExact;
    }
  });

  // 同義語展開キーワードとの一致（originalWordsで既にカウントしたものは除く）
  expandedKeywords.forEach(keyword => {
    if (originalWords.includes(keyword)) return; // 既にカウント済み

    if (tags.includes(keyword)) {
      score += SCORE_WEIGHTS.synonymExpanded;
    }
    if (mood.includes(keyword)) {
      score += SCORE_WEIGHTS.synonymExpanded;
    }
    if (sceneTags.some(st => st.toLowerCase().includes(keyword))) {
      score += SCORE_WEIGHTS.synonymExpanded;
    }
    if (desc.includes(keyword)) {
      score += SCORE_WEIGHTS.synonymExpanded * 0.5;
    }
  });

  return Math.round(score);
}

// ===== エクスポート（モジュール非対応環境向けにグローバルにも公開） =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { searchByScene, normalizeQuery, expandWithSynonyms, calcScore, SYNONYMS };
}
