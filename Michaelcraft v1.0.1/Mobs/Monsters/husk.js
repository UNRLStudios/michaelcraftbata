'use strict';
// =============================================================================
// HUSK   (type 'husk')
//   A lost miner. A slow shambler: swipes when in reach, hops ledges.
// =============================================================================
defineMob('husk', {
  // ---- STATS ----
  stats: {
    name: 'Husk', w: 0.6, h: 1.8, speed: 1.8, health: 16, hostile: true, dmg: 3, kb: 0.8, reach: 0.45,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 4, range: 24 },
  // ---- AI ----
  brain: walkerBrain,
  tactic: huskTactic,
  // ---- VISUALS ----
  draw: drawHusk,
  deathColors: ['#8fa39a', '#5e5140'],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/husk/idle', 3), vol: 0.8, pitch: [0.9, 1.1], cat: 'volCreatures', synth: 'moan' },
    hurt: { files: n_('mob/husk/hurt', 2), vol: 0.9, pitch: [0.9, 1.1], cat: 'volCreatures', synth: 'hit' },
    death: { files: n_('mob/husk/death', 2), vol: 0.9, pitch: [0.9, 1.1], cat: 'volCreatures', synth: 'death' },
    step: { files: n_('mob/husk/step', 5), vol: 0.15, pitch: [0.9, 1.1], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {   // a lost miner: sometimes still carrying supplies
    const r = Math.random;
    if (r() < 0.4) spawnDrop(15, 1 + Math.floor(r() * 2), mx, my);
    if (r() < 0.2) spawnDrop(118, 1, mx, my);
    if (r() < 0.25) spawnDrop(122, 1, mx, my);
    if (r() < 0.4) spawnDrop(133, 1 + Math.floor(r() * 2), mx, my);
  },
});

// ---- AI ----
// once it's after you: slow down close up, and swipe
function huskTactic(mob, dt, p, dx, dir, targetVx) {
  const def = mob.def, gap = boxGap(mob, p);
  if (gap < def.reach + 0.3) targetVx = dir * def.speed * 0.3;
  if (gap < def.reach && mob.attackCooldown <= 0) {
    mob.attackAnim = 1;
    if (hitPlayer(mob, def.dmg, 6.5, 4)) mob.attackCooldown = 1.1; else mob.attackCooldown = 0.4;
  }
  return targetVx;
}

// ---- VISUALS (drawing and effects) ----
// ---- Husk: a lost miner who never came back up. Shares the player's
// humanoid rig, with a dented hard hat, tattered clothes and dead eyes. ----
const HUSK_PAL = {
  hair: '#b8973a', hairHi: '#dcbb52', skin: '#8fa39a', skinShade: '#6c7f77', mouth: '#2e2424',
  eyeWhite: '#1a1d1c', eye: '#c9ff5a',
  shirt: '#5e5140', shirtHi: '#766650', shirtShade: '#463c2f', belt: '#3a2a1a', buckle: '#6b6b6b',
  pants: '#3c4a5a', pantsShade: '#2d3846', boots: '#2a211a', bootsHi: '#3a2f25',
};
const HUSK_GRIDS = {
  head: ['..hhHHH.', '.hHHHHHK', 'HHHHHHHH', 'sSSsSSSS', 'sSsSSWES', 'sSSSSSSS', 'ssSSSMMS', '.sSSsSS.'],
  body: ['dTTS', 'dTtt', 'dSTt', 'dTTt', 'dTsS', 'dTTt', 'dTTt', 'dTSt', 'dTTt', 'BBBK', 'dPPP', 'pPPP'],
  arm: ['dTTt', 'dTTt', 'dTTs', 'sSSS', 'sSSs', 'sSSS', 'sSSS', 'sSSS', 'sSSS', 'sSSs', 'sSSS', 'ssSS'],
  leg: ['pPPP', 'pPPP', 'pPSP', 'pPPP', 'pPPP', 'pPPP', 'sSPP', 'pPPP', 'OOoo', 'OOOo', 'OOOO', 'OOOO'],
};
function drawHusk(g, m, u0, eyes) {
  const w = m.w * TILE, h = m.h * TILE, u = h / 32;
  const moving = Math.abs(m.vx) > 0.1;
  const ph = m.legPhase * 0.8;
  const t = Game.time * 3 + m.id;
  // uneven, limping gait; arms reach out in front
  const legSwing = moving ? Math.sin(ph) * 0.5 : 0;
  const backLeg = moving ? -Math.sin(ph) * 0.3 : 0;
  const swipe = Math.sin(m.attackAnim * Math.PI);
  const reach = m.state === 'hostile' ? -1.4 : -0.35;
  g.save();
  g.translate(-w / 2, -h);
  g.translate(w / 2, h); g.rotate(0.07 + (moving ? Math.sin(ph) * 0.04 : 0)); g.translate(-w / 2, -h); // hunch
  drawPlayerSprite(g, w, h, {
    grids: HUSK_GRIDS, pal: HUSK_PAL, legSwing, backLegSwing: backLeg,
    armAngle: reach + Math.sin(t) * 0.1 - swipe * 1.1, backArmAngle: reach + 0.12 + Math.sin(t + 1.3) * 0.1 - swipe * 0.6,
    headTilt: 0.12 + Math.sin(t * 0.7) * 0.06,
  });
  g.restore();
  eyes.push({ x: 2.5 * u, y: -h + 4.5 * u, s: 1.1 * u, c: '201,255,90' });
}
