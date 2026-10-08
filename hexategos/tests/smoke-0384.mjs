import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const strategy=read('js/resource-strategy-0383.js');
const statecraft=read('js/statecraft-0380.js');
const index=read('index.html');
const about=read('js/about-0351.js');

for(const [name,code] of [['trade',trade],['strategy',strategy],['statecraft',statecraft]]){
  assert.doesNotThrow(()=>new Function(code),name+' syntax must be valid');
}
assert.ok(index.includes('v0.38.4</title>'),'visible version incorrect');
assert.ok(about.includes("version:'0.38.4'"),'About not updated');
assert.ok(strategy.includes("const BUILD='0.38.4'"),'last-loaded script version incorrect');
assert.ok(trade.includes('const GEO_PRODUCTION_BATCH0383=48'),'geographic work not reduced');
assert.ok(trade.includes('GEO_REFRESH_BUDGET_MS0384=1.4'),'geographic time budget missing');
assert.ok(!trade.includes('const profile=resourceNodeProfile03720(n.cell,n.f,count,snap);'),'the expensive profile rebuild remains in geographic refresh');
assert.ok(trade.includes('resourceSummaryCached:(f=0)=>'),'cached AI read missing');
assert.ok(strategy.includes('resourceSummaryCached?.(f)'),'tactical read still triggers a rebuild');
assert.ok(strategy.includes('resourceSummaryCached?.(partner)'),'trade AI still triggers a rebuild');
assert.ok(!strategy.includes('if(geoCache.size>=MAX_GEO_CACHE)geoCache.clear()'),'mass cache flush remains');
assert.ok(strategy.includes('geoCache.delete(geoCache.keys().next().value)'),'incremental eviction missing');
assert.ok(!statecraft.includes('const cities=[...cities3212]'),'whole city array copy remains');
assert.ok(statecraft.includes('cityIterator0384=cities3212.values()'),'incremental city cursor missing');
assert.ok(trade.includes('phases:tradePhases0384'),'trade profiling missing');
assert.ok(statecraft.includes('performance:()=>'),'statecraft profiling missing');

const start=trade.indexOf('function refreshGeoProduction0383(');
const end=trade.indexOf('function resourceTick03720(',start);
assert.ok(start>=0&&end>start,'geographic updater not found');
const updater=trade.slice(start,end);
const run=new Function('resourceNodes03720','strategy','owner6','geoNodeCounts0383',
  'snap','performance','clamp','countryCount',`
  const window={HexategosResourceStrategy0383:strategy};
  let geoProductionIterator0383=null,geoRefreshMs0384=0,geoRefreshedNodes0384=0;
  const activeFactionCount3230=countryCount,GEO_PRODUCTION_BATCH0383=48,GEO_REFRESH_BUDGET_MS0384=1.4;
  const terrainResourceProfile0382=()=>({food:1,raw:1,fuel:1});
  ${updater}
  refreshGeoProduction0383(snap);
  return {updated:geoRefreshedNodes0384,nodes:[...resourceNodes03720.values()]};
`);
function caseFor(countryCount){
  const nodes=new Map(),owner=new Int16Array(1000),counts=new Uint16Array(countryCount).fill(2);
  for(let i=0;i<1000;i++){
    owner[i]=i%countryCount;
    nodes.set(i,{cell:i,f:owner[i],city:i%7===0?2:0,urbanWeight:i%7===0?6:0,
      geo:{food:1.21,raw:1.48,fuel:.8},prod:[0,0,0]});
  }
  let time=0;
  const result=run(nodes,{nationalPotential:()=>[1.1,1.3,1]},
    owner,counts,{territory:new Uint16Array(countryCount).fill(50)},
    {now:()=>{time+=.01;return time}},(x,a,b)=>Math.max(a,Math.min(b,x)),countryCount);
  const changed=result.nodes.filter(n=>n.prod[1]>0).length;
  assert.equal(changed,result.updated,'geographic progress count must match actual nodes');
  assert.ok(changed>0,'updater must make progress');
  assert.ok(changed<=(countryCount>=350?24:countryCount>=250?32:48),
    'updater exceeded per-cycle country-size limit');
  const first=result.nodes[0],regional=50/2;
  assert.ok(Math.abs(first.prod[1]-regional*.00056*(1.3*.72+1.48*.28))<1e-12,
    'raw material output no longer equivalent to previous model');
  return changed;
}
const small=caseFor(150),large=caseFor(500);

// Abrir nuevas rutas entre nodos existentes no debe reconstruir toda
// la economía. Los nuevos hubs siguen obligando a crear un nodo.
const sigStart=trade.indexOf('function resourceStructureSignature03720(');
const sigEnd=trade.indexOf('function resourceRoadComp03720(',sigStart);
assert.ok(sigStart>=0&&sigEnd>sigStart,'route structure signature missing');
const makeSignature=new Function('routes','cities3212','industries3212','ports3212',
  'capitals','owner6','roadEpoch','activeFactionCount3230',
  trade.slice(sigStart,sigEnd)+'return resourceStructureSignature03720()');
const ownerCells=new Int16Array(10),cityCells=new Set([1,2]),ports=new Set([3,4]);
const signature=routes=>makeSignature(routes,cityCells,new Set(),ports,[1],ownerCells,1,500);
const baseSig=signature([]);
assert.equal(baseSig,signature([{status:'active',from:1,to:3,type:'sea'}]),
  'new route between existing nodes should not trigger global rebuild');
const hubSig=signature([{status:'active',from:1,to:7,type:'land'}]);
assert.ok(hubSig!==baseSig,'a genuinely new route hub must trigger rebuild');
assert.equal(hubSig,signature([
  {status:'active',from:1,to:7,type:'land'},
  {status:'active',from:2,to:7,type:'land'}
]),'duplicate references to same route hub must not trigger rebuild');
assert.equal(baseSig,signature([{status:'closed',from:1,to:7,type:'land'}]),
  'closed routes must not keep orphan hubs alive');

console.log('HEXATEGOS 0.38.4 performance smoke: OK; refreshed nodes 150=',small,'500=',large);
