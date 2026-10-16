'use strict';
/* Aguas interiores del Himalaya · 0.40.6. Sólo tinta visual sobre
 * celdas terrestres L8, sin cambiar L.land ni habilitar navegación.
 */
(function(){
 const data=window.HexategosHimalayaPhysical0406;
 if(!data||typeof terrainStrategicFill3247!=='function')return;
 const base=terrainStrategicFill3247,rad=Math.PI/180,
  ymin=Math.sin(28.4*rad)*32767,ymax=Math.sin(34.3*rad)*32767;
 const cache=new Map(),counts=new Uint32Array(data.waterBodies.length);
 function isWater(key,i,L){
  if(key!=='8'||i<0||i>=L.n||L.land[i]<0)return null;
  const k=i*3,y=L.centers[k+1];
  if(y<ymin||y>ymax)return null;
  const lon=Math.atan2(L.centers[k],L.centers[k+2])/rad;
  if(lon<77.3||lon>91.6)return null;
  const lat=Math.asin(Math.max(-1,Math.min(1,y/32767)))/rad;
  let memo=cache.get(key);
  if(!memo||memo.mesh!==L){
   memo={mesh:L,ids:new Uint8Array(L.n)};cache.set(key,memo);
  }
  const known=memo.ids[i];
  if(known)return known===255?null:data.waterBodies[known-1];
  const body=data.bodyAt(lon,lat);
  const at=body?data.waterBodies.indexOf(body)+1:255;
  memo.ids[i]=at;
  if(body)counts[at-1]++;
  return body;
 }
 function allowed(){
  const bridge=window.HexategosGameAtlasBridge0400;
  if(bridge&&(!bridge.enabled()||!bridge.visibleHimalaya()))return false;
  if(typeof $==='function'&&$('lakes')?.checked===false)return false;
  return true;
 }
 terrainStrategicFill3247=function himalayaWater0406(key,i,L,own,z){
  const old=base(key,i,L,own,z);
  if(window.HexategosAsianLakes0417?.enabled)return old;
  const mode=typeof mapMode3252==='undefined'?'terrain':mapMode3252;
  if((mode!=='terrain'&&mode!=='political')||!allowed())return old;
  const b=isWater(key,i,L);if(!b)return old;
  const rgb=[36,121,161].map(v=>Math.round(v*(.75+.25*Math.max(0,z))));
  if(mode==='political'){
   const m=old.match(/\d+/g);
   if(m?.length>=3)return 'rgb('+rgb.map((v,k)=>
    Math.round(v*.77+Number(m[k])*.23)).join(',')+')';
  }
  return 'rgb('+rgb.join(',')+')';
 };
 window.HexategosHimalayaWater0406=Object.freeze({
  version:'0.40.6',isWater,allowed,
  isBodyDrawn:name=>window.HexategosAsianLakes0417?.enabled?
   window.HexategosAsianLakes0417.isDrawn(name):
   allowed()&&data.waterBodies.some((b,i)=>b.name===name&&counts[i]>0)&&
   (typeof zoom==='undefined'||zoom>=8),
  nearby:(lat,lon)=>data.waterBodies.filter(b=>b.components.some(
   ([x,y,rx,ry])=>Math.hypot((lon-x)*Math.cos(lat*rad),(lat-y))<
     Math.max(rx,ry)*1.6)).map(b=>b.displayName).slice(0,3),
  diagnostics:()=>({bodies:data.waterBodies.map(b=>b.name),
   virtualOnly:true,changesGameplayLand:false,
   paintedCells:Array.from(counts)}),
  cacheBytes:()=>[...cache.values()].reduce((n,v)=>n+v.ids.byteLength,0)
 });
})();