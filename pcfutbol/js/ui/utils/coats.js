// Escudos de los clubes: todas las imágenes se sirven desde el proyecto.
// Las URLs de Google/ESPN/Transfermarkt solo se utilizan en scripts/downloadCoats.mjs.
const COATS_DIRECTORY = 'img/coats/2026-27';

function normalizeClubId(clubId) {
  if (!clubId) return '';
  const id = String(clubId).trim().toLowerCase();
  return /^[a-z0-9_]+$/.test(id) ? id : '';
}

export function getCoatCandidateUrlsForClubId(clubId) {
  const id = normalizeClubId(clubId);
  return id ? [`${COATS_DIRECTORY}/${id}.png`] : [];
}

export function getCoatUrlForClubId(clubId) {
  return getCoatCandidateUrlsForClubId(clubId)[0] || null;
}

function coatPlaceholder(clubName, clubId) {
  const label = String(clubName || clubId || '?').trim().split(/\s+/)
    .filter(Boolean).slice(0, 3).map(word => word[0].toUpperCase()).join('');
  const safeLabel = label.replace(/[&<>"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <path d="M48 5 85 16V48C85 70 70 84 48 93 26 84 11 70 11 48V16Z" fill="#173252" stroke="#e5bd59" stroke-width="5"/>
    <text x="48" y="60" font-size="26" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" fill="#fff">${safeLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Escudos insertados con outerHTML: escucha errores incluso en tablas dinámicas.
let fallbackListenerInstalled = false;
function ensureCoatFallbackListener() {
  if (fallbackListenerInstalled) return;
  document.addEventListener('error', event => {
    const img = event.target;
    if (!img?.classList?.contains('coat-icon')) return;
    let remaining = [];
    try { remaining = JSON.parse(img.dataset.coatFallbacks || '[]'); } catch { /* no-op */ }
    if (!remaining.length) {
      img.style.visibility = 'hidden';
      return;
    }
    img.dataset.coatFallbacks = JSON.stringify(remaining.slice(1));
    img.src = remaining[0];
  }, true);
  fallbackListenerInstalled = true;
}

export function createCoatImgElement(clubId, clubName, size = 20) {
  const urls = getCoatCandidateUrlsForClubId(clubId);
  const placeholder = coatPlaceholder(clubName, clubId);
  ensureCoatFallbackListener();
  const img = document.createElement('img');
  img.src = urls[0] || placeholder;
  img.dataset.coatFallbacks = JSON.stringify(urls.length ? [...urls.slice(1), placeholder] : []);
  img.alt = clubName ? `Escudo de ${clubName}` : 'Escudo del club';
  img.classList.add('coat-icon');
  img.loading = 'lazy';
  img.decoding = 'async';
  if (size != null) {
    img.width = size;
    img.height = size;
  }
  return img;
}
