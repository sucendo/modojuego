/**
 * Estadísticas (placeholder).
 */

import { GameState } from '../state.js';
import { allLeagues } from '../data.js';
import { getCoatUrlForClubId } from './utils/coats.js';

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

  // toggle
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

  const header = `
    <div class="pcf-expand-title">Estadísticas por jornada</div>
  `;

  const table = `
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
              const oppName = r?.opponentName ?? r?.opponent ?? r?.rival ?? 'Rival';
              const oppId = r?.opponentId || null;
              const oppHtml = oppId
                ? renderCoatWithText(oppId, String(oppName), String(oppName))
                : escapeHtml(oppName);
              const cond = escapeHtml(r?.homeAway ?? (r?.isHome === true ? 'C' : r?.isHome === false ? 'F' : '-'));
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
  `;

  td.innerHTML = `<div class="pcf-expand-card">${header}${table}</div>`;
  detailTr.appendChild(td);
  afterTr.insertAdjacentElement('afterend', detailTr);
}

let __statsUIBound = false;
let __statsFilterLeagueId = null; // null => inicial (liga actual)
let __statsFilterClubId = 'ALL';
let __statsSortKey = 'goals';
let __statsSortDir = 'DESC';

function getLeagueIdCurrent() {
  return GameState.league?.id || null;
}

function getLeagueNameById(leagueId) {
  const currentId = getLeagueIdCurrent();
  if (leagueId && currentId && leagueId === currentId) return GameState.league?.name || leagueId;
  const l = (allLeagues || []).find((x) => x.id === leagueId);
  return l?.name || leagueId || '';
}

function getLeagueSources() {
  const currentId = getLeagueIdCurrent();
  const current = currentId
    ? [
        {
          id: currentId,
          name: GameState.league?.name || currentId,
          clubs: GameState.clubs || [],
          isCurrent: true,
        },
      ]
    : [];
  const others = (allLeagues || [])
    .filter((l) => !currentId || l.id !== currentId)
    .map((l) => ({
      id: l.id,
      name: l.name || l.id,
      clubs: l.clubs || [],
      isCurrent: false,
    }));
  return current.concat(others);
}

function getClubsForLeagueId(leagueId) {
  const currentId = getLeagueIdCurrent();
  if (leagueId && currentId && leagueId === currentId) return GameState.clubs || [];
  const l = (allLeagues || []).find((x) => x.id === leagueId);
  return l?.clubs || [];
}

function getCoatSrcFromClubId(clubId) {
  const rel = getCoatUrlForClubId(clubId);
  return rel ? `${rel}` : '';
}

function renderCoatWithText(clubId, text, fullTitle) {
  const src = getCoatSrcFromClubId(clubId);
  if (!src) return escapeHtml(text);
  return `
    <span class="club-with-coat" title="${escapeHtml(fullTitle || text || '')}">
      <img src="${escapeHtml(src)}" alt="Escudo" class="coat-icon" loading="lazy" width="18" height="18">
      <span>${escapeHtml(text)}</span>
    </span>
  `;
}

function renderLeagueSelect(selectEl) {
  if (!selectEl) return;

  const currentId = getLeagueIdCurrent();
  if (!__statsFilterLeagueId) __statsFilterLeagueId = currentId || 'ALL';

  const sources = getLeagueSources();

  selectEl.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = 'ALL';
  optAll.textContent = 'Todas';
  selectEl.appendChild(optAll);

  sources.forEach((l) => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = l.name || l.id;
    selectEl.appendChild(opt);
  });

  const wanted = __statsFilterLeagueId || currentId || 'ALL';
  const exists = Array.from(selectEl.options).some((o) => o.value === wanted);
  selectEl.value = exists ? wanted : 'ALL';
  __statsFilterLeagueId = selectEl.value;
}

