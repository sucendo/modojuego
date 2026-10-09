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
  function archive(file) {
    if(!file?.payload||!codec()?.gzip)throw new Error('Compresión HXZ2 no disponible');
    const json=JSON.stringify(file);
    const bytes=codec().gzip(encoder.encode(json),{level:3});
    const blob=new Blob([MAGIC,bytes],{type:'application/octet-stream'});
    lastBytes={original:json.length,compressed:blob.size};
    return blob;
  }
  function download(blob,name) {
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  async function exportNow() {
    if(processing)return;
    processing=true;
    try {
      if(typeof buildPortableFile3275!=='function')throw new Error('Exportación de partida no disponible');
      // Let the overlay paint before serializing a very large campaign.
      await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
      const blob=archive(buildPortableFile3275());
      download(blob,'HEXATEGOS_'+formatDate()+'.hexategos');
      if(typeof toast==='function')toast('Partida HXZ2 comprimida exportada');
    }catch(error) {
      lastError=String(error?.message||error);
      console.error('[Hexategos HXZ2] Falló la exportación',error);
      if(typeof toast==='function')toast('No se pudo crear la copia HXZ2. Conserva la partida anterior.');
    }finally{processing=false}
  }
  // Capture before the existing export click listener to prevent two downloads.
  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('#fileSaveBtn3276');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    void exportNow();
  },true);
  // Old JSON files bypass this listener entirely. New HXZ2 archives are
  // converted into a synthetic legacy File for the established importer.
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
        if(!codec()?.ungzip)throw new Error('No se ha cargado el descompresor HXZ2');
        const text=decoder.decode(codec().ungzip(bytes.subarray(MAGIC.length)));
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
