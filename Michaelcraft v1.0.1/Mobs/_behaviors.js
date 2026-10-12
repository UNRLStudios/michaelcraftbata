'use strict';
// =============================================================================
// SHARED BEHAVIOURS - the brains several mobs have in common. Each mob's file
// picks one (brain: walkerBrain / livestockBrain / petBrain / swoopBrain, or
// ai: 'melee' / 'hover' / 'slammer') and tunes it with its own hooks:
//
//   walkerBrain     tactic(mob, dt, target, dx, dir, speed) -> what it does once it's chasing you
//   livestockBrain  livestockTick(mob, dt)                   -> e.g. a chicken laying eggs
//   petBrain        petSound(mob) -> its noise;  wildReact(mob, p, dx, dist) -> e.g. a wild cat darting off
//   melee           meleeInit(mob), meleeSpeed(mob) -> x speed, meleeHit(mob, p) -> what its bite does
//   hover           hoverRange, hoverCooldown(), hoverShoot(mob, p, angle, x, y), hoverTrail(mob, x, y, dt)
//   slammer         slamDust: [colours], onSlam(mob, x, y), slamHit(mob, p)
//
// Walking itself (steering, hopping ledges, climbing, footsteps, and following
// the route Mobs/_pathfinding.js plans) is mobMove() in the core.
// =============================================================================

// ---- WALKERS: wander about; chase you once they see you; flee when hit ----
function walkerBrain(mob, dt, p, dx, dist) {
  const def = mob.def;
  mob.stateTimer -= dt;
  let targetVx = 0;
  if (mob.state === 'wander') {
    targetVx = wanderVx(mob, dt);
  } else if (mob.state === 'flee') {
    targetVx = mob.fleeDir * def.speed * 1.6;
    if (mob.stateTimer <= 0) mob.state = 'wander';
  } else if (mob.state === 'hostile') {
    const dir = dx > 0 ? 1 : -1;
    targetVx = dir * def.speed;
    if (def.tactic) targetVx = def.tactic(mob, dt, p, dx, dir, targetVx);
  }
  mobMove(mob, targetVx, dt);
}
function livestockBrain(m, dt, p, dx, dist) { mobMove(m, livestockAI(m, dt, p, dx, dist), dt); }
function petBrain(m, dt, p, dx, dist) { mobMove(m, petAI(m, dt, p, dx, dist), dt); }
// fliers that circle and dive (night ones vanish by day)
function swoopBrain(m, dt, p, dx, dist) {
  if (m.def.nocturnal && nocturnalGone12(m, dt)) return;
  updateFlyer(m, dt, p, dx, dist);
}

// ---- FARM ANIMALS: wander and graze, run when hit, follow food, breed ----
function livestockAI(m, dt, p, dx, dist) {
  const def = m.def;
  m.stateTimer -= dt;
  m.love = Math.max(0, m.love - dt); m.loveCd = Math.max(0, m.loveCd - dt);
  if (m.baby) { m.age += dt; if (m.age >= BABY_GROW_TIME) setBaby(m, false); }
  if (m.love > 0 && Math.random() < dt * 3) spawnHeart(m.x + m.w / 2, m.y);
  m.soundCd -= dt;
  if (m.soundCd <= 0) { m.soundCd = 7 + Math.random() * 12; if (dist < 16) sfx(mobSoundPrefix(m) + '.say', mobPos(m)); }
  if (def.livestockTick) def.livestockTick(m, dt);   // (a chicken lays eggs)
  if (m.state === 'flee') { m.graze = 0; if (m.stateTimer <= 0) m.state = 'wander'; return m.fleeDir * def.speed * 1.7; }
  if (m.love > 0 && !m.baby) {   // walk over to a partner that's also in love
    const mate = Game.mobs.find(o => o !== m && o.type === m.type && o.love > 0 && !o.baby && o.dying == null && Math.abs(o.x - m.x) < 10 && Math.abs(o.y - m.y) < 4);
    if (mate) {
      m.graze = 0;
      if (Math.abs(mate.x - m.x) < 1.1) { breedLivestock(m, mate); return 0; }
      return Math.sign(mate.x - m.x) * def.speed;
    }
  }
  const held = !p.dead && p.selectedSlot();
  if (held && def.breedItems.includes(held.item) && dist < 8 && Math.abs(p.y - m.y) < 3) {   // tempted by food
    m.graze = 0; m.pathTo = p;
    if (Math.abs(dx) > 1.4) return Math.sign(dx) * def.speed * 0.9;
    m.facingDir = Math.sign(dx) || m.facingDir;
    return 0;
  }
  const vx = wanderVx(m, dt);
  if (m.dir === 0) m.graze = Math.max(0, m.graze - dt); else m.graze = 0;
  return vx;
}
function breedLivestock(a, b) {
  a.love = b.love = 0; a.loveCd = b.loveCd = 120;
  const baby = new Mob(a.type, (a.x + b.x) / 2, a.y);
  setBaby(baby, true);
  baby.y = a.y + a.h - baby.h;
  Game.mobs.push(baby);
  for (let i = 0; i < 7; i++) spawnHeart(baby.x + baby.w / 2, baby.y);
  sfx('breed', mobPos(baby));
}

