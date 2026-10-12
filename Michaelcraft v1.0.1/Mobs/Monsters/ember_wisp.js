'use strict';
// =============================================================================
// EMBER WISP   (type 'emberwisp')
//   A living flame of the Ashlands. Floats at a distance and throws fireballs (they set you alight).
// =============================================================================
defineMob('emberwisp', {
  // ---- STATS ----
  stats: {
    name: 'Ember Wisp', w: 0.7, h: 0.95, speed: 3.0, health: 9, hostile: true, dmg: 3, kb: 1.3, flying: true,
    fireproof: true, sunproof: true, biome: 'ash', glow: '255,140,40',
    loot: [[RAW_EMBER, 1, 1, 0.3], [117, 1, 2, 0.4]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  ai: 'hover',
  hooks: {
    hoverRange: 5,
    hoverCooldown: () => 2.8 + Math.random(),
    hoverShoot(m, p, a, mcx, mcy) {
      spawnBolt12({ x: mcx, y: mcy, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, kind: 'ember', dmg: 3, r: 0.3, life: 2.6, trail: true, fx: (pp) => { if (!hasFx12(pp, 'fireproof')) pp.fireT = Math.max(pp.fireT || 0, 3); } });
      sfx('mob.blaze', { x: mcx, y: mcy });
    },
    hoverTrail(m, mcx, mcy, dt) { if (Math.random() < dt * 10 * particleMul()) spawnFlame(mcx + (Math.random() - 0.5) * 0.4, mcy + 0.2); },
  },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  draw: wispDraw14('emberwisp', FLAME_FIRE14, '255,200,90'),
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/blaze/breathe', 4), vol: 0.8, pitch: [1.1, 1.4], cat: 'volCreatures' },
    hurt: { files: n_('mob/blaze/breathe', 4), vol: 0.9, pitch: [1.5, 1.8], cat: 'volCreatures' },
    death: { files: ['mob/blaze/death'], vol: 0.9, pitch: [1.2, 1.4], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});
