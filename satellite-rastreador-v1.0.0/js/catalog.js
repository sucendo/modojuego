import { CATALOG_GROUPS, CELESTRAK_BASE, CELESTRAK_CACHE_MS, CELESTRAK_SATCAT_BASE } from './config.js';
import { fetchJson } from './utils.js';
import { Storage } from './storage.js';

function normalizeOmm(item){
  if(!item || typeof item!=='object') return null;
  const omm={...item};
  const numeric=['MEAN_MOTION','ECCENTRICITY','INCLINATION','RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY','EPHEMERIS_TYPE','NORAD_CAT_ID','ELEMENT_SET_NO','REV_AT_EPOCH','BSTAR','MEAN_MOTION_DOT','MEAN_MOTION_DDOT'];
  for(const k of numeric){ if(omm[k]!=='' && omm[k]!=null && Number.isFinite(Number(omm[k]))) omm[k]=Number(omm[k]); }
  if(!omm.OBJECT_NAME) omm.OBJECT_NAME=`NORAD ${omm.NORAD_CAT_ID ?? '?'}`;
  if(omm._SATCAT)omm._SATCAT=normalizeSatcat(omm._SATCAT);
  if(Array.isArray(omm._GROUPS))omm._GROUPS=[...new Set(omm._GROUPS.map(String))];
  return omm;
}
function normalizeSatcat(item){
  if(!item||typeof item!=='object')return null;
  const s={...item};
  for(const k of ['NORAD_CAT_ID','PERIOD','INCLINATION','APOGEE','PERIGEE','RCS']){
    if(s[k]!==''&&s[k]!=null&&Number.isFinite(Number(s[k])))s[k]=Number(s[k]);
  }
  return s;
}
function uniqueByNorad(items){
  const m=new Map();
  for(const raw of items||[]){ const x=normalizeOmm(raw); if(x?.NORAD_CAT_ID!=null) m.set(String(x.NORAD_CAT_ID),x); }
  return [...m.values()];
}
function cacheKey(kind,value){ return `celestrak.${kind}.${String(value).toLowerCase().replace(/[^a-z0-9_-]/g,'_')}`; }
function mergeSatcat(items,satcatItems,group=null){
  const sm=new Map((satcatItems||[]).map(x=>[String(x?.NORAD_CAT_ID??''),normalizeSatcat(x)]));
  return uniqueByNorad(items).map(x=>{
    const out={...x};
    const sat=sm.get(String(x.NORAD_CAT_ID));if(sat)out._SATCAT=sat;
    const groups=new Set(out._GROUPS||[]);if(group)groups.add(group);out._GROUPS=[...groups];
    return out;
  });
}

