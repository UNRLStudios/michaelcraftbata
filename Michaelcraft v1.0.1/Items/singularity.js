'use strict';
// =============================================================================
// THE SINGULARITY SWORD (the best sword in the game), the COLLAPSED STAR (calls the Singularity) and the
// SINGULARITY FRAGMENT it drops. The boss itself: Mobs/Bosses/singularity.js.
//
//   COLLAPSED STAR (Magical Workbench, Hardmode):  Voidsteel Ingot, Shattered Crystal, Voidsteel Ingot
//                                                  Shattered Crystal, Void Crystal, Shattered Crystal
//                                                  Voidsteel Ingot, Shattered Crystal, Voidsteel Ingot
//     Use it on the surface in Hardmode: the Singularity comes.
//   SINGULARITY SWORD (Magical Workbench): a Singularity Fragment above the Prismheart.
//
// WHAT THE SWORD DOES
//   Every swing cuts AND throws an EVENT HORIZON: a crescent of void that flies at your cursor, through
//   walls and through every enemy in its way.
//   Every 3rd swing opens a MICRO-SINGULARITY at your cursor instead: a little black hole that drags
//   enemies into it, grinds them, then implodes.
//   Right-click, RIFTWALK (every 1.8 s): you step through space to your cursor (up to 20 blocks), and the rift
//   you leave behind cuts everything along the way. You can't be hurt mid-step.
//   Four ORBITAL FRAGMENTS circle you while you hold it and fire homing void bolts at anything near.
//   25% critical hits. No mana, no ammo.
// =============================================================================
const SING_SWORD = 509;

// ---- STATS ----
const SGS22 = {
  crit: 0.25,
  crescent: { dmg: 1.0, speed: 42, range: 40, every: 0.12 },   // Event Horizon (x weapon damage)
  micro: { every: 3, dmg: 0.45, tick: 0.18, boom: 2.2, life: 1.4, R: 8, pull: 34, boomR: 4.2 },   // Micro-Singularity
  rift: { cd: 1.8, range: 20, dmg: 2 },                             // Riftwalk
  orbit: { n: 4, every: 0.65, dmg: 0.6, range: 18, speed: 26 },   // Orbital Fragments
  // live state
  crescents: [], micros: [], bolts: [], rifts: [], fx: [], swing: 0, riftT: 0, orbT: 0, world: null,
};
defWeapon(SING_SWORD, 'Singularity Sword', 'katana', 6, 9999);
WEAPONS[SING_SWORD] = { type: 'katana', sing: true, dmg: 58, cd: 0.17, reach: 4.2, noDash: true, trail: '#c070ff', heldSize: 38 };
Object.assign(ITEM_HINTS, {
  [SING_SWORD]: 'Forged from the Prismheart and a piece of a dead star. Every swing throws a crescent of void through walls and enemies; every 3rd opens a Micro-Singularity at your cursor. Right-click: Riftwalk. Four fragments circle you and shoot at anything near',
  [SING_SUMMON]: 'Use it on the surface in Hardmode, and the Singularity comes',
  [SING_FRAGMENT]: 'A piece of the Singularity. Put one above a Prismheart at the Magical Workbench',
});

// ---- RECIPES (both at the Magical Workbench) ----
addRecipe18({ result: SING_SUMMON, qty: 1, shape: ['VSV', 'SXS', 'VSV'], key: { V: VOIDSTEEL_INGOT, S: SHATTERED_CRYSTAL, X: VOID_CRYSTAL }, station: 'magic' });
addRecipe18({ result: SING_SWORD, qty: 1, shape: ['F', 'P'], key: { F: SING_FRAGMENT, P: PRISMHEART }, station: 'magic' });
for (const G of CR_GROUPS18) {
  if (G[1] === 'Katanas') G[2].push(SING_SWORD);
  if (G[1] === 'Keys & Relics') G[2].push(SING_SUMMON, SING_FRAGMENT);
}

