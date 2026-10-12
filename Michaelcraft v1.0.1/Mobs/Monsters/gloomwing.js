'use strict';
// =============================================================================
// GLOOMWING   (type 'gloomwing')
//   A cave bat. Flies, circles above you, then dives in.
// =============================================================================
defineMob('gloomwing', {
  // ---- STATS ----
  stats: {
    name: 'Gloomwing', w: 0.9, h: 0.6, speed: 4.2, health: 6, hostile: true, dmg: 2, kb: 1.5, flying: true,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  brain: swoopBrain,
  // ---- VISUALS ----
  draw: batDraw14('gloomwing', { P: { b: '#1c1430', B: '#33284d', e: '#241a3a', E: '#c9788f', Y: '#ffe14a', t: '#f0f0f0', f: '#4a3a66' },
    body: ['.......e.e..', '......eEeE..', '..bbbBBBBBB.', '.bBBBBBBBYBB', 'bbBBfBBBBBBB', '.bbBBfBBBtBt', '..bbBBBBB...', '...e..e.....'],
    wing: { m: '#3e2f60', m2: '#56437f', b: '#1a1230', ol: OL14 }, span: 14, eye: [5, -1, '255,225,74'], spanX: 14 }),
  deathColors: ['#372a50', '#4b3b6e'],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/bat/idle', 4), vol: 0.5, pitch: [0.7, 0.9], cat: 'volCreatures', synth: 'screech' },
    hurt: { files: n_('mob/bat/hurt', 4), vol: 0.8, pitch: [0.8, 1], cat: 'volCreatures', synth: 'hit' },
    death: { files: ['mob/bat/death'], vol: 0.8, pitch: [0.8, 1], cat: 'volCreatures', synth: 'death' },
    swoop: { files: ['mob/bat/takeoff'], vol: 0.9, pitch: [0.7, 0.8], cat: 'volCreatures', synth: 'screech' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    const r = Math.random;
    if (r() < 0.3) spawnDrop(117, 1, mx, my);
  },
});
