// HEXATEGOS Stable Rebuild 8 · mensajes dentro de Sistemas por secciones.
// Sin MutationObserver y sin temporizadores periódicos.
(() => {
  'use strict';
  const BUILD='8';
  const DURATION=5000;
  const MAX_POPUPS=2;
  const MAX_LOG=36;
  const REPEAT_NOTICE_MS=300000;
  const dismissedSignatures=new Map();
  const POPUP_GAP_MS=45000;
  const PREF='hexategos.messages.quiet.0387';
  let quiet=true; // Por defecto todos los avisos van al registro, sin ventanas flotantes.
  try{quiet=localStorage.getItem(PREF)!=='0'}catch(_){}
  let lastPopupWall=-1e9;
  const toastDedup=new Map();
  const systemsBtn=document.getElementById('systemsBtn3213');
  const optionsBtn=document.getElementById('optionsBtnStable6');
  const tabs=document.querySelector('.sysTabs3213');
  const systemsPanel=document.getElementById('systemsPanel3213');
  let focusMessageKey='';
  let focusMessageTab='dip';
  let nextNoticeId=1;
  let lastToastSignature='';
  let lastToastWall=0;
  const notices=[];

  // Ajustes pertenece exclusivamente al botón ⚙ Opciones.
  document.querySelector('.sysTabs3213 button[data-tab="settings"]')?.remove();
  if(optionsBtn){
    optionsBtn.dataset.badge='';
    optionsBtn.classList.remove('hasMessagesStable7','hasMessagesStable8');
    optionsBtn.setAttribute('aria-label','Opciones');
  }

  function esc(s){
    return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function offerLabel(type){
    return type==='trade'?'Acuerdo comercial':
      type==='nap'?'Pacto de no agresión':
      type==='alliance'?'Alianza':'Tratado de paz';
  }
  function liveOffers(){
    if(typeof dipOffers3300==='undefined')return [];
    const now=typeof campaignSeconds3230==='number'?campaignSeconds3230:0;
    return dipOffers3300.filter(o=>o&&o.expires>now);
  }
  function tabForOffer(o){return o?.type==='trade'?'eco':'dip'}
  function tabForNotice(n){
    if(n?.tab)return n.tab;
    return n?.type==='economy'||n?.type==='trade'?'eco':
      n?.type==='research'?'research':n?.type==='intel'?'intel':
      n?.type==='naval'?'naval':n?.type==='government'?'government':'dip';
  }
  function tabLabel(tab){
    return tab==='eco'?'Economía':tab==='research'?'I+D':tab==='intel'?'Inteligencia':
      tab==='naval'?'Naval':tab==='government'?'Gobierno':tab==='military'?'Militar':'Diplomacia';
  }
  function noticeSignature(type,message,tab){return String(type)+'|'+String(tab)+'|'+String(message||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('es')}
  function dismissNotice(id){
    const i=notices.findIndex(n=>n.id===Number(id));
    if(i<0)return false;
    const n=notices[i];
    dismissedSignatures.set(noticeSignature(n.type,n.message,n.tab),Date.now());
    notices.splice(i,1);updateBadges();return true;
  }
  function addNotice(type,message,meta={}){
    const tab=meta.tab||tabForNotice({type});
    const sig=noticeSignature(type,message,tab);
    const now=Date.now();
    if(dismissedSignatures.size>150){for(const [k,t] of dismissedSignatures)if(now-t>REPEAT_NOTICE_MS)dismissedSignatures.delete(k)}
    if(now-(dismissedSignatures.get(sig)||0)<REPEAT_NOTICE_MS)return null;
    const recent=notices.find(n=>noticeSignature(n.type,n.message,n.tab)===sig&&now-n.created<REPEAT_NOTICE_MS);
    if(recent){recent.repeats=(recent.repeats||1)+1;return recent;}
    const n={id:nextNoticeId++,type:type||'info',message:String(message||''),created:now,read:false,tab,...meta};
    notices.unshift(n);
    if(notices.length>MAX_LOG)notices.length=MAX_LOG;
    updateBadges();
    return n;
  }
  function pendingByTab(){
    const counts={dip:0,eco:0,research:0,intel:0,government:0,military:0,naval:0};
    for(const o of liveOffers()) counts[tabForOffer(o)]++;
    for(const n of notices) if(!n.read) counts[tabForNotice(n)]=(counts[tabForNotice(n)]||0)+1;
    return counts;
  }
  function updateBadges(){
    const counts=pendingByTab();
    const total=Object.values(counts).reduce((a,b)=>a+b,0);
    if(systemsBtn){
      systemsBtn.dataset.badge=total?String(Math.min(total,99)):'';
      systemsBtn.classList.toggle('hasMessagesStable8',total>0);
      systemsBtn.setAttribute('aria-label',total?`Sistemas · ${total} mensajes pendientes`:'Sistemas');
    }
    tabs?.querySelectorAll('button[data-tab]').forEach(b=>{
      const n=counts[b.dataset.tab]||0;
      b.dataset.badge=n?String(Math.min(n,99)):'';
      b.classList.toggle('hasMessagesStable8',n>0);
    });
  }

  // -------------------------------------------------------------------
  // Inserción de mensajes en la pestaña correspondiente.
  // -------------------------------------------------------------------
  function markCoreDiplomaticOffers(){
    if(typeof sysTab3220==='undefined'||sysTab3220!=='dip')return;
    const c=document.getElementById('sysContent3213');if(!c)return;
    const offers=liveOffers();
    const cards=[...c.querySelectorAll('.dipOffer3300')];
    for(const card of cards){
      const accept=card.querySelector('button[onclick*="acceptDiplomaticOffer3300"]');
      const m=(accept?.getAttribute('onclick')||'').match(/acceptDiplomaticOffer3300\((\d+)\)/);
      const id=m?Number(m[1]):0;
      const o=offers.find(x=>x.id===id);
      if(!o)continue;
      if(o.type==='trade'){
        card.remove();
      }else{
        card.dataset.messageKey='offer-'+o.id;
        card.classList.add('messageTargetStable8');
        if(!card.querySelector('[data-view-offer]')){
          const actions=card.querySelector('.acts,.messageActionsStable8')||card;
          const view=document.createElement('button');view.type='button';view.textContent='VER';view.dataset.viewOffer=String(o.id);
          view.addEventListener('click',e=>{e.preventDefault();viewOffer(o)});
          actions.prepend(view);
        }
      }
    }
    [...c.querySelectorAll('.sysBlock3213')].forEach(block=>{
      const title=(block.querySelector(':scope>b')?.textContent||'').trim();
      if(title.includes('Propuestas recibidas')&&!block.querySelector('.dipOffer3300'))block.remove();
    });
  }

  // Navegación contextual: primero hexágono explícito; si no, capital de la nación.
  function locationOf(meta){
    const cell=Number(meta?.cell);
    if(Number.isInteger(cell)&&cell>=0&&cell<owner6.length)return cell;
    const f=Number(meta?.faction??meta?.from);
    if(Number.isInteger(f)&&f>=0&&f<activeFactionCount3230){
      const cap=capitals?.[f];
      if(Number.isInteger(cap)&&cap>=0&&cap<owner6.length)return cap;
    }
    return -1;
  }
  function viewLocation(meta,tab='dip',key=''){
    const cell=locationOf(meta);
    if(cell<0){openMessage(tab,key);return false}
    if(typeof closeSystems3220==='function')closeSystems3220();
    if(typeof closeContextDialog3244==='function')closeContextDialog3244();
    const geo=cellLonLat3302(cell);
    const coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
    rotateToGeo3243(geo.lon,geo.lat,coarse?7:6);
    selected={key:MAX_GAME_LEVEL3233,i:cell};
    if(typeof uiInteractionState3244!=='undefined')uiInteractionState3244.selectedCell=cell;
    if(typeof updatePanel==='function')updatePanel();
    needsRender=true;
    return true;
  }
  function viewNotice(n,tab,key){
    if(n&&!n.requestKind){n.read=true;updateBadges()}
    return viewLocation(n,tab,key);
  }
  function viewOffer(o){return viewLocation({faction:o.from},tabForOffer(o),'offer-'+o.id)}
  function makeOfferCard(o){
    const art=document.createElement('article');
    art.className='messageCardStable8 offerStable8';
    art.dataset.messageKey='offer-'+o.id;
    art.innerHTML=`
      <div class="messageIconStable8">🤝</div>
      <div class="messageBodyStable8">
        <b>${esc(factionName3230(o.from))}</b>
        <div class="messageTitleStable8">${esc(offerLabel(o.type))}</div>
        <div class="sysMeta3213">${esc(o.reason||'Propuesta diplomática')} · responde antes de que caduque.</div>
        <div class="messageActionsStable8">
          <button type="button" data-view-offer="${o.id}">VER</button>
          <button class="good" data-accept-offer="${o.id}">ACEPTAR</button>
          <button data-reject-offer="${o.id}">RECHAZAR</button>
        </div>
      </div>`;
    art.querySelector('[data-view-offer]')?.addEventListener('click',()=>viewOffer(o));
    art.querySelector('[data-accept-offer]')?.addEventListener('click',()=>{
      if(typeof acceptDiplomaticOffer3300==='function')acceptDiplomaticOffer3300(o.id);
      focusMessageKey='';updateBadges();
      if(typeof sysTab3220!=='undefined')sysTab3220=tabForOffer(o);
      renderSystems3220();
    });
    art.querySelector('[data-reject-offer]')?.addEventListener('click',()=>{
      if(typeof rejectDiplomaticOffer3300==='function')rejectDiplomaticOffer3300(o.id);
      focusMessageKey='';updateBadges();
      if(typeof sysTab3220!=='undefined')sysTab3220=tabForOffer(o);
      renderSystems3220();
    });
    return art;
  }

  function injectTradeOffers(){
    if(typeof sysTab3220==='undefined'||sysTab3220!=='eco')return;
    const c=document.getElementById('sysContent3213');if(!c)return;
    const offers=liveOffers().filter(o=>o.type==='trade');
    if(!offers.length)return;
    const block=document.createElement('div');
    block.className='sysBlock3213 messagesSectionStable8';
    block.innerHTML=`<div class="messagesHeadStable8"><div><b>📨 Propuestas comerciales</b><div class="sysMeta3213">Acuerdos comerciales recibidos de otras naciones.</div></div><span>${offers.length}</span></div>`;
    offers.forEach(o=>block.appendChild(makeOfferCard(o)));
    c.prepend(block);
  }

  function injectNoticesForCurrentTab(){
    if(typeof sysTab3220==='undefined'||sysTab3220==='settings')return;
    const tab=sysTab3220;
    if(tab==='dip'){
      // Recuperar solicitudes que siguen pendientes aunque el historial
      // de avisos se haya truncado o se haya cargado otra partida.
      for(const pending of window.HexategosStatecraft0380?.pendingEmbassies?.()||[]){
        if(!notices.some(n=>n.requestKind==='embassy'&&Number(n.faction)===pending.f))
          addNotice('diplomacy',factionName3230(pending.f)+' solicita establecer una embajada',
            {tab:'dip',requestKind:'embassy',faction:pending.f});
      }
    }
    const c=document.getElementById('sysContent3213');if(!c)return;
    // Una renderización encadenada puede conservar la tarjeta anterior.
    // Mantener una sola sección de avisos para la pestaña activa.
    c.querySelectorAll(':scope > .noticesStable8').forEach(node=>node.remove());
    const all=notices.filter(n=>tabForNotice(n)===tab);
    // Las solicitudes pendientes se muestran antes que los avisos ordinarios.
    const pending=n=>n.requestKind==='embassy'&&
      window.HexategosStatecraft0380?.embassyStatus?.(0,Number(n.faction))?.status==='pending'&&
      window.HexategosStatecraft0380?.embassyStatus?.(0,Number(n.faction))?.requestedBy===Number(n.faction);
    const list=[...all].sort((a,b)=>Number(pending(b))-Number(pending(a))||b.created-a.created).slice(0,4);
    if(!list.length)return;
    const block=document.createElement('div');
    block.className='sysBlock3213 messagesSectionStable8 noticesStable8';
    block.innerHTML=`<div class="messagesHeadStable8"><div><b>🔔 Avisos · ${tabLabel(tab)}</b><div class="sysMeta3213">Registro tranquilo · ${all.length} eventos · máximo 4 visibles</div></div><span>${all.filter(n=>!n.read).length} nuevos</span></div>`;
    const readAll=document.createElement('button');
    readAll.type='button';readAll.className='sysBtn3213';
    readAll.textContent='Marcar todos como leídos';
    readAll.addEventListener('click',()=>{
      for(const n of all)n.read=true;
      updateBadges();renderSystems3220();
    });
    block.appendChild(readAll);
    for(const n of list){
      const art=document.createElement('article');
      art.className='messageCardStable8 '+(n.read?'readStable8':'');
      art.dataset.messageKey='notice-'+n.id;
      const icon=n.type==='war'?'⚔':n.type==='attack'?'!':n.type==='naval'?'⚓':n.type==='intel'?'🕵':'•';
      const request=pending(n);
      art.innerHTML=`<div class="messageIconStable8">${icon}</div><div class="messageBodyStable8"><b>${request?'SOLICITUD':n.type==='war'?'CONFLICTO':n.type==='attack'?'ATAQUE':'AVISO'}</b><div class="messageTitleStable8">${esc(n.message)}</div><div class="messageActionsStable8"><button type="button" data-view-notice="${n.id}">VER</button>${request?`<button type="button" class="good" data-answer-embassy="accept">ACEPTAR</button><button type="button" data-answer-embassy="reject">RECHAZAR</button>`:`<button data-read-notice="${n.id}">${n.read?'LEÍDO':'ENTENDIDO'}</button>`}<button type="button" data-dismiss-notice="${n.id}" aria-label="Eliminar aviso" title="Eliminar aviso">×</button></div></div>`;
      art.querySelector('[data-view-notice]')?.addEventListener('click',()=>viewNotice(n,tab,'notice-'+n.id));
      art.querySelectorAll('[data-answer-embassy]').forEach(b=>b.addEventListener('click',()=>{
        const accept=b.dataset.answerEmbassy==='accept';
        const ok=window.HexategosStatecraft0380?.answerEmbassyPlayer?.(Number(n.faction),accept);
        if(ok)dismissNotice(n.id);
        updateBadges();renderSystems3220();
      }));
      art.querySelector('[data-read-notice]')?.addEventListener('click',()=>{n.read=true;updateBadges();renderSystems3220()});
      art.querySelector('[data-dismiss-notice]')?.addEventListener('click',()=>{dismissNotice(n.id);renderSystems3220()});
      block.appendChild(art);
    }
    c.prepend(block);
  }

  function focusCurrentMessage(){
    if(!focusMessageKey)return;
    // El foco "VER" es una orden de navegación que se consume UNA SOLA VEZ.
    // Antes quedaba guardada para siempre y cada renderizado de Sistemas
    // ejecutaba de nuevo scrollIntoView(smooth), desplazando el panel solo.
    const key=focusMessageKey;
    focusMessageKey='';
    requestAnimationFrame(()=>{
      const el=document.querySelector(`[data-message-key="${CSS.escape(key)}"]`);
      if(!el||!document.getElementById('sysContent3213')?.contains(el))return;
      el.classList.add('messageFocusStable8');
      // Sin animación que pueda solaparse con una actualización o un gesto.
      el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
      setTimeout(()=>el.classList.remove('messageFocusStable8'),1200);
    });
  }

  const baseRender=renderSystems3220;
  renderSystems3220=function(){
    const v=baseRender.apply(this,arguments);
    try{
      markCoreDiplomaticOffers();
      injectTradeOffers();
      injectNoticesForCurrentTab();
      updateBadges();
      focusCurrentMessage();
    }catch(err){console.warn('[HEXATEGOS Stable8 render messages]',err)}
    return v;
  };

  function openMessage(tab,key){
    focusMessageTab=tab||'dip';
    focusMessageKey=key||'';
    if(key?.startsWith('notice-')){
      const id=Number(key.slice(7)),n=notices.find(x=>x.id===id);if(n)n.read=true;
    }
    updateBadges();
    openSystems3220(focusMessageTab);
    focusCurrentMessage();
  }

  // -------------------------------------------------------------------
  // Popups de cinco segundos. VER lleva a Sistemas, no a Opciones.
  // -------------------------------------------------------------------
  let stack=document.getElementById('eventStackStable8');
  if(!stack){
    stack=document.createElement('div');
    stack.id='eventStackStable8';
    stack.setAttribute('aria-live','polite');
    stack.setAttribute('aria-label','Mensajes importantes');
    document.body.appendChild(stack);
  }
  function closePopup(card){
    if(!card||card.dataset.closing==='1')return;
    card.dataset.closing='1';clearTimeout(card._timerStable8);card.classList.add('closingStable8');
    setTimeout(()=>card.remove(),160);
  }
  function showPopup(type,message,tab,key='',meta=null){
    // No mostrar ventanas por cada suceso de la simulación. Las propuestas
    // permanecen en Sistemas con su contador y sus botones de aceptar.
    if(quiet)return;
    const now=Date.now();
    if(now-lastPopupWall<POPUP_GAP_MS)return;
    lastPopupWall=now;
    const current=[...stack.querySelectorAll('.eventCardStable8:not(.closingStable8)')];
    if(current.length>=MAX_POPUPS)closePopup(current[0]);
    const card=document.createElement('div');
    card.className='eventCardStable8';card.dataset.type=type;
    const title=type==='offer'?'PROPUESTA':type==='war'?'DECLARACIÓN DE GUERRA':type==='attack'?'ATAQUE EN CURSO':'AVISO';
    const icon=type==='offer'?'🤝':type==='war'?'⚔':type==='attack'?'!':'•';
    card.innerHTML=`<div class="eventIconStable8">${icon}</div><div class="eventBodyStable8"><b>${title}</b><div>${esc(message)}</div><small>${esc(tabLabel(tab))}</small></div><div class="eventActionsStable8"><button class="viewStable8">VER</button><button class="closeStable8">CERRAR</button></div>`;
    card.querySelector('.viewStable8')?.addEventListener('click',()=>{
      if(meta&&locationOf(meta)>=0)viewLocation(meta,tab,key);
      else if(key?.startsWith('offer-')){
        const o=liveOffers().find(x=>x.id===Number(key.slice(6)));
        if(o)viewOffer(o);else openMessage(tab,key);
      }else if(key?.startsWith('notice-')){
        const n=notices.find(x=>x.id===Number(key.slice(7)));
        if(n)viewNotice(n,tab,key);else openMessage(tab,key);
      }else openMessage(tab,key);
      closePopup(card)
    });
    if(type==='offer'&&key?.startsWith('offer-')){
      const offer=liveOffers().find(x=>x.id===Number(key.slice(6)));
      if(offer){
        const bar=card.querySelector('.eventActionsStable8');
        for(const [label,accept] of [['ACEPTAR',true],['RECHAZAR',false]]){
          const button=document.createElement('button');
          button.type='button';button.textContent=label;button.className=accept?'good':'';
          button.addEventListener('click',()=>{
            if(accept&&typeof acceptDiplomaticOffer3300==='function')acceptDiplomaticOffer3300(offer.id);
            if(!accept&&typeof rejectDiplomaticOffer3300==='function')rejectDiplomaticOffer3300(offer.id);
            closePopup(card);updateBadges();
            if(typeof sysTab3220!=='undefined'&&(sysTab3220==='dip'||sysTab3220==='eco'))renderSystems3220();
          });
          bar?.appendChild(button);
        }
      }
    }
    if(meta?.requestKind==='embassy'){
      const bar=card.querySelector('.eventActionsStable8');
      for(const [label,accept] of [['ACEPTAR',true],['RECHAZAR',false]]){
        const button=document.createElement('button');
        button.textContent=label;button.type='button';button.className=accept?'good':'';
        button.addEventListener('click',()=>{
          const ok=window.HexategosStatecraft0380?.answerEmbassyPlayer?.(Number(meta.faction),accept);
          if(ok&&key?.startsWith('notice-'))dismissNotice(Number(key.slice(7)));
          closePopup(card);updateBadges();
          if(typeof sysTab3220!=='undefined'&&sysTab3220==='dip')renderSystems3220();
        });
        bar?.appendChild(button);
      }
    }
    card.querySelector('.closeStable8')?.addEventListener('click',()=>closePopup(card));
    stack.appendChild(card);card._timerStable8=setTimeout(()=>closePopup(card),DURATION);
  }

  function latestOffer(){
    const offers=liveOffers();return offers.length?offers.reduce((a,b)=>a.id>b.id?a:b):null;
  }
  function classifyToast(text){
    const s=String(text||'').toLocaleLowerCase('es');
    if(/oferta diplomática|propuesta diplomática/.test(s))return 'offer';
    if(/declara la guerra|declaración de guerra|guerra con/.test(s))return 'war';
    if(/bajo ataque|ataque enemigo|te atac|nos atac|invad/.test(s))return 'attack';
    return '';
  }
  function inferredNation(message){
    const text=String(message||'').toLocaleLowerCase('es');
    let best=-1,length=0;
    // Solo al registrar un suceso, jamás durante el dibujado o cada frame.
    for(let f=1;f<activeFactionCount3230;f++){
      const name=String(factionName3230(f)||'');
      if(name.length>length&&name.length>=6&&text.includes(name.toLocaleLowerCase('es'))){
        best=f;length=name.length;
      }
    }
    return best>=0?{faction:best}:{};
  }
  const baseToast=toast;
  toast=function(msg){
    const type=classifyToast(msg);
    const now=Date.now(),sig=type+'|'+String(msg);
    const seen=toastDedup.get(sig)||-1e9;
    // Conservar feedback de acciones manuales; suprimir toasts repetidos
    // de guerras/ataques que los bots emiten al revisar el mismo evento.
    const repetitive=!!type&&now-seen<REPEAT_NOTICE_MS;
    if(type){
      if(toastDedup.size>128)toastDedup.clear();
      toastDedup.set(sig,now);
    }
    const v=(!repetitive&&!quiet)||!type?baseToast.apply(this,arguments):undefined;
    try{
      if(typeof balanceAuditRunning3276!=='undefined'&&balanceAuditRunning3276)return v;
      if(!type||repetitive)return v;
      lastToastSignature=sig;lastToastWall=now;
      if(type==='offer'){
        const o=latestOffer();
        if(o){
          const tab=tabForOffer(o);
          showPopup('offer',`${factionName3230(o.from)} · ${offerLabel(o.type)}`,tab,'offer-'+o.id,{faction:o.from});
          updateBadges();
        }else showPopup('offer',msg,'dip','');
      }else{
        const n=addNotice(type,msg,{tab:'dip',...inferredNation(msg)});
        if(n)showPopup(type,msg,'dip','notice-'+n.id,n);
      }
    }catch(err){console.warn('[HEXATEGOS Stable8 notifications]',err)}
    return v;
  };

  // Captura directa de una declaración formal contra el jugador por si el
  // evento no genera toast. addNotice deduplica si ambos caminos coinciden.
  if(typeof setDiplomaticRelation3300==='function'&&typeof diplomaticRelation3300==='function'){
    const baseSetRelation=setDiplomaticRelation3300;
    setDiplomaticRelation3300=function(a,b,v){
      const before=diplomaticRelation3300(a,b);
      const result=baseSetRelation.apply(this,arguments);
      if(before!==-1&&v===-1&&a>0&&b===0){
        const msg=`${factionName3230(a)} declara la guerra`;
        const n=addNotice('war',msg,{tab:'dip',faction:a});
        if(n&&(Date.now()-lastToastWall>350 || lastToastSignature!=='war|'+msg))showPopup('war',msg,'dip','notice-'+n.id,n);
      }
      return result;
    };
  }

  updateBadges();
  window.HexategosMessagesStable8={
    show:(message,type='info',tab='dip',meta={})=>{
      const prev=notices.length;
      const n=addNotice(type,message,{...meta,tab});
      if(!n)return null;
      if(notices.length!==prev&&n.repeats==null)showPopup(type,message,tab,'notice-'+n.id,n);
      return n.id;
    },
    open:(tab='dip')=>openSystems3220(tab),
    quiet:()=>quiet,
    setQuiet:(value)=>{
      quiet=!!value;
      try{localStorage.setItem(PREF,quiet?'1':'0')}catch(_){}
      if(quiet)for(const card of [...stack.querySelectorAll('.eventCardStable8')])closePopup(card);
      return quiet;
    },
    markAll:(tab=null)=>{
      for(const n of notices)if(!tab||tabForNotice(n)===tab)n.read=true;
      updateBadges();
    },
    view:viewLocation,
    dismiss:dismissNotice,
    notices
  };
  window.HEXATEGOS_STABLE_REBUILD=BUILD;
})();
