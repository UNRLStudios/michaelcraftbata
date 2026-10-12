'use strict';
// =============================================================================
// THE SINGULARITY   (type 'singularity')  -  the first Hardmode boss
//   A collapsed star wrapped in void-crystal: a black hole for an eye, halos of light, rings of matter
//   it has torn out of the world, and crystals it hangs in the air like knives. Harder than the Slayer.
//
//   HOW TO FIGHT IT: in Hardmode, make a COLLAPSED STAR at the Magical Workbench (Items/singularity.js)
//   and use it anywhere on the surface. /summon singularity also works.
//   It has 85,000 health (more with friends). At half health it COLLAPSES into its second form, and at a
//   quarter it opens its EVENT HORIZON: space drags you toward it for the rest of the fight, and it gets faster.
//
//   ITS ATTACKS (each one is warned first, and each one has a way out):
//     VOID LASER          a thin line marks where it will fire, then a massive beam of pure void.
//                         Second form: the beam sweeps.
//     GRAVITATIONAL PULL  it opens a well that drags you in for a few seconds, then explodes. Run.
//     ORBITAL FRAGMENTS   void orbs circle it, then launch one by one and home in on you (they turn slowly:
//                         make them commit, then sidestep).
//     REALITY SHARDS      columns of light mark the ground, then crystal shards fall from the sky.
//     SINGULARITY RING    a ring of energy closes in around it and opens back out. Slip through a gap.
//     VOID DASH           a lane of light shows where it's going, then it rips straight through it, 3 times
//                         in a row (4 in its second form, and each dash spits bolts). Step out of the lane.
//     TELEPORT            it folds itself away... and unfolds beside you, already attacking.
//   Between attacks it never stops: it circles you fast and fires fans of bolts.
//     FINALE (second form) it unleashes several small voids at once: each one pulls, spits a ring of
//                         bolts, then collapses.
//   Touching it hurts too.
//   It drops SINGULARITY FRAGMENTS (for the Singularity sword: Items/singularity.js), Voidsteel and more.
// =============================================================================
const SING_SUMMON = 507, SING_FRAGMENT = 508;
defItem(SING_SUMMON, 'Collapsed Star', { kind: 'material', stack: 16 });
defItem(SING_FRAGMENT, 'Singularity Fragment', { kind: 'material', stack: 64 });

// ---- STATS ----
const SG22 = {
  hp: 85000,            // (in Hardmode: the usual Hardmode boost doesn't apply, this is the real number)
  dmgMult: 2.0,         // every hit (x the Hardmode/difficulty multipliers, like every boss)
  phase2At: 0.5,        // its second form, at this much health
  phase3At: 0.25,       // EVENT HORIZON: its last stand (space pulls you toward it, and everything gets faster)
  horizonPull: 7,       // how hard the event horizon drags you in (tiles/s per second)
  contactDmg: 11,
  dashDmg: 15,          // being run through by its dash
  tempo: { speed: 22, accel: 60, dashSpeed: 48, bolts: 0.75, boltSpeed: 17 },   // how fast it flies, how hard it turns, its dash, seconds between bolt fans
  dmg: { laser: 13, well: 12, orb: 8, shard: 9, ring: 10, bolt: 7, void: 11 },
  scale: 0.5,           // art pixels -> 1/16 blocks (the art is drawn big: about 10-13 blocks across)
  core: { 1: [164, 119], 2: [234, 167] },   // where the black hole is in each picture
  haz: [], world: null,
};
defineMob('singularity', {
  stats: {
    name: 'The Singularity', w: 4.6, h: 4.6, speed: 10, health: SG22.hp, hostile: true, boss: true, dmg: SG22.contactDmg, kb: 0,
    flying: true, fireproof: true, sunproof: true, custom: 'singularity', tintMul: 1.4,
  },
  path: { mode: 'none' },   // it flies wherever it likes
  draw: (g, m, u) => sgDraw22(g, m, u),
  sounds: {
    hurt: { files: terraria_('dd2_wither_beast_crystal_impact', 3), vol: 0.45, pitch: [1.1, 1.35], cat: 'volCreatures', synth: 'hit' },
    death: { files: ['terraria/dd2_betsy_death_0'], vol: 1.1, pitch: [0.45, 0.5], cat: 'volCreatures', synth: 'death' },
    'sg.spawn': { files: ['terraria/roar_0'], vol: 1.2, pitch: [0.42, 0.46], cat: 'volCreatures' },
    'sg.thunder': { files: ['terraria/thunder_0', 'terraria/thunder_2'], vol: 0.8, pitch: [0.6, 0.7], cat: 'volAmbient' },
    'sg.hum': { files: terraria_('dd2_wither_beast_aura_pulse', 2), vol: 0.55, pitch: [0.45, 0.55], cat: 'volCreatures' },
    'sg.charge': { files: ['terraria/dd2_etherian_portal_open'], vol: 0.9, pitch: [0.75, 0.85], cat: 'volCreatures' },
    'sg.laser': { files: ['terraria/dd2_betsy_flame_breath'], vol: 1, pitch: [0.5, 0.56], cat: 'volCreatures' },
    'sg.zap': { files: terraria_('dd2_lightning_aura_zap', 4), vol: 0.6, pitch: [0.6, 0.8], cat: 'volCreatures' },
    'sg.pull': { files: terraria_('dd2_etherian_portal_spawn_enemy', 2), vol: 1, pitch: [0.45, 0.5], cat: 'volCreatures' },
    'sg.boom': { files: terraria_('dd2_explosive_trap_explode', 2), vol: 1, pitch: [0.55, 0.65], cat: 'volCreatures', synth: 'slam' },
    'sg.orb': { files: terraria_('dd2_dark_mage_attack', 3), vol: 0.6, pitch: [0.7, 0.9], cat: 'volCreatures' },
    'sg.launch': { files: terraria_('dd2_ghastly_glaive_pierce', 3), vol: 0.5, pitch: [0.6, 0.75], cat: 'volCreatures' },
    'sg.shardfall': { files: terraria_('dd2_wyvern_dive_down', 3), vol: 0.45, pitch: [1.2, 1.4], cat: 'volCreatures' },
    'sg.shard': { files: terraria_('dd2_wither_beast_crystal_impact', 3), vol: 0.6, pitch: [0.65, 0.8], cat: 'volCreatures' },
    'sg.ring': { files: terraria_('dd2_wither_beast_aura_pulse', 2), vol: 0.9, pitch: [0.75, 0.85], cat: 'volCreatures' },
    'sg.tp': { files: ['terraria/item_6'], vol: 0.9, pitch: [0.5, 0.6], cat: 'volCreatures' },
    'sg.phase': { files: ['terraria/dd2_betsy_scream'], vol: 1.1, pitch: [0.38, 0.42], cat: 'volCreatures' },
    'sg.shatter': { files: ['terraria/shatter'], vol: 1, pitch: [0.5, 0.6], cat: 'volCreatures' },
  },
  onDeath: function (m) {
    bossReward(m, null);
    const first = !Game.flags.singularityDown; Game.flags.singularityDown = true;
    const mx = m.x + m.w / 2, my = m.y + m.h / 2, r = Math.random;
    const loot = [[SING_FRAGMENT, first ? 3 : 1 + Math.floor(r() * 2)], [VOIDSTEEL_INGOT, 8 + Math.floor(r() * 7)], [MANA_STAR, 3], [DIAMOND, 6 + Math.floor(r() * 5)], [134, 20 + Math.floor(r() * 12)], [VOID_CRYSTAL, 6 + Math.floor(r() * 4)]];
    if (typeof SHATTERED_CRYSTAL !== 'undefined') loot.push([SHATTERED_CRYSTAL, 3 + Math.floor(r() * 4)]);
    for (const [it, q] of loot) { const d = spawnDrop(it, q, mx, my); if (d) { d.vx = (r() - 0.5) * 10; d.vy = -4 - r() * 6; } }
    Game.boss = null;
    eventMessage('THE SINGULARITY HAS COLLAPSED.', '#c070ff');
    bigTitle12('Victory', 'the void falls silent', '#b4a0ff');
    sfx('toast.challenge');
  },
  boss: {
    name: 'The Singularity', music: 'Sounds/music/desperation_BGM.mp3',
    home: (m) => ({ x: m.x + m.w / 2, y: m.y + m.h / 2 }),
    chase: { x: 70, y: 50 }, dmgMult: SG22.dmgMult,
    leaveMsg: 'The Singularity folds itself away into nothing...', color: '#b070ff', leaveColors: ['#2a0a5a', '#7a3aff', '#0a0418'],
    onLeave: () => { SG22.haz.length = 0; },
    dying: (m, dt) => sgDying22(m, dt),
  },
  bossAI: (m, dt, p) => sgAI22(m, dt, p),
});

