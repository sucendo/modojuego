import { GameState } from '../state.js';
import { updateQuickNotes } from './medical.js';
import { getGameDateFor, formatGameDateLabel } from './utils/calendar.js';
import { createCoatImgElement } from './utils/coats.js';

function getUserClub() {
  const clubId = GameState.user?.clubId;
  const clubs = Array.isArray(GameState.clubs) ? GameState.clubs : [];
  if (!clubs.length) return null;
  if (!clubId) return clubs[0];
  return clubs.find((c) => c?.id === clubId) || clubs[0];
}

function formatCurrency(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return '-';
  try {
    return v.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });
  } catch {
    return String(Math.round(v));
  }
}

function getCoatImg(clubId, clubName, size = 24) {
  return createCoatImgElement(clubId, clubName, size);
}

function buildClubIndex() {
  const map = new Map();
  (GameState.clubs || []).forEach((c) => {
    if (c?.id) map.set(c.id, c);
  });
  return map;
}

function deriveKickoffTime(fx, idx = 0) {
  // Si en el futuro guardas kickoffTime en el fixture, se usa
  if (typeof fx?.kickoffTime === 'string' && fx.kickoffTime.includes(':')) {
    return fx.kickoffTime;
  }
  const slots = ['16:00', '18:15', '20:30', '22:00'];
  return slots[(idx || 0) % slots.length];
}

function getNextFixtureForClub(clubId) {
  const fixtures = Array.isArray(GameState.fixtures) ? GameState.fixtures : [];
  if (!fixtures.length) return null;

  const currentMd = Number(GameState.currentDate?.matchday || 1);
  const season = Number(GameState.currentDate?.season || 1);

  const candidates = fixtures
    .filter((fx) => {
      if (!fx) return false;
      const md = Number(fx.matchday || 0);
      if (!Number.isFinite(md)) return false;
      if (md < currentMd) return false;
      if (fx.played) return false;
      return fx.homeClubId === clubId || fx.awayClubId === clubId;
    })
    .slice()
    .sort((a, b) => {
      const am = Number(a.matchday || 0);
      const bm = Number(b.matchday || 0);
      if (am !== bm) return am - bm;
      return String(a.id).localeCompare(String(b.id));
    });

  if (!candidates.length) return null;

  // idx dentro de la jornada para derivar una hora “estable”
  const md = Number(candidates[0].matchday || currentMd);
  const sameMd = fixtures
    .filter((fx) => fx && Number(fx.matchday) === md)
    .slice()
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const idx = Math.max(0, sameMd.findIndex((fx) => fx.id === candidates[0].id));

  return { fx: candidates[0], season, idxInMatchday: idx };
}

