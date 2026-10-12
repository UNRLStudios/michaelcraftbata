'use strict';
// =============================================================================
// THE LOST SOUL   (type 'lostsoul')
//   Trapped in the Underworld. Free it, then slay 50 demons; it forges the Abyssal Heart into the
//   key to the Overlord.
// =============================================================================
defineMob('lostsoul', {
  // ---- STATS ----
  stats: {
    name: 'The Lost Soul', w: 0.8, h: 1.5, speed: 1.2, health: 999, hostile: false, dmg: 0, kb: 0, flying: true,
    sunproof: true, fireproof: true, npc: true, under: true, glow: '120,220,255',
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 16 },
  // ---- AI ----
  ai: 'lostsoul',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.lostsoul, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/vex/idle', 4), vol: 0.5, pitch: [0.7, 0.8], cat: 'volFriendly' },
    wail: { files: n_('mob/vex/charge', 3), vol: 0.5, pitch: [0.42, 0.5], cat: 'volFriendly' },
    'soul.free': { files: ['terraria/research_3'], vol: 0.9, pitch: [0.8, 0.9], cat: 'volFriendly' },
    'soul.forge': { files: ['terraria/item_74'], vol: 0.9, pitch: [0.8, 0.9], cat: 'volFriendly' },
  },
  // ---- LOOT ----
  // (drops nothing)
});

// ---- AI ----
// ---- THE LOST SOUL ----
// He waits in his cage in the Soul Temple. Talk to him to free him; he counts the demons
// you slay from then on, and at 50 he forges you a Demon Heart (and again for every 50 more).
MOB_AI12.lostsoul = function (m, dt, p, dx, dist) {
  const U = Game.world, T = U.temple ? U.temple() : null;
  if (!T) { m.dead = true; return; }
  const freed = Game.flags.soulFreed, hx = T.cx + 0.5, hy = freed ? T.floor - 4.5 : T.floor - 4.7;
  const tx = freed ? hx + Math.sin(Game.time * 0.35) * 6 : hx, ty = hy + Math.sin(Game.time * 0.9 + m.id) * (freed ? 1.2 : 0.4);
  const mcx = m.x + m.w / 2, mcy = m.y + m.h / 2;
  m.vx += ((tx - mcx) * 1.5 - m.vx) * Math.min(1, dt * 2); m.vy += ((ty - mcy) * 1.5 - m.vy) * Math.min(1, dt * 2);
  m.x += m.vx * dt; m.y += m.vy * dt;
  m.facingDir = dx > 0 ? 1 : -1;
  m.health = m.maxHealth;
  if (Math.random() < dt * 8 * particleMul()) Game.particles.push({ x: mcx + (Math.random() - 0.5) * 0.6, y: m.y + m.h, vx: (Math.random() - 0.5) * 0.3, vy: -0.6, life: 1, age: 0, size: 0.07, color: Math.random() < 0.5 ? 'rgba(160,235,255,0.8)' : 'rgba(255,255,255,0.7)', gravity: -0.3, kind: 'star' });
  m.wailCd = (m.wailCd == null ? 3 : m.wailCd) - dt;
  if (m.wailCd <= 0) { m.wailCd = freed ? 14 + Math.random() * 10 : 7 + Math.random() * 6; if (dist < 140) sfx(freed ? 'lostsoul.say' : 'lostsoul.wail', { x: mcx, y: mcy, vol: freed ? 0.7 : 1.4 }); if (!freed && dist < 24 && dist > 5) npcSay(m, pick(['Help... please...', 'Is someone there?', 'Over here...', 'Let me out...']), 3); }
};
// the host keeps him there (one, in his temple)
function ensureLostSoul14() {
  if (netIsClient() || !onUnder14()) return;
  const U = Game.world, T = U.temple(), p = Game.player;
  if (!bossPlayers().concat([p]).some(q => Math.abs(q.x - T.cx) < 90)) return;   // (anyone near the temple)
  if (Game.mobs.some(m => m.type === 'lostsoul' && !m.dead)) return;
  const m = new Mob('lostsoul', T.cx + 0.5 - 0.4, T.floor - 5.5); m.guardian = true; m.style = { name: 'The Lost Soul', title: 'a soul' }; m.state = 'idle'; Game.mobs.push(m);
}
function freeLostSoul14(m) {
  if (Game.flags.soulFreed) return;
  if (netIsClient()) { netSend(null, { t: 'soul14', a: 'free' }); return; }
  const U = Game.world, T = U.temple();
  Game.flags.soulFreed = true; Game.flags.demonKills = Game.flags.demonKills | 0;
  for (let dx = -2; dx <= 2; dx++) for (let k = 0; k < 5; k++) { const x = T.cx + dx, y = T.floor - 3 - k; if (U.getTile(x, y) === SOUL_CAGE) { spawnBreakParticles(x, y, SOUL_CAGE, 6); U.setTile(x, y, AIR); } }
  netFxCapture(T.cx, T.floor - 5, () => {
    sfx('soul.free', { x: T.cx, y: T.floor - 5 }); screenShake(0.4);
    eventMessage('The Lost Soul is free! Slay 50 demons and he will forge you a Demon Heart.', '#9ad8ff');
  });
  for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, sp = 1 + Math.random() * 5; Game.particles.push({ x: T.cx + 0.5, y: T.floor - 5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, age: 0, size: 0.1, color: i % 2 ? '#bff4ff' : '#ffffff', gravity: 0, kind: 'star' }); }
  soulAdv14('lostsoul');
}
// ---- counting the demons (on the host: everything with def.demon that dies down here) ----
function demonDied14(mob) {
  if (!mob.def.demon || netIsClient() || !onUnder14() || !Game.flags.soulFreed || mob.small) return;
  Game.flags.demonKills = (Game.flags.demonKills | 0) + 1;
  if (Game.flags.demonKills === 50) netFxCapture(mob.x, mob.y, () => { eventMessage('50 demons slain! Go back to the Lost Soul: he can forge a Demon Heart now.', '#ff7a5a'); sfx('toast.challenge'); });
}

