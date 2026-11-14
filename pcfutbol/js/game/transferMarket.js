// Mercado de fichajes: lógica sin dependencias del DOM.
// Primera fase: compras y ventas directas entre clubes de las ligas simuladas.
import { GameState } from '../state.js';

const MIN_SQUAD = 16;
const MAX_SQUAD = 30;

const amount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const roundFee = (value) => Math.max(10000, Math.round(value / 10000) * 10000);

export function getMarketClubs() {
  const result = [];
  const append = (league, clubs) => {
    for (const club of clubs || []) {
      if (!club?.id || !Array.isArray(club.players)) continue;
      result.push({ club, leagueId: league?.id || '', leagueName: league?.name || '' });
    }
  };
  append(GameState.league, GameState.clubs);
  for (const league of GameState.world?.leagues || []) append(league, league.clubs);
  return result;
}

export function getTransferPrice(player) {
  const base = Math.max(100000, amount(player?.value));
  return roundFee(base * (player?.transferListed ? 0.95 : 1.15));
}

export function getSalePrice(player) {
  return roundFee(Math.max(100000, amount(player?.value)) * 0.80);
}

function userClub() {
  return GameState.clubs?.find((c) => String(c.id) === String(GameState.user?.clubId)) || null;
}

function fail(message) {
  return { ok: false, message };
}

function transferPlayer(source, destination, player, fee, kind) {
  const sourceIndex = source.players.findIndex((p) => String(p.id) === String(player.id));
  if (sourceIndex < 0) return fail('El futbolista ya no pertenece a ese club.');
  if (source.players.length <= MIN_SQUAD) return fail('El club vendedor necesita mantener al menos 16 jugadores.');
  if (destination.players.length >= MAX_SQUAD) return fail('La plantilla de destino tiene el máximo de 30 jugadores.');
  if (destination.players.some((p) => String(p.id) === String(player.id))) return fail('El jugador ya está en el club de destino.');

  const cost = amount(fee);
  const wage = amount(player.wage);
  if (!Number.isFinite(Number(fee)) || cost <= 0) return fail('El precio de la operación no es válido.');
  if (amount(destination.cash) < cost) return fail('El club comprador no tiene suficiente dinero.');
  if (amount(destination.wageBudget) < wage) return fail('El club comprador no dispone de presupuesto salarial suficiente.');

  // Comprobar todos los límites antes de mutar el estado, para que la operación sea atómica.
  source.players.splice(sourceIndex, 1);
  source.lineup = (source.lineup || []).filter((id) => String(id) !== String(player.id));
  source.bench = (source.bench || []).filter((id) => String(id) !== String(player.id));
  player.transferListed = false;
  destination.players.push(player);
  destination.cash = amount(destination.cash) - cost;
  source.cash = amount(source.cash) + cost;
  destination.wageBudget = amount(destination.wageBudget) - wage;
  source.wageBudget = amount(source.wageBudget) + wage;

  const history = {
    id: `transfer_${Date.now()}_${GameState.transferHistory?.length || 0}`,
    type: kind,
    playerId: player.id,
    playerName: player.name || 'Jugador',
    fromClubId: source.id,
    fromClubName: source.name || source.id,
    toClubId: destination.id,
    toClubName: destination.name || destination.id,
    fee: cost,
    wage,
    season: GameState.currentDate?.season || 1,
    matchday: GameState.currentDate?.matchday || 1,
    gameDate: GameState.currentTimeISO || null,
  };
  if (!Array.isArray(GameState.transferHistory)) GameState.transferHistory = [];
  GameState.transferHistory.unshift(history);
  return { ok: true, message: `${history.playerName} ficha por ${history.toClubName}.`, transfer: history };
}

