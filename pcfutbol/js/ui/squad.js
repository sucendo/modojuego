/**
 * Plantilla / jugadores (placeholder).
 */

import { GameState } from '../state.js';
import { getUserClub } from '../game/selectors.js';
import { getPlayerGameAge } from './utils/calendar.js';
import { createFlagImgElement } from './utils/flags.js';
import { isPlayerUnavailable, isPlayerInjuredNow, isPlayerSuspendedNow } from '../game/utils/index.js';
import { computePCFParams } from './utils/pcfParams.js';

let filterPos = 'ALL';
let sortKey = 'POSITION';
let sortDirection = 'asc';
let onActionCb = null;

function formatCurrency(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  try {
    return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  } catch {
    return String(Math.round(n));
  }
}

function getPositionGroup(pos) {
  const p = String(pos || '').toUpperCase();
  if (p === 'POR' || p === 'GK') return 0;
  if (p.startsWith('D') || ['RB','LB','CB','RWB','LWB'].includes(p)) return 1;
  if (p.startsWith('M') || ['CDM','CM','CAM','RM','LM'].includes(p)) return 2;
  return 3;
}

function matchesFilter(position) {
  const f = String(filterPos || 'ALL').toUpperCase();
  if (f === 'ALL') return true;
  const p = String(position || '').toUpperCase();
  if (f === 'POR') return p === 'POR' || p === 'GK';
  if (f === 'DEF') return getPositionGroup(p) === 1;
  if (f === 'MED') return getPositionGroup(p) === 2;
  if (f === 'DEL') return getPositionGroup(p) === 3;
  return p === f;
}

function compare(a, b) {
  const k = String(sortKey || 'POSITION').toUpperCase();
  const sign = sortDirection === 'desc' ? -1 : 1;
  if (k === 'NAME') return sign * String(a.name || '').localeCompare(String(b.name || ''), 'es');
  if (k === 'NUMBER') return sign * ((a.shirtNumber ?? 999) - (b.shirtNumber ?? 999));
  if (k === 'AGE') return sign * ((getPlayerGameAge(a) ?? 0) - (getPlayerGameAge(b) ?? 0));
  if (k === 'OVERALL') return sign * ((a.overall ?? 0) - (b.overall ?? 0));
  if (k === 'WAGE') return sign * ((a.wage ?? 0) - (b.wage ?? 0));
  if (k === 'MORALE') return sign * ((a.morale ?? 0) - (b.morale ?? 0));
  if (k === 'FITNESS') return sign * ((a.fitness ?? 0) - (b.fitness ?? 0));
  // POSITION
  const ga = getPositionGroup(a.position);
  const gb = getPositionGroup(b.position);
  if (ga !== gb) return sign * (ga - gb);
  return sign * String(a.position || '').localeCompare(String(b.position || ''), 'es');
}

function defaultDirection(key) {
  return ['OVERALL', 'WAGE', 'MORALE', 'FITNESS'].includes(key) ? 'desc' : 'asc';
}

function matchesSquadExtras(p) {
  const value = id => document.getElementById(id)?.value?.trim() || '';
  const query = value('squad-search').toLocaleLowerCase('es');
  if (query && !`${p.name || ''} ${p.fullName || ''} ${p.nationality || ''}`.toLocaleLowerCase('es').includes(query)) return false;
  const age = getPlayerGameAge(p);
  if (value('squad-age-min') && (age == null || age < Number(value('squad-age-min')))) return false;
  if (value('squad-age-max') && (age == null || age > Number(value('squad-age-max')))) return false;
  if (value('squad-overall-min') && Number(p.overall || 0) < Number(value('squad-overall-min'))) return false;
  return true;
}

