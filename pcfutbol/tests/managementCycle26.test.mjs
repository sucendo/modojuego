import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameState, newGame, applyLoadedState } from '../js/state.js';
import '../js/game/bootstrap.js';
import {
  MANAGEMENT_STAGES, getManagementStage, getPendingUserFixtures,
  getTrainingDaysToPlan, setTrainingDay, setTicketPrice, getTicketPrice,
  settleUserTicketSales, ensureManagementState,
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

test('la interfaz conecta dos estados de gestión con el partido y conserva el postpartido', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../css/managementCycle26.css', import.meta.url), 'utf8');
  assert.match(html, /id="pcf-management-panel"/);
  assert.match(html, /id="pcf-ticket-price"/);
  assert.match(html, /id="pcf-training-days"/);
  assert.match(html, /id="nextmatch-post-physical"/);
  assert.match(html, /id="nextmatch-continue"/);
  assert.match(css, /@media \(max-width: 780px\)/);
});
