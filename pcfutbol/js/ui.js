// js/ui.js

import { GameState, newGame } from './state.js';
import { initialLeague, allLeagues } from './data.js';
import { exportGameToFile } from './saveLoad.js';

import { showDashboard, setActiveSubview } from './ui/nav.js';
import { initNavigation } from './ui/navigation.js';

import { updateDashboard } from './ui/dashboard.js';

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

import { initStandingsUI, updateStandingsView, setStandingsSelectedMatchday } from './ui/standings.js';

import { updateStatsView } from './ui/stats.js';
import { initMedicalUI, updateMedicalView } from './ui/medical.js';

import { initSquadUI, bindSquadActions, updateSquadView } from './ui/squad.js';
import { getPlayerGameAge } from './ui/utils/calendar.js';

import { initAlignmentUI, updateAlignmentView } from './ui/alignment.js';
import { initTacticsUI, updateTacticsView } from './ui/tactics.js';

import { simulateCurrentMatchday } from './game/simulateMatchday.js';
import { handleFileInput } from './ui/saveLoadUI.js';

import { getPlayerById, handlePlayerAction as handlePlayerActionImpl } from './ui/playerActions.js';
import { initNegotiationUI, prepareNegotiationUI, attemptRenewal, scrollToNegotiationSection } from './ui/negotiation.js';

// ================================
// Estado UI
// ================================

let currentModalPlayer = null;

let negYearsInput = null;
let negWageInput = null;
let negResultEl = null;
let negHintEl = null;
let negSectionEl = null;

// ================================
// Modales (wrappers)
// ================================

function openPlayerModal(player) {
  if (!player) return;
  currentModalPlayer = player;
  openPlayerModalImpl(player);
}

function closePlayerModal() {
  closePlayerModalImpl();
  currentModalPlayer = null;
}

function openMatchDetailModal(fixtureId) {
  openMatchDetailModalImpl(fixtureId);
}

function closeMatchDetailModal() {
  closeMatchDetailModalImpl();
}

