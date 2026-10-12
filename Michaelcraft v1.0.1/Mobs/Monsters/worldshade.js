'use strict';
// =============================================================================
// WORLDSHADE   (type 'worldshade')
//   A shade of a broken world, summoned by the Slayer of Worlds. Moves and fights like a husk.
//   (Corrupted Shades also roam in Hardmode.)
// =============================================================================
defineMob('worldshade', {
  // ---- STATS ----
  stats: {
    name: 'Corrupted Shade', w: 0.7, h: 1.8, speed: 3.6, health: 46, hostile: true, dmg: 14, kb: 0.6,
    sunproof: true, fireproof: true, noEgg: true, glow: '210,60,255', reach: 0.6,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 4, range: 24 },
  // ---- AI ----
  ai: 'melee',
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.worldshade, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/husk/idle', 3), vol: 0.8, pitch: [0.55, 0.65], cat: 'volCreatures', synth: 'moan' },
    hurt: { files: n_('mob/husk/hurt', 2), vol: 0.9, pitch: [0.55, 0.65], cat: 'volCreatures', synth: 'hit' },
    death: { files: n_('mob/husk/death', 2), vol: 0.9, pitch: [0.55, 0.65], cat: 'volCreatures', synth: 'death' },
    step: { files: n_('mob/husk/step', 5), vol: 0.15, pitch: [0.55, 0.65], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (drops nothing)
});

// ---- VISUALS (drawing and effects) ----
// her minions: shadows of the people of the worlds she ended
const SHADE_PAL16 = { hair: '#1a0a20', hairHi: '#2a1030', skin: '#24102c', skinShade: '#180a1e', mouth: '#ff3a5a', eyeWhite: '#ff5af0', eye: '#ffffff', shirt: '#2a1030', shirtHi: '#3a1840', shirtShade: '#1a0820', belt: '#8a1ab0', buckle: '#d24aff', pants: '#1a0a20', pantsShade: '#12061a', boots: '#0a040e', bootsHi: '#2a1030' };
MOB_DRAW.worldshade = (g, m) => {
  const w = m.w * TILE, h = m.h * TILE, t = Game.time, moving = Math.abs(m.vx) > 0.1, sw = moving ? Math.sin(m.legPhase) * 0.55 : 0;
  g.save(); g.globalAlpha *= 0.88 + 0.1 * Math.sin(t * 7 + m.id); g.translate(-w / 2, -h);
  drawPlayerSprite(g, w, h, { pal: SHADE_PAL16, legSwing: sw, armAngle: m.attackAnim > 0.05 ? -2 * m.attackAnim : -1.3 + Math.sin(t * 4 + m.id) * 0.1, backArmAngle: -1.2, breath: 0 });
  g.restore();
};
