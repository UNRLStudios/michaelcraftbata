'use strict';
// =============================================================================
// MOB PATHFINDING (A*)
//
// Monsters used to walk straight at you and hop one block: a wall, a pit or a
// ledge stopped them cold. Now a chasing mob plans a route over the blocks:
//
//   walk   along the ground, step or jump up ledges (as high as it can jump),
//          drop down (as far as its file allows), never into lava
//   climb  like walk, and it can go straight up and down walls (crawlers)
//   fly    any of 8 directions through open air, around walls and through gaps
//          (used when a wall is between it and where it wants to be)
//   none   no route planning (bosses fly their own arenas, NPCs keep to home)
//
// Each mob's file sets its own:  path: { mode: 'walk', jump: 1, drop: 4, range: 24 }
//   jump   how many blocks up it will plan to jump (more on the Moon: it reads gravity)
//   drop   how far down it will plan to drop
//   range  how far (in blocks) the plan may wander from it
//
// The plan is made from the mob's real size against the real collision (doors
// closed to mobs count as walls), kept for a moment and remade when you move,
// when it gets knocked off course, or when the land changes under it. At most a
// few plans are made each frame, so a horde can't slow the game down.
// Turn on /mobpaths to see the routes.
// =============================================================================
const MobPath = {
  PER_FRAME: 5,        // plans made per frame at most
  MAX_NODES: 1600,     // how hard one plan may look
  REPLAN: 0.6,         // seconds a plan is kept
  debug: false,
  made: 0, frameT: -1,
  heap: { k: [], v: [] },
};
// --- the grid -----------------------------------------------------------------
// A walker's node (x, y) is "standing with its feet in tile row y, centred on column x".
function pathBoxFree(m, x, y) {
  const w = Game.world, bx = x + 0.5 - m.w / 2, by = y + 1 - m.h;
  if (boxHitsSolid(w, bx, by, m.w, m.h)) return false;
  for (let ty = Math.floor(by + COLL_EPS); ty <= y + 1; ty++) {
    const t = w.getTile(x, ty);
    if (ty > y) { if (!m.def.fireproof && isLavaId(t)) return false; continue; }   // (and never stand on lava)
    if (DOOR_INFO[t] && (DOOR_INFO[t].locked || !doorOpenAt(x, DOOR_INFO[t].top ? ty + 1 : ty))) return false;
    if (!m.def.fireproof && isLavaId(t)) return false;
  }
  return true;
}
function pathOnGround(m, x, y) {
  const w = Game.world;
  if (boxHitsSolid(w, x + 0.5 - m.w / 2, y + 1, m.w, 0.12)) return true;
  return isWaterTile(w, x + 0.5, y + 0.5);   // swimming counts as standing
}
function pathWallBeside(x, y) { const w = Game.world; return isSolidTile(w, x - 1, y) || isSolidTile(w, x + 1, y); }
function pathFlyFree(m, x, y) { return !boxHitsSolid(Game.world, x + 0.5 - m.w / 2, y + 0.5 - m.h / 2, m.w, m.h); }
// how many blocks up a mob's jump really reaches here (the Moon's low gravity lets it plan higher)
function pathJumpReach(cfg) { return Math.max(1, Math.floor((cfg.jump ?? 1) * 34 / GRAVITY + 0.01)); }

