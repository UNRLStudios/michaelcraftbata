'use strict';
// =============================================================================
// VILLAGER   (type 'villager')
//   Lives in a village and trades (right-click). Each has a job and a home; heads indoors at night.
// =============================================================================
defineMob('villager', {
  // ---- STATS ----
  stats: {
    name: 'Villager', w: 0.6, h: 1.8, speed: 1.5, health: 20, hostile: false, dmg: 0, kb: 1, villager: true,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 3, range: 16 },
  // ---- AI ----
  brain: villagerBrain,
  // ---- VISUALS ----
  draw: drawVillager,
  deathColors: ['#7b8f3c', '#d4a27a'],
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/villager/idle', 3), vol: 0.7, pitch: [0.9, 1.1], cat: 'volFriendly' },
    yes: { files: n_('mob/villager/yes', 3), vol: 0.7, pitch: [0.9, 1.1], cat: 'volFriendly' },
    no: { files: n_('mob/villager/no', 3), vol: 0.7, pitch: [0.9, 1.1], cat: 'volFriendly' },
    trade: { files: n_('mob/villager/haggle', 3), vol: 0.7, pitch: [0.9, 1.1], cat: 'volFriendly' },
    hurt: { files: n_('mob/villager/hit', 4), vol: 0.8, pitch: [0.9, 1.1], cat: 'volFriendly', synth: 'hit' },
    death: { files: ['mob/villager/death'], vol: 0.8, pitch: [0.9, 1.1], cat: 'volFriendly', synth: 'death' },
  },
  // ---- LOOT ----
  // (drops nothing)
});

// ---- AI ----
function villagerAI(m, dt, p, dx, dist, isNight) {
  const def = m.def;
  m.stateTimer -= dt;
  const threat = Game.mobs.find(o => o.def.hostile && o.dying == null && Math.abs(o.x - m.x) < 7 && Math.abs(o.y - m.y) < 4);
  if (threat) { m.panic = 3; m.fleeDir = m.x > threat.x ? 1 : -1; }
  if (m.panic > 0) { m.panic -= dt; return (m.fleeDir || m.dir || 1) * def.speed * 1.9; }
  if (Game.ui.mode === 'trade' && Game.ui.mob === m) { m.facingDir = dx > 0 ? 1 : -1; return 0; }
  m.soundCd -= dt;
  if (m.soundCd <= 0 && dist < 10) { m.soundCd = 6 + Math.random() * 10; sfx('villager.say', mobPos(m)); }
  if (m.homeX != null) {
    const hx = m.homeX + 0.5 - (m.x + m.w / 2);
    if (B12.blood) return Math.abs(hx) > 0.6 ? Math.sign(hx) * def.speed * 1.7 : 0;   // (1.2) the Blood Moon: everybody runs for the door
    if (isNight) return Math.abs(hx) > 0.6 ? Math.sign(hx) * def.speed : 0;   // wait at the door at night
    if (Math.abs(hx) > 9) return Math.sign(hx) * def.speed * 0.6;
  }
  if (dist < 3.5 && Math.abs(p.vx) < 0.5) { m.facingDir = dx > 0 ? 1 : -1; return 0; } // look at you when you stop nearby
  return wanderVx(m, dt);
}
function villagerBrain(m, dt, p, dx, dist, isNight) { mobMove(m, villagerAI(m, dt, p, dx, dist, isNight), dt); }

