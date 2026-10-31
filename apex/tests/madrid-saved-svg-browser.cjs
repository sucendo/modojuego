'use strict';
// End-to-end smoke: Madrid's manifest-selected SVG (15) really imports.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
const root=path.resolve(__dirname,'../..');
const hook=`
window.__madridSavedSvgAudit={
 async importSaved(){
  const m=await fetch('circuits/manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Missing Madrid manifest');return r.json()});
  const entry=m.circuits['14-spain'];
  // Match the real "Cargar versión guardada" order: JSON first, SVG second.
  if(!entry.json)throw Error('Madrid saved JSON not configured');
  const cfg=validateCircuitJson(await fetch('circuits/'+entry.json,{cache:'no-cache'}).then(r=>{
   if(!r.ok)throw Error('Missing Madrid JSON');return r.json();
  }));
  const spec=registerCircuitFromJson(cfg);
  const backend=await apexStoreCircuitJsonOverride(spec.dir,cfg);
  if(backend==='MEMORY_ONLY')throw Error('Madrid JSON unexpectedly lost persistence');
  const svg=await fetch('circuits/'+entry.svg,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Missing Madrid SVG');return r.text()});
  const imported=await importEditableCircuitSvgText(svg,spec);
  const world=imported.worldPayload;
  const landmarks=world.landmarks||[];
  const count=t=>landmarks.filter(x=>x.type===t).length;
  const colors=readStoredCircuitJson(spec.dir)?.visual?.curbs?.colors;
  const marks=landmarks.filter(apexIsCurbAuthoringMark);
  const palette=[colors[1],colors[0]];
  const mesh=window.ApexSvgCurbs.compile(marks,()=>0,palette);
  const monumental=readStoredCircuitJson(spec.dir)?.banking?.corners?.find(c=>+c.turn===12);
  return {file:entry.svg,json:entry.json,backend,source:entry.sourceFileName,bytes:new TextEncoder().encode(svg).length,
   geometry:!!imported.geometry,revision:world.profileRevision,
   boards:imported.brakeBoards||0,stored:!!readStoredCustomTrackSvg('14-spain'),
   surfaceZones:count('surfaceZone'),curbs:marks.length,
   colors,meshColors:[...new Set(mesh.quads.map(q=>q.color))],bankProfile:monumental?.profile||[],
   bankMax:monumental?.bankDeg,bankS:monumental?.s,
   tunnelCount:count('tunnel'),landmarks:landmarks.length};
 }
};`;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
  const page=await browser.newPage({viewport:mobile?{width:844,height:390}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile});
  page.setDefaultTimeout(120000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/parts/part-027.txt',async route=>{
   const s=fs.readFileSync(path.join(root,'apex/parts/part-027.txt'),'utf8'),i=s.lastIndexOf('requestAnimationFrame(loop);');
   assert.ok(i>0,'Frame hook entry point missing');
   await route.fulfill({body:s.slice(0,i)+hook+s.slice(i),contentType:'text/plain'});
  });
  await page.goto('http://127.0.0.1:8765/apex/apex.html');
  await page.waitForFunction(()=>window.__madridSavedSvgAudit);
  // Simulate full localStorage quota, which previously aborted the Madrid
  // saved-version button before the SVG could be imported.
  await page.evaluate(()=>{
   const native=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){
    if(String(k).startsWith('apex-v523022-circuit-json-'))
     throw new DOMException('Simulated full localStorage','QuotaExceededError');
    return native.call(this,k,v);
   };
  });
  const result=await page.evaluate(()=>window.__madridSavedSvgAudit.importSaved());
  assert.equal(result.backend,'IndexedDB','Full localStorage must use durable IndexedDB JSON');
  // Hard reload: the in-memory JSON cache is gone, so the production hydration
  // before loadTrack must recover the actual JSON from IndexedDB.
  await page.reload();
  await page.waitForFunction(()=>window.__madridSavedSvgAudit);
  const rehydrated=await page.evaluate(async()=>{
   await apexHydrateLargeCircuit('14-spain');
   const j=readStoredCircuitJson('14-spain');
   return {colors:j?.visual?.curbs?.colors,bank:j?.banking?.corners?.find(c=>+c.turn===12)?.bankDeg,
    svg:!!readStoredCustomTrackSvg('14-spain')};
  });
  assert.deepEqual(rehydrated.colors,['#f2c500','#d51f27']);
  assert.equal(rehydrated.bank,13.4957);
  assert.equal(rehydrated.svg,true,'The saved SVG must survive alongside JSON');
  assert.equal(result.file,'svg/apex26_14-madrid-spain_2026-10-29.svg');
  assert.equal(result.source,'apex26_14-spain_circuito_completo (15).svg');
  assert.equal(result.bytes,788725);
  assert.equal(result.geometry,true);
  assert.equal(result.json,'json/apex26_14-madrid-spain_2026-10-29.json');
  assert.deepEqual(result.colors,['#f2c500','#d51f27']);
  assert.ok(result.meshColors.includes('#d51f27')&&result.meshColors.includes('#f2c500'),
   'SVG-authored curbs should be painted red/yellow from JSON');
  assert.equal(result.bankMax,13.4957);
  assert.ok(result.bankProfile.some(([u,deg])=>u<=.08&&deg>=5),'The Monumental has no early banking');
  assert.equal(result.stored,true);
  assert.ok(result.landmarks>=80,'Imported landmarks lost');
  assert.ok(result.surfaceZones>=10,'Runoffs missing in import');
  assert.deepEqual(errors,[],'Uncaught browser script errors');
  console.log(JSON.stringify({test:'madrid-saved-svg-browser',mobile,ok:true,...result}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
