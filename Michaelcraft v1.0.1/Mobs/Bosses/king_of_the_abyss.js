'use strict';
// =============================================================================
// THE KING OF THE ABYSS   (type 'abyssking')
//   The Abyss's boss. Woken at the Abyssal Altar (once the Apex Parasite and the Hollow Knight have fallen).
//   Two phases: volleys, claws, charges, summoned imps; then rings and meteors. At 1% health: DESPERATION.
//   Later, as the totem, he tells you about the Supercharger and the Slayer of Worlds.
// =============================================================================
defineMob('abyssking', {
  // ---- STATS ----
  stats: {
    name: 'King of the Abyss', w: 2.4, h: 3.4, speed: 5, health: 1650, hostile: true, boss: true, dmg: 10, kb: 0,
    flying: true, fireproof: true, custom: 'king',
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // he flies his own arena
  // ---- AI ----
  update: kingAI,
  // bosses run through updateBoss -> BOSS_AI (below)
  // ---- VISUALS ----
  draw: drawKing,
  deathColors: ['#3a0c16', '#ff2a3a', '#e0b84a'],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/wither/idle', 4), vol: 0.6, pitch: [0.6, 0.75], cat: 'volCreatures', synth: 'growl' },
    hurt: { files: n_('mob/wither/hurt', 4), vol: 0.7, pitch: [0.65, 0.8], cat: 'volCreatures', synth: 'hit' },
    death: { files: ['mob/wither/death'], vol: 1, pitch: [0.75, 0.75], cat: 'volCreatures', synth: 'death' },
    'abyss.beam': { files: ['boss/beam'], vol: 0.8, pitch: [0.97, 1.03], cat: 'volCreatures' },
    'abyss.orb': { files: ['boss/purpleorb_fire'], vol: 0.55, pitch: [0.92, 1.08], cat: 'volCreatures' },
    'abyss.fireorb': { files: ['boss/fireorb_fire'], vol: 0.8, pitch: [0.95, 1.05], cat: 'volCreatures' },
    'abyss.impact': { files: ['boss/orb_impact'], vol: 0.7, pitch: [0.9, 1.1], cat: 'volCreatures' },
    'desp.start': { files: ['item/totem/use_totem'], vol: 0.9, pitch: [0.7, 0.7], cat: 'volCreatures' },
    'desp.tick': { files: ['note/pling'], vol: 0.7, pitch: [0.5, 0.5], cat: 'volUI' },
    'desp.go': { files: ['block/conduit/activate'], vol: 1, pitch: [0.8, 0.8], cat: 'volCreatures' },
    'desp.mark': { files: n_('mob/evocation_illager/prepare_attack', 2), vol: 0.45, pitch: [1.3, 1.5], cat: 'volCreatures' },
    'desp.slam': { files: ['ambient/underwater/additions/earth_crack'], vol: 1, pitch: [0.85, 1], cat: 'volCreatures', synth: 'slam' },
    'desp.charge': { files: n_('block/respawn_anchor/charge', 3), vol: 1, pitch: [0.5, 0.5], cat: 'volCreatures' },
    'desp.nova': { files: n_('item/trident/thunder', 2), vol: 0.9, pitch: [0.8, 0.9], cat: 'volCreatures', synth: 'slam' },
    'desp.end': { files: n_('block/respawn_anchor/deplete', 2), vol: 1, pitch: [0.6, 0.6], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    kingLoot(mob, mx, my);
  },
  // ---- BOSS ----
  boss: {
    name: 'King of the Abyss', music: 'Sounds/music/final_stand.mp3',
    home: (m) => m.arena ? { x: m.arena.cx, y: m.arena.cy } : { x: m.x, y: m.y },
    chase: { x: 75, y: 55 },          // how far from home you can run before he gives up
    summonAdv: 'summon', killAdv: 'king',
    // (1.0.3) he's built to be fought from range:
    meleeTaken: 0.5,                  // melee hits do half damage (the Hammer is the exception)
    bleedHeal: [40, 50],              // a melee bleed (the Sensei's Katana) HEALS him this much instead
    // (1.0.4) DESPERATION: at 1% health he refuses to die. 10 seconds to get ready,
    // then his own song and about 50 seconds of attacks while his last strength
    // drains away; survive it and he dies on his own. (See DESP further down.)
    desperation: { at: 0.01, music: 'Sounds/music/desperation_BGM.mp3' },
    dmgMult: 2.3,                     // every hit he lands does 130% more (1.0.4: 60%, 1.6: 130%)
    dmgFlat: 2,                       // (1.0.1) ...then 2 less (one heart), so his hits aren't quite so crazy
  },
  bossAI: (m, dt, p) => kingAI(m, dt, p),
});

// ---- AI ----
// (1.2.1) the Apex Parasite must fall before the King can be woken or the Hollow Knight faced
function parasiteBeaten12() { return !!(Game.flags && Game.flags.parasiteDown) || Adv.done.has('parasite') || Adv.done.has('king') || Adv.done.has('hollow'); }
function checkAltarRitual(x, y) {
  const w = netOverworld();
  if (w.getTile(x, y) !== 22 || w.getTile(x, y + 1) !== 86 || w.getTile(x, y + 2) !== ALTAR) return;
  if (Game.boss && !Game.boss.dead) { if (Net.applyFrom && Net.applyFrom !== 'host') netSend(Net.applyFrom, { t: 'ev', text: 'The King is already awake!', color: '#c070ff' }); else showToast('The King is already awake!'); return; }
  if (Game.ritual) return;
  if (!parasiteBeaten12()) {   // (1.2.1) the King's door is shut until the Apex Parasite is dead
    const msg = 'The altar stays cold. Something else must fall first... the Apex Parasite.';
    if (Net.applyFrom && Net.applyFrom !== 'host') netSend(Net.applyFrom, { t: 'ev', text: msg, color: '#c070ff' }); else showToast(msg);
    sfx('door.lock', { x, y }); return;
  }
  Game.ritual = { x, y: y + 2, t: 0, by: Net.applyFrom || 'host' };   // (1.0.2: remember who summoned him)
  netFxCapture(x, y, () => {
    netFx(['r', x, y + 2]);
    sfx('altar.charge', { x: x + 0.5, y: y + 1 }); screenShake(0.3);
    eventMessage('The ground trembles...', '#c070ff');
  });
}
function updateRitual(dt) {
  updateRitual14(dt);   // (1.4)
  const R = Game.ritual;
  if (!R || (Game.world && Game.world.isInterior)) return;
  if (R._frame === loop.frames) return;
  R._frame = loop.frames;
  R.t += dt;
  const cx = R.x + 0.5, cy = R.y - 1.5;
  for (let i = 0; i < 3; i++) {   // embers spiral in toward the altar
    const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 4;
    Game.particles.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r * 1.6, vy: -Math.sin(a) * r * 1.1, life: 0.6, age: 0, size: 0.09, kind: 'star', color: Math.random() < 0.5 ? '#ff3a2a' : '#ffb347', gravity: 0 });
  }
  Game.shake = Math.max(Game.shake, 0.15 + R.t * 0.08);
  if (R.t > 1.2 && !R.flash) { R.flash = true; if (!R.cosmetic) netFxCapture(R.x, R.y, () => sfx('altar.activate', { x: R.x + 0.5, y: R.y })); else if (!netIsClient()) sfx('altar.activate'); }
  if (R.t >= 2.6 && R.cosmetic) { Game.ritual = null; return; }   // (a friend's screen: the host spawns him)
  if (R.t >= 2.6) {
    const w = Game.world;
    if (w.getTile(R.x, R.y - 2) === 22) w.setTile(R.x, R.y - 2, AIR);
    if (w.getTile(R.x, R.y - 1) === 86) w.setTile(R.x, R.y - 1, AIR);
    Game.ritual = null;
    summonBoss('abyssking', R.x, R.y, R.by);
  }
}
function spawnKing(ax, ay, by) {
  // (1.0.2) only use the Abyss's arena if the altar is actually in (or next to) it
  let A = Game.world.abyssNear(ax);
  if (!A || Math.abs(A.cx - ax) > A.rx + 40 || Math.abs(A.cy - ay) > A.ry + 40) A = { cx: ax, cy: ay - 8, rx: 23, ry: 12, floor: ay + 2 };
  const m = new Mob('abyssking', ax + 0.5 - 1.2, ay - 4);
  Object.assign(m, { arena: A, phase: 1, move: 'intro', moveT: 0, t: 0, side: 1, rnd: 0, leaveT: 0, bossInvuln: 2.8, state: 'hostile', guardian: true });
  m.hands = [-1, 1].map(side => ({ x: ax + 0.5 + side * 2.4, y: ay - 1.5, vx: 0, vy: 0, side, st: 'idle', glow: 0 }));
  Game.mobs.push(m);
  bossSpawned(m);
  sfx('boss.spawn', { x: ax, y: ay }); sfx('boss.roar', { x: ax, y: ay }); screenShake(1.2); flashDamage();
  eventMessage('The King of the Abyss has awoken!', '#b44bff');
  for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7; Game.particles.push({ x: ax + 0.5, y: ay - 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.8 + Math.random() * 0.5, age: 0, size: 0.1 + Math.random() * 0.12, color: ['#ff2a3a', '#3a0c16', '#ffb347'][i % 3], gravity: 0 }); }
  // whoever summoned him gets the advancement
  if (by && by !== 'host' && Net.peers.has(by)) netSend(by, { t: 'adv', id: 'summon' }); else if (!Game.outside) Adv.grant('summon');
}
const DESP = {
  grace: 10,        // seconds to get ready before the attacks (and his song) start
  length: 170,      // seconds of attacks = the song (2:52); the boss bar drains over this
  iframes: 1.1,     // seconds of safety after a desperation hit (normally 0.5)
  kb: [4, 3],       // the (small) push a desperation hit gives you
  wall: 18.5,       // the glowing walls stand this far left and right of the arena's middle
};
// (1.1.1: armour got stronger, so these went up to match - Diamond still takes 3-4 a hit)
const DESP_DMG = { orb: 7.5, wave: 7.5, pillar: 8.5, blast: 7.5, nova: 8.5, border: 6, touch: 7.5, dart: 7.5 };   // (after x1.6: dart 12, pillar 14)
// (1.0.6, v5) PATTERNS - faster and harder. Every pattern is the same every time,
// with ONE clear way through it that you can learn:
//   CORRIDOR  pillars erupt everywhere except a gap; the gap steps along each time
//             (bouncing off the walls), and darts are aimed at you inside it.
//             Answer: follow the gap, sidestep the darts inside it.
//   HEX       he hops between three spots (middle, left, right); red lines shoot out
//             of him and a dart flies down every line. Each set is turned HALF a gap
//             from the last. Answer: sit between two lines, slide half a gap each set.
//   SNAKE     walls of darts fall from the roof; the gap follows a smooth snake.
//             Answer: weave with the snake. (bombs with a dotted ring from round 2)
//   SPIRAL    he spins in the middle, firing arms of darts in pulses; the spin
//             reverses (he roars). Answer: circle WITH the spin.
// Rounds: 8 seconds a pattern. Round 1, 2 and 3 play all four, each faster; round 4
// plays them in PAIRS at once (two patterns layered); the finale throws everything.
// A short white flash between rounds gives you 3 hearts back.
// [start, pattern, level, what he says]
const DESP_ACTS = [
  [0, 'corridor', 1, 'Burn in the fires of the deep!'],
  [8, 'hex', 1, 'Every line... is your grave!'],
  [16, 'snake', 1, 'Let it RAIN!'],
  [24, 'spiral', 1, 'Round and round the Abyss!'],
  [32, 'burst', 1, '...not... yet...'],
  [34, 'corridor', 2, 'Still flying?! BURN!'],
  [42, 'hex', 2, 'NOWHERE between the lines!'],
  [50, 'snake', 2, 'The sky falls with me!'],
  [58, 'spiral', 2, 'FASTER!'],
  [66, 'burst', 2, '...I... will not...'],
  [68, 'corridor', 3, 'I AM THE ABYSS!'],
  [76, 'hex', 3, 'BREAK! BREAK! BREAK!'],
  [84, 'snake', 3, 'Drown in it!'],
  [92, 'spiral', 3, 'Spin... with me... into the dark!'],
  [100, 'burst', 3, '...you... are... strong...'],
  [102, 'corridor+hex', 2, 'Walls AND lines!'],
  [110, 'snake+spiral', 2, 'Weave! SPIN!'],
  [118, 'hex+snake', 2, 'Everything I have left!'],
  [126, 'spiral+corridor', 2, 'There is no gap I cannot close!'],
  [134, 'corridor+snake', 3, 'FALL!'],
  [142, 'burst', 4, '...'],
  [144, 'finale', 1, 'Then we fall... TOGETHER!'],
];
const DESP_PAT_NAME = { corridor: 'Corridor', hex: 'Hex', snake: 'Snake', spiral: 'Spiral', burst: 'Breathe', finale: 'Finale' };
const DESP_HIT = { kb: DESP.kb, iframes: DESP.iframes };
// seconds into the attacks (negative while you're still getting ready)
function despT(m) { return (m.moveT || 0) - DESP.grace; }
function despClock(m) {
  const left = Math.max(0, Math.ceil(DESP.length - Math.max(0, despT(m))));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}
