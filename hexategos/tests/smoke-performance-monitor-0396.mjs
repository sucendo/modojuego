/* Test contractual del observador C4: sin navegador ni motor real. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync(new URL('../js/performance-monitor-0396.js',import.meta.url),'utf8');
assert.equal(src.includes('setInterval('),false,'El monitor no crea timers de simulación');
assert.equal(src.includes('setTimeout('),false,'El monitor no crea timers de simulación');

let now=100;
let domAppends=0,storageWrites=0;
const elements=[];
const fakeElement=()=>({
  className:'',id:'',type:'',textContent:'',innerHTML:'',
  addEventListener(){},append(...x){elements.push(...x)},appendChild(){domAppends++},
  querySelector(){return null},setAttribute(){},style:{}
});
const host={querySelector:()=>null,appendChild:()=>{domAppends++}};
const context={
  console:{info(){},warn(){}},
  performance:{now:()=>now},
  Date,
  document:{
    getElementById:id=>id==='sysContent3213'?host:null,
    createElement:()=>fakeElement(),
    body:{appendChild(){domAppends++}}
  },
  localStorage:{setItem(){storageWrites++}},
  sysTab3220:'dip',
  renderSystems3220(){return 'render-ok'},
  aiTick3212(v){
    now+=4;
    if(v==='throw')throw new Error('original-error');
    return 'ai:'+v;
  },
  economyTick3212(v){now+=5;return 'economy:'+v},
  activeFactionCount3230:150,
  started3230:true,
  paused3230:false,
  campaignSeconds3230:12,
  owner6:new Int16Array(13),
  cities3212:new Set([1,2]),
  roadEdgeSet3212:new Set([3]),
  HexategosNationAI0360:{stats:()=>({scheduler:{lastTickMs:2,lastSnapshotMs:1,deferred:0}})},
  HexategosStability0342:{stats:()=>({performance:{renderAvg:8,renderMax:12}})},
  HexategosWorldCore03828:{diagnostics:()=>({lastTick:{elapsedMs:0.5}})},
  HexategosDiag033:{lastTimerDrift:2}
};
context.window=context;
vm.createContext(context);
vm.runInContext(src,context,{filename:'performance-monitor-0396.js'});
const api=context.HexategosPerformanceMonitor0396;
assert(api&&api.wrapped.ai&&api.wrapped.economy,'Engancha los dos ticks existentes');
assert.equal(context.aiTick3212(1),'ai:1');
assert.equal(context.renderSystems3220(),'render-ok');
assert.equal(domAppends,0,'No monta interfaz fuera de Opciones');
context.sysTab3220='settings';
assert.equal(context.renderSystems3220(),'render-ok');
assert.equal(domAppends,1,'Añade un bloque en Opciones');
assert.equal(api.snapshot().heapMB,null,'Memoria no disponible debe ser N/D');
assert.equal(api.report().durationMs,0,'Sin captura la duración es cero');
api.start();
assert.throws(()=>context.aiTick3212('throw'),/original-error/,'Propaga excepciones originales');
assert.equal(context.aiTick3212(2),'ai:2');
now+=1001;
assert.equal(context.economyTick3212(3),'economy:3');
assert.equal(api.sampleCount,1,'Muestra pasiva tras tick económico');
const row=api.report().samples[0];
assert.equal(row.nations,150);
assert.equal(row.cells,13);
assert.equal(row.aiCalls,2);
assert.equal(row.economyCalls,1);
assert(row.aiCpuMs>=8&&row.economyCpuMs>=5);
assert.equal(row.heapMB,null);
assert.equal(api.stop(),1);
assert.equal(api.report().schema,'hexategos-performance-c4-v1');
assert.equal(storageWrites,0,'No escribe guardados ni localStorage');
console.log('PASS monitor C4: integración, medición, excepciones, cero timers, N/D y sin persistencia');
