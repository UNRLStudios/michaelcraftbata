'use strict';
// =============================================================================
// THE OVERLORD   (type 'overlord')
//   The Underworld's boss: a dragon. Summoned at the Underworld Altar with the forged heart.
//   Fire breath, meteors, skull volleys, pillars, chains, summoned demons; an arena of hazards.
// =============================================================================
defineMob('overlord', {
  // ---- STATS ----
  stats: {
    name: 'The Overlord', w: 5.6, h: 3.4, speed: 7, health: 3200, hostile: true, boss: true, dmg: 12, kb: 0,
    flying: true, fireproof: true, sunproof: true, custom: 'overlord', under: true, tintMul: 1.4,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // he flies his own arena
  // ---- AI ----
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.overlord, below)
  // ---- SOUNDS ----
  sounds: {
    hurt: { files: terraria_('dd2_betsy_hurt', 2), vol: 0.55, pitch: [0.55, 0.65], cat: 'volCreatures', synth: 'hit' },
    death: { files: ['mob/wither/death'], vol: 1, pitch: [0.6, 0.65], cat: 'volCreatures', synth: 'death' },
    'ov.spawn': { files: ['terraria/roar_0'], vol: 1.2, pitch: [0.55, 0.6], cat: 'volCreatures' },
    'ov.roar': { files: ['terraria/roar_2'], vol: 1, pitch: [0.6, 0.7], cat: 'volCreatures', synth: 'growl' },
    'ov.scream': { files: ['terraria/dd2_betsy_scream'], vol: 1.2, pitch: [0.6, 0.65], cat: 'volCreatures' },
    'ov.thunder': { files: ['terraria/thunder_0', 'terraria/thunder_2'], vol: 0.8, pitch: [0.9, 1], cat: 'volAmbient' },
    'ov.skull': { files: terraria_('dd2_betsy_fireball_shot', 2), vol: 0.45, pitch: [0.85, 1.05], cat: 'volCreatures' },
    'ov.boom': { files: terraria_('dd2_betsy_fireball_impact', 2), vol: 0.6, pitch: [0.9, 1.1], cat: 'volCreatures', synth: 'slam' },
    'ov.scythe': { files: ['terraria/item_71'], vol: 0.8, pitch: [0.6, 0.7], cat: 'volCreatures' },
    'ov.warn': { files: ['terraria/item_88'], vol: 0.4, pitch: [0.8, 0.9], cat: 'volCreatures' },
    'ov.meteor': { files: terraria_('dd2_explosive_trap_explode', 2), vol: 0.8, pitch: [0.9, 1.1], cat: 'volCreatures', synth: 'slam' },
    'ov.rumble': { files: ['terraria/dd2_kobold_ignite'], vol: 0.5, pitch: [0.55, 0.65], cat: 'volCreatures' },
    'ov.pillar': { files: ['terraria/item_74', 'terraria/item_34'], vol: 0.7, pitch: [0.9, 1.1], cat: 'volCreatures' },
    'ov.nova': { files: terraria_('dd2_wither_beast_aura_pulse', 2), vol: 1, pitch: [0.6, 0.7], cat: 'volCreatures' },
    'ov.charge': { files: ['terraria/dd2_betsy_summon_0'], vol: 0.9, pitch: [1, 1.1], cat: 'volCreatures' },
    'ov.beam': { files: ['terraria/dd2_betsy_flame_breath'], vol: 1, pitch: [0.8, 0.9], cat: 'volCreatures' },
    'ov.chain': { files: ['mob/irongolem/throw'], vol: 0.9, pitch: [0.55, 0.65], cat: 'volCreatures' },
    'ov.slam': { files: ['terraria/dd2_ogre_ground_pound'], vol: 1.1, pitch: [0.55, 0.6], cat: 'volCreatures', synth: 'slam' },
    'ov.dash': { files: terraria_('dd2_betsy_wind_attack', 2), vol: 0.9, pitch: [0.9, 1], cat: 'volCreatures' },
    'ov.wings': { files: n_('mob/enderdragon/wings', 6), vol: 0.5, pitch: [0.55, 0.65], cat: 'volCreatures' },
    'ov.summon': { files: terraria_('dd2_etherian_portal_spawn_enemy', 2), vol: 0.8, pitch: [0.9, 1], cat: 'volCreatures' },
    'ov.death': { files: ['terraria/dd2_betsy_death_0'], vol: 1.2, pitch: [0.65, 0.7], cat: 'volCreatures' },
    'ov.deathfx': { files: ['boss/overlord_death'], vol: 1.3, pitch: [1, 1], cat: 'volCreatures', synth: 'death' },
    'ov.blink': { files: ['terraria/item_6'], vol: 0.8, pitch: [0.55, 0.65], cat: 'volCreatures' },
    'ov.heartbeat': { files: ['terraria/dd2_ogre_ground_pound'], vol: 0.6, pitch: [1.4, 1.5], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (drops nothing)
  onDeath: function (m) {
    bossReward(m, 'overlord');
    Game.flags.overlordDown = true;
    const mx = m.x + m.w / 2, my = m.y + m.h / 2, r = Math.random;
    for (const [it, q] of [[HELLFIRE_CLEAVER, 1], [HELLSTONE_INGOT, 8 + Math.floor(r() * 7)], [MANA_STAR, 2 + Math.floor(r() * 2)], [DEMON_HORN, 4 + Math.floor(r() * 3)], [DIAMOND, 4 + Math.floor(r() * 5)], [134, 12 + Math.floor(r() * 9)], [245, 2 + Math.floor(r() * 2)], [HELL_LANTERN, 4]]) {
      const d = spawnDrop(it, q, mx, my); if (d) { d.vx = (r() - 0.5) * 9; d.vy = -4 - r() * 5; }
    }
    Game.boss = null;
    eventMessage('THE OVERLORD HAS BEEN DEFEATED!', '#ff5a2a');
    bigTitle12('Victory', 'the Underworld is yours', '#ffd23a');
    sfx('toast.challenge');
  },
  // ---- BOSS ----
  boss: {
    name: 'The Overlord',
    home: (m) => m.arena ? { x: m.arena.cx, y: m.arena.floor - 8 } : { x: m.x, y: m.y },
    chase: { x: 70, y: 48 }, summonAdv: 'summonover', killAdv: 'overlord', dmgMult: 1.5, music: 'Sounds/music/the_overlord.mp3',
    leaveMsg: 'The Overlord sinks back into the fire. The Demon Heart is left behind on the altar...', color: '#ff5a2a',
    dying: (m, dt) => overlordDying14(m, dt),
  },
  bossAI: (m, dt, p) => overlordAI14(m, dt, p),
});

// ---- AI ----
const OV14 = { haz: [], border: null };
function ovBoss14() { const b = Game.boss; return b && b.type === 'overlord' && !b.dead ? b : null; }
// the ground under x near the arena (first solid block going down)
function ovGround14(x, from) {
  const w = Game.world, tx = Math.floor(x);
  for (let y = Math.floor(from); y < Math.floor(from) + 30 && y < WORLD_H; y++) if (isSolidId(w.getTile(tx, y))) return y;
  return Math.floor(from) + 12;
}
// hurt MY player (each game does its own)
function ovHurt14(dmg, fromX, fire, kb, ifr) {
  const p = Game.player; if (!p || p.dead || Game.creative || p.invuln > 0 || Game.spectator) return false;
  dmg = Math.max(1, bossHardHit22(Math.round(dmg * BOSSES.overlord.dmgMult * bossDiffMul13())));   // (Hard: 5 less a hit)
  p.lastKiller = 'The Overlord';
  const was = Net.fxCapture; Net.fxCapture = false;
  try {
    p.damage(dmg, 'boss');
    if (!p.dead) { p.invuln = Math.max(p.invuln, ifr || 0.55); if (fire && !hasFx12(p, 'fireproof')) p.fireT = Math.max(p.fireT || 0, fire); const dir = (p.x + p.w / 2) >= fromX ? 1 : -1; const k = kb || [8, 5]; p.knockback(dir, k[0], k[1]); }
  } finally { Net.fxCapture = was; }
  return true;
}
function ovSpawn14(h) {
  if (Net.fxCapture) netFx(['ov', h]);
  const was = Net.fxCapture; Net.fxCapture = false;
  try { h.age = 0; if (h.t === 'border') { OV14.border = h; return; } OV14.haz.push(h); ovOnSpawn14(h); } finally { Net.fxCapture = was; }
}
function ovOnSpawn14(h) {
  switch (h.t) {
    case 'skull': sfx('ov.skull', { x: h.x, y: h.y }); break;
    case 'scythe': sfx('ov.scythe', { x: h.x, y: h.y }); break;
    case 'meteor': sfx('ov.warn', { x: h.x, y: h.gy, vol: 0.5, pitch: 1.4 }); break;
    case 'pillar': sfx('ov.rumble', { x: h.x, y: h.gy, vol: 0.6 }); break;
    case 'nova': sfx('ov.nova', { x: h.x, y: h.y }); break;
    case 'beam': sfx('ov.charge', { x: h.ox, y: h.oy }); OV14.warnText = { text: h.low ? 'JUMP!' : 'DUCK!', t: h.warn + 0.4 }; break;
    case 'chain': sfx('ov.chain', { x: h.x, y: h.y }); break;
    case 'shock': sfx('ov.slam', { x: h.x, y: h.gy }); break;
  }
}
function ovClear14() { OV14.haz.length = 0; OV14.border = null; OV14.warnText = null; }
// ---- every game: move the hazards, check MY player against them ----
B12.updaters.push(function ovHazards14(dt, p) {
  const H = OV14.haz;
  if (OV14.warnText) { OV14.warnText.t -= dt; if (OV14.warnText.t <= 0) OV14.warnText = null; }
  if (!H.length && !OV14.border) return;
  const boss = ovBoss14();
  if (!boss || boss.dying != null || !onUnder14()) { ovClear14(); return; }
  const pcx = p.x + p.w / 2, pcy = p.y + p.h / 2, alive = !p.dead && !Game.creative;
  const bx = boss.x + boss.w / 2, by = boss.y + boss.h * 0.4;
  for (let i = H.length - 1; i >= 0; i--) {
    const h = H[i]; h.age += dt;
    let done = false;
    switch (h.t) {
      case 'skull': {   // homing, through walls
        const sp = Math.hypot(h.vx, h.vy) || 1, ca = Math.atan2(h.vy, h.vx), ta = Math.atan2(pcy - h.y, pcx - h.x);
        let d = ((ta - ca + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const na = ca + Math.max(-h.turn * dt, Math.min(h.turn * dt, d)), ns = Math.min(h.max || 11, sp + dt * 3);
        h.vx = Math.cos(na) * ns; h.vy = Math.sin(na) * ns; h.x += h.vx * dt; h.y += h.vy * dt;
        if (Math.random() < dt * 30 * particleMul()) Game.particles.push({ x: h.x, y: h.y, vx: -h.vx * 0.1, vy: -h.vy * 0.1 - 0.5, life: 0.4, age: 0, size: 0.12, color: Math.random() < 0.5 ? '#ff6a1a' : '#ffd25a', gravity: -1 });
        if (alive && Math.hypot(pcx - h.x, pcy - h.y) < 0.75) { ovHurt14(h.dmg, h.x, 2); explodeFX(h.x, h.y, false); sfx('ov.boom', { x: h.x, y: h.y, vol: 0.6 }); done = true; }
        if (h.age > h.life) { explodeFX(h.x, h.y, false); done = true; }
        break;
      }
      case 'scythe': {   // out, slowing... then back to him, speeding up
        if (h.age < h.out) { const k = Math.pow(0.12, dt); h.vx *= k; h.vy *= k; }
        else { const tx = bx - h.x, ty = by - h.y, L = Math.hypot(tx, ty) || 1, sp = Math.min(24, 6 + (h.age - h.out) * 22); h.vx += (tx / L * sp - h.vx) * Math.min(1, dt * 5); h.vy += (ty / L * sp - h.vy) * Math.min(1, dt * 5); if (L < 1.4) done = true; }
        h.x += h.vx * dt; h.y += h.vy * dt;
        if (alive && Math.hypot(pcx - h.x, pcy - h.y) < 0.95) { ovHurt14(h.dmg, h.x, 0, [9, 5]); }
        if (h.age > 5) done = true;
        break;
      }
      case 'meteor': {   // a warning circle, then it comes down at an angle
        if (h.age >= h.warn && !h.hit) {
          const k = Math.min(1, (h.age - h.warn) / 0.3);
          h.mx = h.x - h.dir * 9 * (1 - k); h.my = h.gy - 24 * (1 - k);
          if (Math.random() < 0.8 * particleMul()) Game.particles.push({ x: h.mx, y: h.my, vx: -h.dir * 2, vy: -3, life: 0.5, age: 0, size: 0.2, color: Math.random() < 0.5 ? '#ff5a1a' : '#4a1a10', gravity: 0, kind: 'poof' });
          if (k >= 1) {
            h.hit = true; h.hitAt = h.age; explodeFX(h.x, h.gy - 0.3, true); sfx('ov.meteor', { x: h.x, y: h.gy }); Game.shake = Math.min(1.4, Game.shake + 0.35 * Settings.shake / 100);
            if (alive && Math.hypot(pcx - h.x, (p.y + p.h) - h.gy) < 2.6) ovHurt14(h.dmg, h.x, 3, [10, 8]);
            H.push({ t: 'flames', x: h.x, gy: h.gy, w: 1.6, life: 2.6, age: 0, dmg: 4 });
          }
        }
        if (h.hit && h.age > h.hitAt + 0.2) done = true;
        break;
      }
      case 'pillar': {
        if (h.age >= h.warn && !h.up) { h.up = true; sfx('ov.pillar', { x: h.x, y: h.gy }); }
        if (h.up) {
          if (Math.random() < dt * 60 * particleMul()) Game.particles.push({ x: h.x + (Math.random() - 0.5) * 1.6, y: h.gy - Math.random() * h.h, vx: (Math.random() - 0.5) * 2, vy: -6 - Math.random() * 6, life: 0.4, age: 0, size: 0.16 + Math.random() * 0.1, color: Math.random() < 0.5 ? '#ff7a1a' : '#ffe08a', gravity: 0 });
          if (alive && Math.abs(pcx - h.x) < 1.05 && p.y + p.h > h.gy - h.h && p.y < h.gy) ovHurt14(h.dmg, h.x, 3, [6, 12]);
        } else if (Math.random() < dt * 20 * particleMul()) Game.particles.push({ x: h.x + (Math.random() - 0.5) * 1.4, y: h.gy - 0.1, vx: 0, vy: -1.5 - Math.random() * 2, life: 0.5, age: 0, size: 0.08, color: '#ff8a3a', gravity: 0 });
        if (h.age > h.warn + h.dur) done = true;
        break;
      }
      case 'nova': {   // a ring of fire with gaps in it
        const r = h.age * h.speed, d = Math.hypot(pcx - h.x, pcy - h.y);
        if (alive && Math.abs(d - r) < 0.65 && !h.hitMe) {
          const a = Math.atan2(pcy - h.y, pcx - h.x);
          const inGap = h.gaps.some(g => Math.abs(((a - g + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < h.gw);
          if (!inGap) { h.hitMe = true; ovHurt14(h.dmg, h.x, 2); }
        }
        if (r > 40) done = true;
        break;
      }
      case 'beam': {   // DOOM SWEEP: a beam along the ground at head height (duck!) or at your feet (jump!)
        if (h.age >= h.warn && !h.fired) { h.fired = true; sfx('ov.beam', { x: h.ox, y: h.oy }); Game.shake = Math.min(1.4, Game.shake + 0.4 * Settings.shake / 100); }
        if (h.fired && alive) {
          const k = Math.min(1, (h.age - h.warn) / 0.18), reach = h.x0 + (h.x1 - h.x0) * k;
          const c = Math.floor(pcx) - h.x0, gy = h.g[c];
          if (gy != null && (h.dir > 0 ? pcx <= h.x0 + (h.x1 - h.x0) * k : pcx >= h.x1 - (h.x1 - h.x0) * k)) {
            const by0 = gy - h.off - h.th, by1 = gy - h.off + h.th;
            if (p.y < by1 && p.y + p.h > by0) ovHurt14(h.dmg, h.dir > 0 ? h.x0 : h.x1, 2, [9, 4], 0.7);
          }
          void reach;
        }
        if (h.age > h.warn + h.dur) done = true;
        break;
      }
      case 'chain': {   // after the warning: you get dragged in
        if (h.age >= h.warn && alive && h.age < h.warn + 0.75 && Math.abs(pcx - bx) < 30) { applyBossPull(p, bx, by, dt * 26); p.vy = Math.min(p.vy, 0); p.fallStartY = p.y; }
        if (h.age > h.warn + 0.8) done = true;
        break;
      }
      case 'shock': {   // a wave of fire running along the floor
        const fx = h.x + h.dir * h.speed * h.age, gy = ovGround14(fx, h.gy - 6);
        h.fx = fx; h.fgy = gy;
        if (Math.random() < dt * 40 * particleMul()) Game.particles.push({ x: fx, y: gy - 0.2, vx: h.dir * 2, vy: -3 - Math.random() * 3, life: 0.4, age: 0, size: 0.14, color: Math.random() < 0.5 ? '#ff6a1a' : '#ffd25a', gravity: 8 });
        if (alive && Math.abs(pcx - fx) < 0.8 && p.y + p.h > gy - 1.3 && p.y < gy) ovHurt14(h.dmg, fx - h.dir, 2, [7, 9]);
        if (h.age > h.life || solidAt(Math.floor(fx + h.dir * 0.6), gy - 1)) done = true;
        break;
      }
      case 'mark': { if (h.age > h.life) done = true; break; }   // (where he's about to dive)
      case 'flames': {
        if (Math.random() < dt * 14 * particleMul()) spawnFlame(h.x + (Math.random() - 0.5) * h.w * 2, h.gy - 0.3);
        if (alive && Math.abs(pcx - h.x) < h.w && Math.abs(p.y + p.h - h.gy) < 0.4) ovHurt14(h.dmg, h.x, 3, [3, 3], 0.6);
        if (h.age > h.life) done = true;
        break;
      }
    }
    if (done) H.splice(i, 1);
  }
  // the closing wall of fire (phase 3)
  const B = OV14.border;
  if (B) {
    B.age += dt; B.half = Math.max(B.min, B.max - B.age * 1.1);
    if (alive) {
      const off = pcx - B.cx;
      if (Math.abs(off) > B.half) { ovHurt14(8, B.cx + Math.sign(off) * (B.half + 3), 3, [14, 6], 0.8); p.x -= Math.sign(off) * 0.4; }
    }
  }
});
// ---- THE RITUAL ----
function checkOverlordRitual14(x, y) {
  const w = Game.world, msg = (t, c) => { if (Net.applyFrom && Net.applyFrom !== 'host') netSend(Net.applyFrom, { t: 'ev', text: t, color: c || '#ff8a5a' }); else showToast(t); };
  if (w.getTile(x, y + 1) !== UNDER_ALTAR) return;
  if (!w.isUnder) { msg('The Demon Heart is silent. The ritual can only be done in the Underworld.'); return; }
  for (let dx = -2; dx <= 2; dx++) if (w.getTile(x + dx, y + 2) !== 83) { msg('The heart beats... but nothing answers. (5 Blocks of Gold in a row in the floor, the altar on the middle one)'); return; }
  if (ovBoss14()) { msg('The Overlord is already here!'); return; }
  if (Game.ritual14) return;
  Game.ritual14 = { x, y, t: 0, by: Net.applyFrom || 'host', beat: 0 };
  netFxCapture(x, y, () => { netFx(['ovr', x, y]); eventMessage('The Demon Heart beats... the Underworld trembles!', '#ff5a3a'); });
}
function updateRitual14(dt) {
  const R = Game.ritual14; if (!R) return;
  if (!onUnder14()) { Game.ritual14 = null; return; }
  R.t += dt;
  const cx = R.x + 0.5, gy = R.y + 2;
  // the five gold blocks light up one by one with the heartbeat
  const beats = Math.min(5, Math.floor(R.t / 0.7));
  while (R.beat < beats) {
    const k = R.beat++, gx = R.x - 2 + [2, 1, 3, 0, 4][k];
    sfx('ov.heartbeat', { x: cx, y: R.y, vol: 1 + k * 0.2, pitch: 1 - k * 0.04 }); flashAt(gx + 0.5, gy + 0.5, 2.5, '255,200,60', 0.25);
    for (let i = 0; i < 14; i++) Game.particles.push({ x: gx + 0.5, y: gy, vx: (Math.random() - 0.5) * 2, vy: -3 - Math.random() * 4, life: 0.7, age: 0, size: 0.1, color: i % 2 ? '#ffe07a' : '#ff6a2a', gravity: 2, kind: 'star' });
  }
  for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28, r = 4 + Math.random() * 5; Game.particles.push({ x: cx + Math.cos(a) * r, y: R.y + Math.sin(a) * r * 0.6, vx: -Math.cos(a) * r * 1.5, vy: -Math.sin(a) * r, life: 0.6, age: 0, size: 0.1, color: Math.random() < 0.5 ? '#ff2a1a' : '#ffb347', gravity: 0, kind: 'star' }); }
  Game.shake = Math.max(Game.shake, 0.1 + R.t * 0.07);
  if (R.cosmetic) { if (R.t > 4.2) Game.ritual14 = null; return; }
  if (R.t >= 4.2) {
    Game.ritual14 = null;
    const w = Game.world;
    if (w.getTile(R.x, R.y) === DEMON_HEART) w.setTile(R.x, R.y, AIR);
    netFxCapture(R.x, R.y, () => spawnOverlord14(R.x, R.y, R.by));
  }
}
function spawnOverlord14(ax, ay, by) {
  const A = { cx: ax + 0.5, floor: ay + 2, altar: [ax, ay] };
  const m = new Mob('overlord', ax + 0.5 - MOB_TYPES.overlord.w / 2, ay + 3);
  Object.assign(m, { arena: A, phase: 1, move: 'intro', moveT: 0, t: 0, cd: 1.2, last: '', bossInvuln: 3.4, state: 'hostile', guardian: true, leaveT: 0, facingDir: 1, side: 1, hp1: 0 });
  Game.mobs.push(m); bossSpawned(m);
  sfx('ov.spawn', { x: ax, y: ay }); sfx('ov.roar', { x: ax, y: ay }); screenShake(1.3); flashDamage();
  explodeFX(ax + 0.5, ay, true); explodeFX(ax - 1, ay + 1, true); explodeFX(ax + 2, ay + 1, true);
  eventMessage('THE OVERLORD HAS RISEN!', '#ff3a2a');
  bigTitle12('The Overlord', 'the dragon of the Underworld', '#ff5a2a');
  if (by && by !== 'host' && Net.peers.has(by)) netSend(by, { t: 'adv', id: 'summonover' }); else Adv.grant('summonover');
}
// ---- HIS MOVES (host) ----
function overlordAI14(m, dt, p) {
  const A = m.arena, mcx = m.x + m.w / 2, mcy = m.y + m.h / 2, pcx = p.x + p.w / 2, pcy = p.y + p.h / 2, dx = pcx - mcx, dir = dx > 0 ? 1 : -1;
  m.t += dt; m.moveT += dt; m.bossInvuln = Math.max(0, (m.bossInvuln || 0) - dt); m.cd = Math.max(0, m.cd - dt);
  // (1.4 rework: much faster. He never stops moving, barely pauses between attacks, and chains them together)
  const ph = m.phase, fast = ph >= 3 ? 1.8 : ph >= 2 ? 1.45 : 1.2, hp = m.health / m.maxHealth;
  const victims = bossVictims().filter(q => bossNear(m, q, 10));
  const go = (mv) => { m.move = mv; m.moveT = 0; m.did = 0; m.last = mv; m.slammed = false; m.twice = false; m.sweepSeq = null; m.charges = 0; m.slams = 0; m.blinks = 0; m.dived = false; };
  const done = (cd) => { go('hover'); m.cd = cd / fast; };   // back to hovering, and not for long
  // leaving when nobody is at the fight (the heart is left on the altar)
  if (!bossFighters(m).length) { m.leaveT += dt; if (m.leaveT > (bossPlayers().length ? 6 : 3)) { overlordLeave14(m); return; } } else m.leaveT = 0;
  // phase changes
  if (ph === 1 && hp <= 0.65 && m.move !== 'rage') { go('rage'); m.nextPhase = 2; }
  else if (ph === 2 && hp <= 0.3 && m.move !== 'rage') { go('rage'); m.nextPhase = 3; }
  // where he wants to be: swooping from side to side above whoever he's after
  m.sideT = (m.sideT == null ? 1.2 : m.sideT) - dt;
  if (m.sideT <= 0) { m.side = -m.side; m.sideT = (0.9 + Math.random() * 0.9) / fast; }
  const bobY = Math.sin(m.t * 2.4) * 1.6;
  let tx = pcx + m.side * (6 + Math.sin(m.t * 1.3) * 2), ty = Math.min(pcy - 5.2 + bobY, A.floor - 6.5), spd = 13 * fast, hold = false;
  const ground = (x) => ovGround14(x, A.floor - 14);
  switch (m.move) {
    case 'intro': {   // he rises out of the ground under the altar
      hold = true; m.vx = 0; m.vy = -4.4;
      if (Math.random() < 0.6) Game.particles.push({ x: mcx + (Math.random() - 0.5) * 4, y: A.floor, vx: (Math.random() - 0.5) * 4, vy: -5 - Math.random() * 5, life: 0.7, age: 0, size: 0.2, color: Math.random() < 0.5 ? '#ff5a1a' : '#ffd25a', gravity: 6 });
      if (m.moveT > 0.6 && !m.did) { m.did = 1; sfx('ov.roar', { x: mcx, y: mcy, pitch: 0.8 }); screenShake(0.8); }
      if (m.moveT > 2.1) { go('hover'); m.cd = 0.2; }
      break;
    }
    case 'rage': {   // a new phase: he screams, nothing can hurt him for a moment
      hold = true; m.vx *= 0.9; m.vy *= 0.9; m.bossInvuln = 0.5;
      if (!m.did) {
        m.did = 1; m.phase = m.nextPhase; flashDamage(); screenShake(1.3); sfx('ov.scream', { x: mcx, y: mcy }); sfx('ov.thunder', { x: mcx, y: mcy });
        OV14.haz.length = 0;
        for (let i = 0; i < 60; i++) { const a = i / 60 * 6.28; Game.particles.push({ x: mcx, y: mcy, vx: Math.cos(a) * 12, vy: Math.sin(a) * 12, life: 0.7, age: 0, size: 0.16, color: i % 2 ? '#ff5a1a' : '#ffe08a', gravity: 0, kind: 'star' }); }
        ovSpawn14({ t: 'nova', x: r1(mcx), y: r1(mcy), speed: 16, gaps: [r2(Math.random() * 6.28)], gw: 0.5, dmg: 8 });   // the scream itself knocks out a ring of fire
        if (m.phase === 2) { eventMessage('The Overlord\'s crown ignites!', '#ff7a2a'); summonDemons14(m, 3); }
        else { eventMessage('THE OVERLORD IS ENRAGED! The fire closes in!', '#ff2a1a'); ovSpawn14({ t: 'border', cx: A.cx, floor: A.floor, max: 36, min: 19, half: 36 }); }
      }
      if (m.moveT > 1.4) { go('hover'); m.cd = 0; }
      break;
    }
    case 'hover': {
      if (m.cd <= 0) {
        const pool = ph === 1 ? [['barrage', 3], ['scythes', 3], ['meteors', 2], ['charge', 2.5], ['slam', 2], ['blink', 2.5], ['storm', 1.5], ['summon', 0.8]]
          : ph === 2 ? [['barrage', 2], ['scythes', 2], ['meteors', 2], ['charge', 2], ['slam', 1.5], ['pillars', 2.5], ['chains', 1.5], ['nova', 2], ['blink', 3], ['storm', 2], ['summon', 0.8]]
          : [['barrage', 1.5], ['scythes', 2], ['meteors', 2.5], ['charge', 2], ['pillars', 2], ['chains', 1.5], ['nova', 2], ['sweep', 3], ['slam', 1], ['blink', 3.5], ['storm', 2.5]];
        const demons = Game.mobs.filter(q => q.def.demon && q.dying == null).length;
        const choices = pool.filter(([n]) => n !== m.last && !(n === 'summon' && demons >= 4));
        go(pickW12(choices));
      }
      break;
    }
    case 'barrage': {   // homing burning skulls, in volleys, fired while he keeps swooping
      spd *= 0.75;
      const n = ph === 1 ? 3 : ph === 2 ? 4 : 5, vol = ph === 3 ? 5 : 4, gap = 0.26 / fast;
      if (m.moveT > 0.25 && m.did < vol && m.moveT > 0.25 + m.did * gap) {
        m.did++;
        for (const q of victims.length ? victims : [p]) {
          const MO = ovMouth14(m), a0 = Math.atan2(q.y + q.h / 2 - MO.y, q.x + q.w / 2 - MO.x);   // (out of his mouth)
          for (let k = 0; k < n; k++) { const a = a0 + (k - (n - 1) / 2) * 0.4; ovSpawn14({ t: 'skull', x: r1(MO.x + Math.cos(a) * 0.6), y: r1(MO.y + Math.sin(a) * 0.6), vx: r1(Math.cos(a) * 9), vy: r1(Math.sin(a) * 9), turn: ph === 3 ? 2.8 : 2.2, max: 13 + ph * 1.5, life: 3.6, dmg: 8 }); }
        }
      }
      if (m.moveT > 0.35 + vol * gap + 0.25) done(0.35);
      break;
    }
    case 'scythes': {   // a fan of scythes that fly out and come back
      spd *= 0.6;
      const waves = ph >= 2 ? 2 : 1;
      if (m.moveT > 0.3 && m.did < waves && m.moveT > 0.3 + m.did * 0.45) {
        m.did++;
        const n = ph === 1 ? 4 : 5, a0 = Math.atan2(pcy - mcy, dx) + (m.did === 2 ? 0.15 : 0);
        for (let k = 0; k < n; k++) { const a = a0 + (k - (n - 1) / 2) * 0.32; ovSpawn14({ t: 'scythe', x: r1(mcx), y: r1(mcy - 0.5), vx: r1(Math.cos(a) * 25), vy: r1(Math.sin(a) * 25), out: 0.7, dmg: 10 }); }
      }
      if (m.moveT > 0.45 + waves * 0.45 + 0.35) done(0.35);
      break;
    }
    case 'meteors': {   // meteors fall where the warning circles are
      spd *= 0.7;
      const n = ph === 1 ? 8 : ph === 2 ? 11 : 15;
      if (m.moveT > 0.25 && m.did < n && m.moveT > 0.25 + m.did * 0.12) {
        const q = (victims.length ? victims : [p])[m.did % Math.max(1, victims.length)];
        const aim = m.did < 3 * Math.max(1, victims.length) ? q.x + q.w / 2 + (q.vx || 0) * 0.6 : A.cx + (Math.random() - 0.5) * 56;
        m.did++;
        ovSpawn14({ t: 'meteor', x: r1(aim), gy: ground(aim), warn: 0.85, dir: Math.random() < 0.5 ? -1 : 1, dmg: 13 });
      }
      if (m.moveT > 0.3 + n * 0.12 + 0.3) done(0.3);
      break;
    }
    case 'charge': {   // wind up, then rip across the arena at your height (P2: and back; P3: three times)
      const W = 0.45 / Math.min(1.3, fast);
      if (m.moveT < W) { hold = true; m.vx *= 0.8; m.vy *= 0.8; m.chargeDir = dir; m.chargeY = Math.min(pcy - m.h * 0.35, ground(pcx) - m.h * 0.5 - 0.2); if (!m.did) { m.did = 1; sfx('ov.roar', { x: mcx, y: mcy, pitch: 1.25, vol: 0.8 }); } }
      else {
        hold = true; m.vx = m.chargeDir * 30 * Math.min(1.25, fast); m.vy = (m.chargeY - mcy) * 5;
        if (m.did === 1) { m.did = 2; sfx('ov.dash', { x: mcx, y: mcy }); }
        if (m.moveT % 0.1 < dt) { const fx = mcx, gy = ground(fx); if (gy - mcy < 9) ovSpawn14({ t: 'flames', x: r1(fx), gy, w: 1.2, life: 2, dmg: 4 }); }
        for (const q of victims) if (boxGap(m, q) < 0.3 && !(q.invuln > 0)) bossHitPlayer(14, mcx, q, 3, { kb: [16, 8], iframes: 0.7 });
        const out = Math.abs(mcx - A.cx) > 32 || (m.moveT > W + 0.25 && solidAt(Math.floor(mcx + m.chargeDir * 2), Math.floor(mcy)));
        if (out || m.moveT > W + 1.4) {
          m.charges = (m.charges || 0) + 1;
          if (m.charges < (ph >= 3 ? 3 : ph >= 2 ? 2 : 1)) { m.moveT = W * 0.4; m.did = 1; m.chargeDir = -m.chargeDir; m.chargeY = Math.min(pcy - m.h * 0.35, ground(pcx) - m.h * 0.5 - 0.2); m.vx = 0; sfx('ov.roar', { x: mcx, y: mcy, pitch: 1.4, vol: 0.6 }); }
          else { m.charges = 0; m.vx *= 0.3; done(0.35); }
        }
      }
      break;
    }
    case 'slam': {   // up... then down on you: shockwaves run both ways along the floor (jump them)
      if (m.moveT < 0.42) { hold = true; m.vx += (pcx - mcx) * dt * 5; m.vy = -8; m.slamX = pcx + (p.vx || 0) * 0.25; }
      else if (!m.slammed) {
        hold = true; m.vy = 42; m.vx = (m.slamX - mcx) * 4;
        const gy = ground(mcx);
        if (m.y + m.h >= gy - 0.1) {
          m.slammed = true; m.y = gy - m.h; m.vy = 0; m.vx = 0;
          sfx('ov.slam', { x: mcx, y: gy }); sfx('fall.big', { x: mcx, y: gy, pitch: 0.4 }); screenShake(1.2); explodeFX(mcx, gy - 0.5, true);
          for (const s of [-1, 1]) { ovSpawn14({ t: 'shock', x: r1(mcx + s * 1.5), gy, dir: s, speed: 15 * fast, life: 2, dmg: 10 }); if (ph >= 2) ovSpawn14({ t: 'shock', x: r1(mcx + s * 1.5), gy, dir: s, speed: 9 * fast, life: 2.6, dmg: 10 }); }
          for (const q of victims) if (Math.abs(q.x + q.w / 2 - mcx) < 3.2 && q.y + q.h > gy - 3) bossHitPlayer(14, mcx, q, 2, { kb: [14, 9], iframes: 0.6 });
          m.slamT = m.moveT; m.slams = (m.slams || 0) + 1;
        }
        if (m.moveT > 2.2) { m.slammed = true; m.slamT = m.moveT; }
      } else {
        hold = true; m.vx = 0; m.vy = m.moveT - m.slamT > 0.45 ? -9 : 0;   // a moment on the ground: hit him!
        if (m.moveT - m.slamT > 0.85) {
          if (ph >= 2 && m.slams < (ph >= 3 ? 3 : 2)) { m.slammed = false; m.moveT = 0.15; }   // and again!
          else { m.slams = 0; m.slammed = false; done(0.3); }
        }
      }
      break;
    }
    case 'blink': {   // he bursts into fire, reappears above and behind you... and dives straight through you
      hold = true;
      if (!m.did) {
        m.did = 1;
        const burst = (x, y) => { explodeFX(x, y, true); for (let i = 0; i < 24; i++) { const a = i / 24 * 6.28; Game.particles.push({ x, y, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, life: 0.4, age: 0, size: 0.18, color: i % 2 ? '#ff4a1a' : '#1a0404', gravity: 0 }); } };
        burst(mcx, mcy);
        const s = (p.vx || 0) > 1 ? -1 : (p.vx || 0) < -1 ? 1 : (Math.random() < 0.5 ? -1 : 1);
        let nx = pcx + s * 7.5, ny = pcy - 8.5;
        const top = ovCeil14(nx, ny); if (ny - m.h / 2 < top) ny = top + m.h / 2;
        m.x = nx - m.w / 2; m.y = ny - m.h / 2; m.vx = m.vy = 0;
        burst(nx, ny); sfx('ov.blink', { x: nx, y: ny }); sfx('ov.roar', { x: nx, y: ny, pitch: 1.5, vol: 0.5 });
        m.diveTo = { x: pcx + (p.vx || 0) * 0.3, y: pcy };
        ovSpawn14({ t: 'mark', x: r1(m.diveTo.x), y: r1(m.diveTo.y), life: 0.42 / Math.min(1.3, fast) });
      } else if (m.moveT < 0.42 / Math.min(1.3, fast)) { m.vx = m.vy = 0; }
      else if (!m.dived) {
        const tx2 = m.diveTo.x - mcx, ty2 = m.diveTo.y + 1.5 - mcy, L = Math.hypot(tx2, ty2) || 1;
        m.vx = tx2 / L * 34; m.vy = ty2 / L * 34;
        if (m.moveT % 0.06 < dt) Game.particles.push({ x: mcx, y: mcy, vx: 0, vy: 0, life: 0.35, age: 0, size: 0.6, color: 'rgba(255,90,30,0.5)', gravity: 0, kind: 'poof' });
        for (const q of victims) if (boxGap(m, q) < 0.3 && !(q.invuln > 0)) bossHitPlayer(14, mcx, q, 2, { kb: [14, 10], iframes: 0.7 });
        const gy = ground(mcx);
        if (L < 1 || m.y + m.h >= gy - 0.2 || m.moveT > 1.3) {
          m.dived = true; m.vx *= 0.2; m.vy = -6; if (m.y + m.h > gy) m.y = gy - m.h;
          explodeFX(mcx, Math.min(gy, mcy + 2), true); sfx('ov.meteor', { x: mcx, y: mcy }); screenShake(0.7);
          if (ph >= 2) for (const s of [-1, 1]) ovSpawn14({ t: 'shock', x: r1(mcx + s * 1.5), gy, dir: s, speed: 13 * fast, life: 1.6, dmg: 9 });
        }
      } else if (m.moveT > 1.0) { m.dived = false; m.blinks = (m.blinks || 0) + 1; if (ph >= 3 && m.blinks < 2) { m.did = 0; m.moveT = 0; } else { m.blinks = 0; done(0.3); } }
      break;
    }
    case 'storm': {   // he circles you, raining skulls down in a spiral
      const ang = m.moveT * 2.4 * Math.min(1.4, fast) + (m.stormA || 0);
      if (!m.did) { m.did = 1; m.stormA = Math.atan2(mcy - pcy, mcx - pcx); sfx('ov.scream', { x: mcx, y: mcy, pitch: 1.4, vol: 0.6 }); }
      tx = pcx + Math.cos(ang) * 9; ty = Math.min(pcy - 4 + Math.sin(ang) * 3, A.floor - 7); spd = 22 * fast;
      m.stormCd = (m.stormCd || 0) - dt;
      if (m.stormCd <= 0 && m.moveT > 0.3) {
        m.stormCd = 0.16 / fast;
        const MO = ovMouth14(m), a = Math.atan2(pcy - MO.y, pcx - MO.x) + (Math.random() - 0.5) * 0.5;
        ovSpawn14({ t: 'skull', x: r1(MO.x), y: r1(MO.y), vx: r1(Math.cos(a) * 11), vy: r1(Math.sin(a) * 11), turn: 1.2, max: 15, life: 2.4, dmg: 7 });
      }
      if (m.moveT > 2.4) done(0.3);
      break;
    }
    case 'summon': {
      spd *= 0.5;
      if (m.moveT > 0.35 && !m.did) { m.did = 1; summonDemons14(m, ph === 1 ? 2 : 3); }
      if (m.moveT > 0.8) done(0.2);
      break;
    }
    case 'pillars': {   // lava pillars march toward you, and one comes up under each of you
      spd *= 0.5;
      const n = ph === 2 ? 8 : 11;
      if (m.moveT > 0.25 && m.did < n && m.moveT > 0.25 + m.did * 0.13 / fast) {
        const x = mcx + dir * (2 + m.did * 2.4); m.did++;
        if (Math.abs(x - A.cx) < 40) ovSpawn14({ t: 'pillar', x: r1(x), gy: ground(x), warn: 0.6, dur: 0.75, h: 16, dmg: 12 });
        if (m.did === 3 || m.did === 7) for (const q of victims) { const qx = q.x + q.w / 2 + (q.vx || 0) * 0.5; ovSpawn14({ t: 'pillar', x: r1(qx), gy: ground(qx), warn: 0.75, dur: 0.75, h: 16, dmg: 12 }); }
      }
      if (m.moveT > 0.3 + n * 0.13 + 0.5) done(0.3);
      break;
    }
    case 'chains': {   // HELL CHAINS: he drags everyone in... then slams
      hold = true; m.vx *= 0.85; m.vy *= 0.85;
      if (!m.did) { m.did = 1; const MO = ovMouth14(m); ovSpawn14({ t: 'chain', x: r1(MO.x), y: r1(MO.y), warn: 0.45 }); }
      if (m.moveT > 1.05) { go('slam'); m.moveT = 0.3; }
      break;
    }
    case 'nova': {   // rings of fire: find the gap (he keeps moving)
      spd *= 0.4;
      const n = ph === 3 ? 4 : 3;
      if (m.moveT > 0.3 && m.did < n && m.moveT > 0.3 + m.did * 0.42) {
        m.did++;
        const g0 = Math.random() * 6.28, gaps = ph === 3 ? [g0, g0 + 2.4] : [g0, g0 + 2.1, g0 + 4.2];
        ovSpawn14({ t: 'nova', x: r1(mcx), y: r1(mcy), speed: 12 + ph * 1.5, gaps: gaps.map(r2), gw: 0.32, dmg: 10 });
      }
      if (m.moveT > 0.4 + n * 0.42 + 0.3) done(0.3);
      break;
    }
    case 'sweep': {   // DOOM SWEEP: duck (or jump)!
      hold = true; m.vx *= 0.85; m.vy += ((A.floor - 10) - mcy) * dt * 2;
      const seq = ph === 3 ? (Math.random() < 0.5 ? ['high', 'low', 'high'] : ['low', 'high', 'low']) : ['high'];
      if (!m.sweepSeq) m.sweepSeq = seq;
      if (m.did < m.sweepSeq.length && m.moveT > 0.2 + m.did * 1.05) {
        const low = m.sweepSeq[m.did] === 'low'; m.did++;
        const x0 = Math.floor(A.cx - 34), x1 = Math.floor(A.cx + 34), g = [];
        for (let x = x0; x <= x1; x++) g.push(ground(x + 0.5));
        ovSpawn14({ t: 'beam', x0, x1, g, dir: mcx < A.cx ? 1 : -1, warn: 0.8, dur: 0.7, low, off: low ? 0.45 : 1.66, th: low ? 0.3 : 0.2, dmg: 15, ox: r1(ovMouth14(m).x), oy: r1(ovMouth14(m).y) });
      }
      if (m.moveT > 0.2 + m.sweepSeq.length * 1.05 + 0.8) { m.sweepSeq = null; done(0.3); }
      break;
    }
  }
  // fly (fast, and snappy)
  if (!hold) {
    const ddx = tx - mcx, ddy = ty - mcy, L = Math.hypot(ddx, ddy) || 1;
    m.vx += (ddx / L * spd * Math.min(1, L / 2.5) - m.vx) * Math.min(1, dt * 4);
    m.vy += (ddy / L * spd * Math.min(1, L / 2.5) - m.vy) * Math.min(1, dt * 4);
    if (Math.hypot(m.vx, m.vy) > 14 && Math.random() < dt * 30) Game.particles.push({ x: mcx - m.vx * 0.05, y: mcy, vx: 0, vy: 0, life: 0.3, age: 0, size: 0.5, color: 'rgba(255,80,30,0.35)', gravity: 0, kind: 'poof' });
  }
  m.facingDir = (m.move === 'charge' || m.move === 'blink') && Math.abs(m.vx) > 2 ? Math.sign(m.vx) : dir;
  m.x += m.vx * dt; m.y += m.vy * dt;
  if (m.move !== 'intro' && m.move !== 'slam') { const top = ovCeil14(mcx, m.y); if (m.y < top) { m.y = top; m.vy = Math.max(0, m.vy); } }
  if (m.x + m.w / 2 < A.cx - 40) m.x = A.cx - 40 - m.w / 2; if (m.x + m.w / 2 > A.cx + 40) m.x = A.cx + 40 - m.w / 2;
  // touching him burns
  if (m.move !== 'intro' && m.move !== 'charge' && m.move !== 'blink') for (const q of victims) if (boxGap(m, q) < 0.15 && !(q.invuln > 0)) bossHitPlayer(MOB_TYPES.overlord.dmg, mcx, q, 3, { kb: [12, 6], iframes: 0.6 });
  // his crown of fire (and phase 3: he burns all over)
  if (Math.random() < dt * (ph >= 3 ? 50 : ph >= 2 ? 30 : 16) * particleMul()) Game.particles.push({ x: mcx + (Math.random() - 0.5) * (ph >= 3 ? 3.4 : 1.4), y: m.y + (ph >= 3 ? Math.random() * m.h : 0.3), vx: (Math.random() - 0.5), vy: -2 - Math.random() * 2, life: 0.6, age: 0, size: 0.12, color: Math.random() < 0.5 ? '#ff6a1a' : '#ffd25a', gravity: -1 });
  // wings
  m.wingSnd = (m.wingSnd || 0) - dt; if (m.wingSnd <= 0) { m.wingSnd = m.move === 'charge' || m.move === 'storm' ? 0.25 : 0.5; sfx('ov.wings', { x: mcx, y: mcy, vol: 0.5 }); }
}
// the roof over the arena (he doesn't go into the ceiling)
function ovCeil14(x, y) { const w = Game.world; for (let yy = Math.floor(y); yy > Math.floor(y) - 30; yy--) if (isSolidId(w.getTile(Math.floor(x), yy))) return yy + 1.2; return -99; }
function summonDemons14(m, n) {
  sfx('ov.summon', { x: m.x, y: m.y }); screenShake(0.3);
  for (let i = 0; i < n; i++) {
    const type = i === 0 ? 'lesserdemon' : i === 1 ? 'cinderimp' : (m.phase >= 2 ? 'hellhound' : 'cinderimp');
    const x = m.x + m.w / 2 + (i - (n - 1) / 2) * 3, y = m.y + 1;
    const d = new Mob(type, x - 0.4, y); d.state = 'hostile'; d.guardian = true;
    if (type === 'hellhound') { d.y = ovGround14(x, m.arena.floor - 12) - d.h - 0.01; }
    Game.mobs.push(d);
    for (let k = 0; k < 16; k++) Game.particles.push({ x, y: d.y + d.h / 2, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 0.5, age: 0, size: 0.14, color: k % 2 ? '#ff4a1a' : '#1a0404', gravity: 0 });
  }
}
function overlordLeave14(m) {
  bossLeave(m); ovClear14();
  for (const x of Game.mobs) if (x.def.demon && x.guardian) x.dead = true;
  const A = m.arena; if (A && A.altar) { const d = spawnDrop(DEMON_HEART, 1, A.altar[0] + 0.5, A.altar[1] + 0.5); if (d) d.vy = -3; }
}
// he goes out in a storm of fire: he screams, light cracks out of him, the explosions come faster
// and faster... then one huge blast and a white flash (timed to his death sound, boss/overlord_death)
function overlordDying14(m, dt) {
  m.dying += dt; m.vx *= 0.9; m.vy = -0.35; m.x += m.vx * dt + (Math.random() - 0.5) * 0.12; m.y += m.vy * dt; m.hurtFlash = 0.1;
  if (m.dying < dt * 1.5) {
    ovClear14(); sfx('ov.deathfx', { x: m.x, y: m.y }); eventMessage('The Overlord is falling!', '#ff7a3a');
    for (const x of Game.mobs) if (x.def.demon && x.guardian) { x.health = 0; killMob(x); }
  }
  m.boomT = (m.boomT || 0) - dt;
  if (m.boomT <= 0 && m.dying < 4.2) { m.boomT = Math.max(0.05, 0.3 - m.dying * 0.065); explodeFX(m.x + Math.random() * m.w, m.y + Math.random() * m.h, Math.random() < 0.35 + m.dying * 0.1); screenShake(0.15 + m.dying * 0.06); }
  if (m.dying >= 4.3) {
    for (let i = 0; i < 7; i++) explodeFX(m.x + m.w / 2 + (Math.random() - 0.5) * 4, m.y + m.h / 2 + (Math.random() - 0.5) * 4, true);
    for (let i = 0; i < 80; i++) { const a = Math.random() * 6.28, sp = 4 + Math.random() * 16; Game.particles.push({ x: m.x + m.w / 2, y: m.y + m.h / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.8 + Math.random() * 0.8, age: 0, size: 0.14 + Math.random() * 0.14, color: ['#ffffff', '#ffe08a', '#ff7a1a', '#ff3a1a'][i % 4], gravity: 2, kind: i % 3 ? undefined : 'star' }); }
    for (let r = 0; r < 3; r++) shockRing(m.x + m.w / 2, m.y + m.h / 2, 8 + r * 6, '255,200,120');
    flashDamage(); screenShake(1.4);
    finishMobDeath(m);
  }
}
// where his fire comes out: in front of his body, at head height (the AI uses this)
function ovMouth14(m) { const f = m.facingDir || 1; return { x: m.x + m.w / 2 + f * 2.4, y: m.y + m.h / 2 - 1.3 }; }

// ---- VISUALS (drawing and effects) ----
BOLT_COL12.hskull = ['255,70,20', '#ffd27a'];
// ---- drawing the hazards ----
B12.glow.push(function ovDraw14(ox, oy, glow) {
  if (!OV14.haz.length && !OV14.border) return;
  const t = performance.now() / 1000;
  for (const h of OV14.haz) {
    switch (h.t) {
      case 'skull': {
        const x = ox + h.x * TILE, y = oy + h.y * TILE, s = Math.max(8, TILE * 0.62);
        glow(x, y, s * 3, '255,90,20', 0.6);
        ctx.save(); ctx.translate(x, y); ctx.scale(h.vx < 0 ? -1 : 1, 1);
        ctx.fillStyle = '#fff0d0'; ctx.fillRect(-s / 2, -s / 2, s, s * 0.75); ctx.fillRect(-s * 0.3, s * 0.2, s * 0.6, s * 0.3);
        ctx.fillStyle = '#2a0604'; ctx.fillRect(-s * 0.32, -s * 0.18, s * 0.24, s * 0.24); ctx.fillRect(s * 0.08, -s * 0.18, s * 0.24, s * 0.24); ctx.fillRect(-s * 0.18, s * 0.28, s * 0.08, s * 0.16); ctx.fillRect(s * 0.06, s * 0.28, s * 0.08, s * 0.16);
        ctx.fillStyle = '#ff6a1a'; ctx.fillRect(-s * 0.28, -s * 0.14, s * 0.12, s * 0.12); ctx.fillRect(s * 0.14, -s * 0.14, s * 0.12, s * 0.12);
        ctx.restore();
        break;
      }
      case 'scythe': {
        const x = ox + h.x * TILE, y = oy + h.y * TILE, r = TILE * 1.05;
        glow(x, y, r * 2.4, '255,40,60', 0.55);
        ctx.save(); ctx.translate(x, y); ctx.rotate(h.age * 15);
        ctx.strokeStyle = '#ff3a4a'; ctx.lineWidth = Math.max(3, r * 0.32); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 1.3); ctx.stroke();
        ctx.strokeStyle = '#ffd0d0'; ctx.lineWidth = Math.max(1, r * 0.1); ctx.beginPath(); ctx.arc(0, 0, r * 1.08, 0.2, Math.PI * 1.15); ctx.stroke();
        ctx.strokeStyle = '#1a0408'; ctx.lineWidth = Math.max(2, r * 0.16); ctx.beginPath(); ctx.arc(0, 0, r * 0.66, 0.4, Math.PI * 1.1); ctx.stroke();
        ctx.restore();
        break;
      }
      case 'meteor': {
        const x = ox + h.x * TILE, y = oy + h.gy * TILE;
        if (!h.hit) {
          const k = Math.min(1, h.age / h.warn), pulse = 0.5 + 0.5 * Math.sin(t * 18);
          ctx.strokeStyle = `rgba(255,${Math.round(60 + 80 * pulse)},40,${0.5 + 0.4 * k})`; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(x, y, TILE * 2.4, TILE * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = `rgba(255,60,20,${0.18 * k})`; ctx.beginPath(); ctx.ellipse(x, y, TILE * 2.4 * k, TILE * 0.5 * k, 0, 0, Math.PI * 2); ctx.fill();
          if (h.mx != null) {
            const mx = ox + h.mx * TILE, my = oy + h.my * TILE, R = TILE * 0.9;
            glow(mx, my, R * 4, '255,110,30', 0.8);
            ctx.fillStyle = '#3a1a14'; ctx.beginPath(); ctx.arc(mx, my, R, 0, 6.28); ctx.fill();
            ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(mx - R * 0.25, my - R * 0.25, R * 0.45, 0, 6.28); ctx.fill();
          }
        }
        break;
      }
      case 'pillar': {
        const x = ox + h.x * TILE, y = oy + h.gy * TILE;
        if (!h.up) { const a = 0.3 + 0.5 * (h.age / h.warn); ctx.fillStyle = `rgba(255,120,30,${a})`; ctx.fillRect(x - TILE * 0.9, y - 3, TILE * 1.8, 5); glow(x, y, TILE * 1.6, '255,100,20', a * 0.6); }
        else {
          const k = Math.min(1, (h.age - h.warn) / 0.12), fade = Math.min(1, (h.warn + h.dur - h.age) / 0.2), top = y - h.h * TILE * k, wob = Math.sin(t * 30) * TILE * 0.08;
          const gr = ctx.createLinearGradient(0, top, 0, y); gr.addColorStop(0, `rgba(255,200,80,${0.2 * fade})`); gr.addColorStop(0.3, `rgba(255,120,30,${0.85 * fade})`); gr.addColorStop(1, `rgba(255,240,180,${0.95 * fade})`);
          ctx.fillStyle = gr; ctx.fillRect(x - TILE * 0.95 + wob, top, TILE * 1.9, y - top);
          ctx.fillStyle = `rgba(255,250,220,${0.8 * fade})`; ctx.fillRect(x - TILE * 0.3 - wob, top + TILE, TILE * 0.6, y - top - TILE);
          glow(x, y - h.h * TILE / 2, h.h * TILE * 0.7, '255,120,30', 0.5 * fade);
        }
        break;
      }
      case 'nova': {
        const r = h.age * h.speed * TILE, x = ox + h.x * TILE, y = oy + h.y * TILE;
        ctx.lineWidth = Math.max(4, TILE * 0.45);
        const segs = 72;
        for (let k = 0; k < segs; k++) {
          const a0 = k / segs * Math.PI * 2, a1 = (k + 1) / segs * Math.PI * 2, am = (a0 + a1) / 2;
          if (h.gaps.some(g => Math.abs(((am - g + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < h.gw)) continue;
          ctx.strokeStyle = k % 2 ? 'rgba(255,120,30,0.9)' : 'rgba(255,200,90,0.9)';
          ctx.beginPath(); ctx.arc(x, y, r, a0, a1 + 0.01); ctx.stroke();
        }
        break;
      }
      case 'beam': {
        const fired = h.age >= h.warn, k = fired ? Math.min(1, (h.age - h.warn) / 0.18) : 1, fade = fired ? Math.min(1, (h.warn + h.dur - h.age) / 0.2) : 1;
        for (let c = 0; c < h.g.length; c++) {
          const wx = h.x0 + c; if (h.g[c] == null) continue;
          if (fired && (h.dir > 0 ? wx > h.x0 + (h.x1 - h.x0) * k : wx < h.x1 - (h.x1 - h.x0) * k)) continue;
          const x = ox + wx * TILE, y = oy + (h.g[c] - h.off) * TILE;
          if (!fired) { if (Math.sin(t * 30) > -0.2) { ctx.fillStyle = h.low ? 'rgba(255,220,80,0.75)' : 'rgba(255,60,40,0.75)'; ctx.fillRect(x, y - 1, TILE + 1, 2); } }
          else {
            const th = h.th * TILE * (1 + 0.15 * Math.sin(t * 40 + c));
            ctx.fillStyle = `rgba(255,110,30,${0.9 * fade})`; ctx.fillRect(x, y - th, TILE + 1, th * 2);
            ctx.fillStyle = `rgba(255,245,200,${0.95 * fade})`; ctx.fillRect(x, y - th * 0.35, TILE + 1, th * 0.7);
            if (c % 3 === 0) glow(x + TILE / 2, y, TILE * 1.4, '255,120,30', 0.4 * fade);
          }
        }
        break;
      }
      case 'chain': {
        const b = ovBoss14(); if (!b) break;
        const p = Game.player, x0 = ox + (b.x + b.w / 2) * TILE, y0 = oy + (b.y + b.h * 0.4) * TILE;
        const x1 = h.age < h.warn ? x0 + (ox + (p.x + p.w / 2) * TILE - x0) * (h.age / h.warn) : ox + (p.x + p.w / 2) * TILE, y1 = h.age < h.warn ? y0 + (oy + (p.y + 0.8) * TILE - y0) * (h.age / h.warn) : oy + (p.y + 0.8) * TILE;
        const n = Math.max(2, Math.floor(Math.hypot(x1 - x0, y1 - y0) / (TILE * 0.35)));
        for (let k = 0; k <= n; k++) { const q = k / n, x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q + Math.sin(q * 9 + t * 10) * 3; ctx.fillStyle = k % 2 ? '#5a4a48' : '#ff6a2a'; ctx.fillRect(Math.round(x - 3), Math.round(y - 3), 6, 6); }
        break;
      }
      case 'shock': {
        if (h.fx == null) break;
        const x = ox + h.fx * TILE, y = oy + h.fgy * TILE;
        glow(x, y - TILE * 0.6, TILE * 2, '255,110,30', 0.7);
        ctx.fillStyle = 'rgba(255,140,40,0.9)';
        ctx.beginPath(); ctx.moveTo(x - h.dir * TILE * 1.2, y); ctx.quadraticCurveTo(x, y - TILE * 2.4, x + h.dir * TILE * 0.5, y); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,190,0.9)'; ctx.beginPath(); ctx.moveTo(x - h.dir * TILE * 0.6, y); ctx.quadraticCurveTo(x, y - TILE * 1.3, x + h.dir * TILE * 0.3, y); ctx.fill();
        break;
      }
      case 'flames': { const x = ox + h.x * TILE, y = oy + h.gy * TILE; glow(x, y, h.w * TILE * 1.6, '255,100,20', 0.35 * Math.min(1, (h.life - h.age) / 0.5)); break; }
      case 'mark': {
        const x = ox + h.x * TILE, y = oy + h.y * TILE, k = Math.min(1, h.age / h.life), r = TILE * (2.6 - 1.6 * k);
        ctx.strokeStyle = `rgba(255,${Math.round(40 + 160 * k)},40,0.95)`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - r * 1.3, y); ctx.lineTo(x + r * 1.3, y); ctx.moveTo(x, y - r * 1.3); ctx.lineTo(x, y + r * 1.3); ctx.stroke();
        glow(x, y, r * 1.5, '255,60,30', 0.4);
        break;
      }
    }
  }
  const B = OV14.border;
  if (B) for (const s of [-1, 1]) {
    const x = ox + (B.cx + s * B.half) * TILE, top = oy + (B.floor - 30) * TILE, bot = oy + (B.floor + 4) * TILE;
    const gr = ctx.createLinearGradient(x - s * TILE * 2, 0, x + s * TILE * 0.5, 0); gr.addColorStop(0, 'rgba(255,90,20,0)'); gr.addColorStop(1, 'rgba(255,120,30,0.85)');
    ctx.fillStyle = gr; ctx.fillRect(Math.min(x - s * TILE * 2, x + s * TILE * 0.5), top, TILE * 2.5, bot - top);
    for (let y = top; y < bot; y += TILE * 0.5) { const f = Math.sin(y * 0.05 + t * 8) * TILE * 0.3; ctx.fillStyle = 'rgba(255,230,160,0.8)'; ctx.fillRect(x + f - 2, y, 4, TILE * 0.3); }
    glow(x, oy + (B.floor - 8) * TILE, TILE * 6, '255,90,20', 0.35);
  }
});
// DUCK! / JUMP!
B12.post.push(function ovWarnText14() {
  const W = OV14.warnText; if (!W || Game.screen === 'title') return;
  const fs = Math.max(28, Math.round(VIEW.h / 9)), a = Math.min(1, W.t * 3), pulse = 1 + 0.08 * Math.sin(performance.now() / 50);
  ctx.save(); ctx.globalAlpha = a; ctx.font = `${Math.round(fs * pulse)}px "MC Title", "MC Title Alt", monospace`; ctx.textAlign = 'center';
  ctx.fillStyle = '#000'; ctx.fillText(W.text, VIEW.w / 2 + 4, VIEW.h * 0.32 + 4); ctx.fillStyle = W.text === 'DUCK!' ? '#ff4a3a' : '#ffd23a'; ctx.fillText(W.text, VIEW.w / 2, VIEW.h * 0.32);
  ctx.restore();
});
// (every game) the light cracking out of him, and the white flash at the end
B12.glow.push(function ovDeathRays14(ox, oy, glow) {
  const b = Game.mobs.find(q => q.type === 'overlord' && q.dying != null && !q.dead);
  if (b) {
    const k = Math.min(1, b.dying / 4.3), x = ox + (b.x + b.w / 2) * TILE, y = oy + (b.y + b.h * 0.45) * TILE, n = 5 + Math.floor(k * 11), L = TILE * (6 + k * 26);
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + b.dying * (0.4 + i % 3 * 0.15), w = 0.05 + 0.04 * Math.sin(Game.time * 9 + i);
      ctx.fillStyle = `rgba(255,${200 + Math.round(55 * k)},${120 + Math.round(120 * k)},${0.25 + 0.5 * k})`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - w) * L, y + Math.sin(a - w) * L); ctx.lineTo(x + Math.cos(a + w) * L, y + Math.sin(a + w) * L); ctx.fill();
    }
    glow(x, y, TILE * (4 + k * 10), '255,220,160', 0.4 + 0.5 * k);
    if (b.dying > 4.15) Game.ovFlash14 = 1;
  }
});
B12.post.push(function ovFlash14() {
  if (!(Game.ovFlash14 > 0)) return;
  ctx.fillStyle = `rgba(255,250,235,${Math.min(1, Game.ovFlash14)})`; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  Game.ovFlash14 -= FRAME_DT * 0.7;
});
// ---- what he looks like: THE OVERLORD is a dragon ----
// a long neck and tail that swing, a head with a jaw that opens (fire glows inside when he
// breathes or calls things down), two great wings, clawed legs, a chest of molten scales.
// He is drawn like the other monsters: into a pixel buffer at 1 grid pixel, then blown up.
const DRAGON14 = { o: '#0c0306', b: '#1e0a10', B: '#36121a', h: '#5a2026', H: '#7a2e2e', belly: '#c4521e', bellyHi: '#ff9a32', bellyDk: '#7a2410', bone: '#e2d4b4', boneDk: '#a89878', m: '#6e1018', m2: '#962026', wb: '#1a0508', fire: '#ff7a1a', fireHi: '#ffe08a' };
const DRAGON_HEAD14 = [
  '...RRRRRR...............',
  '.RRrrrrrrRRR............',
  'RRrrrrrrrrrRRRR.........',
  'RrrrbbbbbrrcrrRRRRR.....',
  'RrrbYYEYbrrrrrrrrrRRRR..',
  'Rrrrbbbbrrrrrcrrrrrrrnr.',
  'RRrrrrrrrrrrrrrrrrrrrrrr',
  '.RRMMMMMMMMMMMMMMMMMMMR.',
  '...t.t.t.t.t.t.t.t.t....',
];
const DRAGON_JAW14 = [
  '...t.t.t.t.t.t.t.t...',
  'RMMMMMMMMMMMMMMMMMRR.',
  'RRrrrrrrrrrrrrrrRR...',
  '.RRrrrcrrrrrrrRR.....',
  '..RRRRRRRRRRRR.......',
];
const DRAGON_PAL14 = { R: '#36121a', r: '#5a2026', b: '#14060a', Y: '#ffd23a', E: '#fff8c0', n: '#12040a', M: '#2a0408', t: '#f4ead2', c: '#ff8a1a' };
// a tube (neck, tail): disks along points, outlined, shaded on top, belly plates underneath
function tube14(b, pts, C, belly) {
  for (const p of pts) disk14(b, p[0], p[1], p[2] + 1, p[2] + 1, C.o);
  for (const p of pts) disk14(b, p[0], p[1], p[2], p[2], C.b);
  for (const p of pts) disk14(b, p[0] - p[2] * 0.15, p[1] - p[2] * 0.3, p[2] * 0.72, p[2] * 0.6, C.B);
  for (const p of pts) if (p[2] > 2) disk14(b, p[0] - p[2] * 0.2, p[1] - p[2] * 0.5, p[2] * 0.4, p[2] * 0.3, C.h);
  if (belly) pts.forEach((p, i) => { if (p[2] > 2.5) { disk14(b, p[0], p[1] + p[2] * 0.45, p[2] * 0.62, p[2] * 0.45, i % 2 ? C.belly : C.bellyDk); } });
}
function spikes14(b, pts, C, every, size) {
  for (let i = 0; i < pts.length; i += every) {
    const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], a = Math.atan2(q[1] - p[1], q[0] - p[0]) - Math.PI / 2, s = size * Math.min(1, p[2] / 5);
    if (s < 1.2) continue;
    const bx = p[0] + Math.cos(a) * p[2], by = p[1] + Math.sin(a) * p[2];
    const tx = bx + Math.cos(a - 0.5) * s * 1.6, ty = by + Math.sin(a - 0.5) * s * 1.6;
    poly14(b, [bx - Math.cos(a + Math.PI / 2) * s * 0.5 - 1, by - Math.sin(a + Math.PI / 2) * s * 0.5 - 1, tx, ty, bx + Math.cos(a + Math.PI / 2) * s * 0.5 + 1, by + Math.sin(a + Math.PI / 2) * s * 0.5 + 1], C.o);
    poly14(b, [bx - Math.cos(a + Math.PI / 2) * s * 0.5, by - Math.sin(a + Math.PI / 2) * s * 0.5, tx, ty, bx + Math.cos(a + Math.PI / 2) * s * 0.5, by + Math.sin(a + Math.PI / 2) * s * 0.5], C.boneDk);
  }
}
// a leg: thigh, shin, a foot with three claws. ang: how far it swings forward
function dragonLeg14(b, x, y, ang, C, big, curl) {
  const L1 = big ? 9 : 7, L2 = big ? 9 : 8, w = big ? 5 : 4;
  const kx = x + Math.sin(ang) * L1, ky = y + Math.cos(ang) * L1;
  const a2 = ang - 0.9 - curl * 0.8, fx = kx + Math.sin(a2) * L2, fy = ky + Math.cos(a2) * L2;
  line14(b, x, y, kx, ky, C.o, w + 2); line14(b, kx, ky, fx, fy, C.o, w);
  line14(b, x, y, kx, ky, C.b, w); line14(b, kx, ky, fx, fy, C.b, w - 2);
  disk14(b, x, y, w * 0.9 + 1, w * 0.9 + 1, C.o); disk14(b, x, y, w * 0.9, w * 0.9, C.B); disk14(b, x - 1, y - 1, w * 0.5, w * 0.5, C.h);
  for (let k = -1; k <= 1; k++) { const ca = a2 - 0.6 + k * 0.45 - curl * 0.6; line14(b, fx, fy, fx + Math.sin(ca) * 4, fy + Math.cos(ca) * 4, C.bone, 1); }
}
MOB_DRAW.overlord = (g, m, u, eyes) => {
  const C = DRAGON14, t = Game.time, mv = m.move, mt = m.moveT || 0, ph = m.phase || 1;
  const head = part14('dragon.head', DRAGON_HEAD14, DRAGON_PAL14, { flat: 'YEcMt', ol: C.o }), jawP = part14('dragon.jaw', DRAGON_JAW14, DRAGON_PAL14, { flat: 'cMt', ol: C.o });
  const cast = mv === 'barrage' || mv === 'meteors' || mv === 'nova' || mv === 'summon' || mv === 'pillars' || mv === 'sweep' || mv === 'storm' || mv === 'chains' || mv === 'scythes';
  const roar = mv === 'rage' || mv === 'intro' || (m.dying != null);
  const dash = mv === 'charge' && mt > 0.3 || (mv === 'blink' && mt > 0.35 && !m.dived);
  const slamUp = mv === 'slam' && !m.slammed, slamDown = mv === 'slam' && m.slammed;
  // the wing beat: faster when he dashes, wings folded back in a dash
  const flapSp = dash ? 9 : roar ? 2 : cast ? 4.2 : 3.4;
  const flap = Math.sin(t * flapSp + 0.3);
  let wingA = dash ? 0.35 : slamUp ? 1.65 : slamDown ? -0.4 : roar ? 1.45 + flap * 0.2 : 1.0 + flap * 0.85, fold = dash ? 0.7 : 0;
  if (mv === 'scythes' && mt < 0.55) wingA = 1.6;                                // wings up... and flung forward
  const bob = (dash ? 0 : -flap * 2);
  // the jaw: open to breathe and call fire, wide to roar
  const jaw = roar ? 0.75 + Math.sin(t * 20) * 0.05 : cast ? 0.5 + Math.sin(t * 9) * 0.1 : dash ? 0.25 : 0.08 + Math.max(0, Math.sin(t * 0.9)) * 0.08;
  // the neck: from the chest to the head; reared up to cast, thrust forward in a dash
  const rear = roar ? 1 : cast ? 0.55 : 0, thrust = dash ? 1 : 0;
  const sway = Math.sin(t * 1.7) * 2;
  const nx0 = 6, ny0 = -6, hx = 26 + thrust * 10 - rear * 4, hy = -20 - rear * 8 + thrust * 12 + sway * 0.5;
  const glow = (ph >= 3 ? 1 : ph >= 2 ? 0.7 : 0.45) + 0.25 * Math.sin(t * 6);
  const Z = 1.5;   // he is drawn with chunkier pixels than the small monsters
  rig14(g, u * Z, 260, 210, 120, 110, b => {
    b.translate(-10, bob);
    // ---- the far wing (darker), behind everything ----
    b.save(); b.translate(-4, -12); b.scale(-1, 1); DK14 = 0.55;
    wing14(b, 62, wingA + 0.3, { m: C.m, m2: C.m2, b: C.wb, ol: C.o }, { back: [26, 12], fingers: 4, spread: 1.45, fold, bw: 3, claw: C.bone });
    DK14 = 0; b.restore();
    // ---- the far legs ----
    const legA = slamDown ? 0.1 : dash ? -1.1 : slamUp ? 0.6 : 0.25 + Math.sin(t * 1.3) * 0.1, curl = dash || slamUp ? 1 : 0;
    DK14 = 0.6; dragonLeg14(b, -18, 6, legA - 0.15, C, true, curl); dragonLeg14(b, 4, 6, legA + 0.2, C, false, curl); DK14 = 0;
    // ---- the tail: waves behind him ----
    const tail = [];
    for (let i = 0; i < 14; i++) {
      const k = i / 13, x = -22 - i * 5 * (dash ? 1.1 : 1), y = 2 + i * (dash ? 0 : 1.2) + Math.sin(t * 2.6 - i * 0.55) * (1 + i * 0.45) * (dash ? 0.3 : 1);
      tail.push([x, y, 7 - k * 5.6]);
    }
    const tip = tail[tail.length - 1], pre = tail[tail.length - 2], ta = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]);
    // the spade at the end of the tail
    const sp = (dx, dy) => [tip[0] + Math.cos(ta) * dx - Math.sin(ta) * dy, tip[1] + Math.sin(ta) * dx + Math.cos(ta) * dy];
    const spade = [sp(-1, -4), sp(6, 0), sp(-1, 4), sp(1, 0)].flat();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) poly14(b, spade.map((v, i) => v + (i % 2 ? dy : dx)), C.o);
    poly14(b, spade, C.B);
    tube14(b, tail.slice().reverse(), C, true);
    spikes14(b, tail, C, 2, 3);
    // ---- the body ----
    const body = [[-20, 2, 10], [-14, 1, 12], [-7, 0, 13], [0, -1, 13], [6, -2, 11.5]];
    tube14(b, body, C, true);
    // belly plates: molten
    for (let i = 0; i < 6; i++) { const x = -18 + i * 5, y = 8 + Math.abs(i - 2.5) * -0.6 + (i > 3 ? -1 : 0); px14(b, x, y, 4, 2, i % 2 ? C.belly : C.bellyHi); px14(b, x, y + 2, 4, 1, C.bellyDk); }
    // the molten core showing through the chest scales
    b.globalAlpha = Math.max(0.2, Math.min(1, glow)); disk14(b, 2, 2, 4, 3, C.fireHi); b.globalAlpha = 1;
    for (const [x, y] of [[-9, -3], [-4, 3], [-14, 0], [1, -5]]) { line14(b, x, y, x + 3, y + 2, ph >= 2 ? C.fire : C.bellyDk, 1); }
    spikes14(b, body, C, 1, 4);
    // ---- the neck ----
    const neck = [];
    for (let i = 0; i <= 7; i++) {
      const k = i / 7, x = nx0 + (hx - nx0) * k, y = ny0 + (hy - ny0) * k - Math.sin(k * Math.PI) * (6 - thrust * 5 + rear * 3) + Math.sin(t * 1.7 + k * 2) * k * 1.5;
      neck.push([x, y, 7.5 - k * 3]);
    }
    tube14(b, neck, C, true);
    spikes14(b, neck, C, 1, 3);
    // ---- the head ----
    const last = neck[neck.length - 1], prev = neck[neck.length - 3];
    const headA = Math.max(-0.7, Math.min(0.7, Math.atan2(last[1] - prev[1], last[0] - prev[0]) * 0.5)) - rear * 0.35 + thrust * 0.15;
    b.save(); b.translate(last[0], last[1]); b.rotate(headA);
    // horns, swept back
    for (const [ox, oy, len, dark] of [[2, -6, 15, true], [5, -6, 13, false]]) {
      const pts = [];
      for (let i = 0; i <= len; i++) { const k = i / len; pts.push([ox - i * 0.95, oy - Math.sin(k * 2.2) * 5 - k * 2, Math.max(0.6, 2.4 * (1 - k))]); }
      for (const p of pts) disk14(b, p[0], p[1], p[2] + 1, p[2] + 1, C.o);
      for (const p of pts) disk14(b, p[0], p[1], p[2], p[2], dark ? C.boneDk : C.bone);
      if (ph >= 2) { const tp = pts[pts.length - 1]; flame14(b, tp[0], tp[1] - 1, 1.5, 3 + (ph >= 3 ? 2 : 0), t + ox, FLAME_FIRE14, 1); }
    }
    // fire glowing in the open mouth
    if (jaw > 0.2) { poly14(b, [2, 3, 22, 1 + jaw * 3, 20, 3 + jaw * 12], C.fire); poly14(b, [4, 3, 16, 2 + jaw * 3, 14, 3 + jaw * 7], C.fireHi); }
    drawP14(b, jawP, 3, 3, 1, 1, 1, jaw);
    drawP14(b, head, 0, 0, 2, 6, 1);
    // smoke and sparks from the nostril
    if (Math.floor(t * 4) % 3 === 0) px14(b, 21 + (t * 8 % 3), -2 - (t * 6 % 4), 1, 1, '#5a4040');
    b.restore();
    // ---- near legs ----
    dragonLeg14(b, -15, 7, legA, C, true, curl); dragonLeg14(b, 7, 7, legA + 0.35, C, false, curl);
    // ---- the near wing ----
    b.save(); b.translate(-2, -11); b.scale(-1, 1);
    wing14(b, 64, wingA, { m: C.m, m2: C.m2, b: C.wb, ol: C.o }, { back: [26, 13], fingers: 4, spread: 1.45, fold, bw: 3, claw: C.bone });
    b.restore();
  });
  // the eye glows (where the head is)
  if (m.dying == null) {
    const ex = hx - 10 + 6, ey = hy - 4 + bob;
    eyes.push({ x: ex * u * 1.5, y: ey * u * 1.5, s: 3 * u, c: '255,230,80' });
  }
};
// his glow, and in phase 3 a heat haze of red over everything
B12.glow.push(function ovGlow14(ox, oy, glow) {
  const b = ovBoss14(); if (!b) return;
  const x = ox + (b.x + b.w / 2) * TILE, y = oy + (b.y + b.h * 0.5) * TILE;
  glow(x, y, TILE * (b.phase >= 3 ? 9 : 7), '255,80,20', 0.35 + 0.1 * Math.sin(Game.time * 4));
  glow(x, oy + (b.y + 0.6) * TILE, TILE * 3, '255,160,40', 0.5);
});
B12.post.push(function ovTint14() {
  const b = ovBoss14(); if (!b || Game.screen === 'title' || !bossOnMyScreen(b)) return;
  if (b.phase >= 3) { ctx.fillStyle = `rgba(120,0,0,${0.1 + 0.05 * Math.sin(Game.time * 3)})`; ctx.fillRect(0, 0, VIEW.w, VIEW.h); }
});

