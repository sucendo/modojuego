'use strict';
/* HEXATEGOS 0.38.28 · Núcleo mínimo de capas del mundo.
   Registro único, persistencia versionada, bus de eventos y ejecución presupuestada.
   No genera recursos ni modifica la economía, el mapa o las partidas existentes. */
(() => {
  const VERSION='0.38.28', SCHEMA=1;
  const SAVE_KEY='hexategos.world-layers.03828';
  const modules=new Map(), listeners=new Map();
  const MAX_EVENT_LISTENERS=32, DEFAULT_BUDGET_MS=1.5;
  let cursor=0, lastRestore=null, restoredOnce=false;
  let lastError=null, lastTickStats={steps:0,ran:0,elapsedMs:0};
  const now=()=>typeof performance!=='undefined'&&performance.now?
    performance.now():Date.now();

  function moduleId(id){
    if(typeof id!=='string'||!/^[-a-z][a-z0-9-]{1,63}$/.test(id))
      throw new TypeError('Identificador de módulo no válido');
    return id;
  }
  function register(spec){
    if(!spec||typeof spec!=='object')throw new TypeError('Definición de módulo necesaria');
    const id=moduleId(spec.id);
    if(modules.has(id))throw new Error('Módulo duplicado: '+id);
    const persistent=typeof spec.snapshot==='function'||typeof spec.restore==='function';
    if(persistent&&(typeof spec.snapshot!=='function'||typeof spec.restore!=='function'))
      throw new TypeError(id+': snapshot y restore son obligatorios conjuntamente');
    if(spec.tick!=null&&typeof spec.tick!=='function')
      throw new TypeError(id+': tick debe ser una función');
    const version=Number(spec.schemaVersion??1);
    if(!Number.isSafeInteger(version)||version<1)
      throw new TypeError(id+': schemaVersion debe ser positivo');
    const entry=Object.freeze({
      id,schemaVersion:version,persistent,
      snapshot:spec.snapshot,restore:spec.restore,migrate:spec.migrate,
      tick:spec.tick
    });
    modules.set(id,entry);
    if(restoredOnce&&persistent){
      try{restoreOne(entry,lastRestore?.modules?.[id]||null)}
      catch(error){
        lastError={phase:'late-register',module:id,message:String(error)};
        console.warn('[Hexategos mundo] No se ha podido restaurar '+id,error);
      }
    }
    return entry;
  }
  function snapshot(){
    const result={version:SCHEMA,modules:{}};
    for(const entry of modules.values()){
      if(!entry.persistent)continue;
      const state=entry.snapshot();
      // Los módulos nuevos guardan sólo datos dinámicos, nunca arrays por hexágono.
      result.modules[entry.id]={schema:entry.schemaVersion,data:state??null};
    }
    return result;
  }
  function validate(state){
    if(state==null)return true; // partida anterior sin capas nuevas
    if(!state||typeof state!=='object'||Array.isArray(state))
      throw new Error('Estado de capas del mundo inválido');
    const version=Number(state.version||1);
    if(version>SCHEMA)throw new Error('El guardado requiere un núcleo de mundo más reciente');
    if(state.modules!=null&&(typeof state.modules!=='object'||Array.isArray(state.modules)))
      throw new Error('Registro de módulos inválido');
    for(const entry of modules.values()){
      const payload=state.modules?.[entry.id];
      if(!entry.persistent||payload==null)continue;
      const savedSchema=Number(payload.schema||1);
      if(!Number.isSafeInteger(savedSchema)||savedSchema<1)
        throw new Error('Esquema inválido para '+entry.id);
      if(savedSchema>entry.schemaVersion)
        throw new Error('El módulo '+entry.id+' necesita una versión más reciente');
      if(savedSchema<entry.schemaVersion&&typeof entry.migrate!=='function')
        throw new Error('Falta migración de '+entry.id+' '+savedSchema+' → '+entry.schemaVersion);
    }
    return true;
  }
  function restoreOne(entry,payload){
    if(!entry.persistent)return;
    if(!payload){entry.restore(null);return}
    const old=Number(payload.schema||1);
    const data=old===entry.schemaVersion?payload.data:
      entry.migrate(payload.data,old,entry.schemaVersion);
    entry.restore(data??null);
  }
  function restore(state){
    validate(state);
    lastRestore=state??null;restoredOnce=true;
    for(const entry of modules.values())restoreOne(entry,state?.modules?.[entry.id]||null);
    return true;
  }
  function readLocal(){
    const codec=window.HexategosSaveStorage03827;
    if(codec?.get)return codec.get(SAVE_KEY);
    const text=localStorage.getItem(SAVE_KEY);
    return text?JSON.parse(text):null;
  }
  function writeLocal(state){
    const codec=window.HexategosSaveStorage03827;
    if(codec?.set)return codec.set(SAVE_KEY,state);
    localStorage.setItem(SAVE_KEY,JSON.stringify(state));
    return true;
  }
  function persist(){
    if(!Array.from(modules.values()).some(m=>m.persistent))return true;
    try{
      if(!writeLocal(snapshot()))throw new Error('Escritura de capas no confirmada');
      lastError=null;return true;
    }catch(error){
      lastError={phase:'save',message:String(error?.message||error)};
      console.warn('[Hexategos mundo] Error al guardar capas naturales',error);
      return false;
    }
  }
  function readAndRestore(){
    try{
      const state=readLocal();
      return restore(state);
    }catch(error){
      lastError={phase:'load',message:String(error?.message||error)};
      console.warn('[Hexategos mundo] No se ha podido cargar el registro',error);
      return false;
    }
  }
  function on(event,listener){
    if(typeof event!=='string'||!/^[a-z][A-Za-z0-9]{1,63}$/.test(event))
      throw new TypeError('Nombre de evento no válido');
    if(typeof listener!=='function')throw new TypeError('Listener no válido');
    let set=listeners.get(event);
    if(!set){set=new Set();listeners.set(event,set)}
    if(set.size>=MAX_EVENT_LISTENERS&&!set.has(listener))
      throw new Error('Demasiados listeners para '+event);
    set.add(listener);
    return ()=>{set.delete(listener);if(!set.size)listeners.delete(event)};
  }
  function emit(event,data){
    const set=listeners.get(event);
    if(!set)return 0;
    let notified=0;
    for(const listener of [...set]){
      try{listener(data);notified++}catch(error){
        console.warn('[Hexategos mundo] Evento '+event+' falló',error);
      }
    }
    return notified;
  }
  function step(dt,budgetMs=DEFAULT_BUDGET_MS){
    const active=[...modules.values()].filter(m=>typeof m.tick==='function');
    if(!active.length)return {ran:0,elapsedMs:0,steps:0};
    const start=now(),budget=Math.max(0,Math.min(8,Number(budgetMs)||0));
    let ran=0,steps=0;
    while(steps<active.length&&(steps===0||now()-start<budget)){
      const entry=active[cursor%active.length];
      cursor=(cursor+1)%active.length;steps++;
      try{entry.tick({dt,deadline:start+budget,remainingMs:Math.max(0,budget-(now()-start))});ran++}
      catch(error){
        lastError={phase:'tick',module:entry.id,message:String(error)};
        console.warn('[Hexategos mundo] Error en tick '+entry.id,error);
      }
    }
    lastTickStats={steps,ran,elapsedMs:now()-start};
    return {...lastTickStats};
  }

  // Una sola capa de integración para todas las futuras capas.
  // Los sistemas antiguos mantienen sus envoltorios y claves anteriores.
  if(typeof saveGame3212==='function'){
    const base=saveGame3212;
    saveGame3212=function(){
      const result=base.apply(this,arguments);
      if(result!==false&&typeof started3230!=='undefined'&&started3230)persist();
      return result;
    };
  }
  if(typeof loadGame3212==='function'){
    const base=loadGame3212;
    loadGame3212=function(){
      // La carga general puede reinicializar subsistemas, se restaura al final.
      let local=null,readable=true;
      try{local=readLocal()}catch(error){readable=false;console.warn('[Hexategos mundo] Guardado auxiliar ilegible',error)}
      const result=base.apply(this,arguments);
      if(result!==false&&readable){
        try{restore(local)}catch(error){lastError={phase:'load',message:String(error)};
          console.warn('[Hexategos mundo] Restauración fallida',error)}
      }
      return result;
    };
  }
  if(typeof resetGame3230==='function'){
    const base=resetGame3230;
    resetGame3230=function(clearSave=true){
      const result=base.apply(this,arguments);
      restore(null);
      if(clearSave){
        try{localStorage.removeItem(SAVE_KEY)}catch(error){
          console.warn('[Hexategos mundo] No se pudo limpiar el guardado auxiliar',error);
        }
        // Semilla nueva únicamente al comenzar otra partida; nunca al cargar
        // ni al cambiar el dueño de un territorio.
        emit('worldNewGame',{});
      }
      return result;
    };
  }
  if(typeof buildPortableFile3275==='function'){
    const base=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=base.apply(this,arguments);
      if(!file?.payload)throw new Error('El archivo de partida no tiene payload');
      file.payload.worldLayers03828=snapshot();
      if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload));
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const base=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const state=file?.payload?.worldLayers03828||null;
      validate(state); // Rechazar incompatibilidades antes de modificar la partida.
      const result=base.apply(this,arguments);
      if(result!==false){
        restore(state);
        if(state)persist();
        else try{localStorage.removeItem(SAVE_KEY)}catch(_){}
      }
      return result;
    };
  }
  if(typeof economyTick3212==='function'){
    const base=economyTick3212;
    economyTick3212=function(){
      const before=typeof campaignSeconds3230==='number'?campaignSeconds3230:0;
      const result=base.apply(this,arguments);
      const after=typeof campaignSeconds3230==='number'?campaignSeconds3230:before;
      if(after>before&&typeof started3230!=='undefined'&&started3230){
        step(Math.min(8,after-before));
      }
      return result;
    };
  }
  window.HexategosWorldCore03828=Object.freeze({
    version:VERSION,schemaVersion:SCHEMA,register,snapshot,restore,validate,
    persist,readAndRestore,on,emit,step,
    list:()=>[...modules.values()].map(m=>({id:m.id,schemaVersion:m.schemaVersion,
      persistent:m.persistent,scheduled:typeof m.tick==='function'})),
    diagnostics:()=>({lastError,lastTick:{...lastTickStats},modules:modules.size})
  });
})();
