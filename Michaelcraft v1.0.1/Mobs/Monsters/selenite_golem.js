'use strict';
// =============================================================================
// SELENITE GOLEM   (type 'selenitegolem')
//   A crystal golem of the Moon. Winds up and slams.
// =============================================================================
defineMob('selenitegolem', {
  // ---- STATS ----
  stats: {
    name: 'Selenite Golem', w: 1.4, h: 2.6, speed: 1.2, health: 90, hostile: true, dmg: 8, kb: 0.12, reach: 1.2,
    sunproof: true, moon: true,
    loot: [[LUNARITE, 2, 4, 1], [MOON_ROCK, 2, 5, 0.8], [MOON_CRYSTAL_SHARD, 1, 3, 0.6], [STAR_FRAGMENT, 1, 2, 0.4]],
    eye: [0, 0.14, '200,140,255'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 3, range: 24 },
  // ---- AI ----
  ai: 'slammer',
  hooks: { slamDust: ['#9aa592', '#6c7468'] },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  draw: golemDraw14('selenitegolem', { P: { L: '#f4f2ff', B: '#d2cfe6', b: '#a9a4c8', d: '#8f89b5', c: '#b48cff', C: '#f0e4ff', E: '#c8a8ff', I: '#ffffff', i: '#cdb6ff' }, k: { seed: 377, core: 1, cracks: 2,
    mid: (b) => { for (const [x, y, h, a] of [[-8, -25, 5, -0.4], [-6, -27, 7, -0.1], [-3, -27, 4, 0.2]]) { line14(b, x, y, x + Math.sin(a) * h, y - h, '#cdb6ff', 2); px14(b, x + Math.sin(a) * h, y - h - 1, 1, 1, '#ffffff'); } } }, eye: '190,150,255' }),
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/ravager/idle', 4), vol: 0.6, pitch: [0.45, 0.55], cat: 'volCreatures' },
    hurt: { files: n_('mob/irongolem/hit', 4), vol: 0.8, pitch: [0.55, 0.7], cat: 'volCreatures', synth: 'hit' },
    death: { files: n_('mob/ravager/death', 3), vol: 0.8, pitch: [0.5, 0.6], cat: 'volCreatures', synth: 'death' },
    step: { files: n_('mob/irongolem/hit', 4), vol: 0.18, pitch: [0.35, 0.45], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});
