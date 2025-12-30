import { GameState } from '../../state.js';
import { formatFixtureKickoffLabel } from '../utils/calendar.js';
import { findFixtureInCompetition } from '../utils/competitions.js';

let currentFixtureId = null;

function show(modal) {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function hide(modal) {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function clearEventsList() {
  const eventsListEl = document.getElementById('match-detail-events');
  if (eventsListEl) eventsListEl.innerHTML = '';
}

export function initMatchDetailModal({ onRequestClose } = {}) {
  const modal = document.getElementById('match-detail-modal');
  if (!modal) return;

  const backdrop = document.getElementById('match-detail-modal-backdrop');
  const closeBtn = document.getElementById('match-detail-modal-close');
  const closeFooter = document.getElementById('match-detail-modal-close-footer');

  const requestClose = () => {
    if (typeof onRequestClose === 'function') onRequestClose();
    else closeMatchDetailModal();
  };

  backdrop?.addEventListener('click', requestClose);
  closeBtn?.addEventListener('click', requestClose);
  closeFooter?.addEventListener('click', requestClose);
}

// openMatchDetailModal puede recibir:
// - un id (number/string) de la liga actual
// - o un objeto { competitionId, fixtureId } para soportar ligas del mundo
export function openMatchDetailModal(arg) {
  const competitionId =
    arg && typeof arg === 'object' ? String(arg.competitionId || '') : null;
  const fixtureId = arg && typeof arg === 'object' ? arg.fixtureId : arg;

  currentFixtureId = fixtureId;

  const modal = document.getElementById('match-detail-modal');
  if (!modal) return;

  const titleEl = document.getElementById('match-detail-modal-title');
  const subtitleEl = document.getElementById('match-detail-modal-subtitle');
  const eventsListEl = document.getElementById('match-detail-events');

  if (eventsListEl) eventsListEl.innerHTML = '';

  // fixtureId puede venir como string desde dataset (data-fixture-id)
  // y los ids en GameState.fixtures pueden ser number.
  const fid = fixtureId != null ? String(fixtureId) : '';
  const found = competitionId
    ? findFixtureInCompetition(competitionId, fid)
    : { comp: null, fx: (GameState.fixtures || []).find((f) => f && String(f.id) === fid) || null };
  const fx = found?.fx || null;

  // Para ligas del mundo, el índice de clubs puede estar fuera de GameState.clubs.
  // Aun así, en PCFutbol tu club/plantilla vive en GameState.clubs, así que intentamos con eso,
  // y si el partido es de otra liga, caemos al array de clubs de esa competición.
  const clubs = Array.isArray(found?.comp?.clubs) && found?.comp?.clubs.length
    ? found.comp.clubs
    : (GameState.clubs || []);
  const clubIndex = new Map();
  clubs.forEach((club) => {
    if (club && club.id) clubIndex.set(club.id, club);
  });

  if (!fx) {
    if (subtitleEl) subtitleEl.textContent = 'No se ha encontrado el partido.';
    show(modal);
    return;
  }

  const homeClub = clubIndex.get(fx.homeClubId) || null;
  const awayClub = clubIndex.get(fx.awayClubId) || null;

  const homeName =
    (homeClub && (homeClub.shortName || homeClub.name)) ||
    fx.homeClubId ||
    'Local';
  const awayName =
    (awayClub && (awayClub.shortName || awayClub.name)) ||
    fx.awayClubId ||
    'Visitante';

  if (titleEl) {
    if (fx.played && fx.homeGoals != null && fx.awayGoals != null) {
      titleEl.textContent = `${homeName} ${fx.homeGoals} - ${fx.awayGoals} ${awayName}`;
    } else {
      titleEl.textContent = `${homeName} vs ${awayName}`;
    }
  }

  if (subtitleEl) {
    const season = Number(found?.comp?.currentDate?.season ?? GameState.currentDate?.season ?? 1);
    const matchday = Number(fx.matchday || 1);
    // Usa kickoff real si existe (calendar oficial / fixtures con fecha),
    // y si no, cae al calendario interno (1 jornada = 7 días).
    const kickoffLabel = formatFixtureKickoffLabel(fx, season, matchday) || '';
    const compName = found?.comp?.name ? ` • ${found.comp.name}` : '';
     subtitleEl.textContent = `Jornada ${matchday} • ${kickoffLabel}${compName}`;
   }

  if (eventsListEl) {
    const playerIndex = new Map();
    clubs.forEach((club) => {
      const players = Array.isArray(club.players) ? club.players : [];
      players.forEach((p) => {
        if (p && p.id) playerIndex.set(p.id, { player: p, club });
      });
    });

    const events = Array.isArray(fx.events) ? fx.events.slice() : [];
    // Sustituciones como eventos
    const subs = Array.isArray(fx.substitutions) ? fx.substitutions : [];
    subs.forEach((s) => {
      if (!s) return;
      events.push({
        type: 'SUB',
        minute: Number(s.minute || 0) || 0,
        clubId: s.clubId,
        inPlayerId: s.inPlayerId,
        outPlayerId: s.outPlayerId,
      });
    });
    events.sort((a, b) => {
      const ma = typeof a?.minute === 'number' ? a.minute : 999;
      const mb = typeof b?.minute === 'number' ? b.minute : 999;
      return ma - mb;
    });

    if (events.length === 0) {
      const li = document.createElement('li');
      li.className = 'match-event-item';
      const minuteSpan = document.createElement('span');
      minuteSpan.className = 'match-event-minute';
      minuteSpan.textContent = '-';
      const descSpan = document.createElement('span');
      descSpan.className = 'match-event-desc';
      descSpan.textContent = 'No se han registrado eventos para este partido.';
      li.appendChild(minuteSpan);
      li.appendChild(descSpan);
      eventsListEl.appendChild(li);
    } else {
      events.forEach((ev) => {
        if (!ev) return;

        const li = document.createElement('li');
        li.className = 'match-event-item';

        const minuteSpan = document.createElement('span');
        minuteSpan.className = 'match-event-minute';
        const minute = typeof ev.minute === 'number' && ev.minute > 0 ? ev.minute : null;
        minuteSpan.textContent = minute != null ? `${minute}'` : '-';

        const descSpan = document.createElement('span');
        descSpan.className = 'match-event-desc';

        const info = ev.playerId ? playerIndex.get(ev.playerId) : null;
        const playerName = (info && info.player && info.player.name) || 'Jugador';

        const clubInfo = ev.clubId ? clubIndex.get(ev.clubId) : null;
        const teamName =
          (clubInfo && (clubInfo.shortName || clubInfo.name)) || ev.clubId || '';

        if (ev.clubId === fx.homeClubId) descSpan.classList.add('match-event-team-home');
        else if (ev.clubId === fx.awayClubId) descSpan.classList.add('match-event-team-away');

        let text = '';
        switch (ev.type) {
          case 'GOAL':
            if (ev.assistPlayerId) {
              const ainfo = playerIndex.get(ev.assistPlayerId);
              const an = (ainfo && ainfo.player && ainfo.player.name) || '';
              text = an
                ? `Gol de ${playerName} (${teamName}) · Asistencia: ${an}`
                : `Gol de ${playerName} (${teamName})`;
            } else {
              text = `Gol de ${playerName} (${teamName})`;
            }
            break;
          case 'YELLOW_CARD':
            text = `Amarilla a ${playerName} (${teamName})`;
            break;
          case 'RED_CARD':
            text = `Roja a ${playerName} (${teamName})`;
            break;
          case 'INJURY': {
            const injuryType = ev.injuryType || 'Lesión';
            text = `Lesión: ${playerName} (${teamName}) – ${injuryType}`;
            break;
          }
          case 'SUB': {
            const inInfo = ev.inPlayerId ? playerIndex.get(ev.inPlayerId) : null;
            const outInfo = ev.outPlayerId ? playerIndex.get(ev.outPlayerId) : null;
            const inName = (inInfo && inInfo.player && inInfo.player.name) || 'Jugador';
            const outName = (outInfo && outInfo.player && outInfo.player.name) || 'Jugador';
            text = `${inName} entra por ${outName} (${teamName})`;
            break;
          }		  
          default:
            text = `${ev.type || 'Evento'}: ${playerName} (${teamName})`;
            break;
        }
        descSpan.textContent = text;

        li.appendChild(minuteSpan);
        li.appendChild(descSpan);
        eventsListEl.appendChild(li);
      });
    }
  }

  show(modal);
}

export function closeMatchDetailModal() {
  const modal = document.getElementById('match-detail-modal');
  if (!modal) return;
  hide(modal);
  clearEventsList();
  currentFixtureId = null;
}