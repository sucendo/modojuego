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
  rv.s=plan.entryTrackS;rv.lat=0;rv.speed=4;rv.total=0;rv.progressOriginS=rv.s;
  const request=apexRivalPitRequest(rv,'HARD');
  if(!request.ok)return {available:false,reason:request.reason};
  const phases=[],samples=[];let phase='',maxJump=0,maxWorldJump=0,maxSpeed=0,prevWorld=rivalWorld(rv),prevTotal=rv.total,done=false;
  for(let i=0;i<18000;i++){
   raceT+=.05;
   const handled=apexRivalPitDrive(rv,.05,trackData.km*1000);
   const world=rivalWorld(rv),distance=Math.hypot(world.x-prevWorld.x,world.z-prevWorld.z);
   maxWorldJump=Math.max(maxWorldJump,distance);maxJump=Math.max(maxJump,Math.abs(rv.total-prevTotal));
   maxSpeed=Math.max(maxSpeed,rv.driveNetwork==='PIT'?rv.speed*3.6:0);
   if(rv.pitStop.phase!==phase){phase=rv.pitStop.phase;phases.push({phase,t:raceT,pitS:rv.pitS,total:rv.total});}
   if(i%200===0)samples.push({t:raceT,phase,s:rv.s,pitS:rv.pitS,network:rv.driveNetwork,speed:rv.speed});
   prevWorld=world;prevTotal=rv.total;
   if(rv.pitStop.phase==='DONE'){done=true;break;}
   if(!handled&&rv.pitStop.phase==='APPROACH')break;
  }
  return {available:true,dir,done,phases,samples,maxJump,maxWorldJump,maxSpeed,pitStops:rv.pitStops||0,compound:rv.tyres?.compound,network:rv.driveNetwork,final:rv.pitStop.phase,box:eligibility.box,limit:plan.speedKph,request};
 },
 stop(){pitAuditStepping=true;goMenu()}
};
