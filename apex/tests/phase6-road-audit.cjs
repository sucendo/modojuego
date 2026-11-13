/* Synthetic regression of production phase-6 functions against v0.13.21.
   No driver, browser or FPS claims. */
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),source=Array.from({length:28},(_,i)=>fs.readFileSync(path.join(root,`apex/parts/part-${String(i).padStart(3,'0')}.txt`),'utf8')).join('');
const ref='ef8ce60249ccfef28d97d16650bf6e94eaa62b01',old=cp.execFileSync('git',['show',`${ref}:apex/parts/part-024.txt`],{cwd:root,encoding:'utf8',maxBuffer:5e6});
function func(s,name){const start=s.indexOf(`function ${name}(`);assert.ok(start>=0,name);let asyncStart=s.slice(start-6,start)==='async '?start-6:start;for(let end=s.indexOf('}',start);end>=0;end=s.indexOf('}',end+1)){const code=s.slice(asyncStart,end+1);try{new vm.Script(`(${code})`);return code}catch{}}throw Error(name);}
function decl(name){const start=source.indexOf(`const ${name}=`);assert.ok(start>=0,name);for(let end=source.indexOf(';',start);end>=0;end=source.indexOf(';',end+1)){const code=source.slice(start,end+1);try{new vm.Script(code);return code}catch{}}}
const stats={uploads:0,bytes:0,allocations:0,deletions:0,draws:0},triangles=[],cpu=[];let currentColor=null;
const gl={ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,STATIC_DRAW:3,DYNAMIC_DRAW:4,TRIANGLES:5,UNSIGNED_INT:6,FLOAT:7,
 createBuffer:()=>({bytes:null}),deleteBuffer(){stats.deletions++;},deleteProgram(){},bindBuffer(t,b){this[t]=b;},
 bufferData(t,data){stats.allocations++;const target=this[t];target.bytes=typeof data==='number'?new Uint8Array(data):new Uint8Array(data.buffer,data.byteOffset,data.byteLength).slice();},
 bufferSubData(t,offset,data){stats.uploads++;stats.bytes+=data.byteLength;this[t].bytes.set(new Uint8Array(data.buffer,data.byteOffset,data.byteLength),offset);},
 useProgram(){},enableVertexAttribArray(){},disableVertexAttribArray(){},vertexAttribPointer(){},uniform3f(){},uniform2f(){},uniform4f(){},vertexAttrib4f(a,...rgba){currentColor=rgba;},
 drawElements(t,count,type,offset){stats.draws++;const points=new Float32Array(this[this.ARRAY_BUFFER].bytes.buffer),indices=new Uint32Array(this[this.ELEMENT_ARRAY_BUFFER].bytes.buffer,offset,count);
 for(let i=0;i<count;i+=3){const verts=[];for(let j=0;j<3;j++){const at=indices[i+j]*3;verts.push([points[at],points[at+1],points[at+2]]);}triangles.push({color:[...currentColor],verts});}},
};
const samples=Array.from({length:129},(_,i)=>i*(2*Math.PI*120)/128),td={samples,customWorld:{},km:2*Math.PI*120/1000};
function world(s){const angle=s/120,bank=Math.sin(angle*3)*.16,width=6+Math.sin(angle),x=120*Math.sin(angle),z=400+120*Math.cos(angle),y=9*Math.sin(angle*2),ox=Math.sin(angle),oz=Math.cos(angle);
 const point=(w,flat=false)=>({x:x+ox*w,y:y+Math.tan(bank)*(flat?Math.max(-width,Math.min(width,w)):w),z:z+oz*w});
 return {q:{x,y,z},env:{half:width},curb:{left:true,right:true},points:[{x,y,z},point(width),point(-width),point(width+.75,true),point(-width-.75,true),point(width+4,true),point(-width-4,true)]};}
