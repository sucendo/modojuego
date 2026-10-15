'use strict';
/* HEXATEGOS ATLAS · Etiquetas geográficas compartidas v0.39.5.
 * Se utilizan los datos políticos de Hexategos Pruebas y las nuevas unidades
 * naturales ibéricas; las fronteras naturales son APROXIMADAS y nunca cambian
 * la propiedad de los hexágonos ni afectan a una partida.
 */
(function(){
 const source=window.HexategosGeoRegions0390;
 const europe=window.HexategosEuropeRegions0395;
 const asia=window.HexategosAsiaRegions0401;
 const detail=window.HexategosEuropeDetail0396;
 const lakes=window.HexategosEuropeLakes0396;
 const supplemental=window.HexategosEuropeSecondary0396;
 const straits=window.HexategosAtlasStraits0397;
 const westAsiaData=window.HexategosWestAsiaPhysical0403;
 const westAsia=window.HexategosWestAsia0403;
 const centralData=window.HexategosCentralAsiaPhysical0404;
 const central=window.HexategosCentralAsia0404;
 const himalayaData=window.HexategosHimalayaPhysical0406;
 const himalaya=window.HexategosHimalaya0406;
 const peninsula=window.HexategosPeninsularIndiaPhysical0409;
 const peninsulaRoutes=window.HexategosPeninsularIndia0409;
 const sri=window.HexategosSriLankaPhysical0411;
 const sriRelief=window.HexategosSriLanka0411;
 const sriPlacement=window.HexategosSriLankaPlacement0411;
 const myanmar=window.HexategosMyanmarPhysical0412;
 const myanmarRender=window.HexategosMyanmarRender0412;
 const indiaHydro=window.HexategosPeninsularHydro0410;
 const indiaRivers=window.HexategosPeninsularHydroRender0410;
 const indianHydro=window.HexategosSubcontinentHydro0407;
 const indianRivers=window.HexategosSubcontinentRivers0407;
 const deltas=window.HexategosIndianDeltas0408;
 const deltaRoutes=window.HexategosIndianDeltaRoutes0408;
 const labelStyle=window.HexategosAtlasLabelStyle0399;
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
 const baseNatural=source.physicalRegions.concat(europe?.naturalRegions||[],
  detail?.naturalRegions||[],asia?.naturalRegions||[]);
 const knownNatural=new Set(baseNatural.map(x=>x.name.toLocaleLowerCase('es-ES')));
 const additionalNatural=(himalayaData?.reliefRegions||[])
  .concat(indianHydro?.basins||[],deltas?.areas||[],peninsula?.regions||[],indiaHydro?.regions||[],sri?.regions||[],myanmar?.regions||[])
  .filter(reg=>{
   const key=reg.name.toLocaleLowerCase('es-ES');
   if(knownNatural.has(key))return false;
   knownNatural.add(key);return true;
  })
  .map(r=>({...r,kind:'land'}));
 const natural=baseNatural.concat(additionalNatural).map(reg=>({
   name:reg.name,center:reg.center,kind:reg.kind==='mountain'?'mountain':'natural',
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
 // Oriente Próximo: un solo origen de rótulos para accidentes añadidos.
 // Los ríos y montañas sólo se etiquetan cuando tienen ruta L8 válida.
 if(westAsiaData){
  for(const [items,kind] of [[westAsiaData.rivers,'river'],[westAsiaData.mountains,'mountain']]){
   for(const item of items){
    if(natural.some(r=>r.name===item.name))continue;
    features.push({name:item.name,center:item.points[Math.floor(item.points.length*.5)],
     kind,rank:kind==='river'?58:60,minZoom:item.minZoom+1,westAsia:true});
   }
  }
  for(const lake of westAsiaData.lakes){
   features.push({name:lake.name,center:lake.axis[Math.floor(lake.axis.length*.5)],
    kind:'lake',rank:68,minZoom:lake.minZoom+1,westAsia:true});
  }
 }
 // Asia Central: las etiquetas de cauces/cadenas se condicionan a que
 // realmente exista una ruta sobre aristas terrestres L8.
 if(centralData){
  for(const [items,kind] of [[centralData.rivers,'river'],[centralData.mountains,'mountain']]){
   for(const item of items){
    if(natural.some(r=>r.name===item.name))continue;
    features.push({name:item.name,center:item.points[Math.floor(item.points.length*.5)],
     kind,rank:kind==='river'?61:67,minZoom:item.minZoom+.7,centralAsia:true});
   }
  }
  const names=new Set();
  for(const lake of centralData.waterBodies){
   if(names.has(lake.displayName))continue;
   names.add(lake.displayName);
   const coords=lake.components[0];
   features.push({name:lake.displayName,center:coords.slice(0,2),kind:'lake',
    rank:77,minZoom:Math.max(8.6,lake.minZoom+1.4),centralBody:lake.name});
  }
  // Unidades de relieve y cobertura: las presentes en el catálogo
  // asiático global se conservan allí para no duplicar rótulos.
  for(const label of centralData.reliefBasins||[]){
   if(natural.some(x=>x.name===label.name)||
      centralData.basins.some(x=>x.name===label.name))continue;
   features.push({name:label.name,center:label.center,kind:'natural',
    rank:label.priority,minZoom:label.minZoom,centralRegion:true});
  }
  for(const label of centralData.basins.filter(x=>x.kind==='land')){
   features.push({name:label.name,center:label.center,kind:'natural',
    rank:label.priority,minZoom:label.minZoom});
  }
 }
 // Himalaya: secundarios sólo si la red L8 está resuelta;
 // los padres canónicos y topónimos ya presentes no se duplican.
 if(himalayaData){
  for(const item of himalayaData.mountains){
   if(natural.some(n=>n.name.toLocaleLowerCase('es-ES')===
       item.name.toLocaleLowerCase('es-ES')))continue;
   features.push({name:item.name,
    center:item.points[Math.floor(item.points.length*.5)],
    kind:'mountain',rank:65,minZoom:item.minZoom+.7,himalayaMountain:true});
  }
  for(const body of himalayaData.waterBodies){
   features.push({name:body.displayName,center:body.components[0].slice(0,2),
    kind:'lake',rank:77,minZoom:body.minZoom+.45,
    himalayaBody:body.name});
  }
 }
 // Indo, Ganges, Brahmaputra y Yamuna ya tienen rutas L8 canónicas.
 // Etiquetar sin volver a generar ni sobrepintar los cauces madre.
 if(indianHydro){
  const trunkAnchors={
   Indo:[70.6,29.5],Ganges:[83.2,25.5],
   Brahmaputra:[92.2,26.3],Yamuna:[79.5,27.6]
  };
  for(const item of indianHydro.trunk){
   if(typeof MAP_RIVERS3242==='undefined'||
     !MAP_RIVERS3242.some(sys=>sys.n===item.name))continue;
   if(features.some(x=>x.name===item.name))continue;
   features.push({name:item.name,center:trunkAnchors[item.name],
    kind:'river',rank:84,minZoom:7.8,indianTrunk:true});
  }
  for(const item of indianHydro.rivers){
   features.push({name:item.name,
    center:item.points[Math.floor(item.points.length*.47)],
    kind:'river',rank:68,minZoom:item.minZoom+.65,
    indianTributary:true});
  }
 }
 // India peninsular: Ghats canónicos NO se duplican. Sólo se etiqueta
 // el relieve que está realmente en el trazado L8 o en redes canónicas.
 if(peninsula)for(const item of peninsula.mountains){
  if(features.some(x=>x.name.toLocaleLowerCase('es-ES')===
      item.name.toLocaleLowerCase('es-ES')))continue;
  features.push({name:item.name,
   center:item.points[Math.floor(item.points.length*.5)],
   kind:'mountain',rank:item.canonicalParent?76:71,
   minZoom:item.minZoom+.6,peninsulaMountain:true});
 }
 // India peninsular: etiquetas de ríos sólo si existe ruta L8.
 // No se inventa geometría: cabeceras, afluentes y deltas verificables.
 if(indiaHydro){
  for(const [items,kind] of [[indiaHydro.main,'main'],[indiaHydro.tributaries,'tributary'],
    [indiaHydro.deltas,'delta']]){
   for(const item of items){
    if(features.some(x=>x.name.toLocaleLowerCase('es-ES')===
      item.name.toLocaleLowerCase('es-ES')))continue;
    features.push({name:item.name,
     center:item.points[Math.floor(item.points.length*.54)],
     kind:'river',rank:kind==='main'?83:kind==='tributary'?64:56,
     minZoom:item.minZoom+(kind==='main'?.6:.8),indiaRiver:true});
   }
  }
 }
 // Sri Lanka: nombres de montaña sólo si la ruta L8 existe;
 // islas y pasos marinos sólo si la malla contiene el tipo apropiado
 // de hexágono. La ubicación se ajusta a su centro nativo.
 if(sri){
  for(const item of sri.mountains){
   if(features.some(f=>f.name===item.name))continue;
   features.push({name:item.name,
    center:item.points[Math.floor(item.points.length*.5)],
    kind:'mountain',rank:72,minZoom:item.minZoom+.5,sriMountain:true});
  }
  for(const item of sri.peaks)
   features.push({name:item.name,center:item.center,kind:'mountain',
    sriFeature:true,sriKind:'peak',rank:76,minZoom:item.minZoom});
  for(const item of sri.marine)
   features.push({name:item.name,center:item.center,
    kind:item.kind==='shoal'?'strait':item.kind,
    sriFeature:true,sriKind:'marine',rank:item.rank,minZoom:item.minZoom});
  for(const item of sri.islands)
   features.push({name:item.name,center:item.center,kind:'island',
    sriFeature:true,sriKind:'island',rank:item.rank,minZoom:item.minZoom});
 }
 // Myanmar: trazados efectivos sobre la malla L8 real;
 // padres canónicos Salween/Mekong/Arakan Yoma sin sobreimpresión.
 if(myanmar){
  const known=new Set(features.map(x=>x.name.toLocaleLowerCase('es-ES')));
  for(const item of myanmar.mountains){
   const name=item.name.toLocaleLowerCase('es-ES');
   if(known.has(name))continue;
   known.add(name);
   features.push({name:item.name,
    center:item.points[Math.floor(item.points.length*.52)],
    kind:'mountain',rank:73,minZoom:item.minZoom+.6,
    myanmarFeature:true});
  }
  for(const [items,kind] of [[myanmar.rivers,'river'],
    [myanmar.tributaries,'tributary'],[myanmar.distributaries,'distributary']]){
   for(const item of items){
    const name=item.name.toLocaleLowerCase('es-ES');
    if(known.has(name))continue;
    known.add(name);
    features.push({name:item.name,
     center:item.points[Math.floor(item.points.length*.53)],
     kind:'river',rank:kind==='river'?84:kind==='tributary'?65:56,
     minZoom:item.minZoom+(kind==='river'?.65:.8),
     myanmarFeature:true});
   }
  }
  // Salween y Mekong están ya en la red original y sólo se etiquetan.
  for(const x of [
   {name:'Salween',center:[98.5,20.8],minZoom:7.2},
   {name:'Mekong',center:[100.62,21.15],minZoom:7.5}
  ]){
   if(known.has(x.name.toLocaleLowerCase('es-ES')))continue;
   if(typeof MAP_RIVERS3242!=='undefined'&&MAP_RIVERS3242.some(m=>m.n===x.name))
    features.push({...x,kind:'river',rank:80,canonicalMyanmar:true});
  }
 }
 // Deltas: rotular sólo brazos que llegan a un vértice litoral L8.
 if(deltas)for(const item of deltas.channels){
  features.push({name:item.name,center:item.waypoints[Math.floor(item.waypoints.length/2)]||item.join,
   kind:'river',rank:57,minZoom:item.minZoom+.5,deltaChannel:true});
 }
 // Los grandes cauces del Oriente Próximo ya existen en la malla
 // canónica; aquí sólo se muestra su nombre, no se duplica el trazado.
 for(const item of [
  {name:'Tigris',center:[44.5,35.2],kind:'river',rank:83,minZoom:7.1},
  {name:'Éufrates',center:[42.5,35.0],kind:'river',rank:84,minZoom:7.1}
 ]){
  if(MAP_RIVERS3242.some(sys=>sys.n===item.name))features.push(item);
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
  if(displayMode!=='historical')pool=pool.concat(natural,features,europeanFeatures(),straits?.features||[]);
  if(displayMode!=='natural')pool=pool.concat(historical);
  const candidates=[];
  const handoffZoom=window.HexategosAtlasMacro0396?.handoffZoom||5.55;
  for(const item of pool){
   if(zoom<item.minZoom)continue;
   // Solo regiones pequeñas a partir del relevo continental.
   if((item.kind==='natural'||item.kind==='historical')&&zoom<handoffZoom)continue;
   // No rotular masas de agua que la malla no puede representar.
   if(item.kind==='lake'&&!item.centralBody&&!item.himalayaBody&&!lakes?.isDrawn?.(item.name)&&!westAsia?.isDrawn?.(item.name))continue;
   if(item.centralBody&&!central?.isBodyDrawn?.(item.centralBody))continue;
   if(item.himalayaBody&&!window.HexategosHimalayaWater0406?.isBodyDrawn?.(item.himalayaBody))continue;
   if(item.himalayaMountain&&!himalaya?.isDrawnFeature?.(item.name))continue;
   if(item.peninsulaMountain&&!peninsulaRoutes?.isDrawnFeature?.(item.name))continue;
   if(item.sriMountain&&!sriRelief?.isDrawnFeature?.(item.name))continue;
   if(item.myanmarFeature&&!myanmarRender?.isDrawnFeature?.(item.name))continue;
   if(item.sriFeature&&!sriPlacement?.valid(item))continue;
   if(item.indiaRiver&&!indiaRivers?.isDrawnFeature?.(item.name))continue;
   if(item.indianTributary&&!indianRivers?.isDrawnFeature?.(item.name))continue;
   if(item.deltaChannel&&!deltaRoutes?.isDrawnFeature?.(item.name))continue;
   if(item.centralAsia&&!central?.isDrawnFeature?.(item.name))continue;
   if(item.westAsia&&item.kind!=='lake'&&!westAsia?.isDrawnFeature?.(item.name))continue;
   if(!item.sriFeature&&(item.kind==='island'||item.kind==='strait'||item.kind==='archipelago'||item.kind==='marine')&&!straits?.valid(item))continue;
   if(item.kind==='river'&&!$('rivers')?.checked)continue;
   if(item.kind==='mountain'&&!$('mountains')?.checked)continue;
   if(item.kind==='lake'&&!$('lakes')?.checked)continue;
   const center=item.sriFeature?sriPlacement.centerFor(item):item.center;
   if(!center)continue;
   const v=lonLatVec(center[0],center[1]);
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
    const item=p.item,size=item.kind==='natural'||item.kind==='archipelago'?11.4:item.kind==='historical'?11.2:10.2;
    ctx.font=(item.kind==='historical'||item.kind==='strait'?'italic ':'')+'600 '+size+'px system-ui';
    const label=item.name,tw=ctx.measureText(label).width;
    const rect=[p.x-tw/2-7,p.y-9,p.x+tw/2+7,p.y+9];
    if(lastBoxes.some(b=>!(rect[2]<b[0]||rect[0]>b[2]||rect[3]<b[1]||rect[1]>b[3])))continue;
    ctx.lineWidth=3;
    ctx.strokeStyle='rgba(7,18,28,.88)';ctx.strokeText(label,p.x,p.y);
    ctx.fillStyle=labelStyle.color(item,item.kind==='historical'?.86:.94);
    ctx.fillText(label,p.x,p.y);
    lastBoxes.push(rect);
   }
  }finally{ctx.restore()}
 }
 function cellInfo(lat,lon){
  const result=source.regionsAt(lat,lon);
  const local=(europe?.naturalAt(lat,lon)||[]).concat(detail?.naturalAt(lat,lon)||[],asia?.naturalAt(lat,lon)||[]);
  const naturalNames=result.natural.concat(local,centralData?.regionsNear(lon,lat)||[],himalayaData?.regionsNear(lon,lat)||[],indianHydro?.regionsNear(lon,lat)||[],deltas?.regionsNear(lon,lat)||[],peninsula?.regionsNear(lon,lat)||[],indiaHydro?.regionsNear(lon,lat)||[],sri?.regionsNear(lon,lat)||[],myanmar?.regionsNear(lon,lat)||[])
   .filter((v,i,a)=>a.findIndex(x=>x.name.toLocaleLowerCase('es-ES')===v.name.toLocaleLowerCase('es-ES'))===i)
   .slice(0,5).map(r=>escapeHTML(r.name)).join(' · ');
  const historicalName=result.historical?.name||europe?.historicalAt(lat,lon)?.name||'';
  const nearbyLakes=(lakes?.nearby(lat,lon)||[]).concat(westAsia?.nearby(lat,lon)||[],central?.nearby(lat,lon)||[],window.HexategosHimalayaWater0406?.nearby(lat,lon)||[]);
  if(!naturalNames&&!historicalName&&!nearbyLakes.length)return '';
  return '<div class="atlasGeo0390">'+
    (naturalNames?'<div><b>Zonas naturales:</b> '+naturalNames+'</div>':'')+
    (historicalName?'<div><b>Ámbito histórico-cultural:</b> '+escapeHTML(historicalName)+'</div>':'')+
    (nearbyLakes.length?'<div><b>Lagos próximos:</b> '+nearbyLakes.map(escapeHTML).join(' · ')+'</div>':'')+
    '<small>Delimitaciones aproximadas; no representan fronteras políticas.</small>'+
   '</div>';
 }
 window.HexategosAtlasRegions0390=Object.freeze({
   version:'0.39.9',draw,cellInfo,occupied:()=>lastBoxes,
   regionsAt:(lat,lon)=>{
    const old=source.regionsAt(lat,lon);
    const areas=old.natural.concat(europe?.naturalAt(lat,lon)||[],
     detail?.naturalAt(lat,lon)||[],asia?.naturalAt(lat,lon)||[],
     centralData?.regionsNear(lon,lat)||[],himalayaData?.regionsNear(lon,lat)||[],indianHydro?.regionsNear(lon,lat)||[],deltas?.regionsNear(lon,lat)||[],peninsula?.regionsNear(lon,lat)||[],indiaHydro?.regionsNear(lon,lat)||[],sri?.regionsNear(lon,lat)||[],myanmar?.regionsNear(lon,lat)||[]);
    return {natural:areas.filter((v,i,a)=>a.findIndex(x=>
      x.name.toLocaleLowerCase('es-ES')===v.name.toLocaleLowerCase('es-ES'))===i),
      historical:old.historical||europe?.historicalAt(lat,lon)||null};
   }
 });
})();