// ---- TEXTURES (all animated: 8 frames) ----
const SGS_ART22 = { [SING_SWORD]: ['Textures/items/singularity/singularity_sword', 128], [SING_FRAGMENT]: ['Textures/items/singularity/singularity_fragment', 32], [SING_SUMMON]: ['Textures/items/singularity/collapsed_star', 32] };
for (const id in SGS_ART22) BIG_ITEM_TEXTURES[id] = [SGS_ART22[id][0] + '.png', SGS_ART22[id][1]];
{
  const frames = {};
  const cis = computeIconStyle;
  computeIconStyle = function (id) {
    const A = SGS_ART22[id];
    if (A) return `background-image:url("${texUrl(A[0] + '_anim.png')}");background-size:800% 100%;background-position:0% 0;animation:prism22 0.9s steps(8, jump-none) infinite;image-rendering:${A[1] > 32 ? 'auto' : 'pixelated'};`;
    return cis(id);
  };
  iconStyleCache.clear();
  for (const id in SGS_ART22) {
    const [path, sz] = SGS_ART22[id], img = new Image(), sheet = path + '_anim.png';
    img.onload = () => { const out = []; for (let k = 0; k < 8; k++) { const c = mkCanvas(sz); c.height = sz; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, k * sz, 0, sz, sz, 0, 0, sz, sz); out.push(c); } frames[id] = out; };
    img.src = (window.TEXTURE_BUNDLE && window.TEXTURE_BUNDLE[sheet]) || sheet;
  }
  setInterval(() => { const k = Math.floor(performance.now() / 112) % 8; for (const id in frames) itemIcon[id] = frames[id][k]; }, 40);
  const fb = buildFallbackTextures;
  buildFallbackTextures = function () {
    fb();
    for (const id of [SING_SWORD, SING_FRAGMENT, SING_SUMMON]) if (!itemIcon[id]) { const c = mkCanvas(TEX), g = c.getContext('2d'); g.fillStyle = '#7a3aff'; g.fillRect(4, 4, TEX - 8, TEX - 8); g.fillStyle = '#000'; g.fillRect(TEX / 2 - 2, TEX / 2 - 2, 4, 4); itemIcon[id] = c; }
  };
}

// ---- SOUNDS (the Terraria pack) ----
Object.assign(SOUNDS, {
  'sgs.swing': { files: terraria_('dd2_sky_dragons_fury_swing', 4), vol: 0.3, pitch: [0.6, 0.75], cat: 'volPlayers' },
  'sgs.crescent': { files: terraria_('dd2_sonic_boom_blade_slash', 3), vol: 0.32, pitch: [0.8, 1.0], cat: 'volPlayers' },
  'sgs.hit': { files: terraria_('dd2_wither_beast_crystal_impact', 3), vol: 0.28, pitch: [1.1, 1.35], cat: 'volPlayers' },
  'sgs.crit': { files: ['terraria/shatter'], vol: 0.32, pitch: [0.8, 0.95], cat: 'volPlayers' },
  'sgs.micro': { files: terraria_('dd2_etherian_portal_spawn_enemy', 2), vol: 0.5, pitch: [0.8, 0.95], cat: 'volPlayers' },
  'sgs.implode': { files: terraria_('dd2_explosive_trap_explode', 2), vol: 0.45, pitch: [0.7, 0.85], cat: 'volPlayers' },
  'sgs.rift': { files: ['terraria/item_6'], vol: 0.55, pitch: [0.75, 0.9], cat: 'volPlayers' },
  'sgs.riftcut': { files: terraria_('dd2_ghastly_glaive_impact_ghost', 3), vol: 0.5, pitch: [0.7, 0.85], cat: 'volPlayers' },
  'sgs.bolt': { files: terraria_('dd2_dark_mage_attack', 3), vol: 0.16, pitch: [1.3, 1.6], cat: 'volPlayers' },
});

