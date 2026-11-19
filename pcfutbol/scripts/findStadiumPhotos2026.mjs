// Tercera pasada opcional: busca FOTOS de Commons para recintos sin P18.
// Solo acepta coincidencias de nombre muy claras y licencias abiertas.
// No utiliza imágenes de Google ni material sujeto a copyright desconocido.
import { writeFile } from 'node:fs/promises';
import { STADIUM_CATALOG } from '../js/stadiumCatalog_2026_27.js';
import { allLeagues } from '../js/data.js';

const catalog = { ...STADIUM_CATALOG };
const clubs = allLeagues.flatMap(league => league.clubs);
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const STOP = new Set('stadium stadio stade estadio estadio de del des dos das do la le les lo los las el al en the of fc club futebol football campo arena sportcomplex complexo municipal estadio novo nuevo sta'.split(' '));
const aliases = {
  elche: 'Martinez Valero Elche', napoli: 'Stadio Diego Armando Maradona',
  juvestabia: 'Romeo Menti Castellammare di Stabia',
  academico_viseu: 'Estadio Fontelo Viseu', porto_b: 'Estádio Municipal Jorge Sampaio',
  jong_az: 'AFAS Trainingscomplex Jong AZ',
};
const isOpen = license => /^(CC BY(?:-SA)?(?:\s|$)|CC0(?:\s|$)|Public domain|PD(?:\s|$))/i.test(String(license || ''));
function meaningfulWords(s) {
  return normalize(s).split(' ').filter(word => word.length > 2 && !STOP.has(word) && !/\d/.test(word));
}
function score(file, stadium) {
  const name = normalize(file).replace(/\b(?:jpg|jpeg|png|webp)\b/g, '').trim();
  const words = meaningfulWords(stadium);
  if (!words.length) return 0;
  const matches = words.filter(word => name.includes(word));
  if (!matches.length || matches.length / words.length < .65) return 0;
  if (words.length === 1 && !name.includes(words[0])) return 0;
  const bad = /\b(?:logo|badge|map|diagram|plan|ticket|draw|render|mockup|poster|seatplan|interior-design)\b/;
  if (bad.test(name)) return 0;
  return matches.length * 4 + (matches.length === words.length ? 6 : 0)
    + (/panoram|interior|tribun|aerial|stadium|estadio|stadio|stade/.test(name) ? 2 : 0);
}
async function searchStadium(stadium) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({ action: 'query', generator: 'search', gsrsearch: stadium,
    gsrnamespace: '6', gsrlimit: '18', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '960', format: 'json' }).forEach(([key, val]) => url.searchParams.set(key, val));
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000),
      headers: { 'User-Agent': 'PCFutbolStadiumCatalog/1.0 (open photo review)' } });
    if (response.status === 429) {
      const secs = Math.max(16, Number(response.headers.get('retry-after')) || 16);
      console.warn(`Pausa de Commons: ${secs}s`);
      await new Promise(resolve => setTimeout(resolve, secs * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`Commons ${response.status}`);
    return Object.values((await response.json()).query?.pages || {});
  }
  return [];
}

// --review-only permite aplicar correcciones humanas sin repetir 272 consultas.
for (const club of (process.argv.includes('--review-only') ? [] : clubs.filter(club => !catalog[club.id]?.photo))) {
  const stadium = catalog[club.id]?.name || club.stadium.name;
  if (!stadium) continue;
  try {
    let candidates = await searchStadium(stadium);
    if (!candidates.length && aliases[club.id]) candidates = await searchStadium(aliases[club.id]);
    const ranked = candidates.map(page => {
      const info = page.imageinfo?.[0];
      const license = info?.extmetadata?.LicenseShortName?.value;
      const filename = page.title?.replace(/^File:/, '');
      const value = isOpen(license) && info?.thumburl && /^image\/(jpeg|png|webp)$/i.test(info.mime || '')
        ? score(filename, stadium) || (aliases[club.id] ? score(filename, aliases[club.id]) : 0) : 0;
      return { filename, license, source: info?.descriptionurl, value, width: info?.width, height: info?.height };
    }).filter(photo => photo.value >= 8 && photo.width > photo.height).sort((a, b) => b.value - a.value);
    const best = ranked[0];
    if (best) {
      catalog[club.id] = { ...catalog[club.id], photo: { filename: best.filename,
        license: best.license, url: best.source } };
      console.log(`Foto: ${club.id} → ${best.filename}`);
    } else {
      console.log(`PENDIENTE ${club.id} (${stadium}); candidatos: ${candidates.slice(0, 3).map(p => p.title).join(' | ')}`);
    }
  } catch (err) { console.log(`Error ${club.id}: ${err.message}`); }
}
// Verificación manual: mismo nombre no significa mismo estadio. En particular,
// hay dos recintos "Romeo Menti" y un campo urbano llamado Marie Marvingt.
const reviewed = {
  // Freiburg dejó el Dreisamstadion: nunca reutilizar su antigua foto P18.
  freiburg: { filename: 'Europa Park Stadion in Freiburg, Gebäudeseite.jpg', license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:Europa_Park_Stadion_in_Freiburg,_Geb%C3%A4udeseite.jpg' },
  juvestabia: { filename: 'Curva Sud Juve Stabia.jpg', license: 'Public domain',
    url: 'https://commons.wikimedia.org/wiki/File:Curva_Sud_Juve_Stabia.jpg' },
  lemans: { filename: 'Le mans fc laval.jpg', license: 'CC BY-SA 3.0',
    url: 'https://commons.wikimedia.org/wiki/File:Le_mans_fc_laval.jpg' },
  benfica_b: { filename: 'Benfica Campus, Seixal 001.jpg', license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:Benfica_Campus,_Seixal_001.jpg' },
  // Sin imágenes libres del recinto verificadas: nunca mostrar otro campo.
  sporting_b: null,
  rioave: null,
  // La imagen de 2007 muestra el antiguo campo Z1, no el nuevo recinto 2026.
  realsociedad_b: null,
};
for (const [id, photo] of Object.entries(reviewed)) {
  catalog[id] = { ...catalog[id], photo };
  console.log(`Revisión ${id}: ${photo?.filename || 'plano SVG'} `);
}
const output = new URL('../js/stadiumCatalog_2026_27.js', import.meta.url);
await writeFile(output, `// Estadios 2026/27: Wikidata, Commons y fuentes oficiales de clubes/ligas.\n// Generación: buildStadiumCatalog2026, enrichStadiumCatalog2026 y findStadiumPhotos2026.\nexport const STADIUM_CATALOG = Object.freeze(${JSON.stringify(catalog, null, 2)});\n`);
console.log(`Fotografías: ${Object.values(catalog).filter(item => item.photo).length}/${clubs.length}`);
