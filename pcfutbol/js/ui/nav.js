// js/ui/nav.js

export function showDashboard(startScreen, dashboardScreen) {
  if (!startScreen || !dashboardScreen) return;
  startScreen.classList.add('hidden');
  dashboardScreen.classList.remove('hidden');
}

/**
 * view: 'dashboard' | 'squad' | 'alignment' | 'tactics' | 'calendar' | 'results' | 'nextmatch' | 'standings' | 'stats' | 'medical'
 */
export function setActiveSubview(view, ctx) {
  const {
    viewDashboard,
    viewSquad,
    viewAlignment,
    viewTactics,
    viewCalendar,
    viewResults,
    viewNextMatch,
    viewStandings,
    viewStats,
    viewMedical,
    btnNavDashboard,
    btnNavSquad,
    btnNavAlignment,
    btnNavTactics,
    btnNavCalendar,
    btnNavResults,
    btnNavNextMatch,
    btnNavStandings,
    btnNavStats,
    btnNavMedical,
  } = ctx || {};

  // Ocultar todas
  viewDashboard?.classList.add('hidden');
  viewSquad?.classList.add('hidden');
  viewAlignment?.classList.add('hidden');
  viewTactics?.classList.add('hidden');
  viewCalendar?.classList.add('hidden');
  viewResults?.classList.add('hidden');
  viewNextMatch?.classList.add('hidden');
  viewStandings?.classList.add('hidden');
  viewStats?.classList.add('hidden');
  viewMedical?.classList.add('hidden');

  // Quitar activo en todos los botones (soporta .active y .is-active)
  [
    btnNavDashboard,
    btnNavSquad,
    btnNavAlignment,
    btnNavTactics,
    btnNavCalendar,
    btnNavResults,
    btnNavNextMatch,
    btnNavStandings,
    btnNavStats,
    btnNavMedical,
  ].forEach((b) => {
    b?.classList.remove('active');
    b?.classList.remove('is-active');
  });

  // Activar el seleccionado
  if (view === 'dashboard') {
    viewDashboard?.classList.remove('hidden');
    btnNavDashboard?.classList.add('active');
    btnNavDashboard?.classList.add('is-active');
  } else if (view === 'squad') {
    viewSquad?.classList.remove('hidden');
    btnNavSquad?.classList.add('active');
    btnNavSquad?.classList.add('is-active');
  } else if (view === 'alignment') {
    viewAlignment?.classList.remove('hidden');
    btnNavAlignment?.classList.add('active');
    btnNavAlignment?.classList.add('is-active');
  } else if (view === 'tactics') {
    viewTactics?.classList.remove('hidden');
    btnNavTactics?.classList.add('active');
    btnNavTactics?.classList.add('is-active');
  } else if (view === 'calendar') {
    viewCalendar?.classList.remove('hidden');
    btnNavCalendar?.classList.add('active');
    btnNavCalendar?.classList.add('is-active');
  } else if (view === 'results') {
    viewResults?.classList.remove('hidden');
    btnNavResults?.classList.add('active');
    btnNavResults?.classList.add('is-active');
  } else if (view === 'nextmatch') {
    viewNextMatch?.classList.remove('hidden');
    btnNavNextMatch?.classList.add('active');
    btnNavNextMatch?.classList.add('is-active');
  } else if (view === 'standings') {
    viewStandings?.classList.remove('hidden');
    btnNavStandings?.classList.add('active');
    btnNavStandings?.classList.add('is-active');
  } else if (view === 'stats') {
    viewStats?.classList.remove('hidden');
    btnNavStats?.classList.add('active');
    btnNavStats?.classList.add('is-active');
  } else if (view === 'medical') {
    viewMedical?.classList.remove('hidden');
    btnNavMedical?.classList.add('active');
    btnNavMedical?.classList.add('is-active');
  }
}