function startDesperation(m) {
  m.despDone = true; m.despPending = false;
  setBossMove(m, 'desperation');
  const A = m.arena;
  m.phase = 2; m.bossInvuln = 1; m.bleed = null;
  m.beams = []; m.despNova = null; m.despWaveWarn = 0; m.despCharge = 0; m.despHands = '';
  m.despAct = 'ready'; m.despAi = -1; m.despXF = null; m.despRings = null; m.despFlash = 0; m.despT = {}; m.despBorder = 0;
  // the glowing walls (left, right and a roof over the tunnels)
  m.despL = r2(A.cx - DESP.wall); m.despR = r2(A.cx + DESP.wall);
  m.despTop = r2(A.cy - A.ry - 0.5); m.despFloorY = A.floor + 1;
  // everything he'd thrown vanishes, and his imps are sacrificed
  for (const pr of Game.projectiles) deathPuff(pr.x, pr.y, ['#b44bff', '#3a0c16']);
  Game.projectiles.length = 0;
  for (const q of Game.mobs) if (q.type === 'imp' && q.dying == null) killMob(q);
  sfx('desp.start'); sfx('boss.roar', { pitch: 0.6 }); screenShake(1.4); flashDamage();
  eventMessage('NO... NOT LIKE THIS! I WILL NOT FALL!', '#ff3a5a');
  eventMessage('Infinite flight granted!', '#ff4a4a');
  eventMessage('Get inside the fire walls, and survive until his strength runs out!', '#ffd24d');
}
// Drag a player toward (cx, cy) by `amt` tiles (sideways; walls stop it).
// (Kept for friends' games: the 'p' effect still uses it.)
function applyBossPull(p, cx, cy, amt) {
  const dx = cx - (p.x + p.w / 2);
  if (Math.abs(dx) < 1.5 || Math.abs(dx) > 60 || p.riding) return;
  const nx = p.x + Math.sign(dx) * Math.min(amt, Math.abs(dx) - 1.4);
  if (!boxHitsSolid(Game.world, nx, p.y, p.w, p.h)) p.x = nx;
  else if (!boxHitsSolid(Game.world, p.x, p.y - 1.05, p.w, p.h) && !boxHitsSolid(Game.world, nx, p.y - 1.05, p.w, p.h)) { p.y -= 1.05; p.x = nx; }
}
// A beam: from (x, y) at angle a, `len` long, `w` half-thick. It shows a warning
// line for `warn` seconds, then burns for `dur` seconds (turning at `spin` rad/s).
// (The Desperation's pillars are beams pointing straight down.)
function addBeam(m, x, y, a, o) { m.beams.push(Object.assign({ x: r2(x), y: r2(y), a, t: 0, warn: 0.7, dur: 0.35, len: 40, w: 0.45, spin: 0 }, o || {})); }
function beamDistTo(B, px, py) {
  const dx = Math.cos(B.a), dy = Math.sin(B.a), rx = px - B.x, ry = py - B.y;
  const t = Math.max(0, Math.min(B.len, rx * dx + ry * dy));
  return Math.hypot(rx - dx * t, ry - dy * t);
}
let beamSoundT = 0;
function updateBeams(m, dt) {
  beamSoundT -= dt;
  for (let i = m.beams.length - 1; i >= 0; i--) {
    const B = m.beams[i];
    B.t += dt;
    if (B.t < B.warn) continue;
    if (B.ghost) {   // (just a warning line - a hex line sends a dart down itself)
      if (B.dart) spawnProjectile({ x: B.x, y: B.y, vx: Math.cos(B.a) * B.dart, vy: Math.sin(B.a) * B.dart, kind: 'dart', r: 0.24, dmg: DESP_DMG.dart, solidHit: false, life: 4, desp: 1 });
      m.beams.splice(i, 1); continue;
    }
    if (B.t - dt < B.warn && beamSoundT <= 0) { beamSoundT = 0.22; sfx('abyss.beam', { vol: 0.75 }); }   // (a fence of pillars plays it once, not ten times)
    B.a += B.spin * dt;
    for (const q of bossVictims()) {
      if (B.only && B.only !== (q.isRemote ? q.id : 'host')) continue;
      let d = Infinity;
      for (const f of [0.15, 0.5, 0.85]) d = Math.min(d, beamDistTo(B, q.x + q.w / 2, q.y + q.h * f));
      if (d < B.w + 0.12) bossHitPlayer(B.dmg || DESP_DMG.pillar, B.x, q, B.fire || 0, DESP_HIT);
    }
    if (B.t >= B.warn + B.dur) m.beams.splice(i, 1);
  }
}
// (1.0.5) Infinite flight for everyone at the King's Desperation (from the moment it starts)
function despFlightOn(p) {
  const b = Game.boss;
  return !!(p && b && !b.dead && b.dying == null && b.move === 'desperation' && !Game.outside && b.arena && !p.swimming &&
    Math.abs(p.x + p.w / 2 - b.arena.cx) < 45 && Math.abs(p.y - b.arena.cy) < 40);
}
// The glowing walls: you can't walk (or fly) out once you're inside. (Every
// game does this for its own player, so it feels solid even in multiplayer.)
function updateDespBorder() {
  const b = Game.boss, p = Game.player;
  if (!p) return;
  if (!b || b.dead || b.dying != null || b.move !== 'desperation' || despT(b) < 0 || b.despL == null || Game.outside || p.dead) { p.despIn = null; if (!b || b.move !== 'desperation') p.despHealSeen = 0; return; }
  const cx = p.x + p.w / 2, inside = cx >= b.despL && cx <= b.despR && p.y >= b.despTop;
  if ((b.despHealN || 0) > (p.despHealSeen || 0)) {   // (1.0.5) the flash between rounds gives you 3 hearts back
    p.despHealSeen = b.despHealN;
    if (!p.dead) { p.heal(6); showToast('+3 hearts'); }
  }
  if (p.despIn && !inside) {
    if (cx < b.despL) { p.x = b.despL - p.w / 2; p.vx = Math.max(0, p.vx); }
    if (cx > b.despR) { p.x = b.despR - p.w / 2; p.vx = Math.min(0, p.vx); }
    if (p.y < b.despTop) { p.y = b.despTop; p.vy = Math.max(0, p.vy); }
  } else p.despIn = inside;
}
function kingDesperation(m, dt, cx, cy) {
  const A = m.arena, T = despT(m), D = m.despT;
  const L = m.despL, R = m.despR, TOP = m.despTop, FY = m.despFloorY, rnd = Math.random;
  const all = bossFighters(m), targets = all.length ? all : [MOB_TARGET || Game.player];
  m.bossInvuln = Math.max(m.bossInvuln, 1);   // (nothing hurts him now)
  m.despBorder = Math.min(1, (m.despBorder || 0) + dt / 1.5);
  m.despWaveWarn = Math.max(0, (m.despWaveWarn || 0) - dt);
  D.snd = (D.snd || 0) - dt;
  if (D.handsT > 0) { D.handsT -= dt; if (D.handsT <= 0) m.despHands = ''; }
  updateBeams(m, dt);

  // ---- GET READY: 10 seconds to reposition ----
  if (T < 0) {
    bossSteer(m, A.cx, A.cy - 3, 5, dt);
    m.shakeAmt = 0.5 + 0.4 * Math.sin(m.t * 6);
    m.despHands = 'up';
    if (!D.line2 && m.moveT >= 5) { D.line2 = 1; eventMessage('If I return to the dark... YOU COME WITH ME!', '#ff3a5a'); sfx('abyssking.say', { pitch: 0.7 }); }
    const sec = Math.ceil(-T);
    if (sec !== D.lastSec) { D.lastSec = sec; if (sec <= 3) sfx('desp.tick', { pitch: 0.5 + (3 - sec) * 0.15 }); }
    if (rnd() < dt * 40) {   // the dark gathers around him
      const a = rnd() * Math.PI * 2, r = 4 + rnd() * 3;
      Game.particles.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: -Math.cos(a) * r * 1.4, vy: -Math.sin(a) * r * 1.4, life: 0.7, age: 0, size: 0.1, kind: 'star', color: rnd() < 0.5 ? '#b44bff' : '#ff3a5a', gravity: 0 });
    }
    return;
  }
  if (!D.started) { D.started = 1; m.despHands = ''; sfx('desp.go'); sfx('boss.roar', { pitch: 0.75 }); screenShake(1); flashDamage(); }

  // ---- HE'S SPENT: his strength is gone and he falls (as the song ends) ----
  if (T >= DESP.length) {
    m.beams = []; m.despNova = null; m.despXF = null; m.despWaveWarn = 0; m.despCharge = 0; m.despHands = '';
    for (const pr of Game.projectiles) deathPuff(pr.x, pr.y, ['#b44bff', '#3a0c16']);
    Game.projectiles.length = 0;
    sfx('desp.end'); sfx('desp.nova'); m.despFlash = 1; screenShake(1.4);
    eventMessage('...the Abyss... will remember... your name...', '#ff3a5a');
    m.bossInvuln = 0; m.health = 0;
    killMob(m);   // (his death animation, then his loot - you survived, you win)
    return;
  }

  // which act are we in?
  let ai = 0;
  for (let i = 0; i < DESP_ACTS.length; i++) if (T >= DESP_ACTS[i][0]) ai = i;
  const act = DESP_ACTS[ai][1], lv = DESP_ACTS[ai][2], a = T - DESP_ACTS[ai][0];
  const actLen = (DESP_ACTS[ai + 1] ? DESP_ACTS[ai + 1][0] : DESP.length) - DESP_ACTS[ai][0], ka = Math.min(1, a / actLen);
  if (m.despAi !== ai) { m.despAi = ai; m.despAct = act; for (const k of ['cg', 'cdir', 'hk', 'sk', 'bk', 'spA', 'spDir', 'hex2', 'sPh']) D[k] = null; /* (every pattern starts the same way every time) */ screenShake(0.6); sfx('boss.roar', { pitch: 0.8 + Math.min(ai, 10) * 0.04 }); eventMessage(DESP_ACTS[ai][3], '#ff3a5a'); }
  m.shakeAmt = 0.4 + 0.6 * (T / DESP.length) + Math.sin(m.t * 20) * 0.2;
  if (rnd() < dt * 25) Game.particles.push({ x: cx + (rnd() - 0.5) * 4, y: cy + (rnd() - 0.5) * 4, vx: (rnd() - 0.5) * 4, vy: -1, life: 0.6, age: 0, size: 0.1, color: rnd() < 0.5 ? '#b44bff' : '#3a0c16', gravity: 0 });

  // ---- little helpers ----
  // fire `fn` every `sec` seconds (the first time after `first` seconds). Each act
  // has its own timers, so an act that comes back later starts fresh.
  const every = (key, sec, fn, first) => { const k = ai + ':' + key; if (D[k] == null) D[k] = first != null ? first : sec; D[k] -= dt; if (D[k] <= 0) { D[k] += sec; fn(); } };
  // do `fn` once, `time` seconds into this act
  const at = (time, fn) => { const k = 'at' + ai + '_' + time; if (a >= time && !D[k]) { D[k] = 1; fn(); } };
  const orbSound = () => { if (D.snd <= 0) { D.snd = 0.14; sfx('abyss.orb', { vol: 0.6 }); } };
  const orb = (x, y, vx, vy, r, dmg, kind) => spawnProjectile({ x, y, vx, vy, kind: kind || 'orb', r: r || 0.32, dmg: dmg || DESP_DMG.orb, solidHit: false, life: 7, desp: 1 });
  const midX = (q) => q.x + q.w / 2, midY = (q) => q.y + q.h / 2;
  // is this player up in the air (not just hopping)?
  const flying = (q) => !q.onGround && q.y + q.h < FY - 2.2;
  // an orb falling through the roof
  const drop = (x, sp) => orb(Math.max(L + 0.4, Math.min(R - 0.4, x)), TOP - 2.5 - rnd() * 1.5, (rnd() - 0.5) * 0.5, sp, 0.32);
  // a random spot for rain, never right next to the last few (so it never clumps into a wall)
  const rainSpot = () => {
    const rec = D.recent || (D.recent = []);
    let x = L + 0.5 + rnd() * (R - L - 1);
    for (let i = 0; i < 6 && rec.some(r => Math.abs(r - x) < 1.6); i++) x = L + 0.5 + rnd() * (R - L - 1);
    rec.unshift(x); rec.length = Math.min(rec.length, 3);
    return x;
  };
  // a pillar of fire, top to bottom at x, after a `warn`-second warning line
  const pillar = (x, warn) => addBeam(m, x, TOP - 1, Math.PI / 2, { warn, dur: 0.32, len: r2(FY - TOP + 2), w: 0.62, dmg: DESP_DMG.pillar });
  // a LANCE straight across the sky at height y (for players in the air)
  const lance = (y, warn) => addBeam(m, L - 1, y, 0, { warn, dur: 0.32, len: r2(R - L + 2), w: 0.55, dmg: DESP_DMG.pillar });
  // four pillars, one after another, each where the player is right then
  const chase = () => { sfx('desp.mark'); for (const q of targets) (D.chains || (D.chains = [])).push({ q, n: 4, t: 0 }); };
  // pillars across the WHOLE arena, 3.2 blocks apart, lighting up from one side:
  // stay in a gap. Returns how long until the last one fires.
  const fence = (off, dir) => {
    sfx('desp.mark');
    const xs = [];
    for (let x = L + off; x <= R - 0.3; x += 3.2) xs.push(x);
    if (dir < 0) xs.reverse();
    xs.forEach((x, i) => pillar(x, 1.0 + i * 0.06));
    return 1.0 + xs.length * 0.06;
  };
  if (D.chains) for (let i = D.chains.length - 1; i >= 0; i--) {
    const c = D.chains[i];
    c.t -= dt;
    if (c.t > 0) continue;
    if (!c.q.dead) pillar(midX(c.q), 0.85);
    c.t = 0.55;
    if (--c.n <= 0) D.chains.splice(i, 1);
  }
  if (D.fenceB != null) { D.fenceB -= dt; if (D.fenceB <= 0) { D.fenceB = null; fence(D.fenceOff, D.fenceDir); } }
  // CROSSFIRE walls: warned on their side for 0.9 s, then they sweep across
  if (m.despXF) for (let i = m.despXF.length - 1; i >= 0; i--) {
    const W = m.despXF[i];
    W.t = r2(W.t + dt);
    if (W.t < W.warn) continue;
    m.despXF.splice(i, 1);
    sfx('abyss.orb', { vol: 0.7 });
    const x0 = W.side < 0 ? L + 0.2 : R - 0.2, life = (R - L) / W.sp + 0.3;
    for (let y = TOP + 0.6; y <= FY - 0.3; y += 0.9) {
      if (W.gaps.some(([g0, g1]) => y > g0 - 0.35 && y < g1 + 0.35)) continue;
      spawnProjectile({ x: x0, y, vx: -W.side * W.sp, vy: 0, kind: 'orb', r: 0.32, dmg: DESP_DMG.orb, solidHit: false, life, desp: 1 });
    }
  }
  // a crossfire wall from `side` (-1 left, 1 right): a gap at the floor, and one in the sky
  const crossfire = (side, sp, gapH) => {
    const top = TOP + 2.5, bot = FY - 2.9 - gapH - 1.5;
    let gy = top + rnd() * Math.max(0, bot - top);
    // (make the sky gap reachable: never too far from at least one flying player's height)
    const fl = targets.filter(flying);
    if (fl.length && rnd() < 0.6) { const q = fl[Math.floor(rnd() * fl.length)]; gy = Math.max(top, Math.min(bot, midY(q) - gapH / 2 + (rnd() - 0.5) * 5)); }
    const W = { side, sp, t: 0, warn: 0.9, gaps: [[r2(FY - 2.9), r2(FY + 1)], [r2(gy), r2(gy + gapH)]] };
    (m.despXF || (m.despXF = [])).push(W);
    sfx('desp.mark');
  };
  // homing souls: follow you for 1.6 s, then fly straight on
  const soul = (q, ang, sp) => spawnProjectile({ x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, kind: 'soul', r: 0.34, dmg: DESP_DMG.orb, solidHit: false, life: 6, desp: 1, home: { id: q.isRemote ? q.id : 'host', t: 1.6, turn: 2.2, sp } });

  // ---- the walls hurt anyone still outside them, and so does touching HIM ----
  for (const q of bossVictims()) {
    const qx = midX(q), out = qx < L ? 1 : qx > R ? -1 : 0;
    if (out || q.y < TOP) bossHitPlayer(DESP_DMG.border, out > 0 ? L - 3 : out < 0 ? R + 3 : qx, q, 0, { kb: [10, 3], iframes: 0.6 });
    if (q.x < m.x + m.w - 0.3 && q.x + q.w > m.x + 0.3 && q.y < m.y + m.h - 0.3 && q.y + q.h > m.y + 0.3) bossHitPlayer(DESP_DMG.touch, cx, q, 0, { kb: [9, 5], iframes: DESP.iframes });
  }

  // ---- THE PATTERNS (lv = 1, 2 or 3: how fast this time round) ----
  // Nothing here is random: every pattern plays out the same way every time.
  const dart = (x, y, ang, sp, dmg) => spawnProjectile({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, kind: 'dart', r: 0.24, dmg: dmg || DESP_DMG.dart, solidHit: false, life: 5, desp: 1 });
  const W = R - L, MID = (L + R) / 2, HOME_Y = A.cy - 3;
  // a pillar erupting from the floor at x (thin red line first)
  const erupt = (x, warn) => addBeam(m, x, FY + 1, -Math.PI / 2, { warn, dur: 0.45, len: r2(FY - TOP + 2), w: 0.7, dmg: DESP_DMG.pillar, thin: 1, flame: 1 });
  // red lines out of (x, y) in a circle; a dart flies down each when it's warned
  const lines = (x, y, n, off, sp, warn) => { for (let i = 0; i < n; i++) addBeam(m, x, y, off + i / n * Math.PI * 2, { warn, dur: 0, len: 30, w: 0.1, ghost: 1, thin: 1, dart: sp }); sfx('desp.mark'); };
  const bloom = (x, y) => {   // the big pink rings (just for show) + a soft flash
    m.despFlash = Math.max(m.despFlash || 0, 0.35);
    const R0 = m.despRings || (m.despRings = []);
    for (let i = 0; i < 4; i++) { const a2 = i * Math.PI / 2 + Math.PI / 4; R0.push({ x: r2(x + Math.cos(a2) * 3), y: r2(y + Math.sin(a2) * 3), r: 0.5, t: 0 }); }
    sfx('desp.nova', { vol: 0.45, pitch: 1.3 });
  };
  if (m.despRings) { for (const g of m.despRings) { g.t = r2(g.t + dt); g.r = r2(g.r + dt * 14); } m.despRings = m.despRings.filter(g => g.t < 1.1); if (!m.despRings.length) m.despRings = null; }
  m.despFlash = Math.max(0, r2((m.despFlash || 0) - dt * 1.4));
  m.despPat = act.split('+').map(k => DESP_PAT_NAME[k] || k).join(' + ');

  // CORRIDOR: a fence of pillars with one gap that steps along
  const corridor = (gapW, step, period, warn, aim, still) => {
    if (!still) bossSteer(m, MID, TOP + 3, 8, dt);
    if (aim) every('cAim', aim, () => {   // (from round 2) a dart aimed at you while you're in the gap
      orbSound();
      for (const q of targets) dart(cx, cy, Math.atan2(q.y + q.h / 2 - cy, q.x + q.w / 2 - cx), 13);
    }, 1.0);
    every('corr', period, () => {
      D.cg = D.cg == null ? MID : D.cg + (D.cdir || 1) * step;
      if (D.cg + gapW / 2 > R - 0.5) { D.cg = R - 0.5 - gapW / 2; D.cdir = -1; }
      if (D.cg - gapW / 2 < L + 0.5) { D.cg = L + 0.5 + gapW / 2; D.cdir = 1; }
      for (let x = L + 1.2; x < R - 0.5; x += 2.4) if (Math.abs(x - D.cg) > gapW / 2 + 0.7) erupt(x, warn);
      sfx('desp.mark');
    }, 0.6);
  };
  // HEX: he goes to the middle and casts; each set is turned half a gap from the last
  const HEX_SPOTS = [MID, MID - 9, MID + 9];
  const hexes = (n, period, sp, warn, sets, still) => {
    // he hops between three spots - middle, left, right - casting at each
    if (!still) bossSteer(m, HEX_SPOTS[(D.hk || 0) % 3], HOME_Y, 16, dt);
    every('hex', period, () => {
      D.hk = (D.hk || 0) + 1;
      D.hexSet = 0; D.hexN = sets; D.hexOff = D.hk * Math.PI / n;
      lines(cx, cy, n, D.hexOff, sp, warn); bloom(cx, cy);
      D.hex2 = sets > 1 ? 0.42 : null;
    }, 0.8);
    if (D.hex2 != null) {   // the next set, turned half a gap again
      D.hex2 -= dt;
      if (D.hex2 <= 0) {
        D.hexSet++; D.hexOff += Math.PI / n;
        lines(cx, cy, n, D.hexOff, sp, warn * 0.85);
        D.hex2 = D.hexSet + 1 < D.hexN ? 0.42 : null;
      }
    }
  };
  // SNAKE: falling walls of darts; the gap follows a smooth snake from side to side
  const snake = (gapW, period, sp, bombs, still) => {
    if (!still) bossSteer(m, MID + Math.sin(a * 0.5) * 6, TOP + 3, 6, dt);
    every('row', period, () => {
      D.sk = (D.sk || 0) + 1;
      // (the snake never moves the gap further between two walls than you can fly in that time)
      const amp = W / 2 - gapW / 2 - 1.5, stepA = Math.min(0.42, 0.65 * 8.6 * period / amp);
      D.sPh = (D.sPh || 0) + stepA;
      const gx = MID + amp * Math.sin(D.sPh);
      D.gapX = gx;
      for (let x = L + 0.4; x <= R - 0.3; x += 0.9) if (Math.abs(x - gx) > gapW / 2) dart(x, TOP + 0.2, Math.PI / 2, sp);
      orbSound();
    }, 0.4);
    if (bombs) every('bomb', bombs, () => {   // (II, III) a bomb on alternate sides, always the same spots
      D.bk = (D.bk || 0) + 1;
      const tx = MID + (D.bk % 2 ? -1 : 1) * W * 0.3, ty = (TOP + FY) / 2, d = Math.hypot(tx - cx, ty - cy) || 1, spd = 7;
      spawnProjectile({
        x: cx, y: cy, vx: (tx - cx) / d * spd, vy: (ty - cy) / d * spd, kind: 'fireorb', r: 0.6, dmg: DESP_DMG.blast, life: 5, ghostT: 9, desp: 1,
        burst: { n: 10, speed: 6, fuse: Math.max(0.4, d / spd), dmg: DESP_DMG.dart, kind: 'dart' }
      });
      sfx('abyss.fireorb');
    }, 2);
  };
  // SPIRAL: he spins in the middle, firing arms of darts in pulses
  const spiral = (arms, spin, pulse, sp, flips, still) => {
    if (!still) bossSteer(m, MID, (TOP + FY) / 2 - 1, 10, dt);
    if (a < 1.2) return;   // (he gets into position first)
    const dir = flips && Math.floor((a - 1.2) / ((actLen - 2.2) / (flips + 1))) % 2 ? -1 : 1;
    if (D.spDir !== dir) { if (D.spDir != null) { sfx('boss.roar', { pitch: 1.1 }); screenShake(0.4); } D.spDir = dir; }
    D.spA = (D.spA || 0) + spin * dir * dt;
    every('spiral', pulse, () => { for (let i = 0; i < arms; i++) dart(cx, cy, D.spA + i / arms * Math.PI * 2, sp); orbSound(); }, 0);
  };

  //               I      II     III    (IV: only in pairs, a touch gentler each)
  const CORR = (lv, still) => corridor([4.8, 4.3, 3.9][lv - 1], [3, 3.3, 3.6][lv - 1], [1.25, 1.08, 0.92][lv - 1], [0.78, 0.68, 0.6][lv - 1], [0, 1.3, 1.0][lv - 1], still);
  const HEX = (lv, still) => hexes([16, 18, 20][lv - 1], [2.4, 2.1, 1.8][lv - 1], [12, 13, 14][lv - 1], 0.7, [1, 2, 3][lv - 1], still);
  const SNAKE = (lv, still) => snake([4.8, 4.4, 4.0][lv - 1], [0.95, 0.82, 0.72][lv - 1], [9, 10, 11][lv - 1], [0, 3.2, 2.6][lv - 1], still);
  // (the spin never sweeps faster than you can fly round him at 6 blocks out; harder = more arms, quicker pulses)
  const SPIRAL = (lv, still) => spiral([3, 4, 5][lv - 1], [0.9, 1.0, 1.1][lv - 1], [0.3, 0.27, 0.24][lv - 1], [8, 8.5, 9][lv - 1], [1, 2, 3][lv - 1], still);
  const PAT = { corridor: CORR, hex: HEX, snake: SNAKE, spiral: SPIRAL };
  if (act.includes('+')) {   // two patterns at once: the first leads (and moves him), the second is a level gentler
    const [p1, p2] = act.split('+');
    PAT[p1](lv);
    PAT[p2](Math.max(1, lv - 1), true);
  } else switch (act) {
    case 'corridor': case 'hex': case 'snake': case 'spiral': PAT[act](lv); break;
    case 'burst':       // a white flash between rounds: a breath, and 3 hearts back
      bossSteer(m, MID, HOME_Y, 10, dt);
      at(0, () => {
        m.despFlash = 1; sfx('desp.nova'); screenShake(1.2);
        for (const pr of Game.projectiles) deathPuff(pr.x, pr.y, ['#ff5ac8', '#3a0c16']);
        Game.projectiles.length = 0; m.beams = [];
        m.despHealN = (m.despHealN || 0) + 1;   // (every player's own game heals them)
      });
      break;
    case 'finale': {    // three last pairs, each harder... then he gathers it all, and it ends in light
      const end = actLen - 3.2;
      if (a < end) {
        const third = end / 3;
        if (a < third) { HEX(3); SNAKE(1, true); }
        else if (a < third * 2) { SPIRAL(3); CORR(2, true); }
        else { CORR(3); HEX(1, true); }
      } else {   // the last 3 seconds: he swells with light (nothing new is thrown)
        bossSteer(m, MID, HOME_Y, 8, dt);
        m.despHands = 'up'; D.handsT = 0;
        m.despCharge = r2((a - end) / 3.2);
        m.shakeAmt = 1 + m.despCharge * 2;
        at(end, () => { sfx('desp.charge'); });
        if (rnd() < dt * 80) { const ang = rnd() * Math.PI * 2, r = 5 + rnd() * 6; Game.particles.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, vx: -Math.cos(ang) * r * 1.8, vy: -Math.sin(ang) * r * 1.8, life: 0.55, age: 0, size: 0.12, kind: 'star', color: rnd() < 0.6 ? '#ffffff' : '#ff5ac8', gravity: 0 }); }
      }
      break;
    }
  }
}
function setBossMove(m, mv) {
  m.move = mv; m.moveT = 0; m.fired = 0;
  if (mv === 'claws') { m.clawStage = 'aim'; m.clawT = 0; m.clawRound = 1; }
  if (mv === 'charge') { m.chargeStage = 'windup'; }
  if (mv === 'meteor') m.meteorXs = null;
}
function pickBossMove(m) {
  const imps = Game.mobs.filter(x => x.type === 'imp' && x.dying == null).length;
  const opts = m.phase === 1
    ? [['volley', 3], ['claws', 3], ['charge', 2], ['summon', imps < 2 ? 1.3 : 0]]
    : [['volley', 2], ['claws', 2], ['charge', 2], ['ring', 3], ['meteor', 3]];
  const pool = opts.filter(o => o[0] !== m.lastMove && o[1] > 0);
  let r = Math.random() * pool.reduce((s, o) => s + o[1], 0), pick = pool[0][0];
  for (const o of pool) { r -= o[1]; if (r <= 0) { pick = o[0]; break; } }
  m.lastMove = pick; m.side = -m.side; m.rnd = Math.random() * 0.6;
  setBossMove(m, pick);
}
function bossSteer(m, tx, ty, maxSp, dt) {
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  m.vx = approach(m.vx, Math.max(-maxSp, Math.min(maxSp, (tx - cx) * 2.2)), 26 * dt);
  m.vy = approach(m.vy, Math.max(-maxSp, Math.min(maxSp, (ty - cy) * 2.2)), 26 * dt);
}
function kingAI(m, dt, p) {
  const A = m.arena, fast = m.phase === 2 ? 1.35 : 1;
  m.t += dt; m.moveT += dt;
  m.bossInvuln = Math.max(0, m.bossInvuln - dt);
  m.contactCd = Math.max(0, (m.contactCd || 0) - dt);
  m.shakeAmt = Math.max(0, (m.shakeAmt || 0) - dt * 2);
  m.bob = Math.sin(m.t * 1.8) * 0.18;
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2, px = p.x + p.w / 2, py = p.y + p.h / 2;
  m.facingDir = px < cx ? -1 : 1;
  // he gives up once EVERYONE is dead or has run away
  if (!bossFighters(m).length) { m.leaveT += dt; if (m.leaveT > (bossPlayers().length ? 4 : 2)) { bossLeave(m); return; } }
  else m.leaveT = 0;
  if (m.despPending && !m.despDone && m.move !== 'desperation') startDesperation(m);
  if (m.phase === 1 && m.health <= m.maxHealth / 2 && m.move !== 'desperation') {
    m.phase = 2; setBossMove(m, 'enrage'); m.bossInvuln = 2.4;
    sfx('boss.roar'); screenShake(1); flashDamage();
    eventMessage('The King of the Abyss is enraged!', '#ff4a4a');
  }
  const hoverY = Math.max(A.cy - A.ry + 3, Math.min(A.floor - 5, py - 6));
  switch (m.move) {
    case 'desperation': kingDesperation(m, dt, cx, cy); break;
    case 'intro':
      m.vx = 0; m.vy = -1.1; m.shakeAmt = 0.6;
      if (m.moveT > 2.6) setBossMove(m, 'hover');
      break;
    case 'enrage':
      m.vx *= 0.9; m.vy *= 0.9; m.shakeAmt = 1.2;
      if (Math.random() < dt * 40) Game.particles.push({ x: cx + (Math.random() - 0.5) * 3, y: cy + (Math.random() - 0.5) * 3, vx: 0, vy: -3, life: 0.7, age: 0, size: 0.1, color: '#ff3a2a', gravity: -2 });
      if (m.moveT > 2.4) setBossMove(m, 'hover');
      break;
    case 'hover':
      bossSteer(m, px + m.side * 4.5, hoverY, 7 * fast, dt);
      if (m.moveT > (m.phase === 2 ? 0.8 : 1.5) + m.rnd) pickBossMove(m);
      break;
    case 'volley': {
      bossSteer(m, px + m.side * 5, hoverY, 3, dt);
      const times = m.phase === 2 ? [0.4, 0.75, 1.1, 1.45] : [0.45, 0.9, 1.35];
      if (m.fired < times.length && m.moveT >= times[m.fired]) { m.fired++; shootFireballs(m, m.phase === 2 ? 5 : 3, 0.24, 9 * fast); }
      if (m.moveT > times[times.length - 1] + 0.5) setBossMove(m, 'hover');
      break;
    }
    case 'claws':
      bossSteer(m, px - m.side * 4, hoverY - 1, 4, dt);   // (the claws do the work, see updateKingHands)
      break;
    case 'charge':
      if (m.chargeStage === 'windup') {
        if (m.moveT < 0.05) sfx('boss.charge');
        m.vx = approach(m.vx, 0, 30 * dt);
        m.vy = approach(m.vy, Math.max(-5, Math.min(5, (Math.max(A.cy - A.ry + 2, Math.min(A.floor - m.h / 2 - 0.2, py)) - cy) * 3)), 30 * dt);
        m.shakeAmt = 1;
        if (m.moveT > (m.phase === 2 ? 0.65 : 0.9)) { m.chargeStage = 'dash'; m.chargeDir = px < cx ? -1 : 1; m.moveT = 0; sfx('boss.roar', { pitch: 1.2 }); }
      } else if (m.chargeStage === 'dash') {
        m.vx = m.chargeDir * 22 * fast; m.vy *= 0.9;
        for (let i = 0; i < 3; i++) spawnFlame(cx - m.chargeDir * 1.2 + (Math.random() - 0.5), cy + (Math.random() - 0.5) * 3);
        if (m.moveT > 0.75) { m.chargeStage = 'stop'; m.moveT = 0; }
      } else {
        m.vx *= Math.pow(0.02, dt);
        if (m.moveT > 0.5) setBossMove(m, 'hover');
      }
      break;
    case 'summon':
      m.vx *= 0.9; m.vy *= 0.9;
      if (m.moveT > 0.8 && !m.fired) {
        m.fired = 1; sfx('imp.charge');
        for (const side of [-1, 1]) {
          const im = new Mob('imp', cx + side * 3, cy - 1); im.guardian = true; im.state = 'hostile'; Game.mobs.push(im);
          deathPuff(cx + side * 3, cy - 0.6, ['#8e1b22', '#3a0c16', '#ffb347']);
        }
      }
      if (m.moveT > 1.4) setBossMove(m, 'hover');
      break;
    case 'ring': {
      m.vx *= 0.92; m.vy *= 0.92;
      const times = [0.35, 0.95, 1.55];
      if (m.fired < times.length && m.moveT >= times[m.fired]) {
        m.fired++; sfx('boss.shoot', { pitch: 0.7 });
        const n = 14, off = m.fired * 0.23;
        for (let i = 0; i < n; i++) {
          const a = off + i / n * Math.PI * 2;
          spawnProjectile({ x: cx, y: cy - 0.3, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, kind: 'orb', r: 0.28, dmg: 4, solidHit: false, life: 5 });
        }
      }
      if (m.moveT > 2.1) setBossMove(m, 'hover');
      break;
    }
    case 'meteor':
      bossSteer(m, A.cx, A.cy - A.ry + 4, 5, dt);
      if (!m.meteorXs) {   // (1.0.5) a storm around EVERY player, not just one
        m.meteorXs = [];
        const who = bossAimList(m), per = who.length > 1 ? 7 : 9;
        for (const q of who) for (let i = 0; i < per; i++) {
          const x = q.x + q.w / 2 + (i - (per - 1) / 2) * 2.5 + (Math.random() - 0.5);
          if (!m.meteorXs.some(o => Math.abs(o - x) < 1.4)) m.meteorXs.push(x);
        }
        sfx('boss.roar', { pitch: 0.9 });
      }
      if (m.moveT > 0.9 && !m.fired) {
        m.fired = 1;
        for (const x of m.meteorXs) {
          let y = A.cy - A.ry - 3;
          while (y < A.floor && solidAt(Math.floor(x), y)) y++;   // first open air under the roof
          if (y < A.floor - 1) spawnProjectile({ x, y: y + 0.2, vx: 0, vy: 12, kind: 'meteor', r: 0.5, dmg: 6, fire: 3, life: 4, ghostT: 0.15 });
        }
      }
      if (m.moveT > 2.2) { m.meteorXs = null; setBossMove(m, 'hover'); }
      break;
  }
  // he floats and phases through rock, but stays around his arena
  m.x += m.vx * dt; m.y += m.vy * dt;
  m.x = Math.max(A.cx - A.rx - 14, Math.min(A.cx + A.rx + 14 - m.w, m.x));
  m.y = Math.max(A.cy - A.ry - 3, Math.min(A.floor + 1 - m.h, m.y));
  updateKingHands(m, dt, p);
  if (m.move !== 'intro' && m.move !== 'desperation' && m.contactCd <= 0) for (const q of bossVictims()) {   // touching him hurts (anyone)
    if (q.x < m.x + m.w - 0.2 && q.x + q.w > m.x + 0.2 && q.y < m.y + m.h - 0.3 && q.y + q.h > m.y + 0.3) { bossHitPlayer(m.move === 'charge' ? 8 : 5, cx, q); m.contactCd = 0.7; }
  }
  m.soundCd -= dt;
  if (m.soundCd <= 0) { m.soundCd = 6 + Math.random() * 6; sfx('abyssking.say'); }
  if (Math.random() < dt * 8) Game.particles.push({ x: cx + (Math.random() - 0.5) * 0.8, y: m.y + 0.4, vx: (Math.random() - 0.5) * 0.4, vy: -1.2, life: 0.8, age: 0, size: 0.07, color: '#ffb347', gravity: -1 });
}
function updateKingHands(m, dt, p) {
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2, px = p.x + p.w / 2, py = p.y + p.h / 2;
  for (const h of m.hands) h.glow = Math.max(0, h.glow - dt * 2);
  if (m.move === 'claws') {
    m.clawT += dt;
    if (m.clawStage === 'aim') {
      // (1.0.5) with friends there, each claw goes after a different player
      // (and the next round of claws picks the next players)
      const who = bossAimList(m);
      m.hands.forEach((h, i) => {
        const k = Math.min(1, dt * 10);
        const q = who.length > 1 ? who[(i + (m.clawRound || 0) * 2) % who.length] : null;
        const tx = q ? q.x + q.w / 2 : px + h.side * 1.3, ty = q ? q.y + q.h / 2 : py;
        h.ty = ty; h.x += (tx - h.x) * k; h.y += (ty - 5.5 - h.y) * k; h.glow = 1; h.st = 'aim';
      });
      if (m.clawT > (m.phase === 2 ? 0.55 : 0.8)) { m.clawStage = 'slam'; m.clawT = 0; for (const h of m.hands) { h.vy = 4; h.st = 'slam'; } sfx('sweep', { pitch: 0.6 }); }
    } else if (m.clawStage === 'slam') {
      let done = true;
      for (const h of m.hands) {
        if (h.st !== 'slam') continue;
        done = false;
        h.vy = Math.min(34, h.vy + 95 * dt); h.y += h.vy * dt;
        for (const q of bossVictims()) if (boxDistToPoint(q, h.x, h.y) < 0.8) bossHitPlayer(7, h.x, q);
        if (solidAt(Math.floor(h.x), Math.floor(h.y + 0.7)) || h.y > (h.ty ?? py) + 4 || m.clawT > 0.9) {
          h.st = 'hit';
          explodeFX(h.x, h.y + 0.6, true);
          screenShake(0.35);
          for (const q of bossVictims()) if (boxDistToPoint(q, h.x, h.y + 0.3) < 1.3) bossHitPlayer(7, h.x, q);
        }
      }
      if (done) { m.clawStage = 'rest'; m.clawT = 0; }
    } else if (m.clawT > 0.45) {
      if (m.phase === 2 && m.clawRound < 2) { m.clawRound++; m.clawStage = 'aim'; m.clawT = 0; }
      else setBossMove(m, 'hover');
    }
    return;
  }
  if (m.move === 'desperation' && m.despHands === 'slam') {   // (1.0.4) slamming the floor: the shockwaves start here
    for (const h of m.hands) { const k = Math.min(1, dt * 22); h.x += (cx + h.side * 1.4 - h.x) * k; h.y += (m.despFloorY - 0.8 - h.y) * k; h.st = 'hit'; h.glow = 1; }
    return;
  }
  const up = m.move === 'summon' || m.move === 'enrage' || m.move === 'intro' || (m.move === 'desperation' && m.despHands === 'up');
  for (const h of m.hands) {
    if (m.move === 'desperation' && m.despHands === 'up') h.glow = 1;
    const tx = cx + h.side * (up ? 2.8 : 2.4), ty = up ? cy - 2.2 : cy + 0.6 + Math.sin(m.t * 2 + h.side) * 0.3;
    const k = Math.min(1, dt * 8);
    h.x += (tx - h.x) * k; h.y += (ty - h.y) * k; h.st = 'idle';
  }
}

