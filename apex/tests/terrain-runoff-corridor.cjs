'use strict';
// A banked road and its surrounding terrain share an exact 3-D edge.
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
 ...['apexTrackEdgeSection','apexTrackCrossSection','apexRunoffRoadClipIndex',
     'apexTrackSeamHeight','apexSnapTrackSeam','apexClipTerrainAtDrive'].map(n=>get(part24,n))
].join('\n');
const env={half:3,curb:1,runoff:5,tunnel:false};
const q=s=>({x:0,y:s*.4,z:s,bank:.2,ox:1,oz:0,nx:1,nz:0,tx:0,tz:1});
const ribbon=(frame,w,side)=>({x:w*side,y:frame.y+Math.tan(frame.bank)*w*side,z:frame.z});
let gradeSeparated=false;
const data={_apexRunoffRoadClipIndex:null};
const factory=new Function('trackData','apexRoadMeshSamples','renderRibbonFrameAt',
 'envProfile','ribbonWorldPoint','apexPhase1StructureAtWorld','curbInfo',
 'clamp','lerp','apexPitSegments',src+
 '\nreturn {index:apexRunoffRoadClipIndex,clip:apexClipTerrainAtDrive,area:apexInspectorPolyArea};');
const create=()=>factory(data,()=>[0,10],q,()=>env,ribbon,
 ()=>gradeSeparated?{kind:'OVER'}:null,()=>({left:true,right:false}),
 (x,a,b)=>Math.max(a,Math.min(b,x)),(a,b,t)=>a+(b-a)*t,()=>[]);
const poly=(l,r)=>[{x:l,y:0,z:2},{x:r,y:0,z:2},
 {x:r,y:0,z:8},{x:l,y:0,z:8}];
const calcArea=(api,ps)=>ps.reduce((n,p)=>n+Math.abs(api.area(p)),0);
let api=create(),index=api.index();
assert.ok(index.terrainBuckets.size>0);
assert.equal(index.faces.length,2,'no second corridor outside the real surface');
assert.equal(api.clip(poly(5,8)),null,'ground starts at the edge, even with legacy runoff width');
assert.equal(api.clip(poly(-2,2))?.length,0);
const partial=api.clip(poly(2,7));
assert.ok(partial&&Math.abs(calcArea(api,partial)-18)<1e-8);
const vertices=partial.flat(),edge=vertices.filter(v=>Math.abs(v.x-4)<1e-8);
assert.ok(edge.length>=2);
assert.ok(edge.every(v=>Math.abs(v.y-(v.z*.4+3*Math.tan(.2)))<1e-8),
 'all clipped points on the curb edge inherit its continuous banked grade');
assert.ok(vertices.filter(v=>v.x===7).every(v=>v.y===0),'outer relief retains its own grade');
const touching=api.clip(poly(4,7));
assert.ok(touching.flat().some(v=>v.x===4&&v.y>0),'an existing boundary vertex also shares the seam');

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
 bankedTerrainSeam:true,roadSvgClipIntact:true,overpassPreserved:true,ok:true}));
