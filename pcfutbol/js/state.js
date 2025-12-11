// js/state.js

import { initialLeague, allLeagues } from './data.js';

export const GameState = {
  meta: {
    version: 1,
    createdAt: null,
    lastSavedAt: null,
  },
  currentDate: {
    season: 1,
    matchday: 1,
  },
  league: {
    id: null,
    name: '',
    country: '',
    cardStrictness: 1.0, // dureza media para tarjetas
  },
  clubs: [],
  fixtures: [],       // partidos de liga
  leagueTable: [],    // clasificación
  competition: {
    maxMatchday: 0,
  },
  user: {
    roleMode: 'TOTAL',
    clubId: null,
  },
};

/**
 * Crea una nueva partida rápida usando la liga y clubes de data.js
 */
export function newGame(options = {}) {
  const {
    roleMode = 'TOTAL',
    leagueId = initialLeague.id,
    clubId,
  } = options;

  // Elegimos liga (si no encaja, usamos la inicial por defecto)
  const league =
    (typeof leagueId === 'string'
      ? (allLeagues || []).find((l) => l.id === leagueId)
      : null) || initialLeague;

  // Elegimos club dentro de esa liga
  const fallbackClubId =
    league.clubs && league.clubs.length > 0 ? league.clubs[0].id : null;
  const selectedClubId = clubId || fallbackClubId;

  GameState.meta.version = 1;
  GameState.meta.createdAt = new Date().toISOString();
  GameState.meta.lastSavedAt = null;

  GameState.currentDate = {
    season: 1,
    matchday: 1,
  };

  GameState.league = {
    id: league.id,
    name: league.name,
    country: league.country,
    cardStrictness:
      league.cardStrictness != null ? league.cardStrictness : 1.0,
  };

  GameState.clubs = JSON.parse(JSON.stringify(league.clubs || []));

  GameState.fixtures = [];
  GameState.leagueTable = [];
  GameState.competition = {
    maxMatchday: 0,
  };

  GameState.user.roleMode = roleMode;
  GameState.user.clubId = selectedClubId;

  normalizeGameState();
  setupCompetition();
}

/**
 * Aplica un estado cargado desde archivo al GameState actual.
 */
export function applyLoadedState(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Estado vacío o no válido');
  }

  if (!raw.meta || !raw.league || !Array.isArray(raw.clubs)) {
    throw new Error('Faltan campos clave en el archivo de guardado');
  }

  GameState.meta = raw.meta;
  GameState.currentDate = raw.currentDate || GameState.currentDate;
  GameState.league = raw.league;
  if (GameState.league.cardStrictness == null) {
    GameState.league.cardStrictness = 1.0;
  }

  GameState.clubs = raw.clubs;
  GameState.fixtures = raw.fixtures || [];
  GameState.leagueTable = raw.leagueTable || [];
  GameState.competition = raw.competition || { maxMatchday: 0 };
  GameState.user = raw.user || GameState.user;

  normalizeGameState();
  if (!GameState.fixtures || GameState.fixtures.length === 0) {
    setupCompetition();
  } else {
    recomputeCompetitionMetadata();
  }
}

/**
 * Normaliza datos para que no falten campos en jugadores, etc.
 */
function normalizeGameState() {
  if (!Array.isArray(GameState.clubs)) return;

  GameState.clubs.forEach((club) => {
    if (!Array.isArray(club.players)) club.players = [];
    club.players.forEach((p) => ensurePlayerDefaults(p));
  });
}

function ensurePlayerDefaults(player) {
  if (player.morale == null) player.morale = 0.7;
  if (player.fitness == null) player.fitness = 0.9;
  if (player.transferListed == null) player.transferListed = false;

  // Lesión actual (null o { type, matchesRemaining })
  if (player.injury === undefined) {
    player.injury = null;
  }

  // Forma reciente (rendimiento últimos partidos), -3 a +3 aprox.
  if (player.form == null || Number.isNaN(player.form)) {
    player.form = 0;
  }

  // Tarjetas amarillas acumuladas en la competición
  if (player.yellowCards == null || Number.isNaN(player.yellowCards)) {
    player.yellowCards = 0;
  }

  // Sanción actual (null o { type, matchesRemaining })
  if (player.suspension === undefined) {
    player.suspension = null;
  }

  // Historial de disciplina (últimas tarjetas)
  if (!Array.isArray(player.disciplineHistory)) {
    player.disciplineHistory = [];
  }

  if (!player.attributes) {
    const ov = player.overall ?? 60;
    const pos = (player.position || '').toUpperCase();
    player.attributes = generateAttributesForPosition(pos, ov);
  } else {
    player.attributes.technical = player.attributes.technical || {};
    player.attributes.mental = player.attributes.mental || {};
    player.attributes.physical = player.attributes.physical || {};
  }
}

