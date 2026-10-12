'use strict';
// =============================================================================
// HELLFIRE - the strongest sword before Hardmode (and the two halves it's forged from)
//
//   HELLFIRE BASE (Crafting Table):   Demon Horn   Hellstone Ingot   Demon Horn
//                                     Hellstone    Hellfire Cleaver  Hellstone
//                                     Demon Horn   Hellstone Ingot   Demon Horn
//   HELLFIRE BLADE (Crafting Table):  Hellstone    Hellforged Sword  Hellstone
//                                     Hellstone    Hollow Blade      Hellstone
//                                     Hellstone    Ember Sword       Hellstone
//   HELLFIRE: the Base and the Blade together in a Crafting Table.
//
// WHAT IT DOES
//   Swings (hold to keep swinging), three in a row:
//     1, 2  RENDING FLAME - a great crescent of hellfire tears through the air in front of you and hangs
//           there for a moment, burning anything that touches it.
//     3     HELLMAW - you drive the blade into the ground and the earth splits: a line of fire geysers
//           erupts along the ground ahead of you, hurling enemies into the air.
//   Right-click: BRAND OF THE DAMNED - hurl a burning sigil at your cursor (through walls). It brands the
//           first enemy it touches; a moment later the brand DETONATES, and the fire leaps along chains to
//           brand up to three more enemies nearby, who detonate in turn. (4 s cooldown)
//   WRATH - every hit fills your Wrath (the bar under your feet). When it's full the blade is engulfed
//           and your next right-click opens THE GATES OF HELL: the sky turns red, the ground cracks open
//           around you, and giant claws of fire burst up under every enemy nearby and crush them.
//   SOUL FEAST - everything Hellfire kills screams out its soul, which flies into you and heals you.
//   While you hold it, embers pour off the blade and anything right next to you starts to burn.
// =============================================================================
const HELLFIRE_BASE = 504, HELLFIRE_BLADE = 505, HELLFIRE = 506;

// ---- STATS ----
const HF22 = {
  scarDmg: 0.45,       // Rending Flame: x weapon damage, once per crescent
  geyserDmg: 0.7,      // Hellmaw: each geyser
  geyserN: 7, geyserGap: 1.35, geyserDelay: 0.07,
  brandCd: 4, brandSpeed: 26, brandRange: 18, brandFuse: 1.1, brandDmg: 1.6, brandRadius: 3.2, brandSpread: 3, brandSpreadRange: 7,
  wrathMax: 100, wrathPerHit: 0.12, wrathHitMax: 4,   // (a hit adds dmg x 0.12, at most 4: about 20 swings into one enemy)
  gatesDmg: 2.4, gatesRange: 18, gatesMax: 10,
  soulHeal: 1,
  // live state
  scars: [], geysers: [], sigils: [], brands: [], booms: [], chains: [], souls: [], hands: [], cracks: [], fx: [],
  wrath: 0, wrathIdle: 0, brandT: 0, redT: 0, gates: null, world: null,
};
defWeapon(HELLFIRE, 'Hellfire', 'katana', HELL_TIER, 6000);
WEAPONS[HELLFIRE] = { type: 'katana', hellfire: true, dmg: 27, cd: 0.3, reach: 3.8, trail: '#ff3a12', heldSize: 34, noDash: true };   // (noDash: its right-click is the Brand / the Gates, see below)
ITEMS[HELLFIRE].burns = true;
defItem(HELLFIRE_BASE, 'Hellfire Base', { kind: 'material', stack: 1 });
defItem(HELLFIRE_BLADE, 'Hellfire Blade', { kind: 'material', stack: 1 });
Object.assign(ITEM_HINTS, {
  [HELLFIRE]: 'Swings tear crescents of hellfire through the air; every third swing splits the ground into a line of fire geysers. Right-click: Brand of the Damned (a sigil that brands, then detonates and chains). Hits fill your Wrath: when it\'s full, right-click opens THE GATES OF HELL. Every kill heals you',
  [HELLFIRE_BASE]: 'The hilt of Hellfire. Put it together with the Hellfire Blade in a Crafting Table',
  [HELLFIRE_BLADE]: 'The blade of Hellfire. Put it together with the Hellfire Base in a Crafting Table',
});

{   // its tooltip: what each attack does
  const wt = weaponTooltip;
  weaponTooltip = function (stack, W) {
    if (!W || !W.hellfire) return wt(stack, W);
    return '<div class="tt-blue" style="color:#ff6a2a">Cuts 1-2: RENDING FLAME (a crescent of hellfire)</div><div class="tt-blue" style="color:#ff6a2a">Cut 3: HELLMAW (a line of fire geysers)</div>'
      + `<div class="tt-blue" style="color:#ff6a2a">Right-click: BRAND OF THE DAMNED (every ${HF22.brandCd} s)</div><div class="tt-blue" style="color:#ff3a12">Full Wrath + right-click: THE GATES OF HELL</div>`
      + '<div class="tt-blue" style="color:#ffb070">Soul Feast: every kill heals you</div><div class="tt-blue">Sets everything it touches on fire</div>' + `<div class="tt-line">A cut every ${W.cd} s</div>`;
  };
}
// ---- RECIPES ----
addRecipe18({ result: HELLFIRE_BASE, qty: 1, shape: ['HIH', 'ICI', 'HIH'], key: { H: DEMON_HORN, I: HELLSTONE_INGOT, C: HELLFIRE_CLEAVER } });
addRecipe18({ result: HELLFIRE_BLADE, qty: 1, shape: ['IFI', 'IOI', 'IEI'], key: { I: HELLSTONE_INGOT, F: HELL_SWORD, O: HOLLOW_BLADE, E: EMBER_SWORD } });
RECIPES.push({ result: HELLFIRE, qty: 1, shapeless: [HELLFIRE_BASE, HELLFIRE_BLADE], name: 'Hellfire', w: 2, h: 2, table: true, needs: [{ item: HELLFIRE_BASE, qty: 1 }, { item: HELLFIRE_BLADE, qty: 1 }] });   // (the Base and the Blade, anywhere in a Crafting Table)
for (const G of CR_GROUPS18) {
  if (G[1] === 'Katanas') G[2].push(HELLFIRE);
  if (G[1] === 'Keys & Relics') G[2].push(HELLFIRE_BASE, HELLFIRE_BLADE);
}

