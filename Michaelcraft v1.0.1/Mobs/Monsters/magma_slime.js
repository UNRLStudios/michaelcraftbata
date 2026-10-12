'use strict';
// =============================================================================
// MAGMA SLIME   (type 'magmaslime')
//   Bounces at you; splits in two when it dies.
// =============================================================================
defineMob('magmaslime', {
  // ---- STATS ----
  stats: {
    name: 'Magma Slime', w: 1.0, h: 0.8, speed: 2.2, health: 26, hostile: true, dmg: 5, kb: 1.0, reach: 0.25,
    sunproof: true, fireproof: true, under: true, demon: true, glow: '255,110,30',
    loot: [[HELLSTONE, 1, 1, 0.3], [FIRE_PETAL, 1, 1, 0.1]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 6, range: 24 },
  // ---- AI ----
  ai: 'mslime',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.magmaslime, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: ['liquid/lavapop'], vol: 0.6, pitch: [0.6, 0.8], cat: 'volCreatures' },
    hurt: { files: ['terraria/npc_hit_1'], vol: 0.6, pitch: [1.1, 1.3], cat: 'volCreatures', synth: 'hit' },
    death: { files: ['terraria/npc_killed_1'], vol: 0.6, pitch: [1.2, 1.4], cat: 'volCreatures', synth: 'death' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
  onDeath: function (m) {
    if (m.small || netIsClient()) return;
    for (const s of [-1, 1]) { const k = new Mob('magmaslime', m.x + m.w / 2 + s * 0.3 - 0.3, m.y + 0.2); k.w = 0.6; k.h = 0.5; k.small = true; k.health = k.maxHealth = 8; k.vx = s * 4; k.vy = -5; k.state = 'hostile'; k.y = m.y + m.h - k.h; Game.mobs.push(k); }
  },
});

// ---- AI ----
// Magma Slime: hops at you and sets you on fire; big ones burst into two small ones
MOB_AI12.mslime = function (m, dt, p, dx, dist) {
  const def = m.def; let tv = 0;
  m.hopCd = (m.hopCd == null ? 0.8 : m.hopCd) - dt;
  if (m.state === 'hostile') {
    const dir = dx > 0 ? 1 : -1;
    if (m.onGround) { m.squish = Math.min(1, (m.squish || 0) + dt * 2.5); if (m.hopCd <= 0) { m.vy = -8.5 - Math.random() * 2; m.vx = dir * (3.5 + Math.random() * 2); m.kbTimer = 0.6; m.hopCd = 1 + Math.random() * 0.6; m.hopDir = dir; m.squish = 0; sfx('magmaslime.say', mobPos(m)); } }
    else if (m.hopDir) m.vx = m.hopDir * Math.max(3, Math.abs(m.vx));
    if (boxGap(m, p) < def.reach && m.attackCooldown <= 0) { if (hitPlayer(m, def.dmg, 6, 4)) { m.attackCooldown = 1; if (!hasFx12(p, 'fireproof') && !Game.creative) p.fireT = Math.max(p.fireT || 0, 3); } }
  } else if (m.onGround && m.hopCd <= 0) { m.vy = -6; m.vx = (Math.random() < 0.5 ? -1 : 1) * 2; m.kbTimer = 0.5; m.hopCd = 2 + Math.random() * 2; }
  const was = m.onGround;
  mobMove(m, tv, dt);
  if (!was && m.onGround) { for (let i = 0; i < 5; i++) spawnFlame(m.x + Math.random() * m.w, m.y + m.h - 0.1); m.hopDir = 0; }
};

// ---- VISUALS (drawing and effects) ----
MOB_DRAW.magmaslime = (g, m, u, eyes) => {
  const k = m.small ? 0.65 : 1, t = Game.time + m.id;
  const air = !m.onGround, sq = air ? -0.18 : (m.squish || 0) * 0.2 + Math.sin(t * 6) * 0.05;
  const rx = 8 * k * (1 + sq), ry = 6.5 * k * (1 - sq);
  rig14(g, u, 48, 40, 24, 32, b => {
    const cy = -ry;
    disk14(b, 0, cy, rx, ry, '#3a0c08');                       // the crust
    disk14(b, 0.5, cy + 0.5, rx - 1.5, ry - 1.5, '#c8340e');   // the lava inside
    disk14(b, 1, cy + 1, rx - 3.5, ry - 3.2, '#ff7a1a');
    disk14(b, 1.5, cy + 1.5, (rx - 3.5) * 0.45, (ry - 3.2) * 0.45, '#ffd25a');
    // crust plates
    for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.55, x = Math.cos(a) * (rx - 1.2), y = cy + Math.sin(a) * (ry - 1.2); px14(b, x - 1, y, 3, 2, i % 2 ? '#2a0806' : '#5a1a10'); }
    px14(b, -rx * 0.5, cy - ry * 0.5, 2, 1, '#fff0c0');      // a shine
    // bubbles
    const bb = (t * 1.3) % 1; px14(b, -2 + Math.sin(t * 3) * 2, cy + ry * 0.6 - bb * ry * 1.3, 1, 1, '#ffe08a');
    // the face
    px14(b, 2 * k + 1, cy - 1, 1, 2, '#2a0606'); px14(b, 5 * k + 1, cy - 1, 1, 2, '#2a0606'); px14(b, 3 * k + 1, cy + 2, 2, 1, '#2a0606');
  }, { ol: OL14 });
  if (m.dying == null) eyes14(eyes, 3.5 * k, -ry - 0.5, u, '255,200,80', 0.9);
};
