// build.js
// ============================================================================
//  Lógica de construcción / demolición y helpers de recursos
// ============================================================================

import { GAME_CONFIG, BUILDING_TYPES } from "./config.js";

/**
 * Comprueba si el estado tiene recursos suficientes para pagar un coste.
 * @param {GameState} state
 * @param {Object} cost  { gold, wood, stone, food, ... }
 */
export function hasResourcesFor(state, cost) {
  if (!cost) return true;
  const res = state.resources;
  for (const key in cost) {
    if (!Object.prototype.hasOwnProperty.call(cost, key)) continue;
    if ((res[key] || 0) < cost[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Descuenta recursos del estado.
 * @param {GameState} state
 * @param {Object} cost
 */
export function payCost(state, cost) {
  if (!cost) return;
  const res = state.resources;
  for (const key in cost) {
    if (!Object.prototype.hasOwnProperty.call(cost, key)) continue;
    res[key] = (res[key] || 0) - cost[key];
  }
}

/**
 * Intenta construir o demoler en una loseta.
 *
 * - Respeta modo demolición (selectedBuilding === "demolish")
 * - Aplica todas las restricciones de terreno
 * - Respeta la ley forestProtection para defensas sobre bosque
 * - Convierte terreno especial a llano al construir (salvo puente sobre agua)
 *
 * @param {GameState} state
 * @param {number} tileX
 * @param {number} tileY
 * @param {Object} opts
 * @param {Function} [opts.addLogEntry]
 * @param {Function} [opts.chooseTerrainVariant]
 * @param {string} [opts.buildingId]  Útil para tests; por defecto usa state.selectedBuilding
 */
export function tryPlaceOrDemolishBuilding(state, tileX, tileY, opts = {}) {
  const { addLogEntry, chooseTerrainVariant, buildingId } = opts;

  if (
    tileX < 0 ||
    tileX >= GAME_CONFIG.mapWidth ||
    tileY < 0 ||
    tileY >= GAME_CONFIG.mapHeight
  ) {
    return;
  }

  const tile = state.tiles[tileY][tileX];
  if (!tile) return;

  const b = buildingId || state.selectedBuilding;
  if (!b) return;

  const isGateBuilding = b === "gate_1" || b === "gate_2";
  const isMill = b === "mill";

  // ------------------------------
  // MODO DEMOLICIÓN
  // ------------------------------
  if (b === "demolish") {
    if (tile.building || tile.underConstruction) {
      // Reembolso parcial de recursos si el edificio estaba terminado
      if (tile.building) {
        const existingId = tile.building;
        const defExisting = BUILDING_TYPES[existingId];
        if (defExisting && defExisting.cost) {
          const cost = defExisting.cost;
          for (const key in cost) {
            if (!Object.prototype.hasOwnProperty.call(cost, key)) continue;
            const refund = Math.floor(cost[key] * 0.5);
            if (refund > 0) {
              state.resources[key] = (state.resources[key] || 0) + refund;
            }
          }
        }
      }
      // En cualquier caso, borramos el edificio/obra
      tile.building = null;
      tile.underConstruction = null;
      tile.buildRemainingDays = 0;
    }
    // En modo demolición no intentamos construir nada
    return;
  }

  // ------------------------------
  // VALIDACIONES GENERALES
  // ------------------------------
  if (tile.building || tile.underConstruction) {
    const hasRoadOnly = tile.building === "road" && !tile.underConstruction;
    // Solo permitimos construir puertas sobre un camino ya construido
    if (!(isGateBuilding && hasRoadOnly)) {
      return;
    }
  }

  const def = BUILDING_TYPES[b];
  if (!def) return;

  // Reglas especiales por tipo de edificio
  // Puertas: solo se pueden construir sobre un camino ya construido
  if (isGateBuilding) {
    if (tile.building !== "road" || tile.underConstruction) {
      console.log(
        "Las puertas solo se pueden construir sobre un camino ya construido."
      );
      return;
    }
  }

  // ------------------------------
  // RESTRICCIONES DE TERRENO
  // ------------------------------

  // Agua: solo se puede construir puente
  if (tile.terrain === "water" && b !== "bridge") {
    console.log("Solo se puede construir un puente sobre el río.");
    return;
  }
  // El puente solo tiene sentido sobre agua
  if (b === "bridge" && tile.terrain !== "water") {
    console.log("Los puentes solo pueden colocarse sobre agua.");
    return;
  }

  if (b === "farm" && tile.terrain !== "plain") {
    console.log("Las granjas solo se pueden colocar en llanuras.");
    return;
  }
  if (b === "quarry" && tile.terrain !== "rock") {
    console.log("Las canteras solo se pueden colocar en roca.");
    return;
  }
  if (b === "lumberyard" && tile.terrain !== "forest") {
    console.log("Los aserraderos solo se pueden colocar en bosque.");
    return;
  }

  // Molinos: deben ir en tierra llana junto a al menos una loseta de agua adyacente
  if (isMill) {
    if (tile.terrain !== "plain") {
      console.log(
        "Los molinos solo se pueden construir en tierra llana junto a un río."
      );
      return;
    }
    let adjacentWater = false;
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];
    for (const [dx, dy] of dirs) {
      const nx = tileX + dx;
      const ny = tileY + dy;
      if (
        ny >= 0 &&
        ny < GAME_CONFIG.mapHeight &&
        nx >= 0 &&
        nx < GAME_CONFIG.mapWidth
      ) {
        const neighbor = state.tiles[ny][nx];
        if (neighbor && neighbor.terrain === "water") {
          adjacentWater = true;
          break;
        }
      }
    }
    if (!adjacentWater) {
      console.log(
        "Los molinos deben construirse junto al río (al menos una loseta adyacente de agua)."
      );
      return;
    }
  }

  // ------------------------------
  // RECURSOS
  // ------------------------------
  if (!hasResourcesFor(state, def.cost)) {
    console.log("Recursos insuficientes para construir", def.name);
    return;
  }

  const isDefenseBuilding =
    BUILDING_TYPES[b] && BUILDING_TYPES[b].category === "defense";

  // No se puede construir muralla/torre/puerta en el río (agua)
  if (isDefenseBuilding && tile.terrain === "water") {
    console.log("No se pueden construir defensas en el río (solo puentes).");
    return;
  }

  // Ley de protección de bosques: si está activa, no se puede talar bosque para construir defensas
  if (
    state.laws &&
    state.laws.forestProtection &&
    isDefenseBuilding &&
    tile.terrain === "forest"
  ) {
    if (typeof addLogEntry === "function") {
      addLogEntry("La ley de protección de bosques impide construir ahí.");
    }
    return;
  }

  const isBridge = b === "bridge";

  // ------------------------------
  // APLICAR CAMBIOS EN LA LOSA
  // ------------------------------

  // Al construir (incluidos los caminos), cualquier terreno especial pasa a llano,
  // EXCEPTO en el caso del puente sobre agua, donde queremos conservar el río.
  if (tile.terrain !== "plain" && !(isBridge && tile.terrain === "water")) {
    tile.terrain = "plain";
    // Recalcular variante de llano para esta casilla
    if (typeof chooseTerrainVariant === "function") {
      tile.terrainVariant = chooseTerrainVariant("plain", tileX, tileY);
    }
    tile.forestAmount = 0;
  }

  // Si estamos construyendo una puerta encima de un camino existente,
  // dejamos de marcar el camino como edificio: el camino pasa a ser solo “base” visual.
  if (isGateBuilding && tile.building === "road") {
    tile.building = null;
  }

  // Finalmente, pagar e iniciar construcción
  payCost(state, def.cost);
  tile.underConstruction = b;
  tile.buildRemainingDays = def.buildTimeDays;
}