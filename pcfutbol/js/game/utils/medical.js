// js/game/utils/medical.js
// Fuente única: estructura médica + helpers básicos.

export function ensureClubMedical(club) {
  if (!club) return;
  if (!club.medical) club.medical = { centerLevel: 1, physioLevel: 1 };
  if (club.medical.centerLevel == null) club.medical.centerLevel = 1;
  if (club.medical.physioLevel == null) club.medical.physioLevel = 1;
}

export function getMedicalInjuryModifier(club) {
  ensureClubMedical(club);
  const lvl = club.medical?.centerLevel || 1;
  if (lvl >= 4) return 0.65;
  if (lvl === 3) return 0.75;
  if (lvl === 2) return 0.88;
  return 1.0;
}

export function getPhysioRecoveryExtraChance(club) {
  ensureClubMedical(club);
  const lvl = club.medical?.physioLevel || 1;
  if (lvl >= 4) return 0.45;
  if (lvl === 3) return 0.30;
  if (lvl === 2) return 0.18;
  return 0.08;
}