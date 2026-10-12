'use strict';
// =============================================================================
// ABYSS IMP   (type 'imp')
//   A little horned devil of the Abyss (and the King's summons). Flies, circles, dives.
// =============================================================================
defineMob('imp', {
  // ---- STATS ----
  // ---- the Abyss ----
  stats: {
    name: 'Abyss Imp', w: 0.7, h: 0.8, speed: 4.6, health: 10, hostile: true, dmg: 3, kb: 1.2, flying: true,
    fireproof: true,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  brain: swoopBrain,
  // ---- VISUALS ----
  deathColors: ['#8e1b22', '#e0b84a'],
  // (drawn by MOB_DRAW.imp, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/vex/idle', 4), vol: 0.5, pitch: [0.7, 0.9], cat: 'volCreatures', synth: 'screech' },
    hurt: { files: n_('mob/vex/hurt', 2), vol: 0.6, pitch: [0.7, 0.9], cat: 'volCreatures', synth: 'hit' },
    death: { files: n_('mob/vex/death', 2), vol: 0.6, pitch: [0.7, 0.9], cat: 'volCreatures', synth: 'death' },
    charge: { files: n_('mob/vex/charge', 3), vol: 0.5, pitch: [0.7, 0.9], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    const r = Math.random;
    if (r() < 0.3) spawnDrop(134, 1, mx, my);
  },
});

// ---- VISUALS (drawing and effects) ----
const IMPA_P = { k: '#1a0508', r: '#7e1620', R: '#b82c2a', h: '#e0c070', e: '#ffcc33', m: '#2a0508', t: '#f0e8d8', d: '#4a0c12' };
const IMPA_G = { body: ['.h.....h.', '.hh...hh.', '..RRRRR..', '.RRRRRRR.', '.RRRReRe.', '.RRRRRRR.', '..RRmtmt.', '...RRRR..', '..rRRRRr.', '.rRrRRRRr', '.r.rRRr.r', '...rRRr..', '...r..r..', '...d..d..'] };
MOB_DRAW.imp = (g, m, u, eyes) => {
  const body = mp14('impa', 'body', IMPA_G.body, IMPA_P, { flat: 'e' }), f = m.flap || 0, a = 0.6 + Math.sin(f) * 1.0, bob = (-Math.sin(f) * 1);
  rig14(g, u, 48, 44, 24, 22, b => {
    b.translate(0, bob);
    const tw = Math.sin(Game.time * 5 + m.id) * 2;   // the tail
    line14(b, -2, 4, -6, 6 + tw * 0.4, '#7e1620', 1); line14(b, -6, 6 + tw * 0.4, -8, 3 + tw, '#7e1620', 1); px14(b, -9, 2 + tw, 2, 2, '#b82c2a');
    const wing = (dark, da) => { b.save(); b.translate(-1, -1); b.scale(-1, 1); if (dark) DK14 = 0.6; wing14(b, 10, a + da, { m: '#4a0d12', m2: '#6e1820', b: '#1a0508', ol: OL14 }, { back: [3, 3], fingers: 3, spread: 1.3 }); DK14 = 0; b.restore(); };
    wing(true, 0.3);
    drawP14(b, body, 0, 0, 4, 7, 1);
    wing(false, 0);
  });
  if (m.dying == null) { eyes14(eyes, 1, -3 + bob, u, '255,200,60', 0.9); eyes14(eyes, 3, -3 + bob, u, '255,200,60', 0.9); }
};
