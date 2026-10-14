'use strict';
/* HEXATEGOS ATLAS · Etiquetas geográficas compartidas v0.39.0.
 * Se utilizan los datos políticos de Hexategos Pruebas y las nuevas unidades
 * naturales ibéricas; las fronteras naturales son APROXIMADAS y nunca cambian
 * la propiedad de los hexágonos ni afectan a una partida.
 */
(function(){
 const source=window.HexategosGeoRegions0390;
 if(!source){console.warn('[Atlas] No se cargaron las regiones compartidas');return}
 const historicalAnchors={
  'Cataluña':[1.75,41.70],'Aragón':[-0.90,41.37],'Navarra':[-1.55,42.55],
  'Valencia':[-0.46,39.43],'Galicia':[-8.05,42.72],
  'Portugal':[-8.15,39.53],'Andalucía occidental':[-5.97,37.50],
  'Andalucía oriental':[-3.35,37.40],'Castilla':[-4.45,40.87]
 };
 let lastBoxes=[];
 function mode(){return $('regionMode')?.value||'natural'}
 function enabled(){return !!$('regions')?.checked}
 function historicalLabels(){
  return source.politicalRegions.map(row=>{
    const center=historicalAnchors[row[0]]||[(row[3]+row[4])/2,(row[1]+row[2])/2];
    return {name:row[0],center,kind:'historical',rank:row[0]==='Castilla'?65:60,
      minZoom:row[0]==='Andalucía occidental'||row[0]==='Andalucía oriental'?9:4};
  });
 }
 const historical=historicalLabels();
 const physical=window.HEXATEGOS_IBERIA_PHYSICAL_V1;
 const natural=source.physicalRegions.map(reg=>({
   name:reg.name,center:reg.center,kind:'natural',
   rank:reg.priority,
   minZoom:reg.priority>=95?11:reg.priority>=80?8:reg.priority>=70?6:4.8
 }));
 const features=[];
 if(physical){
  for(const item of physical.mountains){
   features.push({name:item.name,center:item.points[Math.floor(item.points.length*.52)],
     kind:'mountain',rank:item.rank*5+12,minZoom:12});
  }
  for(const item of physical.rivers){
   features.push({name:item.name,center:item.points[Math.floor(item.points.length*.55)],
     kind:'river',rank:item.rank*5+9,minZoom:12});
  }
 }
 function draw(R,cx,cy){
  lastBoxes=[];
  if(!enabled()||zoom<2.1)return;
  const displayMode=mode();
  let pool=[];
  if(displayMode!=='historical')pool=pool.concat(natural,features);
  if(displayMode!=='natural')pool=pool.concat(historical);
  const candidates=[];
  for(const item of pool){
   if(zoom<item.minZoom)continue;
   const v=lonLatVec(item.center[0],item.center[1]);
   const p=projectVec(v[0],v[1],v[2],R,cx,cy);
   if(p[2]<.07||p[0]<-70||p[0]>vw+70||p[1]<-24||p[1]>vh+24)continue;
   const rank=(zoom<10&&item.kind==='natural'?100-item.rank:item.rank);
   candidates.push({item,x:p[0],y:p[1],rank});
  }
  candidates.sort((a,b)=>b.rank-a.rank||a.item.name.localeCompare(b.item.name,'es'));
  ctx.save();
  ctx.textAlign='center';ctx.textBaseline='middle';
  try{
   for(const p of candidates){
    const item=p.item,size=item.kind==='natural'?11.4:item.kind==='historical'?11.2:10.2;
    ctx.font=(item.kind==='historical'?'italic ':'')+'600 '+size+'px system-ui';
    const label=item.name,tw=ctx.measureText(label).width;
    const rect=[p.x-tw/2-7,p.y-9,p.x+tw/2+7,p.y+9];
    if(lastBoxes.some(b=>!(rect[2]<b[0]||rect[0]>b[2]||rect[3]<b[1]||rect[1]>b[3])))continue;
    ctx.lineWidth=3;
    ctx.strokeStyle='rgba(7,18,28,.88)';ctx.strokeText(label,p.x,p.y);
    ctx.fillStyle=item.kind==='river'?'rgba(137,215,238,.91)':
      item.kind==='mountain'?'rgba(233,201,151,.93)':
      item.kind==='historical'?'rgba(215,219,235,.82)':
      'rgba(224,236,212,.93)';
    ctx.fillText(label,p.x,p.y);
    lastBoxes.push(rect);
   }
  }finally{ctx.restore()}
 }
 function cellInfo(lat,lon){
  const result=source.regionsAt(lat,lon);
  const naturalNames=result.natural.slice(0,4).map(r=>escapeHTML(r.name)).join(' · ');
  const historicalName=result.historical?.name||'';
  if(!naturalNames&&!historicalName)return '';
  return '<div class="atlasGeo0390">'+
    (naturalNames?'<div><b>Zonas naturales:</b> '+naturalNames+'</div>':'')+
    (historicalName?'<div><b>Ámbito histórico-cultural:</b> '+escapeHTML(historicalName)+'</div>':'')+
    '<small>Delimitaciones aproximadas; no representan fronteras políticas.</small>'+
   '</div>';
 }
 window.HexategosAtlasRegions0390=Object.freeze({
   version:'0.39.0',draw,cellInfo,occupied:()=>lastBoxes,
   regionsAt:source.regionsAt
 });
})();