// ---- VISUALS (drawing and effects) ----
const DEMON_PAL14 = { k: '#14060a', r: '#5a0f14', R: '#8e1b22', o: '#c8322a', h: '#e8d8b8', H: '#a8987a', y: '#ffd23a', Y: '#fff2a0', f: '#ff7a1a', w: '#3a0a10', W: '#6a1a24', b: '#2a1a1a' };
// ---- what the demons look like (little pixel grids, a few frames each) ----
const SPR_DEMON14 = {
  demonA: ['..h......h..', '.hH......Hh.', '.H.kRRRRk.H.', '...RoRRoR...', '...RyRRyR...', '...RRkkRR...', '....RRRR....', '..rRRRRRRr..', '.rRRoRRoRRr.', '.r.RRRRRR.r.', '...RR..RR...', '...rk..kr...'],
  wingA: ['kw.........', 'kWw........', 'kWWw.......', 'kWWWw......', 'kWWWWw.....', 'kWWWWWww...', 'kWW.WW.Ww..', 'kW..W...W..'],
  wingB: ['kWWWWWWWw..', 'kWWWWWWw...', 'kWWWWWw....', 'kWW.Ww.....', 'kW..w......'],
  hound0: ['.........hh..', '........kRRk.', '.r......RyRoR', 'rRRRRRRRRRRRk', 'rRoRRRoRRRR..', '.RRRRRRRRR...', '.Rk.Rk..Rk.R.', '.k..k...k..k.'],
  hound1: ['.........hh..', '........kRRk.', 'r.......RyRoR', 'rRRRRRRRRRRRk', '.RoRRRoRRRR..', '.RRRRRRRRR...', 'R.k.R..k.R...', 'k...k..k.k...'],
  hound2: ['..........hh.', 'r........kRRk', 'rRRRRRRRRRyRo', '.RoRRRoRRRRRk', '.RRRRRRRRR...', 'R.........R..', 'k..........k.'],
  imp0: ['.h....h.', '.hRRRRh.', '..RyyR..', '..RkkR..', '.rRRRRr.', 'f.RooR.f', '..RRRR..', '..R..R..', '..k..k..'],
  imp1: ['.h....h.', '.hRRRRh.', '..RYYR..', '..RkkR..', 'frRRRRrf', '..RooR..', '..RRRR..', '..R..R..', '..k..k..'],
  slime: ['...ffff...', '.ffYYyyff.', 'ffYyffffff', 'ffkfffkfff', 'fffffffffo', 'ofoffffoof', '.oooooooo.'],
  brute0: ['..hh....hh..', '...hRRRRh...', '...RyRRyR...', '...RRkkRR...', '..RRRRRRRR..', '.RRRooooRRR.', 'RRRRooooRRRR', 'RR.RRRRRR.RR', 'Rr.RRRRRR.rR', 'kk.RRRRRR.kk', '...RRR.RRR..', '...RR...RR..', '...RR...RR..', '..kkk...kkk.'],
  brute1: ['k..hh....hh..k', 'RR..hRRRRh..RR', '.RR.RyRRyR.RR.', '..RRRRkkRRRR..', '...RRRRRRRR...', '...RRooooRR...', '...RRooooRR...', '...RRRRRRRR...', '...RRRRRRRR...', '...RRRRRRRR...', '...RRR..RRR...', '...RR....RR...', '...RR....RR...', '..kkk....kkk..'],
  soul: ['...cccc...', '..cCCCCc..', '.cCCwCwCc.', '.cCCCCCCc.', '.cCCkkCCc.', '..cCCCCc..', '.ccCCCCcc.', 'c.cCCCCc.c', '..cCCCCc..', '..cCCCCc..', '...cCCc...', '...c..c...', '..c....c..'],
};
const SOUL_PAL14 = { c: 'rgba(120,220,255,0.55)', C: 'rgba(200,245,255,0.85)', w: '#ffffff', k: 'rgba(20,60,90,0.9)' };
function demonSpr14(name) { return spr14('d14' + name, SPR_DEMON14[name], name === 'soul' ? SOUL_PAL14 : DEMON_PAL14); }
MOB_DRAW.lostsoul = (g, m, u, eyes) => {
  const bob = Math.sin(Game.time * 1.8 + m.id) * 1.2 * u, a = 0.75 + 0.2 * Math.sin(Game.time * 3);
  g.save(); g.globalAlpha = a; g.translate(0, bob);
  drawSpr14(g, demonSpr14('soul'), 5, 6.5, u * 1.85);
  g.restore();
};
function heartFX14(x, y) {
  for (let i = 0; i < 50; i++) { const a = Math.random() * 6.28, r = 3 + Math.random() * 3; Game.particles.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: -Math.cos(a) * r * 2, vy: -Math.sin(a) * r * 2, life: 0.5, age: 0, size: 0.1, color: i % 2 ? '#ff2a3a' : '#ffb347', gravity: 0, kind: 'star' }); }
  flashAt(x, y, 4, '255,60,60', 0.3);
}
function drawSoulPortrait14(g, cv) {
  g.fillStyle = '#0a1a24'; g.fillRect(0, 0, cv.width, cv.height);
  const t = Date.now() / 1000, u = cv.width / 14;
  g.save(); g.globalAlpha = 0.85 + 0.1 * Math.sin(t * 3); g.imageSmoothingEnabled = false;
  g.drawImage(demonSpr14('soul'), 2 * u, (1 + Math.sin(t * 2) * 0.3) * u, 10 * u, 13 * u); g.restore();
  if (!Game.flags.soulFreed) { g.fillStyle = '#3a3440'; for (let i = 0; i < 5; i++) g.fillRect(Math.round((1 + i * 3) * u), 0, Math.ceil(u * 0.8), cv.height); }
}
B12.post.push(function demonCounter14() {
  if (!onUnder14() || !Game.flags || !Game.flags.soulFreed || Game.screen === 'title' || (Game.boss && !Game.boss.dead)) return;
  const n = Game.flags.demonKills | 0, txt = n >= 50 ? 'Demon Heart ready: see the Lost Soul' : `Demons slain: ${n} / 50`;
  const fs = Math.max(12, Math.round(VIEW.h / 40));
  ctx.font = `${fs}px "MC Body", "MC Body Alt", monospace`; ctx.textAlign = 'center';
  const x = VIEW.w / 2, y = Math.round(VIEW.h * 0.12);
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(txt, x + 2, y + 2); ctx.fillStyle = n >= 50 ? '#ffd23a' : '#ff8a6a'; ctx.fillText(txt, x, y);
  ctx.textAlign = 'left';
});

