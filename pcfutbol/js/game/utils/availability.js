// js/game/utils/availability.js
// Utilidades del motor (sin dependencias de UI)

export function isPlayerInjuredNow(player) {
  return !!(
    player &&
    player.injury &&
    player.injury.matchesRemaining != null &&
    player.injury.matchesRemaining > 0
  );
}

export function isPlayerSuspendedNow(player) {
  return !!(
    player &&
    player.suspension &&
    player.suspension.matchesRemaining != null &&
    player.suspension.matchesRemaining > 0
  );
}

export function isPlayerUnavailable(player) {
  return isPlayerInjuredNow(player) || isPlayerSuspendedNow(player);
}