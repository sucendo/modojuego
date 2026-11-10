'use strict';
// The fallback runway must remove terrain beneath its entire 3D footprint.
// The authored SVG roadway clip must remain limited to asphalt+kerbs only.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const part23=fs.readFileSync(path.join(root,'parts/part-023.txt'),'utf8');
const part24=fs.readFileSync(path.join(root,'parts/part-024.txt'),'utf8');
function get(s,name){
 const p=s.indexOf('function '+name+'('),e=s.indexOf('\n}\n',p);
 assert.ok(p>=0&&e>p,'Cannot isolate function: '+name);
 return s.slice(p,e+2);
}
const src=[
 ...['apexInspectorPolyArea','apexInspectorPolyBounds','apexInspectorFootHeight',
     'apexInspectorHalfPoly','apexInspectorSubtractFoot'].map(n=>get(part23,n)),
 get(part24,'apexRunoffRoadClipIndex'),get(part24,'apexClipTerrainAtDrive')
].join('\n');
const env={half:3,curb:1,runoff:5,tunnel:false};
const q=s=>({x:0,y:0,z:s,bank:0,nx:1,nz:0,tx:0,tz:1});
const ribbon=(frame,w,side)=>({x:w*side,y:0,z:frame.z});
let gradeSeparated=false;
const data={_apexRunoffRoadClipIndex:null};
const factory=new Function('trackData','apexRoadMeshSamples','renderRibbonFrameAt',
 'envProfile','ribbonWorldPoint','apexPhase1StructureAtWorld','apexFlatRunoffPoint',
 'apexRoadFlatLimit','apexPitSegments',src+
 '\nreturn {index:apexRunoffRoadClipIndex,clip:apexClipTerrainAtDrive,area:apexInspectorPolyArea};');
const create=()=>factory(data,()=>[0,10],q,()=>env,ribbon,
 ()=>gradeSeparated?{kind:'OVER'}:null,(frame,e,w,side)=>ribbon(frame,w,side),()=>9,()=>[]);
const poly=(l,r)=>[{x:l,y:0,z:2},{x:r,y:0,z:2},
 {x:r,y:0,z:8},{x:l,y:0,z:8}];
const calcArea=(api,ps)=>ps.reduce((n,p)=>n+Math.abs(api.area(p)),0);
let api=create(),index=api.index();
assert.ok(index.terrainBuckets.size>0,'Missing separate terrain-only spatial index');
assert.ok(index.faces.some(f=>f.poly.some(v=>Math.abs(v.x)===9)),
 'Terrain footprint must extend to 9m escape-road edge');
const ids=new Set(Array.from(index.buckets.values()).flat());
assert.ok(Array.from(index.terrainBuckets.values()).flat().some(id=>!ids.has(id)),
 'Fallback runway polygons must not remove authored SVG runoffs');
assert.equal(api.clip(poly(5,8))?.length,0,
 'Road runoff must replace green terrain between 5m and 8m');
assert.equal(api.clip(poly(-2,2))?.length,0,
 'Track and kerbs must remove underlying terrain');
assert.equal(api.clip(poly(10,12)),null,
 'Natural terrain must remain outside the visible escape corridor');
const partial=api.clip(poly(8,12));
assert.ok(partial&&Math.abs(calcArea(api,partial)-18)<.001,
 'Only the part of the terrain outside the runway may remain');
assert.ok(partial.flat().every(v=>Math.abs(v.y)<1e-8),
 'Terrain clipping must never pull vertices up to the road level');

// Preserve natural terrain below a real SVG grade-separated crossing.
gradeSeparated=true;data._apexRunoffRoadClipIndex=null;
api=create();index=api.index();
assert.equal(index.terrainBuckets.size,0,
 'An elevated road must not remove natural ground below it');
assert.equal(api.clip(poly(5,8)),null,
 'Natural ground must survive under bridges and tunnels');
assert.ok(index.buckets.size>0,
 'SVG runoff mask must retain the regular road footprint at crossings');
console.log(JSON.stringify({test:'terrain-runoff-corridor',
 fallbackRunoffProtected:true,roadSvgClipIntact:true,overpassPreserved:true,ok:true}));
