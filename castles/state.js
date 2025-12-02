// state.js
// ============================================================
// Creación y utilidades básicas del estado de juego
// ============================================================

import {
  GAME_CONFIG,
  STARTING_RESOURCES,
  TERRAIN_SPRITE_META
} from "./config.js";

// ===========================
// Terreno inicial
// ===========================

function randomTerrain() {
  const r = Math.random();
  if (r < 0.15) return "rock";    // roca
  if (r < 0.45) return "forest";  // bosque
  return "plain";                 // llano
}

// Devuelve un índice de variante estable por (x,y) en función de las variantes disponibles
export function chooseTerrainVariant(terrain, x, y) {
  const meta = TERRAIN_SPRITE_META[terrain];
  const count =
    meta && Array.isArray(meta.variants) ? meta.variants.length : 0;
  if (!count) return 0;

  // Hash simple determinista para que una misma casilla siempre use la misma variación
  const seed = (x * 47 + y * 101) & 0xffffffff;
  const idx = Math.abs(seed) % count;
  return idx;
}

// ===========================
// Población / labor inicial
// ===========================

function createInitialLabor(population) {
  // Reparto inicial simple: algo de todo
  const builders = 8;
  const farmers = 8;
  const miners = 6;
  const lumberjacks = 4;
  const soldiers = 2;
  const servants = 0;
  const clergy = 0;

  let used =
    builders + farmers + miners + lumberjacks + soldiers + servants + clergy;
  if (used > population) used = population;

  const unassigned = Math.max(0, population - used);

  return {
    builders,
    farmers,
    miners,
    lumberjacks,
    soldiers,
    servants,
    clergy,
    unassigned
  };
}

// ===========================
// Generación de mapa inicial
// ===========================

// Talla un río de norte a sur haciendo meandros suaves
function carveRiver(tiles) {
  const height = tiles.length;
  if (height === 0) return;
  const width = tiles[0].length;
  if (width === 0) return;

  // Empezamos más o menos en el centro del mapa
  let x = Math.floor(width / 2);

  for (let y = 0; y < height; y++) {
    // Ancho de río: 3 losetas (x-1, x, x+1)
    for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx;
      if (xx >= 0 && xx < width) {
        const t = tiles[y][xx];
        t.terrain = "water";
        t.forestAmount = 0;
        t.building = null;
        t.underConstruction = null;
      }
    }

    // Ligero meandro izquierda / derecha
    const r = Math.random();
    if (r < 0.33 && x > 2) x--;
    else if (r > 0.66 && x < width - 3) x++;
  }
}

function createInitialTiles() {
  const tiles = [];
  for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
    const row = [];
    for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
      const terrain = randomTerrain();
      row.push({
        x,
        y,
        terrain, // "plain" | "forest" | "rock" | "water"
        // Índice de variación de sprite para este terreno (0..N-1 según config)
        terrainVariant: chooseTerrainVariant(terrain, x, y),
        forestAmount: terrain === "forest" ? 1 : 0,
        building: null,
        underConstruction: null,
        buildRemainingDays: 0
      });
    }
    tiles.push(row);
  }
  // Talla el río sobre el terreno ya generado
  carveRiver(tiles);
  return tiles;
}

// ===========================
// Estado inicial completo
// ===========================

export function createInitialState() {
  const population = STARTING_RESOURCES.population;
  const labor = createInitialLabor(population);

  return {
    timeSeconds: 0,
    day: 1,
    speedMultiplier: 1,
    resources: { ...STARTING_RESOURCES },
    tiles: createInitialTiles(),
    selectedBuilding: "wall_1",
    taxRate: 1, // 0 = bajos, 1 = normales, 2 = altos
    relations: {
      church: 50,
      crown: 50,
      people: 50,
      guilds: 50,
      overlord: 60 
    },
    // Sistema de prestigio y títulos
    prestige: 0,
    title: "Señor de la fortaleza",

    labor, // usamos la constante que hemos creado arriba
    // Sueldos por gremio (0=bajo,1=normal,2=alto)
    wages: {
      builders: 1,
      farmers: 1,
      miners: 1,
      lumberjacks: 1,
      soldiers: 1,
      servants: 1,
      clergy: 1
    },
    
    // Leyes activas
    laws: {
      corveeLabor: false,
      forestProtection: false
    },

    // Estructuras especiales ligadas al clero / eventos
    structures: {
      chapel: false,
      monastery: false,
      cathedral: false
    },

    // Crónica y nivel de malestar del pueblo
    logs: [],
    unrest: 0,

    // Banderas varias para eventos “solo una vez”
    flags: {
      garrisonProposalSeen: false,
      hasCleric: false,      // ¿Hemos aceptado al clérigo oficial del obispo?
      altCultSeen: false     // Para evitar que el evento de “otras religiones/hechiceros” se repita
    }
  };
}