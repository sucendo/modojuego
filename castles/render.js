// render.js
// ============================================================
//  Render isométrico: terreno, edificios y obras
// ============================================================

import {
  GAME_CONFIG,
  RENDER_CONFIG,
  TERRAIN_SPRITE_META,
  BUILDING_SPRITE_META,
  BUILDING_HEIGHT_PX,
  BUILDING_TYPES
} from "./config.js";

// ===========================
// Constantes de render
// ===========================

const TILE_WIDTH = RENDER_CONFIG.tileWidth;
const TILE_HEIGHT = RENDER_CONFIG.tileHeight;

// ===========================
// Sprites
// ===========================

// Sprites de terreno (arrays de variaciones por tipo: plain, forest, rock, water)
const TERRAIN_SPRITES = {};

// Sprites de edificios (cargados a partir de BUILDING_SPRITE_META)
const BUILDING_SPRITES = {};

export function loadTerrainSprites() {
  for (const terrain in TERRAIN_SPRITE_META) {
    const meta = TERRAIN_SPRITE_META[terrain];
    if (!meta || !Array.isArray(meta.variants) || meta.variants.length === 0) {
      continue;
    }
    TERRAIN_SPRITES[terrain] = meta.variants.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }
}

export function loadBuildingSprites() {
  for (const kind in BUILDING_SPRITE_META) {
    const meta = BUILDING_SPRITE_META[kind];
    if (!meta || !meta.src) continue;

    const img = new Image();
    img.src = meta.src;
    BUILDING_SPRITES[kind] = img;
  }
}

// ===========================
// Conversión isométrica (para dibujar)
// ===========================

function isoToScreen(tileX, tileY, originX, originY) {
  const sx = originX + (tileX - tileY) * (TILE_WIDTH / 2);
  const sy = originY + (tileX + tileY) * (TILE_HEIGHT / 2);
  return [sx, sy];
}

// ===========================
// Render principal
// ===========================

/**
 * Dibuja el mapa completo en el canvas.
 * No toca HUD ni DOM; solo canvas.
 *
 * @param {object} state
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {number} originX
 * @param {number} originY
 */
export function render(state, ctx, canvas, originX, originY) {
  if (!state || !ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
      const tile = state.tiles[y][x];
      const [sx, sy] = isoToScreen(x, y, originX, originY);

      // 1) Terreno (color base + overlays de árboles/rocas)
      drawTerrainTile(ctx, sx, sy, tile);

      // 1.5) Camino base justo debajo de las puertas
      const gateKinds = ["gate_1", "gate_2"];
      const hasGateBuilding =
        (tile.building && gateKinds.includes(tile.building)) ||
        (tile.underConstruction && gateKinds.includes(tile.underConstruction));
      if (hasGateBuilding) {
        // Dibujamos un camino como base, en la misma loseta
        drawBuilding(ctx, "road", sx, sy, {
          finished: true,
          progress: 1
        });
      }

      // 2) Edificios / obras en ESTA casilla
      if (tile.underConstruction) {
        const def = BUILDING_TYPES[tile.underConstruction];
        if (def) {
          const totalDays = def.buildTimeDays || 1;
          const remaining = tile.buildRemainingDays;
          const progress = Math.max(
            0,
            Math.min(1, 1 - remaining / totalDays)
          );
          drawBuilding(ctx, tile.underConstruction, sx, sy, {
            finished: false,
            progress
          });
        }
      }

      if (tile.building) {
        drawBuilding(ctx, tile.building, sx, sy, {
          finished: true,
          progress: 1
        });
      }
    }
  }
  ctx.restore();
}

// ===========================
// Terreno
// ===========================

