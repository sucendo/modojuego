'use strict';
/* HEXATEGOS Atlas 0.39.6 · grosor físico de skyline de montaña.
 * Elevación máxima aproximada, rugosidad y accesibilidad como índices
 * morfológicos descriptivos (NO rutas reales transitables del juego).
 * Sobre aristas canónicas; no se dibujan contornos/círculos nuevos.
 */
(function(){
 if(typeof mountainStroke3297!=='function')return;
 const ranges=[{"name":"Alpes","elevationM":4808,"ruggedness":0.93,"accessibility":0.25},{"name":"Pirineos","elevationM":3404,"ruggedness":0.87,"accessibility":0.36},{"name":"Cordillera Cantábrica","elevationM":2650,"ruggedness":0.72,"accessibility":0.49},{"name":"Sistema Central","elevationM":2592,"ruggedness":0.66,"accessibility":0.53},{"name":"Sistema Ibérico","elevationM":2314,"ruggedness":0.57,"accessibility":0.58},{"name":"Cordilleras Béticas","elevationM":3479,"ruggedness":0.82,"accessibility":0.43},{"name":"Sierra Morena","elevationM":1332,"ruggedness":0.35,"accessibility":0.75},{"name":"Apeninos","elevationM":2912,"ruggedness":0.71,"accessibility":0.43},{"name":"Cárpatos","elevationM":2655,"ruggedness":0.79,"accessibility":0.45},{"name":"Alpes Dináricos","elevationM":2694,"ruggedness":0.86,"accessibility":0.36},{"name":"Balcanes","elevationM":2376,"ruggedness":0.73,"accessibility":0.46},{"name":"Montes Escandinavos","elevationM":2469,"ruggedness":0.78,"accessibility":0.42},{"name":"Cáucaso","elevationM":5642,"ruggedness":0.97,"accessibility":0.2},{"name":"Urales","elevationM":1895,"ruggedness":0.47,"accessibility":0.65},{"name":"Jura","elevationM":1720,"ruggedness":0.56,"accessibility":0.62},{"name":"Pindo","elevationM":2637,"ruggedness":0.82,"accessibility":0.36}];
 const byName=new Map(ranges.map(x=>[x.name,x]));
 const base=mountainStroke3297;
 const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
 function factor(sys){
  const r=byName.get(sys.n);
  if(!r){
   const tier=sys.tier||1;
   return tier>=3?1.06:tier===2?.98:.89;
  }
  const h=clamp((r.elevationM-900)/4400,0,1);
  const abrupt=clamp((r.ruggedness+(1-r.accessibility))/2);
  // Poco grosor: montaña accesible/ondulada.
  // Mayor presencia: altura y dureza del relieve, no importancia nominal.
  return clamp(.72+.49*h+.34*abrupt,.77,1.48);
 }
 mountainStroke3297=function physicalMountainStroke0396(sys,zf){
  const original=base(sys,zf),f=factor(sys);
  return {...original,ow:original.ow*f,iw:original.iw*(.87+.13*f)*f};
 };
 window.HexategosEuropeMountains0396=Object.freeze({
  version:'0.39.6',ranges, factor,
  description:'Grosor modulado por altitud máxima aproximada y dificultad morfológica; no transitabilidad exacta.'
 });
})();