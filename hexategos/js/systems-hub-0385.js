'use strict';

// HEXATEGOS 0.38.5 · Centro de mando legible.
// Capa solo de presentación: conserva los nodos DOM originales de Sistemas,
// sus delegaciones de eventos, handlers de botones y estado de simulación.
(() => {
  const BUILD='0.38.5';
  const panel=document.getElementById('systemsPanel3213');
  const host=document.getElementById('sysContent3213');
  if(!panel||!host)return;

  const sections={
    dip:{name:'Diplomacia',description:'Embajadas, tratados, relaciones internacionales y propuestas recibidas.',eyebrow:'RELACIONES EXTERIORES'},
    eco:{name:'Economía y comercio',description:'Balance nacional, suministros, rutas comerciales e intercambios de materiales.',eyebrow:'RECURSOS Y PRODUCCIÓN'},
    research:{name:'Investigación',description:'Prioridades de desarrollo, tecnologías y alcance diplomático.',eyebrow:'DESARROLLO NACIONAL'},
    intel:{name:'Inteligencia',description:'Conocimiento exterior, redes de espionaje y protección contra agentes enemigos.',eyebrow:'SEGURIDAD E INFORMACIÓN'},
    naval:{name:'Naval y puertos',description:'Flotas, puertos base, transporte y rutas marítimas.',eyebrow:'CONTROL MARÍTIMO'},
    settings:{name:'Opciones',description:'Visualización, controles, diagnóstico y gestión de partidas.',eyebrow:'CONFIGURACIÓN DEL JUEGO'}
  };
  const expanded=new Map();
  let currentTab='dip', lastRender=0;

  function syncHead(tab){
    currentTab=sections[tab]?tab:'dip';
    const data=sections[currentTab];
    const header=panel.querySelector('.sysHead3213 b');
    if(header)header.textContent=currentTab==='settings'?'OPCIONES':'SISTEMAS';
    const e=document.getElementById('sysEyebrow0385');
    const title=document.getElementById('sysSectionTitle0385');
    const desc=document.getElementById('sysSectionDescription0385');
    if(e)e.textContent=data.eyebrow;
    if(title)title.textContent=data.name;
    if(desc)desc.textContent=data.description;
    panel.classList.toggle('systemsOptions0385',currentTab==='settings');
    panel.querySelectorAll('.sysTabs3213 button[data-tab]').forEach(b=>{
      const active=b.dataset.tab===currentTab;
      b.classList.toggle('active',active);
      if(active)b.setAttribute('aria-current','page');
      else b.removeAttribute('aria-current');
    });
  }

  function headingFor(block,index){
    const direct=block.querySelector(':scope > b');
    if(direct?.textContent?.trim())return direct.textContent.trim();
    const nested=block.querySelector(':scope > .tradeManagerTitle03717 b, :scope > .messagesHeadStable8 b, :scope > h3, :scope > h4');
    if(nested?.textContent?.trim())return nested.textContent.trim();
    const first=block.querySelector(':scope > .sysMeta3213');
    if(first?.textContent?.trim()){
      const v=first.textContent.trim();
      return v.length>62?v.slice(0,59)+'…':v;
    }
    return index===0?'Resumen':'Información adicional '+(index+1);
  }

  function urgentBlock(block){
    return block.classList.contains('messagesSectionStable8') ||
      !!block.querySelector('[data-message-key],.messageCardStable8,.dipOffer3300,.messageFocusStable8');
  }

  function decorateBlocks(){
    const blocks=[...host.children].filter(el=>el.classList?.contains('sysBlock3213'));
    let count=0;
    for(const [i,block] of blocks.entries()){
      if(block.classList.contains('sysCard0385'))continue;
      block.classList.add('sysCard0385');
      const urgent=urgentBlock(block);
      // Primeras dos tarjetas visibles. La información especializada ocupa
      // apartados plegables para evitar listas interminables.
      const collapsible=!urgent&&i>=2&&block.children.length>=2;
      if(!collapsible)continue;

      const label=headingFor(block,i);
      const key=currentTab+'|'+i+'|'+label;
      const on=expanded.has(key)?expanded.get(key):false;
      block.classList.add('hasCollapse0385');
      block.classList.toggle('isCollapsed0385',!on);

      const control=document.createElement('button');
      control.type='button';
      control.className='sysCollapseHeader0385';
      control.setAttribute('aria-expanded',String(on));
      const caption=document.createElement('span');
      caption.className='sysCollapseLabel0385';
      caption.textContent=label;
      const status=document.createElement('span');
      status.className='sysCollapseStatus0385';
      status.textContent=on?'Ocultar':'Mostrar';
      const arrow=document.createElement('span');
      arrow.className='sysCollapseArrow0385';
      arrow.setAttribute('aria-hidden','true');
      arrow.textContent=on?'⌃':'⌄';
      control.append(caption,status,arrow);
      block.insertBefore(control,block.firstChild);
      control.addEventListener('click',()=>{
        const next=block.classList.contains('isCollapsed0385');
        block.classList.toggle('isCollapsed0385',!next);
        control.setAttribute('aria-expanded',String(next));
        status.textContent=next?'Ocultar':'Mostrar';
        arrow.textContent=next?'⌃':'⌄';
        expanded.set(key,next);
      });
      count++;
    }
    panel.dataset.collapsible0385=String(count);
  }

  function decorate(){
    const tab=typeof sysTab3220==='string'?sysTab3220:'dip';
    syncHead(tab);
    decorateBlocks();
    panel.dataset.uiVersion0385=BUILD;
  }

  // Mantener TODO el árbol existente; no usar innerHTML en su contenido.
  const baseRender=renderSystems3220;
  renderSystems3220=function(){
    const out=baseRender.apply(this,arguments);
    try{decorate()}catch(e){console.warn('[Hexategos systems 0.38.5]',e)}
    return out;
  };

  // Registrar el panel cuando ya está visible: evita medir un diálogo
  // oculto (rectángulo de 0×0), que podría alterar su posición guardada.
  let movableRegistered0385=false;
  function enableDragging0385(){
    if(movableRegistered0385||!panel.classList.contains('open'))return;
    const rec=window.HexategosMovablePanels0353?.register?.(
      panel,'.sysHead3213','systems-command-center'
    );
    movableRegistered0385=!!rec;
  }

  const baseOpen=openSystems3220;
  openSystems3220=function(tab='dip'){
    const out=baseOpen.apply(this,arguments);
    // Los envoltorios antiguos pueden establecer pestaña a posteriori.
    syncHead(typeof sysTab3220==='string'?sysTab3220:tab);
    enableDragging0385();
    return out;
  };
  enableDragging0385();

  const close=document.getElementById('systemsClose3213');
  close?.setAttribute('aria-label','Cerrar panel Sistemas');

  // Si la interfaz estaba renderizada al cargar este módulo, decorar sin
  // forzar una nueva simulación o consulta diplomática.
  if(host.children.length)decorate();

  window.HexategosSystemsUI0385={
    version:BUILD,
    section:()=>currentTab,
    sections:()=>Object.keys(sections),
    expanded:()=>new Map(expanded),
    refresh:decorate
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.38.5 · Sistemas: centro de mando legible');
})();
