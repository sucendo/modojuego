'use strict';
/* Hexategos unified non-blocking browser replacement dialogs. */
(()=>{
 let modal=null,resolvePending=null;
 function close(answer){
  if(!modal)return;
  const el=modal;modal=null;el.remove();
  const done=resolvePending;resolvePending=null;done?.(!!answer);
 }
 function confirmDialog(message,opts={}){
  if(modal)close(false);
  return new Promise(resolve=>{
   resolvePending=resolve;
   const shade=document.createElement('div');
   shade.className='hexUnifiedDialog03851';
   shade.style.cssText='position:fixed;inset:0;z-index:2147483600;background:rgba(2,9,18,.78);display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;color:#e9f2f8';
   const panel=document.createElement('section');
   panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',opts.title||'Confirmar acción');
   panel.style.cssText='width:min(420px,100%);background:#102235;border:1px solid #33546b;border-radius:12px;padding:22px;box-shadow:0 20px 60px #0009';
   const title=document.createElement('h2');title.textContent=opts.title||'Confirmar acción';title.style.cssText='font-size:18px;margin:0 0 12px';
   const desc=document.createElement('p');desc.textContent=String(message);desc.style.cssText='font-size:14px;line-height:1.55;margin:0 0 20px;white-space:pre-wrap';
   const actions=document.createElement('div');actions.style.cssText='display:flex;justify-content:flex-end;gap:10px';
   const cancel=document.createElement('button');cancel.type='button';cancel.textContent=opts.cancel||'Cancelar';
   const ok=document.createElement('button');ok.type='button';ok.textContent=opts.accept||'Aceptar';
   for(const b of [cancel,ok])b.style.cssText='border:1px solid #476477;border-radius:7px;padding:9px 16px;background:#203b50;color:white;cursor:pointer;font:inherit';
   ok.style.background='#187b78';
   cancel.onclick=()=>close(false);ok.onclick=()=>close(true);
   actions.append(cancel,ok);panel.append(title,desc,actions);shade.append(panel);modal=shade;document.body.append(shade);
   shade.addEventListener('click',e=>{if(e.target===shade)close(false)});
   shade.addEventListener('keydown',e=>{
     if(e.key==='Escape'){e.preventDefault();close(false)}
     if(e.key==='Tab'){e.preventDefault();(document.activeElement===cancel?ok:cancel).focus()}
   });
   cancel.focus();
  });
 }
 function notice(message,title='Aviso'){
  return confirmDialog(message,{title,accept:'Cerrar',cancel:'Cerrar'});
 }
 // File-load approval must precede dispatch to the original import handlers.
 // The original loader may use a native synchronous confirm after FileReader
 // finishes; consume only load-specific confirms after explicit user approval.
 const approvedFiles=new WeakSet();
 let approvedUntil=0;
 const nativeConfirm=window.confirm.bind(window);
 window.confirm=function(message){
   const question=String(message||'');
   if(performance.now()<approvedUntil&&/(cargar|importar|restaurar|reemplazar|sobrescribir|sustituir)/i.test(question)
      &&/(partida|archivo|progreso|datos guardados|partida actual)/i.test(question)){
     approvedUntil=0;
     return true;
   }
   return nativeConfirm(message);
 };
 document.addEventListener('change',event=>{
   const input=event.target;
   if(!(input instanceof HTMLInputElement)||input.type!=='file'||!input.files?.length)return;
   if(input.id!=='landingFile3305'&&input.id!=='gameLoadFile3306')return;
   if(approvedFiles.has(input)){approvedFiles.delete(input);return}
   event.preventDefault();event.stopImmediatePropagation();
   const incoming=input.files[0];
   void confirmDialog('¿Cargar la partida seleccionada? Se sustituirá el estado actual por los datos del archivo.',{
     title:'Cargar partida',accept:'Cargar partida'
   }).then(ok=>{
     if(!ok){input.value='';return}
     approvedUntil=performance.now()+240000;
     approvedFiles.add(input);
     input.dispatchEvent(new Event('change',{bubbles:true}));
   });
 },true);
 window.HexategosDialogs03851={confirm:confirmDialog,notice};
})();