// ---- ITS PICTURES: phase 1 and phase 2, cut into canvases (the crystals sway, so they're drawn in strips) ----
const SG_ART22 = { 1: null, 2: null };
for (const ph of [1, 2]) {
  const path = 'Textures/entities/singularity/phase' + ph + '.png', img = new Image();
  img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); SG_ART22[ph] = c; };
  img.src = (window.TEXTURE_BUNDLE && window.TEXTURE_BUNDLE[path]) || path;
}

// ---- helpers ----
function sgBoss22() { const b = Game.boss; return b && b.type === 'singularity' && !b.dead ? b : null; }
function sgSpawn22(h) {   // a hazard, on every game (the host sends it to friends)
  if (Net.fxCapture) netFx(['sg', h]);
  h.age = 0; SG22.haz.push(h); sgOnSpawn22(h);
}
function sgHurt22(dmg, fromX, kb, ifr) {   // hurt MY player (each game does its own)
  const p = Game.player; if (!p || p.dead || Game.creative || p.invuln > 0 || Game.spectator) return false;
  dmg = Math.max(1, bossHardHit22(Math.round(dmg * SG22.dmgMult * bossDiffMul13())));
  p.lastKiller = 'The Singularity';
  const was = Net.fxCapture; Net.fxCapture = false;
  try {
    p.damage(dmg, 'boss');
    if (!p.dead) { p.invuln = Math.max(p.invuln, ifr || 0.5); const dir = (p.x + p.w / 2) >= fromX ? 1 : -1; const k = kb || [8, 5]; p.knockback(dir, k[0], k[1]); }
  } finally { Net.fxCapture = was; }
  return true;
}
function sgGround22(x, from) {
  const tx = Math.floor(x); let y = Math.floor(from);
  for (let k = 0; k < 60 && y < WORLD_H - 1; k++, y++) if (solidAt(tx, y) && !solidAt(tx, y - 1)) return y;
  return Math.floor(from) + 20;
}
function sgParts22(x, y, n, sp, cols, o) {
  o = o || {};
  for (let i = 0; i < n * particleMul(); i++) {
    const a = o.dir != null ? o.dir + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * 6.283, v = (0.3 + Math.random()) * sp;
    Game.particles.push({ x: x + (Math.random() - 0.5) * (o.r || 0), y: y + (Math.random() - 0.5) * (o.r || 0), vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: (o.life || 0.6) * (0.6 + Math.random() * 0.6), age: 0, size: (o.size || 0.08) * (0.6 + Math.random()), color: cols[i % cols.length], gravity: o.g || 0, kind: 'star' });
  }
}
const SG_COLS22 = ['#b070ff', '#7a3aff', '#ff6af0', '#5a8aff', '#e8d8ff'];
// a spark falling INTO a point (for the pull and the collapse)
function sgSuck22(x, y, R, n, col) {
  for (let i = 0; i < n * particleMul(); i++) { const a = Math.random() * 6.283, r = R * (0.5 + Math.random() * 0.5), t = 0.5 + Math.random() * 0.3; Game.particles.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: -Math.cos(a) * r / t + Math.sin(a) * 3, vy: -Math.sin(a) * r / t - Math.cos(a) * 3, life: t, age: 0, size: 0.07 + Math.random() * 0.06, color: col || SG_COLS22[i % 5], gravity: 0, kind: 'star' }); }
}

