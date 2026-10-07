'use strict';

// HEXATEGOS 0.37.6 · CONEXIONES TERRESTRES FRONTERIZAS.
// Dos carreteras de países distintos NO se unen por simple contacto.
// La unión se construye explícitamente como enlace fronterizo / aduana.
(() => {
  const BUILD='0.37.6';
  const SAVE_KEY='hexategos-border-road-0376';
  const LINK_COST=12;

  const links=new Set();
  const linkModes=new Map(); // legal | transit | clandestine
  let playerLinks=0,aiLinks=0,transitLinks=0,clandestineLinks=0;

  const key0376=(a,b)=>a<b?a+'|'+b:b+'|'+a;
  const parseKey0376=k=>k.split('|').map(Number);

  function cooperative0376(a,b){
    const r=diplomaticRelation3300(a,b);
    return r===1||r===2||r===3;
  }

  function roadCell0376(cell){
    return Number.isInteger(cell)&&cell>=0&&
      (typeof aiRoadDegree3260==='function'?aiRoadDegree3260(cell)>0:false);
  }

  function hasLink0376(a,b){
    return links.has(key0376(Number(a),Number(b)));
  }

  function adjacentForeignRoads0376(cell){
    if(!Number.isInteger(cell)||cell<0||owner6[cell]!==0||!roadCell0376(cell))return [];
    const L=loadLevel(MAX_GAME_LEVEL3233),out=[];
    for(let k=L.offsets[cell];k<L.offsets[cell+1];k++){
      const n=L.edgeNbr[k],o=n>=0?owner6[n]:-1;
      if(n<0||o<=0||!roadCell0376(n)||hasLink0376(cell,n)||!cooperative0376(0,o))continue;
      out.push({cell:n,owner:o,relation:diplomaticRelation3300(0,o)});
    }
    out.sort((a,b)=>b.relation-a.relation||a.owner-b.owner||a.cell-b.cell);
    return out;
  }

  function physicalLinkExists0376(a,b){
    return roadEdgeSet3212.has(edgeKey3212(a,b));
  }

  function ensureVisualSegment0376(a,b){
    if(!physicalLinkExists0376(a,b)){
      roads3212.push([a,b]);
      rebuildRoadEdges3212();
    }
  }

  function afterLink0376(a,b){
    supplyDirty3220=true;
    cacheDirty=true;
    needsRender=true;
    if(typeof markEconomyDirty3261==='function')markEconomyDirty3261();
    if(typeof aiMarkDirty3260==='function')aiMarkDirty3260();
    window.HexategosTradeLogistics0370?.refresh?.();
    const oa=owner6[a],ob=owner6[b];
    if(oa>=0&&ob>=0&&oa!==ob&&cooperative0376(oa,ob)){
      window.HexategosTradeLogistics0370?.ensureLandRoute?.(Math.min(oa,ob),Math.max(oa,ob));
    }
  }

  function createLink0376(a,b,builder=-1,charge=true){
    a=Number(a);b=Number(b);
    if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a===b)return false;
    const oa=owner6[a],ob=owner6[b];
    if(oa<0||ob<0||oa===ob||!cooperative0376(oa,ob))return false;
    if(!roadCell0376(a)||!roadCell0376(b))return false;
    const L=loadLevel(MAX_GAME_LEVEL3233);
    let adjacent=false;
    for(let k=L.offsets[a];k<L.offsets[a+1];k++)if(L.edgeNbr[k]===b){adjacent=true;break}
    if(!adjacent)return false;
    if(hasLink0376(a,b))return true;

    if(charge){
      if(builder===0){
        if(gold3212<LINK_COST)return false;
        gold3212-=LINK_COST;
      }else if(builder>0){
        if(botGold3230[builder]<LINK_COST)return false;
        botGold3230[builder]-=LINK_COST;
      }
    }

    const k=key0376(a,b);
    links.add(k);linkModes.set(k,'legal');
    ensureVisualSegment0376(a,b);
    save0376();
    afterLink0376(a,b);
    return true;
  }

  function createPlayerLink0376(cell){
    const cands=adjacentForeignRoads0376(cell);
    if(!cands.length){toast('No hay una carretera extranjera compatible junto a este hexágono');return false}
    const c=cands[0];
    if(gold3212<LINK_COST){toast('Necesitas '+LINK_COST+' de oro para construir la conexión terrestre');return false}
    if(!createLink0376(cell,c.cell,0,true))return false;
    playerLinks++;
    toast('Conexión terrestre construida · aduana con '+factionName3230(c.owner)+' · '+LINK_COST+' oro');
    saveGame3212();
    if(typeof updateUI3230==='function')updateUI3230();
    return true;
  }

  function createAILink0376(a,b,f,o){
    if(f<=0||o<=0||f===o||owner6[a]!==f||owner6[b]!==o)return false;
    if(!cooperative0376(f,o))return false;
    if(hasLink0376(a,b))return true;
    if(botGold3230[f]<LINK_COST)return false;
    if(!createLink0376(a,b,f,true))return false;
    aiLinks++;
    return true;
  }
  function createSpecialAILink0376(a,b,builder,mode='transit'){
    a=Number(a);b=Number(b);builder=Number(builder);
    if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a===b||builder<=0)return false;
    const oa=owner6[a],ob=owner6[b];
    if(oa<0||ob<0||oa===ob||builder!==oa&&builder!==ob)return false;
    if(diplomaticRelation3300(oa,ob)===-1)return false;
    if(!roadCell0376(a)||!roadCell0376(b))return false;
    const L=loadLevel(MAX_GAME_LEVEL3233);
    let adjacent=false;
    for(let k=L.offsets[a];k<L.offsets[a+1];k++)if(L.edgeNbr[k]===b){adjacent=true;break}
    if(!adjacent)return false;
    const key=key0376(a,b);
    if(hasLink0376(a,b))return true;
    const cost=mode==='clandestine'?Math.max(LINK_COST,16):LINK_COST;
    if(botGold3230[builder]<cost)return false;
    botGold3230[builder]-=cost;
    links.add(key);linkModes.set(key,mode);
    ensureVisualSegment0376(a,b);
    save0376();afterLink0376(a,b);
    if(mode==='clandestine')clandestineLinks++;else transitLinks++;
    return true;
  }


  function removeInvalidLinks0376(){
    let changed=false;
    const L=loadLevel(MAX_GAME_LEVEL3233);
    for(const k of [...links]){
      const [a,b]=parseKey0376(k);
      if(a<0||b<0||a>=owner6.length||b>=owner6.length){links.delete(k);linkModes.delete(k);changed=true;continue}
      let adjacent=false;
      for(let i=L.offsets[a];i<L.offsets[a+1];i++)if(L.edgeNbr[i]===b){adjacent=true;break}
      if(!adjacent){links.delete(k);linkModes.delete(k);changed=true}
    }
    if(changed)save0376();
    return changed;
  }

  function serialize0376(){
    return {version:2,links:[...links].map(k=>{
      const [a,b]=parseKey0376(k);return [a,b,linkModes.get(k)||'legal'];
    })};
  }
  function restore0376(data){
    links.clear();linkModes.clear();
    if(data&&Array.isArray(data.links)){
      for(const row of data.links){
        const a=Number(row?.[0]),b=Number(row?.[1]),mode=typeof row?.[2]==='string'?row[2]:'legal';
        if(Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a!==b){
          const k=key0376(a,b);links.add(k);linkModes.set(k,mode);
        }
      }
    }
    removeInvalidLinks0376();
    // Los enlaces guardados deben seguir dibujándose como tramo físico.
    for(const k of links){
      const [a,b]=parseKey0376(k);
      ensureVisualSegment0376(a,b);
    }
    window.HexategosTradeLogistics0370?.refresh?.();
    return true;
  }
  function save0376(){
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(serialize0376()))}catch(_){}
  }
  function load0376(){
    try{return restore0376(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'))}catch(_){return restore0376(null)}
  }

  const baseSave0376=saveGame3212;
  saveGame3212=function(){
    const out=baseSave0376.apply(this,arguments);save0376();return out;
  };
  const baseLoad0376=loadGame3212;
  loadGame3212=function(){
    const out=baseLoad0376.apply(this,arguments);load0376();return out;
  };
  const baseReset0376=resetGame3230;
  resetGame3230=function(clearSave=true){
    const out=baseReset0376.apply(this,arguments);
    links.clear();linkModes.clear();
    if(clearSave)try{localStorage.removeItem(SAVE_KEY)}catch(_){}
    return out;
  };

  if(typeof buildPortableFile3275==='function'){
    const basePortableBuild0376=buildPortableFile3275;
    buildPortableFile3275=function(){
      const file=basePortableBuild0376.apply(this,arguments);
      file.gameVersion=BUILD;
      file.payload.borderRoad0376=serialize0376();
      if(typeof fnv1a3273==='function')file.checksum=fnv1a3273(JSON.stringify(file.payload));
      return file;
    };
  }
  if(typeof applyPortableFile3275==='function'){
    const basePortableApply0376=applyPortableFile3275;
    applyPortableFile3275=function(file){
      const data=file?.payload?.borderRoad0376||null;
      const out=basePortableApply0376.apply(this,arguments);
      restore0376(data);save0376();return out;
    };
  }

  const baseBuildClassicActions0376=buildClassicActions3246;
  buildClassicActions3246=function(ctx){
    const a=baseBuildClassicActions0376(ctx);
    if(ctx?.kind==='cell'&&ctx.own){
      const cands=adjacentForeignRoads0376(ctx.cell);
      if(cands.length){
        const c=cands[0];
        const item=classicAction3246(
          'border_road_0376','CONEXIÓN TERRESTRE','🛣',
          'ADUANA · '+LINK_COST+' ORO · '+factionName3230(c.owner),true,'good3244'
        );
        const at=a.findIndex(x=>x.id==='road_abandon_0374');
        a.splice(at>=0?at+1:a.length,0,item);
      }
    }
    return a;
  };

  const baseHandleContextAction0376=handleContextAction3244;
  handleContextAction3244=function(id){
    if(id==='border_road_0376'){
      const st=uiInteractionState3244,ctx=st?.contextData;
      if(!ctx||ctx.kind!=='cell'||!ctx.own||!adjacentForeignRoads0376(ctx.cell).length)return;
      const cell=ctx.cell;
      closeContextDialog3244();
      requestAnimationFrame(()=>createPlayerLink0376(cell));
      return;
    }
    return baseHandleContextAction0376(id);
  };

  window.HexategosBorderRoad0376={
    version:BUILD,
    hasLink:hasLink0376,
    createAI:createAILink0376,
    createTransitAI:(a,b,builder)=>createSpecialAILink0376(a,b,builder,'transit'),
    createClandestineAI:(a,b,builder)=>createSpecialAILink0376(a,b,builder,'clandestine'),
    mode:(a,b)=>linkModes.get(key0376(Number(a),Number(b)))||null,
    createPlayer:createPlayerLink0376,
    candidates:adjacentForeignRoads0376,
    stats:()=>({build:BUILD,links:links.size,playerLinks,aiLinks,transitLinks,clandestineLinks,cost:LINK_COST}),
    validate:()=>{
      const errors=[];
      for(const k of links){
        const [a,b]=parseKey0376(k);
        if(a<0||b<0||a>=owner6.length||b>=owner6.length)errors.push('enlace fronterizo inválido: '+k);
      }
      return {ok:errors.length===0,errors,stats:{links:links.size,playerLinks,aiLinks,transitLinks,clandestineLinks}};
    }
  };
  // La API debe existir antes de reconstruir la caché comercial inicial:
  // roadJoin0370 consulta hasLink() al recorrer una frontera internacional.
  load0376();
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.37.6 · conexión terrestre fronteriza explícita activa');
})();
