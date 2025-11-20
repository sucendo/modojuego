// main.js
import {
  GAME_CONFIG,
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
  TITLE_TIERS,
  PRESTIGE_PER_BUILDING,
  MILITARY_RULES,
  RENDER_CONFIG,
  TAX_MULTIPLIER_UI
} from "./config.js";
import { SAMPLE_EVENTS } from "./events.js";

// ===========================
// Constantes de render isométrico
// ===========================

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

// ===========================
// Terreno inicial
// ===========================

function randomTerrain() {
  const r = Math.random();
  if (r < 0.15) return "rock";    // roca
  if (r < 0.45) return "forest";  // bosque
  return "plain";                 // llano
}

// ===========================
// Población / labor
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

// Calcula el mínimo de soldados recomendado según población
// y defensas construidas (torres y tramos de muralla).
function computeMinSoldiers(state) {
  const pop = state.resources.population;
  if (pop < 30) return 0; // por debajo de 30 habitantes no exigimos guarnición mínima

  let towers = 0;
  let walls = 0;

  for (let y = 0; y < state.tiles.length; y++) {
    for (let x = 0; x < state.tiles[y].length; x++) {
      const b = state.tiles[y][x].building;
      if (b === "tower") towers++;
      else if (b === "wall") walls++;
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
function rebalanceLabor(state) {
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

function createInitialState() {
  const population = STARTING_RESOURCES.population;
  const labor = createInitialLabor(population);

  return {
    timeSeconds: 0,
    day: 1,
    speedMultiplier: 1,
    resources: { ...STARTING_RESOURCES },
    tiles: createInitialTiles(),
    selectedBuilding: "wall",
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

// ===========================
// Crónica: helper genérico
// ===========================
function addLogEntry(text) {
  if (!state) return;
  if (!state.logs) state.logs = [];
  state.logs.unshift({ day: state.day, text });
  if (state.logs.length > 40) {
    state.logs.length = 40;
  }
}


// ===========================
// Tooltips de UI
// ===========================

function setupBuildingTooltips() {
  const resLabels = {
    gold: "oro",
    stone: "piedra",
    wood: "madera",
    food: "comida"
  };

  document.querySelectorAll(".build-btn").forEach((btn) => {
    const id = btn.dataset.building;
    const def = BUILDING_TYPES[id];
    if (!def) return;

    const cost = def.cost || {};
    const parts = [];
    for (const key in cost) {
      if (!Object.prototype.hasOwnProperty.call(cost, key)) continue;
      const amount = cost[key];
      if (!amount) continue;
      const name = resLabels[key] || key;
      parts.push(`${amount} ${name}`);
    }

    let title = "";
    if (parts.length) {
      title = `Coste: ${parts.join(", ")}`;
    } else {
      title = "Coste: sin recursos directos.";
    }

    if (def.buildTimeDays) {
      title += ` · ${def.buildTimeDays} día${
        def.buildTimeDays > 1 ? "s" : ""
      } de obra.`;
    }

    btn.title = title;
    btn.dataset.tooltip = title;
  });
}

function setupWageTooltips() {
  const roleLabels = {
    builders: "Constructores",
    farmers: "Granjeros",
    miners: "Canteros",
    lumberjacks: "Leñadores",
    soldiers: "Soldados",
    servants: "Administración / Servicio",
    clergy: "Clero"
  };

  document.querySelectorAll(".wage-btn").forEach((btn) => {
    const role = btn.dataset.role;
    const wageStr = btn.dataset.wage || "1";
    const tier = Number(wageStr);
    if (!role || Number.isNaN(tier)) return;

    const base = WAGE_BASE[role];
    if (typeof base !== "number") return;

    const mult = WAGE_MULTIPLIER[tier] ?? 1;
    const goldPerDay = base * mult;

    const roleName = roleLabels[role] || role;
    const tierLabels = { 0: "bajo", 1: "normal", 2: "alto" };
    const tierName = tierLabels[tier] ?? tier;

    btn.dataset.tooltip = `${roleName} · sueldo ${tierName}: ${goldPerDay.toFixed(
      2
    )} oro/día por trabajador.`;
  });
}

function setupTaxTooltips() {
  const levelLabels = {
    0: "Impuestos bajos",
    1: "Impuestos normales",
    2: "Impuestos altos"
  };

  document.querySelectorAll(".tax-btn").forEach((btn) => {
    const taxStr = btn.dataset.tax || "1";
    const level = Number(taxStr);
    if (Number.isNaN(level)) return;

    const label = levelLabels[level] || "Impuestos";
    const mult = TAX_MULTIPLIER_UI[level] ?? 1.0;
    const perHabitant = BASE_TAX_PER_PERSON * mult;

    btn.dataset.tooltip = `${label}: ~${(mult * 100).toFixed(
      0
    )}% de la tasa base. Recaudación media: ${perHabitant.toFixed(
      2
    )} oro/día por habitante.`;
  });
}

let tooltipEl = null;
let currentTooltipTarget = null;

function setupGlobalTooltip() {
  tooltipEl = document.getElementById("ui-tooltip");
  if (!tooltipEl) return;

  // Mostrar tooltip cuando el ratón entra en algo con data-tooltip
  document.addEventListener("mouseover", (ev) => {
    const target = ev.target.closest("[data-tooltip]");
    if (!target) {
      hideTooltip();
      return;
    }
    currentTooltipTarget = target;
    showTooltipAt(target.dataset.tooltip || "", ev.clientX, ev.clientY);
  });

  // Mover tooltip cuando se mueve el ratón
  document.addEventListener("mousemove", (ev) => {
    if (!currentTooltipTarget || !tooltipEl) return;
    if (!currentTooltipTarget.dataset.tooltip) return;
    positionTooltip(ev.clientX, ev.clientY);
  });

  // Ocultar cuando el ratón sale de un elemento con tooltip
  document.addEventListener("mouseout", (ev) => {
    const related = ev.relatedTarget;
    // Si salimos de un elemento con tooltip y no entramos en otro con tooltip
    if (
      currentTooltipTarget &&
      !related?.closest?.("[data-tooltip]")
    ) {
      hideTooltip();
      currentTooltipTarget = null;
    }
  });
}

function showTooltipAt(text, x, y) {
  if (!tooltipEl) return;
  tooltipEl.textContent = text;
  positionTooltip(x, y);
  tooltipEl.style.opacity = "1";
}

function positionTooltip(x, y) {
  if (!tooltipEl) return;
  const offsetX = 16;
  const offsetY = -16;
  tooltipEl.style.left = `${x + offsetX}px`;
  tooltipEl.style.top = `${y + offsetY}px`;
}

function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.style.opacity = "0";
}

// ===================
// Salvar y Cargar Partida
// ===================

function saveGame() {
  try {
    const payload = {
      version: 1,
      state,
      originX,
      originY,
      lastEventDay,
      eventCooldownDays,
      // guardamos también el nombre del jugador si existe
      playerName: state.playerName || localStorage.getItem("castles_player_name") || ""
    };
    localStorage.setItem("castles_save", JSON.stringify(payload));
    console.log("Partida guardada");
  } catch (err) {
    console.error("Error al guardar la partida:", err);
  }
}

// Exportar la partida a un archivo JSON
function exportGameToFile() {
  try {
    const payload = {
      version: 1,
      state,
      originX,
      originY,
      lastEventDay,
      eventCooldownDays,
      playerName: state.playerName || localStorage.getItem("castles_player_name") || ""
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const baseName =
      (state.playerName || localStorage.getItem("castles_player_name") || "partida")
        .trim()
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

// Aplica un payload cargado (tanto desde localStorage como desde archivo)
function applyLoadedPayload(payload) {
  if (!payload || !payload.state) {
    console.warn("Guardado inválido.");
    return;
  }

  // Restaurar estado
  state = payload.state;

  // Asegurar que existe un nivel de impuestos válido
  if (typeof state.taxRate !== "number") {
    state.taxRate = 1; // normales por defecto
  }

  // ───────────────────────────────────────────────
  // Migración de partidas antiguas (sin prestigio/título)
  // ───────────────────────────────────────────────

  // Si no hay prestigio numérico, lo estimamos a partir de los edificios construidos
  if (typeof state.prestige !== "number") {
    let estimated = 0;
    if (state.tiles && PRESTIGE_PER_BUILDING) {
      for (let y = 0; y < state.tiles.length; y++) {
        const row = state.tiles[y];
        for (let x = 0; x < row.length; x++) {
          const b = row[x].building;
          if (b && PRESTIGE_PER_BUILDING[b]) {
            estimated += PRESTIGE_PER_BUILDING[b];
          }
        }
      }
    }
    state.prestige = estimated;
  }

  // Si no hay título, ponemos uno por defecto y lo ajustamos según prestigio
  if (!state.title) {
    state.title = "Señor de la fortaleza";
  }

  // Aseguramos que el título coincide con el prestigio actual
  updateTitleFromPrestige();

  if (typeof payload.originX === "number") originX = payload.originX;
  if (typeof payload.originY === "number") originY = payload.originY;
  if (typeof payload.lastEventDay === "number") lastEventDay = payload.lastEventDay;
  if (typeof payload.eventCooldownDays === "number")
    eventCooldownDays = payload.eventCooldownDays;

 // Nombre de jugador (opcional)
  if (typeof payload.playerName === "string") {
    state.playerName = payload.playerName;
    try {
      localStorage.setItem("castles_player_name", payload.playerName);
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

  console.log("Partida cargada");
}

function loadGame() {
  try {
    const raw = localStorage.getItem("castles_save");
    if (!raw) {
      console.warn("No hay partida guardada.");
      return;
    }
    const payload = JSON.parse(raw);
    applyLoadedPayload(payload);
  } catch (err) {
    console.error("Error al cargar la partida:", err);
  }
}

// ===========================
// UI bindings
// ===========================

function setupUIBindings() {
  // Tooltips informativos de la UI
  setupBuildingTooltips();
  setupWageTooltips();
  setupTaxTooltips();
  setupGlobalTooltip();

  // Velocidad
  document.querySelectorAll(".speed-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".speed-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const speedStr = btn.dataset.speed || "1";
      const speed = Number(speedStr);
      state.speedMultiplier = speed;
    });
  });

  // Construcción
  document.querySelectorAll(".build-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".build-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const buildingId = btn.dataset.building;
      if (buildingId) {
        state.selectedBuilding = buildingId;
      }
    });
  });

  // Impuestos
  document.querySelectorAll(".tax-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tax-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const taxStr = btn.dataset.tax || "1";
      const tax = Number(taxStr);
      state.taxRate = tax;

      if (typeof addLogEntry === "function") {
        const labels = { 0: "bajos", 1: "normales", 2: "altos" };
        const label = labels[tax] ?? String(tax);
        addLogEntry(`Impuestos ajustados a nivel ${label}.`);
      }
    });
  });

// Menú de jugador / partida (escudo redondo)
  const playerMenuButton = document.getElementById("player-menu-button");
  const playerMenuDropdown = document.getElementById("player-menu-dropdown");
  const playerNameInput = document.getElementById("player-name-input");
  const exportBtn = document.getElementById("export-btn");
  const importInput = document.getElementById("import-input");

  // Inicializar nombre del jugador directamente en el input
  if (playerNameInput) {
    let initialName =
      state.playerName || localStorage.getItem("castles_player_name") || "";
    state.playerName = initialName;
    playerNameInput.value = initialName;

    const commitName = () => {
      const value = playerNameInput.value.trim();
      const finalName = value || "";
      state.playerName = finalName;
      try {
        localStorage.setItem("castles_player_name", finalName);
      } catch (_err) {
        // ignoramos errores de quota
      }
    };

    playerNameInput.addEventListener("change", commitName);
    playerNameInput.addEventListener("blur", commitName);
    playerNameInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        commitName();
        playerNameInput.blur();
      }
    });
  }

  if (playerMenuButton && playerMenuDropdown) {
    playerMenuButton.addEventListener("click", (ev) => {
      ev.stopPropagation();
      playerMenuDropdown.classList.toggle("open");
    });

    // Cerrar el menú al hacer click fuera
    document.addEventListener("click", (ev) => {
      if (!playerMenuDropdown.classList.contains("open")) return;
      const target = ev.target;
      if (!(target && target.closest && target.closest("#player-menu"))) {
        playerMenuDropdown.classList.remove("open");
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportGameToFile();
    });
  }

  if (importInput) {
    importInput.addEventListener("change", () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || "");
          const payload = JSON.parse(text);
          applyLoadedPayload(payload);

          // Actualizamos también el guardado local para que funcione "Cargar"
          try {
            localStorage.setItem("castles_save", text);
          } catch (_err) {
            // ignoramos errores de quota
          }
        } catch (err) {
          console.error("Error al importar la partida:", err);
          alert("No se ha podido importar la partida (archivo no válido).");
        } finally {
          importInput.value = "";
        }
      };
      reader.readAsText(file);
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportGameToFile();
    });
  }

  if (importInput) {
    importInput.addEventListener("change", () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || "");
          const payload = JSON.parse(text);
          applyLoadedPayload(payload);

          // Actualizamos también el guardado local para que funcione "Cargar"
          try {
            localStorage.setItem("castles_save", text);
          } catch (_err) {
            // ignoramos errores de quota
          }
        } catch (err) {
          console.error("Error al importar la partida:", err);
          alert("No se ha podido importar la partida (archivo no válido).");
        } finally {
          importInput.value = "";
        }
      };
      reader.readAsText(file);
    });
  }

  // Guardar / cargar partida (botones dentro del menú)
  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveGame();
    });
  }

  const loadBtn = document.getElementById("load-btn");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      loadGame();
    });
  }

  // Overlay de crónica: minimizar / maximizar
  const logToggleBtn = document.getElementById("log-toggle");
  const logBodyEl = document.getElementById("log-body");
  let logCollapsed = false;

  if (logToggleBtn && logBodyEl) {
    logToggleBtn.addEventListener("click", () => {
      logCollapsed = !logCollapsed;
      if (logCollapsed) {
        logBodyEl.style.display = "none";
        logToggleBtn.textContent = "+";
      } else {
        logBodyEl.style.display = "";
        logToggleBtn.textContent = "–";
      }
    });
  }

  // Sueldos por gremio
  document.querySelectorAll(".wage-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role;
      const wageStr = btn.dataset.wage || "1";
      const wageTier = Number(wageStr);
      if (!role || Number.isNaN(wageTier)) return;

      if (!state.wages) state.wages = {};
      state.wages[role] = wageTier;

      const row = btn.closest(".wage-row");
      if (row) {
        row.querySelectorAll(".wage-btn").forEach((b) =>
          b.classList.remove("active")
        );
      }
      btn.classList.add("active");

     if (typeof addLogEntry === "function") {
       const roleLabels = {
         builders: "Constructores",
         farmers: "Granjeros",
         miners: "Canteros",
         lumberjacks: "Leñadores",
         soldiers: "Soldados",
         servants: "Administración / Servicio",
         clergy: "Clero"
       };
       const tierLabels = { 0: "bajo", 1: "normal", 2: "alto" };
       const rName = roleLabels[role] || role;
       const tName = tierLabels[wageTier] ?? String(wageTier);
       addLogEntry(`Sueldo de ${rName} ajustado a nivel ${tName}.`);
     }
    });
  });

  // Leyes
  document.querySelectorAll(".law-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lawKey = btn.dataset.law;
      const valueStr = btn.dataset.value || "0";
      const value = Number(valueStr) === 1;
      if (!lawKey) return;

      if (!state.laws) state.laws = {};
      state.laws[lawKey] = value;

      const row = btn.closest(".law-row");
      if (row) {
        row.querySelectorAll(".law-btn").forEach((b) =>
          b.classList.remove("active")
        );
      }
      btn.classList.add("active");

     if (typeof addLogEntry === "function") {
       const lawLabels = {
         corveeLabor: "Trabajo obligatorio en las obras",
         forestProtection: "Protección de bosques comunales",
         millTax: "Tasa obligatoria del molino",
         censusLaw: "Censo y registros oficiales",
         grainPriceControl: "Control de precios del grano"
       };
       const name = lawLabels[lawKey] || lawKey;
       const status = value ? "activada" : "desactivada";
       addLogEntry(`Ley "${name}" ${status}.`);
     }
    });
  });
}
  
 // ================
