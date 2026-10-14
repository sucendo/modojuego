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
  // A successful main save must be readable in both legacy JSON and the
  // compact HXZ1 format. Warn once per continuous failure, not every autosave.
  let mainError=null,lastMainCheck=0,mainAlertShown=false;
  let lastSaveMs=0,lastVerifyMs=0,totalSaves=0,checks=0;
  if(typeof saveGame3212==='function'){
    const originalSave=saveGame3212;
    saveGame3212=function(){
      const startedAt=performance.now();
      const out=originalSave.apply(this,arguments);
      lastSaveMs=performance.now()-startedAt;totalSaves++;
      if(!started3230)return out;
      const now=Date.now();
      // La escritura individual ya confirma su contenido; una lectura
      // completa comprimida cada 12 s bloquearía campañas grandes.
      if(out!==false&&now-lastMainCheck<60000)return out;
      lastMainCheck=now;
      const verifyAt=performance.now();
      try{
        if(out===false)throw new Error('La escritura del guardado principal ha fallado');
        if(typeof SAVE_KEY3230!=='string')return out;
        const raw=localStorage.getItem(SAVE_KEY3230);
        const codec=window.HexategosSaveStorage03827;
        const data=raw?(codec?.get?codec.get(SAVE_KEY3230):JSON.parse(raw)):null;
        if(!data||data.owner?.length!==owner6.length||
          Math.abs((Number(data.campaignSeconds)||0)-(Number(campaignSeconds3230)||0))>.001)
          throw new Error('El estado principal no se ha actualizado en el navegador');
        mainError=null;mainAlertShown=false;
      }catch(error){
        mainError={message:String(error?.message||error),at:now};
        if(!mainAlertShown){
          mainAlertShown=true;
          console.warn('[Hexategos] Guardado principal incompleto; exporta una copia.',error);
          // The compact storage module already shows one warning when the
          // write fails. Avoid a second overlapping toast for the same error.
          const alreadyNotified=window.HexategosSaveStorage03827?.status?.()?.keys
            ?.includes(SAVE_KEY3230);
          if(!alreadyNotified&&typeof toast==='function')
            toast('⚠ La partida no se ha guardado por completo. Exporta una copia .hexategos.');
        }
      }
      finally{lastVerifyMs=performance.now()-verifyAt;checks++}
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
        mainError,performance:{lastSaveMs:Number(lastSaveMs.toFixed(1)),lastVerifyMs:Number(lastVerifyMs.toFixed(1)),saves:totalSaves,checks}};
    }
  };
})();
