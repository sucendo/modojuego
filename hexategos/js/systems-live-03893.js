'use strict';
/* HEXATEGOS 0.38.93 · Sistemas con actualización diferencial.
   No introduce intervalos ni modifica la simulación.
   Los renderizadores antiguos siguen generando el estado deseado;
   durante una actualización de la MISMA pestaña sus escrituras se
   reconcilian en el DOM, preservando controles, foco, selección y scroll.
 */
(() => {
  const panel=document.getElementById('systemsPanel3213');
  const host=document.getElementById('sysContent3213');
  if(!panel||!host||typeof renderSystems3220!=='function')return;
  const BUILD='0.38.93';
  const htmlDescriptor=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  if(!htmlDescriptor?.set||!htmlDescriptor?.get)return;
  const origReplace=Element.prototype.replaceChildren;
  const keys=['id','data-hub-tab','data-message-key','data-gov-action0386',
    'data-hub-action','data-mil-mode03875','data-mil-value03874',
    'data-hub-nation-name0389','data-embassy-search','data-embassy-select',
    'data-hub-sea-port','data-gov-city0386','data-action','data-route-id',
    'data-tab','data-inspect-tab03817','data-policy','data-faction'];
  const decorateClasses=['sysCard0385','hasCollapse0385','isCollapsed0385'];
  const blockClasses=['sysGovSummary0386','sysGovIdentity0389','sysGovManager0386',
    'sysGovNotices0386','tradeManager03717','commerceIntro03815',
    'noticesStable8','messagesSectionStable8',
    'sysHubCritical03851','statecraftResearch0380','hubManager03851'];
  const stats={renders:0,liveRenders:0,untouched:0,textChanges:0,attributes:0,
    inserted:0,removed:0,keptInputs:0};
  let lastTab=null,rendering=false;
  const focused=el=>el===document.activeElement;
  const nestedFocus=el=>el?.nodeType===1&&el.contains(document.activeElement);
  const controlled=el=>/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
  function identity(el){
    if(!el||el.nodeType!==1)return '';
    for(const attr of keys)if(el.hasAttribute(attr)){
      const val=el.getAttribute(attr);
      if(attr==='data-faction'&&el.hasAttribute('data-hub-action'))continue;
      return el.tagName+':'+attr+'='+val;
    }
    if(el.tagName==='OPTION')return 'option:'+el.value;
    for(const cls of blockClasses)if(el.classList.contains(cls))return el.tagName+':class='+cls;
    if(el.classList.contains('sysGovPolicy0386')){
      const action=el.querySelector('[data-gov-action0386]');
      if(action)return 'policy:'+action.getAttribute('data-gov-action0386');
    }
    if(el.classList.contains('hubRoute03851')){
      const route=el.querySelector('[data-id]');
      if(route)return 'route:'+route.getAttribute('data-id');
    }
    return '';
  }
  function matches(a,b){
    if(!a||!b||a.nodeType!==b.nodeType)return false;
    if(a.nodeType===1){
      if(a.tagName!==b.tagName)return false;
      const ak=identity(a),bk=identity(b);
      if(ak||bk)return ak===bk;
      if(a.classList.contains('sysBlock3213')&&b.classList.contains('sysBlock3213')){
        const cls=n=>[...n.classList].filter(c=>c!=='sysBlock3213'&&!decorateClasses.includes(c)).sort().join(' ');
        return cls(a)===cls(b);
      }
    }
    return true;
  }
  function patchAttributes(oldNode,newNode){
    const active=focused(oldNode);
    const editable=active&&(controlled(oldNode)||oldNode.isContentEditable);
    const wasCollapsed=oldNode.classList?.contains('isCollapsed0385');
    const decorative=oldNode.classList?.contains('sysBlock3213')?
      decorateClasses.filter(name=>oldNode.classList.contains(name)):[];
    for(const attr of [...oldNode.attributes]){
      if(!newNode.hasAttribute(attr.name)&&
        !(editable&&attr.name==='value')&&
        !(decorative.length&&attr.name==='class')){
        oldNode.removeAttribute(attr.name);stats.attributes++;
      }
    }
    for(const attr of newNode.attributes){
      if(editable&&(attr.name==='value'||attr.name==='checked'||attr.name==='selected'))continue;
      const target=attr.name==='class'&&decorative.length?
        [...new Set(attr.value.split(/\s+/).filter(Boolean).concat(decorative))].join(' '):attr.value;
      if(oldNode.getAttribute(attr.name)!==target){
        oldNode.setAttribute(attr.name,target);stats.attributes++;
      }
    }
    if(wasCollapsed&&oldNode.classList.contains('sysBlock3213'))
      oldNode.classList.add('isCollapsed0385');
    if(controlled(oldNode)){
      // No reasignar value/checked de un control activo: perdería texto,
      // cursor, una edición IME o selección durante el tick.
      if(active){stats.keptInputs++;return}
      if(oldNode.tagName==='INPUT'){
        if(oldNode.type==='checkbox'||oldNode.type==='radio'){
          if(oldNode.checked!==newNode.checked)oldNode.checked=newNode.checked;
        }else if(oldNode.value!==newNode.value)oldNode.value=newNode.value;
      }else if(oldNode.tagName==='TEXTAREA'){
        if(oldNode.value!==newNode.value)oldNode.value=newNode.value;
      }
    }
  }
  function reconcileNode(oldNode,newNode){
    if(oldNode===newNode||oldNode.isEqualNode(newNode)){stats.untouched++;return}
    if(oldNode.nodeType===3||oldNode.nodeType===8){
      if(oldNode.nodeValue!==newNode.nodeValue){
        oldNode.nodeValue=newNode.nodeValue;stats.textChanges++;
      }
      return;
    }
    if(oldNode.nodeType!==1)return;
    patchAttributes(oldNode,newNode);
    if((focused(oldNode)&&oldNode.isContentEditable)||oldNode.tagName==='TEXTAREA'&&focused(oldNode))
      return;
    // Los avisos construyen listeners ligados a la identidad del mensaje.
    // Si el aviso CAMBIA, utilizar el nodo nuevo y sus nuevos listeners.
    if(oldNode.hasAttribute('data-message-key')&&
       !oldNode.isEqualNode(newNode)&&!nestedFocus(oldNode)){
      oldNode.replaceWith(newNode);stats.removed++;stats.inserted++;return;
    }
    // La capa SystemsUI0385 añade cabeceras plegables con listeners.
    // No las destruyas por no figurar en el HTML del renderizador base.
    if(oldNode.classList.contains('hasCollapse0385')){
      const collapse=oldNode.querySelector(':scope > .sysCollapseHeader0385');
      if(collapse&&!newNode.querySelector(':scope > .sysCollapseHeader0385'))
        newNode.insertBefore(collapse.cloneNode(true),newNode.firstChild);
    }
    reconcileChildren(oldNode,newNode);
    if(oldNode.tagName==='SELECT'&&!focused(oldNode)){
      if(oldNode.value!==newNode.value)oldNode.value=newNode.value;
    }
  }
  function reconcileChildren(parent,desired){
    const next=[...desired.childNodes];
    for(let i=0;i<next.length;i++){
      const fresh=next[i],at=parent.childNodes[i]||null;
      if(matches(at,fresh)){reconcileNode(at,fresh);continue;}
      let chosen=null;
      if(identity(fresh)){
        for(let j=i+1;j<parent.childNodes.length;j++){
          const candidate=parent.childNodes[j];
          if(matches(candidate,fresh)){chosen=candidate;break;}
        }
      }else if(fresh.nodeType===1){
        for(let j=i+1;j<Math.min(parent.childNodes.length,i+4);j++){
          const candidate=parent.childNodes[j];
          if(!identity(candidate)&&matches(candidate,fresh)){chosen=candidate;break;}
        }
      }
      if(chosen){
        parent.insertBefore(chosen,at);reconcileNode(chosen,fresh);
      }else{
        parent.insertBefore(fresh,at);stats.inserted++;
      }
    }
    while(parent.childNodes.length>next.length){
      const stale=parent.lastChild;
      // Si el render ha cambiado realmente de estructura, es preferible
      // retirar el nodo obsoleto a conservar controles de otra sección.
      stale.remove();stats.removed++;
    }
  }
  function setLiveHTML(target,html){
    const template=document.createElement('template');
    htmlDescriptor.set.call(template,String(html));
    if(target===host){
      // Son secciones vivas añadidas DESPUÉS del renderizador base por
      // Producción y Mensajes. No son obsoletas solo por no figurar en
      // el HTML base: preservarlas hasta que su propio productor actualice.
      const external=[...host.children].filter(el=>
        el.id==='productionDashboard0388'||
        el.classList.contains('noticesStable8')||
        el.classList.contains('messagesSectionStable8'));
      for(let i=external.length-1;i>=0;i--){
        const el=external[i],already=el.id?
          template.content.querySelector('#'+CSS.escape(el.id)):null;
        if(!already)template.content.prepend(el.cloneNode(true));
      }
    }
    reconcileChildren(target,template.content);
  }
  const previous=renderSystems3220;
  renderSystems3220=function(){
    const tab=typeof sysTab3220==='string'?sysTab3220:'dip';
    const live=panel.classList.contains('open')&&host.childNodes.length>0&&lastTab===tab&&!rendering;
    stats.renders++;
    if(!live){
      lastTab=tab;
      return previous.apply(this,arguments);
    }
    stats.liveRenders++;
    rendering=true;
    const focusBefore=document.activeElement;
    const scrollBefore=host.scrollTop,scrollLeft=host.scrollLeft;
    const focusedScroll=focusBefore&&host.contains(focusBefore)?focusBefore.scrollTop:null;
    // La interceptación es temporal Y está limitada a sysContent y sus
    // descendientes; ningún otro diálogo ni menú altera su comportamiento.
    const originalSet=htmlDescriptor.set;
    const liveDescriptor={
      configurable:true,enumerable:htmlDescriptor.enumerable,
      get:htmlDescriptor.get,
      set:function(html){
        if(this===host||host.contains(this))setLiveHTML(this,html);
        else originalSet.call(this,html);
      }
    };
    let patchedHTML=false,patchedReplace=false;
    let result;
    try{
      Object.defineProperty(Element.prototype,'innerHTML',liveDescriptor);
      patchedHTML=true;
      if(typeof origReplace==='function'){
        Element.prototype.replaceChildren=function(...nodes){
          if(this===host||host.contains(this)){
            const fragment=document.createDocumentFragment();
            fragment.append(...nodes);
            reconcileChildren(this,fragment);
            return;
          }
          return origReplace.apply(this,nodes);
        };
        patchedReplace=true;
      }
      result=previous.apply(this,arguments);
    }finally{
      if(patchedReplace)Element.prototype.replaceChildren=origReplace;
      if(patchedHTML)Object.defineProperty(Element.prototype,'innerHTML',htmlDescriptor);
      rendering=false;
      lastTab=tab;
      if(host.scrollTop!==scrollBefore)host.scrollTop=scrollBefore;
      if(host.scrollLeft!==scrollLeft)host.scrollLeft=scrollLeft;
      if(focusBefore&&host.contains(focusBefore)&&document.activeElement!==focusBefore){
        // Seguridad para renderizadores externos que muevan un nodo.
        focusBefore.focus({preventScroll:true});
      }
      if(focusedScroll!==null&&focusBefore&&host.contains(focusBefore))
        focusBefore.scrollTop=focusedScroll;
    }
    return result;
  };
  // La navegación inicial puede abrir Sistemas en una pestaña ya activa;
  // la primera composición sigue siendo completa. Después es diferencial.
  window.HexategosSystemsLive03893=Object.freeze({
    version:BUILD,diagnostics:()=>({...stats,lastTab,focused:document.activeElement?.id||null}),
    reset:()=>{lastTab=null}
  });
})();