// Activar el acordeón Menú
// ================
  
function setupPanelGroups() {
  const groups = document.querySelectorAll("#left-panel .panel-group");
  groups.forEach((group, index) => {
    const header = group.querySelector(".panel-header");
    if (!header) return;

    // Por defecto: solo el primero abierto
    if (index > 0) {
      group.classList.add("collapsed");
    }

    header.addEventListener("click", () => {
      group.classList.toggle("collapsed");
    });
  });
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

  const tile = state.tiles[tileY][tileX];

  const b = state.selectedBuilding;

  // Modo demolición: eliminar edificios u obras en la loseta
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

  if (tile.building || tile.underConstruction) {
    return;
  }

  const def = BUILDING_TYPES[b];
  if (!def) return;

  // Restricciones de terreno
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

  if (!hasResourcesFor(def.cost)) {
    console.log("Recursos insuficientes para construir", def.name);
    return;
  }

  // Si construimos muralla/torre/puerta en bosque, despejamos el bosque
  if ((b === "wall" || b === "tower" || b === "gate") && tile.terrain === "forest") {
    tile.terrain = "plain";
    tile.forestAmount = 0;
  }

  payCost(def.cost);
  tile.underConstruction = b;
  tile.buildRemainingDays = def.buildTimeDays;
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

// ===========================
// Recursos helpers
// ===========================

function hasResourcesFor(cost) {
  for (const key in cost) {
    const value = cost[key];
    if (typeof value !== "number") continue;
    if (state.resources[key] < value) {
      return false;
    }
  }
  return true;
}

function payCost(cost) {
  for (const key in cost) {
    const value = cost[key];
    if (typeof value !== "number") continue;
    state.resources[key] -= value;
  }
}

// ===========================
// Conversión isométrica
// ===========================

function isoToScreen(tileX, tileY) {
  const sx = originX + (tileX - tileY) * (TILE_WIDTH / 2);
  const sy = originY + (tileX + tileY) * (TILE_HEIGHT / 2);
  return [sx, sy];
}

function screenToIsoTile(screenX, screenY) {
  const dx = screenX - originX;
  const dy = screenY - originY;

  const tileXFloat = dx / TILE_WIDTH + dy / TILE_HEIGHT;
  const tileYFloat = dy / TILE_HEIGHT - dx / TILE_WIDTH;

  const tileX = Math.floor(tileXFloat);
  const tileY = Math.floor(tileYFloat);
  return [tileX, tileY];
}

// ===========================
// Tiempo / días
// ===========================

function update(dtSeconds) {
  const speed = state.speedMultiplier;
  if (speed <= 0) return;

  const scaledDt = dtSeconds * speed;
  state.timeSeconds += scaledDt;

  const newDay =
    Math.floor(state.timeSeconds / GAME_CONFIG.secondsPerDay) + 1;
  if (newDay !== state.day) {
    const daysPassed = newDay - state.day;
    state.day = newDay;
    onNewDay(daysPassed);
  }
}

function formatDelta(value) {
  const v = Math.round(value);
  if (v > 0) return `+${v}`;
  if (v < 0) return `${v}`;
  return "±0";
}

function onNewDay(daysPassed) {
  // 0) Snapshot para el resumen del día
  const prevGold = state.resources.gold;
  const prevFood = state.resources.food;
  const prevStone = state.resources.stone;
  const prevWood = state.resources.wood;
  const prevPop = state.resources.population;
  const prevPeopleRel = state.relations.people;

  // 1) Rebalanceo de población activa según “vacantes”
  rebalanceLabor(state);

	// 2) Impuestos
	const baseTaxPerPerson = BASE_TAX_PER_PERSON;
	let taxMultiplier;
	if (state.taxRate === 0) taxMultiplier = 0.5;
	else if (state.taxRate === 2) taxMultiplier = 1.7;
	else taxMultiplier = 1.0;

	// Ajustes por leyes económicas / comerciales
	let lawTaxMultiplier = 1.0;

	// Censo: mejor control fiscal → algo más de ingresos
	if (state.laws?.censusLaw) {
	  lawTaxMultiplier *= 1.15; // +15% impuestos
	}

	// Control de precios del grano: menos margen → algo menos de ingresos
	if (state.laws?.grainPriceControl) {
	  lawTaxMultiplier *= 0.9; // −10% impuestos
	}

	// Mercado semanal: más actividad → algo más de ingresos
	if (state.laws?.weeklyMarketLaw) {
	  lawTaxMultiplier *= 1.1; // +10% impuestos
	}

	const taxIncome =
	  state.resources.population *
	  baseTaxPerPerson *
	  taxMultiplier *
	  lawTaxMultiplier *
	  daysPassed;
	state.resources.gold += taxIncome;

	  if (state.taxRate === 0) {
		adjustRelation("people", +0.5 * daysPassed);
		adjustRelation("crown", -0.3 * daysPassed);
	  } else if (state.taxRate === 2) {
		adjustRelation("people", -0.7 * daysPassed);
		adjustRelation("crown", +0.5 * daysPassed);
	  }

  // 3) Sueldos: pagar salarios de los gremios clave
  if (!state.flags) state.flags = {};
  // Por defecto asumimos que se han podido pagar; si no, lo marcará applyWages
  state.flags.buildersUnpaidToday = false;
  applyWages(daysPassed);

  // 4) Producción de edificios según gremios
  applyBuildingProduction(daysPassed);

	// 5) Efectos continuos de las leyes
	if (state.laws?.corveeLabor) {
	  adjustRelation("people", -0.2 * daysPassed);
	  adjustRelation("guilds", -0.15 * daysPassed);
	}
	if (state.laws?.forestProtection) {
	  adjustRelation("people", 0.1 * daysPassed);
	  adjustRelation("church", 0.1 * daysPassed);
	}
	// Censo y registros: la Corona contenta, el pueblo recela
	if (state.laws?.censusLaw) {
	  adjustRelation("crown", 0.05 * daysPassed);
	  adjustRelation("people", -0.05 * daysPassed);
	}
	// Control de precios del grano: el pueblo agradece, los gremios gruñen
	if (state.laws?.grainPriceControl) {
	  adjustRelation("people", 0.08 * daysPassed);
	  adjustRelation("guilds", -0.06 * daysPassed);
	}
	// Patrullas nocturnas: algo menos de malestar acumulado
	if (state.laws?.nightWatchLaw) {
	  if (typeof state.unrest === "number" && state.unrest > 0) {
		state.unrest = Math.max(0, state.unrest - 0.5 * daysPassed);
	  }
	}
	// Mercado semanal: más vida comercial, pero algo de tensión si ya hay malestar
	if (state.laws?.weeklyMarketLaw) {
	  adjustRelation("guilds", 0.05 * daysPassed);
	  if (typeof state.unrest === "number" && state.unrest > 20) {
		state.unrest = Math.min(100, state.unrest + 0.2 * daysPassed);
	  }
	}
	
	  // Efectos continuos de estructuras especiales (p.ej. monasterio)
	  if (state.structures?.monastery) {
		// Los monjes refuerzan la influencia de la Iglesia y algo el ánimo del pueblo
		adjustRelation("church", 0.08 * daysPassed);
		adjustRelation("people", 0.02 * daysPassed);

		// Ayuda a reducir un poco el malestar si lo hay
		if (typeof state.unrest === "number" && state.unrest > 0) {
		  state.unrest = Math.max(0, state.unrest - 0.3 * daysPassed);
		}

		// Pequeño coste de mantenimiento en comida
		state.resources.food = Math.max(
		  0,
		  state.resources.food - 1 * daysPassed
		);
	  }

  // 6) Tasa del molino: si es obligatoria y hay molinos,
  // cada ciudadano paga una pequeña tasa → más oro pero más descontento.
  if (state.laws?.millTax) {
    let mills = 0;
    for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
      for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
        const tile = state.tiles[y][x];
        if (tile.building === "mill") mills++;
      }
    }

	if (mills > 0 && state.resources.population > 0) {
	  const tollPerPerson = 0.12; // oro por persona y día
	  const tollIncome =
		state.resources.population * tollPerPerson * daysPassed;

	  state.resources.gold += tollIncome;

	  // Cuantos más molinos y más días, más enfado
	  const anger = 0.12 * mills * daysPassed;
	  adjustRelation("people", -anger);
	}
  }

  // 7) Consumo de comida
  const foodPerPerson = FOOD_PER_PERSON_PER_DAY;
  state.resources.food -=
    state.resources.population * foodPerPerson * daysPassed;

  if (state.resources.food < 0) {
    state.resources.food = 0;
    state.resources.population = Math.max(
      0,
      state.resources.population - daysPassed
    );

    // Con control de precios del grano, el pueblo percibe cierto esfuerzo
    // y el enfado es algo menor.
    const hungerPenalty =
      state.laws?.grainPriceControl ? 0.6 : 1.0;
    adjustRelation("people", -hungerPenalty * daysPassed);
  }

  // 8) Malestar y emigración si el pueblo está muy descontento
  if (state.relations.people < 20 && state.resources.population > 0) {
    const anger = 20 - state.relations.people; // 1..20
    const baseLeave =
      state.resources.population * 0.02 * daysPassed; // ~2% base por día
    const leave = Math.max(
      1,
      Math.floor(baseLeave * (1 + anger / 20))
    );

    state.resources.population = Math.max(
      0,
      state.resources.population - leave
    );

    if (typeof state.unrest !== "number") state.unrest = 0;
    state.unrest = Math.min(100, state.unrest + 2 * daysPassed);

    addLogEntry(
      `El malestar del pueblo provoca la marcha de ${leave} habitantes.`
    );
  } else {
    if (typeof state.unrest !== "number") state.unrest = 0;
    // Si el pueblo está al menos templado, el malestar se enfría poco a poco
    if (state.relations.people >= 40) {
      state.unrest = Math.max(0, state.unrest - 1 * daysPassed);
    }
  }

  // 9) Crecimiento natural de la población si hay abundancia y satisfacción
  // Cada 30 días: si el pueblo está contento y hay comida de sobra,
  // entran nuevas familias al castillo.
  if (state.day % 30 === 0 && state.resources.population > 0) {
    const pop = state.resources.population;
    // Consideramos que "abunda" si tras comer tenemos reservas
    // para ~10 días más.
    const minReserve = pop * foodPerPerson * 10;
    if (
      state.resources.food > minReserve &&
      state.relations.people >= 60
    ) {
      const gained = Math.max(1, Math.floor(pop / 20));
      state.resources.population += gained;
      addLogEntry(
        `La prosperidad del castillo atrae a nuevas familias: +${gained} habitantes.`
      );
    }
  }

  // 10) Guarnición mínima: a partir de 30 habitantes
  // y según defensas construidas (torres y murallas) se espera
  // un mínimo de soldados en guarnición.
  {
    const pop = state.resources.population;
    const soldiers = state.labor.soldiers || 0;
    const required = computeMinSoldiers(state);
    if (required > 0 && soldiers < required) {
      const ratio = soldiers / required; // 0..1
      // Cuanto más por debajo del mínimo, más empeoran las relaciones
      const penaltyFactor = 1 - ratio;
      adjustRelation("crown", -0.5 * penaltyFactor * daysPassed);
      adjustRelation("people", -0.2 * penaltyFactor * daysPassed);

      addLogEntry(
        `La guarnición es insuficiente: ${soldiers}/${required} soldados para ${Math.round(
          pop
        )} habitantes. El castillo parece vulnerable.`
      );
    }
  }
  
  // 11) Fin de rebajas temporales de impuestos (si las hay)
  if (state.flags?.tempTaxReliefActive) {
    const flags = state.flags;
    flags.tempTaxReliefDays = (flags.tempTaxReliefDays || 0) - daysPassed;
    if (flags.tempTaxReliefDays <= 0) {
      const prevRate = flags.tempTaxPrevRate;
      if (typeof prevRate === "number") {
        state.taxRate = prevRate;
      }
      flags.tempTaxReliefActive = false;
      flags.tempTaxReliefDays = 0;
      if (typeof addLogEntry === "function") {
        addLogEntry(
          "La reducción excepcional de impuestos llega a su fin. Los gravámenes vuelven a su nivel anterior."
        );
      }
    }
  }

  // 12) Influencia diaria del clérigo según sueldo
  {
    const wages = state.wages || {};
    const clergyWage = wages.clergy ?? 1;
    const clergyCount = state.labor.clergy || 0;
    const hasCleric = state.flags?.hasCleric;

    // Consideramos “clérigo oficial” solo si lo hemos aceptado por evento
    // y hay al menos 1 persona en el gremio del clero.
    if (hasCleric && clergyCount > 0) {
      if (clergyWage === 0) {
        // Sueldo bajo: sermones contra el señor
        adjustRelation("people", -0.3 * daysPassed);
        adjustRelation("church", -0.2 * daysPassed);

        if (typeof state.unrest !== "number") state.unrest = 0;
        state.unrest = Math.min(100, state.unrest + 0.5 * daysPassed);

        if (Math.random() < 0.1 * daysPassed) {
          addLogEntry(
            "El clérigo se queja en sus sermones de la mezquindad del señor; el pueblo murmura."
          );
        }
      } else if (clergyWage === 1) {
        // Sueldo normal: estabilidad suave
        adjustRelation("church", 0.05 * daysPassed);

        if (typeof state.unrest !== "number") state.unrest = 0;
        if (state.unrest > 0) {
          state.unrest = Math.max(0, state.unrest - 0.2 * daysPassed);
        }
      } else if (clergyWage === 2) {
        // Sueldo alto: predica lealtad y caridad
        adjustRelation("church", 0.15 * daysPassed);
        adjustRelation("people", 0.1 * daysPassed);

        if (typeof state.unrest !== "number") state.unrest = 0;
        if (state.unrest > 0) {
          state.unrest = Math.max(0, state.unrest - 0.5 * daysPassed);
        }

        if (Math.random() < 0.08 * daysPassed) {
          addLogEntry(
            "El clérigo elogia la generosidad del señor y apacigua los ánimos en la villa."
          );
        }
      }
    }
  }

  // 13) Resumen del día para la crónica
  const dGold = state.resources.gold - prevGold;
  const dFood = state.resources.food - prevFood;
  const dStone = state.resources.stone - prevStone;
  const dWood = state.resources.wood - prevWood;
  const dPop = state.resources.population - prevPop;
  const dPeople = state.relations.people - prevPeopleRel;

  addLogEntry(
    `Día ${state.day}: Oro ${formatDelta(dGold)}, Comida ${formatDelta(
      dFood
    )}, Piedra ${formatDelta(dStone)}, Madera ${formatDelta(
      dWood
    )}, Población ${formatDelta(dPop)}, Pueblo ${formatDelta(dPeople)}`
  );

  // 14) Avance de obras (usa constructores)
  advanceConstruction(daysPassed);

  // 15) Eventos
  tryTriggerRandomEvent();
}

