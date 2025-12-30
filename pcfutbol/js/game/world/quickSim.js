// js/game/world/quickSim.js
//
// Simulación "rápida" de partidos para ligas WORLD (otras ligas),
// con helpers w* encapsulados.
//
// Nota: Para evitar ciclos de imports, el generador de stats avanzadas
// se inyecta desde fuera (simulateMatchday.js).

let _generateAdvancedStatsForFixture = null;

export function configureAdvancedStatsGenerator(fn) {
  _generateAdvancedStatsForFixture = typeof fn === 'function' ? fn : null;
}

export function simulateQuickWorldFixture(fx, ls) {
  if (!fx) return;

  const clubs = ls?.clubs || [];
  const home = clubs.find((c) => c?.id === fx.homeClubId);
  const away = clubs.find((c) => c?.id === fx.awayClubId);
  if (!home || !away) {
    fx.homeGoals = fx.homeGoals ?? 0;
    fx.awayGoals = fx.awayGoals ?? 0;
    fx.events = Array.isArray(fx.events) ? fx.events : [];
    return;
  }

  const homeXI = wPickBestXI(home);
  const awayXI = wPickBestXI(away);
  fx.homeLineupIds = homeXI.map((p) => p.id);
  fx.awayLineupIds = awayXI.map((p) => p.id);

  const homeOv = wAvgOverall(homeXI);
  const awayOv = wAvgOverall(awayXI);
  const diff = wClamp((homeOv - awayOv) / 25, -1, 1); // -1..+1 aprox

  // goles esperados (Poisson) -> estilo rápido
  const baseLambda = 1.25;
  const homeLambda = Math.max(0.15, baseLambda + diff * 0.65);
  const awayLambda = Math.max(0.15, baseLambda - diff * 0.55);

  const hg = wClamp(wPoisson(homeLambda), 0, 6);
  const ag = wClamp(wPoisson(awayLambda), 0, 6);
  fx.homeGoals = hg;
  fx.awayGoals = ag;

  fx.events = Array.isArray(fx.events) ? fx.events : [];
  fx.events.length = 0;

  const pickMinute = wCreateFixtureMinutePicker();

  // HOME goals
  for (let i = 0; i < hg; i++) {
    const scorer = wPickGoalScorer(homeXI);
    if (!scorer) break;
    fx.events.push({ type: 'GOAL', minute: pickMinute(), clubId: home.id, playerId: scorer.id });
  }

  // AWAY goals
  for (let i = 0; i < ag; i++) {
    const scorer = wPickGoalScorer(awayXI);
    if (!scorer) break;
    fx.events.push({ type: 'GOAL', minute: pickMinute(), clubId: away.id, playerId: scorer.id });
  }

  fx.events.sort((a, b) => (a.minute || 0) - (b.minute || 0));

  // ✅ Ahora sí: eventos completos (home+away) => stats avanzadas coherentes
  if (_generateAdvancedStatsForFixture) {
    _generateAdvancedStatsForFixture(fx, home, away);
  }

  // Stats “ligeras” por jugador (apps/min/goals/asist…)
  wApplyWorldPlayerStats(ls, fx);
}

// -------------------------------------------------
// Helpers w*
// -------------------------------------------------

function wPickBestXI(club) {
  const players = Array.isArray(club?.players) ? club.players : [];
  const sorted = players
    .filter(Boolean)
    .slice()
    .sort((a, b) => Number(b?.overall || 0) - Number(a?.overall || 0));
  return sorted.slice(0, 11);
}

function wAvgOverall(xi) {
  const arr = Array.isArray(xi) ? xi : [];
  if (!arr.length) return 50;
  let sum = 0;
  let n = 0;
  arr.forEach((p) => {
    const o = Number(p?.overall || 0);
    if (Number.isFinite(o)) {
      sum += o;
      n += 1;
    }
  });
  return n ? (sum / n) : 50;
}

function wClamp(x, a, b) {
  const n = Number(x);
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, n));
}

function wPoisson(lambda) {
  // Knuth Poisson
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > L && k < 15);
  return k - 1;
}

