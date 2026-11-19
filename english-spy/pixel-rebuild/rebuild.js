/* English Spy — rebuilt scenery prototype. Clean, independent scene geometry. */
(() => {
  'use strict';
  const W=1200,H=675,STORAGE='english-spy-rebuild-alpha-01';
  const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
  const $=id=>document.getElementById(id);
  const sprites={},backdrops={},evidenceSprites={};
  const asset=(file)=>`./assets/${file}.webp`;
  for(const [id,file] of Object.entries({terrace:'terrace',bistro:'bistro'})){
    backdrops[id]=new Image();backdrops[id].src=asset(file);
  }
  for(const id of ['agent-m','agent-f','carmen','gabriel','stranger','stranger-seated']){
    sprites[id]=new Image();sprites[id].src=asset('characters/'+id);
  }
  for(const id of ['receipt','note','key']){evidenceSprites[id]=new Image();evidenceSprites[id].src='./assets/'+id+'.svg';}

  // Every scene has one authoritative floor mesh, measured at the ACTOR'S FEET.
  // Furniture is placed OUTSIDE these polygons. This is not a painting with
  // selectable rectangles or an image pretending to contain collision data.
  const world={
    terrace:{
      title:'PLAZA DE ORIENTE · CAFÉ DE ORIENTE · 18:47',
      scale:{farY:370,nearY:675,far:.61,near:1.46},
      spawn:{x:295,y:600},door:{x:1056,y:531},
      floors:[[[130,535],[318,464],[496,427],[700,413],[806,442],[957,483],[1100,504],[1161,675],[120,675]],
        [[940,468],[1090,458],[1150,600],[1025,656]]],
      blocks:[[[0,411],[115,427],[145,510],[145,675],[0,675]],
        [[726,378],[802,375],[821,460],[732,465]],
        [[991,371],[1070,362],[1101,477],[1015,479]]],
      targets:[
        {id:'palace',name:'Royal Palace',es:'Palacio Real',x:390,y:255,rx:285,ry:142,walk:[420,545],verb:'look'},
        {id:'table',name:'Outdoor table',es:'Mesa de la terraza',x:761,y:391,rx:64,ry:60,walk:[690,502],verb:'look'},
        {id:'receipt',name:'Folded receipt',es:'Recibo doblado',x:769,y:410,rx:36,ry:25,walk:[689,501],verb:'take',item:'receipt'},
        {id:'garden',name:'Ornamental garden',es:'Jardín',x:150,y:430,rx:84,ry:85,walk:[269,548],verb:'look'},
        {id:'door',name:'Café de Oriente entrance',es:'Entrar al café',x:1074,y:429,rx:89,ry:132,walk:[1056,531],verb:'enter'}
      ]
    },
    bistro:{
      title:'CAFÉ DE ORIENTE · BISTRÓ · 18:52',
      scale:{farY:367,nearY:675,far:.69,near:1.42},
      spawn:{x:1105,y:573},door:{x:1113,y:545},
      floors:[[[381,431],[737,425],[818,464],[925,493],[1127,503],[1190,675],[330,675]],
        [[963,463],[1178,455],[1192,645],[958,646]],
        [[337,450],[499,448],[520,650],[336,652]]],
      blocks:[[[0,352],[328,343],[349,675],[0,675]],
        [[800,367],[985,366],[990,466],[828,474]],
        [[610,367],[769,361],[794,439],[606,444]]],
      targets:[
        {id:'carmen',name:'Speak with Carmen',es:'Hablar con Carmen',x:169,y:353,rx:64,ry:85,walk:[429,537],verb:'talk'},
        {id:'stranger',name:'Guest by the window',es:'Testigo de la ventana',x:950,y:415,rx:62,ry:95,walk:[821,520],verb:'talk'},
        {id:'gabriel',name:'Waiter Gabriel',es:'Camarero Gabriel',x:600,y:470,rx:45,ry:85,walk:[720,570],verb:'talk',dynamic:true},
        {id:'table',name:'Table by the window',es:'Mesa de la ventana',x:882,y:407,rx:85,ry:60,walk:[815,523],verb:'look'},
        {id:'note',name:'Folded message',es:'Mensaje doblado',x:514,y:569,rx:38,ry:30,walk:[570,562],verb:'take',item:'note'},
        {id:'key',name:'Brass key',es:'Llave de latón',x:854,y:486,rx:29,ry:26,walk:[814,544],verb:'take',item:'key'},
        {id:'painting',name:'Framed painting',es:'Cuadro enmarcado',x:616,y:251,rx:88,ry:113,walk:[591,517],verb:'look'},
        {id:'door',name:'Return to the plaza',es:'Volver a la plaza',x:1115,y:407,rx:85,ry:140,walk:[1111,545],verb:'exit'}
      ]
    }
  };
  const initial=()=>({scene:'terrace',language:'starter',help:true,sound:false,inventory:[],flags:{},avatar:'agent-m'});
  function restore(){try{const s=JSON.parse(localStorage.getItem(STORAGE));return s&&world[s.scene]&&Array.isArray(s.inventory)?{...initial(),...s,flags:{...s.flags}}:initial();}catch{return initial();}}
  let save=restore();
  const persist=()=>localStorage.setItem(STORAGE,JSON.stringify(save));
  const agent={x:world[save.scene].spawn.x,y:world[save.scene].spawn.y,facing:-1,stride:0,moving:false};
  let nodes=[],onArrival=null,verb='smart',dialogue=null,hovered=null,announcement=null,announcementUntil=0;
  let guestMode='seated',guestChangeAt=0,guestX=957,guestY=469,approachingGuest=false;
  const guestSeat={x:957,y:469},guestStand={x:896,y:496};
  const waiter={x:676,y:561,stride:0,facing:1,goal:0,held:0};
  const waiterStops=[{x:676,y:561},{x:579,y:548},{x:722,y:565}];
  const lerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const scale=(scene,y)=>{const p=world[scene].scale;return lerp(p.far,p.near,(y-p.farY)/(p.nearY-p.farY));};
  const sqr=x=>x*x;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function inside(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];if(((a[1]>y)!==(b[1]>y))&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
  }return yes;}
  function floor(scene,x,y){const w=world[scene];return w.floors.some(p=>inside(x,y,p))&&!w.blocks.some(p=>inside(x,y,p));}
  // Elliptical contact patch; shoulder width is not a floor footprint.
  function walkable(scene,x,y){const factor=scale(scene,y),rx=clamp(12*factor,8,21),ry=clamp(7*factor,5,12);
    return [[0,0],[rx,0],[-rx,0],[0,ry],[0,-ry],[rx*.6,ry*.6],[-rx*.6,ry*.6],[rx*.6,-ry*.6],[-rx*.6,-ry*.6]]
      .every(([dx,dy])=>floor(scene,x+dx,y+dy));}
  function actorCollision(x,y){if(save.scene==='bistro'){
    if((sqr((x-guestX)/35)+sqr((y-guestY)/22))<1)return true;
    if((sqr((x-waiter.x)/33)+sqr((y-waiter.y)/19))<1)return true;
  }return false;}
  function canStand(scene,x,y,avoid=true){return walkable(scene,x,y)&&(!avoid||scene!==save.scene||!actorCollision(x,y));}
  const CELL=15,COLS=W/CELL,ROWS=H/CELL;
  const cell=(id)=>({x:(id%COLS)*CELL+CELL/2,y:Math.floor(id/COLS)*CELL+CELL/2});
  function nearest(scene,target,avoid=true){if(canStand(scene,target.x,target.y,avoid))return {x:target.x,y:target.y};
    let best=null,d=Infinity;for(let i=0;i<COLS*ROWS;i++){const p=cell(i);if(!canStand(scene,p.x,p.y,avoid))continue;const n=sqr(p.x-target.x)+sqr(p.y-target.y);if(n<d){d=n;best=p;}}return best;}
  function clearLine(scene,a,b,avoid=true){for(let i=0,n=Math.ceil(dist(a,b)/7);i<=n;i++){
    const p=i/n||0;if(!canStand(scene,lerp(a.x,b.x,p),lerp(a.y,b.y,p),avoid))return false;
  }return true;}
  function route(scene,from,to,avoid=true){const start=nearest(scene,from,avoid),goal=nearest(scene,to,avoid);if(!start||!goal)return [];
    if(clearLine(scene,start,goal,avoid))return [goal];
    const valid=new Uint8Array(COLS*ROWS),prev=new Int32Array(COLS*ROWS),cost=new Float64Array(COLS*ROWS);prev.fill(-1);cost.fill(Infinity);
    for(let i=0;i<valid.length;i++){const p=cell(i);valid[i]=canStand(scene,p.x,p.y,avoid)?1:0;}
    const closest=p=>{let index=-1,d=Infinity;for(let i=0;i<valid.length;i++)if(valid[i]){const q=cell(i),r=sqr(p.x-q.x)+sqr(p.y-q.y);if(r<d){d=r;index=i;}}return index;};
    const begin=closest(start),end=closest(goal);if(begin<0||end<0)return [];
    const open=[begin],closed=new Uint8Array(valid.length);cost[begin]=0;
    while(open.length){let k=0,value=Infinity;for(let j=0;j<open.length;j++){const p=cell(open[j]),score=cost[open[j]]+dist(p,goal);if(score<value){value=score;k=j;}}
      const cur=open.splice(k,1)[0];if(cur===end)break;if(closed[cur])continue;closed[cur]=1;
      const x=cur%COLS,y=Math.floor(cur/COLS);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=COLS||ny>=ROWS)continue;
        const next=ny*COLS+nx;if(!valid[next]||closed[next])continue;
        if(dx&&dy&&(!valid[y*COLS+nx]||!valid[ny*COLS+x]))continue;
        const alternative=cost[cur]+Math.hypot(dx,dy)*CELL;if(alternative<cost[next]){
          cost[next]=alternative;prev[next]=cur;if(!open.includes(next))open.push(next);
        }
      }
    }
    if(!Number.isFinite(cost[end]))return [];
    const trace=[];for(let n=end;n>=0;n=prev[n])trace.push(cell(n));trace.reverse();
    const chain=[start,...trace,goal],smooth=[];for(let i=0;i<chain.length-1;){let next=i+1;
      for(let j=chain.length-1;j>i+1;j--){if(clearLine(scene,chain[i],chain[j],avoid)){next=j;break;}}
      smooth.push(chain[next]);i=next;
    }return smooth;
  }
  function moveTo(point,callback=null){
    const destination=Array.isArray(point)?{x:point[0],y:point[1]}:point;
    const path=route(save.scene,agent,destination);if(!path.length){tell('No puedo llegar hasta allí.','Busca un camino libre.');return false;}
    nodes=path;onArrival=callback;return true;
  }
  function transition(scene){save.scene=scene;guestMode='seated';guestX=guestSeat.x;guestY=guestSeat.y;guestChangeAt=0;approachingGuest=false;
    const spawn=scene==='bistro'?{x:1090,y:572}:{x:1055,y:542};Object.assign(agent,spawn,{moving:false,stride:0});nodes=[];onArrival=null;
    dialogue=null;$('dialogue').hidden=true;$('hover-label').hidden=true;hovered=null;$('scene-name').textContent=world[scene].title;
    persist();refresh();
    if(scene==='bistro')moveTo({x:1007,y:590});else moveTo({x:943,y:593});
  }
  const includes=id=>save.inventory.includes(id);
  const languageWords={
    palace:['That is the Royal Palace of Madrid.','Evelyn chose a busy public place for the meeting.'],
    garden:['The garden is full of flowers.','No signs of Evelyn behind the railing.'],
    table:['A round table, two chairs and a view of the palace.','Someone left this table in a hurry.'],
    painting:['An ornate framed mirror reflects the bistro.','You see the room from another angle.']
  };
  const itemTitles={receipt:'Receipt',note:'Folded note',key:'Brass key'};
  function tell(text,es=''){announcement=save.help&&es?text+' · '+es:text;announcementUntil=performance.now()+3800;
    $('toast').textContent=announcement;$('toast').hidden=false;}
  function speech(text){if(!save.sound||!('speechSynthesis' in window))return;try{
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=save.language==='starter'?.78:.92;speechSynthesis.speak(u);
  }catch{}}
  function take(id){if(includes(id))return;
    if(id==='key'&&!save.flags.keyRevealed){tell('Nothing obvious is under the chair.','Primero consigue una pista del testigo.');return;}
    save.inventory.push(id);persist();refresh();
    const messages={receipt:['A receipt: 18:36. Someone paid before Evelyn arrived.','Un recibo de las 18:36.'],note:['A folded message: “Lealtad. 19:10.”','Una nota doblada con una dirección.'],key:['A brass key engraved with a small number.','Una llave marcada con un número.']};
    tell(...messages[id]);speech(messages[id][0]);
  }
  const dialogs={
    carmen:{name:'CARMEN · ENCARGADA',
      initial:['Good evening. Welcome to Café de Oriente.','Buenas tardes. Bienvenido al Café de Oriente.'],
      options:[
        {id:'carmen-intro',q:['Have you seen this woman?','¿Ha visto a esta mujer?'],a:['Yes. A woman came in alone. She looked worried.','Sí. Entró una mujer sola. Parecía preocupada.']},
        {id:'carmen-when',q:['What time did she arrive?','¿A qué hora llegó?'],a:['At about six thirty. She asked for a table by the window.','Sobre las seis y media. Pidió una mesa junto a la ventana.']},
        {id:'carmen-who',q:['Did she speak to anyone?','¿Habló con alguien?'],a:['She spoke briefly to the gentleman at the back.','Habló un momento con el caballero del fondo.']}
      ]},
    stranger:{name:'EL TESTIGO · MESA DEL FONDO',
      initial:['I was sitting by the window. I saw Evelyn cross the terrace.','Estaba sentado junto a la ventana. Vi a Evelyn cruzar la terraza.'],
      options:[
        {id:'guest-name',q:['May I ask your name?','¿Cómo se llama?'],a:['My name is Thomas. I am a journalist.','Me llamo Thomas. Soy periodista.']},
        {id:'guest-saw',q:['What did you see?','¿Qué vio?'],a:['A man in a dark coat followed her. Then he went left, towards the plaza.','Un hombre con abrigo oscuro la siguió y giró a la izquierda.']},
        {id:'guest-key',q:['Did she leave anything?','¿Dejó algo?'],a:['I saw something fall by the chair. Look underneath it.','Vi caer algo junto a la silla. Mire debajo.'],flag:'keyRevealed'}
      ]},
    gabriel:{name:'GABRIEL · CAMARERO',
      initial:['Can I help you? I was serving the tables.','¿Puedo ayudarle? Estaba atendiendo las mesas.'],
      options:[
        {id:'gabriel-drink',q:['What did she order?','¿Qué pidió?'],a:['Just a glass of water. She did not drink it.','Solo un vaso de agua. No llegó a beberlo.']},
        {id:'gabriel-exit',q:['Which way did she go?','¿Por dónde salió?'],a:['Through the terrace, then towards the palace.','Por la terraza, hacia el palacio.']}
      ]}
  };
  // Real graded dialogue: the selected CEFR band changes grammar, not just a label.
  const speechLevels={
    'carmen-initial':{
      starter:'Hello. Welcome. Can I help you?',
      b1:'Good evening. You seem to be looking for somebody. Is everything all right?',
      b2:'Good evening. If you are looking for someone who visited earlier, perhaps I can be of assistance.'},
    'carmen-intro':{
      starter:'Yes. A woman was here. She was sad.',
      b1:'Yes, a woman came in on her own. She seemed rather anxious and kept watching the door.',
      b2:'As a matter of fact, a woman matching that description arrived alone and appeared deeply unsettled.'},
    'carmen-when':{
      starter:'Six thirty. She sat by the window.',
      b1:'She arrived at roughly half past six and requested a table overlooking the plaza.',
      b2:'If my memory serves me correctly, she arrived shortly after half past six and specifically asked to be seated by the window.'},
    'carmen-who':{
      starter:'Yes. She talked to that man.',
      b1:'She exchanged a few words with the gentleman who is still sitting at the rear table.',
      b2:'She briefly approached the gentleman at the back, although I could not make out what was said.'},
    'stranger-initial':{
      starter:'I sat here. I saw a woman outside.',
      b1:'I was having dinner by the window when I noticed Evelyn crossing the terrace.',
      b2:'I happened to be seated here when I caught sight of Evelyn making her way across the terrace, apparently in some haste.'},
    'guest-name':{
      starter:'I am Thomas. I write stories.',
      b1:'My name is Thomas. I work as a journalist, mostly covering international affairs.',
      b2:'Thomas is the name. I am a freelance correspondent, though my current assignment is rather sensitive.'},
    'guest-saw':{
      starter:'A man followed her. He went left.',
      b1:'I noticed a man wearing a dark coat following her. After a moment, he turned left towards the plaza.',
      b2:'What struck me was that she appeared to be followed by a man in a dark overcoat, who subsequently veered left as though trying to avoid being recognised.'},
    'guest-key':{
      starter:'Look under the chair. A key fell.',
      b1:'Something metallic slipped from her pocket. You might find it beneath that chair.',
      b2:'I am almost certain I saw a small metallic object fall beside the chair; it may still be concealed underneath.'},
    'gabriel-initial':{
      starter:'Hello. Can I help?',
      b1:'Can I help you? I was attending to the tables when the woman arrived.',
      b2:'How may I assist you? I was on duty during the incident you appear to be investigating.'},
    'gabriel-drink':{
      starter:'Water. She did not drink it.',
      b1:'She ordered a glass of water but left before she had even taken a sip.',
      b2:'She requested nothing more than a glass of water, which remained untouched when she hurriedly departed.'},
    'gabriel-exit':{
      starter:'She went outside. Turn left.',
      b1:'She left through the terrace and headed towards the Royal Palace.',
      b2:'She exited onto the terrace and appeared to make her way in the direction of the palace, although I soon lost sight of her.'}
  };
  const gradedQuestions={
    'carmen-intro':{starter:'Woman?',b2:'Did anyone matching her description come in earlier?'},
    'carmen-when':{starter:'What time?',b2:'Can you recall approximately when she arrived?'},
    'carmen-who':{starter:'Did she talk?',b2:'Did you notice her making contact with anybody?'},
    'guest-name':{starter:'Your name?',b2:'Would you mind telling me who you are?'},
    'guest-saw':{starter:'What did you see?',b2:'Could you describe precisely what you witnessed?'},
    'guest-key':{starter:'A clue?',b2:'Did you happen to notice whether she dropped anything?'},
    'gabriel-drink':{starter:'Water or coffee?',b2:'Do you recall what she ordered while she was here?'},
    'gabriel-exit':{starter:'Left or right?',b2:'Can you confirm which direction she took when leaving?'}
  };
  const gradedText=(id,defaultText)=>speechLevels[id]?.[save.language]||defaultText;
  const gradedQuestion=(option)=>gradedQuestions[option.id]?.[save.language]||option.q[0];
  function talk(id,option=null){const data=dialogs[id];if(!data)return;
    const response=option?data.options.find(o=>o.id===option):null;
    if(response?.flag)save.flags[response.flag]=true;
    if(response)save.flags[response.id]=true;
    persist();refresh();dialogue={id};
    const english=gradedText(response?.id||id+'-initial',(response?response.a:data.initial)[0]);
    const spanish=(response?response.a:data.initial)[1];
    const choices=data.options.map(c=>`<button data-choice="${c.id}">${save.flags[c.id]?'✓ ':''}${gradedQuestion(c)}</button>`).join('');
    $('dialogue').innerHTML=`<button class="close" data-close aria-label="Cerrar conversación">×</button><h2>${data.name}</h2>
      <p class="english">“${english}”</p>${save.help?`<p class="spanish">${spanish}</p>`:''}
      <div class="choices">${choices}<button data-close>Goodbye.</button></div>`;
    $('dialogue').hidden=false;speech(english);
  }
  function act(target){
    if(!target)return;
    if((target.id==='receipt'||target.id==='note')&&includes(target.id))return;
    if(target.id==='key'&&!save.flags.keyRevealed)return;
    if(target.id==='door'){
      const next=save.scene==='terrace'?'bistro':'terrace';moveTo(target.walk,()=>transition(next));return;
    }
    let chosen=verb==='smart'?target.verb:verb;
    if(target.id==='stranger'&&chosen!=='look'){chosen='talk';approachingGuest=true;}
    if(chosen==='look'){
      const known=languageWords[target.id];
      if(target.id==='stranger')tell('A man sits alone by the window.','Un hombre está sentado junto a la ventana.');
      else if(target.id==='carmen')tell('The hostess stands behind the marble bar.','La encargada está detrás de la barra.');
      else if(target.id==='gabriel')tell('The waiter carries an empty tray.','El camarero lleva una bandeja vacía.');
      else if(target.item)tell('It may be a useful clue.','Podría ser una pista útil.');
      else tell(known?.[0]||'Something worth examining.',known?.[1]||'Quizá tenga importancia.');
      return;
    }
    if(chosen==='take'&&target.item){moveTo(target.walk,()=>take(target.item));return;}
    if(chosen==='talk'&&dialogs[target.id]){moveTo(target.walk,()=>talk(target.id));return;}
    if(target.id==='table'&&save.scene==='bistro'&&save.flags.keyRevealed){
      moveTo(target.walk,()=>tell('Something metallic gleams by the chair.','Hay un brillo metálico junto a la silla.'));return;
    }
    if(target.item){moveTo(target.walk,()=>take(target.item));return;}
    if(dialogs[target.id]){moveTo(target.walk,()=>talk(target.id));return;}
    const known=languageWords[target.id];moveTo(target.walk,()=>tell(known?.[0]||'You notice nothing unusual.',known?.[1]||'No ves nada extraño.'));
  }
  function activeTargets(){return world[save.scene].targets.filter(t=>!((t.item&&includes(t.item))||(t.id==='key'&&!save.flags.keyRevealed))).map(t=>{
    if(t.id==='gabriel')return {...t,x:waiter.x,y:waiter.y-70,walk:{x:waiter.x+86,y:waiter.y}};
    if(t.id==='stranger')return {...t,x:guestX,y:guestY-60};return t;
  });}
  function findTarget(point){const candidates=activeTargets().filter(t=>sqr((point.x-t.x)/t.rx)+sqr((point.y-t.y)/t.ry)<1);
    candidates.sort((a,b)=>(a.item?-1:1)-(b.item?-1:1));return candidates[0]||null;}
  const mousePosition=event=>{const bounds=canvas.getBoundingClientRect();return {x:(event.clientX-bounds.left)*W/bounds.width,y:(event.clientY-bounds.top)*H/bounds.height};};
  canvas.addEventListener('pointermove',ev=>{
    const p=mousePosition(ev),target=findTarget(p);hovered=target;
    canvas.style.cursor=target?'pointer':floor(save.scene,p.x,p.y)?'crosshair':'default';
    const label=$('hover-label');label.hidden=!target;
    if(target){label.textContent=target.name+(save.help?' · '+target.es:'');const r=canvas.getBoundingClientRect(),s=$('stage').getBoundingClientRect();
      label.style.left=clamp(ev.clientX-s.left+12,8,s.width-205)+'px';label.style.top=clamp(ev.clientY-s.top-38,8,s.height-40)+'px';}
  });
  canvas.addEventListener('pointerleave',()=>{$('hover-label').hidden=true;hovered=null;});
  canvas.addEventListener('click',ev=>{const p=mousePosition(ev),target=findTarget(p);if(dialogue){$('dialogue').hidden=true;dialogue=null;}
    if(target){act(target);return;}moveTo(p);});
  $('dialogue').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-close')){dialogue=null;$('dialogue').hidden=true;return;}
    if(dialogue?.id==='avatar'&&button.dataset.choice){
      save.avatar=button.dataset.choice;persist();dialogue=null;$('dialogue').hidden=true;
      tell(save.avatar==='agent-f'?'Agent profile: female.':'Agent profile: male.','Perfil de agente actualizado.');return;
    }
    if(button.dataset.choice&&dialogue)talk(dialogue.id,button.dataset.choice);
  });
  $('avatar').addEventListener('click',()=>{
    dialogue={id:'avatar'};
    $('dialogue').innerHTML='<button class="close" data-close aria-label="Cerrar">×</button><h2>EXPEDIENTE DEL AGENTE</h2><p class="english">Elige la apariencia de tu protagonista.</p><div class="choices"><button data-choice="agent-m">Agente masculino</button><button data-choice="agent-f">Agente femenino</button><button data-close>Cancelar</button></div>';
    $('dialogue').hidden=false;
  });
  document.querySelectorAll('[data-verb]').forEach(button=>button.addEventListener('click',()=>{
    verb=button.dataset.verb;document.querySelectorAll('[data-verb]').forEach(b=>b.classList.toggle('chosen',b===button));
  }));
  $('level').value=save.language;$('level').addEventListener('change',event=>{save.language=event.target.value;persist();tell('English level updated.','Nivel de inglés actualizado.');});
  $('language').addEventListener('click',()=>{save.help=!save.help;$('language').textContent=save.help?'ES ✓':'ES';$('language').setAttribute('aria-pressed',String(save.help));persist();});
  $('language').textContent=save.help?'ES ✓':'ES';
  $('sound').textContent=save.sound?'🔊':'🔇';$('sound').addEventListener('click',()=>{save.sound=!save.sound;$('sound').textContent=save.sound?'🔊':'🔇';persist();});
  $('reset').addEventListener('click',()=>{if(!confirm('¿Reiniciar únicamente la nueva versión de prueba?'))return;
    save=initial();Object.assign(agent,world.terrace.spawn,{moving:false});guestMode='seated';guestX=guestSeat.x;guestY=guestSeat.y;approachingGuest=false;
    nodes=[];onArrival=null;dialogue=null;$('dialogue').hidden=true;$('scene-name').textContent=world.terrace.title;
    persist();refresh();});
  function refresh(){
    const icon=(id)=>`<img src="./assets/${id}.svg" alt="" aria-hidden="true">`;
    $('inventory').innerHTML=save.inventory.map(id=>`<button data-item="${id}" title="${itemTitles[id]}">${icon(id)}<span>${itemTitles[id]}</span></button>`).join('')+
      Array.from({length:Math.max(0,4-save.inventory.length)},()=>'<span class="empty-slot">?</span>').join('');
    $('case-count').textContent=`${save.inventory.length} / 3`;$('progress').style.width=(save.inventory.length/3*100)+'%';
    $('objective').textContent=!includes('receipt')?'Investiga la mesa exterior y busca el recibo.':
      !save.flags['guest-saw']?'Habla con el testigo sentado junto a la ventana.':
      !includes('key')?'Recoge la llave y encuentra la nota.':
      !includes('note')?'Busca el mensaje que dejó Evelyn.':'Tres pruebas reunidas. Próximo destino: plaza de la Lealtad.';
  }
  $('inventory').addEventListener('click',e=>{const b=e.target.closest('[data-item]');if(!b)return;
    const id=b.dataset.item;tell(`${itemTitles[id]} added to the case file.`,`${itemTitles[id]} en el expediente.`);});
  function drawEvidence(){
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(save.scene==='terrace'&&!includes('receipt')&&evidenceSprites.receipt.naturalWidth)
      ctx.drawImage(evidenceSprites.receipt,756,389,28,28);
    if(save.scene==='bistro'){
      if(!includes('note')&&evidenceSprites.note.naturalWidth)ctx.drawImage(evidenceSprites.note,499,550,30,30);
      if(save.flags.keyRevealed&&!includes('key')&&evidenceSprites.key.naturalWidth)ctx.drawImage(evidenceSprites.key,840,472,28,28);
    }
    ctx.restore();
  }
  function drawPerson(role,x,y,{facing=1,walking=false,stride=0,seated=false,heightFactor=1,rise=1,shadow=true}={}){
    const sprite=sprites[seated?'stranger-seated':role];if(!sprite?.naturalWidth)return;
    const h=150*scale(save.scene,y)*heightFactor*(seated?.78:1),w=h*sprite.naturalWidth/sprite.naturalHeight;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;
    if(shadow&&!seated){ctx.fillStyle='#060a1270';ctx.beginPath();ctx.ellipse(0,1,Math.max(11,w*.39),Math.max(3,4.4*scale(save.scene,y)),0,0,Math.PI*2);ctx.fill();}
    ctx.scale(facing<0?-1:1,1);
    if(!walking||seated){
      if(rise<1){const exposed=Math.floor(sprite.height*(.66+.34*rise));ctx.drawImage(sprite,0,0,sprite.width,exposed,-w/2,-h*(.72+.28*rise),w,h*(.72+.28*rise));}
      else ctx.drawImage(sprite,-w/2,-h,w,h);
    }else{
      // Leg swing is anchored to the hip. Torso stays fixed; no levitation.
      const split=Math.floor(sprite.height*.77),legH=sprite.height-split,half=Math.floor(sprite.width/2),angle=Math.sin(stride)*.095;
      const hip=-h+h*split/sprite.height;
      for(let i=0;i<2;i++){const srcX=i?half:0,srcW=i?sprite.width-half:half,pivot=i?w*.065:-w*.065;
        ctx.save();ctx.translate(pivot,hip+1);ctx.rotate(i?-angle:angle);
        ctx.drawImage(sprite,srcX,split,srcW,legH,-w/2+w*srcX/sprite.width-pivot,-2,w*srcW/sprite.width,h*legH/sprite.height+2);ctx.restore();
      }
      ctx.drawImage(sprite,0,0,sprite.width,split,-w/2,-h,w,h*split/sprite.height+2);
    }ctx.restore();
  }
  function coverBar(){// Exact backplate pixels: the hostess stays physically BEHIND the marble counter.
    const img=backdrops.bistro;if(!img.naturalWidth)return;
    ctx.save();ctx.beginPath();[[0,372],[153,369],[304,335],[332,358],[332,675],[0,675]].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();ctx.clip();ctx.imageSmoothingEnabled=true;ctx.drawImage(img,0,0,W,H);ctx.restore();
  }
  let last=performance.now();
  function tick(now){const dt=Math.min(.045,Math.max(.001,(now-last)/1000));last=now;
    if(save.scene==='bistro'){
      if(approachingGuest&&guestMode==='seated'&&dist(agent,guestSeat)<177){
        guestMode='rising';guestChangeAt=now;approachingGuest=false;
      }
      if(guestMode==='rising'){
        const fraction=clamp((now-guestChangeAt)/870,0,1);
        guestX=lerp(guestSeat.x,guestStand.x,fraction);guestY=lerp(guestSeat.y,guestStand.y,fraction);
        if(fraction>=1)guestMode='standing';
      }
      if(waiter.held<now){const goal=waiterStops[waiter.goal],dx=goal.x-waiter.x,dy=goal.y-waiter.y,d=Math.hypot(dx,dy);
        if(d<3){waiter.goal=(waiter.goal+1)%waiterStops.length;waiter.held=now+1700;}
        else{const step=Math.min(d,50*dt);const nx=waiter.x+step*dx/d,ny=waiter.y+step*dy/d;
          if(!((sqr((nx-agent.x)/54)+sqr((ny-agent.y)/27))<1)){
            waiter.x=nx;waiter.y=ny;waiter.stride+=step*.12;waiter.facing=dx<0?-1:1;
          }else waiter.held=now+550;
        }
      }
    }
    if(nodes.length){const next=nodes[0],dx=next.x-agent.x,dy=next.y-agent.y,d=Math.hypot(dx,dy);
      const step=Math.min(d,185*scale(save.scene,agent.y)*dt);
      const nx=d?agent.x+dx/d*step:next.x,ny=d?agent.y+dy/d*step:next.y;
      if(canStand(save.scene,nx,ny)){
        agent.x=nx;agent.y=ny;agent.moving=d>2;agent.stride+=step*.12;if(Math.abs(dx)>1.5)agent.facing=dx<0?-1:1;
        if(d<=step+1.2){agent.x=next.x;agent.y=next.y;nodes.shift();if(!nodes.length){agent.moving=false;const done=onArrival;onArrival=null;if(done)done();}}
      }else{const endpoint=nodes[nodes.length-1],newRoute=route(save.scene,agent,endpoint);
        if(newRoute.length)nodes=newRoute;else{nodes=[];onArrival=null;agent.moving=false;}
      }
    }else agent.moving=false;
    draw(now);if(announcement&&now>announcementUntil){announcement=null;$('toast').hidden=true;}
    requestAnimationFrame(tick);
  }
  function draw(now){ctx.clearRect(0,0,W,H);const bg=backdrops[save.scene];
    if(bg.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.drawImage(bg,0,0,W,H);}else{ctx.fillStyle='#101c2d';ctx.fillRect(0,0,W,H);}
    drawEvidence();
    if(save.scene==='bistro'){
      drawPerson('carmen',174,425,{facing:1,heightFactor:1.03,shadow:false});coverBar();
    }
    const actors=[{role:save.avatar,x:agent.x,y:agent.y,options:{facing:agent.facing,walking:agent.moving,stride:agent.stride}}];
    if(save.scene==='bistro'){
      const standing=guestMode!=='seated';
      actors.push({role:'stranger',x:guestX,y:guestY,options:{facing:-1,seated:!standing,rise:standing?clamp((now-guestChangeAt)/870,0,1):1}});
      actors.push({role:'gabriel',x:waiter.x,y:waiter.y,options:{facing:waiter.facing,walking:waiter.held<now,stride:waiter.stride,heightFactor:.97}});
    }
    actors.sort((a,b)=>a.y-b.y).forEach(a=>drawPerson(a.role,a.x,a.y,a.options));
    if(new URLSearchParams(location.search).has('debug')){
      ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#54e697';for(const p of world[save.scene].floors){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();}
      ctx.strokeStyle='#f7779a';for(const p of world[save.scene].blocks){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();}ctx.restore();
    }
  }
  window.ENGLISH_SPY_REBUILD_QA={world,walkable,route,agent,save,activeTargets};
  if(new URLSearchParams(location.search).has('debug')){
    document.body.dataset.navigationQa=JSON.stringify({
      terrace:{start:walkable('terrace',295,600),goal:walkable('terrace',689,501),route:route('terrace',{x:295,y:600},{x:689,y:501})},
      bistro:{start:walkable('bistro',1090,572),goal:walkable('bistro',821,520),route:route('bistro',{x:1090,y:572},{x:821,y:520})},
      targets:Object.fromEntries(Object.entries(world).map(([scene,data])=>[
        scene,data.targets.filter(t=>!t.dynamic).map(t=>{
          const destination=Array.isArray(t.walk)?{x:t.walk[0],y:t.walk[1]}:t.walk;
          return {id:t.id,foot:walkable(scene,destination.x,destination.y),reachable:route(scene,data.spawn,destination,false).length>0};
        })
      ]))
    });
  }
  $('scene-name').textContent=world[save.scene].title;refresh();requestAnimationFrame(tick);
})();
