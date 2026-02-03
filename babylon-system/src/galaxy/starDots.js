// src/galaxy/starDots.js

function _makeRadialDotDataURL(size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0.00, "rgba(255,255,255,0.95)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(0.55, "rgba(255,255,255,0.18)");
  g.addColorStop(1.00, "rgba(0,0,0,0.00)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c.toDataURL("image/png");
}

export function createStarDotManager(scene, capacity = 4096) {
  const tex = _makeRadialDotDataURL(64);
  // name, imgUrl, capacity, cellSize, scene
  const mgr = new BABYLON.SpriteManager("starDots", tex, capacity, { width: 64, height: 64 }, scene);
  mgr.isPickable = false;
  return mgr;
}

export function createStarDotSprite(manager, id, position, color, size = 1.0) {
  const spr = new BABYLON.Sprite(id, manager);
  spr.position.copyFrom(position);
  spr.size = size;
  if (color) spr.color = color;
  spr.isPickable = false;
  return spr;
}
