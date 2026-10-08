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
  window.HexategosSaveIntegrity03827={
    inspect:()=>{
      const trade=window.HexategosTradeLogistics0370?.snapshot?.();
      const production=window.HexategosProduction0388?.snapshot?.();
      return {routes:trade?.routes?.length||0,industrySites:production?.sites?.length||0,
        tradeReady:Array.isArray(trade?.routes),industryReady:Array.isArray(production?.sites),
        storageError:window.HexategosSaveStorage03827?.status?.()||null};
    }
  };
})();
