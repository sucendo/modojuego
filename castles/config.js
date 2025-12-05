// config.js

export const GAME_CONFIG = {
  mapWidth: 64,
  mapHeight: 64,
  secondsPerDay: 24 // 1 día = 24 segundos
};

export const STARTING_RESOURCES = {
  gold: 200,
  stone: 150,
  wood: 60,
  food: 100,
  population: 30
};

// Definición de edificios disponibles (única fuente de verdad)
//  - category: lógica general del juego ("defense", "economic", "infrastructure"...)
//  - role:     función militar/económica ("tower", "wall", "gate", "farm", "road"...)
//  - sprite:   datos visuales para el render isométrico
//  - heightPx: altura del bloque “geométrico” (fallback si no hay sprite)
//  - prestige: prestigio que da al terminarlo
//  - defenseScore: peso para el cálculo de defensa en eventos
export const BUILDING_TYPES = {

  tower_square: {
    id: "tower_square",
    name: "Torre cuadrada",
    category: "defense",
    role: "tower",
    cost: { stone: 15, gold: 0 },
    buildTimeDays: 1.5,
    sprite: {
      src: "img/buildings/tower_square.webp",
      tilesHigh: 2.5,
      baseOffsetTiles: 0.0,
      constructionScaleMin: 0.0
    },
    heightPx: 34,
    prestige: 3,
    defenseScore: 3
  },

  tower_round: {
    id: "tower_round",
    name: "Torre redonda",
    category: "defense",
    role: "tower",
    cost: { stone: 18, gold: 0 },
    buildTimeDays: 1.8,
    sprite: {
      src: "img/buildings/tower_round.webp",
      tilesHigh: 3.5,
      baseOffsetTiles: 0.1,
      constructionScaleMin: 0.0
    },
    heightPx: 34,
    prestige: 4,
    defenseScore: 4
  },
  
    tower_square_tall: {
    id: "tower_square_tall",
    name: "Torre cuadrada alta",
    category: "defense",
    role: "tower",
    cost: { stone: 25, gold: 0 },
    buildTimeDays: 3.0,
    sprite: {
      src: "img/buildings/tower_square_tall.webp",
      tilesHigh: 6.2,
      baseOffsetTiles: 0.1,
      constructionScaleMin: 0.4
    },
    heightPx: 64,
    prestige: 3,
    defenseScore: 3
  },

  tower_round_tall: {
    id: "tower_round_tall",
    name: "Torre redonda",
    category: "defense",
    role: "tower",
    cost: { stone: 28, gold: 0 },
    buildTimeDays: 2.8,
    sprite: {
      src: "img/buildings/tower_round_tall.webp",
      tilesHigh: 4.2,
      baseOffsetTiles: -0.1,
      constructionScaleMin: 0.0
    },
    heightPx: 64,
    prestige: 4,
    defenseScore: 4
  },

  wall_1: {
    id: "wall_1",
    name: "Muralla",
    category: "defense",
    role: "wall",
    cost: { stone: 5, gold: 0 },
    buildTimeDays: 0.5,
    sprite: {
      src: "img/buildings/wall_1.webp",
      tilesHigh: 2.0,
      baseOffsetTiles: 0.1,
      constructionScaleMin: 0.4
    },
    heightPx: 18,
    prestige: 1,
    defenseScore: 1
  },
  
    wall_2: {
    id: "wall_2",
    name: "Muralla",
    category: "defense",
    role: "wall",
    cost: { stone: 5, gold: 0 },
    buildTimeDays: 0.5,
    sprite: {
      src: "img/buildings/wall_2.webp",
      tilesHigh: 2.0,
      baseOffsetTiles: 0.1,
      constructionScaleMin: 0.4
    },
    heightPx: 18,
    prestige: 1,
    defenseScore: 1
  },
  
  gate_1: {
    id: "gate_1",
    name: "Puerta",
    category: "defense",
    role: "gate",
    cost: { stone: 12, wood: 4, gold: 0 },
    buildTimeDays: 1.2,
    sprite: {
      src: "img/buildings/gate_1.webp",
      tilesHigh: 2.0,
      baseOffsetTiles: 0.0,
      constructionScaleMin: 0.4
    },
    heightPx: 20,
    prestige: 2,
    defenseScore: 2
  },
  
    gate_2: {
    id: "gate_2",
    name: "Puerta",
    category: "defense",
    role: "gate",
    cost: { stone: 12, wood: 4, gold: 0 },
    buildTimeDays: 1.2,
    sprite: {
      src: "img/buildings/gate_2.webp",
      tilesHigh: 2.0,
      baseOffsetTiles: 0.0,
      constructionScaleMin: 0.4
    },
    heightPx: 20,
    prestige: 2,
    defenseScore: 2
  },

  bridge: {
    id: "bridge",
    name: "Puente",
    category: "infrastructure",
    role: "bridge",
    cost: { stone: 8, wood: 4, gold: 0 },
    buildTimeDays: 1.0,
    sprite: {
      src: "img/buildings/bridge.webp",
      tilesHigh: 2.5,
      baseOffsetTiles: 0.5,
      constructionScaleMin: 0.4
    },
    heightPx: 5,
    prestige: 1,
    defenseScore: 0
  },

  farm: {
    id: "farm",
    name: "Granja",
    category: "economic",
    role: "farm",
    cost: { wood: 5, gold: 0 },
    buildTimeDays: 1.0,
    sprite: {
      src: "img/buildings/farm.webp",
      tilesHigh: 2.0,
      baseOffsetTiles: 0.4,
      constructionScaleMin: 0.3
    },
    heightPx: 10,
    prestige: 1,
    defenseScore: 0
  },

  quarry: {
    id: "quarry",
    name: "Cantera",
    category: "economic",
    role: "quarry",
    cost: { wood: 5, gold: 0 },
    buildTimeDays: 1.0,
    sprite: {
      src: "img/buildings/quarry.webp",
      tilesHigh: 2.0,
      baseOffsetTiles: 0.3,
      constructionScaleMin: 0.4
    },
    heightPx: 16,
    prestige: 1,
    defenseScore: 0
  },

  lumberyard: {
    id: "lumberyard",
    name: "Aserradero",
    category: "economic",
    role: "lumberyard",
    cost: { wood: 5, gold: 0 },
    buildTimeDays: 1.0,
    sprite: {
      src: "img/buildings/lumberyard.webp",
      tilesHigh: 2.0,
      baseOffsetTiles: 0.3,
      constructionScaleMin: 0.4
    },
    heightPx: 14,
    prestige: 1,
    defenseScore: 0
  },

  mill: {
    id: "mill",
    name: "Molino",
    category: "economic",
    role: "mill",
    cost: { wood: 8, stone: 4, gold: 0 },
    buildTimeDays: 1.5,
    sprite: {
      src: "img/buildings/mill.webp",
      tilesHigh: 2.4,
      baseOffsetTiles: 0.5,
      constructionScaleMin: 0.4
    },
    heightPx: 18,
    prestige: 1,
    defenseScore: 0
  },

  road: {
    id: "road",
    name: "Camino",
    category: "infrastructure",
    role: "road",
    cost: { gold: 0 },
    buildTimeDays: 0.1,
    sprite: {
      src: "img/buildings/road.webp",
      tilesHigh: 2.2,
      baseOffsetTiles: 0.6,
      constructionScaleMin: 0.4
    },
    heightPx: 2,
    prestige: 0,
    defenseScore: 0
  },
  
    tile: {
    id: "tile",
    name: "Loseta",
    category: "infrastructure",
    role: "road",
    cost: { stone: 2, wood: 1, gold: 0 },
    buildTimeDays: 1.0,
    sprite: {
      src: "img/buildings/tile.webp",
      tilesHigh: 2.4,
      baseOffsetTiles: 0.6,
      constructionScaleMin: 0.4
    },
    heightPx: 0,
    prestige: 1,
    defenseScore: 0
  }
};

