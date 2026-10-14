import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const moduleCode=read('js/military-mobilization-03892.js');
const manpower=read('js/military-manpower-03874.js');
const html=read('index.html');
const game=read('js/game.js');
assert.doesNotThrow(()=>new Function(moduleCode));
assert.match(html,/military-manpower-03874\.js[^\n]*\n<script src="js\/military-mobilization-03892\.js/);
assert.ok(!/setInterval\(|setTimeout\(/.test(moduleCode),'no additional scheduler');
assert.match(game,/activeFronts:activeFronts3230/,'browser save contains fronts');
assert.match(game,/activeFronts:activeFronts3230,/,'portable main save contains fronts');
assert.match(manpower,/number\(x\.mobilization03892\?\.troops\)/,'pending troops counted in total capacity');
assert.match(manpower,/stat\('En movilización','moving'\)/,'military UI shows staging');

const disk=new Map(),trace=[];
const sandbox=new Function('window','disk','trace',`
const owner6=new Int16Array([0,0,0,0,-1,-1,-1]);
let capitals=[0],troops3230=new Float64Array([200,100]);
let started3230=true,paused3230=false,campaignSeconds3230=0;
let needsRender=false,activeFronts3230=[],next=1;
const centers=new Int16Array([32767,0,0,32760,700,0,32720,1500,0,32680,2000,0,32000,7000,0,31900,8000,0,30000,13000,0]);
const roadEdgeSet3212=new Set(['0-1','1-2']),edgeKey3212=(a,b)=>[a,b].sort((x,y)=>x-y).join('-');
const mountainTier3212=new Uint8Array(7);
const MAX_GAME_LEVEL3233=6,loadLevel=()=>({centers});
function findOwnedPath3212(a,b){if(a===b)return [a];if(b===2)return [0,1,2];if(b===3)return [0,1,2,3];return null;}
const toast=x=>trace.push(String(x));
const updateFrontDock3220=()=>{},updateUI3230=()=>{};
function saveGame3212(){
 disk.set('save',JSON.stringify({troops:[...troops3230],fronts:activeFronts3230,clock:campaignSeconds3230}));
 return true;
}
function loadGame3212(){
 const value=JSON.parse(disk.get('save'));troops3230=new Float64Array(value.troops);
 activeFronts3230=value.fronts;campaignSeconds3230=value.clock;return true;
}
function buildPortableFile3275(){return {payload:{main:{troops:[...troops3230],activeFronts:structuredClone(activeFronts3230),campaignSeconds:campaignSeconds3230}}}}
function applyPortableFile3275(file){
 const s=file.payload.main;troops3230=new Float64Array(s.troops);activeFronts3230=structuredClone(s.activeFronts);
 campaignSeconds3230=s.campaignSeconds;return true;
}
function createFront3230(target,override=null,kind=null){
 if(target<0)return null;
 const n=override===null?40:override;
 if(override===null)troops3230[0]-=n;
 const front={id:next++,goal:target,kind:kind||'war',pool:n,initial:n,
 route:[2,target],lastSrc:2,ticks:0,status:'en combate'};
 activeFronts3230.push(front);saveGame3212();return front;
}
function createFrontFromSource3245(source,target){
 const n=30;troops3230[0]-=n;
 const front={id:next++,goal:target,sourceAnchor:source,kind:'war',pool:n,initial:n,
 route:[source,target],lastSrc:source,ticks:0};
 activeFronts3230.push(front);saveGame3212();return front;
}
function reinforceFront3230(id){
 const front=activeFronts3230.find(f=>f.id===id);if(!front)return;
 front.pool+=10;front.initial+=10;troops3230[0]-=10;saveGame3212();
}
function finishFront3230(front,why,factor=1){
 const idx=activeFronts3230.indexOf(front);if(idx<0)return;
 troops3230[0]+=Math.floor(Math.max(0,front.pool)*factor);
 activeFronts3230.splice(idx,1);saveGame3212();
}
function frontTick3230(front){
 if(front.pool<1){finishFront3230(front,'exhausted',0);return;}
 front.ticks++;
}
`+moduleCode+`
return {
 api:window.HexategosMobilization03892,
 front:(target,override,kind)=>createFront3230(target,override,kind),
 from:(source,target)=>createFrontFromSource3245(source,target),
 reinforce:id=>reinforceFront3230(id),
 finish:(front,factor=1)=>finishFront3230(front,'cancel',factor),
 tick:front=>frontTick3230(front),
 advance:dt=>campaignSeconds3230+=dt,
 save:()=>saveGame3212(),load:()=>loadGame3212(),
 export:()=>buildPortableFile3275(),import:file=>applyPortableFile3275(file),
 troops:()=>troops3230[0],fronts:()=>activeFronts3230,
 status:()=>({troops:troops3230[0],fronts:structuredClone(activeFronts3230),clock:campaignSeconds3230}),
 setOwner:(cell,owner)=>owner6[cell]=owner,
 road:a=>roadEdgeSet3212.delete(a),
 pause:p=>paused3230=p
};
`)(globalThis,disk,trace);
const model=sandbox;
assert.equal(model.api.version,'0.38.92');
assert.equal(model.api.delayFor(0),3,'capital locally mobilizes quickly');
assert.equal(model.api.delayFor(2),4,'road-linked 2 hexes take short mobilization');
assert.equal(model.api.delayFor(3),5,'one unpaved hex extends mobilisation');
assert.ok(model.api.delayFor(6)>=22,'isolated territory cannot teleport from capital');
const f=model.front(4);
assert.ok(f);
assert.equal(model.troops(),160,'soldiers deducted from national reserve immediately');
assert.equal(f.pool,0,'new land front cannot fight on order');
assert.equal(f.mobilization03892.troops,40);
assert.equal(model.api.waiting(f),40);
assert.match(f.status,/movilización/);
assert.equal(model.tick(f),undefined);
assert.equal(f.ticks,0,'still cannot fight on initial tick');
model.advance(3);model.tick(f);assert.equal(f.ticks,0,'still waiting before ETA');
model.advance(1);model.tick(f);
assert.equal(f.ticks,1,'front may fight at arrival');
assert.equal(f.pool,40);
assert.equal(f.mobilization03892,undefined);
assert.equal(model.api.waiting(f),0);
model.reinforce(f.id);
assert.equal(model.troops(),150,'reinforcements deducted from reserve once');
assert.equal(f.pool,40,'reinforcements do not teleport into active pool');
assert.equal(model.api.waiting(f),10,'reinforcements pending');
assert.equal(f.initial,50);
model.advance(2);model.tick(f);
assert.equal(f.pool,40,'reinforcements not available early');
assert.equal(f.ticks,2,'existing troops keep fighting while reinforcement travels');
model.advance(2);model.tick(f);
assert.equal(f.pool,50,'reinforcements arrive after delay');
assert.equal(model.api.waiting(f),0);
assert.equal(model.api.status()[0].inTransit,0);

// Cancel a forming front: refund troops still in transit, no double counting.
const before=model.troops();
const f2=model.from(3,5);
assert.equal(model.troops(),before-30);
assert.equal(f2.pool,0);
assert.equal(model.api.waiting(f2),30);
model.reinforce(f2.id);
assert.equal(model.api.waiting(f2),40);
const saved=model.export();
assert.equal(saved.payload.main.activeFronts.find(x=>x.id===f2.id).mobilization03892.troops,30);
assert.equal(saved.payload.main.activeFronts.find(x=>x.id===f2.id).reinforcements03892[0].troops,10);
assert.equal(model.save(),true);
const roundTrip=JSON.stringify(model.status());
model.load();
assert.equal(JSON.stringify(model.status()),roundTrip,'browser reload preserves order and campaign time');
model.import(saved);
assert.equal(JSON.stringify(model.status()),roundTrip,'portable import preserves mobilization ETA');
const restored=model.fronts().find(x=>x.id===f2.id);
model.finish(restored,1);
assert.equal(model.troops(),before,'cancel refunded all yet-to-arrive troops');
assert.ok(!model.fronts().includes(restored),'cancel removed the front');

// Lost combat while aid is on its way: arrival stays safe and must refund.
const f3=model.front(4);
model.advance(4);model.tick(f3);
model.reinforce(f3.id);
const prior=model.troops();
f3.pool=0;
model.finish(f3,0);
assert.equal(model.troops(),prior+10,'in-transit soldiers survive front collapse');
// A direct naval landing has already traveled; do not add a second delay.
const navy=model.front(4,17,'beach');
assert.equal(navy.pool,17);
assert.equal(navy.mobilization03892,undefined);
const old={id:999,kind:'war',pool:11,initial:11,ticks:0};
model.tick(old);
assert.equal(old.ticks,1,'legacy active fronts have no retroactive waiting time');
assert.ok(trace.some(x=>x.includes('movilización')));
console.log('HEXATEGOS 0.38.92: delayed fronts, land routes/roads, reinforcements, cancelled orders, older saves, HXZ2, naval bypass PASS');
