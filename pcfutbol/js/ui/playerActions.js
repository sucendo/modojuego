// js/ui/playerActions.js
// Lógica "de aplicación" relacionada con acciones del jugador (sin tocar DOM directo).
// Mantiene ui.js fino: ui.js orquesta y pasa callbacks.

import { GameState } from '../state.js';
import { getUserClub as getUserClubSelector } from '../game/selectors.js';
 
export function getUserClub() {
  return getUserClubSelector(GameState);
}

export function getPlayerById(playerId) {
  const club = getUserClub();
  if (!club || !Array.isArray(club.players)) return null;
  const pid = String(playerId);
  return club.players.find((p) => p && String(p.id) === pid) || null;
}

export function toggleTransferListed(player) {
  if (!player) return;
  player.transferListed = !player.transferListed;
  if (player.transferListed) {
    player.morale = Math.max(0, (player.morale ?? 0.7) - 0.05);
  } else {
    player.morale = Math.min(1, (player.morale ?? 0.7) + 0.03);
  }
}

/**
 * Ejecuta una acción de UI sobre un jugador. ui.js debe pasar callbacks para mantener esto desacoplado del DOM.
 */
export function handlePlayerAction(action, player, ctx = {}) {
  const {
    openPlayerModal,
    updateSquadView,
    prepareNegotiationUI,
    scrollToNegotiationSection,
    getCurrentModalPlayer,
  } = ctx || {};

  switch (action) {
    case 'details': {
      if (typeof openPlayerModal === 'function') openPlayerModal(player);
      break;
    }
    case 'renew': {
      if (typeof openPlayerModal === 'function') openPlayerModal(player);
      if (typeof prepareNegotiationUI === 'function') prepareNegotiationUI(player);
      if (typeof scrollToNegotiationSection === 'function') scrollToNegotiationSection();
      break;
    }
    case 'transfer': {
      toggleTransferListed(player);
      if (typeof updateSquadView === 'function') updateSquadView();
      const current = typeof getCurrentModalPlayer === 'function' ? getCurrentModalPlayer() : null;
      if (current && current.id === player?.id && typeof openPlayerModal === 'function') {
        openPlayerModal(player);
      }
      break;
    }
    default:
      // Mantener silencioso en producción; útil en dev.
      console.log('Acción no soportada:', action, player);
  }
}