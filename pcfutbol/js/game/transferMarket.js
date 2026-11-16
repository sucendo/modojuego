// Mercado de PC Fútbol Manager. Motor independiente del DOM y del reloj real.
// Las decisiones de clubes/jugadores son reproducibles y la IA solo actúa
// cuando avanza la fecha del juego (nunca al redibujar una pantalla).
import { GameState, ensureTransferMarketState } from '../state.js';
import { isPlayerUnavailable } from './utils/availability.js';
import { getReleaseClause, getSuggestedReleaseClause, evaluateReleaseClause } from './contracts.js';
import { FIRST_SEASON_YEAR, getSeasonStartYear } from '../gameSeason.js';
import { selectValidStartingXI } from './utils/lineupSelection.js';
export { getReleaseClause } from './contracts.js';

const MIN_SQUAD = 16;
const MAX_SQUAD = 30;
const WEEK_MS = 7 * 86400000;
const int = (v) => Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
const roundFee = (v) => Math.max(10000, Math.round(v / 10000) * 10000);
const same = (a, b) => String(a) === String(b);

export const AI_MARKET_RULES = Object.freeze({
  firstSummerStartDay: 22,        // Sin efecto en la primera campaña: verano bloqueado.
  firstSummerSignings: 0,        // Las plantillas 2026/27 se mantienen hasta enero de 2027.
  firstWinterSignings: 2,
  firstSeasonSignings: 2,         // Sin verano inicial: solo hasta dos entradas en enero.
  laterSummerSignings: 3,
  laterWinterSignings: 2,
  laterSeasonSignings: 5,
  protectedFirstEleven: 9,       // >= 9/11 titulares originales (~82 %).
  protectedLaterEleven: 7,
  firstSeasonSales: 2,
  laterSeasonSales: 4,
  firstSeasonWeeklyChance: 0.065,
  laterSeasonWeeklyChance: 0.12,
});

function fail(message, extra = {}) { return { ok: false, message, ...extra }; }
function market() {
  return GameState.marketState?.baselines ? GameState.marketState : ensureTransferMarketState();
}
function clubKey(leagueId, clubId, season = GameState.currentDate?.season || 1) {
  return `${season}:${leagueId}:${clubId}`;
}
function group(position) {
  const p = String(position || '').toUpperCase();
  if (p === 'GK' || p === 'POR') return 'GK';
  if (['CB', 'RB', 'LB', 'RWB', 'LWB', 'DFC', 'LD', 'LI'].includes(p)) return 'DEF';
  if (['ST', 'CF', 'FW', 'DC', 'RW', 'LW', 'ED', 'EI'].includes(p)) return 'ATT';
  return 'MID';
}
function countGroup(club, pos) {
  return (club.players || []).filter(p => group(p.position) === pos).length;
}
function teamLevel(club) {
  const best = (club?.players || []).map(p => int(p.overall)).sort((a, b) => b - a).slice(0, 11);
  return best.reduce((sum, n) => sum + n, 0) / Math.max(1, best.length);
}
function hash01(value) {
  let h = 2166136261;
  for (const char of String(value)) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}
function gameDate() {
  const ms = Date.parse(GameState.currentTimeISO || '');
  if (Number.isFinite(ms)) return new Date(ms);
  return new Date(Date.UTC(getSeasonStartYear(GameState.currentDate?.season), 7, 1));
}

export function getMarketClubs() {
  const result = [];
  const append = (lg, clubs) => {
    for (const club of clubs || []) {
      if (!club?.id || !Array.isArray(club.players)) continue;
      result.push({ club, leagueId: lg?.id || '', leagueName: lg?.name || '' });
    }
  };
  append(GameState.league, GameState.clubs);
  for (const lg of GameState.world?.leagues || []) append(lg, lg.clubs);
  return result;
}
function findEntry(leagueId, clubId) {
  return getMarketClubs().find(e => same(e.leagueId, leagueId) && same(e.club.id, clubId)) || null;
}
function userClub() {
  return GameState.clubs?.find(c => same(c.id, GameState.user?.clubId)) || null;
}
function baseline(entry, season = GameState.currentDate?.season || 1) {
  return market().baselines[clubKey(entry.leagueId, entry.club.id, season)] || { xi: [], squad: [] };
}
function protectedCore(entry, player, season) {
  if (Number(season) !== 1) return false;
  return baseline(entry, season).xi.slice(0, AI_MARKET_RULES.protectedFirstEleven)
    .some(id => same(id, player.id));
}
function remainingOriginalXi(entry, season) {
  const ids = new Set((entry.club.players || []).map(p => String(p.id)));
  return baseline(entry, season).xi.filter(id => ids.has(String(id))).length;
}

