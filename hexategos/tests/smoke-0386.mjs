import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const statecraft=read('js/statecraft-0380.js');
const messages=read('js/ui-stable-step8-033.js');
const systems=read('js/systems-hub-03851.js');
const trade=read('js/trade-logistics-0370.js');
const css=read('css/systems-hub-03851.css');
const index=read('index.html');
const about=read('js/about-0351.js');

for(const script of [statecraft,messages,systems,trade]){
  assert.doesNotThrow(()=>new Function(script),'script syntax');
}
assert.ok(index.includes('v0.38.6</title>'));
assert.ok(index.includes('data-tab="government"'));
assert.ok(index.includes('id="systemsQuiet0386"'));
assert.ok(index.includes('js/ui-stable-step8-033.js?v=0386'));
assert.ok(index.includes('js/statecraft-0380.js?v=0386'));
assert.ok(index.includes('js/systems-hub-03851.js?v=0386'));
assert.ok(about.includes("version:'0.38.6'"));
assert.ok(css.includes('.sysGovPolicies0386'));
assert.ok(systems.includes("data-hub-action="+'"'+'embassy-toggle"'),
  'existing embassy button preserved');
assert.ok(systems.includes("data-hub-action="+'"'+'sea-list"'),
  'existing trade routes preserved');
assert.ok(systems.includes("function governmentCard0386"));
assert.ok(systems.includes("government_city_0386"),'context action missing');
assert.ok(!systems.includes('setInterval('));
assert.ok(statecraft.includes('governmentCities:(f=0,max=65)=>'));
assert.ok(statecraft.includes('governmentAction:(cell,type,f=0)=>'));
assert.ok(statecraft.includes('version:3,'),'portable city-state schema must preserve governance');
assert.ok(trade.includes('governmentDemandMultiplier?.(n.cell,i,n.f)'),
  'ration must change physical stock consumption');

const p=statecraft.indexOf('  const GOV_POLICY0386=');
const start=statecraft.indexOf('  function governanceActive0386(');
const end=statecraft.indexOf('  function triggerUnrest(',start);
assert.ok(p>=0&&start>p&&end>start);
const defs=statecraft.slice(p,statecraft.indexOf('  const pairKey=',p));
const methods=statecraft.slice(start,end);
let campaign=110,gold=350,saved=0;
const cityState=new Map([
 [1,{cell:1,origin:0,owner:0,stability:42,nationalism:18,scarcity:100,lastSupply:38}],
 [2,{cell:2,origin:3,owner:0,stability:32,nationalism:84,scarcity:90,lastSupply:42}],
 [3,{cell:3,origin:3,owner:1,stability:31,nationalism:73,scarcity:70,lastSupply:38}]
]);
const territory=new Int16Array([0,0,0,1]);
const economy=[0,0,0,0];
const troops=new Int16Array([75,65,30,40]);
const w={
  cities3212:new Set([1,2,3]),
  owner6:new Int16Array([ -1,0,0,1 ]),
  botGold3230:new Float64Array([0,350,180,160]),
  troops3230:troops,
  FACTIONS3230:[{role:'balanced'},{role:'balanced'},{role:'aggressive'},{role:'balanced'}],
  cityState,
  campaignSeconds3230:campaign,
  gold3212:gold,
  now:()=>campaign,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  ensureCityState:cell=>cityState.get(cell),
  save0380:()=>saved++,
  notify:()=>{},
  placeDisplayName3271:cell=>'Ciudad '+cell,
  governmentAIOrders0386:0
};
const govRun=new Function('env',`
  let {cities3212,owner6,botGold3230,troops3230,FACTIONS3230,cityState,
     campaignSeconds3230,gold3212,now,clamp,ensureCityState,save0380,notify,
     placeDisplayName3271,governmentAIOrders0386}=env;
  ${defs}
  ${methods}
  return {
    policy:GOV_POLICY0386,apply:applyGovernment0386,info:governanceCity0386,
    multiplier:governmentDemandMultiplier0386,maintain:governanceMaintain0386,
    ai:governanceAI0386,gold:()=>gold3212,aiBudget:()=>governmentAIOrders0386
  };
`);
const g=govRun(w);
assert.equal(Object.keys(g.policy).length,6);
assert.equal(g.apply(1,'aid',0,false),true,'aid should apply');
assert.equal(g.gold(),350-g.policy.aid.cost,'aid must deduct exactly stated gold');
assert.equal(cityState.get(1).scarcity,45,'aid reduces existing scarcity');
assert.equal(g.apply(1,'aid',0,false),false,'aid may not be spammed');
assert.equal(g.apply(1,'autonomy',0,false),false,'no autonomy on own-origin city');
assert.equal(g.multiplier(1,0,0),1,'non-rationed city must not save food');

campaign=125;
assert.equal(g.apply(2,'autonomy',0,false),true,'autonomy works on occupied city');
assert.ok(cityState.get(2).nationalism<84,'autonomy must reduce nationalism');
campaign=145;
assert.equal(g.apply(2,'ration',0,false),true);
assert.equal(g.multiplier(2,0,0),.75,'food demand actually drops by 25 percent');
assert.equal(g.multiplier(2,3,0),.90,'goods demand drops by 10 percent');
assert.equal(g.multiplier(2,1,0),1,'other resources not touched');

campaign=270;
assert.equal(g.apply(1,'garrison',0,false),true);
assert.equal(troops[0],67,'garrison must commit troops');
campaign=430;
g.maintain(cityState.get(1));
assert.equal(troops[0],74,'survivors returned after garrison');
assert.equal(cityState.get(1).gov.stationed,0,'no double returns');
g.maintain(cityState.get(1));assert.equal(troops[0],74);

const serial=JSON.parse(JSON.stringify([...cityState]));
assert.ok(serial[0][1].gov.orders.aid>0,'government orders survive JSON saves');

const targets=[];
const eventStack={children:[],setAttribute(){},querySelectorAll(){return []},
  appendChild(x){this.children.push(x)}};
const fakeDocument={
  getElementById:id=>id==='eventStackStable8'?eventStack:null,
  querySelector:()=>null,
  createElement:()=>({setAttribute(){},classList:{add(){}},querySelector:()=>null}),
  body:{appendChild(){}}
};
const ctx={
  document:fakeDocument,window:{},console:{warn(error){throw error}},
  localStorage:{getItem:()=>null,setItem(){}},
  toast:()=>{},
  Date,Map,Set,Math,
  renderSystems3220:()=>{},openSystems3220:()=>{},
  setTimeout:()=>0,clearTimeout:()=>{},
  requestAnimationFrame:fn=>fn()
};
vm.runInNewContext(messages,ctx,{timeout:3000});
const msgApi=ctx.window.HexategosMessagesStable8;
assert.equal(msgApi.quiet(),true,'notifications must be quiet by default');
msgApi.show('Escasez en Ciudad 1','government','government');
msgApi.show('Escasez en Ciudad 1','government','government');
assert.equal(msgApi.notices.length,1,'repeated alerts must be deduplicated');
assert.equal(eventStack.children.length,0,'no floating popup in quiet mode');
msgApi.markAll('government');
assert.equal(msgApi.notices[0].read,true,'alerts can be read without popups');

console.log('HEXATEGOS 0.38.6 Government + quiet alerts smoke: OK');
