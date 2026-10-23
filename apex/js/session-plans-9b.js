/* APEX 9B.1 · Planes de fin de semana por evento/sesión. 
 * Datos exclusivamente de preparación: los resultados y el progreso son nativos.
 */
(function (global) {
'use strict';
const KEY='apex26.session-plans.v1', VERSION=1;
const SESSIONS=['fp1','fp2','fp3','qualifying','race'];
const PRESETS=['CLEAR','PARTLY','OVERCAST','DRIZZLE','RAIN','STORM','VARIABLE'];
const COMPOUNDS=['SOFT','MEDIUM','HARD','INTERMEDIATE','WET'];
const STYLES=['aggressive','balanced','conservative'];
const PROGRAMS=['performance','balanced','race-simulation'];
const clone=x=>JSON.parse(JSON.stringify(x));
const storage=()=>{try{return global.localStorage}catch(_){return null}};
function read(){
 try{const v=JSON.parse(storage()?.getItem(KEY)||'null');return v&&v.version===VERSION&&v.events&&typeof v.events==='object'&&!Array.isArray(v.events)?v:{version:VERSION,events:{}}}
 catch(_){return {version:VERSION,events:{}}}
}
function write(data){try{storage()?.setItem(KEY,JSON.stringify(data));return true}catch(_){return false}}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0}
function context(ctx){
 if(!ctx||!['season','grandprix'].includes(ctx.mode))throw Error('Modalidad de fin de semana inválida');
 const spec=ctx.spec||{},dir=String(spec.dir||'');
 if(!dir||dir.length>150)throw Error('Circuito sin identificador');
 const round=ctx.mode==='season'?Math.max(0,Math.min(22,Math.trunc(Number(ctx.round)||0))):0;
 const id=ctx.mode+':'+round+':'+dir;
 return {id,mode:ctx.mode,round,dir,spec:{dir,name:String(spec.name||dir),country:String(spec.country||''),r:Number(spec.r)||round+1}};
}
function forecastPreset(c,stage,previous){
 const base=global.ApexClimate9A?.forecast?.(c.spec,c.round)?.preset||'PARTLY';
 const steps=['CLEAR','PARTLY','OVERCAST','DRIZZLE','RAIN','STORM'];
 let index=Math.max(0,steps.indexOf(base));
 const j=SESSIONS.indexOf(stage),sign=(hash(c.id+':weather-trend')%2)?1:-1;
 if(j>0){
  // Cambios meteorológicos continuos y acotados entre sesiones.
  const shouldChange=hash(c.id+':shift:'+j)%4!==0;
  const direction=((hash(c.id+':dir:'+j)%5)===0?-sign:sign);
  index=Math.max(0,Math.min(5,steps.indexOf(previous)+ (shouldChange?direction:0)));
 }
 return steps[index];
}
function stateFor(ctx,create=false){
 const c=context(ctx),data=read();
 let event=data.events[c.id];
 if(!event&&create){
  event={version:VERSION,eventId:c.id,mode:c.mode,circuitId:c.dir,round:c.round,forecasts:{},sessions:{}};
  // No guardar cifras meteorológicas que el motor no proporciona.
  let prior=null;
  for(const stage of SESSIONS){const preset=forecastPreset(c,stage,prior);event.forecasts[stage]=preset;prior=preset}
  data.events[c.id]=event;
  const keys=Object.keys(data.events);if(keys.length>80)for(const old of keys.slice(0,keys.length-80))delete data.events[old];
  write(data);
 }
 return {c,data,event};
}
function ensure(ctx){const o=stateFor(ctx,true);return clone(o.event)}
function forecast(ctx,stage){
 if(!SESSIONS.includes(stage))throw Error('Sesión desconocida');
 const {event,c}=stateFor(ctx,true),preset=event.forecasts[stage];
 const prevIndex=SESSIONS.indexOf(stage)-1,previous=prevIndex>=0?event.forecasts[SESSIONS[prevIndex]]:null;
 const trend=previous===null?'Primera sesión':previous===preset?'Sin cambios previstos':
  ['CLEAR','PARTLY','OVERCAST','DRIZZLE','RAIN','STORM'].indexOf(preset)>
  ['CLEAR','PARTLY','OVERCAST','DRIZZLE','RAIN','STORM'].indexOf(previous)?'Tendencia a mayor humedad':'Tendencia a mejorar';
 const surface=['RAIN','STORM'].includes(preset)?'Mojada':preset==='DRIZZLE'?'Húmeda':'Probablemente seca';
 return {preset,previous,trend,surface,source:'SIMULATED_ESTIMATE',eventId:c.id};
}
function defaults(stage){
 const common={weatherSelection:'auto',compound:'MEDIUM'};
 if(stage.startsWith('fp'))return {...common,program:'balanced',targetLaps:null};
 if(stage==='qualifying')return {...common,strategy:'balanced',attempts:2};
 return {...common,strategy:'balanced',plannedStops:1,stints:[]};
}
function getPlan(ctx,stage){
 if(!SESSIONS.includes(stage))throw Error('Sesión desconocida');
 return {...defaults(stage),...(stateFor(ctx,true).event.sessions[stage]||{})};
}
function normalize(stage,patch,current){
 const next={...current};
 if(Object.hasOwn(patch,'weatherSelection')){
  const w=String(patch.weatherSelection);
  if(w==='auto'||PRESETS.includes(w))next.weatherSelection=w;
 }
 if(Object.hasOwn(patch,'compound')&&COMPOUNDS.includes(patch.compound))next.compound=patch.compound;
 if(stage.startsWith('fp')){
  if(PROGRAMS.includes(patch.program))next.program=patch.program;
  if(Object.hasOwn(patch,'targetLaps'))next.targetLaps=patch.targetLaps===null?null:
    Number.isInteger(Number(patch.targetLaps))&&Number(patch.targetLaps)>=1&&Number(patch.targetLaps)<=80?Number(patch.targetLaps):next.targetLaps;
 }else if(stage==='qualifying'){
  if(STYLES.includes(patch.strategy))next.strategy=patch.strategy;
  if(Number.isInteger(+patch.attempts)&&+patch.attempts>=1&&+patch.attempts<=8)next.attempts=+patch.attempts;
 }else{
  if(STYLES.includes(patch.strategy))next.strategy=patch.strategy;
  if(Number.isInteger(+patch.plannedStops)&&+patch.plannedStops>=0&&+patch.plannedStops<=3)next.plannedStops=+patch.plannedStops;
  if(Array.isArray(patch.stints)&&patch.stints.length<=4&&patch.stints.every(s=>s&&COMPOUNDS.includes(s.compound)&&
   (s.targetLap===null||(Number.isInteger(s.targetLap)&&s.targetLap>=1&&s.targetLap<=1000)))){
   next.stints=patch.stints.map(s=>({compound:s.compound,targetLap:s.targetLap}));
  }
 }
 return next;
}
function savePlan(ctx,stage,patch){
 if(!SESSIONS.includes(stage)||!patch||typeof patch!=='object')throw Error('Plan inválido');
 const {data,event}=stateFor(ctx,true);
 event.sessions[stage]=normalize(stage,patch,getPlan(ctx,stage));
 if(!write(data))throw Error('No se puede guardar el plan local');
 return clone(event.sessions[stage]);
}
function resolveForStart(ctx){
 const stage=ctx.session;if(!SESSIONS.includes(stage))return null;
 const p=getPlan(ctx,stage),f=forecast(ctx,stage);
 const weatherPreset=p.weatherSelection==='auto'?f.preset:p.weatherSelection;
 return {session:stage,weatherPreset,compound:p.compound,
  // Se informa un próximo compuesto únicamente si el jugador lo ha planificado.
  nextCompound:stage==='race'&&p.stints.length>1?p.stints[1].compound:null};
}
global.ApexSessionPlans9B=Object.freeze({version:VERSION,sessions:SESSIONS.slice(),ensure,forecast,getPlan,savePlan,resolveForStart,
 storageKey:KEY});
})(window);
