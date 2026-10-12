'use strict';
// =============================================================================
// MICHAEL   (type 'michael')
//   The Maker of Worlds, the Sky Merchant, at the top of the Sky Islands. Sells the Magma Cannon; gives tips.
//   Hit him and he complains (he can't be hurt).
// =============================================================================
defineMob('michael', {
  // ---- STATS ----
  stats: {
    name: 'Michael', w: 0.6, h: 1.8, speed: 1.4, health: 999, hostile: false, dmg: 0, kb: 0, npc: true,
    sunproof: true, fireproof: true,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // he stays on his island
  // ---- AI ----
  ai: 'michael',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.michael, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/wandering_trader/idle', 5), vol: 0.7, pitch: [1.15, 1.25], cat: 'volFriendly' },
    yes: { files: n_('mob/wandering_trader/yes', 4), vol: 0.7, pitch: [1.15, 1.25], cat: 'volFriendly' },
  },
  // ---- LOOT ----
  // (drops nothing)
});

// ---- AI ----
const MICHAEL_LINES15 = ['Welcome to the top of the world!', "Mind the edge, it's a long way down.", 'Everything here is cheap. Seriously.', 'Have you met Tonio? Great guy. Loves tacos.',
  'I built the Overlord on a Tuesday.', 'The clouds are softer than they look.', 'Want to see something cool? Ask me about the cannon.', 'Best view in the whole world, right?'];
MOB_AI12.michael = function (m, dt, p, dx, dist) {
  if (!m.style) m.style = MICHAEL_STYLE15;
  m.soundCd = (m.soundCd || 0) - dt; m.health = m.maxHealth;
  const P = m.pose = {};
  let vx = 0;
  if (Game.screen === 'dialog' && Dialog.npc === m) {
    m.facingDir = dx > 0 ? 1 : -1;
    P.arm = -1.1 + Math.sin(Game.time * 5) * 0.35; P.back = 0.25; P.noCannon = false;
  } else if (dist < 6) {
    m.facingDir = dx > 0 ? 1 : -1;
    if (!m.greeted) { m.greeted = true; m.waveT = 1.6; npcSay(m, `Hey, ${playerName()}! You found me!`); sfx('michael.say', mobPos(m)); }
    if (m.soundCd <= 0) { m.soundCd = 10 + Math.random() * 8; npcSay(m, pick(MICHAEL_LINES15)); sfx('michael.say', mobPos(m)); }
  } else {
    m.greeted = dist < 10 && m.greeted;
    vx = wanderVx(m, dt) * 0.7;
    if (m.homeX != null && Math.abs(m.x - m.homeX) > 2.2) vx = Math.sign(m.homeX - m.x) * m.def.speed * 0.5;
  }
  if (m.waveT > 0) { m.waveT -= dt; P.arm = -2.9 + Math.sin(Game.time * 16) * 0.3; P.noCannon = true; }
  if (Math.random() < dt * 3 * particleMul()) Game.particles.push({ x: m.x + Math.random() * m.w, y: m.y + Math.random() * m.h, vx: 0, vy: -0.5, life: 0.8, age: 0, size: 0.06, color: Math.random() < 0.5 ? '#ffd23a' : '#fff6c0', gravity: -0.2, kind: 'star' });
  mobMove(m, vx, dt);
};
// he's there whenever someone comes near his island
B12.updaters.push(function ensureMichael15(dt, p) {
  const w = Game.world;
  if (!p || netIsClient() || !w.gen15 || w.isMoon || w.isUnder || w.isInterior || (loop.frames % 30)) return;
  const who = (typeof bossPlayers === 'function' ? bossPlayers() : []).concat([p]);
  const C = skyNear15(w, Math.floor(p.x)) || who.map(q => skyNear15(w, Math.floor(q.x))).find(Boolean);
  const mine = Game.mobs.filter(m => m.type === 'michael' && !m.dead);
  for (const m of mine) if (!who.some(q => Math.abs(q.x - m.x) < 220)) m.dead = true;
  if (!C || mine.some(m => !m.dead)) return;
  if (!who.some(q => Math.abs(q.x - C.c) < 110)) return;
  const M = C.main;
  if (w.getTile(M.c, M.top) === AIR) return;   // (his floor isn't loaded, or it's gone)
  const m = new Mob('michael', M.c + 0.5 - 0.3, M.top - MOB_TYPES.michael.h);
  m.guardian = true; m.homeX = m.x; m.facingDir = -1; m.style = MICHAEL_STYLE15; m.state = 'idle';
  Game.mobs.push(m);
});

