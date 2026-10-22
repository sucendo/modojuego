/* APEX 9A · pruebas puras del estado de competición (Node.js) */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','js','competition-9a.js'),'utf8');
const store=new Map();
const context={
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
  dispatchEvent:()=>{}, CustomEvent:class CustomEvent{constructor(name,options){this.type=name;this.detail=options.detail;}}
};
context.window=context; vm.runInNewContext(source,context);
const api=context.ApexCompetition9A;
const plain=o=>JSON.parse(JSON.stringify(o));
assert.equal(api.get().distance,100);
assert.equal(api.select({mode:'quick',distance:25,tyre:'soft'}).distance,25);
assert.equal(api.get().tyre,'soft');
assert.equal(api.select({distance:999}).distance,100);
api.select({circuitId:'madrid',mode:'grand-prix'});
assert.equal(api.beginWeekend().stage,'fp1');
assert.throws(()=>api.completeSession('race',{verified:true,classification:[{driverId:'a',teamId:'x'}]}),/secuencia/);
for(const stage of ['fp1','fp2','fp3']){
  api.completeSession(stage,{verified:true,lapTimes:[]});
}
assert.throws(()=>api.completeSession('qualifying',{verified:true}),/parrilla/);
api.completeSession('qualifying',{verified:true,grid:['a','b']});
api.completeSession('race',{verified:true,classification:[{driverId:'a',teamId:'x'}]});
assert.equal(api.get().weekend.finished,true);
assert.throws(()=>api.completeSession('race',{verified:true,classification:[]}),/secuencia/);
api.beginSeason(['madrid','spa']);
const race=(circuitId,drivers)=>({verified:true,circuitId,classification:drivers.map(([driverId,teamId])=>({driverId,teamId}))});
assert.throws(()=>api.completeRound(race('spa',[['a','x']])),/ronda/);
assert.throws(()=>api.completeRound(race('madrid',[['a','x'],['a','x']])),/duplicados/);
api.completeRound(race('madrid',[['a','x'],['b','y'],['c','x']]));
let rank=plain(api.standings());
assert.equal(rank.drivers[0].points,25);
assert.equal(rank.constructors.find(x=>x.id==='x').points,40);
assert.equal(rank.rounds,1);
api.completeRound(race('spa',[['b','y'],['a','x'],['c','x']]));
rank=plain(api.standings());
assert.equal(rank.drivers.find(x=>x.id==='a').points,43);
assert.equal(rank.drivers.find(x=>x.id==='b').points,43);
assert.equal(rank.constructors.find(x=>x.id==='x').points,73);
assert.equal(api.get().season.finished,true);
assert.throws(()=>api.completeRound(race('spa',[['a','x']])),/pendiente/);
assert.ok(store.has('apex26.competition.v1'));
api.reset('all');
assert.equal(api.standings().rounds,0);
console.log('APEX 9A state/standings: PASS');
