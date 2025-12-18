import { GameState } from '../state.js';

// Ajusta esto a tu implementación real de coats (si ya la tienes)
import { createCoatImgElement } from './utils/coats.js';

let selectedStandingsMatchday = null;

export function setStandingsSelectedMatchday(md) {
  const n = Number(md);
  if (Number.isFinite(n) && n >= 1) selectedStandingsMatchday = n;
}

function getClubsIndex() {
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  const map = new Map();
  clubs.forEach((c) => c?.id && map.set(c.id, c));
  return map;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildGoalsIndexFromFixtures(season) {
  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  const goals = new Map(); // playerId -> goals
  const playerIndex = new Map(); // playerId -> { player, club }

  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  clubs.forEach((club) => {
    (club.players || []).forEach((p) => {
      if (!p?.id) return;
      playerIndex.set(p.id, { player: p, club });
    });
  });

  fixtures.forEach((fx) => {
    if (!fx?.played) return;
    if (fx.season != null && Number(fx.season) !== Number(season)) return;
    if (selectedStandingsMatchday != null && Number(fx.matchday || 0) > Number(selectedStandingsMatchday)) return;
    const events = Array.isArray(fx.events) ? fx.events : [];
    events.forEach((ev) => {
      if (!ev || ev.type !== 'GOAL') return;
      const pid = ev.playerId;
      if (!pid) return;
      goals.set(pid, (goals.get(pid) || 0) + 1);
    });
  });

  return { goals, playerIndex };
}

function getMaxMatchdayForSeason(season) {
  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  let max = 0;
  fixtures.forEach((fx) => {
    if (!fx) return;
    if (fx.season != null && Number(fx.season) !== Number(season)) return;
    const md = Number(fx.matchday || 0);
    if (Number.isFinite(md) && md > max) max = md;
  });
  // fallback: jornada actual si no hay fixtures aún
  const cur = Number(GameState.currentDate?.matchday || 1);
  return Math.max(max, cur, 1);
}

function getFixturesUpTo(season, matchday) {
  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  // mantenemos el orden estable por (matchday, índice original) para “últimos 5”
  return fixtures
    .map((fx, idx) => ({ fx, idx }))
    .filter(({ fx }) => {
      if (!fx?.played) return false;
      if (fx.season != null && Number(fx.season) !== Number(season)) return false;
      return Number(fx.matchday || 0) <= Number(matchday);
    })
    .sort((a, b) => {
      const amd = Number(a.fx.matchday || 0);
      const bmd = Number(b.fx.matchday || 0);
      if (amd !== bmd) return amd - bmd;
      return a.idx - b.idx;
    })
    .map(({ fx }) => fx);
}

function computeTableUpTo(season, matchday) {
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  const byClub = new Map();
  clubs.forEach((c) => {
    if (!c?.id) return;
    byClub.set(c.id, {
      clubId: c.id,
      played: 0, wins: 0, draws: 0, losses: 0,
      gf: 0, ga: 0, points: 0,
    });
  });

  const fixtures = getFixturesUpTo(season, matchday);
  fixtures.forEach((fx) => {
    const homeId = fx.homeClubId;
    const awayId = fx.awayClubId;
    if (!homeId || !awayId) return;
    if (!byClub.has(homeId)) byClub.set(homeId, { clubId: homeId, played:0,wins:0,draws:0,losses:0,gf:0,ga:0,points:0 });
    if (!byClub.has(awayId)) byClub.set(awayId, { clubId: awayId, played:0,wins:0,draws:0,losses:0,gf:0,ga:0,points:0 });

    const hg = Number(fx.homeGoals ?? 0);
    const ag = Number(fx.awayGoals ?? 0);
    const home = byClub.get(homeId);
    const away = byClub.get(awayId);

    home.played += 1; away.played += 1;
    home.gf += hg; home.ga += ag;
    away.gf += ag; away.ga += hg;

    if (hg > ag) {
      home.wins += 1; home.points += 3;
      away.losses += 1;
    } else if (hg < ag) {
      away.wins += 1; away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1; home.points += 1;
      away.draws += 1; away.points += 1;
    }
  });

  const rows = Array.from(byClub.values()).map((r) => ({
    ...r,
    dg: (r.gf ?? 0) - (r.ga ?? 0),
  }));

  const clubsIndex = getClubsIndex();
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    const an = clubsIndex.get(a.clubId)?.name || a.clubId;
    const bn = clubsIndex.get(b.clubId)?.name || b.clubId;
    return String(an).localeCompare(String(bn));
  });

  return rows;
}

