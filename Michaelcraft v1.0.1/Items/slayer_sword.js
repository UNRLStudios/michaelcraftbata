'use strict';
// =============================================================================
// THE SLAYER OF WORLDS (the sword the Slayer drops) - 1.0.1 r30
//   * A real texture now, animated (8 frames): the red core pulses from the hilt to the tip, light runs round
//     the guard ring, and sparks of void drift off the blade.
//   * Stronger than Hellfire (its stats are in index.html, next to defWeapon(SLAYER_SWORD ...)):
//     36 damage every 0.21 s, crescents hit harder and pierce more, the third cut throws FIVE.
//   * WORLD REND: the first cut after a dash throws a giant crescent that goes through everything.
// =============================================================================
const SLS22 = { rendWindow: 1.4 };

// ---- TEXTURE ----
const SLS_ART22 = 'Textures/items/slayer/slayer_sword';
BIG_ITEM_TEXTURES[SLAYER_SWORD] = [SLS_ART22 + '.png', 128];
{
  let frames = null;
  const cis = computeIconStyle;
  computeIconStyle = function (id) {
    if (id === SLAYER_SWORD) return `background-image:url("${texUrl(SLS_ART22 + '_anim.png')}");background-size:800% 100%;background-position:0% 0;animation:prism22 0.9s steps(8, jump-none) infinite;image-rendering:auto;`;
    return cis(id);
  };
  iconStyleCache.clear();
  const img = new Image(), sheet = SLS_ART22 + '_anim.png';
  img.onload = () => { const out = []; for (let k = 0; k < 8; k++) { const c = mkCanvas(128); c.height = 128; const g = c.getContext('2d'); g.drawImage(img, k * 128, 0, 128, 128, 0, 0, 128, 128); out.push(c); } frames = out; };
  img.src = (window.TEXTURE_BUNDLE && window.TEXTURE_BUNDLE[sheet]) || sheet;
  setInterval(() => { if (frames) itemIcon[SLAYER_SWORD] = frames[Math.floor(performance.now() / 112) % 8]; }, 40);
}

// ---- held in your hand: a little bigger than before ----
{
  const dh = drawHeldWeapon;
  drawHeldWeapon = function (g, u, item, icon, o) {
    if (item !== SLAYER_SWORD) return dh(g, u, item, icon, o);
    g.rotate(1.95 + (o.heldSpin || 0));
    const sz = 38 * u, p = Game.player, rend = p && p.slsRend > 0;
    g.filter = `drop-shadow(0 0 ${Math.max(1, u * (rend ? 4 : 2)).toFixed(1)}px rgba(${rend ? '255,80,140' : '210,74,255'},0.95))`;
    g.drawImage(icon, 0, 0, icon.width, icon.height, -sz * 0.18, -sz * 0.82, sz, sz);
    g.filter = 'none';
  };
}

// ---- WORLD REND: dash, then cut ----
{
  const kd = katanaDash;
  katanaDash = function (p, slot, W) {
    const before = p.kDash;
    kd(p, slot, W);
    if (W && W.slayer && p.kDash && p.kDash !== before) p.slsRend = SLS22.rendWindow;
  };
  const ks = katanaSwing;
  katanaSwing = function (p, slot, W, target) {
    ks(p, slot, W, target);
    if (!W || !W.slayer || !(p.slsRend > 0)) return;
    p.slsRend = 0;
    const c = playerCenter(p), a = Math.abs(p.lookX) > 0.2 || Math.abs(p.lookY) > 0.2 ? Math.atan2(p.lookY, p.lookX) : (p.facing > 0 ? 0 : Math.PI);
    fireWorldCrescent16(p, slot, W, c, a, false, true);
    sfx('spell.void', { pitch: 0.7, vol: 0.9 }); sfx('spell.boom', { pitch: 1.3, vol: 0.5 }); screenShake(0.3);
    if (typeof ring17 === 'function') ring17(c.x, c.y, 3, 0.3, '255,90,160', 0.5);
  };
  B12.updaters.push(function slsTick22(dt, p) { if (p.slsRend > 0) p.slsRend = Math.max(0, p.slsRend - dt); });
}

// ---- tooltip ----
{
  const wt = weaponTooltip;
  weaponTooltip = function (stack, W) {
    const base = wt(stack, W);
    if (!W || !W.slayer) return base;
    return base + '<div class="tt-blue" style="color:#e070ff">Every cut: a crescent of void (the third: five)</div>'
      + '<div class="tt-blue" style="color:#ff6aa0">Right-click: dash any direction (dive into the ground: shockwave)</div>'
      + '<div class="tt-blue" style="color:#ff6aa0">First cut after a dash: WORLD REND, a giant crescent through everything</div>';
  };
}