// ---- VISUALS (drawing and effects) ----
const KING_IMG = new Image();
KING_IMG.src = 'Textures/entities/king_of_the_abyss.png';
const KING_HAND_IMG = new Image();
KING_HAND_IMG.src = 'Textures/entities/king_hand.png';
// ---- drawing the King ----
// (1.0.1) HE MOVES: his picture comes in pieces (cape, sleeves, body, head, jaw) so each one can move.
//   idle: he breathes, his cape ripples, his sleeves sway, his head bobs; now and then he chuckles (jaw chatter)
//   moving: he leans into it and his cape and sleeves trail behind; a charge throws his whole body forward
//   attacking: his jaw snaps open with every volley and ring, fire glows inside his mouth
//   roaring (intro, enrage, summon, meteors, the charge dash, Desperation): head thrown back, jaw wide, sleeves flung up
//   rising (intro): he fades in out of the dark
const KING_PARTS = { img: new Image(), c: null, names: ['cape', 'sleeveL', 'sleeveR', 'body', 'head', 'jaw'] };
KING_PARTS.img.onload = () => {
  const c = {};
  KING_PARTS.names.forEach((n, i) => { const cv = document.createElement('canvas'); cv.width = 80; cv.height = 112; const g = cv.getContext('2d'); g.drawImage(KING_PARTS.img, i * 80, 0, 80, 112, 0, 0, 80, 112); c[n] = cv; });
  KING_PARTS.c = c;
};
{ const p = 'Textures/entities/king_of_the_abyss_parts.png'; KING_PARTS.img.src = (window.TEXTURE_BUNDLE && window.TEXTURE_BUNDLE[p]) || p; }
const KB22 = { Q: 3, PX: 26, PY: 22, c: null };   // the buffer he's put together in (art pixels x Q, with room around him)
KB22.W = 80 + KB22.PX * 2; KB22.H = 112 + KB22.PY * 2;
// where he is in his animation: smoothed numbers, kept on the mob
function kingAnim22(m) {
  const t = Game.time, dt = Math.min(0.05, Math.max(0, t - (m._kat == null ? t : m._kat))); m._kat = t;
  const A = m._ka || (m._ka = { jaw: 0, head: 0, lift: 0, sl: 0, lean: 0, fire: 0 });
  const mv = m.move, mt = m.moveT || 0, face = m.facingDir || 1;
  let jaw = 0, head = 0, lift = 0, sl = 0, lean = Math.max(-0.22, Math.min(0.22, (m.vx || 0) * face * 0.014));
  const roar = mv === 'enrage' || (mv === 'intro' && mt > 0.9) || mv === 'summon' || (mv === 'meteor' && mt < 1.1) || (mv === 'charge' && m.chargeStage === 'dash') || mv === 'desperation';
  if (roar) { jaw = 1; head = -0.2; lift = 1; sl = mv === 'charge' ? -0.5 : 1; }
  const shots = mv === 'volley' ? (m.phase === 2 ? [0.4, 0.75, 1.1, 1.45] : [0.45, 0.9, 1.35]) : mv === 'ring' ? [0.35, 0.95, 1.55] : null;
  if (shots) for (const T of shots) { const k = 1 - Math.abs(mt - T + 0.05) / 0.16; if (k > 0) { jaw = Math.max(jaw, k); head = Math.min(head, -0.14 * k); sl = Math.max(sl, 0.35 * k); } }
  if (mv === 'charge' && m.chargeStage === 'windup') { jaw = 0.45; head = 0.12; sl = -0.35; lean = -0.12; }
  if (mv === 'charge' && m.chargeStage === 'dash') lean = 0.3;
  if (mv === 'claws') { jaw = 0.25 + 0.2 * Math.sin(t * 9); head = 0.06; }
  if (!roar && !shots && mv !== 'charge' && mv !== 'claws' && (t % 7.5) < 0.9) { jaw = 0.3 + 0.3 * Math.sin(t * 34); head = -0.05 + 0.04 * Math.sin(t * 17); }   // he chuckles
  const k = (r) => Math.min(1, dt * r);
  A.jaw += (jaw - A.jaw) * k(jaw > A.jaw ? 26 : 10); A.head += (head - A.head) * k(9); A.lift += (lift - A.lift) * k(8);
  A.sl += (sl - A.sl) * k(7); A.lean += (lean - A.lean) * k(6); A.fire += ((roar || A.jaw > 0.4 ? 1 : 0) - A.fire) * k(8);
  A.alpha = mv === 'intro' ? Math.min(1, mt / 1.3) : 1;
  return A;
}
function drawKing(g, m, u, eyes) {
  const t = Game.time, enraged = m.phase === 2;
  const shake = m.shakeAmt ? (Math.random() - 0.5) * m.shakeAmt * u * 2 : 0;
  g.translate(shake, (m.bob || 0) * TILE);
  const A = kingAnim22(m);
  // a dark red aura
  const R = 34 * u, pulse = 0.5 + 0.5 * Math.sin(t * 3);
  const gr = g.createRadialGradient(0, 0, 4 * u, 0, 0, R);
  gr.addColorStop(0, `rgba(255,30,40,${((enraged ? 0.4 : 0.22) + 0.12 * pulse + 0.15 * A.fire) * A.alpha})`); gr.addColorStop(1, 'rgba(255,30,40,0)');
  g.fillStyle = gr; g.fillRect(-R, -R, R * 2, R * 2);
  const P = KING_PARTS.c;
  if (!P) {   // (still loading: the whole picture, as before)
    if (KING_IMG.complete && KING_IMG.naturalWidth) g.drawImage(KING_IMG, -20 * u, -28 * u, 40 * u, 56 * u);
    else { g.fillStyle = '#3a0c16'; g.fillRect(-12 * u, -28 * u, 24 * u, 56 * u); }
    return;
  }
  // ---- put him together in art pixels (80 x 112), then draw him once at the right size ----
  const Q = KB22.Q;
  if (!KB22.c) { KB22.c = document.createElement('canvas'); KB22.c.width = KB22.W * Q; KB22.c.height = KB22.H * Q; KB22.g = KB22.c.getContext('2d'); }
  const b = KB22.g;
  b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, KB22.c.width, KB22.c.height);
  b.imageSmoothingEnabled = false;
  b.setTransform(Q, 0, 0, Q, KB22.PX * Q, KB22.PY * Q);
  const vx = (m.vx || 0) * (m.facingDir || 1);
  const rot = (cx, cy, a, fn) => { b.save(); b.translate(cx, cy); b.rotate(a); b.translate(-cx, -cy); fn(); b.restore(); };
  rot(40, 72, A.lean, () => {
    // the cape, in strips: a ripple running down it, and it trails behind when he moves
    const amp = 1.1 + Math.min(3, Math.abs(vx) * 0.12) + (enraged ? 0.7 : 0) + A.fire * 0.8, drag = -Math.max(-6, Math.min(6, vx * 0.28));
    for (let y = 36; y < 112; y += 2) {
      const d = (y - 36) / 76, off = (Math.sin(t * 3.1 - y * 0.13) * amp + drag) * d;
      b.drawImage(P.cape, 0, y, 80, 2, off, y, 80, 2);
    }
    // the sleeves swing from the shoulders: flung up when he roars, trailing when he moves
    for (const [n, side, sx] of [['sleeveL', -1, 17], ['sleeveR', 1, 63]]) {
      const sway = 0.07 * Math.sin(t * 1.7 + side) - vx * 0.012, a = sway + A.sl * 0.6;
      rot(sx, 45, -side * a, () => b.drawImage(P[n], 0, 0));
    }
    // the body breathes
    const br = 1 + 0.014 * Math.sin(t * 2.1);
    b.save(); b.translate(40, 70); b.scale(1, br); b.translate(-40, -70);
    b.drawImage(P.body, 0, 0);
    const beat = Math.max(0, Math.sin(t * (enraged ? 9 : 5))) ** 4;   // the heart beats
    b.fillStyle = `rgba(255,${80 + beat * 150 | 0},60,${0.55 + 0.45 * beat})`; b.beginPath(); b.arc(40, 54, 2.6 + beat * 1.4, 0, 6.283); b.fill();
    b.fillStyle = `rgba(255,220,160,${0.5 * beat})`; b.fillRect(39, 52.5, 2, 2);
    b.restore();
    // the head: bobs, nods, is thrown back when he roars; the jaw drops open
    const hb = Math.sin(t * 1.3) * 0.035 + A.head + (enraged ? (Math.random() - 0.5) * 0.03 : 0), hy = -A.lift * 2 + Math.sin(t * 2.1) * 0.4;
    rot(40, 37, hb, () => {
      b.translate(0, hy);
      const drop = A.jaw * 4;
      if (drop > 0.3) {   // inside his mouth: dark, with fire when he roars
        b.fillStyle = '#0e0308'; b.fillRect(31, 30, 18, drop + 1.5);
        if (A.fire > 0.05) { b.fillStyle = `rgba(255,${90 + 60 * Math.sin(t * 20) | 0},40,${0.85 * A.fire})`; b.fillRect(33, 30.5, 14, drop * 0.8); b.fillStyle = `rgba(255,230,150,${0.7 * A.fire})`; b.fillRect(37, 31, 6, drop * 0.5); }
      }
      b.drawImage(P.jaw, 0, drop);
      b.drawImage(P.head, 0, 0);
      // eyes: burning in their sockets, flames licking up
      const eyeC = enraged ? '#ffffff' : '#ff3030', fl = A.fire;
      for (const ex of [34, 46]) {
        b.fillStyle = eyeC; b.fillRect(ex - 1.5, 19.5, 3, 3);
        const h = 1.2 + Math.abs(Math.sin(t * 13 + ex)) * 1.6 + fl * 2, sw = Math.sin(t * 9 + ex) * 0.5;   // a little flame, tapering
        b.fillStyle = enraged ? 'rgba(255,255,255,0.7)' : 'rgba(255,80,50,0.75)'; b.fillRect(ex - 1.5, 19.5 - h * 0.5, 3, h * 0.5);
        b.fillStyle = enraged ? 'rgba(255,255,255,0.55)' : 'rgba(255,140,60,0.7)'; b.fillRect(ex - 1 + sw * 0.5, 19.5 - h, 2, h * 0.5);
        b.fillStyle = enraged ? 'rgba(255,255,255,0.4)' : 'rgba(255,210,120,0.6)'; b.fillRect(ex - 0.5 + sw, 19.5 - h * 1.4, 1, h * 0.4);
      }
      if ((t * 0.7) % 3 < 0.25) {   // a glint off his crown
        const s = Math.sin(((t * 0.7) % 3) / 0.25 * Math.PI) * 4.5;
        b.fillStyle = 'rgba(255,250,220,0.95)'; b.fillRect(40 - s, 2.5, s * 2, 1); b.fillRect(39.5, 3 - s, 1, s * 2);
      }
    });
  });
  // ---- him, with his red glow ----
  g.save(); g.globalAlpha *= A.alpha;
  g.filter = `drop-shadow(0 0 ${Math.max(2, u * 2).toFixed(1)}px rgba(255,40,40,${Math.min(1, (enraged ? 0.95 : 0.7) + A.fire * 0.3)}))`;
  g.imageSmoothingEnabled = false;
  g.drawImage(KB22.c, (-20 - KB22.PX / 2) * u, (-28 - KB22.PY / 2) * u, KB22.W / 2 * u, KB22.H / 2 * u);
  g.restore();
  if (A.alpha < 1) for (let i = 0; i < 3; i++) {   // rising out of the dark: sparks gathering into him
    const a = (t * 2 + i * 2.1) % 6.283, r = (1 - A.alpha) * 26 * u;
    g.fillStyle = 'rgba(200,90,255,0.8)'; g.fillRect(Math.cos(a) * r, Math.sin(a) * r, u * 1.5, u * 1.5);
  }
  // soul wisps rising off his robe
  for (let i = 0; i < 9; i++) {
    const ph = (t * 0.45 + i * 0.37) % 1, x = (-15 + ((i * 7.3) % 30) + Math.sin(t * 2 + i) * 1.5) * u, y = (26 - ph * 30) * u;
    g.fillStyle = `rgba(${enraged ? '255,80,90' : '190,90,255'},${0.55 * Math.sin(ph * Math.PI) * A.alpha})`; g.fillRect(x, y, u * (i % 3 ? 1 : 1.5), u * (i % 3 ? 1 : 1.5));
  }
  // where his eyes are (for their glow in the dark), following his head and his lean
  const hb = A.head, hy = -A.lift * 2;
  for (const ex of [34, 46]) {
    let x = ex - 40, y = 21 + hy - 37; [x, y] = [x * Math.cos(hb) - y * Math.sin(hb), x * Math.sin(hb) + y * Math.cos(hb)]; y += 37 - 72;
    [x, y] = [x * Math.cos(A.lean) - y * Math.sin(A.lean), x * Math.sin(A.lean) + y * Math.cos(A.lean)]; y += 72 - 56;
    eyes.push({ x: x / 2 * u, y: y / 2 * u, s: 2 * u, c: enraged ? '255,255,255' : '255,50,50' });
  }
}
function renderBossBody(originX, originY) {
  if (!Game.boss) return;
  if (Game.boss.type === 'apexparasite') { if (!Game.outside) renderParasite(Game.boss, originX, originY); return; }   // (1.1.4: it draws its whole body itself)
  const saved = Game.mobs;
  Game.mobs = [Game.boss];
  renderMobs.bossPass = true;
  const glows = mobEyeGlows;
  renderMobs(originX, originY);
  mobEyeGlows = glows;
  renderMobs.bossPass = false;
  Game.mobs = saved;
  renderBossHands(originX, originY);
}
function renderBossHands(originX, originY) {
  const m = Game.boss;
  if (!m || !m.hands || m.dead) return;
  const S = 1.6 * TILE;
  for (const h of m.hands) {
    const hx = originX + h.x * TILE, hy = originY + h.y * TILE;
    if (h.st === 'slam') for (let k = 3; k >= 1; k--) {   // motion blur
      ctx.globalAlpha = 0.15 * (4 - k);
      ctx.drawImage(KING_HAND_IMG, hx - S / 2, hy - S / 2 - k * h.vy * 0.02 * TILE, S, S);
    }
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(h.st === 'slam' || h.st === 'hit' ? Math.PI : Math.sin(m.t * 2 + h.side) * 0.15);
    if (KING_HAND_IMG.complete && KING_HAND_IMG.naturalWidth) ctx.drawImage(KING_HAND_IMG, -S / 2, -S / 2, S, S);
    if (m.hurtFlash > 0 || m.dying != null) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#ff2020'; ctx.fillRect(-S / 2, -S / 2, S, S); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
// Everything that glows through the dark: fireflies, fireballs, the King's
// eyes and claws, and the warnings for his attacks.
// (1.0.4) Desperation: the glowing walls of the arena, pillar warnings (bright
// lines) and the pillars themselves, the shockwave warning along the floor, the
// Final Nova's safe gaps (white cones), and the big countdown while you get ready.
function renderDespWarnings(m, originX, originY, t) {
  if (m.dying != null) return;
  ctx.save();
  const T = despT(m);
  // (friends' games: keep the warnings moving smoothly between the host's updates)
  const extra = netIsClient() && m.beamsAt ? Math.min(0.3, (performance.now() - m.beamsAt) / 1000) : 0;
  // ---- the BRIMSTONE FIRE WALLS (v3: like Infernum's arena) ----
  // Everything outside the arena burns: a wall of orange fire with a dark seam on
  // the edge, flames licking upward through it.
  if (m.despL != null && m.despBorder > 0) {
    const al = m.despBorder * (T < 0 ? 0.6 + 0.15 * Math.sin(t * 5) : 1);
    const top = originY + m.despTop * TILE, x0 = originX + m.despL * TILE, x1 = originX + m.despR * TILE;
    const fire = (x, y, w, h, horiz) => {   // a block of brimstone fire
      if (w <= 0 || h <= 0) return;
      ctx.fillStyle = `rgba(214,92,14,${0.88 * al})`; ctx.fillRect(x, y, w, h);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      const step = TILE * 0.75;
      for (let k = 0; k < (horiz ? w : h) / step + 2; k++) {   // flames: bright tongues that rise and sway
        const along = k * step, ph = t * 3 + k * 1.7;
        const len = (0.5 + 0.5 * Math.sin(ph)) * TILE * 2.4 + TILE;
        ctx.fillStyle = `rgba(255,170,40,${0.35 * al})`;
        if (horiz) ctx.fillRect(x + along + Math.sin(ph * 1.3) * 6, y + h - len - ((t * 60 + k * 37) % (TILE * 2)), step * 0.6, len);
        else ctx.fillRect(x + ((k * 53) % Math.max(1, w - 6)), y + h - ((t * 90 + k * step * 2.3) % (h + len)), TILE * 0.45, len);
      }
      ctx.restore();
    };
    const W = TILE * 8, bot = VIEW.h + TILE;
    fire(Math.max(-TILE, x0 - W), top - W, Math.min(x0, VIEW.w + TILE) - Math.max(-TILE, x0 - W), bot - top + W);   // left
    fire(Math.max(-TILE, x1), top - W, Math.min(VIEW.w + TILE, x1 + W) - Math.max(-TILE, x1), bot - top + W);       // right
    fire(Math.max(-TILE, x0), Math.max(-TILE, top - W), Math.min(VIEW.w + TILE, x1) - Math.max(-TILE, x0), top - Math.max(-TILE, top - W), true);   // the roof
    // the dark seam where the fire meets the arena, with a hot edge
    ctx.fillStyle = `rgba(30,4,12,${0.95 * al})`;
    ctx.fillRect(x0 - 4, top, 8, bot - top); ctx.fillRect(x1 - 4, top, 8, bot - top); ctx.fillRect(x0 - 4, top - 4, x1 - x0 + 8, 8);
    ctx.fillStyle = `rgba(255,220,140,${0.8 * al})`;
    ctx.fillRect(x0 - 5, top, 2, bot - top); ctx.fillRect(x1 + 3, top, 2, bot - top); ctx.fillRect(x0 - 5, top - 5, x1 - x0 + 10, 2);
  }
  // ---- the hex rings: big pink circles that bloom out of him (for show) ----
  if (m.despRings) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const g of m.despRings) {
      const k = Math.min(1, g.t / 1.1), r = g.r * TILE;
      ctx.strokeStyle = `rgba(230,60,230,${0.45 * (1 - k)})`; ctx.lineWidth = TILE * (1.6 - k);
      ctx.beginPath(); ctx.arc(originX + g.x * TILE, originY + g.y * TILE, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  // ---- pillars: warning lines, then the fire ----
  for (const B of m.beams || []) {
    const bt = B.t + extra, live = bt >= B.warn, a = B.a + (live ? B.spin * extra : 0);
    if (bt > B.warn + B.dur + 0.05) continue;
    ctx.save();
    ctx.translate(originX + B.x * TILE, originY + B.y * TILE); ctx.rotate(a);
    if (!live && B.thin) {
      // (v3) Infernum-style: a thin red line that flickers faster as it's about to fire
      const k = Math.min(1, bt / B.warn), fl = B.warn - bt < 0.2 ? 0.5 + 0.5 * Math.sin(t * 70) : 1;
      const th = Math.max(2, TILE / 14) * (1 + k);
      ctx.fillStyle = `rgba(0,0,0,${0.3 * k})`; ctx.fillRect(0, -th, B.len * TILE, th * 2);
      ctx.fillStyle = `rgba(255,40,60,${(0.45 + 0.5 * k) * fl})`; ctx.fillRect(0, -th / 2, B.len * TILE, th);
      // (v4) a bright spark runs down the line toward where it will fire
      const runner = ((bt * 2.2) % 1) * B.len * TILE * 0.6;
      ctx.fillStyle = `rgba(255,220,220,${0.8 * k})`; ctx.fillRect(runner, -th, th * 3, th * 2);
    } else if (!live) {
      // high-contrast warning (the Abyss tints everything red): a dark outline and a
      // bright white/magenta core that gets thicker as it's about to fire, then flashes
      const k = Math.min(1, bt / B.warn), hw = (1.5 + k * 4) * (TILE / 16);
      const flash = B.warn - bt < 0.18 ? 0.35 + 0.35 * Math.sin(t * 60) : 0;
      ctx.fillStyle = `rgba(0,0,0,${0.35 + 0.3 * k})`; ctx.fillRect(0, -hw - 2, B.len * TILE, hw * 2 + 4);
      ctx.fillStyle = `rgba(255,120,230,${0.55 + 0.35 * k})`; ctx.fillRect(0, -hw, B.len * TILE, hw * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * k + flash})`; ctx.fillRect(0, -hw * 0.35, B.len * TILE, hw * 0.7);
    } else if (B.flame) {
      // (v3) a brimstone pillar ERUPTING: it shoots up out of the floor, a wavy column
      // of magenta-and-violet fire with a white-hot core
      const w = B.w * TILE, k = bt - B.warn, grow = Math.min(1, k / 0.12), fade = Math.max(0, 1 - Math.max(0, k - B.dur * 0.6) / (B.dur * 0.4 + 0.05));
      const L2 = B.len * TILE * grow, seg = TILE * 0.5;
      if (fade > 0.3 && Math.random() < 0.7 * particleMul()) {   // (v4) pixel embers shooting up the column
        const along = Math.random() * B.len * grow;
        Game.particles.push({ x: B.x + Math.cos(B.a) * along + (Math.random() - 0.5) * B.w * 2, y: B.y + Math.sin(B.a) * along, vx: (Math.random() - 0.5) * 2, vy: -6 - Math.random() * 6, life: 0.35, age: 0, size: 0.11, kind: 'poof', color: Math.random() < 0.5 ? '#ff5ac8' : '#ffd0ff', gravity: 0 });
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let d = 0; d < L2; d += seg) {
        const wob = Math.sin(t * 25 + d * 0.05 + B.x) * w * 0.25, ww = w * (1 + 0.25 * Math.sin(t * 18 + d * 0.08));
        ctx.fillStyle = `rgba(150,40,255,${0.45 * fade})`; ctx.fillRect(d, -ww * 1.7 + wob, seg + 1, ww * 3.4);
        ctx.fillStyle = `rgba(255,50,170,${0.85 * fade})`; ctx.fillRect(d, -ww + wob, seg + 1, ww * 2);
        ctx.fillStyle = `rgba(255,230,255,${0.9 * fade})`; ctx.fillRect(d, -ww * 0.3 + wob * 0.5, seg + 1, ww * 0.6);
      }
    } else {
      const w = B.w * TILE, fade = Math.max(0, 1 - (bt - B.warn) / (B.dur + 0.05));
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(180,40,255,${0.5 * fade})`; ctx.fillRect(0, -w * 1.8, B.len * TILE, w * 3.6);
      ctx.fillStyle = `rgba(255,60,140,${0.9 * fade})`; ctx.fillRect(0, -w, B.len * TILE, w * 2);
      ctx.fillStyle = `rgba(255,235,255,${0.95 * fade})`; ctx.fillRect(0, -w * 0.35, B.len * TILE, w * 0.7);
    }
    ctx.restore();
  }
  // ---- shockwave coming: the floor line flashes ----
  if (m.despWaveWarn > 0 && m.despL != null) {
    const y = originY + (m.despFloorY - 0.35) * TILE, x0 = originX + m.despL * TILE, x1 = originX + m.despR * TILE;
    // (the moment before the slam the whole line turns WHITE and thick: the waves are coming - jump as one reaches you)
    const now = m.despWaveWarn < 0.3, fl = now ? 1 : 0.5 + 0.5 * Math.sin(t * 30), th = now ? 2 : 1;
    ctx.fillStyle = `rgba(0,0,0,0.45)`; ctx.fillRect(x0, y - 6 * th, x1 - x0, 12 * th);
    ctx.fillStyle = now ? 'rgba(255,255,255,0.95)' : `rgba(255,150,40,${0.6 + 0.3 * fl})`; ctx.fillRect(x0, y - 4 * th, x1 - x0, 8 * th);
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * fl})`; ctx.fillRect(x0, y - 1, x1 - x0, 2);
    ctx.font = `${Math.round(TILE * 0.55)}px 'MC Title', 'MC Title Alt', monospace`; ctx.textAlign = 'center';
    const kx = originX + (m.x + m.w / 2) * TILE;
    for (const dx of [-6, 6]) {
      ctx.fillStyle = '#000'; ctx.fillText('JUMP!', kx + dx * TILE + 2, y - TILE * 1.4 + 2);
      ctx.fillStyle = now ? '#ffffff' : `rgba(255,${200 + 55 * fl | 0},120,1)`; ctx.fillText('JUMP!', kx + dx * TILE, y - TILE * 1.4);
    }
  }
  // ---- CROSSFIRE coming: the wall flashes on its side, with its two gaps showing ----
  if (m.despXF && m.despL != null) for (const W of m.despXF) {
    const x = originX + (W.side < 0 ? m.despL : m.despR) * TILE, top = originY + m.despTop * TILE, bot = originY + m.despFloorY * TILE;
    const k = Math.min(1, (W.t + extra) / W.warn), fl = 0.5 + 0.5 * Math.sin(t * 30), bw = TILE * (0.5 + 0.6 * k);
    const x0 = W.side < 0 ? x : x - bw;
    let y = top;
    const gaps = W.gaps.map(([a, b]) => [originY + a * TILE, originY + b * TILE]).sort((p, q) => p[0] - q[0]);
    for (const [g0, g1] of gaps.concat([[bot, bot]])) {   // the warning band, broken where the gaps are
      if (g0 > y) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x0 - 2, y, bw + 4, g0 - y);
        ctx.fillStyle = `rgba(255,170,60,${0.55 + 0.35 * fl * k})`; ctx.fillRect(x0, y, bw, g0 - y);   // (orange, so it doesn't look like the glowing wall)
      }
      y = Math.max(y, g1);
    }
    for (const [g0, g1] of gaps) {   // the gaps: bright brackets
      if (g0 >= bot) continue;
      ctx.fillStyle = `rgba(200,255,255,${0.7 + 0.3 * fl})`;
      ctx.fillRect(x0 - TILE * 0.3, g0, bw + TILE * 0.6, 3); ctx.fillRect(x0 - TILE * 0.3, Math.min(g1, bot) - 3, bw + TILE * 0.6, 3);
    }
    // an arrow showing which way it will go
    ctx.font = `${Math.round(TILE * 0.7)}px 'MC Title', 'MC Title Alt', monospace`; ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * fl})`;
    ctx.fillText(W.side < 0 ? '>>' : '<<', x + (W.side < 0 ? 1 : -1) * TILE * 1.6, (top + bot) / 2);
  }
  // ---- the Final Nova: everything is death except the white cones ----
  const N = m.despNova;
  if (N && N.gaps && m.despAct === 'nova') {
    const cx = originX + (m.x + m.w / 2) * TILE, cy = originY + (m.y + m.h / 2) * TILE, R = 40 * TILE;
    const pulse = 0.5 + 0.5 * Math.sin(t * 10), al = N.fired ? 0.25 : 0.3 + 0.25 * pulse;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [g, half, gx, gy] of N.gaps) {
      ctx.fillStyle = `rgba(200,255,255,${al})`;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, g - half, g + half); ctx.closePath(); ctx.fill();
      if (!N.fired) {   // and a marker where you should be (on the floor, or in the air if you're flying)
        const fx = originX + gx * TILE, fy = originY + (gy != null ? gy + 0.9 : m.despFloorY) * TILE;
        ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * pulse})`; ctx.fillRect(fx - TILE * 1.2, fy - 4, TILE * 2.4, 4);
      }
    }
    ctx.restore();
    if (!N.fired) {
      ctx.font = `${Math.round(TILE * 0.5)}px 'MC Title', 'MC Title Alt', monospace`; ctx.textAlign = 'center';
      for (const [, , gx, gy] of N.gaps) {
        const fx = originX + gx * TILE, fy = originY + ((gy != null ? gy + 0.9 : m.despFloorY) - 2.6) * TILE;
        ctx.fillStyle = '#000'; ctx.fillText('SAFE', fx + 2, fy + 2);
        ctx.fillStyle = '#e8ffff'; ctx.fillText('SAFE', fx, fy);
      }
    }
  }
  // ---- the white flash (an explosion between rounds, and at the very end) ----
  if (m.despFlash > 0) { ctx.fillStyle = `rgba(255,248,240,${Math.min(0.9, m.despFlash)})`; ctx.fillRect(0, 0, VIEW.w, VIEW.h); }
  // ---- the big countdown while you get ready (and SURVIVE! when it starts) ----
  if (T < 1.2 && bossOnMyScreen(m)) {
    ctx.save();
    ctx.textAlign = 'center';
    const big = Math.round(Math.min(VIEW.h * 0.1, VIEW.w * 0.07)), sm = Math.round(big * 0.32), y = VIEW.h * 0.3;
    const say = (txt, size, yy, col, a) => {
      ctx.globalAlpha = a;
      ctx.font = `${size}px 'MC Title', 'MC Title Alt', monospace`;
      ctx.fillStyle = '#000'; ctx.fillText(txt, VIEW.w / 2 + size * 0.08, yy + size * 0.08);
      ctx.fillStyle = col; ctx.fillText(txt, VIEW.w / 2, yy);
    };
    if (T < 0) {
      const sec = Math.ceil(-T), f = -T - Math.floor(-T);   // (each number pops in, then shrinks a little)
      say('DESPERATION', sm, y - big * 0.95, '#ff6af0', 0.9);
      say(String(sec), Math.round(big * (1 + 0.25 * f)), y + big * 0.3, sec <= 3 ? '#ff4a5a' : '#ffffff', 0.95);
      say('Get between the glowing walls!', Math.round(sm * 0.75), y + big * 0.95, '#ffd24d', 0.85);
    } else say('SURVIVE!', big, y + big * 0.3, '#ff4a5a', Math.max(0, 1 - T / 1.2));
    ctx.restore();
  }
  ctx.restore();
}

// ---- LOOT, AND THE TOTEM (after the Overlord falls the King speaks from the totem) ----
function kingLoot(m, mx, my) {
  bossReward(m, 'king');
  const r = Math.random;
  const drops = [[145, 8 + Math.floor(r() * 5)], [134, 12 + Math.floor(r() * 9)], [120, 3 + Math.floor(r() * 3)], [ABYSS_HEART, 1], [MANA_STAR, 2]];
  for (const [it, q] of drops) {
    const d = spawnDrop(it, q, mx, my);
    if (d) { d.vx = (r() - 0.5) * 8; d.vy = -4 - r() * 4; }
  }
  Game.boss = null;
  eventMessage('The King of the Abyss has been defeated!', '#b44bff');
  sfx('toast.challenge');
}
// ---- THE KING'S REVELATION (a cutscene at an Abyssal Altar) ----
let KCS16 = null;
const KING_VISION16 = { vision: true, type: 'kingvision', w: 4.8, h: 6.8, def: { npc: true, name: 'The King of the Abyss' }, style: { name: 'The King of the Abyss', title: 'Sovereign of the Deep' }, dying: null, id: -16, x: 0, y: 0 };
function startKingCutscene16(ax, ay) {
  if (KCS16 || Game.screen !== 'play') return;
  KCS16 = { t: 0, ax, ay, stage: 'rise', heard: false };
  releaseAllInput();
  sfx('altar.charge', { x: ax + 0.5, y: ay }); sfx('altar.activate', { x: ax + 0.5, y: ay, pitch: 0.7 });
  eventMessage('The altar drinks in the totem\'s cold... something stirs in the deep.', '#c070ff');
}
function kingVisionPos16() {
  const C = KCS16; if (!C) return null;
  let k = 1;
  if (C.stage === 'rise') k = Math.min(1, C.t / 3.2);
  else if (C.stage === 'sink') k = Math.max(0, 1 - C.t / 1.6);
  const e = 1 - Math.pow(1 - k, 3);
  return { x: C.ax + 0.5, y: C.ay + 9 - e * 13.5 + Math.sin(Game.time * 1.3) * 0.25, a: C.stage === 'sink' ? k : C.stage === 'talk' ? 1 : Math.min(1, C.t * 1.5), k: e };
}
B12.updaters.push(function kingCutscene16(dt, p) {
  const C = KCS16; if (!C) return;
  C.t += dt;
  if (!p || p.dead) { KCS16 = null; return; }
  if (C.stage !== 'talk') { releaseAllInput(); p.vx *= Math.pow(0.02, dt); }
  const V = kingVisionPos16();
  if (Math.random() < dt * 40 * particleMul()) { const a = Math.random() * 6.28, r = 2 + Math.random() * 4; Game.particles.push({ x: V.x + Math.cos(a) * r, y: V.y + 2 + Math.sin(a) * r, vx: -Math.cos(a) * 2, vy: -1.5, life: 0.9, age: 0, size: 0.1, color: Math.random() < 0.5 ? '#b44bff' : '#ff2a4a', gravity: -0.4, kind: 'star' }); }
  if (C.stage === 'rise') {
    Game.shake = Math.max(Game.shake, 0.18 + C.t * 0.05);
    if (C.t > 0.6 && !C.roared) { C.roared = true; sfx('boss.roar', { x: V.x, y: V.y, pitch: 0.7, vol: 1.2 }); }
    if (C.t >= 3.4) {
      C.stage = 'talk'; C.t = 0;
      if (Game.screen !== 'play') closePanels();
      Object.assign(KING_VISION16, { x: V.x - 2.4, y: V.y - 3.4 });
      openNpcDialog(KING_VISION16);
      if (Game.screen !== 'dialog') { C.stage = 'sink'; C.t = 0; }
    }
  } else if (C.stage === 'talk') {
    if (!(Game.screen === 'dialog' && Dialog.npc === KING_VISION16)) { C.stage = 'sink'; C.t = 0; finishKingCutscene16(); }
  } else if (C.stage === 'sink' && C.t > 1.6) KCS16 = null;
});
function finishKingCutscene16() {
  const C = KCS16; if (!C || !C.heard || C.awoke) return;
  C.awoke = true;
  const inv = Game.player.inventory;
  for (const s of inv) if (s && s.item === MYST_ITEM) { s.item = MYST_AWAKE; break; }
  refreshInventoryUI();
  const x = C.ax + 0.5, y = C.ay - 1;
  flashAt(x, y, 6, '210,80,255', 0.4); screenShake(0.5); sfx('soul.free', { x, y }); sfx('toast.challenge');
  for (let i = 0; i < 50; i++) { const a = i / 50 * 6.28; Game.particles.push({ x, y, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, life: 0.8, age: 0, size: 0.12, color: i % 2 ? '#ff5af0' : '#ffffff', gravity: 0, kind: 'star' }); }
  eventMessage("The Mysterious Item has awakened! Hold it to see the way to the World's End.", '#e070ff');
  bigTitle12('The Totem Awakens', "find the World's End", '#d24aff');
  Adv.grant('totem16');
}
function kingDialog16(m) {
  const name = playerName(), p = Game.player, X = weX16(), dist = Math.abs(Math.round(X - p.x)), dirn = X > p.x ? 'EAST' : 'WEST';
  const go = (k) => ({ label: 'Continue', go: k });
  return {
    start: { text: `WHO DARES WAKE ME... Hm. YOU. The little ${name} who struck me down. And now you crawl back into my Abyss... carrying THAT.`, options: [go('know')] },
    know: { text: 'Do you even know what you hold? No. Of course not. That is no trinket. It is a SACRED TOTEM... carved for the one they call THE SLAYER OF WORLDS.', options: [{ label: 'Who is the Slayer of Worlds?', go: 'who' }, { label: 'Where did it come from?', go: 'from' }] },
    from: { text: 'The Overlord kept it, locked away in his fire, for a thousand years. He was afraid of it. He was right to be. And you took it from his ashes.', options: [{ label: 'Who is the Slayer of Worlds?', go: 'who' }] },
    who: { text: 'A celestial being of destruction, forged from the end of countless realms. She walks between worlds, and leaves only ruin behind her. No world is safe. No armor is strong enough. Even I... bowed to her once.', options: [go('soul')] },
    soul: { text: 'Her soul is trapped inside that totem. Can you feel it? Cold, and waiting. Awake now, because I have spoken her name.', options: [{ label: 'How do I set her free?', go: 'how' }] },
    how: { text: `Not here. Not in my Abyss. You must carry it far, far away, to the WORLD'S END: ${dist} blocks to the ${dirn}, where the land itself lies broken. Place the totem on the Shattered Altar there... and she will come.`, options: [{ label: 'And then?', go: 'then', action: () => { if (KCS16) KCS16.heard = true; } }] },
    then: { text: 'Then you FIGHT her. She will not hold back. Four times she will change, and each time she will be worse. Defeat her and her soul is free... and her sword will answer to you. Now GO. The totem will show you the way.', options: [{ label: 'Can the totem do anything else?', go: 'power', action: () => { if (KCS16) KCS16.heard = true; } }, { label: 'I will.', action: () => { if (KCS16) KCS16.heard = true; } }, { label: 'Goodbye', action: () => { if (KCS16) KCS16.heard = true; } }] },
    power: { text: 'Hm. You are not as foolish as you look. Her power LEAKS out of it, even now. Build a SUPERCHARGER: obsidian bricks, hellstone, a Block of Diamond, an Enchanting Table and a Void Crystal from the World\'s End. Set the totem on top, and it will pour her power into your blade and your armor. You will need every drop of it. Take the totem back before you go to her altar.', options: [{ label: 'I will.', action: () => { if (KCS16) KCS16.heard = true; } }, { label: 'Goodbye', action: () => { if (KCS16) KCS16.heard = true; } }] },
  };
}
{
  const dtOrig = dialogTree;
  dialogTree = function (m) { return m && m.type === 'kingvision' ? kingDialog16(m) : dtOrig(m); };
  const sdnOrig = showDialogNode;
  showDialogNode = function (key) {
    sdnOrig(key);
    const m = Dialog.npc;
    if (m && m.type === 'kingvision' && Game.screen === 'dialog') { el('npc-title').textContent = m.style.title; if (key === 'how' || key === 'then') KCS16 && (KCS16.heard = true); }
  };
  const portOrig = drawNpcPortrait;
  drawNpcPortrait = function (m) {
    if (!m || m.type !== 'kingvision') return portOrig(m);
    const cv = el('npc-portrait'), g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    const gr = g.createRadialGradient(cv.width / 2, cv.height * 0.6, 4, cv.width / 2, cv.height * 0.6, cv.width * 0.8); gr.addColorStop(0, '#4a1a6a'); gr.addColorStop(1, '#0a0410');
    g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = false;
    if (KING_IMG.complete && KING_IMG.naturalWidth) { const s = cv.width / 26, k = KING_IMG.naturalWidth / 40; g.drawImage(KING_IMG, 7 * k, 0, 26 * k, 26 * k, 0, (Math.sin(Date.now() / 400) * 0.6) * s, cv.width, cv.width); }   // (1.0.1: the art is drawn at 2x now)
    if (Dialog.typing && Math.floor(Date.now() / 120) % 2) { g.fillStyle = 'rgba(255,40,80,0.25)'; g.fillRect(0, 0, cv.width, cv.height); }
  };
  const openOrig = openNpcDialog;
  openNpcDialog = function (m) { openOrig(m); if (m && m.type === 'kingvision') sfx('boss.roar', { pitch: 1.4, vol: 0.4 }); };
}
// the King himself, rising out of the dark (drawn over everything, he's a vision)
B12.post.push(function kingVisionDraw16(ox, oy) {
  const C = KCS16; if (!C || Game.screen === 'title') return;
  // letterbox bars
  const bar = VIEW.h * 0.11 * (C.stage === 'sink' ? Math.max(0, 1 - C.t / 1) : C.stage === 'rise' ? Math.min(1, C.t * 1.5) : 1);
  ctx.fillStyle = 'rgba(0,0,0,0.92)'; ctx.fillRect(0, 0, VIEW.w, bar); ctx.fillRect(0, VIEW.h - bar, VIEW.w, bar); if (typeof cineBars22 === 'function') cineBars22(bar / VIEW.h);   // (and over the HUD)
  const V = kingVisionPos16(); if (!V || !(KING_IMG.complete && KING_IMG.naturalWidth)) return;
  const hpx = 6.8 * TILE, s = hpx / 56, x = ox + V.x * TILE, y = oy + V.y * TILE;
  ctx.save();
  const gl = ctx.createRadialGradient(x, y, 0, x, y, hpx * 0.9); gl.addColorStop(0, `rgba(160,60,255,${0.45 * V.a})`); gl.addColorStop(1, 'rgba(120,20,200,0)');
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(x - hpx, y - hpx, hpx * 2, hpx * 2);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = V.a * (0.85 + 0.1 * Math.sin(Game.time * 9));
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(KING_IMG, x - 20 * s, y - 28 * s, 40 * s, 56 * s);
  if (KING_HAND_IMG.complete && KING_HAND_IMG.naturalWidth) for (const sd of [-1, 1]) {
    const hx = x + sd * 26 * s, hy = y + 6 * s + Math.sin(Game.time * 2 + sd) * 3 * s;
    ctx.save(); ctx.translate(hx, hy); ctx.scale(sd, 1); ctx.drawImage(KING_HAND_IMG, -8 * s * 1.4, -8 * s * 1.4, 16 * s * 1.4, 16 * s * 1.4); ctx.restore();
  }
  ctx.restore();
});

