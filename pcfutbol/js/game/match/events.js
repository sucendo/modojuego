// js/game/match/events.js
//
// Generación de eventos de partido (GOAL + assistPlayerId, SUBSTITUTION, tarjetas/lesión vía hook).
// Este módulo NO aplica efectos (lesiones/sanciones/fatiga), eso lo hace el motor (simulateMatchday.js)
// a través de un callback/hook para evitar ciclos.

function clampN(x, a, b) {
  const n = Number(x);
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, n));
}

function normPos(p) {
  return String(p?.position || p?.pos || '').toUpperCase();
}

function isGKPos(pos) {
  const p = String(pos || '').toUpperCase();
  return p === 'GK' || p === 'POR';
}

function posGroup(pos) {
  const p = String(pos || '').toUpperCase();
  if (p === 'GK' || p === 'POR') return 'GK';
  if (p === 'RB' || p === 'LB' || p === 'CB' || p === 'RWB' || p === 'LWB') return 'DEF';
  if (p === 'CDM' || p === 'CM' || p === 'CAM' || p === 'RM' || p === 'LM') return 'MID';
  if (p === 'RW' || p === 'LW' || p === 'CF' || p === 'ST') return 'ATT';
  return 'MID';
}

function pickWeightedIndex(weights) {
  let sum = 0;
  for (const w of weights) sum += Math.max(0, Number(w) || 0);
  if (sum <= 0) return -1;
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= Math.max(0, Number(weights[i]) || 0);
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function pickBenchInIdRespectingGKRule(outPlayer, candidateBenchIds, playersById) {
  const outIsGK = isGKPos(outPlayer?.position);
  const gks = candidateBenchIds.filter((id) => isGKPos(playersById.get(id)?.position));
  const field = candidateBenchIds.filter((id) => !isGKPos(playersById.get(id)?.position));
  // GK -> GK si existe, si no, campo (último recurso)
  if (outIsGK) return gks[0] || field[0] || null;
  // Campo -> campo; si no queda ninguno, entra GK
  return field[0] || gks[0] || null;
}

// ----------------------------
// Helpers minuto único fixture
// ----------------------------
export function createFixtureMinutePicker(existingEvents) {
  const used = new Set();
  (Array.isArray(existingEvents) ? existingEvents : []).forEach((ev) => {
    const m = ev && typeof ev.minute === 'number' ? ev.minute : null;
    if (m && m > 0) used.add(m);
  });
  return function pick() {
    for (let i = 0; i < 18; i++) {
      const m = 1 + Math.floor(Math.random() * 90);
      if (!used.has(m)) {
        used.add(m);
        return m;
      }
    }
    return 90;
  };
}

export function getPotentialScorersForClub(club, lineupIds) {
  const ids = new Set((Array.isArray(lineupIds) ? lineupIds : []).map((x) => String(x)));
  const players = (club?.players || []).filter((p) => p && p.id != null && ids.has(String(p.id)));
  const score = (p) => {
    const pos = normPos(p);
    if (pos === 'ST') return 6;
    if (pos === 'CF') return 5;
    if (pos === 'RW' || pos === 'LW') return 4;
    if (pos === 'CAM') return 3;
    if (pos === 'CM') return 2;
    return 1;
  };
  return players
    .slice()
    .sort((a, b) => score(b) - score(a))
    .slice(0, 10);
}

export function getPotentialAssistersForClub(club, lineupIds) {
  const ids = new Set((Array.isArray(lineupIds) ? lineupIds : []).map((x) => String(x)));
  const players = (club?.players || []).filter((p) => p && p.id != null && ids.has(String(p.id)));
  const score = (p) => {
    const pos = normPos(p);
    if (pos === 'CAM') return 6;
    if (pos === 'CM') return 5;
    if (pos === 'RW' || pos === 'LW') return 5;
    if (pos === 'RM' || pos === 'LM') return 4;
    if (pos === 'CF') return 4;
    if (pos === 'ST') return 2;
    if (pos === 'CDM') return 2;
    return 1;
  };
  return players
    .slice()
    .sort((a, b) => score(b) - score(a))
    .slice(0, 10);
}

export function pickRandomAssister(candidates, scorerId) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const pool = candidates.filter((p) => p?.id && p.id !== scorerId);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickRandomScorer(players) {
  if (!Array.isArray(players) || players.length === 0) return null;
  const total = players.reduce((acc, p) => acc + (p.__goalWeight || 1), 0);
  let r = Math.random() * total;
  for (let i = 0; i < players.length; i++) {
    r -= players[i].__goalWeight || 1;
    if (r <= 0) return players[i];
  }
  return players[players.length - 1];
}

export function generateTacticalSubsForFixture(fx, club, isHome, pickMinute) {
  const bench = isHome ? fx.homeBenchIds : fx.awayBenchIds;
  const lineup = isHome ? fx.homeLineupIds : fx.awayLineupIds;
  if (!Array.isArray(bench) || bench.length === 0) return;
  if (!Array.isArray(lineup) || lineup.length < 11) return;
  if (!Array.isArray(fx.substitutions)) fx.substitutions = [];

  // ✅ Regla actual: hasta 5 sustituciones (si no viene configurado)
  const maxSubs = Number.isFinite(Number(fx.maxSubs)) ? Number(fx.maxSubs) : 5;

  const playersById = new Map((club?.players || []).filter(Boolean).map((p) => [p.id, p]));
  const lineupPlayers = lineup.map((id) => playersById.get(id)).filter(Boolean);

  // Medir “fatiga” simple a partir de fitness (si no existe, asumimos 1.0)
  const fitness = (p) => {
    const f = Number(p?.fitness);
    return Number.isFinite(f) ? Math.max(0, Math.min(1, f)) : 1;
  };
  const tiredCount = lineupPlayers.filter((p) => fitness(p) < 0.78 && !isGKPos(p.position)).length;

  // Contexto marcador (si existe)
  const diff = isHome
    ? (Number(fx.homeGoals || 0) - Number(fx.awayGoals || 0))
    : (Number(fx.awayGoals || 0) - Number(fx.homeGoals || 0));

  // Objetivo típico 2–4, a veces 5 si van perdiendo o hay mucha fatiga
  let target = 2;
  if (tiredCount >= 3) target += 1;
  if (tiredCount >= 6) target += 1;
  if (diff < 0) target += 1; // perdiendo -> más cambios
  if (diff > 1) target += 0; // ganando cómodo -> no necesariamente más

  // Ruido para que no sea siempre igual
  const jitter = (Math.random() < 0.35 ? 1 : 0) - (Math.random() < 0.15 ? 1 : 0);
  target = clampN(target + jitter, 1, maxSubs);

  // No puedes hacer más cambios que jugadores de banquillo
  const n = Math.min(target, bench.length, maxSubs);
  if (n <= 0) return;

  const usedIn = new Set();
  const usedOut = new Set();

  for (let i = 0; i < n; i++) {
    // Candidatos de salida: evita GK en cambios tácticos casi siempre
    const outCandidates = lineup
      .filter((id) => id && !usedOut.has(id))
      .filter((id) => {
        const p = playersById.get(id);
        // no cambiar GK salvo que no quede ningún jugador de campo disponible en el banquillo
        if (!p) return false;
        if (!isGKPos(p.position)) return true;
        const benchFieldExists = bench.some((bid) => {
          const bp = playersById.get(bid);
          return bp && !isGKPos(bp.position) && !usedIn.has(bid);
        });
        return !benchFieldExists; // solo si NO hay campo disponible
      });
    if (outCandidates.length === 0) break;

    // Peso por fatiga: cuanto más bajo fitness, más probable que salga
    const weights = outCandidates.map((id) => {
      const p = playersById.get(id);
      const f = fitness(p);
      return (1.05 - f) + 0.15; // 0.15..1.15 aprox
    });
    const outPick = pickWeightedIndex(weights);
    const outId = outCandidates[outPick >= 0 ? outPick : 0];
    if (!outId || usedOut.has(outId)) continue;

    const outP = playersById.get(outId) || null;
    const outGroup = posGroup(normPos(outP));

    // Candidatos de entrada: primero intentamos “like-for-like” por grupo
    const benchCandidates = bench.filter((id) => id && !usedIn.has(id));
    if (benchCandidates.length === 0) break;

    const sameGroup = benchCandidates.filter((id) => posGroup(normPos(playersById.get(id))) === outGroup);
    const candidates = sameGroup.length ? sameGroup : benchCandidates;

    const inId = pickBenchInIdRespectingGKRule(outP, candidates, playersById);
    if (!inId) break;

    usedOut.add(outId);
    usedIn.add(inId);

    // Minutos “reales”: escalonados por cambio
    // (1º ~55-65, 2º ~65-75, 3º ~75-83, 4º ~82-88, 5º ~84-89)
    const base = 55 + i * 9 + (diff < 0 ? -2 : 0);
    const minute = clampN(base + Math.floor(Math.random() * 7), 46, 89); 

    fx.substitutions.push({
      clubId: club.id,
      outPlayerId: outId,
      inPlayerId: inId,
      minute,
      reason: 'TACTICAL',
    });
  }
}

export function generateEventsForFixture(fx, homeClub, awayClub, hooks = {}) {
  const { applyMatchEffectsToClub, ctx } = hooks;

  const events = [];
  const pickMinute = createFixtureMinutePicker(events);

  const addGoal = (clubId, playerId, assistPlayerId = null) => {
    events.push({
      type: 'GOAL',
      clubId,
      playerId,
      assistPlayerId: assistPlayerId || null,
      minute: pickMinute(),
    });
  };

  const homeScorers = getPotentialScorersForClub(homeClub, fx.homeLineupIds);
  const awayScorers = getPotentialScorersForClub(awayClub, fx.awayLineupIds);
  const homeAssisters = getPotentialAssistersForClub(homeClub, fx.homeLineupIds);
  const awayAssisters = getPotentialAssistersForClub(awayClub, fx.awayLineupIds);

  for (let i = 0; i < (fx.homeGoals || 0); i++) {
    const p = pickRandomScorer(homeScorers);
    const a = pickRandomAssister(homeAssisters, p?.id);
    addGoal(fx.homeClubId, p?.id || null, a?.id || null);
  }
  for (let i = 0; i < (fx.awayGoals || 0); i++) {
    const p = pickRandomScorer(awayScorers);
    const a = pickRandomAssister(awayAssisters, p?.id);
    addGoal(fx.awayClubId, p?.id || null, a?.id || null);
  }

  // Subs tácticas básicas
  generateTacticalSubsForFixture(fx, homeClub, true, pickMinute);
  generateTacticalSubsForFixture(fx, awayClub, false, pickMinute);

  // Tarjetas / lesiones (hook del motor)
  if (typeof applyMatchEffectsToClub === 'function') {
    applyMatchEffectsToClub(fx, homeClub, true, events, pickMinute, ctx);
    applyMatchEffectsToClub(fx, awayClub, false, events, pickMinute, ctx);
  }

  events.sort((a, b) => (a.minute || 999) - (b.minute || 999));
  return events;
}

// ---------------------------
// META DEL PARTIDO (estadio/aforo/asistencia/clima/hora/added time)
// ---------------------------
export function attachFixtureMeta(fx, homeClub, awayClub) {
  fx.meta = fx.meta || {};

  const stadiumName =
    fx.meta.stadiumName ||
    homeClub?.stadium?.name ||
    homeClub?.stadiumName ||
    'Estadio';
  const stadiumCapacity =
    Number(fx.meta.stadiumCapacity) ||
    Number(homeClub?.stadium?.capacity) ||
    Number(homeClub?.capacity) ||
    40000;

  const kickoffTime = fx.meta.kickoffTime || (Math.random() < 0.6 ? '21:00' : '18:30');

  const weatherPool = ['Soleado', 'Nublado', 'Lluvia', 'Viento', 'Tormenta'];
  const pitchPool = ['Perfecto', 'Bueno', 'Irregular', 'Pesado'];
  const weather = fx.meta.weather || weatherPool[Math.floor(Math.random() * weatherPool.length)];
  const pitchState = fx.meta.pitchState || pitchPool[Math.floor(Math.random() * pitchPool.length)];

  const addedTime = fx.meta.addedTime || {
    firstHalf: 1 + Math.floor(Math.random() * 3),
    secondHalf: 2 + Math.floor(Math.random() * 4),
  };

  const baseFill = 0.55 + Math.random() * 0.35;
  const derbyBoost = homeClub?.rivals?.includes?.(awayClub?.id) ? 0.08 : 0;
  const fill = Math.min(0.98, baseFill + derbyBoost);
  const attendance = fx.meta.attendance || Math.max(2000, Math.floor(stadiumCapacity * fill));

  fx.meta.stadiumName = stadiumName;
  fx.meta.stadiumCapacity = stadiumCapacity;
  fx.meta.kickoffTime = kickoffTime;
  fx.meta.weather = weather;
  fx.meta.pitchState = pitchState;
  fx.meta.addedTime = addedTime;
  fx.meta.attendance = attendance;
}
