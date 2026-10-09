'use strict';
/* HEXATEGOS 0.38.27: persistent sidecars, compact and backward-compatible.
   HXZ1 is only an on-device localStorage encoding. Portable files remain JSON. */
(() => {
  const PREFIX='HXZ1:';
  let lastError=null;
  const failedKeys=new Set();
  let failureNoticeShown=false;
  function encode(data){
    const json=JSON.stringify(data);
    const codec=window.pako;
    if(json.length<1500||!codec?.deflate||typeof btoa!=='function')return json;
    try{
      const bytes=codec.deflate(json,{level:5});
      const parts=[];
      for(let i=0;i<bytes.length;i+=16384)
        parts.push(String.fromCharCode(...bytes.subarray(i,i+16384)));
      const packed=PREFIX+btoa(parts.join(''));
      return packed.length<json.length*.90?packed:json;
    }catch(error){
      console.warn('[Hexategos] Error al comprimir guardado; se usa JSON compatible',error);
      return json;
    }
  }
  function decode(raw){
    if(raw==null)return null;
    if(!raw.startsWith(PREFIX))return JSON.parse(raw);
    if(!window.pako?.inflate||typeof atob!=='function')
      throw new Error('Esta copia necesita el descompresor incluido en Hexategos');
    const binary=atob(raw.slice(PREFIX.length));
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return JSON.parse(window.pako.inflate(bytes,{to:'string'}));
  }
  function set(key,value){
    try{
      const encoded=encode(value);
      localStorage.setItem(key,encoded);
      if(localStorage.getItem(key)!==encoded)throw new Error('La escritura no se ha confirmado');
      if(lastError?.key===key)lastError=null;
      failedKeys.delete(key);
      if(!failedKeys.size)failureNoticeShown=false;
      return true;
    }catch(error){
      lastError={key,message:String(error?.message||error),at:Date.now()};
      if(!failedKeys.has(key))
        console.warn('[Hexategos] El navegador no ha guardado '+key+'. Exporta la partida como respaldo.',error);
      failedKeys.add(key);
      // Un solo aviso por episodio de fallo, no uno cada 20/60 segundos.
      if(!failureNoticeShown&&typeof toast==='function'){
        failureNoticeShown=true;
        toast('⚠ El navegador no ha podido guardar todos los datos. Exporta una copia .hexategos.');
      }
      return false;
    }
  }
  function get(key){
    const raw=localStorage.getItem(key);
    return raw==null?null:decode(raw);
  }
  window.HexategosSaveStorage03827={
    set,get,encode,decode,status:()=>failedKeys.size?
      {keys:[...failedKeys],...(lastError||{})}:null,
    prefix:PREFIX
  };
})();
