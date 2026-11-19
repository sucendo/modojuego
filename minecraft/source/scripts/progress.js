// Compact per-world counters. Deliberately keep only four discovered species,
// not individual animal IDs (which can grow unbounded in a large world).
export const ANIMAL_SPECIES = Object.freeze(['sheep','cow','pig','chicken']);
export const freshProgress = () => ({
  blocksPlaced:0, blocksBroken:0, distanceMeters:0, itemsCrafted:0,
  animalsHarvested:0, nightsSlept:0, speciesSeen:[]
});
const counters=['blocksPlaced','blocksBroken','distanceMeters','itemsCrafted','animalsHarvested','nightsSlept'];
export function validateProgress(value, invalid = () => { throw new Error('invalidFile'); }) {
  if (value === undefined) return freshProgress();
  if (!value || Array.isArray(value) || typeof value !== 'object' ||
      !Array.isArray(value.speciesSeen) || value.speciesSeen.length>ANIMAL_SPECIES.length ||
      new Set(value.speciesSeen).size!==value.speciesSeen.length ||
      !value.speciesSeen.every(s=>ANIMAL_SPECIES.includes(s))) return invalid();
  const clean=freshProgress();
  for(const name of counters){
    const number=value[name];
    if(typeof number !== 'number' || !Number.isFinite(number) || number<0 || number>1e10 ||
       (name!=='distanceMeters' && !Number.isSafeInteger(number))) return invalid();
    clean[name]=number;
  }
  clean.speciesSeen=[...value.speciesSeen];
  return clean;
}

export class ProgressTracker {
  constructor(onChange=()=>{}) {this.onChange=onChange;this.restore(freshProgress());}
  restore(data){this.data=validateProgress(data);this.previous=null;}
  snapshot(){return {...this.data,speciesSeen:[...this.data.speciesSeen]};}
  increment(key,amount=1){
    if(!counters.includes(key)||!Number.isFinite(amount)||amount<=0)return;
    this.data[key]=Math.min(1e10,this.data[key]+amount);
    this.onChange();
  }
  spotSpecies(species){
    if(!ANIMAL_SPECIES.includes(species)||this.data.speciesSeen.includes(species))return false;
    this.data.speciesSeen.push(species);this.onChange();return true;
  }
  resetMovement(position){this.previous=position?{x:position.x,z:position.z}:null;}
  observeMovement(position){
    if(!position || !Number.isFinite(position.x) || !Number.isFinite(position.z))return;
    if(this.previous){
      const length=Math.hypot(position.x-this.previous.x,position.z-this.previous.z);
      // Reject respawns, teleports and other discontinuities.
      if(length>0.005 && length<3) this.increment('distanceMeters',length);
    }
    this.resetMovement(position);
  }
}
