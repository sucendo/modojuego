// Segunda pasada: recintos cuyo club no publica P115 en Wikidata o cuya página
// de Wikipedia no se pudo desambiguar. Las asociaciones se revisan una a una.
// Ejecutar DESPUÉS de buildStadiumCatalog2026.mjs.
import { writeFile } from 'node:fs/promises';
import { STADIUM_CATALOG } from '../js/stadiumCatalog_2026_27.js';
import { allLeagues } from '../js/data.js';

const targets = {
  realsociedad: 'Estadio de Anoeta', arsenal: 'Emirates Stadium', brentford: 'Brentford Community Stadium',
  chelsea: 'Stamford Bridge (stadium)', crystalpalace: 'Selhurst Park', everton: 'Everton Stadium',
  fulham: 'Craven Cottage', liverpool: 'Anfield', sunderland: 'Stadium of Light', burnley: 'Turf Moor',
  lincoln: 'Sincil Bank', middlesbrough: 'Riverside Stadium', millwall: 'The Den',
  portsmouth: 'Fratton Park', southampton: "St Mary's Stadium", watford: 'Vicarage Road',
  wrexham: 'Racecourse Ground',
  atalanta: 'Gewiss Stadium', bologna: 'Stadio Renato Dall’Ara', cagliari: 'Unipol Domus',
  fiorentina: 'Stadio Artemio Franchi', frosinone: 'Stadio Benito Stirpe',
  lecce: 'Stadio Via del Mare', monza: 'Stadio Brianteo', napoli: 'Stadio Diego Armando Maradona',
  parma: 'Stadio Ennio Tardini', sassuolo: 'Mapei Stadium – Città del Tricolore',
  torino: 'Stadio Olimpico Grande Torino', venezia: 'Stadio Pier Luigi Penzo',
  arezzo: 'Stadio Città di Arezzo', ascoli: 'Stadio Cino e Lillo Del Duca',
  avellino: 'Stadio Partenio', benevento: 'Stadio Ciro Vigorito',
  carrarese: 'Stadio dei Marmi', catanzaro: 'Stadio Nicola Ceravolo',
  cesena: 'Stadio Dino Manuzzi', empoli: 'Stadio Carlo Castellani',
  mantova: 'Stadio Danilo Martelli', modena: 'Stadio Alberto Braglia',
  padova: 'Stadio Euganeo', palermo: 'Stadio Renzo Barbera',
  pisa: 'Arena Garibaldi – Stadio Romeo Anconetani', sudtirol: 'Stadio Druso',
  leverkusen: 'BayArena', lehavre: 'Stade Océane',
  santaclara: 'Estádio de São Miguel', alverca: 'Complexo Desportivo do FC Alverca',
  afs: 'Estádio do Clube Desportivo das Aves', telstar: 'BUKO Stadion',
  willemii: 'Koning Willem II Stadion', graafschap: 'De Vijverberg', vitesse: 'GelreDome',
};
const aliases = {
  everton: ['Hill Dickinson Stadium', 'Everton Stadium'],
  atalanta: ['Stadio Atleti Azzurri d’Italia', 'Stadio di Bergamo'],
  cagliari: ['Sardegna Arena'], monza: ['U-Power Stadium'],
  sassuolo: ['Mapei Stadium'], sudtirol: ['Stadio Druso', 'Drusus-Stadion'],
  alverca: ['Complexo Desportivo FC Alverca'],
};
const shared = { inter: 'acmilan', lazio: 'roma' };
const clubCountry = Object.fromEntries(allLeagues.flatMap(league => league.clubs.map(club => [club.id, league.country])));
const countryLang = { España: 'es', Inglaterra: 'en', Italia: 'it', Alemania: 'de', Francia: 'fr', Portugal: 'pt', 'Países Bajos': 'nl' };
const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const catalog = { ...STADIUM_CATALOG };
// La competición y los propios clubes confirman estos recintos para 2026/27.
// Se aplican incluso cuando Wikidata no tiene una ficha enlazada.
const officialOverrides = {
  bologna: { name: 'Stadio Renato Dall’Ara', capacity: 36532, venueId: 'Q757182',
    source: 'https://en.legaseriea.it/team/bologna/stadium' },
  alverca: { name: 'Estádio do FC Alverca', capacity: 6932,
    source: 'https://www.ligaportugal.pt/team/135/fc-alverca/20262027' },
  casapia: { name: 'Estádio Municipal de Rio Maior', capacity: 6984,
    source: 'https://www.ligaportugal.pt/team/56/casa-pia-ac' },
  lourosa: { name: 'Estádio do Lusitânia de Lourosa Futebol Clube', capacity: 4900,
    source: 'https://www.ligaportugal.pt/team/219/l.-lourosa-fc/ligaportugalbetclic/20262027' },
  racing_santander: { capacity: 22514,
    source: 'https://www.realracingclub.es/el-club' },
  eldense: { capacity: 5800,
    source: 'https://www.cdeldense.es/estadio-nuevo-pepico-amat' },
  realsociedad_b: { name: 'Nuevo estadio de Zubieta', capacity: 4000,
    source: 'https://www.realsociedad.eus/es/noticias/detalle/zubieta-brilla-cada-dia-mas' },
  pau: { capacity: 4120,
    source: 'https://www.paufc.fr/club/nouste-camp' },
  // Los filiales juegan en sus academias, no en el estadio del primer equipo.
  benfica_b: { name: 'Benfica Campus (campo principal)', capacity: 2720,
    venueId: null, homeVenueVerified: true,
    source: 'https://media.slbenfica.pt/-/media/BenficaDP/Images/generic_content_pages/slbusiness/eventos/eventos-benfica-brochura-pt.pdf',
    photo: { filename: 'Benfica Campus, Seixal 001.jpg', license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Benfica_Campus,_Seixal_001.jpg' } },
  sporting_b: { name: 'Estádio Aurélio Pereira', capacity: 1125,
    venueId: null, homeVenueVerified: true,
    source: 'https://ligaportugalstorage.blob.core.windows.net/backoffice/assets/Guia_do_Adepto_SCP_Equipa_B_25_26_e9e61a1108.pdf',
    photo: null,
    structure: {
      stands: { preferencia: { present: false }, norte: { present: false }, sur: { present: false } },
      sectorShares: { vip: 0, tribuna: 1, preferencia: 0, norte: 0, sur: 0 },
      structureStatus: 'partial',
      note: 'Dos pequeñas tribunas en un solo lateral. Aforo de 1.125 plazas según la guía de la liga.',
      structureSource: 'https://ligaportugalstorage.blob.core.windows.net/backoffice/assets/Guia_do_Adepto_SCP_Equipa_B_25_26_e9e61a1108.pdf',
    } },
  rioave: { name: 'Estádio do Rio Ave Futebol Clube', capacity: 5244,
    homeVenueVerified: true,
    source: 'https://www.ligaportugal.pt/team/241/rio-ave-fc/20262027',
    photo: null, // La foto anterior mostraba el campo del Chaves (fuera de casa).
    structure: {
      stands: { preferencia: { present: false } },
      structureStatus: 'partial',
      note: 'Sin bancada Nascente. La correspondencia con el sector opuesto a tribuna es orientativa.',
      structureSource: 'https://rioavefc.pt/wp-content/uploads/2026/02/Relatorio-e-Contas-RA-SAD-24.25_PUBLIC-merged.pdf',
    } },
  jong_az: { capacity: 1000, sourceType: 'reference',
    source: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Eerste_Divisie' },
  jong_utrecht: { capacity: 1000, sourceType: 'reference',
    source: 'https://en.wikipedia.org/wiki/Jong_FC_Utrecht' },
};

// Ligas publican la capacidad operativa 2026/27; reflejarla también en la DB
// generada (y no solamente en los perfiles del motor).
const premierCapacity = {
  arsenal: 60704, astonvilla: 36887, bournemouth: 12357, brentford: 17250,
  brighton: 32176, chelsea: 40044, coventry: 32609, crystalpalace: 25194,
  everton: 52769, fulham: 28107, hull: 24983, ipswich: 30294,
  leeds: 37633, liverpool: 61276, mancity: 61038, manutd: 74158,
  newcastle: 52729, nottingham: 31212, sunderland: 48095, tottenham: 62850,
};
for (const [id, capacity] of Object.entries(premierCapacity))
  officialOverrides[id] = { ...officialOverrides[id], capacity,
    source: 'https://www.premierleague.com/en/news/4725666/all-you-need-to-know-about-the-20-premier-league-stadiums/' };
const serieACapacity = {
  atalanta: [23439, 'atalanta'], como: [12370, 'como'], fiorentina: [24786, 'fiorentina'],
  juventus: [41507, 'juventus'], lecce: [30706, 'lecce'], acmilan: [75725, 'milan'],
  inter: [75725, 'inter'], roma: [69689, 'roma'], lazio: [69689, 'lazio'],
  napoli: [54732, 'napoli'],
};
for (const [id, [capacity, slug]] of Object.entries(serieACapacity))
  officialOverrides[id] = { ...officialOverrides[id], capacity,
    source: `https://en.legaseriea.it/team/${slug}/stadium` };

async function saveCatalog() {
  for (const [id, data] of Object.entries(officialOverrides))
    catalog[id] = { ...catalog[id], sourceType: 'official', ...data };
  const output = new URL('../js/stadiumCatalog_2026_27.js', import.meta.url);
  await writeFile(output, `// Fichas externas contrastadas mediante Wikidata P115/P1083/P18 y ligas oficiales.\n// Regenerar con scripts/buildStadiumCatalog2026.mjs + enrichStadiumCatalog2026.mjs.\nexport const STADIUM_CATALOG = Object.freeze(${JSON.stringify(catalog, null, 2)});\n`);
  console.log(`Fichas totales ${Object.keys(catalog).length}/272, imágenes ${Object.values(catalog).filter(x => x.photo).length}, aforos ${Object.values(catalog).filter(x => x.capacity).length}`);
}
if (process.argv.includes('--official-only')) {
  await saveCatalog();
  process.exit(0);
}

async function query(endpoint, params) {
  const url = new URL(endpoint);
  Object.entries({ format: 'json', ...params }).forEach(([key, value]) => url.searchParams.set(key, value));
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'PCFutbolStadiumCatalog/1.0 (stadium source metadata)' } });
      if (response.status === 429) {
        const seconds = Math.max(16, Number(response.headers.get('retry-after')) || 16);
        console.warn(`Wikimedia pide esperar ${seconds}s`);
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        continue;
      }
      if (!response.ok) throw new Error(`${endpoint}: ${response.status}`);
      return await response.json();
    } catch (err) {
      if (attempt === 7) throw err;
      await new Promise(resolve => setTimeout(resolve, 1200 * (attempt + 1)));
    }
  }
  throw new Error(`Límite persistente en ${endpoint}`);
}
function chunks(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) => array.slice(i * size, (i + 1) * size));
}
async function wikipediaVenues(lng, ids) {
  const inputs = ids.flatMap(id => [targets[id], ...(aliases[id] || [])].filter(Boolean).map(title => [id, title]));
  const pagesByInput = {};
  for (const batch of chunks([...new Set(inputs.map(([, title]) => title))], 45)) {
    const response = await query(`https://${lng}.wikipedia.org/w/api.php`, {
      action: 'query', redirects: '1', titles: batch.join('|'), prop: 'pageprops', ppprop: 'wikibase_item',
    });
    const redirects = Object.fromEntries([...(response.query?.normalized || []), ...(response.query?.redirects || [])]
      .map(item => [normalize(item.from), normalize(item.to)]));
    const pages = Object.fromEntries(Object.values(response.query?.pages || {})
      .filter(page => page.pageprops?.wikibase_item).map(page => [normalize(page.title), page.pageprops.wikibase_item]));
    for (const title of batch) {
      let canonical = normalize(title);
      for (let i = 0; i < 3 && redirects[canonical]; i++) canonical = redirects[canonical];
      if (pages[canonical]) pagesByInput[normalize(title)] = pages[canonical];
    }
  }
  return Object.fromEntries(ids.flatMap(id => {
    const item = [targets[id], ...(aliases[id] || [])].map(title => pagesByInput[normalize(title)]).find(Boolean);
    return item ? [[id, item]] : [];
  }));
}
for (const [id, source] of Object.entries(shared)) if (!catalog[id] && catalog[source]) catalog[id] = { ...catalog[source] };
const missing = Object.keys(targets).filter(id => !catalog[id]);
const groups = Map.groupBy(missing, id => countryLang[clubCountry[id]] || 'en');
const resolved = {};
for (const [language, ids] of groups) Object.assign(resolved, await wikipediaVenues(language, ids));
const needsEnglish = missing.filter(id => !resolved[id]);
if (needsEnglish.length) Object.assign(resolved, await wikipediaVenues('en', needsEnglish));
console.log(`Recintos adicionales localizados: ${Object.keys(resolved).length}/${missing.length}`);

