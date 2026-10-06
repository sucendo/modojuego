'use strict';

// HEXATEGOS 0.35.2 · mapa geopolítico para jugador + diagnóstico oculto.
// No añade timers ni observers. Reutiliza el render y la IA geopolítica 0.35.
(() => {
  const BUILD='0.35.2';
  const MODE='geopolitics';
  const MODE_LABEL='Geopolítica';
  const REL_COLORS={
    own:[212,173,82],
    rival:[166,82,185],
    balance:[207,113,65],
    buffer:[212,164,66],
    war:[190,68,70],
    alliance:[65,160,101],
    nap:[67,126,178],
    trade:[65,156,170],
    neutral:[92,104,116]
  };
  const LEGEND=
    '<span class="tl3250"><i style="background:#d4ad52"></i>Nación observada</span>'+
    '<span class="tl3250"><i style="background:#a652b9"></i>Rival</span>'+
    '<span class="tl3250"><i style="background:#be4446"></i>En guerra</span>'+
    '<span class="tl3250"><i style="background:#41a065"></i>Aliado</span>'+
    '<span class="tl3250"><i style="background:#4380b2"></i>No agresión</span>'+
    '<span class="tl3250"><i style="background:#419caa"></i>Comercio</span>'+
    '<span class="tl3250"><i style="background:#d4a442"></i>Estado tapón</span>';

  let paletteFocus=-1;
  let paletteBucket=-1;
  let relationPalette=[];
  let developerDebug=false;
  let lastOverlayMs=0;
  let overlayFrames=0;

  if(!MAP_MODES3252.includes(MODE))MAP_MODES3252.push(MODE);
  MAP_MODE_NAMES3252[MODE]=MODE_LABEL;

  function activeFocus0352(){
    if(typeof selectedOwner==='function'){
      const o=selectedOwner();
      if(o>=0&&o<activeFactionCount3230)return o;
    }
    if(playerCountry>=0&&playerCountry<activeFactionCount3230)return playerCountry;
    return 0;
  }

  function relationClass0352(focus,other,st){
    if(other===focus)return 'own';
    if(st?.rival===other)return 'rival';
    if(st?.buffer===other)return 'buffer';
    if(st?.balanceTarget===other)return 'balance';
    const rel=diplomaticRelation3300(focus,other);
    if(rel===-1)return 'war';
    if(rel===3)return 'alliance';
    if(rel===2)return 'nap';
    if(rel===1)return 'trade';
    return 'neutral';
  }

  function rebuildPalette0352(force=false){
    if(!started3230)return;
    const focus=activeFocus0352();
    const bucket=Math.floor((Number(campaignSeconds3230)||0)/6);
    if(!force&&paletteFocus===focus&&paletteBucket===bucket)return;
    const st=window.HexategosGeopolitics035?.evaluate?.(focus,false)||null;
    relationPalette=Array.from({length:activeFactionCount3230},(_,f)=>relationClass0352(focus,f,st));
    paletteFocus=focus;
    paletteBucket=bucket;
  }

  function baseTerrainRGB0352(key,i,L){
    const type=terrainType3247(key,i,L);
    return TERRAIN_PALETTE3247[type]||TERRAIN_PALETTE3247.plain;
  }

  const baseTerrainFill0352=terrainStrategicFill3247;
  terrainStrategicFill3247=function(key,i,L,own,z){
    if(mapMode3252!==MODE)return baseTerrainFill0352.apply(this,arguments);
    if(L.land[i]<0)return shadeColor('#17384f',z);
    const base=baseTerrainRGB0352(key,i,L);
    if(own<0||own>=activeFactionCount3230)return shadedRGB3247(mixRGB3247(base,REL_COLORS.neutral,.22),z);
    if(paletteFocus<0)rebuildPalette0352(false);
    const cls=relationPalette[own]||'neutral';
    const tint=cls==='own'?.70:cls==='neutral'?.38:.61;
    return shadedRGB3247(mixRGB3247(base,REL_COLORS[cls]||REL_COLORS.neutral,tint),z);
  };

  function ensurePanel0352(){
    let p=document.getElementById('geoMapPanel0352');
    if(p)return p;
    p=document.createElement('aside');
    p.id='geoMapPanel0352';
    p.className='geoMapPanel0352';
    p.setAttribute('aria-live','polite');
    document.body.appendChild(p);
    return p;
  }

  function relationLabel0352(a,b){
    const rel=diplomaticRelation3300(a,b);
    return DIP_RELATION_LABEL3300?.[rel]||
      (rel===-1?'Guerra':rel===3?'Alianza':rel===2?'No agresión':rel===1?'Comercio':'Neutral');
  }

  function updatePanel0352(){
    const panel=ensurePanel0352();
    const visible=started3230&&mapMode3252===MODE;
    panel.classList.toggle('open0352',visible);
    if(!visible)return;

    rebuildPalette0352(true);
    const focus=activeFocus0352();
    const st=window.HexategosGeopolitics035?.evaluate?.(focus,false);
    if(!st){
      panel.innerHTML='<b>MAPA GEOPOLÍTICO</b><small>Selecciona una nación para analizarla.</small>';
      return;
    }

    const objectives=(st.objectives||[]).slice(0,3);
    const rival=st.rival>=0?factionName3230(st.rival):'Ninguno';
    const buffer=st.buffer>=0?factionName3230(st.buffer):'—';
    const relationToPlayer=(focus!==playerCountry&&playerCountry>=0)
      ?'<div class="geoRelation0352"><span>Relación contigo</span><b>'+relationLabel0352(focus,playerCountry)+'</b><small>'+
        (window.HexategosGeopolitics035?.relation?.(focus,playerCountry)||'')+'</small></div>'
      :'';

    let debug='';
    if(developerDebug){
      const ex=window.HexategosGeopolitics035?.explain?.(focus,playerCountry>=0?playerCountry:null);
      const power=typeof dipPower3300==='function'?dipPower3300(focus):0;
      const contacts=window.HexategosDiplomacyNetwork3301?.targets?.(focus)||[];
      debug='<details class="geoDebug0352" open><summary>Diagnóstico desarrollo</summary>'+
        '<div>facción '+focus+' · potencia '+Number(power).toFixed(1)+' · contactos '+contacts.length+'</div>'+
        '<div>ambición '+Math.round((st.ambition||0)*100)+'% · influencia '+Math.round(st.influenceRadius||0)+'°</div>'+
        (ex?.relation?'<div>amenaza vs jugador '+ex.relation.threat+'/100 · agravio '+ex.relation.grievance+'</div>':'')+
        '<div>rival '+st.rival+' · buffer '+st.buffer+' · balance '+st.balanceTarget+'</div>'+
        '<div>overlay '+lastOverlayMs.toFixed(2)+' ms · frames '+overlayFrames+'</div>'+
      '</details>';
    }

    panel.innerHTML=
      '<div class="geoPanelHead0352"><span>MAPA GEOPOLÍTICO</span><b>'+factionName3230(focus)+'</b></div>'+
      '<div class="geoMetaGrid0352">'+
        '<div><span>Doctrina</span><b>'+st.doctrineLabel+'</b></div>'+
        '<div><span>Esfera</span><b>'+(st.homeRegionLabel||'Regional')+'</b></div>'+
        '<div><span>Rival</span><b>'+rival+'</b></div>'+
        '<div><span>Estado tapón</span><b>'+buffer+'</b></div>'+
      '</div>'+
      '<div class="geoInfluence0352"><span>Radio de influencia</span><b>'+Math.round(st.influenceRadius||0)+'°</b></div>'+
      '<div class="geoObjectives0352"><span>Prioridades</span>'+
        (objectives.length?objectives.map((o,i)=>'<div><i>'+(i+1)+'</i>'+o.label+'</div>').join(''):'<div>Consolidación interna</div>')+
      '</div>'+relationToPlayer+
      '<small class="geoHint0352">Selecciona territorio de otro país para cambiar la nación observada.</small>'+
      debug;
  }

  const baseUpdateMapUI0352=updateMapModeUI3252;
  updateMapModeUI3252=function(showToast=false){
    if(mapMode3252!==MODE){
      baseUpdateMapUI0352.apply(this,arguments);
      ensurePanel0352().classList.remove('open0352');
      return;
    }
    const b=document.getElementById('mapModeBtn3252');
    const leg=document.getElementById('terrainLegend3250');
    if(b){
      b.textContent='G';
      b.classList.remove('modeTerrain3252','modeSupply3252');
      b.classList.add('modeGeopolitics0352');
      b.setAttribute('aria-label','Modo de mapa: '+MODE_LABEL);
      b.title='Mapa '+MODE_LABEL+' · selecciona una nación para analizarla';
    }
    if(leg){
      leg.classList.remove('supplyLegend3252');
      leg.classList.add('geopoliticsLegend0352');
      leg.innerHTML=LEGEND;
      leg.style.display='';
    }
    showSupplyOverlay3230=false;
    updatePanel0352();
    if(showToast)toast('Mapa geopolítico · selecciona una nación para ver su esfera e intereses');
    needsRender=true;
  };

  const basePanel0352=updatePanel;
  updatePanel=function(){
    const out=basePanel0352.apply(this,arguments);
    if(mapMode3252===MODE){
      paletteFocus=-1;
      updatePanel0352();
      needsRender=true;
    }
    return out;
  };

  function cellVec0352(cell){
    const L=loadLevel(MAX_GAME_LEVEL3233),i=cell*3;
    return [L.centers[i]/32767,L.centers[i+1]/32767,L.centers[i+2]/32767];
  }

  function normalize0352(v){
    const n=Math.hypot(v[0],v[1],v[2])||1;
    return [v[0]/n,v[1]/n,v[2]/n];
  }

  function cross0352(a,b){
    return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  }

  function drawInfluenceRing0352(f,R,cx,cy,radiusDeg){
    const cap=capitals?.[f]??-1;
    if(cap<0)return;
    const c=cellVec0352(cap);
    const ref=Math.abs(c[1])<.85?[0,1,0]:[1,0,0];
    const u=normalize0352(cross0352(ref,c));
    const v=normalize0352(cross0352(c,u));
    const r=clamp0352(radiusDeg||22,8,78)*Math.PI/180;
    const cr=Math.cos(r),sr=Math.sin(r);
    ctx.save();
    ctx.setLineDash([5,5]);
    ctx.lineWidth=1.35;
    ctx.strokeStyle='rgba(232,195,105,.64)';
    ctx.beginPath();
    let open=false;
    for(let k=0;k<=72;k++){
      const t=k/72*Math.PI*2;
      const q=[
        c[0]*cr+(u[0]*Math.cos(t)+v[0]*Math.sin(t))*sr,
        c[1]*cr+(u[1]*Math.cos(t)+v[1]*Math.sin(t))*sr,
        c[2]*cr+(u[2]*Math.cos(t)+v[2]*Math.sin(t))*sr
      ];
      const p=projectVec(q[0],q[1],q[2],R,cx,cy);
      if(p[2]<=.02){open=false;continue}
      if(!open){ctx.moveTo(p[0],p[1]);open=true}else ctx.lineTo(p[0],p[1]);
    }
    ctx.stroke();
    ctx.restore();
  }

  function clamp0352(v,a,b){return Math.max(a,Math.min(b,v))}

  function drawArc0352(aFaction,bFaction,R,cx,cy,style,label){
    const a=capitals?.[aFaction]??-1,b=capitals?.[bFaction]??-1;
    if(a<0||b<0)return;
    const av=cellVec0352(a),bv=cellVec0352(b);
    ctx.save();
    ctx.strokeStyle=style.color;
    ctx.lineWidth=style.width||1.5;
    ctx.setLineDash(style.dash||[]);
    ctx.beginPath();
    let open=false,mid=null;
    for(let k=0;k<=28;k++){
      const t=k/28,v=slerp3212(av,bv,t),p=projectVec(v[0],v[1],v[2],R,cx,cy);
      if(k===14)mid=p;
      if(p[2]<=.02){open=false;continue}
      if(!open){ctx.moveTo(p[0],p[1]);open=true}else ctx.lineTo(p[0],p[1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    if(label&&mid&&mid[2]>.10){
      ctx.font='800 7px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.lineWidth=2.6;ctx.strokeStyle='rgba(2,8,13,.88)';ctx.strokeText(label,mid[0],mid[1]-5);
      ctx.fillStyle=style.text||style.color;ctx.fillText(label,mid[0],mid[1]-5);
    }
    ctx.restore();
  }

  function drawGeoOverlay0352(R,cx,cy){
    if(mapMode3252!==MODE||!started3230)return;
    const t0=performance.now();
    rebuildPalette0352(false);
    const focus=activeFocus0352();
    const st=window.HexategosGeopolitics035?.evaluate?.(focus,false);
    if(!st)return;

    drawInfluenceRing0352(focus,R,cx,cy,st.influenceRadius);

    if(st.rival>=0)drawArc0352(focus,st.rival,R,cx,cy,
      {color:'rgba(198,86,205,.88)',width:2.0,dash:[],text:'#eba5f1'},'RIVAL');
    if(st.balanceTarget>=0&&st.balanceTarget!==st.rival)drawArc0352(focus,st.balanceTarget,R,cx,cy,
      {color:'rgba(224,126,76,.78)',width:1.6,dash:[7,4],text:'#f1b087'},'CONTENCIÓN');
    if(st.buffer>=0)drawArc0352(focus,st.buffer,R,cx,cy,
      {color:'rgba(226,181,76,.78)',width:1.45,dash:[3,4],text:'#efd282'},'TAPÓN');

    const allies=[];
    for(let f=0;f<activeFactionCount3230;f++){
      if(f===focus||diplomaticRelation3300(focus,f)!==3)continue;
      allies.push(f);
    }
    for(const f of allies.slice(0,4))drawArc0352(focus,f,R,cx,cy,
      {color:'rgba(80,190,119,.52)',width:1.1,dash:[2,5]},'');

    if(developerDebug){
      const targets=window.HexategosDiplomacyNetwork3301?.targets?.(focus)||[];
      for(const f of targets.slice(0,12)){
        if(f===st.rival||f===st.buffer||f===st.balanceTarget||allies.includes(f))continue;
        drawArc0352(focus,f,R,cx,cy,{color:'rgba(147,170,187,.22)',width:.7,dash:[1,6]},'');
      }
    }

    lastOverlayMs=performance.now()-t0;
    overlayFrames++;
  }

  const baseInfra0352=drawInfrastructure3212;
  drawInfrastructure3212=function(R,cx,cy,now){
    const out=baseInfra0352.apply(this,arguments);
    drawGeoOverlay0352(R,cx,cy);
    return out;
  };

  const baseSetRelation0352=setDiplomaticRelation3300;
  setDiplomaticRelation3300=function(){
    const out=baseSetRelation0352.apply(this,arguments);
    paletteFocus=-1;paletteBucket=-1;
    if(mapMode3252===MODE)updatePanel0352();
    return out;
  };

  function debugSnapshot0352(f=activeFocus0352()){
    const st=window.HexategosGeopolitics035?.evaluate?.(f,true)||null;
    return {
      build:BUILD,
      mapMode:mapMode3252,
      focus:f,
      faction:factionName3230(f),
      geopolitical:window.HexategosGeopolitics035?.explain?.(f,playerCountry>=0?playerCountry:null)||null,
      contacts:window.HexategosDiplomacyNetwork3301?.targets?.(f)||[],
      diplomacy:window.HexategosDiplomacyNetwork3301?.stats?.()||null,
      stability:window.HexategosStability0342?.stats?.()||null,
      overlay:{lastMs:Number(lastOverlayMs.toFixed(3)),frames:overlayFrames},
      doctrine:st?.doctrine||null
    };
  }

  function validate0352(){
    const errors=[],warnings=[];
    if(!MAP_MODES3252.includes(MODE))errors.push('Modo geopolitics no registrado');
    if(MAP_MODE_NAMES3252[MODE]!==MODE_LABEL)errors.push('Etiqueta de modo incorrecta');
    if(typeof baseTerrainFill0352!=='function')errors.push('Hook de color no disponible');
    if(typeof baseInfra0352!=='function')errors.push('Hook de overlay no disponible');
    if(!window.HexategosGeopolitics035)errors.push('IA geopolítica 0.35 no disponible');
    if(lastOverlayMs>12)warnings.push('Overlay geopolítico alto: '+lastOverlayMs.toFixed(1)+' ms');
    return {ok:errors.length===0,errors,warnings,snapshot:debugSnapshot0352()};
  }

  // El modo guardado "geopolitics" no era conocido cuando game.js leyó localStorage.
  try{
    if(localStorage.getItem('ofhex_map_mode_3252')===MODE)mapMode3252=MODE;
  }catch(_){}

  // No hay botón de desarrollo: se activa solo desde consola/diagnóstico.
  window.HexategosGeoMap0352={
    validate:validate0352,
    snapshot:debugSnapshot0352,
    focus:()=>activeFocus0352(),
    refresh:()=>{paletteFocus=-1;updatePanel0352();needsRender=true},
    debug:(enabled=true)=>{
      developerDebug=!!enabled;
      updatePanel0352();
      needsRender=true;
      return developerDebug;
    },
    get debugEnabled(){return developerDebug}
  };

  updateMapModeUI3252(false);
  console.info('[HEXATEGOS] 0.35.2 mapa geopolítico preparado · diagnóstico oculto: HexategosGeoMap0352.debug(true)');
})();