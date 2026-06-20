'use strict';
/* ============================================================
   H/MIX COMPRESSOR — 視覚で学ぶコンプレッサー  engine
   ============================================================ */

// ---- Localisation ----
const L = {
  ja: {
    brandSub: '〜 視覚で学ぶコンプレッサー 〜',
    presetLabel: 'プリセット',
    bypass: 'バイパス', bypassActive: 'バイパス中',
    reset: 'リセット',
    autoGain: 'オートゲイン', autoMakeup: 'オートメイクアップ', protectLimit: '保護リミッター',
    learn: '使い方',
    inputGain: 'INPUT GAIN', inputGainJp: '入力音量',
    mix: 'MIX', mixJp: 'ドライ／ウェット',
    grLabel: 'GAIN REDUCTION', grLabelJp: '圧縮された量',
    makeup: 'MAKE-UP', makeupJp: '音量を戻す',
    vuIn: 'INPUT', vuInJp: '入力',
    vuOut: 'OUTPUT', vuOutJp: '出力',
    coreLabel: 'いま聞いている音',
    liveHead: 'いま何が起きてる?',
    liveDefault: '音を再生すると、 ここに動きを解説します。',
    fileSelect: '▲ オーディオファイルを選択',
    exportWav: 'WAVを書き出し',
    exportingWav: '書き出し中...',
    exportNeedFile: '先にオーディオファイルを選択してください。',
    exportDone: 'WAVを書き出しました。',
    exportFailed: '書き出しに失敗しました。',
    presetHintMain: 'まずはここから',
    presetHintSub:  'プリセットを選んで音を体験',
    clipWarn: '<em class="r">音割れ警告!</em> 出力が 0 dBFS に達しました。 MAKE-UP を下げるか、 保護リミッターを ON にしてください。',
    tipProtectLimit: '出力 0 dBFS を超えないようリミッターで保護',
    tipHpf: 'サイドチェーン低域カット: 検出器のみに HPF を掛け、 ベースで圧縮が暴れるのを防ぐ (聴こえる音は full range)',
    tutorial1: '次に THRESHOLD を下げてみる',
    tutorial2: '次に RATIO を上げてみる',
    tutorial3: 'バイパスで原音と比較',
    tipAbA: 'スロット A の設定を呼び出す',
    tipAbB: 'スロット B の設定を呼び出す',
    tipAbCopy: '現在の設定をスロットに保存 (A/B 比較用)',
    abCopyText: '保存',
    mini: {
      attack:   { cap: 'ATTACK',    jp: '立ち上がりの速さ', unit: 'ms' },
      release:  { cap: 'RELEASE',   jp: '戻りの長さ',       unit: 'ms' },
      ratio:    { cap: 'RATIO',     jp: '圧縮の強さ',       unit: ': 1' },
      knee:     { cap: 'KNEE',      jp: '境目の柔らかさ',   unit: 'dB' },
      sidechain:{ cap: 'SIDECHAIN', jp: 'サイドチェイン',   unit: 'Hz' },
    },
    threshold: { cap: 'THRESHOLD', jp: '圧縮を始める音量', unit: 'dB' },
    toggles: {
      in:    { cap: 'IN',          jp: '入力検知' },
      hpf:   { cap: 'SC HPF',      jp: 'サイドチェーン低域カット' },
      sc:    { cap: 'SC FILTER',   jp: 'サイドチェインフィルタ' },
      link:  { cap: 'LINK',        jp: 'L/R 連動' },
      ovs:   { cap: 'OVERSAMPLING',jp: '4× オーバーサンプリング' },
      learn: { cap: 'LEARN',       jp: '使い方ツアー' },
      narration: { cap: 'NARRATE', jp: 'ライブ実況' },
    },
    statusLabels: {
      attack:  { weak: '最初の音が抜ける', good: '自然な速さ',   strong: 'やや遅め',     over: '鋭すぎる',      idle: '──' },
      release: { weak: '長く尾を引く',     good: '自然な長さ',   strong: 'やや長め',     over: '短すぎ・パンピング', idle: '──' },
      ratio:   { weak: '圧縮なし',       good: '自然な圧縮',     strong: '強い圧縮',      over: 'リミッター(壁)',  idle: '──' },
      knee:    { weak: 'はっきり境界',   good: '自然な境目',     strong: '柔らかい境目',  over: 'とても柔らか',    idle: '──' },
      threshold:{ weak: '大きい音だけ圧縮', good: '適度に圧縮',   strong: '小さい音から圧縮', over: '常時圧縮',     idle: '──' },
    },
    presets: {
      off:        { name: '何もしない',       en: 'OFF',         desc: 'コンプを通さない原音そのまま。 比較や原音確認用。' },
      natural:    { name: 'ナチュラル',       en: 'NATURAL',     desc: '楽曲の表情を保ちつつ、 音量差をやさしく整える汎用設定。' },
      busglue:    { name: '全体をまとめる',   en: 'GLUE',        desc: '楽曲全体に一体感を出す。 マスターバスや mix 仕上げ、 全パートを一つにまとめたい時に。' },
      vocalup:    { name: 'ボーカル前出し',   en: 'VOCAL UP',    desc: '主旋律やリード楽器を前に押し出して聴き取りやすくする。' },
      undervoice: { name: 'ナレーション下',   en: 'UNDER VOICE', desc: '動画のナレーションや音声と被らないよう BGM を平らにする。' },
      peaklimit:  { name: 'ピーク制御',       en: 'PEAK LIMIT',  desc: '突発的なピークだけを抑え、 最大音量を制限する。 リミッター的。' },
      youtube:    { name: 'YouTube 動画',     en: 'YOUTUBE',     desc: 'YouTube の音量基準 (-14 LUFS) に合わせた標準的な圧縮。 動画 BGM の汎用設定。' },
      tiktok:     { name: 'TikTok・リール',   en: 'TIKTOK',      desc: 'スマホで聴いてもパンチが残る、 SNS 短尺動画向け。 速いアタックで瞬間的な抜けを良く。' },
      podcast:    { name: 'ポッドキャスト',   en: 'PODCAST',     desc: '話し声を聞き取りやすく均す。 強めの圧縮 + 音量補正で安定した発話に。' },
      cinematic:  { name: '映画・予告',       en: 'CINEMATIC',   desc: 'ダイナミクスを大きく保ちつつ、 大ピークだけソフトに抑える劇伴向け。' },
      healing:    { name: '癒し・睡眠',       en: 'HEALING',     desc: 'アンビエント・ヒーリング系を穏やかに整える。 とても透明、 ほぼ素通り。' },
      edm:        { name: 'EDM・電子音楽',    en: 'EDM',         desc: 'EDM やダンス系のポンピング感を出す。 速いアタックとリリースで縦ノリを強調。' },
    },
    narration: {
      bypass:  '<em class="r">バイパス中</em> ── コンプを通っていない原音です。圧縮はありません。',
      quiet:   '音はまだ小さく、コンプには届いていません。',
      static:  '小さな音はそのまま <em class="j">コンプの中央</em> を通り抜けています。コンプは静観中。',
      active:  '大きな音が <em class="j">{gr} dB</em> 圧縮され、漏斗で押し込まれています。',
      at:      { weak: '立ち上がりが <em class="s">遅すぎて</em> 最初の音が抜けています', good: '立ち上がりは <em class="j">自然な速さ</em> です', strong: '立ち上がりが <em>やや遅め</em> です', over: '立ち上がりが <em class="r">鋭すぎる</em> 状態' },
      ra:      { weak: '圧縮の強さは <em class="s">ほぼゼロ</em> (1:1)', good: '圧縮は <em class="j">自然な強さ</em>', strong: '圧縮が <em>強く効いて</em> います', over: '<em class="r">硬い壁(リミッター)</em> になっています' },
      re:      { weak: '戻りが <em class="s">長く</em> 尾を引いています', good: '戻りは <em class="j">自然な長さ</em> で消えていきます', strong: '戻りが <em>やや長め</em> です', over: '戻りが <em class="r">短すぎてパンピング</em> しています' },
      muOver:  '<br>音量を <em class="r">+{v} dB</em> 持ち上げています(圧縮量より多め)。',
      muMatch: '<br>音量を <em class="j">+{v} dB</em> 持ち上げ、コンプ前と揃えています。',
      muLow:   '<br>音量を <em class="s">+{v} dB</em> 持ち上げています(まだ少し小さめ)。',
    },
    knobTips: {
      threshold: { title: 'THRESHOLD ── 圧縮を始める音量', body: '何 dB 以上の音から圧縮するか。<br>値を下げる(-3 → -30 dB)ほどコンプの円が小さくなり、より小さな音から圧縮します。<br><em>音量の境界線</em>' },
      ratio:    { title: 'RATIO ── 圧縮の強さ', body: '閾値を超えた音をどれだけ縮めるか。<br>1:1=圧縮なし / <em>2〜4:1=自然</em> / 8+=強い / ∞=リミッター<br><em>圧縮カーブの傾き</em>' },
      attack:   { title: 'ATTACK ── 立ち上がりの速さ', body: 'コンプが効き始めるまでの時間。<br>&lt;5 ms=瞬時 / <em>10〜40 ms=ふわっと</em> / &gt;100 ms=最初の音が抜ける<br><em>時定数 τ</em>' },
      release:  { title: 'RELEASE ── 戻りの長さ', body: 'コンプが解けるまでの時間。<br>&lt;50 ms=パンピング / <em>100〜300 ms=自然</em> / &gt;500 ms=余韻が重い<br><em>時定数 τ</em>' },
      knee:     { title: 'KNEE ── 境目の柔らかさ', body: '閾値前後の遷移の滑らかさ。<br>0=はっきり / <em>6〜18=自然</em> / 30+=とても柔らか<br><em>遷移幅 (dB)</em>' },
      sidechain:{ title: 'SIDECHAIN ── 検出帯', body: 'コンプ検出器の前段に挿入する HPF。<br>低域でコンプが揺れるのを防ぎたいときに有効。<br>20〜400 Hz 推奨。' },
      input:    { title: 'INPUT GAIN ── 入力音量', body: 'コンプに入る前の音量(±24 dB)。' },
      mix:      { title: 'MIX ── ドライ／ウェット', body: '原音と圧縮音の混合比。<br>パラレルコンプ感が欲しい時は 60〜80% に。' },
    },
    learnSteps: [
      { title: '1. コンプとは', body: `コンプレッサーは「<em class="j">大きすぎる音だけを抑えて、音量差を小さくする</em>」装置です。<br>画面は <em class="j">音の粒</em> が左から右へ流れる図。 中央の <em>コンプの円</em> が引力源のように作用し、 閾値を超えた粒が <em>漏斗</em> に押し込まれて細い帯となって右へ抜けます。<br><span class="try">▶ デモ音源を再生して、左→右への音の流れを観察。</span>`, focus: null },
      { title: '2. THRESHOLD ── 圧縮を始める音量', body: `<em class="j">何 dB 以上の音から圧縮するか</em>を決めます。値を下げる(-3 → -30 dB)ほどコンプの円が小さくなり、より小さな音から圧縮します。<br><span class="try">▶ THRESHOLD ノブを下げて、円の大きさが変わるのを観察。</span>`, focus: 'threshold' },
      { title: '3. ATTACK ── 立ち上がりの速さ', body: `コンプが <em class="j">効き始める速さ</em>。<em class="r">&lt;5 ms</em>=瞬時に効く / <em class="j">10〜40 ms=ふわっと</em> / <em class="s">&gt;100 ms</em>=最初の音が抜ける。 画面左の <em>赤いバー</em> が長くなります。<br><span class="try">▶ ATTACK を 5 ms と 100 ms で比べる。</span>`, focus: 'attack' },
      { title: '4. RATIO ── 圧縮の強さ', body: `閾値を超えた音を <em class="j">何分の 1 に縮めるか</em>。1:1=圧縮なし / <em class="j">2〜4:1=自然</em> / 8+=強い / ∞=リミッター。 漏斗の傾きが急になります。<br><span class="try">▶ RATIO を 1 → 8 と動かして漏斗の傾きを観察。</span>`, focus: 'ratio' },
      { title: '5. RELEASE ── 戻りの長さ', body: `コンプが <em class="j">解ける時間</em>。<em class="r">&lt;50 ms</em>=パンピング / <em class="j">100〜300 ms=自然</em> / <em class="s">&gt;500 ms</em>=重い余韻。 画面右の <em>青いバー</em> が長くなります。<br><span class="try">▶ RELEASE を 30 ms / 200 ms / 800 ms で比べる。</span>`, focus: 'release' },
      { title: '6. MAKE-UP ── 音量を戻す', body: `コンプは音量を「下げる」装置なので、 そのままだと音が小さくなります。 <em class="j">MAKE-UP</em> で失った分を持ち上げて元の音量に戻します。 +3 dB で背景がぱっと明るくなります。<br><span class="try">▶ スライダーを動かして音量を戻す。 +3 dB あたりが心地よい。</span>`, focus: null },
      { title: '7. 全体像', body: `<em class="j">コンプの円</em>(threshold) が <em class="j">引力源</em> として、 閾値を超えた音を <em class="j">漏斗</em> に押し込み、 <em class="j">圧縮の傾き</em>(ratio) で何分の 1 に縮めます。 効き始めの速さは <em class="j">attack</em>、 解ける速さは <em class="j">release</em>。<br><span class="try">▶ バイパスで原音と比較し、 各ノブを動かして効きを確認。</span>`, focus: null },
    ],
  },
  en: {
    brandSub: '— Visual Compressor Tutorial —',
    presetLabel: 'PRESET',
    bypass: 'BYPASS', bypassActive: 'BYPASSING',
    reset: 'RESET',
    autoGain: 'AUTO GAIN', autoMakeup: 'AUTO MAKEUP', protectLimit: 'SAFE LIMITER',
    learn: 'LEARN',
    inputGain: 'INPUT GAIN', inputGainJp: 'input level',
    mix: 'MIX', mixJp: 'dry / wet',
    grLabel: 'GAIN REDUCTION', grLabelJp: 'amount compressed',
    makeup: 'MAKE-UP', makeupJp: 'restore volume',
    vuIn: 'INPUT', vuInJp: 'in',
    vuOut: 'OUTPUT', vuOutJp: 'out',
    coreLabel: 'what you hear now',
    liveHead: 'WHAT IS HAPPENING NOW?',
    liveDefault: 'Play a source to see live commentary here.',
    fileSelect: '▲ choose an audio file',
    exportWav: 'Export WAV',
    exportingWav: 'Exporting...',
    exportNeedFile: 'Choose an audio file first.',
    exportDone: 'WAV exported.',
    exportFailed: 'Export failed.',
    presetHintMain: 'START HERE',
    presetHintSub:  'pick a preset and hit play',
    clipWarn: '<em class="r">CLIP WARNING!</em> Output reached 0 dBFS. Lower MAKE-UP or enable the safe limiter.',
    tipProtectLimit: 'Limiter prevents output from exceeding 0 dBFS',
    tipHpf: 'Sidechain low cut: HPF the detector only so bass does not trigger compression. Audio output stays full-range.',
    tutorial1: 'NEXT: lower THRESHOLD',
    tutorial2: 'NEXT: raise RATIO',
    tutorial3: 'BYPASS to compare with original',
    tipAbA: 'Recall settings from slot A',
    tipAbB: 'Recall settings from slot B',
    tipAbCopy: 'Save current settings to slot (for A/B compare)',
    abCopyText: 'Save',
    mini: {
      attack:   { cap: 'ATTACK',    jp: 'engage time',  unit: 'ms' },
      release:  { cap: 'RELEASE',   jp: 'recover time', unit: 'ms' },
      ratio:    { cap: 'RATIO',     jp: 'amount',       unit: ': 1' },
      knee:     { cap: 'KNEE',      jp: 'edge softness',unit: 'dB' },
      sidechain:{ cap: 'SIDECHAIN', jp: 'sidechain',    unit: 'Hz' },
    },
    threshold: { cap: 'THRESHOLD', jp: 'level to start compressing', unit: 'dB' },
    toggles: {
      in:    { cap: 'IN',          jp: 'detector' },
      hpf:   { cap: 'SC HPF',      jp: 'sidechain low cut' },
      sc:    { cap: 'SC FILTER',   jp: 'sidechain filter' },
      link:  { cap: 'LINK',        jp: 'L/R link' },
      ovs:   { cap: 'OVERSAMPLING',jp: '4× oversample' },
      learn: { cap: 'LEARN',       jp: 'guided tour' },
      narration: { cap: 'NARRATE', jp: 'live commentary' },
    },
    statusLabels: {
      attack:  { weak: 'transient leaks', good: 'natural',        strong: 'a bit slow',    over: 'too sharp',     idle: '──' },
      release: { weak: 'long tail',       good: 'natural',        strong: 'a bit long',    over: 'pumping',       idle: '──' },
      ratio:   { weak: 'no compress',  good: 'gentle compress', strong: 'strong compress', over: 'limiter (wall)',  idle: '──' },
      knee:    { weak: 'hard edge',    good: 'natural edge',    strong: 'soft edge',     over: 'very soft',         idle: '──' },
      threshold:{ weak: 'loud only',   good: 'balanced',        strong: 'soft also',     over: 'always on',         idle: '──' },
    },
    presets: {
      off:        { name: 'Off',          en: 'OFF',         desc: 'No compression. Original signal passes through.' },
      natural:    { name: 'Natural',      en: 'NATURAL',     desc: 'Gentle compression preserving dynamics. All-purpose.' },
      busglue:    { name: 'Mix Glue',     en: 'GLUE',        desc: 'Cohesive mix bus compression. Brings the whole mix together.' },
      vocalup:    { name: 'Vocal Up',     en: 'VOCAL UP',    desc: 'Push lead vocals or melody forward in the mix.' },
      undervoice: { name: 'Under Voice',  en: 'UNDER VOICE', desc: 'Flattens BGM so it sits beneath narration.' },
      peaklimit:  { name: 'Peak Limit',   en: 'PEAK LIMIT',  desc: 'Suppresses sudden peaks. Limiter-style.' },
      youtube:    { name: 'YouTube',      en: 'YOUTUBE',     desc: 'Targets YouTube\'s -14 LUFS normalization. General-purpose for video BGM.' },
      tiktok:     { name: 'TikTok / Reels', en: 'TIKTOK',    desc: 'Punchy compression for mobile-first short-form video. Fast attack for transient impact.' },
      podcast:    { name: 'Podcast',      en: 'PODCAST',     desc: 'Smooths spoken word for clear intelligibility. Heavier compression with makeup gain.' },
      cinematic:  { name: 'Cinematic',    en: 'CINEMATIC',   desc: 'Preserves wide dynamics, only catches the loudest peaks. For film score and trailers.' },
      healing:    { name: 'Healing',      en: 'HEALING',     desc: 'Very transparent for ambient and healing music. Nearly invisible compression.' },
      edm:        { name: 'EDM',          en: 'EDM',         desc: 'Pumping character for EDM and dance music. Fast attack and release for rhythmic drive.' },
    },
    narration: {
      bypass:  '<em class="r">Bypassing</em> — original signal not going through the compressor. No compression.',
      quiet:   'Sound is still quiet and not reaching the threshold.',
      static:  'Soft sounds pass straight through <em class="j">the center of the compressor</em>. Compressor is idle.',
      active:  'Loud sounds are compressed by <em class="j">{gr} dB</em>, pushed into the funnel.',
      at:      { weak: 'Engage is <em class="s">too slow</em>, transients are leaking through', good: 'Engage time is <em class="j">natural</em>', strong: 'Engage is <em>a bit slow</em>', over: 'Engage is <em class="r">too sharp</em>' },
      ra:      { weak: 'Compression is <em class="s">virtually none</em> (1:1)', good: 'Compression is <em class="j">gentle and natural</em>', strong: 'Compression is <em>strong</em>', over: 'It is now a <em class="r">hard wall (limiter)</em>' },
      re:      { weak: 'Recovery has a <em class="s">long tail</em>', good: 'Recovery time is <em class="j">natural</em>', strong: 'Recovery is <em>a bit long</em>', over: 'Recovery is <em class="r">too short — pumping</em>' },
      muOver:  '<br>Output lifted by <em class="r">+{v} dB</em> (above GR amount).',
      muMatch: '<br>Output lifted by <em class="j">+{v} dB</em>, matching pre-comp volume.',
      muLow:   '<br>Output lifted by <em class="s">+{v} dB</em> (still slightly quieter).',
    },
    knobTips: {
      threshold: { title: 'THRESHOLD — level to start compressing', body: 'From what dB level compression begins.<br>Lower values (-3 → -30 dB) shrink the compressor circle so even softer sounds get compressed.<br><em>The volume boundary</em>' },
      ratio:    { title: 'RATIO — amount of compression', body: 'How much the over-threshold sound is reduced.<br>1:1 = none / <em>2–4:1 = natural</em> / 8+ = strong / ∞ = limiter<br><em>slope of the compression curve</em>' },
      attack:   { title: 'ATTACK — engage time', body: 'Time before compression starts to act.<br>&lt;5 ms = instant / <em>10–40 ms = soft</em> / &gt;100 ms = transient leaks<br><em>time constant τ</em>' },
      release:  { title: 'RELEASE — recovery time', body: 'Time for compression to release.<br>&lt;50 ms = pumping / <em>100–300 ms = natural</em> / &gt;500 ms = heavy tail<br><em>time constant τ</em>' },
      knee:     { title: 'KNEE — edge softness', body: 'Smoothness of the threshold edge.<br>0 = hard / <em>6–18 = natural</em> / 30+ = very soft<br><em>transition width (dB)</em>' },
      sidechain:{ title: 'SIDECHAIN — detector HPF', body: 'High-pass filter on the detector path. 20–400 Hz.<br>Prevents low end from triggering compression.' },
      input:    { title: 'INPUT GAIN', body: 'Volume entering the compressor (±24 dB).' },
      mix:      { title: 'MIX — dry/wet', body: 'Blend ratio of original vs compressed signal.<br>For parallel-style compression, use 60–80%.' },
    },
    learnSteps: [
      { title: '1. What is a Compressor?', body: `A compressor "<em class="j">reduces only the loud parts to even out the volume</em>".<br>On screen, <em class="j">sound particles</em> flow left → right. The <em>compressor circle</em> in the center acts like a gravitational source. Sounds above threshold get pushed into the <em>funnel</em> and emerge as a thin compressed beam on the right.<br><span class="try">▶ Try it: play "Demo" and watch the flow.</span>`, focus: null },
      { title: '2. THRESHOLD — level to start compressing', body: `<em class="j">Above what dB level</em> does compression begin? Lower values (-3 → -30 dB) shrink the compressor circle so even softer sounds get compressed.<br><span class="try">▶ Try it: lower THRESHOLD and see the circle shrink.</span>`, focus: 'threshold' },
      { title: '3. ATTACK — engage time', body: `How quickly compression <em class="j">starts to act</em>. <em class="r">&lt;5 ms</em> = instant / <em class="j">10–40 ms = soft</em> / <em class="s">&gt;100 ms</em> = first transient leaks. The <em>red bar</em> on the left shows this length.<br><span class="try">▶ Try it: compare ATTACK at 5 ms vs 100 ms.</span>`, focus: 'attack' },
      { title: '4. RATIO — amount of compression', body: `<em class="j">By what factor</em> over-threshold sound is reduced. 1:1 = none / <em class="j">2–4:1 = natural</em> / 8+ = strong / ∞ = limiter. The funnel slope steepens.<br><span class="try">▶ Try it: sweep RATIO from 1 to 8.</span>`, focus: 'ratio' },
      { title: '5. RELEASE — recovery time', body: `Time for compression to <em class="j">let go</em>. <em class="r">&lt;50 ms</em> = pumping / <em class="j">100–300 ms = natural</em> / <em class="s">&gt;500 ms</em> = heavy tail. The <em>blue bar</em> on the right shows this length.<br><span class="try">▶ Try it: compare RELEASE at 30 / 200 / 800 ms.</span>`, focus: 'release' },
      { title: '6. MAKE-UP — restore volume', body: `Compression lowers volume, so <em class="j">MAKE-UP</em> lifts it back. +3 dB makes the background flash bright.<br><span class="try">▶ Try it: move the slider; +3 dB feels just right.</span>`, focus: null },
      { title: '7. Big picture', body: `The <em class="j">compressor circle</em> (threshold) acts as a <em class="j">gravity source</em>, pushing over-threshold sound into the <em class="j">funnel</em>, then reducing it by the <em class="j">slope</em> (ratio). <em class="j">Attack</em> sets engage time, <em class="j">release</em> sets recovery time.<br><span class="try">▶ Try it: BYPASS to compare; tweak each knob to feel its effect.</span>`, focus: null },
    ],
  },
};

