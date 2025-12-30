// js/game/match/statsPersist.js
//
// Persistencia/normalización de estadísticas a partir de fixtures:
// - Minutos reales por jugador (con sustituciones)
// - Mapas de conteo por tipo de evento
// - Wrapper seguro: intenta state.applyStatsForFixtures y, si falla, aplica fallback local

export function computeMinutesForClubInFixture(fx, isHome) {
  const mins = new Map();
  const xi = (isHome ? fx.homeLineupIds : fx.awayLineupIds) || [];
  xi.forEach((pid) => {
    if (pid != null) mins.set(pid, 90);
  });

  const clubId = isHome ? fx.homeClubId : fx.awayClubId;
  const subs = Array.isArray(fx.substitutions) ? fx.substitutions : [];
  subs.forEach((s) => {
    if (!s) return;
    if (s.clubId && clubId && s.clubId !== clubId) return;
    const m = typeof s.minute === 'number' ? s.minute : null;
    if (!m || m < 1 || m > 90) return;
    const outId = s.outPlayerId;
    const inId = s.inPlayerId;
    if (outId != null && mins.has(outId)) {
      mins.set(outId, Math.max(0, Math.min(mins.get(outId), m - 1)));
    }
    if (inId != null) {
      const add = Math.max(0, 91 - m);
      mins.set(inId, (mins.get(inId) || 0) + add);
    }
  });
  return mins;
}

