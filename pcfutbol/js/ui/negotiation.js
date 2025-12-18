// js/ui/negotiation.js
// Lógica de negociación de renovación desacoplada de ui.js.
// Se inicializa con refs al DOM desde ui.js.

import { getPlayerGameAge } from './utils/calendar.js';

let refs = {
  yearsInput: null,
  wageInput: null,
  resultEl: null,
  hintEl: null,
  sectionEl: null,
};

export function initNegotiationUI({ yearsInput, wageInput, resultEl, hintEl, sectionEl } = {}) {
  refs.yearsInput = yearsInput || null;
  refs.wageInput = wageInput || null;
  refs.resultEl = resultEl || null;
  refs.hintEl = hintEl || null;
  refs.sectionEl = sectionEl || null;
}

export function scrollToNegotiationSection() {
  if (!refs.sectionEl) return;
  refs.sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function prepareNegotiationUI(player) {
  if (!refs.yearsInput || !refs.wageInput || !refs.resultEl || !refs.hintEl) return;

  const currentYears = player?.contractYears ?? 2;
  const currentWage = player?.wage ?? 200_000;

  const defaultYears = Math.min(5, Math.max(1, currentYears + 1));
  refs.yearsInput.value = String(defaultYears);

  const defaultWage = Math.round((currentWage * 1.15) / 1000) * 1000;
  refs.wageInput.value = String(defaultWage);

  refs.resultEl.textContent = '';
  refs.resultEl.classList.remove('modal-neg-result--accept', 'modal-neg-result--reject');

  refs.hintEl.textContent =
    'El jugador espera una oferta acorde a su nivel y situación. ' +
    'Una mejora demasiado baja puede ser rechazada.';
}

function evaluateOffer(player, years, wage) {
  const currentWage = player?.wage ?? 200_000;
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

  const baseChance = 0.7 + (morale - 0.5);
  const random = Math.random();

  if (random < baseChance) return { accepted: true };

  return {
    accepted: false,
    reason: 'El jugador duda sobre su futuro y decide no aceptar esta propuesta por ahora.',
  };
}

export function attemptRenewal(player) {
  if (!refs.yearsInput || !refs.wageInput || !refs.resultEl) return { accepted: false, reason: 'UI no inicializada.' };

  const years = Number.parseInt(refs.yearsInput.value, 10);
  const wage = Number.parseInt(refs.wageInput.value, 10);

  if (!Number.isFinite(years) || years <= 0) {
    refs.resultEl.textContent = 'Introduce un número de años válido.';
    refs.resultEl.classList.remove('modal-neg-result--accept', 'modal-neg-result--reject');
    return { accepted: false, reason: 'Años inválidos.' };
  }

  if (!Number.isFinite(wage) || wage <= 0) {
    refs.resultEl.textContent = 'Introduce un sueldo válido.';
    refs.resultEl.classList.remove('modal-neg-result--accept', 'modal-neg-result--reject');
    return { accepted: false, reason: 'Sueldo inválido.' };
  }

  const result = evaluateOffer(player, years, wage);

  if (result.accepted) {
    player.contractYears = years;
    player.wage = wage;
    player.morale = Math.min(1, (player.morale ?? 0.7) + 0.12);

    refs.resultEl.textContent = 'El jugador acepta la oferta y firma la renovación.';
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