(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  function createProjectIO(ctx={}){
    const {state,parentOf,osculatingElements,massSolar,radiusKm,calcDensity,inferPlanetaryClass,inferSatelliteClass,inferMinorClassFromLegacy,displayedSimTime,el,encounterRows,experimentResultsData,referencePeriodYears,temporalStats,systemAnalysisData,perfMonitor,energy,safeFileStem,body,EARTH_TO_SOLAR,EARTH_RADIUS_KM,SOLAR_RADIUS_KM,normalizeProjectTagDefinitions,legacyLabelCategories,setProjectName,initialize,snapshot,invalidateRenderState,sampleRealTrails,renderBodies,updateAll,captureExperimentState,setLabelCategories,focusBody,temporalRecord}=ctx;
    function exportBodyRecord(b){
      const p=parentOf(b),osc=osculatingElements(b);
      return {
        id:b.id,name:b.name,type:b.kind,parent:p?.name||null,parentId:p?.id||null,
        massEarth:b.massEarth,massSolar:massSolar(b),radiusKm:radiusKm(b),
        density_g_cm3:b.density??calcDensity(b),albedo:b.albedo,surfacePressureBar:b.surfacePressureBar,
        rotationHours:b.rotationHours,obliquityDeg:b.obliquity,rotationDirection:(b.rotationDirection||1)<0?"retrograde":"prograde",
        a_AU:b.a,e:b.e,i_deg:b.i,Omega_deg:b.Omega,omega_deg:b.omega,M0_deg:b.M0,
        luminositySolar:b.luminosity||null,temperatureK:b.temperature||null,
        disposition:b.disposition||"model",massNature:b.massNature||"true",dataSource:b.dataSource||"",dataEpoch:b.dataEpoch||"",
        observedPeriodDays:b.observedPeriodDays,equilibriumTempK:b.equilibriumTempK,stellarFluxEarth:b.stellarFluxEarth,
        radiusEstimated:!!b.radiusEstimated,radiusNature:b.radiusNature||"unknown",temperatureNature:b.temperatureNature||"unknown",periodNature:b.periodNature||"unknown",
        catalogId:b.catalogId||"",discoveryMethod:b.discoveryMethod||"",discoveryYear:b.discoveryYear??null,sourceUrl:b.sourceUrl||"",observationalNotes:b.observationalNotes||"",catalogSource:b.catalogSource||"",sourceFields:b.sourceFields?JSON.parse(JSON.stringify(b.sourceFields)):null,
        planetClass:b.planetClass||"",planetaryClass:b.kind==="planet"?inferPlanetaryClass(b):"",satelliteClass:b.kind==="moon"?inferSatelliteClass(b):"",minorClass:b.minorClass||"",dynamicClass:b.dynamicClass||"",binaryBarycenterId:b.binaryBarycenterId||null,tags:[...(b.tags||[])],catalogPositionLY:b.catalogPositionLY||null,notes:b.notes||"",
        spacecraftClass:b.spacecraftClass||"",missionStatus:b.missionStatus||"",operator:b.operator||"",missionName:b.missionName||"",vehicleId:b.vehicleId||"",dryMassKg:b.dryMassKg??0,propellantMassKg:b.propellantMassKg??0,crewCapacity:b.crewCapacity??0,propulsionType:b.propulsionType||"",characteristicSizeM:b.characteristicSizeM??null,
        hideInTree:!!b.hideInTree,color:b.color,
        structureType:b.structureType||null,structureProfile:b.structureProfile||"uniform",innerAU:b.innerAU??null,outerAU:b.outerAU??null,thicknessDeg:b.thicknessDeg??null,pointCount:b.pointCount??null,gravityEnabled:b.gravityEnabled!==false,structureSamples:b.structureSamples??20,structureRole:b.structureRole||"",
        orbitCenterIds:Array.isArray(b.orbitCenterIds)?[...b.orbitCenterIds]:null,
        orbitReferenceId:b.orbitReferenceId||null,
        orbitReferenceName:b.orbitReferenceName||"",
        trajectoryMode:b.trajectoryMode||"orbital",cartesianInitial:b.cartesianInitial?JSON.parse(JSON.stringify(b.cartesianInitial)):null,
        flybySpec:b.flybySpec?JSON.parse(JSON.stringify(b.flybySpec)):null,initialFlybySpec:b.initialFlybySpec?JSON.parse(JSON.stringify(b.initialFlybySpec)):null,initialFlybyParentId:b.initialFlybyParentId||null,encounterRole:b.encounterRole||"",dynamicStatus:b.dynamicStatus||"",capturedById:b.capturedById||null,captureEpochYears:b.captureEpochYears??null,lastAutonomousChange:b.lastAutonomousChange?JSON.parse(JSON.stringify(b.lastAutonomousChange)):null,
        tracerMode:!!b.tracerMode,tracerCount:b.tracerCount||0,tracerInnerThresholdAU:b.tracerInnerThresholdAU??null,
        structurePerturbable:b.structurePerturbable!==false,structureAutoTracers:b.structureAutoTracers!==false,structurePerturbationThreshold:b.structurePerturbationThreshold??0.001,
        currentPositionAU:b.pos.toArray(),currentVelocityAUyr:b.vel.toArray(),
        osculating:osc?{distanceAU:osc.rAU,semiMajorAxisAU:osc.aAU,eccentricity:osc.e,periodYears:osc.periodYears}:null
      };
    }
    function systemExportObject(){
      return {
        ...window.SystemForgeCore.projectEnvelope("1.9.5.0"),
        version:"1.9.5.0",
        generated:new Date().toISOString(),
        projectName:state.projectName,
        preset:state.preset,
        simulatedYears:displayedSimTime(),
        visualScale:Number(el("visualScale").value),
        autoScale:state.autoScale,
        labelMode:state.labelMode,labelCategories:[...state.labelCategories],tagDefinitions:state.tagDefinitions.map(t=>({...t})),showTagBadges:state.showTagBadges,
        orbitMode:state.orbitMode,orbitGeometryMode:state.orbitGeometryMode,trailMode:state.trailMode,trailMaxPoints:state.trailMaxPoints,
        bodies:state.bodies.map(exportBodyRecord),
        references:window.SystemForgeCore.ReferenceRegistry.serialize(state.references),
        scenarios:[...state.scenarios],encounterLog:encounterRows(100),encounterHistory:JSON.parse(JSON.stringify(state.encounterHistory||{})),captureEvents:[...state.captureEvents],
        experimentBaseline:state.experimentBaseline?JSON.parse(JSON.stringify(state.experimentBaseline)):null,
        experimentResults:experimentResultsData(),
        temporalAnalysis:Object.fromEntries([...state.temporal.entries()].map(([id,r])=>{
          const b=state.bodies.find(x=>x.id===id);
          return [b?.name||id,{referencePeriodYears:referencePeriodYears(b),history:r.history,realYears:r.realYears,conjunctions:r.conjunctions||[],stats:temporalStats(b)}];
        })),
        liveMetrics:{unstable:state.unstable,minSeparationAU:Number.isFinite(state.minSep)?state.minSep:null,
          energyErrorPercent:(!state.fastPreview&&!state.encounterFastMode&&!state.approximateAdvanceUsed&&state.lastEnergy)?Math.abs((energy()-state.lastEnergy)/state.lastEnergy)*100:null,
          criticalEvents:[...state.criticalEvents]},
        systemAnalysis:systemAnalysisData(),
        performanceSnapshot:perfMonitor.snapshot(),
        scenarios:[...state.scenarios],encounterLog:encounterRows(100),encounterHistory:JSON.parse(JSON.stringify(state.encounterHistory||{})),captureEvents:[...state.captureEvents],
        experimentResults:state.experimentLastResult,
        advancedDynamics:state.advancedDynamicsResult
      };
    }
    function downloadBlob(name,content,type){
      const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500);
    }
    function parseCSV(text){
      const rows=[];let row=[],field="",quoted=false;
      for(let i=0;i<text.length;i++){
        const ch=text[i];
        if(quoted){
          if(ch==='"' && text[i+1]==='"'){field+='"';i++}
          else if(ch==='"')quoted=false;
          else field+=ch;
        }else{
          if(ch==='"')quoted=true;
          else if(ch===','){row.push(field);field=""}
          else if(ch==='\n'){row.push(field);rows.push(row);row=[];field=""}
          else if(ch!=='\r')field+=ch;
        }
      }
      if(field.length||row.length){row.push(field);rows.push(row)}
      if(!rows.length)return [];
      const head=rows.shift().map(x=>x.trim());
      return rows.filter(r=>r.some(x=>x.trim()!=="")).map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??""])));
    }
    function numOr(v,def=0){
      if(v===null||v===undefined||String(v).trim()==="")return def;
      const n=Number(v);return Number.isFinite(n)?n:def;
    }
    function optionalNum(v){
      if(v===null||v===undefined||String(v).trim()==="")return null;
      const n=Number(v);return Number.isFinite(n)?n:null;
    }
    function boolOr(v,def=false){
      if(v===null||v===undefined||String(v).trim()==="")return def;
      if(typeof v==="boolean")return v;
      return ["1","true","yes","si","sí"].includes(String(v).trim().toLowerCase());
    }
    function migrateLegacySyntheticRecords(records){
      const legacy=records.filter(r=>boolOr(r.syntheticSwarm,false));
      if(!legacy.length)return records;
      const clean=records.filter(r=>!boolOr(r.syntheticSwarm,false));
      const defs={
        asteroidBelt:{name:"Cinturón de asteroides",profile:"asteroidKirkwood",type:"annulus"},
        kuiperBelt:{name:"Cinturón de Kuiper",profile:"kuiperDynamic",type:"annulus"},
        oortCloud:{name:"Nube de Oort",profile:"uniform",type:"shell"}
      };
      for(const [tag,d] of Object.entries(defs)){
        const g=legacy.filter(r=>r.populationTag===tag);if(!g.length)continue;
        if(clean.some(r=>(r.type||r.kind)==="structure"&&(r.structureRole===tag||r.name===d.name)))continue;
        const av=g.map(r=>numOr(r.a_AU??r.a,0)).filter(x=>x>0);
        clean.push({
          id:crypto.randomUUID(),name:d.name,type:"structure",parentId:g[0].parentId||null,parent:g[0].parent||"Sol",
          massEarth:g.reduce((s,r)=>s+numOr(r.massEarth,0),0),radiusKm:0,structureType:d.type,
          structureProfile:d.profile,structureRole:tag,innerAU:av.length?Math.min(...av):(tag==="oortCloud"?2000:tag==="kuiperBelt"?30:2.05),
          outerAU:av.length?Math.max(...av):(tag==="oortCloud"?100000:tag==="kuiperBelt"?55:3.4),
          thicknessDeg:tag==="oortCloud"?180:tag==="kuiperBelt"?24:10,pointCount:Math.max(700,Math.min(2500,g.length*12)),
          gravityEnabled:true,structureSamples:20,disposition:"model",massNature:"model",planetClass:"estructura",
          notes:"Migrada automáticamente desde una población sintética de System Forge 1.8.3.",color:g[0].color||"#9aa8b7"
        });
      }
      return clean;
    }
    function importedBodyFromRecord(r){
      const kind=(r.type||r.kind||"planet").toLowerCase(),spacecraftModel=window.SystemForgeCore.SpacecraftModel;
      const craftMassKg=Math.max(0,numOr(r.dryMassKg,0))+Math.max(0,numOr(r.propellantMassKg,0));
      const craftMassEarth=spacecraftModel?.massEarthFromKg?.(craftMassKg)||0;
      const massE=numOr(r.massEarth, kind==="star"?numOr(r.massSolar,1)/EARTH_TO_SOLAR:kind==="spacecraft"?craftMassEarth:1);
      const massS=kind==="star"?numOr(r.massSolar,massE*EARTH_TO_SOLAR):null;
      const craftRadiusKm=spacecraftModel?.defaultRadiusKm?.(r)??.005;
      const rKm=numOr(r.radiusKm, kind==="spacecraft"?craftRadiusKm:numOr(r.radiusEarth,1)*EARTH_RADIUS_KM);
      const dir=String(r.rotationDirection??"prograde").toLowerCase();
      return body({
        id:r.id||crypto.randomUUID(),name:r.name||"Body",kind,parent:null,
        _importParentId:r.parentId||null,_importParentName:r.parent||null,
        massEarth:massE,massSolar:massS,radiusEarth:rKm/EARTH_RADIUS_KM,
        density:numOr(r.density_g_cm3 ?? r.density, NaN),
        albedo:numOr(r.albedo,.3),surfacePressureBar:numOr(r.surfacePressureBar,0),
        rotationHours:numOr(r.rotationHours,24),obliquity:numOr(r.obliquityDeg ?? r.obliquity,0),
        rotationDirection:(dir==="retrograde"||dir==="-1")?-1:1,
        a:numOr(r.a_AU ?? r.a, kind==="star"?0:1),e:numOr(r.e,.02),
        i:numOr(r.i_deg ?? r.i,0),Omega:numOr(r.Omega_deg ?? r.Omega,0),
        omega:numOr(r.omega_deg ?? r.omega,0),M0:numOr(r.M0_deg ?? r.M0,0),
        luminosity:numOr(r.luminositySolar ?? r.luminosity, kind==="star"?1:0),
        temperature:numOr(r.temperatureK ?? r.temperature, kind==="star"?5772:0),
        disposition:r.disposition||"model",massNature:r.massNature||"true",dataSource:r.dataSource||"",dataEpoch:r.dataEpoch||"",
        observedPeriodDays:optionalNum(r.observedPeriodDays),equilibriumTempK:optionalNum(r.equilibriumTempK),
        stellarFluxEarth:optionalNum(r.stellarFluxEarth),radiusEstimated:boolOr(r.radiusEstimated,false),
        radiusNature:r.radiusNature||((r.radiusEstimated)?"estimated":"unknown"),temperatureNature:r.temperatureNature||"unknown",periodNature:r.periodNature||"unknown",
        catalogId:r.catalogId||"",discoveryMethod:r.discoveryMethod||"",discoveryYear:optionalNum(r.discoveryYear),sourceUrl:r.sourceUrl||"",observationalNotes:r.observationalNotes||"",catalogSource:r.catalogSource||"",sourceFields:r.sourceFields&&typeof r.sourceFields==="object"?JSON.parse(JSON.stringify(r.sourceFields)):null,
        planetClass:r.planetClass||"",planetaryClass:r.planetaryClass||((kind==="planet"&&/enano/i.test(String(r.planetClass||"")))?"dwarf-planet":kind==="planet"?"planet":""),satelliteClass:r.satelliteClass||"",minorClass:r.minorClass||inferMinorClassFromLegacy(r.planetClass||""),dynamicClass:r.dynamicClass||"",binaryBarycenterId:r.binaryBarycenterId||null,tags:Array.isArray(r.tags)?[...r.tags]:[],catalogPositionLY:Array.isArray(r.catalogPositionLY)?[...r.catalogPositionLY]:null,notes:r.notes||"",
        spacecraftClass:r.spacecraftClass||"other",missionStatus:r.missionStatus||"planned",operator:r.operator||"",missionName:r.missionName||"",vehicleId:r.vehicleId||"",dryMassKg:numOr(r.dryMassKg,0),propellantMassKg:numOr(r.propellantMassKg,0),crewCapacity:numOr(r.crewCapacity,0),propulsionType:r.propulsionType||"",characteristicSizeM:numOr(r.characteristicSizeM,10),
        hideInTree:boolOr(r.hideInTree,false),
        structureType:r.structureType||"annulus",structureProfile:r.structureProfile||"uniform",innerAU:numOr(r.innerAU,2),outerAU:numOr(r.outerAU,3),thicknessDeg:numOr(r.thicknessDeg,8),pointCount:numOr(r.pointCount,700),gravityEnabled:boolOr(r.gravityEnabled,true),structureSamples:numOr(r.structureSamples,20),structureRole:r.structureRole||"",
        orbitCenterIds:Array.isArray(r.orbitCenterIds)?[...r.orbitCenterIds]:null,
        orbitReferenceId:r.orbitReferenceId||null,
        orbitReferenceName:r.orbitReferenceName||"",
        trajectoryMode:r.trajectoryMode||"orbital",cartesianInitial:r.cartesianInitial||null,flybySpec:r.flybySpec||null,initialFlybySpec:r.initialFlybySpec||null,initialFlybyParentId:r.initialFlybyParentId||null,encounterRole:r.encounterRole||"",dynamicStatus:r.dynamicStatus||"",capturedById:r.capturedById||null,captureEpochYears:optionalNum(r.captureEpochYears),lastAutonomousChange:r.lastAutonomousChange||null,
        tracerMode:boolOr(r.tracerMode,false),tracerCount:numOr(r.tracerCount,0),tracerInnerThresholdAU:optionalNum(r.tracerInnerThresholdAU),
        structurePerturbable:boolOr(r.structurePerturbable,true),structureAutoTracers:boolOr(r.structureAutoTracers,true),structurePerturbationThreshold:optionalNum(r.structurePerturbationThreshold)??0.001,
        _importCurrentPosition:Array.isArray(r.currentPositionAU)?r.currentPositionAU:null,_importCurrentVelocity:Array.isArray(r.currentVelocityAUyr)?r.currentVelocityAUyr:null,
        radiusSolar:kind==="star"?rKm/SOLAR_RADIUS_KM:0,
        color:r.color || (kind==="star"?"#fff0b8":kind==="moon"?"#c8d0dc":kind==="spacecraft"?"#8fe7ff":kind==="minor"?"#a88b74":"#75b8ff")
      });
    }
    function resolveImportedParents(bs){
      const byId=new Map(bs.map(b=>[b.id,b])),byName=new Map(bs.map(b=>[b.name,b]));
      for(const b of bs){
        const p=byId.get(b._importParentId)||byName.get(b._importParentName);
        b.parent=p?.id||null;delete b._importParentId;delete b._importParentName;
      }
    }
    function importSystemForgeObject(obj){
      obj=window.SystemForgeCore?.migrateProject?window.SystemForgeCore.migrateProject(obj):obj;
      if(!obj||!Array.isArray(obj.bodies))throw new Error("El JSON no contiene una lista bodies válida.");
      const migrated=migrateLegacySyntheticRecords(obj.bodies);const bs=migrated.map(importedBodyFromRecord);resolveImportedParents(bs);
      state.bodies=bs;state.references=window.SystemForgeCore.ReferenceRegistry.normalize(obj.references||[]);state.scenarios=Array.isArray(obj.scenarios)?obj.scenarios:[];state.encounterLog={};state.encounterHistory=obj.encounterHistory&&typeof obj.encounterHistory==="object"?JSON.parse(JSON.stringify(obj.encounterHistory)):{};state.captureEvents=Array.isArray(obj.captureEvents)?obj.captureEvents:[];state.captureTracker={};for(const e of obj.encounterLog||[]){if(e.bodyAId&&e.bodyBId)state.encounterLog[[e.bodyAId,e.bodyBId].sort().join("|")]=e}state.preset="blank";
      setProjectName(obj.projectName||obj.name||"Sistema importado");
      state.autoScale=obj.autoScale!==false;
      state.tagDefinitions=normalizeProjectTagDefinitions(obj.tagDefinitions);state.showTagBadges=obj.showTagBadges!==false;
      if(Number.isFinite(Number(obj.visualScale)))el("visualScale").value=String(obj.visualScale);
      state.labelVisibleIds=new Set(bs.map(b=>b.id));
      state.showDwarfPlanets=obj.showDwarfPlanets!==false;state.labelMode="multi";state.labelCategories=new Set(Array.isArray(obj.labelCategories)?obj.labelCategories:legacyLabelCategories(obj.labelMode||"all"));state.orbitMode=obj.orbitMode||"context";state.orbitGeometryMode=obj.orbitGeometryMode||"osculating";state.trailMode=obj.trailMode||"selected";state.trailMaxPoints=Math.max(100,Math.min(2400,Number(obj.trailMaxPoints)||600));
      if(el("orbitMode"))el("orbitMode").value=state.orbitMode;if(el("orbitGeometryMode"))el("orbitGeometryMode").value=state.orbitGeometryMode;if(el("trailMode"))el("trailMode").value=state.trailMode;if(el("trailLength"))el("trailLength").value=String(state.trailMaxPoints);
      state.selected=bs[0]?.id||null;
      const importedDynamic=bs.some(b=>Array.isArray(b._importCurrentPosition)&&Array.isArray(b._importCurrentVelocity));
      initialize();
      if(importedDynamic){for(const b of bs){if(Array.isArray(b._importCurrentPosition))b.pos.fromArray(b._importCurrentPosition);if(Array.isArray(b._importCurrentVelocity))b.vel.fromArray(b._importCurrentVelocity);delete b._importCurrentPosition;delete b._importCurrentVelocity}state.t=Number(obj.simulatedYears)||0;state.initialSnapshot=snapshot();state.lastEnergy=energy();invalidateRenderState();sampleRealTrails(true);renderBodies();updateAll()}
      state.encounterHistory=obj.encounterHistory&&typeof obj.encounterHistory==="object"?JSON.parse(JSON.stringify(obj.encounterHistory)):state.encounterHistory;
      state.experimentBaseline=obj.experimentBaseline&&Array.isArray(obj.experimentBaseline.bodies)?JSON.parse(JSON.stringify(obj.experimentBaseline)):captureExperimentState(importedDynamic?"Estado importado":"Inicio del experimento");state.experimentLastResult=null;
      setLabelCategories([...state.labelCategories]);
      if(state.selected)focusBody(state.selected,true);
      el("preset").value="blank";
    }
    function legacyAngleDeg(v){
      const n=numOr(v,0);
      return Math.abs(n)<=Math.PI*2+.001?n*180/Math.PI:n;
    }
    function importCanopusExperiment(obj){
      const p=obj?.parameters;if(!p)throw new Error("El experimento Canopus no contiene parameters.");
      const c=body({name:"Canopus",kind:"star",massSolar:numOr(p.M,9.8),massEarth:numOr(p.M,9.8)/EARTH_TO_SOLAR,
        radiusEarth:71.4*SOLAR_RADIUS_KM/EARTH_RADIUS_KM,radiusSolar:71.4,luminosity:10700,temperature:7400,color:"#fff0c7"});
      const specs=[
        ["Seban","mSeban","aSeban","eSeban","iSeban","oSeban","pSeban"],
        ["Menaris","mMen","aMen","eMen","iMen","oMen","pMen"],
        ["Arrakis","mArr","aArr","eArr","iArr","oArr","pArr"],
        ["Extaris","mExt","aExt","eExt","iExt","oExt","pExt"],
        ["Ven","mVen","aVen","eVen","iVen","oVen","pVen"],
        ["Revona","mRevona","aRevona","eRevona","iRevona","oRevona","pRevona"]
      ];
      const bs=[c];
      for(const s of specs){
        if(s[0]!=="Arrakis" && p["on"+s[0]]===false)continue;
        bs.push(body({name:s[0],kind:"planet",parent:c.id,massEarth:numOr(p[s[1]],1),radiusEarth:1,
          a:numOr(p[s[2]],1),e:numOr(p[s[3]],0),i:legacyAngleDeg(p[s[4]]),Omega:legacyAngleDeg(p[s[5]]),M0:legacyAngleDeg(p[s[6]]),
          rotationHours:24,color:s[0]==="Arrakis"?"#d89c45":"#91a8c0"}));
      }
      state.bodies=bs;state.references=[];state.preset="blank";setProjectName("Canopus importado");
      state.labelVisibleIds=new Set(bs.map(b=>b.id));state.selected=c.id;state.labelMode="all";state.autoScale=true;
      initialize();setLabelCategories(["selected","stars","planets","dwarfs","moons","spacecraft","minors","comets"]);focusBody(c.id,true);el("preset").value="blank";
    }
    function importCSVRecords(records,fileName=""){
      if(!records.length)throw new Error("El CSV está vacío.");
      const migrated=migrateLegacySyntheticRecords(records);const bs=migrated.map(importedBodyFromRecord);resolveImportedParents(bs);
      if(!bs.some(b=>b.kind==="star") && bs.length)throw new Error("El CSV no contiene ninguna estrella.");
      state.bodies=bs;state.references=[];state.preset="blank";
      setProjectName(fileName.replace(/\.[^.]+$/,"")||"Sistema CSV");
      state.labelVisibleIds=new Set(bs.map(b=>b.id));state.selected=bs[0]?.id||null;state.labelMode="all";state.autoScale=true;
      initialize();setLabelCategories(["selected","stars","planets","dwarfs","moons","spacecraft","minors","comets"]);if(state.selected)focusBody(state.selected,true);el("preset").value="blank";
    }
    async function importSystemFile(file){
      const status=el("importStatus");
      try{
        const raw=await file.text(),lower=file.name.toLowerCase();
        if(lower.endsWith(".json")){
          const obj=JSON.parse(raw);
          if(obj.schema==="voyastris-canopus-nbody-experiment-v1")importCanopusExperiment(obj);
          else importSystemForgeObject(obj);
        }else if(lower.endsWith(".csv")){
          importCSVRecords(parseCSV(raw),file.name);
        }else throw new Error("Formato no compatible. Usa JSON o CSV.");
        status.innerHTML=`<span style="color:var(--ok)">✓ ${state.projectName}</span> · ${state.bodies.length} cuerpos cargados`;
      }catch(err){
        console.error(err);status.innerHTML=`<span style="color:var(--bad)">Error:</span> ${err.message}`;
      }
    }
    function exportPresetJSON(){
      const obj=systemExportObject();
      delete obj.temporalAnalysis;delete obj.liveMetrics;delete obj.experimentBaseline;delete obj.experimentResults;delete obj.encounterHistory;obj.simulatedYears=0;
      obj.preset="custom";
      downloadBlob(safeFileStem(state.projectName)+"-preset.json",JSON.stringify(obj,null,2),"application/json");
    }
    function exportTemporalCSV(){
      const b=state.bodies.find(x=>x.id===state.selected),rec=temporalRecord(b,false);
      if(!b||!rec)return;
      const rows=["timeYears,deltaDays,osculatingPeriodYears,semiMajorAxisAU,eccentricity,distanceAU"];
      for(const x of rec.history)rows.push([x.t,x.d,x.p,x.a,x.e,x.r].map(csvEscape).join(","));
      downloadBlob(`${b.name.replaceAll(" ","_")}-temporal-analysis.csv`,rows.join("\n"),"text/csv;charset=utf-8");
    }
    function exportExperimentResultsJSON(){
      const r=experimentResultsData();if(!r)return;
      downloadBlob(safeFileStem(state.projectName)+"-experiment-results.json",JSON.stringify({schema:"system-forge-experiment-results",schemaVersion:1,appVersion:"1.9.5.0",generated:new Date().toISOString(),projectName:state.projectName,result:r},null,2),"application/json");
    }
    function exportSystemAnalysisJSON(){
      const obj={schema:"system-forge-analysis",schemaVersion:1,appVersion:"1.9.5.0",generated:new Date().toISOString(),
        projectName:state.projectName,preset:state.preset,analysis:systemAnalysisData(),
        references:window.SystemForgeCore.ReferenceRegistry.serialize(state.references),
        bodies:state.bodies.map(b=>({id:b.id,name:b.name,type:b.kind,parent:parentOf(b)?.name||null,massEarth:b.massEarth,a_AU:b.a,e:b.e,i_deg:b.i,orbitReferenceId:b.orbitReferenceId||null,orbitReferenceName:b.orbitReferenceName||"",trajectoryMode:b.trajectoryMode||"orbital",encounterRole:b.encounterRole||"",structureRole:b.structureRole||"",structureProfile:b.structureProfile||""}))};
      downloadBlob(safeFileStem(state.projectName)+"-analysis.json",JSON.stringify(obj,null,2),"application/json");
    }
    function exportJSON(){
      const name=safeFileStem(state.projectName)+"-system-forge.json";
      downloadBlob(name,JSON.stringify(systemExportObject(),null,2),"application/json");
    }
    function csvEscape(v){
      if(v===null||v===undefined)return "";
      const s=typeof v==="object"?JSON.stringify(v):String(v);
      return /[",\n;]/.test(s)?`"${s.replaceAll('"','""')}"`:s;
    }
    function exportCSV(){
      const rows=state.bodies.map(exportBodyRecord);
      const keys=["id","name","type","parent","parentId","massEarth","massSolar","radiusKm","density_g_cm3","albedo","surfacePressureBar",
        "rotationHours","obliquityDeg","rotationDirection","a_AU","e","i_deg","Omega_deg","omega_deg","M0_deg","luminositySolar","temperatureK",
        "disposition","massNature","dataSource","dataEpoch","observedPeriodDays","equilibriumTempK","stellarFluxEarth","radiusEstimated","radiusNature","temperatureNature","periodNature","catalogId","discoveryMethod","discoveryYear","sourceUrl","observationalNotes","planetClass","planetaryClass","satelliteClass","minorClass","dynamicClass","spacecraftClass","missionStatus","operator","missionName","vehicleId","dryMassKg","propellantMassKg","crewCapacity","propulsionType","characteristicSizeM","tags","notes"];
      const csv=[keys.join(","),...rows.map(r=>keys.map(k=>csvEscape(r[k])).join(","))].join("\n");
      downloadBlob(safeFileStem(state.projectName)+"-system-forge.csv",csv,"text/csv;charset=utf-8");
    }


    return {downloadBlob,parseCSV,systemExportObject,importSystemFile,importSystemForgeObject,importCSVRecords,exportPresetJSON,exportTemporalCSV,exportExperimentResultsJSON,exportSystemAnalysisJSON,exportJSON,exportCSV,csvEscape};
  }
  ns.createProjectIO=createProjectIO;
})(window);
