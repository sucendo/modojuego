import { DEFAULTS, LEGACY_STORAGE_PREFIX, STORAGE_PREFIX } from './config.js';

const MIGRATION_FLAG = `${STORAGE_PREFIX}.migration.complete`;

function migrateLegacyStorage(){
  try{
    if(localStorage.getItem(MIGRATION_FLAG)==='1')return;
    const suffixes=['settings','satellites','mapView'];
    for(const suffix of suffixes){
      const currentKey=`${STORAGE_PREFIX}.${suffix}`;
      const legacyKey=`${LEGACY_STORAGE_PREFIX}.${suffix}`;
      if(localStorage.getItem(currentKey)==null){
        const legacy=localStorage.getItem(legacyKey);
        if(legacy!=null)localStorage.setItem(currentKey,legacy);
      }
    }
    // Migra también las entradas de caché conocidas sin tocar ni borrar el namespace anterior.
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!key?.startsWith(`${LEGACY_STORAGE_PREFIX}.cache.`))continue;
      const suffix=key.slice(LEGACY_STORAGE_PREFIX.length+1);
      const target=`${STORAGE_PREFIX}.${suffix}`;
      if(localStorage.getItem(target)==null){
        const legacy=localStorage.getItem(key);
        if(legacy!=null)localStorage.setItem(target,legacy);
      }
    }
    localStorage.setItem(MIGRATION_FLAG,'1');
  }catch{}
}

migrateLegacyStorage();

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
