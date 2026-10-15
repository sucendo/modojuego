'use strict';
/* HEXATEGOS ATLAS 0.39.6 · macroetiquetas geográficas dependientes del zoom.
 * Ocupación compartida con etiquetas regionales para evitar colisiones.
 * Sólo rótulos; no altera malla, economía ni datos del juego.
 */
(function(){
 const features=[{"name":"Península Ibérica","lon":-4.25,"lat":40.25,"kind":"land","minZoom":1.15,"maxZoom":8.5,"priority":95},{"name":"Península Escandinava","lon":14,"lat":64.3,"kind":"land","minZoom":1.05,"maxZoom":8,"priority":102},{"name":"Islas Británicas","lon":-4.35,"lat":54.25,"kind":"land","minZoom":1.1,"maxZoom":8.2,"priority":94},{"name":"Península Itálica","lon":12.3,"lat":42.3,"kind":"land","minZoom":1.5,"maxZoom":8.3,"priority":86},{"name":"Península Balcánica","lon":22.3,"lat":41.7,"kind":"land","minZoom":1.5,"maxZoom":8,"priority":87},{"name":"Península de Jutlandia","lon":9.5,"lat":56,"kind":"land","minZoom":3.2,"maxZoom":10,"priority":63},{"name":"Península de Kola","lon":35.2,"lat":67.6,"kind":"land","minZoom":3,"maxZoom":10,"priority":63},{"name":"Península de Crimea","lon":34.2,"lat":45.1,"kind":"land","minZoom":3.4,"maxZoom":11.5,"priority":62},{"name":"Europa Occidental","lon":1.2,"lat":48.5,"kind":"region","minZoom":0.9,"maxZoom":3.4,"priority":74},{"name":"Europa Central","lon":14.8,"lat":49.2,"kind":"region","minZoom":0.9,"maxZoom":3.8,"priority":81},{"name":"Europa Oriental","lon":34.6,"lat":54.6,"kind":"region","minZoom":1.1,"maxZoom":4.3,"priority":82},{"name":"Europa Septentrional","lon":18.3,"lat":60.8,"kind":"region","minZoom":0.9,"maxZoom":3.6,"priority":72},{"name":"Llanura del Norte de Europa","lon":13.5,"lat":53.3,"kind":"plain","minZoom":1.2,"maxZoom":6.9,"priority":84},{"name":"Llanura Europea Oriental","lon":39,"lat":56.2,"kind":"plain","minZoom":1.2,"maxZoom":7.2,"priority":90},{"name":"Llanura Panónica","lon":19.1,"lat":46.9,"kind":"plain","minZoom":3.5,"maxZoom":10.7,"priority":70},{"name":"Cuenca de París","lon":2.35,"lat":48.4,"kind":"plain","minZoom":4.4,"maxZoom":10.5,"priority":62},{"name":"Llanura del Po","lon":10.6,"lat":44.8,"kind":"plain","minZoom":4,"maxZoom":10.8,"priority":66},{"name":"Alpes","lon":9.65,"lat":46.7,"kind":"mountain","minZoom":1.3,"maxZoom":10,"priority":91},{"name":"Pirineos","lon":0,"lat":42.75,"kind":"mountain","minZoom":2.9,"maxZoom":10,"priority":72},{"name":"Cárpatos","lon":23.3,"lat":47.2,"kind":"mountain","minZoom":1.3,"maxZoom":10,"priority":85},{"name":"Montes Escandinavos","lon":12.1,"lat":63.3,"kind":"mountain","minZoom":1.4,"maxZoom":9.4,"priority":83},{"name":"Urales","lon":58.4,"lat":60.2,"kind":"mountain","minZoom":1.4,"maxZoom":11,"priority":86},{"name":"Cáucaso","lon":43.1,"lat":43.2,"kind":"mountain","minZoom":1.4,"maxZoom":11,"priority":85},{"name":"Apeninos","lon":12.5,"lat":42.5,"kind":"mountain","minZoom":3.1,"maxZoom":11.1,"priority":68},{"name":"Alpes Dináricos","lon":17.4,"lat":43.5,"kind":"mountain","minZoom":3,"maxZoom":10.8,"priority":65},{"name":"Mar del Norte","lon":3.2,"lat":57,"kind":"water","minZoom":1,"maxZoom":7.5,"priority":93},{"name":"Mar Báltico","lon":20.2,"lat":57.3,"kind":"water","minZoom":1,"maxZoom":8.5,"priority":90},{"name":"Mar Mediterráneo","lon":15,"lat":36.1,"kind":"water","minZoom":0.85,"maxZoom":7,"priority":104},{"name":"Mar Negro","lon":34,"lat":43.2,"kind":"water","minZoom":0.95,"maxZoom":8,"priority":92},{"name":"Océano Atlántico","lon":-16,"lat":47.9,"kind":"water","minZoom":0.9,"maxZoom":9,"priority":101},{"name":"Mar Adriático","lon":16.5,"lat":42.9,"kind":"water","minZoom":2.3,"maxZoom":9,"priority":71},{"name":"Mar Egeo","lon":25.4,"lat":38.6,"kind":"water","minZoom":2.2,"maxZoom":9,"priority":72},{"name":"Mar de Noruega","lon":3,"lat":66.1,"kind":"water","minZoom":1.8,"maxZoom":8.4,"priority":79},{"name":"Golfo de Vizcaya","lon":-5.3,"lat":45.3,"kind":"water","minZoom":2.7,"maxZoom":9,"priority":77},{"name":"Mar de Irlanda","lon":-5.65,"lat":53.9,"kind":"water","minZoom":3.3,"maxZoom":10,"priority":58},{"name":"Mar Blanco","lon":37.8,"lat":65.4,"kind":"water","minZoom":2.8,"maxZoom":10.8,"priority":64}];
 let occupied=[];
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function draw(R,cx,cy){
  occupied=[];
  if(zoom<.85)return;
  const candidates=[];
  for(const f of features){
   if(zoom<f.minZoom||zoom>f.maxZoom)continue;
   const xyz=lonLatVec(f.lon,f.lat),p=projectVec(xyz[0],xyz[1],xyz[2],R,cx,cy);
   if(p[2]<=.045||p[0]<-160||p[0]>vw+160||p[1]<-45||p[1]>vh+45)continue;
   const fadeIn=clamp((zoom-f.minZoom)/.55);
   const fadeOut=clamp((f.maxZoom-zoom)/1.7);
   const alpha=.94*Math.min(fadeIn,fadeOut);
   if(alpha<.15)continue;
   candidates.push({f,x:p[0],y:p[1],alpha});
  }
  candidates.sort((a,b)=>b.f.priority-a.f.priority);
  ctx.save();
  try{
   ctx.textAlign='center';ctx.textBaseline='middle';
   for(const {f,x,y,alpha} of candidates){
    const size=f.priority>=90?clamp(16+Math.log2(Math.max(1,zoom))*1.35,16,21):
      clamp(12+Math.log2(Math.max(1,zoom))*1.05,12,17);
    const tracking=f.kind==='water'?'italic ':'';
    ctx.font=tracking+'700 '+size+'px system-ui';
    const width=ctx.measureText(f.name).width;
    const box=[x-width/2-13,y-size*.73,x+width/2+13,y+size*.73];
    if(occupied.some(q=>!(box[2]<q[0]||box[0]>q[2]||box[3]<q[1]||box[1]>q[3])))continue;
    ctx.lineWidth=4;
    ctx.strokeStyle='rgba(5,17,27,'+(alpha*.86).toFixed(3)+')';
    ctx.strokeText(f.name,x,y);
    const c=f.kind==='water'?[152,216,236]:f.kind==='mountain'?[231,208,168]:
       f.kind==='plain'?[221,227,182]:[235,239,214];
    ctx.fillStyle='rgba('+c.join(',')+','+alpha.toFixed(3)+')';
    ctx.fillText(f.name,x,y);
    occupied.push(box);
   }
  }finally{ctx.restore()}
 }
 window.HexategosAtlasMacro0396=Object.freeze({version:'0.39.6',features,draw,occupied:()=>occupied});
})();