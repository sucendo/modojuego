'use strict';
/* HEXATEGOS ATLAS 0.40.9 — India peninsular, geografía compartida.
 * Polilíneas de REFERENCIA [lon,lat], no geometría renderizada:
 * toda ruta dibujada debe resolverse después con aristas L8 reales.
 * Ghats canónicos existentes: nunca se dibujan dos veces.
 */
(function(){
 const mountains=[
  {name:'Ghats occidentales septentrionales',canonicalParent:'Ghats Occidentales',
   points:[[73.42,20.90],[73.6,19.25],[73.85,17.5]],minZoom:7.8,elevationM:1350},
  {name:'Ghats occidentales centrales',canonicalParent:'Ghats Occidentales',
   points:[[73.85,17.5],[74.25,15.4],[74.85,13.9]],minZoom:7.8,elevationM:1550},
  {name:'Ghats occidentales meridionales',canonicalParent:'Ghats Occidentales',
   points:[[74.85,13.9],[75.65,12.2],[76.5,10.8],[77.15,8.7]],minZoom:7.8,elevationM:2200},
  {name:'Ghats orientales septentrionales',canonicalParent:'Ghats Orientales',
   points:[[84.1,19.0],[83.1,17.9],[81.4,16.2]],minZoom:8.1,elevationM:1050},
  {name:'Ghats orientales centrales',canonicalParent:'Ghats Orientales',
   points:[[81.4,16.2],[80.1,15.2],[79.5,14.2]],minZoom:8.1,elevationM:1150},
  {name:'Ghats orientales meridionales',canonicalParent:'Ghats Orientales',
   points:[[79.5,14.2],[79.2,13.2],[78.1,11.7]],minZoom:8.1,elevationM:1300},
  {name:'Montes Vindhya',points:[[73.4,22.7],[75.5,23.35],[77.5,23.68],[79.4,23.75],[81.6,23.7]],
   minZoom:7.35,elevationM:900},
  {name:'Cordillera Satpura',points:[[73.1,21.65],[75.1,21.68],[77.3,22.25],[79.0,22.48],[81.1,22.34]],
   minZoom:7.35,elevationM:1250},
  {name:'Montes Mahadeo',points:[[77.3,22.75],[78.0,22.48],[78.75,22.27]],minZoom:8.9,elevationM:1350},
  {name:'Cordillera Maikal',points:[[80.55,22.90],[81.03,22.60],[81.55,22.25]],minZoom:9.0,elevationM:1100},
  {name:'Montes Ajanta',points:[[74.45,20.45],[75.75,20.30],[77.0,20.46]],minZoom:8.9,elevationM:1000},
  {name:'Montes Nilgiri',points:[[76.23,11.66],[76.65,11.51],[77.11,11.39]],
   minZoom:8.8,elevationM:2637},
  {name:'Montes Anaimalai',points:[[76.55,10.20],[76.97,10.15],[77.43,10.27]],
   minZoom:9.0,elevationM:2695},
  {name:'Montes Cardamomo',points:[[76.83,9.79],[77.02,9.44],[77.30,8.77]],
   minZoom:9.1,elevationM:2019},
  {name:'Montes Palani',points:[[77.23,10.57],[77.70,10.33],[78.15,10.14]],
   minZoom:9.2,elevationM:2500},
  {name:'Montes Nallamala',points:[[78.71,16.06],[79.05,15.47],[79.25,14.92],[79.36,14.25]],
   minZoom:8.5,elevationM:1100},
  {name:'Montes Biligiriranga',points:[[77.08,12.11],[77.22,11.84],[77.39,11.65]],
   minZoom:9.5,elevationM:1800}
 ];
 const regions=[
  {name:'Meseta del Decán',center:[78.3,17.6],radii:[6.6,5.9],priority:92,minZoom:5.9},
  {name:'Meseta de Maharashtra',center:[75.5,19.6],radii:[2.95,2.45],priority:84,minZoom:7.5},
  {name:'Meseta de Karnataka',center:[76.3,14.1],radii:[2.5,2.6],priority:83,minZoom:7.5},
  {name:'Meseta de Telangana',center:[78.6,17.6],radii:[2.55,2.4],priority:82,minZoom:7.6},
  {name:'Meseta de Malwa',center:[76.2,23.6],radii:[2.3,1.5],priority:78,minZoom:8},
  {name:'Meseta de Chota Nagpur',center:[85.1,23.8],radii:[2.0,1.7],priority:82,minZoom:8.2},
  {name:'Meseta de Bastar',center:[81.9,19.5],radii:[2.0,2.0],priority:76,minZoom:8.6},
  {name:'Llanura del Narmada',center:[76.6,22.55],radii:[3.8,.60],priority:81,minZoom:8.3},
  {name:'Valle del Godavari',center:[79.8,18.6],radii:[4.4,1.12],priority:76,minZoom:8.5},
  {name:'Valle del Krishna',center:[78.2,16.0],radii:[4.8,1.18],priority:77,minZoom:8.6},
  {name:'Cuenca del Kaveri',center:[77.8,11.9],radii:[2.7,1.3],priority:81,minZoom:8.6},
  {name:'Konkan',center:[73.3,17.2],radii:[.66,3.0],priority:78,minZoom:7.4},
  {name:'Costa de Malabar',center:[75.7,11.5],radii:[1.05,2.4],priority:84,minZoom:7.2},
  {name:'Costa de Kanara',center:[74.6,13.75],radii:[.65,1.5],priority:76,minZoom:8.3},
  {name:'Costa de Coromandel',center:[80.2,12.2],radii:[.8,2.6],priority:84,minZoom:7.6},
  {name:'Llanura costera oriental',center:[82.0,16.9],radii:[2.6,4.1],priority:76,minZoom:7.5},
  {name:'Llanura costera occidental',center:[74.6,15.0],radii:[2.5,5.7],priority:76,minZoom:7.7},
  {name:'Llanura costera de Odisha',center:[85.9,20.0],radii:[1.25,1.9],priority:76,minZoom:8.1},
  {name:'Bosques de los Ghats occidentales',center:[75.9,11.5],radii:[1.6,4.6],priority:80,minZoom:8.3}
 ];
 const headwaters=[
  {name:'Narmada',source:[81.76,22.68],mouth:[72.63,21.72],direction:'west',river:true},
  {name:'Tapti',source:[78.25,21.48],mouth:[72.68,21.15],direction:'west',river:true,aliases:['Tapi']},
  {name:'Godavari',source:[73.53,19.93],mouth:[82.35,16.73],direction:'east',river:true},
  {name:'Krishna',source:[73.66,17.96],mouth:[80.9,15.85],direction:'east',river:true},
  {name:'Kaveri',source:[75.5,12.38],mouth:[79.85,11.35],direction:'east',river:true,aliases:['Cauvery']},
  {name:'Mahanadi',source:[81.55,20.19],mouth:[86.72,20.12],direction:'east',river:true}
 ];
 const macro=[
  {name:'India peninsular',lon:78.1,lat:16.65,kind:'land',
   minZoom:1.5,maxZoom:5.55,priority:94},
  {name:'Meseta del Decán',lon:78.1,lat:18.0,kind:'plain',
   minZoom:3.4,maxZoom:5.55,priority:81}
 ];
 const bounds=Object.freeze({west:69,east:89,south:7.2,north:26.5});
 const canonical=Object.freeze({mountains:['Ghats Occidentales','Ghats Orientales']});
 function regionsNear(lon,lat){
  if(lon<bounds.west-1||lon>bounds.east+1||lat<bounds.south-1||lat>bounds.north+1)return [];
  return regions.filter(r=>{
   const u=(lon-r.center[0])/r.radii[0],v=(lat-r.center[1])/r.radii[1];
   return u*u+v*v<=1;
  }).sort((a,b)=>b.priority-a.priority);
 }
 window.HexategosPeninsularIndiaPhysical0409=Object.freeze({
  version:'0.40.9',bounds,mountains,regions,headwaters,macro,canonical,
  regionsNear,bodyAt:()=>null
 });
})();