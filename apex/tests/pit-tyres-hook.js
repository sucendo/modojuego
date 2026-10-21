/* Test-only. Circuit/driver fixture is placed once before requesting the stop.
   Thereafter every position comes from production update()/walls/vehicle physics. */
let pitAuditStepping=true;
const pitAuditLoop=loop;
loop=function(t){if(!pitAuditStepping)return pitAuditLoop(t);last=t;requestAnimationFrame(loop)};
window.__apexPitAudit={
 async load(dir,weather='CLEAR',benchmark=false,grid=false){
  pitAuditStepping=true;goMenu();const spec=calendar.find(s=>s.dir===dir);if(!spec)throw Error(dir);
  if(dir==='14-spain'&&!readStoredCustomTrackSvg(dir))await importEditableCircuitSvgText(await(await fetch('circuits/svg/apex26_14-madrid-spain.svg')).text(),spec);
  sessionSettings={diff:1,weather,noRivals:false};currentSession='race';$('gridPos').value='11';
  await startRace(spec,99,'quick',$('start'));if(!player||!trackData)throw Error('Load failed');
  countdown=0;mode='race';paused=false;apexArmRaceGridTiming();apexReleaseInputs();gyro.enabled=false;setAutoDriveMode(1,false);
  if(grid)return {grid:true,rivals:rivals.length,version:APP_VERSION};
  if(benchmark){pitAuditStepping=false;apexRuntimePerfReset();return {benchmark:true,rivals:rivals.length,version:APP_VERSION}}
  const plan=apexPitRoutePlan();if(!plan)return {available:false,reason:'NO_PIT_NETWORK'};
  const box=apexPitBoxForCar(plan,player);if(!box)return {available:false,dir,rivals:rivals.length,reason:plan.serviceIssue?'UNSAFE_PIT_GEOMETRY':'NO_AUTHORED_BOX',issue:plan.serviceIssue};
  const L=trackData.km*1000,s=mod(plan.entryTrackS-55,L),q=poseAt(s);
  player.x=q.x;player.z=q.z;player.heading=Math.atan2(q.tx,q.tz);player.vx=q.tx*14;player.vz=q.tz*14;player.speed=14;player.yawRate=0;
  player.s=s;player.total=0;player.progressOriginS=s;player.progressS=s;player.classificationS=s;player.trackIndex=q.i;player.driveNetwork='TRACK';player.pitIndex=null;player.pitState=null;
  player.lap=2;player.crossedStart=true;player.raceFirstLapPending=false;raceT=50;lapStart=50;apexResetDriverTimingState(player,50);player.lastGood=snapshotPhysics();
  apexTyreInstall(player,'SOFT');player.tyres.front.wear=.75;player.tyres.rear.wear=.7;player.tyres.distance=65000;apexTyreRefreshGrip(player.tyres,apexTyreEnvironment.wetness);
  player.nextTyreCompound='SOFT';player.pitHistory=[];player.pitStops=0;player.tyreSet=1;syncPlayerTrack();updateHud(true);
  return {available:true,version:APP_VERSION,dir,rivals:rivals.length,plan:{entryTrackS:plan.entryTrackS,exitTrackS:plan.exitTrackS,routeLength:plan.routeLength,speedKph:plan.speedKph,box},start:{x:player.x,z:player.z,total:player.total,lap:player.lap},weather};
 },
 setDistance(p){if(typeof apexRaceSelectPercentage==='function')apexRaceSelectPercentage(p)},
 status(){return {paused,mode,t:raceT,phase:player.pitStop?.phase||null,pit:apexPitSnapshot(player),tyres:apexTyreSnapshot(player),x:player.x,z:player.z,total:player.total,lap:player.lap,speed:player.speed,network:player.driveNetwork,finite:physicsFinite(),faults:player.physicsFaults||0,driving:demoMode?'AUTO':assistMode?'ASSISTED':'MANUAL',hud:pitStopHudStatus(),boxAhead:player.pitStop?.boxAhead,pitDistance:player.pitState?.dist,lastBoundary:player.lastDrivableBoundaryHit,lastWall:player.autoLastWallHit,profile:renderProfilerSnapshot(),performance:apexPerformanceSummary()};},
 request(){requestPitStop();return this.status()},
 async run(seconds=180){
  const samples=[],phases=[],start=this.status(),L=trackData.km*1000,finish=apexRaceTimingGeometry(trackData.spec,player.laps).finish;
  let maxMove=0,maxProgressJump=0,maxLaneKph=0,finishCrossings=0,service=null,lastPhase='',completed=false;
  const t0=performance.now();for(let i=0;i<seconds*100;i++){
   const x=player.x,z=player.z,total=player.total,cls=player.classificationS,prev=player.pitStop?.phase,was=player.pitStop?.serviced;
   update(.01,i%5===4,.05);
   maxMove=Math.max(maxMove,Math.hypot(player.x-x,player.z-z));maxProgressJump=Math.max(maxProgressJump,Math.abs(player.total-total));
   if(crossedTimingLine(cls,player.classificationS,finish,L)&&player.trackDirDot>.08)finishCrossings++;
   if(player.driveNetwork==='PIT')maxLaneKph=Math.max(maxLaneKph,player.speed*3.6);
   const st=player.pitStop,phase=st?.phase||null;if(phase!==lastPhase){phases.push({phase,t:raceT,x:player.x,z:player.z,pitS:player.pitS,boxAhead:st?.boxAhead});lastPhase=phase;}
   if(!was&&st?.serviced)service={...this.status(),damage:{...player.damage},ers:player.ers};
   if(i%100===0)samples.push(this.status());
   if(!physicsFinite()||mode!=='race')throw Error('Invalid physical state at '+i);
   if(phase==='DONE'){completed=true;break}
   if(i%400===399)await new Promise(r=>setTimeout(r,0));
  }
  updateHud(true);activeRenderer.renderFrame();
  return {completed,start,end:this.status(),phases,samples,maxMove,maxProgressJump,maxLaneKph,finishCrossings,service,cpuMs:performance.now()-t0};
 },
 manualFixture(device){
  const plan=apexPitRoutePlan(),box=apexPitBoxForCar(plan,player),q=apexPitPointAtS(box.pitS-plan.dir);
  setAutoDriveMode(0,false);apexReleaseInputs();gyro.enabled=device==='gyro';gyro.steer=0;gyro.throttle=1;gyro.brake=0;gyro.last=performance.now();
  player.x=q.x;player.z=q.z;player.heading=Math.atan2(q.tx*plan.dir,q.tz*plan.dir);player.vx=0;player.vz=0;player.speed=0;player.yawRate=0;player.driveNetwork='PIT';player.pitIndex=null;
  syncPlayerTrack();player.classificationS=apexPlayerClassificationS();player.progressS=player.classificationS;player.lastGood=snapshotPhysics();
  apexPitSelectCompound(player,'HARD');requestPitStop();return this.status();
 },
 async manualService(){
  const before=this.status();let installed=null;
  for(let i=0;i<400;i++){if(gyro.enabled)gyro.last=performance.now();update(.01,i%5===4,.05);if(player.pitStops===1){installed=this.status();for(let k=0;k<10;k++)update(.01,k%5===4,.05);break}if(i%100===99)await new Promise(r=>setTimeout(r,0))}
  return {before,installed,after:this.status()};
 },
 perf(){return {version:APP_VERSION,rivals:rivals.length,summary:apexPerformanceSummary(),profile:renderProfilerSnapshot()}},
 async rivalCycle(dir){
  const loaded=await this.load(dir,'CLEAR',false,true),plan=apexPitRoutePlan(),rv=rivals[0];
  if(!plan||!rv)return {available:false,reason:'NO_RIVAL_OR_PIT'};
  const eligibility=apexRivalPitEligibility(rv,plan);
  if(!eligibility.ok)return {available:false,reason:eligibility.reason,issue:plan.serviceIssue};
  // One fixture placement before the test, then production rival PIT controller only.
  const q=renderRibbonFrameAt(plan.entryTrackS);
  rv.s=mod(plan.entryTrackS-55,trackData.km*1000);rv.lat=0;rv.speed=12;rv.total=0;rv.progressOriginS=rv.s;
  const request=apexRivalPitRequest(rv,'HARD');
  if(!request.ok)return {available:false,reason:request.reason};
  const phases=[],samples=[];let phase='',maxJump=0,maxWorldJump=0,maxSpeed=0,prevWorld=rivalWorld(rv),prevTotal=rv.total,done=false;
  for(let i=0;i<18000;i++){
   raceT+=.05;
   updateRivalRacecraft(rv,.05,trackData.km*1000,1);
   const handled=rv.driveNetwork==='PIT'||rv.pitStop.phase==='DONE';
   const world=rivalWorld(rv),distance=Math.hypot(world.x-prevWorld.x,world.z-prevWorld.z);
   maxWorldJump=Math.max(maxWorldJump,distance);maxJump=Math.max(maxJump,Math.abs(rv.total-prevTotal));
   maxSpeed=Math.max(maxSpeed,rv.driveNetwork==='PIT'?rv.speed*3.6:0);
   if(rv.pitStop.phase!==phase){phase=rv.pitStop.phase;phases.push({phase,t:raceT,pitS:rv.pitS,total:rv.total});}
   if(i%200===0)samples.push({t:raceT,phase,s:rv.s,pitS:rv.pitS,network:rv.driveNetwork,speed:rv.speed});
   prevWorld=world;prevTotal=rv.total;
   if(rv.pitStop.phase==='DONE'){done=true;break;}
   if(rv.pitStop.phase==='FAILED')break;
   if(i>1200&&!handled&&rv.pitStop.phase==='APPROACH')break;
  }
  const endWorld=rivalWorld(rv),entryGap=mod(plan.entryTrackS-rv.s,trackData.km*1000),entryWorldGap=Math.hypot(endWorld.x-plan.entry.x,endWorld.z-plan.entry.z);
  return {available:true,dir,done,phases,samples,maxJump,maxWorldJump,maxSpeed,pitStops:rv.pitStops||0,compound:rv.tyres?.compound,network:rv.driveNetwork,final:rv.pitStop.phase,entryGap,entryWorldGap,finalLat:rv.lat,box:eligibility.box,limit:plan.speedKph,request};
 },
 async rivalsConcurrent(dir='13-italy'){
  await this.load(dir,'CLEAR',false,true);
  const plan=apexPitRoutePlan(),a=rivals[0],b=rivals[1],L=trackData.km*1000;
  if(!plan||!plan.serviceSafe)return {available:false};
  const start=mod(plan.entryTrackS-62,L);
  for(const [car,offset] of [[a,0],[b,-12]]){
   car.s=mod(start+offset,L);car.lat=0;car.speed=12;car.total=0;car.progressOriginS=car.s;
   car.driveNetwork='TRACK';car.pitStop=null;
  }
  const qa=apexRivalPitRequest(a,'HARD'),qb=apexRivalPitRequest(b,'MEDIUM');
  if(!qa.ok||!qb.ok)return {available:false,qa,qb};
  const logs=[],last=[null,null],cars=[a,b],mins={pitGap:Infinity,worldGap:Infinity},startStops=cars.map(c=>c.pitStops||0);
  for(let i=0;i<18000;i++){
   raceT+=.05;
   for(const car of cars)if(car.pitStop?.active)updateRivalRacecraft(car,.05,L,1);
   for(let k=0;k<2;k++)if(cars[k].pitStop.phase!==last[k]){
    last[k]=cars[k].pitStop.phase;logs.push({car:k,phase:last[k],t:raceT});
   }
   const pa=a.driveNetwork==='PIT',pb=b.driveNetwork==='PIT';
   if(pa&&pb)mins.pitGap=Math.min(mins.pitGap,Math.abs(a.pitS-b.pitS));
   if(pa&&pb){const aw=rivalWorld(a),bw=rivalWorld(b);mins.worldGap=Math.min(mins.worldGap,Math.hypot(aw.x-bw.x,aw.z-bw.z));}
   if(cars.every(c=>c.pitStop?.phase==='DONE'))break;
   if(i%800===799)await new Promise(resolve=>setTimeout(resolve,0));
  }
  return {available:true,dir,logs,mins,done:cars.map(c=>c.pitStop?.phase),
    stops:cars.map((c,k)=>(c.pitStops||0)-startStops[k]),compounds:cars.map(c=>c.tyres?.compound),
    networks:cars.map(c=>c.driveNetwork),slots:[qa.box.slotId,qb.box.slotId]};
 },
 async autonomousStrategyRace(dir='13-italy',weather='CLEAR'){
  await this.load(dir,weather,false,true);
  const plan=apexPitRoutePlan(),L=trackData.km*1000;
  if(!plan||!plan.serviceSafe)return {available:false};
  const cars=rivals.slice(0,5),begin=mod(plan.entryTrackS-100,L);
  // Set up a racing scenario once, then leave the decisions, navigation and service to production code.
  trackData.raceConfig={...trackData.raceConfig,totalLaps:40};
  for(let i=0;i<cars.length;i++){
   const car=cars[i];car.s=mod(begin-13*i,L);car.progressOriginS=car.s;car.total=8000;car.speed=13;
   car.driveNetwork='TRACK';car.pitStop=null;car.pitStops=0;car.aiPitNextCheck=0;car.aiPitLastLap=null;
   apexTyreInstall(car,'SOFT');car.tyres.front.wear=.88;car.tyres.rear.wear=.86;
  }
  raceT=80;const phases=[],last=cars.map(()=>null);let minGap=Infinity;
  for(let i=0;i<22000;i++){
   raceT+=.05;
   for(const car of cars)updateRivalRacecraft(car,.05,L,1);
   for(let k=0;k<cars.length;k++){
    const phase=cars[k].pitStop?.phase||null;
    if(phase!==last[k]){last[k]=phase;phases.push({car:k,phase,t:raceT});}
   }
   const inPit=cars.filter(c=>c.driveNetwork==='PIT');
   for(let a=0;a<inPit.length;a++)for(let b=a+1;b<inPit.length;b++)
    minGap=Math.min(minGap,Math.abs(inPit[a].pitS-inPit[b].pitS));
   if(cars.every(c=>c.pitStop?.phase==='DONE'))break;
   if(i%600===599)await new Promise(resolve=>setTimeout(resolve,0));
  }
  return {available:true,dir,phases,minGap,stops:cars.map(c=>c.pitStops),
   compounds:cars.map(c=>c.tyres?.compound),states:cars.map(c=>c.pitStop?.phase),
   reasons:cars.map(c=>c.aiPitReason),networks:cars.map(c=>c.driveNetwork)};
 },
 stop(){pitAuditStepping=true;goMenu()}
};
