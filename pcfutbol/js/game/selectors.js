// js/game/selectors.js
// Selectores puros sobre GameState (sin DOM).
// Objetivo: evitar duplicidades (getUserClub, getPlayerById, etc.) y centralizar la lógica.
//
// NOTA: Estas funciones aceptan el objeto de estado (GameState) como parámetro para
// que sean fáciles de testear y reutilizar.

export function getUserClubId(state) {
  // Fuente principal
  const id = state?.user?.clubId ?? state?.userClubId ?? null;
  return id == null ? null : id;
}

export function getUserClub(state) {
  const clubs = Array.isArray(state?.clubs) ? state.clubs : [];
  if (!clubs.length) return null;

  const id = getUserClubId(state);
  if (!id) return clubs[0] || null;

  const sid = String(id);
  return clubs.find((c) => c && String(c.id) === sid) || clubs[0] || null;
}

export function getClubById(state, clubId) {
  const clubs = Array.isArray(state?.clubs) ? state.clubs : [];
  if (!clubs.length) return null;
  if (clubId == null) return null;
  const sid = String(clubId);
  return clubs.find((c) => c && String(c.id) === sid) || null;
}

export function getPlayerById(state, playerId) {
  const players = Array.isArray(state?.players) ? state.players : [];
  if (!players.length) return null;
  if (playerId == null) return null;
  const sid = String(playerId);
  return players.find((p) => p && String(p.id) === sid) || null;
}