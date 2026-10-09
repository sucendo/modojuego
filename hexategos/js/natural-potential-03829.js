'use strict';
/* HEXATEGOS 0.38.29 · Potenciales naturales de superficie.
   Deterministas, independientes del propietario y calculados bajo demanda.
   NO se utilizan aún como yacimientos reales: eso pertenece al bloque C. */
(() => {
  const BUILD='0.38.29', GENERATOR=1, LEGACY_SEED=0x487E291A;
  const CACHE_LIMIT=4096;
  const cache=new Map();
  const core=window.HexategosWorldCore03828;
  if(!core||typeof cellLonLat3302!=='function'||typeof terrainKey3250!=='function'){
    console.warn('[Hexategos] Potenciales naturales: falta el núcleo o el atlas');return;
  }
  let seed=LEGACY_SEED;
  const clamp=(n,a=0,b=2.5)=>Math.max(a,Math.min(b,n));
  function hash(x,y,salt){
    let h=(seed^Math.imul(x|0,0x45d9f3b)^Math.imul(y|0,0x27d4eb2d)^(salt|0))>>>0;
    h=Math.imul(h^(h>>>16),0x7feb352d);
    h=Math.imul(h^(h>>>15),0x846ca68b);
    return ((h^(h>>>16))>>>0)/4294967295;
  }
  function smooth(t){return t*t*(3-2*t)}
  function noise(lat,lon,width=12,salt=0){
    const x=(lon+180)/width,y=(lat+90)/width;
    const ax=Math.floor(x),ay=Math.floor(y),fx=smooth(x-ax),fy=smooth(y-ay);
    const a=hash(ax,ay,salt),b=hash(ax+1,ay,salt);
    const c=hash(ax,ay+1,salt),d=hash(ax+1,ay+1,salt);
    return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
  }
  const surface={
    plain:        [1.36,1.25,0],
    mediterranean:[1.28,1.10,.08],
    savanna:      [.94,1.23,.12],
    steppe:       [.88,1.45,.02],
    forest:       [.97,.84,1.50],
    rainforest:   [1.06,.55,1.80],
    desert:       [.10,.19,0],
    tundra:       [.16,.30,0],
    ice:          [0,0,0],
    mountain:     [.31,.60,.16],
    highmountain: [.08,.24,.03],
    sea:          [0,0,0]
  };
  function profile(cell){
    cell=Number(cell);
    if(!Number.isInteger(cell)||cell<0||!window.__openfrontBootCompleted3281)return null;
    const hit=cache.get(cell);if(hit)return {...hit};
    let loc=null,type='sea';
    try{loc=cellLonLat3302(cell);type=terrainKey3250(cell)||'sea'}catch(_){return null}
    const lat=Number(loc?.lat),lon=Number(loc?.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
    const base=surface[type]||surface.plain;
    const latitude=Math.abs(lat);
    const cold=clamp((85-latitude)/65,0,1);
    // La vegetación, las pasturas y los minerales responden a factores
    // distintos y a ruido regional continuo, nunca al color de la frontera.
    const climate=.55+noise(lat,lon,20,0x11)*.90;
    const rain=.40+noise(lat,lon,9,0x28)*1.10;
    const pastures=.50+noise(lat,lon,14,0x39)*1.00;
    const forestDensity=.52+noise(lat,lon,11,0x4A)*.95;
    const deepMineral=.25+noise(lat,lon,22,0x60)*1.60;
    const deepEnergy=.18+noise(lat,lon,27,0x81)*1.80;
    const value=Object.freeze({
      type,food:clamp(base[0]*cold*climate*rain),
      livestock:clamp(base[1]*(.7+.3*cold)*climate*pastures),
      forest:clamp(base[2]*forestDensity),
      mineral:clamp(deepMineral),
      energy:clamp(deepEnergy)
    });
    if(cache.size>=CACHE_LIMIT)cache.delete(cache.keys().next().value);
    cache.set(cell,value);
    return {...value};
  }
  function category(value){
    const v=Number(value)||0;
    return v<=.02?'Inexistente':v<.38?'Muy bajo':v<.70?'Bajo':
      v<1.12?'Medio':v<1.62?'Alto':'Excepcional';
  }
  function clear(){cache.clear()}
  function restore(data){
    // Una partida anterior sin seed utiliza un valor fijo y reproducible.
    // No se crea una geología nueva al cargar repetidamente esa partida.
    const s=Number(data?.seed);
    seed=Number.isSafeInteger(s)&&s>0&&s<=0xffffffff?s>>>0:LEGACY_SEED;
    clear();
  }
  function freshSeed(){
    const random=new Uint32Array(1);
    if(window.crypto?.getRandomValues){
      window.crypto.getRandomValues(random);
      return (random[0]||LEGACY_SEED)>>>0;
    }
    // Solo al crear una partida; jamás durante el cálculo geográfico.
    const t=Date.now()>>>0;
    return (t^Math.imul(t>>>16,0x9e3779b1)||LEGACY_SEED)>>>0;
  }
  core.register({id:'natural-potential',schemaVersion:1,
    snapshot:()=>({seed,generator:GENERATOR}),
    restore});
  core.on('worldNewGame',()=>{
    seed=freshSeed();clear();
    core.persist();
  });
  window.HexategosNaturalPotential03829=Object.freeze({
    version:BUILD,generatorVersion:GENERATOR,profile,category,
    seed:()=>seed,cacheSize:()=>cache.size,cacheLimit:CACHE_LIMIT,
    // Extensión futura: las provincias regionales pueden reutilizar
    // el mismo ruido coherente sin copiar el generador ni tocar el atlas.
    regionalNoise:noise
  });
})();
