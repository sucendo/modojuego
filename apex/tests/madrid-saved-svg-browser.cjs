'use strict';
// End-to-end smoke: Madrid's manifest-selected user proposal really imports, including authored boards.
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
  const imported=await importEditableCircuitSvgText(svg,spec,{exactRepository:entry.exactSvg});
  const world=imported.worldPayload;
  const landmarks=world.landmarks||[];
  const count=t=>landmarks.filter(x=>x.type===t).length;
  const colors=readStoredCircuitJson(spec.dir)?.visual?.curbs?.colors;
  const marks=landmarks.filter(apexIsCurbAuthoringMark);
  const palette=[colors[1],colors[0]];
  const mesh=window.ApexSvgCurbs.compile(marks,()=>0,palette);
  const monumental=readStoredCircuitJson(spec.dir)?.banking?.corners?.find(c=>+c.turn===12);
  return {file:entry.svg,json:entry.json,backend,source:entry.sourceFileName,bytes:new TextEncoder().encode(svg).length,
   geometry:!!imported.geometry,exact:imported.geometryPayload.rawSvg===svg,revision:world.profileRevision,
   importedRacingSamples:imported.geometryPayload?.racingLine?.length||0,
   boards:imported.brakeBoards||0,boardsAuthoritative:world.brakeBoardsAuthoritative===true,stored:!!readStoredCustomTrackSvg('14-spain'),
   surfaceZones:count('surfaceZone'),curbs:marks.length,
   colors,meshColors:[...new Set(mesh.quads.map(q=>q.color))],bankProfile:monumental?.profile||[],
   bankMax:monumental?.bankDeg,bankS:monumental?.s,
   tunnelCount:count('tunnel'),landmarks:landmarks.length};
 },
 async importBoardDeletionCases(){
   // Simulate Boxy removing the root metadata, and then deleting every
   // active sign. The authored layer still makes the empty set definitive.
   const svg=await fetch('circuits/svg/apex26_14-madrid-spain_2026-11-03.svg',{cache:'no-cache'}).then(r=>r.text());
   const spec=calendar.find(c=>c.dir==='14-spain');
   const withoutFlag=svg.replace(' data-apex-brake-boards-authoritative="true"','');
   const authored=await importEditableCircuitSvgText(withoutFlag,spec,{persist:false});
   const doc=new DOMParser().parseFromString(withoutFlag,'image/svg+xml');
   const layer=doc.querySelector('#APEX_BRAKING_MARKERS');
   if(!layer)throw Error('Missing braking marker authoring layer');
   for(const el of [...layer.querySelectorAll('[data-apex-role="distance-board"]')])el.remove();
   const removed=await importEditableCircuitSvgText(new XMLSerializer().serializeToString(doc),spec,{persist:false});
   return {withoutFlag:{boards:authored.brakeBoards,authoritative:authored.worldPayload.brakeBoardsAuthoritative},
     allRemoved:{boards:removed.brakeBoards,authoritative:removed.worldPayload.brakeBoardsAuthoritative}};
 },
 async hydrateStatus(){
   await apexHydrateLargeCircuit('14-spain');
   const j=readStoredCircuitJson('14-spain');
   const spec=calendar.find(c=>c.dir==='14-spain'),previous=trackData;
   let curbVisual=null,racingStatus=null;
   try{
    trackData=await loadTrack(spec);trackData.spec=spec;prepareTrackModel();
    const authored=(trackData.customWorld?.landmarks||[]).filter(apexIsCurbAuthoringMark);
    const faces=apexAuthoredCurbVisual(),painted=new Set(faces.map(face=>face.sourceId));
    curbVisual={authored:authored.length,faces:faces.length,missing:authored.filter(mark=>!painted.has(mark.sourceId)).map(mark=>mark.sourceId),colors:[...new Set(faces.map(face=>face.color))]};
    const line=apexAuthoredRacingProfile();
    racingStatus={valid:!!line?.valid,source:autoUniversalRacingReference(100)?.source||null,samples:line?.line?.length||0};
   }finally{trackData=previous;}
   return {curbVisual,racingStatus,colors:j?.visual?.curbs?.colors,bank:j?.banking?.corners?.find(c=>+c.turn===12)?.bankDeg,
    svg:!!readStoredCustomTrackSvg('14-spain'),boards:readStoredCustomWorldProfile('14-spain')?.brakeBoards?.length||0,
    boardsAuthoritative:readStoredCustomWorldProfile('14-spain')?.brakeBoardsAuthoritative===true};
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
  const rehydrated=await page.evaluate(()=>window.__madridSavedSvgAudit.hydrateStatus());
  assert.deepEqual(rehydrated.colors,['#f2c500','#d51f27']);
  assert.equal(rehydrated.bank,13.4957);
  assert.equal(rehydrated.svg,true,'The saved SVG must survive alongside JSON');
  console.log('APEX_RACING_LINE_BROWSER_DIAGNOSTIC',JSON.stringify({imported:{curbs:result.curbs,landmarks:result.landmarks,boards:result.boards,bytes:result.bytes},rehydrated}));
  assert.ok(result.importedRacingSamples>900,'Saved Madrid SVG must import the authored racing-line geometry');
  assert.equal(rehydrated.racingStatus?.valid,true,'Authored path must survive hydration and track-model preparation');
  assert.equal(rehydrated.racingStatus?.source,'SVG_AUTHORED','AUT must use SVG_AUTHORED rather than MODEL_REFERENCE');
  assert.ok(rehydrated.curbVisual.authored>0&&rehydrated.curbVisual.faces>0,'The loaded circuit must compile the authored kerbs for the live renderer');
  assert.deepEqual(rehydrated.curbVisual.missing,[],'Every saved kerb must reach the live renderer');
  assert.deepEqual(rehydrated.curbVisual.colors.sort(),['#d51f27','#f2c500']);
  assert.equal(rehydrated.boards,68,'Hydrated SVG must retain 34 pairs of braking boards');
  assert.equal(rehydrated.boardsAuthoritative,true,'Hydration must not generate deleted boards');
  assert.equal(result.file,'svg/apex26_14-spain_circuito-propuesta-20261110.svg');
  assert.equal(result.source,'apex26_14-spain_circuito-propuesta-20261110.svg');
  assert.equal(result.bytes,fs.statSync(path.join(root,'apex/circuits',result.file)).size);
  assert.equal(result.geometry,true);
  assert.equal(result.exact,true,'Keep the saved complete SVG byte-for-byte');
  assert.equal(result.boards,68,'Only active SVG signs may be imported (not 4 library templates)');
  assert.equal(result.boardsAuthoritative,true,'SVG signs must suppress procedural additions');
  assert.equal(result.json,'json/apex26_14-madrid-spain_2026-10-29.json');
  assert.deepEqual(result.colors,['#f2c500','#d51f27']);
  assert.ok(result.meshColors.includes('#d51f27')&&result.meshColors.includes('#f2c500'),
   'SVG-authored curbs should be painted red/yellow from JSON');
  assert.equal(result.bankMax,13.4957);
  assert.ok(result.bankProfile.some(([u,deg])=>u<=.08&&deg>=5),'The Monumental has no early banking');
  assert.equal(result.stored,true);
  assert.ok(result.landmarks>=52,'Imported authored landmarks must remain active (excluding the library)');
  assert.equal(result.curbs,14,'Use the pianos authored in this edition');
  assert.ok(result.surfaceZones>=10,'Runoffs missing in import');
  const deletionCases=await page.evaluate(()=>window.__madridSavedSvgAudit.importBoardDeletionCases());
  assert.deepEqual(deletionCases.withoutFlag,{boards:34,authoritative:true},
    'Boxy may drop the root attribute, but authored boards still override automatic signs');
  assert.deepEqual(deletionCases.allRemoved,{boards:0,authoritative:true},
    'Deleting ALL active board shapes must not resurrect procedural signs');
  assert.deepEqual(errors,[],'Uncaught browser script errors');
  console.log(JSON.stringify({test:'madrid-saved-svg-browser',mobile,ok:true,...result}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