function generateAttributesForPosition(position, overall) {
  const ov = Number.isFinite(overall) ? overall : 60;
  const base = Math.max(50, Math.min(ov, 90)); // base razonable
  const pos = (position || '').toUpperCase();

  const technical = {};
  const mental = {};
  const physical = {};

  const isGK = pos === 'POR' || pos === 'GK';
  const isCB = pos === 'DFC' || pos === 'CB';
  const isFB =
    pos === 'LD' || pos === 'LI' || pos === 'RB' || pos === 'LB' || pos === 'CAD';
  const isDM = pos === 'MCD' || pos === 'DM';
  const isCM = pos === 'MC';
  const isAM = pos === 'MCO' || pos === 'MP';
  const isWinger = pos === 'EI' || pos === 'ED';
  const isST =
    pos === 'DC' || pos === 'SD' || pos === 'ST' || pos === 'FW' || pos === 'CF';

  if (isGK) {
    // Portero: fuerte mental y físico, menos técnico "de campo"
    technical.passing = clampAttr(base - 5);
    technical.shooting = clampAttr(base - 10);
    technical.dribbling = clampAttr(base - 8);
    technical.tackling = clampAttr(base - 4);

    mental.vision = clampAttr(base - 3);
    mental.composure = clampAttr(base + 6);
    mental.workRate = clampAttr(base);
    mental.leadership = clampAttr(base + 3);

    physical.pace = clampAttr(base - 4);
    physical.stamina = clampAttr(base);
    physical.strength = clampAttr(base + 4);
  } else if (isCB) {
    // Central: fuerte en defensa y fuerza, menos pase/dribling
    technical.passing = clampAttr(base - 3);
    technical.shooting = clampAttr(base - 8);
    technical.dribbling = clampAttr(base - 6);
    technical.tackling = clampAttr(base + 6);

    mental.vision = clampAttr(base - 2);
    mental.composure = clampAttr(base + 2);
    mental.workRate = clampAttr(base + 2);
    mental.leadership = clampAttr(base + 3);

    physical.pace = clampAttr(base - 2);
    physical.stamina = clampAttr(base + 2);
    physical.strength = clampAttr(base + 5);
  } else if (isFB) {
    // Laterales / carrileros: rápidos y con recorrido
    technical.passing = clampAttr(base + 0);
    technical.shooting = clampAttr(base - 7);
    technical.dribbling = clampAttr(base + 1);
    technical.tackling = clampAttr(base + 2);

    mental.vision = clampAttr(base);
    mental.composure = clampAttr(base);
    mental.workRate = clampAttr(base + 4);
    mental.leadership = clampAttr(base + 1);

    physical.pace = clampAttr(base + 5);
    physical.stamina = clampAttr(base + 4);
    physical.strength = clampAttr(base + 1);
  } else if (isDM) {
    // MCD: corte y trabajo
    technical.passing = clampAttr(base + 1);
    technical.shooting = clampAttr(base - 6);
    technical.dribbling = clampAttr(base - 1);
    technical.tackling = clampAttr(base + 6);

    mental.vision = clampAttr(base);
    mental.composure = clampAttr(base);
    mental.workRate = clampAttr(base + 5);
    mental.leadership = clampAttr(base + 2);

    physical.pace = clampAttr(base - 1);
    physical.stamina = clampAttr(base + 4);
    physical.strength = clampAttr(base + 3);
  } else if (isCM) {
    // MC mixto
    technical.passing = clampAttr(base + 2);
    technical.shooting = clampAttr(base + 0);
    technical.dribbling = clampAttr(base + 1);
    technical.tackling = clampAttr(base + 0);

    mental.vision = clampAttr(base + 2);
    mental.composure = clampAttr(base + 1);
    mental.workRate = clampAttr(base + 3);
    mental.leadership = clampAttr(base + 1);

    physical.pace = clampAttr(base + 1);
    physical.stamina = clampAttr(base + 3);
    physical.strength = clampAttr(base + 1);
  } else if (isAM) {
    // Media punta / creador
    technical.passing = clampAttr(base + 5);
    technical.shooting = clampAttr(base + 2);
    technical.dribbling = clampAttr(base + 5);
    technical.tackling = clampAttr(base - 6);

    mental.vision = clampAttr(base + 6);
    mental.composure = clampAttr(base + 3);
    mental.workRate = clampAttr(base);
    mental.leadership = clampAttr(base + 0);

    physical.pace = clampAttr(base + 2);
    physical.stamina = clampAttr(base + 1);
    physical.strength = clampAttr(base - 1);
  } else if (isWinger) {
    // Extremos: velocidad y regate
    technical.passing = clampAttr(base + 1);
    technical.shooting = clampAttr(base + 1);
    technical.dribbling = clampAttr(base + 6);
    technical.tackling = clampAttr(base - 6);

    mental.vision = clampAttr(base + 2);
    mental.composure = clampAttr(base + 1);
    mental.workRate = clampAttr(base + 2);
    mental.leadership = clampAttr(base - 1);

    physical.pace = clampAttr(base + 7);
    physical.stamina = clampAttr(base + 3);
    physical.strength = clampAttr(base - 2);
  } else if (isST) {
    // Delanteros: definición, algo de fuerza, menos defensa
    technical.passing = clampAttr(base - 1);
    technical.shooting = clampAttr(base + 7);
    technical.dribbling = clampAttr(base + 3);
    technical.tackling = clampAttr(base - 5);

    mental.vision = clampAttr(base + 1);
    mental.composure = clampAttr(base + 4);
    mental.workRate = clampAttr(base + 1);
    mental.leadership = clampAttr(base + 1);

    physical.pace = clampAttr(base + 3);
    physical.stamina = clampAttr(base + 2);
    physical.strength = clampAttr(base + 3);
  } else {
    // Por defecto: todo alrededor del overall
    technical.passing = clampAttr(base);
    technical.shooting = clampAttr(base);
    technical.dribbling = clampAttr(base);
    technical.tackling = clampAttr(base);

    mental.vision = clampAttr(base);
    mental.composure = clampAttr(base);
    mental.workRate = clampAttr(base);
    mental.leadership = clampAttr(base);

    physical.pace = clampAttr(base);
    physical.stamina = clampAttr(base);
    physical.strength = clampAttr(base);
  }

  return {
    technical,
    mental,
    physical,
  };
}

