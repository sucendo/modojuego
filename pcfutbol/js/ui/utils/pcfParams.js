function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function avg(...xs) {
  const v = xs.map(Number).filter((n) => Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function getRoleFromPosition(position) {
  const p = String(position || '').toUpperCase();
  if (p === 'POR' || p === 'GK') return 'POR';
  if (p.startsWith('D') || ['LD','LI','DFC','RB','LB','CB','CAD','CAI'].includes(p)) return 'DEF';
  if (p.startsWith('M') || ['MC','MCD','MCO','DM','CM','AM','MD','MI','MP'].includes(p)) return 'MED';
  return 'DEL';
}

export function getDemarcation(position) {
  return String(position || '-').toUpperCase();
}

// Parámetros “PCF” (aprox) a partir de attributes + overall
export function computePCFParams(player) {
  const overall = Number(player?.overall ?? 50);
  const tech = player?.attributes?.technical || {};
  const ment = player?.attributes?.mental || {};
  const phys = player?.attributes?.physical || {};

  const CF = avg(phys.pace, phys.stamina, phys.strength) ?? overall;
  const CM = avg(ment.vision, ment.composure, ment.workRate, ment.leadership) ?? overall;
  const CD = avg(tech.tackling, phys.strength, ment.workRate, ment.composure) ?? overall;
  const CO = avg(tech.shooting, tech.dribbling, tech.passing, ment.vision) ?? overall;

  const MO = player?.morale != null ? Math.round(clamp(player.morale, 0, 1) * 100) : null;

  // EN = Energía (fitness)
  const EN = player?.fitness != null ? Math.round(clamp(player.fitness, 0, 1) * 100) : null;

  // EF = Forma (player.form -3..+3 => 0..100)
  const f = (player?.form != null && Number.isFinite(Number(player.form))) ? Number(player.form) : null;
  const EF = f != null ? Math.round(clamp(50 + clamp(f, -3, 3) * 15, 0, 100)) : null;
  const ME = overall;

  return {
    EN: EN != null ? EN : Math.round(overall),
    CF: Math.round(clamp(CF, 1, 99)),
    CM: Math.round(clamp(CM, 1, 99)),
    CD: Math.round(clamp(CD, 1, 99)),
    CO: Math.round(clamp(CO, 1, 99)),
    MO: MO != null ? Math.round(clamp(MO, 0, 100)) : null,
    EF: EF != null ? Math.round(clamp(EF, 0, 100)) : null,
    ME: Math.round(clamp(ME, 1, 99)),
    ROL: getRoleFromPosition(player?.position),
    DEM: getDemarcation(player?.position),
  };
}