function computeLastNForm(season, matchday, n = 5) {
  const fixtures = getFixturesUpTo(season, matchday);
  const forms = new Map(); // clubId -> array {res, title}
  const clubsIndex = getClubsIndex();

  function push(clubId, item) {
    if (!forms.has(clubId)) forms.set(clubId, []);
    forms.get(clubId).push(item);
  }

  fixtures.forEach((fx) => {
    const homeId = fx.homeClubId;
    const awayId = fx.awayClubId;
    const hg = Number(fx.homeGoals ?? 0);
    const ag = Number(fx.awayGoals ?? 0);
    const md = Number(fx.matchday || 0);

    const homeName = clubsIndex.get(homeId)?.shortName || clubsIndex.get(homeId)?.name || homeId;
    const awayName = clubsIndex.get(awayId)?.shortName || clubsIndex.get(awayId)?.name || awayId;

    const homeRes = hg > ag ? 'W' : hg < ag ? 'L' : 'D';
    const awayRes = hg < ag ? 'W' : hg > ag ? 'L' : 'D';

    push(homeId, { res: homeRes, title: `J${md}: ${homeName} ${hg}-${ag} ${awayName}` });
    push(awayId, { res: awayRes, title: `J${md}: ${homeName} ${hg}-${ag} ${awayName}` });
  });

  const out = new Map();
  (Array.isArray(GameState.clubs) ? GameState.clubs : []).forEach((c) => {
    if (!c?.id) return;
    const arr = forms.get(c.id) || [];
    const last = arr.slice(-n);
    // pad
    while (last.length < n) last.unshift({ res: null, title: '' });
    out.set(c.id, last);
  });
  return out;
}

export function initStandingsUI() {
  const season = Number(GameState.currentDate?.season || 1);
  const maxMd = getMaxMatchdayForSeason(season);
  const select = document.getElementById('standings-matchday-select');
  const prevBtn = document.getElementById('standings-md-prev');
  const nextBtn = document.getElementById('standings-md-next');

  const curMd = Number(GameState.currentDate?.matchday || 1);
  // Si no hay selección, arrancamos en la jornada actual
  if (selectedStandingsMatchday == null || selectedStandingsMatchday > maxMd) selectedStandingsMatchday = curMd;


  if (select) {
    select.innerHTML = '';
    for (let md = 1; md <= maxMd; md += 1) {
      const opt = document.createElement('option');
      opt.value = String(md);
      opt.textContent = String(md);
      select.appendChild(opt);
    }
    select.value = String(Math.min(Math.max(1, selectedStandingsMatchday), maxMd));
    select.addEventListener('change', () => {
      const md = Number.parseInt(select.value, 10);
      if (Number.isFinite(md) && md >= 1) {
        selectedStandingsMatchday = md;
        updateStandingsView();
      }
    });
  }

  prevBtn?.addEventListener('click', () => {
    const cur = Number(selectedStandingsMatchday || 1);
    selectedStandingsMatchday = Math.max(1, cur - 1);
    if (select) select.value = String(selectedStandingsMatchday);
    updateStandingsView();
  });

  nextBtn?.addEventListener('click', () => {
    const cur = Number(selectedStandingsMatchday || 1);
    selectedStandingsMatchday = Math.min(maxMd, cur + 1);
    if (select) select.value = String(selectedStandingsMatchday);
    updateStandingsView();
  });
}

