'use strict';
/* HEXATEGOS PRUEBAS 0.38.94 — Importación de bajo pico de memoria.
 * En el marco de GitHub Pages, Chromium puede impedir confirm() y abortar
 * la carga aunque el archivo sea válido. Elegir el archivo es la acción
 * explícita del usuario; el estado solo se sustituye tras validación.
 * No cambia el formato HXZ2 ni las partidas guardadas.
 */
(() => {
  if(typeof importGameText3273!=='function' ||
     typeof validatePortablePayload3275!=='function' ||
     typeof applyPortableFile3275!=='function')return;
  const original=importGameText3273;
  let imports=0,legacy=0,lastError=null;
  importGameText3273=function(text,filename='partida.hexategos'){
    // Un único parseo del JSON grande: antes el cargador geográfico
    // parseaba, reserializaba y volvía a parsear todo el mundo.
    let file;
    try{file=JSON.parse(text)}
    catch(error){throw new Error('El archivo no contiene JSON válido')}
    if(!file||typeof file!=='object')throw new Error('Formato de partida incorrecto');
    if(file?.payload?.main?.owner?.length===163842){
      // La migración de mallas antiguas sigue el camino existente.
      legacy++;return original.call(this,text,filename);
    }
    // Las validaciones terminan ANTES de alterar el estado de campaña.
    validatePortablePayload3275(file);
    if(typeof window.HexategosSaveAudit03890?.inspectPortable==='function'){
      const checked=window.HexategosSaveAudit03890.inspectPortable(file,false);
      if(!checked.ok)throw new Error('Partida incompleta: '+checked.problems.join(', '));
    }
    try{
      const result=applyPortableFile3275(file);
      if(result===false)throw new Error('La partida fue rechazada por el restaurador');
      imports++;lastError=null;
      if(typeof portableStatus3275!=='undefined')portableStatus3275='Cargada: '+filename;
      if(typeof toast==='function')toast('Partida importada · simulación en pausa');
      if(typeof sysTab3220!=='undefined'&&sysTab3220==='settings'&&typeof renderSystems3220==='function')
        renderSystems3220();
      return true;
    }catch(error){
      lastError=String(error?.message||error);
      throw error;
    }
  };
  window.HexategosImporter03894=Object.freeze({
    version:'0.38.94',status:()=>({imports,legacy,lastError})
  });
})();