function getEstado(player) {
  const injured = isPlayerInjuredNow(player);
  const suspended = isPlayerSuspendedNow(player);
  const transfer = !!player.transferListed;
  if (injured) return { text: 'Lesionado', title: `${player.injury?.type || 'Lesión'} (${player.injury?.matchesRemaining ?? '?'} jor.)` };
  if (suspended) return { text: 'Sancionado', title: `(${player.suspension?.matchesRemaining ?? '?'} partido/s)` };
  if (transfer) return { text: 'Transferible', title: 'En lista de transferibles' };
  return { text: 'OK', title: 'Disponible' };
}

function getFichaBadge(player) {
  const season = GameState.currentDate?.season || 1;
  const key = String(season);
  const hasBio = !!(player.birthDate && player.nationality && player.name && player.shirtNumber != null && !player.shirtNumberEstimated);
  const hasAttrs = !!(player.attributes?.technical && player.attributes?.mental && player.attributes?.physical);
  const hasStats = !!(player.stats && player.stats[key]); // existe aunque sea 0s

  if (hasBio && hasAttrs && hasStats) return { label: 'OK', cls: 'badge-ok', title: 'Bio + Atributos + Stats' };
  if (hasBio || hasAttrs || hasStats) return { label: 'Parcial', cls: 'badge-warn', title: 'Faltan datos en la ficha' };
  return { label: 'Vacía', cls: 'badge-bad', title: 'Sin bio/attrs/stats' };
}

export function initSquadUI() {
  const filterEl = document.getElementById('squad-filter-pos');
  const sortEl = document.getElementById('squad-sort');
  const tbody = document.getElementById('squad-table-body');

  if (filterEl) {
    filterPos = filterEl.value || 'ALL';
    filterEl.addEventListener('change', () => {
      filterPos = filterEl.value || 'ALL';
      updateSquadView();
    });
  }

  if (sortEl) {
    sortKey = sortEl.value || 'POSITION';
    sortDirection = defaultDirection(sortKey);
    sortEl.addEventListener('change', () => {
      sortKey = sortEl.value || 'POSITION';
      sortDirection = defaultDirection(sortKey);
      updateSquadView();
    });
  }

  for (const id of ['squad-search','squad-age-min','squad-age-max','squad-overall-min']) {
    const input = document.getElementById(id);
    input?.addEventListener('input', updateSquadView);
  }
  for (const header of document.querySelectorAll('[data-squad-sort]')) {
    const change = () => {
      const key = header.dataset.squadSort;
      sortDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
      sortKey = key;
      if (sortEl) sortEl.value = key;
      updateSquadView();
    };
    header.addEventListener('click', change);
    header.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); change(); }
    });
  }

  if (tbody) {
    tbody.addEventListener('click', (ev) => {
      const target = ev.target;
      if (!(target instanceof Element)) return;

      // 1) Botón de acción
      const btn = target.closest('button[data-action]');
      if (btn) {
        const tr = btn.closest('tr[data-player-id]');
        const playerId = tr?.dataset?.playerId;
        const action = btn.dataset.action;
        if (!playerId || !action) return;
        onActionCb && onActionCb({ playerId, action });
        return;
      }

      // 2) Click en fila -> abrir ficha
      const tr = target.closest('tr[data-player-id]');
      const playerId = tr?.dataset?.playerId;
      if (!playerId) return;
      onActionCb && onActionCb({ playerId, action: 'details' });
    });
  }
}

export function bindSquadActions(handler) {
  onActionCb = typeof handler === 'function' ? handler : null;
}

