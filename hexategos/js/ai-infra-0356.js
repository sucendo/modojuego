'use strict';

// HEXATEGOS 0.35.6 · infraestructura apilada + desarrollo IA.
// Capa compatible con partidas existentes: no cambia el schema de guardado.
(() => {
  const BUILD='0.35.6';
  const MULTI_ICON_ZOOM=2.75;
  const CITY_ONLY_MIN_ZOOM=1.60;
  const BASE_INFRA_ZOOM=2.15;

  // 1. La capital histórica se conserva en la lógica, pero no se dibuja como
  //    una segunda estrella. La capital actual mantiene su símbolo normal.
  const baseCapitalIcon0356=drawGlobeCapitalIcon3249;
  drawGlobeCapitalIcon3249=function(x,y,isHistoric,px){
    if(isHistoric)return;
    return baseCapitalIcon0356.call(this,x,y,false,px);
  };

  // 2. Ciudad + industria + puerto pueden convivir visualmente.
  const baseCityIcon0356=drawGlobeCityIcon3249;
  const baseIndustryIcon0356=drawGlobeIndustryIcon3249;
  const basePortIcon0356=drawGlobePortIcon3249;

  function infraKinds0356(id){
    return {
      city:!!cities3212?.has(id),
      industry:!!industries3212?.has(id),
      port:!!ports3212?.has(id)
    };
  }

  function iconOffset0356(id,type,px){
    const k=infraKinds0356(id);
    const count=(k.city?1:0)+(k.industry?1:0)+(k.port?1:0);
    if(count<=1)return [0,0];
    const d=Math.max(7.5,px*1.52);

    if(k.city&&k.industry&&k.port){
      if(type==='city')return [0,-d*.72];
      if(type==='industry')return [-d*.82,d*.55];
      if(type==='port')return [d*.82,d*.55];
    }
    if(k.city){
      const other=k.industry?'industry':'port';
      if(type==='city')return [-d*.68,0];
      if(type===other)return [d*.68,0];
    }
    if(type==='industry')return [-d*.68,0];
    if(type==='port')return [d*.68,0];
    return [0,0];
  }

  drawGlobeCityIcon3249=function(x,y,id,px){
    if(zoom<MULTI_ICON_ZOOM)return baseCityIcon0356.call(this,x,y,id,px);
    const [dx,dy]=iconOffset0356(id,'city',px);
    return baseCityIcon0356.call(this,x+dx,y+dy,id,px);
  };

  drawGlobeIndustryIcon3249=function(x,y,id,px){
    const k=infraKinds0356(id);
    if(k.city&&zoom<MULTI_ICON_ZOOM)return;
    const [dx,dy]=iconOffset0356(id,'industry',px);
    return baseIndustryIcon0356.call(this,x+dx,y+dy,id,px);
  };

  drawGlobePortIcon3249=function(x,y,id,px){
    const k=infraKinds0356(id);
    if(k.city&&zoom<MULTI_ICON_ZOOM)return;
    const [dx,dy]=iconOffset0356(id,'port',px);
    return basePortIcon0356.call(this,x+dx,y+dy,id,px);
  };

  // La base empieza a mostrar infraestructura a zoom > 2.15. Entre 1.60 y
  // 2.15 mostramos únicamente ciudades, que son la referencia prioritaria.
  const baseInfrastructure0356=drawInfrastructure3212;
  drawInfrastructure3212=function(R,cx,cy,now){
    const out=baseInfrastructure0356.apply(this,arguments);
    if(currentKey!==MAX_GAME_LEVEL3233||zoom<CITY_ONLY_MIN_ZOOM||zoom>BASE_INFRA_ZOOM)return out;
    const L=loadLevel(MAX_GAME_LEVEL3233),C=L.centers,px=globeIconScale3249()*.72;
    for(const id of cities3212){
      if(owner6[id]<0)continue;
      const j=id*3,p=projectVec(C[j]/32767,C[j+1]/32767,C[j+2]/32767,R,cx,cy);
      if(globeIconVisible3249(p,.075))baseCityIcon0356.call(this,p[0],p[1],id,px);
    }
    return out;
  };

  // 3. Objetivos físicos de IA proporcionales al tamaño real del país.
  aiDevelopmentTargets3283=function(f,econ,counts){
    const t=Math.max(1,econ?.territory||countFaction3230(f));
    const root=Math.sqrt(t);
    const role=FACTIONS3230[f]?.role||'balanced';
    const coast=(typeof aiNationalCoast3275!=='undefined'&&aiNationalCoast3275[f]?.length)>0;

    let targetCities=Math.max(3,Math.min(38,Math.ceil(root*1.02)));
    let targetIndustries=Math.max(2,Math.min(28,Math.ceil(root*.72)));
    let targetRoads=Math.max(2,Math.min(26,Math.ceil((targetCities+targetIndustries)*.42)));
    let targetPorts=coast?Math.max(1,Math.min(8,Math.ceil(root/5))):0;

    if(role==='growth'){
      targetCities=Math.min(40,targetCities+2);
      targetIndustries=Math.min(30,targetIndustries+2);
    }
    if(role==='naval'&&targetPorts)targetPorts=Math.min(10,Math.max(3,targetPorts+1));
    if(role==='defense')targetRoads=Math.min(28,targetRoads+2);
    if(role==='aggressive')targetRoads=Math.min(28,targetRoads+1);

    return {targetCities,targetIndustries,targetRoads,targetPorts};
  };

  // 4. Fortificación estratégica: el exceso de oro no se transforma sin límite
  //    en defensas cuando la red urbana e industrial sigue atrasada.
  const baseNationalDefense0356=nationalDefense3275;
  let fortAuditCampaign0356=-1e9;
  let fortLevelsByFaction0356=[];

  function rebuildFortLevels0356(){
    fortLevelsByFaction0356=Array.from({length:FACTIONS3230.length},()=>0);
    for(let i=0;i<forts3212.length;i++){
      const lvl=forts3212[i]||0;
      if(!lvl)continue;
      const f=owner6[i];
      if(f>=0&&f<fortLevelsByFaction0356.length)fortLevelsByFaction0356[f]+=lvl;
    }
    fortAuditCampaign0356=campaignSeconds3230;
  }

  function fortLevels0356(f){
    if(!fortLevelsByFaction0356.length||campaignSeconds3230-fortAuditCampaign0356>18)rebuildFortLevels0356();
    return fortLevelsByFaction0356[f]||0;
  }

  nationalDefense3275=function(f,p){
    const territory=Math.max(1,countFaction3230(f));
    const role=FACTIONS3230[f]?.role||'balanced';
    const threatened=(aiSnapshot3260?.capThreat[f]??99)<12||(aiSnapshot3260?.encCount[f]||0)>0;
    const dev=typeof aiDevState3283!=='undefined'?aiDevState3283[f]:null;
    const underdeveloped=!!(dev?.counts&&(
      dev.counts.cities<Math.max(2,(dev.targetCities||0)*.70)||
      dev.counts.industries<Math.max(1,(dev.targetIndustries||0)*.65)
    ));

    if(!threatened&&underdeveloped)return false;

    let cap=Math.max(4,Math.ceil(Math.sqrt(territory)*.56));
    if(role==='defense')cap=Math.ceil(cap*1.35);
    if(threatened)cap=Math.ceil(cap*1.65);
    if(fortLevels0356(f)>=cap)return false;

    const before=fortLevels0356(f);
    const built=baseNationalDefense0356.call(this,f,p);
    if(built)fortLevelsByFaction0356[f]=before+1;
    return built;
  };

  // Partidas ya empezadas: invalidar planes para que adopten los objetivos
  // nuevos inmediatamente, sin resetear territorio ni cambiar el guardado.
  function refreshExistingPlans0356(){
    try{
      if(typeof aiNationalPlan3275!=='undefined'&&Array.isArray(aiNationalPlan3275)){
        for(let f=1;f<aiNationalPlan3275.length;f++){
          const p=aiNationalPlan3275[f];
          if(p)p.nextReview=0;
        }
      }
      if(typeof regionalPlans3284!=='undefined'&&Array.isArray(regionalPlans3284)){
        for(let f=1;f<regionalPlans3284.length;f++)if(regionalPlans3284[f])regionalPlans3284[f].nextEval=0;
      }
      if(typeof aiDevState3283!=='undefined'&&Array.isArray(aiDevState3283)){
        for(let f=1;f<aiDevState3283.length;f++)if(aiDevState3283[f])aiDevState3283[f].lastTerritory=-1;
      }
    }catch(err){console.warn('[HEXATEGOS 0.35.6] no se pudieron invalidar todos los planes IA',err)}
  }

  setTimeout(refreshExistingPlans0356,0);

  window.HexategosAIInfra0356={
    version:BUILD,
    refresh:refreshExistingPlans0356,
    targets(f){
      const econ=territorialEconomy3261(f),counts=aiPhysicalCounts3283(f);
      return aiDevelopmentTargets3283(f,econ,counts);
    },
    fortLevels:fortLevels0356
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.35.6 infraestructura combinada + desarrollo IA activo');
})();
