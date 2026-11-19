// Fase 16.1: dos pausas de gestión por encuentro, sin reloj en tiempo real.
// Todas las decisiones se guardan dentro de GameState (exportación JSON normal).

import { getStadiumStructure } from '../stadiums_2026_27.js?v=1673';

export const MANAGEMENT_STAGES = Object.freeze({ WEEK: 'week', MATCHDAY: 'matchday', POST: 'post' });
export const TRAINING_TYPES = Object.freeze({
  rest: 'Descanso', recovery: 'Recuperación', balanced: 'Equilibrado',
  intense: 'Físico intensivo', technical: 'Técnica', tactical: 'Táctica',
});
export const PLAYER_TRAINING_FOCUS = Object.freeze({
  general: 'Sin objetivo individual', passing: 'Pase', dribbling: 'Regate', shooting: 'Disparo',
  tackling: 'Entrada', stamina: 'Resistencia', recovery: 'Recuperación específica',
});
export const TRAINED_ATTRIBUTES = Object.freeze([
  { key: 'passing', group: 'technical', label: 'Pase' },
  { key: 'dribbling', group: 'technical', label: 'Regate' },
  { key: 'shooting', group: 'technical', label: 'Disparo' },
  { key: 'tackling', group: 'technical', label: 'Entrada' },
  { key: 'stamina', group: 'physical', label: 'Resistencia' },
]);
export const DEFAULT_TICKET_PRICE = 35;
export const TICKET_SECTORS = Object.freeze([
  { id: 'vip', label: 'Palcos VIP', share: 0.03, factor: 2.4 },
  { id: 'tribuna', label: 'Tribuna principal', share: 0.26, factor: 1.45 },
  { id: 'preferencia', label: 'Preferencia', share: 0.32, factor: 1.05 },
  { id: 'norte', label: 'Fondo norte', share: 0.20, factor: 0.70 },
  { id: 'sur', label: 'Fondo sur', share: 0.19, factor: 0.70 },
]);

