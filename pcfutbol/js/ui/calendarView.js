// js/ui/calendarView.js
// Vista 1/3 de Competición: CALENDARIO

import {
  getGameDateFor,
  getFixtureKickoffDate,
  formatGameDateLabel,
  formatFixtureKickoffLabel
} from './utils/calendar.js';
import { createCoatImgElement } from './utils/coats.js';
import {
  getCompetitions,
  getDefaultCompetitionId,
  getCompetitionById,
  computeMaxMatchday,
  buildClubIndex,
  getUserClubId,
} from './utils/competitions.js';

let __bound = false;
let __selectedCompetitionId = null;
let __mode = 'MATCHDAY'; // MATCHDAY | CLUB
let __selectedMatchday = 1;
let __selectedClubId = null;
let __onOpenMatchDetail = null;

function escapeHtml(v) {
  const s = String(v ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setSelectValueSafe(selectEl, value) {
  if (!selectEl) return;
  const v = String(value);
  const opt = Array.from(selectEl.options || []).find((o) => o.value === v);
  if (opt) selectEl.value = v;
}

function getFixtureKickoffTime(fx, idxInList = 0) {
  const t = fx?.kickoffTime;
  if (typeof t === 'string' && t.includes(':')) return t;
  const slots = ['16:00', '18:15', '20:30', '22:00'];
  return slots[Math.max(0, idxInList) % slots.length];
}

function renderCompetitionSelect(sel) {
  const comps = getCompetitions();
  if (!sel) return;
  const current = __selectedCompetitionId || getDefaultCompetitionId();
  if (sel.options.length === 0) {
    sel.innerHTML = '';
    comps.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name || c.id;
      sel.appendChild(opt);
    });
  }
  setSelectValueSafe(sel, current);
}

