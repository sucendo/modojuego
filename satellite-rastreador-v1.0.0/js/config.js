export const APP_VERSION = '1.0.0';
export const STORAGE_PREFIX = 'satelliteRastreador.v2';
export const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php';
export const CELESTRAK_SATCAT_BASE = 'https://celestrak.org/satcat/records.php';
export const CELESTRAK_CACHE_MS = 2 * 60 * 60 * 1000;
export const WEATHER_CACHE_MS = 10 * 60 * 1000;
export const EARTH_RADIUS_KM = 6371.0;
export const EARTH_MU_KM3_S2 = 398600.4418;
export const DEFAULTS = Object.freeze({
  baseMap: 'osm',
  trackMinutes: 60,
  minElevationDeg: 10,
  mapLabels: true,
  terminator: true,
  radar: true,
  clouds: true,
  footprints: true,
  lowPower: false,
  panelCollapsed: false,
  timeControlsVisible: false,
  mobileDockVisible: true
});
export const CATALOG_GROUPS = Object.freeze({
  stations: 'Estaciones espaciales',
  visual: '100 más brillantes',
  weather: 'Meteorológicos',
  resource: 'Observación de la Tierra',
  'gps-ops': 'GPS operativos',
  galileo: 'Galileo',
  amateur: 'Radioafición',
  science: 'Científicos',
  starlink: 'Starlink'
});