// Mapas derivados: el resto del código sigue usando estas constantes,
// pero ya NO hay que tocarlas al crear un edificio nuevo.
export const BUILDING_SPRITE_META = {};
export const BUILDING_HEIGHT_PX = {};
export const PRESTIGE_PER_BUILDING = {};

for (const [id, def] of Object.entries(BUILDING_TYPES)) {
  if (def.sprite) {
    BUILDING_SPRITE_META[id] = def.sprite;
  }
  if (typeof def.heightPx === "number") {
    BUILDING_HEIGHT_PX[id] = def.heightPx;
  }
  if (typeof def.prestige === "number") {
    PRESTIGE_PER_BUILDING[id] = def.prestige;
  }
}

// ===========================
// Equilibrio de juego
// ===========================
export const BASE_BUILDERS_PER_SITE = 10;

// Producción base por edificio y día
export const FOOD_PER_FARM_PER_DAY = 4;
export const STONE_PER_QUARRY_PER_DAY = 5;
export const WOOD_PER_LUMBERYARD_PER_DAY = 4;

// Trabajadores “ideales” por edificio
export const WORKERS_PER_FARM = 3;
export const WORKERS_PER_QUARRY = 3;
export const WORKERS_PER_LUMBERYARD = 3;
export const BUILDERS_PER_SITE = 5;

