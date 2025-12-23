// js/ui.js

import {
  GameState,
  newGame,
  applyLoadedState,
  recomputeLeagueTable,
  applyStatsForFixtures,
} from './state.js';

import { initialLeague, allLeagues } from './data.js';
import { exportGameToFile, importGameFromFile } from './saveLoad.js';

import { showDashboard, setActiveSubview } from './ui/nav.js';
import { initNavigation } from './ui/navigation.js';

import { updateDashboard } from './ui/dashboard.js';

// Modal jugador (migrado a módulo)
import {
  initPlayerModal as initPlayerModalImpl,
  openPlayerModal as openPlayerModalImpl,
  closePlayerModal as closePlayerModalImpl,
} from './ui/modals/playerModal.js';

import {
  initMatchDetailModal as initMatchDetailModalImpl,
  openMatchDetailModal as openMatchDetailModalImpl,
  closeMatchDetailModal as closeMatchDetailModalImpl,
} from './ui/modals/matchDetailModal.js';

import {
  initCompetitionUI,
  updateCompetitionView,
  setCompetitionSelectedMatchday,
} from './ui/competition.js';

import { updateStatsView } from './ui/stats.js';

import { initMedicalUI, updateMedicalView, updateQuickNotes } from './ui/medical.js';

import { initSquadUI, bindSquadActions, updateSquadView } from './ui/squad.js';
import { getGameDateFor, getCurrentGameDate, formatGameDateLabel, getPlayerGameAge } from './ui/utils/calendar.js';
import { getFlagUrlForNationality, createFlagImgElement } from './ui/utils/flags.js';

import { initTacticsUI, updateTacticsView } from './ui/alignment.js';
import { ensureClubTactics, isPlayerInjuredNow, isPlayerSuspendedNow, isPlayerUnavailable } from './game/utils/index.js';

import { simulateCurrentMatchday } from './game/simulateMatchday.js';

import { handleFileInput } from './ui/saveLoadUI.js';

// ================================
// Estado UI
// ================================

// Plantilla: filtros/orden
let squadFilterPos = 'ALL';
let squadSortKey = 'POSITION';

// Ficha jugador / negociación
let currentModalPlayer = null;
let negYearsInput = null;
let negWageInput = null;
let negResultEl = null;
let negHintEl = null;
let negSectionEl = null;

// Competición
let competitionSelectedMatchday = 1;

// Modal detalle de partido
let currentMatchDetailFixtureId = null;

// ================================
// Init
// ================================

// --------------------------------
// Wrappers de modal (para que el resto del ui.js siga llamando igual)
// --------------------------------
function openPlayerModal(player) {
  if (!player) return;
  currentModalPlayer = player;
  openPlayerModalImpl(player);
}

function closePlayerModal() {
  closePlayerModalImpl();
  currentModalPlayer = null;
}

  // Modal detalle de partido (migrado)
  initMatchDetailModalImpl({
    onRequestClose: () => closeMatchDetailModal(),
  });

