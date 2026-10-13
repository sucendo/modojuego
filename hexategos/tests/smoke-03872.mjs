import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const trade=read('js/trade-logistics-0370.js');
const industry=read('js/production-0388.js');
const government=read('js/statecraft-0380.js');
const ai=read('js/ai-commerce-0375.js');
const html=read('index.html');
for(const [name,src] of [['trade',trade],['industry',industry],['government',government],['ai',ai]])
  assert.doesNotThrow(()=>new Function(src),name+' syntactically valid');
function section(s,begin,end){
  const a=s.indexOf(begin),b=s.indexOf(end,a+begin.length);
  assert(a>=0&&b>a,begin+' missing');
  return s.slice(a,b);
}

// Execute the production profile used by the real trade engine, rather than
// asserting an independent reimplementation with the same constants.
const nodeCode=section(trade,'  function resourceNodeProfile03720(cell,f,nodeCount,snap){',
 '  function ensureResourceNodes03720(force=false){');
const ownCells=new Set([100]),legacyIndustries=new Set(),ports=new Set();
const levels=[];levels[100]=1;
const profile=new Function('cities3212','cityLevel3230','industries3212',
 'industryLevel3230','ports3212','capitals','urbanWeight0382','terrainResourceProfile0382',
 'window','clamp',nodeCode+'\nreturn resourceNodeProfile03720;')(
 ownCells,levels,legacyIndustries,[],ports,[100],
 ()=>4.8,()=>({type:'plain',food:1,raw:1,fuel:1}),
 {HexategosResourceStrategy0383:{nationalPotential:()=>[1,1,1]}},
 (x,a,b)=>Math.max(a,Math.min(b,x)));
const growth=profile(100,0,1,{territory:[29]});
for(const i of [0,2,3])assert(growth.prod[i]>growth.demand[i],
 'capital with 29 hex must recover basic resource '+i+' after starvation');
const early=profile(100,0,1,{territory:[4]});
assert(early.prod[0]<growth.prod[0],'food depends on real territorial extent');
assert(early.prod[2]<growth.prod[2],'fuel depends on real territorial extent');
assert(early.prod[0]>=0&&early.prod[2]>=0,'no negative output');

// Incremental production refresh must use the same coefficients as creation.
assert.match(trade,/regional\*\.0075\*blend\(geo\.food,0\)/);
assert.match(trade,/regional\*\.0024\*blend\(geo\.raw,1\)/);
assert.match(trade,/regional\*\.0045\*blend\(geo\.fuel,2\)/);
assert.match(trade,/cov&&Number\.isFinite\(Number\(cov\[i\]\)\)\?Number\(cov\[i\]\):\.56/);
assert.doesNotMatch(trade,/Number\(cov\?\.\[i\]\)\|\|\.56/,
 'zero stored supply must never be replaced by an invented stock');

// Execute actual government-city supply using mocked logistics readings.
const supplyCode=section(government,'  function supplyForCity(cell,f){',
 '  function ensureCityState(cell){');
const coverage=[62,0,61,45,0];
let raw=0;
const stockApi={combinedSupply:()=>raw,materialSupply:()=>({resourcePct:coverage})};
const getSupply=new Function('window','capitals','owner6','supplyPct3220','clamp',
 supplyCode+'\nreturn supplyForCity;')(
 {HexategosTradeLogistics0370:stockApi},[100],[...Array(101)].map((_,i)=>i===100?0:0),
 ()=>0,(x,a,b)=>Math.max(a,Math.min(b,x)));
assert(getSupply(100,0)>30,'capital can subsist locally with real food stocks');
assert.equal(getSupply(99,0),0,'ordinary unconnected city has no implicit supply');
coverage.fill(0);
assert.equal(getSupply(100,0),0,'empty food and fuel reserves cannot conjure supply');
raw=25;
assert.equal(getSupply(100,0),25,'capital preserves actual logistic supply when local stocks are empty');
assert.match(government,/Number\.isFinite\(Number\(st\.lastSupply\)\)/,
 'a genuine zero supply must be shown as zero');

