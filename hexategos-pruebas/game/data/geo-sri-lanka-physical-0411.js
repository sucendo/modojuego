'use strict';
/* HEXATEGOS ATLAS 0.41.1 — Sri Lanka, Palk y golfo de Mannar.
 * Solo referencias de cartografía. La malla L8 define soberanamente
 * tierra/costa/agua. NO crea islas, puentes ni rutas navegables.
 */
(function(){
 const bounds=Object.freeze({west:77.65,east:82.55,south:5.35,north:10.65});
 const mountains=[
  {name:'Tierras Altas Centrales',points:[[80.43,6.62],[80.57,6.90],[80.67,7.14],[80.81,7.37]],
   minZoom:7.4,elevationM:2524},
  {name:'Macizo de Knuckles',points:[[80.70,7.30],[80.77,7.43],[80.85,7.53]],
   minZoom:8.9,elevationM:1863},
  {name:'Montes Samanala',points:[[80.40,6.66],[80.46,6.80],[80.53,6.94]],
   minZoom:9.0,elevationM:2243},
  {name:'Montes Rakwana',points:[[80.40,6.33],[80.51,6.48],[80.61,6.67]],
   minZoom:9.0,elevationM:1480},
  {name:'Montes Haputale',points:[[80.83,6.65],[80.94,6.74],[81.03,6.85]],
   minZoom:9.2,elevationM:1900},
  {name:'Macizo de Namunukula',points:[[80.95,6.77],[81.04,6.89],[81.11,7.0]],
   minZoom:9.3,elevationM:2036}
 ];
 const regions=[
  {name:'Tierras Altas Centrales de Sri Lanka',center:[80.67,7.07],radii:[.70,.89],minZoom:6.8,priority:91},
  {name:'Llanura del norte de Sri Lanka',center:[80.25,9.15],radii:[1.20,.7],minZoom:7.6,priority:74},
  {name:'Llanura occidental de Sri Lanka',center:[80.11,7.25],radii:[.72,1.35],minZoom:7.6,priority:75},
  {name:'Llanura oriental de Sri Lanka',center:[81.23,7.95],radii:[.67,1.25],minZoom:7.6,priority:76},
  {name:'Zona húmeda del suroeste',center:[80.42,6.70],radii:[.94,.85],minZoom:8.2,priority:79},
  {name:'Zona seca septentrional',center:[80.73,8.57],radii:[1.25,.98],minZoom:8.1,priority:77},
  {name:'Llanura meridional',center:[80.73,6.23],radii:[.98,.48],minZoom:8.5,priority:74},
  {name:'Meseta de Kandy',center:[80.64,7.30],radii:[.43,.37],minZoom:9.2,priority:82},
  {name:'Llanura de Tamil Nadu meridional',center:[78.61,9.64],radii:[.70,.72],minZoom:7.6,priority:79}
 ];
 const peaks=[
  {name:'Pidurutalagala',center:[80.780,7.001],minZoom:10.0,elevationM:2524},
  {name:'Pico de Adán (Sri Pada)',center:[80.499,6.809],minZoom:9.6,elevationM:2243}
 ];
 const marine=[
  {name:'Estrecho de Palk',center:[79.70,9.42],kind:'strait',minZoom:5.1,rank:91},
  {name:'Bahía de Palk',center:[80.15,9.28],kind:'marine',minZoom:6.3,rank:82},
  {name:'Golfo de Mannar',center:[79.53,8.58],kind:'marine',minZoom:5.0,rank:93},
  {name:'Puente de Adán (Rama Setu)',center:[79.53,9.11],kind:'shoal',minZoom:9.8,rank:80},
  {name:'Estrecho de Pamban',center:[79.25,9.28],kind:'strait',minZoom:10.1,rank:60}
 ];
 // Todas estas islas son optativas: el nombre solo se muestra si la
 // malla nativa contiene tierra EN esa posición. No se dibujan siluetas.
 const islands=[
  {name:'Isla de Mannar',center:[79.86,8.98],minZoom:9.7,rank:67},
  {name:'Isla de Rameswaram',center:[79.35,9.29],minZoom:9.7,rank:65},
  {name:'Isla de Delft',center:[79.72,9.49],minZoom:10.1,rank:56},
  {name:'Isla de Kachchatheevu',center:[79.52,9.39],minZoom:11.2,rank:50},
  {name:'Península de Jaffna',center:[80.02,9.68],minZoom:9.1,rank:70}
 ];
 const shoals=[
  {name:'Rama Setu',center:[79.54,9.10],radii:[.43,.13],tone:[88,168,173],strength:.36},
  {name:'Bahía de Palk',center:[80.00,9.35],radii:[.74,.40],tone:[65,143,166],strength:.20},
  {name:'Golfo de Mannar',center:[79.43,8.63],radii:[.93,.83],tone:[55,133,166],strength:.17}
 ];
 const macro=[
  {name:'Sri Lanka',lon:80.66,lat:7.58,kind:'land',minZoom:2.05,maxZoom:5.55,priority:94}
 ];
 function regionsNear(lon,lat){
  return regions.filter(x=>{
   const a=(lon-x.center[0])/x.radii[0],b=(lat-x.center[1])/x.radii[1];
   return a*a+b*b<=1;
  }).sort((a,b)=>b.priority-a.priority);
 }
 window.HexategosSriLankaPhysical0411=Object.freeze({
  version:'0.41.1',bounds,mountains,regions,peaks,
  marine,islands,shoals,macro,regionsNear,bodyAt:()=>null
 });
})();