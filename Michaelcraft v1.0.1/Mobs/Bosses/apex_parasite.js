'use strict';
// =============================================================================
// THE APEX PARASITE   (type 'apexparasite')
//   The desert's boss: a great worm under the sand. Woken with its totem.
//   Burrows, erupts, spits acid, bites, births Brood Larvae. Its body segments can be hit too
//   (armored until it's exposed). It is drawn from its head's path (parasiteSegs).
// =============================================================================
defineMob('apexparasite', {
  // ---- STATS ----
  // ---- Beta 1.1.4: the desert's boss and its brood (the body is drawn from the head's path: see parasiteSegs) ----
  stats: {
    name: 'The Apex Parasite', w: 2.4, h: 2.4, speed: 12, health: 1000, hostile: true, boss: true, dmg: 6, kb: 0,
    flying: true, fireproof: true, custom: 'parasite',
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // it swims through the sand on its own path
  // ---- AI ----
  // ---- VISUALS ----
  deathColors: ['#e6d6a8', '#b6ff3a', '#5b2415'],
  // (drawn by MOB_DRAW.apexparasite, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: terraria_('dd2_drakin_breath_in', 3), vol: 0.75, pitch: [0.48, 0.58], cat: 'volCreatures', synth: 'growl' },
    hurt: { files: terraria_('dd2_wyvern_hurt', 3), vol: 0.6, pitch: [0.68, 0.82], cat: 'volCreatures', synth: 'hit' },
    death: { files: terraria_('dd2_wyvern_death', 3), vol: 1, pitch: [0.58, 0.62], cat: 'volCreatures', synth: 'death' },
    'parasite.roar': { files: terraria_('dd2_wyvern_scream', 3), vol: 0.9, pitch: [0.72, 0.86], cat: 'volCreatures', synth: 'growl' },
    'parasite.bite': { files: terraria_('dd2_ogre_attack', 3), vol: 1, pitch: [0.6, 0.7], cat: 'volCreatures', synth: 'slam' },
    'parasite.spawn': { files: ['terraria/roar_0'], vol: 1, pitch: [0.82, 0.88], cat: 'volCreatures', synth: 'growl' },
    'parasite.rumble': { files: ['terraria/dd2_ogre_ground_pound'], vol: 0.9, pitch: [0.55, 0.62], cat: 'volCreatures' },
    'parasite.screech': { files: ['terraria/roar_2'], vol: 0.8, pitch: [0.72, 0.78], cat: 'volCreatures', synth: 'growl' },
    'parasite.dive': { files: terraria_('dd2_wyvern_dive_down', 3), vol: 1, pitch: [0.72, 0.82], cat: 'volCreatures' },
    'parasite.erupt': { files: [...terraria_('dd2_monk_staff_ground_impact', 3), 'terraria/dd2_ogre_ground_pound'], vol: 1, pitch: [0.55, 0.65], cat: 'volCreatures' },
    'parasite.spit': { files: ['terraria/dd2_ogre_spit', ...terraria_('dd2_drakin_shot', 3)], vol: 0.75, pitch: [0.7, 0.9], cat: 'volCreatures' },
    'parasite.brood': { files: ['terraria/npc_killed_1'], vol: 0.9, pitch: [0.45, 0.55], cat: 'volCreatures' },
    'parasite.burst': { files: ['terraria/npc_killed_14'], vol: 0.55, pitch: [0.85, 1.25], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    parasiteLoot(mob, mx, my);
  },
  // ---- BOSS ----
  boss: {
    name: 'The Apex Parasite', music: 'Sounds/music/apex_parasite.mp3',
    home: (m) => m.pHome || { x: m.x, y: m.y },
    chase: { x: 90, y: 70 },
    summonAdv: 'totem', killAdv: 'parasite',
    dmgMult: 1.4,
    leaveMsg: 'The Apex Parasite slithers back beneath the sand. Its totem is left where it stood.', color: '#b6ff3a',
    leaveColors: ['#b6ff3a', '#5b2415', '#e6d6a8'],   // (the puff when it leaves)
    dying: (m, dt) => parasiteDying(m, dt), onLeave: (m) => parasiteLeft(m),
  },
  bossAI: (m, dt, p) => parasiteAI(m, dt, p),
});

// ---- AI ----
const PARA = { n: 22, gap: 1.3, cap: [5, 7, 9] };   // plates, spacing in blocks, most larvae alive per phase
const PARA_ROLES = ['orbit', 'weave', 'burrow'];
const paraRadius = (i, n) => 1.08 - 0.52 * Math.pow(i / Math.max(1, n - 1), 1.3);   // fat near the head, thin at the tail
const larvaCount = () => Game.mobs.reduce((n, x) => n + (x.type === 'broodlarva' && x.dying == null && !x.dead ? 1 : 0), 0);
// chase a point by TURNING (like a worm): the heading swings toward it at most `turn` radians a second
function wormSteer(m, tx, ty, spd, turn, dt) {
  if (!isFinite(tx + ty)) return;   // (no target yet: carry on straight)
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  const want = Math.atan2(ty - cy, tx - cx);
  m.ang = Math.atan2(Math.sin(m.ang || 0), Math.cos(m.ang || 0));
  const d = ((want - m.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  m.ang += Math.max(-turn * dt, Math.min(turn * dt, d));
  m.spd = approach(m.spd || 0, spd, 34 * dt);
  m.vx = Math.cos(m.ang) * m.spd; m.vy = Math.sin(m.ang) * m.spd;
}
// The body: one point per plate, each following the one in front at a fixed distance.
// Computed once per frame, from the head's position only (so friends get it for free).
function parasiteSegs(m) {
  if (m._sf === loop.frames && m.sp) return m.sp;
  m._sf = loop.frames;
  const hx = m.x + m.w / 2, hy = m.y + m.h / 2, N = PARA.n;
  let sp = m.sp;
  if (!sp) {
    sp = m.sp = [];
    const a = m.ang || 0;
    for (let i = 0; i < N; i++) sp.push({ x: hx - Math.cos(a) * PARA.gap * (i + 1), y: hy - Math.sin(a) * PARA.gap * (i + 1), ang: a, u: false });
  }
  let px = hx, py = hy;
  for (let i = 0; i < N; i++) {
    const s = sp[i], gp = PARA.gap * (i === 0 ? 1.15 : 1);
    const dx = s.x - px, dy = s.y - py, d = Math.hypot(dx, dy);
    if (d > gp) { s.x = px + dx / d * gp; s.y = py + dy / d * gp; }
    else if (d < 0.01) s.x = px - gp;
    px = s.x; py = s.y;
  }
  const hu = solidAt(Math.floor(hx), Math.floor(hy));
  if (hu !== m.hu) { if (m.hu != null && m.dying == null) sandPuff(hx, hy, 8); m.hu = hu; }
  for (let i = 0; i < N; i++) {
    const s = sp[i], prev = i === 0 ? { x: hx, y: hy } : sp[i - 1], next = i === N - 1 ? s : sp[i + 1];
    s.ang = Math.atan2(prev.y - next.y, prev.x - next.x);
    const u = solidAt(Math.floor(s.x), Math.floor(s.y));
    if (u !== s.u) { if (i % 2 === 0 && m.dying == null && i < (m.nseg == null ? N : m.nseg)) sandPuff(s.x, s.y, 4); s.u = u; }
  }
  return sp;
}
// ---- being hit ----------------------------------------------------------------
// Stand-ins for the body, handed out by combatTargets(): they look like small mobs
// (a box each) to every weapon, and hurtMob() forwards the hit to the head.
function parasiteProxies(b) {
  const sp = parasiteSegs(b), n = b.nseg == null ? PARA.n : b.nseg, px = b.segPx || (b.segPx = []);
  const out = [];
  for (let i = 0; i < n; i++) {
    let p = px[i];
    if (!p) { p = px[i] = Object.create(b); p.segOf = b; p.segI = i; }   // (inherits everything else - health, def, dying, id... from the head)
    const r = paraRadius(i, PARA.n) * 0.95;
    p.w = r * 2; p.h = r * 2; p.x = sp[i].x - r; p.y = sp[i].y - r;
    out.push(p);
  }
  return out;
}
// plates blunt hits on the body (the head always takes full damage); they chip away as it gets hurt
function paraArmor(b) { return b.exposed ? 1 : b.phase >= 3 ? 0.9 : b.phase === 2 ? 0.75 : 0.6; }
function hurtParasiteBody(seg, dmg, attacker, crit, kind) {
  const b = seg.segOf;
  if (!b || b.dead || b.dying != null) return;
  if (b._hitF === loop.frames) return;   // one swing / blast hurts it once, even when it touches several rings
  b._hitF = loop.frames;
  const armor = b.bossInvuln > 0 ? 1 : paraArmor(b), taken = Math.max(1, Math.round(dmg * armor));
  if (armor < 1 && b.bossInvuln <= 0) {
    for (let i = 0; i < 5; i++) Game.particles.push({ x: seg.x + seg.w / 2 + (Math.random() - 0.5) * seg.w, y: seg.y + seg.h / 2 + (Math.random() - 0.5) * seg.h, vx: (Math.random() - 0.5) * 5, vy: -1 - Math.random() * 3, life: 0.4, age: 0, size: 0.09, kind: 'star', color: i % 2 ? '#e6d6a8' : '#b39a63', gravity: 6 });
    if (!b.plateTipped) { b.plateTipped = true; eventMessage('Its plates blunt your blows. Aim for the head!', '#d9c48a'); }
  }
  hurtMob(b, taken, attacker, crit, kind);
}
// ---- the fight ----------------------------------------------------------------
function paraPhase(m) { const f = m.health / m.maxHealth; return f > 0.66 ? 1 : f > 0.33 ? 2 : 3; }
function paraRage(m) { return 1 + (1 - Math.max(0, m.health / m.maxHealth)) * 0.6; }   // 1.0 -> 1.6: it speeds up as it gets hurt
// (the host spawns it for real - see tryAwakenParasite)
function spawnParasite(ax, ay, by) {
  const w = Game.world, surf = w.surfaceHeight(Math.floor(ax));
  const m = new Mob('apexparasite', ax + 0.5 - 1.2, surf + 20);   // it starts deep under the sand, right under the totem
  Object.assign(m, {
    pHome: { x: ax + 0.5, y: surf - 6 }, surfY: surf, phase: 1, move: 'intro', moveT: 0, t: 0, ang: -Math.PI / 2, spd: 0, leaveT: 0, nseg: PARA.n,
    bossInvuln: 3.4, state: 'hostile', guardian: true, broodT: 5, maw: 0, mawT: 0, sacs: 0, sacsT: 0, side: 1, rnd: 0, stage: '', roleI: 0, exposed: false,
  });
  Game.mobs.push(m);
  bossSpawned(m);
  sfx('parasite.spawn'); sfx('parasite.rumble', { x: ax, y: ay }); screenShake(1.2); flashDamage();   // (1.3.2 Terraria roar)
  eventMessage('The ground trembles...', '#e0c47a');
  for (let i = 0; i < 40; i++) { const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6; Game.particles.push({ x: ax + 0.5, y: ay, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, life: 0.8 + Math.random() * 0.5, age: 0, size: 0.1 + Math.random() * 0.12, color: ['#d9b873', '#b6ff3a', '#c9a35f'][i % 3], gravity: 8 }); }
  if (by && by !== 'host' && Net.peers.has(by)) netSend(by, { t: 'adv', id: 'totem' }); else if (!Game.outside) Adv.grant('totem');
}
// right-click on a Parasite Totem. A friend's game asks the host, which does it for everyone.
function useParasiteTotem(x, y) {
  if (netIsClient()) { netSend(null, { t: 'totem', x, y }); return; }
  tryAwakenParasite(x, y, 'host');
}
function tryAwakenParasite(x, y, by) {
  const w = netOverworld();
  const say = (text, color) => { if (by && by !== 'host' && Net.peers.has(by)) netSend(by, { t: 'ev', text, color }); else showToast(text); };
  if (!Number.isFinite(x) || !Number.isFinite(y) || w.getTile(x, y) !== PARASITE_TOTEM) return;
  if (Game.boss && !Game.boss.dead) { say('A boss is already awake!', '#e0c47a'); return; }
  if (w.isInterior || !w.isDesert(x)) { say('The totem only stirs in a desert.', '#e0c47a'); return; }
  if (y > w.surfaceHeight(x) + 1 || w.surfaceHeight(x) >= SEA_LEVEL || isWaterId(w.getTile(x, y - 1))) { say('The totem must stand on dry sand, on the surface, under the open sky.', '#e0c47a'); return; }
  w.setTile(x, y, AIR);
  netFxCapture(x, y, () => spawnParasite(x, y, by));
}
function setParaMove(m, mv) {
  m.move = mv; m.moveT = 0; m.stage = ''; m.fired = 0; m.mawT = 0; m.sacsT = 0; m.exposed = false;
  if (mv === 'dive') { m.stage = 'climb'; m.diveN = m.phase >= 3 ? 1 : 0; m.mawT = 0.6; }
  if (mv === 'burrow') m.stage = 'sink';
  if (mv === 'spit') { m.oa = Math.random() * Math.PI * 2; m.cdir = Math.random() < 0.5 ? -1 : 1; m.spitN = 5 + m.phase * 2; }
  if (mv === 'brood') { m.sacsT = 1; m.exposed = true; m.bx = 0; m.by = 0; }
  if (mv === 'coil') { m.stage = 'wind'; m.cdir = Math.random() < 0.5 ? -1 : 1; m.mawT = 0.5; m.cr = 0; }
  if (mv === 'molt') { m.sacsT = 1; m.exposed = true; }
  if (mv === 'hunt') m.huntFor = (m.phase === 1 ? 2.4 : m.phase === 2 ? 1.6 : 1.0) + Math.random() * 1.2;
}
function pickParaMove(m) {
  const ph = m.phase, cap = PARA.cap[ph - 1], alive = larvaCount();
  const opts = [
    ['dive', ph === 1 ? 3 : 2.2], ['burrow', ph === 1 ? 2 : 3], ['spit', 2],
    ['brood', alive < cap - 1 ? (m.broodT <= 0 ? 14 : 1.5) : 0], ['coil', ph >= 2 ? 3 : 0],
  ];
  const pool = opts.filter(o => o[0] !== m.lastMove && o[1] > 0);
  let r = Math.random() * pool.reduce((s, o) => s + o[1], 0), pick = pool[0][0];
  for (const o of pool) { r -= o[1]; if (r <= 0) { pick = o[0]; break; } }
  m.lastMove = pick; m.side = -m.side; m.rnd = Math.random();
  setParaMove(m, pick);
}
// sacs burst: up to n larvae pour out of the body
function paraBirth(m, n) {
  const sp = parasiteSegs(m), room = PARA.cap[m.phase - 1] - larvaCount();
  n = Math.min(n, room);
  if (n <= 0) return;
  sfx('parasite.brood'); sfx('parasite.roar', { pitch: 1.0 });
  for (let i = 0; i < n; i++) {
    const s = sp[2 + Math.floor(Math.random() * (PARA.n - 4))], role = PARA_ROLES[m.roleI++ % PARA_ROLES.length];
    const L = new Mob('broodlarva', s.x - 0.4, s.y - 0.4);
    const a = Math.random() * Math.PI * 2;
    Object.assign(L, { brood: true, role, mode: role === 'burrow' ? 'dive' : role === 'orbit' ? 'orbit' : 'weave', ang: a, spd: 10, t: Math.random() * 6, oa: a, dirO: Math.random() < 0.5 ? -1 : 1, orbitFor: 2.5 + Math.random() * 2, mt: 0, hitCd: 0.5, guardian: true, state: 'hostile', side: Math.random() < 0.5 ? -1 : 1 });
    L.vx = Math.cos(a) * 10; L.vy = Math.sin(a) * 10;
    Game.mobs.push(L);
    for (let k = 0; k < 8; k++) Game.particles.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 0.5, age: 0, size: 0.12, color: k % 2 ? '#b6ff3a' : '#f0ffa8', gravity: 2 });
  }
}
function paraSpit(m, n) {   // arcing globs of acid, lobbed at everybody at the fight
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2, G = 15, V = 13;
  for (const q of bossAimList(m)) for (let i = 0; i < n; i++) {
    const tx = q.x + q.w / 2 + (Math.random() - 0.5) * 3 * (n > 1 ? 1.5 : 0.6), ty = q.y + q.h / 2;
    const dx = tx - cx, dy = ty - cy, t = Math.max(0.35, Math.hypot(dx, dy) / V);
    spawnProjectile({ x: cx, y: cy, vx: dx / t, vy: (dy - 0.5 * G * t * t) / t, kind: 'acid', r: 0.34, dmg: 5, solidHit: false, life: 5 });
  }
  sfx('parasite.spit');
}
function paraFan(m, x, y, n) {   // the burst of acid when it breaks out of the sand
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * (1.5 / Math.max(1, n - 1)) + (Math.random() - 0.5) * 0.12, sp = 10 + Math.random() * 4;
    spawnProjectile({ x, y: y - 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, kind: 'acid', r: 0.34, dmg: 5, solidHit: false, life: 5 });
  }
  sandPuff(x, y, 24); screenShake(0.6); sfx('parasite.erupt', { x, y }); sfx('parasite.roar', { pitch: 0.82 });
}
function parasiteAI(m, dt, p) {
  const H = m.pHome, rage = paraRage(m), ph = m.phase, surf = m.surfY;
  m.t += dt; m.moveT += dt;
  m.bossInvuln = Math.max(0, m.bossInvuln - dt);
  m.contactCd = Math.max(0, (m.contactCd || 0) - dt);
  m.shakeAmt = Math.max(0, (m.shakeAmt || 0) - dt * 2);
  m.maw = approach(m.maw || 0, m.mawT || 0, 5 * dt);
  m.sacs = approach(m.sacs || 0, m.sacsT || 0, 2.5 * dt);
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2, px = p.x + p.w / 2, py = p.y + p.h / 2;
  const steer = (tx, ty, spd, turn) => wormSteer(m, tx, ty, spd * rage, turn * Math.min(1.35, rage), dt);
  const lastCy = m._cy == null ? cy : m._cy; m._cy = cy;
  const broke = lastCy > surf && cy <= surf;      // came up out of the sand this frame
  // it gives up once EVERYONE is dead or has run away
  if (!bossFighters(m).length) { m.leaveT += dt; if (m.leaveT > (bossPlayers().length ? 4 : 2)) { bossLeave(m); return; } }
  else m.leaveT = 0;
  // phases: it MOLTS when it crosses a threshold
  const np = paraPhase(m);
  if (np > ph && m.move !== 'intro' && m.move !== 'molt') {
    m.phase = np; setParaMove(m, 'molt'); m.bossInvuln = 2.2; m.bx = cx; m.by = Math.min(cy, surf - 6);
    sfx('parasite.screech'); screenShake(1); flashDamage();
    eventMessage(np === 2 ? 'The Apex Parasite molts - its plates crack!' : 'The Apex Parasite goes into a FRENZY!', '#b6ff3a');
    for (let i = 0; i < 24; i++) Game.particles.push({ x: cx + (Math.random() - 0.5) * 3, y: cy + (Math.random() - 0.5) * 3, vx: (Math.random() - 0.5) * 8, vy: -1 - Math.random() * 5, life: 0.9, age: 0, size: 0.14, kind: 'star', color: i % 2 ? '#e6d6a8' : '#b6ff3a', gravity: 7 });
  }
  switch (m.move) {
    case 'intro':
      if (m.moveT < 2.6) {   // rumbling under the sand
        m.spd = 0; m.vx = 0; m.vy = 0; m.shakeAmt = 0.8;
        if (Math.random() < dt * 30) Game.particles.push({ x: H.x + (Math.random() - 0.5) * 3, y: surf - 0.3, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 3, life: 0.7, age: 0, size: 0.12, color: ['#d9b873', '#c9a35f'][Math.random() < 0.5 ? 0 : 1], gravity: 8 });
        if (!m.fired) { m.fired = 1; sfx('altar.charge', { x: H.x, y: surf }); sfx('parasite.rumble', { x: H.x, y: surf }); }
        screenShake(0.012);
      } else {
        m.mawT = 1; wormSteer(m, H.x, surf - 26, 24, 6, dt);
        if (broke) { paraFan(m, cx, surf, 7); eventMessage('The Apex Parasite has awoken!', '#b6ff3a'); }
        if (cy < surf - 18 || m.moveT > 5) setParaMove(m, 'hunt');
      }
      break;
    case 'molt': {   // curled up, roaring, shedding plates - and birthing
      m.vx *= 0.9; m.vy *= 0.9; m.shakeAmt = 1;
      steer(m.bx + Math.cos(m.t * 3) * 3, m.by + Math.sin(m.t * 3) * 3, 7, 6);
      if (m.moveT > 1.0 && !m.fired) { m.fired = 1; paraBirth(m, 3 + ph); }
      if (m.moveT > 2.2) setParaMove(m, 'hunt');
      break;
    }
    case 'hunt': {
      m.broodT -= dt;
      let jx = 0, jy = 0;
      if (ph >= 3) {   // FRENZY: it twitches to a new line every few moments
        m.jt = (m.jt || 0) - dt;
        if (m.jt <= 0) { m.jt = 0.3 + Math.random() * 0.35; m.jx = (Math.random() - 0.5) * 16; m.jy = (Math.random() - 0.5) * 12; }
        jx = m.jx || 0; jy = m.jy || 0;
      }
      steer(px + Math.sin(m.t * 2.3 + m.id) * 5 + jx, py - 2 + Math.sin(m.t * 3.1) * 4.5 + jy, 11, 2.7);
      if (m.moveT > (m.huntFor || 2.5)) pickParaMove(m);
      break;
    }
    case 'dive':
      if (m.stage === 'climb') {   // rises high above you (this is the warning)
        m.mawT = 0.6;
        steer(px + m.side * 7, Math.min(py - 16, surf - 12), 13, 3.5);
        if (Math.hypot(px + m.side * 7 - cx, Math.min(py - 16, surf - 12) - cy) < 3.5 || m.moveT > 2.4) { m.stage = 'plunge'; m.moveT = 0; m.aimX = px; m.aimY = py; m.mawT = 1; sfx('parasite.dive'); sfx('parasite.roar', { pitch: 0.9 }); }
      } else {   // ...then plunges through where you were standing
        steer(m.aimX, m.aimY + 14, 20, 4.2);
        if (cy > surf + 7 || m.moveT > 1.9) {
          if (m.diveN > 0) { m.diveN--; m.stage = 'climb'; m.moveT = 0; m.side = -m.side; } else setParaMove(m, 'hunt');
        }
      }
      break;
    case 'burrow':
      if (m.stage === 'sink') {   // dives under the sand, off to one side
        steer(px + m.side * 12, surf + 12, 14, 3.2);
        if (cy > surf + 6) { m.stage = 'stalk'; m.moveT = 0; sfx('parasite.rumble'); }
        else if (m.moveT > 3) setParaMove(m, 'hunt');
      } else if (m.stage === 'stalk') {   // tunnels under you: dust marks where it is
        steer(px, surf + 9, 13, 4);
        m.warnX = cx;
        if (Math.random() < dt * 18) Game.particles.push({ x: cx + (Math.random() - 0.5) * 2, y: surf - 0.2, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random() * 2, life: 0.6, age: 0, size: 0.1, color: '#d9b873', gravity: 5 });
        m.rumbleT = (m.rumbleT || 0) - dt; if (m.rumbleT <= 0) { m.rumbleT = 0.5; screenShake(0.05); }
        if ((Math.abs(cx - px) < 2.4 && m.moveT > 0.8) || m.moveT > 3.2) { m.stage = 'erupt'; m.moveT = 0; m.aimX = px; m.mawT = 1; sfx('parasite.roar', { pitch: 0.78 }); }
      } else {   // ...and bursts out right under your feet
        steer(m.aimX, surf - 24, 23, 5.5);
        if (broke) paraFan(m, cx, surf, 3 + ph * 2);
        if (cy < surf - 14 || m.moveT > 2) setParaMove(m, 'hunt');
      }
      break;
    case 'spit': {
      m.oa += dt * 1.1 * m.cdir;
      m.mawT = 0.7;
      steer(px + Math.cos(m.oa) * 10, Math.min(py - 4 + Math.sin(m.oa) * 4, surf - 6), 10, 3);
      const gap = 0.6 / rage;
      if (m.moveT > 0.6 + m.fired * gap && m.fired < m.spitN) { m.fired++; m.mawT = 1; paraSpit(m, ph); }
      if (m.fired >= m.spitN && m.moveT > 0.6 + m.spitN * gap + 0.5) setParaMove(m, 'hunt');
      break;
    }
    case 'brood': {   // curls up with swollen sacs; hit it now, the plates are open
      if (!m.bx) { m.bx = Math.max(H.x - 40, Math.min(H.x + 40, px + (Math.random() < 0.5 ? -8 : 8))); m.by = Math.min(py - 9, surf - 8); }
      steer(m.bx + Math.cos(m.t * 2.8) * 3.5, m.by + Math.sin(m.t * 2.8) * 3.5, 7, 6);
      if (m.moveT > 1.3 && !m.fired) { m.fired = 1; paraBirth(m, 2 + ph); m.broodT = 11 / rage; }
      if (m.moveT > 2.4) setParaMove(m, 'hunt');
      break;
    }
    case 'coil': {   // runs a tightening ring around you - go out through the gap
      const a = Math.atan2(cy - py, cx - px);
      if (m.stage === 'wind') {
        if (!m.cr) { sfx('parasite.roar', { pitch: 0.74 }); m.cr = Math.max(9, Math.min(13, Math.hypot(cx - px, cy - py))); }
        m.cr = Math.max(4.2, (m.cr || 10) - dt * 1.9);
        steer(px + Math.cos(a + 0.7 * m.cdir) * m.cr, Math.min(py + Math.sin(a + 0.7 * m.cdir) * m.cr, surf + 8), 15, 6);
        if (m.moveT > 3.2) { m.stage = 'snap'; m.moveT = 0; m.mawT = 1; sfx('parasite.bite'); }
      } else {
        steer(px, py, 24, 3);
        if (m.moveT > 0.9) setParaMove(m, 'hunt');
      }
      break;
    }
  }
  // ---- move (through air and sand alike) and stay in its part of the world ----
  m.x += m.vx * dt; m.y += m.vy * dt;
  m.x = Math.max(H.x - 85, Math.min(H.x + 85 - m.w, m.x));
  m.y = Math.max(Math.max(2, surf - 38), Math.min(Math.min(surf + 21, WORLD_H - BEDROCK_ROWS - 3) - m.h, m.y));
  m.facingDir = Math.cos(m.ang || 0) >= 0 ? 1 : -1;
  parasiteSegs(m);
  // ---- touching ANY part of it hurts ----
  if (m.move !== 'intro' && m.contactCd <= 0) {
    const sp = m.sp, n = m.nseg;
    for (const q of bossVictims()) {
      let dmg = 0, fx = cx;
      if (boxDistToPoint(q, cx, cy) < 1.2) dmg = 6;
      else for (let i = 0; i < n; i++) { const s = sp[i]; if (boxDistToPoint(q, s.x, s.y) < paraRadius(i, PARA.n) * 0.85) { dmg = 4; fx = s.x; break; } }
      if (dmg) { bossHitPlayer(m.move === 'dive' && m.stage === 'plunge' || m.stage === 'erupt' || m.stage === 'snap' ? dmg + 2 : dmg, fx, q, 0, { kb: [9, 5], iframes: 0.55 }); m.contactCd = 0.35; }
    }
  }
  m.soundCd -= dt;
  if (m.soundCd <= 0) { m.soundCd = 5 + Math.random() * 5; sfx('apexparasite.say'); }
}
// ---- dying, leaving, loot ----
function parasiteDying(m, dt) {
  m.dying += dt;
  m.shakeAmt = 1.2; m.hurtFlash = 0.1; m.mawT = 1; m.maw = 1;
  m.ang += dt * 1.8; m.spd = approach(m.spd || 0, 5, 8 * dt);
  m.x += Math.cos(m.ang) * m.spd * dt; m.y += (Math.sin(m.ang) * m.spd * 0.5 + 1.5) * dt;
  parasiteSegs(m);
  const left = Math.max(0, PARA.n - Math.floor(m.dying / 0.15));   // the body blows apart from the tail forward
  if (left < m.nseg) {
    for (let i = m.nseg - 1; i >= left; i--) { const s = m.sp[i]; explodeFX(s.x, s.y, i % 4 === 0); for (let k = 0; k < 6; k++) Game.particles.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 5, life: 0.8, age: 0, size: 0.12, color: ['#b6ff3a', '#e6d6a8', '#5b2415'][k % 3], gravity: 8 }); }
    m.nseg = left; screenShake(0.15); if (left % 3 === 0) sfx('parasite.burst', { vol: 0.9 });   // (1.3.2)
  }
  if (m.dying >= 3.6) {
    for (let i = 0; i < 3; i++) explodeFX(m.x + m.w / 2 + (Math.random() - 0.5) * 2, m.y + m.h / 2 + (Math.random() - 0.5) * 2, true);
    flashDamage(); screenShake(1.2);
    finishMobDeath(m);
  }
}
// it gave up (everyone fell or ran): the totem is left behind for another try
function parasiteLeft(m) {
  const H = m.pHome || { x: m.x, y: m.y };
  const d = spawnDrop(PARASITE_TOTEM, 1, H.x, H.y);
  if (d) { d.vx = 0; d.vy = -3; }
}

