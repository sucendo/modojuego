'use strict';
/* HEXATEGOS ATLAS 0.39.7 · pasos marítimos e islas.
 * Nunca desplaza territorios ni pinta agua o puentes ficticios.
 * Los rótulos de estrechos requieren realmente un hexágono marítimo
 * en su posición. Las islas pequeñas se omiten si L8 no las contiene.
 */
(function(){
 const straits=[{"name":"Kattegat","center":[11.35,57.55],"minZoom":5.8,"rank":79},{"name":"Skagerrak","center":[8.6,58.45],"minZoom":6.5,"rank":70},{"name":"Pequeño Belt","center":[9.87,55.5],"minZoom":10.8,"rank":57},{"name":"Gran Belt","center":[10.94,55.62],"minZoom":9.2,"rank":63},{"name":"Øresund","center":[12.68,55.88],"minZoom":9.5,"rank":66},{"name":"Limfjord","center":[9.48,56.93],"minZoom":10.5,"rank":54},{"name":"Cinturón de Fehmarn","center":[11.38,54.57],"minZoom":10.7,"rank":53},{"name":"Canal de la Mancha","center":[-2.3,49.89],"minZoom":5.9,"rank":83},{"name":"Paso de Calais","center":[1.48,51.06],"minZoom":9.8,"rank":59},{"name":"Estrecho de Gibraltar","center":[-5.55,35.98],"minZoom":9.2,"rank":65},{"name":"Estrecho de Mesina","center":[15.59,38.24],"minZoom":10.8,"rank":58},{"name":"Bósforo","center":[29.04,41.1],"minZoom":11,"rank":65},{"name":"Dardanelos","center":[26.41,40.17],"minZoom":10.6,"rank":62},{"name":"Estrecho de Otranto","center":[18.75,40.35],"minZoom":9.7,"rank":60},{"name":"Estrecho de Bonifacio","center":[9.23,41.25],"minZoom":10,"rank":57},{"name":"Estrecho de Kerch","center":[36.58,45.35],"minZoom":10.3,"rank":58},{"name":"Mar de Åland","center":[19.55,60.1],"minZoom":8,"rank":62},{"name":"Golfo de Finlandia","center":[26.4,59.55],"minZoom":6.4,"rank":76},{"name":"Golfo de Botnia","center":[20.5,63],"minZoom":6.8,"rank":70}];
 const islands=[{"name":"Fionia","center":[10.34,55.37],"minZoom":8.4,"rank":78},{"name":"Selandia","center":[11.93,55.6],"minZoom":8.4,"rank":78},{"name":"Lolland","center":[11.47,54.77],"minZoom":11.8,"rank":55},{"name":"Falster","center":[11.93,54.83],"minZoom":12,"rank":54},{"name":"Møn","center":[12.38,54.96],"minZoom":12.5,"rank":52},{"name":"Bornholm","center":[14.92,55.14],"minZoom":10.1,"rank":61},{"name":"Islas Feroe","center":[-6.9,62],"minZoom":9,"rank":58},{"name":"Islas Åland","center":[20.17,60.16],"minZoom":9.4,"rank":62},{"name":"Gotland","center":[18.52,57.51],"minZoom":9.1,"rank":61},{"name":"Öland","center":[16.65,56.77],"minZoom":10.1,"rank":58},{"name":"Sicilia","center":[14.1,37.52],"minZoom":7.8,"rank":72},{"name":"Córcega","center":[9.1,42.18],"minZoom":8.3,"rank":70},{"name":"Cerdeña","center":[9.07,40.1],"minZoom":8.3,"rank":70},{"name":"Creta","center":[24.85,35.28],"minZoom":8.1,"rank":67},{"name":"Eubea","center":[23.84,38.58],"minZoom":11.5,"rank":54}];
 const areas=[{"name":"Islas danesas","center":[10.81,55.55],"minZoom":6.1,"rank":94},{"name":"Archipiélago danés","center":[11.35,55.3],"minZoom":9.7,"rank":81}];
 // Accidentes marítimos documentados por la geometría 50m (nunca trazos fluviales).
 const marine=[{"name":"Golfo de Corinto","center":[22.65,38.26],"minZoom":9,"rank":80},{"name":"Golfo de Patras","center":[21.52,38.23],"minZoom":9.4,"rank":68},{"name":"Golfo Sarónico","center":[23.46,37.7],"minZoom":9.4,"rank":64},{"name":"Golfo de Tesalónica","center":[22.75,40.27],"minZoom":10.1,"rank":61},{"name":"Golfo de Tarento","center":[17.5,40.3],"minZoom":8,"rank":65},{"name":"Golfo de León","center":[4,42.9],"minZoom":7,"rank":74},{"name":"Golfo de Venecia","center":[12.4,45.25],"minZoom":8.5,"rank":64},{"name":"Ría de Vigo","center":[-8.81,42.24],"minZoom":12.3,"rank":65},{"name":"Ría de Pontevedra","center":[-8.86,42.4],"minZoom":13.8,"rank":58},{"name":"Ría de Arousa","center":[-8.89,42.58],"minZoom":12.3,"rank":63},{"name":"Ría de Muros y Noia","center":[-9.05,42.77],"minZoom":13.5,"rank":57},{"name":"Ría de Ferrol","center":[-8.25,43.47],"minZoom":15,"rank":49},{"name":"Ría de A Coruña","center":[-8.4,43.38],"minZoom":15,"rank":48},{"name":"Ría de Ribadeo","center":[-7.04,43.55],"minZoom":15,"rank":47},{"name":"Estuario del Gironda","center":[-1.15,45.53],"minZoom":11,"rank":61},{"name":"Bahía del Mont-Saint-Michel","center":[-1.52,48.65],"minZoom":10.5,"rank":58},{"name":"Golfo de Morbihan","center":[-2.75,47.56],"minZoom":14,"rank":48},{"name":"Fiordo de Forth","center":[-3,56.02],"minZoom":11.5,"rank":55},{"name":"Fiordo de Clyde","center":[-4.9,55.9],"minZoom":11.5,"rank":56},{"name":"Estuario del Támesis","center":[0.7,51.52],"minZoom":11,"rank":55},{"name":"Estuario del Severn","center":[-3.1,51.56],"minZoom":12.5,"rank":53},{"name":"Estuario del Humber","center":[-0.25,53.59],"minZoom":12.5,"rank":52},{"name":"Milford Haven","center":[-5,51.7],"minZoom":13.8,"rank":49},{"name":"Fiordo de Oslo","center":[10.58,59.6],"minZoom":10.9,"rank":59},{"name":"Sognefjord","center":[6.35,61.1],"minZoom":12,"rank":58},{"name":"Hardangerfjord","center":[6.2,60.1],"minZoom":13,"rank":52},{"name":"Geirangerfjord","center":[7.2,62.13],"minZoom":15,"rank":48},{"name":"Trondheimsfjord","center":[10.2,63.5],"minZoom":12,"rank":54},{"name":"Golfo de Riga","center":[23.4,57.5],"minZoom":7.9,"rank":71},{"name":"Liman del Dniéster","center":[30.3,46.08],"minZoom":14,"rank":49}];
 const features=[
  ...straits.map(f=>({...f,kind:'strait'})),
  ...islands.map(f=>({...f,kind:'island'})),
  ...areas.map(f=>({...f,kind:'archipelago'})),
  ...marine.map(f=>({...f,kind:'marine'}))
 ];
 const confirmed=new Map();
 function valid(feature){
  if(feature.kind==='archipelago')return true;
  if(confirmed.has(feature.name))return confirmed.get(feature.name);
  // Prefiere la costa independiente para los nombres que L8 no puede ubicar:
  // no hace navegables esos canales ni cambia la clasificación del hexágono.
  const neLand=window.HexategosAtlasCoast0399?.landAt?.(feature.center[0],feature.center[1]);
  if(neLand!==null&&neLand!==undefined){
   const ok=feature.kind==='island'?neLand:!neLand;
   confirmed.set(feature.name,ok);
   return ok;
  }
  if(typeof nearestDetailed!=='function'||typeof loadLevel!=='function')return false;
  const [lon,lat]=feature.center,v=lonLatVec(lon,lat);
  const i=nearestDetailed({x:v[0],y:v[1],z:v[2]});
  const L=loadLevel('8'),land=i>=0?L.land[i]:null;
  // Etiquetas geográficas solo si el terreno representado lo permite.
  const ok=land!==null&&(feature.kind==='strait'?land<0:land>=0);
  confirmed.set(feature.name,ok);
  return ok;
 }
 window.HexategosAtlasStraits0397=Object.freeze({
  version:'0.39.9',features,valid,
  diagnostics:()=>features.map(f=>({name:f.name,kind:f.kind,
    valid:confirmed.has(f.name)?confirmed.get(f.name):null}))
 });
})();