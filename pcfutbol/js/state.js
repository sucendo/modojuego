// js/state.js

import { initialLeague, allLeagues } from './data.js';
import { getSeasonStartYear } from './gameSeason.js';
import { assignLeagueFixtureDates } from './game/seasonCalendar.js';
import { isGoalkeeper, selectValidStartingXI } from './game/utils/lineupSelection.js';
import { fitPlayersToFormation } from './game/tactics/identity.js';
import { ensurePlayerPositionData } from './game/tactics/positions.js';
import { ensureManagementState, MANAGEMENT_STAGES } from './game/managementCycle.js?v=1641';

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
    name: 'Mánager',
  },
  // Ligas paralelas (para estadísticas / mercado / etc.)
  world: {
    leagues: [],
  },
  transferHistory: [],
  marketState: null,
  currentTimeISO: null,
  management: null,
};

// Las fotos iniciales de cada temporada permiten conservar el bloque principal
// de cada plantilla sin depender del orden en que se simulen las ligas.
export function ensureTransferMarketState() {
  if (!GameState.marketState || typeof GameState.marketState !== 'object') {
    GameState.marketState = {};
  }
  const market = GameState.marketState;
  if (!market.baselines || typeof market.baselines !== 'object') market.baselines = {};
  const season = Number(GameState.currentDate?.season || 1);
  const leagues = [{ id: GameState.league?.id, clubs: GameState.clubs }, ...(GameState.world?.leagues || [])];
  for (const league of leagues) {
    for (const club of league.clubs || []) {
      const key = `${season}:${league.id}:${club.id}`;
      if (market.baselines[key]) continue;
      const players = club.players || [];
      const ids = new Set(players.map(p => String(p.id)));
      const xi = (club.lineup || []).filter(id => ids.has(String(id))).slice(0, 11);
      if (xi.length < 11) {
        for (const p of [...players].sort((a, b) => (b.overall || 0) - (a.overall || 0))) {
          if (xi.length === 11) break;
          if (!xi.some(id => String(id) === String(p.id))) xi.push(p.id);
        }
      }
      market.baselines[key] = { xi: xi.map(String), squad: players.map(p => String(p.id)) };
    }
  }
  return market;
}

/**
 * Crea una nueva partida rápida usando la liga y clubes de data.js
 */
