'use strict';
// =============================================================================
// CINDER CRAWLER   (type 'cindercrawler')
//   A crawler of the Ashlands that leaves fire behind it and sets you alight.
// =============================================================================
defineMob('cindercrawler', {
  // ---- STATS ----
  stats: {
    name: 'Cinder Crawler', w: 1.5, h: 0.85, speed: 3.4, health: 16, hostile: true, dmg: 3, kb: 1.0, reach: 0.4,
    climbs: true, fireproof: true, sunproof: true, biome: 'ash', glow: '255,120,30',
    loot: [[RAW_EMBER, 1, 1, 0.25], [117, 1, 2, 0.5], [STRING, 1, 2, 0.3]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'climb', jump: 1, drop: 6, range: 24 },
  // ---- AI ----
  ai: 'crawl',
  // ---- VISUALS ----
  draw: crawlDraw14('cindercrawler', { P: { k: '#141012', s: '#2e2828', S: '#4a403c', l: '#6a5a50', c: '#ff7a1a', C: '#ffd25a', h: '#3a2a24', H: '#5a3e30', E: '#ffcf4a', m: '#e8d0a0' }, leg: '#3e322e', legF: '#2a2020',
    shell: ['.....sSSSSSs.....', '...sSSlSSSSSSs...', '..sSlSSSScSSSSs..', '.sSSSScCSSSSSSSs.', '.sSSSSSScSSSSlSs.', 'sSSlSSSSSSScSSSSs', 'sScCSSSSSSCCSSSSs', 'sSSSSSlSSSSSSScSs', '.ssssssssssssssss'],
    head: ['..hhhh..', '.hHHHHh.', 'hHHHEHHh', 'hHHHHHHHm', 'hHHHHHm.m', '.hhhhm...'], glow: '255,140,40' }),
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/spider/say', 4), vol: 0.8, pitch: [0.8, 1], cat: 'volCreatures' },
    hurt: { files: n_('mob/spider/say', 4), vol: 0.9, pitch: [1.1, 1.3], cat: 'volCreatures' },
    death: { files: ['mob/spider/death'], vol: 0.9, pitch: [0.9, 1.1], cat: 'volCreatures' },
    step: { files: n_('mob/spider/step', 4), vol: 0.15, pitch: [0.9, 1.1], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- AI ----
// Cinder Crawler: a crawler that leaves fire
MOB_AI12.crawl = function (m, dt, p, dx, dist) {
  const def = m.def; let tv = 0;
  if (m.state === 'wander') tv = wanderVx(m, dt);
  else if (m.state === 'hostile') {
    const dir = dx > 0 ? 1 : -1, gap = boxGap(m, p); tv = dir * def.speed;
    m.pounceCd -= dt;
    if (m.onGround && m.pounceCd <= 0 && Math.abs(dx) < 4.5 && Math.abs(dx) > 1.2) { m.vy = -8; m.vx = dir * 8.5; m.pouncing = true; m.pounceCd = 1.6 + Math.random(); m.kbTimer = 0.35; sfx('cindercrawler.say', { x: m.x, y: m.y, pitch: 1.2 }); }
    if (gap < def.reach && m.attackCooldown <= 0) { if (hitPlayer(m, def.dmg, 6, 3.5)) { m.attackCooldown = 0.9; if (!hasFx12(p, 'fireproof')) p.fireT = Math.max(p.fireT || 0, 3); } }
  }
  if (Math.random() < dt * 8 * particleMul()) spawnFlame(m.x + Math.random() * m.w, m.y + m.h * 0.4);
  mobMove(m, tv, dt);
};