export function getTransferPrice(player) {
  return roundFee(Math.max(100000, int(player?.value)) * (player?.transferListed ? 0.95 : 1.15));
}
export function getSalePrice(player) {
  return roundFee(Math.max(100000, int(player?.value)) * 0.80);
}
function canSell(sourceEntry, player, { autonomous = false, season = 1 } = {}) {
  const source = sourceEntry.club;
  if (source.players.length <= MIN_SQUAD) return fail('El vendedor debe conservar al menos 16 jugadores.');
  if (group(player.position) === 'GK' && countGroup(source, 'GK') <= 1) {
    return fail('El vendedor no puede quedarse sin portero.');
  }
  if (autonomous) {
    const minimumByLine = { GK: 2, DEF: 4, MID: 3, ATT: 2 };
    if (countGroup(source, group(player.position)) <= minimumByLine[group(player.position)]) {
      return fail('No tiene suficientes jugadores de esa demarcación para vender.');
    }
    const salesCap = season === 1 ? AI_MARKET_RULES.firstSeasonSales : AI_MARKET_RULES.laterSeasonSales;
    if (countDepartures(sourceEntry, season) >= salesCap) return fail('El club ya ha realizado suficientes ventas esta temporada.');
    if (protectedCore(sourceEntry, player, season)) return fail('Titular protegido por la continuidad de plantilla.');
    const minCore = season === 1 ? AI_MARKET_RULES.protectedFirstEleven : AI_MARKET_RULES.protectedLaterEleven;
    if (baseline(sourceEntry, season).xi.some(id => same(id, player.id)) &&
      remainingOriginalXi(sourceEntry, season) <= minCore) {
      return fail('El club mantiene su núcleo original.');
    }
  }
  return { ok: true };
}

function getClubDemand(sourceEntry, buyerEntry, player) {
  const source = sourceEntry.club;
  const playerGroup = group(player.position);
  const sameGroup = countGroup(source, playerGroup);
  const important = (source.lineup || []).some(id => same(id, player.id));
  const remaining = Math.max(1, Math.min(5, int(player.contractYears || 2)));
  let factor = player.transferListed ? 0.91 : 1.12;
  if (important) factor += 0.19;
  if (remaining >= 3) factor += 0.07;
  if (sameGroup <= (playerGroup === 'GK' ? 2 : 4)) factor += 0.12;
  if (int(source.cash) < int(buyerEntry.club.cash) * 0.15) factor -= 0.05;
  if (protectedCore(sourceEntry, player, GameState.currentDate?.season || 1)) factor += 0.65;
  return roundFee(Math.max(100000, int(player.value)) * Math.max(0.8, factor));
}

