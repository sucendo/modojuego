// Vista del mercado de fichajes: DOM y acciones, sin lógica económica duplicada.
import { GameState } from '../state.js';
import {
  searchTransferMarket,
  makeTransferOffer,
  toggleUserPlayerForSale,
  getInstantSaleOffer,
  acceptInstantSale,
} from '../game/transferMarket.js';

const el = (id) => document.getElementById(id);
const eur = (value) => Number(value || 0).toLocaleString('es-ES', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});
let selected = null;
let onChanged = null;
let bound = false;

function td(row, text) {
  const cell = document.createElement('td');
  cell.textContent = String(text ?? '');
  row.appendChild(cell);
  return cell;
}
function button(label, fn, className = 'btn btn-secondary') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.textContent = label;
  b.addEventListener('click', fn);
  return b;
}
function notice(message, ok = true) {
  const node = el('market-message');
  if (!node) return;
  node.textContent = message || '';
  node.classList.toggle('market-error', !ok);
  node.setAttribute('role', 'status');
}

function getUserClub() {
  return (GameState.clubs || []).find(c => String(c.id) === String(GameState.user?.clubId)) || null;
}

function renderBudgets() {
  const club = getUserClub();
  if (el('market-budgets')) el('market-budgets').textContent = club
    ? `${club.name} · Caja: ${eur(club.cash)} · Presupuesto salarial disponible: ${eur(club.wageBudget)}`
    : 'No hay club seleccionado.';
}

function renderFilters() {
  const league = el('market-league');
  if (!league) return;
  const current = league.value || 'ALL';
  league.replaceChildren();
  const all = document.createElement('option');
  all.value = 'ALL';
  all.textContent = 'Todas las ligas';
  league.appendChild(all);
  const leagues = [GameState.league, ...(GameState.world?.leagues || [])];
  for (const lg of leagues) {
    if (!lg?.id) continue;
    const opt = document.createElement('option');
    opt.value = lg.id;
    opt.textContent = lg.name || lg.id;
    league.appendChild(opt);
  }
  league.value = [...league.options].some(o => o.value === current) ? current : 'ALL';
}

function renderSearchResults() {
  const tbody = el('market-results-body');
  if (!tbody) return;
  tbody.replaceChildren();
  const matches = searchTransferMarket({
    query: el('market-search')?.value || '',
    position: el('market-position')?.value || 'ALL',
    leagueId: el('market-league')?.value || 'ALL',
    limit: 80,
  });
  if (!matches.length) {
    const row = document.createElement('tr');
    const cell = td(row, 'No se han encontrado jugadores para estos filtros.');
    cell.colSpan = 7;
    tbody.appendChild(row);
  }
  for (const item of matches) {
    const row = document.createElement('tr');
    td(row, item.name);
    td(row, item.clubName);
    td(row, item.position);
    td(row, item.overall);
    td(row, item.age || '—');
    td(row, eur(item.price));
    const action = document.createElement('td');
    action.appendChild(button('Negociar', () => selectTarget(item), 'btn btn-primary'));
    row.appendChild(action);
    tbody.appendChild(row);
  }
  if (el('market-result-count')) el('market-result-count').textContent =
    `${matches.length} jugadores mostrados (máximo 80 por búsqueda)`;
}

function selectTarget(item) {
  selected = { playerId: item.playerId, leagueId: item.leagueId, clubId: item.clubId };
  if (el('market-selected')) el('market-selected').textContent =
    `${item.name} · ${item.clubName} · ${item.position} · Media ${item.overall} · Precio solicitado: ${eur(item.price)} · Sueldo anual: ${eur(item.wage)}`;
  if (el('market-bid')) el('market-bid').value = String(item.price);
  const submit = el('market-buy');
  if (submit) submit.disabled = false;
  notice('');
}

function renderSales() {
  const club = getUserClub();
  const select = el('market-sale-player');
  if (!club || !select) return;
  const previous = select.value;
  select.replaceChildren();
  for (const p of club.players || []) {
    const opt = document.createElement('option');
    opt.value = String(p.id);
    opt.textContent = `${p.name} · ${p.position || '-'} · ${p.transferListed ? 'En venta' : 'No listado'}`;
    select.appendChild(opt);
  }
  if ([...select.options].some(o => o.value === previous)) select.value = previous;
  renderSaleOffer();
}