export function updateSquadView() {
  const club = getUserClub(GameState);
  const tbody = document.getElementById('squad-table-body');
  const label = document.getElementById('squad-count-label');
  if (!tbody || !label || !club) return;

  const players = Array.isArray(club.players) ? club.players.slice() : [];
  const list = players.filter((p) => matchesFilter(p.position) && matchesSquadExtras(p)).sort(compare);

  document.querySelectorAll('[data-squad-sort]').forEach(th => {
    const active = th.dataset.squadSort === sortKey;
    th.setAttribute('aria-sort', active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
    th.dataset.sortDirection = active ? sortDirection : '';
  });

  label.textContent = `${list.length} jugador${list.length === 1 ? '' : 'es'} en plantilla`;
  tbody.innerHTML = '';

  if (list.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 18;
    td.textContent = 'Este club aún no tiene jugadores registrados.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  list.forEach((p) => {
    const tr = document.createElement('tr');
    tr.dataset.playerId = p.id;

    const pcf = computePCFParams(p);
    const edad = getPlayerGameAge(p);
    const dorsal = p.shirtNumber ?? p.number ?? '-';
    const estado = getEstado(p);
    const ficha = getFichaBadge(p);

    const injured = isPlayerInjuredNow(p);
    const suspended = isPlayerSuspendedNow(p);
    if (injured || suspended) tr.classList.add('row-disabled');

    const tdText = (txt) => {
      const td = document.createElement('td');
      td.textContent = txt;
      return td;
    };
    const tdNum = (txt) => {
      const td = document.createElement('td');
      td.className = 'num';
      td.textContent = txt;
      return td;
    };

    // #
    const dorsalCell = tdText(`${dorsal}${p.shirtNumberEstimated ? '*' : ''}`);
    if (p.shirtNumberEstimated) dorsalCell.title = 'Dorsal provisional, pendiente de verificación';
    tr.appendChild(dorsalCell);

    // Jugador + bandera (estilo tácticas)
    const tdName = document.createElement('td');
    tdName.classList.add('squad-player-name-cell');
    const flag = createFlagImgElement(p.nationality);
    if (flag) tdName.appendChild(flag);
    const nameSpan = document.createElement('span');
    nameSpan.textContent = p.name || 'Jugador';
    if (!p.nationality) nameSpan.title = 'Nacionalidad pendiente de verificar';
    tdName.appendChild(nameSpan);
    tr.appendChild(tdName);

    const ageCell = tdNum(edad != null ? `${p.ageEstimated ? '~' : ''}${edad}` : '-');
    if (p.ageEstimated) ageCell.title = 'Edad estimada, fecha de nacimiento no verificada';
    tr.appendChild(ageCell);
    tr.appendChild(tdNum(String(pcf.EN)));
    tr.appendChild(tdNum(String(pcf.CF)));
    tr.appendChild(tdNum(String(pcf.CM)));
    tr.appendChild(tdNum(String(pcf.CD)));
    tr.appendChild(tdNum(String(pcf.CO)));
    tr.appendChild(tdNum(pcf.MO != null ? String(pcf.MO) : '-'));
    tr.appendChild(tdNum(pcf.EF != null ? String(pcf.EF) : '-'));
    tr.appendChild(tdNum(String(pcf.ME)));
    tr.appendChild(tdText(pcf.ROL));
    tr.appendChild(tdText(pcf.DEM));

    const tdEstado = tdText(estado.text);
    tdEstado.title = estado.title || '';
    tr.appendChild(tdEstado);

    tr.appendChild(tdNum(formatCurrency(p.wage ?? 0)));
    tr.appendChild(tdNum(p.contractYears != null ? `${p.contractYears}a` : '-'));

    const tdActions = document.createElement('td');
    const transferLabel = p.transferListed ? 'Quitar mercado' : 'Transferible';
    tdActions.innerHTML = `
      <div class="row-actions">
        <button class="btn btn-xs btn-secondary" data-action="details">Ficha</button>
        <button class="btn btn-xs btn-secondary" data-action="renew">Renovar</button>
        <button class="btn btn-xs btn-secondary" data-action="transfer">${transferLabel}</button>
      </div>
    `;
    tr.appendChild(tdActions);

    const tdFicha = document.createElement('td');
    tdFicha.innerHTML = `<span class="badge ${ficha.cls}" title="${ficha.title}">${ficha.label}</span>`;
    tr.appendChild(tdFicha);

    tbody.appendChild(tr);
  });
}
