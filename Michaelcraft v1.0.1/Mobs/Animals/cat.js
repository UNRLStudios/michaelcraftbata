'use strict';
// =============================================================================
// CAT   (type 'cat')
//   A pet. Tame a wild one with raw fish. Wild cats dart away from anyone rushing at them.
//   Cave Crawlers won't go near a cat.
// =============================================================================
defineMob('cat', {
  // ---- STATS ----
  stats: {
    name: 'Cat', w: 0.7, h: 0.55, speed: 3.1, health: 10, tamedHealth: 10, hostile: false, dmg: 0, kb: 1.2,
    pet: true, tameItem: 122, breedItems: [122, 132], variants: 4,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 6, range: 24 },
  // ---- AI ----
  brain: petBrain,
  hooks: {
    petSound: catSound,
    wildReact: catDart,
    tameSound: 'cat.purreow',
  },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  draw: drawCat,
  deathColors: ['#e08a3a', '#eeeeee'],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/cat/meow', 4), vol: 0.6, pitch: [0.9, 1.1], cat: 'volFriendly' },
    purr: { files: n_('mob/cat/purr', 3), vol: 0.6, pitch: [0.9, 1.1], cat: 'volFriendly' },
    purreow: { files: n_('mob/cat/purreow', 2), vol: 0.6, pitch: [0.9, 1.1], cat: 'volFriendly' },
    hiss: { files: n_('mob/cat/hiss', 3), vol: 0.6, pitch: [0.9, 1.1], cat: 'volFriendly' },
    hurt: { files: n_('mob/cat/hitt', 3), vol: 0.8, pitch: [0.9, 1.1], cat: 'volFriendly', synth: 'hit' },
    death: { files: n_('mob/cat/hitt', 3), vol: 0.8, pitch: [0.7, 0.8], cat: 'volFriendly', synth: 'death' },
    eat: { files: n_('mob/cat/eat', 2), vol: 0.7, pitch: [0.9, 1.1], cat: 'volFriendly' },
    beg: { files: n_('mob/cat/beg', 3), vol: 0.6, pitch: [0.9, 1.1], cat: 'volFriendly' },
  },
  // ---- LOOT ----
  // (drops nothing)
});

// ---- AI ----
function catSound(m) { return m.tamed ? (Math.random() < 0.5 ? 'cat.purr' : 'cat.purreow') : 'cat.say'; }
// a wild cat darts away from anyone rushing at it
function catDart(m, p, dx, dist) {
  if (dist < 3.5 && Math.abs(p.vx) > MOVE_SPEED * 0.9 && Math.sign(p.vx) === Math.sign(-dx)) { m.state = 'flee'; m.stateTimer = 1.5; m.fleeDir = dx > 0 ? -1 : 1; }
}

// ---- VISUALS (drawing and effects) ----
// ---- Cat: pointed ears, long curling tail, four coat colours ----
const CAT_COATS = [
  { F: '#e08a3a', f: '#b8652a', x: '#a8541f', b: '#f5d0a0', K: '#3f8f3a' },   // orange tabby
  { F: '#2a2a30', f: '#1a1a1f', x: '#1a1a1f', b: '#3a3a42', K: '#d8c83a' },   // black
  { F: '#8a8e96', f: '#6a6e76', x: '#5a5e66', b: '#c8ccd2', K: '#3f8f3a' },   // grey tabby
  { F: '#eeeeee', f: '#c8c8c8', x: '#dcdcdc', b: '#ffffff', K: '#4a7ad8' },   // white
];
const CAT_BODY = ['.xFxFxFx.', 'fFFFFFFFF', '.fbbbbbf.'];
const CAT_HEAD = ['F...F', 'FF.FF', 'FFFFF', 'FFFKF', 'fFFFN'];
const CAT_LEG = ['F', 'f', 'f'];
function drawCat(g, m, u) {
  const c = Object.assign({ N: '#e08a9a', C: '#c0392b' }, CAT_COATS[m.variant % CAT_COATS.length]);
  const far = darker(c, 0.3);
  const walk = Math.abs(m.vx) > 0.1, ph = m.legPhase * 1.3;
  const sw = walk ? Math.sin(ph) * 0.6 : 0;
  const ox = -6 * u, oy = -9 * u, sit = m.sitting;
  g.save();
  if (sit) { g.translate(-3 * u, 0); g.rotate(-0.32); g.translate(3 * u, 0); }
  if (!sit) drawPart(g, CAT_LEG, far, ox + 2.5 * u, oy + 6 * u, 0.5, 0, -sw, u);
  drawPart(g, CAT_LEG, far, ox + 8.5 * u, oy + 6 * u, 0.5, 0, sit ? 0.32 : sw, u);
  // tail: a few segments curling upward, swaying
  let tx = ox + 1.5 * u, ty = oy + 3.5 * u, ang = -2.2 + Math.sin(Game.time * 3 + m.id) * 0.2;
  g.fillStyle = c.F;
  for (let i = 0; i < 6; i++) { g.fillRect(tx - 0.6 * u, ty - 0.6 * u, 1.2 * u, 1.2 * u); tx += Math.cos(ang) * u; ty += Math.sin(ang) * u; ang += sit ? -0.35 : 0.2; }
  drawPix(g, CAT_BODY, c, ox + 1 * u, oy + 3 * u, u);
  if (!sit) drawPart(g, CAT_LEG, c, ox + 3.5 * u, oy + 6 * u, 0.5, 0, sw, u);
  drawPart(g, CAT_LEG, c, ox + 7.5 * u, oy + 6 * u, 0.5, 0, sit ? 0.32 : -sw, u);
  if (sit) { g.fillStyle = c.F; g.fillRect(ox + 1 * u, oy + 6 * u, 3 * u, 2 * u); }
  g.save(); g.translate(ox + 8 * u, oy + 3.5 * u); if (sit) g.rotate(0.32);
  drawPix(g, CAT_HEAD, c, -0.5 * u, -4 * u, u);
  if (m.tamed) { g.fillStyle = c.C; g.fillRect(-0.3 * u, 0.6 * u, 1.3 * u, 1 * u); }
  g.restore();
  g.restore();
}