const DAY_MS = 86400000;
const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const startOfDay = (ms) => {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

const validDate = (iso) => {
  const ms = Date.parse(iso || '');
  return Number.isFinite(ms) ? ms : null;
};

export const fixtureKey = (fx) => String(fx?.id ?? `${fx?.season ?? ''}:${fx?.matchday ?? ''}:${fx?.homeClubId ?? ''}:${fx?.awayClubId ?? ''}`);
export const dayKeyUTC = (time) => new Date(time).toISOString().slice(0, 10);

export function getPendingUserFixtures(state) {
  const clubId = state?.user?.clubId;
  return (state?.fixtures || []).filter((fx) => fx && !fx.played &&
    (fx.homeClubId === clubId || fx.awayClubId === clubId) && validDate(fx.kickoffDate) != null)
    .slice().sort((a, b) => validDate(a.kickoffDate) - validDate(b.kickoffDate));
}

export function ensureManagementState(state) {
  if (!state.management || typeof state.management !== 'object') {
    // Guardados antiguos: ya estaban en víspera; no les imponemos una semana nueva.
    state.management = { stage: state.currentTimeISO ? MANAGEMENT_STAGES.MATCHDAY : MANAGEMENT_STAGES.WEEK };
  }
  const m = state.management;
  if (!Object.values(MANAGEMENT_STAGES).includes(m.stage)) m.stage = MANAGEMENT_STAGES.WEEK;
  if (!m.ticketPrices || typeof m.ticketPrices !== 'object') m.ticketPrices = {};
  if (!m.ticketZonePrices || typeof m.ticketZonePrices !== 'object') m.ticketZonePrices = {};
  if (!m.ticketLevelPrices || typeof m.ticketLevelPrices !== 'object') m.ticketLevelPrices = {};
  if (m.ticketMode !== 'auto' && m.ticketMode !== 'manual') m.ticketMode = 'auto';
  if (!m.trainingDays || typeof m.trainingDays !== 'object') m.trainingDays = {};
  if (!m.trainingApplied || typeof m.trainingApplied !== 'object') m.trainingApplied = {};
  if (m.trainingMode !== 'auto' && m.trainingMode !== 'manual') m.trainingMode = 'auto';
  if (!m.playerTraining || typeof m.playerTraining !== 'object') m.playerTraining = {};
  if (!Array.isArray(m.trainingLog)) m.trainingLog = [];
  if (!m.trainingInitial || typeof m.trainingInitial !== 'object') m.trainingInitial = {};
  if (!m.trainingDevelopment || typeof m.trainingDevelopment !== 'object') m.trainingDevelopment = {};
  return m;
}

export function getManagementStage(state) { return ensureManagementState(state).stage; }

export function setTicketPrice(state, fx, price) {
  if (!fx || fx.played || String(fx.homeClubId) !== String(state.user?.clubId)) return false;
  if (fx.meta?.ticketPriceLocked != null) return false;
  const numeric = Number(price);
  if (!Number.isFinite(numeric) || numeric < 5 || numeric > 250) return false;
  const management = ensureManagementState(state);
  management.ticketPrices[fixtureKey(fx)] = Math.round(numeric);
  // La API antigua sigue representando una tarifa plana de todas las localidades.
  management.ticketZonePrices[fixtureKey(fx)] = Object.fromEntries(TICKET_SECTORS.map(s => [s.id, Math.round(numeric)]));
  delete management.ticketLevelPrices[fixtureKey(fx)];
  return true;
}

export function getTicketPrice(state, fx) {
  if (fx?.meta?.ticketPriceLocked != null && Number.isFinite(Number(fx.meta.ticketPriceLocked))) return Number(fx.meta.ticketPriceLocked);
  const planned = Number(ensureManagementState(state).ticketPrices[fixtureKey(fx)]);
  return planned >= 5 && planned <= 250 ? planned : DEFAULT_TICKET_PRICE;
}

export function setTicketMode(state, mode) {
  if (mode !== 'auto' && mode !== 'manual') return false;
  ensureManagementState(state).ticketMode = mode;
  return true;
}

// Reparte plazas enteras sin perder ni inventar una sola localidad por redondeos.
// Los pesos son estimaciones de la simulación mientras no se conozca el aforo
// exacto de cada sector del recinto.
function allocateSeats(capacity, weights) {
  const normalized = weights.map(weight => Math.max(0, Number(weight) || 0));
  const total = normalized.reduce((sum, weight) => sum + weight, 0);
  const shares = normalized.map(weight => total ? weight / total : 1 / normalized.length);
  const exact = shares.map(share => capacity * share);
  const seats = exact.map(Math.floor);
  let pending = capacity - seats.reduce((sum, count) => sum + count, 0);
  const order = exact.map((value, i) => ({ i, fraction: value - seats[i] }))
    .sort((a, b) => b.fraction - a.fraction || a.i - b.i);
  for (let i = 0; i < pending; i++) seats[order[i].i]++;
  return seats;
}

export function getStadiumSectors(state, fx) {
  const home = (state.clubs || []).find(c => String(c.id) === String(fx?.homeClubId ?? state.user?.clubId));
  const rawCapacity = Number(fx?.meta?.stadiumCapacity || fx?.meta?.capacity || home?.stadium?.capacity || 30000);
  const capacity = Math.max(1, Math.round(Number.isFinite(rawCapacity) ? rawCapacity : 30000));
  const structure = getStadiumStructure(home);
  const fixed = structure.sectorCapacities;
  const hasOfficialBreakdown = fixed && TICKET_SECTORS.every(s => Number.isInteger(fixed[s.id]) && fixed[s.id] >= 0)
    && TICKET_SECTORS.reduce((sum, s) => sum + fixed[s.id], 0) === capacity;
  const weights = TICKET_SECTORS.map(s => {
    const stand = structure.stands?.[s.id];
    if (stand?.present === false || stand?.coverage === 0) return 0;
    const coverage = Math.max(0, Math.min(1, Number(stand?.coverage ?? 1)));
    // Un plano documentado puede abrir/cerrar parcialmente un fondo. La
    // superficie de graderío influye en el reparto salvo que haya aforos reales.
    const depth = Array.isArray(stand?.levels) && stand.levels.length
      ? stand.levels.reduce((sum, level) => sum + Math.max(0, Number(level?.weight ?? 1)), 0) : 1;
    return (structure.sectorShares?.[s.id] ?? s.share) * coverage * depth;
  });
  // A veces la fuente solo proporciona el aforo de UNA tribuna (p. ej. el
  // fondo sur de Tottenham). Se fija ese dato y se reparte solo el resto.
  const constraints = structure.sectorConstraints || {};
  const fixedSeats = TICKET_SECTORS.reduce((sum, s) => sum +
    (Number.isInteger(constraints[s.id]) && constraints[s.id] >= 0 ? constraints[s.id] : 0), 0);
  const hasPartialBreakdown = !hasOfficialBreakdown && fixedSeats > 0 && fixedSeats <= capacity
    && TICKET_SECTORS.some(s => Number.isInteger(constraints[s.id]) && constraints[s.id] >= 0)
    && TICKET_SECTORS.some((s, index) => !Number.isInteger(constraints[s.id]) && weights[index] > 0);
  const remaining = hasPartialBreakdown ? allocateSeats(capacity - fixedSeats,
    weights.map((weight, index) => Number.isInteger(constraints[TICKET_SECTORS[index].id]) ? 0 : weight)) : null;
  const capacities = hasOfficialBreakdown ? TICKET_SECTORS.map(s => fixed[s.id])
    : hasPartialBreakdown ? TICKET_SECTORS.map((s, i) => Number.isInteger(constraints[s.id])
      ? constraints[s.id] : remaining[i]) : allocateSeats(capacity, weights);
  const levelNames = Array.isArray(structure.levels) ? structure.levels : [];
  return TICKET_SECTORS.map((s, i) => {
    const seats = capacities[i];
    const stand = structure.stands?.[s.id];
    const sectorLevels = stand?.present === false ? [] : structure.sectorLevels?.[s.id] || levelNames;
    const providedWeights = structure.sectorLevelWeights?.[s.id];
    const levelWeights = Array.isArray(providedWeights) && providedWeights.length === sectorLevels.length
      ? providedWeights : sectorLevels.map(() => 1);
    const tierCounts = s.id === 'vip' || !sectorLevels.length ? [] : allocateSeats(seats, levelWeights);
    return {
      ...s,
      capacity: seats,
      share: seats / capacity,
      allocationStatus: hasOfficialBreakdown || (hasPartialBreakdown && Number.isInteger(constraints[s.id]))
        ? 'documented' : 'estimated',
      levels: tierCounts.map((count, index) => ({ name: sectorLevels[index], capacity: count, estimated: true })),
    };
  });
}

export function getTicketSectorPrices(state, fx) {
  const management = ensureManagementState(state);
  if (fx?.meta?.ticketZonePricesLocked) return { ...fx.meta.ticketZonePricesLocked };
  const key = fixtureKey(fx);
  const fixed = management.ticketZonePrices[key] || {};
  const base = getTicketPrice(state, fx);
  // Las partidas de v16.1 solo tenían un precio plano; conservar esa intención.
  if (management.ticketPrices[key] != null && management.ticketZonePrices[key] == null) {
    return Object.fromEntries(TICKET_SECTORS.map(s => [s.id, base]));
  }
  const opponent = (state.clubs || []).find(c => String(c.id) === String(fx?.awayClubId));
  const avg = (opponent?.players || []).slice(0, 18).reduce((sum, p) => sum + Number(p?.overall || 70), 0) / Math.max(1, Math.min(18, opponent?.players?.length || 0));
  const opponentFactor = management.ticketMode === 'auto' ? clamp(1 + (avg - 76) * 0.009, 0.85, 1.18) : 1;
  return Object.fromEntries(TICKET_SECTORS.map(s => [s.id,
    Number.isFinite(Number(fixed[s.id])) && Number(fixed[s.id]) >= 5 && Number(fixed[s.id]) <= 250
      ? Number(fixed[s.id]) : clamp(Math.round(base * s.factor * opponentFactor), 5, 250),
  ]));
}

export function setTicketSectorPrice(state, fx, sectorId, price) {
  if (!TICKET_SECTORS.some(s => s.id === sectorId) || !fx || fx.played ||
      String(fx.homeClubId) !== String(state.user?.clubId) || fx.meta?.ticketPriceLocked != null) return false;
  const value = Number(price);
  if (!Number.isFinite(value) || value < 5 || value > 250) return false;
  const management = ensureManagementState(state);
  const key = fixtureKey(fx);
  if (!management.ticketZonePrices[key]) management.ticketZonePrices[key] = {};
  management.ticketZonePrices[key][sectorId] = Math.round(value);
  // Ajustar una zona completa prevalece sobre precios antiguos de sus niveles.
  if (management.ticketLevelPrices[key]) delete management.ticketLevelPrices[key][sectorId];
  return true;
}

export function getTicketLevelPrices(state, fx, sectorId) {
  const sector = getStadiumSectors(state, fx).find(s => s.id === sectorId);
  if (!sector) return [];
  const management = ensureManagementState(state);
  const locked = fx?.meta?.ticketLevelPricesLocked?.[sectorId];
  const custom = locked || (fx?.meta?.ticketPriceLocked != null ? null : management.ticketLevelPrices[fixtureKey(fx)]?.[sectorId]);
  const base = getTicketSectorPrices(state, fx)[sectorId];
  return sector.levels.map((tier, index) => {
    const value = Number(custom?.[index]);
    return { ...tier, index, price: custom?.[index] != null && value >= 5 && value <= 250 ? value : base };
  });
}

export function setTicketLevelPrice(state, fx, sectorId, levelIndex, price) {
  if (!fx || fx.played || fx.meta?.ticketPriceLocked != null ||
      String(fx.homeClubId) !== String(state.user?.clubId) ||
      !Number.isInteger(levelIndex) || levelIndex < 0 ||
      !getStadiumSectors(state, fx).find(s => s.id === sectorId)?.levels[levelIndex]) return false;
  const value = Number(price);
  if (!Number.isFinite(value) || value < 5 || value > 250) return false;
  const management = ensureManagementState(state);
  const key = fixtureKey(fx);
  if (!management.ticketLevelPrices[key]) management.ticketLevelPrices[key] = {};
  if (!management.ticketLevelPrices[key][sectorId]) management.ticketLevelPrices[key][sectorId] = {};
  management.ticketLevelPrices[key][sectorId][levelIndex] = Math.round(value);
  return true;
}

export function adjustTicketSectorPrices(state, fixtures, { sectorId = 'all', levelIndex = null, operation = 'percent', amount = 0 } = {}) {
  if (!['all', ...TICKET_SECTORS.map(s => s.id)].includes(sectorId) ||
      !['percent', 'euros'].includes(operation) || !Number.isFinite(Number(amount))) return 0;
  if (levelIndex != null && (sectorId === 'all' || !Number.isInteger(levelIndex))) return 0;
  let changed = 0;
  for (const fx of fixtures || []) {
    const prices = getTicketSectorPrices(state, fx);
    for (const sector of TICKET_SECTORS) {
      if (sectorId !== 'all' && sector.id !== sectorId) continue;
      const updatedPrice = value => clamp(Math.round(operation === 'percent' ? value * (1 + Number(amount) / 100) : value + Number(amount)), 5, 250);
      if (levelIndex != null) {
        const tier = getTicketLevelPrices(state, fx, sector.id)[levelIndex];
        if (tier && setTicketLevelPrice(state, fx, sector.id, levelIndex, updatedPrice(tier.price))) changed++;
        continue;
      }
      const overrides = { ...ensureManagementState(state).ticketLevelPrices[fixtureKey(fx)]?.[sector.id] };
      const value = operation === 'percent' ? prices[sector.id] * (1 + Number(amount) / 100) : prices[sector.id] + Number(amount);
      if (setTicketSectorPrice(state, fx, sector.id, clamp(Math.round(value), 5, 250))) {
        changed++;
        for (const [index, tierPrice] of Object.entries(overrides)) {
          setTicketLevelPrice(state, fx, sector.id, Number(index), updatedPrice(Number(tierPrice)));
        }
      }
    }
  }
  return changed;
}

export function getTicketSalesProjection(state, fx, baseAttendance = null) {
  const sectors = getStadiumSectors(state, fx);
  const capacity = sectors.reduce((sum, sector) => sum + sector.capacity, 0);
  const attendance = clamp(Number(baseAttendance ?? fx?.meta?.attendance ?? capacity * 0.74), 0, capacity);
  const prices = getTicketSectorPrices(state, fx);
  const base = getTicketPrice(state, fx);
  let totalAttendance = 0;
  let totalRevenue = 0;
  const breakdown = sectors.map(sector => {
    const price = prices[sector.id];
    const reference = clamp(Math.round(base * sector.factor), 5, 250);
    const tiers = getTicketLevelPrices(state, fx, sector.id);
    const distributions = tiers.length ? tiers : [{ name: 'Zona completa', capacity: sector.capacity, price }];
    let filled = 0;
    let revenue = 0;
    const levels = distributions.map(tier => {
      const demand = clamp(1 - 0.30 * Math.log(tier.price / reference), 0.35, 1.18);
      const attendanceAtLevel = clamp(Math.round(attendance * tier.capacity / capacity * demand), 0, tier.capacity);
      const ticketRevenue = Math.round(attendanceAtLevel * tier.price);
      filled += attendanceAtLevel;
      revenue += ticketRevenue;
      return { ...tier, attendance: attendanceAtLevel, occupancy: tier.capacity ? attendanceAtLevel / tier.capacity : 0,
        revenue: ticketRevenue };
    });
    totalAttendance += filled;
    totalRevenue += revenue;
    return { ...sector, price, attendance: filled, occupancy: sector.capacity ? filled / sector.capacity : 0,
      revenue, levels };
  });
  return { capacity, attendance: totalAttendance, revenue: totalRevenue, breakdown };
}

export function setTrainingMode(state, mode) {
  if (mode !== 'auto' && mode !== 'manual') return false;
  ensureManagementState(state).trainingMode = mode;
  return true;
}

export function setPlayerTrainingFocus(state, playerId, focus) {
  if (!(focus in PLAYER_TRAINING_FOCUS)) return false;
  const player = (state.clubs || []).find(c => String(c.id) === String(state.user?.clubId))?.players
    ?.find(p => String(p.id) === String(playerId));
  if (!player) return false;
  const training = ensureManagementState(state).playerTraining;
  if (focus === 'general') delete training[String(playerId)];
  else training[String(playerId)] = focus;
  return true;
}

function playerTrainingSnapshot(player) {
  return {
    overall: Number(player?.overall || 0),
    fitness: Number(player?.fitness ?? 0.9),
    fatigue: Number(player?.fatigue || 0),
    form: Number(player?.form || 0),
    attributes: Object.fromEntries(TRAINED_ATTRIBUTES.map(({ key, group }) =>
      [key, Number(player?.attributes?.[group]?.[key] || 0)])),
  };
}

/** Registro de efectos reales de las sesiones, separado de los cambios por partidos. */
export function getPlayerTrainingReport(state, playerId, recentCount = 8) {
  const club = (state.clubs || []).find(c => String(c.id) === String(state.user?.clubId));
  const player = club?.players?.find(p => String(p.id) === String(playerId));
  if (!player) return null;
  const m = ensureManagementState(state);
  const id = String(player.id);
  const current = playerTrainingSnapshot(player);
  const entries = m.trainingLog.filter(day => day?.players && day.players[id])
    .map(day => {
      const record = day.players[id];
      // Compatibilidad con una sesión guardada antes de compactar el diario.
      const old = record.before && record.after ? {
        fitness: record.after.fitness - record.before.fitness,
        fatigue: record.after.fatigue - record.before.fatigue,
        form: record.after.form - record.before.form,
        overall: record.after.overall - record.before.overall,
      } : {};
      return { day: day.day, type: day.type, focus: record.focus, injured: record.injured,
        gains: record.gains || {}, changes: record.changes || old };
    });
  const initial = m.trainingInitial[id] || current;
  const sum = (value) => entries.reduce((total, entry) => total + (Number(value(entry)) || 0), 0);
  const totals = {
    sessions: entries.length,
    fitness: sum(e => e.changes.fitness),
    fatigue: sum(e => e.changes.fatigue),
    form: sum(e => e.changes.form),
    overall: sum(e => e.changes.overall),
    attributes: Object.fromEntries(TRAINED_ATTRIBUTES.map(({ key }) => [key, sum(e => e.gains?.[key])])),
  };
  return {
    playerId: id, name: player.name, focus: m.playerTraining[id] || 'general',
    injured: Number(player.injury?.matchesRemaining || 0) > 0,
    current, initial, totals,
    development: { points: Number(m.trainingDevelopment[id]?.points || 0), overallEarned: Number(m.trainingDevelopment[id]?.overallEarned || 0) },
    recent: Math.floor(recentCount) > 0 ? entries.slice(-Math.floor(recentCount)).reverse() : [],
  };
}

export function getUserFixturesOnDay(state, isoDay) {
  return (state.fixtures || []).filter(fx =>
    (String(fx.homeClubId) === String(state.user?.clubId) || String(fx.awayClubId) === String(state.user?.clubId)) &&
    fx.kickoffDate?.slice(0, 10) === isoDay);
}

export function getSeasonTrainingMonths(state) {
  const all = (state.fixtures || []).filter(fx =>
    (String(fx.homeClubId) === String(state.user?.clubId) || String(fx.awayClubId) === String(state.user?.clubId)) && validDate(fx.kickoffDate) != null)
    .map(fx => startOfDay(validDate(fx.kickoffDate))).sort((a, b) => a - b);
  const current = validDate(state.currentTimeISO) ?? Date.now();
  const first = new Date(Math.min(all[0] ?? current, current));
  const last = new Date(Math.max(all[all.length - 1] ?? current, current));
  const months = [];
  for (let tick = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
    tick <= Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), 1);
    tick = Date.UTC(new Date(tick).getUTCFullYear(), new Date(tick).getUTCMonth() + 1, 1)) {
    months.push(new Date(tick).toISOString().slice(0, 7));
  }
  return months;
}

