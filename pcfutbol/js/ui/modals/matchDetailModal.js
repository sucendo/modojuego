import { GameState } from '../../state.js';
import { getGameDateFor, formatGameDateLabel } from '../utils/calendar.js';

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

export function openMatchDetailModal(fixtureId) {
  currentFixtureId = fixtureId;

  const modal = document.getElementById('match-detail-modal');
  if (!modal) return;

  const titleEl = document.getElementById('match-detail-modal-title');
  const subtitleEl = document.getElementById('match-detail-modal-subtitle');
  const eventsListEl = document.getElementById('match-detail-events');

  if (eventsListEl) eventsListEl.innerHTML = '';

  const fixtures = GameState.fixtures || [];
  const fx = fixtures.find((f) => f && f.id === fixtureId);

  const clubs = GameState.clubs || [];
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
    const season = GameState.currentDate?.season || 1;
    const matchday = fx.matchday || 1;
    const gameDate = getGameDateFor(season, matchday);
    const dateLabel = formatGameDateLabel(gameDate);
    subtitleEl.textContent = `Jornada ${matchday} • ${dateLabel}`;
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
            text = `Gol de ${playerName} (${teamName})`;
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