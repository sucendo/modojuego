import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameState, newGame, applyLoadedState } from '../js/state.js';
import { allLeagues } from '../js/data.js';
import { STADIUM_CATALOG } from '../js/stadiumCatalog_2026_27.js';
import '../js/game/bootstrap.js';
import {
  MANAGEMENT_STAGES, getManagementStage, getPendingUserFixtures,
  getTrainingDaysToPlan, setTrainingDay, setTicketPrice, getTicketPrice,
  settleUserTicketSales, ensureManagementState,
  lockCurrentTicketPrice,
  getSeasonTrainingMonths, getTrainingDayPlan, setTrainingMode, clearTrainingDay,
  setPlayerTrainingFocus, getPlayerTrainingReport, applyScheduledTraining, TRAINED_ATTRIBUTES,
  getStadiumSectors, TICKET_SECTORS, getTicketSectorPrices,
  setTicketSectorPrice, getTicketLevelPrices, setTicketLevelPrice, getTicketSalesProjection, adjustTicketSectorPrices, setTicketMode,
} from '../js/game/managementCycle.js';
import { renderStadiumPlan, stadiumPlanAvailable, stadiumRingPath, stadiumTierBands } from '../js/ui/stadiumSvgPlan.js';
import { attachFixtureMeta } from '../js/game/match/events.js';
import { wikipediaStadiumTitles, isOpenPhotoLicense } from '../js/ui/stadiumPhoto.js';
import {
  simulateCurrentMatchday, advanceToNextManagementDay, advanceToNextUserMatchDay,
} from '../js/game/simulateMatchday.js';

function begin(clubId = 'realmadrid') {
  newGame({ leagueId: 'league_es_primera', clubId });
  return getPendingUserFixtures(GameState)[0];
}

test('la nueva partida empieza en gestión semanal; jugar requiere pasar por el día del partido', () => {
  const fx = begin();
  assert.ok(fx && fx.kickoffDate);
  assert.equal(getManagementStage(GameState), MANAGEMENT_STAGES.WEEK);
  assert.throws(() => simulateCurrentMatchday(), /avanza desde la gestión semanal/);
  assert.ok(getTrainingDaysToPlan(GameState).length >= 1);
});

test('el entrenamiento programado se aplica una vez, cambia el estado físico y se guarda', () => {
  begin();
  const days = getTrainingDaysToPlan(GameState);
  const player = GameState.clubs.find(c => c.id === GameState.user.clubId).players[0];
  const startFitness = player.fitness;
  assert.equal(setTrainingDay(GameState, days[0], 'intense'), true);
  assert.equal(setTrainingDay(GameState, days[0], 'incorrecto'), false);
  assert.equal(advanceToNextUserMatchDay(), true);
  assert.equal(getManagementStage(GameState), MANAGEMENT_STAGES.MATCHDAY);
  assert.equal(GameState.management.trainingApplied[days[0]], true);
  assert.ok(player.fitness >= startFitness);
  const trained = player.fitness;
  assert.equal(advanceToNextUserMatchDay(), false, 'no aplica entrenamientos dos veces');
  assert.equal(player.fitness, trained);
  const saved = structuredClone(GameState);
  applyLoadedState(saved);
  assert.equal(GameState.management.trainingDays[days[0]], 'intense');
  assert.equal(getManagementStage(GameState), MANAGEMENT_STAGES.MATCHDAY);
});

test('las entradas se cierran el día del encuentro y su taquilla se cobra una sola vez', () => {
  const next = begin();
  // El local puede ser otro club: elegimos un debut en casa o comprobamos futuros partidos.
  const firstHome = getPendingUserFixtures(GameState).find(f => f.homeClubId === GameState.user.clubId);
  assert.ok(firstHome);
  assert.equal(setTicketPrice(GameState, firstHome, 54), true);
  assert.equal(getTicketPrice(GameState, firstHome), 54);
  assert.equal(advanceToNextUserMatchDay(), true);
  if (firstHome.id === next.id) {
    assert.equal(firstHome.meta.ticketPriceLocked, 54);
    assert.equal(setTicketPrice(GameState, firstHome, 99), false);
  }
  const cashBefore = GameState.clubs.find(c => c.id === GameState.user.clubId).cash;
  simulateCurrentMatchday();
  assert.equal(getManagementStage(GameState), MANAGEMENT_STAGES.POST);
  const own = GameState.fixtures.find(f => f.id === next.id);
  assert.equal(own.played, true);
  assert.ok(Array.isArray(own.postPhysical));
  if (next.homeClubId === GameState.user.clubId) {
    assert.ok(own.meta.ticketRevenue > 0);
    const cashAfter = GameState.clubs.find(c => c.id === GameState.user.clubId).cash;
    assert.equal(cashAfter, cashBefore + own.meta.ticketRevenue);
    assert.equal(settleUserTicketSales(GameState, own), 0);
    assert.equal(GameState.clubs.find(c => c.id === GameState.user.clubId).cash, cashAfter);
  }
});

test('postpartido continúa al día siguiente; calendario y post no vuelven a jugarse', () => {
  const first = begin();
  assert.equal(advanceToNextUserMatchDay(), true);
  simulateCurrentMatchday();
  const firstPost = structuredClone(GameState.fixtures.find(f => f.id === first.id));
  assert.equal(advanceToNextManagementDay(), true);
  assert.equal(getManagementStage(GameState), MANAGEMENT_STAGES.WEEK);
  const dayAfter = Date.parse(GameState.currentTimeISO);
  assert.ok(dayAfter > Date.parse(first.kickoffDate));
  assert.ok(dayAfter < Date.parse(getPendingUserFixtures(GameState)[0].kickoffDate));
  assert.equal(advanceToNextManagementDay(), false);
  assert.equal(advanceToNextUserMatchDay(), true);
  assert.equal(GameState.fixtures.find(f => f.id === first.id).homeGoals, firstPost.homeGoals);
  assert.equal(GameState.fixtures.find(f => f.id === first.id).awayGoals, firstPost.awayGoals);
});

test('partidas antiguas sin fase conservan entrada directa a la previa y datos históricos', () => {
  begin();
  const old = structuredClone(GameState);
  delete old.management;
  old.currentTimeISO = new Date(Date.parse(getPendingUserFixtures(GameState)[0].kickoffDate) - 86400000).toISOString();
  applyLoadedState(old);
  assert.equal(ensureManagementState(GameState).stage, MANAGEMENT_STAGES.MATCHDAY);
  assert.ok(Array.isArray(GameState.fixtures));
});