export function getTrainingDayPlan(state, isoDay) {
  const management = ensureManagementState(state);
  const fixtures = (state.fixtures || []).filter(fx =>
    String(fx.homeClubId) === String(state.user?.clubId) || String(fx.awayClubId) === String(state.user?.clubId));
  const matches = fixtures.map(fx => fx.kickoffDate?.slice(0, 10)).filter(Boolean).sort();
  const nowDay = state.currentTimeISO?.slice(0, 10) || '';
  const played = Boolean(management.trainingApplied[isoDay]);
  const locked = played || (nowDay && isoDay < nowDay) || management.stage === MANAGEMENT_STAGES.POST;
  if (matches.includes(isoDay)) return { type: 'match', source: 'fixture', locked: true, played };
  if (management.trainingDays[isoDay] in TRAINING_TYPES) {
    return { type: management.trainingDays[isoDay], source: 'manual', locked, played };
  }
  if (management.trainingMode === 'manual') return { type: 'balanced', source: 'default', locked, played };
  const previous = matches.filter(d => d < isoDay).at(-1);
  const next = matches.find(d => d > isoDay);
  const delta = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY_MS);
  const weekday = new Date(`${isoDay}T12:00:00Z`).getUTCDay();
  let type = weekday === 0 ? 'rest' : weekday === 1 ? 'intense' : weekday === 2 ? 'technical'
    : weekday === 3 ? 'tactical' : weekday === 4 ? 'balanced' : weekday === 5 ? 'technical' : 'recovery';
  if (previous && delta(isoDay, previous) === 1) type = 'recovery';
  else if (next && delta(next, isoDay) === 1) type = 'tactical';
  else if (next && delta(next, isoDay) === 2) type = 'balanced';
  // Si la plantilla llega muy cargada, el modo automático cambia la sesión.
  const players = (state.clubs || []).find(c => String(c.id) === String(state.user?.clubId))?.players || [];
  if (players.length) {
    const fatigue = players.reduce((sum, p) => sum + Number(p.fatigue || 0), 0) / players.length;
    const fitness = players.reduce((sum, p) => sum + Number(p.fitness ?? 0.9), 0) / players.length;
    if (fatigue >= 58 || fitness < 0.71) type = 'recovery';
  }
  return { type, source: 'auto', locked, played };
}

