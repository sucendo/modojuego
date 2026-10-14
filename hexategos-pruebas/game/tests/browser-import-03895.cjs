'use strict';
/* Browser regression for the published same-origin iframe. Synthetic legacy
 * save deliberately lacks aiCampaigns; no user save is ever uploaded to CI. */
const assert=require('node:assert/strict');
const { chromium }=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1366,height:800}});
 let crashed=false;const errors=[];
 page.on('crash',()=>{crashed=true});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.HEX_TEST_URL||'http://127.0.0.1:8765/hexategos-pruebas/',{waitUntil:'load',timeout:120000});
  const view=page.frameLocator('iframe[title="Hexategos pruebas"]');
  await view.getByRole('button',{name:'NUEVA PARTIDA',exact:true}).click();
  await view.getByRole('button',{name:/UBICACIÓN ALEATORIA/}).click();
  await view.getByRole('button',{name:/COMENZAR AQUÍ/}).click();
  const game=page.frames().find(f=>f.url().includes('/hexategos-pruebas/game/'));
  assert(game,'Game iframe not found');
  await game.waitForFunction(()=>started3230&&owner6.length===510762,null,{timeout:90000});
  const encoded=await game.evaluate(async()=>{
    paused3230=true;
    gold3212=8064;
    const save=buildPortableFile3275();
    delete save.payload.aiCampaigns;
    delete save.payload.regionalAI;
    // Populate the portable payload (not the live game) with realistic load
    // counts; all geometry and entities here are synthetic, never user data.
    const p=save.payload,m=p.main,L=loadLevel(MAX_GAME_LEVEL3233);
    const owned=[];
    for(let c=0;c<m.owner.length;c++)if(m.owner[c]>=0&&L.land[c]>=0)owned.push(c);
    const queue=owned.slice();
    for(let h=0;h<queue.length&&queue.length<6500;h++){
      const c=queue[h],f=m.owner[c];
      for(let k=L.offsets[c];k<L.offsets[c+1]&&queue.length<6500;k++){
        const n=L.edgeNbr[k];
        if(n<0||L.land[n]<0||m.owner[n]>=0)continue;
        m.owner[n]=f;owned.push(n);queue.push(n);
      }
    }
    const coast=[];
    for(let c=0;c<L.n&&coast.length<350;c++){
      if(L.land[c]<0)continue;
      let sea=-1;
      for(let k=L.offsets[c];k<L.offsets[c+1];k++){
        const n=L.edgeNbr[k];if(n>=0&&L.land[n]<0){sea=n;break}
      }
      if(sea<0)continue;
      if(m.owner[c]<0)m.owner[c]=1+coast.length%149;
      coast.push({port:c,sea,f:m.owner[c]});
    }
    if(coast.length<350)throw Error('Not enough coastal test cells');
    m.ports=coast.map(x=>x.port);
    const cities=new Set(m.cities);
    for(const cell of owned){
      if(cities.size>=729)break;
      if(cities.has(cell))continue;
      cities.add(cell);m.cityLevels[cell]=1;
    }
    m.cities=[...cities];
    if(m.cities.length!==729)throw Error('Cannot build synthetic cities');
    m.industries=owned.slice(0,708);
    for(const cell of m.industries)m.industryLevels[cell]=1;
    m.roads=[];
    for(const a of owned){
      for(let k=L.offsets[a];k<L.offsets[a+1]&&m.roads.length<3973;k++){
        const b=L.edgeNbr[k];
        if(b>=0&&m.owner[b]===m.owner[a]&&a<b)m.roads.push([a,b]);
      }
      if(m.roads.length>=3973)break;
    }
    if(m.roads.length!==3973)throw Error('Cannot build synthetic roads');
    const kinds=['civilian','thermal','livestock','foodplant','crops','tannery','fiberworks','textile','timber','sawmill','coal','quarry','cement','iron','steel','oil','gas','chemical','copper','refinery','gasplant','smelter','machinery','arms','electronics'];
    if(!p.production0388)p.production0388={v:3};
    p.production0388.sites=owned.slice(0,2358).map((cell,i)=>({
      cell,f:m.owner[cell],kind:kinds[i%kinds.length],level:1+i%4,pct:100,stock:3,output:0,legacyQuality:0,byproducts:{}
    }));
    p.naval.groups=Array.from({length:633},(_,i)=>{
      const v=coast[i%coast.length];
      return {id:i+1,f:v.f,home:v.port,cell:v.sea,strength:16,maxStrength:16,order:'intercept',targetPort:-1,escortFleetId:-1};
    });
    p.naval.nextNavalGroupId3270=634;
    if(!p.tradeLogistics0370)p.tradeLogistics0370={};
    p.tradeLogistics0370.routes=Array.from({length:298},(_,i)=>{
      const a=coast[i%350],b=coast[(i+31)%350];
      return {id:i+1,type:'sea',a:a.f,b:b.f,from:a.port,to:b.port,path:[],via:[],distance:55,baseValue:0.4,navalRisk:0,mode:'legal',status:'active',created:0,lastIncident:0,nextIncident:100};
    });
    p.tradeLogistics0370.nextRouteId=299;
    save.gameVersion='0.37.9';
    save.checksum=fnv1a3273(JSON.stringify(save.payload));
    const bytes=new TextEncoder().encode(JSON.stringify(save));
    const compressed=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    const full=new Uint8Array(5+compressed.length);full.set([72,88,90,50,0]);full.set(compressed,5);
    let b64='';for(let i=0;i<full.length;i+=12000)
      b64+=String.fromCharCode(...full.subarray(i,i+12000));
    return {base64:btoa(b64),cities:m.cities.length,sites:p.production0388.sites.length,ports:m.ports.length,naval:p.naval.groups.length,roads:m.roads.length,routes:p.tradeLogistics0370.routes.length};
  });
  await view.locator('#gameLoadFile3306').setInputFiles({
    name:'HEXATEGOS_LEGACY_SYNTHETIC_510762.hexategos',
    mimeType:'application/octet-stream',buffer:Buffer.from(encoded.base64,'base64')
  });
  const confirm=view.locator('.hexUnifiedDialog03851');
  await confirm.waitFor({state:'visible',timeout:20000});
  await confirm.getByRole('button',{name:'Cargar partida'}).click();
  await game.waitForFunction(()=>window.HexategosImportScheduler03895?.status().stage==='apply:done',null,{timeout:120000});
  const restored=await game.evaluate(()=>({
    gold:gold3212,cells:owner6.length,cities:cities3212.size,
    sites:window.HexategosProduction0388?.snapshot?.().sites?.length||0,
    ports:ports3212.size,naval:navalGroups3270.length,roads:roads3212.length,
    routes:window.HexategosTradeLogistics0370?.routes?.().length||0,
    paused:paused3230,diag:window.HexategosImportScheduler03895?.status()
  }));
  assert.equal(restored.gold,8064);
  assert.equal(restored.cells,510762);
  assert.equal(restored.cities,encoded.cities);
  assert.equal(restored.sites,encoded.sites);
  assert.equal(restored.ports,encoded.ports);
  assert.equal(restored.naval,encoded.naval);
  assert.equal(restored.roads,encoded.roads);
  assert.equal(restored.routes,encoded.routes);
  assert.equal(restored.paused,true);
  assert.equal(restored.diag.skippedNational,149);
  assert.equal(restored.diag.pendingNation,1);
  assert.equal(crashed,false);
  assert.deepEqual(errors,[]);
  // Round-trip every persisted system, then continue from actual browser storage.
  const exportCheck=await game.evaluate(()=>{
    const file=buildPortableFile3276();
    return {valid:file.checksum===fnv1a3273(JSON.stringify(file.payload)),
      cities:file.payload.main.cities?.length,sites:file.payload.production0388?.sites?.length,
      naval:file.payload.naval?.groups?.length,roads:file.payload.main.roads?.length,
      routes:file.payload.tradeLogistics0370?.routes?.length};
  });
  assert.equal(exportCheck.valid,true);
  for(const key of ['cities','sites','naval','roads','routes'])
    assert.equal(exportCheck[key],encoded[key],'Portable re-export mismatch: '+key);
  await game.evaluate(()=>{paused3230=true;saveGame3212()});
  await page.reload({waitUntil:'load',timeout:120000});
  const continued=page.frames().find(f=>f.url().includes('/hexategos-pruebas/game/'));
  assert(continued,'Reloaded game iframe not found');
  await view.getByRole('button',{name:'CONTINUAR PARTIDA',exact:true}).click({timeout:120000});
  await continued.waitForFunction(()=>started3230&&owner6.length===510762,null,{timeout:120000});
  const continuedState=await continued.evaluate(()=>{
    paused3230=true;
    return {cities:cities3212.size,sites:window.HexategosProduction0388?.snapshot?.().sites?.length||0,
      naval:navalGroups3270.length,roads:roads3212.length,ports:ports3212.size,
      routes:window.HexategosTradeLogistics0370?.routes?.().length||0,
      pendingNation:window.HexategosImportScheduler03895?.status().pendingNation};
  });
  for(const key of ['cities','sites','naval','roads','ports','routes'])
    assert.equal(continuedState[key],encoded[key],'Browser continuation mismatch: '+key);
  assert(continuedState.pendingNation>0&&continuedState.pendingNation<=149,
    'Deferred AI should survive page reload');
  await continued.evaluate(()=>{paused3230=false});
  await continued.waitForFunction(()=>window.HexategosImportScheduler03895?.status().pendingNation!==1,null,{timeout:120000});
  await continued.evaluate(()=>{paused3230=true});
  assert.equal(crashed,false);
  console.log('CHROMIUM 0.38.95 PASS: synthetic old HXZ2, same-origin iframe, 510762 cells, deferred AI',restored);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});