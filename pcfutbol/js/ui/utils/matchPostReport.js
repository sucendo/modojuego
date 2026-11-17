// Postpartido: crónica y comparativas derivadas de los datos guardados.
// No introduce jugadas, ocasiones, posesión ni cambios que no existan en el fixture.

const number = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
const minuteText = (minute) => number(minute) > 90 ? `90+${number(minute) - 90}'` : `${number(minute)}'`;
const hasStat = (stats, key) => stats?.[key] != null && Number.isFinite(Number(stats[key]));

function getScoreStory(fx, goals, homeGoals, awayGoals) {
  // Solo inferimos remontadas y goles decisivos si la cronología reconstruye
  // exactamente el marcador. En partidas antiguas puede faltar algún evento.
  const homeId = String(fx.homeClubId);
  const awayId = String(fx.awayClubId);
  if (goals.filter((ev) => String(ev.clubId) === homeId).length !== homeGoals ||
      goals.filter((ev) => String(ev.clubId) === awayId).length !== awayGoals) return null;

  const winnerId = homeGoals > awayGoals ? homeId : awayGoals > homeGoals ? awayId : null;
  const score = { [homeId]: 0, [awayId]: 0 };
  let fellBehind = false;
  let decisive = null;
  let equalizer = null;
  for (const goal of goals) {
    const clubId = String(goal.clubId);
    if (clubId !== homeId && clubId !== awayId) return null;
    const otherId = clubId === homeId ? awayId : homeId;
    const wasLevelOrBehind = score[clubId] <= score[otherId];
    score[clubId] += 1;
    if (winnerId && score[winnerId] < score[winnerId === homeId ? awayId : homeId]) fellBehind = true;
    if (winnerId && clubId === winnerId && wasLevelOrBehind && score[clubId] > score[otherId]) decisive = goal;
    if (!winnerId && score[clubId] === score[otherId]) equalizer = goal;
  }
  // El gol que puso por delante al ganador solo es decisivo si nadie empató después.
  if (decisive) {
    const index = goals.indexOf(decisive);
    let ahead = 0;
    for (const goal of goals.slice(0, index + 1)) ahead += String(goal.clubId) === winnerId ? 1 : -1;
    for (const goal of goals.slice(index + 1)) {
      ahead += String(goal.clubId) === winnerId ? 1 : -1;
      if (ahead <= 0) { decisive = null; break; }
    }
  }
  return { fellBehind, decisive, equalizer };
}

export function getPostMatchStatGroups(fx) {
  const home = fx?.teamStats?.home;
  const away = fx?.teamStats?.away;
  if (!home || !away) return [];
  const definitions = [
    ['Ataque', [
      ['Tiros', 'shotsTotal'], ['A puerta', 'shotsOnTarget'],
      ['Bloqueados', 'shotsBlocked'], ['Córners', 'corners'], ['Fueras de juego', 'offsides'],
    ]],
    ['Juego y pases', [
      ['Posesión', 'possessionPct', '%'], ['Pases intentados', 'passesAttempted'],
      ['Pases completados', 'passesCompleted'], ['Precisión de pase', 'passAccuracyPct', '%'],
      ['Centros intentados', 'crossesAttempted'], ['Centros completados', 'crossesCompleted'],
      ['Precisión de centros', 'crossAccuracyPct', '%'],
    ]],
    ['Defensa y disciplina', [
      ['Faltas', 'fouls'], ['Paradas', 'saves'], ['Amarillas', 'yellows'], ['Rojas', 'reds'],
    ]],
    ['Físico', [['Distancia recorrida', 'distanceKm', ' km'], ['Velocidad máxima', 'maxSpeedKmh', ' km/h']]],
  ];
  const aliases = { yellows: ['yellows', 'yellowCards'], reds: ['reds', 'redCards'] };
  const valueOf = (stats, key) => {
    const names = aliases[key] || [key];
    for (const name of names) {
      if (stats[name] != null && Number.isFinite(Number(stats[name]))) return Number(stats[name]);
    }
    return null;
  };
  return definitions.map(([title, entries]) => ({
    title,
    rows: entries.map(([label, key, suffix = '']) => ({
      label, key, suffix, home: valueOf(home, key), away: valueOf(away, key),
    })).filter((row) => row.home !== null || row.away !== null),
  })).filter((group) => group.rows.length);
}