// ---- VISUALS (drawing and effects) ----
const MICHAEL_STYLE15 = { name: 'Michael', title: 'Maker of Worlds, Sky Merchant' };
//   G/g red cap   T/t/d green hoodie   C pocket   r drawstring   P/p jeans   O/o white sneakers (red stripe)
const MICHAEL_GRIDS15 = {
  head: ['GGGGGGG.', 'GGGGGGGG', 'gggggggg', 'HHHsSSSS', 'HHssSSWE', 'HHHsSSSS', 'HHssSSSM', '.HsSSSSS'],
  body: ['ddTT', 'dTTr', 'dTTr', 'dTTT', 'dTTt', 'dCCt', 'dCCt', 'dTTt', 'dTTt', 'dddd', 'pPPP', 'pPPP'],
  arm: ['dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dTTt', 'dddd', 'sSSS', 'sSSS', 'sSSS', 'sSSS'],
  leg: ['pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'OOOO', 'oooo', 'OOOO', 'OOOO'],
};
const MICHAEL_PAL15 = {
  hair: '#4a2e1a', hairHi: '#6a4428', skin: '#e8b894', skinShade: '#cf9c78', mouth: '#9a4a3a', eyeWhite: '#ffffff', eye: '#2a5a8a',
  shirt: '#2f8f6a', shirtHi: '#45b088', shirtShade: '#1f6a4c', belt: '#1f6a4c', buckle: '#1f6a4c',
  pants: '#3a5a9a', pantsShade: '#2c4678', boots: '#f2f2f2', bootsHi: '#d03a3a',
  x3: '#257a5a', x5: '#d8323a', x6: '#a01e26', x7: '#ffd23a', x8: '#f4f4f4',
};
const PORTRAIT_MICHAEL15 = [
  '........................',
  '.......GGGGGGGGGG.......',
  '.....GGGGGGGGGGGGGG.....',
  '....GGGGGGGrrGGGGGGG....',
  '....GGGGGGGrrGGGGGGG....',
  '...gggggggggggggggggg...',
  '..gggggggggggggggggggg..',
  '....HHHHHHHHHHHHHHHH....',
  '...HHSSSSSSSSSSSSSSHH...',
  '...HSSHHHSSSSSSHHHSSH...',
  '...sSSWEWSSSSSSWEWSSs...',
  '...sSSSSSSSssSSSSSSSs...',
  '....SSSSSSSssSSSSSSS....',
  '....SSSSSSsssSSSSSSS....',
  '....SSSSSSSSSSSSSSSS....',
  '....sSSSSMMMMMMSSSSs....',
  '.....sSSSSSSSSSSSSs.....',
  '......sSSSSSSSSSSs......',
  '.......ssSSSSSSss.......',
  '.........ssSSss.........',
  '......dTTTTrTTrTTTTd....',
  '....dTTTTTTrTTrTTTTTTd..',
  '...dTTTTTTCrTTrCTTTTTTd.',
  '..dTTTTTTTCCCCCCTTTTTTTd',
];
function michaelPostHead15(g, u) { g.fillStyle = '#a01e26'; g.fillRect(4 * u, -6 * u, 2.6 * u, 1 * u); g.fillStyle = '#d8323a'; g.fillRect(4 * u, -6.4 * u, 2.2 * u, 0.5 * u); g.fillStyle = '#f4f4f4'; g.fillRect(1.5 * u, -7.6 * u, 1 * u, 1 * u); }
MOB_DRAW.michael = (g, m, u0) => {
  if (!m.style) m.style = MICHAEL_STYLE15;
  const w = m.w * TILE, h = m.h * TILE, t = Game.time;
  const moving = Math.abs(m.vx) > 0.1, sw = moving ? Math.sin(m.legPhase) * 0.45 : 0;
  const P = m.pose || {};
  g.save(); g.translate(-w / 2, -h);
  drawPlayerSprite(g, w, h, {
    grids: MICHAEL_GRIDS15, pal: MICHAEL_PAL15, legSwing: sw, headTilt: P.head != null ? P.head : Math.sin(t * 0.9 + m.id) * 0.05,
    armAngle: P.arm != null ? P.arm : -0.35 - sw * 0.5, backArmAngle: P.back != null ? P.back : 0.3 + sw * 0.6, breath: (Math.sin(t * 2.1) + 1) * 0.3,
    postHead: michaelPostHead15, blink: ((t * 0.37 + m.id) % 4) < 0.1, held: P.noCannon ? null : { item: MAGMA_CANNON },
  });
  g.restore();
};

// ---- HIS SHOP, HIS TIPS, AND HOW HE TALKS ----
// his shop: really cheap
function michaelOffers15() {
  const o = (cost, result, max) => ({ cost, result, max, uses: max });
  return [
    o([[134, 12]], [MAGMA_CANNON, 1], 1),
    o([[134, 1]], [MANA_POTION, 3], 8),
    o([[134, 4]], [MANA_STAR, 1], 3),
    o([[134, 2]], [120, 3], 6),
    o([[134, 1]], [128, 8], 8),
    o([[134, 1]], [129, 6], 8),
    o([[134, 2]], [GOLDEN_APPLE, 2], 4),
    o([[134, 1]], [132, 8], 10),
    o([[134, 1]], [212, 32], 8),
    o([[134, 1]], [CLOUD_BLOCK, 16], 10),
    o([[134, 1]], [GUST_CLOUD, 4], 10),
    o([[117, 4]], [134, 1], 16),
  ];
}
function openMichaelShop15(m) {
  if (!m.offers) { m.offers = michaelOffers15(); m.restockDay = Math.floor(dayClock() / DAY_LENGTH); }
  if (!m.job) m.job = { name: "Michael's Sky Shop" };
  closeNpcDialog();
  openTrade(m);
}
function buyCannon15(m) {
  const inv = Game.player.inventory, price = 12;
  if (countItem(inv, 134) < price && !Game.creative) { showDialogNode('poor'); return; }
  if (!Game.creative) removeItem(inv, 134, price);
  giveOrDrop(makeStack(MAGMA_CANNON, 1)); refreshInventoryUI();
  sfx('michael.yes', mobPos(m)); sfx('toast.challenge');
  eventMessage(`${playerName()} got the Magma Cannon from Michael!`, '#ffb347');
  showDialogNode('sold');
}
const MICHAEL_TIPS15 = [
  "Tonio sells a musket out in the desert somewhere. Bring sixty emeralds, he won't haggle.",
  'Torches keep monsters from spawning. Nights are a LOT busier than they used to be, trust me.',
  'Gust Clouds break your fall. I may have tested that more times than I want to admit.',
  'The Overlord hates the cold. Bring a Frost Wand.',
  "If you ever get lost, type /locate. It knows every biome now. Even this one.",
  'Mana comes back on its own, but a Mana Star gives you more of it for good.',
  'Ducking under a swing is a real thing. Press C.',
];
function michaelDialog15(m) {
  const name = playerName(), ems = countItem(Game.player.inventory, 134);
  if (Game.flags && !Game.flags.metMichael) { Game.flags.metMichael = true; m.metAt15 = Dialog.openedAt; Adv.grant('michael'); }
  const met = Game.flags && Game.flags.metMichael && m.metAt15 !== Dialog.openedAt;
  const main = [
    { label: 'Show me your shop', action: () => openMichaelShop15(m), stay: true },
    { label: 'What is the Magma Cannon?', go: 'cannon' },
    { label: 'You made this place?', go: 'made' },
    { label: 'How do I get up and down?', go: 'clouds' },
    { label: 'Any tips?', go: 'tips' },
    { label: 'Goodbye' },
  ];
  return {
    start: {
      text: met ? `${name}! Back again? Grab whatever you need. Prices are still ridiculous.`
        : `Whoa, a visitor! Hi ${name}, I'm Michael. I kind of... made all of this. The land, the monsters, the bosses, these islands. I live up here because the view is unbeatable. I run a little shop too, and everything's really cheap. What am I gonna spend emeralds on up here?`,
      options: main,
    },
    cannon: {
      text: `My favourite thing I've ever built! It lobs a ball of molten rock that bursts into a lava storm: a shockwave, burning globs, lava on the ground, the works. It runs on mana, and it kicks like a mule. For you? Just 12 emeralds.`,
      options: [{ label: `Buy it (12 emeralds, you have ${ems})`, action: () => buyCannon15(m), stay: true }, { label: 'Back', go: 'start' }],
    },
    made: { text: "Yep. Every block, every mob, every boss. The Overlord took forever. If something's broken... uh, that's a feature. And hey, thanks for playing. It means a lot.", options: [{ label: 'Back', go: 'start' }] },
    clouds: { text: "See the blue clouds? Those are Gust Clouds. Land on one and WHOOSH, up you go. I left a trail of them down to the ground so people could find me. Hold Duck to stand on one without bouncing, and they break your fall too. I sell them, if you want your own.", options: [{ label: 'Back', go: 'start' }] },
    tips: { text: pick(MICHAEL_TIPS15), options: [{ label: 'Another one', go: 'tips' }, { label: 'Back', go: 'start' }] },
    poor: { text: `It's 12 emeralds and you've got ${countItem(Game.player.inventory, 134)}. I'd give it away, but then it wouldn't feel special! Villagers trade emeralds, and I'll even swap you one for some coal.`, options: [{ label: 'Back', go: 'start' }] },
    sold: { text: 'Careful where you point it. Seriously. Left-click to fire. It eats mana, so keep a Mana Potion handy. Go have fun!', options: [{ label: 'Thanks, Michael!', go: 'start' }, { label: 'Goodbye' }] },
  };
}
{
  const dtOrig = dialogTree;
  dialogTree = function (m) { return m && m.type === 'michael' ? michaelDialog15(m) : dtOrig(m); };
  const sdnOrig = showDialogNode;
  showDialogNode = function (key) {
    const m = Dialog.npc;
    if (m && m.type === 'michael' && !m.style) m.style = MICHAEL_STYLE15;
    sdnOrig(key);
    if (m && m.type === 'michael' && Game.screen === 'dialog') el('npc-title').textContent = MICHAEL_STYLE15.title;
  };
  const portOrig = drawNpcPortrait;
  drawNpcPortrait = function (m) {
    if (!m || m.type !== 'michael') return portOrig(m);
    const cv = el('npc-portrait'), g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    const gr = g.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, '#7ec0ff'); gr.addColorStop(1, '#d8f0ff');
    g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = 'rgba(255,255,255,0.85)'; const u = cv.width / 24, cl = (Date.now() / 900) % 30;
    g.fillRect((cl - 6) * u, 3 * u, 6 * u, 1.5 * u); g.fillRect((cl - 5) * u, 2 * u, 3 * u, 1 * u); g.fillRect(((cl + 14) % 30 - 6) * u, 15 * u, 5 * u, 1.2 * u);
    g.imageSmoothingEnabled = false;
    const blink = ((Date.now() / 1000) % 4) < 0.14, talk = Dialog.typing && Math.floor(Date.now() / 110) % 2 === 0;
    let rows = PORTRAIT_MICHAEL15;
    if (blink) rows = rows.map(r => r.replace(/WEW/g, 'sss'));
    if (talk) rows = rows.map(r => r.replace('MMMMMM', 'SMHHMS'));
    drawGrid(g, rows, PX_MAP, Object.assign({ x8: '#f4f4f4', hair: talk ? '#3a1a14' : MICHAEL_PAL15.hair }, MICHAEL_PAL15), 0, 0, u);
  };
  const tagOrig = renderNpcTags;
  renderNpcTags = function (ox, oy) {
    for (const m of Game.mobs) if (m.type === 'michael' && !m.style) m.style = MICHAEL_STYLE15;
    tagOrig(ox, oy);
  };
  const npcHurtOrig = npcHurt;
  npcHurt = function (m, dmg, attacker, crit) {
    if (m && m.type === 'michael') { parryFX(m); if (attacker === Game.player || (attacker && attacker.isRemote)) npcSay(m, pick(['Hey! I made you!', 'Ow! Not cool!', "That's not how you say hi.", 'I can literally delete you, you know.']), 2); return; }
    return npcHurtOrig(m, dmg, attacker, crit);
  };
}
