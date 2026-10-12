'use strict';
// =============================================================================
// THE HOLLOW KNIGHT   (type 'hollowknight')
//   The Ancient Ruins' boss. Two phases of sword, shield, spears and summoned skeletons.
// =============================================================================
defineMob('hollowknight', {
  // ---- STATS ----
  stats: {
    name: 'The Hollow Knight', w: 1.7, h: 3.7, speed: 2.7, health: 520, hostile: true, boss: true, dmg: 9, kb: 0,
    custom: 'hollow', sunproof: true,
    loot: [[HOLLOW_BLADE, 1, 1, 1], [MANA_STAR, 1, 2, 1], [ANCIENT_PLATE, 6, 9, 1], [ANCIENT_METAL, 3, 5, 1], [HOLLOW_SIGNET, 1, 1, 0.35], [DIAMOND, 2, 4, 1], [GOLD, 5, 9, 1], [134, 6, 10, 1], [MANA_POTION, 2, 3, 1], [245, 1, 2, 0.6]],
    eye: [2, 0.17, '70,230,250'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // he fights in his hall
  // ---- AI ----
  // ---- VISUALS ----
  sprite: { w: 64, h: 72, frames: 14, fit: 1.0, cx: 26 },
  spriteFrame: (m) => {
    const mv = m.move, w2 = walkFrame12(m, 2);
    if (m.phase < 2) { if (mv === 'wind') return 3; if (mv === 'slash') return 4; if (mv === 'block' || mv === 'bash') return 5; if (mv === 'break' || mv === 'intro') return 6; if (mv === 'summon' || mv === 'rain') return 7; if (mv === 'quake') return m.moveT < 0.8 ? 5 : 4; return w2; }
    if (mv === 'wind' || mv === 'leap' || mv === 'dashcut') return 11; if (mv === 'slash') return 12; if (mv === 'quake') return m.moveT < 0.55 ? 11 : 12; if (mv === 'summon' || mv === 'break' || mv === 'rain') return 13; return 8 + w2;
  },
  // ---- SOUNDS ----
  sounds: {
    say: { files: terraria_('dd2_javelin_throwers_taunt', 3), vol: 0.85, pitch: [0.6, 0.7], cat: 'volCreatures', synth: 'growl' },
    hurt: { files: ['terraria/npc_hit_4', ...terraria_('dd2_javelin_throwers_hurt', 3)], vol: 0.7, pitch: [0.7, 0.82], cat: 'volCreatures', synth: 'hit' },
    death: { files: terraria_('dd2_javelin_throwers_death', 3), vol: 1, pitch: [0.55, 0.6], cat: 'volCreatures', synth: 'death' },
    step: { files: n_('mob/irongolem/hit', 4), vol: 0.3, pitch: [0.4, 0.5], cat: 'volCreatures' },
    'hk.wake': { files: ['terraria/roar_0'], vol: 0.8, pitch: [0.62, 0.66], cat: 'volCreatures' },
    'hk.swing': { files: terraria_('dd2_monk_staff_swing', 4), vol: 0.9, pitch: [0.7, 0.82], cat: 'volCreatures' },
    'hk.wave': { files: terraria_('dd2_sonic_boom_blade_slash', 3), vol: 0.85, pitch: [0.75, 0.9], cat: 'volCreatures' },
    'hk.clang': { files: terraria_('tink', 3), vol: 0.9, pitch: [0.55, 0.7], cat: 'volCreatures' },
    'hk.slam': { files: terraria_('dd2_monk_staff_ground_impact', 3), vol: 1, pitch: [0.6, 0.72], cat: 'volCreatures' },
    'hk.spear': { files: terraria_('dd2_wither_beast_crystal_impact', 3), vol: 0.7, pitch: [0.85, 1.1], cat: 'volCreatures' },
    'hk.shatter': { files: ['terraria/shatter'], vol: 1, pitch: [0.7, 0.75], cat: 'volCreatures' },
    'hk.dash': { files: terraria_('dd2_ghastly_glaive_pierce', 3), vol: 0.9, pitch: [0.75, 0.85], cat: 'volCreatures' },
    'hk.mark': { files: terraria_('dd2_lightning_aura_zap', 4), vol: 0.45, pitch: [0.8, 0.95], cat: 'volCreatures' },
    'hk.blade': { files: terraria_('dd2_ghastly_glaive_impact_ghost', 3), vol: 0.7, pitch: [0.8, 1], cat: 'volCreatures' },
    'hk.summon': { files: terraria_('dd2_dark_mage_summon_skeleton', 3), vol: 0.9, pitch: [0.7, 0.8], cat: 'volCreatures' },
    'hk.rise': { files: ['terraria/dd2_skeleton_summoned'], vol: 0.7, pitch: [0.85, 1], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
  onDeath: (m) => {
    bossReward(m, 'hollow'); if (Game.boss === m) Game.boss = null;
    const f = Game.flags; if (f) { f.ruinDone = f.ruinDone || []; if (!f.ruinDone.includes(m.ruin)) f.ruinDone.push(m.ruin); }
    for (const q of Game.mobs) if (q.type === 'ruinskeleton' && q.guardian) { q.dead = true; deathPuff(q.x + q.w / 2, q.y + q.h / 2, ['#d6cfb4', '#8e988a']); }
    eventMessage('The Hollow Knight crumbles. Its long watch is over.', '#6fe8ff'); sfx('toast.challenge'); stopBossMusic(true);
    Game.shake = Math.max(Game.shake, 0.8);
  },
  // ---- BOSS ----
  boss: {
    name: 'The Hollow Knight', music: 'Sounds/music/hollow_knight.mp3',
    home: (m) => m.arena ? { x: (m.arena.x0 + m.arena.x1) / 2, y: m.arena.floor - 6 } : { x: m.x, y: m.y },
    chase: { x: 40, y: 22 }, summonAdv: 'ruins', killAdv: 'hollow', dmgMult: 1.0,
    leaveMsg: 'The Hollow Knight sinks back onto its throne, waiting.', color: '#6fe8ff',
  },
  bossAI: (m, dt, p) => hollowAI(m, dt, p),
});

// ---- AI ----
function spawnHollow(R) {
  const ar = R.arena, m = new Mob('hollowknight', ar.spawn[0] + 0.5 - 0.85, ar.spawn[1] + 1 - 3.7);
  Object.assign(m, { arena: ar, phase: 1, move: 'intro', moveT: 0, t: 0, shieldHp: 170, shieldUp: false, bossInvuln: 2.2, state: 'hostile', guardian: true, ruin: R.id, cd: 1, facingDir: -1, summonCd: 8 });
  Game.mobs.push(m); bossSpawned(m);
  sfx('hk.wake', { x: m.x, y: m.y }); sfx('hollowknight.say', { x: m.x, y: m.y, vol: 1.3 }); screenShake(0.9); flashDamage();
  eventMessage('The Hollow Knight rises from its throne!', '#6fe8ff'); bigTitle12('The Hollow Knight', 'it has guarded this place for ages', '#6fe8ff');
  for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, sp = 2 + Math.random() * 6; Game.particles.push({ x: m.x + m.w / 2, y: m.y + m.h * 0.7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 0.8 + Math.random() * 0.5, age: 0, size: 0.1, color: i % 2 ? '#6fe8ff' : '#5a6a7a', gravity: 4 }); }
  Adv.grant('ruins');
}
function skelAt12(x, y) {
  const m = new Mob('ruinskeleton', x + 0.5 - 0.325, y + 1 - 1.9); m.guardian = true; m.state = 'hostile'; Game.mobs.push(m);
  for (let i = 0; i < 12; i++) Game.particles.push({ x: x + 0.5 + (Math.random() - 0.5), y: y + 0.9, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 3, life: 0.7, age: 0, size: 0.1, color: i % 2 ? '#8e988a' : '#d6cfb4', gravity: 8 });
  sfx('dig.stone', { x, y, vol: 1.2 }); return m;
}
// ---- THE HOLLOW KNIGHT's moves (rebuilt in 1.2.1) ----
//   PHASE 1 (shield):  walk -> 3-cut combo (the last cut throws a crescent SOUL WAVE along the floor: jump it!)
//                      block (front hits barely scratch it) -> shield BASH (dust trail) -> SHIELD QUAKE: slams the
//                      shield down and glowing cracks race along the floor, then crystal SPEARS burst up (move!)
//   PHASE 2 (shield breaks, faster, angrier, flames orbit it):
//                      fast combos with soul waves - DASH CUT: it blinks behind you leaving afterimages and cuts
//                      - SPECTRAL BLADE RAIN: swords light up across the arena, then fall - LEAP SLAM: two
//                      shockwaves and rubble from the ceiling - calls skeletons - QUAKE both ways
B12.hk = { spikes: [], blades: [], ghosts: [] };
function hollowAI(m, dt, p) {
  const A = m.arena, mcx = m.x + m.w / 2, pcx = p.x + p.w / 2, dx = pcx - mcx, dist = Math.abs(dx), dir = dx > 0 ? 1 : -1;
  m.t += dt; m.moveT += dt; m.bossInvuln = Math.max(0, (m.bossInvuln || 0) - dt); m.cd = Math.max(0, (m.cd || 0) - dt); m.summonCd = Math.max(0, m.summonCd - dt); m.specialCd = Math.max(0, (m.specialCd == null ? 5 : m.specialCd) - dt);
  const p2 = m.phase >= 2, spd = p2 ? 5.0 : 2.7, dmg = p2 ? 13 : 9;
  let tv = 0;
  const go = (mv) => { m.move = mv; m.moveT = 0; m.hitDone = false; };
  const nSkel = () => Game.mobs.filter(q => q.type === 'ruinskeleton' && q.dying == null).length;
  const soulWave = () => {   // a crescent that skims the floor
    const y = A.floor - 1.1;
    spawnBolt12({ from: 'mob', kind: 'ksoul', x: mcx + m.facingDir * 1.6, y, vx: m.facingDir * (p2 ? 14 : 11), vy: 0, dmg: Math.round(dmg * 0.9), r: 0.62, life: 1.5, trail: true, p2 });
    sfx('hk.wave', { x: mcx, y });
  };
  const swing = (reach, last) => {
    if (m.hitDone) return; m.hitDone = true;
    const fx = mcx + m.facingDir * reach * 0.5;
    sfx('hk.swing', { x: mcx, y: m.y + 1.5, pitch: p2 ? 0.85 : 0.72 });
    for (let i = 0; i < 16; i++) { const a = -1.3 + i * 0.17; Game.particles.push({ x: mcx + m.facingDir * (0.8 + Math.cos(a) * 2.2), y: m.y + 1.7 + Math.sin(a) * 1.8, vx: m.facingDir * 5, vy: Math.sin(a) * 1.5, life: 0.3, age: 0, size: 0.16, color: p2 ? (i % 2 ? '#ff7a5a' : '#ffd05a') : (i % 2 ? '#bff6ff' : '#5af0ff'), gravity: 0, kind: 'star' }); }
    if (Math.abs(p.x + p.w / 2 - fx) < reach * 0.5 + p.w / 2 && p.y + p.h > m.y + 0.6 && p.y < m.y + m.h && Math.sign(dx) === m.facingDir) bossHitPlayer(dmg, mcx, p, 0, { kb: [10, 5], iframes: 0.35 });
    if (last) soulWave();
  };
  if (!p2 && (m.health <= m.maxHealth * 0.5 || m.shieldHp <= 0) && m.move !== 'break') { go('break'); m.shieldUp = false; }
  switch (m.move) {
    case 'intro': if (m.moveT > 1.7) go('walk'); break;
    case 'break':
      if (!m.brokeFx) {
        m.brokeFx = true; m.phase = 2; m.bossInvuln = 2; screenShake(1.2); flashDamage(); sfx('hk.shatter', { x: mcx, y: m.y + 1 }); sfx('hollowknight.say', { x: m.x, y: m.y, vol: 1.4, pitch: 0.62 });
        eventMessage("The Hollow Knight's shield shatters! Its eyes burn red...", '#ff7a5a'); flashAt(mcx, m.y + 1.8, 9, '255,90,60', 0.4);
        for (let i = 0; i < 44; i++) { const a = Math.random() * 6.28, sp = 3 + Math.random() * 8; Game.particles.push({ x: mcx - m.facingDir * 1.4, y: m.y + 1.8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 1, age: 0, size: 0.14, color: i % 3 ? '#72879c' : '#3fd8ee', gravity: 9 }); }
        for (let i = 0; i < 36; i++) { const a = i / 36 * 6.28; Game.particles.push({ x: mcx, y: m.y + 1.8, vx: Math.cos(a) * 9, vy: Math.sin(a) * 6, life: 0.6, age: 0, size: 0.12, color: '#ff7a5a', gravity: 0, kind: 'star' }); }
        for (const sx of [A.x0 + 5, A.x1 - 6]) skelAt12(sx, A.floor - 1);
      }
      if (m.moveT > 1.6) { go('walk'); m.cd = 0.3; m.specialCd = 1.5; }
      break;
    case 'walk': {
      m.facingDir = dir; tv = dir * spd;
      if (dist < (p2 ? 2.4 : 2.8)) tv = 0;
      if (m.cd <= 0) {
        const r = Math.random();
        if (!p2) {
          if (dist < 4) { if (r < 0.4) { m.combo = 2 + (Math.random() < 0.5 ? 1 : 0); go('wind'); } else if (r < 0.58 && m.shieldHp > 0) go('block'); else if (r < 0.78) go('bash'); else go('quake'); }
          else if (m.specialCd <= 0) { if (r < 0.6) go('quake'); else go('bash'); m.specialCd = 5; }
        } else {
          if (m.summonCd <= 0 && nSkel() < 3) { go('summon'); m.summonCd = 14; }
          else if (m.specialCd <= 0) { const r2 = Math.random(); if (r2 < 0.3) go('dashcut'); else if (r2 < 0.58) go('rain'); else if (r2 < 0.82 && dist > 4) go('leap'); else go('quake'); m.specialCd = 4.5; }
          else if (dist < 4.2) { m.combo = 2 + (Math.random() < 0.6 ? 1 : 0); go('wind'); }
        }
      }
      break;
    }
    case 'wind': m.facingDir = dir; tv = 0; if (m.moveT >= (p2 ? 0.26 : 0.55)) { go('slash'); m.vx = dir * (p2 ? 8 : 4.5); m.kbTimer = 0.12; } break;
    case 'slash': swing(p2 ? 4.5 : 3.8, m.combo === 1); if (m.moveT > 0.26) { if (--m.combo > 0) go('wind'); else { go('walk'); m.cd = p2 ? 0.45 : 1.2; } } break;
    case 'block': m.shieldUp = true; m.facingDir = dir; tv = dir * spd * 0.35; if (m.moveT > 2.0) { if (dist < 4) go('bash'); else { go('walk'); m.cd = 0.4; } } break;
    case 'bash':
      m.facingDir = dir;
      if (m.moveT < 0.35) tv = 0;
      else {
        tv = m.facingDir * 10.5;
        if (Math.random() < dt * 40 * particleMul()) Game.particles.push({ x: mcx - m.facingDir * 0.8, y: m.y + m.h - 0.1, vx: -m.facingDir * 2, vy: -1.5, life: 0.5, age: 0, size: 0.16, color: 'rgba(150,170,180,0.6)', gravity: -0.5, mist: true });
        if (!m.hitDone && dist < 2.4) { m.hitDone = true; bossHitPlayer(dmg + 2, mcx, p, 0, { kb: [13, 6], iframes: 0.4 }); screenShake(0.5); sfx('hk.clang', { x: mcx, y: m.y + 2, pitch: 0.5 }); sfx('fall.big', { x: mcx, y: m.y + 3, pitch: 0.7 }); }
      }
      if (m.moveT > 1.0) { go('walk'); m.cd = 1.2; }
      break;
    case 'quake': {   // glowing cracks run along the floor, then crystal spears burst up
      m.facingDir = dir; tv = 0;
      const wt = p2 ? 0.55 : 0.8;
      if (m.moveT >= wt && !m.hitDone) {
        m.hitDone = true; screenShake(0.7); sfx('hk.slam', { x: mcx, y: A.floor }); sfx('hk.clang', { x: mcx, y: A.floor, pitch: 0.45 });
        const dirs = p2 ? [-1, 1] : [dir];
        for (const d of dirs) for (let i = 0; i < (p2 ? 6 : 8); i++) { const x = mcx + d * (2 + i * 1.5); if (x > A.x0 + 0.5 && x < A.x1 - 0.5) B12.hk.spikes.push({ x, t: -i * 0.09, dmg: Math.round(dmg * 0.95), up: false, hit: false }); }
        for (let i = 0; i < 14; i++) Game.particles.push({ x: mcx + (Math.random() - 0.5) * 2, y: A.floor - 0.1, vx: (Math.random() - 0.5) * 8, vy: -2 - Math.random() * 3, life: 0.5, age: 0, size: 0.13, color: i % 2 ? '#8e988a' : '#5af0ff', gravity: 10 });
      }
      if (m.moveT > wt + 0.7) { go('walk'); m.cd = 0.9; }
      break;
    }
    case 'dashcut': {   // blink behind you and cut
      m.facingDir = dir; tv = 0;
      if (m.moveT >= 0.42 && !m.hitDone) {
        m.hitDone = true;
        const ox = m.x, oy = m.y, nx0 = pcx + dir * 2.3, nx = Math.max(A.x0 + 1, Math.min(A.x1 - 1 - m.w, nx0 - m.w / 2));
        for (let i = 0; i < 7; i++) B12.hk.ghosts.push({ x: ox + (nx - ox) * i / 7, y: oy, facing: m.facingDir, age: -i * 0.02, frame: 12 });
        for (let i = 0; i < 24; i++) Game.particles.push({ x: ox + m.w / 2, y: oy + Math.random() * m.h, vx: (Math.random() - 0.5) * 3, vy: -1, life: 0.7, age: 0, size: 0.18, color: i % 2 ? 'rgba(255,90,60,0.7)' : 'rgba(20,10,20,0.8)', gravity: -0.4 });
        m.x = nx; m.vx = 0; m.facingDir = -dir; sfx('hollowknight.say', { x: nx, y: oy, pitch: 0.8, vol: 0.8 }); sfx('hk.dash', { x: nx, y: oy });
        m.combo = 1; m.hitDone = false; go('slash'); m.combo = 1;
      }
      break;
    }
    case 'rain': {   // spectral swords light up the floor, then fall
      tv = 0; m.facingDir = dir;
      if (m.moveT >= 0.5 && !m.hitDone) {
        m.hitDone = true; sfx('hollowknight.say', { x: mcx, y: m.y, pitch: 0.58, vol: 1.2 }); sfx('hk.mark', { x: mcx, y: m.y });
        const xs = [pcx, pcx - 3.2, pcx + 3.2, pcx - 6.4, pcx + 6.4, pcx + (Math.random() - 0.5) * 9];
        xs.forEach((x, i) => { if (x > A.x0 + 0.8 && x < A.x1 - 0.8) B12.hk.blades.push({ x, kind: 'sword', t: -i * 0.18, y: A.floor - 12, state: 'warn', dmg: Math.round(dmg * 0.9) }); });
      }
      if (m.moveT > 1.5) { go('walk'); m.cd = 0.8; }
      break;
    }
    case 'summon':
      tv = 0; m.facingDir = dir;
      if (m.moveT > 0.55 && !m.summoned) { m.summoned = true; sfx('hk.summon', { x: m.x, y: m.y }); sfx('hk.rise', { x: m.x, y: m.y }); for (const k of [-6, 0, 6]) { const sx = Math.max(A.x0 + 2, Math.min(A.x1 - 3, Math.floor(pcx + k))); skelAt12(sx, A.floor - 1); } screenShake(0.3); }
      if (m.moveT > 1.2) { m.summoned = false; go('walk'); m.cd = 0.6; }
      break;
    case 'leap':
      if (m.moveT < 0.4) { tv = 0; m.facingDir = dir; m.leapInit = false; }
      else {
        if (!m.leapInit) { m.leapInit = true; m.vy = -14; m.vx = dir * Math.min(10, dist * 1.4 + 2); m.kbTimer = 0.9; sfx('hollowknight.say', { x: m.x, y: m.y, pitch: 0.68 }); sfx('hk.dash', { x: m.x, y: m.y, pitch: 0.6 }); }
        if (m.onGround && m.moveT > 0.6) {
          screenShake(0.9); sfx('hk.slam', { x: mcx, y: m.y + 3.7, pitch: 0.55 }); sfx('fall.big', { x: mcx, y: m.y + 3.7, pitch: 0.5 }); sfx('hk.wave', { x: mcx, y: m.y + 3.7, pitch: 0.7 });
          const gy = Math.floor(m.y + m.h);
          for (const s2 of [-1, 1]) spawnBolt12({ from: 'mob', kind: 'ksoul', x: mcx + s2 * 1.4, y: A.floor - 1.1, vx: s2 * 12, vy: 0, dmg: Math.round(dmg * 0.9), r: 0.62, life: 1.6, trail: true, p2: true });
          for (let i = 0; i < 28; i++) { const s2 = i % 2 ? 1 : -1; Game.particles.push({ x: mcx + s2 * (0.6 + i * 0.1), y: m.y + m.h - 0.1, vx: s2 * (3 + Math.random() * 6), vy: -2 - Math.random() * 4, life: 0.6, age: 0, size: 0.14, color: i % 3 ? '#8e988a' : '#ff7a5a', gravity: 10 }); }
          for (let i = 0; i < 4; i++) { const x = A.x0 + 2 + Math.random() * (A.x1 - A.x0 - 4); B12.hk.blades.push({ x, kind: 'rock', t: -0.2 - i * 0.25, y: A.floor - 12, state: 'warn', dmg: Math.round(dmg * 0.6) }); }
          if (Math.abs(pcx - mcx) < 3.2 && p.onGround) bossHitPlayer(dmg, mcx, p, 0, { kb: [10, 7], iframes: 0.4 });
          go('walk'); m.cd = 0.7;
        }
      }
      break;
  }
  m.shieldUp = (m.move === 'block' || m.move === 'bash' || (m.move === 'quake' && !p2 && m.moveT < 0.8));
  m.blocking = m.shieldUp && !p2;
  if (m.x < A.x0 + 0.3) { m.x = A.x0 + 0.3; m.vx = Math.max(0, m.vx); } if (m.x + m.w > A.x1 - 0.3) { m.x = A.x1 - 0.3 - m.w; m.vx = Math.min(0, m.vx); }
  mobMove(m, tv, dt);
  if (p2 && Math.random() < dt * 20 * particleMul()) Game.particles.push({ x: m.x + m.w / 2 + (Math.random() - 0.5) * 1.4, y: m.y + 0.8 + Math.random() * 2.4, vx: 0, vy: -1.2, life: 0.7, age: 0, size: 0.1, color: Math.random() < 0.5 ? '#ff7a5a' : '#ffd05a', gravity: -0.6 });
  else if (!p2 && Math.random() < dt * 6 * particleMul()) Game.particles.push({ x: m.x + m.w / 2 + (Math.random() - 0.5) * 1.4, y: m.y + 1 + Math.random() * 2.4, vx: 0, vy: -0.8, life: 0.7, age: 0, size: 0.08, color: '#5af0ff', gravity: -0.4 });
}
// spears, falling swords and rubble, afterimages
B12.updaters.push(function hkSys12(dt, p) {
  const H = B12.hk; if (!H.spikes.length && !H.blades.length && !H.ghosts.length) return;
  const boss = Game.boss && Game.boss.type === 'hollowknight' ? Game.boss : null, floor = boss ? boss.arena.floor : null;
  for (let i = H.spikes.length - 1; i >= 0; i--) {
    const s = H.spikes[i]; s.t += dt;
    if (!s.up && s.t >= 0.5) {
      s.up = true; sfx('hk.spear', { x: s.x, y: floor });
      for (let k = 0; k < 8; k++) Game.particles.push({ x: s.x + (Math.random() - 0.5) * 0.6, y: floor - Math.random() * 2, vx: (Math.random() - 0.5) * 3, vy: -3 - Math.random() * 3, life: 0.5, age: 0, size: 0.1, color: k % 2 ? '#bff6ff' : '#3fd8ee', gravity: 9 });
      if (!Game.creative && !p.dead && Math.abs(p.x + p.w / 2 - s.x) < 0.75 && p.y + p.h > floor - 3.3) bossHitPlayer(s.dmg, s.x, p, 0, { kb: [5, 9], iframes: 0.4 });
    }
    if (s.t > 1.1 || floor == null) H.spikes.splice(i, 1);
  }
  for (let i = H.blades.length - 1; i >= 0; i--) {
    const b = H.blades[i]; b.t += dt;
    if (b.state === 'warn' && b.t >= 0.85) { b.state = 'fall'; b.vy = 0; }
    else if (b.state === 'fall') {
      b.vy = Math.min(40, b.vy + 90 * dt); b.y += b.vy * dt;
      if (floor != null && b.y >= floor - 0.2) {
        b.state = 'stuck'; b.t = 0; b.y = floor - 0.2; screenShake(0.2); if (b.kind === 'rock') sfx('dig.stone', { x: b.x, y: floor, vol: 1.1, pitch: 0.6 }); else sfx('hk.blade', { x: b.x, y: floor });
        for (let k = 0; k < 10; k++) Game.particles.push({ x: b.x, y: floor - 0.2, vx: (Math.random() - 0.5) * 6, vy: -2 - Math.random() * 3, life: 0.5, age: 0, size: 0.11, color: b.kind === 'rock' ? '#8e988a' : (k % 2 ? '#bff6ff' : '#5af0ff'), gravity: 10 });
        if (!Game.creative && !p.dead && Math.abs(p.x + p.w / 2 - b.x) < (b.kind === 'rock' ? 0.8 : 0.9) && p.y + p.h > floor - 3) bossHitPlayer(b.dmg, b.x, p, 0, { kb: [4, 8], iframes: 0.35 });
      }
    } else if (b.state === 'stuck' && b.t > 0.6) H.blades.splice(i, 1);
    if (floor == null) H.blades.splice(i, 1);
  }
  for (let i = H.ghosts.length - 1; i >= 0; i--) { H.ghosts[i].age += dt; if (H.ghosts[i].age > 0.55) H.ghosts.splice(i, 1); }
});
// the shield: hits from the front are mostly absorbed (and wear it down)
function hollowBlock12(mob, dmg) {
  const p = Game.player;
  if (mob.blocking && p && ((mob.facingDir > 0) === ((p.x + p.w / 2) > (mob.x + mob.w / 2)))) {
    mob.shieldHp -= dmg;
    const sx = mob.x + mob.w / 2 + mob.facingDir * 1.3, sy = mob.y + 1.9;
    for (let i = 0; i < 8; i++) Game.particles.push({ x: sx, y: sy + (Math.random() - 0.5), vx: mob.facingDir * (2 + Math.random() * 4), vy: (Math.random() - 0.5) * 4, life: 0.3, age: 0, size: 0.07, color: '#ffe9a0', gravity: 6, kind: 'star' });
    sfx('hk.clang', { x: sx, y: sy });
    spawnDamageNumber(sx, sy - 0.5, Math.max(1, Math.round(dmg * 0.12)), 'player');
    return Math.max(1, Math.round(dmg * 0.12));
  }
  return dmg;
}

// ---- VISUALS (drawing and effects) ----
MOB_DRAW.hollowknight = mkDraw12('hollowknight');
function hkSpriteAt12(m, x, y, facing, frame, alpha) {
  const fake = { type: 'hollowknight', h: m.h, w: m.w, def: m.def, id: m.id, phase: 2, move: 'slash', vx: 0, legPhase: 0, dying: null };
  const u = TILE / 16;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(Math.round(ox12 + (x + m.w / 2) * TILE), Math.round(oy12 + (y + m.h) * TILE)); ctx.scale(facing, 1);
  MOB_DRAW.hollowknight(ctx, fake, u, []); ctx.restore();
}
let ox12 = 0, oy12 = 0;
B12.pre.push(function hkDraw12(ox, oy) {
  const H = B12.hk, m = Game.boss && Game.boss.type === 'hollowknight' && Game.boss.dying == null ? Game.boss : null;
  ox12 = ox; oy12 = oy;
  if (m) {
    // the wind-up arc
    if (m.move === 'wind' || (m.move === 'leap' && m.moveT < 0.4) || m.move === 'summon' || m.move === 'dashcut') {
      const x = ox + (m.x + m.w / 2) * TILE, y = oy + (m.y + 1.9) * TILE, k = Math.min(1, m.moveT / (m.phase >= 2 ? 0.3 : 0.6)), r = TILE * (m.phase >= 2 ? 4.5 : 3.8);
      ctx.save(); ctx.fillStyle = `rgba(255,${m.phase >= 2 ? 90 : 220},${m.phase >= 2 ? 70 : 255},${0.1 + 0.22 * k})`; ctx.beginPath(); ctx.moveTo(x, y);
      const f = m.facingDir > 0 ? 0 : Math.PI; ctx.arc(x, y, r, f - 0.9, f + 0.9); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    for (const g of H.ghosts) if (g.age >= 0) hkSpriteAt12(m, g.x, g.y, g.facing, g.frame, 0.45 * (1 - g.age / 0.55));
  }
  // the floor cracks (a warning) before each spear
  const fl = m ? m.arena.floor : null;
  if (fl != null) for (const s of H.spikes) if (s.t > -1 && !s.up) {
    const k = Math.max(0, s.t) / 0.5, x = ox + s.x * TILE, y = oy + fl * TILE;
    ctx.fillStyle = `rgba(90,240,255,${0.25 + 0.6 * k})`; ctx.fillRect(x - TILE * 0.12, y - 3, TILE * 0.24, 3 + TILE * 0.1);
    ctx.fillStyle = `rgba(255,255,255,${0.4 * k})`; ctx.fillRect(x - 1, y - 6 * k - 2, 2, 5 * k + 2);
  }
  // the warning beams of the swords and rubble
  if (m) for (const b of H.blades) if (b.state === 'warn' && b.t > -0.05) {
    const k = Math.max(0, b.t) / 0.85, x = ox + b.x * TILE, top = oy + (m.arena.floor - 13) * TILE, bot = oy + m.arena.floor * TILE;
    const g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, 'rgba(90,240,255,0)'); g.addColorStop(1, `rgba(${b.kind === 'rock' ? '200,200,200' : '120,250,255'},${0.2 + 0.5 * k})`);
    ctx.fillStyle = g; ctx.fillRect(x - TILE * (0.1 + 0.2 * k), top, TILE * (0.2 + 0.4 * k), bot - top);
  }
  // spears, swords and rubble themselves
  if (m) for (const s of H.spikes) if (s.up) {
    const k = Math.min(1, (s.t - 0.5) / 0.1), fade = 1 - Math.max(0, (s.t - 0.9) / 0.2), h = TILE * 3.3 * k, w = TILE * 0.7, x = ox + s.x * TILE, y = oy + m.arena.floor * TILE;
    ctx.save(); ctx.globalAlpha = fade; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w / 2, y); ctx.closePath();
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#1f98b0'); g.addColorStop(0.5, '#e8ffff'); g.addColorStop(1, '#3fd8ee'); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#0a3a4a'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
  if (m) for (const b of H.blades) if (b.state !== 'warn') {
    const x = ox + b.x * TILE, y = oy + b.y * TILE, fade = b.state === 'stuck' ? 1 - b.t / 0.6 : 1;
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(x, y);
    if (b.kind === 'rock') { ctx.fillStyle = '#7a847a'; ctx.fillRect(-TILE * 0.35, -TILE * 0.7, TILE * 0.7, TILE * 0.7); ctx.fillStyle = '#a8b2a8'; ctx.fillRect(-TILE * 0.35, -TILE * 0.7, TILE * 0.7, 4); ctx.fillStyle = '#4a524a'; ctx.fillRect(TILE * 0.15, -TILE * 0.3, TILE * 0.2, TILE * 0.3); }
    else {
      ctx.fillStyle = '#e8ffff'; ctx.fillRect(-TILE * 0.12, -TILE * 2.4, TILE * 0.24, TILE * 2.4); ctx.beginPath(); ctx.moveTo(-TILE * 0.12, 0); ctx.lineTo(0, TILE * 0.25); ctx.lineTo(TILE * 0.12, 0); ctx.fill();
      ctx.fillStyle = '#3fd8ee'; ctx.fillRect(-TILE * 0.05, -TILE * 2.4, TILE * 0.1, TILE * 2.4); ctx.fillStyle = '#d9a93a'; ctx.fillRect(-TILE * 0.4, -TILE * 2.6, TILE * 0.8, TILE * 0.2); ctx.fillStyle = '#5a3a22'; ctx.fillRect(-TILE * 0.08, -TILE * 3.3, TILE * 0.16, TILE * 0.7);
    }
    ctx.restore();
  }
});
B12.glow.push(function hkGlow12(ox, oy, glow) {
  const m = Game.boss && Game.boss.type === 'hollowknight' && Game.boss.dying == null ? Game.boss : null; if (!m) return;
  const t = performance.now() / 1000, cx = ox + (m.x + m.w / 2) * TILE, cy = oy + (m.y + 1.9) * TILE, p2 = m.phase >= 2;
  glow(cx, cy, TILE * (p2 ? 3.4 : 2.4), p2 ? '255,80,50' : '60,220,240', p2 ? 0.28 : 0.18);
  if (p2) for (let i = 0; i < 6; i++) { const a = t * 2.2 + i * 1.047, x = cx + Math.cos(a) * TILE * 2.1, y = cy + Math.sin(a) * TILE * 1.5; glow(x, y, TILE * 0.9, '255,110,40', 0.7); glow(x, y, TILE * 0.3, '255,240,170', 0.95); }
  if (m.move === 'slash') {   // the sweep of the sword
    const k = Math.min(1, m.moveT / 0.26), r = TILE * (p2 ? 4.4 : 3.7), col = p2 ? '255,130,80' : '120,245,255';
    ctx.save(); ctx.translate(cx, cy); ctx.scale(m.facingDir, 1);
    for (let j = 0; j < 5; j++) {
      const a0 = -1.5 + k * 2.4 - j * 0.16;
      ctx.beginPath(); ctx.arc(0, 0, r * (1 - j * 0.03), a0 - 0.32, a0);
      ctx.strokeStyle = `rgba(${col},${(0.7 - j * 0.13) * (1 - k * 0.4)})`; ctx.lineWidth = TILE * (0.5 - j * 0.07); ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.restore();
  }
  if (m.move === 'rain' || m.move === 'summon') glow(cx, cy - TILE * 2.6, TILE * 2.2, '120,250,255', 0.5 * Math.min(1, m.moveT * 2));
  for (const s of B12.hk.spikes) if (s.up) glow(ox + s.x * TILE, oy + (m.arena.floor - 1.3) * TILE, TILE * 1.6, '90,240,255', 0.4);
  for (const b of B12.hk.blades) if (b.state === 'fall' && b.kind === 'sword') glow(ox + b.x * TILE, oy + (b.y - 1.2) * TILE, TILE * 1.6, '120,250,255', 0.5);
});
B12.glow.push(function drawSoulWaves12(ox, oy, glow) {
  for (const b of Game.bolts12) if (b.kind === 'ksoul' || b.kind === 'psoul') {
    const x = ox + b.x * TILE, y = oy + b.y * TILE, dir = Math.sign(b.vx) || 1;
    const col = b.kind === 'psoul' ? '90,235,255' : (b.p2 ? '255,110,70' : '90,235,255');
    glow(x, y, TILE * 1.8, col, 0.5);
    for (let j = 0; j < 4; j++) {
      ctx.beginPath(); ctx.arc(x - dir * j * TILE * 0.35, y, TILE * (1.0 - j * 0.08), dir > 0 ? -1.15 : Math.PI - 1.15, dir > 0 ? 1.15 : Math.PI + 1.15);
      ctx.strokeStyle = `rgba(${col},${0.85 - j * 0.2})`; ctx.lineWidth = TILE * (0.34 - j * 0.06); ctx.lineCap = 'round'; ctx.stroke();
    }
  }
});
BOLT_COL12.ksoul = ['90,235,255', '#bff6ff'];
BOLT_COL12.psoul = ['90,235,255', '#bff6ff'];

// ---- HARDMODE (a rematch after the Slayer): faster in everything (index.html, HM_BOSS22), and every few
// seconds spectral swords mark the floor around you and fall, whatever else he's doing ----
BOSSES.hollowknight.hardmode = function (m, dt, p) {
  const A = m.arena; if (!A || m.move === 'break' || m.move === 'intro') return;
  m.hmT22 = (m.hmT22 ?? 5) - dt; if (m.hmT22 > 0) return;
  m.hmT22 = m.phase >= 2 ? 4 : 5.5;
  const dmg = Math.round((m.phase >= 2 ? 13 : 9) * 0.85), pcx = p.x + p.w / 2;
  const xs = [pcx, pcx + (Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 2), pcx + (Math.random() - 0.5) * 12];
  xs.forEach((x, i) => { if (x > A.x0 + 0.8 && x < A.x1 - 0.8) B12.hk.blades.push({ x, kind: 'sword', t: -i * 0.22, y: A.floor - 12, state: 'warn', dmg }); });
  sfx('hk.mark', { x: pcx, y: A.floor - 2 });
};
