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
    if(missing.length){
      console.error('[Hexategos] Se ha impedido una carga local parcial. Faltan: '+missing.join(', '));
      const message='No se puede continuar con seguridad: el guardado del navegador tiene componentes ausentes o dañados ('+
        missing.join(', ')+').\\n\\nImporta tu archivo .hexategos completo para recuperar la partida. No se ha sobrescrito el guardado existente.';
      if(window.HexategosDialogs03851?.notice)
        void window.HexategosDialogs03851.notice(message,'Partida local incompleta');
      else console.warn(message);
      return false;
    }
    return base.apply(this,arguments);
  };
  window.HexategosLocalLoadGuard03857={validate};
})();
