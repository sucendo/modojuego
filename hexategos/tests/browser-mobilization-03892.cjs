/* Real Chromium integration audit of live Hexategos assembly, state and UI.
 * HEX_TEST_URL=http://127.0.0.1:8765/hexategos/
 * CODEX_PRIMARY_RUNTIME_NODE_MODULES=/tmp/hx-playwright/node_modules
 */
const assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[
  process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()
]}));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.HEX_TEST_URL||'http://127.0.0.1:8765/hexategos/',{waitUntil:'load',timeout:120000});
  await page.getByRole('button',{name:'NUEVA PARTIDA',exact:true}).click();
  await page.getByRole('button',{name:/UBICACIÓN ALEATORIA/}).click();
  await page.getByRole('button',{name:/COMENZAR AQUÍ/}).click();
  await page.waitForFunction(()=>typeof started3230!=='undefined'&&started3230&&capitals[0]>=0,{timeout:90000});
  const check=await page.evaluate(()=>{
   if(!window.HexategosMobilization03892)throw Error('Modular mobilization absent');
   paused3230=true;
   const L=loadLevel(MAX_GAME_LEVEL3233);let source=-1,target=-1;
   for(let i=0;i<L.n && source<0;i++){
    if(owner6[i]!==0)continue;
    for(let j=L.offsets[i];j<L.offsets[i+1];j++){
     const t=L.edgeNbr[j];if(t>=0&&L.land[t]>=0&&owner6[t]<0){source=i;target=t;break;}
    }
   }
   if(source<0)throw Error('No player border against neutrals');
   strength3212.value='50';troops3230[0]=400;
   const before=troops3230[0],front=createFrontFromSource3245(source,target);
   if(!front)throw Error('Real source-anchored front creation failed');
   const pending=front.mobilization03892;
   if(!pending||front.pool!==0)throw Error('Soldiers began fighting before assembly');
   const state=window.HexategosMilitaryManpower03874.status(0);
   if(Math.abs(state.moving-pending.troops)>1e-7)throw Error('Mobilizing soldiers absent from military summary');
   if(Math.abs(before-troops3230[0]-pending.troops)>1e-7)throw Error('Manpower accounting duplicated or lost');
   const preTime=campaignSeconds3230,readyAt=pending.readyAt;
   frontTick3230(front);
   if(front.pool!==0||front.ticks!==0)throw Error('Front attacked before ETA');
   // Test full local save/load with the actual stack of wrappers and sidecars.
   if(saveGame3212()===false)throw Error('Whole campaign save failed');
   const restored=loadGame3212();
   if(restored===false)throw Error('Whole campaign load failed');
   const loaded=activeFronts3230.find(f=>f.id===front.id);
   if(!loaded?.mobilization03892||loaded.pool!==0)throw Error('Local continuation lost staging');
   const file=buildPortableFile3275();
   if(!file.payload.main.activeFronts.some(x=>x.mobilization03892&&x.id===front.id))
     throw Error('Portable export lost staging');
   const current=loaded.mobilization03892.troops;
   campaignSeconds3230=readyAt-1;
   frontTick3230(loaded);
   if(loaded.pool!==0)throw Error('Early deployment during resumed game');
   campaignSeconds3230=readyAt;
   frontTick3230(loaded);
   if(loaded.mobilization03892||loaded.pool<=0)throw Error('Real game did not deploy on ETA');
   const deployed=loaded.pool;
   // Safe retreat: reserve increases only by survivors.
   const reserveBefore=troops3230[0];
   finishFront3230(loaded,'Prueba de retirada',1);
   if(troops3230[0]-reserveBefore!==Math.floor(deployed))
     throw Error('Retreat troop accounting invalid');
   if(activeFronts3230.some(f=>f.id===front.id))
     throw Error('Retired front remains active');
   return {version:window.HexategosMobilization03892.version,
     source,target,seconds:readyAt-preTime,staged:current,landed:deployed,
     importedSection:!!file.payload.main.activeFronts};
  });
  assert.equal(check.version,'0.38.92');
  assert.deepEqual(errors,[]);
  console.log('REAL BROWSER PASS',check);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
