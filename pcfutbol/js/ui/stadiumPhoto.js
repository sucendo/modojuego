import { getStadiumStructure } from '../stadiums_2026_27.js?v=1673';
import { renderStadiumPlan, stadiumPlanAvailable } from './stadiumSvgPlan.js?v=1673';

// Las fotografías son de Wikidata/Wikimedia Commons, no de búsquedas de imágenes
// arbitrarias. Solo aceptamos obras con licencia abierta y enlace de atribución.
// La ficha del estadio conserva la pista wikiTitle para desambiguar recintos.
const cache = new Map();
const API = {
  wiki: 'https://es.wikipedia.org/w/api.php',
  data: 'https://www.wikidata.org/w/api.php',
  commons: 'https://commons.wikimedia.org/w/api.php',
};

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function wikipediaStadiumTitles(name, preferred = null) {
  if (preferred) return [preferred];
  const cleaned = String(name || '').trim();
  // "Estadio de Club X" es una denominación provisional de catálogo, no una
  // prueba de que exista una entrada enciclopédica ni una foto identificable.
  if (!cleaned || /^estadio de (?!la |los |las |el )/i.test(cleaned)) return [];
  return [...new Set([cleaned, `Estadio ${cleaned}`, `Estadio de ${cleaned}`])];
}

export function isOpenPhotoLicense(license) {
  return /^(CC BY(?:-SA)?(?:\s|$)|CC0(?:\s|$)|Public domain|PD(?:\s|$))/i.test(String(license || ''));
}

async function mediaWiki(endpoint, parameters) {
  const url = new URL(endpoint);
  Object.entries({ action: 'query', format: 'json', origin: '*', ...parameters })
    .forEach(([name, value]) => url.searchParams.set(name, String(value)));
  const response = await fetch(url.toString(), { mode: 'cors', credentials: 'omit' });
  if (!response.ok) throw new Error(`Consulta Wikimedia: ${response.status}`);
  return response.json();
}

function rawArtist(value) {
  return String(value || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

async function findOpenPhoto(stadiumName, wikiTitle) {
  const titles = wikipediaStadiumTitles(stadiumName, wikiTitle);
  if (!titles.length) return null;
  const listing = await mediaWiki(API.wiki, {
    redirects: 1, prop: 'pageprops', ppprop: 'wikibase_item', titles: titles.join('|'),
  });
  const identity = normalize(stadiumName).replace(/^estadio (de |del )?/, '');
  const pages = Object.values(listing.query?.pages || {});
  const page = pages.find(candidate => candidate.pageprops?.wikibase_item &&
    (wikiTitle || normalize(candidate.title).includes(identity)));
  const entityId = page?.pageprops?.wikibase_item;
  if (!/^Q\d+$/.test(entityId || '')) return null;

  const entities = await mediaWiki(API.data, { action: 'wbgetentities', ids: entityId, props: 'claims' });
  const file = entities.entities?.[entityId]?.claims?.P18?.find(claim => claim.rank !== 'deprecated')
    ?.mainsnak?.datavalue?.value;
  if (!file || typeof file !== 'string') return null;

  const results = await mediaWiki(API.commons, {
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: 960,
    titles: `File:${file}`,
  });
  const details = Object.values(results.query?.pages || {})[0]?.imageinfo?.[0];
  const license = details?.extmetadata?.LicenseShortName?.value;
  if (!details?.thumburl || !details?.descriptionurl || !isOpenPhotoLicense(license)) return null;
  return { src: details.thumburl, source: details.descriptionurl, license,
    author: rawArtist(details.extmetadata?.Artist?.value) || 'Wikimedia Commons' };
}

async function findCatalogPhoto(photo) {
  if (!photo?.filename) return null;
  const results = await mediaWiki(API.commons, {
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: 960,
    titles: `File:${photo.filename}`,
  });
  const details = Object.values(results.query?.pages || {})[0]?.imageinfo?.[0];
  const license = details?.extmetadata?.LicenseShortName?.value;
  if (!details?.thumburl || !details?.descriptionurl || !isOpenPhotoLicense(license)) return null;
  return { src: details.thumburl, source: details.descriptionurl, license,
    author: rawArtist(details.extmetadata?.Artist?.value) || 'Wikimedia Commons' };
}

export function getStadiumPhoto(club) {
  const stadium = club?.stadium;
  if (!stadium?.name) return Promise.resolve(null);
  const structure = getStadiumStructure(club);
  const key = `${club.id}:${stadium.name}:${structure.venueId || structure.wikiTitle || ''}`;
  if (!cache.has(key)) cache.set(key,
    (structure.photo ? findCatalogPhoto(structure.photo) : findOpenPhoto(stadium.name, structure.wikiTitle))
      .catch(() => null));
  return cache.get(key);
}

/** Misma foto para previa y ficha; si falta, plano real del juego como imagen. */
export function renderStadiumPhoto(container, credit, club, sectors = []) {
  if (!container) return;
  const key = String(club?.id ?? '');
  if (container.dataset.stadiumPhotoKey === key) return;
  container.dataset.stadiumPhotoKey = key;
  const structure = getStadiumStructure(club);
  const plan = stadiumPlanAvailable(structure.plan) ? structure.plan : 'generic';
  renderStadiumPlan(container, { plan, stadiumName: club?.stadium?.name,
    sectors, structure, interactive: false, showLabels: false });
  if (credit) credit.textContent = 'Plano orientativo generado; no es una fotografía del recinto';

  getStadiumPhoto(club).then(photo => {
    if (!photo || container.dataset.stadiumPhotoKey !== key) return;
    const img = document.createElement('img');
    img.className = 'pcf-stadium-photo__img';
    img.alt = `Fotografía del ${club?.stadium?.name || 'estadio'}`;
    img.decoding = 'async';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => { // Conservar el plano si un servidor externo bloquea la imagen.
      if (container.dataset.stadiumPhotoKey !== key) return;
      renderStadiumPlan(container, { plan, stadiumName: club?.stadium?.name,
        sectors, structure, interactive: false, showLabels: false });
      if (credit) credit.textContent = 'Plano orientativo generado; fotografía no disponible';
    };
    img.src = photo.src;
    container.replaceChildren(img);
    container.classList.remove('pcf-stadium-map--svg');
    if (credit) {
      credit.replaceChildren();
      const link = document.createElement('a');
      link.href = photo.source;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `Foto: ${photo.author} · ${photo.license} · Wikimedia Commons`;
      credit.append(link);
    }
  });
}