// ---- SWOOPERS: bats, imps and owls that circle above you and dive ----
// Flying AI (Gloomwing): drift around; when hunting, circle above the
// player and periodically dive at them, then pull back up.
function updateFlyer(m, dt, p, dx, dist) {
  const def = m.def;
  m.flap += dt * (m.swoopT > 0 ? 6 : 15);
  const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2;
  const pcx = p.x + p.w / 2, pcy = p.y + p.h * 0.35;
  let tx, ty, speed;
  if (m.state === 'hostile') {
    m.swoopCd -= dt;
    if (m.swoopT > 0) {
      m.swoopT -= dt;
      tx = m.swoopX; ty = m.swoopY; speed = def.speed * 2.1;
      if (boxGap(m, p) < 0.15 && m.attackCooldown <= 0) {
        if (hitPlayer(m, def.dmg, 5, 3)) m.attackCooldown = 0.8;
        m.swoopT = 0; m.swoopCd = 1.6 + Math.random() * 1.2;
      }
    } else {
      const side = Math.sin(Game.time * 0.8 + m.id * 1.7);
      tx = pcx + side * 3.5; ty = pcy - 3.2 + Math.sin(Game.time * 2.3 + m.id) * 0.7; speed = def.speed;
      if (m.swoopCd <= 0 && dist < 7.5 && !firstBlockOnRay(mcx, mcy, pcx, pcy)) {   // (only a dive it can see to make)
        m.swoopT = 0.75; m.swoopX = pcx + (pcx - mcx) * 0.5; m.swoopY = pcy + 0.4; sfx(def.swoopSound || 'gloomwing.swoop', { x: mcx, y: mcy });
      }
    }
    m.facingDir = (m.swoopT > 0 ? m.swoopX - mcx : dx) > 0 ? 1 : -1;
    if (!(m.swoopT > 0)) { const wp = mobFlyWaypoint(m, tx, ty); if (wp) { tx = wp.x; ty = wp.y; } }   // (a wall in the way: fly round it)
  } else {
    tx = mcx + Math.sin(Game.time * 0.6 + m.id * 3) * 4; ty = mcy + Math.cos(Game.time * 0.8 + m.id) * 2; speed = def.speed * 0.45;
    if (Math.abs(m.vx) > 0.2) m.facingDir = m.vx > 0 ? 1 : -1;
  }
  if (m.kbTimer <= 0) {
    const ddx = tx - mcx, ddy = ty - mcy, len = Math.hypot(ddx, ddy) || 1;
    const k = Math.min(1, dt * (m.swoopT > 0 ? 6 : 3));
    m.vx += (ddx / len * speed * Math.min(1, len) - m.vx) * k;
    m.vy += (ddy / len * speed * Math.min(1, len) - m.vy) * k;
  } else {
    m.vy += GRAVITY * 0.3 * dt; // stunned: sags a little
  }
  const vx0 = m.vx, vy0 = m.vy;
  moveAndCollide(m, Game.world, dt);
  if (m.vx === 0 && vx0 !== 0) m.vy -= 2 * dt * 60 * 0.05; // bumped a wall: lift over it
  if (m.vy === 0 && vy0 > 0) m.vy = -2;                      // bumped the floor: bounce up
  m.legPhase += dt;
  if (m.y > WORLD_H + 5) m.dead = true;
}