export class CatalogService {
  constructor(){ this.catalog=[]; this.meta=null; this.ready=false; }
  async init(){
    try{
      const [cat,meta]=await Promise.all([fetchJson('./data/catalog.json',{cache:'no-cache'}),fetchJson('./data/catalog-meta.json',{cache:'no-cache'})]);
      this.catalog=uniqueByNorad(cat); this.meta=meta; this.ready=true;
    }catch(err){ this.catalog=[]; this.meta={generatedAt:null,source:'CelesTrak OMM + SATCAT',count:0,error:String(err)}; }
    return this;
  }
  localSearch(query,limit=60){
    const q=String(query||'').trim().toLowerCase(); if(!q) return [];
    const digits=/^\d+$/.test(q);
    const score=x=>{
      const id=String(x.NORAD_CAT_ID??''), name=String(x.OBJECT_NAME||'').toLowerCase(), owner=String(x._SATCAT?.OWNER||'').toLowerCase();
      if(digits && id===q) return 1000;
      if(name===q) return 900;
      if(name.startsWith(q)) return 700;
      if(name.includes(q)) return 500;
      if(id.includes(q)) return 300;
      if(owner&&owner===q)return 180;
      return -1;
    };
    return this.catalog.map(x=>({x,s:score(x)})).filter(v=>v.s>=0).sort((a,b)=>b.s-a.s||String(a.x.OBJECT_NAME).localeCompare(String(b.x.OBJECT_NAME))).slice(0,limit).map(v=>v.x);
  }
  async fetchCached(kind,value,url,{force=false,normalizer='omm'}={}){
    const key=cacheKey(kind,value), cached=Storage.getCache(key), now=Date.now();
    if(!force && cached?.time && now-cached.time<CELESTRAK_CACHE_MS && Array.isArray(cached.data)){
      return {data:normalizer==='satcat'?cached.data.map(normalizeSatcat).filter(Boolean):uniqueByNorad(cached.data),source:'caché local'};
    }
    const raw=await fetchJson(url,{cache:'no-store'});
    const data=normalizer==='satcat'?(Array.isArray(raw)?raw.map(normalizeSatcat).filter(Boolean):[]):uniqueByNorad(raw);
    Storage.setCache(key,{time:now,data});
    return {data,source:'CelesTrak'};
  }
  async fetchSatcat(queryKey,param,{force=false}={}){
    return this.fetchCached(`satcat.${queryKey}`,param,`${CELESTRAK_SATCAT_BASE}?${param}&FORMAT=JSON`,{force,normalizer:'satcat'});
  }
  async search(query){
    const q=String(query||'').trim(); if(!q) return {data:[],source:'—'};
    const local=this.localSearch(q);
    if(this.catalog.length>500 && local.length) return {data:local,source:'snapshot local'};
    const isId=/^\d{1,9}$/.test(q),param=isId?`CATNR=${encodeURIComponent(q)}`:`NAME=${encodeURIComponent(q)}`;
    try{
      const gp=await this.fetchCached('search',q,`${CELESTRAK_BASE}?${param}&FORMAT=JSON`);
      let sat=[];try{sat=(await this.fetchSatcat('search',param)).data;}catch(err){console.warn('SATCAT no disponible para búsqueda',err);}
      return {data:mergeSatcat(gp.data,sat),source:sat.length?'CelesTrak OMM + SATCAT':gp.source};
    }catch(err){
      if(local.length) return {data:local,source:'snapshot local (CelesTrak no disponible)'};
      throw new Error(`No se pudo consultar CelesTrak desde el navegador. ${err.message}`);
    }
  }
  async group(group){
    if(!CATALOG_GROUPS[group]) throw new Error('Grupo de catálogo desconocido');
    try{
      const local=uniqueByNorad(await fetchJson(`./data/groups/${encodeURIComponent(group)}.json`,{cache:'no-cache'}));
      if(local.length) return {data:local.slice(0,5000),source:`snapshot ${CATALOG_GROUPS[group]}`};
    }catch{}
    const param=`GROUP=${encodeURIComponent(group.toUpperCase())}`;
    try{
      const gp=await this.fetchCached('group',group,`${CELESTRAK_BASE}?${param}&FORMAT=JSON`);
      let sat=[];try{sat=(await this.fetchSatcat('group',param)).data;}catch(err){console.warn('SATCAT no disponible para grupo',err);}
      return {data:mergeSatcat(gp.data,sat,group),source:sat.length?'CelesTrak OMM + SATCAT':gp.source};
    }catch(err){ throw new Error(`No se pudo cargar ${CATALOG_GROUPS[group]}. ${err.message}`); }
  }
  async refreshNorad(norad,{force=false}={}){
    const id=String(norad||'').trim(); if(!/^\d{1,9}$/.test(id)) throw new Error('NORAD ID inválido');
    const gp=await this.fetchCached('norad',id,`${CELESTRAK_BASE}?CATNR=${encodeURIComponent(id)}&FORMAT=JSON`,{force});
    let sat=[];try{sat=(await this.fetchSatcat('norad',`CATNR=${encodeURIComponent(id)}`,{force})).data;}catch(err){console.warn('SATCAT no disponible para NORAD',id,err);}
    return mergeSatcat(gp.data,sat)[0]||null;
  }
  async ensureMetadata(omm,{force=false}={}){
    const id=String(omm?.NORAD_CAT_ID??'').trim();if(!/^\d{1,9}$/.test(id))return omm;
    if(omm?._SATCAT&&!force)return omm;
    try{
      const sat=(await this.fetchSatcat('norad',`CATNR=${encodeURIComponent(id)}`,{force})).data[0];
      return sat?{...omm,_SATCAT:sat}:omm;
    }catch{return omm;}
  }
}
