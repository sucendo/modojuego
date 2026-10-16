'use strict';
/* HEXATEGOS ATLAS · Grandes lagos europeos 0.39.7.
 * Ejes y anchuras ilustrativos: NO son polígonos de costa medidos.
 * Geometría resuelta por el grafo L8 compartido: vértice a vértice, sin
 * trazos libres ni alterar la malla, costa o geología.
 * Los lagos pequeños pueden ocupar menos de una casilla L8.
 */
(function(){
 const lakes=[{"name":"Lago Lemán","axis":[[6.12,46.29],[6.38,46.4],[6.69,46.45],[6.87,46.4]],"widthKm":10.5,"minZoom":5},{"name":"Lago de Constanza","axis":[[9.42,47.66],[9.1,47.63],[8.9,47.6]],"widthKm":8,"minZoom":5.6},{"name":"Lago de Neuchâtel","axis":[[6.77,46.86],[6.85,46.97],[6.91,47.03]],"widthKm":5.8,"minZoom":8},{"name":"Lago de Lucerna","axis":[[8.21,47.03],[8.35,47],[8.46,46.96],[8.59,47]],"widthKm":3.5,"minZoom":9},{"name":"Lago de Zúrich","axis":[[8.51,47.36],[8.62,47.28],[8.76,47.2],[8.84,47.18]],"widthKm":2.7,"minZoom":9},{"name":"Lago de Thun","axis":[[7.57,46.71],[7.72,46.68],[7.79,46.7]],"widthKm":2.7,"minZoom":10},{"name":"Lago de Brienz","axis":[[7.87,46.72],[8.06,46.73],[8.12,46.75]],"widthKm":2.3,"minZoom":10},{"name":"Lago de Biel","axis":[[7.06,47.1],[7.15,47.07],[7.2,47.04]],"widthKm":2.2,"minZoom":10.5},{"name":"Lago Mayor","axis":[[8.58,46.18],[8.7,46.05],[8.7,45.94],[8.63,45.8]],"widthKm":3.9,"minZoom":7.5},{"name":"Lago de Como","axis":[[9.15,46.12],[9.29,46],[9.27,45.91],[9.17,45.83]],"widthKm":3.8,"minZoom":8.2},{"name":"Lago de Lugano","axis":[[8.89,45.99],[8.96,45.97],[9.04,45.96]],"widthKm":2,"minZoom":10.5},{"name":"Lago de Garda","axis":[[10.59,45.88],[10.65,45.72],[10.61,45.6],[10.72,45.52]],"widthKm":5.4,"minZoom":7.6},{"name":"Lago de Iseo","axis":[[10.08,45.83],[10.06,45.73],[10.07,45.66]],"widthKm":2.4,"minZoom":9.7},{"name":"Lago de Orta","axis":[[8.39,45.9],[8.39,45.82],[8.4,45.77]],"widthKm":1.8,"minZoom":10.4},{"name":"Lago Trasimeno","axis":[[12.09,43.14],[12.13,43.12],[12.18,43.13]],"widthKm":9.8,"minZoom":8.5},{"name":"Lago de Bolsena","axis":[[11.88,42.61],[11.95,42.6],[11.98,42.59]],"widthKm":8,"minZoom":8.2},{"name":"Lago Balatón","axis":[[17.23,46.75],[17.57,46.79],[17.97,46.92],[18.16,46.98]],"widthKm":8.2,"minZoom":6.1},{"name":"Lago de Ohrid","axis":[[20.66,41.03],[20.72,40.98],[20.77,40.92]],"widthKm":7.4,"minZoom":8.4},{"name":"Lago Prespa","axis":[[20.92,40.92],[21.03,40.84],[21.08,40.78]],"widthKm":7.4,"minZoom":8.7},{"name":"Lago Skadar","axis":[[19.23,42.1],[19.35,42.14],[19.44,42.22]],"widthKm":6,"minZoom":8},{"name":"Lago de Bled","axis":[[14.06,46.37],[14.09,46.37]],"widthKm":1.7,"minZoom":12.5},{"name":"Lago de Bohinj","axis":[[13.85,46.29],[13.9,46.28]],"widthKm":1.7,"minZoom":12},{"name":"Lago de Dojran","axis":[[22.72,41.19],[22.78,41.22]],"widthKm":2.2,"minZoom":11},{"name":"Lago de Van","axis":[[42.6,38.5],[43.03,38.52],[43.49,38.58]],"widthKm":16,"minZoom":5.5},{"name":"Lago Ladoga","axis":[[30.2,60.3],[30.8,60.56],[31.4,60.9],[31.75,61.2]],"widthKm":55,"minZoom":2.2},{"name":"Lago Onega","axis":[[35.6,61.3],[35.3,61.8],[35.25,62.4]],"widthKm":32,"minZoom":3.2},{"name":"Lago Peipus","axis":[[27.47,57.86],[27.52,58.35],[27.59,58.8]],"widthKm":15,"minZoom":5},{"name":"Lago Vänern","axis":[[12.23,58.58],[12.66,58.84],[13.14,58.93],[13.48,58.93]],"widthKm":35,"minZoom":3.8},{"name":"Lago Vättern","axis":[[14.43,57.75],[14.49,58.1],[14.52,58.48],[14.58,58.9]],"widthKm":12,"minZoom":4.8},{"name":"Lago Mälaren","axis":[[16.02,59.36],[16.58,59.48],[17.21,59.5],[17.91,59.42]],"widthKm":9,"minZoom":6},{"name":"Lago Hjälmaren","axis":[[15.46,59.25],[15.76,59.27],[16.12,59.24]],"widthKm":10,"minZoom":7},{"name":"Lago de Siljan","axis":[[14.73,60.94],[14.92,61],[15.05,61]],"widthKm":5,"minZoom":8.2},{"name":"Lago Saimaa","axis":[[28.05,61.12],[28.53,61.48],[28.64,61.89],[29.04,62.18]],"widthKm":18,"minZoom":4.3},{"name":"Lago Päijänne","axis":[[25.58,61.14],[25.53,61.53],[25.48,62.06]],"widthKm":8.4,"minZoom":6.2},{"name":"Lago Inari","axis":[[27.2,68.7],[28,68.95],[28.8,69.11]],"widthKm":21,"minZoom":4.5},{"name":"Lago Oulujärvi","axis":[[26.92,64.2],[27.3,64.3],[27.6,64.36]],"widthKm":12,"minZoom":7},{"name":"Lago Pielinen","axis":[[29.37,62.85],[29.47,63.15],[29.52,63.4]],"widthKm":8,"minZoom":6},{"name":"Lago Storsjön","axis":[[14.23,63],[14.35,63.17],[14.51,63.34]],"widthKm":6,"minZoom":8},{"name":"Lago Mjøsa","axis":[[10.99,60.6],[11.03,60.94],[11.22,61.25]],"widthKm":3.8,"minZoom":6.2},{"name":"Lago Randsfjorden","axis":[[10.2,60.15],[10.29,60.41],[10.4,60.6]],"widthKm":2.5,"minZoom":8.4},{"name":"Lago de Loch Ness","axis":[[-4.72,57.14],[-4.54,57.22],[-4.36,57.31]],"widthKm":1.6,"minZoom":8.5},{"name":"Loch Lomond","axis":[[-4.6,56.05],[-4.59,56.18],[-4.61,56.28]],"widthKm":3,"minZoom":7.4},{"name":"Lough Neagh","axis":[[-6.66,54.51],[-6.42,54.62]],"widthKm":13,"minZoom":6.4},{"name":"Lago de Annecy","axis":[[6.13,45.95],[6.15,45.88],[6.16,45.84]],"widthKm":2.5,"minZoom":10},{"name":"Lago de Bourget","axis":[[5.87,45.8],[5.88,45.72],[5.86,45.65]],"widthKm":3,"minZoom":10},{"name":"Lago de Serre-Ponçon","axis":[[6.24,44.53],[6.32,44.5],[6.39,44.46]],"widthKm":2.8,"minZoom":10.5},{"name":"Lago de Der","axis":[[4.7,48.58],[4.8,48.59]],"widthKm":4.4,"minZoom":10},{"name":"Lago de Steinhude","axis":[[9.31,52.46],[9.38,52.46]],"widthKm":4.3,"minZoom":10},{"name":"Lago de Müritz","axis":[[12.64,53.38],[12.72,53.42]],"widthKm":4.8,"minZoom":9.5},{"name":"Lago de Plön","axis":[[10.36,54.14],[10.43,54.16]],"widthKm":3,"minZoom":10},{"name":"Lago de Schwerin","axis":[[11.46,53.55],[11.49,53.68]],"widthKm":3.1,"minZoom":9.5},{"name":"Lago de Śniardwy","axis":[[21.63,53.76],[21.75,53.78]],"widthKm":7.2,"minZoom":8.5},{"name":"Lago de Mamry","axis":[[21.63,54.1],[21.68,54.18]],"widthKm":5,"minZoom":9.5}];

 // Caché por lago: la ruta se construye sólo la primera vez que la
 // cámara muestra su zona. No calcular rutas ni recorrer toda L8 por frame.
 const paths=new Map(),visibleNames=new Set();
 function planFor(lake){
  if(paths.has(lake.name))return paths.get(lake.name);
  const plan=window.HexategosEuropeSecondaryRender0396?.lakeRoute?.(lake)||null;
  paths.set(lake.name,plan);
  return plan;
 }
 function draw(R,cx,cy){
  visibleNames.clear();
  if(!($('lakes')?.checked??true)||zoom<2.2)return 0;
  let count=0;
  ctx.save();
  try{
   ctx.lineCap='butt';ctx.lineJoin='round';
   for(const lake of lakes){
    if(zoom<lake.minZoom)continue;
    // Visibilidad preliminar con los puntos de referencia; evita
    // solicitar un grafo completo para lagos que quedan fuera de pantalla.
    const hints=lake.axis.map(([lon,lat])=>{
     const v=lonLatVec(lon,lat);
     return projectVec(v[0],v[1],v[2],R,cx,cy);
    });
    if(hints.every(p=>p[2]<.02))continue;
    if(hints.every(p=>p[0]<-65||p[0]>vw+65||p[1]<-65||p[1]>vh+65))continue;
    const plan=planFor(lake);
    if(!plan||!plan.connected||plan.path.length<2)continue;
    const F=plan.mesh.faceCenters,segments=[];
    let current=[];
    const flush=()=>{if(current.length>1)segments.push(current);current=[]};
    for(let t=0;t<plan.path.length;t++){
     const node=plan.path[t],k=node*3;
     const p=projectVec(F[k]/32767,F[k+1]/32767,F[k+2]/32767,R,cx,cy);
     if(p[2]<=.015){flush();continue}
     if(!t)continue;
     const previous=plan.path[t-1],pk=previous*3;
     const q=projectVec(F[pk]/32767,F[pk+1]/32767,F[pk+2]/32767,R,cx,cy);
     if(q[2]<=.015){flush();continue}
     if(window.HexategosHybridLakes0418?.coveredEdge?.(lake.name,previous,node,plan.mesh)){
      flush();continue;
     }
     if(!current.length)current.push(q);
     current.push(p);
    }
    flush();
    if(!segments.length)continue;
    // Se ensancha la arista DIBUJADA: su línea central siempre sigue
    // una secuencia continua de vértices reales L8.
    const minStroke=zoom>=14?1.8:1.05;
    const width=Math.max(minStroke,Math.min(36,lake.widthKm*R/6371*1.15));
    for(const coords of segments){
     ctx.beginPath();
     for(let i=0;i<coords.length;i++){
      const p=coords[i];
      if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);
     }
     ctx.strokeStyle='rgba(4,34,47,.84)';ctx.lineWidth=width+2.4;ctx.stroke();
     ctx.strokeStyle='rgba(50,145,178,.93)';ctx.lineWidth=width;ctx.stroke();
     if(width>=3.2){
      ctx.strokeStyle='rgba(125,211,230,.45)';
      ctx.lineWidth=Math.max(.65,width*.23);ctx.stroke();
     }
    }
    count++;visibleNames.add(lake.name);
   }
  }finally{ctx.restore()}
  return count;
 }
 function nearby(lat,lon){
  const matches=[];
  for(const lake of lakes){
   let d=Infinity;
   for(const p of lake.axis)d=Math.min(d,Math.hypot((p[0]-lon)*Math.cos(lat*Math.PI/180),p[1]-lat));
   if(d<Math.max(.025,lake.widthKm/160))matches.push({name:lake.name,d});
  }
  return matches.sort((a,b)=>a.d-b.d).slice(0,3).map(x=>x.name);
 }
 window.HexategosEuropeLakes0396=Object.freeze({version:'0.39.7',lakes,draw,nearby,
  isDrawn:name=>visibleNames.has(name),
  diagnostics:()=>({prepared:paths.size,resolved:[...paths.values()].filter(Boolean).length,
   omitted:[...paths].filter(([name,route])=>!route).map(([name])=>name)})});
})();