'use strict';
// =============================================================================
// CRIMSON REAPER   (type 'crimsonreaper')
//   The Blood Moon's own elite: flies, blinks, throws scythes, calls the dead. Killing it ends the Blood Moon.
// =============================================================================
defineMob('crimsonreaper', {
  // ---- STATS ----
  stats: {
    name: 'Crimson Reaper', w: 1.0, h: 2.8, speed: 3.4, health: 190, hostile: true, dmg: 8, kb: 0.05, flying: true,
    sunproof: true, nocturnal: true, elite: true, glow: '255,40,60',
    loot: [[BLOOD_SHARD, 5, 9, 1], [DIAMOND, 2, 4, 1], [RUBY, 1, 3, 0.8], [245, 1, 2, 0.7], [MANA_POTION, 2, 4, 1], [MANA_STAR, 1, 1, 0.7], [EMBER_STAFF, 1, 1, 0.12], [VOID_ORB, 1, 1, 0.2], [LIGHTNING_ROD, 1, 1, 0.12]],
    eye: [1, 0.2, '255,40,50'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  ai: 'reaper',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.crimsonreaper, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: terraria_('dd2_wither_beast_aura_pulse', 2), vol: 0.7, pitch: [0.55, 0.7], cat: 'volCreatures', synth: 'growl' },
    hurt: { files: terraria_('dd2_dark_mage_hurt', 3), vol: 0.75, pitch: [0.62, 0.75], cat: 'volCreatures', synth: 'hit' },
    death: { files: terraria_('dd2_dark_mage_death', 3), vol: 1, pitch: [0.55, 0.62], cat: 'volCreatures', synth: 'death' },
    'reaper.arrive': { files: ['terraria/dd2_betsy_scream'], vol: 0.8, pitch: [0.55, 0.6], cat: 'volCreatures' },
    'reaper.scythe': { files: ['terraria/item_71'], vol: 0.9, pitch: [0.75, 0.9], cat: 'volCreatures' },
    'reaper.blink': { files: ['terraria/item_6'], vol: 0.7, pitch: [0.6, 0.7], cat: 'volCreatures' },
    'reaper.call': { files: terraria_('dd2_dark_mage_attack', 3), vol: 0.8, pitch: [0.6, 0.7], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- AI ----
// the Crimson Reaper (Blood Moon): floats at you, scythe sweeps, calls bats, blinks if you run
MOB_AI12.reaper = function (m, dt, p, dx, dist) {
  const def = m.def; m.flap = (m.flap || 0) + dt * 3; m.castT = Math.max(0, (m.castT || 0) - dt);
  const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2, pcx = p.x + p.w / 2, pcy = p.y + p.h * 0.4;
  m.state = Game.creative ? 'wander' : 'hostile';
  m.batCd = (m.batCd == null ? 6 : m.batCd) - dt; m.blinkCd = (m.blinkCd == null ? 8 : m.blinkCd) - dt;
  if (m.state === 'hostile') {
    if (m.blinkCd <= 0 && dist > 13) { m.blinkCd = 8; const nx = pcx + (Math.random() < 0.5 ? -5 : 5), ny = pcy - 1; for (let i = 0; i < 20; i++) Game.particles.push({ x: mcx, y: mcy + (Math.random() - 0.5) * 2, vx: (Math.random() - 0.5) * 3, vy: -1, life: 0.8, age: 0, size: 0.16, color: i % 2 ? 'rgba(200,20,50,0.7)' : 'rgba(20,0,10,0.8)', gravity: -0.3 }); m.x = nx - m.w / 2; m.y = ny - m.h / 2; m.vx = m.vy = 0; sfx('reaper.blink', { x: nx, y: ny }); }
    if (m.batCd <= 0 && Game.mobs.filter(q => q.type === 'bloodbat').length < 8) { m.batCd = 12; m.castT = 0.8; for (let i = 0; i < 3; i++) { const b = new Mob('bloodbat', mcx + (i - 1) * 1.2, mcy - 1); b.state = 'hostile'; Game.mobs.push(b); } eventMessage('The Crimson Reaper calls its bats!', '#ff6a8a'); sfx('reaper.call', { x: mcx, y: mcy }); }
    const want = 2.2; let tx = pcx - Math.sign(dx || 1) * want, ty = pcy - 0.5;
    { const wp = mobFlyWaypoint(m, tx, ty); if (wp) { tx = wp.x; ty = wp.y; } }   // (a wall in the way: round it, Mobs/_pathfinding.js)
    if (m.kbTimer <= 0) { const ddx = tx - mcx, ddy = ty - mcy, len = Math.hypot(ddx, ddy) || 1, k = Math.min(1, dt * 3); m.vx += (ddx / len * def.speed * Math.min(1, len / 2) - m.vx) * k; m.vy += (ddy / len * def.speed * Math.min(1, len / 2) - m.vy) * k; }
    m.facingDir = dx > 0 ? 1 : -1;
    if (m.attackCooldown <= 0 && dist < 3.4) { m.castT = 0.5; m.attackCooldown = 1.9; m.swipeT = 0.25; }
    if (m.swipeT > 0) { m.swipeT -= dt; if (m.swipeT <= 0 && dist < 3.8) { hitPlayer(m, def.dmg, 9, 5); for (let i = 0; i < 12; i++) { const a = -1.2 + i * 0.2; Game.particles.push({ x: mcx + m.facingDir * 1.5, y: mcy + Math.sin(a) * 1.3, vx: m.facingDir * 3, vy: Math.sin(a) * 2, life: 0.4, age: 0, size: 0.12, color: '#ff3a4a', gravity: 0 }); } sfx('reaper.scythe', { x: mcx, y: mcy }); } }
  } else { m.vx *= 0.95; m.vy = Math.sin(Game.time) * 0.5; }
  moveAndCollide(m, Game.world, dt);
  if (Math.random() < dt * 20 * particleMul()) Game.particles.push({ x: mcx + (Math.random() - 0.5) * 0.8, y: m.y + m.h * 0.9, vx: 0, vy: 0.8, life: 0.7, age: 0, size: 0.1, color: Math.random() < 0.5 ? '#c01830' : '#2a0a14', gravity: 1 });
};

// ---- VISUALS (drawing and effects) ----
const REAPER_P = { c: '#4a0c16', C: '#6e1420', d: '#2a060c', k: '#0a0204', w: '#e8dcc8', W: '#b8a890', E: '#ff3040', s: '#8a8a92', S: '#c8c8d0', h: '#3a2418', H: '#5a3a24' };
const REAPER_G = {
  hood: ['....cccc...', '..ccCCCCcc.', '.cCCCCCCCCc', 'cCCCCkkkkCC', 'cCCCkwwwwkC', 'cCCkwwEwEkC', 'cCCkwwwwwkC', 'cCCkkwkwkkC', 'cCCCkwwwkCC', '.cCCCkkkCC.', '..cCCCCCc..'],
  arm: ['cC', 'Cc', 'cC', 'CC', 'cC', 'Cc', 'cC', 'CCc', 'www', 'w.w'],
};
function reaperScythe14(b) {   // in the hand, the blade pointing up and forward
  line14(b, 0, 14, 0, -20, '#3a2418', 2); line14(b, 1, 12, 1, -18, '#5a3a24', 1);
  poly14(b, [0, -22, 6, -24, 14, -20, 19, -13, 13, -17, 6, -19, 1, -18], '#9a9aa2');
  line14(b, 1, -21, 7, -22, '#e0e0e8', 1); line14(b, 8, -22, 15, -18, '#e0e0e8', 1); line14(b, 15, -18, 18, -14, '#ff4050', 1);
}
MOB_DRAW.crimsonreaper = (g, m, u, eyes) => {
  const p = n => mp14('reaper', n, REAPER_G[n], REAPER_P, { flat: 'Ek' });
  const t = Game.time + m.id, bob = (Math.sin(t * 1.6) * 1.5), lean = Math.max(-0.25, Math.min(0.25, (m.vx || 0) * 0.05));
  const sw = m.swipeT > 0 ? 1 - m.swipeT / 0.25 : 0, cast = m.castT > 0 && !(m.swipeT > 0);
  // the scythe: held up behind, then a full swing down and through
  const aF = m.swipeT > 0 ? -2.6 + sw * 3.4 : cast ? -2.3 : -0.5 + Math.sin(t * 1.5) * 0.08;
  rig14(g, u, 80, 88, 40, 50, b => {
    b.translate(0, bob);
    DK14 = 0.65; drawP14(b, p('arm'), -3, -14, 1, 0, 1, cast ? -2.6 : 0.3); DK14 = 0;
    cloak14(b, -14, 5, 9, 36, t, { m: '#5a1018', d: '#36080e', l: '#7e1a26', ol: OL14 }, -lean);
    drawP14(b, p('hood'), 1, -14, 5, 10, 1);
    b.save(); b.translate(4, -13); b.rotate(aF);
    b.save(); b.translate(0, 9); b.rotate(-aF * 0.35 + 0.2); reaperScythe14(b); b.restore();
    drawP14(b, p('arm'), 0, 0, 1, 0, 1);
    b.restore();
    if (cast) { b.globalAlpha = 0.85; disk14(b, -6, -30, 3 + Math.sin(t * 20), 3, '#ff3048'); b.globalAlpha = 1; }
  });
  if (m.dying == null) eyes14(eyes, 2.5, -19 + bob, u, '255,40,50', 1.1);
};
