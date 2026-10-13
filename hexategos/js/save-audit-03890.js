'use strict';
// Auditoría final del guardado. Se carga al final de los módulos para que
// sus envoltorios incluyan también IA, diplomacia, mundo, gobierno y ejército.
(()=>{
  const KEY='hexategos.save-manifest.03890';
  const MODULES=[
    ['hexategos.production.0388','Industrias',x=>Array.isArray(x?.sites)],
    ['hexategos-trade-logistics-0370','Comercio',x=>Array.isArray(x?.routes)],
    ['hexategos.world-layers.03828','Capa física',x=>x&&typeof x.modules==='object'],
    ['hexategos-statecraft-0380','Gobierno y diplomacia',x=>Array.isArray(x?.cities)],
    ['hexategos-nation-ai-0360','IA nacional',x=>Array.isArray(x?.mindset)],
    ['hexategos-military-manpower-03874','Reclutamiento',x=>Array.isArray(x?.queues)],
    ['hexategos.regionalNames.0389','Toponimia',x=>Array.isArray(x?.nations)],
    ['hexategos-border-road-0376','Conexiones fronterizas',x=>Array.isArray(x?.links)],
    ['hexategos-infrastructure-decay-0373','Degradación',x=>x&&typeof x==='object'],
    ['hexategos-trade-geopolitics-0377','Geopolítica comercial',x=>x&&typeof x==='object'],
    ['hexategos.diplomacy-stability.03816','Treguas y estabilidad diplomática',x=>Array.isArray(x?.peaceUntil)]
  ];
  const PORTABLE=[
    ['main',x=>Array.isArray(x?.owner)&&Array.isArray(x?.roads)&&Array.isArray(x?.cities)],
    ['naval',x=>Array.isArray(x?.groups)],
    ['tradeLogistics0370',x=>Array.isArray(x?.routes)&&
      (!x.resources03720||x.resources03720.version<2||Array.isArray(x.resources03720.allNodes))],
    ['production0388',x=>Array.isArray(x?.sites)],
    ['worldLayers03828',x=>x&&typeof x.modules==='object'],
    ['statecraft0380',x=>Array.isArray(x?.cities)],
    ['nationAI0360',x=>Array.isArray(x?.mindset)],
    ['diplomacy',x=>x&&typeof x==='object'],
    ['regionalNames0389',x=>Array.isArray(x?.nations)],
    ['militaryManpower03874',x=>Array.isArray(x?.queues)],
    ['borderRoad0376',x=>Array.isArray(x?.links)],
    ['infrastructureDecay0373',x=>x&&typeof x==='object'],
    ['tradeGeopolitics0377',x=>x&&typeof x==='object'],
    ['diplomacyStability03816',x=>Array.isArray(x?.peaceUntil)]
  ];
  let lastError=null,lastExport=null,lastImport=null,lastSave=null;
  function inspectLocal(deep=true){
    const codec=window.HexategosSaveStorage03827;
    const missing=[],damaged=[],present=[];
    let manifest=null;
    try{manifest=JSON.parse(localStorage.getItem(KEY)||'null')}catch(error){damaged.push('Manifiesto de guardado')}
    for(const [key,label,valid] of MODULES){
      try{
        const raw=localStorage.getItem(key);
        if(raw===null){missing.push(label);continue}
        if(deep){
          const data=codec?.get?codec.get(key):JSON.parse(raw);
          if(!valid(data)){damaged.push(label);continue}
        }
        present.push(label);
      }catch(error){damaged.push(label)}
    }
    const main=typeof SAVE_KEY3230==='string'&&localStorage.getItem(SAVE_KEY3230)!==null;
    return {ok:main&&!missing.length&&!damaged.length,main,present,missing,damaged,
      manifest,manifestValid:manifest?.v===1&&Number(manifest.modules)>0&&Number(manifest.modules)<=MODULES.length,
      status:codec?.status?.()||null};
  }
  function inspectPortable(file,strict=false){
    const problems=[],p=file?.payload;
    if(!p||typeof p!=='object')return {ok:false,problems:['Archivo sin payload']};
    for(const [name,valid] of PORTABLE){
      const value=p[name];
      // Un archivo anterior a 0.38.90 puede no tener los últimos módulos.
      if(value==null){if(strict)problems.push('Falta '+name);continue}
      if(!valid(value))problems.push('Sección incorrecta: '+name);
    }
    return {ok:!problems.length,problems,sections:Object.keys(p).length};
  }
  function writeManifest(){
    const check=inspectLocal(false);
    if(!check.ok)throw new Error('Guardado auxiliar incompleto: '+[...check.missing,...check.damaged].join(', '));
    const m={v:1,modules:MODULES.length,campaignSeconds:Number(campaignSeconds3230)||0,at:Date.now()};
    const raw=JSON.stringify(m);
    localStorage.setItem(KEY,raw);
    if(localStorage.getItem(KEY)!==raw)throw new Error('El manifiesto de continuidad no se pudo escribir');
    return m;
  }
  if(typeof saveGame3212==='function'){
    const base=saveGame3212;
    saveGame3212=function(){
      const out=base.apply(this,arguments);
      if(out===false||!started3230)return out;
      try{lastSave=writeManifest();lastError=null}
      catch(error){lastError=String(error?.message||error);
        console.warn('[Hexategos guardado] No se ha confirmado la continuidad',error);
        if(typeof toast==='function')toast('No se ha confirmado el guardado completo. Exporta una copia.');
        return false}
      return out;
    };
  }
  if(typeof buildPortableFile3275==='function'){
    const base=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=base.apply(this,arguments);
      const check=inspectPortable(file,true);
      if(!check.ok){
        lastError='Exportación incompleta: '+check.problems.join('; ');
        throw new Error(lastError);
      }
      if(typeof fnv1a3273==='function')
        file.checksum=fnv1a3273(JSON.stringify(file.payload));
      lastExport={at:Date.now(),sections:check.sections,checksum:file.checksum};
      lastError=null;return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const base=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const check=inspectPortable(file,false);
      if(!check.ok){
        lastImport={ok:false,reason:check.problems.join('; ')};
        return false; // Sin alterar la partida activa.
      }
      const out=base.apply(this,arguments);
      if(out===false){lastImport={ok:false,reason:'El importador rechazó la copia'};return out}
      // Los archivos antiguos pueden carecer de módulos que ahora existen.
      // Después de aplicar todos los wrappers se genera una copia local
      // nueva y coherente en vez de reutilizar sidecars de otra partida.
      const stored=typeof saveGame3212==='function'?saveGame3212():false;
      lastImport={ok:true,locallySaved:stored!==false,sections:check.sections,at:Date.now()};
      if(stored===false){
        lastError='La partida se importó, pero no se ha podido confirmar su guardado local';
        if(typeof toast==='function')toast('Partida importada. Exporta un respaldo: guardado local incompleto.');
      }else lastError=null;
      return out;
    };
  }
  // Informe visible desde Opciones, sin botón flotante ni sondeo continuo.
  const optionsHost=document.getElementById('sysContent3213');
  if(optionsHost&&typeof renderSystems3220==='function'){
    const previousRender=renderSystems3220;
    renderSystems3220=function(){
      const out=previousRender.apply(this,arguments);
      if(typeof sysTab3220!=='string'||sysTab3220!=='settings')return out;
      if(!optionsHost.querySelector('[data-save-audit03890]')){
        const card=document.createElement('div');
        card.className='sysBlock3213 sysSaveAudit03890';
        card.setAttribute('data-save-audit03890','');
        card.innerHTML='<b>Integridad de partidas</b>'+
          '<p>Comprueba el guardado principal, las industrias, rutas, geología, ejército, IA y nombres antes de continuar o exportar.</p>'+
          '<button type="button" data-save-audit-run03890>Comprobar guardado del navegador</button>'+
          '<p data-save-audit-report03890 aria-live="polite">Comprobación bajo demanda, sin ralentizar la simulación.</p>';
        optionsHost.prepend(card);
      }
      return out;
    };
    optionsHost.addEventListener('click',event=>{
      if(!event.target.closest?.('[data-save-audit-run03890]'))return;
      event.preventDefault();
      const report=optionsHost.querySelector('[data-save-audit-report03890]');
      const status=inspectLocal(true);
      if(report)report.textContent=status.ok?
        'Guardado legible: '+status.present.length+' módulos y estado principal. '+
        (status.manifestValid?'Continuidad verificada.':'Copia antigua: guarda de nuevo para confirmar la continuidad.'):
        'ATENCIÓN: '+(!status.main?'falta el estado principal. ':'')+
        (status.missing.length?'Faltan: '+status.missing.join(', ')+'. ':'')+
        (status.damaged.length?'Dañados: '+status.damaged.join(', ')+'. ':'')+
        'No sobrescribas esta copia; exporta o importa un respaldo completo.';
    });
  }
  window.HexategosSaveAudit03890={
    inspectLocal,inspectPortable,
    status:()=>({local:inspectLocal(true),lastError,lastSave,lastExport,lastImport}),
    manifestKey:KEY,moduleKeys:MODULES.map(x=>x[0])
  };
  console.info('[HEXATEGOS] Auditoría de guardado y exportación completa activa');
})();
