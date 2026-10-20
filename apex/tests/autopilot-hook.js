/* Test-only accelerated integration: production update(), real loaded circuit,
   walls, surfaces, rivals and timing. No rendering/FPS measurement during ticks. */
let auditStepping=false;
const auditProductionLoop=loop;
loop=function(t){if(!auditStepping)return auditProductionLoop(t);last=t;requestAnimationFrame(loop);};
window.__apexAuto={
 async load(dir,traffic){
  auditStepping=true;goMenu();const spec=calendar.find(s=>s.dir===dir);if(!spec)throw Error(dir);
  if(dir==='14-spain'&&!readStoredCustomTrackSvg(dir))await importEditableCircuitSvgText(await(await fetch('circuits/svg/apex26_14-madrid-spain.svg')).text(),spec);
  sessionSettings={diff:1,weather:'CLEAR',noRivals:!traffic};currentSession='race';
  $('gridPos').value='11';apexSetDriveProfile('assisted',false);
  await startRace(spec,99,'quick',$('start'));if(!player||!trackData)throw Error('Load failed: '+dir);
  countdown=0;mode='race';paused=false;apexArmRaceGridTiming();apexReleaseInputs();gyro.enabled=false;setAutoDriveMode(1,true);
  return {version:APP_VERSION,build:APP_BUILD,circuit:dir,rivals:rivals.length,startTotal:player.total};
 },
 sample(){return{
  t:raceT,s:player.s,total:player.total,x:player.x,z:player.z,lat:player.lat,speed:player.speed,yaw:player.yawRate,
  steer:player.steer,gas:player.throttle,brake:player.brakeInput,hp:player.hp,damage:{...player.damage},
  target:player.autoTargetSpeed,reason:player.autoTargetSpeedReason,detail:player.autoTargetSpeedReasonDetail,
  baseTarget:player.autoBaseTrackTargetSpeed,trafficLimit:player.autoTrafficSpeedLimit,phase:player.autoPhase,
  stability:player.autoStabilityRisk,rearRisk:player.autoRearCritical,brakeRelease:player.autoBrakeRelease,
  recovery:player.autoRecovery?{mode:player.autoRecovery.mode,stage:player.autoRecovery.emergencyStage,emergency:player.autoRecovery.emergency}:null,
  lastBoundary:player.lastDrivableBoundaryHit,lastWall:player.autoLastWallHit,lastRival:player.autoLastRivalContact,physicsFaults:player.physicsFaults,
  heading:player.heading,trackHeading:Math.atan2(player.track.tx,player.track.tz),trackDot:player.trackDirDot,
  surface:player.surfaceKind,network:player.driveNetwork,lap:player.lap,
  rivals:rivals.length,finite:physicsFinite(),mode
 };},
 async run(seconds,stepsPerFrame=5){
  const samples=[],start=player.total;let stopped=0,maxStopped=0,noProgress=0,maxNoProgress=0,best=player.total;
  const count=Math.round(seconds*100);for(let tick=0;tick<count;tick++){
   update(.01,tick%stepsPerFrame===stepsPerFrame-1,stepsPerFrame*.01);
   if(player.speed<.7&&(player.autoTargetSpeed||0)>2){stopped+=.01;maxStopped=Math.max(maxStopped,stopped);}else stopped=0;
   if(player.total>best+1){best=player.total;noProgress=0;}else {noProgress+=.01;maxNoProgress=Math.max(maxNoProgress,noProgress);}
   if(!physicsFinite()||mode!=='race')throw Error('Invalid simulation state at '+tick);
   if(tick%50===49)samples.push(this.sample());
   if(tick%200===199)await new Promise(resolve=>setTimeout(resolve,0));
  }
  return {seconds,physicsHz:100,stepsPerFrame,progressM:player.total-start,maxStoppedSec:maxStopped,maxNoProgressSec:maxNoProgress,end:this.sample(),samples};
 }
};