function drawTerrainTile(ctx, sx, sy, tile) {
  const terrain = tile.terrain;
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;

  // 1) SIEMPRE dibujamos la loseta geométrica base (sin sprites)
  let color;
  if (terrain === "forest") {
    color = "#49750c";
  } else if (terrain === "rock") {
    color = "#49750c";
  } else if (terrain === "water") {
    color = "#1f4b82";
  } else {
    color = "#49750c"; // llano
  }

  ctx.beginPath();
  ctx.moveTo(sx, sy - hh);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx - hw, sy);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#22263a";
  ctx.stroke();

  // 2) Overlay decorativo (árboles, rocas...) si hay sprite definido
  const sprites = TERRAIN_SPRITES[terrain];
  const variantIndex = tile.terrainVariant ?? 0;

  const img =
    sprites && sprites.length > 0
      ? sprites[variantIndex % sprites.length]
      : null;

  if (
    img &&
    img.complete &&
    img.naturalWidth > 0 &&
    img.naturalHeight > 0
  ) {
    const meta = TERRAIN_SPRITE_META[terrain] || {};

    // Igual que en drawSpriteBuilding: altura en "losetas" → escala vertical
    const tilesHigh = meta.tilesHigh ?? 2.4;
    const baseOffsetTiles = meta.baseOffsetTiles ?? 0.6;

    const targetHeightPx = tilesHigh * TILE_HEIGHT;
    const baseScale = targetHeightPx / img.naturalHeight;
    const scale = baseScale;

    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;

    // Base de la loseta (parte inferior del rombo)
    const tileBottomY = sy + hh;
    const baseOffsetPx = baseOffsetTiles * TILE_HEIGHT;

    const dx = sx - w / 2;
    // baseOffsetTiles > 0 hunde ligeramente el sprite en la loseta,
    // en vez de levantarlo (antes estaba al revés).
    const dy = tileBottomY + baseOffsetPx - h;

    ctx.drawImage(img, dx, dy, w, h);
  }
}

// ===========================
// Edificios
// ===========================

// Dibuja un edificio desde sprite, usando BUILDING_SPRITE_META
// Semántica:
// - tilesHigh: altura objetivo en múltiplos de TILE_HEIGHT.
// - baseOffsetTiles: desplazamiento desde el borde inferior de la loseta
//   (0 = apoya justo en el borde; >0 se hunde; <0 flota).
function drawSpriteBuilding(ctx, kind, sx, sy, options) {
  const meta = BUILDING_SPRITE_META[kind];
  const img = BUILDING_SPRITES[kind];

  if (
    !meta ||
    !img ||
    !img.complete ||
    img.naturalWidth === 0 ||
    img.naturalHeight === 0
  ) {
    return;
  }

  const tilesHigh = meta.tilesHigh ?? 2.4;
  const baseOffsetTiles = meta.baseOffsetTiles ?? 0; // como en main.js

  const targetHeightPx = tilesHigh * TILE_HEIGHT;
  const baseScale = targetHeightPx / img.naturalHeight;

  // El edificio NO cambia de tamaño con el progreso: solo cambia la transparencia.
  const scale = baseScale;

  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;

  // Base de la loseta (parte inferior del rombo)
  const tileBottomY = sy + TILE_HEIGHT / 2;

  // Offset adicional desde el borde inferior de la loseta
  const baseOffsetPx = baseOffsetTiles * TILE_HEIGHT;

  // Centro horizontal en la loseta
  const drawX = sx - w / 2;
  // Base del sprite apoyada en tileBottomY + baseOffsetPx
  const drawY = tileBottomY - h + baseOffsetPx;

  const finished = options.finished;
  const progress = options.progress ?? 1;

  // Mientras está en obra, que "aparezca" poco a poco vía alpha.
  if (!finished) {
    // Alpha de 0.25 (muy tenue) hasta 1.0 según progreso
    const alpha = 0.25 + 0.75 * progress;
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    ctx.save();
    ctx.globalAlpha = clampedAlpha;
    ctx.drawImage(img, drawX, drawY, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, drawX, drawY, w, h);
  }

  // Barra de progreso si no está terminado
  if (!finished) {
    const barWidth = TILE_WIDTH;
    const barHeight = 4;
    const px = sx - barWidth / 2;
    const py = drawY - 8;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(px, py, barWidth, barHeight);

    ctx.fillStyle = "#d4a95f";
    ctx.fillRect(px, py, barWidth * progress, barHeight);
  }
}

