'use strict';
// =============================================================================
// BRUTE   (type 'brute')
//   Winds up an overhead slam (watch for raised arms!), hits hard in an area, barely flinches when struck.
// =============================================================================
defineMob('brute', {
  // ---- STATS ----
  stats: {
    name: 'Brute', stepEvery: 0.55, deathShake: 0.5, w: 1.0, h: 2.2, speed: 1.35, health: 36, hostile: true, dmg: 6, kb: 0.25, reach: 1.1,
  },
  // ---- PATHFINDING (Mobs/_pathfinding.js) ----
  path: { mode: 'walk', jump: 1, drop: 3, range: 24 },
  // ---- AI ----
  brain: walkerBrain,
  tactic: bruteTactic,
  // ---- VISUALS ----
  deathColors: ['#8c3a2b', '#5c5f66'],
  // (drawn by MOB_DRAW.brute, below)
  // ---- SOUNDS ----
  sounds: {
    say: { files: n_('mob/ravager/idle', 4), vol: 0.9, pitch: [0.8, 1], cat: 'volCreatures', synth: 'growl' },
    hurt: { files: n_('mob/ravager/hurt', 4), vol: 0.9, pitch: [0.9, 1.1], cat: 'volCreatures', synth: 'hit' },
    death: { files: n_('mob/ravager/death', 3), vol: 1, pitch: [0.9, 1], cat: 'volCreatures', synth: 'death' },
    roar: { files: n_('mob/ravager/roar', 4), vol: 1, pitch: [0.9, 1.1], cat: 'volCreatures', synth: 'growl' },
    slam: { files: n_('mob/ravager/bite', 3), vol: 1, pitch: [0.7, 0.8], cat: 'volCreatures', synth: 'slam' },
    step: { files: n_('mob/ravager/step', 4), vol: 0.35, pitch: [0.8, 0.9], cat: 'volCreatures' },
  },
  // ---- LOOT ----
  loot(mob, mx, my) {
    const r = Math.random;
    spawnDrop(122, 2 + Math.floor(r() * 2), mx, my);
    spawnDrop(124, 2, mx, my);
    spawnDrop(133, 1 + Math.floor(r() * 3), mx, my);
    if (r() < 0.6) spawnDrop(119, 1 + Math.floor(r() * 2), mx, my);
  },
});

// ---- AI ----
// once it's after you: wind up (arms raised), SLAM (cracks the ground, hits everything close in front), recover
function bruteTactic(mob, dt, p, dx, dir, targetVx) {
  const def = mob.def, gap = boxGap(mob, p);
  if (mob.slam === 'windup') {
    targetVx = 0; mob.slamT -= dt;
    if (mob.slamT <= 0) {
      mob.slam = 'recover'; mob.slamT = 0.7;
      sfx('brute.slam', { x: mob.x + mob.w / 2, y: mob.y + mob.h }); sfx('fall.big', { x: mob.x + mob.w / 2, y: mob.y + mob.h, pitch: 0.6 }); screenShake(0.7);
      for (let i = 0; i < 10; i++) spawnFootDust(mob.x + mob.w / 2 + mob.facingDir * (0.5 + i * 0.12), mob.y + mob.h, mob.facingDir);
      if (boxGap(mob, p) < def.reach + 0.5) hitPlayer(mob, def.dmg, 11, 6);
    }
  } else if (mob.slam === 'recover') {
    targetVx = 0; mob.slamT -= dt;
    if (mob.slamT <= 0) mob.slam = null;
  } else if (gap < def.reach && mob.attackCooldown <= 0 && mob.onGround) {
    mob.slam = 'windup'; mob.slamT = 0.65; mob.attackCooldown = 2.2; mob.facingDir = dir;
    sfx('brute.roar', { x: mob.x + mob.w / 2, y: mob.y + mob.h / 2 });
  }
  return targetVx;
}

// ---- VISUALS (drawing and effects) ----
const BRUTE_P = { s: '#9a3b2c', S: '#7a2b20', l: '#b8584a', h: '#ece0c4', H: '#bba98a', p: '#5c5f66', P: '#8a8e96', E: '#ffb13a', k: '#1e0906', L: '#3d2b1f', c: '#5a402c', K: '#c9a94f', f: '#5a2219' };
const BRUTE_G = {
  head: ['..h....h...', '.hH...hH...', '.H.sSSSSs..', '..sSSSSSSs.', '.sSSSSSkEs.', '.sSSSSSSSSs', '.sSSSSkkkkk', '..sPpPpPpPs', '..pPPPPPPP.', '...pPpPpp..'],
  body: ['....ssss..', '..sSSSSSs.', '.sSlSSSSSs', 'hSSSlSSSSs', '.sSSSlSSSS', 'hsSSSSSlSs', '.sSSSSSSlS', 'hsSSSSSSSs', '.LLLLKLLLL', '.LcLLLLcLL', '.LLLLLLLL.'],
  arm: ['.sSSs', 'sSSSS', 'sSlSS', 'sSSSS', 'sSSlS', 'sSSSS', 'pPPPp', 'sSSSS', 'sSSlS', 'sSSSS', 'fffff', 'fSfSf', 'fffff', '.f.f.'],
  leg: ['sSSSs', 'sSSSS', 'sSlSS', 'sSSSS', 'LLLLL', 'sSSSS', 'sSSSS', 'fffff', 'ffffff'],
};
let BRUTE_R;
MOB_DRAW.brute = (g, m, u, eyes) => {
  if (!BRUTE_R) {
    const p = n => mp14('brute', n, BRUTE_G[n], BRUTE_P, { flat: 'E' });
    BRUTE_R = {
      leg: p('leg'), legX: [-2, 1.5], hipY: -9, legA: [2, 0], body: [p('body'), 5, 10], head: [p('head'), 3, 8, 3, -19], arm: p('arm'), armA: [2, 1], shX: [-3, 3], shY: -19,
      stride: 0.4, armSwing: 0.45, lean: 0.12, walkMul: 0.8, bob: 1,
      pose: (m) => slamPose14(m) || chopPose14(m, 0.2),
    };
  }
  rig14(g, u, 52, 50, 24, 46, b => biped14(b, m, 1, BRUTE_R));
  if (m.dying == null) eyes14(eyes, 8.5, -24.5, u, '255,177,58', 1.2);
};
