'use strict';
// =============================================================================
// THE COMET CHARM   (a Hardmode charm, 1.0.1)
//   Wear it, then double-tap Space (or the jump button) to take off. You fly for as long as you
//   like, in any direction (A/D, W or Space up, S down), and FAST: from about 24 blocks a second
//   (tier I) up to 50 (tier VIII). Hold Sprint for the afterburner (x1.5).
//   The handling is touchy on purpose: you hit full speed almost at once, turn on a dime, and
//   when you let go you keep sliding for a moment. Double-tap again to drop out of the sky, or
//   fly down onto the ground to land. Smacking into a wall at speed shakes the screen (no damage).
//   How to get it: in Hardmode, at the Magical Workbench:
//     Shattered Crystal, Mana Star, Shattered Crystal
//     Shattered Crystal, Charm Frame, Shattered Crystal
//     Shattered Crystal, Power Charm, Shattered Crystal
//   (made from a Power Charm of tier N, it comes out at tier N)
// =============================================================================
const COMET_CHARM = 503;

// ---- STATS ----
//                I    II   III  IV   V    VI   VII  VIII
PERK_STATS.comet = {
  speed: [24, 27, 30, 33, 36, 40, 44, 50],              // top speed, blocks a second
  accel: [130, 140, 150, 160, 172, 185, 200, 220],      // how hard it pulls (blocks a second, every second)
};
const COMET22 = {
  boost: 1.5,          // Sprint: the afterburner
  coast: 0.2,          // let go: you keep this much of your speed after a second (a slippery slide)
  turnKick: 1.7,       // turning back on yourself pulls this much harder (that's the touchy part)
  crashAt: 16,         // hitting a wall faster than this shakes the screen
  trail: [], fx: [], boomT: 0,
};

// ---- THE ITEM ----
defItem(COMET_CHARM, 'Comet Charm', { kind: 'perk', perk: 'comet', stack: 1 });
PERKS.comet = {
  item: COMET_CHARM, name: 'Comet Flight', color: '#7ff5ff',
  desc: 'Double-tap Space to fly forever, really fast',
  tierDesc: (lv) => `Double-tap Space: fly forever at ${PERK_STATS.comet.speed[lv - 1]} blocks a second (hold Sprint: ${Math.round(PERK_STATS.comet.speed[lv - 1] * COMET22.boost)})`,
};
ITEM_HINTS[COMET_CHARM] = 'A Hardmode charm. Double-tap Space to take off, steer with A/D, W and S, hold Sprint for the afterburner, double-tap again to drop. Made at the Magical Workbench';
addRecipe18({ result: COMET_CHARM, qty: 1, shape: ['SMS', 'SFS', 'SPS'], key: { S: SHATTERED_CRYSTAL, M: MANA_STAR, F: CHARM_FRAME, P: 210 }, station: 'magic' });
for (const G of CR_GROUPS18) if (G[1] === 'Charms') G[2].push(COMET_CHARM);

// ---- TEXTURE (animated: 8 frames, the comet's tail shimmers and the stars twinkle) ----
BIG_ITEM_TEXTURES[COMET_CHARM] = ['Textures/items/charm_comet.png', 16];
{
  const sheet = 'Textures/items/charm_comet_anim.png', frames = [];
  const cis = computeIconStyle;
  computeIconStyle = function (id) {
    if (+id === COMET_CHARM) return `background-image:url("${texUrl(sheet)}");background-size:800% 100%;background-position:0% 0;animation:prism22 1s steps(8, jump-none) infinite;image-rendering:pixelated;`;
    return cis(id);
  };
  iconStyleCache.clear();
  const img = new Image();
  img.onload = () => { for (let k = 0; k < 8; k++) { const c = mkCanvas(16); c.height = 16; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, k * 16, 0, 16, 16, 0, 0, 16, 16); frames.push(c); } };
  img.src = (window.TEXTURE_BUNDLE && window.TEXTURE_BUNDLE[sheet]) || sheet;
  setInterval(() => { if (frames.length === 8) itemIcon[COMET_CHARM] = frames[Math.floor(performance.now() / 125) % 8]; }, 40);
  const fb = buildFallbackTextures;
  buildFallbackTextures = function () {
    fb();
    if (!itemIcon[COMET_CHARM]) { const c = mkCanvas(TEX), g = c.getContext('2d'); g.fillStyle = '#e0b040'; g.fillRect(3, 4, TEX - 6, TEX - 6); g.fillStyle = '#2a1a70'; g.fillRect(5, 6, TEX - 10, TEX - 10); g.fillStyle = '#7ff5ff'; g.fillRect(TEX / 2, TEX / 2 - 2, 2, 2); itemIcon[COMET_CHARM] = c; }
  };
}

