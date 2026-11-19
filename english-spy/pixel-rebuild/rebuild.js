/* English Spy — Chapter 1. Cutscene, real foreground layers and beginner dialogue. */
(() => {
  'use strict';
  const W=1200,H=675,STORAGE='english-spy-rebuild-alpha-03';
  const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
  const $=id=>document.getElementById(id);
  const sprites={},backdrops={},evidenceSprites={},terraceLayers=[];
  const asset=(file)=>`./assets/${file}.webp`;
  for(const [id,file] of Object.entries({terrace:'../pixel-preview/assets/terrace-pixel',bistro:'bistro'})){
    backdrops[id]=new Image();
    backdrops[id].src=id==='terrace'?'../pixel-preview/assets/terrace-pixel.webp':asset(file);
  }
  for(const id of ['agent-m','agent-f','carmen','gabriel','stranger','stranger-seated']){
    sprites[id]=new Image();sprites[id].src=asset('characters/'+id);
  }
  const atlases={evelyn:new Image(),gabriel:new Image()};
  atlases.evelyn.src=asset('evelyn-intro');atlases.gabriel.src=asset('gabriel-walk');
  for(const id of ['receipt','note','key','napkin']){evidenceSprites[id]=new Image();evidenceSprites[id].src='./assets/'+id+'.svg';}
  // Recover the original, densely furnished terrace. Each object is traced
  // from the SAME illustration, so perspective, lighting and pixels match.
  // Its floor collision is separate from its foreground paint mask.
  const terraceProps=[
    {id:'flowerbed',depth:667,foot:[[0,508],[150,500],[231,548],[229,675],[0,675]],
      masks:[[[0,430],[155,426],[230,485],[227,675],[0,675]]]},
    {id:'planter',depth:552,foot:[[422,481],[551,477],[562,542],[426,543]],
      masks:[[[422,430],[452,376],[519,378],[556,414],[566,539],[434,543]]]},
    {id:'chairs-west',depth:535,foot:[[627,423],[715,412],[730,521],[626,530]],
      masks:[[[624,391],[721,383],[737,532],[621,531]]]},
    {id:'chairs-centre',depth:524,foot:[[727,410],[826,402],[841,512],[723,521]],
      masks:[[[722,377],[831,370],[849,521],[712,522]]]},
    {id:'chairs-east',depth:527,foot:[[833,410],[956,403],[976,516],[831,520]],
      masks:[[[826,376],[963,371],[988,522],[817,525]]]},
    {id:'door-planter',depth:540,foot:[[915,434],[1039,430],[1053,532],[913,536]],
      masks:[[[900,405],[941,364],[1038,374],[1064,417],[1064,526],[912,534]]]},
    {id:'front-table',depth:676,foot:[[550,551],[614,526],[995,513],[1059,566],[1026,675],[622,675]],
      masks:[[[541,561],[565,515],[635,496],[955,489],[1034,522],[1054,571],[1023,601],[957,630],[638,638],[551,606]]]},
    {id:'front-chair',depth:684,foot:[[1012,511],[1087,458],[1200,478],[1200,675],[1026,675]],
      masks:[[[978,460],[1048,412],[1200,428],[1200,675],[1025,675]]]},
    {id:'tree-trunk',depth:685,foot:[[0,0],[108,0],[99,401],[0,409]],
      masks:[[[0,0],[490,0],[453,64],[284,101],[186,180],[94,386],[0,410]]]}
  ];

  // Every scene has one authoritative floor mesh, measured at the ACTOR'S FEET.
  // Furniture is placed OUTSIDE these polygons. This is not a painting with
  // selectable rectangles or an image pretending to contain collision data.
  const world={
    terrace:{
      title:'PLAZA DE ORIENTE · CAFÉ DE ORIENTE · 18:47',
      scale:{farY:405,nearY:655,far:.74,near:1.40},
      spawn:{x:305,y:594},door:{x:1095,y:448},
      floors:[
        [[230,397],[420,397],[420,655],[230,655]],
        [[387,373],[630,373],[630,437],[387,437]],
        [[385,540],[620,540],[620,675],[385,675]],
        [[565,414],[627,414],[627,568],[565,568]],
        [[563,362],[1138,362],[1138,410],[563,410]],
        [[1049,382],[1150,382],[1150,510],[1049,510]]
      ],
      blocks:terraceProps.filter(p=>p.id!=='tree-trunk').map(p=>p.foot),
      targets:[
        {id:'palace',name:'Royal Palace',es:'Palacio Real',x:425,y:269,rx:316,ry:141,walk:[320,539],verb:'look'},
        {id:'table',name:'Outdoor table',es:'Mesa de mármol de la terraza',x:785,y:541,rx:221,ry:82,walk:[540,592],verb:'look'},
        {id:'chair',name:'Wrought-iron chair',es:'Silla de forja',x:1096,y:506,rx:88,ry:111,walk:[1084,413],verb:'look'},
        {id:'cup',name:'Coffee cup',es:'Taza de café',x:824,y:495,rx:40,ry:35,walk:[587,511],verb:'look'},
        {id:'newspaper',name:'Folded newspaper',es:'Periódico doblado',x:716,y:540,rx:66,ry:27,walk:[540,592],verb:'look'},
        {id:'napkin',name:'White napkin',es:'Servilleta de Evelyn',x:930,y:532,rx:40,ry:29,walk:[540,592],verb:'take',item:'napkin'},
        {id:'receipt',name:'Folded receipt',es:'Recibo doblado',x:839,y:548,rx:31,ry:30,walk:[540,592],verb:'take',item:'receipt'},
        {id:'planter',name:'Flower planter',es:'Jardinera de hortensias',x:105,y:545,rx:107,ry:122,walk:[273,587],verb:'look'},
        {id:'planter-middle',name:'Terrace planter',es:'Jardinera central',x:485,y:458,rx:71,ry:94,walk:[416,574],verb:'look'},
        {id:'table-middle',name:'Terrace tables',es:'Mesas del café',x:673,y:430,rx:90,ry:68,walk:[590,519],verb:'look'},
        {id:'table-back',name:'Tables by the arcade',es:'Mesas bajo la marquesina',x:863,y:417,rx:99,ry:49,walk:[1027,395],verb:'look'},
        {id:'gabriel',name:'Gabriel · Waiter',es:'Gabriel · Camarero',x:1079,y:401,rx:46,ry:92,walk:[1086,401],verb:'talk',dynamic:true},
        {id:'tree',name:'Old plane tree',es:'Plátano de sombra',x:94,y:153,rx:122,ry:145,walk:[281,529],verb:'look'},
        {id:'garden',name:'Ornamental garden',es:'Jardín de la plaza',x:193,y:430,rx:91,ry:55,walk:[284,525],verb:'look'},
        {id:'door',name:'Café de Oriente entrance',es:'Entrar al café',x:1110,y:355,rx:86,ry:126,walk:[1095,448],verb:'enter'}
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
  const initial=()=>({scene:'terrace',language:'starter',help:true,sound:true,inventory:[],flags:{},avatar:'agent-m'});
  function restore(){try{const s=JSON.parse(localStorage.getItem(STORAGE));return s&&world[s.scene]&&Array.isArray(s.inventory)?{...initial(),...s,flags:{...s.flags}}:initial();}catch{return initial();}}
  let save=restore();
  const persist=()=>localStorage.setItem(STORAGE,JSON.stringify(save));
  const agent={x:world[save.scene].spawn.x,y:world[save.scene].spawn.y,facing:-1,stride:0,moving:false};
  let nodes=[],onArrival=null,verb='smart',dialogue=null,hovered=null,announcement=null,announcementUntil=0;
  let guestMode='seated',guestChangeAt=0,guestX=957,guestY=469,approachingGuest=false;
  const guestSeat={x:957,y:469},guestStand={x:896,y:496};
  const waiter={x:676,y:561,stride:0,facing:1,goal:0,held:0};
  const waiterStops=[{x:676,y:561},{x:579,y:548},{x:722,y:565}];
  const terraceWaiter={x:1112,y:390,stride:0,facing:-1,path:[],held:false};
  const intro={active:save.scene==='terrace'&&!save.flags.introSeen,start:performance.now(),time:0};
  function startIntro(){
    save.scene='terrace';nodes=[];onArrival=null;dialogue=null;$('dialogue').hidden=true;$('hover-label').hidden=true;
    $('scene-name').textContent=world.terrace.title;
    Object.assign(agent,{x:242,y:585,facing:1,moving:false,stride:0});
    Object.assign(terraceWaiter,{x:1112,y:390,stride:0,facing:-1,path:[],held:false});
    intro.active=true;intro.start=performance.now();intro.time=0;
    $('cinematic').hidden=false;refresh();
  }
  function endIntro(){
    intro.active=false;intro.time=10;
    save.flags.introSeen=true;persist();
    Object.assign(agent,{x:305,y:594,facing:1,moving:false,stride:0});
    Object.assign(terraceWaiter,{x:1090,y:403,stride:0,facing:-1,held:false});
    // Gabriel steps out of the café and waits beside the entrance. Sending him
    // across the occupied terrace would visually place his legs over the tables.
    terraceWaiter.path=route('terrace',terraceWaiter,{x:1075,y:406},false);
    $('cinematic').hidden=true;refresh();
    tell('Find a clue. Talk to Gabriel.','Busca una pista. Habla con Gabriel.');
  }
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
  }else if(save.scene==='terrace'&&!intro.active){
    if((sqr((x-terraceWaiter.x)/28)+sqr((y-terraceWaiter.y)/18))<1)return true;
  }return false;}
  function canStand(scene,x,y,avoid=true){return walkable(scene,x,y)&&(!avoid||scene!==save.scene||!actorCollision(x,y));}
  const CELL=15,COLS=W/CELL,ROWS=H/CELL;
  const cell=(id)=>({x:(id%COLS)*CELL+CELL/2,y:Math.floor(id/COLS)*CELL+CELL/2});
  function nearest(scene,target,avoid=true){if(canStand(scene,target.x,target.y,avoid))return {x:target.x,y:target.y};
    let best=null,d=Infinity;for(let i=0;i<COLS*ROWS;i++){const p=cell(i);if(!canStand(scene,p.x,p.y,avoid))continue;const n=sqr(p.x-target.x)+sqr(p.y-target.y);if(n<d){d=n;best=p;}}return best;}
  function clearLine(scene,a,b,avoid=true){for(let i=0,n=Math.ceil(dist(a,b)/2);i<=n;i++){
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
        // Two walkable grid points can still straddle a diagonal corner.
        // Check the entire step, otherwise the actor replans forever there.
        if(!clearLine(scene,cell(cur),cell(next),avoid))continue;
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
    const spawn=scene==='bistro'?{x:1090,y:572}:{x:1095,y:448};Object.assign(agent,spawn,{moving:false,stride:0});nodes=[];onArrival=null;
    dialogue=null;$('dialogue').hidden=true;$('hover-label').hidden=true;hovered=null;$('scene-name').textContent=world[scene].title;
    persist();refresh();
    if(scene==='bistro')moveTo({x:1007,y:590});else moveTo({x:1090,y:398});
  }
  const includes=id=>save.inventory.includes(id);
  const languageWords={
    palace:['That is the Royal Palace of Madrid.','Evelyn chose a busy public place for the meeting.'],
    garden:['The garden is full of flowers.','No signs of Evelyn behind the railing.'],
    table:['A round marble table overlooking the Royal Palace. Someone left in a hurry.','Una mesa de mármol frente al Palacio Real. Alguien se marchó precipitadamente.'],
    cup:['The coffee is hot. Hot!','El café está caliente. ¡Caliente!'],
    napkin:['A white napkin. Someone wrote on it.','Una servilleta blanca. Alguien escribió en ella.'],
    newspaper:['The folded newspaper is dated today. It may hide a message.','El periódico está fechado hoy. Quizá esconda una pista.'],
    chair:['A wrought-iron chair. It was pushed back in a hurry.','Una silla de forja apartada con prisa.'],
    planter:['White and pink hydrangeas. The flowerbed hides no footprints.','Hortensias blancas y rosas. No ves huellas.'],
    'planter-middle':['The terrace has several flower planters. This one conceals the tables from the plaza.','La jardinera separa las mesas de la zona de paso.'],
    'table-middle':['Several tables are prepared for the evening service.','Hay varias mesas preparadas para el servicio de tarde.'],
    'table-back':['From these tables the customers can see the palace and the café entrance.','Desde aquí los clientes ven el palacio y la entrada del café.'],
    tree:['An old plane tree shades the terrace.','Un plátano de sombra cubre parte de la terraza.'],
    painting:['An ornate framed mirror reflects the bistro.','You see the room from another angle.']
  };
  const itemTitles={napkin:'Napkin',receipt:'Receipt',note:'Folded note',key:'Brass key'};
  function tell(text,es=''){announcement=save.help&&es?text+' · '+es:text;announcementUntil=performance.now()+3800;
    $('toast').textContent=announcement;$('toast').hidden=false;}
  function speech(text){if(!save.sound||!('speechSynthesis' in window))return;try{
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=save.language==='starter'?.78:.92;speechSynthesis.speak(u);
  }catch{}}
  function take(id){if(includes(id))return;
    if(id==='key'&&!save.flags.keyRevealed){tell('Nothing obvious is under the chair.','Primero consigue una pista del testigo.');return;}
    save.inventory.push(id);persist();refresh();
    const messages={napkin:['A note! It says: “LOOK LEFT”.','¡Una nota! Dice «MIRA A LA IZQUIERDA».'],receipt:['A receipt: 18:36. Someone paid before Evelyn arrived.','Un recibo de las 18:36.'],note:['A folded message: “Lealtad. 19:10.”','Una nota doblada con una dirección.'],key:['A brass key engraved with a small number.','Una llave marcada con un número.']};
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
      initial:['Hello! Can I help you?','¡Hola! ¿Puedo ayudarte?'],
      options:[
        {id:'gabriel-name',q:['What is your name?','¿Cómo te llamas?'],a:['My name is Gabriel.','Me llamo Gabriel.']},
        {id:'gabriel-time',q:['What time is it?','¿Qué hora es?'],a:['It is six forty-eight.','Son las seis y cuarenta y ocho.']},
        {id:'gabriel-weather',q:['How is the weather?','¿Qué tiempo hace?'],a:['It is cool and sunny.','Hace fresco y hay sol.']},
        {id:'gabriel-who',q:['Who was sitting here?','¿Quién estaba sentado aquí?'],a:['A woman. She had sunglasses.','Una mujer. Llevaba gafas de sol.']},
        {id:'gabriel-colour',q:['What colour was her coat?','¿De qué color era su abrigo?'],a:['Green. Her coat was green.','Verde. Su abrigo era verde.']},
        {id:'gabriel-drink',q:['Coffee or tea?','¿Café o té?'],a:['Coffee. Her coffee is still hot.','Café. Todavía está caliente.']},
        {id:'gabriel-exit',q:['Did she go left or right?','¿Fue a la izquierda o derecha?'],a:['She ran left. Very fast!','Corrió hacia la izquierda. ¡Muy rápido!']}
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
      starter:'Hello! Can I help you?',
      b1:'Can I help you? I was attending to the tables when the woman arrived.',
      b2:'How may I assist you? I was on duty during the incident you appear to be investigating.'},
    'gabriel-name':{starter:'My name is Gabriel.',b1:'My name is Gabriel. I work here as a waiter.',b2:'My name is Gabriel, and I was working the evening shift when she arrived.'},
    'gabriel-time':{starter:'It is six forty-eight.',b1:'It is just after quarter to seven, about six forty-eight.',b2:'According to the clock, it is precisely eighteen forty-eight.'},
    'gabriel-weather':{starter:'It is cool and sunny.',b1:'It has been a lovely, clear evening, but the air is getting cooler.',b2:'Although the evening began pleasantly warm, the temperature has dropped as the sun has started to set.'},
    'gabriel-who':{starter:'A woman. She had sunglasses.',b1:'A woman wearing dark sunglasses was sitting there a moment ago.',b2:'A rather anxious-looking woman, wearing sunglasses despite the fading light, occupied that table.'},
    'gabriel-colour':{starter:'Green. Her coat was green.',b1:'She was wearing a long, dark green coat and a red scarf.',b2:'She had on an olive-green overcoat, which made her quite distinctive.'},
    'gabriel-drink':{
      starter:'Coffee. It is still hot.',
      b1:'She ordered a coffee, but rushed away while it was still hot.',
      b2:'She had ordered a coffee, which was left untouched and steaming when she abruptly departed.'},
    'gabriel-exit':{
      starter:'She ran left. Very fast!',
      b1:'She suddenly ran towards the left side of the plaza.',
      b2:'Without the slightest warning, she bolted towards the left-hand side of the square, apparently fleeing from something.'}
  };
  const gradedQuestions={
    'carmen-intro':{starter:'Woman?',b2:'Did anyone matching her description come in earlier?'},
    'carmen-when':{starter:'What time?',b2:'Can you recall approximately when she arrived?'},
    'carmen-who':{starter:'Did she talk?',b2:'Did you notice her making contact with anybody?'},
    'guest-name':{starter:'Your name?',b2:'Would you mind telling me who you are?'},
    'guest-saw':{starter:'What did you see?',b2:'Could you describe precisely what you witnessed?'},
    'guest-key':{starter:'A clue?',b2:'Did you happen to notice whether she dropped anything?'},
    'gabriel-drink':{starter:'Coffee or tea?',b2:'Do you recall what she ordered while she was here?'},
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
    const choices=data.options.map(c=>`<button data-choice="${c.id}"><span>${save.flags[c.id]?'✓ ':''}${gradedQuestion(c)}</span>${save.help?`<small>${c.q[1]}</small>`:''}</button>`).join('');
    $('dialogue').innerHTML=`<button class="close" data-close aria-label="Cerrar conversación">×</button><h2>${data.name}</h2>
      <p class="english">“${english}”</p>${save.help?`<p class="spanish">${spanish}</p>`:''}
      <div class="choices">${choices}<button data-close>Goodbye.</button></div>`;
    $('dialogue').hidden=false;speech(english);
  }
  function act(target){
    if(!target)return;
    if((target.id==='receipt'||target.id==='note'||target.id==='napkin')&&includes(target.id))return;
    if(target.id==='key'&&!save.flags.keyRevealed)return;
    if(target.id==='door'){
      const next=save.scene==='terrace'?'bistro':'terrace';moveTo(target.walk,()=>transition(next));return;
    }
    let chosen=verb==='smart'?target.verb:verb;
    if(target.id==='stranger'&&chosen!=='look'){chosen='talk';approachingGuest=true;}
    if(chosen==='look'){
      const known=languageWords[target.id];
      const explain=()=>{
        if(target.id==='stranger')tell('A man sits alone by the window.','Un hombre está sentado junto a la ventana.');
        else if(target.id==='carmen')tell('The hostess stands behind the marble bar.','La encargada está detrás de la barra.');
        else if(target.id==='gabriel')tell('The waiter carries an empty tray.','El camarero lleva una bandeja vacía.');
        else if(target.item)tell('It may be a useful clue.','Podría ser una pista útil.');
        else tell(known?.[0]||'Something worth examining.',known?.[1]||'Quizá tenga importancia.');
        if(known)speech(known[0]);
      };
      // An observation has a physical position. The character must get there first.
      moveTo(target.walk,explain);return;
    }
    if(chosen==='take'&&target.item){moveTo(target.walk,()=>take(target.item));return;}
    if(chosen==='talk'&&dialogs[target.id]){
      if(target.id==='gabriel'&&save.scene==='terrace')terraceWaiter.held=true;
      if(!moveTo(target.walk,()=>talk(target.id))&&target.id==='gabriel')terraceWaiter.held=false;
      return;
    }
    if(target.id==='table'&&save.scene==='bistro'&&save.flags.keyRevealed){
      moveTo(target.walk,()=>tell('Something metallic gleams by the chair.','Hay un brillo metálico junto a la silla.'));return;
    }
    if(target.item){moveTo(target.walk,()=>take(target.item));return;}
    if(dialogs[target.id]){moveTo(target.walk,()=>talk(target.id));return;}
    const known=languageWords[target.id];moveTo(target.walk,()=>tell(known?.[0]||'You notice nothing unusual.',known?.[1]||'No ves nada extraño.'));
  }
  function activeTargets(){return world[save.scene].targets.filter(t=>!((t.item&&includes(t.item))||(t.id==='key'&&!save.flags.keyRevealed))).map(t=>{
    if(t.id==='gabriel')return save.scene==='terrace'?
      {...t,x:terraceWaiter.x,y:terraceWaiter.y-90,walk:{x:terraceWaiter.x-58,y:terraceWaiter.y+19}}:
      {...t,x:waiter.x,y:waiter.y-70,walk:{x:waiter.x+86,y:waiter.y}};
    if(t.id==='stranger')return {...t,x:guestX,y:guestY-60};return t;
  });}
  function findTarget(point){const candidates=activeTargets().filter(t=>sqr((point.x-t.x)/t.rx)+sqr((point.y-t.y)/t.ry)<1);
    const priority={napkin:130,gabriel:110,receipt:100,key:100,note:100,door:90,cup:80,newspaper:80,chair:60,table:20};
    candidates.sort((a,b)=>(priority[b.id]||10)-(priority[a.id]||10));return candidates[0]||null;}
  const mousePosition=event=>{const bounds=canvas.getBoundingClientRect();return {x:(event.clientX-bounds.left)*W/bounds.width,y:(event.clientY-bounds.top)*H/bounds.height};};
  canvas.addEventListener('pointermove',ev=>{
    if(intro.active)return;
    const p=mousePosition(ev),target=findTarget(p);hovered=target;
    canvas.style.cursor=target?'pointer':floor(save.scene,p.x,p.y)?'crosshair':'default';
    const label=$('hover-label');label.hidden=!target;
    if(target){label.textContent=target.name+(save.help?' · '+target.es:'');const r=canvas.getBoundingClientRect(),s=$('stage').getBoundingClientRect();
      label.style.left=clamp(ev.clientX-s.left+12,8,s.width-205)+'px';label.style.top=clamp(ev.clientY-s.top-38,8,s.height-40)+'px';}
  });
  canvas.addEventListener('pointerleave',()=>{$('hover-label').hidden=true;hovered=null;});
  canvas.addEventListener('click',ev=>{if(intro.active)return;const p=mousePosition(ev),target=findTarget(p);if(dialogue){$('dialogue').hidden=true;dialogue=null;}
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
    if(intro.active)return;
    dialogue={id:'avatar'};
    $('dialogue').innerHTML='<button class="close" data-close aria-label="Cerrar">×</button><h2>EXPEDIENTE DEL AGENTE</h2><p class="english">Elige la apariencia de tu protagonista.</p><div class="choices"><button data-choice="agent-m">Agente masculino</button><button data-choice="agent-f">Agente femenino</button><button data-close>Cancelar</button></div>';
    $('dialogue').hidden=false;
  });
  document.querySelectorAll('[data-verb]').forEach(button=>button.addEventListener('click',()=>{
    if(intro.active)return;
    verb=button.dataset.verb;document.querySelectorAll('[data-verb]').forEach(b=>b.classList.toggle('chosen',b===button));
  }));
  $('level').value=save.language;$('level').addEventListener('change',event=>{save.language=event.target.value;persist();tell('English level updated.','Nivel de inglés actualizado.');});
  $('language').addEventListener('click',()=>{save.help=!save.help;$('language').textContent=save.help?'ES ✓':'ES';$('language').setAttribute('aria-pressed',String(save.help));persist();});
  $('language').textContent=save.help?'ES ✓':'ES';
  $('sound').textContent=save.sound?'🔊':'🔇';$('sound').addEventListener('click',()=>{save.sound=!save.sound;$('sound').textContent=save.sound?'🔊':'🔇';persist();});
  $('reset').addEventListener('click',()=>{if(!confirm('¿Reiniciar únicamente la nueva versión de prueba?'))return;
    save=initial();Object.assign(agent,world.terrace.spawn,{moving:false});guestMode='seated';guestX=guestSeat.x;guestY=guestSeat.y;approachingGuest=false;
    nodes=[];onArrival=null;dialogue=null;$('dialogue').hidden=true;$('scene-name').textContent=world.terrace.title;
    persist();startIntro();});
  $('replay').addEventListener('click',()=>startIntro());
  $('skip-intro').addEventListener('click',()=>endIntro());
  function refresh(){
    const icon=(id)=>`<img src="./assets/${id}.svg" alt="" aria-hidden="true">`;
    $('inventory').innerHTML=save.inventory.map(id=>`<button data-item="${id}" title="${itemTitles[id]}">${icon(id)}<span>${itemTitles[id]}</span></button>`).join('')+
      Array.from({length:Math.max(0,4-save.inventory.length)},()=>'<span class="empty-slot">?</span>').join('');
    $('case-count').textContent=`${save.inventory.length} / 4`;$('progress').style.width=(save.inventory.length/4*100)+'%';
    $('objective').textContent=intro.active?'Observa a Evelyn. La investigación está a punto de comenzar.':
      !includes('napkin')?'La mujer dejó una servilleta en la mesa. Examínala y habla con Gabriel.':
      !includes('receipt')?'Busca el recibo que hay en la mesa exterior.':
      !save.flags['guest-saw']?'Habla con el testigo sentado junto a la ventana.':
      !includes('key')?'Recoge la llave y encuentra la nota.':
      !includes('note')?'Busca el mensaje que dejó Evelyn.':'Cuatro pruebas reunidas. Próximo destino: plaza de la Lealtad.';
  }
  $('inventory').addEventListener('click',e=>{const b=e.target.closest('[data-item]');if(!b)return;
    const id=b.dataset.item;tell(`${itemTitles[id]} added to the case file.`,`${itemTitles[id]} en el expediente.`);});
  function drawEvidence(){
    ctx.save();ctx.imageSmoothingEnabled=false;
    // The original terrace painting already contains the receipt. A clean
    // tabletop patch replaces its pixels after collection (below).
    if(save.scene==='bistro'){
      if(!includes('note')&&evidenceSprites.note.naturalWidth)ctx.drawImage(evidenceSprites.note,499,550,30,30);
      if(save.flags.keyRevealed&&!includes('key')&&evidenceSprites.key.naturalWidth)ctx.drawImage(evidenceSprites.key,840,472,28,28);
    }
    ctx.restore();
  }
  function drawAtlas(id,x,y,frame,{heightFactor=1,shadow=true,flip=false}={}){
    const img=atlases[id];if(!img?.naturalWidth)return;
    const sw=img.naturalWidth/4,sh=img.naturalHeight/2;
    const h=(save.scene==='terrace'?270:210)*scale(save.scene,y)*heightFactor,w=h*sw/sh;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;
    if(shadow){ctx.fillStyle='#0b12216e';ctx.beginPath();ctx.ellipse(0,0,Math.max(13,w*.24),Math.max(3,4*scale(save.scene,y)),0,0,Math.PI*2);ctx.fill();}
    if(flip)ctx.scale(-1,1);
    ctx.drawImage(img,(frame%4)*sw,Math.floor(frame/4)*sh,sw,sh,-w/2,-h,w,h);
    ctx.restore();
  }
  function drawSteamingCoffee(now){
    if(save.scene!=='terrace')return;
    ctx.save();ctx.strokeStyle='#fff5dc91';ctx.lineWidth=1.6;ctx.lineCap='round';
    for(let i=0;i<3;i++){
      const x=812+i*7,y=475-((now*.025+i*15)%17);
      ctx.globalAlpha=.24+.26*Math.sin(now*.0015+i)**2;
      ctx.beginPath();ctx.moveTo(x,y+7);ctx.bezierCurveTo(x-4,y+2,x+5,y-3,x+1,y-8);ctx.stroke();
    }ctx.restore();
  }
  function drawPerson(role,x,y,{facing=1,walking=false,stride=0,seated=false,heightFactor=1,rise=1,shadow=true}={}){
    const sprite=sprites[seated?'stranger-seated':role];if(!sprite?.naturalWidth)return;
    const h=(save.scene==='terrace'?218:164)*scale(save.scene,y)*heightFactor*(seated?.78:1),w=h*sprite.naturalWidth/sprite.naturalHeight;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;
    if(shadow&&!seated){
      ctx.fillStyle='#08101b73';ctx.beginPath();ctx.ellipse(0,1,Math.max(10,w*.34),Math.max(3,3.3*scale(save.scene,y)),0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#02040b80';ctx.beginPath();ctx.ellipse(0,1,Math.max(6,w*.16),2.3,0,0,Math.PI*2);ctx.fill();
    }
    ctx.scale(facing<0?-1:1,1);
    if(!walking||seated){
      if(rise<1){const exposed=Math.floor(sprite.height*(.66+.34*rise));ctx.drawImage(sprite,0,0,sprite.width,exposed,-w/2,-h*(.72+.28*rise),w,h*(.72+.28*rise));}
      else ctx.drawImage(sprite,-w/2,-h,w,h);
    }else{
      // Leg swing is anchored to the hip. Torso stays fixed; no levitation.
      const split=Math.floor(sprite.height*.74),legH=sprite.height-split,half=Math.floor(sprite.width/2),angle=Math.sin(stride)*.16;
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
  let receiptPatch=null;
  function prepareTerraceLayers(){
    const bg=backdrops.terrace;if(!bg.naturalWidth)return;
    terraceLayers.length=0;
    for(const prop of terraceProps)for(const poly of prop.masks){
      const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);
      const left=Math.max(0,Math.floor(Math.min(...xs))),top=Math.max(0,Math.floor(Math.min(...ys)));
      const width=Math.min(W-left,Math.ceil(Math.max(...xs))-left+2);
      const height=Math.min(H-top,Math.ceil(Math.max(...ys))-top+2);
      if(!width||!height)continue;
      const layer=document.createElement('canvas');layer.width=width;layer.height=height;
      const m=layer.getContext('2d');m.beginPath();
      poly.forEach(([x,y],i)=>i?m.lineTo(x-left,y-top):m.moveTo(x-left,y-top));
      m.closePath();m.clip();m.imageSmoothingEnabled=true;
      m.drawImage(bg,-left,-top,W,H);
      terraceLayers.push({owner:prop.id,depth:prop.depth,canvas:layer,x:left,y:top});
    }
    // A small feathered marble patch removes the ORIGINAL paper after pickup.
    const p=document.createElement('canvas');p.width=77;p.height=56;
    const c=p.getContext('2d',{willReadFrequently:true});
    c.drawImage(bg,-870,-520,W,H);
    const pixels=c.getImageData(0,0,77,56),data=pixels.data;
    for(let y=0;y<56;y++)for(let x=0;x<77;x++){
      const edge=Math.min(x,y,76-x,55-y);
      data[(y*77+x)*4+3]*=Math.min(1,Math.max(0,edge/8));
    }
    c.putImageData(pixels,0,0);
    receiptPatch={canvas:p,x:805,y:520};
  }
  backdrops.terrace.onload=prepareTerraceLayers;
  if(backdrops.terrace.complete&&backdrops.terrace.naturalWidth)prepareTerraceLayers();
  let last=performance.now();
  function tick(now){const dt=Math.min(.045,Math.max(.001,(now-last)/1000));last=now;
    if(intro.active){
      intro.time=(now-intro.start)/1000;
      const t=intro.time;
      const caption=t<2.6?['18:47 · CAFÉ DE ORIENTE','Evelyn lee una servilleta. · A woman. A note.']:
        t<4.1?['ALGO NO ENCAJA','Mira a su alrededor. · Look!']:
        t<7.0?['EVELYN HUYE','Se levanta y echa a correr. · She runs away!']:
        ['UN SEGUNDO DESPUÉS','Llega nuestro agente. · Find the clues!'];
      $('cinematic-title').textContent=caption[0];$('cinematic-caption').textContent=caption[1];
      if(t>=7.2){
        const p=clamp((t-7.2)/2.55,0,1);
        agent.x=lerp(242,305,p);agent.y=lerp(585,594,p);agent.stride+=dt*8;agent.facing=1;agent.moving=p<1;
        terraceWaiter.x=lerp(1112,1090,clamp((t-7.2)/2.55,0,1));
        terraceWaiter.y=lerp(390,403,clamp((t-7.2)/2.55,0,1));
        terraceWaiter.stride+=dt*7.5;
      }
      if(t>=9.85)endIntro();
      draw(now);requestAnimationFrame(tick);return;
    }
    if(save.scene==='terrace'&&terraceWaiter.path.length&&!terraceWaiter.held){
      const dest=terraceWaiter.path[0],dx=dest.x-terraceWaiter.x,dy=dest.y-terraceWaiter.y,d=Math.hypot(dx,dy);
      const step=Math.min(d,109*scale('terrace',terraceWaiter.y)*dt);
      if(!((sqr((terraceWaiter.x+dx/(d||1)*step-agent.x)/36)+sqr((terraceWaiter.y+dy/(d||1)*step-agent.y)/23))<1)){
        if(d){terraceWaiter.x+=dx/d*step;terraceWaiter.y+=dy/d*step;terraceWaiter.stride+=step*.13;
          if(Math.abs(dx)>1)terraceWaiter.facing=dx<0?-1:1;}
        if(d<=step+1.5)terraceWaiter.path.shift();
      }
    }
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
    if(save.scene==='bistro')drawEvidence();
    if(save.scene==='bistro'){
      drawPerson('carmen',174,425,{facing:1,heightFactor:1.03,shadow:false});coverBar();
    }
    const actors=[];
    if(!intro.active||intro.time>=7.2)actors.push({role:save.avatar,x:agent.x,y:agent.y,options:{facing:agent.facing,walking:agent.moving,stride:agent.stride}});
    if(save.scene==='terrace'){
      if(intro.active&&intro.time<7.0){
        const t=intro.time;
        const frame=t<2.3?0:t<3.1?1:t<3.8?2:t<4.35?3:4+(Math.floor((t-4.35)*10)%4);
        const running=t>=4.35;
        const p=clamp((t-4.35)/2.45,0,1);
        actors.push({atlas:'evelyn',x:running?lerp(767,215,p):767,y:running?lerp(476,557,p):476,
          frame,options:{heightFactor:running?1.0:.98,shadow:running,flip:running}});
      }
      if(!intro.active||intro.time>=7.2)actors.push({atlas:'gabriel',x:terraceWaiter.x,y:terraceWaiter.y,
        frame:(intro.active||terraceWaiter.path.length&&!terraceWaiter.held)?1+(Math.floor(terraceWaiter.stride*2)%7):0,
        options:{heightFactor:.90,flip:terraceWaiter.facing<0}});
    }
    if(save.scene==='bistro'){
      const standing=guestMode!=='seated';
      actors.push({role:'stranger',x:guestX,y:guestY,options:{facing:-1,seated:!standing,rise:standing?clamp((now-guestChangeAt)/870,0,1):1}});
      actors.push({atlas:'gabriel',x:waiter.x,y:waiter.y,frame:waiter.held<now?1+(Math.floor(waiter.stride*2)%7):0,
        options:{heightFactor:.76,flip:waiter.facing<0}});
    }
    if(save.scene==='terrace'){
      // Original pixels re-render above actors only where the corresponding
      // furniture sits closer to the camera than EACH actor's feet. Actors
      // do not fade, never pass through chairs, and keep their true scale.
      const depthOrder=[...actors.map(a=>({...a,depth:a.y})),...terraceLayers.map(a=>({...a,isLayer:true}))];
      depthOrder.sort((a,b)=>a.depth-b.depth).forEach(a=>{
        if(a.isLayer)ctx.drawImage(a.canvas,a.x,a.y);
        else if(a.atlas)drawAtlas(a.atlas,a.x,a.y,a.frame,a.options);
        else drawPerson(a.role,a.x,a.y,a.options);
      });
      if(includes('receipt')&&receiptPatch)
        ctx.drawImage(receiptPatch.canvas,receiptPatch.x,receiptPatch.y);
      if((!intro.active||intro.time>=3.75)&&!includes('napkin')&&evidenceSprites.napkin.naturalWidth)
        ctx.drawImage(evidenceSprites.napkin,900,511,62,43);
      drawSteamingCoffee(now);
    }else actors.sort((a,b)=>a.y-b.y).forEach(a=>a.atlas?drawAtlas(a.atlas,a.x,a.y,a.frame,a.options):drawPerson(a.role,a.x,a.y,a.options));
    if(new URLSearchParams(location.search).has('debug')){
      ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#54e697';for(const p of world[save.scene].floors){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();}
      ctx.strokeStyle='#f7779a';for(const p of world[save.scene].blocks){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();}ctx.restore();
    }
  }
  window.ENGLISH_SPY_REBUILD_QA={world,walkable,route,agent,save,activeTargets};
  if(new URLSearchParams(location.search).has('debug')){
    document.body.dataset.navigationQa=JSON.stringify({
      terrace:{start:walkable('terrace',305,594),goal:walkable('terrace',540,592),route:route('terrace',{x:305,y:594},{x:540,y:592})},
      bistro:{start:walkable('bistro',1090,572),goal:walkable('bistro',821,520),route:route('bistro',{x:1090,y:572},{x:821,y:520})},
      targets:Object.fromEntries(Object.entries(world).map(([scene,data])=>[
        scene,data.targets.filter(t=>!t.dynamic).map(t=>{
          const destination=Array.isArray(t.walk)?{x:t.walk[0],y:t.walk[1]}:t.walk;
          return {id:t.id,foot:walkable(scene,destination.x,destination.y),reachable:route(scene,data.spawn,destination,false).length>0};
        })
      ]))
    });
  }
  $('scene-name').textContent=world[save.scene].title;
  if(intro.active)startIntro();
  else refresh();
  requestAnimationFrame(tick);
})();
