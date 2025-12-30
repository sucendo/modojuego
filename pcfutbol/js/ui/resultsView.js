// js/ui/resultsView.js
// Vista 2/3 de Competición: RESULTADOS (solo jugados)

import { formatFixtureKickoffLabel } from './utils/calendar.js';
import { createCoatImgElement } from './utils/coats.js';
import {
  getCompetitions,
  getDefaultCompetitionId,
  getCompetitionById,
  buildClubIndex,
  getUserClubId,
} from './utils/competitions.js';

let __bound = false;
let __selectedCompetitionId = null;
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

function getCurrentCompetitionId() {
  const comps = getCompetitions();
  if (!Array.isArray(comps) || comps.length === 0) return null;
  const current = comps.find((c) => c && (c.isCurrent === true));
  return (current && current.id) ? String(current.id) : String(comps[0].id);
}

function setSelectValueSafe(selectEl, value) {
  if (!selectEl) return;
  const v = String(value ?? '');
  const opt = Array.from(selectEl.options || []).find((o) => o.value === v);
  if (opt) selectEl.value = v;
}

function selectOptionsMatchList(sel, list) {
  const opts = Array.from(sel?.options || []);
  if (opts.length !== list.length) return false;
  for (let i = 0; i < list.length; i++) {
    if (String(opts[i]?.value) !== String(list[i]?.id)) return false;
  }
  return true;
}

function renderCompetitionSelect(sel) {
  const comps = getCompetitions();
  if (!sel) return;
  if (sel.options.length === 0) {
    sel.innerHTML = '';
    comps.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name || c.id;
      sel.appendChild(opt);
    });
  }
  const def = String(getCurrentCompetitionId() || getDefaultCompetitionId() || '');
  if (!__selectedCompetitionId) __selectedCompetitionId = def;
  setSelectValueSafe(sel, __selectedCompetitionId || def);
}

function renderClubSelect(sel, clubs) {
  if (!sel) return;
  const list = Array.isArray(clubs) ? clubs : [];
  // IMPORTANTE: no basta con comparar length (muchas ligas tienen 20 clubes)
  // Si los IDs no coinciden, hay que reconstruir.
  if (!selectOptionsMatchList(sel, list)) {
    sel.innerHTML = '';
    list.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name || c.shortName || c.id;
      sel.appendChild(opt);
    });
  }
  if (!__selectedClubId) __selectedClubId = getUserClubId();
  // Si el club seleccionado no existe en esta competición, caer al primero
  const selected = String(__selectedClubId || '');
  const exists = list.some((c) => String(c?.id) === selected);
  if (!exists) __selectedClubId = list?.[0]?.id || null;
  setSelectValueSafe(sel, __selectedClubId);
}

