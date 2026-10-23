/* 9B: persistencia y previsión determinista, sin escribir en guardados deportivos nativos. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../js/session-plans-9b.js'),'utf8');
const store=new Map([['apex26canvas-v2',JSON.stringify({schema:4,round:6,points:{PLAYER:72}})]]);
function boot(){
 const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
 const win={localStorage,ApexClimate9A:{forecast:(s,round)=>({preset:round===6?'RAIN':'PARTLY'})}};
 const context=vm.createContext({window:win,console,Math,JSON,Number,Object,String,Array});
 vm.runInContext(code,context,{filename:'session-plans-9b.js'});
 return win.ApexSessionPlans9B;
}
let a=boot();
const spec={dir:'madrid',name:'Madrid',r:7};
const event={mode:'season',spec,round:6};
assert.equal(a.sessions.length,5);
const forecasts=a.sessions.map(s=>a.forecast(event,s));
assert.equal(forecasts.length,5);
assert.ok(forecasts.every(f=>f.eventId==='season:6:madrid'&&f.source==='SIMULATED_ESTIMATE'));
assert.equal(a.getPlan(event,'fp1').program,'balanced');
a.savePlan(event,'fp1',{compound:'SOFT',program:'performance',targetLaps:7,weatherSelection:'STORM',results:{cheat:true}});
a.savePlan(event,'fp2',{compound:'HARD',program:'race-simulation',targetLaps:13});
a.savePlan(event,'qualifying',{compound:'SOFT',attempts:3,strategy:'aggressive'});
a.savePlan(event,'race',{compound:'MEDIUM',plannedStops:2,strategy:'conservative',stints:[
 {compound:'MEDIUM',targetLap:20},{compound:'HARD',targetLap:40},{compound:'SOFT',targetLap:null}]});
assert.equal(a.getPlan(event,'fp1').compound,'SOFT');
assert.equal(a.getPlan(event,'fp2').program,'race-simulation');
assert.equal(a.getPlan(event,'fp3').compound,'MEDIUM');
assert.equal(a.getPlan(event,'qualifying').attempts,3);
assert.equal(a.getPlan(event,'race').stints.length,3);
assert.equal(a.resolveForStart({...event,session:'fp1'}).weatherPreset,'STORM');
assert.equal(a.resolveForStart({...event,session:'race'}).nextCompound,'HARD');
const stored=JSON.parse(store.get(a.storageKey));
assert.equal(stored.events['season:6:madrid'].sessions.fp1.results,undefined);
assert.equal(store.get('apex26canvas-v2'),JSON.stringify({schema:4,round:6,points:{PLAYER:72}}));
a=boot();
assert.equal(a.getPlan(event,'fp1').targetLaps,7);
assert.equal(JSON.stringify(a.sessions.map(s=>a.forecast(event,s).preset)),JSON.stringify(forecasts.map(f=>f.preset)));
const second={...event,round:7};
assert.notEqual(a.forecast(second,'fp1').eventId,forecasts[0].eventId);
assert.equal(a.getPlan(second,'fp1').compound,'MEDIUM');
assert.equal(a.getPlan({mode:'grandprix',spec,round:0},'fp1').compound,'MEDIUM');
a.savePlan(event,'race',{plannedStops:100,compound:'RANDOM',stints:[{compound:'BAD',targetLap:5}]});
assert.equal(a.getPlan(event,'race').plannedStops,2);
assert.equal(a.getPlan(event,'race').stints.length,3);
console.log(JSON.stringify({test:'apex-session-plans-9b',forecastStable:true,nativeSaveUnchanged:true,ok:true}));