const ids = [...new Set(Object.values(resolved))];
const venues = {};
for (const batch of chunks(ids, 40)) Object.assign(venues,
  (await query('https://www.wikidata.org/w/api.php', {
    action: 'wbgetentities', ids: batch.join('|'), props: 'claims|labels', languages: 'en|es|fr|de|it|pt|nl',
  })).entities || {});
const claim = (entity, property) => (entity?.claims?.[property] || []).find(x => x.rank === 'preferred')
  || (entity?.claims?.[property] || []).find(x => x.rank !== 'deprecated');
const photoFiles = Object.fromEntries(Object.entries(resolved).map(([id, qid]) =>
  [id, claim(venues[qid], 'P18')?.mainsnak?.datavalue?.value]).filter(([, file]) => !!file));
const photos = {};
for (const batch of chunks([...new Set(Object.values(photoFiles))], 40)) {
  const response = await query('https://commons.wikimedia.org/w/api.php', {
    action: 'query', titles: batch.map(file => `File:${file}`).join('|'), prop: 'imageinfo',
    iiprop: 'extmetadata|url', iiurlwidth: '960',
  });
  for (const page of Object.values(response.query?.pages || {})) {
    const details = page.imageinfo?.[0];
    const license = details?.extmetadata?.LicenseShortName?.value;
    if (details?.thumburl && /^(CC BY(?:-SA)?(?:\s|$)|CC0(?:\s|$)|Public domain|PD(?:\s|$))/i.test(license || ''))
      photos[page.title.replace(/^File:/, '')] = { filename: page.title.replace(/^File:/, ''),
        license, url: details.descriptionurl };
  }
}
for (const [id, qid] of Object.entries(resolved)) {
  const entity = venues[qid];
  if (!entity) continue;
  const lng = countryLang[clubCountry[id]] || 'en';
  const name = entity.labels?.[lng]?.value || entity.labels?.en?.value || entity.labels?.es?.value || targets[id];
  const value = Number(claim(entity, 'P1083')?.mainsnak?.datavalue?.value?.amount);
  const capacity = Number.isFinite(value) && value >= 500 && value <= 135000 ? Math.round(value) : null;
  const file = photoFiles[id];
  catalog[id] = { name, venueId: qid, source: `https://www.wikidata.org/wiki/${qid}`,
    ...(capacity ? { capacity } : {}), ...(photos[file] ? { photo: photos[file] } : {}),
  };
}
await saveCatalog();
console.log('Sin localizar:', missing.filter(id => !catalog[id]).join(', '));
