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

// Táctica UI
let tacticsSelectedPlayerId = null;

// Modal detalle de partido
let currentMatchDetailFixtureId = null;

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
  const btnNavTactics = document.getElementById('btn-nav-tactics');
  const btnNavCompetition = document.getElementById('btn-nav-competition');
  const btnNavStats = document.getElementById('btn-nav-stats');
  const btnNavMedical = document.getElementById('btn-nav-medical');

  const viewDashboard = document.getElementById('view-dashboard');
  const viewSquad = document.getElementById('view-squad');
  const viewTactics = document.getElementById('view-tactics');
  const viewCompetition = document.getElementById('view-competition');
  const viewStats = document.getElementById('view-stats');
  const viewMedical = document.getElementById('view-medical');

  // Plantilla
  const filterPosSelect = document.getElementById('squad-filter-pos');
  const sortSelect = document.getElementById('squad-sort');
  const squadTableBody = document.getElementById('squad-table-body');
  
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

  // Táctica
  const tacticsFormationSelect = document.getElementById('tactics-formation');
  const tacticsMentalitySelect = document.getElementById('tactics-mentality');
  const tacticsTempoSelect = document.getElementById('tactics-tempo');
  const tacticsPressureSelect = document.getElementById('tactics-pressure');
  const tacticsAutoBtn = document.getElementById('btn-tactics-auto');
  const tacticsXiBody = document.getElementById('tactics-xi-body');
  const tacticsBenchBody = document.getElementById('tactics-bench-body');
  const tacticsOutBody = document.getElementById('tactics-out-body');
  const tacticsPitch = document.getElementById('tactics-pitch');  

  // Médicos
  const btnMedicalUpgradeCenter = document.getElementById(
    'btn-medical-upgrade-center'
  );
  const btnMedicalUpgradePhysio = document.getElementById(
    'btn-medical-upgrade-physio'
  );

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

    setActiveSubview('dashboard', ctxNav);
    updateDashboard();
    updateSquadView();
    updateTacticsView();
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
    btnNavMedical,
  };

  fileInputStart.addEventListener('change', (event) => {
    handleFileInput(event, startScreen, dashboardScreen, ctxForLoad);
  });

  fileInputIngame.addEventListener('change', (event) => {
    handleFileInput(event, startScreen, dashboardScreen, ctxForLoad);
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

  // -----------------
  // Navegación
  // -----------------

  btnNavDashboard.addEventListener('click', () => {
    setActiveSubview('dashboard', ctxForLoad);
  });

  btnNavSquad.addEventListener('click', () => {
    setActiveSubview('squad', ctxForLoad);
    updateSquadView();
  });

  btnNavTactics.addEventListener('click', () => {
    setActiveSubview('tactics', ctxForLoad);
    updateTacticsView();
  });

  btnNavCompetition.addEventListener('click', () => {
    setActiveSubview('competition', ctxForLoad);
    updateCompetitionView();
  });
  

  btnNavStats.addEventListener('click', () => {
    setActiveSubview('stats', ctxForLoad);
    updateStatsView();
  });

  btnNavMedical.addEventListener('click', () => {
    setActiveSubview('medical', ctxForLoad);
    updateMedicalView();
  });

  // -----------------
  // Plantilla
  // -----------------

  if (filterPosSelect) {
    filterPosSelect.addEventListener('change', () => {
      squadFilterPos = filterPosSelect.value || 'ALL';
      updateSquadView();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      squadSortKey = sortSelect.value || 'POSITION';
      updateSquadView();
    });
  }

  if (squadTableBody) {
    squadTableBody.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const tr = btn.closest('tr');
      const playerId = tr?.dataset.playerId;
      if (!playerId) return;

      const player = getPlayerById(playerId);
      if (!player) return;

      handlePlayerAction(action, player);
    });
  }

  // -----------------
  // Modal jugador
  // -----------------

  if (playerModalBackdrop) {
    playerModalBackdrop.addEventListener('click', () => {
      closePlayerModal();
    });
  }

  if (playerModalClose) {
    playerModalClose.addEventListener('click', () => {
      closePlayerModal();
    });
  }

  if (playerModalCloseFooter) {
    playerModalCloseFooter.addEventListener('click', () => {
      closePlayerModal();
    });
  }
  
  if (matchDetailModalBackdrop) {
    matchDetailModalBackdrop.addEventListener('click', () => {
      closeMatchDetailModal();
    });
  }

  if (matchDetailModalClose) {
    matchDetailModalClose.addEventListener('click', () => {
      closeMatchDetailModal();
    });
  }

  if (matchDetailModalCloseFooter) {
    matchDetailModalCloseFooter.addEventListener('click', () => {
      closeMatchDetailModal();
    });
  }

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

  if (tacticsAutoBtn) {
    tacticsAutoBtn.addEventListener('click', () => {
      const club = getUserClub();
      if (!club) return;
      ensureClubTactics(club);
      autoPickMatchdaySquad(club);
      updateTacticsView();
    });
  }

  // Delegación de clicks en listas (seleccionar jugador + mover)
  function bindTacticsTableHandlers(tbody) {
    if (!tbody) return;
    tbody.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('button[data-action]') : null;
      const row = e.target && e.target.closest ? e.target.closest('tr[data-player-id]') : null;
      const pid = (btn && btn.dataset && btn.dataset.playerId) || (row && row.dataset && row.dataset.playerId) || null;
      if (!pid) return;

      if (btn) {
        handleTacticsAction(pid, btn.dataset.action);
      } else {
        tacticsSelectedPlayerId = pid;
        updateTacticsView();
      }
    });
  }
  bindTacticsTableHandlers(tacticsXiBody);
  bindTacticsTableHandlers(tacticsBenchBody);
  bindTacticsTableHandlers(tacticsOutBody);

  // Click en bolitas del campo
  if (tacticsPitch) {
    tacticsPitch.addEventListener('click', (e) => {
      const dot = e.target && e.target.closest ? e.target.closest('.pcf-dot[data-player-id]') : null;
      const pid = dot?.dataset?.playerId;
      if (!pid) return;
      tacticsSelectedPlayerId = pid;
      updateTacticsView();
    });
  }

  function bindTacticsSelect(selectEl, key) {
    if (!selectEl) return;
    selectEl.addEventListener('change', () => {
      const club = getUserClub();
      if (!club) return;
      ensureClubTactics(club);
      club.tactics[key] = selectEl.value;
      if (key === 'formation') updateTacticsView();
    });
  }

  bindTacticsSelect(tacticsFormationSelect, 'formation');
  bindTacticsSelect(tacticsMentalitySelect, 'mentality');
  bindTacticsSelect(tacticsTempoSelect, 'tempo');
  bindTacticsSelect(tacticsPressureSelect, 'pressure');

  // -----------------
  // Médicos: upgrades
  // -----------------

  if (btnMedicalUpgradeCenter) {
    btnMedicalUpgradeCenter.addEventListener('click', () => {
      upgradeMedical('center');
    });
  }
  if (btnMedicalUpgradePhysio) {
    btnMedicalUpgradePhysio.addEventListener('click', () => {
      upgradeMedical('physio');
    });
  }

  // -----------------
  // Competición
  // -----------------

  if (matchdaySelect) {
    matchdaySelect.addEventListener('change', () => {
      const md = Number.parseInt(matchdaySelect.value, 10);
      if (Number.isFinite(md) && md >= 1) {
        competitionSelectedMatchday = md;
        updateCompetitionView();
      }
    });
  }

  if (simulateBtn) {
    simulateBtn.addEventListener('click', () => {
      simulateCurrentMatchday();
      updateCompetitionView();
      updateMedicalView();
    });
  }
}

// ================================
// Navegación / carga
// ================================

function showDashboard(startScreen, dashboardScreen) {
  startScreen.classList.add('hidden');
  dashboardScreen.classList.remove('hidden');
}

/**
 * view: 'dashboard' | 'squad' | 'tactics' | 'competition' | 'medical'
 */
function setActiveSubview(view, ctx) {
  const {
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
  } = ctx;

  viewDashboard?.classList.add('hidden');
  viewSquad?.classList.add('hidden');
  viewTactics?.classList.add('hidden');
  viewCompetition?.classList.add('hidden');
  viewStats?.classList.add('hidden');
  viewMedical?.classList.add('hidden');

  btnNavDashboard?.classList.remove('active');
  btnNavSquad?.classList.remove('active');
  btnNavTactics?.classList.remove('active');
  btnNavCompetition?.classList.remove('active');
  btnNavStats?.classList.remove('active');
  btnNavMedical?.classList.remove('active');

  if (view === 'dashboard') {
    viewDashboard?.classList.remove('hidden');
    btnNavDashboard?.classList.add('active');
  } else if (view === 'squad') {
    viewSquad?.classList.remove('hidden');
    btnNavSquad?.classList.add('active');
  } else if (view === 'tactics') {
    viewTactics?.classList.remove('hidden');
    btnNavTactics?.classList.add('active');
  } else if (view === 'competition') {
    viewCompetition?.classList.remove('hidden');
    btnNavCompetition?.classList.add('active');
  } else if (view === 'stats') {
    viewStats?.classList.remove('hidden');
    btnNavStats?.classList.add('active');
  } else if (view === 'medical') {
    viewMedical?.classList.remove('hidden');
    btnNavMedical?.classList.add('active');
  }
}