export function evaluateClubOffer({ leagueId, clubId, playerId, fee, viaClause = false, buyerEntry = null, autonomous = false }) {
  const seller = findEntry(leagueId, clubId);
  const buyer = buyerEntry || findEntry(GameState.league?.id, GameState.user?.clubId);
  if (!seller || !buyer || seller.club === buyer.club) return fail('No existe ese club vendedor o comprador.');
  const player = seller.club.players.find(p => same(p.id, playerId));
  if (!player) return fail('El jugador ya no está disponible.');
  const valid = canSell(seller, player, { autonomous, season: GameState.currentDate?.season || 1 });
  if (!valid.ok) return valid;
  const offer = Number(fee);
  if (!Number.isSafeInteger(offer) || offer <= 0) return fail('Introduce un importe válido en euros.');
  const clause = getReleaseClause(player);
  const price = viaClause ? clause : getClubDemand(seller, buyer, player);
  if (viaClause && offer < clause) {
    return fail(`La cláusula es de ${clause.toLocaleString('es-ES')} €.`, { counterOffer: clause });
  }
  if (!viaClause && offer < price) {
    return fail('El club rechaza la oferta y propone otra cantidad.', { counterOffer: price });
  }
  if (buyer.club.players.length >= MAX_SQUAD) return fail('Tu plantilla ya tiene 30 jugadores.');
  if (int(buyer.club.cash) < (viaClause ? clause : offer)) {
    return fail('Tu club no dispone de fondos para pagar esta cantidad.');
  }
  return {
    ok: true,
    message: viaClause
      ? 'Cláusula abonable: el club no puede bloquear la salida, pero el jugador debe aceptar.'
      : 'El club acepta el traspaso. Ahora hay que convencer al futbolista.',
    fee: viaClause ? clause : offer,
    viaClause: !!viaClause,
    playerName: player.name,
  };
}

export function getPlayerRequirements(player, sellerClub, buyerClub) {
  const overall = int(player.overall || 65);
  let age = int(player.age || 26);
  const birthday = Date.parse(player.birthDate || '');
  if (Number.isFinite(birthday)) {
    const today = gameDate();
    const born = new Date(birthday);
    age = today.getUTCFullYear() - born.getUTCFullYear() -
      Number(today.getUTCMonth() < born.getUTCMonth() ||
        (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() < born.getUTCDate()));
  }
  const buyerLevel = teamLevel(buyerClub);
  const sellerLevel = teamLevel(sellerClub);
  const levelPenalty = Math.max(0, sellerLevel - buyerLevel) / 75;
  const ambitionBonus = Math.max(0, buyerLevel - sellerLevel) / 125;
  const minimumWage = roundFee(Math.max(120000, int(player.wage)) *
    Math.max(0.98, 1.10 + levelPenalty - ambitionBonus));
  const expectedRole = overall > buyerLevel + 2 ? 'STARTER' : 'ROTATION';
  return { minimumWage, expectedRole, minYears: age < 25 ? 3 : 1, maxYears: age >= 33 ? 2 : 5 };
}

export function evaluatePlayerOffer({ player, source, destination, wage, years, role = 'STARTER', releaseClause }) {
  const salary = Number(wage);
  const duration = Number(years);
  if (!Number.isSafeInteger(salary) || salary <= 0) return fail('Introduce un salario anual válido.');
  if (!Number.isSafeInteger(duration) || duration < 1 || duration > 5) return fail('El contrato debe durar entre 1 y 5 años.');
  if (!['STARTER', 'ROTATION', 'PROSPECT'].includes(role)) return fail('Rol de plantilla no válido.');
  const req = getPlayerRequirements(player, source, destination);
  if (duration < req.minYears || duration > req.maxYears) {
    return fail(`El jugador pide un contrato de ${req.minYears} a ${req.maxYears} años.`, { requirements: req });
  }
  if (salary < req.minimumWage) {
    return fail(`El futbolista pide al menos ${req.minimumWage.toLocaleString('es-ES')} € al año.`, { requirements: req });
  }
  const clauseDecision = evaluateReleaseClause({
    player, years: duration, wage: salary,
    releaseClause: releaseClause ?? getSuggestedReleaseClause(player, duration),
  });
  if (!clauseDecision.ok) return fail(clauseDecision.message, { requirements: req, clauseDecision });
  if (req.expectedRole === 'STARTER' && role !== 'STARTER') {
    return fail('Quiere garantías de jugar como titular.', { requirements: req });
  }
  if (role === 'PROSPECT' && int(player.overall) > teamLevel(destination) - 4) {
    return fail('El jugador no acepta un papel de promesa.', { requirements: req });
  }
  return { ok: true, message: 'El futbolista acepta el salario, la duración y el rol.', requirements: req };
}

