'use strict';
// =============================================================================
// THE PRISMHEART - the post-Hardmode sword (and everything you need to make it)
//
//   1. In Hardmode, beat any boss again (not the Slayer): it shatters into 1-6 SHATTERED CRYSTALS.
//   2. Beat the Slayer of Worlds again (in Hardmode): she doesn't explode. She gives you her
//      CRYSTAL HEART and sinks back into her altar. (See Mobs/Bosses/slayer_of_worlds.js.)
//   3. 8 Shattered Crystals around a Crafting Table make the MAGICAL WORKBENCH.
//   4. At the Magical Workbench: 8 Shattered Crystals around the Crystal Heart make the PRISMHEART.
//
// THE PRISMHEART doesn't swing like a sword. Every swing throws the ghost of one of the ten swords it
// was forged from; it flies a fast, wild loop out to whatever's near your cursor (up to 22 blocks
// away) and back. The ghosts go straight through blocks and through every enemy in their way.
// Hold the button to keep swinging. 20% critical hits. No mana, no ammo.
// =============================================================================
const SHATTERED_CRYSTAL = 500, CRYSTAL_HEART = 501, PRISMHEART = 502, MAGIC_BENCH = 384;

// ---- STATS ----
const PRISM22 = {
  range: 22,          // how far from you the ghosts will go (blocks)
  seek: 6,            // how close to your cursor an enemy has to be for the ghosts to go for it
  crit: 0.2,          // critical hit chance (plus the usual falling crit)   (1.0.1: was 14%, then 18%)
  hitEvery: 0.2,      // one ghost can hit the same enemy again after this long (seconds)
  // the ten swords it was forged from, in the order their ghosts fly: [item, colour]
  swords: [[116, '127,244,255'], [149, '255,70,100'], [FROST_BLADE, '191,242,255'], [EMBER_SWORD, '255,138,26'], [SENSEI_KATANA, '255,106,138'],
    [PARASITE_KATANA, '182,255,58'], [HOLLOW_BLADE, '111,232,255'], [HELL_SWORD, '255,90,16'], [VOID_SWORD, '176,74,255'], [SLAYER_SWORD, '224,112,255']],
  next: 0, list: [], world: null, cutT: 0,
};
defWeapon(PRISMHEART, 'Prismheart', 'katana', 6, 9999);
WEAPONS[PRISMHEART] = { type: 'katana', prism: true, dmg: 36,   /* (1.0.1: was 24, then 32; it beats Hellfire and the Slayer of Worlds) */ cd: 0.12, reach: 3.2, noDash: true, trail: '#ffffff', heldSize: 36 };   // (heldSize: drawn bigger in your hand; a normal blade is 22)
defItem(SHATTERED_CRYSTAL, 'Shattered Crystal', { kind: 'material', stack: 64 });
defItem(CRYSTAL_HEART, 'Crystal Heart', { kind: 'material', stack: 16 });
defBlock(MAGIC_BENCH, 'Magical Workbench', { category: 'wood', hardness: 2.5, light: 7, solid: false, transparent: true });   // (a background block, like the Crafting Table)
defItem(MAGIC_BENCH, 'Magical Workbench', { kind: 'block', stack: 16 });
BLOCK_SOUND_GROUP[MAGIC_BENCH] = 'wood';
LIGHT_GLOW_COLOR[MAGIC_BENCH] = '200,140,255';
INTERACTIVE_BLOCKS.add(MAGIC_BENCH); FURNITURE_ANCHORS.add(MAGIC_BENCH);
Object.assign(ITEM_HINTS, {
  [PRISMHEART]: 'Each swing throws the ghost of one of its ten swords at whatever is near your cursor (up to 22 blocks away). They fly through walls and through every enemy, then come back. Hold to keep swinging. 20% critical hits. No mana, no ammo.',
  [SHATTERED_CRYSTAL]: 'In Hardmode, every boss you beat again (except the Slayer) shatters into 1 to 6 of these',
  [CRYSTAL_HEART]: 'The Slayer of Worlds gives it to you when you beat her again in Hardmode. The heart of the Prismheart',
  [MAGIC_BENCH]: 'A crafting table for the strongest things. Right-click it. The Prismheart is made here',
});

