'use strict';
// =============================================================================
// CRATER CRAWLER   (type 'cratercrawler')
//   A crawler of the Moon: huge low-gravity hops.
// =============================================================================
defineMob('cratercrawler', {
  // ---- STATS ----
  stats: {
    name: 'Crater Crawler', w: 1.4, h: 0.8, speed: 3.0, health: 18, hostile: true, dmg: 3, kb: 1.1, reach: 0.4,
    climbs: true, sunproof: true, moon: true, glow: '160,100,255',
    loot: [[MOON_CRYSTAL_SHARD, 1, 2, 0.35], [LUNARITE, 1, 1, 0.12], [STRING, 1, 2, 0.3]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'climb', jump: 1, drop: 8, range: 24 },
  // ---- AI ----
  ai: 'moonhop',
  // ---- VISUALS ----
  draw: crawlDraw14('cratercrawler', { P: { k: '#141018', s: '#5a5668', S: '#7e7a90', l: '#a8a4ba', c: '#a070ff', C: '#e0ccff', h: '#4a4658', H: '#6a6680', E: '#d8b8ff', m: '#c8c0d8' }, leg: '#5a566c', legF: '#3a3648',
    shell: ['.....sSSSSSs.....', '...sSSlSSSSSSs...', '..sSlSSSSSSCSSs..', '.sSSSScSSSSSSSSs.', '.sSCSSSSSSSlSSSs.', 'sSSlSSSSSSSScSSSs', 'sSSSSSSCSSSSSSSSs', 'sSSScSlSSSSSSSCSs', '.ssssssssssssssss'],
    head: ['..hhhh..', '.hHHHHh.', 'hHHHEHHh', 'hHHHHHHHm', 'hHHHHHm.m', '.hhhhm...'], glow: '200,150,255' }),
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/spider/say', 4), vol: 0.5, pitch: [0.6, 0.75], cat: 'volCreatures', synth: 'hiss' },
    hurt: { files: n_('mob/spider/say', 4), vol: 0.6, pitch: [0.8, 0.95], cat: 'volCreatures', synth: 'hit' },
    death: { files: ['mob/spider/death'], vol: 0.6, pitch: [0.65, 0.75], cat: 'volCreatures', synth: 'death' },
    step: { files: n_('mob/spider/step', 4), vol: 0.12, pitch: [0.7, 0.8], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- AI ----
// Crater Crawler: big, floaty, low-gravity hops at you, and a bite when it lands
MOB_AI12.moonhop = function (m, dt, p, dx, dist) {
  const def = m.def; let tv = 0;
  if (m.state === 'wander') tv = wanderVx(m, dt);
  else if (m.state === 'hostile') {
    const dir = dx > 0 ? 1 : -1;
    tv = dir * def.speed * 0.6;
    m.hopCd = (m.hopCd == null ? 0.6 : m.hopCd) - dt;
    if (m.onGround && m.hopCd <= 0 && Math.abs(dx) < 9) { m.vy = -7.2; m.vx = dir * (4 + Math.random() * 2); m.kbTimer = 0.5; m.hopCd = 1.1 + Math.random() * 0.8; sfx('cratercrawler.say', mobPos(m)); }
    if (boxGap(m, p) < def.reach && m.attackCooldown <= 0) { m.attackAnim = 1; if (hitPlayer(m, def.dmg, 5, 3)) m.attackCooldown = 1.0; else m.attackCooldown = 0.4; }
  }
  const was = m.onGround;
  mobMove(m, tv, dt);
  if (!was && m.onGround) moonPuff13(m.x + m.w / 2, m.y + m.h, 6);
};
