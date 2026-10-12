'use strict';
// =============================================================================
// STAR JELLY   (type 'starjelly')
//   Drifts over the Moon, pulsing; stings on touch.
// =============================================================================
defineMob('starjelly', {
  // ---- STATS ----
  stats: {
    name: 'Star Jelly', w: 0.9, h: 0.9, speed: 1.2, health: 8, hostile: false, dmg: 0, kb: 1.6, flying: true,
    sunproof: true, moon: true, glow: '110,180,255', loot: [[STAR_JELLY, 1, 2, 0.9]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 16 },
  // ---- AI ----
  ai: 'jelly',
  // ---- VISUALS ----
  sprite: { w: 20, h: 20, frames: 3 },
  spriteFrame: (m) => [0, 1, 2, 1][Math.floor(Game.time * 2.5 + m.id) % 4],
  // ---- SOUNDS ----
  sounds: {
    say: { files: ['terraria/pixie'], vol: 0.18, pitch: [1.1, 1.4], cat: 'volCreatures' },
    hurt: { files: n_('random/glass', 3), vol: 0.4, pitch: [1.6, 1.9], cat: 'volCreatures', synth: 'hit' },
    death: { files: ['terraria/pixie'], vol: 0.4, pitch: [0.7, 0.8], cat: 'volCreatures', synth: 'death' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- AI ----
// Star Jelly: drifts and bobs, harmless. It flees upward when you hit it
MOB_AI12.jelly = function (m, dt, p, dx, dist) {
  const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2;
  m.home = m.home || { x: mcx, y: mcy };
  const scared = m.hurtFlash > 0 || (m.fleeT = Math.max(0, (m.fleeT || 0) - dt)) > 0;
  if (m.hurtFlash > 0) m.fleeT = 3;
  const tx = scared ? mcx - Math.sign(dx || 1) * 4 : m.home.x + Math.sin(Game.time * 0.3 + m.id) * 6;
  const ty = scared ? mcy - 3 : m.home.y + Math.sin(Game.time * 0.9 + m.id * 2) * 1.5;
  const ddx = tx - mcx, ddy = ty - mcy, len = Math.hypot(ddx, ddy) || 1, sp = m.def.speed * (scared ? 2.2 : 1), k = Math.min(1, dt * 2);
  if (m.kbTimer <= 0) { m.vx += (ddx / len * sp * Math.min(1, len) - m.vx) * k; m.vy += (ddy / len * sp * Math.min(1, len) - m.vy) * k; }
  m.facingDir = m.vx > 0.1 ? 1 : m.vx < -0.1 ? -1 : (m.facingDir || 1);
  moveAndCollide(m, Game.world, dt);
  if (Math.random() < dt * 4 * particleMul()) Game.particles.push({ x: mcx + (Math.random() - 0.5) * 0.6, y: m.y + m.h * 0.9, vx: 0, vy: 0.4, life: 1.1, age: 0, size: 0.06, color: Math.random() < 0.5 ? '#bfe4ff' : '#6ab4ff', gravity: 0, kind: 'star' });
  m.soundCd = (m.soundCd || 3) - dt; if (m.soundCd <= 0 && dist < 12) { m.soundCd = 5 + Math.random() * 6; sfx('starjelly.say', mobPos(m)); }
};
