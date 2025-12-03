// main.js
import {
  GAME_CONFIG,
  TITLE_TIERS,
  STARTING_RESOURCES,
  BUILDING_TYPES,
  BASE_BUILDERS_PER_SITE,
  FOOD_PER_FARM_PER_DAY,
  STONE_PER_QUARRY_PER_DAY,
  WOOD_PER_LUMBERYARD_PER_DAY,
  WORKERS_PER_FARM,
  WORKERS_PER_QUARRY,
  WORKERS_PER_LUMBERYARD,
  BUILDERS_PER_SITE,
  WAGE_MULTIPLIER,
  WAGE_BASE,
  BASE_TAX_PER_PERSON,
  FOOD_PER_PERSON_PER_DAY,
  EVENT_COOLDOWN_DAYS,
  RENDER_CONFIG,
  TAX_MULTIPLIER_UI,
  PRESTIGE_PER_BUILDING,
  MILITARY_RULES,
  TERRAIN_SPRITE_META,
  BUILDING_SPRITE_META,
  BUILDING_HEIGHT_PX
} from "./config.js";
import { SAMPLE_EVENTS } from "./events.js";
import { createInitialState, chooseTerrainVariant } from "./state.js";
import {
  createSavePayload,
  saveGameToLocalStorage,
  loadGamePayloadFromLocalStorage,
  createExportBlob,
  normalizeLoadedState
} from "./saveLoad.js";
import { updateSimulation } from "./simulation.js";
import { render, loadTerrainSprites, loadBuildingSprites } from "./render.js";
import { tryPlaceOrDemolishBuilding } from "./build.js";
import { setupUIBindings, setupPanelGroups } from "./ui.js";

// Constantes de render isométrico
const TILE_WIDTH = RENDER_CONFIG.tileWidth;
const TILE_HEIGHT = RENDER_CONFIG.tileHeight;

// Cámara: origen isométrico (la posición inicial la seguimos fijando aquí)
let originX = 512;
let originY = 80;

// Movimiento de cámara con teclado
const CAMERA_STEP_X = RENDER_CONFIG.cameraStepX;
const CAMERA_STEP_Y = RENDER_CONFIG.cameraStepY;

// ===========================
// Estado global
// ===========================

let canvas;
let ctx;
let canvasWrapper;
let state;
let lastTimestamp = 0;
let pendingEvent = null;
let eventCooldownDays = EVENT_COOLDOWN_DAYS;
let lastEventDay = 0.5;

// Drag de cámara con ratón
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let originStartX = 0;
let originStartY = 0;
let dragMoved = false;

// Calcula el mínimo de soldados recomendado según población
// y defensas construidas (torres y tramos de muralla).
export function computeMinSoldiers(state) {
  const pop = state.resources.population;
  if (pop < 30) return 0; // por debajo de 30 habitantes no exigimos guarnición mínima

  let towers = 0;
  let walls = 0;

  for (let y = 0; y < state.tiles.length; y++) {
    for (let x = 0; x < state.tiles[y].length; x++) {
      const b = state.tiles[y][x].building;
      if (!b) continue;

      const def = BUILDING_TYPES[b];
      if (!def) continue;

      const role = def.role;
      if (role === "tower") {
        towers++;
      } else if (role === "wall") {
        walls++;
      }
    }
  }

  const baseRequired = Math.ceil(pop / MILITARY_RULES.soldiersPerPopulation);
  const towerBonus = Math.floor(towers / MILITARY_RULES.towersPerExtraSoldier);
  const wallBonus  = Math.floor(walls  / MILITARY_RULES.wallsPerExtraSoldier);

  return baseRequired + towerBonus + wallBonus;
}

