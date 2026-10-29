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
  const svg=await fetch('circuits/'+entry.svg,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Missing Madrid SVG');return r.text()});
  const spec=calendar.find(s=>s.dir==='14-spain');
  const imported=await importEditableCircuitSvgText(svg,spec);
  const world=imported.worldPayload;
  const landmarks=world.landmarks||[];
  const count=t=>landmarks.filter(x=>x.type===t).length;
  return {file:entry.svg,source:entry.sourceFileName,bytes:new TextEncoder().encode(svg).length,
   geometry:!!imported.geometry,revision:world.profileRevision,
   boards:imported.brakeBoards||0,stored:!!readStoredCustomTrackSvg('14-spain'),
   surfaceZones:count('surfaceZone'),curbs:landmarks.filter(x=>String(x.sourceRole||'').startsWith('curb-')).length,
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
  const result=await page.evaluate(()=>window.__madridSavedSvgAudit.importSaved());
  assert.equal(result.file,'svg/apex26_14-madrid-spain_2026-10-29.svg');
  assert.equal(result.source,'apex26_14-spain_circuito_completo (15).svg');
  assert.equal(result.bytes,788725);
  assert.equal(result.geometry,true);
  assert.equal(result.stored,true);
  assert.ok(result.landmarks>=80,'Imported landmarks lost');
  assert.ok(result.surfaceZones>=10,'Runoffs missing in import');
  assert.deepEqual(errors,[],'Uncaught browser script errors');
  console.log(JSON.stringify({test:'madrid-saved-svg-browser',mobile,ok:true,...result}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
