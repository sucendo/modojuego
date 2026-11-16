// js/ui/negotiation.js
// Lógica de negociación de renovación desacoplada de ui.js.
// Se inicializa con refs al DOM desde ui.js.

import { getPlayerGameAge } from './utils/calendar.js';
import { GameState } from '../state.js';
import { getReleaseClause, evaluateReleaseClause } from '../game/contracts.js';

let refs = {
  yearsInput: null,
  wageInput: null,
  clauseInput: null,
  resultEl: null,
  hintEl: null,
  sectionEl: null,
};

export function initNegotiationUI({ yearsInput, wageInput, clauseInput, resultEl, hintEl, sectionEl } = {}) {
  refs.yearsInput = yearsInput || null;
  refs.wageInput = wageInput || null;
  refs.clauseInput = clauseInput || null;
  refs.resultEl = resultEl || null;
  refs.hintEl = hintEl || null;
  refs.sectionEl = sectionEl || null;
}

export function scrollToNegotiationSection() {
  if (!refs.sectionEl) return;
  refs.sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function prepareNegotiationUI(player) {
  if (!refs.yearsInput || !refs.wageInput || !refs.clauseInput || !refs.resultEl || !refs.hintEl) return;

  const currentYears = player?.contractYears ?? 2;
  const currentWage = player?.wage ?? 200_000;

  const defaultYears = Math.min(5, Math.max(1, currentYears + 1));
  refs.yearsInput.value = String(defaultYears);

  const defaultWage = Math.round((currentWage * 1.15) / 1000) * 1000;
  refs.wageInput.value = String(defaultWage);
  refs.clauseInput.value = String(getReleaseClause(player));

  refs.resultEl.textContent = '';
  refs.resultEl.classList.remove('modal-neg-result--accept', 'modal-neg-result--reject');

  refs.hintEl.textContent =
    `Cláusula actual: ${getReleaseClause(player).toLocaleString('es-ES')} €. ` +
    'Negocia años, salario y una cláusula equilibrada. Una cláusula muy alta puede exigir un sueldo mayor.';
}

export function evaluateRenewalOffer(player, { years, wage, releaseClause }, club, randomValue = Math.random()) {
  if (!Number.isSafeInteger(years) || years < 1 || years > 5) {
    return { accepted: false, reason: 'El contrato debe durar de 1 a 5 años.' };
  }
  if (!Number.isSafeInteger(wage) || wage <= 0) {
    return { accepted: false, reason: 'Introduce un sueldo anual válido en euros enteros.' };
  }
  const currentWage = player?.wage ?? 200_000;
  const salaryDifference = wage - currentWage;
  if (!club || Number(club.wageBudget || 0) < salaryDifference) {
    return { accepted: false, reason: 'El club no tiene margen salarial suficiente para ofrecer esa renovación.' };
  }
  const overall = player?.overall ?? 60;
  const age = getPlayerGameAge(player, 26);
  const morale = player?.morale ?? 0.7;

  const levelFactor = 1 + (overall - 60) / 200;
  const minRaiseFactor = Math.max(1.05, levelFactor);
  const requiredWage = currentWage * minRaiseFactor;

  let yearsAcceptable = true;
  if (age < 25) yearsAcceptable = years >= 3;
  else if (age > 32) yearsAcceptable = years <= 2;
  else yearsAcceptable = years >= 2 && years <= 4;

  if (!yearsAcceptable) {
    return {
      accepted: false,
      reason: 'La duración del contrato no encaja con los planes del jugador.',
    };
  }

  if (wage < requiredWage) {
    return {
      accepted: false,
      reason: 'El jugador considera que la mejora salarial es insuficiente para renovar.',
    };
  }

  const clauseDecision = evaluateReleaseClause({ player, years, wage, releaseClause });
  if (!clauseDecision.ok) {
    return { accepted: false, reason: clauseDecision.message, clauseDecision };
  }

  const baseChance = Math.min(0.95, Math.max(0.05, 0.7 + (morale - 0.5)));

  if (randomValue < baseChance) return { accepted: true, releaseClause, salaryDifference };

  return {
    accepted: false,
    reason: 'El jugador duda sobre su futuro y decide no aceptar esta propuesta por ahora.',
  };
}

export function attemptRenewal(player, randomValue = Math.random()) {
  if (!refs.yearsInput || !refs.wageInput || !refs.clauseInput || !refs.resultEl) {
    return { accepted: false, reason: 'UI no inicializada.' };
  }

  const years = Number(refs.yearsInput.value);
  const wage = Number(refs.wageInput.value);
  const releaseClause = Number(refs.clauseInput.value);
  const club = GameState.clubs?.find(c => String(c.id) === String(GameState.user?.clubId));
  const owned = club?.players?.some(p => p === player);
  if (!owned) {
    refs.resultEl.textContent = 'Solo puedes renovar a jugadores de tu propia plantilla.';
    return { accepted: false, reason: refs.resultEl.textContent };
  }

  if (!Number.isSafeInteger(years) || years < 1 || years > 5) {
    refs.resultEl.textContent = 'Introduce un contrato de 1 a 5 años.';
    refs.resultEl.classList.remove('modal-neg-result--accept', 'modal-neg-result--reject');
    return { accepted: false, reason: 'Años inválidos.' };
  }

  if (!Number.isSafeInteger(wage) || wage <= 0) {
    refs.resultEl.textContent = 'Introduce un sueldo válido.';
    refs.resultEl.classList.remove('modal-neg-result--accept', 'modal-neg-result--reject');
    return { accepted: false, reason: 'Sueldo inválido.' };
  }
  if (!Number.isSafeInteger(releaseClause) || releaseClause < 10000) {
    refs.resultEl.textContent = 'Introduce una cláusula de rescisión válida.';
    refs.resultEl.classList.remove('modal-neg-result--accept', 'modal-neg-result--reject');
    return { accepted: false, reason: 'Cláusula inválida.' };
  }

  const result = evaluateRenewalOffer(player, { years, wage, releaseClause }, club, randomValue);

  if (result.accepted) {
    club.wageBudget = Number(club.wageBudget || 0) - (wage - Number(player.wage || 0));
    player.contractYears = years;
    player.wage = wage;
    player.releaseClause = releaseClause;
    player.morale = Math.min(1, (player.morale ?? 0.7) + 0.12);

    refs.resultEl.textContent = `El jugador renueva con una cláusula de ${releaseClause.toLocaleString('es-ES')} €.`;
    refs.resultEl.classList.remove('modal-neg-result--reject');
    refs.resultEl.classList.add('modal-neg-result--accept');
  } else {
    player.morale = Math.max(0, (player.morale ?? 0.7) - 0.08);

    refs.resultEl.textContent =
      result.reason ||
      'El jugador rechaza la oferta. Quizá necesite una mejora más atractiva.';
    refs.resultEl.classList.remove('modal-neg-result--accept');
    refs.resultEl.classList.add('modal-neg-result--reject');
  }

  return result;
}