// ---- State ----
const state = {
  threshold: 0, ratio: 1.0, attack: 20, release: 200, knee: 6, makeup: 0,
  inputGain: 0, mix: 100, scFreq: 80,
  bypass: false, autoGain: false, autoMakeup: false, protectLimit: true,
  tutorialStep: 0,   // 0=preset待ち / 1=THRESHOLD / 2=RATIO / 3=BYPASS / 4=完了
  hpf: false, sc: false, link: true, ovs: false, narrate: true,
  preset: 'off',
  abSlot: 'A',
  abMem: { A: null, B: null },
  // measured
  inLevel: 0, outLevel: 0, gr: 0,
  inPeak: 0, outPeak: 0, inPeakHold: 0, outPeakHold: 0, lastInPeak: 0, lastOutPeak: 0,
  // visual
  focusKnob: null,
  frostLevel: 0,
  ripples: [],
  dimples: [],
  prevGr: 0,
  lastPulseAt: 0,
  peakRaw: 0, peakSmooth: 0,
  lastAttackBurstAt: 0, attackBurstStrength: 0,
  climaxLevel: 0,
  coreEnergy: 0,
  playing: false,
  userFileName: '',
  userAudioFile: null,
  userObjectUrl: '',
  exportBusy: false,
  // 輪っか (ブラックホール/ホワイトホール モデル)
  ringAngle: -Math.PI / 12,   // 初期 -15° = 輪が左上を向く (デザイン的に斜め配置)
  ringSpin: 0.0009,       // 自動回転速度
  bgGlow: 0,              // 背景の輝き (出力連動)
};

// ---- Presets (12 プリセット: 基本機能 + 動画/SNS + ジャンル) ----
//   基本グループ:
//     off, natural, busglue, vocalup, undervoice, peaklimit
//   動画・SNS グループ (LUFS リサーチに基づく):
//     youtube  -14 LUFS 標準、 適度な圧縮
//     tiktok   モバイル前提、 パンチ重視
//     podcast  声主体、 強圧縮で明瞭化
//   ジャンル・用途グループ:
//     cinematic ダイナミクス保持の劇伴向け
//     healing   ヒーリング・アンビエント、 穏やか
//     edm       EDM・電子音楽、 速いポンピング
const PRESETS = {
  off:        { threshold:  0,  ratio: 1.0, attack: 20, release: 200, knee: 0,  makeup: 0,  inputGain: 0 },
  natural:    { threshold: -16, ratio: 2.0, attack: 30, release: 250, knee: 6,  makeup: 2,  inputGain: 0 },
  busglue:    { threshold: -18, ratio: 2.4, attack: 50, release: 350, knee: 8,  makeup: 2,  inputGain: 0 },
  vocalup:    { threshold: -18, ratio: 3.0, attack: 15, release: 180, knee: 4,  makeup: 3,  inputGain: 0 },
  undervoice: { threshold: -26, ratio: 4.0, attack: 20, release: 220, knee: 6,  makeup: 5,  inputGain: 0 },
  peaklimit:  { threshold: -6,  ratio: 10.0,attack: 1,  release: 80,  knee: 0,  makeup: 0,  inputGain: 0 },
  youtube:    { threshold: -18, ratio: 2.5, attack: 25, release: 200, knee: 6,  makeup: 3,  inputGain: 0 },
  tiktok:     { threshold: -22, ratio: 3.5, attack: 8,  release: 80,  knee: 4,  makeup: 5,  inputGain: 0 },
  podcast:    { threshold: -24, ratio: 4.0, attack: 5,  release: 120, knee: 6,  makeup: 6,  inputGain: 0 },
  cinematic:  { threshold: -10, ratio: 1.8, attack: 30, release: 400, knee: 12, makeup: 1,  inputGain: 0 },
  healing:    { threshold: -8,  ratio: 1.5, attack: 50, release: 500, knee: 18, makeup: 0,  inputGain: 0 },
  edm:        { threshold: -16, ratio: 5.0, attack: 3,  release: 60,  knee: 2,  makeup: 4,  inputGain: 0 },
};
// 各パラメータのデフォルト値 (ダブルクリックで戻す)
const PARAM_DEFAULTS = {
  threshold: 0, ratio: 1.0, attack: 20, release: 200, knee: 6,
  inputGain: 0, makeup: 0, mix: 100,
};
const PRESET_ORDER = [
  'off', 'natural', 'busglue', 'vocalup', 'undervoice', 'peaklimit',
  'youtube', 'tiktok', 'podcast',
  'cinematic', 'healing', 'edm',
];

// ---- Status helpers ----
const ATTACK_COLORS = {
  weak:   { r: 130, g: 165, b: 195 },
  good:   { r: 64,  g: 206, b: 180 },
  strong: { r: 195, g: 165, b: 96  },
  over:   { r: 230, g: 110, b: 95  },
  idle:   { r: 217, g: 181, b: 102 },
};

function statusOf(param, v) {
  switch (param) {
    case 'threshold':
      if (v >= -3)  return 'idle';
      if (v >= -12) return 'weak';
      if (v >= -24) return 'good';
      if (v >= -36) return 'strong';
      return 'over';
    case 'attack':
      if (v < 10) return 'over';
      if (v <= 40) return 'good';
      if (v <= 80) return 'strong';
      return 'weak';
    case 'release':
      if (v < 50) return 'over';
      if (v <= 280) return 'good';
      if (v <= 420) return 'strong';
      return 'weak';
    case 'ratio':
      if (v < 1.2) return 'idle';
      if (v <= 4.5) return 'good';
      if (v <= 7.5) return 'strong';
      return 'over';
    case 'knee':
      if (v < 3) return 'weak';
      if (v <= 18) return 'good';
      if (v <= 30) return 'strong';
      return 'over';
    default: return 'idle';
  }
}
function statusColor(param) {
  const v = state[param];
  const s = statusOf(param, v);
  return { status: s, color: ATTACK_COLORS[s] || ATTACK_COLORS.idle };
}

// ---- Locale ----
let locale = 'ja';
function t(path) {
  const parts = path.split('.');
  let v = L[locale];
  for (const p of parts) v = (v != null) ? v[p] : undefined;
  if (v === undefined) {
    v = L.ja;
    for (const p of parts) v = (v != null) ? v[p] : undefined;
  }
  return v ?? '';
}
function fmt(s, vars) { let o = s; for (const k in vars) o = o.replace('{' + k + '}', vars[k]); return o; }

// ============================================================
// Web Audio chain
// ============================================================
let ctx = null;
let inputAnalyser, outputAnalyser, inputGainNode, scHpfNode;
let detectorComp;     // 検出専用コンプ (サイドチェーン入力)、 reduction を polled して grNode に適用
let grNode;           // 主信号経路の Gain Reduction を実行する GainNode (detectorComp.reduction で 60fps 駆動)
let silentSink;       // detectorComp の出力先 (gain=0 → ノードがアクティブに保たれるが音は出ない)
let dryGain, wetGain, makeupNode, mixDryGain, mixWetGain, finalGain;
let protectLimiter;   // 出力 0 dBFS 寸前を抑える保護リミッター (state.protectLimit で ON/OFF)
let protectClipper;   // 絶対天井ハードクリッパ (WaveShaper、 transient 漏れを完全に防ぐ)
let _clipCurveOn = null;   // ON 用ソフトクリップカーブ (OFF は curve=null で pass-through)
let mediaUserNode;
let activeSourceNode = null;
const audioUser = document.getElementById('audio-user');
let activeSource = null;
// synthesized demo loop
let demoNode = null;
let demoPlaying = false;
function buildDemoNode() {
  // a slowly evolving "lifelike" pad: 3 detuned saws + LFO amp + gentle pulses
  const out = ctx.createGain();
  out.gain.value = 0.5;
  // pad
  const padBus = ctx.createGain(); padBus.gain.value = 0.18;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; lp.Q.value = 0.6;
  const freqs = [110, 165, 220, 277];
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = i % 2 ? 'sawtooth' : 'triangle';
    o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.005);
    const g = ctx.createGain(); g.gain.value = 0.25 / freqs.length;
    // slow LFO on each
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08 + i * 0.04;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.6 + i * 0.2;
    lfo.connect(lfoG); lfoG.connect(o.detune);
    o.connect(g); g.connect(lp);
    o.start(); lfo.start();
  });
  lp.connect(padBus); padBus.connect(out);
  // periodic transients (kick-like) every ~1.6s for compressor demo
  const pulseBus = ctx.createGain(); pulseBus.gain.value = 0.7;
  pulseBus.connect(out);
  const tick = () => {
    if (!demoPlaying) return;
    const now = ctx.currentTime;
    // kick
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(180, now);
    o.frequency.exponentialRampToValueAtTime(50, now + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.9, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    o.connect(g); g.connect(pulseBus);
    o.start(now); o.stop(now + 0.5);
    // hi click
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() - 0.5) * Math.pow(1 - i/data.length, 3);
    n.buffer = buf;
    const hg = ctx.createGain(); hg.gain.value = 0.18;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4000;
    n.connect(hp); hp.connect(hg); hg.connect(pulseBus);
    n.start(now + 0.4);
    setTimeout(tick, 1500 + Math.random() * 400);
  };
  setTimeout(tick, 200);
  return out;
}

function ensureCtx() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(()=>{});
    return ctx;
  }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  inputAnalyser  = ctx.createAnalyser();
  outputAnalyser = ctx.createAnalyser();
  inputGainNode  = ctx.createGain();
  // サイドチェーン HPF: 検出経路だけに掛かる (主信号は full range 通過)
  scHpfNode      = ctx.createBiquadFilter(); scHpfNode.type = 'highpass';
  scHpfNode.frequency.value = 60; scHpfNode.Q.value = 0.7;
  detectorComp   = ctx.createDynamicsCompressor();   // 検出専用、 出力は silentSink へ
  grNode         = ctx.createGain();                  // 主経路の GR 実行 (gain = 10^(reduction/20))
  silentSink     = ctx.createGain(); silentSink.gain.value = 0;  // 検出器出力を吸収 (音は出さない)
  dryGain        = ctx.createGain();
  wetGain        = ctx.createGain();
  makeupNode     = ctx.createGain();
  mixDryGain     = ctx.createGain();
  mixWetGain     = ctx.createGain();
  finalGain      = ctx.createGain();
  protectLimiter = ctx.createDynamicsCompressor();
  protectClipper = ctx.createWaveShaper();
  protectClipper.oversample = '4x';   // エイリアシング低減
  // ON 用カーブ: |x| < 0.85 は完全な identity (1:1 通過、 ゲイン変化ゼロ)、
  //   |x| ∈ [0.85, 1.0] で滑らかに 0.95 へソフトクリップ。
  //   入力 > ±1 は WaveShaper 仕様でエッジ値 ±0.95 にクランプ → 絶対天井保証。
  if (!_clipCurveOn) {
    const N = 8192;
    _clipCurveOn = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * 2 - 1;
      const ax = Math.abs(x);
      let y;
      if (ax < 0.85) {
        y = x;   // 完全 identity (低域で勝手にブーストしない)
      } else {
        const t = Math.min(1, (ax - 0.85) / 0.15);   // 0..1
        const eased = 1 - Math.pow(1 - t, 2);          // ease-out
        y = Math.sign(x) * (0.85 + 0.10 * eased);     // 0.85 → 0.95
      }
      _clipCurveOn[i] = y;
    }
  }
  // OFF 時は curve = null → WaveShaper が完全 pass-through (Web Audio 仕様)
  // 注意: identity な Float32Array でも WaveShaper は入力を ±1 にクランプするため、
  //   true pass-through には必ず curve = null が必要。
  protectClipper.curve = _clipCurveOn;
  inputAnalyser.fftSize = 1024; inputAnalyser.smoothingTimeConstant = 0.4;
  outputAnalyser.fftSize = 1024; outputAnalyser.smoothingTimeConstant = 0.4;

  // bypass 経路の初期値を確実にセット (createGain のデフォルト 1.0 だと両方経路から音が出る)
  dryGain.gain.value = 0;
  wetGain.gain.value = 1;

  applyParams();
  setBypass(false);
  return ctx;
}

function rewireSource(node) {
  if (!ctx) return;
  if (activeSourceNode) { try { activeSourceNode.disconnect(); } catch(e){} }
  activeSourceNode = node;
  if (!node) return;
  // ── 神コンプアーキテクチャ ──
  //   主信号経路は完全 full-range で通過し、 grNode (GainNode) で GR を適用。
  //   検出経路は inputGainNode を分岐し、 SC HPF → detectorComp (出力捨てる) → silentSink。
  //   detectorComp.reduction を 60fps で polling して grNode.gain に反映 (神コンプ品質)。
  //
  //   source → inputAnalyser → inputGainNode
  //                              ├→ scHpfNode → detectorComp → silentSink → destination (gain 0)
  //                              ├→ grNode → wetGain → makeupNode → mixWetGain  (圧縮された主信号)
  //                              └→ dryGain → mixDryGain                        (素通り)
  //
  node.connect(inputAnalyser);
  inputAnalyser.connect(inputGainNode);
  inputGainNode.disconnect();
  // 検出経路: scHpfNode → detectorComp → silentSink → destination
  inputGainNode.connect(scHpfNode);
  scHpfNode.disconnect();
  scHpfNode.connect(detectorComp);
  detectorComp.disconnect();
  detectorComp.connect(silentSink);
  silentSink.disconnect();
  silentSink.connect(ctx.destination);
  // 主経路 wet: inputGainNode → grNode → wetGain → makeupNode → mixWetGain
  inputGainNode.connect(grNode);
  grNode.disconnect();
  grNode.connect(wetGain);
  wetGain.disconnect();
  wetGain.connect(makeupNode);
  makeupNode.disconnect();
  makeupNode.connect(mixWetGain);
  // 主経路 dry: inputGainNode → dryGain → mixDryGain (full range, 圧縮なし)
  inputGainNode.connect(dryGain);
  dryGain.disconnect();
  dryGain.connect(mixDryGain);
  // mix → finalGain → analyser → destination
  mixDryGain.disconnect();
  mixWetGain.disconnect();
  mixDryGain.connect(finalGain);
  mixWetGain.connect(finalGain);
  finalGain.disconnect();
  // finalGain → protectLimiter → protectClipper → outputAnalyser → destination
  //   protectLimiter (DynamicsCompressor): メインの抑え込み
  //   protectClipper (WaveShaper): 絶対天井 (Web Audio の ratio max=20 では transient が漏れる対策)
  //   ON 時: 両方有効 → 出力は絶対 ±0.95 以下 → ヒビ発動しない
  //   OFF 時: 両方透過 → 音割れすればヒビ発動
  finalGain.connect(protectLimiter);
  protectLimiter.disconnect();
  protectLimiter.connect(protectClipper);
  protectClipper.disconnect();
  protectClipper.connect(outputAnalyser);
  outputAnalyser.disconnect();
  outputAnalyser.connect(ctx.destination);
}