// ---- TEXTURES (animated: 8 frames, the lava in the cracks pulses from the hilt to the tip) ----
const HF_ART22 = { [HELLFIRE]: 'Textures/items/hellfire/hellfire', [HELLFIRE_BASE]: 'Textures/items/hellfire/hellfire_base', [HELLFIRE_BLADE]: 'Textures/items/hellfire/hellfire_blade' };
for (const id in HF_ART22) BIG_ITEM_TEXTURES[id] = [HF_ART22[id] + '.png', 128];
{
  const frames = {};
  const cis = computeIconStyle;
  computeIconStyle = function (id) {
    if (HF_ART22[id]) return `background-image:url("${texUrl(HF_ART22[id] + '_anim.png')}");background-size:800% 100%;background-position:0% 0;animation:prism22 0.9s steps(8, jump-none) infinite;image-rendering:auto;`;
    return cis(id);
  };
  iconStyleCache.clear();
  for (const id in HF_ART22) {
    const img = new Image(), sheet = HF_ART22[id] + '_anim.png';
    img.onload = () => { const out = []; for (let k = 0; k < 8; k++) { const c = mkCanvas(128); c.height = 128; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, k * 128, 0, 128, 128, 0, 0, 128, 128); out.push(c); } frames[id] = out; };
    img.src = (window.TEXTURE_BUNDLE && window.TEXTURE_BUNDLE[sheet]) || sheet;
  }
  setInterval(() => { const k = Math.floor(performance.now() / 112) % 8; for (const id in frames) itemIcon[id] = frames[id][k]; }, 40);
  const fb = buildFallbackTextures;
  buildFallbackTextures = function () {
    fb();
    for (const id of [HELLFIRE, HELLFIRE_BASE, HELLFIRE_BLADE]) if (!itemIcon[id]) {
      const c = mkCanvas(TEX), g = c.getContext('2d'); g.translate(TEX / 2, TEX / 2); g.rotate(-Math.PI / 4);
      g.fillStyle = '#2a0c08'; if (id !== HELLFIRE_BASE) g.fillRect(-2, -TEX * 0.45, 4, TEX * 0.7); g.fillStyle = '#ff5a12'; if (id !== HELLFIRE_BASE) g.fillRect(-0.5, -TEX * 0.4, 1, TEX * 0.6);
      if (id !== HELLFIRE_BLADE) { g.fillStyle = '#1a0806'; g.fillRect(-5, TEX * 0.22, 10, 2); g.fillRect(-1, TEX * 0.22, 2, TEX * 0.2); }
      itemIcon[id] = c;
    }
  };
}

// ---- SOUNDS (the Terraria pack) ----
Object.assign(SOUNDS, {
  'hf.swing': { files: terraria_('dd2_betsy_fireball_shot', 2), vol: 0.42, pitch: [0.75, 0.9], cat: 'volPlayers' },
  'hf.scar': { files: ['terraria/dd2_betsy_flame_breath'], vol: 0.22, pitch: [1.2, 1.4], cat: 'volPlayers' },
  'hf.slam': { files: ['terraria/dd2_ogre_ground_pound'], vol: 0.55, pitch: [0.9, 1.05], cat: 'volPlayers' },
  'hf.geyser': { files: terraria_('dd2_flameburst_tower_shot', 2), vol: 0.35, pitch: [0.7, 0.95], cat: 'volPlayers' },
  'hf.brand': { files: terraria_('dd2_drakin_shot', 3), vol: 0.5, pitch: [0.7, 0.85], cat: 'volPlayers' },
  'hf.brandHit': { files: ['terraria/dd2_kobold_ignite'], vol: 0.5, pitch: [0.8, 1.0], cat: 'volPlayers' },
  'hf.boom': { files: terraria_('dd2_explosive_trap_explode', 2), vol: 0.5, pitch: [0.8, 1.0], cat: 'volPlayers' },
  'hf.wrath': { files: terraria_('dd2_drakin_breath_in', 3), vol: 0.6, pitch: [0.6, 0.7], cat: 'volPlayers' },
  'hf.roar': { files: ['terraria/roar_0', 'terraria/roar_2'], vol: 0.7, pitch: [0.55, 0.65], cat: 'volPlayers' },
  'hf.thunder': { files: ['terraria/thunder_0', 'terraria/thunder_2'], vol: 0.6, pitch: [0.8, 0.9], cat: 'volPlayers' },
  'hf.scream': { files: ['terraria/dd2_betsy_scream'], vol: 0.45, pitch: [0.5, 0.6], cat: 'volPlayers' },
  'hf.hand': { files: terraria_('dd2_betsy_fireball_impact', 2), vol: 0.5, pitch: [0.6, 0.8], cat: 'volPlayers' },
  'hf.soul': { files: terraria_('dd2_wither_beast_aura_pulse', 2), vol: 0.28, pitch: [1.5, 1.8], cat: 'volPlayers' },
});

// ---- helpers ----
function hfCan22(m) { return canWeaponHit(m) && !m.def.npc && !(m.def.pet && m.tamed) && !m.def.villager; }
function hfBurn22(m, s) { if (!m.def.boss && !m.def.fireproof) m.burn = Math.max(m.burn || 0, s); }
function hfLift22(m, v) { if (!m.def.boss && !m.segOf) m.vy = Math.min(m.vy || 0, -v); }
function hfMid22(m) { return { x: m.x + m.w / 2, y: m.y + m.h / 2 }; }
function hfHeld22(p) { const s = p && p.selectedSlot && p.selectedSlot(); return !!(s && s.item === HELLFIRE); }
function hfAim22(p, c) {
  if (Input.hasPointer) { const a = Math.atan2(Input.pointerWorldY - c.y, Input.pointerWorldX - c.x); return a; }
  return p.facing > 0 ? 0 : Math.PI;
}
function hfGround22(x, fromY) {   // the top of the ground near (x, fromY)
  const tx = Math.floor(x);
  for (let y = Math.floor(fromY) - 3; y < Math.floor(fromY) + 7; y++) if (solidAt(tx, y) && !solidAt(tx, y - 1)) return y;
  return Math.floor(fromY) + 1;
}
function hfEmbers22(x, y, n, sp, cols) {
  for (let i = 0; i < n * particleMul(); i++) { const a = Math.random() * 6.283, v = (0.4 + Math.random()) * sp; Game.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.4, life: 0.4 + Math.random() * 0.5, age: 0, size: 0.05 + Math.random() * 0.07, color: (cols || ['#ff3a12', '#ff8a1a', '#ffd04a', '#2a0a06'])[i % (cols ? cols.length : 4)], gravity: -1.5, kind: 'star' }); }
}
function hfSmoke22(x, y, n) {
  for (let i = 0; i < n * particleMul(); i++) Game.particles.push({ x: x + (Math.random() - 0.5) * 0.8, y: y + (Math.random() - 0.5) * 0.8, vx: (Math.random() - 0.5) * 1.2, vy: -0.8 - Math.random(), life: 0.8 + Math.random() * 0.6, age: 0, size: 0.25 + Math.random() * 0.3, color: Math.random() < 0.5 ? 'rgba(30,8,6,0.6)' : 'rgba(60,20,12,0.5)', gravity: -0.4, kind: 'poof' });
}

