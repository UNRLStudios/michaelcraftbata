'use strict';
// =============================================================================
// FROST WRAITH   (type 'frostwraith')
//   Floats at a distance in the Frostlands and shoots fans of ice (they chill you).
// =============================================================================
defineMob('frostwraith', {
  // ---- STATS ----
  stats: {
    name: 'Frost Wraith', w: 0.85, h: 1.5, speed: 2.6, health: 18, hostile: true, dmg: 3, kb: 1.0, flying: true,
    sunproof: true, biome: 'frost', loot: [[FROST_CRYSTAL, 1, 2, 0.4], [MANA_POTION, 1, 1, 0.1]],
    eye: [1, 0.22, '190,250,255'],
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'fly', range: 20 },
  // ---- AI ----
  ai: 'hover',
  hooks: {
    hoverRange: 6,
    hoverCooldown: () => 2.4 + Math.random(),
    hoverShoot(m, p, a, mcx, mcy) {
      for (const da of [0, -0.22, 0.22]) spawnBolt12({ x: mcx, y: mcy, vx: Math.cos(a + da) * 9, vy: Math.sin(a + da) * 9, kind: 'ice', dmg: 2, r: 0.28, life: 2.4, trail: true, fx: (pp) => addFx12(pp, 'slow', 4) });
      sfx('frostwraith.say', { x: mcx, y: mcy, pitch: 1.3 });
    },
  },   // (how it tunes its behaviour: see Mobs/_behaviors.js)
  // ---- VISUALS ----
  // (drawn by MOB_DRAW.frostwraith, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/vex/idle', 4), vol: 0.8, pitch: [0.6, 0.8], cat: 'volCreatures' },
    hurt: { files: n_('mob/vex/hurt', 2), vol: 0.9, pitch: [0.7, 0.9], cat: 'volCreatures' },
    death: { files: n_('mob/vex/death', 2), vol: 0.9, pitch: [0.7, 0.9], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  // (its loot table is in its stats)
});

// ---- VISUALS (drawing and effects) ----
const WRAITH_P = { c: '#cfeefa', C: '#9fd2ea', d: '#5a8cb0', k: '#0e1a28', E: '#c8faff', i: '#e8fcff', I: '#7fdcf8' };
const WRAITH_G = {
  hood: ['...cccc..', '..cCCCCc.', '.cCCCCCCc', 'cCCkkkkkC', 'cCkEkkEkC', 'cCkkkkkkC', 'cCCkkkkCC', '.cCCCCCc.'],
  arm: ['cC', 'Cc', 'cC', 'CC', 'cCc', 'kkk', '.k.'],
  shard: ['.i.', 'iIi', 'iIi', 'IiI', '.I.'],
};
MOB_DRAW.frostwraith = (g, m, u, eyes) => {
  const p = n => mp14('wraith', n, WRAITH_G[n], WRAITH_P, { flat: 'Ek', ol: '#1a3048' });
  const t = Game.time + m.id, bob = (Math.sin(t * 2) * 1.5), cast = m.castT > 0, lean = Math.max(-0.3, Math.min(0.3, (m.vx || 0) * 0.08));
  rig14(g, u, 48, 56, 24, 26, b => {
    b.translate(0, bob);
    DK14 = 0.7; drawP14(b, p('arm'), -3, -5, 1, 0, 1, cast ? -1.2 : 0.4 + Math.sin(t * 2) * 0.2); DK14 = 0;
    cloak14(b, -6, 4, 7, 17, t, { m: '#a8d8ee', d: '#6e9fc2', l: '#d8f4ff', ol: '#1a3048' }, -lean);
    drawP14(b, p('hood'), 1, -6, 4, 7, 1);
    const aF = cast ? -1.9 : 0.2 + Math.sin(t * 2 + 1) * 0.2;
    drawP14(b, p('arm'), 3, -4, 1, 0, 1, aF);
    if (cast) { b.save(); b.translate(3, -4); b.rotate(aF); drawP14(b, p('shard'), 0, 9, 1, 2, 1, Math.sin(t * 20) * 0.2); b.restore(); }
  }, { soft: true });
  if (m.dying == null) eyes14(eyes, 1.5, -9.5 + bob, u, '190,250,255', 1);
};
