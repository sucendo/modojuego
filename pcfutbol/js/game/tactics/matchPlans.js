// Decisiones del entrenador de la IA. Solo alteran el plan del PARTIDO:
// ni la plantilla ni la táctica habitual del club se modifican en memoria.
import { FORMATION_EFFECTS } from './identity.js';

function squadOverall(club) {
  const players = club?.players || [];
  const ids = new Set((club?.lineup || []).map(String));
  const xi = players.filter(p => ids.has(String(p.id)));
  const chosen = xi.length ? xi : players.slice(0, 11);
  return chosen.length ? chosen.reduce((sum, p) => sum + (Number(p.overall) || 60), 0) / chosen.length : 60;
}

function basePlan(club) {
  const identity = club?.tacticalIdentity || {};
  const t = { ...(club?.alignment || {}), ...(club?.tactics || {}) };
  return {
    formation: t.formation || identity.formation || '4-4-2',
    mentality: t.mentality || identity.mentality || 'BALANCED',
    pressure: t.pressure || identity.pressure || 'NORMAL',
    tempo: t.tempo || identity.tempo || 'NORMAL',
    playStyle: t.playStyle || identity.playStyle || 'POSSESSION',
  };
}

export function chooseMatchPlan(club, rival, { minute = 0, goalDifference = 0, userClubId = null } = {}) {
  const plan = basePlan(club);
  const identity = club?.tacticalIdentity || {};
  const manager = identity.manager || { risk: 0.5, adaptability: 0.5 };
  const isUserTeam = userClubId != null && String(club?.id) === String(userClubId);
  if (isUserTeam) return { ...plan, reason: 'USER_CHOICE' };

  const other = identity.alternate;
  const hasAlternative = other && FORMATION_EFFECTS[other] && other !== plan.formation;
  const primaryEffects = FORMATION_EFFECTS[plan.formation] || FORMATION_EFFECTS['4-4-2'];
  const altEffects = hasAlternative ? FORMATION_EFFECTS[other] : null;

  // Un rival muy superior puede llevar al entrenador adaptable a protegerse
  // desde el inicio. La identidad habitual sigue siendo la referencia.
  if (minute < 60) {
    if (squadOverall(rival) - squadOverall(club) >= 9 &&
        manager.adaptability > 0.62 && altEffects &&
        altEffects.defense > primaryEffects.defense + 0.45) {
      plan.formation = other;
      plan.mentality = 'DEFENSIVE';
      return { ...plan, reason: 'STRONG_OPPONENT' };
    }
    return { ...plan, reason: 'NORMAL' };
  }

  if (goalDifference < 0 && (goalDifference <= -2 || manager.risk >= 0.42)) {
    plan.mentality = 'OFFENSIVE';
    plan.tempo = 'FAST';
    plan.pressure = manager.risk > 0.48 ? 'HIGH' : plan.pressure;
    if (manager.adaptability > 0.48 && altEffects &&
        altEffects.attack > primaryEffects.attack + 0.45) plan.formation = other;
    return { ...plan, reason: 'CHASING_GAME' };
  }

  if (goalDifference > 0 && (goalDifference >= 2 || manager.risk < 0.61)) {
    plan.mentality = 'DEFENSIVE';
    plan.tempo = 'SLOW';
    plan.pressure = 'LOW';
    if (manager.adaptability > 0.52 && altEffects &&
        altEffects.defense > primaryEffects.defense + 0.45) plan.formation = other;
    return { ...plan, reason: 'PROTECTING_LEAD' };
  }

  return { ...plan, reason: 'NORMAL' };
}