// Calcula la “demanda” de trabajadores según edificios y obras
function computeLaborDemand(state) {
  let farms = 0;
  let quarries = 0;
  let lumberyards = 0;
  let activeSites = 0;

  for (let y = 0; y < state.tiles.length; y++) {
    for (let x = 0; x < state.tiles[y].length; x++) {
      const tile = state.tiles[y][x];
      if (tile.building === "farm") farms++;
      else if (tile.building === "quarry") quarries++;
      else if (tile.building === "lumberyard") lumberyards++;

      if (tile.underConstruction && tile.buildRemainingDays > 0) {
        activeSites++;
      }
    }
  }

  const wages = state.wages || {};
  const wm = (role) => {
    const tier = wages[role] ?? 1;
    return WAGE_MULTIPLIER[tier] ?? 1.0;
  };
  
  // Demanda base, afectada por el sueldo de granjeros
  const farmersDemand = farms * WORKERS_PER_FARM * wm("farmers");

  const minersDemand =
    quarries * WORKERS_PER_QUARRY * wm("miners");
  const lumberjacksDemand =
    lumberyards * WORKERS_PER_LUMBERYARD * wm("lumberjacks");

  // Demanda de constructores: depende de obras + un mínimo, ajustado por sueldo
  const buildersBase =
    activeSites * BUILDERS_PER_SITE + (activeSites > 0 ? 2 : 0);
  let buildersDemand = buildersBase * wm("builders");
  if (state.laws?.corveeLabor) {
    buildersDemand *= 1.25; // más demanda de obreros en obras
  }

  // Soldados / servicio / clero: ahora también dependen del sueldo,
  // pero en el caso de los soldados intentamos cubrir al menos
  // la guarnición mínima recomendada según población, torres y murallas.
  const pop = state.resources.population;
  const minSoldiers = computeMinSoldiers(state);
  let soldiersDemand = 0;
  if (minSoldiers > 0) {
    // Castillo ya “serio”: apuntamos como mínimo a cubrir la guarnición
    soldiersDemand = minSoldiers;
  } else if (pop > 0) {
    // Castillo muy pequeño: pequeña guardia simbólica
    soldiersDemand = Math.max(1, Math.floor(pop * 0.03));
  }
  soldiersDemand *= wm("soldiers");

  const servantsDemand =
    Math.floor(pop * 0.03) * wm("servants"); // 3%

  // El clero depende del sueldo y de la relación con la Iglesia
  const churchRel = state.relations?.church ?? 50;
  const clergyBase = Math.floor(pop * 0.02); // ~2% de la población
  const churchFactor = 0.5 + churchRel / 100; // entre ~0.5 y ~1.5

  let clergyDemand = clergyBase * wm("clergy") * churchFactor;

  // Si hemos aceptado tener un clérigo residente, garantizamos al menos 1 plaza,
  // aunque el castillo sea pequeño.
  if (state.flags?.hasCleric && clergyDemand < 1 && pop > 0) {
    clergyDemand = 1;
  }

  return {
    builders: buildersDemand,
    farmers: farmersDemand,
    miners: minersDemand,
    lumberjacks: lumberjacksDemand,
    soldiers: soldiersDemand,
    servants: servantsDemand,
    clergy: clergyDemand
  };
}

// Reparte la población disponible según la demanda (sistema de “vacantes”)
export function rebalanceLabor(state) {
  const population = state.resources.population;
  if (population <= 0) {
    state.labor = {
      builders: 0,
      farmers: 0,
      miners: 0,
      lumberjacks: 0,
      soldiers: 0,
      servants: 0,
      clergy: 0,
      unassigned: 0
    };
    return;
  }

  const demand = computeLaborDemand(state);

  const roles = [
    "builders",
    "farmers",
    "miners",
    "lumberjacks",
    "soldiers",
    "servants",
    "clergy"
  ];

  let totalDemand = 0;
  for (const r of roles) {
    totalDemand += demand[r] || 0;
  }

  const newLabor = {
    builders: 0,
    farmers: 0,
    miners: 0,
    lumberjacks: 0,
    soldiers: 0,
    servants: 0,
    clergy: 0,
    unassigned: 0
  };

  if (totalDemand <= 0) {
    // Nadie tiene trabajo “claro”: todo el mundo queda sin asignar
    newLabor.unassigned = population;
  } else if (totalDemand <= population) {
    // Hay suficiente gente para cubrir toda la demanda
    let used = 0;
    for (const r of roles) {
      // Redondeamos la demanda del rol a entero
      const want = Math.max(0, Math.round(demand[r] || 0));
      const assign = Math.min(want, population - used);
      newLabor[r] = assign;
      used += assign;
    }
    newLabor.unassigned = Math.max(0, population - used);
  } else {
    // No llega la gente: se reparte proporcionalmente a la demanda
    let assignedSum = 0;
    for (const r of roles) {
      const want = demand[r] || 0;
      const portion = (want / totalDemand) * population;
      const assign = Math.floor(portion);
      newLabor[r] = assign;
      assignedSum += assign;
    }
    // Reparte restos de 1 en 1 empezando por los roles con más demanda
    let remaining = population - assignedSum;
    if (remaining > 0) {
      const sortedRoles = [...roles].sort(
        (a, b) => (demand[b] || 0) - (demand[a] || 0)
      );
      let idx = 0;
      while (remaining > 0 && idx < sortedRoles.length) {
        newLabor[sortedRoles[idx]] += 1;
        remaining--;
        idx++;
      }
    }
    newLabor.unassigned = 0;
  }
  
  // Por seguridad, garantizamos que todos son enteros y no negativos
  for (const r of roles) {
    newLabor[r] = Math.max(0, Math.round(newLabor[r] || 0));
  }
  newLabor.unassigned = Math.max(
    0,
    Math.round(newLabor.unassigned || 0)
  );

  state.labor = newLabor;
}