function handleFileInput(event, startScreen, dashboardScreen, ctx) {
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
// Dashboard
// ================================

export function updateDashboard() {
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
// Plantilla
// ================================

function updateSquadView() {
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
// Táctica y alineación
// ================================

function updateTacticsView() {
  const club = getUserClub();
  if (!club) return;

  ensureClubTactics(club);

  const tactics = club.tactics;
  const players = Array.isArray(club.players) ? club.players.slice() : [];

  // Asegura arrays y límites (11 + 9)
  if (!Array.isArray(club.lineup)) club.lineup = [];
  if (!Array.isArray(club.bench)) club.bench = [];
  club.lineup = Array.from(new Set(club.lineup)).slice(0, 11);
  const xiSet0 = new Set(club.lineup);
  club.bench = Array.from(new Set(club.bench)).filter((id) => id && !xiSet0.has(id)).slice(0, 9);

  const formationSelect = document.getElementById('tactics-formation');
  const mentalitySelect = document.getElementById('tactics-mentality');
  const tempoSelect = document.getElementById('tactics-tempo');
  const pressureSelect = document.getElementById('tactics-pressure');
  const xiBody = document.getElementById('tactics-xi-body');
  const benchBody = document.getElementById('tactics-bench-body');
  const outBody = document.getElementById('tactics-out-body');

  if (formationSelect) formationSelect.value = tactics.formation || '4-4-2';
  if (mentalitySelect) mentalitySelect.value = tactics.mentality || 'BALANCED';
  if (tempoSelect) tempoSelect.value = tactics.tempo || 'NORMAL';
  if (pressureSelect) pressureSelect.value = tactics.pressure || 'NORMAL';

  if (!xiBody || !benchBody || !outBody) return;
  xiBody.innerHTML = '';
  benchBody.innerHTML = '';
  outBody.innerHTML = '';

  const byId = new Map(players.map((p) => [p.id, p]));
  const xiIds = club.lineup.filter((id) => byId.has(id));
  const benchIds = club.bench.filter((id) => byId.has(id));
  const squadSet = new Set([...xiIds, ...benchIds]);

  // No convocados = resto
  const outPlayers = players
    .filter((p) => p && p.id && !squadSet.has(p.id))
    .slice()
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));

  // Render helpers
  const renderRow = (p, group) => {
    const injured = isPlayerInjuredNow(p);
    const suspended = isPlayerSuspendedNow(p);
    const unavailable = injured || suspended;

    const tr = document.createElement('tr');
    tr.dataset.playerId = p.id;
    if (tacticsSelectedPlayerId === p.id) tr.classList.add('is-selected');
    if (unavailable) tr.classList.add('row-disabled');

    const statusText =
      injured && suspended
        ? 'Les./Sanc.'
        : injured
          ? `Les. (${p.injury?.matchesRemaining ?? '?'})`
          : suspended
            ? `Sanc. (${p.suspension?.matchesRemaining ?? '?'})`
            : '-';

    // Botones según grupo
    let actions = '';
    if (group === 'XI') {
      actions = `
        <button class="btn btn-secondary btn-mini" data-action="TO_BENCH" data-player-id="${p.id}" type="button">▸</button>
        <button class="btn btn-secondary btn-mini" data-action="TO_OUT" data-player-id="${p.id}" type="button">✕</button>
      `;
    } else if (group === 'BENCH') {
      actions = `
        <button class="btn btn-secondary btn-mini" data-action="TO_XI" data-player-id="${p.id}" type="button">◂</button>
        <button class="btn btn-secondary btn-mini" data-action="TO_OUT" data-player-id="${p.id}" type="button">✕</button>
      `;
    } else {
      actions = `
        <button class="btn btn-secondary btn-mini" data-action="ADD_BENCH" data-player-id="${p.id}" type="button">＋</button>
        <button class="btn btn-secondary btn-mini" data-action="ADD_XI" data-player-id="${p.id}" type="button">⇧</button>
      `;
    }

    tr.innerHTML = `
      <td>${p.number ?? '-'}</td>
      <td>${escapeHtml(p.name || 'Jugador')}</td>
      <td>${escapeHtml(p.position || '-')}</td>
      <td>${p.overall != null ? String(p.overall) : '-'}</td>
      <td>${formatPercent(p.fitness)}</td>
      <td>${escapeHtml(statusText)}</td>
      <td class="pcf-actions">${actions}</td>
    `;
    return tr;
  };

  // Titulares
  xiIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .forEach((p) => xiBody.appendChild(renderRow(p, 'XI')));

  // Banquillo (convocados)
  benchIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .forEach((p) => benchBody.appendChild(renderRow(p, 'BENCH')));

  // No convocados
  outPlayers.forEach((p) => outBody.appendChild(renderRow(p, 'OUT')));

  // Contador
  updateTacticsXIcount(club);

  // Ficha derecha + campo
  const selected =
    (tacticsSelectedPlayerId && byId.get(tacticsSelectedPlayerId)) ||
    (xiIds[0] && byId.get(xiIds[0])) ||
    null;
  if (!tacticsSelectedPlayerId && selected) tacticsSelectedPlayerId = selected.id;
  renderTacticsPlayerCard(selected, club);
  renderTacticsPitch(club);
}

function handleTacticsAction(playerId, action) {
  const club = getUserClub();
  if (!club) return;
  ensureClubTactics(club);

  const xi = Array.isArray(club.lineup) ? club.lineup.slice() : [];
  const bench = Array.isArray(club.bench) ? club.bench.slice() : [];

  const xiSet = new Set(xi);
  const benchSet = new Set(bench);

  const removeFrom = (arr, id) => arr.filter((x) => x !== id);

  // límites
  const XI_MAX = 11;
  const BENCH_MAX = 9;

  if (action === 'TO_BENCH') {
    club.lineup = removeFrom(xi, playerId);
    if (bench.length < BENCH_MAX && !benchSet.has(playerId)) {
      club.bench = bench.concat([playerId]).slice(0, BENCH_MAX);
    } else {
      club.bench = bench;
    }
  } else if (action === 'TO_OUT') {
    club.lineup = removeFrom(xi, playerId);
    club.bench = removeFrom(bench, playerId);
  } else if (action === 'TO_XI') {
    club.bench = removeFrom(bench, playerId);
    if (xi.length < XI_MAX && !xiSet.has(playerId)) {
      club.lineup = xi.concat([playerId]).slice(0, XI_MAX);
    } else {
      club.lineup = xi;
    }
  } else if (action === 'ADD_BENCH') {
    if (bench.length < BENCH_MAX && !benchSet.has(playerId) && !xiSet.has(playerId)) {
      club.bench = bench.concat([playerId]).slice(0, BENCH_MAX);
    }
  } else if (action === 'ADD_XI') {
    if (!xiSet.has(playerId)) {
      // si XI lleno, mandamos el último al banquillo si hay hueco
      let nextXI = xi.slice();
      let nextBench = bench.slice();
      if (nextXI.length >= XI_MAX) {
        const kicked = nextXI.pop();
        if (kicked && nextBench.length < BENCH_MAX && !nextBench.includes(kicked)) {
          nextBench.push(kicked);
        }
      }
      nextXI.push(playerId);
      club.lineup = nextXI.slice(0, XI_MAX);
      // limpiar duplicados y excluir XI
      const setXI = new Set(club.lineup);
      club.bench = Array.from(new Set(nextBench)).filter((id) => id && !setXI.has(id)).slice(0, BENCH_MAX);
    }
  }

  // limpieza final
  club.lineup = Array.from(new Set(club.lineup)).slice(0, 11);
  const setXI2 = new Set(club.lineup);
  club.bench = Array.from(new Set(club.bench)).filter((id) => id && !setXI2.has(id)).slice(0, 9);

  tacticsSelectedPlayerId = playerId;
  updateTacticsView();
}

function autoPickMatchdaySquad(club) {
  if (!club || !Array.isArray(club.players)) return;
  const available = club.players
    .filter((p) => p && p.id && !isPlayerUnavailable(p))
    .slice()
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));

  const xi = [];
  const gk = available.find((p) => String(p.position || '').toUpperCase() === 'POR');
  if (gk) xi.push(gk.id);
  for (let i = 0; i < available.length && xi.length < 11; i++) {
    const id = available[i].id;
    if (id && !xi.includes(id)) xi.push(id);
  }
  const xiSet = new Set(xi);
  const bench = [];
  for (let i = 0; i < available.length && bench.length < 9; i++) {
    const id = available[i].id;
    if (id && !xiSet.has(id) && !bench.includes(id)) bench.push(id);
  }
  club.lineup = xi.slice(0, 11);
  club.bench = bench.slice(0, 9);
}

function renderTacticsPlayerCard(player, club) {
  const nameEl = document.getElementById('tactics-player-name');
  const metaEl = document.getElementById('tactics-player-meta');
  const ovEl = document.getElementById('tactics-player-overall');
  const aPace = document.getElementById('tactics-attr-pace');
  const aSta = document.getElementById('tactics-attr-stamina');
  const aPas = document.getElementById('tactics-attr-passing');
  const aDri = document.getElementById('tactics-attr-dribbling');
  const aSho = document.getElementById('tactics-attr-shooting');
  const aTac = document.getElementById('tactics-attr-tackling');
  const aVis = document.getElementById('tactics-attr-vision');
  const aCom = document.getElementById('tactics-attr-composure');

  if (!player) {
    if (nameEl) nameEl.textContent = '-';
    if (metaEl) metaEl.textContent = '-';
    if (ovEl) ovEl.textContent = '--';
    return;
  }

  if (nameEl) nameEl.textContent = player.name || 'Jugador';
  const status =
    isPlayerInjuredNow(player) ? 'Lesionado' :
    isPlayerSuspendedNow(player) ? 'Sancionado' : 'Disponible';
  if (metaEl) {
    metaEl.textContent = `${player.position || '-'} • Fit ${formatPercent(player.fitness)} • ${status}`;
  }
  if (ovEl) ovEl.textContent = player.overall != null ? String(player.overall) : '--';

  const tech = player.attributes?.technical || {};
  const ment = player.attributes?.mental || {};
  const phys = player.attributes?.physical || {};
  if (aPace) aPace.textContent = formatAttr(phys.pace);
  if (aSta) aSta.textContent = formatAttr(phys.stamina);
  if (aPas) aPas.textContent = formatAttr(tech.passing);
  if (aDri) aDri.textContent = formatAttr(tech.dribbling);
  if (aSho) aSho.textContent = formatAttr(tech.shooting);
  if (aTac) aTac.textContent = formatAttr(tech.tackling);
  if (aVis) aVis.textContent = formatAttr(ment.vision);
  if (aCom) aCom.textContent = formatAttr(ment.composure);
}

