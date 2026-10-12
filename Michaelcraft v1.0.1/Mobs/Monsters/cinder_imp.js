'use strict';
// =============================================================================
// CINDER IMP   (type 'cinderimp')
//   A fire imp of the Underworld that throws hellfire.
// =============================================================================
defineMob('cinderimp', {
  // ---- STATS ----
  stats: {
    name: 'Cinder Imp', w: 0.7, h: 0.95, speed: 3.6, health: 20, hostile: true, dmg: 4, kb: 1.2, flying: true,
    sunproof: true, fireproof: true, under: true, demon: true, glow: '255,140,40',
    loot: [[FIRE_PETAL, 1, 1, 0.25], [117, 1, 2, 0.4], [MANA_POTION, 1, 1, 0.05]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  ai: 'cimp',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.cinderimp, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/blaze/breathe', 4), vol: 0.35, pitch: [1.3, 1.6], cat: 'volCreatures' },
    hurt: { files: terraria_('dd2_goblin_hurt', 2), vol: 0.6, pitch: [1.2, 1.4], cat: 'volCreatures', synth: 'hit' },
    death: { files: ['terraria/dd2_goblin_death_0'], vol: 0.6, pitch: [1.2, 1.3], cat: 'volCreatures', synth: 'death' },
    cast: { files: terraria_('dd2_flameburst_tower_shot', 2), vol: 0.45, pitch: [1, 1.2], cat: 'volCreatures' },
    blink: { files: ['terraria/item_6'], vol: 0.35, pitch: [1.4, 1.6], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- AI ----
BOLT_COL12.hellfire = ['255,110,20', '#ffc050'];
// Cinder Imp: blinks around you and throws fireballs that bounce
MOB_AI12.cimp = function (m, dt, p, dx, dist) {
  const def = m.def; m.castT = Math.max(0, (m.castT || 0) - dt);
  const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2, pcx = p.x + p.w / 2, pcy = p.y + p.h * 0.4;
  m.blinkCd = (m.blinkCd == null ? 2 + Math.random() * 2 : m.blinkCd) - dt;
  if (m.state === 'hostile' && m.blinkCd <= 0 && !Game.creative) {
    m.blinkCd = 3.5 + Math.random() * 2;
    for (let t = 0; t < 12; t++) {
      const nx = pcx + (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 4), ny = pcy - 1 - Math.random() * 4;
      if (!boxHitsSolid(Game.world, nx - m.w / 2, ny - m.h / 2, m.w, m.h)) {
        for (let i = 0; i < 10; i++) Game.particles.push({ x: mcx, y: mcy, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 0.4, age: 0, size: 0.1, color: i % 2 ? '#ff6a1a' : '#2a0a0a', gravity: 0 });
        m.x = nx - m.w / 2; m.y = ny - m.h / 2; m.vx = m.vy = 0; sfx('cinderimp.blink', mobPos(m)); m.shootCd = 0.45; break;
      }
    }
  }
  if (m.state === 'hostile') {
    m.shootCd = (m.shootCd == null ? 1 : m.shootCd) - dt;
    if (m.shootCd <= 0 && dist < 12 && !Game.creative) {
      m.shootCd = 2.2 + Math.random(); m.castT = 0.4;
      const a = Math.atan2(pcy - mcy, pcx - mcx);
      spawnBolt12({ x: mcx, y: mcy, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9 - 2, kind: 'hellfire', dmg: 4, r: 0.3, life: 2.4, trail: true, grav: 9, bounce: 2 });
      sfx('cinderimp.cast', { x: mcx, y: mcy });
    }
    m.facingDir = dx > 0 ? 1 : -1;
    let tx = pcx + Math.sign(mcx - pcx || 1) * 5, ty = pcy - 2.5;
    { const wp = mobFlyWaypoint(m, tx, ty); if (wp) { tx = wp.x; ty = wp.y; } }   // (a wall in the way: round it, Mobs/_pathfinding.js)
    if (m.kbTimer <= 0) { const ddx = tx - mcx, ddy = ty - mcy, len = Math.hypot(ddx, ddy) || 1, k = Math.min(1, dt * 2); m.vx += (ddx / len * def.speed * Math.min(1, len / 2) - m.vx) * k; m.vy += (ddy / len * def.speed * Math.min(1, len / 2) - m.vy) * k; }
  } else if (m.kbTimer <= 0) { m.vx += (Math.sin(Game.time + m.id) * 1.5 - m.vx) * dt; m.vy += (Math.cos(Game.time * 0.8 + m.id) - m.vy) * dt; }
  moveAndCollide(m, Game.world, dt); m.legPhase += dt;
  if (Math.random() < dt * 10 * particleMul()) Game.particles.push({ x: mcx + (Math.random() - 0.5) * 0.4, y: mcy + 0.2, vx: 0, vy: -0.8, life: 0.5, age: 0, size: 0.06, color: Math.random() < 0.5 ? '#ff8a2a' : '#ffd25a', gravity: -0.4 });
};

// ---- VISUALS (drawing and effects) ----
const CIMP_P = { k: '#1a0606', r: '#5a1410', R: '#8a2416', d: '#3a0c0a', E: '#ffe680', h: '#2a1a14', c: '#e8dcc0', m: '#ff9a2a' };
const CIMP_G = { body: ['..rRRRr.', '.rRRRRRr', '.rRREREr', '.rRRRRRr', '..rRmmm.', '...rRR..', '..rRRRRr', '.rRrRRRr', '.r.rRR.r', '...rRR..', '...r..r.', '...d..d.'] };
MOB_DRAW.cinderimp = (g, m, u, eyes) => {
  const body = mp14('cimp', 'body', CIMP_G.body, CIMP_P, { flat: 'Em' }), t = Game.time + m.id, bob = (Math.sin(t * 4) * 1);
  rig14(g, u, 40, 44, 20, 26, b => {
    b.translate(0, bob);
    const fa = 0.9 + Math.sin(t * 16) * 0.5;
    const wing = (dark, da) => { b.save(); b.translate(-1, 0); b.scale(-1, 1); if (dark) DK14 = 0.6; wing14(b, 7, fa + da, { m: '#3a0c0a', m2: '#5a1410', b: '#1a0606', ol: OL14 }, { back: [2, 2], fingers: 3, spread: 1.2 }); DK14 = 0; b.restore(); };
    wing(true, 0.3);
    drawP14(b, body, 0, 0, 4, 6, 1);
    flame14(b, 0, -8, 3, 5, t, FLAME_FIRE14, 0.8);   // the burning head
    wing(false, 0);
    if (m.castT > 0) { disk14(b, 6, -2, 2.5, 2.5, '#ff7a1a'); disk14(b, 6, -2, 1.3, 1.3, '#ffe680'); }
  });
  if (m.dying == null) eyes14(eyes, 2.5, -4 + bob, u, '255,230,120', 1);
};
