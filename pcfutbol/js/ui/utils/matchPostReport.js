// Postpartido: crónica y comparativas derivadas de los datos guardados.
// No introduce jugadas, ocasiones, posesión ni cambios que no existan en el fixture.

const number = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
const minuteText = (minute) => number(minute) > 90 ? `90+${number(minute) - 90}'` : `${number(minute)}'`;

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
  const headline = winner
    ? `${winner} se lleva el encuentro (${hg}-${ag})`
    : hg === 0 ? `Empate sin goles en ${stadium}` : `Reparto de puntos en ${stadium} (${hg}-${ag})`;
  const paragraphs = [];
  paragraphs.push(winner
    ? `${winner} ganó ${hg}-${ag} a ${winner === homeName ? awayName : homeName} en ${stadium}.`
    : `${homeName} y ${awayName} empataron ${hg}-${ag} en ${stadium}.`);

  const goals = (Array.isArray(fx.events) ? fx.events : [])
    .filter((ev) => ev?.type === 'GOAL')
    .slice().sort((a, b) => number(a.minute) - number(b.minute));
  const getName = (id) => {
    const entry = playerNames?.get?.(id);
    return typeof entry === 'string' ? entry : entry?.player?.name || 'un futbolista';
  };
  if (goals.length) {
    const descriptions = goals.slice(0, 5).map((ev) =>
      `${getName(ev.playerId)} (${minuteText(ev.minute)}) para ${ev.clubId === fx.homeClubId ? homeName : awayName}`);
    paragraphs.push(`Los goles los marcaron ${descriptions.join('; ')}${goals.length > 5 ? `, además de otros ${goals.length - 5} tantos` : ''}.`);
  } else {
    paragraphs.push('Ninguno de los equipos consiguió marcar.');
  }

  const h = fx.teamStats?.home;
  const a = fx.teamStats?.away;
  if (h && a) {
    const hp = number(h.possessionPct);
    const ap = number(a.possessionPct);
    const ht = number(h.shotsTotal);
    const at = number(a.shotsTotal);
    const possession = Math.abs(hp - ap) >= 10
      ? `${hp > ap ? homeName : awayName} tuvo más balón (${Math.round(Math.max(hp, ap))}% de posesión).`
      : `La posesión estuvo repartida (${Math.round(hp)}%-${Math.round(ap)}%).`;
    paragraphs.push(`${possession} Los tiros totales fueron ${ht} a ${at}.`);
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

  const lastGoal = goals.at(-1) || null;
  const moment = lastGoal ? {
    title: 'Último gol del partido',
    detail: `${getName(lastGoal.playerId)} · ${minuteText(lastGoal.minute)} · ${lastGoal.clubId === fx.homeClubId ? homeName : awayName}`,
  } : { title: 'Encuentro sin goles', detail: 'No se registraron tantos' };
  return { headline, paragraphs, moment, goalCount: goals.length };
}
