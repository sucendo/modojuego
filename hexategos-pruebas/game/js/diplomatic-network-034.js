'use strict';

// HEXATEGOS 0.34 · red diplomática activa para escalar la IA a más naciones.
// No sustituye el estado diplomático completo: solo limita qué parejas analiza
// la IA con frecuencia según contacto geopolítico real.
(() => {
  const N = DIP_F3300;
  const MAX_TARGETS = 16;
  const MIN_TARGETS = 5;
  const REBUILD_PERIOD = 12;

  const CONTACT_NONE = 0;
  const CONTACT_STRATEGIC = 1;
  const CONTACT_REGIONAL = 2;
  const CONTACT_DIRECT = 3;
  const CONTACT_ACTIVE = 4;

  const CONTACT_LABEL = ['SIN CONTACTO','ESTRATÉGICO','REGIONAL','DIRECTO','ACTIVO'];

  let contactLevel = new Uint8Array(N * N);
  let contactTargets = Array.from({length:N}, () => []);
  let enemyMask = Array.from({length:N}, () => new Uint8Array(N));
  let enemyList = Array.from({length:N}, () => []);
  let allyList = Array.from({length:N}, () => []);
  let reviewSerial = new Uint32Array(N);

  let dirty = true;
  let lastCampaign = -Infinity;
  let lastBuildMs = 0;
  let lastReviewedNation = -1;
  let lastReviewedPairs = 0;
  let totalReviewedPairs = 0;
  let buildCount = 0;

  const ix = (a,b) => a * N + b;
  const alive = (f,snap) => f >= 0 && f < N && (snap.territory?.[f] || 0) > 0;

  function setContact(a,b,level){
    if(a===b || a<0 || b<0 || a>=N || b>=N) return;
    const ab=ix(a,b), ba=ix(b,a);
    if(level>contactLevel[ab]) contactLevel[ab]=level;
    if(level>contactLevel[ba]) contactLevel[ba]=level;
  }

  function capitalAngleDeg(a,b){
    const ca=capitals?.[a] ?? -1, cb=capitals?.[b] ?? -1;
    if(ca<0 || cb<0 || ca>=owner6.length || cb>=owner6.length) return 180;
    const L=loadLevel(MAX_GAME_LEVEL3233), A=L.centers, ia=ca*3, ib=cb*3;
    const ax=A[ia]/32767, ay=A[ia+1]/32767, az=A[ia+2]/32767;
    const bx=A[ib]/32767, by=A[ib+1]/32767, bz=A[ib+2]/32767;
    const dot=Math.max(-1,Math.min(1,ax*bx+ay*by+az*bz));
    return Math.acos(dot)*180/Math.PI;
  }

  function hasPort(f,snap){
    return !!(snap.ports?.[f]?.length);
  }

  function rebuildRelationCaches(){
    for(let f=0;f<N;f++){
      enemyMask[f].fill(0);
      enemyList[f]=[];
      allyList[f]=[];
    }
    for(let a=0;a<N;a++){
      for(let b=0;b<N;b++){
        if(a===b) continue;
        const rel=diplomaticRelation3300(a,b);
        if(rel===-1){
          enemyMask[a][b]=1;
          enemyList[a].push(b);
        }else if(rel===3){
          allyList[a].push(b);
        }
      }
    }
  }

  function shareEnemyCached(a,b){
    const aa=enemyList[a] || [];
    const bm=enemyMask[b];
    for(let i=0;i<aa.length;i++){
      const x=aa[i];
      if(x!==a && x!==b && bm?.[x]) return true;
    }
    return false;
  }

  function rebuildDiplomaticContactNetwork3301(force=false){
    const t0=performance.now();
    const snap=aiSnapshot3260 || rebuildAISnapshot3260();
    if(!force && !dirty && snap.campaign-lastCampaign<REBUILD_PERIOD) return contactTargets;
    rebuildDiplomaticBorders3300(force);

    contactLevel.fill(0);
    rebuildRelationCaches();

    for(let f=0;f<N;f++) contactLevel[ix(f,f)]=CONTACT_ACTIVE;

    for(let a=0;a<N;a++){
      if(!alive(a,snap)) continue;
      for(let b=a+1;b<N;b++){
        if(!alive(b,snap)) continue;
        const rel=diplomaticRelation3300(a,b);
        if(rel!==0) setContact(a,b,CONTACT_ACTIVE);
      }
    }

    for(let a=0;a<N;a++){
      if(!alive(a,snap)) continue;
      for(let b=a+1;b<N;b++){
        if(!alive(b,snap)) continue;
        if(contactLevel[ix(a,b)]>=CONTACT_ACTIVE) continue;

        const border=dipBorder3300(a,b);
        if(border>0){
          setContact(a,b,CONTACT_DIRECT);
          continue;
        }

        const d=capitalAngleDeg(a,b);
        if(d<=18){
          setContact(a,b,CONTACT_DIRECT);
        }else if(d<=36){
          setContact(a,b,CONTACT_REGIONAL);
        }else if(d<=58 && hasPort(a,snap) && hasPort(b,snap)){
          setContact(a,b,CONTACT_STRATEGIC);
        }
      }
    }

    // Propagación de vecinos-de-vecinos sin bucle N³. Para cada nación
    // solo usamos sus contactos directos reales y un máximo de 12 vecinos por
    // intermediario. Mantiene la lógica regional con coste acotado.
    const direct=Array.from({length:N},()=>[]);
    for(let a=0;a<N;a++){
      if(!alive(a,snap))continue;
      for(let b=0;b<N;b++)if(b!==a&&contactLevel[ix(a,b)]>=CONTACT_DIRECT)direct[a].push(b);
    }
    for(let a=0;a<N;a++){
      if(!alive(a,snap))continue;
      const da=direct[a];
      for(let mi=0;mi<da.length;mi++){
        const m=da[mi],dm=direct[m]||[],lim=Math.min(12,dm.length);
        for(let bi=0;bi<lim;bi++){
          const b=dm[bi];
          if(b===a||b===m||!alive(b,snap))continue;
          if(contactLevel[ix(a,b)]<CONTACT_REGIONAL)setContact(a,b,CONTACT_REGIONAL);
        }
      }
    }

    for(let a=0;a<N;a++){
      if(!alive(a,snap)) continue;
      for(let b=a+1;b<N;b++){
        if(!alive(b,snap) || contactLevel[ix(a,b)]>CONTACT_NONE) continue;
        if(shareEnemyCached(a,b)) setContact(a,b,CONTACT_STRATEGIC);
      }
    }

    for(let a=0;a<N;a++){
      if(!alive(a,snap)) continue;
      let count=0;
      for(let b=0;b<N;b++) if(b!==a && contactLevel[ix(a,b)]>CONTACT_NONE && alive(b,snap)) count++;
      if(count>=MIN_TARGETS) continue;

      const nearest=[];
      for(let b=0;b<N;b++){
        if(b===a || !alive(b,snap) || contactLevel[ix(a,b)]>CONTACT_NONE) continue;
        const d=capitalAngleDeg(a,b);
        if(d<=85) nearest.push({b,d});
      }
      nearest.sort((x,y)=>x.d-y.d);
      for(const x of nearest){
        setContact(a,x.b,CONTACT_STRATEGIC);
        count++;
        if(count>=MIN_TARGETS) break;
      }
    }

    contactTargets=Array.from({length:N},()=>[]);
    for(let a=0;a<N;a++){
      if(!alive(a,snap)) continue;
      const mandatory=[], optional=[];
      for(let b=0;b<N;b++){
        if(b===a || !alive(b,snap)) continue;
        const level=contactLevel[ix(a,b)];
        if(level===CONTACT_NONE) continue;
        const item={b,level,d:capitalAngleDeg(a,b)};
        if(level===CONTACT_ACTIVE) mandatory.push(item);
        else optional.push(item);
      }
      optional.sort((x,y)=>y.level-x.level || x.d-y.d || x.b-y.b);
      const room=Math.max(0,MAX_TARGETS-mandatory.length);
      contactTargets[a]=mandatory.concat(optional.slice(0,room)).map(x=>x.b);
    }

    lastCampaign=snap.campaign;
    dirty=false;
    lastBuildMs=performance.now()-t0;
    buildCount++;
    return contactTargets;
  }

  function diplomaticTargets3301(f){
    rebuildDiplomaticContactNetwork3301(false);
    return contactTargets[f] || [];
  }

  function diplomaticContactLevel3301(a,b){
    rebuildDiplomaticContactNetwork3301(false);
    return (a>=0&&b>=0&&a<N&&b<N) ? contactLevel[ix(a,b)] : CONTACT_NONE;
  }

  function reviewTargets3301(f){
    const base=diplomaticTargets3301(f);
    const serial=++reviewSerial[f];
    const out=[];
    for(const o of base){
      const level=contactLevel[ix(f,o)];
      const rel=diplomaticRelation3300(f,o);
      if(rel!==0 || level>=CONTACT_DIRECT ||
         (level===CONTACT_REGIONAL && serial%2===0) ||
         (level===CONTACT_STRATEGIC && serial%4===0)){
        out.push(o);
      }
    }
    return out;
  }

  dipCommonEnemy3300=function(a,b){
    rebuildDiplomaticContactNetwork3301(false);
    return shareEnemyCached(a,b);
  };

  updateDiplomaticOpinion3300=function(f, explicitTargets=null){
    const targets=explicitTargets || diplomaticTargets3301(f);
    for(const o of targets){
      if(o===f) continue;
      const cur=dipOpinionOf3300(f,o),target=dipOpinionTarget3300(f,o);
      const level=contactLevel[ix(f,o)];
      const k=level>=CONTACT_DIRECT?.16:level===CONTACT_REGIONAL?.10:.055;
      dipSetOpinion3300(f,o,cur+(target-cur)*k);
      const rel=diplomaticRelation3300(f,o);
      if(rel>0&&campaignSeconds3230<(dipTreatyUntil3300[dipIdx3300(f,o)]||0)+120)
        dipSetTrust3300(f,o,dipTrustOf3300(f,o)+.18);
    }
  };

  aiReviewDiplomacy3300=function(f){
    const t0=performance.now();
    if(f<=0||f>=N)return;
    const snap=aiSnapshot3260 || rebuildAISnapshot3260();
    if((snap.territory[f]||0)<=0)return;

    rebuildDiplomaticContactNetwork3301(false);
    const targets=reviewTargets3301(f);
    updateDiplomaticOpinion3300(f,targets);

    let bestWar=null,bestTreaty=null;
    const role=FACTIONS3230[f]?.role||'balanced';
    const ownPower=dipPower3300(f),now=campaignSeconds3230;

    for(const o of targets){
      if(o===f||(snap.territory[o]||0)<=0)continue;
      const rel=diplomaticRelation3300(f,o),op=dipOpinionOf3300(f,o),trust=dipTrustOf3300(f,o);
      const border=dipBorder3300(f,o),ratio=ownPower/Math.max(1,dipPower3300(o));
      const common=dipCommonEnemy3300(f,o);
      const treatyUntil=dipTreatyUntil3300[dipIdx3300(f,o)]||0;
      const noWarUntil=dipNoWarUntil3300[dipIdx3300(f,o)]||0;

      if(rel===-1){
        const age=now-(dipWarStarted3300[dipIdx3300(f,o)]||now);
        const peaceScore=dipAcceptanceScore3300(f,o,'peace')+(age>45?10:0)+(ratio<.70?15:0);
        if(age>28&&peaceScore>dipThreshold3300('peace')+8){
          if(o===0)createPlayerOffer3300(f,'peace',dipWarWeariness3300[f]>45?'desgaste de la guerra':'replanteamiento estratégico');
          else if(dipAcceptanceScore3300(o,f,'peace')>dipThreshold3300('peace'))
            setDiplomaticRelation3300(f,o,0,'paz negociada',false);
        }
        continue;
      }

      if(rel===3){
        if(op<-32&&now>treatyUntil){
          setDiplomaticRelation3300(f,o,0,'deterioro de la alianza',false);
          dipSetTrust3300(o,f,dipTrustOf3300(o,f)-8);
        }else if(common){
          dipSetOpinion3300(f,o,op+1.5);
        }
        continue;
      }

      if(rel===2){
        if(op<-38&&now>treatyUntil)setDiplomaticRelation3300(f,o,0,'ruptura del pacto',false);
        else if(op>54&&trust>64&&common){
          const score=dipAcceptanceScore3300(o,f,'alliance');
          if(score>dipThreshold3300('alliance')){
            if(o===0)createPlayerOffer3300(f,'alliance','enemigo común y alta confianza');
            else setDiplomaticRelation3300(f,o,3,'alianza estratégica',false);
          }
        }
        continue;
      }

      if(rel===1){
        if(op<-30&&now>treatyUntil)setDiplomaticRelation3300(f,o,0,'fin del acuerdo comercial',false);
        else if(border&&op>22&&trust>50){
          const score=dipAcceptanceScore3300(o,f,'nap');
          if(score>dipThreshold3300('nap')){
            if(o===0)createPlayerOffer3300(f,'nap','estabilizar la frontera');
            else setDiplomaticRelation3300(f,o,2,'pacto fronterizo',false);
          }
        }
        continue;
      }

      if(rel===0){
        if(now>=noWarUntil && border){
          let warScore=-op*.55+(role==='aggressive'?24:role==='naval'?8:role==='defense'?-13:0);
          warScore+=(ratio>1.35?16:ratio>1.08?7:ratio<.80?-18:0);
          warScore+=trust<28?8:trust>62?-9:0;
          if((snap.capThreat[f]??99)<14)warScore-=18;
          if(troops3230[f]<(aiMilitary3280[f]?.reserveTarget||45)*1.2)warScore-=15;
          if(common)warScore-=20;
          if(!bestWar||warScore>bestWar.score)bestWar={o,score:warScore,ratio};
        }

        const tradeScore=dipAcceptanceScore3300(o,f,'trade')+(role==='growth'?8:0);
        const napScore=dipAcceptanceScore3300(o,f,'nap')+(border?7:0);
        if(op>8&&tradeScore>dipThreshold3300('trade')){
          const cand={o,type:'trade',score:tradeScore};
          if(!bestTreaty||cand.score>bestTreaty.score)bestTreaty=cand;
        }else if(border&&op>-8&&napScore>dipThreshold3300('nap')+4){
          const cand={o,type:'nap',score:napScore};
          if(!bestTreaty||cand.score>bestTreaty.score)bestTreaty=cand;
        }
      }
    }

    if(bestWar&&bestWar.score>48){
      aiDiplomaticAction3300(f,bestWar.o,'war',
        bestWar.ratio>1.35?'ventaja estratégica en la frontera':'escalada de tensiones fronterizas');
    }else if(bestTreaty&&bestTreaty.score>14){
      if(bestTreaty.o===0)createPlayerOffer3300(f,bestTreaty.type,bestTreaty.type==='trade'?'interés económico':'estabilidad fronteriza');
      else if(dipAcceptanceScore3300(bestTreaty.o,f,bestTreaty.type)>=dipThreshold3300(bestTreaty.type))
        setDiplomaticRelation3300(f,bestTreaty.o,dipTypeRelation3300(bestTreaty.type),
          bestTreaty.type==='trade'?'acuerdo comercial':'pacto de seguridad',false);
    }

    lastReviewedNation=f;
    lastReviewedPairs=targets.length;
    totalReviewedPairs+=targets.length;
    dipLastReviewMs3300=performance.now()-t0;
  };

  const baseSetRelation=setDiplomaticRelation3300;
  setDiplomaticRelation3300=function(){
    const out=baseSetRelation.apply(this,arguments);
    dirty=true;
    return out;
  };

  const baseInitDiplomacy=initDiplomacy3300;
  initDiplomacy3300=function(){
    const out=baseInitDiplomacy.apply(this,arguments);
    dirty=true;lastCampaign=-Infinity;
    return out;
  };

  const baseRestoreDiplomacy=restoreDiplomacy3300;
  restoreDiplomacy3300=function(){
    const out=baseRestoreDiplomacy.apply(this,arguments);
    dirty=true;lastCampaign=-Infinity;
    return out;
  };

  const baseAbsorbLegacy=absorbLegacyPlayerRelations3300;
  absorbLegacyPlayerRelations3300=function(){
    let changed=false;
    for(let i=1;i<Math.min(N,relations3220.length);i++){
      if((relations3220[i]||0)!==diplomaticRelation3300(0,i)){changed=true;break}
    }
    const out=baseAbsorbLegacy.apply(this,arguments);
    if(changed) dirty=true;
    return out;
  };

  const baseDiplomacyTick=diplomacyTick3300;
  diplomacyTick3300=function(){
    if(started3230&&!paused3230&&gameSpeed3212>0&&dipBooted3300)
      rebuildDiplomaticContactNetwork3301(false);
    return baseDiplomacyTick.apply(this,arguments);
  };

  const baseRenderDiplomacy=renderDiplomacy3300;
  renderDiplomacy3300=function(){
    rebuildDiplomaticContactNetwork3301(false);
    const out=baseRenderDiplomacy.apply(this,arguments);
    const host=document.getElementById('sysContent3213');
    if(host && !host.querySelector('.dipNetwork3301')){
      const st=stats3301();
      const block=document.createElement('div');
      block.className='sysBlock3213 dipNetwork3301';
      block.innerHTML='<b>🌐 Red diplomática activa</b>'+
        '<div class="sysMeta3213">'+st.activePairs+' contactos relevantes · media '+st.avgTargets+
        ' objetivos/nación · límite neutral '+MAX_TARGETS+'. La IA prioriza fronteras, región, distancia, puertos y relaciones existentes.</div>';
      host.insertBefore(block,host.children[1]||null);
    }
    return out;
  };

  function stats3301(){
    rebuildDiplomaticContactNetwork3301(false);
    let living=0,sum=0,activePairs=0;
    const snap=aiSnapshot3260;
    for(let a=0;a<N;a++){
      if((snap?.territory?.[a]||0)<=0)continue;
      living++;
      sum+=contactTargets[a]?.length||0;
      for(let b=a+1;b<N;b++) if(contactLevel[ix(a,b)]>CONTACT_NONE) activePairs++;
    }
    return {
      nations:N,
      living,
      possiblePairs:N*(N-1)/2,
      activePairs,
      avgTargets:living?(sum/living).toFixed(1):'0.0',
      maxTargets:MAX_TARGETS,
      lastBuildMs:Math.round(lastBuildMs*100)/100,
      buildCount,
      lastReviewedNation,
      lastReviewedPairs,
      totalReviewedPairs
    };
  }

  window.HexategosDiplomacyNetwork3301={
    rebuild:(force=true)=>rebuildDiplomaticContactNetwork3301(!!force),
    level:diplomaticContactLevel3301,
    label:(a,b)=>CONTACT_LABEL[diplomaticContactLevel3301(a,b)]||CONTACT_LABEL[0],
    targets:(f)=>diplomaticTargets3301(f).slice(),
    // Internal hot-path accessor. Callers must treat the returned array as read-only.
    targetsRef:(f)=>diplomaticTargets3301(f),
    stats:stats3301,
    markDirty:()=>{dirty=true;lastCampaign=-Infinity}
  };

  // Integra las métricas con el diagnóstico estable sin crear temporizadores.
  if(window.HexategosDiag033?.snapshot){
    const baseDiagSnapshot3301=window.HexategosDiag033.snapshot.bind(window.HexategosDiag033);
    window.HexategosDiag033.snapshot=function(){
      const out=baseDiagSnapshot3301();
      out.diplomacyNetwork=stats3301();
      return out;
    };
  }

  console.info('[HEXATEGOS] Red diplomática activa 0.36 optimizada para 500 naciones · HexategosDiplomacyNetwork3301.stats()');
})();