export function setTrainingDay(state, isoDay, type) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDay)) || !(type in TRAINING_TYPES)) return false;
  const selectedDay = validDate(`${isoDay}T00:00:00Z`);
  const today = validDate(state.currentTimeISO || '');
  if (selectedDay == null || getUserFixturesOnDay(state, isoDay).length ||
      ensureManagementState(state).trainingApplied[isoDay] ||
      (today != null && selectedDay < startOfDay(today))) return false;
  ensureManagementState(state).trainingDays[isoDay] = type;
  return true;
}

export function clearTrainingDay(state, isoDay) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDay))) return false;
  const management = ensureManagementState(state);
  if (management.trainingApplied[isoDay] || getUserFixturesOnDay(state, isoDay).length ||
    (state.currentTimeISO && isoDay < state.currentTimeISO.slice(0, 10))) return false;
  delete management.trainingDays[isoDay];
  return true;
}

export function getTrainingDaysToPlan(state, count = 7) {
  const next = getPendingUserFixtures(state)[0];
  if (!next) return [];
  const m = ensureManagementState(state);
  const kickoff = validDate(next.kickoffDate);
  const starting = m.stage === MANAGEMENT_STAGES.MATCHDAY
    ? Date.UTC(new Date(kickoff).getUTCFullYear(), new Date(kickoff).getUTCMonth(), new Date(kickoff).getUTCDate() + 1)
    : validDate(state.currentTimeISO) || kickoff - 6 * 86400000;
  const start = new Date(starting);
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const days = [];
  for (let i = 0; i < count; i++) {
    const t = startDay + i * 86400000;
    if (m.stage === MANAGEMENT_STAGES.WEEK && t >= Date.UTC(new Date(kickoff).getUTCFullYear(), new Date(kickoff).getUTCMonth(), new Date(kickoff).getUTCDate())) break;
    days.push(dayKeyUTC(t));
  }
  return days;
}

