'use strict';
// =============================================================================
// INFERNAL BRUTE   (type 'infernalbrute')
//   The Underworld's heavy: winds up and slams; its slam glows.
// =============================================================================
defineMob('infernalbrute', {
  // ---- STATS ----
  stats: {
    name: 'Infernal Brute', w: 1.5, h: 2.7, speed: 1.6, health: 130, hostile: true, dmg: 13, kb: 0.1, reach: 1.3,
    sunproof: true, fireproof: true, under: true, demon: true,
    loot: [[DEMON_HORN, 1, 2, 0.8], [HELLSTONE, 2, 4, 0.8], [HELLSTONE_INGOT, 1, 1, 0.25], [134, 2, 4, 0.4]],
    eye: [0, 0.14, '255,200,60'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 3, range: 24 },
  // ---- AI ----
  ai: 'slammer',
  hooks: { slamDust: ['#9aa592', '#6c7468'] },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.infernalbrute, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/ravager/idle', 4), vol: 0.9, pitch: [0.45, 0.55], cat: 'volCreatures', synth: 'growl' },
    hurt: { files: n_('mob/ravager/hurt', 4), vol: 0.9, pitch: [0.5, 0.6], cat: 'volCreatures', synth: 'hit' },
    death: { files: n_('mob/ravager/death', 3), vol: 1, pitch: [0.45, 0.5], cat: 'volCreatures', synth: 'death' },
    step: { files: n_('mob/ravager/step', 4), vol: 0.3, pitch: [0.6, 0.7], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- VISUALS (drawing and effects) ----
const IBRUTE_P = { r: '#b0262a', R: '#d43c34', d: '#7a141c', k: '#1a0606', h: '#2a1c1a', H: '#4e3a34', E: '#ffe14a', c: '#ff8a1a', C: '#ffe07a', t: '#e8d8b8', f: '#3a1412', m: '#2a0608' };
const IBRUTE_G = {
  head: ['H..........H', 'hH........Hh', '.hH.rRRr.Hh.', '..hrRRRRRrh.', '..rRRRRRRRr.', '..rRRkkRkER.', '..rRRRRRRRRr', '..rRRRmmmmmm', '..drRRmtmtmt', '...drRRRRRr.', '....dddddd..'],
  body: ['....rrRRrr....', '..rRRRRRRRRr..', '.rRRRRRRRRRRr.', 'rRRRRRcRRRRRRr', 'rRRRRcCcRRRRRr', 'rRRRRRcRRcRRRr', 'drRRRRRRcRRRRd', '.drRRRRcRRRRd.', '.drRRRRRRRRRd.', '..drRRRRRRRd..', '..kkkkhkkkkk..', '..hhhhhhhhhh..'],
  arm: ['.rRRRr', 'rRRRRR', 'rRRRRR', 'rRRcRR', 'rRRRRr', '.rRRR.', '.rRRR.', '.rRcR.', '.rRRR.', 'rRRRRr', 'rRRRRR', 'rRRRRR', '.dRRd.', 'tt.t.t'],
  leg: ['rRRRr', 'rRRRR', 'rRRRR', 'drRRR', '.rRRR', '.rRRd', '.rRR.', '.dRR.', '.rRRr', 'hhhhhh', 'hhhhhhh'],
};
let IBRUTE_R;
MOB_DRAW.infernalbrute = (g, m, u, eyes) => {
  if (!IBRUTE_R) {
    const p = n => mp14('ibrute', n, IBRUTE_G[n], IBRUTE_P, { flat: 'cCE' });
    IBRUTE_R = {
      leg: p('leg'), legX: [-3, 2.5], hipY: -11, legA: [2, 0], body: [p('body'), 7, 11], head: [p('head'), 6, 10, 2, -24], arm: p('arm'), armA: [3, 1], shX: [-5.5, 5], shY: -23,
      stride: 0.38, armSwing: 0.4, lean: 0.06, walkMul: 0.75, bob: 1.2,
      pose: (m) => slamPose14(m) || chopPose14(m, 0.2),
      after: (b) => { if (m_slamGlow14) { b.globalAlpha = 0.5; disk14(b, 0, -27, 6, 3, '#ff8a1a'); b.globalAlpha = 1; } },
    };
  }
  m_slamGlow14 = m.slam === 'windup';
  rig14(g, u, 64, 64, 32, 60, b => biped14(b, m, 1, IBRUTE_R));
  if (m.dying == null) eyes14(eyes, 6.5, -29.5, u, '255,225,74', 1.4);
};
let m_slamGlow14 = false;
