'use strict';
// =============================================================================
// TONIO   (type 'tonio')
//   The rancher. Lives at his ranch; talk to him (right-click). Can't be hurt.
// =============================================================================
defineMob('tonio', {
  // ---- STATS ----
  // ---- Alpha 1.3: people you can talk to (right-click). They can't be hurt, except a Sensei in a duel ----
  stats: {
    name: 'Tonio', w: 0.6, h: 1.8, speed: 1.3, health: 20, hostile: false, dmg: 0, kb: 1, npc: true,
    custom: 'tonio',
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'none' },   // he keeps to his ranch
  // ---- AI ----
  update: tonioAI,
  // ---- VISUALS ----
  draw: drawTonio,
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/wandering_trader/idle', 5), vol: 0.7, pitch: [0.95, 1.05], cat: 'volFriendly' },
    yes: { files: n_('mob/wandering_trader/yes', 4), vol: 0.7, pitch: [0.95, 1.05], cat: 'volFriendly' },
    no: { files: n_('mob/wandering_trader/no', 3), vol: 0.7, pitch: [0.95, 1.05], cat: 'volFriendly' },
  },
  // ---- LOOT ----
  // (drops nothing)
});

// ---- AI ----
// ---- TONIO ------------------------------------------------------------------
const TONIO_LINES = ["Hola, amigo!", "Careful, she kicks like a mule.", "Nice day for it, eh?", "Mind the stove, it's hot.",
  "Grandpappy would've liked you.", "Tacos later. You in?", "Ey, don't touch the rack!"];
function spawnTonio(I) {
  if (I.mobs.some(m => m.type === 'tonio')) return;
  let at = { c: 12, r: 4 };
  I.plan.forEach((row, r) => { const c = row.indexOf('N'); if (c >= 0) at = { c, r }; });
  const m = new Mob('tonio', I.x0 + at.c + 0.2, 0);
  m.y = I.y0 + at.r + 1 - m.h; m.homeX = m.x; m.facingDir = -1;
  I.mobs.push(m);
}
function tonioAI(m, dt, p, dx, dist) {
  m.stateTimer -= dt; m.soundCd -= dt;
  const P = m.pose = {};
  let vx = 0;
  if (Game.screen === 'dialog' && Dialog.npc === m) {
    m.facingDir = dx > 0 ? 1 : -1;
    P.arm = -1.2 + Math.sin(Game.time * 5) * 0.4; P.back = 0.2;   // talks with his hands
  } else if (dist < 5) {
    m.facingDir = dx > 0 ? 1 : -1;
    if (!m.greeted) { m.greeted = true; m.waveT = 1.4; npcSay(m, `Hey there, ${playerName()}!`); sfx('tonio.say', mobPos(m)); }
    if (m.soundCd <= 0) { m.soundCd = 9 + Math.random() * 8; npcSay(m, pick(TONIO_LINES)); sfx('tonio.say', mobPos(m)); }
  } else {
    m.greeted = dist < 9 && m.greeted;
    vx = wanderVx(m, dt) * 0.8;
    if (m.homeX != null && Math.abs(m.x - m.homeX) > 3) vx = Math.sign(m.homeX - m.x) * m.def.speed * 0.5;
  }
  if (m.waveT > 0) { m.waveT -= dt; P.arm = -2.9 + Math.sin(Game.time * 16) * 0.3; }
  mobMove(m, vx, dt);
}

