// Weather-driven distance fog. The view is clear in fair weather, especially
// above the valleys; dense fog returns only with rain, snow or dust/ash storms.
// Preferences are saved separately from the live, interpolated fog distances.
export const DEFAULT_FOG=Object.freeze({near:85,far:130});
const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
const mix=(a,b,t)=>a+(b-a)*t;
export function migrateFogPreferences(near,far){
  // Old saves wrote the hard-coded 50/75 values even without an explicit choice.
  if((near===50&&far===75)||(near===undefined&&far===undefined))return {...DEFAULT_FOG};
  return {
    near:Number.isFinite(near)?near:DEFAULT_FOG.near,
    far:Number.isFinite(far)?far:DEFAULT_FOG.far
  };
}
export function fogTarget(weather={},position={y:24},world={},preferences=DEFAULT_FOG,sheltered=false){
  const baseWater=world.params?.terrain?.waterOffset ?? 8;
  const high=clamp(((position.y??24)-baseWater-12)/36);
  const hasLod=typeof world.getHorizonDistance==='function';
  const horizonRadius=world.getHorizonDistance?.()??world.getRenderDistance?.()??world.drawDistance??3;
  const maxHorizon=Math.max(60,(horizonRadius+1)*32);
  // In clear weather the far LOD is actually visible; the old fixed fog of
  // 130 blocks would otherwise conceal all the new 6–16 chunk horizon.
  const preferredFar=(preferences.far??130)+high*34;
  const preferredNear=(preferences.near??85)+high*27;
  const brightFar=hasLod&&horizonRadius>=6
    ? Math.min(maxHorizon,Math.max(preferredFar,horizonRadius*32-12+high*18))
    : Math.min(preferredFar,maxHorizon+high*16);
  const brightNear=hasLod&&horizonRadius>=6
    ? Math.min(brightFar-45,Math.max(preferredNear,brightFar-80))
    : Math.min(preferredNear,maxHorizon+high*16-31);
  const severity=(sheltered?.12:1)*clamp(Math.max((weather.rain??0)*.8,(weather.snow??0)*.92,
    (weather.storm??0)*.98,(weather.dust??0)*1.15,(weather.ash??0)*1.08));
  const dryNear=brightNear+(sheltered?25:0), dryFar=brightFar+(sheltered?30:0);
  const near=mix(dryNear,22,severity),far=mix(dryFar,65,severity);
  return {near:Math.max(1,near),far:Math.max(near+20,far)};
}
export class FogAtmosphere {
  constructor(scene,world){this.scene=scene;this.world=world;}
  update(weather,position,dt=0,force=false,sheltered=false){
    if(!this.scene.fog)return;
    const settings=this.scene.userData?.fogPreferences??DEFAULT_FOG;
    const target=fogTarget(weather,position,this.world,settings,sheltered);
    const a=force?1:1-Math.exp(-Math.max(0,Math.min(dt,.25))*2.4);
    this.scene.fog.near=mix(this.scene.fog.near,target.near,a);
    this.scene.fog.far=mix(this.scene.fog.far,target.far,a);
  }
}