// ---- helpers ----
function sgsCan22(m) { return canWeaponHit(m) && !m.def.npc && !(m.def.pet && m.tamed) && !m.def.villager; }
function sgsHeld22(p) { const s = p && p.selectedSlot && p.selectedSlot(); return !!(s && s.item === SING_SWORD); }
function sgsMid22(m) { return { x: m.x + m.w / 2, y: m.y + m.h / 2 }; }
function sgsCursor22(p, c, max) {
  let tx, ty;
  if (Input.hasPointer) { tx = Input.pointerWorldX; ty = Input.pointerWorldY; }
  else if (Game.targetMob) { tx = Game.targetMob.x + Game.targetMob.w / 2; ty = Game.targetMob.y + Game.targetMob.h / 2; }
  else { tx = c.x + p.facing * 8; ty = c.y; }
  const d = Math.hypot(tx - c.x, ty - c.y);
  if (max && d > max) { tx = c.x + (tx - c.x) / d * max; ty = c.y + (ty - c.y) / d * max; }
  return { x: tx, y: ty };
}
function sgsHit22(m, p, slot, W, mul, x, y) {
  const crit = Math.random() < SGS22.crit || isCritFall(p), base = weaponDamage(p, slot, W) * mul;
  hurtMob(m, Math.round(crit ? base * CRIT_MULT : base), p, crit, 'melee');
  SGS22.fx.push({ k: 'star', x, y, t: 0, life: crit ? 0.3 : 0.18, s: crit ? 2.2 : 1.1, rot: Math.random() });
  for (let i = 0; i < (crit ? 14 : 6) * particleMul(); i++) { const a = Math.random() * 6.283, v = 2 + Math.random() * 5; Game.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.3 + Math.random() * 0.3, age: 0, size: 0.07, color: ['#ff6af0', '#b070ff', '#7a9aff', '#ffffff'][i % 4], gravity: 0, kind: 'star' }); }
  if (crit) { sfx('sgs.crit', { x, y }); screenShake(0.1); } else if ((SGS22.hitT || 0) <= 0) { SGS22.hitT = 0.07; sfx('sgs.hit', { x, y }); }
  if (!m.tamed && !m.def.villager && !m.def.npc && !m.isPlayerProxy) sendDogsAfter(m);
}

