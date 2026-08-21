(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
core.SCHEMA_NAME="system-forge"; core.SCHEMA_VERSION=22;
const clone=v=>JSON.parse(JSON.stringify(v));
core.migrateProject=function(input){
  const obj=clone(input||{});
  if(obj.schema==="voyastris-canopus-nbody-experiment-v1")return obj;
  const fromSchemaVersion=Number(obj.schemaVersion)||0;
  if(obj.schema==="system-forge-v1"||obj.schema==="system-forge"||Array.isArray(obj.bodies)){
    obj.schema=core.SCHEMA_NAME;
    // v21 inserts a true-physical scale segment before the former v20 0..1 visual curve.
    if(fromSchemaVersion>0&&fromSchemaVersion<21&&Number.isFinite(Number(obj.visualScale))){
      const legacy=Math.max(0,Math.min(1,Number(obj.visualScale)));obj.visualScale=.25+.75*legacy;
    }
    obj.schemaVersion=core.SCHEMA_VERSION;
    obj.appVersion=obj.appVersion||obj.version||"legacy";
    obj.projectName=obj.projectName||obj.name||"Sistema importado";
    if(obj.orbitMode===undefined)obj.orbitMode="context";
    if(obj.orbitGeometryMode===undefined)obj.orbitGeometryMode="osculating";
    if(obj.trailMode===undefined)obj.trailMode="selected";
    if(obj.trailMaxPoints===undefined)obj.trailMaxPoints=600;
    if(Array.isArray(obj.tagDefinitions))for(const t of obj.tagDefinitions){
      if(t?.id==="lore"&&t.label==="Lore")t.label="CF";
      if(t?.id==="universe:dune"&&t.label==="Universo · Dune")t.label="Dune";
      if(t?.id==="universe:voyastris"&&t.label==="Universo · Voyastris")t.label="Voyastris";
    }
    obj.bodies=Array.isArray(obj.bodies)?obj.bodies:[];
    for(const b of obj.bodies){
      if(!b.id)b.id=crypto.randomUUID();
      if(b.kind&&!b.type)b.type=b.kind;
      if(b.parentId===undefined)b.parentId=null;
      if(b.orbitCenterIds===undefined)b.orbitCenterIds=null;
      if(b.orbitReferenceName===undefined)b.orbitReferenceName="";
      if(b.disposition===undefined)b.disposition="model";
      if(b.massNature===undefined)b.massNature="true";
      if(b.radiusEstimated===undefined)b.radiusEstimated=false;
      if(b.planetClass===undefined)b.planetClass="";
      if(b.minorClass===undefined)b.minorClass=(b.type||b.kind)==="minor"?(String(b.planetClass||"").toLowerCase().includes("cometa")?"comet":"other"):"";
      if((b.type||b.kind)==="minor"&&(b.minorClass==="dwarf-planet"||String(b.planetClass||"").toLowerCase().includes("planeta enano"))){
        b.type="planet";b.kind="planet";b.planetaryClass="dwarf-planet";b.minorClass="";
      }
      if(b.planetaryClass===undefined)b.planetaryClass=(b.type||b.kind)==="planet"?(String(b.planetClass||"").toLowerCase().includes("enano")?"dwarf-planet":"planet"):"";
      if(b.satelliteClass===undefined)b.satelliteClass=(b.type||b.kind)==="moon"?"regular":"";
      if(b.dynamicClass===undefined)b.dynamicClass="";
      if(b.binaryBarycenterId===undefined)b.binaryBarycenterId=null;
      if(b.notes===undefined)b.notes="";
      if(b.orbitReferenceId===undefined)b.orbitReferenceId=null;
      if(b.trajectoryMode===undefined)b.trajectoryMode="orbital";
      if(b.cartesianInitial===undefined)b.cartesianInitial=null;
      if(b.flybySpec===undefined)b.flybySpec=null;
      if(b.encounterRole===undefined)b.encounterRole="";
      if(b.tracerMode===undefined)b.tracerMode=false;
      if(b.tracerCount===undefined)b.tracerCount=0;
      if(b.tracerInnerThresholdAU===undefined)b.tracerInnerThresholdAU=null;
      if(b.structurePerturbable===undefined)b.structurePerturbable=true;
      if(b.structureAutoTracers===undefined)b.structureAutoTracers=true;
      if(b.structurePerturbationThreshold===undefined)b.structurePerturbationThreshold=0.001;
      if(b.radiusNature===undefined)b.radiusNature=b.radiusEstimated?"estimated":"unknown";
      if(b.temperatureNature===undefined)b.temperatureNature="unknown";
      if(b.periodNature===undefined)b.periodNature="unknown";
      if(b.catalogId===undefined)b.catalogId="";
      if(b.discoveryMethod===undefined)b.discoveryMethod="";
      if(b.discoveryYear===undefined)b.discoveryYear=null;
      if(b.sourceUrl===undefined)b.sourceUrl="";
      if(b.observationalNotes===undefined)b.observationalNotes="";
      if(b.catalogSource===undefined)b.catalogSource="";
      if(b.sourceFields===undefined)b.sourceFields=null;
      if(b.initialFlybySpec===undefined)b.initialFlybySpec=null;
      if(b.initialFlybyParentId===undefined)b.initialFlybyParentId=null;
      if(b.dynamicStatus===undefined)b.dynamicStatus="";
      if(b.capturedById===undefined)b.capturedById=null;
      if(b.captureEpochYears===undefined)b.captureEpochYears=null;
      if(b.lastAutonomousChange===undefined)b.lastAutonomousChange=null;
      if(!Array.isArray(b.tags))b.tags=[];
      if(b.catalogPositionLY===undefined)b.catalogPositionLY=null;
      if((b.type||b.kind)==="spacecraft"){
        if(b.spacecraftClass===undefined)b.spacecraftClass="other";
        if(b.missionStatus===undefined)b.missionStatus="planned";
        if(b.operator===undefined)b.operator="";
        if(b.missionName===undefined)b.missionName="";
        if(b.vehicleId===undefined)b.vehicleId="";
        if(b.dryMassKg===undefined)b.dryMassKg=0;
        if(b.propellantMassKg===undefined)b.propellantMassKg=0;
        if(b.crewCapacity===undefined)b.crewCapacity=0;
        if(b.propulsionType===undefined)b.propulsionType="";
        if(b.characteristicSizeM===undefined)b.characteristicSizeM=10;
      }
      if((b.type||b.kind)==="structure"){
        if(b.structureType===undefined)b.structureType="annulus";
        if(b.structureProfile===undefined)b.structureProfile="uniform";
        if(b.structureRole===undefined)b.structureRole="";
        if(b.innerAU===undefined)b.innerAU=2;
        if(b.outerAU===undefined)b.outerAU=3;
        if(b.thicknessDeg===undefined)b.thicknessDeg=8;
        if(b.pointCount===undefined)b.pointCount=700;
        if(b.gravityEnabled===undefined)b.gravityEnabled=true;
        if(b.structureSamples===undefined)b.structureSamples=20;
      }
    }
  }
  return obj;
};
core.projectEnvelope=appVersion=>({schema:core.SCHEMA_NAME,schemaVersion:core.SCHEMA_VERSION,appVersion});
})();