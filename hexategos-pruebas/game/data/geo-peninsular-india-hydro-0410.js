'use strict';
/* HEXATEGOS ATLAS 0.41.0 · Hidrografía de India peninsular.
 * Referencias [longitud,latitud], NO segmentos de dibujo directo.
 * La ruta efectiva usa sólo vértices y aristas interiores L8.
 * El mar de Arabia, golfo de Khambhat y bahía de Bengala conservan
 * sus costas reales de Hexategos: sin inventar agua navegable.
 */
(function(){
 const main=[
  {name:'Narmada',basin:'Narmada',direction:'west',minZoom:6.7,width:188,
   points:[[81.76,22.68],[80.95,22.72],[79.96,23.13],[78.48,22.82],
    [77.4,22.8],[76.2,22.25],[75.15,22.23],[73.75,21.83],
    [72.96,21.71]],mouth:[72.61,21.72]},
  {name:'Tapti',basin:'Tapti',direction:'west',minZoom:6.8,width:166,
   aliases:['Tapi'],
   points:[[78.25,21.48],[77.45,21.38],[76.26,21.30],[75.57,21.02],
    [74.52,21.14],[73.49,21.24],[72.86,21.18]],mouth:[72.63,21.12]},
  {name:'Godavari',basin:'Godavari',direction:'east',minZoom:6.2,width:208,
   points:[[73.53,19.93],[74.50,19.94],[75.36,19.48],[76.5,19.19],
    [77.39,19.17],[78.35,18.88],[79.47,18.51],[80.40,17.92],
    [81.31,17.26],[81.83,17.03]],mouth:[82.30,16.70]},
  {name:'Krishna',basin:'Krishna',direction:'east',minZoom:6.2,width:192,
   points:[[73.66,17.96],[74.15,17.27],[74.59,16.85],[75.34,16.61],
    [76.10,16.31],[77.17,16.41],[78.1,16.54],[79.19,16.51],
    [80.55,16.52]],mouth:[80.94,15.86]},
  {name:'Kaveri',basin:'Kaveri',direction:'east',minZoom:6.8,width:156,
   aliases:['Cauvery'],
   points:[[75.50,12.38],[76.38,12.42],[76.71,12.41],[77.21,11.78],
    [77.72,11.34],[78.05,11.12],[78.69,10.82],[79.38,11.15]],
   mouth:[79.85,11.18]},
  {name:'Mahanadi',basin:'Mahanadi',direction:'east',minZoom:6.7,width:169,
   points:[[81.98,20.28],[82.30,20.44],[83.00,21.00],[83.98,21.47],
    [84.57,20.98],[85.22,20.70],[85.87,20.46]],mouth:[86.76,20.23]}
 ];
 // Una misma confluencia es un vértice en el cauce madre, no sólo
 // dos líneas visuales próximas. Los afluentes NO son navegables.
 const tributaries=[
  {name:'Tawa',parent:'Narmada',join:[77.77,22.76],points:[[78.2,22.05],[77.97,22.36],[77.77,22.76]],minZoom:8.8,width:65},
  {name:'Hiran',parent:'Narmada',join:[79.62,23.10],points:[[80.40,23.7],[80.00,23.35],[79.62,23.10]],minZoom:9.1,width:52},
  {name:'Purna (Tapti)',parent:'Tapti',join:[75.60,21.06],points:[[77.5,20.7],[76.74,20.9],[75.60,21.06]],minZoom:8.5,width:72},
  {name:'Girna',parent:'Tapti',join:[75.40,21.05],points:[[74.38,20.04],[74.55,20.5],[75.1,20.77],[75.4,21.05]],minZoom:8.8,width:61},
  {name:'Pravara',parent:'Godavari',join:[74.98,19.65],points:[[73.95,19.58],[74.28,19.43],[74.98,19.65]],minZoom:9.1,width:59},
  {name:'Manjira',parent:'Godavari',join:[77.90,18.98],points:[[75.5,18.3],[76.55,18.63],[77.2,18.7],[77.90,18.98]],minZoom:8.5,width:96},
  {name:'Pranhita',parent:'Godavari',join:[79.92,18.55],points:[[79.55,19.55],[79.68,19.15],[79.92,18.55]],minZoom:8.0,width:120},
  {name:'Wardha',parent:'Pranhita',join:[79.64,19.25],points:[[78.5,21.0],[78.8,20.43],[79.2,19.93],[79.64,19.25]],minZoom:8.8,width:76},
  {name:'Indravati',parent:'Godavari',join:[80.14,18.28],points:[[82.00,19.17],[81.33,18.90],[80.75,18.52],[80.14,18.28]],minZoom:8.2,width:111},
  {name:'Bhima',parent:'Krishna',join:[77.28,16.45],points:[[73.85,18.76],[74.85,18.46],[75.64,17.92],[76.35,17.44],[77.28,16.45]],minZoom:7.8,width:116},
  {name:'Tungabhadra',parent:'Krishna',join:[77.31,16.40],points:[[75.30,14.60],[75.91,14.38],[76.52,15.07],[77.01,15.68],[77.31,16.40]],minZoom:7.8,width:118},
  {name:'Musi',parent:'Krishna',join:[79.40,16.50],points:[[78.1,17.45],[78.47,17.37],[78.75,17.10],[79.40,16.50]],minZoom:8.9,width:60},
  {name:'Hemavati',parent:'Kaveri',join:[76.70,12.47],points:[[75.95,13.12],[76.25,12.8],[76.70,12.47]],minZoom:9.0,width:69},
  {name:'Kabini',parent:'Kaveri',join:[76.72,12.24],points:[[76.18,11.71],[76.38,11.97],[76.72,12.24]],minZoom:8.7,width:78},
  {name:'Bhavani',parent:'Kaveri',join:[77.68,11.46],points:[[76.57,11.22],[77.10,11.34],[77.68,11.46]],minZoom:9.0,width:65},
  {name:'Seonath',parent:'Mahanadi',join:[82.3,20.42],points:[[81.05,21.45],[81.42,21.05],[82.30,20.42]],minZoom:8.5,width:90},
  {name:'Hasdeo',parent:'Mahanadi',join:[82.72,21.10],points:[[82.58,23.09],[82.55,22.12],[82.72,21.10]],minZoom:8.7,width:71},
  {name:'Tel',parent:'Mahanadi',join:[83.9,20.78],points:[[83.0,19.55],[83.35,20.25],[83.90,20.78]],minZoom:8.2,width:102}
 ];
 // Difluencias que nacen en cauces L8 renderizados y llegan a
 // vértices costeros nativos; jamás crean nuevos hexágonos acuáticos.
 const deltas=[
  {name:'Gautami Godavari',parent:'Godavari',join:[81.82,17.02],
   points:[[82.03,16.90]],mouth:[82.28,16.69],minZoom:9.0},
  {name:'Vasishta Godavari',parent:'Godavari',join:[81.83,17.02],
   points:[[81.95,16.81]],mouth:[81.88,16.55],minZoom:9.0},
  {name:'Delta del Krishna oriental',parent:'Krishna',join:[80.54,16.52],
   points:[[80.75,16.20]],mouth:[80.93,15.85],minZoom:9.0},
  {name:'Delta del Krishna occidental',parent:'Krishna',join:[80.54,16.52],
   points:[[80.52,16.22]],mouth:[80.52,15.89],minZoom:9.4},
  {name:'Kollidam',parent:'Kaveri',join:[79.25,11.18],
   points:[[79.48,11.30]],mouth:[79.82,11.37],minZoom:9.3},
  {name:'Delta del Kaveri',parent:'Kaveri',join:[79.28,11.10],
   points:[[79.43,11.04]],mouth:[79.79,11.13],minZoom:9.1},
  {name:'Kathajodi',parent:'Mahanadi',join:[85.86,20.47],
   points:[[86.18,20.35]],mouth:[86.65,20.24],minZoom:9.1},
  {name:'Delta del Mahanadi',parent:'Mahanadi',join:[85.87,20.46],
   points:[[86.23,20.52]],mouth:[86.76,20.32],minZoom:9.1}
 ];
 const regions=[
  {name:'Delta del Godavari',center:[82.04,16.75],radii:[.8,.7],priority:86,minZoom:8.7},
  {name:'Delta del Krishna',center:[80.71,16.13],radii:[.7,.7],priority:84,minZoom:8.7},
  {name:'Delta del Kaveri',center:[79.58,11.12],radii:[.58,.6],priority:85,minZoom:8.7},
  {name:'Delta del Mahanadi',center:[86.3,20.35],radii:[.85,.7],priority:85,minZoom:8.7}
 ];
 function regionsNear(lon,lat){
  return regions.filter(x=>{
   const a=(lon-x.center[0])/x.radii[0],b=(lat-x.center[1])/x.radii[1];
   return a*a+b*b<=1;
  }).sort((a,b)=>b.priority-a.priority);
 }
 window.HexategosPeninsularHydro0410=Object.freeze({
  version:'0.41.0',main,tributaries,deltas,regions,regionsNear,
  bounds:window.HexategosPeninsularIndiaPhysical0409?.bounds||null
 });
})();