// ---- SOUNDS (the Terraria pack) ----
Object.assign(SOUNDS, {
  'comet.start': { files: terraria_('dd2_betsy_wind_attack', 2), vol: 0.5, pitch: [1.1, 1.3], cat: 'volPlayers' },
  'comet.stop': { files: terraria_('dd2_betsy_wind_attack', 2), vol: 0.3, pitch: [1.5, 1.7], cat: 'volPlayers' },
  'comet.boost': { files: terraria_('dd2_wyvern_dive_down', 3), vol: 0.4, pitch: [1.1, 1.3], cat: 'volPlayers' },
  'comet.boom': { files: terraria_('dd2_sonic_boom_blade_slash', 3), vol: 0.45, pitch: [0.9, 1.1], cat: 'volPlayers' },
  'comet.crash': { files: terraria_('dd2_monk_staff_ground_impact', 3), vol: 0.5, pitch: [0.9, 1.1], cat: 'volPlayers' },
});

// ---- FLIGHT (called by the player's movement, every frame; true = it moved you) ----
function cometFlight22(p, move, dt) {
  const worn = hasPerk(p, 'comet') && Game.screen === 'play' && !p.dead && !p.riding && !Game.creative;
  if (!worn) { if (p.comet) cometStop22(p, true); p.cometTapHeld = Input.jump; return false; }
  // double-tap jump: take off / drop
  if (Input.jump && !p.cometTapHeld) {
    const now = performance.now();
    if (now - (p.cometTap || 0) < 300) { p.cometTap = 0; if (p.comet) cometStop22(p); else cometStart22(p); }
    else p.cometTap = now;
  }
  p.cometTapHeld = Input.jump;
  if (!p.comet) return false;

  const i = perkLevel(p, 'comet') - 1, S = PERK_STATS.comet;
  const boosting = !!(Input.sprint || p.sprintLatched);
  if (boosting && !p.cometBoosting) { sfx('comet.boost'); cometRing22(p, '127,245,255', 0.4, 2.2); }
  p.cometBoosting = boosting;
  const top = S.speed[i] * (boosting ? COMET22.boost : 1), acc = S.accel[i] * (boosting ? 1.25 : 1);
  const iy = (Input.down ? 1 : 0) - ((Input.jump || Input.up) ? 1 : 0), ix = move;
  if (ix || iy) {
    const n = Math.hypot(ix, iy), tx = ix / n * top, ty = iy / n * top;
    const kx = tx && Math.sign(p.vx) === -Math.sign(tx) ? COMET22.turnKick : 1, ky = ty && Math.sign(p.vy) === -Math.sign(ty) ? COMET22.turnKick : 1;
    p.vx = approach(p.vx, tx, acc * kx * dt);
    p.vy = approach(p.vy, ty, acc * ky * dt);
  } else {   // let go: slide to a stop
    const k = Math.pow(COMET22.coast, dt);
    p.vx *= k; p.vy *= k;
    if (Math.abs(p.vx) < 0.05) p.vx = 0;
    if (Math.abs(p.vy) < 0.05) p.vy = 0;
  }
  if (ix) p.facing = ix;
  if (p.swimming) stopSwimming(p);
  p.inWater = isWaterTile(Game.world, p.x + p.w / 2, p.y + p.h / 2);
  p.waterPush = 0; p.subFrac = 0;
  p.climbing = false; p.onLadder = false; p.jumping = false; p.sprinting = false; p.coyote = 0; p.ducking = false;
  // move in small steps, so even at full speed you can't skip through a wall
  const vx0 = p.vx, vy0 = p.vy, sp = Math.hypot(vx0, vy0), steps = Math.min(12, Math.max(1, Math.ceil(sp * dt / 0.3)));
  for (let s = 0; s < steps; s++) moveAndCollide(p, Game.world, dt / steps);
  const hitX = Math.abs(vx0) > COMET22.crashAt && p.vx === 0, hitY = Math.abs(vy0) > COMET22.crashAt && p.vy === 0;
  if (hitX || hitY) cometCrash22(p, hitX ? vx0 : 0, hitY ? vy0 : 0);
  p.falling = false; p.fallStartY = p.y;
  p.lean = Math.max(-0.5, Math.min(0.5, (p.vx / Math.max(1, top)) * 0.5 * (p.facing || 1)));
  if (p.onGround && iy > 0) cometStop22(p);   // flew down onto the ground: land
  jumpHeld = Input.jump || Input.up;
  cometFx22(p, dt, sp, top, boosting);
  return true;
}
function cometStart22(p) {
  p.comet = true; p.flying = false; p.climbing = false;
  if (p.swimming) stopSwimming(p);
  p.vy = Math.min(p.vy, -6);   // a little hop as you take off
  sfx('comet.start'); cometRing22(p, '170,140,255', 0.35, 2.6);
  const c = cometC22(p);
  for (let k = 0; k < 18 * particleMul(); k++) { const a = Math.random() * 6.283, v = 3 + Math.random() * 5; Game.particles.push({ x: c.x, y: c.y + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, age: 0, size: 0.09, color: k % 2 ? '#7ff5ff' : '#c8a8ff', gravity: 0, kind: 'star' }); }
  if (!Settings.cometTip22) { Settings.cometTip22 = true; try { saveSettings(); } catch (e) { } showToast('Comet Flight! A/D, W/S to steer, Sprint to boost, double-tap Space to drop'); }
}
function cometStop22(p, quiet) {
  p.comet = false; p.cometBoosting = false; p.fallStartY = p.y;
  if (!quiet) sfx('comet.stop');
}
function cometCrash22(p, vx, vy) {
  const sp = Math.hypot(vx, vy);
  screenShake(Math.min(0.6, sp / 70)); sfx('comet.crash', { vol: Math.min(1, 0.3 + sp / 80) });
  const c = cometC22(p), dx = Math.sign(vx) * p.w / 2, dy = Math.sign(vy) * p.h / 2;
  for (let k = 0; k < 14 * particleMul(); k++) Game.particles.push({ x: c.x + dx, y: c.y + dy, vx: -Math.sign(vx) * Math.random() * 6 + (Math.random() - 0.5) * 4, vy: -Math.sign(vy) * Math.random() * 6 + (Math.random() - 0.5) * 4, life: 0.4, age: 0, size: 0.1, color: k % 3 ? '#7ff5ff' : '#ffffff', gravity: 6, kind: 'star' });
  cometRing22(p, '255,255,255', 0.3, 1.8);
}
function cometC22(p) { return { x: p.x + p.w / 2, y: p.y + p.h * 0.5 }; }
function cometRing22(p, col, life, r1) { const c = cometC22(p); COMET22.fx.push({ x: c.x, y: c.y, t: 0, life, r0: 0.4, r1, col }); }

