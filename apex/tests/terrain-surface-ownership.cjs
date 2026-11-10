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
 24:['apexClipTerrainAtDrive','apexClipGenericRunoffPolygon'],
 25:['apexTerrainFinePatch','apexUnifiedTerrainCellPieces']
};
const source=Object.entries(names).flatMap(([part,fns])=>fns.map(name=>pick(parts[part],name))).join('\n');
const point=(x,z,y=0)=>({x,y,z});
const rectangle=(x0,x1,y=0)=>[point(x0,0,y),point(x1,0,y),point(x1,10,y),point(x0,10,y)];
const bbox=poly=>({minX:Math.min(...poly.map(p=>p.x)),maxX:Math.max(...poly.map(p=>p.x)),minZ:0,maxZ:10});
const square=rectangle(0,10),road=rectangle(4,6,1.5),runoff=rectangle(6,8,2.25);
const roadIndex={cell:20,buckets:new Map([['0:0',[0]]]),faces:[{poly:road,bounds:bbox(road),terrainCut:true}]};
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
 'trackData','apexRunoffRoadClipIndex','apexRunoffOverflowCandidates',
 'nearestTrackState','apexWorldGroundY',
 'apexPointInsideClosedContour','apexPortalTerrainCutAtWorld',
 'apexClipTerrainQuadByTunnel','apexClipTerrainAtPit'
];
const values=[trackData,()=>roadIndex,()=>[],(x,z)=>({s:0,lat:x-5}),()=>0,
 ()=>true,()=>null,(A,B,C,D)=>[[A,B,C,D]],()=>null];
const factory=new Function(...inputs,source+
 '\nreturn {road:apexClipTerrainAtDrive,svg:apexClipGenericRunoffPolygon,area:apexInspectorPolyArea,fine:apexTerrainFinePatch,coarse:apexUnifiedTerrainCellPieces};');
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
 baseLevelM:0,inside:Uint8Array.from([1,1,1,1]),fineCache:new Map()};
const fine=audit.fine(grid,0,0,'TRACK');
const coarse=audit.coarse(grid,0,0,1,1,square);
assert.ok(Math.abs(sumArea(fine)-60)<.01,'Fine LOD drops pavement triangles but keeps outside terrain');
assert.ok(coarse&&Math.abs(sumArea(coarse)-60)<.01,
 'Coarse LOD uses the same ownership as fine LOD');
assert.equal(audit.fine(grid,0,0,'TRACK'),fine,'Fine LOD must be cached');

roadIndex.faces[0].terrainCut=false;
assert.equal(audit.road(square),null,'Bridges and tunnels must preserve underlying terrain');
assert.match(parts[25],/APEX_CIRCUIT_COMPILE_REV=230693/,'Old compiled meshes must be invalidated');
assert.match(parts[25],/const y=apexWorldGroundY\(x,z\);/,'Fine terrain must sample the same ground height as the vehicle');
assert.match(parts[26],/Math\.hypot\(player\.x-q\.x,player\.z-q\.z\)>trackLimit/,
 'Near-camera patch must not cover the car off the main road');
assert.match(parts[26],/webglPushCamPoly\(poly\.map\(p=>worldToCamera\(p\.x,p\.y,p\.z,cam\)\),pitch,color,\.34,bias\)/,
 'Near-camera polygon must retain the same depth bias after clipping');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'circuits/manifest.json'),'utf8'));
for(const gp of ['01-australia','14-spain']){
 const entry=manifest.circuits[gp];
 assert.ok(entry&&entry.svg&&entry.exactSvg===true,'Saved GP must be SVG authoritative: '+gp);
 assert.ok(fs.existsSync(path.join(root,'circuits',entry.svg)),'Missing saved SVG '+gp);
}
console.log(JSON.stringify({test:'terrain-surface-ownership',finePolygons:fine.length,
 coarsePolygons:coarse.length,remainingArea:sumArea(fine),cacheRev:230693,ok:true}));