// ---- THE 1.2 FIGHTERS: melee walkers, hovering casters and slammers ----
// MELEE: walkers that bite (Barkling, Ice Husk, Crimson Husk, Ruin Skeleton, Worldshade)
MOB_AI12.melee = function (m, dt, p, dx, dist) {
  const def = m.def; let tv = 0;
  if (nocturnalGone12(m, dt)) return;
  if (def.meleeInit) def.meleeInit(m);   // (a Barkling may start out as a stump)
  if (m.disguised) {
    if (dist < 4.5 || m.hurtFlash > 0) { m.disguised = false; m.attackAnim = 1; m.vy = -6; sfx(mobSoundPrefix(m) + '.say', { x: m.x, y: m.y, pitch: 0.7 }); for (let i = 0; i < 14; i++) Game.particles.push({ x: m.x + m.w / 2 + (Math.random() - 0.5), y: m.y + m.h, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 2, life: 0.8, age: 0, size: 0.09, color: i % 2 ? '#2f7a3c' : '#8a3d26', gravity: 6 }); }
    else { mobMove(m, 0, dt); return; }
  }
  if (m.state === 'wander') tv = wanderVx(m, dt);
  else if (m.state === 'hostile') {
    const dir = dx > 0 ? 1 : -1, gap = boxGap(m, p);
    tv = dir * def.speed * (def.meleeSpeed ? def.meleeSpeed(m) : 1);
    if (gap < def.reach + 0.3) tv *= 0.3;
    if (gap < def.reach && m.attackCooldown <= 0) {
      m.attackAnim = 1;
      if (hitPlayer(m, def.dmg, 6.5, 4)) {
        m.attackCooldown = 1.15;
        if (def.meleeHit) def.meleeHit(m, p);   // (what its bite does: in its file)
      } else m.attackCooldown = 0.4;
    }
  }
  mobMove(m, tv, dt);
};
// HOVER: floaters that keep their distance and shoot (Frost Wraith, Ember Wisp, Void Wraith)
MOB_AI12.hover = function (m, dt, p, dx, dist) {
  const def = m.def; m.flap += dt * 8; m.castT = Math.max(0, (m.castT || 0) - dt);
  const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2, pcx = p.x + p.w / 2, pcy = p.y + p.h * 0.35;
  let tx, ty, sp;
  if (m.state === 'hostile') {
    const ang = Game.time * 0.7 + m.id * 2.1, want = def.hoverRange || 5;
    tx = pcx + Math.cos(ang) * want; ty = pcy - 2.5 + Math.sin(ang * 1.3) * 1.5; sp = def.speed;
    m.shootCd = (m.shootCd == null ? 1 + Math.random() : m.shootCd) - dt;
    if (m.shootCd <= 0 && dist < 11 && !Game.creative) {
      m.shootCd = def.hoverCooldown ? def.hoverCooldown() : 2.8 + Math.random(); m.castT = 0.45;
      const a = Math.atan2(pcy - mcy, pcx - mcx);
      if (def.hoverShoot) def.hoverShoot(m, p, a, mcx, mcy);   // (what it shoots: in its file)
    }
    m.facingDir = dx > 0 ? 1 : -1;
    const wp = mobFlyWaypoint(m, tx, ty); if (wp) { tx = wp.x; ty = wp.y; }   // (a wall in the way: float round it)
  } else { tx = mcx + Math.sin(Game.time * 0.6 + m.id * 3) * 4; ty = mcy + Math.cos(Game.time * 0.8 + m.id) * 2; sp = def.speed * 0.4; if (Math.abs(m.vx) > 0.2) m.facingDir = m.vx > 0 ? 1 : -1; }
  if (m.kbTimer <= 0) { const ddx = tx - mcx, ddy = ty - mcy, len = Math.hypot(ddx, ddy) || 1, k = Math.min(1, dt * 2.5); m.vx += (ddx / len * sp * Math.min(1, len / 2) - m.vx) * k; m.vy += (ddy / len * sp * Math.min(1, len / 2) - m.vy) * k; }
  const vx0 = m.vx, vy0 = m.vy; moveAndCollide(m, Game.world, dt);
  if (m.vx === 0 && vx0 !== 0) m.vy -= 0.1; if (m.vy === 0 && vy0 > 0) m.vy = -2;
  m.legPhase += dt; if (m.y > WORLD_H + 5) m.dead = true;
  if (def.hoverTrail) def.hoverTrail(m, mcx, mcy, dt);   // (an Ember Wisp drips flame)
};
// SLAMMER: the heavies wind up (arms up), slam, recover. Ice Golem chills, Magma Brute burns, Sentinel just hurts
MOB_AI12.slammer = function (m, dt, p, dx, dist) {
  const def = m.def; let tv = 0;
  if (m.state === 'wander') tv = wanderVx(m, dt);
  else if (m.state === 'hostile') {
    const dir = dx > 0 ? 1 : -1, gap = boxGap(m, p); tv = dir * def.speed;
    if (m.slam === 'windup') {
      tv = 0; m.slamT -= dt;
      if (m.slamT <= 0) {
        m.slam = 'recover'; m.slamT = 0.8;
        const fx = m.x + m.w / 2, fy = m.y + m.h; sfx('fall.big', { x: fx, y: fy, pitch: 0.55 }); sfx('brute.slam', { x: fx, y: fy }); screenShake(0.7);
        const col = def.slamDust || ['#9aa592', '#6c7468'];
        for (let i = 0; i < 22; i++) { const s = (i % 2 ? 1 : -1); Game.particles.push({ x: fx + s * (0.5 + i * 0.1), y: fy - 0.1, vx: s * (3 + Math.random() * 5), vy: -2 - Math.random() * 3, life: 0.5 + Math.random() * 0.4, age: 0, size: 0.1 + Math.random() * 0.1, color: col[i % col.length], gravity: 10 }); }
        if (def.onSlam) def.onSlam(m, fx, fy);
        if (boxGap(m, p) < def.reach + 0.8 && p.y + p.h > m.y + m.h - 1.6) {
          if (hitPlayer(m, def.dmg, 11, 6)) { if (def.slamHit) def.slamHit(m, p); }
        }
      }
    } else if (m.slam === 'recover') { tv = 0; m.slamT -= dt; if (m.slamT <= 0) m.slam = null; }
    else if (gap < def.reach + 0.4 && m.attackCooldown <= 0 && m.onGround) { m.slam = 'windup'; m.slamT = 0.7; m.attackCooldown = 2.4; m.facingDir = dir; sfx('brute.roar', { x: m.x + m.w / 2, y: m.y + m.h / 2, pitch: 0.7 }); }
  }
  mobMove(m, tv, dt);
};