// --- A* ---------------------------------------------------------------------------
function heapPush(H, key, val) {
  const K = H.k, V = H.v; let i = K.length; K.push(key); V.push(val);
  while (i > 0) { const p = (i - 1) >> 1; if (K[p] <= key) break; K[i] = K[p]; V[i] = V[p]; i = p; }
  K[i] = key; V[i] = val;
}
function heapPop(H) {
  const K = H.k, V = H.v, top = V[0], lk = K.pop(), lv = V.pop(), n = K.length;
  if (n) {
    let i = 0;
    for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && K[c + 1] < K[c]) c++; if (K[c] >= lk) break; K[i] = K[c]; V[i] = V[c]; i = c; }
    K[i] = lk; V[i] = lv;
  }
  return top;
}
// Plan a route for mob m from tile (sx, sy) to (gx, gy). Returns [{x, y, j}] (j = jump up to it) or null.
function findMobPath(m, sx, sy, gx, gy, cfg, fly) {
  const R = cfg.range || 24, W = 2 * R + 1, H = 2 * R + 1, ox = sx - R, oy = sy - R;
  const N = W * H, g = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), flags = new Uint8Array(N);
  const climber = cfg.mode === 'climb', jump = fly ? 0 : pathJumpReach(cfg), drop = cfg.drop ?? 4;
  const idx = (x, y) => (x - ox) + (y - oy) * W, inside = (x, y) => x >= ox && x < ox + W && y >= oy && y < oy + H;
  const hfn = (x, y) => fly ? Math.max(Math.abs(x - gx), Math.abs(y - gy)) + 0.4 * Math.min(Math.abs(x - gx), Math.abs(y - gy)) : Math.abs(x - gx) + Math.abs(y - gy) * 0.8;
  const HP = MobPath.heap; HP.k.length = 0; HP.v.length = 0;
  const s = idx(sx, sy); g[s] = 0; heapPush(HP, hfn(sx, sy), s);
  let best = s, bestH = hfn(sx, sy), found = -1, n = 0;
  const visit = (cur, x, y, cost, jumpUp) => {
    if (!inside(x, y)) return;
    const i = idx(x, y), ng = g[cur] + cost;
    if (ng >= g[i]) return;
    g[i] = ng; from[i] = cur; flags[i] = jumpUp === 2 ? 4 : jumpUp ? 1 : 0;
    heapPush(HP, ng + hfn(x, y), i);
  };
  while (HP.k.length && n++ < MobPath.MAX_NODES) {
    const cur = heapPop(HP), x = ox + cur % W, y = oy + ((cur / W) | 0);
    if (flags[cur] & 2) continue; flags[cur] |= 2;
    const h = hfn(x, y);
    if (h < bestH) { bestH = h; best = cur; }
    if (Math.abs(x - gx) <= 1 && Math.abs(y - gy) <= (fly ? 1 : 1.5)) { found = cur; break; }
    if (fly) {
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (!pathFlyFree(m, nx, ny)) continue;
        if (dx && dy && (!pathFlyFree(m, x + dx, y) || !pathFlyFree(m, x, y + dy))) continue;   // no cutting corners
        visit(cur, nx, ny, dx && dy ? 1.42 : 1, false);
      }
      continue;
    }
    const canStand = (xx, yy) => pathOnGround(m, xx, yy) || (climber && pathWallBeside(xx, yy));
    for (const dir of [-1, 1]) {
      const nx = x + dir;
      // walk across, or step off and drop to the ground below
      if (pathBoxFree(m, nx, y)) {
        let ly = y;
        while (!canStand(nx, ly) && ly - y < drop && pathBoxFree(m, nx, ly + 1)) ly++;
        if (canStand(nx, ly)) visit(cur, nx, ly, 1 + (ly - y) * 0.35, false);
      }
      // leap a one-block gap (a hole, a trench of lava) to the ground on the far side
      if (!fly && pathBoxFree(m, nx, y) && !canStand(nx, y) && pathBoxFree(m, x, y - 1) && pathBoxFree(m, nx, y - 1)) {
        const fx = x + 2 * dir;
        if (pathBoxFree(m, fx, y) && canStand(fx, y)) visit(cur, fx, y, 2.6, 2);
      }
      // jump up onto a ledge (needs headroom over its own head first)
      for (let k = 1; k <= jump; k++) {
        if (!pathBoxFree(m, x, y - k)) break;
        if (pathBoxFree(m, nx, y - k) && canStand(nx, y - k)) { visit(cur, nx, y - k, 1.3 + k * 0.5, true); break; }
      }
    }
    // climbers go straight up and down walls; anyone can sink or swim up in water
    if (climber && pathWallBeside(x, y)) {
      if (pathBoxFree(m, x, y - 1)) visit(cur, x, y - 1, 1.2, false);
      if (pathBoxFree(m, x, y + 1)) visit(cur, x, y + 1, 1, false);
    } else if (isWaterTile(Game.world, x + 0.5, y + 0.5)) {
      if (pathBoxFree(m, x, y - 1)) visit(cur, x, y - 1, 1.4, false);
      if (pathBoxFree(m, x, y + 1)) visit(cur, x, y + 1, 1, false);
    }
  }
  let end = found;
  if (end < 0) { if (best === s || bestH > hfn(sx, sy) - 1) return null; end = best; }   // can't get there: get as close as it can
  const out = [];
  for (let i = end; i >= 0; i = from[i]) out.push({ x: ox + i % W, y: oy + ((i / W) | 0), j: flags[i] & 1, leap: (flags[i] & 4) ? 1 : 0 });
  out.reverse();
  out.reached = found >= 0;
  return out;
}
function pathBudget() {
  if (MobPath.frameT !== Game.time) { MobPath.frameT = Game.time; MobPath.made = 0; }
  return MobPath.made < MobPath.PER_FRAME;
}
function mobFeetTile(e) { return { x: Math.floor(e.x + e.w / 2), y: Math.floor(e.y + e.h - 0.02) }; }