// ---- HIS MUSIC ----
// (his song speeds up when he's enraged)
B12.updaters.push(function ovMusicRate14() {
  const b = ovBoss14(); if (!bossAudio || !bossAudio.dataset || !/the_overlord/.test(bossAudio.dataset.src || '')) return;
  const want = b && b.phase >= 3 ? 1.1 : 1;
  if (Math.abs(bossAudio.playbackRate - want) > 0.001) { try { bossAudio.preservesPitch = true; bossAudio.playbackRate = want; } catch (e) { } }
});
// THE OVERLORD: driving drums, a growling bass in D, brass stabs; his crown lights a lead line,
// and when he is enraged a choir comes in and it all speeds up
const OvMusic14 = { on: false, out: null, rev: null, next: 0, step: 0, vol: 0 };
const OV_ROOTS14 = [73.42, 58.27, 65.41, 55.0];   // D, Bb, C, A
const OV_BASS14 = [0, 0, 12, 0, 3, 0, 1, 0, 0, 0, 12, 0, 7, 3, 1, 0];
const OV_KICK14 = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0];
function ovMusicStart14() {
  if (!actx || OvMusic14.out) { OvMusic14.on = true; return; }
  const out = actx.createGain(); out.gain.value = 0; out.connect(actx.destination);
  const rev = underReverb14(), wet = actx.createGain(); wet.gain.value = 0.35; rev.connect(wet); wet.connect(out);
  Object.assign(OvMusic14, { out, rev, on: true, next: actx.currentTime + 0.1, step: 0 });
}
function ovTone14(t, hz, dur, type, vol, cut, toRev) {
  const M = OvMusic14, o = actx.createOscillator(), f = actx.createBiquadFilter(), g = actx.createGain();
  o.type = type; o.frequency.value = hz; f.type = 'lowpass'; f.frequency.setValueAtTime(cut * 2.2, t); f.frequency.exponentialRampToValueAtTime(cut, t + dur * 0.6); f.Q.value = 2;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(M.out); if (toRev) g.connect(M.rev); o.start(t); o.stop(t + dur + 0.05);
}
function updateOvMusic14(dt) {
  if (!actx || actx.state !== 'running') return;
  const b = ovBoss14(), want = !!(b && b.dying == null && Game.screen !== 'title' && bossOnMyScreen(b) && b.move !== 'intro') && !!(bossAudio && bossAudio.error);   // (only if his song file is missing)
  if (want && !OvMusic14.on) ovMusicStart14();
  const M = OvMusic14; if (!M.out) return;
  M.vol = approach(M.vol, want ? musicVolume() : 0, dt * (want ? 1.5 : 0.5)); M.out.gain.value = M.vol;
  if (!want && M.vol < 0.002) { M.on = false; return; }
  if (!M.on) return;
  const ph = b ? b.phase || 1 : 1, sixteenth = ph >= 3 ? 0.088 : 0.1, now = actx.currentTime;
  if (M.next < now - 0.5) M.next = now + 0.05;
  while (M.next < now + 0.2) {
    const t = M.next, s = M.step % 16, bar = Math.floor(M.step / 16), root = OV_ROOTS14[bar % 4];
    if (OV_KICK14[s] || (ph >= 3 && s % 4 === 0)) uKick14(M.out, t, 0.5, 150, 42);
    if (s === 4 || s === 12) { uNoiseHit14(M.out, t, 0.35, 'bandpass', 1800, 0.18); ovTone14(t, 185, 0.12, 'triangle', 0.18, 900); }
    if (s % 2 === 1) uNoiseHit14(M.out, t, ph >= 2 ? 0.1 : 0.06, 'highpass', 7000, 0.04);
    ovTone14(t, root * Math.pow(2, OV_BASS14[s] / 12), sixteenth * 0.95, 'sawtooth', 0.16, 420);
    if (s === 0 || s === 6 || s === 10) for (const iv of [0, 3, 7, 12]) ovTone14(t, root * 2 * Math.pow(2, iv / 12), 0.32, 'sawtooth', 0.045, 1400, true);
    if (ph >= 2) { const arp = [0, 7, 12, 15, 12, 7, 3, 7][s % 8]; ovTone14(t, root * 4 * Math.pow(2, arp / 12), sixteenth * 0.8, 'square', 0.03, 2600, true); }
    if (ph >= 3 && s === 0) for (const iv of [0, 3, 7]) { ovTone14(t, root * 4 * Math.pow(2, iv / 12), sixteenth * 16, 'triangle', 0.05, 1800, true); }
    M.next += sixteenth; M.step++;
  }
}

