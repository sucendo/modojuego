/* Production force/steering blocks executed in an isolated VM: flat asphalt, no
   collisions, damage, aero boost or terrain resistance. NOT a circuit/browser test.
   node apex/tests/driving-audit.cjs [--json]
   Baseline: v0.13.22 main. All comparisons use production source, not copied forces. */
const fs=require('fs'),vm=require('vm'),path=require('path');const cp=require('node:child_process'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../..');
const source=Array.from({length:28},(_,i)=>fs.readFileSync(path.join(root,`apex/parts/part-${String(i).padStart(3,'0')}.txt`),'utf8')).join('');
function func(src,n){const start=src.indexOf(`function ${n}(`);for(let end=src.indexOf('}',start);end>=0;end=src.indexOf('}',end+1)){const code=src.slice(start,end+1);try{new vm.Script(`(${code})`);return code;}catch{}}throw Error(n);}
function make(src){const start=src.indexOf(' const M=800,WB=3.60'),end=src.indexOf(' // Integración mundial autónoma',start),body=src.slice(start,end);
const c=vm.createContext({pitTakeover:false,console,Math,Number,dt:.01,player:null,driveProfile:{id:'raw',tc:false,abs:false,stability:false},ps:{kind:'ASPHALT',grip:1,steerGrip:1,driveGrip:1},env:{wall:false},boost:false,apexControls:{brakeBias:.57,engineBrake:2},out:{},apexLateralStepScratch:new Float64Array(2),
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t,finite:(v,d=0)=>Number.isFinite(v)?v:d,finiteClamp:(v,a,b,d=0)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:d)),
 damageFactors:()=>({aero:1,frontAero:1,rearAero:1,frontGrip:1,rearGrip:1,steerBias:0,engine:1}),apexWeatherIsWet:()=>false,apexManualDriveFactor:()=>1,apexPitSpeedLimitKph:()=>80,terrainDragAccel:()=>0});
vm.runInContext(['carAxes','staticSafeFront','staticSafeRear','apexTyreLateralCapacity','apexEngineBrakeForce','apexSolveLateralIncrement','apexPitLimitedVmax'].filter(n=>src.includes(`function ${n}(`)).map(n=>func(src,n)).join('\n')+`\nfunction step(dt){const beforeX=player.vx,beforeZ=player.vz,axes=carAxes();let u=player.vx*axes.fx+player.vz*axes.fz,v=player.vx*axes.rx+player.vz*axes.rz,r=player.yawRate,sp=Math.hypot(u,v);\n${body}\nplayer.speed=Math.hypot(player.vx,player.vz);player.x+=player.vx*dt;player.z+=player.vz*dt;const ax=carAxes();player.longG=((player.vx-beforeX)*ax.fx+(player.vz-beforeZ)*ax.fz)/(dt*9.81);out.frontCombined=Math.hypot(FxF/maxLongF,tireF/maxLatF);out.rearCombined=Math.hypot(FxR/maxLongR,tireR/maxLatR);out.FyF=FyF;out.FxF=FxF;out.delta=delta;return out;}`,c);
 c.reset=(speed=0,v=0,r=0,steer=0,brake=0,throttle=0)=>c.player={x:0,z:0,heading:0,speed:Math.hypot(v,speed),vx:v,vz:speed,yawRate:r,steer,throttle,brakeInput:brake,longG:0,reverse:false,pitLimiter:false,drs:false,slipstream:false};return c;}