// ---- RECIPES ----
addRecipe18({ result: MAGIC_BENCH, qty: 1, shape: ['SSS', 'STS', 'SSS'], key: { S: SHATTERED_CRYSTAL, T: 16 } });
addRecipe18({ result: PRISMHEART, qty: 1, shape: ['SSS', 'SHS', 'SSS'], key: { S: SHATTERED_CRYSTAL, H: CRYSTAL_HEART }, station: 'magic' });

// ---- TEXTURES (animated: 8 frames side by side in the *_anim.png) ----
const PRISM_ART22 = {
  [PRISMHEART]: ['Textures/items/prism/prismheart', 64],
  [SHATTERED_CRYSTAL]: ['Textures/items/prism/shattered_crystal', 32],
  [CRYSTAL_HEART]: ['Textures/items/prism/crystal_heart', 32],
  [MAGIC_BENCH]: ['Textures/blocks/prism/magical_workbench', 16, 'block'],   // (a prism crystal floats over it and turns through every colour)
};
for (const id in PRISM_ART22) if (!PRISM_ART22[id][2]) BIG_ITEM_TEXTURES[id] = [PRISM_ART22[id][0] + '.png', PRISM_ART22[id][1]];
CUSTOM_BLOCK_TEXTURES[MAGIC_BENCH] = 'Textures/blocks/prism/magical_workbench.png';
{
  const PA = { frames: {}, n: 8, fps: 8 };
  const sheet = (id) => PRISM_ART22[id][0] + '_anim.png';
  const st = document.createElement('style');
  st.textContent = '@keyframes prism22 { from { background-position: 0% 0; } to { background-position: 100% 0; } }';
  document.head.appendChild(st);
  // in your slots: the strip, stepping through its frames
  const cis = computeIconStyle;
  computeIconStyle = function (id) {
    if (PRISM_ART22[id]) return `background-image:url("${texUrl(sheet(id))}");background-size:800% 100%;background-position:0% 0;animation:prism22 1s steps(8, jump-none) infinite;image-rendering:auto;`;
    return cis(id);
  };
  iconStyleCache.clear();
  // in your hand, on the ground and flying: the same frames, one canvas each
  for (const id in PRISM_ART22) {
    const img = new Image();
    img.onload = () => {
      const fw = Math.floor(img.width / PA.n), fh = img.height, out = [];
      for (let k = 0; k < PA.n; k++) { const c = mkCanvas(fw); c.height = fh; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, k * fw, 0, fw, fh, 0, 0, fw, fh); out.push(c); }
      PA.frames[id] = out;
    };
    const p = sheet(id); img.src = (window.TEXTURE_BUNDLE && window.TEXTURE_BUNDLE[p]) || p;
  }
  setInterval(() => {
    const k = Math.floor(performance.now() / 1000 * PA.fps) % PA.n;
    for (const id in PA.frames) { if (PRISM_ART22[id][2]) blockTex[id] = PA.frames[id][k]; else itemIcon[id] = PA.frames[id][k]; }
  }, 40);
  // if the pictures are missing: something rainbow instead of nothing
  const fb = buildFallbackTextures;
  buildFallbackTextures = function () {
    fb();
    for (const id of [PRISMHEART, SHATTERED_CRYSTAL, CRYSTAL_HEART]) if (!itemIcon[id]) {
      const c = mkCanvas(TEX), g = c.getContext('2d'), gr = g.createLinearGradient(0, TEX, TEX, 0);
      ['#ff4a6a', '#ffd84a', '#6aff8a', '#4ad8ff', '#b46aff'].forEach((col, i) => gr.addColorStop(i / 4, col));
      g.fillStyle = gr;
      if (id === PRISMHEART) { g.translate(TEX / 2, TEX / 2); g.rotate(-Math.PI / 4); g.fillRect(-1.5, -TEX * 0.45, 3, TEX * 0.75); g.fillStyle = '#e0b040'; g.fillRect(-4, TEX * 0.22, 8, 2); }
      else { g.beginPath(); g.moveTo(TEX / 2, 2); g.lineTo(TEX - 3, TEX / 2); g.lineTo(TEX / 2, TEX - 2); g.lineTo(3, TEX / 2); g.fill(); }
      itemIcon[id] = c;
    }
    if (!blockTex[MAGIC_BENCH]) { const c = mkCanvas(TEX), g = c.getContext('2d'); g.fillStyle = '#4e2e76'; g.fillRect(0, 6, TEX, TEX - 6); g.fillStyle = '#78f0ff'; g.fillRect(6, 1, 3, 5); blockTex[MAGIC_BENCH] = c; }
  };
}
// ---- the Creative menu ----
for (const G of CR_GROUPS18) {
  if (G[1] === 'Katanas') G[2].push(PRISMHEART);
  if (G[1] === 'Crafting Stations') G[2].push(MAGIC_BENCH);
  if (G[1] === 'Keys & Relics') G[2].push(SHATTERED_CRYSTAL, CRYSTAL_HEART);
}