export function buildEventCountMap(fx, type, clubId) {
  const map = new Map();
  const ev = Array.isArray(fx?.events) ? fx.events : [];
  const types = Array.isArray(type) ? type : [type];
  const typeSet = new Set(types.filter(Boolean));
  ev.forEach((e) => {
    if (!e) return;
    if (!typeSet.has(e.type)) return;
    // clubId es opcional: si viene, filtra; si no, cuenta igual
    if (clubId != null && e.clubId != null && e.clubId !== clubId) return;
     const key = e.playerId != null ? String(e.playerId) : null;
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

function num0(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function max0(a, b) {
  const na = num0(a);
  const nb = num0(b);
  return Math.max(na, nb);
}

// Intenta extraer advanced stats del fixture para un jugador
function getPlayerAdvancedFromFixture(fx, clubId, playerId) {
  if (!fx || playerId == null) return null;
  const pid = String(playerId);
  
  // ✅ Formato NUEVO: stats por jugador en el propio fixture
  // (Tu engine está guardando aquí las advanced stats)
  if (fx.playerStatsById && typeof fx.playerStatsById === 'object') {
    const obj = fx.playerStatsById[pid] || fx.playerStatsById[playerId] || null;
    if (obj && typeof obj === 'object') return obj;
  }

  const adv = fx.advancedStats || fx.advStats || fx.matchStats || null;
  // ✅ Tu formato real (engine): fx.playerStatsById
  if (!adv && fx.playerStatsById && fx.playerStatsById[pid]) {
    return fx.playerStatsById[pid];
  }
  if (!adv) return null;

  // Formato A: advancedStats.home.players / away.players
  if (adv.home?.players || adv.away?.players) {
    const side = (clubId === fx.homeClubId) ? adv.home : adv.away;
    const obj = side?.players?.[pid] || side?.players?.[playerId] || null;
    return obj && typeof obj === 'object' ? obj : null;
  }

  // Formato B: advancedStats.players[pid]
  if (adv.players && typeof adv.players === 'object') {
    const obj = adv.players[pid] || adv.players[playerId] || null;
    return obj && typeof obj === 'object' ? obj : null;
  }

  // Formato C: advancedStats[pid]
  const direct = adv[pid] || adv[playerId] || null;
  return direct && typeof direct === 'object' ? direct : null;
}

function mergeAdvancedIntoSeasonStats(seasonStats, adv) {
  if (!seasonStats || !adv) return;

  // Normalizamos varios nombres posibles -> tus columnas:
  // dist, vmax, tiros, recup, entradas
  const dist = num0(
    adv.dist ?? adv.distance ?? adv.distanceKm ?? adv.km ?? adv.totalDistance ?? 0
  );
  const vmax = num0(
    adv.vmax ?? adv.vMax ?? adv.maxSpeed ?? adv.maxSpeedKmh ?? adv.speedMax ?? 0
  );
  const tiros = num0(
    adv.tiros ?? adv.shots ?? adv.shotsTotal ?? adv.totalShots ?? 0
  );
  const recup = num0(
    adv.recup ?? adv.recoveries ?? adv.ballRecoveries ?? adv.recuperaciones ?? 0
  );
  const entradas = num0(
    adv.entradas ?? adv.tackles ?? adv.tacklesMade ?? adv.tacklesWon ?? 0
  );

  // Persistimos en claves “canónicas” + alias en español (para no romper UI)
  seasonStats.dist = num0(seasonStats.dist) + dist;
  seasonStats.vmax = max0(seasonStats.vmax, vmax);
  seasonStats.tiros = num0(seasonStats.tiros) + tiros;
  seasonStats.recup = num0(seasonStats.recup) + recup;
  seasonStats.entradas = num0(seasonStats.entradas) + entradas;

  // Alias opcionales (por si alguna vista lee inglés)
  seasonStats.distance = num0(seasonStats.distance) + dist;
  seasonStats.maxSpeed = max0(seasonStats.maxSpeed, vmax);
  seasonStats.shots = num0(seasonStats.shots) + tiros;
  seasonStats.recoveries = num0(seasonStats.recoveries) + recup;
  seasonStats.tackles = num0(seasonStats.tackles) + entradas;
}

function defaultGetClubByIdFromClubs(clubs, clubId) {
  const arr = Array.isArray(clubs) ? clubs : [];
  return arr.find((c) => c && c.id === clubId) || null;
}

/**
 * Fallback local: aplicar estadísticas persistentes a jugadores a partir de los fixtures.
 * Útil si state.applyStatsForFixtures falla (cambio de formato, imports, etc.).
 */
export function applyStatsForFixturesFallback(fixtures, season, deps = {}) {
  const arr = Array.isArray(fixtures) ? fixtures : [];
  const seasonNum = Number(season || 1);
  const seasonKey = String(seasonNum);
  const clubs = deps.clubs;
  const getClubById = typeof deps.getClubById === 'function'
    ? deps.getClubById
    : (id) => defaultGetClubByIdFromClubs(clubs, id);
  const fallbackMatchday = Number(deps.currentMatchday || 1);

  arr.forEach((fx) => {
    if (!fx || fx.__statsApplied) return;

    const home = getClubById(fx.homeClubId);
    const away = getClubById(fx.awayClubId);
    if (!home || !away) {
      fx.__statsApplied = true;
      return;
    }

    const md = Number(fx.matchday || fallbackMatchday || 1);

    const processSide = (club, opponent, isHome) => {
      const players = Array.isArray(club.players) ? club.players : [];
      const xiIds = (isHome ? fx.homeLineupIds : fx.awayLineupIds) || [];
      const xiSet = new Set(Array.isArray(xiIds) ? xiIds : []);

      const minutesById = computeMinutesForClubInFixture(fx, isHome);
      const goalsByPlayer = buildEventCountMap(fx, ['GOAL'], club.id);
      // soporta varios nombres por si cambian
      const yellowsByPlayer = buildEventCountMap(fx, ['YELLOW_CARD', 'YELLOW', 'YC'], club.id);
      const redsByPlayer = buildEventCountMap(fx, ['RED_CARD', 'RED', 'RC'], club.id);
 

      players.forEach((p) => {
        if (!p || p.id == null) return;

        // Asegurar contenedores
        if (!p.stats || typeof p.stats !== 'object') p.stats = {};
        // Compat: guardamos en p.stats[seasonKey] (lo más típico) pero sin machacar si existe
        if (!p.stats[seasonKey] || typeof p.stats[seasonKey] !== 'object') {
          p.stats[seasonKey] = {
            apps: 0, starts: 0, minutes: 0,
            goals: 0, assists: 0, yellows: 0, reds: 0,
            // advanced acumulados
            dist: 0, vmax: 0, tiros: 0, recup: 0, entradas: 0,
          };
        }
        if (!p.statsByMatchday || typeof p.statsByMatchday !== 'object') p.statsByMatchday = {};
        if (!Array.isArray(p.statsByMatchday[seasonKey])) p.statsByMatchday[seasonKey] = [];

        const mins = Number(minutesById.get(p.id) || 0);
        if (mins <= 0) return;

        const st = p.stats[seasonKey];
        st.apps += 1;
        if (xiSet.has(p.id)) st.starts += 1;
        st.minutes += mins;

        const pid = String(p.id);
        const g = goalsByPlayer.get(pid) || 0;
        const y = yellowsByPlayer.get(pid) || 0;
        const r = redsByPlayer.get(pid) || 0;

        st.goals += g;
        st.yellows += y;
        st.reds += r;
		
        // Alias por si alguna vista usa cardsY/cardsR
        st.cardsY = num0(st.cardsY) + y;
        st.cardsR = num0(st.cardsR) + r;

        // Advanced stats desde el fixture (si existe)
        const adv = getPlayerAdvancedFromFixture(fx, club.id, p.id);
        mergeAdvancedIntoSeasonStats(st, adv);

        p.statsByMatchday[seasonKey].push({
          fixtureId: fx.id ?? null,			
          season: seasonNum,
          matchday: md,
          opponentId: opponent.id,
          opponentName: opponent.name || opponent.shortName || opponent.id,
          isHome: !!isHome,
          minutes: mins,
          goals: g,
          assists: 0,
          yellows: y,
          reds: r,
          // advanced matchday (para tablas por jornada)
          dist: adv ? num0(adv.dist ?? adv.distance ?? adv.distanceKm ?? 0) : 0,
          vmax: adv ? num0(adv.vmax ?? adv.vMax ?? adv.maxSpeed ?? adv.maxSpeedKmh ?? 0) : 0,
          tiros: adv ? num0(adv.tiros ?? adv.shots ?? adv.totalShots ?? 0) : 0,
          recup: adv ? num0(adv.recup ?? adv.recoveries ?? adv.ballRecoveries ?? 0) : 0,
          entradas: adv ? num0(adv.entradas ?? adv.tackles ?? adv.tacklesMade ?? 0) : 0, 
        });
      });
    };

    processSide(home, away, true);
    processSide(away, home, false);

    fx.__statsApplied = true;
  });
}

// Post-merge: aunque la ruta principal funcione, aseguramos advanced+tarjetas (sin duplicar)
function mergeAdvancedAndCardsFromFixtures(fixtures, season, deps = {}) {
  const arr = Array.isArray(fixtures) ? fixtures : [];
  const seasonNum = Number(season || 1);
  const seasonKey = String(seasonNum);
  const clubs = deps.clubs;
  const getClubById = typeof deps.getClubById === 'function'
    ? deps.getClubById
    : (id) => (Array.isArray(clubs) ? clubs.find((c) => c && c.id === id) : null);

  arr.forEach((fx) => {
    if (!fx || fx.__advancedMerged) return;
    const home = getClubById(fx.homeClubId);
    const away = getClubById(fx.awayClubId);
    if (!home || !away) { fx.__advancedMerged = true; return; }

    const mergeSide = (club, isHome) => {
      const players = Array.isArray(club.players) ? club.players : [];
      const yMap = buildEventCountMap(fx, ['YELLOW_CARD', 'YELLOW', 'YC'], club.id);
      const rMap = buildEventCountMap(fx, ['RED_CARD', 'RED', 'RC'], club.id);

      players.forEach((p) => {
        if (!p || p.id == null) return;
        if (!p.stats || typeof p.stats !== 'object') return;
        if (!p.stats[seasonKey] || typeof p.stats[seasonKey] !== 'object') return;
        const st = p.stats[seasonKey];

        const pid = String(p.id);
        const y = yMap.get(pid) || 0;
        const r = rMap.get(pid) || 0;

        // Solo si parece que no están (evita duplicar si ya lo metió el core)
        if (!Number.isFinite(Number(st.yellows))) st.yellows = 0;
        if (!Number.isFinite(Number(st.reds))) st.reds = 0;
        // ✅ Evitar doble conteo: si ya existe entrada por fixture, asumimos que ya está aplicado
        const mdArr = p.statsByMatchday && Array.isArray(p.statsByMatchday[seasonKey]) ? p.statsByMatchday[seasonKey] : [];
        const hasFixture = fx.id != null && mdArr.some((row) => row && String(row.fixtureId) === String(fx.id));
        if (!hasFixture && (y > 0 || r > 0)) {
          st.yellows = num0(st.yellows) + y;
          st.reds = num0(st.reds) + r;
          st.cardsY = num0(st.cardsY) + y;
          st.cardsR = num0(st.cardsR) + r;
        }

        const adv = getPlayerAdvancedFromFixture(fx, club.id, p.id);
        if (adv) mergeAdvancedIntoSeasonStats(st, adv);
      });
    };

    mergeSide(home, true);
    mergeSide(away, false);
    fx.__advancedMerged = true;
  });
}

/**
 * Intenta aplicar state.applyStatsForFixtures(fixtures, season).
 * Si falla, aplica fallback local para no dejar la UI sin estadísticas.
 *
 * Devuelve: true si se aplicó la ruta principal; false si hubo fallback.
 */
export function applyStatsForFixturesSafe(fixtures, season, deps = {}) {
  const fn = deps.applyStatsForFixtures;
  const warn = deps.warn || console.warn;
  let ok = false;

  if (typeof fn === 'function') {
    try {
      fn(fixtures, season);
      ok = true;
    } catch (e) {
      warn('No se pudieron aplicar estadísticas (state.js). Usando fallback local.', e);
    }
  }

  if (!ok) {
    applyStatsForFixturesFallback(fixtures, season, deps);
  }
  
  // Siempre intentamos mergear advanced+tarjetas desde fixtures, para no perder columnas.
  // Es idempotente por fixture (marca __advancedMerged).
  mergeAdvancedAndCardsFromFixtures(fixtures, season, deps);

  return ok;
}