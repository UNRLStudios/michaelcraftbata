'use strict';
// =============================================================================
// THE SLAYER OF WORLDS   (type 'slayer')
//   The last boss, at the World's End. Woken at the Shattered Altar with the awakened totem.
//   Three phases (the Arrival, the Corruption, the End); 10,000 health; her damage follows the difficulty.
//   When she falls the credits roll and Hardmode begins.
// =============================================================================
defineMob('slayer', {
  // ---- STATS ----
  stats: {
    name: 'The Slayer of Worlds', w: 1.9, h: 4.4, speed: 9, health: 10000, hostile: true, boss: true, dmg: 9,
    kb: 0, flying: true, fireproof: true, sunproof: true, custom: 'slayer', tintMul: 1.7,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // she flies her own arena
  // ---- AI ----
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.slayer, below)
  // ---- SOUNDS ----
  // ---- LOOT ----
  // (drops nothing)
  onDeath: function (m) {
    bossReward(m, 'slayer16');
    Game.flags.slayerDown = true;
    const mx = m.x + m.w / 2, my = m.y + m.h / 2, r = Math.random;
    for (const [it, q] of [[SLAYER_SWORD, 1], [DIAMOND, 8 + Math.floor(r() * 6)], [MANA_STAR, 3], [134, 20 + Math.floor(r() * 12)], [245, 3], [VOID_CRYSTAL, 6], [HELLSTONE_INGOT, 6]]) {
      const d = spawnDrop(it, q, mx, my); if (d) { d.vx = (r() - 0.5) * 9; d.vy = -4 - r() * 5; }
    }
    Game.boss = null;
    if (!m.heartScene) eventMessage('THE SLAYER OF WORLDS HAS FALLEN. Her soul is free.', '#e070ff');   // (a Hardmode rematch says its own goodbye)
    sfx('toast.challenge');
  },
  // ---- BOSS ----
  boss: {
    name: 'The Slayer of Worlds', music: 'Sounds/music/slayer_of_worlds.mp3',
    home: (m) => m.arena ? { x: m.arena.cx, y: m.arena.floor - 6 } : { x: m.x, y: m.y },
    chase: { x: 90, y: 70 }, summonAdv: 'summonslayer', killAdv: 'slayer16',
    leaveMsg: 'The Slayer of Worlds fades back into the totem. It falls onto the altar...', color: '#d24aff',
    dmgMult: 21.6,   // (Options > difficulty changes it: see SLAYER_DIFF18 in index.html)
  },
  bossAI: (m, dt, p) => slayerAI16(m, dt, p),
});

