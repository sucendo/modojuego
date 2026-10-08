import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('js/production-0388.js'),css=read('css/production-0388.css'),index=read('index.html');
assert.doesNotThrow(()=>new Function(js),'0.38.11 production syntax');
assert.ok(js.includes('iconOffset03811'),'co-located marker layout missing');
assert.ok(css.includes('industryBudget0388'),'disabled-choice explanation styling missing');
assert.match(index,/js\/production-0388\.js\?v=\d+/);
assert.match(index,/css\/production-0388\.css\?v=0381[15]/);

const owner=Array(20).fill(0),gold=[0,2500];
const centers=Array(60).fill(5000),edges=[],offsets=[0];
for(let i=0;i<owner.length;i++){edges.push((i+1)%20,(i+2)%20,(i+3)%20,(i+4)%20,(i+5)%20,(i+6)%20);offsets.push(edges.length)}
const level=()=>({n:20,offsets,edgeNbr:edges,centers});
const cities=new Set([4]),ports=new Set([4]),generalIndustry=new Set([4]);
const drawn=[],ctx={
  save(){},restore(){},beginPath(){},arc(){},fill(){},stroke(){},fillText(...v){drawn.push(['special',...v])}
};
const cache=new Map();
const fakeWindow={HexategosTradeLogistics0370:{
  geography:()=>({type:'desert',food:1,raw:1,fuel:2}),roadComponent:()=>1,
  resourceSummaryCached:()=>({coverage:[.5,.5,.5]})
}};
const stubHost={getElementById:()=>null};
const names=[
 'window','FACTIONS3230','owner6','botGold3230','gold3212','loadLevel','MAX_GAME_LEVEL3233',
 'campaignSeconds3230','started3230','activeFactionCount3230','saveGame3212','loadGame3212',
 'resetGame3230','renderSystems3220','buildClassicActions3246','handleContextAction3244',
 'drawInfrastructure3212','document','modalBody3244','console','aiNationalSamples3275',
 'ports3212','localStorage','capitals','cities3212','industries3212','zoom',
 'drawGlobeCityIcon3249','drawGlobePortIcon3249','drawGlobeIndustryIcon3249',
 'globeIconScale3249','currentKey','ctx','projectVec','vw','vh','industryLevel3230'
];
const native=[];
const args=[
 fakeWindow,[{role:'balanced'},{role:'growth'}],owner,gold,3000,level,5,100,
 true,2,()=>{},()=>{},()=>{},()=>{},()=>[],()=>{},()=>{},stubHost,null,
 {info(){},warn(){}},[[],[]],ports,
 {getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v),removeItem:k=>cache.delete(k)},
 [4,12],cities,generalIndustry,10,
 (x,y)=>native.push(['city',x,y]),(x,y)=>native.push(['port',x,y]),
 (x,y)=>native.push(['industry',x,y]),()=>8,5,ctx,
 (x,y,z)=>[300,220,.99],800,500,new Uint8Array(owner.length)
];
const boot=new Function(...names,js+
  '\nreturn {api:window.HexategosProduction0388,save:saveGame3212,load:loadGame3212,reset:resetGame3230,draw:drawInfrastructure3212,city:drawGlobeCityIcon3249,port:drawGlobePortIcon3249,industry:drawGlobeIndustryIcon3249,gold:()=>gold3212};');
const u=boot(...args),api=u.api;
assert.ok(api.build(0,4,'gas'),'gas extraction blocked despite city and port');
assert.ok(api.build(0,4,'oil'),'second independent extraction blocked');
assert.ok(api.build(0,4,'refinery'),'factory co-location blocked');
assert.equal(api.sitesOnCell(4).length,3);
assert.equal(api.sites().length,3);
assert.ok(!api.availability(0,4,'gas').ok);
assert.match(api.availability(0,4,'gas').reason,/Ya construida/);
assert.match(api.availability(0,4,'iron').reason,/Máximo de 3/);
assert.equal(api.build(0,4,'iron'),false,'fourth site must respect map-density limit');
assert.ok(api.build(0,5,'iron'),'third-site cap must not affect nearby hexagon');
assert.equal(api.sitesOnCell(5).length,1);
assert.equal(api.availability(0,5,'iron').ok,false);
assert.ok(api.setPct('4:gas',35),'individual gas controller');
assert.equal(api.sitesOnCell(4).find(s=>s.kind==='gas').pct,35);
assert.equal(api.sitesOnCell(4).find(s=>s.kind==='oil').pct,100,'independent oil controller');
assert.ok(api.upgrade('4:oil'),'individual oil upgrade');
assert.equal(api.sitesOnCell(4).find(s=>s.kind==='oil').level,2);
const roles=['city','port','industry','4:gas','4:oil','4:refinery'];
const offsetsForRoles=roles.map(role=>api.iconOffset(4,role));
assert.equal(new Set(offsetsForRoles.map(([x,y])=>x.toFixed(2)+','+y.toFixed(2))).size,6,
  'visible icons overlap in a six-element cluster');
for(let i=0;i<roles.length;i++)for(let j=i+1;j<roles.length;j++){
  const [x,y]=offsetsForRoles[i],[xx,yy]=offsetsForRoles[j];
  assert.ok(Math.hypot(x-xx,y-yy)>13,'markers are too close together');
}
u.city(100,100,4,8);u.port(100,100,4,8);u.industry(100,100,4,8);
assert.equal(new Set(native.map(x=>x.slice(1).join(','))).size,3,'original infrastructure markers collide');
u.save();
assert.ok(JSON.parse(cache.get('hexategos.production.0388')).sites.length===4,'multi-site save missing');
u.reset(false);
assert.equal(api.sites().length,0,'reset did not clear grouped installation indexes');
u.load();
assert.equal(api.sitesOnCell(4).length,3,'multiple specialized buildings lost on reload');
assert.equal(api.sitesOnCell(4).find(s=>s.kind==='gas').pct,35);
assert.equal(api.sitesOnCell(4).find(s=>s.kind==='oil').level,2);
assert.ok(api.validate().ok,'invalid production state after reload');
console.log('HEXATEGOS 0.38.11 multi-site production, unique markers, controls, save and limits: OK');