function validFinances(source, destination, player, fee, wage) {
  if (destination.players.length >= MAX_SQUAD) return fail('La plantilla compradora ya tiene 30 jugadores.');
  if (destination.players.some(p => same(p.id, player.id))) return fail('Ese jugador ya está en el destino.');
  if (int(destination.cash) < fee) return fail('El club comprador no dispone del dinero necesario.');
  if (int(destination.wageBudget) < wage) return fail('El presupuesto salarial no permite este contrato.');
  if (source.players.length <= MIN_SQUAD) return fail('El vendedor no dispone de suficientes jugadores.');
  if (group(player.position) === 'GK' && countGroup(source, 'GK') <= 1) return fail('El vendedor necesita un portero.');
  return { ok: true };
}

// Conserva los convocados que siguen en el club, rellena bajas y evita IDs ajenos.
function reconcileSquad(club) {
  const all = (club.players || []).filter(p => p?.id);
  const ordered = all.filter(p => !isPlayerUnavailable(p))
    .sort((a, b) => int(b.overall) - int(a.overall));
  const xi = selectValidStartingXI(all, club.lineup, isPlayerUnavailable);
  const chosen = new Set(xi.map(String));
  const bench = [];
  const append = id => {
    const player = ordered.find(p => same(p.id, id));
    if (!player || chosen.has(String(id)) || bench.length >= 9) return;
    chosen.add(String(id));
    bench.push(player.id);
  };
  for (const id of club.bench || []) append(id);
  for (const player of ordered) append(player.id);
  club.lineup = xi;
  club.bench = bench;
}

function transferPlayer(sellerEntry, buyerEntry, player, fee, salary, years, role, type, viaClause = false, transferDateISO = null, releaseClause = null) {
  const seller = sellerEntry.club;
  const buyer = buyerEntry.club;
  const check = validFinances(seller, buyer, player, fee, salary);
  if (!check.ok) return check;
  const idx = seller.players.findIndex(p => same(p.id, player.id));
  if (idx < 0) return fail('El futbolista ya ha cambiado de equipo.');
  const oldWage = int(player.wage);
  seller.players.splice(idx, 1);
  player.wage = salary;
  player.contractYears = years;
  player.squadRole = role;
  player.releaseClause = releaseClause ?? getSuggestedReleaseClause(player, years);
  player.transferListed = false;
  buyer.players.push(player);
  seller.cash = int(seller.cash) + fee;
  buyer.cash = int(buyer.cash) - fee;
  seller.wageBudget = int(seller.wageBudget) + oldWage;
  buyer.wageBudget = int(buyer.wageBudget) - salary;
  reconcileSquad(seller);
  reconcileSquad(buyer);
  if (!Array.isArray(GameState.transferHistory)) GameState.transferHistory = [];
  const history = {
    id: `transfer_${GameState.transferHistory.length + 1}_${player.id}`,
    type, method: viaClause ? 'clause' : 'negotiated',
    playerId: player.id, playerName: player.name || 'Jugador',
    fromClubId: seller.id, fromLeagueId: sellerEntry.leagueId, fromClubName: seller.name || seller.id,
    toClubId: buyer.id, toLeagueId: buyerEntry.leagueId, toClubName: buyer.name || buyer.id,
    fee, wage: salary, years, role, releaseClause: player.releaseClause,
    season: GameState.currentDate?.season || 1,
    matchday: GameState.currentDate?.matchday || 1,
    gameDate: transferDateISO || gameDate().toISOString(),
  };
  GameState.transferHistory.unshift(history);
  market().userAgreement = null;
  return { ok: true, message: `${history.playerName} ficha por ${history.toClubName}.`, transfer: history };
}

