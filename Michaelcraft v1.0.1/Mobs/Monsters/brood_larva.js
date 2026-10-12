'use strict';
// =============================================================================
// BROOD LARVA   (type 'broodlarva')
//   The Apex Parasite's young. Born in the fight; they fly at you in swarms.
// =============================================================================
defineMob('broodlarva', {
  // ---- STATS ----
  stats: {
    name: 'Brood Larva', w: 0.8, h: 0.8, speed: 8, health: 14, hostile: true, dmg: 3, kb: 1.4, flying: true,
    fireproof: true, custom: 'larva', tintMul: 2.4,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // it tunnels through the sand and flies through anything
  // ---- AI ----
  update: larvaAI,
  // ---- VISUALS ----
  deathColors: ['#b6ff3a', '#5b2415'],
  // (drawn by MOB_DRAW.broodlarva, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: terraria_('dd2_kobold_flyer_charge_scream', 3), vol: 0.4, pitch: [1.45, 1.75], cat: 'volCreatures', synth: 'hiss' },
    hurt: { files: terraria_('dd2_lightning_bug_hurt', 3), vol: 0.55, pitch: [1.1, 1.3], cat: 'volCreatures', synth: 'hit' },
    death: { files: terraria_('dd2_lightning_bug_death', 3), vol: 0.55, pitch: [1, 1.2], cat: 'volCreatures', synth: 'death' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    const r = Math.random;
    if (r() < 0.3) spawnDrop(134, 1, mx, my);
  },
});

// ---- AI ----
// ---- the Brood Larvae: small worms of its own, each with its own way of moving ----
function larvaAI(m, dt, p) {
  let B = Game.boss;
  if (!B || B.dead || B.type !== 'apexparasite' || B.dying != null) {
    if (m.brood) { deathPuff(m.x + m.w / 2, m.y + m.h / 2, ['#b6ff3a', '#5b2415', '#e6d6a8']); m.dead = true; return; }   // the mother is gone: so are her brood
    B = null;   // (one summoned on its own just hunts you)
  }
  if (!m.role) Object.assign(m, { role: B ? PARA_ROLES[m.id % 3] : 'weave', mode: B && m.id % 3 === 2 ? 'dive' : 'orbit', ang: Math.random() * 6.28, spd: 6, t: 0, oa: 0, dirO: 1, orbitFor: 3, mt: 0, hitCd: 0, side: 1 });
  m.t += dt; m.mt += dt; m.hitCd = Math.max(0, m.hitCd - dt);
  m.fleeT = Math.max(0, (m.fleeT || 0) - dt);
  if (m.kbTimer > 0) {   // knocked about
    m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= Math.pow(0.04, dt); m.vy *= Math.pow(0.04, dt);
    m.spd = Math.hypot(m.vx, m.vy) * 0.5; return;
  }
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2, px = p.x + p.w / 2, py = p.y + p.h / 2, surf = B ? B.surfY : Math.floor(m.y + 8);
  const bx = B ? B.x + B.w / 2 : px, by = B ? B.y + B.h / 2 : py, ph = B ? B.phase : 1, k = 1 + (ph - 1) * 0.18;
  const steer = (tx, ty, spd, turn) => wormSteer(m, tx, ty, spd * k, turn, dt);
  if (m.fleeT > 0) steer(cx + (cx - px) * 3, cy - 6, 10, 6);   // bit you: back off for a moment
  else if (m.role === 'orbit') {   // circles its mother like a ring of guards, then lunges at you
    if (m.mode === 'orbit') {
      m.oa += m.dirO * 2.1 * dt;
      const r = 4.4 + Math.sin(m.t * 1.7 + m.id) * 0.9;
      steer(bx + Math.cos(m.oa) * r, by + Math.sin(m.oa) * r, 11, 7);
      if (m.mt > m.orbitFor) { m.mode = 'lunge'; m.mt = 0; m.aimX = px; m.aimY = py; sfx('broodlarva.say', { x: cx, y: cy, pitch: 1.3 }); }
    } else {
      steer(m.aimX, m.aimY, 16, 5);
      if (m.mt > 1.1 || Math.hypot(m.aimX - cx, m.aimY - cy) < 1) { m.mode = 'orbit'; m.mt = 0; m.orbitFor = 2.2 + Math.random() * 2.4; }
    }
  } else if (m.role === 'weave') {   // darts at you in a weaving line
    steer(px + Math.sin(m.t * 3.7 + m.id) * 4.5, py - 1.5 + Math.cos(m.t * 2.9 + m.id * 1.3) * 3, 9, 4.8);
  } else {   // 'burrow': dives into the sand, tunnels under you, then leaps out
    if (m.mode === 'dive') {
      steer(px + m.side * 5, surf + 6, 10, 5);
      if (cy > surf + 2.5) { m.mode = 'tunnel'; m.mt = 0; }
      else if (m.mt > 3) { m.mt = 0; m.mode = 'tunnel'; }
    } else if (m.mode === 'tunnel') {
      steer(px, surf + 4.5, 11, 5.5);
      if (Math.abs(cx - px) < 1.8 || m.mt > 2.4) { m.mode = 'leap'; m.mt = 0; m.aimX = px; }
    } else {
      steer(m.aimX, py - 12, 15, 7);
      if (m.mt > 0.9 || cy < surf - 8) { m.mode = 'dive'; m.mt = 0; m.side = -m.side; }
    }
  }
  m.x += m.vx * dt; m.y += m.vy * dt;
  m.facingDir = Math.cos(m.ang) >= 0 ? 1 : -1;
  if (m.hitCd <= 0) for (const q of bossVictims()) {
    if (q.x < m.x + m.w + 0.1 && q.x + q.w > m.x - 0.1 && q.y < m.y + m.h + 0.1 && q.y + q.h > m.y - 0.1) {
      bossHitPlayer(3, cx, q, 0, { kb: [7, 4], iframes: 0.4 }); m.hitCd = 0.9; m.fleeT = 0.7; break;
    }
  }
  m.soundCd -= dt;
  if (m.soundCd <= 0) { m.soundCd = 4 + Math.random() * 5; sfx('broodlarva.say', { x: cx, y: cy }); }
}

// ---- VISUALS (drawing and effects) ----
MOB_DRAW.broodlarva = (g, m, u, eyes) => {
  const T = TILE, facing = m.facingDir || 1, hx = m.x + m.w / 2, hy = m.y + m.h / 2, N = 5, gap = 0.42;
  g.scale(facing, 1);
  let tr = m.tr;
  if (!tr) { tr = m.tr = []; const a = m.ang || 0; for (let i = 0; i < N; i++) tr.push({ x: hx - Math.cos(a) * gap * (i + 1), y: hy - Math.sin(a) * gap * (i + 1) }); }
  if (m._tf !== loop.frames) {
    m._tf = loop.frames;
    let px = hx, py = hy;
    for (const s of tr) { const dx = s.x - px, dy = s.y - py, d = Math.hypot(dx, dy); if (d > gap) { s.x = px + dx / d * gap; s.y = py + dy / d * gap; } px = s.x; py = s.y; }
    m.under = solidAt(Math.floor(hx), Math.floor(hy));
  }
  const P = m.hurtFlash > 0 ? PARA_HIT : PARA_COL, t = Game.time + m.id;
  if (m.under) g.globalAlpha = 0.5;
  rig14(g, u, 96, 96, 48, 48, b => {
    for (let i = N - 1; i >= 0; i--) {
      const s = tr[i], x = (s.x - hx) * 16, y = (s.y - hy) * 16, r = 4.6 - i * 0.45;
      disk14(b, x, y, r + 1, r + 1, P.fleshDk); disk14(b, x, y, r, r, i % 2 ? P.flesh : P.fleshHi);
      // a shell plate on top
      disk14(b, x, y - r * 0.35, r * 0.75, r * 0.55, P.shellLo); disk14(b, x - 0.5, y - r * 0.45, r * 0.6, r * 0.4, P.shell);
      px14(b, x - 1, y - r * 0.7, 1, 1, P.shellHi);
      if (i === 1) px14(b, x - 1, y + r * 0.3, 2, 2, P.ooze);
    }
    // the head, turned to where it is going
    const a = m.ang || 0; b.save(); b.rotate(a); if (Math.cos(a) < 0) b.scale(1, -1);
    const open = Math.round(1 + 1.2 * Math.sin(t * 9));
    disk14(b, 0, 0, 6, 6, P.fleshDk); disk14(b, -0.5, -0.5, 5, 5, P.shell); disk14(b, -1, -1.5, 3.5, 2.5, P.shellHi);
    px14(b, 1, 1, 5, 2 + open, P.maw); px14(b, 2, 1, 1, 1, P.tooth); px14(b, 4, 1, 1, 1, P.tooth); px14(b, 3, 2 + open, 1, 1, P.tooth);
    px14(b, 0, -4, 2, 2, P.eye); px14(b, 3, -3, 2, 2, P.eye);
    b.restore();
  }, { ol: OL14 });
  g.globalAlpha = 1;
  eyes.push({ x: Math.cos(m.ang || 0) * T * 0.2 * facing, y: Math.sin(m.ang || 0) * T * 0.2 - T * 0.1, s: T * 0.1, c: '215,255,70' });
};