// ---- /summon overlord, and the Mysterious Item he drops ----
COMMANDS.summon && (function () {
  const run = COMMANDS.summon.run;
  COMMANDS.summon.run = (a) => {
    const t = a.join('').toLowerCase();
    if (t === 'overlord' || t === 'theoverlord') {
      if (!onUnder14()) return cmdError('The Overlord can only be called in the Underworld (/underworld).');
      if (ovBoss14()) return cmdError('He is already here.');
      const p = Game.player, x = Math.floor(p.x + p.w / 2) + 4, y = Math.floor(p.y + p.h) - 3;
      if (netIsClient()) return cmdError('Only the host can do that.');
      netFxCapture(x, y, () => spawnOverlord14(x, y, 'host')); return;
    }
    return run(a);
  };
})();
// the Overlord drops it
{
  const odOrig = MOB_DEATH12.overlord;
  MOB_DEATH12.overlord = function (m) {
    odOrig(m);
    if (Game.flags.mystDropped) return;   // (1.7) only the first time he's beaten: you get one try at her
    Game.flags.mystDropped = true;
    const d = spawnDrop(MYST_ITEM, 1, m.x + m.w / 2, m.y + m.h / 2); if (d) { d.vx = 0; d.vy = -6; }
    eventMessage('Something cold falls from the Overlord\'s ashes... a Mysterious Item.', '#c070ff');
  };
}

// ---- HARDMODE (a rematch after the Slayer): faster in everything (index.html, HM_BOSS22), and every few
// seconds a shower of meteors walks across the ground toward you ----
BOSSES.overlord.hardmode = function (m, dt, p) {
  if (!m.arena) return;
  m.hmT22 = (m.hmT22 ?? 5) - dt; if (m.hmT22 > 0) return;
  m.hmT22 = 5.2;
  const pcx = p.x + p.w / 2, from = m.arena.floor - 22, side = Math.random() < 0.5 ? -1 : 1;
  for (let i = 0; i < 5; i++) { const x = pcx + side * (8 - i * 4) + (Math.random() - 0.5) * 1.5; ovSpawn14({ t: 'meteor', x: r1(x), gy: ovGround14(x, from), warn: 0.85 + i * 0.18, dir: -side, dmg: 13 }); }
  sfx('ov.warn', { x: pcx, y: p.y });
};