// ---- THE SWING: a cut, and an Event Horizon (or, every 3rd, a Micro-Singularity) ----
function sgsSwing22(p, slot, W, target, ks) {
  ks(p, slot, W, target);   // (the cut itself: a katana's three-cut combo)
  const c = playerCenter(p), cur = sgsCursor22(p, c, SGS22.crescent.range);
  SGS22.swing++;
  sfx('sgs.swing');
  if (SGS22.swing % SGS22.micro.every === 0) { sgsMicro22(p, slot, W, cur.x, cur.y, false); netShot13({ k: 'sgs', a: 'm', x: +cur.x.toFixed(2), y: +cur.y.toFixed(2) }); }
  else { const a = Math.atan2(cur.y - c.y, cur.x - c.x); sgsCrescent22(p, slot, W, c.x, c.y, a, false); netShot13({ k: 'sgs', a: 'c', x: +c.x.toFixed(2), y: +c.y.toFixed(2), an: +a.toFixed(2) }); }
}
function sgsCrescent22(p, slot, W, x, y, a, fake) {
  const C = SGS22.crescent;
  SGS22.crescents.push({ x: x + Math.cos(a) * 0.8, y: y + Math.sin(a) * 0.8, a, vx: Math.cos(a) * C.speed, vy: Math.sin(a) * C.speed, t: 0, life: C.range / C.speed, hits: new Map(), own: fake ? null : p, slot, W, flip: SGS22.swing % 2 ? 1 : -1 });
  sfx('sgs.crescent', fake ? { x, y } : undefined);
}
function sgsMicro22(p, slot, W, x, y, fake) {
  const M = SGS22.micro;
  SGS22.micros.push({ x, y, t: 0, life: M.life, tick: 0, own: fake ? null : p, slot, W, boom: false });
  sfx('sgs.micro', { x, y });
}
// RIFTWALK
function sgsRift22(p, slot, W) {
  if (SGS22.riftT > 0 || p.dead || p.riding) return;
  const c = playerCenter(p), cur = sgsCursor22(p, c, SGS22.rift.range);
  // the furthest free spot toward the cursor (the rift won't put you inside a wall)
  const fits = (x, y) => { const x0 = Math.floor(x - p.w / 2 + 0.02), x1 = Math.floor(x + p.w / 2 - 0.02), y0 = Math.floor(y - 0.45 + 0.02), y1 = Math.floor(y - 0.45 + p.h - 0.02); for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) if (solidAt(tx, ty)) return false; return true; };
  let tx = cur.x, ty = cur.y, k = 1;
  while (k > 0 && !fits(tx, ty)) { k -= 0.05; tx = c.x + (cur.x - c.x) * k; ty = c.y + (cur.y - c.y) * k; }
  if (k <= 0.05) { showToast('No room to step through there'); return; }
  SGS22.riftT = SGS22.rift.cd;
  const fx = c.x, fy = c.y;
  p.x = tx - p.w / 2; p.y = ty - 0.45; p.vx *= 0.3; p.vy = Math.min(p.vy, 0) * 0.3; p.fallStartY = p.y; p.invuln = Math.max(p.invuln, 0.45);
  startAction(p, 'kthrust', false); p.swing = 1;
  sgsRiftFx22(fx, fy, tx, ty, false);
  netShot13({ k: 'sgs', a: 'r', x: +fx.toFixed(2), y: +fy.toFixed(2), x1: +tx.toFixed(2), y1: +ty.toFixed(2) });
  // the rift cuts everything along the way (a heartbeat later)
  const dx = tx - fx, dy = ty - fy, L = dx * dx + dy * dy || 1;
  const hit = combatTargets().filter(m => { if (!sgsCan22(m)) return false; const q = sgsMid22(m), f = Math.max(0, Math.min(1, ((q.x - fx) * dx + (q.y - fy) * dy) / L)); return Math.hypot(q.x - (fx + dx * f), q.y - (fy + dy * f)) < 1.6 + Math.max(m.w, m.h) / 2; });
  setTimeout(() => { for (const m of hit) if (m.dying == null && !m.dead) { const q = sgsMid22(m); sgsHit22(m, p, slot, W, SGS22.rift.dmg, q.x, q.y); } if (hit.length) { sfx('sgs.riftcut', { x: tx, y: ty }); screenShake(0.25); } }, 140);
}
function sgsRiftFx22(x0, y0, x1, y1, fake) {
  SGS22.rifts.push({ x0, y0, x1, y1, t: 0, life: 0.7 });
  sfx('sgs.rift', fake ? { x: x1, y: y1 } : undefined);
  for (const [x, y] of [[x0, y0], [x1, y1]]) for (let i = 0; i < 22 * particleMul(); i++) { const a = Math.random() * 6.283, v = 2 + Math.random() * 6; Game.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.4 + Math.random() * 0.3, age: 0, size: 0.08, color: ['#ff6af0', '#b070ff', '#ffffff'][i % 3], gravity: 0, kind: 'star' }); }
}

