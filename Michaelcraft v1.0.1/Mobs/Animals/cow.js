'use strict';
// =============================================================================
// COW   (type 'cow')
//   A farm animal. Follows wheat, makes calves, and gives milk (right-click it holding a bucket).
// =============================================================================
defineMob('cow', {
  // ---- STATS ----
  stats: {
    name: 'Cow', w: 1.4, h: 1.3, speed: 1.4, health: 10, hostile: false, dmg: 0, kb: 0.9, livestock: true,
    breedItems: [126],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 3, range: 16 },
  // ---- AI ----
  brain: livestockBrain,
  // ---- VISUALS ----
  draw: drawCow,
  deathColors: ['#f2f0ea', '#2a2724'],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/cow/say', 4), vol: 0.6, pitch: [0.8, 1.2], cat: 'volFriendly', synth: 'moo' },
    hurt: { files: n_('mob/cow/hurt', 3), vol: 0.6, pitch: [0.8, 1.2], cat: 'volFriendly', synth: 'mooHurt' },
    death: { files: n_('mob/cow/hurt', 3), vol: 0.6, pitch: [0.8, 1], cat: 'volFriendly', synth: 'mooDeath' },
    step: { files: n_('mob/cow/step', 4), vol: 0.15, pitch: [0.9, 1.1], cat: 'volFriendly' },
    milk: { files: n_('entity/cow/milk', 3), vol: 0.8, pitch: [0.9, 1.1], cat: 'volPlayers', synth: 'pop' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    const r = Math.random;
    spawnDrop(122, 1 + Math.floor(r() * 3), mx, my);
    if (r() < 0.75) spawnDrop(124, 1 + Math.floor(r() * 2), mx, my);
  },
});

// ---- VISUALS (drawing and effects) ----
// ---- Cow (passive): black-and-white dairy cow with pale horns and a pink muzzle ----
const COW_C = { W: '#f2f0ea', w: '#d6d2c8', K: '#26231f', k: '#3d3833', P: '#e9a3a3', p: '#a8585e', H: '#e6dcc2', h: '#3a3430', E: '#0c0b0a' };
const COW_BODY = [
  '..KKKWWWWWWKKKWWWW..',
  '.KKKKWWWWWKKKKKWWWW.',
  'WKKKWWWWWWWKKKWWWWWW',
  'WWWWWWWKKWWWWWWWWKKW',
  'WWWWWWKKKKWWWWWWKKKW',
  'wWWWWWWKKWWWWWWWWKKW',
  'wwWWWWWWWWWWWWWWWWWW',
  '.wwwWWWPPWWWWWWWWWw.',
  '..wwwwwPPwwwwwwwww..',
];
const COW_HEAD = [
  '..H.....',
  '.kHK....',
  'kKKKKKK.',
  'KKKWWKKK',
  'KKWEWWWW',
  'KKWWWWWW',
  '.KWWPPPP',
  '.kWPpPpP',
  '..WPPPPP',
];
const COW_LEG = ['WWw', 'WWw', 'WWw', 'WWw', 'wWw', 'WWw', 'hhh'];
const COW_TAIL = ['k.', 'k.', 'k.', '.k', '.K', 'KK'];
function drawCow(g, m, u) {
  const walk = Math.abs(m.vx) > 0.1, ph = m.legPhase;
  const sw = walk ? Math.sin(ph) * 0.45 : 0;
  const bob = walk ? Math.abs(Math.sin(ph)) * 0.4 * u : 0;
  g.scale(1.18, 1.18);   // cows stand a bit taller than boars
  const ox = -12 * u, oy = -21 * u;
  const far = darker(COW_C, 0.3);
  drawPart(g, COW_LEG, far, ox + 3.5 * u, oy + 14 * u, 1.5, 0, -sw, u);
  drawPart(g, COW_LEG, far, ox + 16.5 * u, oy + 14 * u, 1.5, 0, sw, u);
  drawPart(g, COW_TAIL, COW_C, ox + 1.5 * u, oy + 7 * u + bob, 0.5, 0, 0.15 + Math.sin(Game.time * 2.2 + m.id) * 0.2, u);
  drawPix(g, COW_BODY, COW_C, ox + 1 * u, oy + 6 * u + bob, u);
  drawPart(g, COW_LEG, COW_C, ox + 5.5 * u, oy + 14 * u, 1.5, 0, sw, u);
  drawPart(g, COW_LEG, COW_C, ox + 18.5 * u, oy + 14 * u, 1.5, 0, -sw, u);
  const graze = m.graze > 0 ? Math.min(1, m.graze * 3) * (0.7 + Math.sin(Game.time * 7) * 0.05) : 0;
  const nod = walk ? Math.sin(ph * 2) * 0.05 : 0;
  drawPart(g, COW_HEAD, COW_C, ox + 20 * u, oy + 9 * u + bob, 1, 5, graze + nod, u);
}

// ---- MILKING ----
function milkCow(m) {
  const p = Game.player, slot = p.selectedSlot();
  if (slot.qty > 1) { slot.qty -= 1; giveOrDrop(makeStack(142, 1)); }
  else p.inventory[p.hotbarIndex] = makeStack(142, 1);
  sfx('cow.milk', mobPos(m));
  showHeldName(ITEMS[142].name);
}
