/**
 * Plantilla / jugadores (placeholder).
 */

import { GameState } from '../state.js';
import { getPlayerGameAge } from './utils/calendar.js';
import { createFlagImgElement } from './utils/flags.js';
import { isPlayerUnavailable, isPlayerInjuredNow, isPlayerSuspendedNow } from '../game/utils/index.js';
import { computePCFParams } from './utils/pcfParams.js';

let filterPos = 'ALL';
let sortKey = 'POSITION';
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

function getUserClub() {
  const clubId = GameState.user?.clubId;
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  return clubs.find((c) => c.id === clubId) || (clubs[0] || null);
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
  if (k === 'NAME') return String(a.name || '').localeCompare(String(b.name || ''));
  if (k === 'AGE') return (getPlayerGameAge(a) ?? 0) - (getPlayerGameAge(b) ?? 0);
  if (k === 'OVERALL') return (b.overall ?? 0) - (a.overall ?? 0);
  if (k === 'WAGE') return (b.wage ?? 0) - (a.wage ?? 0);
  if (k === 'MORALE') return (b.morale ?? 0) - (a.morale ?? 0);
  if (k === 'FITNESS') return (b.fitness ?? 0) - (a.fitness ?? 0);
  // POSITION
  const ga = getPositionGroup(a.position);
  const gb = getPositionGroup(b.position);
  if (ga !== gb) return ga - gb;
  return String(a.position || '').localeCompare(String(b.position || ''));
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
  const hasBio = !!(player.birthDate && player.nationality);
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
    sortEl.addEventListener('change', () => {
      sortKey = sortEl.value || 'POSITION';
      updateSquadView();
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
  const club = getUserClub();
  const tbody = document.getElementById('squad-table-body');
  const label = document.getElementById('squad-count-label');
  if (!tbody || !label || !club) return;

  const players = Array.isArray(club.players) ? club.players.slice() : [];
  const list = players.filter((p) => matchesFilter(p.position)).sort(compare);

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
    tr.appendChild(tdText(String(dorsal)));

    // Jugador + bandera (estilo tácticas)
    const tdName = document.createElement('td');
    tdName.classList.add('squad-player-name-cell');
    const flag = createFlagImgElement(p.nationality);
    if (flag) tdName.appendChild(flag);
    const nameSpan = document.createElement('span');
    nameSpan.textContent = p.name || 'Jugador';
    tdName.appendChild(nameSpan);
    tr.appendChild(tdName);

    tr.appendChild(tdNum(edad != null ? String(edad) : '-'));
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
