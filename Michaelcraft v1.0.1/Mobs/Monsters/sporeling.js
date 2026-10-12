'use strict';
// =============================================================================
// SPORELING   (type 'sporeling')
//   Hops at you; if it reaches you (or dies) a cloud of poison spores bursts out.
// =============================================================================
defineMob('sporeling', {
  // ---- STATS ----
  stats: {
    name: 'Sporeling', w: 0.7, h: 0.75, speed: 2.4, health: 10, hostile: true, dmg: 2, kb: 1.2, reach: 0.3,
    sunproof: true, biome: 'redwood', loot: [[BROWN_MUSHROOM_ITEM, 1, 2, 0.6], [RED_MUSHROOM_ITEM, 1, 1, 0.35]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 4, range: 24 },
  // ---- AI ----
  ai: 'sporeling',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.sporeling, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/pig/say', 3), vol: 0.5, pitch: [1.6, 1.9], cat: 'volCreatures' },
    hurt: { files: n_('mob/chicken/hurt', 2), vol: 0.9, pitch: [1.2, 1.5], cat: 'volCreatures' },
    death: { files: n_('mob/chicken/hurt', 2), vol: 0.9, pitch: [0.9, 1.1], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
  onDeath: (m) => { if (!m.sporeDone) sporeCloud12(m); },
});

// ---- AI ----
// Sporeling: hops at you; if it reaches you (or dies) a cloud of poison spores bursts out
function sporeCloud12(m) {
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  for (let i = 0; i < 26 * particleMul() + 4; i++) { const a = Math.random() * 6.28, sp = Math.random() * 2.2; Game.particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.5, life: 1.1 + Math.random() * 0.8, age: 0, size: 0.1 + Math.random() * 0.14, color: i % 3 ? 'rgba(150,230,90,0.55)' : 'rgba(230,240,150,0.6)', gravity: -0.2, mist: true }); }
  sfx('hiss', { x: cx, y: cy }); 
  const p = Game.player; if (p && !p.dead && Math.hypot(p.x + p.w / 2 - cx, p.y + p.h / 2 - cy) < 2.6) { addFx12(p, 'poison', 6); }
}
MOB_AI12.sporeling = function (m, dt, p, dx, dist) {
  const def = m.def; m.hopT = Math.max(0, (m.hopT || 0) - dt);
  let tv = 0;
  if (m.state === 'hostile') {
    const dir = dx > 0 ? 1 : -1;
    m.hopCd = (m.hopCd == null ? 0.5 : m.hopCd) - dt;
    if (m.onGround && !m.hopping && m.hopCd <= 0) { m.hopping = true; m.hopT = 0.28; }   // crouch...
    if (m.hopping && m.hopT <= 0 && m.onGround) { m.hopping = false; m.vy = -8.5; m.vx = dir * 4.2; m.hopDir = dir; m.kbTimer = 0.45; m.hopCd = 0.9 + Math.random() * 0.5; }
    else if (!m.onGround && m.hopDir) m.vx = m.hopDir * 4.2;   // keep steering in the air (a ledge can't stop a hop)
    if (m.onGround && !m.hopping && (m.hopCd || 0) < 0.8) m.hopDir = 0;   // ...and spring
    if (boxGap(m, p) < 0.3 && m.attackCooldown <= 0) { if (hitPlayer(m, def.dmg, 5, 3)) { sporeCloud12(m); m.attackCooldown = 1; m.health = 0; killMob(m); m.sporeDone = true; return; } }
  } else if (m.onGround && Math.random() < dt * 0.4) { m.vy = -5; m.vx = (Math.random() < 0.5 ? -1 : 1) * 1.5; m.kbTimer = 0.4; }
  mobMove(m, tv, dt);
};

// ---- VISUALS (drawing and effects) ----
const SPORE_P = { r: '#b8262a', R: '#d84038', w: '#f4ecdc', s: '#e8dcc0', S: '#c8b898', k: '#2a1a14', g: '#8aa04a', d: '#9a1a20' };
const SPORE_G = {
  cap: ['....rrRRrr....', '..rRRwwRRRRr..', '.rRRRwwRRwRRr.', 'rRwRRRRRRRRwRr', 'rRRRRRRwwRRRRr', 'dddddddddddddd'],
  stem: ['.ssssss.', 'sssssss', 'ssskssk', 'sssssss', 'ssskkks', '.Ssssss', '.SSsss.', 'k.k.k.k'],
};
MOB_DRAW.sporeling = (g, m, u, eyes) => {
  const p = n => mp14('spore', n, SPORE_G[n], SPORE_P, {});
  const crouch = m.hopping && m.hopT > 0 && m.onGround, air = !m.onGround;
  const sq = crouch ? 2 : 0, st = air ? 1 : 0, t = Game.time + m.id;
  rig14(g, u, 40, 32, 20, 26, b => {
    drawP14(b, p('stem'), 0, 0, 4, 7, 1, 0);
    if (sq) { b.clearRect(-6, -9, 13, 0); }
    drawP14(b, p('cap'), 0, -7 + sq - st * 2, 7, 5, 1, air ? -0.15 : Math.sin(t * 2) * 0.05);
    // spores puffing out of the cap
    if (Math.floor(t * 3) % 2 === 0) px14(b, -5 + (t * 7 % 10), -14 - (t * 5 % 4), 1, 1, '#c8e07a');
  });
  if (m.dying == null) eyes14(eyes, 1.5, -5, u, '255,240,180', 0.8);
};
