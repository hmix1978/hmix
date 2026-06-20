// Playlist data - 夜風 / Night Breeze
// Titles, English titles, and durations are aligned with assets/js/tracks.js.
window.PLAYLIST = [
  { num: 1,  id: 'n72',  jp: '宵祭りの風',                 en: 'Evening Festival Wind',             file: '../../music/n/n72.mp3',  page: '../../music/n72.html',  dur: 220 },
  { num: 2,  id: 'n74',  jp: 'Moment',                     en: 'Moment',                            file: '../../music/n/n74.mp3',  page: '../../music/n74.html',  dur: 158 },
  { num: 3,  id: 'n120', jp: '望郷の丘',                   en: 'Hometown Hill',                     file: '../../music/n/n120.mp3', page: '../../music/n120.html', dur: 264 },
  { num: 4,  id: 'n97',  jp: '月夜蝶～君ヲ想フ～',         en: 'Moonlit Butterfly',                 file: '../../music/n/n97.mp3',  page: '../../music/n97.html',  dur: 134 },
  { num: 5,  id: 'n39',  jp: '夜桜小路',                   en: 'Night Cherry Blossom Path',         file: '../../music/n/n39.mp3',  page: '../../music/n39.html',  dur: 107 },
  { num: 6,  id: 'n51',  jp: '伝承の丘',                   en: 'Hill of Legends',                   file: '../../music/n/n51.mp3',  page: '../../music/n51.html',  dur: 164 },
  { num: 7,  id: 'n58',  jp: 'ガラクタ置き場',             en: 'Junkyard Elegy',                    file: '../../music/n/n58.mp3',  page: '../../music/n58.html',  dur: 127 },
  { num: 8,  id: 'n59',  jp: '花よ川よこの大地よ',         en: 'Flowers, Rivers, and Earth',        file: '../../music/n/n59.mp3',  page: '../../music/n59.html',  dur: 236 },
  { num: 9,  id: 'n73',  jp: '栄光の遺産',                 en: 'Glorious Legacy',                   file: '../../music/n/n73.mp3',  page: '../../music/n73.html',  dur: 129 },
  { num: 10, id: 'n75',  jp: 'Moment~オルゴールVer~',      en: 'Moment (Music Box)',                file: '../../music/n/n75.mp3',  page: '../../music/n75.html',  dur: 170 },
  { num: 11, id: 'n89',  jp: 'Nostalgia',                  en: 'Nostalgia',                         file: '../../music/n/n89.mp3',  page: '../../music/n89.html',  dur: 120 },
  { num: 12, id: 'n118', jp: 'ホルマリンと胎児',           en: 'Quiet Beginning',                   file: '../../music/n/n118.mp3', page: '../../music/n118.html', dur: 110 },
  { num: 13, id: 'n122', jp: '羊飼いの夕餉',               en: "Shepherd's Evening",                file: '../../music/n/n122.mp3', page: '../../music/n122.html', dur: 143 },
  { num: 14, id: 'n124', jp: '二人の旅人',                 en: 'Two Travelers',                     file: '../../music/n/n124.mp3', page: '../../music/n124.html', dur: 178 },
  { num: 15, id: 'n127', jp: 'アメノフトツハシラ',         en: 'Pillars of Heaven',                 file: '../../music/n/n127.mp3', page: '../../music/n127.html', dur: 139 },
  { num: 16, id: 'n130', jp: '大樹-その旅の終わりに-',     en: 'The Great Tree',                    file: '../../music/n/n130.mp3', page: '../../music/n130.html', dur: 176 },
  { num: 17, id: 'c1',   jp: '千年の追憶',                 en: 'A Thousand Years',                  file: '../../music/c/c1.mp3',   page: '../../music/c1.html',   dur: 256 },
  { num: 18, id: 'c2',   jp: '日時計の丘',                 en: 'Sundial Hill',                      file: '../../music/c/c2.mp3',   page: '../../music/c2.html',   dur: 132 },
  { num: 19, id: 'n33',  jp: '悠久の絆',                   en: 'Eternal Bond',                      file: '../../music/n/n33.mp3',  page: '../../music/n33.html',  dur: 132 },
  { num: 20, id: 'c7',   jp: '星寂の散歩道',               en: 'Starlit Stroll',                    file: '../../music/c/c7.mp3',   page: '../../music/c7.html',   dur: 255 },
  { num: 21, id: 'n123', jp: 'いつかの大地へ',             en: 'Journey to a Distant Land',         file: '../../music/n/n123.mp3', page: '../../music/n123.html', dur: 219 },
  { num: 22, id: 'n61',  jp: '天地に咲く華',               en: 'Blossoms of Heaven and Earth',      file: '../../music/n/n61.mp3',  page: '../../music/n61.html',  dur: 187 },
];
window.PLAYLIST_TOTAL_SEC = window.PLAYLIST.reduce((s, t) => s + t.dur, 0);
