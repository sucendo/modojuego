import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deflateSync,inflateSync} from 'node:zlib';
const read=p=>fs.readFileSync(new URL('../js/'+p,import.meta.url),'utf8');
const names=read('regional-names-0389.js'),storage=read('save-storage-03827.js'),ai=read('nation-ai-0360.js');
const disk=new Map(),messages=[],warnings=[];
let quota=100000,baseLoads=0,baseImports=0;
const localStorage={
  getItem:key=>disk.has(key)?disk.get(key):null,
  setItem:(key,value)=>{
    if(key==='hexategos.regionalNames.0389'&&quota===0)throw Error('QuotaExceededError');
    disk.set(key,String(value));
  },
  removeItem:key=>disk.delete(key)
};
const window={pako:{
  deflate:data=>new Uint8Array(deflateSync(Buffer.from(data),{level:5})),
  inflate:data=>inflateSync(Buffer.from(data)).toString('utf8')
}};
const btoa=data=>Buffer.from(data,'latin1').toString('base64');
const atob=data=>Buffer.from(data,'base64').toString('latin1');
const toast=message=>messages.push(message);
const warningsConsole={warn:(...args)=>warnings.push(args.map(String).join(' ')),info(){}};
new Function('window','localStorage','toast','console','btoa','atob',storage)(
  window,localStorage,toast,warningsConsole,btoa,atob);
const game=new Function('window','localStorage','console','toast','notifyLoad','notifyImport',names+`
  ;return {api:window.HexategosRegionalNames0389,load:loadGame3212,
    save:saveGame3212,exportFile:buildPortableFile3275,importFile:applyPortableFile3275,
    reset:resetGame3230,display:f=>factionName3230(f),readCity:cell=>cityDisplayName3271(cell)};
`); // Declared globals are supplied as a prelude in the invocation below.
const prelude=`
  const FACTIONS3230=Array.from({length:500},(_,i)=>({name:i===0?'Mi nación':'Nación '+i}));
  const capitals=[1,2],owner6=new Int16Array([0,0,1,0]);
  const cities3212=new Set([1,2,3]),namesCity=new Map([[1,'Córdoba'],[2,'Zaragoza'],[3,'Lérida']]);
  const aiSnapshot3260={territory:new Uint16Array(500).fill(2)};
  let factionName3230=f=>FACTIONS3230[f].name,activeFactionCount3230=150,started3230=true,
    paused3230=false,campaignSeconds3230=50;
  const cellLonLat3302=cell=>cell===2?{lon:-.9,lat:41.6}:{lon:-4.8,lat:37.9};
  const cityDisplayName3271=cell=>namesCity.get(cell)||'';
  const setCityName3271=(cell,name)=>{namesCity.set(cell,name);return true};
  const cleanCityName3271=x=>x;
  const updateUI3230=()=>{};
  let saveGame3212=()=>true;
  let resetGame3230=()=>true;
  let loadGame3212=()=>{notifyLoad();resetGame3230(false);return true};
  let buildPortableFile3275=()=>({payload:{main:{owner:[0,0,1],roads:[],cities:[1,2]}}});
  let applyPortableFile3275=file=>{
    if(file.reject)return false;
    notifyImport();resetGame3230(false);return true
  };
  const fnv1a3273=s=>s.length;
`;
const run=new Function('window','localStorage','console','toast','notifyLoad','notifyImport',
  prelude+names+`
  ;return {api:window.HexategosRegionalNames0389,load:loadGame3212,
    save:saveGame3212,exportFile:buildPortableFile3275,importFile:applyPortableFile3275,
    reset:resetGame3230,display:f=>factionName3230(f),readCity:cell=>cityDisplayName3271(cell)};
`);
const scope=run(window,localStorage,warningsConsole,toast,()=>baseLoads++,()=>baseImports++);
const api=scope.api,codec=window.HexategosSaveStorage03827,KEY='hexategos.regionalNames.0389';
assert.equal(api.renamePlayer('Reino de Castilla'),true);
assert.equal(api.setPlayerCulture('castilian'),true);
assert.equal(api.renameCity(1,'Qurtuba'),true);
assert.equal(api.renameCity(3,'Lleida'),true);
const originalNation=api.ensureNation(1);
assert.ok(originalNation?.name,'AI country gets geographic name');
assert.equal(scope.save(),true);
const saved=api.serialize();
assert.equal(saved.playerName,'Reino de Castilla');
assert.equal(saved.playerCulture,'castilian');
assert.equal(saved.cityIdentity.length,2);
assert.ok(saved.nations.some(([f])=>f===1));
assert.deepEqual(codec.get(KEY),saved);
assert.equal(scope.load(),true);
assert.equal(scope.display(0),'Reino de Castilla');
assert.equal(scope.readCity(1),'Qurtuba');
assert.equal(scope.readCity(3),'Lleida');
assert.equal(api.serialize().nations[0][1].name,originalNation.name);
assert.equal(api.serialize().playerCulture,'castilian');
assert.equal(baseLoads,1,'continue actually invoked main loader');

