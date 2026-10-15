'use strict';
/* HEXATEGOS ATLAS 0.39.7 · pasos marítimos e islas.
 * Nunca desplaza territorios ni pinta agua o puentes ficticios.
 * Los rótulos de estrechos requieren realmente un hexágono marítimo
 * en su posición. Las islas pequeñas se omiten si L8 no las contiene.
 */
(function(){
 const straits=[{"name":"Kattegat","center":[11.35,57.55],"minZoom":5.8,"rank":79},{"name":"Skagerrak","center":[8.6,58.45],"minZoom":6.5,"rank":70},{"name":"Pequeño Belt","center":[9.87,55.5],"minZoom":10.8,"rank":57},{"name":"Gran Belt","center":[10.94,55.62],"minZoom":9.2,"rank":63},{"name":"Øresund","center":[12.68,55.88],"minZoom":9.5,"rank":66},{"name":"Limfjord","center":[9.48,56.93],"minZoom":10.5,"rank":54},{"name":"Cinturón de Fehmarn","center":[11.38,54.57],"minZoom":10.7,"rank":53},{"name":"Canal de la Mancha","center":[-2.3,49.89],"minZoom":5.9,"rank":83},{"name":"Paso de Calais","center":[1.48,51.06],"minZoom":9.8,"rank":59},{"name":"Estrecho de Gibraltar","center":[-5.55,35.98],"minZoom":9.2,"rank":65},{"name":"Estrecho de Mesina","center":[15.59,38.24],"minZoom":10.8,"rank":58},{"name":"Bósforo","center":[29.04,41.1],"minZoom":11,"rank":65},{"name":"Dardanelos","center":[26.41,40.17],"minZoom":10.6,"rank":62},{"name":"Estrecho de Otranto","center":[18.75,40.35],"minZoom":9.7,"rank":60},{"name":"Estrecho de Bonifacio","center":[9.23,41.25],"minZoom":10,"rank":57},{"name":"Estrecho de Kerch","center":[36.58,45.35],"minZoom":10.3,"rank":58},{"name":"Mar de Åland","center":[19.55,60.1],"minZoom":8,"rank":62},{"name":"Golfo de Finlandia","center":[26.4,59.55],"minZoom":6.4,"rank":76},{"name":"Golfo de Botnia","center":[20.5,63],"minZoom":6.8,"rank":70}];
 const islands=[{"name":"Fionia","center":[10.34,55.37],"minZoom":8.4,"rank":78},{"name":"Selandia","center":[11.93,55.6],"minZoom":8.4,"rank":78},{"name":"Lolland","center":[11.47,54.77],"minZoom":11.8,"rank":55},{"name":"Falster","center":[11.93,54.83],"minZoom":12,"rank":54},{"name":"Møn","center":[12.38,54.96],"minZoom":12.5,"rank":52},{"name":"Bornholm","center":[14.92,55.14],"minZoom":10.1,"rank":61},{"name":"Islas Feroe","center":[-6.9,62],"minZoom":9,"rank":58},{"name":"Islas Åland","center":[20.17,60.16],"minZoom":9.4,"rank":62},{"name":"Gotland","center":[18.52,57.51],"minZoom":9.1,"rank":61},{"name":"Öland","center":[16.65,56.77],"minZoom":10.1,"rank":58},{"name":"Sicilia","center":[14.1,37.52],"minZoom":7.8,"rank":72},{"name":"Córcega","center":[9.1,42.18],"minZoom":8.3,"rank":70},{"name":"Cerdeña","center":[9.07,40.1],"minZoom":8.3,"rank":70},{"name":"Creta","center":[24.85,35.28],"minZoom":8.1,"rank":67},{"name":"Eubea","center":[23.84,38.58],"minZoom":11.5,"rank":54}];
 const areas=[{"name":"Islas danesas","center":[10.81,55.55],"minZoom":6.1,"rank":94},{"name":"Archipiélago danés","center":[11.35,55.3],"minZoom":6.7,"rank":81}];
 const features=[
  ...straits.map(f=>({...f,kind:'strait'})),
  ...islands.map(f=>({...f,kind:'island'})),
  ...areas.map(f=>({...f,kind:'archipelago'}))
 ];
 const confirmed=new Map();
 function valid(feature){
  if(feature.kind==='archipelago')return true;
  if(confirmed.has(feature.name))return confirmed.get(feature.name);
  if(typeof nearestDetailed!=='function'||typeof loadLevel!=='function')return false;
  const [lon,lat]=feature.center,v=lonLatVec(lon,lat);
  const i=nearestDetailed({x:v[0],y:v[1],z:v[2]});
  const L=loadLevel('8'),land=i>=0?L.land[i]:null;
  // Etiquetas geográficas solo si el terreno representado lo permite.
  const ok=feature.kind==='strait'?land<0:land>=0;
  confirmed.set(feature.name,ok);
  return ok;
 }
 window.HexategosAtlasStraits0397=Object.freeze({
  version:'0.39.7',features,valid,
  diagnostics:()=>features.map(f=>({name:f.name,kind:f.kind,
    valid:confirmed.has(f.name)?confirmed.get(f.name):null}))
 });
})();