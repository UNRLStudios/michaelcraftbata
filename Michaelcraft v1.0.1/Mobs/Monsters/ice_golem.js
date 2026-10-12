'use strict';
// =============================================================================
// ICE GOLEM   (type 'icegolem')
//   Rare, in the ice caves. Winds up, slams; the slam chills you.
// =============================================================================
defineMob('icegolem', {
  // ---- STATS ----
  stats: {
    name: 'Ice Golem', w: 1.4, h: 2.7, speed: 1.2, health: 85, hostile: true, dmg: 8, kb: 0.12, reach: 1.2,
    sunproof: true, biome: 'frost',
    loot: [[FROST_CRYSTAL, 3, 6, 1], [PACKED_ICE, 2, 5, 0.8], [IRON, 1, 3, 0.5], [FROST_BLADE, 1, 1, 0.08], [GLACIER_HAMMER, 1, 1, 0.04], [FROST_WAND, 1, 1, 0.06]],
    eye: [0, 0.12, '200,250,255'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 3, range: 24 },
  // ---- AI ----
  ai: 'slammer',
  hooks: {
    slamDust: ['#e8f8ff', '#8cc4ec'],
    slamHit(m, p) { addFx12(p, 'slow', 6); },
  },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  draw: golemDraw14('icegolem', { P: { L: '#d6f2ff', B: '#9fd4ee', b: '#6fa8cc', d: '#5a8fb4', c: '#bff8ff', C: '#ffffff', E: '#e8ffff', I: '#eafcff', i: '#7fe0ff' }, k: { seed: 711, core: 1, cracks: 3,
    mod: G => { G.arm[0] = '.I..I.'; G.arm.unshift('..I...'); G.head[0] = '.LLILL.'; },
    mid: (b) => { for (const [x, y, h] of [[-8, -26, 4], [-6, -27, 6], [-3.5, -27, 3]]) { line14(b, x, y, x - 1, y - h, '#eafcff', 2); px14(b, x - 1, y - h - 1, 1, 1, '#ffffff'); } } }, eye: '200,250,255' }),
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/ravager/idle', 4), vol: 0.8, pitch: [0.5, 0.65], cat: 'volCreatures' },
    hurt: { files: n_('mob/irongolem/hit', 4), vol: 0.9, pitch: [0.6, 0.75], cat: 'volCreatures' },
    death: { files: n_('mob/ravager/death', 3), vol: 0.9, pitch: [0.55, 0.7], cat: 'volCreatures' },
    step: { files: n_('mob/irongolem/hit', 4), vol: 0.3, pitch: [0.4, 0.5], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});