function ensureBindings() {
  if (__bound) return;
  const compSel = document.getElementById('results-competition-select');
  const clubSel = document.getElementById('results-club-select');
  const tbody = document.getElementById('results-fixtures-body');
  if (!compSel || !clubSel || !tbody) return;

  compSel.addEventListener('change', () => {
    __selectedCompetitionId = String(compSel.value || getDefaultCompetitionId());
    const comp = getCompetitionById(__selectedCompetitionId);
    // Al cambiar de competición, volver al club del usuario si existe ahí.
    __selectedClubId = getUserClubId();
    // Si el club no pertenece a esa liga, coger el primero.
    if (comp && __selectedClubId) {
      const exists = (comp.clubs || []).some((c) => String(c?.id) === String(__selectedClubId));
      if (!exists) __selectedClubId = comp.clubs?.[0]?.id || null;
    }
    updateResultsView();
  });

  clubSel.addEventListener('change', () => {
    __selectedClubId = String(clubSel.value || getUserClubId());
    updateResultsView();
  });

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

export function initResultsUI({ onOpenMatchDetail } = {}) {
  __onOpenMatchDetail = typeof onOpenMatchDetail === 'function' ? onOpenMatchDetail : null;
  if (!__selectedCompetitionId) __selectedCompetitionId = getCurrentCompetitionId() || getDefaultCompetitionId();
  if (!__selectedClubId) __selectedClubId = getUserClubId();
}

export function updateResultsView() {
  ensureBindings();

  const compSel = document.getElementById('results-competition-select');
  const clubSel = document.getElementById('results-club-select');
  const tbody = document.getElementById('results-fixtures-body');
  if (!compSel || !clubSel || !tbody) return;

  renderCompetitionSelect(compSel);
  const compId = String(__selectedCompetitionId || getCurrentCompetitionId() || getDefaultCompetitionId() || '');
  if (!__selectedCompetitionId) __selectedCompetitionId = compId;
  const comp = getCompetitionById(compId);
  if (!comp) return;

  renderClubSelect(clubSel, comp.clubs);
  const clubsIndex = buildClubIndex(comp.clubs);

  // Revalida aquí también (primera carga / estados raros)
  let clubId = String(__selectedClubId || getUserClubId() || '');
  if (!clubsIndex.has(clubId)) {
    const fallback = comp.clubs?.[0]?.id || null;
    __selectedClubId = fallback;
    clubId = String(fallback || '');
    setSelectValueSafe(clubSel, __selectedClubId);
  }

  const club = clubsIndex.get(clubId) || null;
  // No hay hint en HTML; dejamos el título de la vista como referencia.

  const season = Number(comp.currentDate?.season || 1);

  const list = (comp.fixtures || [])
    .filter((fx) =>
      fx &&
      fx.played &&
      (String(fx.homeClubId) === clubId || String(fx.awayClubId) === clubId)
    )
    .slice()
    .sort((a, b) => {
      const mdA = Number(a.matchday || 0);
      const mdB = Number(b.matchday || 0);
      if (mdA !== mdB) return mdB - mdA;
      return String(b.id).localeCompare(String(a.id));
    });

  tbody.innerHTML = '';

  if (!list.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="6">No hay resultados jugados aún.</td>`;
    tbody.appendChild(tr);
    return;
  }

  list.forEach((fx) => {
    const home = clubsIndex.get(fx.homeClubId);
    const away = clubsIndex.get(fx.awayClubId);
    const homeName = (home && (home.shortName || home.name)) || fx.homeClubId || 'Local';
    const awayName = (away && (away.shortName || away.name)) || fx.awayClubId || 'Visitante';
    const score = `${Number(fx.homeGoals || 0)} - ${Number(fx.awayGoals || 0)}`;

    // Fecha/hora real si existe; si no, fallback al calendario interno
    const dateLabel = formatFixtureKickoffLabel(fx, season, Number(fx.matchday || 1)) || '';

    const coatH = createCoatImgElement(fx.homeClubId, homeName, 18);
    const coatA = createCoatImgElement(fx.awayClubId, awayName, 18);

    const tr = document.createElement('tr');
    tr.className = 'is-clickable';
    tr.setAttribute('data-fixture-id', String(fx.id));
    tr.setAttribute('data-competition-id', String(comp.id));
    tr.innerHTML = `
      <td class="th-num">J${escapeHtml(fx.matchday || '')}</td>
      <td>${escapeHtml(dateLabel)}</td>
      <td class="pcf-team-cell">${coatH ? coatH.outerHTML : ''}<span>${escapeHtml(homeName)}</span></td>
      <td class="pcf-score-cell"><strong>${escapeHtml(score)}</strong></td>
      <td class="pcf-team-cell">${coatA ? coatA.outerHTML : ''}<span>${escapeHtml(awayName)}</span></td>
      <td class="pcf-actions-cell">
        <button class="btn btn-small" type="button" data-competition-id="${escapeHtml(comp.id)}" data-fixture-id="${escapeHtml(fx.id)}">Detalle</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}