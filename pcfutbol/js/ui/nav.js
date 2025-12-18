// js/ui/nav.js

export function showDashboard(startScreen, dashboardScreen) {
  if (!startScreen || !dashboardScreen) return;
  startScreen.classList.add('hidden');
  dashboardScreen.classList.remove('hidden');
}

/**
 * view: 'dashboard' | 'squad' | 'alignment' | 'tactics' | 'competition' | 'standings' | 'stats' | 'medical'
 */
export function setActiveSubview(view, ctx) {
  const {
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
  } = ctx || {};

  // Ocultar todas
  viewDashboard?.classList.add('hidden');
  viewSquad?.classList.add('hidden');
  viewAlignment?.classList.add('hidden');
  viewTactics?.classList.add('hidden');
  viewCompetition?.classList.add('hidden');
  viewStandings?.classList.add('hidden');
  viewStats?.classList.add('hidden');
  viewMedical?.classList.add('hidden');

  // Quitar activo en todos los botones
  btnNavDashboard?.classList.remove('active');
  btnNavSquad?.classList.remove('active');
  btnNavAlignment?.classList.remove('active');
  btnNavTactics?.classList.remove('active');
  btnNavCompetition?.classList.remove('active');
  btnNavStandings?.classList.remove('active');
  btnNavStats?.classList.remove('active');
  btnNavMedical?.classList.remove('active');

  // Activar el seleccionado
  if (view === 'dashboard') {
    viewDashboard?.classList.remove('hidden');
    btnNavDashboard?.classList.add('active');
  } else if (view === 'squad') {
    viewSquad?.classList.remove('hidden');
    btnNavSquad?.classList.add('active');
  } else if (view === 'alignment') {
    viewAlignment?.classList.remove('hidden');
    btnNavAlignment?.classList.add('active');
  } else if (view === 'tactics') {
    viewTactics?.classList.remove('hidden');
    btnNavTactics?.classList.add('active');
  } else if (view === 'competition') {
    viewCompetition?.classList.remove('hidden');
    btnNavCompetition?.classList.add('active');
  } else if (view === 'standings') {
    viewStandings?.classList.remove('hidden');
    btnNavStandings?.classList.add('active');
  } else if (view === 'stats') {
    viewStats?.classList.remove('hidden');
    btnNavStats?.classList.add('active');
  } else if (view === 'medical') {
    viewMedical?.classList.remove('hidden');
    btnNavMedical?.classList.add('active');
  }
}