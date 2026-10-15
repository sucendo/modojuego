'use strict';
/* Hexategos Atlas 0.40.6 — Himalaya, Karakórum y Tíbet.
 * Referencias geográficas aproximadas [longitud, latitud]; no modifican
 * costa, L.land, propietario, geología, recursos ni partidas guardadas.
 * Las cadenas principales ya están en MOUNTAIN_NETWORKS3242.
 */
(function(){
 const mountains=[
  {name:'Himalaya occidental',points:[[73.0,34.4],[75.3,33.2],[77.6,32.0],[79.6,30.3]],minZoom:7.1,elevationM:6500,canonicalParent:'Himalaya'},
  {name:'Himalaya central',points:[[79.6,30.3],[82.0,29.5],[84.4,28.7],[87.5,27.9]],minZoom:7.1,elevationM:8000,canonicalParent:'Himalaya'},
  {name:'Himalaya oriental',points:[[87.5,27.9],[90.1,27.5],[92.5,27.9],[95.7,28.8]],minZoom:7.1,elevationM:7000,canonicalParent:'Himalaya'},
  {name:'Karakórum',points:[[73.7,36.3],[75.7,35.9],[77.4,35.6],[79.5,35.4]],minZoom:7.4,elevationM:8200,canonicalParent:'Karakórum'},
  {name:'Hindu Kush oriental',points:[[69.8,35.1],[71.1,35.7],[72.8,36.1],[74.0,36.1]],minZoom:8.2,elevationM:6500,canonicalParent:'Hindu Kush'},
  {name:'Cordillera de Ladakh',points:[[75.5,34.5],[77.1,34.3],[79.1,33.8],[80.4,33.3]],minZoom:8.4,elevationM:6100},
  {name:'Cordillera de Zanskar',points:[[75.6,33.6],[77.7,33.2],[79.5,32.6]],minZoom:8.8,elevationM:6400},
  {name:'Transhimalaya',points:[[80.0,32.0],[83.0,31.8],[86.0,31.7],[88.9,31.5]],minZoom:8.0,elevationM:6200},
  {name:'Kunlun occidental',points:[[75.9,36.8],[78.4,36.8],[80.5,36.5],[83.4,36.5]],minZoom:8.1,elevationM:7100,canonicalParent:'Kunlun'},
  {name:'Kunlun central',points:[[83.4,36.5],[86.0,36.7],[88.8,36.5],[91.2,36.7]],minZoom:8.1,elevationM:6500,canonicalParent:'Kunlun'},
  {name:'Pir Panjal',points:[[73.9,34.0],[75.1,33.7],[76.5,33.2]],minZoom:9,elevationM:4600},
  {name:'Siwalik occidental',points:[[74.0,31.2],[76.0,30.7],[78.0,30.1],[80.2,29.5]],minZoom:9.2,elevationM:2000},
  {name:'Nyenchen Tanglha',points:[[88.6,30.8],[90.5,30.6],[92.2,30.3]],minZoom:9,elevationM:7100}
 ];
 // Los grandes cauces canónicos NO se vuelven a dibujar. Estos ejes
 // contienen cabeceras para la próxima fase Indo–Ganges–Brahmaputra.
 const headwaters=[
  {name:'Cabeceras del Indo',river:'Indo',points:[[81.3,31.2],[79.2,32.0],[76.7,34.0],[74.3,35.5]],canonical:true},
  {name:'Cabeceras del Ganges',river:'Ganges',points:[[79.1,30.9],[78.9,30.7],[78.5,30.3],[78.0,29.8]],canonical:true},
  {name:'Yarlung Tsangpo alto',river:'Brahmaputra',points:[[82.3,30.6],[85.0,29.8],[88.0,29.3],[91.1,29.1]],canonical:true},
  {name:'Sutlej alto',river:'Sutlej',points:[[81.5,30.7],[80.3,31.1],[78.5,31.7],[76.8,31.4]],canonical:false},
  {name:'Yamuna alta',river:'Yamuna',points:[[78.5,31.0],[77.9,30.7],[77.5,30.2]],canonical:true},
  {name:'Ghaghara / Karnali alto',river:'Karnali',points:[[81.8,30.1],[81.5,29.7],[81.0,28.8]],canonical:false},
  {name:'Teesta alta',river:'Teesta',points:[[88.7,28.0],[88.5,27.5],[88.4,27.0]],canonical:false}
 ];
 // Lago visual (no navegable) si L8 carece de agua nativa. Las elipses
 // sirven solo para seleccionar centros de hexágonos; nunca son costas GIS.
 const waterBodies=[
  {name:'Pangong Tso',displayName:'Pangong Tso',components:[[78.65,33.75,.84,.19]],minZoom:8.1,kind:'inland'},
  {name:'Tso Moriri',displayName:'Tso Moriri',components:[[78.33,32.92,.24,.22]],minZoom:9.2,kind:'inland'},
  {name:'Manasarovar',displayName:'Lago Manasarovar',components:[[81.46,30.66,.23,.22]],minZoom:9,kind:'inland'},
  {name:'Rakshastal',displayName:'Lago Rakshastal',components:[[81.20,30.72,.23,.22]],minZoom:9.2,kind:'inland'},
  {name:'Yamdrok',displayName:'Lago Yamdrok',components:[[90.72,28.94,.43,.27]],minZoom:8.9,kind:'inland'},
  {name:'Namtso',displayName:'Lago Namtso',components:[[90.65,30.72,.50,.25]],minZoom:8.0,kind:'inland'}
 ];
 const reliefRegions=[
  {name:'Llanura Indogangética occidental',center:[76.5,29.0],radii:[4.4,1.7],minZoom:7.3,priority:78},
  {name:'Llanura del Ganges',center:[82.3,26.4],radii:[6.5,1.9],minZoom:6.6,priority:79},
  {name:'Valle de Cachemira',center:[74.9,34.1],radii:[1.2,.55],minZoom:9.2,priority:88},
  {name:'Meseta del Tíbet',center:[86.6,33.5],radii:[10.5,3.1],minZoom:6.3,priority:91},
  {name:'Altiplano tibetano meridional',center:[85.4,31.4],radii:[6.8,1.65],minZoom:8.0,priority:79},
  {name:'Desierto de Thar',center:[71.6,26.3],radii:[2.8,2.0],minZoom:8.2,priority:77},
  {name:'Punjab',center:[73.5,30.8],radii:[2.5,2.2],minZoom:7.7,priority:75},
  {name:'Pie de monte himalayo',center:[82.8,27.9],radii:[10.2,.82],minZoom:8.3,priority:77},
  {name:'Valle de Nepal',center:[85.3,27.7],radii:[1.05,.42],minZoom:9.8,priority:84},
  {name:'Valle del Brahmaputra superior',center:[88.6,29.3],radii:[6.3,.75],minZoom:8.8,priority:81},
  {name:'Llanura de Assam',center:[93.2,26.4],radii:[3.2,.88],minZoom:8.1,priority:77},
  {name:'Decán septentrional',center:[76.8,20.8],radii:[5.5,1.9],minZoom:9.3,priority:63}
 ];
 const macro=[
  {name:'Tíbet occidental',lon:81.5,lat:33.6,kind:'region',minZoom:4.3,maxZoom:7.0,priority:73},
  {name:'Tíbet central',lon:88.0,lat:33.4,kind:'region',minZoom:4.3,maxZoom:7.0,priority:73}
 ];
 const bounds=Object.freeze({west:67,east:100,south:20,north:40.5});
 function contains(body,lon,lat){
  return body.components.some(([x,y,rx,ry])=>{
   const a=(lon-x)/rx,b=(lat-y)/ry;return a*a+b*b<=1;
  });
 }
 function bodyAt(lon,lat){
  if(lon<77.4||lon>91.5||lat<28.5||lat>34.1)return null;
  return waterBodies.find(b=>contains(b,lon,lat))||null;
 }
 function regionsNear(lon,lat){
  return reliefRegions.filter(r=>{
   const a=(lon-r.center[0])/r.radii[0],b=(lat-r.center[1])/r.radii[1];
   return a*a+b*b<=1;
  }).sort((a,b)=>b.priority-a.priority);
 }
 const canonical=Object.freeze({mountains:['Himalaya','Karakórum','Hindu Kush','Kunlun'],
  rivers:['Indo','Ganges','Brahmaputra','Yamuna']});
 window.HexategosHimalayaPhysical0406=Object.freeze({
  version:'0.40.6',bounds,mountains,headwaters,rivers:[],macro,
  waterBodies,reliefRegions,canonical,contains,bodyAt,regionsNear
 });
})();