export function updateStandingsView() {
  // Soporta tanto vista dedicada como la tabla actual dentro de Competición
  const tableBody =
    document.getElementById('standings-table-body') ||
    document.getElementById('competition-table-body');
  const topBody =
    document.getElementById('standings-topscorers-body') ||
    document.getElementById('competition-topscorers-body');
  const clubsIndex = getClubsIndex();
  
  const season = Number(GameState.currentDate?.season || 1);
  const maxMd = getMaxMatchdayForSeason(season);
  if (selectedStandingsMatchday == null) {
    selectedStandingsMatchday = Number(GameState.currentDate?.matchday || 1);
  }
  selectedStandingsMatchday = Math.min(Math.max(1, selectedStandingsMatchday), maxMd);
  
  // Label: "Jornada X (actual)"
  const curMd = Number(GameState.currentDate?.matchday || 1);
  const mdLabelEl = document.getElementById('standings-md-label');
  if (mdLabelEl) {
    mdLabelEl.textContent =
      `Jornada ${selectedStandingsMatchday}` + (selectedStandingsMatchday === curMd ? ' (actual)' : '');
  }

  // mantener el select sincronizado si existe
  const select = document.getElementById('standings-matchday-select');
  if (select && select.value !== String(selectedStandingsMatchday)) {
    select.value = String(selectedStandingsMatchday);
  }

  const table = computeTableUpTo(season, selectedStandingsMatchday);
  const formMap = computeLastNForm(season, selectedStandingsMatchday, 5);

  // Tabla liga
  if (tableBody) {
    tableBody.innerHTML = '';
    if (table.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="11">Sin clasificación aún.</td>`;
      tableBody.appendChild(tr);
    } else {
      table.forEach((row, idx) => {
        const club = clubsIndex.get(row.clubId);
        // En la tabla queremos nombre COMPLETO
        const name = club?.name || club?.shortName || row.clubId || 'Equipo';
        const tr = document.createElement('tr');

        const coat = createCoatImgElement(row.clubId, name, 18);
        const teamCell = document.createElement('td');
        teamCell.className = 'club-with-coat';
        if (coat) teamCell.appendChild(coat);
        const span = document.createElement('span');
        span.textContent = name;
        teamCell.appendChild(span);

        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td></td>
          <td>${row.played ?? 0}</td>
          <td>${row.wins ?? 0}</td>
          <td>${row.draws ?? 0}</td>
          <td>${row.losses ?? 0}</td>
          <td>${row.gf ?? 0}</td>
          <td>${row.ga ?? 0}</td>
          <td>${(row.gf ?? 0) - (row.ga ?? 0)}</td>
          <td><strong>${row.points ?? 0}</strong></td>
		  <td></td>
        `;
        tr.children[1].replaceWith(teamCell);
		
        // Últimos 5
        const formTd = document.createElement('td');
        const wrap = document.createElement('div');
        wrap.className = 'form-dots';
        const last5 = formMap.get(row.clubId) || [];
        last5.forEach((it) => {
          const dot = document.createElement('span');
          const res = it?.res;
          dot.className =
            'form-dot ' +
            (res === 'W' ? 'win' : res === 'D' ? 'draw' : res === 'L' ? 'loss' : 'empty');
          dot.title = it?.title || '';
          dot.textContent = res === 'W' ? '✓' : res === 'D' ? '–' : res === 'L' ? '✕' : '';
          wrap.appendChild(dot);
        });
        formTd.appendChild(wrap);
        tr.lastElementChild.replaceWith(formTd);
		
        tableBody.appendChild(tr);
      });
    }
  }

  // Pichichi
  if (topBody) {
    topBody.innerHTML = '';
    const { goals, playerIndex } = buildGoalsIndexFromFixtures(season);

    const all = Array.from(goals.entries())
      .map(([playerId, g]) => {
        const info = playerIndex.get(playerId);
        return { playerId, goals: g, p: info?.player, club: info?.club };
      })
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);

    if (all.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4">Sin goles aún.</td>`;
      topBody.appendChild(tr);
    } else {
      all.forEach((it, idx) => {
        const tr = document.createElement('tr');
        const pName = it.p?.name || String(it.playerId);
        // En pichichi: abreviatura + escudo
        const clubId = it.club?.id || it.club?.clubId || it.club?.slug || it.club?.key || it.club?.name || '-';
        const clubAbbr = it.club?.shortName || it.club?.abbr || it.club?.name || it.club?.id || '-';

        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td title="${escapeHtml(pName)}">${escapeHtml(pName)}</td>
          <td></td>
          <td><strong>${it.goals}</strong></td>
        `;

        const tdClub = document.createElement('td');
        tdClub.className = 'club-with-coat';
        const coat = it.club?.id ? createCoatImgElement(it.club.id, clubAbbr, 18) : null;
        if (coat) tdClub.appendChild(coat);
        const span = document.createElement('span');
        span.textContent = clubAbbr;
        tdClub.appendChild(span);
        tr.children[2].replaceWith(tdClub);
        topBody.appendChild(tr);
      });
    }
  }
}