// ================================
// Init
// ================================

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
  const startManagerNameInput = document.getElementById('start-manager-name');

  // Navegación
  const btnNavDashboard = document.getElementById('btn-nav-dashboard');
  const btnNavSquad = document.getElementById('btn-nav-squad');
  const btnNavAlignment = document.getElementById('btn-nav-alignment');
  const btnNavTactics = document.getElementById('btn-nav-tactics');
  const btnNavCompetition = document.getElementById('btn-nav-competition');
  const btnNavStandings = document.getElementById('btn-nav-standings');
  const btnNavStats = document.getElementById('btn-nav-stats');
  const btnNavMedical = document.getElementById('btn-nav-medical');

  const viewDashboard = document.getElementById('view-dashboard');
  const viewSquad = document.getElementById('view-squad');
  const viewAlignment = document.getElementById('view-alignment');
  const viewTactics = document.getElementById('view-tactics');
  const viewCompetition = document.getElementById('view-competition');
  const viewStandings = document.getElementById('view-standings');
  const viewStats = document.getElementById('view-stats');
  const viewMedical = document.getElementById('view-medical');

  // Modal detalle de partido / modal jugador
  const matchDetailModal = document.getElementById('match-detail-modal');
  const playerModal = document.getElementById('player-modal');
  const playerModalGoRenew = document.getElementById('player-modal-go-renew');

  negYearsInput = document.getElementById('player-neg-years');
  negWageInput = document.getElementById('player-neg-wage');
  negResultEl = document.getElementById('player-modal-neg-result');
  negHintEl = document.getElementById('player-modal-neg-hint');
  negSectionEl = document.getElementById('player-modal-neg-section');
  initNegotiationUI({
    yearsInput: negYearsInput,
    wageInput: negWageInput,
    resultEl: negResultEl,
    hintEl: negHintEl,
    sectionEl: negSectionEl,
  });
  const negSendBtn = document.getElementById('player-neg-send');

  // Competición
  const matchdaySelect = document.getElementById('competition-matchday-select');
  const simulateBtn = document.getElementById('btn-simulate-matchday');

  // ----------
  // Contexto común de navegación
  // ----------
  const ctx = {
    viewDashboard,
    viewSquad,
    viewAlignment,
    viewTactics,
    viewCompetition,
    viewStandings,	
    viewStats,
    viewMedical,
    btnNavDashboard,
    btnNavSquad,
    btnNavAlignment,
    btnNavTactics,
    btnNavCompetition,
    btnNavStandings,	
    btnNavStats,
    btnNavMedical,
  };

  const refreshAllViews = () => {
    updateDashboard();
    updateSquadView();
    updateAlignmentView();
    updateTacticsView();
    updateCompetitionView();
   initStandingsUI();	
    updateStandingsView();	
    updateStatsView();
    updateMedicalView();
  };

  // ----------
  // Start: selectors liga/club
  // ----------
  function refreshStartClubSelect() {
    if (!startLeagueSelect || !startClubSelect) return;
    const leagueId = startLeagueSelect.value || initialLeague.id;
    const league = allLeagues.find((l) => l.id === leagueId) || initialLeague;

    startClubSelect.innerHTML = '';
    if (Array.isArray(league?.clubs)) {
      league.clubs.forEach((club) => {
        const opt = document.createElement('option');
        opt.value = club.id;
        opt.textContent = club.name || club.id;
        startClubSelect.appendChild(opt);
      });
    }
  }

  if (startLeagueSelect) {
    // Rellenar select de ligas
    startLeagueSelect.innerHTML = '';
    allLeagues.forEach((l) => {
      const opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = l.name || l.id;
      if (l.id === initialLeague.id) opt.selected = true;
      startLeagueSelect.appendChild(opt);
    });

    startLeagueSelect.addEventListener('change', refreshStartClubSelect);
  }
  refreshStartClubSelect();

  // ----------
  // Inicializar módulos (una vez)
  // ----------
  initPlayerModalImpl({ onRequestClose: closePlayerModal });
  initMatchDetailModalImpl({ onRequestClose: closeMatchDetailModal });

  initNavigation(ctx, {
    updateDashboard,
    updateSquadView,
   updateAlignmentView,
    updateTacticsView,
    updateCompetitionView,
    updateStandingsView,	
    updateStatsView,
    updateMedicalView,
  });
  
  // Al entrar en "Clasificación", por defecto siempre jornada actual
  btnNavStandings?.addEventListener('click', () => {
    setStandingsSelectedMatchday(GameState.currentDate?.matchday || 1);
    initStandingsUI();
  });
  
  // HUB: botones internos (tarjetas/menú) usando data-nav-target
  if (dashboardScreen) {
    dashboardScreen.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const btn = target.closest('[data-nav-target]');
      if (!btn) return;

      const key = btn.getAttribute('data-nav-target');
      if (!key) return;

      // Si el botón es "PARTIDO", alineamos la jornada seleccionada con la actual
      if (btn.getAttribute('data-set-current-md') === '1') {
        try { setCompetitionSelectedMatchday(GameState.currentDate?.matchday || 1); } catch (_) {}
      }

      const map = {
        dashboard: btnNavDashboard,
        squad: btnNavSquad,
        alignment: btnNavAlignment,
        tactics: btnNavTactics,
        competition: btnNavCompetition,
        standings: btnNavStandings,	
        clasificacion: btnNavStandings,
        clasificación: btnNavStandings,
        stats: btnNavStats,
        medical: btnNavMedical,
      };

      const navBtn = map[key];
      if (navBtn && !navBtn.disabled) navBtn.click();
    });
  }

  initSquadUI();
  bindSquadActions(({ playerId, action }) => {
    const player = getPlayerById(playerId);
    if (!player) return;
        handlePlayerActionImpl(action, player, {
          openPlayerModal,
          updateSquadView,
          prepareNegotiationUI,
          scrollToNegotiationSection,
          getCurrentModalPlayer: () => currentModalPlayer,
        });
  });

  initAlignmentUI();
  initTacticsUI();
  initCompetitionUI({
    initialMatchday: 1,
    onOpenMatchDetail: (fixtureId) => openMatchDetailModal(fixtureId),
  });
  initStandingsUI();
  initMedicalUI({
    onAfterUpgrade: () => {
      updateDashboard();
      updateMedicalView();
    },
  });

  // ----------
  // Nueva partida
  // ----------
  if (btnNewGame) {
    btnNewGame.addEventListener('click', () => {
      const leagueId =
        startLeagueSelect && startLeagueSelect.value
          ? startLeagueSelect.value
          : initialLeague.id;
      const clubId =
        startClubSelect && startClubSelect.value ? startClubSelect.value : null;

      newGame({ roleMode: 'TOTAL', leagueId, clubId, managerName: startManagerNameInput?.value || '',});

      showDashboard(startScreen, dashboardScreen);

      const md = GameState.currentDate?.matchday || 1;
      setCompetitionSelectedMatchday(md);

      setActiveSubview('dashboard', ctx);
      refreshAllViews();
    });
  }

  // ----------
  // Cargar partida (inicio / in-game)
  // ----------
  if (fileInputStart) {
    fileInputStart.addEventListener('change', (event) => {
      handleFileInput(event, startScreen, dashboardScreen, ctx, () => {
        showDashboard(startScreen, dashboardScreen);
        const md = GameState.currentDate?.matchday || 1;
        setCompetitionSelectedMatchday(md);
        setActiveSubview('dashboard', ctx);
        refreshAllViews();
      });
    });
  }

  if (fileInputIngame) {
    fileInputIngame.addEventListener('change', (event) => {
      handleFileInput(event, startScreen, dashboardScreen, ctx, () => {
        showDashboard(startScreen, dashboardScreen);
        const md = GameState.currentDate?.matchday || 1;
        setCompetitionSelectedMatchday(md);
        setActiveSubview('dashboard', ctx);
        refreshAllViews();
      });
    });
  }

  // ----------
  // Guardar
  // ----------
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      try {
        exportGameToFile();
      } catch (err) {
        console.error(err);
        alert('No se pudo guardar la partida: ' + (err?.message || err));
      }
    });
  }

  // ----------
  // Modal jugador -> ir a renovación
  // ----------
  if (playerModalGoRenew) {
    playerModalGoRenew.addEventListener('click', () => {
      if (!currentModalPlayer) return;
      setActiveSubview('squad', ctx);
      updateSquadView();
      prepareNegotiationUI(currentModalPlayer);
      scrollToNegotiationSection();
    });
  }

  if (negSendBtn) {
    negSendBtn.addEventListener('click', () => {
      if (!currentModalPlayer) return;
      attemptRenewal(currentModalPlayer);
    });
  }

  // ----------
  // Competición: selector jornada + simular
  // ----------
  if (matchdaySelect) {
    matchdaySelect.addEventListener('change', () => {
      const md = Number.parseInt(matchdaySelect.value, 10);
      if (Number.isFinite(md) && md >= 1) {
        setCompetitionSelectedMatchday(md);
        updateCompetitionView();
      }
    });
  }

  if (simulateBtn) {
    simulateBtn.addEventListener('click', () => {
      // Guardamos la jornada que vamos a simular, porque simulateCurrentMatchday()
      // incrementa GameState.currentDate.matchday al terminar.
      const mdSimulated = Number(GameState.currentDate?.matchday || 1);
      try {
        simulateCurrentMatchday();
      } catch (err) {
        console.error(err);
        alert(err?.message || 'No se pudo simular la jornada.');
        return;
      }
      // En Competición, tras simular queremos VER los resultados de la jornada simulada,
      // no saltar automáticamente a la siguiente (que aún no tiene resultados).
      setCompetitionSelectedMatchday(mdSimulated);

      // En Clasificación, por defecto también tiene más sentido enseñar la jornada recién jugada.
      try { setStandingsSelectedMatchday(mdSimulated); } catch (_) {}
      updateDashboard();	  
      updateCompetitionView();
     initStandingsUI();	  
      updateStandingsView();	  
      updateStatsView();
      updateMedicalView();
    });
  }

  // ----------
  // Escape cierra modales
  // ----------
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (playerModal && !playerModal.classList.contains('hidden')) closePlayerModal();
    if (matchDetailModal && !matchDetailModal.classList.contains('hidden')) closeMatchDetailModal();
  });
}