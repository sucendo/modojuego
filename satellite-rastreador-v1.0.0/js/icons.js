export const SATELLITE_ICONS = Object.freeze([
  {key:'iss',label:'Estación espacial'},
  {key:'sat1',label:'Satélite clásico 1'},
  {key:'sat2',label:'Satélite clásico 2'},
  {key:'sat3',label:'Satélite clásico 3'},
  {key:'sat4',label:'Satélite clásico 4'},
  {key:'sat5',label:'Satélite clásico 5'},
  {key:'sat6',label:'Satélite clásico 6'},
  {key:'sat7',label:'Satélite clásico 7'},
  {key:'sat8',label:'Satélite compacto 1'},
  {key:'sat9',label:'Satélite compacto 2'},
  {key:'sat10',label:'Satélite moderno 1'},
  {key:'sat11',label:'Satélite moderno 2'},
  {key:'sat12',label:'Satélite moderno 3'},
  {key:'sat13',label:'Satélite moderno 4'},
  {key:'sat14',label:'Satélite moderno 5'},
  {key:'sat15',label:'Satélite moderno 6'},
  {key:'sat16',label:'Satélite moderno 7'},
  {key:'sat17',label:'Satélite moderno 8'}
]);

const KEYS=new Set(SATELLITE_ICONS.map(x=>x.key));

export function normalizeSatelliteIcon(key){ return KEYS.has(key)?key:'sat1'; }
export function satelliteIconUrl(key,size=32){ return `./assets/satellite-icons/${size===64?64:32}/${normalizeSatelliteIcon(key)}.png`; }
export function defaultSatelliteIcon(record={}){
  const name=String(record.name||record.OBJECT_NAME||record.omm?.OBJECT_NAME||'').toUpperCase();
  const norad=String(record.noradId??record.NORAD_CAT_ID??record.omm?.NORAD_CAT_ID??'');
  if(norad==='25544'||/\bISS\b|ZARYA|TIANGONG|CSS \(TIANHE\)/.test(name)) return 'iss';
  if(/STARLINK|ONEWEB/.test(name)) return 'sat8';
  if(/GPS|NAVSTAR|GALILEO|GLONASS|BEIDOU/.test(name)) return 'sat9';
  if(/SENTINEL|LANDSAT|METOP|NOAA|SUOMI|TERRA|AQUA/.test(name)) return 'sat11';
  if(/HUBBLE|TELESCOPE|JWST/.test(name)) return 'sat17';
  return 'sat1';
}
