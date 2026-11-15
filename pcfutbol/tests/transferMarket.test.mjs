import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { GameState, newGame, applyLoadedState, advanceToNextSeason } from '../js/state.js';
import {
  AI_MARKET_RULES, searchTransferMarket, evaluateClubOffer, negotiateWithClub,
  makeTransferOffer, getReleaseClause, getPlayerRequirements, advanceAiTransferMarket,
  getMarketClubs,
} from '../js/game/transferMarket.js';

const ownClub = () => GameState.clubs.find(c => c.id === GameState.user.clubId);
const begin = () => newGame({ leagueId: 'league_es_primera', clubId: 'realmadrid' });

test('negociar con club, rechazo del jugador y compra tras aceptar condiciones', () => {
  begin();
  const seller = GameState.clubs.find(c => c.id === 'alaves');
  const buyer = ownClub();
  const player = seller.players.find(p => p.id === 'alaves_sivera');
  const buyBefore = buyer.players.length;
  const sellBefore = seller.players.length;
  const cashBefore = buyer.cash;
  const wageBefore = buyer.wageBudget;
  const sourceWageBefore = seller.wageBudget;
  const originalWage = player.wage;
  const target = { leagueId: GameState.league.id, clubId: seller.id, playerId: player.id };

  assert.equal(makeTransferOffer({ ...target, fee: 1, wage: 1, years: 3 }).ok, false);
  const lowBid = evaluateClubOffer({ ...target, fee: 100000 });
  assert.equal(lowBid.ok, false);
  assert.ok(lowBid.counterOffer > 100000);
  assert.equal(negotiateWithClub({ ...target, fee: 100000 }).ok, false);
  assert.equal(negotiateWithClub({ ...target, fee: lowBid.counterOffer }).ok, true);
  assert.equal(makeTransferOffer({ ...target, fee: lowBid.counterOffer, wage: 100000, years: 3 }).ok, false);

  const req = getPlayerRequirements(player, seller, buyer);
  const agreedWage = req.minimumWage;
  const signed = makeTransferOffer({
    ...target, fee: lowBid.counterOffer, wage: agreedWage, years: 3, role: 'STARTER',
  });
  assert.equal(signed.ok, true, signed.message);
  assert.equal(buyer.players.length, buyBefore + 1);
  assert.equal(seller.players.length, sellBefore - 1);
  assert.equal(buyer.cash, cashBefore - lowBid.counterOffer);
  assert.equal(buyer.wageBudget, wageBefore - agreedWage);
  assert.equal(seller.wageBudget, sourceWageBefore + originalWage);
  assert.ok(buyer.players.includes(player));
  assert.equal(player.wage, agreedWage);
  assert.equal(player.contractYears, 3);
  assert.equal(GameState.transferHistory.length, 1);
  assert.equal(makeTransferOffer({ ...target, fee: lowBid.counterOffer, wage: agreedWage, years: 3 }).ok, false);
  assert.ok(!seller.lineup.includes(player.id));
  assert.ok(!seller.bench.includes(player.id));
  assert.ok(seller.lineup.some(id => seller.players.some(p => p.id === id && p.position === 'GK')));
});

test('pagar cláusula evita veto del club, nunca consentimiento del jugador', () => {
  begin();
  const seller = GameState.clubs.find(c => c.id === 'alaves');
  const buyer = ownClub();
  const player = seller.players.find(p => p.id === 'alaves_sivera');
  const clause = getReleaseClause(player);
  const target = { leagueId: GameState.league.id, clubId: seller.id, playerId: player.id, viaClause: true };
  assert.equal(negotiateWithClub({ ...target, fee: clause - 1 }).ok, false);
  assert.equal(negotiateWithClub({ ...target, fee: clause }).ok, true);
  assert.equal(makeTransferOffer({ ...target, fee: clause, wage: 1, years: 3 }).ok, false);
  const wage = getPlayerRequirements(player, seller, buyer).minimumWage;
  const signed = makeTransferOffer({ ...target, fee: clause, wage, years: 3, role: 'STARTER' });
  assert.equal(signed.ok, true, signed.message);
  assert.equal(signed.transfer.method, 'clause');
});

