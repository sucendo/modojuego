import test from 'node:test';
import assert from 'node:assert/strict';

import { GameState, newGame, applyLoadedState } from '../js/state.js';
import { getReleaseClause, getSuggestedReleaseClause, evaluateReleaseClause } from '../js/game/contracts.js';
import { evaluatePlayerOffer, evaluateClubOffer, negotiateWithClub, makeTransferOffer } from '../js/game/transferMarket.js';
import { initNegotiationUI, prepareNegotiationUI, evaluateRenewalOffer, attemptRenewal } from '../js/ui/negotiation.js';

function setup() {
  newGame({ leagueId: 'league_es_primera', clubId: 'realmadrid' });
  const club = GameState.clubs.find(c => c.id === 'realmadrid');
  const player = club.players.find(p => p.name === 'Andriy Lunin');
  assert.ok(player);
  return { club, player };
}
function mockClassList() {
  return { add() {}, remove() {} };
}
function setupForm(player) {
  const refs = {
    yearsInput: { value: '3' },
    wageInput: { value: String(Math.round(player.wage * 1.2)) },
    clauseInput: { value: String(getReleaseClause(player)) },
    resultEl: { textContent: '', classList: mockClassList() },
    hintEl: { textContent: '' },
    sectionEl: {},
  };
  initNegotiationUI(refs);
  prepareNegotiationUI(player);
  return refs;
}

test('una renovación negocia salario, duración, cláusula y presupuesto sin desajustes', () => {
  const { club, player } = setup();
  const refs = setupForm(player);
  const oldSalary = player.wage;
  const oldBudget = club.wageBudget;
  refs.yearsInput.value = '3';
  refs.wageInput.value = String(Math.round(oldSalary * 1.3));
  refs.clauseInput.value = String(getSuggestedReleaseClause(player, 3));
  const result = attemptRenewal(player, 0);
  assert.equal(result.accepted, true, result.reason);
  assert.equal(player.wage, Number(refs.wageInput.value));
  assert.equal(player.contractYears, 3);
  assert.equal(player.releaseClause, Number(refs.clauseInput.value));
  assert.equal(club.wageBudget, oldBudget - (player.wage - oldSalary));
  assert.match(refs.resultEl.textContent, /cláusula/);
  const saved = JSON.parse(JSON.stringify(GameState));
  applyLoadedState(saved);
  const loaded = GameState.clubs.find(c => c.id === 'realmadrid').players.find(p => p.id === player.id);
  assert.equal(loaded.releaseClause, player.releaseClause);
  assert.equal(loaded.wage, player.wage);
});

test('el club veta una cláusula demasiado baja; el jugador condiciona una excesiva', () => {
  const { club, player } = setup();
  const originalClause = getReleaseClause(player);
  const standardWage = Math.ceil(player.wage * 1.25 / 10000) * 10000;
  const low = evaluateRenewalOffer(player, { years: 3, wage: standardWage, releaseClause: 10000 }, club, 0);
  assert.equal(low.accepted, false);
  assert.match(low.reason, /club exige/);
  const fair = evaluateRenewalOffer(player, {
    years: 3, wage: standardWage, releaseClause: originalClause,
  }, club, 0);
  assert.equal(fair.accepted, true, fair.reason);
  const high = evaluateRenewalOffer(player, {
    years: 3, wage: standardWage, releaseClause: getSuggestedReleaseClause(player, 3) * 1.65,
  }, club, 0);
  assert.equal(high.accepted, false);
  assert.match(high.reason, /jugador/);
  const impossible = evaluateReleaseClause({
    player, years: 3, wage: standardWage, releaseClause: getSuggestedReleaseClause(player, 3) * 10,
  });
  assert.equal(impossible.ok, false);
});

test('si el club no puede pagar la subida no se modifica contrato ni dinero', () => {
  const { club, player } = setup();
  const original = { wage: player.wage, years: player.contractYears, clause: player.releaseClause };
  club.wageBudget = 0;
  const offer = {
    years: 3, wage: player.wage + 1000000, releaseClause: getSuggestedReleaseClause(player, 3),
  };
  const result = evaluateRenewalOffer(player, offer, club, 0);
  assert.equal(result.accepted, false);
  assert.deepEqual({ wage: player.wage, years: player.contractYears, clause: player.releaseClause }, original);
  assert.equal(club.wageBudget, 0);
});

test('un nuevo fichaje puede negociar cláusula y se firma exactamente la acordada', () => {
  const { club: buyer } = setup();
  const seller = GameState.clubs.find(c => c.id === 'alaves');
  const player = seller.players.find(p => p.id === 'alaves_sivera');
  const context = { leagueId: GameState.league.id, clubId: seller.id, playerId: player.id };
  const lowClub = evaluateClubOffer({ ...context, fee: 100000 });
  assert.ok(lowClub.counterOffer > 0);
  assert.equal(negotiateWithClub({ ...context, fee: lowClub.counterOffer }).ok, true);
  const clause = getSuggestedReleaseClause(player, 3);
  const insufficient = makeTransferOffer({
    ...context, fee: lowClub.counterOffer, wage: 2500000, years: 3,
    releaseClause: 10000, role: 'STARTER',
  });
  assert.equal(insufficient.ok, false);
  assert.match(insufficient.message, /club exige/);
  const salary = 2800000;
  const playerDecision = evaluatePlayerOffer({
    player, source: seller, destination: buyer, wage: salary, years: 3,
    role: 'STARTER', releaseClause: clause,
  });
  assert.equal(playerDecision.ok, true, playerDecision.message);
  const signed = makeTransferOffer({
    ...context, fee: lowClub.counterOffer, wage: salary, years: 3, role: 'STARTER', releaseClause: clause,
  });
  assert.equal(signed.ok, true, signed.message);
  assert.equal(player.releaseClause, clause);
  assert.equal(signed.transfer.releaseClause, clause);
});
