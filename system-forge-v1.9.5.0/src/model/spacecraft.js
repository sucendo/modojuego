(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  const EARTH_MASS_KG=5.9722e24;
  const CLASSES=[
    ["artificial-satellite","satélite artificial"],
    ["probe","sonda"],
    ["crewed","nave tripulada"],
    ["station","estación espacial"],
    ["lander","módulo de aterrizaje"],
    ["rover","rover"],
    ["telescope","observatorio espacial"],
    ["cargo","nave de carga"],
    ["relay","repetidor"],
    ["debris","objeto artificial"],
    ["other","vehículo espacial"]
  ];
  const LABELS=Object.fromEntries(CLASSES);
  class SpacecraftModel{
    static get classes(){return CLASSES.map(x=>[...x])}
    static isSpacecraft(body){return body?.kind==="spacecraft"||body?.type==="spacecraft"}
    static classLabel(value){return LABELS[value]||LABELS.other}
    static massEarthFromKg(kg){const n=Number(kg);return Number.isFinite(n)&&n>0?n/EARTH_MASS_KG:0}
    static totalMassKg(body){return Math.max(0,Number(body?.dryMassKg)||0)+Math.max(0,Number(body?.propellantMassKg)||0)}
    static defaultRadiusKm(body){const size=Math.max(0,Number(body?.characteristicSizeM)||0);return size>0?size/2000:.005}
    static normalize(body={}){
      if(!this.isSpacecraft(body))return body;
      if(!body.spacecraftClass)body.spacecraftClass="other";
      if(body.missionStatus==null)body.missionStatus="planned";
      if(body.operator==null)body.operator="";
      if(body.missionName==null)body.missionName="";
      if(body.vehicleId==null)body.vehicleId="";
      if(body.dryMassKg==null)body.dryMassKg=0;
      if(body.propellantMassKg==null)body.propellantMassKg=0;
      if(body.crewCapacity==null)body.crewCapacity=0;
      if(body.propulsionType==null)body.propulsionType="";
      if(body.characteristicSizeM==null)body.characteristicSizeM=10;
      return body;
    }
    static reducedFollower(body){return body?.kind==="moon"||this.isSpacecraft(body)}
  }
  ns.SpacecraftModel=SpacecraftModel;
})(window);