function applyParams() {
  if (!ctx) return;
  const tnow = ctx.currentTime;
  detectorComp.threshold.setTargetAtTime(state.threshold, tnow, 0.01);
  detectorComp.ratio.setTargetAtTime(state.ratio, tnow, 0.01);
  detectorComp.attack.setTargetAtTime(state.attack / 1000, tnow, 0.01);
  detectorComp.release.setTargetAtTime(state.release / 1000, tnow, 0.01);
  detectorComp.knee.setTargetAtTime(state.knee, tnow, 0.01);
  // SC HPF: state.hpf が true のとき指定周波数 (state.scFreq) で低域カット
  //   OFF 時は周波数を 10 Hz にして実質パススルー (検出器が full-range で動く)
  const scFreq = state.hpf ? Math.max(20, Math.min(400, state.scFreq || 60)) : 10;
  scHpfNode.frequency.setTargetAtTime(scFreq, tnow, 0.05);
  inputGainNode.gain.setTargetAtTime(Math.pow(10, state.inputGain / 20), tnow, 0.02);
  makeupNode.gain.setTargetAtTime(Math.pow(10, state.makeup / 20), tnow, 0.02);
  // MIX は廃止: dry も wet も常に 1.0 で通過 (bypass は dryGain/wetGain で制御)
  mixDryGain.gain.setTargetAtTime(1.0, tnow, 0.02);
  mixWetGain.gain.setTargetAtTime(1.0, tnow, 0.02);
  // 保護リミッター + ハードクリッパ (Make-Up 上げすぎや突発ピークで 0 dBFS を超えないよう抑える)
  // ON: limiter -1.0 dB / 20:1 / 0.5 ms attack で大半を抑え、 transient 漏れは WaveShaper で確実に天井 ±0.95
  // OFF: limiter ratio=1 で透過、 WaveShaper も恒等写像 (= 完全な素通り、 音割れすればヒビ発動)
  if (state.protectLimit) {
    protectLimiter.threshold.setTargetAtTime(-1.0, tnow, 0.005);
    protectLimiter.ratio.setTargetAtTime(20, tnow, 0.005);
    protectLimiter.attack.setTargetAtTime(0.0005, tnow, 0.005);
    protectLimiter.release.setTargetAtTime(0.05, tnow, 0.005);
    protectLimiter.knee.setTargetAtTime(0, tnow, 0.005);
    if (protectClipper.curve !== _clipCurveOn) protectClipper.curve = _clipCurveOn;
  } else {
    protectLimiter.ratio.setTargetAtTime(1, tnow, 0.005);
    protectLimiter.threshold.setTargetAtTime(0, tnow, 0.005);
    // WaveShaper 完全 pass-through (curve = null は Web Audio 仕様で素通り)
    if (protectClipper.curve !== null) protectClipper.curve = null;
  }
}
function setBypass(on) {
  state.bypass = on;
  if (!ctx) return;
  const tnow = ctx.currentTime;
  const ramp = 0.04;
  const dryV = on ? 1 : 0;
  const wetV = on ? 0 : 1;
  // 確実な切り替え: 現在値を確定 → linearRamp でクロスフェード
  dryGain.gain.cancelScheduledValues(tnow);
  wetGain.gain.cancelScheduledValues(tnow);
  dryGain.gain.setValueAtTime(dryGain.gain.value, tnow);
  wetGain.gain.setValueAtTime(wetGain.gain.value, tnow);
  dryGain.gain.linearRampToValueAtTime(dryV, tnow + ramp);
  wetGain.gain.linearRampToValueAtTime(wetV, tnow + ramp);
}

function setMakeup(db) {
  state.makeup = db;
  if (ctx) makeupNode.gain.setTargetAtTime(Math.pow(10, db / 20), ctx.currentTime, 0.02);
}

// ============================================================
// Offline WAV export
//   ブラウザ上でアップロード音声に現在のコンプ設定を適用し、16-bit WAVとして保存。
//   主信号の中核グラフは触らず、書き出し専用の軽量DSPで同じ公開パラメータを再現する。
// ============================================================
function dbToGain(db) {
  return Math.pow(10, db / 20);
}

function compressorGainDb(levelDb, threshold, ratio, knee) {
  if (ratio <= 1.0001) return 0;
  const over = levelDb - threshold;
  if (knee > 0) {
    const half = knee / 2;
    if (over <= -half) return 0;
    if (over >= half) return over * (1 / ratio - 1);
    const x = over + half;
    return (1 / ratio - 1) * x * x / (2 * knee);
  }
  return over > 0 ? over * (1 / ratio - 1) : 0;
}

function softClipProtect(x) {
  const ax = Math.abs(x);
  if (ax < 0.85) return x;
  const t = Math.min(1, (ax - 0.85) / 0.15);
  const eased = 1 - Math.pow(1 - t, 2);
  return Math.sign(x) * (0.85 + 0.10 * eased);
}

function renderProcessedBuffer(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const channelCount = audioBuffer.numberOfChannels;
  const input = [];
  const output = [];
  for (let ch = 0; ch < channelCount; ch++) {
    input[ch] = audioBuffer.getChannelData(ch);
    output[ch] = new Float32Array(length);
  }

  const inputGain = dbToGain(state.inputGain);
  const makeupGain = state.bypass ? 1 : dbToGain(state.makeup);
  const threshold = state.threshold;
  const ratio = Math.max(1, state.ratio);
  const knee = Math.max(0, state.knee);
  const attackSec = Math.max(0.001, state.attack / 1000);
  const releaseSec = Math.max(0.001, state.release / 1000);
  const attackCoeff = Math.exp(-1 / (sampleRate * attackSec));
  const releaseCoeff = Math.exp(-1 / (sampleRate * releaseSec));

  const hpFreq = state.hpf ? Math.max(20, Math.min(400, state.scFreq || 80)) : 0;
  let hpPrevX = 0;
  let hpPrevY = 0;
  let hpAlpha = 0;
  if (hpFreq) {
    const dt = 1 / sampleRate;
    const rc = 1 / (2 * Math.PI * hpFreq);
    hpAlpha = rc / (rc + dt);
  }

  let smoothedGainDb = 0;
  for (let i = 0; i < length; i++) {
    let detector = 0;
    for (let ch = 0; ch < channelCount; ch++) {
      detector += input[ch][i] * inputGain;
    }
    detector /= Math.max(1, channelCount);
    if (hpFreq) {
      const y = hpAlpha * (hpPrevY + detector - hpPrevX);
      hpPrevX = detector;
      hpPrevY = y;
      detector = y;
    }

    const level = Math.max(1e-8, Math.abs(detector));
    const levelDb = 20 * Math.log10(level);
    const targetGainDb = state.bypass ? 0 : compressorGainDb(levelDb, threshold, ratio, knee);
    const coeff = targetGainDb < smoothedGainDb ? attackCoeff : releaseCoeff;
    smoothedGainDb = coeff * smoothedGainDb + (1 - coeff) * targetGainDb;
    const compGain = state.bypass ? 1 : dbToGain(smoothedGainDb);
    const totalGain = inputGain * compGain * makeupGain;

    for (let ch = 0; ch < channelCount; ch++) {
      let v = input[ch][i] * totalGain;
      if (state.protectLimit) v = softClipProtect(v);
      output[ch][i] = v;
    }
  }

  return { channels: output, sampleRate };
}

function encodeWav16(channels, sampleRate) {
  const channelCount = channels.length;
  const length = channels[0] ? channels[0].length : 0;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let offset = 0;
  const writeString = (s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
  };
  writeString('RIFF');
  view.setUint32(offset, 36 + dataSize, true); offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, channelCount, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bytesPerSample * 8, true); offset += 2;
  writeString('data');
  view.setUint32(offset, dataSize, true); offset += 4;

  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < channelCount; ch++) {
      const x = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, x < 0 ? x * 0x8000 : x * 0x7fff, true);
      offset += 2;
    }
  }
  return buffer;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function safeFileStem(name) {
  return (name || 'hmix-compressor')
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'hmix-compressor';
}

function setExportStatus(text, isError) {
  const el = document.getElementById('exportStatus');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? 'var(--warn)' : '';
}

async function exportCurrentWav() {
  const btn = document.getElementById('exportWavBtn');
  if (!state.userAudioFile) {
    setExportStatus(t('exportNeedFile'), true);
    return;
  }
  if (state.exportBusy) return;
  state.exportBusy = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = t('exportingWav');
  }
  setExportStatus(t('exportingWav'));
  try {
    const audioCtx = ensureCtx();
    const arrayBuffer = await state.userAudioFile.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const rendered = renderProcessedBuffer(decoded);
    const wav = encodeWav16(rendered.channels, rendered.sampleRate);
    const fileName = safeFileStem(state.userFileName) + '-hmix-compressor.wav';
    downloadBlob(new Blob([wav], { type: 'audio/wav' }), fileName);
    setExportStatus(t('exportDone'));
  } catch (e) {
    console.error(e);
    setExportStatus(t('exportFailed'), true);
  } finally {
    state.exportBusy = false;
    if (btn) {
      btn.disabled = !state.userAudioFile;
      btn.textContent = t('exportWav');
    }
  }
}

// ============================================================
// Knob component (SVG)
// ============================================================
function knobSVG(size = 100) {
  const r1 = size * 0.42;
  return `
    <svg class="pk-svg" viewBox="0 0 100 100" width="${size}" height="${size}">
      <defs>
        <radialGradient id="pkBody" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#3a4452"/>
          <stop offset="50%" stop-color="#1a242e"/>
          <stop offset="100%" stop-color="#070d14"/>
        </radialGradient>
        <radialGradient id="pkRing" cx="50%" cy="50%" r="55%">
          <stop offset="60%" stop-color="rgba(180,138,68,0.0)"/>
          <stop offset="92%" stop-color="rgba(180,138,68,0.45)"/>
          <stop offset="100%" stop-color="rgba(60,40,12,0.9)"/>
        </radialGradient>
      </defs>
      <!-- outer brass ring with notches -->
      <circle cx="50" cy="50" r="45" fill="url(#pkRing)"/>
      <g stroke="rgba(217,181,102,0.55)" stroke-width="0.7">
        ${Array.from({length:24}, (_, i) => {
          const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
          const x1 = 50 + Math.cos(a) * 44;
          const y1 = 50 + Math.sin(a) * 44;
          const x2 = 50 + Math.cos(a) * 47;
          const y2 = 50 + Math.sin(a) * 47;
          return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
        }).join('')}
      </g>
      <!-- arc track -->
      <path class="pk-arc-bg" d="${arcPath(50,50,38,135,405)}"
            fill="none" stroke="rgba(217,181,102,0.18)" stroke-width="3" stroke-linecap="round"/>
      <path class="pk-arc-fg" d=""
            fill="none" stroke="#d4a44c" stroke-width="3" stroke-linecap="round"/>
      <!-- rotor -->
      <g class="pk-rotor" style="transform-origin: 50px 50px;">
        <circle cx="50" cy="50" r="${r1}" fill="url(#pkBody)" stroke="rgba(217,181,102,0.3)" stroke-width="0.6"/>
        <circle cx="50" cy="50" r="${r1 - 4}" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="0.6"/>
        <!-- subtle top-light highlight -->
        <ellipse cx="42" cy="36" rx="14" ry="6" fill="rgba(255,240,210,0.1)"/>
        <!-- pip -->
        <g class="pk-pointer" style="transform-origin: 50px 50px;">
          <rect class="pk-tick" x="49" y="${50 - r1 + 2}" width="2" height="8" fill="rgba(245,216,150,0.3)"/>
          <circle class="pk-pip" cx="50" cy="${50 - r1 + 8}" r="2.2" fill="#f5d896"/>
        </g>
      </g>
    </svg>
  `;
}
function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = (startDeg * Math.PI) / 180;
  const e = (endDeg * Math.PI) / 180;
  const x1 = cx + Math.cos(s) * r;
  const y1 = cy + Math.sin(s) * r;
  const x2 = cx + Math.cos(e) * r;
  const y2 = cy + Math.sin(e) * r;
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function setupKnob(el, param, opts) {
  if (!el) return;   // ノブ要素が無ければ何もしない (例: MIX 削除済み)
  const { min, max, step = 0.1, log = false } = opts;
  el.innerHTML = knobSVG(opts.size || 100);
  el.dataset.param = param;
  el.dataset.min = min;
  el.dataset.max = max;
  // ── アクセシビリティ: スクリーンリーダ + キーボード操作 ──
  el.setAttribute('role', 'slider');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-valuemin', String(min));
  el.setAttribute('aria-valuemax', String(max));
  if (param) el.setAttribute('aria-label', param);

  const formatValue = (v) => {
    if (param === 'threshold') return v.toFixed(1) + ' dB';
    if (param === 'attack' || param === 'release') return Math.round(v) + ' ms';
    if (param === 'ratio') return v.toFixed(1) + ' : 1';
    if (param === 'knee') return v.toFixed(1) + ' dB';
    if (param === 'inputGain' || param === 'makeup') return (v >= 0 ? '+' : '') + v.toFixed(1) + ' dB';
    return v.toFixed(2);
  };

  const update = () => {
    const v = state[param];
    let ratioPct;
    if (log && min > 0) {
      ratioPct = (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
    } else {
      ratioPct = (v - min) / (max - min);
    }
    ratioPct = Math.max(0, Math.min(1, ratioPct));
    const startDeg = 135;
    const endDeg = 135 + ratioPct * 270;
    const arc = el.querySelector('.pk-arc-fg');
    if (arc) arc.setAttribute('d', arcPath(50, 50, 38, startDeg, endDeg));
    const rotor = el.querySelector('.pk-pointer');
    if (rotor) rotor.style.transform = `rotate(${(ratioPct * 270 - 135).toFixed(2)}deg)`;
    el.dataset.status = statusOf(param, v);
    el.setAttribute('aria-valuenow', String(v));
    el.setAttribute('aria-valuetext', formatValue(v));
  };

  el.__update = update;
  update();

  // drag
  let dragY = 0, dragStart = 0;
  const onDown = (ev) => {
    ev.preventDefault();
    ensureCtx();
    state.focusKnob = param;
    dragY = ev.clientY ?? ev.touches?.[0]?.clientY;
    dragStart = state[param];
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('touchend', onUp);
  };
  const onMove = (ev) => {
    ev.preventDefault();
    const y = ev.clientY ?? ev.touches?.[0]?.clientY;
    if (y == null) return;
    const dy = (dragY - y);
    const range = max - min;
    let next;
    if (log && min > 0) {
      const ratioPct = (Math.log(dragStart) - Math.log(min)) / (Math.log(max) - Math.log(min));
      const nextRatio = Math.max(0, Math.min(1, ratioPct + dy / 220));
      next = Math.exp(Math.log(min) + nextRatio * (Math.log(max) - Math.log(min)));
    } else {
      next = dragStart + (dy / 220) * range;
    }
    if (step) next = Math.round(next / step) * step;
    next = Math.max(min, Math.min(max, next));
    state[param] = next;
    applyParams();
    update();
    if (onChange) onChange(next);
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
    setTimeout(() => { state.focusKnob = null; }, 1200);
  };
  let onChange = opts.onChange || null;
  el.addEventListener('mousedown', onDown);
  el.addEventListener('touchstart', onDown, {passive:false});

  // ダブルクリックでデフォルト値に戻す
  el.addEventListener('dblclick', (ev) => {
    ev.preventDefault();
    ensureCtx();
    const def = (typeof PARAM_DEFAULTS !== 'undefined') ? PARAM_DEFAULTS[param] : undefined;
    if (def === undefined) return;
    state[param] = def;
    applyParams();
    update();
    if (onChange) onChange(def);
  });

  // キーボード操作 (アクセシビリティ): ↑↓→← で step、 PgUp/PgDn で 10 step、 Home/End で min/max
  el.addEventListener('keydown', (ev) => {
    let delta = 0, absolute = null;
    const stepK = step || (max - min) * 0.01;
    const bigStep = stepK * 10;
    switch (ev.key) {
      case 'ArrowUp': case 'ArrowRight': delta = +stepK; break;
      case 'ArrowDown': case 'ArrowLeft': delta = -stepK; break;
      case 'PageUp':   delta = +bigStep; break;
      case 'PageDown': delta = -bigStep; break;
      case 'Home':     absolute = min; break;
      case 'End':      absolute = max; break;
      default: return;
    }
    ev.preventDefault();
    ensureCtx();
    let next;
    if (absolute !== null) {
      next = absolute;
    } else if (log && min > 0) {
      // log scale で線形ステップを「比率の相対変化」として扱う (端で 1 step ≒ stepK)
      const cur = state[param];
      const ratioK = (Math.log(cur + delta) - Math.log(cur)) || (delta / cur);
      const curRatio = (Math.log(cur) - Math.log(min)) / (Math.log(max) - Math.log(min));
      const stepRatio = Math.abs(stepK) / (max - min);   // 線形換算の小ステップ
      const sign = Math.sign(delta);
      const newRatio = Math.max(0, Math.min(1, curRatio + sign * stepRatio));
      next = Math.exp(Math.log(min) + newRatio * (Math.log(max) - Math.log(min)));
    } else {
      next = state[param] + delta;
    }
    if (step) next = Math.round(next / step) * step;
    next = Math.max(min, Math.min(max, next));
    state[param] = next;
    applyParams();
    update();
    if (onChange) onChange(next);
  });

  // hover focus
  el.addEventListener('mouseenter', () => state.focusKnob = param);
  el.addEventListener('mouseleave', () => {
    if (state.focusKnob === param) setTimeout(() => { if (state.focusKnob === param) state.focusKnob = null; }, 600);
  });

  // tooltip
  el.addEventListener('mouseenter', () => showTip(el, t('knobTips.' + param)));
  el.addEventListener('mouseleave', () => hideTip());

  return update;
}

// ============================================================
// Tooltip
// ============================================================
const tipEl = document.createElement('div');
tipEl.className = 'gtip';
document.body.appendChild(tipEl);
function showTip(anchor, info) {
  if (!info) return;
  tipEl.innerHTML = `<div class="gtip-title">${info.title}</div>${info.body}`;
  const r = anchor.getBoundingClientRect();
  const tw = 280;
  let x = r.left + r.width / 2 - tw / 2;
  let y = r.bottom + 10;
  x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
  if (y + 110 > window.innerHeight - 8) y = r.top - 110 - 8;
  tipEl.style.left = x + 'px';
  tipEl.style.top  = y + 'px';
  tipEl.style.width = tw + 'px';
  requestAnimationFrame(() => tipEl.classList.add('is-show'));
}
function hideTip() { tipEl.classList.remove('is-show'); }

// ============================================================
// Canvas physics — compressor visualization
// ============================================================
const canvas = document.getElementById('window');
const cctx = canvas.getContext('2d');
// 描画用サイズ (CSS layout 値、transform: scale を無視)
let _canvasW = 0, _canvasH = 0;
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const parent = canvas.parentElement;
  const w = parent.offsetWidth;
  const h = parent.offsetHeight;
  if (w === _canvasW && h === _canvasH) return;  // 変化なしなら何もしない (無限ループ防止)
  _canvasW = w;
  _canvasH = h;
  canvas.width  = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  // canvas.style.width/height は CSS の 100% に任せる (inline style を入れると親を押し広げる)
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);

// particles — 輪っかへ吸い込まれる流れ (ブラックホール → ホワイトホール)
const particles = [];
const MAX_PARTICLES = 1200;
function spawnParticle(amp = 0.3, sign = 0) {
  if (particles.length >= MAX_PARTICLES) return;
  const w = _canvasW || canvas.parentElement.offsetWidth;
  const h = _canvasH || canvas.parentElement.offsetHeight;
  if (!w || !h) return;
  const cx = w / 2, cy = h / 2;
  const ampClamp = Math.min(1, Math.max(0, amp));
  // 輪っかの状態を計算
  const angle = state.ringAngle || 0;
  const ax = Math.cos(angle), ay = Math.sin(angle);
  // 入射ビームの幅 = 常に広い (画面の 72% 程度)
  // ──── コンプレッサーの物理メタファー ────
  //   入力 (広い帯=フル入力信号) ⟶ 漏斗 (funnel) で押し込まれる ⟶ ring の穴 (threshold/ratio)
  //   ⟶ 出力 (細い帯=圧縮後)
  //   threshold/ratio は ring の穴の大きさを変える。 入力帯の幅は常に同じ。
  //   入力帯が細くなったら「圧縮」が見えなくなる。
  const beamHalf = Math.min(w, h) * 0.36;
  const offset = (Math.random() - 0.5) * 2 * beamHalf;
  // 入射軸上の位置 (画面の左端ぎりぎり外側 = 即画面に入って見える)
  const dist = w * 0.50 + Math.random() * 12;
  const sx = cx - ax * dist + (-ay) * offset;
  const sy = cy - ay * dist +  ax  * offset;
  // 速度を 1.5 程度に (左端の空白を作らず、 渋滞も避ける)
  const speed = 1.5 + Math.random() * 0.6 + ampClamp * 1.0;
  // 各粒子に微妙な色相シフトと脈動位相を付与 (彩り豊か)
  const hueShift = (Math.random() - 0.5) * 24;   // ±12度
  const pulsePhase = Math.random() * Math.PI * 2;
  // attackEngaged: spawn 時に gr が立ち上がり中 (grVelSmooth が大きく正) なら true。
  //   この粒子は「attack で捕まった」 印として emerging 時に赤コロナで描画される。
  const attackEngaged = (state.grVelSmooth || 0) > 0.15;
  particles.push({
    x: sx, y: sy,
    prevX: sx, prevY: sy,                          // motion trail 用
    vx: ax * speed,
    vy: ay * speed,
    r: 5.8 + ampClamp * 10.5 + Math.random() * 2.5,
    amp: ampClamp,
    alpha: 0.90 + ampClamp * 0.08,
    life: 1.0,
    phase: 'approach',
    crossedAt: 0,
    bornAt: performance.now(),
    hueShift,
    pulsePhase,
    spawnPerp: offset,        // 圧縮率の計算に使う (元の帯位置)
    attackEngaged,            // attack で捕まった粒子マーク
  });
}
function spawnSpark(x, y, strength, color) {
  const n = 2 + Math.floor(strength * 0.7);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1 + Math.random() * (2 + strength * 0.3);
    particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 1 + Math.random() * 1.5,
      amp: 0.5,
      alpha: 0.85,
      life: 0.85,
      state: 'spark',
      sparkColor: color,
      bounced: 0,
    });
  }
}
function spawnShatter(x, y, color) {
  spawnSpark(x, y, 5, color);
}

