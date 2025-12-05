// ui.js
// ============================================================
//  Lógica de UI: tooltips, botones, menús, sueldos, leyes...
// ============================================================

import {
  BUILDING_TYPES,
  WAGE_BASE,
  WAGE_MULTIPLIER,
  BASE_TAX_PER_PERSON,
  TAX_MULTIPLIER_UI,
  WAGE_ROLE_LABELS,
  WAGE_TIER_LABELS,
  TAX_LEVEL_LABELS,
  LAW_LABELS
} from "./config.js";

// Tooltip global reutilizable
let tooltipEl = null;
let currentTooltipTarget = null;

// Ventana emergente de mensajes simples (errores de construcción, avisos, etc.)
let gameMessageModalEl = null;
let gameMessageTextEl = null;
let gameMessageCloseBtn = null;

// ------------------------------------------------------------
//  API principal
// ------------------------------------------------------------

/**
 * Enlaza toda la UI con el estado y callbacks externos.
 *
 * @param {object} state
 * @param {object} deps
 * @param {function} [deps.addLogEntry]
 * @param {function} [deps.exportGameToFile]
 * @param {function} [deps.applyLoadedPayload]
 * @param {function} [deps.saveGame]
 * @param {function} [deps.loadGame]
 */
export function setupUIBindings(getState, deps = {}) {
  const {
    addLogEntry,
    exportGameToFile,
    applyLoadedPayload,
    saveGame,
    loadGame
  } = deps;

  // Tooltips informativos de la UI
  setupBuildingTooltips();
  setupWageTooltips();
  setupTaxTooltips();
  setupGlobalTooltip();

  // ------------------------------
  // Velocidad
  // ------------------------------
  document.querySelectorAll(".speed-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".speed-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const speedStr = btn.dataset.speed || "1";
      const speed = Number(speedStr);
      if (Number.isNaN(speed)) return;

      const state = getState();
      state.speedMultiplier = speed;

      if (typeof addLogEntry === "function") {
        const labels = {
          0: "pausado",
          0.5: "lento",
          1: "normal",
          2: "rápido",
          4: "muy rápido"
        };
        const label = labels[speed] || `x${speed}`;
        addLogEntry(`Velocidad de juego ajustada a ${label}.`);
      }
    });
  });

  // ------------------------------
  // Botones de construcción
  // ------------------------------
  document.querySelectorAll(".build-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".build-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const buildingId = btn.dataset.building;
      if (buildingId) {
        const state = getState();
        state.selectedBuilding = buildingId;
      }
    });
  });

  // ------------------------------
  // Impuestos
  // ------------------------------
  document.querySelectorAll(".tax-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tax-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const taxStr = btn.dataset.tax || "1";
      const tax = Number(taxStr);
      if (Number.isNaN(tax)) return;

      const state = getState();
      state.taxRate = tax;

      if (typeof addLogEntry === "function") {
        const labels = { 0: "bajos", 1: "normales", 2: "altos" };
        const label = labels[tax] ?? String(tax);
        addLogEntry(`Impuestos ajustados a nivel ${label}.`);
      }
    });
  });

  // ------------------------------
  // Menú de jugador / partida (escudo)
  // ------------------------------
  const playerMenuButton = document.getElementById("player-menu-button");
  const playerMenuDropdown = document.getElementById("player-menu-dropdown");
  const playerNameInput = document.getElementById("player-name-input");
  const exportBtn = document.getElementById("export-btn");
  const importInput = document.getElementById("import-input");

  // Nombre del jugador
  if (playerNameInput) {
    const state = getState();
    let initialName =
      state.playerName || localStorage.getItem("castles_player_name") || "";
    state.playerName = initialName;
    playerNameInput.value = initialName;

    const commitName = () => {
      const state = getState();
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

  // Exportar partida
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      if (typeof exportGameToFile === "function") {
        exportGameToFile();
      }
    });
  }

  // Importar partida
  if (importInput) {
    importInput.addEventListener("change", () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || "");
          const payload = JSON.parse(text);

          if (typeof applyLoadedPayload === "function") {
            applyLoadedPayload(payload);
          }

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

      reader.readAsText(file, "utf-8");
    });
  }

  // ------------------------------
  // Guardar / cargar botones
  // ------------------------------
  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (typeof saveGame === "function") {
        saveGame();
      }
    });
  }

  const loadBtn = document.getElementById("load-btn");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      if (typeof loadGame === "function") {
        loadGame();
      }
    });
  }

  // ------------------------------
  // Overlay de crónica: minimizar / maximizar
  // ------------------------------
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

  // ------------------------------
  // Sueldos (wages)
  // ------------------------------
  document.querySelectorAll(".wage-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role;
      const wageStr = btn.dataset.wage || "1";
      const wageTier = Number(wageStr);
      if (!role || Number.isNaN(wageTier)) return;

      document
        .querySelectorAll(`.wage-btn[data-role="${role}"]`)
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const state = getState();
      if (!state.wages) state.wages = {};
      state.wages[role] = wageTier;

      if (typeof addLogEntry === "function") {
        const rName = WAGE_ROLE_LABELS[role] || role;
        const tName = WAGE_TIER_LABELS[wageTier] ?? String(wageTier);
        addLogEntry(`Sueldo de ${rName} ajustado a nivel ${tName}.`);
      }
    });
  });

  // ------------------------------
  // Leyes (botones Sí / No)
  // ------------------------------
  document.querySelectorAll(".law-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lawKey = btn.dataset.law;
      if (!lawKey) return;

      // Valor booleano a partir de data-value="0" / "1"
      const value = Number(btn.dataset.value || "0") === 1;

      const state = getState();
      if (!state.laws) state.laws = {};
      state.laws[lawKey] = value;

      // Marcar activo solo el botón pulsado de ese grupo de ley
      document
        .querySelectorAll(`.law-btn[data-law="${lawKey}"]`)
        .forEach((b) => {
          b.classList.toggle("active", b === btn);
        });

      if (typeof addLogEntry === "function") {
        const name = LAW_LABELS[lawKey] || lawKey;
        const status = value ? "activada" : "desactivada";
        addLogEntry(`Ley "${name}" ${status}.`);
      }
    });
  });
}