function clampAttr(v) {
  return Math.max(40, Math.min(99, Math.round(v)));
}

/**
 * Prepara el calendario y la clasificación inicial.
 */
function setupCompetition() {
  const clubIds = GameState.clubs.map((c) => c.id);
  const { fixtures, maxMatchday } = generateRoundRobinFixtures(clubIds);

  GameState.fixtures = fixtures;
  GameState.competition.maxMatchday = maxMatchday || 1;
  GameState.currentDate.matchday = 1;

  recomputeLeagueTable();
}

/**
 * Recalcula metadatos de competición a partir de los fixtures.
 */
function recomputeCompetitionMetadata() {
  const md =
    GameState.fixtures.length > 0
      ? Math.max(...GameState.fixtures.map((f) => f.matchday || 1))
      : 1;
  GameState.competition.maxMatchday = md || 1;
  recomputeLeagueTable();
}

/**
 * Pool sencillo de árbitros para dar variedad de dureza.
 */
const REFEREE_POOL = [
  { name: 'Árbitro dialogante', strictness: 0.85 },
  { name: 'Árbitro permisivo', strictness: 0.9 },
  { name: 'Árbitro estándar', strictness: 1.0 },
  { name: 'Árbitro estricto', strictness: 1.15 },
  { name: 'Árbitro muy estricto', strictness: 1.3 },
];

function getRandomReferee() {
  const idx = Math.floor(Math.random() * REFEREE_POOL.length);
  return REFEREE_POOL[idx] || REFEREE_POOL[2];
}