// ── 音割れ時のヒビ模様生成 (一度生成して fade out 中は形を保つ) ──
function generateCrackPaths(ox, oy, intensity, cw, ch) {
  const paths = [];
  const branches = 5 + Math.floor(intensity * 5);
  const maxLen = Math.min(cw, ch) * (0.40 + intensity * 0.40);
  for (let i = 0; i < branches; i++) {
    const angle = (Math.PI * 2 / branches) * i + (Math.random() - 0.5) * 0.7;
    const points = [{ x: ox, y: oy }];
    let x = ox, y = oy;
    let segAngle = angle;
    let traveled = 0;
    while (traveled < maxLen) {
      const segLen = 18 + Math.random() * 28;
      x += Math.cos(segAngle) * segLen;
      y += Math.sin(segAngle) * segLen;
      points.push({ x, y });
      traveled += segLen;
      segAngle += (Math.random() - 0.5) * 0.65;
      // 30% の確率で枝分かれ
      if (Math.random() < 0.30 && traveled > maxLen * 0.30) {
        const branchAngle = segAngle + (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.5);
        const branchPts = [{ x, y }];
        let bx = x, by = y;
        let bAngle = branchAngle;
        let bTraveled = 0;
        const bMaxLen = (maxLen - traveled) * (0.30 + Math.random() * 0.50);
        while (bTraveled < bMaxLen) {
          const bSeg = 14 + Math.random() * 20;
          bx += Math.cos(bAngle) * bSeg;
          by += Math.sin(bAngle) * bSeg;
          branchPts.push({ x: bx, y: by });
          bTraveled += bSeg;
          bAngle += (Math.random() - 0.5) * 0.7;
        }
        paths.push(branchPts);
      }
    }
    paths.push(points);
  }
  return paths;
}

// ----- knob shake & status -----
// ── チュートリアル (初心者導線): preset 選択後、 THRESHOLD → RATIO → BYPASS の順に誘導 ──
function updateTutorialUI() {
  document.querySelectorAll('[data-tutorial-active]').forEach(e => {
    delete e.dataset.tutorialActive;
    delete e.dataset.tutorialText;
  });
  if (state.tutorialStep <= 0 || state.tutorialStep >= 4) return;
  let target = null, textKey = '';
  if (state.tutorialStep === 1) {
    target = '.mini-card[data-param="threshold"]';
    textKey = 'tutorial1';
  } else if (state.tutorialStep === 2) {
    target = '.mini-card[data-param="ratio"]';
    textKey = 'tutorial2';
  } else if (state.tutorialStep === 3) {
    target = '#btnBypass';
    textKey = 'tutorial3';
  }
  if (target) {
    const el = document.querySelector(target);
    if (el) {
      el.dataset.tutorialActive = '1';
      el.dataset.tutorialText = t(textKey);
    }
  }
}
function advanceTutorialFromKnob(param) {
  // CODEX 指摘: 値変化なしに進むバグ修正
  // → 実質的な操作 (Threshold は -10dB 以下、Ratio は 2:1 以上) でのみ進行
  if (param === 'threshold' && state.tutorialStep === 1) {
    if (state.threshold <= -10) state.tutorialStep = 2;
  }
  else if (param === 'ratio' && state.tutorialStep === 2) {
    if (state.ratio >= 2.0) state.tutorialStep = 3;
  }
  else return;
  updateTutorialUI();
}

function applyKnobStatus() {
  document.querySelectorAll('.physical-knob').forEach(k => {
    const p = k.dataset.param;
    if (!p) return;
    k.dataset.status = statusOf(p, state[p]);
  });
  document.querySelectorAll('.mini-card').forEach(card => {
    const p = card.dataset.param;
    if (!p) return;
    card.dataset.status = statusOf(p, state[p]);
  });
}

// ----- main render loop -----
let waveform = null;
let inFreq = null;
function readAudio() {
  if (!ctx) return;
  if (!waveform) waveform = new Uint8Array(inputAnalyser.fftSize);
  inputAnalyser.getByteTimeDomainData(waveform);
  // ── FFT 周波数解析 (低/中/高域のエネルギー比) ──
  // sampleRate ≈ 44100、 fftSize 1024 → 各 bin = ~21.5 Hz
  // 低域: bin 1-9   (0-200 Hz)
  // 中域: bin 10-93 (200-2000 Hz)
  // 高域: bin 94-512 (2k Hz 以上)
  if (!inFreq) inFreq = new Uint8Array(inputAnalyser.frequencyBinCount);
  inputAnalyser.getByteFrequencyData(inFreq);
  let bassSum = 0, midSum = 0, trebleSum = 0;
  const NB = inFreq.length;
  const bassMax = Math.min(9, NB - 1);
  const midMax  = Math.min(93, NB - 1);
  for (let i = 1; i <= bassMax; i++) bassSum += inFreq[i];
  for (let i = bassMax + 1; i <= midMax; i++) midSum += inFreq[i];
  for (let i = midMax + 1; i < NB; i++) trebleSum += inFreq[i];
  // 平均化 (各帯域 0..255)
  const bassAvg = bassSum / Math.max(1, bassMax);
  const midAvg  = midSum / Math.max(1, midMax - bassMax);
  const trebleAvg = trebleSum / Math.max(1, NB - 1 - midMax);
  // 平滑化された state を保存 (visualization 用)
  state.bassLevel   = (state.bassLevel   || 0) * 0.6 + (bassAvg / 255)   * 0.4;
  state.midLevel    = (state.midLevel    || 0) * 0.6 + (midAvg / 255)    * 0.4;
  state.trebleLevel = (state.trebleLevel || 0) * 0.6 + (trebleAvg / 255) * 0.4;
  // 比率 (色相シフト用)
  const total = state.bassLevel + state.midLevel + state.trebleLevel + 0.001;
  state.bassRatio   = state.bassLevel   / total;
  state.midRatio    = state.midLevel    / total;
  state.trebleRatio = state.trebleLevel / total;

  // peak
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < waveform.length; i++) {
    const v = (waveform[i] - 128) / 128;
    const a = Math.abs(v);
    if (a > peak) peak = a;
    sum += v * v;
  }
  const inAmp = Math.sqrt(sum / waveform.length);

  // output
  const obuf = new Uint8Array(outputAnalyser.fftSize);
  outputAnalyser.getByteTimeDomainData(obuf);
  let osum = 0, opeak = 0;
  for (let i = 0; i < obuf.length; i++) {
    const v = (obuf[i] - 128) / 128;
    if (Math.abs(v) > opeak) opeak = Math.abs(v);
    osum += v * v;
  }
  const outAmp = Math.sqrt(osum / obuf.length);

  state.inLevel = state.inLevel * 0.55 + inAmp * 0.45;
  state.outLevel = state.outLevel * 0.55 + outAmp * 0.45;
  // 瞬間ピーク: 跳ねるバー (上昇は一瞬、 下降は ~0.5s でフェード)
  state.inPeakBounce  = Math.max((state.inPeakBounce  || 0) * 0.93, peak);
  state.outPeakBounce = Math.max((state.outPeakBounce || 0) * 0.93, opeak);
  state.peakRaw = peak;
  state.peakSmooth = state.peakSmooth * 0.82 + peak * 0.18;
  state.inPeak = peak;
  state.outPeak = opeak;
  // peak hold
  const now = performance.now();
  if (peak >= state.inPeakHold) { state.inPeakHold = peak; state.lastInPeak = now; }
  if (now - state.lastInPeak > 800) state.inPeakHold *= 0.96;
  if (opeak >= state.outPeakHold) { state.outPeakHold = opeak; state.lastOutPeak = now; }
  if (now - state.lastOutPeak > 800) state.outPeakHold *= 0.96;

  // ── 音割れ (clip) 検知: 出力ピーク 0.985 以上 = 0 dBFS 寸前 ──
  // 検知時に「ガラスにヒビ」演出を発動 (連続クリップでもチカチカしないよう 250ms クールダウン)
  const CLIP_THRESH = 0.985;
  if (opeak >= CLIP_THRESH && now - (state.lastClipAt || 0) > 250) {
    state.lastClipAt = now;
    state.clipUntil = now + 850;
    state.clipStrength = Math.min(1, Math.max(0.4, (opeak - CLIP_THRESH) / 0.015));
    const cw = canvas.parentElement ? canvas.parentElement.offsetWidth : 800;
    const ch = canvas.parentElement ? canvas.parentElement.offsetHeight : 400;
    const ox = cw * (0.18 + Math.random() * 0.64);
    const oy = ch * (0.18 + Math.random() * 0.64);
    state.cracks = generateCrackPaths(ox, oy, state.clipStrength, cw, ch);
  }

  // 検出器 (detectorComp) の reduction を読み、 主経路の grNode に適用 (神コンプ品質: SC HPF 対応)
  // GR の平滑化を弱める (旧 0.85/0.15 = 110ms 遅延 → 新 0.55/0.45 = 30ms 遅延)
  if (detectorComp && !state.bypass) {
    const rawGr = Math.abs(detectorComp.reduction || 0);
    state.gr = state.gr * 0.55 + rawGr * 0.45;
    // grNode.gain = 10^(reduction/20)、 reduction は負の dB なので linear < 1
    const grLinear = Math.pow(10, (detectorComp.reduction || 0) / 20);
    if (grNode) grNode.gain.setTargetAtTime(grLinear, ctx.currentTime, 0.003);
  } else {
    state.gr *= 0.55;
    if (grNode) grNode.gain.setTargetAtTime(1, ctx.currentTime, 0.005);
  }

  // attack burst
  const isBurst = (peak > state.peakSmooth + 0.18) && (peak > 0.3) && (now - state.lastAttackBurstAt > 70);
  if (isBurst) { state.lastAttackBurstAt = now; state.attackBurstStrength = peak; }
  // climax
  const cTarget = state.gr > 3 ? Math.min(1, (state.gr - 3) / 7) : 0;
  state.climaxLevel = state.climaxLevel * 0.9 + cTarget * 0.1;
  state.coreEnergy *= 0.94;
}

const CORE_R = 18;

