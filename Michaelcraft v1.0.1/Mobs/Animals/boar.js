'use strict';
// =============================================================================
// BOAR   (type 'grazer')
//   A farm animal. Wanders and grazes, runs when hit, follows you while you hold an apple.
//   Feed two and they make a piglet.
// =============================================================================
defineMob('grazer', {
  // ---- STATS ----
  stats: {
    name: 'Boar', w: 1.3, h: 0.95, speed: 1.7, health: 8, hostile: false, dmg: 0, kb: 1, livestock: true,
    breedItems: [121],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 3, range: 16 },
  // ---- AI ----
  brain: livestockBrain,
  // ---- VISUALS ----
  draw: drawBoar,
  deathColors: ['#8a5a3b', '#c49a72'],
  // ---- SOUNDS ----
  soundPrefix: 'boar',
  sounds: {
    say: { files: n_('mob/pig/say', 3), vol: 0.8, pitch: [0.7, 0.9], cat: 'volFriendly' },
    hurt: { files: n_('mob/pig/say', 3), vol: 0.9, pitch: [0.9, 1.1], cat: 'volFriendly', synth: 'hit' },
    death: { files: ['mob/pig/death'], vol: 0.9, pitch: [0.8, 0.9], cat: 'volFriendly', synth: 'death' },
    step: { files: n_('mob/pig/step', 5), vol: 0.15, pitch: [0.9, 1.1], cat: 'volFriendly' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    const r = Math.random;
    spawnDrop(122, 1 + Math.floor(r() * 2), mx, my);
    spawnDrop(124, 1 + Math.floor(r() * 2), mx, my);
  },
});

// ---- VISUALS (drawing and effects) ----
// ---- Boar (passive): stocky bristly hog with tusks and a dark mane ----
const BOAR_C = {
  F: '#8a5a3b', f: '#6b442c', l: '#a8744f', m: '#3f2819', b: '#c49a72', S: '#d99a86', N: '#5a2a22',
  T: '#efe6d2', K: '#140c08', w: '#ffffff', H: '#2b1d14', E: '#b0685a'
};
const BOAR_BODY = [
  '...mmmmmmmmmm...',
  '..mmFlFFFFlFmm..',
  '.mFFFFFlFFFFFFm.',
  'mFFlFFFFFFFlFFFF',
  'FFFFFFFFlFFFFFFF',
  'fFFFFlFFFFFFFFFF',
  'ffFFFFFFFFFFFFFF',
  '.ffbbbbbbbbbbbf.',
  '..ffffffffffff..',
];
const BOAR_HEAD = [
  '.mm......',
  'mEFm.....',
  'mFFFFF...',
  'FFFwKFFF.',
  'FFFKKFFSS',
  'fFFFFFSSN',
  'ffFFFTSSS',
  '.fffT....',
];
const BOAR_LEG = ['FFf', 'FFf', 'fFf', 'fff', 'HHH'];
const BOAR_TAIL = ['mm.', 'm..', '.m.'];
function drawBoar(g, m, u) {
  const walk = Math.abs(m.vx) > 0.1;
  const ph = m.legPhase;
  const sw = walk ? Math.sin(ph) * 0.55 : 0;
  const bob = walk ? Math.abs(Math.sin(ph)) * 0.5 * u : 0;
  const ox = -11 * u, oy = -15 * u;
  const far = darker(BOAR_C, 0.3);
  drawPart(g, BOAR_LEG, far, ox + 6.5 * u, oy + 10 * u, 1.5, 0, -sw, u);
  drawPart(g, BOAR_LEG, far, ox + 16.5 * u, oy + 10 * u, 1.5, 0, sw, u);
  drawPart(g, BOAR_TAIL, BOAR_C, ox + 1.5 * u, oy + 5 * u + bob, 1, 0, Math.sin(Game.time * 6 + m.id) * 0.3, u);
  drawPix(g, BOAR_BODY, BOAR_C, ox + 2 * u, oy + 4 * u + bob, u);
  drawPart(g, BOAR_LEG, BOAR_C, ox + 4.5 * u, oy + 10 * u, 1.5, 0, sw, u);
  drawPart(g, BOAR_LEG, BOAR_C, ox + 14.5 * u, oy + 10 * u, 1.5, 0, -sw, u);
  // head: dips to the ground to graze, nods while walking
  const graze = m.graze > 0 ? Math.min(1, m.graze * 3) * (0.55 + Math.sin(Game.time * 9) * 0.06) : 0;
  const nod = walk ? Math.sin(ph * 2) * 0.06 : 0;
  drawPart(g, BOAR_HEAD, BOAR_C, ox + 16 * u, oy + 7 * u + bob, 1, 5, graze + nod, u);
}
