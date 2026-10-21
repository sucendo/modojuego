/* Test-only hooks. Boundary fixtures place each car ONCE; update() then drives the
   authored finish gate with production physics. FullRace starts at the real grid. */
window.__apexRaceAudit={
 async load(dir,p=25){apexRaceSelectPercentage(p);await __apexPitAudit.load(dir,'CLEAR',false,true);countdown=0;mode='race';paused=false;apexArmRaceGridTiming();apexReleaseInputs();gyro.enabled=false;setAutoDriveMode(1,false);return this.status()},
 select(p){apexRaceSelectPercentage(p)},
 status(){return {version:APP_VERSION,mode,time:raceT,percentage:apexRaceSession?.config.percentage,laps:player?.lap,totalLaps:player?.laps,state:apexRaceSession?.status,finished:apexRaceSession?.finishedCount,rivals:rivals.length,faults:player.physicsFaults||0,config:trackData.raceConfig,rows:apexRaceSession?apexRaceResultRows():[],finite:physicsFinite()};},
 boundaryFixture(){
  const L=trackData.km*1000,g=apexRaceTimingGeometry(trackData.spec,player.laps),target=player.laps;raceT=target*70;lapStart=raceT-60;best=Infinity;sessionLapLog=[];
  const all=[player,...rivals];for(let i=0;i<all.length;i++){
   const c=all[i],behind=12+i*10,s=mod(g.finish-behind,L),q=poseAt(s),lane=i%2?-1.8:1.8;
   c.s=s;c.total=g.raceDistance-behind;c.lat=lane;c.speed=30;c.finished=false;c.finishTime=null;c.crossedStart=true;c.raceFirstLapPending=false;c.raceFinishLaps=undefined;apexResetDriverTimingState(c,raceT-60);
   if(i===0){c.lap=target-1;c.x=q.x+q.nx*lane;c.z=q.z+q.nz*lane;c.heading=Math.atan2(q.tx,q.tz);c.vx=q.tx*30;c.vz=q.tz*30;c.yawRate=0;c.progressS=s;c.classificationS=s;c.trackIndex=q.i;c.driveNetwork='TRACK';c.lastGood=snapshotPhysics();}
   else {c.completedLaps=target-1;if(i===21){c.completedLaps=target-2;c.total-=L;}c.targetLat=lane;}
  }
  return this.status();
 },
 async drive(seconds=30){
  const start=this.status(),t0=performance.now();let steps=0;for(;steps<seconds*100&&mode==='race';steps++){
   update(.01,steps%5===4,.05);if(!physicsFinite()||(player.physicsFaults||0))throw Error('Race physical state invalid');if(steps%500===499)await new Promise(r=>setTimeout(r,0));
  }
  return {start,end:this.status(),cpuMs:performance.now()-t0,steps};
 },
 matrix(){return calendar.slice(0,F1_SEASON_COUNT).map(s=>({id:s.dir,rows:[25,50,75,100].map(p=>apexRaceConfig(s,p))}))},
 persisted(){return {session:save.lastRaceSession,result:save.lastRaceResult,pits:save.lastTyreSession?.pits}},
 async fullRace(dir='13-italy',p=25,seconds=2400){await this.load(dir,p);return this.drive(seconds)}
};
