import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url)), root=resolve(here,'..'), groupDir=resolve(root,'data/groups');
const groups=['stations','visual','weather','resource','gps-ops','galileo','amateur','science','starlink'];
const gpBase='https://celestrak.org/NORAD/elements/gp.php';
const satcatBase='https://celestrak.org/satcat/records.php';
const userAgent='Satellite-Pulse-GitHub-Pages/1.0.0';
await mkdir(groupDir,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function existing(path){try{return JSON.parse(await readFile(path,'utf8'));}catch{return [];}}
async function downloadJson(url,label){
  console.log(`Descargando ${label}…`);
  const res=await fetch(url,{headers:{'user-agent':userAgent}});
  if(!res.ok){const body=await res.text().catch(()=> '');throw new Error(`${label}: HTTP ${res.status} ${body.slice(0,160)}`);}
  const data=await res.json();if(!Array.isArray(data))throw new Error(`${label}: respuesta no JSON-array`);return data;
}
function mergeGroup(gp,satcat,group){
  const sm=new Map((satcat||[]).map(x=>[String(x?.NORAD_CAT_ID??''),x]));
  return (gp||[]).map(item=>({...item,_SATCAT:sm.get(String(item?.NORAD_CAT_ID??''))||item?._SATCAT||null,_GROUPS:[...new Set([...(item?._GROUPS||[]),group])]}));
}

const union=new Map();let ok=0,failed=0,satcatOk=0;
for(const group of groups){
  const path=resolve(groupDir,`${group}.json`),param=`GROUP=${encodeURIComponent(group.toUpperCase())}`;let gp=[],satcat=[];
  const previous=await existing(path);
  try{gp=await downloadJson(`${gpBase}?${param}&FORMAT=JSON`,`${group} OMM`);ok++;}
  catch(err){failed++;console.error(String(err));gp=previous;console.error(`Se conserva snapshot anterior de ${group} (${gp.length} objetos).`);}
  await sleep(1800);
  try{satcat=await downloadJson(`${satcatBase}?${param}&FORMAT=JSON`,`${group} SATCAT`);satcatOk++;}
  catch(err){console.error(String(err));satcat=previous.map(x=>x?._SATCAT).filter(Boolean);if(satcat.length)console.error(`Se conserva SATCAT anterior de ${group} (${satcat.length} objetos).`);}
  const merged=mergeGroup(gp,satcat,group);await writeFile(path,JSON.stringify(merged));
  for(const item of merged){
    if(item?.NORAD_CAT_ID==null)continue;
    const id=String(item.NORAD_CAT_ID),prev=union.get(id);
    if(!prev)union.set(id,item);
    else union.set(id,{...prev,...item,_SATCAT:item._SATCAT||prev._SATCAT||null,_GROUPS:[...new Set([...(prev._GROUPS||[]),...(item._GROUPS||[])])]});
  }
  await sleep(1800);
}
const catalog=[...union.values()].sort((a,b)=>String(a.OBJECT_NAME||'').localeCompare(String(b.OBJECT_NAME||'')));
await writeFile(resolve(root,'data/catalog.json'),JSON.stringify(catalog));
await writeFile(resolve(root,'data/catalog-meta.json'),JSON.stringify({generatedAt:new Date().toISOString(),source:'CelesTrak OMM + SATCAT',count:catalog.length,groups,successfulGroups:ok,satcatGroups:satcatOk,failedGroups:failed},null,2));
console.log(`Catálogo generado: ${catalog.length} objetos únicos. OMM OK: ${ok}; SATCAT OK: ${satcatOk}; fallos OMM: ${failed}.`);
if(ok===0 && catalog.length===0)process.exitCode=1;
