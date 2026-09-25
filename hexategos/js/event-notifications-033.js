// HEXATEGOS 0.33 · centro de notificaciones de 5 segundos
(() => {
  const DURATION = 5000;
  const MAX_SLOTS = 7;
  const slots = Array(MAX_SLOTS).fill(null);

  let stack=document.getElementById('hexategosEventStack033');
  if(!stack){
    stack=document.createElement('div');
    stack.id='hexategosEventStack033';
    stack.setAttribute('aria-live','polite');
    stack.setAttribute('aria-label','Eventos importantes');
    document.body.appendChild(stack);
  }

  const icons={
    diplomacy:'🤝',
    war:'⚔',
    attack:'!',
    info:'•'
  };

  const titles={
    diplomacy:'MENSAJE DIPLOMÁTICO',
    war:'DECLARACIÓN DE GUERRA',
    attack:'ATAQUE EN CURSO',
    info:'AVISO'
  };

  function firstFreeSlot(){
    for(let i=0;i<slots.length;i++) if(!slots[i]) return i;
    // Si excepcionalmente se llena la pila, sustituimos el aviso más antiguo.
    return 0;
  }

  function closeCard(card){
    if(!card || card.dataset.closing==='1')return;
    card.dataset.closing='1';
    const slot=Number(card.dataset.slot);
    card.classList.add('closing033');
    clearTimeout(card._hexTimer033);

    // Liberamos el hueco, pero NO recolocamos ninguna tarjeta existente.
    if(Number.isInteger(slot) && slots[slot]===card) slots[slot]=null;

    setTimeout(()=>card.remove(),155);
  }

  function openSystemsTab(tab='dip'){
    const systems=document.getElementById('systemsPanel3213');
    if(!systems?.classList.contains('open')){
      document.getElementById('systemsBtn3213')?.click();
    }
    setTimeout(()=>{
      const btn=document.querySelector('.sysTabs3213 button[data-tab="'+tab+'"]');
      btn?.click();
    },30);
  }

  function show(opts={}){
    const type=opts.type || 'info';
    let slot=firstFreeSlot();

    if(slots[slot]) closeCard(slots[slot]);

    const card=document.createElement('div');
    card.className='hexEvent033';
    card.dataset.type=type;
    card.dataset.slot=String(slot);
    card.style.setProperty('--slot',String(slot));

    const icon=document.createElement('div');
    icon.className='hexEventIcon033';
    icon.textContent=opts.icon || icons[type] || icons.info;

    const body=document.createElement('div');
    body.className='hexEventBody033';

    const title=document.createElement('b');
    title.className='hexEventTitle033';
    title.textContent=opts.title || titles[type] || titles.info;

    const msg=document.createElement('div');
    msg.className='hexEventMsg033';
    msg.textContent=String(opts.message || '');

    body.append(title,msg);

    const actions=document.createElement('div');
    actions.className='hexEventActions033';

    const view=document.createElement('button');
    view.type='button';
    view.className='view033';
    view.textContent='VER';
    view.addEventListener('click',()=>{
      try{
        if(typeof opts.onView==='function') opts.onView();
        else if(type==='diplomacy' || type==='war' || type==='attack') openSystemsTab('dip');
      }catch(_){}
      closeCard(card);
    });

    const close=document.createElement('button');
    close.type='button';
    close.textContent='CERRAR';
    close.addEventListener('click',()=>closeCard(card));

    actions.append(view,close);
    card.append(icon,body,actions);
    slots[slot]=card;
    stack.appendChild(card);

    card._hexTimer033=setTimeout(()=>closeCard(card),opts.duration ?? DURATION);
    return card;
  }

  window.HexategosNotify033={
    show,
    diplomacy:(message,extra={})=>show({...extra,type:'diplomacy',message}),
    war:(message,extra={})=>show({...extra,type:'war',message}),
    attack:(message,extra={})=>show({...extra,type:'attack',message}),
    closeAll:()=>slots.slice().forEach(closeCard)
  };

  // Compatibilidad con los avisos que ya emite el motor mediante #toast.
  // Solo capturamos mensajes relevantes de diplomacia/conflicto.
  const toast=document.getElementById('toast');
  if(!toast)return;

  let lastSignature='';
  let releaseTimer=0;

  function classify(text){
    const s=text.toLocaleLowerCase('es');

    const diplomatic =
      /oferta|propuesta|diplom|alianz|pacto|tratado|acuerdo|negoci|comercio|tregua|paz/.test(s);
    const war =
      /declar.{0,12}guerra|guerra.{0,12}(contra|contigo|nos|te)|hostilidades/.test(s);
    const incomingAttack =
      /(te|nos|tu|nuestra|nuestro).{0,22}(atac|invad|bombard)|atac.{0,24}(tu|nuestra|nuestro)|bajo ataque|ataque enemigo/.test(s);

    if(war) return 'war';
    if(incomingAttack) return 'attack';
    if(diplomatic) return 'diplomacy';
    return '';
  }

  function inspectToast(){
    if(!toast.classList.contains('show')){
      toast.classList.remove('hexategosIntercepted033');
      lastSignature='';
      return;
    }

    const text=(toast.textContent||'').trim();
    if(!text)return;

    const type=classify(text);
    if(!type)return;

    const signature=type+'|'+text;
    toast.classList.add('hexategosIntercepted033');

    clearTimeout(releaseTimer);
    releaseTimer=setTimeout(()=>{
      if(!toast.classList.contains('show')) toast.classList.remove('hexategosIntercepted033');
    },5500);

    if(signature===lastSignature)return;
    lastSignature=signature;

    show({type,message:text,duration:DURATION});
  }

  new MutationObserver(inspectToast).observe(toast,{
    childList:true,
    subtree:true,
    characterData:true,
    attributes:true,
    attributeFilter:['class']
  });
})();
