/* HEXATEGOS 0.38.93 · Browser regression: Systems must preserve live DOM. */
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
  const result=await page.evaluate(()=>{
   const api=window.HexategosSystemsLive03893;
   if(!api)throw Error('Systems reconciliation module missing');
   paused3230=true;
   const host=document.getElementById('sysContent3213');
   const panel=document.getElementById('systemsPanel3213');
   const s=document.getElementById('hubNationName0389');
   const check=(yes,why)=>{if(!yes)throw Error(why);};
   openSystems3220('government');
   check(panel.classList.contains('open'),'Government must open');
   const input=host.querySelector('[data-hub-nation-name0389]');
   check(input,'Nation name input missing');
   host.scrollTop=220;
   input.focus({preventScroll:true});
   input.value='Imperio Histórico de Prueba';
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.setSelectionRange(8,14);
   const initial=host.scrollTop;
   for(let i=0;i<7;i++){
     gold3212+=1;
     renderSystems3220();
     check(host.querySelector('[data-hub-nation-name0389]')===input,
       'Government replaced active national name input');
     check(document.activeElement===input,'Government input lost focus');
     check(input.value==='Imperio Histórico de Prueba','Nation name draft overwritten');
     check(input.selectionStart===8&&input.selectionEnd===14,
       'Nation name caret/selection changed');
     check(host.scrollTop===initial,'Government scroll moved on rerender');
   }
   const treasury=host.querySelector('.sysGovSummary0386')?.textContent||'';
   check(treasury.includes('Tesoro nacional'),'Government summary disappeared');
   check(api.diagnostics().liveRenders>=7,'Differential refresh was not used');
   // Explicit user action must still be fully functional.
   host.querySelector('[data-hub-rename-nation0389]').click();
   check(window.HexategosRegionalNames0389.identity(0)?.name==='Imperio Histórico de Prueba',
     'Renaming action did not change the nation');
   const renamed=host.querySelector('[data-hub-nation-name0389]');
   check(renamed&&renamed.value==='Imperio Histórico de Prueba','Saved nation not reflected in input');
   const scrollAfter=host.scrollTop;
   renderSystems3220();
   check(host.scrollTop===scrollAfter,'Government scroll moved after renaming');
   // Other tabs are updated through the same reconciler, preserving nodes.
   const tabs=['military','research','eco','intel','naval','dip','commerce','government'];
   const stable={};
   for(const tab of tabs){
     openSystems3220(tab);
     renderSystems3220();
     const before=host.firstElementChild;
     const top=Math.min(120,Math.max(0,host.scrollHeight-host.clientHeight));
     host.scrollTop=top;
     const knownScroll=host.scrollTop;
     for(let j=0;j<4;j++)renderSystems3220();
     check(host.scrollTop===knownScroll,tab+' lost scroll while updating');
     const keepControl=tab==='eco'?host.querySelector('[data-industry-sector0388]'):
       tab==='naval'?host.querySelector('[data-hub-sea-port]'):
       tab==='military'?host.querySelector('[data-mil-slider03875]'):null;
     const rootControl=keepControl;
     if(rootControl){
       rootControl.focus({preventScroll:true});
       const oldValue=rootControl.value;
       for(let k=0;k<3;k++){
         renderSystems3220();
         check(rootControl.isConnected&&host.contains(rootControl),
           tab+' replaced its input/select during refresh');
         check(document.activeElement===rootControl,
           tab+' lost focus during refresh');
         check(rootControl.value===oldValue,tab+' unexpectedly reset a control');
       }
     }
     stable[tab]=host.childElementCount;
   }
   // Embassy search must retain active node and cursor on periodic updates.
   openSystems3220('dip');
   const openBtn=host.querySelector('[data-hub-action="embassy-toggle"]');
   if(openBtn){
     openBtn.click();
     const search=host.querySelector('[data-embassy-search]');
     if(search){
       search.focus({preventScroll:true});
       search.value='Castilla';
       search.dispatchEvent(new Event('input',{bubbles:true}));
       search.setSelectionRange?.(3,6);
       for(let i=0;i<5;i++){
         renderSystems3220();
         check(search.isConnected&&document.activeElement===search,
           'Embassy search lost focus during refresh');
         check(search.value==='Castilla','Embassy search draft was discarded');
       }
     }
   }
   // Same input in the field must survive real economy ticks (periodic data updates).
   openSystems3220('government');
   const last=host.querySelector('[data-hub-nation-name0389]');
   last.focus({preventScroll:true});
   last.value='Texto temporal sin guardar';
   last.dispatchEvent(new Event('input',{bubbles:true}));
   paused3230=false;
   economyTick3212();
   paused3230=true;
   renderSystems3220();
   check(last.isConnected&&document.activeElement===last,'Economy tick destroyed edited nation input');
   check(last.value==='Texto temporal sin guardar','Economy tick erased the unsaved draft');
   return {version:api.version,live:api.diagnostics(),tabs:stable,scroll:initial};
  });
  assert.equal(result.version,'0.38.93');
  assert.deepEqual(errors,[],'Browser must not throw after repeated Systems updates');
  console.log('SYSTEMS LIVE BROWSER PASS',JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