const portable=scope.exportFile();
assert.equal(portable.payload.regionalNames0389.playerName,'Reino de Castilla');
assert.equal(portable.checksum,JSON.stringify(portable.payload).length);
assert.ok(portable.payload.regionalNames0389.cityIdentity.length===2);
const before=api.serialize(),rawBefore=disk.get(KEY);
assert.equal(scope.importFile({...portable,reject:true}),false);
assert.deepEqual(api.serialize(),before,'failed portable import cannot erase names');
assert.equal(disk.get(KEY),rawBefore,'failed import leaves the browser save untouched');
assert.equal(baseImports,0);

const copy=structuredClone(portable);
copy.payload.regionalNames0389.playerName='Reino de León';
copy.payload.regionalNames0389.playerHistory=['Reino de Castilla'];
assert.equal(scope.importFile(copy),true);
assert.equal(baseImports,1);
assert.equal(scope.display(0),'Reino de León');
assert.equal(codec.get(KEY).playerName,'Reino de León');
assert.equal(api.serialize().playerHistory[0],'Reino de Castilla');
assert.equal(scope.load(),true,'imported campaign continues after restart');
assert.equal(scope.display(0),'Reino de León');

const beforeCorruption=api.serialize();
disk.set(KEY,'{not-json');
assert.equal(scope.load(),false,'corrupt naming save must block continuation');
assert.equal(baseLoads,2,'main campaign must not load after corrupted identities');
assert.deepEqual(api.serialize(),beforeCorruption,'invalid load must preserve live names');
disk.set(KEY,JSON.stringify({v:3,nations:'invalid'}));
assert.equal(scope.load(),false,'malformed naming schema must block load');
assert.deepEqual(api.serialize(),beforeCorruption);
disk.set(KEY,rawBefore);
assert.equal(scope.load(),true);
assert.equal(scope.display(0),'Reino de Castilla');

quota=0;
assert.equal(scope.save(),false,'failed sidecar save must not claim success');
assert.ok(api.persistence().error,'save failure should be diagnosable');
assert.equal(disk.get(KEY),rawBefore,'quota failure must keep previous good snapshot');
assert.ok(messages.length||warnings.length,'save failure must be visible');
quota=100000;
assert.equal(scope.save(),true);
assert.equal(api.persistence().error,null,'successful save clears failure flag');
const legacy={v:1,nations:[[1,{name:'Principado de Aragón',capital:2}]],cities:[[1,'Córdoba']],checked:[]};
disk.set(KEY,JSON.stringify(legacy));
assert.equal(scope.load(),true,'uncompressed historical naming sidecars remain loadable');
assert.equal(api.serialize().nations[0][1].name,'Principado de Aragón');
assert.equal(api.serialize().playerName,'');
assert.equal(scope.importFile({payload:{main:{owner:[0],roads:[],cities:[]}}}),true,
  'older portable copies without naming fields may still load');
assert.equal(api.serialize().playerName,'','old portable does not inherit names from another campaign');
assert.match(ai,/if\(typeof buildPortableFile3275==='function'\)/,
  'national AI must export through the active portable entrypoint');
assert.match(ai,/if\(out===false\)return false; \/\/ checksum\/revision/);
console.log('HEXATEGOS identity saves: nation, player, cultural and city history, browser reload, portable checksum, failed imports, old saves, quota and corruption PASS');
