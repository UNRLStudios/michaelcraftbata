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
const PARA_COL = {
  shell: '#e6d6a8', shellHi: '#fff3cf', shellLo: '#b39a63', shellDk: '#6e5a33',
  flesh: '#5b2415', fleshHi: '#8e3a1e', fleshDk: '#2a0e07',
  ooze: '#b6ff3a', oozeHi: '#f0ffa8', oozeDk: '#4d8a14', eye: '#f4ff5a', maw: '#1a0905', tooth: '#fff1c8',
};
const PARA_HIT = (() => {   // what it looks like when it is hurt: everything pulled toward red
  const out = {};
  for (const k in PARA_COL) {
    const n = parseInt(PARA_COL[k].slice(1), 16), mix = (a, b) => Math.round(a + (b - a) * 0.55);
    out[k] = `rgb(${mix((n >> 16) & 255, 255)},${mix((n >> 8) & 255, 60)},${mix(n & 255, 40)})`;
  }
  return out;
})();
function paraPoly(g, pts, fill, stroke) {
  g.beginPath(); g.moveTo(pts[0], pts[1]);
  for (let k = 2; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]);
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = Math.max(1, TILE / 14); g.lineJoin = 'round'; g.stroke(); }
}
// one ring of the body, drawn along its own direction (screen position already translated)
function drawParaSeg(g, s, i, n, P, m, t) {
  const T = TILE, r = paraRadius(i, PARA.n) * T, l = PARA.gap * T * 0.58;
  g.save(); g.rotate(s.ang); if (Math.cos(s.ang) < 0) g.scale(1, -1);   // (the back always faces up)
  const th = r * (m.phase >= 3 ? 0.22 : m.phase === 2 ? 0.38 : 0.54), y0 = -r * 1.04;
  paraPoly(g, [-l, -r * 0.6, -l * 0.55, -r * 0.98, l * 0.55, -r * 0.98, l, -r * 0.6, l, r * 0.6, l * 0.55, r * 0.98, -l * 0.55, r * 0.98, -l, r * 0.6], P.flesh, P.fleshDk);
  g.fillStyle = P.fleshHi; g.fillRect(-l * 0.7, r * 0.3, l * 1.4, r * 0.16);
  // the swollen sac in the middle of every other ring
  if (i % 2 === 1) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + i * 0.9), rad = r * (0.26 + 0.08 * pulse + 0.2 * (m.sacs || 0));
    g.fillStyle = P.oozeDk; g.beginPath(); g.arc(0, 0, rad * 1.18, 0, 6.3); g.fill();
    g.fillStyle = P.ooze; g.beginPath(); g.arc(0, 0, rad, 0, 6.3); g.fill();
    g.fillStyle = P.oozeHi; g.fillRect(-rad * 0.45, -rad * 0.55, rad * 0.5, rad * 0.4);
  } else { g.fillStyle = P.fleshDk; g.fillRect(-l * 0.15, -r * 0.08, l * 0.3, r * 0.16); }
  // armor: a big plate along the back, a smaller one under the belly (they chip away with each phase)
  paraPoly(g, [-l * 1.02, -r * 0.55, -l * 0.6, y0, l * 0.6, y0, l * 1.02, -r * 0.55, l * 0.95, y0 + th, -l * 0.95, y0 + th], P.shell, P.shellDk);
  g.fillStyle = P.shellHi; g.fillRect(-l * 0.5, y0 + r * 0.06, l * 1.0, r * 0.09);
  g.fillStyle = P.shellLo; g.fillRect(-l * 0.9, y0 + th - r * 0.1, l * 1.8, r * 0.1);
  paraPoly(g, [-l * 0.9, r * 0.6, -l * 0.5, r * 1.0, l * 0.5, r * 1.0, l * 0.9, r * 0.6, l * 0.8, r * 1.0 - th * 0.7, -l * 0.8, r * 1.0 - th * 0.7], P.shellLo, P.shellDk);
  if (i % 3 === 0) paraPoly(g, [-l * 0.35, y0, 0, y0 - r * 0.55, l * 0.35, y0], P.shell, P.shellDk);   // a spine
  if (m.phase >= 2) {   // cracks
    g.strokeStyle = P.fleshDk; g.lineWidth = Math.max(1, T / 20); g.beginPath();
    g.moveTo(-l * 0.3, y0 + 1); g.lineTo(-l * 0.1, y0 + th * 0.6); g.lineTo(l * 0.25, y0 + th * 0.9); g.stroke();
  }
  if (i === n - 1) {   // the stinger
    paraPoly(g, [-l * 0.9, -r * 0.45, -l * 2.6, 0, -l * 0.9, r * 0.45], P.shell, P.shellDk);
    g.fillStyle = P.ooze; g.beginPath(); g.arc(-l * 2.2, 0, r * 0.14, 0, 6.3); g.fill();
  }
  g.restore();
}
function drawParaHead(g, m, P, t) {
  const R = 1.4 * TILE, open = Math.max(0, Math.min(1, (m.maw || 0) + 0.12 + 0.1 * Math.sin(t * 7)));
  g.save(); g.rotate(m.ang || 0); if (Math.cos(m.ang || 0) < 0) g.scale(1, -1);
  // feelers trailing behind the crown
  g.strokeStyle = P.shellDk; g.lineWidth = Math.max(1.5, TILE / 11); g.lineCap = 'round';
  for (const sd of [0, 1]) {
    g.beginPath(); g.moveTo(-R * 0.2, -R * (0.95 + sd * 0.05));
    for (let k = 1; k <= 5; k++) g.lineTo(-R * (0.2 + k * 0.5), -R * (0.95 + sd * 0.1 + k * 0.1) + Math.sin(t * 5 + k * 0.8 + sd * 2) * R * 0.16);
    g.stroke();
    g.fillStyle = P.ooze; g.beginPath(); g.arc(-R * 2.7, -R * (1.45 + sd * 0.1) + Math.sin(t * 5 + 4 + sd * 2) * R * 0.16, R * 0.08, 0, 6.3); g.fill();
  }
  // gill-plates at the back of the head
  paraPoly(g, [-R * 0.9, -R * 0.5, -R * 1.5, -R * 1.15, -R * 0.35, -R * 0.95], P.shellLo, P.shellDk);
  paraPoly(g, [-R * 0.9, R * 0.5, -R * 1.45, R * 1.1, -R * 0.35, R * 0.9], P.shellLo, P.shellDk);
  paraPoly(g, [-R * 1.05, -R * 0.55, -R * 0.35, -R * 0.75, -R * 0.35, R * 0.75, -R * 1.05, R * 0.55], P.flesh, P.fleshDk);
  // the mouth: a dark wedge between the jaws, an ooze-lit throat, rows of teeth
  const hjx = -R * 0.1, hjy = R * 0.3, ca = Math.cos(open * 0.7), sa = Math.sin(open * 0.7);
  const tipX = hjx + (R * 1.3) * ca - (R * 0.1) * sa, tipY = hjy + (R * 1.3) * sa + (R * 0.1) * ca;
  paraPoly(g, [-R * 0.1, -R * 0.05, R * 1.25, -R * 0.05, tipX, tipY, hjx, hjy], P.maw);
  g.fillStyle = P.ooze; g.globalAlpha = 0.55 + 0.25 * Math.sin(t * 6); g.beginPath(); g.arc(R * 0.25, R * 0.12 + open * R * 0.25, R * (0.2 + open * 0.14), 0, 6.3); g.fill(); g.globalAlpha = 1;
  // lower jaw (hinged)
  g.save(); g.translate(hjx, hjy); g.rotate(open * 0.7);
  paraPoly(g, [0, -R * 0.18, R * 1.32, -R * 0.08, R * 1.1, R * 0.34, R * 0.1, R * 0.4, -R * 0.15, R * 0.22], P.shellLo, P.shellDk);
  g.fillStyle = P.shellHi; g.fillRect(R * 0.1, R * 0.28, R * 0.9, R * 0.06);
  g.fillStyle = P.tooth;
  for (let k = 0; k < 5; k++) { const x = R * (0.2 + k * 0.23); g.beginPath(); g.moveTo(x, -R * 0.16); g.lineTo(x + R * 0.09, -R * (0.34 + 0.1 * (k % 2))); g.lineTo(x + R * 0.18, -R * 0.14); g.fill(); }
  g.restore();
  // upper jaw / skull dome
  paraPoly(g, [-R * 1.0, -R * 0.2, -R * 0.9, -R * 0.82, -R * 0.15, -R * 1.12, R * 0.65, -R * 0.9, R * 1.28, -R * 0.3, R * 1.3, -R * 0.02, R * 0.3, -R * 0.02, -R * 0.15, R * 0.08], P.shell, P.shellDk);
  paraPoly(g, [-R * 0.85, -R * 0.75, -R * 0.15, -R * 1.02, R * 0.6, -R * 0.82, R * 0.1, -R * 0.62], P.shellHi);
  for (let k = 0; k < 3; k++) paraPoly(g, [-R * (0.75 - k * 0.3), -R * (0.82 + (k === 1 ? 0.1 : 0)), -R * (0.6 - k * 0.3), -R * (1.2 + (k === 1 ? 0.15 : 0)), -R * (0.45 - k * 0.3), -R * 0.95], P.shell, P.shellDk);   // crest
  g.fillStyle = P.tooth;
  for (let k = 0; k < 5; k++) { const x = R * (0.2 + k * 0.22); g.beginPath(); g.moveTo(x, -R * 0.02); g.lineTo(x + R * 0.09, R * (0.2 + 0.1 * open + 0.06 * (k % 2))); g.lineTo(x + R * 0.18, -R * 0.02); g.fill(); }
  // the eyes
  for (const [ex, ey, es] of [[0.42, -0.55, 0.15], [0.72, -0.36, 0.12], [0.08, -0.72, 0.12]]) {
    g.fillStyle = P.fleshDk; g.fillRect(R * (ex - es * 1.25), R * (ey - es * 1.25), R * es * 2.5, R * es * 2.5);
    g.fillStyle = P.eye; g.fillRect(R * (ex - es), R * (ey - es), R * es * 2, R * es * 2);
  }
  g.restore();
}
function renderParasite(m, originX, originY) {
  if (m.dead) return;
  const sp = parasiteSegs(m), n = m.nseg == null ? PARA.n : m.nseg, t = Game.time, T = TILE;
  const P = m.hurtFlash > 0 || m.dying != null ? PARA_HIT : PARA_COL;
  const jx = m.shakeAmt ? (Math.random() - 0.5) * m.shakeAmt * T * 0.14 : 0, jy = m.shakeAmt ? (Math.random() - 0.5) * m.shakeAmt * T * 0.14 : 0;
  const hx = originX + (m.x + m.w / 2) * T + jx, hy = originY + (m.y + m.h / 2) * T + jy, onScreen = (x, y) => x > -4 * T && x < VIEW.w + 4 * T && y > -4 * T && y < VIEW.h + 4 * T;
  // where it will come up (a dust column on the sand)
  if (m.move === 'burrow' && m.stage === 'stalk' && m.dying == null) {
    const wx = originX + m.warnX * T, sy = originY + m.surfY * T, a = 0.14 + 0.1 * Math.sin(t * 16);
    const gr = ctx.createLinearGradient(0, sy - 9 * T, 0, sy); gr.addColorStop(0, 'rgba(182,255,58,0)'); gr.addColorStop(1, `rgba(182,255,58,${a + 0.12})`);
    ctx.fillStyle = gr; ctx.fillRect(wx - T * 1.1, sy - 9 * T, T * 2.2, 9 * T);
  }
  for (let i = n - 1; i >= 0; i--) {   // tail first, so the head ends up on top
    const s = sp[i], sx = originX + s.x * T + jx, sy = originY + s.y * T + jy;
    if (!onScreen(sx, sy)) continue;
    ctx.save(); ctx.translate(sx, sy);
    if (s.u) ctx.globalAlpha = 0.5;   // under the sand
    drawParaSeg(ctx, s, i, PARA.n, P, m, t);
    ctx.restore();
  }
  if (onScreen(hx, hy) && n > 0) {
    ctx.save(); ctx.translate(hx, hy);
    if (m.hu) ctx.globalAlpha = 0.55;
    drawParaHead(ctx, m, P, t);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
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
