/*
 * H/MIX GALLERY — tracks.js
 * (Exported from Tracks Manager)
 */
const HMIX_BASE_PATH = (function() {
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/test2026/') || window.location.pathname === '/test2026') return '/test2026';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return '';
  }
  return '';
})();

const TAGS_META = {
  "feeling": [
    {
      "id": "gentle",
      "name": "優しい",
      "name_en": "Gentle"
    },
    {
      "id": "sad",
      "name": "悲しい",
      "name_en": "Sad"
    },
    {
      "id": "happy",
      "name": "楽しい",
      "name_en": "Happy"
    },
    {
      "id": "epic",
      "name": "勇壮",
      "name_en": "Epic"
    },
    {
      "id": "dark",
      "name": "暗い",
      "name_en": "Dark"
    },
    {
      "id": "mysterious",
      "name": "神秘",
      "name_en": "Mysterious"
    },
    {
      "id": "suspense",
      "name": "緊迫",
      "name_en": "Suspense"
    },
    {
      "id": "scary",
      "name": "怖い",
      "name_en": "Scary"
    },
    {
      "id": "cute",
      "name": "かわいい",
      "name_en": "Cute"
    }
  ],
  "style": [
    {
      "id": "fantasy",
      "name": "ファンタジー",
      "name_en": "Fantasy"
    },
    {
      "id": "japanese",
      "name": "和風",
      "name_en": "Japanese"
    },
    {
      "id": "celtic",
      "name": "ケルト",
      "name_en": "Celtic"
    },
    {
      "id": "medieval",
      "name": "中世",
      "name_en": "Medieval"
    },
    {
      "id": "oriental",
      "name": "アジアン",
      "name_en": "Asian"
    },
    {
      "id": "futuristic",
      "name": "近未来",
      "name_en": "Futuristic"
    },
    {
      "id": "electronic",
      "name": "電子音",
      "name_en": "Electronic"
    },
    {
      "id": "modern",
      "name": "現代的",
      "name_en": "Modern"
    },
    {
      "id": "musicbox",
      "name": "オルゴール",
      "name_en": "Music Box"
    },
    {
      "id": "japanese_horror",
      "name": "和風ホラー",
      "name_en": "Japanese Horror"
    },
    {
      "id": "western_horror",
      "name": "洋風ホラー",
      "name_en": "Western Horror"
    }
  ],
  "scene": [
    {
      "id": "battle",
      "name": "戦闘",
      "name_en": "Battle"
    },
    {
      "id": "boss",
      "name": "ボス",
      "name_en": "Boss"
    },
    {
      "id": "town",
      "name": "街",
      "name_en": "Town"
    },
    {
      "id": "village",
      "name": "村",
      "name_en": "Village"
    },
    {
      "id": "field",
      "name": "フィールド",
      "name_en": "Field"
    },
    {
      "id": "forest",
      "name": "森",
      "name_en": "Forest"
    },
    {
      "id": "night",
      "name": "夜",
      "name_en": "Night"
    },
    {
      "id": "travel",
      "name": "旅",
      "name_en": "Travel"
    },
    {
      "id": "dungeon",
      "name": "ダンジョン",
      "name_en": "Dungeon"
    },
    {
      "id": "ruins",
      "name": "遺跡",
      "name_en": "Ruins"
    },
    {
      "id": "cave",
      "name": "洞窟",
      "name_en": "Cave"
    },
    {
      "id": "festival",
      "name": "祭り",
      "name_en": "Festival"
    },
    {
      "id": "opening",
      "name": "オープニング",
      "name_en": "Opening"
    },
    {
      "id": "ending",
      "name": "エンディング",
      "name_en": "Ending"
    },
    {
      "id": "onsen",
      "name": "温泉",
      "name_en": "Hot Spring"
    },
    {
      "id": "shrine",
      "name": "神社",
      "name_en": "Shrine"
    },
    {
      "id": "samurai",
      "name": "サムライ",
      "name_en": "Samurai"
    },
    {
      "id": "snow",
      "name": "雪",
      "name_en": "Snow"
    },
    {
      "id": "mansion",
      "name": "洋館",
      "name_en": "Mansion"
    },
    {
      "id": "morning",
      "name": "朝",
      "name_en": "Morning"
    },
    {
      "id": "church",
      "name": "教会",
      "name_en": "Church"
    }
  ],
  "story": [
    {
      "id": "memory",
      "name": "思い出",
      "name_en": "Memory"
    },
    {
      "id": "reunion",
      "name": "再会",
      "name_en": "Reunion"
    },
    {
      "id": "farewell",
      "name": "別れ",
      "name_en": "Farewell"
    },
    {
      "id": "victory",
      "name": "勝利",
      "name_en": "Victory"
    },
    {
      "id": "defeat",
      "name": "敗北",
      "name_en": "Defeat"
    },
    {
      "id": "peaceful",
      "name": "平和",
      "name_en": "Peaceful"
    },
    {
      "id": "dream",
      "name": "夢",
      "name_en": "Dream"
    },
    {
      "id": "conspiracy",
      "name": "陰謀",
      "name_en": "Conspiracy"
    },
    {
      "id": "dailylife",
      "name": "日常",
      "name_en": "Daily Life"
    },
    {
      "id": "destiny",
      "name": "運命",
      "name_en": "Destiny"
    },
    {
      "id": "omen",
      "name": "予兆",
      "name_en": "Omen"
    },
    {
      "id": "resolve",
      "name": "決意",
      "name_en": "Resolve"
    },
    {
      "id": "bonds",
      "name": "絆",
      "name_en": "Bonds"
    },
    {
      "id": "pursuit",
      "name": "追跡",
      "name_en": "Pursuit"
    },
    {
      "id": "hope",
      "name": "希望",
      "name_en": "Hope"
    },
    {
      "id": "flashback",
      "name": "回想",
      "name_en": "Flashback"
    },
    {
      "id": "despair",
      "name": "絶望",
      "name_en": "Despair"
    }
  ]
};