// ---- AI ----
// ---- THE SHATTERED ALTAR: the summoning ----
let SLR16 = null;
function startSlayerRitual16(x, y, by) {
  if (SLR16 || slBoss16()) return false;
  SLR16 = { x, y, t: 0, by: by || 'host' };
  netFxCapture(x, y, () => { netFx(['slr', x, y]); eventMessage('The totem rises... the sky splits open!', '#e070ff'); sfx('ov.thunder', { x, y }); });
  return true;
}
function updateSlayerRitual16(dt) {
  const R = SLR16; if (!R) return;
  R.t += dt;
  const cx = R.x + 0.5, cy = R.y - 1.5 - Math.min(3, R.t * 0.8);
  for (let i = 0; i < 4 * particleMul(); i++) { const a = Math.random() * 6.28, r = 3 + Math.random() * 7; Game.particles.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r * 1.4, vy: -Math.sin(a) * r, life: 0.7, age: 0, size: 0.1, color: Math.random() < 0.5 ? '#d24aff' : '#ff2a5a', gravity: 0, kind: 'star' }); }
  Game.shake = Math.max(Game.shake, 0.1 + R.t * 0.1);
  if (R.t > 1.5 && !R.b1) { R.b1 = true; sfx('ov.heartbeat', { x: cx, y: cy, pitch: 0.6, vol: 1.4 }); }
  if (R.t > 3 && !R.b2) { R.b2 = true; sfx('ov.heartbeat', { x: cx, y: cy, pitch: 0.5, vol: 1.6 }); flashAt(cx, cy, 5, '220,80,255', 0.3); }
  if (R.cosmetic) { if (R.t > 5) SLR16 = null; return; }
  if (R.t >= 5) {
    SLR16 = null;
    netFxCapture(R.x, R.y, () => spawnSlayer16(R.x, R.y, R.by));
  }
}
B12.updaters.push((dt) => updateSlayerRitual16(dt));
const SL16 = { haz: [], warnText: null };
function slBoss16() { const b = Game.boss; return b && b.type === 'slayer' && !b.dead ? b : null; }
function slGround16(x, from) {
  const w = Game.world, tx = Math.floor(x);
  for (let y = Math.floor(from); y < Math.floor(from) + 40 && y < WORLD_H; y++) if (isSolidId(w.getTile(tx, y))) return y;
  return Math.floor(from) + 14;
}
// (1.7) the ground under x, near height ref: inside the ground, climb to its top; in the air, fall to the floor
function slSurf16(x, ref) {
  const w = Game.world, tx = Math.floor(x); let y = Math.floor(ref);
  if (isSolidId(w.getTile(tx, y))) { for (let k = 0; k < 48 && isSolidId(w.getTile(tx, y - 1)); k++) y--; return y; }
  for (let k = 0; k < 60 && y < WORLD_H - 1; k++, y++) if (isSolidId(w.getTile(tx, y))) return y;
  return Math.floor(ref) + 12;
}
function slHurt16(dmg, fromX, kb, ifr) {
  const p = Game.player; if (!p || p.dead || Game.creative || p.invuln > 0 || Game.spectator) return false;
  dmg = Math.max(1, bossHardHit22(Math.round(dmg * BOSSES.slayer.dmgMult * bossDiffMul13())));   // (Hard: 5 less a hit)
  p.lastKiller = 'The Slayer of Worlds';
  const was = Net.fxCapture; Net.fxCapture = false;
  try {
    p.damage(dmg, 'boss');
    if (!p.dead) { p.invuln = Math.max(p.invuln, ifr || 0.5); const dir = (p.x + p.w / 2) >= fromX ? 1 : -1; const k = kb || [8, 5]; p.knockback(dir, k[0], k[1]); }
  } finally { Net.fxCapture = was; }
  return true;
}
function slSpawn16(h) {
  if (Net.fxCapture) netFx(['sl', h]);
  const was = Net.fxCapture; Net.fxCapture = false;
  try { h.age = 0; SL16.haz.push(h); slOnSpawn16(h); } finally { Net.fxCapture = was; }
}
function slOnSpawn16(h) {
  switch (h.t) {
    case 'arc': sfx('katana.swing', { x: h.x, y: h.y, pitch: 0.55 + Math.random() * 0.15, vol: 1.3 }); break;
    case 'pillar': sfx('ov.rumble', { x: h.x, y: h.gy, vol: 0.5, pitch: 1.3 }); break;
    case 'ring': sfx('spell.void', { x: h.x, y: h.y, pitch: 0.8 }); break;
    case 'line': sfx('ov.charge', { x: h.x0, y: h.y0, pitch: 1.4 }); break;
    case 'meteor': sfx('ov.warn', { x: h.x, y: h.gy, vol: 0.5, pitch: 1.7 }); break;
    case 'vortex': sfx('spell.void', { x: h.x, y: h.y, pitch: 0.45, vol: 1.4 }); break;
    case 'blast': SL16.warnText = { text: 'FIND THE LIGHT!', t: h.warn, col: '#fff2ff' }; break;
    case 'mark': sfx('spell.zap', { x: h.x, y: h.y, pitch: 0.6, vol: 0.6 }); break;
  }
}
function slClear16() { SL16.haz.length = 0; SL16.warnText = null; }
const angDiff16 = (a, b) => { let d = ((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return Math.abs(d); };
function segDist16(px, py, x0, y0, x1, y1) { const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / L)); return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t)); }
// ---- every game: move her hazards, check MY player ----
B12.updaters.push(function slHazards16(dt, p) {
  const H = SL16.haz;
  if (SL16.warnText) { SL16.warnText.t -= dt; if (SL16.warnText.t <= 0) SL16.warnText = null; }
  if (!H.length) return;
  const boss = slBoss16();
  if (!boss || boss.dying != null) { slClear16(); return; }
  const pcx = p.x + p.w / 2, pcy = p.y + p.h / 2, alive = !p.dead && !Game.creative;
  for (let i = H.length - 1; i >= 0; i--) {
    const h = H[i]; h.age += dt;
    let done = false;
    switch (h.t) {
      case 'arc': {   // a sword slash: a crescent in front of her
        if (alive && !h.hit && h.age >= h.warn && h.age <= h.warn + h.dur) {
          const d = Math.hypot(pcx - h.x, pcy - h.y);
          if (d < h.r + 0.55 && d > h.r * 0.15 && angDiff16(Math.atan2(pcy - h.y, pcx - h.x), h.a) < h.sw + 0.15) { h.hit = true; slHurt16(h.dmg, h.x, [10, 5], h.ifr || 0.4); }
        }
        if (h.age > h.warn + h.dur + 0.3) done = true;
        break;
      }
      case 'shock': {
        const fx = h.x + h.dir * h.speed * h.age, gy = slSurf16(fx, (h.fgy != null ? h.fgy : h.gy) - 0.5);
        h.fx = fx; h.fgy = gy;
        if (Math.random() < dt * 40 * particleMul()) Game.particles.push({ x: fx, y: gy - 0.2, vx: h.dir * 2, vy: -3 - Math.random() * 3, life: 0.4, age: 0, size: 0.13, color: Math.random() < 0.5 ? '#d24aff' : '#ff5af0', gravity: 8 });
        if (alive && Math.abs(pcx - fx) < 0.8 && p.y + p.h > gy - 1.3 && p.y < gy) slHurt16(h.dmg, fx - h.dir, [7, 9]);
        if (h.age > h.life || solidAt(Math.floor(fx + h.dir * 0.6), gy - 1)) done = true;
        break;
      }
      case 'pillar': {
        if (h.age >= h.warn && !h.up) { h.up = true; sfx('ov.pillar', { x: h.x, y: h.gy, pitch: 1.3 }); }
        if (h.up) {
          if (Math.random() < dt * 50 * particleMul()) Game.particles.push({ x: h.x + (Math.random() - 0.5) * 1.6, y: h.gy - Math.random() * h.h, vx: (Math.random() - 0.5) * 2, vy: -6 - Math.random() * 6, life: 0.4, age: 0, size: 0.14, color: Math.random() < 0.5 ? '#d24aff' : '#ffb0ff', gravity: 0 });
          if (alive && Math.abs(pcx - h.x) < 1.05 && p.y + p.h > h.gy - h.h && p.y < h.gy) slHurt16(h.dmg, h.x, [6, 12]);
        }
        if (h.age > h.warn + h.dur) done = true;
        break;
      }
      case 'ring': {   // corruption rings: they burst where they touch you
        const r = h.age * h.speed, d = Math.hypot(pcx - h.x, pcy - h.y);
        if (alive && !h.hitMe && Math.abs(d - r) < 0.6) {
          const a = Math.atan2(pcy - h.y, pcx - h.x);
          if (!h.gaps.some(g => angDiff16(a, g) < h.gw)) { h.hitMe = true; slHurt16(h.dmg, h.x, [9, 6]); voidBurst16(pcx, pcy, 22, true); sfx('spell.boom', { x: pcx, y: pcy, pitch: 0.7 }); }
        }
        if (r > (h.max || 34)) done = true;
        break;
      }
      case 'line': {   // WORLD SPLIT: a rip across the whole arena
        if (h.age >= h.warn && !h.fired) {
          h.fired = true; sfx('ov.beam', { x: (h.x0 + h.x1) / 2, y: (h.y0 + h.y1) / 2, pitch: 1.3 }); sfx('explode', { x: pcx, y: pcy, pitch: 0.6, vol: 0.7 }); Game.shake = Math.min(1.4, Game.shake + 0.35 * Settings.shake / 100);
          if (alive && segDist16(pcx, pcy, h.x0, h.y0, h.x1, h.y1) < h.th + 0.45) slHurt16(h.dmg, h.x0 === h.x1 ? h.x0 : pcx - 1, [8, 6], 0.6);
          for (let k = 0; k < 30 * particleMul(); k++) { const q = Math.random(); Game.particles.push({ x: h.x0 + (h.x1 - h.x0) * q, y: h.y0 + (h.y1 - h.y0) * q, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 0.5, age: 0, size: 0.1, color: k % 2 ? '#ffffff' : '#ff5af0', gravity: 0, kind: 'star' }); }
        }
        if (h.age > h.warn + h.dur) done = true;
        break;
      }
      case 'meteor': {
        if (h.age >= h.warn && !h.hit) {
          const k = Math.min(1, (h.age - h.warn) / 0.4);
          h.mx = h.x - h.dir * 9 * (1 - k); h.my = h.gy - 24 * (1 - k);
          if (Math.random() < 0.8 * particleMul()) Game.particles.push({ x: h.mx, y: h.my, vx: -h.dir * 2, vy: -3, life: 0.5, age: 0, size: 0.2, color: Math.random() < 0.5 ? '#d24aff' : '#1a0620', gravity: 0, kind: 'poof' });
          if (k >= 1) {
            h.hit = true; h.hitAt = h.age; voidBurst16(h.x, h.gy - 0.4, 30, true); sfx('ov.meteor', { x: h.x, y: h.gy, pitch: 1.2 }); Game.shake = Math.min(1.4, Game.shake + 0.3 * Settings.shake / 100);
            if (alive && Math.hypot(pcx - h.x, (p.y + p.h) - h.gy) < 2.6) slHurt16(h.dmg, h.x, [10, 8]);
          }
        }
        if (h.hit && h.age > h.hitAt + 0.2) done = true;
        break;
      }
      case 'vortex': {   // REALITY SPIRAL: it drags you in, and the middle tears you apart
        if (alive && h.age < h.dur) {
          const d = Math.hypot(pcx - h.x, pcy - h.y);
          if (d < h.R) { applyBossPull(p, h.x, h.y, dt * (10 + 14 * (1 - d / h.R))); p.fallStartY = p.y; }
          h.tick = (h.tick || 0) - dt;
          if (d < 2.4 && h.tick <= 0) { h.tick = 0.35; const was = p.invuln; p.invuln = 0; slHurt16(h.dmg, h.x, [2, 2], 0.05); if (p.invuln < was) p.invuln = was; }
        }
        if (h.age > h.dur + 0.4) done = true;
        break;
      }
      case 'blast': {   // WORLD END: anyone outside the light...
        if (h.age >= h.warn && !h.fired) {
          h.fired = true;
          const safe = SL16.haz.some(s => s.t === 'sanct' && Math.abs(pcx - s.x) < s.r && Math.abs((p.y + p.h) - s.gy) < 3.5);
          Game.shake = 1.4; flashDamage(); sfx('ov.death', { x: h.x, y: h.y, pitch: 0.7 }); sfx('explode', { pitch: 0.4, vol: 1.5 });
          SL16.whiteT = 1.2;
          if (alive && !safe) { const was = p.invuln; p.invuln = 0; slHurt16(h.dmg, h.x, [16, 10], 1.5); if (p.invuln < was) p.invuln = was; }
          else if (alive) eventMessage('The light shelters you!', '#fff2ff');
        }
        if (h.age > h.warn + 0.6) done = true;
        break;
      }
      case 'sanct': case 'mark': { if (h.age > (h.dur || h.life || 1)) done = true; break; }
    }
    if (done) H.splice(i, 1);
  }
});
B12.updaters.push((dt) => { if (SL16.whiteT > 0) SL16.whiteT -= dt; });
{
  const pnOrig = playNetFx;
  playNetFx = function (list) {
    const p = Game.player, rest = [];
    for (const e of list) {
      if (e[0] === 'ph0' || e[0] === 'ph22' || e[0] === 'phd') { slHeartFx22(e); continue; }   // (the Crystal Heart scene, on a friend's screen)
      if (e[0] !== 'sl' && e[0] !== 'slr') { rest.push(e); continue; }
      const o = e[e.length - 1] || [0, 0], near = p && !Game.outside && Math.hypot(o[0] - p.x, o[1] - p.y) < 90;
      if (!near) continue;
      if (e[0] === 'sl') slSpawn16(e[1]); else SLR16 = { x: e[1], y: e[2], t: 0, cosmetic: true };
    }
    if (rest.length) pnOrig(rest);
  };
  const bdtOrig = bossDamageTaken;
  bossDamageTaken = function (mob, dmg, kind) {
    const d = bdtOrig(mob, dmg, kind);
    return mob && mob.type === 'slayer' && mob.move === 'exhausted' ? d * 2 : d;
  };
  const dyOrig = bossDying;
  bossDying = function (m, dt) { if (m.type === 'slayer') { slayerDying16(m, dt); return; } return dyOrig(m, dt); };
}
// ---- she arrives ----
function spawnSlayer16(ax, ay, by) {
  const floor = slGround16(ax + 0.5, ay - 2);
  const A = { cx: ax + 0.5, floor, altar: [ax, ay] };
  const m = new Mob('slayer', ax + 0.5 - 0.75, floor - 42);
  Object.assign(m, { arena: A, phase: 1, move: 'intro', moveT: 0, t: 0, cd: 1, last: '', bossInvuln: 4, state: 'hostile', guardian: true, leaveT: 0, facingDir: 1, side: 1, vis: 1, swN: 0, swD: 1, weDone: false });
  Game.mobs.push(m); bossSpawned(m);
  sfx('ov.thunder', { x: ax, y: ay }); sfx('boss.spawn', { x: ax, y: ay, pitch: 0.7 }); screenShake(1); flashDamage();
  eventMessage('THE SLAYER OF WORLDS DESCENDS!', '#e070ff');
  if (by && by !== 'host' && Net.peers.has(by)) netSend(by, { t: 'adv', id: 'summonslayer' }); else Adv.grant('summonslayer');
}
function slayerLeave16(m) {
  bossLeave(m); slClear16();
  for (const x of Game.mobs) if (x.type === 'worldshade') x.dead = true;
  const A = m.arena; if (A && A.altar && !m.echo18) { const d = spawnDrop(MYST_AWAKE, 1, A.altar[0] + 0.5, A.altar[1] - 0.5); if (d) d.vy = -3; }
}
function summonShades16(m, n) {
  const A = m.arena; sfx('ov.summon', { x: m.x, y: m.y, pitch: 1.3 });
  const vs = bossVictims().filter(q => bossNear(m, q, 10));
  for (let i = 0; i < n; i++) {
    const q = vs.length ? vs[i % vs.length] : Game.player;
    const x = q.x + (i % 2 ? 1 : -1) * (4 + Math.random() * 4), gy = slSurf16(x, q.y + q.h - 0.5);
    const d = new Mob('worldshade', x - 0.35, gy - 1.8); d.state = 'hostile'; d.guardian = true;
    if (!boxHitsSolid(Game.world, d.x, d.y, d.w, d.h)) Game.mobs.push(d);
    voidBurst16(x, gy - 0.5, 16, false);
  }
}
// ---- HER MOVES (the host) ----
const SL_PHASE16 = [null, ['The Arrival', ''], ['The Corruption', 'her power grows'], ['The Final Form', 'she sheds what was left of her'], ['The End', 'there is only her, and you']];
function slayerAI16(m, dt, p) {
  const A = m.arena, mcx = m.x + m.w / 2, mcy = m.y + m.h / 2, pcx = p.x + p.w / 2, pcy = p.y + p.h / 2, dx = pcx - mcx, dir = dx > 0 ? 1 : -1;
  m.t += dt; m.moveT += dt; m.bossInvuln = Math.max(0, (m.bossInvuln || 0) - dt); m.cd = Math.max(0, m.cd - dt);
  const ph = m.phase, fast = [1, 1, 1.15, 1.3, 1.6][ph], hp = m.health / m.maxHealth;
  const victims = bossVictims().filter(q => bossNear(m, q, 10));
  const go = (mv) => { m.move = mv; m.moveT = 0; m.did = 0; m.last = mv; m.hitDone = false; m.slamRef = null; };
  const ground = (x, ref) => slSurf16(x, ref != null ? ref : p.y + p.h - 0.5);
  const slash = (q, a, r, warn, dmg, sw, ifr) => { m.swN = (m.swN + 1) % 1000; m.swD = -m.swD; const h = { t: 'arc', x: r1(m.x + m.w / 2), y: r1(m.y + m.h * 0.45), a: r2(a), r: r || 4.2, sw: sw || 1.05, warn: warn || 0.16, dur: 0.14, dmg: dmg || 10 }; if (ifr) h.ifr = ifr; slSpawn16(h); };
  if (!bossFighters(m).length) { m.leaveT += dt; if (m.leaveT > (bossPlayers().length ? 6 : 3)) { slayerLeave16(m); return; } } else m.leaveT = 0;
  if (m.move !== 'transform' && m.move !== 'intro' && m.move !== 'worldend') {
    if ((ph === 1 && hp <= 0.7) || (ph === 2 && hp <= 0.4) || (ph === 3 && hp <= 0.1)) { go('transform'); m.nextPhase = ph + 1; }
    else if (ph === 4 && hp <= 0.035 && !m.weDone && m.move !== 'exhausted') { go('worldend'); m.weDone = true; }
  }
  let tx = pcx + m.side * 6, ty = Math.min(pcy - 3.5, ground(pcx) - 5), spd = 9 * fast, hold = false;
  m.vis = Math.min(1, (m.vis == null ? 1 : m.vis) + dt * 4);
  switch (m.move) {
    case 'intro': {
      hold = true; m.vx = 0; m.vy = 0; m.bossInvuln = 1;
      const k = Math.min(1, m.moveT / 3.2), ty0 = A.floor - 42, ty1 = A.floor - 8;
      m.y = ty0 + (ty1 - ty0) * (1 - Math.pow(1 - k, 3)) - m.h / 2;
      if (Math.random() < 0.5) slFeather16(mcx + (Math.random() - 0.5) * 6, mcy + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2, -1);
      if (m.moveT > 3.3 && !m.did) { m.did = 1; sfx('ov.scream', { x: mcx, y: mcy, pitch: 1.5 }); screenShake(0.8); voidBurst16(mcx, mcy, 40, true); }
      if (m.moveT > 4.2) { go('hover'); m.cd = 0.6; m.bossInvuln = 0; }
      break;
    }
    case 'transform': {
      hold = true; m.vx *= 0.9; m.vy = (pcy - 7 - mcy) * 1.5; m.bossInvuln = 0.5;
      if (!m.did) {
        m.did = 1; m.phase = m.nextPhase; slClear16(); flashDamage(); screenShake(1.3);
        sfx('ov.scream', { x: mcx, y: mcy, pitch: 1.4 }); sfx('ov.thunder', { x: mcx, y: mcy });
        for (let i = 0; i < 70; i++) { const a = i / 70 * 6.28; Game.particles.push({ x: mcx, y: mcy, vx: Math.cos(a) * 14, vy: Math.sin(a) * 14, life: 0.8, age: 0, size: 0.15, color: i % 2 ? '#ff5af0' : '#ff2a4a', gravity: 0, kind: 'star' }); }
        const P = SL_PHASE16[m.phase];
        eventMessage(`Phase ${m.phase}: ${P[0]}!`, '#e070ff');   // (1.7: the title card is drawn by every game when it sees her change)
        if (m.phase === 2) summonShades16(m, 2);
      }
      if (m.moveT > 2.4) { go('hover'); m.cd = 0.3; }
      break;
    }
    case 'hover': {
      if (Math.abs(dx) < 3 && Math.random() < dt) m.side = -m.side;
      if (m.cd <= 0) {
        const shades = Game.mobs.filter(q => q.type === 'worldshade' && q.dying == null).length;
        const pool = ph === 1 ? [['dive', 3], ['swings', 4], ['minions', 1.5]]
          : ph === 2 ? [['dive', 2], ['swings', 3], ['minions', 1], ['shatter', 3], ['teleport', 3], ['rings', 2.5]]
            : ph === 3 ? [['dive', 1.5], ['swings', 2], ['shatter', 2], ['teleport', 2.5], ['rings', 2], ['split', 3.5], ['meteors', 2.5], ['frenzy', 3]]
              : [['teleport', 2], ['split', 2], ['frenzy', 2], ['spiral', 3], ['infinite', 3.5], ['rings', 1.5], ['dive', 1.5]];
        go(pickW12(pool.filter(([n]) => n !== m.last && !(n === 'minions' && shades >= 5))));
      }
      break;
    }
    case 'dive': {   // SKY DIVE: up high... then straight down on you, and the ground cracks
      if (!m.did) { m.did = 1; m.diveX = pcx; m.diveN = ph >= 2 ? 2 : 1; slSpawn16({ t: 'mark', x: r1(pcx), y: r1(ground(pcx) - 0.2), life: 0.9 }); }
      if (m.moveT < 0.8) { hold = true; tx = m.diveX; ty = ground(m.diveX) - 15; m.vx += ((tx - mcx) * 4 - m.vx) * Math.min(1, dt * 6); m.vy += ((ty - mcy) * 4 - m.vy) * Math.min(1, dt * 6); }
      else if (!m.hitDone) {
        hold = true; const gy = ground(m.diveX), ddx = m.diveX - mcx, ddy = gy - (m.y + m.h), L = Math.hypot(ddx, ddy) || 1;
        m.vx = ddx / L * 36 * Math.min(1.2, fast); m.vy = ddy / L * 36 * Math.min(1.2, fast);
        for (const q of victims) if (boxGap(m, q) < 0.4 && !(q.invuln > 0)) bossHitPlayer(13, mcx, q, 0, { kb: [14, 9], iframes: 0.6 });
        if (m.y + m.h >= gy - 0.2 || m.moveT > 2) {
          m.hitDone = true; m.y = gy - m.h - 0.1; m.vx = 0; m.vy = 0; m.landT = m.moveT;
          sfx('ov.slam', { x: mcx, y: gy, pitch: 1.2 }); sfx('fall.big', { x: mcx, y: gy, pitch: 0.5 }); screenShake(1); voidBurst16(mcx, gy - 0.5, 40, true);
          for (const s of [-1, 1]) slSpawn16({ t: 'shock', x: r1(mcx + s * 1.2), gy, dir: s, speed: 15 * fast, life: 2, dmg: 10 });
          for (const q of victims) if (Math.abs(q.x + q.w / 2 - mcx) < 3 && q.y + q.h > gy - 3) bossHitPlayer(12, mcx, q, 0, { kb: [14, 9], iframes: 0.5 });
        }
      } else {
        hold = true; m.vx = 0; m.vy = 0;
        if (m.moveT - m.landT > 0.55) { if (--m.diveN > 0) { m.moveT = 0; m.hitDone = false; m.diveX = pcx; slSpawn16({ t: 'mark', x: r1(pcx), y: r1(ground(pcx) - 0.2), life: 0.9 }); } else { go('hover'); m.cd = 0.5 / fast; } }
      }
      break;
    }
    case 'swings': {   // SWORD SWINGS: she closes in and cuts, three times (more later)
      const n = ph === 1 ? 3 : ph === 2 ? 4 : 5;
      if (!m.did) { hold = true; const wantX = pcx - dir * 2.2, wantY = pcy - 0.6; m.vx += ((wantX - mcx) * 7 - m.vx) * Math.min(1, dt * 8); m.vy += ((wantY - mcy) * 7 - m.vy) * Math.min(1, dt * 8); if (Math.hypot(wantX - mcx, wantY - mcy) < 1.2 || m.moveT > 1) { m.did = 1; m.cutT = m.moveT; m.cuts = 0; } }
      else {
        hold = true; m.vx *= 0.8; m.vy *= 0.8;
        if (m.cuts < n && m.moveT - m.cutT > m.cuts * 0.34 / fast) {
          m.cuts++; const a = Math.atan2(pcy - mcy, dx) + (Math.random() - 0.5) * 0.4;
          slash(p, a, 4.2, 0.16, 10); m.vx += Math.cos(a) * 9; m.vy += Math.sin(a) * 4;
        }
        if (m.cuts >= n && m.moveT - m.cutT > n * 0.34 / fast + 0.5) { go('hover'); m.cd = 0.5 / fast; }
      }
      break;
    }
    case 'minions': {
      hold = true; m.vx *= 0.9; m.vy *= 0.9;
      if (m.moveT > 0.6 && !m.did) { m.did = 1; summonShades16(m, ph === 1 ? 3 : 2); }
      if (m.moveT > 1.4) { go('hover'); m.cd = 0.4; }
      break;
    }
    case 'shatter': {   // WORLD SHATTER: the sword goes into the ground and corruption erupts
      if (m.moveT < 0.6) { hold = true; m.vx += (pcx - mcx) * dt * 3; m.vy = -5; m.slamX = pcx; }
      else if (!m.hitDone) {
        hold = true; m.vy = 34; m.vx = (m.slamX - mcx) * 3;
        const gy = ground(mcx, m.slamRef != null ? m.slamRef : (m.slamRef = p.y + p.h - 0.5));
        if (m.y + m.h >= gy - 0.1 || m.moveT > 2.2) {
          m.hitDone = true; m.y = gy - m.h - 0.05; m.vy = 0; m.vx = 0; m.slamT = m.moveT; m.slamGX = mcx;
          sfx('ov.slam', { x: mcx, y: gy, pitch: 1.1 }); screenShake(1); voidBurst16(mcx, gy - 0.5, 36, true);
        }
      } else {
        hold = true; m.vx = 0; m.vy = 0;
        const n = ph >= 3 ? 9 : 7, k = Math.floor((m.moveT - m.slamT) / (0.11 / fast));
        while ((m.did || 0) < Math.min(n, k)) {
          m.did = (m.did || 0) + 1; const d = m.did;
          for (const s of [-1, 1]) { const x = m.slamGX + s * (1.5 + d * 3.1); if (Math.abs(x - A.cx) < 60) slSpawn16({ t: 'pillar', x: r1(x), gy: ground(x), warn: 0.5, dur: 0.75, h: 12, dmg: 12 }); }
          if (d === 3) for (const q of victims) { const qx = q.x + q.w / 2; slSpawn16({ t: 'pillar', x: r1(qx), gy: ground(qx), warn: 0.7, dur: 0.75, h: 12, dmg: 12 }); }
        }
        if (m.moveT - m.slamT > n * 0.11 + 1.3) { go('hover'); m.cd = 0.5 / fast; }
      }
      break;
    }
    case 'teleport': {   // TELEPORT STRIKES: gone... then right behind you
      const n = ph === 2 ? 3 : ph === 3 ? 4 : 5, gap = ph >= 4 ? 0.32 : 0.48, cyc = gap + 0.45;
      hold = true; m.vx = 0; m.vy = 0;
      const i = Math.floor(m.moveT / cyc), f = m.moveT - i * cyc;
      if (i >= n) { m.vis = 1; go('hover'); m.cd = 0.5 / fast; break; }
      if (m.did <= i) {
        m.did = i + 1; m.vis = 0; voidBurst16(mcx, mcy, 18, false); sfx('spell.zap', { x: mcx, y: mcy, pitch: 0.5 });
        const q = victims.length ? victims[i % victims.length] : p, back = -(q.facing || dir) || 1;
        m.tpX = q.x + q.w / 2 + back * 2.3; m.tpY = q.y + q.h / 2 - 0.6; m.tpQ = q;
        slSpawn16({ t: 'mark', x: r1(m.tpX), y: r1(m.tpY), life: gap });
      }
      if (f < gap) m.vis = 0;
      else if (m.tpX != null) {
        m.x = m.tpX - m.w / 2; m.y = m.tpY - m.h / 2; m.tpX = null; m.vis = 1;
        const q = m.tpQ || p, a = Math.atan2(q.y + q.h / 2 - (m.y + m.h / 2), q.x + q.w / 2 - (m.x + m.w / 2));
        m.facingDir = Math.cos(a) >= 0 ? 1 : -1;
        slash(q, a, 3.8, 0.14, 11); voidBurst16(m.x + m.w / 2, m.y + m.h / 2, 14, false);
      }
      break;
    }
    case 'rings': {   // CORRUPTION RINGS: find the gap
      hold = true; m.vx *= 0.85; m.vy *= 0.85;
      const n = ph >= 3 ? 3 : 2;
      if (m.moveT > 0.6 && m.did < n && m.moveT > 0.6 + m.did * 0.6) {
        m.did++;
        const g0 = Math.random() * 6.28, gaps = ph >= 3 ? [g0, g0 + 2.6] : [g0, g0 + 2.1, g0 + 4.2];
        slSpawn16({ t: 'ring', x: r1(mcx), y: r1(mcy), speed: 7 + ph, gaps: gaps.map(r2), gw: 0.36, dmg: 10, max: 36 });
      }
      if (m.moveT > 0.8 + n * 0.6 + 0.6) { go('hover'); m.cd = 0.5 / fast; }
      break;
    }
    case 'split': {   // WORLD SPLIT: the world is cut open, across and down
      hold = true; m.vx *= 0.85; m.vy += ((pcy - 8) - mcy) * dt * 2;
      const n = ph >= 4 ? 6 : 4;
      if (m.moveT > 0.5 && m.did < n && m.moveT > 0.5 + m.did * 0.45 / fast) {
        const q = victims.length ? victims[m.did % victims.length] : p, qx = q.x + q.w / 2, qy = q.y + q.h / 2, vert = m.did % 2 === 0;
        m.did++; m.swN = (m.swN + 1) % 1000;
        if (vert) slSpawn16({ t: 'line', x0: r1(qx + (Math.random() - 0.5) * 1.5), y0: r1(qy - 30), x1: 0, y1: r1(qy + 10), warn: 0.85, dur: 0.4, th: 0.7, dmg: 14 });
        else slSpawn16({ t: 'line', x0: r1(A.cx - 62), y0: r1(qy + (Math.random() - 0.5)), x1: r1(A.cx + 62), y1: 0, warn: 0.85, dur: 0.4, th: 0.65, dmg: 14 });
        const h = SL16.haz[SL16.haz.length - 1]; if (h && h.t === 'line') { if (vert) h.x1 = h.x0; else h.y1 = h.y0; }
      }
      if (m.moveT > 0.6 + n * 0.45 / fast + 1.4) { go('hover'); m.cd = 0.5 / fast; }
      break;
    }
    case 'meteors': {   // METEOR CALL: corrupted stars fall
      hold = true; m.vx *= 0.9; m.vy *= 0.9;
      const n = ph >= 4 ? 14 : 11;
      if (m.moveT > 0.5 && m.did < n && m.moveT > 0.5 + m.did * 0.18) {
        const q = victims.length ? victims[m.did % victims.length] : p;
        const aim = m.did < 3 ? q.x + q.w / 2 + (q.vx || 0) * 0.6 : A.cx + (Math.random() - 0.5) * 100;
        m.did++;
        slSpawn16({ t: 'meteor', x: r1(aim), gy: ground(aim), warn: 1.05, dir: Math.random() < 0.5 ? -1 : 1, dmg: 13 });
      }
      if (m.moveT > 0.6 + n * 0.18 + 1.2) { go('hover'); m.cd = 0.5 / fast; }
      break;
    }
    case 'frenzy': case 'infinite': {   // FRENZY SLASHES / INFINITE SLASHES: she's everywhere at once
      hold = true; m.vx = 0; m.vy = 0;
      const inf = m.move === 'infinite', n = 6, step = inf ? 0.62 : 0.52;   // (1.0.1: slowed down so you can dodge it; Infinite was 14 cuts every 0.16 s, then 10 every 0.34 s)
      if (m.moveT > 0.35 && m.did < n && m.moveT > 0.35 + m.did * step) {
        const q = victims.length ? victims[m.did % victims.length] : p, qx = q.x + q.w / 2, qy = q.y + q.h / 2;
        m.did++;
        const ang = Math.random() * 6.28, R = inf ? 3.3 : 3.2;
        m.x = qx + Math.cos(ang) * R - m.w / 2; m.y = Math.min(qy + Math.sin(ang) * R * 0.6, ground(qx) - 1) - m.h / 2;
        m.facingDir = Math.cos(ang) > 0 ? -1 : 1;
        slash(q, ang + Math.PI, inf ? 3.5 : 3.6, inf ? 0.5 : 0.44, inf ? 6 : 8, 0.72, 1.1);   // (each cut warns you 0.5 s / 0.44 s ahead (was 0.12 / 0.15, then 0.34 / 0.26), is narrower, and a hit protects you for 1.1 s)
        voidBurst16(m.x + m.w / 2, m.y + m.h / 2, 8, false);
      }
      if (m.moveT > 0.35 + n * step + 0.6) { go('hover'); m.cd = 0.45 / fast; }
      break;
    }
    case 'spiral': {   // REALITY SPIRAL
      hold = true; m.vx *= 0.8; m.vy *= 0.8;
      if (!m.did) { m.did = 1; slSpawn16({ t: 'vortex', x: r1(mcx), y: r1(mcy), dur: 3.4, R: 16, dmg: 4 }); }
      if (m.did === 1 && m.moveT > 1.4) { m.did = 2; for (let k = 0; k < 6; k++) slash(p, k / 6 * 6.28, 5.5, 0.4, 9, 0.5); }
      if (m.moveT > 4) { go('hover'); m.cd = 0.4; }
      break;
    }
    case 'worldend': {   // WORLD END: everything she has left. Find the light.
      hold = true; m.bossInvuln = 1;
      if (m.weX == null) { m.weX = pcx; m.weY = Math.min(pcy - 6.5, ground(pcx) - 8); }
      m.vx += ((m.weX - mcx) * 2 - m.vx) * Math.min(1, dt * 3); m.vy += ((m.weY - mcy) * 2 - m.vy) * Math.min(1, dt * 3);
      if (!m.did) {
        m.did = 1; slClear16();
        eventMessage('WORLD END. Get into the light!', '#ffffff');
        const xs = [];   // a pillar of light near each player (not too near): get in it
        for (const q of (victims.length ? victims : [p])) { const qx = q.x + q.w / 2; let x = qx + (Math.random() < 0.5 ? -1 : 1) * (9 + Math.random() * 4); if (Math.abs(x - A.cx) > 54) x = qx - Math.sign(x - qx) * 11; if (!xs.some(o => Math.abs(o - x) < 5)) xs.push(x); }
        for (const x of xs) slSpawn16({ t: 'sanct', x: r1(x), gy: ground(x), r: 2.6, dur: 6 });
        slSpawn16({ t: 'blast', x: r1(m.weX), y: r1(m.weY), warn: 5, dmg: 46 });
        sfx('ov.charge', { x: mcx, y: mcy, pitch: 0.5, vol: 1.5 });
      }
      Game.shake = Math.max(Game.shake, 0.1 + m.moveT * 0.06);
      if (m.moveT > 5.6) { m.weX = null; go('exhausted'); }
      break;
    }
    case 'exhausted': {   // she falls, spent. Now's your chance (she takes double damage)
      hold = true; const gy = ground(mcx, m.y + m.h - 0.5); m.vx *= 0.9; m.vy = Math.min(12, m.vy + 30 * dt); if (m.y + m.h > gy) { m.y = gy - m.h; m.vy = 0; }
      if (!m.did) { m.did = 1; eventMessage('She is exhausted! Strike now!', '#ffd23a'); }
      if (m.moveT > 7) { go('hover'); m.cd = 0.3; }
      break;
    }
  }
  if (!hold) {
    const ddx = tx - mcx, ddy = ty - mcy, L = Math.hypot(ddx, ddy) || 1;
    m.vx += (ddx / L * spd * Math.min(1, L / 3) - m.vx) * Math.min(1, dt * 3);
    m.vy += (ddy / L * spd * Math.min(1, L / 3) - m.vy) * Math.min(1, dt * 3);
  }
  if (m.move !== 'teleport' && m.move !== 'frenzy' && m.move !== 'infinite') m.facingDir = m.move === 'dive' && !m.hitDone && m.moveT > 0.8 ? (Math.sign(m.vx) || dir) : dir;
  m.x += m.vx * dt; m.y += m.vy * dt;
  // (1.7) she flies through anything (no more getting stuck on the ground, a pillar or the edge of the arena):
  // the arena follows the fight, and if she ever ends up far away she blinks back next to you
  if (m.move !== 'intro') {
    const fs = bossFighters(m);
    if (fs.length) {
      let sx = 0, sy = 0; for (const q of fs) { sx += q.x + q.w / 2; sy += q.y + q.h - 0.5; } sx /= fs.length; sy /= fs.length;
      A.cx += (sx - A.cx) * Math.min(1, dt * 0.35); A.floor += (slSurf16(A.cx, sy) - A.floor) * Math.min(1, dt * 0.6);
    }
    const far = Math.hypot(pcx - (m.x + m.w / 2), pcy - (m.y + m.h / 2));
    if (far > 38 && (m.move === 'hover' || m.move === 'exhausted')) { m.x = pcx + m.side * 7 - m.w / 2; m.y = pcy - 7 - m.h / 2; m.vx = m.vy = 0; m.vis = 0; }
    if (m.move === 'hover' || m.move === 'swings') { const gy = ground(m.x + m.w / 2, m.y + m.h - 0.5); if (m.y + m.h > gy + 0.2 && gy > pcy - 30) m.vy = Math.min(m.vy, -6); }   // (rise out of the ground)
  }
  if (m.stuckChk == null) m.stuckChk = 0;
  m.stuckChk += dt; if (m.moveT > 12 && m.move !== 'hover') { m.vis = 1; go('hover'); m.cd = 0.3; }   // (no move ever lasts this long: unstick)
  if (m.vis > 0.5 && m.move !== 'intro' && m.move !== 'exhausted' && m.move !== 'worldend' && m.move !== 'dive') for (const q of victims) if (boxGap(m, q) < 0.1 && !(q.invuln > 0)) bossHitPlayer(MOB_TYPES.slayer.dmg, mcx, q, 0, { kb: [10, 5], iframes: 0.5 });
  m.wingSnd = (m.wingSnd || 0) - dt; if (m.wingSnd <= 0 && m.vis > 0.5) { m.wingSnd = m.move === 'dive' ? 0.3 : 0.9; sfx('ov.wings', { x: mcx, y: mcy, vol: 0.35, pitch: 1.4 }); }
  if (m.vis > 0.5 && Math.random() < dt * (ph >= 3 ? 10 : 4) * particleMul()) slFeather16(mcx + (Math.random() - 0.5) * 4, mcy + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.5, 0.5 + Math.random());
}
// she shatters into light: her soul is free
function slayerDying16(m, dt) {
  if (m.heartScene === undefined) m.heartScene = hardmode18() ? { t: 0 } : null;   // (a Hardmode rematch: no explosion, she gives you her heart)
  if (m.heartScene) { slayerHeartScene22(m, dt); return; }
  m.dying += dt; m.vx *= 0.9; m.vy = -0.4; m.x += m.vx * dt; m.y += m.vy * dt; m.hurtFlash = 0.1; m.vis = 1;
  if (m.dying < dt * 1.5) {
    slClear16(); sfx('ov.death', { x: m.x, y: m.y, pitch: 1.3 }); sfx('ov.scream', { x: m.x, y: m.y, pitch: 1.6 });
    eventMessage('The Slayer of Worlds is breaking apart...', '#e070ff');
    for (const x of Game.mobs) if (x.type === 'worldshade') { x.health = 0; killMob(x); }
  }
  m.boomT = (m.boomT || 0) - dt;
  if (m.boomT <= 0) { m.boomT = Math.max(0.05, 0.25 - m.dying * 0.04); voidBurst16(m.x + Math.random() * m.w, m.y + Math.random() * m.h, 18, Math.random() < 0.4); screenShake(0.2); }
  if (Math.random() < 0.7) slFeather16(m.x + m.w / 2 + (Math.random() - 0.5) * 6, m.y + m.h / 2 + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4, -1 - Math.random() * 2, Math.random() < 0.4 ? '#ffffff' : null);
  if (m.dying >= 5) {
    voidBurst16(m.x + m.w / 2, m.y + m.h / 2, 80, true);
    flashDamage(); screenShake(1.4); sfx('soul.free', { x: m.x, y: m.y }); sfx('ov.thunder', { x: m.x, y: m.y });
    SL16.whiteT = 1.4;
    finishMobDeath(m);
  }
}
// ---- events from her attacks (every game) ----
{
  const onOrig = slOnSpawn16;
  slOnSpawn16 = function (h) {
    onOrig(h);
    switch (h.t) {
      case 'shock':   // her landing: a crater
        if (!near17(h.x, h.gy)) break;
        if (h.dir > 0) {
          const x = h.x - 1.2, y = h.gy;
          ring17(x, y - 0.2, 7, 0.6, '255,120,255', 0.7, 0.3); ring17(x, y - 0.2, 4, 0.45, '255,255,255', 0.4, 0.3); ring17(x, y - 1.5, 5, 0.5, '210,74,255', 0.5);
          debris17(x, y - 0.3, 28, 14); shards17(x, y - 0.5, 16, 12, { up: true }); sparks17(x, y - 0.3, 40, 18, ['#ffffff', '#ff5af0', '#d24aff'], { dir: -Math.PI / 2, spread: 1.3, g: 14 });
          smoke17(x, y - 0.5, 14, 0.9, { sp: 4, dark: true }); decal17(x, y, 3.2, 10);
          zoom17(x, y - 1, 0.7); flash17(0.25, 0.6);
        }
        break;
      case 'mark':   // a rift opens where she will appear
        if (near17(h.x, h.y)) { sparks17(h.x, h.y, 10, 6, ['#ff5af0', '#ffffff']); }
        break;
      case 'ring':
        if (near17(h.x, h.y)) { ring17(h.x, h.y, 3, 0.3, '255,255,255', 0.6); sparks17(h.x, h.y, 18, 10, ['#ff5af0', '#d24aff']); }
        break;
      case 'vortex':
        if (near17(h.x, h.y)) { flash17(0, 0.5, 0); ring17(h.x, h.y, 6, 0.5, '0,0,0', 1.5); }
        break;
      case 'blast':
        bars17(5.5);
        break;
      case 'arc':
        break;
    }
  };
}
function slWatch17(dt, p) {
  const W = SLX.seen, b = slBoss16();
  if (SLX.death) slDeathTick17(dt);
  if (!b) { W.id = null; SLX.trail.length = 0; SLX.scr.speed = 0; return; }   // (1.0.1: she's gone (you died, she left): her trail goes with her)
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, vis = b.vis == null ? 1 : b.vis;
  if (W.id !== b.id) { SLX.trail.length = 0; Object.assign(W, { id: b.id, phase: b.phase || 1, vis, hp: b.health, dying: false, px: cx, py: cy }); SLX.intro = { age: 0, x: cx }; bars17(4.5); setTimeout(() => title17(SL_TITLES17[1][0], SL_TITLES17[1][1], '#e070ff', 4.5), 1800); }
  if ((b.phase || 1) > W.phase) {
    W.phase = b.phase;
    const T = SL_TITLES17[W.phase] || ['', ''];
    flash17(0.6, 1.4, 0.16); zoom17(cx, cy, 1); bars17(2.6); title17(T[0], T[1], W.phase >= 4 ? '#ff3a6a' : '#e070ff', 3.4);
    for (let i = 0; i < 3; i++) ring17(cx, cy, 14 + i * 8, 0.6 + i * 0.2, i === 1 ? '255,60,120' : '255,140,255', 1 - i * 0.2);
    shards17(cx, cy, 40, 20); sparks17(cx, cy, 90, 26, ['#ffffff', '#ff5af0', '#d24aff', '#ff3a6a'], { g: 3, lm: 1.4 }); embers17(cx, cy, 40, 10);
    for (let i = 0; i < 40; i++) slFeather16(cx + rnd17(-3, 3), cy + rnd17(-2, 2), rnd17(-8, 8), rnd17(-8, 3), Math.random() < 0.3 ? '#ffffff' : null);
  }
  if (W.vis > 0.5 && vis < 0.5 && b.dying == null) {   // gone: she implodes into a point of light
    sparks17(W.px, W.py, 26, 10, ['#ff5af0', '#ffffff', '#d24aff'], { g: 0 }); ring17(W.px, W.py, 2.5, 0.25, '255,255,255', 0.4);
    for (let i = 0; i < 18; i++) { const a = Math.random() * 6.283, r = rnd17(1.5, 3.5); px17({ t: 'ember', x: W.px + Math.cos(a) * r, y: W.py + Math.sin(a) * r, vx: 0, vy: 0, life: 0.3, size: 0.08, col: '255,140,255', g: 0, toX: W.px, toY: W.py }); }
  }
  if (W.vis < 0.5 && vis >= 0.5 && b.dying == null) { ring17(cx, cy, 4, 0.35, '255,140,255', 0.6); sparks17(cx, cy, 30, 14, ['#ffffff', '#ff5af0']); flash17(0, 0.4); }
  if (b.health < W.hp - 0.5 && b.dying == null && vis > 0.3) {   // her hit sparks (yours, and your friends')
    const d = W.hp - b.health;
    sparks17(cx + rnd17(-0.5, 0.5), cy + rnd17(-1, 1), 6 + Math.min(20, d / 6), 10, ['#ffffff', '#ff9af0', '#ff3a6a'], { g: 6 });
    ring17(cx, cy, 1.6 + Math.min(2, d / 40), 0.22, '255,255,255', 0.25);
    if (d > 60) flash17(0, 0.3);
  }
  W.hp = b.health;
  if (b.dying != null && !W.dying && !hardmode18()) { W.dying = true;   // (in Hardmode she doesn't shatter: she gives you her heart)
    SLX.death = { age: 0, x: cx, y: cy }; bars17(7); flash17(0.4, 1, 0.12); }
  // her trail when she moves fast, and the comet of her dive
  const sp = Math.hypot(cx - W.px, cy - W.py) / Math.max(dt, 0.001);
  const now = performance.now() / 1000;   // (1.0.1: real time, not the time of day, which jumps when you respawn or sleep and left her trail stuck on screen forever)
  if (vis > 0.5 && (sp > 11 || (b.phase || 1) >= 4)) SLX.trail.push({ x: cx, y: cy, t: now });
  while (SLX.trail.length && (now - SLX.trail[0].t > 0.32 || now < SLX.trail[0].t)) SLX.trail.shift();
  if (b.move === 'dive' && b.moveT > 0.8 && !b.hitDone) { SLX.scr.speed = 1; SLX.scr.speedX = cx; SLX.scr.speedY = cy; sparks17(cx, cy + 1, 3, 6, ['#ff5af0', '#ffffff'], { g: -2 }); }
  if (vis > 0.5 && Math.random() < dt * 20 * particleMul()) embers17(cx + rnd17(-1, 1), cy + rnd17(-1.5, 1.5), 1, 1.5);
  W.vis = vis; W.px = cx; W.py = cy;
  if (SLX.intro) SLX.intro.age += dt;
}
// her death: light breaks out of her, she shatters, and her soul rises
function slDeathTick17(dt) {
  const D = SLX.death; D.age += dt;
  const b = slBoss16(); if (b) { D.x = b.x + b.w / 2; D.y = b.y + b.h / 2; }
  if (Math.random() < dt * 30) sparks17(D.x, D.y, 3, 14, ['#ffffff', '#ffd0ff'], { g: 0 });
  if (D.age > 4.8 && !D.boom) {
    D.boom = 1; flash17(1.6, 1.8, 0.2); zoom17(D.x, D.y, 1.4);
    for (let i = 0; i < 4; i++) ring17(D.x, D.y, 20 + i * 10, 0.8 + i * 0.3, i % 2 ? '255,140,255' : '255,255,255', 1.2);
    shards17(D.x, D.y, 70, 26); sparks17(D.x, D.y, 160, 32, ['#ffffff', '#ff9af0', '#d24aff'], { g: 2, lm: 1.8 });
    for (let i = 0; i < 80; i++) slFeather16(D.x + rnd17(-2, 2), D.y + rnd17(-2, 2), rnd17(-12, 12), rnd17(-12, 4), Math.random() < 0.4 ? '#ffffff' : null);
    title17('HER SOUL IS FREE', 'the slayer of worlds has fallen', '#ffd8ff', 5.5);
  }
  if (D.age > 11) SLX.death = null;
}

