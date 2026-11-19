// Real-time unlocks are derived from per-world statistics and exploration.
// Timestamps persist so imported worlds retain their achievement history.
export const ACHIEVEMENTS = Object.freeze([
  {id:'firstBuild',key:'achFirstBuild',check:(p,e)=>p.blocksPlaced>=1},
  {id:'architect',key:'achArchitect',check:(p,e)=>p.blocksPlaced>=100},
  {id:'miner',key:'achMiner',check:(p,e)=>p.blocksBroken>=50},
  {id:'crafter',key:'achCrafter',check:(p,e)=>p.itemsCrafted>=1},
  {id:'explorer',key:'achExplorer',check:(p,e)=>p.distanceMeters>=500},
  {id:'zoologist',key:'achZoologist',check:(p,e)=>p.speciesSeen.length===4},
  {id:'rested',key:'achRested',check:(p,e)=>p.nightsSlept>=1},
  {id:'pioneer',key:'achPioneer',check:(p,e)=>e.visitedPois.length>=1}
]);
export const freshAchievements=()=>({unlocked:{}});
export function validateAchievements(value, invalid=()=>{throw new Error('invalidFile');}){
  if(value===undefined)return freshAchievements();
  if(!value || Array.isArray(value) || typeof value!=='object' || !value.unlocked ||
     Array.isArray(value.unlocked) || typeof value.unlocked!=='object')return invalid();
  const result={unlocked:{}};
  for(const [id,date] of Object.entries(value.unlocked)){
    if(!ACHIEVEMENTS.some(a=>a.id===id)||typeof date!=='string'||date.length>40||!Number.isFinite(Date.parse(date)))return invalid();
    result.unlocked[id]=date;
  }
  return result;
}
export class AchievementTracker{
  constructor(onChange=()=>{},onUnlock=()=>{}){this.onChange=onChange;this.onUnlock=onUnlock;this.restore();}
  restore(data){this.data=validateAchievements(data);}
  snapshot(){return {unlocked:{...this.data.unlocked}};}
  update(progress,exploration,announce=true){
    let unlocked=[];
    for(const def of ACHIEVEMENTS){
      if(!this.data.unlocked[def.id] && def.check(progress,exploration)){
        this.data.unlocked[def.id]=new Date().toISOString();unlocked.push(def);
      }
    }
    if(unlocked.length){this.onChange();if(announce)unlocked.forEach(a=>this.onUnlock(a.key));}
    return unlocked;
  }
}
