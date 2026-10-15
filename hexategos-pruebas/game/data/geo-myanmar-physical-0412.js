'use strict';
/* HEXATEGOS ATLAS 0.41.2 — Myanmar y transición a Indochina.
 * Referencias geográficas [lon,lat] orientativas: la representación
 * final usa VÉRTICES/ARISTAS L8 nativas. No genera costas ni tierra.
 * Arakan Yoma, Salween y Mekong ya están en redes canónicas.
 */
(function(){
 const bounds=Object.freeze({west:90.5,east:105.9,south:9.0,north:30.4});
 const mountains=[
  {name:'Arakan Yoma',canonical:true,points:[[93.3,20.3],[94.0,22.0],[94.8,24.3]],
   minZoom:7.0,elevationM:3000},
  {name:'Montes Chin',points:[[93.73,21.0],[93.86,22.3],[94.37,23.60]],minZoom:7.6,elevationM:3053},
  {name:'Montes Naga',points:[[94.1,25.1],[94.7,25.8],[95.5,26.2]],minZoom:8.3,elevationM:3826},
  {name:'Cordillera de Patkai',points:[[95.0,26.4],[96.0,26.6],[97.1,27.2]],
   minZoom:8.4,elevationM:3800},
  {name:'Cordillera de Bago',points:[[95.75,19.45],[96.08,18.48],[96.45,17.60]],
   minZoom:7.4,elevationM:900},
  {name:'Cordillera de Dawna',points:[[98.0,18.5],[98.25,17.2],[98.6,16.2]],
   minZoom:7.7,elevationM:2080},
  {name:'Montes Tenasserim',points:[[98.7,16.0],[98.6,14.85],[98.7,13.45],[99.0,12.2]],
   minZoom:7.1,elevationM:2072},
  {name:'Montes Bilauktaung',points:[[98.55,13.1],[98.6,12.1],[98.9,11.0]],
   minZoom:8.2,elevationM:1816},
  {name:'Montes Shan septentrionales',points:[[97.23,24.6],[97.6,23.55],[98.35,22.1]],
   minZoom:8.4,elevationM:2600},
  {name:'Montes Shan meridionales',points:[[97.6,21.5],[98.3,20.4],[98.7,19.1]],
   minZoom:8.2,elevationM:2500},
  {name:'Montes Karen',points:[[97.85,19.0],[98.35,18.25],[98.5,17.2]],
   minZoom:8.5,elevationM:2100}
 ];
 const regions=[
  {name:'Meseta de Shan',center:[97.82,21.34],radii:[2.2,3.3],priority:91,minZoom:6.3},
  {name:'Valle del Irrawaddy',center:[95.90,21.4],radii:[1.32,5.8],priority:89,minZoom:6.4},
  {name:'Llanura del Irrawaddy',center:[95.35,18.3],radii:[1.55,2.5],priority:84,minZoom:7.3},
  {name:'Delta del Irrawaddy',center:[95.12,16.55],radii:[1.5,1.65],priority:88,minZoom:7.0},
  {name:'Cuenca del Chindwin',center:[94.92,23.4],radii:[1.8,2.5],priority:82,minZoom:7.7},
  {name:'Montañas de Arakán',center:[93.66,21.75],radii:[1.5,4.05],priority:82,minZoom:7.1},
  {name:'Llanura litoral de Rakáin',center:[93.03,19.8],radii:[.75,2.4],priority:79,minZoom:8},
  {name:'Cuenca del Sittaung',center:[96.60,18.55],radii:[1.13,3],priority:84,minZoom:7.1},
  {name:'Golfo de Martaban',center:[96.40,16.10],radii:[2.1,.9],priority:82,minZoom:7.0},
  {name:'Tierras altas de Kachin',center:[97.36,26.16],radii:[2.35,2.5],priority:82,minZoom:7.3},
  {name:'Llanura de Bago',center:[96.53,17.52],radii:[.95,1.33],priority:77,minZoom:8.1},
  {name:'Montañas de Tenasserim',center:[98.8,13.6],radii:[1.05,4.2],priority:84,minZoom:7.2},
  {name:'Valle del Salween',center:[98.28,20.15],radii:[1.3,4.1],priority:83,minZoom:7.5},
  {name:'Llanuras de Tailandia septentrional',center:[99.31,18.45],radii:[2.3,1.85],priority:76,minZoom:8.1},
  {name:'Llanura del Chao Phraya superior',center:[100.05,16.72],radii:[1.6,2.15],priority:80,minZoom:7.7}
 ];
 const canonical={
  rivers:['Salween','Mekong'],mountains:['Arakan Yoma']
 };
 const rivers=[
  {name:'Irrawaddy',aliases:['Ayeyarwady'],minZoom:5.9,maxWidth:211,
   points:[[97.50,25.70],[97.40,25.36],[97.22,24.42],[96.55,23.60],
     [96.11,22.05],[95.35,21.43],[94.90,20.16],[95.15,18.73],
     [95.42,17.76],[95.28,16.9]],mouth:[95.07,15.94]},
  {name:'Sittaung',aliases:['Sittang'],minZoom:6.8,maxWidth:151,
   points:[[96.50,20.35],[96.60,19.50],[96.72,18.68],
    [96.93,17.92],[96.80,17.17]],mouth:[96.77,16.68]},
  {name:'Kaladan',minZoom:7.4,maxWidth:126,
   points:[[93.80,23.43],[93.45,22.75],[93.27,21.95],
    [93.12,21.06],[92.90,20.27]],mouth:[92.83,20.05]}
 ];
 const tributaries=[
  {name:'Chindwin',parent:'Irrawaddy',join:[95.10,21.49],minZoom:7.1,
   points:[[96.65,25.65],[95.93,25.19],[95.32,24.09],
     [94.83,23.15],[94.62,22.34],[95.10,21.49]],maxWidth:141},
  {name:"N'Mai",parent:'Irrawaddy',join:[97.50,25.70],minZoom:8.2,
   points:[[97.70,28.2],[97.55,27.4],[97.53,26.57],[97.50,25.70]],maxWidth:97},
  {name:'Mali',parent:'Irrawaddy',join:[97.50,25.70],minZoom:8.2,
   points:[[97.12,27.55],[97.18,26.65],[97.50,25.70]],maxWidth:87},
  {name:'Mu',parent:'Irrawaddy',join:[95.89,22.03],minZoom:8.8,
   points:[[95.54,23.68],[95.70,22.85],[95.89,22.03]],maxWidth:66},
  {name:'Myitnge',parent:'Irrawaddy',join:[96.12,21.89],minZoom:8.0,
   points:[[98.20,22.82],[97.28,22.52],[96.65,22.04],[96.12,21.89]],maxWidth:88},
  {name:'Shweli',parent:'Irrawaddy',join:[96.41,23.10],minZoom:8.6,
   points:[[98.18,24.16],[97.35,23.66],[96.41,23.10]],maxWidth:77},
  {name:'Mogaung',parent:'Irrawaddy',join:[97.30,25.39],minZoom:9.0,
   points:[[96.58,25.55],[96.94,25.43],[97.30,25.39]],maxWidth:65},
  {name:'Uru',parent:'Chindwin',join:[95.38,24.33],minZoom:9.2,
   points:[[96.03,25.32],[95.65,24.84],[95.38,24.33]],maxWidth:69}
 ];
 // Deltas conectados al cauce principal en un vértice real, terminando
 // en costa nativa sin pintar aristas litorales.
 const distributaries=[
  {name:'Brazo occidental del Irrawaddy',parent:'Irrawaddy',join:[95.37,17.75],
   points:[[94.95,17.04]],mouth:[94.67,16.35],minZoom:8.3},
  {name:'Brazo oriental del Irrawaddy',parent:'Irrawaddy',join:[95.36,17.75],
   points:[[95.78,17.16]],mouth:[95.75,16.32],minZoom:8.5},
  {name:'Brazo Pathein',parent:'Irrawaddy',join:[95.14,18.18],
   points:[[94.85,17.42]],mouth:[94.55,16.76],minZoom:8.5},
  {name:'Brazo Bogale',parent:'Irrawaddy',join:[95.35,17.72],
   points:[[95.76,16.82]],mouth:[95.98,16.33],minZoom:8.9}
 ];
 const macro=[
  {name:'Myanmar',lon:95.7,lat:21.55,kind:'land',priority:92,
    minZoom:2.0,maxZoom:5.55}
 ];
 function regionsNear(lon,lat){
  if(lon<bounds.west-1||lon>bounds.east+1||lat<bounds.south-1||lat>bounds.north+1)return [];
  return regions.filter(r=>{
   const a=(lon-r.center[0])/r.radii[0],b=(lat-r.center[1])/r.radii[1];
   return a*a+b*b<=1;
  }).sort((a,b)=>b.priority-a.priority);
 }
 window.HexategosMyanmarPhysical0412=Object.freeze({
  version:'0.41.2',bounds,mountains,regions,rivers,tributaries,
  distributaries,canonical,macro,regionsNear,bodyAt:()=>null
 });
})();