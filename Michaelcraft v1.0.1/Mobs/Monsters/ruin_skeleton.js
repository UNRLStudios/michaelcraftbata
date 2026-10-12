'use strict';
// =============================================================================
// RUIN SKELETON   (type 'ruinskeleton')
//   Guards the Ancient Ruins.
// =============================================================================
defineMob('ruinskeleton', {
  // ---- STATS ----
  stats: {
    name: 'Ruin Skeleton', w: 0.65, h: 1.9, speed: 1.8, health: 22, hostile: true, dmg: 4, kb: 0.8, reach: 0.5,
    sunproof: true, ruin: true, loot: [[133, 1, 3, 0.8], [217, 1, 2, 0.3], [GOLD, 1, 2, 0.15], [15, 1, 3, 0.3]],
    eye: [1.5, 0.09, '70,220,240'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 4, range: 24 },
  // ---- AI ----
  ai: 'melee',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.ruinskeleton, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/husk/idle', 3), vol: 0.6, pitch: [1.3, 1.5], cat: 'volCreatures' },
    hurt: { files: terraria_('dd2_skeleton_hurt', 3), vol: 0.6, pitch: [0.9, 1.1], cat: 'volCreatures', synth: 'hit' },
    death: { files: terraria_('dd2_skeleton_death', 3), vol: 0.6, pitch: [0.9, 1.05], cat: 'volCreatures', synth: 'death' },
    step: { files: n_('mob/husk/step', 5), vol: 0.15, pitch: [1.4, 1.6], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- VISUALS (drawing and effects) ----
const SKEL_P = { w: '#e9e2cc', W: '#bdb497', k: '#1a1612', E: '#5ff0ff', h: '#9a7a3a', H: '#c9a24c', r: '#6e4a2c', R: '#8e5d33', q: '#a8a8a0', Q: '#d6d6cc', g: '#7c6236', x: '#3b2b1e' };
const SKEL_G = {
  head: ['.hhhhhh.', 'hHHHHHHh', 'hhhhhhhh', 'wwWwkwEw', 'wwwwkkkw', 'wWwwwwww', '.wwkwkwk', '..wwwww.'],
  body: ['..ww..', '.wwwww', 'wW.w.w', '.wwwww', 'wW.w.w', '.wwwww', '...w..', '...w..', 'rrRrrr', '.wWww.'],
  arm: ['ww', 'wW', 'ww', 'W.', 'ww', 'ww', 'wW', 'ww', 'ww', 'Ww'],
  leg: ['ww.', 'wW.', 'ww.', 'Ww.', 'ww.', 'Ww.', 'ww.', 'wW.', 'Ww.', 'www', 'wwww'],
  sword: ['.Q.', 'QqQ', 'QqQ', 'QqQ', 'QqQ', 'QqQ', 'QrQ', 'QqQ', 'QqQ', 'QqR', 'HhH', '.x.', '.x.', '.H.'],
};
let SKEL_R;
MOB_DRAW.ruinskeleton = (g, m, u, eyes) => {
  if (!SKEL_R) {
    const p = n => mp14('ruinskel', n, SKEL_G[n], SKEL_P, { flat: 'E' });
    const sword = p('sword');
    SKEL_R = {
      leg: p('leg'), legX: [-1, 1], hipY: -11, legA: [1, 0], body: [p('body'), 3, 9], head: [p('head'), 4, 7, 0.5, -19], arm: p('arm'), armA: [1, 0], shX: [-1.5, 0.5], shY: -19,
      stride: 0.5, armSwing: 0.5, lean: 0.03, headBob: true,
      pose: (m) => { const a = m.attackAnim || 0; return a > 0.02 ? { armF: a > 0.55 ? -2.8 : -2.8 + (0.55 - a) * 4.6, armB: 0.3 } : hostile14(m) ? { armF: -0.7 } : null; },
      held: (b) => drawP14(b, sword, 0.5, 0.5, 1, 11, 1, -Math.PI / 2 + 0.25),
    };
  }
  rig14(g, u, 56, 48, 28, 44, b => biped14(b, m, 1, SKEL_R));
  if (m.dying == null) eyes14(eyes, 3.5, -23.5, u, '70,220,240', 1.1);
};