// ---- HARDMODE (a rematch after the Slayer): faster in everything (index.html, HM_BOSS22), and between his
// moves he looses rings of abyssal orbs; in his second phase, a fan of fireballs after each ring ----
BOSSES.abyssking.hardmode = function (m, dt, p) {
  if (m.move === 'summon' || m.move === 'enrage') return;
  m.hmT22 = (m.hmT22 ?? 3) - dt;
  if (m.hmT22 > 0) return;
  m.hmT22 = m.phase >= 2 ? 3.4 : 4.6;
  const x = m.x + m.w / 2, y = m.y + m.h * 0.45, n = m.phase >= 2 ? 14 : 10, off = Math.random() * 6.283;
  for (let i = 0; i < n; i++) { const a = off + i / n * 6.283; spawnProjectile({ x, y, vx: Math.cos(a) * 7.5, vy: Math.sin(a) * 7.5, kind: 'orb', r: 0.3, dmg: 6 }); }
  sfx('abyss.orb', { x, y, pitch: 0.75 }); screenShake(0.25);
  if (m.phase >= 2) setTimeout(() => { if (!m.dead && m.dying == null && Game.mobs.includes(m)) netFxCapture(x, y, () => shootFireballs(m, 3, 0.26, 12, 7)); }, 450);
};
