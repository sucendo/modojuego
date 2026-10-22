/* APEX 9A · navegación visual no invasiva; reutiliza los tabs, controles y sesiones reales. */
(function(){
  'use strict';
  function init(){
    const menu=document.getElementById('menu');
    const tabs=document.getElementById('menuModeTabs');
    if(!menu||!tabs||document.getElementById('apex9aLanding'))return;
    const landing=document.createElement('section');
    landing.id='apex9aLanding';landing.setAttribute('aria-label','Menú principal APEX Formula 26');
    landing.innerHTML='<h1 class="apex9aBrandTitle"><img src="assets/9a/logo-apex26.webp" alt="APEX FORMULA 26"></h1><p>COMPETICIÓN SIN LÍMITES</p><button class="apex9aAction" id="apex9aRace" type="button">TIPO DE CARRERA ❯❯</button><button class="apex9aAction secondary" id="apex9aOptions" type="button">OPCIONES ❯❯</button><div class="apex9aFooter"><button id="apex9aHelp" type="button">AYUDA</button><button id="apex9aAudio" type="button">AUDIO</button><button id="apex9aCredits" type="button">CRÉDITOS</button></div>';
    menu.prepend(landing);
    const back=document.createElement('button');back.id='apex9aBack';back.textContent='← MENÚ PRINCIPAL';back.type='button';back.hidden=true;
    menu.insertBefore(back,landing.nextSibling);
    const display=visible=>{landing.hidden=!visible;back.hidden=visible;menu.classList.toggle('apex9aLandingMode',visible);menu.classList.toggle('apex9aModes',!visible);};
    display(true);
    const selectTab=tab=>{if(!tab)return;tab.click();display(false)};
    document.getElementById('apex9aRace').onclick=()=>{display(false);selectTab(tabs.querySelector('[data-t="quick"]'))};
    document.getElementById('apex9aOptions').onclick=()=>{display(false);document.getElementById('menuGraphics')?.setAttribute('open','');document.getElementById('menuGraphics')?.scrollIntoView({block:'start'});};
    document.getElementById('apex9aHelp').onclick=()=>selectTab(document.querySelector('#controlsTab'));
    document.getElementById('apex9aAudio').onclick=()=>{const b=document.getElementById('sound');if(b)b.click();else alert('El audio se configura dentro del simulador.');};
    document.getElementById('apex9aCredits').onclick=()=>alert('APEX Formula 26 · Sucendo.');
    back.onclick=()=>display(true);
    // Al comenzar cualquier sesión, APEX oculta #menu.
    // Cuando regresa de resultados, debe aparecer la selección de modalidades,
    // no una portada superpuesta que bloquee botones como #lastRaceResults.
    let previousHidden=menu.classList.contains('hidden');
    const menuLifecycle=new MutationObserver(()=>{
      const isHidden=menu.classList.contains('hidden');
      if(isHidden&&!previousHidden)display(false);
      previousHidden=isHidden;
    });
    menuLifecycle.observe(menu,{attributes:true,attributeFilter:['class']});
    // Mantener las mismas acciones nativas de entrada en pista y progreso de fin de semana.
    // No crear sesiones ficticias ni alterar los sistemas antiguos.
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
