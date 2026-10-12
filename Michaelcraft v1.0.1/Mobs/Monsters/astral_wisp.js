'use strict';
// =============================================================================
// ASTRAL WISP   (type 'astralwisp')
//   A violet flame of the Moon that shoots astral bolts.
// =============================================================================
defineMob('astralwisp', {
  // ---- STATS ----
  stats: {
    name: 'Astral Wisp', w: 0.7, h: 0.95, speed: 3.2, health: 14, hostile: true, dmg: 3, kb: 1.3, flying: true,
    sunproof: true, moon: true, glow: '170,140,255',
    loot: [[STAR_FRAGMENT, 1, 1, 0.4], [MOON_CRYSTAL_SHARD, 1, 1, 0.3], [MANA_POTION, 1, 1, 0.05]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  ai: 'astral',
  // ---- VISUALS ----
  draw: wispDraw14('astralwisp', FLAME_ASTRAL14, '220,200,255'),
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/vex/idle', 4), vol: 0.5, pitch: [1.2, 1.5], cat: 'volCreatures' },
    hurt: { files: n_('mob/vex/hurt', 2), vol: 0.6, pitch: [1.3, 1.5], cat: 'volCreatures', synth: 'hit' },
    death: { files: n_('mob/vex/death', 2), vol: 0.6, pitch: [1.2, 1.4], cat: 'volCreatures', synth: 'death' },
    cast: { files: ['boss/purpleorb_fire'], vol: 0.35, pitch: [1.6, 1.9], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- AI ----
BOLT_COL12.astral = ['170,130,255', '#e0d0ff'];
// Astral Wisp: keeps its distance and throws curving bolts of starlight
MOB_AI12.astral = function (m, dt, p, dx, dist) {
  const def = m.def; m.flap = (m.flap || 0) + dt * 8; m.castT = Math.max(0, (m.castT || 0) - dt);
  const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2, pcx = p.x + p.w / 2, pcy = p.y + p.h * 0.35;
  let tx, ty, sp;
  if (m.state === 'hostile') {
    const ang = Game.time * 0.8 + m.id * 2.1;
    tx = pcx + Math.cos(ang) * 5.5; ty = pcy - 3 + Math.sin(ang * 1.3) * 1.5; sp = def.speed;
    m.shootCd = (m.shootCd == null ? 1.2 + Math.random() : m.shootCd) - dt;
    if (m.shootCd <= 0 && dist < 12 && !Game.creative) {
      m.shootCd = 2.6 + Math.random(); m.castT = 0.45;
      const a = Math.atan2(pcy - mcy, pcx - mcx);
      for (const da of [-0.25, 0.25]) spawnBolt12({ x: mcx, y: mcy, vx: Math.cos(a + da) * 7, vy: Math.sin(a + da) * 7, kind: 'astral', dmg: 2, r: 0.26, life: 2.4, trail: true, homing: () => { const q = Game.player; return q && !q.dead ? { x: q.x + q.w / 2, y: q.y + q.h / 2 } : null; } });
      sfx('astralwisp.cast', { x: mcx, y: mcy });
    }
    m.facingDir = dx > 0 ? 1 : -1;
    { const wp = mobFlyWaypoint(m, tx, ty); if (wp) { tx = wp.x; ty = wp.y; } }   // (a wall in the way: round it, Mobs/_pathfinding.js)
  } else { tx = mcx + Math.sin(Game.time * 0.6 + m.id * 3) * 4; ty = mcy + Math.cos(Game.time * 0.8 + m.id) * 2; sp = def.speed * 0.4; if (Math.abs(m.vx) > 0.2) m.facingDir = m.vx > 0 ? 1 : -1; }
  if (m.kbTimer <= 0) { const ddx = tx - mcx, ddy = ty - mcy, len = Math.hypot(ddx, ddy) || 1, k = Math.min(1, dt * 2.5); m.vx += (ddx / len * sp * Math.min(1, len / 2) - m.vx) * k; m.vy += (ddy / len * sp * Math.min(1, len / 2) - m.vy) * k; }
  const vx0 = m.vx, vy0 = m.vy; moveAndCollide(m, Game.world, dt);
  if (m.vx === 0 && vx0 !== 0) m.vy -= 0.1; if (m.vy === 0 && vy0 > 0) m.vy = -2;
  m.legPhase += dt; if (m.y > WORLD_H + 5) m.dead = true;
  if (Math.random() < dt * 9 * particleMul()) Game.particles.push({ x: mcx + (Math.random() - 0.5) * 0.4, y: mcy + 0.3, vx: (Math.random() - 0.5) * 0.4, vy: 0.6, life: 0.7, age: 0, size: 0.07, color: Math.random() < 0.5 ? '#d8c8ff' : '#8a6af0', gravity: 0, kind: 'star' });
};
