'use strict';

// HEXATEGOS 0.38.7 · tipografía adaptativa sin trabajo por frame.
(() => {
  const VERSION='0.38.7';
  const STORAGE='hexategos.ui.fontSize.0387';
  const PRESETS=[
    {value:'auto',label:'Automático (se adapta a la pantalla)'},
    {value:'90',label:'Compacto · 90 %'},
    {value:'100',label:'Normal · 100 %'},
    {value:'110',label:'Grande · 110 %'},
    {value:'120',label:'Muy grande · 120 %'},
    {value:'130',label:'Extra grande · 130 %'},
    {value:'145',label:'Máximo · 145 %'}
  ];
  const valid=v=>PRESETS.some(x=>x.value===String(v));
  let selected='auto';
  try{const stored=localStorage.getItem(STORAGE);if(valid(stored))selected=String(stored)}catch(_){}

  const root=document.documentElement;
  const preview='Así se verá el texto de los diálogos y controles. El contenido se adaptará sin modificar el zoom del mapa.';
  function apply(value,persist=true){
    selected=valid(value)?String(value):'auto';
    root.dataset.hexFontMode=selected==='auto'?'auto':'custom';
    if(selected==='auto'){
      root.style.removeProperty('--hex-ui-scale');
    }else{
      root.style.setProperty('--hex-ui-scale',(Number(selected)/100).toFixed(2));
    }
    if(persist)try{localStorage.setItem(STORAGE,selected)}catch(_){}
    for(const select of document.querySelectorAll('[data-hex-font-select0387]')){
      if(select.value!==selected)select.value=selected;
    }
    return selected;
  }
  function attachSelect(select){
    if(select.dataset.hexFontBound0387==='1')return;
    select.dataset.hexFontBound0387='1';
    select.replaceChildren();
    const frag=document.createDocumentFragment();
    for(const p of PRESETS){
      const option=document.createElement('option');
      option.value=p.value;option.textContent=p.label;frag.appendChild(option);
    }
    select.appendChild(frag);
    select.value=selected;
    select.addEventListener('change',()=>apply(select.value));
  }
  function installInOptions(){
    if(typeof sysTab3220==='undefined'||sysTab3220!=='settings')return;
    const host=document.getElementById('sysContent3213');
    if(!host||host.querySelector('#hexFontSettings0387'))return;
    const block=document.createElement('div');
    block.id='hexFontSettings0387';
    block.className='sysBlock3213 hexFontSettings0387';
    const title=document.createElement('b');
    title.textContent='Aa Tamaño de letra e interfaz';
    const description=document.createElement('p');
    description.textContent='Aplica el tamaño a Sistemas, menús, diálogos y fichas. Automático amplía la tipografía en móviles; no cambia la escala del globo.';
    const row=document.createElement('div');
    row.className='hexFontLine0387';
    const label=document.createElement('label');
    label.htmlFor='hexFontSelect0387';
    label.textContent='Tamaño de letra';
    const select=document.createElement('select');
    select.id='hexFontSelect0387';
    select.dataset.hexFontSelect0387='1';
    row.append(label,select);
    const sample=document.createElement('div');
    sample.className='hexFontPreview0387';
    sample.textContent=preview;
    block.append(title,description,row,sample);
    host.prepend(block);
    attachSelect(select);
  }
  const landing=document.getElementById('landingFontSelect0387');
  if(landing){landing.dataset.hexFontSelect0387='1';attachSelect(landing)}

  // El render original cambia el contenido, no el tamaño de texto seleccionado.
  if(typeof renderSystems3220==='function'){
    const baseRender=renderSystems3220;
    renderSystems3220=function(){
      const result=baseRender.apply(this,arguments);
      try{installInOptions()}catch(e){console.warn('[Hexategos UI fonts]',e)}
      return result;
    };
  }
  apply(selected,false);
  if(document.getElementById('systemsPanel3213')?.classList.contains('open'))installInOptions();
  window.HexategosTypography0387={
    version:VERSION,
    presets:PRESETS.map(x=>({...x})),
    get:()=>selected,
    set:apply
  };
  window.HEXATEGOS_VERSION=VERSION;
  console.info('[HEXATEGOS] 0.38.7 · diálogos unificados, tipografía adaptable');
})();
