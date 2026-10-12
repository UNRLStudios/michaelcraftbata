'use strict';
// =============================================================================
// GLOOM OWL   (type 'gloomowl')
//   A big-eyed night owl of the Redwood. Flies at night, circles and dives; gone by day.
// =============================================================================
defineMob('gloomowl', {
  // ---- STATS ----
  stats: {
    name: 'Gloom Owl', w: 0.95, h: 0.8, speed: 4.2, health: 9, hostile: true, dmg: 3, kb: 1.4, flying: true,
    sunproof: true, nocturnal: true, loot: [[STRING, 1, 2, 0.5], [133, 1, 1, 0.3], [MOONPETAL, 1, 1, 0.12]],
    eye: [4, 0.3, '255,210,60'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  brain: swoopBrain,
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.gloomowl, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/bat/idle', 4), vol: 0.8, pitch: [0.55, 0.7], cat: 'volCreatures' },
    hurt: { files: n_('mob/bat/hurt', 4), vol: 0.9, pitch: [0.6, 0.8], cat: 'volCreatures' },
    death: { files: ['mob/bat/death'], vol: 0.9, pitch: [0.6, 0.7], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- VISUALS (drawing and effects) ----
const OWL_P = { o: '#3a2c4e', O: '#55426e', F: '#8a7aa6', Y: '#ffd23c', k: '#120a18', b: '#e0a63a', w: '#b8a8cc', W: '#6e5c8a', c: '#d8c088', t: '#2a1e3a' };
const OWL_G = { body: ['..t.....t..', '..tt...tt..', '.oOOOOOOOo.', 'oOFFFOFFFOo', 'oFYYFFFYYFo', 'oFYkFbFYkFo', 'oOFFFbFFFOo', '.oOFFFFFOOo', '.oOwwWwwOo.', '.oOwWwWwOo.', '.ooOwwwOoo.', '..ooOwOoo..', '..c.c..c.c.'] };
MOB_DRAW.gloomowl = (g, m, u, eyes) => {
  const body = mp14('gloomowl', 'body', OWL_G.body, OWL_P, { flat: 'Yk' }), f = m.flap || 0, a = 0.5 + Math.sin(f) * 0.95, bob = (-Math.sin(f) * 1);
  rig14(g, u, 56, 48, 28, 24, b => {
    b.translate(0, bob);
    const wing = (dark, da) => { b.save(); b.translate(-2, -1); b.scale(-1, 1); if (dark) DK14 = 0.6; wing14(b, 13, a + da, { m: '#4e3e68', m2: '#6e5c8e', b: '#2a1e3a', f: '#8a78aa', ol: OL14 }, { back: [4, 5], fingers: 5, spread: 1.2, bw: 2, feather: true }); DK14 = 0; b.restore(); };
    wing(true, 0.3);
    drawP14(b, body, 0, 0, 5, 6, 1);
    wing(false, 0);
  });
  if (m.dying == null) { eyes14(eyes, 2.5, -1.5 + bob, u, '255,210,60', 1); eyes14(eyes, -2.5, -1.5 + bob, u, '255,210,60', 1); }
};
