/**
 * Navegación UI.
 *
 * Objetivo: que ui.js no tenga lógica de tabs/handlers.
 * Este módulo solo se encarga de:
 *  - cambiar la subvista activa (tabs)
 *  - refrescar la vista correspondiente
 */

import { setActiveSubview } from './nav.js';

let _bound = false;

/**
 * Inicializa handlers de navegación.
 *
 * @param {object} ctx
 *   Subvistas: dashboard/squad/alignment/tactics/calendar/results/nextmatch/standings/stats/medical
 * @param {object} updaters
 *   Callbacks: updateDashboard/updateSquadView/updateAlignmentView/updateTacticsView/
 *              updateCalendarView/updateResultsView/updateNextMatchView/updateStandingsView/updateStatsView/updateMedicalView
 */
export function initNavigation(ctx, updaters = {}) {
  const {
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

  btnNavDashboard?.addEventListener('click', () => {
    setActiveSubview('dashboard', ctx);
    updaters.updateDashboard?.();
  });
  btnNavSquad?.addEventListener('click', () => {
    setActiveSubview('squad', ctx);
    updaters.updateSquadView?.();
  });
  btnNavAlignment?.addEventListener('click', () => {
    setActiveSubview('alignment', ctx);
    updaters.updateAlignmentView?.();
  });
  btnNavTactics?.addEventListener('click', () => {
    setActiveSubview('tactics', ctx);
    updaters.updateTacticsView?.();
  });
  btnNavCalendar?.addEventListener('click', () => {
    setActiveSubview('calendar', ctx);
    updaters.updateCalendarView?.();
  });
  btnNavResults?.addEventListener('click', () => {
    setActiveSubview('results', ctx);
    updaters.updateResultsView?.();
  });
  btnNavNextMatch?.addEventListener('click', () => {
    setActiveSubview('nextmatch', ctx);
    updaters.updateNextMatchView?.();
  });
  btnNavStandings?.addEventListener('click', () => {
    setActiveSubview('standings', ctx);
    updaters.updateStandingsView?.();
  });
  btnNavStats?.addEventListener('click', () => {
    setActiveSubview('stats', ctx);
    updaters.updateStatsView?.();
  });
  btnNavMedical?.addEventListener('click', () => {
    setActiveSubview('medical', ctx);
    updaters.updateMedicalView?.();
  });
}