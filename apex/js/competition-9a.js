/* APEX Formula 26 · 9A.1 · Núcleo versionado de configuración de competición.
 * No modifica el motor, la meteorología ni el cronometraje.
 * API: ApexCompetition9A.get(), select(), beginWeekend(), completeSession(),
 * beginSeason(), completeRound(), reset(). Eventos: apex:competition-change.
 */
(function(global){
  'use strict';
  const KEY='apex26.competition.v1', VERSION=1;
  const MODES=['quick','grand-prix','season','practice'];
  const STAGES=['fp1','fp2','fp3','qualifying','race'];
  const DISTANCES=[25,50,75,100];
  const TYRES=['soft','medium','hard','intermediate','wet'];
  const STRATEGIES=['aggressive','balanced','conservative'];
  const DEFAULT=()=>({
    version:VERSION,mode:'quick',circuitId:null,teamId:null,driverId:null,
    distance:100,weather:'auto',timeOfDay:null,tyre:'medium',strategy:'balanced',
    weekend:null,season:null
  });
  const clone=x=>JSON.parse(JSON.stringify(x));
  const validId=x=>x===null||(typeof x==='string'&&x.length>0&&x.length<=120);
  function normalize(value){
    const x={...DEFAULT(),...(value&&typeof value==='object'?value:{})};
    x.version=VERSION;
    if(!MODES.includes(x.mode))x.mode='quick';
    for(const field of ['circuitId','teamId','driverId'])if(!validId(x[field]))x[field]=null;
    if(!DISTANCES.includes(x.distance))x.distance=100;
    if(!TYRES.includes(x.tyre))x.tyre='medium';
    if(!STRATEGIES.includes(x.strategy))x.strategy='balanced';
    if(typeof x.weather!=='string'||x.weather.length>40)x.weather='auto';
    if(x.weekend&&!STAGES.includes(x.weekend.stage))x.weekend=null;
    if(x.season&&(!Array.isArray(x.season.calendar)||!Number.isInteger(x.season.round)))x.season=null;
    return x;
  }
  let state=DEFAULT();
  try{const raw=global.localStorage.getItem(KEY);if(raw)state=normalize(JSON.parse(raw));}catch(_){}
  function emit(){
    try{global.localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}
    global.dispatchEvent(new CustomEvent('apex:competition-change',{detail:clone(state)}));
    return clone(state);
  }
  function select(patch){
    if(!patch||typeof patch!=='object')throw Error('Configuración inválida');
    const allowed=['mode','circuitId','teamId','driverId','distance','weather','timeOfDay','tyre','strategy'];
    const picked={};for(const key of allowed)if(Object.hasOwn(patch,key))picked[key]=patch[key];
    state=normalize({...state,...picked});return emit();
  }
  function beginWeekend(config={}){
    if(state.weekend&&config.resume)return clone(state.weekend);
    const circuitId=config.circuitId||state.circuitId;
    if(!validId(circuitId)||!circuitId)throw Error('Selecciona un circuito real antes del GP');
    state.weekend={circuitId,stage:'fp1',sessions:{},grid:null,result:null,finished:false};
    emit();return clone(state.weekend);
  }
  function completeSession(stage,result){
    const weekend=state.weekend;
    if(!weekend||weekend.finished||weekend.stage!==stage||!STAGES.includes(stage))
      throw Error('Sesión fuera de secuencia');
    if(!result||typeof result!=='object'||result.verified!==true)
      throw Error('Solo se aceptan resultados verificados del motor APEX');
    if(stage==='qualifying'&&(!Array.isArray(result.grid)||!result.grid.length))
      throw Error('La clasificación debe aportar una parrilla válida');
    if(stage==='race'&&(!Array.isArray(result.classification)||!result.classification.length))
      throw Error('La carrera debe aportar una clasificación válida');
    weekend.sessions[stage]=clone(result);
    if(stage==='qualifying')weekend.grid=clone(result.grid);
    if(stage==='race'){weekend.result=clone(result);weekend.finished=true;}
    else weekend.stage=STAGES[STAGES.indexOf(stage)+1];
    emit();return clone(weekend);
  }
  function beginSeason(calendar){
    if(!Array.isArray(calendar)||!calendar.length||calendar.some(id=>!validId(id)||!id))
      throw Error('El calendario necesita identificadores de circuitos APEX válidos');
    if(new Set(calendar).size!==calendar.length)throw Error('Circuitos duplicados');
    state.season={calendar:clone(calendar),round:0,results:[],finished:false};
    return emit();
  }
  function completeRound(result){
    const s=state.season;
    if(!s||s.finished)throw Error('No hay temporada pendiente');
    if(!result||result.verified!==true||!Array.isArray(result.classification)||!result.classification.length)
      throw Error('No se pueden anotar puntos sin resultado final verificado');
    if(result.circuitId!==s.calendar[s.round])throw Error('La ronda no coincide con el calendario');
    if(s.results.some(r=>r.circuitId===result.circuitId))throw Error('Resultado ya registrado');
    s.results.push(clone(result));s.round+=1;s.finished=s.round===s.calendar.length;
    return emit();
  }
  function reset(scope='all'){
    if(scope==='weekend')state.weekend=null;
    else if(scope==='season')state.season=null;
    else if(scope==='all')state=DEFAULT();
    else throw Error('Ámbito desconocido');
    return emit();
  }
  Object.defineProperty(global,'ApexCompetition9A',{
    value:Object.freeze({get:()=>clone(state),select,beginWeekend,completeSession,beginSeason,completeRound,reset,
      constants:Object.freeze({modes:MODES.slice(),stages:STAGES.slice(),distances:DISTANCES.slice(),tyres:TYRES.slice()})}),
    configurable:false,writable:false
  });
})(window);