// ---- THE SWINGS ----
function hfSwing22(p, slot, W, target, ks) {
  ks(p, slot, W, target);                 // the cut itself (a katana's three-hit combo)
  const c = playerCenter(p), ang = hfAim22(p, c), combo = p.kCombo || 0;
  sfx('hf.swing', { pitch: 0.8 + combo * 0.06 });
  if (combo < 2) hfScar22(p, slot, W, c.x, c.y, ang, combo ? -1 : 1, false);
  else hfMaw22(p, slot, W, c.x, p.y + p.h, p.facing, false);
  netShot13({ k: 'hf', a: combo < 2 ? 's' : 'm', x: +c.x.toFixed(2), y: +(combo < 2 ? c.y : p.y + p.h).toFixed(2), an: +ang.toFixed(2), d: combo ? -1 : 1, f: p.facing });
}
// RENDING FLAME: a crescent of fire that hangs in the air
function hfScar22(p, slot, W, x, y, ang, dir, fake) {
  HF22.scars.push({ x, y, ang, dir, t: 0, life: 0.55, r: 3.7, hits: new Set(), dmg: fake ? 0 : Math.round(weaponDamage(p, slot, W) * HF22.scarDmg), fake, seed: Math.random() * 9 });
  if (!fake) sfx('hf.scar');
  for (let i = 0; i < 10 * particleMul(); i++) { const a = ang + (Math.random() - 0.5) * 2.2, r = 2 + Math.random() * 2; hfEmbers22(x + Math.cos(a) * r, y + Math.sin(a) * r, 1, 2.5); }
}
// HELLMAW: the ground splits in a line of fire geysers
function hfMaw22(p, slot, W, x, feetY, dir, fake) {
  const dmg = fake ? 0 : Math.round(weaponDamage(p, slot, W) * HF22.geyserDmg);
  for (let i = 0; i < HF22.geyserN; i++) {
    const gx = x + dir * (1.4 + i * HF22.geyserGap), gy = hfGround22(gx, feetY - 0.5);
    HF22.geysers.push({ x: gx, gy, delay: i * HF22.geyserDelay, t: 0, life: 0.75, h: 3 + Math.random() * 1.2 + (i === HF22.geyserN - 1 ? 1.5 : 0), hit: false, dmg, fake, i });
  }
  sfx('hf.slam'); if (!fake) screenShake(0.3);
  hfEmbers22(x + dir * 0.8, feetY - 0.2, 14, 4, ['#ff5a12', '#ffd04a', '#6a4a3a', '#2a1a14']);
}

// ---- RIGHT-CLICK: the Brand, or (Wrath full) the Gates of Hell ----
function hfAlt22(p, slot, W) {
  if (p.dead || p.riding) return;
  if (HF22.wrath >= HF22.wrathMax && !HF22.gates) { hfGates22(p, slot, W); return; }
  if (HF22.brandT > 0) return;
  HF22.brandT = HF22.brandCd;
  const c = playerCenter(p), ang = hfAim22(p, c);
  startAction(p, 'kthrust', false); p.swing = 1;
  hfSigil22(p, slot, W, c.x, c.y, ang, false);
  netShot13({ k: 'hf', a: 'b', x: +c.x.toFixed(2), y: +c.y.toFixed(2), an: +ang.toFixed(2) });
}
function hfSigil22(p, slot, W, x, y, ang, fake) {
  HF22.sigils.push({ x: x + Math.cos(ang) * 0.8, y: y + Math.sin(ang) * 0.8, vx: Math.cos(ang) * HF22.brandSpeed, vy: Math.sin(ang) * HF22.brandSpeed, t: 0, life: HF22.brandRange / HF22.brandSpeed, fake, own: fake ? null : p, slot, W, trail: [] });
  sfx('hf.brand', fake ? { x, y } : undefined);
}
function hfBrand22(m, gen, fuse, own, slot, W) {
  if (m._hfBranded) return;
  m._hfBranded = true;
  HF22.brands.push({ m, gen, t: 0, fuse, own, slot, W });
  sfx('hf.brandHit', { x: m.x + m.w / 2, y: m.y + m.h / 2 });
}
function hfBoom22(x, y, r, dmg, own, gen, slot, W, fake) {
  HF22.booms.push({ x, y, r, t: 0, life: 0.5, seed: Math.random() * 9 });
  sfx('hf.boom', { x, y }); if (!fake) screenShake(0.28);
  flashAt(x, y, r * 1.2, '255,90,30', 0.18);
  hfEmbers22(x, y, 26, 7); hfSmoke22(x, y, 8);
  if (fake || !own) return;
  const hit = [];
  for (const m of combatTargets()) {
    if (!hfCan22(m) || boxDistToPoint(m, x, y) > r) continue;
    hurtMob(m, dmg, own, false, 'melee'); hfBurn22(m, 5); hfLift22(m, 5); hit.push(m);
  }
  if (gen === 0) {   // the fire leaps along chains to brand a few more
    const near = combatTargets().filter(m => hfCan22(m) && !m._hfBranded && m.dying == null && boxDistToPoint(m, x, y) < HF22.brandSpreadRange)
      .sort((a, b) => boxDistToPoint(a, x, y) - boxDistToPoint(b, x, y)).slice(0, HF22.brandSpread);
    for (const m of near) { const c = hfMid22(m); HF22.chains.push({ x0: x, y0: y, x1: c.x, y1: c.y, t: 0, life: 0.35 }); hfBrand22(m, 1, 0.5, own, slot, W); netShot13({ k: 'hf', a: 'c', x: +x.toFixed(2), y: +y.toFixed(2), x1: +c.x.toFixed(2), y1: +c.y.toFixed(2) }); }
  }
  netShot13({ k: 'hf', a: 'x', x: +x.toFixed(2), y: +y.toFixed(2), r });
}
// THE GATES OF HELL
function hfGates22(p, slot, W, fake, at) {
  const c = at || playerCenter(p), feet = at ? at.feet : p.y + p.h;
  if (!fake) {
    HF22.wrath = 0;
    startAction(p, 'kthrust', false); p.swing = 1;
    netShot13({ k: 'hf', a: 'g', x: +c.x.toFixed(2), y: +c.y.toFixed(2), feet: +feet.toFixed(2) });
  }
  const G = { x: c.x, feet, t: 0, next: 0.35, queue: [], fake };
  if (!fake) {
    const foes = combatTargets().filter(m => hfCan22(m) && Math.hypot(m.x + m.w / 2 - c.x, m.y + m.h / 2 - c.y) < HF22.gatesRange)
      .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)).slice(0, HF22.gatesMax);
    for (const m of foes) G.queue.push({ m });
    G.dmg = Math.round(weaponDamage(p, slot, W) * HF22.gatesDmg); G.own = p;
  }
  for (let i = G.queue.length; i < 6 + (fake ? 4 : 0); i++) G.queue.push({ x: c.x + (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 9) });   // more claws, just for the dread
  HF22.gates = G;
  HF22.redT = 3.2;
  sfx('hf.roar', fake ? { x: c.x, y: c.y } : undefined); sfx('hf.thunder', fake ? { x: c.x, y: c.y } : undefined); sfx('hf.scream', fake ? { x: c.x, y: c.y } : undefined);
  if (!fake) { screenShake(0.9); eventMessage('THE GATES OF HELL OPEN', '#ff3a12'); }
  // the ground cracks open around you
  for (let i = 0; i < 8; i++) {   // jagged cracks, running out through the ground, with a few forks
    const dir = i % 2 ? 1 : -1, len = 3 + Math.random() * 8, depth = 0.15 + Math.random() * 0.6, pts = [];
    let x = c.x + dir * Math.random() * 1.5, sy = hfGround22(x, feet - 0.5);
    for (let s = 0; s < len; s += 0.45) { x += dir * (0.3 + Math.random() * 0.3); const gy = hfGround22(x, sy + 0.5); sy = gy; pts.push([x, gy + depth * (0.5 + 0.5 * Math.sin(s * 1.3)) + (Math.random() - 0.5) * 0.35]); }
    HF22.cracks.push({ pts, t: 0, life: 3.4, w: 0.07 + Math.random() * 0.07, delay: Math.random() * 0.2 });
    if (pts.length > 6) { const j = 2 + Math.floor(Math.random() * (pts.length - 4)), fk = [pts[j]]; let [fx, fy] = pts[j]; for (let s = 0; s < 4; s++) { fx += dir * 0.4; fy += 0.25 + Math.random() * 0.2; fk.push([fx, fy]); } HF22.cracks.push({ pts: fk, t: 0, life: 3.2, w: 0.05, delay: 0.25 }); }
  }
  hfEmbers22(c.x, feet - 0.3, 40, 8);
}