export function updateDashboard() {
  const club = getUserClub();
  if (!club) return;
  
  function renderMatchLine(containerEl, fx, clubIndex, size = 18, userClubId = null) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const home = clubIndex.get(fx.homeClubId);
    const away = clubIndex.get(fx.awayClubId);
    const homeName = home?.shortName || home?.name || fx.homeClubId || 'Local';
    const awayName = away?.shortName || away?.name || fx.awayClubId || 'Visitante';

    const line = document.createElement('div');
    line.className = 'pcf-inline-match';

    const homeTeam = document.createElement('span');
    homeTeam.className = 'pcf-inline-match__team' + (userClubId && fx.homeClubId === userClubId ? ' is-user' : '');
    const homeCoat = createCoatImgElement(fx.homeClubId, homeName, size);
    if (homeCoat) homeTeam.appendChild(homeCoat);
    const homeTxt = document.createElement('span');
    homeTxt.className = 'pcf-inline-match__name';
    homeTxt.textContent = homeName;
    homeTeam.appendChild(homeTxt);

    const vs = document.createElement('span');
    vs.className = 'pcf-inline-match__vs';
    vs.textContent = 'vs';

    const awayTeam = document.createElement('span');
    awayTeam.className = 'pcf-inline-match__team' + (userClubId && fx.awayClubId === userClubId ? ' is-user' : '');
    const awayCoat = createCoatImgElement(fx.awayClubId, awayName, size);
    if (awayCoat) awayTeam.appendChild(awayCoat);
    const awayTxt = document.createElement('span');
    awayTxt.className = 'pcf-inline-match__name';
    awayTxt.textContent = awayName;
    awayTeam.appendChild(awayTxt);

    line.appendChild(homeTeam);
    line.appendChild(vs);
    line.appendChild(awayTeam);
    containerEl.appendChild(line);
  } 

  // HUD (nuevo)
  const hudManager = document.getElementById('hud-manager');
  const hudClub = document.getElementById('hud-club');
  const hudLeague = document.getElementById('hud-league');
  const hudSeason = document.getElementById('hud-season');
  const hudMatchday = document.getElementById('hud-matchday');
  const hudCash = document.getElementById('hud-cash');
  const hudWage = document.getElementById('hud-wage');
  const hudNextMain = document.getElementById('hud-next-main');
  const hudNextSub = document.getElementById('hud-next-sub');
  const hubNextHint = document.getElementById('hub-next-hint');
  const hudCoat = document.getElementById('hud-coat');

  if (hudManager) hudManager.textContent = GameState.user?.name || 'Mánager';
  if (hudClub) hudClub.textContent = club.name || club.id || 'Club';
  if (hudLeague) hudLeague.textContent = GameState.league?.name || 'Liga';
  if (hudSeason) hudSeason.textContent = `Temporada ${GameState.currentDate?.season || 1}`;
  if (hudMatchday) hudMatchday.textContent = `Jornada ${GameState.currentDate?.matchday || 1}`;
  if (hudCash) hudCash.textContent = formatCurrency(club.cash ?? 0);
  if (hudWage) hudWage.textContent = formatCurrency(club.wageBudget ?? 0);

  // Escudo (HUD izquierda)
  if (hudCoat) {
    hudCoat.innerHTML = '';
    const coat = createCoatImgElement(club.id, club.name, 44);
    if (coat) hudCoat.appendChild(coat);
  }

  // Top bar
  const clubNameTop = document.getElementById('club-name');
  const leagueName = document.getElementById('league-name');
  const seasonLabel = document.getElementById('season-label');
  const matchdayLabel = document.getElementById('matchday-label');

  if (clubNameTop) clubNameTop.textContent = club.name || club.id || 'Club';
  if (leagueName) leagueName.textContent = GameState.league?.name || 'Liga desconocida';
  if (seasonLabel) seasonLabel.textContent = `Temporada ${GameState.currentDate?.season || 1}`;
  if (matchdayLabel) matchdayLabel.textContent = `Jornada ${GameState.currentDate?.matchday || 1}`;

  // Resumen del club
  const clubNameMain = document.getElementById('club-name-main');
  const stadiumName = document.getElementById('stadium-name');
  const stadiumCapacity = document.getElementById('stadium-capacity');
  const cashLabel = document.getElementById('cash-label');
  const wageLabel = document.getElementById('wage-label');

  if (clubNameMain) {
    clubNameMain.classList.add('club-with-coat');
    clubNameMain.textContent = '';
    const coat = getCoatImg(club.id, club.name, 24);
    if (coat) clubNameMain.appendChild(coat);
    const span = document.createElement('span');
    span.textContent = club.name || club.id || 'Club';
    clubNameMain.appendChild(span);
  }

  if (stadiumName) stadiumName.textContent = club.stadium?.name || 'Estadio sin nombre';
  if (stadiumCapacity) {
    stadiumCapacity.textContent =
      club.stadium?.capacity != null
        ? Number(club.stadium.capacity).toLocaleString('es-ES')
        : '-';
  }
  if (cashLabel) cashLabel.textContent = formatCurrency(club.cash ?? 0);
  if (wageLabel) wageLabel.textContent = formatCurrency(club.wageBudget ?? 0);

  // Próximo partido
  const nextMatchLabel = document.getElementById('next-match-label');
  const shouldRenderNext = Boolean(
    nextMatchLabel || hudNextMain || hudNextSub || hubNextHint
  );
  if (shouldRenderNext) {
    const clubIndex = buildClubIndex();
    const next = getNextFixtureForClub(club.id);
    if (!next) {
      const hasCalendar = Array.isArray(GameState.fixtures) && GameState.fixtures.length > 0;
      if (nextMatchLabel) {
        nextMatchLabel.textContent = hasCalendar
          ? 'Próximo partido: no hay partidos pendientes.'
          : 'Próximo partido: (sin calendario)';
      }
      if (hudNextMain) hudNextMain.textContent = '—';
      if (hudNextSub) {
        hudNextSub.textContent = hasCalendar
          ? 'No hay partidos pendientes.'
          : 'Aún no hay calendario (fixtures).';
      }
      if (hubNextHint) hubNextHint.textContent = hudNextSub?.textContent || '';
    } else {
      const { fx, season, idxInMatchday } = next;
      const home = clubIndex.get(fx.homeClubId);
      const away = clubIndex.get(fx.awayClubId);
      const homeName = home?.shortName || home?.name || fx.homeClubId || 'Local';
      const awayName = away?.shortName || away?.name || fx.awayClubId || 'Visitante';
      const md = Number(fx.matchday || GameState.currentDate?.matchday || 1);
      const date = getGameDateFor(season, md);
      const dateLabel = formatGameDateLabel(date);
      const timeLabel = deriveKickoffTime(fx, idxInMatchday);
      const sub = `${GameState.league?.name || 'Liga'} • J${md} • ${dateLabel} • ${timeLabel}`;

      if (nextMatchLabel) {
        nextMatchLabel.textContent = `Próximo partido: ${homeName} vs ${awayName} (J${md} • ${dateLabel} • ${timeLabel})`;
      }
      // HUD: línea con ambos equipos en orden real (local vs visitante) + escudos
      if (hudNextMain) renderMatchLine(hudNextMain, fx, clubIndex, 18, club.id);
      if (hudNextSub) hudNextSub.textContent = sub;
      // HUB: bajo el botón PARTIDO, lo mismo pero un poco más grande
      if (hubNextHint) {
        hubNextHint.innerHTML = '';
        renderMatchLine(hubNextHint, fx, clubIndex, 22, club.id);
        const meta = document.createElement('div');
        meta.className = 'pcf-inline-match__meta';
        meta.textContent = sub;
        hubNextHint.appendChild(meta);
      }
    }
  }

  // Notas rápidas (las mantiene medical.js)
  updateQuickNotes();
}