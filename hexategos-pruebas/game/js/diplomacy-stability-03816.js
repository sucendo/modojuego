'use strict';
// HEXATEGOS 0.38.16 · no re-declarar guerras al reanudar una partida.
// La IA conserva agresividad y puede iniciar conflictos justificados, pero
// no recorre la misma apertura belicista al restaurar cada guardado.
(() => {
  const VERSION='0.38.16';
  const SAVE_KEY='hexategos.diplomacy-stability.03816';
  const RESUME_GRACE=90; // Segundos DE CAMPAÑA, no reloj del navegador.
  const NEW_WORLD_GRACE=75;
  const PEACE_COOLDOWN=210;
  const MAX_RECORDS=500;
  let resumingUntil=0;
  let newbornUntil=0;
  let peaceUntil=new Map();
  let suppressed=0,persistedWars=0,restored=0;
  const time=()=>Math.max(0,Number(campaignSeconds3230)||0);
  function copyCooldowns(data){
    peaceUntil.clear();
    if(!data||!Array.isArray(data.peaceUntil))return;
    for(const row of data.peaceUntil.slice(0,MAX_RECORDS)){
      if(!Array.isArray(row))continue;
      const f=Number(row[0]),until=Number(row[1]);
      if(Number.isInteger(f)&&f>0&&f<activeFactionCount3230&&Number.isFinite(until)&&until>time())
        peaceUntil.set(f,until);
    }
  }
  const snapshot=()=>({v:1,peaceUntil:[...peaceUntil]});
  function store(){
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(snapshot()))}catch(_){}
  }
  function recover(){
    let data=null;
    try{data=JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch(_){}
    copyCooldowns(data);
  }
  // La copia básica conserva las relaciones con el jugador y todos los
  // demás sistemas poseen sus guardados. Sincronizar inmediatamente
  // una declaración o una paz evita revivir el mismo conflicto si el
  // usuario sale antes del siguiente autoguardado (hasta 25 s).
  function persistDiplomaticChange(){
    if(!started3230)return;
    try{saveGame3212();persistedWars++}catch(err){
      console.warn('[HEXATEGOS 0.38.16] no se pudo guardar la diplomacia',err);
    }
    store();
  }
  function isAutomaticPlayerWar(a,b,v){
    return Number(a)>0&&Number(b)===0&&Number(v)===-1;
  }
  function justifiedWar(f){
    // Una personalidad oportunista y un ejército grande NO bastan para
    // atacar al jugador. Exigir frontera y un agravio diplomático real.
    const border=typeof dipBorder3300==='function'?dipBorder3300(f,0):0;
    const opinion=typeof dipOpinionOf3300==='function'?dipOpinionOf3300(f,0):0;
    const trust=typeof dipTrustOf3300==='function'?dipTrustOf3300(f,0):50;
    return border>0&&(opinion<=-32||trust<28||(opinion<=-16&&trust<=43));
  }
  function canInitiatePlayerWar(f){
    const now=time();
    if(now<Math.max(resumingUntil,newbornUntil))return false;
    if(now<(peaceUntil.get(f)||0))return false;
    return justifiedWar(f);
  }
  const baseRelation=setDiplomaticRelation3300;
  setDiplomaticRelation3300=function(a,b,value){
    const f=Number(a),enemy=Number(b),v=Number(value);
    const before=typeof diplomaticRelation3300==='function'?
      diplomaticRelation3300(f,enemy):0;
    if(before!==-1&&isAutomaticPlayerWar(f,enemy,v)&&!canInitiatePlayerWar(f)){
      suppressed++;
      return false;
    }
    // Una relación en guerra no necesita volver a emitir una declaración.
    if(before===v)return true;
    const result=baseRelation.apply(this,arguments);
    const after=typeof diplomaticRelation3300==='function'?
      diplomaticRelation3300(f,enemy):before;
    if((f===0&&enemy>0)||(f>0&&enemy===0)){
      const opponent=f===0?enemy:f;
      if(before===-1&&after!==-1){
        peaceUntil.set(opponent,time()+PEACE_COOLDOWN);
        persistDiplomaticChange();
      }else if(before!==-1&&after===-1){
        // Estado de guerra oficial ya registrado, sin reabrirlo al cargar.
        peaceUntil.delete(opponent);
        persistDiplomaticChange();
      }
    }
    return result;
  };
  const baseLoad=loadGame3212;
  loadGame3212=function(){
    const ok=baseLoad.apply(this,arguments);
    if(ok){
      recover();
      resumingUntil=time()+RESUME_GRACE;
      newbornUntil=0;
      restored++;
    }
    return ok;
  };
  if(typeof buildCustomWorld3302==='function'){
    const baseNewWorld=buildCustomWorld3302;
    buildCustomWorld3302=function(){
      const ok=baseNewWorld.apply(this,arguments);
      if(ok){
        peaceUntil.clear();
        resumingUntil=0;
        newbornUntil=time()+NEW_WORLD_GRACE;
        store();
      }
      return ok;
    };
  }
  const baseReset=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=baseReset.apply(this,arguments);
    peaceUntil.clear();resumingUntil=0;newbornUntil=0;
    if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(_){}
    return out;
  };
  if(typeof buildPortableFile3275==='function'){
    const basePortable=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=basePortable.apply(this,arguments);
      if(file?.payload){
        file.payload.diplomacyStability03816=snapshot();
        if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload));
      }
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const baseApply=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const result=baseApply.apply(this,arguments);
      if(result!==false){
        copyCooldowns(file?.payload?.diplomacyStability03816||null);
        resumingUntil=time()+RESUME_GRACE;
        newbornUntil=0;
        store();restored++;
      }
      return result;
    };
  }
  window.HexategosDiplomacyStability03816={
    version:VERSION,
    status:()=>({
      suppressed,persistedWars,restored,
      graceRemaining:Math.max(0,Math.ceil(Math.max(resumingUntil,newbornUntil)-time())),
      peaceCooldowns:peaceUntil.size
    }),
    allowedForAI:f=>canInitiatePlayerWar(Number(f)),
    cooldown:f=>Math.max(0,Math.ceil((peaceUntil.get(Number(f))||0)-time()))
  };
  console.info('[HEXATEGOS] '+VERSION+' · guardado inmediato de guerras y treguas, estabilidad tras cargar.');
})();