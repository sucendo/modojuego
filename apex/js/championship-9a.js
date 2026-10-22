/* APEX 9A.4: read-only championship view backed by the native save.
 * Never awards points, changes rounds or rebuilds an alternate championship.
 */
(function (global) {
  'use strict';
  const POINTS_KEY = 'apex26canvas-v2';
  function validPoints(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  function safeText(value, fallback) {
    const text = String(value == null ? '' : value).trim();
    return text.slice(0, 140) || fallback;
  }
  function fromNative(source, key) {
    try {
      return typeof source?.[key] === 'function' ? source[key]() : null;
    } catch (_) {
      return null;
    }
  }
  function normalizeDrivers(rows) {
    return rows.map(row => ({
      id: safeText(row.uid ?? row.id, '?'),
      name: safeText(row.name, row.uid === 'PLAYER' ? 'TÚ' : safeText(row.uid, 'Piloto')),
      team: safeText(row.team, ''),
      points: validPoints(row.p ?? row.points)
    })).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'es'));
  }
  function normalizeTeams(rows) {
    return rows.map(row => ({
      id: safeText(row.team ?? row.id, '?'),
      name: safeText(row.name, safeText(row.team, 'Escudería')),
      points: validPoints(row.points ?? row.p)
    })).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'es'));
  }
  function snapshot(save, nativeAPI = global) {
    const raw = save && typeof save === 'object' ? save : {};
    const totals = raw.points && typeof raw.points === 'object' && !Array.isArray(raw.points)
      ? raw.points : {};
    const history = Array.isArray(raw.seasonHistory9A) ? raw.seasonHistory9A : [];
    const names = new Map();
    for (const event of history) {
      for (const driver of Array.isArray(event?.classification) ? event.classification : []) {
        if (driver && typeof driver.driverId === 'string') {
          names.set(driver.driverId, safeText(driver.name, driver.driverId === 'PLAYER' ? 'TÚ' : driver.driverId));
        }
      }
    }
    const engineDrivers = fromNative(nativeAPI, 'seasonDriverStandings');
    const drivers = Array.isArray(engineDrivers) && engineDrivers.length
      ? normalizeDrivers(engineDrivers)
      : normalizeDrivers(Object.entries(totals).map(([id, points]) => ({
          uid: id, name: names.get(id) || (id === 'PLAYER' ? 'TÚ' : id), points
        })));
    const engineTeams = fromNative(nativeAPI, 'seasonConstructorStandings');
    // Without the native roster, there is no defensible way to reconstruct all
    // historic constructor standings (a driver may have changed teams).
    const teams = Array.isArray(engineTeams) && engineTeams.length
      ? normalizeTeams(engineTeams) : [];
    const recent = history.filter(e => e && typeof e === 'object').slice(-5).reverse().map(event => {
      const classification = Array.isArray(event.classification) ? event.classification : [];
      const winner = classification[0];
      const playerIndex = classification.findIndex(row => row?.driverId === 'PLAYER');
      return {
        round: Number.isInteger(event.round) && event.round >= 0 ? event.round + 1 : null,
        circuit: safeText(event.circuitId, 'Circuito no registrado'),
        winner: winner ? safeText(winner.name, safeText(winner.driverId, '—')) : '—',
        playerPosition: playerIndex < 0 ? null : playerIndex + 1,
        kind: event.source === 'simulated' ? 'Simulado' : 'Disputado'
      };
    });
    const round = Math.min(23, Math.max(0, Math.trunc(Number(raw.round) || 0)));
    return Object.freeze({
      round, totalRounds: 23, drivers, teams, recent,
      teamsAvailable: teams.length > 0,
      historicDetailAvailable: history.length > 0,
      schema: Number(raw.schema) || 0
    });
  }
  function read() {
    try {
      const data = JSON.parse(global.localStorage?.getItem(POINTS_KEY) || 'null');
      return snapshot(data);
    } catch (_) {
      return snapshot(null);
    }
  }
  global.ApexChampionship9A = Object.freeze({snapshot, read});
})(window);