export function searchTransferMarket({ query = '', position = 'ALL', leagueId = 'ALL', limit = 70 } = {}) {
  const q = String(query).trim().toLocaleLowerCase('es');
  const pos = String(position).toUpperCase();
  const results = [];

  for (const item of getMarketClubs()) {
    if (String(item.club.id) === String(GameState.user?.clubId) && item.leagueId === GameState.league?.id) continue;
    if (leagueId !== 'ALL' && item.leagueId !== leagueId) continue;
    for (const player of item.club.players) {
      if (!player?.id) continue;
      if (pos !== 'ALL') {
        const p = String(player.position || '').toUpperCase();
        const group = p === 'GK' || p === 'POR' ? 'GK' :
          ['CB', 'RB', 'LB', 'RWB', 'LWB', 'DFC', 'LD', 'LI'].includes(p) ? 'DEF' :
          ['ST', 'CF', 'FW', 'DC', 'RW', 'LW', 'ED', 'EI'].includes(p) ? 'ATT' : 'MID';
        if (group !== pos) continue;
      }
      if (q && !`${player.name || ''} ${item.club.name || ''}`.toLocaleLowerCase('es').includes(q)) continue;
      results.push({
        playerId: player.id,
        clubId: item.club.id,
        clubName: item.club.name,
        leagueId: item.leagueId,
        leagueName: item.leagueName,
        name: player.name || 'Jugador',
        age: player.age || null,
        position: player.position || '-',
        overall: amount(player.overall),
        wage: amount(player.wage),
        price: getTransferPrice(player),
        listed: !!player.transferListed,
      });
    }
  }
  results.sort((a, b) => Number(b.listed) - Number(a.listed) || b.overall - a.overall || a.price - b.price);
  return results.slice(0, Math.max(1, Math.min(200, Number(limit) || 70)));
}

export function makeTransferOffer({ leagueId, clubId, playerId, fee }) {
  const destination = userClub();
  if (!destination) return fail('Selecciona primero un club para dirigir.');
  const sourceEntry = getMarketClubs().find((entry) =>
    entry.leagueId === leagueId && String(entry.club.id) === String(clubId)
  );
  const source = sourceEntry?.club;
  if (!source || source === destination) return fail('Club vendedor no válido.');
  const player = source.players.find((p) => String(p.id) === String(playerId));
  if (!player) return fail('El jugador ya no está disponible.');
  const price = getTransferPrice(player);
  const bid = Number(fee);
  if (!Number.isSafeInteger(bid) || bid <= 0) return fail('Introduce una oferta válida en euros enteros.');
  if (bid < price) return fail(`El club vendedor rechaza la oferta. Solicita al menos ${price.toLocaleString('es-ES')} €.`);
  return transferPlayer(source, destination, player, bid, 'buy');
}

export function toggleUserPlayerForSale(playerId) {
  const club = userClub();
  const player = club?.players?.find((p) => String(p.id) === String(playerId));
  if (!player) return fail('No se encuentra ese jugador en tu plantilla.');
  player.transferListed = !player.transferListed;
  return { ok: true, message: player.transferListed ? 'Jugador puesto en el mercado.' : 'Jugador retirado del mercado.' };
}

// Primera fase: oferta inmediata determinista de un club con fondos.
// Se vuelve a calcular al aceptar para no usar referencias o presupuestos desactualizados.
export function getInstantSaleOffer(playerId) {
  const seller = userClub();
  const player = seller?.players?.find((p) => String(p.id) === String(playerId));
  if (!player?.transferListed) return null;
  if (seller.players.length <= MIN_SQUAD) return null;
  const fee = getSalePrice(player);
  const options = getMarketClubs()
    .filter((item) =>
      item.club !== seller &&
      item.club.players.length < MAX_SQUAD &&
      !item.club.players.some((p) => String(p.id) === String(player.id)) &&
      amount(item.club.cash) >= fee &&
      amount(item.club.wageBudget) >= amount(player.wage)
    )
    .sort((a, b) => {
      const avg = (club) => club.players.reduce((sum, p) => sum + amount(p.overall), 0) / Math.max(1, club.players.length);
      return Math.abs(avg(a.club) - amount(player.overall)) - Math.abs(avg(b.club) - amount(player.overall));
    });
  const target = options[0];
  return target ? { playerId: player.id, clubId: target.club.id, leagueId: target.leagueId, clubName: target.club.name, fee } : null;
}

export function acceptInstantSale(playerId) {
  const seller = userClub();
  const player = seller?.players?.find((p) => String(p.id) === String(playerId));
  if (!player || !player.transferListed) return fail('El jugador no está en venta.');
  const offer = getInstantSaleOffer(playerId);
  if (!offer) return fail('No hay ningún club que pueda presentar una oferta en este momento.');
  const buyer = getMarketClubs().find((item) => item.leagueId === offer.leagueId && String(item.club.id) === String(offer.clubId))?.club;
  if (!buyer) return fail('Club comprador no disponible.');
  return transferPlayer(seller, buyer, player, offer.fee, 'sell');
}
