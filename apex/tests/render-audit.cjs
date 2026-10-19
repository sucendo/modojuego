/* Isolated production-function regression tests. No browser/FPS claims.
   node apex/tests/render-audit.cjs [--baseline-ref=<git-ref>] */
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const parts=()=>Array.from({length:28},(_,i)=>`apex/parts/part-${String(i).padStart(3,'0')}.txt`);
const ref=process.argv.find(s=>s.startsWith('--baseline-ref='))?.split('=')[1]||'6f0cfb173db9a2112c51bdc595a75daa2ed32667';
const current=parts().map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('');
const baseline=parts().map(p=>cp.execFileSync('git',['show',`${ref}:${p}`],{cwd:root,maxBuffer:20*1024*1024,encoding:'utf8'})).join('');
function func(src,name){const start=src.indexOf(`function ${name}(`);assert.ok(start>=0,name);for(let end=src.indexOf('}',start);end>=0;end=src.indexOf('}',end+1)){const code=src.slice(start,end+1);try{new vm.Script(`(${code})`);return code}catch{}}throw Error(name);}
function decl(src,name){const start=src.indexOf(`const ${name}=`);assert.ok(start>=0,name);for(let end=src.indexOf(';',start);end>=0;end=src.indexOf(';',end+1)){const code=src.slice(start,end+1);try{new vm.Script(code);return code}catch{}}throw Error(name);}
function context(globals={}){return vm.createContext({console,performance,lerp:(a,b,t)=>a+(b-a)*t,Float32Array,Uint32Array,Uint8Array,Map,Math,Number,window:{},...globals});}
function load(c,src,functions,constants=[]){vm.runInContext(constants.map(n=>decl(src,n)).join('\n')+'\n'+functions.map(n=>func(src,n)).join('\n'),c);}
let scriptCount=0;for(const match of current.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!/\bsrc\s*=|application\/json/i.test(match[1])){new vm.Script(match[2]);scriptCount++;}}
console.log('PASS: syntax of assembled 28 fragments ('+scriptCount+' scripts)');
function road(src,optimized){
 const stats={world:0,screen:0,walls:0,env:0,frames:0};
 const td={km:5,pts:[],samples:Array.from({length:1000},(_,i)=>i*5)};
 const c=context({trackData:td,mobilePerformanceMode:()=>false,apexRoadMeshSamples:()=>td.samples,
 envProfile:s=>(stats.env++,{half:6+Math.sin(s/100),curb:.75,runoff:3.2}),curbInfo:()=>({left:true,right:false}),
 renderRibbonFrameAt:s=>({x:s,z:20*Math.sin(s/100),y:5*Math.sin(s/50),ox:1,oz:.1,bank:.12*Math.sin(s/80),i:Math.floor(s/5)}),
 apexRoadFlatLimit:(s,e,side)=>e.half+e.curb+e.runoff+side*.2,
 apexRoadSideHeight:(q,e,side)=>q.y+Math.tan(q.bank)*e.half*side,
 worldToCamera:(x,y,z,cam)=>(stats.world++,{x:x-cam.x,y:y-cam.y,z:z-cam.z}),
 wallGeometryAtS:(s,side)=>(stats.walls++,{top:{x:s+side*12,y:3,z:0}}),
 projectRoadLocal:(x,y,z)=>(stats.screen++,{x,y,z}),
 });
 load(c,src,['ribbonWorldPoint','apexFlatRunoffPoint','roadStep',...(optimized?['apexWebglRoadStep']:[])],optimized?['apexRoadPreparationPerf']:[]);
 c.run=(s,node)=>vm.runInContext(`${optimized?'apexWebglRoadStep':'roadStep'}(${s},10,{x:1,y:2,z:3},0,${node})`,c);
 c.stats=stats;return c;
}
const oldRoad=road(baseline,false),newRoad=road(current,true);
for(let i=0;i<1000;i++){const a=oldRoad.run(i*5,i),b=newRoad.run(i*5,i);for(const key of ['c','l','r','lo','ro','lx','rx'])for(const axis of ['x','y','z'])assert.ok(Math.abs(a.v[key][axis]-b.v[key][axis])<1e-10);}
for(let f=0;f<9;f++)for(let i=0;i<1000;i++){oldRoad.run(i*5,i);newRoad.run(i*5,i);}
assert.equal(oldRoad.stats.screen,90000);assert.equal(newRoad.stats.screen,0);assert.equal(oldRoad.stats.walls,20000);assert.equal(newRoad.stats.walls,0);assert.equal(newRoad.stats.env,1000);
// Moving branch ends must never reuse world geometry.
const p=newRoad.run(100.01,-1),q=newRoad.run(100.02,-1);assert.notEqual(p.v.c.x,q.v.c.x);
console.log('PASS: 1000 banked/elevated road nodes; fixed-node cache and moving ends',JSON.stringify({before:oldRoad.stats,after:newRoad.stats}));
function terrain(src,optimized,mobile=false){
 const stats={world:0,polys:0,uploadedBytes:0,uploads:0,allocations:0};
 const gl={ARRAY_BUFFER:1,DYNAMIC_DRAW:2,createBuffer:()=>({}),bindBuffer(){},bufferData(t,bytes){stats.allocations++;},bufferSubData(t,offset,packet){stats.uploads++;stats.uploadedBytes+=packet.byteLength;},deleteBuffer(){},deleteProgram(){}};
 const grid={plateMesh:true,cell:20,nx:200,nz:200,minX:0,minZ:0,maxX:4000,maxZ:4000,tone:'GRASS',baseLevelM:0};
 const cells=Array.from({length:20},(_,i)=>({ix:i+5,iz:10,x1:i+6,z1:11,dist2:20000,z:200}));
 const polygons=Array.from({length:400},(_,j)=>{const x=j%20,z=Math.floor(j/20);return [{x,y:x*.1,z},{x:x+1,y:(x+1)*.1,z},{x:x+1,y:(x+1)*.1,z:z+1},{x,y:x*.1,z:z+1}]});
 const c=context({webglState:{gl,ready:true},webglScreenRoll:0,webglFloatCount:0,trackData:{customWorld:{_apexUnifiedGroundAtlas:{svgFaces:1}}},apexGpuFrameStats:{staticUploadBytes:0,bufferAllocations:0},
 apexPlateTerrainGrid:()=>grid,apexCollectTerrainPlateCells:()=>cells,apexInspectionFullScene:()=>false,apexInspectionActive:()=>false,mobileRenderPressure:()=>0,mobilePerformanceMode:()=>mobile,
 apexTerrainStaticKind:()=> 'PORTAL',apexTerrainFinePatch:()=>polygons,apexPhase4TerrainPacket:()=>polygons[0],apexUnifiedTerrainCellPieces:()=>null,
 worldToCamera:(x,y,z)=>(stats.world++,{x,y,z}),webglPushCamPoly:poly=>{stats.polys++;},webglPushCamQuad:()=>{stats.polys++;},
 apexPhase5GpuProgram:()=>({program:{},attrs:{},uniforms:{}}),webglCssColor:()=>[.3,.4,.2,1],shadeColor:c=>c,renderProfileAdd(){},renderProfileMeasure:(key,fn)=>fn(),
 });
 load(c,src,['apexForEachTerrainPlateCell','webglPushTerrainPlateMesh','apexPhase5TerrainRelease','apexPhase5TerrainError','apexPhase5TerrainCanDraw','apexPhase5PrepareGpuTerrain',...(optimized?['apexTerrainGpuCellKey']:[])],['apexPhase5TerrainGPU']);
 vm.runInContext('apexPhase5TerrainGPU.program={};',c);
 c.step=()=>vm.runInContext('webglPushTerrainPlateMesh({x:0,y:0,z:0},0)',c);
 c.snapshot=()=>JSON.parse(vm.runInContext('JSON.stringify({gpu:apexPhase5TerrainGPU.gpuCells,packets:apexPhase5TerrainGPU.packetMisses,triangles:apexPhase5TerrainGPU.triangles})',c));
 c.stats=stats;c.grid=grid;c.cells=cells;c.gl=gl;c.polygons=polygons;return c;
}
const oldTerrain=terrain(baseline,false),newTerrain=terrain(current,true);
for(let f=0;f<12;f++){oldTerrain.step();newTerrain.step();}
assert.equal(oldTerrain.stats.world,384000);assert.equal(newTerrain.stats.world,64000);assert.equal(newTerrain.snapshot().gpu,20);
assert.equal(newTerrain.snapshot().triangles,16000);
const terrainComparison={before:{...oldTerrain.stats},after:{...newTerrain.stats}};
const stable=newTerrain.stats.uploadedBytes,transforms=newTerrain.stats.world;newTerrain.step();assert.equal(newTerrain.stats.uploadedBytes,stable);assert.equal(newTerrain.stats.world,transforms);
// Uploaded fine vertices retain exact fan triangulation and elevations.
const packet=vm.runInContext('[...apexPhase5TerrainGPU.gpuEntries.values()][0].packet',newTerrain);
const expected=[];for(const poly of newTerrain.polygons)for(let j=1;j<poly.length-1;j++)for(const p of [poly[0],poly[j],poly[j+1]])expected.push(p.x,p.y,p.z,.3,.4,.2,1);
assert.deepEqual(Array.from(packet),Array.from(new Float32Array(expected)));
// Fine/coarse cannot share an entry, and GPU residency must survive CPU packet eviction.
assert.notEqual(vm.runInContext("apexTerrainGpuCellKey({ix:1,iz:2,x1:2,z1:3},'PORTAL')",newTerrain),vm.runInContext("apexTerrainGpuCellKey({ix:1,iz:2,x1:2,z1:3})",newTerrain));
vm.runInContext('apexPhase5TerrainGPU.packetCache.clear();apexPhase5TerrainGPU.packetCacheBytes=0',newTerrain);const misses=newTerrain.snapshot().packets;newTerrain.step();assert.equal(newTerrain.snapshot().packets,misses);
// GPU error -> same-frame CPU fallback, without dropping geometry.
const expectedWarnings=[];newTerrain.console={...console,warn:(...args)=>expectedWarnings.push(args[0])};newTerrain.gl.createBuffer=()=>null;vm.runInContext('apexPhase5TerrainRelease(false);apexPhase5TerrainGPU.program={};',newTerrain);const drawn=newTerrain.stats.polys;newTerrain.step();assert.equal(newTerrain.stats.polys-drawn,8000);assert.equal(expectedWarnings.length,1);
// Near camera retains CPU clipping (all 20 cells).
const near=terrain(current,true);for(const cell of near.cells)cell.dist2=1;near.step();assert.equal(near.stats.world,32000);assert.equal(near.stats.uploads,0);
const mobile=terrain(current,true,true);mobile.step();assert.equal(mobile.snapshot().gpu,2);for(let i=0;i<10;i++)mobile.step();assert.equal(mobile.snapshot().gpu,20);
console.log('PASS: exact 20-cell portal mesh; incremental admission, stable uploads, cache eviction, mobile, near clipping, CPU fallback',JSON.stringify(terrainComparison));
// Existing coverage/height test on its original production routines.
const coverage=context({clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),trackData:null});load(coverage,current,['apexPhase4TerrainCoverage','apexPhase4TerrainPacket'],['apexPhase4TerrainStats']);
const self=current.slice(current.indexOf('window.apexPhase4GroundSelfTest='),current.indexOf('\nfunction apexForEachTerrainPlateCell'));
vm.runInContext(self,coverage);assert.equal(coverage.window.apexPhase4GroundSelfTest().pass,true);console.log('PASS: 1x1/2x2 coverage and terrain heights');
// Bounded percentile window and physical-time accounting; no physics-frequency change.
const perf=context({apexRuntimePerf:null,renderProfileRaw:{roadPrepareMs:2},apexGpuFrameStats:{dynamicUploadBytes:84,staticUploadBytes:0,bufferAllocations:0},raceT:0,player:null,telemetryPerf:{}});
load(perf,current,['apexRuntimePerfReset','apexRuntimePerfRecord','apexRuntimePerfSummary']);vm.runInContext('apexRuntimePerfReset();for(let i=0;i<1000;i++)apexRuntimePerfRecord(i%100===0?100:16,1,5);',perf);
const summary=vm.runInContext('apexRuntimePerfSummary()',perf);assert.equal(summary.frames,1000);assert.equal(summary.rollingWindowFrames,600);assert.equal(summary.p95FrameMs,16);assert.equal(summary.gpuTotals.dynamicUploadBytes,84000);console.log('PASS: bounded frame percentiles and transfer counters');
// Memory recycling stays bounded across many changing selections.
const recycling=terrain(current,true,true);
for(let batch=0;batch<8;batch++){
 for(const c of recycling.cells){c.ix+=25;c.x1+=25;}
 for(let f=0;f<10;f++)recycling.step();
 assert.ok(vm.runInContext('apexPhase5TerrainGPU.capacityBytes<=8*1048576 && apexPhase5TerrainGPU.packetCacheBytes<=4*1048576',recycling));
}
assert.ok(vm.runInContext('apexPhase5TerrainGPU.gpuResets>0',recycling));
console.log('PASS: bounded GPU/CPU bytes and atlas recycling');
// Circuit without a plate must release the previous scene too.
const released=[];const ownership=context({trackData:{},apexGpuSceneTrack:null,
 apexPhase5GpuRelease:()=>released.push('ground'),apexPhase5TerrainRelease:()=>released.push('terrain')});