function renderClubSelect(selectEl, leagueId) {
  if (!selectEl) return;
  selectEl.innerHTML = '';

  const optAll = document.createElement('option');
  optAll.value = 'ALL';
  optAll.textContent = 'Todos';
  selectEl.appendChild(optAll);

  let clubs = [];
  if (leagueId === 'ALL') {
    const sources = getLeagueSources();
    sources.forEach((l) => {
      (l.clubs || []).forEach((c) => clubs.push({ ...c, __leagueId: l.id, __leagueName: l.name }));
    });
  } else {
    const list = getClubsForLeagueId(leagueId);
    clubs = (list || []).map((c) => ({
      ...c,
      __leagueId: leagueId,
      __leagueName: getLeagueNameById(leagueId),
    }));
  }

  clubs
    .slice()
    .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'es', { sensitivity: 'base' }))
    .forEach((club) => {
      const opt = document.createElement('option');
      opt.value = club.id;
      opt.textContent =
        leagueId === 'ALL'
          ? `${club.__leagueName || club.__leagueId} · ${club.name || club.id}`
          : club.name || club.id;
      selectEl.appendChild(opt);
    });

  const wanted = __statsFilterClubId || 'ALL';
  const exists = Array.from(selectEl.options).some((o) => o.value === wanted);
  selectEl.value = exists ? wanted : 'ALL';
  __statsFilterClubId = selectEl.value;
}

function setSortHeaderState(tableEl) {
  if (!tableEl) return;
  const ths = tableEl.querySelectorAll('thead th[data-sort-key]');
  ths.forEach((th) => {
    const k = th.getAttribute('data-sort-key');
    th.classList.toggle('is-sorted', k === __statsSortKey);
    if (k === __statsSortKey) th.dataset.sortDir = __statsSortDir;
    else delete th.dataset.sortDir;
  });
}

function ensureStatsBindings() {
  if (__statsUIBound) return;

  const leagueSel = document.getElementById('stats-filter-league');
  const clubSel = document.getElementById('stats-filter-club');
  const table = document.getElementById('stats-players-table');

  if (leagueSel) {
    leagueSel.addEventListener('change', () => {
      __statsFilterLeagueId = leagueSel.value || 'ALL';
      __statsFilterClubId = 'ALL';
      updateStatsView();
    });
  }

  if (clubSel) {
    clubSel.addEventListener('change', () => {
      __statsFilterClubId = clubSel.value || 'ALL';
      updateStatsView();
    });
  }

  if (table) {
    table.querySelectorAll('thead th[data-sort-key]').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort-key');
        if (!key) return;

        if (__statsSortKey === key) {
          __statsSortDir = __statsSortDir === 'ASC' ? 'DESC' : 'ASC';
        } else {
          __statsSortKey = key;
          __statsSortDir = ['apps', 'minutes', 'goals', 'assists', 'yellows', 'reds'].includes(key) ? 'DESC' : 'ASC';
        }
        updateStatsView();
      });
    });
  }

  __statsUIBound = true;
}

function buildPlayerRows(seasonKey, leagueId, clubId) {
  const rows = [];
  const addClubPlayers = (lid, clubs) => {
    (clubs || []).forEach((club) => {
      if (clubId !== 'ALL' && club?.id !== clubId) return;
      (club.players || []).forEach((p) => {
        const st = getPlayerSeasonStats(p, seasonKey);
        rows.push({
          leagueId: lid,
          club,
          player: p,
          ...st,
        });
      });
    });
  };

  if (leagueId === 'ALL') {
    const sources = getLeagueSources();
    sources.forEach((l) => addClubPlayers(l.id, l.clubs));
  } else {
    addClubPlayers(leagueId, getClubsForLeagueId(leagueId));
  }

  return rows;
}

