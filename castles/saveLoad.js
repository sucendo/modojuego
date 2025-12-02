// saveLoad.js
// ============================================================
//  Serialización de la partida: guardar/cargar/exportar
//  + normalización de partidas antiguas
// ============================================================

import {
  STARTING_RESOURCES,
  BUILDING_TYPES,
  PRESTIGE_PER_BUILDING,
  TITLE_TIERS,
  GAME_CONFIG,
  EVENT_COOLDOWN_DAYS
} from "./config.js";

/**
 * Construye el payload serializable a partir del estado actual.
 */
export function createSavePayload(state, originX, originY, lastEventDay, eventCooldownDays) {
  return {
    version: 1,
    state,
    originX,
    originY,
    lastEventDay,
    eventCooldownDays,
    playerName:
      (state && state.playerName) ||
      localStorage.getItem("castles_player_name") ||
      ""
  };
}

/**
 * Guarda el payload en localStorage.
 */
export function saveGameToLocalStorage(payload) {
  localStorage.setItem("castles_save", JSON.stringify(payload));
}

/**
 * Lee y parsea el payload desde localStorage.
 * Devuelve null si no hay partida.
 */
export function loadGamePayloadFromLocalStorage() {
  const raw = localStorage.getItem("castles_save");
  if (!raw) return null;
  return JSON.parse(raw);
}

/**
 * Crea el blob para exportar el payload como JSON.
 */
export function createExportBlob(payload) {
  const json = JSON.stringify(payload, null, 2);
  return new Blob([json], { type: "application/json" });
}

/**
 * Normaliza un payload cargado (compatibilidad partidas antiguas).
 *  - Ajusta timeSeconds al secondsPerDay actual
 *  - Rellena recursos que falten
 *  - Migra IDs de edificios antiguos (tower, wall, gate)
 *  - Asegura taxRate, prestige y title coherentes
 *
 * NO toca HUD ni DOM; solo devuelve { state, originX, originY, lastEventDay, eventCooldownDays, playerName }.
 */
export function normalizeLoadedState(payload) {
  if (!payload || !payload.state) {
    throw new Error("Guardado inválido (sin state)");
  }

  const result = {
    state: payload.state,
    originX: typeof payload.originX === "number" ? payload.originX : 0,
    originY: typeof payload.originY === "number" ? payload.originY : 0,
    lastEventDay:
      typeof payload.lastEventDay === "number"
        ? payload.lastEventDay
        : payload.state.day || 1,
    eventCooldownDays:
      typeof payload.eventCooldownDays === "number"
        ? payload.eventCooldownDays
        : EVENT_COOLDOWN_DAYS,
    playerName:
      typeof payload.playerName === "string"
        ? payload.playerName
        : payload.state.playerName || ""
  };

  const state = result.state;

  // ───────────────────────────────────────────────
  // 1) Normalizar reloj interno al secondsPerDay actual
  // ───────────────────────────────────────────────
  if (typeof state.day === "number" && state.day > 0) {
    state.timeSeconds = (state.day - 1) * GAME_CONFIG.secondsPerDay;
  } else {
    state.day = 1;
    state.timeSeconds = 0;
  }

  // ───────────────────────────────────────────────
  // 2) Asegurar recursos básicos
  // ───────────────────────────────────────────────
  if (!state.resources || typeof state.resources !== "object") {
    state.resources = { ...STARTING_RESOURCES };
  } else {
    for (const [key, defVal] of Object.entries(STARTING_RESOURCES)) {
      const cur = Number(state.resources[key]);
      if (!Number.isFinite(cur)) {
        state.resources[key] = defVal;
      }
    }
  }

  // ───────────────────────────────────────────────
  // 3) Migración simple de IDs de edificios antiguos
  //    tower → tower_square, wall → wall_1, gate → gate_1
  // ───────────────────────────────────────────────
  const buildingIdMigration = {
    tower: "tower_square",
    wall: "wall_1",
    gate: "gate_1"
  };

  if (Array.isArray(state.tiles)) {
    for (let y = 0; y < state.tiles.length; y++) {
      const row = state.tiles[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const tile = row[x];
        if (!tile) continue;

        if (tile.building && buildingIdMigration[tile.building]) {
          tile.building = buildingIdMigration[tile.building];
        }
        if (tile.underConstruction && buildingIdMigration[tile.underConstruction]) {
          tile.underConstruction = buildingIdMigration[tile.underConstruction];
        }

        const bId = tile.building || tile.underConstruction;

        // Puertas antiguas → asegurarse de que tienen camino debajo
        if (bId === "gate_1") {
          tile.terrain = "road";
        }
        // Puentes: no tocamos el agua bajo el puente si ya existe (bridge + water)
      }
    }
  }

  // ───────────────────────────────────────────────
  // 4) Impuestos, prestigio y título
  // ───────────────────────────────────────────────

  // Impuestos
  if (typeof state.taxRate !== "number") {
    state.taxRate = 1;
  }

  // Si no hay prestigio numérico, estimamos a partir de edificios
  if (typeof state.prestige !== "number") {
    let estimated = 0;
    if (state.tiles && PRESTIGE_PER_BUILDING) {
      for (let y = 0; y < state.tiles.length; y++) {
        const row = state.tiles[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          const b = row[x] && row[x].building;
          if (b && PRESTIGE_PER_BUILDING[b]) {
            estimated += PRESTIGE_PER_BUILDING[b];
          }
        }
      }
    }
    state.prestige = estimated;
  }

  // Título: si no hay, o está vacío, y hay tiers definidos
  if (!state.title) {
    state.title = "Señor de la fortaleza";
  }
  if (Array.isArray(TITLE_TIERS) && TITLE_TIERS.length > 0) {
    const p = typeof state.prestige === "number" ? state.prestige : 0;
    let newTitle = state.title;
    for (const tier of TITLE_TIERS) {
      if (p >= tier.minPrestige) {
        newTitle = tier.title;
      }
    }
    state.title = newTitle;
  }

  return result;
}