// ---- hooking into the katana ----
{
  const ks = katanaSwing;
  katanaSwing = function (p, slot, W, target) { if (W && W.hellfire) return hfSwing22(p, slot, W, target, ks); return ks(p, slot, W, target); };
  const kd = katanaDash;
  katanaDash = function (p, slot, W) { if (W && W.hellfire) return hfAlt22(p, slot, W); return kd(p, slot, W); };
  // WRATH and SOUL FEAST: every hit Hellfire lands
  const hm = hurtMob;
  hurtMob = function (mob, dmg, attacker, crit, kind) {
    const mine = attacker === Game.player && hfHeld22(Game.player) && mob && mob.dying == null;
    const r = hm(mob, dmg, attacker, crit, kind);
    if (mine && dmg > 0) {
      const was = HF22.wrath < HF22.wrathMax;
      HF22.wrath = Math.min(HF22.wrathMax, HF22.wrath + Math.min(HF22.wrathHitMax, dmg * HF22.wrathPerHit)); HF22.wrathIdle = 0;
      if (was && HF22.wrath >= HF22.wrathMax) {
        sfx('hf.wrath'); flashAt(Game.player.x + Game.player.w / 2, Game.player.y + 0.8, 2.5, '255,40,10', 0.25);
        if (!Settings.hfTip22) { Settings.hfTip22 = true; try { saveSettings(); } catch (e) { } showToast('WRATH is full! Right-click to open THE GATES OF HELL'); }
      }
      const m = mob.segOf || mob;
      if (m.dying != null && !m._hfSoul) { m._hfSoul = true; const c = hfMid22(m); HF22.souls.push({ x: c.x, y: c.y, vx: (Math.random() - 0.5) * 6, vy: -5 - Math.random() * 3, t: 0, heal: m.def.boss ? 6 : HF22.soulHeal }); sfx('hf.soul', { x: c.x, y: c.y }); }
    }
    return r;
  };
  // a friend's Hellfire on your screen (their game does the damage)
  const ss = spawnShot13;
  spawnShot13 = function (s) {
    if (s && s.k === 'hf') {
      const p = Game.player; if (!p || Game.screen === 'title' || Game.outside || Math.hypot(s.x - p.x, s.y - p.y) > 90) return;
      if (s.a === 's') hfScar22(null, null, null, s.x, s.y, s.an, s.d, true);
      else if (s.a === 'm') hfMaw22(null, null, null, s.x, s.y, s.f, true);
      else if (s.a === 'b') hfSigil22(null, null, null, s.x, s.y, s.an, true);
      else if (s.a === 'x') hfBoom22(s.x, s.y, s.r || 3, 0, null, 1, null, null, true);
      else if (s.a === 'c') HF22.chains.push({ x0: s.x, y0: s.y, x1: s.x1, y1: s.y1, t: 0, life: 0.35 });
      else if (s.a === 'g') hfGates22(null, null, null, true, { x: s.x, y: s.y, feet: s.feet });
      return;
    }
    return ss(s);
  };
  // in your hand: it smoulders, and burns brighter as your Wrath fills
  const dhw = drawHeldWeapon;
  drawHeldWeapon = function (g, u, item, icon, o) {
    if (item === HELLFIRE) {
      const k = HF22.wrath / HF22.wrathMax, fl = 0.7 + 0.3 * Math.sin(performance.now() / 70) * Math.sin(performance.now() / 113);
      g.filter = `drop-shadow(0 0 ${Math.max(1, u * (1.4 + k * 2.4) * fl).toFixed(1)}px rgba(255,${60 + 60 * (1 - k) | 0},10,${0.75 + 0.25 * k}))`;
    }
    return dhw(g, u, item, icon, o);
  };
}