test('la taquilla pertenece a Estadio y los entrenamientos a Entrenamiento, fuera de la portada', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/managementCycle26.css', import.meta.url), 'utf8');
  const managementUI = readFileSync(new URL('../js/ui/managementStage.js', import.meta.url), 'utf8');
  const dashboard = html.split('<section id="view-dashboard"')[1].split('<section id="view-stadium"')[0];
  const stadium = html.split('<section id="view-stadium"')[1].split('<section id="view-training"')[0];
  const training = html.split('<section id="view-training"')[1].split('<nav class="pcf-mobile-nav"')[0];
  const nav = readFileSync(new URL('../js/ui/nav.js', import.meta.url), 'utf8');
  const navigation = readFileSync(new URL('../js/ui/navigation.js', import.meta.url), 'utf8');
  assert.doesNotMatch(dashboard, /pcf-management-panel|pcf-ticket-price|pcf-training-days/);
  assert.match(dashboard, /data-nav-target="stadium"/);
  assert.match(dashboard, /data-nav-target="training"/);
  assert.match(stadium, /id="pcf-ticket-price"/);
  assert.doesNotMatch(stadium, /id="pcf-training-days"/);
  assert.match(training, /id="pcf-training-days"/);
  assert.doesNotMatch(training, /id="pcf-ticket-price"/);
  assert.match(nav, /viewStadium\?\.classList\.remove\('hidden'\)/);
  assert.match(nav, /viewTraining\?\.classList\.remove\('hidden'\)/);
  assert.match(navigation, /setActiveSubview\('stadium', ctx\)/);
  assert.match(navigation, /setActiveSubview\('training', ctx\)/);
  assert.match(html, /id="nextmatch-post-physical"/);
  assert.match(html, /id="nextmatch-continue"/);
  assert.match(managementUI, /▶ DÍA DEL PARTIDO/);
  assert.doesNotMatch(managementUI, /CONTINUAR AL DÍA DEL PARTIDO/);
  assert.match(css, /@media \(max-width: 780px\)/);
});

test('calendario anual: todos los meses de la temporada, partidos y cambios automáticos/manuales', () => {
  begin('atletico');
  const months = getSeasonTrainingMonths(GameState);
  assert.ok(months.length >= 8, 'la temporada debe incluir varios meses');
  assert.ok(months.every(m => /^\d{4}-\d{2}$/.test(m)));
  assert.equal(GameState.management.trainingMode, 'auto');
  const fixture = getPendingUserFixtures(GameState)[0];
  const matchDay = fixture.kickoffDate.slice(0, 10);
  assert.equal(getTrainingDayPlan(GameState, matchDay).type, 'match');
  assert.equal(setTrainingDay(GameState, matchDay, 'intense'), false);
  const day = getTrainingDaysToPlan(GameState).find(d => d !== matchDay);
  assert.ok(day);
  assert.equal(getTrainingDayPlan(GameState, day).source, 'auto');
  assert.equal(setTrainingDay(GameState, day, 'technical'), true);
  assert.deepEqual({ type: getTrainingDayPlan(GameState, day).type, source: getTrainingDayPlan(GameState, day).source },
    { type: 'technical', source: 'manual' });
  assert.equal(setTrainingMode(GameState, 'manual'), true);
  assert.equal(getTrainingDayPlan(GameState, day).type, 'technical');
  assert.equal(clearTrainingDay(GameState, day), true);
  assert.equal(getTrainingDayPlan(GameState, day).type, 'balanced');
  assert.equal(setTrainingMode(GameState, 'auto'), true);
  const before = getTrainingDayPlan(GameState, day);
  const saved = structuredClone(GameState);
  applyLoadedState(saved);
  assert.equal(GameState.management.trainingMode, 'auto');
  assert.equal(getTrainingDayPlan(GameState, day).type, before.type);
});

test('técnica y física afectan a los atributos con progresión moderada y sin reaplicación', () => {
  begin('realmadrid');
  const days = getTrainingDaysToPlan(GameState);
  const p = GameState.clubs.find(c => c.id === GameState.user.clubId).players.find(p => p.attributes?.technical?.passing != null && p.attributes?.physical?.stamina != null);
  const beforePass = p.attributes.technical.passing;
  const beforeStamina = p.attributes.physical.stamina;
  assert.ok(days.length >= 2);
  assert.equal(setTrainingDay(GameState, days[0], 'technical'), true);
  assert.equal(setTrainingDay(GameState, days[1], 'intense'), true);
  advanceToNextUserMatchDay();
  assert.ok(p.attributes.technical.passing > beforePass);
  assert.ok(p.attributes.technical.passing - beforePass < 1);
  assert.ok(p.attributes.physical.stamina > beforeStamina);
  assert.equal(clearTrainingDay(GameState, days[0]), false, 'no se pueden reescribir sesiones ya aplicadas');
  assert.equal(GameState.management.trainingApplied[days[0]], true);
});

test('el informe individual diferencia cambios del entrenamiento, registra sesiones y sobrevive al guardado', () => {
  begin('realmadrid');
  const player = GameState.clubs.find(c => c.id === GameState.user.clubId).players.find(p => p.attributes?.technical?.passing < 95);
  const days = getTrainingDaysToPlan(GameState);
  assert.ok(player && days.length >= 2);
  assert.equal(setPlayerTrainingFocus(GameState, player.id, 'passing'), true);
  assert.equal(setTrainingDay(GameState, days[0], 'technical'), true);
  assert.equal(setTrainingDay(GameState, days[1], 'recovery'), true);
  const original = getPlayerTrainingReport(GameState, player.id);
  assert.equal(original.totals.sessions, 0);
  const oldPassing = original.current.attributes.passing;
  advanceToNextUserMatchDay();
  const report = getPlayerTrainingReport(GameState, player.id);
  assert.ok(report.totals.sessions >= 2);
  assert.ok(report.totals.attributes.passing > 0);
  assert.ok(report.current.attributes.passing > oldPassing);
  const stored = GameState.management.trainingLog.find(entry => entry.players[String(player.id)]);
  assert.ok(stored.players[String(player.id)].changes, 'el diario conserva cambios exactos');
  assert.equal(stored.players[String(player.id)].before, undefined, 'sin duplicar el estado completo del jugador en cada sesión');
  assert.equal(report.focus, 'passing');
  assert.equal(report.recent[0].day, days.at(-1));
  assert.ok(report.recent.some(e => e.type === 'recovery'));
  assert.ok(TRAINED_ATTRIBUTES.every(attr => attr.key in report.totals.attributes));
  const snapshot = structuredClone(GameState);
  applyLoadedState(snapshot);
  const restored = getPlayerTrainingReport(GameState, player.id);
  assert.equal(restored.totals.sessions, report.totals.sessions);
  assert.equal(restored.totals.attributes.passing, report.totals.attributes.passing);
  assert.deepEqual(restored.recent, report.recent);
  assert.equal(applyScheduledTraining(GameState, days[0], `${days.at(-1)}T23:00:00Z`), 0);
  assert.equal(getPlayerTrainingReport(GameState, player.id).totals.sessions, report.totals.sessions);
});