// ---- SHATTERED CRYSTALS: every boss but the Slayer, beaten again in Hardmode ----
{
  const br = bossReward;
  bossReward = function (m, advId) {
    br(m, advId);
    if (!m || m.type === 'slayer' || m.shards22 || !hardmode18() || netIsClient()) return;
    m.shards22 = true;
    const n = 1 + Math.floor(Math.random() * 6), mx = m.x + m.w / 2, my = m.y + m.h / 2;
    for (let i = 0; i < n; i++) { const d = spawnDrop(SHATTERED_CRYSTAL, 1, mx, my); if (d) { d.vx = (Math.random() - 0.5) * 8; d.vy = -4 - Math.random() * 4; } }
    flashAt(mx, my, 5, '210,160,255', 0.3);
    const nm = bossInfo(m).name; announce(`${/^The /.test(nm) ? nm : 'The ' + nm} shatters... ${n} Shattered Crystal${n > 1 ? 's' : ''}!`, '#d8b0ff');
  };
}

// ---- THE MAGICAL WORKBENCH: a Crafting Table (3x3) that can also make the strongest things ----
{
  const tu = tryUseItem;
  tryUseItem = function (isRepeat) {
    const p = Game.player, t = Game.target;
    if (!isRepeat && t && p && !Game.spectator && !p.dead && Game.world.getTile(t.x, t.y) === MAGIC_BENCH) {
      openScreen('table', t.x, t.y);
      if (Game.ui.mode === 'table') { Game.ui.station = 'magic'; renderInventoryScreen(); sfx('enchant', { x: t.x + 0.5, y: t.y + 0.5, vol: 0.5, pitch: 1.4 }); }
      return;
    }
    return tu(isRepeat);
  };
  const csr = checkScreenInRange;
  checkScreenInRange = function () {
    const ui = Game.ui, p = Game.player;
    if (Game.screen === 'inventory' && ui && ui.station === 'magic') {
      const far = Math.hypot(p.x + p.w / 2 - (ui.x + 0.5), p.y + 0.5 - (ui.y + 0.5)) > REACH + 1.5;
      if (far || Game.world.getTile(ui.x, ui.y) !== MAGIC_BENCH) closePanels();
      return;
    }
    return csr();
  };
  const ris = renderInventoryScreen;
  renderInventoryScreen = function () {
    const r = ris.apply(this, arguments);
    if (Game.ui && Game.ui.station === 'magic') el('panel-title').textContent = 'Magical Workbench';
    return r;
  };
  // a few sparkles rising from any workbench near you
  B12.updaters.push(function benchSparkles22(dt, p) {
    if (!p || Game.screen === 'title' || Math.random() > dt * 4) return;
    const w = Game.world, px = Math.floor(p.x), py = Math.floor(p.y);
    for (let i = 0; i < 6; i++) {
      const x = px + Math.floor((Math.random() - 0.5) * 30), y = py + Math.floor((Math.random() - 0.5) * 18);
      if (w.getTile(x, y) !== MAGIC_BENCH) continue;
      Game.particles.push({ x: x + 0.2 + Math.random() * 0.6, y: y + 0.3, vx: (Math.random() - 0.5) * 0.4, vy: -0.8 - Math.random() * 0.6, life: 1.1, age: 0, size: 0.08, kind: 'star', color: ['#ff6ab0', '#ffd84a', '#7affb0', '#7ae8ff', '#c08aff'][Math.floor(Math.random() * 5)], gravity: -0.2 });
    }
  });
}