load(ownership,current,['apexReleaseGpuScene','apexSyncGpuScene']);
vm.runInContext('apexSyncGpuScene();apexSyncGpuScene();trackData={};apexSyncGpuScene();apexReleaseGpuScene()',ownership);
assert.equal(released.length,6);console.log('PASS: circuit ownership and release to menu/non-SVG');
// CPU projection versus the equations of the existing world-space shader.
let projected;const camera=context({W:1280,H:720,webglScreenRoll:.12,WEBGL_DEPTH_NEAR:.45,WEBGL_DEPTH_FAR:2200,WEBGL_BG_NDC:1,
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),finite:(v,d)=>Number.isFinite(v)?v:d,
 apexInspectionActive:()=>false,driverEyeHeight:()=>1.1,sceneHFov:()=>1.2,sceneHorizon:()=>320,
 webglVertex:(x,y,z)=>projected=[x,y,z]});
load(camera,current,['worldToCamera','projectLocal','webglDepthNdc','webglVertexPx']);
vm.runInContext("var const_c,const_pp",camera);
let maxError=0;
for(const pitch of [0,-.125,-.245])for(const roll of [-.12,0,.12])for(let j=0;j<100;j++){
 const cam={x:10,y:2,z:15,nx:1,nz:0,tx:0,tz:1,viewPitchRad:pitch};
 const p={x:10+Math.sin(j)*30,y:2+Math.sin(j*.7)*8,z:65+j*2};camera.cam=cam;camera.p=p;camera.webglScreenRoll=roll;
 vm.runInContext('const_c=worldToCamera(p.x,p.y,p.z,cam);const_pp=projectLocal(const_c.x,const_c.y,const_c.z);webglVertexPx(const_pp.x,const_pp.y,[],const_c.z)',camera);
 const cx=p.x-cam.x,cy=p.y-cam.y,cz=p.z-cam.z,off=pitch?1.1:0,
 yy=(cy-off)*Math.cos(pitch)-cz*Math.sin(pitch)+off,zz=(cy-off)*Math.sin(pitch)+cz*Math.cos(pitch),aspect=1280/720,f=1/Math.tan(.6),
 px=f*cx,py=(1-2*320/720)*zz+f*aspect*(yy-1.1),
 actual=[(px*Math.cos(roll)+py*Math.sin(roll)/aspect)/zz,(py*Math.cos(roll)-px*Math.sin(roll)*aspect)/zz,(2200+.45)/(2200-.45)-2*2200*.45/((2200-.45)*zz)];
 for(let axis=0;axis<3;axis++)maxError=Math.max(maxError,Math.abs(actual[axis]-projected[axis]));
}
assert.ok(maxError<1e-12);console.log('PASS: 900 projection comparisons (pitch, roll, perspective, depth), max error',maxError);
// Recover static state even when a restored WebGL context has the same identity.
const handlers={},fakeGl={DEPTH_TEST:1,LEQUAL:2,CULL_FACE:3,BLEND:4,SRC_ALPHA:5,ONE_MINUS_SRC_ALPHA:6,LINK_STATUS:7,
 createProgram:()=>({}),createBuffer:()=>({}),attachShader(){},linkProgram(){},deleteShader(){},getProgramParameter:()=>true,
 getAttribLocation:()=>0,enable(){},depthFunc(){},depthMask(){},clearDepth(){},disable(){},blendFunc(){},deleteBuffer(){},deleteProgram(){}};