export function searchTransferMarket({ query = '', position = 'ALL', leagueId = 'ALL',
  minAge = null, maxAge = null, minOverall = null, maxPrice = null,
  onlyListed = false, sortBy = 'overall', sortDirection = 'desc', limit = 70 } = {}) {
  const q = String(query).trim().toLocaleLowerCase('es');
  const result = [];
  for (const entry of getMarketClubs()) {
    if (entry.club === userClub()) continue;
    if (leagueId !== 'ALL' && entry.leagueId !== leagueId) continue;
    for (const player of entry.club.players) {
      if (!player?.id || (position !== 'ALL' && group(player.position) !== position)) continue;
      if (q && !`${player.name || ''} ${player.fullName || ''} ${player.nationality || ''} ${entry.club.name || ''}`.toLocaleLowerCase('es').includes(q)) continue;
      const age = Number(player.age);
      const overall = int(player.overall);
      const price = getTransferPrice(player);
      if (onlyListed && !player.transferListed) continue;
      if (minAge != null && (!Number.isFinite(age) || age < Number(minAge))) continue;
      if (maxAge != null && (!Number.isFinite(age) || age > Number(maxAge))) continue;
      if (minOverall != null && overall < Number(minOverall)) continue;
      if (maxPrice != null && price > Number(maxPrice)) continue;
      result.push({
        playerId: player.id, clubId: entry.club.id, clubName: entry.club.name,
        leagueId: entry.leagueId, leagueName: entry.leagueName,
        name: player.name || 'Jugador', age: player.age || null,
        ageEstimated: !!player.ageEstimated,
        position: player.position || '-', overall,
        wage: int(player.wage), price,
        releaseClause: getReleaseClause(player), listed: !!player.transferListed,
      });
    }
  }
  const key = ['name','clubName','position','overall','age','price'].includes(sortBy) ? sortBy : 'overall';
  const direction = sortDirection === 'asc' ? 1 : -1;
  result.sort((a, b) => {
    const av = a[key], bv = b[key];
    const order = typeof av === 'number' && typeof bv === 'number'
      ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''), 'es');
    return direction * order || Number(b.listed) - Number(a.listed) || String(a.name).localeCompare(String(b.name), 'es');
  });
  return result.slice(0, Math.max(1, Math.min(200, Number(limit) || 70)));
}

export function negotiateWithClub({ leagueId, clubId, playerId, fee, viaClause = false }) {
  market().userAgreement = null;
  const decision = evaluateClubOffer({ leagueId, clubId, playerId, fee, viaClause });
  if (!decision.ok) return decision;
  market().userAgreement = {
    leagueId, clubId, playerId, fee: decision.fee, viaClause,
    destinationId: GameState.user?.clubId,
  };
  return decision;
}

// Paso final: exige acuerdo previo con el club y después conformidad del jugador.
export function makeTransferOffer({ leagueId, clubId, playerId, fee, wage, years, role = 'STARTER', viaClause = false, releaseClause }) {
  const deal = market().userAgreement;
  if (!deal || !same(deal.leagueId, leagueId) || !same(deal.clubId, clubId) ||
    !same(deal.playerId, playerId) || !same(deal.destinationId, GameState.user?.clubId) ||
    deal.viaClause !== !!viaClause || Number(fee) !== deal.fee) {
    return fail('Primero debes llegar a un acuerdo con el club vendedor.');
  }
  const seller = findEntry(leagueId, clubId);
  const buyer = findEntry(GameState.league?.id, GameState.user?.clubId);
  const player = seller?.club.players.find(p => same(p.id, playerId));
  if (!player || !buyer) return fail('La oferta ha caducado: jugador o club no disponible.');
  const clubDecision = evaluateClubOffer({ leagueId, clubId, playerId, fee, viaClause });
  if (!clubDecision.ok) { market().userAgreement = null; return clubDecision; }
  const playerDecision = evaluatePlayerOffer({
    player, source: seller.club, destination: buyer.club,
    wage: Number(wage), years: Number(years), role,
    releaseClause: releaseClause == null ? undefined : Number(releaseClause),
  });
  if (!playerDecision.ok) return playerDecision;
  return transferPlayer(seller, buyer, player, clubDecision.fee, Number(wage), Number(years), role,
    'buy', viaClause, null, releaseClause == null ? null : Number(releaseClause));
}