function drawWindow() {
  readAudio();
  // ── 吐息: GR が急減した瞬間 (compressor が圧縮を解いた瞬間) に出射側へ金色蒸気 ──
  //   ring が「ふぅ」 と圧縮を逃した感覚を視覚化
  if ((state.grVelSmooth || 0) < -0.25 && (state.grPeak || 0) > 1.5) {
    state.lastExhaleAt = state.lastExhaleAt || 0;
    const now0 = performance.now();
    if (now0 - state.lastExhaleAt > 180) {     // チカチカ防止
      state.lastExhaleAt = now0;
      const w0 = canvas.parentElement ? canvas.parentElement.offsetWidth : 800;
      const h0 = canvas.parentElement ? canvas.parentElement.offsetHeight : 400;
      const cx0 = w0 / 2, cy0 = h0 / 2;
      // ring の出射側 (右) に金色 spark を 3-5 個
      const angle = state.ringAngle || 0;
      const ax0 = Math.cos(angle), ay0 = Math.sin(angle);
      const thRatio = (state.threshold + 50) / 50;
      const ringR0 = Math.min(w0, h0) * (0.10 + thRatio * 0.32);
      const ex = cx0 + ax0 * (ringR0 + 8);
      const ey = cy0 + ay0 * (ringR0 + 8);
      spawnSpark(ex, ey, 1.5 + (state.grPeak || 0) * 0.2, { r: 250, g: 220, b: 165 });
    }
  }
  // ── grPeak: ピーク GR を release time で純粋減衰 (release 余韻を視覚化) ──
  // state.gr 自体も release で下がるが、 grPeak は「直前のピーク」 を release time でカウントダウン
  // → フレーズ間の静寂で「圧縮の余韻」 が release time だけ続くのが見える
  // (drawWindow に置いて ctx 無くても更新される)
  {
    const dt = 1 / 60;
    const tauR = Math.max(0.03, (state.release || 200) / 1000);
    const decay = Math.exp(-dt / tauR);
    state.grPeak = Math.max((state.grPeak || 0) * decay, state.gr || 0);
  }
  applyKnobStatus();

  const w = _canvasW || canvas.parentElement.offsetWidth;
  const h = _canvasH || canvas.parentElement.offsetHeight;
  if (w <= 0 || h <= 0) { requestAnimationFrame(drawWindow); return; }
  cctx.clearRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const now = performance.now();

  // 物理は水平 (左→右) 固定。 視覚回転は canvas 全体で行う
  const ax = 1, ay = 0;
  const tx = 0, ty = 1;
  const angle = state.ringAngle || 0;   // 視覚的な回転角 (ドラッグで操作)

  // ── スレッショルド = 輪っかの大きさ (低いほど縮む = ブラックホール) ──
  const thRatio01 = (state.threshold + 50) / 50;     // 0=黒洞 / 1=広い
  const ringR    = Math.min(w, h) * (0.10 + thRatio01 * 0.32);
  // 段階 1: ratio=1 で holeR = ringR (素通り、 funnel ゼロ)、 ratio 大で穴が狭まる
  const holeR    = ringR * Math.max(0.06, 1 - (state.ratio - 1) * 0.075);
  const muLin    = Math.pow(10, state.makeup / 20);
  const audioGlow = Math.min(1.5, state.outLevel * muLin);

  // ── PC画面全体の外背景輝きを更新 (静寂時もうっすら見える) ──
  // ベースグロー (常時うっすら) + 出力連動の追加グロー + release 時間の余韻
  const baseGlow = 0.18 + 0.06 * Math.sin(now * 0.0008);   // 緩やかな呼吸
  const targetGlow = Math.max(baseGlow, audioGlow * 1.2);
  // 立ち上がりは速く (attack)、 減衰は release 時間で遅く → フレーズ間の静寂で release が見える
  // release が長いほど画面がゆっくり暗くなる、 短いほどパチンと暗くなる
  const isRising = targetGlow > state.bgGlow;
  if (isRising) {
    state.bgGlow = state.bgGlow * 0.78 + targetGlow * 0.22;   // 立ち上がり: 既存より速め
  } else {
    // 減衰: release ms に応じた tau で fade (60fps)
    const tauR = Math.max(0.05, (state.release || 200) / 1000);
    const decay = Math.exp(-(1 / 60) / tauR);
    state.bgGlow = Math.max(targetGlow, state.bgGlow * decay);
  }
  document.documentElement.style.setProperty('--ext-glow', state.bgGlow.toFixed(3));

  // ── shake (出力レベル + GR overshoot) ──
  const overshoot = state.gr > 6 ? Math.min(1, (state.gr - 6) / 6) : 0;
  const shakeAmt = Math.min(1.0, state.outLevel * 4);
  const ssx = (Math.random() - 0.5) * shakeAmt * (1 + overshoot * 0.5);
  const ssy = (Math.random() - 0.5) * shakeAmt * (1 + overshoot * 0.5);
  cctx.save();
  // ── 画面全体を ringAngle で回転 (背景・粒子・リング・ラベル すべてが一緒に回る) ──
  cctx.translate(cx + ssx, cy + ssy);
  cctx.rotate(angle);
  cctx.translate(-cx, -cy);

  // ── canvas 内の背景 (壮大な輝き、 静寂時もうっすら) ──
  // 背景は rotate(angle) 後に描かれるので、 回転で角に余白が出ないよう拡張領域 (overhang) で塗る
  // 15° rotation の場合、 必要 overhang ≈ max(w,h) * sin(15°) ≈ 0.26 → 余裕を見て 0.30
  const overhang = Math.max(w, h) * 0.30;
  const oxL = -overhang, oyT = -overhang;
  const oW  = w + overhang * 2, oH = h + overhang * 2;
  // ベース: 深い夜空 (前のフレームを完全に消さない、 残像で滑らかに)
  cctx.fillStyle = 'rgba(2, 6, 14, 0.92)';
  cctx.fillRect(oxL, oyT, oW, oH);
  // 上下のグラデーション (回転後の長辺をカバー)
  const skyGrad = cctx.createLinearGradient(0, oyT, 0, oyT + oH);
  skyGrad.addColorStop(0,   `rgba(20, 60, 90, ${0.20 + audioGlow * 0.15})`);
  skyGrad.addColorStop(0.5, `rgba(8, 24, 36, ${0.12 + audioGlow * 0.10})`);
  skyGrad.addColorStop(1,   `rgba(2, 8, 14, 0.20)`);
  cctx.fillStyle = skyGrad;
  cctx.fillRect(oxL, oyT, oW, oH);
  // 中央放射光 (常時うっすら + 出力連動で爆発的に強くなる)
  const visBaseGlow = 0.18 + audioGlow * 1.0;
  const bgRange = w * 0.95;
  const bgGrad = cctx.createRadialGradient(cx, cy, 0, cx, cy, bgRange);
  bgGrad.addColorStop(0,    `rgba(255, 230, 170, ${Math.min(0.85, visBaseGlow * 0.6)})`);
  bgGrad.addColorStop(0.20, `rgba(245, 216, 150, ${Math.min(0.50, visBaseGlow * 0.35)})`);
  bgGrad.addColorStop(0.50, `rgba(64, 206, 180, ${Math.min(0.25, visBaseGlow * 0.18)})`);
  bgGrad.addColorStop(0.85, `rgba(40, 80, 120, ${Math.min(0.10, visBaseGlow * 0.08)})`);
  bgGrad.addColorStop(1,    'rgba(0, 0, 0, 0)');
  cctx.fillStyle = bgGrad;
  cctx.fillRect(oxL, oyT, oW, oH);
  // 星屑 (拡張領域に分散、 回転後も画面端まで星が見える)
  for (let i = 0; i < 36; i++) {
    const sxr = oxL + (Math.sin(now * 0.00012 + i * 7.3) * 0.5 + 0.5) * oW;
    const syr = oyT + (Math.cos(now * 0.00009 + i * 4.1) * 0.5 + 0.5) * oH;
    const tw = 0.5 + 0.4 * Math.sin(now * 0.003 + i * 1.7);
    cctx.fillStyle = `rgba(245, 240, 230, ${tw.toFixed(2)})`;
    cctx.fillRect(sxr, syr, 1.6, 1.6);
  }

  // ── 楽曲データから粒子を生成 (更に半減、 渋滞ゼロを目指す) ──
  if (state.playing && state.inLevel > 0.005) {
    // 1フレームあたり 0.5-2.5 個 (確率で 1 個生成、 inLevel 高い時は最大 2 個)
    const spawnRate = 0.5 + state.inLevel * 1.5;
    if (Math.random() < spawnRate) {
      const a = Math.max(0.08, state.inLevel * (0.4 + Math.random() * 0.6));
      if (particles.length < MAX_PARTICLES) spawnParticle(a, 0);
      // 追加で 1 個 (高 inLevel 時のみ)
      if (state.inLevel > 0.4 && Math.random() < state.inLevel) {
        if (particles.length < MAX_PARTICLES) spawnParticle(a * 0.9, 0);
      }
    }
    // アタックバースト時のみ + 1〜2個
    if (now - state.lastAttackBurstAt < 100) {
      const burstAmp = state.attackBurstStrength;
      const n = 1 + Math.floor(burstAmp * 1);
      for (let i = 0; i < n; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        spawnParticle(burstAmp * (0.85 + Math.random() * 0.35), 0);
      }
    }
  } else {
    // 静寂時: 極稀に
    if (Math.random() < 0.015) spawnParticle(0.04 + Math.random() * 0.06, 0);
  }

  // (入射ビームの薄い四角形は廃止 — 粒子の流れだけで方向を表現)

  // ── 粒子の引力 + 状態遷移 ──
  // attack ms 連動: 引力の立ち上がり時定数 (短いほど一気に吸い込む)
  const attackFactor = Math.max(0.04, Math.min(0.40, 60 / Math.max(5, state.attack)));
  // release ms 連動: 出射後の寿命減衰 (短いほどすぐ消える)
  const releaseDecay = 0.985 + Math.min(0.012, state.release / 60000);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const dx = p.x - cx, dy = p.y - cy;
    const dist = Math.sqrt(dx*dx + dy*dy) || 0.001;

    if (p.phase === 'approach') {
      const along = -ax * dx + -ay * dy;     // > 0 = 入射側 (左)、 < 0 = 出射側 (右)
      const perp  =  tx * dx +  ty * dy;     // 中心軸からの横ずれ

      // ── 段階 1+2: コンプ伝達関数 × 距離の逆二乗則 × GR エンベロープ ──
      //   3 軸の合成で funnel を駆動:
      //     (1) ratio = 伝達関数の傾き (compressed = holeR + excess/ratio)
      //     (2) proximity² = 円との距離 (作用源としての物理: 重力場・磁場と同じ逆二乗則)
      //     (3) grEnvNorm = state.gr / 12 = 実際にコンプが効いてる量 (Attack/Release で変動)
      //   ──────────────────────────────────────────────
      //   Attack 速い: state.gr が即立ち上がる → funnel 瞬時に効く
      //   Attack 遅い: state.gr ゆっくり → 最初の粒子は素通り、 後から効く (= トランジェント抜け)
      //   Release 速い: 信号止むと funnel 即消失
      //   Release 遅い: 信号止んでも funnel 残る (= 余韻)
      //   ──────────────────────────────────────────────
      //   位置のみ修正 (速度には触らない) → 上下に暴れない、 渋滞ゼロ
      if (along > 0 && along < ringR) {
        const r = Math.max(1, state.ratio);
        const allowedHole = holeR * 0.95;
        const proximity = 1 - along / ringR;        // 0=ring エッジ, 1=ring 中央
        const grEnvNorm = Math.min(1, Math.max(0, state.gr / 12));   // 0..1
        const funnelFactor = proximity * proximity * grEnvNorm;
        const absPerp = Math.abs(perp);
        if (absPerp > allowedHole) {
          const excess = absPerp - allowedHole;
          const compressedAbs = allowedHole + excess / r;
          const targetAbs = absPerp * (1 - funnelFactor) + compressedAbs * funnelFactor;
          const newPerp = Math.sign(perp || 1) * targetAbs;
          p.x = cx + (-ax) * along + tx * newPerp;
          p.y = cy + (-ay) * along + ty * newPerp;
        }
      }
      // 沿軸方向の流速は維持 (摩擦ゼロ → 流体の連続の式: 一定速度で流れる)
      // 旧版で p.vx *= 0.9985 していたのが渋滞の原因 (減速 → 密度上昇 → 通過待ち)

      // 中心 (along = 0) を通過したら emerging に切り替え (位置はワープしない、 連続性維持)
      if (along < 0 && p.crossedAt === 0) {
        // ratio 高い時のみ、 大粒子をリミッター的に弾く
        const ampThresh = Math.pow(10, state.threshold / 20);
        const isLargeOverThresh = (p.amp > ampThresh);
        const rejectProb = (state.ratio >= 5 && isLargeOverThresh)
          ? Math.min(0.45, (state.ratio - 4) * 0.10)
          : 0;
        if (rejectProb > 0 && Math.random() < rejectProb) {
          p.phase = 'rejected';
          p.crossedAt = now;
          p.vx = -p.vx * (0.6 + Math.random() * 0.3);
          p.vy = -p.vy * (0.6 + Math.random() * 0.3) + (Math.random() - 0.5) * 0.4;
          p.alpha *= 0.7; p.life *= 0.85;
          if (Math.random() < 0.5) {
            const aColor_ = ATTACK_COLORS[statusOf('attack', state.attack)] || { r: 230, g: 110, b: 95 };
            spawnSpark(p.x, p.y, 2 + state.ratio * 0.3, aColor_);
          }
        } else {
          // 通過: 位置はそのまま、 phase だけ切替 (連続性)
          p.phase = 'emerging';
          p.crossedAt = now;
          // 速度は変えない (連続の式: 流入=流出 で渋滞ゼロ)
          // ── 圧縮エネルギーの解放は速度ではなく「太さ・閃光・熱」で表現 ──
          // 密度up: 「元の spawn perp」 ÷ 「通過時 perp」 = 何倍に圧縮されたか
          //   ratio=1 (圧縮ゼロ) で 比率=1 → boost ゼロ
          //   ratio 高いほど通過時 perp が小さく → 比率大 → boost 大
          const originalPerp = Math.abs(p.spawnPerp || perp);
          const currentPerp = Math.max(1, Math.abs(perp));
          const compressionRatio = Math.max(1, originalPerp / currentPerp);
          const densityBoost = Math.min(2.5, 1 + (compressionRatio - 1) * 0.35);
          p.r *= densityBoost * (0.95 + Math.min(2.0, muLin) * 0.20);
          p.alpha = Math.min(0.98, p.alpha * (0.92 + Math.min(0.4, (densityBoost - 1) * 0.3)));
          // 通過の閃光 (圧縮されたエネルギーの解放)
          if (compressionRatio > 1.5 && Math.random() < 0.25) {
            spawnSpark(p.x, p.y, 0.6 + state.ratio * 0.15,
                       { r: 245, g: 216, b: 150 });
          }
        }
      }
    }
    if (p.phase === 'emerging') {
      // 通過後は出射軸方向に真っ直ぐ (上下に動かない)
      // 速度は通過時のまま維持 (連続性 = 渋滞ゼロ)
      const proj = p.vx * ax + p.vy * ay;
      p.vx = ax * Math.max(0.6, proj);   // 後退しないよう最低限のみ
      p.vy = ay * Math.max(0.6, proj);
      // ★ Release 連動の寿命減衰: 短い = 帯短い、 長い = 帯長い (緩やかに)
      const relF = state.release / 200;
      const decay = Math.min(0.99988, 0.9985 + relF * 0.0010);
      p.life *= decay;
    }
    if (p.phase === 'rejected') {
      p.vx *= 0.96; p.vy *= 0.96;
      p.life *= 0.92;
    }

    // motion trail のための旧位置記録 (位置更新の前に保存)
    p.prevX = p.x; p.prevY = p.y;
    // 位置更新 + 寿命減衰 (ロングテール: 端から端までしっかり生きる)
    p.x += p.vx; p.y += p.vy;
    p.life *= 0.9998;

    // 削除条件 (画面外マージン拡大 — 右端ぎりぎりまで届かせてから消す)
    if (p.life < 0.04 ||
        p.x < -120 || p.x > w + 200 ||
        p.y < -160 || p.y > h + 160) {
      // 出射粒子が画面外まで届いたら出力に貢献
      if (p.phase === 'emerging') {
        state.coreEnergy = Math.min(2.5, state.coreEnergy + 0.02 + p.amp * 0.04);
      }
      particles.splice(i, 1);
      continue;
    }

    // 描画色: phase ごと (色相シフトで彩り豊か)
    let cr_, cg_, cb_, glowSize;
    if (p.phase === 'rejected') {
      cr_ = 230; cg_ = 110; cb_ = 95;  glowSize = 8;
    } else if (p.phase === 'emerging') {
      // muLin = 1 (0dB) で 0、 muLin = 1.41 (+3dB) でサチュ (1) → 実用域で熱が乗る
      const heat = Math.min(1, (muLin - 1) * 2.4);
      cr_ = 250 + 5 * heat;
      cg_ = 230 - 8 * heat;
      cb_ = 170 - 30 * heat;
      // muLin = 1 (0dB) で 9、 muLin = 1.41 (+3dB) で 18 (=ほぼサチュ)
      glowSize = 9 + Math.min(10, (muLin - 1) * 22);
    } else {
      // approach (入射) phase: 入力の周波数特性で色相が変わる
      //   低域多 (bass) → 紫がかった青
      //   中域多 (vocal/mid) → 暖かい黄
      //   高域多 (treble/sparkle) → 鮮やかなシアン
      const t0 = Math.max(0, Math.min(1, 1 - dist / (ringR * 2.5)));
      let baseR = 180 + 65 * t0;
      let baseG = 220 - 5 * t0;
      let baseB = 250 - 100 * t0;
      const bR = state.bassRatio || 0.33;
      const mR = state.midRatio || 0.33;
      const tR = state.trebleRatio || 0.33;
      const dom = Math.max(bR, mR, tR);
      const tintK = Math.max(0, Math.min(0.65, (dom - 0.33) * 1.6));
      if (bR === dom && tintK > 0) {
        // 紫寄り
        baseR = baseR + (205 - baseR) * tintK;
        baseG = baseG + (140 - baseG) * tintK;
        baseB = baseB + (250 - baseB) * tintK;
      } else if (tR === dom && tintK > 0) {
        // シアン寄り
        baseR = baseR + (115 - baseR) * tintK;
        baseG = baseG + (235 - baseG) * tintK;
        baseB = baseB + (245 - baseB) * tintK;
      } else if (mR === dom && tintK > 0) {
        // 暖色 (黄寄り)
        baseR = baseR + (250 - baseR) * tintK;
        baseG = baseG + (215 - baseG) * tintK;
        baseB = baseB + (140 - baseB) * tintK;
      }
      cr_ = baseR;
      cg_ = baseG;
      cb_ = baseB;
      glowSize = 6 + t0 * 6;
    }
    // 各粒子の色相シフト (-12〜+12 度相当の RGB 微調整)
    const hs = p.hueShift || 0;
    cr_ = Math.max(0, Math.min(255, cr_ + hs * 1.5));
    cb_ = Math.max(0, Math.min(255, cb_ - hs * 1.2));
    // 脈動 (呼吸): サイズが微妙に揺らぐ
    const pulse = 1 + 0.18 * Math.sin(now * 0.012 + (p.pulsePhase || 0));
    const radius = p.r * pulse;
    const renderAlpha = (p.phase === 'rejected')
      ? p.alpha * p.life
      : p.alpha * Math.max(0.7, p.life);

    // ─── 1. 流光の尾 (motion trail) ───
    if (p.prevX != null && p.phase !== 'rejected') {
      const tdx = p.x - p.prevX, tdy = p.y - p.prevY;
      const tlen = Math.sqrt(tdx * tdx + tdy * tdy);
      if (tlen > 0.4) {
        cctx.strokeStyle = `rgba(${cr_|0},${cg_|0},${cb_|0},${(renderAlpha * 0.45).toFixed(3)})`;
        cctx.lineWidth = radius * 0.85;
        cctx.lineCap = 'round';
        cctx.beginPath();
        cctx.moveTo(p.prevX, p.prevY);
        cctx.lineTo(p.x, p.y);
        cctx.stroke();
      }
    }
    // ─── 2. 外側のハロー (ふわっとした光輪) ───
    cctx.fillStyle = `rgba(${cr_|0},${cg_|0},${cb_|0},${(renderAlpha * 0.30).toFixed(3)})`;
    cctx.shadowColor = `rgba(${cr_|0},${cg_|0},${cb_|0},0.9)`;
    cctx.shadowBlur = glowSize * 1.6;
    cctx.beginPath();
    cctx.arc(p.x, p.y, radius * 1.7, 0, Math.PI * 2);
    cctx.fill();
    // ─── 3. 中核 (鮮明な光) ───
    cctx.fillStyle = `rgba(${cr_|0},${cg_|0},${cb_|0},${renderAlpha.toFixed(3)})`;
    cctx.shadowBlur = glowSize;
    cctx.beginPath();
    cctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    cctx.fill();
    // ─── 4. 中心の白い核 (一番鮮明) ───
    if (p.phase !== 'rejected' && radius > 1.0) {
      cctx.fillStyle = `rgba(255, 250, 230, ${(renderAlpha * 0.80).toFixed(3)})`;
      cctx.shadowBlur = 0;
      cctx.beginPath();
      cctx.arc(p.x, p.y, radius * 0.45, 0, Math.PI * 2);
      cctx.fill();
    }
    // ─── 5. Attack 印 — 「立ち上がりの瞬間に通った粒子」 を赤コロナで識別 ───
    //   spawn 時に attackEngaged が立った粒子のみ。 lifetime 経過で fade out
    if (p.attackEngaged && p.phase === 'emerging') {
      const attackAge = (now - p.bornAt) / 800;   // 800ms で fade out
      const attackFade = Math.max(0, 1 - attackAge);
      if (attackFade > 0.05) {
        cctx.strokeStyle = `rgba(255, 110, 80, ${(renderAlpha * 0.85 * attackFade).toFixed(3)})`;
        cctx.lineWidth = 1.4;
        cctx.shadowColor = 'rgba(255, 90, 60, 0.9)';
        cctx.shadowBlur = 8 * attackFade;
        cctx.beginPath();
        cctx.arc(p.x, p.y, radius * 1.55, 0, Math.PI * 2);
        cctx.stroke();
      }
    }
  }
  cctx.shadowBlur = 0;

  // ── Attack / Release バー (左右 2 本に分割) ──
  //   ATTACK バー  : ring 左側、 長さ = Attack 値 (log scale)、 赤系
  //   RELEASE バー : ring 右側、 長さ = Release 値 (log scale)、 青系
  //   バーの長さ = つまみの値 (時間)、 発光 = いま効いてる量 (state.gr / grVelocity)
  //   常に薄く見える (設定ガイド) + engaging 時に強発光
  {
    const grEnvNorm = Math.min(1, Math.max(0, state.gr / 12));
    const grPeakNorm = Math.min(1, Math.max(0, (state.grPeak || 0) / 12));   // 余韻 (release で減衰)
    state.grPrev = state.grPrev || 0;
    const grVelRaw = state.gr - state.grPrev;
    state.grPrev = state.gr;
    state.grVelSmooth = (state.grVelSmooth || 0) * 0.65 + grVelRaw * 0.35;
    const velNorm = Math.max(-1, Math.min(1, state.grVelSmooth * 2.5));
    const attackEngage  = Math.max(0,  velNorm);   // 0..1, gr 立ち上がり中
    const releaseEngage = Math.max(0, -velNorm);   // 0..1, gr 減衰中
    // Release 余韻量: grPeak が gr より高い差分 = 「すでにピーク過ぎたが release 中の量」
    const releaseAfterglow = Math.max(0, grPeakNorm - grEnvNorm);   // 0..1

    const allowedHole = holeR * 0.95;
    const maxBarLen = ringR * 1.55;
    // 長さは時間の log scale (Attack 1..1000ms, Release 10..2000ms → 0..1)
    const attackBarLen  = maxBarLen * Math.max(0.06, Math.log10(Math.max(1,  state.attack))      / Math.log10(1000));
    const releaseBarLen = maxBarLen * Math.max(0.06, Math.log10(Math.max(10, state.release) / 10) / Math.log10(200));

    const baseOp = state.bypass ? 0.18 : 0.32;
    const attackOpacity  = Math.min(0.95, baseOp + grEnvNorm * 0.30 + attackEngage  * 0.45);
    // RELEASE バーは「現在の gr」 + 「release 余韻」 (grPeak で release time だけ持続)
    // → フレーズ間の静寂で release time だけ青い壁が残る = release 時間が見える
    const releaseOpacity = Math.min(0.95, baseOp + grEnvNorm * 0.20 + releaseEngage * 0.35 + releaseAfterglow * 0.55);

    // ── ATTACK バー (赤系、 ring の左) ──
    cctx.save();
    cctx.shadowColor = 'rgba(255, 100, 60, 0.9)';
    cctx.shadowBlur = 8 + grEnvNorm * 12 + attackEngage * 18;
    // 外側オーラ
    cctx.strokeStyle = `rgba(255, 130, 90, ${attackOpacity * 0.45})`;
    cctx.lineWidth = 7 + attackEngage * 3;
    cctx.beginPath();
    cctx.moveTo(cx - attackBarLen, cy - allowedHole);
    cctx.lineTo(cx,                cy - allowedHole);
    cctx.moveTo(cx - attackBarLen, cy + allowedHole);
    cctx.lineTo(cx,                cy + allowedHole);
    cctx.stroke();
    // 内側くっきり線
    cctx.strokeStyle = `rgba(255, 145, 105, ${attackOpacity})`;
    cctx.lineWidth = 2.4 + attackEngage * 1.2;
    cctx.shadowBlur = (8 + grEnvNorm * 12 + attackEngage * 18) * 0.4;
    cctx.beginPath();
    cctx.moveTo(cx - attackBarLen, cy - allowedHole);
    cctx.lineTo(cx,                cy - allowedHole);
    cctx.moveTo(cx - attackBarLen, cy + allowedHole);
    cctx.lineTo(cx,                cy + allowedHole);
    cctx.stroke();
    // ラベル "ATTACK 20 ms" (大きく)
    cctx.shadowBlur = 6;
    cctx.fillStyle = `rgba(255, 165, 130, ${Math.min(1, attackOpacity * 1.3 + 0.15)})`;
    cctx.font = "600 16px 'Cinzel', serif";
    cctx.textAlign = 'left';
    cctx.textBaseline = 'alphabetic';
    cctx.fillText(`ATTACK  ${state.attack | 0} ms`, cx - attackBarLen + 2, cy - allowedHole - 12);
    cctx.restore();

    // ── RELEASE バー (青系、 ring の右) ──
    cctx.save();
    cctx.shadowColor = 'rgba(80, 150, 255, 0.9)';
    cctx.shadowBlur = 8 + grEnvNorm * 12 + releaseEngage * 18;
    cctx.strokeStyle = `rgba(110, 175, 255, ${releaseOpacity * 0.45})`;
    cctx.lineWidth = 7 + releaseEngage * 3;
    cctx.beginPath();
    cctx.moveTo(cx,                 cy - allowedHole);
    cctx.lineTo(cx + releaseBarLen, cy - allowedHole);
    cctx.moveTo(cx,                 cy + allowedHole);
    cctx.lineTo(cx + releaseBarLen, cy + allowedHole);
    cctx.stroke();
    cctx.strokeStyle = `rgba(135, 195, 255, ${releaseOpacity})`;
    cctx.lineWidth = 2.4 + releaseEngage * 1.2;
    cctx.shadowBlur = (8 + grEnvNorm * 12 + releaseEngage * 18) * 0.4;
    cctx.beginPath();
    cctx.moveTo(cx,                 cy - allowedHole);
    cctx.lineTo(cx + releaseBarLen, cy - allowedHole);
    cctx.moveTo(cx,                 cy + allowedHole);
    cctx.lineTo(cx + releaseBarLen, cy + allowedHole);
    cctx.stroke();
    // ラベル "200 ms RELEASE" (右寄せ)
    cctx.shadowBlur = 6;
    cctx.fillStyle = `rgba(165, 210, 255, ${Math.min(1, releaseOpacity * 1.3 + 0.15)})`;
    cctx.font = "600 16px 'Cinzel', serif";
    cctx.textAlign = 'right';
    cctx.textBaseline = 'alphabetic';
    const relMs = state.release | 0;
    const relLabel = relMs >= 1000 ? `${(relMs / 1000).toFixed(1)} s  RELEASE` : `${relMs} ms  RELEASE`;
    cctx.fillText(relLabel, cx + releaseBarLen - 2, cy - allowedHole - 12);
    cctx.restore();
  }

  // ── 多重軌道環 (3 重の orbital が異なる速度で回転、 「魔導機械」 の精密感) ──
  //   ring 描画の前に描いて、 ring が orbital の上に乗るレイヤー構造に
  {
    cctx.save();
    cctx.translate(cx, cy);
    const orbitConfig = [
      { rMul: 1.32, speed:  0.00030, dotN: 24, color: '245,216,150', op: 0.20, dotEvery: 4 },
      { rMul: 1.48, speed: -0.00018, dotN: 36, color: '64,206,180',  op: 0.16, dotEvery: 6 },
      { rMul: 1.66, speed:  0.00010, dotN: 12, color: '245,216,150', op: 0.10, dotEvery: 3 },
    ];
    for (const o of orbitConfig) {
      const r = ringR * o.rMul;
      const ang = now * o.speed;
      cctx.save();
      cctx.rotate(ang);
      // 主環
      cctx.strokeStyle = `rgba(${o.color}, ${o.op})`;
      cctx.lineWidth = 0.7;
      cctx.shadowBlur = 0;
      cctx.beginPath();
      cctx.arc(0, 0, r, 0, Math.PI * 2);
      cctx.stroke();
      // 環上のドット (大小混在で天体観測儀的に)
      for (let i = 0; i < o.dotN; i++) {
        const a = (i / o.dotN) * Math.PI * 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        const isMajor = (i % o.dotEvery === 0);
        const sz = isMajor ? 1.8 : 0.7;
        const dotOp = isMajor ? o.op * 2.4 : o.op * 1.2;
        cctx.fillStyle = `rgba(${o.color}, ${Math.min(0.55, dotOp)})`;
        cctx.shadowColor = `rgba(${o.color}, 0.6)`;
        cctx.shadowBlur = isMajor ? 4 : 0;
        cctx.beginPath();
        cctx.arc(px, py, sz, 0, Math.PI * 2);
        cctx.fill();
      }
      cctx.restore();
    }
    cctx.restore();
  }

  // ── 輪っかの描画 (楕円、 法線方向に向ける) ──
  cctx.save();
  cctx.translate(cx, cy);
  cctx.rotate(Math.PI / 2);  // 楕円の主軸 (縦長) で穴を表現。 全画面回転は外側で適用済み
  cctx.scale(1, 0.42);

  // ── ring を「生きている」 ように描く ──
  //   呼吸: 緩やかな sin pulse (常時)
  //   心拍: 低域 (bass) のパルスで一段強く膨らむ
  //   温度: GR 量で色相シフト (金色 → 赤熱)
  //   瞬き: 静寂時に稀にチカッと光る
  const bassPulse = (state.bassLevel || 0) * 0.05;
  const ringPulse = 1 + 0.04 * Math.sin(now * 0.003) + state.gr * 0.012 + bassPulse;
  // 温度: gr 0 → 金色, gr 6 → 暖かい黄, gr 12+ → 赤熱
  const grHeat = Math.min(1, state.gr / 10);
  const ringR_c = Math.round(245 + (255 - 245) * grHeat);
  const ringG_c = Math.round(216 + (110 - 216) * grHeat);
  const ringB_c = Math.round(150 + (80  - 150) * grHeat);
  // 瞬き: 静寂時に稀にチカッ
  if (!state.ringBlinkUntil) state.ringBlinkUntil = 0;
  if ((state.inLevel || 0) < 0.02 && Math.random() < 0.0012 && now > state.ringBlinkUntil) {
    state.ringBlinkUntil = now + 280;
  }
  const blinkBoost = (state.ringBlinkUntil > now)
    ? Math.max(0, (state.ringBlinkUntil - now) / 280)   // 0..1 fade-out
    : 0;
  // 外周リング
  cctx.strokeStyle = `rgba(${ringR_c}, ${ringG_c}, ${ringB_c}, ${0.55 + audioGlow * 0.3 + blinkBoost * 0.3})`;
  cctx.lineWidth = 5 + grHeat * 1.5 + blinkBoost * 1.5;
  cctx.shadowColor = `rgba(${ringR_c}, ${ringG_c}, ${ringB_c}, ${0.8 + blinkBoost * 0.2})`;
  cctx.shadowBlur = 18 + audioGlow * 26 + grHeat * 14 + blinkBoost * 18;
  cctx.beginPath();
  cctx.arc(0, 0, ringR * ringPulse, 0, Math.PI * 2);
  cctx.stroke();

  // 内周 (穴 = ratio で狭くなる)
  cctx.shadowBlur = 0;
  cctx.strokeStyle = `rgba(64, 206, 180, ${0.65 + state.gr * 0.025})`;
  cctx.lineWidth = 2;
  cctx.beginPath();
  cctx.arc(0, 0, holeR, 0, Math.PI * 2);
  cctx.stroke();

  // 穴の中はうっすらだけ暗くする (粒子を見えなくしないように)
  const holeGrad = cctx.createRadialGradient(0, 0, 0, 0, 0, holeR);
  holeGrad.addColorStop(0, 'rgba(0, 0, 0, 0.10)');
  holeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  cctx.fillStyle = holeGrad;
  cctx.beginPath();
  cctx.arc(0, 0, holeR, 0, Math.PI * 2);
  cctx.fill();

  // 多重リング (ratio が強い時の壁の厚さ)
  if (state.ratio > 4.5) {
    cctx.strokeStyle = `rgba(245, 216, 150, 0.25)`;
    cctx.lineWidth = 1;
    cctx.beginPath();
    cctx.arc(0, 0, ringR * 1.10, 0, Math.PI * 2);
    cctx.stroke();
  }
  if (state.ratio > 7.5) {
    cctx.strokeStyle = `rgba(245, 216, 150, 0.18)`;
    cctx.beginPath();
    cctx.arc(0, 0, ringR * 1.18, 0, Math.PI * 2);
    cctx.stroke();
  }

  cctx.restore();

  // ── 保護リミッターの紋章 (8 方位コンパスローズ) ──
  //   4 cardinal (12/3/6/9 時): 大きな菱形の宝玉
  //   4 diagonal (1.30/4.30/7.30/10.30 時): 小さな 4 点星 ✦
  //   ring 中心へ向かう細い光線 + 8 玉を結ぶ薄い円弧
  //   出力 peak がハードクリッパ閾値に近づくと全体が脈動して赤熱する
  if (state.protectLimit) {
    cctx.save();
    const limitTrigger = Math.max(0, ((state.outPeak || 0) - 0.78) / 0.17);
    const limitGlow = Math.min(1, limitTrigger);
    const crestPulse = 0.5 + 0.3 * Math.sin(now * 0.0024) + limitGlow * 0.6;
    const crestR = ringR * 1.16;
    cctx.translate(cx, cy);
    for (let k = 0; k < 8; k++) {
      const a = -Math.PI / 2 + k * (Math.PI / 4);
      const isCardinal = (k % 2 === 0);   // 0,2,4,6 = N/E/S/W = 大きな菱形
      const px = Math.cos(a) * crestR;
      const py = Math.sin(a) * crestR;
      // 中心へ向かう光線 (cardinal は太め)
      cctx.strokeStyle = `rgba(255, 235, 180, ${0.10 + crestPulse * (isCardinal ? 0.20 : 0.10)})`;
      cctx.lineWidth = (isCardinal ? 0.7 : 0.4) + limitGlow * 0.8;
      cctx.shadowColor = 'rgba(245, 216, 150, 0.6)';
      cctx.shadowBlur = 4 + limitGlow * 10;
      cctx.beginPath();
      cctx.moveTo(px * (isCardinal ? 0.85 : 0.92), py * (isCardinal ? 0.85 : 0.92));
      cctx.lineTo(px * (isCardinal ? 0.55 : 0.70), py * (isCardinal ? 0.55 : 0.70));
      cctx.stroke();
      // 紋章本体: cardinal=菱形、 diagonal=4点星
      cctx.save();
      cctx.translate(px, py);
      if (isCardinal) {
        // 菱形 (大きめ)
        cctx.rotate(Math.PI / 4);
        const sz = (7 + limitGlow * 5) * (0.85 + crestPulse * 0.35);
        cctx.fillStyle = `rgba(255, 230, 170, ${0.50 + crestPulse * 0.40})`;
        cctx.shadowColor = `rgba(${250 + limitGlow * 5}, ${200 - limitGlow * 100}, ${130 - limitGlow * 80}, 0.95)`;
        cctx.shadowBlur = 14 + crestPulse * 18 + limitGlow * 24;
        cctx.fillRect(-sz / 2, -sz / 2, sz, sz);
        // ハイライト
        cctx.fillStyle = `rgba(255, 250, 230, ${0.6 + crestPulse * 0.3})`;
        cctx.shadowBlur = 0;
        cctx.fillRect(-sz / 5, -sz / 5, sz / 2.5, sz / 2.5);
      } else {
        // 4 点星 (小さめ、 cardinal 間)
        const sz = (4 + limitGlow * 3) * (0.85 + crestPulse * 0.30);
        cctx.fillStyle = `rgba(245, 216, 150, ${0.45 + crestPulse * 0.35})`;
        cctx.shadowColor = `rgba(${245 + limitGlow * 10}, ${200 - limitGlow * 80}, ${130 - limitGlow * 60}, 0.85)`;
        cctx.shadowBlur = 8 + crestPulse * 12 + limitGlow * 16;
        cctx.beginPath();
        cctx.moveTo(0, -sz);
        cctx.lineTo(sz * 0.32, -sz * 0.32);
        cctx.lineTo(sz, 0);
        cctx.lineTo(sz * 0.32, sz * 0.32);
        cctx.lineTo(0, sz);
        cctx.lineTo(-sz * 0.32, sz * 0.32);
        cctx.lineTo(-sz, 0);
        cctx.lineTo(-sz * 0.32, -sz * 0.32);
        cctx.closePath();
        cctx.fill();
      }
      cctx.restore();
    }
    // 8 玉を結ぶ薄い円弧 (連結感)
    cctx.strokeStyle = `rgba(245, 216, 150, ${0.10 + crestPulse * 0.10})`;
    cctx.lineWidth = 0.8;
    cctx.shadowBlur = 0;
    cctx.beginPath();
    cctx.arc(0, 0, crestR, 0, Math.PI * 2);
    cctx.stroke();
    cctx.restore();
  }

  // ── 音波リップル (peak 時に ring から外へ広がる sonar pulse) ──
  //   attack burst を検出して新しい ripple をスポーン、 各 ripple は 1.4s で外へ広がり消える
  state.sonarRipples = state.sonarRipples || [];
  if (state.lastAttackBurstAt && (now - state.lastAttackBurstAt < 50)) {
    if (!state._lastSonarAt || (now - state._lastSonarAt > 110)) {
      state._lastSonarAt = now;
      state.sonarRipples.push({
        startedAt: now,
        intensity: state.attackBurstStrength || 0.5,
      });
      // 古い ripple を間引く (最大 8 個)
      if (state.sonarRipples.length > 8) state.sonarRipples.shift();
    }
  }
  if (state.sonarRipples.length > 0) {
    cctx.save();
    cctx.translate(cx, cy);
    const aliveRipples = [];
    for (const r of state.sonarRipples) {
      const age = (now - r.startedAt) / 1400;
      if (age >= 1) continue;
      aliveRipples.push(r);
      const radiusFactor = 1.0 + age * 1.7;       // 1.0 → 2.7
      const radius = ringR * radiusFactor;
      // ease-out fade (快活な始まりからゆっくり消える)
      const fadeOut = (1 - age) * (1 - age);
      const opacity = fadeOut * Math.min(1, r.intensity * 1.2) * 0.55;
      cctx.strokeStyle = `rgba(245, 216, 150, ${opacity})`;
      cctx.lineWidth = 1.3 - age * 0.6;
      cctx.shadowColor = 'rgba(245, 216, 150, 0.45)';
      cctx.shadowBlur = 8 - age * 5;
      cctx.beginPath();
      cctx.arc(0, 0, radius, 0, Math.PI * 2);
      cctx.stroke();
    }
    state.sonarRipples = aliveRipples;
    cctx.restore();
  }

  // ── ホワイトホールの輝き (出射方向に薄い光) ──
  if (audioGlow > 0.05) {
    cctx.save();
    cctx.translate(cx + ax * (ringR + 4), cy + ay * (ringR + 4));
    const haloGrad = cctx.createRadialGradient(0, 0, 0, 0, 0, ringR * 1.6);
    haloGrad.addColorStop(0, `rgba(245, 216, 150, ${Math.min(0.55, audioGlow * 0.55)})`);
    haloGrad.addColorStop(0.6, `rgba(245, 216, 150, ${Math.min(0.15, audioGlow * 0.15)})`);
    haloGrad.addColorStop(1, 'rgba(245, 216, 150, 0)');
    cctx.fillStyle = haloGrad;
    cctx.beginPath(); cctx.arc(0, 0, ringR * 1.6, 0, Math.PI * 2); cctx.fill();
    cctx.restore();
  }

  // (旧 MAKE-UP ビーム描画は削除 — 粒子の太さ・熱・bgGlow で表現)

  // ── 音割れ (clip) のヒビ演出 ──
  if (state.cracks && state.clipUntil && now < state.clipUntil) {
    const elapsed = now - (state.clipUntil - 850);
    const fade = Math.max(0, 1 - elapsed / 850);
    const strength = state.clipStrength || 0.6;
    cctx.save();
    // 全画面に薄い赤フラッシュ (最初の 130ms のみ)
    if (elapsed < 130) {
      const flashAlpha = 0.32 * (1 - elapsed / 130) * strength;
      cctx.fillStyle = `rgba(255, 80, 60, ${flashAlpha})`;
      cctx.fillRect(0, 0, w, h);
    }
    // ヒビ本体 (橙赤、 グロー付き)
    cctx.strokeStyle = `rgba(255, 110, 80, ${0.92 * fade})`;
    cctx.lineWidth = 1.6 + strength * 0.7;
    cctx.shadowColor = 'rgba(255, 80, 40, 0.85)';
    cctx.shadowBlur = 11 * fade;
    cctx.lineCap = 'round';
    cctx.lineJoin = 'round';
    for (const path of state.cracks) {
      if (path.length < 2) continue;
      cctx.beginPath();
      cctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) cctx.lineTo(path[i].x, path[i].y);
      cctx.stroke();
    }
    // 内側の細い白ハイライト (ガラスらしさ)
    cctx.strokeStyle = `rgba(255, 235, 220, ${0.70 * fade})`;
    cctx.lineWidth = 0.7;
    cctx.shadowBlur = 3 * fade;
    for (const path of state.cracks) {
      if (path.length < 2) continue;
      cctx.beginPath();
      cctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) cctx.lineTo(path[i].x, path[i].y);
      cctx.stroke();
    }
    cctx.restore();
  }

  // (旧 canvas 内の INPUT/OUTPUT ラベルは削除 — VU メーター側に表記があり、
  //  ringAngle 回転で左右にはみ出てしまうため重複も含めて非表示)

  cctx.restore(); // shake transform end
  requestAnimationFrame(drawWindow);
}

