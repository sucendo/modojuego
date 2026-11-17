'use strict';
// Universal terrain seam regression, independent from GP-specific SVG coordinates.
// Tests the production clipping functions, not a copied implementation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,'parts/part-'+n+'.txt'),'utf8');
const parts={23:read('023'),24:read('024'),25:read('025'),26:read('026')};
function pick(src,name){
 const i=src.indexOf('function '+name+'(');
 assert.ok(i>=0,'Missing production function '+name);
 const end=src.indexOf('\n}\n',i);
 assert.ok(end>=i,'Missing function terminator '+name);
 return src.slice(i,end+2);
}
const names={
 23:['apexInspectorPolyArea','apexInspectorPolyBounds','apexInspectorFootHeight','apexInspectorHalfPoly','apexInspectorSubtractFoot'],
 24:['apexTrackSeamHeight','apexSnapTrackSeam','apexClipTerrainAtDrive','apexClipGenericRunoffPolygon'],
 25:['apexTerrainFinePatch','apexUnifiedTerrainCellPieces','apexClipTerrainSurface','apexStitchTerrainPieces','apexPhase4TerrainPacket']
};
const source=Object.entries(names).flatMap(([part,fns])=>fns.map(name=>pick(parts[part],name))).join('\n');
const point=(x,z,y=0)=>({x,y,z});
const rectangle=(x0,x1,y=0)=>[point(x0,0,y),point(x1,0,y),point(x1,10,y),point(x0,10,y)];
const bbox=poly=>({minX:Math.min(...poly.map(p=>p.x)),maxX:Math.max(...poly.map(p=>p.x)),minZ:0,maxZ:10});
const square=rectangle(0,10),road=rectangle(4,6,1.5),runoff=rectangle(6,8,2.25);
const roadIndex={cell:20,seamBuckets:new Map(),buckets:new Map([['0:0',[0]]]),faces:[{poly:road,bounds:bbox(road),terrainCut:true}]};
const svgIndex={
 cell:20,buckets:new Map([['0:0',[0]]]),
 faces:[{foot:{poly:runoff,bounds:bbox(runoff)},minX:6,maxX:8,minZ:0,maxZ:10}],
 overflow:[],overflowBuckets:new Map(),globalOverflow:[]
};
const trackData={
 customWorld:{terrainBase:{rings:[square.map(p=>[p.x,p.z])]},_apexUnifiedGroundAtlas:{svg:svgIndex}},
 _apexRunoffDriveSurfaceIndex:svgIndex
};
const inputs=[
 'clamp','lerp','trackData','apexRunoffRoadClipIndex','apexRunoffOverflowCandidates',
 'nearestTrackState','apexWorldGroundY',
 'apexPointInsideClosedContour','apexPortalTerrainCutAtWorld',
 'apexClipTerrainQuadByTunnel','apexClipTerrainAtPit','apexPhase4TerrainStats'
];
const values=[(v,a,b)=>Math.max(a,Math.min(b,v)),(a,b,t)=>a+(b-a)*t,trackData,()=>roadIndex,()=>[],(x,z)=>({s:0,lat:x-5}),()=>0,
 ()=>true,()=>null,(A,B,C,D)=>[[A,B,C,D]],()=>null,{packetHits:0,packetEvicted:0,packetsBuilt:0}];
const factory=new Function(...inputs,source+
 '\nreturn {road:apexClipTerrainAtDrive,svg:apexClipGenericRunoffPolygon,area:apexInspectorPolyArea,stitch:apexStitchTerrainPieces,fine:apexTerrainFinePatch,coarse:apexUnifiedTerrainCellPieces};');
const audit=factory(...values);
const sumArea=polys=>polys.reduce((total,p)=>total+Math.abs(audit.area(p)),0);
const svgPieces=audit.svg(square);
assert.ok(svgPieces&&svgPieces.length>0,'SVG runoff should clip the terrain');
const roadPieces=svgPieces.flatMap(p=>audit.road(p)??[p]);
assert.ok(Math.abs(sumArea(roadPieces)-60)<.01,
 'Road and SVG runoff should own 40 square units with no terrain underneath');