export function buildPostMatchReport(fx, { homeName = 'Local', awayName = 'Visitante', playerNames = new Map() } = {}) {
  if (!fx?.played) return null;
  const hg = number(fx.homeGoals);
  const ag = number(fx.awayGoals);
  const winner = hg > ag ? homeName : ag > hg ? awayName : '';
  const stadium = fx.meta?.stadiumName || 'el estadio';
  const goals = (Array.isArray(fx.events) ? fx.events : [])
    .filter((ev) => ev?.type === 'GOAL' && (String(ev.clubId) === String(fx.homeClubId) || String(ev.clubId) === String(fx.awayClubId)))
    .slice().sort((a, b) => number(a.minute) - number(b.minute));
  const story = getScoreStory(fx, goals, hg, ag);
  const lateWinner = winner && story?.decisive && number(story.decisive.minute) >= 80;
  const lateDraw = !winner && story?.equalizer && number(story.equalizer.minute) >= 80;
  const headline = winner
    ? story?.fellBehind ? `Remontada de ${winner} para ganar ${hg}-${ag}`
      : lateWinner ? `${winner} decide al final (${hg}-${ag})`
        : Math.abs(hg - ag) >= 3 ? `${winner} se impone con claridad (${hg}-${ag})`
          : `${winner} se lleva el encuentro (${hg}-${ag})`
    : hg === 0 ? `Empate sin goles en ${stadium}`
      : lateDraw ? `Empate rescatado al final (${hg}-${ag})`
        : `Reparto de puntos en ${stadium} (${hg}-${ag})`;
  const paragraphs = [winner
    ? `${winner} venció ${hg}-${ag} a ${winner === homeName ? awayName : homeName} en ${stadium}.`
    : `${homeName} y ${awayName} empataron ${hg}-${ag} en ${stadium}.`];

  const getName = (id) => {
    const entry = playerNames?.get?.(id);
    return typeof entry === 'string' ? entry : entry?.player?.name || 'un futbolista';
  };
  if (goals.length) {
    if (story?.fellBehind && winner) paragraphs.push(`${winner} llegó a estar por detrás en el marcador y consiguió remontar.`);
    else if (lateWinner) paragraphs.push(`La ventaja definitiva llegó en el ${minuteText(story.decisive.minute)} con un tanto de ${getName(story.decisive.playerId)}.`);
    else if (lateDraw) paragraphs.push(`${getName(story.equalizer.playerId)} estableció la igualada definitiva en el ${minuteText(story.equalizer.minute)}.`);
    const descriptions = goals.slice(0, 5).map((ev) =>
      `${getName(ev.playerId)} (${minuteText(ev.minute)}) para ${ev.clubId === fx.homeClubId ? homeName : awayName}`);
    paragraphs.push(`En la cronología de goles figuran ${descriptions.join('; ')}${goals.length > 5 ? ` y ${goals.length - 5} tantos más` : ''}.`);
  } else if (hg === 0 && ag === 0) {
    paragraphs.push('Ninguno de los equipos consiguió marcar.');
  } else {
    paragraphs.push('La partida guardada no incluye el detalle individual de los goles.');
  }

  const h = fx.teamStats?.home;
  const a = fx.teamStats?.away;
  if (h && a) {
    const hasPossession = hasStat(h, 'possessionPct') && hasStat(a, 'possessionPct');
    const hasShots = hasStat(h, 'shotsTotal') && hasStat(a, 'shotsTotal');
    const hp = number(h.possessionPct), ap = number(a.possessionPct);
    const ht = number(h.shotsTotal), at = number(a.shotsTotal);
    let statsSentence = '';
    if (hasPossession) {
      statsSentence = Math.abs(hp - ap) >= 10
        ? `${hp > ap ? homeName : awayName} tuvo más posesión (${Math.round(Math.max(hp, ap))}%).`
        : `La posesión estuvo repartida (${Math.round(hp)}%-${Math.round(ap)}%).`;
    }
    if (hasShots) {
      if (Math.abs(ht - at) >= 3 && hasPossession && Math.sign(hp - ap) !== Math.sign(ht - at) && hp !== ap) {
        statsSentence += ` Sin embargo, ${ht > at ? homeName : awayName} remató más (${Math.max(ht, at)} frente a ${Math.min(ht, at)} disparos).`;
      } else {
        statsSentence += ` Los disparos fueron ${ht} de ${homeName} y ${at} de ${awayName}.`;
      }
      if (winner && ((winner === homeName && ht < at) || (winner === awayName && at < ht))) {
        statsSentence += ` El equipo con más tiros no consiguió llevarse la victoria.`;
      }
    }
    if (statsSentence.trim()) paragraphs.push(statsSentence.trim());
  }

  const changes = Array.isArray(fx.tacticalChanges) ? fx.tacticalChanges : [];
  if (changes.length) {
    const examples = changes.slice(0, 2).map((change) => {
      const club = change.clubId === fx.homeClubId ? homeName : awayName;
      const formation = change.fromFormation && change.toFormation && change.fromFormation !== change.toFormation
        ? `pasó del ${change.fromFormation} al ${change.toFormation}` : 'ajustó su planteamiento';
      return `${club} ${formation} en el ${minuteText(change.minute)}`;
    });
    paragraphs.push(`En el aspecto táctico, ${examples.join('; ')}${changes.length > 2 ? ` y se registraron ${changes.length - 2} ajustes adicionales` : ''}.`);
  }

  const featuredGoal = story?.decisive || story?.equalizer || goals.at(-1) || null;
  const moment = featuredGoal ? {
    title: story?.decisive ? 'Gol de la victoria' : story?.equalizer ? 'Gol del empate' : 'Último gol del partido',
    detail: `${getName(featuredGoal.playerId)} · ${minuteText(featuredGoal.minute)} · ${String(featuredGoal.clubId) === String(fx.homeClubId) ? homeName : awayName}`,
  } : { title: 'Encuentro sin goles', detail: 'No se registraron tantos' };
  return { headline, paragraphs, moment, goalCount: goals.length };
}