// ---- SOUNDS: from the Terraria sound pack (Sounds/terraria/) ----
//   prism.whoosh  each ghost sword leaving (Terraria's sword swing)       prism.ghost  a ghostly glaive cry under the flurry
//   prism.swing   the sword in your hand (Sky Dragon's Fury)              prism.hit    a crystal blade biting (crystal impact)
//   prism.crit    a critical hit: the crystal shatters
Object.assign(SOUNDS, {
  'prism.whoosh': { files: ['terraria/item_1', 'terraria/item_19'], vol: 0.3, pitch: [1.0, 1.28], cat: 'volPlayers' },
  'prism.ghost': { files: terraria_('dd2_ghastly_glaive_pierce', 3), vol: 0.2, pitch: [1.05, 1.3], cat: 'volPlayers' },
  'prism.swing': { files: terraria_('dd2_sky_dragons_fury_swing', 4), vol: 0.28, pitch: [1.0, 1.2], cat: 'volPlayers' },
  'prism.hit': { files: terraria_('dd2_wither_beast_crystal_impact', 3), vol: 0.3, pitch: [0.95, 1.2], cat: 'volPlayers' },
  'prism.crit': { files: ['terraria/shatter'], vol: 0.38, pitch: [1.05, 1.3], cat: 'volPlayers' },
});