// ---- HAZARDS: made on the host, copied to friends; each game moves them and checks its own player ----
function sgOnSpawn22(h) {
  switch (h.t) {
    case 'laser': sfx('sg.charge', { x: h.x, y: h.y }); break;
    case 'well': sfx('sg.pull', { x: h.x, y: h.y }); break;
    case 'orb': if (h.k === 0) sfx('sg.orb', { x: h.x, y: h.y }); break;
    case 'shard': if (h.i % 4 === 0) sfx('sg.zap', { x: h.x, y: h.gy, vol: 0.5 }); break;
    case 'ring': sfx('sg.ring', { x: h.x, y: h.y }); break;
    case 'dashline': sfx('sg.charge', { x: h.x, y: h.y, pitch: 1.7, vol: 0.55 }); break;
    case 'void': sfx('sg.pull', { x: h.x, y: h.y, pitch: 0.7, vol: 0.6 }); break;
    case 'blink': sfx('sg.tp', { x: h.x, y: h.y }); sgParts22(h.x, h.y, 40, h.out ? 9 : 2, SG_COLS22, { r: h.out ? 1 : 6, life: 0.5 }); if (!h.out) sgSuck22(h.x, h.y, 6, 30); break;
  }
}
const SG_RING22 = (h) => {   // the ring's radius at its age: in to rmin, then back out past where it started
  const k = h.age / h.dur, inT = 0.48;
  return k < inT ? h.r0 + (h.rmin - h.r0) * Math.sin(k / inT * Math.PI / 2) : h.rmin + (h.r0 + 4 - h.rmin) * Math.pow((k - inT) / (1 - inT), 1.3);
};
function sgNear22(x, y) { const p = Game.player; return p && Math.hypot(p.x - x, p.y - y) < 70; }
B12.updaters.push(function sgHazards22(dt, p) {
  const H = SG22.haz;
  if (SG22.world !== Game.world) { SG22.world = Game.world; H.length = 0; }
  if (!H.length) return;
  if (!Game.mobs.some(m => m.type === 'singularity' && !m.dead)) { H.length = 0; return; }
  const pcx = p.x + p.w / 2, pcy = p.y + p.h / 2, alive = !p.dead && !Game.creative && !Game.spectator;
  const T = (x) => Math.round(x * 100) / 100;
  for (let i = H.length - 1; i >= 0; i--) {
    const h = H[i]; h.age += dt; let done = false;
    switch (h.t) {
      case 'laser': {   // a thin warning line, then the beam
        const a = h.a + (h.age > h.warn ? (h.age - h.warn) * (h.sweep || 0) : 0), L = h.len, ex = h.x + Math.cos(a) * L, ey = h.y + Math.sin(a) * L;
        h.ca = a;
        if (h.age > h.warn && !h.fired) { h.fired = true; if (sgNear22(h.x, h.y)) { sfx('sg.laser', { x: h.x, y: h.y }); sfx('sg.zap', { x: h.x, y: h.y }); Game.shake = Math.min(1.4, Game.shake + 0.5 * Settings.shake / 100); } }
        if (h.age > h.warn && h.age < h.warn + h.dur) {
          if (Math.random() < 0.8) { const f = Math.random(); sgParts22(h.x + (ex - h.x) * f, h.y + (ey - h.y) * f, 2, 4, ['#ffffff', '#ff6af0', '#b070ff'], { life: 0.35 }); }
          if (alive && !h.hit) {
            const dx = ex - h.x, dy = ey - h.y, LL = dx * dx + dy * dy, k = Math.max(0, Math.min(1, ((pcx - h.x) * dx + (pcy - h.y) * dy) / LL)), d = Math.hypot(pcx - (h.x + dx * k), pcy - (h.y + dy * k));
            if (d < h.w + 0.45) { h.hit = true; sgHurt22(h.dmg, h.x, [9, 5], 0.7); }
          }
        }
        if (h.age > h.warn + h.dur + 0.3) done = true;
        break;
      }
      case 'well': {   // GRAVITATIONAL PULL: drags you in, then explodes
        if (h.age < h.dur) {
          if (alive) {
            const dx = h.x - pcx, dy = h.y - pcy, d = Math.hypot(dx, dy);
            if (d < h.R && d > 0.3) { const f = h.pull * (1 - d / h.R * 0.6) * dt; p.vx += dx / d * f; p.vy += dy / d * f * 0.8; p.fallStartY = p.y; }
          }
          if (Math.random() < dt * 40) sgSuck22(h.x, h.y, h.R * 0.6, 1);
        } else if (!h.boom) {
          h.boom = true;
          if (sgNear22(h.x, h.y)) { sfx('sg.boom', { x: h.x, y: h.y }); flashAt(h.x, h.y, h.boomR * 1.3, '200,120,255', 0.25); Game.shake = Math.min(1.4, Game.shake + 0.6 * Settings.shake / 100); }
          sgParts22(h.x, h.y, 60, 12, SG_COLS22, { life: 0.7, size: 0.12 });
          if (alive && Math.hypot(pcx - h.x, pcy - h.y) < h.boomR + 0.4) sgHurt22(h.dmg, h.x, [14, 9], 0.8);
        }
        if (h.age > h.dur + 0.6) done = true;
        break;
      }
      case 'orb': {   // ORBITAL FRAGMENTS: circle, then launch and home in
        if (h.age < h.launch) { const a = h.age * h.spin + h.k / h.n * 6.283; h.px = h.x + Math.cos(a) * h.R; h.py = h.y + Math.sin(a) * h.R * 0.75; }
        else {
          if (!h.vx && !h.vy) {   // launch toward the nearest player
            const q = bossPlayers().sort((a, b) => Math.hypot(a.x - h.px, a.y - h.py) - Math.hypot(b.x - h.px, b.y - h.py))[0] || p, a = Math.atan2(q.y + q.h / 2 - h.py, q.x + q.w / 2 - h.px);
            h.vx = Math.cos(a) * h.sp; h.vy = Math.sin(a) * h.sp; if (sgNear22(h.px, h.py)) sfx('sg.launch', { x: h.px, y: h.py }); sgParts22(h.px, h.py, 10, 4, SG_COLS22);
          }
          const fly = h.age - h.launch;
          if (fly < h.home) {
            const q = bossPlayers().sort((a, b) => Math.hypot(a.x - h.px, a.y - h.py) - Math.hypot(b.x - h.px, b.y - h.py))[0];
            if (q) { const want = Math.atan2(q.y + q.h / 2 - h.py, q.x + q.w / 2 - h.px), cur = Math.atan2(h.vy, h.vx); let d = want - cur; d = Math.atan2(Math.sin(d), Math.cos(d)); const na = cur + Math.max(-h.turn * dt, Math.min(h.turn * dt, d)); h.vx = Math.cos(na) * h.sp; h.vy = Math.sin(na) * h.sp; }
          }
          h.px += h.vx * dt; h.py += h.vy * dt;
          if (Math.random() < 0.5) Game.particles.push({ x: h.px, y: h.py, vx: -h.vx * 0.05, vy: -h.vy * 0.05, life: 0.35, age: 0, size: 0.08, color: Math.random() < 0.5 ? '#ff6af0' : '#7a3aff', gravity: 0, kind: 'star' });
          if (alive && Math.hypot(pcx - h.px, pcy - h.py) < 0.75) { sgHurt22(h.dmg, h.px, [7, 4], 0.5); sgParts22(h.px, h.py, 16, 6, SG_COLS22); done = true; }
          if (fly > h.life) { sgParts22(h.px, h.py, 8, 3, SG_COLS22); done = true; }
        }
        break;
      }
      case 'shard': {   // REALITY SHARDS: a column of light, then the shard
        if (h.age >= h.warn) {
          const f = (h.age - h.warn) * h.speed; h.cy = h.y0 + f;
          if (!h.fell && h.i % 3 === 0) { h.fell = true; if (sgNear22(h.x, h.gy)) sfx('sg.shardfall', { x: h.x, y: h.gy }); }
          if (alive && !h.hit && Math.abs(pcx - h.x) < 0.7 && pcy > h.cy - 1.4 && pcy < h.cy + 0.6) { h.hit = true; sgHurt22(h.dmg, h.x, [6, 4], 0.45); }
          if (h.cy >= h.gy) {
            if (sgNear22(h.x, h.gy) && h.i % 2 === 0) sfx('sg.shard', { x: h.x, y: h.gy });
            sgParts22(h.x, h.gy - 0.2, 12, 6, ['#7a9aff', '#b070ff', '#e8d8ff', '#ff6af0'], { dir: -Math.PI / 2, spread: 2.4, g: 14, size: 0.1 });
            if (alive && !h.hit && Math.abs(pcx - h.x) < 1.3 && Math.abs(p.y + p.h - h.gy) < 1.2) sgHurt22(Math.round(h.dmg * 0.6), h.x, [8, 6], 0.4);
            done = true;
          }
        }
        break;
      }
      case 'ring': {   // SINGULARITY RING: in, then out; the band hurts except at its gaps
        const r = SG_RING22(h); h.r = r;
        if (alive && h.age > 0.25 && h.age - (h.lastHit || -9) > 0.9) {
          const d = Math.hypot(pcx - h.x, pcy - h.y);
          if (Math.abs(d - r) < h.band + 0.35) {
            const a = Math.atan2(pcy - h.y, pcx - h.x), spinA = h.age * h.spin;
            const inGap = h.gaps.some(g => { let dd = a - (g + spinA); dd = Math.atan2(Math.sin(dd), Math.cos(dd)); return Math.abs(dd) < h.gw; });
            if (!inGap) { h.lastHit = h.age; sgHurt22(h.dmg, h.x, [7, 6], 0.6); }
          }
        }
        if (h.age >= h.dur) done = true;
        break;
      }
      case 'void': {   // FINALE: a small void that pulls, spits a ring of bolts, then collapses
        if (h.age < h.dur && alive) { const dx = h.x - pcx, dy = h.y - pcy, d = Math.hypot(dx, dy); if (d < h.R && d > 0.3) { const f = h.pull * (1 - d / h.R) * dt; p.vx += dx / d * f; p.vy += dy / d * f * 0.8; } }
        if (Math.random() < dt * 20) sgSuck22(h.x, h.y, h.R * 0.5, 1);
        for (const at of h.spit) if (h.age >= at && !(h.spat || []).includes(at)) {
          (h.spat = h.spat || []).push(at);
          if (sgNear22(h.x, h.y)) sfx('sg.orb', { x: h.x, y: h.y, pitch: 1.2 });
          for (let k = 0; k < h.nb; k++) { const a = k / h.nb * 6.283 + at * 1.7; SG22.haz.push({ t: 'bolt', x: h.x, y: h.y, vx: Math.cos(a) * h.bsp, vy: Math.sin(a) * h.bsp, life: 3, dmg: SG22.dmg.bolt, age: 0 }); }
        }
        if (h.age >= h.dur && !h.boom) { h.boom = true; if (sgNear22(h.x, h.y)) sfx('sg.boom', { x: h.x, y: h.y, pitch: 0.8 }); sgParts22(h.x, h.y, 40, 9, SG_COLS22, { life: 0.6 }); flashAt(h.x, h.y, 4, '220,140,255', 0.18); if (alive && Math.hypot(pcx - h.x, pcy - h.y) < 3.4) sgHurt22(h.dmg, h.x, [10, 7], 0.6); }
        if (h.age > h.dur + 0.4) done = true;
        break;
      }
      case 'bolt': {
        h.x += h.vx * dt; h.y += h.vy * dt;
        if (alive && Math.hypot(pcx - h.x, pcy - h.y) < 0.6) { sgHurt22(h.dmg, h.x, [5, 3], 0.4); done = true; }
        if (h.age > h.life) done = true;
        break;
      }
      case 'blink': if (h.age > 0.6) done = true; break;
      case 'dashline': if (h.age > h.warn + 0.25) done = true; break;
      case 'horizon': {   // EVENT HORIZON: a steady drag toward it, everywhere (fight it: keep moving away)
        const b = Game.mobs.find(m => m.type === 'singularity' && !m.dead && !m.dying);
        if (!b) { done = true; break; }
        if (alive) {
          const dx = b.x + b.w / 2 - pcx, dy = b.y + b.h / 2 - pcy, d = Math.hypot(dx, dy);
          if (d > 1.5 && d < 60) { const f = h.pull * Math.min(1, h.age / 1.5) * dt; p.vx += dx / d * f; p.vy += dy / d * f * 0.6; }
        }
        if (Math.random() < dt * 30) sgSuck22(b.x + b.w / 2, b.y + b.h / 2, 16, 1);
        break;
      }
    }
    if (done) H.splice(i, 1);
  }
});
// friends' games: the hazards arrive as netFx
{
  const pn = playNetFx;
  playNetFx = function (list) {
    const rest = [];
    for (const e of list) {
      if (e[0] !== 'sg') { rest.push(e); continue; }
      const o = e[e.length - 1] || [0, 0], p = Game.player;
      if (p && !Game.outside && Math.hypot(o[0] - p.x, o[1] - p.y) < 90) sgSpawn22(e[1]);
    }
    if (rest.length) pn(rest);
  };
}