// --- walkers --------------------------------------------------------------------
// Which way should a walking mob go to reach `goal` (a player or a mob)? -> { dir, jump } or null (go straight).
function mobPathSteer(m, goal) {
  const cfg = m.def.path;
  if (!cfg || cfg.mode === 'none' || cfg.mode === 'fly' || !goal) return null;
  const st = mobFeetTile(m), gt = mobFeetTile(goal);
  if (Math.abs(gt.x - st.x) > (cfg.range || 24) || Math.abs(gt.y - st.y) > (cfg.range || 24)) return null;
  let P = m.pathPlan;
  const stale = !P || Game.time - P.t > (cfg.every || MobPath.REPLAN) || Math.abs(P.gx - gt.x) > 1 || Math.abs(P.gy - gt.y) > 1 || P.world !== Game.world;
  let at = P && !stale ? P.nodes.findIndex((n, i) => i < 8 && n.x === st.x && Math.abs(n.y - st.y) <= 1) : -1;
  if ((stale || at < 0) && pathBudget()) {
    MobPath.made++;
    const nodes = findMobPath(m, st.x, st.y, gt.x, gt.y, cfg, false);
    P = m.pathPlan = { t: Game.time, gx: gt.x, gy: gt.y, world: Game.world, nodes: nodes || [] };
    at = 0;
  }
  if (!P || !P.nodes.length || at < 0) return null;
  if (at > 0) P.nodes.splice(0, at);   // (what's behind it is done)
  // the next node in another column, and whether it has to jump up to it
  for (let i = 1; i < Math.min(P.nodes.length, 4); i++) {
    const n = P.nodes[i];
    if (n.x !== st.x) {
      const dir = Math.sign(n.x - st.x);
      // a leap: jump once it's out near the edge of the take-off block
      if (n.leap && i === 1) return { dir, jump: false, leap: dir > 0 ? m.x + m.w / 2 > st.x + 0.55 : m.x + m.w / 2 < st.x + 0.45 };
      return { dir, jump: n.y < st.y, up: n.y < st.y ? st.y - n.y : 0 };
    }
    if (n.y < st.y && m.def.path.mode === 'climb') return { dir: m.facingDir || 1, jump: false, climb: true };
  }
  return P.nodes.reached === false && P.nodes.length < 2 ? { dir: 0, jump: false } : null;
}
// --- flyers ---------------------------------------------------------------------
// A flyer wants to be at (tx, ty). If a wall is in the way, where should it head first? -> {x, y} or null.
function mobFlyWaypoint(m, tx, ty) {
  const cfg = m.def.path;
  if (!cfg || cfg.mode !== 'fly') return null;
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  let gx = Math.floor(tx), gy = Math.floor(ty);
  const sx = Math.floor(cx), sy = Math.floor(cy);
  if (!pathFlyFree(m, gx, gy)) {   // where it wants to hover is inside a wall (a roof over you): the nearest open spot
    let best = null, bd = 1e9;
    for (let dy = -4; dy <= 6; dy++) for (let dx = -4; dx <= 4; dx++) if (pathFlyFree(m, gx + dx, gy + dy)) { const d = dx * dx + dy * dy * (dy < 0 ? 1.5 : 1); if (d < bd) { bd = d; best = [gx + dx, gy + dy]; } }
    if (best) [gx, gy] = best;
  }
  if (!firstBlockOnRay(cx, cy, gx + 0.5, gy + 0.5) && pathFlyFree(m, gx, gy)) { m.pathPlan = null; return gx === Math.floor(tx) && gy === Math.floor(ty) ? null : { x: gx + 0.5, y: gy + 0.5 }; }   // a clear line: just go
  let P = m.pathPlan;
  const stale = !P || !P.fly || Game.time - P.t > (cfg.every || MobPath.REPLAN) || Math.abs(P.gx - gx) > 2 || Math.abs(P.gy - gy) > 2 || P.world !== Game.world;
  if (stale && pathBudget()) {
    MobPath.made++;
    if (Math.abs(gx - sx) > (cfg.range || 24) || Math.abs(gy - sy) > (cfg.range || 24)) return null;
    P = m.pathPlan = { t: Game.time, gx, gy, fly: true, world: Game.world, nodes: findMobPath(m, sx, sy, gx, gy, cfg, true) || [] };
  }
  if (!P || !P.nodes || !P.nodes.length) return null;
  // the furthest of the next few nodes it can see straight to
  let pick = null;
  for (let i = 1; i < Math.min(P.nodes.length, 6); i++) { const n = P.nodes[i]; if (firstBlockOnRay(cx, cy, n.x + 0.5, n.y + 0.5)) break; pick = n; }
  const k = P.nodes.findIndex(n => n.x === sx && n.y === sy); if (k > 0) P.nodes.splice(0, k);
  return pick ? { x: pick.x + 0.5, y: pick.y + 0.5 } : { x: P.nodes[Math.min(1, P.nodes.length - 1)].x + 0.5, y: P.nodes[Math.min(1, P.nodes.length - 1)].y + 0.5 };
}
// --- /mobpaths: draw every plan ----------------------------------------------------
B12.post.push(function drawMobPaths(ox, oy) {
  if (!MobPath.debug) return;
  ctx.save(); ctx.lineWidth = 2;
  for (const m of Game.mobs) {
    const P = m.pathPlan; if (!P || !P.nodes || P.nodes.length < 2) continue;
    ctx.strokeStyle = P.fly ? 'rgba(120,200,255,0.8)' : P.nodes.reached === false ? 'rgba(255,170,60,0.8)' : 'rgba(120,255,140,0.8)';
    ctx.beginPath();
    P.nodes.forEach((n, i) => { const x = ox + (n.x + 0.5) * TILE, y = oy + (n.y + (P.fly ? 0.5 : 0.9)) * TILE; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.stroke();
    for (const n of P.nodes) if (n.j) { ctx.fillStyle = '#ffe066'; ctx.fillRect(ox + (n.x + 0.5) * TILE - 3, oy + (n.y + 0.9) * TILE - 3, 6, 6); }
  }
  ctx.restore();
});
COMMANDS.mobpaths = { usage: '/mobpaths', desc: 'Show the routes monsters are planning', run: () => { MobPath.debug = !MobPath.debug; chatLine('Mob paths ' + (MobPath.debug ? 'shown' : 'hidden') + '.'); } };
