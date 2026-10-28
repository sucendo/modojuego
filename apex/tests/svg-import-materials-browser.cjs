'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const root=path.resolve(__dirname,'../..'),fixture=process.env.APEX_SVG_FIXTURE||path.join(root,'apex/circuits/svg/apex26_14-madrid-spain.svg'),raw=fs.readFileSync(fixture,'utf8');
const hook=fs.readFileSync(path.join(__dirname,'browser-hook.js'),'utf8')+`
window.__svgImportAudit={
 async import(raw){const result=await importEditableCircuitSvgText(raw,calendar.find(s=>s.dir==='14-spain'));return {revision:result.worldPayload.profileRevision,authoritative:result.worldPayload.curbGeometryAuthoritative,marks:result.worldPayload.landmarks.filter(apexIsCurbAuthoringMark).map(m=>({id:m.sourceId,width:m.width,runs:m.curbRuns,first:m.worldPath[0]})),surfaces:result.worldPayload.landmarks.filter(m=>m.type==='surfaceZone').map(m=>({color:m.color,kind:m.surfaceKind}))};},
 view(){setAutoDriveMode(0,false);paused=true;countdown=0;rivals.length=0;const m=apexAuthoredCurbMesh().segments[0],st=nearestTrackState(m.x+m.dx*.5,m.z+m.dz*.5,null),q=poseAt(st.s-15);player.s=st.s-15;player.x=q.x;player.z=q.z;player.heading=Math.atan2(q.tx,q.tz);player.speed=0;apexSetCameraMode('tcam',{silent:true});},
 snapshot(){const mesh=apexAuthoredCurbMesh(),first=mesh.segments[0],x=first?first.x+first.dx*.5:0,z=first?first.z+first.dz*.5:0;return {audit:apexCurbAuthoringAudit(),source:curbInfo(player.s).source,quads:mesh.quads.length,hit:first?apexUnifiedSurfaceAtWorld(x,z).kind:null,revision:trackData.customWorld.profileRevision,colors:trackData.customWorld.landmarks.filter(m=>m.type==='surfaceZone').map(m=>m.color),glError:webglState.gl?.getError()};},
 edit(raw,mode){const doc=new DOMParser().parseFromString(raw,'image/svg+xml'),root=doc.documentElement;
  if(mode==='empty'){root.setAttribute('data-apex-curbs-authoritative','true');doc.querySelectorAll('[data-apex-role="curb-left"],[data-apex-role="curb-right"]').forEach(el=>el.remove());}
  else{const curb=doc.querySelector('#apex_curb_left_0_role');curb.setAttribute('transform','translate(15 0) '+(curb.getAttribute('transform')||''));const surface=doc.querySelector('[data-apex-role="runoff-asphalt"]');surface.style.fill='#2d50ac';}
  return new XMLSerializer().serializeToString(doc);
 },
 async legacy(){const spec=calendar.find(s=>s.dir==='14-spain'),geometry=readStoredCustomTrackSvg(spec.dir),world=JSON.parse(JSON.stringify(readStoredCustomWorldProfile(spec.dir),(key,value)=>key.startsWith('_')?undefined:value));world.profileRevision=23082;delete world.curbGeometryAuthoritative;for(const m of world.landmarks){delete m.curbRuns;if(m.type==='surfaceZone')m.color='#676d72';}await apexSaveLargeCircuit(spec.dir,geometry,world);}
};`;
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/tmp/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile',p=await browser.newPage(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:720}}),errors=[];p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/parts/part-027.txt',async r=>{const s=fs.readFileSync(path.join(root,'apex/parts/part-027.txt'),'utf8'),i=s.lastIndexOf('requestAnimationFrame(loop);');await r.fulfill({body:s.slice(0,i)+hook+s.slice(i),contentType:'text/plain'});});
 await p.goto('http://127.0.0.1:8765/apex/apex.html');await p.waitForFunction(()=>window.__svgImportAudit&&window.ApexSvgCurbs);
 const original=await p.evaluate(raw=>__svgImportAudit.import(raw),raw);assert.ok(original.marks.length>0);assert.equal(original.authoritative,true);assert.ok(original.marks.every(m=>m.runs.length&&m.runs.every(r=>r.length>=2)));
 if(process.env.APEX_SVG_FIXTURE){for(const color of ['#2d50ac','#cf2830','#e0e65e'])assert.ok(original.surfaces.some(s=>s.color===color&&s.kind==='ASPHALT'),'Custom painted asphalt '+color);}
 const modifiedRaw=await p.evaluate(raw=>__svgImportAudit.edit(raw,'move'),raw),moved=await p.evaluate(raw=>__svgImportAudit.import(raw),modifiedRaw);
 assert.ok(Math.hypot(moved.marks[0].first[0]-original.marks[0].first[0],moved.marks[0].first[1]-original.marks[0].first[1])>8,'SVG lateral movement survives import');assert.equal(moved.surfaces[0].color,'#2d50ac');
 await p.evaluate(()=>__apexAudit.load('14-spain',false));const views=[];for(const camera of ['cockpit','tcam','chase']){await p.evaluate(c=>__apexAudit.camera(c),camera);await p.waitForTimeout(300);const s=await p.evaluate(()=>__svgImportAudit.snapshot());assert.ok(s.quads>0);assert.equal(s.hit,'KERB');assert.equal(s.source,'SVG_EXACT_STRIPS');assert.equal(s.glError,0);views.push(s);}
 await p.evaluate(()=>__svgImportAudit.view());await p.waitForTimeout(350);await p.screenshot({path:'/tmp/svg-curbs-'+(mobile?'mobile':'desktop')+'.png'});
 assert.equal(await p.evaluate(()=>__apexAudit.backend('canvas2d')),true);await p.waitForTimeout(400);assert.equal((await p.evaluate(()=>__svgImportAudit.snapshot())).hit,'KERB');
 await p.evaluate(()=>__svgImportAudit.legacy());await p.reload();await p.waitForFunction(()=>window.__svgImportAudit&&window.ApexSvgCurbs);await p.evaluate(()=>__apexAudit.load('14-spain',false));const restored=await p.evaluate(()=>__svgImportAudit.snapshot());assert.equal(restored.revision,23091);assert.ok(restored.colors.includes('#2d50ac'));assert.equal(restored.hit,'KERB');
 const empty=await p.evaluate(raw=>__svgImportAudit.edit(raw,'empty'),modifiedRaw);assert.equal((await p.evaluate(raw=>__svgImportAudit.import(raw),empty)).marks.length,0);
 await p.evaluate(()=>__apexAudit.load('14-spain',false));const blank=await p.evaluate(()=>__svgImportAudit.snapshot());assert.equal(blank.quads,0);assert.equal(blank.source,'SVG_EXACT_STRIPS');assert.deepEqual(errors,[]);
 console.log(JSON.stringify({test:'svg-import-kerbs-and-paint',mobile,marks:original.marks.length,colors:original.surfaces,moved:true,quads:views[0].quads,threeCameras:true,canvas:true,indexedDbMigration:true,emptyPreserved:true,ok:true}));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