function drawBuilding(ctx, kind, sx, sy, options) {
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;
  const finished = options.finished;
  const progress = options.progress ?? 1;

  // Si hay sprite válido definido para este tipo, lo usamos y salimos
  const spriteMeta = BUILDING_SPRITE_META[kind];
  const spriteImg = spriteMeta ? BUILDING_SPRITES[kind] : null;
  if (
    spriteMeta &&
    spriteImg &&
    spriteImg.complete &&
    spriteImg.naturalWidth > 0 &&
    spriteImg.naturalHeight > 0
  ) {
    drawSpriteBuilding(ctx, kind, sx, sy, { finished, progress });
    return;
  }

  // Altura según tipo, tomada de config.js
  let heightPx = BUILDING_HEIGHT_PX[kind];
  if (typeof heightPx !== "number") {
    heightPx = 18; // valor por defecto
  }

  // Base
  const topBaseX = sx;
  const topBaseY = sy - hh;
  const rightBaseX = sx + hw;
  const rightBaseY = sy;
  const bottomBaseX = sx;
  const bottomBaseY = sy + hh;
  const leftBaseX = sx - hw;
  const leftBaseY = sy;

  // Tapa
  const topTopX = sx;
  const topTopY = sy - hh - heightPx;
  const rightTopX = sx + hw;
  const rightTopY = sy - heightPx;
  const bottomTopX = sx;
  const bottomTopY = sy + hh - heightPx;
  const leftTopX = sx - hw;
  const leftTopY = sy - heightPx;

  // Colores
  let baseColor, topColor, rightColor, leftColor;

  if (kind === "wall" || kind === "wall_1" || kind === "wall_2") {
    baseColor = "#7b7b8c";
    topColor = "#8a8aa0";
    rightColor = "#b3b3c8";
    leftColor = "#5b5b70";
  } else if (kind === "tower_square" || kind === "tower_round") {
    baseColor = "#8e7b4a";
    topColor = "#a7894f";
    rightColor = "#caa25f";
    leftColor = "#6c4e2a";
  } else if (kind === "gate" || kind === "gate_1" || kind === "gate_2") {
    baseColor = "#6b4b2b";
    topColor = "#7c5833";
    rightColor = "#986c3d";
    leftColor = "#573b22";
  } else if (kind === "road") {
    baseColor = "#8a6a3b";
    topColor = "#9b7b4a";
    rightColor = "#b9965e";
    leftColor = "#74552f";
  } else if (kind === "farm") {
    baseColor = "#3f7b3a";
    topColor = "#4c8f46";
    rightColor = "#65b45e";
    leftColor = "#2f5c2c";
  } else if (kind === "quarry") {
    baseColor = "#9e9ea8";
    topColor = "#aeb0ba";
    rightColor = "#d0d2de";
    leftColor = "#737583";
  } else if (kind === "lumberyard") {
    baseColor = "#5f4a34";
    topColor = "#765b3f";
    rightColor = "#94714e";
    leftColor = "#4a3727";
  } else if (kind === "keep") {
    baseColor = "#8f8f9b";
    topColor = "#a2a2b3";
    rightColor = "#c2c2d5";
    leftColor = "#707081";
  } else {
    baseColor = "#8c7b5a";
    topColor = "#9b8a63";
    rightColor = "#b8a474";
    leftColor = "#6d5b45";
  }

  ctx.save();

  // Caras laterales
  ctx.beginPath();
  ctx.moveTo(leftBaseX, leftBaseY);
  ctx.lineTo(leftTopX, leftTopY);
  ctx.lineTo(topTopX, topTopY);
  ctx.lineTo(topBaseX, topBaseY);
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(topBaseX, topBaseY);
  ctx.lineTo(topTopX, topTopY);
  ctx.lineTo(rightTopX, rightTopY);
  ctx.lineTo(rightBaseX, rightBaseY);
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.stroke();

  // Tapa superior
  ctx.beginPath();
  ctx.moveTo(topTopX, topTopY);
  ctx.lineTo(rightTopX, rightTopY);
  ctx.lineTo(bottomTopX, bottomTopY);
  ctx.lineTo(leftTopX, leftTopY);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.stroke();

  // Si está en construcción, superponemos una malla/andamio simple
  if (!finished) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#d4a95f";
    ctx.fillRect(
      leftTopX + hw * 0.1,
      topTopY + heightPx * 0.4,
      hw * 1.6,
      heightPx * 0.6
    );
  }

  ctx.restore();
}
