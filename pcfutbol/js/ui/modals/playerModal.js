/**
 * Modal jugador (placeholder).
 */

import { GameState } from '../../state.js';
import { getPlayerGameAge, formatGameDateLabel, getCurrentGameDate } from '../utils/calendar.js';
import { createFlagImgElement } from '../utils/flags.js';
import { isPlayerUnavailable, isPlayerInjuredNow, isPlayerSuspendedNow } from '../../game/utils/index.js';
 
function escapeHtml(value) {
  const s = String(value ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return '-';
  try {
    return v.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });
  } catch {
    return String(Math.round(v));
  }
}

function formatAttr(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  return String(Math.round(n));
}

function formatPct01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  const clamped = Math.max(0, Math.min(1, n));
  return String(Math.round(clamped * 100));
}

function ensureModalVisible(modal) {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function ensureModalHidden(modal) {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function getSeasonKey() {
  return String(GameState.currentDate?.season || 1);
}

function getPlayerSeasonStats(player) {
  const season = GameState.currentDate?.season || 1;
  const key = String(season);
  const st = player?.stats?.[key] || null;
  return {
    season,
    apps: st?.apps ?? 0,
    starts: st?.starts ?? 0,
    minutes: st?.minutes ?? 0,
    goals: st?.goals ?? 0,
    assists: st?.assists ?? 0,
    yellows: st?.yellows ?? 0,
    reds: st?.reds ?? 0,
  };
}

/**
 * Estadísticas por jornada (histórico).
 * Estructuras aceptadas (prioridad):
 * - player.statsByMatchday[seasonKey] -> Array
 * - player.matchdayStats[seasonKey]   -> Array
 * - player.matchStats[seasonKey]      -> Array
 * - player.statsMatchdays[seasonKey]  -> Array
 * - player.statsByMatchday            -> Array (sin seasonKey)
 * - player.matchdayStats              -> Array (sin seasonKey)
 */
function getPlayerMatchdayStats(player) {
  const season = GameState.currentDate?.season || 1;
  const key = String(season);

  const candidates = [
    player?.statsByMatchday?.[key],
    player?.matchdayStats?.[key],
    player?.matchStats?.[key],
    player?.statsMatchdays?.[key],
    player?.statsByMatchday,
    player?.matchdayStats,
  ];

  const arr = candidates.find((x) => Array.isArray(x));
  return Array.isArray(arr) ? arr : [];
}

function renderStatsByMatchdayTable(player) {
  const body = document.getElementById('player-modal-stats-body');
  if (!body) return; // si aún no has metido la tabla en el HTML, no hacemos nada

  body.innerHTML = '';
  const rows = getPlayerMatchdayStats(player);

  if (!rows.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="9">Sin estadísticas registradas</td>`;
    body.appendChild(tr);
    return;
  }

  // Ordenar por temporada/jornada si existe
  const sorted = rows
    .slice()
    .sort((a, b) => {
      const sa = Number(a?.season ?? a?.temp ?? 0);
      const sb = Number(b?.season ?? b?.temp ?? 0);
      if (sa !== sb) return sa - sb;
      const ma = Number(a?.matchday ?? a?.jor ?? 0);
      const mb = Number(b?.matchday ?? b?.jor ?? 0);
      return ma - mb;
    });

  sorted.forEach((row) => {
    const season = row?.season ?? row?.temp ?? '-';
    const md = row?.matchday ?? row?.jor ?? '-';
    const opp = row?.opponentName ?? row?.opponent ?? row?.rival ?? '-';
    const cond =
      row?.homeAway ??
      row?.cond ??
      (row?.isHome === true ? 'C' : row?.isHome === false ? 'F' : '-');

    const minutes = Number(row?.minutes ?? row?.min ?? 0) || 0;
    const goals = Number(row?.goals ?? row?.g ?? 0) || 0;
    const assists = Number(row?.assists ?? row?.a ?? 0) || 0;
    const yellows = Number(row?.yellows ?? row?.ta ?? 0) || 0;
    const reds = Number(row?.reds ?? row?.tr ?? 0) || 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(season)}</td>
      <td>${escapeHtml(md)}</td>
      <td>${escapeHtml(opp)}</td>
      <td>${escapeHtml(cond)}</td>
      <td>${escapeHtml(minutes)}</td>
      <td>${escapeHtml(goals)}</td>
      <td>${escapeHtml(assists)}</td>
      <td>${escapeHtml(yellows)}</td>
      <td>${escapeHtml(reds)}</td>
    `;
    body.appendChild(tr);
  });
}

export function initPlayerModal({ onRequestClose } = {}) {
  const modal = document.getElementById('player-modal');
  if (!modal) return;

  const backdrop = document.getElementById('player-modal-backdrop');
  const closeBtn = document.getElementById('player-modal-close');
  const closeFooter = document.getElementById('player-modal-close-footer');

  const requestClose = () => {
    if (typeof onRequestClose === 'function') onRequestClose();
    else ensureModalHidden(modal);
  };

  backdrop?.addEventListener('click', requestClose);
  closeBtn?.addEventListener('click', requestClose);
  closeFooter?.addEventListener('click', requestClose);
}

export function openPlayerModal(player) {
  const modal = document.getElementById('player-modal');
  if (!modal) return;

  // --- Cabecera / datos base ---
  const nameEl = document.getElementById('player-modal-name');
  const posEl = document.getElementById('player-modal-position');
  const ageEl = document.getElementById('player-modal-age');
  const birthdateEl = document.getElementById('player-modal-birthdate');
  const nationalityEl = document.getElementById('player-modal-nationality');
  const birthplaceEl = document.getElementById('player-modal-birthplace');
  const youthclubEl = document.getElementById('player-modal-youthclub');

  const overallEl = document.getElementById('player-modal-overall');
  const moraleEl = document.getElementById('player-modal-morale');
  const fitnessEl = document.getElementById('player-modal-fitness');
  const wageEl = document.getElementById('player-modal-wage');
  const contractEl = document.getElementById('player-modal-contract');
  const valueEl = document.getElementById('player-modal-value');
  const transferEl = document.getElementById('player-modal-transfer');

  const yellowEl = document.getElementById('player-modal-yellowcards');
  const suspEl = document.getElementById('player-modal-suspension');
  const histBody = document.getElementById('player-modal-discipline-body');

  const attrTech = player?.attributes?.technical || {};
  const attrMent = player?.attributes?.mental || {};
  const attrPhys = player?.attributes?.physical || {};

  const passEl = document.getElementById('player-attr-passing');
  const shotEl = document.getElementById('player-attr-shooting');
  const dribEl = document.getElementById('player-attr-dribbling');
  const tackEl = document.getElementById('player-attr-tackling');

  const visEl = document.getElementById('player-attr-vision');
  const compEl = document.getElementById('player-attr-composure');
  const workEl = document.getElementById('player-attr-workrate');
  const leadEl = document.getElementById('player-attr-leadership');

  const paceEl = document.getElementById('player-attr-pace');
  const stamEl = document.getElementById('player-attr-stamina');
  const strEl = document.getElementById('player-attr-strength');

  if (nameEl) nameEl.textContent = player?.name || 'Jugador';

  const pos = player?.position || '-';
  const ageVal = getPlayerGameAge(player);
  const ageText = ageVal != null ? `${ageVal} años` : 'Edad desconocida';

  if (posEl) posEl.textContent = `${pos} • ${ageText}`;
  if (ageEl) ageEl.textContent = ageText;
  if (birthdateEl) birthdateEl.textContent = player?.birthDate || 'Desconocida';

  if (nationalityEl) {
    nationalityEl.textContent = '';
    const flagImg = createFlagImgElement(player?.nationality);
    if (flagImg) nationalityEl.appendChild(flagImg);
    const natSpan = document.createElement('span');
    natSpan.textContent = player?.nationality || 'Desconocida';
    nationalityEl.appendChild(natSpan);
  }

  if (birthplaceEl) birthplaceEl.textContent = player?.birthPlace || 'Desconocido';
  if (youthclubEl) youthclubEl.textContent = player?.youthClub || '—';

  if (overallEl) overallEl.textContent = player?.overall != null ? String(player.overall) : '--';
  if (moraleEl) moraleEl.textContent = player?.morale != null ? `${formatPct01(player.morale)}%` : '-';
  if (fitnessEl) fitnessEl.textContent = player?.fitness != null ? `${formatPct01(player.fitness)}%` : '-';
  if (wageEl) wageEl.textContent = formatCurrency(player?.wage ?? 0);
  if (contractEl) contractEl.textContent = player?.contractYears != null ? `${player.contractYears} año(s)` : '-';

  // Valor: si ya existe, muéstralo; si no, intenta fallback sencillo
  const value = player?.value != null ? player.value : (player?.overall != null ? (player.overall * 100000) : 0);
  if (valueEl) valueEl.textContent = formatCurrency(value);

  if (transferEl) {
    transferEl.textContent = player?.transferListed ? 'En lista de transferibles' : 'No transferible';
  }

  // Atributos
  if (passEl) passEl.textContent = formatAttr(attrTech.passing);
  if (shotEl) shotEl.textContent = formatAttr(attrTech.shooting);
  if (dribEl) dribEl.textContent = formatAttr(attrTech.dribbling);
  if (tackEl) tackEl.textContent = formatAttr(attrTech.tackling);

  if (visEl) visEl.textContent = formatAttr(attrMent.vision);
  if (compEl) compEl.textContent = formatAttr(attrMent.composure);
  if (workEl) workEl.textContent = formatAttr(attrMent.workRate);
  if (leadEl) leadEl.textContent = formatAttr(attrMent.leadership);

  if (paceEl) paceEl.textContent = formatAttr(attrPhys.pace);
  if (stamEl) stamEl.textContent = formatAttr(attrPhys.stamina);
  if (strEl) strEl.textContent = formatAttr(attrPhys.strength);

  // Disciplina: amarillas / sanción + historial
  if (yellowEl) yellowEl.textContent = String(player?.yellowCards ?? 0);

  const injured = isPlayerInjuredNow(player);
  const suspended = isPlayerSuspendedNow(player);
  if (suspEl) {
    if (injured) suspEl.textContent = `Lesionado (${player?.injury?.matchesRemaining ?? '?'} jor.)`;
    else if (suspended) suspEl.textContent = `Sancionado (${player?.suspension?.matchesRemaining ?? '?'} part.)`;
    else suspEl.textContent = 'Disponible';
  }

  if (histBody) {
    histBody.innerHTML = '';
    const history = Array.isArray(player?.disciplineHistory) ? player.disciplineHistory : [];
    if (history.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4">Sin eventos de disciplina registrados</td>`;
      histBody.appendChild(tr);
    } else {
      history
        .slice()
        .reverse()
        .forEach((ev) => {
          if (!ev) return;
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${escapeHtml(ev.season ?? '-')}</td>
            <td>${escapeHtml(ev.matchday ?? '-')}</td>
            <td>${escapeHtml(ev.type ?? '-')}</td>
            <td>${escapeHtml(ev.reason ?? '')}</td>
          `;
          histBody.appendChild(tr);
        });
    }
  }

  // Estadísticas (season -> player.stats[season])
  const st = getPlayerSeasonStats(player);
  const statsSeasonEl = document.getElementById('player-modal-stats-season');
  const statsAppsEl = document.getElementById('player-modal-stats-apps');
  const statsStartsEl = document.getElementById('player-modal-stats-starts');
  const statsMinutesEl = document.getElementById('player-modal-stats-minutes');
  const statsGoalsEl = document.getElementById('player-modal-stats-goals');
  const statsAssistsEl = document.getElementById('player-modal-stats-assists');
  const statsYellowsEl = document.getElementById('player-modal-stats-yellows');
  const statsRedsEl = document.getElementById('player-modal-stats-reds');

  if (statsSeasonEl) statsSeasonEl.textContent = `Temporada ${st.season}`;
  if (statsAppsEl) statsAppsEl.textContent = String(st.apps);
  if (statsStartsEl) statsStartsEl.textContent = String(st.starts);
  if (statsMinutesEl) statsMinutesEl.textContent = String(st.minutes);
  if (statsGoalsEl) statsGoalsEl.textContent = String(st.goals);
  if (statsAssistsEl) statsAssistsEl.textContent = String(st.assists);
  if (statsYellowsEl) statsYellowsEl.textContent = String(st.yellows);
  if (statsRedsEl) statsRedsEl.textContent = String(st.reds);
  
  // Tabla completa por jornada (si existe histórico)
  renderStatsByMatchdayTable(player);  

  // (Opcional) Si tienes un label de fecha actual del juego en el modal
  const dateEl = document.getElementById('player-modal-gamedate');
  if (dateEl) dateEl.textContent = formatGameDateLabel(getCurrentGameDate());

  ensureModalVisible(modal);
}

export function closePlayerModal() {
  const modal = document.getElementById('player-modal');
  if (!modal) return;
  ensureModalHidden(modal);
}