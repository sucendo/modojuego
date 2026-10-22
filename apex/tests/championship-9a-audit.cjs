/* APEX 9A.4 — independent tests for native championship data.
 * No synthetic points are allowed to alter the persisted native save.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const file=path.join(__dirname,'..','js','championship-9a.js');
const context={localStorage:{getItem:()=>null}};
context.window=context;
vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const view=context.ApexChampionship9A;
assert.ok(view);
const save={
 schema:4,round:7,points:{PLAYER:65,DRIVER2:92,DRIVER3:17},
 seasonTeam:'sucendo-a',
 seasonHistory9A:[
  {round:5,circuitId:'monaco',source:'race',classification:[
   {driverId:'DRIVER2',name:'Rival dos',teamId:'equipo-b'},
   {driverId:'PLAYER',name:'TÚ',teamId:'sucendo-a'}
  ]},
  {round:6,circuitId:'madrid',source:'simulated',classification:[
   {driverId:'PLAYER',name:'TÚ',teamId:'sucendo-a'},
   {driverId:'DRIVER3',name:'Rival tres',teamId:'equipo-c'}
  ]}
 ]
};
const before=JSON.stringify(save);
const native={
 seasonDriverStandings:()=>[
  {uid:'PLAYER',name:'TÚ',team:'sucendo-a',p:65},
  {uid:'DRIVER2',name:'Rival dos',team:'equipo-b',p:92},
  {uid:'DRIVER3',name:'Rival tres',team:'equipo-c',p:17}
 ],
 seasonConstructorStandings:()=>[
  {team:'equipo-b',name:'Escudería B',points:120},
  {team:'sucendo-a',name:'Escudería A',points:73}
 ]
};
const result=view.snapshot(save,native);
assert.equal(result.round,7);
assert.equal(result.totalRounds,23);
assert.equal(result.drivers.length,3);
assert.equal(result.drivers[0].name,'Rival dos');
assert.equal(result.drivers[0].points,92);
assert.equal(result.teams[0].points,120);
assert.equal(result.teamsAvailable,true);
assert.equal(result.recent[0].round,7);
assert.equal(result.recent[0].winner,'TÚ');
assert.equal(result.recent[0].playerPosition,1);
assert.equal(result.recent[0].kind,'Simulado');
assert.equal(result.recent[1].playerPosition,2);
assert.equal(JSON.stringify(save),before,'Standings may not modify native save');
const legacy=view.snapshot({schema:4,round:2,points:{PLAYER:12,DRIVER2:18}}, {});
assert.equal(legacy.drivers[0].name,'DRIVER2');
assert.equal(legacy.drivers[0].points,18);
assert.equal(legacy.teamsAvailable,false,'Do not manufacture team points without a native roster');
assert.equal(legacy.historicDetailAvailable,false);
assert.equal(legacy.round,2);
const malformed=view.snapshot({schema:4,round:900,points:{PLAYER:-10,OTHER:'bad'},seasonHistory9A:[null]},{
 seasonDriverStandings:()=>{throw Error('unavailable');},
 seasonConstructorStandings:()=>null
});
assert.equal(malformed.round,23);
assert.equal(malformed.drivers.find(x=>x.id==='PLAYER').points,0);
assert.equal(malformed.teamsAvailable,false);
const boot=fs.readFileSync(path.join(__dirname,'..','apex.html'),'utf8');
assert.match(boot,/js\/championship-9a\.js/);
assert.ok(boot.indexOf('js/championship-9a.js')<boot.indexOf('js/competition-flows-9a.js'),
 'native standings must load before competition panels');
const flow=fs.readFileSync(path.join(__dirname,'..','js','competition-flows-9a.js'),'utf8');
assert.match(flow,/ApexChampionship9A\?\.read/);
assert.match(flow,/CAMPEONATO DE CONSTRUCTORES/);
assert.match(flow,/HISTORIAL DE GRANDES PREMIOS/);
assert.doesNotMatch(fs.readFileSync(file,'utf8'),/localStorage\.setItem|save\.points\[.*\]\s*[+]?=/);
console.log('APEX 9A.4 native driver/constructor standings and history: PASS');
