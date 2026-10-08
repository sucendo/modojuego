'use strict';

// HEXATEGOS 0.38.3 · Recursos estratégicos: valoración local, IA y auditoría.
// No hay nuevos timers, barridos globales ni reservas añadidas por hexágono.
(() => {
  const BUILD='0.38.3';
  const MAX_GEO_CACHE=12000;
  const MAX_NATIONAL_SAMPLES=48;
  const MAX_NATIONAL_AGE=20;
  const BASE=['Alimentos','Materias primas','Combustible'];
  const ICONS=['🍞','⛏','⛽'];
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const geoCache=new Map(),needCache=new Map(),countryCache=new Map();
  let evaluated=0,planBonuses=0,lastTarget=-1;
  const now=()=>Number(campaignSeconds3230)||0;
  const resourceApi=()=>window.HexategosTradeLogistics0370;

  function geography(cell){
    cell=Number(cell);
    if(!Number.isInteger(cell)||cell<0||cell>=owner6.length)return null;
    let old=geoCache.get(cell);
    if(old)return old;
    const info=resourceApi()?.geography?.(cell);
    if(!info)return null;
    const g={
      type:info.type||'plain',
      vector:[clamp(Number(info.food)||0,.08,2.3),clamp(Number(info.raw)||0,.08,2.3),clamp(Number(info.fuel)||0,.08,2.3)]
    };
    // 0.38.4: expulsión incremental, nunca vaciado masivo de 12.000 entradas.
    // Mantiene uso de memoria acotado y evita picos de GC.
    if(geoCache.size>=MAX_GEO_CACHE)geoCache.delete(geoCache.keys().next().value);
    geoCache.set(cell,g);
    return g;
  }

  // Se lee el resumen material ya calculado en el tick comercial. No se recalculan
  // recursos al evaluar cada uno de los candidatos tácticos de la IA.
  function needs(f){
    const tick=now(),old=needCache.get(f);
    if(old&&tick-old.time<8)return old.vector;
    const s=resourceApi()?.resourceSummary?.(f);
    const coverage=s?.coverage||[];
    const prod=s?.prod||[],demand=s?.demand||[];
    const v=[0,1,2].map(i=>{
      const c=clamp(Number(coverage[i]??.55),0,1);
      const shortage=clamp((.76-c)/.76,0,1);
      const pressure=clamp(((Number(demand[i])||0)-(Number(prod[i])||0))/Math.max(.05,Number(demand[i])||0),0,1);
      return clamp(shortage*.78+pressure*.22,.04,1);
    });
    needCache.set(f,{time:tick,vector:v});
    return v;
  }

  // Ponderación de la utilidad estratégica del hexágono SEGÚN lo que necesite
  // el Estado; no presupone que un recurso concreto exista en una mina real.
  function priority(f,cell){
    if(!Number.isInteger(cell)||cell<0||cell>=owner6.length)return 0;
    const g=geography(cell);
    if(!g)return 0;
    const n=needs(f);
    const raw=g.vector[1],fuel=g.vector[2],food=g.vector[0];
    // Peso estratégico sensible a escasez; preservar variedad incluso en bonanza.
    const opportunity=(Math.max(0,food-.60)*n[0]*4.1)+
      (Math.max(0,raw-.60)*n[1]*5.6)+
      (Math.max(0,fuel-.60)*n[2]*5.8);
    const diversity=(food+raw+fuel)/3*.36;
    return clamp(opportunity+diversity,0,8);
  }

  function nationalPotential(f){
    f=Number(f);
    if(f<0||f>=activeFactionCount3230)return [1,1,1];
    const old=countryCache.get(f),time=now();
    if(old&&time-old.time<MAX_NATIONAL_AGE)return old.vector;
    // Muestra del snapshot YA generado por la IA: no se barre el mapa mundial.
    const raw=aiNationalSamples3275?.[f]||[];
    const step=Math.max(1,Math.ceil(raw.length/MAX_NATIONAL_SAMPLES));
    const total=[0,0,0];let count=0;
    for(let j=0;j<raw.length&&count<MAX_NATIONAL_SAMPLES;j+=step){
      const cell=raw[j];
      if(owner6[cell]!==f)continue;
      const g=geography(cell);
      if(!g)continue;
      for(let i=0;i<3;i++)total[i]+=g.vector[i];
      count++;
    }
    // País sin muestras recientes: su capital ofrece una estimación razonable.
    if(!count){
      const cell=capitals[f],g=geography(cell);
      if(g){for(let i=0;i<3;i++)total[i]=g.vector[i];count=1}
    }
    const vector=count?total.map(v=>clamp(v/count,.30,1.9)):[1,1,1];
    countryCache.set(f,{time,vector});
    return vector;
  }

  function tradeOpportunity(f,partner){
    const a=resourceApi()?.resourceSummary?.(f);
    const b=resourceApi()?.resourceSummary?.(partner);
    if(!a||!b)return 0;
    const n=needs(f);
    let score=0;
    for(let r=0;r<3;r++){
      const supply=(Number(b.coverage?.[r])||0);
      const own=(Number(a.coverage?.[r])||0);
      const canExport=window.HexategosStatecraft0380?.resourceTradeAllowed?.(partner,f,r);
      if(!canExport)continue;
      score+=Math.max(0,supply-own)*n[r]*5;
    }
    return clamp(score,0,6);
  }

  // El valor económico no sustituye movimiento, defensa, suministro o
  // reglas de guerra. No se premia una invasión a países en paz.
  const baseStrategicValue0383=aiStrategicValue3260;
  aiStrategicValue3260=function(f,src,target,stance,maneuver,objective=-1){
    const value=baseStrategicValue0383.apply(this,arguments);
    if(f<=0||target<0||target>=owner6.length)return value;
    const owner=owner6[target];
    if(owner===f)return value;
    if(owner>=0&&diplomaticRelation3300(f,owner)!==-1)return value;
    const p=priority(f,target);
    const multiplier=owner<0?1:.62;
    const bonus=p*multiplier;
    evaluated++;if(bonus>.7)planBonuses++;
    return value+bonus;
  };

  // La recomendación comercial aparece también en la decisión de planificación,
  // sin declarar guerras ni saltar fronteras para buscar minerales.
  const basePlanFaction0383=aiPlanFaction3260;
  aiPlanFaction3260=function(f,snap){
    const result=basePlanFaction0383.apply(this,arguments);
    if(result?.objective>=0&&owner6[result.objective]!==f){
      const owner=owner6[result.objective];
      if(owner<0||diplomaticRelation3300(f,owner)===-1){
        const attraction=priority(f,result.objective);
        result.resourceInterest0383=Number(attraction.toFixed(2));
        if(attraction>=2.25&&(!result.reason||result.reason==='expandir territorio'))
          result.reason='obtener recursos estratégicos';
      }
    }
    return result;
  };

  function renderProfile(cell){
    cell=Number(cell);
    const g=geography(cell);
    if(!g)return false;
    const f=owner6[cell];
    const own=f===0, intel=f>0?(window.HexategosStatecraft0380?.intel?.(0,f)||0):100;
    const known=own||f<0||intel>=62;
    closeContextDialog3244();
    uiInteractionState3244.modal={type:'economic_potential_0383',data:{cell}};
    modal3244.classList.add('open3244');
    modal3244.setAttribute('aria-hidden','false');
    modalTitle3244.textContent='Potencial estratégico · '+(typeof placeDisplayName3271==='function'?placeDisplayName3271(cell):'Territorio');
    const labels={plain:'Llanura',mediterranean:'Mediterráneo',forest:'Bosque',jungle:'Selva',desert:'Desierto',steppe:'Estepa',mountain:'Montaña',highmountain:'Alta montaña',ice:'Hielo'};
    const rows=g.vector.map((x,r)=>{
      const pct=Math.round(x*100);
      const range=x>=1.30?'Muy alto':x>=1.08?'Alto':x>=.78?'Medio':x>=.50?'Bajo':'Muy bajo';
      const display=known?pct+' % relativo':range;
      return '<div class="resourcePotentialRow0383"><span>'+ICONS[r]+' '+BASE[r]+'</span><b>'+display+'</b>'+
        '<div class="resourcePotentialBar0383"><i style="width:'+Math.min(100,x*50)+'%"></i></div></div>';
    }).join('');
    const n=needs(0),suggest=n.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v);
    modalBody3244.innerHTML='<div class="nationSection0380 resourcePotential0383">'+
      '<h4>Terreno · '+(labels[g.type]||g.type)+'</h4>'+
      '<p>Potencial productivo relativo a la media, no cantidad almacenada ni yacimiento confirmado. Depende del terreno y la geología abstracta de Hexategos.</p>'+
      rows+
      '<div class="resourcePotentialAdvice0383"><b>Necesidad nacional</b><span>'+ICONS[suggest[0].i]+' '+BASE[suggest[0].i]+' · prioridad actual de abastecimiento</span></div>'+
      (f>0&&!known?'<p>El nivel de inteligencia sobre esta nación limita la precisión geológica visible. Para conocer sus reservas y exportaciones, abre su ficha nacional.</p>':'')+
      '<p>Las IA usan este potencial para escoger expansiones viables, sin saltarse las reglas de conquista, suministro y diplomacia.</p></div>';
    modalActions3244.innerHTML='<button data-modal-action="close">CERRAR</button>';
    return true;
  }

  const baseClassicActions0383=buildClassicActions3246;
  buildClassicActions3246=function(ctx){
    const actions=baseClassicActions0383.apply(this,arguments);
    if(ctx?.kind==='cell'&&Number.isInteger(ctx.cell)&&ctx.cell>=0&&
       !actions.some(a=>a.id==='economic_potential_0383')){
      actions.push(classicAction3246('economic_potential_0383','RECURSOS','⛏','POTENCIAL ECONÓMICO',true,''));
    }
    return actions;
  };

  const baseContextAction0383=handleContextAction3244;
  handleContextAction3244=function(id){
    if(id==='economic_potential_0383'){
      const ctx=uiInteractionState3244?.contextData;
      if(ctx?.kind==='cell'&&Number.isInteger(ctx.cell))renderProfile(ctx.cell);
      return;
    }
    return baseContextAction0383.apply(this,arguments);
  };

  function reset0383(){geoCache.clear();needCache.clear();countryCache.clear();lastTarget=-1}
  const baseReset0383=resetGame3230;
  resetGame3230=function(){
    const r=baseReset0383.apply(this,arguments);reset0383();return r;
  };
  const baseLoad0383=loadGame3212;
  loadGame3212=function(){
    const r=baseLoad0383.apply(this,arguments);reset0383();return r;
  };

  window.HexategosResourceStrategy0383={
    version:BUILD,geography,priority,needs,
    nationalPotential,tradeOpportunity,
    inspect:renderProfile,
    stats:()=>({evaluated,bonuses:planBonuses,cachedCells:geoCache.size,cachedNations:countryCache.size,maxSample:MAX_NATIONAL_SAMPLES})
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.38.3 · riqueza de hexágonos en decisiones territoriales y consulta económica');
})();