// ---- VISUALS (her look, her wings and sword, and the screen-tearing effects of the fight) ----
B12.glow.push(function slRitualDraw16(ox, oy, glow) {
  const R = SLR16; if (!R) return;
  const cx = R.x + 0.5, cy = R.y - 1.5 - Math.min(3, R.t * 0.8), x = ox + cx * TILE, y = oy + cy * TILE, k = Math.min(1, R.t / 4);
  glow(x, y, TILE * (2 + k * 6), '210,60,255', 0.5 + 0.3 * Math.sin(Game.time * 12));
  // beams from the sky and from the pillars
  ctx.strokeStyle = `rgba(230,120,255,${0.35 + 0.4 * k})`; ctx.lineWidth = Math.max(2, TILE * 0.18 * (0.5 + k));
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(Game.time * 3) * TILE, 0); ctx.stroke();
  for (const P of [22, 40, 58]) for (const sg of [-1, 1]) {
    if (R.t < (P / 58) * 3) continue;
    const px = ox + (cx + sg * P) * TILE, py = oy + (R.y - 8) * TILE;
    ctx.strokeStyle = `rgba(255,70,140,${0.5 * k})`; ctx.lineWidth = Math.max(1.5, TILE * 0.1);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); glow(px, py, TILE * 1.6, '255,60,140', 0.5);
  }
  // the totem itself, spinning
  const ic = itemIcon[MYST_AWAKE]; if (ic) { ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.translate(x, y); ctx.scale(Math.cos(Game.time * 4), 1); ctx.imageSmoothingEnabled = false; ctx.drawImage(ic, -TILE * 0.6, -TILE * 0.6, TILE * 1.2, TILE * 1.2); ctx.restore(); }
});
function voidBurst16(x, y, n, big) {
  for (let i = 0; i < (n || 14) * particleMul() + 3; i++) { const a = Math.random() * 6.28, sp = 2 + Math.random() * (big ? 9 : 5); Game.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4 + Math.random() * 0.4, age: 0, size: 0.08 + Math.random() * 0.1, color: ['#ff5af0', '#d24aff', '#ff2a5a', '#2a0a30'][i % 4], gravity: 2, kind: i % 3 ? undefined : 'star' }); }
  flashAt(x, y, big ? 5 : 2.5, '220,80,255', big ? 0.25 : 0.12);
}
// during World End: an arrow to the nearest pillar of light
B12.post.push(function slSanctArrow16(ox, oy) {
  const p = Game.player; if (!p || p.dead || Game.screen === 'title') return;
  let best = null, bd = 1e9;
  for (const h of SL16.haz) if (h.t === 'sanct') { const d = Math.abs(h.x - (p.x + p.w / 2)); if (d < bd) { bd = d; best = h; } }
  if (!best || bd < best.r) return;
  const cx = ox + (p.x + p.w / 2) * TILE, cy = oy + (p.y + p.h / 2) * TILE, dx = best.x - (p.x + p.w / 2), dy = best.gy - 1 - (p.y + p.h / 2), ang = Math.atan2(dy, dx), R = TILE * 2.4, s2 = TILE * 0.6;
  ctx.save(); ctx.translate(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ctx.rotate(ang); ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Game.time * 12);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(s2 + 3, 0); ctx.lineTo(-s2 - 2, -s2 - 2); ctx.lineTo(-s2 * 0.3, 0); ctx.lineTo(-s2 - 2, s2 + 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(s2, 0); ctx.lineTo(-s2, -s2); ctx.lineTo(-s2 * 0.3, 0); ctx.lineTo(-s2, s2); ctx.closePath(); ctx.fill();
  ctx.restore();
});
// DUCK-style warnings
B12.post.push(function slWarn16() {
  const W = SL16.warnText; if (!W || Game.screen === 'title') return;
  const fs = Math.max(26, Math.round(VIEW.h / 10)), a = Math.min(1, W.t * 3), pulse = 1 + 0.06 * Math.sin(performance.now() / 50);
  ctx.save(); ctx.globalAlpha = a; ctx.font = `${Math.round(fs * pulse)}px "MC Title", "MC Title Alt", monospace`; ctx.textAlign = 'center';
  ctx.fillStyle = '#000'; ctx.fillText(W.text, VIEW.w / 2 + 4, VIEW.h * 0.3 + 4); ctx.fillStyle = W.col || '#ff5af0'; ctx.fillText(W.text, VIEW.w / 2, VIEW.h * 0.3);
  ctx.restore();
});
// (1.0.1) HER LOOK: a tall, grown-up warrior queen. A smaller, sharper face (narrow glowing eyes under
// smoky shadow, dark lips, side-swept bangs), long legs, armored shoulders, silver hair down past her dress,
// a horned tiara with a crimson bow, and a gothic battle dress (high collar, laced corset, layered skirt),
// long gloves and heeled boots.
const SL_PAL16 = {
  A: '#1c1220', a: '#2e2036', B: '#4a3658', P: '#d24aff', p: '#8a1ab0', R: '#c0142e', r: '#6a0a1a', Q: '#ff3a5a',
  S: '#f6e2de', s: '#dcbcc0', H: '#eee6f6', h: '#bcaad2', j: '#ffffff', E: '#ff4ad8', I: '#5a0a50',
  K: '#1e0818', V: '#a868c0', m: '#9a1a3a', G: '#ff7af8',
};
const SL_PAL16B = Object.assign({}, SL_PAL16, { H: '#b0a0c8', h: '#76648e', j: '#e8dcff', S: '#e6ccd2', s: '#c4a0b0', E: '#ff2a4a', I: '#5a0012', V: '#b04060', a: '#3a1a40', B: '#6a2a70' });   // phase 3+: what's left of her
const SL_GRID16 = {
  head: [   // 10 x 10: side-swept bangs, narrow eyes with lashes and smoky shadow, a straight nose, dark lips, a pointed chin
    '..hHHHHh..',
    '.hHjHHHHh.',
    'hHHHHHHHHh',
    'hHHHHHHhSh',
    'hHVVSSVVSh',
    'HKKKSSKKKH',
    'HSIESSEISH',
    'HSSSSsSSSH',
    'HhSSmmSShH',
    '.h.sSSs.h.',
  ],
  crown: [   // a horned tiara with a glowing gem
    '.A.........A.',
    '.AA...G...AA.',
    '..AA.APA.AA..',
    '..AAAAPAAAA..',
    '...APAGAPA...',
    '....AAAAA....',
  ],
  bow: ['RRr.rRR', 'RQRrRQR', 'RRRrRRR', '.rR.Rr.'],
  torso: [   // neck, a high crimson collar, armored shoulders, a laced corset, a belt with a gem, hips
    '.....SS.....',
    '....aRRa....',
    '..aAPRRPAa..',
    '.aABAPPABAa.',
    'aABBAAAABBAa',
    'aAAAAAAAAAAa',
    '.aAAAPPAAAa.',
    '.aAAPAAPAAa.',
    '..aAAPPAAa..',
    '..aApAApAa..',
    '...aAPPAa...',
    '...aAppAa...',
    '...aAPPAa...',
    '...aAppAa...',
    '..aRRRRRRa..',
    '..aRQGGQRa..',
    '.aAAAAAAAAa.',
    'aAAAAAAAAAAa',
  ],
  arm: ['aBa', 'ABA', 'AAA', 'aAa', 'aAa', 'aAa', 'aAa', 'aAa', 'aAa', 'aAa', 'aAa', 'aAa', 'PRP', 'AAA', 'ABA', 'AAA', 'AAA', 'ABA', 'AAA', 'AAA', 'aAa'],
  leg: ['aaa', 'aaa', 'aaa', 'aaa', 'aaa', 'aaa', 'aaa', 'aaa', 'aaa', 'aaa', 'aaa', 'aaa', 'aaa', 'aaa', 'PPP', 'AAA', 'ABA', 'AAA', 'AAA', 'ABA', 'AAA', 'AAA', 'ABA', 'AAA', 'AAA', 'ABA', 'AAA', 'PPP', 'AAA', 'AAA', 'AAAA', 'A.AA'],
};
SL_GRID16.headBlink = SL_GRID16.head.map((r, y) => y === 5 ? 'HSVVSSVVSH' : y === 6 ? 'HKKKSSKKKH' : r);   // (she blinks now and then)
SL_GRID16.hair = (() => {   // silver hair, flowing out behind her and down past the hem of her dress, ending in soft points
  const rows = [], W = 30, H = 52;
  const len = (x) => H - 1 - Math.abs((x % 6) - 2.5) * 2.6 - Math.abs(x + 0.5 - W / 2) * 0.35;
  for (let y = 0; y < H; y++) {
    let s = '';
    const hw = y < 4 ? 4 + y * 1.2 : y < 12 ? 8.4 : 8.4 + (y - 12) * 0.14;
    const c = W / 2 + Math.sin(y * 0.16) * 0.9 * (y / H);
    for (let x = 0; x < W; x++) {
      const d = Math.abs(x + 0.5 - c);
      if (d > hw || y > len(x)) { s += '.'; continue; }
      s += (y % 11 === 3 && x % 4 === 1) ? 'j' : ((x + Math.floor(y / 7)) % 5 === 0 ? 'h' : 'H');
    }
    rows.push(s);
  }
  return rows;
})();
SL_GRID16.locks = (() => {   // two long locks that fall in front of her shoulders
  const rows = [];
  for (let y = 0; y < 16; y++) {
    const w = y < 11 ? 2 : 1, lock = (y % 4 === 1 ? 'h' : 'H').repeat(w);
    rows.push(lock + '.'.repeat(12 - 2 * w) + lock);
  }
  return rows;
})();
SL_GRID16.skirt = (() => {   // black outer layers, a crimson underskirt, purple trim down the front slit, a tattered hem
  const rows = [], W = 32, c = W / 2;
  for (let y = 0; y < 27; y++) {
    let s = '';
    const hw = 5.5 + y * 0.38;
    for (let x = 0; x < W; x++) {
      const d = Math.abs(x + 0.5 - c);
      if (d > hw) { s += '.'; continue; }
      if (y > 9 && d < 0.6 + (y - 9) * 0.13) { s += '.'; continue; }
      if (y > 21 && ((x * 13 + 7) % 6) < (y - 21)) { s += '.'; continue; }
      if (y > 9 && d < 1.7 + (y - 9) * 0.13) { s += 'P'; continue; }
      s += d > hw - 2 ? ((x + y) % 5 === 0 ? 'a' : 'A') : y > 19 ? (y > 22 ? 'Q' : 'R') : d < hw * 0.55 ? (x % 3 ? 'R' : 'r') : 'A';
    }
    rows.push(s);
  }
  return rows;
})();
const SL_SCALE16 = 1.3;
const SL_HALO16 = { y: -38, r: 9 };          // (her halo, behind her head)
const SL_SHOULDER16 = { x: 6.5, y: -22, arm: 19.5 };
function slPart16(n, ph) { return part14('slayer' + (ph >= 3 ? 'B' : '') + '.' + n, SL_GRID16[n], ph >= 3 ? SL_PAL16B : SL_PAL16, { flat: n === 'head' || n === 'headBlink' ? 'EGKIVmjSs' : 'EG' }); }
// her pose this frame (the same numbers draw her body and her glow)
function slPose16(m) {
  const t = Game.time, mv = m.move, mt = m.moveT || 0, ph = m.phase || 1;
  if (m.swN !== m._swN) { m._swN = m.swN; m._swT0 = t; m._swD = m.swD || 1; }
  let bob = mv === 'exhausted' ? 3 : Math.sin(t * 2.2 + 1) * 1.6;
  let flap = Math.sin(t * (mv === 'dive' ? 8 : ph >= 4 ? 5 : 3)) * 0.5, wingK = ph >= 3 ? 1.3 : 1, bd = 1.2 + Math.sin(t * 1.3) * 0.06;
  const sk = (t - (m._swT0 || -9)) / 0.17;
  const raised = mv === 'split' || mv === 'meteors' || mv === 'worldend' || mv === 'transform' || mv === 'minions' || mv === 'rings' || (mv === 'intro' && mt > 3);
  if (raised) { bd = -1.57 + Math.sin(t * 3) * 0.08; flap = mv === 'worldend' ? 0.9 + Math.sin(t * 9) * 0.1 : flap; }
  else if (mv === 'spiral') bd = t * 14;
  else if (mv === 'shatter') bd = m.hitDone ? 1.62 : -1.7;
  else if (mv === 'dive' && mt > 0.8 && !m.hitDone) { bd = 0.7; flap = -0.85; }
  else if (mv === 'exhausted') { bd = 1.5; flap = -0.6; wingK *= 0.85; }
  if (sk < 1) { const k = 1 - Math.pow(1 - sk, 2); bd = m._swD > 0 ? -1.9 + 3.6 * k : 1.7 - 3.6 * k; }
  else if (sk < 2.4 && !raised) { const k = (sk - 1) / 1.4; const end = m._swD > 0 ? 1.7 : -1.9; bd = end + (bd - end) * k; }
  const armF = Math.max(-3, Math.min(1.2, (bd - Math.PI / 2) * 0.75));
  const armB = raised ? -0.5 : 0.22 + Math.sin(t * 1.7) * 0.05;
  const Sh = SL_SHOULDER16, hx = Sh.x - Math.sin(armF) * Sh.arm, hy = Sh.y + Math.cos(armF) * Sh.arm;
  const legF = Math.sin(t * 1.9) * 0.08 + (mv === 'dive' ? -0.3 : 0), legB = -Math.sin(t * 1.9 + 0.5) * 0.08 + (mv === 'dive' ? -0.4 : 0);
  return { bob, flap, wingK, bd, armF, armB, hx, hy, legF, legB, ph };
}
// a feathered wing, from the shoulder blade at (side*4, -12)
function slWingGeo16(side, flap, k) {
  const rx = side * 4, ry = -19, bA = -0.72 - flap * 0.45, bdx = Math.cos(bA) * side, bdy = Math.sin(bA), BL = 30 * k, F = [];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const f = i / (N - 1), bl = BL * (1 - f * 0.85), bx = rx + bdx * bl, by = ry + bdy * bl;
    const ang = (-1.05 + f * 2.15) - flap * 0.35 + 0.06 * Math.sin(Game.time * 3 + i), L = (44 - f * 14) * k * (0.9 + 0.2 * ((i * 37 % 10) / 10));
    F.push({ bx, by, dx: Math.cos(ang) * side, dy: Math.sin(ang), L, w: 7 * k });
  }
  return { rx, ry, bdx, bdy, BL, F };
}
function slWing16(b, side, flap, k, ph) {
  const G = slWingGeo16(side, flap, k);
  const edge = ph >= 3 ? '#ff2a4a' : '#b0122e', hot = ph >= 3 ? '#ffb0c0' : '#ff3a5a';
  for (let i = G.F.length - 1; i >= 0; i--) {
    const f = G.F[i], nx = -f.dy, ny = f.dx, L = f.L, w = f.w;
    const pt = (t, o) => [f.bx + f.dx * L * t + nx * w * o, f.by + f.dy * L * t + ny * w * o];
    poly14(b, [...pt(0, 0.5), ...pt(0.7, 0.45), ...pt(1, 0), ...pt(0.82, -0.2), ...pt(0.64, -0.5), ...pt(0, -0.5)], i % 2 ? '#1e0a24' : '#2c0f32');
    poly14(b, [...pt(0.32, -0.5), ...pt(0.64, -0.5), ...pt(1, 0), ...pt(0.8, -0.05), ...pt(0.5, -0.22)], edge);
    line14(b, ...pt(0.55, -0.5), ...pt(1, 0), hot, 1);
  }
  for (let i = G.F.length - 1; i >= 0; i -= 2) {   // a second, shorter layer fills the gaps
    const f = G.F[i], nx = -f.dy, ny = f.dx, L = f.L * 0.62, w = f.w * 1.1;
    const pt = (t, o) => [f.bx + f.dx * L * t + nx * w * o, f.by + f.dy * L * t + ny * w * o];
    poly14(b, [...pt(0, 0.5), ...pt(0.75, 0.4), ...pt(1, 0), ...pt(0.7, -0.5), ...pt(0, -0.5)], '#24092a');
    line14(b, ...pt(0.6, -0.5), ...pt(1, 0), edge, 1);
  }
  for (let j = 0; j < 8; j++) {   // the coverts, over the top
    const f = j / 7, bl = G.BL * (0.95 - f * 0.8), bx = G.rx + G.bdx * bl, by = G.ry + G.bdy * bl, ang = (-0.25 + f * 1.4) - flap * 0.35;
    const dx = Math.cos(ang) * side, dy = Math.sin(ang), L = (15 + 5 * Math.sin(j * 1.7)) * k, nx = -dy, ny = dx, w = 4 * k;
    poly14(b, [bx + nx * w / 2, by + ny * w / 2, bx + dx * L, by + dy * L, bx - nx * w / 2, by - ny * w / 2], '#301038');
    line14(b, bx - nx * w / 2, by - ny * w / 2, bx + dx * L, by + dy * L, ph >= 3 ? '#a02a90' : '#4a1858', 1);
  }
  line14(b, G.rx, G.ry, G.rx + G.bdx * G.BL, G.ry + G.bdy * G.BL, '#140810', 3);
}
function slSword16(b, hx, hy, bd, ph) {
  const ux = Math.cos(bd), uy = Math.sin(bd), nx = -uy, ny = ux;
  const P = (t, o) => [hx + ux * t + nx * o, hy + uy * t + ny * o];
  const poly = (pts, col) => poly14(b, pts.flat(), col);
  poly([P(-6, -0.9), P(3, -0.9), P(3, 0.9), P(-6, 0.9)], '#2a1030');
  poly([P(-9.5, 0), P(-6, -1.5), P(-6, 1.5)], '#d24aff');
  for (const sg of [-1, 1]) {
    poly([P(3.2, sg * 2.4), P(5.2, sg * 2.4), P(4.6, sg * 9), P(3.4, sg * 9.6)], '#8a1ab0');
    poly([P(4.5, sg * 8.8), P(3.9, sg * 12), P(3.3, sg * 9.2)], '#ff3a5a');
  }
  const [rx, ry] = P(4.3, 0);
  for (let i = 0; i < 16; i++) { const a0 = i / 16 * 6.283, a1 = (i + 1) / 16 * 6.283; line14(b, rx + Math.cos(a0) * 3.3, ry + Math.sin(a0) * 3.3, rx + Math.cos(a1) * 3.3, ry + Math.sin(a1) * 3.3, '#e070ff', 1.4); }
  const L = 38 * (ph >= 3 ? 1.12 : 1), w0 = 2.5;
  poly([P(7.5, -w0), P(7.5 + L * 0.85, -w0 * 0.55), P(7.5 + L, 0), P(7.5 + L * 0.85, w0 * 0.55), P(7.5, w0)], '#a838f0');
  poly([P(7.5, -w0 * 0.35), P(7.5 + L * 0.9, -0.25), P(7.5 + L * 0.97, 0), P(7.5 + L * 0.9, 0.25), P(7.5, w0 * 0.35)], '#ff2a5a');
  line14(b, ...P(7.5, -w0), ...P(7.5 + L * 0.85, -w0 * 0.55), '#f4c8ff', 1);
  for (const sg of [-1, 1]) { const [sx, sy] = P(7, sg * w0); px14(b, sx, sy, 1, 1, '#ff3a5a'); }
  return L;
}
MOB_DRAW.slayer = (g, m, u) => {
  let vis = m.vis == null ? 1 : Math.max(0, Math.min(1, m.vis));
  if (m.sink22) vis *= Math.max(0, 1 - (performance.now() - m.sink22) / 3200);   // (sinking into her altar, on a friend's screen)
  if (vis <= 0.03) return;
  const P = slPose16(m), ph = P.ph;
  g.save(); g.globalAlpha *= vis;
  u *= SL_SCALE16;
  if (ph >= 4 && m.move !== 'exhausted') {   // afterimages: she moves too fast to see
    const t = Game.time;
    for (let k = 1; k <= 1; k++) { g.save(); g.globalAlpha *= 0.2; g.translate(-Math.sin(t * 9 + k) * u * 6 * k, 0); rig14(g, u, 230, 170, 115, 120, b => slBody16(b, m, P, ph), { ol: '#3a0040' }); g.restore(); }
  }
  rig14(g, u, 230, 170, 115, 120, b => slBody16(b, m, P, ph), { ol: '#0a0408' });
  g.restore();
};
function slBody16(b, m, P, ph) {
  const t = Game.time, Hy = SL_HALO16.y, Hr = SL_HALO16.r, Sh = SL_SHOULDER16;
  b.translate(0, P.bob);
  for (const side of [-1, 1]) slWing16(b, side, P.flap, P.wingK, ph);
  for (let i = 0; i < 24; i++) { const a0 = i / 24 * 6.283, a1 = (i + 1) / 24 * 6.283; line14(b, Math.cos(a0) * Hr, Hy + Math.sin(a0) * Hr, Math.cos(a1) * Hr, Hy + Math.sin(a1) * Hr, '#6a1a80', 1.5); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + 0.2; line14(b, Math.cos(a) * Hr, Hy + Math.sin(a) * Hr, Math.cos(a) * (Hr + 3), Hy + Math.sin(a) * (Hr + 3), '#4a1060', 1); }
  drawP14(b, slPart16('hair', ph), 0, -35, 15, 0, 1, Math.sin(t * 1.4) * 0.03);   // (her hair sways)
  DK14 = 0.62; drawP14(b, slPart16('arm', ph), -Sh.x, Sh.y, 1, 0, 1, P.armB); DK14 = 0;
  const leg = slPart16('leg', ph);
  DK14 = 0.8; drawP14(b, leg, -2, -2, 1, 0, 1, P.legB); DK14 = 0;
  drawP14(b, leg, 2, -2, 1, 0, 1, P.legF);
  drawP14(b, slPart16('skirt', ph), 0, -9, 16, 0, 1);
  drawP14(b, slPart16('torso', ph), 0, -25, 6, 0, 1);
  drawP14(b, slPart16('locks', ph), 0, -29, 6, 0, 1, Math.sin(t * 1.4 + 0.6) * 0.02);
  const blink = (t % 4.3) < 0.13 && m.move !== 'exhausted';
  drawP14(b, slPart16(blink ? 'headBlink' : 'head', ph), 0, -25, 5, 9, 1);
  drawP14(b, slPart16('bow', ph), -4.5, -33, 3, 2, 1, -0.35);
  drawP14(b, slPart16('crown', ph), 0, -33, 6, 5, 1);
  if (ph >= 3) { line14(b, -4, -28, -4, -26, '#ff3aa0', 1); line14(b, 3, -28, 4, -26, '#ff3aa0', 1); }   // cracks of light
  drawP14(b, slPart16('arm', ph), Sh.x, Sh.y, 1, 0, 1, P.armF);
  slSword16(b, P.hx, P.hy, P.bd, ph);
}
// the glow: her halo, her eyes, her blade, the edges of her wings (drawn after the dark, so you always see her)
B12.glow.push(function slGlow16(ox, oy, glow) {
  const b = slBoss16(); if (!b) return;
  const vis = b.vis == null ? 1 : Math.max(0, Math.min(1, b.vis)); if (vis <= 0.03) return;
  const P = slPose16(b), u = TILE / 16 * SL_SCALE16, f = b.facingDir || 1, bx = ox + (b.x + b.w / 2) * TILE, by = oy + (b.y + b.h / 2) * TILE, t = Game.time;
  const S = (gx, gy) => [bx + f * gx * u, by + (gy + P.bob) * u];
  glow(bx, by, TILE * (P.ph >= 3 ? 5.5 : 4), P.ph >= 3 ? '255,40,90' : '190,50,255', 0.22 * vis);
  const [hx, hy] = S(0, SL_HALO16.y);
  ctx.strokeStyle = `rgba(255,120,255,${0.85 * vis})`; ctx.lineWidth = Math.max(2, u * 1.3); ctx.beginPath(); ctx.arc(hx, hy, SL_HALO16.r * u, 0, 6.283); ctx.stroke();
  ctx.strokeStyle = `rgba(255,230,255,${0.7 * vis})`; ctx.lineWidth = Math.max(1, u * 0.5); ctx.beginPath(); ctx.arc(hx, hy, SL_HALO16.r * u, 0, 6.283); ctx.stroke();
  glow(hx, hy, 15 * u, '230,80,255', 0.35 * vis);
  const [sx, sy] = S(0, SL_HALO16.y - SL_HALO16.r - 3), sp = (5 + Math.sin(t * 6) * 1.5) * u;   // the star on her crown
  ctx.strokeStyle = `rgba(255,240,255,${0.9 * vis})`; ctx.lineWidth = Math.max(1, u * 0.7); ctx.beginPath(); ctx.moveTo(sx - sp, sy); ctx.lineTo(sx + sp, sy); ctx.moveTo(sx, sy - sp * 1.4); ctx.lineTo(sx, sy + sp * 1.4); ctx.stroke();
  glow(sx, sy, sp * 2, '255,150,255', 0.6 * vis);
  for (const ex of [-2, 2]) { const [ex2, ey2] = S(ex, -27.6); glow(ex2, ey2, 1.8 * u, P.ph >= 3 ? '255,40,60' : '255,80,220', 0.75 * vis); }
  // the blade
  const ux = Math.cos(P.bd), uy = Math.sin(P.bd), L = 38 * (P.ph >= 3 ? 1.12 : 1);
  const [b0x, b0y] = S(P.hx + ux * 7.5, P.hy + uy * 7.5), [b1x, b1y] = [b0x + f * ux * L * u, b0y + uy * L * u];
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(200,80,255,${0.45 * vis})`; ctx.lineWidth = u * 5; ctx.beginPath(); ctx.moveTo(b0x, b0y); ctx.lineTo(b1x, b1y); ctx.stroke();
  ctx.strokeStyle = `rgba(255,200,255,${0.8 * vis})`; ctx.lineWidth = Math.max(1, u * 1.2); ctx.beginPath(); ctx.moveTo(b0x, b0y); ctx.lineTo(b1x, b1y); ctx.stroke();
  for (let k = 0; k <= 4; k++) glow(b0x + (b1x - b0x) * k / 4, b0y + (b1y - b0y) * k / 4, 6 * u, '220,70,255', 0.3 * vis);
  const [rx, ry] = S(P.hx + ux * 4.3, P.hy + uy * 4.3); glow(rx, ry, 6 * u, '255,90,255', 0.6 * vis);
  if (Math.random() < 0.3) Game.particles.push({ x: (b0x + (b1x - b0x) * Math.random() - ox) / TILE, y: (b0y + (b1y - b0y) * Math.random() - oy) / TILE, vx: (Math.random() - 0.5), vy: -0.5, life: 0.5, age: 0, size: 0.06, color: Math.random() < 0.5 ? '#ff3a5a' : '#ff9af0', gravity: 0, kind: 'star' });
  if (P.ph >= 3) for (const side of [-1, 1]) {   // her wings burn at the edges
    const G = slWingGeo16(side, P.flap, P.wingK);
    for (let i = 0; i < G.F.length; i += 3) { const F = G.F[i], [wx, wy] = S(F.bx + F.dx * F.L, F.by + F.dy * F.L); glow(wx, wy, 7 * u, '255,40,80', 0.5 * vis); }
  }
});
// her feathers
SL16.feathers = [];
function slFeather16(x, y, vx, vy, col) { if (SL16.feathers.length < 160) SL16.feathers.push({ x, y, vx, vy, age: 0, life: 2 + Math.random(), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6, col: col || (Math.random() < 0.55 ? '#2a0f32' : '#c0142e') }); }
B12.updaters.push(function slFeathers16(dt) {
  const F = SL16.feathers;
  for (let i = F.length - 1; i >= 0; i--) { const f = F[i]; f.age += dt; f.vy = Math.min(1.6, f.vy + dt * 2); f.vx *= 1 - dt; f.x += (f.vx + Math.sin(f.age * 3 + f.rot)) * dt; f.y += f.vy * dt; f.rot += f.vr * dt; if (f.age > f.life) F.splice(i, 1); }
});
// the world around her: phase 3 it turns strange, phase 4 there is nothing left but you and her
B12.pre.push(function slWorld16(ox, oy) {
  for (const f of SL16.feathers) {
    const x = ox + f.x * TILE, y = oy + f.y * TILE, s = TILE / 16, a = 1 - f.age / f.life;
    ctx.save(); ctx.translate(x, y); ctx.rotate(f.rot); ctx.globalAlpha = a; ctx.fillStyle = f.col; ctx.fillRect(-s, -3.5 * s, 2 * s, 7 * s); ctx.fillStyle = '#ff3a5a'; ctx.fillRect(-s, 1.5 * s, 2 * s, 2 * s); ctx.restore();
  }
  for (const h of SL16.haz) if (h.t === 'vortex' && h.age < h.dur + 0.4) {   // the black hole at the middle of the spiral
    const x = ox + h.x * TILE, y = oy + h.y * TILE, k = Math.min(1, h.age * 3) * Math.min(1, (h.dur + 0.4 - h.age) * 2), r = TILE * 1.6 * k;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2); gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(0.45, 'rgba(10,0,16,0.9)'); gr.addColorStop(1, 'rgba(10,0,16,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  }
  const b = slBoss16(); if (!b || !bossOnMyScreen(b)) return;
  const ph = b.phase || 1, t = Game.time;
  if (ph >= 3 && b.dying == null) {
    ctx.fillStyle = `rgba(70,0,40,${ph >= 4 ? 0.1 : 0.22 + 0.05 * Math.sin(t * 2)})`; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.strokeStyle = 'rgba(255,60,160,0.22)'; ctx.lineWidth = 2;   // the sky is cracking
    for (let i = 0; i < 5; i++) { let x = ((i * 397 + 123) % 1000) / 1000 * VIEW.w, y = 0; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (((i * 31 + k * 17) % 13) - 6) * 6; y += VIEW.h * 0.06; ctx.lineTo(x, y); } ctx.stroke(); }
  }
  if (ph >= 4 && b.dying == null) {
    const p = Game.player, pts = [[ox + (b.x + b.w / 2) * TILE, oy + (b.y + b.h / 2) * TILE, TILE * 7]];
    if (p) pts.push([ox + (p.x + p.w / 2) * TILE, oy + (p.y + p.h / 2) * TILE, TILE * 6]);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, VIEW.w, VIEW.h);
    for (const [x, y, r] of pts) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.283); }
    ctx.fillStyle = 'rgba(6,0,10,0.9)'; ctx.fill('evenodd');
    for (const [x, y, r] of pts) { const gr = ctx.createRadialGradient(x, y, r * 0.55, x, y, r); gr.addColorStop(0, 'rgba(6,0,10,0)'); gr.addColorStop(1, 'rgba(6,0,10,0.9)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < 40; i++) { const x = ((i * 733 + Math.floor(t * 20) * (i % 3)) % 1000) / 1000 * VIEW.w, y = ((i * 547 + t * 30 * (1 + i % 4)) % VIEW.h); ctx.fillStyle = i % 3 ? 'rgba(210,74,255,0.6)' : 'rgba(255,58,90,0.6)'; ctx.fillRect(x, VIEW.h - y, 2, 2); }
  }
});
B12.post.push(function slWhite16() {
  if (!(SL16.whiteT > 0) || Game.screen === 'title') return;
  ctx.fillStyle = `rgba(255,240,255,${Math.min(1, SL16.whiteT)})`; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
});
const SLX = { p: [], decals: [], tears: [], trail: [], scr: { ca: 0, inv: 0, white: 0, zooms: [], bars: 0, barsT: 0, vig: 0, speed: 0, speedX: 0, speedY: 0 }, title: null, seen: {}, death: null, intro: null };
const SLX_MAX = 1400;
const rnd17 = (a, b) => a + Math.random() * (b - a);
function px17(o) { if (SLX.p.length < SLX_MAX * bossFxMul18()) SLX.p.push(Object.assign({ age: 0, life: 1, vx: 0, vy: 0, g: 0, drag: 0, rot: 0, vr: 0 }, o)); }
function sparks17(x, y, n, sp, cols, o) {
  n = Math.round(n * Math.max(0.3, particleMul()));
  for (let i = 0; i < n; i++) { const a = (o && o.dir != null ? o.dir + rnd17(-(o.spread || 0.6), o.spread || 0.6) : Math.random() * 6.283), s = sp * rnd17(0.35, 1); px17({ t: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd17(0.25, 0.6) * (o && o.lm || 1), col: cols[i % cols.length], w: rnd17(0.04, 0.09) * (o && o.wm || 1), g: o && o.g != null ? o.g : 9, drag: 1.6 }); }
}
function shards17(x, y, n, sp, o) {
  n = Math.round(n * Math.max(0.4, particleMul()));
  for (let i = 0; i < n; i++) { const a = o && o.up ? rnd17(-Math.PI * 0.95, -Math.PI * 0.05) : Math.random() * 6.283, s = sp * rnd17(0.4, 1); px17({ t: 'shard', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o && o.up ? 2 : 0), life: rnd17(0.9, 1.8), size: rnd17(0.12, 0.32) * (o && o.sm || 1), rot: Math.random() * 6, vr: rnd17(-12, 12), g: 22, bounce: 1, hue: Math.random() < 0.7 ? 0 : 1 }); }
}
function debris17(x, y, n, sp) {
  n = Math.round(n * Math.max(0.4, particleMul()));
  for (let i = 0; i < n; i++) { const a = rnd17(-Math.PI * 0.92, -Math.PI * 0.08), s = sp * rnd17(0.3, 1); px17({ t: 'rock', x: x + rnd17(-0.5, 0.5), y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd17(1, 2), size: rnd17(0.12, 0.3), rot: Math.random() * 6, vr: rnd17(-8, 8), g: 26, bounce: 2, col: ['#2a1a30', '#3a2448', '#1a0e20', '#4a2a50'][i % 4] }); }
}
function smoke17(x, y, n, sz, o) {
  n = Math.round(n * Math.max(0.4, particleMul()));
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = rnd17(0.3, 1) * (o && o.sp || 2); px17({ t: 'smoke', x: x + rnd17(-0.4, 0.4), y: y + rnd17(-0.3, 0.3), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - rnd17(0.3, 1.2), life: rnd17(1.2, 2.4), size: sz * rnd17(0.6, 1.2), g: -0.4, drag: 1.2, dark: o && o.dark }); }
}
function embers17(x, y, n, sp) {
  n = Math.round(n * Math.max(0.3, particleMul()));
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = sp * rnd17(0.2, 1); px17({ t: 'ember', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: rnd17(0.8, 2), size: rnd17(0.04, 0.1), g: -0.6, drag: 1.4, col: Math.random() < 0.5 ? '255,80,200' : Math.random() < 0.5 ? '210,74,255' : '255,60,90' }); }
}
function ring17(x, y, max, life, col, w, sq) { px17({ t: 'ring', x, y, max, life, col, w: w || 0.5, sq: sq || 1 }); }
function decal17(x, gy, w, life) { SLX.decals.push({ x, gy, w, age: 0, life: life || 9, seed: Math.random() * 100 }); if (SLX.decals.length > 50) SLX.decals.shift(); }
function flash17(white, ca, inv) { const S = SLX.scr; S.white = Math.max(S.white, white || 0); S.ca = Math.max(S.ca, ca || 0); S.inv = Math.max(S.inv, inv || 0); }
function zoom17(x, y, a) { SLX.scr.zooms.push({ x, y, a, age: 0, life: 0.35 }); if (SLX.scr.zooms.length > 4) SLX.scr.zooms.shift(); }
function near17(x, y, r) { const p = Game.player; return p && Math.hypot(p.x - x, p.y - y) < (r || 70); }
function bars17(t) { SLX.scr.barsT = Math.max(SLX.scr.barsT, t); }
function title17(big, small, col, life) { SLX.title = { big, small, col: col || '#e070ff', age: 0, life: life || 4 }; }
// the per-frame side of her attacks: sparks off her blade, crystals growing, the rip firing...
B12.updaters.push(function slFx17(dt, p) {
  const S = SLX.scr;
  for (const h of SL16.haz) {
    if (h._f == null) h._f = {};
    const F = h._f;
    switch (h.t) {
      case 'arc': {
        if (h.age >= h.warn && h.age <= h.warn + h.dur) {
          const k = Math.min(1, (h.age - h.warn) / Math.max(0.05, h.dur)), a = h.a - h.sw + h.sw * 2 * k;
          const ex = h.x + Math.cos(a) * h.r, ey = h.y + Math.sin(a) * h.r;
          if (Math.random() < 0.9) sparks17(ex, ey, 3, 9, ['#ffffff', '#ff8af8', '#ff3a6a'], { dir: a + Math.PI / 2, spread: 0.5, g: 6 });
          if (!F.whoosh) { F.whoosh = 1; if (near17(h.x, h.y, 30)) Game.shake = Math.min(1.4, Game.shake + 0.08 * Settings.shake / 100); }
        }
        break;
      }
      case 'shock': {
        if (h.fx == null) break;
        F.d = (F.d || 0) + dt;
        if (F.d > 0.06) { F.d = 0; debris17(h.fx, h.fgy - 0.2, 2, 7); sparks17(h.fx, h.fgy - 0.3, 3, 7, ['#ff5af0', '#ffffff'], { dir: -Math.PI / 2, spread: 0.8, g: 12 }); }
        F.c = (F.c || 0) + dt; if (F.c > 0.12) { F.c = 0; decal17(h.fx, h.fgy, 0.7, 6); }
        break;
      }
      case 'pillar': {
        if (!h.up && Math.random() < dt * 25) px17({ t: 'ember', x: h.x + rnd17(-0.9, 0.9), y: h.gy - 0.1, vx: 0, vy: -rnd17(1, 3), life: 0.6, size: 0.05, col: '255,90,220', g: 0 });
        if (h.up && !F.up) {
          F.up = 1;
          if (near17(h.x, h.gy)) { debris17(h.x, h.gy - 0.2, 10, 11); sparks17(h.x, h.gy - 1, 16, 14, ['#ffffff', '#ff5af0', '#d24aff'], { dir: -Math.PI / 2, spread: 0.5, g: 8 }); ring17(h.x, h.gy - 0.1, 3, 0.4, '255,140,255', 0.5, 0.3); decal17(h.x, h.gy, 1.4, 8); Game.shake = Math.min(1.4, Game.shake + 0.12 * Settings.shake / 100); }
        }
        if (h.up && !F.shat && h.age > h.warn + h.dur - 0.14) { F.shat = 1; if (near17(h.x, h.gy)) { shards17(h.x, h.gy - h.h * 0.4, 14, 9); sparks17(h.x, h.gy - h.h * 0.5, 12, 8, ['#ff9af0', '#ffffff']); } }
        break;
      }
      case 'line': {
        if (!h.fired && Math.random() < dt * 40) { const q = Math.random(), x = h.x0 + (h.x1 - h.x0) * q, y = h.y0 + (h.y1 - h.y0) * q; px17({ t: 'ember', x: x + rnd17(-2, 2), y: y + rnd17(-2, 2), vx: 0, vy: 0, life: 0.4, size: 0.05, col: '255,120,240', g: 0, toX: x, toY: y }); }
        if (h.fired && !F.fired) {
          F.fired = 1;
          SLX.tears.push({ x0: h.x0, y0: h.y0, x1: h.x1, y1: h.y1, age: 0, life: 0.55 });
          const L = Math.hypot(h.x1 - h.x0, h.y1 - h.y0);
          for (let i = 0; i < L; i += 1.5) { const q = i / L, x = h.x0 + (h.x1 - h.x0) * q, y = h.y0 + (h.y1 - h.y0) * q; if (Math.random() < 0.5) sparks17(x, y, 2, 12, ['#ffffff', '#ff5af0', '#ff3a6a']); if (solidAt(Math.floor(x), Math.floor(y))) { if (Math.random() < 0.4) debris17(x, y - 0.5, 2, 8); } }
          flash17(0.2, 0.9, 0); zoom17((h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2, 0.5);
        }
        break;
      }
      case 'meteor': {
        if (h.mx != null && !h.hit && Math.random() < 0.8) { sparks17(h.mx, h.my, 2, 5, ['#ff5af0', '#ffffff'], { g: 2 }); embers17(h.mx, h.my, 1, 2); }
        if (h.hit && !F.hit) {
          F.hit = 1;
          if (near17(h.x, h.gy)) { ring17(h.x, h.gy - 0.2, 5, 0.5, '255,140,255', 0.6, 0.35); ring17(h.x, h.gy - 1, 3.5, 0.35, '255,255,255', 0.5); shards17(h.x, h.gy - 0.6, 18, 13, { up: true }); debris17(h.x, h.gy - 0.3, 16, 12); smoke17(h.x, h.gy - 0.8, 8, 1, { sp: 3, dark: true }); decal17(h.x, h.gy, 2.4, 9); zoom17(h.x, h.gy - 1, 0.35); flash17(0.08, 0.35); }
        }
        break;
      }
      case 'vortex': {
        if (h.age < h.dur) for (let i = 0; i < 6 * particleMul(); i++) { const a = Math.random() * 6.283, r = rnd17(4, h.R * 0.9); px17({ t: 'ember', x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r * 0.85, vx: 0, vy: 0, life: rnd17(0.6, 1.1), size: rnd17(0.04, 0.09), col: Math.random() < 0.5 ? '255,80,220' : '200,120,255', g: 0, orbit: { cx: h.x, cy: h.y, a, r, sp: rnd17(3, 6) } }); }
        break;
      }
      case 'sanct': {
        if (Math.random() < dt * 30) px17({ t: 'ember', x: h.x + rnd17(-h.r, h.r), y: h.gy - 0.2, vx: 0, vy: -rnd17(2, 5), life: 1.2, size: rnd17(0.04, 0.08), col: '255,250,255', g: 0 });
        break;
      }
      case 'blast': {
        if (!h.fired) {
          const k = h.age / h.warn;
          S.vig = Math.max(S.vig, 0.3 + k * 0.6);
          for (let i = 0; i < 4 * particleMul(); i++) { const a = Math.random() * 6.283, r = rnd17(10, 22); px17({ t: 'ember', x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 1.3, vy: -Math.sin(a) * r * 1.3, life: 0.7, size: rnd17(0.05, 0.1), col: Math.random() < 0.5 ? '255,255,255' : '255,120,240', g: 0 }); }
          if (Math.random() < dt * 6) Game.shake = Math.min(1.4, Game.shake + 0.05 + k * 0.1);
        } else if (!F.fired) {
          F.fired = 1;
          flash17(1.3, 1.6, 0.15); zoom17(h.x, h.y, 1.2);
          for (let i = 0; i < 4; i++) ring17(h.x, h.y, 18 + i * 9, 0.7 + i * 0.25, i % 2 ? '255,90,220' : '255,255,255', 1.2 - i * 0.2);
          shards17(h.x, h.y, 50, 24); sparks17(h.x, h.y, 120, 30, ['#ffffff', '#ff5af0', '#d24aff', '#ff3a6a'], { lm: 1.6, wm: 1.5, g: 4 }); embers17(h.x, h.y, 60, 14); smoke17(h.x, h.y, 20, 1.6, { sp: 9, dark: true });
        }
        break;
      }
    }
  }
  // particles
  for (let i = SLX.p.length - 1; i >= 0; i--) {
    const q = SLX.p[i]; q.age += dt;
    if (q.age >= q.life) { SLX.p.splice(i, 1); continue; }
    if (q.orbit) { const O = q.orbit; O.a += O.sp * dt * (6 / Math.max(1, O.r)); O.r = Math.max(0.3, O.r - dt * (4 + 14 / Math.max(1, O.r))); q.x = O.cx + Math.cos(O.a) * O.r; q.y = O.cy + Math.sin(O.a) * O.r * 0.85; continue; }
    if (q.toX != null) { q.x += (q.toX - q.x) * Math.min(1, dt * 8); q.y += (q.toY - q.y) * Math.min(1, dt * 8); continue; }
    q.vy += q.g * dt; if (q.drag) { const k = Math.max(0, 1 - q.drag * dt); q.vx *= k; q.vy *= k; }
    const nx = q.x + q.vx * dt, ny = q.y + q.vy * dt;
    if (q.bounce && q.vy > 0 && solidAt(Math.floor(nx), Math.floor(ny))) { q.vy *= -0.35; q.vx *= 0.6; q.vr *= 0.5; q.bounce--; if (!q.bounce) { q.vy = 0; q.g = 0; q.vx *= 0.3; } }
    else { q.x = nx; q.y = ny; }
    q.rot += q.vr * dt;
  }
  for (let i = SLX.decals.length - 1; i >= 0; i--) { SLX.decals[i].age += dt; if (SLX.decals[i].age > SLX.decals[i].life) SLX.decals.splice(i, 1); }
  for (let i = SLX.tears.length - 1; i >= 0; i--) { SLX.tears[i].age += dt; if (SLX.tears[i].age > SLX.tears[i].life) SLX.tears.splice(i, 1); }
  for (let i = S.zooms.length - 1; i >= 0; i--) { S.zooms[i].age += dt; if (S.zooms[i].age > S.zooms[i].life) S.zooms.splice(i, 1); }
  S.ca = Math.max(0, S.ca - dt * 2.2); S.inv = Math.max(0, S.inv - dt); S.white = Math.max(0, S.white - dt * 1.4); S.vig = Math.max(0, S.vig - dt * 0.6); S.speed = Math.max(0, S.speed - dt * 3);
  S.barsT = Math.max(0, S.barsT - dt); S.bars += ((S.barsT > 0 ? 1 : 0) - S.bars) * Math.min(1, dt * 4);
  if (SLX.title) { SLX.title.age += dt; if (SLX.title.age > SLX.title.life) SLX.title = null; }
  slWatch17(dt, p);
});
// ---- what every game sees her do ----
const SL_TITLES17 = [null, ['THE SLAYER OF WORLDS', 'one sword. every world. no more.'], ['THE CORRUPTION', 'phase two  -  her power grows'], ['THE FINAL FORM', 'phase three  -  she sheds what was left of her'], ['THE END', 'phase four  -  there is only her, and you']];
// ---- drawing ----
// things that aren't lights: scorch marks, rock, smoke, the inside of a rift
B12.pre.push(function slxPre17(ox, oy) {
  if (!SLX.p.length && !SLX.decals.length && !SL16.haz.length) return;
  for (const d of SLX.decals) {
    const x = ox + d.x * TILE, y = oy + d.gy * TILE, a = Math.min(1, (d.life - d.age) / 2) * Math.min(1, d.age * 8), w = d.w * TILE;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, w); gr.addColorStop(0, `rgba(20,4,24,${0.75 * a})`); gr.addColorStop(0.6, `rgba(40,8,50,${0.45 * a})`); gr.addColorStop(1, 'rgba(40,8,50,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.32, 0, 0, 6.283); ctx.fill();
  }
  for (const q of SLX.p) {
    if (q.t === 'smoke') {
      const k = q.age / q.life, x = ox + q.x * TILE, y = oy + q.y * TILE, r = q.size * TILE * (1 + k * 1.8);
      ctx.fillStyle = q.dark ? `rgba(26,8,34,${0.5 * (1 - k)})` : `rgba(90,40,110,${0.35 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    } else if (q.t === 'rock') {
      const x = ox + q.x * TILE, y = oy + q.y * TILE, s = q.size * TILE, a = Math.min(1, (q.life - q.age) * 3);
      ctx.save(); ctx.translate(x, y); ctx.rotate(q.rot); ctx.globalAlpha = a; ctx.fillStyle = q.col; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.fillStyle = 'rgba(255,90,200,0.7)'; ctx.fillRect(-s / 2, -s / 2, s * 0.35, s * 0.35); ctx.restore();
    } else if (q.t === 'shard') {
      const x = ox + q.x * TILE, y = oy + q.y * TILE, s = q.size * TILE, a = Math.min(1, (q.life - q.age) * 2.5);
      ctx.save(); ctx.translate(x, y); ctx.rotate(q.rot); ctx.globalAlpha = a;
      ctx.fillStyle = q.hue ? '#3a0a20' : '#24082e'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.45, 0); ctx.lineTo(0, s * 0.7); ctx.lineTo(-s * 0.45, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  for (const h of SL16.haz) if (h.t === 'mark') {   // the rift is black inside
    const x = ox + h.x * TILE, y = oy + h.y * TILE, k = Math.min(1, h.age / Math.max(0.1, (h.life || 1) * 0.5)), R = TILE * 1.9 * k, W = TILE * 0.55 * k;
    ctx.fillStyle = 'rgba(4,0,8,0.95)'; ctx.beginPath(); ctx.moveTo(x, y - R); ctx.quadraticCurveTo(x + W * 2, y, x, y + R); ctx.quadraticCurveTo(x - W * 2, y, x, y - R); ctx.fill();
  }
});
// every light she makes
B12.glow.push(function slxGlow17(ox, oy, glow) {
  const t = performance.now() / 1000;
  // her trail
  const T = SLX.trail;
  if (T.length > 2) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < T.length; i++) {
      const k = i / T.length, a = T[i - 1], b2 = T[i];
      ctx.strokeStyle = `rgba(${k > 0.7 ? '255,140,255' : '190,50,255'},${0.55 * k})`; ctx.lineWidth = TILE * (0.25 + 1.4 * k);
      ctx.beginPath(); ctx.moveTo(ox + a.x * TILE, oy + a.y * TILE); ctx.lineTo(ox + b2.x * TILE, oy + b2.y * TILE); ctx.stroke();
    }
  }
  for (const h of SL16.haz) slDrawHaz17(h, ox, oy, glow, t);
  for (const q of SLX.p) {
    const x = ox + q.x * TILE, y = oy + q.y * TILE, k = q.age / q.life;
    switch (q.t) {
      case 'spark': {
        const L = Math.max(2, Math.hypot(q.vx, q.vy) * TILE * 0.035), a = Math.atan2(q.vy, q.vx);
        ctx.strokeStyle = q.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = Math.max(1, q.w * TILE * (1 - k * 0.6)); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a) * L, y - Math.sin(a) * L); ctx.stroke(); ctx.globalAlpha = 1;
        break;
      }
      case 'ember': { const r = Math.max(1, q.size * TILE); glow(x, y, r * 4, q.col, 0.6 * (1 - k)); ctx.fillStyle = `rgba(255,240,255,${0.9 * (1 - k)})`; ctx.fillRect(x - r / 2, y - r / 2, r, r); break; }
      case 'ring': {
        const e = 1 - Math.pow(1 - k, 3), r = q.max * TILE * e;
        ctx.strokeStyle = `rgba(${q.col},${0.9 * (1 - k)})`; ctx.lineWidth = Math.max(1.5, q.w * TILE * (1 - k));
        ctx.beginPath(); ctx.ellipse(x, y, r, r * q.sq, 0, 0, 6.283); ctx.stroke();
        if (q.col !== '0,0,0') glow(x, y, r * 0.9, q.col, 0.12 * (1 - k));
        break;
      }
      case 'shard': { const s = q.size * TILE, a = Math.min(1, (q.life - q.age) * 2.5); ctx.save(); ctx.translate(x, y); ctx.rotate(q.rot); ctx.strokeStyle = q.hue ? `rgba(255,70,110,${a})` : `rgba(230,110,255,${a})`; ctx.lineWidth = Math.max(1, s * 0.18); ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.45, 0); ctx.lineTo(0, s * 0.7); ctx.lineTo(-s * 0.45, 0); ctx.closePath(); ctx.stroke(); ctx.restore(); glow(x, y, s * 2, q.hue ? '255,60,100' : '210,74,255', 0.25 * a); break; }
    }
  }
  for (const d of SLX.decals) {   // the cracks glow a while
    const a = Math.max(0, 1 - d.age / (d.life * 0.6)); if (a <= 0) continue;
    const x = ox + d.x * TILE, y = oy + d.gy * TILE, w = d.w * TILE;
    ctx.strokeStyle = `rgba(255,70,200,${0.8 * a})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); for (let i = 0; i < 5; i++) { const s = ((i * 37 + d.seed) % 10) / 10 - 0.5, L = w * (0.5 + ((i * 13 + d.seed) % 7) / 10); ctx.moveTo(x, y); ctx.lineTo(x + s * L * 2, y + Math.abs(s) * TILE * 0.15); ctx.lineTo(x + s * L * 2.6, y - TILE * 0.05); } ctx.stroke();
    glow(x, y, w * 0.8, '255,60,180', 0.25 * a);
  }
  // her intro: a pillar of light from the sky, and her death: rays breaking out of her
  const I = SLX.intro;
  if (I && I.age < 4.5) { const b = slBoss16(); if (b) { const x = ox + (b.x + b.w / 2) * TILE, y = oy + (b.y + b.h) * TILE, k = Math.min(1, I.age * 2) * Math.min(1, (4.5 - I.age) * 1.5), w = TILE * (1.6 + Math.sin(t * 20) * 0.1); const gr = ctx.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, 'rgba(210,74,255,0)'); gr.addColorStop(0.5, `rgba(255,220,255,${0.75 * k})`); gr.addColorStop(1, 'rgba(210,74,255,0)'); ctx.fillStyle = gr; ctx.fillRect(x - w, 0, w * 2, y); glow(x, y, TILE * 5, '255,140,255', 0.5 * k); } }
  const D = SLX.death;
  if (D && !D.boom) {
    const x = ox + D.x * TILE, y = oy + D.y * TILE, k = Math.min(1, D.age / 4.8);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * 6.283 + D.age * 0.6 + Math.sin(i * 7) * 0.3, L = TILE * (6 + 30 * k) * (0.6 + 0.4 * Math.sin(i * 3.1 + t * 4)), w = TILE * (0.25 + k * 0.6);
      ctx.fillStyle = `rgba(255,${200 + 40 * Math.sin(i)},255,${0.25 + 0.5 * k})`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - 0.04) * L, y + Math.sin(a - 0.04) * L); ctx.lineTo(x + Math.cos(a + 0.04) * L, y + Math.sin(a + 0.04) * L); ctx.closePath(); ctx.fill();
      void w;
    }
    glow(x, y, TILE * (3 + 8 * k), '255,220,255', 0.5 + 0.4 * k);
  } else if (D && D.boom) {   // her soul, rising
    const u = D.age - 4.8, x = ox + D.x * TILE, y = oy + (D.y - u * 2.2) * TILE, a = Math.max(0, Math.min(1, u * 2) * Math.min(1, (6 - u) / 2));
    if (a > 0) {
      glow(x, y, TILE * 4, '255,230,255', 0.6 * a); glow(x, y, TILE * 1.4, '255,255,255', 0.9 * a);
      ctx.strokeStyle = `rgba(255,240,255,${0.8 * a})`; ctx.lineWidth = 2;
      for (const s of [-1, 1]) { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const q = i / 12, wx = x + s * q * TILE * 3.2, wy = y - Math.sin(q * Math.PI) * TILE * 1.6 + q * TILE * 0.8 + Math.sin(t * 3) * TILE * 0.2 * q; i ? ctx.lineTo(wx, wy) : ctx.moveTo(wx, wy); } ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y - TILE * 1.2, TILE * 0.7, 0, 6.283); ctx.stroke();
    }
  }
});
function slDrawHaz17(h, ox, oy, glow, t) {
  switch (h.t) {
    case 'arc': {   // a sword cut: smeared, layered, white-hot at the edge
      const x = ox + h.x * TILE, y = oy + h.y * TILE, R = h.r * TILE;
      if (h.age < h.warn) {
        const k = h.age / h.warn;
        ctx.strokeStyle = `rgba(255,140,255,${0.2 + 0.5 * k})`; ctx.lineWidth = 1.5 + k * 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(x, y, R, h.a - h.sw, h.a + h.sw); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = `rgba(210,74,255,${0.07 * k})`; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R, h.a - h.sw, h.a + h.sw); ctx.closePath(); ctx.fill();
        break;
      }
      const k = Math.min(1, (h.age - h.warn) / Math.max(0.05, h.dur)), fade = Math.max(0, 1 - Math.max(0, h.age - h.warn - h.dur) / 0.35), e = 1 - Math.pow(1 - k, 3);
      const a0 = h.a - h.sw, a1 = a0 + h.sw * 2 * e, mid = (a0 + a1) / 2;
      if (a1 - a0 < 0.02) break;
      // the smear
      ctx.lineCap = 'round';
      for (let s = 5; s >= 1; s--) { ctx.strokeStyle = `rgba(${s > 2 ? '150,40,255' : '255,80,200'},${0.12 * fade * (6 - s) / 5})`; ctx.lineWidth = R * (0.08 + s * 0.05); ctx.beginPath(); ctx.arc(x, y, R * (0.82 - s * 0.02), a0, a1 - s * 0.05 * h.sw); ctx.stroke(); }
      // the crescent itself
      const icx = x + Math.cos(mid) * R * 0.26, icy = y + Math.sin(mid) * R * 0.26;
      const gr = ctx.createRadialGradient(x, y, R * 0.45, x, y, R * 1.02);
      gr.addColorStop(0, 'rgba(120,20,220,0)'); gr.addColorStop(0.55, `rgba(150,40,255,${0.55 * fade})`); gr.addColorStop(0.82, `rgba(255,70,200,${0.9 * fade})`); gr.addColorStop(0.95, `rgba(255,200,255,${fade})`); gr.addColorStop(1, `rgba(255,255,255,${fade})`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, R, a0, a1); ctx.arc(icx, icy, R * 0.8, a1, a0, true); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(255,60,110,${0.85 * fade})`; ctx.lineWidth = Math.max(1.5, TILE * 0.08); ctx.beginPath(); ctx.arc(x, y, R * 1.02, a0, a1); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${fade})`; ctx.lineWidth = Math.max(2, TILE * 0.12); ctx.beginPath(); ctx.arc(x, y, R * 0.94, Math.max(a0, a1 - 0.6), a1); ctx.stroke();
      if (k < 1) { const ex = x + Math.cos(a1) * R * 0.95, ey = y + Math.sin(a1) * R * 0.95; glow(ex, ey, TILE * 2.2, '255,220,255', 0.9); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = Math.max(2, TILE * 0.15); ctx.beginPath(); ctx.moveTo(x + Math.cos(a1) * R * 0.5, y + Math.sin(a1) * R * 0.5); ctx.lineTo(x + Math.cos(a1) * R * 1.08, y + Math.sin(a1) * R * 1.08); ctx.stroke(); }
      glow(x + Math.cos(mid) * R * 0.75, y + Math.sin(mid) * R * 0.75, R * 0.9, '210,74,255', 0.35 * fade);
      break;
    }
    case 'shock': {   // a rolling wall of void-fire
      if (h.fx == null) break;
      const x = ox + h.fx * TILE, y = oy + h.fgy * TILE, f = Math.min(1, (h.life - h.age) * 3);
      glow(x, y - TILE, TILE * 2.6, '210,74,255', 0.6 * f);
      for (let i = 0; i < 5; i++) {
        const hh = TILE * (1.2 + 1.5 * Math.abs(Math.sin(t * 18 + i * 1.7))) * (1 - i * 0.12) * f, w = TILE * (0.5 + i * 0.12), bx = x - h.dir * i * TILE * 0.35;
        const gr = ctx.createLinearGradient(0, y - hh, 0, y); gr.addColorStop(0, 'rgba(210,74,255,0)'); gr.addColorStop(0.5, `rgba(230,90,255,${0.75 - i * 0.1})`); gr.addColorStop(1, 'rgba(255,240,255,0.95)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(bx - w, y); ctx.quadraticCurveTo(bx - w * 0.3 + h.dir * w * 0.6, y - hh * 0.6, bx + h.dir * w * 0.4, y - hh); ctx.quadraticCurveTo(bx + w * 0.4, y - hh * 0.4, bx + w, y); ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'pillar': {   // a cluster of corruption crystals bursting out of the ground
      const x = ox + h.x * TILE, y = oy + h.gy * TILE;
      if (!h.up) {
        const k = h.age / h.warn;
        ctx.strokeStyle = `rgba(255,90,220,${0.3 + 0.6 * k})`; ctx.lineWidth = 1.5 + k * 2;
        ctx.beginPath(); for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, L = TILE * (0.4 + 1.4 * k) * (0.6 + (i % 3) * 0.25); ctx.moveTo(x, y); ctx.lineTo(x + s * L * 0.6, y - TILE * 0.05); ctx.lineTo(x + s * L, y + TILE * 0.06); } ctx.stroke();
        glow(x, y, TILE * (1 + k), '210,74,255', 0.3 + 0.4 * k);
        break;
      }
      const g0 = Math.min(1, (h.age - h.warn) / 0.12), grow = g0 < 1 ? g0 * 1.15 : 1 + Math.sin(Math.min(1, (h.age - h.warn - 0.12) / 0.2) * Math.PI) * 0.05;
      const fade = Math.min(1, (h.warn + h.dur - h.age) / 0.14);
      const H = h.h * TILE * grow;
      for (const [dx, sc, tilt] of [[-0.75, 0.5, -0.3], [0.8, 0.42, 0.32], [0, 1, 0]]) {
        const cx = x + dx * TILE, hh = H * sc, w = TILE * (0.55 + sc * 0.45);
        ctx.save(); ctx.translate(cx, y); ctx.rotate(tilt); ctx.globalAlpha = fade;
        const g1 = ctx.createLinearGradient(-w, 0, w, 0); g1.addColorStop(0, 'rgba(70,10,110,0.95)'); g1.addColorStop(0.45, 'rgba(170,50,255,0.95)'); g1.addColorStop(0.55, 'rgba(255,150,255,0.95)'); g1.addColorStop(1, 'rgba(120,20,180,0.95)');
        ctx.fillStyle = g1; ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w * 0.55, -hh * 0.75); ctx.lineTo(0, -hh); ctx.lineTo(w * 0.55, -hh * 0.78); ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,230,255,0.95)'; ctx.lineWidth = Math.max(1.5, TILE * 0.08); ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(0, 0); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,90,200,0.9)'; ctx.lineWidth = Math.max(1, TILE * 0.06); ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w * 0.55, -hh * 0.75); ctx.lineTo(0, -hh); ctx.lineTo(w * 0.55, -hh * 0.78); ctx.lineTo(w, 0); ctx.stroke();
        ctx.restore();
      }
      glow(x, y - H * 0.45, H * 0.65, '210,74,255', 0.45 * fade); glow(x, y, TILE * 2.4, '255,120,255', 0.6 * fade);
      break;
    }
    case 'ring': {   // a ring of corruption: runes, crackling, a bright edge
      const r = h.age * h.speed * TILE, x = ox + h.x * TILE, y = oy + h.y * TILE, segs = 96, fade = Math.min(1, ((h.max || 34) * TILE - r) / (TILE * 4));
      const inGap = (a) => h.gaps.some(g => angDiff16(a, g) < h.gw);
      ctx.lineCap = 'butt';
      for (let pass = 0; pass < 3; pass++) {
        ctx.lineWidth = [TILE * 0.9, TILE * 0.4, Math.max(1.5, TILE * 0.1)][pass];
        ctx.strokeStyle = [`rgba(150,40,255,${0.3 * fade})`, `rgba(255,70,200,${0.85 * fade})`, `rgba(255,240,255,${fade})`][pass];
        ctx.beginPath(); let open = false;
        for (let k = 0; k <= segs; k++) { const a = k / segs * 6.283; if (inGap(a)) { open = false; continue; } const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (!open) { ctx.moveTo(px, py); open = true; } else ctx.lineTo(px, py); }
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(255,220,255,${fade})`;   // runes riding the ring
      for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283 + h.age * 0.8; if (inGap(a)) continue; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r, s = Math.max(2, TILE * 0.14); ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 4); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore(); }
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * fade})`; ctx.lineWidth = 1.5;   // crackling lightning
      for (let k = 0; k < 4; k++) { const a0 = Math.random() * 6.283; if (inGap(a0)) continue; ctx.beginPath(); for (let s = 0; s <= 5; s++) { const a = a0 + s * 0.05, rr = r + (Math.random() - 0.5) * TILE * 0.8; s ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.stroke(); }
      for (const g of h.gaps) for (const s of [-1, 1]) { const a = g + s * h.gw, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; glow(px, py, TILE * 0.9, '255,255,255', 0.7 * fade); }
      break;
    }
    case 'line': {   // WORLD SPLIT
      const x0 = ox + h.x0 * TILE, y0 = oy + h.y0 * TILE, x1 = ox + h.x1 * TILE, y1 = oy + h.y1 * TILE;
      if (!h.fired) {
        const k = h.age / h.warn;
        ctx.strokeStyle = `rgba(255,${Math.round(90 + 120 * k)},230,${0.35 + 0.55 * k})`; ctx.lineWidth = 1 + k * 3; ctx.setLineDash([TILE * 0.6, TILE * 0.25]); ctx.lineDashOffset = -t * 60;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
        const p = Game.player; if (p) { const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L, pxs = ox + (p.x + p.w / 2) * TILE, pys = oy + (p.y + p.h / 2) * TILE, q = (pxs - x0) * ux + (pys - y0) * uy, cx = x0 + ux * q, cy = y0 + uy * q, s = TILE * (1.4 - k * 0.6); ctx.strokeStyle = `rgba(255,80,140,${0.6 + 0.4 * Math.sin(t * 30)})`; ctx.lineWidth = 2; ctx.strokeRect(cx - s, cy - s, s * 2, s * 2); }
        break;
      }
      const fade = Math.max(0, Math.min(1, (h.warn + h.dur - h.age) / 0.3)), th = h.th * TILE;
      const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      ctx.lineCap = 'butt';
      for (const [wm, col] of [[7, `rgba(150,40,255,${0.18 * fade})`], [3.6, `rgba(190,60,255,${0.55 * fade})`], [1.8, `rgba(255,70,170,${0.9 * fade})`], [0.6, `rgba(255,255,255,${fade})`]]) {
        ctx.strokeStyle = col; ctx.lineWidth = th * wm * (1 + 0.08 * Math.sin(t * 60));
        ctx.beginPath(); for (let i = 0; i <= 24; i++) { const q = i / 24, w = Math.sin(q * 40 + t * 80) * th * 0.15 * (wm > 1 ? 1 : 0); const px = x0 + (x1 - x0) * q + nx * w, py = y0 + (y1 - y0) * q + ny * w; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
      }
      break;
    }
    case 'meteor': {
      const x = ox + h.x * TILE, y = oy + h.gy * TILE;
      if (!h.hit) {
        const k = Math.min(1, h.age / h.warn);
        ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.28);
        for (const [rr, sp, n] of [[TILE * 2.6, 1, 12], [TILE * 1.8, -1.6, 8]]) { ctx.rotate(t * sp); ctx.strokeStyle = `rgba(255,${Math.round(90 + 100 * k)},230,${0.4 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, rr, 0, 6.283); ctx.stroke(); for (let i = 0; i < n; i++) { const a = i / n * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); ctx.lineTo(Math.cos(a) * rr * 1.15, Math.sin(a) * rr * 1.15); ctx.stroke(); } }
        ctx.restore();
        ctx.fillStyle = `rgba(210,40,255,${0.18 * k})`; ctx.beginPath(); ctx.ellipse(x, y, TILE * 2.6 * k, TILE * 0.7 * k, 0, 0, 6.283); ctx.fill();
        if (h.mx != null) {
          const mx = ox + h.mx * TILE, my = oy + h.my * TILE, R = TILE * 0.95, tx = mx + h.dir * -9 * TILE * 0.35, ty = my - 24 * TILE * 0.35;
          const L = Math.hypot(mx - tx, my - ty) || 1, nx2 = -(my - ty) / L, ny2 = (mx - tx) / L;
          const gr = ctx.createLinearGradient(tx, ty, mx, my); gr.addColorStop(0, 'rgba(150,40,255,0)'); gr.addColorStop(0.7, 'rgba(255,70,200,0.7)'); gr.addColorStop(1, 'rgba(255,240,255,0.95)');
          ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(mx + nx2 * R * 1.1, my + ny2 * R * 1.1); ctx.lineTo(mx - nx2 * R * 1.1, my - ny2 * R * 1.1); ctx.closePath(); ctx.fill();
          glow(mx, my, R * 5, '210,60,255', 0.85);
          ctx.save(); ctx.translate(mx, my); ctx.rotate(t * 8); ctx.fillStyle = '#ffe0ff'; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, rr = R * (i % 2 ? 0.55 : 0.95); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore();
        }
      }
      break;
    }
    case 'vortex': {   // REALITY SPIRAL: an accretion disk round a black hole
      const x = ox + h.x * TILE, y = oy + h.y * TILE, k = Math.min(1, h.age * 3) * Math.min(1, (h.dur + 0.4 - h.age) * 2), R = h.R * TILE * 0.55;
      for (let i = 0; i < 7; i++) {
        const rr = R * (0.25 + i * 0.12), rot = -h.age * (3.5 - i * 0.35) + i;
        ctx.strokeStyle = `rgba(${i % 2 ? '255,80,200' : '190,70,255'},${(0.85 - i * 0.09) * k})`; ctx.lineWidth = Math.max(1.5, TILE * (0.3 - i * 0.03));
        ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.38, 0.25, rot, rot + 4.2); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(255,255,255,${0.95 * k})`; ctx.lineWidth = Math.max(2, TILE * 0.12); ctx.beginPath(); ctx.arc(x, y, TILE * 1.6, 0, 6.283); ctx.stroke();
      glow(x, y, TILE * 3.2, '255,120,255', 0.5 * k);
      ctx.strokeStyle = `rgba(255,220,255,${0.7 * k})`; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { let a = Math.random() * 6.283, r = R * 1.1; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5); for (let s = 0; s < 6; s++) { a += 0.25; r *= 0.75; ctx.lineTo(x + Math.cos(a) * r + (Math.random() - 0.5) * 6, y + Math.sin(a) * r * 0.5 + (Math.random() - 0.5) * 6); } ctx.stroke(); }
      break;
    }
    case 'sanct': {   // a pillar of holy light
      const x = ox + h.x * TILE, y = oy + h.gy * TILE, w = h.r * TILE, a = Math.min(1, h.age * 2) * Math.min(1, (h.dur - h.age) * 2), pulse = 0.8 + 0.2 * Math.sin(t * 6);
      const gr = ctx.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,250,255,${0.7 * a * pulse})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - w, 0, w * 2, y);
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.28); ctx.rotate(t * 1.5); ctx.strokeStyle = `rgba(255,255,255,${0.95 * a})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, w, 0, 6.283); ctx.stroke(); for (let i = 0; i < 16; i++) { const an = i / 16 * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(an) * w, Math.sin(an) * w); ctx.lineTo(Math.cos(an) * w * 1.18, Math.sin(an) * w * 1.18); ctx.stroke(); } ctx.restore();
      glow(x, y - TILE, w * 2, '255,250,255', 0.6 * a);
      break;
    }
    case 'blast': {   // WORLD END, charging: a sphere that eats the light
      if (h.fired) break;
      const x = ox + h.x * TILE, y = oy + h.y * TILE, k = h.age / h.warn, R = TILE * (1 + k * 5);
      glow(x, y, R * 3, '255,90,220', 0.3 + 0.4 * k);
      ctx.fillStyle = `rgba(255,240,255,${0.5 + 0.4 * k})`; ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const a = i / 40 * 6.283, rr = R * 0.6 * (1 + 0.12 * Math.sin(a * 7 + t * 12) + 0.06 * Math.sin(a * 13 - t * 20)); i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.fill();
      ctx.strokeStyle = `rgba(255,120,220,${0.6 * k})`; ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + t * 0.7, r0 = R * 4 * (1 - ((t * 1.5 + i * 0.13) % 1)); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * (r0 + TILE * 1.6), y + Math.sin(a) * (r0 + TILE * 1.6)); ctx.stroke(); }
      break;
    }
    case 'mark': {   // a rift opens: she's coming through
      const x = ox + h.x * TILE, y = oy + h.y * TILE, k = Math.min(1, h.age / Math.max(0.1, (h.life || 1) * 0.5)), R = TILE * 1.9 * k, W = TILE * 0.55 * k;
      ctx.strokeStyle = 'rgba(255,90,220,0.95)'; ctx.lineWidth = Math.max(2, TILE * 0.12);
      ctx.beginPath(); ctx.moveTo(x, y - R); ctx.quadraticCurveTo(x + W * 2, y, x, y + R); ctx.quadraticCurveTo(x - W * 2, y, x, y - R); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.stroke();
      glow(x, y, R * 1.4, '210,74,255', 0.6);
      break;
    }
  }
}
// ---- the screen itself: tears, lensing, zoom-blur, chromatic aberration, inversion, letterbox, titles ----
const SNAP17 = { c: null, g: null, f: -1 }, CH17 = { r: null, b: null };
function snap17() {
  const src = ctx.canvas;
  if (!SNAP17.c) { SNAP17.c = document.createElement('canvas'); SNAP17.g = SNAP17.c.getContext('2d'); }
  if (SNAP17.f === loop.frames && SNAP17.c.width === src.width) return SNAP17.c;
  if (SNAP17.c.width !== src.width || SNAP17.c.height !== src.height) { SNAP17.c.width = src.width; SNAP17.c.height = src.height; }
  SNAP17.g.setTransform(1, 0, 0, 1, 0, 0); SNAP17.g.globalCompositeOperation = 'copy'; SNAP17.g.drawImage(src, 0, 0); SNAP17.g.globalCompositeOperation = 'source-over';
  SNAP17.f = loop.frames;
  return SNAP17.c;
}
function chan17(src, col) {   // one color channel of the picture, at half size
  const k = col === 'r' ? 'r' : 'b';
  if (!CH17[k]) { const c = document.createElement('canvas'); CH17[k] = { c, g: c.getContext('2d') }; }
  const C = CH17[k], w = Math.max(1, src.width >> 1), h = Math.max(1, src.height >> 1);
  if (C.c.width !== w || C.c.height !== h) { C.c.width = w; C.c.height = h; }
  C.g.globalCompositeOperation = 'copy'; C.g.drawImage(src, 0, 0, w, h);
  C.g.globalCompositeOperation = 'multiply'; C.g.fillStyle = col === 'r' ? '#ff0000' : '#00a0ff'; C.g.fillRect(0, 0, w, h);
  C.g.globalCompositeOperation = 'source-over';
  return C.c;
}
B12.post.push(function slxScreen17(ox, oy) {
  if (Game.screen === 'title') return;
  const S = SLX.scr, VW = VIEW.w, VH = VIEW.h, t = performance.now() / 1000;
  const lens = SL16.haz.filter(h => h.t === 'vortex' && h.age < h.dur + 0.3);
  if (bossFxLevel18() >= 2 && (SLX.tears.length || lens.length || S.zooms.length || S.ca > 0.03)) {   // (1.0: Boss Effects: Full only)
    const src = snap17();
    for (const T of SLX.tears) {   // the picture is torn along the cut, and the halves slide apart
      const k = T.age / T.life, off = Math.sin(Math.min(1, k * 3) * Math.PI / 2) * (1 - k) * 16, x0 = ox + T.x0 * TILE, y0 = oy + T.y0 * TILE, x1 = ox + T.x1 * TILE, y1 = oy + T.y1 * TILE;
      const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L, ux = (x1 - x0) / L, uy = (y1 - y0) / L, BIG = 4000;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(x0 - ux * BIG, y0 - uy * BIG); ctx.lineTo(x1 + ux * BIG, y1 + uy * BIG); ctx.lineTo(x1 + ux * BIG + nx * s * BIG, y1 + uy * BIG + ny * s * BIG); ctx.lineTo(x0 - ux * BIG + nx * s * BIG, y0 - uy * BIG + ny * s * BIG); ctx.closePath(); ctx.clip();
        ctx.drawImage(src, 0, 0, src.width, src.height, nx * s * off + ux * s * off * 0.4, ny * s * off + uy * s * off * 0.4, VW, VH); ctx.restore();
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,140,255,${1 - k})`; ctx.lineWidth = off * 2 + 2; ctx.beginPath(); ctx.moveTo(x0 - ux * BIG, y0 - uy * BIG); ctx.lineTo(x1 + ux * BIG, y1 + uy * BIG); ctx.stroke(); ctx.restore();
      ctx.fillStyle = `rgba(4,0,8,${0.85 * (1 - k)})`; ctx.save(); ctx.lineWidth = off * 1.4; ctx.strokeStyle = ctx.fillStyle; ctx.beginPath(); ctx.moveTo(x0 - ux * BIG, y0 - uy * BIG); ctx.lineTo(x1 + ux * BIG, y1 + uy * BIG); ctx.stroke(); ctx.restore();
    }
    for (const h of lens) {   // the black hole bends the world around it
      const x = ox + h.x * TILE, y = oy + h.y * TILE, k = Math.min(1, h.age * 3) * Math.min(1, (h.dur + 0.3 - h.age) * 2), R = h.R * TILE * 0.5, m = 1 + 0.35 * k;
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.clip();
      ctx.translate(x, y); ctx.rotate(0.25 * k * Math.sin(t * 2)); ctx.scale(m, m); ctx.translate(-x, -y);
      ctx.globalAlpha = 0.85 * k; ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, VW, VH);
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,150,255,${0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.stroke(); ctx.restore();
      const gr = ctx.createRadialGradient(x, y, 0, x, y, TILE * 1.6); gr.addColorStop(0, `rgba(0,0,0,${k})`); gr.addColorStop(0.8, `rgba(0,0,0,${0.9 * k})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, TILE * 1.6, 0, 6.283); ctx.fill();
    }
    for (const Z of S.zooms) {   // zoom blur from the impact
      const x = ox + Z.x * TILE, y = oy + Z.y * TILE, k = Z.age / Z.life;
      ctx.save();
      const M0 = ctx.getTransform(), dpr = M0.a; for (let i = 1; i <= 3; i++) { const sc = 1 + 0.025 * i * Z.a * (1 - k); ctx.globalAlpha = 0.22 * (1 - k); ctx.setTransform(dpr * sc, 0, 0, dpr * sc, M0.e + x * dpr * (1 - sc), M0.f + y * dpr * (1 - sc)); ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, VW, VH); }
      ctx.restore();
    }
    if (S.ca > 0.03) {   // chromatic aberration
      const R = chan17(src, 'r'), B = chan17(src, 'b'), off = 7 * Math.min(1.5, S.ca);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.55, S.ca * 0.4);
      ctx.drawImage(R, -off, 0, VW, VH); ctx.drawImage(B, off, 0, VW, VH); ctx.restore();
    }
  }
  if (S.speed > 0.05) {   // speed lines while she dives
    const cx = ox + S.speedX * TILE, cy = oy + S.speedY * TILE;
    ctx.save(); ctx.strokeStyle = `rgba(255,220,255,${0.35 * S.speed})`; ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + Math.random() * 0.2, r0 = Math.max(VW, VH) * rnd17(0.35, 0.55), r1 = r0 + rnd17(60, 200); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke(); }
    ctx.restore();
  }
  if (S.vig > 0.02) { const gr = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.25, VW / 2, VH / 2, Math.max(VW, VH) * 0.75); gr.addColorStop(0, 'rgba(20,0,30,0)'); gr.addColorStop(1, `rgba(20,0,30,${Math.min(0.9, S.vig)})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH); }
  if (S.inv > 0.01 && bossFxLevel18() >= 1) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; ctx.globalAlpha = Math.min(1, S.inv * 8); ctx.fillRect(0, 0, VW, VH); ctx.restore(); }
  if (S.white > 0.01) { ctx.fillStyle = `rgba(255,240,255,${Math.min(bossFxLevel18() ? 1 : 0.35, S.white)})`; ctx.fillRect(0, 0, VW, VH); }
  if (S.bars > 0.01) { const bh = VH * 0.1 * S.bars; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, bh); ctx.fillRect(0, VH - bh, VW, bh); if (typeof cineBars22 === 'function') cineBars22(0.1 * S.bars); }   // (and over the HUD)
  const T = SLX.title;
  if (T) slTitle17(T, VW, VH, t);
});
// a title card that glitches in, letter by letter, split into red and blue
const TC17 = { c: null, g: null };
function slTitle17(T, VW, VH, t) {
  const a = Math.min(1, T.age * 3) * Math.min(1, (T.life - T.age) * 1.5);
  if (a <= 0) return;
  if (!TC17.c) { TC17.c = document.createElement('canvas'); TC17.g = TC17.c.getContext('2d'); }
  TC17.m = TC17.m || document.createElement('canvas').getContext('2d');
  let fs = Math.max(24, Math.round(VH / 8.5)); TC17.m.font = `${fs}px "MC Title", "MC Title Alt", monospace`;
  const fitW = TC17.m.measureText(T.big).width; if (fitW > VW * 0.82) fs = Math.max(16, Math.floor(fs * VW * 0.82 / fitW));
  const W = Math.ceil(VW), H = Math.ceil(fs * 2.4);
  if (TC17.c.width !== W || TC17.c.height !== H) { TC17.c.width = W; TC17.c.height = H; }
  const g = TC17.g; g.clearRect(0, 0, W, H);
  const n = Math.min(T.big.length, Math.floor(T.age * 28)), txt = T.big.slice(0, n) + (n < T.big.length ? String.fromCharCode(33 + Math.floor(Math.random() * 60)) : '');
  g.font = `${fs}px "MC Title", "MC Title Alt", monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const cy = fs * 0.9, jit = T.age < 0.6 || Math.random() < 0.06 ? 4 : 1;
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = 'rgba(255,40,80,0.85)'; g.fillText(txt, W / 2 - jit * 2, cy);
  g.fillStyle = 'rgba(60,140,255,0.85)'; g.fillText(txt, W / 2 + jit * 2, cy);
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = T.col; g.fillText(txt, W / 2, cy);
  g.fillStyle = '#ffffff'; g.globalAlpha = 0.55; g.fillText(txt, W / 2, cy - 1); g.globalAlpha = 1;
  const tw = g.measureText(T.big).width;
  g.font = `${Math.round(fs * 0.3)}px "MC Body", "MC Body Alt", monospace`; g.fillStyle = 'rgba(255,230,255,0.9)';
  if (T.age > 0.7) g.fillText(T.small.toUpperCase().split('').join(' '), W / 2, fs * 1.75);
  g.strokeStyle = T.col; g.lineWidth = 2; const lw = Math.min(W * 0.4, tw * 0.6) * Math.min(1, T.age * 2);
  g.beginPath(); g.moveTo(W / 2 - tw / 2 - 20, cy); g.lineTo(W / 2 - tw / 2 - 20 - lw * 0.4, cy); g.moveTo(W / 2 + tw / 2 + 20, cy); g.lineTo(W / 2 + tw / 2 + 20 + lw * 0.4, cy); g.stroke();
  // sliced glitch onto the screen
  const y0 = VH * 0.2, bands = 12;
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < bands; i++) {
    const by = i / bands * H, bh = H / bands + 1, sh = (T.age < 0.5 || Math.random() < 0.04) ? (Math.random() - 0.5) * 40 * (T.age < 0.5 ? 1 - T.age * 2 : 0.4) : 0;
    ctx.drawImage(TC17.c, 0, by, W, bh, sh, y0 + by, W, bh);
  }
  ctx.restore();
}