test('la IA es conservadora e idempotente durante la temporada inicial', () => {
  begin();
  const club = ownClub();
  const beforeUserSquad = club.players.map(p => p.id);
  const firstXi = new Map(getMarketClubs().map(e => [
    `${e.leagueId}:${e.club.id}`,
    new Set(GameState.marketState.baselines[`1:${e.leagueId}:${e.club.id}`].xi),
  ]));
  let movements = 0;
  for (let t = Date.UTC(2025, 7, 1); t < Date.UTC(2026, 6, 31); t += 7 * 86400000) {
    movements += advanceAiTransferMarket(new Date(t).toISOString());
  }
  const history = structuredClone(GameState.transferHistory);
  const count = advanceAiTransferMarket(new Date(Date.UTC(2026, 6, 30)).toISOString());
  assert.equal(count, 0);
  assert.deepEqual(GameState.transferHistory, history);
  assert.ok(movements > 0, 'Debe haber algo de actividad de IA a lo largo del año');
  assert.deepEqual(club.players.map(p => p.id), beforeUserSquad, 'La IA no vende ni compra por el usuario');
  const transferredIds = new Set();
  for (const move of history) {
    assert.equal(move.type, 'ai');
    assert.ok([0, 7].includes(new Date(move.gameDate).getUTCMonth()), 'Solo enero y agosto');
    assert.ok(!transferredIds.has(move.playerId), 'Un jugador no debe pasar por varios clubes en un mismo año');
    transferredIds.add(move.playerId);
  }
  const allIds = new Set();
  for (const e of getMarketClubs()) {
    const baseline = firstXi.get(`${e.leagueId}:${e.club.id}`);
    const now = new Set(e.club.players.map(p => p.id));
    const retained = [...baseline].filter(id => now.has(id)).length;
    assert.ok(retained >= Math.min(AI_MARKET_RULES.protectedFirstEleven, baseline.size),
      `${e.club.name}: solo ${retained} titulares originales`);
    const originalSize = GameState.marketState.baselines[`1:${e.leagueId}:${e.club.id}`].squad.length;
    assert.ok(e.club.players.length >= 16 && e.club.players.length <= Math.max(30, originalSize));
    assert.ok(e.club.cash >= 0 && e.club.wageBudget >= 0);
    assert.ok(e.club.lineup.every(id => now.has(id)));
    assert.ok(e.club.bench.every(id => now.has(id)));
    for (const p of e.club.players) {
      assert.ok(!allIds.has(p.id), `Duplicado: ${p.id}`);
      allIds.add(p.id);
    }
    const signings = history.filter(h => h.toLeagueId === e.leagueId && h.toClubId === e.club.id);
    const summer = signings.filter(h => h.gameDate.slice(5, 7) === '08');
    const winter = signings.filter(h => h.gameDate.slice(5, 7) === '01');
    assert.ok(signings.length <= AI_MARKET_RULES.firstSeasonSignings);
    assert.ok(summer.length <= AI_MARKET_RULES.firstSummerSignings);
    assert.ok(winter.length <= AI_MARKET_RULES.firstWinterSignings);
  }
});

