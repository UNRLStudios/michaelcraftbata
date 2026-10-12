'use strict';
// =============================================================================
// SENSEI   (type 'sensei')
//   A master of the blade in his dojo. Talk to him; challenge him to a duel (or practice). Beat him for
//   his respect and his katana; buy samurai armor. Only hurt in a duel.
// =============================================================================
defineMob('sensei', {
  // ---- STATS ----
  stats: {
    name: 'Sensei', w: 0.6, h: 1.8, speed: 4.4, health: 160, hostile: false, dmg: 0, kb: 0.35, npc: true,
    custom: 'sensei',
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // he keeps to his dojo
  // ---- AI ----
  update: senseiAI,
  // ---- VISUALS ----
  draw: drawSensei,
  // ---- SOUNDS ----
  sounds: {
    'duel.bell': { files: ['block/bell/bell_use01', 'block/bell/bell_use02'], vol: 0.8, pitch: [0.72, 0.8], cat: 'volCreatures' },
    say: { files: n_('mob/vindication_illager/idle', 4), vol: 0.7, pitch: [0.72, 0.82], cat: 'volFriendly' },
    hurt: { files: n_('mob/vindication_illager/hurt', 3), vol: 0.8, pitch: [0.72, 0.82], cat: 'volCreatures', synth: 'hit' },
    win: { files: n_('mob/vindication_illager/celebrate', 2), vol: 0.7, pitch: [0.7, 0.75], cat: 'volFriendly' },
    tell: { files: n_('mob/evocation_illager/prepare_attack', 2), vol: 0.35, pitch: [1.4, 1.6], cat: 'volCreatures' },
    'dojo.chime': { files: ['note/icechime'], vol: 0.18, pitch: [1, 1], cat: 'volAmbient' },
    slash: { files: terraria_('dd2_sky_dragons_fury_swing', 4), vol: 0.75, pitch: [0.95, 1.1], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (drops nothing)
});

// ---- AI ----
// ---- THE SENSEIS ------------------------------------------------------------
function maybeSpawnSenseis() {
  const w = Game.world, p = Game.player;
  if (w.isInterior) return;
  for (const D of w.dojoSites()) {
    if (Math.abs(p.x - D.cx) > 80) continue;
    if (Game.mobs.some(m => m.type === 'sensei' && m.dojo === D.i)) continue;
    const m = new Mob('sensei', D.cx - 0.3, D.floor - MOB_TYPES.sensei.h);
    m.dojo = D.i; m.style = SENSEI_STYLES[D.i % 3]; m.homeX = D.cx - 0.3; m.facingDir = -1;
    m.maxHealth = m.health = m.style.hp;
    Game.mobs.push(m);
  }
}
function senseiBeaten(m) { return !!(Game.flags && Game.flags.sensei && Game.flags.sensei[m.dojo]); }
// gravity + collision without any steering (for dashes and leaps)
function senseiPhys(m, dt) {
  applyGravityAndBuoyancy(m, Game.world, dt);
  moveAndCollide(m, Game.world, dt);
  m.legPhase += dt * (Math.abs(m.vx) > 0.1 ? 3 + Math.abs(m.vx) * 2 : 0);
}
function senseiAI(m, dt, p, dx, dist) {
  if (m.ghosts) { for (const gh of m.ghosts) gh.age += dt; m.ghosts = m.ghosts.filter(gh => gh.age < 0.3); }
  if (m.duel) { senseiDuelAI(m, dt, m.duelist || p); return; }
  const S = m.style;
  const P = m.pose = {};
  m.soundCd -= dt;
  if (m.yieldT > 0) {   // kneeling after a lost duel
    m.yieldT -= dt;
    P.crouch = 5; P.legs = 1.2; P.backLegs = -0.2; P.head = 0.35; P.arm = 0.6; P.back = 0.6;
    m.vx = 0; senseiPhys(m, dt); return;
  }
  m.health = m.maxHealth;
  let vx = 0;
  const home = m.homeX + m.w / 2;
  if (Math.abs(m.x + m.w / 2 - home) > 0.6) vx = Math.sign(home - (m.x + m.w / 2)) * 2;
  if (Game.screen === 'dialog' && Dialog.npc === m) { m.facingDir = dx > 0 ? 1 : -1; P.arm = -0.9 + Math.sin(Game.time * 3) * 0.15; P.back = 0.4; vx = 0; }
  else if (dist < 8) {
    m.facingDir = dx > 0 ? 1 : -1;
    if (!m.greeted) {
      m.greeted = true;
      npcSay(m, senseiBeaten(m) ? `Welcome back, ${playerName()}.` : pick(['...', 'You have come far.', 'Hm. A visitor.']), 3);
      sfx('sensei.say', mobPos(m));
    }
  } else {
    m.greeted = m.greeted && dist < 14;
    P.head = 0.18; P.arm = 0.5; P.back = 0.55;   // eyes closed, hands behind his back
    if (m.soundCd <= 0) { m.soundCd = 14 + Math.random() * 10; if (dist < 20) npcSay(m, pick(['...', 'Hmm.', '*sweeps the floor*']), 2); }
  }
  mobMove(m, vx, dt);
}
function startDuel(m, practice, who) {
  if (m.net && netIsClient()) { closeNpcDialog(); netSend(null, { t: 'duel', i: m.id, practice: !!practice }); return; }   // (the host runs the fight)
  if (Game.duel || m.duel) return;
  who = who || Game.player;
  if (who === Game.player) closeNpcDialog();
  const S = m.style;
  m.duel = { state: 'bow', st: 0, t: 0, phase: 1, fired: 0, wait: 0, last: [], invuln: 0, practice: !!practice, world: Game.world };
  m.maxHealth = m.health = S.hp;
  Game.duel = m; m.duelist = who;
  const p = who;
  if (Math.abs(p.x - m.x) < 4) {   // step back to a proper distance
    const side = p.x < m.x ? -1 : 1;
    const nx = m.x - side * 4.5;
    if (!boxHitsSolid(Game.world, nx, m.y, m.w, m.h)) m.x = nx;
  }
  npcSay(m, practice ? 'For practice. Hajime!' : 'We bow first.', 2);
  announce(`${who.isRemote ? who.name : playerName()} challenges ${S.name}, ${S.title}!`, '#ff9aaa');
  sfx('duel.bell');
  if (who === Game.player) startDuelMusic();
}
function endDuel(m, why) {
  const S = m.style;
  if (why === 'died') announce(`${S.name}: "Return when your spirit is ready."`, '#ff9aaa');
  else if (why === 'left') announce(`The duel with ${S.name} was abandoned.`, '#cfcfcf');
  m.duel = null; if (Game.duel === m) Game.duel = null;
  m.health = m.maxHealth; m.ghosts = null; m.kbTimer = 0; m.duelist = null;
  stopDuelMusic();
}
function senseiHit(m, dmg, push, lift) {
  const p = m.duelist || Game.player;
  if (p.invuln > 0 || p.dead || (p.isRemote ? p.creative : Game.creative)) return false;
  dmg = Math.max(1, Math.round(dmg * (DIFFICULTY_DAMAGE[curDifficulty()] ?? 1)));
  p.lastKiller = m.style.name;
  p.damage(dmg, 'sensei');
  if (!p.dead) p.knockback((p.x + p.w / 2) > (m.x + m.w / 2) ? 1 : -1, push, lift);
  slashMark(p.x + p.w / 2, p.y + p.h / 2, '#ff6a7a');
  sfx('katana.cut', { pitch: 0.9 });
  return true;
}
function setSensei(m, s) { const D = m.duel; D.state = s; D.st = 0; D.fired = 0; D.hitDone = false; }
function chooseSenseiMove(m, adx) {
  const D = m.duel, S = m.style, W = S.w, P2 = D.phase === 2;
  const opts = [];
  if (adx < 3.2) { opts.push(['combo', W.combo * 2], ['counter', W.counter]); if (P2) opts.push(['leap', W.leap * 0.5]); }
  else if (adx < 10) { opts.push(['dashwind', W.dash * 2], ['approach', 2]); if (P2 || W.leap >= 4) opts.push(['leapwind', W.leap]); if (P2) opts.push(['throw', W.throw * 1.5]); }
  else { opts.push(['approach', 3], ['dashwind', W.dash]); if (P2) opts.push(['throw', W.throw]); }
  const recent = D.last.slice(-2);
  const pool = opts.filter(o => !(recent.length === 2 && recent[0] === o[0] && recent[1] === o[0]) && o[1] > 0);
  let r = Math.random() * pool.reduce((s2, o) => s2 + o[1], 0), mv = pool[0][0];
  for (const o of pool) { r -= o[1]; if (r <= 0) { mv = o[0]; break; } }
  D.last.push(mv); if (D.last.length > 4) D.last.shift();
  D.wait = Math.random() * 0.4;
  setSensei(m, mv);
  if (mv === 'combo') D.slash = 0;
  if (mv === 'dashwind') { D.dashDir = (Game.player.x + Game.player.w / 2) > (m.x + m.w / 2) ? 1 : -1; D.dashY = m.y + m.h / 2; sfx('sensei.tell', mobPos(m)); }
  if (mv === 'counter') { npcSay(m, pick(['Come.', 'Strike, if you dare.', '...']), 1.2); sfx('sensei.tell', mobPos(m)); }
  if (mv === 'leapwind' && Math.random() < 0.5) npcSay(m, 'Hah!', 0.8);
}
// The fight itself. Every move is telegraphed:
//   combo    — he raises his blade before each cut (2-4 cuts), then catches his breath
//   dash     — he crouches with his hand on the hilt, a red line shows the path:
//              JUMP over it (or dash through it with your own katana)
//   counter  — he glows blue: DON'T hit him, or he parries and cuts back
//   leap     — (Storm, or anyone at half health) jumps, hangs, and crashes down
//              where the marker is; move away
//   shuriken — (half health) three throwing stars in a fan
// After a dash, a leap or a combo he's open for a moment: hits then do +25%.
function senseiDuelAI(m, dt, p) {
  const D = m.duel, S = m.style, P2 = D.phase === 2;
  D.t += dt; D.st += dt; D.invuln = Math.max(0, D.invuln - dt);
  const cx = m.x + m.w / 2, px = p.x + p.w / 2, dx = px - cx, adx = Math.abs(dx), dir = dx >= 0 ? 1 : -1;
  const spd = S.speed * (P2 ? 1.2 : 1), fast = P2 ? 0.75 : 1;
  if (Game.world !== D.world || Math.abs(px - (m.homeX + m.w / 2)) > 48 || Math.abs(p.y - m.y) > 26) { endDuel(m, 'left'); return; }
  const Pz = m.pose = { drawn: true, arm: -1.25, back: -1.0, crouch: 0.8 };
  let steer = true, vx = 0;
  const face = () => { m.facingDir = dir; };
  switch (D.state) {
    case 'bow':
      face(); Pz.drawn = false; Pz.lean = 0.35 * Math.sin(Math.min(1, D.st / 1.4) * Math.PI); Pz.arm = 0.3; Pz.back = 0.3; Pz.crouch = 0;
      if (D.st > 1.5) { setSensei(m, 'stance'); npcSay(m, 'Hajime!', 1.2); sfx('duel.bell', { pitch: 0.9 }); }
      break;
    case 'enrage':
      face(); Pz.arm = -3.0; Pz.back = -2.6; D.invuln = 0.1;
      if (D.st < 0.05) {
        npcSay(m, pick(['Good. Now I stop holding back.', 'You fight with honor. Now so do I.', 'The storm wakes!']), 2.4);
        sfx('duel.bell', { pitch: 0.7 }); screenShake(0.5); petalBurst(cx, m.y + 0.5, 18);
      }
      if (D.st > 1.3) setSensei(m, 'stance');
      break;
    case 'stance': {
      face();
      const want = 2.6;
      vx = adx > want + 0.7 ? dir * spd * 0.75 : adx < want - 0.9 ? -dir * spd * 0.55 : Math.sin(D.t * 2.3) * spd * 0.3;
      if (D.st > (P2 ? 0.4 : 0.7) + D.wait) chooseSenseiMove(m, adx);
      break;
    }
    case 'approach':
      face(); vx = dir * spd * 1.1; Pz.arm = 0.8; Pz.back = 0.5; Pz.lean = 0.12;
      if (adx < 3 || D.st > 2) chooseSenseiMove(m, adx);
      break;
    case 'combo': {
      const n = P2 ? 4 : 3, wind = 0.3 * fast, strike = 0.14, gap = 0.08, cyc = wind + strike + gap;
      const k = D.st - D.slash * cyc;
      if (k < wind) { face(); Pz.arm = lerpA(-1.2, D.slash % 2 ? 0.4 : -3.3, easeOut(k / wind)); Pz.lean = -0.05; vx = dir * 1.2; }
      else if (k < wind + strike) {
        const e = (k - wind) / strike, a0 = D.slash % 2 ? 0.4 : -3.3, a1 = D.slash % 2 ? -3.0 : -0.3;
        Pz.arm = lerpA(a0, a1, easeOut(e)); Pz.lean = 0.2;
        Pz.trail = { a0, a1: Pz.arm, alpha: 1, color: P2 ? '#ff4a5a' : '#ffffff', reach: 30 };
        steer = false; m.vx = m.facingDir * 7;
        if (!D.hitDone && e > 0.3) {
          D.hitDone = true; sfx('sensei.slash', { x: cx, y: m.y + 1 });
          if ((px - cx) * m.facingDir > -0.4 && boxGap(m, p) < 1.7) senseiHit(m, P2 ? 4 : 3, 7, 4);
        }
      } else { Pz.arm = D.slash % 2 ? -3.0 : -0.3; D.hitDone = false; if (k >= cyc) { D.slash++; if (D.slash >= n) { setSensei(m, 'recover'); D.recover = 0.55; } } }
      break;
    }
    case 'dashwind': {   // crouched, hand on the hilt... then GONE
      m.facingDir = D.dashDir; Pz.drawn = false; Pz.crouch = 3; Pz.arm = 0.95; Pz.back = 0.7; Pz.lean = 0.25;
      const wind = S.dashWind * fast;
      if (D.st > wind * 0.55 && !D.fired) { D.fired = 1; flashAt(cx + D.dashDir * 0.4, m.y + 1.1, 0.9, '255,255,255', 0.18); sfx('katana.draw', { x: cx, y: m.y }); }
      if (D.st >= wind) {
        setSensei(m, 'dashgo');
        D.dashLeft = Math.min(10, adx + 3.8); D.dashDir = m.facingDir;
        sfx('sensei.slash', { x: cx, y: m.y, pitch: 0.75 }); sfx('sensei.say', { x: cx, y: m.y, pitch: 0.9 });
      }
      break;
    }
    case 'dashgo': {
      steer = false; Pz.arm = -1.55; Pz.back = 0.9; Pz.lean = 0.45; Pz.crouch = 2;
      const sp = 27;
      m.vx = D.dashDir * sp; m.vy = Math.min(m.vy, 0.5); m.kbTimer = 0;
      D.dashLeft -= sp * dt;
      (m.ghosts = m.ghosts || []).push({ x: m.x, y: m.y, age: 0 });
      // it only hits if you're low: jump over his blade!
      if (!D.hitDone && Math.abs(px - (m.x + m.w / 2)) < 0.9 && p.y + p.h > m.y + 0.75 && p.y < m.y + m.h) {
        D.hitDone = true; senseiHit(m, P2 ? 7 : 6, 9, 5);
      }
      const stuck = boxHitsSolid(Game.world, m.x + D.dashDir * 0.15, m.y - 0.02, m.w, m.h);
      if (D.dashLeft <= 0 || stuck) { m.vx = D.dashDir * 3; setSensei(m, 'sheathe'); }
      break;
    }
    case 'sheathe': {   // standing with his back to you, slowly sheathing: an opening
      steer = false; m.vx *= Math.pow(0.02, dt);
      const k = D.st / (0.9 * fast);
      Pz.arm = lerpA(-1.55, 0.5, easeOut(k)); Pz.back = 0.4; Pz.drawn = k < 0.8; Pz.crouch = 1.5 * (1 - k);
      if (k >= 0.8 && !D.fired) { D.fired = 1; sfx('katana.sheathe', { x: cx, y: m.y }); }
      if (k >= 1) setSensei(m, 'stance');
      break;
    }
    case 'counter':
      face(); Pz.arm = -2.1; Pz.back = -1.9; Pz.spin = -0.9; Pz.crouch = 1.2;
      if (D.st > 1.35) { setSensei(m, 'combo'); D.slash = 0; }
      break;
    case 'riposte': {
      steer = false; face();
      if (D.st < 0.1) { Pz.arm = -3.3; m.vx = 0; }
      else if (D.st < 0.24) {
        const e = (D.st - 0.1) / 0.14; Pz.arm = lerpA(-3.3, -0.2, easeOut(e)); Pz.lean = 0.3; m.vx = m.facingDir * 10;
        Pz.trail = { a0: -3.3, a1: Pz.arm, alpha: 1, color: '#9fd8ff', reach: 32 };
        if (!D.hitDone) { D.hitDone = true; if (boxGap(m, p) < 2.3) senseiHit(m, 5, 11, 5); }
      } else { m.vx *= 0.8; Pz.arm = -0.2; if (D.st > 0.5) { setSensei(m, 'recover'); D.recover = 0.5; } }
      break;
    }
    case 'leapwind':
      face(); Pz.crouch = 4; Pz.arm = -2.8; Pz.back = -2.4;
      if (D.st > 0.35 * fast) {
        setSensei(m, 'leapup'); steer = false;
        m.vy = -15.5; m.vx = Math.max(-9, Math.min(9, dx * 1.1)); m.kbTimer = 0.6;
        sfx('sensei.say', { x: cx, y: m.y, pitch: 1.1 });
      }
      break;
    case 'leapup':
      steer = false; Pz.arm = -3.0; Pz.back = -2.6; Pz.legs = 0.6; Pz.backLegs = -0.3;
      if (m.vy >= -0.5) { setSensei(m, 'leaphang'); D.markX = px; }
      break;
    case 'leaphang':
      steer = false; m.vy = 0; m.vx *= 0.8; Pz.arm = -3.4; Pz.back = -3; Pz.spin = 0.4;
      D.markX = approach(D.markX, px, dt * 3);
      if (D.st > 0.3 * fast) { setSensei(m, 'leapfall'); m.vy = 28; }
      break;
    case 'leapfall':
      steer = false; Pz.arm = -0.3; Pz.back = -0.6; Pz.spin = 0.6;
      m.vx = Math.max(-14, Math.min(14, (D.markX - cx) * 8)); m.vy = Math.max(m.vy, 28);
      if (m.onGround && D.st > 0.05) {
        const fx = m.x + m.w / 2, fy = m.y + m.h;
        groundWave(fx, fy, 2.6, false); poofBurst(fx, fy - 0.2, 10, 4); screenShake(0.7);
        sfx('hammer.pound', { x: fx, y: fy, pitch: 1.2 });
        for (let i = 0; i < 16; i++) spawnFootDust(fx + (Math.random() - 0.5) * 2.5, fy, i % 2 ? 1 : -1);
        if (p.onGround && Math.abs(px - fx) < 2.4 && Math.abs(p.y + p.h - fy) < 1.5) senseiHit(m, P2 ? 6 : 5, 9, 7);
        m.vx = 0; setSensei(m, 'recover'); D.recover = 0.75;
      }
      if (D.st > 2) setSensei(m, 'stance');
      break;
    case 'throw':
      face(); Pz.drawn = false; Pz.arm = D.st < 0.35 ? lerpA(0.3, -3.1, D.st / 0.35) : lerpA(-3.1, -1.4, clamp01((D.st - 0.35) / 0.1)); Pz.back = 0.4;
      if (D.st > 0.4 && !D.fired) {
        D.fired = 1;
        const ox = cx + m.facingDir * 0.5, oy = m.y + 0.6, ang = Math.atan2(p.y + p.h / 2 - oy, px - ox);
        for (const off of [-0.2, 0, 0.2]) Game.shuriken.push({ x: ox, y: oy, vx: Math.cos(ang + off) * 15, vy: Math.sin(ang + off) * 15, age: 0, rot: 0, from: m });
        sfx('shuriken', { x: ox, y: oy });
      }
      if (D.st > 0.8) setSensei(m, 'stance');
      break;
    case 'recover':
      Pz.arm = 0.2; Pz.back = 0.3; Pz.crouch = 1.5; Pz.head = 0.2; Pz.lift = Math.sin(D.st * 8) * 0.3;   // catching his breath
      if (D.st > D.recover) setSensei(m, 'stance');
      break;
  }
  if (steer) mobMove(m, vx, dt); else senseiPhys(m, dt);
  m.x = Math.max(m.homeX - 30, Math.min(m.homeX + 30, m.x));
}
function updateShuriken(dt) {
  const p = Game.player;
  for (let i = Game.shuriken.length - 1; i >= 0; i--) {
    const s = Game.shuriken[i];
    s.age += dt; s.rot += dt * 22; s.vy += 3 * dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (!p.dead && boxDistToPoint(p, s.x, s.y) < 0.25) {
      if (s.from && s.from.duel) senseiHit(s.from, 2, 4, 2);
      Game.shuriken.splice(i, 1); continue;
    }
    if (solidAt(Math.floor(s.x), Math.floor(s.y)) || s.age > 2.5) {
      for (let k = 0; k < 4; k++) Game.particles.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3, life: 0.2, age: 0, size: 0.06, kind: 'star', color: '#fff6cc', gravity: 8 });
      Game.shuriken.splice(i, 1);
    }
  }
}
// He yields: kneels, gives you his blade (the first time), and remembers.
function senseiYield(m) {
  const D = m.duel, S = m.style, p = m.duelist || Game.player;
  const practice = D.practice, winner = p.isRemote ? p.name : playerName();
  const grant = (id) => { if (p.isRemote) netSend(p.id, { t: 'adv', id }); else Adv.grant(id); };
  m.duel = null; Game.duel = null; m.duelist = null;
  m.health = m.maxHealth; m.yieldT = 3.5; m.ghosts = null; m.vx = 0;
  stopDuelMusic(); playVictoryJingle();
  sfx('duel.bell', { pitch: 0.8 }); sfx('sensei.win', mobPos(m));
  petalBurst(m.x + m.w / 2, m.y + 0.6, 40); screenShake(0.4);
  if (practice || senseiBeaten(m)) {
    npcSay(m, pick(['Ha! Well fought.', 'Good. Very good.', 'Your blade remembers.']), 3);
    announce(`${winner} won a practice duel against ${S.name}.`, '#ff9aaa');
    return;
  }
  Game.flags.sensei[m.dojo] = true;
  npcSay(m, 'Enough... You have won. The blade is yours.', 4);
  announce(`${winner} has defeated ${S.name}, ${S.title}!`, '#ff6a7a');
  const drop = (it, q) => { const d = spawnDrop(it, q, m.x + m.w / 2, m.y + 0.4); if (d) { d.vx = (p.x > m.x ? 1 : -1) * (2 + Math.random() * 2); d.vy = -5 - Math.random() * 2; } };
  drop(SENSEI_KATANA, 1);
  drop(134, 8 + Math.floor(Math.random() * 6));
  drop(STRING, 3);
  grant('sensei');
  if (Game.flags.sensei.filter(Boolean).length >= 3) grant('sensei3');
}
// ---- LOCATOR MAPS -------------------------------------------------------------
// Tonio's Map marks his house; the Dojo Map marks the nearest dojo whose
// Sensei you haven't beaten yet. Hold one to follow the arrow.
function nearestDojo(x, unbeatenFirst) {
  const sites = Game.world.dojoSites();
  if (!sites.length) return null;
  const open = sites.filter(D => !Game.flags.sensei[D.i]);
  const list = unbeatenFirst && open.length ? open : sites;
  return list.reduce((a, b) => Math.abs(b.cx - x) < Math.abs(a.cx - x) ? b : a);
}

// ---- VISUALS (drawing and effects) ----
const PORTRAIT_SENSEI = [
  '........................',
  '..........HHHH..........',
  '.........HhHHhH.........',
  '..........gggg..........',
  '.......SSSSSSSSSS.......',
  '......SSSSSSSSSSSS......',
  '.....SSSSSSSSSSSSSS.....',
  '....HSSSSSSSSSSSSSSH....',
  '....HHSSSSSSSSSSSSHH....',
  '...HHSHHHHSSSSHHHHSHH...',
  '...HHSSWEWSSSSWEWSSHH...',
  '...HHsSSSSSSsSSSSSsHH...',
  '....HsSSSSSsssSSSSsH....',
  '.....SSHHHHHHHHHHSS.....',
  '.....SHHHHMMMMHHHHS.....',
  '......HHHHHHHHHHHH......',
  '......hHHHHHHHHHHh......',
  '.......HHHHHHHHHH.......',
  '....dTTThHHHHHHhTTTd....',
  '...dTTTTTdHHHHdTTTTTd...',
  '..dTTTTTTTdhhdTTTTTTTd..',
  '.dTTTTTTTTTdddTTTTTTTTd.',
  '.dTTTTTTTTTdBdTTTTTTTTd.',
  'dTTTTTTTTTTBBBTTTTTTTTTd',
];
// The Senseis: bald on top, white hair round the back, bushy brows, a long
// white beard (drawn below the head so it can sway), a gi and hakama.
const SENSEI_GRIDS = {
  head: ['.HSSSSS.', 'HHSSSSSS', 'HHSShHHS', 'HHsSSSWE', 'HHsSSSSS', 'HHssSHHH', 'HsSSHHHH', '.sSHHHHH'],
  body: ['dTTS', 'dTdS', 'dTTd', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'BBBK', 'dPPP', 'pPPP'],
  arm: ['dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'sSSS', 'sSSS', 'sSSS', 'sSSS', 'sSSS'],
  leg: ['pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'OOoo', 'OOOo', 'OOOO'],
};
// Three masters, three schools (and three ways to fight). Move weights:
// combo, dash (iaido), counter (parry stance), leap, throw (shuriken).
const SENSEI_STYLES = [
  {
    name: 'Sensei Kenji', title: 'the Swift', hp: 150, speed: 5.0, dashWind: 0.5, w: { combo: 3, dash: 4, counter: 1, leap: 1, throw: 2 },
    pal: { shirt: '#ecebe4', shirtHi: '#ffffff', shirtShade: '#c4c1b6', pants: '#2c3558', pantsShade: '#1e2440', belt: '#1a1a1a', buckle: '#c9a23a' }
  },
  {
    name: 'Sensei Hiroshi', title: 'the Still', hp: 185, speed: 4.0, dashWind: 0.65, w: { combo: 3, dash: 2, counter: 4, leap: 1, throw: 1 },
    pal: { shirt: '#8d9096', shirtHi: '#a9acb2', shirtShade: '#6b6e74', pants: '#1f1f22', pantsShade: '#121214', belt: '#7a1a1e', buckle: '#d9b54a' }
  },
  {
    name: 'Sensei Takeshi', title: 'the Storm', hp: 170, speed: 4.5, dashWind: 0.6, w: { combo: 2, dash: 3, counter: 1, leap: 4, throw: 3 },
    pal: { shirt: '#2f4a73', shirtHi: '#43649a', shirtShade: '#213452', pants: '#3a2a24', pantsShade: '#281c18', belt: '#b3262e', buckle: '#e0b84a' }
  },
];
const SENSEI_BASE_PAL = { hair: '#e6e6e6', hairHi: '#ffffff', skin: '#e2b58f', skinShade: '#c4946c', mouth: '#7a4a3a', eyeWhite: '#f4f4f4', eye: '#2a2a2a', boots: '#e8e4d8', bootsHi: '#ffffff' };
const senseiPalCache = new Map();
function senseiPal(S) {
  if (!senseiPalCache.has(S)) senseiPalCache.set(S, Object.assign({}, SENSEI_BASE_PAL, S.pal));
  return senseiPalCache.get(S);
}
function drawSenseiBeard(g, u, m) {
  const sway = Math.sin(Game.time * 1.7 + (m ? m.id : 0)) * 0.6 * u + (m && Math.abs(m.vx) > 1 ? -Math.sign(m.vx) * (m.facingDir || 1) * u : 0);
  const rows = [[0, 4], [0, 4], [1, 4], [1, 4], [1, 3], [2, 3], [2, 3], [2, 2]];
  rows.forEach(([a, b], r) => {
    const off = sway * (r / rows.length);
    for (let c = a; c <= b; c++) {
      g.fillStyle = c === a || r > 5 ? '#cfcfcf' : '#f4f4f4';
      g.fillRect(c * u + off, r * u, u + 0.35, u + 0.35);
    }
  });
}
function drawTopknot(g, u) {
  g.fillStyle = '#f4f4f4'; g.fillRect(-4 * u, -10 * u, 3 * u, 2.4 * u);
  g.fillStyle = '#d0d0d0'; g.fillRect(-4 * u, -8.6 * u, 3 * u, u * 0.6);
  g.fillStyle = '#8e1a1e'; g.fillRect(-3 * u, -8.4 * u, u, u * 0.8);
}
function drawSensei(g, m, u) {
  const S = m.style || SENSEI_STYLES[0], w = m.w * TILE, h = m.h * TILE, t = Game.time;
  const P = m.pose || {}, D = m.duel;
  // afterimages while he dashes
  if (m.ghosts && m.ghosts.length) for (const gh of m.ghosts) {
    g.save(); g.translate((gh.x - m.x) * TILE * (m.facingDir || 1), (gh.y - m.y) * TILE);
    g.translate(-w / 2, -h);
    drawPlayerSprite(g, w, h, { grids: SENSEI_GRIDS, pal: ghostPal(D && D.phase === 2 ? '#ff4a5a' : '#dfe8ff'), alpha: 0.32 * (1 - gh.age / 0.3), armAngle: -1.4, crouch: 2 });
    g.restore();
  }
  // a glow: red when enraged, blue in his counter stance
  const aura = D && D.state === 'counter' ? '90,170,255' : D && D.phase === 2 ? '255,50,60' : null;
  if (aura) {
    const r = h * (0.7 + 0.06 * Math.sin(t * 9)), gr = g.createRadialGradient(0, -h / 2, 0, 0, -h / 2, r);
    gr.addColorStop(0, `rgba(${aura},0.32)`); gr.addColorStop(1, `rgba(${aura},0)`);
    g.fillStyle = gr; g.fillRect(-r, -h / 2 - r, r * 2, r * 2);
  }
  const moving = Math.abs(m.vx) > 0.2 && m.onGround, sw = moving ? Math.sin(m.legPhase) * 0.5 : 0;
  const drawn = !!P.drawn;
  g.save(); g.translate(-w / 2, -h + (P.lift || 0) * u);
  if (P.lean) { g.translate(w / 2, h); g.rotate(P.lean); g.translate(-w / 2, -h); }
  drawPlayerSprite(g, w, h, {
    grids: SENSEI_GRIDS, pal: senseiPal(S), legSwing: P.legs != null ? P.legs : sw, backLegSwing: P.backLegs,
    armAngle: P.arm != null ? P.arm : 0.45, backArmAngle: P.back != null ? P.back : 0.5,
    headTilt: P.head != null ? P.head : Math.sin(t * 0.7 + m.id) * 0.04, crouch: P.crouch || 0, breath: (Math.sin(t * 1.6) + 1) * 0.25,
    held: drawn ? { item: SENSEI_KATANA } : null, trail: P.trail || null, heldSpin: P.spin || 0,
    preHead: drawTopknot,
    postHead: (gg, uu) => { drawSenseiBeard(gg, uu, m); if (D && D.phase === 2) { gg.fillStyle = '#ff3040'; gg.fillRect(3 * uu, -5 * uu, uu, uu); } },
    beforeArm: drawn ? null : (gg, uu, cx, hipY) => {   // his sword, sheathed at his hip
      gg.save(); gg.translate(cx + 0.5 * uu, hipY - 1.5 * uu); gg.rotate(-0.35);
      gg.fillStyle = '#16161a'; gg.fillRect(-11 * uu, -0.6 * uu, 11 * uu, 1.2 * uu);
      gg.fillStyle = '#c9a23a'; gg.fillRect(-0.5 * uu, -1 * uu, 1 * uu, 2 * uu);
      gg.fillStyle = '#2a1a2a'; gg.fillRect(0.5 * uu, -0.6 * uu, 4 * uu, 1.3 * uu);
      gg.fillStyle = '#8e1a1e'; gg.fillRect(1.5 * uu, -0.6 * uu, 0.6 * uu, 1.3 * uu); gg.fillRect(3 * uu, -0.6 * uu, 0.6 * uu, 1.3 * uu);
      gg.restore();
    },
  });
  g.restore();
}
function parryFX(m, big) {
  const x = m.x + m.w / 2 + (m.facingDir || 1) * 0.4, y = m.y + 0.8;
  for (let i = 0; i < (big ? 14 : 7); i++) {
    const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * (big ? 6 : 3);
    Game.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.25, age: 0, size: 0.07, kind: 'star', color: big ? '#9fd8ff' : '#fff6cc', gravity: 6 });
  }
  flashAt(x, y, big ? 1.4 : 0.8, big ? '140,200,255' : '255,245,210', 0.1);
  sfx('parry', { x, y });
}
// Warnings for his big moves, drawn over the world.
function renderDuelTells(originX, originY) {
  const m = Game.duel;
  if (!m || !m.duel) return;
  const D = m.duel, t = Game.time;
  if (D.state === 'dashwind') {
    const y = originY + D.dashY * TILE, len = Math.min(10, Math.abs(Game.player.x - m.x) + 3.8) * TILE;
    const x0 = originX + (m.x + m.w / 2) * TILE;
    const a = 0.18 + 0.14 * Math.sin(t * 30) + Math.min(0.3, D.st);
    ctx.fillStyle = `rgba(255,40,50,${a * 0.5})`;
    ctx.fillRect(D.dashDir > 0 ? x0 : x0 - len, y - TILE * 0.55, len, TILE * 1.1);
    ctx.fillStyle = `rgba(255,220,220,${a})`;
    ctx.fillRect(D.dashDir > 0 ? x0 : x0 - len, y - 1, len, 2);
  }
  if (D.state === 'leaphang' || D.state === 'leapfall') {
    const fy = m.y + m.h, x = originX + D.markX * TILE;
    let gy = Math.floor(fy); while (gy < fy + 12 && !solidAt(Math.floor(D.markX), gy)) gy++;
    ctx.strokeStyle = `rgba(255,50,60,${0.6 + 0.3 * Math.sin(t * 25)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, originY + gy * TILE, TILE * 2.2, TILE * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if (D.state === 'counter' || D.state === 'dashwind' || (D.state === 'combo' && D.st < 0.1)) {
    // a "!" over his head
    const x = originX + (m.x + m.w / 2) * TILE, y = originY + (m.y - 0.7) * TILE + Math.sin(t * 12) * 2;
    ctx.font = `${Math.round(Math.max(14, TILE * 0.6))}px "MC Title", "MC Title Alt", monospace`; ctx.textAlign = 'center';
    ctx.fillStyle = '#000'; ctx.fillText('!', x + 2, y + 2);
    ctx.fillStyle = D.state === 'counter' ? '#8fd0ff' : '#ff4a4a'; ctx.fillText('!', x, y);
  }
}

// ---- DUEL MUSIC ----
// ---- DUEL MUSIC ---------------------------------------------------------------
// Played live on note-block sounds: a koto-like banjo on a Japanese scale
// (E F A B D), taiko-style bass drums, a flute now and then. It speeds up
// when the Sensei gets serious. (Options > Sound > Music sets the volume.)
const DuelMusic = { on: false, next: 0, step: 0 };
const DUEL_SCALE = [-2, -1, 3, 5, 8, 10, 11, 15, 17];   // semitones from F#4
const DUEL_MELODY = [
  [7, -1, 5, -1, 4, -1, 3, -1, 4, -1, -1, 5, 7, -1, 6, -1],
  [5, -1, 4, 3, 2, -1, -1, -1, 3, -1, 4, -1, 2, -1, 0, -1],
  [2, -1, 3, -1, 4, -1, 5, 4, 3, -1, 2, -1, 3, -1, 4, -1],
  [5, -1, -1, 4, 5, -1, 7, -1, 6, -1, 5, -1, 4, -1, -1, -1],
];
const DUEL_DRUMS = 'X..x..X.X..x.xX.';
function startDuelMusic() {
  if (bossAudio && !bossAudio.paused) return;
  DuelMusic.on = true; DuelMusic.step = 0; DuelMusic.next = actx ? actx.currentTime + 0.1 : 0;
}
function stopDuelMusic() { DuelMusic.on = false; }
function updateDuelMusic() {
  if (!DuelMusic.on || !actx || actx.state !== 'running') return;
  if (Game.screen === 'title') { DuelMusic.on = false; return; }
  const phase2 = Game.duel && Game.duel.duel && Game.duel.duel.phase === 2;
  const stepDur = phase2 ? 0.105 : 0.125, vol = musicVolume() * 0.5;
  if (DuelMusic.next < actx.currentTime - 0.3) DuelMusic.next = actx.currentTime + 0.05;   // (was paused)
  while (DuelMusic.next < actx.currentTime + 0.15) {
    const t = DuelMusic.next, st = DuelMusic.step % 16, bar = Math.floor(DuelMusic.step / 16) % 4;
    const n = DUEL_MELODY[bar][st];
    if (n >= 0) playNoteAt('note/banjo', t, noteRate(DUEL_SCALE[n]), vol * 0.5);
    if (n >= 0 && phase2 && st % 4 === 0) playNoteAt('note/harp', t, noteRate(DUEL_SCALE[n] - 12), vol * 0.35);
    const d = DUEL_DRUMS[st];
    if (d === 'X') playNoteAt('note/bd', t, 0.62, vol * 1.1);
    else if (d === 'x') playNoteAt('note/bd', t, 0.8, vol * 0.6);
    if (phase2 && st % 2 === 1) playNoteAt('note/hat', t, 1.3, vol * 0.18);
    if (st === 0) playNoteAt('note/bass', t, noteRate(bar % 2 ? 3 : -2), vol * 0.7);
    if (st === 0 && bar === 0) playNoteAt('note/flute', t, noteRate(DUEL_SCALE[bar % 2 ? 4 : 5]), vol * 0.3);
    DuelMusic.next += stepDur; DuelMusic.step++;
  }
}

// ---- WHAT HE SAYS, AND HIS SHOP ----
function samuraiPrice(m) { return senseiBeaten(m) ? 30 : 45; }
function buySamuraiArmor(m) {
  const inv = Game.player.inventory, price = samuraiPrice(m);
  if (countItem(inv, 134) < price && !Game.creative) { sfx('sensei.say', mobPos(m)); showDialogNode('armorpoor'); return; }
  if (!Game.creative) removeItem(inv, 134, price);
  giveOrDrop(makeStack(SAMURAI_ARMOR, 1));
  sfx('equip.iron'); sfx('toast.challenge');
  eventMessage(`${playerName()} bought Samurai Armor from ${m.style.name}!`, '#ff9aaa');
  refreshInventoryUI();
  showDialogNode('armorsold');
}
function senseiDialog(m) {
  const S = m.style, name = playerName(), beaten = senseiBeaten(m);
  const price = samuraiPrice(m), ems = countItem(Game.player.inventory, 134);
  const armorNodes = {
    armor: {
      text: beaten
        ? `My old armor. Red lacquered plates, laced with black silk. It turns a blade... and with a katana in your hands, you will strike harder and move quicker. For one who has bested me: ${price} emeralds.`
        : `My old armor. Red lacquered plates, laced with black silk. It turns a blade... and with a katana in your hands, you will strike harder and move quicker. ${price} emeralds. Beat me, and I will ask for less.`,
      options: [{ label: `Buy it (${price} emeralds, you have ${ems})`, action: () => buySamuraiArmor(m), stay: true }, { label: 'Back', go: 'start' }]
    },
    armorpoor: { text: `${price} emeralds. You have ${countItem(Game.player.inventory, 134)}. Come back when your purse is as heavy as your blade.`, options: [{ label: 'Back', go: 'start' }] },
    armorsold: { text: 'Wear it with honor. Right-click it to put it on.', options: [{ label: 'Thank you, Sensei', go: 'start' }, { label: 'Farewell' }] },
  };
  const others = SENSEI_STYLES.filter(o => o !== S).map(o => o.name.replace('Sensei ', ''));
  const broTxt = SENSEI_STYLES.map((o, i) => o === S ? null : (Game.flags.sensei[i] ? `${o.name.replace('Sensei ', '')} has already lost his blade to you. Ha! Good.` : `${o.name.replace('Sensei ', '')} still waits in his dojo, far from here.`)).filter(Boolean).join(' ');
  const tips = { text: 'Watch my hands, not my eyes. When I crouch with my hand on the hilt, JUMP. When my blade glows blue, hold your strike. When I leap, move. And after I strike, I must breathe: that is your moment.', options: [{ label: 'Back', go: 'start' }] };
  if (beaten) return {
    ...armorNodes,
    start: {
      text: `My blade has found a worthy hand. Walk your path well, ${name}.`, options: [
        { label: 'Any advice?', go: 'advice' }, { label: 'Your brothers?', go: 'brothers' },
        { label: `Samurai Armor (${price} emeralds)`, go: 'armor' },
        { label: 'Spar with me (practice)', action: () => startDuel(m, true) }, { label: 'Farewell' }]
    },
    advice: { text: 'A swordsman strikes and is gone. With a katana, right-click to draw and cut in one motion: while you dash, nothing can touch you. The crimson blade makes wounds that bleed.', options: [{ label: 'Back', go: 'start' }] },
    brothers: { text: broTxt, options: [{ label: 'Back', go: 'start' }] },
  };
  return {
    ...armorNodes,
    start: {
      text: `...So. Another traveller walks through my gate. Few find this place, ${name}.`, options: [
        { label: 'Who are you?', go: 'who' }, { label: 'Tell me about the red sword', go: 'blade1' },
        { label: `Samurai Armor (${price} emeralds)`, go: 'armor' },
        { label: 'I challenge you to a duel!', go: 'challenge' }, { label: 'Farewell' }]
    },
    who: { text: `I am ${S.name}, ${S.title}. Long ago I was one of three students of Master Masamura, the greatest swordsmith who ever lived. Now I am an old man who sweeps his floor.`, options: [{ label: 'Back', go: 'start' }] },
    blade1: { text: 'When the King of the Abyss first woke, our master went down into the red dark... and came back up with a heart of ruby, still warm.', options: [{ label: '...and then?', go: 'blade2' }] },
    blade2: { text: `From it he forged three crimson blades, and gave one to each of his students: to me, and to ${others[0]} and ${others[1]}. Then he sent us to the far corners of the world, so that the King could never take all three.`, options: [{ label: 'Go on', go: 'blade3' }] },
    blade3: { text: 'A blade like this cannot be bought, and it cannot be stolen. It must be won. Defeat me in a duel, and it is yours.', options: [{ label: 'I challenge you!', go: 'challenge' }, { label: 'Back', go: 'start' }] },
    challenge: {
      text: 'Then bow, and draw your blade. Watch my hands, not my eyes. If you fall... return when your spirit is ready.', options: [
        { label: 'Begin the duel', action: () => startDuel(m, false) }, { label: 'How do you fight?', go: 'tips' }, { label: 'Not yet', go: 'start' }]
    },
    tips,
  };
}