// ---- IT ARRIVES ----
function spawnSingularity22(x, y, by) {
  const m = new Mob('singularity', x - MOB_TYPES.singularity.w / 2, y - 14);
  Object.assign(m, { phase: 1, move: 'intro', moveT: 0, t: 0, cd: 1, last: '', bossInvuln: 3.6, state: 'hostile', guardian: true, leaveT: 0, facingDir: 1, side: 1, noTint: true, form: 0, contactCd: 0 });
  Game.mobs.push(m); bossSpawned(m);
  m.maxHealth = Math.round(m.maxHealth / (m.hm18 ? HM_BOSS22.hp : 1)); m.health = m.maxHealth; m.hm18 = false;   // (its own numbers: no Hardmode boost on top)
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  sfx('sg.spawn', { x: cx, y: cy }); sfx('sg.thunder', { x: cx, y: cy }); sfx('sg.hum', { x: cx, y: cy }); screenShake(1.2); flashDamage();
  sgSpawn22({ t: 'blink', x: r1(cx), y: r1(cy), out: false });
  eventMessage('THE SINGULARITY AWAKENS!', '#b070ff');
  bigTitle12('The Singularity', 'a star that fell into itself', '#b4a0ff');
}
// summoning: the Collapsed Star (Items/singularity.js uses it), /summon singularity, and a friend asking the host
function sgCanSummon22(silent) {
  const w = Game.world;
  if (!hardmode18()) { if (!silent) showToast('The star is cold... it only wakes in Hardmode.'); return false; }
  if (w.isMoon || w.isUnder || w.isInterior) { if (!silent) showToast('It only answers under the open sky of the surface.'); return false; }
  if (sgBoss22() || Game.boss) { if (!silent) showToast('Something is already here.'); return false; }
  return true;
}
function sgSummonHere22() {
  const p = Game.player, x = p.x + p.w / 2 + p.facing * 6, y = p.y;
  if (netIsClient()) { netSend(null, { t: 'summon', type: 'singularity', x, y }); return; }
  netFxCapture(x, y, () => spawnSingularity22(x, y, 'host'));
}
{
  const sb = summonBoss;
  summonBoss = function (type, x, y, by) { if (type === 'singularity') { if (!netIsClient() && !sgBoss22()) netFxCapture(x, y, () => spawnSingularity22(x, y, by)); return; } return sb(type, x, y, by); };
}
COMMANDS.summon && (function () {
  const run = COMMANDS.summon.run;
  COMMANDS.summon.run = (a) => {
    const t = a.join('').toLowerCase().replace(/[^a-z]/g, '');
    if (t === 'singularity' || t === 'thesingularity') {
      if (sgBoss22()) return cmdError('It is already here.');
      if (netIsClient()) return cmdError('Only the host can do that.');
      const w = Game.world; if (w.isMoon || w.isUnder || w.isInterior) return cmdError('It only comes to the surface.');
      sgSummonHere22(); return;
    }
    return run(a);
  };
})();

