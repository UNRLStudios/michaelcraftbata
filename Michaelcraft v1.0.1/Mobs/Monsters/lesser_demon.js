'use strict';
// =============================================================================
// LESSER DEMON   (type 'lesserdemon')
//   A winged demon of the Underworld that throws scythes. Fifty of them must fall for the Lost Soul.
// =============================================================================
defineMob('lesserdemon', {
  // ---- STATS ----
  stats: {
    name: 'Lesser Demon', w: 1.1, h: 1.3, speed: 3.6, health: 34, hostile: true, dmg: 6, kb: 0.9, flying: true,
    sunproof: true, fireproof: true, under: true, demon: true, glow: '255,60,40',
    loot: [[DEMON_HORN, 1, 1, 0.35], [HELLSTONE, 1, 2, 0.25], [134, 1, 2, 0.2]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  ai: 'demonfly',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.lesserdemon, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/vex/idle', 4), vol: 0.6, pitch: [0.5, 0.6], cat: 'volCreatures', synth: 'screech' },
    hurt: { files: ['terraria/npc_hit_1'], vol: 0.7, pitch: [0.7, 0.8], cat: 'volCreatures', synth: 'hit' },
    death: { files: n_('terraria/npc_killed_', 2), vol: 0.7, pitch: [0.6, 0.7], cat: 'volCreatures', synth: 'death' },
    cast: { files: ['terraria/item_8'], vol: 0.6, pitch: [0.9, 1.05], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- AI ----
// Lesser Demon: hangs in the air at a distance, then throws a pair of demon scythes (they start slow and speed up, through walls)
MOB_AI12.demonfly = function (m, dt, p, dx, dist) {
  const def = m.def; m.flap = (m.flap || 0) + dt * 9; m.castT = Math.max(0, (m.castT || 0) - dt);
  const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2, pcx = p.x + p.w / 2, pcy = p.y + p.h * 0.4;
  let tx, ty, sp;
  if (m.state === 'hostile') {
    const ang = Game.time * 0.6 + m.id * 1.7;
    tx = pcx + Math.cos(ang) * 7; ty = pcy - 4 + Math.sin(ang * 1.4) * 2; sp = def.speed;
    m.shootCd = (m.shootCd == null ? 1.5 + Math.random() : m.shootCd) - dt;
    if (m.shootCd <= 0 && dist < 13 && !Game.creative) {
      m.shootCd = 3 + Math.random() * 1.5; m.castT = 0.5;
      const a = Math.atan2(pcy - mcy, pcx - mcx);
      for (const da of [-0.18, 0.18]) spawnBolt12({ x: mcx, y: mcy, vx: Math.cos(a + da) * 3, vy: Math.sin(a + da) * 3, kind: 'dscythe', dmg: 5, r: 0.42, life: 3.2, trail: true, accel: 1.9 });
      sfx('lesserdemon.cast', { x: mcx, y: mcy });
    }
    m.facingDir = dx > 0 ? 1 : -1;
    { const wp = mobFlyWaypoint(m, tx, ty); if (wp) { tx = wp.x; ty = wp.y; } }   // (a wall in the way: round it, Mobs/_pathfinding.js)
  } else { tx = mcx + Math.sin(Game.time * 0.5 + m.id * 3) * 4; ty = mcy + Math.cos(Game.time * 0.7 + m.id) * 2; sp = def.speed * 0.4; if (Math.abs(m.vx) > 0.2) m.facingDir = m.vx > 0 ? 1 : -1; }
  if (m.kbTimer <= 0) { const ddx = tx - mcx, ddy = ty - mcy, len = Math.hypot(ddx, ddy) || 1, k = Math.min(1, dt * 2.2); m.vx += (ddx / len * sp * Math.min(1, len / 2) - m.vx) * k; m.vy += (ddy / len * sp * Math.min(1, len / 2) - m.vy) * k; }
  if (boxGap(m, p) < 0.2 && m.attackCooldown <= 0) { if (hitPlayer(m, def.dmg, 6, 3)) m.attackCooldown = 1; }
  const vx0 = m.vx, vy0 = m.vy; moveAndCollide(m, Game.world, dt);
  if (m.vx === 0 && vx0 !== 0) m.vy -= 0.2; if (m.vy === 0 && vy0 > 0) m.vy = -2;
  m.legPhase += dt;
  if (Math.random() < dt * 6 * particleMul()) Game.particles.push({ x: mcx + (Math.random() - 0.5) * 0.6, y: m.y + m.h, vx: 0, vy: 0.6, life: 0.5, age: 0, size: 0.07, color: Math.random() < 0.5 ? '#ff5a2a' : '#ffb03a', gravity: -0.5 });
};

// ---- VISUALS (drawing and effects) ----
BOLT_COL12.dscythe = ['200,40,90', '#ff6a9a'];
// the demon scythes: spinning crescents
B12.glow.push(function drawScythes14(ox, oy, glow) {
  for (const b of Game.bolts12) {
    if (b.kind !== 'dscythe' && b.kind !== 'hskull') continue;
    const x = ox + b.x * TILE, y = oy + b.y * TILE, r = Math.max(6, b.r * TILE * 1.25);
    if (b.kind === 'dscythe') {
      const a = b.age * 14;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.strokeStyle = 'rgba(255,90,150,0.95)'; ctx.lineWidth = Math.max(2, r * 0.3); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 1.25); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,0,40,0.9)'; ctx.lineWidth = Math.max(1, r * 0.14); ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0.3, Math.PI * 1.1); ctx.stroke();
      ctx.restore();
    } else {   // a burning skull
      const s = Math.max(5, r * 0.9);
      ctx.fillStyle = '#ffe8c0'; ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s * 0.8));
      ctx.fillStyle = '#3a0a06'; ctx.fillRect(Math.round(x - s * 0.35), Math.round(y - s * 0.2), Math.round(s * 0.25), Math.round(s * 0.25)); ctx.fillRect(Math.round(x + s * 0.1), Math.round(y - s * 0.2), Math.round(s * 0.25), Math.round(s * 0.25));
    }
  }
});
const LDEM_P = { r: '#9a1c24', R: '#c42e2e', d: '#6a1018', k: '#1a0406', h: '#2e1e1c', H: '#5a4438', E: '#ffd23a', t: '#f0e4cc', c: '#e8dcc0', m: '#2a0408' };
const LDEM_G = {
  head: ['H.......', 'hH...H..', '.hRRRhH.', '.rRRRRR.', 'rRRRkEkR', 'rRRRRRRR', 'rRRRmtmt', '.rRRRmm.', '..rrrr..'],
  body: ['..rRRr.', '.rRRRRr', 'rRRdRRR', 'rRRRdRR', 'rRdRRRR', '.rRRRRr', '.rkkkkr', '.rRRRR.'],
  arm: ['rR', 'RR', 'rR', 'RR', 'rR', 'RR', 'rRR', 'c.c'],
  leg: ['rRR', 'rRR', 'rR.', 'rR.', 'RR.', 'rR.', 'kkk', 'k.k'],
};
let LDEM_R;
MOB_DRAW.lesserdemon = (g, m, u, eyes) => {
  if (!LDEM_R) {
    const p = n => mp14('ldemon', n, LDEM_G[n], LDEM_P, { flat: 'E' });
    LDEM_R = { leg: p('leg'), legX: [-1, 1], hipY: 2, legA: [1, 0], body: [p('body'), 3, 7], head: [p('head'), 4, 8, 1, -6], arm: p('arm'), armA: [1, 0], shX: [-2, 2], shY: -4,
      stride: 0, armSwing: 0, lean: 0.12, walkLean: 0.12,
      pose: (m) => m.castT > 0 ? { armF: -2.7 + Math.sin(Game.time * 30) * 0.1, armB: -0.6 } : { armF: -0.6 + Math.sin(Game.time * 3 + m.id) * 0.15, armB: -0.3 },
      held: (b) => { if (m_cur14 && m_cur14.castT > 0) { b.save(); b.rotate(Game.time * 14); disk14(b, 0, 0, 3, 3, '#ff5aa0'); disk14(b, 0, 0, 1.5, 1.5, '#ffd0e8'); b.restore(); } },
      behind: (b) => { const tw = Math.sin(Game.time * 4 + (m_cur14 ? m_cur14.id : 0)) * 2; line14(b, -2, 0, -6, 4, '#7a1418', 2); line14(b, -6, 4, -10, 2 + tw, '#7a1418', 1); poly14(b, [-12, 1 + tw, -9, 0 + tw, -10, 4 + tw], '#c42e2e'); },
    };
  }
  m_cur14 = m;
  const f = m.flap || 0, a = 0.7 + Math.sin(f) * 1.0, bob = (Math.sin(Game.time * 3 + m.id) * 1.2);
  rig14(g, u, 64, 56, 32, 30, b => {
    b.translate(0, bob);
    const wing = (dark, da) => { b.save(); b.translate(-2, -9); b.scale(-1, 1); if (dark) DK14 = 0.6; wing14(b, 16, a + da, { m: '#5a0e16', m2: '#7a1a24', b: '#240408', ol: OL14 }, { back: [6, 8], fingers: 4, spread: 1.4, claw: '#e8dcc0' }); DK14 = 0; b.restore(); };
    wing(true, 0.35);
    biped14(b, m, 1, LDEM_R);
    wing(false, 0);
  });
  if (m.dying == null) eyes14(eyes, 3.5, -10.5 + bob, u, '255,210,60', 1.2);
};
let m_cur14 = null;