// ---- /summon slayer ----
COMMANDS.summon && (function () {
  const run = COMMANDS.summon.run;
  COMMANDS.summon.run = (a) => {
    const t = a.join('').toLowerCase().replace(/[^a-z]/g, '');
    if (t === 'slayer' || t === 'slayerofworlds' || t === 'theslayerofworlds') {
      const w = Game.world; if (w.isMoon || w.isUnder || w.isInterior) return cmdError('She only comes to the surface of the Earth.');
      if (slBoss16()) return cmdError('She is already here.');
      if (netIsClient()) return cmdError('Only the host can do that.');
      const p = Game.player, x = Math.floor(p.x + p.w / 2) + 3, y = Math.floor(p.y + p.h) - 1;
      netFxCapture(x, y, () => spawnSlayer16(x, y, 'host')); return;
    }
    return run(a);
  };
})();

// ---- HARDMODE REMATCHES: THE CRYSTAL HEART ----------------------------------------------------------------
// Beat her again in Hardmode (an Echo, or the altar) and she doesn't explode. She stops, speaks, gives the
// nearest of you her CRYSTAL HEART (for the Prismheart: Items/prismheart.js) and sinks back into her altar.
// Her usual rewards (or the Echo's) drop from the altar when she's gone.
const SLH22 = [];   // hearts in flight (just for show: the real one is a drop the host makes when it arrives)
function slHeartFx22(e) {
  const p = Game.player, o = e[e.length - 1] || [0, 0];
  if (!p || Game.outside || Math.hypot(o[0] - p.x, o[1] - p.y) > 90) return;
  const b = Game.mobs.find(x => x.type === 'slayer');
  if (e[0] === 'ph0') { if (b) b.noTint = true; bars17(12); title17('THE CRYSTAL HEART', 'she has nothing left to fight for', '#ffd8ff', 5); }
  else if (e[0] === 'ph22') SLH22.push({ x: e[1], y: e[2], tx: e[3], ty: e[4], t: 0 });
  else if (e[0] === 'phd' && b) b.sink22 = performance.now();
}
function slayerHeartScene22(m, dt) {
  const S = m.heartScene, A = m.arena || { cx: m.x + m.w / 2, floor: m.y + m.h + 5 };
  const t0 = S.t; S.t += dt; m.dying += dt;
  const t = S.t, at = (k) => t0 < k && t >= k, say = (text) => announce('The Slayer of Worlds: "' + text + '"', '#f0c8ff');
  m.hurtFlash = 0; m.noTint = true; m.vx = 0; m.vy = 0; m.move = 'exhausted';
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  if (t0 === 0) {
    slClear16(); for (const x of Game.mobs) if (x.type === 'worldshade') { x.health = 0; killMob(x); }
    netFx(['ph0']); bars17(12); flashAt(cx, cy, 7, '230,140,255', 0.35); title17('THE CRYSTAL HEART', 'she has nothing left to fight for', '#ffd8ff', 5);
    sfx('ov.heartbeat', { x: cx, y: cy, pitch: 0.7, vol: 1.4 });
    announce('The Slayer of Worlds lowers her sword...', '#e070ff');
    const fs = bossFighters(m).concat(Game.player && !Game.player.dead ? [Game.player] : []);
    S.to = fs.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))[0] || Game.player;
  }
  // she drifts down to just above her altar, wings low
  if (t < 9) {
    const hx = A.cx, hy = A.floor - 3.5 - m.h / 2, k = Math.min(1, dt * 1.4);
    m.x += (hx - cx) * k; m.y += (hy - cy) * k + Math.sin(t * 1.7) * 0.004; m.vis = 1;
    if (Math.random() < 0.35) slFeather16(cx + (Math.random() - 0.5) * 4, cy + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.5, 0.4 + Math.random(), Math.random() < 0.5 ? '#ffffff' : null);
  }
  if (at(1.5)) say('...Again. You beat me again.');
  if (at(3.6)) say('Every world I ever broke is held in here. Take it.');
  // the heart comes out of her chest and floats to you
  if (at(5.2)) {
    const P = S.to || Game.player, tx = P.x + P.w / 2, ty = P.y + P.h * 0.3, hx = cx, hy = m.y + m.h * 0.38;
    SLH22.push({ x: hx, y: hy, tx, ty, t: 0 }); netFx(['ph22', +hx.toFixed(2), +hy.toFixed(2), +tx.toFixed(2), +ty.toFixed(2)]);
    S.give = { x: tx, y: ty, at: t + 2.1 };
    sfx('soul.forge', { x: hx, y: hy }); flashAt(hx, hy, 4, '255,200,255', 0.3);
  }
  if (S.give && !S.given && t >= S.give.at) {
    S.given = true;
    const d = spawnDrop(CRYSTAL_HEART, 1, S.give.x, S.give.y); if (d) { d.vx = 0; d.vy = -1; }
    sfx('soul.free', { x: S.give.x, y: S.give.y }); flashAt(S.give.x, S.give.y, 3, '255,220,255', 0.3);
  }
  if (at(8)) say('Make something better with it than I did.');
  // and down she goes, into the altar
  if (at(9.2)) { netFx(['phd']); m.sink22 = performance.now(); sfx('ov.rumble', { x: cx, y: cy, pitch: 0.7 }); sfx('ov.chain', { x: cx, y: cy, pitch: 0.6 }); }
  if (t >= 9.2) {
    m.y += dt * 1.6; m.vis = Math.max(0, 1 - (t - 9.2) / 3);
    Game.shake = Math.max(Game.shake, 0.08);
    for (let i = 0; i < 3 * particleMul(); i++) { const a = Math.random() * 6.28, r = 1 + Math.random() * 3; Game.particles.push({ x: A.cx + Math.cos(a) * r, y: A.floor - 1.5 + Math.sin(a) * r * 0.5, vx: -Math.cos(a) * r * 1.2, vy: -Math.sin(a) * r * 0.6 + 0.6, life: 0.7, age: 0, size: 0.1, kind: 'star', color: Math.random() < 0.5 ? '#d24aff' : '#ffffff', gravity: 0 }); }
  }
  if (t >= 12.4) {
    if (!S.given) { const d = spawnDrop(CRYSTAL_HEART, 1, A.cx, A.floor - 3); if (d) d.vy = -3; }
    m.vis = 0; m.x = A.cx - m.w / 2; m.y = A.floor - 3 - m.h / 2;   // (her rewards come up out of the altar)
    flashAt(A.cx, A.floor - 1, 6, '230,120,255', 0.4); sfx('ov.thunder', { x: A.cx, y: A.floor }); screenShake(0.5);
    announce('She is gone, back into the altar. Her heart is yours.', '#e070ff');
    finishMobDeath(m);
  }
}
B12.updaters.push(function slHearts22(dt) {
  for (let i = SLH22.length - 1; i >= 0; i--) {
    const H = SLH22[i]; H.t += dt;
    if (H.t >= 2.1) { SLH22.splice(i, 1); continue; }
    if (Math.random() < dt * 30 * particleMul()) { const P = slHeartPos22(H); Game.particles.push({ x: P.x + (Math.random() - 0.5) * 0.4, y: P.y + (Math.random() - 0.5) * 0.4, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), life: 0.5, age: 0, size: 0.08, kind: 'star', color: ['#ff6ab0', '#ffd84a', '#7affb0', '#7ae8ff', '#c08aff'][Math.floor(Math.random() * 5)], gravity: 0 }); }
  }
});
// where a flying heart is: it rises out of her for a moment, then glides over to you
function slHeartPos22(H) {
  if (H.t < 0.7) { const k = H.t / 0.7; return { x: H.x, y: H.y - Math.sin(k * Math.PI / 2) * 1.2 }; }
  const k = Math.min(1, (H.t - 0.7) / 1.4), e = k * k * (3 - 2 * k), sx = H.x, sy = H.y - 1.2;
  return { x: sx + (H.tx - sx) * e, y: sy + (H.ty - sy) * e - Math.sin(k * Math.PI) * 1.5 };
}
B12.glow.push(function slHeartGlow22(ox, oy, glow) {
  for (const H of SLH22) { const P = slHeartPos22(H), x = ox + P.x * TILE, y = oy + P.y * TILE; glow(x, y, TILE * 3, '255,160,255', 0.5); glow(x, y, TILE * 1.2, '255,255,255', 0.6); }
});
B12.post.push(function slHeartDraw22(ox, oy) {
  const icon = typeof CRYSTAL_HEART !== 'undefined' && itemIcon[CRYSTAL_HEART];
  if (!SLH22.length || !icon) return;
  for (const H of SLH22) {
    const P = slHeartPos22(H), s = TILE * (1 + 0.08 * Math.sin(H.t * 9));
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(ox + P.x * TILE, oy + P.y * TILE);
    ctx.drawImage(icon, 0, 0, icon.width, icon.height, -s / 2, -s / 2, s, s); ctx.restore();
  }
});