// ============================================================
// Drag the window itself = threshold
// ============================================================
function attachWindowDrag() {
  const card = document.querySelector('.window-card');
  let dragX = 0, dragY = 0;
  let dragStartTh = 0, dragStartAngle = 0;
  let dragging = false;
  card.addEventListener('mousedown', (e) => {
    if (e.target.closest('.live-narration')) return;
    if (e.target.closest('.gem-mount')) return;
    ensureCtx();
    dragging = true;
    dragX = e.clientX;
    dragY = e.clientY;
    dragStartTh = state.threshold;
    dragStartAngle = state.ringAngle || 0;
    state.focusKnob = 'threshold';
    document.body.style.cursor = 'move';
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dy = (dragY - e.clientY);
    const dx = (e.clientX - dragX);
    // 縦ドラッグ → Threshold (上で増、 下で減)
    let nextTh = dragStartTh + (dy / 18);
    nextTh = Math.max(-50, Math.min(0, nextTh));
    state.threshold = Math.round(nextTh * 2) / 2;
    // 横ドラッグ → 画面全体の角度 (ringAngle)
    state.ringAngle = dragStartAngle + (dx / 280);   // 280px で約 1 ラジアン
    applyParams();
    syncMiniValues();
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    setTimeout(() => { if (state.focusKnob === 'threshold') state.focusKnob = null; }, 800);
  });
}

// ============================================================
// UI sync helpers
// ============================================================
function syncMiniValues() {
  // threshold も含めて全 mini-card の値とステータスラベルを同期 (locale 切替時にも呼ばれる)
  ['threshold','attack','release','ratio','knee'].forEach(p => {
    const card = document.querySelector(`.mini-card[data-param="${p}"]`);
    if (!card) return;
    const valEl = card.querySelector('.mc-val');
    const stEl  = card.querySelector('.mc-status');
    const v = state[p];
    if (valEl && valEl.firstChild) {
      valEl.firstChild.nodeValue = (p === 'ratio' || p === 'threshold') ? v.toFixed(1) : Math.round(v).toString();
    }
    if (stEl) stEl.textContent = t('statusLabels.' + p + '.' + statusOf(p, v));
    const k = card.querySelector('.physical-knob');
    if (k && k.__update) k.__update();
  });
  const sc = document.querySelector('.mini-card[data-param="sidechain"]');
  if (sc) {
    sc.querySelector('.mc-val').firstChild.nodeValue = Math.round(state.scFreq).toString();
  }
  // input gain & mix
  const ig = document.querySelector('.knob-cell[data-param="inputGain"]');
  if (ig) {
    ig.querySelector('.kc-val').textContent = (state.inputGain >= 0 ? '+' : '') + state.inputGain.toFixed(1) + ' dB';
    const k = ig.querySelector('.physical-knob');
    if (k && k.__update) k.__update();
  }
  const mx = document.querySelector('.knob-cell[data-param="mix"]');
  if (mx) {
    mx.querySelector('.kc-val').textContent = state.mix.toFixed(0) + ' %';
    const k = mx.querySelector('.physical-knob');
    if (k && k.__update) k.__update();
  }
  // threshold value (in central status badge if any)
  const thBadge = document.getElementById('thresholdBadge');
  if (thBadge) thBadge.textContent = state.threshold.toFixed(1) + ' dB';
}

// ============================================================
// Header / preset / toggles wiring
// ============================================================
function setLocale(loc) {
  if (!L[loc]) return;
  locale = loc;
  document.documentElement.lang = loc === 'ja' ? 'ja' : 'en';
  applyLocale();
  savePersist();
}

// ── 設定永続化 (localStorage) ──
//   永続化対象: locale / preset / 主要トグル / make-up
//   オーディオファイルや A/B メモリは永続化しない (一時的な作業状態)
const PERSIST_KEY = 'hmix-comp-state-v1';
function savePersist() {
  try {
    const data = {
      locale,
      preset: state.preset,
      makeup: state.makeup,
      protectLimit: state.protectLimit,
      hpf: state.hpf,
      tutorialStep: state.tutorialStep,
    };
    localStorage.setItem(PERSIST_KEY, JSON.stringify(data));
  } catch (e) { /* localStorage 無効環境は無視 */ }
}
function loadPersist() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function applyLocale() {
  // brand sub
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    el.innerHTML = t(k);
  });
  // preset name
  renderPresetMenu();
  updatePresetDisplay();
  // mini cards
  ['attack','release','ratio','knee','sidechain'].forEach(p => {
    const card = document.querySelector(`.mini-card[data-param="${p}"]`);
    if (!card) return;
    const cap = card.querySelector('.mc-cap');
    const jp  = card.querySelector('.mc-jp');
    const unit = card.querySelector('.mc-unit');
    cap.textContent = t('mini.' + p + '.cap');
    jp.textContent  = t('mini.' + p + '.jp');
    if (unit) unit.textContent = t('mini.' + p + '.unit');
  });
  // threshold mini-card は L 内の階層が異なる (mini.* ではなく直接 threshold.*)
  {
    const thCard = document.querySelector('.mini-card[data-param="threshold"]');
    if (thCard) {
      const cap = thCard.querySelector('.mc-cap');
      const jp  = thCard.querySelector('.mc-jp');
      const unit = thCard.querySelector('.mc-unit');
      if (cap) cap.textContent = t('threshold.cap');
      if (jp) jp.textContent = t('threshold.jp');
      if (unit) unit.textContent = t('threshold.unit');
    }
  }
  // input/mix labels
  document.querySelectorAll('[data-loc-key]').forEach(el => {
    const k = el.dataset.locKey;
    el.textContent = t(k);
  });
  // toggles
  document.querySelectorAll('.toggle').forEach(tog => {
    const k = tog.dataset.tog;
    if (!k) return;
    const cap = tog.querySelector('.t-cap');
    const jp  = tog.querySelector('.t-jp');
    cap.textContent = t('toggles.' + k + '.cap');
    jp.textContent  = t('toggles.' + k + '.jp');
  });
  syncMiniValues();
  document.getElementById('grLabel').textContent = t('grLabel');
  document.getElementById('grLabelJp').textContent = t('grLabelJp');
  document.getElementById('makeupLabel').textContent = t('makeup');
  document.getElementById('makeupLabelJp').textContent = t('makeupJp');
  document.getElementById('liveHead').textContent = t('liveHead');
  if (!state.playing) document.getElementById('liveBody').innerHTML = t('liveDefault');
  document.querySelectorAll('.lang-bay button').forEach(b => b.classList.toggle('is-active', b.dataset.lang === locale));
  // brand sub
  document.querySelector('.brand-sub').textContent = t('brandSub');
  // bypass label
  const byBtn = document.getElementById('btnBypass');
  byBtn.querySelector('.lbl').textContent = state.bypass ? t('bypassActive') : t('bypass');
  // VU caps
  document.getElementById('vuInCap').innerHTML = `${t('vuIn')}<small>${t('vuInJp')}</small>`;
  document.getElementById('vuOutCap').innerHTML = `${t('vuOut')}<small>${t('vuOutJp')}</small>`;
  // Preset hint (まだ操作前に表示されるテキスト)
  const hintMain = document.querySelector('.preset-hint-text');
  if (hintMain) {
    hintMain.innerHTML = `${t('presetHintMain')}<br><small>${t('presetHintSub')}</small>`;
  }
  // File select label (ファイル未選択時のみ更新、 選択済みならファイル名を保持)
  const fileLabelEl = document.getElementById('fileLabel');
  if (fileLabelEl && (!state.userFileName)) {
    fileLabelEl.textContent = t('fileSelect');
  }
  // Tooltips (title 属性) — ボタン要素
  const protectBtn = document.getElementById('btnProtectLimit');
  if (protectBtn) protectBtn.setAttribute('title', t('tipProtectLimit'));
  const hpfTog = document.querySelector('.toggle[data-tog="hpf"]');
  if (hpfTog) hpfTog.setAttribute('title', t('tipHpf'));
  // A/B 比較ボタン
  const abA = document.querySelector('.ab-btn[data-slot="A"]');
  if (abA) abA.setAttribute('title', t('tipAbA'));
  const abB = document.querySelector('.ab-btn[data-slot="B"]');
  if (abB) abB.setAttribute('title', t('tipAbB'));
  const abCp = document.getElementById('abCopy');
  if (abCp) {
    abCp.setAttribute('title', t('tipAbCopy'));
    if (!abCp.classList.contains('is-saved')) abCp.textContent = t('abCopyText');
  }
  // Preset name display (current selection)
  const curPreset = state.preset || 'off';
  const curInfo = t('presets.' + curPreset);
  if (curInfo && curInfo.name) {
    const pn = document.getElementById('presetName');
    if (pn) pn.innerHTML = `${curInfo.name}<small>${curInfo.en}</small>`;
  }
  renderPresetMenu();
  if (typeof updateTutorialUI === 'function') updateTutorialUI();   // ロケール変更時にヒント文言を更新
}

