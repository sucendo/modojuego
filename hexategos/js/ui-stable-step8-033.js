// HEXATEGOS Stable Rebuild 8 · mensajes dentro de Sistemas por secciones.
// Sin MutationObserver y sin temporizadores periódicos.
(() => {
  'use strict';
  const BUILD='8';
  const DURATION=5000;
  const MAX_POPUPS=5;
  const MAX_LOG=24;
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
      n?.type==='naval'?'naval':'dip';
  }
  function tabLabel(tab){
    return tab==='eco'?'Economía':tab==='research'?'I+D':tab==='intel'?'Inteligencia':tab==='naval'?'Naval':'Diplomacia';
  }
  function addNotice(type,message,meta={}){
    const tab=meta.tab||tabForNotice({type});
    const recent=notices.find(n=>n.type===type&&n.message===String(message||'')&&Date.now()-n.created<1400);
    if(recent)return recent;
    const n={id:nextNoticeId++,type:type||'info',message:String(message||''),created:Date.now(),read:false,tab,...meta};
    notices.unshift(n);
    if(notices.length>MAX_LOG)notices.length=MAX_LOG;
    updateBadges();
    return n;
  }
  function pendingByTab(){
    const counts={dip:0,eco:0,research:0,intel:0,naval:0};
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
      }
    }
    [...c.querySelectorAll('.sysBlock3213')].forEach(block=>{
      const title=(block.querySelector(':scope>b')?.textContent||'').trim();
      if(title.includes('Propuestas recibidas')&&!block.querySelector('.dipOffer3300'))block.remove();
    });
  }

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
          <button class="good" data-accept-offer="${o.id}">ACEPTAR</button>
          <button data-reject-offer="${o.id}">RECHAZAR</button>
        </div>
      </div>`;
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
    const list=notices.filter(n=>tabForNotice(n)===tab).slice(0,10);
    if(!list.length)return;
    const c=document.getElementById('sysContent3213');if(!c)return;
    const block=document.createElement('div');
    block.className='sysBlock3213 messagesSectionStable8 noticesStable8';
    block.innerHTML=`<div class="messagesHeadStable8"><div><b>🔔 Avisos · ${tabLabel(tab)}</b><div class="sysMeta3213">Eventos recientes relacionados con esta sección.</div></div><span>${list.filter(n=>!n.read).length} nuevos</span></div>`;
    for(const n of list){
      const art=document.createElement('article');
      art.className='messageCardStable8 '+(n.read?'readStable8':'');
      art.dataset.messageKey='notice-'+n.id;
      const icon=n.type==='war'?'⚔':n.type==='attack'?'!':n.type==='naval'?'⚓':n.type==='intel'?'🕵':'•';
      art.innerHTML=`<div class="messageIconStable8">${icon}</div><div class="messageBodyStable8"><b>${n.type==='war'?'CONFLICTO':n.type==='attack'?'ATAQUE':'AVISO'}</b><div class="messageTitleStable8">${esc(n.message)}</div><div class="messageActionsStable8"><button data-read-notice="${n.id}">${n.read?'LEÍDO':'ENTENDIDO'}</button></div></div>`;
      art.querySelector('[data-read-notice]')?.addEventListener('click',()=>{n.read=true;updateBadges();renderSystems3220()});
      block.appendChild(art);
    }
    c.prepend(block);
  }

  function focusCurrentMessage(){
    if(!focusMessageKey)return;
    const key=focusMessageKey;
    requestAnimationFrame(()=>{
      const el=document.querySelector(`[data-message-key="${CSS.escape(key)}"]`);
      if(!el)return;
      el.classList.add('messageFocusStable8');
      el.scrollIntoView({block:'nearest',behavior:'smooth'});
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
  function showPopup(type,message,tab,key=''){
    const current=[...stack.querySelectorAll('.eventCardStable8:not(.closingStable8)')];
    if(current.length>=MAX_POPUPS)closePopup(current[0]);
    const card=document.createElement('div');
    card.className='eventCardStable8';card.dataset.type=type;
    const title=type==='offer'?'PROPUESTA':type==='war'?'DECLARACIÓN DE GUERRA':type==='attack'?'ATAQUE EN CURSO':'AVISO';
    const icon=type==='offer'?'🤝':type==='war'?'⚔':type==='attack'?'!':'•';
    card.innerHTML=`<div class="eventIconStable8">${icon}</div><div class="eventBodyStable8"><b>${title}</b><div>${esc(message)}</div><small>${esc(tabLabel(tab))}</small></div><div class="eventActionsStable8"><button class="viewStable8">VER</button><button class="closeStable8">CERRAR</button></div>`;
    card.querySelector('.viewStable8')?.addEventListener('click',()=>{openMessage(tab,key);closePopup(card)});
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
  const baseToast=toast;
  toast=function(msg){
    const v=baseToast.apply(this,arguments);
    try{
      if(typeof balanceAuditRunning3276!=='undefined'&&balanceAuditRunning3276)return v;
      const type=classifyToast(msg);if(!type)return v;
      const now=Date.now(),sig=type+'|'+String(msg);
      if(sig===lastToastSignature&&now-lastToastWall<1200)return v;
      lastToastSignature=sig;lastToastWall=now;
      if(type==='offer'){
        const o=latestOffer();
        if(o){
          const tab=tabForOffer(o);
          showPopup('offer',`${factionName3230(o.from)} · ${offerLabel(o.type)}`,tab,'offer-'+o.id);
          updateBadges();
        }else showPopup('offer',msg,'dip','');
      }else{
        const n=addNotice(type,msg,{tab:'dip'});
        showPopup(type,msg,'dip','notice-'+n.id);
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
        const n=addNotice('war',msg,{tab:'dip'});
        if(Date.now()-lastToastWall>350 || lastToastSignature!=='war|'+msg)showPopup('war',msg,'dip','notice-'+n.id);
      }
      return result;
    };
  }

  updateBadges();
  window.HexategosMessagesStable8={
    show:(message,type='info',tab='dip')=>{const n=addNotice(type,message,{tab});showPopup(type,message,tab,'notice-'+n.id);return n.id},
    open:(tab='dip')=>openSystems3220(tab),
    notices
  };
  window.HEXATEGOS_STABLE_REBUILD=BUILD;
})();
