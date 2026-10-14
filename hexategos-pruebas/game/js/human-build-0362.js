'use strict';

// HEXATEGOS 0.36.2 · CONSTRUCCIÓN IA CON PATRÓN HUMANO.
// Mantiene las mismas reglas y estructuras del jugador, pero cambia la decisión:
// pocos núcleos, industria concentrada y una red de carreteras que los conecta.
(() => {
  const BUILD='0.36.2';

  // Calibración visual/económica: una nación de ~50 hexágonos busca aprox.
  // 7 ciudades, 3 industrias y 6 corredores; una de ~186, ~13/6/11.
  // El territorio puede crecer mucho sin convertirse en una alfombra de fábricas.
  function humanDevelopmentTargets0362(f,econ){
    const territory=Math.max(1,econ?.territory||countFaction3230(f));
    const root=Math.sqrt(territory);
    const role=FACTIONS3230[f]?.role||'balanced';
    const coastal=Array.isArray(aiNationalCoast3275?.[f])&&aiNationalCoast3275[f].length>0;

    let targetCities=Math.max(3,Math.min(30,Math.ceil(root*.92)));
    let targetIndustries=Math.max(1,Math.min(14,Math.ceil(root*.40)));
    let targetRoads=Math.max(2,Math.min(24,Math.ceil(
      Math.max(1,targetCities-1)*.72+targetIndustries*.35
    )));
    let targetPorts=coastal?Math.max(1,Math.min(5,Math.ceil(root/7.5))):0;

    if(role==='growth'){
      targetCities=Math.min(32,targetCities+1);
      targetIndustries=Math.min(15,targetIndustries+1);
    }
    if(role==='naval'&&targetPorts)targetPorts=Math.min(6,Math.max(2,targetPorts+1));
    if(role==='defense')targetRoads=Math.min(25,targetRoads+1);
    if(role==='aggressive')targetRoads=Math.min(25,targetRoads+1);

    return {targetCities,targetIndustries,targetRoads,targetPorts};
  }

  // Sustituye los objetivos expansivos de 0.35.6. Las personalidades siguen
  // alterando prioridades; ya no alteran la regla física de llenar el mapa.
  aiDevelopmentTargets3283=function(f,econ,counts){
    return humanDevelopmentTargets0362(f,econ,counts);
  };

  function industryDistance0362(f,cell){
    let best=999;
    for(const c of industries3212){
      if(c!==cell&&owner6[c]===f)best=Math.min(best,angularHeuristic3254(cell,c));
    }
    return best;
  }

  function viableIndustryCell0362(f,c,allowExisting){
    if(!Number.isInteger(c)||c<0||owner6[c]!==f||encircledMask3254?.[c])return false;
    const lv=industryLevel3230[c]||0;
    if(lv>=3||(!allowExisting&&lv>0)||aiEnemyNeighbours3260(f,c)>0)return false;
    if(aiLocalSupply3260(f,c)<40)return false;
    return true;
  }

  // Una fábrica nueva necesita un motivo humano reconocible: ciudad, puerto o
  // corredor viario. No se permite escoger un hexágono rural al azar solo porque
  // forma parte de una muestra nacional.
  function newIndustrySite0362(f){
    const p=aiNationalPlan3275[f]||chooseNationalPolicy3275(f);
    const pool=[],seen=new Set();
    const add=c=>{
      if(Number.isInteger(c)&&c>=0&&!seen.has(c)){seen.add(c);pool.push(c)}
    };
    for(const c of cities3212)if(owner6[c]===f)add(c);
    for(const c of ports3212)if(owner6[c]===f)add(c);
    for(const c of p?.centers||[])add(c);
    for(const c of aiNationalSamples3275[f]||[]){
      if(pool.length>=180)break;
      if(owner6[c]===f&&aiRoadDegree3260(c)>0)add(c);
    }

    let best=-1,bestScore=-1e9;
    for(const c of pool){
      if(!viableIndustryCell0362(f,c,false))continue;
      const city=cityLevel3230[c]||0,road=aiRoadDegree3260(c),port=ports3212.has(c);
      if(!city&&!port&&road<=0)continue;
      const d=industryDistance0362(f,c);
      if(d<3.2)continue;
      const supply=aiLocalSupply3260(f,c);
      let score=supply*.065+city*5.0+road*1.8+(port?1.8:0)+Math.min(3,d*.18);
      if(c===capitals[f])score-=1.6;
      if(score>bestScore){bestScore=score;best=c}
    }
    return best;
  }

  // Cuando ya existen suficientes polos industriales, la IA mejora los que
  // tiene, igual que haría un jugador razonable, en vez de abrir otro icono.
  function existingIndustryUpgrade0362(f){
    let best=-1,bestScore=-1e9;
    for(const c of industries3212){
      if(!viableIndustryCell0362(f,c,true))continue;
      const lv=industryLevel3230[c]||1;
      if(lv<=0)continue;
      const supply=aiLocalSupply3260(f,c),road=aiRoadDegree3260(c);
      let score=supply*.07+(cityLevel3230[c]||0)*5+road*1.7+(ports3212.has(c)?1.6:0)-lv*1.2;
      if(c===capitals[f])score+=.7;
      if(score>bestScore){bestScore=score;best=c}
    }
    return best;
  }

  function markCivilBuild0362(f,st,c){
    markEconomyDirty3261();aiMarkDirty3260();supplyDirty3220=true;
    if(st){
      st.lastCell=c;
      st.counts=aiPhysicalCounts3283(f);
    }
  }

  // Reemplaza únicamente la decisión industrial. Costes y niveles son los mismos
  // que usa build3212 para el jugador: 110 al crear y 115+55*n al mejorar.
  buildDevIndustry3283=function(f,st,reserve){
    const econ=territorialEconomy3261(f);
    const counts=aiPhysicalCounts3283(f);
    const targets=humanDevelopmentTargets0362(f,econ);
    const needNew=counts.industries<targets.targetIndustries;
    let c=needNew?newIndustrySite0362(f):existingIndustryUpgrade0362(f);

    // Si aún faltan polos pero no existe un emplazamiento urbano/logístico seguro,
    // se mejora lo ya construido en lugar de sembrar una fábrica rural.
    if(c<0&&needNew)c=existingIndustryUpgrade0362(f);
    if(c<0)return false;

    const lv=industryLevel3230[c]||0;
    const creating=lv===0;
    if(creating&&!needNew)return false;
    const cost=creating?110:115+lv*55;
    if(lv>=3||botGold3230[f]-cost<reserve)return false;

    botGold3230[f]-=cost;
    industryLevel3230[c]=lv+1;
    industries3212.add(c);
    markCivilBuild0362(f,st,c);
    return true;
  };

  // Conserva también el planificador nacional antiguo como camino seguro: si
  // algún subsistema lo invoca directamente, aplica exactamente el mismo límite.
  buildNationalIndustry3275=function(f,p){
    const econ=territorialEconomy3261(f),counts=aiPhysicalCounts3283(f);
    const targets=humanDevelopmentTargets0362(f,econ);
    const needNew=counts.industries<targets.targetIndustries;
    let c=needNew?newIndustrySite0362(f):existingIndustryUpgrade0362(f);
    if(c<0&&needNew)c=existingIndustryUpgrade0362(f);
    if(c<0)return false;

    const lv=industryLevel3230[c]||0;
    if(lv===0&&!needNew)return false;
    const cost=lv?115+lv*55:110;
    if(lv>=3||botGold3230[f]-cost<(p?.cashReserve??50))return false;

    industryLevel3230[c]=lv+1;
    industries3212.add(c);
    if(typeof spend3275==='function')spend3275(f,'industry',cost);
    else{
      botGold3230[f]-=cost;
      markEconomyDirty3261();aiMarkDirty3260();supplyDirty3220=true;
    }
    return true;
  };

  // Los planes regionales duran varios segundos. Antes podían conservar varias
  // tareas industriales ya obsoletas y ejecutarlas una tras otra, sobrepasando
  // el objetivo. Se podan con el conteo REAL justo antes de invertir.
  const baseRegionalInvest0362=regionalTryInvest3284;
  regionalTryInvest3284=function(f,plan){
    if(!plan?.tasks?.length)return false;

    const econ=territorialEconomy3261(f);
    const live=aiPhysicalCounts3283(f);
    const targets=humanDevelopmentTargets0362(f,econ);
    plan.counts=live;
    plan.targets=targets;

    plan.tasks=plan.tasks.filter(task=>{
      if(task.kind==='city')return live.cities<targets.targetCities;
      if(task.kind==='industry'){
        return live.industries<targets.targetIndustries &&
          viableIndustryCell0362(f,task.target,false) &&
          (cities3212.has(task.target)||ports3212.has(task.target)||aiRoadDegree3260(task.target)>0) &&
          industryDistance0362(f,task.target)>=3.2;
      }
      if(task.kind==='road')return live.roadRoutes<targets.targetRoads;
      if(task.kind==='port')return live.ports<targets.targetPorts;
      return true;
    });

    if(!plan.tasks.length)return false;
    return baseRegionalInvest0362(f,plan);
  };

  // Tras cargar una partida, los planes antiguos se recalculan. No se destruye
  // infraestructura ya existente: una nación sobreindustrializada simplemente
  // deja de abrir nuevos polos y pasa a mejorar/conectar los que conserva.
  function refreshHumanPlans0362(){
    try{
      for(let f=1;f<activeFactionCount3230;f++){
        if(aiDevState3283?.[f])aiDevState3283[f].lastTerritory=-1;
        if(regionalPlans3284?.[f])regionalPlans3284[f].nextEval=0;
        if(aiNationalPlan3275?.[f])aiNationalPlan3275[f].nextReview=0;
      }
    }catch(err){
      console.warn('[HEXATEGOS 0.36.2] no se pudieron invalidar todos los planes de construcción',err);
    }
  }
  setTimeout(refreshHumanPlans0362,0);

  function stats0362(f){
    f=Number(f);
    const econ=territorialEconomy3261(f),counts=aiPhysicalCounts3283(f);
    return {faction:f,territory:econ.territory,counts,targets:humanDevelopmentTargets0362(f,econ)};
  }
  function validate0362(){
    const reference=humanDevelopmentTargets0362(1,{territory:186});
    const errors=[],warnings=[];
    if(reference.targetIndustries>7)errors.push('densidad industrial de referencia demasiado alta');
    if(reference.targetCities<10)warnings.push('densidad urbana de referencia demasiado baja');
    return {ok:errors.length===0,errors,warnings,reference};
  }

  window.HexategosHumanBuild0362={
    version:BUILD,
    stats:stats0362,
    validate:validate0362,
    refresh:refreshHumanPlans0362
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.36.2 construcción IA humana: núcleos, industria concentrada y red viaria');
})();
