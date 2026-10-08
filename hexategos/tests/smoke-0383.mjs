import { versionAtLeast } from './version-compat.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const strategy=read('js/resource-strategy-0383.js');
const trade=read('js/trade-logistics-0370.js');
const corridors=read('js/economic-corridors-0379.js');
const geopolitics=read('js/trade-geopolitics-0377.js');
const commerce=read('js/ai-commerce-0375.js');
const index=read('index.html');
const about=read('js/about-0351.js');
const css=read('css/statecraft-0380.css');

for(const code of [strategy,trade,corridors,geopolitics,commerce,about]){
  assert.doesNotThrow(()=>new Function(code),'JS must parse');
}
assert.ok(versionAtLeast(index,'0.38.3'),'game version must be at least 0.38.3');
assert.ok(index.includes('js/resource-strategy-0383.js'),'resource strategy not loaded');
assert.ok(index.indexOf('js/resource-strategy-0383.js')>index.indexOf('js/statecraft-0380.js'),'resource strategy must load after diplomacy');
assert.ok(!index.includes('css/trade-logistics-0370.css">\\n'),'literal newline in CSS assets');
assert.ok(!index.includes('js/economic-corridors-0379.js"></script>\\n'),'literal newline in scripts');
assert.ok(about.includes("version:'0.38.3'"),'About history missing');
assert.ok(css.includes('.resourcePotentialRow0383'),'territory resource dialog not styled');
assert.ok(strategy.includes('const MAX_GEO_CACHE=12000'),'bounded geographic cache missing');
assert.ok(strategy.includes('const MAX_NATIONAL_SAMPLES=48'),'national sampling limit missing');
assert.ok(!strategy.includes('setInterval('),'no new independent simulation timer allowed');
assert.ok(trade.includes('function refreshGeoProduction0383'),'conquered land must update material production');
assert.ok(trade.includes('GEO_PRODUCTION_BATCH0383=160'),'node reprofiling must be bounded');
assert.ok(trade.includes('geoNodeCounts0383[f]'),'production must divide correctly over national nodes');
assert.ok(geopolitics.includes('ResourceStrategy0383?.priority'),'neutral corridor expansion must favor rich cells');
assert.ok(geopolitics.includes('ResourceStrategy0383?.tradeOpportunity'),'trade corridors must evaluate import needs');
assert.ok(corridors.includes('ResourceStrategy0383?.priority'),'corridor consolidation must consider strategic resources');
assert.ok(commerce.includes('ResourceStrategy0383?.tradeOpportunity'),'AI commerce must rank real suppliers');

const ownership=new Int8Array(12).fill(-1);
ownership[3]=2;
const resources=[
  {coverage:[.7,.7,.7],prod:[1,1,1],demand:[1,1,1]},
  {coverage:[.19,.22,.16],prod:[.1,.1,.1],demand:[.8,.8,.8]},
  {coverage:[.85,.85,.86],prod:[.8,.8,.8],demand:[.2,.2,.2]}
];
let relation=0;
const sandbox={
  window:{HexategosTradeLogistics0370:{
    resourceSummary:f=>resources[f],
    geography:c=>({
      1:{type:'mountain',food:.45,raw:1.9,fuel:.55},
      2:{type:'plain',food:1.35,raw:.7,fuel:.58},
      3:{type:'desert',food:.34,raw:.85,fuel:1.85}
    }[c]||{type:'plain',food:1,raw:1,fuel:1})
  }},
  owner6:ownership, activeFactionCount3230:3,
  campaignSeconds3230:100,
  aiNationalSamples3275:[[0],[1,2],[3]],
  capitals:[0,1,3],
  aiStrategicValue3260:()=>10,
  aiPlanFaction3260:()=>({objective:1}),
  buildClassicActions3246:()=>[],
  classicAction3246:(id,label,icon,sub)=>({id,label,icon,sub}),
  handleContextAction3244:()=>{},
  resetGame3230:()=>{},
  loadGame3212:()=>{},
  diplomaticRelation3300:()=>relation,
  FACTIONS3230:[{},{},{}],
  uiInteractionState3244:{contextData:{kind:'cell',cell:1}},
  console:{info(){}},
  Set,Map,Uint8Array,Int8Array,Math,Number
};
vm.runInNewContext(strategy,sandbox,{timeout:5000});
const api=sandbox.window.HexategosResourceStrategy0383;
assert.ok(api,'public strategy API missing');
assert.ok(api.priority(1,1)>api.priority(1,2),'raw-material shortage must favor mountain over plain');
assert.ok(api.priority(1,3)>api.priority(1,2),'fuel shortage must favor energy-rich hex');
assert.ok(sandbox.aiStrategicValue3260(1,2,1)>10,'neutral resource target gets tactical bonus');
assert.equal(sandbox.aiStrategicValue3260(1,2,3),10,'peaceful neighbor must never get resource attack incentive');
relation=-1;
assert.ok(sandbox.aiStrategicValue3260(1,2,3)>10,'wartime targets may receive an economic bonus');
const options=sandbox.buildClassicActions3246({kind:'cell',cell:1});
assert.ok(options.some(o=>o.id==='economic_potential_0383'),'resource action must be present on a hex');

console.log('HEXATEGOS 0.38.3 strategic resources smoke: OK');
