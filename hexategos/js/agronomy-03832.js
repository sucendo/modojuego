'use strict';
/* HEXATEGOS 0.38.32 · Evaluación agronómica; independiente de minería.
   Estudio económico y rápido, sólo estado por hexágonos estudiados.
   La aptitud agrícola y ganadera no cambia con el propietario. */
(() => {
  const VERSION='0.38.32',SCHEMA=1,COST=22,DURATION=16;
  const MAX_PENDING=1024,PER_NATION=4,MAX_CHECKS=16;
  const core=window.HexategosWorldCore03828;
  const natural=window.HexategosNaturalPotential03829;
  if(!core||!natural){console.warn('[Hexategos agronomía] Falta el núcleo');return}
  const known=new Set(),pending=[];
  let cursor=0,revision=0;
  const seconds=()=>Math.max(0,Number(campaignSeconds3230)||0);
  const isLand=cell=>Number.isInteger(cell)&&cell>=0&&cell<owner6.length&&
    typeof terrainKey3250==='function'&&terrainKey3250(cell)!=='sea';
  const pendingAt=cell=>pending.find(x=>x.cell===cell)||null;
  function status(cell){
    cell=Number(cell);
    if(known.has(cell))return {state:'completed',remaining:0};
    const job=pendingAt(cell);
    return job?{state:'pending',remaining:Math.max(0,job.finish-seconds())}:
      {state:'unexplored',remaining:0};
  }
  function availability(f,cell){
    f=Number(f);cell=Number(cell);
    if(!Number.isInteger(f)||f<0||f>=activeFactionCount3230||!isLand(cell))
      return {ok:false,reason:'Hexágono o nación inválidos'};
    if(owner6[cell]!==f)return {ok:false,reason:'Debes controlar el territorio'};
    if(known.has(cell))return {ok:false,reason:'Terreno ya evaluado'};
    if(pendingAt(cell))return {ok:false,reason:'Evaluación en curso'};
    if(pending.length>=MAX_PENDING||pending.filter(x=>x.f===f).length>=PER_NATION)
      return {ok:false,reason:'Límite de evaluaciones simultáneas'};
    const gold=f===0?gold3212:botGold3230[f];
    if(gold<COST)return {ok:false,reason:'Oro insuficiente'};
    return {ok:true,cost:COST,duration:DURATION,reason:'Disponible'};
  }
  function begin(f,cell){
    const check=availability(f,cell);
    if(!check.ok)return check;
    f=Number(f);cell=Number(cell);
    if(f===0)gold3212-=COST;else botGold3230[f]-=COST;
    pending.push({cell,f,finish:seconds()+DURATION});revision++;
    if(f===0&&typeof saveGame3212==='function')saveGame3212();
    return {ok:true,cell,cost:COST,duration:DURATION};
  }
  function result(cell){
    cell=Number(cell);
    if(!known.has(cell))return null;
    const p=natural.profile(cell);
    return p?{farming:natural.category(p.food),
      livestock:natural.category(p.livestock),
      forest:natural.category(p.forest)}:null;
  }
  function tick(){
    let checks=0,changed=false;
    const time=seconds();
    while(pending.length&&checks<MAX_CHECKS){
      if(cursor>=pending.length)cursor=0;
      const job=pending[cursor];checks++;
      if(job.finish>time){cursor++;continue}
      known.add(job.cell);pending.splice(cursor,1);
      revision++;changed=true;
      core.emit('agronomyEvaluated',{cell:job.cell,faction:job.f,campaignSeconds:time});
    }
    if(changed)core.persist();
  }
  function snapshot(){
    return {v:SCHEMA,known:[...known],
      pending:pending.map(j=>[j.cell,j.f,j.finish])};
  }
  function restore(data){
    known.clear();pending.length=0;cursor=0;revision++;
    if(!data||typeof data!=='object')return;
    if(Array.isArray(data.known))for(const cell of data.known)
      if(isLand(cell))known.add(cell);
    if(Array.isArray(data.pending))for(const row of data.pending.slice(0,MAX_PENDING)){
      if(!Array.isArray(row)||row.length<3)continue;
      const [cell,f,finish]=row;
      if(!isLand(cell)||known.has(cell)||!Number.isInteger(f)||
        f<0||f>=activeFactionCount3230||!Number.isFinite(finish)||pendingAt(cell))continue;
      pending.push({cell,f,finish:Math.max(0,finish)});
    }
  }
  core.register({id:'agronomy-evaluation',schemaVersion:SCHEMA,snapshot,restore,tick});
  window.HexategosAgronomy03832=Object.freeze({
    version:VERSION,begin,status,availability,result,
    isKnown:cell=>known.has(Number(cell)),cost:COST,duration:DURATION,
    stats:()=>({known:known.size,pending:pending.length,revision})
  });
})();