export function initUI() {
  const startScreen = document.getElementById('screen-start');
  const dashboardScreen = document.getElementById('screen-dashboard');

  const btnNewGame = document.getElementById('btn-new-game');
  const fileInputStart = document.getElementById('file-input-start');
  const fileInputIngame = document.getElementById('file-input-ingame');
  const btnSave = document.getElementById('btn-save');
  // Selectores de liga y club en pantalla de inicio
  const startLeagueSelect = document.getElementById('start-league-select');
  const startClubSelect = document.getElementById('start-club-select');
  const squadTableBody = document.getElementById('squad-table-body');

  // Rellenar selector de ligas en la pantalla de inicio
  if (startLeagueSelect) {
    const leagues =
      Array.isArray(allLeagues) && allLeagues.length > 0
        ? allLeagues
        : [initialLeague];

    startLeagueSelect.innerHTML = '';
    leagues.forEach((league) => {
      const opt = document.createElement('option');
      opt.value = league.id;
      opt.textContent = league.name || league.id;
      startLeagueSelect.appendChild(opt);
    });
  }

  function refreshStartClubSelect() {
    if (!startClubSelect) return;

    const leagues =
      Array.isArray(allLeagues) && allLeagues.length > 0
        ? allLeagues
        : [initialLeague];

    let selectedLeagueId =
      (startLeagueSelect && startLeagueSelect.value) || initialLeague.id;

    const league =
      leagues.find((l) => l.id === selectedLeagueId) || leagues[0];

    startClubSelect.innerHTML = '';

    if (league && Array.isArray(league.clubs)) {
      league.clubs.forEach((club) => {
        const opt = document.createElement('option');
        opt.value = club.id;
        opt.textContent = club.name || club.id;
        startClubSelect.appendChild(opt);
      });
    }
  }

  if (startLeagueSelect) {
    startLeagueSelect.addEventListener('change', () => {
      refreshStartClubSelect();
    });
  }

  // Inicializamos clubs según la liga por defecto
  refreshStartClubSelect();

  // Navegación
  const btnNavDashboard = document.getElementById('btn-nav-dashboard');
  const btnNavSquad = document.getElementById('btn-nav-squad');
  const btnNavTactics = document.getElementById('btn-nav-alignment');
  const btnNavCompetition = document.getElementById('btn-nav-competition');
  const btnNavStats = document.getElementById('btn-nav-stats');
  const btnNavMedical = document.getElementById('btn-nav-medical');

  const viewDashboard = document.getElementById('view-dashboard');
  const viewSquad = document.getElementById('view-squad');
  const viewTactics = document.getElementById('view-alignment');
  const viewCompetition = document.getElementById('view-competition');
  const viewStats = document.getElementById('view-stats');
  const viewMedical = document.getElementById('view-medical');

  // Plantilla
  const filterPosSelect = document.getElementById('squad-filter-pos');
  const sortSelect = document.getElementById('squad-sort');

  if (squadTableBody) {
     squadTableBody.addEventListener('click', (event) => {
      const target =
        event.target instanceof Element ? event.target : event.target?.parentElement;
      if (!target) return;

      // 1) Si se pulsa un botón de acción, respetamos la acción
      const btn = target.closest('button[data-action]');
      if (btn) {
        const action = btn.dataset.action;
        const tr = btn.closest('tr');
        const playerId = tr?.dataset.playerId;
        if (!playerId) return;

        const player = getPlayerById(playerId);
        if (!player) return;

        handlePlayerAction(action, player);
        return;
      }

      // 2) Si no es botón, click en la fila → abrir ficha
      const tr = target.closest('tr[data-player-id]');
      const playerId = tr?.dataset.playerId;
      if (!playerId) return;

      const player = getPlayerById(playerId);
      if (!player) return;

      openPlayerModal(player);
     });
   }
  
  // Modal detalle de partido
  const matchDetailModal = document.getElementById('match-detail-modal');
  const matchDetailModalBackdrop = document.getElementById('match-detail-modal-backdrop');
  const matchDetailModalClose = document.getElementById('match-detail-modal-close');
  const matchDetailModalCloseFooter = document.getElementById('match-detail-modal-close-footer');

  // Modal jugador
  const playerModal = document.getElementById('player-modal');
  const playerModalBackdrop = document.getElementById('player-modal-backdrop');
  const playerModalClose = document.getElementById('player-modal-close');
  const playerModalCloseFooter = document.getElementById(
    'player-modal-close-footer'
  );
  const playerModalGoRenew = document.getElementById('player-modal-go-renew');
  
  negYearsInput = document.getElementById('player-neg-years');
  negWageInput = document.getElementById('player-neg-wage');
  negResultEl = document.getElementById('player-modal-neg-result');
  negHintEl = document.getElementById('player-modal-neg-hint');
  negSectionEl = document.getElementById('player-modal-neg-section');
  const negSendBtn = document.getElementById('player-neg-send');

  // Competición
  const matchdaySelect = document.getElementById('competition-matchday-select');
  const simulateBtn = document.getElementById('btn-simulate-matchday');

  // Médicos
  const btnMedicalUpgradeCenter = document.getElementById(
    'btn-medical-upgrade-center'
  );
  const btnMedicalUpgradePhysio = document.getElementById(
    'btn-medical-upgrade-physio'
  );
  
  // Modal jugador (migrado)
  initPlayerModalImpl({
    onRequestClose: () => closePlayerModal(),
  });

  // -----------------
  // Nueva partida
  // -----------------

  btnNewGame.addEventListener('click', () => {
    // Leemos liga y club elegidos
    let selectedLeagueId = initialLeague.id;
    if (startLeagueSelect && startLeagueSelect.value) {
      selectedLeagueId = startLeagueSelect.value;
    }

    let selectedClubId = null;
    if (startClubSelect && startClubSelect.value) {
      selectedClubId = startClubSelect.value;
    }

    // Llamamos a newGame con los datos elegidos
    newGame({
      roleMode: 'TOTAL',
      leagueId: selectedLeagueId,
      clubId: selectedClubId,
    });

    // Resto del código igual que antes
    showDashboard(startScreen, dashboardScreen);

    const ctxNav = {
      viewDashboard,
      viewSquad,
      viewTactics,
      viewCompetition,
      viewStats,
      viewMedical,
      btnNavDashboard,
      btnNavSquad,
      btnNavTactics,
      btnNavCompetition,
      btnNavStats,	  
      btnNavMedical,
    };

    competitionSelectedMatchday = GameState.currentDate.matchday || 1;
    setCompetitionSelectedMatchday(competitionSelectedMatchday);

    setActiveSubview('dashboard', ctxNav);
    updateDashboard();
    updateSquadView();
    updateTacticsView();
    initCompetitionUI({
      initialMatchday: competitionSelectedMatchday,
      onOpenMatchDetail: (fixtureId) => openMatchDetailModal(fixtureId),
    });
    updateCompetitionView();
    updateMedicalView();
  });

  // -----------------
  // Cargar partida
  // -----------------

  const ctxForLoad = {
    viewDashboard,
    viewSquad,
    viewTactics,
    viewCompetition,
    viewStats,	
    viewMedical,
    btnNavDashboard,
    btnNavSquad,
    btnNavTactics,
    btnNavCompetition,
    btnNavStats,
    btnNavMedical,
  };
  
  // Handlers de navegación (tabs) fuera del monolito.
  initNavigation(ctxForLoad, {
    updateDashboard,
    updateSquadView,
    updateTacticsView,
    updateCompetitionView,
    updateStatsView,
    updateMedicalView,
  });  

  fileInputStart.addEventListener('change', (event) => {
    handleFileInput(event, startScreen, dashboardScreen, ctxForLoad, () => {
      // Lo que antes hacía handleFileInput por dentro, ahora lo decide ui.js
      showDashboard(startScreen, dashboardScreen);
      competitionSelectedMatchday = GameState.currentDate.matchday || 1;
      setActiveSubview('dashboard', ctxForLoad);
      updateDashboard();
      updateSquadView();
      updateTacticsView();
      updateCompetitionView();
      updateStatsView();
      updateMedicalView();
    });
  });

  fileInputIngame.addEventListener('change', (event) => {
    handleFileInput(event, startScreen, dashboardScreen, ctxForLoad, () => {
      showDashboard(startScreen, dashboardScreen);
      competitionSelectedMatchday = GameState.currentDate.matchday || 1;
      setActiveSubview('dashboard', ctxForLoad);
      updateDashboard();
      updateSquadView();
      updateTacticsView();
      updateCompetitionView();
      updateStatsView();
      updateMedicalView();
    });
  });

  // -----------------
  // Guardar
  // -----------------

  btnSave.addEventListener('click', () => {
    try {
      exportGameToFile();
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar la partida: ' + err.message);
    }
  });

  // Navegación: migrada a ui/navigation.js

  // -----------------
  // Plantilla
  // -----------------

 // (migrado a ui/squad.js) listener de acciones + filtros/ordenación de Plantilla

  // -----------------
  // Modal jugador
  // -----------------

// (listeners de cierre migrados a ui/modals/playerModal.js)
  
// (listeners de cierre migrados a ui/modals/matchDetailModal.js)

  if (playerModalGoRenew) {
    playerModalGoRenew.addEventListener('click', () => {
      if (!currentModalPlayer) return;
      prepareNegotiationUI(currentModalPlayer);
      scrollToNegotiationSection();
    });
  }

  if (negSendBtn) {
    negSendBtn.addEventListener('click', () => {
      if (!currentModalPlayer) {
        alert('No se ha podido identificar al jugador.');
        return;
      }
      attemptRenewal(currentModalPlayer);
      updateSquadView();
      openPlayerModal(currentModalPlayer);
      scrollToNegotiationSection();
    });
  }

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (playerModal && !playerModal.classList.contains('hidden')) {
      closePlayerModal();
    }
    if (matchDetailModal && !matchDetailModal.classList.contains('hidden')) {
      closeMatchDetailModal();
    }
  }
});

  // -----------------
  // Táctica y alineación
  // -----------------

 initTacticsUI();

  // -----------------
  // Médicos: upgrades
  // -----------------

  initMedicalUI({
    onAfterUpgrade: () => {
      updateDashboard();
      updateMedicalView();
    },
  });

  // -----------------
  // Competición
  // -----------------

  if (matchdaySelect) {
    matchdaySelect.addEventListener('change', () => {
      const md = Number.parseInt(matchdaySelect.value, 10);
      if (Number.isFinite(md) && md >= 1) {
        competitionSelectedMatchday = md;
        setCompetitionSelectedMatchday(md);
        updateCompetitionView();
      }
    });
  }

  if (simulateBtn) {
    simulateBtn.addEventListener('click', () => {
      try {
        simulateCurrentMatchday();
      } catch (err) {
        console.error(err);
        alert(err?.message || 'No se pudo simular la jornada.');
        return;
      }
      // Mantener la jornada seleccionada alineada con la jornada actual
      try {
        setCompetitionSelectedMatchday(GameState.currentDate?.matchday || 1);
      } catch (_) {}
      updateCompetitionView();
      updateMedicalView();
    });
  }
}

