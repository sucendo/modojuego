// config.js

export const GAME_CONFIG = {
  mapWidth: 64,
  mapHeight: 64,
  secondsPerDay: 10 // 1 día = 10 segundos
};

export const STARTING_RESOURCES = {
  gold: 200,
  stone: 150,
  wood: 60,
  food: 100,
  population: 30
};

// Tipos de edificio
// wall, tower, gate = defensivos
// farm = produce comida
// quarry = produce piedra
// lumberyard = produce madera
export const BUILDING_TYPES = {
  wall: {
    id: "wall",
    name: "Muro de piedra",
    cost: { stone: 5, wood: 1, gold: 1 },
    buildTimeDays: 0.5
  },
  tower: {
    id: "tower",
    name: "Torre",
    cost: { stone: 20, wood: 5, gold: 5 },
    buildTimeDays: 2
  },
  gate: {
    id: "gate",
    name: "Puerta de muralla",
    cost: { stone: 15, wood: 10, gold: 5 },
    buildTimeDays: 2
  },
  bridge: {
    id: "bridge",
    name: "Puente",
    cost: { wood: 40, stone: 20, gold: 10 },
    buildTimeDays: 6
  },
  farm: {
    id: "farm",
    name: "Granja",
    cost: { gold: 10, stone: 3, wood: 2 },
    buildTimeDays: 2
  },
  quarry: {
    id: "quarry",
    name: "Cantera",
    cost: { gold: 5 },
    buildTimeDays: 3
  },
  lumberyard: {
    id: "lumberyard",
    name: "Aserradero",
    cost: { gold: 8, food: 4 },
    buildTimeDays: 2.5
  },
  mill: {
    id: "mill",
    name: "Molino",
    cost: { wood: 15, stone: 10, gold: 20 },
    buildTimeDays: 4
  },
  road: {
    id: "road",
    name: "Camino",
    cost: { stone: 1 },
    buildTimeDays: 1
  }
};

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

// Impuestos / comida / eventos
export const BASE_TAX_PER_PERSON = 0.4;
export const FOOD_PER_PERSON_PER_DAY = 0.5;
export const EVENT_COOLDOWN_DAYS = 7;