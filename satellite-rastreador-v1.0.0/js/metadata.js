const GROUP_FUNCTIONS={
  stations:'Estación espacial / plataforma orbital',
  weather:'Meteorología y observación atmosférica',
  resource:'Observación de la Tierra y recursos',
  'gps-ops':'Navegación y posicionamiento',
  galileo:'Navegación y posicionamiento',
  amateur:'Radioafición y comunicaciones',
  science:'Ciencia e investigación',
  starlink:'Comunicaciones de banda ancha'
};

const TYPE_LABELS={PAY:'Carga útil', 'R/B':'Cuerpo de cohete', DEB:'Desecho espacial', UNK:'Objeto no identificado'};
const ORBIT_LABELS={ORB:'En órbita',LAN:'Aterrizado',IMP:'Impacto',DOC:'Acoplado','R/T':'Ida y vuelta'};
const STATUS_LABELS={'+':'Operativo','-':'No operativo',P:'Parcialmente operativo',B:'Reserva / standby',S:'En espera de activación',X:'Misión extendida',D:'Decaído','?':'Desconocido'};
const OWNER_LABELS={US:'Estados Unidos',ESA:'Agencia Espacial Europea',PRC:'China',CIS:'CEI / antigua URSS',JPN:'Japón',IND:'India',ISRO:'ISRO (India)',UK:'Reino Unido',FR:'Francia',GER:'Alemania',IT:'Italia',SPN:'España',CA:'Canadá',EUME:'EUMETSAT',ISS:'Estación Espacial Internacional',IRID:'Iridium',SES:'SES',O3B:'O3b Networks'};

// Datos físicos curados solo cuando tenemos una cifra inequívoca de una fuente oficial.
// Nunca se estima el diámetro a partir de RCS: la sección radar no equivale al tamaño físico.
const PHYSICAL={
  '25544':{dimensions:'≈109 m de envergadura (paneles solares)',mass:'≈419.7 t',source:'NASA'},
  '20580':{dimensions:'13,2 m largo × 4,3 m diámetro',mass:'≈12.2 t',source:'NASA'}
};

function text(x){return x==null||x===''?null:String(x);}
function num(x){const n=Number(x);return Number.isFinite(n)?n:null;}

export function satelliteFunction(item={}){
  const groups=[...(item._GROUPS||item.APP_GROUPS||[])];
  for(const key of ['stations','weather','resource','gps-ops','galileo','amateur','science','starlink']){
    if(groups.includes(key))return GROUP_FUNCTIONS[key];
  }
  const name=String(item.OBJECT_NAME||item.name||'').toUpperCase();
  if(/ISS|TIANGONG|TIANHE|SPACE STATION/.test(name))return GROUP_FUNCTIONS.stations;
  if(/NOAA|METOP|METEOR|FENGYUN|GOES|HIMAWARI|WEATHER/.test(name))return GROUP_FUNCTIONS.weather;
  if(/SENTINEL|LANDSAT|TERRA|AQUA|EARTH OBS/.test(name))return GROUP_FUNCTIONS.resource;
  if(/GPS|NAVSTAR|GALILEO|GLONASS|BEIDOU/.test(name))return GROUP_FUNCTIONS['gps-ops'];
  if(/STARLINK|ONEWEB/.test(name))return GROUP_FUNCTIONS.starlink;
  if(/HUBBLE|TELESCOPE|JWST|SCIENCE/.test(name))return GROUP_FUNCTIONS.science;
  const type=item._SATCAT?.OBJECT_TYPE||item.OBJECT_TYPE;
  return type==='PAY'?'Carga útil orbital':'Objeto catalogado';
}

export function metadataFor(item={}){
  const s=item._SATCAT||{};
  const norad=String(item.NORAD_CAT_ID??item.noradId??s.NORAD_CAT_ID??'');
  const physical=PHYSICAL[norad]||null;
  return {
    function:satelliteFunction(item),
    objectType:TYPE_LABELS[s.OBJECT_TYPE||item.OBJECT_TYPE]||text(s.OBJECT_TYPE||item.OBJECT_TYPE)||'—',
    owner:OWNER_LABELS[s.OWNER]||(text(s.OWNER)||'—'),
    ownerCode:text(s.OWNER)||null,
    launchDate:text(s.LAUNCH_DATE)||null,
    launchSite:text(s.LAUNCH_SITE)||null,
    decayDate:text(s.DECAY_DATE)||null,
    operationalStatus:STATUS_LABELS[s.OPS_STATUS_CODE]||(text(s.OPS_STATUS_CODE)||null),
    orbitType:ORBIT_LABELS[s.ORBIT_TYPE]||text(s.ORBIT_TYPE)||null,
    orbitCenter:text(s.ORBIT_CENTER)||null,
    rcsM2:num(s.RCS),
    satcatPeriodMin:num(s.PERIOD),
    satcatApogeeKm:num(s.APOGEE),
    satcatPerigeeKm:num(s.PERIGEE),
    physical
  };
}

export function shortCatalogSummary(item={}){
  const m=metadataFor(item),parts=[m.function];
  if(m.owner&&m.owner!=='—')parts.push(m.owner);
  if(m.launchDate)parts.push(m.launchDate.slice(0,4));
  return parts.filter(Boolean).join(' · ');
}