// Execute the actual legacy migration with one old level-three installation.
const migrateCode=section(industry,'  function migrateGeneralIndustry(){','  function tick({nodes,routes,dt}){');
const all=new Map([['100:civilian',{cell:100,kind:'civilian',level:1}]]);
const original=all.get('100:civilian'),owner=[];owner[100]=0;owner[101]=1;
const migration=new Function('industries3212','owner6','sites','siteKey',
 'clamp','MAX_SITES','MAX_PER_CELL','sitesOnCell','addSite','industryLevel3230',
 'campaignSeconds3230','revision','legacyReconciledCells03872',
 migrateCode+'\nreturn migrateGeneralIndustry;')(
 new Set([100,101]),owner,all,(c,k)=>c+':'+k,
 (x,a,b)=>Math.max(a,Math.min(b,x)),5000,8,
 c=>[...all.values()].filter(s=>s.cell===c),
 s=>{all.set(s.cell+':'+s.kind,s);return true},
 {[100]:3,[101]:2},1287,1,new Set());
assert.equal(migration(),2,'reconcile one old factory and migrate one absent');
assert.equal(original.level,3,'old level 3 must not be downgraded to 1');
assert.equal(all.size,2,'existing site must not be duplicated');
assert.equal(all.get('101:civilian').level,2,'missing factory inherits old level');
assert.equal(migration(),0,'repeated migration must be idempotent');
original.level=1; // Simulate disconnection/gradual degradation after migration.
assert.equal(migration(),0,'degradation must not be reversed on each tick');
assert.equal(original.level,1,'degraded industry must not be silently upgraded');
assert.match(industry,/legacyReconciled03872:\[\.\.\.legacyReconciledCells03872\]/,
 'migration marker must persist in production save');
assert.match(industry,/Array\.isArray\(data\?\.legacyReconciled03872\)/,
 'legacy migration marker must survive loading old and new saves');

// A capital road is a paid, owned connection, never a free spontaneous road.
const roadSrc=section(ai,'  const nextCapitalRoad03772=',
 '  function tryRepairCommunications0375(f){');
const ownerMap=[],capitals=[-1,11],gold=[0,90],calls=[];
ownerMap[11]=1;ownerMap[12]=1;ownerMap[13]=2;
const tryRoad=new Function('FACTIONS3230','campaignSeconds3230','capitals','owner6',
 'aiRoadDegree3260','botGold3230','loadLevel','MAX_GAME_LEVEL3233',
 'aiEnemyNeighbours3260','terrainKey3250','window','buildRoadPath0375',
 roadSrc+'\nreturn tryCapitalRoad03772;')(
 Array(150).fill(null),1200,capitals,ownerMap,()=>0,gold,
 ()=>({n:14,offsets:Object.assign(Array(15).fill(0),{11:0,12:2}),edgeNbr:[12,13]}),8,
 ()=>0,()=>'plain',{HexategosResourceStrategy0383:{priority:()=>1}},
 (...args)=>{calls.push(args);return true;});
assert(tryRoad(1),'capital road should have a reachable owned neighbour');
assert.equal(calls.length,1);
assert.equal(calls[0][1],11);assert.equal(calls[0][2],12);
assert.equal(calls[0][3],24,'first road must reserve own treasury');
assert.equal(tryRoad(1),false,'same faction must not repeat road build every tick');
assert.doesNotMatch(ai,/setInterval\(/,'no extra AI interval');

// Both mobile and desktop should load the new economic code, not old cached JS.
for(const file of ['trade-logistics-0370.js','production-0388.js',
 'statecraft-0380.js','ai-commerce-0375.js'])
 assert.match(html,new RegExp(file.replaceAll('.','\\.')+'\\?v='+(file==='production-0388.js'?'03873':['trade-logistics-0370.js','statecraft-0380.js'].includes(file)?'03874':'03872')));
console.log('HXZ2 food/fuel recovery, genuine zero stocks, capital supply, civilian migration and first AI road: PASS');
