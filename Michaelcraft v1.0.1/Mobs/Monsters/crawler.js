'use strict';
// =============================================================================
// CAVE CRAWLER   (type 'crawler')
//   Fast, climbs walls, pounces from a few tiles away. Won't go near cats.
// =============================================================================
defineMob('crawler', {
  // ---- STATS ----
  stats: {
    name: 'Cave Crawler', w: 1.2, h: 0.72, speed: 3.1, health: 10, hostile: true, dmg: 2, kb: 1.2, reach: 0.35,
    climbs: true,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'climb', jump: 1, drop: 6, range: 24 },
  // ---- AI ----
  brain: walkerBrain,
  tactic: crawlerTactic,
  // ---- VISUALS ----
  draw: drawCrawler,
  deathColors: ['#3c3350', '#8a2a3a'],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/spider/say', 4), vol: 0.8, pitch: [0.9, 1.1], cat: 'volCreatures', synth: 'hiss' },
    hurt: { files: n_('mob/spider/say', 4), vol: 0.9, pitch: [1.1, 1.3], cat: 'volCreatures', synth: 'hit' },
    death: { files: ['mob/spider/death'], vol: 0.9, pitch: [0.9, 1.1], cat: 'volCreatures', synth: 'death' },
    step: { files: n_('mob/spider/step', 4), vol: 0.15, pitch: [0.9, 1.1], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    const r = Math.random;
    if (r() < 0.45) spawnDrop(117, 1, mx, my);
    if (r() < 0.55) spawnDrop(STRING, 1 + Math.floor(r() * 2), mx, my);
  },
});

// ---- AI ----
// once it's after you: keep away from cats, pounce, bite
function crawlerTactic(mob, dt, p, dx, dir, targetVx) {
  const def = mob.def, gap = boxGap(mob, p);
  const scaryCat = Game.mobs.find(c => c.type === 'cat' && c.dying == null && Math.abs(c.x - mob.x) < 6 && Math.abs(c.y - mob.y) < 3);
  if (scaryCat) {   // like creepers in Minecraft, crawlers won't go near cats
    mob.pathTo = null;
    if (Math.random() < dt * 0.5) sfx('cat.hiss', { x: scaryCat.x, y: scaryCat.y });
    return (mob.x > scaryCat.x ? 1 : -1) * def.speed;
  }
  mob.pounceCd -= dt;
  if (mob.onGround && mob.pounceCd <= 0 && Math.abs(dx) < 4 && Math.abs(dx) > 1.2) {
    mob.vy = -7.5; mob.vx = dir * 8; mob.pouncing = true; mob.pounceCd = 1.8 + Math.random();
    mob.kbTimer = 0.35; sfx('crawler.say', { x: mob.x, y: mob.y, pitch: 1.3 });
  }
  if (gap < def.reach && mob.attackCooldown <= 0) { if (hitPlayer(mob, def.dmg, 6, 3.5)) mob.attackCooldown = 0.9; }
  return targetVx;
}

// ---- VISUALS (drawing and effects) ----
// ---- Cave Crawler: low, armored six-legged hunter with red warning marks ----
const CRAWL_C = { h: '#5a4d78', C: '#3c3350', c: '#2a2338', s: '#b0304a', E: '#ff4a3a', T: '#d8d0c0' };
const CRAWL_ABDOMEN = [
  '...hhhhh...',
  '.hhCsCsChh.',
  'hCCCsCsCCCh',
  'CCCCCCCCCCC',
  'cCCCCCCCCCc',
  '.cccccccc..',
];
const CRAWL_HEAD = [
  '.hhh...',
  'hCCCh..',
  'CCCCEEc',
  'cCCCCEc',
  '.cTcT..',
];
function drawCrawler(g, m, u, eyes) {
  const ox = -10 * u, oy = -12 * u;
  const moving = Math.abs(m.vx) > 0.1;
  const ph = m.legPhase * 1.6;
  const bob = moving ? Math.sin(ph * 2) * 0.35 * u : 0;
  const leg = (ax, i, farSide) => {
    const spread = [-1, 0.15, 1.1][i];
    const phase = ph + i * 2.1 + (farSide ? Math.PI : 0);
    const lift = moving ? Math.max(0, Math.sin(phase)) * 1.6 : 0;
    const step = moving ? Math.cos(phase) * 1.4 : 0;
    const air = m.pouncing ? 1 : 0;
    const bx = ox + ax * u, by = oy + 6 * u + bob;
    const kx = bx + (spread * 2.6 + air) * u, ky = by - (3.2 - air) * u;
    const fx = bx + (spread * 4.6 + step + air * 2) * u, fy = oy + 12 * u - lift * u - air * 2 * u;
    g.strokeStyle = farSide ? '#16121f' : '#2a2338';
    g.lineWidth = 1.3 * u; g.lineCap = 'square'; g.lineJoin = 'miter';
    g.beginPath(); g.moveTo(bx, by); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
  };
  for (let i = 0; i < 3; i++) leg(6 + i * 3 + 1, i, true);
  drawPix(g, CRAWL_ABDOMEN, CRAWL_C, ox + 1 * u, oy + 3 * u + bob, u);
  drawPix(g, CRAWL_HEAD, CRAWL_C, ox + 11 * u, oy + 4 * u + bob, u);
  for (let i = 0; i < 3; i++) leg(6 + i * 3, i, false);
  eyes.push({ x: ox + 16 * u, y: oy + 6.5 * u + bob, s: 1.4 * u, c: '255,74,58' });
}
