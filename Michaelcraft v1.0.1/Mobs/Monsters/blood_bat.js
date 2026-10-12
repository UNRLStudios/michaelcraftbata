'use strict';
// =============================================================================
// BLOOD BAT   (type 'bloodbat')
//   A night bat: circles above you, then dives. Gone by day.
// =============================================================================
defineMob('bloodbat', {
  // ---- STATS ----
  stats: {
    name: 'Blood Bat', w: 0.9, h: 0.55, speed: 5.0, health: 7, hostile: true, dmg: 2, kb: 1.5, flying: true,
    sunproof: true, nocturnal: true, loot: [[BLOOD_SHARD, 1, 1, 0.12]], eye: [0, 0.4, '255,220,80'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  brain: swoopBrain,
  // ---- VISUALS ----
  draw: batDraw14('bloodbat', { P: { b: '#3a0a12', B: '#6e1420', e: '#4a0c14', E: '#e05a6a', Y: '#ffd84a', t: '#ffffff', f: '#8e2230' },
    body: ['.......e.e..', '......eEeE..', '..bbbBBBBBB.', '.bBBBBBBBYBB', 'bbBBfBBBBBBB', '.bbBBfBBtBtB', '..bbBBBB.t.t', '...e..e.....'],
    wing: { m: '#5a0e18', m2: '#7e1a26', b: '#2a060c', ol: OL14 }, span: 15, eye: [5, -1, '255,220,80'] }),
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/bat/idle', 4), vol: 0.8, pitch: [0.9, 1.1], cat: 'volCreatures' },
    hurt: { files: n_('mob/bat/hurt', 4), vol: 0.9, pitch: [0.9, 1.1], cat: 'volCreatures' },
    death: { files: ['mob/bat/death'], vol: 0.9, pitch: [0.9, 1.1], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});
