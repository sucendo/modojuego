(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
core.SCHEMA_NAME="system-forge"; core.SCHEMA_VERSION=13;
const clone=v=>JSON.parse(JSON.stringify(v));
core.migrateProject=function(input){
  const obj=clone(input||{});
  if(obj.schema==="voyastris-canopus-nbody-experiment-v1")return obj;
  if(obj.schema==="system-forge-v1"||obj.schema==="system-forge"||Array.isArray(obj.bodies)){
    obj.schema=core.SCHEMA_NAME;
    obj.schemaVersion=core.SCHEMA_VERSION;
    obj.appVersion=obj.appVersion||obj.version||"legacy";
    obj.projectName=obj.projectName||obj.name||"Sistema importado";
    if(obj.orbitMode===undefined)obj.orbitMode="context";
    if(obj.orbitGeometryMode===undefined)obj.orbitGeometryMode="osculating";
    if(obj.trailMode===undefined)obj.trailMode="selected";
    if(obj.trailMaxPoints===undefined)obj.trailMaxPoints=600;
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
      if(b.initialFlybySpec===undefined)b.initialFlybySpec=null;
      if(b.initialFlybyParentId===undefined)b.initialFlybyParentId=null;
      if(b.dynamicStatus===undefined)b.dynamicStatus="";
      if(b.capturedById===undefined)b.capturedById=null;
      if(b.captureEpochYears===undefined)b.captureEpochYears=null;
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