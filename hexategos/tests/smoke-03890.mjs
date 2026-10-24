import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL('../js/'+name,import.meta.url),'utf8');
const audit=read('save-audit-03890.js');
const guard=read('local-load-guard-03857.js');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.ok(index.indexOf('local-load-guard-03857.js')<index.indexOf('save-audit-03890.js'));

const disk=new Map(),warnings=[],notices=[];
const localStorage={
  getItem:k=>disk.has(k)?disk.get(k):null,
  setItem:(k,v)=>disk.set(k,String(v)),
  removeItem:k=>disk.delete(k)
};
const window={
  HexategosSaveStorage03827:{
    get:k=>disk.has(k)?JSON.parse(disk.get(k)):null,
    status:()=>null
  },
  HexategosDialogs03851:{notice:message=>{notices.push(message);return Promise.resolve()}}
};
let migrationConfirmations=0,loadCalls=0,applyCalls=0;
window.confirm=()=>{migrationConfirmations++;return true};
const payload={
  main:{owner:[0,1],roads:[[0,1]],cities:[0]},
  naval:{groups:[]},
  tradeLogistics0370:{routes:[]},
  production0388:{sites:[]},
  worldLayers03828:{modules:{}},
  statecraft0380:{cities:[]},
  nationAI0360:{mindset:[]},
  diplomacy:{},
  regionalNames0389:{nations:[]},
  militaryManpower03874:{queues:[]},
  borderRoad0376:{links:[]},
  infrastructureDecay0373:{},
  tradeGeopolitics0377:{},
  diplomacyStability03816:{peaceUntil:[]}
};
const program=new Function('window','localStorage','document','console','toast',
  'notifyLoad','notifyApply','initialPayload',
  `const SAVE_KEY3230='main-save';
    let campaignSeconds3230=100,started3230=true;
    let saveGame3212=()=>true;
    let loadGame3212=()=>{notifyLoad();return true};
    let resetGame3230=()=>true;
    let buildPortableFile3275=()=>({payload:structuredClone(initialPayload)});
    let applyPortableFile3275=()=>{notifyApply();return true};
    let fnv1a3273=s=>s.length;
  `+guard+'\n'+audit+
  '\nreturn {save:saveGame3212,load:loadGame3212,build:buildPortableFile3275,apply:applyPortableFile3275,api:window.HexategosSaveAudit03890,keys:window.HexategosSaveAudit03890.moduleKeys};');
const game=program(window,localStorage,{getElementById:()=>null},{warn:()=>{},error:()=>{},info:()=>{}},message=>warnings.push(message),
  ()=>loadCalls++,()=>applyCalls++,payload);
const samples={
  'hexategos.production.0388':{sites:[]},
  'hexategos-trade-logistics-0370':{routes:[]},
  'hexategos.world-layers.03828':{modules:{}},
  'hexategos-statecraft-0380':{cities:[]},
  'hexategos-nation-ai-0360':{mindset:[]},
  'hexategos-military-manpower-03874':{queues:[]},
  'hexategos.regionalNames.0389':{nations:[]},
  'hexategos-border-road-0376':{links:[]},
  'hexategos-infrastructure-decay-0373':{},
  'hexategos-trade-geopolitics-0377':{},
  'hexategos.diplomacy-stability.03816':{peaceUntil:[]}
};
function setup(modules=game.keys){
  disk.clear();
  disk.set('main-save',JSON.stringify({...payload.main,campaignSeconds:100}));
  for(const key of modules)disk.set(key,JSON.stringify(samples[key]));
}
assert.equal(game.keys.length,11);
setup();
assert.equal(game.api.inspectLocal(true).ok,true);
assert.notEqual(game.save(),false);
assert.ok(game.api.inspectLocal(true).manifestValid);
assert.equal(game.load(),true);
assert.equal(loadCalls,1);
assert.equal(migrationConfirmations,0,'current complete save needs no legacy prompt');

setup(game.keys.slice(0,3));
assert.equal(game.api.inspectLocal(true).ok,false);
assert.equal(game.load(),false,'a partial modular save must never be migrated automatically');
assert.equal(loadCalls,1,'unsafe partial save must not be applied');
assert.equal(migrationConfirmations,0,'partial save must not offer destructive legacy migration');

setup([]);
assert.equal(game.load(),true,'genuinely premodular main saves may be explicitly migrated');
assert.equal(loadCalls,2);
assert.equal(migrationConfirmations,1,'legacy migration always needs consent');

setup();
assert.notEqual(game.save(),false);
disk.delete('hexategos.production.0388');
assert.equal(game.load(),false,'a missing module with modern manifest must block continue');
assert.equal(loadCalls,2);
assert.equal(migrationConfirmations,1);

setup();
disk.set('hexategos.production.0388','not-json');
assert.equal(game.load(),false,'malformed modular save must block continue');

setup([]);
disk.set('main-save',JSON.stringify({owner:'broken',campaignSeconds:100}));
assert.equal(game.load(),false,'malformed main save is never legacy');

assert.equal(game.api.inspectPortable({payload:{}}).ok,false,'a portable copy always requires main');
assert.equal(game.apply({payload:{}}),false,'reject incomplete portable before altering current game');
assert.equal(applyCalls,0);
assert.equal(game.api.inspectPortable({payload},true).ok,true);
assert.equal(game.api.inspectPortable({payload:{main:payload.main}},false).ok,true,
  'valid older portable with main and missing newer layers remains loadable');
assert.equal(game.api.inspectPortable({payload:{...payload,production0388:{sites:'bad'}}}).ok,false);
const exported=game.build();
assert.equal(exported.checksum,JSON.stringify(exported.payload).length);
assert.equal(game.api.status().lastExport.sections,Object.keys(payload).length);
assert.ok(notices.length>=2,'dangerous local saves show a recovery notice');
console.log('HEXATEGOS 0.38.90: local manifest, complete/partial/legacy saves, corrupt modules, portable compatibility and integrity PASS');