test('el desarrollo global exige semanas de mejora, queda limitado y no se adjudica a un lesionado', () => {
  begin('atletico');
  const player = GameState.clubs.find(c => c.id === GameState.user.clubId).players.find(p => p.attributes?.technical?.passing < 92);
  const injured = GameState.clubs.find(c => c.id === GameState.user.clubId).players.find(p => p.id !== player.id);
  injured.injury = { type: 'molestias', matchesRemaining: 2 };
  const initialOverall = player.overall;
  const injuredOverall = injured.overall;
  assert.equal(setPlayerTrainingFocus(GameState, player.id, 'passing'), true);
  const start = Date.parse(GameState.currentTimeISO);
  const end = new Date(start + 95 * 86400000).toISOString();
  for (let tick = start; tick < Date.parse(end); tick += 86400000) {
    const day = new Date(tick).toISOString().slice(0, 10);
    if (!GameState.fixtures.some(f => f.kickoffDate?.slice(0, 10) === day &&
        (f.homeClubId === GameState.user.clubId || f.awayClubId === GameState.user.clubId))) {
      setTrainingDay(GameState, day, 'technical');
    }
  }
  const count = applyScheduledTraining(GameState, GameState.currentTimeISO, end);
  assert.ok(count > 70);
  const report = getPlayerTrainingReport(GameState, player.id);
  const disabled = getPlayerTrainingReport(GameState, injured.id);
  assert.ok(player.overall > initialOverall, 'una progresión larga mejora la media global');
  assert.ok(player.overall <= initialOverall + 3);
  assert.equal(report.totals.overall, player.overall - initialOverall);
  assert.equal(injured.overall, injuredOverall);
  assert.equal(disabled.totals.attributes.passing, 0);
  assert.equal(applyScheduledTraining(GameState, GameState.currentTimeISO, end), 0);
  assert.equal(getPlayerTrainingReport(GameState, player.id).totals.sessions, count);
});

test('los guardados v16.4 sin registros se migran sin inventar evolución pasada', () => {
  begin('realmadrid');
  const older = structuredClone(GameState);
  delete older.management.trainingLog;
  delete older.management.trainingInitial;
  delete older.management.trainingDevelopment;
  applyLoadedState(older);
  const player = GameState.clubs.find(c => c.id === GameState.user.clubId).players[0];
  const report = getPlayerTrainingReport(GameState, player.id);
  assert.equal(report.totals.sessions, 0);
  assert.equal(report.recent.length, 0);
  assert.equal(report.development.points, 0);
});

test('la ficha de evolución está dentro de Entrenamiento, con resumen, atributos y sesiones', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/managementCycle26.css', import.meta.url), 'utf8');
  const ui = readFileSync(new URL('../js/ui/managementStage.js', import.meta.url), 'utf8');
  const training = html.split('<section id="view-training"')[1].split('<nav class="pcf-mobile-nav"')[0];
  assert.match(training, /id="pcf-training-player-summary"/);
  assert.match(training, /id="pcf-training-player-attributes"/);
  assert.match(training, /id="pcf-training-player-history"/);
  assert.match(training, /Evolución del jugador/);
  assert.match(ui, /getPlayerTrainingReport\(GameState, selectedPlayer\)/);
  assert.match(css, /pcf-training-evolution__history/);
  assert.match(html, /managementCycle26\.css\?v=1673/);
});

test('sectorización: aforo exacto, reajuste por zona/partido y cierre irreversible', () => {
  begin('atletico');
  const homes = getPendingUserFixtures(GameState).filter(f => f.homeClubId === GameState.user.clubId);
  assert.ok(homes.length >= 2);
  const first = homes[0];
  const zones = getStadiumSectors(GameState, first);
  assert.equal(zones.length, TICKET_SECTORS.length);
  assert.equal(zones.reduce((sum, z) => sum + z.capacity, 0), GameState.clubs.find(c => c.id === GameState.user.clubId).stadium.capacity);
  const initial = getTicketSectorPrices(GameState, first);
  assert.ok(initial.vip > initial.norte);
  assert.equal(setTicketSectorPrice(GameState, first, 'vip', 145), true);
  assert.equal(getTicketSectorPrices(GameState, first).vip, 145);
  assert.notEqual(getTicketSectorPrices(GameState, homes[1]).vip, 145, 'el precio aislado de un partido no salta al siguiente');
  const applied = adjustTicketSectorPrices(GameState, homes.slice(0, 2), { sectorId: 'norte', operation: 'euros', amount: 5 });
  assert.equal(applied, 2);
  assert.equal(getTicketSectorPrices(GameState, first).norte, initial.norte + 5);
  assert.equal(setTicketMode(GameState, 'manual'), true);
  assert.equal(GameState.management.ticketMode, 'manual');
  const before = getTicketSalesProjection(GameState, first, 40000);
  assert.ok(before.attendance > 0 && before.attendance <= before.capacity);
  assert.equal(before.revenue, before.breakdown.reduce((sum, s) => sum + s.revenue, 0));
  const cloned = structuredClone(GameState);
  applyLoadedState(cloned);
  assert.equal(getTicketSectorPrices(GameState, first).vip, 145);
  const firstUpcoming = getPendingUserFixtures(GameState)[0];
  advanceToNextUserMatchDay();
  if (firstUpcoming.id === first.id) {
    const lockedFixture = GameState.fixtures.find(f => f.id === first.id);
    assert.equal(setTicketSectorPrice(GameState, lockedFixture, 'vip', 160), false);
    assert.equal(lockedFixture.meta.ticketZonePricesLocked.vip, 145);
  }
});

