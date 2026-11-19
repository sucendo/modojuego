/* Where Is Evelyn Blackwood? · Pixel art, grounded actors and independent scenery. */
(() => {
  'use strict';
  const W = 1200, H = 675, SAVE = 'evelyn-pixel-prototype-v03';
  // Pixel mask faithfully traced from the green marks on the user's image.
  // The strict mask is loaded before this file by walkmap.js.
  const terraceFootMap=(()=>{
    const map=window.ENGLISH_SPY_TERRACE_FOOT_MASK;
    if(!map?.bits||!map.cell||!map.columns||!map.rows)return null;
    const bytes=Uint8Array.from(atob(map.bits),c=>c.charCodeAt(0));
    if(bytes.length*8<map.columns*map.rows)return null;
    return {inside(x,y){
      if(x<0||x>=W||y<0||y>=H)return false;
      const column=Math.floor(x/map.cell),row=Math.floor(y/map.cell);
      if(column>=map.columns||row>=map.rows)return false;
      const bit=row*map.columns+column;
      return Boolean(bytes[bit>>3]&(1<<(bit&7)));
    }};
  })();
  const $ = id => document.getElementById(id);
  const canvas = $('world'), ctx = canvas.getContext('2d');
  const WITNESS_SEAT={x:915,y:456},WITNESS_FOOT={x:962,y:510};
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
      image:'./assets/terrace-clean.webp',name:'PLAZA DE ORIENTE · CAFÉ DE ORIENTE · 18:47',spawn:[290,590],
      foregroundObjects:[
        {id:'foreground-table',src:'./assets/foreground/terrace-table.webp',collectedSrc:'./assets/foreground/terrace-table-collected.webp',sourceCrop:[766,644,1353,941]},
        {id:'foreground-chair',src:'./assets/foreground/terrace-chair.webp',sourceCrop:[1165,559,1594,941]}
      ],
      perspective:{farY:405,nearY:655,farScale:.64,nearScale:2.02,doorway:{x:1095,y:476,rangeX:280,rangeY:180,boost:.26}},
      actors:[],
      // The terrace uses the actual green brush marks from the annotated
      // screenshot (walkmap.js). No approximate rectangles or extra corridors.
      props:[
        {id:'plaza-flowers',foot:[[0,508],[150,500],[231,548],[229,675],[0,675]],
          masks:[{footY:667,poly:[[0,430],[155,426],[230,485],[227,675],[0,675]]}]},
        {id:'planter',foot:[[422,481],[551,477],[562,542],[426,543]],
          masks:[{footY:552,poly:[[422,430],[452,376],[519,378],[556,414],[566,539],[434,543]]}]},
        {id:'terrace-chair-left',foot:[[627,423],[715,412],[730,521],[626,530]],
          masks:[{footY:535,poly:[[625,392],[659,384],[690,385],[721,406],[735,527],[620,531]]}]},
        {id:'terrace-chair-centre',foot:[[727,410],[826,402],[841,512],[723,521]],
          masks:[{footY:524,poly:[[725,378],[768,371],[805,378],[834,401],[847,516],[713,521]]}]},
        {id:'terrace-chair-right',foot:[[833,410],[956,403],[976,516],[831,520]],
          masks:[{footY:527,poly:[[832,379],[872,370],[931,374],[966,397],[981,521],[820,523]]}]},
        {id:'door-planter',foot:[[915,434],[1039,430],[1053,532],[913,536]],
          masks:[{footY:540,poly:[[900,405],[941,364],[1038,374],[1064,417],[1064,526],[912,534]]}]},
        // Each foreground object is a separate cutout. A table is not the
        // chair beside it, and its thin pedestal is not a huge opaque box.
        // The tabletop is elevated: a character may stand on the marked
        // pavement BEHIND it. Block its floor-level pedestal instead.
        {id:'foreground-table',foot:[[703,611],[767,605],[809,618],[817,675],[702,675]],
          masks:[
            {part:'marble-top',footY:627,poly:[[551,542],[569,515],[647,485],[905,477],[957,481],[1031,519],[1052,555],[1044,582],[1012,599],[969,606],[911,607],[643,602],[580,586],[549,567]]},
            {part:'pedestal',footY:677,poly:[[730,587],[778,595],[819,590],[842,675],[713,675]]}
          ]},
        {id:'foreground-chair',foot:[[837,589],[894,579],[1034,578],[1104,602],[1109,675],[840,675]],
          masks:[
            {part:'back-top-rail',footY:671,poly:[[966,418],[978,407],[1008,399],[1097,399],[1128,407],[1142,426],[1132,443],[989,436],[971,448]]},
            {part:'back-left-rail',footY:672,poly:[[964,425],[991,421],[998,547],[982,585],[965,585]]},
            {part:'back-right-rail',footY:673,poly:[[1106,419],[1140,425],[1144,530],[1113,589],[1094,577]]},
            // Only the lattice bars, rather than the empty spaces between
            // them, should cover the person standing behind the chair.
            {part:'lattice-diagonal-1',footY:674,poly:[[983,452],[993,449],[1099,552],[1091,562]]},
            {part:'lattice-diagonal-2',footY:674,poly:[[1005,446],[1015,444],[1118,543],[1110,554]]},
            {part:'lattice-diagonal-3',footY:674,poly:[[1106,450],[1116,454],[998,563],[986,561]]},
            {part:'lattice-diagonal-4',footY:674,poly:[[1080,446],[1090,449],[987,551],[979,545]]},
            {part:'seat',footY:681,poly:[[838,590],[874,580],[992,582],[1084,589],[1105,617],[1083,655],[865,666],[835,641]]},
            {part:'front-legs',footY:685,poly:[[845,630],[878,625],[900,675],[844,675]]},
            {part:'rear-legs',footY:685,poly:[[1060,624],[1097,612],[1115,675],[1064,675]]}
          ]},
      ],
      hotspots:[
        {id:'receipt',x:811,y:522,w:62,h:56,walk:[639,553],label:'Folded receipt'},
        {id:'cup',x:779,y:461,w:100,h:60,walk:[639,553],label:'Coffee cup'},
        {id:'palace',x:466,y:277,w:490,h:148,walk:[330,550],label:'Royal Palace'},
        {id:'door',x:1111,y:327,w:105,h:205,walk:[1110,494],label:'Enter the café'},
      ],
    },
    interior:{
      image:'./assets/interior-clean.webp',name:'CAFÉ DE ORIENTE · SALÓN · 18:52',spawn:[1010,575],
      foregroundObjects:[
        {id:'main-chair-rear',src:'./assets/foreground/interior-chair-rear.webp',sourceCrop:[625,506,746,658]},
        {id:'main-chair-middle',src:'./assets/foreground/interior-chair-middle.webp',sourceCrop:[765,475,896,638]},
        {id:'main-chair-right',src:'./assets/foreground/interior-chair-right.webp',sourceCrop:[1051,512,1169,868]},
        {id:'main-table',src:'./assets/foreground/interior-table.webp',sourceCrop:[724,479,1144,907]},
        {id:'main-chair-near',src:'./assets/foreground/interior-chair-front.webp',sourceCrop:[596,577,898,941]}
      ],
      perspective:{farY:390,nearY:660,farScale:.65,nearScale:1.94,doorway:{x:1022,y:469,rangeX:172,rangeY:185,boost:.08}},
      // Carmen serves the dining room FROM BEHIND the host's counter.
      actors:[{role:'carmen',x:272,y:488}],
      corridors:[
        [343,450,439,645], // Between the reception and the red chair
        [347,361,475,487], // Walk around the reception-side pillar
        [401,402,1040,429], // Narrow floor lane between the two rows of furniture
        [807,361,890,510], // Gap beyond the far dining tables
        [843,455,1048,645], // Main aisle beside the large round table
        [967,379,1092,514], // Door threshold and side of the trolley
      ],
      props:[
        {id:'reception-counter',foot:[[0,478],[328,461],[346,675],[0,675]],
          // The counter ends at x≈345. The old cutout reached x=462 and
          // incorrectly removed the agent and Carmen in the open side aisle.
          masks:[
            {part:'wooden-top',footY:656,poly:[[0,416],[90,397],[311,392],[340,416],[334,478],[0,486]]},
            {part:'counter-front',footY:675,poly:[[0,473],[332,462],[346,675],[0,675]]}
          ]},
        {id:'rear-dining',foot:[[468,459],[736,452],[784,489],[460,497]],
          masks:[
            // Mask only chair seats and legs, not the empty air above them.
            {footY:466,poly:[[455,418],[487,398],[542,399],[563,461],[451,464]]},
            {footY:466,poly:[[653,418],[707,393],[771,400],[785,460],[652,463]]}
          ]},
        {id:'main-table',foot:[[429,482],[506,432],[754,430],[833,487],[864,670],[476,675]],
          masks:[
            {part:'tablecloth-and-objects',footY:665,poly:[[527,436],[550,409],[614,405],[732,405],[786,426],[803,466],[798,579],[775,622],[733,647],[573,642],[546,598]]},
            {part:'table-legs',footY:675,poly:[[552,618],[602,617],[617,675],[548,675]]}
          ]},
        {id:'main-chair-near',foot:[[450,523],[622,507],[652,675],[458,675]],
          masks:[{part:'upholstery-and-legs',footY:676,poly:[[426,464],[445,427],[486,417],[536,430],[560,460],[571,538],[611,566],[637,591],[650,675],[460,675],[450,609]]}]},
        {id:'main-chair-right',foot:[[756,483],[822,455],[848,675],[769,675]],
          masks:[{part:'upholstery-and-legs',footY:676,poly:[[762,412],[784,380],[817,372],[841,395],[848,465],[830,675],[775,675]]}]},
        {id:'serving-trolley',foot:[[1052,444],[1175,445],[1200,628],[1085,653],[1045,553]],
          masks:[
            {part:'upper-tray',footY:601,poly:[[1037,371],[1052,353],[1123,342],[1177,350],[1197,368],[1195,402],[1050,410]]},
            {part:'frame-and-shelves',footY:666,poly:[[1047,398],[1081,402],[1086,587],[1177,581],[1198,390],[1200,605],[1170,658],[1104,648],[1042,614]]}
          ]},
      ],
      hotspots:[
        {id:'carmen',x:272,y:387,w:96,h:134,walk:[372,574],label:'Speak with Carmen'},
        {id:'stranger',x:916,y:406,w:103,h:128,walk:[885,540],label:'Guest beside the window'},
        {id:'painting',x:704,y:230,w:140,h:118,walk:[935,500],label:'Framed painting'},
        {id:'table',x:637,y:532,w:230,h:145,walk:[866,574],label:'Look under the table'},
        {id:'window',x:1005,y:306,w:150,h:145,walk:[970,510],label:'Window by the plaza'},
        {id:'note',x:1015,y:529,w:65,h:61,walk:[960,564],label:'Folded paper'},
        {id:'menu',x:654,y:415,w:72,h:75,walk:[863,518],label:'Restaurant menu'},
        {id:'exit',x:1043,y:321,w:113,h:138,walk:[1026,474],label:'Return to the terrace'},
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
  let path=[], pending=null, time=0, lastFrame=performance.now(),lastReroute=0;
  let approachingStranger=false;
  let customizationDraft=null, gabrielHeldUntil=0, gabrielHeldPosition=null;
  let patrolPausedAt=null, patrolPausedDuration=0,waiterAvoidingAgent=false;
  const scenes={},originalScenes={};
  const spriteImages={}, coatSprites=new Map(), foregrounds={},individualObjects={};
  const spriteNames=['agent-m','agent-f','gabriel','carmen','stranger','stranger-seated'];
  for(const role of spriteNames){
    const img=new Image();img.src='./assets/characters/'+role+'.webp';
    img.onload=()=>{if(role===state.avatar.style)drawAvatarPreview();};
    spriteImages[role]=img;
  }
  // Small props use cutouts from the clean plate. Close furniture is different:
  // it is truly removed from that plate and loaded as its own transparent
  // sprite, ALWAYS rendered above the actors (see drawIndividualObjects).
  function prepareForegrounds(id){
    const bg=scenes[id],independent=new Set(SCENES[id].foregroundObjects.map(o=>o.id));
    const layers=SCENES[id].props.filter(prop=>!independent.has(prop.id)).flatMap(prop=>
      (prop.masks||[]).map(mask=>({...mask,owner:prop.id,depth:mask.footY})));
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
      return {owner:layer.owner,part:layer.part||'body',depth:layer.depth,x:left,y:top,canvas:mask};
    });
  }
  for(const [id,scene] of Object.entries(SCENES)){
    scenes[id]=new Image();scenes[id].onload=()=>prepareForegrounds(id);scenes[id].src=scene.image;
    originalScenes[id]=new Image();originalScenes[id].src=`./assets/${id}-pixel.webp`;
    individualObjects[id]=scene.foregroundObjects.map(part=>{
      const img=new Image();img.src=part.src;
      const collectedImg=part.collectedSrc?new Image():null;
      if(collectedImg)collectedImg.src=part.collectedSrc;
      return {...part,img,collectedImg};
    });
  }
  function originalsReady(id){
    return scenes[id]?.complete&&scenes[id].naturalWidth>0&&individualObjects[id].every(obj=>{
      const [l,t,r,b]=obj.sourceCrop;
      return obj.img.complete&&obj.img.naturalWidth===r-l&&obj.img.naturalHeight===b-t;
    });
  }
  function drawIndividualObjects(){
    for(const obj of individualObjects[state.scene]){
      const img=obj.collectedImg&&has('receipt')?obj.collectedImg:obj.img;
      if(!img.complete||!img.naturalWidth)continue;
      // The sourceCrop is the precise rectangle cut from the original
      // 1672×941 painting. This is the SAME scale as the whole background;
      // furniture must never be stretched to independently chosen bounds.
      const [left,top,right,bottom]=obj.sourceCrop;
      if(img.naturalWidth!==right-left||img.naturalHeight!==bottom-top)continue;
      ctx.drawImage(img,left*W/1672,top*H/941,(right-left)*W/1672,(bottom-top)*H/941);
    }
  }
  // These are foreground silhouettes taken straight from the ORIGINAL scene,
  // so their colour, detail and perspective agree pixel-for-pixel with it.
  // The left flower planter and tree are always in front of passing figures.
  const PINNED_FOREGROUND={terrace:[
    [[0,0],[520,0],[515,35],[413,80],[306,108],[211,169],[141,226],[111,353],[101,432],[0,450]],
    [[0,434],[112,417],[183,436],[234,479],[235,675],[0,675]],
  ],interior:[]};
  function drawPinnedForeground(){
    const bg=originalScenes[state.scene];if(!bg?.complete||!bg.naturalWidth)return;
    for(const polygon of PINNED_FOREGROUND[state.scene]){
      ctx.save();ctx.beginPath();polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.closePath();ctx.clip();ctx.imageSmoothingEnabled=true;ctx.drawImage(bg,0,0,W,H);ctx.restore();
    }
  }
  const mix=(a,b,t)=>a+(b-a)*Math.min(1,Math.max(0,t));
  const clamp01=value=>Math.max(0,Math.min(1,value));
  const perspectiveScale=(scene,y,x=0)=>{
    const p=SCENES[scene].perspective;
    const ground=mix(p.farScale,p.nearScale,(y-p.farY)/(p.nearY-p.farY));
    // The entrance has a raised floor plane, unlike the plaza pavement.
    // Both axes influence scale, with a smooth transition at its edges.
    const door=p.doorway;
    const influence=clamp01(1-Math.abs(x-door.x)/door.rangeX)
      *clamp01(1-Math.abs(y-door.y)/door.rangeY);
    return ground+door.boost*influence*influence;
  };
  // The waiter must use the same marked green floor and collision routing.
  const GABRIEL_STOPS=[
    {t:0, scene:'terrace',x:340,y:455,alpha:1},
    {t:4, scene:'terrace',x:340,y:455,alpha:1},
    {t:12,scene:'terrace',x:580,y:552,alpha:1},
    {t:18,scene:'terrace',x:830,y:553,alpha:1},
    {t:23,scene:'terrace',x:1110,y:490,alpha:1},
    {t:25,scene:'terrace',x:1140,y:505,alpha:0},
    {t:25.001,scene:'interior',x:1020,y:461,alpha:0},
    {t:28,scene:'interior',x:1000,y:565,alpha:1},
    {t:32,scene:'interior',x:920,y:580,alpha:1},
    {t:35,scene:'interior',x:920,y:580,alpha:1},
    {t:40,scene:'interior',x:1000,y:565,alpha:1},
    {t:43,scene:'interior',x:1020,y:461,alpha:0},
    {t:43.001,scene:'terrace',x:1140,y:505,alpha:0},
    {t:45,scene:'terrace',x:1110,y:490,alpha:1},
    {t:49,scene:'terrace',x:830,y:553,alpha:1},
    {t:54,scene:'terrace',x:580,y:552,alpha:1},
    {t:60,scene:'terrace',x:340,y:455,alpha:1},
    {t:64,scene:'terrace',x:340,y:455,alpha:1},
  ];
  const GABRIEL_NAV_CACHE=new Map();
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
    let x=a.x,y=a.y,travelled=distance*p;
    if(walking){
      if(!GABRIEL_NAV_CACHE.has(i)){
        // The guest's chair is an obstacle for the waiter, too.
        const route=routeTo(a.scene,{x:a.x,y:a.y},{x:b.x,y:b.y},
          a.scene==='interior'?[WITNESS_FOOT]:[]);
        GABRIEL_NAV_CACHE.set(i,route?.length?[{x:a.x,y:a.y},...route]:null);
      }
      const nodes=GABRIEL_NAV_CACHE.get(i);
      if(nodes){
        const lengths=nodes.slice(1).map((node,j)=>Math.hypot(node.x-nodes[j].x,node.y-nodes[j].y));
        const total=lengths.reduce((sum,n)=>sum+n,0);
        travelled=total*p;
        let remaining=travelled;
        for(let j=0;j<lengths.length;j++){
          if(remaining<=lengths[j]||j===lengths.length-1){
            const fraction=lengths[j]?Math.min(1,remaining/lengths[j]):0;
            x=mix(nodes[j].x,nodes[j+1].x,fraction);
            y=mix(nodes[j].y,nodes[j+1].y,fraction);
            break;
          }
          remaining-=lengths[j];
        }
      }
    }else if(a.scene===b.scene){x=mix(a.x,b.x,p);y=mix(a.y,b.y,p);}
    return {role:'gabriel',scene:a.scene,x,y,
      // No fade-through-walls: a waiter is either physically in this room or not.
      scale:perspectiveScale(a.scene,y,x),alpha:1,walking,
      facing:walking&&Math.abs(b.x-a.x)>4?(b.x<a.x?-1:1):(i<9?-1:1),
      step:(a.walkDistance+(walking?travelled:0))*.1};
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
  let strangerStoodAt=state.flags.strangerStood?performance.now()-1000:null;
  function strangerAt(now=performance.now()){
    if(state.scene!=='interior')return null;
    const standing=Boolean(state.flags.strangerStood);
    const rising=standing?Math.min(1,Math.max(0,(now-strangerStoodAt)/680)):0;
    return {role:'stranger',scene:'interior',
      x:mix(WITNESS_SEAT.x,WITNESS_FOOT.x,rising),
      y:mix(WITNESS_SEAT.y,WITNESS_FOOT.y,rising),
      // A witness first sits behind the small back table, then gets up when approached.
      seated:!standing,standProgress:rising,walking:false,facing:-1,step:0};
  }
  function standStranger(){
    if(state.flags.strangerStood)return;
    state.flags.strangerStood=true;strangerStoodAt=performance.now();save();
  }
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
    stranger:'Hablar con el testigo',palace:'Observar el Palacio Real',door:'Entrar al café',
    carmen:'Hablar con Carmen',table:'Buscar debajo',window:'Examinar la ventana',
    note:'Recoger el papel',menu:'Leer el menú',exit:'Volver a la terraza',
    painting:'Observar el cuadro'
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
      return `<button class="hotspot ${acquired?'revealed':''}" ${visible?'':'hidden'} data-hotspot="${h.id}" style="left:${(h.x/W*100).toFixed(2)}%;top:${(h.y/H*100).toFixed(2)}%;--hit-width:${(h.w/W*100).toFixed(2)}%;--hit-height:${(h.h/H*100).toFixed(2)}%" aria-label="${esc(h.label)}"><span class="hotspot-label">${esc(h.label+translation)}</span></button>`;
    }).join('');
  }
  function trackGabriel(g){
    const el=hotspotsNode.querySelector('[data-hotspot="gabriel"]');
    if(!el)return;
    const visible=g.scene===state.scene&&g.alpha>.34;el.hidden=!visible;
    if(visible){
      const height=158*g.scale,width=Math.max(65,height*.58);
      el.style.left=g.x/W*100+'%';el.style.top=(g.y-height*.52)/H*100+'%';
      el.style.setProperty('--hit-width',width/W*100+'%');
      el.style.setProperty('--hit-height',height/H*100+'%');
    }
  }
  function switchScene(id,arrival=null,walkOut=null){
    if(!SCENES[id])return;
    approachingStranger=false;
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
  function pointOnFloor(scene,x,y){
    const data=SCENES[scene];
    const inFloor=scene==='terrace'
      ?Boolean(terraceFootMap?.inside(x,y))
      :data.corridors.some(([l,t,r,b])=>x>=l&&x<=r&&y>=t&&y<=b);
    return inFloor
      && !data.props.some(prop=>prop.foot&&polygonContains(x,y,prop.foot));
  }
  // Collision is measured around a small elliptical footprint, not at one
  // infinitely thin point. This stops shoulders sliding through chair legs.
  const ACTOR_FOOTPRINT=[[0,0],[1,0],[-1,0],[0,1],[0,-1],
    [.72,.72],[-.72,.72],[.72,-.72],[-.72,-.72]];
  function walkable(scene,x,y){
    const scale=perspectiveScale(scene,y,x);
    const rx=Math.max(11,Math.min(22,14*scale));
    const ry=Math.max(6,Math.min(12,7*scale));
    return ACTOR_FOOTPRINT.every(([dx,dy])=>pointOnFloor(scene,x+dx*rx,y+dy*ry));
  }
  function activePeople(scene,now=performance.now()){
    const people=[];
    if(scene==='interior')people.push(state.flags.strangerStood?WITNESS_FOOT:WITNESS_SEAT);
    const waiter=gabrielAt(now);
    if(waiter.scene===scene)people.push({x:waiter.x,y:waiter.y});
    return people;
  }
  function overlappingFeet(scene,x,y,other){
    const scale=(perspectiveScale(scene,y,x)+perspectiveScale(scene,other.y,other.x))/2;
    return ((x-other.x)/(37*scale))**2+((y-other.y)/(19*scale))**2<1;
  }
  function walkableWithPeople(scene,x,y,people=[]){
    return walkable(scene,x,y)&&!people.some(p=>overlappingFeet(scene,x,y,p));
  }
  const GRID=15,COLS=Math.ceil(W/GRID),ROWS=Math.ceil(H/GRID);
  const cellPoint=i=>({x:(i%COLS)*GRID+GRID/2,y:Math.floor(i/COLS)*GRID+GRID/2});
  function closestWalkable(scene,x,y,people=[]){
    if(walkableWithPeople(scene,x,y,people))return {x,y};
    let best=null,dist=Infinity;
    for(let i=0;i<COLS*ROWS;i++){
      const p=cellPoint(i);if(!walkableWithPeople(scene,p.x,p.y,people))continue;
      const d=(p.x-x)**2+(p.y-y)**2;
      if(d<dist){dist=d;best=p;}
    }
    return best;
  }
  function lineClear(scene,a,b,people=[]){
    const distance=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(distance/8));
    for(let i=0;i<=n;i++){const t=i/n;if(!walkableWithPeople(scene,mix(a.x,b.x,t),mix(a.y,b.y,t),people))return false;}
    return true;
  }
  function routeTo(scene,start,end,people=[]){
    const first=closestWalkable(scene,start.x,start.y,people),last=closestWalkable(scene,end.x,end.y,people);
    if(!first||!last)return null;
    if(lineClear(scene,first,last,people))return [last];
    const valid=new Uint8Array(COLS*ROWS),g=new Float64Array(COLS*ROWS),came=new Int32Array(COLS*ROWS);
    g.fill(Infinity);came.fill(-1);
    for(let i=0;i<valid.length;i++){const p=cellPoint(i);valid[i]=Number(walkableWithPeople(scene,p.x,p.y,people));}
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
      for(let j=chain.length-1;j>i+1;j--){if(lineClear(scene,chain[i],chain[j],people)){furthest=j;break;}}
      smooth.push(chain[furthest]);i=furthest;
    }
    return smooth;
  }
  // Read-only route diagnostics for testing; never paints selection rectangles
  // over a scene, even when someone opens an old bookmarked debug URL.
  if(new URLSearchParams(location.search).has('navqa')){
    const report=Object.entries(SCENES).map(([id,s])=>({scene:id,
      routes:s.hotspots.map(h=>{
        const route=routeTo(id,{x:s.spawn[0],y:s.spawn[1]},{x:h.walk[0],y:h.walk[1]});
        const end=route?.at(-1);
        return {id:h.id,path:route?.length||0,distance:end?Math.round(Math.hypot(end.x-h.walk[0],end.y-h.walk[1])):null};
      }),
      waiter:GABRIEL_STOPS.filter(g=>g.scene===id).map(g=>[g.t,walkable(id,g.x,g.y)]),
      patrol:GABRIEL_STOPS.slice(0,-1).filter((a,i)=>a.scene===id&&GABRIEL_STOPS[i+1].scene===id)
        .map(a=>{const b=GABRIEL_STOPS[GABRIEL_STOPS.indexOf(a)+1];return [a.t,b.t,lineClear(id,a,b)];})
    }));
    document.body.dataset.navqa=JSON.stringify(report);
  }
  function walkTo(x,y,callback=null){
    const next=routeTo(state.scene,{x:actor.x,y:actor.y},{x,y},activePeople(state.scene));
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
    const person=id==='gabriel'?(gabrielHeldPosition||gabrielAt()):
      id==='stranger'?strangerAt():SCENES[state.scene].actors.find(a=>a.role===id);
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
      case 'exit':switchScene('terrace',[1140,505],[1110,493]);notify('Back on the terrace.','Has regresado a la terraza.');break;
      case 'carmen':openDialogue('carmen');break;
      case 'table':
        if(collect('key')){notify('A brass key! The tag says “Plaza de la Lealtad”.','La llave señala una plaza de Madrid.');speak('A brass key. Plaza de la Lealtad.');}
        else inspect('table');break;
      case 'window':notify('The plaza is quiet. A folded scrap lies beside the curtain.','Hay un papel cerca de la cortina.');break;
      case 'painting':inspect('painting');break;
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
      stranger:['A guest is sitting near the window with a clear view of the terrace.','Un cliente está sentado junto a la ventana y puede ver la terraza.'],
      palace:['The Royal Palace is on the other side of the plaza.','El Palacio Real es reconocible al fondo.'],
      door:['The Café de Oriente entrance.','La entrada del Café de Oriente.'],
      carmen:['Carmen works at the café reception.','Carmen podría haber visto a Evelyn.'],
      table:['One chair is empty. Something shines below the table.','Hay un reflejo metálico debajo de la mesa.'],
      window:['The doors overlook the terrace.','Las puertas miran hacia la terraza.'],
      painting:['A romanticised view of old Madrid. The painting is decorative, and its exact location is not verified.','Una vista idealizada del Madrid antiguo. El lugar exacto representado no está identificado.'],
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
    stranger:{name:'THE GUEST BY THE WINDOW',intro:['I was having dinner by the window. I saw her outside.','Estaba cenando junto a la ventana. Vio a una mujer en la terraza.'],topics:[
      {id:'name',question:'May I ask your name?',reply:['Call me Mr Grey. I would rather not be involved.','Prefiere que le llamemos señor Grey y no quiere involucrarse.'],advanced:'You can call me Mr Grey, but I would prefer that my name not appear in any official report.'},
      {id:'sighting',question:'What did you see from the window?',reply:['She sat at the outside table. A man came to speak to her.','Vio a la mujer sentada en la mesa exterior. Un hombre se acercó a hablar con ella.'],advanced:'From this window I had a direct line of sight to the outside table. A second person approached her shortly before she disappeared.'},
      {id:'departure',question:'Where did the man go?',reply:['Towards the palace, I think. He was wearing a blue scarf.','Cree que se dirigió hacia el palacio. Llevaba una bufanda azul.']},
    ]},
  };
  function openDialogue(id){
    if(id==='stranger'){standStranger();approachingStranger=false;}
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
  function drawPerson({role,x,y,walking=false,facing=1,step=0,scale=null,seated=false,standProgress=1}, now){
    const img=role==='agent'?coatImage(state.avatar.style,state.avatar.coat):spriteImages[role];
    if(!img?.naturalWidth && !img?.width)return;
    const depth=scale??perspectiveScale(state.scene,y,x);
    const height=(role==='carmen'?152:158)*depth,width=height*img.width/img.height;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    // Feet remain planted on the painted floor. A diffuse, depth-scaled
    // contact shadow is less distracting than the black opaque floating disc.
    if(!seated){
      ctx.save();ctx.scale(Math.max(15,width*.46),Math.max(3,4.2*depth));
      const shade=ctx.createRadialGradient(0,-.1,.08,0,-.1,1);
      shade.addColorStop(0,'#08070b99');shade.addColorStop(.58,'#09070a53');shade.addColorStop(1,'#08070a00');
      ctx.fillStyle=shade;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    ctx.scale(facing<0?-.97:.97,1);ctx.imageSmoothingEnabled=false;
    if(seated){
      // Independent fully drawn sitting pose, including the genuine chair.
      // Never fake a seated figure by truncating the legs of a standing sprite.
      const sitting=spriteImages['stranger-seated'];
      if(sitting?.naturalWidth){
        const sittingH=height*.77,sittingW=sittingH*sitting.width/sitting.height;
        ctx.drawImage(sitting,-sittingW/2,-sittingH,sittingW,sittingH);
      }else ctx.drawImage(img,-width/2,-height,width,height);
    }else if(role==='stranger'&&standProgress<1){
      // Reveal the legs as the witness rises, then step into the aisle.
      const visible=Math.round(img.height*(.67+.33*standProgress));
      const shownH=height*(.61+.39*standProgress);
      ctx.drawImage(img,0,0,img.width,visible,-width/2,-shownH,width,shownH);
    }else if(walking){
      // Two legs swing around their hips, covered at their joint by the coat
      // or apron. The torso does not jump vertically, and no pixels vanish at
      // the split; each stride leaves at least one foot touching the ground.
      const split=Math.round(img.height*(role==='gabriel'?.77:.765));
      const remaining=img.height-split,half=Math.floor(img.width/2);
      const hipY=-height+height*split/img.height;
      const legH=height*remaining/img.height,angle=Math.sin(step)*.115;
      for(let leg=0;leg<2;leg++){
        const srcX=leg?half:0,srcW=leg?img.width-half:half;
        const legW=width*srcW/img.width,pivot=leg?width*.06:-width*.06;
        ctx.save();ctx.translate(pivot,hipY+1);ctx.rotate(leg?-angle:angle);
        ctx.drawImage(img,srcX,split,srcW,remaining,
          -width/2+width*srcX/img.width-pivot,-2,legW,legH+2);
        ctx.restore();
      }
      const overlap=Math.min(img.height,split+9);
      ctx.drawImage(img,0,0,img.width,overlap,-width/2,-height,width,height*overlap/img.height);
    }else{
      // Standing up is a visible rising motion, with completely opaque pixels.
      const lift=(1-standProgress)*17*depth;
      ctx.drawImage(img,-width/2,-height+lift,width,height);
    }
    ctx.restore();
  }
  function frame(now){
    // Keep walking responsive even on browsers that render the canvas at a low frame rate.
    const dt=Math.min(.13,(now-lastFrame)/1000||.016);lastFrame=now;time+=dt;
    if(patrolPausedAt!==null && now>=gabrielHeldUntil && dialog?.id!=='gabriel'){
      releaseGabriel(now);waiterAvoidingAgent=false;
    }
    // Waiters and agents yield instead of walking through each other.
    if(patrolPausedAt===null){
      const g=gabrielAt(now),ahead=gabrielAt(now+300);
      if(g.scene===state.scene&&g.walking&&overlappingFeet(state.scene,actor.x,actor.y,ahead)){
        holdGabriel(now);gabrielHeldUntil=now+2500;waiterAvoidingAgent=true;
      }
    }else if(waiterAvoidingAgent&&gabrielHeldPosition&&
        !overlappingFeet(state.scene,actor.x,actor.y,{x:gabrielHeldPosition.x,y:gabrielHeldPosition.y})){
      releaseGabriel(now);waiterAvoidingAgent=false;
    }
    if(path.length){
      const next=path[0],dx=next.x-actor.x,dy=next.y-actor.y,dist=Math.hypot(dx,dy);
      const step=Math.min(dist,175*perspectiveScale(state.scene,actor.y,actor.x)*dt);
      const moveX=dist?actor.x+dx/dist*step:next.x;
      const moveY=dist?actor.y+dy/dist*step:next.y;
      if(walkableWithPeople(state.scene,moveX,moveY,activePeople(state.scene,now))){
        if(dist>0){actor.x=moveX;actor.y=moveY;if(Math.abs(dx)>2)actor.facing=dx<0?-1:1;actor.step+=step*.1;}
        if(dist<=step+1.5){actor.x=next.x;actor.y=next.y;path.shift();if(!path.length&&pending){const action=pending;pending=null;action();}}
      }else if(now-lastReroute>480){
        lastReroute=now;
        // Re-plan around someone's feet; never step through their sprite.
        const replacement=routeTo(state.scene,{x:actor.x,y:actor.y},path.at(-1),activePeople(state.scene,now));
        if(replacement?.length)path=replacement;
      }
    }
    if(state.scene==='interior'&&approachingStranger&&!state.flags.strangerStood&&
        Math.hypot(actor.x-WITNESS_FOOT.x,actor.y-WITNESS_FOOT.y)<130)standStranger();
    ctx.clearRect(0,0,W,H);
    const fullyLayered=originalsReady(state.scene);
    const bg=fullyLayered?scenes[state.scene]:originalScenes[state.scene];
    if(bg.complete&&bg.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.drawImage(bg,0,0,W,H);}
    else{ctx.fillStyle='#172b40';ctx.fillRect(0,0,W,H);}
    ctx.imageSmoothingEnabled=false;
    drawSceneObjects();
    const all=SCENES[state.scene].actors.map(a=>({...a,walking:false,
      facing:dialog?.id===a.role?(actor.x<a.x?-1:1):(a.role==='stranger'?-1:1)}));
    all.push({...actor,role:'agent',walking:path.length>0});
    const stranger=strangerAt(now);if(stranger)all.push(stranger);
    const gabriel=gabrielAt(now);if(gabriel.scene===state.scene&&gabriel.alpha>.01)all.push(gabriel);
    const elements=[
      ...all.map(person=>({depth:person.y,person})),
      ...(foregrounds[state.scene]||[]).map(layer=>({depth:layer.depth,layer}))
    ].sort((a,b)=>a.depth-b.depth);
    for(const item of elements){
      if(item.person)drawPerson(item.person,now);
      else ctx.drawImage(item.layer.canvas,item.layer.x,item.layer.y);
    }
    // The round table and each chair are real independent foreground assets,
    // not a redraw of an area of the same scenery image.
    // While an image is still loading (or has failed), use the complete
    // ORIGINAL scene so neither the foreground table nor its chairs vanish.
    if(fullyLayered)drawIndividualObjects();
    drawPinnedForeground();
    trackGabriel(gabriel);
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
        approachingStranger=h.id==='stranger';
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
