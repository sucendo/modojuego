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
      image:'./assets/terrace-pixel.webp',name:'PLAZA DE ORIENTE · CAFÉ DE ORIENTE · 18:47',spawn:[290,590],
      perspective:{farY:405,nearY:655,farScale:.62,nearScale:1.62},
      actors:[{role:'stranger',x:380,y:477}],
      // Each accessible corridor is deliberately separate from the foreground furniture.
      corridors:[
        [235,525,615,655], // Plaza-side pavement
        [565,410,1120,515], // Café-side terrace aisle
        [565,492,625,572], // Narrow connector at the corner of the planter
        [235,482,425,570],
      ],
      blocked:[
        [[420,430],[549,425],[562,541],[428,543]], // Tree planter
        [[637,544],[1030,539],[1064,670],[625,670]], // Front edge of the round table; rear aisle stays open
        [[1005,520],[1200,485],[1200,675],[1058,675]], // Large near chair
        [[668,432],[785,418],[799,480],[671,493]], // Middle terrace tables
        [[830,426],[960,414],[985,481],[830,489]],
        [[918,393],[1042,389],[1047,489],[917,491]], // Flower box beside the café door
      ],
      foreground:[
        {depth:525,poly:[[422,430],[452,376],[519,378],[556,414],[566,539],[434,543]]},
        {depth:548,poly:[[900,405],[941,364],[1038,374],[1064,417],[1064,526],[912,534]]},
        {depth:640,poly:[[0,430],[155,426],[230,485],[227,675],[0,675]]},
        // The table is in front of visitors in the back aisle, but beside or
        // behind visitors standing at its edge. Its old depth (652) erased
        // whole torsos even when their feet were on the near-side pavement.
        {depth:565,poly:[[541,561],[565,515],[635,496],[955,489],[1034,522],[1054,571],[1023,601],[957,630],[638,638],[551,606]]},
        {depth:663,poly:[[978,460],[1048,412],[1200,428],[1200,675],[1025,675]]},
      ],
      hotspots:[
        {id:'receipt',x:840,y:545,w:86,h:60,walk:[580,595],label:'Folded receipt'},
        {id:'cup',x:825,y:498,w:66,h:57,walk:[592,511],label:'Coffee cup'},
        {id:'stranger',x:380,y:410,w:72,h:122,walk:[325,492],label:'Man in grey'},
        {id:'palace',x:466,y:277,w:490,h:148,walk:[330,550],label:'Royal Palace'},
        {id:'door',x:1111,y:327,w:105,h:205,walk:[1100,456],label:'Enter the café'},
      ],
    },
    interior:{
      image:'./assets/interior-pixel.webp',name:'CAFÉ DE ORIENTE · SALÓN · 18:52',spawn:[1010,575],
      perspective:{farY:390,nearY:660,farScale:.62,nearScale:1.57},
      actors:[{role:'carmen',x:418,y:582}],
      corridors:[
        [445,397,1110,490], // Behind the main table
        [440,470,540,646], // Reception-side aisle
        [834,465,1120,646], // Door-side aisle
        [516,452,882,505], // Back edge of table, connecting both aisles
      ],
      blocked:[
        [[525,508],[832,496],[859,670],[488,672]], // Main table and chairs
        [[0,490],[433,470],[448,675],[0,675]], // Reception desk
        [[1052,475],[1200,463],[1200,675],[1084,675]], // Serving trolley
      ],
      foreground:[
        {depth:635,poly:[[0,531],[345,508],[441,542],[462,675],[0,675]]},
        {depth:564,poly:[[435,501],[472,456],[563,424],[747,430],[835,473],[852,624],[810,675],[480,675]]},
        {depth:660,poly:[[1048,378],[1179,376],[1200,603],[1118,649],[1051,621]]},
      ],
      hotspots:[
        {id:'carmen',x:419,y:503,w:92,h:152,walk:[462,617],label:'Speak with Carmen'},
        {id:'table',x:637,y:532,w:230,h:145,walk:[866,574],label:'Look under the table'},
        {id:'window',x:1005,y:306,w:150,h:145,walk:[970,510],label:'Window by the plaza'},
        {id:'note',x:1015,y:529,w:65,h:61,walk:[960,564],label:'Folded paper'},
        {id:'menu',x:654,y:415,w:72,h:75,walk:[863,518],label:'Restaurant menu'},
        {id:'exit',x:1043,y:321,w:113,h:138,walk:[1036,478],label:'Return to the terrace'},
      ],
    },
  };
  const DEFAULT_AVATAR={style:'agent-m',coat:'classic',codename:'Agente Madrid'};
  const init = () => ({started:false,scene:'terrace',level:'starter',help:true,audio:true,inventory:[],clues:[],talked:[],flags:{},complete:false,avatar:{...DEFAULT_AVATAR}});
  function readSave(){
    try {
      const s=JSON.parse(localStorage.getItem(SAVE));
      if(!s || !SCENES[s.scene] || !Array.isArray(s.inventory))return init();
      return {...init(),...s,avatar:{...DEFAULT_AVATAR,...s.avatar},flags:{...s.flags},talked:Array.isArray(s.talked)?s.talked:[],clues:Array.isArray(s.clues)?s.clues:[]};
    } catch{return init();}
  }
  let state=readSave();
  let verb='smart', selectedItem=null, dialog=null, noticeTimer=null;
  let actor={x:SCENES[state.scene].spawn[0],y:SCENES[state.scene].spawn[1],facing:1,step:0};
  let path=[], pending=null, time=0, lastFrame=performance.now();
  let customizationDraft=null, gabrielHeldUntil=0, gabrielHeldPosition=null;
  let patrolPausedAt=null, patrolPausedDuration=0;
  const scenes={},surfacePatches={};
  const spriteImages={}, coatSprites=new Map(), foregrounds={};
  const spriteNames=['agent-m','agent-f','gabriel','carmen','stranger'];
  for(const role of spriteNames){
    const img=new Image();img.src='./assets/characters/'+role+'.webp';
    img.onload=()=>{if(role===state.avatar.style)drawAvatarPreview();};
    spriteImages[role]=img;
  }
  // Foreground cutouts reuse the very same illustrated background pixels. Nothing
  // is repainted: tables, plants and the reception desk can occlude the agents.
  function prepareForegrounds(id){
    const bg=scenes[id],layers=SCENES[id].foreground;
    if(!bg?.naturalWidth)return;
    foregrounds[id]=layers.map(layer=>{
      const xs=layer.poly.map(p=>p[0]),ys=layer.poly.map(p=>p[1]);
      const left=Math.max(0,Math.floor(Math.min(...xs))),top=Math.max(0,Math.floor(Math.min(...ys)));
      const width=Math.min(W-left,Math.ceil(Math.max(...xs))-left+2);
      const height=Math.min(H-top,Math.ceil(Math.max(...ys))-top+2);
      const mask=document.createElement('canvas');mask.width=width;mask.height=height;
      const m=mask.getContext('2d');m.beginPath();
      layer.poly.forEach(([x,y],i)=>i?m.lineTo(x-left,y-top):m.moveTo(x-left,y-top));m.closePath();m.clip();
      m.imageSmoothingEnabled=true;m.drawImage(bg,-left,-top,W,H);
      return {depth:layer.depth,x:left,y:top,canvas:mask};
    });
  }
  // The original illustration already contains the receipt. The restoration
  // patch copies a nearby marble area once and feathers its edges so picking
  // the receipt actually removes it, without repainting the whole café.
  function makeSurfacePatch(bg,{x,y,w,h,sampleX,sampleY}){
    const patch=document.createElement('canvas');patch.width=w;patch.height=h;
    const p=patch.getContext('2d',{willReadFrequently:true});
    p.imageSmoothingEnabled=true;p.drawImage(bg,-sampleX,-sampleY,W,H);
    const pixels=p.getImageData(0,0,w,h),a=pixels.data,feather=8;
    for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
      const edge=Math.min(xx,yy,w-1-xx,h-1-yy);
      a[(yy*w+xx)*4+3]*=Math.min(1,Math.max(0,edge/feather));
    }
    p.putImageData(pixels,0,0);
    return {x,y,canvas:patch};
  }
  for(const [id,scene] of Object.entries(SCENES)){
    scenes[id]=new Image();scenes[id].onload=()=>{
      prepareForegrounds(id);
      if(id==='terrace')surfacePatches.receipt=makeSurfacePatch(scenes[id],
        {x:805,y:520,w:77,h:56,sampleX:870,sampleY:520});
    };scenes[id].src=scene.image;
  }
  const mix=(a,b,t)=>a+(b-a)*Math.min(1,Math.max(0,t));
  const perspectiveScale=(scene,y,x=0)=>{
    const p=SCENES[scene].perspective;
    const depth=mix(p.farScale,p.nearScale,(y-p.farY)/(p.nearY-p.farY));
    // The terrace doorway is raised relative to the plaza. World depth here
    // depends on BOTH screen coordinates; Y alone made people tiny at the door.
    if(scene==='terrace'){
      const facade=Math.min(1,Math.max(0,(x-940)/170));
      const close=Math.min(1,Math.max(0,(640-y)/130));
      return depth+.42*facade*close;
    }
    return depth;
  };
  // Perspective has a hand-authored scale at the café threshold: its raised
  // doorway is nearer the camera than the terrace aisle at the same screen Y.
  // Each stop lasts several seconds; the waiter actually walks between stops.
  const GABRIEL_STOPS=[
    {t:0, scene:'terrace', x:832,y:439,scale:.81,alpha:1},
    {t:3, scene:'terrace', x:832,y:439,scale:.81,alpha:1},
    {t:7, scene:'terrace', x:921,y:434,scale:.92,alpha:1},
    {t:9, scene:'terrace', x:921,y:434,scale:.92,alpha:1},
    {t:14,scene:'terrace', x:1067,y:458,scale:1.25,alpha:1},
    {t:17,scene:'terrace', x:1117,y:459,scale:1.44,alpha:0},
    {t:17.001,scene:'interior', x:1080,y:486,scale:1.42,alpha:0},
    {t:20,scene:'interior', x:1018,y:511,scale:1.31,alpha:1},
    {t:24,scene:'interior', x:927,y:534,scale:1.18,alpha:1},
    {t:28,scene:'interior', x:927,y:534,scale:1.18,alpha:1},
    {t:32,scene:'interior', x:1018,y:511,scale:1.31,alpha:1},
    {t:35,scene:'interior', x:1080,y:486,scale:1.42,alpha:0},
    {t:35.001,scene:'terrace', x:1117,y:459,scale:1.44,alpha:0},
    {t:38,scene:'terrace', x:1067,y:458,scale:1.25,alpha:1},
    {t:42,scene:'terrace', x:921,y:434,scale:.92,alpha:1},
    {t:46,scene:'terrace', x:832,y:439,scale:.81,alpha:1},
    {t:49,scene:'terrace', x:832,y:439,scale:.81,alpha:1},
  ];
  // Walking phase follows metres travelled, not the frame clock; idle characters
  // therefore stop moving their feet and resume without a sudden animation jump.
  let patrolDistance=0;
  for(let i=1;i<GABRIEL_STOPS.length;i++){
    const a=GABRIEL_STOPS[i-1],b=GABRIEL_STOPS[i];
    patrolDistance+=a.scene===b.scene?Math.hypot(b.x-a.x,b.y-a.y):0;
    b.walkDistance=patrolDistance;
  }
  GABRIEL_STOPS[0].walkDistance=0;
  const PATROL_DURATION=GABRIEL_STOPS.at(-1).t;
  function gabrielAt(now=performance.now()){
    if(patrolPausedAt!==null&&gabrielHeldPosition)
      return {...gabrielHeldPosition,walking:false};
    const phase=((now-patrolOrigin-patrolPausedDuration)/1000)%PATROL_DURATION;
    let i=0;
    while(i<GABRIEL_STOPS.length-2&&GABRIEL_STOPS[i+1].t<=phase)i++;
    const a=GABRIEL_STOPS[i],b=GABRIEL_STOPS[i+1],duration=b.t-a.t;
    const progress=duration>0?(phase-a.t)/duration:0;
    // Gently accelerate/decelerate, without the abrupt reversals of v0.4.
    const p=Math.max(0,Math.min(1,progress-Math.sin(2*Math.PI*progress)/(2*Math.PI)));
    const distance=Math.hypot(b.x-a.x,b.y-a.y);
    const walking=a.scene===b.scene&&distance>2;
    return {role:'gabriel',scene:a.scene,x:mix(a.x,b.x,p),y:mix(a.y,b.y,p),
      scale:mix(a.scale,b.scale,p),alpha:mix(a.alpha,b.alpha,p),walking,
      facing:walking&&Math.abs(b.x-a.x)>4?(b.x<a.x?-1:1):(i<9?-1:1),
      step:(a.walkDistance+(walking?distance*p:0))*.1};
  }
  function holdGabriel(now){
    if(patrolPausedAt===null){gabrielHeldPosition=gabrielAt(now);patrolPausedAt=now;}
    gabrielHeldUntil=now+18000;
  }
  function releaseGabriel(now){
    if(patrolPausedAt===null)return;
    patrolPausedDuration+=now-patrolPausedAt;
    patrolPausedAt=null;gabrielHeldPosition=null;
  }
  const patrolOrigin=performance.now();
  function coatImage(role,coat){
    const original=spriteImages[role];if(!original?.complete||!original.naturalWidth)return null;
    if(coat==='classic'||!role.startsWith('agent-'))return original;
    const key=role+':'+coat;if(coatSprites.has(key))return coatSprites.get(key);
    const palette={navy:[47,67,91],olive:[100,103,65],charcoal:[72,78,82]};
    const target=palette[coat];if(!target)return original;
    const off=document.createElement('canvas');off.width=original.width;off.height=original.height;
    const o=off.getContext('2d',{willReadFrequently:true});o.drawImage(original,0,0);
    const data=o.getImageData(0,0,off.width,off.height),a=data.data;
    for(let y=0;y<off.height;y++){
      if(y<off.height*.13||y>off.height*.76)continue;
      for(let x=0;x<off.width;x++){
        const i=(y*off.width+x)*4,r=a[i],g=a[i+1],b=a[i+2];
        const coatColor=a[i+3]>100&&r>g*1.045&&g>b*.96&&r>48&&g>24&&b<r*.67;
        if(!coatColor)continue;
        const luminance=(r*.24+g*.55+b*.21)/95;
        for(let k=0;k<3;k++)a[i+k]=Math.max(0,Math.min(255,a[i+k]*.12+target[k]*luminance*.88));
      }
    }
    o.putImageData(data,0,0);coatSprites.set(key,off);return off;
  }
  function drawAvatarPreview(){
    const canvas=$('agent-preview');if(!canvas)return;
    const p=canvas.getContext('2d');p.clearRect(0,0,canvas.width,canvas.height);
    const v=customizationDraft||state.avatar,img=coatImage(v.style,v.coat);
    if(!img)return;
    const h=220,w=h*img.width/img.height;
    p.imageSmoothingEnabled=false;p.drawImage(img,(canvas.width-w)/2,11,w,h);
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
    const profile=$('[data-ui="customize"]');
    if(profile)profile.title='Personalizar a '+state.avatar.codename;
    renderHotspots();
  }
  const LABEL_ES={
    receipt:'Examinar y recoger',cup:'Examinar la taza',gabriel:'Hablar con el camarero',
    stranger:'Interrogar',palace:'Observar el Palacio Real',door:'Entrar al café',
    carmen:'Hablar con Carmen',table:'Buscar debajo',window:'Examinar la ventana',
    note:'Recoger el papel',menu:'Leer el menú',exit:'Volver a la terraza'
  };
  function liveHotspot(id){
    if(id!=='gabriel')return SCENES[state.scene].hotspots.find(h=>h.id===id);
    const g=gabrielForInteraction();if(!g)return null;
    const height=123*g.scale,width=Math.max(55,height*.58);
    // CSS centres every hotspot with translate(-50%, -50%). Keep the hit area
    // centred over the actual sprite, including while perspective changes.
    return {id:'gabriel',x:g.x,y:g.y-height*.52,w:width,h:height,
      walk:g.scene==='terrace'?(g.x>970?[1067,492]:[607,491]):[919,565],
      label:'Talk to Gabriel'};
  }
  function gabrielForInteraction(){
    const g=gabrielAt();
    return g.scene===state.scene&&g.alpha>.34?g:null;
  }
  function allHotspots(){return [...SCENES[state.scene].hotspots,{id:'gabriel',x:0,y:0,w:85,h:135,label:'Talk to Gabriel'}];}
  function renderHotspots(){
    hotspotsNode.innerHTML=allHotspots().filter(base=>
      !(base.id==='receipt'&&has('receipt'))&&!(base.id==='note'&&has('note'))
    ).map(base=>{
      const h=liveHotspot(base.id)||base,visible=base.id!=='gabriel'||Boolean(liveHotspot('gabriel'));
      const acquired=(h.id==='receipt'&&has('receipt'))||(h.id==='table'&&has('key'))||(h.id==='note'&&has('note'));
      const translation=state.help?' · '+LABEL_ES[h.id]:'';
      return `<button class="hotspot ${acquired?'revealed':''}" ${visible?'':'hidden'} data-hotspot="${h.id}" style="left:${(h.x/W*100).toFixed(2)}%;top:${(h.y/H*100).toFixed(2)}%;--hit-width:${(h.w/W*100).toFixed(2)}%;--hit-height:${(h.h/H*100).toFixed(2)}%" aria-label="${esc(h.label)}" title="${esc(h.label+translation)}"><span class="hotspot-label">${esc(h.label+translation)}</span></button>`;
    }).join('');
  }
  function trackGabriel(g){
    const el=hotspotsNode.querySelector('[data-hotspot="gabriel"]');
    if(!el)return;
    const visible=g.scene===state.scene&&g.alpha>.34;el.hidden=!visible;
    if(visible){
      const height=123*g.scale,width=Math.max(55,height*.58);
      el.style.left=g.x/W*100+'%';el.style.top=(g.y-height*.52)/H*100+'%';
      el.style.setProperty('--hit-width',width/W*100+'%');
      el.style.setProperty('--hit-height',height/H*100+'%');
    }
  }
  function switchScene(id,arrival=null,walkOut=null){
    if(!SCENES[id])return;
    state.scene=id;state.flags.visitedInterior ||= id==='interior';
    actor={x:(arrival||SCENES[id].spawn)[0],y:(arrival||SCENES[id].spawn)[1],facing:id==='interior'?-1:1,step:0};
    path=[];pending=null;selectedItem=null;dialog=null;dialogNode.innerHTML='';
    $('scene-caption').textContent=SCENES[id].name;
    save();renderUI();
    sceneShell.classList.remove('scene-flash');void sceneShell.offsetWidth;sceneShell.classList.add('scene-flash');
    // A doorway has two sides. Enter just across the threshold and physically
    // walk out into the room, rather than teleporting to the middle of it.
    if(walkOut)walkTo(...walkOut);
  }
  function polygonContains(x,y,points){
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const [xi,yi]=points[i],[xj,yj]=points[j];
      if(((yi>y)!==(yj>y)) && x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
    }
    return inside;
  }
  function walkable(scene,x,y){
    const data=SCENES[scene];
    return data.corridors.some(([l,t,r,b])=>x>=l&&x<=r&&y>=t&&y<=b)
      && !data.blocked.some(poly=>polygonContains(x,y,poly));
  }
  const GRID=20,COLS=Math.ceil(W/GRID),ROWS=Math.ceil(H/GRID);
  const cellPoint=i=>({x:(i%COLS)*GRID+GRID/2,y:Math.floor(i/COLS)*GRID+GRID/2});
  function closestWalkable(scene,x,y){
    if(walkable(scene,x,y))return {x,y};
    let best=null,dist=Infinity;
    for(let i=0;i<COLS*ROWS;i++){
      const p=cellPoint(i);if(!walkable(scene,p.x,p.y))continue;
      const d=(p.x-x)**2+(p.y-y)**2;
      if(d<dist){dist=d;best=p;}
    }
    return best;
  }
  function lineClear(scene,a,b){
    const distance=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(distance/8));
    for(let i=0;i<=n;i++){const t=i/n;if(!walkable(scene,mix(a.x,b.x,t),mix(a.y,b.y,t)))return false;}
    return true;
  }
  function routeTo(scene,start,end){
    const first=closestWalkable(scene,start.x,start.y),last=closestWalkable(scene,end.x,end.y);
    if(!first||!last)return null;
    if(lineClear(scene,first,last))return [last];
    const valid=new Uint8Array(COLS*ROWS),g=new Float64Array(COLS*ROWS),came=new Int32Array(COLS*ROWS);
    g.fill(Infinity);came.fill(-1);
    for(let i=0;i<valid.length;i++){const p=cellPoint(i);valid[i]=Number(walkable(scene,p.x,p.y));}
    const nearestIndex=p=>{
      let best=-1,dist=Infinity;
      for(let i=0;i<valid.length;i++){if(!valid[i])continue;const q=cellPoint(i),d=(p.x-q.x)**2+(p.y-q.y)**2;if(d<dist){dist=d;best=i;}}
      return best;
    };
    const origin=nearestIndex(first),goal=nearestIndex(last);if(origin<0||goal<0)return null;
    const open=[origin],visited=new Uint8Array(valid.length);g[origin]=0;
    while(open.length){
      let k=0,score=Infinity;
      for(let i=0;i<open.length;i++){const p=cellPoint(open[i]),heur=Math.hypot(p.x-last.x,p.y-last.y),s=g[open[i]]+heur;if(s<score){score=s;k=i;}}
      const current=open.splice(k,1)[0];if(current===goal)break;
      if(visited[current])continue;visited[current]=1;
      const cx=current%COLS,cy=Math.floor(current/COLS);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;
        const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=COLS||ny>=ROWS)continue;
        const idx=ny*COLS+nx;if(!valid[idx]||visited[idx])continue;
        if(dx&&dy&&(!valid[cy*COLS+nx]||!valid[ny*COLS+cx]))continue;
        const cost=g[current]+Math.hypot(dx,dy)*GRID;
        if(cost<g[idx]){g[idx]=cost;came[idx]=current;if(!open.includes(idx))open.push(idx);}
      }
    }
    if(!Number.isFinite(g[goal]))return null;
    const tiles=[];let node=goal;
    while(node!==-1){tiles.push(cellPoint(node));node=came[node];}
    tiles.reverse();
    const chain=[first,...tiles,last],smooth=[];
    for(let i=0;i<chain.length-1;){
      let furthest=i+1;
      for(let j=chain.length-1;j>i+1;j--){if(lineClear(scene,chain[i],chain[j])){furthest=j;break;}}
      smooth.push(chain[furthest]);i=furthest;
    }
    return smooth;
  }
  function walkTo(x,y,callback=null){
    const next=routeTo(state.scene,{x:actor.x,y:actor.y},{x,y});
    if(!next?.length){notify('I cannot walk through the furniture.','Busca el pasillo libre.');return;}
    path=next;pending=callback;
  }
  function approachPerson(h){
    if(h.id!=='gabriel')return h.walk;
    const g=gabrielHeldPosition||gabrielAt();
    const offsets=[[-65,10],[65,10],[-48,-20],[48,-20],[-85,29],[85,29],[-40,52],[40,52],[-95,63],[95,63]];
    let best=null,score=Infinity;
    for(const [dx,dy] of offsets){
      const x=g.x+dx,y=g.y+dy;
      if(!walkable(state.scene,x,y))continue;
      const route=routeTo(state.scene,{x:actor.x,y:actor.y},{x,y});
      if(!route?.length)continue;
      // A conversation happens at similar ground depth, facing one another.
      // Only compromise on depth when a table separates the two characters.
      const s=Math.abs(dy)*3+Math.abs(Math.hypot(dx,dy)-70)*.8+Math.hypot(x-actor.x,y-actor.y)*.09;
      if(s<score){score=s;best=[x,y];}
    }
    return best||h.walk;
  }
  function facePartner(id){
    const person=id==='gabriel'?(gabrielHeldPosition||gabrielAt()):SCENES[state.scene].actors.find(a=>a.role===id);
    if(!person)return;
    actor.facing=actor.x<person.x?1:-1;
    if(id==='gabriel'&&gabrielHeldPosition)gabrielHeldPosition.facing=actor.x<person.x?-1:1;
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
      case 'door':switchScene('interior',[1032,477],[992,555]);notify('Inside the Café de Oriente.','Has entrado al salón.');break;
      case 'exit':switchScene('terrace',[1108,410],[1093,443]);notify('Back on the terrace.','Has regresado a la terraza.');break;
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
    facePartner(id);
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
    dialogNode.dataset.mode=CONVERSATIONS[dialog.id]?'conversation':'case';
    dialogNode.dataset.side=['carmen','stranger'].includes(dialog.id)?'right':'left';
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
  function closeDialogue(){
    if(dialog?.id==='gabriel')gabrielHeldUntil=performance.now()+2000;
    dialog=null;dialogNode.innerHTML='';delete dialogNode.dataset.mode;
  }
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
  function drawSceneObjects(){
    if(state.scene==='interior'&&!has('note')){
      // The note is a real scene prop, not just an invisible click target.
      ctx.save();ctx.translate(1016,529);ctx.rotate(-.15);
      ctx.fillStyle='#10152699';ctx.fillRect(-15,-6,32,20);
      ctx.fillStyle='#e2c69b';ctx.fillRect(-16,-10,29,17);
      ctx.fillStyle='#fff0c9';ctx.fillRect(-13,-11,26,15);
      ctx.fillStyle='#a17b54';ctx.fillRect(-8,-6,15,1);ctx.fillRect(-8,-2,18,1);
      ctx.fillStyle='#c1a179';ctx.fillRect(-5,3,12,1);
      ctx.restore();
    }
  }
  function drawCollectedPatches(){
    if(state.scene==='terrace'&&has('receipt')&&surfacePatches.receipt){
      const p=surfacePatches.receipt;ctx.drawImage(p.canvas,p.x,p.y);
    }
  }
  function drawPerson({role,x,y,walking=false,facing=1,step=0,scale=null,alpha=1}, now){
    const img=role==='agent'?coatImage(state.avatar.style,state.avatar.coat):spriteImages[role];
    if(!img?.naturalWidth && !img?.width)return;
    const depth=scale??perspectiveScale(state.scene,y,x);
    const height=(role==='carmen'?116:123)*depth,width=height*img.width/img.height;
    const stride=walking?Math.sin(step)*3.2*depth:0;
    const bob=walking?Math.abs(Math.sin(step))*1.7*depth:Math.sin(now*.0021+x)*.35;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
    ctx.fillStyle='#06080fa0';ctx.beginPath();ctx.ellipse(0,1,Math.max(13,width*.47),4.5,0,0,Math.PI*2);ctx.fill();
    ctx.scale(facing<0?-.95:.95,1);ctx.translate(walking?Math.sin(step*.5)*depth:0,-bob);ctx.imageSmoothingEnabled=false;
    if(walking){
      const split=Math.round(img.height*.765),remaining=img.height-split,half=Math.floor(img.width/2);
      ctx.drawImage(img,0,0,img.width,split,-width/2,-height,width,height*split/img.height);
      ctx.drawImage(img,0,split,half,remaining,-width/2+stride,-height*remaining/img.height,width*half/img.width,height*remaining/img.height);
      ctx.drawImage(img,half,split,img.width-half,remaining,-width/2+width*half/img.width-stride,-height*remaining/img.height,width*(img.width-half)/img.width,height*remaining/img.height);
    } else ctx.drawImage(img,-width/2,-height,width,height);
    ctx.restore();
  }
  function frame(now){
    // Keep walking responsive even on browsers that render the canvas at a low frame rate.
    const dt=Math.min(.13,(now-lastFrame)/1000||.016);lastFrame=now;time+=dt;
    if(patrolPausedAt!==null && now>=gabrielHeldUntil && dialog?.id!=='gabriel')releaseGabriel(now);
    if(path.length){
      const next=path[0],dx=next.x-actor.x,dy=next.y-actor.y,dist=Math.hypot(dx,dy);
      const step=Math.min(dist,175*perspectiveScale(state.scene,actor.y,actor.x)*dt);
      if(dist>0){actor.x+=dx/dist*step;actor.y+=dy/dist*step;if(Math.abs(dx)>2)actor.facing=dx<0?-1:1;actor.step+=step*.1;}
      if(dist<=step+1.5){actor.x=next.x;actor.y=next.y;path.shift();if(!path.length&&pending){const action=pending;pending=null;action();}}
    }
    ctx.clearRect(0,0,W,H);
    const bg=scenes[state.scene];
    if(bg.complete&&bg.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.drawImage(bg,0,0,W,H);}
    else{ctx.fillStyle='#172b40';ctx.fillRect(0,0,W,H);}
    ctx.imageSmoothingEnabled=false;
    drawSceneObjects();
    const all=SCENES[state.scene].actors.map(a=>({...a,walking:false,
      facing:dialog?.id===a.role?(actor.x<a.x?-1:1):(a.role==='stranger'?-1:1)}));
    all.push({...actor,role:'agent',walking:path.length>0});
    const gabriel=gabrielAt(now);if(gabriel.scene===state.scene&&gabriel.alpha>.01)all.push(gabriel);
    const elements=[
      ...all.map(person=>({depth:person.y,person})),
      ...(foregrounds[state.scene]||[]).map(layer=>({depth:layer.depth,layer}))
    ].sort((a,b)=>a.depth-b.depth);
    for(const item of elements){
      if(item.person)drawPerson(item.person,now);
      else ctx.drawImage(item.layer.canvas,item.layer.x,item.layer.y);
    }
    drawCollectedPatches();
    trackGabriel(gabriel);
    if(path.length){const p=path[path.length-1];const pulse=Math.sin(time*5)*2;block(p.x-5-pulse,p.y+4,10+pulse*2,2,'#ffe1a8');}
    requestAnimationFrame(frame);
  }
  function openCustomizer(){
    customizationDraft={...state.avatar};
    $('customize-overlay').classList.remove('hidden');
    $('coat-choice').value=customizationDraft.coat;
    $('codename-choice').value=customizationDraft.codename;
    updateCustomizer();
  }
  function updateCustomizer(){
    if(!customizationDraft)return;
    document.querySelectorAll('[data-avatar]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.avatar===customizationDraft.style));
    });
    drawAvatarPreview();
  }
  function closeCustomizer(){
    $('customize-overlay').classList.add('hidden');customizationDraft=null;
  }

  document.addEventListener('click',event=>{
    const ui=event.target.closest('[data-ui]');
    if(ui){
      switch(ui.dataset.ui){
        case 'start':state.started=true;save();renderUI();notify('Evelyn is missing. Follow the clues.','Busca en la terraza y habla con el camarero.');break;
        case 'customize':closeDialogue();openCustomizer();break;
        case 'close-customize':closeCustomizer();break;
        case 'save-avatar':
          if(customizationDraft){
            customizationDraft.codename=$('codename-choice').value.trim().slice(0,22)||DEFAULT_AVATAR.codename;
            state.avatar={...customizationDraft};coatSprites.clear();save();renderUI();closeCustomizer();
            notify('Agent profile updated.','Personaje personalizado y guardado.');
          }
          break;
        case 'help':state.help=!state.help;save();renderUI();renderDialogue();break;
        case 'audio':state.audio=!state.audio;save();if(!state.audio&&'speechSynthesis'in window)window.speechSynthesis.cancel();renderUI();break;
        case 'reset':if(window.confirm('¿Reiniciar solo la demostración pixel art? Tu partida anterior de English Spy no se borrará.')){const avatar={...state.avatar};state=init();state.avatar=avatar;verb='smart';selectedItem=null;switchScene('terrace');state.started=false;save();renderUI();}break;
        case 'close-dialog':closeDialogue();break;
        case 'notebook':dialog={id:'notebook'};renderDialogue();break;
      }
      return;
    }
    const avatarChoice=event.target.closest('[data-avatar]');
    if(avatarChoice&&customizationDraft){customizationDraft.style=avatarChoice.dataset.avatar;updateCustomizer();return;}
    if(event.target.closest('[data-topic]')){dialogueReply(event.target.closest('[data-topic]').dataset.topic);return;}
    const inv=event.target.closest('[data-item]');if(inv){clickInventory(inv.dataset.item);return;}
    const verbButton=event.target.closest('[data-verb]');
    if(verbButton){verb=verbButton.dataset.verb;selectedItem=null;renderUI();notify(`Action: ${verbButton.textContent}.`);return;}
    const hs=event.target.closest('[data-hotspot]');
    if(hs && state.started && !dialog){
      const h=liveHotspot(hs.dataset.hotspot);
      if(h){
        if(h.id==='gabriel'){
          holdGabriel(performance.now());
        }
        const approach=['gabriel','stranger','carmen'].includes(h.id)?approachPerson(h):h.walk;
        walkTo(...approach,()=>interact(h));
      }
      return;
    }
  });
  canvas.addEventListener('pointerdown',event=>{
    if(!state.started||dialog)return;
    const rect=canvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width*W,y=(event.clientY-rect.top)/rect.height*H;
    selectedItem=null;walkTo(x,y);renderUI();
  });
  $('english-level').addEventListener('change',event=>{state.level=event.target.value;save();notify('English level updated.','Las conversaciones cambiarán de dificultad.');renderDialogue();});
  $('coat-choice').addEventListener('change',event=>{if(customizationDraft){customizationDraft.coat=event.target.value;updateCustomizer();}});
  $('codename-choice').addEventListener('input',event=>{if(customizationDraft)customizationDraft.codename=event.target.value;});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if(customizationDraft){closeCustomizer();return;}
      closeDialogue();selectedItem=null;verb='smart';renderUI();return;
    }
    if(['1','2','3','4'].includes(event.key)&&!event.target.matches('select,input')){
      verb=['smart','look','talk','take'][Number(event.key)-1];renderUI();
    }
  });
  $('scene-caption').textContent=SCENES[state.scene].name;
  renderUI();requestAnimationFrame(frame);
})();