// Sueldos: niveles 0=bajo, 1=normal, 2=alto
export const WAGE_MULTIPLIER = [0.7, 1.0, 1.4];
export const WAGE_BASE = {
  builders: 1.2,
  farmers: 1.0,
  miners: 1.1,
  lumberjacks: 1.0,
  soldiers: 1.3,
  servants: 1.1,
  clergy: 0.9
};

// Etiquetas de niveles de sueldo (para tooltips y crónica)
export const WAGE_TIER_LABELS = {
  0: "bajo",
  1: "normal",
  2: "alto"
};

// Etiquetas de gremios (para tooltips y crónica)
export const WAGE_ROLE_LABELS = {
  builders: "Constructores",
  farmers: "Granjeros",
  miners: "Canteros",
  lumberjacks: "Leñadores",
  soldiers: "Soldados",
  servants: "Administración / Servicio",
  clergy: "Clero"
};

// Impuestos / comida / eventos
export const BASE_TAX_PER_PERSON = 0.4;
export const FOOD_PER_PERSON_PER_DAY = 0.5;
export const EVENT_COOLDOWN_DAYS = 7;

// Prestigio y títulos del señor
export const TITLE_TIERS = [
  { title: "Señor de la fortaleza", minPrestige: 0 },
  { title: "Barón", minPrestige: 50 },
  { title: "Vizconde", minPrestige: 120 },
  { title: "Conde", minPrestige: 250 },
  { title: "Duque", minPrestige: 500 }
];

// Reglas militares / guarnición
export const MILITARY_RULES = {
  soldiersPerPopulation: 15,   // 1 soldado por cada 15 hab.
  towersPerExtraSoldier: 5,    // +1 mínimo por cada 5 torres
  wallsPerExtraSoldier: 10     // +1 mínimo por cada 10 murallas
};

// Render isométrico / cámara
export const RENDER_CONFIG = {
  tileWidth: 48,
  tileHeight: 28,
  cameraStepX: 48,
  cameraStepY: 28
};

// UI de impuestos (solo para tooltips)
export const TAX_MULTIPLIER_UI = [0.6, 1.0, 1.4];

// Etiquetas de los niveles de impuestos (para tooltips)
export const TAX_LEVEL_LABELS = {
  0: "Impuestos bajos",
  1: "Impuestos normales",
  2: "Impuestos altos"
};

// Etiquetas de las leyes (para UI y crónica)
export const LAW_LABELS = {
  corveeLabor: "Corveas obligatorias",
  forestProtection: "Protección de bosques comunales",
  millTax: "Tasa obligatoria del molino",
  censusLaw: "Censo y registros oficiales",
  grainPriceControl: "Control de precios del grano"
};

// Sprites de overlay de terreno (árboles, rocas, detalles sobre la loseta base).
// IMPORTANTE:
//  - Las imágenes deben tener fondo totalmente transparente.
//  - Pueden incluir su propia loseta siempre que esté en la misma perspectiva
//    que "tile.webp".
//  - Se escalan usando tilesHigh y baseOffsetTiles igual que los edificios.
export const TERRAIN_SPRITE_META = {
  plain: {
    variants: [
      "img/terrain/grass_1.webp",
      "img/terrain/grass_2.webp",
      "img/terrain/grass_3.webp",
      "img/terrain/grass_4.webp"	  
    ],
    tilesHigh: 2.2,
    baseOffsetTiles: 0.1
  },
  forest: {
    variants: [
      "img/terrain/trees_1.webp",
      "img/terrain/trees_2.webp",
      "img/terrain/trees_3.webp"
    ],
    // Algo más altos que la loseta simple (copas de los árboles)
    tilesHigh: 2.2,
    // Mismo apoyo que la loseta "tile"
    baseOffsetTiles: 0.1
  },
  rock: {
    variants: [
      "img/terrain/rocks_1.webp",
      "img/terrain/rocks_2.webp"
    ],
    // Rocas algo más bajas
    tilesHigh: 2.2,
    baseOffsetTiles: 0.1
  },
  water: {
    variants: [
      "img/terrain/water_detail_1.webp",
      "img/terrain/water_detail_2.webp"
    ],
    // Misma altura que la loseta base
    tilesHigh: 2.4,
    baseOffsetTiles: 0.6
  }
};