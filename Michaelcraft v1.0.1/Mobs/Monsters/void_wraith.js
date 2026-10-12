'use strict';
// =============================================================================
// VOID WRAITH   (type 'voidwraith')
//   Hardmode: floats at a distance and fires void bolts. Spawns at night and in the Blight.
// =============================================================================
defineMob('voidwraith', {
  // ---- STATS ----
  stats: {
    name: 'Void Wraith', w: 0.85, h: 1.5, speed: 3.3, health: 60, hostile: true, dmg: 8, kb: 1.0, flying: true,
    sunproof: true, fireproof: true, glow: '210,80,255',
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  ai: 'voidwraith',
  // it floats like the other hover casters (Mobs/_behaviors.js), with its own attack below
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.voidwraith, below)
  // ---- SOUNDS ----
  // ---- LOOT ----
  // (drops nothing)
});

// ---- AI ----
// it hovers like a Frost Wraith, but fires its own twin void bolts from further off
MOB_AI12.voidwraith = function (m, dt, p, dx, dist) {
  m.shootCd = 99;   // (the hover's own shot never fires: this is its attack)
  MOB_AI12.hover(m, dt, p, dx, dist);
  if (m.state !== 'hostile' || Game.creative) return;
  m.vShoot = (m.vShoot == null ? 1.5 + Math.random() : m.vShoot) - dt;
  if (m.vShoot <= 0 && dist < 13) {
    m.vShoot = 2.2 + Math.random(); m.castT = 0.45;
    const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2, a = Math.atan2(p.y + p.h * 0.4 - mcy, p.x + p.w / 2 - mcx);
    for (const da of [-0.16, 0.16]) spawnBolt12({ x: mcx, y: mcy, vx: Math.cos(a + da) * 10, vy: Math.sin(a + da) * 10, kind: 'ksoul', dmg: 6, r: 0.3, life: 2.2, trail: true });
    sfx('spell.void', { x: mcx, y: mcy, pitch: 1.5, vol: 0.6 });
  }
};

// ---- VISUALS (drawing and effects) ----
// the Void Wraith's look: the Frost Wraith's cloak, re-cut from the void
const VWRAITH_P = { c: '#6a2a8a', C: '#4a1866', d: '#26082e', k: '#08020c', E: '#ff5af0', i: '#ffd0ff', I: '#d24aff' };
MOB_DRAW.voidwraith = (g, m, u, eyes) => {
  const p = n => mp14('vwraith', n, WRAITH_G[n], VWRAITH_P, { flat: 'Ek', ol: '#0a0210' });
  const t = Game.time + m.id, bob = (Math.sin(t * 2.4) * 1.5), cast = m.castT > 0, lean = Math.max(-0.3, Math.min(0.3, (m.vx || 0) * 0.08));
  rig14(g, u, 48, 56, 24, 26, b => {
    b.translate(0, bob);
    DK14 = 0.7; drawP14(b, p('arm'), -3, -5, 1, 0, 1, cast ? -1.2 : 0.4 + Math.sin(t * 2) * 0.2); DK14 = 0;
    cloak14(b, -6, 4, 7, 17, t, { m: '#4a1a66', d: '#2a0a3a', l: '#9a4ac0', ol: '#0a0210' }, -lean);
    drawP14(b, p('hood'), 1, -6, 4, 7, 1);
    const aF = cast ? -1.9 : 0.2 + Math.sin(t * 2 + 1) * 0.2;
    drawP14(b, p('arm'), 3, -4, 1, 0, 1, aF);
    if (cast) { b.save(); b.translate(3, -4); b.rotate(aF); drawP14(b, p('shard'), 0, 9, 1, 2, 1, Math.sin(t * 20) * 0.2); b.restore(); }
  }, { soft: true });
  if (m.dying == null) eyes14(eyes, 1.5, -9.5 + bob, u, '255,90,240', 1);
};
