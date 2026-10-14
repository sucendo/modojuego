'use strict';
/* Import-wrapper regression; never commit a user's private .hexategos file. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/import-scheduler-03895.js'),'utf8');
const sandbox={
 window:{},sessionStorage:{map:new Map(),setItem(k,v){this.map.set(k,v)},getItem(k){return this.map.get(k)}},
 localStorage:{map:new Map(),setItem(k,v){this.map.set(k,v)},getItem(k){return this.map.get(k)},removeItem(k){this.map.delete(k)}},
 resetGame3230(){},
 Date,JSON,console,performance:{now:()=>++sandbox.now,memory:{usedJSHeapSize:12345}},
 now:0,paused3230:false,started3230:true,activeFactionCount3230:150,
 strategyCount:0,evaluated:[],
 strategicThink3260(){sandbox.strategyCount++},
 aiNationalCampaignEval3280(f){sandbox.evaluated.push(f)},
 rebuildSupply3253(){},rebuildEncirclements3254(){},rebuildFrontSectors3255(){},rebuildNavalBlockades3270(){},ensureEconomySnapshot3261(){},
 applyPortableFile3275(){sandbox.strategicThink3260(true);
   for(let f=1;f<150;f++)sandbox.aiNationalCampaignEval3280(f,true);
   sandbox.rebuildSupply3253();sandbox.rebuildEncirclements3254();return true;}
};
vm.createContext(sandbox);
vm.runInContext(source,sandbox);
const status=()=>sandbox.window.HexategosImportScheduler03895.status();
assert.equal(sandbox.applyPortableFile3275({payload:{}}),true);
assert.equal(sandbox.strategyCount,0);
assert.equal(sandbox.evaluated.length,0);
assert.equal(sandbox.paused3230,true);
assert.equal(status().skippedNational,149);
assert.equal(status().pendingNation,1);
assert.equal(sandbox.localStorage.getItem('hexategos_pruebas_ai_pending_03895'),'1');
assert.equal(status().lastCheckpoint.label,'apply:done');
sandbox.paused3230=false;
for(let cycle=0;cycle<150&&status().pendingNation>0;cycle++)
 for(let f=1;f<150;f++)sandbox.aiNationalCampaignEval3280(f,false);
assert.equal(status().pendingNation,0,'All 149 factions eventually resume');
assert.equal(sandbox.localStorage.getItem('hexategos_pruebas_ai_pending_03895'),'0');
assert.deepEqual(sandbox.evaluated.slice(0,149),Array.from({length:149},(_,i)=>i+1));
assert.equal(sandbox.applyPortableFile3275({payload:{aiCampaigns:{fronts:[]}}}),true);
assert.equal(status().pendingNation,0,'Current saves respect existing campaign timers');
assert.equal(status().lastError,null);
sandbox.resetGame3230(true);
assert.equal(sandbox.localStorage.getItem('hexategos_pruebas_ai_pending_03895'),undefined);
console.log('0.38.95 import scheduler PASS: paused import, deferred nations, current save');