export function newGame(options = {}) {
  const {
    roleMode = 'TOTAL',
    leagueId = initialLeague.id,
    clubId,
    managerName,
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
  GameState.currentTimeISO = null;
  GameState.management = { stage: MANAGEMENT_STAGES.WEEK, ticketPrices: {}, ticketZonePrices: {}, ticketMode: 'auto', trainingDays: {}, trainingApplied: {}, trainingMode: 'auto', playerTraining: {} };

  GameState.league = {
    id: league.id,
    name: league.name,
    country: league.country,
    tier: league.tier || 1,
    cardStrictness:
      league.cardStrictness != null ? league.cardStrictness : 1.0,
  };

  GameState.clubs = JSON.parse(JSON.stringify(league.clubs || []));

  GameState.fixtures = [];
  GameState.leagueTable = [];
  GameState.competition = {
    maxMatchday: 0,
  };
  GameState.world = { leagues: [] };
  GameState.transferHistory = [];
  GameState.marketState = null;

  GameState.user.roleMode = roleMode;
  GameState.user.clubId = selectedClubId;
  
  if (typeof managerName === 'string' && managerName.trim()) {
    GameState.user.name = managerName.trim().slice(0, 24);
  } else if (!GameState.user.name) {
    GameState.user.name = 'Mánager';
  }

  normalizeGameState();
  setupCompetition();
  // Primer día de trabajo: antes de los entrenamientos del primer partido.
  const firstMatch = (GameState.fixtures || []).filter(f => !f.played && (f.homeClubId === selectedClubId || f.awayClubId === selectedClubId))
    .sort((a,b) => Date.parse(a.kickoffDate) - Date.parse(b.kickoffDate))[0];
  if (firstMatch?.kickoffDate) {
    const day = new Date(firstMatch.kickoffDate);
    day.setUTCDate(day.getUTCDate() - 6);
    day.setUTCHours(9, 0, 0, 0);
    GameState.currentTimeISO = day.toISOString();
  }
  setupWorldLeagues();
  ensureTransferMarketState();
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
  GameState.currentTimeISO = raw.currentTimeISO || null;
  GameState.league = raw.league;
  if (GameState.league.cardStrictness == null) {
    GameState.league.cardStrictness = 1.0;
  }

  GameState.clubs = raw.clubs;
  GameState.fixtures = raw.fixtures || [];
  GameState.leagueTable = raw.leagueTable || [];
  GameState.competition = raw.competition || { maxMatchday: 0 };
  GameState.user = raw.user || GameState.user;
  
  // Mundo (otras ligas)
  GameState.world = raw.world || GameState.world || { leagues: [] };
  GameState.transferHistory = Array.isArray(raw.transferHistory) ? raw.transferHistory : [];
  GameState.marketState = raw.marketState || null;
  GameState.management = raw.management || null;
  ensureManagementState(GameState);

  normalizeGameState();
  if (!GameState.fixtures || GameState.fixtures.length === 0) {
    setupCompetition();
  } else {
    recomputeCompetitionMetadata();
  }
    
  // Compatibilidad saves viejos: (re)construir estadísticas desde fixtures
  rebuildStatsFromFixtures(GameState.currentDate?.season || 1);

  // Compatibilidad: si no existían ligas del mundo, las creamos
  if (!GameState.world || !Array.isArray(GameState.world.leagues) || GameState.world.leagues.length === 0) {
    setupWorldLeagues();
  } else {
    normalizeWorldLeagues();
  }
  ensureTransferMarketState();
}

/**
 * Normaliza datos para que no falten campos en jugadores, etc.
 */
function normalizeGameState() {
  if (!Array.isArray(GameState.clubs)) return;
  
  const season = GameState.currentDate?.season || 1;

  GameState.clubs.forEach((club) => {
     ensureClubDefaults(club);
    if (!Array.isArray(club.players)) club.players = [];
    club.players.forEach((p) => ensurePlayerDefaults(p, season));
  });
  
  normalizeWorldLeagues();
}

function isPlayerUnavailable(player) {
  if (!player) return false;
  const inj = player.injury;
  if (inj && inj.matchesRemaining != null && inj.matchesRemaining > 0) return true;
  const sus = player.suspension;
  if (sus && sus.matchesRemaining != null && sus.matchesRemaining > 0) return true;
  return false;
}

function ensureClubDefaults(club) {
  if (!club) return;

  // Identidad de 2026/27 para partidas nuevas; las tácticas de partidas
  // guardadas nunca se sobrescriben al normalizar el estado.
  const identity = club.tacticalIdentity || {};
  if (!club.alignment) {
    club.alignment = {
      formation: identity.formation || '4-4-2',
      mentality: identity.mentality || 'BALANCED',
      tempo: identity.tempo || 'NORMAL',
      pressure: identity.pressure || 'NORMAL',
    };
  } else {
    if (!club.alignment.formation) club.alignment.formation = '4-4-2';
    if (!club.alignment.mentality) club.alignment.mentality = 'BALANCED';
    if (!club.alignment.tempo) club.alignment.tempo = 'NORMAL';
    if (!club.alignment.pressure) club.alignment.pressure = 'NORMAL';
  }
  if (!club.tactics) {
    club.tactics = {
      formation: club.alignment.formation,
      mentality: club.alignment.mentality,
      tempo: club.alignment.tempo,
      pressure: club.alignment.pressure,
      playStyle: identity.playStyle || 'POSSESSION',
    };
  }

  // XI (11) + Convocados (banquillo 9)
  if (!Array.isArray(club.lineup)) club.lineup = [];
  if (!Array.isArray(club.bench)) club.bench = [];

  const available = (club.players || [])
    .filter(p => p?.id && !isPlayerUnavailable(p))
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  const preferredXI = club.lineup.length ? club.lineup : fitPlayersToFormation(
    available, club.tactics?.formation || club.alignment?.formation,
  ).map(s => s.player?.id).filter(Boolean);
  club.lineup = selectValidStartingXI(club.players, preferredXI, isPlayerUnavailable);
  const chosen = new Set(club.lineup.map(String));
  const bench = [];
  const addToBench = id => {
    const player = available.find(p => String(p.id) === String(id));
    if (!player || chosen.has(String(id)) || bench.length >= 9) return;
    bench.push(player.id);
    chosen.add(String(id));
  };
  for (const id of club.bench) addToBench(id);
  for (const player of available) addToBench(player.id);
  club.bench = bench;
}

function ensurePlayerDefaults(player, season) {
  // Guardados anteriores a la ampliación de posiciones: migración no
  // destructiva y sin alterar la valoración, el equipo ni el contrato.
  ensurePlayerPositionData(player);
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

  // Stats persistentes por temporada (compatibles con saves viejos)
  if (!player.stats || typeof player.stats !== 'object') player.stats = {};
  ensurePlayerSeasonStats(player, season);

  // Stats por jornada (histórico) para tablas del modal
  if (!player.statsByMatchday || typeof player.statsByMatchday !== 'object') {
    player.statsByMatchday = {};
  }
  ensurePlayerMatchdayStats(player, season);

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

function createEmptyPlayerSeasonStats() {
  return {
    apps: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    yellows: 0,
    reds: 0,
    injuries: 0,
    subsIn: 0,
    subsOut: 0,
    cleanSheets: 0,
    // ---- advanced acumulados (para tu tabla) ----
    dist: 0,
    vmax: 0,
    tiros: 0,
    recup: 0,
    entradas: 0,
  };
}

function createEmptyClubSeasonStats() {
  return {
    played: 0,
    won: 0,
    draw: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    yellows: 0,
    reds: 0,
    injuries: 0,
    subsUsed: 0,
  };
}

function ensurePlayerSeasonStats(player, season) {
  if (!player) return;
  if (!player.stats || typeof player.stats !== 'object') player.stats = {};
  const key = String(season || 1);
  if (!player.stats[key]) player.stats[key] = createEmptyPlayerSeasonStats();
}

function ensureClubSeasonStats(club, season) {
  if (!club) return;
  if (!club.stats || typeof club.stats !== 'object') club.stats = {};
  const key = String(season || 1);
  if (!club.stats[key]) club.stats[key] = createEmptyClubSeasonStats();
}

function ensurePlayerMatchdayStats(player, season) {
  if (!player) return;
  if (!player.statsByMatchday || typeof player.statsByMatchday !== 'object') {
    player.statsByMatchday = {};
  }
  const key = String(season || 1);
  if (!Array.isArray(player.statsByMatchday[key])) player.statsByMatchday[key] = [];
}

function upsertPlayerMatchdayEntry(player, season, entry) {
  ensurePlayerMatchdayStats(player, season);
  const key = String(season || 1);
  const arr = player.statsByMatchday[key];
  const idx = arr.findIndex((r) => r && r.fixtureId === entry.fixtureId);
  if (idx >= 0) arr[idx] = entry;
  else arr.push(entry);
}

function resetStatsForSeason(season) {
  const key = String(season || 1);
  (GameState.clubs || []).forEach((club) => {
    if (!club.stats || typeof club.stats !== 'object') club.stats = {};
    club.stats[key] = createEmptyClubSeasonStats();
    (club.players || []).forEach((p) => {
      if (!p.stats || typeof p.stats !== 'object') p.stats = {};
      p.stats[key] = createEmptyPlayerSeasonStats();
	  
      if (!p.statsByMatchday || typeof p.statsByMatchday !== 'object') p.statsByMatchday = {};
      p.statsByMatchday[key] = [];
    });
  });
  (GameState.fixtures || []).forEach((fx) => {
    if (fx) fx.statsApplied = false;
  });
}

function buildPlayerIndex() {
  const index = new Map();
  (GameState.clubs || []).forEach((club) => {
    (club.players || []).forEach((p) => {
      if (!p || p.id == null) return;
      // Guardar por id “tal cual” y por string, para que encaje con fixtures (dataset/string)
      index.set(p.id, { player: p, club });
      index.set(String(p.id), { player: p, club });
    });
  });
  return index;
}

function computeMinutesFromFixture(fx) {
  const minutes = new Map();
  const apps = new Set();
  const starts = new Set();

  const homeXI = Array.isArray(fx.homeLineupIds) ? fx.homeLineupIds : [];
  const awayXI = Array.isArray(fx.awayLineupIds) ? fx.awayLineupIds : [];
  const starters = homeXI.concat(awayXI).filter(Boolean);
  starters.forEach((pid) => {
    minutes.set(pid, 90);
    apps.add(pid);
    starts.add(pid);
  });

  const subs = Array.isArray(fx.substitutions) ? fx.substitutions : [];
  subs.forEach((s) => {
    if (!s) return;
    const m = typeof s.minute === 'number' ? s.minute : null;
    if (!m || m < 1 || m > 90) return;
    const outId = s.outPlayerId;
    const inId = s.inPlayerId;
    if (outId && minutes.has(outId)) {
      minutes.set(outId, Math.max(0, Math.min(minutes.get(outId), m - 1)));
    }
    if (inId) {
      const add = Math.max(0, 91 - m);
      minutes.set(inId, (minutes.get(inId) || 0) + add);
      apps.add(inId);
    }
  });

  return { minutes, apps, starts };
}

function applyStatsToFixture(fx, season, playerIndex) {
  if (!fx || !fx.played) return;

  const key = String(season || 1);
  const homeClub = (GameState.clubs || []).find((c) => c.id === fx.homeClubId) || null;
  const awayClub = (GameState.clubs || []).find((c) => c.id === fx.awayClubId) || null;
  if (!homeClub || !awayClub) return;

  ensureClubSeasonStats(homeClub, season);
  ensureClubSeasonStats(awayClub, season);

  // Ultra-defensivo por si viene un save viejo raro
  const hs = homeClub.stats[key] || (homeClub.stats[key] = createEmptyClubSeasonStats());
  const as = awayClub.stats[key] || (awayClub.stats[key] = createEmptyClubSeasonStats());

  const hg = Number.isFinite(fx.homeGoals) ? fx.homeGoals : 0;
  const ag = Number.isFinite(fx.awayGoals) ? fx.awayGoals : 0;

  hs.played += 1;
  as.played += 1;
  hs.gf += hg; hs.ga += ag;
  as.gf += ag; as.ga += hg;

  if (hg > ag) { hs.won += 1; as.lost += 1; }
  else if (hg < ag) { as.won += 1; hs.lost += 1; }
  else { hs.draw += 1; as.draw += 1; }

  const { minutes, apps, starts } = computeMinutesFromFixture(fx);
  
  // Contadores por jugador (para el histórico por jornada)
  const goalsByPlayer = new Map();
  const assistsByPlayer = new Map();
  const yellowsByPlayer = new Map();
  const redsByPlayer = new Map();

  // Substituciones usadas (club)
  const subs = Array.isArray(fx.substitutions) ? fx.substitutions : [];
  subs.forEach((s) => {
    if (!s || !s.clubId) return;
    if (s.clubId === homeClub.id) hs.subsUsed += 1;
    if (s.clubId === awayClub.id) as.subsUsed += 1;
  });

  const events = Array.isArray(fx.events) ? fx.events : [];
  events.forEach((ev) => {
    if (!ev) return;
    if (ev.type === 'GOAL' && ev.playerId) {
      goalsByPlayer.set(ev.playerId, (goalsByPlayer.get(ev.playerId) || 0) + 1);
      const info = playerIndex.get(ev.playerId);
      if (info && info.player) {
        ensurePlayerSeasonStats(info.player, season);
        info.player.stats[key].goals += 1;
      }
      // Asistencia si existe (opcional)
      if (ev.assistPlayerId) {
        assistsByPlayer.set(ev.assistPlayerId, (assistsByPlayer.get(ev.assistPlayerId) || 0) + 1);
        const ainfo = playerIndex.get(ev.assistPlayerId);
        if (ainfo && ainfo.player) {
          ensurePlayerSeasonStats(ainfo.player, season);
          ainfo.player.stats[key].assists += 1;
        }
      }
    } else if ((ev.type === 'YELLOW_CARD' || ev.type === 'YELLOW' || ev.type === 'YC') && ev.playerId) {
      yellowsByPlayer.set(ev.playerId, (yellowsByPlayer.get(ev.playerId) || 0) + 1);
      const info = playerIndex.get(ev.playerId);
      if (info && info.player) {
        ensurePlayerSeasonStats(info.player, season);
        info.player.stats[key].yellows += 1;
      }
      if (ev.clubId === homeClub.id) hs.yellows += 1;
      if (ev.clubId === awayClub.id) as.yellows += 1;
    } else if ((ev.type === 'RED_CARD' || ev.type === 'RED' || ev.type === 'RC') && ev.playerId) {
      redsByPlayer.set(ev.playerId, (redsByPlayer.get(ev.playerId) || 0) + 1);
      const info = playerIndex.get(ev.playerId);
      if (info && info.player) {
        ensurePlayerSeasonStats(info.player, season);
        info.player.stats[key].reds += 1;
      }
      if (ev.clubId === homeClub.id) hs.reds += 1;
      if (ev.clubId === awayClub.id) as.reds += 1;
    } else if (ev.type === 'INJURY' && ev.playerId) {
      const info = playerIndex.get(ev.playerId);
      if (info && info.player) {
        ensurePlayerSeasonStats(info.player, season);
        info.player.stats[key].injuries += 1;
      }
      if (ev.clubId === homeClub.id) hs.injuries += 1;
      if (ev.clubId === awayClub.id) as.injuries += 1;
    }
  });

  // Apps / starts / minutes + subs in/out
  apps.forEach((pid) => {
    const info = playerIndex.get(pid);
    if (!info || !info.player) return;
    ensurePlayerSeasonStats(info.player, season);
    info.player.stats[key].apps += 1;
    if (starts.has(pid)) info.player.stats[key].starts += 1;
    info.player.stats[key].minutes += minutes.get(pid) || 0;
  });

  subs.forEach((s) => {
    if (!s) return;
    if (s.inPlayerId) {
      const info = playerIndex.get(s.inPlayerId);
      if (info && info.player) {
        ensurePlayerSeasonStats(info.player, season);
        info.player.stats[key].subsIn += 1;
      }
    }
    if (s.outPlayerId) {
      const info = playerIndex.get(s.outPlayerId);
      if (info && info.player) {
        ensurePlayerSeasonStats(info.player, season);
        info.player.stats[key].subsOut += 1;
      }
    }
  });

  // Porterías a cero (solo titulares POR)
  const homeGA = ag;
  const awayGA = hg;
  (Array.isArray(fx.homeLineupIds) ? fx.homeLineupIds : []).forEach((pid) => {
    const info = playerIndex.get(pid);
    if (!info || !info.player) return;
    if (!isGoalkeeper(info.player)) return;
    if (homeGA !== 0) return;
    ensurePlayerSeasonStats(info.player, season);
    info.player.stats[key].cleanSheets += 1;
  });
  (Array.isArray(fx.awayLineupIds) ? fx.awayLineupIds : []).forEach((pid) => {
    const info = playerIndex.get(pid);
    if (!info || !info.player) return;
    if (!isGoalkeeper(info.player)) return;
    if (awayGA !== 0) return;
    ensurePlayerSeasonStats(info.player, season);
    info.player.stats[key].cleanSheets += 1;
  });

  // ============================
  // Histórico por jornada (por jugador)
  // ============================
  const matchday = Number(fx.matchday || 1);
  const participants = new Set();
  apps.forEach((pid) => participants.add(pid));
  goalsByPlayer.forEach((_, pid) => participants.add(pid));
  assistsByPlayer.forEach((_, pid) => participants.add(pid));
  yellowsByPlayer.forEach((_, pid) => participants.add(pid));
  redsByPlayer.forEach((_, pid) => participants.add(pid));

  participants.forEach((pid) => {
    const info = playerIndex.get(pid);
    if (!info || !info.player || !info.club) return;
    const p = info.player;
    const pClub = info.club;
    const isHome = pClub.id === homeClub.id;
    const oppClub = isHome ? awayClub : homeClub;
	
    const adv = (fx && fx.playerStatsById && fx.playerStatsById[pid]) ? fx.playerStatsById[pid] : null;
    // ✅ Acumular advanced en stats de temporada (si jugó)
    if (apps.has(pid)) {
      ensurePlayerSeasonStats(p, season);
      const stSeason = p.stats[key];
      const dist = adv ? Number(adv.distanceKm || 0) : 0;
      const vmax = adv ? Number(adv.maxSpeedKmh || 0) : 0;
      const tiros = adv ? Number(adv.shotsTotal || 0) : 0;
      const recup = adv ? Number(adv.recoveries || 0) : 0;
      const entradas = adv ? Number((adv.tacklesWon ?? adv.tackles ?? 0) + (adv.tacklesLost ?? 0)) : 0;
      stSeason.dist += Number.isFinite(dist) ? dist : 0;
      stSeason.vmax = Math.max(Number(stSeason.vmax || 0), Number.isFinite(vmax) ? vmax : 0);
      stSeason.tiros += Number.isFinite(tiros) ? tiros : 0;
      stSeason.recup += Number.isFinite(recup) ? recup : 0;
      stSeason.entradas += Number.isFinite(entradas) ? entradas : 0;
    }

    upsertPlayerMatchdayEntry(p, season, {
      season: season || 1,
      matchday,
      fixtureId: fx.id,
      clubId: pClub.id,
      opponentId: oppClub?.id || null,
      opponentName: oppClub?.name || oppClub?.id || 'Rival',
      isHome,
      homeAway: isHome ? 'C' : 'F',
      played: apps.has(pid),
      started: starts.has(pid),
      minutes: minutes.get(pid) || 0,
      goals: goalsByPlayer.get(pid) || 0,
      assists: assistsByPlayer.get(pid) || 0,
      yellows: yellowsByPlayer.get(pid) || 0,
      reds: redsByPlayer.get(pid) || 0,

      // ---- estadísticas avanzadas (opcional) ----
      shotsTotal: adv ? Number(adv.shotsTotal || 0) : 0,
      shotsOnTarget: adv ? Number(adv.shotsOnTarget || 0) : 0,
      shotsOffTarget: adv ? Number(adv.shotsOffTarget || 0) : 0,
      passesAttempted: adv ? Number(adv.passesAttempted || 0) : 0,
      passesCompleted: adv ? Number(adv.passesCompleted || 0) : 0,
      passAccuracyPct: adv ? Number(adv.passAccuracyPct || 0) : 0,
      recoveries: adv ? Number(adv.recoveries ?? 0) : 0,
      tacklesWon: adv ? Number(adv.tacklesWon ?? adv.tackles ?? 0) : 0,
      tacklesLost: adv ? Number(adv.tacklesLost ?? 0) : 0,
      distanceKm: adv ? Number(adv.distanceKm ?? 0) : 0,
      maxSpeedKmh: adv ? Number(adv.maxSpeedKmh ?? 0) : 0,
      crossesAttempted: adv ? Number(adv.crossesAttempted || 0) : 0,
      crossesCompleted: adv ? Number(adv.crossesCompleted || 0) : 0,
      foulsCommitted: adv ? Number(adv.foulsCommitted || 0) : 0,
      foulsSuffered: adv ? Number(adv.foulsSuffered || 0) : 0,
      saves: adv ? Number(adv.saves || 0) : 0,
    });
  });
}

export function applyStatsForFixtures(fixtures, season) {
  const s = season || 1;
  const playerIndex = buildPlayerIndex();
  (fixtures || []).forEach((fx) => {
    if (!fx || !fx.played) return;
    if (fx.statsApplied) return;
    applyStatsToFixture(fx, s, playerIndex);
    fx.statsApplied = true;
  });
}

export function rebuildStatsFromFixtures(season) {
  const s = season || 1;
  resetStatsForSeason(s);
  const playerIndex = buildPlayerIndex();
  (GameState.fixtures || []).forEach((fx) => {
    if (!fx || !fx.played) return;
    applyStatsToFixture(fx, s, playerIndex);
    fx.statsApplied = true;
  });
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
    pos === 'LD' || pos === 'LI' || pos === 'RB' || pos === 'LB'
    || pos === 'RWB' || pos === 'LWB' || pos === 'CAD';
  const isDM = pos === 'MCD' || pos === 'DM' || pos === 'CDM';
  const isCM = pos === 'MC' || pos === 'CM';
  const isAM = pos === 'MCO' || pos === 'MP' || pos === 'CAM';
  const isWideMid = pos === 'RM' || pos === 'LM';
  const isWinger = ['EI', 'ED', 'RW', 'LW'].includes(pos);
  const isSS = pos === 'SS';
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
  } else if (isWideMid) {
    technical.passing = clampAttr(base + 3);
    technical.shooting = clampAttr(base - 1);
    technical.dribbling = clampAttr(base + 3);
    technical.tackling = clampAttr(base);
    mental.vision = clampAttr(base + 3);
    mental.composure = clampAttr(base + 1);
    mental.workRate = clampAttr(base + 4);
    mental.leadership = clampAttr(base);
    physical.pace = clampAttr(base + 4);
    physical.stamina = clampAttr(base + 5);
    physical.strength = clampAttr(base);
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
  } else if (isSS) {
    technical.passing = clampAttr(base + 3);
    technical.shooting = clampAttr(base + 4);
    technical.dribbling = clampAttr(base + 5);
    technical.tackling = clampAttr(base - 5);
    mental.vision = clampAttr(base + 4);
    mental.composure = clampAttr(base + 3);
    mental.workRate = clampAttr(base + 1);
    mental.leadership = clampAttr(base);
    physical.pace = clampAttr(base + 4);
    physical.stamina = clampAttr(base + 2);
    physical.strength = clampAttr(base);
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
 *
 * Regla:
 *  - Todas las competiciones 2026/27 generan round-robin hasta incorporar
 *    sus calendarios oficiales respectivos. Nunca reutilizar el de 2025/26.
 */
function setupCompetition() {
  const season = Number(GameState.currentDate?.season || 1);
  const clubIds = (GameState.clubs || []).map((c) => c?.id).filter(Boolean);
  const built = generateRoundRobinFixtures(clubIds);
  decorateGeneratedFixturesWithSchedule(built.fixtures, season);

  GameState.fixtures = built.fixtures || [];

  // Normalizar fixtures
  GameState.fixtures.forEach((fx) => {
    if (!fx) return;
    fx.season = season;
    if (fx.statsApplied == null) fx.statsApplied = false;
    if (!Array.isArray(fx.events)) fx.events = [];
    if (!Array.isArray(fx.substitutions)) fx.substitutions = [];
    if (!fx.meta || typeof fx.meta !== 'object') fx.meta = {};
  });

  GameState.competition.maxMatchday = built.maxMatchday || 1;
  GameState.currentDate.matchday = 1;

  // Stats nuevas de temporada
  resetStatsForSeason(season);
  recomputeLeagueTable();
}

// ----------------------------
// Calendario oficial / generado
// ----------------------------

function decorateWorldFixturesWithSchedule(fixtures, season, leagueId) {
  assignLeagueFixtureDates(fixtures, leagueId, season);
}

function decorateGeneratedFixturesWithSchedule(fixtures, season) {
  if (!Array.isArray(fixtures) || fixtures.length === 0) return;
  assignLeagueFixtureDates(fixtures, GameState.league?.id, season);
  const clubIndex = new Map((GameState.clubs || []).filter(Boolean).map((c) => [String(c.id), c]));
  fixtures.forEach((fx) => {
      if (!fx) return;
      const homeClub = clubIndex.get(String(fx.homeClubId)) || null;
      if (!fx.meta || typeof fx.meta !== 'object') fx.meta = {};
      if (!fx.meta.stadiumName) fx.meta.stadiumName = homeClub?.stadium?.name || homeClub?.stadiumName || null;
      if (fx.meta.capacity == null) {
        const cap = Number(homeClub?.stadium?.capacity || homeClub?.stadiumCapacity || 0) || null;
        fx.meta.capacity = cap;
      }
      if (fx.meta.official == null) fx.meta.official = false;
      if (!fx.meta.source) fx.meta.source = 'round_robin';
  });
}

function normalizeWorldLeagues() {
  const season = GameState.currentDate?.season || 1;
  if (!GameState.world) GameState.world = { leagues: [] };
  if (!Array.isArray(GameState.world.leagues)) GameState.world.leagues = [];

  GameState.world.leagues.forEach((lg) => {
    if (!lg || !Array.isArray(lg.clubs)) return;
    lg.clubs.forEach((club) => {
      ensureClubDefaults(club);
      if (!Array.isArray(club.players)) club.players = [];
      club.players.forEach((p) => ensurePlayerDefaults(p, season));
    });
  });
}

function setupWorldLeagues() {
  if (!GameState.world) GameState.world = { leagues: [] };
  if (!Array.isArray(GameState.world.leagues)) GameState.world.leagues = [];

  const currentId = GameState.league?.id;
  const season = GameState.currentDate?.season || 1;
  const matchday = GameState.currentDate?.matchday || 1;

  const sourceLeagues = (allLeagues || []).filter((l) => l && l.id && l.id !== currentId);
  GameState.world.leagues = sourceLeagues.map((l) => {
    const clubs = JSON.parse(JSON.stringify(l.clubs || []));
    clubs.forEach((c) => {
      ensureClubDefaults(c);
      (c.players || []).forEach((p) => ensurePlayerDefaults(p, season));
    });

    const clubIds = clubs.map((c) => c.id).filter(Boolean);
    const { fixtures, maxMatchday } = generateRoundRobinFixtures(clubIds);
    fixtures.forEach((fx) => {
      fx.season = season;
      fx.statsApplied = false;
    });
	
    // ✅ Dar fechas a las ligas del mundo (para sincronizar por fecha/hora)
    decorateWorldFixturesWithSchedule(fixtures, season, l.id);
 
    return {
      id: l.id,
      name: l.name || l.id,
      country: l.country || '',
      tier: l.tier || 1,
      clubs,
      fixtures,
      leagueTable: [],
      competition: { maxMatchday },
      currentDate: { season, matchday },
    };
  });
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


/**
 * Avanza a la siguiente temporada.
 * - Incrementa GameState.currentDate.season
 * - Resetea a jornada 1
 * - Genera calendario (oficial si existe para esa temporada/ligas; si no, round-robin)
 * - Resetea stats de la nueva temporada
 * - Regenera ligas del mundo sincronizadas
 */
export function advanceToNextSeason() {
  const curSeason = Number(GameState.currentDate?.season || 1);
  const nextSeason = curSeason + 1;

  GameState.currentDate = {
    season: nextSeason,
    matchday: 1,
  };
  GameState.currentTimeISO = new Date(Date.UTC(getSeasonStartYear(nextSeason), 7, 1, 9)).toISOString();
  GameState.management = { stage: MANAGEMENT_STAGES.WEEK, ticketPrices: {}, ticketZonePrices: {}, ticketMode: 'auto', trainingDays: {}, trainingApplied: {}, trainingMode: 'auto', playerTraining: {} };

  // Re-generar calendario principal
  setupCompetition();

  // Conservamos fichajes y presupuestos de las ligas paralelas. Solo renovamos
  // calendarios y resultados; reconstruir desde data.js borraría los traspasos.
  if (!Array.isArray(GameState.world?.leagues) || !GameState.world.leagues.length) {
    setupWorldLeagues();
  } else {
    for (const league of GameState.world.leagues) {
      const { fixtures, maxMatchday } = generateRoundRobinFixtures((league.clubs || []).map(c => c.id));
      fixtures.forEach(fx => { fx.season = nextSeason; fx.statsApplied = false; });
      decorateWorldFixturesWithSchedule(fixtures, nextSeason, league.id);
      league.fixtures = fixtures;
      league.competition = { maxMatchday };
      league.leagueTable = [];
      league.currentDate = { season: nextSeason, matchday: 1 };
    }
  }
  ensureTransferMarketState();
}