export function toggleUserPlayerForSale(playerId) {
  const player = userClub()?.players.find(p => same(p.id, playerId));
  if (!player) return fail('No se encuentra ese jugador en tu plantilla.');
  player.transferListed = !player.transferListed;
  return { ok: true, message: player.transferListed ? 'Jugador puesto en el mercado.' : 'Jugador retirado del mercado.' };
}

// Venta voluntaria del usuario: la IA también debe convencer al futbolista.
export function getInstantSaleOffer(playerId) {
  const seller = findEntry(GameState.league?.id, GameState.user?.clubId);
  const player = seller?.club.players.find(p => same(p.id, playerId));
  if (!player?.transferListed || seller.club.players.length <= MIN_SQUAD) return null;
  const fee = getSalePrice(player);
  const options = getMarketClubs().filter(e => e.club !== seller.club &&
    e.club.players.length < MAX_SQUAD && int(e.club.cash) >= fee &&
    needFor(e.club, player) >= 0);
  options.sort((a, b) => Math.abs(teamLevel(a.club) - int(player.overall)) -
    Math.abs(teamLevel(b.club) - int(player.overall)));
  for (const buyer of options) {
    const req = getPlayerRequirements(player, seller.club, buyer.club);
    const wage = Math.max(req.minimumWage, roundFee(int(player.wage) * 1.15));
    const years = Math.max(req.minYears, Math.min(3, req.maxYears));
    if (int(buyer.club.wageBudget) < wage) continue;
    if (!evaluatePlayerOffer({
      player, source: seller.club, destination: buyer.club,
      wage, years, role: 'STARTER',
    }).ok) continue;
    return {
      playerId: player.id, clubId: buyer.club.id, leagueId: buyer.leagueId,
      clubName: buyer.club.name, fee, wage, years, role: 'STARTER',
    };
  }
  return null;
}
export function acceptInstantSale(playerId) {
  const seller = findEntry(GameState.league?.id, GameState.user?.clubId);
  const player = seller?.club.players.find(p => same(p.id, playerId));
  if (!player?.transferListed) return fail('El jugador no está en venta.');
  const offer = getInstantSaleOffer(playerId);
  if (!offer) return fail('No hay compradores con presupuesto y acuerdo del jugador.');
  const buyer = findEntry(offer.leagueId, offer.clubId);
  if (!buyer) return fail('El comprador ya no está disponible.');
  return transferPlayer(seller, buyer, player, offer.fee, offer.wage, offer.years, offer.role, 'sell');
}

function countArrivals(entry, season, month = null) {
  return (GameState.transferHistory || []).filter(h => Number(h.season) === season &&
    same(h.toLeagueId || GameState.league?.id, entry.leagueId) &&
    same(h.toClubId, entry.club.id) &&
    (month == null || Number(String(h.gameDate || '').slice(5, 7)) === month)).length;
}
function countDepartures(entry, season) {
  return (GameState.transferHistory || []).filter(h => Number(h.season) === season &&
    same(h.fromLeagueId || GameState.league?.id, entry.leagueId) && same(h.fromClubId, entry.club.id)).length;
}
function playerAlreadyMoved(playerId, season) {
  // Evita cadenas absurdas de 3-5 fichajes del mismo jugador en un mercado.
  return (GameState.transferHistory || []).some(h => same(h.playerId, playerId) && Number(h.season) === season);
}
function needFor(buyer, player) {
  const pos = group(player.position);
  const min = { GK: 2, DEF: 5, MID: 5, ATT: 4 }[pos];
  const own = (buyer.players || []).filter(p => group(p.position) === pos);
  const weakest = own.length ? Math.min(...own.map(p => int(p.overall))) : 0;
  if (own.length < min) return 20 + int(player.overall) - weakest;
  // Sin un puesto necesitado, la IA no ficha por fichar.
  const gain = int(player.overall) - weakest;
  return gain >= 5 ? gain : -1;
}
function affordableAiDeal(seller, buyer, player, season) {
  if (!canSell(seller, player, { autonomous: true, season }).ok) return null;
  const fee = getClubDemand(seller, buyer, player);
  const requirements = getPlayerRequirements(player, seller.club, buyer.club);
  const wage = requirements.minimumWage;
  const years = Math.max(requirements.minYears, Math.min(3, requirements.maxYears));
  const role = requirements.expectedRole;
  if (fee > int(buyer.club.cash) * 0.28 || wage > int(buyer.club.wageBudget) * 0.33) return null;
  if (!evaluatePlayerOffer({
    player, source: seller.club, destination: buyer.club,
    wage, years, role,
  }).ok) return null;
  return { fee, wage, years, role };
}

