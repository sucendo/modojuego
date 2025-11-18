// events.js

import { BUILDING_TYPES } from "./config.js";

// ========= Helpers internos ===========

// Pequeño helper para escribir en la crónica desde los eventos
function pushLog(state, text) {
  if (!state) return;
  if (!state.logs) state.logs = [];
  state.logs.unshift({ day: state.day, text });
  if (state.logs.length > 40) {
    state.logs.length = 40;
  }
}

// Un edificio al azar de ciertos tipos
function pickRandomBuildingTile(state, typesArray) {
  const candidates = [];
  for (let y = 0; y < state.tiles.length; y++) {
    for (let x = 0; x < state.tiles[y].length; x++) {
      const tile = state.tiles[y][x];
      if (tile.building && typesArray.includes(tile.building)) {
        candidates.push(tile);
      }
    }
  }
  if (candidates.length === 0) return null;
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

// ¿Hay al menos un edificio de alguno de estos tipos?
function hasBuilding(state, typesArray) {
  for (let y = 0; y < state.tiles.length; y++) {
    for (let x = 0; x < state.tiles[y].length; x++) {
      const tile = state.tiles[y][x];
      if (tile.building && typesArray.includes(tile.building)) {
        return true;
      }
    }
  }
  return false;
}

// ¿Hay al menos una loseta de cierto terreno?
function hasTerrain(state, terrainType) {
  for (let y = 0; y < state.tiles.length; y++) {
    for (let x = 0; x < state.tiles[y].length; x++) {
      const tile = state.tiles[y][x];
      if (tile.terrain === terrainType) return true;
    }
  }
  return false;
}

// ¿Población mínima?
function hasPopulationAtLeast(state, n) {
  return state.resources.population >= n;
}

function computeDefenseScore(state) {
	  let walls = 0;
	  let towers = 0;
	  let gates = 0;

	  const tiles = state.tiles || [];
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

	  // Murallas cuentan poco, torres y puertas algo más, soldados dan fuerza móvil
	  let score = walls + gates * 2 + towers * 3 + soldiers * 2;

	  // Patrullas nocturnas y mejor organización de la guardia dan un pequeño bonus
	  if (state.laws?.nightWatchLaw) {
		score += 4;
	  }

	  return score;
}

function destroyRandomWallSegment(state) {
  const tiles = state.tiles || [];
  const candidates = [];

  for (let y = 0; y < tiles.length; y++) {
    const row = tiles[y];
    for (let x = 0; x < row.length; x++) {
      const tile = row[x];
      if (tile.building === "wall") {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) return false;

  const idx = Math.floor(Math.random() * candidates.length);
  const { x, y } = candidates[idx];
  const tile = state.tiles[y][x];

  tile.building = null;
  tile.underConstruction = null;
  tile.buildRemainingDays = 0;

  return true;
}

// Inicia la reconstrucción de una sección derrumbada a mitad de precio
function startHalfPriceRebuild(state, tile, kind) {
  const def = BUILDING_TYPES[kind];
  if (!def) return;

  const cost = def.cost || {};
  for (const key in cost) {
    if (!Object.prototype.hasOwnProperty.call(cost, key)) continue;
    const half = Math.floor(cost[key] / 2);
    if (half > 0) {
      state.resources[key] = Math.max(
        0,
        (state.resources[key] || 0) - half
      );
    }
  }

  tile.building = null;
  tile.underConstruction = kind;
  tile.buildRemainingDays = def.buildTimeDays || 1;
}

// Derriba hasta N secciones de muralla/torre/puerta y devuelve cuántas cayeron
function collapseRandomDefenseSegments(state, maxSegments) {
  let destroyed = 0;
  for (let i = 0; i < maxSegments; i++) {
    if (destroyRandomWallSegment(state)) {
      destroyed++;
    } else {
      break;
    }
  }
  if (destroyed > 0) {
    const msg =
      destroyed === 1
        ? "Durante el ataque, una sección de la muralla ha cedido y ha quedado en ruinas."
        : `Durante el ataque, ${destroyed} tramos de la muralla han cedido y han quedado en ruinas.`;
    pushLog(state, msg);
  }
  return destroyed;
}

export const SAMPLE_EVENTS = [
  // ======================
  // IGLESIA
  // ======================
  {
    id: "church_donation",
    title: "El obispo solicita donaciones",
    text:
      "El obispo de la diócesis visita la obra del castillo. " +
      "Afirma que la Iglesia bendecirá tus muros si haces una donación generosa.",
    // Solo aparece si la relación con la Iglesia no está ya altísima
    condition: (state) => state.relations.church < 85,
    choices: [
      {
        id: "donate_generous",
        text: "Hacer una donación generosa en oro.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 50);
          state.resources.population += 1;

          if (state.relations) {
            state.relations.church = Math.min(
              100,
              state.relations.church + 12
            );
            state.relations.people = Math.min(
              100,
              state.relations.people + 3
            );
          }
        }
      },
      {
        id: "donate_small",
        text: "Hacer una pequeña donación simbólica.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 15);

          if (state.relations) {
            state.relations.church = Math.min(
              100,
              state.relations.church + 5
            );
          }
        }
      },
      {
        id: "refuse",
        text: "Rehusar educadamente, alegando falta de recursos.",
        effects: (state) => {
          if (state.relations) {
            state.relations.church = Math.max(
              0,
              state.relations.church - 10
            );
            state.relations.people = Math.max(
              0,
              state.relations.people - 3
            );
          }
        }
      }
    ]
  },
  {
    id: "church_assign_cleric",
    title: "El obispo exige un clérigo residente",
    text:
      "El obispo escribe desde la diócesis: considera inapropiado que un castillo en crecimiento no tenga un clérigo residente. " +
      "Se ofrece a enviarte a un sacerdote para atender a los fieles y velar por la ortodoxia.",
    condition: (state) => {
      const pop = state.resources?.population || 0;
      const churchRel = state.relations?.church ?? 50;
      const flags = state.flags || {};
      // Solo una vez, con algo de población y sin clérigo oficial
      return pop >= 20 && churchRel >= 40 && !flags.hasCleric;
    },
    choices: [
      {
        id: "accept_cleric",
        text: "Aceptar al clérigo y darle aposento en el castillo.",
        effects: (state) => {
          state.resources.population += 1; // Llega el nuevo clérigo

          if (!state.flags) state.flags = {};
          state.flags.hasCleric = true;

          if (state.relations) {
            state.relations.church = Math.min(
              100,
              state.relations.church + 8
            );
            state.relations.people = Math.min(
              100,
              state.relations.people + 2
            );
          }
        }
      },
      {
        id: "refuse_cleric",
        text: "Rechazarlo, la villa no necesita injerencias constantes.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.hasCleric = false; // se mantiene sin clérigo oficial

          if (state.relations) {
            state.relations.church = Math.max(
              0,
              state.relations.church - 10
            );
            state.relations.people = Math.max(
              0,
              state.relations.people - 1
            );
          }
        }
      }
    ]
  },
  {
    id: "church_relic",
    title: "Reliquia en tránsito",
    text:
      "Un pequeño monasterio cercano afirma custodiar una reliquia. " +
      "Piden protección de tu guarnición mientras la trasladan.",
    // Solo si tienes al menos algo de población (guardia básica)
    condition: (state) => hasPopulationAtLeast(state, 10),
    choices: [
      {
        id: "assign_guards",
        text: "Asignar algunos hombres para escoltar la reliquia.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 10);
          if (state.relations) {
            state.relations.church = Math.min(
              100,
              state.relations.church + 8
            );
            state.relations.crown = Math.max(
              0,
              state.relations.crown - 2
            );
          }
        }
      },
      {
        id: "deny_help",
        text: "Negarse, alegando que tu castillo está en construcción.",
        effects: (state) => {
          if (state.relations) {
            state.relations.church = Math.max(
              0,
              state.relations.church - 6
            );
          }
        }
      }
    ]
  },
  {
    id: "church_build_monastery",
    title: "Propuesta de monasterio",
    text:
      "Los clérigos locales proponen fundar un pequeño monasterio cerca del castillo. " +
      "Aseguran que atraerá peregrinos y estudiosos, pero requerirá invertir en piedra, madera y oro.",
    // Solo si tienes buena relación con la Iglesia, pagas bien al clero
    // y aún no hay monasterio
    condition: (state) =>
      (state.relations.church ?? 0) >= 60 &&
      state.labor.clergy > 0 &&
      (state.wages?.clergy ?? 1) >= 2 &&
      (state.flags?.hasCleric ?? false) &&
      !state.structures?.monastery,
    choices: [
      {
        id: "build_monastery",
        text: "Autorizar la construcción del monasterio.",
        effects: (state) => {
          state.resources.stone = Math.max(0, state.resources.stone - 60);
          state.resources.wood = Math.max(0, state.resources.wood - 40);
          state.resources.gold = Math.max(0, state.resources.gold - 80);

          if (!state.structures) state.structures = {};
          state.structures.monastery = true;

          // Beneficios: más población y mejor relación con la Iglesia
          state.resources.population += 10;
          if (state.relations) {
            state.relations.church = Math.min(
              100,
              state.relations.church + 12
            );
            state.relations.people = Math.min(
              100,
              state.relations.people + 4
            );
          }
        }
      },
      {
        id: "reject_monastery",
        text: "Rechazar el proyecto, los recursos son para el castillo.",
        effects: (state) => {
          if (state.relations) {
            state.relations.church = Math.max(
              0,
              state.relations.church - 10
            );
          }
        }
      }
    ]
  },
  {
    id: "cleric_garrison_proposal",
    title: "El clérigo pide reforzar la guarnición",
    text:
      "Con el crecimiento de la villa, un clérigo influyente insiste en que el castillo mantenga una guarnición mínima para proteger a los fieles.",
    condition: (state) => {
      const pop = state.resources?.population || 0;
      const churchRel = state.relations?.church ?? 50;
      const flags = state.flags || {};
      // Solo una vez, cuando ya hay al menos 30 habitantes
      return pop >= 30 && !flags.garrisonProposalSeen && churchRel >= 40;
    },
    choices: [
      {
        id: "accept_garrison_proposal",
        text: "Asegurar que habrá siempre una guarnición adecuada.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.garrisonProposalSeen = true;
          if (state.relations) {
            state.relations.church = Math.min(
              100,
              state.relations.church + 6
            );
            state.relations.crown = Math.min(
              100,
              state.relations.crown + 4
            );
            state.relations.people = Math.max(
              0,
              state.relations.people - 2
            );
          }
          // La norma de 1 soldado por cada 15 habitantes ya se aplica
          // en onNewDay() a partir de 30 hab.
        }
      },
      {
        id: "refuse_garrison_proposal",
        text: "Responder que la guarnición la decide solo el señor del castillo.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.garrisonProposalSeen = true;
          if (state.relations) {
            state.relations.church = Math.max(
              0,
              state.relations.church - 6
            );
            state.relations.crown = Math.max(
              0,
              state.relations.crown - 3
            );
            state.relations.people = Math.min(
              100,
              state.relations.people + 2
            );
          }
        }
      }
    ]
  },
  {
    id: "cleric_charity",
    title: "Obras de caridad para los pobres",
    text:
      "Tu clérigo propone destinar parte del tesoro a alimentar a los más necesitados y vestir a los desamparados. " +
      "Afirma que la limosna apaciguará los ánimos y dará buen nombre al castillo.",
    condition: (state) => {
      const flags = state.flags || {};
      const wages = state.wages || {};
      const clergyWage = wages.clergy ?? 1;
      const pop = state.resources?.population || 0;

      // Solo si hay clérigo oficial, algo de población y un sueldo al menos normal
      return flags.hasCleric && pop >= 20 && clergyWage >= 1;
    },
    choices: [
      {
        id: "fund_charity",
        text: "Autorizar limosnas y reparto de comida.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 20);

          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 5
            );
            state.relations.church = Math.min(
              100,
              state.relations.church + 3
            );
          }
          if (typeof state.unrest !== "number") state.unrest = 0;
          state.unrest = Math.max(0, state.unrest - 5);
        }
      },
      {
        id: "refuse_charity",
        text: "Negarse, las arcas del castillo son prioridad.",
        effects: (state) => {
          if (state.relations) {
            state.relations.people = Math.max(
              0,
              state.relations.people - 2
            );
            state.relations.church = Math.max(
              0,
              state.relations.church - 3
            );
          }
        }
      }
    ]
  },

  // ======================
  // HEREJES
  // ======================
  {
    id: "alt_cult_preachers",
    title: "Predicadores extraños en la plaza",
    text:
      "Al no haber clérigo residente, unos predicadores forasteros empiezan a reunir gente en la plaza. " +
      "Sus palabras mezclan supersticiones, promesas de milagros y críticas veladas a la Iglesia.",
    condition: (state) => {
      const flags = state.flags || {};
      const churchRel = state.relations?.church ?? 50;
      // Solo si no hay clérigo oficial, la Iglesia no es muy fuerte
      // y el evento no ha aparecido ya.
      return !flags.hasCleric && !flags.altCultSeen && churchRel <= 55;
    },
    choices: [
      {
        id: "tolerate_alt_cult",
        text: "Permitir que hablen mientras no causen problemas.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.altCultSeen = true;

          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 3
            );
            state.relations.church = Math.max(
              0,
              state.relations.church - 6
            );
          }
          if (typeof state.unrest !== "number") state.unrest = 0;
          state.unrest = Math.min(100, state.unrest + 3);
        }
      },
      {
        id: "expel_alt_cult",
        text: "Expulsar a los predicadores y reafirmar la fe oficial.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.altCultSeen = true;

          if (state.relations) {
            state.relations.church = Math.min(
              100,
              state.relations.church + 5
            );
            state.relations.people = Math.max(
              0,
              state.relations.people - 2
            );
          }
          if (typeof state.unrest !== "number") state.unrest = 0;
          state.unrest = Math.min(100, state.unrest + 1);
        }
      }
    ]
  },

  // ======================
  // CORONA
  // ======================
  {
    id: "crown_extra_tax",
    title: "Petición de tributo extraordinario",
    text:
      "Un mensajero real llega con un edicto: la Corona exige un tributo extraordinario para financiar una campaña lejana.",
    // Más probable cuando tu relación con la Corona no es perfecta
    condition: (state) => state.relations.crown < 95,
    choices: [
      {
        id: "pay_full",
        text: "Pagar el tributo completo en oro.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 80);
          if (state.relations) {
            state.relations.crown = Math.min(
              100,
              state.relations.crown + 12
            );
            state.relations.people = Math.max(
              0,
              state.relations.people - 5
            );
          }
        }
      },
      {
        id: "negotiate",
        text: "Intentar negociar un pago reducido.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 40);
          if (state.relations) {
            state.relations.crown = Math.min(
              100,
              state.relations.crown + 4
            );
          }
        }
      },
      {
        id: "refuse_crown",
        text: "Rehusar, alegando pobreza del señorío.",
        effects: (state) => {
          if (state.relations) {
            state.relations.crown = Math.max(
              0,
              state.relations.crown - 12
            );
            state.relations.people = Math.min(
              100,
              state.relations.people + 4
            );
          }
        }
      }
    ]
  },
  {
  id: "overlord_tribute",
  title: "Tributo de tu señor",
  text:
    "Tu señor envía a un emisario para recordar el tributo debido. " +
    "A cambio de protección y reconocimiento de tus tierras, debes aportar parte del oro recaudado en el castillo.",
  condition: (state) => {
    // Ejemplo: cada 120 días, después del día 60
    if (!state || typeof state.day !== "number") return false;
    const day = state.day;
    const relOverlord =
      state.relations && typeof state.relations.overlord === "number"
        ? state.relations.overlord
        : 50;

    // Solo tiene sentido si la relación no está completamente rota
    return day > 60 && day % 120 === 0 && relOverlord > 0;
  },
  choices: [
    {
      id: "pay_full",
      text: "Pagar el tributo completo.",
      effects: (state) => {
        const pop = state.resources?.population || 0;
        // Tributo escala con la población, con un mínimo
        const tribute = Math.max(30, Math.floor(pop * 0.5));

        const goldBefore = state.resources.gold || 0;
        const paid = Math.min(goldBefore, tribute);
        state.resources.gold = goldBefore - paid;

        if (!state.relations) state.relations = {};
        if (typeof state.prestige !== "number") state.prestige = 0;

        if (paid >= tribute) {
          // Pagas todo sin problema
          state.relations.overlord = Math.min(
            100,
            (state.relations.overlord || 0) + 8
          );
          // El pueblo ve salir el oro del castillo
          state.relations.people = Math.max(
            0,
            (state.relations.people || 0) - 2
          );
          state.prestige += 5;

          if (typeof pushLog === "function") {
            pushLog(
              state,
              `Pagas el tributo completo (${paid} de oro). El señor superior queda satisfecho, aunque el pueblo murmura al ver las arcas vaciarse.`
            );
          }
        } else {
          // No tenías suficiente oro: pagas lo que puedes
          state.relations.overlord = Math.min(
            100,
            (state.relations.overlord || 0) + 3
          );
          state.relations.people = Math.max(
            0,
            (state.relations.people || 0) - 1
          );
          state.prestige += 2;

          if (typeof pushLog === "function") {
            pushLog(
              state,
              `Vacías casi por completo el tesoro (${paid} de oro), pero aun así no alcanzas el tributo exigido. El señor superior acepta a regañadientes tu aportación.`
            );
          }
        }
      }
    },
    {
      id: "pay_partial",
      text: "Pagar solo una parte del tributo.",
      effects: (state) => {
        const pop = state.resources?.population || 0;
        const tribute = Math.max(30, Math.floor(pop * 0.5));
        const desired = Math.floor(tribute / 2);

        const goldBefore = state.resources.gold || 0;
        const paid = Math.min(goldBefore, desired);
        state.resources.gold = goldBefore - paid;

        if (!state.relations) state.relations = {};
        if (typeof state.prestige !== "number") state.prestige = 0;

        // Tensión con el señor, pequeño gesto ante el pueblo
        state.relations.overlord = Math.max(
          0,
          (state.relations.overlord || 0) - 5
        );
        state.relations.people = Math.min(
          100,
          (state.relations.people || 0) + 1
        );
        state.prestige += 1;

        if (typeof pushLog === "function") {
          pushLog(
            state,
            `Envías solo parte del tributo (${paid} de oro). El señor superior considera escasa tu aportación y su emisario se marcha con gesto agrio, pero algunos vasallos valoran que no entregues todas las riquezas.`
          );
        }
      }
    },
    {
      id: "refuse",
      text: "Negarse a pagar.",
      effects: (state) => {
        if (!state.relations) state.relations = {};
        if (typeof state.prestige !== "number") state.prestige = 0;

        state.relations.overlord = Math.max(
          0,
          (state.relations.overlord || 0) - 12
        );
        // Opción: también afecta un poco a la Corona si la tienes como actor global
        if (typeof state.relations.crown === "number") {
          state.relations.crown = Math.max(
            0,
            state.relations.crown - 3
          );
        }
        state.relations.people = Math.min(
          100,
          (state.relations.people || 0) + 4
        );
        state.prestige += 3;

        // Podemos marcar una bandera para futuros eventos de conflicto con el señor
        if (!state.flags) state.flags = {};
        state.flags.overlordAngered = true;

        if (typeof pushLog === "function") {
          pushLog(
            state,
            "Rechazas pagar el tributo. El emisario se marcha indignado, prometiendo que tu desobediencia no será olvidada. El pueblo comenta en voz baja tu osadía."
          );
        }
      }
    }
  ]
},

  // ======================
  // PUEBLO (COSECHAS / REFUGIADOS / EPIDEMIA)
  // ======================
  {
    id: "people_harvest_good",
    title: "Cosecha generosa",
    text:
      "Este año las lluvias han sido benévolas. Los campesinos hablan de una cosecha especialmente generosa.",
    // Solo si hay al menos una granja
    condition: (state) => hasBuilding(state, ["farm"]),
    choices: [
      {
        id: "store_food",
        text: "Almacenar la mayor parte en los graneros.",
        effects: (state) => {
          state.resources.food += 40;
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 2
            );
          }
        }
      },
	{
        id: "lower_taxes",
        text: "Reducir impuestos temporalmente en señal de gratitud.",
        effects: (state) => {
          state.resources.food += 20;
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 10
            );
            state.relations.crown = Math.max(
              0,
              state.relations.crown - 2
            );
          }

          if (!state.flags) state.flags = {};

          // Si no hay ya una rebaja temporal activa, guardamos el nivel anterior
          if (!state.flags.tempTaxReliefActive) {
            state.flags.tempTaxReliefActive = true;
            state.flags.tempTaxPrevRate =
              typeof state.taxRate === "number" ? state.taxRate : 1;
            state.flags.tempTaxReliefDays = 30; // dura 30 días
          } else {
            // Si ya hay rebaja, simplemente la alargamos un poco
            state.flags.tempTaxReliefDays =
              (state.flags.tempTaxReliefDays || 0) + 15;
          }

          // Aplicar la rebaja efectiva ahora mismo
          if (state.taxRate > 0) state.taxRate -= 1;
        }
      }
    ]
  },
  {
    id: "people_harvest_bad",
    title: "Mala cosecha",
    text:
      "La cosecha ha sido escasa. Los campesinos temen no tener suficiente grano para pasar el invierno.",
    condition: (state) => hasBuilding(state, ["farm"]),
    choices: [
      {
        id: "share_stores",
        text: "Compartir parte de tus reservas con el pueblo.",
        effects: (state) => {
          state.resources.food = Math.max(0, state.resources.food - 30);
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 10
            );
          }
        }
      },
      {
        id: "prioritize_castle",
        text: "Priorizar el abastecimiento del castillo.",
        effects: (state) => {
          if (state.relations) {
            state.relations.people = Math.max(
              0,
              state.relations.people - 8
            );
            state.relations.crown = Math.min(
              100,
              state.relations.crown + 2
            );
          }
        }
      }
    ]
  },
  {
    id: "farmers_good_harvest",
    title: "Buena cosecha",
    text:
      "Las lluvias han llegado en el momento justo y los granjeros anuncian una cosecha excepcional.",
    condition: (state) => {
      // requiere al menos 2 granjas
      let farms = 0;
      for (let y = 0; y < state.tiles.length; y++) {
        for (let x = 0; x < state.tiles[y].length; x++) {
          if (state.tiles[y][x].building === "farm") farms++;
        }
      }
      return farms >= 2;
    },
    choices: [
      {
        id: "harvest_store",
        text: "Almacenar la mayor parte para tiempos difíciles.",
        effects: (state) => {
          state.resources.food += 40;
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 3
            );
          }
        }
      },
      {
        id: "harvest_celebrate",
        text: "Organizar un gran banquete para el pueblo.",
        effects: (state) => {
          state.resources.food += 20;
          state.resources.gold = Math.max(0, state.resources.gold - 15);
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 10
            );
          }
        }
      }
    ]
  },
  {
    id: "people_refugees",
    title: "Refugiados en la puerta",
    text:
      "Varias familias huyen de un señor vecino que ha subido brutalmente los impuestos. " +
      "Piden refugio bajo la protección de tus muros.",
    condition: (state) => hasPopulationAtLeast(state, 5),
    choices: [
      {
        id: "accept_refugees",
        text: "Aceptar a las familias como nuevos siervos.",
        effects: (state) => {
          state.resources.population += 8;
          state.resources.food = Math.max(0, state.resources.food - 15);
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 8
            );
          }
        }
      },
      {
        id: "reject_refugees",
        text: "Rechazarlos: bastante tienes con tu gente.",
        effects: (state) => {
          if (state.relations) {
            state.relations.people = Math.max(
              0,
              state.relations.people - 10
            );
          }
        }
      }
    ]
  },
    {
    id: "crown_destroyed_neighbor_castle",
    title: "Refugiados del castillo arrasado",
    text:
      "La Corona ha castigado duramente a un señor vecino rebelde: su castillo ha sido arrasado y muchos de sus vasallos vagan sin hogar. " +
      "Un emisario real llega a tus salas y te propone acoger a parte de esa gente en tus tierras.",
    condition: (state) => {
      const crownRel =
        state.relations && typeof state.relations.crown === "number"
          ? state.relations.crown
          : 50;
      const day = state.day || 0;
      const flags = state.flags || {};

      // Solo una vez, relación aceptable con la Corona, partida ya algo avanzada
      return (
        !flags.crownDestroyedNeighborRefugees &&
        crownRel >= 30 &&
        day >= 120
      );
    },
    choices: [
      {
        id: "crown_refugees_accept_all",
        text: "Acoger al mayor número posible de refugiados.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.crownDestroyedNeighborRefugees = true;

          // Llega un grupo grande de gente
          const incoming = 20 + Math.floor(Math.random() * 21); // 20-40
          state.resources.population =
            (state.resources.population || 0) + incoming;

          // Consumo inicial de reservas para alojarlos y alimentarlos
          const foodCost = Math.min(
            state.resources.food || 0,
            incoming * 2
          );
          state.resources.food -= foodCost;

          if (state.relations) {
            // La Corona lo ve como un gesto leal
            state.relations.crown = Math.min(
              100,
              (state.relations.crown || 0) + 8
            );
            // Tu pueblo valora la hospitalidad, pero teme la escasez
            state.relations.people = Math.min(
              100,
              (state.relations.people || 0) + 3
            );
          }

          if (typeof state.prestige !== "number") state.prestige = 0;
          state.prestige += 5;

          pushLog(
            state,
            `Aceptas acoger a los refugiados del castillo arrasado: llegan unas ${incoming} almas buscando techo y pan. Tus graneros sienten el peso del gesto generoso.`
          );
        }
      },
      {
        id: "crown_refugees_accept_some",
        text: "Aceptar solo a una parte, alegando falta de recursos.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.crownDestroyedNeighborRefugees = true;

          const incoming = 8 + Math.floor(Math.random() * 11); // 8-18
          state.resources.population =
            (state.resources.population || 0) + incoming;

          const foodCost = Math.min(
            state.resources.food || 0,
            incoming * 2
          );
          state.resources.food -= foodCost;

          if (state.relations) {
            // La Corona aprecia el gesto, pero esperaba más
            state.relations.crown = Math.min(
              100,
              (state.relations.crown || 0) + 3
            );
            // El pueblo ve cierto equilibrio entre compasión y prudencia
            state.relations.people = Math.min(
              100,
              (state.relations.people || 0) + 1
            );
          }

          if (typeof state.prestige !== "number") state.prestige = 0;
          state.prestige += 2;

          pushLog(
            state,
            `Aceptas a parte de los refugiados del castillo vecino: unas ${incoming} personas encuentran cobijo tras tus muros. Otros continúan su camino buscando señor que los reciba.`
          );
        }
      },
      {
        id: "crown_refugees_refuse",
        text: "Rechazar acogerlos: tus tierras ya tienen bastante carga.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.crownDestroyedNeighborRefugees = true;

          if (state.relations) {
            // La Corona ve egoísmo o deslealtad
            state.relations.crown = Math.max(
              0,
              (state.relations.crown || 0) - 8
            );
            // Parte del pueblo se escandaliza, otros entienden la decisión
            state.relations.people = Math.max(
              0,
              (state.relations.people || 0) - 3
            );
          }

          if (typeof state.prestige !== "number") state.prestige = 0;
          state.prestige = Math.max(0, state.prestige - 3);

          pushLog(
            state,
            "Rechazas acoger a los vasallos del castillo arrasado, alegando falta de recursos. El emisario real se marcha con el ceño fruncido, y muchos comentan en voz baja tu dureza."
          );
        }
      }
    ]
  },
  {
    id: "people_epidemic",
    title: "Epidemia en el poblado",
    text:
      "Una fiebre se extiende por las chozas alrededor del castillo. Los curanderos piden recursos para atender a los enfermos.",
    condition: (state) => hasPopulationAtLeast(state, 10),
    choices: [
      {
        id: "pay_healers",
        text: "Financiar remedios y curanderos.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 40);
          const loss = Math.floor(state.resources.population * 0.05);
          state.resources.population = Math.max(
            0,
            state.resources.population - loss
          );
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 6
            );
            state.relations.church = Math.min(
              100,
              state.relations.church + 3
            );
          }
        }
      },
      {
        id: "do_nothing_epidemic",
        text: "Dejar que la enfermedad siga su curso.",
        effects: (state) => {
          const loss = Math.floor(state.resources.population * 0.15);
          state.resources.population = Math.max(
            0,
            state.resources.population - loss
          );
          if (state.relations) {
            state.relations.people = Math.max(
              0,
              state.relations.people - 12
            );
            state.relations.church = Math.max(
              0,
              state.relations.church - 4
            );
          }
          if (state.labor.builders && state.labor.builders > state.resources.population) {
            state.labor.builders = state.resources.population;
          }
        }
      }
    ]
  },

  // ======================
  // GREMIOS
  // ======================
  {
    id: "guilds_wage_dispute",
    title: "Disputa salarial de los gremios",
    text:
      "Los maestros de los gremios de constructores se quejan: dicen que los salarios no reflejan el riesgo de trabajar en las obras del castillo.",
    // Solo tiene sentido si hay constructores y su sueldo no está ya al máximo
    condition: (state) =>
      (state.labor.builders || 0) > 0 &&
      ((state.wages?.builders ?? 0) < 2),
    choices: [
      {
        id: "raise_wages",
        text: "Aumentar ligeramente los salarios.",
        effects: (state) => {
          if (!state.wages) state.wages = {};
          const oldTier = state.wages.builders ?? 0; // 0=bajo,1=normal,2=alto
          const newTier = Math.min(2, oldTier + 1);
          state.wages.builders = newTier;

          state.resources.gold = Math.max(0, state.resources.gold - 25);
          if (state.relations) {
            state.relations.guilds = Math.min(
              100,
              state.relations.guilds + 12
            );
            state.relations.people = Math.min(
              100,
              state.relations.people + 3
            );
          }
        }
      },
      {
        id: "ignore_guilds",
        text: "Ignorar las quejas, hay demasiados costes ya.",
        effects: (state) => {
          if (state.relations) {
            state.relations.guilds = Math.max(
              0,
              state.relations.guilds - 10
            );
          }
          // No tocamos state.labor.builders directamente: el rebalanceo diario se encarga
        }
      }
    ]
  },
  {
    id: "guilds_offer_efficiency",
    title: "Nueva técnica de construcción",
    text:
      "Un maestro albañil propone una técnica para acelerar las obras a cambio de una pequeña inversión.",
    condition: (state) => state.labor.builders && state.labor.builders > 0,
    choices: [
      {
        id: "invest",
        text: "Invertir en la nueva técnica.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 20);
          if (state.relations) {
            state.relations.guilds = Math.min(
              100,
              state.relations.guilds + 6
            );
          }
          // Opcional: hacer algo más atractivo el gremio mejorando ligeramente el sueldo
          if (!state.wages) state.wages = {};
          const current = state.wages.builders ?? 1;
          state.wages.builders = Math.min(2, current + 0); // de momento solo reputación, no subimos sueldo
        }
      },
      {
        id: "decline_innovation",
        text: "Rechazar, las viejas formas son suficientemente buenas.",
        effects: (state) => {
          if (state.relations) {
            state.relations.guilds = Math.max(
              0,
              state.relations.guilds - 3
            );
          }
        }
      }
    ]
  },
  {
    id: "guilds_strike",
    title: "Amenaza de huelga",
    text:
      "Los gremios amenazan con detener las obras si no se respetan ciertos privilegios tradicionales.",
    condition: (state) => state.labor.builders && state.labor.builders >= 6,
    choices: [
      {
        id: "concede_privileges",
        text: "Conceder algunos privilegios a los gremios.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 30);
          if (state.relations) {
            state.relations.guilds = Math.min(
              100,
              state.relations.guilds + 15
            );
          }
        }
      },
      {
        id: "call_their_bluff",
        text: "Plantarse: el castillo no cederá ante presiones.",
        effects: (state) => {
          if (state.relations) {
            state.relations.guilds = Math.max(
              0,
              state.relations.guilds - 15
            );
          }
          state.labor.builders = Math.max(
            0,
            Math.floor((state.labor.builders || 0) * 0.6)
          );
        }
      }
    ]
  },

  // ======================
  // BOSQUES / MADERA
  // ======================
  {
    id: "forest_logging",
    title: "Derechos de tala",
    text:
      "Un grupo de campesinos pide licencia para talar en un bosque comunal cercano, a cambio de una parte de la madera.",
    condition: (state) =>
      hasTerrain(state, "forest") || hasBuilding(state, ["lumberyard"]),
    choices: [
      {
        id: "grant_rights",
        text: "Conceder los derechos de tala a los campesinos.",
        effects: (state) => {
          state.resources.wood += 30;
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 6
            );
            state.relations.crown = Math.max(
              0,
              state.relations.crown - 2
            );
          }
        }
      },
      {
        id: "reserve_forest",
        text: "Reservar el bosque para uso exclusivo del castillo.",
        effects: (state) => {
          state.resources.wood += 50;
          if (state.relations) {
            state.relations.people = Math.max(
              0,
              state.relations.people - 5
            );
            state.relations.crown = Math.min(
              100,
              state.relations.crown + 2
            );
          }
        }
      }
    ]
  },
  {
    id: "forest_conflict",
    title: "Conflicto por los bosques",
    text:
      "Los leñadores y campesinos discuten por el uso de los bosques comunales. " +
      "El clero recuerda la importancia de la creación, mientras los gremios piden más tala.",
    condition: (state) => {
      // solo si hay bosques y aserraderos, y la ley de protección no está activa
      let hasForest = false;
      let hasLumberyard = false;
      for (let y = 0; y < state.tiles.length; y++) {
        for (let x = 0; x < state.tiles[y].length; x++) {
          const t = state.tiles[y][x];
          if (t.terrain === "forest" && t.forestAmount > 0) hasForest = true;
          if (t.building === "lumberyard") hasLumberyard = true;
        }
      }
      return hasForest && hasLumberyard && !state.laws?.forestProtection;
    },
    choices: [
      {
        id: "forest_sign_law",
        text: "Firmar una ley de protección de bosques.",
        effects: (state) => {
          if (!state.laws) state.laws = {};
          state.laws.forestProtection = true;
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 5
            );
            state.relations.church = Math.min(
              100,
              state.relations.church + 6
            );
            state.relations.guilds = Math.max(
              0,
              state.relations.guilds - 4
            );
          }
        }
      },
      {
        id: "forest_allow_timber",
        text: "Permitir una tala más agresiva para los gremios.",
        effects: (state) => {
          // pequeño impulso de madera inmediato
          state.resources.wood += 25;
          if (state.relations) {
            state.relations.guilds = Math.min(
              100,
              state.relations.guilds + 8
            );
            state.relations.people = Math.max(
              0,
              state.relations.people - 6
            );
            state.relations.church = Math.max(
              0,
              state.relations.church - 4
            );
          }
        }
      }
    ]
  },
  {
    id: "forest_fire",
    title: "Incendio en el bosque",
    text:
      "Un incendio se ha declarado en un bosque cercano. Si se extiende, podría afectar a las reservas de madera.",
    condition: (state) =>
      hasTerrain(state, "forest") || state.resources.wood > 0,
    choices: [
      {
        id: "send_men",
        text: "Enviar hombres y recursos para apagarlo.",
        effects: (state) => {
          state.resources.wood = Math.max(0, state.resources.wood - 20);
          state.resources.gold = Math.max(0, state.resources.gold - 15);
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 5
            );
            state.relations.guilds = Math.min(
              100,
              state.relations.guilds + 3
            );
          }
        }
      },
      {
        id: "let_burn",
        text: "No intervenir, la naturaleza seguirá su curso.",
        effects: (state) => {
          state.resources.wood = Math.max(0, state.resources.wood - 40);
          if (state.relations) {
            state.relations.people = Math.max(
              0,
              state.relations.people - 4
            );
          }
        }
      }
    ]
  },
 
  // ======================
  // LEYES Y TRIBUTOS
  // ====================== 
  {
    id: "bridge_toll",
    title: "Peaje en el puente",
    text:
      "Algunos consejeros sugieren cobrar un pequeño peaje a quienes crucen el puente, " +
      "argumentando que el mantenimiento de la obra lo requiere.",
    condition: (state) => {
      // requiere al menos un puente construido
      for (let y = 0; y < state.tiles.length; y++) {
        for (let x = 0; x < state.tiles[y].length; x++) {
          if (state.tiles[y][x].building === "bridge") {
            return true;
          }
        }
      }
      return false;
    },
    choices: [
      {
        id: "bridge_toll_yes",
        text: "Imponer un peaje moderado.",
        effects: (state) => {
          state.resources.gold += 25;
          if (state.relations) {
            state.relations.people = Math.max(
              0,
              state.relations.people - 4
            );
            state.relations.crown = Math.min(
              100,
              state.relations.crown + 3
            );
          }
        }
      },
      {
        id: "bridge_toll_no",
        text: "Mantener el puente libre de peajes.",
        effects: (state) => {
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 4
            );
          }
        }
      }
    ]
  },
  {
  id: "advisor_census_law",
  title: "Propuesta de censo oficial",
  text:
    "Tu consejero propone realizar un censo de siervos, tierras y graneros. " +
    "Con buenos registros, dice, podrías ajustar mejor los impuestos y el reclutamiento.",
  condition: (state) => {
    const flags = state.flags || {};
    const laws = state.laws || {};
    // Solo si hay consejero y la ley aún no existe
    return flags.hasAdvisor && !laws.censusLaw;
  },
  choices: [
    {
      id: "census_law_approve",
      text: "Aprobar la ley de censo y registros.",
      effects: (state) => {
        if (!state.laws) state.laws = {};
        state.laws.censusLaw = true;

        state.resources.gold = Math.max(0, state.resources.gold - 20);

        if (state.relations) {
          // Mejor control fiscal: la Corona lo ve con buenos ojos
          state.relations.crown = Math.min(
            100,
            (state.relations.crown || 0) + 4
          );
          // El pueblo desconfía de tanto papel
          state.relations.people = Math.max(
            0,
            (state.relations.people || 0) - 3
          );
        }

        pushLog(
          state,
          "Decretas una ley de censo y registros. Escribanos y mensajeros recorren el señorío anotando nombres y campos."
        );
      }
    },
    {
      id: "census_law_reject",
      text: "Rechazar la propuesta, demasiado papeleo.",
      effects: (state) => {
        if (state.relations) {
          state.relations.crown = Math.max(
            0,
            (state.relations.crown || 0) - 2
          );
        }

        pushLog(
          state,
          "Descartas la idea de un censo formal. La administración seguirá siendo más flexible... y menos precisa."
        );
      }
    }
  ]
},
{
  id: "grain_price_law",
  title: "Control de precios del grano",
  text:
    "Tras varias malas cosechas, tu consejero plantea fijar un precio máximo para el grano. " +
    "Ayudaría a los pobres, pero los comerciantes se quejarán.",
  condition: (state) => {
    const laws = state.laws || {};
    const flags = state.flags || {};
    // Tiene sentido si hay consejero y granjeros / mercados activos
    const pop = state.resources?.population || 0;
    return (
      flags.hasAdvisor &&
      pop >= 25 &&
      !laws.grainPriceControl &&
      hasBuilding(state, ["farm"])
    );
  },
  choices: [
    {
      id: "grain_law_approve",
      text: "Aprobar el control de precios del grano.",
      effects: (state) => {
        if (!state.laws) state.laws = {};
        state.laws.grainPriceControl = true;

        if (state.relations) {
          state.relations.people = Math.min(
            100,
            (state.relations.people || 0) + 6
          );
          state.relations.guilds = Math.max(
            0,
            (state.relations.guilds || 0) - 5
          );
        }

        pushLog(
          state,
          "Decretas un precio máximo para el grano. Los campesinos pobres respiran aliviados, los mercaderes cuentan monedas con gesto oscuro."
        );
      }
    },
    {
      id: "grain_law_reject",
      text: "Rechazarlo, el mercado se regula solo.",
      effects: (state) => {
        if (state.relations) {
          state.relations.people = Math.max(
            0,
            (state.relations.people || 0) - 3
          );
          state.relations.guilds = Math.min(
            100,
            (state.relations.guilds || 0) + 2
          );
        }

        pushLog(
          state,
          "Decides no intervenir en el precio del grano. Los más pobres siguen temiendo no poder llenar el granero."
        );
      }
    }
  ]
},

  // ======================
  // DESASTRES ESTRUCTURALES
  // ======================
  {
    id: "wall_collapse",
    title: "Derrumbe en la muralla",
    text:
      "Una sección de la muralla muestra grietas desde hace días. Durante la noche, parte de la estructura se viene abajo con estruendo.",
    // Solo si existe al menos una pieza defensiva
    condition: (state) => hasBuilding(state, ["wall", "tower", "gate"]),
    choices: [
      {
        id: "repair_immediately",
        text: "Reparar de inmediato, cueste lo que cueste (reconstrucción a mitad de coste).",
        effects: (state) => {
          const tile = pickRandomBuildingTile(state, ["wall", "tower", "gate"]);
          if (!tile) return;

          const kind = tile.building || "wall";
          startHalfPriceRebuild(state, tile, kind);

          pushLog(
            state,
            "Los albañiles se ponen manos a la obra y comienzan a reconstruir de inmediato el tramo derrumbado, aprovechando parte de la piedra caída."
          );
        }
      },
      {
        id: "leave_for_later",
        text: "Aplazar la reparación: ya se arreglará más adelante.",
        effects: (state) => {
          const tile = pickRandomBuildingTile(state, ["wall", "tower", "gate"]);
          if (!tile) return;

          // El tramo queda simplemente derrumbado
          tile.building = null;
          tile.underConstruction = null;
          tile.buildRemainingDays = 0;

          if (state.relations) {
            state.relations.crown = Math.max(
              0,
              (state.relations.crown || 0) - 4
            );
            state.relations.people = Math.max(
              0,
              (state.relations.people || 0) - 2
            );
          }

          pushLog(
            state,
            "El derrumbe se deja sin reparar; los rumores sobre la debilidad de tus defensas empiezan a circular entre los vecinos."
          );
        }
      }
    ]
  },
   
   // ======================
  // COMERCIO
  // ======================
  
  {
    id: "merchant_trade_offer",
    title: "Caravana de mercaderes",
    text:
      "Una caravana de mercaderes llega al camino principal. Ofrecen pagar buen oro por parte de tus excedentes de recursos.",
    // Solo tiene sentido si tienes algo de sobra para vender
    condition: (state) => {
      const r = state.resources || {};
      const total =
        (r.wood || 0) + (r.stone || 0) + (r.food || 0);
      return total >= 40; // al menos algo acumulado
    },
    choices: [
      {
        id: "merchants_sell_wood_stone",
        text: "Vender madera y piedra sobrantes.",
        effects: (state) => {
          const r = state.resources;
          if (!r) return;

          // Vendes hasta 30 de madera y 20 de piedra
          const sellWood = Math.min(r.wood || 0, 30);
          const sellStone = Math.min(r.stone || 0, 20);

          // Precios aproximados: la piedra se paga mejor que la madera
          const income =
            Math.floor(sellWood * 0.5 + sellStone * 1.0);

          r.wood = (r.wood || 0) - sellWood;
          r.stone = (r.stone || 0) - sellStone;
          r.gold = (r.gold || 0) + income;

          if (state.relations) {
            // A los gremios les gusta que haya trato comercial
            state.relations.guilds = Math.min(
              100,
              state.relations.guilds + 4
            );
          }
        }
      },
      {
        id: "merchants_sell_food",
        text: "Vender parte de la cosecha almacenada.",
        effects: (state) => {
          const r = state.resources;
          if (!r) return;

          // Solo tiene sentido vender si hay bastante comida
          const sellFood = Math.min(r.food || 0, 40);
          const income = Math.floor(sellFood * 0.4);

          r.food = (r.food || 0) - sellFood;
          r.gold = (r.gold || 0) + income;

          if (state.relations) {
            // El pueblo no está muy contento si vendes comida
            state.relations.people = Math.max(
              0,
              state.relations.people - 3
            );
          }
        }
      },
      {
        id: "merchants_refuse",
        text: "Rechazar la oferta, los recursos se quedan en el castillo.",
        effects: (state) => {
          if (state.relations) {
            // El pueblo aprecia la prudencia, los gremios se aburren un poco
            state.relations.people = Math.min(
              100,
              state.relations.people + 2
            );
            state.relations.guilds = Math.max(
              0,
              state.relations.guilds - 1
            );
          }
        }
      }
    ]
  },
 
  // ======================
  // SOLDADESCA
  // ======================
  
  {
    id: "soldiers_tournament",
    title: "Torneo de armas",
    text:
      "Los capitanes proponen un torneo de armas para mantener a la tropa en forma y mostrar poder ante la nobleza vecina.",
    condition: (state) => (state.labor.soldiers || 0) >= 3,
    choices: [
      {
        id: "tournament_hold",
        text: "Celebrar el torneo.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 40);
          if (state.relations) {
            state.relations.crown = Math.min(
              100,
              state.relations.crown + 8
            );
            state.relations.people = Math.min(
              100,
              state.relations.people + 4
            );
          }
        }
      },
      {
        id: "tournament_cancel",
        text: "Rechazarlo: no hay fondos para fiestas.",
        effects: (state) => {
          if (state.relations) {
            state.relations.crown = Math.max(
              0,
              state.relations.crown - 6
            );
          }
        }
      }
    ]
  },

  // ======================
  // MERCADO / FIESTAS
  // ======================
  {
    id: "market_fair",
    title: "Feria de mercado",
    text:
      "Los mercaderes proponen organizar una feria alrededor del castillo. " +
      "Atraería oro, pero exigiría asegurar comida y protección.",
    condition: (state) =>
      hasPopulationAtLeast(state, 10) && state.relations.guilds >= 30,
    choices: [
      {
        id: "host_fair",
        text: "Patrocinar la feria.",
        effects: (state) => {
          state.resources.food = Math.max(0, state.resources.food - 25);
          state.resources.gold += 60;
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 6
            );
            state.relations.guilds = Math.min(
              100,
              state.relations.guilds + 4
            );
          }
        }
      },
      {
        id: "decline_fair",
        text: "Declinar la feria, hay demasiados riesgos.",
        effects: (state) => {
          if (state.relations) {
            state.relations.guilds = Math.max(
              0,
              state.relations.guilds - 4
            );
          }
        }
      }
    ]
  },
  
   // ======================
  // CONSEJERO
  // ======================
  
  {
  id: "advisor_arrival",
  title: "Un consejero se ofrece al servicio del castillo",
  text:
    "Un escribano con experiencia en cuentas y leyes se presenta en el castillo. " +
    "Afirma que podría encargarse de la administración y aconsejarte en asuntos de gobierno.",
  condition: (state) => {
    const servants = state.labor?.servants || 0;
    const flags = state.flags || {};
    // Solo una vez, y cuando ya hay cierto aparato de servicio
    return servants >= 2 && !flags.hasAdvisor;
  },
  choices: [
    {
      id: "advisor_accept",
      text: "Aceptar al consejero y darle un pequeño salario.",
      effects: (state) => {
        if (!state.flags) state.flags = {};
        state.flags.hasAdvisor = true;

        state.resources.gold = Math.max(0, state.resources.gold - 15);
        if (state.relations) {
          state.relations.crown = Math.min(
            100,
            (state.relations.crown || 0) + 3
          );
          state.relations.guilds = Math.min(
            100,
            (state.relations.guilds || 0) + 2
          );
        }

        pushLog(
          state,
          "Aceptas al consejero como parte de tu séquito. A partir de ahora tendrás una voz experta en leyes y cuentas."
        );
      }
    },
    {
      id: "advisor_refuse",
      text: "Rechazarlo, no necesitas burócratas.",
      effects: (state) => {
        if (!state.flags) state.flags = {};
        state.flags.hasAdvisor = false;

        if (state.relations) {
          state.relations.people = Math.min(
            100,
            (state.relations.people || 0) + 1
          );
          state.relations.crown = Math.max(
            0,
            (state.relations.crown || 0) - 2
          );
        }

        pushLog(
          state,
          "Rechazas al consejero. Algunos nobles murmuran que gobiernas más con instinto que con administración."
        );
      }
    }
  ]
},
  {
    id: "night_watch_law",
    title: "Patrullas nocturnas en la villa",
    text:
      "Tu consejero sugiere organizar patrullas nocturnas por las calles y alrededores del castillo. " +
      "Dice que ahuyentará a bandidos y rateros, pero exigirá más disciplina y gasto en la guarnición.",
    condition: (state) => {
      const flags = state.flags || {};
      const laws = state.laws || {};
      const pop = state.resources?.population || 0;
      // Solo tiene sentido si hay consejero, algo de población y aún no existe la ley
      return (
        flags.hasAdvisor &&
        pop >= 25 &&
        !laws.nightWatchLaw &&
        (state.labor?.soldiers || 0) > 0
      );
    },
    choices: [
      {
        id: "night_watch_approve",
        text: "Aprobar las patrullas nocturnas.",
        effects: (state) => {
          if (!state.laws) state.laws = {};
          state.laws.nightWatchLaw = true;

          // Coste inicial en oro (equipar y organizar)
          state.resources.gold = Math.max(
            0,
            (state.resources.gold || 0) - 15
          );

          if (state.relations) {
            // Orden y seguridad agradan a la Corona y al pueblo
            state.relations.crown = Math.min(
              100,
              (state.relations.crown || 0) + 3
            );
            state.relations.people = Math.min(
              100,
              (state.relations.people || 0) + 2
            );
            // Los gremios no siempre aprecian más control
            state.relations.guilds = Math.max(
              0,
              (state.relations.guilds || 0) - 2
            );
          }

          if (typeof state.unrest !== "number") state.unrest = 0;
          state.unrest = Math.max(0, state.unrest - 2);

          pushLog(
            state,
            "Ordenas organizar patrullas nocturnas. Las antorchas de la guardia recorren las calles hasta la madrugada."
          );
        }
      },
      {
        id: "night_watch_reject",
        text: "Rechazar la idea, no hace falta tanto control.",
        effects: (state) => {
          if (state.relations) {
            state.relations.crown = Math.max(
              0,
              (state.relations.crown || 0) - 2
            );
            state.relations.people = Math.max(
              0,
              (state.relations.people || 0) - 1
            );
            state.relations.guilds = Math.min(
              100,
              (state.relations.guilds || 0) + 1
            );
          }

          pushLog(
            state,
            "Decides no organizar patrullas nocturnas. La vida en la villa sigue como siempre, con sus sombras y sus secretos."
          );
        }
      }
    ]
  },
  {
    id: "weekly_market_charter",
    title: "Carta de mercado semanal",
    text:
      "Tu consejero propone solicitar a la Corona una carta que reconozca un mercado semanal en tus tierras. " +
      "Atraería mercaderes y movimiento, pero también más ruido y disputas.",
    condition: (state) => {
      const flags = state.flags || {};
      const pop = state.resources?.population || 0;
      // Solo una vez, con algo de población y cierta actividad agrícola
      return (
        pop >= 20 &&
        !flags.weeklyMarketCharterGranted &&
        hasBuilding(state, ["farm", "mill"])
      );
    },
    choices: [
      {
        id: "weekly_market_approve",
        text: "Solicitar y proclamar el mercado semanal.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.weeklyMarketCharterGranted = true;

          if (!state.laws) state.laws = {};
          state.laws.weeklyMarketLaw = true;

          // Llegan comerciantes, algo de oro inmediato
          state.resources.gold =
            (state.resources.gold || 0) + 25;

          if (state.relations) {
            state.relations.guilds = Math.min(
              100,
              (state.relations.guilds || 0) + 5
            );
            state.relations.people = Math.min(
              100,
              (state.relations.people || 0) + 3
            );
            state.relations.crown = Math.min(
              100,
              (state.relations.crown || 0) + 1
            );
          }

          if (typeof state.prestige !== "number")
            state.prestige = 0;
          state.prestige += 3;

          pushLog(
            state,
            "Se proclama un mercado semanal en tus tierras. Los puestos de telas, especias y ganado llenan la plaza cada siete días."
          );
        }
      },
      {
        id: "weekly_market_reject",
        text: "Rechazar la idea, demasiado alboroto.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.weeklyMarketCharterGranted = true;

          if (state.relations) {
            state.relations.guilds = Math.max(
              0,
              (state.relations.guilds || 0) - 3
            );
            state.relations.people = Math.max(
              0,
              (state.relations.people || 0) - 1
            );
          }

          pushLog(
            state,
            "Decides no establecer un mercado semanal. Los comerciantes buscarán otras plazas donde montar sus puestos."
          );
        }
      }
    ]
  },
  {
    id: "pilgrim_hospitality_law",
    title: "Hospitalidad para peregrinos",
    text:
      "Tu clérigo propone dedicar parte de las dependencias cercanas a la iglesia para acoger peregrinos y pobres viajeros. " +
      "Dice que traerá bendiciones, pero consumirá recursos.",
    condition: (state) => {
      const laws = state.laws || {};
      const flags = state.flags || {};
      // Tiene sentido si hay clérigo oficial o edificios religiosos importantes
      return (
        !laws.pilgrimHospitium &&
        (flags.hasCleric ||
          hasBuilding(state, ["church", "monastery"]))
      );
    },
    choices: [
      {
        id: "pilgrim_hospitium_approve",
        text: "Establecer un hospicio para peregrinos.",
        effects: (state) => {
          if (!state.laws) state.laws = {};
          state.laws.pilgrimHospitium = true;

          // Inversión inicial en alimento y mantenimiento
          state.resources.food = Math.max(
            0,
            (state.resources.food || 0) - 15
          );
          state.resources.gold = Math.max(
            0,
            (state.resources.gold || 0) - 10
          );

          if (state.relations) {
            state.relations.church = Math.min(
              100,
              (state.relations.church || 0) + 6
            );
            state.relations.people = Math.min(
              100,
              (state.relations.people || 0) + 3
            );
          }

          if (typeof state.prestige !== "number")
            state.prestige = 0;
          state.prestige += 4;

          pushLog(
            state,
            "Abres un hospicio para peregrinos y pobres en las cercanías de la iglesia. Cuentan que el nombre de tu castillo empieza a sonar en tierras lejanas."
          );
        }
      },
      {
        id: "pilgrim_hospitium_reject",
        text: "Rechazarlo, las reservas son para tu pueblo.",
        effects: (state) => {
          if (state.relations) {
            state.relations.church = Math.max(
              0,
              (state.relations.church || 0) - 4
            );
            state.relations.people = Math.max(
              0,
              (state.relations.people || 0) - 1
            );
          }

          pushLog(
            state,
            "Rechazas dedicar recursos a un hospicio de peregrinos. El clérigo suspira y algunos viajeros siguen de largo sin detenerse."
          );
        }
      }
    ]
  },
  {
    id: "prestige_festival",
    title: "Fiesta en honor a tu prestigio",
    text:
      "Tus consejeros señalan que tu nombre es cada vez más conocido. " +
      "Proponen organizar una gran fiesta para celebrar tu prestigio y reforzar la lealtad de tus vasallos.",
    condition: (state) => {
      const p =
        typeof state.prestige === "number" ? state.prestige : 0;
      const flags = state.flags || {};
      const gold = state.resources?.gold || 0;
      const food = state.resources?.food || 0;
      return (
        p >= 80 &&
        gold >= 30 &&
        food >= 30 &&
        !flags.prestigeFestivalHeld
      );
    },
    choices: [
      {
        id: "festival_celebrate",
        text: "Organizar una gran fiesta para todo el señorío.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.prestigeFestivalHeld = true;

          state.resources.gold = Math.max(
            0,
            (state.resources.gold || 0) - 40
          );
          state.resources.food = Math.max(
            0,
            (state.resources.food || 0) - 35
          );

          if (state.relations) {
            state.relations.people = Math.min(
              100,
              (state.relations.people || 0) + 8
            );
            state.relations.guilds = Math.min(
              100,
              (state.relations.guilds || 0) + 4
            );
            state.relations.crown = Math.min(
              100,
              (state.relations.crown || 0) + 2
            );
          }

          if (typeof state.unrest !== "number") state.unrest = 0;
          state.unrest = Math.max(0, state.unrest - 6);

          if (typeof state.prestige !== "number")
            state.prestige = 0;
          state.prestige += 5;

          pushLog(
            state,
            "Organizas una gran fiesta en patios y plazas. Durante días se habla de banquetes, justas menores y canciones en honor a tu nombre."
          );
        }
      },
      {
        id: "festival_refuse",
        text: "No es momento para festejos; hay que ahorrar.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.prestigeFestivalHeld = true;

          if (state.relations) {
            state.relations.people = Math.max(
              0,
              (state.relations.people || 0) - 3
            );
            state.relations.guilds = Math.max(
              0,
              (state.relations.guilds || 0) - 1
            );
          }

          if (typeof state.prestige !== "number")
            state.prestige = 0;
          state.prestige += 1;

          pushLog(
            state,
            "Rechazas organizar una gran fiesta, alegando prudencia. Algunos vasallos hablan de tu sensatez; otros te tachan de tacaño."
          );
        }
      }
    ]
  },
  {
    id: "overlord_inspection",
    title: "Inspección del señor superior",
    text:
      "Tras tus recientes desavenencias, tu señor superior envía un pequeño séquito para inspeccionar el castillo y tus fuerzas.",
    condition: (state) => {
      const flags = state.flags || {};
      const relOverlord =
        state.relations?.overlord ?? 50;
      return (
        flags.overlordAngered &&
        !flags.overlordInspectionDone &&
        state.day >= 150 &&
        relOverlord <= 60
      );
    },
    choices: [
      {
        id: "inspection_show_strength",
        text: "Mostrar fuerza y opulencia ante el séquito.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.overlordInspectionDone = true;

          state.resources.gold = Math.max(
            0,
            (state.resources.gold || 0) - 30
          );
          state.resources.food = Math.max(
            0,
            (state.resources.food || 0) - 15
          );

          if (state.relations) {
            // Tu señor recela de tu poder creciente
            state.relations.overlord = Math.max(
              0,
              (state.relations.overlord || 0) - 5
            );
            state.relations.crown = Math.max(
              0,
              (state.relations.crown || 0) - 3
            );
            state.relations.people = Math.min(
              100,
              (state.relations.people || 0) + 3
            );
          }

          if (typeof state.prestige !== "number")
            state.prestige = 0;
          state.prestige += 6;

          pushLog(
            state,
            "Recibes al séquito de tu señor con todo el boato posible. Tus soldados lucen impecables y los almacenes parecen rebosar. Algunos se preguntan cuánto tiempo aceptarás seguir siendo vasallo."
          );
        }
      },
      {
        id: "inspection_show_humility",
        text: "Mostrar humildad y obediencia.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.overlordInspectionDone = true;

          state.resources.gold = Math.max(
            0,
            (state.resources.gold || 0) - 10
          );

          if (state.relations) {
            state.relations.overlord = Math.min(
              100,
              (state.relations.overlord || 0) + 10
            );
            state.relations.crown = Math.min(
              100,
              (state.relations.crown || 0) + 4
            );
            state.relations.people = Math.max(
              0,
              (state.relations.people || 0) - 2
            );
          }

          if (typeof state.prestige !== "number")
            state.prestige = 0;
          state.prestige += 2;

          pushLog(
            state,
            "Recibes al séquito con deferencia, subrayando tu obediencia. Tu señor parece satisfecho, aunque algunos de tus hombres habrían preferido una muestra de mayor orgullo."
          );
        }
      }
    ]
  },
  
  // ======================
  // CONFLICTOS BELICOS
  // ======================
  {
    id: "bandits_raid",
    title: "Bandidos en las rutas de comercio",
    text:
      "Un grupo de bandidos ha sido avistado cerca de las rutas de comercio. " +
      "Podrían atacar a los mercaderes y saquear caravanas cargadas de mercancías.",
    condition: (state) =>
      state.day >= 5 &&
      (state.resources.food > 0 || state.resources.gold > 0),
    choices: [
      {
        id: "bandits_send_soldiers",
        text: "Enviar soldados a proteger las caravanas.",
        effects: (state) => {
          const defense = computeDefenseScore(state);

          if (defense >= 12) {
            // Buena defensa: daño menor, los mercaderes quedan contentos
            const lostGold = Math.min(state.resources.gold, 10);
            state.resources.gold -= lostGold;

            if (state.relations) {
              state.relations.crown = Math.min(
                100,
                state.relations.crown + 2
              );
              state.relations.guilds = Math.min(
                100,
                state.relations.guilds + 4
              );
              state.relations.people = Math.min(
                100,
                state.relations.people + 1
              );
            }

            pushLog(
              state,
              `Tus soldados escoltan las caravanas y dispersan a los bandidos. Solo se pierden ${lostGold} de oro en los altercados menores.`
            );
          } else {
            // Defensa floja: los bandidos alcanzan parte del convoy
            const stolenGold = Math.min(state.resources.gold, 25);
            const stolenFood = Math.min(state.resources.food, 15);
            state.resources.gold -= stolenGold;
            state.resources.food -= stolenFood;

            if (state.relations) {
              state.relations.guilds = Math.max(
                0,
                state.relations.guilds - 5
              );
              state.relations.people = Math.max(
                0,
                state.relations.people - 2
              );
            }

            pushLog(
              state,
              `Tus hombres no bastan para proteger todas las rutas: los bandidos saquean caravanas por valor de ${stolenGold} de oro y ${stolenFood} de comida.`
            );
          }
        }
      },
      {
        id: "bandits_pay_off",
        text: "Pagarles algo de oro para que dejen en paz a los mercaderes.",
        effects: (state) => {
          const cost = Math.min(state.resources.gold, 25);
          state.resources.gold -= cost;

          if (state.relations) {
            // Los gremios desconfían, el pueblo ve debilidad
            state.relations.guilds = Math.max(
              0,
              state.relations.guilds - 3
            );
            state.relations.people = Math.max(
              0,
              state.relations.people - 1
            );
          }

          pushLog(
            state,
            `Entregas ${cost} de oro a los cabecillas de los bandidos para que dejen pasar a las caravanas. Los mercaderes suspiran aliviados, pero murmuran sobre tu falta de mano dura.`
          );
        }
      }
    ]
  },
  {
    id: "bandit_raid",
    title: "Incursión de bandidos en el castillo",
    text:
      "Una partida de bandidos ha sido vista merodeando cerca de tus granjas y almacenes. " +
      "Algunos consejeros proponen salir a su encuentro, otros sugieren pagar para evitar un saqueo.",
    condition: (state) =>
      state.day >= 8 &&
      (state.resources.food > 0 || state.resources.gold > 0),
    choices: [
      {
        id: "castle_bandits_send_soldiers",
        text: "Enviar tropas a interceptarlos antes de que se acerquen al castillo.",
        effects: (state) => {
          const defense = computeDefenseScore(state);

          if (defense >= 15) {
            // Buena defensa: los ahuyentas casi sin pérdidas
            const lostFood = Math.min(state.resources.food, 8);
            state.resources.food -= lostFood;

            if (state.relations) {
              state.relations.crown = Math.min(
                100,
                state.relations.crown + 3
              );
              state.relations.people = Math.min(
                100,
                state.relations.people + 3
              );
            }

            pushLog(
              state,
              `Tus hombres sorprenden a los bandidos en campo abierto y los dispersan. Solo se consumen ${lostFood} de comida en las marchas y guardias extras.`
            );
          } else {
            // Defensa floja: llegan a los alrededores del castillo
            const stolenGold = Math.min(state.resources.gold, 20);
            const stolenFood = Math.min(state.resources.food, 25);
            state.resources.gold -= stolenGold;
            state.resources.food -= stolenFood;

            if (state.relations) {
              state.relations.people = Math.max(
                0,
                state.relations.people - 5
              );
              state.relations.crown = Math.max(
                0,
                state.relations.crown - 2
              );
            }

            pushLog(
              state,
              `Pese a tus esfuerzos, los bandidos alcanzan los alrededores del castillo y saquean graneros y dependencias menores: pierdes ${stolenGold} de oro y ${stolenFood} de comida.`
            );
          }
        }
      },
      {
        id: "castle_bandits_bribe",
        text: "Pagarles para que se retiren sin acercarse a los muros.",
        effects: (state) => {
          const cost = Math.min(state.resources.gold, 30);
          state.resources.gold -= cost;

          if (state.relations) {
            // El pueblo agradece evitar el combate, pero la Corona no tanto
            state.relations.people = Math.min(
              100,
              state.relations.people + 1
            );
            state.relations.crown = Math.max(
              0,
              state.relations.crown - 4
            );
          }

          pushLog(
            state,
            `Ordenas pagar ${cost} de oro a los bandidos para que se alejen del castillo. No hay saqueo, pero algunos se preguntan cuánto tiempo podrás seguir comprando la paz.`
          );
        }
      }
    ]
  },
  {
    id: "neighbor_lord_attack",
    title: "Ataque del señor vecino",
    text:
      "Un señor vecino envidioso del castillo moviliza una fuerza para poner a prueba tus defensas.",
    condition: (state) => {
      if (state.day < 15) return false;
      // Solo tiene sentido si hay alguna muralla o torre
      const tiles = state.tiles || [];
      let hasDefense = false;
      for (let y = 0; y < tiles.length; y++) {
        const row = tiles[y];
        for (let x = 0; x < row.length; x++) {
          const b = row[x].building;
          if (b === "wall" || b === "tower" || b === "gate") {
            hasDefense = true;
            break;
          }
        }
        if (hasDefense) break;
      }
      return hasDefense;
    },
    choices: [
{
        id: "defend_behind_walls",
        text: "Cerrar las puertas y defenderse tras las murallas.",
        effects: (state) => {
          const defense = computeDefenseScore(state);

          // Escalado por días jugados: a más tiempo, más exigente
          const day = state.day || 0;
          const years = day / 365; // aprox. años de juego

          // Umbrales dinámicos
          const strongThreshold = 20 + Math.floor(years * 15);
          const mediumThreshold = 10 + Math.floor(years * 8);

          // Calidad de la guarnición respecto a lo esperado
          const pop = state.resources.population || 0;
          const soldiers = state.labor?.soldiers || 0;
          let required = 0;
          if (pop >= 30) {
            // mismo criterio que en onNewDay: 1 soldado por cada 15 hab.
            required = Math.ceil(pop / 15);
          }

          let riskFactor = 0; // 0 = guarnición suficiente, 1 = muy insuficiente
          if (required > 0 && soldiers < required) {
            riskFactor = Math.min(1, 1 - soldiers / required);
          }

          // Probabilidades base según defensa
          let pGood, pMed, pBad;
          if (defense >= strongThreshold) {
            // Castillo muy fuerte para este momento de la partida
            pGood = 0.8;
            pMed = 0.18;
            pBad = 0.02;
          } else if (defense >= mediumThreshold) {
            // Defensa aceptable
            pGood = 0.3;
            pMed = 0.5;
            pBad = 0.2;
          } else {
            // Defensa floja para el momento actual
            pGood = 0.05;
            pMed = 0.35;
            pBad = 0.6;
          }

          // Ajuste por guarnición insuficiente: si faltan soldados, sube el riesgo
          const extraBad = 0.3 * riskFactor;
          const extraMed = 0.1 * riskFactor;
          pBad += extraBad;
          pMed += extraMed;
          pGood -= extraBad + extraMed;

          // Normalizar / limitar por seguridad
          const clamp01 = (v) => Math.max(0, Math.min(1, v));
          pGood = clamp01(pGood);
          pMed = clamp01(pMed);
          pBad = clamp01(pBad);
          const sum = pGood + pMed + pBad || 1;
          pGood /= sum;
          pMed /= sum;
          pBad /= sum;

          const roll = Math.random();
          let outcome;
          if (roll < pGood) outcome = "good";
          else if (roll < pGood + pMed) outcome = "medium";
          else outcome = "bad";

          // Helper interno para bajas de población
          const applyCasualties = (baseMin, baseMax) => {
            const popBefore = state.resources.population || 0;
            if (popBefore <= 0) return 0;

            // Aumenta el máximo con el riesgo por falta de guarnición
            const extra = Math.round(baseMax * riskFactor);
            const maxCas = Math.min(popBefore, baseMax + extra);
            const minCas = Math.min(baseMin, maxCas);

            if (maxCas <= 0) return 0;

            const casualties =
              minCas +
              Math.floor(Math.random() * (maxCas - minCas + 1));

            state.resources.population = Math.max(
              0,
              popBefore - casualties
            );

            if (state.relations && casualties > 0) {
              state.relations.people = Math.max(
                0,
                (state.relations.people || 0) -
                  Math.min(8, casualties)
              );
            }

            return casualties;
          };

          if (outcome === "good") {
            // Defensa fuerte para el momento actual: repeles el ataque
            const lostFood = Math.min(state.resources.food, 10);
            state.resources.food -= lostFood;

            const casualties = applyCasualties(0, 2);

            if (state.relations) {
              state.relations.crown = Math.min(
                100,
                (state.relations.crown || 0) + 5
              );
              state.relations.people = Math.min(
                100,
                (state.relations.people || 0) + 3
              );
            }

            const extraMsg =
              casualties > 0
                ? ` Se lamentan ${casualties} bajas entre tus gentes en las escaramuzas.`
                : "";
            pushLog(
              state,
              "Los ballesteros desde las murallas y un par de salidas bien calculadas hacen retroceder al señor vecino. El asedio se rompe con pocas pérdidas en tus filas." +
                extraMsg
            );
          } else if (outcome === "medium") {
            // Defensa justa: se sufre, pero aguantas
            const lostGold = Math.min(state.resources.gold, 25);
            const lostFood = Math.min(state.resources.food, 20);
            state.resources.gold -= lostGold;
            state.resources.food -= lostFood;

            const casualties = applyCasualties(1, 4);

            if (state.relations) {
              state.relations.crown = Math.min(
                100,
                (state.relations.crown || 0) + 2
              );
              state.relations.people = Math.max(
                0,
                (state.relations.people || 0) - 2
              );
            }

            const extraMsg =
              casualties > 0
                ? ` Se cuentan ${casualties} muertos o heridos graves entre campesinos y sirvientes.`
                : "";
            pushLog(
              state,
              `El asedio se levanta tras varios días de tensión. Se gastan ${lostGold} de oro y ${lostFood} de comida en sobornos, reparaciones rápidas y mantener a la guarnición en pie.` +
                extraMsg
            );
          } else {
            // Defensa floja: brecha en la muralla + saqueo y más bajas
            const destroyed = collapseRandomDefenseSegments(state, 2);
            const lostGold = Math.min(state.resources.gold, 40);
            const lostFood = Math.min(state.resources.food, 35);
            state.resources.gold -= lostGold;
            state.resources.food -= lostFood;

            const casualties = applyCasualties(2, 8);

            if (state.relations) {
              state.relations.crown = Math.max(
                0,
                (state.relations.crown || 0) - 6
              );
              state.relations.people = Math.max(
                0,
                (state.relations.people || 0) - 6
              );
              state.relations.guilds = Math.max(
                0,
                (state.relations.guilds || 0) - 4
              );
            }

            const segMsg =
              destroyed > 0
                ? ` Durante el asalto se abren ${destroyed} brechas en la muralla.`
                : "";
            const extraMsg =
              casualties > 0
                ? ` Entre el caos del saqueo se pierden ${casualties} habitantes.`
                : "";
            pushLog(
              state,
              `El ataque del señor vecino desborda a tu guarnición: se pierden ${lostGold} de oro y ${lostFood} de comida en el saqueo.${segMsg}${extraMsg}`
            );
          }
        }
      },
      {
        id: "bribe_neighbor",
        text: "Enviar regalos y oro para apaciguar al vecino.",
        effects: (state) => {
          const cost = Math.min(state.resources.gold, 50);
          state.resources.gold -= cost;

          if (state.relations) {
            state.relations.crown = Math.min(
              100,
              (state.relations.crown || 0) + 2
            );
            state.relations.people = Math.max(
              0,
              (state.relations.people || 0) - 3
            );
          }

          pushLog(
            state,
            `Carromatos cargados de vino, telas y ${cost} de oro cruzan la frontera. El señor vecino se calma por ahora, pero tus vasallos se preguntan cuánto durará esa paz comprada.`
          );
        }
      }
    ]
  },
  {
    id: "overlord_punitive_attack",
    title: "Castigo de tu señor",
    text:
      "Tu señor, harto de tus desobediencias y de la débil lealtad mostrada hacia la Corona, " +
      "envía un poderoso ejército para someter el castillo y dar ejemplo al resto del reino.",
    condition: (state) => {
      const crownRel =
        state.relations && typeof state.relations.crown === "number"
          ? state.relations.crown
          : 50;
      const day = state.day || 0;
      const flags = state.flags || {};

      // Solo una vez, relación con Corona muy baja, partida ya avanzada
      return (
        !flags.overlordPunitiveAttackDone &&
        crownRel < 5 &&
        day >= 365 // al menos "un año" de juego
      );
    },
    choices: [
      {
        id: "overlord_stand_and_fight",
        text: "Cerrar filas y resistir hasta el final.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.overlordPunitiveAttackDone = true;

          const defense = computeDefenseScore(state);

          const day = state.day || 0;
          const years = day / 365; // escalar con la duración de la partida

          // Umbrales exigentes: es un ejército serio, no un vecino envidioso
          const strongThreshold = 40 + Math.floor(years * 20);
          const mediumThreshold = 20 + Math.floor(years * 12);

          // Riesgo según guarnición insuficiente (mismo criterio que en onNewDay)
          const pop = state.resources.population || 0;
          const soldiers = state.labor?.soldiers || 0;
          let required = 0;
          if (pop >= 30) {
            required = Math.ceil(pop / 15);
          }

          let riskFactor = 0;
          if (required > 0 && soldiers < required) {
            riskFactor = Math.min(1, 1 - soldiers / required);
          }

          // Probabilidades base según defensa
          let pGood, pMed, pBad;
          if (defense >= strongThreshold) {
            // Castillo muy fuerte incluso para este ataque
            pGood = 0.6;
            pMed = 0.3;
            pBad = 0.1;
          } else if (defense >= mediumThreshold) {
            // Defensa razonable, pero el enemigo es serio
            pGood = 0.2;
            pMed = 0.5;
            pBad = 0.3;
          } else {
            // Defensa floja para un castigo real
            pGood = 0.05;
            pMed = 0.25;
            pBad = 0.7;
          }

          // Ajuste por guarnición insuficiente: más riesgo si faltan soldados
          const extraBad = 0.35 * riskFactor;
          const extraMed = 0.15 * riskFactor;
          pBad += extraBad;
          pMed += extraMed;
          pGood -= extraBad + extraMed;

          const clamp01 = (v) => Math.max(0, Math.min(1, v));
          pGood = clamp01(pGood);
          pMed = clamp01(pMed);
          pBad = clamp01(pBad);
          const sum = pGood + pMed + pBad || 1;
          pGood /= sum;
          pMed /= sum;
          pBad /= sum;

          const roll = Math.random();
          let outcome;
          if (roll < pGood) outcome = "good";
          else if (roll < pGood + pMed) outcome = "medium";
          else outcome = "bad";

          // Helper para bajas de población
          const applyCasualties = (baseMin, baseMax) => {
            const popBefore = state.resources.population || 0;
            if (popBefore <= 0) return 0;

            const extra = Math.round(baseMax * riskFactor);
            const maxCas = Math.min(popBefore, baseMax + extra);
            const minCas = Math.min(baseMin, maxCas);

            if (maxCas <= 0) return 0;

            const casualties =
              minCas +
              Math.floor(Math.random() * (maxCas - minCas + 1));

            state.resources.population = Math.max(
              0,
              popBefore - casualties
            );

            if (state.relations && casualties > 0) {
              state.relations.people = Math.max(
                0,
                (state.relations.people || 0) -
                  Math.min(12, casualties)
              );
            }

            return casualties;
          };

          if (outcome === "good") {
            // Resistes heroicamente el castigo del señor
            const lostGold = Math.min(state.resources.gold, 40);
            const lostFood = Math.min(state.resources.food, 40);
            state.resources.gold -= lostGold;
            state.resources.food -= lostFood;

            const casualties = applyCasualties(5, 15);

            if (state.relations) {
              // La Corona te odia aún más, pero el pueblo y gremios te admiran
              state.relations.crown = Math.max(
                0,
                (state.relations.crown || 0) - 5
              );
              state.relations.people = Math.min(
                100,
                (state.relations.people || 0) + 8
              );
              state.relations.guilds = Math.min(
                100,
                (state.relations.guilds || 0) + 5
              );
            }

            if (typeof state.prestige !== "number") state.prestige = 0;
            state.prestige += 10;

            const extraMsg =
              casualties > 0
                ? ` El precio es alto: se cuentan ${casualties} muertos entre campesinos y defensores.`
                : "";
            pushLog(
              state,
              `Contra todo pronóstico, tus muros y tu gente resisten el castigo del señor superior. Se pierden ${lostGold} de oro y ${lostFood} de comida, pero el castillo no cae.` +
                extraMsg
            );
          } else if (outcome === "medium") {
            // Aguantas por los pelos: el castillo no cae, pero queda destrozado
            const lostGold = Math.min(state.resources.gold, 70);
            const lostFood = Math.min(state.resources.food, 60);
            state.resources.gold -= lostGold;
            state.resources.food -= lostFood;

            const casualties = applyCasualties(10, 25);
            const destroyed = collapseRandomDefenseSegments(state, 3);

            if (state.relations) {
              state.relations.crown = Math.max(
                0,
                (state.relations.crown || 0) - 2
              );
              state.relations.people = Math.max(
                0,
                (state.relations.people || 0) - 5
              );
              state.relations.guilds = Math.max(
                0,
                (state.relations.guilds || 0) - 3
              );
            }

            if (typeof state.prestige !== "number") state.prestige = 0;
            state.prestige += 5;

            const segMsg =
              destroyed > 0
                ? ` Varias secciones de muralla y torres quedan en ruinas (${destroyed} tramos destruidos).`
                : "";
            const extraMsg =
              casualties > 0
                ? ` Se lloran ${casualties} muertos entre tus habitantes.`
                : "";
            pushLog(
              state,
              `El castillo sobrevive al castigo del señor superior, pero a un coste terrible: se pierden ${lostGold} de oro y ${lostFood} de comida.` +
                segMsg +
                extraMsg
            );
          } else {
            // El castillo es prácticamente arrasado
            const lostGold = Math.min(state.resources.gold, 100);
            const lostFood = Math.min(state.resources.food, 80);
            state.resources.gold -= lostGold;
            state.resources.food -= lostFood;

            const casualties = applyCasualties(20, 40);
            const destroyed = collapseRandomDefenseSegments(state, 5);

            if (state.relations) {
              // La Corona "restablece el orden", pero tu nombre queda manchado y tu pueblo destrozado
              state.relations.crown = Math.min(
                100,
                (state.relations.crown || 0) + 5
              );
              state.relations.people = Math.max(
                0,
                (state.relations.people || 0) - 10
              );
              state.relations.guilds = Math.max(
                0,
                (state.relations.guilds || 0) - 6
              );
            }

            if (typeof state.prestige !== "number") state.prestige = 0;
            state.prestige = Math.max(0, state.prestige - 10);

            const segMsg =
              destroyed > 0
                ? ` Amplios tramos de muralla, puertas y torres quedan arrasados (${destroyed} secciones destruidas).`
                : "";
            const extraMsg =
              casualties > 0
                ? ` Se pierden ${casualties} vidas en la destrucción.`
                : "";
            pushLog(
              state,
              `El ejército del señor superior arrasa tus defensas y saquea a fondo el castillo: se pierden ${lostGold} de oro y ${lostFood} de comida.` +
                segMsg +
                extraMsg
            );
          }
        }
      },
      {
        id: "overlord_submit",
        text: "Rendirse y jurar obediencia absoluta al señor.",
        effects: (state) => {
          if (!state.flags) state.flags = {};
          state.flags.overlordPunitiveAttackDone = true;

          const costGold = Math.min(state.resources.gold, 80);
          state.resources.gold -= costGold;

          const costFood = Math.min(state.resources.food, 40);
          state.resources.food -= costFood;

          if (state.relations) {
            state.relations.crown = Math.min(
              100,
              (state.relations.crown || 0) + 20
            );
            state.relations.people = Math.max(
              0,
              (state.relations.people || 0) - 8
            );
            state.relations.guilds = Math.max(
              0,
              (state.relations.guilds || 0) - 4
            );
          }

          if (typeof state.prestige !== "number") state.prestige = 0;
          state.prestige = Math.max(0, state.prestige - 15);

          pushLog(
            state,
            `Abres las puertas del castillo, entregas ${costGold} de oro y ${costFood} de comida y te postras ante tu señor. La Corona te concede el perdón, pero tu reputación queda profundamente dañada a ojos de tus vasallos.`
          );
        }
      }
    ]
  }
];