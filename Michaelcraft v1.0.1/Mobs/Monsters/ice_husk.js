'use strict';
// =============================================================================
// ICE HUSK   (type 'icehusk')
//   A frozen husk of the Frostlands. Its touch chills you (slow).
// =============================================================================
defineMob('icehusk', {
  // ---- STATS ----
  stats: {
    name: 'Ice Husk', w: 0.65, h: 1.9, speed: 1.9, health: 26, hostile: true, dmg: 4, kb: 0.7, reach: 0.45,
    sunproof: true, biome: 'frost',
    loot: [[133, 1, 2, 0.5], [FROST_CRYSTAL, 1, 1, 0.2], [118, 1, 1, 0.15], [FISH_IDS[2], 1, 1, 0.15]],
    eye: [1.5, 0.1, '120,230,255'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 4, range: 24 },
  // ---- AI ----
  ai: 'melee',
  hooks: { meleeHit(m, p) { addFx12(p, 'slow', 5); } },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.icehusk, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/husk/idle', 3), vol: 0.8, pitch: [0.75, 0.9], cat: 'volCreatures' },
    hurt: { files: n_('mob/husk/hurt', 2), vol: 0.9, pitch: [0.8, 0.95], cat: 'volCreatures' },
    death: { files: n_('mob/husk/death', 2), vol: 0.9, pitch: [0.8, 0.95], cat: 'volCreatures' },
    step: { files: n_('mob/husk/step', 5), vol: 0.15, pitch: [0.8, 0.9], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- VISUALS (drawing and effects) ----
const ICEHUSK_P = { h: '#dfeef6', H: '#b8d4e2', s: '#8fb4c8', S: '#7298ad', E: '#7ff4ff', m: '#203040', t: '#3a4d6b', T: '#4d6488', n: '#2a3650', b: '#5b4632', B: '#b0a070', k: '#1f2533', I: '#d8f6ff', i: '#8fdcf2' };
const ICEHUSK_G = {
  head: ['..I..I..', '.hhihhh.', 'hhhhhhhh', 'hHsssssh', 'Hsss.sEs', 'ssssssss', 'sSsssmms', '.sSssss.', '..SSss..'],
  body: ['.tttTt', 'ttTTtt', 'tttTsS', 'ItttTs', 'iItTtt', 'tttTtt', 'tTttst', 'ttTtss', 'bbbbBb', 'nnnnnn', 'nnnnnn'],
  arm: ['tTt', 'tTt', 'Ttt', 'sss', 'sIs', 'sis', 'sss', 'sSs', 'sss', 'SsS', 'SSS'],
  leg: ['nnnn', 'nnnn', 'nnin', 'nnnn', 'nIIn', 'nnnn', 'nnnn', 'nnnn', 'kkkk', 'kkkkk', 'kkkkk'],
};
let ICEHUSK_R;
MOB_DRAW.icehusk = (g, m, u, eyes) => {
  const R = ICEHUSK_R || (ICEHUSK_R = huskRig14('icehusk', ICEHUSK_G, ICEHUSK_P, {}));
  rig14(g, u, 44, 40, 22, 37, b => biped14(b, m, 1, R));
  if (m.dying == null) eyes14(eyes, 3.5, -24.5, u, '120,240,255', 1.1);
};
