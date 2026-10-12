'use strict';
// =============================================================================
// MAGMA BRUTE   (type 'magmabrute')
//   Huge, in the Ashlands. Winds up and slams; the slam throws fire and burns you.
// =============================================================================
defineMob('magmabrute', {
  // ---- STATS ----
  stats: {
    name: 'Magma Brute', w: 1.5, h: 2.6, speed: 1.3, health: 75, hostile: true, dmg: 8, kb: 0.12, reach: 1.2,
    fireproof: true, sunproof: true, biome: 'ash', glow: '255,110,30',
    loot: [[RAW_EMBER, 2, 4, 1], [MAGMA_ROCK, 1, 3, 0.6], [EMBER_INGOT, 1, 1, 0.12], [EMBER_STAFF, 1, 1, 0.05], [LIGHTNING_ROD, 1, 1, 0.04]],
    eye: [0, 0.13, '255,200,80'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 3, range: 24 },
  // ---- AI ----
  ai: 'slammer',
  hooks: {
    slamDust: ['#ff8a1e', '#ffd05a', '#3a2a30'],
    onSlam(m, fx, fy) { for (let s = -1; s <= 1; s += 2) for (let k = 1; k <= 5; k++) spawnFlame(fx + s * k * 0.8, fy - 0.2); },
    slamHit(m, p) { if (!hasFx12(p, 'fireproof')) p.fireT = Math.max(p.fireT || 0, 4); },
  },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  draw: golemDraw14('magmabrute', { P: { L: '#4a4450', B: '#2e2a34', b: '#1e1b24', d: '#151218', c: '#ff8a1a', C: '#ffe07a', E: '#ffd04a', H: '#d8c8a8' }, k: { seed: 523, core: 1, cracks: 9, flat: '',
    mod: G => { G.head = ['H......H', 'H.LLLL.H', 'HLLLLLLH', 'BBBBBBBB', 'BbbbbbbB', 'BBBBEEEB', 'BcBBBBcB', '.BbbbbB.']; } }, eye: '255,200,80' }),
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/ravager/idle', 4), vol: 0.8, pitch: [0.45, 0.6], cat: 'volCreatures' },
    hurt: { files: n_('mob/ravager/hurt', 4), vol: 0.9, pitch: [0.5, 0.65], cat: 'volCreatures' },
    death: { files: n_('mob/ravager/death', 3), vol: 0.9, pitch: [0.5, 0.65], cat: 'volCreatures' },
    step: { files: n_('mob/irongolem/hit', 4), vol: 0.3, pitch: [0.4, 0.5], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});
