'use strict';
// =============================================================================
// CHICKEN   (type 'chicken')
//   A farm animal. Pecks about, follows seeds, flutters down instead of falling, lays an egg every 5-10 minutes.
// =============================================================================
defineMob('chicken', {
  // ---- STATS ----
  stats: {
    name: 'Chicken', w: 0.5, h: 0.7, speed: 1.7, health: 4, hostile: false, dmg: 0, kb: 1.3, livestock: true,
    breedItems: [125], slowFall: true,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 6, range: 16 },
  // ---- AI ----
  brain: livestockBrain,
  hooks: { livestockTick: layEggs },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  draw: drawChicken,
  deathColors: ['#f6f6f2', '#d63a2e'],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/chicken/say', 3), vol: 0.6, pitch: [0.8, 1.2], cat: 'volFriendly', synth: 'cluck' },
    hurt: { files: n_('mob/chicken/hurt', 2), vol: 0.7, pitch: [0.8, 1.2], cat: 'volFriendly', synth: 'squawk' },
    death: { files: n_('mob/chicken/hurt', 2), vol: 0.7, pitch: [0.8, 1], cat: 'volFriendly', synth: 'squawk' },
    step: { files: n_('mob/chicken/step', 2), vol: 0.15, pitch: [0.9, 1.1], cat: 'volFriendly' },
    plop: { files: ['mob/chicken/plop'], vol: 0.8, pitch: [0.8, 1.2], cat: 'volFriendly', synth: 'pop' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    spawnDrop(136, 1, mx, my);
  },
});

// ---- AI ----
// an egg every 5-10 minutes (grown-ups only)
function layEggs(m, dt) {
  if (m.baby) return;
  m.eggTimer -= dt;
  if (m.eggTimer <= 0) { m.eggTimer = 300 + Math.random() * 300; spawnDrop(144, 1, m.x + m.w / 2, m.y + m.h * 0.7); sfx('chicken.plop', mobPos(m)); }
}

// ---- VISUALS (drawing and effects) ----
// ---- Chicken (passive): round white hen with a red comb, pecks and flaps ----
const CHICK_C = { W: '#f6f6f2', w: '#d4d4cc', R: '#d63a2e', Y: '#f0b030', y: '#d88a20', E: '#111111' };
const CHICK_BODY = ['ww......', 'wWWWWWWW', 'wWWWWWWW', '.wWWWWWW', '..wwwww.'];
const CHICK_HEAD = ['.RR..', 'WWWW.', 'WWEWY', 'WWWWY', 'WWWR.', '.WWR.'];
const CHICK_WING = ['wwww', 'wWWw', '.ww.'];
const CHICK_LEG = ['y.', 'y.', 'yy'];
function drawChicken(g, m, u) {
  const walk = Math.abs(m.vx) > 0.1, ph = m.legPhase;
  const sw = walk ? Math.sin(ph * 1.4) * 0.6 : 0;
  const ox = -5 * u, oy = -8 * u;
  drawPart(g, CHICK_LEG, darker(CHICK_C, 0.25), ox + 3.5 * u, oy + 5 * u, 0.5, 0, -sw, u);
  drawPix(g, CHICK_BODY, CHICK_C, ox, oy, u);
  drawPart(g, CHICK_LEG, CHICK_C, ox + 5.5 * u, oy + 5 * u, 0.5, 0, sw, u);
  // pecking at the ground, or bobbing the head while walking
  const peck = m.graze > 0 ? Math.max(0, Math.sin(Game.time * 9 + m.id)) * 1.1 : 0;
  const bobX = walk ? Math.sin(ph * 2) * 0.7 * u : 0;
  drawPart(g, CHICK_HEAD, CHICK_C, ox + 6 * u + bobX, oy + 1 * u, 1, 5, peck, u);
  // wing: flaps while in the air
  const airborne = !m.onGround && !m.inWater;
  const flap = airborne ? -(0.5 + 0.6 * Math.abs(Math.sin(Game.time * 38 + m.id))) : 0;
  drawPart(g, CHICK_WING, CHICK_C, ox + 2 * u, oy + 1.5 * u, 0, 0, flap, u);
}
