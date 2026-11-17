/* Datos de la previa procedentes exclusivamente del estado de la partida.
   No genera resultados, clasificaciones ni probabilidades ficticias. */

const numberOrNull = value => value === null || value === undefined || value === ''
  ? null
  : (Number.isFinite(Number(value)) ? Number(value) : null);

export function getPreviewRatings(xi = [], bench = []) {
  const mean = players => {
    const ratings = (players || []).map(p => numberOrNull(p?.overall)).filter(n => n != null);
    return ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
  };
  const best = (xi || []).map(p => numberOrNull(p?.overall)).filter(n => n != null);
  return {
    xi: mean(xi),
    best: best.length ? Math.max(...best) : null,
    bench: mean(bench),
  };
}

export function getPreviewKeyPlayer(xi = []) {
  const outfield = (xi || []).filter(p => p && !['GK', 'POR'].includes(String(p.position || '').toUpperCase()));
  const pool = outfield.length ? outfield : (xi || []).filter(Boolean);
  return pool.slice().sort((a, b) => Number(b?.overall ?? 0) - Number(a?.overall ?? 0))[0] || null;
}

export function computePreviewInsights({ fixtures = [], clubs = [], season = 1, beforeMatchday = Infinity, homeId, awayId } = {}) {
  const clubIds = new Set((clubs || []).filter(c => c?.id != null).map(c => String(c.id)));
  const rows = new Map([...clubIds].map(id => [id, { id, played: 0, points: 0, gf: 0, ga: 0, form: [] }]));

  const played = (fixtures || []).filter(fx => {
    if (!fx?.played || fx.homeClubId == null || fx.awayClubId == null) return false;
    if (fx.season != null && Number(fx.season) !== Number(season)) return false;
    if (Number(fx.matchday || 0) >= Number(beforeMatchday)) return false;
    return numberOrNull(fx.homeGoals) !== null && numberOrNull(fx.awayGoals) !== null;
  }).sort((a, b) => Number(a.matchday || 0) - Number(b.matchday || 0));

  for (const fx of played) {
    const hid = String(fx.homeClubId), aid = String(fx.awayClubId);
    const h = rows.get(hid), a = rows.get(aid);
    if (!h || !a) continue;
    const hg = Number(fx.homeGoals), ag = Number(fx.awayGoals);
    h.played++; a.played++;
    h.gf += hg; h.ga += ag;
    a.gf += ag; a.ga += hg;
    const hr = hg > ag ? 'V' : hg < ag ? 'D' : 'E';
    const ar = hg < ag ? 'V' : hg > ag ? 'D' : 'E';
    const title = `J${fx.matchday ?? '—'} · ${hg}-${ag}`;
    h.form.push({ result: hr, title });
    a.form.push({ result: ar, title });
    h.points += hr === 'V' ? 3 : hr === 'E' ? 1 : 0;
    a.points += ar === 'V' ? 3 : ar === 'E' ? 1 : 0;
  }

  const hasPlayed = [...rows.values()].some(r => r.played > 0);
  const sorted = [...rows.values()].sort((a, b) =>
    (b.points - a.points) || ((b.gf - b.ga) - (a.gf - a.ga)) || (b.gf - a.gf) || a.id.localeCompare(b.id));
  const position = new Map(sorted.map((r, idx) => [r.id, idx + 1]));
  const details = id => {
    const row = rows.get(String(id));
    if (!row) return null;
    return { ...row, rank: hasPlayed ? position.get(row.id) : null, form: row.form.slice(-5) };
  };

  const h2h = played.filter(fx =>
    (String(fx.homeClubId) === String(homeId) && String(fx.awayClubId) === String(awayId)) ||
    (String(fx.homeClubId) === String(awayId) && String(fx.awayClubId) === String(homeId)));
  const homeWins = h2h.filter(fx =>
    (String(fx.homeClubId) === String(homeId) && Number(fx.homeGoals) > Number(fx.awayGoals)) ||
    (String(fx.awayClubId) === String(homeId) && Number(fx.awayGoals) > Number(fx.homeGoals))).length;
  const draws = h2h.filter(fx => Number(fx.homeGoals) === Number(fx.awayGoals)).length;

  return {
    home: details(homeId),
    away: details(awayId),
    headToHead: {
      played: h2h.length,
      homeWins,
      draws,
      awayWins: h2h.length - homeWins - draws,
    },
  };
}
