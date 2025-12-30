import { GameState } from '../state.js';
import { getUserClub } from '../game/selectors.js';
import { updateQuickNotes } from './medical.js';
import { getFixtureKickoffDate, formatGameDateLabel } from './utils/calendar.js';
import { createCoatImgElement } from './utils/coats.js';

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

function getCompetitionLogoPath(league) {
  const id = String(league?.id || '').toLowerCase();
  const name = String(league?.name || '').toLowerCase();
  // LaLiga (según tu ruta indicada)
  if (id.includes('league_es_primera') || name.includes('la liga')) {
    return 'img/competitions/LaLiga_EA_Sports_2023_Vertical_Logo.svg';
  }
  return null;
}

function capFirst(s){
  const str = String(s || '');
  return str ? (str.charAt(0).toUpperCase() + str.slice(1)) : '';
}

export function updateDashboard() {
  const club = getUserClub(GameState);
  if (!club) return;
  
  function renderMatchLine(containerEl, fx, clubIndex, size = 18, userClubId = null, opts = {}) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const home = clubIndex.get(fx.homeClubId);
    const away = clubIndex.get(fx.awayClubId);
    const useShort = opts.useShortName ?? true;
    const homeName = useShort
      ? (home?.shortName || home?.name || fx.homeClubId || 'Local')
      : (home?.name || home?.shortName || fx.homeClubId || 'Local');
    const awayName = useShort
      ? (away?.shortName || away?.name || fx.awayClubId || 'Visitante')
      : (away?.name || away?.shortName || fx.awayClubId || 'Visitante');

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
  const hudNextVenue = document.getElementById('hud-next-venue');
  const hudNextSub = document.getElementById('hud-next-sub');
  const hudNextDate = document.getElementById('hud-next-date');
  const hudNextTime = document.getElementById('hud-next-time'); 
  const hudNextLogo = document.getElementById('hud-next-logo');
  const hubNextHint = document.getElementById('hub-next-hint');
  const hudCoat = document.getElementById('hud-coat');

  if (hudManager) hudManager.textContent = GameState.user?.name || 'Mánager';
  if (hudClub) hudClub.textContent = club.name || club.id || 'Club';
  if (hudLeague) hudLeague.textContent = GameState.league?.name || 'Liga';
  if (hudSeason) hudSeason.textContent = `(Temporada ${GameState.currentDate?.season || 1})`;
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
      if (hudNextVenue) hudNextVenue.textContent = '—';
      if (hudNextSub) {
        hudNextSub.textContent = hasCalendar
          ? 'No hay partidos pendientes.'
          : 'Aún no hay calendario (fixtures).';
      }
      if (hudNextDate) hudNextDate.textContent = '—';
      if (hudNextTime) hudNextTime.textContent = '—';
      if (hudNextLogo) {
        hudNextLogo.style.display = 'none';
        hudNextLogo.removeAttribute('src');
        hudNextLogo.removeAttribute('alt');
      }
      if (hubNextHint) hubNextHint.textContent = hudNextSub?.textContent || '';
    } else {
      const { fx, season, idxInMatchday } = next;
      const home = clubIndex.get(fx.homeClubId);
      const away = clubIndex.get(fx.awayClubId);
      const homeNameFull = home?.name || home?.shortName || fx.homeClubId || 'Local';
      const awayNameFull = away?.name || away?.shortName || fx.awayClubId || 'Visitante'; 
      const md = Number(fx.matchday || GameState.currentDate?.matchday || 1);
      const date = getFixtureKickoffDate(fx, season, md);
      const dateLabel = formatGameDateLabel(date);
      const timeLabel = (fx?.kickoffTime && String(fx.kickoffTime).includes(':')) ? fx.kickoffTime : deriveKickoffTime(fx, idxInMatchday);
 
      const stadium =
        home?.stadium?.name || home?.stadiumName || home?.stadium?.stadiumName ||
        home?.stadiumName || 'Estadio';

      const compLine = `${GameState.league?.name || 'Liga'} • Jornada ${md}`;
 
      if (nextMatchLabel) {
        nextMatchLabel.textContent = `Próximo partido: ${homeNameFull} vs ${awayNameFull} (${compLine} • ${dateLabel} • ${timeLabel})`;
      }
      // HUD: nombres completos + logo competición
      if (hudNextMain) renderMatchLine(hudNextMain, fx, clubIndex, 18, club.id, { useShortName: false });
      if (hudNextSub) hudNextSub.textContent = compLine;
      if (hudNextVenue) hudNextVenue.textContent = stadium;
      if (hudNextDate) {
        const weekday = (date instanceof Date && !Number.isNaN(date.getTime()))
          ? capFirst(date.toLocaleDateString('es-ES', { weekday: 'long' }))
          : '';
        const base = `${weekday ? weekday + ' ' : ''}${dateLabel}`;
        // Mostrar siempre FECHA • HORA en el label (aunque exista hudNextTime)
        hudNextDate.textContent = timeLabel ? `${base} • ${timeLabel}` : base;
      }
      if (hudNextTime) hudNextTime.textContent = timeLabel;
      if (hudNextLogo) {
        const logoPath = getCompetitionLogoPath(GameState.league);
        if (logoPath) {
          hudNextLogo.src = logoPath;
          hudNextLogo.alt = GameState.league?.name || 'Competición';
          hudNextLogo.style.display = 'block';
        } else {
          hudNextLogo.style.display = 'none';
          hudNextLogo.removeAttribute('src');
          hudNextLogo.removeAttribute('alt');
        }
      }
      // HUB: bajo el botón PARTIDO, lo mismo pero un poco más grande
      if (hubNextHint) {
        hubNextHint.innerHTML = '';
        renderMatchLine(hubNextHint, fx, clubIndex, 22, club.id, { useShortName: true });
        const meta = document.createElement('div');
        meta.className = 'pcf-inline-match__meta';
        meta.textContent = `${compLine} • ${dateLabel} • ${timeLabel}`;
        hubNextHint.appendChild(meta);
      }
    }
  }

  // Notas rápidas (las mantiene medical.js)
  updateQuickNotes();
}