'use strict';
// =============================================================================
// CRIMSON HUSK   (type 'crimsonhusk')
//   A night husk: every few seconds it surges forward, and its bite makes you hungry.
// =============================================================================
defineMob('crimsonhusk', {
  // ---- STATS ----
  stats: {
    name: 'Crimson Husk', w: 0.65, h: 1.9, speed: 2.5, health: 32, hostile: true, dmg: 5, kb: 0.6, reach: 0.45,
    sunproof: true, nocturnal: true, loot: [[BLOOD_SHARD, 1, 2, 0.5], [133, 1, 2, 0.5], [122, 1, 2, 0.4]],
    eye: [1.5, 0.1, '255,50,50'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 4, range: 24 },
  // ---- AI ----
  ai: 'melee',
  hooks: {
    meleeSpeed(m) { return Game.time % 5 < 1 ? 1.5 : 1; },
    meleeHit(m, p) { if (Game.creative !== true) p.hunger = Math.max(0, p.hunger - 0.5); },
  },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.crimsonhusk, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/husk/idle', 3), vol: 0.8, pitch: [0.55, 0.7], cat: 'volCreatures' },
    hurt: { files: n_('mob/husk/hurt', 2), vol: 0.9, pitch: [0.6, 0.75], cat: 'volCreatures' },
    death: { files: n_('mob/husk/death', 2), vol: 0.9, pitch: [0.6, 0.75], cat: 'volCreatures' },
    step: { files: n_('mob/husk/step', 5), vol: 0.15, pitch: [0.7, 0.8], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- VISUALS (drawing and effects) ----
const CRIMSON_P = { h: '#2a0e10', s: '#a8333a', S: '#7a1f27', E: '#ff3b3b', m: '#1a0406', w: '#e8dcc8', W: '#bfae92', t: '#3d1418', T: '#5a1d22', n: '#2a1418', k: '#140a0c', r: '#d24848', c: '#efe4cf' };
const CRIMSON_G = {
  head: ['..hhhh..', '.hhhhhhh', 'hhhsssss', 'hssss.Es', 'sssssssS', 'sSsssmwm', '.sSsmmmS', '..SSsww.'],
  body: ['.tTTtt', 'tTsSTt', 'tTwSwt', 'tTSwSt', 'tTwSwt', 'tTSSst', 'ttrTtt', 'tTtTtt', 'kkkkkk', 'nnnnnn', 'nnTnnn'],
  arm: ['tTt', 'tTt', 'sss', 'sSs', 'srs', 'sss', 'SsS', 'sss', 'sSs', 'SSS', 'c.c'],
  leg: ['nnnn', 'nnTn', 'nnnn', 'nsnn', 'nSsn', 'nnnn', 'nnnn', 'nnnn', 'kkkk', 'kkkkk', 'kkkkk'],
};
let CRIMSON_R;
MOB_DRAW.crimsonhusk = (g, m, u, eyes) => {
  const R = CRIMSON_R || (CRIMSON_R = huskRig14('crimsonhusk', CRIMSON_G, CRIMSON_P, { lean: 0.11 }));
  rig14(g, u, 44, 40, 22, 37, b => {
    biped14(b, m, 1, R);
    if (Math.floor(Game.time * 1.3 + m.id) % 3 === 0) px14(b, 3, -15 + (Game.time * 20 % 6), 1, 1, '#8a0f18');   // dripping
  });
  if (m.dying == null) eyes14(eyes, 3.5, -24.2, u, '255,50,50', 1.1);
};
