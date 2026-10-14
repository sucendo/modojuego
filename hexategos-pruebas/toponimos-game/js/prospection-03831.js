'use strict';
/* HEXATEGOS 0.38.31 · Prospección geológica real, incremental y persistente.
   Los depósitos ya existen, pero no se revelan antes de completar el estudio.
   El conocimiento pertenece al territorio, no al color de su propietario. */
(() => {
  const VERSION='0.38.31', SCHEMA=1;
  const COST=65, DURATION=48, MAX_PENDING=1024, PER_NATION=3;
  const MAX_JOBS_PER_TICK=12;
  const core=window.HexategosWorldCore03828,geology=window.HexategosGeology03830;
  const natural=window.HexategosNaturalPotential03829;
  if(!core||!geology||!natural){
    console.warn('[Hexategos prospección] Dependencias incompletas');return;
  }
  const studied=new Set(),pending=[];
  let cursor=0,revision=0;
  const seconds=()=>Math.max(0,Number(campaignSeconds3230)||0);
  function validCell(cell){
    return Number.isInteger(cell)&&cell>=0&&cell<owner6.length&&
      typeof terrainKey3250==='function'&&terrainKey3250(cell)!=='sea';
  }
  function jobAt(cell){return pending.find(x=>x.cell===cell)||null}
  function status(cell){
    cell=Number(cell);
    if(studied.has(cell))return {state:'completed',remaining:0};
    const job=jobAt(cell);
    return job?{state:'pending',remaining:Math.max(0,job.finish-seconds())}:
      {state:'unexplored',remaining:0};
  }
  function availability(f,cell){
    f=Number(f);cell=Number(cell);
    if(!Number.isInteger(f)||f<0||f>=activeFactionCount3230||!validCell(cell))
      return {ok:false,reason:'Hexágono o nación inválidos'};
    if(owner6[cell]!==f)return {ok:false,reason:'Se necesita controlar el territorio'};
    if(studied.has(cell))return {ok:false,reason:'Yacimiento ya prospectado'};
    if(jobAt(cell))return {ok:false,reason:'Prospección en curso'};
    if(pending.length>=MAX_PENDING)return {ok:false,reason:'Demasiados estudios simultáneos'};
    if(pending.filter(x=>x.f===f).length>=PER_NATION)
      return {ok:false,reason:'Límite temporal de estudios nacionales'};
    const gold=f===0?gold3212:botGold3230[f];
    if(gold<COST)return {ok:false,reason:'Faltan '+Math.ceil(COST-gold)+' de oro'};
    return {ok:true,reason:'Disponible',cost:COST,duration:DURATION};
  }
  function begin(f,cell){
    const check=availability(f,cell);
    if(!check.ok)return check;
    f=Number(f);cell=Number(cell);
    if(f===0)gold3212-=COST;else botGold3230[f]-=COST;
    pending.push({cell,f,finish:seconds()+DURATION});
    revision++;
    if(f===0&&typeof saveGame3212==='function')saveGame3212();
    return {ok:true,cell,cost:COST,duration:DURATION};
  }
  function tick(){
    if(!pending.length)return;
    let steps=0,changed=false;
    const now=seconds();
    while(pending.length&&steps<MAX_JOBS_PER_TICK){
      if(cursor>=pending.length)cursor=0;
      const job=pending[cursor];
      steps++;
      if(job.finish>now){cursor++;continue}
      studied.add(job.cell);
      pending.splice(cursor,1);
      revision++;changed=true;
      core.emit('resourceDiscovered',{cell:job.cell,faction:job.f,
        kinds:geology.kinds(),campaignSeconds:now});
    }
    if(changed)core.persist();
  }
  function result(cell){
    cell=Number(cell);
    if(!studied.has(cell))return null;
    const deposits={};
    for(const kind of geology.kinds()){
      const dep=geology.deposit(cell,kind);
      deposits[kind]=dep?natural.category(dep.quality):'No evaluable';
    }
    return deposits;
  }
  function snapshot(){
    return {v:SCHEMA,known:[...studied],pending:pending.map(j=>[
      j.cell,j.f,j.finish])};
  }
  function restore(data){
    studied.clear();pending.length=0;cursor=0;revision++;
    if(!data||typeof data!=='object')return;
    if(Array.isArray(data.known))for(const cell of data.known){
      if(validCell(cell))studied.add(cell);
    }
    if(Array.isArray(data.pending))for(const row of data.pending.slice(0,MAX_PENDING)){
      if(!Array.isArray(row)||row.length<3)continue;
      const [cell,f,finish]=row;
      if(!validCell(cell)||studied.has(cell)||!Number.isInteger(f)||
        f<0||f>=activeFactionCount3230||!Number.isFinite(finish)||jobAt(cell))continue;
      pending.push({cell,f,finish:Math.max(0,finish)});
    }
  }
  core.register({id:'geological-prospection',schemaVersion:SCHEMA,
    snapshot,restore,tick});
  window.HexategosProspection03831=Object.freeze({
    version:VERSION,availability,begin,status,result,
    hasKnowledge:cell=>studied.has(Number(cell)),
    stats:()=>({known:studied.size,pending:pending.length,revision}),
    cost:COST,duration:DURATION
  });
})();
