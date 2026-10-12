'use strict';
// =============================================================================
// SQUID   (type 'squid')
//   Drifts through deeper water in pulses; squirts ink when hit.
// =============================================================================
defineMob('squid', {
  // ---- STATS ----
  // Squid: drifts through deeper water in pulses; squirts ink when hit
  stats: {
    name: 'Squid', w: 0.9, h: 0.9, speed: 3, health: 10, hostile: false, dmg: 0, kb: 0.8, aquatic: true,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // it swims: its AI keeps it in the water
  // ---- AI ----
  brain: squidAI,
  // ---- VISUALS ----
  draw: drawSquid,
  deathColors: ['#304563', '#4a6488'],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('entity/squid/ambient', 5), vol: 0.45, pitch: [0.8, 1.2], cat: 'volFriendly' },
    hurt: { files: n_('entity/squid/hurt', 4), vol: 0.6, pitch: [0.8, 1.2], cat: 'volFriendly', synth: 'hit' },
    death: { files: n_('entity/squid/death', 3), vol: 0.6, pitch: [0.8, 1.2], cat: 'volFriendly', synth: 'death' },
    squirt: { files: n_('entity/squid/squirt', 3), vol: 0.6, pitch: [0.8, 1.2], cat: 'volFriendly' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    const r = Math.random;
    spawnDrop(160, 1 + Math.floor(r() * 3), mx, my);
  },
});

// ---- AI ----
function squidAI(m, dt, p, dx, dist) {
  const w = Game.world;
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  m.inWater = isWaterTile(w, cx, cy);
  m.waterPush = 0;
  m.pulse = Math.max(0, (m.pulse || 0) - dt * 1.5);   // 1 right after a push, then the tentacles relax open
  m.soundCd -= dt;
  if (m.soundCd <= 0) { m.soundCd = 9 + Math.random() * 12; if (dist < 16 && m.inWater) sfx('squid.say', mobPos(m)); }
  if (m.inWater) {
    m.airTime = 0;
    m.stateTimer -= dt;
    if (m.state === 'flee' && m.stateTimer <= 0) m.state = 'wander';
    m.thrustT = (m.thrustT ?? Math.random() * 2) - dt;
    if (m.thrustT <= 0 && m.kbTimer <= 0) {
      // away from you when scared, otherwise a lazy drift in any direction
      const ang = m.state === 'flee'
        ? Math.atan2(cy - (p.y + p.h / 2), cx - (p.x + p.w / 2)) + (Math.random() - 0.5) * 0.8
        : Math.random() * Math.PI * 2;
      let ax = Math.cos(ang), ay = Math.sin(ang);
      // stay in the water: don't head for the surface, the bed or the shore
      if (ay < 0 && !isWaterTile(w, cx, m.y - 0.7)) ay = Math.abs(ay) * 0.6;
      if (ay > 0 && !isWaterTile(w, cx, m.y + m.h + 0.7)) ay = -Math.abs(ay) * 0.6;
      if (!isWaterTile(w, cx + Math.sign(ax) * (m.w / 2 + 0.9), cy)) ax = -ax;
      const power = m.state === 'flee' ? 6.5 : 2.4 + Math.random() * 1.6;
      m.vx = ax * power; m.vy = ay * power;
      m.pulse = 1;
      m.thrustT = m.state === 'flee' ? 0.45 + Math.random() * 0.3 : 1.5 + Math.random() * 2.4;
    }
    const drag = Math.pow(0.3, dt);   // glides to a stop between pushes
    m.vx *= drag; m.vy *= drag;
    if (!isWaterTile(w, cx, m.y - 0.1)) m.vy = Math.max(m.vy, 0.8);   // never pokes out of the surface
    // the body turns to point where it's going (mantle first); at rest it floats upright
    const sp = Math.hypot(m.vx, m.vy);
    m.tilt = lerpAngle(m.tilt || 0, sp > 0.5 ? Math.atan2(m.vy, m.vx) + Math.PI / 2 : 0, dt * (sp > 0.5 ? 4 : 1.2));
  } else {
    m.vy = Math.min(MAX_FALL_SPEED, m.vy + GRAVITY * dt);
    if (m.onGround) {
      m.vx = approach(m.vx, 0, 8 * dt);
      if (Math.random() < dt * 1.2) { m.vy = -3.2; m.vx = (Math.random() - 0.5) * 2; m.pulse = 1; }
    }
    m.tilt = lerpAngle(m.tilt || 0, Math.PI / 2, dt * 4);   // flops over on its side
    m.airTime += dt;
    if (m.airTime > 1.5) { m.airTime = 0; m.health -= 1; m.hurtFlash = 0.3; if (m.health <= 0) killMob(m); }
  }
  m.facingDir = 1;
  m.legPhase += dt;
  moveAndCollide(m, w, dt);
  if (m.y > WORLD_H + 5) m.dead = true;
}
// A cloud of ink, and a quick getaway.
function squidInk(m) {
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  sfx('squid.squirt', { x: cx, y: cy });
  const n = Math.round(22 * Math.max(0.4, particleMul()));
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 2.2;
    Game.particles.push({
      x: cx + (Math.random() - 0.5) * 0.4, y: cy + (Math.random() - 0.5) * 0.4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 1.2 + Math.random() * 1.2, age: 0, size: 0.16 + Math.random() * 0.2,
      color: Math.random() < 0.5 ? 'rgba(10,10,18,0.8)' : 'rgba(28,26,40,0.7)', gravity: -0.3, mist: true,
    });
  }
}