// ---- hooking into the katana ----
{
  const ks = katanaSwing;
  katanaSwing = function (p, slot, W, target) { if (W && W.sing) return sgsSwing22(p, slot, W, target, ks); return ks(p, slot, W, target); };
  const kd = katanaDash;
  katanaDash = function (p, slot, W) { if (W && W.sing) return sgsRift22(p, slot, W); return kd(p, slot, W); };
  const ss = spawnShot13;
  spawnShot13 = function (s) {
    if (s && s.k === 'sgs') {
      const p = Game.player; if (!p || Game.screen === 'title' || Game.outside || Math.hypot(s.x - p.x, s.y - p.y) > 90) return;
      if (s.a === 'c') sgsCrescent22(null, null, null, s.x, s.y, s.an, true);
      else if (s.a === 'm') sgsMicro22(null, null, null, s.x, s.y, true);
      else if (s.a === 'r') sgsRiftFx22(s.x, s.y, s.x1, s.y1, true);
      else if (s.a === 'b') SGS22.bolts.push({ x: s.x, y: s.y, vx: s.vx, vy: s.vy, t: 0, life: 1.2, fake: true, trail: [] });
      return;
    }
    return ss(s);
  };
  const dhw = drawHeldWeapon;
  drawHeldWeapon = function (g, u, item, icon, o) {
    if (item === SING_SWORD) g.filter = `drop-shadow(0 0 ${Math.max(1, u * (1.8 + 0.6 * Math.sin(performance.now() / 160))).toFixed(1)}px rgba(190,90,255,0.95))`;
    return dhw(g, u, item, icon, o);
  };
  const wt = weaponTooltip;
  weaponTooltip = function (stack, W) {
    if (!W || !W.sing) return wt(stack, W);
    return '<div class="tt-blue" style="color:#d08aff">Every swing: an EVENT HORIZON (through walls and enemies)</div><div class="tt-blue" style="color:#d08aff">Every 3rd: a MICRO-SINGULARITY at your cursor</div>'
      + `<div class="tt-blue" style="color:#ff8af0">Right-click: RIFTWALK (every ${SGS22.rift.cd} s)</div><div class="tt-blue" style="color:#9ab0ff">${SGS22.orbit.n} Orbital Fragments fire at anything near</div>`
      + `<div class="tt-blue">${Math.round(SGS22.crit * 100)}% critical hits</div><div class="tt-line">A cut every ${W.cd} s</div>`;
  };
  // the Collapsed Star: use it to call the Singularity
  const tu = tryUseItem;
  tryUseItem = function (isRepeat) {
    const p = Game.player, s = p && p.selectedSlot();
    if (!isRepeat && s && s.item === SING_SUMMON && !Game.spectator && !p.dead) {
      if (!sgCanSummon22()) return;
      if (!Game.creative) { s.qty -= 1; if (s.qty <= 0) p.inventory[p.hotbarIndex] = null; refreshInventoryUI(); }
      eventMessage('The star collapses in your hand... something answers.', '#b070ff');
      sgSummonHere22(); return;
    }
    return tu(isRepeat);
  };
}