const ref='8e71e2d0dba93cf4b6efbb97aba546f36278be6d';
const baseline=[26,27].map(i=>cp.execFileSync('git',['show',`${ref}:apex/parts/part-${String(i).padStart(3,'0')}.txt`],{cwd:root,encoding:'utf8',maxBuffer:20000000})).join('');
const old=make(baseline),now=make(source),checks=[];
function test(name,run){run();checks.push(name);}
function state(c){return ['x','z','heading','vx','vz','yawRate'].map(k=>c.player[k]);}
function run(c,{speed=0,lateral=0,yaw=0,steer=0,brake=0,throttle=0,ticks=500,dt=.01,control}={}){
 c.reset(speed,lateral,yaw,steer,brake,throttle);let changes=0,last=0,peakYaw=0,peakUse=0,energyRise=0,energy=400*(speed*speed+lateral*lateral)+540*yaw*yaw;
 for(let i=0;i<ticks;i++){
  if(control)control(c.player,i);c.step(dt);const p=c.player,s=Math.abs(p.yawRate)>1e-7?Math.sign(p.yawRate):0;
  if(s&&last&&s!==last)changes++;if(s)last=s;
  peakYaw=Math.max(peakYaw,Math.abs(p.yawRate));peakUse=Math.max(peakUse,c.out.frontCombined,c.out.rearCombined);
  const e=400*(p.vx*p.vx+p.vz*p.vz)+540*p.yawRate*p.yawRate;energyRise=Math.max(energyRise,e-energy);energy=e;
  assert.ok(state(c).every(Number.isFinite));assert.ok(p.speed<=125&&Math.abs(p.yawRate)<=2.7);
 }
 return {state:state(c),speed:c.player.speed,yaw:c.player.yawRate,signChanges:changes,peakYaw,peakCombinedUse:peakUse,maxStepEnergyRiseJ:energyRise};
}
const metrics={};
test('Reposo sin deriva ni giro; freno motor no cruza cero',()=>{
 metrics.rest={before:run(old,{ticks:200}),after:run(now,{ticks:200})};assert.deepEqual(metrics.rest.after.state,[0,0,0,0,0,0]);
 for(const u of [-.001,.001,-2,2]){now.reset(u);now.step(.01);assert.ok(now.player.vz*u>=-1e-15);}
});
test('Baja velocidad: desaparece la alternancia de guiñada de Euler explícito',()=>{
 metrics.lowSpeed={before:run(old,{speed:2,steer:.3}),after:run(now,{speed:2,steer:.3})};
 assert.ok(metrics.lowSpeed.before.signChanges>400);assert.equal(metrics.lowSpeed.after.signChanges,0);assert.ok(metrics.lowSpeed.after.peakYaw<.06);
});
test('Alta velocidad: respuesta sin freno idéntica al modelo anterior',()=>{
 metrics.highSpeed=[20,70].map(speed=>{const args={speed,steer:.3},before=run(old,args),after=run(now,args);assert.deepEqual(after.state,before.state);return {initialMps:speed,before,after};});
});
test('Elipse longitudinal/lateral: barrido de demanda, agarre, reparto y carga',()=>{
 let prevPeak=0,newPeak=0,cases=0;
 for(const grip of [.2,.55,1])for(const speed of [2,10,30,70])for(const lateral of [-25,0,25])for(const brake of [0,.5,1])for(const throttle of [0,1]){
  for(const c of [old,now]){c.ps.grip=c.ps.steerGrip=c.ps.driveGrip=grip;c.reset(speed,lateral,.2,.6,brake,throttle);c.player.longG=brake?-2:1;c.step(.01);}
  prevPeak=Math.max(prevPeak,old.out.frontCombined,old.out.rearCombined);newPeak=Math.max(newPeak,now.out.frontCombined,now.out.rearCombined);cases++;
 }
 for(const c of [old,now])c.ps.grip=c.ps.steerGrip=c.ps.driveGrip=1;
 metrics.friction={cases,beforePeak:prevPeak,afterPeak:newPeak};assert.ok(prevPeak>1.02);assert.ok(newPeak<=1+1e-12);
});
function stop(c,brake,steer=0,assisted=false){
 c.driveProfile={id:assisted?'assisted':'raw',tc:assisted,abs:assisted,stability:assisted};c.reset(70,0,0,steer,brake,0);
 let distance=0,ticks=0,lock=false,abs=false;
 while(c.player.speed>.5&&ticks<3000){const x=c.player.x,z=c.player.z;c.step(.01);distance+=Math.hypot(c.player.x-x,c.player.z-z);lock||=c.player.lockF||c.player.lockR;abs||=c.player.absAssist;ticks++;}
 assert.ok(ticks<3000);assert.ok(state(c).every(Number.isFinite));return {distanceM:distance,seconds:ticks/100,lock,abs,lateralM:c.player.x};
}
test('Frenada intensa/parcial/en curva y ABS: parada finita, control recuperable',()=>{
 metrics.braking={before:stop(old,1),after:stop(now,1),partial:stop(now,.5),corner:stop(now,1,.25),assisted:stop(now,1,0,true)};
 now.ps.driveGrip=.35;metrics.braking.lowGrip=stop(now,1);metrics.braking.lowGripAssisted=stop(now,1,0,true);now.ps.driveGrip=1;assert.ok(metrics.braking.lowGrip.lock);assert.ok(metrics.braking.lowGripAssisted.abs);assert.ok(metrics.braking.partial.distanceM>metrics.braking.after.distanceM);assert.equal(metrics.braking.after.lateralM,0);
 now.player.brakeInput=0;now.player.throttle=.4;now.step(.01);assert.equal(now.player.lockF,false);assert.equal(now.player.lockR,false);
 now.driveProfile={id:'raw',tc:false,abs:false,stability:false};
});
test('Tracción: arranque, curva lenta, TC diferenciado y liberación del pedal',()=>{
 metrics.traction={straight:run(now,{throttle:1}),corner:run(now,{throttle:1,steer:.3})};assert.ok(metrics.traction.straight.speed>metrics.traction.corner.speed);assert.equal(metrics.traction.corner.signChanges,0);
 now.ps.driveGrip=.3;const aids=[];
 for(const tc of [false,true]){now.driveProfile={id:tc?'assisted':'raw',tc,abs:tc,stability:tc};now.reset(4,0,0,.5,0,1);now.step(.01);aids.push({tc:now.player.tcAssist,spin:now.player.wheelspin,force:now.out.rearCombined});}
 assert.equal(aids[0].tc,false);assert.equal(aids[1].tc,true);metrics.traction.aids=aids;
 now.player.throttle=0;now.step(.01);assert.equal(now.player.tcAssist,false);assert.equal(now.player.wheelspin,false);now.ps.driveGrip=1;now.driveProfile={id:'raw',tc:false,abs:false,stability:false};
});
test('Simetría izquierda/derecha, contravolante y cambios de dirección',()=>{
 for(const speed of [2,6,20,70]){
  const left=run(now,{speed,steer:-.3,throttle:.1}),right=run(now,{speed,steer:.3,throttle:.1});
  for(const i of [0,2,3,5])assert.ok(Math.abs(left.state[i]+right.state[i])<1e-9);for(const i of [1,4])assert.ok(Math.abs(left.state[i]-right.state[i])<1e-9);
 }
 metrics.slalom=run(now,{speed:30,throttle:.2,ticks:800,control:(p,i)=>{p.steer=.25*Math.sin(i*.012);}});
 now.reset(25,4,.5,-.3,0,0);let first=Math.abs(now.player.yawRate);for(let i=0;i<100;i++)now.step(.01);assert.ok(Math.abs(now.player.yawRate)<first);
});
test('Energía pasiva y estados finitos, marcha atrás y agarres bajos',()=>{
 metrics.passive=[];for(const speed of [0,2,6,20,70]){const m=run(now,{speed,lateral:speed*.05,steer:0});assert.ok(m.maxStepEnergyRiseJ<1e-5);metrics.passive.push({initialMps:speed,...m});}
 let seed=7;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 for(let j=0;j<100;j++){now.reset(random()*80,random()*16-8,random()-.5,random()*2-1,random(),random());now.player.reverse=j%4===0;now.ps.steerGrip=now.ps.driveGrip=.1+random();for(let i=0;i<100;i++)now.step(.01);assert.ok(state(now).every(Number.isFinite));}
 now.ps.steerGrip=now.ps.driveGrip=1;
});
test('Scheduler real agrupado a 15/30/60/144 FPS: reproducibilidad y límite tras pausa',()=>{
 const results=[15,30,60,144].map(fps=>{
  now.reset(25);let tick=0;
  const c=vm.createContext({pitTakeover:false,Math,performance,mode:'race',player:now.player,last:0,clamp:now.clamp,lerp:now.lerp,telemetryPerf:{},apexRuntimePerf:{physicsClampedMs:0},
   requestAnimationFrame(){},activeRenderer:{renderFrame(){}},apexRuntimePerfRecord(){},apexDrivePerfObserve(){},
   update(dt){assert.equal(dt,.01);now.player.steer=.2*Math.sin(tick*.01);now.player.throttle=.3;now.player.brakeInput=tick>400&&tick<470?.5:0;now.step(dt);tick++;}});
  const constants=source.slice(source.indexOf('const APEX_PLAYER_PHYSICS_HZ='),source.indexOf('function loop(t)'));
  vm.runInContext(constants+func(source,'loop'),c);
  for(let frame=1;frame<=fps*8;frame++)c.loop(frame*1000/fps);
  assert.equal(tick,800);const result=state(now);const before=tick;c.loop(9000);assert.equal(tick-before,12);assert.ok(c.apexRuntimePerf.physicsClampedMs>=879.99);
  return result;
 });
 for(const s of results)assert.deepEqual(s,results[0]);metrics.frameGrouping={fps:[15,30,60,144],ticks:800,identical:true,productionLoop:true,stallCatchupSteps:12};
});
function controls(){
 const element={classList:{add(){},remove(){}},setPointerCapture(){}};
 const c=vm.createContext({pitTakeover:false,Math,Number,player:{steer:0,speed:0},keys:{},apexControls:{driveProfile:'assisted'},apexInputDevice:'keyboard',mobilePerformanceMode:()=>false,clamp:now.clamp,lerp:now.lerp,
  demoMode:false,assistRecovery:false,autoCtl:null,inputSpeed:0,left:false,right:false,gamepadActive:false,gyroFresh:false,gamepad:{steer:0},gyro:{steer:0},$:()=>element,setAutoDriveMode(){}});
 const profiles=source.slice(source.indexOf('const apexDriveProfiles='),source.indexOf("let apexInputDevice='keyboard'"));
 const start=source.indexOf(' let steer=(demoMode||pitTakeover)?'),end=source.indexOf(' let throttleTarget,brakeTarget',start);
 assert.ok(start>=0&&end>start);
 vm.runInContext(profiles+['apexDriveProfile','apexDriveSteeringConfig','apexSteeringInputDevice','bt'].map(n=>func(source,n)).join('\n')+`\nfunction tick(dt){${source.slice(start,end)}}`,c);
 return {c,element};
}
test('Controles reales: digital/analógico, centrado, corrección pequeña y selección de dispositivo',()=>{
 const {c,element}=controls();const rows=[];
 for(const profile of ['assisted','simulation','raw'])for(const device of ['keyboard','touch','gamepad','gyro']){
  c.apexControls.driveProfile=profile;c.keys={};c.player={steer:0,speed:30};c.inputSpeed=30;c.apexInputDevice=device;
  c.left=false;c.right=device==='keyboard'||device==='touch';c.gamepadActive=device==='gamepad';c.gyroFresh=device==='gyro';c.gamepad.steer=c.gyro.steer=.15;if(device==='touch')c.keys.right=true;
  const cfg=c.apexDriveSteeringConfig((108-65)/200,device);
  c.tick(.01);assert.ok(c.player.steer>0&&c.player.steer<=cfg.rise*.01+1e-12);
  for(let i=0;i<100;i++)c.tick(.01);const max=c.player.steer;assert.ok(max<=cfg.authority+1e-12);
  if(device==='gamepad'||device==='gyro')assert.ok(Math.abs(max-.15*cfg.authority)<1e-12);
  c.right=false;c.keys={};c.gamepad.steer=c.gyro.steer=0;for(let i=0;i<100;i++)c.tick(.01);assert.equal(c.player.steer,0);rows.push({profile,device,steadySteer:max,centered:true});
 }
 c.apexControls.driveProfile='assisted';c.player.steer=0;c.right=true;c.gamepadActive=true;c.gyroFresh=true;c.keys={};c.tick(.01);assert.equal(c.player.steerDevice,'keyboard');
 c.keys.right=true;c.tick(.01);assert.equal(c.player.steerDevice,'touch');
 c.player.steer=0;c.bt('right','right');element.onpointerdown({preventDefault(){},pointerId:1});assert.equal(c.player.steer,0);assert.equal(c.keys.right,true);element.onpointercancel({preventDefault(){}});assert.equal(c.keys.right,false);
 metrics.controls=rows;
});
test('Pedales reales: progresión, suelta y perfiles sin cambios de transmisión/ERS',()=>{
 const start=source.indexOf(' let throttleTarget,brakeTarget'),end=source.indexOf(' const prevVx=player.vx',start);
 const c=vm.createContext({pitTakeover:false,Math,player:{throttle:0,brakeInput:0,steer:.3},autoSpeedControl:false,autoCtl:null,gasKey:true,brKey:false,analogGas:0,analogBrake:0,gyroFresh:false,gamepadActive:false,driveProfile:{id:'assisted'},clamp:now.clamp,lerp:now.lerp});
 vm.runInContext(`function tick(dt){${source.slice(start,end)}}`,c);
 for(const profile of ['assisted','simulation','raw'])for(const analog of [false,true]){
  c.driveProfile.id=profile;c.gyroFresh=analog;c.player.throttle=c.player.brakeInput=0;c.gasKey=!analog;c.analogGas=analog?.4:0;c.brKey=false;c.analogBrake=0;c.tick(.01);assert.ok(c.player.throttle>0&&c.player.throttle<.1);
  for(let i=0;i<200;i++)c.tick(.01);assert.ok(Math.abs(c.player.throttle-(analog?.4:1))<1e-4);
  c.gasKey=false;c.analogGas=0;c.brKey=!analog;c.analogBrake=analog?.6:0;for(let i=0;i<200;i++)c.tick(.01);assert.ok(c.player.throttle<1e-8);assert.ok(Math.abs(c.player.brakeInput-(analog?.6:1))<1e-4);
  c.brKey=false;c.analogBrake=0;for(let i=0;i<200;i++)c.tick(.01);assert.ok(c.player.brakeInput<1e-8);
 }
});
test('Scheduler, perfiles, cámaras, suelo y colisiones conservados; IA sólo adapta agarre',()=>{
 for(const name of ['loop','apexDriveSteeringConfig','apexDriveProfile','playerSurfaceState','snapshotPhysics','recoverPhysics'])assert.equal(func(source,name),func(baseline,name),name);
 assert.equal(func(source,'applyRivalNearDynamics').replace('mu=1.86*apexTyreGripScale(rv)','mu=wet?1.24:1.84'),func(baseline,'applyRivalNearDynamics'));
 const from=' // Integración mundial autónoma',to=' // Telemetría de dinámica.';
 assert.equal(source.slice(source.indexOf(from),source.indexOf(to))
  // Auditoría de integridad física: sólo se ignora el registro pasivo de contactos.
  .replace(' // No dependemos de FULL/EVENTS para saber si hubo contactos (incluye límite SVG).\\n','')
  .replace(' if(wallHitThisFrame)apexRecordPlayerBarrierContact("WALL");\\n','')
  .replace(' if(drivableBoundaryHitThisFrame)apexRecordPlayerBarrierContact("BOUNDARY");\\n','')
  .replace('player.lastDrivableBoundaryHit=raceT;','')
  .replaceAll('apexPlayerDriveBoundaryContains','apexDrivableAreaContains')
  .replace(/ apexTyreStep\(player,[^\n]+\n/,''),baseline.slice(baseline.indexOf(from),baseline.indexOf(to)));
 assert.ok(source.includes('APEX_PLAYER_PHYSICS_HZ=100,APEX_PLAYER_PHYSICS_DT=1/APEX_PLAYER_PHYSICS_HZ,APEX_PLAYER_MAX_CATCHUP_STEPS=12'));
});
test('Neumáticos: el estado altera fuerzas reales de frenada y apoyo',()=>{
 const low=make(source),high=make(source);
 for(const c of [low,high])c.reset(55,1,.1,.2,1,0);
 low.player.tyres={gripFront:.65,gripRear:.65};high.player.tyres={gripFront:1.035,gripRear:1.035};
 low.step(.01);high.step(.01);
 assert.ok(Math.abs(high.out.FxF)>Math.abs(low.out.FxF));
 assert.ok(high.player.speed<low.player.speed);
 for(const c of [low,high]){c.reset(55,4,.1,.2,0,0);c.player.tyres={gripFront:c===low?.65:1.035,gripRear:c===low?.65:1.035};c.step(.01)}
 assert.ok(Math.abs(high.out.FyF)>Math.abs(low.out.FyF));
});
function benchmark(c,speed){
 // Each round resets every second to retain the chosen speed region. VM/global
 // lookup overhead included equally. Median of 7 rounds; NOT whole-game timing.
 vm.runInContext(`function bench(){for(let i=0;i<3000;i++){if(i%100===0){player.vx=0;player.vz=${speed};player.heading=0;player.yawRate=0;player.longG=0;}step(.01);}}`,c);
 c.reset(speed,0,0,.15,0,.2);c.bench();const rounds=[];
 for(let i=0;i<7;i++){const t=performance.now();c.bench();rounds.push((performance.now()-t)*1000/3000);}
 rounds.sort((a,b)=>a-b);return {medianUsPerTick:rounds[3],minUsPerTick:rounds[0],maxUsPerTick:rounds[6]};
}
test('Convergencia del integrador con subpasos de referencia',()=>{
 const rows=[.01,.005,.001].map(dt=>run(now,{speed:4,steer:.2,throttle:.2,ticks:Math.round(1/dt),dt}));
 const error=(m)=>Math.hypot(...m.state.map((v,i)=>v-rows[2].state[i]));
 metrics.convergence={dtSeconds:[.01,.005,.001],states:rows.map(m=>m.state),error100Hz:error(rows[0]),error200Hz:error(rows[1])};
 assert.ok(error(rows[1])<error(rows[0]));assert.ok(error(rows[0])<.15);
});
metrics.timing={scope:'NODE_VM_ISOLATED_CORE_NOT_BROWSER_OR_FPS',node:process.version,stepsPerRound:3000,rounds:7,low:{before:benchmark(old,4),after:benchmark(now,4)},high:{before:benchmark(old,60),after:benchmark(now,60)}};
const result={scope:'SYNTHETIC_PRODUCTION_BLOCKS_FLAT_ASPHALT',version:'v0.13.23',baseline:ref,physicsHz:100,checks,metrics,notTested:['Real browser/Android','Circuit driving/feel','DOM input event timing','Actual rAF backlog under stalls','Ground/suspension contact','Race/AI runtime','Save/restore runtime','FPS/render cost']};
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));else{for(const name of checks)console.log('PASS:',name);console.log(JSON.stringify(metrics,null,2));console.log('Isolated driving audit passed. Browser, circuit feel and Android remain separate.');}
