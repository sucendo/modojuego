// js/game/match/advancedStats.js
//
// Estadísticas avanzadas (team + players).
// Deben concordar con eventos (goles/tarjetas/sustituciones)
//

export function generateAdvancedStatsForFixture(fx, homeClub, awayClub) {
  // Evitar recalcular si ya existe
  if (fx.teamStats && fx.playerStatsById) return;

  const safeNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const up = (s) => String(s || "").toUpperCase();
  const isGKPos = (pos) => (up(pos) === "GK" || up(pos) === "POR");

  const homeGoals = safeNum(fx.homeGoals, 0);
  const awayGoals = safeNum(fx.awayGoals, 0);

  // Fuerza relativa por overall medio del XI (si existe)
  const avgXI = (club, ids) => {
    const list = (club?.players || []).filter((p) => ids?.includes?.(p.id));
    if (!list.length) return 60;
    const sum = list.reduce((acc, p) => acc + safeNum(p.overall, 60), 0);
    return sum / list.length;
  };

  const homeXI = fx.homeLineupIds || [];
  const awayXI = fx.awayLineupIds || [];
  const homeOV = avgXI(homeClub, homeXI);
  const awayOV = avgXI(awayClub, awayXI);
  const ovDiff = clamp((homeOV - awayOV) / 25, -1, 1); // -1..1

  // Posesión: parte del diff + ruido
  const basePoss = 50 + ovDiff * 8 + (Math.random() * 6 - 3);
  const homePoss = clamp(basePoss, 35, 65);
  const awayPoss = 100 - homePoss;

  // Tiros: correlaciona con goles y posesión
  const homeShots = clamp(Math.round(6 + homeGoals * 3 + (homePoss - 50) * 0.15 + Math.random() * 6), 2, 28);
  const awayShots = clamp(Math.round(6 + awayGoals * 3 + (awayPoss - 50) * 0.15 + Math.random() * 6), 2, 28);

  // A puerta: ~30-55% de tiros + ajuste por goles
  const homeSOT = clamp(Math.round(homeShots * (0.32 + Math.random() * 0.2) + homeGoals * 0.4), 0, homeShots);
  const awaySOT = clamp(Math.round(awayShots * (0.32 + Math.random() * 0.2) + awayGoals * 0.4), 0, awayShots);

  // Bloqueados: 10-30% de tiros
  const homeBlocked = clamp(Math.round(homeShots * (0.12 + Math.random() * 0.18)), 0, homeShots);
  const awayBlocked = clamp(Math.round(awayShots * (0.12 + Math.random() * 0.18)), 0, awayShots);

  // Pases: correlaciona con posesión
  const homePassAtt = clamp(Math.round(260 + homePoss * 6 + Math.random() * 110), 180, 820);
  const awayPassAtt = clamp(Math.round(260 + awayPoss * 6 + Math.random() * 110), 180, 820);
  const homePassAcc = clamp(72 + ovDiff * 3 + Math.random() * 8, 60, 92);
  const awayPassAcc = clamp(72 - ovDiff * 3 + Math.random() * 8, 60, 92);
  const homePassComp = Math.round(homePassAtt * (homePassAcc / 100));
  const awayPassComp = Math.round(awayPassAtt * (awayPassAcc / 100));

  // Faltas/tarjetas: algo de azar + intensidad
  const homeFouls = clamp(Math.round(7 + Math.random() * 13 + (50 - homePoss) * 0.05), 3, 25);
  const awayFouls = clamp(Math.round(7 + Math.random() * 13 + (50 - awayPoss) * 0.05), 3, 25);
  const homeYellows = clamp(Math.round(homeFouls * (0.12 + Math.random() * 0.12)), 0, 6);
  const awayYellows = clamp(Math.round(awayFouls * (0.12 + Math.random() * 0.12)), 0, 6);
  const homeReds = clamp(Math.random() < 0.06 ? 1 : 0, 0, 2);
  const awayReds = clamp(Math.random() < 0.06 ? 1 : 0, 0, 2);

  // Offsides/corners
  const homeOffsides = clamp(Math.round(0 + Math.random() * 5 + homeGoals * 0.2), 0, 10);
  const awayOffsides = clamp(Math.round(0 + Math.random() * 5 + awayGoals * 0.2), 0, 10);
  const homeCorners = clamp(Math.round(2 + homeShots * 0.18 + Math.random() * 3), 0, 14);
  const awayCorners = clamp(Math.round(2 + awayShots * 0.18 + Math.random() * 3), 0, 14);

  // Paradas = SOT rival - goles rival (min 0)
  const homeSaves = clamp(awaySOT - homeGoals, 0, 12);
  const awaySaves = clamp(homeSOT - awayGoals, 0, 12);

  // Centros: ligado a corners
  const homeCrossesAttempted = clamp(Math.round(10 + Math.random() * 25 + homeCorners * 0.7), 5, 45);
  const awayCrossesAttempted = clamp(Math.round(10 + Math.random() * 25 + awayCorners * 0.7), 5, 45);
  const homeCrossAcc = clamp(10 + Math.random() * 14, 5, 35);
  const awayCrossAcc = clamp(10 + Math.random() * 14, 5, 35);
  const homeCrossesCompleted = Math.round(homeCrossesAttempted * (homeCrossAcc / 100));
  const awayCrossesCompleted = Math.round(awayCrossesAttempted * (awayCrossAcc / 100));

  // Pases por zona (reparto)
  const splitPasses = (completed) => {
    const back = clamp(Math.round(completed * (0.18 + Math.random() * 0.08)), 0, completed);
    const left = clamp(Math.round(completed * (0.25 + Math.random() * 0.12)), 0, completed - back);
    const right = clamp(Math.round(completed * (0.25 + Math.random() * 0.12)), 0, completed - back - left);
    const other = completed - back - left - right;
    return { back, left, right, other };
  };

  const homePassZone = splitPasses(homePassComp);
  const awayPassZone = splitPasses(awayPassComp);

  // Distancia: aprox 98-116 km por equipo
  const homeDistance = clamp(98 + Math.random() * 18, 92, 118);
  const awayDistance = clamp(98 + Math.random() * 18, 92, 118);

  const home = {
    possessionPct: Number(homePoss.toFixed(2)),
    shotsTotal: homeShots,
    shotsOnTarget: homeSOT,
    shotsBlocked: homeBlocked,
    passesAttempted: homePassAtt,
    passesCompleted: homePassComp,
    passAccuracyPct: Number(((homePassComp / homePassAtt) * 100).toFixed(2)),
    fouls: homeFouls,
    yellows: homeYellows,
    reds: homeReds,
    offsides: homeOffsides,
    corners: homeCorners,
    saves: homeSaves,
    crossesAttempted: homeCrossesAttempted,
    crossesCompleted: homeCrossesCompleted,
    crossAccuracyPct: Number(((homeCrossesCompleted / homeCrossesAttempted) * 100).toFixed(2)),
    passZone: homePassZone,
    distanceKm: Number(homeDistance.toFixed(2)),
  };

  const away = {
    possessionPct: Number(awayPoss.toFixed(2)),
    shotsTotal: awayShots,
    shotsOnTarget: awaySOT,
    shotsBlocked: awayBlocked,
    passesAttempted: awayPassAtt,
    passesCompleted: awayPassComp,
    passAccuracyPct: Number(((awayPassComp / awayPassAtt) * 100).toFixed(2)),
    fouls: awayFouls,
    yellows: awayYellows,
    reds: awayReds,
    offsides: awayOffsides,
    corners: awayCorners,
    saves: awaySaves,
    crossesAttempted: awayCrossesAttempted,
    crossesCompleted: awayCrossesCompleted,
    crossAccuracyPct: Number(((awayCrossesCompleted / awayCrossesAttempted) * 100).toFixed(2)),
    passZone: awayPassZone,
    distanceKm: Number(awayDistance.toFixed(2)),
  };

  fx.teamStats = { home, away };
  
  // 🔧 Tarjetas de TEAM desde eventos (para que no sea 0/0 si el timeline sí tiene cards)
  {
    const ev = Array.isArray(fx.events) ? fx.events : [];
    const Y = new Set(["YELLOW_CARD", "YELLOW", "YC"]);
    const R = new Set(["RED_CARD", "RED", "RC"]);
    const count = (clubId, set) => ev.filter((e) => e && e.clubId === clubId && set.has(e.type)).length;
    fx.teamStats.home.yellows = count(fx.homeClubId, Y);
    fx.teamStats.home.reds = count(fx.homeClubId, R);
    fx.teamStats.away.yellows = count(fx.awayClubId, Y);
    fx.teamStats.away.reds = count(fx.awayClubId, R);
  }

  // ---------------------------
  // Player stats: repartir de forma coherente (goals/cards + aproximación)
  // ---------------------------
  const playerStatsById = {};

  const homePlayers = (homeClub?.players || []).filter(Boolean);
  const awayPlayers = (awayClub?.players || []).filter(Boolean);

  const homeXIPlayers = homePlayers.filter((p) => homeXI.includes(p.id));
  const awayXIPlayers = awayPlayers.filter((p) => awayXI.includes(p.id));

  const ensure = (p) => {
    if (!p) return null;
    const id = String(p.id);
    if (!playerStatsById[id]) {
      playerStatsById[id] = {
        minutes: 0,
        goals: 0,
        assists: 0,
        yellows: 0,
        reds: 0,
        shotsTotal: 0,
        shotsOnTarget: 0,
        shotsOffTarget: 0,
        shotsBlocked: 0,
        passesAttempted: 0,
        passesCompleted: 0,
        passAccuracyPct: 0,
        recoveries: 0,
        tacklesWon: 0,
        tacklesLost: 0,
        interceptions: 0,
        dribblesAttempted: 0,
        dribblesCompleted: 0,
        foulsCommitted: 0,
        foulsSuffered: 0,
        keyPasses: 0,
        crossesAttempted: 0,
        crossesCompleted: 0,
        saves: 0, // porteros
        distanceKm: 0,
        maxSpeedKmh: 0,
      };
    }
    return playerStatsById[id];
  };

  // ✅ Minutos POR `fx.substitutions` (tu engine ya usa substitutions para persistencia):contentReference[oaicite:3]{index=3}
  const applyMinutesFromFixture = (clubId, lineupIds, allPlayers) => {
    const mins = new Map();
    (lineupIds || []).forEach((pid) => mins.set(pid, 90));
    const subs = Array.isArray(fx.substitutions) ? fx.substitutions : [];
    subs
      .filter((s) => s && s.clubId === clubId)
      .forEach((s) => {
        const outId = s.outPlayerId;
        const inId = s.inPlayerId;
        const m = clamp(safeNum(s.minute, 70), 1, 89);
        if (outId != null) mins.set(outId, clamp(m, 0, 90));
        if (inId != null) mins.set(inId, clamp(90 - clamp(m, 0, 90), 0, 90));
      });
    mins.forEach((m, pid) => {
      const p = allPlayers.find((pp) => pp.id === pid);
      if (!p) return;
      ensure(p).minutes = clamp(m, 0, 90);
    });
  };

  applyMinutesFromFixture(fx.homeClubId, fx.homeLineupIds, homePlayers);
  applyMinutesFromFixture(fx.awayClubId, fx.awayLineupIds, awayPlayers); 

  // Goals + cards desde events
  const addFromEvents = () => {
    const ev = Array.isArray(fx.events) ? fx.events : [];
    ev.forEach((e) => {
      if (!e) return;
      if (e.type === 'GOAL' && e.playerId != null) {
        const p = (homePlayers.find((pp) => pp.id === e.playerId) || awayPlayers.find((pp) => pp.id === e.playerId));
        if (!p) return;
        const st = ensure(p);
        st.goals += 1;
        // ✅ asistencia embebida en el evento GOAL
        if (e.assistPlayerId != null) {
          const ap = (homePlayers.find((pp) => pp.id === e.assistPlayerId) || awayPlayers.find((pp) => pp.id === e.assistPlayerId));
          if (ap) ensure(ap).assists += 1;
        }
      }
      if ((e.type === 'YELLOW_CARD' || e.type === 'YELLOW' || e.type === 'YC') && e.playerId != null) {
        const p = (homePlayers.find((pp) => pp.id === e.playerId) || awayPlayers.find((pp) => pp.id === e.playerId));
        if (!p) return;
        const st = ensure(p);
        st.yellows += 1;
      }
      if ((e.type === 'RED_CARD' || e.type === 'RED' || e.type === 'RC') && e.playerId != null) {
        const p = (homePlayers.find((pp) => pp.id === e.playerId) || awayPlayers.find((pp) => pp.id === e.playerId));
        if (!p) return;
        const st = ensure(p);
        st.reds += 1;
      }
    });
  };
  addFromEvents();
  
  // Lista de jugadores que han jugado (min > 0) => incluye suplentes
  const homeActive = homePlayers.filter((p) => (playerStatsById[String(p.id)]?.minutes || 0) > 0);
  const awayActive = awayPlayers.filter((p) => (playerStatsById[String(p.id)]?.minutes || 0) > 0);

  // Reparto de tiros/pases/tackles... proporcional a minutos + rol simple
  const roleWeight = (p) => {
    const pos = String(p?.position || '').toUpperCase();
    if (pos === 'GK') return { shoot: 0.1, pass: 0.9, defend: 0.8, dribble: 0.1, cross: 0.0, save: 1.0 };
    if (pos === 'CB') return { shoot: 0.6, pass: 1.0, defend: 1.6, dribble: 0.6, cross: 0.2, save: 0.0 };
    if (pos === 'RB' || pos === 'LB' || pos === 'RWB' || pos === 'LWB') return { shoot: 0.8, pass: 1.1, defend: 1.2, dribble: 0.9, cross: 1.2, save: 0.0 };
    if (pos === 'CDM') return { shoot: 0.9, pass: 1.4, defend: 1.4, dribble: 0.9, cross: 0.5, save: 0.0 };
    if (pos === 'CM') return { shoot: 1.1, pass: 1.5, defend: 1.0, dribble: 1.1, cross: 0.6, save: 0.0 };
    if (pos === 'CAM') return { shoot: 1.4, pass: 1.4, defend: 0.7, dribble: 1.5, cross: 0.7, save: 0.0 };
    if (pos === 'RM' || pos === 'LM') return { shoot: 1.2, pass: 1.3, defend: 0.9, dribble: 1.4, cross: 1.3, save: 0.0 };
    if (pos === 'RW' || pos === 'LW') return { shoot: 1.6, pass: 1.2, defend: 0.6, dribble: 1.6, cross: 1.2, save: 0.0 };
    if (pos === 'ST' || pos === 'CF') return { shoot: 2.0, pass: 0.9, defend: 0.4, dribble: 1.2, cross: 0.2, save: 0.0 };
    return { shoot: 1.0, pass: 1.0, defend: 1.0, dribble: 1.0, cross: 0.6, save: 0.0 };
  };
  
  const getPaceLike = (p) => {
    const v = p?.attributes?.physical?.pace;
    if (Number.isFinite(Number(v))) return Number(v);
    // fallback razonable
    const ov = Number.isFinite(Number(p?.overall)) ? Number(p.overall) : 60;
    return ov;
  };

  const allocTeam = (players, teamStats, clubId) => {
    if (!players.length) return;
    // base weights
    players.forEach((p) => {
      const w = roleWeight(p);
      p.__w = w;
      p.__min = safeNum(playerStatsById[String(p.id)]?.minutes, 90);
      p.__shootW = w.shoot * (0.35 + p.__min / 120);
      p.__passW = w.pass * (0.35 + p.__min / 120);
      p.__defW = w.defend * (0.35 + p.__min / 120);
      p.__dribW = w.dribble * (0.35 + p.__min / 120);
      p.__crossW = w.cross * (0.35 + p.__min / 120);
      // peso de gol
      p.__goalWeight = w.shoot * (0.6 + Math.random() * 0.6);
    });

    const sumW = (key) => players.reduce((acc, p) => acc + (p[key] || 0), 0) || 1;
    const shootSum = sumW('__shootW');
    const passSum = sumW('__passW');
    const defSum = sumW('__defW');
    const dribSum = sumW('__dribW');
    const crossSum = sumW('__crossW');
	
    // Distancia: repartir la distancia del equipo según minutos + rol
    players.forEach((p) => {
      p.__distW = (0.55 + p.__min / 120) * (0.9 + (p.__w?.pass || 1) * 0.12);
    });
    const distSum = sumW('__distW');

    // Reparto de tiros
    players.forEach((p) => {
      const st = ensure(p);
      if (!st) return;
      st.shotsTotal = Math.round(teamStats.shotsTotal * (p.__shootW / shootSum));
      st.shotsOnTarget = Math.round(teamStats.shotsOnTarget * (p.__shootW / shootSum));
      st.passesAttempted = Math.round(teamStats.passesAttempted * (p.__passW / passSum));
      st.passesCompleted = Math.round(teamStats.passesCompleted * (p.__passW / passSum));
      st.tackles = Math.round((6 + Math.random() * 10) * (p.__defW / defSum) * 10) / 10;
      st.interceptions = Math.round((3 + Math.random() * 7) * (p.__defW / defSum) * 10) / 10;
      st.dribblesAttempted = Math.round((3 + Math.random() * 10) * (p.__dribW / dribSum));
      st.dribblesCompleted = Math.round(st.dribblesAttempted * (0.45 + Math.random() * 0.35));
      st.crossesAttempted = Math.round(teamStats.crossesAttempted * (p.__crossW / crossSum));
      st.crossesCompleted = Math.round(teamStats.crossesCompleted * (p.__crossW / crossSum));
      st.foulsCommitted = Math.round((teamStats.fouls * (0.6 + Math.random() * 0.8)) * (p.__defW / defSum));
      st.foulsSuffered = Math.round((teamStats.fouls * (0.4 + Math.random() * 0.8)) * (p.__dribW / dribSum));
      st.keyPasses = Math.round((2 + Math.random() * 8) * (p.__passW / passSum));

      // Entradas ganadas/perdidas (split de tackles)
      const t = Number(st.tackles || 0);
      const winRate = clamp(0.48 + Math.random() * 0.25 + (p.__w?.defend || 1) * 0.04, 0.45, 0.78);
      st.tacklesWon = Math.max(0, Math.round(t * winRate));
      st.tacklesLost = Math.max(0, Math.round(t - st.tacklesWon));
      // ✅ ya lo hemos “convertido”: evitamos doble conteo posterior
      delete st.tackles;

      // Recuperaciones (aprox): derivadas de intercepciones + entradas
      st.recoveries = Math.max(0, Math.round((Number(st.interceptions || 0) * 0.9) + (Number(st.tacklesWon || 0) * 1.1)));

      // Distancia (km) y velocidad máx (km/h)
      const teamDist = Number.isFinite(Number(teamStats?.distanceKm)) ? Number(teamStats.distanceKm) : 0;
      const dist = teamDist * (p.__distW / distSum);
      st.distanceKm = Number(dist.toFixed(2));

      const pace = getPaceLike(p); // ~50..99
      const base = 25.5 + (pace / 10); // ~30.5..35.4
      const posBoost = (p.__w?.dribble || 1) * 0.35; // extremos algo más
      st.maxSpeedKmh = Number(clamp(base + posBoost + (Math.random() * 1.8 - 0.6), 25, 38).toFixed(2));
    });

    // Porteros: paradas
    const gk = players.find((p) => String(p?.position || '').toUpperCase() === 'GK') || players[0];
    if (gk) {
      const st = ensure(gk);
      if (st) st.saves = teamStats.saves;
    }

    // Ajustar tiros onTarget según goles (garantiza al menos 1 tiro a puerta por gol)
    const goalsEvents = (fx.events || []).filter((e) => e && e.type === 'GOAL' && e.clubId === clubId);
    goalsEvents.forEach((e) => {
      const pid = e.playerId != null ? String(e.playerId) : null;
      if (!pid) return;
      const st = playerStatsById[pid];
      if (!st) return;
      st.shotsTotal += 1;
      st.shotsOnTarget += 1;
    });

    // Restante de tiros
    const alreadyOn = goalsEvents.length;
    const remainingOn = Math.max(0, teamStats.shotsOnTarget - alreadyOn);
    const remainingTotal = Math.max(0, teamStats.shotsTotal - goalsEvents.length);
    const remainingBlocked = clamp(Math.round(teamStats.shotsBlocked * (0.9 + Math.random() * 0.2)), 0, remainingTotal);
    const remainingOff = Math.max(0, remainingTotal - remainingOn - remainingBlocked);

    const pick = () => pickRandomScorer(players);

    // repartir
    for (let i = 0; i < remainingOn; i++) {
      const p = pick();
      const st = playerStatsById[p.id];
      if (!st) continue;
      st.shotsOnTarget += 1;
      st.shotsTotal += 1;
    }
    for (let i = 0; i < remainingBlocked; i++) {
      const p = pick();
      const st = playerStatsById[p.id];
      if (!st) continue;
      st.shotsTotal += 1;
    }
    for (let i = 0; i < remainingOff; i++) {
      const p = pick();
      const st = playerStatsById[p.id];
      if (!st) continue;
      st.shotsTotal += 1;
    }
  };

  // ✅ Repartimos sobre los que realmente han jugado (XI + suplentes con minutos)
  allocTeam(homeActive, fx.teamStats.home, fx.homeClubId);
  allocTeam(awayActive, fx.teamStats.away, fx.awayClubId);

  // Normalizar porcentajes finales
  Object.keys(playerStatsById).forEach((pid) => {
    const st = playerStatsById[pid];
    if (!st) return;
    if (st.passesAttempted > 0) {
      st.passAccuracyPct = Number(((st.passesCompleted / st.passesAttempted) * 100).toFixed(2));
    } else {
      st.passAccuracyPct = 0;
    }
  });

  // ✅ Distancia + vmax coherentes, y GK mucho menor que jugador de campo
  {
    const byId = new Map();
    homePlayers.forEach((p) => byId.set(String(p.id), p));
    awayPlayers.forEach((p) => byId.set(String(p.id), p));

    let sumHome = 0;
    let sumAway = 0;
    let maxHome = 0;
    let maxAway = 0;

    Object.entries(playerStatsById).forEach(([pid, st]) => {
      const p = byId.get(pid);
      if (!p) return;
      const mins = clamp(safeNum(st.minutes, 0), 0, 90);
      const f = mins / 90;
      const gk = isGKPos(p.position);

      const baseKm = gk ? (3.0 + Math.random() * 1.5) : (8.0 + Math.random() * 3.5);
      st.distanceKm = Number((baseKm * f).toFixed(2));

      const baseSpeed = gk ? 24 : 28;
      st.maxSpeedKmh = Math.round((baseSpeed + Math.random() * (gk ? 7 : 10)));

      // Si por cualquier razón quedó tackles “legacy” y NO hay split, lo convertimos
      if (st.tackles != null && (!st.tacklesWon && !st.tacklesLost)) {
        const t = Math.max(0, safeNum(st.tackles, 0));
        const won = Math.round(t * (0.50 + Math.random() * 0.20));
        st.tacklesWon += won;
        st.tacklesLost += Math.max(0, t - won);
        delete st.tackles;
      }
      // Recoveries mínimo razonable (si no lo rellenó allocTeam)
      if (!st.recoveries) {
        st.recoveries = Math.max(0, safeNum(st.interceptions, 0)) + Math.max(0, safeNum(st.tacklesWon, 0));
      }

      if (p.clubId === fx.homeClubId) { sumHome += st.distanceKm; maxHome = Math.max(maxHome, st.maxSpeedKmh); }
      if (p.clubId === fx.awayClubId) { sumAway += st.distanceKm; maxAway = Math.max(maxAway, st.maxSpeedKmh); }
    });

    fx.teamStats.home.distanceKm = Number(sumHome.toFixed(2));
    fx.teamStats.away.distanceKm = Number(sumAway.toFixed(2));
    fx.teamStats.home.maxSpeedKmh = maxHome;
    fx.teamStats.away.maxSpeedKmh = maxAway;
  }

  fx.playerStatsById = playerStatsById;
  // Alias compatible para persistencia futura (si quieres usarlo luego)
  fx.advancedStats = { teamStats: fx.teamStats, playerStatsById: fx.playerStatsById };
}

function pickRandomScorer(players) {
  if (!Array.isArray(players) || players.length === 0) return null;
  const total = players.reduce((acc, p) => acc + (p.__goalWeight || 1), 0);
  let r = Math.random() * total;
  for (let i = 0; i < players.length; i++) {
    r -= players[i].__goalWeight || 1;
    if (r <= 0) return players[i];
  }
  return players[players.length - 1];
}