const seam=roadPieces.flat();
assert.ok(seam.some(p=>Math.abs(p.x-4)<.001&&Math.abs(p.y)<1e-7),
 'Road clip must preserve original terrain Y, never copy road Y');
assert.ok(seam.some(p=>Math.abs(p.x-8)<.001&&Math.abs(p.y)<1e-7),
 'Runoff clip must preserve original terrain Y, never copy SVG Y');

// Regression from Melbourne screenshots: a nearby higher/lower SVG surface
// must never lift clipped terrain vertices, including diagonal boundaries.
const tall=rectangle(4,6,12);
roadIndex.faces[0].poly=tall;
let elevated=audit.road(square);
assert.ok(elevated&&Math.abs(sumArea(elevated)-80)<.01);
assert.ok(elevated.flat().every(v=>Math.abs(v.y)<1e-7),
 'A high road can only remove underlying terrain, never pull it upward');
roadIndex.faces[0].poly=road;
const raisedRunoff=rectangle(6,8,30);
svgIndex.faces[0].foot.poly=raisedRunoff;
let runoffCut=audit.svg(square);
assert.ok(runoffCut&&Math.abs(sumArea(runoffCut)-80)<.01);
assert.ok(runoffCut.flat().every(v=>Math.abs(v.y)<1e-7),
 'A high SVG surface must not create floating terrain triangles');
svgIndex.faces[0].foot.poly=runoff;

// A real soft-surface join closes at the triangle's grade. Distant
// elevated surfaces and extension lines keep the original terrain height.
const sand=[point(6,0,.12),point(8,0,.12),point(6,10,.12)];
svgIndex.faces[0]={kind:'SAND',tri:sand.map(v=>[v.x,v.y,v.z]),ux:2,uz:0,vx:0,vz:10,inv:.05,
 foot:{poly:sand,bounds:bbox(sand)},minX:6,maxX:8,minZ:0,maxZ:10};
const sandCut=audit.svg(square);
assert.ok(Math.abs(sumArea(sandCut)-90)<1e-7);
assert.ok(sandCut.flat().some(v=>v.x===6&&Math.abs(v.y-.12)<1e-7),'Ground and sand share a boundary height');
assert.ok(sandCut.flat().filter(v=>v.x===0).every(v=>v.y===0),'Unrelated terrain keeps its grade');
svgIndex.faces[0]={foot:{poly:runoff,bounds:bbox(runoff)},minX:6,maxX:8,minZ:0,maxZ:10};

const diagonal=[point(3,5,60),point(5,3,60),point(7,5,60),point(5,7,60)];
roadIndex.faces[0].poly=diagonal;
roadIndex.faces[0].bounds={
 minX:3,maxX:7,minZ:3,maxZ:7
};
const diamond=audit.road(square);
assert.ok(diamond&&Math.abs(sumArea(diamond)-92)<.02,
 'Diagonal/concave border clip must preserve exterior area');
assert.ok(diamond.flat().every(v=>Number.isFinite(v.y)&&Math.abs(v.y)<1e-7),
 'Diagonal clipping must not inject elevated non-coplanar vertices');
roadIndex.faces[0].poly=road;
roadIndex.faces[0].bounds=bbox(road);

const grid={minX:0,minZ:0,maxX:10,maxZ:10,cell:10,nx:2,nz:2,
 baseLevelM:0,inside:Uint8Array.from([1,1,1,1]),vals:Float32Array.from([0,0,0,0]),fineCache:new Map()};
const fine=audit.fine(grid,0,0,'TRACK');
const coarse=audit.coarse(grid,0,0,1,1,square);
assert.ok(Math.abs(sumArea(fine)-60)<.01,'Fine LOD drops pavement triangles but keeps outside terrain');
assert.ok(coarse&&Math.abs(sumArea(coarse)-60)<.01,
 'Coarse LOD uses the same ownership as fine LOD');
assert.equal(audit.fine(grid,0,0,'TRACK'),fine,'Fine LOD must be cached');

