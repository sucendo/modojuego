'use strict';
// Universal pedestrian bridge supports: never project footings on drivable roadway.
// Execute: node apex/tests/pedestrian-bridge-clearance.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'parts/part-024.txt'),'utf8');
const i=source.indexOf('function apexPedestrianBridgeVisual(it){');
const j=source.indexOf('function apexFeatureBridgeBanner(',i);
assert.ok(i>=0&&j>i,'Universal visual bridge placement helper missing');
const helper=source.slice(i,j);
const modes=[
 {filename:'parts/part-024.txt',start:'}else if(it.type==="bridge"&&it.pedestrianBridge){',end:'}else if(it.type==="road"&&Array.isArray(it.worldPath)&&it.worldPath.length>=2){'},
 {filename:'parts/part-025.txt',start:"}else if(it.type==='bridge'&&it.pedestrianBridge){",end:"}else if(it.type==='road'&&Array.isArray(it.worldPath)&&it.worldPath.length>=2){"},
 {filename:'parts/part-025-trees3d-preview.txt',start:"}else if(it.type==='bridge'&&it.pedestrianBridge){",end:"}else if(it.type==='road'&&Array.isArray(it.worldPath)&&it.worldPath.length>=2){"}
];
for(const mode of modes){
 const s=fs.readFileSync(path.join(root,mode.filename),'utf8');
 const p=s.indexOf(mode.start),q=s.indexOf(mode.end,p);
 assert.ok(p>=0&&q>p,mode.filename+' bridge renderer missing');
 const branch=s.slice(p+1,q);
 assert.match(branch,/apexPedestrianBridgeVisual\(it\)/);
 assert.match(branch,/if\(!support\.safe\)continue/);
 assert.match(branch,/const corners=\[\[-half,-half\],\[half,-half\],\[half,half\],\[-half,half\]\]/);
 assert.ok(!branch.includes('for(const ep of [p0,p1])'),
  'No renderer may unconditionally draw SVG endpoint footings');
 // Contains continue statements; run the syntax check inside a test loop.
 new Function('for(let k=0;k<1;k++){if(false){}'+branch+'}}');
}
let pit=false,runoff=false,cornerBlocked=false,roadY=0;
const data={spec:{dir:'01-australia'},_apexGroundStamp:'initial'};
const landmark={type:'bridge',pedestrianBridge:true,sourceId:'test',width:5,
 worldPath:[[0,-8],[0,8]],worldFootprint:[[-2,-8],[-2,8],[2,8],[2,-8]]};
const window={};
const visual=new Function('window','trackData','trackLandmarks','nearestTrackState',
 'envProfile','apexRoadFlatLimit','nearestPitState','apexSampleRunoffSurfaceAtWorld',
 'polyFootprintFromWorldPath','clamp','renderRibbonFrameAt','apexRoadSideHeight','apexWorldGroundY',
 helper+'return apexPedestrianBridgeVisual;')(
 window,data,()=>[landmark],(x,z)=>({s:0,lat:z}),
 ()=>({half:6,curb:1,runoff:3.2}),()=>10.2,
 (x,z)=>pit&&z>=0&&z<20?{dist:0,leftWidth:2,rightWidth:2,width:4}:null,
 (x,z)=>(runoff||(cornerBlocked&&x>.4))?{kind:'ASPHALT'}:null,
 (points,w)=>{const a=points[0],b=points[points.length-1],h=w*.5;
  return[[a[0]-h,a[1]],[b[0]-h,b[1]],[b[0]+h,b[1]],[a[0]+h,a[1]]];},
 (v,lo,hi)=>Math.max(lo,Math.min(hi,v)),()=>({y:roadY}),()=>roadY,()=>0);
const first=visual(landmark);
assert.equal(first,visual(landmark),'Reuse per-bridge projection cache');
assert.deepEqual(landmark.worldPath,[[0,-8],[0,8]],'Never mutate the SVG worldPath');
assert.ok(first.supports.every(s=>s.safe&&Math.abs(s.point[1])>=12),
 'Track, kerb and runoff clearance is required');
assert.notDeepEqual(first.footprint,landmark.worldFootprint,'Deck must reach relocated piers');
pit=true;data._apexGroundStamp='pit';
const pitVisual=visual(landmark);
assert.ok(pitVisual.supports[1].point[1]>=20,'Pitlane must have safe clearance');
runoff=true;pit=false;data._apexGroundStamp='blocked';
const blocked=visual(landmark);
assert.ok(blocked.supports.every(s=>!s.safe),'Omit unsafe supports on fully blocked ground');
assert.equal(window.apexBridgeSupportAudit().omittedSupports,2);
runoff=false;cornerBlocked=true;data._apexGroundStamp='corner';
const corners=visual(landmark);
assert.ok(corners.supports.every(s=>!s.safe),
 'Checking the centre alone misses a pillar corner inside SVG runoff');
cornerBlocked=false;roadY=12;data._apexGroundStamp='elevated';
const elevated=visual(landmark);
assert.ok(elevated.deckBaseY>=17.25&&elevated.deckTopY>elevated.deckBaseY,
 'Deck underside must clear an uphill road by at least 5.25 metres');
assert.ok(window.apexBridgeSupportAudit().bridges[0].minimumClearanceM>=5.25,
 'Elevation clearance must be observable via browser audit');
for(const mode of modes){
 const src=fs.readFileSync(path.join(root,mode.filename),'utf8');
 const p=src.indexOf(mode.start),q=src.indexOf(mode.end,p),section=src.slice(p,q);
 assert.match(section,/visual\?\.deckBaseY/);
 assert.match(section,/visual\?\.deckTopY/);
}
console.log(JSON.stringify({test:'pedestrian-bridge-clearance',renderers:modes.length,
 trackShiftM:first.supports.map(s=>s.shift),pitShiftM:pitVisual.supports[1].shift,
 rejectedUnsafeSupports:2,fullPierFootprintChecked:true,roadClearanceM:elevated.minimumClearanceM,
 svgUnchanged:true,ok:true}));
