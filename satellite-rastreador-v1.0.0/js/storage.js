import { DEFAULTS, STORAGE_PREFIX } from './config.js';

function getJson(key, fallback){
  try{ const raw = localStorage.getItem(`${STORAGE_PREFIX}.${key}`); return raw ? JSON.parse(raw) : fallback; }
  catch{ return fallback; }
}
function setJson(key, value){
  try{ localStorage.setItem(`${STORAGE_PREFIX}.${key}`, JSON.stringify(value)); return true; }
  catch{ return false; }
}

export const Storage = {
  loadSettings(){ return {...DEFAULTS, ...getJson('settings', {})}; },
  saveSettings(settings){ return setJson('settings', settings); },
  loadSatellites(){ return getJson('satellites', []); },
  saveSatellites(items){
    const serializable = items.map(s => ({
      id:s.id, name:s.name, noradId:s.noradId ?? null, source:s.source,
      omm:s.omm ?? null, l1:s.l1 ?? null, l2:s.l2 ?? null,
      color:s.color, iconKey:s.iconKey ?? 'sat1', visible:s.visible !== false, favorite:s.favorite !== false
    }));
    return setJson('satellites', serializable);
  },
  loadMapView(){ return getJson('mapView', null); },
  saveMapView(view){ return setJson('mapView', view); },
  getCache(key){ return getJson(`cache.${key}`, null); },
  setCache(key, value){ return setJson(`cache.${key}`, value); },
  clearCache(key){ try{ localStorage.removeItem(`${STORAGE_PREFIX}.cache.${key}`); }catch{} }
};