// ---- ITS MOVES (host) ----
function sgAI22(m, dt, p) {
  const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2, pcx = p.x + p.w / 2, pcy = p.y + p.h / 2;
  m.t += dt; m.moveT += dt; m.cd = Math.max(0, m.cd - dt); m.bossInvuln = Math.max(0, (m.bossInvuln || 0) - dt); m.contactCd = Math.max(0, m.contactCd - dt);
  m.facingDir = 1; m.dashing = false;
  const ph = m.phase, rage = !!m.enraged, hp = m.health / m.maxHealth, fast = rage ? 1.6 : ph === 2 ? 1.35 : 1, D = SG22.dmg, TP = SG22.tempo;
  const go = (mv) => { m.move = mv; m.moveT = 0; m.did = 0; if (mv !== 'hover') m.last = mv; };   // (so it never repeats an attack back to back)
  const done = (cd) => { go('hover'); m.cd = cd / fast; };
  // nobody here: it leaves
  if (!bossFighters(m).length) { m.leaveT += dt; if (m.leaveT > (bossPlayers().length ? 6 : 3)) { sgSpawn22({ t: 'blink', x: r1(mcx), y: r1(mcy), out: true }); bossLeave(m); return; } } else m.leaveT = 0;
  if (ph === 1 && hp <= SG22.phase2At && m.move !== 'collapse') go('collapse');
  if (ph === 2 && !rage && hp <= SG22.phase3At && m.move !== 'collapse' && m.move !== 'horizon') go('horizon');
  // it never sits still: it circles you, swapping sides
  let tx = pcx + m.side * (7.5 + Math.sin(m.t * 1.9) * 3), ty = pcy - 6 + Math.sin(m.t * 2.8) * 2.4, spd = TP.speed * fast, hold = false;
  // it reads your movement: it aims where you are GOING (t seconds from now), not where you are
  const lead = (t) => { const ly = p.onGround ? 0 : Math.max(-6, Math.min(6, p.vy)) * t * 0.5; return [pcx + Math.max(-14, Math.min(14, p.vx)) * t, pcy + ly]; };
  const aimAt = (t) => { const [lx, ly] = lead(t); return Math.atan2(ly - mcy, lx - mcx); };
  const aim = () => Math.atan2(pcy - mcy, pcx - mcx);
  const bolt = (x, y, a, sp, life) => sgSpawn22({ t: 'bolt', x: r1(x), y: r1(y), vx: r2(Math.cos(a) * sp), vy: r2(Math.sin(a) * sp), life: life || 2.6, dmg: D.bolt });
  const volley = (n, spread, sp) => {   // a fan of bolts at where you're going
    const a0 = aimAt(Math.hypot(pcx - mcx, pcy - mcy) / sp * 0.8);
    for (let k = 0; k < n; k++) bolt(mcx, mcy, a0 + (k - (n - 1) / 2) * spread, sp);
    sfx('sg.orb', { x: mcx, y: mcy, pitch: 1.3, vol: 0.45 });
  };
  const rain = (n, gap) => {   // a few shards on top of you (stacked on another attack)
    const x0 = pcx - (n - 1) / 2 * gap + (Math.random() - 0.5) * gap;
    for (let i = 0; i < n; i++) { const x = x0 + i * gap, gy = sgGround22(x, pcy - 10); sgSpawn22({ t: 'shard', x: r2(x), gy, y0: gy - 26, warn: 0.55 + i * 0.05, speed: 50, i, dmg: D.shard }); }
  };
  switch (m.move) {
    case 'intro': hold = true; m.vx = 0; m.vy = 0; m.form = Math.min(1, m.moveT / 1.5); if (Math.random() < 0.7) sgSuck22(mcx, mcy, 9, 2); if (m.moveT > 1.9) go('dash'); break;
    case 'collapse': {   // ITS SECOND FORM: it falls into itself, and comes back worse
      hold = true; m.vx *= 0.9; m.vy *= 0.9; m.bossInvuln = 1;
      if (!m.did) { m.did = 1; SG22.haz.length = 0; sfx('sg.phase', { x: mcx, y: mcy }); sfx('sg.thunder', { x: mcx, y: mcy }); screenShake(1.2); eventMessage('THE SINGULARITY COLLAPSES INTO ITSELF!', '#ff6af0'); }
      m.form = m.moveT < 1.1 ? Math.max(0.15, 1 - m.moveT / 1.1) : Math.min(1, (m.moveT - 1.1) / 0.5);
      if (m.moveT < 1.1 && Math.random() < 0.9) sgSuck22(mcx, mcy, 12, 3);
      if (m.moveT > 1.1 && m.did === 1) {
        m.did = 2; m.phase = 2; flashDamage(); sfx('sg.shatter', { x: mcx, y: mcy }); sfx('sg.boom', { x: mcx, y: mcy, pitch: 0.45 }); screenShake(1.4);
        sgParts22(mcx, mcy, 120, 16, SG_COLS22, { life: 0.9, size: 0.14 });
        sgSpawn22({ t: 'ring', x: r1(mcx), y: r1(mcy), r0: 3, rmin: 3, dur: 1.4, band: 0.6, gaps: [r2(Math.random() * 6.28), r2(Math.random() * 6.28)], gw: 0.5, spin: 0, dmg: D.ring });   // the shockwave of its return
        for (let k = 0; k < 12; k++) bolt(mcx, mcy, k / 12 * 6.283, 9);
        bigTitle12('The Singularity', 'the event horizon breaks', '#ff6af0');
      }
      if (m.moveT > 2) go('dash');   // and it comes straight at you
      break;
    }
    case 'horizon': {   // LAST STAND (a quarter health): space itself starts falling into it
      hold = true; m.vx *= 0.9; m.vy *= 0.9; m.bossInvuln = 0.5;
      if (!m.did) {
        m.did = 1; m.enraged = true; sfx('sg.phase', { x: mcx, y: mcy, pitch: 0.3 }); sfx('sg.thunder', { x: mcx, y: mcy }); screenShake(1.4); flashDamage();
        eventMessage('SPACE BEGINS TO FALL INTO THE SINGULARITY!', '#ff3ad0'); bigTitle12('Event Horizon', 'there is no outrunning it now', '#ff3ad0');
        sgSpawn22({ t: 'horizon', pull: SG22.horizonPull, dur: 9999 });
        for (let k = 0; k < 16; k++) bolt(mcx, mcy, k / 16 * 6.283, 8);
      }
      if (Math.random() < 0.9) sgSuck22(mcx, mcy, 14, 3);
      if (m.moveT > 1.3) go('finale');
      break;
    }
    case 'hover': {
      if (Math.abs(pcx - mcx) < 4 && Math.random() < dt * 3) m.side = -m.side;
      if (Math.random() < dt * 0.6) m.side = -m.side;
      // pressure: fans of bolts while it lines up the next attack
      m.boltT = (m.boltT ?? TP.bolts) - dt * fast;
      if (m.boltT <= 0 && m.form > 0.8) { m.boltT = TP.bolts; volley(rage ? 7 : ph === 2 ? 6 : 5, 0.2, TP.boltSpeed * (ph === 2 ? 1.12 : 1)); }
      if (m.cd <= 0) {
        const far = Math.hypot(pcx - mcx, pcy - mcy) > 20;
        const pool = ph === 1 ? [['laser', 3], ['pull', 2], ['orbs', 2.5], ['shards', 3], ['ring', 2], ['dash', 3.5], ['teleport', far ? 6 : 1.5]]
          : [['laser', 3], ['pull', 2], ['orbs', 2.5], ['shards', 2.5], ['ring', 2], ['dash', 4], ['teleport', far ? 6 : 1.5], ['finale', rage ? 4 : 3]];
        go(pickW12(pool.filter(([n]) => n !== m.last)));
        // second form: it stacks attacks - a rain of shards or a void on top of whatever it just started
        if (ph === 2 && m.move !== 'finale' && m.move !== 'teleport' && Math.random() < (rage ? 0.85 : 0.55)) {
          if (Math.random() < 0.55) rain(rage ? 7 : 5, 2.2);
          else { const s = Math.random() < 0.5 ? -1 : 1; sgSpawn22({ t: 'void', x: r1(pcx + s * (5 + Math.random() * 3)), y: r1(pcy - 1 - Math.random() * 2), R: 8, pull: 8, dur: 2.2, spit: [0.9, 1.7], nb: 6, bsp: 8, dmg: D.void }); }
        }
      }
      break;
    }
    case 'dash': {   // VOID DASH: it lines up (a lane shows where), then rips through it at where you're GOING. Again. And again.
      const n = rage ? 6 : ph === 2 ? 5 : 4, wind = rage ? 0.24 : ph === 2 ? 0.28 : 0.34, run = 0.34, per = wind + run + 0.08;
      const k = Math.floor(m.moveT / per), tt = m.moveT - k * per;
      hold = true;
      if (k >= n) { m.vx *= 0.85; m.vy *= 0.85; if (m.moveT > n * per + 0.12) done(0.2); break; }
      if (m.did !== k + 1) {
        m.did = k + 1; m.dashA = k % 2 ? aim() : aimAt(wind + 0.12);   // every other dash leads you: don't just keep running one way
        sgSpawn22({ t: 'dashline', x: r1(mcx), y: r1(mcy), a: r2(m.dashA), len: r1(TP.dashSpeed * run + 2), warn: wind });
      }
      if (tt < wind) { m.vx *= 0.75; m.vy *= 0.75; if (Math.random() < 0.6) sgSuck22(mcx, mcy, 5, 1); }
      else if (tt < wind + run) {
        m.dashing = true; m.vx = Math.cos(m.dashA) * TP.dashSpeed; m.vy = Math.sin(m.dashA) * TP.dashSpeed;
        if (m.dashFx !== m.did) { m.dashFx = m.did; sfx('sg.launch', { x: mcx, y: mcy, pitch: 0.55, vol: 0.9 }); Game.shake = Math.min(1.4, Game.shake + 0.25 * Settings.shake / 100); }
        sgParts22(mcx, mcy, 3, 3, SG_COLS22, { r: 2.5, life: 0.5, size: 0.12 });
        // it sheds bolts sideways as it goes
        if (Math.random() < dt * (ph === 2 ? 9 : 5)) { const s = Math.random() < 0.5 ? -1 : 1; bolt(mcx, mcy, m.dashA + s * Math.PI / 2, 6, 1.6); }
      } else {
        m.vx *= 0.7; m.vy *= 0.7;
        if (m.burst !== m.did) { m.burst = m.did; const nb = ph === 2 ? 8 : 5; for (let j = 0; j < nb; j++) bolt(mcx, mcy, j / nb * 6.283 + m.t, ph === 2 ? 9 : 7.5, 2.2); }
      }
      break;
    }
    case 'laser': {   // VOID LASER: aim (ahead of you), warn, fire - it sweeps, and fires again and again
      hold = true; m.vx *= 0.85; m.vy *= 0.85;
      const shots = rage ? 5 : ph === 2 ? 4 : 3, gap = rage ? 0.62 : ph === 2 ? 0.75 : 0.9, warn = rage ? 0.36 : ph === 2 ? 0.42 : 0.48;
      if (m.did < shots && m.moveT > 0.1 + m.did * gap) {
        m.did++;
        const lastShot = m.did === shots, a = m.did % 2 ? aim() : aimAt(warn), sweep = (ph === 2 || lastShot) ? (Math.random() < 0.5 ? -0.75 : 0.75) : 0;
        sgSpawn22({ t: 'laser', x: r1(mcx), y: r1(mcy), a: r2(a - sweep * 0.45), sweep, warn, dur: 0.55, w: 1.1, len: 60, dmg: D.laser });
        if (rage) sgSpawn22({ t: 'laser', x: r1(mcx), y: r1(mcy), a: r2(a + Math.PI - sweep * 0.45), sweep, warn, dur: 0.55, w: 1.1, len: 60, dmg: D.laser });   // and behind it too
      }
      if (m.moveT > 0.1 + shots * gap + 0.1) done(0.2);
      break;
    }
    case 'pull': {   // GRAVITATIONAL PULL (it keeps circling, and shooting, while you fight the pull)
      if (!m.did) { m.did = 1; sgSpawn22({ t: 'well', x: r1(pcx + (pcx < mcx ? -3 : 3)), y: r1(pcy - 3), R: 21, pull: rage ? 44 : ph === 2 ? 40 : 34, dur: 1.9, boomR: 6, dmg: D.well }); }
      if (m.did === 1 && m.moveT > 0.6) { m.did = 2; volley(ph === 2 ? 6 : 4, 0.26, TP.boltSpeed); }
      if (m.did === 2 && m.moveT > 1.3) { m.did = 3; volley(ph === 2 ? 6 : 4, 0.26, TP.boltSpeed); }
      if (m.moveT > 2.2) done(0.2);
      break;
    }
    case 'orbs': {   // ORBITAL FRAGMENTS
      hold = true; m.vx *= 0.85; m.vy *= 0.85;
      if (!m.did) {
        m.did = 1; const n = rage ? 14 : ph === 2 ? 12 : 9;
        for (let k = 0; k < n; k++) sgSpawn22({ t: 'orb', x: r1(mcx), y: r1(mcy), k, n, R: 4.8, spin: 3.6, launch: 0.55 + k * (ph === 2 ? 0.1 : 0.13), sp: ph === 2 ? 18 : 16, turn: 2.8, home: 1.3, life: 3.6, dmg: D.orb });
      }
      if (m.moveT > 1.6) done(0.12);
      break;
    }
    case 'shards': {   // REALITY SHARDS: they fall where you are, and where you'd run to (it keeps moving and shooting)
      if (!m.did) {
        m.did = 1; sfx('sg.charge', { x: mcx, y: mcy, pitch: 1.4 });
        const n = ph === 2 ? 22 : 17, gap = ph === 2 ? 1.45 : 1.65, x0 = pcx - (n - 1) / 2 * gap + (Math.random() - 0.5) * gap, order = [...Array(n).keys()].sort(() => Math.random() - 0.5);
        order.forEach((i, j) => { const x = x0 + i * gap, gy = sgGround22(x, pcy - 10); sgSpawn22({ t: 'shard', x: r2(x), gy, y0: gy - 26, warn: 0.42 + j * (ph === 2 ? 0.032 : 0.04), speed: 52, i: j, dmg: D.shard }); });
      }
      if (m.did === 1 && m.moveT > 0.5) { m.did = 2; volley(ph === 2 ? 5 : 3, 0.3, TP.boltSpeed); }
      if (m.moveT > 1.2) done(0.12);
      break;
    }
    case 'ring': {   // SINGULARITY RING: centred on you (it keeps moving, and shooting)
      if (!m.did) {
        m.did = 1; const g0 = Math.random() * 6.28;
        sgSpawn22({ t: 'ring', x: r1(pcx), y: r1(pcy), r0: 13, rmin: 2, dur: rage ? 2 : ph === 2 ? 2.2 : 2.5, band: 0.65, gaps: ph === 2 ? [r2(g0)] : [r2(g0), r2(g0 + Math.PI)], gw: ph === 2 ? 0.4 : 0.46, spin: ph === 2 ? 1 : 0.65, dmg: D.ring });
      }
      if (m.did === 1 && m.moveT > 0.8) { m.did = 2; volley(4, 0.25, TP.boltSpeed); }
      if (m.did === 2 && m.moveT > 1.5) { m.did = 3; volley(4, 0.25, TP.boltSpeed); }
      if (m.moveT > 1.8) done(0.15);
      break;
    }
    case 'teleport': {   // it folds away... and unfolds right beside you, already attacking
      hold = true; m.vx = 0; m.vy = 0;
      if (!m.did) { m.did = 1; sgSpawn22({ t: 'blink', x: r1(mcx), y: r1(mcy), out: true }); }
      m.form = m.moveT < 0.25 ? 1 - m.moveT / 0.25 : Math.max(0, Math.min(1, (m.moveT - 0.33) / 0.2));
      if (m.did === 1 && m.moveT > 0.27) {
        m.did = 2; const s = Math.random() < 0.5 ? -1 : 1;
        m.x = pcx + s * (8 + Math.random() * 4) - m.w / 2; m.y = pcy - 6 - Math.random() * 3 - m.h / 2; m.side = s;
        sgSpawn22({ t: 'blink', x: r1(m.x + m.w / 2), y: r1(m.y + m.h / 2), out: false });
        for (let k = 0; k < 8; k++) bolt(m.x + m.w / 2, m.y + m.h / 2, k / 8 * 6.283, 7, 2);   // it arrives in a burst
      }
      if (m.moveT > 0.55) go(Math.random() < 0.5 ? 'dash' : Math.random() < 0.5 ? 'laser' : 'shards');
      break;
    }
    case 'finale': {   // FINALE (second form): several voids at once, and it keeps hunting you between them
      if (!m.did) {
        m.did = 1; sfx('sg.phase', { x: mcx, y: mcy, pitch: 0.6, vol: 0.7 }); screenShake(0.6);
        const n = rage ? 7 : 5, ang0 = Math.random() * 6.28;
        for (let k = 0; k < n; k++) { const a = ang0 + k / n * 6.283, r = 7 + Math.random() * 3; sgSpawn22({ t: 'void', x: r1(pcx + Math.cos(a) * r), y: r1(Math.min(pcy + Math.sin(a) * r * 0.6, pcy + 2)), R: 9, pull: 10, dur: 2.2 + k * 0.1, spit: [0.7, 1.4, 2], nb: 7, bsp: 8.5, dmg: D.void }); }
      }
      if (m.did === 1 && m.moveT > 1) { m.did = 2; volley(5, 0.22, TP.boltSpeed); }
      if (m.moveT > 2.3) done(0.25);
      break;
    }
  }
  if (!hold) { const ac = TP.accel * dt; m.vx = approach(m.vx, Math.max(-spd, Math.min(spd, (tx - mcx) * 2.6)), ac); m.vy = approach(m.vy, Math.max(-spd, Math.min(spd, (ty - mcy) * 2.6)), ac); }
  m.x += m.vx * dt; m.y += m.vy * dt;
  if (m.move !== 'intro' && m.move !== 'teleport' && m.move !== 'collapse') m.form = Math.min(1, (m.form || 0) + dt * 3);
  // touching it hurts (anyone) - and being run through by a dash hurts more
  if (m.contactCd <= 0 && m.form > 0.6) for (const q of bossVictims()) {
    if (Math.hypot(q.x + q.w / 2 - mcx, q.y + q.h / 2 - mcy) < (m.dashing ? 3.1 : 2.7)) { bossHitPlayer(m.dashing ? SG22.dashDmg : SG22.contactDmg, mcx, q, 0, { kb: m.dashing ? [16, 9] : [12, 7], iframes: 0.5 }); m.contactCd = 0.6; }
  }
  // a low hum now and then
  m.humT = (m.humT ?? 3) - dt; if (m.humT <= 0) { m.humT = 4.5 + Math.random() * 2; sfx('sg.hum', { x: mcx, y: mcy }); }
}