// Una sola aplicación por fecha (cualquier actualización o recarga es idempotente).
export function applyScheduledTraining(state, fromISO, throughISO) {
  const start = validDate(fromISO);
  const finish = validDate(throughISO);
  if (start == null || finish == null || finish < start) return 0;
  const m = ensureManagementState(state);
  const startDate = new Date(start);
  let tick = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const endDate = new Date(finish);
  const endDay = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  const players = (state.clubs || []).find((c) => String(c.id) === String(state.user?.clubId))?.players || [];
  let applied = 0;
  for (; tick < endDay; tick += 86400000) {
    const day = dayKeyUTC(tick);
    if (m.trainingApplied[day]) continue;
    const type = getTrainingDayPlan(state, day).type;
    if (type === 'match') { m.trainingApplied[day] = true; continue; }
    const dayRecord = { day, type, players: {} };
    for (const p of players) {
      if (!p) continue;
      const id = String(p.id);
      const before = playerTrainingSnapshot(p);
      if (!m.trainingInitial[id]) m.trainingInitial[id] = before;
      const injured = Number(p.injury?.matchesRemaining || 0) > 0;
      const focus = m.playerTraining[id] || 'general';
      const delta = ({ rest: 0.065, recovery: 0.070, intense: 0.018, technical: 0.038, tactical: 0.040, balanced: 0.045 })[type];
      const fatigue = ({ rest: -10, recovery: -8, intense: 9, technical: 1, tactical: -1, balanced: -3 })[type];
      p.fitness = Math.max(0.30, Math.min(0.99, Number(p.fitness ?? 0.9) + (injured ? Math.max(0, delta) : delta) + (focus === 'recovery' ? 0.008 : 0)));
      p.fatigue = Math.max(0, Math.min(100, Number(p.fatigue || 0) + (injured ? Math.min(0, fatigue) : fatigue) - (focus === 'recovery' ? 2 : 0)));
      const gains = {};
      const exhausted = Number(before.fatigue) >= 70 || Number(before.fitness) < 0.55;
      const trainingEfficiency = exhausted ? 0.55 : 1;
      const improve = (group, attr, amount) => {
        const previous = Number(p.attributes?.[group]?.[attr]);
        if (!Number.isFinite(previous)) return;
        const next = clamp(previous + amount * trainingEfficiency, 1, 99);
        const gained = Math.max(0, next - previous);
        if (gained > 0) {
          p.attributes[group][attr] = next;
          gains[attr] = (gains[attr] || 0) + gained;
        }
      };
      // Microprogresión: entrenar durante semanas tiene efecto, sin mejorar varios puntos de golpe.
      if (!injured && type === 'technical' && p.attributes?.technical) {
        for (const attr of ['passing', 'dribbling', 'shooting', 'tackling']) improve('technical', attr, 0.018);
      }
      if (!injured && type === 'intense') improve('physical', 'stamina', 0.018);
      if (!injured && type === 'tactical') p.form = clamp(Number(p.form || 0) + 0.015, -3, 3);
      if (!injured && !['rest', 'recovery'].includes(type) && focus !== 'general' && focus !== 'recovery') {
        improve(focus === 'stamina' ? 'physical' : 'technical', focus, 0.025);
      }
      // Una mejora global exige progreso sostenido en atributos, con máximo 3 puntos por temporada.
      // Este acumulador se guarda para evitar cambios arbitrarios de media en cada sesión.
      const progress = m.trainingDevelopment[id] ||= { points: 0, overallEarned: 0 };
      progress.points = Math.max(0, Number(progress.points || 0)) + Object.values(gains).reduce((sum, gain) => sum + gain, 0);
      progress.overallEarned = Math.max(0, Number(progress.overallEarned || 0));
      if (progress.points >= 3.5 && progress.overallEarned < 3 && Number(p.overall) < 99) {
        p.overall = Math.min(99, Math.round(Number(p.overall || 60)) + 1);
        progress.points -= 3.5;
        progress.overallEarned++;
      }
      const after = playerTrainingSnapshot(p);
      dayRecord.players[id] = { focus, injured,
        changes: { fitness: after.fitness - before.fitness, fatigue: after.fatigue - before.fatigue,
          form: after.form - before.form, overall: after.overall - before.overall }, gains };
    }
    m.trainingLog.push(dayRecord);
    m.trainingApplied[day] = true;
    applied++;
  }
  return applied;
}