const loss=context({webglState:{ready:false},rendererWebglSupport:null,
 webglCv:{dataset:{},getContext:()=>fakeGl,addEventListener:(name,fn)=>handlers[name]=fn},
 webglCompile:()=>({}),webglResizeViewport(){},rendererBackendId:()=> 'canvas2d',updateRendererBackendUi(){}});
load(loss,current,['webglInit','apexPhase5GpuRelease','apexPhase5TerrainRelease'],['apexPhase5GroundGPU','apexPhase5TerrainGPU']);
assert.equal(vm.runInContext('webglInit()',loss),true);
vm.runInContext('apexPhase5GroundGPU.gl=webglState.gl;apexPhase5TerrainGPU.gl=webglState.gl;apexPhase5GroundGPU.buffer={};apexPhase5TerrainGPU.buffer={};apexPhase5GroundGPU.failedGl=webglState.gl;apexPhase5TerrainGPU.failedGl=webglState.gl;',loss);
handlers.webglcontextlost({preventDefault(){}});assert.equal(vm.runInContext('!apexPhase5GroundGPU.buffer&&!apexPhase5TerrainGPU.buffer',loss),true);
handlers.webglcontextrestored();assert.equal(vm.runInContext('webglInit()',loss),true);assert.equal(vm.runInContext('apexPhase5GroundGPU.failedGl===null&&apexPhase5TerrainGPU.failedGl===null',loss),true);
console.log('PASS: context loss and restoration with identical GL identity');
// Interleaved static passes keep one dynamic upload and exact ordering.
const order=[],upload=[];const submitGl={ARRAY_BUFFER:1,DYNAMIC_DRAW:2,TRIANGLES:3,FLOAT:4,COLOR_BUFFER_BIT:8,DEPTH_BUFFER_BIT:16,
 viewport(){},clearColor(){},clearDepth(){},clear(){},bindBuffer(){},bufferData(){},bufferSubData:(t,offset,a)=>upload.push(a.byteLength),useProgram(){},enableVertexAttribArray(){},vertexAttribPointer(){},drawArrays:(t,first,count)=>order.push(['dynamic',first,count])};