// ---- ITS DEATH: it falls into itself, and is gone ----
function sgDying22(m, dt) {
  m.dying += dt; m.vx *= 0.9; m.vy *= 0.9;
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2, k = m.dying;
  if (!m.dieFx) { m.dieFx = 1; SG22.haz.length = 0; sfx('sg.phase', { x: cx, y: cy, pitch: 0.35 }); sfx('sg.thunder', { x: cx, y: cy }); stopBossMusic(true); }
  m.form = Math.max(0, 1 - k / 3.4);
  m.shakeAmt = 1.5;
  if (Math.random() < 0.9) sgSuck22(cx, cy, 14, 4);
  m.boomT = (m.boomT || 0) - dt;
  if (m.boomT <= 0) { m.boomT = 0.22; sgParts22(cx + (Math.random() - 0.5) * 5, cy + (Math.random() - 0.5) * 5, 14, 5, SG_COLS22); sfx('sg.zap', { x: cx, y: cy }); screenShake(0.25); }
  if (k >= 3.6 && !m.dieBoom) {
    m.dieBoom = 1; flashDamage(); screenShake(1.4); sfx('sg.boom', { x: cx, y: cy, pitch: 0.4 }); sfx('sg.shatter', { x: cx, y: cy });
    sgParts22(cx, cy, 200, 22, SG_COLS22, { life: 1.2, size: 0.14 });
    flashAt(cx, cy, 16, '230,200,255', 0.6);
    SG22.fxRing = { x: cx, y: cy, t: 0 };
  }
  if (k >= 3.8) finishMobDeath(m);
}

