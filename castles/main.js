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
  EVENT_COOLDOWN_DAYS
} from "./config.js";
import { SAMPLE_EVENTS } from "./events.js";

// ===========================
// Constantes de render isométrico
// ===========================

const TILE_WIDTH = 48;
const TILE_HEIGHT = 24;

// Cámara: origen isométrico
let originX = 512;
let originY = 80;

// Movimiento de cámara con teclado
const CAMERA_STEP_X = 48; // ≈ 1 loseta en X
const CAMERA_STEP_Y = 24; // ≈ 1 loseta en Y

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

  // Soldados / servicio / clero: ahora también dependen del sueldo
  const pop = state.resources.population;
  const soldiersDemand =
    Math.floor(pop * 0.05) * wm("soldiers"); // 5%
  const servantsDemand =
    Math.floor(pop * 0.03) * wm("servants"); // 3%

  // El clero depende del sueldo y de la relación con la Iglesia
  const churchRel = state.relations?.church ?? 50;
  const clergyBase = Math.floor(pop * 0.02); // 2%
  const churchFactor = 0.5 + churchRel / 100; // entre ~0.5 y ~1.5
  const clergyDemand = clergyBase * wm("clergy") * churchFactor;

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
      guilds: 50
    },
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
    }
  };
}

// ===========================
// UI bindings
// ===========================

function setupUIBindings() {
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
    });
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
    });
  });
  
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

  if (tile.building || tile.underConstruction) {
    return;
  }

  const b = state.selectedBuilding;
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

function onNewDay(daysPassed) {
  // 0) Rebalanceo de población activa según “vacantes”
  rebalanceLabor(state);

  // 1) Impuestos
  const baseTaxPerPerson = BASE_TAX_PER_PERSON;
  let taxMultiplier;
  if (state.taxRate === 0) taxMultiplier = 0.5;
  else if (state.taxRate === 2) taxMultiplier = 1.7;
  else taxMultiplier = 1.0;

  const taxIncome =
    state.resources.population *
    baseTaxPerPerson *
    taxMultiplier *
    daysPassed;
  state.resources.gold += taxIncome;

  if (state.taxRate === 0) {
    adjustRelation("people", +0.5 * daysPassed);
    adjustRelation("crown", -0.3 * daysPassed);
  } else if (state.taxRate === 2) {
    adjustRelation("people", -0.7 * daysPassed);
    adjustRelation("crown", +0.5 * daysPassed);
  }

  // 2) Sueldos: pagar salarios de los gremios clave
  applyWages(daysPassed);

  // 3) Producción de edificios según gremios
  applyBuildingProduction(daysPassed);

  // 3b) Efectos continuos de las leyes
  if (state.laws?.corveeLabor) {
    adjustRelation("people", -0.2 * daysPassed);
    adjustRelation("guilds", -0.15 * daysPassed);
  }
  if (state.laws?.forestProtection) {
    adjustRelation("people", 0.1 * daysPassed);
    adjustRelation("church", 0.1 * daysPassed);
  }

  // 4) Consumo de comida
  const foodPerPerson = FOOD_PER_PERSON_PER_DAY;
  state.resources.food -=
    state.resources.population * foodPerPerson * daysPassed;

  if (state.resources.food < 0) {
    state.resources.food = 0;
    state.resources.population = Math.max(
      0,
      state.resources.population - daysPassed
    );
    adjustRelation("people", -1 * daysPassed);
  }

  // 5) Avance de obras (usa constructores)
  advanceConstruction(daysPassed);

  // 6) Eventos
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
  state.resources.gold -= totalCost;

  if (state.resources.gold < 0) {
    // No podemos pagar todos los sueldos: cabreo general
    const deuda = -state.resources.gold;
    state.resources.gold = 0;
    const stress = Math.min(1, deuda / 100); // escala suave
    adjustRelation("guilds", -0.5 * stress * daysPassed);
    adjustRelation("people", -0.3 * stress * daysPassed);
    adjustRelation("church", -0.2 * stress * daysPassed);
  }
}

function applyBuildingProduction(daysPassed) {
  let farms = 0;
  let quarries = 0;
  let lumberyards = 0;

  for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
    for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
      const tile = state.tiles[y][x];
      if (tile.building === "farm") farms++;
      else if (tile.building === "quarry") quarries++;
      else if (tile.building === "lumberyard") lumberyards++;
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
    state.resources.food +=
      farms * FOOD_PER_FARM_PER_DAY * foodFactor * daysPassed;
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

  const totalBuilders = state.labor.builders || 0;
  if (totalBuilders <= 0) return;

  const buildersPerSite = totalBuilders / activeTiles.length;
  const factor = buildersPerSite / BASE_BUILDERS_PER_SITE;
  if (factor <= 0) return;

  activeTiles.forEach((tile) => {
    tile.buildRemainingDays -= daysPassed * factor;
    if (tile.buildRemainingDays <= 0) {
      tile.building = tile.underConstruction;
      tile.underConstruction = null;
      tile.buildRemainingDays = 0;
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

  if (!modal || !titleEl || !textEl || !choicesEl) return;

  modal.classList.remove("hidden");
  titleEl.textContent = evt.title;
  textEl.textContent = evt.text;
  choicesEl.innerHTML = "";

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
  else if (kind === "bridge") heightPx = 5;  // puente bajito
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

function updateHUD() {
  const dayEl = document.getElementById("day-display");
  const goldEl = document.getElementById("gold-display");
  const stoneEl = document.getElementById("stone-display");
  const woodEl = document.getElementById("wood-display");
  const foodEl = document.getElementById("food-display");
  const popEl = document.getElementById("pop-display");
  const popSideEl = document.getElementById("pop-display-side");

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
  if (goldEl) goldEl.textContent = Math.floor(state.resources.gold).toString();
  if (stoneEl)
    stoneEl.textContent = Math.floor(state.resources.stone).toString();
  if (woodEl)
    woodEl.textContent = Math.floor(state.resources.wood).toString();
  if (foodEl) foodEl.textContent = Math.floor(state.resources.food).toString();
  const popText = Math.floor(state.resources.population).toString();
  if (popEl) popEl.textContent = popText;
  if (popSideEl) popSideEl.textContent = popText;

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
    const val = Number(btn.dataset.value || "0") === 1;
    if (!lawKey) return;
    if ((laws[lawKey] ?? false) === val) btn.classList.add("active");
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

  setupUIBindings();
  setupPanelGroups();
  setupCanvasInteractions();
  setupCameraControls();

  originX = canvas.width / 2;
  originY = 80;

  requestAnimationFrame(gameLoop);
}

window.addEventListener("load", init);