export function lockCurrentTicketPrice(state, fx) {
  if (!fx || fx.played || String(fx.homeClubId) !== String(state.user?.clubId)) return;
  if (!fx.meta || typeof fx.meta !== 'object') fx.meta = {};
  if (fx.meta.ticketPriceLocked == null) fx.meta.ticketPriceLocked = getTicketPrice(state, fx);
  if (!fx.meta.ticketZonePricesLocked) fx.meta.ticketZonePricesLocked = getTicketSectorPrices(state, fx);
  if (!fx.meta.ticketLevelPricesLocked) fx.meta.ticketLevelPricesLocked = structuredClone(ensureManagementState(state).ticketLevelPrices[fixtureKey(fx)] || {});
}

// Recaudación real a la caja del club, solo una vez y únicamente como local.
export function settleUserTicketSales(state, fx) {
  if (!fx?.played || String(fx.homeClubId) !== String(state.user?.clubId)) return 0;
  if (!fx.meta || typeof fx.meta !== 'object') fx.meta = {};
  if (fx.meta.ticketRevenueApplied) return 0;
  lockTicketPriceAfterMatch(state, fx);
  const home = (state.clubs || []).find((club) => String(club.id) === String(fx.homeClubId));
  if (!home) return 0;
  const result = getTicketSalesProjection(state, fx, Math.max(0, Number(fx.meta.attendance || 0)));
  fx.meta.attendance = result.attendance;
  fx.meta.ticketRevenue = result.revenue;
  fx.meta.ticketRevenueBySector = result.breakdown.map(({ id, capacity, attendance, price, revenue }) => ({ id, capacity, attendance, price, revenue }));
  fx.meta.ticketRevenueByLevel = result.breakdown.flatMap(sector => sector.levels.map((tier, index) => ({
    sectorId: sector.id, levelIndex: index, name: tier.name,
    capacity: tier.capacity, attendance: tier.attendance, price: tier.price, revenue: tier.revenue,
  })));
  fx.meta.ticketRevenueApplied = true;
  home.cash = Number(home.cash || 0) + result.revenue;
  return result.revenue;
}

function lockTicketPriceAfterMatch(state, fx) {
  lockCurrentTicketPriceAfterMatch(state, fx);
}

function lockCurrentTicketPriceAfterMatch(state, fx) {
  if (fx.meta.ticketPriceLocked == null) fx.meta.ticketPriceLocked = getTicketPrice(state, fx);
  if (!fx.meta.ticketZonePricesLocked) fx.meta.ticketZonePricesLocked = getTicketSectorPrices(state, fx);
  if (!fx.meta.ticketLevelPricesLocked) fx.meta.ticketLevelPricesLocked = structuredClone(ensureManagementState(state).ticketLevelPrices[fixtureKey(fx)] || {});
}
