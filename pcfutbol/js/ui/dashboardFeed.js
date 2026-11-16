/**
 * Portada: eventos obtenidos únicamente de la partida local.
 * No modifica GameState ni inventa contratos, ofertas o resultados.
 */

function clubName(state, id) {
  const leagues = [{ clubs: state.clubs || [] }, ...(state.world?.leagues || [])];
  for (const league of leagues) {
    const club = (league.clubs || []).find((item) => String(item.id) === String(id));
    if (club) return club.shortName || club.name || String(id);
  }
  return String(id || 'Equipo');
}

function resultScore(fixture) {
  return `${Number(fixture.homeGoals ?? 0)}-${Number(fixture.awayGoals ?? 0)}`;
}

export function buildClubInbox(state, club) {
  if (!club) return [];
  const players = Array.isArray(club.players) ? club.players : [];
  const injured = players.filter((player) => Number(player?.injury?.matchesRemaining) > 0);
  const suspended = players.filter((player) => Number(player?.suspension?.matchesRemaining) > 0);
  const tasks = [];

  if (injured.length) {
    tasks.push({
      id: 'injured', icon: '✚', severity: 'urgent', tag: 'PARTE MÉDICO',
      title: injured.length === 1 ? `${injured[0].name || 'Un jugador'} está lesionado` : `${injured.length} jugadores lesionados`,
      description: `${injured.map(p => p.name).slice(0, 2).join(', ')}${injured.length > 2 ? '…' : ''}. Revisa la recuperación.`,
      action: 'Consultar médicos', target: 'medical',
    });
  }
  if (suspended.length) {
    tasks.push({
      id: 'suspended', icon: '!', severity: 'urgent', tag: 'SANCIÓN',
      title: `${suspended.length} ${suspended.length === 1 ? 'jugador sancionado' : 'jugadores sancionados'}`,
      description: 'Comprueba las bajas antes de preparar la alineación.',
      action: 'Revisar alineación', target: 'alignment',
    });
  }

  const agreement = state.marketState?.userAgreement;
  if (agreement && typeof agreement === 'object') {
    tasks.push({
      id: 'agreement', icon: '⇄', severity: 'high', tag: 'NEGOCIACIÓN',
      title: 'Negociación de fichaje pendiente',
      description: 'Tienes una negociación en curso en el mercado.',
      action: 'Abrir mercado', target: 'transfermarket',
    });
  }

  const lineup = Array.isArray(club.lineup) ? club.lineup : [];
  if (lineup.length < 11 && players.length >= 11) {
    tasks.push({
      id: 'lineup', icon: '♟', severity: 'high', tag: 'ALINEACIÓN',
      title: 'Completa tu once titular',
      description: `Tienes ${lineup.length} de 11 puestos asignados.`,
      action: 'Preparar once', target: 'alignment',
    });
  }

  const fixtures = Array.isArray(state.fixtures) ? state.fixtures : [];
  const next = fixtures.find(fx => !fx.played && (fx.homeClubId === club.id || fx.awayClubId === club.id));
  if (next) {
    const rival = next.homeClubId === club.id ? next.awayClubId : next.homeClubId;
    tasks.push({
      id: 'nextmatch', icon: '⚽', severity: 'normal', tag: 'PRÓXIMO COMPROMISO',
      title: `Prepara el partido ante ${clubName(state, rival)}`,
      description: `Jornada ${next.matchday || state.currentDate?.matchday || 1}. Revisa táctica y convocatoria.`,
      action: 'Ir al partido', target: 'nextmatch',
    });
  }

  if (!tasks.length) {
    tasks.push({
      id: 'clear', icon: '✓', severity: 'normal', tag: 'TODO AL DÍA',
      title: 'No tienes gestiones urgentes',
      description: 'Puedes revisar la plantilla o avanzar al siguiente partido.',
      action: 'Ver plantilla', target: 'squad',
    });
  }
  return tasks.slice(0, 5);
}

export function buildFootballNews(state, club) {
  const news = [];
  const userId = club?.id;
  const history = Array.isArray(state.transferHistory) ? state.transferHistory : [];
  for (const transfer of history.slice(0, 6)) {
    if (!transfer?.playerName) continue;
    news.push({
      id: transfer.id || `transfer-${news.length}`, icon: '⇄', tag: 'FICHAJES',
      title: `${transfer.playerName} ficha por ${transfer.toClubName || clubName(state, transfer.toClubId)}`,
      description: `Procedente de ${transfer.fromClubName || clubName(state, transfer.fromClubId)}.`,
      clubId: transfer.toClubId, target: 'transfermarket',
      priority: transfer.fromClubId === userId || transfer.toClubId === userId ? 3 : 1,
    });
  }

  const allFixtures = [
    ...(state.fixtures || []).map(fx => ({ fx, isUserLeague: true })),
    ...(state.world?.leagues || []).flatMap(league => (league.fixtures || []).map(fx => ({ fx, isUserLeague: false }))),
  ];
  const played = allFixtures.filter(({ fx }) => fx?.played);
  played.sort((a, b) => Number(b.fx.matchday || 0) - Number(a.fx.matchday || 0));
  for (const { fx, isUserLeague } of played.slice(0, 12)) {
    if (fx.homeGoals == null || fx.awayGoals == null) continue;
    const home = clubName(state, fx.homeClubId);
    const away = clubName(state, fx.awayClubId);
    news.push({
      id: `result-${fx.id || `${home}-${away}-${fx.matchday}`}`, icon: '▤', tag: 'RESULTADOS',
      title: `${home} ${resultScore(fx)} ${away}`,
      description: `Resultado final de la jornada ${fx.matchday || 'actual'}.`,
      clubId: fx.homeClubId, target: isUserLeague ? 'results' : null,
      priority: fx.homeClubId === userId || fx.awayClubId === userId ? 3 : 1,
    });
  }

  const rivalFixture = (state.fixtures || []).find(fx => !fx.played && (fx.homeClubId === userId || fx.awayClubId === userId));
  if (rivalFixture) {
    const rivalId = rivalFixture.homeClubId === userId ? rivalFixture.awayClubId : rivalFixture.homeClubId;
    news.push({
      id: 'rival', icon: '◎', tag: 'PRÓXIMO RIVAL',
      title: `${clubName(state, rivalId)} será tu próximo rival`,
      description: `Se enfrentarán en la jornada ${rivalFixture.matchday || 1}.`,
      clubId: rivalId, target: 'calendar', priority: 2,
    });
  }
  news.sort((a, b) => b.priority - a.priority);
  if (!news.length) {
    news.push({
      id: 'intro', icon: '▤', tag: 'TEMPORADA', title: 'La temporada está lista',
      description: 'Los resultados y fichajes aparecerán aquí al avanzar la partida.',
      target: 'calendar', priority: 0,
    });
  }
  return news.slice(0, 5);
}
