'use strict';
/* Hexategos 0.38.27: portable save integrity for trade + specialized industry.
   Never silently offer an incomplete .hexategos file. */
(() => {
  if(typeof buildPortableFile3275!=='function')return;
  const original=buildPortableFile3275;
  buildPortableFile3275=function(){
    const file=original.apply(this,arguments);
    const trade=window.HexategosTradeLogistics0370?.snapshot?.();
    const production=window.HexategosProduction0388?.snapshot?.();
    if(!file?.payload||!Array.isArray(trade?.routes)||!Array.isArray(production?.sites)){
      throw new Error('Exportación incompleta: no se ha podido incluir comercio e industrias.');
    }
    // Read the current in-memory state, not potentially stale localStorage.
    file.payload.tradeLogistics0370=trade;
    file.payload.production0388=production;
    if(typeof fnv1a3273==='function')
      file.checksum=fnv1a3273(JSON.stringify(file.payload));
    return file;
  };
  // The legacy main save swallows storage exceptions. Detect a failed
  // main snapshot rather than allowing "Partida guardada" to mislead players.
  let mainError=null,lastMainCheck=0;
  if(typeof saveGame3212==='function'){
    const originalSave=saveGame3212;
    saveGame3212=function(){
      const out=originalSave.apply(this,arguments);
      if(!started3230)return out;
      const now=Date.now();
      if(now-lastMainCheck<12000)return out;
      lastMainCheck=now;
      try{
        if(typeof SAVE_KEY3230!=='string')return out;
        const raw=localStorage.getItem(SAVE_KEY3230);
        const data=raw?JSON.parse(raw):null;
        if(!data||data.owner?.length!==owner6.length||
          Math.abs((Number(data.campaignSeconds)||0)-(Number(campaignSeconds3230)||0))>.001)
          throw new Error('El estado principal no se ha actualizado en el navegador');
        mainError=null;
      }catch(error){
        mainError={message:String(error?.message||error),at:now};
        console.warn('[Hexategos] Guardado principal incompleto; exporta una copia.',error);
        if(typeof setTimeout==='function'&&typeof toast==='function')
          setTimeout(()=>toast('⚠ La partida NO se ha guardado por completo. Exporta un archivo .hexategos.'),60);
      }
      return out;
    };
  }
  window.HexategosSaveIntegrity03827={
    inspect:()=>{
      const trade=window.HexategosTradeLogistics0370?.snapshot?.();
      const production=window.HexategosProduction0388?.snapshot?.();
      return {routes:trade?.routes?.length||0,industrySites:production?.sites?.length||0,
        tradeReady:Array.isArray(trade?.routes),industryReady:Array.isArray(production?.sites),
        storageError:window.HexategosSaveStorage03827?.status?.()||null,
        mainError};
    }
  };
})();
