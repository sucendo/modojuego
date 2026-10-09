import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('js/economic-balance-03838.js');
const trade=read('js/trade-logistics-0370.js');
const industry=read('js/production-0388.js');
const strategy=read('js/resource-strategy-0383.js');
const html=read('index.html');
for(const code of [src,trade,industry,strategy])
  assert.doesNotThrow(()=>new Function(code),'new and existing module syntax');
assert.doesNotMatch(src,/setInterval\s*\(|MutationObserver\s*\(|Math\.random\s*\(/);
assert.ok(html.indexOf('economic-balance-03838.js')>html.indexOf('production-0388.js'),
 'economy should read the existing industrial production API');
assert.match(trade,/HexategosEconomicBalance03838\?\.update\?\.\(/,
 'single trade tick integrates national balance');
assert.match(trade,/HexategosEconomicBalance03838\?\.routeFactor\?\.\(r\)/,
 'trade routes only earn direct revenue on physical shipment');
assert.match(strategy,/HexategosEconomicBalance03838\?\.opportunity\?\.\(f,partner\)/,
 'AI uses real exportable production');
assert.match(industry,/materialBalance:materialBalance03838/,
 'industrial inventory derives exclusively from existing installations');
const resources=new Map([
  [0,{stock:{iron:2,steel:1,fuel:1},demand:{iron:.6,fuel:.4},sites:4}],
  [1,{stock:{iron:90,steel:22,coal:50},demand:{iron:.05},sites:6}]
]);
const win={HexategosProduction0388:{materialBalance:()=>resources},
 HexategosStatecraft0380:{resourceTradeAllowed:()=>true}};
new Function('window',src)(win);
const api=win.HexategosEconomicBalance03838;
assert.ok(api);
const summaries=[
  {stock:[9,12,8,10,3],cap:[100,100,100,100,100],prod:[.01,.05,.05,.1,0],
   demand:[.5,.5,.5,.2,.08],nodes:10},
  {stock:[90,85,88,75,62],cap:[100,100,100,100,100],prod:[.8,.9,.8,.8,.4],
   demand:[.12,.1,.1,.2,.1],nodes:15}
];
const old=structuredClone(summaries);
const emptyRoute={a:0,b:1,type:'sea',status:'active',cargo03720:[0,0,0,0,0],
 cargoDirection03720:[0,0,0,0,0],productionCargo0388:{}};
let details=api.update({summaries,routes:[emptyRoute],campaignSeconds:8});
assert.equal(details.nations,2);
assert.equal(details.industrialSites,10);
assert.equal(api.routeFactor(emptyRoute),0,
 'a configured route without shipped goods cannot mint trade income');
assert.equal(api.nation(0).pressure[0]>api.nation(1).pressure[0],true);
assert.ok(api.nation(1).surplus[0]>0,'only real exportable stock is a surplus');
assert.equal(api.nation(0).surplus[0],0);
assert.ok(api.nation(0).materialNeeds.find(x=>x.key==='iron')?.shortage>0);
assert.ok(api.opportunity(0,1)>0,'trade partner with surplus benefits importer');
assert.equal(api.opportunity(1,0),0,'importing from scarce nation has no value');
assert.deepEqual(summaries,old,'balance cannot mutate source stocks or demand');
let untouched=api.nation(0);
untouched.stock.fill(8000);untouched.materialNeeds[0].stock=999;
assert.equal(api.nation(0).stock[0],9,'public snapshots are defensive copies');
assert.notEqual(api.nation(0).materialNeeds[0].stock,999);
const route={a:0,b:1,type:'sea',status:'active',
 cargo03720:[.4,.22,0,0,0],cargoDirection03720:[-1,-1,0,0,0],
 cargoTotal03720:.62,productionCargo0388:{steel:.25}};
const financial=api.routeFactor(route);
assert.ok(financial>.5&&financial<=1.15);
api.update({summaries,routes:[route],campaignSeconds:16});
assert.equal(api.nation(0).imports[0],.4,'importer receives transferred food');
assert.equal(api.nation(1).exports[1],.22,'exporter ships raw materials');
assert.ok(api.stats().cargo>=.87,'specialized goods contribute to physical commerce');
assert.equal(api.routeFactor({...route,status:'closed'}),0);
const alternative={...route,cargoTotal03720:0,
 cargo03720:[0,0,0,0,0],productionCargo0388:{steel:.12}};
assert.ok(api.routeFactor(alternative)>0,'real steel shipments can create commercial value');

// Rebuild is deterministic and does not create persistent second inventories.
// 500 country summaries are budgeted by country/node count, never by map cells.
const many=Array.from({length:500},(_,i)=>({
 stock:[100+i%12,40,25,20,10],cap:[150,80,70,70,25],
 prod:[.4,.2,.1,.1,0],demand:[.2,.3,.2,.1,.1],nodes:3
}));
const t0=performance.now();
const snapshot=api.update({summaries:many,routes:[route],campaignSeconds:32});
const elapsed=performance.now()-t0;
assert.equal(snapshot.nations,500);
assert.ok(elapsed<2000,'500-nation balance must stay lightweight on CI');
assert.equal(api.nation(499).nodes,3);
assert.equal(api.nation(500),null);
assert.equal(api.stats().revision,4);
console.log('HEXATEGOS 0.38.38: physical cargo valuation, scarce nations, exports, AI, defensive snapshots and 500 nations PASS ('+elapsed.toFixed(2)+'ms)');
