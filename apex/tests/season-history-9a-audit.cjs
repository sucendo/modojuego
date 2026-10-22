/* APEX 9A.7 — history comes from verified native season results, not synthetic rounds. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const file=path.join(__dirname,'..','js','competition-flows-9a.js');
const source=fs.readFileSync(file,'utf8');
const start=source.indexOf('function seasonMarkup(){');
const end=source.indexOf('\nfunction build(){',start);
assert.ok(start>=0&&end>start,'Native season markup must be extractable for safety tests');
const native={
 schema:1,round:3,drivers:[{driverId:'PLAYER',name:'TÚ',points:43}],
 constructors:[{teamId:'a',name:'Escudería A',points:58}],
 history:[{round:1,circuitId:'<svg onload=alert(1)>',source:'simulated',classification:[
   {driverId:'R1',name:'Rival uno'},{driverId:'PLAYER',name:'TÚ'}
 ]}]
};
const save={schema:4,round:3,points:{PLAYER:43}};
const context={
 saved:()=>save,nativeSnapshot:()=>native,seasonRound:()=>3,
 classification:()=>[], $:()=>({textContent:'Temporada en curso'})
};
vm.runInNewContext(source.slice(start,end)+'\nresult=seasonMarkup();',context,{filename:'seasonMarkup'});
assert.match(context.result,/CAMPEONATO NATIVO/);
assert.match(context.result,/CONSTRUCTORES/);
assert.match(context.result,/HISTORIAL DE GRANDES PREMIOS/);
assert.match(context.result,/R2/);
assert.match(context.result,/P2/);
assert.match(context.result,/Simulado/);
assert.match(context.result,/&lt;svg onload=alert\(1\)&gt;/);
assert.doesNotMatch(context.result,/<svg onload/);
assert.equal(save.round,3,'Rendering must not change native rounds');
assert.equal(save.points.PLAYER,43,'Rendering must not grant points');
native.history=[];
vm.runInNewContext('result=seasonMarkup()',context);
assert.match(context.result,/no contiene carreras con historial detallado/);
assert.doesNotMatch(context.result,/<details class="apex9aSeasonHistory">/);
console.log('APEX 9A.4 native history, legacy saves and escaping: PASS');
