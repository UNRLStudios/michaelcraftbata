'use strict';
// =============================================================================
// HELLHOUND   (type 'hellhound')
//   A burning hound of the Underworld: runs you down and leaps.
// =============================================================================
defineMob('hellhound', {
  // ---- STATS ----
  stats: {
    name: 'Hellhound', w: 1.3, h: 0.95, speed: 6.4, health: 30, hostile: true, dmg: 6, kb: 0.8, reach: 0.4,
    sunproof: true, fireproof: true, under: true, demon: true,
    loot: [[DEMON_HORN, 1, 1, 0.2], [122, 1, 2, 0.6], [133, 1, 2, 0.4]],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 5, range: 24 },
  // ---- AI ----
  ai: 'hound',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.hellhound, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/wolf/growl', 3), vol: 0.85, pitch: [0.45, 0.55], cat: 'volCreatures', synth: 'growl' },
    hurt: { files: n_('mob/wolf/hurt', 3), vol: 0.8, pitch: [0.5, 0.6], cat: 'volCreatures', synth: 'hit' },
    death: { files: ['mob/wolf/death'], vol: 0.8, pitch: [0.45, 0.55], cat: 'volCreatures', synth: 'death' },
    step: { files: n_('mob/wolf/step', 5), vol: 0.15, pitch: [0.6, 0.7], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- AI ----
// Hellhound: runs you down, then leaps
MOB_AI12.hound = function (m, dt, p, dx, dist) {
  const def = m.def; let tv = 0;
  m.pounceCd = (m.pounceCd == null ? 1 : m.pounceCd) - dt;
  if (m.state === 'wander') tv = wanderVx(m, dt) * 1.4;
  else if (m.state === 'hostile') {
    const dir = dx > 0 ? 1 : -1, gap = boxGap(m, p); tv = dir * def.speed;
    if (gap < 0.6) tv *= 0.2;
    if (m.onGround && m.pounceCd <= 0 && Math.abs(dx) < 6 && Math.abs(dx) > 1.5) { m.vy = -9; m.vx = dir * 10.5; m.kbTimer = 0.45; m.pounceCd = 1.8 + Math.random(); m.pouncing = true; sfx('hellhound.say', mobPos(m)); }
    if (gap < def.reach && m.attackCooldown <= 0) { m.attackAnim = 1; if (hitPlayer(m, def.dmg + (m.pouncing ? 2 : 0), 7, 4)) { m.attackCooldown = 0.9; if (!hasFx12(p, 'fireproof') && !Game.creative) p.fireT = Math.max(p.fireT || 0, 2); } else m.attackCooldown = 0.3; }
  }
  if (m.onGround) m.pouncing = false;
  mobMove(m, tv, dt);
  if (Math.abs(m.vx) > 3 && Math.random() < dt * 14 * particleMul()) spawnFlame(m.x + m.w / 2 - Math.sign(m.vx) * 0.5, m.y + m.h * 0.5);
};

// ---- VISUALS (drawing and effects) ----
const HOUND_P = { k: '#140606', d: '#3a0e0c', r: '#6a1a14', R: '#8e2a1c', l: '#b04028', E: '#ffd23a', t: '#f4ead8', m: '#2a0606', c: '#ff8a1a' };
const HOUND_G = {
  body: ['..dddrrrrrrrrr..', '.drrRRRRRRRRRRr.', 'drRRRlRRRRlRRRRr', 'drRRRRRRRRRRRRRr', '.drRRRRRRRRRRRr.', '..ddrRRRRRRRrd..', '....dddddddd....'],
  head: ['..r..r....', '.rRrrRr...', '.rRRRRRRr.', 'rRRRRERRRRR', 'rRRRRRRRRRRk', '.rRRRRtRtRt.', '..rrrr.....'],
  jaw: ['rRRRRRRr', '.rrtrtrr', '..rrrrr.'],
  leg: ['rR', 'RR', 'rR', 'rR', 'dr', 'dr', 'kkk'],
};
MOB_DRAW.hellhound = (g, m, u, eyes) => {
  const p = n => mp14('hound', n, HOUND_G[n], HOUND_P, { flat: 'E' });
  const t = Game.time + m.id, run = Math.abs(m.vx || 0) > 0.4, ph = (m.legPhase || 0) * 2.4, air = !m.onGround;
  const bite = m.attackAnim > 0 ? Math.sin(m.attackAnim * Math.PI) : 0, pounce = air || m.pouncing;
  const sw = (o) => pounce ? 0 : run ? Math.sin(ph + o) * 0.75 : 0;
  const bob = run && !air ? (Math.abs(Math.sin(ph)) * -1.2) : 0;
  rig14(g, u, 64, 40, 32, 30, b => {
    b.translate(0, bob); if (pounce) b.rotate(Math.max(-0.35, Math.min(0.35, (m.vy || 0) * 0.04)));
    // far legs
    DK14 = 0.6;
    drawP14(b, p('leg'), 5, -8, 1, 0, 1, pounce ? -1.0 : sw(Math.PI)); drawP14(b, p('leg'), -6, -8, 1, 0, 1, pounce ? 1.0 : sw(0.6));
    DK14 = 0;
    // the burning tail
    flame14(b, -10, -11, 1.6, 4 + Math.sin(t * 9), t, FLAME_FIRE14, 1.5);
    drawP14(b, p('body'), -1, -9, 8, 3, 1);
    // the mane of fire along the neck and back
    for (let i = 0; i < 5; i++) flame14(b, -3 + i * 2.2, -12 + Math.abs(i - 3) * 0.3, 1.5, 2.5 + (i % 2) * 2, t + i * 0.7, FLAME_FIRE14, 1);
    // head and jaw
    b.save(); b.translate(7, -11); b.rotate(pounce ? -0.15 : run ? Math.sin(ph * 2) * 0.05 : Math.sin(t * 1.5) * 0.05);
    drawP14(b, p('jaw'), 2, 2 + bite, 0, 0, 1, bite * 0.45);
    drawP14(b, p('head'), 0, 0, 2, 4, 1);
    b.restore();
    drawP14(b, p('leg'), 6, -8, 1, 0, 1, pounce ? -1.2 : sw(0)); drawP14(b, p('leg'), -5, -8, 1, 0, 1, pounce ? 1.1 : sw(Math.PI + 0.6));
  });
  if (m.dying == null) eyes14(eyes, 10.5, -11.5 + bob, u, '255,200,60', 1);
};