// ---- PETS (dogs and cats): tame, follow you, sit, defend you, breed ----
function petAI(m, dt, p, dx, dist) {
  const def = m.def;
  m.stateTimer -= dt;
  m.love = Math.max(0, m.love - dt); m.loveCd = Math.max(0, m.loveCd - dt);
  if (m.baby) { m.age += dt; if (m.age >= BABY_GROW_TIME) setBaby(m, false); }
  if (m.love > 0 && Math.random() < dt * 3) spawnHeart(m.x + m.w / 2, m.y);
  m.soundCd -= dt;
  if (m.soundCd <= 0 && dist < 12) {
    m.soundCd = 8 + Math.random() * 14;
    const snd = def.petSound ? def.petSound(m) : mobSoundPrefix(m) + '.say';   // (each pet's file says what)
    sfx(snd, mobPos(m));
  }
  // breeding: walk to a partner in love, then make a baby
  if (m.love > 0 && !m.baby && !m.sitting) {
    const mate = Game.mobs.find(o => o !== m && o.type === m.type && o.love > 0 && !o.baby && o.dying == null && Math.abs(o.x - m.x) < 10 && Math.abs(o.y - m.y) < 4);
    if (mate) {
      if (Math.abs(mate.x - m.x) < 1.1) { breedPets(m, mate); return 0; }
      return Math.sign(mate.x - m.x) * def.speed * 0.8;
    }
  }
  // a wild dog you hit fights back until you get away
  if (m.angry) {
    if (dist > 16 || p.dead) { m.angry = false; return 0; }
    if (boxGap(m, p) < def.reach && m.attackCooldown <= 0) { if (hitPlayer(m, def.dmg, 5, 3)) { m.attackCooldown = 1; sfx('dog.growl', mobPos(m)); } }
    m.pathTo = p;
    return Math.sign(dx) * def.speed * 1.2;
  }
  if (!m.tamed) {
    if (m.state === 'flee') { if (m.stateTimer <= 0) m.state = 'wander'; return m.fleeDir * def.speed * 1.5; }
    if (def.wildReact) def.wildReact(m, p, dx, dist);   // (a wild cat darts away from anyone rushing at it)
    return wanderVx(m, dt);
  }
  if (m.sitting) { m.target = null; return 0; }
  // tamed dog chasing something
  if (m.target) {
    const t = m.target;
    if (t.dead || t.dying != null || !Game.mobs.includes(t) || Math.hypot(t.x - m.x, t.y - m.y) > 16) m.target = null;
    else {
      if (boxGap(m, t) < def.reach + 0.1 && m.attackCooldown <= 0) { hurtMob(t, def.dmg, m); m.attackCooldown = 0.8; sfx('dog.growl', mobPos(m)); }
      if (m.onGround && Math.abs(t.x - m.x) < 2.5 && t.y + t.h < m.y + m.h - 0.5 && m.attackCooldown <= 0) m.vy = -8; // leap up at it
      m.pathTo = t;
      return Math.sign((t.x + t.w / 2) - (m.x + m.w / 2)) * def.speed * 1.35;
    }
  }
  // follow you; warp over if left far behind
  if (dist > 20 && p.onGround) {
    const tx = p.x + p.w / 2 - p.facing * 1.5 - m.w / 2, ty = p.y + p.h - m.h;
    if (!boxHitsSolid(Game.world, tx, ty, m.w, m.h)) { m.x = tx; m.y = ty; m.vx = 0; m.vy = 0; m.fallStartY = m.y; }
  }
  m.pathTo = p;   // (finds its way to you)
  if (Math.abs(dx) > 2.6) return Math.sign(dx) * def.speed * (Math.abs(dx) > 7 ? 1.6 : 1);
  if (Math.abs(dx) > 0.5) m.facingDir = Math.sign(dx);
  return 0;
}
function breedPets(a, b) {
  a.love = b.love = 0; a.loveCd = b.loveCd = 60;
  const baby = new Mob(a.type, (a.x + b.x) / 2, a.y);
  setBaby(baby, true);
  baby.y = a.y + a.h - baby.h;
  baby.tamed = true; baby.maxHealth = baby.health = a.maxHealth;
  baby.variant = Math.random() < 0.5 ? a.variant : b.variant;
  Game.mobs.push(baby);
  for (let i = 0; i < 7; i++) spawnHeart(baby.x + baby.w / 2, baby.y);
  sfx('breed', mobPos(baby));
  showToast(`A baby ${a.def.name.toLowerCase()} was born!`);
}
function tamePet(m) {
  m.tamed = true; m.angry = false; m.sitting = true; m.target = null;
  m.maxHealth = m.def.tamedHealth || m.def.health; m.health = m.maxHealth;
  for (let i = 0; i < 7; i++) spawnHeart(m.x + m.w / 2, m.y);
  sfx(m.def.tameSound || mobSoundPrefix(m) + '.say', mobPos(m));
  showToast(`You tamed a ${m.def.name}! Right-click it to make it sit or follow.`);
  Adv.grant('tame');
}

