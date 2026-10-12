'use strict';
// =============================================================================
// NIGHT STALKER   (type 'nightstalker')
//   Blinks behind you, fast, sneaky; burns away when the sun comes up.
// =============================================================================
defineMob('nightstalker', {
  // ---- STATS ----
  stats: {
    name: 'Night Stalker', w: 0.6, h: 2.3, speed: 3.8, health: 24, hostile: true, dmg: 5, kb: 0.8, reach: 0.5,
    sunproof: true, nocturnal: true,
    loot: [[MOONPETAL, 1, 2, 0.4], [STRING, 1, 2, 0.5], [BLOOD_SHARD, 1, 1, 0.04]], eye: [0, 0.12, '255,255,255'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 4, range: 24 },
  // ---- AI ----
  ai: 'stalker',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.nightstalker, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/wither/idle', 4), vol: 0.6, pitch: [1.2, 1.5], cat: 'volCreatures' },
    hurt: { files: n_('mob/wither/hurt', 4), vol: 0.9, pitch: [1.1, 1.4], cat: 'volCreatures' },
    death: { files: ['mob/wither/death'], vol: 0.9, pitch: [1.3, 1.5], cat: 'volCreatures' },
    step: { files: n_('mob/husk/step', 5), vol: 0.15, pitch: [0.6, 0.7], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- AI ----
// Night Stalker: blinks behind you, fast, sneaky; burns away when the sun comes
MOB_AI12.stalker = function (m, dt, p, dx, dist) {
  const def = m.def; if (nocturnalGone12(m, dt)) return;
  let tv = 0;
  if (m.state === 'wander') tv = wanderVx(m, dt);
  else if (m.state === 'hostile') {
    const dir = dx > 0 ? 1 : -1, gap = boxGap(m, p); tv = dir * def.speed;
    m.blinkCd = (m.blinkCd == null ? 2 + Math.random() * 3 : m.blinkCd) - dt;
    if (m.blinkCd <= 0 && dist > 4 && dist < 14 && !Game.creative) {
      m.blinkCd = 4 + Math.random() * 3;
      const side = p.facing ? -p.facing : 1, nx = Math.floor(p.x + p.w / 2 + side * 2.5), sf = Game.world.surfaceHeight(nx);
      let ny = null; for (let y = Math.floor(p.y) - 2; y < Math.floor(p.y) + 4; y++) if (Game.world.getTile(nx, y) === AIR && Game.world.getTile(nx, y - 1) === AIR && Game.world.getTile(nx, y - 2) === AIR && solidAt(nx, y + 1)) { ny = y; break; }
      if (ny != null) {
        for (let i = 0; i < 14; i++) Game.particles.push({ x: m.x + m.w / 2, y: m.y + Math.random() * m.h, vx: (Math.random() - 0.5) * 2, vy: -1, life: 0.7, age: 0, size: 0.14, color: i % 2 ? 'rgba(120,90,200,0.6)' : 'rgba(20,10,40,0.8)', gravity: -0.4 });
        m.x = nx + 0.5 - m.w / 2; m.y = ny + 1 - m.h; m.vx = 0; m.vy = 0;
        for (let i = 0; i < 14; i++) Game.particles.push({ x: m.x + m.w / 2, y: m.y + Math.random() * m.h, vx: (Math.random() - 0.5) * 2, vy: -1, life: 0.7, age: 0, size: 0.14, color: i % 2 ? 'rgba(120,90,200,0.6)' : 'rgba(20,10,40,0.8)', gravity: -0.4 });
        sfx('husk.say', { x: m.x, y: m.y, pitch: 0.5 });
      }
    }
    if (gap < def.reach && m.attackCooldown <= 0) { m.attackAnim = 1; if (hitPlayer(m, def.dmg, 7, 4)) m.attackCooldown = 1.0; else m.attackCooldown = 0.4; }
  }
  mobMove(m, tv, dt);
};

// ---- VISUALS (drawing and effects) ----
const STALK_P = { k: '#0d0a14', d: '#1b1526', D: '#2a2140', p: '#3a2d58', E: '#ffffff', c: '#cfc6e8', m: '#4a1030' };
const STALK_G = {
  head: ['..dddd.', '.dDDDDd', 'dDDDDDD', 'dDDD.EE', 'dDDDDDD', 'dDDDDmm', '.dDDDmD', '..dDDDd', '...dD..'],
  body: ['..dDd', '.dDDD', 'dDpDD', 'dDDpD', 'dDDDD', 'dDpDD', '.dDDD', '.dDDd', '.dDDd', '.dDDd', '.dDDd', '.ddDd', '.kkkk'],
  arm: ['dD', 'dD', 'DD', 'dD', 'dD', 'dD', 'dD', 'Dd', 'dD', 'dD', 'dD', 'dD', 'dD', 'DD', 'dD', 'cDc', 'c.c', 'c.c'],
  leg: ['dD', 'dD', 'DD', 'dD', 'dD', 'dD', 'dD', 'Dd', 'dD', 'dD', 'dD', 'dD', 'dD', 'dD', 'kkk', 'kkkk'],
};
let STALK_R;
MOB_DRAW.nightstalker = (g, m, u, eyes) => {
  if (!STALK_R) {
    const p = n => mp14('stalker', n, STALK_G[n], STALK_P, { flat: 'E', ol: '#05030a' });
    STALK_R = {
      leg: p('leg'), legX: [-0.5, 0.5], hipY: -16, legA: [1, 0], body: [p('body'), 2, 12], head: [p('head'), 3, 8, 2, -27], arm: p('arm'), armA: [1, 0], shX: [-1, 1], shY: -27,
      stride: 0.45, armSwing: 0.3, lean: 0.12, walkLean: 0.1, walkMul: 0.75,
      pose: (m) => { const a = m.attackAnim || 0; if (a > 0.02) return { armF: -2.2 * Math.sin(a * Math.PI) - 0.5, armB: -1.4 * Math.sin(a * Math.PI), lean: 0.2 }; return { armF: 0.08 + Math.sin(Game.time * 1.7 + m.id) * 0.05, armB: 0.12 }; },
    };
  }
  rig14(g, u, 48, 52, 24, 48, b => biped14(b, m, 1, STALK_R));
  if (m.dying == null) eyes14(eyes, 5.5, -32, u, '255,255,255', 1.2);
};
