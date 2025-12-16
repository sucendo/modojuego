/**
 * Competición (placeholder).
 */

import { GameState } from '../state.js';
import { getGameDateFor, formatGameDateLabel } from './utils/calendar.js';
import { createCoatImgElement } from './utils/coats.js';

let selectedMatchday = 1;
let onOpenMatchDetail = null;

function getClubsIndex() {
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  const map = new Map();
  clubs.forEach((c) => {
    if (c?.id) map.set(c.id, c);
  });
  return map;
}

function getClubName(club) {
  return (club && (club.shortName || club.name)) || (club && club.id) || '';
}

function setSelectValueSafe(selectEl, value) {
  if (!selectEl) return;
  const v = String(value);
  const opt = Array.from(selectEl.options || []).find((o) => o.value === v);
  if (opt) selectEl.value = v;
}

function getMaxMatchday() {
  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  let max = 0;
  fixtures.forEach((fx) => {
    const md = Number(fx?.matchday || 0);
    if (Number.isFinite(md) && md > max) max = md;
  });
  return max || Number(GameState.league?.matchdays || 38) || 38;
}

function escapeHtml(value) {
  const s = String(value ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCoatImg(clubId, clubName, size = 18) {
  return createCoatImgElement(clubId, clubName, size);
}

function getFixtureKickoffTime(fx, idxInMatchday = 0) {
  // 1) Si el fixture ya trae hora, úsala
  const t = fx?.kickoffTime;
  if (typeof t === 'string' && t.includes(':')) return t;

  // 2) Si no, derivamos una hora estable (no aleatoria) por orden en la jornada
  const slots = ['16:00', '18:15', '20:30', '22:00'];
  const i = Number.isFinite(idxInMatchday) ? idxInMatchday : 0;
  return slots[i % slots.length];
}

function buildGoalsIndexFromFixtures(season) {
  // Pichichi robusto: contar goles desde los fixtures jugados
  const playerIndex = new Map();
  (GameState.clubs || []).forEach((club) => {
    (club.players || []).forEach((p) => {
      if (p?.id) playerIndex.set(p.id, { player: p, club });
    });
  });

  const goals = new Map(); // playerId -> goals
  (GameState.fixtures || []).forEach((fx) => {
    if (!fx?.played) return;
    if (season != null && fx.season != null && fx.season !== season) return;
    const events = Array.isArray(fx.events) ? fx.events : [];
    events.forEach((ev) => {
      if (ev?.type !== 'GOAL') return;
      if (!ev.playerId) return;
      goals.set(ev.playerId, (goals.get(ev.playerId) || 0) + 1);
    });
  });

  return { goals, playerIndex };
}

export function initCompetitionUI({
  initialMatchday,
  onOpenMatchDetail: onOpen,
} = {}) {
  if (Number.isFinite(initialMatchday) && initialMatchday >= 1) {
    selectedMatchday = initialMatchday;
  } else {
    selectedMatchday = Number(GameState.currentDate?.matchday || 1);
  }

  onOpenMatchDetail = typeof onOpen === 'function' ? onOpen : null;

  const matchdaySelect = document.getElementById('competition-matchday-select');
  const simulateBtn = document.getElementById('btn-simulate-matchday');
  const fixturesBody = document.getElementById('competition-fixtures-body');

  if (matchdaySelect) {
    matchdaySelect.addEventListener('change', () => {
      const md = Number.parseInt(matchdaySelect.value, 10);
      if (Number.isFinite(md) && md >= 1) {
        selectedMatchday = md;
        updateCompetitionView();
      }
    });
  }

  // Click en "Detalle" o en la fila → abrir modal detalle
  if (fixturesBody) {
    fixturesBody.addEventListener('click', (ev) => {
      const target =
        ev.target instanceof Element ? ev.target : ev.target?.parentElement;
      if (!target) return;
      const btn = target.closest('button[data-fixture-id]');
      const tr = target.closest('tr[data-fixture-id]');
      const id = btn?.dataset?.fixtureId || tr?.dataset?.fixtureId;
      if (!id) return;
      if (onOpenMatchDetail) onOpenMatchDetail(id);
    });
  }

  // El botón de simular lo sigue gestionando ui.js (porque llama a simulateCurrentMatchday)
  // Aquí solo dejamos el listener si quieres moverlo también más adelante.
  if (simulateBtn) {
    // no-op (gestionado fuera)
  }
}

export function setCompetitionSelectedMatchday(matchday) {
  const md = Number(matchday);
  if (Number.isFinite(md) && md >= 1) selectedMatchday = md;
}

export function getCompetitionSelectedMatchday() {
  return selectedMatchday;
}

export function updateCompetitionView() {
  const matchdaySelect = document.getElementById('competition-matchday-select');
  const seasonLabel = document.getElementById('competition-season-label');
  const currentMdLabel = document.getElementById('competition-current-matchday-label');
  const dateLabelEl = document.getElementById('competition-date-label');

  const fixturesBody = document.getElementById('competition-fixtures-body');
  const tableBody = document.getElementById('competition-table-body');
  const topBody = document.getElementById('competition-topscorers-body');
 

  const season = Number(GameState.currentDate?.season || 1);
  const md = Number(selectedMatchday || 1);

  // Labels superiores
  const date = getGameDateFor(season, md);
  const dateLabel = formatGameDateLabel(date);
  if (seasonLabel) seasonLabel.textContent = String(season);
  if (currentMdLabel) currentMdLabel.textContent = String(GameState.currentDate?.matchday || 1);
  if (dateLabelEl) dateLabelEl.textContent = dateLabel || '';

  // Select options (si no están rellenadas, las rellenamos una vez)
  if (matchdaySelect && matchdaySelect.options.length === 0) {
    const maxMd = getMaxMatchday();
    for (let i = 1; i <= maxMd; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Jornada ${i}`;
      matchdaySelect.appendChild(opt);
    }
  }
  setSelectValueSafe(matchdaySelect, md);

  // -----------------------------
  // Partidos
  // -----------------------------
  if (fixturesBody) fixturesBody.innerHTML = '';

  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  const clubsIndex = getClubsIndex();

  const list = fixtures
    .filter((fx) => fx && Number(fx.matchday) === md)
    .slice()
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  if (fixturesBody) {
    if (list.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5">No hay partidos para esta jornada.</td>`;
      fixturesBody.appendChild(tr);
    } else {
      list.forEach((fx, idx) => {
        const home = clubsIndex.get(fx.homeClubId);
        const away = clubsIndex.get(fx.awayClubId);

        const homeName = getClubName(home) || fx.homeClubId || 'Local';
        const awayName = getClubName(away) || fx.awayClubId || 'Visitante';

        const score =
          fx.played && fx.homeGoals != null && fx.awayGoals != null
            ? `${fx.homeGoals} - ${fx.awayGoals}`
            : 'vs';

        const tr = document.createElement('tr');
        tr.dataset.fixtureId = fx.id;

        // Hora
        const tdTime = document.createElement('td');
        tdTime.textContent = getFixtureKickoffTime(fx, idx);

        // Local (escudo + nombre)
        const tdHome = document.createElement('td');
        tdHome.classList.add('club-with-coat');
        const homeCoat = getCoatImg(fx.homeClubId, homeName, 18);
        if (homeCoat) tdHome.appendChild(homeCoat);
        tdHome.appendChild(document.createTextNode(homeName));

        // Marcador
        const tdScore = document.createElement('td');
        const strong = document.createElement('strong');
        strong.textContent = score;
        tdScore.appendChild(strong);

        // Visitante (escudo + nombre)
        const tdAway = document.createElement('td');
        tdAway.classList.add('club-with-coat');
        const awayCoat = getCoatImg(fx.awayClubId, awayName, 18);
        if (awayCoat) tdAway.appendChild(awayCoat);
        tdAway.appendChild(document.createTextNode(awayName));

        // Detalle
        const tdBtn = document.createElement('td');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-xs';
        btn.dataset.fixtureId = fx.id;
        btn.textContent = 'Ver';
        tdBtn.appendChild(btn);

        tr.appendChild(tdTime);
        tr.appendChild(tdHome);
        tr.appendChild(tdScore);
        tr.appendChild(tdAway);
        tr.appendChild(tdBtn);

        fixturesBody.appendChild(tr);
      });
    }
  }

  // -----------------------------
  // Clasificación
  // -----------------------------
  if (tableBody) {
    tableBody.innerHTML = '';
    const table = Array.isArray(GameState.leagueTable) ? GameState.leagueTable : [];
    if (table.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="10">Sin clasificación aún.</td>`;
      tableBody.appendChild(tr);
    } else {
      table.forEach((row, idx) => {
        const club = clubsIndex.get(row.clubId);
        const name = (club && (club.shortName || club.name)) || row.name || row.clubId;
        const gd = (row.goalsFor || 0) - (row.goalsAgainst || 0);
        const tr = document.createElement('tr');
        const tdPos = document.createElement('td');
        tdPos.textContent = String(idx + 1);

        const tdName = document.createElement('td');
        tdName.classList.add('club-with-coat');
        const coat = getCoatImg(row.clubId, name, 18);
        if (coat) tdName.appendChild(coat);
        tdName.appendChild(document.createTextNode(name));

        tr.appendChild(tdPos);
        tr.appendChild(tdName);
        tr.innerHTML += `
          <td>${row.played || 0}</td>
          <td>${row.won || 0}</td>
          <td>${row.draw || 0}</td>
          <td>${row.lost || 0}</td>
          <td>${row.goalsFor || 0}</td>
          <td>${row.goalsAgainst || 0}</td>
          <td>${gd}</td>
          <td><strong>${row.points || 0}</strong></td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  // -----------------------------
  // Pichichi (top scorers)
  // -----------------------------
  if (topBody) {
    topBody.innerHTML = '';
    // Robusto: contar goles desde fixtures jugados
    const { goals, playerIndex } = buildGoalsIndexFromFixtures(season);
    const all = Array.from(goals.entries())
      .map(([playerId, g]) => {
        const info = playerIndex.get(playerId);
        return { playerId, goals: g, p: info?.player, club: info?.club };
      })
      .filter((x) => x.goals > 0 && x.p);

    all.sort((a, b) => b.goals - a.goals || String(a.p?.name || '').localeCompare(String(b.p?.name || '')));
    const top = all.slice(0, 15);
    if (top.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4">Aún no hay goles registrados.</td>`;
      topBody.appendChild(tr);
    } else {
      top.forEach((r, idx) => {
        const clubName = r.club?.shortName || r.club?.name || r.club?.id || '';
        const tr = document.createElement('tr');
        const tdRank = document.createElement('td');
        tdRank.textContent = String(idx + 1);

        const tdPlayer = document.createElement('td');
        tdPlayer.textContent = r.p?.name || 'Jugador';

        const tdClub = document.createElement('td');
        tdClub.classList.add('club-with-coat');
        const coat = getCoatImg(r.club?.id, clubName, 16);
        if (coat) tdClub.appendChild(coat);
        tdClub.appendChild(document.createTextNode(clubName));

        const tdGoals = document.createElement('td');
        const strong = document.createElement('strong');
        strong.textContent = String(r.goals);
        tdGoals.appendChild(strong);

        tr.appendChild(tdRank);
        tr.appendChild(tdPlayer);
        tr.appendChild(tdClub);
        tr.appendChild(tdGoals);
        topBody.appendChild(tr);
      });
    }
  }
}