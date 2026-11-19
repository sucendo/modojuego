// Fichas de estadios 2026/27. El aforo operativo y la estructura no son lo mismo:
// un estadio en obras puede disponer de menos localidades y niveles abiertos.
// Los niveles indicados como documentados proceden de fuentes del propio club.
// Los repartos de asientos por zonas/alturas son estimaciones del simulador hasta
// contar con un plano de aforo desglosado; nunca se anuncian como cifras oficiales.
import { STADIUM_CATALOG } from './stadiumCatalog_2026_27.js';

const STADIUM_PROFILES = Object.freeze({
  eldense: {
    sectorConstraints: { vip: 165 },
    structureStatus: 'partial',
    note: 'Palco institucional y asientos VIP: 45 + 120. La distribución del resto es estimada.',
    structureSource: 'https://www.cdeldense.es/estadio-nuevo-pepico-amat',
  },
  pau: {
    sectorConstraints: { vip: 600 },
    structureStatus: 'partial',
    note: '600 plazas VIP incluidas en el modelo; el reparto por gradas se estima.',
    structureSource: 'https://www.paufc.fr/club/nouste-camp',
  },
  benfica_b: {
    structureStatus: 'partial',
    note: 'Benfica Campus: 2.720 localidades, de ellas 1.630 cubiertas. No se conoce el reparto exacto por sector.',
    structureSource: 'https://media.slbenfica.pt/-/media/BenficaDP/Images/generic_content_pages/slbusiness/eventos/eventos-benfica-brochura-pt.pdf',
  },
  astonvilla: {
    // Premier League 2026/27: tribuna norte cerrada por la reconstrucción.
    stands: { norte: { present: false } },
    structureStatus: 'partial',
    note: 'La tribuna norte no se utiliza en la temporada 2026/27; las demás alturas siguen siendo estimaciones.',
    structureSource: 'https://www.premierleague.com/en/news/4725666/all-you-need-to-know-about-the-20-premier-league-stadiums/',
  },
  tottenham: {
    // Las 17.500 localidades de la tribuna sur son oficiales y son una única altura.
    sectorConstraints: { sur: 17500 },
    stands: { sur: { present: true, levels: [{ name: 'Tribuna sur · nivel único', weight: 1 }] } },
    structureStatus: 'partial',
    note: 'Tribuna sur de una sola altura: 17.500 localidades. Resto del graderío: estimación del simulador.',
    structureSource: 'https://www.premierleague.com/en/news/4725666/all-you-need-to-know-about-the-20-premier-league-stadiums/',
  },
  everton: {
    structureSource: 'https://www.evertonfc.com/stadium-information/',
  },
  arsenal: {
    structureSource: 'https://www.arsenal.com/news/emirates-stadium-matchday-guide-aw6De3m9B6Ot',
  },
  chelsea: {
    structureSource: 'https://www.chelseafc.com/en/stadium-history',
  },
  atletico: {
    capacity: 70813,
    plan: 'metropolitano',
    wikiTitle: 'Estadio Metropolitano (Madrid)',
    levels: ['Grada baja', 'Grada media', 'Grada alta'],
    sectorLevels: {
      tribuna: ['Grada baja', 'Grada media', 'Grada alta'],
      preferencia: ['Grada baja', 'Grada alta'],
      norte: ['Grada baja', 'Grada media', 'Grada alta'],
      sur: ['Grada baja', 'Grada media', 'Grada alta'],
    },
    // Pesos relativos de localidades por altura: hipótesis geométrica del juego,
    // NO aforos oficiales por grada. Se pueden sustituir por valores contrastados.
    sectorLevelWeights: {
      tribuna: [0.43, 0.23, 0.34], preferencia: [0.53, 0.47],
      norte: [0.42, 0.24, 0.34], sur: [0.42, 0.24, 0.34],
    },
    structureStatus: 'documented',
    source: 'https://www.atleticodemadrid.com/noticias/el-riyadh-air-metropolitano-sigue-creciendo-para-ofrecer-una-mejor-experiencia-a-nuestros-aficionados',
    structureSource: 'https://www.atleticodemadrid.com/noticias/el-civitas-metropolitano-un-estadio-libre-de-humos',
  },
  barcelona: {
    capacity: 62652,
    plan: 'campnou',
    wikiTitle: 'Camp Nou',
    plannedCapacity: 105000,
    levels: ['Primera gradería', 'Segunda gradería'],
    sectorLevelWeights: {
      tribuna: [0.57, 0.43], preferencia: [0.57, 0.43],
      norte: [0.57, 0.43], sur: [0.57, 0.43],
    },
    plannedLevels: 3,
    structureStatus: 'documented',
    note: 'Aforo operativo limitado por las obras; la tercera gradería no está abierta.',
    source: 'https://www.fcbarcelona.es/es/noticias/4465846/comunicado-del-fc-barcelona',
    structureSource: 'https://www.fcbarcelona.es/es/club/instalaciones/spotify-camp-nou',
  },
  realmadrid: {
    plan: 'bernabeu',
    wikiTitle: 'Estadio Santiago Bernabéu',
    levels: ['Grada y tribuna', 'Primer anfiteatro', 'Segundo anfiteatro', 'Tercer anfiteatro', 'Cuarto anfiteatro'],
    sectorLevelWeights: {
      tribuna: [0.30, 0.23, 0.19, 0.16, 0.12], preferencia: [0.30, 0.23, 0.19, 0.16, 0.12],
      norte: [0.30, 0.23, 0.19, 0.16, 0.12], sur: [0.30, 0.23, 0.19, 0.16, 0.12],
    },
    amphitheaters: 4,
    structureStatus: 'documented',
    structureSource: 'https://www.realmadrid.com/es-ES/area-vip/partido-vip/matchday-grada',
  },
  athletic: {
    plan: 'sanmames',
    wikiTitle: 'Estadio de San Mamés (2013)',
    levels: ['Grada baja', 'Grada alta'],
    sectorLevelWeights: {
      tribuna: [0.59, 0.41], preferencia: [0.59, 0.41],
      norte: [0.59, 0.41], sur: [0.59, 0.41],
    },
    structureStatus: 'documented',
    structureSource: 'https://www.athletic-club.eus/noticias/2022/12/29/entrenamiento-con-aficion-en-san-mames/',
  },
});