// ---- VISUALS ----
function cometFx22(p, dt, sp, top, boosting) {
  const c = cometC22(p), T = COMET22.trail;
  T.unshift([c.x, c.y]); if (T.length > 18) T.pop();
  if (sp > 4 && Math.random() < Math.min(1, sp / 20) * particleMul()) Game.particles.push({ x: c.x - p.vx * 0.02 + (Math.random() - 0.5) * 0.5, y: c.y - p.vy * 0.02 + (Math.random() - 0.5) * 0.8, vx: -p.vx * 0.1, vy: -p.vy * 0.1, life: 0.35 + Math.random() * 0.25, age: 0, size: 0.06 + Math.random() * 0.05, color: boosting ? (Math.random() < 0.5 ? '#ffffff' : '#7ff5ff') : (Math.random() < 0.5 ? '#7ff5ff' : '#a88aff'), gravity: 0, kind: 'star' });
  // sonic boom: at full afterburner speed, every so often
  COMET22.boomT -= dt;
  if (boosting && sp > top * 0.9 && COMET22.boomT <= 0) { COMET22.boomT = 1.4; sfx('comet.boom'); cometRing22(p, '200,250,255', 0.45, 3.4); screenShake(0.08); }
}
B12.updaters.push(function cometTick22(dt) {
  for (let i = COMET22.fx.length - 1; i >= 0; i--) { const f = COMET22.fx[i]; f.t += dt; if (f.t >= f.life) COMET22.fx.splice(i, 1); }
  const p = Game.player;
  if (!p || !p.comet) { if (COMET22.trail.length) COMET22.trail.length = Math.max(0, COMET22.trail.length - 2); }
});
B12.glow.push(function cometGlow22(ox, oy, glow) {
  const T0 = TILE, T = COMET22.trail, p = Game.player;
  if (T.length > 1) {
    const boost = p && p.cometBoosting;
    ctx.lineCap = 'round';
    for (let j = 1; j < T.length; j++) {
      const k = 1 - j / T.length;
      ctx.strokeStyle = boost ? `rgba(200,250,255,${0.6 * k})` : `rgba(127,200,255,${0.5 * k})`; ctx.lineWidth = Math.max(1, T0 * 0.7 * k);
      ctx.beginPath(); ctx.moveTo(ox + T[j - 1][0] * T0, oy + T[j - 1][1] * T0); ctx.lineTo(ox + T[j][0] * T0, oy + T[j][1] * T0); ctx.stroke();
      ctx.strokeStyle = `rgba(190,150,255,${0.45 * k})`; ctx.lineWidth = Math.max(1, T0 * 0.3 * k); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * k})`; ctx.lineWidth = Math.max(1, T0 * 0.1 * k); ctx.stroke();
    }
  }
  if (p && p.comet && !p.dead) { const c = cometC22(p); glow(ox + c.x * T0, oy + c.y * T0, T0 * (p.cometBoosting ? 2.6 : 1.9), p.cometBoosting ? '200,250,255' : '127,245,255', 0.35); }
  for (const f of COMET22.fx) {
    const e = f.t / f.life;
    ctx.strokeStyle = `rgba(${f.col},${0.85 * (1 - e)})`; ctx.lineWidth = Math.max(1, T0 * 0.14 * (1 - e));
    ctx.beginPath(); ctx.arc(ox + f.x * T0, oy + f.y * T0, T0 * (f.r0 + (f.r1 - f.r0) * Math.sqrt(e)), 0, 6.283); ctx.stroke();
  }
});
