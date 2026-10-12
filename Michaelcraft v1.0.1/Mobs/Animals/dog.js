'use strict';
// =============================================================================
// DOG   (type 'dog')
//   A pet. Tame a wild one with bones (1 in 3 each time), then feed it meat to heal it or to breed two.
//   A tamed dog follows you (warps over if left far behind), sits when told, and fights whatever hurts you.
//   Hit a wild one and it fights back.
// =============================================================================
defineMob('dog', {
  // ---- STATS ----
  // Pets: tame with tameItem (1 in 3 chance per feed), then feed breedItems
  // to heal them or to breed two tamed pets.
  stats: {
    name: 'Dog', w: 0.9, h: 0.75, speed: 3.3, health: 10, tamedHealth: 20, hostile: false, dmg: 3, kb: 1,
    reach: 0.35, pet: true, tameItem: 133, breedItems: [122, 132], variants: 4,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 5, range: 24 },
  // ---- AI ----
  brain: petBrain,
  hooks: { petSound: dogSound },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  draw: drawDog,
  deathColors: ['#a8733d', '#e6e6e6'],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/wolf/bark', 3), vol: 0.6, pitch: [0.9, 1.1], cat: 'volFriendly' },
    growl: { files: n_('mob/wolf/growl', 3), vol: 0.7, pitch: [0.9, 1.1], cat: 'volFriendly' },
    whine: { files: ['mob/wolf/whine'], vol: 0.6, pitch: [0.9, 1.1], cat: 'volFriendly' },
    pant: { files: ['mob/wolf/panting'], vol: 0.4, pitch: [0.9, 1.1], cat: 'volFriendly' },
    hurt: { files: n_('mob/wolf/hurt', 3), vol: 0.8, pitch: [0.9, 1.1], cat: 'volFriendly', synth: 'hit' },
    death: { files: ['mob/wolf/death'], vol: 0.8, pitch: [0.9, 1.1], cat: 'volFriendly', synth: 'death' },
    step: { files: n_('mob/wolf/step', 5), vol: 0.12, pitch: [0.9, 1.1], cat: 'volFriendly' },
  },
  // ---- LOOT ----
  // (drops nothing)
});

// ---- AI ----
// what it says now and then
function dogSound(m) { return m.tamed && m.health < m.maxHealth / 2 ? 'dog.whine' : m.tamed && Math.random() < 0.5 ? 'dog.pant' : 'dog.say'; }

// ---- VISUALS (drawing and effects) ----
// ---- Dog: floppy ears, wagging tail, red collar once tamed. Sits on command. ----
const DOG_COATS = [
  { F: '#8b5a2b', f: '#6b4420', l: '#a8733d', b: '#c9a27a', E: '#5a3a1c' },   // brown
  { F: '#c8923a', f: '#a8762a', l: '#e0b060', b: '#f0d8a0', E: '#9a6a2a' },   // golden
  { F: '#2a2a2e', f: '#1c1c20', l: '#44444a', b: '#e8e8e8', E: '#1c1c20' },   // black & white
  { F: '#9a9ea4', f: '#7a7e84', l: '#c0c4c8', b: '#e6e6e6', E: '#6a6e74' },   // grey
];
const DOG_BODY = ['..llllllll', '.FFFFFFFFF', 'fFFFFFFFFF', 'fFFFFFFFFF', '.ffbbbbbff'];
const DOG_HEAD = ['..FFFF..', '.FFFFFF.', 'EFFFFKFl', 'EFFFFFFN', 'EfFFbbbb', '.ffbbb..'];
const DOG_LEG = ['Ff', 'Ff', 'ff', 'ff'];
const DOG_TAIL = ['l', 'F', 'F', 'F'];
function drawDog(g, m, u) {
  const c = Object.assign({ K: '#1a1210', N: '#1a1210', C: '#c0392b' }, DOG_COATS[m.variant % DOG_COATS.length]);
  const far = darker(c, 0.3);
  const walk = Math.abs(m.vx) > 0.1, ph = m.legPhase * 1.2;
  const sw = walk ? Math.sin(ph) * 0.6 : 0;
  const ox = -8 * u, oy = -12 * u;
  const sit = m.sitting;
  const wag = Math.sin(Game.time * (m.tamed ? 16 : 7)) * (m.tamed ? 0.45 : 0.2);
  g.save();
  if (sit) { g.translate(-4 * u, 0); g.rotate(-0.28); g.translate(4 * u, 0); }
  // far legs, tail, body, near legs, head
  if (!sit) drawPart(g, DOG_LEG, far, ox + 3 * u, oy + 8 * u, 1, 0, -sw, u);
  drawPart(g, DOG_LEG, far, ox + 11 * u, oy + 8 * u, 1, 0, sit ? 0.28 : sw, u);
  drawPart(g, DOG_TAIL, c, ox + 3 * u, oy + 4.5 * u, 0.5, 4, sit ? -1.6 : -0.9 + wag, u);
  drawPix(g, DOG_BODY, c, ox + 2 * u, oy + 4 * u, u);
  if (!sit) drawPart(g, DOG_LEG, c, ox + 4 * u, oy + 8 * u, 1, 0, sw, u);
  drawPart(g, DOG_LEG, c, ox + 10 * u, oy + 8 * u, 1, 0, sit ? 0.28 : -sw, u);
  if (sit) { g.fillStyle = c.F; g.fillRect(ox + 2 * u, oy + 8 * u, 4 * u, 3 * u); }  // folded back legs
  g.save(); g.translate(ox + 11 * u, oy + 5 * u); if (sit) g.rotate(0.28);
  drawPix(g, DOG_HEAD, c, -1 * u, -4 * u, u);
  if (m.tamed) { g.fillStyle = c.C; g.fillRect(-1 * u, 1.5 * u, 2.2 * u, 1.3 * u); }   // collar
  g.restore();
  g.restore();
}