function renderMatchdaySelect(sel, comp) {
  if (!sel || !comp) return;
  const maxMd = computeMaxMatchday(comp.fixtures, comp?.competition?.matchdays || 38);
  if (sel.options.length !== maxMd) {
    sel.innerHTML = '';
    for (let i = 1; i <= maxMd; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Jornada ${i}`;
      sel.appendChild(opt);
    }
  }
  setSelectValueSafe(sel, __selectedMatchday);
}

function renderClubSelect(sel, clubs) {
  if (!sel) return;
  const list = Array.isArray(clubs) ? clubs : [];
  if (sel.options.length !== list.length) {
    sel.innerHTML = '';
    list.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name || c.shortName || c.id;
      sel.appendChild(opt);
    });
  }
  if (!__selectedClubId) __selectedClubId = getUserClubId();
  setSelectValueSafe(sel, __selectedClubId);
}

function setMode(newMode) {
  __mode = newMode === 'CLUB' ? 'CLUB' : 'MATCHDAY';
  updateCalendarView();
}

function ensureBindings() {
  if (__bound) return;

  const compSel = document.getElementById('calendar-competition-select');
  const mdSel = document.getElementById('calendar-matchday-select');
  const clubSel = document.getElementById('calendar-club-select');
  const btnModeMd = document.getElementById('calendar-mode-matchday');
  const btnModeClub = document.getElementById('calendar-mode-club');
  const tbody = document.getElementById('calendar-fixtures-body');

  if (!compSel || !mdSel || !clubSel || !btnModeMd || !btnModeClub || !tbody) return;

  compSel.addEventListener('change', () => {
    __selectedCompetitionId = String(compSel.value || getDefaultCompetitionId());
    const comp = getCompetitionById(__selectedCompetitionId);
    // Al cambiar de competición, ajustar jornada al matchday actual de esa competición.
    __selectedMatchday = Number(comp?.currentDate?.matchday || 1);
    __selectedClubId = getUserClubId();
    updateCalendarView();
  });

  mdSel.addEventListener('change', () => {
    const md = Number.parseInt(mdSel.value, 10);
    if (Number.isFinite(md) && md >= 1) {
      __selectedMatchday = md;
      updateCalendarView();
    }
  });

  clubSel.addEventListener('change', () => {
    __selectedClubId = String(clubSel.value || getUserClubId());
    updateCalendarView();
  });

  btnModeMd.addEventListener('click', () => setMode('MATCHDAY'));
  btnModeClub.addEventListener('click', () => setMode('CLUB'));

  // Click en fila o botón detalle
  tbody.addEventListener('click', (ev) => {
    const target = ev.target instanceof Element ? ev.target : null;
    if (!target) return;
    const btn = target.closest('button[data-fixture-id]');
    const tr = target.closest('tr[data-fixture-id]');
    const rawId = btn?.getAttribute('data-fixture-id') || tr?.getAttribute('data-fixture-id');
    const rawComp = btn?.getAttribute('data-competition-id') || tr?.getAttribute('data-competition-id');
    if (!rawId || !rawComp) return;
    if (typeof __onOpenMatchDetail === 'function') {
      __onOpenMatchDetail({ competitionId: rawComp, fixtureId: rawId });
    }
  });

  __bound = true;
}

export function initCalendarUI({ onOpenMatchDetail } = {}) {
  __onOpenMatchDetail = typeof onOpenMatchDetail === 'function' ? onOpenMatchDetail : null;
  if (!__selectedCompetitionId) __selectedCompetitionId = getDefaultCompetitionId();
  const comp = getCompetitionById(__selectedCompetitionId);
  __selectedMatchday = Number(comp?.currentDate?.matchday || 1);
  if (!__selectedClubId) __selectedClubId = getUserClubId();
}

export function updateCalendarView() {
  ensureBindings();

  const compSel = document.getElementById('calendar-competition-select');
  const mdSel = document.getElementById('calendar-matchday-select');
  const clubSel = document.getElementById('calendar-club-select');
  const btnModeMd = document.getElementById('calendar-mode-matchday');
  const btnModeClub = document.getElementById('calendar-mode-club');
  const dateEl = document.getElementById('calendar-date-label');
  const tbody = document.getElementById('calendar-fixtures-body');

  if (!compSel || !mdSel || !clubSel || !btnModeMd || !btnModeClub || !tbody) return;

  const comps = getCompetitions();
  if (!__selectedCompetitionId) __selectedCompetitionId = getDefaultCompetitionId();
  const comp = getCompetitionById(__selectedCompetitionId) || comps[0] || null;
  if (!comp) return;

  renderCompetitionSelect(compSel);

  // Botones modo
  btnModeMd.classList.toggle('is-active', __mode === 'MATCHDAY');
  btnModeClub.classList.toggle('is-active', __mode === 'CLUB');

  // Fecha (solo informativa, depende de la jornada seleccionada)
  const season = Number(comp.currentDate?.season || 1);
  const md = Number(__selectedMatchday || comp.currentDate?.matchday || 1);
  const mdFixturesForLabel = (comp.fixtures || []).filter((fx) => fx && Number(fx.matchday) === md);
  // Queremos FECHA + HORA si el fixture la trae (kickoffDate/kickoffTime)
  const headerLabel = mdFixturesForLabel.length
    ? (formatFixtureKickoffLabel(mdFixturesForLabel[0], season, md) || '')
    : (formatGameDateLabel(getGameDateFor(season, md)) || '');
  if (dateEl) dateEl.textContent = `Jornada ${md}${headerLabel ? ' • ' + headerLabel : ''}`;

  // Controles según modo
  mdSel.closest('.pcf-filter')?.classList.toggle('hidden', __mode !== 'MATCHDAY');
  clubSel.closest('.pcf-filter')?.classList.toggle('hidden', __mode !== 'CLUB');

  renderMatchdaySelect(mdSel, comp);
  renderClubSelect(clubSel, comp.clubs);

  const clubsIndex = buildClubIndex(comp.clubs);

  // Render tabla
  tbody.innerHTML = '';

  let list = [];
  if (__mode === 'MATCHDAY') {
    list = (comp.fixtures || []).filter((fx) => fx && Number(fx.matchday) === md);
    list = list.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  } else {
    const cid = String(__selectedClubId || getUserClubId());
    list = (comp.fixtures || [])
      .filter((fx) => fx && (String(fx.homeClubId) === cid || String(fx.awayClubId) === cid))
      .slice()
      .sort((a, b) => Number(a.matchday || 0) - Number(b.matchday || 0));
  }

  if (!list.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="6">No hay partidos para este filtro.</td>`;
    tbody.appendChild(tr);
    return;
  }

  list.forEach((fx, idx) => {
    const home = clubsIndex.get(fx.homeClubId);
    const away = clubsIndex.get(fx.awayClubId);
    const homeName = (home && (home.shortName || home.name)) || fx.homeClubId || 'Local';
    const awayName = (away && (away.shortName || away.name)) || fx.awayClubId || 'Visitante';

    const score =
      fx.played && fx.homeGoals != null && fx.awayGoals != null
        ? `${fx.homeGoals} - ${fx.awayGoals}`
        : 'vs';

    const mdLabel = `J${Number(fx.matchday || md)}`;
    const fxDate = getFixtureKickoffDate(fx, season, Number(fx.matchday || md));
    const dateLabel = formatGameDateLabel(fxDate) || '';
    // En la tabla queremos "dd/mm/aaaa • hh:mm" si existe hora real
    const dateTimeLabel = formatFixtureKickoffLabel(fx, season, Number(fx.matchday || md)) || dateLabel;

    const tr = document.createElement('tr');
    tr.className = 'is-clickable';
    tr.setAttribute('data-fixture-id', String(fx.id));
    tr.setAttribute('data-competition-id', String(comp.id));

    const coatH = createCoatImgElement(fx.homeClubId, homeName, 18);
    const coatA = createCoatImgElement(fx.awayClubId, awayName, 18);

    tr.innerHTML = `
      <td class="th-num">${escapeHtml(mdLabel)}</td>
      <td>${escapeHtml(dateTimeLabel)}</td>
      <td class="pcf-team-cell">${coatH.outerHTML}<span>${escapeHtml(homeName)}</span></td>
      <td class="pcf-score-cell">${escapeHtml(score)}</td>
      <td class="pcf-team-cell">${coatA.outerHTML}<span>${escapeHtml(awayName)}</span></td>
      <td class="pcf-actions-cell">
        <button class="btn btn-small" type="button" data-competition-id="${escapeHtml(comp.id)}" data-fixture-id="${escapeHtml(fx.id)}">Detalle</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}