'use strict';
// =============================================================================
// MOON MOTH   (type 'moonmoth')
//   Harmless; comes out at night and loves lamps.
// =============================================================================
defineMob('moonmoth', {
  // ---- STATS ----
  stats: {
    name: 'Moon Moth', w: 0.7, h: 0.55, speed: 1.6, health: 3, hostile: false, dmg: 0, kb: 1.5, flying: true,
    nocturnal: true, sunproof: true, glow: '170,190,255', loot: [[MOONPETAL, 1, 1, 0.5]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 16 },
  // ---- AI ----
  ai: 'moth',
  // ---- VISUALS ----
  sprite: { w: 24, h: 18, frames: 3 },
  spriteFrame: (m) => [0, 1, 2, 1][Math.floor(m.flap * 0.45) % 4],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/bat/idle', 4), vol: 0.25, pitch: [1.8, 2.2], cat: 'volCreatures' },
    hurt: { files: n_('mob/bat/hurt', 4), vol: 0.9, pitch: [1.8, 2.2], cat: 'volCreatures' },
    death: { files: ['mob/bat/death'], vol: 0.9, pitch: [1.8, 2.2], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- AI ----
// Moon Moth: harmless, drawn to lanterns and torches
MOB_AI12.moth = function (m, dt, p, dx, dist) {
  if (nocturnalGone12(m, dt)) return;
  m.flap += dt * 14;
  const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2;
  if (!m.lamp || m.lampT <= 0) {
    m.lampT = 3 + Math.random() * 3; m.lamp = null; let best = 99;
    for (const l of Game.world.lightsNear(mcx, mcy, 14)) { if (l.id === 15 || l.id === 22 || l.id === BRAZIER_LIT || l.id === PAPER_LANTERN) { const d = Math.hypot(l.x - mcx, l.y - mcy); if (d < best) { best = d; m.lamp = l; } } }
  }
  m.lampT -= dt;
  let tx, ty;
  if (m.lamp) { const a = Game.time * 2 + m.id; tx = m.lamp.x + 0.5 + Math.cos(a) * 1.4; ty = m.lamp.y + 0.3 + Math.sin(a * 1.3) * 1.0; }
  else { tx = mcx + Math.sin(Game.time * 0.7 + m.id * 3) * 5; ty = mcy + Math.cos(Game.time * 0.9 + m.id) * 2; }
  const ddx = tx - mcx, ddy = ty - mcy, len = Math.hypot(ddx, ddy) || 1, k = Math.min(1, dt * 3);
  if (m.kbTimer <= 0) { m.vx += (ddx / len * m.def.speed * Math.min(1, len) - m.vx) * k; m.vy += (ddy / len * m.def.speed * Math.min(1, len) - m.vy) * k; }
  m.facingDir = m.vx > 0.1 ? 1 : m.vx < -0.1 ? -1 : m.facingDir;
  moveAndCollide(m, Game.world, dt);
  if (Math.random() < dt * 3 * particleMul()) Game.particles.push({ x: mcx, y: mcy + 0.2, vx: 0, vy: 0.3, life: 1, age: 0, size: 0.05, color: 'rgba(190,210,255,0.8)', gravity: 0 });
};
