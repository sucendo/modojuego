import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameState, newGame, applyLoadedState } from '../js/state.js';
import '../js/game/bootstrap.js';
import {
  MANAGEMENT_STAGES, getManagementStage, getPendingUserFixtures,
  getTrainingDaysToPlan, setTrainingDay, setTicketPrice, getTicketPrice,
  settleUserTicketSales, ensureManagementState,
  getSeasonTrainingMonths, getTrainingDayPlan, setTrainingMode, clearTrainingDay,
  setPlayerTrainingFocus,
  getStadiumSectors, TICKET_SECTORS, getTicketSectorPrices,
  setTicketSectorPrice, getTicketSalesProjection, adjustTicketSectorPrices, setTicketMode,
} from '../js/game/managementCycle.js';
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

test('taquilla de sectores se cobra una vez y conserva el detalle en el postpartido', () => {
  const first = begin('atletico');
  if (first.homeClubId !== GameState.user.clubId) return;
  assert.equal(setTicketSectorPrice(GameState, first, 'tribuna', 88), true);
  advanceToNextUserMatchDay();
  simulateCurrentMatchday();
  assert.ok(first.meta.ticketRevenue > 0);
  assert.equal(first.meta.ticketRevenueBySector.length, TICKET_SECTORS.length);
  assert.equal(first.meta.ticketRevenueBySector.reduce((sum, s) => sum + s.revenue, 0), first.meta.ticketRevenue);
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
  assert.match(html, /js\/main\.js\?v=1641/);
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
