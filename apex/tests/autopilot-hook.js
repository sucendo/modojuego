/* Test-only accelerated integration: production update(), real loaded circuit,
   walls, surfaces, rivals and timing. No rendering/FPS measurement during ticks. */
let auditStepping=false;
const auditProductionLoop=loop;
loop=function(t){if(!auditStepping)return auditProductionLoop(t);last=t;requestAnimationFrame(loop);};
window.__apexAuto={
 async load(dir,traffic,session='race'){
  auditStepping=true;goMenu();const spec=calendar.find(s=>s.dir===dir);if(!spec)throw Error(dir);
  // Both baseline and candidate must run with the EXACT same traffic, grid
  // and random incidents. A single global seed across 20 scenarios biases
  // comparisons because the preceding run consumes different RNG amounts.
  if(window.__apexAutoSeed)window.__apexAutoSeed(261007+calendar.indexOf(spec)*17+(traffic?1:0));
  // Audit the SAME SVG+JSON selected by the user's "Cargar versión guardada".
  // The old hook silently used Madrid BASE, masking edited track geometry.
  if(dir==='14-spain'&&!readStoredCustomTrackSvg(dir)){
   const manifest=await fetch('circuits/manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Missing circuit manifest');return r.json()});
   const saved=manifest.circuits?.[dir];if(!saved?.svg)throw Error('Missing saved Madrid SVG');
   if(saved.json){
    const json=validateCircuitJson(await fetch('circuits/'+saved.json,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Missing Madrid JSON');return r.json()}));
    await apexStoreCircuitJsonOverride(spec.dir,json);applyStoredCircuitJsonToSpec(spec,json);
   }
   const xml=await fetch('circuits/'+saved.svg,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Missing Madrid SVG');return r.text()});
   const loaded=await importEditableCircuitSvgText(xml,spec);
   if(loaded.brakeBoards!==34||!loaded.worldPayload.brakeBoardsAuthoritative)throw Error('Saved Madrid SVG 16 signs not authoritative');
  }
  const practice=session==='freepractice';
  sessionSettings={diff:1,weather:'CLEAR',noRivals:!traffic};currentSession=practice?'freepractice':'race';
  $('gridPos').value='11';apexSetDriveProfile('assisted',false);
  if(typeof apexRaceSelectPercentage==='function')apexRaceSelectPercentage(100);
  await startRace(spec,practice?999:99,practice?'freepractice':'quick',practice?$('practiceStart'):$('start'));if(!player||!trackData)throw Error('Load failed: '+dir);
  countdown=0;mode='race';paused=false;if(!practice)apexArmRaceGridTiming();apexReleaseInputs();gyro.enabled=false;setAutoDriveMode(1,true);
  return {version:APP_VERSION,build:APP_BUILD,circuit:dir,session,rivals:rivals.length,startTotal:player.total,svgBoards:trackData.customWorld?.brakeBoards?.length||0,svgBoardAuthority:trackData.customWorld?.brakeBoardsAuthoritative===true,
   lineOptimization:trackData.model?.driver?.timeLine||null};
 },
 sample(){return{
  t:raceT,s:player.s,total:player.total,x:player.x,z:player.z,lat:player.lat,speed:player.speed,yaw:player.yawRate,
  steer:player.steer,gas:player.throttle,brake:player.brakeInput,hp:player.hp,damage:{...player.damage},
  target:player.autoTargetSpeed,preCommitTarget:player.autoPreCommitTargetSpeed,committedTarget:player.autoCommittedTargetSpeed,exitClearance:player.autoExitClearance,releaseRate:player.autoTargetReleaseRate,reason:player.autoTargetSpeedReason,detail:player.autoTargetSpeedReasonDetail,
  baseTarget:player.autoBaseTrackTargetSpeed,trafficLimit:player.autoTrafficSpeedLimit,phase:player.autoPhase,
  stability:player.autoStabilityRisk,rearRisk:player.autoRearCritical,brakeRelease:player.autoBrakeRelease,
  recovery:player.autoRecovery?{mode:player.autoRecovery.mode,stage:player.autoRecovery.emergencyStage,emergency:player.autoRecovery.emergency}:null,
  lastBoundary:player.lastDrivableBoundaryHit,lastWall:player.autoLastWallHit,lastRival:player.autoLastRivalContact,physicsFaults:player.physicsFaults,
  heading:player.heading,trackHeading:Math.atan2(player.track.tx,player.track.tz),trackDot:player.trackDirDot,
  surface:player.surfaceKind,network:player.driveNetwork,lap:player.lap,
  rivals:rivals.length,finite:physicsFinite(),mode
 };},
 async render(seconds){
  auditStepping=false;
  try{
   await new Promise(resolve=>setTimeout(resolve,2000));
   apexRuntimePerfReset();
   await new Promise(resolve=>setTimeout(resolve,seconds*1000));
   const perf=apexRuntimePerfSummary();
   const renderer=renderProfilerSnapshot();
   return {perf,renderer,heapBytes:performance.memory?.usedJSHeapSize??null};
  }finally{auditStepping=true;}
 },
 async run(seconds,stepsPerFrame=5){
  const samples=[],start=player.total,cornerMinima=new Map();
  const control=demoDriverControl;
  let controlMs=0,controlCalls=0;
  demoDriverControl=function(...args){
   const begin=performance.now();
   try{return control.apply(this,args);}
   finally{controlMs+=performance.now()-begin;controlCalls++;}
  };
  let distance=0,topSpeed=0,speedSum=0,throttleSum=0,brakeSum=0,brakeTicks=0,brakeDistance=0,laneErrorSq=0;
  let wallContacts=0,offTrackEpisodes=0,wasOffTrack=false;
  const heapStart=performance.memory?.usedJSHeapSize??null,cpuStart=performance.now();let stopped=0,maxStopped=0,noProgress=0,maxNoProgress=0,best=player.total;
  const count=Math.round(seconds*100);
  try{for(let tick=0;tick<count;tick++){
   const {x,z,autoLastWallHit}=player;
   update(.01,tick%stepsPerFrame===stepsPerFrame-1,stepsPerFrame*.01);
   const ds=Math.hypot(player.x-x,player.z-z),speed=Math.abs(player.speed);
   distance+=ds;topSpeed=Math.max(topSpeed,speed);speedSum+=speed;
   throttleSum+=player.throttle;brakeSum+=player.brakeInput;
   if(player.brakeInput>.05){brakeTicks++;brakeDistance+=ds;}
   laneErrorSq+=(player.lat-player.autoTargetLat)**2;
   if(player.autoLastWallHit>=0&&player.autoLastWallHit!==autoLastWallHit)wallContacts++;
   const offTrack=['RUNOFF','OFF','LIMIT','WALL','WATER'].includes(player.surface);
   if(offTrack&&!wasOffTrack)offTrackEpisodes++;
   wasOffTrack=offTrack;
   if(player.speed<.7&&(player.autoTargetSpeed||0)>2){stopped+=.01;maxStopped=Math.max(maxStopped,stopped);}else stopped=0;
   if(player.total>best+1){best=player.total;noProgress=0;}else {noProgress+=.01;maxNoProgress=Math.max(maxNoProgress,noProgress);}
   if(!physicsFinite()||mode!=='race')throw Error('Invalid simulation state at '+tick);
   if(tick%50===49){
    samples.push(this.sample());
    const turn=apexCornerReferenceAtS(player.s).region?.turn;
    if(Number.isFinite(turn)){
     const key=player.lap+':'+turn;
     const previous=cornerMinima.get(key);
     if(!previous||speed<previous.speed)cornerMinima.set(key,{lap:player.lap+1,turn,speed});
    }
   }
   if(tick%200===199)await new Promise(resolve=>setTimeout(resolve,0));
  }}finally{demoDriverControl=control;}
  const laps=sessionLapLog.map(({lap,time,elapsed,sectors,firstLap})=>({lap,time:time??elapsed,sectors,firstLap:!!firstLap}));
  return {laps,cornerMinima:[...cornerMinima.values()].map(({lap,turn,speed})=>({lap,turn,minKph:speed*3.6})),metrics:{distanceM:distance,meanKph:speedSum/count*3.6,maxKph:topSpeed*3.6,
   meanThrottlePct:throttleSum/count*100,meanBrakePct:brakeSum/count*100,brakeSeconds:brakeTicks/100,brakeDistanceM:brakeDistance,
   rmsLaneErrorM:Math.sqrt(laneErrorSq/count),wallContacts,offTrackEpisodes,controlMs,controlCalls,
   heapStartBytes:heapStart,heapEndBytes:performance.memory?.usedJSHeapSize??null},
   cpuMs:performance.now()-cpuStart,seconds,physicsHz:100,stepsPerFrame,progressM:player.total-start,maxStoppedSec:maxStopped,maxNoProgressSec:maxNoProgress,end:this.sample(),samples};
 }
};