/**
 * Genera un calendario de liga a una vuelta (round-robin simple).
 * Cada partido incluye un árbitro con "strictness" para tarjetas.
 */
function generateRoundRobinFixtures(clubIds) {
  const teamsOriginal = clubIds.filter(Boolean);
  if (teamsOriginal.length < 2) {
    return { fixtures: [], maxMatchday: 0 };
  }

  let teams = [...teamsOriginal];
  const BYE = '__BYE__';
  if (teams.length % 2 === 1) {
    teams.push(BYE);
  }

  const n = teams.length;
  const numRounds = n - 1;           // vueltas básicas (ida)
  const fixturesIda = [];
  let currentOrder = [...teams];

  // ---------------------------
  // PRIMERA VUELTA (IDA)
  // ---------------------------
  for (let round = 1; round <= numRounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const home = currentOrder[i];
      const away = currentOrder[n - 1 - i];
      if (home === BYE || away === BYE) continue;

      const referee = getRandomReferee();

      fixturesIda.push({
        id: `fx_${round}_${home}_${away}`,
        matchday: round,
        homeClubId: home,
        awayClubId: away,
        homeGoals: null,
        awayGoals: null,
        played: false,
        events: [],
        refereeName: referee.name,
        refereeStrictness: referee.strictness,
      });
    }

    currentOrder = rotateArrayForRoundRobin(currentOrder);
  }

  // ---------------------------
  // SEGUNDA VUELTA (VUELTA)
  // ---------------------------
  const fixturesVuelta = fixturesIda.map((fx) => {
    const roundVuelta = fx.matchday + numRounds;
    const referee = getRandomReferee();

    return {
      id: `fx_${roundVuelta}_${fx.awayClubId}_${fx.homeClubId}`,
      matchday: roundVuelta,
      homeClubId: fx.awayClubId, // se invierte local/visitante
      awayClubId: fx.homeClubId,
      homeGoals: null,
      awayGoals: null,
      played: false,
      refereeName: referee.name,
      refereeStrictness: referee.strictness,
    };
  });

  const allFixtures = fixturesIda.concat(fixturesVuelta);
  const maxMatchday = numRounds * 2; // ida + vuelta

  return { fixtures: allFixtures, maxMatchday };
}

/**
 * Algoritmo de rotación (método del círculo) para round-robin.
 */
function rotateArrayForRoundRobin(arr) {
  if (arr.length <= 2) return arr.slice();
  const [first, ...rest] = arr;
  const last = rest[rest.length - 1];
  const middle = rest.slice(0, -1);
  return [first, last, ...middle];
}

/**
 * Recalcula la clasificación (leagueTable) en base a los partidos jugados.
 */
export function recomputeLeagueTable() {
  const clubs = GameState.clubs || [];
  const tableMap = new Map();

  clubs.forEach((club) => {
    tableMap.set(club.id, {
      clubId: club.id,
      name: club.name,
      played: 0,
      won: 0,
      draw: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });
  });

  (GameState.fixtures || []).forEach((fx) => {
    if (!fx.played) return;
    if (fx.homeGoals == null || fx.awayGoals == null) return;

    const homeRow = tableMap.get(fx.homeClubId);
    const awayRow = tableMap.get(fx.awayClubId);
    if (!homeRow || !awayRow) return;

    homeRow.played += 1;
    awayRow.played += 1;

    homeRow.goalsFor += fx.homeGoals;
    homeRow.goalsAgainst += fx.awayGoals;
    awayRow.goalsFor += fx.awayGoals;
    awayRow.goalsAgainst += fx.homeGoals;

    if (fx.homeGoals > fx.awayGoals) {
      homeRow.won += 1;
      awayRow.lost += 1;
      homeRow.points += 3;
    } else if (fx.homeGoals < fx.awayGoals) {
      awayRow.won += 1;
      homeRow.lost += 1;
      awayRow.points += 3;
    } else {
      homeRow.draw += 1;
      awayRow.draw += 1;
      homeRow.points += 1;
      awayRow.points += 1;
    }
  });

  const table = Array.from(tableMap.values());

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return (a.name || '').localeCompare(b.name || '');
  });

  GameState.leagueTable = table;
}