// ---- VISUALS (drawing and effects) ----
// sand thrown up where a body crosses the surface
function sandPuff(x, y, n) {
  const k = Math.max(1, Math.round((n || 5) * particleMul()));
  for (let i = 0; i < k; i++) Game.particles.push({ x: x + (Math.random() - 0.5) * 1.2, y: y + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 4, vy: -1.5 - Math.random() * 3.5, life: 0.5 + Math.random() * 0.4, age: 0, size: 0.1 + Math.random() * 0.12, color: ['#d9b873', '#c9a35f', '#e8cf94'][i % 3], gravity: 9 });
}
// ---- drawing ------------------------------------------------------------------
// (1.0.1 remaster) The Parasite is PIXEL ART now, like every other boss. Its whole body is painted onto a
// small grid (16 pixels to a block, lined up with the world's own pixels), then blown up with no
// smoothing. Each ring, the head, the jaw, the frill and the feelers is painted as its own piece:
//   1. the piece fills its pixels with MATERIALS (shell, belly bone, flesh, ooze, teeth...)
//   2. it is shaded the way the other monsters are: edges facing up catch the light, edges facing down
//      are in shadow (worked out on the screen grid, so it is lit from above however it is turned)
//   3. it gets a dark outline, drawn over whatever is behind it (so every ring stands out from the last)
const PARA_COL = {
  shell: '#e6d6a8', shellHi: '#fff3cf', shellLo: '#b39a63', shellDk: '#6e5a33', shellDk2: '#463619',
  flesh: '#5b2415', fleshHi: '#8e3a1e', fleshLo: '#41180c', fleshDk: '#2a0e07', fleshGlow: '#7d8222',
  ooze: '#b6ff3a', oozeHi: '#f0ffa8', oozeMid: '#7fd424', oozeDk: '#4d8a14', eye: '#f4ff5a', eyeHi: '#ffffe6',
  maw: '#1a0905', tooth: '#fff1c8', toothHi: '#ffffff', ol: '#1c0c07',
};
const PARA_HIT = (() => {   // what it looks like when it is hurt: everything pulled toward red
  const out = {};
  for (const k in PARA_COL) {
    const n = parseInt(PARA_COL[k].slice(1), 16), mix = (a, b) => Math.round(a + (b - a) * 0.55);
    out[k] = `rgb(${mix((n >> 16) & 255, 255)},${mix((n >> 8) & 255, 60)},${mix(n & 255, 40)})`;
  }
  return out;
})();
// ---- the materials: [family, base tone, 4-tone ramp (light -> dark), flat?]. Shading only sees the edges
// between FAMILIES, so a darker part of the same shell (Sd) doesn't get a seam drawn round it ----
const PR_SHELL = ['shellHi', 'shell', 'shellLo', 'shellDk'], PR_BONE = ['shell', 'shellLo', 'shellDk', 'shellDk2'];
const PR_FLESH = ['fleshHi', 'flesh', 'fleshLo', 'fleshDk'], PR_OOZE = ['oozeHi', 'ooze', 'oozeMid', 'oozeDk'], PR_TOOTH = ['toothHi', 'tooth', 'shell', 'shellLo'];
const PM = {}, PR_MATS = [null];
[
  ['S', 1, 1, PR_SHELL], ['Sd', 1, 2, PR_SHELL], ['Sl', 1, 0, PR_SHELL], ['G', 2, 0, ['shellDk'], 1],
  ['B', 3, 1, PR_BONE], ['Bd', 3, 2, PR_BONE],
  ['F', 4, 1, PR_FLESH], ['Fd', 4, 2, PR_FLESH], ['Fh', 4, 0, PR_FLESH], ['Fg', 4, 0, ['fleshGlow'], 1],
  ['O', 5, 1, PR_OOZE], ['Od', 5, 2, PR_OOZE], ['Oh', 5, 0, ['oozeHi'], 1], ['D', 6, 0, ['oozeDk'], 1],
  ['K', 2, 0, ['fleshDk'], 1], ['Kg', 2, 0, ['ooze'], 1],
  ['H', 7, 1, PR_SHELL], ['Hd', 7, 2, PR_SHELL],
  ['T', 8, 1, PR_TOOTH], ['M', 9, 0, ['maw'], 1], ['W', 10, 0, ['ooze'], 1], ['Wd', 10, 0, ['oozeDk'], 1],
  ['P', 11, 0, ['fleshDk'], 1], ['L', 12, 2, PR_SHELL],
].forEach(([k, fam, tone, ramp, flat]) => { PM[k] = PR_MATS.length; PR_MATS.push({ fam, tone, ramp, flat: !!flat }); });
const PR_FAM = new Uint8Array(PR_MATS.length), PR_TONE = new Uint8Array(PR_MATS.length), PR_FLAT = new Uint8Array(PR_MATS.length);
PR_MATS.forEach((M, i) => { if (M) { PR_FAM[i] = M.fam; PR_TONE[i] = M.tone; PR_FLAT[i] = M.flat ? 1 : 0; } });
// the palette as packed pixels (little-endian ABGR, alpha left out): pal[material][tone], plus the outline
const PR_PAL = new Map();
function paraPal(P) {
  let out = PR_PAL.get(P);
  if (out) return out;
  const px = (c) => { const m = c.match(/\d+/g), n = c[0] === '#' ? parseInt(c.slice(1), 16) : 0, [r, g, b] = c[0] === '#' ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : m.map(Number); return (b << 16) | (g << 8) | r; };
  out = { mats: PR_MATS.map(M => M && M.ramp.map(k => px(P[k]))), ol: px(P.ol), eye: px(P.eye), eyeHi: px(P.eyeHi), sock: px(P.fleshDk), dust: px(P.shellLo) };
  PR_PAL.set(P, out);
  return out;
}
// ---- the pixel buffer ----
const PXR = { c: null, g: null, img: null, d: null, lay: null, CW: 0, CH: 0, W: 0, H: 0, ox: 0, oy: 0, x0: 1e9, y0: 1e9, x1: -1, y1: -1 };
function pxrBegin(W, H, ox, oy) {
  if (!PXR.c) { PXR.c = document.createElement('canvas'); PXR.g = PXR.c.getContext('2d'); }
  if (W > PXR.CW || H > PXR.CH) {
    PXR.CW = Math.max(W, PXR.CW); PXR.CH = Math.max(H, PXR.CH);
    PXR.c.width = PXR.CW; PXR.c.height = PXR.CH;
    PXR.img = PXR.g.createImageData(PXR.CW, PXR.CH); PXR.d = new Uint32Array(PXR.img.data.buffer); PXR.lay = new Uint8Array(PXR.CW * PXR.CH);
  } else PXR.d.fill(0, 0, PXR.CW * (H + 1));
  PXR.W = W; PXR.H = H; PXR.ox = ox; PXR.oy = oy;
}
// paint one piece: sh(lx, ly, gx, gy) -> material, for the pixels whose centres fall in the local box
// [lx0, lx1] x [ly0, ly1] of a piece at (cx, cy) (buffer pixels), turned by ang (and flipped so its back is up)
function pxrPiece(cx, cy, ang, flip, lx0, lx1, ly0, ly1, sh) {
  const ca = Math.cos(ang), sa = Math.sin(ang), CW = PXR.CW, lay = PXR.lay;
  let X0 = 1e9, X1 = -1e9, Y0 = 1e9, Y1 = -1e9;
  for (const lx of [lx0, lx1]) for (const ly of [ly0, ly1]) { const y = ly * flip, X = cx + lx * ca - y * sa, Y = cy + lx * sa + y * ca; X0 = Math.min(X0, X); X1 = Math.max(X1, X); Y0 = Math.min(Y0, Y); Y1 = Math.max(Y1, Y); }
  const i0 = Math.max(1, Math.floor(X0)), i1 = Math.min(PXR.W - 2, Math.ceil(X1)), j0 = Math.max(1, Math.floor(Y0)), j1 = Math.min(PXR.H - 2, Math.ceil(Y1));
  if (i1 < i0 || j1 < j0) return;
  for (let j = j0; j <= j1; j++) {
    const py = j + 0.5 - cy;
    for (let i = i0; i <= i1; i++) {
      const px = i + 0.5 - cx, lx = px * ca + py * sa, ly = (py * ca - px * sa) * flip;
      if (lx < lx0 || lx > lx1 || ly < ly0 || ly > ly1) continue;
      const id = sh(lx, ly, i + PXR.ox, j + PXR.oy);
      if (id) lay[j * CW + i] = id;
    }
  }
  PXR.x0 = Math.min(PXR.x0, i0); PXR.x1 = Math.max(PXR.x1, i1); PXR.y0 = Math.min(PXR.y0, j0); PXR.y1 = Math.max(PXR.y1, j1);
}
// a 1-pixel line of one material (the feelers), in buffer pixels
function pxrLine(x0, y0, x1, y1, id) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))), CW = PXR.CW;
  for (let k = 0; k <= n; k++) {
    const i = Math.floor(x0 + (x1 - x0) * k / n), j = Math.floor(y0 + (y1 - y0) * k / n);
    if (i < 1 || j < 1 || i > PXR.W - 2 || j > PXR.H - 2) continue;
    PXR.lay[j * CW + i] = id;
    PXR.x0 = Math.min(PXR.x0, i); PXR.x1 = Math.max(PXR.x1, i); PXR.y0 = Math.min(PXR.y0, j); PXR.y1 = Math.max(PXR.y1, j);
  }
}
// shade the piece, outline it, and lay it over the picture (alpha: 255, or less for the parts under the sand)
function pxrFlush(pal, alpha) {
  if (PXR.x1 < PXR.x0) return;
  const CW = PXR.CW, lay = PXR.lay, d = PXR.d, A = (alpha << 24) >>> 0, ol = (pal.ol | A) >>> 0;
  const x0 = Math.max(1, PXR.x0 - 1), x1 = Math.min(PXR.W - 2, PXR.x1 + 1), y0 = Math.max(1, PXR.y0 - 1), y1 = Math.min(PXR.H - 2, PXR.y1 + 1);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
    const k = j * CW + i, id = lay[k], up = lay[k - CW], dn = lay[k + CW], lf = lay[k - 1], rt = lay[k + 1];
    if (!id) { if (up || dn || lf || rt) d[k] = ol; continue; }
    let t = PR_TONE[id];
    if (!PR_FLAT[id]) {
      const f = PR_FAM[id], U = PR_FAM[up] !== f, Dn = PR_FAM[dn] !== f, L = PR_FAM[lf] !== f, R = PR_FAM[rt] !== f;
      if (U && !Dn) t--; else if (Dn && !U) t++; else if (L && !R) t--; else if (R && !L) t++;
      t = t < 0 ? 0 : t > 3 ? 3 : t;
    } else t = 0;
    d[k] = (pal.mats[id][t] | A) >>> 0;
  }
  for (let j = PXR.y0; j <= PXR.y1; j++) lay.fill(0, j * CW + PXR.x0, j * CW + PXR.x1 + 1);
  PXR.x0 = PXR.y0 = 1e9; PXR.x1 = PXR.y1 = -1;
}
// one square pixel-art eye (it doesn't turn: an eye is a few square pixels whichever way the head faces)
function pxrEye(x, y, s, pal, alpha, frenzy) {
  const A = (alpha << 24) >>> 0, i0 = Math.round(x - s / 2), j0 = Math.round(y - s / 2);
  for (let j = j0 - 1; j <= j0 + s; j++) for (let i = i0 - 1; i <= i0 + s; i++) {
    if (i < 0 || j < 0 || i >= PXR.W || j >= PXR.H) continue;
    const rim = i < i0 || j < j0 || i >= i0 + s || j >= j0 + s;
    if (rim && (i < i0 || i >= i0 + s) && (j < j0 || j >= j0 + s)) continue;   // (rounded corners)
    PXR.d[j * PXR.CW + i] = ((rim ? pal.sock : i === i0 && j === j0 && s > 1 && !frenzy ? pal.eyeHi : pal.eye) | A) >>> 0;
  }
}
// ---- shape helpers (local pixels) ----
function prIn(P, x, y) {   // inside a polygon [x0, y0, x1, y1, ...]?
  let c = false;
  for (let a = 0, b = P.length - 2; a < P.length; b = a, a += 2) if ((P[a + 1] > y) !== (P[b + 1] > y) && x < (P[b] - P[a]) * (y - P[a + 1]) / (P[b + 1] - P[a + 1]) + P[a]) c = !c;
  return c;
}
function prSeg(x, y, ax, ay, bx, by) {   // distance from a point to a line segment
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, k = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
  return Math.hypot(x - ax - dx * k, y - ay - dy * k);
}
function prLine(x, y, P) { let d = 1e9; for (let k = 0; k + 3 < P.length; k += 2) d = Math.min(d, prSeg(x, y, P[k], P[k + 1], P[k + 2], P[k + 3])); return d; }
function prTri(x, y, ax, ay, bx, by, cx, cy) {
  const s1 = (bx - ax) * (y - ay) - (by - ay) * (x - ax), s2 = (cx - bx) * (y - by) - (cy - by) * (x - bx), s3 = (ax - cx) * (y - cy) - (ay - cy) * (x - cx);
  return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
}
const prScale = (P, R) => P.map(v => v * R);
// the still parts of a piece (its plates, spines, skull...) are worked out once, into a fine grid of
// materials in its own frame (3 x 3 samples a pixel, both checker colours), then just looked up each frame
const PR_GRID = new Map(), PR_Q = 3;
function prGrid(key, lx0, lx1, ly0, ly1, sh) {
  let G = PR_GRID.get(key);
  if (G) return G;
  const gw = Math.ceil((lx1 - lx0) * PR_Q), gh = Math.ceil((ly1 - ly0) * PR_Q), a = new Uint8Array(gw * gh * 2);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const lx = lx0 + (x + 0.5) / PR_Q, ly = ly0 + (y + 0.5) / PR_Q, k = (y * gw + x) * 2;
    a[k] = sh(lx, ly, 0, 0); a[k + 1] = sh(lx, ly, 1, 0);
  }
  G = { a, gw, gh, lx0, ly0 }; PR_GRID.set(key, G);
  return G;
}
function prAt(G, lx, ly, par) {
  const x = Math.floor((lx - G.lx0) * PR_Q), y = Math.floor((ly - G.ly0) * PR_Q);
  return x < 0 || y < 0 || x >= G.gw || y >= G.gh ? 0 : G.a[(y * G.gw + x) * 2 + par];
}
// ---- the head, in units of its size R (it faces right, its back is up) ----
const PH_R = 1.4 * 16;
const PH = {
  skull: prScale([-1.0, -0.2, -0.98, -0.62, -0.78, -0.92, -0.45, -1.1, -0.05, -1.14, 0.35, -1.03, 0.72, -0.85, 1.06, -0.6, 1.32, -0.3, 1.44, -0.08, 1.4, 0.18, 1.24, 0.03, 0.3, -0.01, -0.12, 0.1, -0.55, 0.3, -0.95, 0.18], PH_R),
  brow: prScale([-0.86, -0.5, -0.3, -0.72, 0.1, -0.86, 0.5, -0.78, 0.92, -0.6, 1.22, -0.34], PH_R),
  cheek: prScale([-0.9, -0.06, -0.4, -0.22, 0.25, -0.2], PH_R),
  seams: [[0.82, -0.82, 0.86, -0.56], [1.08, -0.6, 1.14, -0.38]].map(s => prScale(s, PH_R)),
  horns: [[-0.86, -0.72, -0.56, -1.0, -1.42, -1.28], [-0.5, -1.04, -0.12, -1.13, -0.98, -1.66], [-0.08, -1.13, 0.3, -1.04, -0.42, -1.6]].map(s => prScale(s, PH_R)),
  neck: prScale([-1.08, -0.64, -0.3, -0.82, -0.3, 0.82, -1.08, 0.64], PH_R),
  frillUp: prScale([-0.5, -0.72, -1.22, -1.22, -1.1, -0.9, -1.66, -1.0, -1.32, -0.7, -1.82, -0.6, -1.06, -0.38], PH_R),
  frillDn: prScale([-0.55, 0.45, -1.18, 0.98, -1.04, 0.68, -1.56, 0.74, -1.22, 0.44, -1.62, 0.3, -0.95, 0.2], PH_R),
  rays: [[-0.62, -0.6, -1.22, -1.18], [-0.62, -0.6, -1.6, -0.98], [-0.62, -0.6, -1.76, -0.62], [-0.62, 0.36, -1.16, 0.92], [-0.62, 0.36, -1.52, 0.72]].map(s => prScale(s, PH_R)),
  jaw: prScale([-0.15, -0.2, 0.4, -0.16, 1.2, -0.14, 1.42, -0.36, 1.38, -0.02, 1.12, 0.3, 0.4, 0.42, 0.0, 0.4, -0.25, 0.2], PH_R),
  eyes: [[0.12, -0.66, 2], [0.46, -0.56, 3], [0.8, -0.42, 2]],
};
// one ring of the body (local pixels: x runs toward the head, y < 0 is its back). Its box, and its still
// parts (worked out once per ring and phase); the glowing sac is added on top each frame (it swells)
function paraSegBox(i) {
  const r = paraRadius(i, PARA.n) * 16, l = PARA.gap * 16 * 0.58;
  return [i === PARA.n - 1 ? -l * 3 : -l * 1.2, l * 1.1, -r * 1.8, r * 1.1];
}
function paraSegStatic(i, ph) {
  const r = paraRadius(i, PARA.n) * 16, l = PARA.gap * 16 * 0.58, last = i === PARA.n - 1;
  const plateY = -r * (ph >= 3 ? 0.74 : ph === 2 ? 0.58 : 0.44), bellyY = r * (ph >= 3 ? 0.8 : ph === 2 ? 0.68 : 0.58);
  const spine = i % 2 === 0 && r > 9 ? r * (ph >= 3 ? 0.35 : 0.62) : 0, seam = -l * 0.32, sacY = r * 0.1;
  const h = ((i * 73 + 17) % 11) / 11, crack = ph >= 2 ? [-l * 0.1 + h * l * 0.4, -r * 1.05, -l * 0.25 + h * l * 0.3, -r * 0.82, l * 0.05 + h * l * 0.2, plateY + r * 0.05] : null;
  const chip = ph >= 3 && h > 0.35;   // in the frenzy some plates have lost a corner
  const K = ph >= 3 ? PM.Kg : PM.K;
  return (x, y, gx, gy) => {
    const ck = (gx + gy) & 1;
    // the stinger, behind the last ring
    if (last && x < -l * 0.7) {
      if (Math.hypot(x + l * 2.55, y - 1.5) < 1.7) return PM.O;
      if (!prTri(x, y, -l * 0.7, -r * 0.62, -l * 2.9, -r * 0.05, -l * 0.7, r * 0.5)) return 0;
      return Math.abs(y + r * 0.08) < 0.6 && x < -l * 1.0 ? PM.G : y > r * 0.12 ? PM.Sd : PM.S;
    }
    const rr = r * (1 + 0.06 * x / l), ax = Math.abs(x) / l, ay = Math.abs(y) / rr;
    const body = ax * ax * ax * ax + ay * ay * ay * ay <= 1;
    // a hooked spine on the back, swept toward the tail
    if (spine && y < -r * 0.8 && prTri(x, y, -l * 0.42, -r * 0.84, l * 0.26, -r * 0.84, -l * 0.78, -r - spine)) return x < -l * 0.2 && y > -r - spine * 0.35 ? PM.Hd : PM.H;
    // the plate on its back: a little bigger than the ring and lapping back over the one behind
    if (y < plateY) {
      const px = Math.abs(x + l * 0.08) / (l * 1.08), py = Math.abs(y) / (rr * 1.07);
      if (px * px * px * px + py * py * py * py <= 1) {
        if (chip && x > l * 0.35 && y < -r * 0.8) return body ? PM.Fd : 0;
        if (crack && prLine(x, y, crack) < 0.6) return K;
        if (Math.abs(x - seam) < 0.55) return PM.G;
        if (y > plateY - 2.2) return PM.Sd;                                  // the plate's thick lower edge
        if (y < -r * 0.62 && y > -r * 0.62 - 1.2 && ck && Math.abs(x) < l * 0.7) return PM.Sl;   // (a glint along the top)
        return PM.S;
      }
    }
    if (!body) return 0;
    if (y > bellyY) return y > bellyY + 2.4 ? PM.Bd : PM.B;   // the belly plate
    if (i % 2 === 0) {   // a breathing pore, with a puckered rim
      const d = Math.hypot(x, y - sacY);
      if (d < r * 0.13 + 0.6) return PM.P;
      if (d < r * 0.13 + 1.7) return y < sacY ? PM.Fd : PM.Fh;
    }
    if (Math.abs(x - l * 0.62) < 0.55 || Math.abs(x + l * 0.62) < 0.55) return PM.Fd;   // muscle ridges
    return y > r * 0.22 ? PM.Fd : PM.F;
  };
}
// the head, in pieces: the skull (crest, brow, snout) / the jaw / the frill and the neck. Boxes in units of R.
const PH_BOX = { skull: [-1.5, 1.5, -1.7, 0.25], jaw: [-0.3, 1.5, -0.5, 0.5], frill: [-1.9, -0.25, -1.3, 1.05] };
function paraSkullStatic() {
  const S = PH.skull, R = PH_R;
  return (x, y) => {
    for (const [ax, ay, bx, by, cx, cy] of PH.horns) if (prTri(x, y, ax, ay, bx, by, cx, cy)) return (x - cx) * 0.3 + (y - cy) > (by - cy) * 0.6 ? PM.Hd : PM.H;
    if (!prIn(S, x, y)) return 0;
    if (prLine(x, y, PH.brow) < 0.6) return PM.G;
    for (const s of PH.seams) if (prLine(x, y, s) < 0.55) return PM.G;
    if (Math.hypot(x - 1.18 * R, y + 0.2 * R) < 1.2) return PM.P;   // a nostril pit
    if (prLine(x, y, PH.cheek) < 0.55) return PM.Sd;
    const under = y > -0.62 * R + (x / R) * 0.18 * R;   // below the brow: the face, a shade darker
    return y > -0.1 * R ? PM.Sd : under ? PM.S : PM.Sl;
  };
}
function paraJawStatic() {   // in the jaw's own frame (hinge at 0,0)
  const R = PH_R;
  return (jx, jy) => {
    if (jy < -0.14 * R && jx > 0.16 * R && jx < 1.16 * R) {   // the lower teeth
      for (let k = 0; k < 5; k++) { const tx = (0.18 + k * 0.2) * R; if (prTri(jx, jy, tx, -0.14 * R, tx + 0.17 * R, -0.14 * R, tx + 0.085 * R, -(0.34 + 0.08 * (k % 2)) * R)) return PM.T; }
    }
    if (!prIn(PH.jaw, jx, jy)) return 0;
    if (Math.abs(jy - 0.2 * R) < 0.55 && jx > 0.05 * R && jx < 1.0 * R) return PM.G;
    return jy > 0.24 * R ? PM.Bd : PM.B;
  };
}
function paraFrillStatic() {
  return (x, y) => {
    const up = prIn(PH.frillUp, x, y), dn = !up && prIn(PH.frillDn, x, y);
    if (up || dn) {
      for (const s of PH.rays) if (prSeg(x, y, s[0], s[1], s[2], s[3]) < 0.55) return PM.G;
      return dn ? PM.Bd : PM.Sd;
    }
    if (prIn(PH.neck, x, y)) return y > 0.3 * PH_R ? PM.Fd : PM.F;
    return 0;
  };
}
const phGrid = (k, sh) => { const b = PH_BOX[k]; return prGrid('h.' + k, b[0] * PH_R, b[1] * PH_R, b[2] * PH_R, b[3] * PH_R, sh); };
function renderParasite(m, originX, originY) {
  if (m.dead) return;
  const sp = parasiteSegs(m), n = m.nseg == null ? PARA.n : m.nseg, t = Game.time, T = TILE, u = T / 16;
  const P = m.hurtFlash > 0 || m.dying != null ? PARA_HIT : PARA_COL, pal = paraPal(P);
  const jx = m.shakeAmt ? Math.round((Math.random() - 0.5) * m.shakeAmt * 2.2) : 0, jy = m.shakeAmt ? Math.round((Math.random() - 0.5) * m.shakeAmt * 2.2) : 0;   // (the shake moves it in whole pixels)
  // where it will come up: a column of dust-coloured light on the sand, in hard pixel bands
  if (m.move === 'burrow' && m.stage === 'stalk' && m.dying == null) {
    const wx = Math.round((originX + m.warnX * T) / u) * u, sy = originY + m.surfY * T, a = 0.14 + 0.1 * Math.sin(t * 16), bw = Math.round(2.2 * 16) * u;
    for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(182,255,58,${((a + 0.12) * (k + 1) / 6).toFixed(3)})`; ctx.fillRect(wx - bw / 2 + (k % 2 ? u : 0), sy - (6 - k) * 1.5 * T, bw - (k % 2 ? 2 * u : 0), 1.5 * T); }
  }
  // the box of the grid to paint: around the body, cut down to the screen
  const hx = (m.x + m.w / 2) * 16, hy = (m.y + m.h / 2) * 16;
  let X0 = hx - 64, X1 = hx + 64, Y0 = hy - 64, Y1 = hy + 64;
  for (let i = 0; i < n; i++) { const s = sp[i]; X0 = Math.min(X0, s.x * 16 - 48); X1 = Math.max(X1, s.x * 16 + 48); Y0 = Math.min(Y0, s.y * 16 - 48); Y1 = Math.max(Y1, s.y * 16 + 48); }
  X0 = Math.max(Math.floor(X0), Math.floor(-originX / u) - 4); X1 = Math.min(Math.ceil(X1), Math.ceil((VIEW.w - originX) / u) + 4);
  Y0 = Math.max(Math.floor(Y0), Math.floor(-originY / u) - 4); Y1 = Math.min(Math.ceil(Y1), Math.ceil((VIEW.h - originY) / u) + 4);
  if (X1 <= X0 || Y1 <= Y0) return;
  pxrBegin(X1 - X0, Y1 - Y0, X0, Y0);
  const flipOf = (a) => Math.cos(a) < 0 ? -1 : 1, l = PARA.gap * 16 * 0.58;
  // ---- the body: tail first, so each ring laps over the one behind it ----
  const ph = m.phase || 1, F = PM.F, Fd = PM.Fd;
  for (let i = n - 1; i >= 0; i--) {
    const s = sp[i], r = paraRadius(i, PARA.n) * 16, b = paraSegBox(i), G = prGrid('s' + i + '.' + ph, b[0], b[1], b[2], b[3], paraSegStatic(i, ph));
    let sh = (x, y, gx, gy) => prAt(G, x, y, (gx + gy) & 1);
    if (i % 2 === 1) {   // the sac: it pulses, and swells up when it's about to burst
      const rad = r * (0.27 + 0.07 * (0.5 + 0.5 * Math.sin(t * 4 + i * 0.9)) + 0.2 * (m.sacs || 0)), sx = l * 0.05, sy = r * 0.1, R1 = rad + 1.1, R3 = rad + 3;
      sh = (x, y, gx, gy) => {
        const id = prAt(G, x, y, (gx + gy) & 1);
        if (id !== F && id !== Fd) return id;
        const dx = x - sx, dy = y - sy, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= R3) return id;
        if (d < rad) return Math.hypot(dx + rad * 0.35, dy + rad * 0.38) < rad * 0.3 ? PM.Oh : dx + dy > rad * 0.45 ? PM.Od : PM.O;
        return d < R1 ? PM.D : (gx + gy) & 1 ? PM.Fg : id;   // (a membrane, then a dithered glow in the flesh)
      };
    }
    pxrPiece(s.x * 16 - X0, s.y * 16 - Y0, s.ang, flipOf(s.ang), b[0], b[1], b[2], b[3], sh);
    pxrFlush(pal, s.u ? 128 : 255);
  }
  // ---- the head ----
  if (n > 0) {
    const a = m.ang || 0, f = flipOf(a), cx = hx - X0, cy = hy - Y0, R = PH_R, al = m.hu ? 140 : 255;
    const open = Math.max(0, Math.min(1, (m.maw || 0) + 0.12 + 0.1 * Math.sin(t * 7)));
    const ca = Math.cos(a), sa = Math.sin(a), at = (lx, ly) => [cx + lx * ca - ly * f * sa, cy + lx * sa + ly * f * ca];
    // the feelers, trailing back from the crown
    for (const sd of [0, 1]) {
      let [qx, qy] = at(-0.25 * R, -(0.9 + sd * 0.06) * R);
      for (let k = 1; k <= 7; k++) {
        const [nx, ny] = at(-(0.25 + k * 0.36) * R, -(0.9 + sd * 0.12 + k * 0.075) * R + Math.sin(t * 5 + k * 0.7 + sd * 2) * 0.16 * R * (k / 7));
        pxrLine(qx, qy, nx, ny, PM.L); qx = nx; qy = ny;
      }
      pxrPiece(qx, qy, 0, 1, -2, 2, -2, 2, (x, y) => x * x + y * y < 3.2 ? (x + y < -0.5 ? PM.Oh : PM.O) : 0);
    }
    pxrFlush(pal, al);
    const Gf = phGrid('frill', paraFrillStatic()), Gj = phGrid('jaw', paraJawStatic()), Gs = phGrid('skull', paraSkullStatic());
    const fb = PH_BOX.frill, sb = PH_BOX.skull;
    pxrPiece(cx, cy, a, f, fb[0] * R, fb[1] * R, fb[2] * R, fb[3] * R, (x, y, gx, gy) => prAt(Gf, x, y, (gx + gy) & 1)); pxrFlush(pal, al);
    // the jaw swings open on its hinge; the mouth behind it is dark, with a green glow down the throat
    const hjx = -0.1 * R, hjy = 0.3 * R, ja = open * 0.7, jc = Math.cos(ja), js = Math.sin(ja);
    const maw = [-0.12 * R, -0.05 * R, 1.25 * R, -0.05 * R, hjx + 1.3 * R * jc - 0.1 * R * js, hjy + 1.3 * R * js + 0.1 * R * jc, hjx, hjy];
    const tgx = 0.28 * R, tgy = (0.1 + open * 0.24) * R, tgr = (0.16 + open * 0.14) * R * (0.9 + 0.12 * Math.sin(t * 6));
    pxrPiece(cx, cy, a, f, -0.4 * R, 1.6 * R, -0.5 * R, 1.6 * R, (x, y, gx, gy) => {
      const id = prAt(Gj, (x - hjx) * jc + (y - hjy) * js, (y - hjy) * jc - (x - hjx) * js, (gx + gy) & 1);
      if (id || !prIn(maw, x, y)) return id;
      const g = Math.hypot((x - tgx) / 1.3, y - tgy);
      return g < tgr * 0.7 ? PM.W : g < tgr && ((gx + gy) & 1) ? PM.Wd : PM.M;
    });
    pxrFlush(pal, al);
    // the skull, and its teeth (they reach further down as the mouth opens)
    const tTop = -0.03 * R, tLen = (0.22 + 0.1 * open) * R;
    pxrPiece(cx, cy, a, f, sb[0] * R, sb[1] * R, sb[2] * R, Math.max(sb[3] * R, tLen + 0.1 * R), (x, y, gx, gy) => {
      const id = prAt(Gs, x, y, (gx + gy) & 1);
      if (id || y < tTop || x < 0.2 * R || x > 1.22 * R) return id;
      for (let k = 0; k < 5; k++) { const tx = (0.22 + k * 0.2) * R; if (prTri(x, y, tx, tTop, tx + 0.18 * R, tTop, tx + 0.09 * R, tLen + 0.08 * (k % 2) * R)) return PM.T; }
      return 0;
    });
    pxrFlush(pal, al);
    for (const [ex, ey, es] of PH.eyes) { const [x, y] = at(ex * R, ey * R); pxrEye(x, y, es, pal, al, m.phase >= 3); }
  }
  // (get the next phase's rings ready a few at a time, so the molt doesn't stall the game)
  if (ph < 3 && loop.frames % 2 === 0) for (let i = 0; i < PARA.n; i++) if (!PR_GRID.has('s' + i + '.' + (ph + 1))) { const b = paraSegBox(i); prGrid('s' + i + '.' + (ph + 1), b[0], b[1], b[2], b[3], paraSegStatic(i, ph + 1)); break; }
  // ---- onto the screen, every grid pixel a crisp square ----
  PXR.g.putImageData(PXR.img, 0, 0, 0, 0, PXR.W, PXR.H);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(PXR.c, 0, 0, PXR.W, PXR.H, originX + (X0 + jx) * u, originY + (Y0 + jy) * u, PXR.W * u, PXR.H * u);
  ctx.restore();
}
function renderParasiteGlow(m, originX, originY, glow) {
  if (m.dead || !m.sp) return;
  const n = m.nseg == null ? PARA.n : m.nseg, T = TILE, t = Game.time;
  for (let i = 1; i < n; i += 2) {   // the sacs
    const s = m.sp[i], pulse = 0.5 + 0.5 * Math.sin(t * 4 + i * 0.9);
    glow(originX + s.x * T, originY + s.y * T, T * (1.1 + (m.sacs || 0) * 1.3), '170,255,50', (0.18 + 0.16 * pulse + 0.4 * (m.sacs || 0)) * (s.u ? 0.5 : 1));
  }
  const hx = originX + (m.x + m.w / 2) * T, hy = originY + (m.y + m.h / 2) * T;
  glow(hx, hy, T * 1.7, '190,255,60', 0.07 + 0.18 * (m.maw || 0));
}
// a glob of acid hitting something
function acidFX(x, y) {
  if (Net.fxCapture) { netFx(['a', r1(x), r1(y)]); const was = Net.fxCapture; Net.fxCapture = false; try { acidFX(x, y); } finally { Net.fxCapture = was; } return; }
  const k = Math.max(3, Math.round(14 * particleMul()));
  for (let i = 0; i < k; i++) { const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 4; Game.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 0.4 + Math.random() * 0.4, age: 0, size: 0.09 + Math.random() * 0.1, color: ['#b6ff3a', '#f0ffa8', '#4d8a14'][i % 3], gravity: 8 }); }
  sfx('explode', { x, y, vol: 0.3, pitch: 1.6 });
}

// ---- LOOT ----
function parasiteLoot(m, mx, my) {
  bossReward(m, 'parasite');
  const r = Math.random;
  // 20 Parasite Ingots (for armor, tools and the katana), plus gold, diamonds, emeralds and rubies
  const drops = [[RUIN_KEY, 1], [MANA_STAR, 1], [PARASITE_INGOT, 5], [129, 10 + Math.floor(r() * 7)], [120, 5 + Math.floor(r() * 5)], [134, 14 + Math.floor(r() * 9)], [145, 3 + Math.floor(r() * 3)]];
  for (const [it, q] of drops) { const d = spawnDrop(it, q, mx, my); if (d) { d.vx = (r() - 0.5) * 8; d.vy = -4 - r() * 4; } }
  if (Game.flags) Game.flags.parasiteDown = true;   // (1.2.1) opens the road to the Ancient Ruins and the King
  Game.boss = null;
  for (const x of Game.mobs) if (x.type === 'broodlarva') { x.dead = true; deathPuff(x.x + x.w / 2, x.y + x.h / 2, ['#b6ff3a', '#5b2415']); }
  eventMessage('The Apex Parasite has been defeated!', '#b6ff3a');
  setTimeout(() => eventMessage('It was carrying a Ruin Key... and the King of the Abyss can be woken now.', '#d6cfb4'), 2200);
  sfx('toast.challenge');
}

// ---- HARDMODE (a rematch after the Slayer): faster in everything (index.html, HM_BOSS22), it rains acid on
// everyone at the fight every few seconds, and it keeps birthing more larvae ----
BOSSES.apexparasite.hardmode = function (m, dt, p) {
  m.hmT22 = (m.hmT22 ?? 4) - dt; m.hmB22 = (m.hmB22 ?? 9) - dt;
  if (m.hmT22 <= 0) { m.hmT22 = (m.phase || 1) >= 3 ? 3 : 4.2; paraSpit(m, (m.phase || 1) >= 2 ? 3 : 2); }
  if (m.hmB22 <= 0) { m.hmB22 = 11; paraBirth(m, 2); }
};