// ===========================
// Relaciones
// ===========================

function adjustRelation(key, delta) {
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

function applyWages(daysPassed) {
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

function applyBuildingProduction(daysPassed) {
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

function advanceConstruction(daysPassed) {
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

function tryTriggerRandomEvent() {
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

// ===========================
// Render
// ===========================

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Terreno
  ctx.save();
  for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
      const tile = state.tiles[y][x];
      const [sx, sy] = isoToScreen(x, y);
      drawTerrainTile(sx, sy, tile.terrain);
    }
  }
  ctx.restore();

  // Edificios / obras
  for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
      const tile = state.tiles[y][x];
      const [sx, sy] = isoToScreen(x, y);

      if (tile.underConstruction) {
        const def = BUILDING_TYPES[tile.underConstruction];
        if (!def) continue;
        const totalDays = def.buildTimeDays || 1;
        const remaining = tile.buildRemainingDays;
        const progress = Math.max(0, Math.min(1, 1 - remaining / totalDays));
        drawBuilding(tile.underConstruction, sx, sy, {
          finished: false,
          progress
        });
      }

      if (tile.building) {
        drawBuilding(tile.building, sx, sy, {
          finished: true,
          progress: 1
        });
      }
    }
  }

  updateHUD();
}

function drawTerrainTile(sx, sy, terrain) {
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;

  let color;
  if (terrain === "forest") {
    color = "#1f3a22";
  } else if (terrain === "rock") {
    color = "#3a3a46";
  } else if (terrain === "water") {
    color = "#1f4b82"; 
  } else {
    color = "#2e3a1f"; //"#808b2a";
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
}

/**
 * Dibuja un edificio:
 * - En construcción: base rellena, paredes/tapa solo contorno.
 * - Terminado: bloque isométrico sólido.
 */
function drawBuilding(kind, sx, sy, options) {
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;
  const finished = options.finished;
  const progress = options.progress ?? 1;

  // Altura según tipo
  let heightPx;
  if (kind === "wall") heightPx = 18;
  else if (kind === "tower") heightPx = 34;
  else if (kind === "gate") heightPx = 20;
  else if (kind === "farm") heightPx = 10;
  else if (kind === "quarry") heightPx = 16;
  else if (kind === "lumberyard") heightPx = 14;
  else if (kind === "bridge") heightPx = 5;
  else if (kind === "mill") heightPx = 18;
  else if (kind === "road") heightPx = 2;
  else heightPx = 18;

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

  if (kind === "wall") {
    baseColor = "#7b7b8c";
    topColor = "#8a8aa0";
    rightColor = "#b3b3c8";
    leftColor = "#5b5b70";
  } else if (kind === "tower") {
    baseColor = "#8e7b4a";
    topColor = "#a7894f";
    rightColor = "#caa25f";
    leftColor = "#6c4e2a";
  } else if (kind === "gate") {
    baseColor = "#74634a";
    topColor = "#8c7653";
    rightColor = "#b0925d";
    leftColor = "#58442c";
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
    rightColor = "#9b774c";
    leftColor = "#3e2f22";
  } else if (kind === "bridge") {
    // Puente de madera sobre el agua
    baseColor = "#5b4932";
    topColor = "#7a5c3a";
    rightColor = "#9b7a4c";
    leftColor = "#443426";
  } else if (kind === "mill") {
    // Molino: tonos más rojizos / estilo teja
    baseColor = "#8b4c3f";   // muro rojizo
    topColor = "#a75a47";    // parte superior más clara
    rightColor = "#c96d54";  // cara iluminada
    leftColor = "#6b3a32";   // sombra
  } else if (kind === "road") {
    // Camino: bloque muy bajito, gris terroso
    baseColor = "#5a5145";
    topColor = "#6c6356";
    rightColor = "#857a68";
    leftColor = "#453d34";
  } else {
    baseColor = "#888888";
    topColor = "#888888";
    rightColor = "#aaaaaa";
    leftColor = "#555555";
  }

  // 1) Base
  ctx.beginPath();
  ctx.moveTo(topBaseX, topBaseY);
  ctx.lineTo(rightBaseX, rightBaseY);
  ctx.lineTo(bottomBaseX, bottomBaseY);
  ctx.lineTo(leftBaseX, leftBaseY);
  ctx.closePath();

  if (finished) {
    ctx.fillStyle = baseColor;
  } else {
    ctx.fillStyle = "rgba(123, 123, 140, 0.4)";
  }
  ctx.fill();
  ctx.strokeStyle = "#1b1b24";
  ctx.stroke();

  // 2) En construcción → solo contornos de paredes y tapa
  if (!finished) {
    ctx.strokeStyle = "#d4a95f";

    ctx.beginPath();
    ctx.moveTo(rightTopX, rightTopY);
    ctx.lineTo(bottomTopX, bottomTopY);
    ctx.lineTo(bottomBaseX, bottomBaseY);
    ctx.lineTo(rightBaseX, rightBaseY);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftTopX, leftTopY);
    ctx.lineTo(bottomTopX, bottomTopY);
    ctx.lineTo(bottomBaseX, bottomBaseY);
    ctx.lineTo(leftBaseX, leftBaseY);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(topTopX, topTopY);
    ctx.lineTo(rightTopX, rightTopY);
    ctx.lineTo(bottomTopX, bottomTopY);
    ctx.lineTo(leftTopX, leftTopY);
    ctx.closePath();
    ctx.stroke();

    const barWidth = TILE_WIDTH;
    const barHeight = 4;
    const px = sx - barWidth / 2;
    const py = topTopY - 10;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(px, py, barWidth, barHeight);

    ctx.fillStyle = "#d4a95f";
    ctx.fillRect(px, py, barWidth * progress, barHeight);

    return;
  }

  // 3) Terminado → bloque sólido

  // Cara derecha
  ctx.beginPath();
  ctx.moveTo(rightTopX, rightTopY);
  ctx.lineTo(bottomTopX, bottomTopY);
  ctx.lineTo(bottomBaseX, bottomBaseY);
  ctx.lineTo(rightBaseX, rightBaseY);
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();
  ctx.strokeStyle = "#1b1b24";
  ctx.stroke();

  // Cara izquierda
  ctx.beginPath();
  ctx.moveTo(leftTopX, leftTopY);
  ctx.lineTo(bottomTopX, bottomTopY);
  ctx.lineTo(bottomBaseX, bottomBaseY);
  ctx.lineTo(leftBaseX, leftBaseY);
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();
  ctx.stroke();

  // Tapa
  ctx.beginPath();
  ctx.moveTo(topTopX, topTopY);
  ctx.lineTo(rightTopX, rightTopY);
  ctx.lineTo(bottomTopX, bottomTopY);
  ctx.lineTo(leftTopX, leftTopY);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();
  ctx.stroke();
}

