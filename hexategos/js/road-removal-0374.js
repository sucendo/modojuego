'use strict';

// HEXATEGOS 0.37.4 · RETIRADA MANUAL DE CARRETERAS.
// Permite cortar deliberadamente la red viaria desde el menú contextual.
// La operación es infrecuente y solo recorre las rutas existentes.
(() => {
  const BUILD='0.37.4';

  function roadTouchesCell0374(cell){
    if(!Number.isInteger(cell)||cell<0)return false;
    // O(grado del hexágono): usa el índice de aristas existente en vez de
    // recorrer todas las carreteras cada vez que se abre el menú contextual.
    if(typeof aiRoadDegree3260==='function')return aiRoadDegree3260(cell)>0;
    const L=loadLevel(MAX_GAME_LEVEL3233),s=L.offsets[cell],e=L.offsets[cell+1];
    for(let k=s;k<e;k++){
      const n=L.edgeNbr[k];
      if(n>=0&&roadEdgeSet3212.has(edgeKey3212(cell,n)))return true;
    }
    return false;
  }

  function abandonRoadAtCell0374(cell,ask=true){
    if(!Number.isInteger(cell)||cell<0||owner6[cell]!==0||!roadTouchesCell0374(cell))return false;

    if(ask&&typeof confirm==='function'){
      const ok=confirm('¿Abandonar la carretera en este hexágono? Se eliminarán todos los tramos que llegan a él y no recuperarás oro.');
      if(!ok)return false;
    }

    const next=[];
    let changed=false,removedEdges=0;

    for(const path of roads3212){
      if(!Array.isArray(path)||path.length<2||!path.includes(cell)){
        if(Array.isArray(path)&&path.length>=2)next.push(path);
        continue;
      }

      changed=true;
      const beforeEdges=path.length-1;
      let keptEdges=0,segment=[];

      const flush=()=>{
        if(segment.length>=2){
          next.push(segment);
          keptEdges+=segment.length-1;
        }
        segment=[];
      };

      for(const c of path){
        if(c===cell)flush();
        else segment.push(c);
      }
      flush();
      removedEdges+=Math.max(0,beforeEdges-keptEdges);
    }

    if(!changed)return false;

    roads3212=next;
    rebuildRoadEdges3212();
    supplyDirty3220=true;
    cacheDirty=true;
    needsRender=true;

    if(typeof markEconomyDirty3261==='function')markEconomyDirty3261();
    if(typeof aiMarkDirty3260==='function')aiMarkDirty3260();
    if(window.HexategosTradeLogistics0370?.refresh)window.HexategosTradeLogistics0370.refresh();
    if(window.HexategosInfrastructureDecay0373?.audit)window.HexategosInfrastructureDecay0373.audit();

    saveGame3212();
    if(typeof updateUI3230==='function')updateUI3230();

    toast('Carretera abandonada · '+removedEdges+' '+(removedEdges===1?'tramo retirado':'tramos retirados'));
    return true;
  }

  const baseBuildClassicActions0374=buildClassicActions3246;
  buildClassicActions3246=function(ctx){
    const a=baseBuildClassicActions0374(ctx);
    if(ctx?.kind==='cell'&&ctx.own&&roadTouchesCell0374(ctx.cell)){
      const item=classicAction3246(
        'road_abandon_0374','ABANDONAR CARRETERA','✕',
        'RETIRAR TRAMOS · SIN REEMBOLSO',true,'warn3244'
      );
      const at=a.findIndex(x=>x.id==='build_road');
      a.splice(at>=0?at+1:a.length,0,item);
    }
    return a;
  };

  const baseHandleContextAction0374=handleContextAction3244;
  handleContextAction3244=function(id){
    if(id==='road_abandon_0374'){
      const st=uiInteractionState3244,ctx=st?.contextData;
      if(!ctx||!st.contextDialog||ctx.kind!=='cell'||!ctx.own||
         !st.availableActions.includes(id)||!roadTouchesCell0374(ctx.cell))return;
      const cell=ctx.cell;
      closeContextDialog3244();
      requestAnimationFrame(()=>abandonRoadAtCell0374(cell,true));
      return;
    }
    return baseHandleContextAction0374(id);
  };

  function validate0374(){
    const errors=[];
    for(const path of roads3212){
      if(!Array.isArray(path)||path.length<2)errors.push('ruta viaria inválida');
    }
    return {ok:errors.length===0,errors,roadRoutes:roads3212.length};
  }

  window.HexategosRoadRemoval0374={
    version:BUILD,
    hasRoad:roadTouchesCell0374,
    abandon:(cell)=>abandonRoadAtCell0374(Number(cell),false),
    validate:validate0374
  };
  window.HEXATEGOS_VERSION=BUILD;
  console.info('[HEXATEGOS] 0.37.4 · retirada contextual de carreteras activa');
})();
