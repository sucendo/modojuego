// Importación reproducible de recintos: Wikidata P115 (campo habitual del club),
// P1083 (aforo), P18 (foto) y Commons (licencia). No asignar un recinto ambiguo.
// Ejecutar desde la raíz: node pcfutbol/scripts/buildStadiumCatalog2026.mjs
import { writeFile } from 'node:fs/promises';
import { allLeagues } from '../js/data.js';

const API = 'https://www.wikidata.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const output = new URL('../js/stadiumCatalog_2026_27.js', import.meta.url);
const clubs = allLeagues.flatMap(league => league.clubs.map(club => ({ ...club, country: league.country })));
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const mediaWiki = async (endpoint, params) => {
  const url = new URL(endpoint);
  Object.entries({ format: 'json', ...params }).forEach(([key, val]) => url.searchParams.set(key, val));
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(25000),
        headers: { 'User-Agent': 'PCFutbolStadiumCatalog/1.0 (personal football game; public Wikimedia data)' } });
      if (response.status === 429) {
        const seconds = Math.max(16, Number(response.headers.get('retry-after')) || 16);
        console.warn(`Límite Wikimedia ${new URL(endpoint).hostname}: pausa ${seconds} s`);
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        continue;
      }
      if (!response.ok) throw new Error(`${response.status}: ${params.action}`);
      return await response.json();
    } catch (err) {
      if (attempt === 7) throw err;
      await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 900));
    }
  }
  throw new Error(`Límite persistente: ${params.action}`);
};
function language(country) {
  return ({ España: 'es', Inglaterra: 'en', Italia: 'it', Alemania: 'de', Francia: 'fr', Portugal: 'pt', 'Países Bajos': 'nl' })[country] || 'en';
}
// Wikipedia permite resolver lotes de títulos en una sola llamada (también
// redirecciones). No generamos cientos de búsquedas individuales ni forzamos
// una coincidencia si el título no se resuelve exactamente.
function variants(club) {
  const name = club.name;
  return [...new Set([name,
    /\b(?:FC|CF|AC|SC|SV|AS|CD)\b/i.test(name) ? name : `${name} F.C.`,
    name.replace(/\bFC\b/g, 'Football Club').replace(/\bCF\b/g, 'Club de Fútbol')])];
}
async function resolveByWikipedia(clubsToResolve, lng) {
  const titles = [...new Set(clubsToResolve.flatMap(variants))];
  const batches = Array.from({ length: Math.ceil(titles.length / 45) }, (_, i) => titles.slice(i * 45, (i + 1) * 45));
  const found = {};
  for (const batch of batches) {
    const json = await mediaWiki(`https://${lng}.wikipedia.org/w/api.php`, {
      action: 'query', titles: batch.join('|'), redirects: '1', prop: 'pageprops', ppprop: 'wikibase_item',
    });
    const aliases = Object.fromEntries([...(json.query?.normalized || []), ...(json.query?.redirects || [])]
      .map(item => [normalize(item.from), normalize(item.to)]));
    const pages = Object.fromEntries(Object.values(json.query?.pages || {})
      .filter(page => page.pageprops?.wikibase_item).map(page => [normalize(page.title), page.pageprops.wikibase_item]));
    for (const title of batch) {
      let canonical = normalize(title);
      for (let i = 0; i < 3 && aliases[canonical]; i++) canonical = aliases[canonical];
      if (pages[canonical]) found[normalize(title)] = pages[canonical];
    }
  }
  return Object.fromEntries(clubsToResolve.flatMap(club => {
    const item = variants(club).map(title => found[normalize(title)]).find(Boolean);
    return item ? [[club.id, item]] : [];
  }));
}
async function parallelMap(items, fn, count = 5) {
  let index = 0;
  const output = Array(items.length);
  await Promise.all(Array.from({ length: count }, async () => {
    while (index < items.length) {
      const current = index++;
      try { output[current] = await fn(items[current], current); }
      catch (err) { console.error(`Aviso ${items[current]?.name || current}: ${err.message}`); output[current] = null; }
      if ((current + 1) % 30 === 0) console.log(`Consultas: ${current + 1}/${items.length}`);
    }
  }));
  return output;
}
async function getEntities(ids, props = 'claims|labels') {
  const unique = [...new Set(ids.filter(id => /^Q\d+$/.test(id || '')))];
  const batches = Array.from({ length: Math.ceil(unique.length / 40) }, (_, i) => unique.slice(i * 40, (i + 1) * 40));
  const parts = await parallelMap(batches, async batch => (await mediaWiki(API,
    { action: 'wbgetentities', ids: batch.join('|'), props, languages: 'en|es|fr|de|it|pt|nl' })).entities || {}, 1);
  return Object.assign({}, ...parts.filter(Boolean));
}
function claim(entity, key) {
  const dated = (entity?.claims?.[key] || []).filter(item => item.rank !== 'deprecated')
    .filter(item => { // P582 = fecha de fin (p. ej., antiguo estadio)
      const end = item.qualifiers?.P582?.[0]?.datavalue?.value?.time;
      return !end || Number(end.slice(1, 5)) > 2026;
    });
  return dated.find(item => item.rank === 'preferred') || dated[0];
}
function label(entity, lang) {
  return entity?.labels?.[lang]?.value || entity?.labels?.en?.value || entity?.labels?.es?.value
    || Object.values(entity?.labels || {})[0]?.value;
}
function isOpenLicense(value) {
  return /^(CC BY(?:-SA)?(?:\s|$)|CC0(?:\s|$)|Public domain|PD(?:\s|$))/i.test(String(value || ''));
}
async function getOpenImages(names) {
  const unique = [...new Set(names.filter(Boolean))];
  const batches = Array.from({ length: Math.ceil(unique.length / 40) }, (_, i) => unique.slice(i * 40, (i + 1) * 40));
  const results = await parallelMap(batches, async batch => {
    const json = await mediaWiki(COMMONS, { action: 'query', titles: batch.map(name => `File:${name}`).join('|'),
      prop: 'imageinfo', iiprop: 'extmetadata|url', iiurlwidth: '960' });
    return Object.values(json.query?.pages || {}).map(page => {
      const data = page.imageinfo?.[0];
      const license = data?.extmetadata?.LicenseShortName?.value;
      return [page.title.replace(/^File:/, ''), data?.thumburl && isOpenLicense(license)
        ? { filename: page.title.replace(/^File:/, ''), license, url: data.descriptionurl } : null];
    });
  }, 1);
  return Object.fromEntries(results.filter(Boolean).flat());
}

