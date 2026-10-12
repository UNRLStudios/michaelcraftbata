'use strict';
// =============================================================================
// FISH   (type 'fish')
//   Swims about in water, darts away if you rush at it, turns back at the water's edge.
//   Stranded on land it flops around and slowly suffocates.
// =============================================================================
defineMob('fish', {
  // ---- STATS ----
  stats: {
    name: 'Fish', w: 0.7, h: 0.42, speed: 2.4, health: 3, hostile: false, dmg: 0, kb: 1.2, aquatic: true,
    variants: 3,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // it swims: its AI keeps it in the water
  // ---- AI ----
  brain: fishAI,
  // ---- VISUALS ----
  draw: drawFish,
  deathColors: ['#8fb0c4', '#dfe7ea'],
  // ---- SOUNDS ----
  sounds: {
    hurt: { files: n_('entity/fish/hurt', 4), vol: 0.6, pitch: [0.8, 1.2], cat: 'volFriendly', synth: 'flop' },
    death: { files: n_('entity/fish/hurt', 4), vol: 0.6, pitch: [0.8, 1], cat: 'volFriendly', synth: 'flop' },
    flop: { files: n_('entity/fish/flop', 4), vol: 0.6, pitch: [0.8, 1.2], cat: 'volFriendly', synth: 'flop' },
    swim: { files: n_('entity/fish/swim', 7), vol: 0.35, pitch: [0.9, 1.1], cat: 'volFriendly' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    spawnDrop(138, 1, mx, my);
  },
});

// ---- AI ----
// FISH — swim about in water, dart away if you rush at them, and turn back
// at the water's edge. Stranded on land they flop around and slowly suffocate.
function fishAI(m, dt, p, dx, dist) {
  const w = Game.world, def = m.def;
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  m.inWater = isWaterTile(w, cx, cy);
  m.waterPush = 0;
  m.flap += dt * (m.inWater ? 8 + Math.abs(m.vx) * 3 : 22);
  if (m.inWater) {
    m.airTime = 0;
    m.stateTimer -= dt;
    if (m.state === 'flee' && m.stateTimer <= 0) m.state = 'wander';
    if (m.state !== 'flee' && m.stateTimer <= 0) {
      m.dir = Math.random() < 0.25 ? 0 : (Math.random() < 0.5 ? -1 : 1);
      m.swimVy = (Math.random() - 0.5) * 1.4;
      m.stateTimer = 1 + Math.random() * 3;
    }
    if (m.state !== 'flee' && dist < 2.6 && !p.dead && Math.hypot(p.vx, p.vy) > 1.5) {
      m.state = 'flee'; m.stateTimer = 1.3; m.fleeDir = dx > 0 ? -1 : 1;
      sfx('fish.swim', mobPos(m));
    }
    let want = m.state === 'flee' ? m.fleeDir * def.speed * 1.8 : m.dir * def.speed * 0.55;
    if (want !== 0 && !isWaterTile(w, cx + Math.sign(want) * (m.w / 2 + 0.35), cy)) {   // edge of the water: turn round
      want = -want; m.dir = -m.dir; m.fleeDir = -(m.fleeDir || 1);
    }
    let vyWant = m.swimVy;
    if (!isWaterTile(w, cx, m.y - 0.2)) vyWant = Math.max(0.5, vyWant);              // stay below the surface
    if (!isWaterTile(w, cx, m.y + m.h + 0.2)) vyWant = Math.min(-0.3, vyWant);       // and off the bottom
    if (m.kbTimer <= 0) { m.vx = approach(m.vx, want, 6 * dt); m.vy = approach(m.vy, vyWant, 5 * dt); }
    else { m.vx *= Math.pow(0.1, dt); m.vy *= Math.pow(0.1, dt); }
    if (Math.abs(m.vx) > 0.15) m.facingDir = Math.sign(m.vx);
  } else {
    m.vy = Math.min(MAX_FALL_SPEED, m.vy + GRAVITY * dt);
    if (m.onGround) {
      m.vx = approach(m.vx, 0, 8 * dt);
      if (Math.random() < dt * 2.2) { m.vy = -4 - Math.random() * 2.5; m.vx = (Math.random() - 0.5) * 3.5; sfx('fish.flop', mobPos(m)); }
    }
    m.airTime += dt;
    if (m.airTime > 1.2) { m.airTime = 0; m.health -= 1; m.hurtFlash = 0.3; if (m.health <= 0) killMob(m); }
  }
  moveAndCollide(m, w, dt);
  if (m.y > WORLD_H + 5) m.dead = true;
}

// ---- VISUALS (drawing and effects) ----
// ---- Fish (passive): three colourings; the tail wags as it swims ----
const FISH_PALS = [
  { B: '#a88a5c', b: '#e0d2b0', S: '#8a6e46', T: '#8a7048', E: '#111111' },   // brown
  { B: '#b8434a', b: '#e8b0a0', S: '#5e7a6a', T: '#8c3036', E: '#111111' },   // red
  { B: '#f08a2a', b: '#fff4e8', S: '#ffffff', T: '#e07020', E: '#111111' },   // orange and white
];
const FISH_BODY = ['..BBBBB...', '.BBSBBBBB.', 'BBBSBBBBEB', 'BBBBBBBBBB', 'bbbbbbbbb.', '.bbbbbbb..'];
const FISH_TAIL = ['TT.', 'TTT', '.TT', '.TT', 'TTT', 'TT.'];
function drawFish(g, m, u) {
  const pal = FISH_PALS[m.variant % FISH_PALS.length];
  g.save();
  g.translate(0, -3.3 * u);
  if (m.inWater) g.rotate(Math.max(-0.5, Math.min(0.5, (m.vy || 0) * 0.2)));
  else g.rotate(Math.sin(m.flap) * 0.45);
  const wag = Math.sin(m.flap) * (m.inWater ? 0.35 : 0.6);
  drawPart(g, FISH_TAIL, pal, -4 * u, 0, 2.5, 3, wag, u);
  drawPix(g, FISH_BODY, pal, -4 * u, -3 * u, u);
  g.restore();
}

// ---- SPAWNING ----
// Fish appear in open water (seas, lakes, flooded caves) near the player.
function maybeSpawnFish() {
  if (Game.world.isInterior || Game.mobs.filter(m => m.type === 'fish').length >= 7) return;
  const p = Game.player, w = Game.world;
  for (let tries = 0; tries < 4; tries++) {
    const x = Math.floor(p.x + (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 20));
    const y = Math.floor(p.y) - 8 + Math.floor(Math.random() * 18);
    if (y < 1 || y >= WORLD_H - BEDROCK_ROWS) continue;
    if (w.getTile(x, y) !== WATER_SRC || w.getTile(x - 1, y) !== WATER_SRC || w.getTile(x + 1, y) !== WATER_SRC) continue;
    const m = new Mob('fish', x + 0.15, y + 0.3);
    Game.mobs.push(m);
    return;
  }
}