// ---- VISUALS (drawing and effects) ----
// ---- Squid (passive): a blue-grey mantle with big eyes and eight
//      tentacles that snap together on each push and drift open after ----
const SQUID_C = { S: '#304563', s: '#223249', l: '#4a6488', h: '#6a86ad', W: '#f2f2f2', P: '#0c0c10', M: '#8e6d86', T: '#2b3e59', t: '#4a6488' };
const SQUID_MANTLE = [
  '...ss...',
  '..sSSs..',
  '.sSlSSs.',
  'sShlSSSs',
  'sSlSSSSs',
  'sSSSSSSs',
  'sSSSSSSs',
  'sWPSSPWs',
  'sSSSSSSs',
  '.sSMMSs.',
];
const SQUID_TENTACLE = ['T', 'T', 'T', 'T', 'T', 't', 't'];
function drawSquid(g, m, u) {
  g.save();
  g.translate(0, -m.h * TILE / 2);          // pivot on the middle of the body
  g.rotate(m.tilt || 0);
  g.scale(1.4, 1.4);
  const spread = 0.12 + (1 - (m.pulse || 0)) * 0.42;   // closed right after a push, open when relaxed
  for (let i = 0; i < 6; i++) {
    const k = i - 2.5;
    const ang = -k * spread * 0.35 + Math.sin((m.legPhase || 0) * 2.2 + i * 1.3) * 0.08;
    drawPart(g, SQUID_TENTACLE, SQUID_C, k * u * 1.1, 2.6 * u, 0.5, 0, ang, u);
  }
  drawPix(g, SQUID_MANTLE, SQUID_C, -4 * u, -7.5 * u, u);
  g.restore();
}

// ---- SPAWNING ----
// Squids like deeper, open water: a spot with water all around it and at
// least two blocks of water above.
function maybeSpawnSquid() {
  if (Game.world.isInterior || Math.random() > 0.35 || Game.mobs.filter(m => m.type === 'squid').length >= 4) return;
  const p = Game.player, w = Game.world;
  for (let tries = 0; tries < 4; tries++) {
    const x = Math.floor(p.x + (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 20));
    const y = Math.floor(p.y) - 8 + Math.floor(Math.random() * 20);
    if (y < 3 || y >= WORLD_H - BEDROCK_ROWS - 1) continue;
    let ok = true;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0, -2], [1, -1]]) if (w.getTile(x + dx, y + dy) !== WATER_SRC) { ok = false; break; }
    if (!ok) continue;
    Game.mobs.push(new Mob('squid', x + 0.05, y - 0.2));
    return;
  }
}
