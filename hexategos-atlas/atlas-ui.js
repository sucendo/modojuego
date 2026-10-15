'use strict';
// Capa única del Atlas: identificación exacta de L8 y nombres reales de GeoNames.
// Usa las variables de atlas-core.js, nunca los módulos de una partida.
function pointInsideCell(i,p){
 const L=loadLevel('8'),C=L.centers,F=L.faceCenters,A=L.adj,O=L.offsets;
 const s=O[i],e=O[i+1],n=e-s;if(n<3)return false;
 const ci=i*3,cx=C[ci]/32767,cy=C[ci+1]/32767,cz=C[ci+2]/32767;
 for(let k=0;k<n;k++){
  const ia=A[s+k]*3,ib=A[s+(k+1)%n]*3;
  const ax=F[ia]/32767,ay=F[ia+1]/32767,az=F[ia+2]/32767;
  const bx=F[ib]/32767,by=F[ib+1]/32767,bz=F[ib+2]/32767;
  const nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
  const dc=nx*cx+ny*cy+nz*cz,dp=nx*p.x+ny*p.y+nz*p.z;
  // La tolerancia debe ser RELATIVA al área del lado geodésico.
  // El umbral antiguo -2e-7 en dc*dp equivalía a aceptar casillas vecinas y
  // hasta ciudades a decenas de kilómetros como si fueran interiores.
  if(Math.abs(dc)>1e-12 && (dc>0?dp:-dp)<-Math.abs(dc)*1e-5)return false;
 }
 return true;
}
function cellLatLon(i){
 const C=loadLevel('8').centers,j=i*3,x=C[j]/32767,y=C[j+1]/32767,z=C[j+2]/32767;
 return {lat:Math.asin(clamp(y,-1,1))*DEG,lon:Math.atan2(x,z)*DEG};
}
function nearestDetailed(p){
 // Selección jerárquica real: grupo L5 -> hexágono L8, sin barrer 510.762 celdas.
 const coarse=loadLevel('5'),groups=loadGroups('5'),L=loadLevel('8'),C=coarse.centers;
 const top=[];
 for(let i=0;i<coarse.n;i++){
  const k=i*3,score=C[k]*p.x+C[k+1]*p.y+C[k+2]*p.z;
  if(top.length<12){top.push([score,i]);top.sort((a,b)=>b[0]-a[0]);}
  else if(score>top[11][0]){top[11]=[score,i];top.sort((a,b)=>b[0]-a[0]);}
 }
 const candidates=[],F=L.centers;
 for(const [,id] of top)for(let k=groups.offsets[id];k<groups.offsets[id+1];k++){
  const i=groups.ids[k],j=i*3;
  candidates.push([F[j]*p.x+F[j+1]*p.y+F[j+2]*p.z,i]);
 }
 candidates.sort((a,b)=>b[0]-a[0]);
 for(let j=0;j<Math.min(18,candidates.length);j++){
  const i=candidates[j][1];if(pointInsideCell(i,p))return i;
 }
 return candidates.length?candidates[0][1]:-1;
}
function drawAtlasSelection(R,cx,cy){
 if(!selected)return;
 const L=loadLevel('8'),i=selected.i,j=i*3,C=L.centers;
 const p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
 if(p[2]<.02)return;
 if(currentKey==='8'){
  const F=L.faceCenters,A=L.adj,O=L.offsets,s=O[i],e=O[i+1];ctx.beginPath();
  for(let k=s;k<e;k++){
   const f=A[k]*3,v=projectVec(F[f]/32767,F[f+1]/32767,F[f+2]/32767,R,cx,cy);
   if(k===s)ctx.moveTo(v[0],v[1]);else ctx.lineTo(v[0],v[1]);
  }
  ctx.closePath();ctx.fillStyle='rgba(249,206,119,.24)';ctx.fill();
  ctx.strokeStyle='rgba(255,237,174,.98)';ctx.lineWidth=2;ctx.stroke();
 }else{
  ctx.beginPath();ctx.arc(p[0],p[1],6,0,Math.PI*2);ctx.fillStyle='#f6d58f';ctx.fill();
  ctx.strokeStyle='#153041';ctx.lineWidth=2;ctx.stroke();
 }
}
function drawAtlasNames(R,cx,cy){
 labelDrawn=0;if(!showLabels||zoom<5.15||currentKey!=='8')return;
 const L=loadLevel('8'),visible=[];
 for(const cell of drawn){
  const i=cell[0],x=cell[1],y=cell[2],z=cell[3];
  if(z<.06||x<-80||x>vw+80||y<-30||y>vh+30||L.land[i]<0)continue;
  const dx=x-cx,dy=y-cy;
  visible.push({i,x,y,dist:dx*dx+dy*dy});
 }
 // Las consultas se escalonan por distancia en pantalla para evitar miles
 // de peticiones simultáneas; NO se excluyen localidades importantes del
 // dibujado por estar fuera del primer bloque de consultas.
 const byCenter=visible.slice().sort((a,b)=>a.dist-b.dist);
 const queryBudget=zoom>=24?1800:zoom>=12?1100:450;
 for(const v of byCenter.slice(0,queryBudget)){
  if(!nameCache.has(v.i))queueName(v.i);
 }
 const candidates=[];
 for(const v of visible){
  const report=nameCache.get(v.i);
  if(report?.kind!=='exact'||!report.options?.length)continue;
  const city=report.options[0];
  candidates.push({...v,city});
 }
 // Primacía de ciudades como Santiago, Toledo o Cartagena sobre las
 // pequeñas poblaciones colindantes. La titularidad del hexágono sigue
 // requiriendo pertenencia geodésica EXACTA.
 candidates.sort((a,b)=>b.city.population-a.city.population||a.dist-b.dist||a.i-b.i);
 const occupied=window.HexategosAtlasRegions0390?.occupied()?.slice()||[];
 ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font='600 '+clamp(8+Math.log2(zoom)*1.4,9,13)+'px system-ui';
 for(const {x,y,city} of candidates){
  const name=city.name.length>30?city.name.slice(0,29)+'…':city.name;
  const width=ctx.measureText(name).width,box=[x-width/2-5,y-10,x+width/2+5,y+10];
  if(occupied.some(b=>!(box[2]<b[0]||box[0]>b[2]||box[3]<b[1]||box[1]>b[3])))continue;
  occupied.push(box);labelDrawn++;
  ctx.lineWidth=3.1;ctx.strokeStyle='#071521ed';ctx.strokeText(name,x,y);
  ctx.fillStyle='#ffe1a5';ctx.fillText(name,x,y);
 }
}
function selectCell(i){
 if(i<0||!ready)return;selected={key:'8',i};updateInfo(i);invalidate();
}
function updateInfo(i){
 const host=$('detail'),L=loadLevel('8');
 if(i<0){host.innerHTML='<h2>Selecciona un hexágono</h2>';return;}
 if(L.land[i]<0){host.innerHTML='<small>Hexágono #'+i+'</small><h2>Océano</h2><p>Esta casilla es marítima.</p>';return;}
 const report=nameCache.get(i),geo=cellLatLon(i),tag='<small>Hexágono #'+i+' · '+geo.lat.toFixed(4)+'°, '+geo.lon.toFixed(4)+'°</small>'+
   (window.HexategosAtlasLandCover0391?.cellInfo(i)||'')+
   (window.HexategosAtlasRegions0390?.cellInfo(geo.lat,geo.lon)||'');
 if(!report){host.innerHTML=tag+'<h2>Consultando nombre…</h2>';queueName(i,true);return;}
 if(report.error){host.innerHTML=tag+'<h2>Error del atlas</h2><p>'+escapeHTML(report.error)+'</p>';return;}
 if(report.kind!=='exact'){
  // Una población cercana no se transforma en nombre propio de esta casilla.
  host.innerHTML=tag+'<h2>Sin localidad propia registrada</h2>'+
   '<span class="tag">Sin topónimo local en GeoNames</span>'+
   '<p>Este hexágono no contiene una localidad del atlas actual. No se le asigna automáticamente el nombre de Madrid ni de ninguna otra localidad vecina.</p>'+
   '<h3>Localidades próximas (solo referencia)</h3>'+
   (report.options.length?report.options.map((o,j)=>'<div class="alternative"><b>'+escapeHTML(o.name)+'</b><span>'+escapeHTML(o.country)+' · '+o.km.toFixed(1)+' km</span></div>').join(''):'<p>No se encontraron localidades cercanas.</p>');
  return;
 }
 const main=report.options[0];
 host.innerHTML=tag+'<h2>'+escapeHTML(main?main.name:'Sin localidad')+'</h2>'+
 '<span class="tag">Localidad dentro de este hexágono</span>'+
 (main&&main.history.length?'<p>Histórico: '+escapeHTML(main.history.join(' · '))+'</p>':'')+
 '<h3>Localidades de este hexágono</h3>'+
 report.options.map((o,j)=>'<div class="alternative"><b>'+(j+1)+'. '+escapeHTML(o.name)+'</b><span>'+escapeHTML(o.country)+' · '+o.km.toFixed(1)+' km del centro</span></div>').join('');
}
async function getJSON(path){
 const r=await fetch(atlasRoot+path,{cache:'force-cache'});if(!r.ok)throw Error('GeoNames: HTTP '+r.status+' · '+path);return r.json();
}
async function getMeta(){
 if(!metadataReady)metadataReady=Promise.all([
  getJSON('pplx-exclusions.json').catch(()=>null),
  getJSON('historical-names.json').catch(()=>null)
 ]).then(([x,h])=>{
  excludeRows=new Set((x&&x.rows||[]).map(r=>r[0]+'\u0001'+Number(r[1])+'\u0001'+Number(r[2])+'\u0001'+(r[3]||'')));
  historyNames=h&&h.records||{};
 });
 return metadataReady;
}
const excluded=row=>excludeRows.has(row[0]+'\u0001'+Number(row[1])+'\u0001'+Number(row[2])+'\u0001'+(row[4]||''));
const bandFor=lon=>clamp(Math.floor((wrapLon(lon)+180)/30),0,11);
async function band(i){
 i=(i+12)%12;
 if(!cityBandCache.has(i)){
  const p=getJSON('band-'+String(i).padStart(2,'0')+'.json').catch(e=>{cityBandCache.delete(i);throw e});
  cityBandCache.set(i,p);
 }
 return cityBandCache.get(i);
}
async function tile(lat,lon){
 if(lat<-90||lat>89)return [];lon=Math.floor(wrapLon(lon));
 return (await band(bandFor(lon+.5))).tiles?.[lat+','+lon]||[];
}
async function collect(lat,lon,radius){
 const lr=Math.min(42,radius/Math.max(.10,Math.cos(lat*RAD))),jobs=[];
 for(let y=Math.max(-90,Math.floor(lat-radius));y<=Math.min(89,Math.floor(lat+radius));y++)
  for(let x=Math.floor(lon-lr);x<=Math.floor(lon+lr);x++)jobs.push(tile(y,x));
 return (await Promise.all(jobs)).flat();
}
function haversine(a,b,c,d){
 const a1=a*RAD,a2=c*RAD;
 const k=Math.sin((a2-a1)/2)**2+Math.cos(a1)*Math.cos(a2)*Math.sin(wrapLon(d-b)*RAD/2)**2;
 return 12742*Math.asin(Math.min(1,Math.sqrt(k)));
}
function asName(row,lat,lon){
 return {name:row[0],country:row[4]||'',history:historyNames[(row[4]||'')+'|'+row[0]]||[],
  population:Number(row[3])||0,km:haversine(lat,lon,Number(row[1]),Number(row[2]))};
}
async function suggest(i){
 await getMeta();const {lat,lon}=cellLatLon(i),exact=[],seen=new Set();
 for(const row of await collect(lat,lon,.9)){
  if(excluded(row))continue;
  const key=row[0]+'|'+row[1]+'|'+row[2];if(seen.has(key))continue;seen.add(key);
  const xyz=lonLatVec(Number(row[2]),Number(row[1]));
  if(pointInsideCell(i,{x:xyz[0],y:xyz[1],z:xyz[2]}))exact.push(asName(row,lat,lon));
 }
 exact.sort((a,b)=>b.population-a.population||a.km-b.km||a.name.localeCompare(b.name,'es'));
 if(exact.length)return {kind:'exact',options:exact.slice(0,6)};
 for(const radius of [2,4,8,14]){
  const uniq=new Map();
  for(const row of await collect(lat,lon,radius)){
   if(excluded(row))continue;
   const k=row[0]+'|'+row[1]+'|'+row[2];
   if(!uniq.has(k))uniq.set(k,asName(row,lat,lon));
  }
  const near=[...uniq.values()].sort((a,b)=>a.km-b.km||b.population-a.population);
  if(near.length)return {kind:'nearby',options:near.slice(0,6)};
 }
 const all=await Promise.all(Array.from({length:12},(_,j)=>band(j))),near=[];
 for(const d of all)for(const rows of Object.values(d.tiles||{}))for(const row of rows)if(!excluded(row))near.push(asName(row,lat,lon));
 near.sort((a,b)=>a.km-b.km||b.population-a.population);
 return {kind:'nearby',options:near.slice(0,6)};
}
function queueName(i,priority=false){
 if(i<0||loadLevel('8').land[i]<0||nameCache.has(i))return;
 if(nameQueued.has(i)){
  // Si el usuario pulsa una casilla ya en cola, no debe esperar a todas las etiquetas automáticas.
  if(priority){const at=nameQueue.indexOf(i);if(at>0){nameQueue.splice(at,1);nameQueue.unshift(i);}}
  return;
 }
 if(!priority&&nameQueue.length>950)return;
 nameQueued.add(i);priority?nameQueue.unshift(i):nameQueue.push(i);pumpNames();
}
function pumpNames(){
 while(nameWorkers<4&&nameQueue.length){
  const i=nameQueue.shift();nameWorkers++;
  suggest(i).then(value=>nameCache.set(i,value)).catch(error=>nameCache.set(i,{error:error.message||String(error)})).finally(()=>{
   nameWorkers--;nameQueued.delete(i);
   if(selected&&selected.i===i)updateInfo(i);
   if(hoverID===i)showHover();
   invalidate();pumpNames();
  });
 }
}
function hideHover(){hoverID=-1;$('hover').hidden=true;}
function showHover(x,y){
 if(hoverID<0)return;
 const host=$('hover'),r=nameCache.get(hoverID);
 host.textContent=r?.kind==='exact'&&r.options?.[0]
  ?r.options[0].name
  :r?(r.error?'Error de consulta':'Sin localidad registrada · hexágono #'+hoverID)
    :'Hexágono #'+hoverID+' · buscando topónimo…';
 if(x!=null){host.style.left=clamp(x+14,4,Math.max(4,vw-245))+'px';host.style.top=clamp(y-20,4,Math.max(4,vh-68))+'px';}
 host.hidden=false;
}
const point=e=>{const b=canvas.getBoundingClientRect();return {x:e.clientX-b.left,y:e.clientY-b.top};};
function clickAt(x,y){
 const geo=screenGeo(x,y);if(!geo)return;selectCell(nearestDetailed(geo));
}
const pointers=new Map();let dragged=false,pinchStart=0,pinchZoom=1;
canvas.addEventListener('pointerdown',e=>{
 if(!ready)return;hideHover();canvas.setPointerCapture(e.pointerId);
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY,sx:e.clientX,sy:e.clientY,type:e.pointerType});
 dragged=false;
 if(pointers.size===2){const a=[...pointers.values()];pinchStart=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);pinchZoom=zoom;}
});
canvas.addEventListener('pointermove',e=>{
 const p=pointers.get(e.pointerId);
 if(!p){
  if(e.pointerType==='mouse'){clearTimeout(hoverTimer);const xy=point(e);
   hoverTimer=setTimeout(()=>{
    if(pointers.size)return;const geo=screenGeo(xy.x,xy.y);
    if(!geo){hideHover();return;}
    const i=nearestDetailed(geo);
    if(i<0||loadLevel('8').land[i]<0){hideHover();return;}
    hoverID=i;showHover(xy.x,xy.y);queueName(i,true);
   },170);
  }
  return;
 }
 p.x=e.clientX;p.y=e.clientY;
 if(pointers.size===1){
  const dx=p.x-p.px,dy=p.y-p.py;
  if(Math.hypot(p.x-p.sx,p.y-p.sy)>(p.type==='touch'?9:7))dragged=true;
  yaw+=dx/(Math.min(vw,vh)*.48*zoom);pitch+=dy/(Math.min(vw,vh)*.48*zoom);
  pitch=clamp(pitch,-Math.PI/2,Math.PI/2);p.px=p.x;p.py=p.y;invalidate();
 }else if(pointers.size===2){
  const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
  zoom=clamp(pinchZoom*d/Math.max(20,pinchStart),.62,40);invalidate();
 }
});
canvas.addEventListener('pointerup',e=>{
 const p=pointers.get(e.pointerId);
 if(p&&!dragged&&pointers.size===1){const xy=point(e);clickAt(xy.x,xy.y);}
 pointers.delete(e.pointerId);
});
canvas.addEventListener('pointercancel',e=>pointers.delete(e.pointerId));
canvas.addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);hideHover();});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.00175),.62,40);hideHover();invalidate();},{passive:false});
canvas.addEventListener('dblclick',e=>{e.preventDefault();zoom=clamp(zoom*1.8,.62,40);invalidate();});
$('plus').onclick=()=>{zoom=clamp(zoom*1.5,.62,40);invalidate();};
$('minus').onclick=()=>{zoom=clamp(zoom/1.5,.62,40);invalidate();};
$('iberia').onclick=()=>rotateToGeo(-3.7,40.4,22);
$('europe').onclick=()=>rotateToGeo(13.0,50.5,3.0);
$('world').onclick=()=>rotateToGeo(-3.7,40.4,1);
$('grid').onchange=e=>{showGrid=e.target.checked;invalidate();};
$('names').onchange=e=>{showLabels=e.target.checked;invalidate();};
$('regions').onchange=invalidate;
$('regionMode').onchange=invalidate;
$('rivers').onchange=invalidate;
$('mountains').onchange=invalidate;
async function search(){
 const input=$('search').value.trim();if(!input)return;
 const m=input.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/);
 if(m){const lat=Number(m[1]),lon=Number(m[2]);
  if(Math.abs(lat)<=90&&Math.abs(lon)<=180){
   rotateToGeo(lon,lat,30);const v=lonLatVec(lon,lat);selectCell(nearestDetailed({x:v[0],y:v[1],z:v[2]}));return;
  }
 }
 const box=$('searchResults');box.hidden=false;box.innerHTML='<p>Buscando en GeoNames…</p>';
 try{
  await getMeta();const q=normalize(input),all=await Promise.all(Array.from({length:12},(_,i)=>band(i))),results=[];
  for(const b of all)for(const rows of Object.values(b.tiles||{}))
   for(const row of rows)if(!excluded(row)&&normalize(row[0]).includes(q))results.push(row);
  results.sort((a,b)=>Number(b[3]||0)-Number(a[3]||0));
  box.replaceChildren();
  for(const row of results.slice(0,15)){
   const btn=document.createElement('button');btn.className='result';btn.textContent=row[0]+' · '+row[4];
   btn.onclick=()=>{const lat=Number(row[1]),lon=Number(row[2]);rotateToGeo(lon,lat,30);
    const v=lonLatVec(lon,lat);selectCell(nearestDetailed({x:v[0],y:v[1],z:v[2]}));box.hidden=true;
   };
   box.appendChild(btn);
  }
  if(!results.length)box.textContent='No se encontraron localidades.';
 }catch(err){box.textContent='Error: '+err.message;}
}
$('searchBtn').onclick=search;$('search').addEventListener('keydown',e=>{if(e.key==='Enter')search();});
for(const btn of document.querySelectorAll('[data-place]'))btn.onclick=()=>{
 const [lat,lon]=btn.dataset.place.split(',').map(Number);rotateToGeo(lon,lat,30);
 const p=lonLatVec(lon,lat);selectCell(nearestDetailed({x:p[0],y:p[1],z:p[2]}));
};
function progress(message,n){$('loadText').textContent=message;$('bar').style.width=n+'%';}
function loadScript(src){
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=ROOT+src;script.onload=resolve;
  script.onerror=()=>reject(Error('No se pudo cargar '+src));
  document.head.appendChild(script);
 });
}
async function init(){
 try{
  progress('Cargando la malla original desde Hexategos Pruebas…',2);
  await loadScript('js/vendor/pako.min.js');await loadScript('data/bootstrap.js');
  for(const key of ['3','4','5','6'])await loadScript('data/mesh-'+key+'.js');
  progress('Cargando grupos geodésicos originales…',17);
  for(const key of ['3','4','5','6'])await loadScript('data/groups-'+key+'.js');
  await loadScript('data/mesh-8-init.js');
  const parts=['centers-01','centers-02','faceCenters-01','faceCenters-02','faceCenters-03','offsets-01','adj-01','adj-02','edgeNbr-01','edgeNbr-02','land-01'];
  for(let j=0;j<parts.length;j++){
   progress('Malla L8 original · '+(j+1)+' / '+parts.length,22+j/parts.length*58);
   await loadScript('data/mesh-8-'+parts[j]+'.js');
  }
  progress('Inicializando terreno físico y cordilleras…',84);
  const L=loadLevel('8');owner6=L.land;mountainTier3212=new Uint8Array(L.n);
  for(let i=0;i<MOUNTAIN_CELL_PAIRS3242.length;i+=2)
   mountainTier3212[MOUNTAIN_CELL_PAIRS3242[i]]=MOUNTAIN_CELL_PAIRS3242[i+1];
  await getMeta();
  progress('Preparando topónimos originales…',98);
  ready=true;resize();rotateToGeo(-3.7,40.4,1);
  $('loading').hidden=true;invalidate();
 }catch(err){
  progress('ERROR: '+err.message,100);$('loading').classList.add('error');
  console.error('[Hexategos Atlas]',err);
 }
}
new ResizeObserver(resize).observe(canvas);
init();