import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('js/military-manpower-03874.js');
const trade=read('js/trade-logistics-0370.js');
const statecraft=read('js/statecraft-0380.js');
const html=read('index.html');
assert.doesNotThrow(()=>new Function(source));
assert.match(html,/js\/military-manpower-03874\.js\?v=03874/);
assert.match(trade,/consumeRecruitEquipment03874:/,'military materiel must be drawn from real stock');
assert.match(trade,/n\.stock\[4\]=Math\.max\(0,n\.stock\[4\]-used\)/);
assert.match(statecraft,/garrisonCommitted03874/);
assert.doesNotMatch(source,/setInterval\(|setTimeout\(/,'must reuse existing economy scheduler');

const storage=new Map();
const equipment=new Float64Array([7,7]);
const logs=[];
const w={HexategosTradeLogistics0370:{
  resourceSummaryCached:f=>({stock:[0,0,0,0,equipment[f]]}),
  consumeRecruitEquipment03874:(f,n,per)=>{
    const actual=Math.min(n,equipment[f]/per);
    equipment[f]-=actual*per;
    return actual;
  }
},HexategosStatecraft0380:{garrisonCommitted03874:()=>7}};
const run=new Function('window','storage','logs',`
const document={getElementById:()=>null},performance={now:()=>30000};
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
const FACTIONS3230=[{role:'balanced'},{role:'balanced'}],activeFactionCount3230=2;
const troops3230=new Float64Array([30,75]),botGold3230=new Float64Array([0,150]);
const capitals=[2,3],activeFronts3230=[{pool:20}],fleets3212=[];
const aiSnapshot3260={capThreat:[99,99]};
let started3230=true,paused3230=false,gameSpeed3212=1,gold3212=150,campaignSeconds3230=0,needsRender=false;
let saved=0,drawn=0;
const updateUI3230=()=>drawn++;
const warCount3261=()=>0;
const aiTotalMilitary3280=f=>troops3230[f]+15;
const aiFrontsForNation3280=()=>[];
function economyRate3230(f){return {max:110,troop:2,net:1,gold:1,maintenance:2};}
function economyTick3212(){
  campaignSeconds3230+=1;
  for(let f=0;f<2;f++){
    const r=economyRate3230(f);
    troops3230[f]+=r.troop;
    if(f===0)gold3212+=r.net;
    else botGold3230[f]+=r.net;
  }
}
function saveGame3212(){saved++;return true;}
function loadGame3212(){started3230=true;return true;}
function resetGame3230(){started3230=false;return true;}
function buildPortableFile3275(){return {payload:{main:{}},checksum:0};}
function applyPortableFile3275(file){return file?.payload!==null}
function fnv1a3273(s){return s.length;}
`+source+`
return {
 api:window.HexategosMilitaryManpower03874,
 step:()=>economyTick3212(),
 sourceRate:()=>economyRate3230(0),
 present:()=>({troops:[...troops3230],gold:gold3212,aiGold:botGold3230[1],tick:campaignSeconds3230,saved,drawn}),
 save:()=>saveGame3212(),load:()=>loadGame3212(),reset:()=>resetGame3230(),
 export:()=>buildPortableFile3275(),import:p=>applyPortableFile3275(p),
 switchWar:()=>{aiSnapshot3260.capThreat[1]=3},
 setCash:x=>{gold3212=x},
 advance:t=>{campaignSeconds3230=t}
};`)(w,storage,logs);
const api=run.api;
assert.equal(api.version,'0.38.74');
assert.equal(run.sourceRate().troop,0,'legacy free recruitment must be suppressed');
assert.ok(run.sourceRate().net<1,'deployed player troops have a real maintenance cost');
assert.equal(run.present().troops[0],30);
assert.ok(api.request(0,25));
assert.equal(api.status(0).queue,25);
const beforeEquipment=equipment[0],beforeGold=run.present().gold;
run.step();
assert.equal(run.present().troops[0],32,'two soldiers trained within original troop capacity');
assert.ok(run.present().gold<beforeGold+1,'training costs charged to actual treasury');
assert.equal(Number((beforeEquipment-equipment[0]).toFixed(4)),.024,
  'training consumed exact military material rather than inventing it');
assert.equal(api.status(0).deployed,27,'player combat front and city garrison remain committed');
assert.equal(api.status(0).queue,23,'remaining training order persists');
assert.ok(storage.has('hexategos-military-manpower-03874'));
assert.equal(run.export().payload.militaryManpower03874.queues[0],23,
 'portable save must carry remaining recruitment orders');
assert.ok(run.save());
equipment[0]=0;
run.step();
assert.equal(run.present().troops[0],32,'no soldier without military materiel');
const initialAI=run.present().troops[1];
run.step();
assert.ok(run.present().troops[1]<=initialAI,'peace AI should demobilise excessive idle reserves');
const beforeDeployed=api.status(0).deployed;
assert.equal(api.demobilize(0,20),20,'desmobilise reserve only');
assert.equal(api.status(0).deployed,beforeDeployed,'committed soldiers cannot be demobilised');
assert.equal(api.status(0).queue,0,'demobilising must cancel pending recruitment');
assert.ok(api.request(0,12),'player can launch another recruitment order after demobilising');
const saved=run.export();
api.cancel(0);
assert.equal(api.status(0).queue,0);
assert.ok(run.import(saved));
assert.equal(api.status(0).queue,saved.payload.militaryManpower03874.queues[0],
 'portable import must restore ongoing training');
assert.equal(saved.checksum,JSON.stringify(saved.payload).length,
 'checksum recomputed after adding military state');
run.reset();
assert.equal(api.status(0).queue,0,'new game resets old military orders');
assert.ok(!storage.has('hexategos-military-manpower-03874'),'reset clears local orders');
run.load();
assert.equal(api.status(0).queue,0,'legacy games load without a military snapshot');
console.log('HEXATEGOS 0.38.74: no free recruits; paid gradual mobilisation, physical equipment, commitment, demobilisation, AI peace policy, browser and HXZ2 persistence PASS');
