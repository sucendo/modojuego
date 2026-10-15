'use strict';
/* HEXATEGOS ATLAS 0.39.9 — refinamiento físico europeo, solo visual.
 * La malla y la propiedad tierra/mar L8 nunca se escriben ni se modifican.
 * Tierra y mar complementarios proceden de los polígonos Natural Earth 1:50m.
 * No se añaden canales lineales ni se inventan navegaciones para el juego.
 */
(function(){
 const data=window.HexategosAtlasCoastData0399;
 if(!data){console.warn('[Atlas] No hay geometría litoral complementaria');return}
 const [west,south,east,north]=data.bounds;
 const tiles=data.tiles.map(t=>({lon:t[0],lat:t[1],rings:t[2]}));
 const diagnostics={version:'0.39.9',source:data.source,tiles:tiles.length,drawnTiles:0,
   landCells:0,seaCells:0,enabled:false,lastMs:0};
 const landFill='rgba(87,105,76,.98)',seaFill='rgba(22,55,76,.99)';
 // Consulta ligera de la tierra real para validar rótulos sobre estrechos
 // que la máscara L8 clasifica como terrestres (o islas en casillas marinas).
 function inRing(lon,lat,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i],b=ring[j];
   if((a[1]>lat)!==(b[1]>lat)&&
     lon<(b[0]-a[0])*(lat-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
 }
 function landAt(lon,lat){
  if(!onEurope(lon,lat))return null;
  const tile=tiles.find(t=>lon>=t.lon&&lon<t.lon+data.tileSize&&
    lat>=t.lat&&lat<t.lat+data.tileSize);
  if(!tile)return false;
  let land=false;
  for(const ring of tile.rings)if(inRing(lon,lat,ring))land=!land;
  return land;
 }
 function enabled(){return zoom>=7.4&&currentKey==='8'}
 function onEurope(lon,lat){return lon>=west&&lon<east&&lat>=south&&lat<north}
 function projected(lon,lat,R,cx,cy){
  const xyz=lonLatVec(lon,lat);
  return projectVec(xyz[0],xyz[1],xyz[2],R,cx,cy);
 }
 function visible(tile,R,cx,cy){
  const p=projected(tile.lon+2.5,tile.lat+2.5,R,cx,cy);
  const margin=R*.105+60;
  return p[2]>.035&&p[0]>=-margin&&p[0]<=vw+margin&&
    p[1]>=-margin&&p[1]<=vh+margin;
 }
 function ringPath(r,R,cx,cy){
  for(let i=0;i<r.length;i++){
   const p=projected(r[i][0],r[i][1],R,cx,cy);
   if(i===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
  }
  ctx.closePath();
 }
 function tileBorder(tile,R,cx,cy){
  const x=tile.lon,y=tile.lat,size=data.tileSize,steps=10;
  let first=true;
  for(let side=0;side<4;side++){
   for(let j=0;j<=steps;j++){
    const t=j/steps;
    const lon=side===0?x+size*t:side===1?x+size:
      side===2?x+size*(1-t):x;
    const lat=side===0?y:side===1?y+size*t:
      side===2?y+size:y+size*(1-t);
    const p=projected(lon,lat,R,cx,cy);
    if(first){ctx.moveTo(p[0],p[1]);first=false}
    else ctx.lineTo(p[0],p[1]);
   }
  }
  ctx.closePath();
 }
 function cellMask(ids,L,R,cx,cy){
  ctx.beginPath();
  const F=L.faceCenters,off=L.offsets,adj=L.adj;
  for(const id of ids){
   const s=off[id],e=off[id+1];
   if(e-s<3)continue;
   for(let k=s;k<e;k++){
    const n=adj[k]*3,p=projectVec(F[n]/32767,F[n+1]/32767,
      F[n+2]/32767,R,cx,cy);
    if(k===s)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
   }
   ctx.closePath();
  }
  ctx.clip();
 }
 // El agua se pinta SOLO dentro de hexágonos que L8 considera terrestres.
 // El relleno evenodd sustrae todas las tierras reales del cuadro geográfico.
 function drawSeaOnLand(active,L,ids,R,cx,cy){
  if(!ids.length)return;
  ctx.save();
  try{
   cellMask(ids,L,R,cx,cy);
   ctx.fillStyle=seaFill;
   for(const tile of active){
    ctx.beginPath();tileBorder(tile,R,cx,cy);
    for(const ring of tile.rings)ringPath(ring,R,cx,cy);
    ctx.fill('evenodd');
   }
  }finally{ctx.restore()}
 }
 // Y solo en las casillas marítimas se recuperan las islas o trozos de
 // litoral real omitidos por la resolución canónica. No toca L8.land.
 function drawLandOnSea(active,L,ids,R,cx,cy){
  if(!ids.length)return;
  ctx.save();
  try{
   cellMask(ids,L,R,cx,cy);
   ctx.fillStyle=landFill;
   for(const tile of active){
    ctx.beginPath();
    for(const ring of tile.rings)ringPath(ring,R,cx,cy);
    ctx.fill('evenodd');
   }
  }finally{ctx.restore()}
 }
 function onTileBoundary(p,q,tile){
  const x=tile.lon,y=tile.lat,x2=x+data.tileSize,y2=y+data.tileSize;
  const eq=(a,b)=>Math.abs(a-b)<.00011;
  return (eq(p[0],x)&&eq(q[0],x))||(eq(p[0],x2)&&eq(q[0],x2))||
    (eq(p[1],y)&&eq(q[1],y))||(eq(p[1],y2)&&eq(q[1],y2));
 }
 function coastline(active,R,cx,cy){
  ctx.save();
  try{
   ctx.strokeStyle='rgba(132,193,202,.73)';
   ctx.lineWidth=Math.min(1.24,.51+.14*Math.sqrt(zoom));
   ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
   for(const tile of active){
    for(const ring of tile.rings){
     for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length];
      // Los cortes artificiales entre teselas NO son líneas de costa.
      if(onTileBoundary(a,b,tile))continue;
      const p=projected(a[0],a[1],R,cx,cy),q=projected(b[0],b[1],R,cx,cy);
      if(p[2]<.015&&q[2]<.015)continue;
      ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);
     }
    }
   }
   ctx.stroke();
  }finally{ctx.restore()}
 }
 function draw(R,cx,cy){
  const start=performance.now();
  diagnostics.drawnTiles=0;diagnostics.landCells=0;
  diagnostics.seaCells=0;diagnostics.enabled=enabled();
  if(!diagnostics.enabled)return;
  const active=tiles.filter(t=>visible(t,R,cx,cy));
  if(!active.length)return;
  const L=loadLevel('8'),C=L.centers,land=[],sea=[];
  // 'drawn' ya contiene únicamente celdas visibles, sin barrido global.
  for(const d of drawn){
   const i=d[0],j=i*3,cy0=C[j+1]/32767;
   const lat=Math.asin(Math.max(-1,Math.min(1,cy0)))*DEG;
   if(lat<south-1||lat>north+1)continue;
   const lon=Math.atan2(C[j],C[j+2])*DEG;
   if(!onEurope(lon,lat))continue;
   if(L.land[i]<0)sea.push(i);else land.push(i);
  }
  diagnostics.drawnTiles=active.length;
  diagnostics.landCells=land.length;diagnostics.seaCells=sea.length;
  if(!land.length&&!sea.length)return;
  drawSeaOnLand(active,L,land,R,cx,cy);
  drawLandOnSea(active,L,sea,R,cx,cy);
  coastline(active,R,cx,cy);
  diagnostics.lastMs=performance.now()-start;
 }
 window.HexategosAtlasCoast0399=Object.freeze({draw,enabled,onEurope,landAt,
  diagnostics:()=>({...diagnostics})});
})();