test('Metropolitano: anillo SVG y tres alturas, con la preferencia sin grada media', () => {
  const fixture = begin('atletico');
  const home = GameState.clubs.find(c => c.id === 'atletico');
  assert.equal(home.stadium.structure.plan, 'metropolitano');
  assert.equal(stadiumPlanAvailable(home.stadium.structure.plan), true);
  assert.match(stadiumRingPath(-143, -37, 0, 1), /^M[\d.,-]+ L/);
  const sectors = getStadiumSectors(GameState, fixture);
  for (const s of sectors) {
    assert.equal(s.levels.reduce((sum, level) => sum + level.capacity, 0), s.id === 'vip' ? 0 : s.capacity);
  }
  assert.equal(sectors.find(s => s.id === 'tribuna').levels.length, 3);
  assert.deepEqual(sectors.find(s => s.id === 'preferencia').levels.map(l => l.name), ['Grada baja', 'Grada alta']);
  assert.equal(sectors.reduce((sum, s) => sum + s.capacity, 0), 70813);
});

test('el plano del Metropolitano representa cada nivel seleccionable y los VIP dentro del anillo', () => {
  begin('atletico');
  const fx = getPendingUserFixtures(GameState).find(f => f.homeClubId === 'atletico');
  const oldDocument = globalThis.document;
  const node = tag => ({ tag, attrs: {}, children: [], setAttribute(key, value) { this.attrs[key] = value; }, append(...items) { this.children.push(...items); } });
  globalThis.document = { createElementNS(_ns, name) { return node(name); } };
  try {
    const map = { children: [], classList: { add() {} }, replaceChildren(...items) { this.children = items; } };
    assert.equal(renderStadiumPlan(map, { plan: 'metropolitano', sectors: getStadiumSectors(GameState, fx),
      prices: getTicketSectorPrices(GameState, fx), selectedSector: 'tribuna', selectedLevel: 1 }), true);
    const svg = map.children[0];
    assert.equal(svg.tag, 'svg');
    const clickable = svg.children.filter(item => item.attrs['data-sector']);
    assert.equal(clickable.length, 12, '11 franjas de grada y los palcos VIP integrados');
    assert.equal(clickable.filter(item => item.attrs['data-sector'] === 'preferencia').length, 2);
    assert.equal(clickable.filter(item => item.attrs['data-sector'] === 'tribuna').length, 3);
    assert.equal(clickable.filter(item => item.attrs['data-sector'] === 'vip').length, 1);
    assert.equal(clickable.filter(item => item.attrs['aria-pressed'] === 'true').length, 1);
  } finally {
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
});

test('todos los clubes reciben plano SVG: niveles documentados o franjas marcadas como estimación', () => {
  assert.equal(stadiumPlanAvailable('bernabeu'), true);
  assert.equal(stadiumPlanAvailable('campnou'), true);
  assert.equal(stadiumPlanAvailable('sanmames'), true);
  assert.equal(stadiumPlanAvailable('generic'), true);
  assert.equal(stadiumPlanAvailable('inventado'), false);
  assert.equal(stadiumTierBands(5).length, 5);
  assert.equal(stadiumTierBands(0).length, 1, 'solo una franja gráfica cuando no hay graderíos documentados');
  assert.notEqual(stadiumRingPath(-143, -37, 0, 1), stadiumRingPath(-143, -37, 0, 1, 3.35),
    'el Bernabéu tendrá silueta distinta al Metropolitano');
  const oldDocument = globalThis.document;
  const node = tag => ({ tag, attrs: {}, children: [], setAttribute(k, v) { this.attrs[k] = v; }, append(...items) { this.children.push(...items); } });
  globalThis.document = { createElementNS(_ns, tag) { return node(tag); } };
  try {
    for (const [club, expectedPlan, expectedCount, expectedLevels] of [
      ['realmadrid', 'bernabeu', 21, 5],
      ['barcelona', 'campnou', 9, 2],
      ['athletic', 'sanmames', 9, 2],
      ['alaves', 'generic', 9, 2],
    ]) {
      begin(club);
      const home = GameState.clubs.find(c => c.id === club);
      const fx = getPendingUserFixtures(GameState).find(f => f.homeClubId === club);
      const map = { children: [], classList: { add() {} }, replaceChildren(...items) { this.children = items; } };
      const plan = home.stadium.structure.plan || 'generic';
      const sectors = getStadiumSectors(GameState, fx);
      assert.equal(plan, expectedPlan, club);
      assert.equal(sectors.find(s => s.id === 'tribuna').levels.length, expectedLevels, club);
      assert.equal(renderStadiumPlan(map, { plan, stadiumName: home.stadium.name,
        sectors, prices: getTicketSectorPrices(GameState, fx), selectedSector: 'tribuna' }), true);
      const clickable = map.children[0].children.filter(item => item.attrs['data-sector']);
      assert.equal(clickable.length, expectedCount, club);
      if (club === 'alaves') assert.equal(home.stadium.structure.status, 'modelled');
    }
  } finally {
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
});

test('Bernabéu: cada zona y cada anfiteatro tiene su propia tarifa y repercute en taquilla', () => {
  begin('realmadrid');
  const fx = getPendingUserFixtures(GameState).find(f => f.homeClubId === 'realmadrid');
  const original = getTicketSalesProjection(GameState, fx, 50000);
  assert.equal(setTicketSectorPrice(GameState, fx, 'norte', 19), true);
  assert.equal(setTicketSectorPrice(GameState, fx, 'sur', 62), true);
  assert.equal(setTicketLevelPrice(GameState, fx, 'tribuna', 4, 115), true);
  const prices = getTicketSectorPrices(GameState, fx);
  assert.equal(prices.norte, 19);
  assert.equal(prices.sur, 62);
  assert.equal(getTicketLevelPrices(GameState, fx, 'tribuna')[4].price, 115);
  assert.notEqual(getTicketLevelPrices(GameState, fx, 'tribuna')[3].price, 115);
  const projection = getTicketSalesProjection(GameState, fx, 50000);
  assert.equal(projection.breakdown.find(s => s.id === 'norte').price, 19);
  assert.equal(projection.breakdown.find(s => s.id === 'sur').price, 62);
  assert.equal(projection.breakdown.find(s => s.id === 'tribuna').levels[4].price, 115);
  assert.notEqual(projection.revenue, original.revenue);
  assert.equal(projection.revenue, projection.breakdown.reduce((sum, s) => sum + s.revenue, 0));
});

test('el precio de cada grada modifica realmente la taquilla, se conserva y se bloquea', () => {
  begin('atletico');
  const fx = getPendingUserFixtures(GameState).find(f => f.homeClubId === 'atletico');
  const base = getTicketSalesProjection(GameState, fx, 50000);
  const oldPrice = getTicketLevelPrices(GameState, fx, 'tribuna')[1].price;
  assert.equal(setTicketLevelPrice(GameState, fx, 'tribuna', 1, 250), true);
  assert.equal(setTicketLevelPrice(GameState, fx, 'preferencia', 2, 75), false, 'no existe grada media en preferencia');
  assert.equal(getTicketLevelPrices(GameState, fx, 'tribuna')[1].price, 250);
  assert.equal(getTicketLevelPrices(GameState, fx, 'tribuna')[0].price, oldPrice);
  const adjusted = getTicketSalesProjection(GameState, fx, 50000);
  const tribuna = adjusted.breakdown.find(s => s.id === 'tribuna');
  assert.equal(tribuna.levels[1].price, 250);
  assert.equal(tribuna.revenue, tribuna.levels.reduce((sum, l) => sum + l.revenue, 0));
  assert.equal(adjusted.revenue, adjusted.breakdown.reduce((sum, s) => sum + s.revenue, 0));
  assert.notEqual(adjusted.revenue, base.revenue, 'el precio del nivel afecta la recaudación');
  assert.equal(adjustTicketSectorPrices(GameState, [fx], { sectorId: 'tribuna', levelIndex: 1, operation: 'euros', amount: -20 }), 1);
  assert.equal(getTicketLevelPrices(GameState, fx, 'tribuna')[1].price, 230);
  const clone = structuredClone(GameState);
  applyLoadedState(clone);
  const savedFx = GameState.fixtures.find(f => f.id === fx.id);
  assert.equal(getTicketLevelPrices(GameState, savedFx, 'tribuna')[1].price, 230);
  lockCurrentTicketPrice(GameState, savedFx);
  assert.equal(savedFx.meta.ticketLevelPricesLocked.tribuna[1], 230);
  assert.equal(setTicketLevelPrice(GameState, savedFx, 'tribuna', 1, 200), false);
  assert.equal(getTicketLevelPrices(GameState, savedFx, 'tribuna')[1].price, 230);
  // Cambiar la zona completa sustituye explícitamente todas sus tarifas de grada.
  const other = getPendingUserFixtures(GameState).find(f => f.id !== savedFx.id && f.homeClubId === 'atletico');
  assert.equal(setTicketLevelPrice(GameState, other, 'tribuna', 1, 180), true);
  assert.equal(setTicketSectorPrice(GameState, other, 'tribuna', 44), true);
  assert.ok(getTicketLevelPrices(GameState, other, 'tribuna').every(l => l.price === 44));
});

test('los 272 clubes disponen de ficha, bandas proporcionales y procedencia comprobable', () => {
  const unique = new Map(allLeagues.flatMap(league => league.clubs.map(club => [club.id, club])));
  assert.ok(unique.size >= 250, 'la ficha de estadio existe para todos los clubes de la temporada');
  assert.equal(Object.keys(STADIUM_CATALOG).length, unique.size, 'todos tienen recinto en el catálogo externo');
  for (const club of unique.values()) {
    assert.ok(STADIUM_CATALOG[club.id]?.capacity > 0, `aforo externo del ${club.id}`);
    assert.ok(STADIUM_CATALOG[club.id]?.source, `fuente del ${club.id}`);
    assert.ok(club.stadium.name && Number.isInteger(club.stadium.capacity) && club.stadium.capacity > 0, club.id);
    assert.ok(['official', 'wikidata', 'reference', 'catalog', 'provisional'].includes(club.stadium.capacityStatus), club.id);
    assert.ok(['documented', 'partial', 'modelled'].includes(club.stadium.structure.status), club.id);
    assert.ok(Array.isArray(club.stadium.structure.levels), club.id);
    assert.ok(club.stadium.structure.levels.length > 0, club.id);
    assert.equal(Object.keys(club.stadium.structure.sectorShares).length, TICKET_SECTORS.length, club.id);
    const sectors = getStadiumSectors({ clubs: [club], user: { clubId: club.id } }, { homeClubId: club.id });
    assert.equal(sectors.reduce((sum, sector) => sum + sector.capacity, 0), club.stadium.capacity, club.id);
    for (const sector of sectors.filter(sector => sector.id !== 'vip')) {
      assert.equal(sector.levels.reduce((sum, tier) => sum + tier.capacity, 0), sector.capacity, club.id);
      assert.ok(sector.levels.every(tier => tier.capacity >= 0), club.id);
    }
    if (club.stadium.structure.photo) assert.equal(isOpenPhotoLicense(club.stadium.structure.photo.license), true, club.id);
  }
});

test('los filiales usan sus recintos y no los grandes estadios del primer equipo', () => {
  const byId = Object.fromEntries(allLeagues.flatMap(l => l.clubs).map(c => [c.id, c]));
  assert.equal(byId.benfica_b.stadium.name, 'Benfica Campus (campo principal)');
  assert.equal(byId.benfica_b.stadium.capacity, 2720);
  assert.match(byId.benfica_b.stadium.structure.photo.filename, /^Benfica Campus/);
  assert.equal(byId.sporting_b.stadium.name, 'Estádio Aurélio Pereira');
  assert.equal(byId.sporting_b.stadium.capacity, 1125);
  const stands = getStadiumSectors({ clubs: [byId.sporting_b] }, { homeClubId: 'sporting_b' });
  assert.equal(stands.find(s => s.id === 'tribuna').capacity, 1125);
  assert.ok(stands.filter(s => s.id !== 'tribuna').every(s => s.capacity === 0));
  assert.equal(byId.rioave.stadium.capacity, 5244);
  assert.equal(byId.rioave.stadium.name, 'Estádio do Rio Ave Futebol Clube');
  assert.equal(byId.rioave.stadium.structure.photo, null, 'no usar la foto del partido en Chaves');
  const rioAve = getStadiumSectors({ clubs: [byId.rioave] }, { homeClubId: 'rioave' });
  assert.equal(rioAve.find(s => s.id === 'preferencia').capacity, 0, 'bancada nascente demolida');
  assert.equal(rioAve.reduce((sum, sector) => sum + sector.capacity, 0), 5244);
  assert.equal(byId.realsociedad_b.stadium.structure.photo, null, 'foto antigua Z1, no nuevo estadio');
  assert.equal(byId.juvestabia.stadium.structure.photo.filename, 'Curva Sud Juve Stabia.jpg');
  assert.equal(byId.lemans.stadium.structure.photo.filename, 'Le mans fc laval.jpg');
});

test('Friburgo muestra la fotografía del Europa-Park Stadion y el aforo del club', () => {
  const freiburg = allLeagues.flatMap(l => l.clubs).find(c => c.id === 'freiburg');
  assert.equal(freiburg.stadium.name, 'Europa-Park Stadion');
  assert.equal(freiburg.stadium.capacity, 34700);
  assert.equal(freiburg.stadium.capacityStatus, 'official');
  assert.match(freiburg.stadium.structure.photo.filename, /^Europa Park Stadion/);
  assert.notEqual(freiburg.stadium.structure.venueId, 'Q311458', 'no identificar el estadio antiguo');
});

test('la asistencia de estadios pequeños nunca supera las localidades', () => {
  const byId = Object.fromEntries(allLeagues.flatMap(l => l.clubs).map(club => [club.id, club]));
  for (const id of ['sporting_b', 'jong_az', 'jong_utrecht', 'benfica_b']) {
    const home = byId[id];
    const fixture = { meta: {} };
    attachFixtureMeta(fixture, home, byId.freiburg);
    assert.ok(fixture.meta.attendance <= home.stadium.capacity, id);
    assert.ok(fixture.meta.attendance >= 0, id);
    const previous = { meta: { attendance: 2000 } };
    attachFixtureMeta(previous, home, byId.freiburg);
    assert.equal(previous.meta.attendance, Math.min(home.stadium.capacity, 2000), id);
  }
});

test('una partida antigua traslada Benfica B al Campus y actualiza sus partidos futuros', () => {
  newGame({ leagueId: 'league_pt_segunda', clubId: 'benfica_b' });
  const saved = structuredClone(GameState);
  const club = saved.clubs.find(c => c.id === 'benfica_b');
  club.stadium.name = 'Estádio da Luz';
  club.stadium.capacity = 68100;
  club.stadium.capacityStatus = 'catalog';
  const future = saved.fixtures.find(f => !f.played && f.homeClubId === 'benfica_b');
  assert.ok(future);
  future.meta.stadiumName = 'Estádio da Luz';
  future.meta.stadiumCapacity = 68100;
  future.meta.capacity = 68100;
  applyLoadedState(saved);
  assert.equal(GameState.clubs.find(c => c.id === 'benfica_b').stadium.capacity, 2720);
  const migrated = GameState.fixtures.find(f => f.id === future.id);
  assert.equal(migrated.meta.stadiumName, 'Benfica Campus (campo principal)');
  assert.equal(migrated.meta.stadiumCapacity, 2720);
  assert.equal(migrated.meta.capacity, 2720);
});

test('estadios documentados: aforo operativo, niveles y cuatro anfiteatros del Bernabéu', () => {
  begin('barcelona');
  const barca = GameState.clubs.find(c => c.id === 'barcelona').stadium;
  assert.equal(barca.capacity, 62652, 'no simular el Camp Nou en obras con el aforo final previsto');
  assert.equal(barca.plannedCapacity, 105000);
  assert.equal(barca.structure.levels.length, 2);
  const barcaHome = getPendingUserFixtures(GameState).find(fx => fx.homeClubId === 'barcelona');
  const barcaSectors = getStadiumSectors(GameState, barcaHome);
  assert.equal(barcaSectors.reduce((sum, s) => sum + s.capacity, 0), 62652);
  for (const sector of barcaSectors.filter(s => s.id !== 'vip')) {
    assert.equal(sector.levels.length, 2);
    assert.equal(sector.levels.reduce((sum, l) => sum + l.capacity, 0), sector.capacity);
    assert.equal(sector.allocationStatus, 'estimated');
  }
  begin('atletico');
  const metropolitano = GameState.clubs.find(c => c.id === 'atletico').stadium;
  assert.equal(metropolitano.capacity, 70813);
  assert.deepEqual(metropolitano.structure.levels, ['Grada baja', 'Grada media', 'Grada alta']);
  const atleticoHome = getPendingUserFixtures(GameState).find(fx => fx.homeClubId === 'atletico');
  const athleticSectors = getStadiumSectors(GameState, atleticoHome);
  assert.equal(athleticSectors.find(s => s.id === 'preferencia').levels.length, 2, 'lateral este sin grada media');
  assert.equal(athleticSectors.find(s => s.id === 'tribuna').levels.length, 3);
  begin('realmadrid');
  const bernabeu = GameState.clubs.find(c => c.id === 'realmadrid').stadium;
  assert.equal(bernabeu.structure.amphitheaters, 4);
  assert.equal(bernabeu.structure.levels.length, 5, 'grada/tribuna y cuatro anfiteatros');
});

test('la Premier 2026/27 usa aforos actuales, cierres documentados y tribunas con capacidad propia', () => {
  const prem = allLeagues.find(league => league.id === 'league_en_premier');
  const byId = Object.fromEntries(prem.clubs.map(club => [club.id, club]));
  assert.equal(byId.everton.stadium.capacity, 52769);
  assert.equal(byId.mancity.stadium.capacity, 61038);
  assert.equal(byId.liverpool.stadium.capacity, 61276);
  assert.equal(byId.astonvilla.stadium.capacity, 36887);
  const villa = getStadiumSectors({ clubs: [byId.astonvilla] }, { homeClubId: 'astonvilla' });
  assert.equal(villa.find(s => s.id === 'norte').capacity, 0, 'tribuna norte cerrada por obras');
  assert.equal(villa.reduce((sum, sector) => sum + sector.capacity, 0), 36887);
  const spurs = getStadiumSectors({ clubs: [byId.tottenham] }, { homeClubId: 'tottenham' });
  assert.equal(spurs.find(s => s.id === 'sur').capacity, 17500);
  assert.equal(spurs.find(s => s.id === 'sur').levels.length, 1);
  assert.equal(spurs.find(s => s.id === 'sur').allocationStatus, 'documented');
  assert.equal(spurs.reduce((sum, sector) => sum + sector.capacity, 0), 62850);
});

test('las seis fichas residuales dejan de usar aforos genéricos, con palcos reales cuando constan', () => {
  const byId = Object.fromEntries(allLeagues.flatMap(l => l.clubs).map(club => [club.id, club]));
  for (const [id, capacity] of Object.entries({
    racing_santander: 22514, eldense: 5800, realsociedad_b: 4000,
    pau: 4120, jong_az: 1000, jong_utrecht: 1000,
  })) {
    assert.equal(byId[id].stadium.capacity, capacity, id);
    assert.notEqual(byId[id].stadium.capacityStatus, 'provisional', id);
  }
  for (const [id, vipSeats] of [['eldense', 165], ['pau', 600]]) {
    const stands = getStadiumSectors({ clubs: [byId[id]] }, { homeClubId: id });
    assert.equal(stands.find(s => s.id === 'vip').capacity, vipSeats);
    assert.equal(stands.reduce((sum, sector) => sum + sector.capacity, 0), byId[id].stadium.capacity);
  }
});

test('los estadios compartidos y las obras italianas conservan el aforo de Lega Serie A', () => {
  const byId = Object.fromEntries(allLeagues.flatMap(l => l.clubs).map(club => [club.id, club]));
  assert.equal(byId.acmilan.stadium.capacity, 75725);
  assert.equal(byId.inter.stadium.capacity, 75725);
  assert.equal(byId.roma.stadium.capacity, 69689);
  assert.equal(byId.lazio.stadium.capacity, 69689);
  assert.equal(byId.fiorentina.stadium.capacity, 24786);
  assert.equal(byId.napoli.stadium.capacity, 54732);
  for (const id of ['inter', 'lazio', 'napoli', 'fiorentina'])
    assert.equal(byId[id].stadium.capacityStatus, 'official');
});

test('la proporción de plazas por altura sigue el peso físico de cada grada', () => {
  begin('atletico');
  const stadium = GameState.clubs.find(c => c.id === 'atletico').stadium;
  stadium.structure.sectorLevelWeights.norte = [1, 2, 4];
  const fx = getPendingUserFixtures(GameState).find(f => f.homeClubId === 'atletico');
  const sectors = getStadiumSectors(GameState, fx);
  const north = sectors.find(sector => sector.id === 'norte');
  assert.equal(north.levels.reduce((sum, level) => sum + level.capacity, 0), north.capacity);
  assert.ok(north.levels[2].capacity > north.levels[1].capacity);
  assert.ok(north.levels[1].capacity > north.levels[0].capacity);
  const bands = stadiumTierBands(3, north.levels.map(level => level.capacity));
  assert.ok(bands[2][1] - bands[2][0] > bands[0][1] - bands[0][0]);
  const forecast = getTicketSalesProjection(GameState, fx, 38000);
  assert.ok(forecast.breakdown.every(sector => sector.occupancy >= 0 && sector.occupancy <= 1));
  assert.ok(forecast.breakdown.flatMap(sector => sector.levels).every(level => level.attendance <= level.capacity));
});

test('la ocupación se dibuja como una fracción de cada banda, y no como un tinte genérico', () => {
  const oldDocument = globalThis.document;
  const node = tag => ({ tag, attrs: {}, children: [], setAttribute(k, v) { this.attrs[k] = v; }, append(...items) { this.children.push(...items); } });
  globalThis.document = { createElementNS(_ns, tag) { return node(tag); } };
  try {
    const map = { children: [], classList: { add() {} }, replaceChildren(...items) { this.children = items; } };
    renderStadiumPlan(map, { sectors: [{ id: 'tribuna', label: 'Tribuna', capacity: 4000,
      levels: [{ name: 'Baja', capacity: 4000, attendance: 2000, occupancy: .5 }] }],
    });
    const tribuna = map.children[0].children.find(item => item.attrs['data-sector'] === 'tribuna');
    const base = tribuna.children.find(item => item.attrs.class?.includes('pcf-stadium-svg__tier-shape'));
    const people = tribuna.children.find(item => item.attrs.class === 'pcf-stadium-svg__attendance');
    assert.ok(base && people, 'la base de la grada y el segmento ocupado son distintos');
    assert.notEqual(base.attrs.d, people.attrs.d, 'el público no ocupa toda la grada');
    assert.match(tribuna.children.find(item => item.tag === 'title').textContent || '', /50 %/);
  } finally {
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
});

test('graderíos incompletos: un lateral cerrado y un fondo abierto no inventan localidades', () => {
  begin('atletico');
  const stadium = GameState.clubs.find(c => c.id === 'atletico').stadium;
  stadium.structure.stands = { sur: { present: false }, norte: { coverage: 0.5 } };
  const fx = getPendingUserFixtures(GameState).find(f => f.homeClubId === 'atletico');
  const sectors = getStadiumSectors(GameState, fx);
  assert.equal(sectors.find(s => s.id === 'sur').capacity, 0);
  assert.equal(sectors.reduce((sum, sector) => sum + sector.capacity, 0), stadium.capacity);
  const oldDocument = globalThis.document;
  const node = tag => ({ tag, attrs: {}, children: [], setAttribute(k, v) { this.attrs[k] = v; }, append(...items) { this.children.push(...items); } });
  globalThis.document = { createElementNS(_ns, tag) { return node(tag); } };
  try {
    const map = { children: [], classList: { add() {} }, replaceChildren(...items) { this.children = items; } };
    renderStadiumPlan(map, { plan: 'metropolitano', structure: stadium.structure, sectors, prices: {} });
    assert.equal(map.children[0].children.filter(item => item.attrs['data-sector'] === 'sur').length, 0);
    assert.ok(map.children[0].children.filter(item => item.attrs['data-sector'] === 'norte').length > 0);
  } finally {
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
});

test('las fotos no se confunden con imágenes genéricas o licencias cerradas', () => {
  assert.deepEqual(wikipediaStadiumTitles('Estadio de Club Inventado'), []);
  assert.deepEqual(wikipediaStadiumTitles('Metropolitano', 'Estadio Metropolitano (Madrid)'), ['Estadio Metropolitano (Madrid)']);
  assert.equal(isOpenPhotoLicense('CC BY-SA 4.0'), true);
  assert.equal(isOpenPhotoLicense('CC BY 4.0'), true);
  assert.equal(isOpenPhotoLicense('All rights reserved'), false);
});

test('aforo oficial desglosado se respeta si es válido y se ignora si no coincide con el total', () => {
  const home = begin('atletico');
  const fixture = getPendingUserFixtures(GameState).find(fx => fx.homeClubId === 'atletico');
  const stadium = GameState.clubs.find(c => c.id === 'atletico').stadium;
  const original = getStadiumSectors(GameState, fixture);
  const exact = Object.fromEntries(original.map(s => [s.id, s.capacity]));
  exact.tribuna += 3;
  exact.preferencia -= 3;
  stadium.structure.sectorCapacities = exact;
  const official = getStadiumSectors(GameState, fixture);
  assert.equal(official.find(s => s.id === 'tribuna').capacity, exact.tribuna);
  assert.ok(official.every(s => s.allocationStatus === 'documented'));
  stadium.structure.sectorCapacities.norte++;
  const fallback = getStadiumSectors(GameState, fixture);
  assert.equal(fallback.reduce((sum, s) => sum + s.capacity, 0), stadium.capacity);
  assert.ok(fallback.every(s => s.allocationStatus === 'estimated'));
  assert.equal(home != null, true);
});

test('la pantalla de Estadio ordena la venta, ficha, niveles y ajuste de precios', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const ui = readFileSync(new URL('../js/ui/managementStage.js', import.meta.url), 'utf8');
  const stadium = html.split('<section id="view-stadium"')[1].split('<section id="view-training"')[0];
  for (const id of ['pcf-ticket-setup', 'pcf-stadium-facts', 'pcf-stadium-levels', 'pcf-stadium-source', 'pcf-ticket-bulk']) {
    assert.match(stadium, new RegExp(id));
  }
  assert.match(ui, /getStadiumStructure\(home\)/);
  assert.match(ui, /tier\.capacity/);
  assert.match(stadium, /Zonas del estadio/);
});

test('taquilla de sectores se cobra una vez y conserva el detalle en el postpartido', () => {
  const first = begin('atletico');
  if (first.homeClubId !== GameState.user.clubId) return;
  assert.equal(setTicketSectorPrice(GameState, first, 'tribuna', 88), true);
  advanceToNextUserMatchDay();
  simulateCurrentMatchday();
  assert.ok(first.meta.ticketRevenue > 0);
  assert.equal(first.meta.ticketRevenueBySector.length, TICKET_SECTORS.length);
  assert.equal(first.meta.ticketRevenueBySector.reduce((sum, s) => sum + s.revenue, 0), first.meta.ticketRevenue);
  assert.equal(first.meta.ticketRevenueByLevel.reduce((sum, tier) => sum + tier.revenue, 0), first.meta.ticketRevenue,
    'el cobro final cuadra exactamente con el detalle por alturas');
  assert.equal(settleUserTicketSales(GameState, first), 0);
});

test('compatibilidad de antiguas tarifas planas y protección de precios por partido', () => {
  begin('realmadrid');
  const home = getPendingUserFixtures(GameState).find(f => f.homeClubId === GameState.user.clubId);
  assert.equal(setTicketPrice(GameState, home, 51), true);
  const key = String(home.id);
  delete GameState.management.ticketZonePrices[key];
  assert.ok(Object.values(getTicketSectorPrices(GameState, home)).every(price => price === 51));
  assert.equal(adjustTicketSectorPrices(GameState, [home], { sectorId: 'all', operation: 'percent', amount: -10 }), TICKET_SECTORS.length);
  assert.ok(Object.values(getTicketSectorPrices(GameState, home)).every(price => price === 46));
  assert.equal(setTicketSectorPrice(GameState, home, 'desconocido', 80), false);
  assert.equal(setTicketSectorPrice(GameState, home, 'vip', 999), false);
});

test('v16.4 presenta calendario y plano en sus menús, sin añadir gestión al dashboard', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const ui = readFileSync(new URL('../js/ui/managementStage.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/managementCycle26.css', import.meta.url), 'utf8');
  const dashboard = html.split('<section id="view-dashboard"')[1].split('<section id="view-stadium"')[0];
  assert.doesNotMatch(dashboard, /pcf-stadium-map|pcf-training-month|pcf-ticket-sector-list/);
  for (const id of ['pcf-training-prev', 'pcf-training-next', 'pcf-training-month', 'pcf-training-mode', 'pcf-training-day-type',
    'pcf-ticket-fixture', 'pcf-stadium-map', 'pcf-ticket-sector-list', 'pcf-ticket-adjust-apply', 'pcf-ticket-forecast']) {
    assert.match(html, new RegExp(`id="${id}"`));
    assert.match(ui, new RegExp(id));
  }
  assert.match(css, /pcf-training-calendar__day/);
  assert.match(css, /pcf-stadium-pitch/);
  assert.match(html, /js\/main\.js\?v=1673/);
});

test('entrenamiento individual permite objetivos específicos persistentes y medibles', () => {
  begin('realmadrid');
  const players = GameState.clubs.find(c => c.id === GameState.user.clubId).players;
  const player = players.find(p => p.attributes?.technical?.passing != null && !p.injury);
  assert.ok(player);
  const days = getTrainingDaysToPlan(GameState);
  assert.equal(setTrainingDay(GameState, days[0], 'balanced'), true);
  assert.equal(setPlayerTrainingFocus(GameState, player.id, 'passing'), true);
  assert.equal(setPlayerTrainingFocus(GameState, 'jugador_inexistente', 'passing'), false);
  const before = player.attributes.technical.passing;
  advanceToNextUserMatchDay();
  assert.ok(player.attributes.technical.passing > before);
  const save = structuredClone(GameState);
  applyLoadedState(save);
  assert.equal(GameState.management.playerTraining[String(player.id)], 'passing');
  assert.equal(setPlayerTrainingFocus(GameState, player.id, 'general'), true);
  assert.equal(GameState.management.playerTraining[String(player.id)], undefined);
});
