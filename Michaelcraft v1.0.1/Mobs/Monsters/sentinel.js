'use strict';
// =============================================================================
// SENTINEL   (type 'sentinel')
//   An ancient guardian of the Ruins. Winds up and slams.
// =============================================================================
defineMob('sentinel', {
  // ---- STATS ----
  stats: {
    name: 'Sentinel', w: 1.3, h: 2.5, speed: 1.1, health: 65, hostile: true, dmg: 7, kb: 0.1, reach: 1.2,
    sunproof: true, ruin: true, loot: [[ANCIENT_METAL, 1, 1, 0.25], [RUIN_BRICKS, 2, 4, 0.7], [134, 1, 2, 0.3]],
    eye: [0, 0.14, '70,220,240'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 3, range: 24 },
  // ---- AI ----
  ai: 'slammer',
  hooks: { slamDust: ['#9aa592', '#6c7468'] },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  draw: golemDraw14('sentinel', { P: { L: '#8e927e', B: '#6f735f', b: '#55594a', d: '#454838', c: '#46e6ff', C: '#c8ffff', E: '#7ff4ff', g: '#4f8a3a', G: '#6aa84a' }, k: { seed: 901, core: 1, cracks: 0,
    mod: G => { G.body[0] = G.body[0].replace(/L{3}/, 'gGg'); G.body[1] = G.body[1].replace(/L{4}$/, 'GgG.').padEnd(16, '.').slice(0, 16); G.arm[0] = 'gGgLLL'; G.head[0] = '.LgGgL.'; for (const y of [12, 14, 16]) G.body[y] = G.body[y].slice(0, 4) + 'c' + G.body[y].slice(5); } }, eye: '70,220,240' }),
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/ravager/idle', 4), vol: 0.8, pitch: [0.55, 0.7], cat: 'volCreatures' },
    hurt: { files: n_('mob/irongolem/hit', 4), vol: 0.9, pitch: [0.7, 0.85], cat: 'volCreatures' },
    death: { files: n_('mob/ravager/death', 3), vol: 0.9, pitch: [0.6, 0.75], cat: 'volCreatures' },
    step: { files: n_('mob/irongolem/hit', 4), vol: 0.3, pitch: [0.45, 0.55], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});
