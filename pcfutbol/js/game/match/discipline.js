// js/game/match/discipline.js
// Tarjetas + sanciones (sin dependencia de GameState).

// severity: 1 amarilla, 2 roja directa
export function applyCardsForPlayer(player, severity, issuedAtISO = null) {
  if (!player) return;
  player.yellowCards = Number(player.yellowCards || 0);
  player.redCards = Number(player.redCards || 0);

  if (severity >= 2) {
    player.redCards += 1;
    // Se aplica a partir del siguiente partido: no se consume al cerrar esta jornada
    player.suspension = { type: 'Roja directa', matchesRemaining: 1, justIssued: true, issuedAtISO };
    return;
  }

  player.yellowCards += 1;
  if (player.yellowCards >= 5) {
    player.yellowCards = 0;
    player.suspension = { type: 'Acumulación amarillas', matchesRemaining: 1, justIssued: true, issuedAtISO };
  }
}

export function recordCardEvent(events, clubId, playerId, type, minute) {
  if (!Array.isArray(events)) return;
  events.push({ type, clubId, playerId, minute });
}

export function progressSanctionsForClub(club) {
  const players = Array.isArray(club?.players) ? club.players : [];
  players.forEach((p) => {
    if (!p?.suspension) return;
    const s = p.suspension;
    if (typeof s.matchesRemaining !== 'number') return;
    if (s.matchesRemaining <= 0) return;

    // Si se acaba de imponer en ESTE partido/jornada, no se consume al cerrar la jornada.
    if (s.justIssued) {
      s.justIssued = false;
      return;
    }

    s.matchesRemaining = Math.max(0, s.matchesRemaining - 1);
    if (s.matchesRemaining === 0) {
      p.suspension = null;
    }
  });
}