function renderSaleOffer() {
  const id = el('market-sale-player')?.value;
  const club = getUserClub();
  const player = club?.players?.find(p => String(p.id) === String(id));
  const offer = player ? getInstantSaleOffer(id) : null;
  if (el('market-sale-info')) {
    el('market-sale-info').textContent = !player ? 'No tienes jugadores disponibles.'
      : !player.transferListed ? 'Primero pon al jugador en el mercado.'
      : offer ? `Oferta simulada: ${offer.clubName} pagaría ${eur(offer.fee)}.`
      : 'No hay clubes que puedan fichar a este jugador ahora.';
  }
  if (el('market-toggle-sale')) {
    el('market-toggle-sale').disabled = !player;
    el('market-toggle-sale').textContent = player?.transferListed ? 'Quitar del mercado' : 'Poner en el mercado';
  }
  if (el('market-accept-sale')) el('market-accept-sale').disabled = !offer;
}

function renderHistory() {
  const tbody = el('market-history-body');
  if (!tbody) return;
  tbody.replaceChildren();
  const history = Array.isArray(GameState.transferHistory) ? GameState.transferHistory.slice(0, 20) : [];
  if (!history.length) {
    const r = document.createElement('tr');
    td(r, 'Aún no hay operaciones.');
    r.firstElementChild.colSpan = 4;
    tbody.appendChild(r);
  }
  for (const deal of history) {
    const r = document.createElement('tr');
    td(r, deal.playerName);
    td(r, `${deal.fromClubName} → ${deal.toClubName}`);
    td(r, eur(deal.fee));
    td(r, `T${deal.season} · J${deal.matchday}`);
    tbody.appendChild(r);
  }
}

export function updateTransferMarketView() {
  if (!el('view-transfermarket')) return;
  renderFilters();
  renderBudgets();
  renderSearchResults();
  renderSales();
  renderHistory();
  if (selected) {
    const exists = [GameState.league, ...(GameState.world?.leagues || [])]
      .filter(lg => lg?.id === selected.leagueId)
      .flatMap(lg => lg.id === GameState.league?.id ? GameState.clubs || [] : lg.clubs || [])
      .some(club => String(club.id) === String(selected.clubId) &&
        (club.players || []).some(p => String(p.id) === String(selected.playerId)));
    if (!exists) {
      selected = null;
      if (el('market-selected')) el('market-selected').textContent = 'Selecciona un jugador de la lista.';
      if (el('market-buy')) el('market-buy').disabled = true;
    }
  }
}

function afterMutation(result) {
  notice(result.message, result.ok);
  if (result.ok) {
    selected = null;
    if (el('market-selected')) el('market-selected').textContent = 'Selecciona un jugador de la lista.';
    if (el('market-buy')) el('market-buy').disabled = true;
    try { onChanged?.(); } catch (error) { console.warn('Mercado: refresco UI', error); }
    updateTransferMarketView();
  }
}

export function initTransferMarketUI({ onTransfer } = {}) {
  onChanged = onTransfer || null;
  if (bound || !el('view-transfermarket')) return;
  bound = true;
  for (const id of ['market-search', 'market-position', 'market-league']) {
    el(id)?.addEventListener(id === 'market-search' ? 'input' : 'change', renderSearchResults);
  }
  el('market-buy')?.addEventListener('click', () => {
    if (!selected) return notice('Selecciona un futbolista.', false);
    const fee = Number(el('market-bid')?.value);
    const result = makeTransferOffer({ ...selected, fee });
    afterMutation(result);
  });
  el('market-sale-player')?.addEventListener('change', renderSaleOffer);
  el('market-toggle-sale')?.addEventListener('click', () => {
    const id = el('market-sale-player')?.value;
    if (!id) return;
    afterMutation(toggleUserPlayerForSale(id));
  });
  el('market-accept-sale')?.addEventListener('click', () => {
    const id = el('market-sale-player')?.value;
    const offer = getInstantSaleOffer(id);
    if (!offer) return notice('No existe una oferta vigente.', false);
    afterMutation(acceptInstantSale(id));
  });
  updateTransferMarketView();
}
