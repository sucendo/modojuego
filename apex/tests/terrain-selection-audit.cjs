/* Production terrain selection/cache regression, no GPU or FPS simulation.
   The old owner compiler preloads an even 2x2 lattice; old selection used
   camera-dependent parity and missed that exact geometry cache. */
const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),file='apex/parts/part-025.txt',ref='5af6e534d4fe4de5aa13f14f3b4f5a524c45cc64';
const current=fs.readFileSync(path.join(root,file),'utf8'),before=cp.execFileSync('git',['show',`${ref}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:5e6});
function func(s,name){const start=s.indexOf(`function ${name}(`);assert.ok(start>=0);for(let end=s.indexOf('}',start);end>=0;end=s.indexOf('}',end+1)){const code=s.slice(start,end+1);try{new vm.Script(`(${code})`);return code}catch{}}throw Error(name);}
function fixture(source,mobile=true){
 const grid={nx:90,nz:90,minX:-450,minZ:-450,maxX:440,maxZ:440,cell:10,baseLevelM:0,mask:new Uint8Array(89*89).fill(1)},stats={clips:0};
 const c=vm.createContext({Math,Map,trackData:{customWorld:{_apexUnifiedGroundAtlas:{svg:{faces:[{}]}}}},
  apexPlateTerrainGrid:()=>grid,apexInspectionFullScene:()=>false,mobilePerformanceMode:()=>mobile,
  apexPortalCellIsNear:()=>false,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  worldToCamera:(x,y,z,cam)=>({x:x-cam.x,y,z:z-cam.z}),
  apexPhase4TerrainCoverage:(g,ix,iz,x1,z1)=>{let n=0;for(let z=iz;z<z1;z++)for(let x=ix;x<x1;x++)n+=g.mask[z*(g.nx-1)+x]?1:0;return n;},
  apexClipGenericRunoffPolygon:p=>(stats.clips++,[p])});
 vm.runInContext(['apexCollectTerrainPlateCells','apexUnifiedTerrainCellPieces'].map(n=>func(source,n)).join('\n'),c);
 return{c,grid,stats};
}
const key=c=>[c.ix,c.iz,c.x1,c.z1].join(':'),coarse=c=>c.x1-c.ix>1||c.z1-c.iz>1;
const scenarios=[];
for(const axis of ['x','z']){
 const old=fixture(before),now=fixture(current),cams=axis==='x'?[{x:4.99,z:0},{x:5.01,z:0}]:[{x:0,z:4.99},{x:0,z:5.01}];
 const oldSets=cams.map(cam=>old.c.apexCollectTerrainPlateCells(cam)),newSets=cams.map(cam=>now.c.apexCollectTerrainPlateCells(cam));
 const missing=sets=>{const keys=new Set(sets[0].filter(coarse).map(key));return sets[1].filter(coarse).filter(c=>!keys.has(key(c))).length;};
 const a=missing(oldSets),b=missing(newSets);assert.ok(a>50,axis);assert.ok(b<a*.1,axis);
 for(const cells of newSets){
  const covered=new Set();assert.ok(cells.length<=420);
  for(const c of cells){if(coarse(c)){assert.equal(c.ix%2,0);assert.equal(c.iz%2,0);}
   for(let z=c.iz;z<c.z1;z++)for(let x=c.ix;x<c.x1;x++){const id=z*89+x;assert.ok(!covered.has(id),'Overlapping selected tiles');covered.add(id);assert.equal(now.grid.mask[id],1);}
  }
 }
 scenarios.push({axis,cameraMoveM:.02,newCoarseCacheKeysBefore:a,newCoarseCacheKeysAfter:b,selectedAfter:newSets[1].length});
}
// The actual production owner cache, seeded like the existing compiler: every
// unit cell and even-origin coarse tile for the tested viewing region.
// Restrict preload to visible union to stay inside the production 3072-entry cap.
const old=fixture(before),now=fixture(current),cam={x:4.99,z:4.99};
const targets=now.c.apexCollectTerrainPlateCells(cam),selectedOld=old.c.apexCollectTerrainPlateCells(cam);
const union=new Map(targets.map(c=>[key(c),c]));for(const c of selectedOld){if(!coarse(c))union.set(key(c),c);}
function poly(c){return [{x:c.ix*10,y:c.ix*.2+c.iz*.3,z:c.iz*10},{x:c.x1*10,y:c.x1*.2+c.iz*.3,z:c.iz*10},{x:c.x1*10,y:c.x1*.2+c.z1*.3,z:c.z1*10},{x:c.ix*10,y:c.ix*.2+c.z1*.3,z:c.z1*10}];}
for(const f of [old,now])for(const c of union.values())f.c.apexUnifiedTerrainCellPieces(f.grid,c.ix,c.iz,c.x1,c.z1,poly(c));
for(const f of [old,now])f.stats.clips=0;
for(const f of [old,now])for(const c of f.c.apexCollectTerrainPlateCells(cam))f.c.apexUnifiedTerrainCellPieces(f.grid,c.ix,c.iz,c.x1,c.z1,poly(c));
assert.ok(old.stats.clips>50);assert.equal(now.stats.clips,0);
// Desktop step 1, scene geometry and authored clipping recipes are unchanged.
const desktopOld=fixture(before,false),desktopNow=fixture(current,false);for(const cam of [{x:0,z:0},{x:5.01,z:5.01},{x:-300,z:120}])assert.equal(JSON.stringify(desktopNow.c.apexCollectTerrainPlateCells(cam)),JSON.stringify(desktopOld.c.apexCollectTerrainPlateCells(cam)));
assert.equal(func(current,'apexUnifiedTerrainCellPieces'),func(before,'apexUnifiedTerrainCellPieces'));
// Partial masks split the block into the exact remaining unit cells, portals keep
// fine selection, and out-of-grid edges never emit invalid indices.
for(const portal of [false,true]){
 const f=fixture(current);f.grid.mask[50*89+48]=0;f.c.apexPortalCellIsNear=()=>portal;
 for(const cam of [{x:0,z:0},{x:430,z:430},{x:-450,z:-450}])for(const c of f.c.apexCollectTerrainPlateCells(cam)){
  assert.ok(c.ix>=0&&c.iz>=0&&c.x1<90&&c.z1<90);
  for(let z=c.iz;z<c.z1;z++)for(let x=c.ix;x<c.x1;x++)assert.equal(f.grid.mask[z*89+x],1);
  if(portal)assert.equal(coarse(c),false);
 }
}
console.log(JSON.stringify({scope:'SYNTHETIC_PRODUCTION_SELECTION_AND_CACHE_KEYS_NOT_RENDER_TIME',baseline:ref,scenarios,precompiledCache:{beforeNewClips:old.stats.clips,afterNewClips:now.stats.clips},desktopIdentical:true,ownerClippingUnchanged:true,partialMaskAndPortals:true},null,2));
