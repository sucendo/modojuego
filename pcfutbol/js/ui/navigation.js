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
 *   Debe incluir: viewDashboard/viewSquad/viewTactics/viewCompetition/viewStats/viewMedical
 *   y btnNavDashboard/btnNavSquad/btnNavTactics/btnNavCompetition/btnNavStats/btnNavMedical
 * @param {object} hooks
 *   Callbacks de refresco: updateDashboard/updateSquadView/updateTacticsView/updateCompetitionView/updateStatsView/updateMedicalView
 */
export function initNavigation(ctx, updaters = {}) {
  const {
    btnNavDashboard,
    btnNavSquad,
    btnNavAlignment,	
    btnNavTactics,
    btnNavCompetition,
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
  btnNavCompetition?.addEventListener('click', () => {
    setActiveSubview('competition', ctx);
    updaters.updateCompetitionView?.();
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