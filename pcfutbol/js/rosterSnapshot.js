// Reconciliación de una plantilla oficial con los jugadores históricos del juego.
// La identidad se conserva si la coincidencia es inequívoca; salario,
// cláusula y valoración nunca se atribuyen a la fuente oficial.
import { getVerifiedPlayerBiography } from './rosterBiographies2026.js';

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
  if (['ST', 'SS', 'CF', 'RW', 'LW', 'DC', 'ED', 'EI'].includes(p)) return 'ST';
  return 'CM';
}

// Las fuentes originales suelen publicar solo portero/defensa/medio/delantero.
// Se conservan las quince demarcaciones cuando la fuente las identifica.
// Las fuentes genéricas se distribuyen por rol y se marcan como estimadas.
function modernPosition(position) {
  const p = String(position || '').toUpperCase();
  const alias = {
    POR: 'GK', GK: 'GK', DFC: 'CB', LD: 'RB', LI: 'LB',
    MCD: 'CDM', DM: 'CDM', MC: 'CM',
    MCO: 'CAM', AM: 'CAM', MP: 'CAM', ED: 'RW', EI: 'LW',
    CF: 'ST', DC: 'ST', FW: 'ST', SD: 'SS',
  };
  const normalized = alias[p] || p;
  if (['GK', 'RB', 'LB', 'CB', 'RWB', 'LWB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST', 'SS'].includes(normalized)) return normalized;
  return { POR: 'GK', CB: 'CB', CM: 'CM', ST: 'ST' }[group(position)];
}

const GENERIC_POSITIONS = new Set(['POR', 'CB', 'CM', 'ST', 'DF', 'DEF', 'MF', 'MID', 'FW', 'ATT']);

function rebalanceEstimatedPositions(roster, accuracyByIndex) {
  const allocations = [
    { base: 'CB', roles: ['RB', 'LB'], divisor: 4, hints: [[2, 12, 22], [3, 13, 23]] },
    { base: 'CM', roles: ['CDM', 'CAM'], divisor: 4, hints: [[6, 4, 16], [10, 18, 20]] },
    { base: 'ST', roles: ['RW', 'LW'], divisor: 3, hints: [[7, 17, 27], [11, 21, 19]] },
  ];
  for (const { base, roles, divisor, hints } of allocations) {
    const members = roster.filter(p => group(p.position) === base);
    const target = Math.min(2, Math.floor(members.length / divisor));
    for (const [index, role] of roles.entries()) {
      let need = target - members.filter(p => p.position === role).length;
      if (need <= 0) continue;
      const candidates = roster.map((player, i) => ({ player, i }))
        .filter(({ player, i }) => player.position === base && accuracyByIndex[i]?.generic)
        .sort((a, b) => {
          const score = x =>
            (hints[index].includes(Number(x.player.shirtNumber)) ? -2 : 0) +
            (accuracyByIndex[x.i]?.legacyPrecise ? 1 : 0);
          return score(a) - score(b) || a.i - b.i;
        });
      for (const { player } of candidates) {
        if (need-- <= 0) break;
        player.position = role;
        player.positionEstimated = true;
      }
    }
  }
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
  const accuracyByIndex = [];
  // Reservamos 3 fichas libres para que todos los clubes puedan fichar.
  // Los dorsales publicados ayudan a priorizar primeros equipos frente a cantera.
  const candidates = snapshot.players.slice();
  if (['premierleague.com', 'bundesliga.com', 'eredivisie.nl', 'legaseriea.it'].some(domain => String(snapshot.source).includes(domain))) {
    candidates.sort((a, b) => (a.shirtNumber ?? 999) - (b.shirtNumber ?? 999));
  }
  // VI y BallValue agrupan los jugadores por posición. Respetar cuotas evita
  // que una selección truncada deje 5 porteros y apenas delanteros.
  const groupedByPosition = ['vi.nl/clubs/', 'ballvalue.com/pt/echipe/']
    .some(domain => String(snapshot.source).includes(domain));
  const selected = groupedByPosition
    ? [['POR', 3], ['CB', 9], ['CM', 9], ['ST', 6]]
      .flatMap(([role, count]) => candidates.filter(p => group(p.position) === role).slice(0, count))
    : candidates.slice(0, 27);
  if (groupedByPosition && selected.length < 27) {
    for (const candidate of candidates) {
      if (selected.length >= 27) break;
      if (!selected.includes(candidate)) selected.push(candidate);
    }
  }
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
    const verifiedBio = getVerifiedPlayerBiography(club.id, current.name);
    const old = findLegacyPlayer(current.name, legacy, takenIds);
    let player;
    if (old) {
      takenIds.add(old.id);
      const keepLegacyRole = group(old.position) === group(current.position);
      player = { ...old,
        position: keepLegacyRole ? modernPosition(old.position) : modernPosition(current.position),
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
        ...baseEstimate(club, modernPosition(current.position), index),
        ...(current.shirtNumber != null ? { shirtNumber: current.shirtNumber } : {}),
      };
    }
    const publishedGeneric = GENERIC_POSITIONS.has(String(current.position || '').toUpperCase());
    player.positionEstimated = publishedGeneric;
    player.primaryPositionSource = publishedGeneric ? 'estimated-from-generic-roster' : 'published-role';
    accuracyByIndex.push({ generic: publishedGeneric && !current.preferredPosition, legacyPrecise: !!old &&
      !GENERIC_POSITIONS.has(String(old.position || '').toUpperCase()) });
    const bio = { ...(current.fullName ? { name: current.fullName, fullName: current.fullName } : {}),
      ...(current.birthDate ? { birthDate: current.birthDate } : {}),
      ...(current.nationality ? { nationality: current.nationality } : {}),
      ...(current.shirtNumber != null ? { shirtNumber: current.shirtNumber } : {}),
      ...(verifiedBio || {}) };
    Object.assign(player, bio);
    if (player.birthDate && Number.isFinite(Date.parse(player.birthDate))) {
      const startYear = 2026;
      const dob = new Date(player.birthDate);
      player.age = startYear - dob.getUTCFullYear() -
        (dob.getUTCMonth() > 7 || (dob.getUTCMonth() === 7 && dob.getUTCDate() > 14) ? 1 : 0);
      player.ageEstimated = false;
    } else if (Number.isInteger(current.age) && current.age >= 15 && current.age <= 50) {
      player.age = current.age;
      player.ageEstimated = false;
    } else {
      player.ageEstimated = true;
    }
    player.shirtNumberEstimated = player.shirtNumber == null;
    // Ni una ficha publicada prueba estas cifras económicas del juego.
    player.overallEstimated = true;
    player.wageEstimated = true;
    player.valueEstimated = true;
    player.contractEstimated = true;
    player.rosterSeason = '2026/27';
    player.rosterVerified = snapshot.sourceKind !== 'independent';
    roster.push(player);
  }
  // Dorsal provisional únicamente si la fuente no lo publica. No confundirlo
  // con una ficha oficial; se marca para que sea distinguible en la interfaz.
  const used = new Set(roster.map(p => Number(p.shirtNumber)).filter(Number.isInteger));
  let next = 1;
  for (const player of roster) {
    if (player.shirtNumber != null) continue;
    while (used.has(next)) next++;
    player.shirtNumber = next;
    player.shirtNumberEstimated = true;
    used.add(next++);
  }
  rebalanceEstimatedPositions(roster, accuracyByIndex);
  return roster.length >= 16 && roster.some(p => group(p.position) === 'POR') ? roster : null;
}
