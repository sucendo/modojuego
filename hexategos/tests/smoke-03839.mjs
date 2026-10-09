import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deflateSync,inflateSync} from 'node:zlib';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=read('js/game.js'),codecText=read('js/save-storage-03827.js');
const integrity=read('js/save-integrity-03827.js'),html=read('index.html');
const start=game.lastIndexOf('function saveGame3212(){',game.indexOf('function selectedGameCell3230()'));
const end=game.indexOf('function selectedGameCell3230()',start);
assert.ok(start>0&&end>start);
const mainFunctions=game.slice(start,end);
assert.match(mainFunctions,/codec\.set\(SAVE_KEY3230,s\)/);
assert.match(mainFunctions,/codec\.get\(SAVE_KEY3230\)/);
assert.match(game,/if\(saved===false\)\{\s*toast\('⚠ No se pudo guardar/);
assert.ok(html.includes('game.js?v=03839'));
assert.ok(html.includes('save-storage-03827.js?v=03839'));
assert.ok(html.includes('save-integrity-03827.js?v=03839'));
assert.ok(html.indexOf('save-storage-03827.js')<html.indexOf('save-integrity-03827.js'));
let capacity=14000;
const stored=new Map(),shown=[];
const localStorage={
  getItem:key=>stored.get(key)??null,
  removeItem:key=>stored.delete(key),
  setItem(key,value){
    const total=[...stored].filter(x=>x[0]!==key)
      .reduce((n,x)=>n+x[1].length,0)+value.length;
    if(total>capacity)throw Error('QuotaExceededError');
    stored.set(key,value);
  }
};
const window={pako:{
  deflate:s=>new Uint8Array(deflateSync(Buffer.from(s),{level:5})),
  inflate:(bytes,options)=>inflateSync(Buffer.from(bytes)).toString('utf8')
}};
new Function('window','localStorage','toast','console',codecText)(
 window,localStorage,msg=>shown.push(msg),{warn(){}});
const codec=window.HexategosSaveStorage03827;
const key='openfront-globe-v3.24.0-163k';
const prelude=`
 const SAVE_KEY3230='openfront-globe-v3.24.0-163k';
 const MAX_GAME_LEVEL3233='8',FACTIONS3230=Array.from({length:500},()=>({}));
 let owner6=new Int16Array(15000).fill(0),
     forts3212=new Uint8Array(15000),cityLevel3230=new Uint8Array(15000),
     industryLevel3230=new Uint8Array(15000);
 let gold3212=600,activeFactionCount3230=500,
    troops3230=new Float64Array(500).fill(225),
    botGold3230=new Float64Array(500).fill(150),
    nationalism3230=new Float64Array(500).fill(60),
    capitalShockUntil3230=new Float64Array(500),
    capitalShockFactor3230=new Float64Array(500).fill(1),
    relations3220=new Int8Array(500),
    spyIntel3230=new Uint8Array(500),
    cities3212=new Set([4]),industries3212=new Set([12]),ports3212=new Set([17]),
    roads3212=[[4,7,12]],fleets3212=[],
    capitals=[4,45],historicCapital3230=[4,45],
    research3230={points:1,levels:{technology:0,policy:0,medicine:0,science:0}},
    activeFronts3230=[],nextFrontId3230=1,activeFrontId3230=-1,
    campaignSeconds3230=52,gameSpeed3212=1,showSupplyOverlay3230=false,
    introHadSave3230=false,started3230=true,paused3230=false,
    playerCountry=-1,cacheDirty=false,supplyDirty3220=false;
 let resetCalls=0;
 const loadLevel=()=>({n:owner6.length});
 const normalizeFactionCount3230=f=>f;
 const fitFactionList3230=(value,fallback)=>value.slice();
 const rebuildRoadEdges3212=()=>{};
 const resetGame3230=()=>{resetCalls++};
`;
const runner=new Function('window','localStorage','console',
 prelude+mainFunctions+`
 return {
  save:saveGame3212,load:loadGame3212,
  inspect:()=>({owner0:owner6[0],gold:gold3212,seconds:campaignSeconds3230,
    paused:paused3230,front:activeFrontId3230,roads:roads3212.length,
    sites:industries3212.size,ports:ports3212.size,resetCalls}),
  edit:(owner,gold,seconds)=>{owner6[0]=owner;gold3212=gold;campaignSeconds3230=seconds}
 };
`);
const scope=runner(window,localStorage,{warn(){}});
assert.equal(scope.save(),true,'main save must explicitly confirm success');
const raw=stored.get(key);
assert.ok(raw.startsWith('HXZ1:'),'large main save must compress, not fill localStorage');
assert.ok(raw.length<12000,'stored main save must fit limited browser quota');
assert.equal(codec.get(key).owner.length,15000);
scope.edit(2,999,90);
assert.equal(scope.load(),true,'compressed save should load through actual game loader');
assert.equal(scope.inspect().owner0,0);
assert.equal(scope.inspect().gold,600);
assert.equal(scope.inspect().seconds,52);
assert.equal(scope.inspect().roads,1);
assert.equal(scope.inspect().sites,1);
assert.equal(scope.inspect().ports,1);
// Large existing JSON saves are still accepted and converted on next save.
const legacy=codec.get(key);legacy.owner[0]=5;legacy.campaignSeconds=89;
capacity=300000;localStorage.setItem(key,JSON.stringify(legacy));
assert.equal(scope.load(),true);
assert.equal(scope.inspect().owner0,5);
assert.equal(scope.inspect().seconds,89);
assert.equal(scope.save(),true);
assert.ok(stored.get(key).startsWith('HXZ1:'),'legacy save migrates without data loss');
// When quota truly fails, never overwrite the last good campaign.
const previous=stored.get(key);
capacity=100;
scope.edit(7,200,200);
assert.equal(scope.save(),false,'quota failure must be visible');
assert.equal(stored.get(key),previous,'failed write must preserve previous save');
assert.equal(scope.load(),true);
assert.equal(scope.inspect().owner0,5);
const alerts=shown.length;
for(let n=0;n<5;n++)assert.equal(scope.save(),false);
assert.equal(shown.length,alerts,'continuous save failure must warn only once');
capacity=300000;
assert.equal(scope.save(),true);
assert.equal(codec.status(),null,'storage diagnostics recover when saving succeeds');
capacity=100;
assert.equal(scope.save(),false,'second failure episode');
assert.equal(shown.length,alerts+1,'only a new failure episode may alert again');
assert.equal(scope.inspect().resetCalls,0,'no save operation may reset the campaign');
assert.match(integrity,/codec\?\.get\?codec\.get\(SAVE_KEY3230\)/);
assert.match(integrity,/mainAlertShown/);
console.log('HEXATEGOS 0.38.39: compressed primary save, legacy recovery, quota, no false success or recurring notifications PASS');