// ---- VISUALS (drawing and effects) ----
// ---- NPC MODELS -------------------------------------------------------------
// Tonio: light skin, a big black afro, a mustache and goatee, and an old
// navy musketeer's coat with brass buttons (K) and a white cravat (W).
// Tonio (Alpha 1.3, redrawn): light skin, a big round black afro, sideburns, a
// mustache and goatee, a red bandana, a brown leather vest over a cream shirt
// with rolled-up sleeves, a bandolier of brass musket balls, and tall boots.
//   A/a afro   H facial hair   G/g bandana   C/c vest   T/t/d shirt   R brass   L leather strap
const TONIO_GRIDS = {
  head: ['AAAAAAAA', 'AAAAAAAa', 'AAAAAASS', 'AAAsSHHS', 'AAssSSWE', 'AAHsSSSs', 'AHHsHHHH', '.HHSHMHH'],
  body: ['gGGG', 'CgGt', 'CLtT', 'CCRt', 'CcLT', 'CCRt', 'CCcL', 'cCCR', 'cCCt', 'BBBK', 'pPPP', 'pPPP'],
  arm: ['.dTt', '.dTt', '.dTt', '.dTt', '.ttt', '.sSS', '.sSS', '.sSS', '.sSS', '.sSS', '.sSS', '.sSS'],   // (slim, so the vest shows)
  leg: ['pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'pPPP', 'oOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOo', 'OOOO'],
};
const TONIO_PAL = {
  hair: '#1c1512', hairHi: '#3a2a22', skin: '#c68d62', skinShade: '#a5714a', mouth: '#7a3a2a', eyeWhite: '#f6f1ea', eye: '#2b1a10',
  shirt: '#e8dcc0', shirtHi: '#f7efdc', shirtShade: '#c9bb99', belt: '#3a2414', buckle: '#d9ad4a',
  pants: '#5a4630', pantsShade: '#46361f', boots: '#2a1a10', bootsHi: '#4a3020',
  x1: '#18110e', x2: '#3a2a23', x3: '#7a4a2a', x4: '#5a341c', x5: '#c0262e', x6: '#861a20', x7: '#e0b44a', x9: '#3e2616',
};
// The afro: a big round cloud of curls, drawn behind the head (the head's own
// pixels cover the middle, so only the part sticking out shows).
const AFRO = [
  '.....AAAAA.....',
  '...AAaAAAAaA...',
  '..AAAAAAaAAAA..',
  '.AAaAAAAAAAAaA.',
  '.AAAAAaAAAAAAAA',
  'AAAAAAAAAAaAAAA',
  'AaAAAAAAAAAAAA.',
  'AAAAaAAAAAAAA..',
  'AAAAAAAAAA.....',
  '.AAaAAAAA......',
  '..AAAAAA.......',
  '...AAA.........',
];
function drawAfro(g, u) {
  const x0 = -10, y0 = -14;
  for (let r = 0; r < AFRO.length; r++) for (let c = 0; c < AFRO[r].length; c++) {
    const ch = AFRO[r][c];
    if (ch === '.') continue;
    const edge = (AFRO[r - 1] || '')[c] !== ch && (AFRO[r - 1] || '')[c] !== 'a' && (AFRO[r - 1] || '')[c] !== 'A'
      || (AFRO[r][c - 1] || '.') === '.' || (AFRO[r][c + 1] || '.') === '.';
    g.fillStyle = ch === 'a' ? '#4a372c' : edge ? '#3a2b22' : ((r * 3 + c) % 5 === 0 ? '#2a1f1a' : '#1a1310');
    g.fillRect((x0 + c) * u, (y0 + r) * u, u + 0.35, u + 0.35);
  }
}
// Front-facing portraits for the talk screen (24x24, drawn 4x).
const PORTRAIT_TONIO = [
  '.....AAAAAAAAAAAAAA.....',
  '...AAAaAAAAAAAAaAAAAA...',
  '..AAaAAAAAAaAAAAAAAaAA..',
  '.AAAAAAAaAAAAAAAaAAAAAA.',
  '.AAaAAAAAAAAAAAAAAAAaAA.',
  'AAAAAAAAAaAAAAaAAAAAAAAA',
  'AAAAaAAAAAAAAAAAAAAaAAAA',
  'AAAAAAASSSSSSSSSSAAAAAAA',
  'AAAaAASSSSSSSSSSSSAAaAAA',
  'AAAAAHSSSSSSSSSSSSHAAAAA',
  '.AAAAHSHHHSSSSHHHSHAAAA.',
  '.AAAAsSWEWSSSSWEWSsAAAA.',
  '..AAsSSSSSSssSSSSSSsAA..',
  '...AHSSSSSSssSSSSSSHA...',
  '....HSSSSSsssSSSSSSH....',
  '....HSSHHHHHHHHHHSSH....',
  '.....HSHHHMMMMHHHSH.....',
  '.....sHSHHHHHHHHSHs.....',
  '......sSSSHHHHSSSs......',
  '.......sSSSHHSSSs.......',
  '......GGGGGGGGGGGG......',
  '...tCCCGGGgGGGGCCCt.....',
  '..ttCCCCRttgtLCCCCtt....',
  '.tttCCCCCRttLCCCCCCttt..',
];
function drawTonio(g, m, u0) {
  const w = m.w * TILE, h = m.h * TILE, t = Game.time;
  const moving = Math.abs(m.vx) > 0.1, sw = moving ? Math.sin(m.legPhase) * 0.45 : 0;
  const P = m.pose || {};
  g.save(); g.translate(-w / 2, -h);
  drawPlayerSprite(g, w, h, {
    grids: TONIO_GRIDS, pal: TONIO_PAL, legSwing: sw, headTilt: P.head != null ? P.head : Math.sin(t * 0.9 + m.id) * 0.05,
    armAngle: P.arm != null ? P.arm : -0.22 - sw * 0.6, backArmAngle: P.back != null ? P.back : 0.3 + sw * 0.6, breath: (Math.sin(t * 2.1) + 1) * 0.3,
    preHead: drawAfro, blink: ((t * 0.37 + m.id) % 4) < 0.1,
  });
  g.restore();
}

// ---- WHAT HE SAYS ----
function tonioDialog(m) {
  const name = playerName(), inv = Game.player.inventory, sold = Game.flags.tonioSold;
  const ems = countItem(inv, 134);
  const buy = () => {
    if (Game.flags.tonioSold) return;
    if (countItem(inv, 134) < 60 && !Game.creative) { showDialogNode('poor'); sfx('tonio.no', mobPos(m)); return; }
    if (!Game.creative) removeItem(inv, 134, 60);
    const s = makeStack(MUSKET, 1); s.loaded = true;
    giveOrDrop(s); giveOrDrop(makeStack(MUSKET_BALL, 8));
    Game.flags.tonioSold = true;
    sfx('tonio.yes', mobPos(m)); sfx('toast.challenge');
    eventMessage(`${name} bought Tonio's Musket!`, '#ffd27a');
    refreshInventoryUI();
    showDialogNode('sold');
  };
  const balls = () => {
    if (countItem(inv, 134) < 2 && !Game.creative) { sfx('tonio.no', mobPos(m)); showDialogNode('poorballs'); return; }
    if (!Game.creative) removeItem(inv, 134, 2);
    giveOrDrop(makeStack(MUSKET_BALL, 12)); sfx('tonio.yes', mobPos(m)); refreshInventoryUI();
    showDialogNode('balls');
  };
  const main = [
    sold ? { label: 'Buy Musket Balls (12 for 2 emeralds)', action: balls, stay: true }
      : { label: `Buy the Musket (60 emeralds, you have ${ems})`, action: buy, stay: true },
    { label: 'Tell me about the musket', go: 'musket' },
    { label: 'Who are you?', go: 'who' },
    { label: 'Goodbye' },
  ];
  if (!sold) main.splice(1, 0, { label: 'Buy Musket Balls (12 for 2 emeralds)', action: balls, stay: true });
  return {
    start: {
      text: sold ? `${name}! How's Bessie treating you? Keep her clean and she'll never let you down.`
        : `Well hey there, ${name}! Name's Tonio. Don't get many visitors way out here. You like my old girl up on the wall? That's Bessie. She's for sale... if you've got sixty emeralds.`, options: main
    },
    musket: { text: "Bessie's older than me. My grandpappy carried her across the great desert, back when the King of the Abyss still sent his imps up to the surface. One ball, one BANG, then you reload. Takes a couple of seconds, so make it count. Aim for the head!", options: [{ label: 'Back', go: 'start' }] },
    who: { text: "Just a man who likes his peace and quiet. And tacos. Mostly tacos. I used to travel, you know. Saw the dojos in the far hills once... those old men with the red swords don't mess around.", options: [{ label: 'Back', go: 'start' }] },
    poor: { text: `Sixty emeralds, amigo, not one less. You've got ${countItem(inv, 134)}. Villagers pay good emeralds for wheat and coal, you know.`, options: [{ label: 'Back', go: 'start' }] },
    poorballs: { text: 'Two emeralds for a dozen. Or make your own: an iron ingot, a lump of coal and some paper makes eight.', options: [{ label: 'Back', go: 'start' }] },
    sold: { text: "Pleasure doing business! I threw in eight balls for free. Left-click to shoot, and she reloads herself if you've got more. Treat her well.", options: [{ label: 'Thanks, Tonio!', go: 'start' }] },
    balls: { text: 'There you go. Twelve fresh ones. Mind the powder.', options: [{ label: 'Back', go: 'start' }, { label: 'Goodbye' }] },
  };
}
