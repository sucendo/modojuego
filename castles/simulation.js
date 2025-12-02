// simulation.js
// ============================================================
//  Avance de tiempo y transición de días
// ============================================================

import { GAME_CONFIG, BASE_TAX_PER_PERSON, FOOD_PER_PERSON_PER_DAY } from "./config.js";

import {
  rebalanceLabor,
  adjustRelation,
  addLogEntry,
  computeMinSoldiers,
  applyWages,
  applyBuildingProduction,
  advanceConstruction,
  tryTriggerRandomEvent,
  formatDelta
} from "./main.js";

/**
 * Avanza la simulación en función del tiempo real transcurrido.
 * - Usa state.speedMultiplier para la velocidad (0 = pausado).
 * - Actualiza state.timeSeconds.
 * - Cuando se cruza a uno o varios días nuevos, procesa la lógica diaria (onNewDay).
 *
 * No toca HUD ni DOM: solo modifica el objeto `state`.
 *
 * @param {object} state - Estado global del juego.
 * @param {number} dtSeconds - Delta de tiempo en segundos reales.
 */
export function updateSimulation(state, dtSeconds) {
  if (!state) return;

  const speed = state.speedMultiplier || 0;
  if (speed <= 0) return;

  // Inicializar si faltan campos
  if (typeof state.timeSeconds !== "number" || !Number.isFinite(state.timeSeconds)) {
    state.timeSeconds = 0;
  }
  if (typeof state.day !== "number" || state.day < 1) {
    state.day = 1;
  }

  // Avance de tiempo escalado por velocidad
  const scaledDt = dtSeconds * speed;
  state.timeSeconds += scaledDt;

  // Cálculo de día nuevo según la config actual
  const newDay =
    Math.floor(state.timeSeconds / GAME_CONFIG.secondsPerDay) + 1;

  if (newDay !== state.day) {
    const daysPassed = newDay - state.day;
    state.day = newDay;

    if (daysPassed > 0) {
      onNewDay(state, daysPassed);
    }
  }
}

// ============================================================
//  Lógica de un nuevo día (onNewDay) y helpers
// ============================================================

function takeDailySnapshot(state) {
  return {
    gold: state.resources.gold,
    food: state.resources.food,
    stone: state.resources.stone,
    wood: state.resources.wood,
    population: state.resources.population,
    peopleRel: state.relations.people
  };
}

function applyDailyTaxesAndLaws(state, daysPassed) {
  // 2) Impuestos básicos según población, nivel de impuestos y leyes económicas
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

  // Relaciones básicas por nivel global de impuestos
  if (state.taxRate === 0) {
    adjustRelation("people", +0.5 * daysPassed);
    adjustRelation("crown", -0.3 * daysPassed);
  } else if (state.taxRate === 2) {
    adjustRelation("people", -0.7 * daysPassed);
    adjustRelation("crown", +0.5 * daysPassed);
  }

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
}

function applyDailyWagesAndProduction(state, daysPassed) {
  // 3) Sueldos y 4) Producción de edificios
  if (!state.flags) state.flags = {};
  // Por defecto asumimos que se han podido pagar; si no, lo marcará applyWages
  state.flags.buildersUnpaidToday = false;
  applyWages(daysPassed);
  applyBuildingProduction(daysPassed);
}

function applyFoodAndPopulation(state, daysPassed) {
  // 7) Consumo de comida y primera penalización por hambre
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
}

function applyUnrestAndEmigration(state, daysPassed) {
  // 8) Malestar y emigración si el pueblo está muy descontento
  if (state.relations.people < 20 && state.resources.population > 0) {
    const anger = 20 - state.relations.people;
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
}

function applyPopulationGrowth(state, daysPassed) {
  // 9) Crecimiento natural de la población si hay abundancia y satisfacción
  if (state.day % 30 === 0 && state.resources.population > 0) {
    const pop = state.resources.population;
    const foodPerPerson = FOOD_PER_PERSON_PER_DAY;
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
}

function applyGarrisonRules(state, daysPassed) {
  // 10) Guarnición mínima
  const pop = state.resources.population;
  const soldiers = state.labor.soldiers || 0;
  const required = computeMinSoldiers(state);
  if (required > 0 && soldiers < required) {
    const ratio = soldiers / required; // 0..1
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

function applyTempTaxRelief(state, daysPassed) {
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
      addLogEntry(
        "La reducción excepcional de impuestos llega a su fin. Los gravámenes vuelven a su nivel anterior."
      );
    }
  }
}

function applyClericInfluence(state, daysPassed) {
  // 12) Influencia diaria del clérigo según sueldo
  const wages = state.wages || {};
  const clergyWage = wages.clergy ?? 1;
  const clergyCount = state.labor.clergy || 0;
  const hasCleric = state.flags?.hasCleric;

  if (hasCleric && clergyCount > 0) {
    if (clergyWage === 0) {
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
      adjustRelation("church", 0.05 * daysPassed);

      if (typeof state.unrest !== "number") state.unrest = 0;
      if (state.unrest > 0) {
        state.unrest = Math.max(0, state.unrest - 0.2 * daysPassed);
      }
    } else if (clergyWage === 2) {
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

function finalizeDailyLogAndConstruction(state, snapshot, daysPassed) {
  // 13) Resumen del día para la crónica
  const dGold = state.resources.gold - snapshot.gold;
  const dFood = state.resources.food - snapshot.food;
  const dStone = state.resources.stone - snapshot.stone;
  const dWood = state.resources.wood - snapshot.wood;
  const dPop = state.resources.population - snapshot.population;
  const dPeople = state.relations.people - snapshot.peopleRel;

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

export function onNewDay(state, daysPassed) {
  const snapshot = takeDailySnapshot(state);

  // 1) Rebalanceo de población activa según “vacantes”
  rebalanceLabor(state);

  applyDailyTaxesAndLaws(state, daysPassed);
  applyDailyWagesAndProduction(state, daysPassed);
  applyFoodAndPopulation(state, daysPassed);
  applyUnrestAndEmigration(state, daysPassed);
  applyPopulationGrowth(state, daysPassed);
  applyGarrisonRules(state, daysPassed);
  applyTempTaxRelief(state, daysPassed);
  applyClericInfluence(state, daysPassed);
  finalizeDailyLogAndConstruction(state, snapshot, daysPassed);
}