const c=vm.createContext({console,performance,Float32Array,Uint32Array,Uint8Array,Map,window:{},Math,Number,trackData:td,webglState:{gl,ready:true},webglScreenRoll:0,webglFloatCount:0,webglColorCache:new Map(),apexGpuFrameStats:{staticUploadBytes:0,bufferAllocations:0},
 W:1280,H:720,WEBGL_DEPTH_NEAR:.45,WEBGL_DEPTH_FAR:2200,driverEyeHeight:()=>1.1,sceneHFov:()=>1.2,sceneHorizon:()=>320,
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t,
 mobile:false,mobilePerformanceMode:()=>c.mobile,mobileControlProfile:()=>({curbMax:600}),mobileRenderPressure:()=>.5,
 apexInspectionActive:()=>false,apexInspectionFullScene:()=>false,apexRoadMeshSamples:()=>td.samples,apexRoadWorldNode:world,apexCompilerYield:async()=>{},
 apexPhase5GpuProgram:()=>({program:{},attrs:{world:0,color:1},uniforms:{}}),
 palette:()=>({road:c.roadColor||'#484d52'}),circuitCurbPair:seed=>(seed&1)?['#f3f4f5','#d93a48']:['#d93a48','#f3f4f5'],
 apexUnifiedGroundStrip:()=>({runoffLeft:[],runoffRight:[]}),surfaceColor:()=> '#000000',
 webglPushCamQuad:(a,b,d,e,pitch,color)=>{for(const vertices of [[a,b,d],[a,d,e]])cpu.push({color:c.webglCssColor(color),verts:vertices.map(p=>[p.x,p.y,p.z])});},
});
const names=['camMix','shadeColor','webglCssColor','webglCircuitRoadColor','apexPhase6CompileRoadMesh','apexPhase6RoadRelease','apexPhase6RoadError','apexPhase6BeginRoad','apexPhase6RoadSegmentId','apexPhase6RoadStyle','apexPhase6RoadGroup','apexPhase6RoadQuad','apexPhase6QueueRoadBase','apexPhase6SealRoad','apexPhase6DrawRoad','apexWebglRoadBase'];
vm.runInContext(decl('apexPhase6RoadGPU')+'\n'+names.map(n=>func(source,n)).join('\n'),c);
vm.runInContext(func(old,'apexUnifiedGroundDrawCorridor').replace('function apexUnifiedGroundDrawCorridor','function referenceCorridor'),c);
function step(i){const w=world(samples[i===128?0:i]),p=w.points;return{meshNode:i,s:samples[i],sd:10,q:w.q,env:w.env,curb:w.curb,v:{c:p[0],l:p[1],r:p[2],lo:p[3],ro:p[4],lx:p[5],rx:p[6]}};}
function segment(a,b){return{a:step(a),b:step(b),z:400};}
const cam={x:0,y:0,z:0,nx:1,nz:0,tx:0,tz:1,viewPitchRad:0};
function key(t){return t.color.map(v=>v.toFixed(6)).join(',')+':'+t.verts.flat().map(v=>Math.fround(v).toFixed(6)).join(',');}
function compare(expected,actual){assert.deepEqual(actual.map(key).sort(),expected.map(key).sort());}
(async()=>{
 const mesh=await c.apexPhase6CompileRoadMesh();assert.equal(mesh.sectors.length,4);assert.equal(mesh.data.length,129*18);
 // Shared node indices guarantee exact equality at all sector seams.
 for(let i=32;i<128;i+=32){const shared=Array.from(mesh.data.slice(i*18,(i+1)*18));assert.ok(shared.every(Number.isFinite));assert.equal(mesh.sectors[i/32-1].end,mesh.sectors[i/32].first);}
 for(let j=0;j<18;j++)assert.equal(mesh.data[j],mesh.data[128*18+j]);
 assert.equal(c.apexPhase6BeginRoad(cam,0),true);
 const all=[];for(let i=0;i<128;i++)all.push(segment(i,(i+1)%128));
 for(const seg of all)c.apexWebglRoadBase(seg,0);assert.equal(cpu.length,0);assert.equal(c.apexPhase6SealRoad(),true);assert.equal(c.apexPhase6DrawRoad(),true);
 const gpu=[...triangles];cpu.length=0;for(const seg of all)c.referenceCorridor(seg,cam,0,true);compare(cpu,gpu);
 const beforeBytes=cpu.length*3*28,firstIndexBytes=stats.bytes;
 assert.equal(firstIndexBytes,cpu.length*3*4);
 console.log('PASS phase6: 128 banked/elevated segments, sector seams, curb/asphalt continuity and exact legacy triangle recipes',JSON.stringify({legacyDynamicBytes:beforeBytes,indexBytes:firstIndexBytes,staticVertexBytes:mesh.data.byteLength,drawCalls:stats.draws}));
 // Reverse traversal must use the OTHER original diagonal, not a mirrored approximation.
 triangles.length=0;cpu.length=0;c.apexPhase6BeginRoad(cam,0);const reversed=all.map(seg=>({...seg,a:seg.b,b:seg.a}));for(const seg of reversed)c.apexWebglRoadBase(seg,0);c.apexPhase6SealRoad();c.apexPhase6DrawRoad();const reverseGpu=[...triangles];for(const seg of reversed)c.referenceCorridor(seg,cam,0,true);compare(cpu,reverseGpu);console.log('PASS phase6: reverse direction and lap seam use original triangulation');
 // Same selection and moving camera do not resend geometry/indices or allocate buffers.
 const allocations=stats.allocations,uploads=stats.uploads,arrayGrows=vm.runInContext('apexPhase6RoadGPU.indexArrayGrows',c);
 for(let i=0;i<1000;i++){triangles.length=0;assert.equal(c.apexPhase6BeginRoad({...cam,viewPitchRad:i%2?-.245:0},0),true);for(const seg of reversed)c.apexWebglRoadBase(seg,0);assert.equal(c.apexPhase6SealRoad(),true);}
 assert.equal(stats.allocations,allocations);assert.equal(stats.uploads,uploads);assert.equal(vm.runInContext('apexPhase6RoadGPU.indexArrayGrows',c),arrayGrows);assert.ok(vm.runInContext('apexPhase6RoadGPU.groups.length<=64',c));console.log('PASS phase6: 1000-frame synthetic session; zero new geometry/index transfers or buffer allocations for stable selection/camera changes');
 // Climate changes update material constants without rebuilding vertex buffers.
 c.roadColor='#242a31';triangles.length=0;cpu.length=0;c.apexPhase6BeginRoad(cam,0);for(const seg of all)c.apexWebglRoadBase(seg,0);c.apexPhase6SealRoad();c.apexPhase6DrawRoad();const wet=[...triangles];for(const seg of all)c.referenceCorridor(seg,cam,0,true);compare(cpu,wet);assert.equal(stats.allocations,allocations);
 // Moving ends, near-plane crossings and alpha colours retain CPU geometry.
 cpu.length=0;c.apexPhase6BeginRoad(cam,0);const moving=segment(0,1);moving.a.meshNode=-1;c.apexWebglRoadBase(moving,0);assert.equal(cpu.length,10);
 const near=segment(0,1);near.a.v.l={...near.a.v.l,z:.5};c.apexWebglRoadBase(near,0);assert.equal(cpu.length,20);
 // Fail while sealing: replay only suppressed bases, never runoff or a second road.
 cpu.length=0;c.apexPhase6BeginRoad(cam,0);c.apexWebglRoadBase(all[0],0);const originalSub=gl.bufferSubData;gl.bufferSubData=()=>{throw Error('injected upload failure');};vm.runInContext('apexPhase6RoadGPU.indexCount=-1',c);assert.equal(c.apexPhase6SealRoad(),false);assert.equal(cpu.length,10);gl.bufferSubData=originalSub;
 vm.runInContext('apexPhase6RoadGPU.failedGl=null',c);c.apexPhase6BeginRoad(cam,0);c.apexPhase6RoadRelease(true);assert.equal(vm.runInContext('apexPhase6RoadGPU.buffer===null&&apexPhase6RoadGPU.indexBuffer===null&&apexPhase6RoadGPU.mesh===null',c),true);
 console.log('PASS phase6: weather palette, moving endpoints, near clipping, same-frame failure replay, complete buffer release');
 // Mobile cheap mode uses only one asphalt quad, never both asphalt meshes.
 c.mobile=true;c.mobileRenderPressure=()=>.2;triangles.length=0;cpu.length=0;c.apexPhase6BeginRoad(cam,0);
 const cheapSegments=all.map(seg=>({...seg,z:100}));for(const seg of cheapSegments)c.apexWebglRoadBase(seg,0);c.apexPhase6SealRoad();c.apexPhase6DrawRoad();const cheapGpu=[...triangles];
 for(const seg of cheapSegments)c.referenceCorridor(seg,cam,0,true);compare(cpu,cheapGpu);assert.equal(cheapGpu.length,128*6);
 // A custom alpha palette retains the original CPU blending path.
 c.apexPhase6BeginRoad(cam,0);cpu.length=0;const curbPair=c.circuitCurbPair;c.circuitCurbPair=()=>['rgba(220,20,30,.5)','#f3f4f5'];c.apexWebglRoadBase(cheapSegments[0],0);assert.equal(cpu.length,6);c.circuitCurbPair=curbPair;c.apexPhase6SealRoad();
 console.log('PASS phase6: mobile single-quad asphalt and transparent custom kerbs');
 // The existing SVG runoff ownership/clipped faces remain in the CPU corridor.
 c.mobile=false;c.apexPhase6BeginRoad(cam,0);cpu.length=0;
 const clipped=[{x:200,y:4,z:300},{x:204,y:4.1,z:300},{x:202,y:4.2,z:304}];
 c.apexUnifiedGroundStrip=()=>({runoffLeft:[clipped],runoffRight:[]});c.worldToCamera=(x,y,z)=>({x,y,z});
 c.webglPushCamPoly=(poly,pitch,color)=>cpu.push({color:c.webglCssColor(color),verts:poly.map(p=>[p.x,p.y,p.z])});
 vm.runInContext(func(source,'apexUnifiedGroundDrawCorridor').replace('function apexUnifiedGroundDrawCorridor','function newCorridor'),c);
 c.newCorridor(all[0],cam,0,true);assert.equal(cpu.length,1);assert.deepEqual(cpu[0].verts,clipped.map(p=>[p.x,p.y,p.z]));assert.equal(c.apexPhase6SealRoad(),true);
 assert.equal(vm.runInContext('apexPhase6RoadGPU.triangles',c),10);console.log('PASS phase6: existing clipped SVG runoff emitted once with unchanged heights');
 // Explicit hysteresis on mobile: no rapid switching around old 42 m threshold.
 c.mobile=true;c.apexPhase6BeginRoad(cam,0);vm.runInContext('apexPhase6RoadGPU.mesh.lod.fill(0);apexPhase6RoadGPU.mesh.curbLod.fill(0)',c);const lod=segment(0,1);lod.z=40;assert.equal(c.apexPhase6RoadStyle(lod,.2).cheap,false);lod.z=43;assert.equal(c.apexPhase6RoadStyle(lod,.2).cheap,false);lod.z=50;assert.equal(c.apexPhase6RoadStyle(lod,.2).cheap,true);lod.z=40;assert.equal(c.apexPhase6RoadStyle(lod,.2).cheap,true);lod.z=34;assert.equal(c.apexPhase6RoadStyle(lod,.2).cheap,false);
 c.apexPhase6RoadRelease(true);console.log('PASS phase6: mobile LOD hysteresis with unchanged essential geometry');
 // The new pass must be between all opaque bases and transparent road effects.
 const order=[],uploadsLog=[],submitGl={ARRAY_BUFFER:1,DYNAMIC_DRAW:2,TRIANGLES:3,FLOAT:4,COLOR_BUFFER_BIT:8,DEPTH_BUFFER_BIT:16,
  viewport(){},clearColor(){},clearDepth(){},clear(){},bindBuffer(){},bufferData(){},bufferSubData:(t,o,d)=>uploadsLog.push(d.byteLength),useProgram(){},enableVertexAttribArray(){},vertexAttribPointer(){},drawArrays:(t,a,n)=>order.push(['dynamic',a,n])};
 const submit=vm.createContext({console,performance,Math,webglState:{gl:submitGl,ready:true,program:{},buffer:{},aPos:0,aColor:1},webglCv:{width:100,height:100},
  webglVertexData:new Float32Array(84),webglFloatCount:84,apexGpuFrameStats:{},apexStaticBatchPerf:{bufferGrows:0},telemetryPerf:{},renderProfileAdd(){},
  apexPhase5TerrainGPU:{pending:{offset:21},triangles:8,drawCalls:1},apexPhase5GroundGPU:{pending:{offset:42},submittedTriangles:10,drawCalls:1},apexPhase6RoadGPU:{pending:{offset:63},triangles:20,drawCalls:4},
  apexPhase5DrawGpuTerrain:()=>{order.push(['terrain']);return true;},apexPhase5DrawGpuGround:()=>{order.push(['svg']);return true;},apexPhase6DrawRoad:()=>{order.push(['road']);return true;},
  apexPhase5TerrainError:e=>{throw e},apexPhase5GpuGroundError:e=>{throw e},apexPhase6RoadError:e=>{throw e}});
 vm.runInContext(func(source,'webglSubmit'),submit);assert.equal(submit.webglSubmit(),true);
 assert.deepEqual(order,[['dynamic',0,3],['terrain'],['dynamic',3,3],['svg'],['dynamic',6,3],['road'],['dynamic',9,3]]);assert.deepEqual(uploadsLog,[336]);assert.equal(submit.webglState.triangles,42);
 console.log('PASS phase6: terrain/SVG/road/effects ordering, depth and one dynamic upload');

})().catch(e=>{console.error(e);process.exitCode=1;});