function wPickGoalScorer(xi) {
  const pool = (Array.isArray(xi) ? xi : []).filter(Boolean);
  if (!pool.length) return null;

  // pesos: delanteros > medios > defensas (simple)
  const weights = pool.map((p) => {
    const pos = String(p?.position || '').toUpperCase();
    if (pos === 'ST' || pos === 'CF' || pos === 'RW' || pos === 'LW') return 4;
    if (pos === 'CAM' || pos === 'RM' || pos === 'LM' || pos === 'CM') return 2.2;
    if (pos === 'CDM') return 1.4;
    if (pos === 'CB' || pos === 'RB' || pos === 'LB' || pos === 'RWB' || pos === 'LWB') return 0.9;
    if (pos === 'GK') return 0.2;
    return 1.0;
  });

  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let r = Math.random() * sum;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function wCreateFixtureMinutePicker() {
  // minutos 1..90 con ligera preferencia por 2ª parte (más “realista”)
  return () => {
    const r = Math.random();
    if (r < 0.55) return 1 + Math.floor(Math.random() * 45);
    return 46 + Math.floor(Math.random() * 45);
  };
}

// -------------------------------------------------
// Stats rápidas para el "mundo" (otras ligas)
// -------------------------------------------------

function wEnsurePlayerSeasonContainers(player, seasonKey) {
  if (!player) return;
  if (!player.stats || typeof player.stats !== 'object') player.stats = {};
  if (!player.stats[seasonKey] || typeof player.stats[seasonKey] !== 'object') {
    player.stats[seasonKey] = {
      apps: 0,
      starts: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      yellows: 0,
      reds: 0,
    };
  }
  if (!player.statsByMatchday || typeof player.statsByMatchday !== 'object') player.statsByMatchday = {};
  if (!Array.isArray(player.statsByMatchday[seasonKey])) player.statsByMatchday[seasonKey] = [];
}

function wApplyWorldPlayerStats(ls, fx) {
  if (!ls || !fx) return;

  const season = Number(ls.currentDate?.season || fx.season || 1);
  const seasonKey = String(season);
  const matchday = Number(fx.matchday || ls.currentDate?.matchday || 1);

  const clubs = ls.clubs || [];
  const home = clubs.find((c) => c?.id === fx.homeClubId);
  const away = clubs.find((c) => c?.id === fx.awayClubId);
  if (!home || !away) return;

  const homePlayers = (home.players || []);
  const awayPlayers = (away.players || []);
  const homeById = new Map(homePlayers.map((p) => [p?.id, p]));
  const awayById = new Map(awayPlayers.map((p) => [p?.id, p]));

  const homeXIIds = Array.isArray(fx.homeLineupIds) ? fx.homeLineupIds : [];
  const awayXIIds = Array.isArray(fx.awayLineupIds) ? fx.awayLineupIds : [];

  // Contadores de goles por jugador (desde eventos)
  const goalCount = new Map();
  (Array.isArray(fx.events) ? fx.events : []).forEach((e) => {
    if (!e || e.type !== 'GOAL') return;
    if (e.playerId == null) return;
    goalCount.set(e.playerId, (goalCount.get(e.playerId) || 0) + 1);
  });

  // HOME XI
  homeXIIds.forEach((pid) => {
    const p = homeById.get(pid);
    if (!p) return;
    wEnsurePlayerSeasonContainers(p, seasonKey);

    const st = p.stats[seasonKey];
    st.apps += 1;
    st.starts += 1;
    st.minutes += 90;

    const g = goalCount.get(pid) || 0;
    st.goals += g;

    p.statsByMatchday[seasonKey].push({
      matchday,
      minutes: 90,
      goals: g,
      assists: 0,
      yellows: 0,
      reds: 0,
      played: true,
    });
  });

  // AWAY XI
  awayXIIds.forEach((pid) => {
    const p = awayById.get(pid);
    if (!p) return;
    wEnsurePlayerSeasonContainers(p, seasonKey);

    const st = p.stats[seasonKey];
    st.apps += 1;
    st.starts += 1;
    st.minutes += 90;

    const g = goalCount.get(pid) || 0;
    st.goals += g;

    p.statsByMatchday[seasonKey].push({
      matchday,
      minutes: 90,
      goals: g,
      assists: 0,
      yellows: 0,
      reds: 0,
      played: true,
    });
  });
}