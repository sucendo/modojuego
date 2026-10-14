/* Real Chromium regression: large HXZ2 import inside a cross-origin iframe.
 * This reproduces the hexategos-pruebas embedding pattern without changing main.
 */
const assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[
 process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()
]}));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 let crashed=false;
 const errors=[];
 page.on('crash',()=>{crashed=true});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  const origin=process.env.HEX_TEST_URL||'http://127.0.0.1:8765/hexategos/';
  await page.goto('http://127.0.0.1:8766/hexategos/tests/test-iframe-03894.html',
   {waitUntil:'load',timeout:120000});
  const frame=page.frameLocator('iframe');
  assert.notEqual(new URL(origin).origin,new URL(page.url()).origin,
   'The two served documents must have different origins');
  const game=page.frames().find(f=>f!==page.mainFrame()&&
   new URL(f.url()).pathname==='/hexategos/');
  assert(game,'Game iframe not found');
  await game.waitForFunction(()=>typeof fnv1a3273==='function'&&typeof loadLevel==='function'&&
    typeof bootCoreWorld3305==='function',null,{timeout:90000});
  // Generate a full-size portable game without a UI new-world dialog. The
  // actual user workflow starts by importing from the landing page.
  const file=await game.evaluate(async()=>{
   bootCoreWorld3305();
   const L=loadLevel(MAX_GAME_LEVEL3233),owner=new Array(L.n).fill(-1);
   const capitals=SEED_CELLS3230.slice(0,150);
   const cities=[];
   for(let f=0;f<capitals.length;f++){
     const c=capitals[f];
     if(Number.isInteger(c)&&c>=0&&c<L.n&&L.land[c]>=0){
       owner[c]=f;cities.push(c);
     }
   }
   const main={
     v:'3.27.5',factionCount:150,owner,
     gold:16384,campaignSeconds:75,troops:Array(500).fill(225),
     botGold:Array(500).fill(140),forts:Array(L.n).fill(0),
     cities,cityLevels:Array(L.n).fill(0),
     industries:[],industryLevels:Array(L.n).fill(0),
     roads:[],ports:[],capitals
   };
   for(const c of cities)main.cityLevels[c]=1;
   const payload={main,naval:{groups:[],transports:[]},cityNames:[],mapMode:'political'};
   const save={magic:'OPENFRONT_SAVE',schema:2,gameVersion:'0.38.93',
     meshLevel:MAX_GAME_LEVEL3233,meshCells:L.n,campaignSeconds:75,
     checksum:fnv1a3273(JSON.stringify(payload)),payload};
   const data=new TextEncoder().encode(JSON.stringify(save));
   const gzip=new Uint8Array(await new Response(
      new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'))
   ).arrayBuffer());
   return Array.from(new Uint8Array([72,88,90,50,0,...gzip]));
  });
  assert(file.length>1000);
  await frame.locator('#landingFile3305').setInputFiles({
   name:'HEXATEGOS_TEST_510762.hexategos',
   mimeType:'application/octet-stream',
   buffer:Buffer.from(file)
  });
  const confirm=frame.locator('.hexUnifiedDialog03851');
  await confirm.waitFor({state:'visible',timeout:20000});
  await confirm.getByRole('button',{name:'Cargar partida'}).click();
  await game.waitForFunction(()=>gold3212===16384,null,{timeout:120000});
  await confirm.waitFor({state:'detached',timeout:15000});
  assert.equal(crashed,false,'Chromium renderer must remain alive');
  assert.deepEqual(errors,[],'No uncaught browser exceptions');
  const check=await game.evaluate(()=>({
   gold:gold3212,cells:owner6.length,active:started3230,
   message:window.HexategosPortableHXZ2?.stats?.().lastError||null
  }));
  assert.equal(check.gold,16384);
  assert.equal(check.active,true);
  assert.equal(check.message,null);
  console.log('CHROMIUM HXZ2 PASS: 510,762 cells imported inside iframe without renderer crash',check);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
