'use strict';
// Diagnóstico experimental bajo demanda. Sin intervalos, sin modificar partidas.
(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=n=>(Number(n)||0).toFixed(2);
 const state={panel:null};
 function collect(f){
   const trade=window.HexategosTradeLogistics0370,prod=window.HexategosProduction0388;
   if(!trade||!prod)return {error:'Motores no disponibles'};
   const all=trade.routes(),routes=all.filter(r=>r.a===f||r.b===f);
   const plants=prod.sites().filter(s=>s.f===f);
   const balances=prod.materialBalance().get(f)||{stock:{},demand:{},outputs:{}};
   const shortages=Object.entries(balances.demand||{}).map(([kind,rate])=>({
     kind,rate:Number(rate)||0,stock:Number(balances.stock?.[kind])||0,
     production:Number(balances.outputs?.[kind])||0
   })).filter(x=>x.rate>0 && x.stock<x.rate*12).sort((a,b)=>(b.rate*12-b.stock)-(a.rate*12-a.stock)).slice(0,12);
   const blocked=plants.filter(s=>prod.types[s.kind]?.group!=='extract'&&
     (Number(s.lastRate)||0)<=.00001).slice(0,18).map(s=>({
       cell:s.cell,kind:s.kind,
       network:trade.roadComponent(s.cell),
       power:prod.electricityAt(s.cell),
       status:s.status||'Sin tasa positiva registrada'
     }));
   return {f,routes:routes.map(r=>({
     id:r.id,type:r.type,status:r.status,from:r.from,to:r.to,
     cargo:Number(r.cargoTotal03720||0)+Object.values(r.productionCargo0388||{}).reduce((t,v)=>t+Math.max(0,Number(v)||0),0),
     needsRebuild:!!r.needsRebuild
   })),plants:plants.length,blocked,shortages,
     money:Number(typeof botGold3230!=='undefined'&&f>0?botGold3230[f]:gold3212)||0};
 }
 function render(){
   if(!state.panel)return;
   const selector=state.panel.querySelector('select'),f=Number(selector.value)||0,d=collect(f);
   const body=state.panel.querySelector('.hexdiag-body');
   if(d.error){body.textContent=d.error;return}
   const active=d.routes.filter(r=>r.status==='active'||r.status==='smuggling');
   const cargo=d.routes.filter(r=>r.cargo>.00001);
   const land=d.routes.filter(r=>r.type==='land');
   body.innerHTML=`<p><b>Instalaciones:</b> ${d.plants} · <b>Oro:</b> ${number(d.money)}</p>
    <p><b>Rutas:</b> ${d.routes.length} · <b>Operativas:</b> ${active.length} · <b>Con carga:</b> ${cargo.length} · <b>Terrestres:</b> ${land.length}</p>
    <h4>Rutas comerciales</h4><div class="hexdiag-table"><table><thead><tr><th>ID</th><th>Tipo</th><th>Estado</th><th>Carga</th></tr></thead><tbody>${d.routes.slice(0,30).map(r=>`<tr><td>${esc(r.id)}</td><td>${esc(r.type)}</td><td>${esc(r.status)}${r.needsRebuild?' · pendiente':''}</td><td>${number(r.cargo)}</td></tr>`).join('')}</tbody></table></div>
    <h4>Materiales con existencias bajas respecto a la demanda</h4>
    <p style="opacity:.8">Estimación nacional; la conectividad local debe comprobarse aparte.</p>
    <div class="hexdiag-table"><table><thead><tr><th>Material</th><th>Stock</th><th>Demanda/tick</th></tr></thead><tbody>${d.shortages.map(x=>`<tr><td>${esc(x.kind)}</td><td>${number(x.stock)}</td><td>${number(x.rate)}</td></tr>`).join('')}</tbody></table></div>
    <h4>Fábricas sin producción registrada</h4><div class="hexdiag-table"><table><thead><tr><th>Hex.</th><th>Industria</th><th>Red</th><th>Energía</th></tr></thead><tbody>${d.blocked.map(x=>`<tr><td>${x.cell}</td><td>${esc(x.kind)}</td><td>${x.network}</td><td>${number(x.power?.generatedRate)}</td></tr>`).join('')}</tbody></table></div>
    <p style="opacity:.8">Los campos de producción y carga corresponden a muestras guardadas por el motor; cero no prueba por sí solo un fallo.</p>`;
 }
 function open(){
   if(state.panel){state.panel.style.display='block';render();return}
   const panel=document.createElement('section');state.panel=panel;
   panel.style.cssText='position:fixed;right:12px;top:65px;width:min(470px,calc(100vw - 24px));max-height:78vh;overflow:auto;z-index:999999;background:#102338;color:#eef5fc;border:1px solid #6583a0;border-radius:10px;padding:12px;font:13px system-ui;box-shadow:0 12px 36px #0009';
   const header=document.createElement('div');header.style.cssText='display:flex;gap:8px;align-items:center;justify-content:space-between';
   header.innerHTML='<strong>Diagnóstico económico IA · pruebas</strong>';
   const select=document.createElement('select');select.style.cssText='max-width:130px;background:#fff;color:#142333';
   const max=typeof activeFactionCount3230==='number'?activeFactionCount3230:150;
   for(let i=0;i<max;i++){const option=document.createElement('option');option.value=i;option.textContent='Nación '+i;select.append(option)}
   select.onchange=render;
   const update=document.createElement('button');update.textContent='Actualizar';update.onclick=render;
   const close=document.createElement('button');close.textContent='×';close.title='Cerrar';close.onclick=()=>{panel.style.display='none'};
   for(const b of [update,close])b.style.cssText='cursor:pointer;padding:5px;border-radius:5px';
   header.append(select,update,close);
   const body=document.createElement('div');body.className='hexdiag-body';
   panel.append(header,body);document.body.append(panel);
   const style=document.createElement('style');style.textContent='.hexdiag-table{max-height:190px;overflow:auto} .hexdiag-table table{width:100%;border-collapse:collapse} .hexdiag-table td,.hexdiag-table th{padding:3px;border-bottom:1px solid #344b61;text-align:left}';panel.append(style);
   render();
 }
 window.HexategosEconomicDiagnostic={open,collect,refresh:render};
 const btn=document.createElement('button');btn.textContent='Diagnóstico IA';btn.title='Diagnóstico económico de pruebas';
 btn.style.cssText='position:fixed;left:12px;bottom:12px;z-index:999998;background:#183b58;color:#fff;border:1px solid #84a1ba;border-radius:8px;padding:8px;cursor:pointer;font:12px system-ui';
 btn.onclick=open;document.body.append(btn);
})();
