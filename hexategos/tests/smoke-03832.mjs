import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../js/agronomy-03832.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.doesNotThrow(()=>new Function(src));
assert.ok(index.indexOf('js/agronomy-03832.js')>index.indexOf('js/prospection-03831.js'));
assert.ok(!src.includes('setInterval('));
const owners=[0,0,0,1,0,0],bots=[0,500];
let spec=null,saves=0,persisted=0,events=[];
const win={
 HexategosWorldCore03828:{
   register:x=>{spec=x;win.spec=x},
   emit:(event,data)=>events.push({event,data}),
   persist:()=>{persisted++;return true}
 },
 HexategosNaturalPotential03829:{
   profile:cell=>({food:cell===1?1.8:.15,livestock:cell===1?.31:1.6,forest:cell===1?0:1.3}),
   category:n=>n<=.02?'Inexistente':n<.38?'Muy bajo':n<.70?'Bajo':n<1.12?'Medio':n<1.62?'Alto':'Excepcional'
 }
};
const run=new Function('window','owner6','botGold3230','activeFactionCount3230','terrainKey3250','saveGame3212',
  'let gold3212=200,campaignSeconds3230=0;\n'+src+
  '\nreturn {api:window.HexategosAgronomy03832,step:t=>{campaignSeconds3230=t;window.spec.tick()},'+
  'snapshot:()=>window.spec.snapshot(),restore:x=>window.spec.restore(x),gold:()=>gold3212};');
const game=run(win,owners,bots,2,cell=>cell===5?'sea':'plain',()=>saves++);
assert.equal(game.api.result(1),null,'fertility must be hidden until evaluated');
assert.equal(game.api.begin(0,3).ok,false,'player cannot survey foreign territory');
assert.equal(game.api.begin(0,5).ok,false,'marine cell rejected');
assert.equal(game.api.begin(0,1).ok,true);
assert.equal(game.gold(),178);
assert.equal(saves,1,'player evaluation must save');
assert.equal(game.api.status(1).state,'pending');
game.step(15);
assert.equal(game.api.result(1),null);
game.step(16);
assert.deepEqual(game.api.result(1),{farming:'Excepcional',livestock:'Muy bajo',forest:'Inexistente'});
assert.equal(game.api.begin(0,1).ok,false,'one evaluation per territory');
const snapshot=game.snapshot();owners[1]=1;
assert.equal(game.api.status(1).state,'completed','conquest cannot erase agronomy knowledge');
game.restore(null);
assert.equal(game.api.result(1),null);
game.restore(snapshot);
assert.equal(game.api.result(1).farming,'Excepcional','browser/portable snapshot restores evaluation');
assert.equal(game.api.begin(1,3).ok,true,'AI uses the same action');
assert.equal(bots[1],478,'AI pays same cost');
game.step(32);
assert.equal(game.api.status(3).state,'completed');
assert.equal(events.filter(x=>x.event==='agronomyEvaluated').length,2);
assert.ok(persisted>=2);
assert.deepEqual(game.snapshot().known.sort((a,b)=>a-b),[1,3]);
console.log('HEXATEGOS 0.38.32: agricultural/pasture separation, timed player/AI evaluation, conquest and persistence PASS');