// ---- WHAT IT SAYS, AND THE HEART ----
function soulAdv14(id) { Adv.grant(id); if (netIsHost()) netSend(null, { t: 'adv', id }); }
function forgeHeart14(m) {
  if (netIsClient()) { netSend(null, { t: 'soul14', a: 'forge' }); return; }
  if ((Game.flags.demonKills | 0) < 50) return;
  Game.flags.demonKills -= 50; Game.flags.heartsForged = (Game.flags.heartsForged | 0) + 1;
  heartFX14(m.x + m.w / 2, m.y + m.h / 2);
  giveOrDrop(makeStack(DEMON_HEART, 1)); refreshInventoryUI(); soulAdv14('demonheart');
  netFxCapture(m.x, m.y, () => { sfx('soul.forge', { x: m.x, y: m.y }); eventMessage('The Lost Soul forged a Demon Heart!', '#ff5a5a'); });
}
// a friend asks the host to free him / to forge (the host's game does it, then hands the heart over)
function soulNetFromClient14(id, o) {
  const U = Game.underW14 && onUnder14() ? Game.world : null; if (!U) return;
  const m = Game.mobs.find(q => q.type === 'lostsoul' && !q.dead);
  if (o.a === 'free') { if (m) freeLostSoul14(m); }
  else if (o.a === 'forge' && m && (Game.flags.demonKills | 0) >= 50) {
    Game.flags.demonKills -= 50; Game.flags.heartsForged = (Game.flags.heartsForged | 0) + 1;
    netSend(id, { t: 'give', s: { item: DEMON_HEART, qty: 1 } }); netSend(id, { t: 'adv', id: 'demonheart' });
    netFxCapture(m.x, m.y, () => { sfx('soul.forge', { x: m.x, y: m.y }); eventMessage('The Lost Soul forged a Demon Heart!', '#ff5a5a'); });
  }
}
function lostSoulDialog14(m) {
  const freed = Game.flags.soulFreed, n = Game.flags.demonKills | 0, name = playerName();
  return {
    start: freed ? {
      text: n >= 50 ? `${n} demons... yes. I can feel their hearts burning. Give me a moment, ${name}, and I will forge you one. Then take it to an altar, and call HIM.` : `You came back. ${n} demons slain of the 50 I need. Their hearts are what I forge with... bring me more of them.`,
      options: [
        n >= 50 ? { label: 'Forge me a Demon Heart', action: () => forgeHeart14(m), go: 'forged' } : { label: `${n} / 50 demons slain`, disabled: true },
        { label: 'Tell me about the Overlord', go: 'overlord' },
        { label: 'How do I get home?', go: 'home' },
        { label: 'Goodbye', },
      ]
    } : {
      text: 'You... you can SEE me? Please! He locked me in here a thousand years ago, when I would not serve him. Open this cage and I will help you, I swear it.',
      options: [{ label: 'I\'ll get you out', action: () => freeLostSoul14(m), go: 'freed' }, { label: 'Who locked you in?', go: 'who' }, { label: 'Not now', }],
    },
    who: { text: 'THE OVERLORD. A dragon as old as the fire itself. He rules all of this. The demons are his, the fire is his... Free me, and I will show you how to call him out.', options: [{ label: 'I\'ll get you out', action: () => freeLostSoul14(m), go: 'freed' }, { label: 'Not now' }] },
    freed: { text: 'FREE! After all these years... Thank you. Now listen: slay 50 of his demons. I will feel each one die. Come back to me and I will forge their hearts into a DEMON HEART.', options: [{ label: 'And then?', go: 'overlord' }, { label: 'I\'m on it' }] },
    overlord: { text: 'Build an altar of the Underworld. Set FIVE Blocks of Gold in a row in the floor, the altar on the middle one, and the Demon Heart on the altar. He will come. He is the strongest thing there is... bring your best, and keep moving. When he sweeps fire at your head: DUCK.', options: [{ label: 'Got it', go: 'start' }, { label: 'Goodbye' }] },
    home: { text: 'Dig up through the ceiling, all the way through the bedrock, and you will come out near the bottom of your world. Or... I can send you there now. Only you, the living, can go.', options: [{ label: 'Send me home', action: () => { if (netIsClient()) netSend(null, { t: 'soul14', a: 'home' }); else goUp14(Game.player.x); } }, { label: 'I\'ll stay', go: 'start' }] },
    forged: { text: 'There. A Demon Heart. It is still beating... take it, quickly. And may the fire not take you.', options: [{ label: 'Thank you', }] },
  };
}