console.log(`Consultando ${clubs.length} clubes; no se completarán coincidencias dudosas.`);
const grouped = Map.groupBy(clubs, club => language(club.country));
const exact = {};
for (const [lng, items] of grouped) Object.assign(exact, await resolveByWikipedia(items, lng));
const missing = clubs.filter(club => !exact[club.id]);
console.log(`Títulos en idioma nacional: ${Object.keys(exact).length}/${clubs.length}. Intentando inglés para ${missing.length}.`);
Object.assign(exact, await resolveByWikipedia(missing, 'en'));
const teamEntities = await getEntities(Object.values(exact), 'claims');
const venueByClub = Object.fromEntries(clubs.map((club, index) => {
  const teamId = exact[club.id];
  const venueId = claim(teamEntities[teamId], 'P115')?.mainsnak?.datavalue?.value?.id;
  return [club.id, venueId || null];
}));
const venues = await getEntities(Object.values(venueByClub));
const filenames = Object.values(venues).map(entity => claim(entity, 'P18')?.mainsnak?.datavalue?.value);
const images = await getOpenImages(filenames);
const catalog = {};
for (const club of clubs) {
  const venueId = venueByClub[club.id];
  const entity = venues[venueId];
  if (!entity) continue;
  const capacityValue = Number(claim(entity, 'P1083')?.mainsnak?.datavalue?.value?.amount);
  const capacity = Number.isFinite(capacityValue) && capacityValue >= 500 && capacityValue <= 135000
    ? Math.round(capacityValue) : null;
  const filename = claim(entity, 'P18')?.mainsnak?.datavalue?.value;
  const photo = images[filename] || null;
  catalog[club.id] = {
    name: label(entity, language(club.country)),
    venueId,
    source: `https://www.wikidata.org/wiki/${venueId}`,
    ...(capacity ? { capacity } : {}),
    ...(photo ? { photo } : {}),
  };
}
await writeFile(output, `// Fichas externas contrastadas mediante Wikidata P115/P1083/P18.\n// Regenerar con scripts/buildStadiumCatalog2026.mjs; las cifras pueden cambiar.\nexport const STADIUM_CATALOG = Object.freeze(${JSON.stringify(catalog, null, 2)});\n`, 'utf8');
const entries = Object.values(catalog);
console.log(`Guardados ${entries.length}/${clubs.length} recintos identificados, ${entries.filter(x => x.capacity).length} aforos Wikidata, ${entries.filter(x => x.photo).length} fotografías CC.`);
console.log('Sin recinto identificado:', clubs.filter(club => !catalog[club.id]).map(club => club.id).join(', '));
