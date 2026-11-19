// Fichas de estadios 2026/27. El aforo operativo y la estructura no son lo mismo:
// un estadio en obras puede disponer de menos localidades y niveles abiertos.
// Los niveles indicados como documentados proceden de fuentes del propio club.
// Los repartos de asientos por zonas/alturas son estimaciones del simulador hasta
// contar con un plano de aforo desglosado; nunca se anuncian como cifras oficiales.

const STADIUM_PROFILES = Object.freeze({
  atletico: {
    capacity: 70813,
    levels: ['Grada baja', 'Grada media', 'Grada alta'],
    sectorLevels: {
      tribuna: ['Grada baja', 'Grada media', 'Grada alta'],
      preferencia: ['Grada baja', 'Grada alta'],
      norte: ['Grada baja', 'Grada media', 'Grada alta'],
      sur: ['Grada baja', 'Grada media', 'Grada alta'],
    },
    structureStatus: 'documented',
    source: 'https://www.atleticodemadrid.com/noticias/el-riyadh-air-metropolitano-sigue-creciendo-para-ofrecer-una-mejor-experiencia-a-nuestros-aficionados',
    structureSource: 'https://www.atleticodemadrid.com/noticias/el-civitas-metropolitano-un-estadio-libre-de-humos',
  },
  barcelona: {
    capacity: 62652,
    plannedCapacity: 105000,
    levels: ['Primera gradería', 'Segunda gradería'],
    plannedLevels: 3,
    structureStatus: 'documented',
    note: 'Aforo operativo limitado por las obras; la tercera gradería no está abierta.',
    source: 'https://www.fcbarcelona.es/es/noticias/4465846/comunicado-del-fc-barcelona',
    structureSource: 'https://www.fcbarcelona.es/es/club/instalaciones/spotify-camp-nou',
  },
  realmadrid: {
    levels: ['Grada y tribuna', 'Primer anfiteatro', 'Segundo anfiteatro', 'Tercer anfiteatro', 'Cuarto anfiteatro'],
    amphitheaters: 4,
    structureStatus: 'documented',
    structureSource: 'https://www.realmadrid.com/es-ES/area-vip/partido-vip/matchday-grada',
  },
  athletic: {
    levels: ['Grada baja', 'Grada alta'],
    structureStatus: 'documented',
    structureSource: 'https://www.athletic-club.eus/noticias/2022/12/29/entrenamiento-con-aficion-en-san-mames/',
  },
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

/** Una ficha por club, lista para ampliarse con sectores y aforos oficiales. */
export function createStadiumRecord(clubBase) {
  const profile = STADIUM_PROFILES[clubBase.id] || {};
  const genericStadium = String(clubBase.stadiumName || '').startsWith('Estadio de ');
  return {
    name: clubBase.stadiumName,
    capacity: profile.capacity ?? clubBase.capacity,
    capacityStatus: profile.capacity ? 'official' : genericStadium ? 'provisional' : 'catalog',
    plannedCapacity: profile.plannedCapacity ?? null,
    structure: {
      levels: profile.levels ? [...profile.levels] : [],
      sectorLevels: profile.sectorLevels ? structuredClone(profile.sectorLevels) : null,
      amphitheaters: profile.amphitheaters ?? null,
      plannedLevels: profile.plannedLevels ?? null,
      status: profile.structureStatus || 'pending',
      note: profile.note || '',
      sectorShares: { ...STADIUM_SECTOR_DISTRIBUTION },
      sectorCapacities: null, // Futuro: { vip: plazas, tribuna: plazas, ... } con fuente contrastada.
      allocationStatus: 'estimated',
      source: profile.source || null,
      structureSource: profile.structureSource || null,
    },
  };
}

/** En partidas antiguas puede faltar structure; completar sin alterar el aforo guardado. */
export function getStadiumStructure(club) {
  if (club?.stadium?.structure) return club.stadium.structure;
  return createStadiumRecord({ id: club?.id, stadiumName: club?.stadium?.name, capacity: club?.stadium?.capacity }).structure;
}
