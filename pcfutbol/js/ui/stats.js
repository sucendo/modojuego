/**
 * UI: Estadísticas de jugadores (todas las ligas + filtro por liga/equipo)
 * - Tabla única, ordenable por columnas
 * - Al pulsar un jugador: desplegable con estadísticas por jornada
 */

import { GameState } from '../state.js';
import { allLeagues } from '../data.js';
import { getCoatUrlForClubId } from './utils/coats.js';

let __bound = false;
let __statsFilterLeagueId = null; // null => por defecto liga actual
let __statsFilterClubId = 'ALL';
let __sortKey = 'goals';
let __sortDir = 'DESC';

function escapeHtml(value) {
  const s = String(value ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSeasonKey() {
  const season = GameState.currentDate?.season || 1;
  return String(season);
}

function getLeagueIdCurrent() {
  return GameState.league?.id || null;
}

function getWorldLeagues() {
  const arr = GameState.world?.leagues;
  return Array.isArray(arr) ? arr : [];
}

function getLeagueSources() {
  const currentId = getLeagueIdCurrent();
  const current = {
    id: currentId,
    name: GameState.league?.name || currentId || 'Liga',
    clubs: Array.isArray(GameState.clubs) ? GameState.clubs : [],
    isCurrent: true,
  };

  const world = getWorldLeagues();
  if (world.length) {
    return [
      current,
      ...world
        .filter((l) => l && l.id && l.id !== currentId)
        .map((l) => ({
          id: l.id,
          name: l.name || l.id,
          clubs: Array.isArray(l.clubs) ? l.clubs : [],
          isCurrent: false,
        })),
    ];
  }

  // Fallback si aún no hay world en el save
  return [
    current,
    ...((allLeagues || [])
      .filter((l) => l && l.id && l.id !== currentId)
      .map((l) => ({
        id: l.id,
        name: l.name || l.id,
        clubs: Array.isArray(l.clubs) ? l.clubs : [],
        isCurrent: false,
      })) || []),
  ];
}

function getClubsForLeagueId(leagueId) {
  const currentId = getLeagueIdCurrent();
  if (leagueId && currentId && leagueId === currentId) {
    return Array.isArray(GameState.clubs) ? GameState.clubs : [];
  }
  const world = getWorldLeagues().find((l) => l?.id === leagueId);
  if (world) return Array.isArray(world.clubs) ? world.clubs : [];

  const l = (allLeagues || []).find((x) => x?.id === leagueId);
  return Array.isArray(l?.clubs) ? l.clubs : [];
}

function getCoatSrcFromClubId(clubId) {
  const rel = getCoatUrlForClubId(clubId);
  return rel ? String(rel) : '';
}

function renderCoatWithText(clubId, shortText, fullText) {
  const src = getCoatSrcFromClubId(clubId);
  const label = escapeHtml(shortText || fullText || clubId || '');
  if (!src) return `<span class="pcf-inline-team__name">${label}</span>`;
  const alt = escapeHtml(fullText || shortText || clubId || 'Escudo');
  return `
    <span class="pcf-inline-team">
      <img src="${escapeHtml(src)}" alt="${alt}" class="coat-icon" loading="lazy" width="18" height="18">
      <span class="pcf-inline-team__name">${label}</span>
    </span>
  `;
}

function getPlayerSeasonStats(player, seasonKey) {
  const st = player?.stats?.[seasonKey] || {};
  return {
    apps: Number(st.apps || 0),
    minutes: Number(st.minutes || 0),
    goals: Number(st.goals || 0),
    assists: Number(st.assists || 0),
    yellows: Number(st.yellows || 0),
    reds: Number(st.reds || 0),
  };
}

function getPlayerMatchdayRows(player, seasonKey) {
  const arr = player?.statsByMatchday?.[seasonKey];
  return Array.isArray(arr) ? arr.slice() : [];
}

function clearExpandedRows(tbody) {
  if (!tbody) return;
  tbody.querySelectorAll('tr.pcf-expand-row').forEach((tr) => tr.remove());
  tbody.querySelectorAll('tr.is-expanded').forEach((tr) => tr.classList.remove('is-expanded'));
}

function renderExpandedMatchdayRow(afterTr, player, seasonKey, colSpan) {
  const tbody = afterTr?.parentElement;
  if (!tbody) return;

  const next = afterTr.nextElementSibling;
  if (next && next.classList.contains('pcf-expand-row')) {
    next.remove();
    afterTr.classList.remove('is-expanded');
    return;
  }

  clearExpandedRows(tbody);
  afterTr.classList.add('is-expanded');

  const rows = getPlayerMatchdayRows(player, seasonKey).sort((a, b) => {
    const sa = Number(a?.season || 0) - Number(b?.season || 0);
    if (sa !== 0) return sa;
    return Number(a?.matchday || 0) - Number(b?.matchday || 0);
  });

  const detailTr = document.createElement('tr');
  detailTr.className = 'pcf-expand-row';
  const td = document.createElement('td');
  td.colSpan = colSpan;

  if (!rows.length) {
    td.innerHTML = `<div class="pcf-expand-empty">Sin estadísticas por jornada para este jugador.</div>`;
    detailTr.appendChild(td);
    afterTr.insertAdjacentElement('afterend', detailTr);
    return;
  }

  td.innerHTML = `
    <div class="pcf-expand-card">
      <div class="pcf-expand-title">Estadísticas por jornada</div>
      <div class="table-wrapper pcf-expand-table">
        <table class="table table-compact">
          <thead>
            <tr>
              <th>Temp.</th>
              <th>Jor.</th>
              <th>Rival</th>
              <th>Cond.</th>
              <th>Min</th>
              <th>G</th>
              <th>A</th>
              <th>TA</th>
              <th>TR</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((r) => {
                const season = escapeHtml(r?.season ?? '-');
                const md = escapeHtml(r?.matchday ?? '-');
                const oppId = r?.opponentId || r?.opponentClubId || null;
                const oppName = r?.opponentName ?? r?.opponent ?? r?.rival ?? 'Rival';
                const oppHtml = oppId ? renderCoatWithText(oppId, null, oppName) : escapeHtml(oppName);
                const cond = escapeHtml(
                  r?.homeAway ?? (r?.isHome === true ? 'C' : r?.isHome === false ? 'F' : '-')
                );
                const min = escapeHtml(Number(r?.minutes || 0));
                const g = escapeHtml(Number(r?.goals || 0));
                const a = escapeHtml(Number(r?.assists || 0));
                const ta = escapeHtml(Number(r?.yellows || 0));
                const tr = escapeHtml(Number(r?.reds || 0));
                return `
                  <tr>
                    <td>${season}</td>
                    <td>${md}</td>
                    <td>${oppHtml}</td>
                    <td>${cond}</td>
                    <td>${min}</td>
                    <td>${g}</td>
                    <td>${a}</td>
                    <td>${ta}</td>
                    <td>${tr}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  detailTr.appendChild(td);
  afterTr.insertAdjacentElement('afterend', detailTr);
}

function normalizeLeagueFilterValue(val) {
  const v = String(val || '').trim();
  if (!v || v === 'ALL') return 'ALL';
  return v;
}

function renderLeagueSelect(selectEl) {
  const sources = getLeagueSources();
  const currentId = getLeagueIdCurrent();

  const desired = normalizeLeagueFilterValue(__statsFilterLeagueId || currentId || 'ALL');
  __statsFilterLeagueId = desired === 'ALL' ? 'ALL' : desired;

  const options = [
    { value: 'ALL', label: 'Todas las ligas' },
    ...sources.map((l) => ({ value: l.id, label: l.name || l.id })),
  ];

  selectEl.innerHTML = options
    .filter((o, idx, arr) => idx === arr.findIndex((x) => x.value === o.value))
    .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
    .join('');

  selectEl.value = options.some((o) => o.value === __statsFilterLeagueId) ? __statsFilterLeagueId : 'ALL';
}

function renderClubSelect(selectEl, leagueId) {
  const lid = normalizeLeagueFilterValue(leagueId);

  let clubs = [];
  if (lid === 'ALL') {
    const src = getLeagueSources();
    src.forEach((s) => {
      (s.clubs || []).forEach((c) => {
        if (!c || !c.id) return;
        clubs.push({ ...c, __leagueId: s.id, __leagueName: s.name });
      });
    });
  } else {
    clubs = (getClubsForLeagueId(lid) || []).map((c) => ({
      ...c,
      __leagueId: lid,
      __leagueName: getLeagueSources().find((x) => x.id === lid)?.name || lid,
    }));
  }

  clubs = clubs
    .filter((c) => c && c.id)
    .slice()
    .sort((a, b) => (a.name || a.shortName || '').localeCompare(b.name || b.shortName || ''));

  const options = [
    { value: 'ALL', label: 'Todos los equipos' },
    ...clubs.map((c) => ({
      value: c.id,
      label:
        lid === 'ALL'
          ? `${c.__leagueName || c.__leagueId} · ${c.name || c.shortName || c.id}`
          : (c.name || c.shortName || c.id),
    })),
  ];

  selectEl.innerHTML = options
    .filter((o, idx, arr) => idx === arr.findIndex((x) => x.value === o.value))
    .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
    .join('');

  if (!options.some((o) => o.value === __statsFilterClubId)) __statsFilterClubId = 'ALL';
  selectEl.value = __statsFilterClubId;
}

function getActiveSources() {
  const lid = normalizeLeagueFilterValue(__statsFilterLeagueId || getLeagueIdCurrent() || 'ALL');
  if (lid === 'ALL') return getLeagueSources();
  const src = getLeagueSources().find((s) => s.id === lid);
  return src ? [src] : [];
}

function buildPlayerRows(seasonKey) {
  const sources = getActiveSources();
  const clubFilter = String(__statsFilterClubId || 'ALL');

  const rows = [];
  sources.forEach((src) => {
    (src.clubs || []).forEach((club) => {
      if (!club || !club.id) return;
      if (clubFilter !== 'ALL' && club.id !== clubFilter) return;
      (club.players || []).forEach((p) => {
        if (!p || !p.id) return;
        const st = getPlayerSeasonStats(p, seasonKey);
        rows.push({ player: p, club, leagueId: src.id, leagueName: src.name, ...st });
      });
    });
  });
  return rows;
}

function compareValues(a, b, dir) {
  if (a == null && b == null) return 0;
  if (a == null) return dir === 'ASC' ? -1 : 1;
  if (b == null) return dir === 'ASC' ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return dir === 'ASC' ? a - b : b - a;
  return dir === 'ASC' ? String(a).localeCompare(String(b)) : String(b).localeCompare(String(a));
}

function sortRows(rows) {
  const key = __sortKey;
  const dir = __sortDir;

  return rows.slice().sort((ra, rb) => {
    let a;
    let b;
    switch (key) {
      case 'league':
        a = ra.leagueName || ra.leagueId || '';
        b = rb.leagueName || rb.leagueId || '';
        break;
      case 'club':
        a = ra.club?.shortName || ra.club?.name || ra.club?.id;
        b = rb.club?.shortName || rb.club?.name || rb.club?.id;
        break;
      case 'pos':
        a = ra.player?.position || '';
        b = rb.player?.position || '';
        break;
      case 'name':
        a = ra.player?.name || '';
        b = rb.player?.name || '';
        break;
      case 'apps':
        a = ra.apps;
        b = rb.apps;
        break;
      case 'minutes':
        a = ra.minutes;
        b = rb.minutes;
        break;
      case 'goals':
        a = ra.goals;
        b = rb.goals;
        break;
      case 'assists':
        a = ra.assists;
        b = rb.assists;
        break;
      case 'yellows':
        a = ra.yellows;
        b = rb.yellows;
        break;
      case 'reds':
        a = ra.reds;
        b = rb.reds;
        break;
      default:
        a = ra.goals;
        b = rb.goals;
        break;
    }

    const primary = compareValues(a, b, dir);
    if (primary !== 0) return primary;
    if (key !== 'goals') {
      const g = compareValues(ra.goals, rb.goals, 'DESC');
      if (g !== 0) return g;
    }
    const nm = compareValues(ra.player?.name || '', rb.player?.name || '', 'ASC');
    if (nm !== 0) return nm;
    return compareValues(ra.club?.name || '', rb.club?.name || '', 'ASC');
  });
}

function setSortHeaderState(tableEl) {
  if (!tableEl) return;
  const headers = tableEl.querySelectorAll('thead th[data-sort], thead th[data-sort-key]');
  headers.forEach((th) => {
    const key = th.getAttribute('data-sort') || th.getAttribute('data-sort-key');
    if (!key) return;
    const isSorted = key === __sortKey;
    th.classList.toggle('is-sorted', isSorted);
    if (isSorted) th.setAttribute('data-sort-dir', __sortDir);
    else th.removeAttribute('data-sort-dir');
  });
}

function ensureBindings() {
  if (__bound) return;

  const leagueSel = document.getElementById('stats-filter-league');
  const clubSel = document.getElementById('stats-filter-club');
  const table = document.getElementById('stats-table');

  if (!leagueSel || !clubSel || !table) return;

  leagueSel.addEventListener('change', () => {
    __statsFilterLeagueId = normalizeLeagueFilterValue(leagueSel.value);
    __statsFilterClubId = 'ALL';
    renderClubSelect(clubSel, __statsFilterLeagueId);
    updateStatsView();
  });

  clubSel.addEventListener('change', () => {
    __statsFilterClubId = String(clubSel.value || 'ALL');
    updateStatsView();
  });

  table.querySelectorAll('thead th[data-sort], thead th[data-sort-key]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort') || th.getAttribute('data-sort-key');
      if (!key) return;
      if (__sortKey === key) __sortDir = __sortDir === 'ASC' ? 'DESC' : 'ASC';
      else {
        __sortKey = key;
        __sortDir = ['name', 'club', 'pos', 'league'].includes(key) ? 'ASC' : 'DESC';
      }
      updateStatsView();
    });
  });

  __bound = true;
}