const submit=context({webglState:{gl:submitGl,ready:true,program:{},buffer:{},aPos:0,aColor:1},webglCv:{width:1280,height:720},
 webglVertexData:new Float32Array(63),webglFloatCount:63,apexGpuFrameStats:{},apexStaticBatchPerf:{bufferGrows:0},telemetryPerf:{},renderProfileAdd(){},
 apexPhase5TerrainGPU:{pending:{offset:21},triangles:8,drawCalls:1},apexPhase5GroundGPU:{pending:{offset:42},visibleTriangles:7,submittedTriangles:10,drawCalls:1},
 apexPhase5DrawGpuTerrain:()=>{order.push(['terrain']);return true;},apexPhase5DrawGpuGround:()=>{order.push(['svg']);return true;},apexPhase5TerrainError:e=>{throw e},apexPhase5GpuGroundError:e=>{throw e}});
load(submit,current,['webglSubmit']);assert.equal(vm.runInContext('webglSubmit()',submit),true);
assert.deepEqual(order,[['dynamic',0,3],['terrain'],['dynamic',3,3],['svg'],['dynamic',6,3]]);assert.deepEqual(upload,[252]);assert.equal(submit.webglState.triangles,21);assert.equal(submit.webglState.drawCalls,5);
console.log('PASS: dynamic/terrain/SVG submission order, single upload and submitted-triangle counters');
console.log('All isolated production-function regressions passed. Browser/Android validation remains separate.');