const TRACKS = [
  {
    "id": "n1",
    "title": "裁きの炎",
    "title_en": "Flames of Judgment",
    "description": "深淵より響く呪詛の唸りと、命を削るように打ち鳴らされる民族の律動。底知れぬ恐怖と深い絶望感が追従する、熱を帯びた戦闘曲。逃れられぬ運命の果て、罪を焼くための炎が静かに、そして激しく燃え盛る。\n",
    "description_en": "Cursed chants rise from the abyss as tribal drums beat like a fading pulse. A heated battle theme of dread and despair where flames of judgment rage beyond all escape.",
    "feeling": [
      "suspense",
      "dark",
      "scary"
    ],
    "style": [
      "oriental",
      "japanese_horror"
    ],
    "scene": [
      "battle",
      "boss",
      "dungeon",
      "samurai"
    ],
    "story": [
      "conspiracy",
      "defeat",
      "pursuit",
      "destiny",
      "omen"
    ],
    "duration": "1:51",
    "durationSec": 111,
    "mp3": "/music/n/n1.mp3",
    "climax": {
      "start": 42.8,
      "end": 111.5
    },
    "loop": false
  },
  {
    "id": "n2",
    "title": "荒野を歩む者",
    "title_en": "Wanderer of the Wastes",
    "description": "吹き荒れる風のなか、確かな希望を胸に荒野を進む勇壮なフィールド曲。強大な運命に立ち向かう者たちの、熱き決意と旅路を彩る壮大なファンタジー。立ち止まることなく一歩を踏み出す、勇気の調べ。\n",
    "description_en": "A heroic field theme for those who press onward through howling winds, hope burning bright. A sweeping fantasy of courage and resolve against an immense destiny.",
    "feeling": [
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "travel",
      "field"
    ],
    "story": [
      "resolve",
      "destiny",
      "hope"
    ],
    "duration": "1:17",
    "durationSec": 77,
    "mp3": "/music/n/n2.mp3",
    "climax": {
      "start": 27,
      "end": 76.9
    }
  },
  {
    "id": "n3",
    "title": "謀略の間",
    "title_en": "Chamber of Schemes",
    "description": "夜闇に紛れて密やかに進行する、誰かの陰謀と深い怨念。\n身の毛もよだつ惨劇の予兆を孕んだ、極めて不穏な和のサウンド。\n光の届かぬ冷たい洞窟で、禍々しい計画が静かに紐解かれていく。",
    "description_en": "Conspiracy and deep resentment creep through darkness in this unsettling Japanese-style sound. In a cold cavern beyond the reach of light, a sinister plan unfolds.",
    "feeling": [
      "dark",
      "mysterious",
      "scary"
    ],
    "style": [
      "japanese",
      "japanese_horror"
    ],
    "scene": [
      "night",
      "cave"
    ],
    "story": [
      "conspiracy",
      "flashback",
      "omen"
    ],
    "duration": "2:42",
    "durationSec": 162,
    "mp3": "/music/n/n3.mp3",
    "climax": {
      "start": 78.9,
      "end": 162
    }
  },
  {
    "id": "n4",
    "title": "緊迫の迷宮",
    "title_en": "Labyrinth of Tension",
    "description": "一瞬の油断が命取りとなる、闇深いダンジョンのスリリングな空気を表現した一曲。\n迫りくる追跡者の影と、運命に抗う足音が生み出す息を呑むようなサスペンス。\n勇壮なリズムが鼓動とリンクし、聴くものを果てなき迷宮の奥深くへといざなう。\n",
    "description_en": "Thrilling dungeon tension where a single lapse means death. Shadows of pursuers and defiant footsteps create breathless suspense, pulling you deep into an endless labyrinth.",
    "feeling": [
      "suspense",
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "dungeon",
      "field"
    ],
    "story": [
      "pursuit",
      "destiny"
    ],
    "duration": "2:00",
    "durationSec": 120,
    "mp3": "/music/n/n4.mp3"
  },
  {
    "id": "n5",
    "title": "夢の向こう",
    "title_en": "Beyond the Dream",
    "description": "あたたかな日差しの下、のどかな村の平和な日常を描く優しいメロディ。\n木漏れ日ゆれる森や、湯けむり立ち上る温泉でのひとときを思わせる愛らしい一曲。\n楽しい情景が心に広がり、聴く者をふんわりとした「夢の向こう」へ誘う。\n",
    "description_en": "A gentle melody painting peaceful village life under warm sunlight. Sunbeams through the trees and steam from hot springs evoke a lovely sense of comfort and dreams.",
    "feeling": [
      "gentle",
      "happy",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "village",
      "forest",
      "onsen"
    ],
    "story": [
      "dream",
      "peaceful",
      "hope",
      "dailylife"
    ],
    "duration": "1:50",
    "durationSec": 110,
    "mp3": "/music/n/n5.mp3"
  },
  {
    "id": "n6",
    "title": "無礼講",
    "title_en": "Village Night Feast",
    "description": "村人たちの楽しげな笑い声が響く、和の情緒あふれる夜の宴。\n注ぎつ注がれつ、ほろ酔い気分でまったりと更けていく心和む時間。\n提灯の明かりに照らされた、どこかノスタルジックで温かい日常のひととき。\n",
    "description_en": "A warm Japanese-style evening feast filled with laughter and clinking cups. Lantern light illuminates a nostalgic, cozy gathering where time drifts pleasantly into the night.",
    "feeling": [
      "happy",
      "dark"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "festival",
      "night",
      "village"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "2:01",
    "durationSec": 121,
    "mp3": "/music/n/n6.mp3"
  },
  {
    "id": "n7",
    "title": "霊樹に抱かれて",
    "title_en": "Spirit Tree Embrace",
    "description": "かつて栄華を極めたであろう地で、静かに光を浴び続ける大樹の鼓動。\n忘れ去られた洞窟や森の遺跡に眠る、平穏な記憶を呼び起こすハープの旋律。\n過ぎ去った日々への愛おしさを詠いあげる、美しくファンタジックな音楽。\n",
    "description_en": "The heartbeat of a great tree bathing in quiet light upon once-glorious grounds. A harp melody stirs peaceful memories sleeping in forgotten caves and forest ruins.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest",
      "night",
      "dungeon",
      "ruins",
      "cave"
    ],
    "story": [
      "peaceful",
      "memory",
      "dream"
    ],
    "duration": "1:44",
    "durationSec": 104,
    "mp3": "/music/n/n7.mp3"
  },
  {
    "id": "n8",
    "title": "伝統の街",
    "title_en": "Ancient Town",
    "description": "永い年月をかけて積み重ねられた、重厚な歴史が息づく。\n古き良き街並みや、自然と共存する静かな村の情景を優しく描き出します。\n旅路の果てにたどり着いた地で、伝統に想いを馳せる曲。",
    "description_en": "Layers of history breathe through centuries of tradition. A gentle portrait of old townscapes and villages living in harmony with nature, where travelers reflect on heritage.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "japanese",
      "oriental"
    ],
    "scene": [
      "town",
      "ruins",
      "dungeon",
      "village",
      "forest",
      "travel",
      "shrine"
    ],
    "story": [
      "peaceful"
    ],
    "duration": "2:15",
    "durationSec": 135,
    "mp3": "/music/n/n8.mp3"
  },
  {
    "id": "n9",
    "title": "信用してはいけない",
    "title_en": "Trust No One",
    "description": "闇夜に紛れて蠢く陰謀と、じわじわと迫りくる危機を暗示する怪しげなメロディ。\n『謀略の間』をアレンジした、ミステリアスな響き。\n冷たい遺跡の奥底から甘く招くその音を、どうか決して信じないでください。\n",
    "description_en": "A suspicious melody hinting at conspiracies stirring in the dark and creeping danger. A mysterious rearrangement that beckons sweetly from deep within cold ruins. Trust nothing.",
    "feeling": [
      "dark",
      "suspense",
      "scary"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [
      "night",
      "ruins",
      "mansion"
    ],
    "story": [
      "conspiracy",
      "omen"
    ],
    "duration": "1:43",
    "durationSec": 103,
    "mp3": "/music/n/n9.mp3"
  },
  {
    "id": "n10",
    "title": "黄昏のプロローグ",
    "title_en": "Twilight Prologue",
    "description": "静かなピアノの調べから幕を開け、次第に情熱的な高鳴りへと向かう勇壮なテーマ。\n夜の終わりと希望の朝を告げるような、壮大な物語のオープニングに合う一曲。\n胸に秘めた強い決意と共に、運命に導かれて歩み出す旅人たちの背中を押します。\n",
    "description_en": "A heroic theme opening with quiet piano, building to a passionate crescendo. A grand overture heralding the end of night and the dawn of hope, urging travelers onward.",
    "feeling": [
      "epic",
      "mysterious",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening",
      "morning",
      "samurai",
      "travel"
    ],
    "story": [
      "resolve",
      "flashback",
      "destiny"
    ],
    "duration": "1:01",
    "durationSec": 61,
    "mp3": "/music/n/n10.mp3"
  },
  {
    "id": "n11",
    "title": "祝福された大地",
    "title_en": "Blessed Land",
    "description": "ファンファーレが高らかに鳴り響く、壮大な冒険の幕開けを告げる勇壮なテーマ。\nどこまでも広がるフィールドと、遥かなる希望へと向かう旅人たちの決意を描き出します。\nいつか必ず掴み取る勝利の夢を胸に、新たな運命へと力強く踏み出す一曲。\n",
    "description_en": "Triumphant fanfares herald the dawn of a grand adventure. Vast fields stretch endlessly as travelers set forth with unwavering resolve toward distant hope and a new destiny.",
    "feeling": [
      "epic",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening",
      "field",
      "morning"
    ],
    "story": [
      "hope",
      "resolve",
      "victory",
      "dream"
    ],
    "duration": "0:23",
    "durationSec": 23,
    "mp3": "/music/n/n11.mp3"
  },
  {
    "id": "n12",
    "title": "ひとときの安らぎ",
    "title_en": "A Moment's Rest",
    "description": "長い旅の疲れを癒やす、静かな森の宿屋での一夜を思わせる短いテーマ。\nどこか切なくも優しい旋律が、穏やかな眠りと平和な夢へといざないます。\n夜明けと共に訪れる新たな運命への、ささやかで愛おしい休息の音色。\n",
    "description_en": "A brief, tender theme evoking a quiet night at a forest inn after a long journey. A bittersweet melody that guides the weary toward peaceful sleep and gentle dreams before dawn.",
    "feeling": [
      "gentle",
      "sad",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest",
      "night",
      "morning",
      "onsen"
    ],
    "story": [
      "peaceful",
      "dream",
      "omen"
    ],
    "duration": "0:08",
    "durationSec": 8,
    "mp3": "/music/n/n12.mp3"
  },
  {
    "id": "n13",
    "title": "覚醒の時",
    "title_en": "Awakening",
    "description": "抗えぬ運命の歯車が静かに、そして暴力的に回り始めるシリアスなロックナンバー。\n闇に沈む街を駆け抜けるようなエッジの効いた電子音が、緊迫した死闘を彩ります。\n陰謀渦巻く過酷な夜の幕開けと決意を描き出した一曲。\n",
    "description_en": "A serious rock number where the gears of fate begin to turn with quiet violence. Sharp electronic sounds cut through a city shrouded in darkness, scoring a desperate battle.",
    "feeling": [
      "epic",
      "dark",
      "suspense"
    ],
    "style": [
      "futuristic",
      "electronic",
      "modern"
    ],
    "scene": [
      "battle",
      "town",
      "opening",
      "night",
      "samurai"
    ],
    "story": [
      "resolve",
      "omen",
      "destiny",
      "conspiracy",
      "defeat"
    ],
    "duration": "1:41",
    "durationSec": 101,
    "mp3": "/music/n/n13.mp3"
  },
  {
    "id": "n14",
    "title": "希望の残影",
    "title_en": "Last Traces of Hope",
    "description": "無機質な電子音と和の響きが溶け合う、冷たくも美しい追憶のサウンド。\n繰り返されるシンプルなフレーズが、絶望の中で見いだしたかすかな光を感じさせます。\n悲しい戦いの予兆か、平和への祈りか。",
    "description_en": "Cold electronic tones merge with Japanese instrumentation in a haunting sound of remembrance. A repeating phrase suggests faint light amid despair. A prelude to sorrow, or a prayer for peace.",
    "feeling": [
      "sad",
      "gentle",
      "dark"
    ],
    "style": [
      "japanese",
      "electronic",
      "modern"
    ],
    "scene": [
      "battle",
      "ruins",
      "night"
    ],
    "story": [
      "memory",
      "flashback",
      "omen"
    ],
    "duration": "2:16",
    "durationSec": 136,
    "mp3": "/music/n/n14.mp3"
  },
  {
    "id": "n15",
    "title": "永久の輪廻",
    "title_en": "Eternal Cycle",
    "description": "逃れられない運命の螺旋を描き出す、苛烈でエモーショナルな最終決戦の調べ。\n巨大な魔法陣のように展開される、電子音と神秘的なオーケストラの激しい交差。\n世界の終焉すら予兆させる、強い気迫とスケールを持つラスボス・テーマ。",
    "description_en": "A fierce, emotional final battle theme tracing the inescapable spiral of fate. Electronics and mystical orchestra collide like a vast magic circle. powerful final boss energy.",
    "feeling": [
      "epic",
      "dark",
      "mysterious",
      "suspense"
    ],
    "style": [
      "fantasy",
      "electronic",
      "modern"
    ],
    "scene": [
      "boss",
      "battle"
    ],
    "story": [
      "destiny",
      "omen",
      "conspiracy"
    ],
    "duration": "2:39",
    "durationSec": 159,
    "mp3": "/music/n/n15.mp3"
  },
  {
    "id": "n16",
    "title": "Paradiso",
    "title_en": "Paradiso",
    "description": "静かな夜の空気に溶けていく、美しくも切ないピアノの旋律。\n遠い日のあたたかな恋の記憶や、二度と戻らない別れの情景を優しく描き出します。\nいつか必ず訪れる再会を信じて、想い出と共にそっと寄り添うエモーショナルな一曲。",
    "description_en": "A beautiful, melancholy piano melody dissolving into the quiet night air. Tender memories of distant love and farewells that can never return. An emotional piece that believes in reunion.",
    "feeling": [
      "sad",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night",
      "travel"
    ],
    "story": [
      "memory",
      "farewell",
      "reunion",
      "flashback",
      "bonds",
      "dream"
    ],
    "duration": "5:32",
    "durationSec": 332,
    "mp3": "/music/n/n16.mp3"
  },
  {
    "id": "n17",
    "title": "蜃気楼の街",
    "title_en": "City of Mirages",
    "description": "ふわりと消えてしまいそうな蜃気楼のように、もやもやとした響きが漂うBGM。\n遠い過去の回想や、曖昧な夢の世界へと意識が吸い込まれていくような不思議な感覚。\n静かな遺跡に佇みながら、正体不明の気配を肌で感じるダークファンタジーの世界。",
    "description_en": "Hazy, drifting tones shimmer like a mirage about to vanish. Consciousness slips into distant memories and ambiguous dreamscapes. Silent ruins and an unknown presence linger.",
    "feeling": [
      "mysterious",
      "dark"
    ],
    "style": [
      "fantasy",
      "electronic"
    ],
    "scene": [
      "forest",
      "night",
      "ruins",
      "cave",
      "snow"
    ],
    "story": [
      "flashback",
      "omen",
      "dream"
    ],
    "duration": "1:59",
    "durationSec": 119,
    "mp3": "/music/n/n17.mp3"
  },
  {
    "id": "n18",
    "title": "輝ける大地の物語",
    "title_en": "Tales of a Shining Land",
    "description": "輝く大地を踏みしめ歩き出す、希望と喜びに満ちた輝かしいサウンド。\n途中に訪れる仄暗い影や穏やかな静寂さえも巻き込み、数奇な運命をドラマチックに彩る。\nひとつの長大な冒険記を丸ごと音楽で表現したような、勇壮でスケールの大きな一曲。",
    "description_en": "A radiant sound of hope and joy as footsteps press into shining earth. Shadows and silence fold into a dramatic odyssey of fate. A grand piece capturing an entire epic adventure.",
    "feeling": [
      "epic",
      "happy",
      "gentle",
      "mysterious"
    ],
    "style": [
      "celtic",
      "fantasy"
    ],
    "scene": [
      "field",
      "travel",
      "forest",
      "town",
      "opening"
    ],
    "story": [
      "reunion",
      "hope",
      "destiny",
      "victory",
      "bonds"
    ],
    "duration": "2:42",
    "durationSec": 162,
    "mp3": "/music/n/n18.mp3"
  },
  {
    "id": "n19",
    "title": "幽玄の舞",
    "title_en": "Phantom Dance",
    "description": "深い霧に包まれたような、仄暗くも神秘的な空気をまとったアジアンテイスト。\n無駄を削ぎ落としたシンプルなハープの響きが、美しさと静寂を際立たせます。\n現実と夢の境界線が曖昧になるような、幻想的でミステリアスなサウンド。",
    "description_en": "An Asian-tinged mystique wrapped in deep fog and dim light. Spare harp notes illuminate beauty and silence. A phantasmal, mysterious sound where the boundary between dream and reality dissolves.",
    "feeling": [
      "mysterious",
      "dark"
    ],
    "style": [
      "oriental",
      "japanese"
    ],
    "scene": [
      "shrine",
      "night"
    ],
    "story": [
      "dream",
      "flashback",
      "omen"
    ],
    "duration": "2:28",
    "durationSec": 148,
    "mp3": "/music/n/n19.mp3"
  },
  {
    "id": "n20",
    "title": "襲撃",
    "title_en": "Ambush",
    "description": "「謀略の間」の旋律が牙を剥く、深い絶望感と緊迫感に満ちた激しいアレンジ曲。\n密やかに進行していた陰謀が、いよいよ強大な暴力となって襲いかかります。\n避けられない運命の対決や、容赦ないボスバトルをダイナミックに彩るサウンド。",
    "description_en": "The melody of conspiracy bares its fangs in this fierce arrangement of powerful despair. Hidden schemes erupt into violent force. Dynamic sound for inescapable confrontations and merciless boss battles.",
    "feeling": [
      "suspense",
      "dark"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "battle",
      "boss",
      "night",
      "dungeon",
      "samurai"
    ],
    "story": [
      "destiny",
      "conspiracy"
    ],
    "duration": "2:28",
    "durationSec": 148,
    "mp3": "/music/n/n20.mp3"
  },
  {
    "id": "n21",
    "title": "約束の地へ",
    "title_en": "Promised Land",
    "description": "郷愁を誘うバグパイプの音色が、果てしない冒険のフィールドへと吹き渡るケルト音楽。\nかつて夢に描いた「約束の地」を目指して歩み続ける、旅人たちの希望を勇壮に奏でます。\n中世ののどかな村や、緑豊かな森を吹き抜ける風のように、どこまでも優しく響く一曲。",
    "description_en": "Nostalgic bagpipes sweep across endless fields in this Celtic melody. Travelers press onward toward a promised land once glimpsed in dreams, carried by hope and boundless winds.",
    "feeling": [
      "gentle",
      "epic",
      "happy",
      "mysterious"
    ],
    "style": [
      "celtic",
      "fantasy",
      "medieval"
    ],
    "scene": [
      "travel",
      "field",
      "town",
      "village",
      "forest",
      "opening"
    ],
    "story": [
      "hope",
      "peaceful",
      "victory",
      "reunion"
    ],
    "duration": "0:41",
    "durationSec": 41,
    "mp3": "/music/n/n21.mp3"
  },
  {
    "id": "n22",
    "title": "哀しき邂逅",
    "title_en": "Sorrowful Encounter",
    "description": "冷たい雨に打たれながら、かつての友と刃を交える悲痛な死闘のファンタジー。\n緊迫した旋律の奥に、どれほど願っても交わらない二人の哀しい決裂が滲みます。\n戻らぬ日々への回想と、血を吐くような決意を胸に秘めたエモーショナルな楽曲。",
    "description_en": "A sorrowful fantasy of crossing blades with a former friend in cold rain. Beneath the tense melody, the pain of an irreparable rift bleeds through. Lost days and blood-stained resolve.",
    "feeling": [
      "sad",
      "suspense",
      "dark"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "travel",
      "night",
      "battle"
    ],
    "story": [
      "farewell",
      "defeat",
      "flashback",
      "resolve"
    ],
    "duration": "1:44",
    "durationSec": 104,
    "mp3": "/music/n/n22.mp3"
  },
  {
    "id": "n23",
    "title": "夜と共に耽る",
    "title_en": "Lost in the Night",
    "description": "無機質なエレクトロサウンドと、古の和楽器である尺八が溶け合うアンビエント。\nネオンの消えた静かな街や、深い夜の森での瞑想に合う神秘的な一曲。\n過去への回想と、まだ見ぬ未来の予兆が入り混じるような不思議で優しい響き。",
    "description_en": "Ambient fusion of electronic sound and ancient shakuhachi. Mystical music for quiet streets after neon fades or deep forest meditation at night. Past and future entwine in gentle wonder.",
    "feeling": [
      "mysterious",
      "gentle"
    ],
    "style": [
      "electronic",
      "oriental",
      "japanese",
      "modern"
    ],
    "scene": [
      "night",
      "cave",
      "town",
      "forest"
    ],
    "story": [
      "dream",
      "omen",
      "flashback"
    ],
    "duration": "1:35",
    "durationSec": 95,
    "mp3": "/music/n/n23.mp3"
  },
  {
    "id": "n24",
    "title": "暗黒の秘宝",
    "title_en": "Dark Treasure",
    "description": "冷え切った洞窟の奥底で、まばゆく妖しい光を放つ宝石を描いたダンジョンBGM。\n奥へ進むほどに濃くなる謎の気配と、静かに蠢く何かが緊迫感をじわじわと煽ります。\n美しさに魅入られた者を「絶望」の運命へと引きずり込むような、仄暗いファンタジー。",
    "description_en": "A dungeon BGM of jewels glowing eerily deep within frozen caverns. Mystery thickens with each step as something stirs in the dark. A dim fantasy luring the enchanted toward despair.",
    "feeling": [
      "dark",
      "mysterious",
      "suspense"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "dungeon",
      "cave",
      "forest",
      "ruins",
      "night",
      "mansion"
    ],
    "story": [
      "omen",
      "destiny",
      "despair",
      "conspiracy",
      "farewell"
    ],
    "duration": "1:53",
    "durationSec": 113,
    "mp3": "/music/n/n24.mp3"
  },
  {
    "id": "n25",
    "title": "Arukas Load",
    "title_en": "Arukas Road",
    "description": "あたたかな日差しが気持ちいい、のどかな村の散歩道をイメージしたケルト風BGM。\n優しく弾むようなメロディが、木漏れ日ゆれる自然の豊かさと平和な日常を描き出します。\nニコニコ動画『新約ほのぼの神社』のBGMとしても親しまれ、旅の途中で立ち寄った街や温泉での、笑顔あふれるあたたかい再会のシーンに向いています。",
    "description_en": "A Celtic-style BGM evoking a gentle stroll through a sunlit village lane. A warm, bouncing melody paints the richness of nature and peaceful daily life. fitting for joyful reunions along the road.",
    "feeling": [
      "gentle",
      "happy",
      "cute"
    ],
    "style": [
      "fantasy",
      "celtic"
    ],
    "scene": [
      "village",
      "travel",
      "town",
      "onsen",
      "morning"
    ],
    "story": [
      "peaceful",
      "reunion",
      "dailylife"
    ],
    "duration": "2:18",
    "durationSec": 138,
    "mp3": "/music/n/n25.mp3"
  },
  {
    "id": "n26",
    "title": "小さな行進曲",
    "title_en": "Little March",
    "description": "小さな足どりで元気いっぱいに進んでいくような、可愛らしいファンタジー行進曲。\n明るく華やかなオーケストラ・サウンドが、中世の賑やかな街並みと平和な日常を彩ります。\n胸いっぱいの希望にあふれる、あたたかくて心躍るハッピーなワンシーンに。",
    "description_en": "An adorable fantasy march with tiny, spirited footsteps leading the way. Bright orchestral sound paints a lively medieval town and its cheerful daily life, brimming with hope.",
    "feeling": [
      "happy",
      "epic",
      "cute"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "village",
      "town",
      "travel",
      "field"
    ],
    "story": [
      "peaceful",
      "dailylife",
      "hope"
    ],
    "duration": "2:41",
    "durationSec": 161,
    "mp3": "/music/n/n26.mp3"
  },
  {
    "id": "n27",
    "title": "追跡者",
    "title_en": "The Pursuer",
    "description": "静寂の夜を引き裂くように、闇の底から少しずつ迫りくる恐ろしい足音。\n背筋を凍らせる不気味な気配が、逃れられない破滅の運命を執拗に追い詰めます。\n息を呑む緊迫感の果てに、唐突で残酷な「襲撃」が待ち受ける極限のホラーサウンド。",
    "description_en": "Dreadful footsteps creeping from the depths of darkness, splitting the silence of night. An eerie presence closes in on inescapable doom. Extreme horror building to a sudden, cruel ambush.",
    "feeling": [
      "suspense",
      "scary"
    ],
    "style": [
      "medieval",
      "western_horror"
    ],
    "scene": [
      "night",
      "boss",
      "battle"
    ],
    "story": [
      "pursuit",
      "destiny",
      "omen",
      "conspiracy",
      "defeat",
      "despair"
    ],
    "duration": "0:29",
    "durationSec": 29,
    "mp3": "/music/n/n27.mp3"
  },
  {
    "id": "n28",
    "title": "飛翔",
    "title_en": "Ascent",
    "description": "巨大な竜が天を舞い、気高く空を切り裂くような大きなスケールのオーケストラ。\n勇壮な旋律が極限の緊迫感をはらみながら、壮絶なる空中戦の世界へと誘います。\n揺るぎない決意を胸に、強大な運命へと立ち向かっていく熱きバトルテーマ。",
    "description_en": "A massive orchestral theme soaring like a great dragon cleaving the sky. Heroic melodies charged with tension draw the listener into a spectacular aerial battle of unyielding resolve.",
    "feeling": [
      "epic",
      "suspense",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "battle",
      "boss",
      "field",
      "dungeon",
      "travel",
      "samurai"
    ],
    "story": [
      "victory",
      "destiny",
      "resolve",
      "pursuit"
    ],
    "duration": "4:21",
    "durationSec": 261,
    "mp3": "/music/n/n28.mp3"
  },
  {
    "id": "n29",
    "title": "風船カーニバル",
    "title_en": "Balloon Carnival",
    "description": "色とりどりの風船が空へ舞い上がるような、明るくとても楽しいカーニバルBGM。\n平和な街の賑わいや、心待ちにしていた再会の喜びに胸を躍らせる愛らしいメロディ。\n希望にあふれるオープニングや、大団円を笑顔で締めくくるエンディングにぴったりです。",
    "description_en": "A bright, joyful carnival BGM where colorful balloons float skyward. Cheerful melodies capture the delight of festive streets, long-awaited reunions, and celebrations brimming with hope and laughter.",
    "feeling": [
      "happy",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening",
      "ending",
      "festival",
      "town",
      "village"
    ],
    "story": [
      "reunion",
      "peaceful",
      "dailylife",
      "dream",
      "hope"
    ],
    "duration": "1:10",
    "durationSec": 70,
    "mp3": "/music/n/n29.mp3"
  },
  {
    "id": "n30",
    "title": "死神の斧",
    "title_en": "Reaper's Axe",
    "description": "逃げ場のない洋館に響き渡る、徐々に迫りくる「死神」の重たい足音。\n聴く者をじわじわと恐怖のどん底へと追い詰める、恐ろしいホラーサウンド。\n回避できぬ敗北と死の運命を突きつけられる、極限のサスペンス・逃走劇です。",
    "description_en": "Heavy footsteps of the Reaper echo through a mansion with no escape. A terrifying horror sound that drags the listener to the depths of dread. major suspense of inescapable defeat and death.",
    "feeling": [
      "scary",
      "suspense",
      "dark"
    ],
    "style": [
      "medieval",
      "western_horror"
    ],
    "scene": [
      "night",
      "battle"
    ],
    "story": [
      "pursuit",
      "defeat",
      "conspiracy",
      "omen",
      "destiny"
    ],
    "duration": "0:48",
    "durationSec": 48,
    "mp3": "/music/n/n30.mp3"
  },
  {
    "id": "n31",
    "title": "精霊の街",
    "title_en": "Spirit Town",
    "description": "透き通るような歌声が、静寂に閉ざされたファンタジーの世界へといざなう平和な旋律。\n木漏れ日の射す森や、古の神聖な場所で密やかに行われる精霊たちの営みを想わせます。\n聴く者の心を満たし、ノスタルジックな優しさでそっと癒やしてくれる癒やしのサウンド。",
    "description_en": "A crystalline voice beckons into a peaceful fantasy world cloaked in silence. Sunlit forests and sacred places hum with the quiet life of spirits. A nostalgic, healing sound that soothes the soul.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "medieval",
      "celtic"
    ],
    "scene": [
      "town",
      "forest",
      "ruins",
      "cave",
      "shrine",
      "snow",
      "night"
    ],
    "story": [
      "peaceful",
      "memory",
      "dream",
      "flashback"
    ],
    "duration": "3:06",
    "durationSec": 186,
    "mp3": "/music/n/n31.mp3"
  },
  {
    "id": "n32",
    "title": "One's believes",
    "title_en": "One's Believes",
    "description": "人の命が熱く激しく燃え盛る様を描き出した、壮大で勇壮なオーケストラ。\n抗えない運命の哀しみを乗り越え、それぞれの「信じるもの」のために剣を握る決意。\n輝かしい希望と勝利、そして決して切れない絆をドラマチックに賛美する一曲です。",
    "description_en": "A grand orchestra depicting the fierce blaze of human life. Overcoming sorrow, warriors grip their swords for what they believe in. A dramatic anthem of hope, victory, and unbreakable bonds.",
    "feeling": [
      "epic",
      "sad",
      "suspense"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "battle",
      "opening",
      "samurai"
    ],
    "story": [
      "hope",
      "bonds",
      "resolve",
      "destiny",
      "dream",
      "victory"
    ],
    "duration": "1:37",
    "durationSec": 97,
    "mp3": "/music/n/n32.mp3"
  },
  {
    "id": "n33",
    "title": "悠久の絆",
    "title_en": "Eternal Bond",
    "description": "One's believes のしっとり版。ピアノとバイオリンの静かでロマンティックな曲",
    "description_en": "A softer arrangement of One's Believes. A quiet, romantic piece for piano and violin, gentle and intimate.",
    "feeling": [
      "sad",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night"
    ],
    "story": [
      "memory",
      "reunion",
      "farewell",
      "peaceful",
      "dream",
      "hope",
      "flashback"
    ],
    "duration": "2:12",
    "durationSec": 132,
    "mp3": "/music/n/n33.mp3"
  },
  {
    "id": "n34",
    "title": "受け継がれた想い",
    "title_en": "A Legacy Passed On",
    "description": "One's believes のエンディング風。ピアノで静かに始まり、ラストはドラマティックに盛り上がります",
    "description_en": "An ending-style arrangement of One's Believes. Opens with soft piano and builds to a dramatic, stirring finale.",
    "feeling": [
      "epic",
      "sad",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "ending"
    ],
    "story": [
      "memory",
      "victory",
      "reunion",
      "farewell",
      "defeat",
      "resolve",
      "destiny",
      "flashback",
      "hope",
      "bonds"
    ],
    "duration": "2:54",
    "durationSec": 174,
    "mp3": "/music/n/n34.mp3"
  },
  {
    "id": "n35",
    "title": "ボクハロボ",
    "title_en": "I Am Robot",
    "description": "冷たい解体工場で、終わりを静かに待つロボットをモチーフにしたエレクトロサウンド。\n無機質な電子音の中に、どこか人間のような温もりと哀愁を感じさせる不思議な旋律です。\n雪の降る夜や、近未来の廃墟で過去の記憶をたどるような、静謐で切ない情景に。",
    "description_en": "Electronic sound of a robot quietly awaiting its end in a cold dismantling factory. Amid sterile tones, a strange warmth and melancholy linger. For snowy nights and futuristic ruins.",
    "feeling": [
      "mysterious",
      "sad",
      "dark"
    ],
    "style": [
      "futuristic",
      "electronic",
      "modern"
    ],
    "scene": [
      "ruins",
      "night",
      "snow"
    ],
    "story": [
      "dream",
      "flashback",
      "omen",
      "farewell"
    ],
    "duration": "3:45",
    "durationSec": 225,
    "mp3": "/music/n/n35.mp3"
  },
  {
    "id": "n36",
    "title": "作戦会議",
    "title_en": "War Council",
    "description": "開戦の時をじっと待つような、静かな緊迫感と高揚感が入り混じるファンタジーBGM。\n運命を決める重大な決断に向け、戦士たちが静かに闘志を燃やしていく姿を描いています。\nケルトの響きを取り入れた勇ましいメロディが、物語の幕開けや出陣シーンに力強さを添えます。",
    "description_en": "A fantasy BGM blending quiet tension with rising anticipation as warriors await battle. Celtic-infused melodies add valiant strength to fateful decisions and marching to war.",
    "feeling": [
      "epic",
      "suspense"
    ],
    "style": [
      "fantasy",
      "medieval",
      "celtic"
    ],
    "scene": [
      "battle",
      "opening",
      "samurai"
    ],
    "story": [
      "conspiracy",
      "destiny",
      "resolve"
    ],
    "duration": "1:54",
    "durationSec": 114,
    "mp3": "/music/n/n36.mp3"
  },
  {
    "id": "n37",
    "title": "ハンター見習い",
    "title_en": "Apprentice Hunter",
    "description": "木の葉がそよぐ森の小道を、幼いハンターが跳ねるように駆けていく軽快なBGM。\n小動物たちと目が合うたびちょっぴりドキドキする、微笑ましい冒険心を描いています。\n村の日常や子供キャラクターの登場シーンに、ほっこりとした温かさを添えます。",
    "description_en": "A lighthearted BGM of a young hunter bounding along a leafy forest path. Tiny adventures and the thrill of meeting woodland creatures fill every note with gentle warmth and innocent wonder.",
    "feeling": [
      "happy",
      "gentle",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest",
      "village",
      "town",
      "onsen"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "1:45",
    "durationSec": 105,
    "mp3": "/music/n/n37.mp3"
  },
  {
    "id": "n38",
    "title": "時代の再臨",
    "title_en": "Return of the Age",
    "description": "時の底から這い上がるような重厚な旋律が、暗闇の中で静かに膨らんでいきます。\n避けられない運命の扉が開く瞬間、大地を揺るがす何かが目を覚ます緊迫のシーンに。\nボス戦の幕開けや、古代の封印が解かれる演出に力強い迫力を与える一曲です。",
    "description_en": "A weighty melody crawling up from the depths of time, swelling quietly in the darkness. Something ancient stirs as the doors of fate swing open. A powerful piece for boss reveals and broken seals.",
    "feeling": [
      "epic",
      "mysterious",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "oriental"
    ],
    "scene": [
      "battle",
      "boss",
      "dungeon"
    ],
    "story": [
      "omen",
      "destiny",
      "conspiracy",
      "pursuit"
    ],
    "duration": "2:14",
    "durationSec": 134,
    "mp3": "/music/n/n38.mp3"
  },
  {
    "id": "n39",
    "title": "夜桜小路",
    "title_en": "Night Cherry Blossom Path",
    "description": "夜の境内に流れる笛の音と、淡く散る花びらが折り重なる幻想的な和の情景。\n浴衣姿でそっと寄り添う二人、縁日の提灯の灯りに頬が赤らむロマンティックな夜。\n夏祭りや和風の恋物語、懐かしい故郷のシーンにぴったりな一曲です。",
    "description_en": "Flute notes drift through a shrine at night as pale petals scatter in an enchanting Japanese scene. Two figures in yukata beneath festival lanterns share a romantic evening.",
    "feeling": [
      "gentle",
      "happy",
      "cute"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "night",
      "festival",
      "village",
      "onsen",
      "shrine"
    ],
    "story": [
      "memory",
      "reunion",
      "peaceful",
      "dream",
      "dailylife",
      "bonds",
      "hope",
      "flashback"
    ],
    "duration": "1:47",
    "durationSec": 107,
    "mp3": "/music/n/n39.mp3"
  },
  {
    "id": "n40",
    "title": "靄中の刺客",
    "title_en": "Assassin in the Mist",
    "description": "霧に包まれた夜道に、足音ひとつなく近づいてくる影の気配を描いたサスペンスBGM。\n張り詰めた空気の中、刹那の判断が命運を分ける緊迫した対峙のシーンに重なります。\n謎の暗殺者との激突や、陰謀渦巻くボス戦の演出に向いている緊張感を持つ一曲です。",
    "description_en": "A shadow approaches without a sound on a fog-shrouded night road. In a single breath, life hangs in the balance. Taut tension for assassin encounters and conspiratorial boss battles.",
    "feeling": [
      "suspense",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "battle",
      "night",
      "boss"
    ],
    "story": [
      "conspiracy",
      "omen",
      "pursuit"
    ],
    "duration": "2:20",
    "durationSec": 140,
    "mp3": "/music/n/n40.mp3"
  },
  {
    "id": "n41",
    "title": "試練との対峙",
    "title_en": "Facing the Trial",
    "description": "冷たい夜の戦場に響く重厚な行軍のリズム、悲哀と覚悟が一つに混ざり合う壮絶な曲。\n逃げ場のない試練に静かに向き合う戦士の姿が、弦楽の沈鬱な旋律に刻み込まれています。\n決戦前の静寂、甲冑の重さを感じる中世・侍の戦いシーンに重みを加えます。",
    "description_en": "A solemn march resounds across a cold battlefield as grief and resolve merge into one. Strings carve the image of a warrior silently facing an inescapable trial. Medieval weight for decisive battles.",
    "feeling": [
      "epic",
      "suspense",
      "sad"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "battle",
      "night",
      "samurai"
    ],
    "story": [
      "resolve",
      "destiny"
    ],
    "duration": "2:56",
    "durationSec": 176,
    "mp3": "/music/n/n41.mp3"
  },
  {
    "id": "n42",
    "title": "村まつり",
    "title_en": "Village Festival",
    "description": "小さな神社の境内に鈴の音と太鼓が響き、村人たちが笑顔で踊り始める朗らかな和風曲。\n焼きそばの煙、子どもたちの歓声、ゆったりとした田舎の空気がいきいきと漂ってきます。\n村祭りの日常シーンや、ほのぼのとした和のコミュニティの演出にぴったりです。",
    "description_en": "Bells and drums ring out at a small shrine as villagers dance with joy in this cheerful Japanese folk piece. Festival aromas and children's laughter fill the warm countryside air.",
    "feeling": [
      "happy",
      "gentle",
      "cute"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "village",
      "festival",
      "shrine",
      "onsen"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "1:59",
    "durationSec": 119,
    "mp3": "/music/n/n42.mp3"
  },
  {
    "id": "n43",
    "title": "静かに",
    "title_en": "Tiptoe",
    "description": "爪先立ちで忍び足、ちょっぴり緊張した目つきがなんとも可愛いユーモラスなBGM。\n見つかってはいけない！というドキドキ感を、軽やかな木管楽器が絶妙に表現します。\n忍び込みシーンや、キャラクターがこっそり動く場面のコミカルな演出にぴったりです。",
    "description_en": "A humorous, endearing BGM of tiptoeing on edge. Light woodwinds perfectly capture the thrill of sneaking around undetected. Ideal for comical stealth scenes and characters creeping through the shadows.",
    "feeling": [
      "happy",
      "suspense",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest",
      "village",
      "town"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "1:40",
    "durationSec": 100,
    "mp3": "/music/n/n43.mp3"
  },
  {
    "id": "n44",
    "title": "殺した",
    "title_en": "The Killing",
    "description": "タンゴの歪んだリズムに、血の匂いが漂うような不気味な弦楽が絡み合う戦慄のBGM。\n笑いと恐怖が紙一重で共存する、どこか芝居がかった悲劇の一場面を描き出します。\nミステリアスな殺人劇や、ダークコメディの恐ろしい場面転換に独特の雰囲気を添えます。",
    "description_en": "Sinister strings entwine with a twisted tango rhythm, reeking of blood. Laughter and terror coexist on a razor's edge in this theatrical tragedy. Uniquely atmospheric for dark mysteries and macabre comedy.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "medieval",
      "western_horror"
    ],
    "scene": [
      "night",
      "dungeon"
    ],
    "story": [
      "defeat",
      "farewell",
      "conspiracy"
    ],
    "duration": "3:06",
    "durationSec": 186,
    "mp3": "/music/n/n44.mp3"
  },
  {
    "id": "n45",
    "title": "いつか王子様（シンプルVer）",
    "title_en": "Someday My Prince",
    "description": "朝霧に包まれた森の中、遠くの夢を思い描くように静かに流れる繊細なピアノの旋律。\n淡い恋心と、いつか訪れるはずの奇跡をそっと信じる純粋な心を寄り添うように包みます。\nロマンティックな場面転換や、夢の中で起こる出会いのシーンに柔らかい光を添えます。",
    "description_en": "A delicate piano melody drifts through a misty morning forest, quietly dreaming of faraway wishes. It embraces a pure heart believing in a miracle yet to come. Soft light for romantic moments.",
    "feeling": [
      "gentle",
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "town",
      "forest",
      "snow"
    ],
    "story": [
      "dream",
      "peaceful",
      "reunion",
      "memory",
      "flashback",
      "hope",
      "bonds"
    ],
    "duration": "1:29",
    "durationSec": 89,
    "mp3": "/music/n/n45.mp3"
  },
  {
    "id": "n46",
    "title": "Dear Childhood Friend",
    "title_en": "Dear Childhood Friend",
    "description": "夏の青空と風鈴の音色、幼い日の遊び相手と駆けた田んぼの畦道が蘇る和風BGM。\n遠い故郷を想うノスタルジアと、もう一度あの日に戻りたいという切ない望郷の念が溶け合います。\n夏祭りの回想シーンや、ふるさとへの旅立ち・再会の場面に深い情感を与えます。",
    "description_en": "Wind chimes and blue summer skies summon memories of running along rice-paddy paths with a childhood friend. Nostalgia and longing for home blend in this bittersweet Japanese piece.",
    "feeling": [
      "happy",
      "gentle",
      "sad"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "festival",
      "village",
      "travel",
      "forest",
      "shrine",
      "onsen"
    ],
    "story": [
      "memory",
      "reunion",
      "peaceful",
      "dailylife",
      "dream",
      "hope",
      "bonds"
    ],
    "duration": "3:07",
    "durationSec": 187,
    "mp3": "/music/n/n46.mp3"
  },
  {
    "id": "n47",
    "title": "瑠璃の森",
    "title_en": "Lapis Forest",
    "description": "太古の静寂が今もそのままに眠る、深い瑠璃色の森に立ち込める幻想的な霧の音楽。\n長い歴史を目撃してきた大樹が、ざわめくように語りかけてくる神秘の気配を纏います。\n古の遺跡や妖精が宿る聖域、ファンタジーの異空間シーンの演出に静謐な深みを加えます。",
    "description_en": "Mystical fog music lingering in a deep lapis-blue forest where primordial silence still sleeps. Ancient trees murmur secrets witnessed across millennia. Serene depth for ruins, fairy sanctuaries, and otherworldly realms.",
    "feeling": [
      "gentle",
      "mysterious",
      "dark"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest",
      "village",
      "night",
      "shrine",
      "snow"
    ],
    "story": [
      "peaceful",
      "flashback"
    ],
    "duration": "3:10",
    "durationSec": 190,
    "mp3": "/music/n/n47.mp3"
  },
  {
    "id": "n48",
    "title": "魔法都市の繁華街",
    "title_en": "Magic City Bazaar",
    "description": "賑やかな露店の声と奇妙な呪文が飛び交う、魔法と欺瞞が渦巻く活気あふれる街の音楽。\n怪しい商人が並ぶ裏通りの喧騒と、夢と罠が紙一重で共存する不思議な興奮感を描きます。\nRPGの魔法都市ステージや、妖しい祭りの繁華街シーンにぴったりの個性的な一曲です。",
    "description_en": "Lively market music where strange spells and merchant calls fill the air. Dreams and traps coexist in a bustling magical city of wonder and deception. A vibrant, distinctive piece for enchanted bazaars.",
    "feeling": [
      "happy",
      "scary"
    ],
    "style": [
      "fantasy",
      "medieval",
      "western_horror"
    ],
    "scene": [
      "town",
      "mansion"
    ],
    "story": [
      "dailylife",
      "peaceful",
      "dream",
      "omen",
      "conspiracy",
      "hope"
    ],
    "duration": "2:23",
    "durationSec": 143,
    "mp3": "/music/n/n48.mp3"
  },
  {
    "id": "n49",
    "title": "霊界の扉",
    "title_en": "Gate to the Spirit World",
    "description": "歪んだピアノの音が暗闇の中を滑るように響き、禁忌の扉がゆっくりと開いていく恐怖。\n何かに呪われた邸宅の奥深く、冷気と共に立ち上る霊気が見えない何かを連れてきます。\nホラーゲームの謎解きシーンや、呪いと霊現象が絡む演出に息を呑む緊張感を与えます。",
    "description_en": "A warped piano glides through darkness as a forbidden gate slowly creaks open. Deep within a cursed mansion, spectral chill summons something unseen. Breathless tension for horror puzzles and supernatural encounters.",
    "feeling": [
      "mysterious",
      "dark",
      "scary"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "dungeon",
      "mansion",
      "ruins",
      "night"
    ],
    "story": [
      "conspiracy",
      "omen"
    ],
    "duration": "0:34",
    "durationSec": 34,
    "mp3": "/music/n/n49.mp3"
  },
  {
    "id": "n50",
    "title": "閉ざされた世界",
    "title_en": "Sealed World",
    "description": "灰色の壁に閉ざされ、音も光も届かない孤独な世界をピアノが淡々と描き出します。\n深夜に一人向き合う鬱屈した感情、出口の見えない憂鬱と諦めの重さが静かに積もっていきます。\n現代的な孤立感や、キャラクターの内面崩壊を描く重厚なシーンに寄り添う一曲です。",
    "description_en": "A piano paints a grey, sealed world where neither sound nor light can reach. Solitary anguish and the weight of despair quietly accumulate in the dead of night. A heavy piece for isolation and inner collapse.",
    "feeling": [
      "sad",
      "dark"
    ],
    "style": [
      "modern"
    ],
    "scene": [
      "night"
    ],
    "story": [
      "defeat",
      "farewell",
      "flashback"
    ],
    "duration": "2:15",
    "durationSec": 135,
    "mp3": "/music/n/n50.mp3"
  },
  {
    "id": "n51",
    "title": "伝承の丘",
    "title_en": "Hill of Legends",
    "description": "ハープの透き通る音が丘の草原を渡り、遥か彼方の伝説を静かに語り始めるケルティックBGM。\n幾千年の記憶が眠る場所で、英雄たちの名前が風の中にそっと刻まれていく壮大な余韻。\nアース製薬「はだもの」TVCMにも採用された一曲で、物語の幕引きや感動的なエンディング、旅の終わりに合う強いなスケール感を持ちます。",
    "description_en": "Crystalline harp drifts across a hilltop meadow, softly recounting ancient legends. Heroes' names are etched into the wind across millennia. A sweeping Celtic piece for triumphant endings and the close of a journey.",
    "feeling": [
      "epic",
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "medieval",
      "celtic"
    ],
    "scene": [
      "ending",
      "field",
      "forest",
      "night",
      "travel",
      "ruins",
      "snow",
      "opening",
      "shrine"
    ],
    "story": [
      "reunion",
      "peaceful",
      "farewell",
      "memory",
      "dream",
      "destiny",
      "resolve",
      "omen",
      "bonds",
      "hope",
      "flashback"
    ],
    "duration": "2:44",
    "durationSec": 164,
    "mp3": "/music/n/n51.mp3"
  },
  {
    "id": "n52",
    "title": "ハイホー",
    "title_en": "Hi-Ho",
    "description": "「ハイホー、ハイホー」と弾む足取りで、小さな仲間たちが陽気に行進するインストBGM。\n白雪姫のミュージカルのために生まれた愉快な旋律が、舞台の上に生き生きとした活気を運びます。\nファンタジーの行進シーンや、賑やかなパレード・開幕の演出に楽しさを添えます。",
    "description_en": "A merry instrumental march where cheerful companions stride along with a spring in their step. A lively melody born for a Snow White musical, bringing vibrant energy to fantasy parades and festive opening scenes.",
    "feeling": [
      "happy"
    ],
    "style": [
      "medieval"
    ],
    "scene": [
      "festival"
    ],
    "story": [
      "dream"
    ],
    "duration": "2:38",
    "durationSec": 158,
    "mp3": "/music/n/n52.mp3"
  },
  {
    "id": "n53",
    "title": "いつか王子様（エンディングVer）",
    "title_en": "Someday My Prince (Ending)",
    "description": "すべてが丸く収まったあと、ふと振り返る懐かしい日々をやさしく奏でるエンディングBGM。\n窓の外に舞う雪を眺めながら、胸の中に温かく灯り続ける思い出をそっと噛み締める夜。\nハッピーエンドの余韻を引き立てる、物語の締めくくりに誰もが微笑む幸せな一曲です。",
    "description_en": "A gentle ending BGM reflecting on cherished days after everything has fallen into place. Watching snow drift past the window, savoring warm memories in the quiet of night. A blissful piece for happy endings.",
    "feeling": [
      "gentle",
      "happy"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "ending",
      "snow",
      "mansion",
      "town"
    ],
    "story": [
      "memory",
      "victory",
      "reunion",
      "hope",
      "dream",
      "peaceful"
    ],
    "duration": "3:50",
    "durationSec": 230,
    "mp3": "/music/n/n53.mp3"
  },
  {
    "id": "n54",
    "title": "夢見る街",
    "title_en": "Dreaming Town",
    "description": "雪降る夜空の向こう、キラキラと輝く星たちが眠れぬ街をそっと見守る幻想的なBGM。\nクリスマスの静寂に包まれた路地に、遠い夢と温かい奇跡の気配がゆっくりと満ちていきます。\n冬の夜祭りや夢の中の街並み、ファンタジックな夜景シーンに夢幻の彩りを与えます。",
    "description_en": "A fantastical BGM where twinkling stars watch over a sleepless town beneath a snowy night sky. Distant dreams and the warmth of small miracles fill a Christmas-hushed alley. Dreamlike winter enchantment.",
    "feeling": [
      "gentle",
      "mysterious",
      "happy",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night",
      "festival",
      "snow",
      "forest",
      "onsen"
    ],
    "story": [
      "dream",
      "dailylife",
      "peaceful",
      "reunion",
      "memory"
    ],
    "duration": "3:49",
    "durationSec": 229,
    "mp3": "/music/n/n54.mp3"
  },
  {
    "id": "n55",
    "title": "隠密",
    "title_en": "Shadow Operative",
    "description": "尺八と太鼓が静かに刻む緊迫のリズム、夜陰に紛れて動く忍者の息をひそめた気配。\n闇の中に溶け込み、気配を消して標的に近づく隠密行動のスリルを凝縮した和風曲です。\n忍びの潜入シーンや、夜の祭りに潜む謀略、緊迫した陰謀劇の演出に向いています。",
    "description_en": "Shakuhachi and taiko mark a tense rhythm as a ninja moves unseen through the shadows. A Japanese-style piece distilling the thrill of stealth and silent approach under cover of darkness.",
    "feeling": [
      "suspense",
      "epic"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "night",
      "samurai",
      "shrine",
      "festival"
    ],
    "story": [
      "conspiracy",
      "omen"
    ],
    "duration": "0:33",
    "durationSec": 33,
    "mp3": "/music/n/n55.mp3"
  },
  {
    "id": "n56",
    "title": "竜の嘶き",
    "title_en": "Dragon's Roar",
    "description": "低く重なる太鼓と尺八が、天を揺るがす龍の嘶きのような凄みある和の壮大さを放ちます。\n巨大な存在の目覚め、神話の時代から続く因縁の扉が開く瞬間に合う荘厳さです。\n和風ラスボスの登場や、伝説の封印が解かれるオープニングシーンに独特の迫力を加えます。",
    "description_en": "Deep taiko and shakuhachi unleash the awe of a dragon's roar shaking the heavens. Solemn grandeur befitting the awakening of a mythic being and the opening of ancient, fateful gates.",
    "feeling": [
      "epic",
      "dark",
      "mysterious",
      "suspense"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "opening",
      "samurai",
      "boss",
      "night"
    ],
    "story": [
      "omen",
      "conspiracy",
      "destiny",
      "resolve"
    ],
    "duration": "2:19",
    "durationSec": 139,
    "mp3": "/music/n/n56.mp3"
  },
  {
    "id": "n57",
    "title": "酒盛り",
    "title_en": "Sake Gathering",
    "description": "琴の軽やかな音色と共に、宴の座敷に笑い声と杯の音が弾む和の祝い曲。\n肩を組んで歌い合う仲間たちの顔に灯りが映え、和気藹々とした夜の宴が目に浮かびます。\n村の祭りや武士の宴席、和風の賑やかな宴会シーンにほっこりとした温もりを添えます。",
    "description_en": "Koto notes dance through a lively banquet hall filled with laughter and clinking sake cups. Comrades sing arm in arm as lantern light warms their faces. A cozy Japanese celebration scene.",
    "feeling": [
      "happy",
      "gentle",
      "cute"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "festival",
      "night"
    ],
    "story": [
      "peaceful"
    ],
    "duration": "2:13",
    "durationSec": 133,
    "mp3": "/music/n/n57.mp3"
  },
  {
    "id": "n58",
    "title": "ガラクタ置き場",
    "title_en": "Junkyard Elegy",
    "description": "誰かに捨てられた機械の残骸が、静かな雨の夜に錆びついた時間を刻んでいる哀愁のBGM。\n役目を終えたガラクタたちが穏やかに眠る廃墟に、忘れられた命の温もりがほのかに残ります。\nSF的廃墟のナレーション映像や、近未来の記憶を辿る切ないシーンに余韻を与えます。",
    "description_en": "Melancholy BGM of abandoned machine remains marking rusted time on a quiet rainy night. A faint warmth of forgotten lives lingers among the gently sleeping wreckage. Elegy for sci-fi ruins and lost memories.",
    "feeling": [
      "sad",
      "gentle",
      "mysterious"
    ],
    "style": [
      "futuristic",
      "modern"
    ],
    "scene": [
      "forest",
      "night",
      "ruins",
      "shrine",
      "snow"
    ],
    "story": [
      "memory",
      "peaceful",
      "dailylife",
      "dream",
      "hope",
      "flashback"
    ],
    "duration": "2:07",
    "durationSec": 127,
    "mp3": "/music/n/n58.mp3"
  },
  {
    "id": "n59",
    "title": "花よ川よこの大地よ",
    "title_en": "Flowers, Rivers, and Earth",
    "description": "和楽器の音色に乗せて、花が咲き川が流れ風が吹き抜ける大地の美しさを讃える民謡風曲。\n代々受け継がれてきた村の歌声のように、純粋で力強い自然への愛情が胸に染み渡ります。\n和風の物語における大地のエンディングや、日本の原風景を描くシーンに深い感動を呼びます。",
    "description_en": "A folk-style piece sung through traditional Japanese instruments, praising the beauty of blossoming flowers, flowing rivers, and the wind-swept earth. Pure, heartfelt love for nature passed down through generations.",
    "feeling": [
      "gentle",
      "epic",
      "sad",
      "mysterious"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "village",
      "field",
      "forest",
      "night",
      "snow",
      "onsen",
      "shrine",
      "ending"
    ],
    "story": [
      "peaceful",
      "memory",
      "reunion",
      "dream",
      "hope"
    ],
    "duration": "3:56",
    "durationSec": 236,
    "mp3": "/music/n/n59.mp3"
  },
  {
    "id": "n60",
    "title": "黄昏の影絵",
    "title_en": "Twilight Silhouette",
    "description": "夕暮れの橙と影が交差する路地に、かつての笑顔が影絵のように浮かんでは消えていく。\n取り戻せない日々への悲哀と、それでも美しかったと思える優しさが静かに胸を締め付けます。\n別れのシーンや回想、物語後半の切ない場面転換に感情を揺さぶる余韻を添えます。",
    "description_en": "In an alley where twilight orange and shadow cross, remembered smiles flicker like silhouettes and fade. Grief for irretrievable days, tempered by a gentle beauty. Stirring emotion for farewells and reflections.",
    "feeling": [
      "sad",
      "gentle",
      "dark"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night"
    ],
    "story": [
      "memory",
      "farewell",
      "defeat",
      "flashback",
      "dream"
    ],
    "duration": "2:15",
    "durationSec": 135,
    "mp3": "/music/n/n60.mp3"
  },
  {
    "id": "n61",
    "title": "天地に咲く華",
    "title_en": "Blossoms of Heaven and Earth",
    "description": "「花よ川よこの大地よ」の別アレンジ。ピアノの静けさから始まり、やがて天地を揺るがす感動へ。\n雪降る森の中で静かに咲く花のように、すべての命の美しさを慈しむ壮大なエンディング曲。\n物語の大団円、日本の大地と命をテーマにした感動的なフィナーレによく合う一曲です。",
    "description_en": "An alternate arrangement of Flowers, Rivers, and Earth. Beginning with quiet piano, it builds to an earth-shaking crescendo. A grand finale cherishing the beauty of all life, like a flower blooming silently in snow.",
    "feeling": [
      "epic",
      "gentle",
      "sad",
      "mysterious"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "ending",
      "snow",
      "forest"
    ],
    "story": [
      "victory",
      "peaceful",
      "reunion",
      "memory",
      "dream",
      "hope",
      "flashback",
      "destiny"
    ],
    "duration": "3:07",
    "durationSec": 187,
    "mp3": "/music/n/n61.mp3"
  },
  {
    "id": "n62",
    "title": "草原をゆく",
    "title_en": "Across the Meadow",
    "description": "ケルト笛の明るいメロディーが草原の風となって吹き抜ける、躍動感あふれる冒険のBGM。\n草を踏む足が自然と速くなるような前向きなエネルギーが、フィールドを駆ける喜びを描きます。\nワールドマップの移動シーンや、次なる冒険地へ向かう旅立ちの場面に爽快な勢いを与えます。",
    "description_en": "A Celtic flute melody races like wind across the meadow in this spirited adventure BGM. Forward-driving energy captures the joy of sprinting through open fields. Invigorating music for journeys and new horizons.",
    "feeling": [
      "happy",
      "epic"
    ],
    "style": [
      "fantasy",
      "celtic"
    ],
    "scene": [
      "field",
      "travel",
      "forest",
      "battle",
      "ruins"
    ],
    "story": [
      "victory",
      "dailylife",
      "resolve",
      "omen",
      "pursuit"
    ],
    "duration": "2:03",
    "durationSec": 123,
    "mp3": "/music/n/n62.mp3"
  },
  {
    "id": "n63",
    "title": "Ancient Technology",
    "title_en": "Ancient Technology",
    "description": "電子音と古代の響きが奇妙に溶け合い、失われた文明の謎が暗闇から問いかけてくるBGM。\n光の届かない遺跡の奥深く、機械と魔法が混在する禁断のテクノロジーの気配が立ち込めます。\nSF廃墟の探索シーンや、古代遺物を巡る謎解きシーンに不穏な緊張感を与えます。",
    "description_en": "Electronic and ancient tones merge eerily as a lost civilization's mysteries whisper from the darkness. Deep within lightless ruins, forbidden technology of machine and magic stirs. Unsettling tension for exploration.",
    "feeling": [
      "mysterious",
      "suspense",
      "dark"
    ],
    "style": [
      "futuristic",
      "electronic",
      "fantasy",
      "modern"
    ],
    "scene": [
      "dungeon",
      "ruins",
      "cave",
      "night"
    ],
    "story": [
      "pursuit",
      "omen"
    ],
    "duration": "2:47",
    "durationSec": 167,
    "mp3": "/music/n/n63.mp3"
  },
  {
    "id": "n64",
    "title": "月夜の航路",
    "title_en": "Moonlit Voyage",
    "description": "月明かりだけを頼りに進む船が、静かな水面の揺れと共に夜の旅を続けていく神秘的な曲。\nうっすらと灯る燈籠の光が水面を照らし、行き先のわからぬ暗がりの中に美しさを見出します。\n夜の水路や洞窟内の舟旅、幻想的な月夜の探索シーンに幽玄な雰囲気を与えます。",
    "description_en": "A mystical piece following a boat guided only by moonlight across still waters. Faint lantern glow illuminates the surface, finding beauty within the unknown dark. Ethereal atmosphere for nocturnal waterway voyages.",
    "feeling": [
      "gentle",
      "mysterious",
      "dark"
    ],
    "style": [
      "fantasy",
      "oriental"
    ],
    "scene": [
      "night",
      "travel",
      "forest",
      "cave",
      "ruins"
    ],
    "story": [
      "memory",
      "flashback",
      "dream",
      "omen"
    ],
    "duration": "2:15",
    "durationSec": 135,
    "mp3": "/music/n/n64.mp3"
  },
  {
    "id": "n65",
    "title": "砂塵の城塞",
    "title_en": "Desert Fortress",
    "description": "砂嵐が舞い上がる荒野の城塞に、剣戟と怒号が響き渡るドラマティックな戦闘曲。\n風化した石壁の向こうに潜む強大な敵との死闘、勝負の帰趨を左右する一撃の瞬間。\nボス戦や激しい野外バトルのオープニング、史劇の戦場シーンに大きな迫力を添えます。",
    "description_en": "A dramatic battle theme where sword clashes and war cries echo across a desert fortress swept by sandstorms. The decisive strike that turns the tide. powerful force for boss fights and epic battlefields.",
    "feeling": [
      "epic",
      "suspense"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "battle",
      "boss",
      "field",
      "opening",
      "samurai"
    ],
    "story": [
      "victory",
      "resolve",
      "destiny"
    ],
    "duration": "2:02",
    "durationSec": 122,
    "mp3": "/music/n/n65.mp3"
  },
  {
    "id": "n66",
    "title": "楽園の午後",
    "title_en": "Paradise Afternoon",
    "description": "アコーディオンが弾む明るい3拍子に乗って、日差しの中で猫が無邪気に遊ぶ午後の楽曲。\n窓から差し込む温かな光と、のんびりしたワルツのリズムが心地よい平和な午後を描きます。\n物語ののほほんとしたオープニングやエンディング、日常の安らぎシーンに微笑みを添えます。",
    "description_en": "A bright accordion waltz where a cat plays lazily in the afternoon sun. Warm light streams through the window as a gentle three-beat rhythm paints a blissfully peaceful afternoon. Pure, simple contentment.",
    "feeling": [
      "happy",
      "gentle",
      "cute"
    ],
    "style": [
      "medieval",
      "fantasy"
    ],
    "scene": [
      "opening",
      "ending"
    ],
    "story": [
      "peaceful",
      "reunion",
      "dailylife",
      "hope"
    ],
    "duration": "1:14",
    "durationSec": 74,
    "mp3": "/music/n/n66.mp3"
  },
  {
    "id": "n67",
    "title": "光芒の大地",
    "title_en": "Radiant Lands",
    "description": "水平線から光が降り注ぎ、雄大な海と空と大地が一つに溶け合う壮大な和風オープニング。\n新たな物語の始まりに合う、心が広がるような希望と運命の予感が波のように押し寄せます。\n和風ゲームや映像作品の幕開けに、視聴者の心を一気に世界観へ引き込む力強い一曲です。",
    "description_en": "Light pours from the horizon as sea, sky, and earth merge in a grand Japanese-style opening. Waves of hope and destiny sweep in, heralding the birth of a new tale. A powerful overture for Japanese stories.",
    "feeling": [
      "epic",
      "gentle",
      "mysterious"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "opening",
      "field",
      "travel"
    ],
    "story": [
      "reunion",
      "hope",
      "destiny",
      "dream"
    ],
    "duration": "0:56",
    "durationSec": 56,
    "mp3": "/music/n/n67.mp3"
  },
  {
    "id": "n68",
    "title": "月夜の森の迷い人",
    "title_en": "Lost in the Moonlit Forest",
    "description": "月光に浮かぶ木々の影が揺れ、足元の闇から何かが囁きかけてくる夜の森の神秘BGM。\n恐ろしいはずなのに目が離せない、闇の向こうに宿る不思議な美しさと得体の知れない怖さ。\nホラーテイストの夜の探索や、月夜に迷い込む幻想的・スリリングなシーンに向いています。",
    "description_en": "Tree shadows sway in moonlight as something whispers from the darkness below. A strange beauty dwells beyond the fear, captivating despite the dread. Mystical and thrilling music for moonlit forest exploration.",
    "feeling": [
      "mysterious",
      "scary",
      "suspense",
      "dark",
      "gentle"
    ],
    "style": [
      "fantasy",
      "oriental",
      "western_horror"
    ],
    "scene": [
      "forest",
      "night",
      "travel",
      "ruins",
      "cave",
      "dungeon",
      "shrine"
    ],
    "story": [
      "farewell",
      "omen",
      "pursuit"
    ],
    "duration": "1:40",
    "durationSec": 100,
    "mp3": "/music/n/n68.mp3"
  },
  {
    "id": "n69",
    "title": "紅月～あかつき～",
    "title_en": "Crimson Moon",
    "description": "暁の空に浮かぶ紅い月を見上げ、尺八の一声が決意を切り裂くように空気を震わせます。\nわずか1分の中で嵐のように変化する緊張と高揚が、和風作品のオープニングを劇的に彩ります。\nPVや予告編、侍が刀に手をかける決定的な瞬間のBGMとして独特の存在感を放ちます。",
    "description_en": "A single shakuhachi cry cuts the air beneath a crimson moon at dawn. Tension and exaltation shift like a storm within one minute. An unrivaled piece for samurai trailers and decisive moments.",
    "feeling": [
      "epic",
      "mysterious",
      "suspense"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "opening",
      "samurai",
      "cave",
      "battle",
      "night",
      "shrine"
    ],
    "story": [
      "destiny",
      "resolve",
      "omen",
      "conspiracy"
    ],
    "duration": "1:07",
    "durationSec": 67,
    "mp3": "/music/n/n69.mp3"
  },
  {
    "id": "n70",
    "title": "イノセント",
    "title_en": "Innocent",
    "description": "白い雪原に降り落ちる雪のように、ピアノの音がひとつひとつ静かに積もっていく切ない曲。\n汚れなき心が傷つき、それでも誰かを愛し続ける純粋さが旋律の中にそっと宿っています。\n別れや誤解が生む切ないシーン、純真な主人公の涙が光るオープニング・エンディングに寄り添います。",
    "description_en": "Piano notes settle like snowflakes on a white plain, each one quiet and poignant. An innocent heart that loves on despite being wounded. A tender companion for scenes of parting, misunderstanding, and pure tears.",
    "feeling": [
      "sad",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "snow",
      "travel",
      "opening",
      "ending"
    ],
    "story": [
      "memory",
      "reunion",
      "farewell",
      "bonds",
      "flashback"
    ],
    "duration": "1:29",
    "durationSec": 89,
    "mp3": "/music/n/n70.mp3"
  },
  {
    "id": "n71",
    "title": "繚乱炎武",
    "title_en": "Blaze of Battle",
    "description": "和・洋・東洋が入り混じる壮大なオーケストラが、戦場に散る命の激しさと哀しみを高らかに奏でます。\n時代の渦に飲み込まれながらも自らの志を貫く武者たちの、炎のような生き様が目に浮かびます。\n侍や戦士を主人公にした物語の戦闘シーン、重厚な歴史劇のオープニングに強い存在感を放ちます。",
    "description_en": "A grand orchestra blending Japanese, Western, and Eastern sounds, singing of lives lost and sorrows endured on the battlefield. Warriors burning with conviction despite the tides of war. Epic presence for samurai battles.",
    "feeling": [
      "epic",
      "sad",
      "suspense",
      "mysterious"
    ],
    "style": [
      "japanese",
      "fantasy",
      "medieval",
      "oriental"
    ],
    "scene": [
      "battle",
      "samurai",
      "opening",
      "ending"
    ],
    "story": [
      "resolve",
      "destiny"
    ],
    "duration": "3:01",
    "durationSec": 181,
    "mp3": "/music/n/n71.mp3"
  },
  {
    "id": "n72",
    "title": "宵祭りの風",
    "title_en": "Evening Festival Wind",
    "description": "宵闇に灯る提灯の行列と、遠くから聞こえてくる花火の音が心を揺らす夏の祭りのBGM。\n気持ちよい夜風が浴衣の袖を揺らし、屋台の焼ける甘い香りが懐かしさを呼び覚ます情景。\n夏祭りの憩いのシーン、和風恋愛や日常の記憶が交差するノスタルジックな場面に向いています。",
    "description_en": "Lantern processions and distant fireworks stir the heart on a warm summer festival evening. Night wind sways yukata sleeves as the sweet scent of food stalls awakens deep nostalgia. fitting for Japanese summer scenes.",
    "feeling": [
      "gentle",
      "happy",
      "cute"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "festival",
      "night",
      "forest",
      "village",
      "town",
      "onsen",
      "shrine",
      "snow"
    ],
    "story": [
      "peaceful",
      "memory",
      "reunion",
      "dailylife",
      "dream",
      "bonds",
      "hope",
      "flashback"
    ],
    "duration": "3:40",
    "durationSec": 220,
    "mp3": "/music/n/n72.mp3"
  },
  {
    "id": "n73",
    "title": "栄光の遺産",
    "title_en": "Glorious Legacy",
    "description": "朝の光の中でキラキラと輝くような爽やかな旋律に、どこか遠い記憶への哀愁が滲む美しい曲。\n過去の勝利と日々の暮らしが重なるような、小さな誇りと穏やかな感謝が心に広がります。\n平和な村の朝の風景や、主人公が過去を振り返る回想シーンに明るい温もりを与えます。",
    "description_en": "A bright, fresh melody with a quiet undercurrent of longing for distant memories. Small pride and gentle gratitude bloom softly. Warm morning light for peaceful villages and heroes reflecting on the past.",
    "feeling": [
      "gentle",
      "happy",
      "epic",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning",
      "snow",
      "town",
      "village",
      "field",
      "forest"
    ],
    "story": [
      "memory",
      "victory",
      "peaceful",
      "dailylife",
      "dream",
      "hope",
      "flashback"
    ],
    "duration": "2:09",
    "durationSec": 129,
    "mp3": "/music/n/n73.mp3"
  },
  {
    "id": "n74",
    "title": "Moment",
    "title_en": "Moment",
    "description": "激動の時代に咲き、潔く散っていく人の志を、和と洋の音色が変化しながら描きます。\n命の炎が燃え盛り、やがて静かに白い灰になるような余韻を持つ一曲です。\n侍の生き様を描く歴史ドラマや、主人公の決意と別れの瞬間に寄り添います。",
    "description_en": "Japanese and Western colors shift around a spirit that blooms brightly, then fades with quiet dignity. This track works for samurai drama, farewell scenes, and moments of resolve without overstating the emotion.",
    "feeling": [
      "epic",
      "sad",
      "gentle",
      "mysterious"
    ],
    "style": [
      "japanese",
      "fantasy"
    ],
    "scene": [
      "battle",
      "samurai",
      "night",
      "morning",
      "snow",
      "travel"
    ],
    "story": [
      "farewell",
      "reunion",
      "memory",
      "victory",
      "dream",
      "destiny",
      "omen",
      "resolve",
      "bonds",
      "hope",
      "flashback"
    ],
    "duration": "2:38",
    "durationSec": 158,
    "mp3": "/music/n/n74.mp3"
  },
  {
    "id": "n75",
    "title": "Moment~オルゴールVer~",
    "title_en": "Moment (Music Box)",
    "description": "「Moment」の壮大な旋律をオルゴールの繊細な音に変えた、雪の夜に合う静かな版。\nガラス越しに見える雪景色のように、切なく美しい記憶が粒ひとつひとつ丁寧に奏でられます。\n思い出を辿る回想シーンや、別れの夜の静かな情感を描くシーンに心を揺さぶる余韻を与えます。",
    "description_en": "The grand melody of Moment reimagined in delicate music-box tones, fitting for a snowy night. Bittersweet memories chime one precious note at a time. Haunting resonance for scenes of remembrance and quiet farewell.",
    "feeling": [
      "gentle",
      "sad"
    ],
    "style": [
      "japanese",
      "musicbox",
      "fantasy"
    ],
    "scene": [
      "night",
      "snow"
    ],
    "story": [
      "memory",
      "farewell",
      "reunion",
      "bonds",
      "dream",
      "flashback",
      "hope"
    ],
    "duration": "2:50",
    "durationSec": 170,
    "mp3": "/music/n/n75.mp3"
  },
  {
    "id": "n76",
    "title": "廻天動地",
    "title_en": "Heaven and Earth Shatter",
    "description": "天地を裂くような威圧感で響き渡る和楽器が、強大な敵の存在感を大きく高める壮絶な曲。\n天と地が揺れ、世界の秩序そのものが脅かされる絶望的な戦いの幕開けを告げる荘厳さ。\n和風ゲームのラスボス戦や、神や魔物との究極の対決シーンに独特の迫力をもたらします。",
    "description_en": "Japanese instruments roar with earth-splitting force, elevating the major enemy's presence to staggering heights. Heaven and earth tremble as the world's very order is threatened. distinctive intensity for final boss confrontations.",
    "feeling": [
      "epic",
      "mysterious",
      "dark",
      "suspense"
    ],
    "style": [
      "japanese",
      "fantasy"
    ],
    "scene": [
      "boss",
      "samurai",
      "battle"
    ],
    "story": [
      "despair",
      "defeat",
      "destiny"
    ],
    "duration": "2:07",
    "durationSec": 127,
    "mp3": "/music/n/n76.mp3"
  },
  {
    "id": "n77",
    "title": "The wild places",
    "title_en": "The Wild Places",
    "description": "大地と共に生きる動物たちの力強さと優しさが、のびやかな和洋折衷の旋律に宿っています。\n鬱蒼とした野生の大自然の中に漂うほのぼのとした命の息吹が、聴く者の心を穏やかにします。\nフィールドマップの探索や、自然の中でのんびり暮らすキャラクターの日常シーンに温もりを添えます。",
    "description_en": "The strength and gentleness of creatures living alongside the land resonate in a warm east-meets-west melody. A gentle breath of wild nature soothes the listener's heart. Cozy field exploration and peaceful daily life.",
    "feeling": [
      "gentle",
      "happy",
      "cute",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "oriental",
      "japanese"
    ],
    "scene": [
      "forest",
      "field",
      "shrine",
      "onsen",
      "village",
      "ruins"
    ],
    "story": [
      "peaceful",
      "dream",
      "hope",
      "flashback"
    ],
    "duration": "1:58",
    "durationSec": 118,
    "mp3": "/music/n/n77.mp3"
  },
  {
    "id": "n78",
    "title": "伝承の語り部",
    "title_en": "Keeper of Legends",
    "description": "薄暗い書庫の片隅で、老いた吟遊詩人がハープをかき鳴らしながら禁断の伝説を語り始めます。\nわずか30秒の中に伏線と不穏な予感が凝縮された、物語の扉を開くための短いイントロ曲。\n謎めいたオープニングや場面転換、洋館の怪奇譚の幕開けに向いている一曲です。",
    "description_en": "In a dim corner of an old library, an aged bard plucks a harp and begins an ominous legend. Thirty seconds of concentrated foreshadowing. A short intro to open mysterious tales and gothic chapters.",
    "feeling": [
      "mysterious",
      "suspense"
    ],
    "style": [
      "fantasy",
      "celtic",
      "medieval"
    ],
    "scene": [
      "opening",
      "mansion",
      "night"
    ],
    "story": [
      "destiny",
      "omen"
    ],
    "duration": "0:32",
    "durationSec": 32,
    "mp3": "/music/n/n78.mp3"
  },
  {
    "id": "n79",
    "title": "瞬光の切先",
    "title_en": "Flash of the Blade",
    "description": "エレクトリックギターが唸り、剣の光が瞬く間に閃くヒーロー登場のロックアクション曲。\n強いなスピードと力強さで、強い戦士がついに姿を現す決定的な瞬間を演出します。\nヒーローのバトルシーンや、スタイリッシュな戦闘開幕のオープニングに格好いい迫力を与えます。",
    "description_en": "Electric guitar screams as a blade flashes in an instant, heralding the hero's explosive arrival. powerful speed and power mark the decisive moment. A stylish, hard-hitting rock action opener for battle scenes.",
    "feeling": [
      "epic",
      "suspense"
    ],
    "style": [
      "fantasy",
      "modern",
      "electronic"
    ],
    "scene": [
      "battle",
      "opening"
    ],
    "story": [
      "victory",
      "resolve",
      "destiny"
    ],
    "duration": "1:07",
    "durationSec": 67,
    "mp3": "/music/n/n79.mp3"
  },
  {
    "id": "n80",
    "title": "殺戮マシン",
    "title_en": "Killing Machine",
    "description": "静かな機械音から始まり、ノイズが蓄積するたびに何かが人の形を失っていく恐怖のBGM。\n理性の箍が外れ、感情を持つ存在が破壊的な機械へと変わっていく変容の過程を音で描きます。\nホラーゲームのボス戦や、AIや人造生物が暴走するシーンに背筋を凍らせる迫力をもたらします。",
    "description_en": "Beginning with quiet machine hum, accumulating noise strips away humanity piece by piece. Reason shatters as a sentient being transforms into a weapon of destruction. Spine-chilling horror for rampaging AI and boss encounters.",
    "feeling": [
      "dark",
      "scary",
      "suspense"
    ],
    "style": [
      "futuristic",
      "electronic",
      "oriental",
      "western_horror"
    ],
    "scene": [
      "boss",
      "dungeon",
      "night",
      "battle",
      "ruins",
      "cave"
    ],
    "story": [
      "defeat",
      "despair",
      "destiny",
      "conspiracy",
      "pursuit"
    ],
    "duration": "3:20",
    "durationSec": 200,
    "mp3": "/music/n/n80.mp3"
  },
  {
    "id": "n81",
    "title": "Departure",
    "title_en": "Departure",
    "description": "朝靄の中に立ち、まだ見ぬ世界への胸の高鳴りと一抹の不安が入り混じる旅立ちの瞬間。\n雄大なオーケストラが地平線の彼方へと背中を押し、希望と冒険心を鮮やかに呼び覚まします。\n物語の幕開けや主人公の旅立ちシーン、新たな冒険が始まる感動的な出発点に合う一曲です。",
    "description_en": "Standing in the morning mist, heart racing with excitement and a trace of unease before an unknown world. A grand orchestra pushes toward the horizon, awakening hope and the spirit of adventure. A stirring departure.",
    "feeling": [
      "epic",
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "travel",
      "field",
      "opening",
      "morning"
    ],
    "story": [
      "reunion",
      "peaceful",
      "dream",
      "hope",
      "resolve"
    ],
    "duration": "1:12",
    "durationSec": 72,
    "mp3": "/music/n/n81.mp3"
  },
  {
    "id": "n82",
    "title": "華志の舞",
    "title_en": "Spirited Dance",
    "description": "三味線と笛が激しく絡み合い、魂の底から湧き上がるような日本の熱と志を爆発させる和風曲。\nハイテンションな旋律が舞台の熱気を一気に押し上げ、観る者の血を沸かせるエネルギーを放ちます。\n和風アクションの開幕や、祭りの舞台・武士の勝利を祝う高揚感あふれるシーンに向いています。",
    "description_en": "Shamisen and flute intertwine in a fiery explosion of Japanese passion and spirit. A high-energy melody that ignites the stage and sets the blood ablaze. Peak intensity for Japanese action and victorious celebrations.",
    "feeling": [
      "happy",
      "epic"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "festival",
      "samurai",
      "village",
      "opening",
      "ending"
    ],
    "story": [
      "victory",
      "resolve",
      "destiny",
      "dream",
      "hope"
    ],
    "duration": "3:38",
    "durationSec": 218,
    "mp3": "/music/n/n82.mp3"
  },
  {
    "id": "n83",
    "title": "Breeze1",
    "title_en": "Breeze 1",
    "description": "森の朝に吹く一陣の風のように、ほんのりと心を撫でていく短くシンプルな癒しのテーマ。\n雪景色の静けさと木漏れ日の優しさが、わずかな時間の中に凝縮されています。\n場面転換のブリッジや、ゲームの短い場転・エフェクト音楽として使いやすい一曲です。",
    "description_en": "A short, simple healing theme like a single morning breeze through the forest. The stillness of snow and the warmth of dappled sunlight condensed into a brief moment. Ideal for scene transitions and gentle bridges.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest",
      "morning",
      "snow"
    ],
    "story": [
      "peaceful",
      "memory",
      "reunion",
      "dream",
      "hope",
      "flashback"
    ],
    "duration": "0:37",
    "durationSec": 37,
    "mp3": "/music/n/n83.mp3"
  },
  {
    "id": "n84",
    "title": "Breeze2",
    "title_en": "Breeze 2",
    "description": "Breeze1よりも少し暖かさを増し、柔らかな終止感で場面を穏やかに締めくくる癒しのテーマ。\n短い旋律の中に小さな高揚感があり、次のシーンへの橋渡しをすっきりと行います。\n場面転換や短いシーンの締めくくりに、Breeze1と組み合わせて使うと効果的です。",
    "description_en": "Slightly warmer than Breeze 1, this healing theme closes a scene with a soft sense of resolution. A small lift within its brief melody bridges smoothly to the next moment. Pairs perfectly with Breeze 1.",
    "feeling": [
      "gentle",
      "happy",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning",
      "snow",
      "forest"
    ],
    "story": [
      "peaceful",
      "memory",
      "reunion",
      "dream",
      "hope",
      "flashback"
    ],
    "duration": "0:36",
    "durationSec": 36,
    "mp3": "/music/n/n84.mp3"
  },
  {
    "id": "n85",
    "title": "Wind Veil",
    "title_en": "Wind Veil",
    "description": "ピアノのそよ風が、心の奥に積もった疲れを静かに吹き飛ばしてくれるような癒しの曲。\n窓の外に広がる朝の景色のように、何気ない日常の美しさをさりげなく照らし出します。\nゆったりとした日常シーンのBGMや、瞑想・リラクゼーション動画の穏やかな伴奏に向いています。",
    "description_en": "A soothing piano breeze that gently sweeps away the fatigue settled deep in your heart. Like a morning view from the window, it quietly illuminates the beauty of ordinary days. Calm music for relaxation and reflection.",
    "feeling": [
      "gentle",
      "mysterious",
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning",
      "snow",
      "forest"
    ],
    "story": [
      "peaceful",
      "dream",
      "memory",
      "reunion",
      "bonds",
      "flashback",
      "hope",
      "dailylife"
    ],
    "duration": "1:21",
    "durationSec": 81,
    "mp3": "/music/n/n85.mp3"
  },
  {
    "id": "n86",
    "title": "Flame of Fate",
    "title_en": "Flame of Fate",
    "description": "ハリウッド映画のような重厚な弦楽が、これから訪れる悲劇的な運命を予感させる壮大な曲。\n選択の余地なく運命に引きずられていく主人公の哀しみと、その先に宿る僅かな覚悟を描きます。\n映画的なオープニングや、強大なボスとの宿命の対決前夜のシーンに重みを与えます。",
    "description_en": "Weighty Hollywood-style strings foretell a tragic destiny about to unfold. A protagonist dragged by fate with no choice but to endure. Cinematic grandeur for fateful openings and the eve of a decisive confrontation.",
    "feeling": [
      "dark",
      "sad",
      "epic",
      "suspense"
    ],
    "style": [
      "medieval",
      "western_horror"
    ],
    "scene": [
      "opening",
      "boss"
    ],
    "story": [
      "farewell",
      "omen",
      "resolve",
      "defeat",
      "destiny",
      "despair"
    ],
    "duration": "0:23",
    "durationSec": 23,
    "mp3": "/music/n/n86.mp3"
  },
  {
    "id": "n87",
    "title": "思考実験",
    "title_en": "Thought Experiment",
    "description": "ピアノが同じ音型を繰り返しながら徐々に緊張を高め、頭の中の迷宮に引き込んでいきます。\n何が正しいのか、答えの出ない命題に一人向き合う深夜の思索の時間を音で再現した曲です。\n謎解きシーンや心理戦、探偵が思考を深める静かな緊迫感のある場面に向いています。",
    "description_en": "Piano repeats a pattern with slowly mounting tension, drawing you into a labyrinth of the mind. A sonic portrait of late-night contemplation over an unanswerable question. fitting for detective scenes and psychological suspense.",
    "feeling": [
      "suspense",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night",
      "cave"
    ],
    "story": [
      "conspiracy",
      "omen"
    ],
    "duration": "0:50",
    "durationSec": 50,
    "mp3": "/music/n/n87.mp3"
  },
  {
    "id": "n88",
    "title": "Celebration",
    "title_en": "Celebration",
    "description": "金管楽器が高らかに鳴り響き、華やかな舞踏会が幕を開ける盛大な祝祭のテーマ曲。\n印象的のご馳走と煌めく衣装、紙吹雪が舞い踊る喜びに満ちた一日の喜びを大きく表現します。\n結婚式や戴冠式など人生の晴れの舞台、パーティーオープニングの演出に豪華さを添えます。",
    "description_en": "Brass instruments ring out in triumph as a splendid ball begins. Confetti dances among fine feasts and shimmering gowns. A grand celebration theme for coronations, weddings, and the most glorious moments of life.",
    "feeling": [
      "happy",
      "epic",
      "cute"
    ],
    "style": [
      "medieval",
      "fantasy"
    ],
    "scene": [
      "festival",
      "morning",
      "opening",
      "ending",
      "snow",
      "town"
    ],
    "story": [
      "victory",
      "dream",
      "peaceful",
      "dailylife",
      "hope"
    ],
    "duration": "2:12",
    "durationSec": 132,
    "mp3": "/music/n/n88.mp3"
  },
  {
    "id": "n89",
    "title": "Nostalgia",
    "title_en": "Nostalgia",
    "description": "ケルトの笛が奏でる哀愁のメロディーが、美しい田舎の風景と失われた時間を静かに呼び覚ます。\n季節の変わり目に故郷の道を一人歩くような、甘くて切ない郷愁の感情が旋律に溶けています。\n旅の途中で故郷を想うシーンや、懐かしい場所への帰還・別れを描く場面に深みを与えます。",
    "description_en": "A Celtic flute weaves a wistful melody, gently awakening visions of pastoral beauty and time lost. The bittersweet ache of homesickness lingers in every note. Deep warmth for scenes of longing and homecoming.",
    "feeling": [
      "gentle",
      "sad"
    ],
    "style": [
      "celtic"
    ],
    "scene": [
      "village",
      "field",
      "forest",
      "travel",
      "night",
      "snow"
    ],
    "story": [
      "memory",
      "peaceful",
      "reunion",
      "farewell",
      "bonds",
      "flashback",
      "hope"
    ],
    "duration": "1:60",
    "durationSec": 120,
    "mp3": "/music/n/n89.mp3"
  },
  {
    "id": "n90",
    "title": "新天地",
    "title_en": "New Frontier",
    "description": "朝日が差し込む新しい大地に足を踏み出す、穏やかで希望に満ちた旅立ちのBGM。\n困難を乗り越えた先にある新しい始まりの清々しさが、優しい旋律の中に輝いています。\n新章の幕開けや主人公の再出発、明るい未来へ向かうシーンに爽やかな希望の光を添えます。",
    "description_en": "Stepping onto new ground as morning light breaks through, a gentle BGM of hopeful departure. The freshness of a new beginning after hardship shines within its warm melody. Bright promise for new chapters ahead.",
    "feeling": [
      "gentle",
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening",
      "field",
      "morning",
      "travel"
    ],
    "story": [
      "victory",
      "hope",
      "dream",
      "resolve",
      "destiny",
      "peaceful",
      "reunion"
    ],
    "duration": "1:07",
    "durationSec": 67,
    "mp3": "/music/n/n90.mp3"
  },
  {
    "id": "n91",
    "title": "Game Over",
    "title_en": "Game Over",
    "description": "意識の端がぼやけ、知覚が歪んでいくような不思議なオルゴールの音が暗闇を漂います。\nゲームオーバーの静けさの中に、夢と現実の境界が曖昧になっていく不安感が漂います。\nゲームの敗北画面や、主人公が倒れる悲劇的な場面の演出に独特の余韻を与えます。",
    "description_en": "Strange music-box tones drift through darkness as perception warps and consciousness fades at the edges. An uneasy stillness where dream and reality blur. A haunting piece for game-over screens and scenes of defeat.",
    "feeling": [
      "mysterious",
      "dark"
    ],
    "style": [
      "fantasy",
      "musicbox"
    ],
    "scene": [
      "night",
      "forest",
      "snow"
    ],
    "story": [
      "defeat",
      "despair",
      "flashback",
      "dream"
    ],
    "duration": "0:39",
    "durationSec": 39,
    "mp3": "/music/n/n91.mp3"
  },
  {
    "id": "n92",
    "title": "蒼い月",
    "title_en": "Blue Moon",
    "description": "ギターの切ない音色が、夜の森に浮かぶ蒼い月の光のように静かに広がっていく哀愁の曲。\n語られることのなかった想い、そして静かに諦めていく心の奥底を旋律がそっと代弁します。\n一人で夜を過ごす切ないシーンや、片思いが終わる瞬間の回想シーンに深い哀感を添えます。",
    "description_en": "A guitar's plaintive voice spreads like blue moonlight across a night forest. Unspoken feelings and a heart quietly letting go find expression in the melody. Deep sorrow for lonely nights and the end of longing.",
    "feeling": [
      "sad",
      "gentle",
      "dark",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "oriental"
    ],
    "scene": [
      "night",
      "forest"
    ],
    "story": [
      "memory",
      "farewell",
      "flashback"
    ],
    "duration": "2:16",
    "durationSec": 136,
    "mp3": "/music/n/n92.mp3"
  },
  {
    "id": "n93",
    "title": "進撃の号令",
    "title_en": "War Cry",
    "description": "和と電子音が激しく交差する戦陣の号令、鬨の声と共に大軍が動き出す強いな和風戦闘曲。\n戦士たちの覚悟が一点に集中し、怒涛のような進撃が始まる瞬間の高揚感を描きます。\n大規模な軍勢の激突シーンや、侍が最後の戦いに挑む熱いボス戦シーンに向いている一曲です。",
    "description_en": "Japanese and electronic sounds collide in a war cry as vast armies surge forward. The warriors' resolve concentrates into a single point before an unstoppable charge. Peak intensity for large-scale clashes and samurai boss battles.",
    "feeling": [
      "epic",
      "suspense",
      "dark"
    ],
    "style": [
      "japanese",
      "fantasy",
      "electronic"
    ],
    "scene": [
      "battle",
      "samurai",
      "boss"
    ],
    "story": [
      "resolve",
      "destiny",
      "conspiracy",
      "pursuit"
    ],
    "duration": "1:42",
    "durationSec": 102,
    "mp3": "/music/n/n93.mp3"
  },
  {
    "id": "n94",
    "title": "軍略の音律",
    "title_en": "Samurai Strategy",
    "description": "暗がりの陣幕に集まる武将たちが、息をひそめて敵の動きを読む緊張感を和楽器で描いた曲。\n一手間違えれば滅亡する厳しい戦国の謀略を、シリアスな旋律が冷静に刻み込んでいきます。\n戦略・陰謀シーンや、夜の軍議・忍びの密談など緊迫した和風の場面演出に向いています。",
    "description_en": "Warlords gather in shadowed war tents, holding their breath to read the enemy's moves. Japanese instruments carve the deadly tension of feudal-era strategy. Taut suspense for war councils and covert ninja negotiations.",
    "feeling": [
      "suspense",
      "dark"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "samurai",
      "shrine",
      "night"
    ],
    "story": [
      "conspiracy",
      "flashback",
      "omen",
      "resolve"
    ],
    "duration": "2:04",
    "durationSec": 124,
    "mp3": "/music/n/n94.mp3"
  },
  {
    "id": "n95",
    "title": "蒼刻～そうこく～",
    "title_en": "Azure Engraving",
    "description": "和の旋律が命の炎を一筋の蒼い光として彫り刻むような、壮大でドラマティックな昇華の曲。\n後半に向けて感情が爆発するように盛り上がり、覚悟と勝利と別れが一つに溶け合います。\n侍が最後の力を振り絞る戦いや、感動的な和風エンディングシーンに大きな感情を与えます。",
    "description_en": "A Japanese melody engraving the flame of life as a single streak of azure light. Emotion surges toward a climax where resolve, victory, and farewell merge as one. powerful feeling for samurai finales and endings.",
    "feeling": [
      "epic",
      "sad",
      "mysterious"
    ],
    "style": [
      "japanese",
      "fantasy"
    ],
    "scene": [
      "ending",
      "battle",
      "shrine",
      "samurai",
      "opening"
    ],
    "story": [
      "farewell",
      "victory",
      "destiny",
      "resolve",
      "bonds"
    ],
    "duration": "1:26",
    "durationSec": 86,
    "mp3": "/music/n/n95.mp3"
  },
  {
    "id": "n96",
    "title": "創国の夜明け",
    "title_en": "Nation's Dawn",
    "description": "疾走感あふれる緊張のリズムから、やがて夜明けの大地を見渡すような解放感へと変貌します。\n戦乱の時代を駆け抜け、新しい国の夜明けを自らの手でつかみ取った瞬間の静かな誇り。\n和風ゲームのオープニングや、物語の転換点となる戦いと夜明けのシーンに力強さを与えます。",
    "description_en": "From a rush of tense rhythm, the music transforms into the liberating vista of a dawn-lit land. The quiet pride of seizing a new era's first light after surviving war. Powerful energy for openings and turning points.",
    "feeling": [
      "suspense",
      "epic"
    ],
    "style": [
      "fantasy",
      "japanese"
    ],
    "scene": [
      "opening",
      "travel",
      "field",
      "battle",
      "boss",
      "samurai",
      "morning"
    ],
    "story": [
      "victory",
      "resolve",
      "destiny",
      "hope",
      "dream",
      "peaceful"
    ],
    "duration": "1:41",
    "durationSec": 101,
    "mp3": "/music/n/n96.mp3"
  },
  {
    "id": "n97",
    "title": "月夜蝶～君ヲ想フ～",
    "title_en": "Moonlit Butterfly",
    "description": "月に照らされた夜道で、胸の奥深くに秘めた恋心が蝶の羽のようにそっと羽ばたく和風曲。\n和楽器のしっとりとした音色が、言葉にできない思慕の念と静かな決意を包み込むように描きます。\n和風の恋愛シーンや、月夜に一人語る切ない場面、夜の神社でのロマンティックなシーンに向いています。",
    "description_en": "On a moonlit path, hidden love flutters like butterfly wings in this intimate Japanese-style piece. Gentle traditional tones embrace unspoken longing and quiet determination. Romance beneath the moon at a nighttime shrine.",
    "feeling": [
      "sad",
      "gentle",
      "mysterious"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "night",
      "village",
      "forest",
      "shrine",
      "onsen"
    ],
    "story": [
      "dream",
      "farewell",
      "memory",
      "reunion",
      "bonds",
      "resolve",
      "flashback",
      "hope"
    ],
    "duration": "2:14",
    "durationSec": 134,
    "mp3": "/music/n/n97.mp3"
  },
  {
    "id": "n98",
    "title": "トレメイン夫人の厳格な規律",
    "title_en": "Madame Tremaine's Rules",
    "description": "サーカスの幕が開くような妖しいワルツに、テルミンの不気味な音色が絡む独特の雰囲気。\n笑顔の奥に恐ろしい意図を隠す支配者が、洋館に規律と恐怖を敷き詰めている情景を描きます。\nゴシックなキャラクターの登場シーンや、笑えるのに怖い悪役・陰謀劇の演出に個性を添えます。",
    "description_en": "An eerie waltz unfurls like a circus curtain, threaded with the unsettling wail of a theremin. A smiling tyrant fills a Gothic mansion with discipline and dread. Distinctive atmosphere for sinister yet darkly amusing villains.",
    "feeling": [
      "dark",
      "happy",
      "cute",
      "scary"
    ],
    "style": [
      "medieval",
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "festival",
      "mansion",
      "night",
      "opening"
    ],
    "story": [
      "conspiracy"
    ],
    "duration": "2:26",
    "durationSec": 146,
    "mp3": "/music/n/n98.mp3"
  },
  {
    "id": "n99",
    "title": "未来の種",
    "title_en": "Seeds of Tomorrow",
    "description": "爽やかな朝の空気の中、ケルトの笛が弾んで広い世界への希望の扉を勢いよく開きます。\n種が芽吹き、大地いっぱいに咲き広がるような明るい未来への期待感が中盤から大きく膨らみます。\n新しい物語のオープニングや、主人公が前向きに歩き始めるシーンに爽快な希望感を与えます。",
    "description_en": "A Celtic flute bounces through crisp morning air, flinging open the doors to a hopeful new world. Expectation blooms wide like seeds sprouting across the land. A refreshing burst of optimism for new story beginnings.",
    "feeling": [
      "happy",
      "gentle",
      "epic",
      "cute"
    ],
    "style": [
      "fantasy",
      "celtic"
    ],
    "scene": [
      "opening",
      "field",
      "morning",
      "snow",
      "travel",
      "town",
      "village"
    ],
    "story": [
      "victory",
      "memory",
      "reunion",
      "dream",
      "hope",
      "peaceful",
      "dailylife"
    ],
    "duration": "2:56",
    "durationSec": 176,
    "mp3": "/music/n/n99.mp3"
  },
  {
    "id": "n100",
    "title": "深淵に臨む",
    "title_en": "Into the Abyss",
    "description": "渦巻く暗い海のように感情が荒れ狂い、孤独と絶望が深淵の底へと引き込もうとする壮絶な曲。\n電子音と和の響きが混ざり合い、葛藤の中で足掻く魂の叫びが轟くように響き渡ります。\n主人公が精神的に追い詰められるシーンや、暗い海・荒野での単独戦闘に強いな深みを与えます。",
    "description_en": "Emotions rage like a dark, churning sea as solitude and despair drag the soul toward the abyss. Electronic and Japanese tones collide in a tormented cry. Devastating depth for scenes of mental anguish and solitary battle.",
    "feeling": [
      "dark",
      "epic",
      "sad",
      "scary",
      "suspense"
    ],
    "style": [
      "fantasy",
      "oriental",
      "electronic",
      "futuristic",
      "japanese_horror"
    ],
    "scene": [
      "field",
      "night",
      "travel",
      "samurai"
    ],
    "story": [
      "defeat",
      "destiny",
      "despair",
      "conspiracy",
      "flashback"
    ],
    "duration": "2:00",
    "durationSec": 120,
    "mp3": "/music/n/n100.mp3"
  },
  {
    "id": "n101",
    "title": "杜の奏",
    "title_en": "Forest Melody",
    "description": "鳥の声と波の音が溶け込んだ、森の中で目を閉じて過ごす瞑想のための静謐な和の音楽。\n世俗の喧騒から遠く離れ、自然の声にただ耳を傾けるような深い安らぎが広がります。\nヒーリング・リラクゼーション動画や、温泉・森林浴シーン、瞑想BGMとして理想的な一曲です。",
    "description_en": "Serene Japanese music woven with birdsong and gentle waves, made for forest meditation with eyes closed. A deep tranquility far removed from the noise of the world. Ideal for healing, hot springs, and mindful stillness.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "oriental",
      "musicbox",
      "fantasy"
    ],
    "scene": [
      "forest",
      "morning",
      "snow",
      "onsen"
    ],
    "story": [
      "peaceful",
      "dream",
      "dailylife",
      "memory"
    ],
    "duration": "4:43",
    "durationSec": 283,
    "mp3": "/music/n/n101.mp3"
  },
  {
    "id": "n102",
    "title": "白殉～はくじん～",
    "title_en": "White Devotion",
    "description": "三味線と笛が激しく絡み合い、起承転結の中で命を懸けた覚悟が鮮やかに刻まれる和風曲。\n白い装束で戦場に立つ武士の凛とした姿、そして散りゆく命の美しさが音楽に昇華されています。\n侍の決死の戦いや、壮烈な最期を遂げる覚悟のシーンに強い存在感をもたらします。",
    "description_en": "Shamisen and flute clash fiercely, etching a samurai's resolve into every note. A warrior in white stands tall on the battlefield, embodying fleeting beauty.",
    "feeling": [
      "epic",
      "mysterious",
      "suspense"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "battle",
      "samurai",
      "night",
      "opening"
    ],
    "story": [
      "destiny",
      "resolve"
    ],
    "duration": "1:42",
    "durationSec": 102,
    "mp3": "/music/n/n102.mp3"
  },
  {
    "id": "n103",
    "title": "志は死なない",
    "title_en": "The Spirit Lives On",
    "description": "尺八とオーケストラが繰り広げる起承転結、勝利と敗北と悲しみと希望が渦巻くドラマの大作。\n命が尽きても志は次の世代に受け継がれていく、日本人の魂の深さを大きく表現した一曲です。\n侍の生き様を描く大河ドラマや、感動の物語エンディングに深い余韻をもたらします。",
    "description_en": "Shakuhachi and orchestra weave victory, defeat, sorrow, and hope into an epic saga. Even when life fades, the spirit endures — passed down through generations.",
    "feeling": [
      "epic",
      "sad",
      "gentle",
      "mysterious",
      "happy"
    ],
    "style": [
      "japanese",
      "fantasy"
    ],
    "scene": [
      "ending",
      "samurai",
      "village",
      "shrine",
      "opening"
    ],
    "story": [
      "victory",
      "memory",
      "reunion",
      "farewell",
      "resolve",
      "destiny",
      "dream",
      "hope"
    ],
    "duration": "4:17",
    "durationSec": 257,
    "mp3": "/music/n/n103.mp3"
  },
  {
    "id": "n104",
    "title": "夏の秘密基地",
    "title_en": "Summer Secret Base",
    "description": "ケルトの風に乗って、田んぼの畦道を駆けた子どもの頃の夏の日が目の前に広がる爽やかな曲。\n泥だらけの膝、秘密基地に宝物を隠した午後、友達と笑いあった夕暮れの記憶が蘇ります。\n田舎の夏の思い出シーンや、懐かしい過去の回想、爽やかな野外探索BGMとして向いています。",
    "description_en": "Celtic winds carry you back to childhood summers on rice paddy paths. Mud-stained knees, a secret base, and laughter beneath the fading evening sky.",
    "feeling": [
      "happy",
      "gentle"
    ],
    "style": [
      "celtic"
    ],
    "scene": [
      "field",
      "travel",
      "village",
      "forest",
      "morning",
      "opening"
    ],
    "story": [
      "memory",
      "peaceful",
      "reunion",
      "hope",
      "dream",
      "dailylife"
    ],
    "duration": "1:27",
    "durationSec": 87,
    "mp3": "/music/n/n104.mp3"
  },
  {
    "id": "n105",
    "title": "月夜のオートマタ～オルゴールVer～",
    "title_en": "Moonlit Automaton",
    "description": "月明かりの洋館で、今は動かなくなった人形がオルゴールの音に合わせて夢を見ているような曲。\n怪しくも切ない旋律の中に、創られた命が持つ哀しみと美しい思い出が静かに宿っています。\nゴシックなホラー演出や、人形・オートマタをモチーフにした幻想的なシーンに独特の余韻を与えます。",
    "description_en": "In a moonlit mansion, a motionless doll dreams to a music box melody. Haunting yet tender, the sorrow of an artificial life lingers in bittersweet tones.",
    "feeling": [
      "sad",
      "mysterious",
      "scary",
      "dark"
    ],
    "style": [
      "medieval",
      "musicbox",
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "night",
      "opening",
      "mansion"
    ],
    "story": [
      "dream",
      "memory",
      "farewell",
      "defeat",
      "omen",
      "flashback"
    ],
    "duration": "0:54",
    "durationSec": 54,
    "mp3": "/music/n/n105.mp3"
  },
  {
    "id": "n106",
    "title": "Rainy Alley",
    "title_en": "Rainy Alley",
    "description": "雨音が石畳を叩く路地裏で、ピアノとアコーディオンが濡れた夜をロマンティックに彩ります。\n傘を持つ手が少し重く、記憶の中の誰かの顔がガス灯の光の中にぼんやりと浮かびます。\n雨の夜の回想シーンや、失われた恋を引きずる大人の哀愁を描く場面に深い情感を与えます。",
    "description_en": "Rain taps cobblestones in a dim alley as piano and accordion paint a romantic, rain-soaked night. A half-remembered face flickers in the gaslight.",
    "feeling": [
      "sad",
      "gentle",
      "mysterious"
    ],
    "style": [
      "medieval"
    ],
    "scene": [
      "night",
      "town"
    ],
    "story": [
      "memory",
      "flashback",
      "dream",
      "hope",
      "dailylife",
      "omen",
      "farewell",
      "reunion"
    ],
    "duration": "2:04",
    "durationSec": 124,
    "mp3": "/music/n/n106.mp3"
  },
  {
    "id": "n107",
    "title": "光に抱かれて",
    "title_en": "Embraced by Light",
    "description": "「死刑行列」のアレンジ。ストリングスの優しい音色が、終わりへ向かう旅を静かに包み込みます。\n陽の光に抱かれながら歩く最後の道に、諦めと安らぎが混ざり合う奇妙な穏やかさが漂います。\n別れのシーンや静かな旅の終わり、命の終着点を柔らかく描く感動的なシーンに寄り添います。",
    "description_en": "Gentle strings embrace a quiet journey toward the end. Walking a sunlit final road, resignation and peace merge into a strange, tender calm.",
    "feeling": [
      "gentle",
      "sad",
      "mysterious",
      "epic",
      "dark"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "travel",
      "morning"
    ],
    "story": [
      "memory",
      "peaceful",
      "farewell",
      "flashback"
    ],
    "duration": "1:25",
    "durationSec": 85,
    "mp3": "/music/n/n107.mp3"
  },
  {
    "id": "n108",
    "title": "Lost Child",
    "title_en": "Lost Child",
    "description": "迷子になった夜の街で、知らない路地の角を曲がるたびに心細さと焦りが膨らんでいきます。\nどこかで聞いたはずの音楽が遠くなっていき、夢と現実の間を迷走しているような不安感。\n夜の迷子シーンや、夢の中の迷宮探索、現実と幻想が入り混じる不思議な場面に合います。",
    "description_en": "Lost at night in unfamiliar streets, anxiety swells with every corner turned. Familiar sounds fade as reality and dream blur into a disorienting haze.",
    "feeling": [
      "suspense",
      "mysterious",
      "cute",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night",
      "town"
    ],
    "story": [
      "dream",
      "flashback"
    ],
    "duration": "1:04",
    "durationSec": 64,
    "mp3": "/music/n/n108.mp3"
  },
  {
    "id": "n109",
    "title": "子育て奮闘！",
    "title_en": "Parenting Frenzy",
    "description": "部屋中に散らかる積み木や落書き、元気いっぱいの子どもに振り回される親の奮闘を描いた曲。\n大変だけど愛おしい、笑いが絶えない日常の騒ぎが楽しい旋律の中にぎゅっと詰まっています。\n子育てをテーマにしたコミカルなシーンや、にぎやかな家族の日常BGMとして向いている一曲です。",
    "description_en": "Building blocks and crayon drawings everywhere — parenthood in cheerful chaos. Exhausting yet precious, every note brims with the joyful pandemonium of family.",
    "feeling": [
      "happy",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "town"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "0:23",
    "durationSec": 23,
    "mp3": "/music/n/n109.mp3"
  },
  {
    "id": "n110",
    "title": "ルシファー",
    "title_en": "Lucifer",
    "description": "ホラーっぽい不気味な旋律の中に、どこかシュールでかわいらしさが漂う黒猫のテーマ曲。\n月明かりの洋館を悠然と歩くルシファー、禍々しさと愛らしさを同時に纏った存在感。\n怪しいマスコットキャラクターや、愛嬌ある悪役の登場シーンに個性的な雰囲気を演出します。",
    "description_en": "An eerie yet charming theme for a black cat prowling a moonlit mansion. Lucifer strides with sinister grace, wrapping menace and adorability as one.",
    "feeling": [
      "scary",
      "cute",
      "dark",
      "happy"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "night",
      "mansion",
      "opening"
    ],
    "story": [
      "destiny",
      "despair",
      "conspiracy",
      "omen"
    ],
    "duration": "2:05",
    "durationSec": 125,
    "mp3": "/music/n/n110.mp3"
  },
  {
    "id": "n111",
    "title": "日本開花",
    "title_en": "Japan in Bloom",
    "description": "「華志の舞」を序盤のピアノソロから始まるアレンジで、日本の美と力が静かに咲き持つ和風曲。\n夜明けの社の静けさから始まり、やがて祭りの熱気と侍の誇りが一つになって大きく開花します。\n和風作品のオープニングや日本の情景を描く映像、感動的なエンディングシーンに合う一曲です。",
    "description_en": "Opening with a piano solo, this Japanese piece blooms from a shrine's dawn hush into a grand fusion of festival energy and samurai pride.",
    "feeling": [
      "epic",
      "happy",
      "gentle"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "festival",
      "samurai",
      "morning",
      "opening",
      "ending",
      "shrine"
    ],
    "story": [
      "victory",
      "hope",
      "dream",
      "destiny"
    ],
    "duration": "4:12",
    "durationSec": 252,
    "mp3": "/music/n/n111.mp3"
  },
  {
    "id": "n112",
    "title": "聖戦の英雄",
    "title_en": "Sacred War Hero",
    "description": "運命の予感を乗せた重厚な幕開けから、英雄たちが立ち上がる躍動感あふれる展開へ変貌します。\n東洋と西洋の音色が交差する壮大なオーケストラが、聖なる戦いの決意と高揚感を描き出します。\n和風・中世両対応のボス戦や、選ばれた英雄たちの出陣シーンに強い存在感を放ちます。",
    "description_en": "From a weighty overture of destiny, heroes rise in exhilarating resolve. Eastern and Western tones collide in a grand orchestra fit for sacred battle.",
    "feeling": [
      "epic",
      "suspense",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "medieval",
      "oriental",
      "japanese"
    ],
    "scene": [
      "battle",
      "opening",
      "boss",
      "morning",
      "samurai"
    ],
    "story": [
      "hope",
      "resolve",
      "destiny",
      "victory",
      "dream"
    ],
    "duration": "2:42",
    "durationSec": 162,
    "mp3": "/music/n/n112.mp3"
  },
  {
    "id": "n113",
    "title": "輝きに満ちて",
    "title_en": "Full of Radiance",
    "description": "ケルトの笛と弦楽が躍動するように絡み合い、世界が光に満たされるような明るい喜びの曲。\n雪の朝も、村の祭りも、草原の朝露も、あらゆる輝きがこの一曲の中に凝縮されています。\nフィールドの探索シーンや祭りの賑わい、ほのぼのとした日常の幸せを彩るのに向いている一曲です。",
    "description_en": "Celtic flute and strings dance in radiant joy, as if the world were flooding with light. Snowlit mornings, village festivals, and meadow dew in one melody.",
    "feeling": [
      "happy",
      "gentle",
      "mysterious",
      "cute"
    ],
    "style": [
      "celtic"
    ],
    "scene": [
      "field",
      "festival",
      "village",
      "town",
      "morning",
      "snow",
      "opening",
      "onsen"
    ],
    "story": [
      "peaceful",
      "reunion",
      "memory",
      "dailylife",
      "hope",
      "dream"
    ],
    "duration": "2:46",
    "durationSec": 166,
    "mp3": "/music/n/n113.mp3"
  },
  {
    "id": "n114",
    "title": "Days",
    "title_en": "Days",
    "description": "朝の光で目を覚ます瞬間から、夕焼けに染まる空まで、一日が穏やかに流れていく情景の曲。\n小鳥のさえずりと共に始まり、森の木漏れ日を経て夕暮れに帰り着く満足感が旋律に宿ります。\n日常の一日を描く映像や、明るい村の日常シーン、癒し系コンテンツのBGMに向いています。",
    "description_en": "From morning's first light to a sunset-painted sky, a gentle day unfolds in melody. Birdsong, dappled forest light, and the contentment of returning home.",
    "feeling": [
      "gentle",
      "happy",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning",
      "forest",
      "village",
      "town"
    ],
    "story": [
      "memory",
      "peaceful",
      "dailylife",
      "hope",
      "dream"
    ],
    "duration": "3:45",
    "durationSec": 225,
    "mp3": "/music/n/n114.mp3"
  },
  {
    "id": "n115",
    "title": "Shining Road",
    "title_en": "Shining Road",
    "description": "パイプオルガンの荘厳な響きが、高い天井の教会に静かに満ち、賛美歌の祈りを想起させます。\n光の差し込む礼拝堂で、神への敬虔な祈りが純粋な音の輝きとなって空へと昇っていきます。\n中世の教会シーンや、神聖な場所での誓いの場面、精神的な浄化や癒しの演出に合う一曲です。",
    "description_en": "A pipe organ's solemn voice fills a cathedral with sacred resonance. Light streams through stained glass as pure devotion ascends toward the heavens.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "medieval"
    ],
    "scene": [
      "shrine",
      "church",
      "morning",
      "snow",
      "mansion"
    ],
    "story": [
      "peaceful",
      "dailylife",
      "flashback"
    ],
    "duration": "3:25",
    "durationSec": 205,
    "mp3": "/music/n/n115.mp3"
  },
  {
    "id": "n116",
    "title": "陽のあたる教会",
    "title_en": "Sunlit Chapel",
    "description": "チェンバロの明るく軽やかな音色が、陽光降り注ぐ小さな教会の礼拝の幸せな朝を描きます。\n木漏れ日が差し込む礼拝堂に集まる村人たちの笑顔と、平和な日曜の朝の温もりが広がります。\n中世風の町の日常シーンや、のどかなキャラクター紹介、平和なコミュニティの演出に向いています。",
    "description_en": "Bright harpsichord paints a sunlit chapel on a peaceful Sunday morning. Villagers gather in warm light, smiles reflecting the gentle warmth of a blessed life.",
    "feeling": [
      "gentle",
      "happy",
      "cute"
    ],
    "style": [
      "medieval"
    ],
    "scene": [
      "town",
      "church",
      "mansion"
    ],
    "story": [
      "peaceful",
      "reunion",
      "dailylife",
      "hope"
    ],
    "duration": "0:29",
    "durationSec": 29,
    "mp3": "/music/n/n116.mp3"
  },
  {
    "id": "n117",
    "title": "無禮県運動",
    "title_en": "Silent Fury",
    "description": "重厚なピアノが暗闇の底から這い上がり、長く抑えられてきた深い怒りを静かに燃え上がらせます。\n言葉にならない憤りが音符となって積み重なり、やがて制御できない感情の炎となって噴出します。\n主人公が怒りに目覚めるシーンや、静かだが激しい感情の葛藤を描くシーンに深みを与えます。",
    "description_en": "Heavy piano rises from darkness, igniting a long-suppressed fury. Wordless rage builds note by note until it erupts into an uncontrollable blaze of emotion.",
    "feeling": [
      "dark",
      "suspense",
      "sad"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night",
      "opening"
    ],
    "story": [
      "omen",
      "despair",
      "destiny",
      "farewell",
      "resolve"
    ],
    "duration": "1:26",
    "durationSec": 86,
    "mp3": "/music/n/n117.mp3"
  },
  {
    "id": "n118",
    "title": "ホルマリンと胎児",
    "title_en": "Quiet Beginning",
    "description": "羊水の中を漂うように、すべての始まりの前の静寂を優しく包み込む穏やかな曲。\n生まれる前の温かさ、まだ傷を知らない命の純粋さが音の中にそっと宿っています。\n命の始まりを描く映像や、夢の中の記憶・母の温もりを想起させるシーンに静寂の美しさを与えます。",
    "description_en": "Evoking the stillness before all beginnings, as if drifting within the warmth of the womb. The purity of a life untouched by pain rests in tranquil tones.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "modern"
    ],
    "scene": [
      "forest",
      "village",
      "morning",
      "snow"
    ],
    "story": [
      "dream",
      "peaceful",
      "memory",
      "flashback",
      "hope",
      "bonds"
    ],
    "duration": "1:50",
    "durationSec": 110,
    "mp3": "/music/n/n118.mp3"
  },
  {
    "id": "n119",
    "title": "LEPROSY IS GONE",
    "title_en": "Leprosy Is Gone",
    "description": "序盤の怪しい霧が晴れるように、やがて曲は光に向かってゆっくりと解放されていきます。\n長い苦しみからの解放と、希望の光が差し込む瞬間の感動的な変化を音楽が体現します。\n闇から光へと物語が転換するシーンや、病・苦難からの回復を描く感動の場面に合う一曲です。",
    "description_en": "Eerie mist lifts as music turns toward light and liberation. The moment when hope breaks through long suffering, rendered in sweeping, cathartic sound.",
    "feeling": [
      "mysterious",
      "gentle",
      "epic",
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening",
      "night",
      "mansion"
    ],
    "story": [
      "flashback",
      "hope",
      "memory",
      "dream",
      "dailylife",
      "omen"
    ],
    "duration": "5:06",
    "durationSec": 306,
    "mp3": "/music/n/n119.mp3"
  },
  {
    "id": "n120",
    "title": "望郷の丘",
    "title_en": "Hometown Hill",
    "description": "ケルトの風に乗って、懐かしい故郷の四季が走馬灯のように流れていく望郷の曲。\n村の祭り、川で遊んだ子どもの頃、優しかった風の感触がじんわりと胸に蘇ります。\n旅の途中で故郷を恋しく思うシーンや、遠く離れた土地への想いを描く場面に深い郷愁を与えます。",
    "description_en": "Celtic winds carry flashes of a distant homeland — village festivals, childhood rivers, the gentle touch of a remembered breeze. Deep, aching nostalgia.",
    "feeling": [
      "gentle",
      "sad",
      "mysterious"
    ],
    "style": [
      "celtic"
    ],
    "scene": [
      "field",
      "village",
      "forest",
      "night"
    ],
    "story": [
      "memory",
      "peaceful",
      "flashback",
      "dream",
      "dailylife"
    ],
    "duration": "4:24",
    "durationSec": 264,
    "mp3": "/music/n/n120.mp3"
  },
  {
    "id": "n121",
    "title": "Cosmic Accelerator",
    "title_en": "Cosmic Accelerator",
    "description": "エレクトリックな4つ打ちビートが宇宙の旅へと誘い、銀河を駆け抜けるような疾走感が満ちます。\n未知の星に向かって加速するロケットのエネルギーが、ダンスミュージックの中に宇宙の広大さを描きます。\nSF映像や宇宙を舞台にした作品のオープニング、スタイリッシュな現代的場面の演出に向いている一曲です。",
    "description_en": "A pulsing beat launches into a cosmic voyage, surging with rocket-bound energy toward unknown stars. Electronic dance meets the vast expanse of the galaxy.",
    "feeling": [
      "epic",
      "mysterious",
      "happy",
      "gentle",
      "dark",
      "suspense"
    ],
    "style": [
      "electronic",
      "futuristic",
      "modern",
      "japanese",
      "fantasy"
    ],
    "scene": [
      "travel",
      "opening"
    ],
    "story": [
      "reunion",
      "flashback",
      "hope",
      "dream"
    ],
    "duration": "10:40",
    "durationSec": 640,
    "mp3": "/music/n/n121.mp3"
  },
  {
    "id": "n122",
    "title": "羊飼いの夕餉",
    "title_en": "Shepherd's Evening",
    "description": "夕暮れに羊を連れ帰る羊飼いの穏やかな鼻歌、牧歌的な村の夕食が始まる温かい時間。\nケルトと中世の音色が混ざり合い、素朴な暮らしの幸せがほのぼのとした旋律に乗って広がります。\nヨーロッパ風の村の日常シーンや、旅人が宿に辿り着く安堵の夕方シーンに温もりを与えます。",
    "description_en": "A shepherd hums while leading the flock home at dusk. Celtic and medieval tones blend into a warm, pastoral melody of simple village happiness.",
    "feeling": [
      "gentle",
      "happy"
    ],
    "style": [
      "celtic",
      "medieval"
    ],
    "scene": [
      "village",
      "field",
      "forest",
      "night",
      "travel",
      "shrine",
      "morning"
    ],
    "story": [
      "peaceful",
      "memory",
      "dailylife",
      "hope",
      "dream"
    ],
    "duration": "2:23",
    "durationSec": 143,
    "mp3": "/music/n/n122.mp3"
  },
  {
    "id": "n123",
    "title": "いつかの大地へ",
    "title_en": "Journey to a Distant Land",
    "description": "二胡の悲しくも美しい音色が、遥か彼方のいつかの大地へ向かう旅の切なさを心に刻みます。\n別れの言葉も言えないまま離れ離れになった大切な人への思い、再会の夢が旋律に溶けています。\n感動的な別れのエンディングや、大陸を旅する叙情詩的な映像作品に深い余韻をもたらします。（二胡演奏：中川えりか）",
    "description_en": "The erhu's mournful beauty etches the sorrow of a journey toward a distant land. Unspoken farewells and dreams of reunion dissolve into emotion.",
    "feeling": [
      "epic",
      "sad",
      "gentle",
      "mysterious"
    ],
    "style": [
      "oriental",
      "fantasy",
      "japanese"
    ],
    "scene": [
      "ending",
      "field",
      "village",
      "travel",
      "night",
      "morning",
      "snow",
      "forest",
      "opening"
    ],
    "story": [
      "farewell",
      "memory",
      "reunion",
      "peaceful",
      "dailylife",
      "hope",
      "flashback",
      "bonds"
    ],
    "duration": "3:39",
    "durationSec": 219,
    "mp3": "/music/n/n123.mp3"
  },
  {
    "id": "n124",
    "title": "二人の旅人",
    "title_en": "Two Travelers",
    "description": "「いつかの大地へ」をハープに乗せた版。二人の旅人が静かに並んで歩く道の優しさを描きます。\n言葉は少なくても確かに通じ合う絆が、澄んだハープの音の中に温かく宿っています。\n旅の道連れとの別れ・再会シーンや、二人の主人公が共に歩む旅路の情感豊かな演出に向いています。",
    "description_en": "A harp arrangement painting two travelers walking quietly side by side. Few words are needed — their bond resonates through the crystal tones of the harp.",
    "feeling": [
      "gentle",
      "sad"
    ],
    "style": [
      "fantasy",
      "celtic",
      "medieval"
    ],
    "scene": [
      "travel",
      "field",
      "night",
      "morning",
      "snow",
      "forest",
      "village",
      "town"
    ],
    "story": [
      "memory",
      "bonds",
      "farewell",
      "reunion",
      "hope",
      "peaceful",
      "dailylife"
    ],
    "duration": "2:58",
    "durationSec": 178,
    "mp3": "/music/n/n124.mp3"
  },
  {
    "id": "n125",
    "title": "浮遊する光",
    "title_en": "Drifting Light",
    "description": "夜の空間に静かに漂う光の粒が、まるで生き物のように揺らめきながら辺りを照らします。\n音より静寂に近い環境音楽が、神秘的な光の存在を無言のまま丁寧に描き出します。\n神秘的な演出や、光の精霊が宿る聖域のシーン、夜の水面や蛍のような静かな映像に合います。",
    "description_en": "Particles of light drift silently through the night, glowing as if alive. Near-silent ambient textures trace something mystical lingering in the darkness.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "electronic",
      "fantasy"
    ],
    "scene": [
      "night",
      "shrine"
    ],
    "story": [
      "dream",
      "flashback",
      "omen"
    ],
    "duration": "2:12",
    "durationSec": 132,
    "mp3": "/music/n/n125.mp3"
  },
  {
    "id": "n126",
    "title": "監獄ミーティング",
    "title_en": "Prison Meeting",
    "description": "パーカッションが陰謀のリズムを刻み、密室で交わされる企みの言葉がひそひそと響きます。\n鉄格子の向こうで囚人たちが暗い計画を練り上げていくような、不穏な緊張感が漂います。\n陰謀・謀略シーンや、悪役たちの密談・秘密会議を演出するサスペンスBGMとして向いています。",
    "description_en": "Percussion sets the rhythm of conspiracy as whispered schemes echo in a sealed room. Behind iron bars, dark plans take shape in thick suspense.",
    "feeling": [
      "suspense",
      "dark"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "shrine",
      "night",
      "village",
      "forest"
    ],
    "story": [
      "conspiracy",
      "dailylife",
      "omen"
    ],
    "duration": "2:22",
    "durationSec": 142,
    "mp3": "/music/n/n126.mp3"
  },
  {
    "id": "n127",
    "title": "アメノフトツハシラ",
    "title_en": "Pillars of Heaven",
    "description": "天地を貫く二本の柱のように、悠久の自然と神々の息吹が万物を静かに包み込む神秘の曲。\n古事記の世界から吹いてくるような荘厳な風が、森と社と大地の神聖さを音で再現します。\n神社や古代遺跡、自然の聖域を舞台にした和風の神話シーンや儀式の場面に向いている一曲です。",
    "description_en": "Two pillars bridge heaven and earth, channeling the eternal breath of gods and nature. A sacred wind sweeps through shrine and forest in mythic Japan.",
    "feeling": [
      "gentle",
      "mysterious",
      "epic"
    ],
    "style": [
      "japanese",
      "fantasy",
      "oriental"
    ],
    "scene": [
      "forest",
      "shrine",
      "village",
      "night",
      "travel",
      "ruins",
      "cave",
      "onsen",
      "morning"
    ],
    "story": [
      "peaceful",
      "omen",
      "resolve",
      "destiny",
      "hope"
    ],
    "duration": "2:19",
    "durationSec": 139,
    "mp3": "/music/n/n127.mp3"
  },
  {
    "id": "n128",
    "title": "挑戦者達の夜明け",
    "title_en": "Challengers' Dawn",
    "description": "朝日が地平線を染め上げる中、さあ行くぞという前向きな意気込みが音楽に滲み出ています。\n挑戦者たちの力強い足音と、未知の冒険への期待が夜明けの光と共に大きく膨らんでいきます。\n新しいステージの幕開けや、主人公たちが意気揚々と旅立つオープニングシーンに合う一曲です。",
    "description_en": "Dawn paints the horizon as determination surges. Challengers' footsteps grow louder, and the promise of unknown adventure swells with the rising light.",
    "feeling": [
      "epic",
      "happy",
      "mysterious",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening",
      "travel",
      "field",
      "morning"
    ],
    "story": [
      "victory",
      "hope",
      "omen",
      "resolve",
      "peaceful"
    ],
    "duration": "0:23",
    "durationSec": 23,
    "mp3": "/music/n/n128.mp3"
  },
  {
    "id": "n129",
    "title": "鏡の世界は眠らない",
    "title_en": "The Mirror World Sleeps Not",
    "description": "じわりじわりと侵食してくる異質な何かが、慣れ親しんだ世界の輪郭をゆっくりと変えていきます。\n鏡の向こう側で別の世界が動き始め、二つの現実が少しずつずれていく恐ろしい変容のイメージ。\n平行世界・鏡像世界が交差するSFホラーや、異形のものが侵入する不穏なシーンの演出に向いています。",
    "description_en": "Something alien creeps in, distorting the familiar world's edges. Behind the mirror, another reality stirs — two planes drifting apart in terrifying silence.",
    "feeling": [
      "mysterious",
      "suspense",
      "dark",
      "scary"
    ],
    "style": [
      "fantasy",
      "electronic",
      "western_horror"
    ],
    "scene": [
      "night",
      "shrine",
      "samurai",
      "ruins"
    ],
    "story": [
      "conspiracy",
      "despair"
    ],
    "duration": "2:57",
    "durationSec": 177,
    "mp3": "/music/n/n129.mp3"
  },
  {
    "id": "n130",
    "title": "大樹-その旅の終わりに-",
    "title_en": "The Great Tree",
    "description": "すべての命の旅路が最後に辿り着く大樹が、優しく静かに生を包み込む壮大なエンディング曲。\n長い旅が終わり、愛おしい記憶と共に安らかな眠りに落ちていくような深い安堵と感謝。\n物語の最後を締めくくる感動のエンディングや、命をテーマにした映像作品の締めによく合う一曲です。",
    "description_en": "A grand tree at the end of all journeys embraces every soul. The long road concludes in relief and gratitude, as memories settle into peaceful rest.",
    "feeling": [
      "gentle",
      "sad",
      "epic",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "ending",
      "forest",
      "night",
      "travel",
      "morning",
      "snow"
    ],
    "story": [
      "farewell",
      "peaceful",
      "reunion",
      "memory",
      "destiny",
      "dream",
      "hope"
    ],
    "duration": "2:56",
    "durationSec": 176,
    "mp3": "/music/n/n130.mp3"
  },
  {
    "id": "n131",
    "title": "壊れゆく心",
    "title_en": "Crumbling Heart",
    "description": "最初は優しくかすかに揺れていたピアノが、やがてその調和を失い哀しく崩れ落ちていきます。\n守りたかったものが少しずつ壊れていく痛みと、どうにもできない無力感が旋律に宿ります。\n精神崩壊や失意のどん底、内面が壊れていくキャラクターの深い悲しみのシーンに寄り添います。",
    "description_en": "A piano begins with fragile tenderness, then loses harmony and crumbles into sorrow. The pain of something precious breaking apart, and the helplessness after.",
    "feeling": [
      "sad",
      "gentle",
      "dark",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night",
      "morning"
    ],
    "story": [
      "farewell",
      "defeat",
      "memory",
      "flashback",
      "despair",
      "destiny",
      "peaceful",
      "dream"
    ],
    "duration": "4:52",
    "durationSec": 292,
    "mp3": "/music/n/n131.mp3"
  },
  {
    "id": "n132",
    "title": "chaos-精神崩壊-",
    "title_en": "Chaos",
    "description": "電子音が凶暴な崩壊の波となって、精神の秩序を次々と押し潰していくカオスのサウンド。\n理性の最後の砦が音とともに砕け散り、意識が闇の渦に飲み込まれていく恐怖のビジョン。\n精神崩壊・狂気のシーンや、暗い洞窟での心理ホラー演出に強い混乱感を与えます。",
    "description_en": "Electronic sound erupts in violent waves, crushing the mind's last defenses. Reason shatters as consciousness spirals into a dark vortex of chaos and dread.",
    "feeling": [
      "dark",
      "scary",
      "suspense"
    ],
    "style": [
      "electronic",
      "japanese_horror"
    ],
    "scene": [
      "cave"
    ],
    "story": [
      "despair",
      "destiny",
      "omen"
    ],
    "duration": "3:12",
    "durationSec": 192,
    "mp3": "/music/n/n132.mp3"
  },
  {
    "id": "n133",
    "title": "祈祷-清-",
    "title_en": "Shrine Prayer",
    "description": "朝露に濡れた社の清々しい空気の中で、神や自然に捧げる清浄な祈りが静かに立ち上ります。\n人の手が届かない神聖な場所で、心が澄み渡っていくような爽やかな和の祈祷音楽です。\n神社・森の聖域シーン、儀式の清めや神様との対話を描く幻想的な和風シーンに向いています。",
    "description_en": "In crisp morning air at a dew-kissed shrine, a pure prayer rises to the gods. A Japanese sacred melody that cleanses the spirit beyond human reach.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "shrine",
      "forest"
    ],
    "story": [
      "peaceful",
      "hope"
    ],
    "duration": "2:03",
    "durationSec": 123,
    "mp3": "/music/n/n133.mp3"
  },
  {
    "id": "n134",
    "title": "祈祷-迷-",
    "title_en": "Uneasy Prayer",
    "description": "「祈祷-清-」の対となる曲。神への祈りに迷いと不安が混じり込んだ、少し不穏な夜の祈祷。\n境内に影が差し込み、祈る者の心に問いかけるような不吉な気配が静かに忍び込みます。\n神や運命に試されるシーンや、信仰と疑念が交錯する深夜の神社シーンの演出に独特の緊張感を与えます。",
    "description_en": "The counterpart to a serene prayer — doubt seeps into a nighttime supplication. Shadows fall across shrine grounds as an ominous presence tests the faithful.",
    "feeling": [
      "mysterious",
      "suspense"
    ],
    "style": [
      "japanese"
    ],
    "scene": [
      "shrine",
      "forest",
      "night"
    ],
    "story": [],
    "duration": "1:50",
    "durationSec": 110,
    "mp3": "/music/n/n134.mp3"
  },
  {
    "id": "n135",
    "title": "神言の泉",
    "title_en": "Sacred Spring",
    "description": "静かなハープと女性ボーカルが、神の言葉が湧き出る聖なる泉のほとりを幻想的に描きます。\n澄んだ水面に神秘的な光が揺れ、言葉を超えた啓示がそっと心に伝わってくる神聖な瞬間。\n神話・ファンタジーの神聖な場面や、予言・神託のシーンに他にはない神秘的な演出を与えます。",
    "description_en": "Gentle harp and ethereal vocals conjure a sacred spring where divine words well from crystalline waters. Holy revelation shimmers with otherworldly light.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "shrine",
      "forest"
    ],
    "story": [
      "dream"
    ],
    "duration": "2:57",
    "durationSec": 177,
    "mp3": "/music/n/n135.mp3"
  },
  {
    "id": "n136",
    "title": "精霊舞い",
    "title_en": "Spirit Dance",
    "description": "ケルトの精霊たちが戦舞を踊るように、軽やかでありながら刃のような激しさを持つ疾走曲。\n木の葉が渦巻く中で光の剣が交差し、目にも止まらぬ速さで戦いが展開していきます。\nファンタジーの精霊・妖精を使ったバトルシーンや、速いテンポの戦闘・追跡シーンに向いています。",
    "description_en": "Celtic spirits whirl in a war dance — nimble yet razor-sharp, surging at breathtaking speed. Blades of light cross amid swirling leaves in fierce combat.",
    "feeling": [
      "epic",
      "suspense",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "celtic"
    ],
    "scene": [
      "battle",
      "forest",
      "field",
      "travel"
    ],
    "story": [
      "victory",
      "resolve",
      "destiny"
    ],
    "duration": "3:42",
    "durationSec": 222,
    "mp3": "/music/n/n136.mp3"
  },
  {
    "id": "n137",
    "title": "アソの怒り",
    "title_en": "Volcanic Wrath",
    "description": "噴き上がる炎と噴煙、轟音と共に大地を割る阿蘇の怒りが荒れ狂う壮絶な戦闘曲。\n灼熱の噴石が雨のように降り注ぐ中、逃げ惑う人々の絶望と恐怖が音楽に刻み込まれます。\n火山・自然災害をテーマにしたシーンや、強いな力を持つボスとの絶望的な戦いに使えます。",
    "description_en": "Flames erupt as the earth splits with a deafening roar. Molten rock rains through darkness — an powerful force of nature unleashed in devastating fury.",
    "feeling": [
      "epic",
      "suspense",
      "dark"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "battle",
      "field",
      "boss",
      "dungeon",
      "ruins",
      "samurai"
    ],
    "story": [
      "defeat",
      "despair",
      "pursuit"
    ],
    "duration": "4:05",
    "durationSec": 245,
    "mp3": "/music/n/n137.mp3"
  },
  {
    "id": "n138",
    "title": "Where is the hero ?",
    "title_en": "Where Is the Hero",
    "description": "果てしない戦場に風が吹き抜け、英雄の名を呼ぶ声が誰もいない空に消えていく壮絶な曲。\n数多の命が散った後の静寂と、それでも戦い続ける者たちの悲哀と意志が深く刻まれています。\n戦争の幕開けや叙事詩的なエピローグ、英雄の不在を嘆く壮大なシーンに大きな感情を与えます。",
    "description_en": "Wind sweeps an endless battlefield, carrying the hero's name into an empty sky. After countless lives have fallen, grief and resolve merge in epic requiem.",
    "feeling": [
      "epic",
      "sad",
      "suspense"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "opening",
      "battle",
      "ending",
      "samurai"
    ],
    "story": [
      "farewell",
      "reunion",
      "victory",
      "resolve",
      "destiny"
    ],
    "duration": "2:44",
    "durationSec": 164,
    "mp3": "/music/n/n138.mp3"
  },
  {
    "id": "n139",
    "title": "Target-月夜の狩人-",
    "title_en": "Target: Midnight Hunter",
    "description": "月夜の屋根の上を無音で駆ける暗殺者が、卓越した技術で標的を静かに追い詰めていきます。\n電子音と暗闇が生む冷酷な緊張感の中に、一切の迷いがない熟練の殺し屋の美学が宿ります。\n月夜の刺客シーンや、スタイリッシュなアクション・暗殺劇の演出にクールな緊張感を与えます。",
    "description_en": "A silent assassin races across moonlit rooftops, closing in with lethal precision. Cold electronic tension embodies the flawless aesthetic of a master hunter.",
    "feeling": [
      "suspense",
      "dark",
      "epic"
    ],
    "style": [
      "fantasy",
      "electronic"
    ],
    "scene": [
      "night",
      "battle"
    ],
    "story": [
      "conspiracy",
      "omen",
      "pursuit"
    ],
    "duration": "1:24",
    "durationSec": 84,
    "mp3": "/music/n/n139.mp3"
  },
  {
    "id": "n140",
    "title": "うさぎ紳士",
    "title_en": "Rabbit Gentleman",
    "description": "短編アニメーション「うさぎ紳士」のためのテーマ曲。シュールでちょっとおかしくて愛らしい。\n燕尾服を着たうさぎが紳士的に振る舞う、どこかずれているけれど憎めないキャラクターを描きます。\nコミカルなキャラクター紹介や、可愛くて少し変わったマスコットの登場シーンに個性を添えます。",
    "description_en": "A surreal theme for a rabbit in a tailcoat behaving like a fitting gentleman — slightly off-kilter yet utterly irresistible. Quirky charm in every note.",
    "feeling": [
      "happy",
      "cute"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "ending",
      "opening",
      "mansion"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "1:00",
    "durationSec": 60,
    "mp3": "/music/n/n140.mp3"
  },
  {
    "id": "n141",
    "title": "うさぎ紳士-マリンバVer-",
    "title_en": "Rabbit Gentleman (Marimba)",
    "description": "「うさぎ紳士」のマリンバアレンジ。木琴の軽やかな音色がキャラクターの愛嬌をより引き立てます。\n弾むようなマリンバのリズムが、うさぎ紳士のコミカルな日常をより明るく楽しく彩ります。\n明るい街や広場のシーンに使いやすく、オリジナル版と交互に使うことで変化も楽しめます。",
    "description_en": "A marimba arrangement amplifying the whimsical charm of a rabbit gentleman. Bouncy wooden tones brighten his comical daily routine with lighthearted energy.",
    "feeling": [
      "happy",
      "cute"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "ending",
      "opening",
      "town",
      "mansion"
    ],
    "story": [
      "dailylife",
      "peaceful"
    ],
    "duration": "0:35",
    "durationSec": 35,
    "mp3": "/music/n/n141.mp3"
  },
  {
    "id": "n142",
    "title": "Overture!",
    "title_en": "Overture!",
    "description": "ポップな4つ打ちダンスビートが一気に弾けて、パーティーやアイドルの舞台が華やかに始まります。\nキラキラしたシンセの音とご機嫌なメロディーが、会場全体の期待感を一気に高めていきます。\nアイドルのステージ・ライブ開幕や、賑やかなパーティーのオープニング演出に向いている一曲です。",
    "description_en": "A pop beat bursts to life as the party begins. Sparkling synths and upbeat melodies fill the venue with soaring anticipation and dazzling stage presence.",
    "feeling": [
      "happy",
      "cute"
    ],
    "style": [
      "electronic",
      "modern",
      "futuristic"
    ],
    "scene": [
      "opening",
      "festival",
      "ending"
    ],
    "story": [
      "victory"
    ],
    "duration": "1:11",
    "durationSec": 71,
    "mp3": "/music/n/n142.mp3"
  },
  {
    "id": "n143",
    "title": "小さな探検隊",
    "title_en": "Little Expedition",
    "description": "子どもたちが地図片手に朝の野原へ飛び出す、小さな冒険隊の微笑ましい出発を描いた曲。\nのびやかな東洋風の旋律が、草むらをかき分けて虫や花を発見するワクワク感を表現します。\n子ども向けコンテンツや、平和な村・草原フィールドの日常BGMとして使いやすい一曲です。",
    "description_en": "Children dash into a morning meadow with a hand-drawn map on a small expedition. A gentle Eastern melody captures the thrill of discovering nature's wonders.",
    "feeling": [
      "happy",
      "gentle",
      "cute"
    ],
    "style": [
      "fantasy",
      "oriental"
    ],
    "scene": [
      "morning",
      "forest",
      "village",
      "field"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "2:00",
    "durationSec": 120,
    "mp3": "/music/n/n143.mp3"
  },
  {
    "id": "n144",
    "title": "火竜の洞窟",
    "title_en": "Fire Dragon's Cave",
    "description": "熱気と硫黄の匂いが漂う洞窟の奥から、火竜の低い唸り声が地響きと共に迫ってきます。\n逃げ場のない暗闇の中で赤い炎が壁を照らし、絶対的な恐怖と強いな力が存在を主張します。\nファンタジーゲームの火竜ボス戦や、死を予感させる恐ろしい洞窟のシーンに強い恐怖感を与えます。",
    "description_en": "Heat and sulfur fill the cavern as a fire dragon's growl rumbles through the earth. Red flames lick the walls of a pitch-black lair — absolute terror.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "oriental",
      "western_horror"
    ],
    "scene": [
      "dungeon",
      "cave",
      "boss",
      "battle",
      "ruins"
    ],
    "story": [
      "despair",
      "pursuit",
      "conspiracy",
      "defeat",
      "destiny"
    ],
    "duration": "2:10",
    "durationSec": 130,
    "mp3": "/music/n/n144.mp3"
  },
  {
    "id": "n145",
    "title": "氷雪の森林",
    "title_en": "Frozen Forest",
    "description": "静寂に包まれた雪の森に、氷の結晶が一つ一つ積もるような神秘的で落ち着いた冬のBGM。\n冷たい空気の中に宿る静けさと美しさが、訪れる者の心を静かに染め上げていきます。\n雪景色の探索シーンや、冬の神聖な場所・氷の洞窟・魔法の森の演出に向いている一曲です。",
    "description_en": "Ice crystals settle one by one across a silent, snow-covered forest. A serene winter atmosphere where cold air holds both stillness and ethereal beauty.",
    "feeling": [
      "mysterious",
      "gentle",
      "sad"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest",
      "town",
      "village",
      "night",
      "ruins",
      "cave",
      "shrine",
      "morning",
      "snow"
    ],
    "story": [
      "peaceful",
      "memory",
      "hope",
      "omen",
      "flashback"
    ],
    "duration": "2:44",
    "durationSec": 164,
    "mp3": "/music/n/n145.mp3"
  },
  {
    "id": "n146",
    "title": "辺境でこんにちは",
    "title_en": "Hello from the Frontier",
    "description": "ちょっぴりマヌケで愛嬌たっぷり、のんびりとした辺境の村の日常をケルトの音色で描いた曲。\n緊張感ゼロで平和すぎる田舎の生活がほのぼのと伝わる、肩の力が抜ける癒しのBGMです。\n辺境の村・ほのぼのファンタジーの日常シーンや、コミカルなキャラクターの普段の様子に合います。",
    "description_en": "A charmingly goofy Celtic tune depicting lazy frontier village life. Zero tension, maximum coziness — a soothing melody where nothing ever goes wrong.",
    "feeling": [
      "happy",
      "gentle",
      "cute"
    ],
    "style": [
      "fantasy",
      "celtic"
    ],
    "scene": [
      "village",
      "forest"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "1:33",
    "durationSec": 93,
    "mp3": "/music/n/n146.mp3"
  },
  {
    "id": "n147",
    "title": "大地を揺るがす咆哮",
    "title_en": "Earth-Shaking Roar",
    "description": "大地を震わせる咆哮が轟き、天地をも揺るがす強いな力を持つ存在との激闘が始まります。\n重厚なオーケストラが容赦なく迫り来る恐怖と興奮を煽り、深い絶望感が場を支配します。\nRPGの強大なボス戦や、巨大モンスターとの決死の戦いシーンに強い緊張と興奮を与えます。",
    "description_en": "A roar shakes the earth, heralding a titanic clash against an powerful foe. Thunderous orchestration drives relentless dread as hopelessness takes hold.",
    "feeling": [
      "epic",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "battle",
      "boss",
      "ruins",
      "dungeon",
      "cave"
    ],
    "story": [
      "farewell",
      "omen",
      "resolve",
      "defeat",
      "conspiracy",
      "pursuit"
    ],
    "duration": "2:58",
    "durationSec": 178,
    "mp3": "/music/n/n147.mp3"
  },
  {
    "id": "n148",
    "title": "未知の旅へ",
    "title_en": "Into the Unknown",
    "description": "希望が胸いっぱいに溢れ、どこまでも広がる地平線へと踏み出す冒険の始まりの清々しい曲。\n可愛らしさと壮大さが同居する旋律が、誰もが胸に持つ「知らない世界を見たい」という夢を描きます。\n物語の幕開けや、主人公がはじめて世界に飛び出すオープニングシーンに夢と勇気を添えます。",
    "description_en": "Hope overflows as you step toward an endless horizon. A melody both endearing and grand, voicing the universal dream of discovering worlds yet unseen.",
    "feeling": [
      "happy",
      "gentle",
      "epic",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "travel",
      "field",
      "opening",
      "forest",
      "morning"
    ],
    "story": [
      "victory",
      "hope",
      "dream",
      "peaceful",
      "dailylife",
      "reunion"
    ],
    "duration": "2:17",
    "durationSec": 137,
    "mp3": "/music/n/n148.mp3"
  },
  {
    "id": "n149",
    "title": "天倫の桜",
    "title_en": "Cherry Blossoms of Fate",
    "description": "運命に結ばれた命たちが桜の花びらのように舞い、天地の理の中で美しく輝く壮大な和風曲。\n日本の美学と侍の誇りが融合した格好いい旋律が、物語の幕開けに壮麗な彩りを与えます。\n和風ゲームや映像作品の迫力あるオープニング、和の美しさを象徴するシーンによく合う一曲です。",
    "description_en": "Fated souls dance like cherry blossoms in a grand Japanese overture of beauty and pride. Samurai honor and aesthetics fuse into a magnificent curtain-raiser.",
    "feeling": [
      "epic",
      "gentle",
      "mysterious"
    ],
    "style": [
      "japanese",
      "fantasy"
    ],
    "scene": [
      "opening",
      "ending",
      "shrine",
      "onsen",
      "samurai",
      "morning",
      "travel"
    ],
    "story": [
      "memory",
      "reunion",
      "victory",
      "bonds",
      "resolve",
      "destiny",
      "hope"
    ],
    "duration": "1:29",
    "durationSec": 89,
    "mp3": "/music/n/n149.mp3"
  },
  {
    "id": "c1",
    "title": "千年の追憶",
    "title_en": "A Thousand Years",
    "description": "古代の石畳を渡る風のように、穏やかで荘厳な旋律が悠久の時を運んでくる。\n栄光の記憶と喪失の哀愁が交差する、壮大な歴史叙事詩の雰囲気。\n中世・東洋的世界観の重厚なシーンや、過去を回想するドラマに。",
    "description_en": "A solemn melody drifts like wind across ancient cobblestones, carrying echoes of a thousand years. Glory and loss intertwine in sweeping historical grandeur.",
    "feeling": [
      "epic",
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "medieval",
      "oriental"
    ],
    "scene": [
      "ruins",
      "dungeon",
      "forest",
      "night",
      "morning",
      "shrine",
      "village"
    ],
    "story": [
      "memory",
      "victory",
      "reunion",
      "farewell",
      "dailylife",
      "flashback",
      "dream"
    ],
    "duration": "4:16",
    "durationSec": 256,
    "mp3": "/music/c/c1.mp3"
  },
  {
    "id": "c2",
    "title": "日時計の丘",
    "title_en": "Sundial Hill",
    "description": "夕暮れの丘を駆け回る子供たちの笑い声が聞こえてきそうな、温かいBGM。\n木漏れ日と草の香り、日時計が影を長く伸ばす夕方の一コマを描いています。\n子供が遊ぶシーンや、のどかな村の日常描写にぴったりです。",
    "description_en": "Warmth radiates from a hilltop where children's laughter mingles with fading sunlight. A sundial stretches its shadow across a gentle, golden afternoon.",
    "feeling": [
      "happy",
      "gentle",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "field",
      "forest",
      "village",
      "town",
      "travel",
      "morning",
      "night",
      "snow",
      "shrine",
      "onsen"
    ],
    "story": [
      "peaceful",
      "memory",
      "hope",
      "flashback",
      "dailylife"
    ],
    "duration": "2:12",
    "durationSec": 132,
    "mp3": "/music/c/c2.mp3"
  },
  {
    "id": "c3",
    "title": "昼下がりのワルツ",
    "title_en": "Afternoon Waltz",
    "description": "石畳の路地を陽光が照らす午後、ゆったりとしたワルツのリズムが流れる。\n中世ヨーロッパの街角を散歩するような、心地よい開放感に満ちた一曲。\n街の日常シーンや旅人の休息場面のBGMに幅広く使えます。",
    "description_en": "Sunlight warms cobblestone lanes as a leisurely waltz drifts through the afternoon. The carefree ease of strolling through a medieval European town.",
    "feeling": [
      "gentle",
      "happy"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "town",
      "travel",
      "mansion",
      "morning",
      "snow",
      "field",
      "forest",
      "village"
    ],
    "story": [
      "hope",
      "dream",
      "peaceful",
      "dailylife"
    ],
    "duration": "1:40",
    "durationSec": 100,
    "mp3": "/music/c/c3.mp3"
  },
  {
    "id": "c4",
    "title": "I'm home",
    "title_en": "Coming Home",
    "description": "夕焼け空の下、長い旅から帰り着いた時のような安堵と温もりが広がる。\n懐かしい場所へ戻る喜びの中に、ほんの少しの切なさが混じり合っている。\n帰還シーン・家族との再会・感動的なエンディングに映えるBGMです。",
    "description_en": "Relief and warmth wash over you like a sunset welcoming a weary traveler home. Joy mingles with bittersweetness — the feeling of returning to where you belong.",
    "feeling": [
      "gentle",
      "cute",
      "sad"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "village",
      "town",
      "forest",
      "onsen",
      "snow",
      "night"
    ],
    "story": [
      "peaceful",
      "memory",
      "reunion",
      "farewell",
      "dailylife",
      "flashback",
      "dream"
    ],
    "duration": "2:01",
    "durationSec": 121,
    "mp3": "/music/c/c4.mp3"
  },
  {
    "id": "c5",
    "title": "イスタンブルの楽園",
    "title_en": "Istanbul Garden",
    "description": "モスクのミナレットが空に映える賑わいの街角、異国情緒溢れる旋律が踊る。\nスパイスの香りと人々の活気を感じさせる、中東風のほのぼのとした楽曲。\n市場・異国の街・旅のシーンや、ファンタジー世界の東洋的な場面に。",
    "description_en": "Minarets frame a lively bazaar where exotic melodies dance on spice-scented air. A cheerful Middle Eastern tune brimming with the bustle of a vibrant market.",
    "feeling": [
      "happy",
      "mysterious",
      "gentle"
    ],
    "style": [
      "fantasy",
      "oriental"
    ],
    "scene": [
      "shrine",
      "field",
      "town",
      "village",
      "forest",
      "morning",
      "ruins"
    ],
    "story": [
      "peaceful",
      "dailylife",
      "dream",
      "hope"
    ],
    "duration": "1:42",
    "durationSec": 102,
    "mp3": "/music/c/c5.mp3"
  },
  {
    "id": "c6",
    "title": "Spring walk",
    "title_en": "Spring Walk",
    "description": "春の柔らかな陽射しを浴びながら、のんびりと街を歩くような清々しいBGM。\n花びらが舞い散る路地で出会う小さな発見と喜びを音楽で描いています。\n春・街の散歩・日常の小さな幸せを表現するシーンに向いています。",
    "description_en": "Soft spring sunlight accompanies an unhurried stroll through blossoming streets. Petals drift as small discoveries and quiet joys unfold with every step.",
    "feeling": [
      "gentle",
      "happy"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "town",
      "travel",
      "morning",
      "forest",
      "field",
      "village"
    ],
    "story": [
      "dailylife",
      "peaceful",
      "dream",
      "flashback",
      "hope"
    ],
    "duration": "3:51",
    "durationSec": 231,
    "mp3": "/music/c/c6.mp3"
  },
  {
    "id": "c7",
    "title": "星寂の散歩道",
    "title_en": "Starlit Stroll",
    "description": "深夜の静寂に包まれた道を、星明かりだけを頼りにそっと歩いていく。\n孤独でありながら、宇宙と繋がるような不思議な安らぎが流れる音楽。\n夜の瞑想・星空シーン・静かな心の旅を表現する場面に。",
    "description_en": "Walking softly under a canopy of stars on a silent midnight road. Solitude transforms into a strange, cosmic peace — the universe offering gentle companionship.",
    "feeling": [
      "gentle",
      "sad",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "town",
      "night",
      "travel",
      "village",
      "field",
      "forest",
      "snow"
    ],
    "story": [
      "peaceful",
      "dailylife",
      "memory",
      "flashback",
      "dream"
    ],
    "duration": "4:15",
    "durationSec": 255,
    "mp3": "/music/c/c7.mp3"
  },
  {
    "id": "c8",
    "title": "森のゆりかご",
    "title_en": "Forest Cradle",
    "description": "木々の葉ずれと小鳥のさえずりを優しく包み込む、森の子守唄のような曲。\n大木の根元で眠りにつくような、深い安心感と神秘的な自然の息吹を感じます。\nヒーリング・森の場面・眠りを誘うシーンのBGMに。",
    "description_en": "A lullaby woven from rustling leaves and birdsong beneath a forest canopy. Deep comfort and nature's mystical breath gently lull the spirit to rest.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest",
      "town",
      "village",
      "field",
      "morning",
      "shrine",
      "onsen"
    ],
    "story": [
      "flashback",
      "dailylife",
      "peaceful",
      "dream"
    ],
    "duration": "4:04",
    "durationSec": 244,
    "mp3": "/music/c/c8.mp3"
  },
  {
    "id": "c9",
    "title": "夜明けの風",
    "title_en": "Dawn Breeze",
    "description": "夜が明けようとする静寂の中、清涼な風がそっと窓を開けるような一曲。\n世界がゆっくりと目を覚ます神秘的な時間を、柔らかな旋律で描いています。\n夜明けのシーン・新たな始まり・瞑想用のBGMとして映えます。",
    "description_en": "A cool breeze parts the curtains of silence just before dawn. The world stirs awake in a delicate melody capturing the sacred moment between night and day.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning"
    ],
    "story": [
      "reunion",
      "memory",
      "hope",
      "dream",
      "peaceful"
    ],
    "duration": "0:17",
    "durationSec": 17,
    "mp3": "/music/c/c9.mp3"
  },
  {
    "id": "c10",
    "title": "陽だまりの花",
    "title_en": "Sunlit Flowers",
    "description": "東洋の草原に咲く花が、暖かな陽だまりの中でそよ風に揺れる情景。\n穏やかな神秘性を帯びた和の旋律が、広大な大地の静けさを伝えます。\n自然の美しい場面・瞑想・東洋風ファンタジーのBGMに。",
    "description_en": "Flowers sway in a sunlit meadow as an Eastern melody whispers of vast, quiet lands. Gentle mysticism and the stillness of open horizons in tranquil harmony.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "oriental"
    ],
    "scene": [
      "field",
      "village",
      "town",
      "forest",
      "morning",
      "onsen"
    ],
    "story": [
      "peaceful",
      "flashback",
      "dream",
      "hope",
      "dailylife"
    ],
    "duration": "1:22",
    "durationSec": 82,
    "mp3": "/music/c/c10.mp3"
  },
  {
    "id": "c11",
    "title": "幸福の余韻",
    "title_en": "Morning Jingle",
    "description": "朝の光の中に広がる幸福感を、短くも鮮やかに切り取ったジングル。\n小さな幸せが心に残るような、清々しい希望と平和のひとときを届けます。\n場面転換・アイキャッチ・ポジティブな瞬間の演出に向いています。",
    "description_en": "A brief, vivid jingle capturing the radiance of a bright morning. A small burst of happiness, hope, and peace — crisp and clear like the first light of day.",
    "feeling": [
      "gentle",
      "happy",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning"
    ],
    "story": [
      "peaceful",
      "reunion",
      "hope"
    ],
    "duration": "0:12",
    "durationSec": 12,
    "mp3": "/music/c/c11.mp3"
  },
  {
    "id": "c12",
    "title": "ドゥブロヴニク旧市街",
    "title_en": "Old Town Square",
    "description": "地中海を望む石造りの旧市街、赤い屋根の間を抜ける活気ある風の歌。\n爽やかな陽射しと賑わいが溢れる、中世ヨーロッパの港町を描いた元気な一曲。\n活気ある街のシーン・旅・陽気な冒険の出発シーンに映えます。",
    "description_en": "Lively winds weave between red-roofed buildings in a Mediterranean old town by the sea. A spirited tune of sunshine, bustling crowds, and setting sail.",
    "feeling": [
      "happy",
      "gentle"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "town",
      "ruins",
      "village",
      "forest",
      "field",
      "travel",
      "morning"
    ],
    "story": [
      "peaceful",
      "dailylife",
      "reunion"
    ],
    "duration": "2:42",
    "durationSec": 162,
    "mp3": "/music/c/c12.mp3"
  },
  {
    "id": "c13",
    "title": "羊飼いの草原",
    "title_en": "Shepherd's Meadow",
    "description": "緑の草原を渡る風と笛の音、羊の鈴の音が混じり合う牧歌的な情景。\nケルト民謡の温もりを感じさせる、北欧の大地に根ざした素朴な一曲です。\n牧場・村の祭り・民俗的なファンタジーシーンのBGMに。",
    "description_en": "Wind and flute cross a green meadow where shepherd's bells chime among the flock. Celtic warmth and folk simplicity evoke the timeless charm of pastoral life.",
    "feeling": [
      "gentle",
      "happy"
    ],
    "style": [
      "fantasy",
      "celtic"
    ],
    "scene": [
      "field",
      "forest",
      "village",
      "town",
      "travel",
      "morning",
      "ruins"
    ],
    "story": [
      "memory",
      "peaceful",
      "dailylife",
      "hope",
      "dream"
    ],
    "duration": "2:20",
    "durationSec": 140,
    "mp3": "/music/c/c13.mp3"
  },
  {
    "id": "c14",
    "title": "聖堂のレリーフ",
    "title_en": "Cathedral Relief",
    "description": "薄暗い聖堂の石壁に刻まれたレリーフが語りかけるような、静かな寂寥感。\n後半にかけて金管が加わり、神聖な荘厳さへと音楽が昇華していきます。\n中世宗教的シーン・秘密の発見・重厚な儀式の場面に。",
    "description_en": "Stone reliefs in a dim cathedral whisper forgotten tales. Brass gradually enters, lifting the music from quiet solemnity into sacred, resonant grandeur.",
    "feeling": [
      "sad",
      "mysterious",
      "suspense"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "shrine",
      "town",
      "forest",
      "village",
      "travel",
      "night"
    ],
    "story": [
      "farewell",
      "flashback"
    ],
    "duration": "2:11",
    "durationSec": 131,
    "mp3": "/music/c/c14.mp3"
  },
  {
    "id": "c15",
    "title": "原生の楽園",
    "title_en": "Wild Paradise",
    "description": "熱帯の密林で鳥が歌い、大きな動物がゆっくりと草原を渡る壮大な情景。\n生命力に満ちた大自然の息吹を、東洋的な旋律で雄大に描き出した楽曲。\n自然ドキュメンタリー・ファンタジー冒険・大地のシーンのBGMに。",
    "description_en": "Birds call across tropical canopies as great creatures roam a sunlit savanna. An Eastern melody channels the raw vitality and majesty of untamed wilderness.",
    "feeling": [
      "gentle",
      "happy",
      "epic"
    ],
    "style": [
      "fantasy",
      "oriental"
    ],
    "scene": [
      "field",
      "forest",
      "travel",
      "morning",
      "shrine",
      "ruins"
    ],
    "story": [
      "peaceful",
      "dailylife",
      "dream"
    ],
    "duration": "2:28",
    "durationSec": 148,
    "mp3": "/music/c/c15.mp3"
  },
  {
    "id": "c16",
    "title": "エピソード",
    "title_en": "The Episode",
    "description": "何かが始まる予感を漂わせながら、淡々と積み重なっていく緊張の音楽。\n謎めいた出来事の前夜のような、静かな不安と好奇心が入り混じった雰囲気。\nミステリー・シーン転換・不穏な日常の場面に自然にはまります。",
    "description_en": "Quiet tension builds steadily, hinting something is about to begin. Curiosity and unease blend in an understated atmosphere on the eve of mystery.",
    "feeling": [
      "suspense",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "ruins",
      "night"
    ],
    "story": [
      "destiny",
      "omen",
      "flashback"
    ],
    "duration": "1:15",
    "durationSec": 75,
    "mp3": "/music/c/c16.mp3"
  },
  {
    "id": "c17",
    "title": "三番街のボス猫",
    "title_en": "The Boss Cat",
    "description": "丸々と太った貫禄のボス猫が、石畳をのっしのっし歩く愉快な一曲。\nユーモラスなリズムと中世風のメロディーが、コミカルな威厳を演出します。\nコメディシーン・愛らしい動物キャラクターの登場場面に向いています。",
    "description_en": "A plump, dignified boss cat struts across cobblestones with absolute authority. Humorous rhythms and medieval flair lend comical grandeur to every step.",
    "feeling": [
      "happy",
      "cute"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "town",
      "onsen"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "2:02",
    "durationSec": 122,
    "mp3": "/music/c/c17.mp3"
  },
  {
    "id": "c18",
    "title": "まどろみの色彩",
    "title_en": "Hazy Morning",
    "description": "目覚める前のまどろみの中に浮かぶ、現実と夢の境界のような不思議な音楽。\n早朝の光がゆっくりと差し込む中、異空間の色彩が淡くにじんでいきます。\n夢幻シーン・異世界の夜明け・SFの静かな演出に。",
    "description_en": "Hovering between sleep and waking, where reality and dream dissolve into one. Early light seeps in slowly as alien colors bleed softly through the stillness.",
    "feeling": [
      "mysterious",
      "gentle"
    ],
    "style": [
      "fantasy",
      "futuristic"
    ],
    "scene": [
      "morning",
      "forest"
    ],
    "story": [
      "dream",
      "flashback",
      "peaceful"
    ],
    "duration": "0:53",
    "durationSec": 53,
    "mp3": "/music/c/c18.mp3"
  },
  {
    "id": "c19",
    "title": "小さな案内人",
    "title_en": "Little Guide",
    "description": "路地裏を知り尽くした小さな猫が、ちょこちょことした足取りで先を歩く。\n不思議な街角へと導く、愛らしくもどこかミステリアスなBGM。\n迷い込んだ街・隠れた世界への入り口・ほのぼのファンタジーに。",
    "description_en": "A small cat who knows every hidden alley trots ahead with a mysterious air. An adorable yet enigmatic guide toward secret corners of an unfamiliar world.",
    "feeling": [
      "mysterious",
      "happy",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning"
    ],
    "story": [
      "peaceful",
      "dailylife",
      "memory",
      "dream"
    ],
    "duration": "1:33",
    "durationSec": 93,
    "mp3": "/music/c/c19.mp3"
  },
  {
    "id": "c20",
    "title": "風の香り",
    "title_en": "Childhood Breeze",
    "description": "子供の頃に嗅いだ懐かしい風の匂いを、音楽で再現したような柔らかな一曲。\n遠い記憶の中にある幸福な時間が、優しいメロディーと共に蘇ってきます。\n回想シーン・子供時代の情景・ノスタルジックな演出のBGMに。",
    "description_en": "The scent of a childhood breeze rendered in sound — a soft melody unlocking distant golden memories. A gentle tide of nostalgia from a long-ago happiness.",
    "feeling": [
      "gentle",
      "cute",
      "happy",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning"
    ],
    "story": [
      "memory",
      "dailylife",
      "peaceful",
      "flashback"
    ],
    "duration": "1:21",
    "durationSec": 81,
    "mp3": "/music/c/c20.mp3"
  },
  {
    "id": "c21",
    "title": "遅めのランチ",
    "title_en": "Lazy Lunch",
    "description": "日向の窓辺でゆっくりとランチを楽しむような、のんびりとした幸福感。\n誰も急かさない午後の時間が、明るく軽やかなメロディーで流れていきます。\n日常のほのぼのしたシーン・カフェ・リラックスしたシーンに。",
    "description_en": "Sunlight pools on the windowsill as lunch stretches into a lazy afternoon. No one is in a rush — just warmth, simple pleasures, and a light, carefree melody.",
    "feeling": [
      "happy",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "town",
      "morning"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "0:46",
    "durationSec": 46,
    "mp3": "/music/c/c21.mp3"
  },
  {
    "id": "c22",
    "title": "騎士団と少年",
    "title_en": "The Knight and the Boy",
    "description": "少年が初めて戦場に立つ覚悟と恐れ、誇りと悲しみが入り混じる壮大な音楽。\n和風と中世ヨーロッパが交差する独自の世界で、命をかけた挑戦が描かれます。\n勇者の出陣・戦場シーン・覚悟を問われる重要な場面のBGMに。",
    "description_en": "A boy stands on the battlefield for the first time, trembling between courage and fear. Eastern and Western tones collide in an epic score of youthful resolve.",
    "feeling": [
      "sad",
      "epic",
      "suspense"
    ],
    "style": [
      "fantasy",
      "japanese",
      "medieval"
    ],
    "scene": [
      "battle",
      "opening",
      "travel"
    ],
    "story": [
      "victory",
      "reunion",
      "resolve",
      "destiny"
    ],
    "duration": "1:56",
    "durationSec": 116,
    "mp3": "/music/c/c22.mp3"
  },
  {
    "id": "c23",
    "title": "潮風とベンチ",
    "title_en": "Sea Breeze Bench",
    "description": "海辺のベンチに腰掛け、過ぎ去った一日を静かに振り返る夕暮れの音楽。\n潮風の香りと遠くの波音を感じながら、心の中でひとり対話するひととき。\n回想・物語の区切り・感傷的なシーンのBGMに静かに寄り添います。",
    "description_en": "Sitting on a seaside bench at dusk, quietly reflecting on the day. Salt air and distant waves frame a gentle inner dialogue tinged with soft melancholy.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "town",
      "village",
      "forest",
      "night",
      "morning",
      "church"
    ],
    "story": [
      "memory",
      "dailylife",
      "peaceful",
      "flashback"
    ],
    "duration": "2:46",
    "durationSec": 166,
    "mp3": "/music/c/c23.mp3"
  },
  {
    "id": "c24",
    "title": "家路",
    "title_en": "The Way Home",
    "description": "長い一日を終えて、疲れた足取りで家路を辿る夕暮れ時の情景。\n少しくたびれた優しさが滲む旋律が、帰り道の孤独な時間を温かく包む。\n疲労・帰宅・夕暮れシーンや感情的な余韻を残す場面に。",
    "description_en": "Weary footsteps trace the path homeward beneath a fading evening sky. A tired but tender melody wraps the solitary walk in quiet warmth and lingering emotion.",
    "feeling": [
      "sad",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "travel",
      "ending",
      "night"
    ],
    "story": [
      "farewell",
      "dailylife",
      "peaceful",
      "flashback"
    ],
    "duration": "0:36",
    "durationSec": 36,
    "mp3": "/music/c/c24.mp3"
  },
  {
    "id": "c25",
    "title": "海辺の街",
    "title_en": "Coastal Town",
    "description": "かつて栄えた港町の面影だけが残る、さびれた海辺の石畳を渡る風。\n廃れゆく街の哀愁と、それでも続く日々の静けさを奏でる曲です。\nさびれた町・廃墟・物語の悲しい局面や歴史の傷跡を描くシーンに。",
    "description_en": "Wind drifts over weathered cobblestones of a once-thriving harbor town. Faded glory and stillness compose a melancholy portrait of a place time left behind.",
    "feeling": [
      "sad"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "town",
      "field",
      "forest",
      "village",
      "travel",
      "ruins",
      "cave",
      "shrine"
    ],
    "story": [
      "dailylife",
      "peaceful",
      "farewell"
    ],
    "duration": "1:50",
    "durationSec": 110,
    "mp3": "/music/c/c25.mp3"
  },
  {
    "id": "c26",
    "title": "夕暮れの風",
    "title_en": "Dusk Wind",
    "description": "夕陽が地平線に沈むとき、空に漂う何とも言えない哀愁と静けさ。\n色を失っていく景色の中に、忘れられない誰かへの想いが溶けていきます。\n別れ・孤独・哀愁に満ちた場面・エンディングシーンに映えます。",
    "description_en": "As the sun sinks below the horizon, an indescribable sadness colors the fading sky. Memories of someone unforgettable dissolve into the gathering dusk.",
    "feeling": [
      "sad",
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning",
      "night"
    ],
    "story": [
      "memory",
      "reunion",
      "dream",
      "flashback"
    ],
    "duration": "0:22",
    "durationSec": 22,
    "mp3": "/music/c/c26.mp3"
  },
  {
    "id": "c27",
    "title": "メテオラの修道院",
    "title_en": "Highland Monastery",
    "description": "天空の岩山に建つ修道院を望む、ケルトのバグパイプが大地に響く壮大な一曲。\nギリシャの原風景のような広大さと、神聖な自然の荘厳さが交差します。\n壮大な自然・聖地・史詩的な場面のBGMとして高い存在感を放ちます。",
    "description_en": "Celtic bagpipes ring across highland peaks where a monastery clings to the sky. Vast landscapes and sacred grandeur converge in an anthem of earth and spirit.",
    "feeling": [
      "gentle",
      "epic"
    ],
    "style": [
      "fantasy",
      "celtic",
      "medieval"
    ],
    "scene": [
      "field",
      "ruins",
      "shrine",
      "town",
      "village",
      "forest",
      "festival",
      "morning",
      "opening"
    ],
    "story": [
      "omen",
      "victory",
      "peaceful",
      "dailylife"
    ],
    "duration": "2:31",
    "durationSec": 151,
    "mp3": "/music/c/c27.mp3"
  },
  {
    "id": "c28",
    "title": "優しい風",
    "title_en": "Gentle Breeze",
    "description": "穏やかな風がさっと吹き抜けるような、短く清々しいジングル曲。\n余計なものをすべてそぎ落とし、優しさだけを音にしたような純粋な一片。\n場面転換・演出のアクセント・静かな日常の合間の空気感として使えます。",
    "description_en": "A gentle breeze captured in a brief, refreshing jingle. Pure kindness distilled into sound — nothing more, nothing less. A breath of air between moments.",
    "feeling": [
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning"
    ],
    "story": [
      "reunion",
      "memory",
      "dream",
      "dailylife",
      "peaceful"
    ],
    "duration": "0:12",
    "durationSec": 12,
    "mp3": "/music/c/c28.mp3"
  },
  {
    "id": "c29",
    "title": "Green Garden",
    "title_en": "Green Garden",
    "description": "緑の庭に澄んだ朝風が吹き渡るような、清らかで心地よい一曲。\n芝生の露や花の香りを思わせる清涼感が、静かに心を洗い流してくれます。\nナチュラル・ヒーリング系のシーン・庭園・穏やかな癒しのBGMに。",
    "description_en": "A crisp morning breeze sweeps through a green garden. Dew on grass and the scent of blossoms quietly wash the spirit clean in soothing, refreshing tones.",
    "feeling": [
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest",
      "field",
      "morning"
    ],
    "story": [
      "peaceful",
      "dailylife",
      "dream",
      "hope",
      "flashback",
      "memory"
    ],
    "duration": "3:08",
    "durationSec": 188,
    "mp3": "/music/c/c29.mp3"
  },
  {
    "id": "c30",
    "title": "海の揺りかご",
    "title_en": "Ocean Cradle",
    "description": "波に揺られる小船のように、3拍子のワルツがゆったりと楽しく揺れる。\n青い海と爽やかな潮風が運んでくる、軽やかで心地よい幸福感に満ちた一曲。\n海・船旅・夏のシーン、そして子供向けの楽しい場面のBGMに向いています。",
    "description_en": "A waltz rocks gently like a small boat on sun-dappled waves. Blue ocean, fresh sea breeze, and buoyant joy lifting the heart with every lilting measure.",
    "feeling": [
      "gentle",
      "happy",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest",
      "morning"
    ],
    "story": [
      "peaceful",
      "dailylife"
    ],
    "duration": "2:09",
    "durationSec": 129,
    "mp3": "/music/c/c30.mp3"
  },
  {
    "id": "k1",
    "title": "「彼の丘に眠る」オープニング",
    "title_en": "Opening Theme",
    "description": "彼の丘を渡る爽やかな風と共に、失われた誰かへの懐かしい想いが溢れ出す。\n穏やかでありながら壮大な旋律が、物語の幕開けに合う余韻を生みます。\nゲームや映像作品のオープニング・序章・希望ある出発シーンに。",
    "description_en": "A refreshing wind crosses a distant hill, stirring memories of someone lost. Grand yet gentle, the melody opens the curtain on a story brimming with quiet hope.",
    "feeling": [
      "mysterious",
      "gentle",
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening",
      "morning"
    ],
    "story": [
      "memory",
      "victory",
      "reunion",
      "peaceful",
      "hope"
    ],
    "duration": "1:52",
    "durationSec": 112,
    "mp3": "/music/k/k1.mp3"
  },
  {
    "id": "k2",
    "title": "夢幻の風",
    "title_en": "Dream Wind",
    "description": "前半は広大な空を漂うような壮大で穏やかな旋律が静かに展開する。\n後半に差し掛かると一転して不穏な影が差し込み、寂しさと不安が広がります。\n変化のある物語・予感のあるシーン・前後半で対比が必要な場面に。",
    "description_en": "The first half drifts in serene calm like floating through open sky. Then shadows creep in, turning peace to unease — a melody of contrast and foreboding.",
    "feeling": [
      "gentle",
      "sad",
      "epic",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning",
      "opening"
    ],
    "story": [
      "dream",
      "hope",
      "reunion",
      "memory",
      "peaceful"
    ],
    "duration": "1:52",
    "durationSec": 112,
    "mp3": "/music/k/k2.mp3"
  },
  {
    "id": "k3",
    "title": "命在る者達への誘い",
    "title_en": "Call to the Living",
    "description": "生きとし生けるものを戦いへと召集するような、力強く神秘的な曲。\n東洋的な響きが荘厳さを加え、命をかけた挑戦への気構えを鼓舞します。\nボス戦前・大一番の序章・覚悟を決める場面のBGMとして強力。",
    "description_en": "A powerful, mystical call summoning all living things to battle. Eastern resonance adds solemn weight, steeling the heart for a life-or-death confrontation.",
    "feeling": [
      "epic",
      "mysterious",
      "suspense"
    ],
    "style": [
      "fantasy",
      "oriental"
    ],
    "scene": [
      "travel",
      "night",
      "forest"
    ],
    "story": [
      "destiny",
      "resolve",
      "flashback"
    ],
    "duration": "1:48",
    "durationSec": 108,
    "mp3": "/music/k/k3.mp3"
  },
  {
    "id": "k4",
    "title": "鉄の兵隊",
    "title_en": "Iron Soldiers",
    "description": "機械のように冷酷な兵隊たちが行進する、シンプルで不穏なアジアン・テイスト。\n感情を持たない鉄の意志が、繰り返すリズムの中に不気味に宿っています。\n敵の軍勢・謀略シーン・冷たい権力を象徴する場面のBGMに。",
    "description_en": "Soldiers march with mechanical precision in an unsettling Asian-tinged rhythm. Cold iron will pulses beneath the relentless beat — merciless authority in sound.",
    "feeling": [
      "mysterious",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "oriental"
    ],
    "scene": [
      "battle",
      "ruins"
    ],
    "story": [
      "destiny",
      "conspiracy",
      "flashback"
    ],
    "duration": "1:56",
    "durationSec": 116,
    "mp3": "/music/k/k4.mp3"
  },
  {
    "id": "k5",
    "title": "歩く男",
    "title_en": "The Wanderer",
    "description": "一人の男が荒野をただ歩き続けるような、哀愁滲むギターの短い一節。\n言葉より雄弁な孤独と、それでも歩みをやめない意志が音に込められています。\n孤独なキャラクター・哀愁シーン・場面転換のアクセントに。",
    "description_en": "A lone figure walks endlessly across a barren wasteland, accompanied only by melancholy guitar. More eloquent than words — raw solitude and unyielding resolve.",
    "feeling": [
      "sad"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "town",
      "night"
    ],
    "story": [
      "farewell",
      "memory",
      "flashback"
    ],
    "duration": "0:34",
    "durationSec": 34,
    "mp3": "/music/k/k5.mp3"
  },
  {
    "id": "k6",
    "title": "ブリキのコーヒーメーカー",
    "title_en": "Clockwork Mansion",
    "description": "歯車がコチコチと回る機械仕掛けの洋館で、奇妙な器具がコーヒーを淹れている。\n愛らしさとホラーが絶妙に混じり合う、不思議で個性的な空間を描いた楽曲です。\nコミカルホラー・からくり屋敷・シュールな世界観の場面に。",
    "description_en": "Gears tick inside a clockwork mansion where strange contraptions brew coffee on their own. A delightful blend of whimsy and unease in a peculiar space.",
    "feeling": [
      "happy",
      "cute",
      "scary"
    ],
    "style": [
      "fantasy",
      "medieval",
      "western_horror"
    ],
    "scene": [
      "night",
      "mansion"
    ],
    "story": [
      "despair",
      "flashback"
    ],
    "duration": "2:27",
    "durationSec": 147,
    "mp3": "/music/k/k6.mp3"
  },
  {
    "id": "k7",
    "title": "囚われた時間",
    "title_en": "Frozen Time",
    "description": "逃げ場のない緊張感が前半を支配し、やがて諦めの静寂へと落ちていく。\n時間が止まったような閉塞感の中で、最後には悲劇が静かに幕を閉じます。\n脱出不能なシーン・囚われの演出・悲劇的な結末を迎える場面に。",
    "description_en": "Inescapable tension dominates before surrendering to resigned, frozen silence. Time itself seems to stop as tragedy draws its final, quiet curtain.",
    "feeling": [
      "sad",
      "suspense"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night"
    ],
    "story": [
      "defeat",
      "despair"
    ],
    "duration": "3:10",
    "durationSec": 190,
    "mp3": "/music/k/k7.mp3"
  },
  {
    "id": "k8",
    "title": "確執",
    "title_en": "Hidden Discord",
    "description": "暗い思惑が交差する電子音の中で、疑念と孤独がじわじわと積み重なる。\n人間関係の歪みや心の影を、冷たいエレクトロニックな音色で描き出します。\n陰謀・内面葛藤・現代的なサスペンスシーンのBGMに。",
    "description_en": "Dark intentions converge in cold electronic tones as suspicion and isolation build layer by layer. Human connection distorted in chilling, synthetic atmosphere.",
    "feeling": [
      "sad",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "electronic"
    ],
    "scene": [
      "night",
      "dungeon"
    ],
    "story": [
      "conspiracy",
      "flashback",
      "omen"
    ],
    "duration": "2:45",
    "durationSec": 165,
    "mp3": "/music/k/k8.mp3"
  },
  {
    "id": "k9",
    "title": "刹那の時を",
    "title_en": "Fleeting Moment",
    "description": "子供のような無垢な笑顔と、それがいつか失われる予感が溶け合う音楽。\n儚いから美しい、その刹那の幸福を静かに大切に奏でた一曲です。\n回想・子供のシーン・短くも輝く幸せな時間の演出に。",
    "description_en": "An innocent smile and the premonition it will someday fade merge in tender melody. Beautiful because it is fleeting — a quiet celebration of one shining moment.",
    "feeling": [
      "gentle",
      "sad",
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest"
    ],
    "story": [
      "reunion",
      "memory"
    ],
    "duration": "2:04",
    "durationSec": 124,
    "mp3": "/music/k/k9.mp3"
  },
  {
    "id": "k10",
    "title": "酒乱の妄想",
    "title_en": "Desert Daydream",
    "description": "酔っぱらいが夢うつつで見る、陽気なアラビアンナイトの妄想音楽。\nドタバタとした滑稽さとアジアンなリズムが絡まる、独特のユーモア感覚が楽しい。\nコミカルシーン・酔いどれキャラクター・騒がしいドタバタ劇に。",
    "description_en": "A tipsy daydream spirals into a comical Arabian fantasy. Slapstick chaos and Asian rhythms tangle in a uniquely humorous, off-the-wall romp.",
    "feeling": [
      "happy"
    ],
    "style": [
      "fantasy",
      "oriental"
    ],
    "scene": [
      "ruins"
    ],
    "story": [
      "omen"
    ],
    "duration": "1:02",
    "durationSec": 62,
    "mp3": "/music/k/k10.mp3"
  },
  {
    "id": "k11",
    "title": "淡い光",
    "title_en": "Dim Light",
    "description": "闇の中でぼんやりと灯りが揺れるような、淡くて神秘的な短い旋律。\n存在するかどうかも分からない微かな光が、静かに心に宿ります。\n発見・ひらめき・不思議な雰囲気のジングルや場面転換に。",
    "description_en": "A faint glow flickers in the darkness — a short, ethereal phrase lingering on the edge of perception. A subtle spark of wonder in the void.",
    "feeling": [
      "mysterious",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning",
      "night"
    ],
    "story": [
      "flashback",
      "memory",
      "hope",
      "dream"
    ],
    "duration": "0:23",
    "durationSec": 23,
    "mp3": "/music/k/k11.mp3"
  },
  {
    "id": "k12",
    "title": "ミチビキソウ",
    "title_en": "Guiding Flower",
    "description": "大切な人の傍らでそっと寄り添う、言葉にならない優しさを奏でる音楽。\n見守ることしかできないもどかしさと愛情が、穏やかなメロディーに溶けています。\n回想・家族の情愛・静かな守護のシーンに温かく寄り添います。",
    "description_en": "A melody of unspoken tenderness, staying close to someone dear without words. The ache of watching over a loved one blends with warm devotion in gentle tones.",
    "feeling": [
      "gentle",
      "sad"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night"
    ],
    "story": [
      "dream",
      "hope",
      "flashback",
      "memory",
      "reunion",
      "farewell"
    ],
    "duration": "2:46",
    "durationSec": 166,
    "mp3": "/music/k/k12.mp3"
  },
  {
    "id": "k13",
    "title": "運命の星",
    "title_en": "Star of Fate",
    "description": "星々の導きのもと、避けられない運命へと向かう力強い意志の音楽。\n神秘的な壮大さと緊迫感が交差しながら、主人公の覚悟を後押しします。\n運命的な決戦・物語のクライマックス・英雄的な場面のBGMに。",
    "description_en": "Guided by stars, an unwavering will advances toward inescapable destiny. Mystical grandeur and mounting tension converge to bolster the hero's final resolve.",
    "feeling": [
      "epic",
      "mysterious",
      "suspense"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "battle"
    ],
    "story": [
      "destiny"
    ],
    "duration": "1:59",
    "durationSec": 119,
    "mp3": "/music/k/k13.mp3"
  },
  {
    "id": "k14",
    "title": "星の言葉",
    "title_en": "Voice of the Stars",
    "description": "星が語る言葉を聴くように、和の音色が宇宙の神秘と繋がっていく。\n日本古来の響きに宇宙的な壮大さが混ざり合い、独特の神秘を醸し出します。\n和風ファンタジー・神秘的な出会い・宇宙と大地を繋ぐシーンに。",
    "description_en": "As if hearing the stars speak, Japanese tones merge with cosmic vastness. Ancient earthly resonance meets the mystery of the universe in transcendent harmony.",
    "feeling": [
      "mysterious",
      "epic"
    ],
    "style": [
      "fantasy",
      "japanese",
      "oriental"
    ],
    "scene": [
      "shrine"
    ],
    "story": [
      "destiny",
      "omen",
      "victory"
    ],
    "duration": "1:36",
    "durationSec": 96,
    "mp3": "/music/k/k14.mp3"
  },
  {
    "id": "k15",
    "title": "ポックルの大地",
    "title_en": "Celtic Highlands",
    "description": "ポックルという名の小さな生き物たちが、ケルトの大地を元気よく駆け回る。\n壮大でありながら愛らしいケルティックサウンドが、冒険心を高々と歌い上げます。\nファンタジー冒険・元気なキャラクターの登場シーン・旅立ちのBGMに。",
    "description_en": "Tiny creatures called Pokkuru scamper joyfully across Celtic highlands. Grand yet adorable Celtic sounds sing of adventure and boundless, spirited energy.",
    "feeling": [
      "epic",
      "happy",
      "cute"
    ],
    "style": [
      "fantasy",
      "celtic"
    ],
    "scene": [
      "field",
      "town",
      "village",
      "forest",
      "travel",
      "morning"
    ],
    "story": [
      "dailylife",
      "dream"
    ],
    "duration": "1:09",
    "durationSec": 69,
    "mp3": "/music/k/k15.mp3"
  },
  {
    "id": "k16",
    "title": "招待",
    "title_en": "Dark Invitation",
    "description": "差し出された招待状の裏側に潜む、禍々しい意図の影が色濃く滲む。\n先に何が待ち受けているのか分からない恐怖が、じりじりと迫ってくる。\nホラー・罠・危険な誘いへと足を踏み入れる直前のシーンに。",
    "description_en": "Behind an outstretched invitation lurks sinister intent, its darkness bleeding through. The creeping terror of not knowing what awaits draws ever closer.",
    "feeling": [
      "dark",
      "suspense",
      "scary"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "night"
    ],
    "story": [
      "conspiracy",
      "despair",
      "defeat",
      "pursuit"
    ],
    "duration": "0:52",
    "durationSec": 52,
    "mp3": "/music/k/k16.mp3"
  },
  {
    "id": "k17",
    "title": "交錯する記憶",
    "title_en": "Crossed Memories",
    "description": "過去と現在の記憶が交差する中で、哀しみが静かにゆらゆらと揺れる。\nシンプルな旋律の中に込められた感情が、深い余韻を残して心に刻まれます。\n回想シーン・過去の傷・哀愁を帯びたキャラクターの心情描写に。",
    "description_en": "Memories of past and present cross paths as sorrow sways in the stillness. A simple melody etches deep emotion into the heart, leaving a melancholic echo.",
    "feeling": [
      "gentle",
      "sad",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "snow"
    ],
    "story": [
      "memory",
      "flashback",
      "dream"
    ],
    "duration": "1:26",
    "durationSec": 86,
    "mp3": "/music/k/k17.mp3"
  },
  {
    "id": "k18",
    "title": "実験体",
    "title_en": "The Specimen",
    "description": "薄暗い実験室の中で、異形の生き物がぎこちなく動き回るような不気味な音楽。\n恐ろしさの中にどこか間抜けな滑稽さが混じる、独特のホラーユーモアがある。\nマッドサイエンティスト・怪しい実験室・コミカルホラーのシーンに。",
    "description_en": "Strange creatures twitch and shuffle through a dim laboratory. Horror meets absurdity in a uniquely quirky soundtrack for the mad scientist's domain.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "mansion",
      "night"
    ],
    "story": [
      "despair",
      "omen",
      "conspiracy",
      "defeat"
    ],
    "duration": "1:04",
    "durationSec": 64,
    "mp3": "/music/k/k18.mp3"
  },
  {
    "id": "k19",
    "title": "喪失",
    "title_en": "Loss",
    "description": "すべてを失った後に残る、言葉にならない空虚な静けさが音になった曲。\n悲しみを超えた先にある虚無感と、それでも穏やかに続く時間の流れ。\n喪失・別れの後・心が空になった瞬間を表現するシーンのBGMに。",
    "description_en": "The hollow quiet after everything is gone — grief transcended into emptiness. Time flows on, gentle and indifferent, through the vast silence of total loss.",
    "feeling": [
      "sad",
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "morning",
      "night",
      "forest",
      "cave",
      "ruins",
      "shrine"
    ],
    "story": [
      "farewell",
      "peaceful",
      "flashback",
      "dream",
      "memory"
    ],
    "duration": "1:52",
    "durationSec": 112,
    "mp3": "/music/k/k19.mp3"
  },
  {
    "id": "k20",
    "title": "暖かな衝撃",
    "title_en": "Warm Farewell",
    "description": "思いがけない懐かしさに胸を衝かれるような、静かで温かい悲しみの音楽。\nシンプルな旋律だからこそ直接心に届く、寂しくも暖かな記憶の余韻。\n回想・懐かしい場面・感情的な転換点のBGMとして効果的です。",
    "description_en": "A sudden wave of nostalgia strikes with quiet force — warm, aching sadness in simple tones. Because the melody is unadorned, it reaches straight into the heart.",
    "feeling": [
      "sad",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "ending"
    ],
    "story": [
      "memory",
      "peaceful",
      "farewell",
      "reunion",
      "hope",
      "dream"
    ],
    "duration": "1:21",
    "durationSec": 81,
    "mp3": "/music/k/k20.mp3"
  },
  {
    "id": "k21",
    "title": "絆",
    "title_en": "Bonds",
    "description": "繋がりが力に変わる瞬間を、力強く暖かい旋律で高らかに奏でた楽曲。\n神秘的な壮大さの中に、仲間への信頼と愛情が確かに息づいています。\n仲間との誓い・絆の再確認・感動的な連帯シーンのBGMに映えます。",
    "description_en": "The moment bonds become strength, rendered in a powerful yet tender anthem. Trust and love for companions breathe within a mystical orchestral embrace.",
    "feeling": [
      "mysterious",
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "ending"
    ],
    "story": [
      "peaceful",
      "bonds",
      "resolve",
      "victory"
    ],
    "duration": "1:26",
    "durationSec": 86,
    "mp3": "/music/k/k21.mp3"
  },
  {
    "id": "z1",
    "title": "イザナウワラベ",
    "title_en": "Spirit Whispers",
    "description": "見えない子供たちが暗闇の隅でこそこそと囁き合う、背筋が凍る音楽。\n霊の世界の無邪気な残酷さを、不気味な音色でじわじわと描き出します。\nホラーゲーム・幽霊屋敷・霊体の登場シーンに不穏な空気を添えます。",
    "description_en": "Invisible children whisper in the darkest corners, sending chills down the spine. The innocent cruelty of the spirit world unfolds in creeping, eerie tones.",
    "feeling": [
      "scary",
      "dark",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [],
    "story": [
      "omen"
    ],
    "duration": "0:34",
    "durationSec": 34,
    "mp3": "/music/z/z1.mp3"
  },
  {
    "id": "z2",
    "title": "違和感",
    "title_en": "Something Is Off",
    "description": "日常の中にふと滑り込む、何かがずれている感覚を鋭利なピアノで描く。\n指摘できないけれど確かに存在する「おかしさ」が、静かに積み重なっていきます。\n異変の始まり・不審なシーン・サスペンスの緊張を高める場面に。",
    "description_en": "A sharp piano captures the sensation of something subtly wrong in everyday life. An unnameable oddity accumulates in silence — the quiet prelude to unease.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [
      "omen"
    ],
    "duration": "1:49",
    "durationSec": 109,
    "mp3": "/music/z/z2.mp3"
  },
  {
    "id": "z3",
    "title": "煉獄の風",
    "title_en": "Hellfire Wind",
    "description": "大地が割れ、地獄の炎が世界中に溢れ出すような濃い暗黒の音楽。\n浄化も救いもなく、ただ業火と混沌だけが満ちていく終末感を表現します。\n終末・地獄の描写・強いな悪の力が解放されるシーンのBGMに。",
    "description_en": "The earth splits open as hellfire floods the world in powerful darkness. No salvation, no purification—only an inferno of chaos consuming all in its path.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [
      "defeat"
    ],
    "duration": "1:18",
    "durationSec": 78,
    "mp3": "/music/z/z3.mp3"
  },
  {
    "id": "z4",
    "title": "白昼夢",
    "title_en": "Waking Nightmare",
    "description": "昼間なのに突然意識が異世界へと引き込まれるような、狂気じみた旅路。\n現実と幻の境界が溶け、自分がどこにいるのか分からなくなる感覚を描きます。\n夢オチ・幻覚シーン・異世界への転移を表現する場面のBGMに。",
    "description_en": "A deranged journey where consciousness is suddenly pulled into another realm in broad daylight. Reality and illusion dissolve, leaving you lost between worlds.",
    "feeling": [
      "scary",
      "dark",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [],
    "story": [
      "dream"
    ],
    "duration": "1:22",
    "durationSec": 82,
    "mp3": "/music/z/z4.mp3"
  },
  {
    "id": "z5",
    "title": "暗黒の始まり",
    "title_en": "Darkness Begins",
    "description": "不吉な予兆が空気に漂い始め、怪異が静かに産声を上げる瞬間の音楽。\n何も起きていないのに恐ろしい、その不穏な「始まり」を精密に描写します。\nホラー作品のオープニング・異変の起点となるシーンに向いています。",
    "description_en": "Ominous omens drift through the air as something sinister quietly stirs to life. A precise portrayal of the unsettling moment before horror begins.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "opening"
    ],
    "story": [
      "conspiracy"
    ],
    "duration": "0:29",
    "durationSec": 29,
    "mp3": "/music/z/z5.mp3"
  },
  {
    "id": "z6",
    "title": "ヘルコーラス",
    "title_en": "Hell Chorus",
    "description": "地の底から湧き上がる無数の声が、徐々に重なり合いながら空間を満たす。\n人間のものともとれない不気味な合唱が、聴く者の理性を少しずつ侵食します。\n儀式・召喚・霊的な何かが呼び覚まされる場面のBGMとして力を発揮します。",
    "description_en": "Countless voices rise from the depths, layering into an inhuman chorus that fills the space. An eerie choir that slowly erodes the listener's grip on sanity.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "0:41",
    "durationSec": 41,
    "mp3": "/music/z/z6.mp3"
  },
  {
    "id": "z7",
    "title": "霊界のサイレン",
    "title_en": "Spirit Siren",
    "description": "霊界から鳴り響く不吉なサイレンが、警告とも嘆きとも聞こえる不穏な音楽。\n耳に刺さるような音の圧力が、逃げ場のない恐怖を絶えず煽り立てます。\n緊急事態・呪いの発動・見えない脅威が迫る場面のBGMに。",
    "description_en": "An ominous siren echoes from the spirit realm—half warning, half lament. Piercing sonic pressure fans the flames of inescapable dread.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:15",
    "durationSec": 75,
    "mp3": "/music/z/z7.mp3"
  },
  {
    "id": "z8",
    "title": "追跡者",
    "title_en": "The Pursuer",
    "description": "遠くから聞こえ始めた足音が、次第に大きくなりながら確実に近づいてくる。\n逃げても逃げても追いつかれる絶望感が、クライマックスで爆発します。\n追いかけっこ・モンスター・脱出シーンの緊張演出にしっかりとした効果。",
    "description_en": "Distant footsteps grow steadily louder, drawing inexorably closer. The despair of being hunted builds relentlessly until it erupts at the climax.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "night"
    ],
    "story": [],
    "duration": "0:38",
    "durationSec": 38,
    "mp3": "/music/z/z8.mp3"
  },
  {
    "id": "z9",
    "title": "暗躍",
    "title_en": "Shadow Creeping",
    "description": "何も変わらない日常の水面下で、見えない何かが静かに蠢き動いている。\n普通の顔をした日常の裏側に潜む陰謀と怪異が、じわりと滲み出してくる。\n隠れた敵・日常に潜む恐怖・陰謀系ホラーのシーンに。",
    "description_en": "Beneath the calm surface of everyday life, something unseen stirs in silence. Conspiracy and the uncanny seep slowly through the cracks of normalcy.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [],
    "story": [
      "conspiracy"
    ],
    "duration": "1:05",
    "durationSec": 65,
    "mp3": "/music/z/z9.mp3"
  },
  {
    "id": "z10",
    "title": "薄れ行く意識",
    "title_en": "Fading Consciousness",
    "description": "意識がゆっくりと遠のいていく中、痛みも恐怖もどこか遠い出来事になる。\n生と死の狭間で感覚が溶けていく様子を、静かな絶望感と共に描きます。\n死のシーン・意識喪失・絶望的な結末を迎えるシーンのBGMに。",
    "description_en": "Consciousness drifts away as pain and fear become distant echoes. A quiet portrait of dissolution at the threshold between life and death.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [],
    "story": [
      "defeat"
    ],
    "duration": "0:42",
    "durationSec": 42,
    "mp3": "/music/z/z10.mp3"
  },
  {
    "id": "z11",
    "title": "いびつな行進",
    "title_en": "Warped March",
    "description": "この世の理から外れた存在たちが、整然とも乱雑ともとれる奇妙な行進をする。\n人の価値観の外側にある異界の秩序が、いびつな音楽として現れています。\n異形の軍勢・呪いの行列・非人間的な存在の描写シーンに。",
    "description_en": "Beings beyond mortal understanding march in a formation both orderly and chaotic. An alien order from beyond human comprehension, rendered in twisted sound.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:34",
    "durationSec": 94,
    "mp3": "/music/z/z11.mp3"
  },
  {
    "id": "z12",
    "title": "酸化",
    "title_en": "Oxidation",
    "description": "生き物が徐々に金属や石へと変質していくような、ぞっとする質感の音楽。\n不可逆な変化と腐食のプロセスが、耳に刺さる音の摩擦で描かれます。\n呪い・石化・侵食される恐怖を表現するホラーシーンに。",
    "description_en": "Living things slowly transform into metal and stone in a chilling soundscape. Irreversible corrosion and decay rendered through abrasive, haunting textures.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [
      "defeat"
    ],
    "duration": "2:38",
    "durationSec": 158,
    "mp3": "/music/z/z12.mp3"
  },
  {
    "id": "z13",
    "title": "見てはいけない",
    "title_en": "Do Not Look",
    "description": "目をつぶっても消えない不安の中で、見てはいけない何かがそっと近づく。\n緊張を一切緩めない静かな恐怖が、ゆっくりと聴く者を包み込みます。\n息を飲む緊張シーン・禁忌・見てはいけないものとの遭遇場面に。",
    "description_en": "In an anxiety that persists even with eyes shut, something forbidden draws silently near. Unrelenting quiet terror that slowly envelops the listener whole.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:15",
    "durationSec": 75,
    "mp3": "/music/z/z13.mp3"
  },
  {
    "id": "z14",
    "title": "生臭い風",
    "title_en": "Bloody Air",
    "description": "死の臭いを乗せた風が肌をなで、その場所に何かがいたことを告げる。\nこの世のものではない気配が残した痕跡が、血と腐敗の空気として漂います。\n惨劇の跡・廃墟・現場の発見シーンに重厚な恐怖感を加えます。",
    "description_en": "A wind carrying the scent of death brushes against the skin, whispering that something was here. Traces of an otherworldly presence linger as blood and decay.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:24",
    "durationSec": 84,
    "mp3": "/music/z/z14.mp3"
  },
  {
    "id": "z15",
    "title": "地獄の門",
    "title_en": "Gate of Hell",
    "description": "閉ざされた門の向こうから、無数の霊たちが押し寄せ侵入を試みている。\n封印が今にも破れそうな緊迫感と共に、地獄の咆哮が響き渡ります。\n霊界の侵攻・封印解除・ダンジョンのボス部屋前のBGMに。",
    "description_en": "Beyond sealed gates, countless spirits press forward, desperate to break through. Hell's roar reverberates as the seal trembles on the verge of shattering.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "dungeon"
    ],
    "story": [
      "defeat"
    ],
    "duration": "1:14",
    "durationSec": 74,
    "mp3": "/music/z/z15.mp3"
  },
  {
    "id": "z16",
    "title": "血のスープ",
    "title_en": "Blood Piano",
    "description": "ピアノの低音域が不協和音を重ね、赤黒い液体がぼこぼこと煮えるような不快感。\n生理的な嫌悪感を音で呼び起こす、ゴシックホラー的な鍵盤の闇。\n悪魔的な調理シーン・禁忌の儀式・グロテスクな表現のBGMに。",
    "description_en": "Dissonant low piano notes churn like dark liquid bubbling to a boil. Gothic horror rendered in keys—visceral unease drawn from the instrument's darkest depths.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "2:38",
    "durationSec": 158,
    "mp3": "/music/z/z16.mp3"
  },
  {
    "id": "z17",
    "title": "悪魔の宴",
    "title_en": "Devil's Banquet",
    "description": "夜の闇の中で悪魔と霊たちが密かに宴を開き、不穏な密談を交わしている。\n不気味な笑い声と囁きが混じり合う、邪悪な饗宴の空気を音楽で再現します。\n悪魔召喚・禁断の夜会・ダークファンタジーの宴のシーンに。",
    "description_en": "Demons and spirits hold a secret banquet in the dead of night, exchanging sinister whispers. An atmosphere of wicked revelry laced with eerie laughter.",
    "feeling": [
      "scary",
      "dark",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:21",
    "durationSec": 81,
    "mp3": "/music/z/z17.mp3"
  },
  {
    "id": "z18",
    "title": "黄泉の案内人",
    "title_en": "Underworld Guide",
    "description": "死者の国へと誘う不気味な案内人が、笑顔ともとれる表情で手招きしている。\n逃げることも拒むこともできない、冥界の礼儀正しい恐怖を描きます。\n死神・冥界・黄泉の国への入り口シーンのBGMとして。",
    "description_en": "A sinister guide to the land of the dead beckons with something resembling a smile. The polite, inescapable terror of the underworld's courteous host.",
    "feeling": [
      "scary",
      "dark",
      "mysterious",
      "suspense"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:04",
    "durationSec": 64,
    "mp3": "/music/z/z18.mp3"
  },
  {
    "id": "z19",
    "title": "黒い影1-奇妙",
    "title_en": "Dark Presence 1",
    "description": "視界の端に何かが横切る気がする、その正体不明の奇妙さが不安を呼ぶ。\n「気のせいかもしれない」という自己説得を崩していく、じわりとした恐怖の序章。\nホラーの序盤・存在を感じ始めるシーン・不審感の演出に。",
    "description_en": "Something flickers at the edge of vision—an unidentifiable strangeness that breeds unease. The quiet prologue of fear that erodes your self-reassurance.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [
      "peaceful"
    ],
    "duration": "1:07",
    "durationSec": 67,
    "mp3": "/music/z/z19.mp3"
  },
  {
    "id": "z20",
    "title": "黒い影2-出現",
    "title_en": "Dark Presence 2",
    "description": "気のせいではなかった──黒い影が確かな輪郭を持って現れる瞬間の戦慄。\n前編の不安が実体を持って具現化する、「存在する」という恐怖の昇格。\nモンスター・霊の登場・恐怖の実体化シーンのBGMに。",
    "description_en": "It wasn't your imagination—a dark shadow takes definite form in a moment of pure dread. Anxiety made manifest, as the presence becomes undeniably real.",
    "feeling": [
      "scary",
      "dark",
      "mysterious",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:29",
    "durationSec": 89,
    "mp3": "/music/z/z20.mp3"
  },
  {
    "id": "z21",
    "title": "黒い影3-接近",
    "title_en": "Dark Presence 3",
    "description": "もはや逃げ場はなく、黒い影が真正面まで迫ってくる息詰まる緊張感。\n三部作のクライマックスとして、遭遇の恐怖が大きな高まりに達します。\nモンスターとの直接対峙・恐怖のクライマックス・逃走失敗シーンに。",
    "description_en": "No escape remains as the dark shadow closes in, face to face. The trilogy's climax where the terror of encounter reaches its devastating peak.",
    "feeling": [
      "scary",
      "dark",
      "mysterious",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "night"
    ],
    "story": [],
    "duration": "1:21",
    "durationSec": 81,
    "mp3": "/music/z/z21.mp3"
  },
  {
    "id": "z22",
    "title": "異質な気配",
    "title_en": "Alien Aura",
    "description": "ピアノが奏でる不規則な音の断片が、「何かがいる」という直感を煽り立てる。\n形をなさない異質な気配が、音楽という形で空間に漂い続けます。\nホラーゲームの探索シーン・不審な場所の雰囲気作りに。",
    "description_en": "Irregular piano fragments stoke the primal instinct that something is here. A formless, alien presence that drifts through the space as sound itself.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "0:44",
    "durationSec": 44,
    "mp3": "/music/z/z22.mp3"
  },
  {
    "id": "z23",
    "title": "朽ちた廃屋",
    "title_en": "Rotting Ruins",
    "description": "腐った床板と埃の匂いが漂う廃屋の空気感を、そのまま音楽にしたような一曲。\n時間が止まったまま朽ちていく場所の、重く淀んだ恐怖を体感できます。\n廃墟探索・放棄された場所・忘れられた過去を描くシーンに。",
    "description_en": "The stale air of rotting floorboards and dust, translated directly into music. The heavy, stagnant dread of a place frozen in time and left to decay.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "ruins",
      "dungeon"
    ],
    "story": [],
    "duration": "1:35",
    "durationSec": 95,
    "mp3": "/music/z/z23.mp3"
  },
  {
    "id": "z24",
    "title": "サマヨイサマヨウ",
    "title_en": "The Wandering",
    "description": "成仏できずに彷徨い続ける霊が、低く唸り声を上げながら迷い歩く。\n何を求めているのか、どこへ向かうのか、答えのない彷徨いの哀れと恐怖。\n幽霊・迷える霊・ゾンビ系キャラクターの登場シーンに。",
    "description_en": "A restless spirit wanders endlessly, moaning low as it drifts without purpose. The pitiable horror of an aimless soul with no answers and no destination.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:40",
    "durationSec": 100,
    "mp3": "/music/z/z24.mp3"
  },
  {
    "id": "z25",
    "title": "壊れた標",
    "title_en": "Broken Signpost",
    "description": "かつては道を示していた標識が、静かに少しずつ崩れていくような音楽。\n淡々とした崩壊のプロセスが、どこか冷静で、それがかえって恐ろしい。\n崩壊・狂気の進行・精神が壊れていくシーンのBGMに。",
    "description_en": "A signpost that once showed the way crumbles silently, piece by piece. The calm, methodical process of collapse—all the more terrifying for its composure.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [],
    "story": [
      "defeat"
    ],
    "duration": "1:12",
    "durationSec": 72,
    "mp3": "/music/z/z25.mp3"
  },
  {
    "id": "z26",
    "title": "餌食",
    "title_en": "The Prey",
    "description": "逃げ場を失った獲物が完全に追い詰められ、最後に何かが起きる直前のBGM。\n緊張が大きな高まりまで高まり場面が転換する、映画的なホラー演出を持つ曲。\n逃走失敗・捕獲・恐怖のクライマックスと場面転換に。",
    "description_en": "Cornered prey with nowhere to run, in the breathless instant before something strikes. Cinematic horror tension at its peak, primed for a devastating turn.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [
      "defeat"
    ],
    "duration": "0:16",
    "durationSec": 16,
    "mp3": "/music/z/z26.mp3"
  },
  {
    "id": "z27",
    "title": "闇に潜む気配1",
    "title_en": "Lurking in Darkness 1",
    "description": "完全な暗闇の中で、何かが確かに息をしている──その最初の気配を描く。\nシリーズ第一段として、恐怖の入口に立つ緊張感を静かに提示します。\nホラー探索の序盤・暗闇シーンの不安演出に。",
    "description_en": "In total darkness, something is unmistakably breathing—the first hint of its presence. A quiet overture of tension at the threshold of fear.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "0:56",
    "durationSec": 56,
    "mp3": "/music/z/z27.mp3"
  },
  {
    "id": "z28",
    "title": "闇に潜む気配2",
    "title_en": "Lurking in Darkness 2",
    "description": "最初はぼんやりしていた気配が、徐々に輪郭を帯びて存在感を増してくる。\n無視できない何かの接近を、繊細な音の変化で段階的に描きます。\n恐怖の中盤・気配が強まる場面の演出に。",
    "description_en": "What began as a vague sense sharpens gradually, gaining undeniable presence. The delicate approach of something that can no longer be ignored.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:36",
    "durationSec": 96,
    "mp3": "/music/z/z28.mp3"
  },
  {
    "id": "z29",
    "title": "闇に潜む気配3",
    "title_en": "Lurking in Darkness 3",
    "description": "静寂と突発的な音の揺れが交差し、どこにいるのかわからない恐怖を醸す。\n「次の瞬間何が起きるか」という予測不能の緊張感が持続します。\nホラーの中盤緊張シーン・サスペンスの積み重ねに。",
    "description_en": "Silence and sudden sonic tremors alternate, creating the terror of not knowing where it is. Unpredictable tension that keeps the listener perpetually on edge.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:49",
    "durationSec": 109,
    "mp3": "/music/z/z29.mp3"
  },
  {
    "id": "z30",
    "title": "闇に潜む気配4",
    "title_en": "Lurking in Darkness 4",
    "description": "逃げたいのに足が動かない、夢の中の恐怖のような不安が膨らみ続ける。\n音の密度が少しずつ増し、精神的なプレッシャーが着実に積み上がります。\n恐怖の加速シーン・心理的追い詰めの演出に。",
    "description_en": "Feet refuse to move though the mind screams to flee—nightmare paralysis made real. Sonic density builds steadily, mounting relentless psychological pressure.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:04",
    "durationSec": 64,
    "mp3": "/music/z/z30.mp3"
  },
  {
    "id": "z31",
    "title": "闇に潜む気配5",
    "title_en": "Lurking in Darkness 5",
    "description": "暗闇の気配が単なる音から、濃い色彩を持つ恐怖のイメージへと変貌する。\n五感を刺激する音楽的表現が、より具体的な恐怖のビジョンを喚起します。\nビジュアルホラー・映像的な恐怖演出の中盤シーンに。",
    "description_en": "The presence in darkness evolves from sound into vivid visions of fear. Music that stimulates the senses into conjuring ever more tangible terror.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:06",
    "durationSec": 66,
    "mp3": "/music/z/z31.mp3"
  },
  {
    "id": "z32",
    "title": "闇に潜む気配6",
    "title_en": "Lurking in Darkness 6",
    "description": "もはや疑いの余地なく、闇の中に何かが確実に潜んでいると確信する。\n恐怖の現実性が音楽によって証明される、シリーズの転換点。\n恐怖の確定シーン・逃げ場がなくなる前の心理描写に。",
    "description_en": "Beyond all doubt now—something is hiding in the dark, and you know it with certainty. The turning point where fear becomes undeniable reality.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "0:58",
    "durationSec": 58,
    "mp3": "/music/z/z32.mp3"
  },
  {
    "id": "z33",
    "title": "闇に潜む気配7",
    "title_en": "Lurking in Darkness 7",
    "description": "これ以上は耐えられないというギリギリの緊張感が、音楽全体を支配する。\n何かが起きる直前の静寂にも似た緊張が、聴く者を限界まで追い詰めます。\nクライマックス直前・最後の我慢のシーン・爆発的展開の前置きに。",
    "description_en": "Unbearable tension dominates every note, pushing the listener to the breaking point. A silence-like stillness before eruption, stretched to the absolute limit.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:36",
    "durationSec": 96,
    "mp3": "/music/z/z33.mp3"
  },
  {
    "id": "z34",
    "title": "闇に潜む気配8",
    "title_en": "Lurking in Darkness 8",
    "description": "シリーズを通じて積み上げた恐怖が、この8曲目で完全な形として結実する。\n長い暗闇の旅の果てに待ち受けるものが、音楽として顕現します。\nシリーズのクライマックス・大きな恐怖の発露シーンに使用して。",
    "description_en": "Eight movements of accumulated dread crystallize into their final form. What awaits at the end of the long journey through darkness is revealed at last.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "2:34",
    "durationSec": 154,
    "mp3": "/music/z/z34.mp3"
  },
  {
    "id": "z35",
    "title": "接近1",
    "title_en": "Approach 1",
    "description": "まだずっと遠くにいるはずなのに、確かにこちらへ向かってくる気配がある。\n静かな序奏として、何かが近づいていることの最初の予感を描きます。\nモンスター・追跡者が遠距離から迫るシーンの序盤演出に。",
    "description_en": "Still far away, yet unmistakably heading this way—the first premonition of approach. A quiet prelude to something drawing nearer from a great distance.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "night"
    ],
    "story": [],
    "duration": "1:18",
    "durationSec": 78,
    "mp3": "/music/z/z35.mp3"
  },
  {
    "id": "z36",
    "title": "接近2",
    "title_en": "Approach 2",
    "description": "最初は遠かった気配が、明らかに近づきながら威圧感を増してきた。\n「もう逃げ切れないかもしれない」という諦めが交じり始める恐怖の中盤。\n追跡シーンの中盤・逃走成否が見え始める緊張感の演出に。",
    "description_en": "What was once distant now clearly advances, its menace growing with every step. The midpoint where escape begins to feel like a fading possibility.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "night"
    ],
    "story": [],
    "duration": "0:52",
    "durationSec": 52,
    "mp3": "/music/z/z36.mp3"
  },
  {
    "id": "z37",
    "title": "接近3",
    "title_en": "Approach 3",
    "description": "もはや手が届く距離、接近シリーズのすべての緊張がここで爆発する。\n逃げる余地のない至近距離の恐怖が、クライマックスとして音楽に結晶します。\n追いつかれる瞬間・逃走の終焉・恐怖の到達シーンに。",
    "description_en": "Close enough to touch—all the tension of the approach series detonates here. Point-blank terror crystallized into a devastating climax with nowhere left to run.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "night"
    ],
    "story": [],
    "duration": "1:08",
    "durationSec": 68,
    "mp3": "/music/z/z37.mp3"
  },
  {
    "id": "z38",
    "title": "不穏なピアノ1",
    "title_en": "Uneasy Piano 1",
    "description": "何事もなかったかのようなピアノの音の中に、最初のひとつの不穏な種が潜む。\n穏やかさの中の違和感が、聴く者の無意識に静かに問いかけます。\nホラー序盤・日常に潜む異変の最初のサインとして。",
    "description_en": "Within seemingly innocent piano notes, the first seed of unease lies hidden. A subtle wrongness in the calm that quietly speaks to your subconscious.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:20",
    "durationSec": 80,
    "mp3": "/music/z/z38.mp3"
  },
  {
    "id": "z39",
    "title": "不穏なピアノ2",
    "title_en": "Uneasy Piano 2",
    "description": "ピアノの不協和音が少しずつ顔を出し、安心できない空間を作り始める。\n音楽の中に潜む不安定さが、次第に無視できないものになってきます。\n恐怖の発展シーン・不審さが強まる演出のBGMに。",
    "description_en": "Dissonance gradually emerges in the piano, building a space where comfort cannot survive. The instability woven into the music grows impossible to ignore.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "0:42",
    "durationSec": 42,
    "mp3": "/music/z/z39.mp3"
  },
  {
    "id": "z40",
    "title": "不穏なピアノ3",
    "title_en": "Uneasy Piano 3",
    "description": "これまで保たれていたピアノの均衡が、音を重ねるにつれて崩れていく。\n秩序の喪失と混乱の始まりを、鍵盤の変容で表現した一曲です。\n崩壊の始まり・安全地帯が消えるシーンのBGMとして。",
    "description_en": "The balance the piano once maintained begins to fracture with each passing note. The onset of collapse and chaos, expressed through the transformation of keys.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:30",
    "durationSec": 90,
    "mp3": "/music/z/z40.mp3"
  },
  {
    "id": "z41",
    "title": "不穏なピアノ4",
    "title_en": "Uneasy Piano 4",
    "description": "不穏さがより深みに入り込み、ピアノの音自体が恐怖を帯びてくる。\n楽器そのものが呪われたかのような変質が、不安を更なる段階に引き上げます。\nホラー中盤・恐怖の深まり・じわじわ系のシーンに効果的。",
    "description_en": "Unease burrows deeper as the piano's very tone becomes saturated with dread. The instrument itself seems cursed, elevating anxiety to a new threshold.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:32",
    "durationSec": 92,
    "mp3": "/music/z/z41.mp3"
  },
  {
    "id": "z42",
    "title": "不穏なピアノ5",
    "title_en": "Uneasy Piano 5",
    "description": "ピアノと暗闇が完全に溶け合い、音が光ではなく闇そのものを描き始める。\n楽器の音色が恐怖の色になる、シリーズ中で最も深い闇の音楽。\nクライマックス前の最深部・呪われた場所の表現に。",
    "description_en": "Piano and darkness merge—the notes no longer describe light but embody shadow itself. The deepest darkness in the series, where sound becomes the void.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "0:46",
    "durationSec": 46,
    "mp3": "/music/z/z42.mp3"
  },
  {
    "id": "z43",
    "title": "不穏なピアノ6",
    "title_en": "Uneasy Piano 6",
    "description": "6曲を通じて積み重ねられた不穏さが、ここで一つの完成形へと到達する。\n最後まで誠実に恐怖を奏でたピアノが、ついにその本性を明かします。\nシリーズのクライマックス・ホラー演出の決定的な場面に。",
    "description_en": "Six movements of accumulated unease reach their major form. The piano that faithfully played fear through every piece finally reveals its true nature.",
    "feeling": [
      "scary",
      "dark",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "0:20",
    "durationSec": 20,
    "mp3": "/music/z/z43.mp3"
  },
  {
    "id": "z44",
    "title": "奇妙な儀式",
    "title_en": "Strange Ritual",
    "description": "どこかの部族が行う奇妙な儀式の音楽が、ユーモアと不気味さで滑稽に踊る。\n真剣なのか冗談なのかわからない民族的な音が、独特の妖しい空気を作ります。\nコミカルホラー・怪しい儀式・民俗的な呪術シーンのBGMに。",
    "description_en": "A strange tribal ritual dances between humor and the uncanny in equal measure. Earnest yet absurd ethnic sounds create a uniquely bewitching atmosphere.",
    "feeling": [
      "scary",
      "dark",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "oriental",
      "japanese_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:36",
    "durationSec": 96,
    "mp3": "/music/z/z44.mp3"
  },
  {
    "id": "z45",
    "title": "白昼の幻1",
    "title_en": "Daylight Phantom 1",
    "description": "昼の光の中で突然始まる幻覚の序章、最初はまだかすかに現実が見えている。\n普通の日常風景に不思議な揺らぎが入り込む、白昼夢の入口を描きます。\n幻覚シーン・異変の始まり・明るい場所での怪異の序盤に。",
    "description_en": "A daytime hallucination begins—reality still faintly visible through first ripples of distortion. The threshold of a waking dream where normalcy starts to blur.",
    "feeling": [
      "scary",
      "dark",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "0:59",
    "durationSec": 59,
    "mp3": "/music/z/z45.mp3"
  },
  {
    "id": "z46",
    "title": "白昼の幻2",
    "title_en": "Daylight Phantom 2",
    "description": "現実と幻覚の境界線が曖昧になり、どちらが本物かわからなくなってくる。\n白昼の光の中で、恐怖が徐々に確かな存在感を持ち始めます。\n幻覚シーンの中盤・現実認識が揺らぐ心理的場面の演出に。",
    "description_en": "The line between real and unreal blurs until neither can be distinguished. Fear takes on substance and weight in the full light of day.",
    "feeling": [
      "scary",
      "dark",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:13",
    "durationSec": 73,
    "mp3": "/music/z/z46.mp3"
  },
  {
    "id": "z47",
    "title": "白昼の幻3",
    "title_en": "Daylight Phantom 3",
    "description": "もはや現実は跡形もなく、白昼の光の中で幻覚がすべてを支配している。\n三部作の結末として、昼の明るさが最も残酷な恐怖の舞台となります。\n幻覚シリーズのクライマックス・精神崩壊・現実喪失のシーンに。",
    "description_en": "Reality has vanished—hallucination reigns under the bright midday sun. Daylight becomes the cruelest stage for horror in the trilogy's devastating finale.",
    "feeling": [
      "scary",
      "dark",
      "mysterious",
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:04",
    "durationSec": 64,
    "mp3": "/music/z/z47.mp3"
  },
  {
    "id": "z48",
    "title": "雲界との境目",
    "title_en": "The Veil Between Worlds",
    "description": "雲の向こう側にある別の世界との境界が、じわじわとほどけていく不安感。\n禁忌の扉が静かに開かれる瞬間の、厳粛で恐ろしい静寂を描きます。\n異界への入口・次元の裂け目・封印解除のシーンのBGMに。",
    "description_en": "The boundary with a world beyond the clouds slowly, silently unravels. The solemn, dreadful hush of a forbidden door quietly swinging open.",
    "feeling": [
      "scary",
      "dark",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "1:32",
    "durationSec": 92,
    "mp3": "/music/z/z48.mp3"
  },
  {
    "id": "z49",
    "title": "邪心",
    "title_en": "Malice",
    "description": "悪意が初めて意識を持ち、世界の片隅で静かに力を蓄え始める瞬間。\n禍々しい意志の誕生を、控えめながら確実な恐怖として描いた曲です。\n悪の誕生・呪いの覚醒・ダークヒーローの闇が芽生えるシーンに。",
    "description_en": "Malice gains consciousness for the first time, quietly gathering strength in a forgotten corner. The birth of dark will, understated yet certain in its dread.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "japanese_horror"
    ],
    "scene": [],
    "story": [
      "defeat"
    ],
    "duration": "1:09",
    "durationSec": 69,
    "mp3": "/music/z/z49.mp3"
  },
  {
    "id": "z50",
    "title": "不気味な部屋",
    "title_en": "The Haunted Room",
    "description": "閉め切られた部屋の空気がよどみ、見えない何かが壁際に潜んでいる。\n窓も出口も封じられた密室の中の、逃げられない恐怖を音楽で描きます。\n密室・閉じ込められるシーン・呪われた空間の描写に向いています。",
    "description_en": "Stale air fills a sealed room where something unseen lurks along the walls. The inescapable terror of a locked chamber with no windows and no way out.",
    "feeling": [
      "scary",
      "dark"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "dungeon"
    ],
    "story": [
      "defeat"
    ],
    "duration": "1:32",
    "durationSec": 92,
    "mp3": "/music/z/z50.mp3"
  },
  {
    "id": "v1",
    "title": "VEIL オープニング",
    "title_en": "VEIL Opening",
    "description": "すべての音が引き潮のように退いた静寂の中で、物語の幕が静かに開く。\n見えないヴェールの向こう側に何があるのかを、沈黙と余白で示す楽曲。\n物語のオープニング・静かな幕開け・神秘的な前奏として。",
    "description_en": "All sound recedes like an ebbing tide as the story's curtain rises in silence. What lies beyond the invisible veil is conveyed through stillness alone.",
    "feeling": [
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening"
    ],
    "story": [
      "peaceful"
    ],
    "duration": "0:33",
    "durationSec": 33,
    "mp3": "/music/v/v1.mp3"
  },
  {
    "id": "v2",
    "title": "人形遊び",
    "title_en": "Puppet Play",
    "description": "人形たちが自分で動き出し、ピエロの仮面をつけた子供が笑い始める。\n無邪気な遊びのはずが、気づくと現実から離れた異世界に迷い込んでいる。\n不思議な世界・人形ホラー・可愛さと怪しさが交差するシーンに。",
    "description_en": "Puppets begin to move on their own as a masked child starts to laugh. What seemed like innocent play leads imperceptibly into a strange otherworld.",
    "feeling": [
      "happy",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [],
    "duration": "1:21",
    "durationSec": 81,
    "mp3": "/music/v/v2.mp3"
  },
  {
    "id": "v3",
    "title": "呪われた子",
    "title_en": "Cursed Child",
    "description": "生まれながらに呪いを背負った子供が、暗闇の中で静かに目を開ける。\n純粋さと禍々しさが同居する、悲しくも恐ろしい宿命を描いた一曲。\nダーク系の子供キャラクター・呪いの描写・ホラー序盤のシーンに。",
    "description_en": "A child born under a curse quietly opens its eyes in the darkness. Innocence and malevolence coexist in a single soul, tragic and terrifying in equal measure.",
    "feeling": [
      "dark",
      "scary"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [],
    "duration": "0:57",
    "durationSec": 57,
    "mp3": "/music/v/v3.mp3"
  },
  {
    "id": "v4",
    "title": "感謝祭",
    "title_en": "Harvest Festival",
    "description": "年に一度の感謝祭に集まった子供たちが、声高らかに笑い踊り歌う。\n祭りの熱気と喜びが溢れる、純粋に楽しい祝祭の音楽です。\n祭り・行事・賑やかな集まりのシーンや日常の幸福な場面に。",
    "description_en": "Children gather for the annual harvest festival, laughing and dancing with boundless joy. Pure, festive warmth overflowing with gratitude and celebration.",
    "feeling": [
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "festival"
    ],
    "story": [],
    "duration": "0:59",
    "durationSec": 59,
    "mp3": "/music/v/v4.mp3"
  },
  {
    "id": "v5",
    "title": "街へ行こう",
    "title_en": "Off to Town",
    "description": "中世の石畳の街へ、手をつないでわくわくしながら出かける楽しい道のり。\n少し不思議な街の空気と高揚感が、足取り軽やかなメロディーで流れます。\n街への出発・日常のお出かけ・ファンタジーの町並みシーンに。",
    "description_en": "Hand in hand, setting off excitedly toward a medieval cobblestone town. A lighthearted melody carries the wonder and anticipation of a whimsical journey ahead.",
    "feeling": [
      "mysterious"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "town",
      "travel"
    ],
    "story": [],
    "duration": "0:55",
    "durationSec": 55,
    "mp3": "/music/v/v5.mp3"
  },
  {
    "id": "v6",
    "title": "黒雲序曲",
    "title_en": "Dark Cloud Overture",
    "description": "空を覆う黒雲のように、単調なリズムの中に恐怖がじわじわと広がる序曲。\n派手ではないが確実に迫ってくる暗い予感が、音楽全体に漂います。\n嵐の前・ホラーの序幕・じわじわ系の不安演出のBGMに。",
    "description_en": "Like dark clouds blanketing the sky, dread spreads through a monotone rhythm. A quiet but certain sense of approaching darkness pervades every measure.",
    "feeling": [
      "suspense",
      "scary"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [],
    "duration": "1:00",
    "durationSec": 60,
    "mp3": "/music/v/v6.mp3"
  },
  {
    "id": "v7",
    "title": "エントロピー増大開始",
    "title_en": "Entropy Rising",
    "description": "宇宙の法則に従い、秩序がゆっくりと崩壊し始める悲劇の開幕を告げる。\nSF的な冷静さと、不可避の悲劇への哀愁が奇妙に調和した一曲です。\nSF・未来の崩壊・取り返しのつかない何かが始まるシーンに。",
    "description_en": "Obeying the laws of the universe, order begins its slow, inevitable collapse. An eerily calm fusion of scientific detachment and the sorrow of coming tragedy.",
    "feeling": [
      "sad"
    ],
    "style": [
      "fantasy",
      "futuristic"
    ],
    "scene": [
      "opening"
    ],
    "story": [
      "conspiracy"
    ],
    "duration": "2:51",
    "durationSec": 171,
    "mp3": "/music/v/v7.mp3"
  },
  {
    "id": "v8",
    "title": "遠くへ",
    "title_en": "Into the Distance",
    "description": "振り返らず、ただ遠くへと歩み続ける旅立ちの覚悟を歌い上げる壮大な曲。\n恐れよりも前進の意志が勝り、勇気が翼となって羽ばたく瞬間の音楽。\n旅立ち・別れ・勇敢な決断のシーンや冒険のBGMとして。",
    "description_en": "Never looking back, pressing onward into the unknown with unwavering resolve. Courage outweighs fear as determination takes flight on sweeping, majestic wings.",
    "feeling": [
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "travel"
    ],
    "story": [
      "victory"
    ],
    "duration": "1:43",
    "durationSec": 103,
    "mp3": "/music/v/v8.mp3"
  },
  {
    "id": "v9",
    "title": "孤独を映す鏡",
    "title_en": "Mirror of Solitude",
    "description": "疲れ果てた体と心が鏡の前に立ち、自分自身と向き合う苦しい時間。\n孤独と葛藤が溶け合った、正直で痛切な感情の音楽です。\n内省・葛藤・孤独なキャラクターの心情を描くシーンのBGMに。",
    "description_en": "An exhausted body and soul stand before a mirror, confronting what stares back. Loneliness and inner conflict dissolve into honest, achingly raw emotion.",
    "feeling": [
      "sad"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [],
    "duration": "1:40",
    "durationSec": 100,
    "mp3": "/music/v/v9.mp3"
  },
  {
    "id": "v10",
    "title": "夢の吹く草原",
    "title_en": "Dreaming Fields",
    "description": "誰もいない草原に静かな風が吹き、夢のような穏やかな時間が流れる。\n音が少ないほど豊かになる静けさの中に、澄んだ想いが漂います。\n瞑想・静かな余韻・感動後の静寂シーンのBGMとして。",
    "description_en": "A gentle wind sweeps across an empty meadow as dreamlike tranquility unfolds. In the spacious silence, a clear and quiet feeling drifts like light on a breeze.",
    "feeling": [
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "field"
    ],
    "story": [
      "dream"
    ],
    "duration": "2:20",
    "durationSec": 140,
    "mp3": "/music/v/v10.mp3"
  },
  {
    "id": "r1",
    "title": "死刑行列",
    "title_en": "Final March",
    "description": "静かに列を成して歩む人々の影が、人生の終わりへと優しく向かっていく。\n裁かれる者への残酷さよりも、どこか穏やかな慈悲の空気が漂う曲です。\n死・悲劇的な行列・静謐な感情シーンの演出に深みを添えます。",
    "description_en": "A procession of shadows walks gently toward life's end as daylight fades. More merciful than cruel, an air of quiet compassion surrounds the solemn march.",
    "feeling": [
      "gentle",
      "sad"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night",
      "snow",
      "ending"
    ],
    "story": [
      "flashback",
      "memory"
    ],
    "duration": "3:54",
    "durationSec": 234,
    "mp3": "/music/r/r1.mp3"
  },
  {
    "id": "r2",
    "title": "果物屋",
    "title_en": "The Fruit Stand",
    "description": "誰も来ない果物屋の前で、店主がひとり不思議な夢を見ているような音楽。\n日常の孤独と、そこに潜む見えない謎が奇妙に混ざり合った一曲。\nミステリアスな日常・孤独なキャラクター・不思議な世界観の演出に。",
    "description_en": "A fruit stand owner sits alone before an empty shop, lost in a peculiar daydream. Everyday solitude and hidden mystery blend into something quietly strange.",
    "feeling": [
      "mysterious",
      "cute",
      "scary"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "mansion",
      "night"
    ],
    "story": [
      "conspiracy"
    ],
    "duration": "2:28",
    "durationSec": 148,
    "mp3": "/music/r/r2.mp3"
  },
  {
    "id": "r3",
    "title": "移動式井戸",
    "title_en": "Endless Maze",
    "description": "どこへ行っても同じ場所に戻ってしまう、謎めいた迷路の中を彷徨い続ける。\n出口のない循環の不安を、移動式の井戸という奇妙な比喩で描いた楽曲。\nループ・迷宮・呪縛されたシーン・ミステリーの謎シーンに。",
    "description_en": "Every path leads back to the same place in a labyrinth with no exit. The anxiety of an endless loop, wandering through corridors that refuse to end.",
    "feeling": [
      "suspense"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night"
    ],
    "story": [
      "omen"
    ],
    "duration": "3:50",
    "durationSec": 230,
    "mp3": "/music/r/r3.mp3"
  },
  {
    "id": "r4",
    "title": "ロンドンの死",
    "title_en": "London Elegy",
    "description": "霧深いロンドンの路地に、死の影がひっそりと寄り添って歩いている。\n古い都市の孤独と、見えない危機への不安が音楽に滲み出します。\n都市型ミステリー・孤独な探偵・不安なシーンの雰囲気作りに。",
    "description_en": "Death's shadow walks silently beside you through London's fog-laden alleyways. The loneliness of an ancient city and an invisible threat bleed into every note.",
    "feeling": [
      "scary",
      "cute"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "mansion",
      "night"
    ],
    "story": [
      "farewell"
    ],
    "duration": "2:06",
    "durationSec": 126,
    "mp3": "/music/r/r4.mp3"
  },
  {
    "id": "r5",
    "title": "村を出る日",
    "title_en": "Leaving the Village",
    "description": "幼い頃から知っている村の景色に別れを告げ、未知の世界へと踏み出す日。\n怖くてもひるまない勇気と、試練への挑戦を壮大な音楽で描きます。\n旅立ち・冒険の始まり・村を出るキャラクターの決意シーンに。",
    "description_en": "Bidding farewell to the village you've known since childhood, stepping into the unknown. Grand music for the courage to face trials and the resolve to press on.",
    "feeling": [
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "village"
    ],
    "story": [
      "resolve"
    ],
    "duration": "1:29",
    "durationSec": 89,
    "mp3": "/music/r/r5.mp3"
  },
  {
    "id": "r6",
    "title": "アカデミー生活",
    "title_en": "Academy Days",
    "description": "アカデミーに集まった個性豊かな子供たちが、好奇心いっぱいに走り回る。\n学ぶことの喜びと生命力が溢れる、活気ある日常を描いた楽しい曲。\n学校・訓練所・子供キャラクターの日常と成長シーンに。",
    "description_en": "Colorful young students dash through academy halls, brimming with curiosity and life. The joy of learning and the energy of youth in a vibrant, spirited piece.",
    "feeling": [
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "field"
    ],
    "story": [
      "dailylife"
    ],
    "duration": "2:36",
    "durationSec": 156,
    "mp3": "/music/r/r6.mp3"
  },
  {
    "id": "r7",
    "title": "ワッペン屋",
    "title_en": "The Patch Shop",
    "description": "怪しい店の奥でワッペンを縫い続ける者の、異常な5拍子の狂気。\n不規則に感じる拍子が生み出す独特の不安定さが、常識を外れた恐怖を演出します。\n変わり者のキャラクター・コミカルホラー・不思議な店のシーンに。",
    "description_en": "In the back of a peculiar shop, someone endlessly stitches patches in a mad 5/4 time. The irregular rhythm breeds an instinctive unease that defies all logic.",
    "feeling": [
      "dark",
      "scary"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "night"
    ],
    "story": [
      "destiny",
      "omen"
    ],
    "duration": "3:24",
    "durationSec": 204,
    "mp3": "/music/r/r7.mp3"
  },
  {
    "id": "r8",
    "title": "青春が奪われる",
    "title_en": "Lost Youth",
    "description": "本来輝くはずだった青春が、理不尽な何かによって奪われていく哀しい音楽。\nピアノが時折激しく叫ぶことで、静かな悲劇の中の怒りを表現します。\n青春の喪失・不条理・理不尽な境遇を描くシーンのBGMに。",
    "description_en": "A youth that should have shone brightly, stolen away by something cruelly unjust. The piano cries out in bursts of anger amid an otherwise quiet tragedy.",
    "feeling": [
      "mysterious"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "mansion"
    ],
    "story": [
      "omen",
      "despair"
    ],
    "duration": "2:44",
    "durationSec": 164,
    "mp3": "/music/r/r8.mp3"
  },
  {
    "id": "r9",
    "title": "死刑実習",
    "title_en": "The Execution",
    "description": "実習と称した死刑の場で、猟奇的な激しさが容赦なく炸裂する。\n正気と狂気の境界が消えた場所で鳴り響く、残酷で凄烈な音楽です。\nグロテスクな場面・ホラーのクライマックス・狂気の描写に使用して。",
    "description_en": "Savage intensity erupts without mercy in a scene where sanity and madness become indistinguishable. Ferocious, unrelenting music from a place beyond reason.",
    "feeling": [
      "scary",
      "suspense"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night",
      "mansion"
    ],
    "story": [
      "farewell",
      "defeat",
      "despair"
    ],
    "duration": "2:47",
    "durationSec": 167,
    "mp3": "/music/r/r9.mp3"
  },
  {
    "id": "r11",
    "title": "花屋の娘の夢",
    "title_en": "The Florist's Dream",
    "description": "中世の花屋の娘が見る儚い夢、懐かしい街角に咲いた花が散るように消えていく。\n少女の純粋な夢と現実の落差が、切なく美しい旋律に込められています。\n少女キャラクター・悲しい夢のシーン・ファンタジーの哀愁場面に。",
    "description_en": "A florist's daughter dreams a fleeting dream—flowers bloom on familiar streets, then scatter. Tender sorrow and fragile beauty woven into a bittersweet melody.",
    "feeling": [
      "sad",
      "gentle",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "town"
    ],
    "story": [
      "dream"
    ],
    "duration": "2:56",
    "durationSec": 176,
    "mp3": "/music/r/r11.mp3"
  },
  {
    "id": "r12",
    "title": "死刑行列(シンプルver)",
    "title_en": "Final March (Simple)",
    "description": "r1「死刑行列」のシンプルバージョン。装飾を削ぎ落とした純粋な悲しみ。\n余計な音を省くことで、生と死の本質だけがより鮮明に浮かび上がります。\nr1よりも穏やかな場面・静かな葬送・心の中の哀悼シーンに。",
    "description_en": "A simplified arrangement of Final March, stripped to its purest essence of grief. Fewer notes reveal the stark truth of life and death with crystalline clarity.",
    "feeling": [
      "gentle",
      "sad"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "ending",
      "snow",
      "night"
    ],
    "story": [
      "farewell",
      "flashback",
      "memory"
    ],
    "duration": "5:50",
    "durationSec": 350,
    "mp3": "/music/r/r12.mp3"
  },
  {
    "id": "o1",
    "title": "導きの糸",
    "title_en": "Guiding Thread",
    "description": "大切な友人の門出を祝うために生まれた、温かく祝福に満ちた穏やかな一曲。\n喜びと少しの感傷が混じり合い、幸福な未来へと続く糸を音楽で紡ぎます。\n結婚式・祝福のシーン・大切な人の旅立ちを祝う場面のBGMに。",
    "description_en": "A warm, blessing-filled piece born to celebrate a dear friend's new beginning. Joy tinged with gentle sentiment, spinning a thread of music toward the future.",
    "feeling": [
      "gentle",
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "ending",
      "opening",
      "morning"
    ],
    "story": [
      "victory",
      "peaceful",
      "memory",
      "reunion"
    ],
    "duration": "2:04",
    "durationSec": 124,
    "mp3": "/music/o/o1.mp3"
  },
  {
    "id": "o2",
    "title": "かぜのこえ",
    "title_en": "Voice of the Wind",
    "description": "風が声を持つとしたら、きっとこんな純粋でシンプルな旋律を歌うだろう。\n飾りのない素直さが心の奥に直接届く、澄み切った一曲です。\n自然シーン・心の浄化・純粋な感情を表現する場面に静かに寄り添います。",
    "description_en": "If the wind could sing, it would surely carry a melody this pure and unadorned. A crystalline piece that reaches straight to the heart with honest simplicity.",
    "composer_note": "僕の中で一番古い思い出の曲です。舞台用に初めて作った曲で、DJ用パフォーマンス機材 SP-808 と、CASIO の安いシンセで制作しました。",
    "composer_note_en": "One of my oldest and most personal pieces. It was the first track I wrote for the stage, made with an SP-808 performance sampler and an inexpensive CASIO synth.",
    "feeling": [
      "gentle",
      "cute"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "village",
      "opening",
      "travel"
    ],
    "story": [
      "farewell",
      "memory",
      "hope"
    ],
    "duration": "4:46",
    "durationSec": 286,
    "mp3": "/music/o/o2.mp3"
  },
  {
    "id": "o3",
    "title": "廻りだす歯車",
    "title_en": "Turning Gears",
    "description": "一度動き出したら止められない運命の歯車が、静かに回り始める瞬間の曲。\n悲劇の始まりを予感させる重みが、鉄の歯車のように冷たく精密に刻まれます。\n悲劇の序章・運命論的なシーン・取り返しのつかない選択の直前に。",
    "description_en": "The gears of fate begin their quiet, unstoppable turning. The weight of approaching tragedy is etched with the cold precision of iron machinery.",
    "feeling": [
      "sad",
      "suspense",
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening"
    ],
    "story": [
      "destiny",
      "omen",
      "resolve"
    ],
    "duration": "1:34",
    "durationSec": 94,
    "mp3": "/music/o/o3.mp3"
  },
  {
    "id": "o4",
    "title": "戦の神",
    "title_en": "God of War",
    "description": "戦の神が空から見守る戦場で、勇敢な戦士たちが命を燃やして戦う。\n和のテイストを帯びた壮大な音楽が、歴史的な戦場の荘厳さを描き出します。\n戦争シーン・武将の登場・和風アクションゲームのバトルBGMに。",
    "description_en": "On a battlefield watched by the god of war, valiant warriors burn with fierce resolve. Grand music with Japanese essence capturing the majesty of battle.",
    "feeling": [
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "battle",
      "boss"
    ],
    "story": [
      "resolve"
    ],
    "duration": "1:39",
    "durationSec": 99,
    "mp3": "/music/o/o4.mp3"
  },
  {
    "id": "o5",
    "title": "屋敷伝説",
    "title_en": "Mansion Legend",
    "description": "深夜の古い洋館で、死者たちが美しくも恐ろしいワルツを踊り始める。\n中世ゴシックの雰囲気と、死の優雅さが絡み合う独特の美しさを持つ一曲。\nゴシックホラー・幽霊屋敷・ダークファンタジーの夜会シーンに。",
    "description_en": "In a grand old mansion at midnight, the dead rise to dance a hauntingly beautiful waltz. Gothic elegance intertwines with the grace of death in dark splendor.",
    "feeling": [
      "dark",
      "mysterious"
    ],
    "style": [
      "fantasy",
      "medieval",
      "western_horror"
    ],
    "scene": [
      "church",
      "mansion"
    ],
    "story": [
      "destiny"
    ],
    "duration": "2:04",
    "durationSec": 124,
    "mp3": "/music/o/o5.mp3"
  },
  {
    "id": "o6",
    "title": "花と少女",
    "title_en": "Flower and Child",
    "description": "戦火に散った無数の命と、一輪の花を持つ少女の姿を音楽で刻んだ鎮魂歌。\n日本と幻想の響きが混ざり合い、言葉にならない哀しみと祈りを運びます。\n戦争・命の哀悼・静かな鎮魂のシーン・感動的なエンディングに。",
    "description_en": "A requiem for lives lost to war, and a lone girl holding a single flower. Japanese and fantastical harmonies carry grief and prayer beyond the reach of words.",
    "feeling": [
      "sad",
      "gentle",
      "cute"
    ],
    "style": [
      "fantasy",
      "japanese"
    ],
    "scene": [
      "battle"
    ],
    "story": [
      "farewell"
    ],
    "duration": "2:21",
    "durationSec": 141,
    "mp3": "/music/o/o6.mp3"
  },
  {
    "id": "o7",
    "title": "ガラクタ処理軍",
    "title_en": "Cleanup Crew",
    "description": "「不要」と判定されたガラクタたちを淡々と処理しにやって来る、不思議な軍隊。\n自分もガラクタかもしれないという不安と皮肉が、謎めいた音楽に滲みます。\nディストピア・皮肉的なシーン・不条理なファンタジー世界の演出に。",
    "description_en": "A mysterious crew arrives to methodically dispose of everything deemed unnecessary. Unease and irony pervade—what if you, too, are counted among the discarded?",
    "feeling": [
      "mysterious"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [
      "ruins",
      "mansion"
    ],
    "story": [
      "despair",
      "omen"
    ],
    "duration": "2:16",
    "durationSec": 136,
    "mp3": "/music/o/o7.mp3",
    "climax": {
      "start": 82.1,
      "end": 136
    }
  },
  {
    "id": "o8",
    "title": "旅の終わり",
    "title_en": "Journey's End",
    "description": "長い旅のすべてが報われる夕景の中で、壮大な達成感が音楽として溢れ出す。\n疲れも傷も全部引き受けた後に残る誇りと安堵が、沈む太陽と共に輝きます。\n旅のエンディング・クリア演出・冒険の締めくくりとして印象的なBGM。",
    "description_en": "In the evening glow where a long journey finds its reward, triumph overflows as music. Wounds and weariness become pride and relief beneath the setting sun.",
    "feeling": [
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "field",
      "travel",
      "ending"
    ],
    "story": [
      "farewell",
      "victory"
    ],
    "duration": "1:10",
    "durationSec": 70,
    "mp3": "/music/o/o8.mp3"
  },
  {
    "id": "o9",
    "title": "イヌと雪とワルツ",
    "title_en": "Dog and Snow Waltz",
    "description": "雪の中を犬と一緒に走り回った、子供の頃の楽しい記憶が音楽になったワルツ。\n不思議な懐かしさと中世的な雰囲気が混じり合い、夢のような回想を誘います。\n回想シーン・冬のBGM・懐かしい記憶を描く穏やかなシーンに。",
    "description_en": "A waltz born from childhood memories of running through snow with a beloved dog. Medieval whimsy and wistful nostalgia blend into a dreamlike reverie.",
    "feeling": [
      "mysterious"
    ],
    "style": [
      "fantasy",
      "medieval"
    ],
    "scene": [
      "snow",
      "morning"
    ],
    "story": [
      "memory"
    ],
    "duration": "2:30",
    "durationSec": 150,
    "mp3": "/music/o/o9.mp3"
  },
  {
    "id": "o10",
    "title": "砂の雫",
    "title_en": "Tears of Sand",
    "description": "砂が雫のように零れ落ち、二度と戻らない何かを指の間から失っていく音楽。\n舞台「砂の雫」のために作られた、悲しみの本質を純粋に描いたテーマ曲。\n悲劇の物語・喪失・涙するシーンの感情を高める場面に。",
    "description_en": "Sand slips through your fingers like teardrops, carrying away something that can never return. Pure sorrow capturing the very essence of irreversible loss.",
    "feeling": [
      "sad"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night",
      "snow"
    ],
    "story": [
      "farewell",
      "memory",
      "flashback",
      "dream"
    ],
    "duration": "2:02",
    "durationSec": 122,
    "mp3": "/music/o/o10.mp3"
  },
  {
    "id": "o11",
    "title": "虚構の地",
    "title_en": "Imaginary Land",
    "description": "どこにも存在しない架空の場所に、懐かしい記憶だけが宿っている寂しさ。\n現実ではなかったかもしれない幸福が、儚い音楽として残り続けます。\n失われた故郷・記憶の中の場所・孤独と思い出を描くシーンに。",
    "description_en": "A place that exists nowhere holds only the ghosts of cherished memories. The lingering music of a happiness that may never have been real at all.",
    "feeling": [
      "sad"
    ],
    "style": [
      "fantasy",
      "modern"
    ],
    "scene": [
      "night"
    ],
    "story": [
      "memory",
      "flashback"
    ],
    "duration": "1:58",
    "durationSec": 118,
    "mp3": "/music/o/o11.mp3",
    "climax": {
      "start": 51,
      "end": 118
    }
  },
  {
    "id": "o12",
    "title": "馬車道",
    "title_en": "Carriage Road",
    "description": "馬車が石畳の道を勢いよく駆け抜ける、爽快で躍動感溢れる一曲。\n風を切る速さと中世の活気が音楽になり、聴く者の気分を一気に高揚させます。\n『アルパカにいさん』（累計600万DL）にも採用され、馬車・疾走シーン・テンポの良いアクションや旅のシーンに向いています。",
    "description_en": "A carriage races along cobblestone roads with exhilarating speed and boundless energy. The rush of wind and medieval vitality that lifts the spirit instantly.",
    "feeling": [
      "happy",
      "cute"
    ],
    "style": [
      "celtic"
    ],
    "scene": [
      "field",
      "village",
      "town",
      "festival"
    ],
    "story": [
      "dailylife"
    ],
    "duration": "1:24",
    "durationSec": 84,
    "mp3": "/music/o/o12.mp3"
  },
  {
    "id": "o13",
    "title": "夢いっぱいの箱",
    "title_en": "A Box of Dreams",
    "description": "古いオルゴールの蓋を開けると、中から溢れ出す無数の夢と記憶の欠片。\n小さな箱に詰め込まれた想い出が、神秘的な音楽として静かに奏でられます。\nオルゴール・宝箱・夢や記憶を象徴するシーンの演出に。",
    "description_en": "Open an old music box and countless dreams and fragments of memory spill forth. A small vessel of treasured moments, playing its mysteries in gentle tones.",
    "feeling": [
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [
      "memory",
      "dream"
    ],
    "duration": "1:56",
    "durationSec": 116,
    "mp3": "/music/o/o13.mp3"
  },
  {
    "id": "o14",
    "title": "木漏れ日",
    "title_en": "Forest Light",
    "description": "木々の間から差し込む木漏れ日の中で、村の人々が温かく穏やかに暮らしている。\n自然と共にある幸せな日常を、明るく優しい音楽で描いた一曲です。\n村のBGM・自然豊かな場所・ほのぼのとしたライフシーンに向いています。",
    "description_en": "Dappled sunlight filters through the trees as villagers live in warm, gentle peace. A bright and tender portrait of happiness found in harmony with nature.",
    "feeling": [
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "village",
      "field"
    ],
    "story": [
      "peaceful"
    ],
    "duration": "2:24",
    "durationSec": 144,
    "mp3": "/music/o/o14.mp3"
  },
  {
    "id": "o15",
    "title": "ゆらめく月光",
    "title_en": "Moonlight Shimmer",
    "description": "夜の水面に映る月光がゆらゆらと揺れるように、淡々とした神秘が流れる。\n特定の感情に寄りすぎず、シーンの間をそっと橋渡しする汎用的な音楽。\nシーン転換・夜の場面・静かな時間の経過を表現するBGMに。",
    "description_en": "Moonlight shimmers on the water's surface in a quiet, unhurried flow of mystery. Versatile ambient music that bridges scenes with understated, silvery elegance.",
    "feeling": [
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night"
    ],
    "story": [],
    "duration": "0:21",
    "durationSec": 21,
    "mp3": "/music/o/o15.mp3"
  },
  {
    "id": "f1",
    "title": "灯台守の夢",
    "title_en": "Lighthouse Keeper's Dream",
    "description": "灯台守がひとり夜を守りながら見る、切なく美しい夢の音楽。\n孤独な仕事の合間に訪れる白昼夢は、誰かへの想いで満たされています。\n孤独・夜の見張り・切ない記憶を持つキャラクターの心情シーンに。",
    "description_en": "A lighthouse keeper's wistful dream while guarding the night alone. In the solitary hours, a reverie filled with longing for someone far away.",
    "feeling": [
      "sad",
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "night"
    ],
    "story": [
      "dream",
      "farewell"
    ],
    "duration": "2:26",
    "durationSec": 146,
    "mp3": "/music/f/f1.mp3"
  },
  {
    "id": "f2",
    "title": "街を巡る風",
    "title_en": "Wandering Wind",
    "description": "中世の街をサーカスの団が通り抜け、不思議な風が人々の間を渡っていく。\n非日常の魔法と日常の喧騒が交差する、ワルツのリズムが心地よい一曲。\n祭り・旅芸人・不思議な来訪者が街に現れるシーンのBGMに。",
    "description_en": "A circus troupe passes through a medieval town, trailing a strange and wondrous wind. The magic of the extraordinary meets everyday bustle in a charming waltz.",
    "feeling": [
      "mysterious"
    ],
    "style": [
      "fantasy",
      "medieval",
      "western_horror"
    ],
    "scene": [
      "town",
      "travel"
    ],
    "story": [],
    "duration": "4:17",
    "durationSec": 257,
    "mp3": "/music/f/f2.mp3"
  },
  {
    "id": "f3",
    "title": "威風堂々",
    "title_en": "Grand Entrance",
    "description": "背筋を伸ばして堂々と歩く姿が思わず微笑ましい、愛らしい勝利の行進曲。\n晴れ晴れとした空と同じく、清々しい高揚感が全身に広がる一曲。\n勝利・達成・可愛らしいキャラクターの晴れの場面に映えます。",
    "description_en": "A proud, upright stride that can't help but inspire a smile—an endearing victory march. Bright as a clear sky, brimming with crisp elation and cheerful triumph.",
    "feeling": [
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [
      "victory"
    ],
    "duration": "4:58",
    "durationSec": 298,
    "mp3": "/music/f/f3.mp3"
  },
  {
    "id": "f4",
    "title": "巨大な蝶",
    "title_en": "Giant Butterfly",
    "description": "翼を広げると空を覆い尽くす巨大な蝶が、激しい羽音と共に迫ってくる。\n美しさと恐ろしさが一体となった怪物の存在感が、音楽に凝縮されています。\nボスキャラ・巨大モンスター・強いな敵との対決シーンに。",
    "description_en": "A colossal butterfly unfurls wings that blot out the sky, bearing down with thunderous force. Beauty and terror fused into one powerful presence.",
    "feeling": [
      "dark",
      "scary"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "boss"
    ],
    "story": [],
    "duration": "4:54",
    "durationSec": 294,
    "mp3": "/music/f/f4.mp3"
  },
  {
    "id": "f5",
    "title": "水底の光",
    "title_en": "Light Beneath the Water",
    "description": "深い水の底から差し込む柔らかな光のように、慈しみが静かに広がる音楽。\n傷ついた心を包み込む温もりと癒しが、透き通る旋律に宿っています。\nヒーリング・癒しのシーン・心に優しく寄り添うBGMとして。",
    "description_en": "Soft light reaching up from deep beneath the water, spreading gentle compassion. A translucent melody that cradles wounded hearts in warmth and healing.",
    "feeling": [
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [
      "peaceful"
    ],
    "duration": "3:08",
    "durationSec": 188,
    "mp3": "/music/f/f5.mp3"
  },
  {
    "id": "d1",
    "title": "空から地上へ",
    "title_en": "From Sky to Earth",
    "description": "夜明けと共に空から地上へと降りてくる清涼な空気、澄み渡る早朝のBGM。\n高い場所から低い場所へとゆっくり降下するような、清々しい解放感があります。\n夜明け・降下・旅の始まり・清涼感のある場面転換のBGMに。",
    "description_en": "Cool, crystalline air descends from sky to earth at the break of dawn. A refreshing sense of release, like slowly drifting down from a great height.",
    "feeling": [
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [
      "peaceful"
    ],
    "duration": "0:30",
    "durationSec": 30,
    "mp3": "/music/d/d1.mp3"
  },
  {
    "id": "d2",
    "title": "どろぼうの世界をのぞいてみよう",
    "title_en": "Thieves' World",
    "description": "禁断の扉の隙間からどろぼうの国をそっと覗く、好奇心くすぐる怪しい音楽。\nシンプルなメロディーが軽快に怪しさを演出し、子供のような冒険心を誘います。\n怪しい場所の探索・コミカルな悪役・童話的なシーンのBGMに。",
    "description_en": "Peeking through a forbidden door into the land of thieves, curiosity piqued. A playful, mischievous melody that invites childlike adventure and wonder.",
    "feeling": [
      "mysterious",
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [],
    "duration": "0:18",
    "durationSec": 18,
    "mp3": "/music/d/d2.mp3"
  },
  {
    "id": "d3",
    "title": "ここはどろぼうの国",
    "title_en": "Land of Thieves",
    "description": "どろぼうの国の全貌が明らかになる、少し壮大でユーモラスな王国のテーマ。\n怪しさとコミカルな可愛さが合わさった、童話的な世界観を音楽で表現します。\n怪しい王国・悪役の本拠地・コミカルな冒険シーンのBGMに。",
    "description_en": "The thieves' kingdom reveals itself in whimsical grandeur. Suspicion and charming comedy unite in a storybook world brought to life through playful music.",
    "feeling": [
      "happy",
      "epic",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [],
    "duration": "0:42",
    "durationSec": 42,
    "mp3": "/music/d/d3.mp3"
  },
  {
    "id": "d4",
    "title": "木枯らし",
    "title_en": "Cold Wind",
    "description": "パトカーのサイレンをモチーフに生まれた、短くも胸にしみる寂しいジングル。\n都会の冷たい木枯らしと遠くのサイレンが混ざり合う、静かな哀愁の一片。\n場面転換・都市の孤独感・静かな夜のシーンのアクセントに。",
    "description_en": "A brief, poignant jingle born from the distant echo of a siren on a cold city night. Wintry solitude and quiet melancholy condensed into a fleeting moment.",
    "feeling": [
      "gentle"
    ],
    "style": [
      "fantasy",
      "futuristic",
      "electronic"
    ],
    "scene": [],
    "story": [],
    "duration": "0:20",
    "durationSec": 20,
    "mp3": "/music/d/d4.mp3"
  },
  {
    "id": "d5",
    "title": "ノッポとカッパのかけっこ",
    "title_en": "Racing Along",
    "description": "背の高いノッポと小さなカッパが、仲良くかけっこを楽しむ愉快な一曲。\n運動会のような弾むリズムと無邪気な楽しさが、体を自然に動かしたくなります。\n運動シーン・子供の遊び・コミカルなキャラクターのアクションに。",
    "description_en": "A tall fellow and a little kappa race each other in cheerful, bouncing delight. Playful rhythms and innocent fun that make you want to jump up and move.",
    "feeling": [
      "happy"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [],
    "duration": "0:44",
    "durationSec": 44,
    "mp3": "/music/d/d5.mp3"
  },
  {
    "id": "d6",
    "title": "がーん",
    "title_en": "Shock Sting",
    "description": "予想外の出来事や衝撃的な事実が明かされる瞬間を彩る、一発のピアノ。\nシンプルだからこそ最大の衝撃を生む、瞬間的な驚きの効果音。\nショック・驚愕・オチ・コミカルな失敗シーンのアクセントとして。",
    "description_en": "A single piano strike that punctuates a shocking revelation or unexpected twist. Maximum impact through simplicity—a sharp, instantaneous bolt of surprise.",
    "feeling": [
      "suspense"
    ],
    "style": [
      "fantasy",
      "western_horror"
    ],
    "scene": [],
    "story": [
      "defeat"
    ],
    "duration": "0:12",
    "durationSec": 12,
    "mp3": "/music/d/d6.mp3"
  },
  {
    "id": "d7",
    "title": "ささやかなひらめき",
    "title_en": "Small Discovery",
    "description": "ハープのグリッサンドが一閃し、小さなアイデアが光のように頭に浮かぶ。\n「あ、そうか！」という小さな発見の喜びを、一瞬で音楽にしたジングル。\n閃き・発見・思い出す瞬間・コミカルな解決場面のアクセントに。",
    "description_en": "A flash of harp glissando as a small idea sparks to life like a glint of light. The joy of a tiny discovery captured in one bright, fleeting moment.",
    "feeling": [
      "gentle"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [],
    "story": [],
    "duration": "0:10",
    "durationSec": 10,
    "mp3": "/music/d/d7.mp3"
  },
  {
    "id": "d8",
    "title": "壮大なひらめき",
    "title_en": "Grand Fanfare",
    "description": "大発見の喜びを全力で祝福する、金管が煌めく短い壮大なファンファーレ。\n「これだ！」という確信の瞬間を、誰もが分かる明快な音楽で表現します。\n大発見・勝利・重要なアイテム入手・オープニングのファンファーレに。",
    "description_en": "A blazing brass fanfare celebrating a grand discovery with full-hearted triumph. The unmistakable sound of a breakthrough—bold, clear, and magnificently sure.",
    "feeling": [
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening"
    ],
    "story": [
      "victory"
    ],
    "duration": "0:10",
    "durationSec": 10,
    "mp3": "/music/d/d8.mp3"
  },
  {
    "id": "d9",
    "title": "童話「どろぼうの国」のためのテーマ",
    "title_en": "Thieves' Tale Theme",
    "description": "どろぼうの国のテーマをピアノで奏でた版。怪しげに始まりながら晴れやかな結末へ。\nピアノ一本の純粋な音色が、童話の世界を丁寧に語り直します。\n童話的なピアノシーン・物語の締めくくり・ポジティブな結末のBGMに。",
    "description_en": "The thieves' kingdom theme retold through solo piano, from shadowy beginnings to a sunlit end. Pure, honest tones that gently close the storybook with warmth.",
    "feeling": [
      "happy",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening"
    ],
    "story": [
      "victory"
    ],
    "duration": "1:24",
    "durationSec": 84,
    "mp3": "/music/d/d9.mp3"
  },
  {
    "id": "m1",
    "title": "神樹",
    "title_en": "Sacred Tree",
    "description": "深い森の奥深く、太古から立ち続ける神木に木漏れ日がそっと差し込む。\n神聖な自然の静けさと神秘が、穏やかで壮大な旋律に込められています。\n神聖な森・精霊の宿る場所・自然崇拝のシーンのBGMとして。",
    "description_en": "Deep in an ancient forest, dappled light falls softly upon a sacred tree that has stood since time began. Serene majesty and divine mystery in every note.",
    "feeling": [
      "gentle",
      "mysterious"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "forest"
    ],
    "story": [
      "peaceful"
    ],
    "duration": "3:06",
    "durationSec": 186,
    "mp3": "/music/m/m1.mp3"
  },
  {
    "id": "m2",
    "title": "ホシノキセキ",
    "title_en": "Starlight Miracle",
    "description": "星の奇跡が降り注ぐ瞬間、英雄の物語が大きな高まりへと向かう壮大な音楽。\n勇敢さと奇跡への信頼が音楽として爆発する、力強く前向きな一曲です。\n英雄的なシーン・奇跡の演出・物語のクライマックスに向いています。",
    "description_en": "As starlight miracles rain down, a hero's tale surges toward its glorious crescendo. Courage and faith in the miraculous erupt into powerful, soaring triumph.",
    "feeling": [
      "epic"
    ],
    "style": [
      "fantasy"
    ],
    "scene": [
      "opening"
    ],
    "story": [
      "victory"
    ],
    "duration": "1:30",
    "durationSec": 90,
    "mp3": "/music/m/m2.mp3"
  }
];

if (typeof window !== 'undefined') {
  window.TAGS_META = TAGS_META;
  window.TRACKS = TRACKS;
}