// ===========================
// Creación de estado inicial
// ===========================

// Trasladado a state.js

// ===========================
// Crónica: helper genérico
// ===========================
export function addLogEntry(text) {
  if (!state) return;
  if (!state.logs) state.logs = [];
  state.logs.unshift({ day: state.day, text });
  if (state.logs.length > 40) {
    state.logs.length = 40;
  }
}


// Ventana emergente de mensajes simples (errores de construcción, avisos, etc.)
let gameMessageModalEl = null;
let gameMessageTextEl = null;
let gameMessageCloseBtn = null;

function ensureGameMessageElements() {
  if (gameMessageModalEl) return;

  gameMessageModalEl = document.getElementById("game-message-modal");
  gameMessageTextEl = document.getElementById("game-message-text");
  gameMessageCloseBtn = document.getElementById("game-message-close");

  if (!gameMessageModalEl || !gameMessageTextEl || !gameMessageCloseBtn) {
    // Si falta algo del DOM, usamos alert() como reserva.
    return;
  }

  gameMessageCloseBtn.addEventListener("click", hideGameMessage);

  // Cerrar al hacer click fuera de la ventana
  gameMessageModalEl.addEventListener("click", (ev) => {
    if (ev.target === gameMessageModalEl) {
      hideGameMessage();
    }
  });
}

function showGameMessage(text) {
  ensureGameMessageElements();
  if (!gameMessageModalEl || !gameMessageTextEl) {
    // Respaldo por si falta el DOM
    alert(text);
    return;
  }
  gameMessageTextEl.textContent = text;
  gameMessageModalEl.classList.remove("hidden");
}

function hideGameMessage() {
  if (!gameMessageModalEl) return;
  gameMessageModalEl.classList.add("hidden");
}

// ===================
// Salvar y Cargar Partida
// ===================

function saveGame() {
  try {
    const payload = createSavePayload(
      state,
      originX,
      originY,
      lastEventDay,
      eventCooldownDays
    );
    saveGameToLocalStorage(payload);
    showGameMessage("Partida guardada.");
  } catch (err) {
    console.error("Error al guardar la partida:", err);
  }
}