function renderTacticsPitch(club) {
  const pitch = document.getElementById('tactics-pitch');
  if (!pitch) return;
  pitch.innerHTML = '';

  const byId = new Map((club.players || []).map((p) => [p.id, p]));
  const xiPlayers = (club.lineup || []).map((id) => byId.get(id)).filter(Boolean);

  const formation = club.tactics?.formation || '4-4-2';
  const slots = getFormationSlots(formation);
  const assigned = assignPlayersToSlots(xiPlayers, slots);

  assigned.forEach((slot) => {
    const dot = document.createElement('div');
    dot.className = 'pcf-dot' + (slot.player?.id === tacticsSelectedPlayerId ? ' is-selected' : '');
    dot.style.left = `${slot.x}%`;
    dot.style.top = `${slot.y}%`;
    dot.dataset.playerId = slot.player?.id || '';
    dot.title = slot.player ? `${slot.player.name} (${slot.player.position})` : '';
    dot.textContent = slot.player?.number != null ? String(slot.player.number) : (slot.player?.position || '?');
    pitch.appendChild(dot);
  });
}

function getFormationSlots(formation) {
  // coordenadas (%): arriba = rival, abajo = portero
  // siempre: 1 GK + líneas según formación
  const parts = String(formation || '4-4-2').split('-').map((n) => parseInt(n, 10)).filter((n) => Number.isFinite(n) && n > 0);
  const lines = parts.length ? parts : [4,4,2];
  const slots = [];
  // GK
  slots.push({ role: 'GK', x: 50, y: 86 });

  // líneas desde defensa (cerca de portero) hacia ataque (cerca de arriba)
  const yLines = [];
  const baseY = 70;          // defensa
  const step = lines.length > 1 ? (52 / (lines.length - 1)) : 0; // hasta ~18
  for (let i = 0; i < lines.length; i++) {
    yLines.push(baseY - i * step);
  }

  for (let li = 0; li < lines.length; li++) {
    const count = lines[li];
    const y = yLines[li];
    const xs = spreadX(count);
    for (let i = 0; i < count; i++) {
      slots.push({ role: li === 0 ? 'DEF' : (li === lines.length - 1 ? 'FWD' : 'MID'), x: xs[i], y });
    }
  }
  return slots.slice(0, 11);
}

function spreadX(count) {
  if (count <= 1) return [50];
  const min = 18, max = 82;
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
}

function assignPlayersToSlots(players, slots) {
  const list = players.slice();
  const gks = list.filter((p) => String(p.position || '').toUpperCase() === 'POR');
  const defs = list.filter((p) => getPositionGroup(p.position) === 1 && String(p.position || '').toUpperCase() !== 'POR');
  const mids = list.filter((p) => getPositionGroup(p.position) === 2);
  const fwds = list.filter((p) => getPositionGroup(p.position) >= 3);

  const pick = (arr) => arr.shift() || null;
  const out = [];

  slots.forEach((s) => {
    let p = null;
    if (s.role === 'GK') p = pick(gks) || pick(defs) || pick(mids) || pick(fwds);
    else if (s.role === 'DEF') p = pick(defs) || pick(mids) || pick(fwds) || pick(gks);
    else if (s.role === 'MID') p = pick(mids) || pick(defs) || pick(fwds) || pick(gks);
    else p = pick(fwds) || pick(mids) || pick(defs) || pick(gks);
    out.push({ ...s, player: p });
  });
  return out;
}

function updateTacticsXIcount(club) {
  const xiLabel = document.getElementById('tactics-xi-count');
  if (!xiLabel) return;
  const count = Array.isArray(club.lineup) ? club.lineup.length : 0;
  const benchCount = Array.isArray(club.bench) ? club.bench.length : 0;
  xiLabel.textContent = `${count}/11 titulares • ${benchCount}/9 convocados`;
}

/**
 * Asegura que el club tiene campos tactics y lineup.
 */
function ensureClubTactics(club) {
  if (!club.tactics) {
    club.tactics = {
      formation: '4-4-2',
      mentality: 'BALANCED',
      tempo: 'NORMAL',
      pressure: 'NORMAL',
    };
  }
  if (!Array.isArray(club.lineup)) club.lineup = [];
  if (!Array.isArray(club.bench)) club.bench = [];
  if (club.lineup.length === 0 || club.bench.length === 0) {
    autoPickMatchdaySquad(club);
  }
}

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
      updateSquadView();
      if (currentModalPlayer && currentModalPlayer.id === player.id) {
        openPlayerModal(player);
      }
      break;
    default:
      console.log('Acción no soportada:', action, player);
  }
}