// (LEGACY) migrado a ./ui/saveLoadUI.js
function handleFileInputLegacy(event, startScreen, dashboardScreen, ctx) {
  const input = event.target;
  const file = input.files && input.files[0];
  if (!file) return;

  importGameFromFile(
    file,
    (rawState) => {
      try {
        applyLoadedState(rawState);
        showDashboard(startScreen, dashboardScreen);
        competitionSelectedMatchday = GameState.currentDate.matchday || 1;
        setActiveSubview('dashboard', ctx);
        updateDashboard();
        updateSquadView();
        updateTacticsView();
        updateCompetitionView();
        updateStatsView();
        updateMedicalView();
      } catch (err) {
        console.error(err);
        alert('El archivo no parece ser una partida válida.');
      } finally {
        input.value = '';
      }
    },
    (error) => {
      console.error(error);
      alert('Error al cargar la partida: ' + error.message);
      input.value = '';
    }
  );
}

// ================================
// Dashboard (LEGACY) — migrado a ./ui/dashboard.js
// ================================
function updateDashboardLegacy() {
  const club = getUserClub();
  if (!club) return;

  const clubNameTop = document.getElementById('club-name');
  const leagueName = document.getElementById('league-name');
  const seasonLabel = document.getElementById('season-label');
  const matchdayLabel = document.getElementById('matchday-label');

  const clubNameMain = document.getElementById('club-name-main');
  const stadiumName = document.getElementById('stadium-name');
  const stadiumCapacity = document.getElementById('stadium-capacity');
  const cashLabel = document.getElementById('cash-label');
  const wageLabel = document.getElementById('wage-label');

  if (clubNameMain) {
    clubNameMain.textContent = '';
    const coat = createCoatImgElement(club.id, club.name, 24);
    if (coat) {
      clubNameMain.appendChild(coat);
    }
    const nameSpan = document.createElement('span');
    nameSpan.textContent = club.name;
    clubNameMain.appendChild(nameSpan);
  }
  leagueName.textContent = GameState.league.name || 'Liga desconocida';

  seasonLabel.textContent = `Temporada ${GameState.currentDate.season}`;
  matchdayLabel.textContent = `Jornada ${GameState.currentDate.matchday}`;

  if (clubNameMain) {
    // Contenedor: escudo + nombre
    clubNameMain.classList.add('club-with-coat');
    clubNameMain.textContent = '';

    const coatImg = createCoatImgElement(club.id, club.name, 24);
    if (coatImg) {
      clubNameMain.appendChild(coatImg);
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = club.name;
    clubNameMain.appendChild(nameSpan);
  }
  stadiumName.textContent = club.stadium?.name || 'Estadio sin nombre';
  stadiumCapacity.textContent =
    club.stadium?.capacity?.toLocaleString('es-ES') || '-';

  cashLabel.textContent = formatCurrency(club.cash ?? 0);
  wageLabel.textContent = formatCurrency(club.wageBudget ?? 0);
  
  updateQuickNotes();
}

// ================================
// Plantilla (LEGACY: ya migrado a ./ui/squad.js)
// ================================
// OJO: NO usar desde el flujo actual. Se deja temporalmente por referencia.
function updateSquadViewLegacy() {
  const club = getUserClub();
  const tbody = document.getElementById('squad-table-body');
  const squadCountLabel = document.getElementById('squad-count-label');

  if (!tbody || !squadCountLabel) return;

  tbody.innerHTML = '';

  const players = Array.isArray(club?.players) ? club.players : [];
  const filtered = players.filter((p) =>
    matchesPositionFilter(p.position, squadFilterPos)
  );
  const sorted = [...filtered].sort((a, b) => comparePlayers(a, b, squadSortKey));

  squadCountLabel.textContent = `${sorted.length} jugador${
    sorted.length === 1 ? '' : 'es'
  } en plantilla`;

  if (sorted.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 9;
    td.textContent = 'Este club aún no tiene jugadores registrados.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  sorted.forEach((p) => {
    const tr = document.createElement('tr');
    tr.dataset.playerId = p.id;

    const tdPos = document.createElement('td');
    tdPos.textContent = p.position || '-';

    const tdName = document.createElement('td');
    tdName.classList.add('squad-player-name-cell');
    const nameFlag = createFlagImgElement(p.nationality);
    if (nameFlag) {
      tdName.appendChild(nameFlag);
    }
    const nameSpan = document.createElement('span');
    nameSpan.textContent = p.name || 'Jugador sin nombre';
    tdName.appendChild(nameSpan);

    const tdAge = document.createElement('td');
    const age = getPlayerGameAge(p);
    tdAge.textContent = age != null ? String(age) : '-';

    const tdOverall = document.createElement('td');
    tdOverall.textContent =
      p.overall != null ? String(p.overall) : '-';

    const tdWage = document.createElement('td');
    tdWage.textContent = formatCurrency(p.wage ?? 0);

    const tdContract = document.createElement('td');
    tdContract.textContent =
      p.contractYears != null
        ? `${p.contractYears} año${p.contractYears === 1 ? '' : 's'}`
        : '-';

    const tdMorale = document.createElement('td');
    tdMorale.classList.add('squad-metric');
    tdMorale.textContent = formatPercent(p.morale);

    const tdFitness = document.createElement('td');
    tdFitness.classList.add('squad-metric');
    tdFitness.textContent = formatPercent(p.fitness);

    const tdActions = document.createElement('td');
    tdActions.classList.add('squad-actions');
    const transferLabel = p.transferListed ? 'Quitar mercado' : 'Transferible';
    tdActions.innerHTML = `
      <button class="btn btn-xs btn-secondary" data-action="details">Ficha</button>
      <button class="btn btn-xs btn-secondary" data-action="renew">Renovar</button>
      <button class="btn btn-xs btn-secondary" data-action="transfer">${transferLabel}</button>
    `;

    const injured = isPlayerInjuredNow(p);
    const suspended = isPlayerSuspendedNow(p);
    const unavailable = injured || suspended;

    if (unavailable) {
      tr.classList.add('row-disabled');
      const statusParts = [];
      if (injured) {
        statusParts.push(
          `Lesionado: ${p.injury.type} (${p.injury.matchesRemaining} jornadas restantes)`
        );
      }
      if (suspended) {
        statusParts.push(
          `Sancionado (${p.suspension.matchesRemaining} partido/s)`
        );
      }
      tdName.title = statusParts.join(' · ');
    }

    tr.appendChild(tdPos);
    tr.appendChild(tdName);
    tr.appendChild(tdAge);
    tr.appendChild(tdOverall);
    tr.appendChild(tdWage);
    tr.appendChild(tdContract);
    tr.appendChild(tdMorale);
    tr.appendChild(tdFitness);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

function matchesPositionFilter(position, filter) {
  if (!filter || filter === 'ALL') return true;
  const pos = (position || '').toUpperCase();

  switch (filter) {
    case 'POR':
      return pos === 'POR' || pos === 'GK';
    case 'DEF':
      return (
        pos.startsWith('D') ||
        pos === 'DF' ||
        pos === 'LD' ||
        pos === 'LI' ||
        pos === 'CB' ||
        pos === 'RB' ||
        pos === 'LB'
      );
    case 'MED':
      return pos.startsWith('M') || pos === 'CM' || pos === 'DM' || pos === 'AM';
    case 'DEL':
      return (
        pos === 'DC' ||
        pos === 'DL' ||
        pos === 'ED' ||
        pos === 'EI' ||
        pos === 'ST' ||
        pos === 'FW' ||
        pos === 'CF'
      );
    default:
      return true;
  }
}

function comparePlayers(a, b, key) {
  switch (key) {
    case 'NAME':
      return (a.name || '').localeCompare(b.name || '');
    case 'AGE': {
      const ageA = getPlayerGameAge(a, 0) ?? 0;
      const ageB = getPlayerGameAge(b, 0) ?? 0;
      return ageA - ageB;
    }
    case 'OVERALL':
      return (b.overall ?? 0) - (a.overall ?? 0);
    case 'WAGE':
      return (b.wage ?? 0) - (a.wage ?? 0);
    case 'MORALE':
      return (b.morale ?? 0) - (a.morale ?? 0);
    case 'FITNESS':
      return (b.fitness ?? 0) - (a.fitness ?? 0);
    case 'POSITION':
    default:
      const gA = getPositionGroup(a.position);
      const gB = getPositionGroup(b.position);
      if (gA !== gB) return gA - gB;
      return (a.name || '').localeCompare(b.name || '');
  }
}

function getPositionGroup(position) {
  const pos = (position || '').toUpperCase();
  if (pos === 'POR' || pos === 'GK') return 0;
  if (
    pos.startsWith('D') ||
    pos === 'DF' ||
    pos === 'LD' ||
    pos === 'LI' ||
    pos === 'CB' ||
    pos === 'RB' ||
    pos === 'LB'
  )
    return 1;
  if (pos.startsWith('M') || pos === 'CM' || pos === 'DM' || pos === 'AM')
    return 2;
  if (
    pos === 'DC' ||
    pos === 'DL' ||
    pos === 'ED' ||
    pos === 'EI' ||
    pos === 'ST' ||
    pos === 'FW' ||
    pos === 'CF'
  )
    return 3;
  return 4;
}

// ================================
// Helpers PCF: parámetros / banderas
// ================================
function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
function avgNums(...vals) {
  const nums = vals
    .filter((v) => v != null && Number.isFinite(Number(v)))
    .map((v) => Number(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
function ratingFrom01(v) {
  return Math.round(50 + clamp01(v) * 50);
}
function getRoleCodeFromPosition(position) {
  const g = getPositionGroup(position);
  if (g === 0) return 'POR';
  if (g === 1) return 'DEF';
  if (g === 2) return 'MED';
  if (g === 3) return 'DEL';
  return '-';
}
function getPcfParamsForPlayer(player) {
  const p = player || {};
  const tech = p.attributes?.technical || {};
  const ment = p.attributes?.mental || {};
  const phys = p.attributes?.physical || {};
  const CF = avgNums(phys.pace, phys.stamina, phys.strength);
  const CM = avgNums(ment.vision, ment.composure, ment.workRate, ment.leadership);
  const CD = avgNums(tech.tackling, phys.strength, ment.workRate, ment.composure);
  const CO = avgNums(tech.shooting, tech.dribbling, tech.passing, ment.vision);
  const cf = CF == null ? null : Math.round(CF);
  const cm = CM == null ? null : Math.round(CM);
  const cd = CD == null ? null : Math.round(CD);
  const co = CO == null ? null : Math.round(CO);
  const ME = avgNums(cf, cm, cd, co);
  const me = ME == null ? null : Math.round(ME);
  const role = getRoleCodeFromPosition(p.position);
  const dem = (p.position || '-').toUpperCase();
  const EN = p.overall != null ? Math.round(Number(p.overall)) : (me ?? 60);
  const MO = ratingFrom01(p.morale);
  const EF = ratingFrom01(p.fitness);
  return { EN, CF: cf, CM: cm, CD: cd, CO: co, MO, EF, ME: me, role, dem };
}
function normalizeKey(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
function isoToFlagEmoji(iso2) {
  const code = String(iso2 || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + (code.charCodeAt(0) - 65),
    A + (code.charCodeAt(1) - 65)
  );
}

// ================================
// Medicina
// ================================

/**
 * Asegura que el club tiene configuración médica.
 */
function ensureClubMedical(club) {
  if (!club.medical) {
    club.medical = {
      centerLevel: 1,
      physioLevel: 1,
    };
  } else {
    if (club.medical.centerLevel == null) club.medical.centerLevel = 1;
    if (club.medical.physioLevel == null) club.medical.physioLevel = 1;
  }
}

/**
 * Devuelve el mejor once (hasta 11) excluyendo lesionados/sancionados.
 */
function getBestLineupForClub(club) {
  if (!club || !Array.isArray(club.players)) return [];
  const available = club.players.filter((p) => !isPlayerUnavailable(p));
  const unavailable = club.players.filter((p) => isPlayerUnavailable(p));

  const sortedAvail = available
    .slice()
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  const lineupIds = sortedAvail.slice(0, 11).map((p) => p.id);

  if (lineupIds.length < 11 && unavailable.length > 0) {
    const missing = 11 - lineupIds.length;
    const sortedUnavail = unavailable
      .slice()
      .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
    lineupIds.push(...sortedUnavail.slice(0, missing).map((p) => p.id));
  }

  return lineupIds;
}

// ================================
// Ficha jugador / negociación
// ================================

function getUserClub() {
  const clubId = GameState.user.clubId;
  if (!Array.isArray(GameState.clubs) || GameState.clubs.length === 0)
    return null;
  if (!clubId) return GameState.clubs[0];
  return GameState.clubs.find((c) => c.id === clubId) || GameState.clubs[0];
}

function getClubById(id) {
  return (GameState.clubs || []).find((c) => c.id === id) || null;
}

function getPlayerById(playerId) {
  const club = getUserClub();
  if (!club || !Array.isArray(club.players)) return null;
  return club.players.find((p) => p.id === playerId) || null;
}

function handlePlayerAction(action, player) {
  switch (action) {
    case 'details':
      openPlayerModal(player);
      break;
    case 'renew':
      openPlayerModal(player);
      prepareNegotiationUI(player);
      scrollToNegotiationSection();
      break;
    case 'transfer':
      toggleTransferListed(player);
      renderSquadView();
      if (currentModalPlayer && currentModalPlayer.id === player.id) {
        openPlayerModal(player);
      }
      break;
    default:
      console.log('Acción no soportada:', action, player);
  }
}

function openPlayerModalLegacy(player) {
  currentModalPlayer = player;
  openPlayerModalImpl(player);
  // Mantener tu flujo de negociación tal cual
  prepareNegotiationUI(player);
}

function computePlayerSeasonStats(player) {
  const season = GameState.currentDate?.season || 1;
  const fixtures = GameState.fixtures || [];

  let goals = 0;
  let yellows = 0;
  let reds = 0;

  // Goles a partir de los eventos de partido
  fixtures.forEach((fx) => {
    if (!fx || !fx.played || !Array.isArray(fx.events)) return;

    // En el futuro se podría filtrar por fx.season; de momento asumimos una temporada
    fx.events.forEach((ev) => {
      if (!ev || ev.type !== 'GOAL') return;
      if (ev.playerId === player.id) {
        goals += 1;
      }
    });
  });

  // Tarjetas desde el historial de disciplina del jugador
  const history = Array.isArray(player.disciplineHistory)
    ? player.disciplineHistory
    : [];
  history.forEach((ev) => {
    if (!ev) return;
    if (ev.season != null && ev.season !== season) return;
    if (ev.type === 'Y') yellows += 1;
    if (ev.type === 'R') reds += 1;
  });

  return {
    season,
    goals,
    yellows,
    reds,
  };
}

function closePlayerModalLegacy() {
  closePlayerModalImpl();
  currentModalPlayer = null;
}

function openMatchDetailModal(fixtureId) {
  currentMatchDetailFixtureId = fixtureId;
  openMatchDetailModalImpl(fixtureId);
}

function closeMatchDetailModal() {
  closeMatchDetailModalImpl();
  currentMatchDetailFixtureId = null;
}

function prepareNegotiationUI(player) {
  if (!negYearsInput || !negWageInput || !negResultEl || !negHintEl) return;

  const currentYears = player.contractYears ?? 2;
  const currentWage = player.wage ?? 200_000;

  const defaultYears = Math.min(5, Math.max(1, currentYears + 1));
  negYearsInput.value = String(defaultYears);

  const defaultWage = Math.round((currentWage * 1.15) / 1000) * 1000;
  negWageInput.value = String(defaultWage);

  negResultEl.textContent = '';
  negResultEl.classList.remove(
    'modal-neg-result--accept',
    'modal-neg-result--reject'
  );

  negHintEl.textContent =
    'El jugador espera una oferta acorde a su nivel y situación. ' +
    'Una mejora demasiado baja puede ser rechazada.';
}

function attemptRenewal(player) {
  if (!negYearsInput || !negWageInput || !negResultEl) return;

  const years = Number.parseInt(negYearsInput.value, 10);
  const wage = Number.parseInt(negWageInput.value, 10);

  if (!Number.isFinite(years) || years <= 0) {
    negResultEl.textContent = 'Introduce un número de años válido.';
    negResultEl.classList.remove(
      'modal-neg-result--accept',
      'modal-neg-result--reject'
    );
    return;
  }

  if (!Number.isFinite(wage) || wage <= 0) {
    negResultEl.textContent = 'Introduce un sueldo válido.';
    negResultEl.classList.remove(
      'modal-neg-result--accept',
      'modal-neg-result--reject'
    );
    return;
  }

  const result = evaluateOffer(player, years, wage);

  if (result.accepted) {
    player.contractYears = years;
    player.wage = wage;
    player.morale = Math.min(1, (player.morale ?? 0.7) + 0.12);

    negResultEl.textContent =
      'El jugador acepta la oferta y firma la renovación.';
    negResultEl.classList.remove('modal-neg-result--reject');
    negResultEl.classList.add('modal-neg-result--accept');
  } else {
    player.morale = Math.max(0, (player.morale ?? 0.7) - 0.08);

    negResultEl.textContent =
      result.reason ||
      'El jugador rechaza la oferta. Quizá necesite una mejora más atractiva.';
    negResultEl.classList.remove('modal-neg-result--accept');
    negResultEl.classList.add('modal-neg-result--reject');
  }
}

function evaluateOffer(player, years, wage) {
  const currentWage = player.wage ?? 200_000;
  const overall = player.overall ?? 60;
  const age = getPlayerGameAge(player, 26);
  const morale = player.morale ?? 0.7;

  const levelFactor = 1 + (overall - 60) / 200;
  const minRaiseFactor = Math.max(1.05, levelFactor);
  const requiredWage = currentWage * minRaiseFactor;

  let yearsAcceptable = true;
  if (age < 25) yearsAcceptable = years >= 3;
  else if (age > 32) yearsAcceptable = years <= 2;
  else yearsAcceptable = years >= 2 && years <= 4;

  if (!yearsAcceptable) {
    return {
      accepted: false,
      reason:
        'La duración del contrato no encaja con los planes del jugador.',
    };
  }

  if (wage < requiredWage) {
    return {
      accepted: false,
      reason:
        'El jugador considera que la mejora salarial es insuficiente para renovar.',
    };
  }

  const baseChance = 0.7 + (morale - 0.5);
  const random = Math.random();

  if (random < baseChance) {
    return { accepted: true };
  }

  return {
    accepted: false,
    reason:
      'El jugador duda sobre su futuro y decide no aceptar esta propuesta por ahora.',
  };
}

function toggleTransferListed(player) {
  player.transferListed = !player.transferListed;
  if (player.transferListed) {
    player.morale = Math.max(0, (player.morale ?? 0.7) - 0.05);
  } else {
    player.morale = Math.min(1, (player.morale ?? 0.7) + 0.03);
  }
}

function scrollToNegotiationSection() {
  if (!negSectionEl) return;
  negSectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ================================
// Competición + simulador
// ================================

function updateCompetitionViewLegacy() {
  const fixtures = GameState.fixtures || [];
  const maxMatchday =
    GameState.competition?.maxMatchday ||
    (fixtures.length
      ? Math.max(...fixtures.map((f) => f.matchday || 1))
      : 1);

  if (competitionSelectedMatchday < 1) competitionSelectedMatchday = 1;
  if (competitionSelectedMatchday > maxMatchday)
    competitionSelectedMatchday = maxMatchday;

  const seasonLabel = document.getElementById('competition-season-label');
  const currentMdLabel = document.getElementById(
    'competition-current-matchday-label'
  );
  const dateLabel = document.getElementById('competition-date-label');
  const matchdaySelect = document.getElementById('competition-matchday-select');
  const simulateBtn = document.getElementById('btn-simulate-matchday');

  if (seasonLabel) {
    seasonLabel.textContent = String(GameState.currentDate.season || 1);
  }
  if (currentMdLabel) {
    currentMdLabel.textContent = String(GameState.currentDate.matchday || 1);
  }
  if (dateLabel) {
    const season = GameState.currentDate.season || 1;
    const mdForLabel =
      competitionSelectedMatchday || GameState.currentDate.matchday || 1;
    const gameDate = getGameDateFor(season, mdForLabel);
    dateLabel.textContent = `Jornada ${mdForLabel} – ${formatGameDateLabel(gameDate)}`;
  }

  if (matchdaySelect) {
    matchdaySelect.innerHTML = '';
    for (let md = 1; md <= maxMatchday; md++) {
      const opt = document.createElement('option');
      opt.value = String(md);
      opt.textContent = `Jornada ${md}`;
      if (md === competitionSelectedMatchday) opt.selected = true;
      matchdaySelect.appendChild(opt);
    }
  }

  renderFixturesForMatchday(competitionSelectedMatchday);
  renderLeagueTable();
  renderTopScorers();

  if (simulateBtn) {
    const currentMd = GameState.currentDate.matchday || 1;
    const currentFixtures = fixtures.filter(
      (f) => f.matchday === currentMd && !f.played
    );
    const anyUnplayed = currentFixtures.length > 0;
    const anyFixturesAtAll = fixtures.length > 0;

    simulateBtn.disabled = !anyUnplayed || !anyFixturesAtAll;
    if (!anyFixturesAtAll) {
      simulateBtn.textContent = 'No hay calendario';
    } else if (!anyUnplayed) {
      simulateBtn.textContent = 'Jornada ya simulada';
    } else {
      simulateBtn.textContent = 'Simular jornada actual';
    }
  }
}

function renderFixturesForMatchday(matchday) {
  const tbody = document.getElementById('competition-fixtures-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const fixtures = (GameState.fixtures || []).filter(
    (f) => f.matchday === matchday
  );
  const clubsMap = new Map(
    (GameState.clubs || []).map((c) => [c.id, c.name || 'Club'])
  );

  if (fixtures.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'No hay partidos en esta jornada.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  fixtures.forEach((fx) => {
    const tr = document.createElement('tr');

    const tdTime = document.createElement('td');
    tdTime.textContent = '18:00';

    const tdHome = document.createElement('td');
    tdHome.classList.add('club-with-coat');
    const homeName = clubsMap.get(fx.homeClubId) || 'Local';
    const homeCoat = createCoatImgElement(fx.homeClubId, homeName);
    if (homeCoat) {
      tdHome.appendChild(homeCoat);
    }
    {
      const span = document.createElement('span');
      span.textContent = homeName;
      tdHome.appendChild(span);
    }

    const tdScore = document.createElement('td');
    if (fx.played && fx.homeGoals != null && fx.awayGoals != null) {
      tdScore.textContent = `${fx.homeGoals} - ${fx.awayGoals}`;
    } else {
      tdScore.textContent = '-';
    }

    const tdAway = document.createElement('td');
    tdAway.classList.add('club-with-coat');
    const awayName = clubsMap.get(fx.awayClubId) || 'Visitante';
    const awayCoat = createCoatImgElement(fx.awayClubId, awayName);
    if (awayCoat) {
      tdAway.appendChild(awayCoat);
    }
    {
      const span = document.createElement('span');
      span.textContent = awayName;
      tdAway.appendChild(span);
    }

    const tdDetail = document.createElement('td');
    const btnDetail = document.createElement('button');
    btnDetail.type = 'button';
    btnDetail.className = 'btn btn-link btn-small';
    btnDetail.textContent = 'Ver';
    btnDetail.disabled = !fx.played;
    btnDetail.addEventListener('click', () => {
      openMatchDetailModal(fx.id);
    });
    tdDetail.appendChild(btnDetail);

    tr.appendChild(tdTime);
    tr.appendChild(tdHome);
    tr.appendChild(tdScore);
    tr.appendChild(tdAway);
    tr.appendChild(tdDetail);

    tbody.appendChild(tr);
  });
}

function renderLeagueTable() {
  const tbody = document.getElementById('competition-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const table = (GameState.leagueTable || []).slice();

  if (table.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 10;
    td.textContent = 'La clasificación aún no está disponible.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  table.forEach((row, index) => {
    const tr = document.createElement('tr');

    const posTd = document.createElement('td');
    posTd.textContent = String(index + 1);

    const nameTd = document.createElement('td');
    nameTd.classList.add('club-with-coat');
    const clubName = row.name || 'Club';
    const coat = createCoatImgElement(row.clubId, clubName);
    if (coat) {
      nameTd.appendChild(coat);
    }
    {
      const span = document.createElement('span');
      span.textContent = clubName;
      nameTd.appendChild(span);
    }

    const pjTd = document.createElement('td');
    pjTd.textContent = String(row.played);

    const gTd = document.createElement('td');
    gTd.textContent = String(row.won);

    const eTd = document.createElement('td');
    eTd.textContent = String(row.draw);

    const pTd = document.createElement('td');
    pTd.textContent = String(row.lost);

    const gfTd = document.createElement('td');
    gfTd.textContent = String(row.goalsFor);

    const gcTd = document.createElement('td');
    gcTd.textContent = String(row.goalsAgainst);

    const dgTd = document.createElement('td');
    const gd = row.goalsFor - row.goalsAgainst;
    dgTd.textContent = gd >= 0 ? `+${gd}` : String(gd);

    const ptsTd = document.createElement('td');
    ptsTd.textContent = String(row.points);

    tr.appendChild(posTd);
    tr.appendChild(nameTd);
    tr.appendChild(pjTd);
    tr.appendChild(gTd);
    tr.appendChild(eTd);
    tr.appendChild(pTd);
    tr.appendChild(gfTd);
    tr.appendChild(gcTd);
    tr.appendChild(dgTd);
    tr.appendChild(ptsTd);

    tbody.appendChild(tr);
  });
}

function renderTopScorers() {
  const tbody = document.getElementById('competition-topscorers-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const fixtures = GameState.fixtures || [];
  const clubs = GameState.clubs || [];

  const playerIndex = new Map();
  clubs.forEach((club) => {
    (club.players || []).forEach((p) => {
      playerIndex.set(p.id, { player: p, club });
    });
  });

  const goalsMap = new Map();

  fixtures.forEach((fx) => {
    if (!fx.played || !Array.isArray(fx.events)) return;
    fx.events.forEach((ev) => {
      if (ev.type !== 'GOAL' || !ev.playerId) return;
      const info = playerIndex.get(ev.playerId);
      if (!info) return;

      let rec = goalsMap.get(ev.playerId);
      if (!rec) {
        rec = {
          playerId: ev.playerId,
          name: info.player.name || 'Jugador',
          clubName: info.club.shortName || info.club.name || info.club.id,
          goals: 0,
        };
        goalsMap.set(ev.playerId, rec);
      }
      rec.goals += 1;
    });
  });

  const list = Array.from(goalsMap.values());
  if (list.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'Todavía no hay goleadores registrados.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  list.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.name.localeCompare(b.name);
  });

  const top = list.slice(0, 10);
  top.forEach((rec, index) => {
    const tr = document.createElement('tr');

    const posTd = document.createElement('td');
    posTd.textContent = String(index + 1);

    const nameTd = document.createElement('td');
    nameTd.textContent = rec.name;

    const clubTd = document.createElement('td');
    clubTd.textContent = rec.clubName;

    const goalsTd = document.createElement('td');
    goalsTd.textContent = String(rec.goals);

    tr.appendChild(posTd);
    tr.appendChild(nameTd);
    tr.appendChild(clubTd);
    tr.appendChild(goalsTd);

    tbody.appendChild(tr);
  });
}

// ================================
// Vista Estadísticas
// ================================
function updateStatsViewLegacy() {
  const season = GameState.currentDate?.season || 1;
  const label = document.getElementById('stats-season-label');
  if (label) label.textContent = String(season);

  const topBody = document.getElementById('stats-topscorers-body');
  const teamBody = document.getElementById('stats-team-body');
  if (!topBody || !teamBody) return;

  const key = String(season);
  const clubs = GameState.clubs || [];

  const all = [];
  clubs.forEach((club) => {
    (club.players || []).forEach((p) => {
      const st = p?.stats?.[key];
      const goals = st?.goals ?? 0;
      const minutes = st?.minutes ?? 0;
      if (goals > 0 || minutes > 0) {
        all.push({
          player: p,
          club,
          goals,
          minutes,
        });
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
      <td>${row.player?.name || 'Jugador'}</td>
      <td>${row.club?.shortName || row.club?.name || ''}</td>
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

  const myClub = getUserClub();
  teamBody.innerHTML = '';
  if (!myClub) return;

  const rows = (myClub.players || []).map((p) => {
    const st = p?.stats?.[key] || {};
    return {
      p,
      apps: st.apps || 0,
      minutes: st.minutes || 0,
      goals: st.goals || 0,
      yellows: st.yellows || 0,
      reds: st.reds || 0,
    };
  });
  rows.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return (b.minutes || 0) - (a.minutes || 0);
  });

  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.p?.position || ''}</td>
      <td>${r.p?.name || 'Jugador'}</td>
      <td>${r.apps}</td>
      <td>${r.minutes}</td>
      <td><strong>${r.goals}</strong></td>
      <td>${r.yellows}</td>
      <td>${r.reds}</td>
    `;
    teamBody.appendChild(tr);
  });
}

// ================================
// Pantalla MÉDICOS (LEGACY) — migrado a ./ui/medical.js
// ================================
function updateMedicalViewLegacy() {
  const club = getUserClub();
  if (!club) return;
  ensureClubMedical(club);

  const centerLevelEl = document.getElementById('medical-center-level');
  const physioLevelEl = document.getElementById('medical-physio-level');
  const centerDescEl = document.getElementById('medical-center-desc');
  const physioDescEl = document.getElementById('medical-physio-desc');
  const centerCostEl = document.getElementById('medical-center-next-cost');
  const physioCostEl = document.getElementById('medical-physio-next-cost');
  const injBody = document.getElementById('medical-injuries-body');
  const sancBody = document.getElementById('medical-sanctions-body');

  const centerLevel = club.medical.centerLevel ?? 1;
  const physioLevel = club.medical.physioLevel ?? 1;

  if (centerLevelEl) centerLevelEl.textContent = `Nivel ${centerLevel}`;
  if (physioLevelEl) physioLevelEl.textContent = `Nivel ${physioLevel}`;

  if (centerDescEl) {
    centerDescEl.textContent = describeCenterLevel(centerLevel);
  }
  if (physioDescEl) {
    physioDescEl.textContent = describePhysioLevel(physioLevel);
  }

  if (centerCostEl) {
    const nextCost = centerLevel >= 4 ? null : getMedicalUpgradeCost('center', centerLevel);
    centerCostEl.textContent = nextCost
      ? `Próx. mejora: ${formatCurrency(nextCost)}`
      : 'Nivel máximo alcanzado';
  }

  if (physioCostEl) {
    const nextCost = physioLevel >= 4 ? null : getMedicalUpgradeCost('physio', physioLevel);
    physioCostEl.textContent = nextCost
      ? `Próx. mejora: ${formatCurrency(nextCost)}`
      : 'Nivel máximo alcanzado';
  }

  // Tabla de lesiones
  if (injBody) {
    injBody.innerHTML = '';
    const injured = (club.players || []).filter((p) => isPlayerInjuredNow(p));
    if (injured.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = 'No hay jugadores lesionados.';
      tr.appendChild(td);
      injBody.appendChild(tr);
    } else {
      injured.forEach((p) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = p.name || 'Jugador';

        const tdPos = document.createElement('td');
        tdPos.textContent = p.position || '-';

        const tdType = document.createElement('td');
        tdType.textContent = p.injury?.type || '-';

        const tdMatches = document.createElement('td');
        tdMatches.textContent =
          p.injury?.matchesRemaining != null
            ? String(p.injury.matchesRemaining)
            : '-';

        tr.appendChild(tdName);
        tr.appendChild(tdPos);
        tr.appendChild(tdType);
        tr.appendChild(tdMatches);

        injBody.appendChild(tr);
      });
    }
  }

  // Tabla de sanciones
  if (sancBody) {
    sancBody.innerHTML = '';
    const sanctioned = (club.players || []).filter((p) => isPlayerSuspendedNow(p));
    if (sanctioned.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'No hay jugadores sancionados.';
      tr.appendChild(td);
      sancBody.appendChild(tr);
    } else {
      sanctioned.forEach((p) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = p.name || 'Jugador';

        const tdPos = document.createElement('td');
        tdPos.textContent = p.position || '-';

        const tdReason = document.createElement('td');
        tdReason.textContent = p.suspension?.type || '-';

        const tdMatches = document.createElement('td');
        tdMatches.textContent =
          p.suspension?.matchesRemaining != null
            ? String(p.suspension.matchesRemaining)
            : '-';

        const tdYc = document.createElement('td');
        tdYc.textContent = String(p.yellowCards ?? 0);

        tr.appendChild(tdName);
        tr.appendChild(tdPos);
        tr.appendChild(tdReason);
        tr.appendChild(tdMatches);
        tr.appendChild(tdYc);

        sancBody.appendChild(tr);
      });
    }
  }
  updateQuickNotes();
}

function updateQuickNotesLegacy() {
  const list = document.getElementById('quick-notes');
  if (!list) return;

  const club = getUserClub();
  if (!club) {
    list.innerHTML = `
      <li>Versión prototipo del juego.</li>
      <li>Sin información de club disponible todavía.</li>
    `;
    return;
  }

  ensureClubMedical(club);

  const players = Array.isArray(club.players) ? club.players : [];
  const injured = players.filter((p) => isPlayerInjuredNow(p));
  const sanctioned = players.filter((p) => isPlayerSuspendedNow(p));

  const centerLevel = club.medical?.centerLevel ?? 1;
  const physioLevel = club.medical?.physioLevel ?? 1;

  // Limpiamos contenido actual
  list.innerHTML = '';

  // 1) Mensaje de versión
  const liVersion = document.createElement('li');
  liVersion.textContent = 'Versión prototipo del juego.';
  list.appendChild(liVersion);

  // 2) Aviso de lesionados / sancionados + enlace a Médicos
  const liHealth = document.createElement('li');
  const aHealth = document.createElement('a');
  aHealth.href = '#';

  const textLesionados =
    injured.length === 0
      ? 'sin lesionados'
      : injured.length === 1
      ? '1 lesionado'
      : `${injured.length} lesionados`;

  const textSancionados =
    sanctioned.length === 0
      ? 'sin sancionados'
      : sanctioned.length === 1
      ? '1 sancionado'
      : `${sanctioned.length} sancionados`;

  aHealth.textContent = `Plantilla: ${textLesionados}, ${textSancionados} (ver área médica)`;

  aHealth.addEventListener('click', (ev) => {
    ev.preventDefault();
    const btn = document.getElementById('btn-nav-medical');
    if (btn && !btn.disabled) {
      btn.click(); // reutiliza toda la lógica de navegación
    }
  });

  liHealth.appendChild(aHealth);
  list.appendChild(liHealth);

  // 3) Estado de infra médica
  const liInfra = document.createElement('li');
  liInfra.textContent = `Centro médico nivel ${centerLevel}, fisioterapeutas nivel ${physioLevel}.`;
  list.appendChild(liInfra);
}

function describeCenterLevelLegacy(level) {
  switch (level) {
    case 1:
      return 'Instalaciones básicas. Probabilidad estándar de lesión en partido.';
    case 2:
      return 'Centro médico moderno. Menos lesiones en los partidos más exigentes.';
    case 3:
      return 'Centro de alto rendimiento. Reducción notable del riesgo de lesión.';
    case 4:
      return 'Instalaciones de élite. Protección máxima frente a lesiones.';
    default:
      return '';
  }
}

function describePhysioLevelLegacy(level) {
  switch (level) {
    case 1:
      return 'Equipo reducido. Recuperaciones dentro de los plazos normales.';
    case 2:
      return 'Fisioterapeutas a tiempo completo. Algunas lesiones se acortan.';
    case 3:
      return 'Departamento avanzado. Muchas lesiones se recortan 1 partido extra.';
    case 4:
      return 'Equipo de referencia mundial. Recuperaciones muy aceleradas.';
    default:
      return '';
  }
}

function upgradeMedicalLegacy(kind) {
  const club = getUserClub();
  if (!club) return;
  ensureClubMedical(club);

  const key = kind === 'center' ? 'centerLevel' : 'physioLevel';
  const currentLevel = club.medical[key] ?? 1;
  if (currentLevel >= 4) {
    alert('Ya has alcanzado el nivel máximo.');
    return;
  }

  const cost = getMedicalUpgradeCost(kind, currentLevel);
  if (club.cash == null) club.cash = 0;

  if (club.cash < cost) {
    alert('No tienes suficiente dinero en caja para esta mejora.');
    return;
  }

  const label =
    kind === 'center' ? 'Centro médico' : 'Departamento de fisioterapia';

  const ok = confirm(
    `Mejorar ${label} a nivel ${currentLevel + 1} por ${formatCurrency(
      cost
    )}?`
  );
  if (!ok) return;

  club.cash -= cost;
  club.medical[key] = currentLevel + 1;

  updateDashboard();
  updateMedicalView();
}

function getMedicalUpgradeCostLegacy(kind, currentLevel) {
  const base = kind === 'center' ? 2_000_000 : 1_200_000;
  const multiplier = 1 + (currentLevel - 1) * 0.6;
  return Math.round(base * multiplier);
}

// ================================
// Utilidades
// ================================

// Calendario interno del juego:
//  - Temporada 1 comienza el 1 de agosto de 2025
//  - Cada jornada suma 7 días
//  - Cada temporada suma 1 año
const GAME_CALENDAR_LEGACY = {
  BASE_SEASON_YEAR: 2025,
  SEASON_START_MONTH: 8, // agosto
  SEASON_START_DAY: 1,
  DAYS_PER_MATCHDAY: 7,
};

// Devuelve la fecha "real" del juego para una temporada y jornada dadas
function getGameDateForLegacy(season, matchday) {
  const year = GAME_CALENDAR_LEGACY.BASE_SEASON_YEAR + (season - 1);
  const d = new Date(
    Date.UTC(
      year,
      GAME_CALENDAR_LEGACY.SEASON_START_MONTH - 1,
      GAME_CALENDAR_LEGACY.SEASON_START_DAY
    )
  );

  const md = Math.max(1, matchday || 1);
  const daysToAdd = (md - 1) * GAME_CALENDAR_LEGACY.DAYS_PER_MATCHDAY;
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d;
}

// Fecha actual de juego según GameState.currentDate
function getCurrentGameDateLegacy() {
  const season = GameState.currentDate?.season || 1;
  const matchday = GameState.currentDate?.matchday || 1;
  return getGameDateForLegacy(season, matchday);
}

// Formato "15/09/2025"
function formatGameDateLabelLegacy(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Edad del jugador en función de su fecha de nacimiento y la fecha actual del juego.
// Si no hay birthDate, cae al campo age (para datos antiguos / jugadores ficticios).
function getPlayerGameAgeLegaxy(player, fallbackAge = null) {
  const dobStr = player.birthDate;
  if (dobStr) {
    const dob = new Date(dobStr);
    if (!Number.isNaN(dob.getTime())) {
      const now = getCurrentGameDateLegacy();
      let age = now.getUTCFullYear() - dob.getUTCFullYear();
      const m = now.getUTCMonth() - dob.getUTCMonth();
      if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) {
        age--;
      }
      if (!Number.isNaN(age) && age >= 0 && age < 60) {
        return age;
      }
    }
  }

  if (typeof player.age === 'number' && !Number.isNaN(player.age)) {
    return player.age;
  }

  return fallbackAge;
}

function formatCurrency(value) {
  const number = Number(value) || 0;
  return number.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

// Escape básico para texto en HTML (evita inyección al usar innerHTML)
function escapeHtml(value) {
  const str = value == null ? '' : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPercent(v) {
  if (v == null || Number.isNaN(v)) return '-';
  const clamped = Math.max(0, Math.min(1, Number(v)));
  const percent = Math.round(clamped * 100);
  return `${percent} %`;
}

function formatAttr(v) {
  if (v == null || Number.isNaN(v)) return '-';
  return String(Math.round(Number(v)));
}

function estimateMarketValue(player) {
  const overall = player.overall ?? 60;
  const age = getPlayerGameAge(player, 26);

  let base = 500_000 + (overall - 60) * 150_000;
  let ageFactor = 1.0;

  if (age < 24) ageFactor = 1.4;
  else if (age < 28) ageFactor = 1.2;
  else if (age <= 31) ageFactor = 1.0;
  else ageFactor = 0.7;

  const value = Math.max(100_000, Math.round(base * ageFactor));
  return value;
}