function simulateAiWeek(week, date) {
  const season = date.getUTCFullYear() - FIRST_SEASON_YEAR + (date.getUTCMonth() >= 7 ? 1 : 0);
  if (season !== Number(GameState.currentDate?.season || 1)) return 0;
  const month = date.getUTCMonth() + 1;
  if (month !== 8 && month !== 1) return 0;
  if (season === 1 && month === 8) return 0; // No alterar las plantillas antes del invierno 2026/27.
  const windowMax = season === 1
    ? (month === 8 ? AI_MARKET_RULES.firstSummerSignings : AI_MARKET_RULES.firstWinterSignings)
    : (month === 8 ? AI_MARKET_RULES.laterSummerSignings : AI_MARKET_RULES.laterWinterSignings);
  const seasonMax = season === 1 ? AI_MARKET_RULES.firstSeasonSignings : AI_MARKET_RULES.laterSeasonSignings;
  const chance = season === 1 ? AI_MARKET_RULES.firstSeasonWeeklyChance : AI_MARKET_RULES.laterSeasonWeeklyChance;
  const clubs = getMarketClubs();
  const user = userClub();
  let movements = 0;

  for (const buyer of clubs) {
    if (buyer.club === user || buyer.club.players.length >= MAX_SQUAD ||
      int(buyer.club.cash) < 200000 || int(buyer.club.wageBudget) < 150000) continue;
    if (countArrivals(buyer, season) >= seasonMax || countArrivals(buyer, season, month) >= windowMax) continue;
    if (hash01(`market:${week}:${buyer.leagueId}:${buyer.club.id}`) >= chance) continue;

    const candidates = [];
    for (const seller of clubs) {
      if (seller.club === user || seller.club === buyer.club || seller.club.players.length <= MIN_SQUAD) continue;
      for (const player of seller.club.players) {
        if (!player?.id || playerAlreadyMoved(player.id, season)) continue;
        const need = needFor(buyer.club, player);
        if (need < 0) continue;
        const terms = affordableAiDeal(seller, buyer, player, season);
        if (!terms) continue;
        const desirability = need + (player.transferListed ? 5 : 0) -
          terms.fee / Math.max(1, int(buyer.club.cash)) * 12 +
          hash01(`${week}:${buyer.club.id}:${player.id}`) * 3;
        candidates.push({ seller, player, ...terms, desirability });
      }
    }
    candidates.sort((a, b) => b.desirability - a.desirability);
    const target = candidates[0];
    if (!target) continue;
    // Contabilizamos una incorporación real, jamás una operación ficticia.
    const deal = transferPlayer(target.seller, buyer, target.player,
      target.fee, target.wage, target.years, target.role, 'ai', false, date.toISOString());
    if (deal.ok) movements++;
  }
  return movements;
}

export function advanceAiTransferMarket(throughISO = GameState.currentTimeISO) {
  const until = Date.parse(throughISO || '');
  if (!Number.isFinite(until)) return 0;
  const state = market();
  const latestWeek = Math.floor(until / WEEK_MS);
  if (!Number.isSafeInteger(state.lastProcessedWeek)) state.lastProcessedWeek = latestWeek - 1;
  // Si se importa una partida antigua, no fabricamos años de fichajes de golpe.
  const firstWeek = Math.max(state.lastProcessedWeek + 1, latestWeek - 60);
  let total = 0;
  for (let week = firstWeek; week <= latestWeek; week++) {
    total += simulateAiWeek(week, new Date(week * WEEK_MS));
  }
  state.lastProcessedWeek = Math.max(state.lastProcessedWeek, latestWeek);
  return total;
}
