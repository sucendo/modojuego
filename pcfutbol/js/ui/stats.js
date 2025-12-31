// js/ui/stats.js
// Vista "Estadísticas":
// - 1 select de competición (incluye "Todas")
// - Toggle Jugadores / Equipo (segmented)
// - Select de equipo dependiente de competición (Mi equipo / Todos / equipos del scope)
// - Detalle INLINE debajo de la fila seleccionada (con escudos)
// - Recupera stats multi-liga desde fixtures (playerStatsById / teamStats)

import { GameState } from '../state.js';
import {
  getCompetitions,
  getCompetitionById,
  getDefaultCompetitionId,
  buildClubIndex,
  getUserClubId,
} from './utils/competitions.js';
import { getGameDateFor, formatGameDateLabel } from './utils/calendar.js';
import { createCoatImgElement } from './utils/coats.js';
import { buildMatchTimelineHTML } from './utils/matchTimeline.js';

const ALL_COMP = '__all__';
const MY_CLUB = '__my__';
const ALL_CLUBS = '__all__'; // "Todos" dentro del scope (comp seleccionada o todas)

let __bound = false;

let __selectedCompetitionId = null; // compId o "__all__"
let __mode = 'players'; // 'players' | 'team'
let __selectedClubKey = MY_CLUB; // "__my__" | "__all__" | "clubId" | "compId::clubId"

