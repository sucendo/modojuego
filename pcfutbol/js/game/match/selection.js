// js/game/match/selection.js
//
// Selección de XI y banquillo para simulación.
// Mantiene la lógica histórica:
//  - XI: respeta club.lineup (si existe) y rellena con disponibles hasta 11.
//  - Banquillo: disponibles que no estén en el XI, por orden de club.players.
//
// Preparado para crecer: se permite inyectar un filtro de disponibilidad y/o
// añadir opciones (roles, rotación, etc.) sin tocar simulateMatchday.js.

import { ensureClubTactics, isPlayerUnavailable } from '../utils/index.js';

// Wrapper defensivo: respeta sanciones (si existen) + unavailable base.
function defaultIsPlayerUnavailableNow(p) {
  if (!p) return true;
  const s = p.suspensioneuspension; // <-- (typo guard) handled below
  // Nota: por si algún save trae "Soeuspension"/etc, lo normal es "suspension".
  const susp = p.suspension || s;
  if (susp && typeof susp.matchesRemaining === 'number' && susp.matchesRemaining > 0) return true;
  return !!isPlayerUnavailable(p);
}

function getIsUnavailableFn(options) {
  const fn = options && typeof options.isPlayerUnavailableNow === 'function'
    ? options.isPlayerUnavailableNow
    : defaultIsPlayerUnavailableNow;
  return fn;
}

export function getStartingXIForFixture(club, options = null) {
  ensureClubTactics(club);
  const isUnavailableNow = getIsUnavailableFn(options);

  const preferred = Array.isArray(club?.lineup) ? club.lineup.slice() : [];
  const players = Array.isArray(club?.players) ? club.players : [];

  const available = players.filter((p) => p && p.id && !isUnavailableNow(p));
  const availableSet = new Set(available.map((p) => p.id));

  const xi = [];
  const seen = new Set();

  // 1) Respetar lineup preferido
  preferred.forEach((id) => {
    if (id && !seen.has(id) && availableSet.has(id) && xi.length < 11) {
      xi.push(id);
      seen.add(id);
    }
  });

  // 2) Rellenar con el orden natural de club.players
  for (let i = 0; i < available.length && xi.length < 11; i++) {
    const id = available[i].id;
    if (id && !seen.has(id)) {
      xi.push(id);
      seen.add(id);
    }
  }

  return xi;
}

export function getBenchForFixture(club, startingXIIds, benchSize = 9, options = null) {
  const isUnavailableNow = getIsUnavailableFn(options);
  const players = Array.isArray(club?.players) ? club.players : [];
  const xiSet = new Set(Array.isArray(startingXIIds) ? startingXIIds : []);

  const available = players.filter(
    (p) => p && p.id && !xiSet.has(p.id) && !isUnavailableNow(p)
  );

  return available
    .slice(0, Math.max(0, benchSize))
    .map((p) => p.id);
}

// Alias histórico si existía
export function getBenchForFixturePro(club, startingXIIds, benchSize = 9, options = null) {
  return getBenchForFixture(club, startingXIIds, benchSize, options);
}