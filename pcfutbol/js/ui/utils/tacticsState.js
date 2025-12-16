// js/ui/utils/tacticsState.js
// Shim de compatibilidad (UI): reexporta utilidades del motor.
export * from '../../game/utils/tacticsState.js';
export {
  ensureClubTactics,
  autoPickMatchdaySquad,
  getFormationSlots,
  assignPlayersToSlots,
} from '../../game/utils/tacticsState.js';