// ---- every frame ----
B12.updaters.push(function hellfireTick22(dt, p) {
  if (HF22.world !== Game.world) { HF22.world = Game.world; for (const k of ['scars', 'geysers', 'sigils', 'brands', 'booms', 'chains', 'souls', 'hands', 'cracks']) HF22[k].length = 0; HF22.gates = null; HF22.wrath = 0; }
  HF22.brandT = Math.max(0, HF22.brandT - dt); HF22.redT = Math.max(0, HF22.redT - dt);
  HF22.wrathIdle += dt; if (HF22.wrathIdle > 8 && HF22.wrath < HF22.wrathMax) HF22.wrath = Math.max(0, HF22.wrath - dt * 6);   // it cools off if you stop fighting (not once it's full)
  const T = combatTargets();
  // Rending Flame
  for (let i = HF22.scars.length - 1; i >= 0; i--) {
    const S = HF22.scars[i]; S.t += dt; if (S.t >= S.life) { HF22.scars.splice(i, 1); continue; }
    if (Math.random() < dt * 30 * particleMul()) { const a = S.ang + (Math.random() - 0.5) * 2.2; hfEmbers22(S.x + Math.cos(a) * S.r, S.y + Math.sin(a) * S.r, 1, 1.5); }
    if (S.fake || !p || p.dead) continue;
    for (const m of T) {
      if (S.hits.has(m.id) || !hfCan22(m)) continue;
      const c = hfMid22(m), dx = c.x - S.x, dy = c.y - S.y, d = Math.hypot(dx, dy);
      let da = Math.atan2(dy, dx) - S.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (d < S.r + Math.max(m.w, m.h) / 2 && Math.abs(da) < 1.25) { S.hits.add(m.id); hurtMob(m, S.dmg, p, false, 'melee'); hfBurn22(m, 4); hfEmbers22(c.x, c.y, 6, 3); }
    }
  }
  // Hellmaw geysers
  for (let i = HF22.geysers.length - 1; i >= 0; i--) {
    const G = HF22.geysers[i]; G.t += dt;
    if (G.t < G.delay) continue;
    const e = G.t - G.delay;
    if (e >= G.life) { HF22.geysers.splice(i, 1); continue; }
    if (!G.hit) {
      G.hit = true;
      if (G.i % 2 === 0) sfx('hf.geyser', { x: G.x, y: G.gy });
      hfEmbers22(G.x, G.gy - 0.2, 10, 6, ['#ff5a12', '#ffd04a', '#5a3a2a', '#2a1a14']); hfSmoke22(G.x, G.gy - 1, 3);
      if (!G.fake && p) for (const m of T) {
        if (!hfCan22(m)) continue;
        if (m.x + m.w > G.x - 0.8 && m.x < G.x + 0.8 && m.y + m.h > G.gy - G.h && m.y < G.gy + 0.3) { hurtMob(m, G.dmg, p, false, 'melee'); hfBurn22(m, 5); hfLift22(m, 11); }
      }
    }
    if (Math.random() < dt * 40 * particleMul()) Game.particles.push({ x: G.x + (Math.random() - 0.5) * 0.8, y: G.gy - Math.random() * G.h * 0.8, vx: (Math.random() - 0.5) * 1.5, vy: -4 - Math.random() * 4, life: 0.4, age: 0, size: 0.07, color: Math.random() < 0.5 ? '#ffd04a' : '#ff5a12', gravity: -1, kind: 'star' });
  }
  // the Brand's sigil in flight
  for (let i = HF22.sigils.length - 1; i >= 0; i--) {
    const S = HF22.sigils[i]; S.t += dt; S.x += S.vx * dt; S.y += S.vy * dt;
    S.trail.unshift([S.x, S.y]); if (S.trail.length > 10) S.trail.pop();
    if (Math.random() < dt * 40 * particleMul()) hfEmbers22(S.x, S.y, 1, 1.5);
    let done = S.t >= S.life;
    if (!S.fake && S.own) for (const m of T) {
      if (!hfCan22(m) || m._hfBranded || boxDistToPoint(m, S.x, S.y) > 0.6) continue;
      hfBrand22(m, 0, HF22.brandFuse, S.own, S.slot, S.W); done = true; break;
    }
    if (done) { HF22.sigils.splice(i, 1); if (S.t >= S.life && !S.fake && S.own) hfBoom22(S.x, S.y, 2, Math.round(weaponDamage(S.own, S.slot, S.W) * 0.8), S.own, 1, S.slot, S.W); }
  }
  // brands burning down to their detonation
  for (let i = HF22.brands.length - 1; i >= 0; i--) {
    const B = HF22.brands[i]; B.t += dt;
    const m = B.m, c = hfMid22(m);
    if (Math.random() < dt * 25 * particleMul()) hfEmbers22(c.x, c.y - m.h / 2, 1, 1.5);
    if (B.t >= B.fuse || m.dying != null || m.dead) {
      HF22.brands.splice(i, 1); m._hfBranded = false;
      hfBoom22(c.x, c.y, HF22.brandRadius, Math.round(weaponDamage(B.own, B.slot, B.W) * HF22.brandDmg * (B.gen ? 0.7 : 1)), B.own, B.gen, B.slot, B.W);
    }
  }
  for (const A of [HF22.booms, HF22.chains, HF22.cracks]) for (let i = A.length - 1; i >= 0; i--) { A[i].t += dt; if (A[i].t >= A[i].life) A.splice(i, 1); }
  // souls flying home
  for (let i = HF22.souls.length - 1; i >= 0; i--) {
    const S = HF22.souls[i]; S.t += dt;
    if (!p || p.dead) { HF22.souls.splice(i, 1); continue; }
    const c = playerCenter(p), dx = c.x - S.x, dy = c.y - S.y, d = Math.hypot(dx, dy), pull = 30 + S.t * 60;
    S.vx += dx / (d || 1) * pull * dt; S.vy += dy / (d || 1) * pull * dt; S.vx *= Math.pow(0.15, dt); S.vy *= Math.pow(0.15, dt);
    S.x += S.vx * dt; S.y += S.vy * dt;
    if (Math.random() < dt * 30 * particleMul()) Game.particles.push({ x: S.x, y: S.y, vx: 0, vy: -0.5, life: 0.4, age: 0, size: 0.06, color: Math.random() < 0.5 ? '#ffb070' : '#ffe0c0', gravity: 0, kind: 'star' });
    if (d < 0.6 || S.t > 3) { HF22.souls.splice(i, 1); p.heal(S.heal); flashAt(c.x, c.y, 1.4, '255,140,60', 0.15); hfEmbers22(c.x, c.y, 8, 2.5, ['#ffd0a0', '#ff8a3a']); }
  }
  // the Gates of Hell: claws of fire, one after another
  const Gt = HF22.gates;
  if (Gt) {
    Gt.t += dt;
    while (Gt.queue.length && Gt.t >= Gt.next) {
      const q = Gt.queue.shift(); Gt.next += 0.11;
      const x = q.m ? q.m.x + q.m.w / 2 : q.x, gy = hfGround22(x, q.m ? q.m.y + q.m.h : Gt.feet - 0.3);
      HF22.hands.push({ x, gy, m: q.m || null, t: 0, life: 1.15, hit: false, side: Math.random() < 0.5 ? -1 : 1, s: q.m && q.m.def.boss ? 1.6 : 1 + Math.random() * 0.3 });
    }
    if (!Gt.queue.length && Gt.t > Gt.next + 1.4) HF22.gates = null;
  }
  for (let i = HF22.hands.length - 1; i >= 0; i--) {
    const H = HF22.hands[i]; H.t += dt;
    if (H.t >= H.life) { HF22.hands.splice(i, 1); continue; }
    if (H.t > 0.05 && !H.rose) { H.rose = true; sfx('hf.hand', { x: H.x, y: H.gy }); hfEmbers22(H.x, H.gy - 0.2, 16, 7, ['#ff5a12', '#ffd04a', '#4a2a1a', '#1a0806']); screenShake(0.12); }
    if (H.t > 0.32 && !H.hit) {
      H.hit = true;
      const Gt2 = HF22.gates || {};
      if (H.m && H.m.dying == null && Gt2.own && Gt2.own === p) { hurtMob(H.m, Gt2.dmg, p, true, 'melee'); hfBurn22(H.m, 6); hfLift22(H.m, 7); }
      flashAt(H.x, H.gy - 2, 2.5 * H.s, '255,70,20', 0.16);
    }
  }
  // while you hold it: embers off the blade, and anything right next to you starts to burn
  if (p && !p.dead && hfHeld22(p)) {
    const c = playerCenter(p), full = HF22.wrath >= HF22.wrathMax;
    if (Math.random() < dt * (full ? 40 : 12) * particleMul()) Game.particles.push({ x: c.x + p.facing * (0.4 + Math.random() * 1.1), y: c.y - 0.2 - Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.8, vy: -1 - Math.random() * 1.5, life: 0.5 + Math.random() * 0.4, age: 0, size: 0.05 + Math.random() * 0.05, color: full ? (Math.random() < 0.4 ? '#1a0604' : '#ff2a0a') : (Math.random() < 0.5 ? '#ff6a1a' : '#ffc04a'), gravity: -1.2, kind: 'star' });
    p.hfAuraT = (p.hfAuraT || 0) - dt;
    if (p.hfAuraT <= 0) { p.hfAuraT = 1; for (const m of T) if (hfCan22(m) && boxGap(p, m) < 1.2) hfBurn22(m, 2); }
  }
});

