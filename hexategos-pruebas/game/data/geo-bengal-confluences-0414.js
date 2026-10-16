'use strict';
/* Hexategos 0.41.4 · Ganges-Kosi, Indo-Panjnad, Jamuna/Padma/Meghna.
 * Ejes de REFERENCIA [longitud, latitud], no geometrías dibujadas.
 * Geografía aproximada: los ríos dinámicos cambian de brazo y lecho.
 * Todas las trazas visuales se resuelven sobre vértices y aristas L8.
 */
(function(){
 const confluences=Object.freeze({
  Kosi:Object.freeze({parent:'Ganges',at:[87.2569,25.4140],maxKm:28,repair:'Ganges medio y Padma'}),
  Panjnad:Object.freeze({parent:'Indo',at:[70.699,29.109],maxKm:28,repair:'Indo cerca de Mithankot'}),
  Goalundo:Object.freeze({at:[89.744,23.806],maxKm:32}),
  Chandpur:Object.freeze({at:[90.6304,23.2198],maxKm:30})
 });
 const routes=Object.freeze([
  {name:'Ganges medio y Padma',kind:'parentRepair',native:'Ganges',source:[86.695,24.352],
   points:[[86.91,24.80],[87.2569,25.4140],[87.57,25.02],[87.98,24.72],
    [88.09,24.37],[88.51,24.16],[88.96,24.03],[89.35,23.95],
    [89.744,23.806]],terminal:'Goalundo',minZoom:7.1,maxSnapKm:48},
  {name:'Indo cerca de Mithankot',kind:'parentRepair',native:'Indo',source:[69.902,29.221],
   points:[[70.17,29.45],[70.41,29.32],[70.699,29.109]],
   terminal:'Panjnad',minZoom:7.8,maxSnapKm:36},
  {name:'Jamuna',kind:'channel',parent:'Brahmaputra',source:[89.66,25.49],
   points:[[89.63,25.08],[89.68,24.75],[89.73,24.4],[89.78,24.09],
    [89.744,23.806]],terminal:'Goalundo',minZoom:7.3,maxSnapKm:38},
  {name:'Padma',kind:'channel',parent:'Ganges medio y Padma',source:'Goalundo',
   points:[[90.01,23.71],[90.32,23.48],[90.6304,23.2198]],
   terminal:'Chandpur',minZoom:7.1,maxSnapKm:32},
  {name:'Alto Meghna',kind:'tributary',source:[90.80,24.04],
   points:[[90.75,23.82],[90.69,23.55],[90.6304,23.2198]],
   terminal:'Chandpur',minZoom:8.1,maxSnapKm:36},
  {name:'Meghna inferior',kind:'estuary',source:'Chandpur',
   points:[[90.72,22.99],[90.81,22.70],[90.78,22.38]],
   mouth:[90.86,22.03],maxShoreKm:92,minZoom:7.6,maxSnapKm:36}
 ]);
 const labels=Object.freeze([
  {name:'Confluencia del Kosi',at:[87.2569,25.4140],minZoom:9.4,kind:'river'},
  {name:'Confluencia del Panjnad',at:[70.699,29.109],minZoom:9.6,kind:'river'},
  {name:'Jamuna',at:[89.72,24.65],minZoom:7.8,kind:'river'},
  {name:'Padma',at:[90.13,23.60],minZoom:7.8,kind:'river'},
  {name:'Meghna',at:[90.75,22.92],minZoom:8.1,kind:'river'}
 ]);
 window.HexategosBengalHydro0414=Object.freeze({
  version:'0.41.4',confluences,routes,labels,
  bounds:Object.freeze({west:67,east:94,south:21,north:30})
 });
})();
