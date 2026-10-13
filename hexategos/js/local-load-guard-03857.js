'use strict';
/* Never silently resume a campaign if modular local save components are absent
 * or corrupt. The portable import path remains unchanged and backward compatible. */
(()=>{
  const parts=[
    ['hexategos.production.0388','industrias especializadas',x=>Array.isArray(x?.sites)],
    ['hexategos-trade-logistics-0370','rutas comerciales y flotas',x=>Array.isArray(x?.routes)],
    ['hexategos.world-layers.03828','geografía, prospección y evaluaciones',x=>x&&typeof x==='object']
  ];
  function validate(){
    const codec=window.HexategosSaveStorage03827;
    const missing=[];
    for(const [key,label,isValid] of parts){
      try{
        const data=codec?.get?codec.get(key):JSON.parse(localStorage.getItem(key)||'null');
        if(!isValid(data))missing.push(label);
      }catch(error){
        missing.push(label);
        console.warn('[Hexategos] Componente de partida local ilegible:',key,error);
      }
    }
    return missing;
  }
  if(typeof loadGame3212!=='function')return;
  const base=loadGame3212;
  loadGame3212=function(){
    const missing=validate();
    const advanced=window.HexategosSaveAudit03890?.inspectLocal?.(true);
    const problems=advanced?.manifestValid?
      [...missing,...advanced.missing,...advanced.damaged,...(!advanced.main?['estado principal']:[])]:missing;
    if(advanced?.manifest&&!advanced.manifestValid)problems.push('manifiesto de continuidad');
    if(problems.length){
      // Compatibilidad: guardar una partida antes de la introducción de las
      // capas auxiliares no equivale a un guardado dañado. Solo se permite
      // migrar cuando TODAS las claves modulares están ausentes y el jugador
      // consiente expresamente, nunca ante una copia moderna parcial.
      const isLegacy=advanced&&advanced.main&&advanced.damaged.length===0&&
        ((!advanced.manifest&&missing.length===0)|| // Copia modular previa sin manifiesto.
         (!advanced.manifest&&advanced.present.length===0)|| // Guardado premodular.
         (advanced.manifestValid&&advanced.manifest.modules<
           window.HexategosSaveAudit03890.moduleKeys.length&&missing.length===0));
      if(isLegacy&&typeof window.confirm==='function'&&window.confirm(
        'Esta partida del navegador es antigua y no contiene las capas nuevas. '+
        'Puedes continuar migrándola, pero algunos sistemas empezarán con sus valores predeterminados. '+
        '¿Quieres continuar? Conserva antes una copia de seguridad si la tienes.')){
        return base.apply(this,arguments);
      }
      console.error('[Hexategos] Carga local incompleta:',[...new Set(problems)].join(', '));
      const message='No se puede continuar con seguridad: el guardado del navegador tiene componentes ausentes o dañados ('+
        [...new Set(problems)].join(', ')+').\\n\\nImporta tu archivo .hexategos completo para recuperar la partida. No se ha sobrescrito el guardado existente.';
      if(window.HexategosDialogs03851?.notice)
        void window.HexategosDialogs03851.notice(message,'Partida local incompleta');
      else console.warn(message);
      return false;
    }
    return base.apply(this,arguments);
  };
  window.HexategosLocalLoadGuard03857={validate};
})();