/**
 * Colapsado de grupos de paneles laterales.
 */
export function setupPanelGroups() {
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

// ------------------------------------------------------------
//  Tooltips específicos
// ------------------------------------------------------------

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

    const nameLabel = def.name || id;

    let text = nameLabel;
    if (parts.length) {
      text += ` · Coste: ${parts.join(", ")}`;
    } else {
      text += " · Coste: sin recursos directos.";
    }

    if (def.buildTimeDays) {
      text += ` · ${def.buildTimeDays} día${
        def.buildTimeDays > 1 ? "s" : ""
      } de obra.`;
    }

    btn.removeAttribute("title");
    btn.dataset.tooltip = text;
  });
}

function setupWageTooltips() {
  document.querySelectorAll(".wage-btn").forEach((btn) => {
    const role = btn.dataset.role;
    const wageStr = btn.dataset.wage || "1";
    const tier = Number(wageStr);
    if (!role || Number.isNaN(tier)) return;

    const base = WAGE_BASE[role];
    if (typeof base !== "number") return;

    const mult = WAGE_MULTIPLIER[tier] ?? 1;
    const goldPerDay = base * mult;

    const roleLabel = WAGE_ROLE_LABELS[role] || role;
    const tierLabel = WAGE_TIER_LABELS[tier] ?? String(tier);

    btn.dataset.tooltip = `${roleLabel} · sueldo ${tierLabel}: ${goldPerDay.toFixed(
      2
    )} oro/día por trabajador.`;
  });
}