function computeDefenseScoreHUD(state) {
	  const tiles = state.tiles || [];
	  let walls = 0;
	  let towers = 0;
	  let gates = 0;

	  for (let y = 0; y < tiles.length; y++) {
		const row = tiles[y];
		for (let x = 0; x < row.length; x++) {
		  const b = row[x].building;
		  if (b === "wall") walls++;
		  else if (b === "tower") towers++;
		  else if (b === "gate") gates++;
		}
	  }

	  const soldiers = state.labor?.soldiers || 0;

	  // Misma fórmula que los eventos: murallas + 2*puertas + 3*torres + 2*soldados
	  let raw = walls + gates * 2 + towers * 3 + soldiers * 2;

	  // Patrullas nocturnas y mejor organización dan un pequeño bonus
	  if (state.laws?.nightWatchLaw) {
		raw += 4;
	  }

	  return raw;
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
  update(dtSeconds);
  render();

  requestAnimationFrame(gameLoop);
}

// ===========================
// Inicio
// ===========================

function init() {
  canvas = document.getElementById("gameCanvas");
  if (!canvas) throw new Error("No se encontró el canvas #gameCanvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo obtener 2D context");
  ctx = context;

  state = createInitialState();
  // Aseguramos que el título inicial coincide con la tabla de prestigio
  updateTitleFromPrestige();

  setupUIBindings();
  setupPanelGroups();
  setupCanvasInteractions();
  setupCameraControls();

  originX = canvas.width / 2;
  originY = 80;

  requestAnimationFrame(gameLoop);
}

window.addEventListener("load", init);