// ---- every frame ----
B12.updaters.push(function sgsTick22(dt, p) {
  if (SGS22.world !== Game.world) { SGS22.world = Game.world; for (const k of ['crescents', 'micros', 'bolts', 'rifts', 'fx']) SGS22[k].length = 0; }
  SGS22.riftT = Math.max(0, SGS22.riftT - dt); SGS22.hitT = Math.max(0, (SGS22.hitT || 0) - dt);
  const T = combatTargets();
  // Event Horizons
  for (let i = SGS22.crescents.length - 1; i >= 0; i--) {
    const C = SGS22.crescents[i]; C.t += dt; C.x += C.vx * dt; C.y += C.vy * dt;
    if (C.t >= C.life) { SGS22.crescents.splice(i, 1); continue; }
    if (Math.random() < dt * 40 * particleMul()) Game.particles.push({ x: C.x + (Math.random() - 0.5), y: C.y + (Math.random() - 0.5), vx: -C.vx * 0.05, vy: -C.vy * 0.05, life: 0.35, age: 0, size: 0.07, color: Math.random() < 0.5 ? '#ff6af0' : '#9a7aff', gravity: 0, kind: 'star' });
    if (!C.own || !p || p.dead) continue;
    for (const m of T) {
      if (!sgsCan22(m) || boxDistToPoint(m, C.x, C.y) > 1.3) continue;
      const last = C.hits.get(m.id); if (last != null && C.t - last < SGS22.crescent.every * 3) continue;
      C.hits.set(m.id, C.t); sgsHit22(m, p, C.slot, C.W, SGS22.crescent.dmg, C.x, C.y);
    }
  }
  // Micro-Singularities: pull, grind, implode
  for (let i = SGS22.micros.length - 1; i >= 0; i--) {
    const M = SGS22.micros[i], P = SGS22.micro; M.t += dt;
    if (Math.random() < dt * 30 * particleMul()) { const a = Math.random() * 6.283, r = 2 + Math.random() * 4; Game.particles.push({ x: M.x + Math.cos(a) * r, y: M.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 2 + Math.sin(a) * 2, vy: -Math.sin(a) * r * 2 - Math.cos(a) * 2, life: 0.45, age: 0, size: 0.07, color: ['#ff6af0', '#b070ff', '#e8d8ff'][i % 3], gravity: 0, kind: 'star' }); }
    if (M.t < M.life) {
      if (M.own && p && !p.dead) {
        M.tick -= dt;
        for (const m of T) {
          if (!sgsCan22(m)) continue;
          const q = sgsMid22(m), dx = M.x - q.x, dy = M.y - q.y, d = Math.hypot(dx, dy);
          if (d > P.R) continue;
          if (!m.def.boss && !m.segOf && d > 0.4) { const f = P.pull * dt * (1 - d / P.R * 0.5); m.vx = (m.vx || 0) + dx / d * f; m.vy = (m.vy || 0) + dy / d * f; m.x += dx / d * f * dt * 3; m.y += dy / d * f * dt * 3; }
          if (M.tick <= 0 && d < 2.2) sgsHit22(m, p, M.slot, M.W, P.dmg, q.x, q.y);
        }
        if (M.tick <= 0) M.tick = P.tick;
      }
    } else if (!M.boom) {
      M.boom = true; sfx('sgs.implode', { x: M.x, y: M.y }); flashAt(M.x, M.y, P.boomR * 1.2, '210,140,255', 0.18);
      SGS22.fx.push({ k: 'ring', x: M.x, y: M.y, t: 0, life: 0.4, r0: 0.4, r1: P.boomR + 0.8 });
      for (let j = 0; j < 30 * particleMul(); j++) { const a = Math.random() * 6.283, v = 3 + Math.random() * 8; Game.particles.push({ x: M.x, y: M.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, age: 0, size: 0.09, color: ['#ff6af0', '#b070ff', '#ffffff', '#7a9aff'][j % 4], gravity: 0, kind: 'star' }); }
      if (M.own && p && !p.dead) { screenShake(0.22); for (const m of T) if (sgsCan22(m) && boxDistToPoint(m, M.x, M.y) < P.boomR) { const q = sgsMid22(m); sgsHit22(m, p, M.slot, M.W, P.boom, q.x, q.y); } }
    } else if (M.t > M.life + 0.4) SGS22.micros.splice(i, 1);
  }
  // Orbital Fragments: circling you while you hold it, firing at anything near
  if (p && !p.dead && sgsHeld22(p)) {
    SGS22.orbT -= dt;
    if (SGS22.orbT <= 0) {
      SGS22.orbT = SGS22.orbit.every / SGS22.orbit.n;
      const c = playerCenter(p), k = (SGS22.orbK = ((SGS22.orbK || 0) + 1) % SGS22.orbit.n), a = Game.time * 2.2 + k * 6.283 / SGS22.orbit.n, ox = c.x + Math.cos(a) * 1.6, oy = c.y - 0.3 + Math.sin(a) * 0.8;
      const foe = T.filter(m => sgsCan22(m) && m.dying == null && Math.hypot(m.x + m.w / 2 - ox, m.y + m.h / 2 - oy) < SGS22.orbit.range).sort((A, B) => Math.hypot(A.x - ox, A.y - oy) - Math.hypot(B.x - ox, B.y - oy))[0];
      if (foe) {
        const q = sgsMid22(foe), an = Math.atan2(q.y - oy, q.x - ox), sp = SGS22.orbit.speed;
        SGS22.bolts.push({ x: ox, y: oy, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, t: 0, life: 1.2, own: p, slot: p.selectedSlot(), W: WEAPONS[SING_SWORD], target: foe, trail: [] });
        sfx('sgs.bolt', { x: ox, y: oy });
        netShot13({ k: 'sgs', a: 'b', x: +ox.toFixed(2), y: +oy.toFixed(2), vx: +(Math.cos(an) * sp).toFixed(1), vy: +(Math.sin(an) * sp).toFixed(1) });
      }
    }
  }
  for (let i = SGS22.bolts.length - 1; i >= 0; i--) {
    const B = SGS22.bolts[i]; B.t += dt;
    if (B.target && B.target.dying == null && !B.target.dead) {   // homing
      const q = sgsMid22(B.target), want = Math.atan2(q.y - B.y, q.x - B.x), cur = Math.atan2(B.vy, B.vx); let d = want - cur; d = Math.atan2(Math.sin(d), Math.cos(d));
      const na = cur + Math.max(-9 * dt, Math.min(9 * dt, d)), sp = Math.hypot(B.vx, B.vy); B.vx = Math.cos(na) * sp; B.vy = Math.sin(na) * sp;
    }
    B.x += B.vx * dt; B.y += B.vy * dt; B.trail.unshift([B.x, B.y]); if (B.trail.length > 7) B.trail.pop();
    let done = B.t > B.life;
    if (!B.fake && B.own && !done) for (const m of T) { if (!sgsCan22(m) || boxDistToPoint(m, B.x, B.y) > 0.5) continue; sgsHit22(m, B.own, B.slot, B.W, SGS22.orbit.dmg, B.x, B.y); done = true; break; }
    if (done) SGS22.bolts.splice(i, 1);
  }
  for (const A of [SGS22.rifts, SGS22.fx]) for (let i = A.length - 1; i >= 0; i--) { A[i].t += dt; if (A[i].t >= A[i].life) A.splice(i, 1); }
});

