/**
 * Estadísticas (placeholder).
 */

import { GameState } from '../state.js';

function escapeHtml(value) {
  const s = String(value ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getUserClub() {
  const clubId = GameState.user?.clubId;
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  return clubs.find((c) => c?.id === clubId) || clubs[0] || null;
}

export function updateStatsView() {
  const season = GameState.currentDate?.season || 1;
  const label = document.getElementById('stats-season-label');
  if (label) label.textContent = String(season);

  const topBody = document.getElementById('stats-topscorers-body');
  const teamBody = document.getElementById('stats-team-body');
  if (!topBody || !teamBody) return;

  const key = String(season);
  const clubs = GameState.clubs || [];

  // -----------------------------
  // Top goleadores (toda la liga)
  // -----------------------------
  const all = [];
  clubs.forEach((club) => {
    (club.players || []).forEach((p) => {
      const st = p?.stats?.[key];
      const goals = st?.goals ?? 0;
      const minutes = st?.minutes ?? 0;
      if (goals > 0 || minutes > 0) {
        all.push({ player: p, club, goals, minutes });
      }
    });
  });

  all.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return (b.minutes || 0) - (a.minutes || 0);
  });

  topBody.innerHTML = '';
  const top = all.slice(0, 20);
  top.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHtml(row.player?.name || 'Jugador')}</td>
      <td>${escapeHtml(row.club?.shortName || row.club?.name || '')}</td>
      <td><strong>${row.goals}</strong></td>
      <td>${row.minutes || 0}</td>
    `;
    topBody.appendChild(tr);
  });
  if (top.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5">Aún no hay estadísticas (simula alguna jornada).</td>`;
    topBody.appendChild(tr);
  }

  // ---------------------------------
  // Stats de tu equipo (por jugador)
  // ---------------------------------
  const myClub = getUserClub();
  const myPlayers = myClub?.players || [];

  const rows = myPlayers
    .map((p) => {
      const st = p?.stats?.[key] || {};
      return {
        p,
        apps: st.apps ?? 0,
        minutes: st.minutes ?? 0,
        goals: st.goals ?? 0,
        yellows: st.yellows ?? 0,
        reds: st.reds ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.apps !== a.apps) return b.apps - a.apps;
      return b.minutes - a.minutes;
    })
    .slice(0, 25);

  teamBody.innerHTML = '';
  if (rows.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7">Sin estadísticas aún.</td>`;
    teamBody.appendChild(tr);
    return;
  }

  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(r.p?.position || '')}</td>
      <td>${escapeHtml(r.p?.name || 'Jugador')}</td>
      <td>${r.apps}</td>
      <td>${r.minutes}</td>
      <td><strong>${r.goals}</strong></td>
      <td>${r.yellows}</td>
      <td>${r.reds}</td>
    `;
    teamBody.appendChild(tr);
  });
}