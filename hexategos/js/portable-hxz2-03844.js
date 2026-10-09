'use strict';
/* Hexategos HXZ2 portable saves. Legacy JSON remains loadable unchanged.
 * HXZ2 magic + gzip bytes; the established importer receives verified JSON.
 */
(() => {
  const MAGIC=new Uint8Array([72,88,90,50,0]); // HXZ2\0
  const sameMagic=b=>MAGIC.every((x,i)=>b[i]===x);
  const codec=()=>window.pako;
  const decoder=new TextDecoder();
  const encoder=new TextEncoder();
  const formatDate=()=>new Date().toISOString().slice(0,16).replace(/[-:T]/g,'');
  let processing=false,lastError=null,lastBytes=null;
  async function gzipBytes(data) {
    // The bundled legacy Pako build does not expose gzip/ungzip.
    // Native streams are supported by modern Chromium and work with gzip.
    if(typeof CompressionStream==='function'){
      const stream=new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    if(typeof codec()?.gzip==='function')return codec().gzip(data,{level:6});
    throw new Error('Este navegador no dispone de compresión GZIP compatible');
  }
  async function gunzipBytes(data){
    if(typeof DecompressionStream==='function'){
      const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    if(typeof codec()?.ungzip==='function')return codec().ungzip(data);
    throw new Error('Este navegador no puede descomprimir archivos HXZ2');
  }
  async function archive(file) {
    if(!file?.payload)throw new Error('Datos incompletos para HXZ2');
    const json=JSON.stringify(file),raw=encoder.encode(json);
    const bytes=await gzipBytes(raw);
    const blob=new Blob([MAGIC,bytes],{type:'application/octet-stream'});
    lastBytes={original:raw.byteLength,compressed:blob.size,
      ratio:Number((blob.size/Math.max(1,raw.byteLength)).toFixed(3)),format:'HXZ2 gzip'};
    if(blob.size>=raw.byteLength)throw new Error('La compresión no ha reducido el tamaño de la partida');
    return blob;
  }
  function download(blob,name) {
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  async function exportNow() {
    if(processing)return false;
    processing=true;
    showLoading('Preparando los datos de la partida…');
    try {
      await yieldFrame();
      if(typeof buildPortableFile3275!=='function')
        throw new Error('No se encuentra el generador de partidas. Prueba con exportación clásica.');
      const file=buildPortableFile3275();
      if(!file?.payload)throw new Error('El guardado no contiene los datos del mundo');
      showLoading('Comprimiendo y guardando partida…');
      await yieldFrame();
      const blob=await archive(file);
      download(blob,'HEXATEGOS_'+formatDate()+'.hexategos');
      hideLoading();
      if(typeof toast==='function')toast('HXZ2 exportado · '+Math.round(blob.size/1024)+' KB');
      lastError=null;
      return true;
    }catch(error) {
      hideLoading();
      lastError=String(error?.message||error);
      console.error('[Hexategos HXZ2] Falló la exportación',error);
      alert('No se pudo exportar HXZ2: '+lastError+'\\nPuedes usar Exportar archivo clásico (JSON) para conservar una copia.');
      return false;
    }finally{processing=false}
  }
  // Dedicated explicit HXZ2 action. The classic JSON exporter remains available.
  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('#hxz2SaveDirect03847');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    void exportNow();
  },true);
  // Old JSON files bypass this listener entirely. New HXZ2 archives are
  // converted into a synthetic legacy File for the established importer.
  // Pantalla de progreso exclusiva de la exportación: la importación mantiene su diálogo original.
  let loadingOverlay=null;
  function showLoading(message){
    if(!loadingOverlay){
      loadingOverlay=document.createElement('div');
      loadingOverlay.id='hxz2-loading';
      loadingOverlay.setAttribute('role','status');
      loadingOverlay.setAttribute('aria-live','polite');
      loadingOverlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(3,11,21,.92);display:flex;align-items:center;justify-content:center;color:#e4edf6;font:16px system-ui,sans-serif;text-align:center';
      loadingOverlay.innerHTML='<div style="max-width:460px;padding:30px"><div style="font-size:22px;font-weight:700;margin-bottom:14px">Guardando partida</div><div id="hxz2-loading-message"></div><div style="margin-top:16px;font-size:12px;color:#aab8c6">No cierres esta ventana hasta que termine el guardado.</div></div>';
      document.body.appendChild(loadingOverlay);
    }
    loadingOverlay.querySelector('#hxz2-loading-message').textContent=message;
  }
  function hideLoading(){
    if(loadingOverlay){loadingOverlay.remove();loadingOverlay=null}
  }
  const yieldFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  const translated=new WeakSet();
  document.addEventListener('change',event=>{
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.files?.length)return;
    if(translated.has(input)){translated.delete(input);return}
    const selected=input.files[0];
    if(!/\.hexategos$/i.test(selected.name))return;
    event.stopImmediatePropagation();
    void (async()=>{
      try {
        const header=new Uint8Array(await selected.slice(0,MAGIC.length).arrayBuffer());
        if(!sameMagic(header)){
          // Reissue the original legacy file event without changing the file.
          translated.add(input);input.dispatchEvent(new Event('change',{bubbles:true}));
          return;
        }
        const bytes=new Uint8Array(await selected.arrayBuffer());
        const text=decoder.decode(await gunzipBytes(bytes.subarray(MAGIC.length)));
        const parsed=JSON.parse(text);
        if(!parsed||typeof parsed!=='object'||!parsed.payload)
          throw new Error('La copia HXZ2 está incompleta');
        const data=new DataTransfer();
        data.items.add(new File([text],selected.name,{type:'application/json'}));
        input.files=data.files;
        translated.add(input);input.dispatchEvent(new Event('change',{bubbles:true}));
      }catch(error) {
        lastError=String(error?.message||error);
        console.error('[Hexategos HXZ2] No se pudo importar',error);
        if(typeof toast==='function')toast('No se pudo abrir esta copia comprimida: '+lastError);
      }
    })();
  },true);
  window.HexategosPortableHXZ2={version:'2',export:exportNow,stats:()=>({lastBytes,lastError})};
})();