// ---- DRAWING ----
// a ragged tongue of flame from (x0,y0) toward (x1,y1), in screen pixels
function hfFlame22(x0, y0, x1, y1, w, a, t, seed) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, N = 8, pts = [];
  for (let s = 0; s <= N; s++) { const f = s / N, ww = w * (1 - f) * (0.7 + 0.3 * Math.sin(t * 25 + seed + s * 2.1)); pts.push([x0 + dx * f + nx * ww, y0 + dy * f + ny * ww]); }
  for (let s = N; s >= 0; s--) { const f = s / N, ww = w * (1 - f) * (0.7 + 0.3 * Math.sin(t * 23 + seed * 1.7 + s * 1.7)); pts.push([x0 + dx * f - nx * ww, y0 + dy * f - ny * ww]); }
  const layers = [[1, `rgba(120,8,0,${0.75 * a})`], [0.7, `rgba(255,70,10,${0.85 * a})`], [0.42, `rgba(255,180,40,${0.9 * a})`], [0.18, `rgba(255,250,200,${a})`]];
  for (const [k, col] of layers) {
    ctx.fillStyle = col; ctx.beginPath();
    pts.forEach(([px, py], j) => { const qx = x0 + (px - x0) * 1, qy = y0 + (py - y0) * 1; const cx = (j <= N) ? x0 + dx * (j / N) : x0 + dx * ((2 * N + 1 - j) / N), cy = (j <= N) ? y0 + dy * (j / N) : y0 + dy * ((2 * N + 1 - j) / N); const X = cx + (qx - cx) * k, Y = cy + (qy - cy) * k; if (!j) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
    ctx.closePath(); ctx.fill();
  }
}
B12.glow.push(function hellfireGlow22(ox, oy, glow) {
  const T0 = TILE, now = Game.time;
  // the cracks in the ground (Gates of Hell)
  for (const C of HF22.cracks) {
    const grow = Math.max(0, Math.min(1, (C.t - (C.delay || 0)) / 0.35)), fade = Math.min(1, (C.life - C.t) / 0.8), n = Math.max(2, Math.floor(C.pts.length * grow));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [w, col] of [[C.w * 2.4, `rgba(255,40,0,${0.3 * fade})`], [C.w * 1.2, `rgba(255,120,20,${0.85 * fade})`], [C.w * 0.45, `rgba(255,240,170,${fade})`]]) {
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, T0 * w); ctx.beginPath();
      for (let j = 0; j < n; j++) { const [x, y] = C.pts[j]; if (!j) ctx.moveTo(ox + x * T0, oy + y * T0); else ctx.lineTo(ox + x * T0, oy + y * T0); }
      ctx.stroke();
    }
  }
  // Rending Flame: a crescent of hellfire
  for (const S of HF22.scars) {
    const e = S.t / S.life, sweep = Math.min(1, S.t / 0.07), fade = e < 0.6 ? 1 : 1 - (e - 0.6) / 0.4;
    const N = 22, a0 = S.ang - 1.15 * S.dir, span = 2.3 * S.dir * sweep, cx = ox + S.x * T0, cy = oy + S.y * T0;
    glow(cx + Math.cos(S.ang) * S.r * 0.7 * T0, cy + Math.sin(S.ang) * S.r * 0.7 * T0, T0 * 3.5, '255,70,10', 0.4 * fade);
    for (let j = 0; j < N; j++) {
      const f = j / (N - 1), a = a0 + span * f, mid = Math.sin(Math.PI * f), r = S.r * T0 * (0.92 + 0.08 * Math.sin(j * 1.9 + S.seed));
      const x0 = cx + Math.cos(a) * r * 0.62, y0 = cy + Math.sin(a) * r * 0.62;
      const lick = (0.35 + 0.65 * mid) * (1 + 0.35 * Math.sin(now * 30 + j * 2.7 + S.seed));
      const x1 = cx + Math.cos(a) * r * (1 + 0.28 * lick), y1 = cy + Math.sin(a) * r * (1 + 0.28 * lick) - T0 * 0.5 * lick * e;
      hfFlame22(x0, y0, x1, y1, T0 * 0.32 * (0.4 + mid), fade * (0.6 + 0.4 * mid), now, j + S.seed);
    }
    ctx.strokeStyle = `rgba(255,250,220,${0.8 * fade})`; ctx.lineWidth = Math.max(1, T0 * 0.08); ctx.beginPath(); ctx.arc(cx, cy, S.r * T0 * 0.8, Math.min(a0, a0 + span), Math.max(a0, a0 + span)); ctx.stroke();
  }
  // Hellmaw: pillars of fire
  for (const G of HF22.geysers) {
    if (G.t < G.delay) continue;
    const e = (G.t - G.delay) / G.life, rise = Math.min(1, e / 0.15), fall = e > 0.6 ? 1 - (e - 0.6) / 0.4 : 1, h = G.h * rise * (0.6 + 0.4 * fall);
    const x = ox + G.x * T0, y = oy + G.gy * T0;
    glow(x, y - h * T0 * 0.5, T0 * (1.8 + h * 0.4), '255,80,10', 0.45 * fall);
    for (let k = 0; k < 4; k++) hfFlame22(x + (k - 1.5) * T0 * 0.25, y, x + (k - 1.5) * T0 * 0.15 + Math.sin(now * 20 + k) * T0 * 0.2, y - h * T0 * (0.75 + 0.25 * Math.sin(now * 17 + k * 2 + G.i)), T0 * 0.45, fall, now, k * 3 + G.i);
    ctx.fillStyle = `rgba(255,200,80,${0.9 * fall})`; ctx.fillRect(x - T0 * 0.7, y - T0 * 0.08, T0 * 1.4, T0 * 0.16);   // the split in the ground
  }
  // the Brand's sigil: a spinning ring of runes trailing fire
  for (const S of HF22.sigils) {
    for (let j = 1; j < S.trail.length; j++) { const k = 1 - j / S.trail.length; ctx.strokeStyle = `rgba(255,${80 + 80 * k | 0},20,${0.6 * k})`; ctx.lineWidth = Math.max(1, T0 * 0.45 * k); ctx.beginPath(); ctx.moveTo(ox + S.trail[j - 1][0] * T0, oy + S.trail[j - 1][1] * T0); ctx.lineTo(ox + S.trail[j][0] * T0, oy + S.trail[j][1] * T0); ctx.stroke(); }
    hfSigilDraw22(ox + S.x * T0, oy + S.y * T0, T0 * 0.6, now * 9, 1, glow);
  }
  // brands on their victims: the sigil, burning brighter and faster until it goes off
  for (const B of HF22.brands) {
    const m = B.m, k = B.t / B.fuse, x = ox + (m.x + m.w / 2) * T0, y = oy + (m.y - 0.6) * T0;
    hfSigilDraw22(x, y, T0 * (0.55 + 0.25 * k), now * (4 + 14 * k), 0.7 + 0.3 * Math.sin(now * (8 + 30 * k)), glow);
    ctx.strokeStyle = `rgba(255,60,10,${0.5 + 0.4 * k})`; ctx.lineWidth = Math.max(1, T0 * 0.08); ctx.setLineDash([T0 * 0.2, T0 * 0.12]);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ox + (m.x + m.w / 2) * T0, oy + (m.y + m.h / 2) * T0); ctx.stroke(); ctx.setLineDash([]);
  }
  // chains of fire leaping between brands
  for (const C of HF22.chains) {
    const a = 1 - C.t / C.life, N = 10;
    ctx.strokeStyle = `rgba(255,120,30,${a})`; ctx.lineWidth = Math.max(1, T0 * 0.14); ctx.beginPath();
    for (let j = 0; j <= N; j++) { const f = j / N, x = C.x0 + (C.x1 - C.x0) * f, y = C.y0 + (C.y1 - C.y0) * f + (j % 2 ? 0.25 : -0.25) * Math.sin(f * Math.PI); if (!j) ctx.moveTo(ox + x * T0, oy + y * T0); else ctx.lineTo(ox + x * T0, oy + y * T0); }
    ctx.stroke();
  }
  // detonations
  for (const B of HF22.booms) {
    const e = B.t / B.life, x = ox + B.x * T0, y = oy + B.y * T0, R = B.r * T0 * (0.3 + 0.9 * Math.sqrt(e)), a = 1 - e;
    glow(x, y, R * 1.6, '255,80,10', 0.7 * a);
    for (let j = 0; j < 14; j++) { const an = j / 14 * 6.283 + B.seed; hfFlame22(x + Math.cos(an) * R * 0.3, y + Math.sin(an) * R * 0.3, x + Math.cos(an) * R, y + Math.sin(an) * R - T0 * e, T0 * 0.4 * a, a, now, j + B.seed); }
    ctx.strokeStyle = `rgba(255,230,160,${a})`; ctx.lineWidth = Math.max(1, T0 * 0.15 * a); ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.stroke();
  }
  // the claws of the Gates of Hell
  for (const H of HF22.hands) hfHandDraw22(ox + H.x * T0, oy + H.gy * T0, H, T0, now, glow);
  // souls: little screaming faces of fire, flying into you
  for (const S of HF22.souls) {
    const x = ox + S.x * T0, y = oy + S.y * T0, r = T0 * 0.32, ang = Math.atan2(S.vy, S.vx);
    glow(x, y, T0 * 1.2, '255,150,70', 0.55);
    hfFlame22(x, y, x - Math.cos(ang) * T0 * 1.3, y - Math.sin(ang) * T0 * 1.3, r, 0.8, now, 3);
    ctx.save(); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255,236,210,0.95)'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#2a0604'; ctx.fillRect(x - r * 0.55, y - r * 0.35, r * 0.35, r * 0.4); ctx.fillRect(x + r * 0.2, y - r * 0.35, r * 0.35, r * 0.4);
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.4, r * 0.22, r * (0.3 + 0.15 * Math.sin(now * 30)), 0, 0, 6.283); ctx.fill();   // its mouth, screaming
    ctx.restore();
  }
  // Wrath, full: the blade in your hand is engulfed
  const p = Game.player;
  if (p && !p.dead && hfHeld22(p) && HF22.wrath >= HF22.wrathMax) {
    const c = playerCenter(p); glow(ox + (c.x + p.facing * 0.7) * T0, oy + (c.y - 0.3) * T0, T0 * (2.2 + 0.3 * Math.sin(now * 12)), '255,40,0', 0.45);
  }
});
function hfSigilDraw22(x, y, R, rot, a, glow) {
  glow(x, y, R * 2.4, '255,70,10', 0.6 * a);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = `rgba(255,120,30,${a})`; ctx.lineWidth = Math.max(1, R * 0.14);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, 6.283); ctx.stroke();
  ctx.fillStyle = `rgba(255,220,140,${a})`;
  for (let k = 0; k < 6; k++) { ctx.rotate(Math.PI / 3); ctx.fillRect(R * 0.68, -R * 0.07, R * 0.26, R * 0.14); ctx.fillRect(R * 0.78, -R * 0.2, R * 0.08, R * 0.4); }   // runes
  ctx.strokeStyle = `rgba(255,240,200,${a})`; ctx.lineWidth = Math.max(1, R * 0.1);
  ctx.beginPath(); for (let k = 0; k <= 3; k++) { const an = k / 3 * 6.283; const X = Math.cos(an) * R * 0.6, Y = Math.sin(an) * R * 0.6; if (!k) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); } ctx.stroke();   // a burning triangle at its heart
  ctx.restore();
}
// a claw of fire bursting up out of the ground and closing on what's above it
function hfHandDraw22(x, gy, H, T0, now, glow) {
  const e = H.t / H.life, rise = 1 - Math.pow(1 - Math.min(1, H.t / 0.22), 3), close = Math.max(0, Math.min(1, (H.t - 0.2) / 0.14)), sink = e > 0.68 ? (e - 0.68) / 0.32 : 0;
  const S = T0 * H.s, h = S * 3.6 * rise * (1 - sink * 0.95), a = 1 - sink * 0.6;
  if (h < 2) return;
  glow(x, gy - h * 0.7, S * 2.2, '255,60,10', 0.3 * a);
  ctx.save(); ctx.translate(x, gy); ctx.scale(H.side, 1); ctx.globalCompositeOperation = 'source-over';   // (the glow pass adds light: a charred claw has to be painted over it)
  const wob = Math.sin(now * 6 + H.x) * S * 0.08;
  // build the silhouette: forearm, palm, four fingers and a thumb (each finger: 3 joints, curling in as it closes)
  const shapes = [];
  const wristY = -h * 0.62, palmY = -h * 0.74;
  shapes.push([[-S * 0.5, 0], [-S * 0.42 + wob, wristY], [S * 0.42 + wob, wristY], [S * 0.5, 0]]);
  shapes.push([[-S * 0.62 + wob, wristY], [-S * 0.7 + wob, palmY - S * 0.2], [-S * 0.3 + wob, palmY - S * 0.45], [S * 0.35 + wob, palmY - S * 0.45], [S * 0.72 + wob, palmY - S * 0.15], [S * 0.58 + wob, wristY]]);
  const tips = [], veins = [];
  const fingers = [[-0.55, -2.1, 1.0, 0.34], [-0.2, -1.78, 1.2, 0.36], [0.15, -1.45, 1.15, 0.34], [0.48, -1.15, 0.95, 0.3], [0.72, -0.35, 0.8, 0.32]];   // [base x, angle, length, width] (the last is the thumb)
  fingers.forEach(([bx, ang, len, wd], fi) => {
    let fx = bx * S + wob, fy = palmY - S * 0.35, an = ang, L = [], R = [], vein = [[fx, fy]];
    const curl = close * (fi === 4 ? -0.9 : 0.62) + Math.sin(now * 7 + fi) * 0.04;
    for (let seg = 0; seg < 3; seg++) {
      const w = S * wd * (1 - seg * 0.28), nx = -Math.sin(an), ny = Math.cos(an);
      L.push([fx + nx * w / 2, fy + ny * w / 2]); R.push([fx - nx * w / 2, fy - ny * w / 2]);
      fx += Math.cos(an) * S * len * 0.4; fy += Math.sin(an) * S * len * 0.4; vein.push([fx, fy]);
      an += curl * (fi === 4 ? -1 : 1) * (H.side > 0 ? 1 : 1);
    }
    const tipx = fx + Math.cos(an) * S * 0.35, tipy = fy + Math.sin(an) * S * 0.35;   // the talon
    shapes.push([...L, [tipx, tipy], ...R.reverse()]);
    tips.push([fx, fy, tipx, tipy]); veins.push(vein);
  });
  const path = (pts) => { ctx.beginPath(); pts.forEach(([px, py], j) => j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); };
  // a glowing rim of fire around the whole claw
  ctx.lineJoin = 'round';
  for (const [w, col] of [[S * 0.34, `rgba(255,50,0,${0.35 * a})`], [S * 0.16, `rgba(255,140,30,${0.8 * a})`]]) { ctx.strokeStyle = col; ctx.lineWidth = w; for (const sh of shapes) { path(sh); ctx.stroke(); } }
  // the charred claw itself
  ctx.fillStyle = `rgba(22,5,3,${a})`; for (const sh of shapes) { path(sh); ctx.fill(); }
  // fire running through the cracks in it
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(255,${120 + 60 * Math.sin(now * 18) | 0},30,${0.95 * a})`; ctx.lineWidth = Math.max(1, S * 0.06);
  for (const v of veins) { ctx.beginPath(); v.forEach(([px, py], j) => j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke(); }
  ctx.beginPath(); for (let k = 0; k <= 6; k++) { const yy = -h * 0.6 * k / 6, xx = (k % 2 ? 0.18 : -0.18) * S + wob * k / 6; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke();
  // white-hot talons
  ctx.strokeStyle = `rgba(255,240,200,${a})`; ctx.lineWidth = Math.max(1, S * 0.07);
  for (const [fx, fy, tx, ty] of tips) { ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke(); }
  // an eye burning in its palm, narrowing as it closes
  ctx.fillStyle = `rgba(255,${200 + 55 * Math.sin(now * 20) | 0},120,${a})`; ctx.beginPath(); ctx.ellipse(wob, palmY + S * 0.05, S * 0.22, Math.max(0.5, S * 0.13 * (1 - close * 0.8)), 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = `rgba(40,0,0,${a})`; ctx.fillRect(wob - S * 0.03, palmY + S * 0.05 - S * 0.1 * (1 - close * 0.8), S * 0.06, S * 0.2 * (1 - close * 0.8));
  ctx.restore();
  for (let k = 0; k < 3; k++) hfFlame22(x + (k - 1) * S * 0.6, gy, x + (k - 1) * S * 0.8, gy - S * (0.6 + 0.4 * Math.sin(now * 14 + k)), S * 0.35, a, now, k + 7);   // fire spilling out of the hole
}
// the sky goes red, and Wrath under your feet
B12.post.push(function hellfirePost22(ox, oy) {
  if (Game.screen === 'title') return;
  if (HF22.redT > 0) {
    const k = Math.min(1, HF22.redT / 1.2) * (HF22.redT > 2.9 ? (3.2 - HF22.redT) / 0.3 : 1);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(255,${120 - 60 * k | 0},${110 - 90 * k | 0},1)`; ctx.globalAlpha = 0.55 * k; ctx.fillRect(0, 0, VIEW.w, VIEW.h); ctx.restore();
    const vg = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.3, VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.85);
    vg.addColorStop(0, 'rgba(80,0,0,0)'); vg.addColorStop(1, `rgba(90,0,0,${0.55 * k})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  const p = Game.player;
  if (p && !p.dead && hfHeld22(p)) {
    const k = HF22.wrath / HF22.wrathMax, w = TILE * 1.5, h = Math.max(3, TILE * 0.13), x = ox + (p.x + p.w / 2) * TILE - w / 2, y = oy + (p.y + p.h) * TILE + TILE * 0.18;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#5a0a04'); gr.addColorStop(0.6, '#ff3a0a'); gr.addColorStop(1, '#ffd04a');
    ctx.fillStyle = gr; ctx.fillRect(x, y, w * k, h);
    if (k >= 1) { ctx.fillStyle = `rgba(255,240,200,${0.4 + 0.4 * Math.sin(Game.time * 10)})`; ctx.fillRect(x, y, w, h); }
    if (HF22.brandT > 0) { ctx.fillStyle = 'rgba(255,160,80,0.8)'; ctx.fillRect(x, y + h + 1, w * (1 - HF22.brandT / HF22.brandCd), Math.max(1, h * 0.4)); }
  }
});