// Exportar la partida a un archivo JSON
function exportGameToFile() {
  try {
    const payload = createSavePayload(
      state,
      originX,
      originY,
      lastEventDay,
      eventCooldownDays
    );
    const blob = createExportBlob(payload);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const baseName =
      (state.playerName || "partida")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\-]+/g, "_")
        .replace(/\s+/g, "_");

    a.href = url;
    a.download = `castles_lords_${baseName}_${yyyy}${mm}${dd}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error al exportar la partida:", err);
    alert("No se ha podido exportar la partida.");
  }
}

function applyLoadedPayload(payload) {
  if (!payload || !payload.state) {
    console.warn("Guardado inválido.");
    showGameMessage("Guardado inválido.");
    return;
  }

  let normalized;
  try {
    normalized = normalizeLoadedState(payload);
  } catch (err) {
    console.error("Error al normalizar la partida cargada:", err);
    alert("No se ha podido cargar la partida (formato inválido).");
    return;
  }

  // Asignamos el estado normalizado
  state = normalized.state;
  originX = normalized.originX;
  originY = normalized.originY;
  lastEventDay = normalized.lastEventDay;
  eventCooldownDays = normalized.eventCooldownDays;

  // Nombre de jugador
  if (normalized.playerName) {
    state.playerName = normalized.playerName;
    try {
      localStorage.setItem("castles_player_name", normalized.playerName);
    } catch (_err) {
      // ignoramos errores de quota
    }
  }

  // Cerrar cualquier evento que estuviera abierto
  pendingEvent = null;
  closeEventModal();

  // Refrescar HUD con el nuevo estado
  updateHUD();

  // Refrescar nombre de jugador en la UI (input del menú)
  const nameInput = document.getElementById("player-name-input");
  if (nameInput) {
    nameInput.value = state.playerName || "";
  }

  showGameMessage(
    `Partida cargada el día ${state.day}.`
  );
}

function loadGame() {
  try {
    const payload = loadGamePayloadFromLocalStorage();
    if (!payload) {
      console.warn("No hay partida guardada.");
      showGameMessage("No hay partida guardada.");
      return;
    }
    applyLoadedPayload(payload);
  } catch (err) {
    console.error("Error al cargar la partida:", err);
  }
}
  
// ===========================
// Interacción con el canvas
// ===========================

function setupCanvasInteractions() {
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  window.addEventListener("mousemove", handleCanvasMouseMove);
  window.addEventListener("mouseup", handleCanvasMouseUp);
}

function handleCanvasClick(ev) {
  // Si ha habido arrastre significativo, no contamos como click de construcción
  if (dragMoved) {
    dragMoved = false;
    return;
  }

  if (!state.selectedBuilding) return;
  if (pendingEvent) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = ev.clientX - rect.left;
  const mouseY = ev.clientY - rect.top;

  const [tileX, tileY] = screenToIsoTile(mouseX, mouseY);

  if (
    tileX < 0 ||
    tileX >= GAME_CONFIG.mapWidth ||
    tileY < 0 ||
    tileY >= GAME_CONFIG.mapHeight
  ) {
    return;
  }

  // Delegamos toda la lógica de construcción/demolición en build.js
  tryPlaceOrDemolishBuilding(state, tileX, tileY, {
    addLogEntry,
    chooseTerrainVariant,
    addLogEntry,
    chooseTerrainVariant,
    showMessage: showGameMessage
  });
}

// Drag de cámara con ratón
function handleCanvasMouseDown(ev) {
  isDragging = true;
  dragMoved = false;
  dragStartX = ev.clientX;
  dragStartY = ev.clientY;
  originStartX = originX;
  originStartY = originY;
}

function handleCanvasMouseMove(ev) {
  if (!isDragging) return;

  const dx = ev.clientX - dragStartX;
  const dy = ev.clientY - dragStartY;

  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    dragMoved = true;
  }

  originX = originStartX + dx;
  originY = originStartY + dy;

  ev.preventDefault();
}

function handleCanvasMouseUp(_ev) {
  isDragging = false;
}

// ===========================
// Cámara por teclado
// ===========================

function setupCameraControls() {
  window.addEventListener("keydown", handleCameraKeyDown);
}

function handleCameraKeyDown(ev) {
  // Si estamos escribiendo en un input/textarea/select o en algo editable, no mover cámara
  const target = ev.target;
  if (target) {
    const tag = target.tagName;
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      target.isContentEditable
    ) {
      return;
    }
  }

  let moved = false;

  switch (ev.key) {
    case "ArrowUp":
    case "w":
    case "W":
      originY += CAMERA_STEP_Y;
      moved = true;
      break;

    case "ArrowDown":
    case "s":
    case "S":
      originY -= CAMERA_STEP_Y;
      moved = true;
      break;

    case "ArrowLeft":
    case "a":
    case "A":
      originX += CAMERA_STEP_X;
      moved = true;
      break;

    case "ArrowRight":
    case "d":
    case "D":
      originX -= CAMERA_STEP_X;
      moved = true;
      break;
  }

  if (moved) {
    ev.preventDefault();
  }
}

// Conversión de pantalla a coordenadas de loseta (para input).
// El camino inverso (loseta → pantalla) ahora vive en render.js.
function screenToIsoTile(screenX, screenY) {
  const dx = screenX - originX;
  const dy = screenY - originY;

  const tileXFloat = dx / TILE_WIDTH + dy / TILE_HEIGHT;
  const tileYFloat = dy / TILE_HEIGHT - dx / TILE_WIDTH;

  // Usamos redondeo al entero más cercano para que
  // el centro del rombo cuente como su propia loseta,
  // y no tienda a “irse” a la de arriba.
  const tileX = Math.round(tileXFloat);
  const tileY = Math.round(tileYFloat);
  return [tileX, tileY];
}

// ===========================
// Tiempo / días
// ===========================

export function formatDelta(value) {
  const v = Math.round(value);
  if (v > 0) return `+${v}`;
  if (v < 0) return `${v}`;
  return "±0";
}

// ===========================
// Ciclo diario (helpers)
// ===========================

// Lógica diaria (onNewDay) movida a simulation.js

// ===========================
// Relaciones
// ===========================

export function adjustRelation(key, delta) {
  if (!state.relations || !(key in state.relations)) return;
  const value = state.relations[key] + delta;
  state.relations[key] = Math.max(0, Math.min(100, value));
}

// ===========================
// Prestigio y títulos
// ===========================

function updateTitleFromPrestige() {
  if (!state) return;
  const tiers = TITLE_TIERS || [];
  if (!Array.isArray(tiers) || tiers.length === 0) return;

  const p =
    typeof state.prestige === "number" ? state.prestige : 0;
  let newTitle =
    state.title || (tiers[0] && tiers[0].title) || "";

  for (const tier of tiers) {
    if (p >= tier.minPrestige) {
      newTitle = tier.title;
    }
  }

  if (state.title !== newTitle) {
    state.title = newTitle;
    addLogEntry(`Tu prestigio crece: ahora eres ${newTitle}.`);
  }
}

function addPrestige(amount) {
  if (!state || !amount) return;
  if (typeof state.prestige !== "number") {
    state.prestige = 0;
  }
  state.prestige = Math.max(0, state.prestige + amount);
  updateTitleFromPrestige();
}

// ===========================
// Sueldos y producción de edificios
// ===========================

export function applyWages(daysPassed) {
  const L = state.labor;
  const wages = state.wages || {};

  const mult = (role) => {
    const tier = wages[role] ?? 1;
    return WAGE_MULTIPLIER[tier] ?? 1.0;
  };

  const costRole = (role, count) => {
    const base = WAGE_BASE[role] ?? 1.0;
    return count * base * mult(role);
  };

  let totalPerDay = 0;
  totalPerDay += costRole("builders", L.builders || 0);
  totalPerDay += costRole("farmers", L.farmers || 0);
  totalPerDay += costRole("miners", L.miners || 0);
  totalPerDay += costRole("lumberjacks", L.lumberjacks || 0);
  totalPerDay += costRole("soldiers", L.soldiers || 0);
  totalPerDay += costRole("servants", L.servants || 0);
  totalPerDay += costRole("clergy", L.clergy || 0);

  const totalCost = totalPerDay * daysPassed;

  const availableGold = state.resources.gold;
  if (availableGold >= totalCost) {
    // Hay oro suficiente: se pagan todos los sueldos sin problema
    state.resources.gold -= totalCost;
  } else {
    // No hay oro suficiente: se paga hasta donde llega y el resto queda impagado
    const deuda = totalCost - availableGold;
    state.resources.gold = 0;

    const stress = Math.min(1, deuda / 100); // escala suave
    adjustRelation("guilds", -0.5 * stress * daysPassed);
    adjustRelation("people", -0.3 * stress * daysPassed);
    adjustRelation("church", -0.2 * stress * daysPassed);

    // Marcamos que hoy no se han podido pagar completamente los sueldos:
    // las obras se pararán.
    if (!state.flags) state.flags = {};
    state.flags.buildersUnpaidToday = true;

    // Si hay obras activas, lo reflejamos en la crónica
    outer: for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
      for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
        const tile = state.tiles[y][x];
        if (tile.underConstruction && tile.buildRemainingDays > 0) {
          addLogEntry(
            "Las obras se detienen: no hay oro suficiente para pagar a los obreros."
          );
          break outer;
        }
      }
    }
  }
}

export function applyBuildingProduction(daysPassed) {
  let farms = 0;
  let quarries = 0;
  let lumberyards = 0;
  let mills = 0;

  for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
      const tile = state.tiles[y][x];
      if (tile.building === "farm") farms++;
      else if (tile.building === "quarry") quarries++;
      else if (tile.building === "lumberyard") lumberyards++;
      else if (tile.building === "mill") mills++;
    }
  }

  // Factor según trabajadores asignados a cada gremio
  const farmers = state.labor.farmers || 0;
  const miners = state.labor.miners || 0;
  const lumberjacks = state.labor.lumberjacks || 0;

  let foodFactor = 0;
  let stoneFactor = 0;
  let woodFactor = 0;

  if (farms > 0) {
    const needed = farms * WORKERS_PER_FARM;
    const eff = Math.min(needed, farmers);
    foodFactor = needed > 0 ? eff / needed : 0;
  }
  if (quarries > 0) {
    const needed = quarries * WORKERS_PER_QUARRY;
    const eff = Math.min(needed, miners);
    stoneFactor = needed > 0 ? eff / needed : 0;
  }
  if (lumberyards > 0) {
    const needed = lumberyards * WORKERS_PER_LUMBERYARD;
    const eff = Math.min(needed, lumberjacks);
    woodFactor = needed > 0 ? eff / needed : 0;
  }

  if (farms > 0) {
    // Bonus de productividad de granjas gracias a molinos:
    // +25% por molino hasta +100% máx.
    let millBonus = 1;
    if (mills > 0) {
      millBonus = 1 + Math.min(mills * 0.25, 1.0);
    }
    state.resources.food +=
      farms *
      FOOD_PER_FARM_PER_DAY *
      foodFactor *
      millBonus *
      daysPassed;
  }
  if (quarries > 0) {
    state.resources.stone +=
      quarries * STONE_PER_QUARRY_PER_DAY * stoneFactor * daysPassed;
  }
  if (lumberyards > 0) {
    let woodGain =
      lumberyards * WOOD_PER_LUMBERYARD_PER_DAY * woodFactor * daysPassed;
    if (state.laws?.forestProtection) {
      woodGain *= 0.6; // talas menos por proteger bosques
    }
    state.resources.wood += woodGain;
  }

  // Talado progresivo de bosque en aserraderos
  for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
      const tile = state.tiles[y][x];
      if (tile.building === "lumberyard" && tile.forestAmount > 0) {
        tile.forestAmount -= 0.01 * daysPassed;
        if (tile.forestAmount <= 0) {
          tile.forestAmount = 0;
          if (tile.terrain === "forest") tile.terrain = "plain";
        }
      }
    }
  }
}

// ===========================
// Construcción por días
// ===========================

export function advanceConstruction(daysPassed) {
  const activeTiles = [];

  for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
      const tile = state.tiles[y][x];
      if (tile.underConstruction && tile.buildRemainingDays > 0) {
        activeTiles.push(tile);
      }
    }
  }

  if (activeTiles.length === 0) return;
  
  // Si hoy no se han podido pagar completamente los sueldos,
  // los obreros se niegan a trabajar y las obras no avanzan.
  if (state.flags?.buildersUnpaidToday) {
    return;
  }

  const totalBuilders = state.labor.builders || 0;
  if (totalBuilders <= 0) return;

  const buildersPerSite = totalBuilders / activeTiles.length;
  const factor = buildersPerSite / BASE_BUILDERS_PER_SITE;
  if (factor <= 0) return;

  activeTiles.forEach((tile) => {
    tile.buildRemainingDays -= daysPassed * factor;
    if (tile.buildRemainingDays <= 0) {
      const finishedKind = tile.underConstruction;
      tile.building = finishedKind;
      tile.underConstruction = null;
      tile.buildRemainingDays = 0;

      // Prestigio por completar ciertos edificios clave
      if (
        finishedKind &&
        PRESTIGE_PER_BUILDING &&
        PRESTIGE_PER_BUILDING[finishedKind]
      ) {
        addPrestige(PRESTIGE_PER_BUILDING[finishedKind]);
      }
    }
  });
}

// ===========================
// Eventos
// ===========================

export function tryTriggerRandomEvent() {
  if (pendingEvent) return;
  if (state.day - lastEventDay < eventCooldownDays) return;

  // Solo eventos cuya condición se cumple
  const candidates = SAMPLE_EVENTS.filter(
    (evt) => !evt.condition || evt.condition(state)
  );
  if (candidates.length === 0) return;

  const chance = 0.5;
  if (Math.random() < chance) {
    const evt =
      candidates[Math.floor(Math.random() * candidates.length)];
    showEvent(evt);
    lastEventDay = state.day;
  }
}

function showEvent(evt) {
  pendingEvent = evt;

  const modal = document.getElementById("event-modal");
  const titleEl = document.getElementById("event-title");
  const textEl = document.getElementById("event-text");
  const choicesEl = document.getElementById("event-choices");
  const imgEl = document.getElementById("event-image");

  if (!modal || !titleEl || !textEl || !choicesEl) return;

  modal.classList.remove("hidden");
  titleEl.textContent = evt.title;
  textEl.textContent = evt.text;
  choicesEl.innerHTML = "";

  // Imagen del evento: debajo del título, a la izquierda del texto
  if (imgEl) {
    const basePath = "img/events";
    const defaultFile = "event_lord_decision.webp";

    // Nombre de archivo “principal”
    const fileName =
      typeof evt.image === "string" && evt.image.length > 0
        ? evt.image
        : `${evt.id}.webp`;

    // Si el evento no define image, usamos <id>.png;
    // si define image: "otro.png", usamos ese nombre.
    // En cualquier caso, si falla la carga, se usa la imagen por defecto.
    let src = `${basePath}/${fileName}`;

    imgEl.style.display = "block";
    imgEl.alt = evt.title || "Evento";

    imgEl.onerror = () => {
      // Si falla la imagen concreta, usamos la de por defecto
      imgEl.onerror = null; // evitar bucles si la de fallo también fallara
      imgEl.src = `${basePath}/${defaultFile}`;
    };

    imgEl.src = src;
  }

  evt.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "event-choice-btn";
    btn.textContent = choice.text;
    btn.addEventListener("click", () => {
      applyChoice(choice);
      closeEventModal();
    });
    choicesEl.appendChild(btn);
  });
}

function applyChoice(choice) {
  // Registrar en la crónica la decisión del evento
  if (typeof addLogEntry === "function" && pendingEvent) {
    const eventTitle = pendingEvent.title || "Evento";
    const choiceText = choice.text || "";
    addLogEntry(`Evento: ${eventTitle} → ${choiceText}`);
  }
  choice.effects(state);
}

function closeEventModal() {
  const modal = document.getElementById("event-modal");
  if (modal) modal.classList.add("hidden");
  pendingEvent = null;
}

// Render isométrico (canvas) movido a render.js

 function computeDefenseScoreHUD(state) {
   const tiles = state.tiles || [];
   let score = 0;

   // Sumar defensa de todos los edificios defensivos usando BUILDING_TYPES
   for (let y = 0; y < tiles.length; y++) {
     const row = tiles[y];
     for (let x = 0; x < row.length; x++) {
       const b = row[x].building;
       if (!b) continue;

       const def = BUILDING_TYPES[b];
       if (!def) continue;

       if (typeof def.defenseScore === "number") {
         score += def.defenseScore;
       }
     }
   }

   // Soldados: fuerza móvil
   const soldiers = state.labor?.soldiers || 0;
   score += soldiers * 2;

   // Patrullas nocturnas: pequeño bonus fijo
   if (state.laws?.nightWatchLaw) {
     score += 4;
   }

   return score;
 }

function updateHUD() {
  const dayEl = document.getElementById("day-display");
  const goldEl = document.getElementById("gold-display");
  const stoneEl = document.getElementById("stone-display");
  const woodEl = document.getElementById("wood-display");
  const foodEl = document.getElementById("food-display");
  const popEl = document.getElementById("pop-display");
  const popSideEl = document.getElementById("pop-display-side");
  const logListEl = document.getElementById("log-list");
  const defEl = document.getElementById("defense-display");
  const titleEl = document.getElementById("title-display");
  const prestigeEl = document.getElementById("prestige-display");

  const relChurchEl = document.getElementById("rel-church");
  const relCrownEl = document.getElementById("rel-crown");
  const relPeopleEl = document.getElementById("rel-people");
  const relGuildsEl = document.getElementById("rel-guilds");

  const laborBuildersEl = document.getElementById("labor-builders");
  const laborFarmersEl = document.getElementById("labor-farmers");
  const laborMinersEl = document.getElementById("labor-miners");
  const laborLumberEl = document.getElementById("labor-lumberjacks");
  const laborUnassignedEl = document.getElementById("labor-unassigned");
  const laborSoldiersEl = document.getElementById("labor-soldiers");
  const laborServantsEl = document.getElementById("labor-servants");
  const laborClergyEl = document.getElementById("labor-clergy");

  if (dayEl) dayEl.textContent = String(state.day);
  if (goldEl) {
    const goldVal = Number(state.resources.gold || 0);
    goldEl.textContent = goldVal.toFixed(2);
  }
  if (stoneEl)
    stoneEl.textContent = Math.floor(state.resources.stone).toString();
  if (woodEl)
    woodEl.textContent = Math.floor(state.resources.wood).toString();
  if (foodEl) foodEl.textContent = Math.floor(state.resources.food).toString();
  const popText = Math.floor(state.resources.population).toString();
  if (popEl) popEl.textContent = popText;
  if (popSideEl) popSideEl.textContent = popText;
  
  if (titleEl) titleEl.textContent = state.title || "";
  if (prestigeEl)
    prestigeEl.textContent = Math.round(
      state.prestige || 0
    ).toString();

  // Defensa: indicador simple basado en murallas, torres, puertas y soldados
  if (defEl) {
    const defScore = computeDefenseScoreHUD(state);
    defEl.textContent = String(defScore);
  }

  if (relChurchEl)
    relChurchEl.textContent = Math.round(state.relations.church).toString();
  if (relCrownEl)
    relCrownEl.textContent = Math.round(state.relations.crown).toString();
  if (relPeopleEl)
    relPeopleEl.textContent = Math.round(state.relations.people).toString();
  if (relGuildsEl)
    relGuildsEl.textContent = Math.round(state.relations.guilds).toString();

  const L = state.labor || {};
  if (laborBuildersEl)
    laborBuildersEl.textContent = String(Math.round(L.builders || 0));
  if (laborFarmersEl)
    laborFarmersEl.textContent = String(Math.round(L.farmers || 0));
  if (laborMinersEl)
    laborMinersEl.textContent = String(Math.round(L.miners || 0));
  if (laborLumberEl)
    laborLumberEl.textContent = String(Math.round(L.lumberjacks || 0));
  if (laborSoldiersEl)
    laborSoldiersEl.textContent = String(Math.round(L.soldiers || 0));
  if (laborServantsEl)
    laborServantsEl.textContent = String(Math.round(L.servants || 0));
  if (laborClergyEl)
    laborClergyEl.textContent = String(Math.round(L.clergy || 0));
  if (laborUnassignedEl)
    laborUnassignedEl.textContent = String(Math.round(L.unassigned || 0));

  // Crónica: mostrar las últimas entradas
  if (logListEl && state.logs) {
    logListEl.innerHTML = "";
    const maxLines = 8;
    for (let i = 0; i < state.logs.length && i < maxLines; i++) {
      const entry = state.logs[i];
      const li = document.createElement("li");
      li.textContent = entry.text;
      logListEl.appendChild(li);
    }
  }

// Sincronizar botones de sueldo con el estado (por si los cambia un evento)
  const wages = state.wages || {};
  document.querySelectorAll(".wage-btn").forEach((btn) => {
    const role = btn.dataset.role;
    const tier = Number(btn.dataset.wage || "1");
    if (!role || Number.isNaN(tier)) return;
    if (wages[role] === tier) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  // Sincronizar botones de leyes con el estado
  const laws = state.laws || {};
  document.querySelectorAll(".law-btn").forEach((btn) => {
    const lawKey = btn.dataset.law;
    const val =
      Number(btn.dataset.value || "0") === 1;
    if (!lawKey) return;
    if ((laws[lawKey] ?? false) === val) btn.classList.add("active");
    else btn.classList.remove("active");
  });

  // Sincronizar botones de impuestos con el estado (por si los cambia un evento)
  const currentTax = typeof state.taxRate === "number" ? state.taxRate : 1;
  document.querySelectorAll(".tax-btn").forEach((btn) => {
    const taxStr = btn.dataset.tax || "1";
    const level = Number(taxStr);
    if (Number.isNaN(level)) return;
    if (level === currentTax) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

// ===========================
// Loop principal
// ===========================

function gameLoop(timestamp) {
  const dtMs = lastTimestamp ? timestamp - lastTimestamp : 0;
  lastTimestamp = timestamp;

  const dtSeconds = dtMs / 1000;
  updateSimulation(state, dtSeconds);
  render(state, ctx, canvas, originX, originY);
  updateHUD();

  requestAnimationFrame(gameLoop);
}

// ===========================
// Canvas
// ===========================

function resizeCanvas() {
  if (!canvas) return;

  // Usamos el contenedor padre para calcular el espacio disponible
  const wrapper = canvasWrapper || document.getElementById("canvas-wrapper");
  const rect = (wrapper || canvas).getBoundingClientRect();

  // Ajustamos tamaño REAL del canvas (no solo el CSS)
  canvas.width = rect.width;
  canvas.height = rect.height;

  // Recentramos la cámara con el nuevo tamaño
  originX = canvas.width / 2;
  // Offset vertical razonable para ver bien el mapa
  originY = 80;
}

// ===========================
// Inicio
// ===========================

function init() {
  canvas = document.getElementById("gameCanvas");
  if (!canvas) throw new Error("No se encontró el canvas #gameCanvas");
  canvasWrapper = document.getElementById("canvas-wrapper");
  
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo obtener 2D context");
  ctx = context;

  // Cargar sprites de terreno (variaciones de llano/bosque/roca/agua)
  loadTerrainSprites();  
  
  // Cargar sprites de edificios (si hay definidos en config)
  loadBuildingSprites();

  state = createInitialState();
  // Aseguramos que el título inicial coincide con la tabla de prestigio
  updateTitleFromPrestige();
  
  // Ajustar el canvas al espacio disponible y reaccionar a cambios de ventana
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  setupUIBindings(
    () => state,
    {
    addLogEntry,
    exportGameToFile,
    applyLoadedPayload,
    saveGame,
    loadGame
    }
  );
  
  setupPanelGroups();
  setupCanvasInteractions();
  setupCameraControls();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("load", init);