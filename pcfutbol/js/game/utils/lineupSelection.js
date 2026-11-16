// Selección compartida por el inicio de partida, los traspasos y los partidos.
// Conserva la preferencia del mánager, pero nunca alinea dos guardametas.
export function isGoalkeeper(player) {
  return ['GK', 'POR'].includes(String(player?.position || '').toUpperCase());
}

export function selectValidStartingXI(players, preferredIds = [], isUnavailable = () => false) {
  const available = (Array.isArray(players) ? players : [])
    .filter(player => player?.id && !isUnavailable(player));
  const byId = new Map(available.map(player => [String(player.id), player]));
  const preferred = (Array.isArray(preferredIds) ? preferredIds : [])
    .map(id => byId.get(String(id))).filter(Boolean);
  const keepers = available.filter(isGoalkeeper)
    .sort((a, b) => (Number(b.overall) || 0) - (Number(a.overall) || 0));
  const keeper = preferred.find(isGoalkeeper) || keepers[0] || null;
  const selected = [];
  const seen = new Set();
  const add = player => {
    if (!player || selected.length >= 11 || seen.has(String(player.id))) return;
    if (isGoalkeeper(player) && player !== keeper) return;
    selected.push(player.id);
    seen.add(String(player.id));
  };

  // Prioridad al XI guardado, eliminando el segundo/tercer portero.
  for (const player of preferred) add(player);
  // Si el XI guardado no tenía portero disponible, liberamos su última plaza.
  if (keeper && !seen.has(String(keeper.id))) {
    if (selected.length >= 11) {
      seen.delete(String(selected.pop()));
    }
    selected.unshift(keeper.id);
    seen.add(String(keeper.id));
  }
  // Completar con los mejores futbolistas de campo disponibles.
  const outfield = available.filter(player => !isGoalkeeper(player))
    .sort((a, b) => (Number(b.overall) || 0) - (Number(a.overall) || 0));
  for (const player of outfield) add(player);
  return selected;
}