// Liga 2026/27: capacidades publicadas por la propia Premier League (26-09-2026).
// Tiene prioridad sobre cifras anteriores del catálogo y sobre P1083 de Wikidata.
const PREMIER_CAPACITIES = Object.freeze({
  arsenal: 60704, astonvilla: 36887, bournemouth: 12357, brentford: 17250,
  brighton: 32176, chelsea: 40044, coventry: 32609, crystalpalace: 25194,
  everton: 52769, fulham: 28107, hull: 24983, ipswich: 30294,
  leeds: 37633, liverpool: 61276, mancity: 61038, manutd: 74158,
  newcastle: 52729, nottingham: 31212, sunderland: 48095, tottenham: 62850,
});
const PREMIER_STADIUM_SOURCE = 'https://www.premierleague.com/en/news/4725666/all-you-need-to-know-about-the-20-premier-league-stadiums/';
// Cifras de los perfiles de club/estadio de Lega Serie A (temporada actual).
const SERIE_A_CAPACITIES = Object.freeze({
  atalanta: [23439, 'atalanta'], como: [12370, 'como'], fiorentina: [24786, 'fiorentina'],
  juventus: [41507, 'juventus'], lecce: [30706, 'lecce'],
  acmilan: [75725, 'milan'], inter: [75725, 'inter'],
  roma: [69689, 'roma'], lazio: [69689, 'lazio'], napoli: [54732, 'napoli'],
});

// Estas cinco zonas son comerciales (precios), no nombres de anfiteatros.
// Se pueden sustituir por asientos reales mediante structure.sectorCapacities.
export const STADIUM_SECTOR_DISTRIBUTION = Object.freeze({
  vip: 0.03,
  tribuna: 0.26,
  preferencia: 0.32,
  norte: 0.20,
  sur: 0.19,
});

// Cuando no hay planos fiables dividimos el aforo en franjas visuales de tamaño
// proporcional. NO equivalen a anfiteatros construidos ni se anuncian como tales.
export function estimatedStadiumBands(capacity) {
  const seats = Math.max(0, Number(capacity) || 0);
  if (seats >= 45000) return { levels: ['Franja inferior (estimada)', 'Franja media (estimada)', 'Franja superior (estimada)'], weights: [0.47, 0.31, 0.22] };
  if (seats >= 18000) return { levels: ['Franja inferior (estimada)', 'Franja superior (estimada)'], weights: [0.64, 0.36] };
  return { levels: ['Graderío (sin alturas verificadas)'], weights: [1] };
}

