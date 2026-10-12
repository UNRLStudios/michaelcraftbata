'use strict';
// =============================================================================
// AFTER EVERY MOB FILE HAS LOADED: things that need the whole list of mobs.
// =============================================================================
// ---- code elsewhere in the game that changes a mob (a wrapper on a boss's death, its loot...) ----
for (const fn of AFTER_MOBS) fn();
AFTER_MOBS.length = 0;

// ---- SPAWN EGGS (Creative only): one per mob, in the order the mob files load ----
{
  let n = 0;
  for (const k of Object.keys(MOB_TYPES)) {
    const d = MOB_TYPES[k];
    if (!d || typeof d !== 'object' || !d.name || d.npc || d.boss || d.segOf || d.noEgg || d.health == null || d.w == null) continue;
    const id = EGG_BASE15 + n++;
    EGG_OF15[k] = id; EGG_MOB15[id] = k;
    defItem(id, d.name + ' Spawn Egg', { kind: 'material', egg: k, stack: 64 });
    ITEM_HINTS[id] = 'Creative only. Right-click to spawn a ' + d.name;
  }
}