function openPlayerModal(player) {
  currentModalPlayer = player;

  const modal = document.getElementById('player-modal');
  if (!modal) return;

  const nameEl = document.getElementById('player-modal-name');
  const posEl = document.getElementById('player-modal-position');
  const ageEl = document.getElementById('player-modal-age');
  const birthdateEl = document.getElementById('player-modal-birthdate');
  const nationalityEl = document.getElementById('player-modal-nationality');
  const birthplaceEl = document.getElementById('player-modal-birthplace');
  const youthclubEl = document.getElementById('player-modal-youthclub');
  const overallEl = document.getElementById('player-modal-overall');
  const moraleEl = document.getElementById('player-modal-morale');
  const fitnessEl = document.getElementById('player-modal-fitness');
  const wageEl = document.getElementById('player-modal-wage');
  const contractEl = document.getElementById('player-modal-contract');
  const valueEl = document.getElementById('player-modal-value');
  const transferEl = document.getElementById('player-modal-transfer');

  const yellowEl = document.getElementById('player-modal-yellowcards');
  const suspEl = document.getElementById('player-modal-suspension');
  const histBody = document.getElementById('player-modal-discipline-body');

  const attrTech = (player.attributes && player.attributes.technical) || {};
  const attrMent = (player.attributes && player.attributes.mental) || {};
  const attrPhys = (player.attributes && player.attributes.physical) || {};

  const passEl = document.getElementById('player-attr-passing');
  const shotEl = document.getElementById('player-attr-shooting');
  const dribEl = document.getElementById('player-attr-dribbling');
  const tackEl = document.getElementById('player-attr-tackling');

  const visEl = document.getElementById('player-attr-vision');
  const compEl = document.getElementById('player-attr-composure');
  const workEl = document.getElementById('player-attr-workrate');
  const leadEl = document.getElementById('player-attr-leadership');

  const paceEl = document.getElementById('player-attr-pace');
  const stamEl = document.getElementById('player-attr-stamina');
  const strEl = document.getElementById('player-attr-strength');

  nameEl.textContent = player.name || 'Jugador sin nombre';

  const pos = player.position || '-';
  const ageVal = getPlayerGameAge(player);
  const ageText = ageVal != null ? `${ageVal} años` : 'Edad desconocida';

  posEl.textContent = `${pos} • ${ageText}`;
  ageEl.textContent = ageText;

  // Campos biográficos
  birthdateEl.textContent = player.birthDate || 'Desconocida';
  if (nationalityEl) {
    nationalityEl.textContent = '';
    const flagImg = createFlagImgElement(player.nationality);
    if (flagImg) {
      nationalityEl.appendChild(flagImg);
    }
    const natSpan = document.createElement('span');
    natSpan.textContent = player.nationality || 'Desconocida';
    nationalityEl.appendChild(natSpan);
  }
  birthplaceEl.textContent = player.birthPlace || 'Desconocido';
  youthclubEl.textContent = player.youthClub || 'Desconocido';
  overallEl.textContent =
    player.overall != null ? `${player.overall}` : '-';
  moraleEl.textContent = formatPercent(player.morale);
  fitnessEl.textContent = formatPercent(player.fitness);

  wageEl.textContent = formatCurrency(player.wage ?? 0);
  if (player.contractYears != null) {
    contractEl.textContent = `${player.contractYears} año${
      player.contractYears === 1 ? '' : 's'
    } restantes`;
  } else {
    contractEl.textContent = '-';
  }

  const value =
    player.value != null ? player.value : estimateMarketValue(player);
  player.value = value;
  valueEl.textContent = formatCurrency(value);

  transferEl.textContent = player.transferListed
    ? 'En lista de transferibles'
    : 'No transferible';

  if (passEl) passEl.textContent = formatAttr(attrTech.passing);
  if (shotEl) shotEl.textContent = formatAttr(attrTech.shooting);
  if (dribEl) dribEl.textContent = formatAttr(attrTech.dribbling);
  if (tackEl) tackEl.textContent = formatAttr(attrTech.tackling);

  if (visEl) visEl.textContent = formatAttr(attrMent.vision);
  if (compEl) compEl.textContent = formatAttr(attrMent.composure);
  if (workEl) workEl.textContent = formatAttr(attrMent.workRate);
  if (leadEl) leadEl.textContent = formatAttr(attrMent.leadership);

  if (paceEl) paceEl.textContent = formatAttr(attrPhys.pace);
  if (stamEl) stamEl.textContent = formatAttr(attrPhys.stamina);
  if (strEl) strEl.textContent = formatAttr(attrPhys.strength);

  // Disciplina: amarillas / sanción
  if (yellowEl) {
    yellowEl.textContent = String(player.yellowCards ?? 0);
  }

  if (suspEl) {
    if (isPlayerSuspendedNow(player)) {
      suspEl.textContent = `${player.suspension.type} (${player.suspension.matchesRemaining} partido/s)`;
    } else {
      suspEl.textContent = 'Disponible';
    }
  }

  // Historial de tarjetas (últimos 5 eventos)
  if (histBody) {
    histBody.innerHTML = '';
    const history = Array.isArray(player.disciplineHistory)
      ? player.disciplineHistory
      : [];
    const recent = history.slice(-5).reverse();

    if (recent.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
      td.textContent = 'Sin historial de tarjetas registrado.';
      tr.appendChild(td);
      histBody.appendChild(tr);
    } else {
      recent.forEach((ev) => {
        const tr = document.createElement('tr');

        const tdSeason = document.createElement('td');
        tdSeason.textContent = String(ev.season ?? '-');

        const tdMd = document.createElement('td');
        tdMd.textContent = ev.matchday != null ? String(ev.matchday) : '-';

        const tdType = document.createElement('td');
        tdType.textContent = ev.type === 'R' ? 'Roja' : 'Amarilla';

        tr.appendChild(tdSeason);
        tr.appendChild(tdMd);
        tr.appendChild(tdType);

        histBody.appendChild(tr);
      });
    }
  }

  // Estadísticas de la temporada (goles y tarjetas)
  const statsSeasonEl = document.getElementById('player-modal-stats-season');
  const statsGoalsEl = document.getElementById('player-modal-stats-goals');
  const statsYellowsEl = document.getElementById('player-modal-stats-yellows');
  const statsRedsEl = document.getElementById('player-modal-stats-reds');

  const stats = computePlayerSeasonStats(player);

  if (statsSeasonEl) {
    statsSeasonEl.textContent = `Temporada ${stats.season}`;
  }
  if (statsGoalsEl) {
    statsGoalsEl.textContent = String(stats.goals);
  }
  if (statsYellowsEl) {
    statsYellowsEl.textContent = String(stats.yellows);
  }
  if (statsRedsEl) {
    statsRedsEl.textContent = String(stats.reds);
  }
  
  prepareNegotiationUI(player);

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
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

function closePlayerModal() {
  const modal = document.getElementById('player-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  currentModalPlayer = null;
}

function openMatchDetailModal(fixtureId) {
  currentMatchDetailFixtureId = fixtureId;

  const modal = document.getElementById('match-detail-modal');
  if (!modal) return;

  const titleEl = document.getElementById('match-detail-modal-title');
  const subtitleEl = document.getElementById('match-detail-modal-subtitle');
  const eventsListEl = document.getElementById('match-detail-events');

  if (eventsListEl) {
    eventsListEl.innerHTML = '';
  }

  const fixtures = GameState.fixtures || [];
  const fx = fixtures.find((f) => f && f.id === fixtureId);

  const clubs = GameState.clubs || [];
  const clubIndex = new Map();
  clubs.forEach((club) => {
    if (club && club.id) {
      clubIndex.set(club.id, club);
    }
  });

  if (!fx) {
    if (subtitleEl) {
      subtitleEl.textContent = 'No se ha encontrado el partido.';
    }
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
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
        if (p && p.id) {
          playerIndex.set(p.id, { player: p, club });
        }
      });
    });

    const events = Array.isArray(fx.events) ? fx.events.slice() : [];
    events.sort((a, b) => {
      const ma = typeof a.minute === 'number' ? a.minute : 999;
      const mb = typeof b.minute === 'number' ? b.minute : 999;
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
      descSpan.textContent =
        'No se han registrado eventos para este partido.';
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
        const minute =
          typeof ev.minute === 'number' && ev.minute > 0 ? ev.minute : null;
        minuteSpan.textContent = minute != null ? `${minute}'` : '-';

        const descSpan = document.createElement('span');
        descSpan.className = 'match-event-desc';

        const info = ev.playerId ? playerIndex.get(ev.playerId) : null;
        const playerName = (info && info.player && info.player.name) || 'Jugador';

        const clubInfo = ev.clubId ? clubIndex.get(ev.clubId) : null;
        const teamName =
          (clubInfo && (clubInfo.shortName || clubInfo.name)) ||
          ev.clubId ||
          '';

        if (ev.clubId === fx.homeClubId) {
          descSpan.classList.add('match-event-team-home');
        } else if (ev.clubId === fx.awayClubId) {
          descSpan.classList.add('match-event-team-away');
        }

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

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeMatchDetailModal() {
  const modal = document.getElementById('match-detail-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');

  const eventsListEl = document.getElementById('match-detail-events');
  if (eventsListEl) {
    eventsListEl.innerHTML = '';
  }

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

function updateCompetitionView() {
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

function simulateCurrentMatchday() {
  const fixtures = GameState.fixtures || [];
  if (fixtures.length === 0) {
    alert('No hay calendario de liga configurado.');
    return;
  }

  const currentMd = GameState.currentDate.matchday || 1;
  const currentFixtures = fixtures.filter(
    (f) => f.matchday === currentMd && !f.played
  );

  if (currentFixtures.length === 0) {
    alert('Esta jornada ya está simulada.');
    return;
  }

  currentFixtures.forEach((fx) => {
    simulateFixture(fx);
  });

  // Aplicar efectos de fatiga, forma, lesiones y sanciones
  applyPostMatchdayEffects(currentFixtures);
  
  // Stats persistentes (apps/min/goles/tarjetas/lesiones/subs...)


  // Estadísticas persistentes (goles, tarjetas, lesiones, apariciones...)
  // Importante: se aplica DESPUÉS de los efectos post-partido, porque ahí
  // se añaden eventos de lesión y tarjetas al fixture.
  try {
    applyStatsForFixtures(currentFixtures, GameState.currentDate.season || 1);
  } catch (e) {
    // No bloqueamos la simulación por un fallo de stats
    console.warn('No se pudieron aplicar estadísticas:', e);
  }

  recomputeLeagueTable();

  const maxMd =
    GameState.competition?.maxMatchday ||
    Math.max(...fixtures.map((f) => f.matchday || 1));

  if (GameState.currentDate.matchday < maxMd) {
    GameState.currentDate.matchday += 1;
  }

  competitionSelectedMatchday = GameState.currentDate.matchday;
  updateDashboard();
}

// ----------------------------
// Helpers minuto único fixture
// ----------------------------
function createFixtureMinutePicker(existingEvents) {
  const used = new Set();
  (Array.isArray(existingEvents) ? existingEvents : []).forEach((ev) => {
    const m = ev && typeof ev.minute === 'number' ? ev.minute : null;
    if (m && m > 0) used.add(m);
  });
  return function pick() {
    for (let i = 0; i < 18; i++) {
      const m = 1 + Math.floor(Math.random() * 90);
      if (!used.has(m)) {
        used.add(m);
        return m;
      }
    }
    return 1 + Math.floor(Math.random() * 90);
  };
}

function getStartingXIForFixture(club) {
  if (!club) return [];
  ensureClubTactics(club);
  const preferred = Array.isArray(club.lineup) ? club.lineup.slice() : [];
  const available = (club.players || []).filter((p) => p && p.id && !isPlayerUnavailable(p));
  const availableSet = new Set(available.map((p) => p.id));
  const xi = [];
  const seen = new Set();
  preferred.forEach((id) => {
    if (id && !seen.has(id) && availableSet.has(id) && xi.length < 11) {
      xi.push(id); seen.add(id);
    }
  });
  available.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  for (let i = 0; i < available.length && xi.length < 11; i++) {
    const id = available[i].id;
    if (id && !seen.has(id)) { xi.push(id); seen.add(id); }
  }
  return xi.slice(0, 11);
}

function getBenchForFixture(club, xiIds, max = 7) {
  if (!club) return [];
  const xiSet = new Set((xiIds || []).filter(Boolean));
  const available = (club.players || [])
    .filter((p) => p && p.id && !isPlayerUnavailable(p) && !xiSet.has(p.id))
    .slice()
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  return available.slice(0, max).map((p) => p.id);
}

// Ajuste fútbol actual: banquillo 9
function getBenchForFixturePro(club, xiIds) {
  return getBenchForFixture(club, xiIds, 9);
}

/**
 * Usa fuerza de once titular + táctica + forma/fatiga para estimar goles.
 */
function simulateFixture(fx) {
  const homeClub = getClubById(fx.homeClubId);
  const awayClub = getClubById(fx.awayClubId);
  if (!homeClub || !awayClub) return;
  
  // Guardar XI y banquillo usado en el partido (clave para minutos reales)
  fx.season = fx.season ?? (GameState.currentDate?.season || 1);
  fx.homeLineupIds = getStartingXIForFixture(homeClub);
  fx.awayLineupIds = getStartingXIForFixture(awayClub);
  fx.homeBenchIds = getBenchForFixture(homeClub, fx.homeLineupIds, 9);
  fx.awayBenchIds = getBenchForFixture(awayClub, fx.awayLineupIds, 9);
  if (!Array.isArray(fx.substitutions)) fx.substitutions = [];

  const homeProfile = getClubStrengthProfile(homeClub, true);
  const awayProfile = getClubStrengthProfile(awayClub, false);

  const homeAdv = 0.2;

  const diffForHome =
    (homeProfile.attack - awayProfile.defense) / 18 + homeAdv;
  const diffForAway = (awayProfile.attack - homeProfile.defense) / 18;

  let homeExp = 1.1 + diffForHome + Math.random() * 1.3;
  let awayExp = 1.0 + diffForAway + Math.random() * 1.3;

  homeExp = Math.max(0, homeExp);
  awayExp = Math.max(0, awayExp);

  const homeGoals = Math.max(0, Math.round(homeExp));
  const awayGoals = Math.max(0, Math.round(awayExp));

  fx.homeGoals = homeGoals;
  fx.awayGoals = awayGoals;
  fx.played = true;
  fx.events = generateEventsForFixture(fx, homeGoals, awayGoals);

  // Sustituciones tácticas (luego las lesiones pueden forzar más)
  const pickMinute = createFixtureMinutePicker(fx.events);
  generateTacticalSubsForFixture(fx, homeClub, fx.homeLineupIds, fx.homeBenchIds, pickMinute);
  generateTacticalSubsForFixture(fx, awayClub, fx.awayLineupIds, fx.awayBenchIds, pickMinute);

  // Ordenar eventos por minuto
  fx.events.sort((a, b) => {
    const ma = typeof a.minute === 'number' ? a.minute : 999;
    const mb = typeof b.minute === 'number' ? b.minute : 999;
    return ma - mb;
  });
}

function generateEventsForFixture(fx, homeGoals, awayGoals) {
  const events = [];

  const pickMinute = createFixtureMinutePicker(events);
  const homeClub = getClubById(fx.homeClubId);
  const awayClub = getClubById(fx.awayClubId);
  if (!homeClub || !awayClub) return events;
  const homePool = getPotentialScorersForClub(homeClub);
  const awayPool = getPotentialScorersForClub(awayClub);

  for (let i = 0; i < homeGoals; i++) {
    const scorer = pickRandomScorer(homePool);
    if (!scorer) continue;
    const minute = pickMinute();
    events.push({
      minute,
      type: 'GOAL',
      clubId: fx.homeClubId,
      playerId: scorer.id,
    });
  }

  for (let i = 0; i < awayGoals; i++) {
    const scorer = pickRandomScorer(awayPool);
    if (!scorer) continue;
    const minute = pickMinute();
    events.push({
      minute,
      type: 'GOAL',
      clubId: fx.awayClubId,
      playerId: scorer.id,
    });
  }

  events.sort((a, b) => {
    const ma = typeof a.minute === 'number' ? a.minute : 999;
    const mb = typeof b.minute === 'number' ? b.minute : 999;
    return ma - mb;
  });

  return events;
}

function generateTacticalSubsForFixture(fx, club, xiIds, benchIds, pickMinute) {
  if (!fx || !club) return;
  if (!Array.isArray(xiIds) || xiIds.length === 0) return;
  if (!Array.isArray(benchIds) || benchIds.length === 0) return;

  const maxSubs = 5;
  const already = (fx.substitutions || []).filter((s) => s && s.clubId === club.id).length;
  if (already >= maxSubs) return;

  // 0-3 con sesgo a 1-2
  const roll = Math.random();
  let planned = roll < 0.15 ? 0 : roll < 0.6 ? 1 : roll < 0.9 ? 2 : 3;
  planned = Math.min(planned, maxSubs - already);
  if (planned <= 0) return;

  const xiSet = new Set(xiIds);
  const usedIn = new Set((fx.substitutions || []).map((s) => s?.inPlayerId).filter(Boolean));
  const usedOut = new Set((fx.substitutions || []).map((s) => s?.outPlayerId).filter(Boolean));

  const bench = benchIds.filter((id) => id && !usedIn.has(id));
  if (bench.length === 0) return;

  const xiPlayers = (club.players || []).filter((p) => p && xiSet.has(p.id));

  for (let i = 0; i < planned; i++) {
    const minute = pickMinute();

    // Evitar cambiar al portero salvo emergencia
    const outCandidates = xiPlayers
      .filter((p) => p && !usedOut.has(p.id))
      .filter((p) => String(p.position || '').toUpperCase() !== 'POR')
      .sort((a, b) => (a.fitness ?? 1) - (b.fitness ?? 1)); // más cansado primero

    const out = outCandidates[0] || null;
    const inId = bench.shift() || null;
    if (!out || !inId) break;

    usedOut.add(out.id);
    usedIn.add(inId);

    fx.substitutions.push({
      minute,
      type: 'TACTICAL',
      clubId: club.id,
      outPlayerId: out.id,
      inPlayerId: inId,
    });
    fx.events.push({
      minute,
      type: 'SUB',
      clubId: club.id,
      outPlayerId: out.id,
      inPlayerId: inId,
    });
  }
}

function getPotentialScorersForClub(club) {
  if (!club || !Array.isArray(club.players) || club.players.length === 0) {
    return [];
  }

  const players = club.players.filter((p) => p && !isPlayerUnavailable(p));
  const lineupSet = new Set(
    Array.isArray(club.lineup) ? club.lineup.filter((id) => !!id) : []
  );

  const pool = [];

  players.forEach((p) => {
    const pos = p.position || '';
    const overall = Number.isFinite(p.overall) ? p.overall : 60;
    const inLineup = lineupSet.has(p.id);

    let posWeight = 1;
    const posUpper = String(pos).toUpperCase();
    if (['DC', 'SD', 'MP', 'EI', 'ED'].includes(posUpper)) {
      posWeight = 3.2;
    } else if (['MCO', 'MC', 'MCD', 'CAD'].includes(posUpper)) {
      posWeight = 2.3;
    } else if (['DFC', 'LD', 'LI'].includes(posUpper)) {
      posWeight = 1.2;
    } else if (posUpper === 'POR') {
      posWeight = 0.4;
    }

    let weight = overall * posWeight;
    if (inLineup) {
      weight *= 1.3;
    }

    if (!Number.isFinite(weight) || weight <= 0) return;

    pool.push({
      player: p,
      weight,
    });
  });

  return pool;
}

function pickRandomScorer(pool) {
  if (!Array.isArray(pool) || pool.length === 0) {
    return null;
  }

  let total = 0;
  pool.forEach((entry) => {
    const w = Number.isFinite(entry.weight) ? entry.weight : 0;
    if (w > 0) total += w;
  });

  if (total <= 0) {
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx].player || null;
  }

  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    const entry = pool[i];
    const w = Number.isFinite(entry.weight) ? entry.weight : 0;
    if (w <= 0) continue;
    if (r < w) {
      return entry.player || null;
    }
    r -= w;
  }

  const last = pool[pool.length - 1];
  return last ? last.player || null : null;
}

/**
 * Aplica fatiga, forma, posibles lesiones y tarjetas por jornada.
 */
function applyPostMatchdayEffects(fixtures) {
  const clubs = GameState.clubs || [];

  fixtures.forEach((fx) => {
    const pickMinute = createFixtureMinutePicker(
      Array.isArray(fx?.events) ? fx.events : []
    );	 
    const homeClub = getClubById(fx.homeClubId);
    const awayClub = getClubById(fx.awayClubId);
    if (homeClub) {
      applyMatchEffectsToClub(homeClub, true, fx, pickMinute);
    }
    if (awayClub) {
      applyMatchEffectsToClub(awayClub, false, fx, pickMinute);
    }
  });

  clubs.forEach((club) => {
    const playedThisMd = fixtures.some(
      (fx) => fx.homeClubId === club.id || fx.awayClubId === club.id
    );
    if (!playedThisMd) {
      applyRestEffectsToClub(club);
    }
    progressInjuriesForClub(club);
    progressSanctionsForClub(club);
  });
}

function applyMatchEffectsToClub(club, isHome, fx, pickMinute) {
  ensureClubTactics(club);
  ensureClubMedical(club);

  const lineupIds = Array.isArray(club.lineup) ? club.lineup : [];
  const lineupSet = new Set(lineupIds);

  const players = Array.isArray(club.players) ? club.players : [];
  const goalsFor = isHome ? fx.homeGoals : fx.awayGoals;
  const goalsAgainst = isHome ? fx.awayGoals : fx.homeGoals;

  const leagueStrictness = GameState.league.cardStrictness ?? 1.0;
  const refereeStrictness = fx.refereeStrictness ?? 1.0;
  const tacticsAggression = getTacticalAggression(club);

  players.forEach((p) => {
    const played = lineupSet.has(p.id) && !isPlayerUnavailable(p);

    if (played) {
      const currentFitness = p.fitness ?? 0.9;
      p.fitness = Math.max(0, currentFitness - 0.15);

      if (!Number.isFinite(p.form)) p.form = 0;
      if (goalsFor > goalsAgainst) {
        p.form += 0.35;
      } else if (goalsFor < goalsAgainst) {
        p.form -= 0.35;
      } else {
        p.form += 0.05;
      }
      p.form = Math.max(-3, Math.min(3, p.form));

      // Lesiones (modificadas por infra médica)
      if (!isPlayerInjuredNow(p)) {
        const fit = p.fitness ?? 0.9;
        const baseProb = 0.03;
        const fatigueFactor = 0.12 * (1 - fit);
        const medicalFactor = getMedicalInjuryModifier(club);
        const injuryProb = (baseProb + fatigueFactor) * medicalFactor;

        if (Math.random() < injuryProb) {
          const injury = generateRandomInjury();
          p.injury = {
            ...injury,
            startedSeason: GameState.currentDate.season || 1,
            startedMatchday: fx?.matchday ?? GameState.currentDate.matchday ?? null,
          };
          p.fitness = Math.min(p.fitness ?? 1, 0.6);

          // Registrar evento de lesión en el partido
          if (fx) {
            if (!Array.isArray(fx.events)) {
              fx.events = Array.isArray(fx.events) ? fx.events.slice() : [];
            }
            fx.events.push({
              minute: typeof pickMinute === 'function' ? pickMinute() : null,
              type: 'INJURY',
              clubId: club.id,
              playerId: p.id,
              injuryType: injury.type,
            });
          }
        }
      }

      // Tarjetas (amarillas y posibles rojas), con árbitros + dureza liga + táctica
      applyCardsForPlayer(p, {
        season: GameState.currentDate.season || 1,
        matchday: fx.matchday,
        pickMinute,
        leagueStrictness,
        refereeStrictness,
        tacticsAggression,
        fixture: fx,
        clubId: club.id,
      });
    } else {
      if (!isPlayerInjuredNow(p)) {
        p.fitness = Math.min(1, (p.fitness ?? 0.8) + 0.08);
      } else {
        p.fitness = Math.min(1, (p.fitness ?? 0.8) + 0.05);
      }

      if (!Number.isFinite(p.form)) p.form = 0;
      p.form *= 0.9;
    }
  });
}

function maybeAddForcedSubstitution(fx, club, injuredPlayerId, minute) {
  if (!fx || !club || !injuredPlayerId) return;
  const maxSubs = 3;
  if (!Array.isArray(fx.substitutions)) fx.substitutions = [];
  const usedByClub = fx.substitutions.filter((s) => s && s.clubId === club.id).length;
  if (usedByClub >= maxSubs) return;

  const xiIds =
    fx.homeClubId === club.id ? fx.homeLineupIds :
    fx.awayClubId === club.id ? fx.awayLineupIds : [];
  const benchIds =
    fx.homeClubId === club.id ? fx.homeBenchIds :
    fx.awayClubId === club.id ? fx.awayBenchIds : [];

  const xiSet = new Set(Array.isArray(xiIds) ? xiIds : []);
  if (!xiSet.has(injuredPlayerId)) return;

  // si ya salió por otro cambio, no duplicar
  const alreadyOut = fx.substitutions.some((s) => s && s.clubId === club.id && s.outPlayerId === injuredPlayerId);
  if (alreadyOut) return;

  const usedIn = new Set(fx.substitutions.map((s) => s?.inPlayerId).filter(Boolean));
  const candidate = (Array.isArray(benchIds) ? benchIds : []).find((id) => id && !usedIn.has(id));
  if (!candidate) return;

  const m = typeof minute === 'number' ? minute : null;
  fx.substitutions.push({
    minute: m,
    type: 'INJURY',
    clubId: club.id,
    outPlayerId: injuredPlayerId,
    inPlayerId: candidate,
  });
  if (!Array.isArray(fx.events)) fx.events = [];
  fx.events.push({
    minute: m,
    type: 'SUB',
    clubId: club.id,
    outPlayerId: injuredPlayerId,
    inPlayerId: candidate,
  });
}

function applyRestEffectsToClub(club) {
  ensureClubMedical(club);
  const players = Array.isArray(club.players) ? club.players : [];
  players.forEach((p) => {
    if (!isPlayerInjuredNow(p)) {
      p.fitness = Math.min(1, (p.fitness ?? 0.8) + 0.1);
    } else {
      p.fitness = Math.min(1, (p.fitness ?? 0.8) + 0.06);
    }

    if (!Number.isFinite(p.form)) p.form = 0;
    p.form *= 0.9;
  });
}

function progressInjuriesForClub(club) {
  ensureClubMedical(club);
  const players = Array.isArray(club.players) ? club.players : [];
  const extraChance = getPhysioRecoveryExtraChance(club);
  const currentSeason = GameState.currentDate?.season || 1;
  const currentMatchday = GameState.currentDate?.matchday || 1;
  
  players.forEach((p) => {
    if (p.injury && p.injury.matchesRemaining != null) {
       if (p.injury.startedSeason === currentSeason && p.injury.startedMatchday === currentMatchday) return;
      p.injury.matchesRemaining -= 1;
      if (p.injury.matchesRemaining > 0 && extraChance > 0) {
        if (Math.random() < extraChance) {
          p.injury.matchesRemaining -= 1;
        }
      }
      if (p.injury.matchesRemaining <= 0) {
        p.injury = null;
      }
    }
  });
}

function progressSanctionsForClub(club) {
  const players = Array.isArray(club.players) ? club.players : [];
  const currentSeason = GameState.currentDate?.season || 1;
  const currentMatchday = GameState.currentDate?.matchday || 1;
  players.forEach((p) => {
    if (p.suspension && p.suspension.matchesRemaining != null) {
      if (p.suspension.startedSeason === currentSeason && p.suspension.startedMatchday === currentMatchday) return;
      p.suspension.matchesRemaining -= 1;
      if (p.suspension.matchesRemaining <= 0) {
        p.suspension = null;
      }
    }
  });
}

/**
 * Genera una lesión aleatoria con duración en jornadas futuras.
 */
function generateRandomInjury() {
  const roll = Math.random();
  let type = 'Molestias musculares';
  let matches = 1 + Math.floor(Math.random() * 2); // 1-2

  if (roll > 0.7 && roll <= 0.9) {
    type = 'Rotura muscular';
    matches = 2 + Math.floor(Math.random() * 4); // 2-5
  } else if (roll > 0.9) {
    type = 'Lesión grave de rodilla';
    matches = 4 + Math.floor(Math.random() * 6); // 4-9
  }

  return {
    type,
    matchesRemaining: matches,
  };
}

/**
 * Niveles médicos → modificadores de probabilidad de lesión
 */
function getMedicalInjuryModifier(club) {
  const lvl = club.medical?.centerLevel ?? 1;
  switch (lvl) {
    case 2:
      return 0.8;
    case 3:
      return 0.65;
    case 4:
      return 0.5;
    default:
      return 1.0;
  }
}

/**
 * Niveles de fisios → probabilidad extra de recuperar 1 partido más
 */
function getPhysioRecoveryExtraChance(club) {
  const lvl = club.medical?.physioLevel ?? 1;
  switch (lvl) {
    case 2:
      return 0.3;
    case 3:
      return 0.55;
    case 4:
      return 0.8;
    default:
      return 0;
  }
}

/**
 * Añade tarjetas y sanciones a un jugador que ha disputado el partido.
 * Tiene en cuenta: dureza liga + árbitro + táctica + perfil del jugador.
 */
function applyCardsForPlayer(player, ctx) {
  if (!Number.isFinite(player.yellowCards)) player.yellowCards = 0;
  if (!Array.isArray(player.disciplineHistory)) {
    player.disciplineHistory = [];
  }

  const leagueStrictness = ctx.leagueStrictness ?? 1.0;
  const refereeStrictness = ctx.refereeStrictness ?? 1.0;
  const tacticsAggression = ctx.tacticsAggression ?? 1.0;

  const overall = player.overall ?? 60;
  const tackling =
    player.attributes?.technical?.tackling != null
      ? player.attributes.technical.tackling
      : overall;

  let playerAggFactor = 1.0 + (tackling - 60) / 80; // aprox 0.5 – 1.5
  playerAggFactor = Math.max(0.7, Math.min(1.4, playerAggFactor));

  const envFactor =
    leagueStrictness * refereeStrictness * tacticsAggression * playerAggFactor;

  const baseYellowProb = 0.18;
  const baseRedProb = 0.02;

  const yellowProb = Math.min(0.6, baseYellowProb * envFactor);
  const redProb = Math.min(0.12, baseRedProb * envFactor);

  let gotYellow = false;
  if (Math.random() < yellowProb) {
    player.yellowCards += 1;
    gotYellow = true;
    recordCardEvent(player, 'Y', {
      ...ctx,
      minute: typeof ctx.pickMinute === 'function' ? ctx.pickMinute() : null,
    });
  }

  let gotRed = false;
  if (Math.random() < redProb) {
    gotRed = true;
    recordCardEvent(player, 'R', {
      ...ctx,
      minute: typeof ctx.pickMinute === 'function' ? ctx.pickMinute() : null,
    });
  }

  // Sanción por acumulación de amarillas (cada 5 amarillas → 1 partido)
  if (player.yellowCards >= 5) {
    const bans = Math.floor(player.yellowCards / 5);
    const banMatches = bans;

    if (!player.suspension || player.suspension.matchesRemaining <= 0) {
      player.suspension = {
        type: 'Acumulación de amarillas',
        matchesRemaining: banMatches,
        startedSeason: ctx.season ?? 1,
        startedMatchday: ctx.matchday ?? null,
      };
    } else {
      player.suspension.matchesRemaining += banMatches;
      player.suspension.type = 'Acumulación de amarillas';
      player.suspension.startedSeason = ctx.season ?? 1;
      player.suspension.startedMatchday = ctx.matchday ?? null;
    }

    player.yellowCards = player.yellowCards % 5;
  }

  // Sanción por roja directa (1–2 partidos)
  if (gotRed) {
    const extraMatches = 1 + Math.floor(Math.random() * 2); // 1 ó 2
    if (!player.suspension || player.suspension.matchesRemaining <= 0) {
      player.suspension = {
        type: 'Roja directa',
        matchesRemaining: extraMatches,
        startedSeason: ctx.season ?? 1,
        startedMatchday: ctx.matchday ?? null,
      };
    } else {
      player.suspension.matchesRemaining += extraMatches;
      player.suspension.type = 'Roja directa';
      player.suspension.startedSeason = ctx.season ?? 1;
      player.suspension.startedMatchday = ctx.matchday ?? null;
    }
  }
}

/**
 * Registra un evento de tarjeta en el historial del jugador.
 */
function recordCardEvent(player, type, ctx) {
  if (!Array.isArray(player.disciplineHistory)) {
    player.disciplineHistory = [];
  }
  player.disciplineHistory.push({
    season: ctx.season ?? 1,
    matchday: ctx.matchday ?? null,
    type, // 'Y' o 'R'
    minute: ctx.minute ?? null,
  });

  // Evento de partido asociado (si hay fixture en contexto)
  if (ctx && ctx.fixture) {
    const fx = ctx.fixture;
    if (!Array.isArray(fx.events)) {
      fx.events = Array.isArray(fx.events) ? fx.events.slice() : [];
    }
    fx.events.push({
      minute: ctx.minute ?? null,
      type: type === 'R' ? 'RED_CARD' : 'YELLOW_CARD',
      clubId: ctx.clubId ?? null,
      playerId: player.id,
    });
  }
}


// ================================
// Vista Estadísticas
// ================================
function updateStatsView() {
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

/**
 * Devuelve { attack, defense } según once, táctica, forma y fitness.
 */
function getClubStrengthProfile(club, isHome) {
  ensureClubTactics(club);

  const players =
    Array.isArray(club.players) && club.players.length > 0
      ? club.players
      : null;

  let lineupPlayers = [];
  if (players && Array.isArray(club.lineup) && club.lineup.length > 0) {
    const lineupSet = new Set(club.lineup);
    lineupPlayers = players.filter(
      (p) => lineupSet.has(p.id) && !isPlayerUnavailable(p)
    );
  }

  const basePlayers =
    lineupPlayers.length > 0
      ? lineupPlayers
      : players
      ? players.filter((p) => !isPlayerUnavailable(p))
      : [];

  let baseOverall = 60;
  if (basePlayers.length > 0) {
    const sum = basePlayers.reduce((acc, p) => {
      const ov = p.overall ?? 60;
      const fit = p.fitness ?? 0.9;
      const form = p.form ?? 0;

      const fitnessFactor = 0.6 + 0.4 * fit;
      const formBoost = form * 1.5;
      const effective = ov * fitnessFactor + formBoost;

      return acc + effective;
    }, 0);
    baseOverall = sum / basePlayers.length;
  }

  let attack = baseOverall;
  let defense = baseOverall;

  const t = club.tactics || {};
  const mentality = t.mentality || 'BALANCED';
  const tempo = t.tempo || 'NORMAL';
  const pressure = t.pressure || 'NORMAL';

  if (mentality === 'OFFENSIVE') {
    attack += 4;
    defense -= 2;
  } else if (mentality === 'DEFENSIVE') {
    attack -= 2;
    defense += 4;
  }

  if (tempo === 'FAST') {
    attack += 2;
  } else if (tempo === 'SLOW') {
    attack -= 1;
  }

  if (pressure === 'HIGH') {
    attack += 1;
    defense -= 1;
  } else if (pressure === 'LOW') {
    defense += 1;
  }

  if (isHome) {
    attack += 1;
  }

  return { attack, defense };
}

/**
 * Nivel de agresividad táctica del club (influye en tarjetas).
 */
function getTacticalAggression(club) {
  ensureClubTactics(club);
  const t = club.tactics || {};
  let factor = 1.0;

  if (t.mentality === 'OFFENSIVE') factor += 0.15;
  else if (t.mentality === 'DEFENSIVE') factor -= 0.1;

  if (t.pressure === 'HIGH') factor += 0.2;
  else if (t.pressure === 'LOW') factor -= 0.1;

  return Math.max(0.7, Math.min(1.4, factor));
}

// ================================
// Pantalla MÉDICOS
// ================================

function updateMedicalView() {
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

function updateQuickNotes() {
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

function describeCenterLevel(level) {
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

function describePhysioLevel(level) {
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

function upgradeMedical(kind) {
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

function getMedicalUpgradeCost(kind, currentLevel) {
  const base = kind === 'center' ? 2_000_000 : 1_200_000;
  const multiplier = 1 + (currentLevel - 1) * 0.6;
  return Math.round(base * multiplier);
}

// ================================
// Ayudas de jugador (lesión / sanción / disponibilidad)
// ================================

function isPlayerInjuredNow(player) {
  return !!(
    player &&
    player.injury &&
    player.injury.matchesRemaining != null &&
    player.injury.matchesRemaining > 0
  );
}

function isPlayerSuspendedNow(player) {
  return !!(
    player &&
    player.suspension &&
    player.suspension.matchesRemaining != null &&
    player.suspension.matchesRemaining > 0
  );
}

function isPlayerUnavailable(player) {
  return isPlayerInjuredNow(player) || isPlayerSuspendedNow(player);
}

// ================================
// Utilidades
// ================================

// Calendario interno del juego:
//  - Temporada 1 comienza el 1 de agosto de 2025
//  - Cada jornada suma 7 días
//  - Cada temporada suma 1 año
const GAME_CALENDAR = {
  BASE_SEASON_YEAR: 2025,
  SEASON_START_MONTH: 8, // agosto
  SEASON_START_DAY: 1,
  DAYS_PER_MATCHDAY: 7,
};

// Devuelve la fecha "real" del juego para una temporada y jornada dadas
function getGameDateFor(season, matchday) {
  const year = GAME_CALENDAR.BASE_SEASON_YEAR + (season - 1);
  const d = new Date(
    Date.UTC(
      year,
      GAME_CALENDAR.SEASON_START_MONTH - 1,
      GAME_CALENDAR.SEASON_START_DAY
    )
  );

  const md = Math.max(1, matchday || 1);
  const daysToAdd = (md - 1) * GAME_CALENDAR.DAYS_PER_MATCHDAY;
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d;
}

// Fecha actual de juego según GameState.currentDate
function getCurrentGameDate() {
  const season = GameState.currentDate?.season || 1;
  const matchday = GameState.currentDate?.matchday || 1;
  return getGameDateFor(season, matchday);
}

// Formato "15/09/2025"
function formatGameDateLabel(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Edad del jugador en función de su fecha de nacimiento y la fecha actual del juego.
// Si no hay birthDate, cae al campo age (para datos antiguos / jugadores ficticios).
function getPlayerGameAge(player, fallbackAge = null) {
  const dobStr = player.birthDate;
  if (dobStr) {
    const dob = new Date(dobStr);
    if (!Number.isNaN(dob.getTime())) {
      const now = getCurrentGameDate();
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

function getCoatUrlForClubId(clubId) {
  if (!clubId) return null;
  const id = String(clubId).toLowerCase();

  // Mapa id de club → fichero de escudo en img/coats
  const map = {
    // =====================
    // LaLiga (España)
    // =====================
    alaves: 'es/Alavés.png',
    athletic: 'es/Athletic Bilbao.png',
    atletico: 'es/Atlético Madrid.png',
    barcelona: 'es/FC Barcelona.png',
    celta: 'es/Celta de Vigo.png',
    elche: 'es/Elche.png',
    espanyol: 'es/RCD Espanyol.png',
    getafe: 'es/Getafe.png',
    girona: 'es/Girona.png',
    mallorca: 'es/RCD Mallorca.png',
    osasuna: 'es/Osasuna.png',
    rayo: 'es/rayo Vallecano.png',
    betis: 'es/Real Betis.png',
    realmadrid: 'es/Real Madrid.png',
    realsociedad: 'es/Real Sociedad.png',
    sevilla: 'es/Sevilla.png',
    valencia: 'es/Valencia.png',
    villarreal: 'es/Villarreal.png',
    realoviedo: 'es/Real Oviedo.png',
    levante: 'es/Levante.png',

    // =====================
    // Premier League (Inglaterra) – clubs de tu liga
    // =====================
    arsenal: 'en/Arsenal.png',
    mancity: 'en/Manchester City.png',
    liverpool: 'en/Liverpool.png',
    manutd: 'en/Manchester United.png',
    chelsea: 'en/Chelsea.png',
    tottenham: 'en/Tottenham.png',
    newcastle: 'en/Newcastle.png',
    astonvilla: 'en/Aston Villa.png',
    brighton: 'en/Brighton.png',
    westham: 'en/west Ham.png',

    // Premier extra (equipos para los que también tienes escudo)
    everton: 'en/Everton.png',
    leeds: 'en/Leeds.png',
    bournemouth: 'en/Bournemouth.png',
    burnley: 'en/Burnley.png',
    nottingham: 'en/Nottingham.png',
    wolves: 'en/Wolves.png',
    brentford: 'en/brentford.png',
    sunderland: 'en/Sunderland AFC.png',

    // =====================
    // Serie A (Italia) – clubs de tu liga
    // =====================
    acmilan: 'it/Milan.png',
    inter: 'it/inter.png',
    juventus: 'it/Juventus.png',
    napoli: 'it/napoli.png',
    roma: 'it/Roma.png',
    lazio: 'it/Lazio.png',
    atalanta: 'it/Atalanta.png',
    fiorentina: 'it/Fiorentina.png',
    bologna: 'it/Bolonia.png',   // faltaba en tu map original
    torino: 'it/Torino.png',

    // Serie A / Italia extra (escudos que también tienes en coats)
    cagliari: 'it/Cagliari.png',
    udinese: 'it/Udinese.png',
    hellasverona: 'it/Hellas Verona.png',
    sassuolo: 'it/Sassuolo.png',
    lecce: 'it/Lecce.png',
    como: 'it/Como.png',

    // =====================
    // Bundesliga (Alemania)
    // =====================
    bayern: 'de/Bayern Munich.png',
    dortmund: 'de/Dortmund.png',
    leverkusen: 'de/Leverkusen.png',
    augsburg: 'de/Augsburgo.png',
    colonia: 'de/Colonia.png',
    unionberlin: 'de/FC Union Berlin.png',
    frankfurt: 'de/Frankfurt.png',
    freiburg: 'de/Friburgo.png',
    hamburg: 'de/Hamburg.png',
    heidenheim: 'de/Heidenheim.png',
    hoffenheim: 'de/Hoffenheim.png',
    leipzig: 'de/Leipzig.png',
    mainz: 'de/Mainz 05.png',
monchengladbach: 'de/Monchengladbach.png',
stpauli: 'de/St Pauli.png',
stuttgart: 'de/Stuttgart.png',
werderbremen: 'de/Werder Bremen.png',
wolfsburg: 'de/Wolfsburg.png',   

    // =====================
    // Ligue 1 (Francia)
    // =====================
    psg: 'fr/PSG.png',
    metz: 'fr/Metz.png',
    monaco: 'fr/Monaco.png',
    nantes: 'fr/Nantes.png',
    angers: 'fr/Angers.png',
    auxerre: 'fr/Auxerre.png',
    lehavre: 'fr/Le Havre.png',
    lens: 'fr/Lens.png',
    lorient: 'fr/Lorient.png',
    lille: 'fr/LOSC.png',   // Lille OSC
    lyon: 'fr/Lyon.png',
    marseille: 'fr/Marsella.png',   
nice: 'fr/Niza.png',
parisfc: 'fr/Paris FC.png',
strasbourg: 'fr/Racing Estrasburgo.png',
rennes: 'fr/Rennes.png',
brest: 'fr/Stade Brestois.png',
toulouse: 'fr/Toulouse.png',

    // =====================
    // Eredivisie (Países Bajos) – los de tu liga
    // =====================
    ajax: 'nl/Ajax.png',                  // en tu proyecto
    psv: 'nl/PSV Eindhoven.png',          // en tu proyecto
    feyenoord: 'nl/Feyenoord.png',        // en tu proyecto
    az: 'nl/AZ Alkmaar.png',              // en tu proyecto
    nec: 'nl/NEC.png',                    // en tu proyecto
    utrecht: 'nl/Utrecht.png',
    twente: 'nl/Twente.png',
    heerenveen: 'nl/Heerenveen.png',
    groningen: 'nl/FC Groningen.png',
    sparta: 'nl/Sparta Rotterdam.png',

    // Eredivisie extra (otros escudos que ya tienes)
    heracles: 'nl/Heracles.png',
    nac: 'nl/NAC.png',
    telstar: 'nl/SC Telstar.png',
    volendam: 'nl/Volendam.png',
    zwolle: 'nl/Zwolle.png',

    // =====================
    // (reservado) Primeira Liga (Portugal)
    // =====================
    // En el coats.zip que has subido ahora no aparecen PNG de Benfica, Porto, etc.
    // Cuando los añadas en img/coats/pt/..., aquí se pueden mapear:
    // benfica: 'pt/Benfica.png',
    // porto: 'pt/Porto.png',
    // ...
  };

  const filename = map[id];
  if (!filename) return null;
  return `img/coats/${filename}`;
}

function createCoatImgElement(clubId, clubName, size = 20) {
  const url = getCoatUrlForClubId(clubId);
  if (!url) return null;

  const img = document.createElement('img');
  img.src = url;
  img.alt = clubName ? `Escudo de ${clubName}` : 'Escudo del club';
  img.classList.add('coat-icon');
  img.loading = 'lazy';
  if (size != null) {
    img.width = size;
    img.height = size;
  }
  return img;
}

function getFlagUrlForNationality(nationality) {
  if (!nationality) return null;
  const n = nationality.trim();
  if (!n) return null;

  // Mapa nacionalidad (ES) → fichero de bandera
  const map = {
    // Europa
    Albania: 'Flag_of_Albania.svg',
    Andorra: 'Flag_of_Andorra.svg',
    Austria: 'Flag_of_Austria.svg',
    Bélgica: 'Flag_of_Belgium.svg',
    Belgica: 'Flag_of_Belgium.svg',
    Croacia: 'Flag_of_Croatia.svg',
    Kósovo: 'Flag_of_Kosovo.svg',
    Dinamarca: 'Flag_of_Denmark.svg',
    Finlandia: 'Flag_of_Finland.svg',
    Grecia: 'Flag_of_Greece.svg',
    Inglaterra: 'Flag_of_England.svg',
    Islandia: 'Flag_of_Iceland.svg',
    Francia: 'Flag_of_France.svg',
    Georgia: 'Flag_of_Georgia.svg',
    Alemania: 'Flag_of_Germany.svg',
    Italia: 'Flag_of_Italy.svg',
    Macedonia: 'Flag_of_North_Macedonia.svg',
    'Macedonia del Norte': 'Flag_of_North_Macedonia.svg',
    Noruega: 'Flag_of_Norway.svg',
    Polonia: 'Flag_of_Poland.svg',
    Portugal: 'Flag_of_Portugal.svg',
    Rumanía: 'Flag_of_Romania.svg',
    Rumania: 'Flag_of_Romania.svg',
    Rusia: 'Flag_of_Russia.svg',
    Eslovaquia: 'Flag_of_Slovakia.svg',
    Eslovenia:	'Flag_of_Slovenia.svg',
    España: 'Flag_of_Spain.svg',
    Serbia: 'Flag_of_Serbia.svg',
    Suecia: 'Flag_of_Sweden.svg',
    Suiza: 'Flag_of_Switzerland.svg',
    'República Checa': 'Flag_of_the_Czech_Republic.svg',
    'Republica Checa': 'Flag_of_the_Czech_Republic.svg',
    'República Dominicana': 'Flag_of_the_Dominican_Republic.svg',
    'Republica Dominicana': 'Flag_of_the_Dominican_Republic.svg',
    'Países Bajos': 'Flag_of_the_Netherlands.svg',
    'Paises Bajos': 'Flag_of_the_Netherlands.svg',
    Ucrania: 'Flag_of_Ukraine.svg',

    // América
    Argentina: 'Flag_of_Argentina.svg',
    Brasil: 'Flag_of_Brazil.svg',	
    Canadá: 'Flag_of_Canada.svg',
    Chile: 'Flag_of_Chile.svg',
    Colombia: 'Flag_of_Colombia.svg',
    Ecuador: 'Flag_of_Ecuador.svg',
   'Estados Unidos': 'Flag_of_the_United_States.svg',
   Honduras: 'Flag_of_Honduras_(2022–present).svg',
   'Guadalupe (Francia)':  'Flag_of_France.svg',
    México: 'Flag_of_Mexico.svg',
    Mexico: 'Flag_of_Mexico.svg',
    Surinam: 'Flag_of_Suriname.svg',
    Uruguay: 'Flag_of_Uruguay.svg',
    Venezuela: 'Flag_of_Venezuela.svg',

    // África
    Angola: 'Flag_of_Angola.svg',
   'Cabo Verde': 'Flag_of_Cape_Verde.svg',
    Camerún: 'Flag_of_Cameroon.svg',
    Camerun: 'Flag_of_Cameroon.svg',
   'República Centroafricana': 'Flag_of_the_Central_African_Republic.svg',
   'República Democrática del Congo': 'Flag_of_the_Democratic_Republic_of_the_Congo.svg',
   'Costa de Marfil': 'Flag_of_Côte_d_Ivoire.svg',
    Ghana:	'Flag_of_Ghana.svg',
    Guinea: 'Flag_of_Guinea.svg',
   'Guinea Ecuatorial': 'Flag_of_Equatorial_Guinea.svg',
    Marruecos: 'Flag_of_Morocco.svg',
    Mozambique: 'Flag_of_Mozambique.svg',
    Niger: 'Flag_of_Niger.svg',
    Nigeria: 'Flag_of_Nigeria.svg',
    Senegal: 'Flag_of_Senegal.svg',
    Togo: 'Flag_of_Togo_(3-2).svg',

    // Asia / otros
    Israel: 'Flag_of_Israel.svg',
    Japón: 'Flag_of_Japan.svg',
    Kazajistán: 'Flag_of_Kazakhstan.svg',
    Kazajistan: 'Flag_of_Kazakhstan.svg',
    Turquía: 'Flag_of_Turkey.svg',
    Turquia: 'Flag_of_Turkey.svg',
	
    // Oceania
    Australia: 'Flag_of_Australia_(converted).svg',
	
  };

  const filename = map[n];
  if (!filename) return null;
  return `img/flags/${filename}`;
}


function createFlagImgElement(nationality, size = 16) {
  const url = getFlagUrlForNationality(nationality);
  if (!url) return null;

  const img = document.createElement('img');
  img.src = url;
  img.alt = nationality ? `Bandera de ${nationality}` : 'Bandera';
  img.classList.add('flag-icon');
  img.loading = 'lazy';
  if (size != null) {
    img.width = size;
    img.height = size;
  }
  return img;
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