// The short face meets a raised point halfway along the neighbour's edge.
const joint=point(4,5,.25), stitched=audit.stitch([
 rectangle(0,4),[point(4,0),point(6,0),point(6,5),joint],
 [joint,point(6,5),point(6,10),point(4,10)]
]);
assert.ok(Math.abs(sumArea(stitched)-60)<1e-8);
assert.ok(stitched.filter(p=>p.some(v=>v.x<4)).some(p=>p.includes(joint)));
assert.ok(stitched.every(p=>!p.some((v,i)=>v.x===4&&v.z===0&&p[(i+1)%p.length].x===4&&p[(i+1)%p.length].z===10)));
const slopeGrid={...grid,minX:40,maxX:50,inside:Uint8Array.from([1,0,1,1]),
 baseLevelM:2,vals:Float32Array.from([4,99,8,10]),fineCache:new Map()};
delete slopeGrid._apexPhase4WorldPackets;
const slopeVertices=audit.fine(slopeGrid,0,0,'TRACK').flat();
assert.ok(slopeVertices.some(v=>v.x===45&&v.z===0&&v.y===3),'Fine edge uses the same masked endpoints as the coarse cell');
assert.ok(slopeVertices.some(v=>v.x===40&&v.z===5&&v.y===6),'Fine boundary lies on the adjacent coarse edge');
assert.ok(slopeVertices.some(v=>v.x===45&&v.z===5&&v.y===0),'Interior still uses the ground sampler');

// The cut changes only the right subdivision; its new point must also
// appear on the untouched left subdivision in the same cached fine tile.
const splitPoint=point(2.5,1,.25);
const patchFunctions=['apexTerrainFinePatch','apexClipTerrainSurface','apexStitchTerrainPieces','apexPhase4TerrainPacket']
 .map(name=>pick(parts[25],name)).join('\n');
const tiled=new Function('apexClipGenericRunoffPolygon','apexClipTerrainAtDrive','lerp','apexWorldGroundY',
 'apexPortalTerrainCutAtWorld','apexClipTerrainQuadByTunnel','apexInspectorPolyArea','apexPhase4TerrainStats',
 patchFunctions+'\nreturn apexTerrainFinePatch;')(
 ()=>null,tri=>!tri.some(v=>v.x===5&&v.z===2.5)||!tri.some(v=>v.x===2.5&&v.z===0)||
  !tri.some(v=>v.x===2.5&&v.z===2.5)?null:[[...tri,splitPoint]],
 (a,b,t)=>a+(b-a)*t,()=>0,()=>null,(...quad)=>[quad],audit.area,{packetHits:0,packetEvicted:0,packetsBuilt:0});
const fullTile=tiled({...grid,fineCache:new Map()},0,0,'TRACK');
assert.ok(fullTile.filter(poly=>poly.some(v=>v.x<2.5)).some(poly=>poly.includes(splitPoint)),
 'An uncut fine subdivision shares the exact raised vertex with its cut neighbour');

roadIndex.faces[0].terrainCut=false;
assert.equal(audit.road(square),null,'Bridges and tunnels must preserve underlying terrain');
assert.match(parts[25],/APEX_CIRCUIT_COMPILE_REV=230702/,'Old compiled meshes must be invalidated');
assert.match(parts[25],/else y=apexWorldGroundY\(x,z\);/,'Fine terrain must sample the same ground height as the vehicle');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'circuits/manifest.json'),'utf8'));
for(const gp of ['01-australia','14-spain']){
 const entry=manifest.circuits[gp];
 assert.ok(entry&&entry.svg&&entry.exactSvg===true,'Saved GP must be SVG authoritative: '+gp);
 assert.ok(fs.existsSync(path.join(root,'circuits',entry.svg)),'Missing saved SVG '+gp);
}
console.log(JSON.stringify({test:'terrain-surface-ownership',finePolygons:fine.length,
 coarsePolygons:coarse.length,remainingArea:sumArea(fine),cacheRev:230702,ok:true}));
