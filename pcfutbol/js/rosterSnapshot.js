// Reconciliación de una plantilla oficial con los jugadores históricos del juego.
// La identidad se conserva si la coincidencia es inequívoca; salario,
// cláusula y valoración nunca se atribuyen a la fuente oficial.

function normalizedName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findLegacyPlayer(officialName, legacyPlayers, takenIds) {
  const wanted = normalizedName(officialName);
  if (!wanted) return null;
  const available = legacyPlayers.filter((p) => p?.id && !takenIds.has(p.id));
  const exact = available.filter((p) => normalizedName(p.name) === wanted);
  if (exact.length === 1) return exact[0];

  const parts = wanted.split(' ');
  const surname = parts.at(-1);
  if (!surname || surname.length < 4) return null;
  const matches = available.filter((p) => normalizedName(p.name).split(' ').at(-1) === surname);
  if (matches.length === 1) {
    const first = parts[0];
    const originalFirst = normalizedName(matches[0].name).split(' ')[0];
    if (parts.length === 1 || first === originalFirst || (first.length === 1 && first === originalFirst[0])) {
      return matches[0];
    }
  }
  return null;
}

function group(position) {
  const p = String(position || '').toUpperCase();
  if (['GK', 'POR'].includes(p)) return 'POR';
  if (['CB', 'RB', 'LB', 'RWB', 'LWB', 'DFC', 'LD', 'LI'].includes(p)) return 'CB';
  if (['ST', 'CF', 'RW', 'LW', 'DC', 'ED', 'EI'].includes(p)) return 'ST';
  return 'CM';
}

function baseEstimate(club, position, index) {
  const base = Math.max(55, Math.min(83, Number(club.baseOverall) || 65));
  const variation = (index * 7 + base) % 9 - 4;
  const overall = Math.max(52, Math.min(86, base + variation));
  return {
    age: 24,
    ageEstimated: true,
    overall,
    overallEstimated: true,
    wage: Math.round(overall * overall * 115),
    wageEstimated: true,
    value: Math.round(overall * overall * 950),
    valueEstimated: true,
    contractYears: 2,
    contractEstimated: true,
    position,
  };
}

export function buildSquadFromSnapshot(club, historicalPlayers, snapshot) {
  if (!Array.isArray(snapshot?.players) || snapshot.players.length < 16) return null;
  const legacy = Array.isArray(historicalPlayers) ? historicalPlayers : [];
  const takenIds = new Set();
  const roster = [];
  // Reservamos 3 fichas libres para que todos los clubes puedan fichar.
  // Los dorsales de Premier ayudan a priorizar primeros equipos frente a cantera.
  const candidates = snapshot.players.slice();
  if (String(snapshot.source).includes('premierleague.com')) {
    candidates.sort((a, b) => (a.shirtNumber ?? 999) - (b.shirtNumber ?? 999));
  }
  const selected = candidates.slice(0, 27);
  // Asegurar posiciones mínimas: algunos porteros suplentes tienen dorsal alto.
  for (const [role, minimum] of [['POR', 2], ['CB', 4], ['CM', 3], ['ST', 2]]) {
    while (selected.filter(p => group(p.position) === role).length < minimum) {
      const newcomer = candidates.find(p => group(p.position) === role && !selected.includes(p));
      if (!newcomer) break;
      const displaced = [...selected].reverse().find(p =>
        group(p.position) !== role && selected.filter(q => group(q.position) === group(p.position)).length >
        ({ POR: 2, CB: 4, CM: 3, ST: 2 })[group(p.position)]);
      if (!displaced) break;
      selected.splice(selected.indexOf(displaced), 1, newcomer);
    }
  }
  for (const [index, current] of selected.entries()) {
    if (!current.name) continue;
    const old = findLegacyPlayer(current.name, legacy, takenIds);
    let player;
    if (old) {
      takenIds.add(old.id);
      player = { ...old,
        position: group(old.position) === group(current.position) ? old.position : current.position,
        shirtNumber: current.shirtNumber ?? old.shirtNumber,
      };
    } else {
      const slug = normalizedName(current.name).replace(/ /g, '_').slice(0, 42);
      let id = `${club.id}_2627_${slug}`;
      let suffix = 2;
      while (takenIds.has(id)) id = `${club.id}_2627_${slug}_${suffix++}`;
      takenIds.add(id);
      player = {
        id, name: current.name,
        ...baseEstimate(club, current.position, index),
        ...(current.shirtNumber != null ? { shirtNumber: current.shirtNumber } : {}),
      };
    }
    player.rosterSeason = '2026/27';
    player.rosterVerified = true;
    roster.push(player);
  }
  return roster.length >= 16 && roster.some(p => group(p.position) === 'POR') ? roster : null;
}
