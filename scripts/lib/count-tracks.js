/**
 * H/MIX GALLERY — count-tracks.js
 * tracks 配列から件数集計を行う。プレースホルダ置換の単一ソース。
 *
 * ルール（設計書 2.6 節）:
 *  - total: 楽曲総数
 *  - byStyle / byFeeling / byScene / byStory: タグIDごとの件数
 *  - genre: ジャンルページで使う集計ルール（複合タグを合算）
 */
function countTracks(tracks) {
  const byStyle   = {}, byFeeling = {}, byScene = {}, byStory = {};
  tracks.forEach(t => {
    (t.style   || []).forEach(k => byStyle[k]   = (byStyle[k]   || 0) + 1);
    (t.feeling || []).forEach(k => byFeeling[k] = (byFeeling[k] || 0) + 1);
    (t.scene   || []).forEach(k => byScene[k]   = (byScene[k]   || 0) + 1);
    (t.story   || []).forEach(k => byStory[k]   = (byStory[k]   || 0) + 1);
  });

  // ─ ユニーク数で合算するためのヘルパー（OR条件） ─
  function uniqWhere(fn) {
    return tracks.filter(fn).length;
  }
  function has(t, cat, ids) {
    const arr = t[cat] || [];
    return ids.some(id => arr.includes(id));
  }

  // ─ ジャンルページ用の集計ルール ─
  // 複合タグを持つ曲が重複カウントされないよう、ユニークで数える
  const genre = {
    japanese:   uniqWhere(t => has(t, 'style', ['japanese', 'japanese_horror', 'oriental'])),
    horror:     uniqWhere(t => has(t, 'feeling', ['scary']) || has(t, 'style', ['japanese_horror', 'western_horror'])),
    fantasy:    byStyle.fantasy || 0,
    battle:     uniqWhere(t => has(t, 'scene', ['battle', 'boss'])),
    healing:    uniqWhere(t => has(t, 'feeling', ['gentle']) || has(t, 'story', ['peaceful'])),
    sad:        byFeeling.sad || 0,
    epic:       byFeeling.epic || 0,
    happy:      uniqWhere(t => has(t, 'feeling', ['happy', 'cute'])),
    suspense:   byFeeling.suspense || 0,
    celtic:     byStyle.celtic || 0,
    electronic: uniqWhere(t => has(t, 'style', ['electronic', 'futuristic'])),
  };

  return {
    total: tracks.length,
    byStyle, byFeeling, byScene, byStory,
    genre,
  };
}

/**
 * プレースホルダ `{{COUNT:path}}` を解決する。
 *   {{COUNT:total}}
 *   {{COUNT:style.japanese}}
 *   {{COUNT:feeling.sad}}
 *   {{COUNT:scene.battle}}
 *   {{COUNT:story.hope}}
 *   {{COUNT:genre.japanese}}
 */
function resolveCount(counts, spec) {
  if (!spec) return null;
  const s = String(spec).trim();
  if (s === 'total') return counts.total;
  const dot = s.indexOf('.');
  if (dot < 0) return null;
  const ns = s.substring(0, dot);
  const key = s.substring(dot + 1);
  const map = {
    style:   counts.byStyle,
    feeling: counts.byFeeling,
    scene:   counts.byScene,
    story:   counts.byStory,
    genre:   counts.genre,
  }[ns];
  if (!map) return null;
  return Number.isFinite(map[key]) ? map[key] : null;
}

/**
 * HTML 文字列内の `{{COUNT:xxx}}` プレースホルダをすべて置換する。
 * 副作用: 置換後に隣接コメント `<!--COUNT:xxx-->` を挿入して round-trip 可能にする。
 * 既に `<!--COUNT:xxx-->NNN` の形で焼き込まれていた場合、数値を最新値で更新する。
 * 返り値: { html, replaced, unresolved }
 */
function applyCountPlaceholders(html, counts) {
  let replaced = 0;
  const unresolved = [];

  // 1) `{{COUNT:xxx}}` → `<!--COUNT:xxx-->NNN`（初回投入）
  let out = html.replace(/\{\{COUNT:([a-zA-Z0-9_.]+)\}\}/g, (match, spec) => {
    const v = resolveCount(counts, spec);
    if (v === null || v === undefined) {
      unresolved.push(spec);
      return match;
    }
    replaced++;
    return `<!--COUNT:${spec}-->${v}`;
  });

  // 2) `<!--COUNT:xxx-->NNN` の数値を最新値で更新（再ビルド時）
  out = out.replace(/<!--COUNT:([a-zA-Z0-9_.]+)-->(\d+)/g, (match, spec, oldVal) => {
    const v = resolveCount(counts, spec);
    if (v === null || v === undefined) {
      unresolved.push(spec);
      return match;
    }
    if (String(v) !== oldVal) replaced++;
    return `<!--COUNT:${spec}-->${v}`;
  });

  return { html: out, replaced, unresolved };
}

module.exports = { countTracks, resolveCount, applyCountPlaceholders };
