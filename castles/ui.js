// ui.js
// ============================================================
//  Lógica de UI: tooltips, botones, menús, sueldos, leyes...
// ============================================================

import {
  BUILDING_TYPES,
  WAGE_BASE,
  WAGE_MULTIPLIER,
  BASE_TAX_PER_PERSON,
  TAX_MULTIPLIER_UI
} from "./config.js";

// Tooltip global reutilizable
let tooltipEl = null;
let currentTooltipTarget = null;

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
        const lawLabels = {
          corveeLabor: "Corveas obligatorias",
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

function positionTooltip(x, y) {
  if (!tooltipEl) return;
  const offset = 16;
  tooltipEl.style.left = `${x + offset}px`;
  tooltipEl.style.top = `${y + offset}px`;
}
