/* Where Is Evelyn Blackwood? · A small, self-contained pixel-art adventure prototype.
   This preview uses its own save slot; it does not modify the original game. */
(() => {
  'use strict';
  const W = 1200, H = 675, SAVE = 'evelyn-pixel-prototype-v03';
  const $ = id => document.getElementById(id);
  const canvas = $('world'), ctx = canvas.getContext('2d');
  const sceneShell = $('scene-shell'), hotspotsNode = $('hotspots');
  const dialogNode = $('dialog-layer'), noticeNode = $('scene-message');
  const inventoryNode = $('inventory');
  const EVIDENCE = ['receipt','witness','key','note'];
  const ITEMS = {
    receipt:{icon:'▤',name:'Receipt',es:'Recibo',text:'18:36 · Café de Oriente. “Don’t follow the first ticket.”'},
    key:{icon:'⚿',name:'Brass key',es:'Llave',text:'A small metal tag: Plaza de la Lealtad.'},
    note:{icon:'✉',name:'Folded note',es:'Nota doblada',text:'Handwritten words: “Lealtad, 19:10”.'},
  };
  const SCENES = {
    terrace:{
      image:'./assets/terrace-pixel.webp',name:'PLAZA DE ORIENTE · CAFÉ DE ORIENTE · 18:47',
      spawn:[290,590],
      actors:[{role:'gabriel',x:835,y:492},{role:'stranger',x:380,y:448}],
      hotspots:[
        {id:'receipt',x:841,y:548,walk:[675,535],label:'Folded receipt',icon:'⌕'},
        {id:'cup',x:810,y:500,walk:[655,530],label:'Coffee cup',icon:'◌'},
        {id:'gabriel',x:833,y:442,walk:[758,514],label:'Talk to Gabriel',icon:'◆'},
        {id:'stranger',x:375,y:386,walk:[410,505],label:'Man in grey',icon:'◆'},
        {id:'palace',x:465,y:266,walk:[400,495],label:'Royal Palace',icon:'⌕'},
        {id:'door',x:1110,y:337,walk:[1012,485],label:'Enter the café',icon:'▣'},
      ],
    },
    interior:{
      image:'./assets/interior-pixel.webp',name:'CAFÉ DE ORIENTE · SALÓN · 18:52',
      spawn:[1010,575],
      actors:[{role:'carmen',x:290,y:519},{role:'guest',x:770,y:482}],
      hotspots:[
        {id:'carmen',x:306,y:431,walk:[439,548],label:'Speak with Carmen',icon:'◆'},
        {id:'table',x:638,y:520,walk:[572,565],label:'Look under the table',icon:'⌕'},
        {id:'window',x:1001,y:313,walk:[953,515],label:'Window by the plaza',icon:'⌕'},
        {id:'note',x:1016,y:529,walk:[913,542],label:'Folded paper',icon:'✉'},
        {id:'menu',x:656,y:401,walk:[637,556],label:'Restaurant menu',icon:'▤'},
        {id:'exit',x:1042,y:400,walk:[1005,537],label:'Return to the terrace',icon:'▣'},
      ],
    },
  };
  const init = () => ({started:false,scene:'terrace',level:'starter',help:true,audio:true,inventory:[],clues:[],talked:[],flags:{},complete:false});
  function readSave(){
    try {
      const s=JSON.parse(localStorage.getItem(SAVE));
      if(!s || !SCENES[s.scene] || !Array.isArray(s.inventory))return init();
      return {...init(),...s,flags:{...s.flags},talked:Array.isArray(s.talked)?s.talked:[],clues:Array.isArray(s.clues)?s.clues:[]};
    } catch{return init();}
  }
  let state=readSave();
  let verb='smart', selectedItem=null, dialog=null, noticeTimer=null;
  let actor={x:SCENES[state.scene].spawn[0],y:SCENES[state.scene].spawn[1],facing:1,step:0};
  let path=[], pending=null, time=0, lastFrame=performance.now();
  const scenes={};
  for(const [id,scene] of Object.entries(SCENES)){
    scenes[id]=new Image(); scenes[id].src=scene.image;
  }
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const save=()=>{try{localStorage.setItem(SAVE,JSON.stringify(state));}catch{}};
  const has=id=>state.inventory.includes(id);
  const flagged=id=>Boolean(state.flags[id]);
  const learned=id=>state.clues.includes(id);
  const beginner=()=>['starter','basic'].includes(state.level);

  function remember(id){if(!learned(id)){state.clues.push(id);save();}}
  function collect(id){
    if(has(id))return false;
    state.inventory.push(id);
    if(id!=='note'||!learned(id))remember(id);
    save();renderUI();return true;
  }
  function notify(message,spanish=''){
    const text=state.help && spanish?`${message} · ${spanish}`:message;
    noticeNode.textContent=text;
    noticeNode.classList.add('show');
    clearTimeout(noticeTimer);
    noticeTimer=setTimeout(()=>noticeNode.classList.remove('show'),4400);
    $('status-text').textContent=message.toUpperCase().slice(0,60);
  }
  function speak(text){
    if(!state.audio || !('speechSynthesis' in window))return;
    window.speechSynthesis.cancel();
    const utter=new SpeechSynthesisUtterance(text);
    utter.lang='en-GB';utter.rate=state.level==='starter'?.72:state.level==='basic'?.86:.96;
    const voices=window.speechSynthesis.getVoices();
    utter.voice=voices.find(v=>v.lang==='en-GB')||voices.find(v=>v.lang?.startsWith('en'))||null;
    window.speechSynthesis.speak(utter);
  }
  function objective(){
    if(state.complete)return 'La pista conduce al Hotel Ritz. Próximo capítulo pendiente.';
    if(!has('receipt'))return 'Examina la mesa de la terraza y recoge el recibo.';
    if(!flagged('gabriel'))return 'Pregunta al camarero por la visitante.';
    if(state.scene==='terrace'&&!flagged('visitedInterior'))return 'Entra en el café para buscar más pistas.';
    if(!flagged('carmen'))return 'Habla con Carmen y averigua qué vio.';
    if(!has('key'))return 'Investiga debajo de la mesa del salón.';
    if(!has('note'))return 'Examina el papel junto a la ventana.';
    return 'Combina la llave con la nota doblada en el inventario.';
  }
  function renderUI(){
    $('objective').textContent=objective();
    $('progress-bar').style.width=(state.clues.length/EVIDENCE.length*100)+'%';
    $('case-progress-text').textContent=`${state.clues.length} / ${EVIDENCE.length} pruebas`;
    $('english-level').value=state.level;
    $('help-button').textContent=state.help?'ES ✓':'ES';
    $('help-button').setAttribute('aria-pressed',String(state.help));
    $('audio-button').textContent=state.audio?'🔊':'🔇';
    $('audio-button').setAttribute('aria-pressed',String(state.audio));
    $('intro-overlay').classList.toggle('hidden',state.started);
    document.querySelectorAll('[data-verb]').forEach(b=>b.classList.toggle('active',b.dataset.verb===verb));
    inventoryNode.innerHTML=Object.entries(ITEMS).map(([id,it])=>{
      if(!has(id))return `<div class="inventory-slot empty" title="Sin descubrir"><span>?</span><small>Unknown</small></div>`;
      return `<button class="inventory-slot ${selectedItem===id?'selected':''}" data-item="${id}" aria-pressed="${selectedItem===id}" title="${esc(it.text)}"><span>${it.icon}</span><small>${esc(it.name)}</small></button>`;
    }).join('')+Array.from({length:3},()=>'<div class="inventory-slot empty" aria-hidden="true"><span>·</span></div>').join('');
    renderHotspots();
  }
  function renderHotspots(){
    const hs=SCENES[state.scene].hotspots;
    hotspotsNode.innerHTML=hs.map(h=>{
      const acquired=(h.id==='receipt'&&has('receipt'))||(h.id==='table'&&has('key'))||(h.id==='note'&&has('note'));
      return `<button class="hotspot ${acquired?'revealed':''}" data-hotspot="${h.id}" style="left:${(h.x/W*100).toFixed(2)}%;top:${(h.y/H*100).toFixed(2)}%" aria-label="${esc(h.label)}" title="${esc(h.label)}"><span aria-hidden="true">${acquired?'✓':h.icon}</span><span class="hotspot-label">${esc(h.label)}</span></button>`;
    }).join('');
  }
  function switchScene(id){
    if(!SCENES[id])return;
    state.scene=id;state.flags.visitedInterior ||= id==='interior';
    actor={x:SCENES[id].spawn[0],y:SCENES[id].spawn[1],facing:id==='interior'?-1:1,step:0};
    path=[];pending=null;selectedItem=null;dialog=null;dialogNode.innerHTML='';
    $('scene-caption').textContent=SCENES[id].name;
    save();renderUI();
    sceneShell.classList.remove('scene-flash');void sceneShell.offsetWidth;sceneShell.classList.add('scene-flash');
  }
  function destination(x,y){
    const range=state.scene==='terrace'?{left:78,right:1090,top:450,bottom:635}:{left:165,right:1090,top:469,bottom:630};
    x=Math.min(range.right,Math.max(range.left,x));
    y=Math.min(range.bottom,Math.max(range.top,y));
    if(state.scene==='terrace'&&x>820)y=Math.min(y,540);
    return {x,y};
  }
  function walkTo(x,y,callback=null){
    const dest=destination(x,y);path=[];pending=callback;
    // The terrace has a narrow path in front of its tables. Follow its near edge.
    if(state.scene==='terrace'&&actor.x<620&&dest.x>800){path.push({x:620,y:525},{x:785,y:500});}
    else if(state.scene==='terrace'&&actor.x>810&&dest.x<570){path.push({x:785,y:500},{x:620,y:525});}
    path.push(dest);
  }
  function interact(h){
    if(selectedItem){
      if(selectedItem==='receipt'&&h.id==='gabriel'){
        state.flags.gabriel=true;
        selectedItem=null;save();renderUI();
        notify('Gabriel: “Yes, that receipt is from her table.”','Gabriel reconoce el recibo.');
        speak('Yes, that receipt is from her table.');return;
      }
      notify('That item cannot be used here.','Prueba a combinar objetos en el inventario.');
      selectedItem=null;renderUI();return;
    }
    if(verb==='look')return inspect(h.id);
    if(verb==='talk'&&!['gabriel','stranger','carmen'].includes(h.id)){
      notify('Nobody answers.','Aquí no hay nadie con quien conversar.');return;
    }
    if(verb==='take'&&['gabriel','stranger','carmen','palace','door','exit'].includes(h.id)){
      notify('You cannot pick that up.','No puedes recogerlo.');return;
    }
    switch(h.id){
      case 'receipt':
        if(collect('receipt')){notify('A receipt. The time is 18:36.','Has guardado el recibo.');speak('A receipt. The time is six thirty-six.');}
        else inspect('receipt');break;
      case 'cup':notify('The coffee is cold. Someone left in a hurry.','La taza parece abandonada.');break;
      case 'gabriel':openDialogue('gabriel');break;
      case 'stranger':openDialogue('stranger');break;
      case 'palace':notify('The Royal Palace. This is exactly the meeting place Evelyn described.','El Palacio Real confirma el lugar de la cita.');break;
      case 'door':switchScene('interior');notify('Inside the Café de Oriente.','Has entrado al salón.');break;
      case 'exit':switchScene('terrace');notify('Back on the terrace.','Has regresado a la terraza.');break;
      case 'carmen':openDialogue('carmen');break;
      case 'table':
        if(collect('key')){notify('A brass key! The tag says “Plaza de la Lealtad”.','La llave señala una plaza de Madrid.');speak('A brass key. Plaza de la Lealtad.');}
        else inspect('table');break;
      case 'window':notify('The plaza is quiet. A folded scrap lies beside the curtain.','Hay un papel cerca de la cortina.');break;
      case 'note':
        if(collect('note')){notify('The note reads: “Lealtad — 19:10”.','Has encontrado otra pista escrita.');speak('Lealtad. Seven ten P M.');}
        else inspect('note');break;
      case 'menu':notify('Tea, coffee and juice. Useful words, but this menu is not evidence.','Este menú no parece una pista.');speak('Tea. Coffee. Orange juice.');break;
    }
    if(verb!=='smart'){verb='smart';renderUI();}
  }
  function inspect(id){
    const things={
      receipt:['A folded receipt, printed at 18:36.','Un recibo con una hora y una anotación.'],
      cup:['An unfinished cup of coffee.','Una taza sin terminar.'],
      gabriel:['Gabriel is working on the terrace.','El camarero parece dispuesto a hablar.'],
      stranger:['A man in a grey coat watches the café entrance.','Un desconocido observa la puerta del café.'],
      palace:['The Royal Palace is on the other side of the plaza.','El Palacio Real es reconocible al fondo.'],
      door:['The Café de Oriente entrance.','La entrada del Café de Oriente.'],
      carmen:['Carmen works at the café reception.','Carmen podría haber visto a Evelyn.'],
      table:['One chair is empty. Something shines below the table.','Hay un reflejo metálico debajo de la mesa.'],
      window:['The doors overlook the terrace.','Las puertas miran hacia la terraza.'],
      note:['A piece of paper beside the curtain.','Un papel doblado junto a la cortina.'],
      menu:['The restaurant menu.','La carta del restaurante.'],
      exit:['The glass door leads back to the terrace.','La puerta devuelve a la terraza.'],
    }[id];
    if(things){notify(...things);speak(things[0]);}
  }
  const CONVERSATIONS={
    gabriel:{name:'GABRIEL · CAFÉ STAFF',intro:['Good evening. Can I help you?','Buenas tardes. ¿En qué puedo ayudarle?'],topics:[
      {id:'gabriel',question:'Did you see a British woman?',reply:['Yes. A woman in a dark coat was waiting at a table.','Sí. Una mujer con abrigo oscuro esperaba junto a una mesa.'],advanced:'A woman matching that description sat alone for some time, although I cannot confirm her identity.'},
      {id:'coffee',question:'What did she order?',reply:['Coffee. She left a receipt on the terrace.','Pidió café y dejó un recibo en la terraza.']},
      {id:'leave',question:'When did she leave?',reply:['Before you came. She seemed nervous.','Se marchó antes de que llegaras. Parecía nerviosa.']},
    ]},
    carmen:{name:'CARMEN SOLER · CAFÉ STAFF',intro:['Are you looking for someone? I saw a woman here earlier.','¿Busca a alguien? Antes había aquí una mujer.'],topics:[
      {id:'carmen',question:'Are you sure she was Evelyn?',reply:['I do not know. I never asked her name.','No lo sabe: nunca le preguntó su nombre.'],advanced:'I only recognised the clothing you described; it would be irresponsible to claim I had verified her identity.'},
      {id:'time',question:'When did she leave?',reply:['Before half past six. Her phone rang.','Antes de las 18:30, después de recibir una llamada.']},
      {id:'folder',question:'Did she leave anything?',reply:['There is a folded paper near the window.','Hay un papel doblado cerca de la ventana.']},
    ]},
    stranger:{name:'UNKNOWN VISITOR',intro:['I am just passing through. Why are you asking?','Dice que simplemente está de paso.'],topics:[
      {id:'name',question:'What is your name?',reply:['That is none of your business.','Se niega a dar su nombre.'],advanced:'I do not make a habit of introducing myself to strangers who interrogate me.'},
      {id:'sighting',question:'Did you see a woman leave?',reply:['Maybe. I was looking at my phone.','Dice que estaba mirando el móvil.']},
    ]},
  };
  function openDialogue(id){
    dialog={id,reply:null};renderDialogue();
    speak(CONVERSATIONS[id].intro[0]);
  }
  function dialogueReply(id){
    const data=CONVERSATIONS[dialog?.id];
    const topic=data?.topics.find(t=>t.id===id);
    if(!topic)return;
    dialog.reply=topic;
    if(id==='gabriel'){state.flags.gabriel=true;}
    if(id==='carmen'){state.flags.carmen=true;remember('witness');}
    if(id==='folder'){state.flags.folder=true;}
    if(id==='time'){state.flags.time=true;}
    if(!state.talked.includes(id))state.talked.push(id);
    save();renderUI();renderDialogue();
    speak(!beginner()&&topic.advanced?topic.advanced:topic.reply[0]);
  }
  function renderDialogue(){
    if(!dialog){dialogNode.innerHTML='';return;}
    if(dialog.id==='case-end'){
      dialogNode.innerHTML=`<div class="dialog-panel"><div class="dialog-head"><span>CASE REPORT · NEW DESTINATION</span><button data-ui="close-dialog" aria-label="Cerrar">×</button></div><p class="dialog-text">“Plaza de la Lealtad. 19:10.” The trail leads to the Ritz — but it does not tell us whether Evelyn is safe.</p>${state.help?'<p class="dialog-spanish">La llave y la nota apuntan al Hotel Ritz. Seguimos sin saber si Evelyn está allí o quién está siguiendo sus pasos.</p>':''}<div class="dialog-actions"><button class="dialog-choice primary" data-ui="close-dialog">Continuar explorando Madrid</button><button class="dialog-choice" data-ui="notebook">Examinar el expediente</button></div></div>`;
      return;
    }
    if(dialog.id==='notebook'){
      const lines=[['RECIBO',has('receipt')?'18:36. Un mensaje advierte de una pista engañosa.':'Sin descubrir'],['CAMAREROS',flagged('gabriel')?'Gabriel confirmó la presencia de una visitante.':'Sin declaración'],['CARMEN',flagged('carmen')?'No comprobó la identidad de la mujer.':'Sin declaración'],['LLAVE',has('key')?'Etiqueta: Plaza de la Lealtad.':'Sin descubrir'],['NOTA',has('note')?'Lealtad — 19:10.':'Sin descubrir']];
      dialogNode.innerHTML=`<div class="dialog-panel"><div class="dialog-head"><span>FIELD NOTES / EXPEDIENTE EB–001</span><button data-ui="close-dialog" aria-label="Cerrar">×</button></div><p class="dialog-text">${esc(objective())}</p><div class="dialog-actions">${lines.map(([k,v])=>`<span class="dialog-choice" style="cursor:default"><b>${esc(k)}:</b> ${esc(v)}</span>`).join('')}</div></div>`;
      return;
    }
    const data=CONVERSATIONS[dialog.id];
    if(!data)return;
    const reply=dialog.reply;
    const english=reply?(!beginner()&&reply.advanced?reply.advanced:reply.reply[0]):data.intro[0];
    const spanish=reply?reply.reply[1]:data.intro[1];
    dialogNode.innerHTML=`<div class="dialog-panel"><div class="dialog-head"><span>${esc(data.name)}</span><button data-ui="close-dialog" aria-label="Terminar conversación">×</button></div><p class="dialog-text">“${esc(english)}”</p>${state.help?`<p class="dialog-spanish">${esc(spanish)}</p>`:''}<div class="dialog-actions">${data.topics.map(t=>`<button class="dialog-choice" data-topic="${t.id}">${state.talked.includes(t.id)?'✓ ':''}${esc(t.question)}</button>`).join('')}<button class="dialog-choice" data-ui="close-dialog">Goodbye.</button></div></div>`;
  }
  function closeDialogue(){dialog=null;dialogNode.innerHTML='';}
  function combine(first,second){
    selectedItem=null;renderUI();
    if([first,second].sort().join('+')!=='key+note'){
      notify('Those objects do not fit together.','Prueba otra combinación.');return;
    }
    if(!flagged('gabriel')||!flagged('carmen')){
      notify('The address is useful, but you still need witness statements.','Interroga a Gabriel y Carmen para confirmar la pista.');return;
    }
    if(!state.complete){state.complete=true;save();renderUI();}
    dialog={id:'case-end'};renderDialogue();
    speak('The trail leads to the Ritz.');
  }
  function clickInventory(id){
    if(!has(id))return;
    if(selectedItem&&selectedItem!==id){combine(selectedItem,id);return;}
    selectedItem=selectedItem===id?null:id;
    notify(selectedItem?`Use ${ITEMS[id].name} with another item or a person.`:'Item deselected.',selectedItem?'Selecciona otro objeto para combinar.':'Objeto deseleccionado.');
    renderUI();
  }

  function block(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function drawPerson({role,x,y,walking=false,facing=1,step=0}, now){
    const scale=Math.min(1.23,Math.max(.78,.73+(y-380)*.002));
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale*(facing<0?-1:1),scale);
    const bob=walking?Math.round(Math.abs(Math.sin(step))*2):Math.round(Math.sin(now*.0018+ x)*.6);
    ctx.translate(0,-bob);
    ctx.globalAlpha=.34;ctx.fillStyle='#040b14';ctx.fillRect(-23,1,46,5);ctx.globalAlpha=1;
    const palettes={
      agent:{coat:'#b19a70',dark:'#51402d',trim:'#e3caa0',pants:'#29394a',skin:'#cfa17c',hair:'#312426',hat:'#8b704d'},
      gabriel:{coat:'#f1e5d4',dark:'#263a48',trim:'#ffffff',pants:'#23313b',skin:'#c79b76',hair:'#342524',hat:'#253340'},
      stranger:{coat:'#566278',dark:'#1e2934',trim:'#8292a2',pants:'#222633',skin:'#c28c72',hair:'#20252d',hat:'#343c49'},
      carmen:{coat:'#8e5a52',dark:'#49343b',trim:'#c99d84',pants:'#443c43',skin:'#d7a783',hair:'#352529',hat:'#352529'},
      guest:{coat:'#617c7b',dark:'#233a42',trim:'#9eaca4',pants:'#263844',skin:'#c49d7a',hair:'#3b2a2a',hat:'#405258'},
    }[role]||{};
    const coat=palettes.coat,dark=palettes.dark,skin=palettes.skin;
    const s=walking?Math.round(Math.sin(step)*5):0;
    // Pixel silhouette, separate legs and sleeves. Each change of step is a walking frame.
    block(-10+s,-23,8,22,palettes.pants);block(2-s,-23,8,22,palettes.pants);
    block(-12+s,-3,12,5,'#121820');block(1-s,-3,13,5,'#121820');
    block(-20,-53,40,37,dark);block(-17,-52,34,43,coat);
    block(-12,-51,13,25,palettes.trim);block(1,-51,13,24,dark);
    block(-8,-46,8,23,coat);block(0,-46,8,23,coat);
    block(-18,-22,36,7,dark);block(-17,-22,34,4,coat);
    block(-26,-51,8,27,dark);block(-25,-49,7,24,coat);
    block(18,-51,8,27,dark);block(18,-49,7,24,coat);
    if(role==='gabriel'){block(-10,-51,20,29,'#293d4e');block(-4,-49,8,3,'#f9e7d5');}
    if(role==='carmen'){block(-15,-50,30,11,'#b67667');}
    block(-12,-79,24,26,'#27232a');block(-10,-78,20,23,skin);
    block(-12,-80,24,8,palettes.hair);block(-13,-76,5,11,palettes.hair);
    if(role==='carmen'){block(10,-79,5,30,palettes.hair);block(-15,-79,5,26,palettes.hair);}
    else{block(-18,-83,36,7,palettes.hat);block(-12,-89,24,9,palettes.hat);block(-9,-86,18,3,palettes.trim);}
    block(-6,-67,4,3,'#272b33');block(5,-67,3,3,'#272b33');
    block(-1,-60,5,2,'#9b5a4e');
    if(role==='agent'){block(12,-37,12,15,'#374956');block(13,-37,10,3,'#d6ac67');}
    ctx.restore();
  }
  function frame(now){
    // Keep walking responsive even on browsers that render the canvas at a low frame rate.
    const dt=Math.min(.13,(now-lastFrame)/1000||.016);lastFrame=now;time+=dt;
    if(path.length){
      const next=path[0],dx=next.x-actor.x,dy=next.y-actor.y,dist=Math.hypot(dx,dy),step=Math.min(dist,680*dt);
      if(dist>0){actor.x+=dx/dist*step;actor.y+=dy/dist*step;if(Math.abs(dx)>2)actor.facing=dx<0?-1:1;actor.step+=dt*12;}
      if(dist<=step+1.5){actor.x=next.x;actor.y=next.y;path.shift();if(!path.length&&pending){const action=pending;pending=null;action();}}
    }
    ctx.clearRect(0,0,W,H);
    const bg=scenes[state.scene];
    if(bg.complete&&bg.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.drawImage(bg,0,0,W,H);}
    else{ctx.fillStyle='#172b40';ctx.fillRect(0,0,W,H);}
    ctx.imageSmoothingEnabled=false;
    const all=SCENES[state.scene].actors.map(a=>({...a,walking:false,facing:a.role==='stranger'?-1:1}));
    all.push({...actor,role:'agent',walking:path.length>0});
    all.sort((a,b)=>a.y-b.y);
    for(const a of all)drawPerson(a,now);
    if(path.length){const p=path[path.length-1];const pulse=Math.sin(time*5)*2;block(p.x-5-pulse,p.y+4,10+pulse*2,2,'#ffe1a8');}
    requestAnimationFrame(frame);
  }

  document.addEventListener('click',event=>{
    const ui=event.target.closest('[data-ui]');
    if(ui){
      switch(ui.dataset.ui){
        case 'start':state.started=true;save();renderUI();notify('Evelyn is missing. Follow the clues.','Busca en la terraza y habla con el camarero.');break;
        case 'help':state.help=!state.help;save();renderUI();renderDialogue();break;
        case 'audio':state.audio=!state.audio;save();if(!state.audio&&'speechSynthesis'in window)window.speechSynthesis.cancel();renderUI();break;
        case 'reset':if(window.confirm('¿Reiniciar solo la demostración pixel art? Tu partida anterior de English Spy no se borrará.')){state=init();verb='smart';selectedItem=null;switchScene('terrace');state.started=false;save();renderUI();}break;
        case 'close-dialog':closeDialogue();break;
        case 'notebook':dialog={id:'notebook'};renderDialogue();break;
      }
      return;
    }
    if(event.target.closest('[data-topic]')){dialogueReply(event.target.closest('[data-topic]').dataset.topic);return;}
    const inv=event.target.closest('[data-item]');if(inv){clickInventory(inv.dataset.item);return;}
    const verbButton=event.target.closest('[data-verb]');
    if(verbButton){verb=verbButton.dataset.verb;selectedItem=null;renderUI();notify(`Action: ${verbButton.textContent}.`);return;}
    const hs=event.target.closest('[data-hotspot]');
    if(hs && state.started && !dialog){
      const h=SCENES[state.scene].hotspots.find(v=>v.id===hs.dataset.hotspot);
      if(h)walkTo(...h.walk,()=>interact(h));return;
    }
  });
  canvas.addEventListener('pointerdown',event=>{
    if(!state.started||dialog)return;
    const rect=canvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width*W,y=(event.clientY-rect.top)/rect.height*H;
    selectedItem=null;walkTo(x,y);renderUI();
  });
  $('english-level').addEventListener('change',event=>{state.level=event.target.value;save();notify('English level updated.','Las conversaciones cambiarán de dificultad.');renderDialogue();});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){closeDialogue();selectedItem=null;verb='smart';renderUI();return;}
    if(['1','2','3','4'].includes(event.key)&&!event.target.matches('select,input')){
      verb=['smart','look','talk','take'][Number(event.key)-1];renderUI();
    }
  });
  $('scene-caption').textContent=SCENES[state.scene].name;
  renderUI();requestAnimationFrame(frame);
})();