// ---- AI (the weapon): each swing throws a ghost sword ----
function prismCanHit22(m) {
  if (m.dying != null || m.dead || m.def.npc || (m.def.pet && m.tamed) || m.def.villager) return false;
  return !!(m.def.hostile || m.def.boss || m.segOf || m.isPlayerProxy || m.duel);
}
const PRISM_RAINBOW22 = ['#ff4a7a', '#ffb43a', '#fff46a', '#6aff9a', '#4ae8ff', '#7a8aff', '#d06aff'];
function prismSwing22(p, slot, W) {
  p.attackCooldown = W.cd;
  p.kCombo = ((p.kCombo || 0) + 1) % 2;
  startAction(p, p.kCombo ? 'kslash2' : 'kslash1', false);
  p.swing = 1;
  const c = playerCenter(p), R = PRISM22.range;
  // where to: your cursor (on a touch screen, what you're pointing at, or ahead of you), at most 22 blocks out
  let tx, ty;
  if (Input.hasPointer) { tx = Input.pointerWorldX; ty = Input.pointerWorldY; }
  else if (Game.targetMob) { tx = Game.targetMob.x + Game.targetMob.w / 2; ty = Game.targetMob.y + Game.targetMob.h / 2; }
  else { tx = c.x + p.facing * 8; ty = c.y; }
  let d = Math.hypot(tx - c.x, ty - c.y);
  if (d > R) { tx = c.x + (tx - c.x) / d * R; ty = c.y + (ty - c.y) / d * R; }
  // an enemy near there? the ghost goes for it (one of the closest few, so a crowd gets cut up)
  const foes = combatTargets().filter(m => prismCanHit22(m) && boxDistToPoint(m, tx, ty) < PRISM22.seek && Math.hypot(m.x + m.w / 2 - c.x, m.y + m.h / 2 - c.y) < R + 2)
    .sort((a, b) => boxDistToPoint(a, tx, ty) - boxDistToPoint(b, tx, ty));
  if (foes.length) {
    const f = foes[Math.floor(Math.random() * Math.min(3, foes.length))];
    tx = f.x + f.w / 2 + (Math.random() - 0.5) * f.w * 0.8; ty = f.y + f.h / 2 + (Math.random() - 0.5) * f.h * 0.8;
  } else { tx += (Math.random() - 0.5) * 3; ty += (Math.random() - 0.5) * 3; }
  d = Math.max(2, Math.hypot(tx - c.x, ty - c.y));
  const k = PRISM22.next++ % PRISM22.swords.length;
  const g = { k, x: c.x, y: c.y, tx, ty, b: (Math.random() < 0.5 ? -1 : 1) * d * (0.16 + Math.random() * 0.3), t: 0, dur: Math.min(0.78, 0.3 + d * 0.024), hits: new Map(), trail: [], own: p, slot, W };
  PRISM22.list.push(g);
  netShot13({ k: 'z', x: +c.x.toFixed(2), y: +c.y.toFixed(2), tx: +tx.toFixed(2), ty: +ty.toFixed(2), b: +g.b.toFixed(2), d: +g.dur.toFixed(3), i: k });
  prismLaunchFx22(g, c.x, c.y, tx, ty, true);
}
// a ghost leaving: a swing, now and then a ghostly cry, a flare of its colour at your hand
function prismLaunchFx22(g, x, y, tx, ty, mine) {
  const col = PRISM22.swords[g.k][1], a = Math.atan2(ty - y, tx - x);
  sfx('prism.whoosh', mine ? undefined : { x, y });
  if (g.k % 3 === 0) sfx('prism.ghost', mine ? undefined : { x, y });
  if (mine && PRISM22.next % 3 === 1) sfx('prism.swing');
  PRISM22.fx.push({ kind: 'ring', x: x + Math.cos(a) * 0.6, y: y + Math.sin(a) * 0.6, col, t: 0, life: 0.28, r0: 0.15, r1: 1.1 });
  for (let i = 0; i < 5 * particleMul(); i++) { const b = a + (Math.random() - 0.5) * 1.2, sp = 3 + Math.random() * 4; Game.particles.push({ x: x + Math.cos(a) * 0.6, y: y + Math.sin(a) * 0.6, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp, life: 0.3 + Math.random() * 0.2, age: 0, size: 0.07, kind: 'star', color: PRISM_RAINBOW22[Math.floor(Math.random() * 7)], gravity: 0 }); }
}
// a ghost biting something: a star of light, shards of crystal (and a shatter on a crit)
function prismHitFx22(g, x, y, crit) {
  const col = PRISM22.swords[g.k][1];
  PRISM22.fx.push({ kind: 'star', x, y, col, t: 0, life: crit ? 0.32 : 0.2, size: crit ? 2.6 : 1.3, rot: Math.random() * 0.8 });
  for (let i = 0; i < (crit ? 16 : 7) * particleMul(); i++) { const b = Math.random() * 6.283, sp = (crit ? 5 : 3) + Math.random() * 4; Game.particles.push({ x, y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp - 1.5, life: 0.35 + Math.random() * 0.3, age: 0, size: 0.06 + Math.random() * 0.06, color: i % 3 ? PRISM_RAINBOW22[Math.floor(Math.random() * 7)] : '#ffffff', gravity: 9 }); }
  if (crit) { PRISM22.fx.push({ kind: 'ring', x, y, col: '255,255,255', t: 0, life: 0.35, r0: 0.3, r1: 2.6 }); screenShake(0.12); }
}
{
  const ks = katanaSwing;
  katanaSwing = function (p, slot, W, target) { if (W && W.prism) { prismSwing22(p, slot, W); return; } return ks(p, slot, W, target); };
  // a friend's ghosts fly (and sing) on your screen too (their game does the hitting)
  const ss = spawnShot13;
  spawnShot13 = function (s) {
    if (s && s.k === 'z') {
      const p = Game.player; if (!p || Game.screen === 'title' || Game.outside || Math.hypot(s.x - p.x, s.y - p.y) > 90) return;
      const g = { k: (s.i | 0) % PRISM22.swords.length, x: s.x, y: s.y, tx: s.tx, ty: s.ty, b: s.b, t: 0, dur: s.d || 0.5, trail: [], fake: true };
      PRISM22.list.push(g); prismLaunchFx22(g, s.x, s.y, s.tx, s.ty, false);
      return;
    }
    return ss(s);
  };
  // in your hand it shimmers through every colour
  const dhw = drawHeldWeapon;
  drawHeldWeapon = function (g, u, item, icon, o) {
    if (item === PRISMHEART) g.filter = `drop-shadow(0 0 ${Math.max(1, u * 1.6).toFixed(1)}px hsl(${Math.round(performance.now() / 6) % 360} 100% 70%))`;
    return dhw(g, u, item, icon, o);
  };
}
// where a ghost is: a loop out from you to its target and back (an ellipse), t from 0 to 1
function prismPos22(g) {
  const P = g.own ? playerCenter(g.own) : { x: g.x, y: g.y };
  const dx = g.tx - P.x, dy = g.ty - P.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, vx = -uy, vy = ux;
  const e = g.t / g.dur, th2 = Math.PI * 2 * (e + Math.sin(Math.PI * 2 * e) * 0.06);   // (a touch quicker through the middle of each half)
  const a = L / 2, cx = P.x + dx / 2, cy = P.y + dy / 2;
  const x = cx - a * Math.cos(th2) * ux + g.b * Math.sin(th2) * vx, y = cy - a * Math.cos(th2) * uy + g.b * Math.sin(th2) * vy;
  const tdx = a * Math.sin(th2) * ux + g.b * Math.cos(th2) * vx, tdy = a * Math.sin(th2) * uy + g.b * Math.cos(th2) * vy;
  return { x, y, ang: Math.atan2(tdy, tdx) };
}
PRISM22.fx = [];
B12.updaters.push(function prismGhosts22(dt, p) {
  const L = PRISM22.list;
  if (PRISM22.world !== Game.world) { PRISM22.world = Game.world; L.length = 0; PRISM22.fx.length = 0; }
  PRISM22.cutT = Math.max(0, PRISM22.cutT - dt);
  for (let i = PRISM22.fx.length - 1; i >= 0; i--) { const f = PRISM22.fx[i]; f.t += dt; if (f.t >= f.life) PRISM22.fx.splice(i, 1); }
  for (let i = L.length - 1; i >= 0; i--) {
    const g = L[i];
    g.t += dt;
    if (g.t >= g.dur || (g.own && (g.own.dead || g.own !== Game.player))) { L.splice(i, 1); continue; }
    const P = prismPos22(g);
    g.trail.unshift([P.x, P.y, P.ang]); if (g.trail.length > 12) g.trail.length = 12;
    // prism dust shed along the way
    if (Math.random() < dt * 26 * particleMul()) Game.particles.push({ x: P.x + (Math.random() - 0.5) * 0.5, y: P.y + (Math.random() - 0.5) * 0.5, vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8, life: 0.35 + Math.random() * 0.25, age: 0, size: 0.05 + Math.random() * 0.04, kind: 'star', color: PRISM_RAINBOW22[Math.floor(Math.random() * 7)], gravity: 0 });
    if (g.fake || !g.own) continue;
    // hits: straight through blocks, through everything in the way
    const tipX = P.x + Math.cos(P.ang) * 0.7, tipY = P.y + Math.sin(P.ang) * 0.7;
    for (const m of combatTargets()) {
      if (!prismCanHit22(m)) continue;
      if (boxDistToPoint(m, P.x, P.y) > 0.85 && boxDistToPoint(m, tipX, tipY) > 0.55) continue;
      const last = g.hits.get(m.id);
      if (last != null && g.t - last < PRISM22.hitEvery) continue;
      g.hits.set(m.id, g.t);
      const crit = Math.random() < PRISM22.crit || isCritFall(g.own);
      const base = weaponDamage(g.own, g.slot, g.W);
      hurtMob(m, Math.round(crit ? base * CRIT_MULT : base), g.own, crit, 'melee');
      const hx = (P.x + Math.max(m.x, Math.min(m.x + m.w, P.x))) / 2, hy = (P.y + Math.max(m.y, Math.min(m.y + m.h, P.y))) / 2;
      prismHitFx22(g, hx, hy, crit);
      if (crit) sfx('prism.crit', { x: hx, y: hy });
      else if (PRISM22.cutT <= 0) { PRISM22.cutT = 0.06; sfx('prism.hit', { x: hx, y: hy }); }
      if (!m.tamed && !m.def.villager && !m.def.npc && !m.isPlayerProxy) sendDogsAfter(m);
    }
  }
});

