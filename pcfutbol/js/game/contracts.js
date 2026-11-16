// Condiciones contractuales compartidas por fichajes y renovaciones.
// Cuando la base de datos no trae cláusula, el juego la calcula de forma estable.

const money = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
const roundFee = value => Math.max(10000, Math.round(value / 10000) * 10000);

export function getSuggestedReleaseClause(player, years = player?.contractYears || 2) {
  const duration = Math.max(1, Math.min(5, money(years)));
  return roundFee(Math.max(100000, money(player?.value)) * (1.8 + duration * 0.18));
}

export function getReleaseClause(player) {
  const explicit = Number(player?.releaseClause);
  if (Number.isSafeInteger(explicit) && explicit > 0) return explicit;
  return getSuggestedReleaseClause(player);
}

// El club rechaza cláusulas demasiado bajas, el futbolista pide compensación
// si le proponen una cláusula excesivamente alta que le dificultaría salir.
export function evaluateReleaseClause({ player, years, wage, releaseClause }) {
  const clause = Number(releaseClause);
  const duration = Number(years);
  if (!Number.isSafeInteger(clause) || clause < 10000) {
    return { ok: false, message: 'Introduce una cláusula válida en euros enteros.' };
  }
  if (!Number.isSafeInteger(duration) || duration < 1 || duration > 5) {
    return { ok: false, message: 'La duración debe estar entre 1 y 5 años.' };
  }
  const base = Math.max(100000, money(player?.value));
  const clubMinimum = roundFee(base * (1.2 + duration * 0.07));
  const playerMaximum = roundFee(base * (1.9 + duration * 0.16));
  if (clause < clubMinimum) {
    return {
      ok: false,
      message: `El club exige una cláusula de al menos ${clubMinimum.toLocaleString('es-ES')} €.`,
      clubMinimum, playerMaximum,
    };
  }
  if (clause > playerMaximum * 2) {
    return {
      ok: false,
      message: 'El jugador considera la cláusula desproporcionada y rechaza firmar.',
      clubMinimum, playerMaximum,
    };
  }
  const salaryCompensation = roundFee(money(player?.wage) *
    (1.10 + Math.max(0, clause / playerMaximum - 1) * 0.45));
  if (clause > playerMaximum && money(wage) < salaryCompensation) {
    return {
      ok: false,
      message: `Para aceptar esa cláusula, el jugador pide al menos ${salaryCompensation.toLocaleString('es-ES')} € anuales.`,
      requiredWage: salaryCompensation, clubMinimum, playerMaximum,
    };
  }
  return { ok: true, clubMinimum, playerMaximum };
}
