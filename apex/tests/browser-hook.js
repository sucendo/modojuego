/* Injected into the assembled simulator by browser-audit.cjs only. */
window.__apexAudit={
 async load(dir,custom=false){
  goMenu();const spec=dir==='BASE_OTHER'?(calendar.find(s=>/italy|monza/i.test(s.dir+' '+s.name))||calendar[0]):calendar.find(s=>s.dir===dir);if(!spec)throw Error('Circuit not found: '+dir);
  if(custom)await importEditableCircuitSvgText(await(await fetch('circuits/svg/apex26_14-madrid-spain.svg')).text(),spec);
  sessionSettings={diff:1,weather:'CLEAR',noRivals:false};currentSession='race';await startRace(spec,5,'quick',$('start'));
  if(!player||!trackData)throw Error('Session did not start');
  if(!setRendererBackend('webgl2',{notify:false,persist:false}))throw Error('WebGL2 unavailable');
  countdown=0;mode="race";paused=false;setAutoDriveMode(1,false);
 },
 manual(device){
  setAutoDriveMode(0,false);apexReleaseInputs();gyro.enabled=false;window.__apexGamepad=null;
  if(device==='gamepad')window.__apexGamepad={index:0,connected:true,axes:[.3,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
  if(device==='gyro'){gyro.enabled=true;gyro.last=performance.now();gyro.steer=.3;gyro.throttle=0;gyro.brake=0;}
 },
 release(){apexReleaseInputs();gyro.enabled=false;window.__apexGamepad=null;},
 saveSnapshot(){persist();return{save:JSON.parse(JSON.stringify(save)),stored:JSON.parse(appStorage.getItem(SAVE_KEY))};},
 backend(id){if(id==='canvas2d')apexSetCameraMode('cockpit',{silent:true});return setRendererBackend(id,{notify:false,persist:false});},
 reset(){apexRuntimePerfReset();},
 camera(mode){return apexSetCameraMode(mode,{silent:true});},
 snapshot(){const gl=webglState.gl,ext=gl&&gl.getExtension('WEBGL_debug_renderer_info');return{
  version:APP_VERSION,circuit:trackData&&trackData.spec.dir,backend:rendererBackendId(),
  camera:apexCameraMode(),rivals:rivals.length,summary:apexPerformanceSummary(),profile:renderProfilerSnapshot(),
  driving:window.apexDrivingDiagnostics?apexDrivingDiagnostics():null,
  state:player?{x:player.x,z:player.z,s:player.s,speed:player.speed,heading:player.heading,yawRate:player.yawRate}:null,
  simulationSeconds:raceT,mode,contextLost:!!webglState.lost,
  road:window.apexPhase6RoadDiagnostics?apexPhase6RoadDiagnostics():null,terrain:apexPhase5TerrainDiagnostics(),ground:apexPhase5GpuDiagnostics(),glError:gl&&gl.getError(),
  renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl&&gl.getParameter(gl.RENDERER)};},
 stop(){goMenu();return !apexPhase5TerrainGPU.buffer&&!apexPhase5GroundGPU.buffer&&(!window.apexPhase6RoadDiagnostics||!apexPhase6RoadDiagnostics().resident);},
 circuits(){return calendar.slice(0,F1_SEASON_COUNT).map(s=>s.dir);},
 async baseTests(){return{runtime:await apexCircuitRuntimeSelfTest(),timing:await apexLapEngineSelfTest(),road:window.apexPhase6AuditBaseCircuits?await apexPhase6AuditBaseCircuits():null};}
};
