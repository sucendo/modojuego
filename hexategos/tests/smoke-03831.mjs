import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../js/prospection-03831.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.doesNotThrow(()=>new Function(source));
assert.ok(html.indexOf('js/prospection-03831.js')>html.indexOf('js/geology-03830.js'));
assert.ok(!source.includes('setInterval('),'prospection must use common scheduler');
assert.ok(!source.includes('Math.random('),'results must not be re-rolled');
const owner=[0,0,0,0,0,1,1,0];
let money=400,saves=0,persists=0,campaign=0,events=[],registration=null;
const bots=[0,400];
const win={
  HexategosWorldCore03828:{
    register:spec=>registration=spec,
    emit:(kind,data)=>events.push({kind,data}),
    persist:()=>{persists++;return true}
  },
  HexategosGeology03830:{
    kinds:()=>['iron','copper','oil'],
    deposit:(cell,kind)=>({quality:kind==='oil'?0:cell===4?1.9:.7})
  },
  HexategosNaturalPotential03829:{
    category:x=>x===0?'Inexistente':x>=1.5?'Excepcional':'Medio'
  }
};
const boot=new Function('window','owner6','botGold3230','activeFactionCount3230',
  'terrainKey3250','saveGame3212',
  'console',source+
  '\nreturn {api:window.HexategosProspection03831,step:(time)=>{campaignSeconds3230=time;registration.tick()},'+
  'state:()=>registration.snapshot(),restore:(s)=>registration.restore(s),'+
  'gold:()=>gold3212};');
const run=new Function('window','owner6','botGold3230','activeFactionCount3230',
  'terrainKey3250','saveGame3212','console',
  'let gold3212=400,campaignSeconds3230=0;'+source+
  '\nreturn {api:window.HexategosProspection03831,step:(time)=>{campaignSeconds3230=time;registration.tick()},'+
  'state:()=>registration.snapshot(),restore:(s)=>registration.restore(s),'+
  'gold:()=>gold3212};');
const world=run(win,owner,bots,2,cell=>cell===7?'sea':'plain',()=>saves++,console);
assert.equal(world.api.status(4).state,'unexplored');
assert.equal(world.api.result(4),null,'exact deposits must remain hidden before study');
assert.equal(world.api.begin(0,5).ok,false,'player cannot prospect foreign land');
assert.equal(world.api.begin(0,7).ok,false,'no terrestrial mining survey over sea');
assert.equal(world.api.begin(0,4).ok,true);
assert.equal(world.gold(),335,'player pays the real survey cost');
assert.equal(saves,1,'player study action saves the active game');
assert.equal(world.api.status(4).state,'pending');
assert.equal(world.api.result(4),null,'survey must not reveal deposits prematurely');
world.step(47);
assert.equal(world.api.status(4).state,'pending');
world.step(48);
assert.equal(world.api.status(4).state,'completed');
assert.deepEqual(world.api.result(4),
  {iron:'Excepcional',copper:'Excepcional',oil:'Inexistente'});
assert.equal(events.filter(x=>x.kind==='resourceDiscovered').length,1);
assert.equal(world.api.begin(0,4).ok,false,'do not pay twice for completed survey');
const previous=world.state();
owner[4]=1;
assert.equal(world.api.status(4).state,'completed','conquest must not erase geology knowledge');
assert.equal(world.api.result(4).iron,'Excepcional');
world.restore(null);
assert.equal(world.api.status(4).state,'unexplored');
world.restore(previous);
assert.equal(world.api.status(4).state,'completed','browser/portable snapshots keep discoveries');
assert.equal(world.api.result(4).iron,'Excepcional');
assert.equal(world.api.begin(1,5).ok,true,'AI has same prospecting action and cost');
assert.equal(bots[1],335,'AI pays for surveys too');
world.step(100);
assert.equal(world.api.status(5).state,'pending');
world.step(101);
assert.equal(world.api.status(5).state,'completed');
assert.ok(persists>=2,'completed surveys must persist in common registry');
assert.equal(world.state().known.length,2);
console.log('HEXATEGOS 0.38.31: hidden deposits, timed player/AI prospecting, costs, conquest, persistence and events PASS');
