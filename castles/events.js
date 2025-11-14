// events.js

// ========= Helpers internos ===========

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
  return walls + gates * 2 + towers * 3 + soldiers * 2;
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

export const SAMPLE_EVENTS = [
  // ======================
  // IGLESIA
  // ======================
  {
    id: "church_donation_1",
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
    // Solo si tienes buena relación con la Iglesia y aún no hay monasterio
    condition: (state) =>
      (state.relations.church ?? 0) >= 60 &&
      state.labor.clergy > 0 &&
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
  // PUENTE
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

  // ======================
  // DESASTRES ESTRUCTURALES / BÁNDIDOS
  // ======================
  {
    id: "wall_collapse",
    title: "Derrumbe en la muralla",
    text:
      "Una sección de la muralla muestra grietas. Durante la noche, parte de la estructura se derrumba.",
    // Solo si existe al menos una pieza defensiva
    condition: (state) => hasBuilding(state, ["wall", "tower", "gate"]),
    choices: [
      {
        id: "repair_immediately",
        text: "Reparar de inmediato, cueste lo que cueste.",
        effects: (state) => {
          const tile = pickRandomBuildingTile(state, ["wall", "tower", "gate"]);
          if (tile) {
            tile.building = null;
            tile.underConstruction = null;
            tile.buildRemainingDays = 0;
          }
          state.resources.stone = Math.max(0, state.resources.stone - 30);
          state.resources.wood = Math.max(0, state.resources.wood - 10);
          if (state.relations) {
            state.relations.crown = Math.min(
              100,
              state.relations.crown + 5
            );
            state.relations.guilds = Math.min(
              100,
              state.relations.guilds + 3
            );
          }
        }
      },
      {
        id: "leave_for_later",
        text: "Aplazar la reparación, hay prioridades más urgentes.",
        effects: (state) => {
          const tile = pickRandomBuildingTile(state, ["wall", "tower", "gate"]);
          if (tile) {
            tile.building = null;
            tile.underConstruction = null;
            tile.buildRemainingDays = 0;
          }
          if (state.relations) {
            state.relations.crown = Math.max(
              0,
              state.relations.crown - 8
            );
            state.relations.people = Math.max(
              0,
              state.relations.people - 4
            );
          }
        }
      }
    ]
  },
  {
    id: "bandits_raid",
    title: "Incursión de bandidos",
    text:
      "Un grupo de bandidos ha sido avistado cerca de las rutas de comercio. " +
      "Pueden atacar a los mercaderes o saquear graneros mal defendidos.",
    // Más probable si Pueblo y Corona andan algo tocados
    condition: (state) =>
      state.relations.people < 80 || state.relations.crown < 80,
    choices: [
      {
        id: "pay_bandits_off",
        text: "Pagar un soborno para que se marchen.",
        effects: (state) => {
          state.resources.gold = Math.max(0, state.resources.gold - 35);
          if (state.relations) {
            state.relations.people = Math.min(
              100,
              state.relations.people + 2
            );
          }
        }
      },
      {
        id: "send_guard",
        text: "Enviar a la guardia a limpiar el bosque de bandidos.",
        effects: (state) => {
          state.resources.population = Math.max(
            0,
            state.resources.population - 2
          );
          state.resources.gold += 20;
          if (state.relations) {
            state.relations.crown = Math.min(
              100,
              state.relations.crown + 6
            );
            state.relations.people = Math.min(
              100,
              state.relations.people + 4
            );
          }
        }
      },
      {
        id: "ignore_bandits",
        text: "No intervenir: que cada mercader se proteja como pueda.",
        effects: (state) => {
          state.resources.food = Math.max(0, state.resources.food - 20);
          state.resources.gold = Math.max(0, state.resources.gold - 10);
          if (state.relations) {
            state.relations.people = Math.max(
              0,
              state.relations.people - 8
            );
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
  // Comerciantes
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
  // CONFLICTOS BELICOS
  // ======================
  {
    id: "bandit_raid",
    title: "Incursión de bandidos",
    text:
      "Una partida de bandidos ha sido vista cerca de las granjas. Algunos consejeros proponen enviar soldados, otros pagar para que se marchen.",
    condition: (state) =>
      state.day >= 5 &&
      (state.resources.food > 0 || state.resources.gold > 0),
    choices: [
      {
        id: "bandits_send_soldiers",
        text: "Enviar soldados a dispersarlos.",
        effects: (state) => {
          const defense = computeDefenseScore(state);

          if (defense >= 12) {
            // Buena defensa: daño menor
            state.resources.gold = Math.max(0, state.resources.gold - 10);
            if (state.relations) {
              state.relations.crown = Math.min(
                100,
                state.relations.crown + 3
              );
              state.relations.people = Math.min(
                100,
                state.relations.people + 2
              );
            }
          } else {
            // Defensa floja: algo de saqueo pese al intento
            const stolenGold = Math.min(state.resources.gold, 20);
            const stolenFood = Math.min(state.resources.food, 20);
            state.resources.gold -= stolenGold;
            state.resources.food -= stolenFood;
            if (state.relations) {
              state.relations.people = Math.max(
                0,
                state.relations.people - 4
              );
            }
          }
        }
      },
      {
        id: "bandits_pay_off",
        text: "Pagarles algo de oro para que se marchen.",
        effects: (state) => {
          const cost = Math.min(state.resources.gold, 25);
          state.resources.gold -= cost;
          if (state.relations) {
            state.relations.people = Math.max(
              0,
              state.relations.people - 2
            );
            state.relations.guilds = Math.max(
              0,
              state.relations.guilds - 2
            );
          }
        }
      }
    ]
  },
  {
    id: "neighbor_lord_attack",
    title: "Ataque del señor vecino",
    text:
      "Un señor vecino envidioso del castillo moviliza una pequeña fuerza para poner a prueba tus defensas.",
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
        id: "neighbor_hold_walls",
        text: "Confiar en las murallas y la tropa.",
        effects: (state) => {
          const defense = computeDefenseScore(state);

          if (defense >= 24) {
            // Buena defensa: resistes el ataque
            if (state.relations) {
              state.relations.crown = Math.min(
                100,
                state.relations.crown + 8
              );
              state.relations.people = Math.min(
                100,
                state.relations.people + 5
              );
            }
          } else if (defense >= 12) {
            // Defensa media: resistís, pero a costa de recursos
            const lostFood = Math.min(state.resources.food, 25);
            const lostGold = Math.min(state.resources.gold, 20);
            state.resources.food -= lostFood;
            state.resources.gold -= lostGold;
            if (state.relations) {
              state.relations.people = Math.max(
                0,
                state.relations.people - 3
              );
            }
          } else {
            // Defensa floja: se abre una brecha en la muralla
            const destroyed = destroyRandomWallSegment(state);
            const lostFood = Math.min(state.resources.food, 30);
            const lostGold = Math.min(state.resources.gold, 30);
            state.resources.food -= lostFood;
            state.resources.gold -= lostGold;
            if (state.relations) {
              state.relations.people = Math.max(
                0,
                state.relations.people - 6
              );
              state.relations.guilds = Math.max(
                0,
                state.relations.guilds - 4
              );
            }
            // Si no había murallas, al menos el saqueo duele
            if (!destroyed && state.relations) {
              state.relations.crown = Math.max(
                0,
                state.relations.crown - 4
              );
            }
          }
        }
      },
      {
        id: "neighbor_pay_tribute",
        text: "Pagar un tributo para evitar el choque.",
        effects: (state) => {
          const tribute = Math.min(state.resources.gold, 40);
          state.resources.gold -= tribute;
          if (state.relations) {
            state.relations.crown = Math.max(
              0,
              state.relations.crown - 3
            );
            state.relations.people = Math.max(
              0,
              state.relations.people - 2
            );
          }
        }
      }
    ]
  }
];
