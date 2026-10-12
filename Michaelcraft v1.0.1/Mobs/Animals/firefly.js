'use strict';
// =============================================================================
// FIREFLY   (type 'firefly')
//   Drifts in the Abyss and glows. Catch one in a jar (right-click it holding a glass bottle).
// =============================================================================
defineMob('firefly', {
  // ---- STATS ----
  stats: {
    name: 'Firefly', w: 0.3, h: 0.3, speed: 1.2, health: 1, hostile: false, dmg: 0, kb: 0.5, flying: true,
    fireproof: true, custom: 'firefly',
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // it just drifts
  // ---- AI ----
  update: fireflyAI,
  // ---- VISUALS ----
  draw: drawFirefly,
  deathColors: ['#ffd84a', '#3a2a10'],
  // ---- SOUNDS ----
  // ---- LOOT ----
  // (drops nothing)
});

// ---- AI ----
function fireflyAI(m, dt, p) {
  if (m.homeX == null) { m.homeX = m.x; m.homeY = m.y; }
  m.t = (m.t || 0) + dt;
  m.vx += ((Math.random() - 0.5) * 9 + (m.homeX - m.x) * 0.3) * dt;
  m.vy += ((Math.random() - 0.5) * 9 + (m.homeY - m.y) * 0.3) * dt;
  const sp = Math.hypot(m.vx, m.vy);
  if (sp > 1.4) { m.vx *= 1.4 / sp; m.vy *= 1.4 / sp; }
  m.facingDir = m.vx < 0 ? -1 : 1;
  moveAndCollide(m, Game.world, dt);
  if (m.onGround) m.vy = -0.9;
  if (Math.abs(m.x - p.x) > 60) m.dead = true;
}

// ---- VISUALS (drawing and effects) ----
function drawFirefly(g, m, u) {
  const blink = 0.6 + 0.4 * Math.sin((m.t || 0) * 5 + m.id);
  g.fillStyle = '#3a2a10'; g.fillRect(-1.5 * u, -1 * u, 2 * u, 2 * u);
  g.fillStyle = `rgba(255,216,74,${blink})`; g.fillRect(0, -0.5 * u, 2 * u, 1.5 * u);
  g.fillStyle = 'rgba(230,240,255,0.55)';
  const f = Math.sin((m.t || 0) * 40) > 0 ? 1 : 0.4;
  g.fillRect(-1.5 * u, -2.2 * u * f, 1.5 * u, 1.2 * u * f);
}

// ---- CATCHING ONE ----
function catchFirefly(m) {
  const p = Game.player;
  m.dead = true;
  if (!Game.creative) { const s = p.selectedSlot(); s.qty -= 1; if (s.qty <= 0) p.inventory[p.hotbarIndex] = null; }
  giveOrDrop(makeStack(FIREFLY_JAR, 1));
  p.swing = 1;
  sfx('bottle.fill');
  for (let i = 0; i < 8; i++) Game.particles.push({ x: m.x + 0.15, y: m.y + 0.15, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 0.5, age: 0, size: 0.07, kind: 'star', color: '#ffe066', gravity: 0 });
}
