'use strict';
// =============================================================================
// MOB KIT - how every creature in MichaelCraft is put together.
//
// Each mob (and each boss) lives in its own file in Mobs/ and registers itself
// with defineMob(type, spec). A file reads top to bottom as:
//
//   STATS        health, damage, speed, size, knockback, what it is (hostile, flying...)
//   PATHFINDING  how it finds its way to you (see Mobs/_pathfinding.js)
//   AI           what it does each frame
//   VISUALS      how it's drawn, its particles and effects (VFX)
//   SOUNDS       what it sounds like (SFX)
//   LOOT         what it drops
//
// The spec:
//   stats        -> MOB_TYPES[type]: name, w, h, speed, health, dmg, kb, reach, hostile, flying ...
//   path         -> how it navigates: { mode: 'walk' | 'climb' | 'fly' | 'none', jump, drop, range }
//   brain        -> its AI, a function (mob, dt, target, dx, dist, isNight) run every frame
//                   (or `ai: 'name'` for one of the shared MOB_AI12 behaviours in Mobs/_behaviors.js)
//   update       -> full control every frame, before anything else runs (NPCs, the firefly, the larva)
//   tactic       -> for plain walkers: what it does once it's chasing you (returns its wanted speed)
//   draw         -> MOB_DRAW[type] (g, mob, u, eyes)
//   sprite       -> { w, h, frames } a sprite strip in Textures/entities/mobs12/<type>.png (drawn for you)
//   deathColors  -> the colours of the puff when it dies
//   soundPrefix  -> the name its sounds go under (default: the type)
//   sounds       -> { say, hurt, death, step, ... } (a key with a dot in it is used as it is)
//   loot         -> a table [[item, min, max, chance], ...] or a function (mob, mx, my)
//   onDeath      -> runs as it dies (MOB_DEATH12)
//   boss         -> BOSSES[type] (name, music, arena, rewards); bossAI -> BOSS_AI[stats.custom]
// =============================================================================
const MOBS = {};          // type -> its spec, as its file gave it
const MOB_FILES = [];     // load order (spawn eggs are made in this order: keep it!)
function defineMob(type, spec) {
  if (MOBS[type]) console.warn('defineMob: ' + type + ' defined twice');
  MOBS[type] = spec; MOB_FILES.push(type);
  const st = Object.assign({}, spec.stats);
  for (const k of ['path', 'brain', 'update', 'tactic', 'deathColors', 'soundPrefix', 'spriteFrame']) if (spec[k] !== undefined) st[k] = spec[k];
  if (spec.ai) st.ai = spec.ai;
  if (typeof spec.loot === 'function') st.lootFn = spec.loot; else if (spec.loot) st.loot = spec.loot;
  if (spec.hooks) Object.assign(st, spec.hooks);
  MOB_TYPES[type] = st;
  if (spec.sprite) {
    const S = spec.sprite, img = new Image(); img.src = 'Textures/entities/mobs12/' + type + '.png';
    MOBSPR12[type] = Object.assign({ img, w: S.w, h: S.h, frames: S.frames }, S.fit != null ? { fit: S.fit } : null, S.cx != null ? { cx: S.cx } : null);
    if (!spec.draw) MOB_DRAW[type] = mkDraw12(type);
  }
  if (spec.draw) MOB_DRAW[type] = spec.draw;
  if (spec.sounds) {
    const pre = spec.soundPrefix || type;
    for (const k in spec.sounds) SOUNDS[k.includes('.') ? k : pre + '.' + k] = spec.sounds[k];
  }
  if (spec.onDeath) MOB_DEATH12[type] = spec.onDeath;
  if (spec.boss) BOSSES[type] = spec.boss;
  if (spec.bossAI) BOSS_AI[st.custom] = spec.bossAI;
  return st;
}
// a copy of another mob's sounds under a new name (the Worldshade borrows the Husk's voice)
function borrowSounds(from, to, change) {
  for (const k of Object.keys(SOUNDS)) if (k.startsWith(from + '.')) SOUNDS[to + '.' + k.slice(from.length + 1)] = Object.assign({}, SOUNDS[k], change);
}
// Terraria sound files: terraria_('roar', 3) -> terraria/roar_0, _1, _2
const terraria_ = (name, k) => Array.from({ length: k }, (_, i) => 'terraria/' + name + '_' + i);