// ---- VISUALS (drawing and effects) ----
// ---- Villager: robed townsfolk with a hat and a big mustache; colours show the job ----
const VILLAGER_GRIDS = {
  head: ['..HHHH..', '.HHHHHH.', 'hhhhhhhh', 'sSSSSSSS', 'sSSSSWES', 'sSSSSSSS', 'sSSSMMMM', 'sSSSSSS.'],
  body: ['dTTS', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'BBBK', 'dTTt', 'dTTt', 'dTTt', 'dTTt'],
  arm: ['dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'sSSS', 'sSSS', 'sSSS', 'sSSS', 'sSSS'],
  leg: ['dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'pPPP', 'pPPP', 'OOoo', 'OOOo', 'OOOO'],
};
function villagerPalette(v) {
  const j = v.job || VILLAGER_JOBS[0];
  return {
    hair: j.hat, hairHi: j.hatHi, skin: v.desert ? '#b07a4a' : '#d4a27a', skinShade: v.desert ? '#8f6038' : '#b8865e', mouth: '#5a3a24',
    eyeWhite: '#f4f4f4', eye: '#3a5a2a', shirt: j.robe, shirtHi: j.robeHi, shirtShade: j.robeShade,
    belt: '#4a2f18', buckle: '#c9a94f', pants: '#4a3a2a', pantsShade: '#3a2c20', boots: '#2e2218', bootsHi: '#44321f',
  };
}
function drawVillager(g, m, u0) {
  const w = m.w * TILE, h = m.h * TILE;
  const moving = Math.abs(m.vx) > 0.1;
  const sw = moving ? Math.sin(m.legPhase) * 0.45 : 0;
  const worried = m.panic > 0;
  g.save();
  g.translate(-w / 2, -h);
  drawPlayerSprite(g, w, h, {
    grids: VILLAGER_GRIDS, pal: villagerPalette(m), legSwing: sw,
    armAngle: worried ? -2.6 : -sw * 0.6, backArmAngle: worried ? -2.4 : sw * 0.6, headTilt: worried ? -0.1 : Math.sin(Game.time + m.id) * 0.05
  });
  g.restore();
}

// ---- JOBS, VILLAGES AND TRADING ----
const VILLAGER_JOBS = [
  {
    name: 'Farmer', robe: '#7b8f3c', robeHi: '#93a84c', robeShade: '#5d6e2c', hat: '#d9b95c', hatHi: '#f0d27a', trades: [
      { cost: [[126, 20]], result: [134, 1], max: 12 },
      { cost: [[125, 24]], result: [134, 1], max: 12 },
      { cost: [[134, 1]], result: [127, 6], max: 12 },
      { cost: [[134, 1]], result: [121, 4], max: 12 },
      { cost: [[134, 14]], result: [202, 1], max: 1 },      // Spring Charm (jump boost)
      { cost: [[134, 5]], result: [245, 1], max: 3 }]       // (1.0.2) a Golden Apple
  },
  {
    name: 'Butcher', robe: '#e6e0d2', robeHi: '#f6f2e8', robeShade: '#bfb8a8', hat: '#8e2c2c', hatHi: '#ab3c3c', trades: [
      { cost: [[122, 7]], result: [134, 1], max: 12 },
      { cost: [[134, 1]], result: [132, 5], max: 12 },
      { cost: [[134, 1]], result: [124, 3], max: 8 },
      { cost: [[BASS, 4]], result: [134, 1], max: 12 }, { cost: [[TROUT, 4]], result: [134, 1], max: 12 },   // (1.2) fish
      { cost: [[ICEFISH, 3]], result: [134, 1], max: 12 }, { cost: [[FROST_KOI, 2]], result: [134, 1], max: 12 }, { cost: [[MAGMAFISH, 2]], result: [134, 1], max: 12 },
      { cost: [[TUNA, 2]], result: [134, 1], max: 12 }, { cost: [[PUFFERFISH, 3]], result: [134, 1], max: 8 }, { cost: [[SHARK, 1]], result: [134, 3], max: 6 },
      { cost: [[134, 4]], result: [FISHING_ROD, 1], max: 3 },
      { cost: [[134, 16]], result: [205, 1], max: 1 }]      // Heart Charm (health boost)
  },
  {
    name: 'Toolsmith', robe: '#4a4a52', robeHi: '#5e5e68', robeShade: '#35353c', hat: '#2a2a30', hatHi: '#3c3c44', trades: [
      { cost: [[117, 15]], result: [134, 1], max: 12 },
      { cost: [[128, 4]], result: [134, 1], max: 12 },
      { cost: [[129, 5]], result: [134, 1], max: 12 },      // (1.0.2) gold ingots for emeralds
      { cost: [[134, 3]], result: [109, 1], max: 3 },
      { cost: [[134, 12], [128, 2]], result: [113, 1], max: 2 },
      { cost: [[134, 18]], result: [204, 1], max: 1 },      // Warrior Charm (damage boost)
      { cost: [[134, 22]], result: [210, 1], max: 1 },      // Power Charm (power flight)
      { cost: [[134, 4], [128, 1]], result: [211, 1], max: 3 },   // a bow
      { cost: [[134, 1]], result: [212, 16], max: 12 }]     // arrows
  },
  {
    name: 'Mason', robe: '#7a6a5a', robeHi: '#8e7c6a', robeShade: '#5e5044', hat: '#5a3a24', hatHi: '#704a2e', trades: [
      { cost: [[14, 20]], result: [134, 1], max: 12 },
      { cost: [[134, 1]], result: [39, 8], max: 12 },
      { cost: [[134, 1]], result: [42, 6], max: 12 },
      { cost: [[134, 2]], result: [22, 2], max: 6 },
      { cost: [[134, 14]], result: [203, 1], max: 1 },      // Swift Charm (speed boost)
      { cost: [[134, 20]], result: [206, 1], max: 1 }]      // Cloud Charm (double jump & dash)
  },
  {
    name: 'Cartographer', robe: '#e8e0c8', robeHi: '#fbf6e6', robeShade: '#b8ae94', hat: '#6b4a2a', hatHi: '#8a6a44', trades: [
      { cost: [[217, 20]], result: [134, 1], max: 12 },
      { cost: [[134, 1]], result: [217, 8], max: 12 },
      { cost: [[134, 4]], result: [216, 1], max: 3 },
      { cost: [[134, 10]], result: [218, 1], max: 2 },     // the way to the Abyss
      { cost: [[134, 12]], result: [TONIO_MAP, 1], max: 1 },   // the way to Tonio
      { cost: [[134, 10]], result: [DOJO_MAP, 1], max: 2 }]    // the way to the dojos
  },
  {
    name: 'Fisherman', robe: '#3a6f8f', robeHi: '#4d88a8', robeShade: '#2a5470', hat: '#c9a84c', hatHi: '#e0c46a', trades: [
      { cost: [[138, 12]], result: [134, 1], max: 12 },
      { cost: [[160, 8]], result: [134, 1], max: 12 },
      { cost: [[154, 4]], result: [134, 1], max: 12 },
      { cost: [[134, 1]], result: [139, 6], max: 12 },
      { cost: [[134, 3]], result: [89, 2], max: 6 },
      { cost: [[134, 12]], result: [207, 1], max: 1 },      // Feather Charm (slow falling)
      { cost: [[134, 1]], result: [STRING, 4], max: 8 }]    // fishing line
  },
];
function makeVillager(x, feetY, homeX, desert, jobIndex) {
  const v = new Mob('villager', x, 0);
  v.y = feetY - v.h; v.homeX = homeX; v.desert = desert;
  v.job = VILLAGER_JOBS[jobIndex % VILLAGER_JOBS.length];
  v.offers = v.job.trades.map(t => ({ cost: t.cost, result: t.result, max: t.max, uses: t.max }));
  v.restockDay = Math.floor(dayClock() / DAY_LENGTH);
  return v;
}
// Houses near you get their villagers (and sometimes a cat) the first time you come close.
function maybeSpawnVillagers() {
  const W = Game.world, p = Game.player;
  if (W.isInterior) return;
  const pcx = Math.floor(p.x / CHUNK_W);
  for (let cx = pcx - 3; cx <= pcx + 3; cx++) {
    const s = W.structureForChunk(cx);
    if (!s || (s.type !== 'cottage' && s.type !== 'desert_house') || W.villagersSpawned.has(s.id)) continue;
    W.villagersSpawned.add(s.id);
    const desert = s.def.biome === 'desert';
    const n = structHash(s.x0, W.seed, 555) < 0.5 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const v = makeVillager(s.doorX + (i ? 2 : -2), s.base, s.doorX, desert, Math.floor(structHash(s.x0 + i, W.seed, 556) * VILLAGER_JOBS.length));
      v.homeId = s.id;
      Game.mobs.push(v);
    }
    if (!desert && structHash(s.x0, W.seed, 557) < 0.4) { const c = new Mob('cat', s.doorX + 3, 0); c.y = s.base - c.h; c.homeId = s.id; Game.mobs.push(c); }
  }
}
// --- trading screen ---
function openTrade(v) {
  const day = Math.floor(dayClock() / DAY_LENGTH);
  if (v.restockDay !== day) { v.restockDay = day; for (const o of v.offers) o.uses = o.max; }  // restock each morning
  openScreen('trade', 0, 0, v);
  sfx('villager.trade', mobPos(v));
}
function canAffordTrade(o, inv) { return o.cost.every(([it, q]) => countItem(inv, it) >= q); }
function doTrade(o, all) {
  const p = Game.player, v = Game.ui.mob;
  let n = 0;
  do {
    if (o.uses <= 0 || !canAffordTrade(o, p.inventory)) break;
    for (const [it, q] of o.cost) removeItem(p.inventory, it, q);
    giveOrDrop(makeStack(o.result[0], o.result[1]));
    o.uses--; n++;
  } while (all && n < 64);
  sfx(n ? 'villager.yes' : 'villager.no', v ? mobPos(v) : undefined);
  if (n) Adv.grant('trade');
  refreshInventoryUI();
}
function renderTradeSection() {
  const box = el('trade-section'), v = Game.ui.mob, inv = Game.player.inventory;
  box.innerHTML = '';
  const icon = (it, q) => {
    const d = document.createElement('div'); d.className = 'slot trade-slot';
    const i = document.createElement('div'); i.className = 'slot-icon'; i.style.cssText = iconStyleFor(it); d.appendChild(i);
    if (q > 1) { const t = document.createElement('div'); t.className = 'slot-qty'; t.textContent = q; d.appendChild(t); }
    attachTooltip(d, () => ({ item: it, qty: q }));
    return d;
  };
  for (const o of v.offers) {
    const ok = o.uses > 0 && canAffordTrade(o, inv);
    const row = document.createElement('div'); row.className = 'trade-row' + (ok ? '' : ' disabled');
    for (const [it, q] of o.cost) row.appendChild(icon(it, q));
    const arrow = document.createElement('div'); arrow.className = 'trade-arrow'; arrow.textContent = o.uses > 0 ? '\u2192' : '\u2715'; row.appendChild(arrow);
    row.appendChild(icon(o.result[0], o.result[1]));
    const info = document.createElement('div'); info.className = 'trade-info';
    info.textContent = o.uses > 0 ? `${o.uses} left today` : 'Sold out until tomorrow';
    row.appendChild(info);
    row.title = 'Click to trade, shift-click to trade as many times as you can';
    row.addEventListener('click', (e) => doTrade(o, e.shiftKey));
    box.appendChild(row);
  }
}