function sortPlayerRows(rows) {
  const dir = __statsSortDir === 'ASC' ? 1 : -1;
  const str = (v) => String(v ?? '');

  const get = (r) => {
    switch (__statsSortKey) {
      case 'club':
        return str(r.club?.shortName || r.club?.name || r.club?.id || '');
      case 'pos':
        return str(r.player?.position || '');
      case 'name':
        return str(r.player?.name || '');
      case 'apps':
        return Number(r.apps || 0);
      case 'minutes':
        return Number(r.minutes || 0);
      case 'goals':
        return Number(r.goals || 0);
      case 'assists':
        return Number(r.assists || 0);
      case 'yellows':
        return Number(r.yellows || 0);
      case 'reds':
        return Number(r.reds || 0);
      default:
        return Number(r.goals || 0);
    }
  };

  const isNumeric = ['apps', 'minutes', 'goals', 'assists', 'yellows', 'reds'].includes(__statsSortKey);

  rows.sort((a, b) => {
    const av = get(a);
    const bv = get(b);

    if (isNumeric) {
      if (bv !== av) return (bv - av) * dir;
    } else {
      const c = str(av).localeCompare(str(bv), 'es', { sensitivity: 'base' });
      if (c) return c * dir;
    }

    // desempates: goles, asist, min, nombre
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.assists !== a.assists) return b.assists - a.assists;
    if (b.minutes !== a.minutes) return b.minutes - a.minutes;
    return str(a.player?.name || '').localeCompare(str(b.player?.name || ''), 'es', { sensitivity: 'base' });
  });

  return rows;
}

export function updateStatsView() {
  const season = GameState.currentDate?.season || 1;
  const label = document.getElementById('stats-season-label');
  if (label) label.textContent = `Temporada ${season}`;

  const leagueSel = document.getElementById('stats-filter-league');
  const clubSel = document.getElementById('stats-filter-club');
  const tbody = document.getElementById('stats-players-body');
  const table = document.getElementById('stats-players-table');
  const title = document.getElementById('stats-list-title');
  if (!tbody || !table) return;

  ensureStatsBindings();

  renderLeagueSelect(leagueSel);
  renderClubSelect(clubSel, __statsFilterLeagueId || 'ALL');
  setSortHeaderState(table);

  const key = getSeasonKey();
  const rows = sortPlayerRows(buildPlayerRows(key, __statsFilterLeagueId || 'ALL', __statsFilterClubId || 'ALL'));

  // Título contextual
  if (title) {
    const leagueTxt = __statsFilterLeagueId === 'ALL' ? 'Todas las ligas' : getLeagueNameById(__statsFilterLeagueId);

    let clubTxt = '';
    if (__statsFilterClubId !== 'ALL') {
      if (__statsFilterLeagueId === 'ALL') {
        const sources = getLeagueSources();
        for (const l of sources) {
          const found = (l.clubs || []).find((c) => c.id === __statsFilterClubId);
          if (found) {
            clubTxt = found.name || found.shortName || found.id;
            break;
          }
        }
      } else {
        const found = (getClubsForLeagueId(__statsFilterLeagueId) || []).find((c) => c.id === __statsFilterClubId);
        clubTxt = found?.name || found?.shortName || __statsFilterClubId;
      }
    }

    title.textContent = clubTxt ? `Jugadores · ${leagueTxt} · ${clubTxt}` : `Jugadores · ${leagueTxt}`;
  }

  tbody.innerHTML = '';
  if (!rows.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="9">Sin jugadores para ese filtro.</td>`;
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.className = 'is-clickable';

    const clubName = r.club?.name || r.club?.id || '';
    const clubShort = r.club?.shortName || clubName;
    const clubCell = renderCoatWithText(r.club?.id, clubShort, clubName); 

    tr.__pcfPlayer = r.player;
    tr.innerHTML = `
      <td>${clubCell}</td>
      <td>${escapeHtml(r.player?.position || '')}</td>
      <td>${escapeHtml(r.player?.name || 'Jugador')}</td>
      <td class="num">${r.apps}</td>
      <td class="num">${r.minutes}</td>
      <td class="num"><strong>${r.goals}</strong></td>
      <td class="num">${r.assists}</td>
      <td class="num">${r.yellows}</td>
      <td class="num">${r.reds}</td>
    `;

    tr.onclick = () => renderExpandedMatchdayRow(tr, r.player, key, 9);
    tbody.appendChild(tr);
  });
}