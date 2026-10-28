/* APEX 9A: comprobación de la nueva ficha Vehículo / Escudería.
 * Servir el repositorio en http://127.0.0.1:8765 antes de ejecutar.
 */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||
 (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright'));
(async()=>{
 const mobile=process.env.APEX_AUDIT_DEVICE==='mobile';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext(mobile?
   {viewport:{width:Number(process.env.APEX_AUDIT_WIDTH)||844,height:Number(process.env.APEX_AUDIT_HEIGHT)||390},isMobile:true,hasTouch:true}:
   {viewport:{width:1440,height:900}});
  await context.addInitScript(()=>{
   try{
    if(!localStorage.getItem('apex26.vehicle-studio.design.v1'))
     localStorage.setItem('apex26.vehicle-studio.design.v1',JSON.stringify({PAPAYA:'FERRATI',CADARA:'SILVERWING'}));
    if(!localStorage.getItem('apex26.vehicle-studio.paint.v1'))
     localStorage.setItem('apex26.vehicle-studio.paint.v1',JSON.stringify({CADARA:'UNKNOWN',NOT_A_TEAM:'stripes'}));
   }catch(_){}
  });
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(30000);
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:8765/apex/apex.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.ApexVehicleStudio9A&&
   !!document.querySelector('.apexProtoVehiclePanel.apexTeamStudio')&&
   document.getElementById('teamSelect')?.options?.length>0,null,{timeout:90000});
  await page.locator('#apex9aRace').click();
  const panel=page.locator('.apexProtoVehiclePanel.apexTeamStudio');
  assert.equal(await panel.isVisible(),true,'Ficha de equipo visible');
  assert.equal(await panel.locator('.apexStudioStage img').count(),1,'Un único monoplaza protagonista');
  assert.equal(await panel.locator('.apexProtoTeamPicker').count(),1,'Se reutiliza el selector original');
  assert.equal(await panel.locator('.apexProtoVehicleScene').evaluate(el=>getComputedStyle(el).display),'none',
    'No se muestra un segundo coche en el fondo');
  assert.ok((await panel.locator('#apexProtoTeamTitle').innerText()).length>3);
  const options=await page.locator('#teamSelect').evaluate(el=>Array.from(el.options).filter(o=>o.value&&!o.disabled).map(o=>o.value));
  assert.equal(options.length,11,'Se conservan las once escuderías');
  const images=new Map();
  for(let i=0;i<options.length;i++){
   const value=options[i];
   await page.locator('#apexProtoTeam').selectOption(value);
   await page.waitForFunction(v=>document.getElementById('teamSelect').value===v,value);
   const state=await page.evaluate(()=>{
    const selected=document.getElementById('teamSelect');
    const img=document.getElementById('apexProtoTeamImage');
    return {index:selected.selectedIndex,
     source:img.getAttribute('src'),key:selected.value,
     renderedTeam:img.dataset.apexTeamKey,renderedDesign:img.dataset.apexDesignKey,renderedModel:img.dataset.apexModel,
     renderedChassis:img.dataset.apexChassis,previewMode:img.dataset.apexPreview,
     native:window.ApexNativeTeamStudio9A.get(selected.value),
     svg:window.ApexTeamCarPreview9A.build(selected.value)?.svg,
     teamName:document.getElementById('apexProtoTeamTitle').textContent,
     teamLabel:selected.selectedOptions[0].textContent,
     chassis:document.getElementById('apexStudioChassis').textContent,
     model:document.getElementById('apexStudioModel').textContent,
     ordinal:document.getElementById('apexStudioOrder').textContent,
     count:selected.options.length};
   });
   assert.equal(state.previewMode,'native-blueprint','No utilizar fotos estáticas del prototipo');
   assert.equal(state.renderedTeam,state.key,'Imagen basada en la clave deportiva real');
   assert.equal(state.renderedDesign,state.key,'El diseño original es el predeterminado, incluso con preferencias inválidas');
   assert.equal(state.renderedModel,state.native.model,'Se conserva el identificador de modelo del catálogo');
   assert.equal(state.renderedChassis,state.native.chassis,'Chasis real del equipo');
   assert.ok(state.source.startsWith('data:image/svg+xml;charset=utf-8,'),'Vista SVG derivada de blueprint real');
   assert.equal(await page.evaluate(svg=>{
    const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
    return doc.querySelectorAll('parsererror').length;
   },state.svg),0,'SVG válido para '+value);
   assert.ok(state.svg.includes('data-apex-team="'+state.key+'"'));
   assert.ok(state.svg.includes('data-apex-model="'+state.native.model+'"'));
   assert.ok(state.svg.includes(state.native.preview.livery.primary.toLowerCase()));
   assert.ok(state.svg.includes(state.native.preview.livery.stripe.toLowerCase()));
   assert.equal(state.teamName,state.teamLabel.trim().toUpperCase());
   assert.ok(state.chassis&&state.chassis!=='—','El chasis procede del catálogo original');
   assert.ok(state.model&&state.model!=='—','El modelo procede del catálogo original');
   assert.equal(await panel.locator('#apexStudioLogo svg').count(),1,
    'Logo SVG original visible para la escudería '+value);
   assert.ok((await panel.locator('#apexStudioLogo svg').getAttribute('viewBox'))==='0 0 64 64',
    'Se reutiliza el logo original y no un logotipo inventado');
   assert.equal(state.ordinal,
    String(state.index+1).padStart(2,'0')+' / '+String(state.count).padStart(2,'0'));
   assert.ok(!images.has(state.key),'Cada escudería debe validarse una vez');
   assert.ok(![...images.values()].includes(state.source),'No reutilizar imagen de otra escudería');
   images.set(state.key,state.source);
   await page.locator('#apexProtoTeamImage').evaluate(img=>img.decode());
   assert.ok(await page.locator('#apexProtoTeamImage').evaluate(img=>img.complete&&img.naturalWidth>0),
    'Asset del coche cargado: '+value);
  }
  // Remove colour, team lettering and blueprint-size differences: a new name
  // or a recolour of one common SVG must not pass the team-design regression.
  const neutral=await page.evaluate(async keys=>{
   const result=[];
   for(const key of keys){
    const original=window.ApexNativeTeamStudio9A.get(key).preview;
    const source=window.ApexTeamCarPreview9A.markup({...original,
     teamName:'',model:'',chassis:'',geometry:{},
     livery:{primary:'#b0b0b0',secondary:'#242424',accent:'#eeeeee',
      stripe:'#eeeeee',carbon:'#080808',wing:'#181818',trim:'#eeeeee'}});
    const doc=new DOMParser().parseFromString(source,'image/svg+xml');
    doc.querySelectorAll('text').forEach(el=>el.remove());
    const path=selector=>doc.querySelector(selector)?.getAttribute('d');
    const geometry={body:path('.apex-car-body'),cockpit:path('.apex-car-cockpit>path:first-child'),pod:path('.apex-car-sidepod path'),
     inlet:path('.apex-car-inlet'),engine:path('.apex-car-engine-cover'),rearCase:path('.apex-car-gearbox'),mirror:path('.apex-car-mirror-case'),channel:path('.apex-car-pod-channel'),
     nose:path('.apex-car-nose'),front:path('.apex-car-front-wing path')};
    const canvas=document.createElement('canvas');canvas.width=500;canvas.height=235;
    const ctx=canvas.getContext('2d');
    const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+
     encodeURIComponent(new XMLSerializer().serializeToString(doc));
    await img.decode();ctx.drawImage(img,0,0,500,235);
    const pixels=ctx.getImageData(0,0,500,235).data;
    const gray=Array.from({length:500*235},(_,i)=>
     Math.round((pixels[i*4]+pixels[i*4+1]+pixels[i*4+2])/3));
    // Validate every neutral design, not only the last selected team.
    const host=document.createElement('div');host.style.cssText='position:fixed;left:-2000px';
    host.innerHTML=source;document.body.append(host);
    if(key==='PAPAYA'){
     const curves=[...host.querySelectorAll('.apex-car-flowing-accent path')];
     if(curves.length!==2)throw new Error('Falta una de las dos curvas continuas de McRaven');
     // Sample rendered pixels, not just path attributes: a mirrored clip can
     // silently hide the lower stripe even though its SVG path still exists.
     for(const curve of curves)for(const fraction of [.15,.35,.55,.75,.9]){
      const point=curve.getPointAtLength(curve.getTotalLength()*fraction);
      const local=new DOMPoint(point.x,point.y).matrixTransform(curve.getCTM());
      const x=Math.round(local.x*500/1040),y=Math.round(local.y/2);
      const bright=[];
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
       const offset=((y+dy)*500+x+dx)*4;
       bright.push(Math.min(pixels[offset],pixels[offset+1],pixels[offset+2]));
      }
      if(Math.max(...bright)<210)throw new Error('Curva de pintura interrumpida: '+fraction+' / '+local.y);
     }
    }
    const bounds=host.firstElementChild.getBBox();host.remove();
    result.push({key,geometry,gray,bounds:{x:bounds.x,y:bounds.y,
     right:bounds.x+bounds.width,bottom:bounds.y+bounds.height}});
   }
   return result;
  },options);
  for(const component of ['body','cockpit','pod','inlet','engine','rearCase','mirror','channel','nose','front']){
   assert.ok(neutral.every(row=>row.geometry[component]),'Componente presente: '+component);
   assert.equal(new Set(neutral.map(row=>row.geometry[component])).size,11,
    'Once geometrías diferentes con tamaños y paleta idénticos: '+component);
  }
  let minimumDifference=1;
  for(let i=0;i<neutral.length;i++){
   const bounds=neutral[i].bounds;
   assert.ok(bounds.x>0&&bounds.y>0&&bounds.right<1040&&bounds.bottom<470,
    'Diseño completo dentro del viewBox: '+neutral[i].key);
   for(let j=i+1;j<neutral.length;j++){
    let changed=0;
    for(let k=0;k<neutral[i].gray.length;k++)
     if(Math.abs(neutral[i].gray[k]-neutral[j].gray[k])>15)changed++;
    const fraction=changed/neutral[i].gray.length;
    minimumDifference=Math.min(minimumDifference,fraction);
    assert.ok(fraction>.01,'Diferencia visual sin colores ni letras: '+
     neutral[i].key+' / '+neutral[j].key+' = '+fraction);
   }
  }
  console.log(JSON.stringify({test:'team-designs-neutral',teams:neutral.length,
   pairs:55,minimumPixelDifference:minimumDifference,ok:true}));
  const drawings=await page.evaluate(keys=>keys.map(key=>{
   const source=window.ApexTeamCarPreview9A.build(key).svg;
   const host=document.createElement('div');host.style.cssText='position:fixed;left:-2000px;top:0';
   host.innerHTML=source;document.body.append(host);
   const svg=host.firstElementChild;
   const tyres=[...svg.querySelectorAll('.apex-car-tyre')];
   const parts=tyres.map(el=>{
    const b=el.getBBox();return {x:b.x,y:b.y,width:b.width,height:b.height};
   });
   const tyreRects=tyres.map(el=>el.getBoundingClientRect());
   const mounts=[...svg.querySelectorAll('.apex-car-wheel-mount')];
   const centre=rect=>({x:(rect.left+rect.right)/2,y:(rect.top+rect.bottom)/2});
   const connected=mounts.every(el=>{
    const b=el.getBoundingClientRect(),c=centre(b);
    const tyre=tyreRects.slice().sort((a,b)=>{
     const ca=centre(a),cb=centre(b);
     return Math.hypot(c.x-ca.x,c.y-ca.y)-Math.hypot(c.x-cb.x,c.y-cb.y);
    })[0];
    const t=centre(tyre),up=t.y<svg.getBoundingClientRect().top+svg.getBoundingClientRect().height/2;
    return b.left>=tyre.left&&b.right<=tyre.right&&
     (up?b.top<=tyre.bottom+3&&b.bottom>tyre.bottom:
      b.bottom>=tyre.top-3&&b.top<tyre.top);
   });
   // Check each actual link's attachment points in screen coordinates, including
   // the mirrored axle. A complete component count alone can hide floating arms.
   const body=svg.querySelector('.apex-car-body');
   const chassis=[body,svg.querySelector('.apex-car-gearbox')];
   const linksAttached=[...svg.querySelectorAll('.apex-car-suspension-arm')].every(el=>{
    const [ax,ay,bx,by]=el.dataset.anchors.split(' ').map(Number);
    const root=new DOMPoint(ax,ay).matrixTransform(el.getScreenCTM()).matrixTransform(body.getScreenCTM().inverse());
    const end=new DOMPoint(bx,by).matrixTransform(el.getScreenCTM());
    return chassis.some(part=>part?.isPointInFill(root))&&mounts.some(mount=>{
     const b=mount.getBoundingClientRect();
     return end.x>=b.left&&end.x<=b.right&&end.y>=b.top&&end.y<=b.bottom;
    });
   });
   const mechanics={mounts:mounts.length,suspensions:svg.querySelectorAll('.apex-car-suspension').length,
    ducts:svg.querySelectorAll('.apex-car-brake-duct').length,
    wishbones:svg.querySelectorAll('[data-link="wishbone"]').length,
    pushrods:svg.querySelectorAll('[data-link="pushrod"]').length,
    steering:svg.querySelectorAll('[data-link="steering"]').length,
    halfshafts:svg.querySelectorAll('[data-link="halfshaft"]').length,connected,linksAttached};
   const upper=svg.querySelector('.apex-car-front-wing');
   const elements=[...upper.querySelectorAll('.apex-car-wing-element')];
   const joins=[...svg.querySelectorAll('.apex-car-wing-join')];
   const wingJoined=elements.every((element,index)=>{
    const numbers=element.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
    const [ax,ay]=numbers,[bx,by]=numbers.slice(-2);
    const x=(ax+bx)/2,y=(ay+by)/2;
    return element.isPointInFill(new DOMPoint(x,y-.5))&&
     joins[index]?.isPointInFill(new DOMPoint(x,y-.5))&&
     joins[index].isPointInFill(new DOMPoint(x,235))&&
     joins[index].isPointInFill(new DOMPoint(x,470-y+.5));
   });
   // A DOM count alone misses coincident blades. Each must retain its own
   // exposed chord at three span stations, after all other foils are painted.
   const exposed=elements.map(element=>[120,155,190].map(y=>{
    let chord=0;
    for(let x=830;x<980;x+=.25){
     const point=new DOMPoint(x,y);
     if(element.isPointInFill(point)&&!elements.some(other=>other!==element&&other.isPointInFill(point)))chord+=.25;
    }
    return chord;
   }));
   const wing={elements:elements.length,joins:joins.length,connected:wingJoined,exposed};
   const rearTyre=svg.querySelector('.apex-car-tyre[data-axle="rear"]');
   const rearAxle=new DOMPoint(0,0).matrixTransform(rearTyre.getCTM());
   const shafts=[...svg.querySelectorAll('[data-link="halfshaft"]')];
   const rearLayout={tailNearAxle:Math.abs(body.getBBox().x-rearAxle.x)<8,
    gearboxAtAxle:svg.querySelector('.apex-car-gearbox')?.isPointInFill(new DOMPoint(rearAxle.x,235)),
    shaftsTransverse:shafts.every(el=>{
     const [ax,,bx]=el.dataset.anchors.split(' ').map(Number);return Math.abs(ax-bx)<1;
    }),pylons:svg.querySelectorAll('.apex-car-rear-pylon').length,
    beamWings:svg.querySelectorAll('.apex-car-beam-wing').length,
    diffuserExits:svg.querySelectorAll('.apex-car-diffuser-exit').length,
    brackets:svg.querySelectorAll('.apex-car-rear-bracket').length,
    joints:svg.querySelectorAll('.apex-car-rear-joints').length,
    feet:svg.querySelectorAll('.apex-car-pylon-foot').length,
    returns:svg.querySelectorAll('.apex-car-rear-floor-return').length,
    fences:svg.querySelectorAll('.apex-car-diffuser-fence').length,
    // CV boots must remain exposed outside the painted shell, not hidden below it.
    visibleBoots:[...svg.querySelectorAll('.apex-car-shaft-boot')].filter(el=>{
     const b=el.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(el.getScreenCTM());
     return ![body,...svg.querySelectorAll('.apex-car-sidepod>path:first-child')].some(part=>part.isPointInFill(p.matrixTransform(part.getScreenCTM().inverse())));
    }).length};
   const svgBounds=el=>{
    const b=el.getBBox(),m=el.getCTM();
    const points=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]]
     .map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));
    const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x));
    const top=Math.min(...points.map(p=>p.y)),bottom=Math.max(...points.map(p=>p.y));
    return {left,right,width:right-left,top,bottom,height:bottom-top};
   };
   const frontTyre=svg.querySelector('.apex-car-tyre[data-axle="front"]');
   const frontAxle=new DOMPoint(0,0).matrixTransform(frontTyre.getCTM());
   const wheelbase=frontAxle.x-rearAxle.x;
   const nose=svgBounds(svg.querySelector('.apex-car-nose'));
   const rearPlane=svgBounds(svg.querySelector('.apex-car-rear-wing>path'));
   const hole=svgBounds(svg.querySelector('.apex-car-cockpit>path:nth-child(2)'));
   const proportions={noseAheadOfWing:nose.right>svgBounds(svg.querySelector('.apex-car-front-bridge')).right,
    noseOverhang:(nose.right-frontAxle.x)/wheelbase,
    rearTrack:(470-2*rearAxle.y)/wheelbase,
    rearTyre:svgBounds(rearTyre).width/wheelbase,frontTyre:svgBounds(frontTyre).width/wheelbase,
    tailWidth:0,
    rearGap:(rearAxle.x-rearPlane.right)/wheelbase,
    cockpit:((hole.left+hole.right)/2-rearAxle.x)/wheelbase};
   const tailPoint=body.getAttribute('d').match(/^M[\d.]+ ([\d.]+)/);
   proportions.tailWidth=2*(235-Number(tailPoint[1]))/wheelbase;
   const mirrorCases=[...svg.querySelectorAll('.apex-car-mirror-case')];
   const shellParts=[body,...svg.querySelectorAll('.apex-car-sidepod>path:first-child')];
   const mirrorConnected=[...svg.querySelectorAll('.apex-car-mirror-stay')].every(el=>{
    const [ax,ay,bx,by]=el.dataset.anchors.split(' ').map(Number),m=el.getScreenCTM();
    const root=new DOMPoint(ax,ay).matrixTransform(m),tip=new DOMPoint(bx,by).matrixTransform(m);
    return shellParts.some(part=>part.isPointInFill(root.matrixTransform(part.getScreenCTM().inverse())))&&
     mirrorCases.some(part=>part.isPointInFill(tip.matrixTransform(part.getScreenCTM().inverse())));
   });
   const mirrorDetails={cases:mirrorCases.length,glass:svg.querySelectorAll('.apex-car-mirror-glass').length,
    stays:svg.querySelectorAll('.apex-car-mirror-stay').length,roots:svg.querySelectorAll('.apex-car-mirror-root').length,connected:mirrorConnected,
    transverse:mirrorCases.every(el=>el.getBBox().height>el.getBBox().width*1.2),
    compactStays:[...svg.querySelectorAll('.apex-car-mirror-stay')].every(el=>{
     const [ax,ay,bx,by]=el.dataset.anchors.split(' ').map(Number);return Math.hypot(bx-ax,by-ay)<60;
    }),
    glassInside:[...svg.querySelectorAll('.apex-car-mirror-glass')].every(el=>{
     const b=el.getBBox(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(el.getScreenCTM());
     return mirrorCases.some(c=>c.isPointInFill(p.matrixTransform(c.getScreenCTM().inverse())));
    }),
    throats:svg.querySelectorAll('.apex-car-inlet-throat').length,padding:svg.querySelectorAll('.apex-car-cockpit-padding').length};
   const surfaces={channels:svg.querySelectorAll('.apex-car-pod-channel').length,
    ridges:svg.querySelectorAll('.apex-car-channel-ridge').length,
    frontRelief:svg.querySelectorAll('.apex-car-front-wing .apex-car-foil-relief').length,
    rearRelief:svg.querySelectorAll('.apex-car-rear-plane-relief').length,
    haloWidth:Number(svg.querySelector('.apex-car-cockpit path[stroke="url(#halo)"]').getAttribute('stroke-width')),
    // McRaven's old shoulder filled this point and hid the carbon channel.
    shoulderClear:key!=='PAPAYA'||!body.isPointInFill(new DOMPoint(510,166)),
    vectorOnly:!svg.querySelector('image,filter,animate')};
   const factor=Number(svg.dataset.mmPerUnit),full=svgBounds(svg),frontUpper=svgBounds(upper);
   const rearWing=svgBounds(svg.querySelector('.apex-car-rear-wing'));
   const dimensions={wheelbase:wheelbase*factor,length:full.width*factor,width:full.height*factor,
    frontOverhang:(nose.right-frontAxle.x)*factor,rearOverhang:(rearAxle.x-rearWing.left)*factor,
    frontWing:(470-2*frontUpper.top)*factor,rearWing:rearWing.height*factor,
    frontTyre:svgBounds(frontTyre).height*factor,rearTyre:svgBounds(rearTyre).height*factor,
    diameter:svgBounds(frontTyre).width*factor,rearProfiles:svg.querySelectorAll('.apex-car-rear-wing-element').length};
   const bounds=svg.getBBox();host.remove();
   return {key,parts,mechanics,wing,rearLayout,proportions,surfaces,dimensions,mirrorDetails,bounds:{x:bounds.x,y:bounds.y,right:bounds.x+bounds.width,bottom:bounds.y+bounds.height}};
  }),options);
  for(const drawing of drawings){
   assert.deepEqual(drawing.mirrorDetails,{cases:2,glass:2,stays:4,roots:4,connected:true,transverse:true,compactStays:true,glassInside:true,throats:2,padding:2},
    'Dos retrovisores transversales, cuatro soportes conectados y entradas profundas: '+drawing.key);
   assert.deepEqual(drawing.surfaces,{channels:2,ridges:2,frontRelief:drawing.wing.elements*2,
    rearRelief:1,haloWidth:5.5,shoulderClear:true,vectorOnly:true},
    'Canales visibles, halo fino y perfiles vectoriales en ambas mitades: '+drawing.key);
   for(const [field,target] of Object.entries({wheelbase:3400,length:5450,width:1900,frontOverhang:1300,rearOverhang:750,
    frontWing:1800,rearWing:1150,frontTyre:275,rearTyre:375,diameter:710}))
    assert.ok(Math.abs(drawing.dimensions[field]-target)<1,'Cota en mm '+field+' / '+drawing.key+': '+JSON.stringify(drawing.dimensions));
   assert.equal(drawing.dimensions.rearProfiles,3,'Tres perfiles del alerón trasero 2026');
   assert.equal(drawing.parts.length,4,'Cuatro neumáticos slick: '+drawing.key);
   assert.ok(drawing.parts.every(b=>b.width>b.height*1.25),'Neumáticos alargados en el eje longitudinal');
   assert.deepEqual(drawing.mechanics,{mounts:4,suspensions:4,ducts:4,wishbones:8,pushrods:4,steering:2,halfshafts:2,connected:true,linksAttached:true},
    'Suspensión completa y cuatro bujes unidos a la cara interior de los neumáticos: '+drawing.key);
   assert.ok(drawing.wing.elements===3&&drawing.wing.joins===3&&drawing.wing.connected,
    'Cada lámina tiene unión central con ambas mitades del alerón: '+JSON.stringify(drawing.wing)+' / '+drawing.key);
   assert.ok(drawing.wing.exposed.every(chords=>chords.every(width=>width>=3)),
    'Los tres perfiles 2026 tienen cuerda visible propia, sin coincidir entre sí: '+drawing.key+' / '+JSON.stringify(drawing.wing.exposed));
   assert.deepEqual(drawing.rearLayout,{tailNearAxle:true,gearboxAtAxle:true,shaftsTransverse:true,pylons:2,beamWings:0,diffuserExits:1,brackets:2,joints:2,feet:2,returns:2,fences:2,visibleBoots:4},
    'Cola junto al eje, transmisión y soportes traseros: '+drawing.key);
   assert.ok(drawing.proportions.noseAheadOfWing,'El morro llega por delante de la unión central del alerón: '+drawing.key);
   if(drawing.key==='PAPAYA'){
    console.log(JSON.stringify({test:'mcraven-reference-proportions',...drawing.proportions}));
    // Ratios calibrated from the supplied 2026 dimensioned reference.
    // These broad intervals allow native blueprint scaling, not the old short
    // nose, pencil-thin tail or overly elongated tyres.
    for(const [name,min,max] of [['noseOverhang',.38,.39],['rearTrack',.44,.46],['rearTyre',.195,.235],['frontTyre',.19,.22],
     ['tailWidth',.07,.09],['rearGap',.06,.08],['cockpit',.60,.65]])
     assert.ok(drawing.proportions[name]>=min&&drawing.proportions[name]<=max,
      'Proporción de referencia '+name+': '+drawing.proportions[name]);
   }
   assert.ok(drawing.bounds.x>0&&drawing.bounds.y>0&&drawing.bounds.right<1040&&drawing.bounds.bottom<470,
    'Toda la silueta dentro del viewBox '+JSON.stringify(drawing));
  }
  console.log(JSON.stringify({test:'studio-2026-dimensions-mm',teams:drawings.length,measured:drawings.map(d=>({key:d.key,...d.dimensions})),ok:true}));
  assert.equal(images.size,options.length,'Todas las imágenes del catálogo comprobadas');
  assert.equal(await panel.locator('.apexStudioTeamCard').count(),options.length,
   'Tarjeta y logotipo propio para cada una de las 11 escuderías');
  const logos=await panel.locator('.apexStudioCardLogo svg').evaluateAll(els=>els.map(el=>el.outerHTML));
  assert.equal(new Set(logos).size,options.length,'Identidad vectorial diferenciada por equipo');
  const markGeometry=await panel.locator('.apexStudioCardLogo svg g').evaluateAll(els=>els.map(el=>el.innerHTML));
  assert.equal(new Set(markGeometry).size,11,'Once símbolos propios, sin depender del color ni del ID del gradiente');
  assert.ok(await panel.locator('.apexStudioCardLogo svg').evaluateAll(els=>els.every(el=>{
   const b=el.querySelector('g').getBBox();return b.x>=0&&b.y>=0&&b.x+b.width<=64&&b.y+b.height<=64;
  })),'Logos completos dentro de su viewBox');
  await panel.locator('.apexStudioTeamCard').filter({hasText:'Meridian'}).click();
  assert.equal(await page.locator('#teamSelect').inputValue(),options[1],
   'El mosaico debe activar el selector deportivo nativo');
  await page.locator('#apexProtoTeam').selectOption(options[0]);
  assert.equal(await panel.locator('.apexStudioTeamCard.active').count(),1,
   'Sólo la escudería activa debe resaltarse');
  await panel.locator('#apexStudioHeaderNext').click();
  assert.equal(await page.locator('#teamSelect').inputValue(),options[1],
   'Las flechas superiores reutilizan los controles nativos');
  await panel.locator('#apexStudioHeaderPrev').click();
  assert.equal(await page.locator('#teamSelect').inputValue(),options[0]);
  await page.locator('#apexProtoTeam').selectOption(options[0]);
  // Colores persistentes por equipo. Principal y acento también deben llegar
  // a los controles deportivos nativos, no ser una pintura ficticia.
  const initial=await page.locator('#apexProtoTeamImage').getAttribute('src');
  await page.locator('#apexStudioColor-primary').fill('#34acde');
  await page.locator('#apexStudioColor-accent').fill('#ee8822');
  await page.locator('#apexStudioColor-secondary').fill('#172f46');
  await page.waitForFunction(()=>document.getElementById('carColor').value.toLowerCase()==='#34acde' &&
    document.getElementById('carAccent').value.toLowerCase()==='#ee8822');
  const personalized=await page.locator('#apexProtoTeamImage').getAttribute('src');
  assert.notEqual(personalized,initial,'La carrocería cambia al escoger otro color');
  assert.ok(decodeURIComponent(personalized).includes('#34acde'));
  assert.ok(decodeURIComponent(personalized).includes('#ee8822'));
  assert.ok(decodeURIComponent(personalized).includes('#172f46'));
  assert.equal(await page.locator('#apexStudioSave').innerText(),'COLORES PERSONALIZADOS');
  assert.equal(await page.locator('#apexStudioPaintStyle option').count(),11,'Once decoraciones seleccionables');
  const paintOptions=await page.locator('#apexStudioPaintStyle').evaluate(el=>Array.from(el.options).map(o=>o.value));
  const shapeChecks=await page.evaluate(keys=>{
   const signatures=[];
   const signature=source=>{
    const doc=new DOMParser().parseFromString(source,'image/svg+xml');
    if(doc.querySelector('parsererror'))throw new Error('SVG inválido');
    return JSON.stringify(Array.from(doc.querySelectorAll('.apex-car-body,.apex-car-engine-cover,.apex-car-nose,.apex-car-inlet,.apex-car-sidepod>path:first-child,.apex-car-front-bridge,.apex-car-wing-join,.apex-car-front-wing,.apex-car-front-wing .apex-car-wing-element,.apex-car-rear-wing,.apex-car-rear-wing-element,.apex-car-cockpit,.apex-car-cockpit path,.apex-car-cockpit circle,.apex-car-inlet-depth path,.apex-car-inlet-throat,.apex-car-inlet-throat path,.apex-car-inlet-return,.apex-car-mirror,.apex-car-mirror path,.apex-car-mirror circle,.apex-car-mirror-stay,.apex-car-pod-reflection,.apex-car-pod-channel,.apex-car-channel-ridge,.apex-car-pod-shoulder,.apex-car-foil-relief,.apex-car-rear-plane-relief,.apex-car-tyre,.apex-car-suspension-arm path,.apex-car-wheel-mount path,.apex-car-wheel-mount ellipse,.apex-car-wheel-mount circle,.apex-car-floor,.apex-car-rear-assembly g,.apex-car-rear-assembly path,.apex-car-rear-assembly ellipse,.apex-car-rear-assembly circle,.apex-car-shaft-boot path,.apex-car-rear-joints,.apex-car-rear-joints ellipse,.apex-car-rear-joints circle,.apex-car-airbox,.apex-car-service-details path')).map(el=>({
     tag:el.tagName,shape:el.getAttribute('d'),transform:el.getAttribute('transform'),
     size:['cx','cy','rx','ry','r','x','y','width','height'].map(name=>el.getAttribute(name)),
     child:el.querySelector('path,rect')?.getAttribute('d')||el.querySelector('rect')?.outerHTML
    })));
   };
   for(const key of keys){
    const profile=window.ApexNativeTeamStudio9A.get(key).preview;
    const original=signature(window.ApexTeamCarPreview9A.markup(profile));
    let paints=0;
    for(const {key:paintStyle} of window.ApexTeamCarPreview9A.paintStyles){
     const source=window.ApexTeamCarPreview9A.markup({...profile,paintStyle,
      designKey:keys[(keys.indexOf(key)+1)%keys.length]});
     if(signature(source)!==original)throw new Error('La pintura modifica la geometría: '+key+' / '+paintStyle);
     paints++;
    }
    signatures.push({key,paints});
   }
   return signatures;
  },options);
  assert.equal(shapeChecks.reduce((sum,x)=>sum+x.paints,0),121,'Las 121 combinaciones conservan la carrocería de la escudería');
  const originalLogo=await panel.locator('#apexStudioLogo svg').evaluate(el=>el.outerHTML);
  const alternateSources=new Set();
  for(const paint of paintOptions){
   await page.locator('#apexStudioPaintStyle').selectOption(paint);
   await page.waitForFunction(value=>document.getElementById('apexProtoTeamImage').dataset.apexPaintStyle===value,paint);
   const image=await page.locator('#apexProtoTeamImage').getAttribute('src');
   assert.equal(await page.locator('#apexProtoTeamImage').getAttribute('data-apex-design-key'),options[0],'La carrocería permanece ligada a la escudería');
   assert.equal(await page.locator('#teamSelect').inputValue(),options[0],'Cambiar decoración conserva la escudería deportiva');
   assert.equal(await panel.locator('#apexStudioLogo svg').evaluate(el=>el.outerHTML),originalLogo,'El logo conserva su identidad al cambiar decoración');
   for(const color of ['#34acde','#ee8822','#172f46'])
    assert.ok(decodeURIComponent(image).includes(color),'Se conserva el color personalizado '+color);
   await page.locator('#apexProtoTeamImage').evaluate(img=>img.decode());
   alternateSources.add(image);
  }
  assert.equal(alternateSources.size,11,'Las once elecciones cambian la vista');
  await page.locator('#apexStudioPaintStyle').selectOption('spots');
  // A second team stores its own independent design preference.
  await page.locator('#apexProtoTeam').selectOption(options[1]);
  assert.equal(await page.locator('#apexStudioPaintStyle').inputValue(),'original');
  await page.locator('#apexStudioPaintStyle').selectOption('stripes');
  await page.locator('#apexProtoTeam').selectOption(options[0]);
  assert.equal(await page.locator('#apexStudioPaintStyle').inputValue(),'spots');
  for(const [name,finish,secondary] of [
   ['Acabado plata','silver','#b4c1cc'],
   ['Acabado carbono','carbon','#101920'],
   ['Acabado blanco','white','#f2f6fa']
  ]){
   await panel.getByRole('button',{name}).click();
   assert.equal(await panel.locator('.apexStudioFinish[aria-pressed="true"]').count(),1,
    'Acabado seleccionado con botón accesible');
   assert.equal(await page.locator('#apexStudioColor-secondary').inputValue(),secondary);
   assert.ok((await page.locator('#apexProtoTeamImage').getAttribute('src')).includes(encodeURIComponent(secondary)),
    'El acabado cambia la librea cenital '+finish);
  }
  await page.locator('#apexStudioColor-secondary').fill('#172f46');
  await panel.locator('#apexStudioSaveButton').click();
  assert.equal(await page.locator('#apexStudioSave').innerText(),'GUARDADO ✓');
  await page.locator('#apexProtoTeam').selectOption(options[1]);
  await page.locator('#apexProtoTeam').selectOption(options[0]);
  await page.waitForFunction(()=>document.getElementById('carColor').value.toLowerCase()==='#34acde');
  // La selección de equipo debe seguir siendo la nativa.
  assert.equal(await page.locator('#teamSelect').inputValue(),options[0]);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ApexVehicleStudio9A && document.getElementById('apexStudioColor-primary'),null,{timeout:90000});
  await page.locator('#apex9aRace').click();
  await page.waitForFunction(()=>{
   const team=document.getElementById('teamSelect'),input=document.getElementById('apexStudioColor-primary');
   return team?.value&&input?.value.toLowerCase()==='#34acde';
  },null,{timeout:30000});
  assert.equal(await page.locator('#apexStudioColor-primary').inputValue(),'#34acde',
   'El color personalizado persiste tras recarga');
  assert.equal(await page.locator('#apexStudioColor-secondary').inputValue(),'#172f46');
  assert.equal(await page.locator('#apexStudioColor-accent').inputValue(),'#ee8822');
  assert.equal(await page.locator('#apexStudioPaintStyle').inputValue(),'spots','La decoración persiste tras recarga');
  assert.equal(await page.locator('#apexProtoTeamImage').getAttribute('data-apex-team-key'),options[0]);
  await page.locator('#apexProtoTeam').selectOption(options[1]);
  assert.equal(await page.locator('#apexStudioPaintStyle').inputValue(),'stripes','La segunda escudería recupera su propia elección');
  await page.locator('#apexStudioPaintReset').click();
  assert.equal(await page.locator('#apexStudioPaintStyle').inputValue(),'original');
  await page.locator('#apexProtoTeam').selectOption(options[0]);
  assert.equal(await page.locator('#apexStudioPaintStyle').inputValue(),'spots');
  await page.locator('#apexStudioReset').click();
  assert.notEqual(await page.locator('#apexStudioColor-primary').inputValue(),'#34acde',
   'Restaurar recupera la pintura original de la escudería');
  assert.equal(await page.locator('#apexStudioPaintStyle').inputValue(),'spots','Restaurar colores conserva la decoración');
  const restoredColor=await page.locator('#apexStudioColor-primary').inputValue();
  await page.locator('#apexStudioPaintReset').click();
  assert.equal(await page.locator('#apexStudioPaintStyle').inputValue(),'original');
  assert.equal(await page.locator('#apexStudioColor-primary').inputValue(),restoredColor,'Restaurar decoración conserva los colores');
  assert.equal(await page.locator('#apexStudioPaintReset').isDisabled(),true);
  // Layout contract: on desktop Circuito and Vehículo share one 50/50 row;
  // on a narrow/mobile viewport they stack rather than clipping the car.
  const split=await page.evaluate(()=>{
    const c=document.querySelector('.apexProtoCircuitPanel')?.getBoundingClientRect();
    const v=document.querySelector('.apexProtoVehiclePanel')?.getBoundingClientRect();
    const d=document.querySelector('.apexProtoDetails')?.getBoundingClientRect();
    return {circuit:c&&{x:c.x,y:c.y,width:c.width,height:c.height,bottom:c.bottom},
     vehicle:v&&{x:v.x,y:v.y,width:v.width,height:v.height,bottom:v.bottom},
     details:d&&{width:d.width},viewport:innerWidth};
  });
  assert.ok(split.circuit&&split.vehicle&&split.details,'Ambos paneles permanecen visibles');
  if(!mobile){
    assert.ok(Math.abs(split.circuit.y-split.vehicle.y)<4,
     'Circuito y Vehículo en una misma fila en escritorio '+JSON.stringify(split));
    const fraction=split.vehicle.width/split.details.width;
    assert.ok(fraction>.44&&fraction<.52,
     'El vehículo debe ocupar aproximadamente la mitad de la pantalla '+JSON.stringify(split));
    assert.ok(split.circuit.height>=500&&split.vehicle.height>=500,
     'Ambos paneles deben tener espacio suficiente para el contenido');
  }else{
    assert.ok(split.vehicle.y>=split.circuit.bottom-3,
     'En pantallas estrechas deben apilarse sin montarse '+JSON.stringify(split));
  }
  const ground=await panel.locator('.apexStudioStage').evaluate(el=>{
   const style=getComputedStyle(el);return {image:style.backgroundImage,color:style.backgroundColor};
  });
  assert.equal(ground.color,'rgb(38, 49, 57)','Suelo neutro de losas, independiente del color de escudería');
  assert.ok(ground.image.includes('data:image/svg+xml')&&ground.image.includes('repeating-linear-gradient'),
   'Textura vectorial estática y juntas de losas en el visor');
  const geometry=await panel.evaluate(el=>{
   const rect=el.getBoundingClientRect();
   const hero=el.querySelector('.apexStudioHero').getBoundingClientRect();
   const controls=el.querySelector('.apexStudioControls').getBoundingClientRect();
   const image=el.querySelector('.apexStudioStage img').getBoundingClientRect();
   const specs=el.querySelector('.apexStudioSpecs').getBoundingClientRect();
   const design=el.querySelector('.apexStudioDesignPicker').getBoundingClientRect();
   const palette=el.querySelector('.apexStudioPalette').getBoundingClientRect();
   return {overflow:el.scrollWidth-el.clientWidth,
    specsInsideHero:specs.top>=hero.top-1&&specs.bottom<=hero.bottom+1,
    designBetween:design.top>=controls.bottom-1&&design.bottom<=palette.top+1,
    heroBelowHeader:hero.top>=el.querySelector('h2').getBoundingClientRect().bottom-1,
    imageInsideHero:image.top>=hero.top-1&&image.bottom<=hero.bottom+1&&
     image.left>=hero.left-1&&image.right<=hero.right+1,
    controlsBelowHero:controls.top>=hero.bottom-1,
    controlsInside:controls.bottom<=rect.bottom+2,
    bounds:{heroTop:Math.round(hero.top),heroBottom:Math.round(hero.bottom),
      imageTop:Math.round(image.top),imageBottom:Math.round(image.bottom),
      imageHeight:Math.round(image.height),controlsTop:Math.round(controls.top)}};
  });
  assert.ok(geometry.overflow<=2,'Sin desbordamiento horizontal '+JSON.stringify(geometry));
  assert.ok(geometry.heroBelowHeader&&geometry.imageInsideHero&&geometry.controlsBelowHero&&geometry.controlsInside&&geometry.specsInsideHero&&geometry.designBetween,
   'Sin solapamientos de coche, título y selector '+JSON.stringify(geometry));
  await page.screenshot({path:'/tmp/apex-results/9a-vehicle-studio-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});
  await page.locator('[data-apex-mode="grandprix"]').click();
  assert.equal(await panel.isVisible(),true,'La ficha existe en Gran Premio');
  await page.locator('[data-apex-mode="season"]').click();
  assert.equal(await panel.isVisible(),true,'La ficha existe en Temporada');
  await page.locator('[data-apex-mode="practice"]').click();
  assert.equal(await panel.isVisible(),true,'La ficha existe en Entrenamiento');
  assert.deepEqual(errors.filter(e=>/SyntaxError|Cannot read properties|Unexpected end/.test(e)),[]);
  console.log(JSON.stringify({test:'apex-vehicle-team-studio',mobile,teams:options.length,geometry,split,ok:true}));
  await context.close();
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
