import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../js/production-0388.js',import.meta.url),'utf8');
const geology=fs.readFileSync(new URL('../js/geology-03830.js',import.meta.url),'utf8');
assert.doesNotThrow(()=>new Function(source));
assert.doesNotThrow(()=>new Function(geology));
assert.match(source,/Necesita prospección geológica/);
assert.match(source,/legacyQuality:/);
assert.match(geology,/effectiveDeposit\(cell,kind,base\)/);
const args=['window','FACTIONS3230','owner6','botGold3230','gold3212','loadLevel',
  'MAX_GAME_LEVEL3233','campaignSeconds3230','started3230','activeFactionCount3230',
  'saveGame3212','loadGame3212','resetGame3230','renderSystems3220','buildClassicActions3246',
  'handleContextAction3244','drawInfrastructure3212','document','modalBody3244','console',
  'aiNationalSamples3275','ports3212','localStorage','capitals','industryLevel3230',
  'industries3212','buildPortableFile3275','applyPortableFile3275','fnv1a3273'];
const owner=Array(50).fill(0),offsets=[0],edgeNbr=[];
for(let c=0;c<50;c++){for(let i=1;i<=6;i++)edgeNbr.push((c+i)%50);offsets.push(edgeNbr.length)}
const deposits=new Map([['4:iron',1.8],['5:iron',.24],['6:iron',0],
  ['7:oil',.78],['8:coal',.9],['9:iron',0],['10:quarry',0]]);
const known=new Set();
const win={
 HexategosTradeLogistics0370:{
   geography:()=>({type:'plain',food:1.5,raw:1.7,fuel:1.4}),
   roadComponent:()=>0,resourceSummaryCached:()=>({coverage:[.5,.5,.5]})
 },
 HexategosGeology03830:{
   deposit:(cell,kind)=>({quality:deposits.get(cell+':'+kind)||0}),
   kinds:()=>['iron','copper','coal','quarry','oil','gas']
 },
 HexategosProspection03831:{hasKnowledge:c=>known.has(c)},
 HexategosNaturalPotential03829:{
   profile:c=>({forest:c===13?1.7:0,food:c===14?1.5:0,livestock:c===15?1.3:0})
 }
};
const saved=new Map();
const storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
const build=new Function(...args,source+
 '\nreturn {api:window.HexategosProduction0388,save:saveGame3212,load:loadGame3212,reset:resetGame3230,exportFile:buildPortableFile3275,importFile:applyPortableFile3275};');
const game=build(win,[{role:'balanced'}],owner,[0],9000,()=>({n:50,offsets,edgeNbr}),
  0,100,true,1,()=>true,()=>true,()=>true,()=>{},()=>[],()=>{},()=>{},
  {getElementById:()=>null},null,{warn(){},info(){}},[[]],new Set([15,25]),
  storage,[0],new Uint8Array(50),new Set(),()=>({payload:{}}),()=>true,undefined);
const api=game.api;
assert.equal(api.availability(0,4,'iron',false).ok,false,'mine without study must not build');
known.add(4);known.add(5);known.add(6);known.add(9);known.add(10);
assert.equal(api.availability(0,6,'iron',false).ok,false,'zero iron cannot host a mine');
assert.equal(api.availability(0,10,'quarry',false).ok,false,'zero stone cannot host quarry');
assert.equal(api.availability(0,4,'iron',false).ok,true);
assert.equal(api.build(0,4,'iron',false),true);
assert.equal(api.build(0,5,'iron',false),true);
assert.ok(api.potential(4,0,'iron')>api.potential(5,0,'iron')*3,
  'quality must distinguish productive mines at same technology level');
const nodes=new Map(Array.from({length:50},(_,c)=>[c,{cell:c,f:0,comp:0,
  stock:[0,0,0,0,0],cap:[250,250,250,250,250]}]));
for(let i=0;i<5;i++)api.tick({nodes,routes:[],dt:4});
const rich=api.sitesOnCell(4)[0],poor=api.sitesOnCell(5)[0];
assert.ok(rich.output>poor.output,'rich mine outputs more iron');
assert.equal(api.build(0,12,'timber',false),false,'wood production must require trees');
assert.equal(api.build(0,13,'timber',false),true,'forest supports a wood concession');
assert.equal(api.build(0,14,'crops',false),true,'agricultural value enables crops');
assert.equal(api.build(0,15,'livestock',false),true,'pasture is separate from crops');
assert.equal(api.build(0,16,'crops',false),false,'zero fertility cannot support crops');
assert.equal(api.build(0,16,'livestock',false),false,'zero pasture cannot support livestock');
// Importing a legacy mine at a new map coordinate with no iron MUST preserve it.
const legacyFile={payload:{production0388:{
 v:2,sites:[{cell:9,f:0,kind:'iron',level:3,pct:85,stock:4,output:8}],
 depots:[],sectors:[]
}}};
game.importFile(legacyFile);
const legacy=api.sitesOnCell(9)[0];
assert.equal(legacy.level,3);
assert.ok(legacy.legacyQuality>=.85&&legacy.potential>=.85,
  'a historical iron mine must retain a viable physical deposit');
const savedState=api.snapshot();
assert.equal(savedState.v,3,'new saves carry migration data');
assert.ok(savedState.sites.some(x=>x.cell===9&&x.legacyQuality>=.85));
game.save();game.reset(false);game.load();
assert.ok(api.sitesOnCell(9)[0].legacyQuality>=.85,'local save retains historical mine evidence');
const exported=game.exportFile();
game.reset(false);game.importFile(exported);
assert.ok(api.sitesOnCell(9)[0].legacyQuality>=.85,'portable save retains historical mine evidence');
owner[9]=1;api.tick({nodes,routes:[],dt:1});
assert.ok(api.sitesOnCell(9)[0].legacyQuality>=.85,'conquest cannot alter geological protection');
const snippet=geology.match(/  function effectiveDeposit\(cell,kind,base\)\{[\s\S]*?\n  \}/)?.[0];
assert.ok(snippet,'geology must apply historical evidence');
const effective=new Function('window',snippet+'\nreturn effectiveDeposit;')({
 HexategosProduction0388:{legacyQuality:(cell,kind)=>cell===9&&kind==='iron'?.85:0}
});
assert.equal(effective(9,'iron',{kind:'iron',quality:0,reserve:0}).quality,.85);
assert.equal(effective(8,'coal',{kind:'coal',quality:0,reserve:0}).quality,0);
console.log('HEXATEGOS 0.38.33: real deposits, mandatory study, zero extraction, biomes, mine quality, legacy saves and conquest PASS');
