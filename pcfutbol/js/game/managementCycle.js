// Fase 16.1: dos pausas de gestión por encuentro, sin reloj en tiempo real.
// Todas las decisiones se guardan dentro de GameState (exportación JSON normal).

export const MANAGEMENT_STAGES = Object.freeze({ WEEK: 'week', MATCHDAY: 'matchday', POST: 'post' });
export const TRAINING_TYPES = Object.freeze({ rest: 'Descanso', recovery: 'Recuperación', balanced: 'Equilibrado', intense: 'Intensivo' });
export const DEFAULT_TICKET_PRICE = 35;

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
  if (!m.trainingDays || typeof m.trainingDays !== 'object') m.trainingDays = {};
  if (!m.trainingApplied || typeof m.trainingApplied !== 'object') m.trainingApplied = {};
  return m;
}

export function getManagementStage(state) { return ensureManagementState(state).stage; }

export function setTicketPrice(state, fx, price) {
  if (!fx || fx.played || String(fx.homeClubId) !== String(state.user?.clubId)) return false;
  if (fx.meta?.ticketPriceLocked != null) return false;
  const numeric = Number(price);
  if (!Number.isFinite(numeric) || numeric < 5 || numeric > 250) return false;
  ensureManagementState(state).ticketPrices[fixtureKey(fx)] = Math.round(numeric);
  return true;
}

export function getTicketPrice(state, fx) {
  if (fx?.meta?.ticketPriceLocked != null && Number.isFinite(Number(fx.meta.ticketPriceLocked))) return Number(fx.meta.ticketPriceLocked);
  const planned = Number(ensureManagementState(state).ticketPrices[fixtureKey(fx)]);
  return planned >= 5 && planned <= 250 ? planned : DEFAULT_TICKET_PRICE;
}

export function setTrainingDay(state, isoDay, type) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDay)) || !(type in TRAINING_TYPES)) return false;
  const selectedDay = validDate(`${isoDay}T00:00:00Z`);
  const today = validDate(state.currentTimeISO || '');
  if (selectedDay == null || (today != null && selectedDay < Date.UTC(new Date(today).getUTCFullYear(), new Date(today).getUTCMonth(), new Date(today).getUTCDate()))) return false;
  ensureManagementState(state).trainingDays[isoDay] = type;
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
    const type = m.trainingDays[day] || 'balanced';
    for (const p of players) {
      if (!p) continue;
      const injured = Number(p.injury?.matchesRemaining || 0) > 0;
      const delta = type === 'rest' ? 0.065 : type === 'recovery' ? 0.070 : type === 'intense' ? 0.025 : 0.045;
      const fatigue = type === 'rest' ? -10 : type === 'recovery' ? -8 : type === 'intense' ? 7 : -3;
      p.fitness = Math.max(0.30, Math.min(0.99, Number(p.fitness ?? 0.9) + (injured ? Math.max(0, delta) : delta)));
      p.fatigue = Math.max(0, Math.min(100, Number(p.fatigue || 0) + (injured ? Math.min(0, fatigue) : fatigue)));
    }
    m.trainingApplied[day] = true;
    applied++;
  }
  return applied;
}

export function lockCurrentTicketPrice(state, fx) {
  if (!fx || fx.played || String(fx.homeClubId) !== String(state.user?.clubId)) return;
  if (!fx.meta || typeof fx.meta !== 'object') fx.meta = {};
  if (fx.meta.ticketPriceLocked == null) fx.meta.ticketPriceLocked = getTicketPrice(state, fx);
}

// Recaudación real a la caja del club, solo una vez y únicamente como local.
export function settleUserTicketSales(state, fx) {
  if (!fx?.played || String(fx.homeClubId) !== String(state.user?.clubId)) return 0;
  if (!fx.meta || typeof fx.meta !== 'object') fx.meta = {};
  if (fx.meta.ticketRevenueApplied) return 0;
  lockTicketPriceAfterMatch(state, fx);
  const home = (state.clubs || []).find((club) => String(club.id) === String(fx.homeClubId));
  if (!home) return 0;
  const capacity = Math.max(1, Number(fx.meta.stadiumCapacity || home.stadium?.capacity || 30000));
  const baseAttendance = Math.max(0, Number(fx.meta.attendance || 0));
  const price = Number(fx.meta.ticketPriceLocked);
  const demand = Math.max(0.65, Math.min(1.13, 1 - ((price - DEFAULT_TICKET_PRICE) / DEFAULT_TICKET_PRICE) * 0.18));
  const attendance = Math.min(capacity, Math.round(baseAttendance * demand));
  const revenue = attendance * price;
  fx.meta.attendance = attendance;
  fx.meta.ticketRevenue = revenue;
  fx.meta.ticketRevenueApplied = true;
  home.cash = Number(home.cash || 0) + revenue;
  return revenue;
}

function lockTicketPriceAfterMatch(state, fx) {
  if (fx.meta.ticketPriceLocked == null) fx.meta.ticketPriceLocked = getTicketPrice(state, fx);
}
