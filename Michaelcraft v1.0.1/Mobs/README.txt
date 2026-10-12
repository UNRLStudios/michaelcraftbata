MichaelCraft - the Mobs folder
==============================

Every creature in the game has its own file here. index.html loads them all
(the <script src="Mobs/..."> tags at the very bottom of index.html), in this order:

  _mobkit.js        defineMob(): how a mob file registers itself
  _pathfinding.js   A* pathfinding: how mobs find their way to you (and /mobpaths)
  _behaviors.js     brains several mobs share (walkers, farm animals, pets, swoopers,
                    and the melee / hover / slammer fighters)
  Animals/ Monsters/ NPCs/ Bosses/   one file per mob
  _finish.js        runs last: spawn eggs, and anything that waits for every mob

WHAT'S IN A MOB'S FILE (top to bottom)
  STATS        name, size (w, h), speed, health, damage (dmg), knockback (kb),
               reach, and what it is (hostile, flying, fireproof, nocturnal...)
  PATHFINDING  path: { mode: 'walk' | 'climb' | 'fly' | 'none', jump, drop, range }
  AI           its brain: what it does every frame (and any hooks that tune a
               shared brain: e.g. what an Ice Husk's bite does)
  VISUALS      how it's drawn, its death colours, its particles and effects
  SOUNDS       say / hurt / death / step and its own special sounds
  LOOT         what it drops (a table [[item, min, max, chance]] or a function)
  BOSS         (bosses) name, music, arena, rewards, how it dies or leaves
  Below the defineMob(...) block is its own code: AI, then VISUALS, then the rest.

CHANGING A MOB
  Open its file and change it: e.g. Monsters/husk.js -> stats: { health: 16, dmg: 3 }.
  Save, reload the game. (Things that are the same for every mob, like falling,
  swimming, taking damage and the boss health bar, are in index.html.)

ADDING A MOB
  1. Copy the file of a mob that's like it and rename it.
  2. Change the type in defineMob('...'), and its stats, look and sounds.
  3. Add <script src="Mobs/Monsters/yourmob.js"></script> to the bottom of index.html,
     BEFORE Mobs/_finish.js. (Add new mobs at the end of the list, so the spawn eggs
     of the mobs already there keep their numbers.)
  4. For it to spawn on its own, add it to pickHostileType() / SPAWN12 in index.html.

The game also works offline (sw.js keeps a copy of every file in this folder).