// ---- HARDMODE (a rematch after the Slayer... her rematch): faster in everything (index.html, HM_BOSS22);
// shattered worlds rain down around you, and every so often a ring of void bursts out of her ----
BOSSES.slayer.hardmode = function (m, dt, p) {
  if (!m.arena || m.move === 'intro' || m.move === 'exhausted' || m.heartScene) return;
  m.hmT22 = (m.hmT22 ?? 6) - dt; m.hmR22 = (m.hmR22 ?? 10) - dt;
  const pcx = p.x + p.w / 2, from = m.arena.floor - 26;
  if (m.hmT22 <= 0) {
    m.hmT22 = 6.5;
    for (let i = 0; i < 5; i++) { const x = pcx + (i - 2) * 3.2 + (Math.random() - 0.5) * 1.4; slSpawn16({ t: 'meteor', x: r1(x), gy: slGround16(x, from), warn: 1 + i * 0.12, dir: Math.random() < 0.5 ? -1 : 1, dmg: 13 }); }
  }
  if (m.hmR22 <= 0) {
    m.hmR22 = 12;
    const g0 = Math.random() * 6.283;
    slSpawn16({ t: 'ring', x: r1(m.x + m.w / 2), y: r1(m.y + m.h / 2), speed: 8, gaps: [g0, g0 + 2.1, g0 + 4.2].map(r2), gw: 0.36, dmg: 10, max: 36 });
  }
};
