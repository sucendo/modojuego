'use strict';
/* HEXATEGOS Atlas 0.40.7 · Sistema Indo–Ganges–Brahmaputra.
 * Coordenadas [lon,lat] orientativas para anclaje L8; ningún vector
 * cartesiano se utiliza como geometría renderizada.
 * Las redes principales Indo/Ganges/Brahmaputra/Yamuna ya son canónicas.
 * parent: nombre del cauce receptor; join: proximidad de confluencia.
 */
(function(){
 const rivers=[
  // El cauce Indo nativo empieza en el Himalaya noroccidental.
  // Prolongar la cabecera por Ladakh sólo mientras falte en la red base.
  {name:'Indo alto (Ladakh)',basin:'Indo',parent:'Indo',
   join:[75.28,35.4],onlyIfMissingNear:[81.2,31.2],
   points:[[81.2,31.2],[80.05,32.05],[79.0,32.65],
    [77.59,34.15],[76.4,34.67],[75.28,35.4]],
   minZoom:7.2,maxWidth:137,kind:'upstreamContinuation'},
  // Indo: cinco ríos del Punjab -> Panjnad -> Indo.
  {name:'Panjnad',basin:'Indo',parent:'Indo',join:[70.97,28.93],
   points:[[71.55,29.45],[71.31,29.18],[71.08,29.00]],
   minZoom:7.4,maxWidth:156,kind:'confluence'},
  {name:'Chenab',basin:'Indo',parent:'Panjnad',join:[71.55,29.45],
   points:[[77.1,32.55],[75.9,33.22],[74.8,32.85],[74.5,32.4],
     [73.48,31.7],[72.15,31.15],[71.5,30.15],[71.55,29.45]],
   minZoom:7.3,maxWidth:155},
  {name:'Sutlej',basin:'Indo',parent:'Panjnad',join:[71.55,29.45],
   points:[[80.6,31.12],[79.1,31.58],[78.47,31.8],[76.5,31.35],
    [75.7,30.97],[74.96,31.15],[73.8,30.55],[72.65,30.1],[71.55,29.45]],
   minZoom:7.1,maxWidth:140},
  {name:'Jhelum',basin:'Indo',parent:'Chenab',join:[72.16,31.15],
   points:[[75.25,33.55],[74.85,34.07],[74.34,34.16],
    [73.55,34.4],[73.6,33.27],[72.75,32.2],[72.16,31.15]],
   minZoom:7.9,maxWidth:114},
  {name:'Ravi',basin:'Indo',parent:'Chenab',join:[72.65,30.85],
   points:[[76.36,32.45],[76.1,32.52],[75.65,32.02],
    [74.5,31.65],[73.65,31.3],[72.65,30.85]],
   minZoom:8.0,maxWidth:104},
  {name:'Beas',basin:'Indo',parent:'Sutlej',join:[74.96,31.15],
   points:[[77.1,32.37],[77.11,31.97],[76.9,31.65],
    [76.15,31.75],[75.58,31.45],[74.96,31.15]],
   minZoom:8.4,maxWidth:98},
  {name:'Kabul',basin:'Indo',parent:'Indo',join:[72.24,33.89],
   points:[[69.28,34.52],[70.27,34.43],[70.8,34.38],
     [71.53,34.2],[71.95,34.0],[72.24,33.89]],
   minZoom:7.7,maxWidth:117},
  {name:'Shyok',basin:'Indo',parent:'Indo',join:[75.65,35.22],
   points:[[77.65,35.23],[77.18,34.75],[76.8,34.62],
    [76.05,34.97],[75.65,35.22]],
   minZoom:9,maxWidth:78},
  // Ganges: cabeceras y afluentes de la llanura gangética.
  {name:'Ganges alto',basin:'Ganges',parent:'Ganges',
   join:[78.09,29.86],onlyIfMissingNear:[78.94,30.91],
   points:[[78.94,30.91],[78.72,30.54],[78.63,30.16],
    [78.3,30.05],[78.09,29.86]],
   minZoom:8.1,maxWidth:108,kind:'upstreamContinuation'},
  {name:'Yamuna alta',basin:'Ganges',parent:'Yamuna',
   join:[76.99,29.76],onlyIfMissingNear:[78.45,31.03],
   points:[[78.45,31.03],[78.12,30.71],[77.7,30.22],[76.99,29.76]],
   minZoom:8.4,maxWidth:93,kind:'upstreamContinuation'},

  {name:'Ghaghara (Karnali)',basin:'Ganges',parent:'Ganges',join:[84.00,25.72],
   points:[[81.7,30.14],[81.33,29.35],[81.23,28.7],
    [81.35,28.22],[81.8,27.43],[82.55,26.55],[84.0,25.72]],
   minZoom:7.0,maxWidth:162,aliases:['Karnali','Ghaghara']},
  {name:'Gandak',basin:'Ganges',parent:'Ganges',join:[85.18,25.68],
   points:[[85.35,28.24],[84.83,27.98],[84.48,27.72],
    [84.3,27.45],[84.1,26.65],[85.18,25.68]],
   minZoom:7.8,maxWidth:122,aliases:['Gandaki']},
  {name:'Kosi',basin:'Ganges',parent:'Ganges',join:[87.26,25.42],
   points:[[86.92,27.72],[87.18,27.16],[87.06,26.48],
     [86.92,25.75],[87.26,25.42]],
   minZoom:7.8,maxWidth:124,aliases:['Koshi']},
  {name:'Gomti',basin:'Ganges',parent:'Ganges',join:[83.24,25.50],
   points:[[80.0,28.58],[80.5,27.9],[80.94,26.85],
    [81.92,26.26],[82.88,25.81],[83.24,25.5]],
   minZoom:8.2,maxWidth:106},
  {name:'Ramganga',basin:'Ganges',parent:'Ganges',join:[79.67,27.05],
   points:[[79.15,30.3],[79.01,29.46],[79.39,28.53],
     [79.71,27.65],[79.67,27.05]],
   minZoom:8.8,maxWidth:95},
  {name:'Son',basin:'Ganges',parent:'Ganges',join:[84.73,25.55],
   points:[[81.77,22.78],[81.42,23.52],[81.26,24.21],
     [82.49,24.55],[83.68,24.51],[84.73,25.55]],
   minZoom:8.1,maxWidth:105,aliases:['Sone']},
  // Brahmaputra: el tramo alto tibetano se prolonga SÓLO si la red
  // canónica aún no alcanza su cabecera. Termina en un vértice nativo.
  {name:'Yarlung Tsangpo',basin:'Brahmaputra',parent:'Brahmaputra',
   join:[95.2,28.42],onlyIfMissingNear:[82.3,30.6],
   points:[[82.3,30.55],[83.9,29.65],[85.65,29.55],[87.4,29.28],
     [89.0,29.22],[90.3,29.23],[91.7,29.15],[93.4,29.4],
     [94.7,29.75],[95.3,29.25],[95.2,28.42]],
   minZoom:7.0,maxWidth:130,kind:'upstreamContinuation'},
  {name:'Subansiri',basin:'Brahmaputra',parent:'Brahmaputra',
   join:window.HexategosAssamConfluences0413?.mouths.Subansiri.at||[93.91,26.88],
   points:window.HexategosAssamConfluences0413?.highCourses.Subansiri||
     [[92.643,27.983],[94.03,28.36],[94.35,27.72],[94.21,27.60],
      [94.27,27.24],[93.91,26.88]],
   minZoom:8.2,maxWidth:103},
  {name:'Lohit',basin:'Brahmaputra',parent:'Brahmaputra',join:[95.71,27.67],
   points:[[97.5,28.38],[96.8,28.02],[96.12,27.91],[95.71,27.67]],
   minZoom:8.5,maxWidth:109},
  {name:'Dibang',basin:'Brahmaputra',parent:'Brahmaputra',join:[95.52,27.65],
   points:[[95.98,28.96],[95.91,28.33],[95.73,27.86],[95.52,27.65]],
   minZoom:9.1,maxWidth:78},
  {name:'Manas',basin:'Brahmaputra',parent:'Brahmaputra',
   join:window.HexategosAssamConfluences0413?.mouths.Manas.at||[90.825,26.25],
   points:window.HexategosAssamConfluences0413?.highCourses.Manas||
     [[91.3,27.92],[91.2,27.58],[90.95,27.22],[90.95,26.84],
      [90.87,26.52],[90.825,26.25]],
   minZoom:8.6,maxWidth:108},
  {name:'Teesta',basin:'Brahmaputra',parent:'Brahmaputra',
   join:window.HexategosAssamConfluences0413?.mouths.Teesta.at||[89.66,25.49],
   points:window.HexategosAssamConfluences0413?.highCourses.Teesta||
     [[88.73,27.96],[88.55,27.35],[88.55,26.75],
      [88.76,26.30],[89.2,25.90],[89.66,25.49]],
   minZoom:8.4,maxWidth:100,aliases:['Tista']}
 ];
 const basins=[
  {name:'Cuenca alta del Indo',center:[75.2,34.0],radii:[5.6,2.0],priority:80,minZoom:7.2},
  {name:'Cuenca del Punjab',center:[74.2,30.9],radii:[4.3,2.1],priority:79,minZoom:7.1},
  {name:'Llanura aluvial del Indo',center:[69.6,26.7],radii:[2.6,4.2],priority:78,minZoom:7.1},
  {name:'Cuenca alta del Ganges',center:[79.5,30.0],radii:[3,2.0],priority:79,minZoom:7.5},
  {name:'Cuenca del Ganges medio',center:[83.3,26.3],radii:[5.5,1.5],priority:80,minZoom:7.0},
  {name:'Terai nepalí',center:[84.6,27.05],radii:[4.2,.65],priority:79,minZoom:8.5},
  {name:'Valle del Yarlung Tsangpo',center:[88.3,29.3],radii:[6,1.1],priority:83,minZoom:8.1},
  {name:'Valle del Brahmaputra',center:[93.1,26.8],radii:[3.9,1.0],priority:82,minZoom:7.5},
  {name:'Delta del Ganges-Brahmaputra',center:[90.15,23.1],radii:[3.1,1.9],priority:86,minZoom:7.3}
 ];
 const trunk=[
  {name:'Indo',canonical:true,basin:'Indo',source:[81,31.2],mouth:[67.5,24.0]},
  {name:'Ganges',canonical:true,basin:'Ganges',source:[78.9,30.8],mouth:[90.5,22.2]},
  {name:'Brahmaputra',canonical:true,basin:'Brahmaputra',
   source:[82.3,30.6],mouth:[90.5,23.7],tibetanName:'Yarlung Tsangpo'},
  {name:'Yamuna',canonical:true,basin:'Ganges',source:[78.5,31.0],mouth:[81.8,25.5]}
 ];
 const bounds={west:67,east:100,south:20,north:40.5};
 function regionsNear(lon,lat){
  return basins.filter(r=>{
   const x=(lon-r.center[0])/r.radii[0],y=(lat-r.center[1])/r.radii[1];
   return x*x+y*y<=1;
  }).sort((a,b)=>b.priority-a.priority);
 }
 window.HexategosSubcontinentHydro0407=Object.freeze({
  version:'0.40.7',rivers,trunk,basins,bounds,regionsNear
 });
})();