let __expandedPlayerKey = null; // "compId::clubId::playerId"
let __expandedTeamKey = null; // "compId::clubId" (cuando mostramos lista de equipos)
let __expandedTeamFixtureKey = null; // "compId::fixtureId" (cuando mostramos lista de partidos)

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getElAny(...ids) {
  for (const id of ids) {
    if (!id) continue;
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function getTbodyPlayers() {
  return getElAny('stats-players-body', 'stats-players-tbody');
}

function getTbodyTeamMatches() {
  return getElAny('stats-team-matches-body', 'stats-team-matches-tbody');
}

function getPaneTeams() {
  return getElAny('stats-pane-team', 'stats-pane-teams');
}

function n0(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : '0';
}

function fmt1(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(1) : '0.0';
}

function fmtPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0%';
  return `${n.toFixed(0)}%`;
}

function getAllCompetitions() {
  const comps = getCompetitions();
  return Array.isArray(comps) ? comps : [];
}

function getSelectedCompetitionOrNull() {
  if (!__selectedCompetitionId) __selectedCompetitionId = getDefaultCompetitionId();
  if (__selectedCompetitionId === ALL_COMP) return null;
  return getCompetitionById(__selectedCompetitionId) || null;
}

function getScopeCompetitions() {
  const sel = getSelectedCompetitionOrNull();
  if (sel) return [sel];
  return getAllCompetitions();
}

function getSeasonForComp(comp) {
  const season = Number(comp?.currentDate?.season ?? GameState.currentDate?.season ?? 1);
  return Number.isFinite(season) && season >= 1 ? season : 1;
}

function getCurrentMatchdayForComp(comp) {
  const md = Number(comp?.currentDate?.matchday ?? GameState.currentDate?.matchday ?? 1);
  return Number.isFinite(md) && md >= 1 ? md : 1;
}

function parseClubKey(key) {
  const k = String(key || MY_CLUB);
  if (k === MY_CLUB) return { kind: 'my' };
  if (k === ALL_CLUBS) return { kind: 'all' };
  const parts = k.split('::');
  if (parts.length === 2) return { kind: 'club', compId: parts[0], clubId: parts[1] };
  // si no hay compId, lo interpretamos como clubId dentro de la comp seleccionada
  return { kind: 'club_in_selected_comp', clubId: k };
}

function getUserClubIdAcrossCompetitions() {
  const comps = getAllCompetitions();
  for (const c of comps) {
    const id = getUserClubId(c);
    if (id) return id;
  }
  // fallback: en la comp por defecto
  const def = getCompetitionById(getDefaultCompetitionId());
  return getUserClubId(def);
}

function makeClubInline(clubId, label, size = 18) {
  const wrap = document.createElement('span');
  wrap.className = 'club-with-coat';
  const img = createCoatImgElement(clubId, label, size);
  if (img) wrap.appendChild(img);
  const span = document.createElement('span');
  span.textContent = label || clubId || '';
  wrap.appendChild(span);
  return wrap;
}

function buildCompetitionSelectOptions(sel) {
  const comps = getAllCompetitions();
  if (!__selectedCompetitionId) __selectedCompetitionId = getDefaultCompetitionId();

  const options = [];
  options.push(
    `<option value="${ALL_COMP}"${
      __selectedCompetitionId === ALL_COMP ? ' selected' : ''
    }>Todas las competiciones</option>`
  );

  comps.forEach((c) => {
    const id = String(c.id);
    options.push(
      `<option value="${esc(id)}"${
        id === String(__selectedCompetitionId) ? ' selected' : ''
      }>${esc(c.name || c.id)}</option>`
    );
  });

  sel.innerHTML = options.join('');
}

function buildClubSelectOptions(sel) {
  const scopeComps = getScopeCompetitions();
  const selectedComp = getSelectedCompetitionOrNull();

  const opts = [];
  opts.push(
    `<option value="${MY_CLUB}"${String(__selectedClubKey) === MY_CLUB ? ' selected' : ''}>Mi equipo</option>`
  );

  // "Todos" dentro del scope actual
  const allLabel = selectedComp
    ? `Todos (en ${selectedComp.name || selectedComp.id})`
    : 'Todos (todas las competiciones)';
  opts.push(
    `<option value="${ALL_CLUBS}"${
      String(__selectedClubKey) === ALL_CLUBS ? ' selected' : ''
    }>${esc(allLabel)}</option>`
  );

  if (selectedComp) {
    const clubs = Array.isArray(selectedComp.clubs) ? selectedComp.clubs : [];
    clubs.forEach((club) => {
      const val = String(club.id);
      const label = club.shortName || club.abbr || club.name || club.id;
      opts.push(
        `<option value="${esc(val)}"${
          String(__selectedClubKey) === String(val) ? ' selected' : ''
        }>${esc(label)}</option>`
      );
    });
  } else {
    // Todas: optgroups por competición
    scopeComps.forEach((c) => {
      const cid = String(c.id);
      const clubs = Array.isArray(c.clubs) ? c.clubs : [];
      if (!clubs.length) return;
      opts.push(`<optgroup label="${esc(c.name || cid)}">`);
      clubs.forEach((club) => {
        const val = `${cid}::${club.id}`;
        const label = club.shortName || club.abbr || club.name || club.id;
        opts.push(
          `<option value="${esc(val)}"${
            String(__selectedClubKey) === String(val) ? ' selected' : ''
          }>${esc(label)}</option>`
        );
      });
      opts.push(`</optgroup>`);
    });
  }

  sel.innerHTML = opts.join('');
}

function resolveSelectedTeamsFromClubKey() {
  const scopeComps = getScopeCompetitions();
  const parsed = parseClubKey(__selectedClubKey);

  // Devuelve lista de { comp, clubId, club, clubIndex }
  if (parsed.kind === 'my') {
    const list = [];
    for (const comp of scopeComps) {
      const myId = getUserClubId(comp);
      if (!myId) continue;
      const idx = buildClubIndex(comp.clubs || []);
      list.push({ comp, clubId: String(myId), club: idx.get(String(myId)) || null, clubIndex: idx });
    }
    // Si no se ha encontrado en ninguna (por seguridad), intenta en default
    if (!list.length) {
      const def = getCompetitionById(getDefaultCompetitionId());
      if (def) {
        const myId = getUserClubId(def);
        const idx = buildClubIndex(def.clubs || []);
        if (myId) list.push({ comp: def, clubId: String(myId), club: idx.get(String(myId)) || null, clubIndex: idx });
      }
    }
    return list;
  }

  if (parsed.kind === 'all') {
    // "Todos": no devolvemos equipos concretos, se usa para listar agregados
    return [];
  }

  if (parsed.kind === 'club') {
    const comp = getCompetitionById(parsed.compId);
    if (!comp) return [];
    const idx = buildClubIndex(comp.clubs || []);
    return [{ comp, clubId: String(parsed.clubId), club: idx.get(String(parsed.clubId)) || null, clubIndex: idx }];
  }

  // club_in_selected_comp
  const selectedComp = getSelectedCompetitionOrNull();
  if (!selectedComp) return [];
  const idx = buildClubIndex(selectedComp.clubs || []);
  return [{ comp: selectedComp, clubId: String(parsed.clubId), club: idx.get(String(parsed.clubId)) || null, clubIndex: idx }];
}

function ensureStatsDOM() {
  const root = document.getElementById('view-stats');
  if (!root) return;

  // 1) Select competición: reutiliza el existente del modo antiguo si hace falta
  const selComp =
    document.getElementById('stats-competition-select') ||
    document.getElementById('stats-adv-competition-select');

  if (!selComp) return;

  // 2) Header right: inyectar segmented + select club si no existen
  const headerRight = root.querySelector('.competition-header-right') || selComp.closest('.competition-header-right');
  if (headerRight) {
    // Segmented (Jugadores/Equipo)
    if (!document.getElementById('stats-mode-players') && !document.getElementById('stats-mode-team')) {
      const seg = document.createElement('div');
      seg.className = 'segmented';
      seg.setAttribute('role', 'tablist');
      seg.setAttribute('aria-label', 'Modo estadísticas');
      seg.innerHTML = `
        <button id="stats-mode-players" class="segmented__btn is-active" type="button">Jugadores</button>
        <button id="stats-mode-team" class="segmented__btn" type="button">Equipo</button>
      `;
      headerRight.appendChild(seg);
    }

    // Select club dependiente
    if (!document.getElementById('stats-club-select')) {
      const lab = document.createElement('label');
      lab.className = 'competition-matchday-select';
      lab.innerHTML = `
        Equipo:
        <select id="stats-club-select"></select>
      `;
      headerRight.appendChild(lab);
    }
  }

  // 3) Meta: añade jornada si no existe
  const meta = root.querySelector('.competition-meta');
  if (meta && !document.getElementById('stats-adv-current-md') && !document.getElementById('stats-current-md')) {
    const span = document.createElement('span');
    span.innerHTML = ` · Jornada <span id="stats-adv-current-md">1</span>`;
    meta.appendChild(span);
  }

  // 4) Panes: crea card Jugadores si no existe
  let panePlayers = document.getElementById('stats-pane-players');
  let paneTeam = getPaneTeams();
  if (paneTeam && paneTeam.id === 'stats-pane-teams') paneTeam.id = 'stats-pane-team';
 

  // El segundo article.card (si existe) lo usamos como paneTeam
  if (!paneTeam) {
    const cards = Array.from(root.querySelectorAll('article.card'));
    if (cards.length >= 2) {
      paneTeam = cards[1];
      paneTeam.id = 'stats-pane-team';
    }
  }

  if (!panePlayers) {
    panePlayers = document.createElement('article');
    panePlayers.className = 'card';
    panePlayers.id = 'stats-pane-players';
    panePlayers.innerHTML = `
      <h3>Jugadores</h3>
      <p class="muted" style="margin-top:-6px;">Click en un jugador para ver el detalle (inline).</p>
      <div class="competition-fixtures-wrapper">
        <table class="table table-competition table-stats-adv">
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Club</th>
              <th>Pos</th>
              <th>PJ</th>
              <th>Min</th>
              <th>G</th>
              <th>A</th>
              <th>TA</th>
              <th>TR</th>
              <th>% Pase</th>
              <th>Pases</th>
              <th>Dist</th>
              <th>VMax</th>
              <th>Tiros</th>
              <th>Rec</th>
              <th>Entr</th>
            </tr>
          </thead>
          <tbody id="stats-players-body"></tbody>
        </table>
      </div>
    `;

    // Insertar justo antes del paneTeam (si existe), si no al final
    if (paneTeam && paneTeam.parentNode) paneTeam.parentNode.insertBefore(panePlayers, paneTeam);
    else root.appendChild(panePlayers);
  }

  // Si el paneTeam no existe, lo creamos (por si acaso)
  if (!paneTeam) {
    paneTeam = document.createElement('article');
    paneTeam.className = 'card';
    paneTeam.id = 'stats-pane-team';
    root.appendChild(paneTeam);
  }
}

function computeAdvancedAggFromSt(agg, st) {
  // Normaliza nombres que pueden variar
  const yellows = n0(st?.yellows ?? st?.yellowCards ?? 0);
  const reds = n0(st?.reds ?? st?.redCards ?? 0);

  agg.apps += n0(st?.minutes) > 0 ? 1 : 0;
  agg.minutes += n0(st?.minutes);
  agg.goals += n0(st?.goals);
  agg.assists += n0(st?.assists);
  agg.yellows += yellows;
  agg.reds += reds;

  agg.passesCompleted += n0(st?.passesCompleted);
  agg.passesAttempted += n0(st?.passesAttempted);

  agg.distanceKm += n0(st?.distanceKm);
  agg.maxSpeedKmh = Math.max(agg.maxSpeedKmh, n0(st?.maxSpeedKmh));

  agg.shotsTotal += n0(st?.shotsTotal);
  agg.shotsOnTarget += n0(st?.shotsOnTarget);

  agg.recoveries += n0(st?.recoveries);
  agg.tacklesWon += n0(st?.tacklesWon);
  agg.tacklesLost += n0(st?.tacklesLost);

  return agg;
}

function buildPlayerRows() {
  const scopeComps = getScopeCompetitions();
  const parsed = parseClubKey(__selectedClubKey);
  
  // Resolver clubId cuando playerStatsById no lo incluya
  function inferClubIdForPlayer(comp, fx, pid) {
    const id = String(pid);
    // 1) Por alineaciones/banquillo del fixture (lo más fiable)
    const inArr = (arr) => Array.isArray(arr) && arr.some((x) => String(x) === id);
    if (inArr(fx?.homeLineupIds) || inArr(fx?.homeBenchIds)) return String(fx.homeClubId);
    if (inArr(fx?.awayLineupIds) || inArr(fx?.awayBenchIds)) return String(fx.awayClubId);

    // 2) Fallback: buscar el jugador dentro de los clubs de la competición
    const clubs = Array.isArray(comp?.clubs) ? comp.clubs : [];
    for (const c of clubs) {
      const players = Array.isArray(c?.players) ? c.players : [];
      if (players.some((p) => String(p?.id) === id)) return String(c.id);
    }
    return '';
  }

  const allowedByComp = new Map(); // compId -> Set(clubId) o null (todos)
  if (parsed.kind === 'all') {
    // todos los clubes del scope
    scopeComps.forEach((c) => allowedByComp.set(String(c.id), null));
  } else if (parsed.kind === 'my') {
    scopeComps.forEach((c) => {
      const myId = getUserClubId(c);
      if (myId) allowedByComp.set(String(c.id), new Set([String(myId)]));
    });
  } else if (parsed.kind === 'club') {
    allowedByComp.set(String(parsed.compId), new Set([String(parsed.clubId)]));
  } else if (parsed.kind === 'club_in_selected_comp') {
    const sel = getSelectedCompetitionOrNull();
    if (sel) allowedByComp.set(String(sel.id), new Set([String(parsed.clubId)]));
  }

  const rowsByKey = new Map(); // playerKey -> row

  for (const comp of scopeComps) {
    const compId = String(comp.id);
    if (!allowedByComp.has(compId)) continue;

    const season = getSeasonForComp(comp);
    const clubIndex = buildClubIndex(comp.clubs || []);
    const allowedSet = allowedByComp.get(compId); // null => todos

    const fixtures = Array.isArray(comp.fixtures) ? comp.fixtures : [];
    fixtures
      .filter((fx) => fx?.played)
      .filter((fx) => (fx.season == null ? true : Number(fx.season) === Number(season)))
      .forEach((fx) => {
        const pstats = fx?.playerStatsById || null;
        if (!pstats) return;

        if (!fx.played) return;

        Object.entries(pstats).forEach(([pid, st0]) => {
          const st = st0 || {};
          let clubId = String(st.clubId ?? '');
          if (!clubId) clubId = inferClubIdForPlayer(comp, fx, pid);
          if (!clubId) return; // si no se puede inferir, se descarta

          // IMPORTANTE: normalizamos para que el render siempre tenga clubId dentro del stat
          // (así computeAdvancedAggFromSt y entries funcionan igual)
          st.clubId = clubId;

          if (allowedSet && !allowedSet.has(clubId)) return;

          const key = `${compId}::${clubId}::${pid}`;
          let row = rowsByKey.get(key);
          if (!row) {
            const club = clubIndex.get(clubId) || null;
            const players = (club?.players || []);
            const playerObj = players.find((p) => String(p?.id) === String(pid)) || null;

            row = {
              compId,
              compName: comp.name || comp.id,
              clubId,
              club,
              playerId: String(pid),
              player: playerObj || {
                id: String(pid),
                name: st.playerName || st.name || String(pid),
                position: st.position || st.pos || '',
              },
              agg: {
                apps: 0,
                minutes: 0,
                goals: 0,
                assists: 0,
                yellows: 0,
                reds: 0,
                passesCompleted: 0,
                passesAttempted: 0,
                distanceKm: 0,
                maxSpeedKmh: 0,
                shotsTotal: 0,
                shotsOnTarget: 0,
                recoveries: 0,
                tacklesWon: 0,
                tacklesLost: 0,
              },
              entries: [],
            };
            rowsByKey.set(key, row);
          }

          computeAdvancedAggFromSt(row.agg, st);

          const isHome = String(fx.homeClubId) === clubId;
          const oppId = isHome ? String(fx.awayClubId) : String(fx.homeClubId);
          const opp = clubIndex.get(oppId) || null;

          row.entries.push({
            compId,
            compName: comp.name || comp.id,
            fixtureId: String(fx.id),
            matchday: n0(fx.matchday),
            isHome,
            opponentId: oppId,
            opponentName: opp?.shortName || opp?.abbr || opp?.name || oppId,
            minutes: n0(st.minutes),
            goals: n0(st.goals),
            assists: n0(st.assists),
            yellows: n0(st.yellows ?? st.yellowCards),
            reds: n0(st.reds ?? st.redCards),
            passesCompleted: n0(st.passesCompleted),
            passesAttempted: n0(st.passesAttempted),
            distanceKm: n0(st.distanceKm),
            maxSpeedKmh: n0(st.maxSpeedKmh),
            shotsTotal: n0(st.shotsTotal),
            shotsOnTarget: n0(st.shotsOnTarget),
            recoveries: n0(st.recoveries),
            tacklesWon: n0(st.tacklesWon),
            tacklesLost: n0(st.tacklesLost),
          });
        });
      });
  }

  const rows = Array.from(rowsByKey.values());

  // Orden: goles desc, luego minutos desc (para evitar 0-minutos arriba), luego nombre
  rows.sort((a, b) => {
    const g = n0(b.agg.goals) - n0(a.agg.goals);
    if (g !== 0) return g;
    const m = n0(b.agg.minutes) - n0(a.agg.minutes);
    if (m !== 0) return m;
    return String(a.player?.name || '').localeCompare(String(b.player?.name || ''), 'es', { sensitivity: 'base' });
  });

  return rows;
}

function renderPlayersTable() {
  const tbody = getTbodyPlayers();
  if (!tbody) return;
  
  const table = tbody.closest('table');
  const thCount = table ? table.querySelectorAll('thead th').length : 17;
  const compact = thCount <= 11;

  const rows = buildPlayerRows();
  tbody.innerHTML = '';

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${compact ? 11 : 17}">Sin datos.</td></tr>`;
    return;
  }

  rows.forEach((r, idx) => {
    const p = r.player;
    const a = r.agg;

    const passPct = a.passesAttempted > 0 ? fmtPct((a.passesCompleted / a.passesAttempted) * 100) : '—';
    const passes = a.passesAttempted > 0 ? `${fmtNum(a.passesCompleted)}/${fmtNum(a.passesAttempted)}` : '—';
    const dist = a.distanceKm > 0 ? fmt1(a.distanceKm) : '—';
    const vmax = a.maxSpeedKmh > 0 ? fmt1(a.maxSpeedKmh) : '—';
    const shots = a.shotsTotal > 0 ? `${fmtNum(a.shotsTotal)}/${fmtNum(a.shotsOnTarget)}` : '—';
    const tks = (a.tacklesWon + a.tacklesLost) > 0 ? `${fmtNum(a.tacklesWon)}/${fmtNum(a.tacklesLost)}` : '—';
    const rec = a.recoveries > 0 ? fmtNum(a.recoveries) : '—';

    const playerKey = `${r.compId}::${r.clubId}::${r.playerId}`;
    const isExpanded = __expandedPlayerKey && String(__expandedPlayerKey) === String(playerKey);
 
    const tr = document.createElement('tr');
    tr.className = 'stats-row-clickable';
    tr.setAttribute('data-player-key', playerKey);

    if (compact) {
      tr.innerHTML = `
        <td>${esc(p?.name || 'Jugador')}</td>
        <td></td>
        <td>${fmtNum(a.apps)}</td>
        <td>${fmtNum(a.minutes)}</td>
        <td><strong>${fmtNum(a.goals)}</strong></td>
        <td>${fmtNum(a.assists)}</td>
        <td>${fmtNum(a.yellows)}</td>
        <td>${fmtNum(a.reds)}</td>
        <td>${esc(passPct)}</td>
        <td>${esc(dist)}</td>
        <td>${esc(vmax)}</td>
      `;

      const tdClub = tr.children[1];
      tdClub.innerHTML = '';
      const clubLabel = r.club?.shortName || r.club?.abbr || r.club?.name || r.clubId;
      tdClub.appendChild(makeClubInline(r.clubId, clubLabel, 18));
    } else {
      tr.classList.add('stats-row-clickable');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${esc(p?.name || 'Jugador')}</td>
        <td></td>
        <td>${esc((p?.pos || p?.position || '').toUpperCase() || '-')}</td>
        <td>${fmtNum(a.apps)}</td>
        <td>${fmtNum(a.minutes)}</td>
        <td><strong>${fmtNum(a.goals)}</strong></td>
        <td>${fmtNum(a.assists)}</td>
        <td>${fmtNum(a.yellows)}</td>
        <td>${fmtNum(a.reds)}</td>
        <td>${esc(passPct)}</td>
        <td>${esc(passes)}</td>
        <td>${esc(dist)}</td>
        <td>${esc(vmax)}</td>
        <td>${esc(shots)}</td>
        <td>${esc(rec)}</td>
        <td>${esc(tks)}</td>
      `;

      const tdClub = tr.children[2];
      tdClub.innerHTML = '';
      const clubLabel = r.club?.shortName || r.club?.abbr || r.club?.name || r.clubId;
      tdClub.appendChild(makeClubInline(r.clubId, clubLabel, 18));
    }

    tbody.appendChild(tr);

    if (__expandedPlayerKey && String(__expandedPlayerKey) === String(playerKey)) {
      const detailTr = document.createElement('tr');
      detailTr.className = 'stats-detail-row';
      const td = document.createElement('td');
      td.colSpan = thCount;
      td.innerHTML = renderPlayerInlineDetail(r);
      detailTr.appendChild(td);
      tbody.appendChild(detailTr);
    }
  });
}

function renderPlayerInlineDetail(row) {
  const p = row.player;
  const a = row.agg;

  const entries = Array.isArray(row.entries) ? row.entries.slice() : [];
  entries.sort((x, y) => n0(x.matchday) - n0(y.matchday));

  const passKpi = a.passesAttempted > 0 ? fmtPct((a.passesCompleted / a.passesAttempted) * 100) : '—';
  const passesKpi = a.passesAttempted > 0 ? `${fmtNum(a.passesCompleted)}/${fmtNum(a.passesAttempted)}` : '—';
  const distKpi = a.distanceKm > 0 ? `${fmt1(a.distanceKm)} km` : '—';
  const vmaxKpi = a.maxSpeedKmh > 0 ? `${fmt1(a.maxSpeedKmh)} km/h` : '—';
  const shotsKpi = a.shotsTotal > 0 ? `${fmtNum(a.shotsTotal)} (${fmtNum(a.shotsOnTarget)} a puerta)` : '—';

  const clubLabel = row.club?.name || row.club?.shortName || row.clubId;
  const compLabel = (getSelectedCompetitionOrNull() ? '' : ` • ${row.compName}`);

  const kpi = (label, value) => `
    <div class="stats-kpi">
      <div class="stats-kpi__label">${esc(label)}</div>
      <div class="stats-kpi__value">${esc(value)}</div>
    </div>`;

  const rowsHtml = entries.length
    ? entries
        .map((e) => {
          const cond = e.isHome ? 'C' : 'F';
          return `
            <tr>
              <td>${fmtNum(e.matchday)}</td>
              <td>${esc(e.opponentName || e.opponentId || 'Rival')}</td>
              <td>${esc(cond)}</td>
              <td>${fmtNum(e.minutes)}</td>
              <td>${fmtNum(e.goals)}</td>
              <td>${fmtNum(e.assists)}</td>
              <td>${fmtNum(e.yellows)}</td>
              <td>${fmtNum(e.reds)}</td>
              <td>${e.passesAttempted > 0 ? fmtPct((e.passesCompleted / e.passesAttempted) * 100) : '—'}</td>
              <td>${e.passesAttempted > 0 ? `${fmtNum(e.passesCompleted)}/${fmtNum(e.passesAttempted)}` : '—'}</td>
              <td>${e.distanceKm > 0 ? fmt1(e.distanceKm) : '—'}</td>
              <td>${e.maxSpeedKmh > 0 ? fmt1(e.maxSpeedKmh) : '—'}</td>
              <td>${e.shotsTotal > 0 ? `${fmtNum(e.shotsTotal)}/${fmtNum(e.shotsOnTarget)}` : '—'}</td>
              <td>${e.recoveries > 0 ? fmtNum(e.recoveries) : '—'}</td>
              <td>${(e.tacklesWon + e.tacklesLost) > 0 ? `${fmtNum(e.tacklesWon)}/${fmtNum(e.tacklesLost)}` : '—'}</td>
            </tr>
          `;
        })
        .join('')
    : `<tr><td colspan="15">Sin partidos.</td></tr>`;

  return `
    <div class="stats-inline-detail">
      <div class="stats-inline-head">
        <div class="stats-inline-title">
          <strong>${esc(p?.name || 'Jugador')}</strong>
          <span class="muted">(${esc((p?.pos || p?.position || '').toUpperCase() || '-')})</span>
        </div>
        <div class="stats-inline-sub">
          <span class="club-with-coat">
            ${createCoatImgElement(row.clubId, clubLabel, 18)?.outerHTML || ''}
            <span>${esc(clubLabel)}</span>
          </span>
          <span class="muted">${esc(compLabel)}</span>
        </div>
      </div>

      <div class="stats-kpis">
        ${kpi('PJ', fmtNum(a.apps))}
        ${kpi('Min', fmtNum(a.minutes))}
        ${kpi('Goles', fmtNum(a.goals))}
        ${kpi('Asist', fmtNum(a.assists))}
        ${kpi('% Pase', passKpi)}
        ${kpi('Pases', passesKpi)}
        ${kpi('Dist', distKpi)}
        ${kpi('V máx', vmaxKpi)}
        ${kpi('Tiros', shotsKpi)}
        ${kpi('Recup.', fmtNum(a.recoveries))}
        ${kpi('Entradas', (a.tacklesWon + a.tacklesLost) > 0 ? `${fmtNum(a.tacklesWon)}/${fmtNum(a.tacklesLost)}` : '—')}
        ${kpi('Tarjetas', `${fmtNum(a.yellows)}/${fmtNum(a.reds)}`)}
      </div>

      <div class="table-wrap">
        <table class="table table-compact">
          <thead>
            <tr>
              <th>Jor</th>
              <th>Rival</th>
              <th>Cond</th>
              <th>Min</th>
              <th>G</th>
              <th>A</th>
              <th>TA</th>
              <th>TR</th>
              <th>% Pase</th>
              <th>Pases</th>
              <th>Dist</th>
              <th>VMax</th>
              <th>Tiros</th>
              <th>Rec</th>
              <th>Entr</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getFixtureSideStats(fx, clubId) {
  if (!fx?.teamStats) return null;
  if (String(fx.homeClubId) === String(clubId)) return fx.teamStats.home || null;
  if (String(fx.awayClubId) === String(clubId)) return fx.teamStats.away || null;
  return null;
}

function renderTeamPane() {
  const pane = document.getElementById('stats-pane-team');
  if (!pane) return;

  const parsed = parseClubKey(__selectedClubKey);
  
  // Si el HTML ya trae la tabla (layout nuevo), no reescribimos el pane, solo pintamos el tbody.
  const hasExistingMatches = !!getTbodyTeamMatches();
  const hasExistingTeamsAgg = !!document.getElementById('stats-teams-body');

  if (parsed.kind !== 'all' && hasExistingMatches) {
    renderTeamMatchesTable();
    return;
  }

  if (parsed.kind === 'all' && hasExistingTeamsAgg) {
    renderTeamsAggregateTable();
    return;
  }

  // Fallback (layout antiguo): inyectamos tablas dentro del pane.

  // Si es "Todos", mostramos lista de equipos (agregada)
  if (parsed.kind === 'all') {
    pane.innerHTML = `
      <h3>Equipos</h3>
      <p class="muted" style="margin-top:-6px;">Click en un equipo para ver detalle (inline).</p>
      <div class="competition-fixtures-wrapper">
        <table class="table table-competition table-stats-adv">
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              ${getSelectedCompetitionOrNull() ? '' : '<th>Comp</th>'}
              <th>PJ</th>
              <th>GF</th>
              <th>GC</th>
              <th>Pos (avg)</th>
              <th>Pase (avg)</th>
              <th>Tiros (avg)</th>
              <th>Dist (avg)</th>
              <th>Tar</th>
            </tr>
          </thead>
          <tbody id="stats-teams-body"></tbody>
        </table>
      </div>
    `;
    renderTeamsAggregateTable();
    return;
  }

  // Si no es "Todos", mostramos partidos del equipo seleccionado
  pane.innerHTML = `
    <h3>Partidos</h3>
    <p class="muted" style="margin-top:-6px;">Click en un partido para ver detalle (inline).</p>
    <div class="competition-fixtures-wrapper">
      <table class="table table-competition table-stats-adv">
        <thead>
          <tr>
            ${getSelectedCompetitionOrNull() ? '' : '<th>Comp</th>'}
            <th>Jor</th>
            <th>Fecha</th>
            <th>Rival</th>
            <th>Marcador</th>
            <th>Pos</th>
            <th>Disparos</th>
            <th>Pases</th>
            <th>Dist (km)</th>
            <th>Tar</th>
          </tr>
        </thead>
        <tbody id="stats-team-matches-body"></tbody>
      </table>
    </div>
  `;
  renderTeamMatchesTable();
}

function renderTeamsAggregateTable() {
  const tbody = document.getElementById('stats-teams-body');
  if (!tbody) return;

  const scopeComps = getScopeCompetitions();
  const selComp = getSelectedCompetitionOrNull();
  const showCompCol = !selComp;

  // Aggregate por equipo
  const map = new Map(); // key compId::clubId -> agg

  for (const comp of scopeComps) {
    const compId = String(comp.id);
    const season = getSeasonForComp(comp);
    const clubs = Array.isArray(comp.clubs) ? comp.clubs : [];
    const idx = buildClubIndex(clubs);
    const fixtures = Array.isArray(comp.fixtures) ? comp.fixtures : [];

    // init
    clubs.forEach((c) => {
      const k = `${compId}::${c.id}`;
      if (!map.has(k)) {
        map.set(k, {
          compId,
          compName: comp.name || comp.id,
          clubId: String(c.id),
          club: c,
          played: 0,
          gf: 0,
          ga: 0,
          posSum: 0,
          passSum: 0,
          shotsSum: 0,
          distSum: 0,
          y: 0,
          r: 0,
        });
      }
    });

    fixtures
      .filter((fx) => fx?.played)
      .filter((fx) => (fx.season == null ? true : Number(fx.season) === Number(season)))
      .forEach((fx) => {
        const homeKey = `${compId}::${fx.homeClubId}`;
        const awayKey = `${compId}::${fx.awayClubId}`;
        const homeAgg = map.get(homeKey);
        const awayAgg = map.get(awayKey);

        if (homeAgg) {
          homeAgg.played += 1;
          homeAgg.gf += n0(fx.homeGoals);
          homeAgg.ga += n0(fx.awayGoals);

          const st = fx?.teamStats?.home || null;
          if (st) {
            homeAgg.posSum += n0(st.possessionPct);
            homeAgg.passSum += n0(st.passAccuracyPct);
            homeAgg.shotsSum += n0(st.shotsTotal);
            homeAgg.distSum += n0(st.distanceKm);
            homeAgg.y += n0(st.yellows);
            homeAgg.r += n0(st.reds);
          }
        }

        if (awayAgg) {
          awayAgg.played += 1;
          awayAgg.gf += n0(fx.awayGoals);
          awayAgg.ga += n0(fx.homeGoals);

          const st = fx?.teamStats?.away || null;
          if (st) {
            awayAgg.posSum += n0(st.possessionPct);
            awayAgg.passSum += n0(st.passAccuracyPct);
            awayAgg.shotsSum += n0(st.shotsTotal);
            awayAgg.distSum += n0(st.distanceKm);
            awayAgg.y += n0(st.yellows);
            awayAgg.r += n0(st.reds);
          }
        }
      });

    // Asegurar referencia a club actual
    for (const [k, v] of map.entries()) {
      if (v.compId === compId) v.club = idx.get(v.clubId) || v.club;
    }
  }

  const rows = Array.from(map.values()).filter((r) => r.clubId);

  // Ordenar (por GF, luego PJ, luego nombre)
  rows.sort((a, b) => (b.gf - a.gf) || (b.played - a.played) || String(a.club?.name || a.clubId).localeCompare(String(b.club?.name || b.clubId), 'es', { sensitivity: 'base' }));

  tbody.innerHTML = '';

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${showCompCol ? 11 : 10}">Sin datos.</td></tr>`;
    return;
  }

  rows.forEach((r, idx) => {
    const pj = r.played || 0;
    const posAvg = pj ? (r.posSum / pj) : 0;
    const passAvg = pj ? (r.passSum / pj) : 0;
    const shotsAvg = pj ? (r.shotsSum / pj) : 0;
    const distAvg = pj ? (r.distSum / pj) : 0;

    const teamKey = `${r.compId}::${r.clubId}`;

    const tr = document.createElement('tr');
    tr.className = 'stats-row-clickable';
    tr.setAttribute('data-player-key', key);

    const clubLabel = r.club?.shortName || r.club?.abbr || r.club?.name || r.clubId;

    if (compact) {
      tr.innerHTML = `
        <td></td>
        <td></td>
        <td class="t-num">${fmtNum(a.apps || 0)}</td>
        <td class="t-num">${fmtNum(a.minutes || 0)}</td>
        <td class="t-num">${fmtNum(a.goals || 0)}</td>
        <td class="t-num">${fmtNum(a.assists || 0)}</td>
        <td class="t-num">${fmtNum(a.yellows || 0)}</td>
        <td class="t-num">${fmtNum(a.reds || 0)}</td>
        <td class="t-num">${esc(passPct)}</td>
        <td class="t-num">${esc(dist)}</td>
        <td class="t-num">${esc(vmax)}</td>
      `;
      tr.children[0].innerHTML = '';
      tr.children[0].appendChild(makePlayerInline(r.compId, r.clubId, p, 18));
      tr.children[1].innerHTML = '';
      tr.children[1].appendChild(makeClubInline(r.clubId, clubLabel, 18));
    } else {
      const shots = a.shotsTotal ? `${fmtNum(a.shotsTotal)}/${fmtNum(a.shotsOnTarget || 0)}` : '—';
      const rec = a.recoveries ? fmtNum(a.recoveries) : '—';
      const tack = a.tacklesWon ? `${fmtNum(a.tacklesWon)}/${fmtNum(a.tacklesLost || 0)}` : '—';

      tr.innerHTML = `
        <td></td>
        <td></td>
        <td>${esc(p.pos || '')}</td>
        <td class="t-num">${fmtNum(a.apps || 0)}</td>
        <td class="t-num">${fmtNum(a.minutes || 0)}</td>
        <td class="t-num">${fmtNum(a.goals || 0)}</td>
        <td class="t-num">${fmtNum(a.assists || 0)}</td>
        <td class="t-num">${fmtNum(a.yellows || 0)}</td>
        <td class="t-num">${fmtNum(a.reds || 0)}</td>
        <td class="t-num">${esc(passCell)}</td>
        <td class="t-num">${esc(passPct)}</td>
        <td class="t-num">${esc(dist)}</td>
        <td class="t-num">${esc(vmax)}</td>
        <td class="t-num">${esc(shots)}</td>
        <td class="t-num">${esc(rec)}</td>
        <td class="t-num">${esc(tack)}</td>
      `;
      tr.children[0].innerHTML = '';
      tr.children[0].appendChild(makePlayerInline(r.compId, r.clubId, p, 18));
      tr.children[1].innerHTML = '';
      tr.children[1].appendChild(makeClubInline(r.clubId, clubLabel, 18));
    }

    tbody.appendChild(tr);

    if (isExpanded) {
      const detailTr = document.createElement('tr');
      detailTr.className = 'stats-detail-row';
      const td = document.createElement('td');
      td.colSpan = compact ? 11 : 17;
      td.innerHTML = renderTeamInlineDetail(teamKey);
      detailTr.appendChild(td);
      tbody.appendChild(detailTr);
    }
  });
}

function renderTeamInlineDetail(teamKey) {
  const [compId, clubId] = String(teamKey).split('::');
  const comp = getCompetitionById(compId);
  if (!comp) return `<div class="muted">Competición no encontrada.</div>`;

  const idx = buildClubIndex(comp.clubs || []);
  const club = idx.get(String(clubId)) || null;
  const clubLabel = club?.name || club?.shortName || clubId;

  const season = getSeasonForComp(comp);
  const fixtures = Array.isArray(comp.fixtures) ? comp.fixtures : [];
  const played = fixtures
    .filter((fx) => fx?.played && (String(fx.homeClubId) === String(clubId) || String(fx.awayClubId) === String(clubId)))
    .filter((fx) => (fx.season == null ? true : Number(fx.season) === Number(season)))
    .sort((a, b) => n0(a.matchday) - n0(b.matchday));

  const rowsHtml = played.length
    ? played.map((fx) => {
        const isHome = String(fx.homeClubId) === String(clubId);
        const oppId = isHome ? fx.awayClubId : fx.homeClubId;
        const opp = idx.get(String(oppId)) || null;
        const oppName = opp?.shortName || opp?.abbr || opp?.name || oppId;
        const score = isHome ? `${fx.homeGoals}-${fx.awayGoals}` : `${fx.awayGoals}-${fx.homeGoals}`;
        const st = getFixtureSideStats(fx, clubId);
        const pos = st ? `${fmtNum(st.possessionPct || 0)}%` : '—';
        const shots = st ? `${fmtNum(st.shotsTotal || 0)}/${fmtNum(st.shotsOnTarget || 0)}` : '—';
        const passes = st ? `${fmtNum(st.passesCompleted || 0)}/${fmtNum(st.passesAttempted || 0)}` : '—';
        const dist = st && st.distanceKm ? fmt1(st.distanceKm) : '—';
        const cards = st ? `${fmtNum(st.yellows || 0)}/${fmtNum(st.reds || 0)}` : '—';

        return `
          <tr>
            <td>${fmtNum(fx.matchday)}</td>
            <td>${esc(oppName)}</td>
            <td>${esc(score)}</td>
            <td>${esc(pos)}</td>
            <td>${esc(shots)}</td>
            <td>${esc(passes)}</td>
            <td>${esc(dist)}</td>
            <td>${esc(cards)}</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="8">Sin partidos.</td></tr>`;

  return `
    <div class="stats-inline-detail">
      <div class="stats-inline-head">
        <div class="stats-inline-title">
          <span class="club-with-coat">
            ${createCoatImgElement(String(clubId), clubLabel, 18)?.outerHTML || ''}
            <strong>${esc(clubLabel)}</strong>
          </span>
          <span class="muted"> • ${esc(comp.name || comp.id)}</span>
        </div>
      </div>

      <div class="table-wrap">
        <table class="table table-compact">
          <thead>
            <tr>
              <th>Jor</th>
              <th>Rival</th>
              <th>Marc</th>
              <th>Pos</th>
              <th>Disparos</th>
              <th>Pases</th>
              <th>Dist</th>
              <th>Tar</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTeamMatchesTable() {
  const tbody = getTbodyTeamMatches();
   if (!tbody) return;
 
  const table = tbody.closest('table');
  const thCount = table ? table.querySelectorAll('thead th').length : 9;
  const wide = thCount >= 13; // layout nuevo: 14 columnas

   const teams = resolveSelectedTeamsFromClubKey();
   if (!teams.length) {
    tbody.innerHTML = `<tr><td colspan="${wide ? 14 : (showCompCol ? 10 : 9)}">Selecciona un equipo.</td></tr>`;
    return;
  }
  
  const showCompCol = !wide && !getSelectedCompetitionOrNull();
  const rows = [];

  teams.forEach(({ comp, clubId, clubIndex }) => {
    const compId = String(comp.id);
    const season = getSeasonForComp(comp);
    const fixtures = Array.isArray(comp.fixtures) ? comp.fixtures : [];
    fixtures
      .filter((fx) => fx?.played && (String(fx.homeClubId) === String(clubId) || String(fx.awayClubId) === String(clubId)))
      .filter((fx) => (fx.season == null ? true : Number(fx.season) === Number(season)))
      .forEach((fx) => rows.push({ comp, compId, clubId: String(clubId), clubIndex, fx }));
  });

  rows.sort((a, b) => (a.compId.localeCompare(b.compId)) || (n0(a.fx.matchday) - n0(b.fx.matchday)));

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${showCompCol ? 10 : 9}">Sin partidos jugados.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';

  rows.forEach((r) => {
    const fx = r.fx;
    const isHome = String(fx.homeClubId) === String(r.clubId);
    const oppId = isHome ? fx.awayClubId : fx.homeClubId;
    const opp = r.clubIndex.get(String(oppId)) || null;
    const oppLabel = opp?.shortName || opp?.abbr || opp?.name || oppId;

    const md = n0(fx.matchday);
    const season = getSeasonForComp(r.comp);
    const dateBase = formatGameDateLabel(getGameDateFor(season, md));
    const date = wide && !getSelectedCompetitionOrNull()
      ? `${dateBase} · ${r.comp.name || r.comp.id}`
      : dateBase;
    const score = isHome ? `${fx.homeGoals}-${fx.awayGoals}` : `${fx.awayGoals}-${fx.homeGoals}`;

    const st = getFixtureSideStats(fx, r.clubId);
    const pos = st ? `${fmtNum(st.possessionPct || 0)}%` : '—';
    const shots = st ? `${fmtNum(st.shotsTotal || 0)}/${fmtNum(st.shotsOnTarget || 0)}` : '—';
    const passes = st ? `${fmtNum(st.passesCompleted || 0)}/${fmtNum(st.passesAttempted || 0)}` : '—';
    const dist = (st && st.distanceKm != null) ? fmt1(st.distanceKm || 0) : '—';

    const recoveries = st ? fmtNum(st.recoveries || 0) : '—';
    const corners = st ? fmtNum(st.corners || 0) : '—';
    const fouls = st ? fmtNum((st.foulsCommitted ?? st.fouls ?? 0) || 0) : '—';
    const offsides = st ? fmtNum(st.offsides || 0) : '—';
    const fo = st ? `${fouls}/${offsides}` : '—';
    const saves = st ? fmtNum(st.saves || 0) : '—';
    const y = st ? fmtNum(st.yellows || 0) : '—';
    const rd = st ? fmtNum(st.reds || 0) : '—';

    const cards = st ? `${fmtNum(st.yellows || 0)}/${fmtNum(st.reds || 0)}` : '—';
 
    const fixtureKey = `${r.compId}::${fx.id}`;

    const tr = document.createElement('tr');
    tr.className = 'stats-row-clickable';
    tr.setAttribute('data-team-fixture-key', fixtureKey);

    if (wide) {
      tr.innerHTML = `
        <td>${fmtNum(md)}</td>
        <td>${esc(date)}</td>
        <td></td>
        <td><strong>${esc(score)}</strong></td>
        <td>${esc(pos)}</td>
        <td>${esc(shots)}</td>
        <td>${esc(passes)}</td>
        <td>${esc(dist)}</td>
        <td>${esc(recoveries)}</td>
        <td>${esc(corners)}</td>
        <td>${esc(fo)}</td>
        <td>${esc(saves)}</td>
        <td>${esc(y)}</td>
        <td>${esc(rd)}</td>
      `;
    } else {
      tr.innerHTML = `
        ${showCompCol ? `<td>${esc(r.comp.name || r.comp.id)}</td>` : ''}
        <td>${fmtNum(md)}</td>
        <td>${esc(date)}</td>
        <td></td>
        <td><strong>${esc(score)}</strong></td>
        <td>${esc(pos)}</td>
        <td>${esc(shots)}</td>
        <td>${esc(passes)}</td>
        <td>${esc(dist)}</td>
        <td>${esc(cards)}</td>
      `;
    }
	
    const tdOpp = wide ? tr.children[2] : (showCompCol ? tr.children[3] : tr.children[2]);  
      tdOpp.innerHTML = '';
      tdOpp.appendChild(makeClubInline(String(oppId), oppLabel, 18));
    

    tbody.appendChild(tr);

    if (__expandedTeamFixtureKey && String(__expandedTeamFixtureKey) === String(fixtureKey)) {
      const detailTr = document.createElement('tr');
      detailTr.className = 'stats-detail-row';
      const td = document.createElement('td');
     td.colSpan = wide ? thCount : (showCompCol ? 10 : 9);
      td.innerHTML = renderFixtureInlineDetail(r.comp, fx);
      detailTr.appendChild(td);
      tbody.appendChild(detailTr);
    }
  });
}

function renderFixtureInlineDetail(comp, fx) {
  const idx = buildClubIndex(comp.clubs || []);
  const home = idx.get(String(fx.homeClubId)) || null;
  const away = idx.get(String(fx.awayClubId)) || null;
  const homeLabel = home?.name || home?.shortName || fx.homeClubId;
  const awayLabel = away?.name || away?.shortName || fx.awayClubId;

  const head = `
    <div class="stats-inline-head">
      <div class="stats-inline-title">
        <span class="club-with-coat">${createCoatImgElement(String(fx.homeClubId), homeLabel, 18)?.outerHTML || ''}<strong>${esc(homeLabel)}</strong></span>
        <span class="muted"> vs </span>
        <span class="club-with-coat">${createCoatImgElement(String(fx.awayClubId), awayLabel, 18)?.outerHTML || ''}<strong>${esc(awayLabel)}</strong></span>
        <span class="muted"> • ${esc(comp.name || comp.id)} • J${fmtNum(fx.matchday)}</span>
      </div>
    </div>
  `;

  const line = (label, hv, av) => `
    <tr>
      <td class="th-num">${esc(hv ?? '—')}</td>
      <td class="pcf-stats-label">${esc(label)}</td>
      <td class="th-num">${esc(av ?? '—')}</td>
    </tr>
  `;

  const h = fx?.teamStats?.home || null;
  const a = fx?.teamStats?.away || null;

  const statsTable = (!h || !a)
    ? `<div class="muted">No hay estadísticas avanzadas para este partido.</div>`
    : `
      <div class="table-wrap">
        <table class="pcf-stats-table">
          <tbody>
            ${line('Posesión (%)', `${fmtNum(h.possessionPct || 0)}%`, `${fmtNum(a.possessionPct || 0)}%`)}
            ${line('Disparos', fmtNum(h.shotsTotal || 0), fmtNum(a.shotsTotal || 0))}
            ${line('A puerta', fmtNum(h.shotsOnTarget || 0), fmtNum(a.shotsOnTarget || 0))}
            ${line('Córners', fmtNum(h.corners || 0), fmtNum(a.corners || 0))}
            ${line('Pases', `${fmtNum(h.passesCompleted || 0)}/${fmtNum(h.passesAttempted || 0)}`, `${fmtNum(a.passesCompleted || 0)}/${fmtNum(a.passesAttempted || 0)}`)}
            ${line('% pase', `${fmtNum(h.passAccuracyPct || 0)}%`, `${fmtNum(a.passAccuracyPct || 0)}%`)}
            ${line('Distancia (km)', fmt1(h.distanceKm || 0), fmt1(a.distanceKm || 0))}
            ${line('Recuperaciones', fmtNum(h.recoveries || 0), fmtNum(a.recoveries || 0))}
            ${line('Fuera de juego', fmtNum(h.offsides || 0), fmtNum(a.offsides || 0))}
            ${line('Paradas', fmtNum(h.saves || 0), fmtNum(a.saves || 0))}
            ${line('Amarillas', fmtNum(h.yellows || 0), fmtNum(a.yellows || 0))}
            ${line('Rojas', fmtNum(h.reds || 0), fmtNum(a.reds || 0))}
          </tbody>
        </table>
      </div>
    `;

  // Cronología simple desde fx.events (si existe)
  const events = Array.isArray(fx.events) ? fx.events.slice() : [];
  events.sort((x, y) => n0(x.minute) - n0(y.minute));

  const fmtMinute = (m) => {
    const mm = n0(m);
    if (!mm) return '';
    return `${mm}'`;
  };

  const getName = (club, pid) => {
    const p = (club?.players || []).find((pp) => String(pp?.id) === String(pid));
    return p?.name || pid || 'Jugador';
  };

  const timeline = buildMatchTimelineHTML({
    fx,
    clubIndex: idx,
    clubs: comp.clubs || [],
    maxItems: 80,
    withFinalLabel: true,
  });

  return `
    <div class="stats-inline-detail">
      ${head}
      <div style="margin-top:10px;">
        <div class="pcf-stats-block__title">Estadísticas</div>
        ${statsTable}
      </div>
      <div style="margin-top:12px;">
        <div class="pcf-stats-block__title">Cronología</div>
        ${timeline}
      </div>
    </div>
  `;
}

function ensureBindings() {
  if (__bound) return;

  ensureStatsDOM();

  const selComp =
    document.getElementById('stats-competition-select') ||
    document.getElementById('stats-adv-competition-select');
  const selClub = document.getElementById('stats-club-select');

  const btnPlayers = document.getElementById('stats-mode-players');
  const btnTeam = document.getElementById('stats-mode-team');

  if (!selComp) return;

  const setMode = (m) => {
    __mode = m === 'team' ? 'team' : 'players';
    btnPlayers?.classList.toggle('is-active', __mode === 'players');
    btnTeam?.classList.toggle('is-active', __mode === 'team');
    __expandedPlayerKey = null;
    __expandedTeamKey = null;
    __expandedTeamFixtureKey = null;
    updateStatsView();
  };

  btnPlayers?.addEventListener('click', () => setMode('players'));
  btnTeam?.addEventListener('click', () => setMode('team'));

  selComp.addEventListener('change', () => {
    __selectedCompetitionId = String(selComp.value || getDefaultCompetitionId());

    // Al cambiar de comp, reseteamos selección de club a "Mi equipo" para evitar valores inválidos
    __selectedClubKey = MY_CLUB;

    __expandedPlayerKey = null;
    __expandedTeamKey = null;
    __expandedTeamFixtureKey = null;

    updateStatsView();
  });

  selClub?.addEventListener('change', () => {
    __selectedClubKey = String(selClub.value || MY_CLUB);
    __expandedPlayerKey = null;
    __expandedTeamKey = null;
    __expandedTeamFixtureKey = null;
    updateStatsView();
  });

  // Click jugador
  document.getElementById('stats-pane-players')?.addEventListener('click', (ev) => {
    const target = ev.target instanceof Element ? ev.target : null;
    if (!target) return;
    const tr = target.closest('tr[data-player-key]');
    if (!tr) return;
    const key = tr.getAttribute('data-player-key');
    if (!key) return;
    __expandedPlayerKey = String(__expandedPlayerKey) === String(key) ? null : String(key);
    updateStatsView();
  });

  // Click equipo (lista de equipos agregada)
  getPaneTeams()?.addEventListener('click', (ev) => {
    const target = ev.target instanceof Element ? ev.target : null;
    if (!target) return;

    const trTeam = target.closest('tr[data-team-key]');
    if (trTeam) {
      const key = trTeam.getAttribute('data-team-key');
      if (!key) return;
      __expandedTeamKey = String(__expandedTeamKey) === String(key) ? null : String(key);
      updateStatsView();
      return;
    }

    const trFx = target.closest('tr[data-team-fixture-key]');
    if (trFx) {
      const key = trFx.getAttribute('data-team-fixture-key');
      if (!key) return;
      __expandedTeamFixtureKey = String(__expandedTeamFixtureKey) === String(key) ? null : String(key);
      updateStatsView();
    }
  });

  __bound = true;
}

export function initStatsUI() {
  __selectedCompetitionId = getDefaultCompetitionId();
  __mode = 'players';
  __selectedClubKey = MY_CLUB;
  __expandedPlayerKey = null;
  __expandedTeamKey = null;
  __expandedTeamFixtureKey = null;
  ensureBindings();
}

export function updateStatsView() {
  ensureBindings();
  ensureStatsDOM();

  const selComp =
    document.getElementById('stats-competition-select') ||
    document.getElementById('stats-adv-competition-select');
  const selClub = document.getElementById('stats-club-select');

  if (selComp) {
    buildCompetitionSelectOptions(selComp);
    __selectedCompetitionId = String(selComp.value || __selectedCompetitionId || getDefaultCompetitionId());
  }

  if (selClub) {
    buildClubSelectOptions(selClub);
    __selectedClubKey = String(selClub.value || __selectedClubKey || MY_CLUB);
  }

  // Labels temporada/jornada
  const baseComp = getSelectedCompetitionOrNull() || getCompetitionById(getDefaultCompetitionId());
  const season = getSeasonForComp(baseComp);
  const md = getCurrentMatchdayForComp(baseComp);

  const seasonEl = document.getElementById('stats-season-label') || document.getElementById('stats-adv-season-label');
  const mdEl = document.getElementById('stats-current-md') || document.getElementById('stats-adv-current-md');
  if (seasonEl) seasonEl.textContent = String(season);
  if (mdEl) mdEl.textContent = String(md);

  // Show/hide panes
  const panePlayers = document.getElementById('stats-pane-players');
  const paneTeam = getPaneTeams();
  panePlayers?.classList.toggle('hidden', __mode !== 'players');
  paneTeam?.classList.toggle('hidden', __mode !== 'team');

  if (__mode === 'players') renderPlayersTable();
  else renderTeamPane();
}