// ---- DRAWING ----
// its body: the picture (its crystals swaying in strips), with rings, a living core and orbiting voids on top
function sgDraw22(g, m, u) {
  const art = SG_ART22[m.phase === 2 ? 2 : 1]; if (!art) return;
  const t = Game.time, ph = m.phase === 2 ? 2 : 1, C = SG22.core[ph], S = SG22.scale * u;
  const form = m.form == null ? 1 : Math.max(0, Math.min(1, m.form)), sc = 0.25 + 0.75 * form, alpha = Math.min(1, form * 1.6);
  if (alpha <= 0.02) return;
  const shake = m.shakeAmt ? (Math.random() - 0.5) * m.shakeAmt * u * 3 : 0, bob = Math.sin(t * 1.6) * u * 3;
  const act = m.move === 'laser' || m.move === 'pull' || m.move === 'orbs' || m.move === 'finale' || m.move === 'collapse';
  g.save(); g.translate(shake, bob); g.scale(sc, sc); g.globalAlpha *= alpha;
  // the dark it gives off
  const R = 120 * S, gr = g.createRadialGradient(0, 0, 10 * S, 0, 0, R);
  gr.addColorStop(0, `rgba(80,20,160,${0.35 + (act ? 0.15 : 0)})`); gr.addColorStop(1, 'rgba(40,0,90,0)');
  g.fillStyle = gr; g.fillRect(-R, -R, R * 2, R * 2);
  // rings behind it
  sgRings22(g, S, t, ph, true, act);
  // the picture, in strips that sway (more the further they hang from the core)
  g.imageSmoothingEnabled = false;
  const W = art.width, H = art.height, step = 3;
  for (let y = 0; y < H; y += step) {
    const d = (y - C[1]) / H, sway = Math.sin(t * 1.7 + y * 0.045) * (2 + Math.abs(d) * 8) * (ph === 2 ? 1.3 : 1);
    g.drawImage(art, 0, y, W, Math.min(step, H - y), (-C[0] + sway * (Math.abs(d) > 0.08 ? 1 : 0.2)) * S, (y - C[1]) * S, W * S, Math.min(step, H - y) * S);
  }
  if (m.hurtFlash > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha *= Math.min(1, m.hurtFlash * 4) * 0.35; g.drawImage(art, -C[0] * S, -C[1] * S, W * S, H * S); g.restore(); }
  // the core: a black hole with a burning rim, accretion arcs and a flare
  const pulse = 1 + 0.07 * Math.sin(t * 4) + (act ? 0.12 : 0), cr = 11 * S * pulse;
  g.save(); g.globalCompositeOperation = 'lighter';
  const cg = g.createRadialGradient(0, 0, cr * 0.8, 0, 0, cr * 3.2); cg.addColorStop(0, `rgba(255,150,255,${0.75 + (act ? 0.25 : 0)})`); cg.addColorStop(0.35, 'rgba(160,80,255,0.35)'); cg.addColorStop(1, 'rgba(80,40,255,0)');
  g.fillStyle = cg; g.beginPath(); g.arc(0, 0, cr * 3.2, 0, 6.283); g.fill();
  for (let k = 0; k < 3; k++) {   // accretion arcs whirling round it
    const a0 = t * (2.4 + k * 0.7) * (k % 2 ? -1 : 1) + k * 2.1;
    g.strokeStyle = k === 1 ? 'rgba(255,120,240,0.85)' : 'rgba(170,140,255,0.8)'; g.lineWidth = Math.max(1, S * (2.2 - k * 0.5));
    g.beginPath(); g.arc(0, 0, cr * (1.25 + k * 0.28), a0, a0 + 1.6 + k * 0.4); g.stroke();
  }
  const fl = cr * (3.6 + Math.sin(t * 6) * 0.6) * (act ? 1.4 : 1);   // the four-pointed flare
  g.fillStyle = 'rgba(255,230,255,0.85)';
  for (let k = 0; k < 4; k++) { g.save(); g.rotate(k * Math.PI / 2 + t * 0.15); g.beginPath(); g.moveTo(0, -fl); g.lineTo(S * 1.6, 0); g.lineTo(0, fl * 0.12); g.lineTo(-S * 1.6, 0); g.closePath(); g.fill(); g.restore(); }
  g.restore();
  g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, cr, 0, 6.283); g.fill();
  g.strokeStyle = `rgba(255,${200 + 55 * Math.sin(t * 8) | 0},255,0.95)`; g.lineWidth = Math.max(1, S * 1.8); g.beginPath(); g.arc(0, 0, cr, 0, 6.283); g.stroke();
  // second form: little voids circling it
  if (ph === 2) for (let k = 0; k < 4; k++) {
    const a = t * 0.9 + k * Math.PI / 2, x = Math.cos(a) * 150 * S, y = Math.sin(a) * 60 * S, r = (7 + 2 * Math.sin(t * 3 + k)) * S;
    if (Math.sin(a) < 0) continue;   // (the ones behind are hidden by it)
    g.fillStyle = '#05010c'; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(255,110,240,0.95)'; g.lineWidth = Math.max(1, S * 1.4); g.beginPath(); g.arc(x, y, r, 0, 6.283); g.stroke();
  }
  // rings in front
  sgRings22(g, S, t, ph, false, act);
  g.restore();
}
// its halo and rings of torn matter (tilted ellipses; the back half is drawn before it, the front half after)
function sgRings22(g, S, t, ph, back, act) {
  const rings = ph === 1 ? [[118, 26, -0.08, 0.5, '160,110,255'], [70, 16, 0.12, -0.8, '255,110,240']] : [[150, 34, -0.22, 0.7, '255,110,240'], [96, 22, 0.35, -1.1, '150,120,255'], [180, 20, 0.05, 0.4, '110,140,255']];
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [rx, ry, tilt, spin, col] of rings) {
    const s = 1 + (act ? 0.08 * Math.sin(t * 10) : 0);
    g.save(); g.rotate(tilt + Math.sin(t * 0.6) * 0.05);
    g.strokeStyle = `rgba(${col},0.75)`; g.lineWidth = Math.max(1, S * 2.4);
    g.beginPath(); g.ellipse(0, 0, rx * S * s, ry * S * s, 0, back ? Math.PI : 0, back ? 2 * Math.PI : Math.PI); g.stroke();
    g.strokeStyle = 'rgba(255,240,255,0.6)'; g.lineWidth = Math.max(1, S * 0.8); g.stroke();
    for (let k = 0; k < 5; k++) {   // bright beads running round it
      const a = t * spin + k * 1.2566, onBack = Math.sin(a) < 0;
      if (onBack !== back) continue;
      g.fillStyle = `rgba(${col},0.95)`; g.beginPath(); g.arc(Math.cos(a) * rx * S * s, Math.sin(a) * ry * S * s, S * 2.4, 0, 6.283); g.fill();
    }
    g.restore();
  }
  if (back && ph === 1) {   // the halo above it
    g.strokeStyle = 'rgba(190,150,255,0.8)'; g.lineWidth = Math.max(1, S * 2.2);
    g.beginPath(); g.ellipse(0, -112 * S + Math.sin(t * 1.2) * 3 * S, 62 * S, 9 * S, 0, 0, 6.283); g.stroke();
  }
  g.restore();
}
// the hazards, and its light (after the dark)
B12.glow.push(function sgGlow22(ox, oy, glow) {
  const T0 = TILE, t = Game.time;
  const b = Game.mobs.find(m => m.type === 'singularity' && !m.dead);
  if (b) { const f = Math.max(0, Math.min(1, b.form == null ? 1 : +b.form || 0)); glow(ox + (b.x + b.w / 2) * T0, oy + (b.y + b.h / 2) * T0, T0 * 7 * f, '150,80,255', 0.4 * f); }
  for (const h of SG22.haz) {
    switch (h.t) {
      case 'laser': {
        const a = h.ca != null ? h.ca : h.a, x0 = ox + h.x * T0, y0 = oy + h.y * T0, x1 = x0 + Math.cos(a) * h.len * T0, y1 = y0 + Math.sin(a) * h.len * T0;
        ctx.lineCap = 'round';
        if (h.age < h.warn) {   // the warning: a thin flickering line, thickening as it charges
          const k = h.age / h.warn;
          ctx.strokeStyle = `rgba(255,110,240,${0.35 + 0.4 * k * (0.6 + 0.4 * Math.sin(t * 40))})`; ctx.lineWidth = Math.max(1, T0 * (0.06 + 0.12 * k));
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          glow(x0, y0, T0 * (1.5 + 2.5 * k), '255,120,255', 0.5 * k);
        } else if (h.age < h.warn + h.dur) {   // the beam: void-black heart, burning edges
          const e = (h.age - h.warn) / h.dur, W = h.w * T0 * (e < 0.12 ? e / 0.12 : e > 0.8 ? (1 - e) / 0.2 : 1) * (1 + 0.08 * Math.sin(t * 50));
          for (const [w, col] of [[2.6, 'rgba(120,40,255,0.35)'], [1.7, 'rgba(255,90,240,0.8)'], [1.05, 'rgba(240,220,255,0.95)']]) { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, W * w); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
          ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = 'rgba(8,0,20,0.9)'; ctx.lineWidth = Math.max(1, W * 0.45); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
          glow(x0, y0, T0 * 4, '255,120,255', 0.8);
          for (let k = 1; k < 8; k++) glow(x0 + (x1 - x0) * k / 8, y0 + (y1 - y0) * k / 8, W * 1.6, '200,90,255', 0.3);
        }
        break;
      }
      case 'well': {
        const x = ox + h.x * T0, y = oy + h.y * T0, k = Math.min(1, h.age / h.dur);
        if (h.age < h.dur) {
          glow(x, y, h.R * T0 * 0.6, '120,50,255', 0.25 + 0.2 * k);
          ctx.strokeStyle = `rgba(255,110,240,${0.4 + 0.5 * k})`; ctx.lineWidth = Math.max(1, T0 * 0.12);
          ctx.beginPath(); ctx.arc(x, y, h.boomR * T0, 0, 6.283); ctx.stroke();   // the blast's edge: be outside it when it goes
          ctx.setLineDash([T0 * 0.4, T0 * 0.3]); ctx.lineDashOffset = -t * 40; ctx.beginPath(); ctx.arc(x, y, h.boomR * T0 * (1 - k * 0.15), 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
          for (let j = 0; j < 4; j++) {   // the spiral arms of the disc
            ctx.strokeStyle = j % 2 ? 'rgba(170,120,255,0.7)' : 'rgba(255,120,240,0.7)'; ctx.lineWidth = Math.max(1, T0 * 0.18); ctx.beginPath();
            for (let s = 0; s <= 24; s++) { const r = T0 * (0.6 + s * 0.16), a = j * Math.PI / 2 - t * 4 + s * 0.28; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.85; if (!s) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
            ctx.stroke();
          }
          ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, T0 * (0.5 + 0.7 * k), 0, 6.283); ctx.fill(); ctx.restore();
          ctx.strokeStyle = 'rgba(255,220,255,0.95)'; ctx.lineWidth = Math.max(1, T0 * 0.1); ctx.beginPath(); ctx.arc(x, y, T0 * (0.5 + 0.7 * k), 0, 6.283); ctx.stroke();
        } else { const e = Math.min(1, (h.age - h.dur) / 0.6); glow(x, y, h.boomR * T0 * (0.8 + e), '230,150,255', 0.8 * (1 - e)); ctx.strokeStyle = `rgba(255,230,255,${1 - e})`; ctx.lineWidth = Math.max(1, T0 * 0.3 * (1 - e)); ctx.beginPath(); ctx.arc(x, y, h.boomR * T0 * (0.5 + e), 0, 6.283); ctx.stroke(); }
        break;
      }
      case 'orb': {
        if (h.px == null) break;
        const x = ox + h.px * T0, y = oy + h.py * T0, r = T0 * 0.45;
        glow(x, y, T0 * 1.4, '255,110,240', 0.6);
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#07010f'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore();
        ctx.strokeStyle = 'rgba(255,140,245,1)'; ctx.lineWidth = Math.max(1, T0 * 0.1); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = 'rgba(200,170,255,0.8)'; ctx.lineWidth = Math.max(1, T0 * 0.05); ctx.beginPath(); ctx.arc(x, y, r * 1.5, t * 6, t * 6 + 2); ctx.stroke();
        break;
      }
      case 'shard': {
        const x = ox + h.x * T0, gy = oy + h.gy * T0;
        if (h.age < h.warn) {   // a column of light where it will land
          const k = h.age / h.warn;
          ctx.fillStyle = `rgba(160,120,255,${0.08 + 0.18 * k})`; ctx.fillRect(x - T0 * 0.5, gy - T0 * 24, T0, T0 * 24);
          ctx.fillStyle = `rgba(255,140,245,${0.4 + 0.5 * k})`; ctx.fillRect(x - T0 * 0.6, gy - T0 * 0.12, T0 * 1.2, T0 * 0.12);
        } else if (h.cy != null) {   // the shard: a falling crystal with a trail
          const y = oy + h.cy * T0;
          glow(x, y, T0 * 1.5, '150,120,255', 0.6);
          ctx.fillStyle = 'rgba(160,120,255,0.35)'; ctx.fillRect(x - T0 * 0.15, y - T0 * 4, T0 * 0.3, T0 * 4);
          ctx.save(); ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#3a2a8a'; ctx.beginPath(); ctx.moveTo(x, y + T0 * 0.7); ctx.lineTo(x + T0 * 0.32, y - T0 * 0.4); ctx.lineTo(x, y - T0 * 1.5); ctx.lineTo(x - T0 * 0.32, y - T0 * 0.4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#9a8aff'; ctx.beginPath(); ctx.moveTo(x, y + T0 * 0.6); ctx.lineTo(x + T0 * 0.14, y - T0 * 0.4); ctx.lineTo(x, y - T0 * 1.3); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x - T0 * 0.04, y - T0 * 0.9, T0 * 0.08, T0 * 0.8);
          ctx.restore();
        }
        break;
      }
      case 'ring': {
        if (h.r == null) break;
        const x = ox + h.x * T0, y = oy + h.y * T0, R = h.r * T0, spinA = h.age * h.spin, fade = Math.min(1, h.age / 0.25, (h.dur - h.age) / 0.3);
        // the band, broken at its gaps
        const N = 96;
        for (let s = 0; s < N; s++) {
          const a0 = s / N * 6.283, a1 = (s + 1) / N * 6.283, am = (a0 + a1) / 2;
          const inGap = h.gaps.some(g => { let dd = am - (g + spinA); dd = Math.atan2(Math.sin(dd), Math.cos(dd)); return Math.abs(dd) < h.gw; });
          if (inGap) continue;
          ctx.strokeStyle = `rgba(255,110,240,${0.85 * fade})`; ctx.lineWidth = Math.max(1, h.band * T0 * 1.6); ctx.beginPath(); ctx.arc(x, y, R, a0, a1 + 0.01); ctx.stroke();
          ctx.strokeStyle = `rgba(255,240,255,${0.9 * fade})`; ctx.lineWidth = Math.max(1, h.band * T0 * 0.45); ctx.beginPath(); ctx.arc(x, y, R, a0, a1 + 0.01); ctx.stroke();
          if (s % 4 === 0) { const sp = T0 * (0.4 + 0.25 * Math.sin(t * 9 + s)); ctx.strokeStyle = `rgba(200,150,255,${0.8 * fade})`; ctx.lineWidth = Math.max(1, T0 * 0.08); ctx.beginPath(); ctx.moveTo(x + Math.cos(am) * (R + h.band * T0), y + Math.sin(am) * (R + h.band * T0)); ctx.lineTo(x + Math.cos(am) * (R + h.band * T0 + sp), y + Math.sin(am) * (R + h.band * T0 + sp)); ctx.stroke(); }   // spikes
        }
        for (const g of h.gaps) { const a = g + spinA; glow(x + Math.cos(a) * R, y + Math.sin(a) * R, T0 * 1.2, '120,255,200', 0.35 * fade); }   // the gaps glow green: go here
        break;
      }
      case 'void': {
        const x = ox + h.x * T0, y = oy + h.y * T0, k = Math.min(1, h.age / 0.4), e = h.age > h.dur ? Math.min(1, (h.age - h.dur) / 0.4) : 0, r = T0 * (0.9 + 0.2 * Math.sin(t * 7 + h.x)) * k * (1 - e);
        glow(x, y, T0 * 3, '200,90,255', 0.5 * k * (1 - e));
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#05010c'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore();
        ctx.strokeStyle = 'rgba(255,120,245,0.95)'; ctx.lineWidth = Math.max(1, T0 * 0.12); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = 'rgba(170,140,255,0.7)'; ctx.lineWidth = Math.max(1, T0 * 0.06); ctx.beginPath(); ctx.ellipse(x, y, r * 2.2, r * 0.6, Math.sin(t + h.x) * 0.4, t * 3, t * 3 + 4); ctx.stroke();
        if (e > 0) { ctx.strokeStyle = `rgba(255,230,255,${1 - e})`; ctx.lineWidth = Math.max(1, T0 * 0.2); ctx.beginPath(); ctx.arc(x, y, T0 * 3.4 * e, 0, 6.283); ctx.stroke(); }
        break;
      }
      case 'bolt': {
        const x = ox + h.x * T0, y = oy + h.y * T0;
        glow(x, y, T0 * 0.9, '255,110,240', 0.6);
        ctx.fillStyle = '#ffe0ff'; ctx.beginPath(); ctx.arc(x, y, T0 * 0.18, 0, 6.283); ctx.fill();
        break;
      }
      case 'horizon': {   // the event horizon: a slow dark whirl around it
        const b = Game.mobs.find(m => m.type === 'singularity' && !m.dead); if (!b) break;
        const x = ox + (b.x + b.w / 2) * T0, y = oy + (b.y + b.h / 2) * T0, k = Math.min(1, h.age / 1.5);
        glow(x, y, T0 * 12 * k, '255,60,200', 0.25 * k);
        for (let j = 0; j < 3; j++) { ctx.strokeStyle = `rgba(255,${90 + j * 50},240,${0.5 * k})`; ctx.lineWidth = Math.max(1, T0 * 0.12); ctx.beginPath(); ctx.arc(x, y, T0 * (7 + j * 2.2 + Math.sin(t * 2 + j) * 0.5), -t * (1.4 - j * 0.3) + j * 2, -t * (1.4 - j * 0.3) + j * 2 + 2.6); ctx.stroke(); }
        break;
      }
      case 'dashline': {   // where its dash will go: a lane of light with chevrons racing along it
        const k = Math.min(1, h.age / h.warn), fade = h.age > h.warn ? Math.max(0, 1 - (h.age - h.warn) / 0.25) : 1;
        const ca = Math.cos(h.a), sa = Math.sin(h.a), x0 = ox + h.x * T0, y0 = oy + h.y * T0, L = h.len * T0, x1 = x0 + ca * L, y1 = y0 + sa * L;
        ctx.lineCap = 'round';
        ctx.strokeStyle = `rgba(255,110,240,${(0.25 + 0.35 * k) * fade})`; ctx.lineWidth = Math.max(1, T0 * (0.9 + 1.4 * k)); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = `rgba(255,240,255,${(0.5 + 0.4 * Math.sin(t * 40)) * fade})`; ctx.lineWidth = Math.max(1, T0 * 0.08); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = `rgba(255,200,255,${0.85 * fade})`; ctx.lineWidth = Math.max(1, T0 * 0.14);
        const c = T0 * 0.7, nx = -sa, ny = ca;
        for (let j = 0; j < 7; j++) {
          const f = ((j / 7 + h.age * 2.2) % 1), px = x0 + ca * L * f, py = y0 + sa * L * f;
          ctx.beginPath(); ctx.moveTo(px - ca * c + nx * c, py - sa * c + ny * c); ctx.lineTo(px, py); ctx.lineTo(px - ca * c - nx * c, py - sa * c - ny * c); ctx.stroke();
        }
        glow(x0, y0, T0 * (2 + 3 * k), '255,110,240', 0.5 * k * fade);
        break;
      }
      case 'blink': {
        const e = Math.min(1, h.age / 0.6), x = ox + h.x * T0, y = oy + h.y * T0;
        ctx.strokeStyle = `rgba(230,180,255,${1 - e})`; ctx.lineWidth = Math.max(1, T0 * 0.2 * (1 - e));
        ctx.beginPath(); ctx.arc(x, y, T0 * (h.out ? 1 + e * 7 : 8 - e * 7), 0, 6.283); ctx.stroke();
        glow(x, y, T0 * 4, '200,120,255', 0.6 * (1 - e));
        break;
      }
    }
  }
  // its death: one last ring of light
  const F = SG22.fxRing;
  if (F) { F.t += 1 / 60; const e = F.t / 1.6; if (e >= 1) SG22.fxRing = null; else { ctx.strokeStyle = `rgba(240,220,255,${1 - e})`; ctx.lineWidth = Math.max(1, T0 * 0.6 * (1 - e)); ctx.beginPath(); ctx.arc(ox + F.x * T0, oy + F.y * T0, T0 * 30 * Math.sqrt(e), 0, 6.283); ctx.stroke(); } }
});
// while it's here, the edges of the screen darken to violet
B12.post.push(function sgVignette22() {
  const b = sgBoss22(); if (!b || Game.screen === 'title' || !bossOnMyScreen(b)) return;
  const vg = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.35, VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.9);
  vg.addColorStop(0, 'rgba(30,0,60,0)'); vg.addColorStop(1, `rgba(30,0,60,${b.phase === 2 ? 0.45 : 0.3})`);
  ctx.fillStyle = vg; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
});