// ---- VISUALS: the ghosts (over the dark, they glow) ----
// in the glow pass: a ribbon of light behind each ghost, its halo, and the stars and rings of its hits
B12.glow.push(function prismGlow22(ox, oy, glow) {
  const T0 = TILE;
  for (const g of PRISM22.list) {
    const T = g.trail; if (T.length < 2) continue;
    const col = PRISM22.swords[g.k][1], fade = Math.min(1, (g.dur - g.t) / 0.12, g.t / 0.06);
    ctx.lineCap = 'round';
    for (let j = 1; j < T.length; j++) {
      const k = 1 - j / T.length;
      ctx.strokeStyle = `rgba(${col},${0.55 * k * fade})`; ctx.lineWidth = Math.max(1, T0 * 0.42 * k);
      ctx.beginPath(); ctx.moveTo(ox + T[j - 1][0] * T0, oy + T[j - 1][1] * T0); ctx.lineTo(ox + T[j][0] * T0, oy + T[j][1] * T0); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * k * fade})`; ctx.lineWidth = Math.max(1, T0 * 0.12 * k);
      ctx.stroke();
    }
    glow(ox + T[0][0] * T0, oy + T[0][1] * T0, T0 * 1.7, col, 0.5 * fade);
  }
  for (const f of PRISM22.fx) {
    const e = f.t / f.life, x = ox + f.x * T0, y = oy + f.y * T0;
    if (f.kind === 'ring') {
      ctx.strokeStyle = `rgba(${f.col},${0.9 * (1 - e)})`; ctx.lineWidth = Math.max(1, T0 * 0.12 * (1 - e));
      ctx.beginPath(); ctx.arc(x, y, T0 * (f.r0 + (f.r1 - f.r0) * Math.sqrt(e)), 0, 6.283); ctx.stroke();
    } else {   // a four-pointed star of light
      const s = T0 * f.size * (0.6 + 0.6 * Math.sin(Math.PI * Math.min(1, e * 1.4))), a = 1 - e;
      glow(x, y, s * 1.2, f.col, 0.6 * a);
      ctx.save(); ctx.translate(x, y); ctx.rotate(f.rot);
      for (const [w, c] of [[0.16, `rgba(${f.col},${a})`], [0.06, `rgba(255,255,255,${a})`]]) {
        ctx.fillStyle = c;
        for (let r = 0; r < 4; r++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * w, 0); ctx.lineTo(0, s * w * 0.6); ctx.lineTo(-s * w, 0); ctx.closePath(); ctx.fill(); }
      }
      ctx.restore();
    }
  }
  // the Prismheart in your hand gives off a little light that turns through the colours
  const p = Game.player, s = p && p.selectedSlot && p.selectedSlot();
  if (s && s.item === PRISMHEART && !p.dead) {
    const h = Math.round(performance.now() / 6) % 360, c = playerCenter(p), rgb = PRISM_RAINBOW22[Math.floor(h / 360 * 7)];
    const n = parseInt(rgb.slice(1), 16), str = `${n >> 16},${(n >> 8) & 255},${n & 255}`;
    glow(ox + (c.x + p.facing * 0.5) * T0, oy + (c.y - 0.2) * T0, T0 * (1.6 + (p.swing || 0)), str, 0.22 + 0.25 * (p.swing || 0));
  }
});
// the ghost swords themselves, with a few fading copies behind
B12.post.push(function prismDraw22(ox, oy) {
  const L = PRISM22.list; if (!L.length) return;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const sz = TILE * 1.5;
  for (const g of L) {
    const [item, col] = PRISM22.swords[g.k], icon = itemIcon[item]; if (!icon) continue;
    const fade = Math.min(1, (g.dur - g.t) / 0.12, g.t / 0.06);
    for (let j = Math.min(g.trail.length, 5) - 1; j >= 0; j--) {
      const [x, y, a] = g.trail[j];
      ctx.save(); ctx.translate(ox + x * TILE, oy + y * TILE); ctx.rotate(a + Math.PI / 4);
      if (j) { ctx.globalAlpha = 0.25 * (1 - j / 5) * fade; ctx.globalCompositeOperation = 'lighter'; }
      else { ctx.globalAlpha = 0.85 * fade; ctx.filter = `drop-shadow(0 0 ${Math.max(2, TILE * 0.14).toFixed(0)}px rgb(${col}))`; }
      ctx.drawImage(icon, 0, 0, icon.width, icon.height, -sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }
  }
  ctx.restore();
});