test('las operaciones y las plantillas de otras ligas sobreviven al guardado y a otra temporada', () => {
  begin();
  for (let t = Date.UTC(2025, 7, 1); t <= Date.UTC(2026, 1, 2); t += 7 * 86400000) {
    advanceAiTransferMarket(new Date(t).toISOString());
  }
  assert.ok(GameState.transferHistory.length > 0);
  const worldDeal = GameState.transferHistory.find(h => h.toLeagueId !== GameState.league.id);
  assert.ok(worldDeal, 'Debe existir alguna compra de otra liga');
  const snapshot = JSON.parse(JSON.stringify(GameState));
  applyLoadedState(snapshot);
  assert.deepEqual(GameState.transferHistory, snapshot.transferHistory);
  assert.deepEqual(GameState.marketState, snapshot.marketState);
  const buyer = getMarketClubs().find(e => e.leagueId === worldDeal.toLeagueId && e.club.id === worldDeal.toClubId);
  assert.ok(buyer.club.players.some(p => p.id === worldDeal.playerId));
  advanceToNextSeason();
  const reloadedBuyer = getMarketClubs().find(e => e.leagueId === worldDeal.toLeagueId && e.club.id === worldDeal.toClubId);
  assert.ok(reloadedBuyer.club.players.some(p => p.id === worldDeal.playerId), 'El nuevo calendario no borra fichajes');
  assert.equal(GameState.currentDate.season, 2);
  assert.ok(reloadedBuyer.club.players.length > 0 && reloadedBuyer.leagueId);
  assert.ok(GameState.marketState.baselines[`2:${reloadedBuyer.leagueId}:${reloadedBuyer.club.id}`]);
  assert.equal(advanceAiTransferMarket(GameState.currentTimeISO), 0, 'La IA no repite semanas ya jugadas');
});

test('las partidas antiguas se cargan sin historial ni datos de mercado', () => {
  begin();
  const old = JSON.parse(JSON.stringify(GameState));
  delete old.transferHistory;
  delete old.marketState;
  delete old.currentTimeISO;
  applyLoadedState(old);
  assert.deepEqual(GameState.transferHistory, []);
  assert.ok(GameState.marketState.baselines[`1:${GameState.league.id}:realmadrid`]);
  assert.equal(GameState.currentTimeISO, null);
  assert.ok(searchTransferMarket({ query: 'Sivera' }).some(p => p.name.includes('Sivera')));
});

test('evolución progresiva en tres temporadas sin vaciar plantillas', () => {
  begin();
  for (let season = 1; season <= 3; season++) {
    const startYear = 2024 + season;
    const initialXi = new Map(getMarketClubs().map(e => [
      `${e.leagueId}:${e.club.id}`,
      [...GameState.marketState.baselines[`${season}:${e.leagueId}:${e.club.id}`].xi],
    ]));
    for (let time = Date.UTC(startYear, 7, 1); time <= Date.UTC(startYear + 1, 6, 31); time += 7 * 86400000) {
      GameState.currentTimeISO = new Date(time).toISOString();
      advanceAiTransferMarket(GameState.currentTimeISO);
    }
    const playersSeen = new Set();
    for (const e of getMarketClubs()) {
      const current = new Set(e.club.players.map(p => String(p.id)));
      const baseline = initialXi.get(`${e.leagueId}:${e.club.id}`);
      const stillHere = baseline.filter(id => current.has(String(id))).length;
      assert.ok(stillHere >= (season === 1 ? 9 : 7), `${e.club.name}, temp ${season}: ${stillHere} de 11`);
      const newSignings = GameState.transferHistory.filter(h => h.season === season &&
        h.toLeagueId === e.leagueId && h.toClubId === e.club.id);
      const departures = GameState.transferHistory.filter(h => h.season === season &&
        h.fromLeagueId === e.leagueId && h.fromClubId === e.club.id);
      assert.ok(newSignings.length <= (season === 1 ? 3 : 5));
      assert.ok(departures.length <= (season === 1 ? 2 : 4));
      assert.ok(e.club.players.length >= 16);
      for (const p of e.club.players) {
        assert.ok(!playersSeen.has(String(p.id)), `ID duplicado ${p.id}`);
        playersSeen.add(String(p.id));
      }
    }
    if (season < 3) advanceToNextSeason();
  }
  assert.ok(GameState.transferHistory.some(h => h.season === 3), 'La IA continúa en temporadas sucesivas');
});

test('la pantalla incluye ambas negociaciones y la opción de cláusula', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const view = readFileSync(new URL('../js/ui/transferMarketView.js', import.meta.url), 'utf8');
  for (const id of ['market-negotiate', 'market-contract', 'market-buy', 'market-wage', 'market-years', 'market-role', 'market-clause', 'market-release-clause', 'player-neg-clause']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(view, /negotiateWithClub\(/);
  assert.match(view, /makeTransferOffer\(/);
});