function renderPresetMenu() {
  const menu = document.getElementById('presetMenu');
  if (!menu) return;
  menu.innerHTML = '';
  PRESET_ORDER.forEach((key, i) => {
    const info = t('presets.' + key);
    const p = PRESETS[key];
    const item = document.createElement('div');
    item.className = 'preset-item' + (key === state.preset ? ' is-active' : '');
    item.dataset.preset = key;
    item.innerHTML = `
      <div class="pi-key">${(i+1).toString().padStart(2,'0')}</div>
      <div class="pi-text">
        <span class="pi-name">${info.name}</span>
        <span class="pi-en">${info.en}</span>
      </div>
      <div class="pi-tooltip">
        <div class="pi-tt-title">${info.name} <span class="pi-tt-en">${info.en}</span></div>
        <div class="pi-tt-desc">${info.desc}</div>
        <div class="pi-tt-meta">
          <span><strong>THRESHOLD</strong> ${p.threshold} dB</span>
          <span><strong>RATIO</strong> ${p.ratio.toFixed(1)} : 1</span>
          <span><strong>ATTACK</strong> ${p.attack} ms</span>
          <span><strong>RELEASE</strong> ${p.release} ms</span>
          <span><strong>MAKE-UP</strong> +${p.makeup} dB</span>
        </div>
      </div>
    `;
    item.addEventListener('click', () => {
      applyPreset(key);
      document.getElementById('presetBay').classList.remove('is-open');
    });
    menu.appendChild(item);
  });
}
function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  state.preset = key;
  Object.assign(state, p);
  ensureCtx();
  applyParams();
  // チュートリアル: OFF 以外を選んだら step 1 へ進む (THRESHOLD 誘導)
  if (key !== 'off' && state.tutorialStep === 0) {
    state.tutorialStep = 1;
  }
  updateTutorialUI();
  if (typeof savePersist === 'function') savePersist();
  // make-up slider sync
  const mu = document.getElementById('makeupSlider');
  const muV = document.getElementById('makeupValue');
  if (mu) mu.value = p.makeup;
  if (muV) muV.textContent = (p.makeup >= 0 ? '+' : '') + p.makeup.toFixed(1) + ' dB';
  // INPUT GAIN ノブ UI 同期 + 値表示
  const igCell = document.querySelector('.knob-cell[data-param="inputGain"]');
  if (igCell) {
    const igVal = igCell.querySelector('.kc-val');
    if (igVal) igVal.textContent = (state.inputGain >= 0 ? '+' : '') + state.inputGain.toFixed(1) + ' dB';
    const igKnob = igCell.querySelector('.physical-knob');
    if (igKnob && igKnob.__update) igKnob.__update();
  }
  // ミニカードのノブも __update を呼んで UI を反映
  ['attack','release','ratio','knee'].forEach(prm => {
    const k = document.querySelector(`.mini-card[data-param="${prm}"] .physical-knob`);
    if (k && k.__update) k.__update();
  });
  syncMiniValues();
  updatePresetDisplay();
}
function updatePresetDisplay() {
  const info = t('presets.' + state.preset);
  const i = PRESET_ORDER.indexOf(state.preset);
  document.getElementById('presetName').innerHTML = `${info.name}<small>${info.en}</small>`;
  document.querySelectorAll('.preset-item').forEach(it => {
    it.classList.toggle('is-active', it.dataset.preset === state.preset);
  });
}

// ============================================================
// Init UI
// ============================================================
function init() {
  // Mini knobs (THRESHOLD / ATTACK / RELEASE / RATIO)
  setupKnob(
    document.querySelector('.mini-card[data-param="threshold"] .physical-knob'),
    'threshold', { min: -50, max: 0, step: 0.5,
      onChange: (v) => { document.querySelector('.mini-card[data-param="threshold"] .mc-val').firstChild.nodeValue = v.toFixed(1); document.querySelector('.mini-card[data-param="threshold"] .mc-status').textContent = t('statusLabels.threshold.' + statusOf('threshold', v)); advanceTutorialFromKnob('threshold'); }
    }
  );
  setupKnob(
    document.querySelector('.mini-card[data-param="attack"] .physical-knob'),
    'attack', { min: 1, max: 200, step: 1, log: true,
      onChange: (v) => { document.querySelector('.mini-card[data-param="attack"] .mc-val').firstChild.nodeValue = Math.round(v); document.querySelector('.mini-card[data-param="attack"] .mc-status').textContent = t('statusLabels.attack.' + statusOf('attack', v)); }
    }
  );
  setupKnob(
    document.querySelector('.mini-card[data-param="release"] .physical-knob'),
    'release', { min: 30, max: 800, step: 5, log: true,
      onChange: (v) => { document.querySelector('.mini-card[data-param="release"] .mc-val').firstChild.nodeValue = Math.round(v); document.querySelector('.mini-card[data-param="release"] .mc-status').textContent = t('statusLabels.release.' + statusOf('release', v)); }
    }
  );
  setupKnob(
    document.querySelector('.mini-card[data-param="ratio"] .physical-knob'),
    'ratio', { min: 1, max: 20, step: 0.1, log: true,
      onChange: (v) => { document.querySelector('.mini-card[data-param="ratio"] .mc-val').firstChild.nodeValue = v.toFixed(1); document.querySelector('.mini-card[data-param="ratio"] .mc-status').textContent = t('statusLabels.ratio.' + statusOf('ratio', v)); advanceTutorialFromKnob('ratio'); }
    }
  );
  // sidechain card は削除したので、ある場合のみドラッグ操作を有効化
  const scCard = document.querySelector('.mini-card[data-param="sidechain"]');
  if (scCard) {
    let scDragY = 0, scStart = 0, scDragging = false;
    scCard.addEventListener('mousedown', (e) => {
      if (!state.sc) return;
      scDragging = true; scDragY = e.clientY; scStart = state.scFreq;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!scDragging) return;
      const dy = scDragY - e.clientY;
      const range = Math.log(2000) - Math.log(20);
      const ratioPct = (Math.log(scStart) - Math.log(20)) / range;
      const next = Math.exp(Math.log(20) + Math.max(0, Math.min(1, ratioPct + dy/250)) * range);
      state.scFreq = next;
      applyParams();
      syncMiniValues();
      drawScGraph();
    });
    document.addEventListener('mouseup', () => { scDragging = false; });
  }

  // Input gain (MIX は廃止)
  setupKnob(
    document.querySelector('.knob-cell[data-param="inputGain"] .physical-knob'),
    'inputGain', { min: -24, max: 24, step: 0.1,
      onChange: (v) => { document.querySelector('.knob-cell[data-param="inputGain"] .kc-val').textContent = (v >= 0 ? '+' : '') + v.toFixed(1) + ' dB'; }
    }
  );

  // Preset bay
  const bay = document.getElementById('presetBay');
  // 一度でも操作したらパルスを止める
  const quietBay = () => bay.classList.add('is-quiet');
  document.getElementById('presetPrev').addEventListener('click', () => {
    let i = PRESET_ORDER.indexOf(state.preset);
    i = (i - 1 + PRESET_ORDER.length) % PRESET_ORDER.length;
    applyPreset(PRESET_ORDER[i]);
    quietBay();
  });
  document.getElementById('presetNext').addEventListener('click', () => {
    let i = PRESET_ORDER.indexOf(state.preset);
    i = (i + 1) % PRESET_ORDER.length;
    applyPreset(PRESET_ORDER[i]);
    quietBay();
  });
  const presetNameEl = document.getElementById('presetName');
  presetNameEl.addEventListener('click', () => {
    bay.classList.toggle('is-open');
    presetNameEl.setAttribute('aria-expanded', bay.classList.contains('is-open') ? 'true' : 'false');
    quietBay();
  });
  // a11y: Enter / Space でも開閉できるように
  presetNameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      presetNameEl.click();
    } else if (e.key === 'Escape' && bay.classList.contains('is-open')) {
      bay.classList.remove('is-open');
      presetNameEl.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('click', (e) => {
    if (!bay.contains(e.target)) bay.classList.remove('is-open');
  });

  // Cap buttons
  document.getElementById('btnBypass').addEventListener('click', () => {
    if (state.tutorialStep === 3) { state.tutorialStep = 4; updateTutorialUI(); }
    ensureCtx();
    setBypass(!state.bypass);
    document.getElementById('btnBypass').classList.toggle('is-active', state.bypass);
    document.getElementById('btnBypass').querySelector('.lbl').textContent = state.bypass ? t('bypassActive') : t('bypass');
  });
  document.getElementById('btnReset').addEventListener('click', () => {
    // 設定を OFF プリセットに戻す
    applyPreset('off');
    // 加えて、 チュートリアル進行 / A/B メモリ / トグル状態も初期化 (locale は保持)
    state.tutorialStep = 0;
    state.abMem = { A: null, B: null };
    state.abSlot = 'A';
    state.hpf = false;          // SC HPF OFF
    state.protectLimit = true;  // 保護リミッターは ON が安全デフォルト
    state.autoGain = false;
    state.autoMakeup = false;
    state.bypass = false;
    state.ringAngle = -Math.PI / 12;   // 初期傾き
    state.grPeak = 0;
    state.grVelSmooth = 0;
    if (ctx) {
      applyParams();
      setBypass(false);
    }
    // UI 同期
    document.querySelectorAll('.ab-btn').forEach(b => b.classList.toggle('is-active', b.dataset.slot === 'A'));
    const protectBtn = document.getElementById('btnProtectLimit');
    if (protectBtn) protectBtn.classList.toggle('is-active', state.protectLimit);
    const autoGainBtn = document.getElementById('btnAutoGain');
    if (autoGainBtn) autoGainBtn.classList.toggle('is-active', state.autoGain);
    const autoMakeupBtn = document.getElementById('btnAutoMakeup');
    if (autoMakeupBtn) autoMakeupBtn.classList.toggle('is-active', state.autoMakeup);
    const hpfTog = document.querySelector('.toggle[data-tog="hpf"]');
    if (hpfTog) hpfTog.classList.toggle('is-active', state.hpf);
    updateTutorialUI();
  });
  document.getElementById('btnAutoGain').addEventListener('click', () => {
    state.autoGain = !state.autoGain;
    document.getElementById('btnAutoGain').classList.toggle('is-active', state.autoGain);
  });
  document.getElementById('btnAutoMakeup').addEventListener('click', () => {
    state.autoMakeup = !state.autoMakeup;
    document.getElementById('btnAutoMakeup').classList.toggle('is-active', state.autoMakeup);
  });
  // 保護リミッター ON/OFF
  document.getElementById('btnProtectLimit').addEventListener('click', () => {
    state.protectLimit = !state.protectLimit;
    document.getElementById('btnProtectLimit').classList.toggle('is-active', state.protectLimit);
    if (ctx) applyParams();
    savePersist();
  });

  // AUTO GAIN / AUTO MAKEUP のロジック (250ms 周期で追従)
  setInterval(() => {
    if (!ctx || state.bypass) return;
    // AUTO MAKEUP: GR の値を Make-Up に追従
    if (state.autoMakeup) {
      const target = Math.max(0, Math.min(20, state.gr));
      if (Math.abs(target - state.makeup) > 0.2) {
        const next = Math.round(target * 2) / 2;
        setMakeup(next);
        const ms = document.getElementById('makeupSlider');
        const mv = document.getElementById('makeupValue');
        if (ms) ms.value = next;
        if (mv) mv.textContent = (next >= 0 ? '+' : '') + next.toFixed(1) + ' dB';
      }
    }
    // AUTO GAIN: 入力ピークが Threshold + 3dB に近づくよう inputGain を補正
    //   修正:
    //     - 無音時 (state.inLevel < 0.005) は補正しない (再生してない時に boost しない)
    //     - ratio = 1 (圧縮 OFF) の時も補正しない (圧縮しないなら整える意味なし)
    //     - 範囲を ±9 dB に制限 (旧 ±24 dB は過大、 +24 dB 暴走の原因)
    //     - target を min(-3, threshold + 3) で 0 dBFS 超を防止
    //     - 追従速度 0.04 (旧 0.08) で半分のスピード、 落ち着いた動作
    //     - state.inLevel (RMS) ではなく state.inPeakHold (peak) を見る (実機の AutoGain 挙動)
    if (state.autoGain && state.ratio > 1.05 && state.playing && (state.inLevel || 0) > 0.005) {
      const peakLevel = Math.max(0.001, state.inPeakHold || state.inLevel || 0);
      const peakDb = 20 * Math.log10(peakLevel);
      const target = Math.min(-3, state.threshold + 3);
      const diff = target - peakDb;
      const desired = Math.max(-9, Math.min(9, state.inputGain + diff * 0.04));
      if (Math.abs(desired - state.inputGain) > 0.2) {
        state.inputGain = Math.round(desired * 10) / 10;
        applyParams();
        const ig = document.querySelector('.knob-cell[data-param="inputGain"]');
        if (ig) {
          const v = ig.querySelector('.kc-val');
          if (v) v.textContent = (state.inputGain >= 0 ? '+' : '') + state.inputGain.toFixed(1) + ' dB';
          const k = ig.querySelector('.physical-knob');
          if (k && k.__update) k.__update();
        }
      }
    }
  }, 250);

  // A/B
  document.querySelectorAll('.ab-btn').forEach(b => b.addEventListener('click', () => {
    const slot = b.dataset.slot;
    if (state.abMem[slot]) {
      // recall — preset 名 + Make-Up/INPUT GAIN スライダー UI も同期
      // (CODEX 指摘 #1: 音は戻るが Make-Up スライダー表示が古いまま残る問題を修正)
      Object.assign(state, state.abMem[slot]);
      applyParams(); syncMiniValues();
      updatePresetDisplay();
      // Make-Up スライダー UI 同期 (applyPreset と同じロジック)
      const mu = document.getElementById('makeupSlider');
      const muV = document.getElementById('makeupValue');
      if (mu) mu.value = state.makeup;
      if (muV) muV.textContent = (state.makeup >= 0 ? '+' : '') + state.makeup.toFixed(1) + ' dB';
      // INPUT GAIN ノブ UI 同期
      const igCell = document.querySelector('.knob-cell[data-param="inputGain"]');
      if (igCell) {
        const igVal = igCell.querySelector('.kc-val');
        if (igVal) igVal.textContent = (state.inputGain >= 0 ? '+' : '') + state.inputGain.toFixed(1) + ' dB';
        const igKnob = igCell.querySelector('.physical-knob');
        if (igKnob && igKnob.__update) igKnob.__update();
      }
    }
    state.abSlot = slot;
    document.querySelectorAll('.ab-btn').forEach(b2 => b2.classList.toggle('is-active', b2.dataset.slot === slot));
  }));
  document.getElementById('abCopy').addEventListener('click', () => {
    // preset 名も保存 (A/B 復元時に表示と中身を一致させるため)
    state.abMem[state.abSlot] = JSON.parse(JSON.stringify({
      preset: state.preset,
      threshold: state.threshold, ratio: state.ratio, attack: state.attack,
      release: state.release, knee: state.knee, makeup: state.makeup, mix: state.mix, inputGain: state.inputGain
    }));
    const btn = document.getElementById('abCopy');
    const orig = btn.textContent;
    btn.textContent = '✓';
    btn.classList.add('is-saved');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('is-saved');
    }, 900);
  });

  // Lang
  document.querySelectorAll('.lang-bay button').forEach(b => b.addEventListener('click', () => setLocale(b.dataset.lang)));

  // Toggles
  document.querySelectorAll('.toggle').forEach(tog => {
    tog.addEventListener('click', () => {
      const k = tog.dataset.tog;
      if (k === 'learn') { openLearn(); return; }
      state[k] = !state[k];
      tog.classList.toggle('is-active', state[k]);
      if (k === 'sc') drawScGraph();
      if (k === 'hpf' && ctx) applyParams();   // SC HPF 周波数を反映
      if (k === 'narrate') document.querySelector('.live-narration').classList.toggle('hidden', !state.narrate);
      savePersist();
    });
  });
  // SC HPF 周波数切替: クリックで 40 → 80 → 120 → 200 Hz を順送り
  const scFreqDisplay = document.getElementById('scFreqDisplay');
  if (scFreqDisplay) {
    const SC_FREQS = [40, 80, 120, 200];
    const refreshScDisplay = () => { scFreqDisplay.textContent = (state.scFreq || 80) + ' Hz'; };
    refreshScDisplay();
    scFreqDisplay.addEventListener('click', (ev) => {
      ev.stopPropagation();          // toggle 親の ON/OFF を発火させない
      const cur = state.scFreq || 80;
      const i = SC_FREQS.indexOf(cur);
      const next = SC_FREQS[(i >= 0 ? (i + 1) : 0) % SC_FREQS.length];
      state.scFreq = next;
      refreshScDisplay();
      if (ctx) applyParams();
      savePersist();
    });
    // 永続化された scFreq を反映 (スコープ外の DOMContentLoaded から init を呼んだ後にも refresh)
    state.__refreshScDisplay = refreshScDisplay;
  }
  // initial states
  ['link','narrate'].forEach(k => {
    const tog = document.querySelector(`.toggle[data-tog="${k}"]`);
    if (tog) tog.classList.toggle('is-active', state[k]);
  });
  // 'in' toggle (削除済みなのでスキップ)
  state.in = true;
  const inToggle = document.querySelector('.toggle[data-tog="in"]');
  if (inToggle) inToggle.classList.add('is-active');

  // Make-up slider
  const muSlider = document.getElementById('makeupSlider');
  const muValue = document.getElementById('makeupValue');
  muSlider.addEventListener('input', () => {
    ensureCtx();
    const v = parseFloat(muSlider.value);
    setMakeup(v);
    muValue.textContent = (v >= 0 ? '+' : '') + v.toFixed(1) + ' dB';
  });

  // ============================================================
  // Sources — Player bar + DEMO 3 tracks (n142/n74/n79) + UPLOAD
  // ============================================================
  const fileInput = document.getElementById('fileInput');
  const fileLabel = document.getElementById('fileLabel');
  const exportWavBtn = document.getElementById('exportWavBtn');

  // Player bar
  const playerPlay = document.getElementById('playerPlay');
  const playerCat = document.getElementById('playerCat');
  const playerTitle = document.getElementById('playerTitle');
  const playerSeekBar = document.getElementById('playerSeekBar');
  const playerFill = document.getElementById('playerFill');
  const playerHandle = document.getElementById('playerHandle');
  const playerTime = document.getElementById('playerTime');

  // DEMO tracks data
  // 相対パス: ローカル file:// + ローカル HTTP server + 本番 (https://hmix.net/tools/compressor/) すべてで動く。
  // 本番では document が /tools/compressor/index.html、ファイルが /music/n/*.mp3 なので
  // ../../music/n/ で正しく解決される。プロトタイプ位置からは ../../../../hmix/music/n/。
  const isFile = (location.protocol === 'file:');
  // 開発環境 (compressor-claude-design 配置) と本番 (hmix/tools/compressor 配置) で URL 構造が違うので、
  // ロケーションパスから自動判定する。本番の場合 /tools/compressor/ からみて ../../music/n/。
  const DEMO_BASE = location.pathname.includes('/prototypes/')
    ? '../../../../hmix/music/n/'
    : '../../music/n/';
  const TRACKS = {
    n142: { src: DEMO_BASE + 'n142.mp3', title: 'Overture!',  catalog: 'N142' },
    n74:  { src: DEMO_BASE + 'n74.mp3',  title: 'Moment',     catalog: 'N74'  },
    n79:  { src: DEMO_BASE + 'n79.mp3',  title: '瞬光の切先', catalog: 'N79'  },
  };
  let currentTrackKey = null;

  function fmtTime(t) {
    if (!isFinite(t) || t < 0) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function setPlayerInfo(catText, title, isLoaded) {
    playerCat.textContent = catText;
    playerCat.classList.toggle('is-loaded', !!isLoaded);
    playerTitle.textContent = title;
  }
  function setPlayerPlaying(playing) {
    playerPlay.classList.toggle('is-playing', !!playing);
    playerPlay.textContent = playing ? '❚❚' : '▶';
  }
  function clearActiveDemoPills() {
    document.querySelectorAll('.demo-pill').forEach(p => p.classList.remove('is-active'));
  }

  async function loadTrack(key) {
    const t = TRACKS[key];
    if (!t) return;
    // 常に fetch + Blob URL で読み込む。理由:
    //  ・file:// プロトコル → Web Audio が CORS 扱いで無音化する問題回避
    //  ・ローカル Python http.server → Range リクエスト未対応でシークが
    //    先頭に戻る問題を回避 (Blob は完全にメモリ常駐するため client 側でシーク可)
    //  ・本番デプロイ後は Apache/Nginx が Range 対応するので不要だが、
    //    Blob 化のオーバーヘッドは小さいので一律でこの方針にしておく。
    let srcUrl;
    try {
      setPlayerInfo('LOADING', t.title + ' を読込中…', false);
      const res = await fetch(t.src);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      if (state.demoObjectUrl) URL.revokeObjectURL(state.demoObjectUrl);
      state.demoObjectUrl = URL.createObjectURL(blob);
      srcUrl = state.demoObjectUrl;
    } catch (err) {
      console.error('Demo fetch failed:', err);
      setPlayerInfo('ERROR', 'デモを取得できません: ' + err.message, false);
      return;
    }
    audioUser.src = srcUrl;
    audioUser.load();
    state.userFileName = t.title;
    state.userObjectUrl = null;
    state.userAudioFile = null;
    currentTrackKey = key;
    setPlayerInfo('DEMO · ' + t.catalog, t.title, true);
    playerPlay.disabled = false;
    if (exportWavBtn) exportWavBtn.disabled = false;
    clearActiveDemoPills();
    const pill = document.querySelector('.demo-pill[data-track="' + key + '"]');
    if (pill) pill.classList.add('is-active');
    // 自動再生
    playSource('user').catch(() => {/* autoplay ブロック時はユーザー操作待ち */});
  }

  fileInput.addEventListener('change', () => {
    if (!fileInput.files.length) return;
    const f = fileInput.files[0];
    fileLabel.textContent = f.name;
    state.userFileName = f.name;
    state.userAudioFile = f;
    if (state.userObjectUrl) URL.revokeObjectURL(state.userObjectUrl);
    state.userObjectUrl = URL.createObjectURL(f);
    audioUser.src = state.userObjectUrl;
    audioUser.load();
    currentTrackKey = null;
    setPlayerInfo('UPLOAD', f.name, true);
    playerPlay.disabled = false;
    if (exportWavBtn) exportWavBtn.disabled = false;
    clearActiveDemoPills();
    setExportStatus('');
  });

  function playSource(which) {
    ensureCtx();
    // 'demo' (合成ノード) は廃止。常に audioUser を経由。
    if (!audioUser.src) return Promise.resolve();
    if (!mediaUserNode) mediaUserNode = ctx.createMediaElementSource(audioUser);
    rewireSource(mediaUserNode);
    if (demoNode) { try { demoNode.disconnect(); } catch(e){} demoPlaying = false; }
    activeSource = 'user';
    state.playing = true;
    return audioUser.play();
  }
  function pauseSource() {
    audioUser.pause();
    if (demoNode) { try { demoNode.disconnect(); } catch(e){} }
    demoPlaying = false;
    state.playing = false;
    activeSource = null;
  }

  // Player bar play/pause
  playerPlay.addEventListener('click', () => {
    if (!audioUser.src) return;
    if (audioUser.paused) playSource('user').catch(()=>{});
    else pauseSource();
  });

  // Audio element event → player bar UI sync
  audioUser.addEventListener('play',  () => setPlayerPlaying(true));
  audioUser.addEventListener('pause', () => setPlayerPlaying(false));
  audioUser.addEventListener('ended', () => setPlayerPlaying(false));
  audioUser.addEventListener('loadedmetadata', () => {
    playerTime.textContent = '0:00 / ' + fmtTime(audioUser.duration);
  });
  audioUser.addEventListener('timeupdate', () => {
    if (!audioUser.duration) return;
    const pct = (audioUser.currentTime / audioUser.duration) * 100;
    playerFill.style.width = pct + '%';
    playerHandle.style.left = pct + '%';
    playerTime.textContent = fmtTime(audioUser.currentTime) + ' / ' + fmtTime(audioUser.duration);
  });
  audioUser.addEventListener('error', () => {
    const e = audioUser.error;
    const msg = e ? ('code=' + e.code + ' ' + (e.message || '')) : 'unknown';
    console.error('Audio load error:', msg, 'src=', audioUser.src);
    setPlayerInfo('ERROR', '音源を読み込めません: ' + msg, false);
    setPlayerPlaying(false);
  });

  // Seek bar — クリックで位置移動
  playerSeekBar.addEventListener('click', (e) => {
    if (!audioUser.duration) return;
    const rect = playerSeekBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioUser.currentTime = pct * audioUser.duration;
  });

  // DEMO pills
  document.querySelectorAll('.demo-pill').forEach(pill => {
    pill.addEventListener('click', () => loadTrack(pill.dataset.track));
  });

  if (exportWavBtn) {
    exportWavBtn.addEventListener('click', exportCurrentWav);
  }

  // Draw SC graph initially
  drawScGraph();

  // VU + GR refresh
  setInterval(updateMeters, 30);
  setInterval(updateNarration, 250);

  // Window canvas
  resizeCanvas();
  attachWindowDrag();
  drawWindow();
  // window-card のサイズ変更に追従 (transform: scale, レイアウト変化, resize)
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(canvas.parentElement);
  }
  // 起動直後はレイアウトが確定していないことがあるので、複数回リトライ
  setTimeout(resizeCanvas, 50);
  setTimeout(resizeCanvas, 200);
  setTimeout(resizeCanvas, 500);

  applyLocale();
}

