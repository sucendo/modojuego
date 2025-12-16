/**
 * Helpers puros de jugadores (sin tocar DOM).
 * Aquí vive:
 * - rol (POR/DEF/MED/DEL)
 * - demarcación (LD/DFC/MC/...)
 * - bandera (usando mapa si existe, o emoji fallback)
 */

export function getPositionGroup(position) {
  const pos = String(position || '').toUpperCase();
  if (pos === 'POR' || pos === 'GK') return 0;
  if (['LD','LI','DFC','CAD','CAI','DF','RB','LB','CB','RWB','LWB'].includes(pos)) return 1;
  if (['MCD','MC','MCO','MD','MI','MED','CM','CDM','CAM','RM','LM'].includes(pos)) return 2;
  if (['ED','EI','SD','DC','DEL','ST','RW','LW','CF'].includes(pos)) return 3;
  return 2;
}

export function getRoleFromPosition(position) {
  const g = getPositionGroup(position);
  if (g === 0) return 'POR';
  if (g === 1) return 'DEF';
  if (g === 2) return 'MED';
  if (g === 3) return 'DEL';
  return '-';
}

export function getDemarcation(player) {
  const pos = (player?.position || player?.pos || '-');
  return String(pos).toUpperCase();
}

// ---- Bandera: usa mapa global si existe (tu “mapa de banderas” actual) ----
// Soporta: globalThis.FLAG_MAP o globalThis.FLAG_URLS (ajústalo a tu nombre real si lo tienes)
function normalizeKey(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getFlagUrlFromGlobalMap(nationality) {
  const key = normalizeKey(nationality);
  const map = globalThis.FLAG_MAP || globalThis.FLAG_URLS || null;
  if (!map || !key) return null;
  return map[key] || map[nationality] || null;
}

export function isoToFlagEmoji(iso2) {
  const code = String(iso2 || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + (code.charCodeAt(0) - 65),
    A + (code.charCodeAt(1) - 65)
  );
}

export function flagEmojiFallback(nationality) {
  const nat = normalizeKey(nationality);
  if (!nat) return '';
  const MAP = {
    espana: 'ES', francia: 'FR', italia: 'IT', alemania: 'DE', portugal: 'PT',
    inglaterra: 'GB', escocia: 'GB', gales: 'GB', irlanda: 'IE',
    argentina: 'AR', brasil: 'BR', uruguay: 'UY', chile: 'CL', colombia: 'CO',
    mexico: 'MX', 'estados unidos': 'US', eeuu: 'US', canada: 'CA',
    japon: 'JP', 'corea del sur': 'KR', china: 'CN', australia: 'AU',
    suecia: 'SE', noruega: 'NO', dinamarca: 'DK', finlandia: 'FI',
    suiza: 'CH', austria: 'AT', polonia: 'PL', rumania: 'RO',
    serbia: 'RS', croacia: 'HR', marruecos: 'MA', senegal: 'SN',
    nigeria: 'NG', ghana: 'GH', camerun: 'CM', 'costa de marfil': 'CI',
  };
  const iso = MAP[nat] || MAP[nat.replace(/\s+/g, '')] || '';
  return iso ? isoToFlagEmoji(iso) : '';
}

/**
 * Crea un nodo “bandera” sin depender de tu implementación actual.
 * - Si hay URL en tu mapa global, devuelve <img>.
 * - Si no, devuelve <span> con emoji (fallback).
 */
export function createFlagNode(nationality) {
  const url = getFlagUrlFromGlobalMap(nationality);
  if (url) {
    const img = document.createElement('img');
    img.className = 'pcf-flag';
    img.src = url;
    img.alt = nationality ? `Bandera ${nationality}` : 'Bandera';
    img.loading = 'lazy';
    return img;
  }
  const emoji = flagEmojiFallback(nationality);
  const span = document.createElement('span');
  span.className = 'pcf-flag';
  span.textContent = emoji || '';
  span.setAttribute('aria-hidden', 'true');
  return span;
}