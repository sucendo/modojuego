(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
const GALAXY_BLOB_SHA="b79b61ba4523005daa9433d3fd63dbd0c3f1dcc4";
const SYSTEMS_BLOB_SHA="123ceea4c5557f99e232ac8390cedd4a509f3fe5";
const LEGACY_CACHE_KEY="system-forge:voyastris-galaxy:enriched:v2";
const SECTION_NAMES=["star","planets","satellites","artificialSatellites","comets","asteroids"];
const scriptUrl=(document.currentScript&&document.currentScript.src)
  ?document.currentScript.src
  :new URL("./src/catalog/voyastris-galaxy.js",document.baseURI).href;
const SNAPSHOT_URL=new URL("./voyastris-source/galaxy.js",scriptUrl).href;
// Compatibility: older System Forge code reads SOURCE_URL for provenance.
// It now points only to the bundled local snapshot.
const SOURCE_URL=SNAPSHOT_URL;
const SOURCE_URLS=[SNAPSHOT_URL];
const MODULE_URL=SNAPSHOT_URL;
const state={status:"idle",error:null,galaxy:null,index:new Map(),entries:null,loadedAt:null,sourceUrl:SNAPSHOT_URL,sourceKind:"snapshot local",promise:null,_refreshing:null};
function plain(v){return v&&typeof v==="object"?JSON.parse(JSON.stringify(v)):v}
function baseEntries(){return Array.isArray(core.VoyastrisCatalog)?core.VoyastrisCatalog:[]}
function babylonShim(){
  const fallbackCtor=()=>function(...args){return {args}};
  return new Proxy(
    {Color3:function(r,g,b){return {r:Number(r),g:Number(g),b:Number(b)}},Vector3:function(x,y,z){return {x:Number(x),y:Number(y),z:Number(z)}},Color4:function(r,g,b,a){return {r:Number(r),g:Number(g),b:Number(b),a:Number(a)}}},
    {get(target,key){return key in target?target[key]:fallbackCtor()}}
  );
}
function buildIndex(galaxy){
  const base=new Map(baseEntries().map(e=>[e.name,e])),stars=galaxy?.star||{},planets=galaxy?.planets||{},satellites=galaxy?.satellites||{};
  const index=new Map();
  const ensure=name=>{if(!name)return null;if(!index.has(name))index.set(name,{name,stars:[],planets:[],satellites:[],artificialSatellites:[],comets:[],asteroids:[]});return index.get(name)};
  const starMemo=new Map();
  function starSystem(name,seen=new Set()){
    if(starMemo.has(name))return starMemo.get(name);
    if(seen.has(name))return base.has(name)?name:null;seen.add(name);
    const s=stars[name];if(!s){const direct=base.has(name)?name:null;starMemo.set(name,direct);return direct}
    const o=String(s.orbits||name);
    let sys=null;
    if(base.has(o))sys=o;else if(o===name&&base.has(name))sys=name;else if(stars[o])sys=starSystem(o,seen);else if(base.has(name))sys=name;else sys=o||name;
    starMemo.set(name,sys);return sys;
  }
  const bodyMemo=new Map();
  function objectSystem(section,name,seen=new Set()){
    const key=`${section}:${name}`;if(bodyMemo.has(key))return bodyMemo.get(key);if(seen.has(key))return null;seen.add(key);
    const dict=galaxy?.[section]||{},d=dict[name];if(!d)return null;const parent=String(d.orbits||"");let sys=null;
    if(stars[parent])sys=starSystem(parent);
    else if(planets[parent])sys=objectSystem("planets",parent,seen);
    else if(satellites[parent])sys=objectSystem("satellites",parent,seen);
    else if(base.has(parent))sys=parent;
    bodyMemo.set(key,sys);return sys;
  }
  for(const [name,data] of Object.entries(stars)){const sys=starSystem(name)||name;ensure(sys)?.stars.push({name,data:plain(data),section:"star"})}
  for(const section of ["planets","satellites","artificialSatellites","comets","asteroids"]){
    for(const [name,data] of Object.entries(galaxy?.[section]||{})){const sys=objectSystem(section,name)||String(data?.orbits||"")||name;ensure(sys)?.[section].push({name,data:plain(data),section})}
  }
  for(const e of baseEntries())ensure(e.name);
  state.index=index;
  const combined=[];const seen=new Set();
  for(const e of baseEntries()){combined.push({...e,details:index.get(e.name)||null});seen.add(e.name)}
  for(const [name,details] of index){if(!seen.has(name))combined.push({name,x:null,y:null,z:null,distanceLY:null,loreAlias:null,details})}
  state.entries=combined;return index;
}
async function loadLocalSnapshot(){
  const previous=globalThis.BABYLON;
  try{
    if(!globalThis.BABYLON)globalThis.BABYLON=babylonShim();
    const mod=await import(`${SNAPSHOT_URL}?blob=${GALAXY_BLOB_SHA.slice(0,12)}`);
    if(!mod?.GALAXY||typeof mod.GALAXY!=="object")throw new Error("La instantánea local no exporta GALAXY");
    return {galaxy:plain(mod.GALAXY),url:SNAPSHOT_URL,kind:`snapshot local · ${GALAXY_BLOB_SHA.slice(0,8)}`};
  }catch(err){
    const hint="Ejecuta setup-voyastris-offline.cmd una vez para copiar el catálogo privado desde tu checkout local de Voyastris.";
    throw new Error(`${err?.message||String(err)} · ${hint}`);
  }finally{
    if(previous===undefined)try{delete globalThis.BABYLON}catch(_){globalThis.BABYLON=undefined}
    else globalThis.BABYLON=previous;
  }
}
async function ensureLoaded(options={}){
  const force=options===true||options?.force===true;
  if(state.status==="ready"&&!force)return state;
  if(state.status==="loading"&&state.promise&&!force)return state.promise;
  state.status="loading";state.error=null;
  state.promise=(async()=>{
    try{
      const loaded=await loadLocalSnapshot();
      state.galaxy=loaded.galaxy;buildIndex(loaded.galaxy);state.status="ready";state.loadedAt=new Date().toISOString();state.sourceUrl=loaded.url;state.sourceKind=loaded.kind;state.error=null;return state;
    }catch(err){
      state.galaxy=null;state.status="error";state.error=err?.message||String(err);state.entries=baseEntries().map(e=>({...e,details:null}));state.index=new Map();return state;
    }finally{state.promise=null}
  })();
  return state.promise;
}
async function refreshLocal(){
  if(state._refreshing)return state._refreshing;
  state._refreshing=(async()=>{
    state.status="idle";state.promise=null;
    const result=await ensureLoaded({force:true});
    try{if(typeof window.renderStarCatalog==="function")window.renderStarCatalog()}catch(_){}
    state._refreshing=null;return result;
  })();
  return state._refreshing;
}
// Compatibility alias. Despite the historic name it performs only a local reload.
const refreshRemote=refreshLocal;
function clearCache(){
  try{localStorage.removeItem(LEGACY_CACHE_KEY)}catch(_){}
  state.status="idle";state.error=null;state.galaxy=null;state.index=new Map();state.entries=null;state.loadedAt=null;state.sourceKind="snapshot local";state.promise=null;
}
function entries(){return state.entries||baseEntries().map(e=>({...e,details:state.index.get(e.name)||null}))}
function details(name){return state.index.get(name)||null}
core.VoyastrisGalaxy={SOURCE_URL,SOURCE_URLS,MODULE_URL,SNAPSHOT_URL,GALAXY_BLOB_SHA,SYSTEMS_BLOB_SHA,state,buildIndex,ensureLoaded,refreshLocal,refreshRemote,clearCache,entries,details,SECTION_NAMES};
})();
