'use strict';
/* HEXATEGOS ATLAS · Etiquetas geográficas compartidas v0.39.5.
 * Se utilizan los datos políticos de Hexategos Pruebas y las nuevas unidades
 * naturales ibéricas; las fronteras naturales son APROXIMADAS y nunca cambian
 * la propiedad de los hexágonos ni afectan a una partida.
 */
(function(){
 const source=window.HexategosGeoRegions0390;
 const europe=window.HexategosEuropeRegions0395;
 const detail=window.HexategosEuropeDetail0396;
 const lakes=window.HexategosEuropeLakes0396;
 const supplemental=window.HexategosEuropeSecondary0396;
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
 const historical=historicalLabels().concat((europe?.historicalLabels||[]).map(x=>({
  name:x.name,center:x.center,kind:'historical',rank:56,minZoom:5.5
 })));
 const physical=window.HEXATEGOS_IBERIA_PHYSICAL_V1;
 const natural=source.physicalRegions.concat(europe?.naturalRegions||[],detail?.naturalRegions||[]).map(reg=>({
   name:reg.name,center:reg.center,kind:'natural',
   rank:reg.priority,
   minZoom:reg.minZoom||(europe?.naturalRegions.includes(reg)?
     (reg.priority<=75?2.8:reg.priority<=85?5.2:8):
     (reg.priority>=95?11:reg.priority>=80?8:reg.priority>=70?6:4.8))
 }));
 const features=[];
 if(lakes){
  for(const lake of lakes.lakes){
   const axis=lake.axis,mid=axis[Math.floor(axis.length*.5)];
   features.push({name:lake.name,center:mid,kind:'lake',rank:74,
    minZoom:Math.max(7,lake.minZoom+1.7)});
  }
 }
 // Los accidentes secundarios aparecen al aproximarse al territorio;
 // sus rótulos no alteran ni sustituyen las geometrías canónicas.
 if(supplemental){
  for(const item of supplemental.rivers){
   features.push({name:item.name,center:item.points[Math.floor(item.points.length*.52)],
     kind:'river',rank:52,minZoom:item.minZoom+1.5});
  }
  for(const item of supplemental.mountains){
   features.push({name:item.name,center:item.points[Math.floor(item.points.length*.52)],
     kind:'mountain',rank:54,minZoom:item.minZoom+1});
  }
 }
 let europeFeatures=null;
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
 // Añadir los nombres de los accidentes ya dibujados por la malla
 // canónica, sin inventar segundas geometrías. Inicialización perezosa:
 // no hay acceso a L8 antes de finalizar la carga asíncrona de Atlas.
 function europeanFeatures(){
  if(europeFeatures)return europeFeatures;
  europeFeatures=[];
  const iberian=new Set((physical?.rivers||[]).concat(physical?.mountains||[]).map(x=>x.name));
  const L=loadLevel('8'),F=L.faceCenters;
  function midpoint(sys){
   const edges=sys.edges;
   if(!edges?.length)return null;
   const id=edges[Math.floor(edges.length*.49)],e=physicalEdge3242(id);
   if(!e||e.u<0||e.v<0)return null;
   const a=e.u*3,b=e.v*3;
   const x=(F[a]+F[b])/65534,y=(F[a+1]+F[b+1])/65534,z=(F[a+2]+F[b+2])/65534;
   const lat=Math.asin(Math.max(-1,Math.min(1,y)))*180/Math.PI;
   const lon=Math.atan2(x,z)*180/Math.PI;
   if(lat<35||lat>73||lon< -25||lon>61)return null;
   return [lon,lat];
  }
  for(const [collection,kind] of [
    [MAP_RIVERS3242,'river'],[MOUNTAIN_NETWORKS3242,'mountain']]){
   for(const sys of collection){
    if(iberian.has(sys.n)||sys.branch)continue;
    const point=midpoint(sys);
    if(!point)continue;
    europeFeatures.push({name:sys.n,center:point,kind,
      rank:kind==='mountain'?68:64,minZoom:kind==='mountain'?9.5:10.5});
   }
  }
  return europeFeatures;
 }
 function draw(R,cx,cy){
  lastBoxes=window.HexategosAtlasMacro0396?.occupied()?.slice()||[];
  if(!enabled()||zoom<2.1)return;
  const displayMode=mode();
  let pool=[];
  if(displayMode!=='historical')pool=pool.concat(natural,features,europeanFeatures());
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
    ctx.fillStyle=item.kind==='river'||item.kind==='lake'?'rgba(137,215,238,.91)':
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
  const local=(europe?.naturalAt(lat,lon)||[]).concat(detail?.naturalAt(lat,lon)||[]);
  const naturalNames=result.natural.concat(local).slice(0,5).map(r=>escapeHTML(r.name)).join(' · ');
  const historicalName=result.historical?.name||europe?.historicalAt(lat,lon)?.name||'';
  const nearbyLakes=lakes?.nearby(lat,lon)||[];
  if(!naturalNames&&!historicalName&&!nearbyLakes.length)return '';
  return '<div class="atlasGeo0390">'+
    (naturalNames?'<div><b>Zonas naturales:</b> '+naturalNames+'</div>':'')+
    (historicalName?'<div><b>Ámbito histórico-cultural:</b> '+escapeHTML(historicalName)+'</div>':'')+
    (nearbyLakes.length?'<div><b>Lagos próximos:</b> '+nearbyLakes.map(escapeHTML).join(' · ')+'</div>':'')+
    '<small>Delimitaciones aproximadas; no representan fronteras políticas.</small>'+
   '</div>';
 }
 window.HexategosAtlasRegions0390=Object.freeze({
   version:'0.39.6',draw,cellInfo,occupied:()=>lastBoxes,
   regionsAt:(lat,lon)=>{
    const old=source.regionsAt(lat,lon);
    return {natural:old.natural.concat(europe?.naturalAt(lat,lon)||[],detail?.naturalAt(lat,lon)||[]),
      historical:old.historical||europe?.historicalAt(lat,lon)||null};
   }
 });
})();