// ============================================================
// Sidechain SVG graph (filter shape)
// ============================================================
function drawScGraph() {
  const wrap = document.querySelector('.mini-card.sidechain .sc-graph');
  if (!wrap) return;
  const f = state.scFreq;
  const w = 96, h = 96;
  // x axis log 20..2000, y mag in dB, plot HPF response
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const freq = Math.exp(Math.log(20) + t * (Math.log(2000) - Math.log(20)));
    const x = 6 + t * (w - 12);
    // simple 1st-order HPF mag: |jw / (jw+wc)| → freq/sqrt(freq^2+f^2)
    const mag = freq / Math.sqrt(freq*freq + f*f);
    const dB = 20 * Math.log10(Math.max(1e-3, mag));
    const y = h - 8 - Math.max(-30, Math.min(0, dB)) * (h - 16) / 30;
    pts.push([x, y]);
  }
  const d = 'M ' + pts.map(p => p.join(' ')).join(' L ');
  const active = state.sc;
  wrap.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}">
      <rect x="2" y="2" width="${w-4}" height="${h-4}" rx="6" fill="rgba(0,0,0,0.55)" stroke="rgba(217,181,102,0.18)"/>
      <!-- grid -->
      <g stroke="rgba(245,240,230,0.08)" stroke-width="0.5">
        <line x1="6" y1="${h*0.25}" x2="${w-6}" y2="${h*0.25}"/>
        <line x1="6" y1="${h*0.5}" x2="${w-6}" y2="${h*0.5}"/>
        <line x1="6" y1="${h*0.75}" x2="${w-6}" y2="${h*0.75}"/>
      </g>
      <path d="${d}" fill="none" stroke="${active ? '#40ceb4' : 'rgba(180,200,195,0.35)'}" stroke-width="${active?2:1.4}"
            filter="${active ? 'drop-shadow(0 0 4px #40ceb4)' : ''}"/>
    </svg>
  `;
}

// ============================================================
// Meters
// ============================================================
// レベル (0..1 linear) を VU 高さ (%) へ対数 dB スケールで変換
//   -48 dB → 0%、 0 dB → 100%、 線形ではなく log マッピングで低音量域も視認可能
function levelToVuPct(level) {
  if (!level || level < 0.0006) return 0;
  const db = 20 * Math.log10(level);
  return Math.max(0, Math.min(100, (db + 48) / 48 * 100));
}
function updateMeters() {
  const inFill = document.getElementById('vuInFill');
  const outFill = document.getElementById('vuOutFill');
  const inPeak = document.getElementById('vuInPeak');
  const outPeak = document.getElementById('vuOutPeak');
  const inPeakFast = document.getElementById('vuInPeakFast');
  const outPeakFast = document.getElementById('vuOutPeakFast');
  const inNum = document.getElementById('vuInNum');
  const outNum = document.getElementById('vuOutNum');
  if (!inFill) return;
  // Fill: RMS 連動 (やや滑らか) を対数 dB スケールで
  inFill.style.height  = levelToVuPct(state.inLevel)  + '%';
  outFill.style.height = levelToVuPct(state.outLevel) + '%';
  // Peak hold (slow falling): 800ms 保持してゆっくり下がる
  inPeak.style.bottom  = levelToVuPct(state.inPeakHold)  + '%';
  outPeak.style.bottom = levelToVuPct(state.outPeakHold) + '%';
  // Fast bounce peak (snappy): peak で跳ねて約 0.5s で下がる
  if (inPeakFast)  inPeakFast.style.bottom  = levelToVuPct(state.inPeakBounce  || 0) + '%';
  if (outPeakFast) outPeakFast.style.bottom = levelToVuPct(state.outPeakBounce || 0) + '%';
  // dB labels
  const inDb = state.inLevel > 0.0008 ? (20 * Math.log10(state.inLevel)).toFixed(1) : '-∞';
  const outDb = state.outLevel > 0.0008 ? (20 * Math.log10(state.outLevel)).toFixed(1) : '-∞';
  inNum.textContent = inDb + ' dB';
  outNum.textContent = outDb + ' dB';

  // GR
  const grFill = document.getElementById('grFill');
  const grValue = document.getElementById('grValue');
  if (grFill) {
    grFill.style.width = Math.min(100, state.gr * 7) + '%';
    grValue.textContent = '-' + state.gr.toFixed(1) + ' dB';
  }
}

// ============================================================
// Live narration
// ============================================================
function buildNarration() {
  if (!state.playing) return t('liveDefault');
  if (state.bypass) return t('narration.bypass');
  // 音割れ警告: ヒビ演出と同時に教育メッセージを表示 (clipUntil 中のみ)
  const now = performance.now();
  if (state.clipUntil && now < state.clipUntil) {
    return t('clipWarn');
  }
  const at = statusOf('attack', state.attack);
  const ra = statusOf('ratio', state.ratio);
  const re = statusOf('release', state.release);
  const gr = state.gr;
  const inL = state.inLevel;
  let line1;
  if (inL < 0.02) line1 = t('narration.quiet');
  else if (gr < 0.5) line1 = t('narration.static');
  else line1 = fmt(t('narration.active'), { gr: gr.toFixed(1) });
  const sep = (locale === 'ja') ? '。' : '. ';
  const atDesc = (at && at !== 'idle') ? t('narration.at.' + at) : '';
  const raDesc = (ra && ra !== 'idle') ? t('narration.ra.' + ra) : '';
  const reDesc = (re && re !== 'idle') ? t('narration.re.' + re) : '';
  let line2 = '';
  if (gr > 0.5) line2 = [atDesc, raDesc, reDesc].filter(Boolean).join(sep) + (atDesc ? sep : '');
  else if (inL > 0.02 && atDesc) line2 = atDesc + sep;
  let line3 = '';
  if (state.makeup > 0.05) {
    const v = state.makeup.toFixed(1);
    if (state.makeup > gr + 1.5) line3 = fmt(t('narration.muOver'), { v });
    else if (state.makeup >= Math.max(0.5, gr - 1)) line3 = fmt(t('narration.muMatch'), { v });
    else line3 = fmt(t('narration.muLow'), { v });
  }
  return `${line1}<br>${line2}${line3}`;
}
function updateNarration() {
  const el = document.getElementById('liveBody');
  if (!el) return;
  el.innerHTML = buildNarration();
}

// ============================================================
// Learn overlay
// ============================================================
let learnOverlay = null, learnIdx = 0;
function openLearn() {
  if (learnOverlay) return;
  learnIdx = 0;
  const ov = document.createElement('div');
  ov.className = 'learn-overlay';
  ov.innerHTML = `
    <div class="learn-card">
      <div class="learn-progress" id="learnProg"></div>
      <div class="learn-step" id="learnStep">CHAPTER 1 / 7</div>
      <h3 class="learn-title" id="learnTitle"></h3>
      <div class="learn-body" id="learnBody"></div>
      <div class="learn-actions">
        <button class="cap-btn" id="learnPrev">◀ ${locale==='ja'?'前へ':'PREV'}</button>
        <button class="cap-btn" id="learnRestart" title="${locale==='ja'?'画面上のステップヒントをやり直す':'Restart in-app step hints'}">↻ ${locale==='ja'?'ツアーやり直す':'Restart Tour'}</button>
        <button class="cap-btn" id="learnClose">${locale==='ja'?'閉じる':'CLOSE'}</button>
        <button class="cap-btn is-active" id="learnNext">${locale==='ja'?'次へ ▶':'NEXT ▶'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);
  learnOverlay = ov;
  ov.querySelector('#learnPrev').addEventListener('click', () => { learnIdx = Math.max(0, learnIdx - 1); renderLearn(); });
  ov.querySelector('#learnClose').addEventListener('click', closeLearn);
  ov.querySelector('#learnRestart').addEventListener('click', () => {
    // 画面上のチュートリアルステップ (THRESHOLD → RATIO → BYPASS) をリセット、 next preset 選択で再起動
    state.tutorialStep = 0;
    state.preset = 'off';
    updateTutorialUI();
    savePersist();
    closeLearn();
  });
  ov.querySelector('#learnNext').addEventListener('click', () => {
    const steps = t('learnSteps');
    if (learnIdx < steps.length - 1) { learnIdx++; renderLearn(); }
    else closeLearn();
  });
  renderLearn();
}
function renderLearn() {
  if (!learnOverlay) return;
  const steps = t('learnSteps');
  const s = steps[learnIdx];
  learnOverlay.querySelector('#learnTitle').textContent = s.title;
  learnOverlay.querySelector('#learnBody').innerHTML = s.body;
  learnOverlay.querySelector('#learnStep').textContent = `${(locale==='ja'?'第':'CHAPTER ')}${learnIdx+1}${(locale==='ja'?' 章':'')} / ${steps.length}`;
  // progress bars
  const prog = learnOverlay.querySelector('#learnProg');
  prog.innerHTML = '';
  for (let i = 0; i < steps.length; i++) {
    const d = document.createElement('div');
    d.className = 'lp' + (i < learnIdx ? ' is-done' : i === learnIdx ? ' is-active' : '');
    prog.appendChild(d);
  }
  const nxt = learnOverlay.querySelector('#learnNext');
  nxt.textContent = (learnIdx === steps.length - 1) ? (locale==='ja' ? '完了 ✓' : 'DONE ✓') : (locale==='ja' ? '次へ ▶' : 'NEXT ▶');
  if (s.focus) state.focusKnob = s.focus;
}
function closeLearn() {
  if (!learnOverlay) return;
  learnOverlay.remove(); learnOverlay = null;
  state.focusKnob = null;
}

document.addEventListener('DOMContentLoaded', () => {
  function fit() {
    const stage = document.getElementById('scaler');
    const host = document.getElementById('viewportHost');
    if (!stage) return;
    // ── モバイル (≤ 768px): scaler を無効化し、 CSS の @media レイアウトに任せる ──
    if (window.innerWidth <= 768) {
      stage.style.transform = 'none';
      stage.style.marginBottom = '0';
      if (host) { host.style.overflowX = 'hidden'; host.style.overflowY = 'auto'; }
      // canvas を viewport に合わせて再計測 (drawWindow が dpr 込みで使う)
      const cv = document.getElementById('window');
      if (cv) { cv.style.width = '100%'; cv.style.height = '280px'; }
      return;
    }
    const designW = 1880, designH = 1700;
    const availW = window.innerWidth  - 24;
    const availH = window.innerHeight - 32;
    const sFit = Math.min(availW / designW, availH / designH, 1);
    // 可読性の下限 (= 文字が読める最小スケール)。 これ以下ならスクロール許可
    // 0.50 まで許容: 1440x900 (MacBook Air) で sFit=0.510 → 完全フィットさせる
    const sMin = 0.50;
    const s = Math.max(sFit, sMin);
    stage.style.transformOrigin = 'top center';
    stage.style.transform = `scale(${s})`;
    // 縮小後の余白調整 (縦)
    stage.style.marginBottom = ((designH * s) - designH) + 'px';
    // 下限まで cap した場合、 viewport を超えるのでスクロール許可
    if (host) {
      host.style.overflowX = (s > sFit) ? 'auto' : 'hidden';
      host.style.overflowY = (designH * s > availH) ? 'auto' : 'hidden';
    }
  }
  fit();
  window.addEventListener('resize', fit);
  // 永続化された設定を復元 (init より前に locale 復元、 init 内で適用される)
  const persisted = loadPersist();
  if (persisted) {
    if (persisted.locale && L[persisted.locale]) locale = persisted.locale;
    if (typeof persisted.protectLimit === 'boolean') state.protectLimit = persisted.protectLimit;
    if (typeof persisted.hpf === 'boolean') state.hpf = persisted.hpf;
    if (typeof persisted.tutorialStep === 'number') state.tutorialStep = persisted.tutorialStep;
    // preset / makeup は init 後に applyPreset で復元
  }
  init();
  // init 後に preset 復元 (init の applyPreset('off') より後に来るように)
  if (persisted && persisted.preset && PRESETS[persisted.preset]) {
    try { applyPreset(persisted.preset); } catch (e) {}
  }
  if (persisted && typeof persisted.makeup === 'number') {
    try { setMakeup(persisted.makeup); } catch (e) {}
  }
  // トグル UI を永続化された state に合わせる
  const protectBtn = document.getElementById('btnProtectLimit');
  if (protectBtn) protectBtn.classList.toggle('is-active', state.protectLimit);
  const hpfTog = document.querySelector('.toggle[data-tog="hpf"]');
  if (hpfTog) hpfTog.classList.toggle('is-active', state.hpf);
});
