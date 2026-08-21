(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  const C_KMS=299792.458;
  class RelativeMeasurement{
    constructor({G=4*Math.PI*Math.PI,AU_KM=149597870.7,KMS_TO_AUYR=365.25*86400/149597870.7,massSolar,orbitalDynamics}={}){
      Object.assign(this,{G,AU_KM,KMS_TO_AUYR,massSolar,orbitalDynamics});
    }
    compute(a,b){
      if(!a||!b||a===b||!a.pos||!b.pos||!a.vel||!b.vel)return null;
      const r=b.pos.clone().sub(a.pos),v=b.vel.clone().sub(a.vel),distanceAU=r.length();
      if(!(distanceAU>0))return null;
      const speedAUyr=v.length(),radialAUyr=r.dot(v)/distanceAU,tangentialAUyr=Math.sqrt(Math.max(0,speedAUyr*speedAUyr-radialAUyr*radialAUyr));
      const mA=Math.max(0,Number(this.massSolar?.(a))||0),mB=Math.max(0,Number(this.massSolar?.(b))||0),mu=this.G*(mA+mB);
      const specificEnergy=mu>0?0.5*speedAUyr*speedAUyr-mu/distanceAU:null;
      const h=r.clone().cross(v),specificAngularMomentum=h.length();
      const elements=mu>0?this.orbitalDynamics?.elementsFromState?.(r.toArray(),v.toArray(),mu):null;
      return {
        reference:a,target:b,distanceAU,distanceKm:distanceAU*this.AU_KM,
        lightTimeSeconds:distanceAU*this.AU_KM/C_KMS,
        relativeSpeedKms:speedAUyr/this.KMS_TO_AUYR,
        radialSpeedKms:radialAUyr/this.KMS_TO_AUYR,
        tangentialSpeedKms:tangentialAUyr/this.KMS_TO_AUYR,
        specificEnergyAU2Yr2:specificEnergy,
        specificEnergyKm2S2:specificEnergy==null?null:specificEnergy/(this.KMS_TO_AUYR*this.KMS_TO_AUYR),
        specificAngularMomentumAU2Yr:specificAngularMomentum,
        specificAngularMomentumKm2S:specificAngularMomentum*this.AU_KM/this.KMS_TO_AUYR,
        angularMomentumVectorAU2Yr:h.toArray(),
        muAU3Yr2:mu,totalMassSolar:mA+mB,
        bound:mu>0&&specificEnergy<0,
        hyperbolic:mu>0&&specificEnergy>=0,
        elements
      };
    }
  }
  ns.RelativeMeasurement=RelativeMeasurement;
})(window);
