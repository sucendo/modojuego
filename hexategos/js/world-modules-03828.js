'use strict';
/* HEXATEGOS 0.38.28 · Registro y ciclo de vida de futuras capas naturales.
   No cambia la simulación actual: módulos registrados explícitamente,
   estado versionado, eventos acotados y pasos con presupuesto temporal. */
(() => {
  const VERSION='0.38.28', SAVE_KEY='hexategos.world-modules.03828';
  const MAX_PENDING_EVENTS=128, MAX_EVENT_TYPES=24, MAX_JOBS=16;
  const modules=new Map(),jobs=new Map(),listeners=new Map(),events=[];
  const orphanStates=new Map();
  let cursor=0,revision=0,lastError=null;
  const clock=()=>performance.now();
  const logError=(label,error)=>{
    lastError={label,message:String(error?.message||error)};
    console.warn('[Hexategos módulos] '+label,error);
  };
  function register(name,api){
    if(typeof name!=='string'||!/^[a-z][a-z0-9-]{0,39}$/.test(name))
      throw new Error('Identificador de módulo no válido');
    if(modules.has(name))throw new Error('Módulo duplicado: '+name);
    if(!api||typeof api!=='object')throw new Error('API de módulo inválida');
    if((api.snapshot||api.restore)&&
      (typeof api.snapshot!=='function'||typeof api.restore!=='function'))
      throw new Error('snapshot y restore deben declararse conjuntamente');
    const schema=Number(api.schemaVersion??1);
    if(!Number.isInteger(schema)||schema<1||schema>1024)
      throw new Error('Versión de esquema no válida');
    const entry={...api,schemaVersion:schema};
    modules.set(name,entry);
    if(orphanStates.has(name)){
      const saved=orphanStates.get(name);orphanStates.delete(name);
      loadOne(name,entry,saved);
    }
    revision++;
    return Object.freeze({name,schemaVersion:schema});
  }
  function loadOne(name,entry,record){
    if(!entry.restore)return;
    try{
      const oldVersion=Number(record?.schemaVersion)||1;
      let value=record?.state??null;
      if(value!==null&&oldVersion!==entry.schemaVersion){
        if(typeof entry.migrate==='function')
          value=entry.migrate(value,oldVersion,entry.schemaVersion);
        else if(oldVersion>entry.schemaVersion)
          throw new Error('Esquema futuro desconocido de '+name);
      }
      entry.restore(value);
    }catch(error){
      logError('Restauración de '+name,error);
      // Nunca sobrescribir una copia que no hemos podido migrar.
      orphanStates.set(name,record);
    }
  }
  function snapshot(){
    const data={v:1,modules:{}};
    for(const [name,value] of orphanStates)data.modules[name]=value;
    for(const [name,api] of modules)if(api.snapshot){
      data.modules[name]={
        schemaVersion:api.schemaVersion,state:api.snapshot()
      };
    }
    return data;
  }
  function restore(data){
    const states=data?.modules&&typeof data.modules==='object'?data.modules:{};
    orphanStates.clear();
    for(const [name,record] of Object.entries(states)){
      if(!modules.has(name))orphanStates.set(name,record);
    }
    for(const [name,api] of modules)loadOne(name,api,states[name]??null);
    revision++;
  }
  function localRead(){
    const codec=window.HexategosSaveStorage03827;
    return codec?.get?codec.get(SAVE_KEY):
      JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
  }
  function persist(){
    const data=snapshot(),codec=window.HexategosSaveStorage03827;
    if(codec?.set)return codec.set(SAVE_KEY,data);
    try{
      localStorage.setItem(SAVE_KEY,JSON.stringify(data));return true;
    }catch(error){logError('Guardado local',error);return false}
  }
  function addJob(name,run){
    if(typeof run!=='function'||jobs.has(name)||jobs.size>=MAX_JOBS)
      throw new Error('Trabajo inválido o duplicado: '+name);
    jobs.set(name,run);
    return ()=>{jobs.delete(name);cursor=0};
  }
  function on(type,listener){
    if(typeof type!=='string'||typeof listener!=='function')
      throw new Error('Evento inválido');
    if(!listeners.has(type)){
      if(listeners.size>=MAX_EVENT_TYPES)throw new Error('Demasiados eventos');
      listeners.set(type,new Set());
    }
    listeners.get(type).add(listener);
    return ()=>listeners.get(type)?.delete(listener);
  }
  function emit(type,detail){
    if(!listeners.has(type))return false;
    if(events.length>=MAX_PENDING_EVENTS)events.shift();
    events.push({type,detail});
    return true;
  }
  function step(info={}){
    const started=clock(),limit=Math.max(.1,Math.min(3,Number(info.budgetMs)||1.2));
    const deadline=started+limit;
    let jobsRun=0,eventsSent=0;
    // Round-robin incremental work; callers own their per-module cursor.
    const entries=[...jobs.entries()];
    while(entries.length&&jobsRun<entries.length&&clock()<deadline){
      const [name,fn]=entries[cursor%entries.length];
      cursor=(cursor+1)%entries.length;jobsRun++;
      try{fn({deadline,now:Number(info.now)||0,budgetMs:Math.max(0,deadline-clock())})}
      catch(error){logError('Scheduler '+name,error)}
    }
    while(events.length&&clock()<deadline&&eventsSent<16){
      const event=events.shift();eventsSent++;
      for(const listener of listeners.get(event.type)||[]){
        try{listener(event.detail)}
        catch(error){logError('Evento '+event.type,error)}
      }
    }
    return {jobsRun,eventsSent,pendingEvents:events.length,elapsedMs:clock()-started};
  }
  // Iniciar/restaurar a través del mismo mecanismo del resto de subsistemas.
  const baseSave=saveGame3212;
  saveGame3212=function(){
    const result=baseSave.apply(this,arguments);
    if(result!==false&&started3230&&modules.size)persist();
    return result;
  };
  const baseLoad=loadGame3212;
  loadGame3212=function(){
    let saved=null;
    try{saved=localRead()}catch(error){logError('Lectura local',error)}
    const result=baseLoad.apply(this,arguments);
    if(result!==false)restore(saved);
    return result;
  };
  const baseReset=resetGame3230;
  resetGame3230=function(clearSave=true){
    const result=baseReset.apply(this,arguments);
    restore(null);
    if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(error){logError('Limpieza',error)}
    return result;
  };
  if(typeof buildPortableFile3275==='function'){
    const base=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=base.apply(this,arguments);
      if(file?.payload){
        file.payload.worldModules03828=snapshot();
        if(typeof fnv1a3273==='function')
          file.checksum=fnv1a3273(JSON.stringify(file.payload));
      }
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const base=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const result=base.apply(this,arguments);
      if(result!==false){
        // Las partidas antiguas parten de estado vacío; no heredan estudios
        // o descubrimientos de otra campaña.
        restore(file?.payload?.worldModules03828||null);
        if(modules.size)persist();
      }
      return result;
    };
  }
  window.HexategosModules03828=Object.freeze({
    version:VERSION,register,addJob,on,emit,step,snapshot,restore,persist,
    status:()=>({modules:[...modules.keys()],jobs:[...jobs.keys()],
      pendingEvents:events.length,revision,error:lastError})
  });
})();
