'use strict';
/* HEXATEGOS 0.38.15 · Comercio separado de Economía.
   Conserva las rutas y botones de la capa logística original.
   No recalcula comercio al mostrar el panel ni modifica los guardados. */
(() => {
  const panel=document.getElementById('systemsPanel3213');
  const host=document.getElementById('sysContent3213');
  if(!panel||!host)return;
  const tabs=panel.querySelector('.sysTabs3213');
  let btn=tabs?.querySelector('[data-tab="commerce"]');
  if(tabs&&!btn){
    btn=document.createElement('button');
    btn.type='button';btn.dataset.tab='commerce';
    btn.innerHTML='<span class="sysNavIcon0385" aria-hidden="true">⇄</span>'+
      '<span class="sysNavText0385"><b>Comercio</b><small>Rutas e intercambios</small></span>';
    const economy=tabs.querySelector('[data-tab="eco"]');
    if(economy?.nextSibling)tabs.insertBefore(btn,economy.nextSibling);
    else tabs.appendChild(btn);
  }
  function switchTab(tab){
    sysTab3220=tab;
    renderSystems3220();
  }
  if(btn)btn.onclick=()=>switchTab('commerce');
  const originalRender=renderSystems3220;
  function decorate(tab){
    panel.querySelectorAll('.sysTabs3213 button[data-tab]').forEach(b=>{
      const active=b.dataset.tab===tab;
      b.classList.toggle('active',active);
      if(active)b.setAttribute('aria-current','page');
      else b.removeAttribute('aria-current');
    });
    const e=document.getElementById('sysEyebrow0385');
    const title=document.getElementById('sysSectionTitle0385');
    const desc=document.getElementById('sysSectionDescription0385');
    if(tab==='commerce'){
      if(e)e.textContent='RUTAS Y MERCADOS';
      if(title)title.textContent='Comercio';
      if(desc)desc.textContent='Rutas terrestres y marítimas, mercancías, socios e ingresos de intercambio.';
    }else if(tab==='eco'){
      if(title)title.textContent='Economía';
      if(desc)desc.textContent='Producción, industria, inventarios, energía y abastecimiento nacional.';
    }
  }
  renderSystems3220=function(){
    if(sysTab3220==='commerce'){
      // Reutilizar el gestor de rutas existente (con permisos, botones y
      // estado real). No clonar su lógica ni crear un segundo sistema.
      sysTab3220='eco';
      let out;
      try{out=originalRender.apply(this,arguments)}
      finally{sysTab3220='commerce'}
      const manager=host.querySelector('.tradeManager03717');
      const heading=document.createElement('div');
      heading.className='sysBlock3213 commerceIntro03815';
      heading.innerHTML='<b>⇄ Comercio internacional e interior</b>'+
        '<p>Las rutas físicas trasladan mercancías y generan ingresos. Se crean desde los puertos y conexiones comerciales; aquí puedes revisarlas y gestionarlas.</p>'+
        '<button type="button" data-commerce-economy03815>Ver producción y recursos</button>';
      host.replaceChildren(heading);
      if(manager)host.appendChild(manager);
      else {
        const note=document.createElement('div');
        note.className='sysBlock3213';
        note.textContent='Aún no hay rutas comerciales registradas.';
        host.appendChild(note);
      }
      decorate('commerce');
      return out;
    }
    const out=originalRender.apply(this,arguments);
    if(sysTab3220==='eco'){
      host.querySelector('.tradeManager03717')?.remove();
      // El antiguo resumen duplicaba ingresos y socios comerciales.
      const summary=host.querySelector('.sysBlock3213:nth-child(2)');
      if(summary&&summary.innerHTML.includes('Socios comerciales')){
        summary.innerHTML=summary.innerHTML
          .replace(/<br>\s*⇄ Socios comerciales:[\s\S]*?<br>\s*Comercio:[\s\S]*?<\/b>/,'');
      }
      decorate('eco');
    }
    return out;
  };
  host.addEventListener('click',event=>{
    if(event.target.closest('[data-commerce-economy03815]'))switchTab('eco');
    if(event.target.closest('[data-economy-commerce03815]'))switchTab('commerce');
  });
  window.HexategosSystemsCommerce03815={
    version:'0.38.15',open:()=>switchTab('commerce'),
    available:()=>!!panel.querySelector('[data-tab="commerce"]')
  };
})();