export function updateStatsView() {
  const season = GameState.currentDate?.season || 1;
  const label = document.getElementById('stats-season-label');
  if (label) label.textContent = `Temporada ${season}`;

  ensureBindings();

  const leagueSel = document.getElementById('stats-filter-league');
  const clubSel = document.getElementById('stats-filter-club');
  const table = document.getElementById('stats-table');
  const tbody = document.getElementById('stats-all-body');
  const title = document.getElementById('stats-list-title');
  if (!leagueSel || !clubSel || !table || !tbody) return;

  const seasonKey = getSeasonKey();

  renderLeagueSelect(leagueSel);
  renderClubSelect(clubSel, __statsFilterLeagueId || getLeagueIdCurrent() || 'ALL');

  const lid = normalizeLeagueFilterValue(__statsFilterLeagueId || getLeagueIdCurrent() || 'ALL');
  if (title) {
    const leagueText = lid === 'ALL' ? 'Todas las ligas' : (getLeagueSources().find((l) => l.id === lid)?.name || lid);
    title.textContent = `Jugadores · ${leagueText}`;
  }

  const rows = sortRows(buildPlayerRows(seasonKey));
  setSortHeaderState(table);

  tbody.innerHTML = '';
  clearExpandedRows(tbody);

  if (!rows.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="10">No hay jugadores para este filtro.</td>`;
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((r) => {
    const leagueHtml = `<span class="pcf-inline-league">${escapeHtml(r.leagueName || r.leagueId || '')}</span>`; 
    const clubShort = r.club?.shortName || r.club?.abbr || r.club?.name || r.club?.id || '';
    const clubFull = r.club?.name || r.club?.shortName || r.club?.id || '';
    const clubHtml = renderCoatWithText(r.club?.id, clubShort, clubFull);

    const tr = document.createElement('tr');
    tr.className = 'is-clickable';
    tr.__pcfPlayer = r.player;
    tr.__pcfClub = r.club;
    tr.innerHTML = `
      <td>${leagueHtml}</td>	
      <td>${clubHtml}</td>
      <td>${escapeHtml(r.player?.position || '')}</td>
      <td>${escapeHtml(r.player?.name || 'Jugador')}</td>
      <td>${Number(r.apps || 0)}</td>
      <td>${Number(r.minutes || 0)}</td>
      <td><strong>${Number(r.goals || 0)}</strong></td>
      <td>${Number(r.assists || 0)}</td>
      <td>${Number(r.yellows || 0)}</td>
      <td>${Number(r.reds || 0)}</td>
    `;
    tr.onclick = () => renderExpandedMatchdayRow(tr, r.player, seasonKey, 10);
    tbody.appendChild(tr);
  });
}