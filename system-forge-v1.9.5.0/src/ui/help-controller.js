(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
const strip=s=>String(s||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const DEFAULT_TOUR_STEPS=[
  {target:"header",title:"1 · Proyecto y presets",text:"Identifica el proyecto, cambia de preset y accede a Ayuda u Opciones. El nombre del sistema se conserva en las exportaciones."},
  {target:"#openCreateBody",panel:"left",title:"2 · Construir",text:"Crear cuerpo admite ya vehículos espaciales además de astros. Generador, Escenario, Baricentro y Catálogo completan las herramientas de construcción."},
  {target:"#systemExplorerPanel",panel:"left",open:"systemExplorerPanel",title:"3 · Explorador del sistema",text:"Selecciona cuerpos y referencias, pliega ramas y navega por la jerarquía. La selección puede iniciar un viaje progresivo de cámara."},
  {target:"#openScenarioDialog",panel:"left",title:"4 · Escenarios y encuentros",text:"Introduce asteroides, cometas interestelares, planetas errantes o estrellas visitantes como cuerpos N-body. Gliese 710 es una plantilla de encuentro."},
  {target:"#openMeasureTool",panel:"left",title:"5 · Medir A↔B",text:"Abre el instrumento relativo: fija A y B desde selectores o desde la selección 3D para medir distancia, tiempo-luz, velocidades y vínculo orbital en tiempo real."},
  {target:"#view",panel:"view",title:"6 · Vista 3D",text:"Rota, acerca y selecciona cuerpos directamente. Al pasar el ratón por un astro o su anillo aparece una ficha astronómica compacta sin alterar la selección."},
  {target:"#cameraModeControls",panel:"view",title:"7 · Cámara",text:"Seguir mantiene el seleccionado como objetivo; Libre permite explorar. Centrar actúa bajo demanda y cualquier interacción manual cancela un viaje en curso."},
  {target:"#visualScale",panel:"view",title:"8 · Escala 3D",text:"El recorrido es 1:1 → Adapt. → Local. En 1:1 radios y distancias son físicos. La escala visual nunca modifica el estado N-body."},
  {target:"#orbitsBtnSide",panel:"left",open:"layersPanel",title:"9 · Vista y capas",text:"Los botones divididos controlan Órbitas, Trayectoria N-body y Etiquetas. La parte principal muestra u oculta; ▾ contiene las opciones de cada capa."},
  {target:"#systemAnalysisPanel",panel:"left",open:"systemAnalysisPanel",title:"10 · Análisis del sistema",text:"Reúne estabilidad, Hill/Roche, resonancias, jerarquía, encuentros, eventos, dinámica avanzada y verificación N-body."},
  {target:"#analysisPanel",panel:"view",title:"11 · Análisis temporal",text:"Registra y grafica la evolución en vivo. Puede ocultarse desde Opciones para liberar espacio cuando no se necesita."},
  {target:"#right",panel:"right",title:"12 · Propiedades",text:"Edita datos físicos, orbitales, rotación, procedencia y etiquetas del cuerpo seleccionado."},
  {target:"#optionsBtn",panel:"view",title:"13 · Opciones",text:"Configura controles, iconos 1:1, viaje de cámara, Análisis temporal, panel de rendimiento y etiquetas del proyecto."},
  {target:"#perfBadge",panel:"view",title:"14 · Rendimiento",text:"El monitor separa FPS y coste de física/render. Puede ocultarse visualmente sin desactivar las métricas internas usadas por el modo adaptativo."},
  {target:"#helpBtn",panel:"view",title:"15 · Ayuda",text:"La Ayuda dispone de índice con scroll y búsqueda, documentación por áreas, conceptos y esta guía interactiva reutilizable."}
];
class HelpController{
  constructor(opts={}){
    this.content=opts.content||core.HelpContent||{sections:[],contextual:{}};this.steps=opts.steps||DEFAULT_TOUR_STEPS;this.isMobileUI=opts.isMobileUI||(()=>false);this.openMobilePanel=opts.openMobilePanel||(()=>{});this.closeMobilePanels=opts.closeMobilePanels||(()=>{});this.closeAllDialogs=opts.closeAllDialogs||(()=>{});this.scheduleResize=opts.scheduleResize||(()=>{});this.prepareExtra=opts.prepareExtra||(()=>{});this.restore=opts.restore||(()=>{});this.storageKey=opts.storageKey||"system-forge-tour-v1950";this.tourIndex=-1;this.tourTarget=null;this.timer=null;this.activeSection="start";this.bind();}
  el(id){return document.getElementById(id)}
  bind(){
    this.el("helpSearch")?.addEventListener("input",e=>this.render(this.activeSection,e.target.value));
    this.el("closeHelp")?.addEventListener("click",()=>this.close());
    this.el("helpOverlay")?.querySelector(".helpBackdrop")?.addEventListener("click",()=>this.close());
    this.el("restartTour")?.addEventListener("click",()=>this.startTour());
    this.el("helpConcepts")?.addEventListener("click",()=>this.render("concepts"));
  }
  matchingSections(query=""){const q=query.trim().toLowerCase();if(!q)return this.content.sections||[];return (this.content.sections||[]).filter(s=>(`${s.title} ${strip(s.html)}`).toLowerCase().includes(q))}
  render(sectionId="start",query=null){const search=this.el("helpSearch"),q=query==null?(search?.value||""):query,sections=this.matchingSections(q);let sec=(this.content.sections||[]).find(s=>s.id===sectionId);if(!sec||(!sections.includes(sec)&&q))sec=sections[0]||(this.content.sections||[])[0];if(!sec)return;this.activeSection=sec.id;const nav=this.el("helpNav"),body=this.el("helpBody");if(nav){nav.innerHTML=sections.length?sections.map(s=>`<button class="btn ${s.id===sec.id?"primary":""}" data-help-section="${s.id}">${s.title}</button>`).join(""):'<div class="miniNote helpNoResults">Sin resultados.</div>';nav.querySelectorAll("[data-help-section]").forEach(b=>b.onclick=()=>this.render(b.dataset.helpSection))}if(body){body.innerHTML=`<h2>${sec.title}</h2>${sec.html}`;body.scrollTop=0}}
  open(section="start"){this.render(section);this.el("helpOverlay")?.classList.add("open");if(!this.isMobileUI())setTimeout(()=>this.el("helpSearch")?.focus({preventScroll:true}),30)}
  close(){this.el("helpOverlay")?.classList.remove("open")}
  stopTour(save=true){clearTimeout(this.timer);this.el("tourOverlay")?.classList.remove("open");this.tourIndex=-1;this.tourTarget=null;this.restore();if(save)try{localStorage.setItem(this.storageKey,"done")}catch{}}
  positionTour(target,card){if(!target||!card||!this.el("tourOverlay")?.classList.contains("open"))return;const r=target.getBoundingClientRect(),pad=7,h=this.el("tourHighlight");if(!h)return;h.style.left=`${Math.max(4,r.left-pad)}px`;h.style.top=`${Math.max(4,r.top-pad)}px`;h.style.width=`${Math.max(8,Math.min(innerWidth-8,r.width+pad*2))}px`;h.style.height=`${Math.max(8,Math.min(innerHeight-8,r.height+pad*2))}px`;const cardW=Math.min(430,innerWidth*.9),cardH=Math.max(170,Math.min(320,card.offsetHeight||220)),gap=14;let left=Math.min(innerWidth-cardW-10,Math.max(10,r.left)),top=r.bottom+gap;if(top+cardH>innerHeight)top=Math.max(10,r.top-cardH-gap);if(r.width>innerWidth*.72)left=Math.max(10,(innerWidth-cardW)/2);card.style.left=`${left}px`;card.style.top=`${top}px`}
  prepareStep(st){this.closeAllDialogs();if(this.isMobileUI()){if(st.panel==="left")this.openMobilePanel("left");else if(st.panel==="right")this.openMobilePanel("right");else this.closeMobilePanels()}else{if(st.panel==="left")this.el("app")?.classList.remove("leftClosed");if(st.panel==="right")this.el("app")?.classList.remove("rightClosed")}if(st.open){const d=this.el(st.open);if(d&&"open" in d)d.open=true}this.prepareExtra(st);this.scheduleResize()}
  showTourStep(i){this.tourIndex=i;if(i<0||i>=this.steps.length){this.stopTour(true);return}const st=this.steps[i];this.prepareStep(st);clearTimeout(this.timer);this.timer=setTimeout(()=>{const target=document.querySelector(st.target);if(!target||target.getBoundingClientRect().width<2||target.getBoundingClientRect().height<2){this.showTourStep(i+1);return}this.tourTarget=target;target.scrollIntoView?.({block:"nearest",behavior:"auto"});const card=this.el("tourCard");if(!card)return;card.innerHTML=`<div class="tourProgress">Paso ${i+1} de ${this.steps.length}</div><b>${st.title}</b><p>${st.text}</p><div class="row"><button id="tourPrev" class="btn" ${i===0?"disabled":""}>Anterior</button><button id="tourNext" class="btn primary">${i===this.steps.length-1?"Finalizar":"Siguiente"}</button><button id="tourSkip" class="btn">Saltar guía</button></div>`;this.el("tourOverlay")?.classList.add("open");requestAnimationFrame(()=>this.positionTour(target,card));this.el("tourPrev").onclick=()=>this.showTourStep(i-1);this.el("tourNext").onclick=()=>this.showTourStep(i+1);this.el("tourSkip").onclick=()=>this.stopTour(true)},this.isMobileUI()?280:60)}
  startTour(){this.close();this.showTourStep(0)}
  maybeStartTour(){try{if(!localStorage.getItem(this.storageKey))setTimeout(()=>this.startTour(),500)}catch{}}
  repositionTour(){if(this.tourIndex>=0&&this.tourTarget&&this.el("tourOverlay")?.classList.contains("open"))requestAnimationFrame(()=>this.positionTour(this.tourTarget,this.el("tourCard")))}
}
core.HelpController=HelpController;core.DefaultTourSteps=DEFAULT_TOUR_STEPS;
})();