/** Una ficha por club, lista para ampliarse con sectores y aforos oficiales. */
export function createStadiumRecord(clubBase) {
  const italian = SERIE_A_CAPACITIES[clubBase.id];
  const catalog = STADIUM_CATALOG[clubBase.id] || null;
  // Las gradas se pueden definir declarativamente en catalog[id].structure;
  // el generador SVG no necesita archivos independientes para cada estadio.
  const profile = { ...(italian ? { capacity: italian[0],
    source: `https://www.legaseriea.it/team/${italian[1]}/stadium` } : {}),
  ...(PREMIER_CAPACITIES[clubBase.id] ?
    { capacity: PREMIER_CAPACITIES[clubBase.id], source: PREMIER_STADIUM_SOURCE } : {}),
  ...(catalog?.structure || {}),
  ...(STADIUM_PROFILES[clubBase.id] || {}) };
  const genericStadium = String(clubBase.stadiumName || '').startsWith('Estadio de ');
  const knownVenue = !!catalog?.name && (genericStadium || catalog.homeVenueVerified);
  const capacity = profile.capacity ?? (catalog?.sourceType === 'official' && catalog?.capacity
    ? catalog.capacity : genericStadium && catalog?.capacity ? catalog.capacity : clubBase.capacity);
  const estimated = estimatedStadiumBands(capacity);
  return {
    name: knownVenue ? catalog.name : clubBase.stadiumName,
    capacity,
    capacityStatus: profile.capacity || (catalog?.sourceType === 'official' && catalog?.capacity) ? 'official'
      : catalog?.sourceType === 'reference' && catalog.capacity === capacity ? 'reference'
        : catalog?.venueId && catalog?.capacity === capacity ? 'wikidata'
      : genericStadium ? 'provisional' : 'catalog',
    plannedCapacity: profile.plannedCapacity ?? null,
    structure: {
      levels: profile.levels ? [...profile.levels] : [...estimated.levels],
      sectorLevels: profile.sectorLevels ? structuredClone(profile.sectorLevels)
        : profile.stands ? Object.fromEntries(Object.entries(profile.stands).map(([sector, stand]) =>
          [sector, (stand.levels || []).map(level => typeof level === 'string' ? level : level.name)])) : null,
      sectorLevelWeights: profile.sectorLevelWeights ? structuredClone(profile.sectorLevelWeights)
        : profile.stands ? Object.fromEntries(Object.entries(profile.stands).map(([sector, stand]) =>
          [sector, (stand.levels || []).map(level => typeof level === 'string' ? 1 : level.weight ?? 1)]))
          : Object.fromEntries(['tribuna', 'preferencia', 'norte', 'sur'].map(sector => [sector, [...estimated.weights]])),
      // stands permite modelar una tribuna de un solo nivel, una esquina abierta
      // o un fondo con dos alturas sin preparar un SVG exclusivo para el club.
      stands: profile.stands ? structuredClone(profile.stands) : null,
      wikiTitle: profile.wikiTitle || null,
      venueId: catalog?.venueId || null,
      photo: catalog?.photo || null,
      amphitheaters: profile.amphitheaters ?? null,
      plannedLevels: profile.plannedLevels ?? null,
      status: profile.structureStatus || 'modelled',
      note: profile.note || 'Las franjas y sus aforos se estiman; la distribución física de anfiteatros aún no está verificada.',
      sectorShares: { ...STADIUM_SECTOR_DISTRIBUTION, ...(profile.sectorShares || {}) },
      sectorCapacities: null, // Futuro: { vip: plazas, tribuna: plazas, ... } con fuente contrastada.
      sectorConstraints: profile.sectorConstraints ? { ...profile.sectorConstraints } : null,
      allocationStatus: 'estimated',
      plan: profile.plan || null,
      source: profile.source || catalog?.source || null,
      structureSource: profile.structureSource || null,
    },
  };
}

/** En partidas antiguas puede faltar structure; completar sin alterar el aforo guardado. */
export function getStadiumStructure(club) {
  const baseline = createStadiumRecord({ id: club?.id, stadiumName: club?.stadium?.name,
    capacity: club?.stadium?.capacity }).structure;
  if (club?.stadium?.structure) {
    // Las partidas previas a los planos SVG mantienen su ficha, pero reciben
    // los metadatos nuevos sin modificar sus tarifas, aforo o ajustes guardados.
    const saved = club.stadium.structure;
    return { ...baseline, ...saved,
      levels: saved.levels?.length ? saved.levels : baseline.levels,
      plan: saved.plan || baseline.plan,
      sectorLevels: saved.sectorLevels || baseline.sectorLevels,
      sectorLevelWeights: saved.sectorLevelWeights || baseline.sectorLevelWeights,
      stands: saved.stands || baseline.stands,
      wikiTitle: saved.wikiTitle || baseline.wikiTitle,
      venueId: baseline.venueId || saved.venueId,
      photo: baseline.photo || saved.photo,
      status: saved.status === 'pending' ? baseline.status : saved.status,
      source: saved.source || baseline.source,
    };
  }
  return baseline;
}