// ---- DRAWING (after the dark: it glows) ----
B12.glow.push(function sgsGlow22(ox, oy, glow) {
  const T0 = TILE, t = Game.time;
  // Event Horizons: a dark crescent with a burning violet edge
  for (const C of SGS22.crescents) {
    const x = ox + C.x * T0, y = oy + C.y * T0, R = T0 * 1.6, fade = Math.min(1, (C.life - C.t) / 0.15, C.t / 0.04), a0 = C.a - 1.25, a1 = C.a + 1.25;
    glow(x, y, T0 * 2.4, '180,90,255', 0.5 * fade);
    ctx.lineCap = 'round';
    for (const [w, col, k] of [[0.55, `rgba(120,60,255,${0.45 * fade})`, 1.08], [0.3, `rgba(255,110,240,${0.9 * fade})`, 1], [0.1, `rgba(255,240,255,${fade})`, 0.98]]) { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, T0 * w); ctx.beginPath(); ctx.arc(x - Math.cos(C.a) * R * 0.6, y - Math.sin(C.a) * R * 0.6, R * k, a0, a1); ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = `rgba(10,0,24,${0.85 * fade})`; ctx.lineWidth = Math.max(1, T0 * 0.18); ctx.beginPath(); ctx.arc(x - Math.cos(C.a) * R * 0.75, y - Math.sin(C.a) * R * 0.75, R * 0.95, a0 + 0.25, a1 - 0.25); ctx.stroke(); ctx.restore();
  }
  // Micro-Singularities
  for (const M of SGS22.micros) {
    const x = ox + M.x * T0, y = oy + M.y * T0, P = SGS22.micro, grow = Math.min(1, M.t / 0.2), end = M.t > M.life ? 1 - (M.t - M.life) / 0.4 : 1, r = T0 * 0.8 * grow * end * (1 + 0.1 * Math.sin(t * 20));
    if (end <= 0) continue;
    glow(x, y, T0 * 4 * grow * end, '170,80,255', 0.5);
    for (let j = 0; j < 3; j++) {   // the accretion disc
      ctx.strokeStyle = j === 1 ? `rgba(255,120,240,${0.8 * end})` : `rgba(170,140,255,${0.7 * end})`; ctx.lineWidth = Math.max(1, T0 * 0.12); ctx.beginPath();
      ctx.ellipse(x, y, r * (2.2 + j * 0.6), r * (0.7 + j * 0.15), Math.sin(t * 0.7 + j) * 0.3, t * (5 - j) + j, t * (5 - j) + j + 3.6); ctx.stroke();
    }
    ctx.strokeStyle = `rgba(255,255,255,${0.3 * end})`; ctx.setLineDash([T0 * 0.3, T0 * 0.25]); ctx.lineDashOffset = t * 30; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, P.R * T0 * (0.3 + 0.7 * ((t * 1.5) % 1)), 0, 6.283); ctx.stroke(); ctx.setLineDash([]);   // the pull, rippling inward
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore();
    ctx.strokeStyle = `rgba(255,220,255,${end})`; ctx.lineWidth = Math.max(1, T0 * 0.1); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke();
  }
  // orbital bolts
  for (const B of SGS22.bolts) {
    for (let j = 1; j < B.trail.length; j++) { const k = 1 - j / B.trail.length; ctx.strokeStyle = `rgba(200,120,255,${0.7 * k})`; ctx.lineWidth = Math.max(1, T0 * 0.18 * k); ctx.beginPath(); ctx.moveTo(ox + B.trail[j - 1][0] * T0, oy + B.trail[j - 1][1] * T0); ctx.lineTo(ox + B.trail[j][0] * T0, oy + B.trail[j][1] * T0); ctx.stroke(); }
    glow(ox + B.x * T0, oy + B.y * T0, T0 * 0.8, '255,120,240', 0.6);
    ctx.fillStyle = '#fff0ff'; ctx.beginPath(); ctx.arc(ox + B.x * T0, oy + B.y * T0, T0 * 0.13, 0, 6.283); ctx.fill();
  }
  // Riftwalk: a tear in space where you stepped through
  for (const R of SGS22.rifts) {
    const e = R.t / R.life, a = 1 - e, x0 = ox + R.x0 * T0, y0 = oy + R.y0 * T0, x1 = ox + R.x1 * T0, y1 = oy + R.y1 * T0;
    ctx.lineCap = 'round';
    for (const [w, col] of [[0.7, `rgba(120,50,255,${0.4 * a})`], [0.35, `rgba(255,110,240,${0.85 * a})`], [0.1, `rgba(255,255,255,${a})`]]) { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, T0 * w * (1 - e * 0.5)); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = `rgba(6,0,16,${0.9 * a})`; ctx.lineWidth = Math.max(1, T0 * 0.12); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
    glow(x0, y0, T0 * 2, '200,100,255', 0.6 * a); glow(x1, y1, T0 * 2.5, '255,120,240', 0.7 * a);
  }
  for (const F of SGS22.fx) {
    const e = F.t / F.life, x = ox + F.x * T0, y = oy + F.y * T0;
    if (F.k === 'ring') { ctx.strokeStyle = `rgba(230,180,255,${1 - e})`; ctx.lineWidth = Math.max(1, T0 * 0.25 * (1 - e)); ctx.beginPath(); ctx.arc(x, y, T0 * (F.r0 + (F.r1 - F.r0) * Math.sqrt(e)), 0, 6.283); ctx.stroke(); }
    else {   // a four-pointed star where it bites
      const s = T0 * F.s * (1 - e * 0.5), a = 1 - e; glow(x, y, s * 1.3, '255,120,240', 0.6 * a);
      ctx.save(); ctx.translate(x, y); ctx.rotate(F.rot); ctx.fillStyle = `rgba(255,230,255,${a})`;
      for (let r = 0; r < 4; r++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.12, 0); ctx.lineTo(0, s * 0.08); ctx.lineTo(-s * 0.12, 0); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
  }
  // the Orbital Fragments circling you
  const p = Game.player;
  if (p && !p.dead && sgsHeld22(p)) {
    const c = playerCenter(p);
    for (let k = 0; k < SGS22.orbit.n; k++) {
      const a = t * 2.2 + k * 6.283 / SGS22.orbit.n, x = ox + (c.x + Math.cos(a) * 1.6) * T0, y = oy + (c.y - 0.3 + Math.sin(a) * 0.8) * T0, r = T0 * 0.18;
      glow(x, y, T0 * 0.7, '200,110,255', 0.55);
      ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#0a0018'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(255,150,245,0.95)'; ctx.lineWidth = Math.max(1, T0 * 0.05); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke();
    }
  }
});
// the Riftwalk cooldown, under your feet while you hold it
B12.post.push(function sgsHud22(ox, oy) {
  const p = Game.player; if (!p || p.dead || Game.screen === 'title' || !sgsHeld22(p) || SGS22.riftT <= 0) return;
  const w = TILE * 1.3, h = Math.max(2, TILE * 0.09), x = ox + (p.x + p.w / 2) * TILE - w / 2, y = oy + (p.y + p.h) * TILE + TILE * 0.18;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#c070ff'; ctx.fillRect(x, y, w * (1 - SGS22.riftT / SGS22.rift.cd), h);
});