function setupTaxTooltips() {
  document.querySelectorAll(".tax-btn").forEach((btn) => {
    const taxStr = btn.dataset.tax || "1";
    const level = Number(taxStr);
    if (Number.isNaN(level)) return;

    const label = TAX_LEVEL_LABELS[level] || "Impuestos";
    const mult = TAX_MULTIPLIER_UI[level] ?? 1.0;
    const perHabitant = BASE_TAX_PER_PERSON * mult;

    btn.dataset.tooltip = `${label}: ~${(mult * 100).toFixed(
      0
    )}% de la tasa base. Recaudación media: ${perHabitant.toFixed(
      2
    )} oro/día por habitante.`;
  });
}

// ------------------------------------------------------------
//  Tooltip global
// ------------------------------------------------------------

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
    if (!currentTooltipTarget) return;
    if (!ev.relatedTarget) return;
    if (
      ev.target === currentTooltipTarget &&
      !ev.relatedTarget.closest("[data-tooltip]")
    ) {
      hideTooltip();
      currentTooltipTarget = null;
    }
  });
}

function showTooltipAt(text, x, y) {
  if (!tooltipEl) return;
  tooltipEl.textContent = text;
  tooltipEl.style.display = "block";
  tooltipEl.style.opacity = "1";   // <- ahora sí se ve
  positionTooltip(x, y);
}

function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.style.opacity = "0";
  tooltipEl.style.display = "none";
}

// ------------------------------------------------------------
//  Modal de eventos
// ------------------------------------------------------------
export function showEventModal(evt, onChoice) {
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

    // Si el evento no define image, usamos <id>.webp;
    // si define image: "otro.webp", usamos ese nombre.
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

  (evt.choices || []).forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "event-choice-btn";
    btn.textContent = choice.text;
    btn.addEventListener("click", () => {
      if (typeof onChoice === "function") {
        onChoice(choice);
      }
      closeEventModal();
    });
    choicesEl.appendChild(btn);
  });
}

export function closeEventModal() {
  const modal = document.getElementById("event-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function positionTooltip(x, y) {
  if (!tooltipEl) return;
  const offset = 16;
  tooltipEl.style.left = `${x + offset}px`;
  tooltipEl.style.top = `${y + offset}px`;
}

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

export function updateHUD(state) {
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

  if (!state || !state.resources) return;

  if (dayEl) dayEl.textContent = String(state.day);
  if (goldEl) {
    const goldVal = Number(state.resources.gold || 0);
    goldEl.textContent = goldVal.toFixed(2);
  }
  if (stoneEl)
    stoneEl.textContent = Math.floor(state.resources.stone).toString();
  if (woodEl)
    woodEl.textContent = Math.floor(state.resources.wood).toString();
  if (foodEl)
    foodEl.textContent = Math.floor(state.resources.food).toString();
  const popText = Math.floor(state.resources.population).toString();
  if (popEl) popEl.textContent = popText;
  if (popSideEl) popSideEl.textContent = popText;

  if (titleEl) {
    // El título “oficial” viene de state.title,
    // que se rellena al cargar partidas y al ganar prestigio.
    const title = state.title || "Señor de la aldea";
    const name = state.playerName || "Sin nombre";
    titleEl.textContent = `${title} ${name}`;
  }

  if (prestigeEl)
    prestigeEl.textContent = Math.round(state.prestige || 0).toString();

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
      li.textContent = `Día ${entry.day}: ${entry.text}`;
      logListEl.appendChild(li);
    }
  }

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

// ------------------------------------------------------------
//  Ventana emergente de mensajes del juego
// ------------------------------------------------------------

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

export function showGameMessage(text) {
  ensureGameMessageElements();
  if (!gameMessageModalEl || !gameMessageTextEl) {
    // Respaldo por si falta el DOM
    alert(text);
    return;
  }
  gameMessageTextEl.textContent = text;
  gameMessageModalEl.classList.remove("hidden");
}

export function hideGameMessage() {
  if (!gameMessageModalEl) return;
  gameMessageModalEl.classList.add("hidden");
}
