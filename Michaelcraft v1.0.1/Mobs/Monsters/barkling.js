'use strict';
// =============================================================================
// BARKLING   (type 'barkling')
//   The Redwood's ambusher: a stump until you step close. Bites can poison.
// =============================================================================
defineMob('barkling', {
  // ---- STATS ----
  stats: {
    name: 'Barkling', w: 0.9, h: 1.9, speed: 2.0, health: 26, hostile: true, dmg: 4, kb: 0.6, reach: 0.5,
    sunproof: true, biome: 'redwood',
    loot: [[100, 1, 3, 0.8], [REDWOOD_LOG, 1, 2, 0.5], [BROWN_MUSHROOM_ITEM, 1, 2, 0.4], [RAW_REDWOOD, 1, 1, 0.12]],
    eye: [0, 0.14, '255,170,40'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 4, range: 24 },
  // ---- AI ----
  ai: 'melee',
  hooks: {
    meleeInit(m) { if (m.disguised === undefined) m.disguised = !B12.night && Math.random() < 0.7; },
    meleeHit(m, p) { if (Math.random() < 0.25) addFx12(p, 'poison', 3); },
  },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.barkling, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/ravager/idle', 4), vol: 0.8, pitch: [0.7, 0.9], cat: 'volCreatures' },
    hurt: { files: n_('mob/ravager/hurt', 4), vol: 0.9, pitch: [0.8, 1], cat: 'volCreatures' },
    death: { files: n_('mob/ravager/death', 3), vol: 0.9, pitch: [0.8, 1], cat: 'volCreatures' },
    step: { files: n_('mob/husk/step', 5), vol: 0.15, pitch: [0.7, 0.8], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- VISUALS (drawing and effects) ----
const BARK_P = { b: '#5a3a22', B: '#7a5030', d: '#3e2716', r: '#a0703e', g: '#3f7a2c', G: '#5aa03a', l: '#2c5a20', E: '#ffaa28', k: '#1a0f08', y: '#c9a35a', m: '#e8d070' };
const BARK_G = {
  crown: ['....gGg.......', '..gGGGgGg.lg..', '.gGGgGGGGgGGg.', 'gGGGGGlGGGGGgg', 'gGlGGGGGGGlGGg', '.gGGGGgGGGGGg.', '..ggGgggGgGl..', '....g..l..g...'],
  body: ['..bBBBb..', '.bBrBBdb.', 'bBBrBBBdb', 'bBdkBBkEb', 'bBdBBBBBb', 'bBBdkkkBb', 'bBrBkmkBb', 'bBrBBBBdb', 'bBdBBrBdb', 'bBBBBrBdb', '.bBdBBBb.', '.bBBdBBb.', '.bbBBBbb.'],
  arm: ['bB', 'Bb', 'bB', 'Bd', 'bBg', 'BbG', 'bB', 'dB', 'bB', 'b.b', 'b..b'],
  leg: ['bBb', 'BbB', 'bBd', 'bBb', 'Bbb', 'bBd', 'bBbb', 'dbBbb', 'd.b.b'],
  stump: ['..gG..g....', '.bBbBBbBb..', 'bBBrBBBdbb.', 'bBdBBBBBbb.', 'bBBrBBdBb..', 'bBrBBBBdb..', 'bBdBBrBdbb.', 'bdBBBBBrBdb', 'd.bdb.bdb.d'],
};
let BARK_R;
MOB_DRAW.barkling = (g, m, u, eyes) => {
  const p = n => mp14('barkling', n, BARK_G[n], BARK_P, { flat: 'Em' });
  if (m.disguised) { rig14(g, u, 24, 16, 12, 12, b => drawP14(b, p('stump'), 0, 0, 5, 8, 1)); return; }
  if (!BARK_R) BARK_R = {
    leg: p('leg'), legX: [-1.5, 1], hipY: -9, legA: [1, 0], body: [p('body'), 4, 12], head: [p('crown'), 7, 7, 0, -20], arm: p('arm'), armA: [1, 0], shX: [-3, 2.5], shY: -18,
    stride: 0.4, armSwing: 0.5, lean: 0.03, walkMul: 0.8, bob: 1,
    pose: (m) => chopPose14(m, 0.3),
  };
  rig14(g, u, 48, 44, 24, 40, b => biped14(b, m, 1, BARK_R));
  if (m.dying == null) eyes14(eyes, 3.5, -17.5, u, '255,170,40', 1.2);
};
