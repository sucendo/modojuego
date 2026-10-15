'use strict';
/* HEXATEGOS ATLAS 0.40.8 — delta del Indo y delta de Bengala.
 * Sólo instrucciones cartográficas y referencias aproximadas:
 * NO cambian tierras, owner6, navegación, ríos canónicos o guardados.
 * Los canales deben terminar en vértices costeros NATIVOS L8.
 */
(function(){
 const corrections=Object.freeze({
  Panjnad:{at:[70.97,28.93],maxErrorKm:35},
  Kosi:{at:[87.26,25.42],maxErrorKm:35},
  Manas:{at:[90.85,26.30],maxErrorKm:35},
  Teesta:{at:[89.66,25.49],maxErrorKm:35}
 });
 const channels=[
  {name:'Canal oriental del Indo',basin:'Indo',parent:'Indo',
   join:[67.81,24.43],waypoints:[[67.95,24.12]],
   mouth:[67.84,23.87],minZoom:9.2,maxShoreKm:75},
  {name:'Canal occidental del Indo',basin:'Indo',parent:'Indo',
   join:[67.78,24.52],waypoints:[[67.46,24.32]],
   mouth:[67.26,24.42],minZoom:9.4,maxShoreKm:75},
  {name:'Canal de Keti Bandar',basin:'Indo',parent:'Indo',
   join:[67.8,24.37],waypoints:[[67.51,24.10]],
   mouth:[67.43,24.07],minZoom:9.6,maxShoreKm:65},
  {name:'Canal Meghna',basin:'Brahmaputra',parent:'Brahmaputra',
   join:[90.18,23.33],waypoints:[[90.35,23.0]],
   mouth:[90.73,22.65],minZoom:8.8,maxShoreKm:80},
  {name:'Canal Tetulia',basin:'Brahmaputra',parent:'Brahmaputra',
   join:[90.18,23.33],waypoints:[[90.32,22.89]],
   mouth:[90.54,22.36],minZoom:9.6,maxShoreKm:75},
  {name:'Canal del Hugli',basin:'Ganges',parent:'Ganges',
   join:[88.01,22.63],waypoints:[[88.21,22.25]],
   mouth:[88.19,21.86],minZoom:8.5,maxShoreKm:75},
  {name:'Brazo del Sundarbans occidental',basin:'Ganges',parent:'Ganges',
   join:[88.01,22.65],waypoints:[[88.42,22.38],[88.68,22.20]],
   mouth:[88.92,22.06],minZoom:9.8,maxShoreKm:80},
  {name:'Brazo del delta del Ganges',basin:'Ganges',parent:'Ganges',
   join:[88.01,23.14],waypoints:[[88.55,23.15],[89.1,22.85]],
   mouth:[89.28,22.06],minZoom:9.8,maxShoreKm:80}
 ];
 const areas=[
  {name:'Delta del Indo',center:[67.8,24.0],radii:[1.25,.85],
   minZoom:7.7,priority:88,basin:'Indo'},
  {name:'Llanuras mareales del Indo',center:[67.9,23.8],radii:[1.45,.6],
   minZoom:9.1,priority:76,basin:'Indo'},
  {name:'Delta del Ganges-Brahmaputra',center:[89.55,22.9],radii:[2.8,1.9],
   minZoom:7.2,priority:90,basin:'Ganges'},
  {name:'Sundarbans',center:[89.1,22.05],radii:[1.65,.75],
   minZoom:8.1,priority:87,basin:'Ganges'},
  {name:'Estuario del Meghna',center:[90.7,22.65],radii:[.98,.82],
   minZoom:8.7,priority:77,basin:'Brahmaputra'}
 ];
 function regionsNear(lon,lat){
  return areas.filter(x=>{
   const dx=(lon-x.center[0])/x.radii[0],dy=(lat-x.center[1])/x.radii[1];
   return dx*dx+dy*dy<=1;
  }).sort((a,b)=>b.priority-a.priority);
 }
 window.HexategosIndianDeltas0408=Object.freeze({
  version:'0.40.8',corrections,channels,areas,regionsNear
 });
})();