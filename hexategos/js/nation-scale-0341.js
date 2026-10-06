'use strict';

// HEXATEGOS 0.34.1 · selector de escala política.
// El motor mantiene 500 slots permanentes; cada partida decide cuántos activa.
(() => {
  const PREF_KEY='hexategos-newgame-faction-count-0341';
  let pendingCount=activeFactionCount3230;

  function ensureNationScaleUI0341(){
    const card=document.querySelector('#newGameSetup3302 .newGameSetupCard3302');
    if(!card||document.getElementById('nationScale0341'))return;

    const host=document.createElement('div');
    host.id='nationScale0341';
    host.className='nationScale0341';
    host.innerHTML=
      '<div class="nationScaleTitle0341"><b>NACIONES</b><span id="nationScaleValue0341"></span></div>'+
      '<div class="nationScaleBtns0341">'+
        FACTION_COUNT_OPTIONS3230.map(n=>'<button type="button" data-nations0341="'+n+'">'+n+'</button>').join('')+
      '</div>'+
      '<div id="nationScaleHint0341" class="nationScaleHint0341"></div>';

    const selection=document.getElementById('setupSelection3302');
    if(selection)card.insertBefore(host,selection);
    else card.appendChild(host);

    host.addEventListener('click',e=>{
      const b=e.target.closest('[data-nations0341]');
      if(!b)return;
      pendingCount=normalizeFactionCount3230(Number(b.dataset.nations0341));
      try{localStorage.setItem(PREF_KEY,String(pendingCount))}catch(_){}
      renderNationScale0341();
    });

    if(!document.getElementById('nationScaleStyle0341')){
      const style=document.createElement('style');
      style.id='nationScaleStyle0341';
      style.textContent=
        '.nationScale0341{margin:10px 0 12px;padding:10px;border:1px solid rgba(255,255,255,.13);border-radius:8px;background:rgba(4,10,17,.34)}'+
        '.nationScaleTitle0341{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px;font-size:12px;letter-spacing:.08em}'+
        '.nationScaleTitle0341 span{opacity:.72;font-size:11px;letter-spacing:0}'+
        '.nationScaleBtns0341{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}'+
        '.nationScaleBtns0341 button{min-width:0;padding:8px 4px;font-weight:800;cursor:pointer}'+
        '.nationScaleBtns0341 button.active0341{outline:2px solid currentColor;outline-offset:-2px}'+
        '.nationScaleHint0341{margin-top:7px;font-size:11px;line-height:1.35;opacity:.72}'+
        '@media(max-width:620px){.nationScaleBtns0341{gap:4px}.nationScaleBtns0341 button{padding:7px 2px;font-size:11px}}';
      document.head.appendChild(style);
    }
  }

  function renderNationScale0341(){
    ensureNationScaleUI0341();
    const value=document.getElementById('nationScaleValue0341');
    const hint=document.getElementById('nationScaleHint0341');
    if(value)value.textContent=pendingCount+' naciones';
    document.querySelectorAll('[data-nations0341]').forEach(b=>{
      const active=Number(b.dataset.nations0341)===pendingCount;
      b.classList.toggle('active0341',active);
      b.setAttribute('aria-pressed',active?'true':'false');
    });
    if(hint){
      const mode=pendingCount===150?'escala amplia y más ligera':
                 pendingCount===250?'escala continental densa':
                 pendingCount===350?'escala mundial grande':'escala mundial máxima';
      hint.textContent=pendingCount+' naciones · '+mode+'. Cada estado comienza con su capital y el primer anillo terrestre.';
    }
    const meta=document.querySelector('#newGameSetup3302 .newGameSetupMeta3302');
    if(meta)meta.textContent='Las otras '+(pendingCount-1)+' naciones aparecerán separadas por el mundo. Todas usan las mismas reglas, sistemas y capacidades.';
  }

  const baseBeginNewGame0341=beginNewGameSetup3302;
  beginNewGameSetup3302=function(origin='intro'){
    // Never alter the active campaign merely by opening the setup.
    pendingCount=FACTION_COUNT_OPTIONS3230.includes(activeFactionCount3230)?activeFactionCount3230:150;
    const r=baseBeginNewGame0341.apply(this,arguments);
    renderNationScale0341();
    return r;
  };

  const baseBuildCustomWorld0341=buildCustomWorld3302;
  buildCustomWorld3302=function(playerCell){
    const previous=activeFactionCount3230;
    activeFactionCount3230=normalizeFactionCount3230(pendingCount);
    const ok=baseBuildCustomWorld0341.apply(this,arguments);
    if(!ok)activeFactionCount3230=previous;
    if(ok){
      try{localStorage.setItem(PREF_KEY,String(activeFactionCount3230))}catch(_){}
      if(window.HexategosDiplomacyNetwork3301?.markDirty)
        window.HexategosDiplomacyNetwork3301.markDirty();
    }
    return ok;
  };

  function nationScaleStats0341(){
    let alive=0,maxOwner=-1;
    if(typeof owner6!=='undefined'&&owner6?.length){
      const seen=new Uint8Array(FACTION_CAPACITY3230);
      for(let i=0;i<owner6.length;i++){
        const f=owner6[i];
        if(f>=0&&f<seen.length){seen[f]=1;if(f>maxOwner)maxOwner=f}
      }
      for(let f=0;f<activeFactionCount3230;f++)alive+=seen[f]?1:0;
    }
    let storedCount=null,storedDipMatrix=null;
    try{
      const raw=localStorage.getItem(SAVE_KEY3230);
      if(raw)storedCount=normalizeFactionCount3230(JSON.parse(raw)?.factionCount??150);
      const dr=localStorage.getItem(DIP_SAVE_KEY3300);
      if(dr){
        const d=JSON.parse(dr),len=Array.isArray(d?.relations)?d.relations.length:0;
        storedDipMatrix=Number(d?.matrixSize)||Math.round(Math.sqrt(len||0))||null;
      }
    }catch(_){}
    return {
      capacity:FACTION_CAPACITY3230,
      active:activeFactionCount3230,
      pending:pendingCount,
      alive,
      maxOwner,
      storedCount,
      diplomacyMatrix:storedDipMatrix,
      options:FACTION_COUNT_OPTIONS3230.slice()
    };
  }

  function validateNationScale0341(){
    const errors=[],st=nationScaleStats0341();
    if(!FACTION_COUNT_OPTIONS3230.includes(activeFactionCount3230)&&
       !(typeof LEGACY_FACTION_COUNT_OPTIONS3230!=='undefined'&&LEGACY_FACTION_COUNT_OPTIONS3230.includes(activeFactionCount3230)))
      errors.push('activeFactionCount no permitido');
    if(FACTIONS3230.length!==FACTION_CAPACITY3230)
      errors.push('capacidad de FACTIONS inconsistente');
    if(troops3230.length!==FACTION_CAPACITY3230||botGold3230.length!==FACTION_CAPACITY3230)
      errors.push('arrays militares no tienen capacidad 500');
    if(relations3220.length!==FACTION_CAPACITY3230)
      errors.push('vector de relaciones jugador no tiene capacidad 500');
    if(DIP_F3300!==FACTION_CAPACITY3230)
      errors.push('matriz diplomática no tiene capacidad 500');
    if(st.maxOwner>=activeFactionCount3230)
      errors.push('hay territorios asignados a una nación inactiva');
    return {ok:errors.length===0,errors,stats:st};
  }

  // Add scale information to the existing debug chain, without timers/observers.
  const baseDebug0341=debug3230;
  debug3230=function(){
    baseDebug0341.apply(this,arguments);
    const e=document.getElementById('debugText3230');if(!e||!showDebug3230)return;
    const st=nationScaleStats0341();
    e.textContent+='\nEscala v0.34.1 · '+st.active+'/'+st.capacity+' plazas · vivas '+st.alive+
      ' · save '+(st.storedCount??'—')+' · matriz dip '+(st.diplomacyMatrix??'—');
  };

  if(window.HexategosDiag033?.snapshot){
    const baseSnapshot0341=window.HexategosDiag033.snapshot.bind(window.HexategosDiag033);
    window.HexategosDiag033.snapshot=function(){
      const out=baseSnapshot0341();
      out.nationScale=nationScaleStats0341();
      return out;
    };
  }

  window.HexategosNationScale0341={
    stats:nationScaleStats0341,
    validate:validateNationScale0341,
    setPending(n){pendingCount=normalizeFactionCount3230(n);renderNationScale0341();return pendingCount},
    get pending(){return pendingCount}
  };

  ensureNationScaleUI0341();
  renderNationScale0341();
  console.info('[HEXATEGOS] Escala política 0.34.1 activa · HexategosNationScale0341.validate()');
})();
