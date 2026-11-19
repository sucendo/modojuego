/* English Spy — hand-authored 400×225 pixel-art safe house.
   Each prop is a separate transparent sprite, cached once and depth-sorted by
   lab.js. World coordinates and hotspots remain unchanged. */
(() => {
  'use strict';
  const SCALE=3,WIDTH=400,HEIGHT=225;
  const C={ink:'#121b24',deep:'#172632',navy:'#24394b',wall:'#344b59',wallLit:'#455967',
    woodBlack:'#241c21',woodDark:'#392731',wood:'#674133',woodLit:'#986345',gold:'#d6a666',
    goldLit:'#f2c780',cream:'#e9d8ab',greenBlack:'#253b36',green:'#42685d',greenLit:'#719182',
    rust:'#7f453b',rustLit:'#ad6951',shadow:'#18202a',floor:'#775544'};
  const box=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  const path=(g,points,c)=>{g.beginPath();g.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);g.closePath();g.fillStyle=c;g.fill();};
  const stroke=(g,x,y,X,Y,c,w=1)=>{g.beginPath();g.moveTo(x+.5,y+.5);g.lineTo(X+.5,Y+.5);g.lineWidth=w;g.strokeStyle=c;g.stroke();};
  const oval=(g,x,y,rX,rY,c)=>{g.beginPath();g.ellipse(x,y,rX,rY,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  const frame=(g,x,y,w,h,dark,light)=>{box(g,x,y,w,h,dark);box(g,x+2,y+2,w-4,h-4,light);box(g,x+4,y+4,w-8,h-8,dark);};
  const hash=(x,y,seed=7)=>Math.abs((x*73856093^y*19349663^seed*83492791)>>>0)%997;
  const grain=(g,x,y,w,h,c,step=4,density=13)=>{for(let yy=y;yy<y+h;yy+=step)for(let xx=x;xx<x+w;xx+=step){
    if(hash(xx,yy)%100<density)box(g,xx,yy,1+(hash(yy,xx)%2),1,c);
  }};
  function room(g,opened){
    box(g,0,0,WIDTH,HEIGHT,'#152330');
    // Old wallpaper in receding shadow: solid color bands, no blurred gradients.
    box(g,0,0,400,23,'#233849');box(g,0,23,400,56,'#2d4354');box(g,0,79,400,38,'#35495a');
    box(g,0,0,26,116,'#263949');box(g,0,0,6,121,'#192a36');
    box(g,384,0,16,120,'#263745');box(g,394,0,6,120,'#1a2831');
    for(let x=7;x<400;x+=23){box(g,x,0,1,112,'#58647722');box(g,x+3,0,1,114,'#14263244');}
    grain(g,7,7,388,110,'#9ca59c',7,3);
    // Pilasters and mahogany wainscoting are fixed architectural elements.
    for(const x of [6,71,163,226,322,393]){
      box(g,x,2,5,112,'#192d36');box(g,x+1,2,2,112,'#58707a');
    }
    box(g,0,111,400,6,'#1b242a');box(g,0,116,400,6,'#ad8057');box(g,0,117,400,1,'#f4c485');
    box(g,0,122,400,5,'#402d2b');
    for(let x=1;x<400;x+=28){box(g,x,120,1,6,'#c09260');box(g,x+2,122,1,4,'#28252b');}
    // Perspective hardwood floor: uneven planks with warm incidental light.
    box(g,0,127,400,98,'#654638');
    const rows=[127,133,141,151,165,183,206,225];
    const floorBands=['#715043','#765343','#805947','#87604a','#89614b','#926951','#976d50'];
    for(let r=0;r<rows.length-1;r++){
      const y=rows[r],h=rows[r+1]-y;
      box(g,0,y,400,h,floorBands[r]);box(g,0,y,400,1,'#382e2c');
      box(g,0,y+1,400,1,'#b88b6238');
      const shift=(r*13)%48,spacing=30+r*4;
      for(let x=-spacing+shift;x<420;x+=spacing){box(g,x,y+1,1,h-1,'#48352f');box(g,x+2,y+2,1,Math.max(1,h-3),'#ad7d594b');}
      for(let x=7;x<400;x+=7)if(hash(x,r)%3===0)box(g,x,y+3+(hash(r,x)%(Math.max(1,h-4))),5,1,'#c88f6245');
    }
    for(let i=0;i<12;i++){
      const start=i*36-12,vanish=200+(start-200)*.44;
      stroke(g,vanish,126,start,225,'#49352f77',1);
    }
    // Persian carpet with four distinct edge bands and central embroidery.
    const carpet=[[119,175],[251,175],[307,224],[83,224]];
    path(g,carpet,'#271f2a');path(g,[[121,176],[249,176],[303,222],[88,222]],'#b68b55');
    path(g,[[126,179],[244,179],[295,219],[95,219]],'#572f3d');
    path(g,[[130,182],[240,182],[289,216],[101,216]],'#bb9467');
    path(g,[[134,184],[236,184],[282,213],[108,213]],'#503747');
    for(let i=0;i<9;i++){
      const x=139+i*13;
      box(g,x,185,3,2,'#bba379');box(g,121+i*17,210,4,2,'#bba379');
    }
    for(const [x,y] of [[170,197],[195,195],[220,199]]){
      path(g,[[x,y-7],[x+9,y],[x,y+7],[x-9,y]],'#b99263');
      path(g,[[x,y-4],[x+5,y],[x,y+4],[x-5,y]],'#74394a');box(g,x-1,y-1,3,3,'#d6b686');
    }
    // Wall cabinet: small investigative archive, books and numbered folders.
    box(g,12,32,58,77,'#241f24');box(g,15,35,52,70,'#81583c');box(g,18,38,46,64,'#312d30');
    for(const y of [54,74,96]){box(g,17,y,47,3,'#ab7850');box(g,17,y+3,47,2,'#3c2528');}
    for(let row=0;row<3;row++)for(let i=0;i<11;i++){
      const x=20+i*4,y=39+row*20,h=10+(hash(i,row)%6);
      box(g,x,y+(15-h),3,h,['#8f4c43','#526e68','#b28353','#765b5e','#294e5b'][hash(row,i)%5]);
      if(i%3===0)box(g,x+1,y+15-h,1,2,'#dcb57b');
    }
    // Vintage landscape, a real object later addressable by its hotspot.
    frame(g,91,25,75,65,'#241f25','#bd8751');box(g,97,31,63,53,'#223c4b');
    box(g,99,33,59,15,'#547887');box(g,99,47,59,4,'#d6a473');
    path(g,[[99,73],[113,56],[125,61],[140,46],[159,72],[159,82],[99,82]],'#465e52');
    path(g,[[99,77],[120,67],[131,73],[151,56],[159,65],[159,82],[99,82]],'#2b4651');
    box(g,118,54,2,25,'#d0a872');box(g,121,58,1,20,'#ac855b');
    for(let i=0;i<10;i++)box(g,101+i*6,78-(hash(i,90)%8),4,2,'#77917a');
    box(g,92,89,76,2,'#231f22');
    // A moody Madrid skyline outside the real glass panes.
    frame(g,237,23,82,92,'#1b242e','#a7784c');box(g,243,29,70,79,'#142944');
    const sky=['#192d4f','#24395f','#3b4e70','#6e6176','#a36e68','#d39270'];
    sky.forEach((s,i)=>box(g,246,32+i*12,64,12,s));
    for(let i=0;i<18;i++){const x=247+hash(i,9)%61,y=36+hash(9,i)%34;box(g,x,y,1,1,'#e6c79a');}
    for(let i=0;i<13;i++){
      const x=246+i*5,h=13+(hash(i,77)%25);
      box(g,x,104-h,5,h,['#253245','#1e2837','#2b3040'][i%3]);
      for(let j=0;j<h-4;j+=5)if((i+j)%3!==0)box(g,x+2,105-h+j,1,2,'#ebc181');
    }
    box(g,243,61,73,3,'#a6774b');box(g,275,28,4,84,'#bd8956');
    box(g,241,29,3,81,'#e0a263');box(g,312,29,4,81,'#563d32');
    box(g,238,112,80,5,'#5e3a2d');box(g,242,112,73,2,'#edbb7b');
    // Copper pendant sconce and blocky luminous halo.
    for(let ring=11;ring>0;ring-=2){
      const color=ring>7?'#efb86608':ring>3?'#e5ba6512':'#f5cc7722';
      box(g,194-ring*2,47-ring*2,ring*4,ring*4,color);
    }
    box(g,194,25,3,22,'#9e724d');box(g,182,42,29,5,'#3a2a28');
    path(g,[[186,38],[206,38],[212,51],[181,51]],'#bd8758');
    box(g,188,45,19,5,'#f8d48d');box(g,190,50,14,2,'#fff1ac');
    box(g,181,51,31,2,'#724936');
    // Heavy office door; open state shares geometry and front-edge origin.
    box(g,335,23,55,99,'#241e24');box(g,337,24,50,95,'#8e5c3c');
    box(g,339,27,46,92,'#261f24');
    if(opened){
      box(g,342,32,42,82,'#0c1925');box(g,349,33,3,79,'#1e2f35');
      for(let y=45;y<106;y+=15)box(g,369,y,2,1,'#4d5253');
      path(g,[[343,30],[367,34],[371,113],[343,117]],'#593829');
      path(g,[[347,37],[362,39],[365,108],[347,110]],'#80503a');
      box(g,361,79,3,4,'#f5c477');
    }else{
      box(g,343,30,39,84,'#6d4532');
      frame(g,347,35,31,34,'#3f2a28','#906043');
      box(g,353,41,19,22,'#65402c');
      frame(g,347,73,31,35,'#3f2a28','#8a5a3e');
      box(g,352,78,21,24,'#6e452f');
      box(g,374,82,5,6,'#e5b972');box(g,375,84,2,2,'#fff0ba');
    }
    box(g,333,116,59,5,'#30232a');box(g,334,116,57,1,'#b47d56');
    // A tiny brass switch and hand-written location marker finish the room.
    box(g,324,89,6,8,'#201f23');box(g,325,90,4,5,'#cc9b65');box(g,327,91,1,2,'#392a2b');
    box(g,205,109,14,3,'#8c6550');box(g,208,107,8,2,'#282e31');
  }
  function sofa(g){
    oval(g,77,187,55,7,'#22232b99');
    // Cut silhouette and velvet cushions, outlined in dark ink.
    box(g,33,141,87,37,'#1c2d2d');box(g,37,137,79,37,'#253d3a');
    box(g,40,140,73,33,'#416961');box(g,43,143,67,27,'#4d776b');
    box(g,44,144,31,24,'#638779');box(g,77,144,31,24,'#567a6c');
    box(g,74,143,3,27,'#274f49');
    for(const x of [49,64,84,99])for(const y of [150,160]){
      box(g,x,y,3,2,'#25443f');box(g,x+1,y+1,1,1,'#cbad7c');
    }
    box(g,31,160,91,21,'#243d3b');box(g,37,160,78,17,'#618476');
    box(g,39,163,37,10,'#7d9788');box(g,78,163,35,10,'#719184');
    box(g,29,154,12,31,'#302a2a');box(g,30,154,10,28,'#5b5145');
    box(g,114,154,11,32,'#302a2a');box(g,115,155,8,28,'#665142');
    box(g,31,159,5,14,'#967354');box(g,119,159,3,16,'#a77c5c');
    box(g,35,179,84,7,'#2b3635');box(g,40,183,75,2,'#9a8a6a');
    box(g,35,183,5,11,'#47342b');box(g,111,183,5,11,'#47342b');
    box(g,35,192,5,2,'#aa8156');box(g,111,192,5,2,'#aa8156');
    for(let x=36;x<120;x+=5)box(g,x,178,1,1,'#cca16a');
  }
  function desk(g){
    oval(g,212,184,57,8,'#1d232e88');
    // Legs, panels and brass handles stay behind the top board.
    box(g,174,159,10,32,'#2c2328');box(g,177,159,7,29,'#684333');
    box(g,244,158,10,30,'#2c2328');box(g,245,160,6,28,'#795039');
    box(g,181,162,67,20,'#3a2c2b');box(g,186,162,59,14,'#744736');
    for(const x of [189,213,235]){
      box(g,x,166,19,8,'#3e292a');box(g,x+1,167,17,6,'#90583e');
      box(g,x+7,170,6,2,'#dcb373');
    }
    path(g,[[166,150],[246,149],[261,162],[174,168]],'#35282b');
    path(g,[[169,151],[245,151],[257,161],[175,165]],'#ae754d');
    path(g,[[174,152],[242,152],[252,159],[179,162]],'#c18a59');
    stroke(g,174,151,245,150,'#edc38b',1);
    box(g,174,165,85,5,'#50332b');box(g,176,165,80,1,'#bd8d60');
    // Green reading lamp, period folder, map, ceramic coffee cup.
    box(g,179,148,2,8,'#d5ab72');box(g,178,150,4,2,'#f0d188');
    path(g,[[174,146],[185,146],[188,151],[172,151]],'#1a3533');
    box(g,175,147,11,2,'#4e8171');box(g,173,151,16,1,'#d6af76');
    path(g,[[199,153],[219,152],[224,158],[203,160]],'#283e37');
    path(g,[[201,153],[217,153],[222,157],[203,158]],'#e5d5aa');
    for(let i=0;i<3;i++)stroke(g,205,154+i,215,154+i,'#958b73');
    box(g,225,152,7,5,'#51362e');box(g,227,151,7,3,'#bb8c5b');
    oval(g,241,158,5,3,'#e9dec4');oval(g,241,157,3,1,'#78513a');
    box(g,245,155,2,2,'#efe6cd');
  }
  function chair(g){
    oval(g,281,204,30,5,'#25232a88');
    box(g,260,149,5,46,'#392a2a');box(g,290,148,5,47,'#392a2a');
    box(g,262,151,32,32,'#845e44');box(g,265,154,26,25,'#2f524e');
    box(g,268,156,20,21,'#43695d');box(g,269,159,17,4,'#719183');
    for(const y of [164,172]){box(g,271,y,3,2,'#b59870');box(g,284,y,3,2,'#b59870');}
    path(g,[[259,181],[289,180],[303,190],[269,195]],'#302831');
    path(g,[[262,182],[287,182],[298,189],[269,192]],'#906847');
    path(g,[[266,183],[285,183],[294,188],[270,190]],'#be9467');
    box(g,270,193,5,14,'#533c31');box(g,296,190,5,16,'#533c31');
    box(g,270,204,6,3,'#a77953');box(g,295,203,6,3,'#a77953');
    box(g,261,188,4,11,'#6b4c3a');
  }
  function plant(g){
    oval(g,339,218,31,5,'#24252c99');
    const leaves=[[339,166,0],[324,174,2],[356,176,2],[318,186,3],[364,189,3],[332,180,1],
      [345,177,1],[328,194,4],[355,198,4],[341,187,2],[317,171,5],[364,164,5]];
    for(const [x,y,n] of leaves){
      stroke(g,338,207,x,y,'#263d35',2);
      path(g,[[x-10,y],[x-3,y-5-n%2],[x+7,y-7],[x+11,y-3],[x+6,y+3],[x-4,y+5]],'#28443d');
      path(g,[[x-8,y-1],[x,y-5],[x+8,y-5],[x+5,y+1],[x-4,y+3]],['#41694f','#4e7656','#567b64'][n%3]);
      box(g,x-3,y-3,6,2,'#769574');
    }
    box(g,329,194,24,5,'#342a2b');box(g,327,196,28,4,'#ac7b53');
    path(g,[[331,200],[352,200],[349,217],[335,217]],'#3d4444');
    path(g,[[333,200],[349,200],[347,215],[336,215]],'#44685f');
    box(g,335,203,12,2,'#a7b59b');box(g,337,208,9,2,'#d1bd83');
    box(g,335,216,14,3,'#222c31');box(g,338,217,9,1,'#ba925f');
    for(const [x,y] of [[319,179],[357,167],[329,183],[348,190]]){
      box(g,x,y,3,3,'#c9ac85');box(g,x+1,y-1,1,1,'#f2d6aa');
    }
  }
  function note(g){
    oval(g,246,208,18,3,'#1e252a77');
    path(g,[[236,198],[251,197],[261,203],[245,209]],'#3a2d2b');
    path(g,[[237,197],[251,196],[259,202],[245,207]],'#d2b88d');
    path(g,[[238,197],[250,197],[256,200],[245,204]],'#f3dfb6');
    stroke(g,241,199,250,201,'#a88b73');stroke(g,241,202,251,202,'#bd9f7c');
    box(g,248,203,4,3,'#a34b42');box(g,249,204,2,1,'#e5ab83');
  }
  const regions={room:[0,0,400,225],roomOpen:[0,0,400,225],
    sofa:[27,133,101,64],desk:[156,137,109,60],chair:[251,143,56,68],
    plant:[304,148,71,77],note:[230,190,39,26]};
  function render(name){
    const [x,y,w,h]=regions[name],canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;g.translate(-x,-y);
    ({room:()=>room(g,false),roomOpen:()=>room(g,true),sofa:()=>sofa(g),desk:()=>desk(g),
      chair:()=>chair(g),plant:()=>plant(g),note:()=>note(g)})[name]();
    return {canvas,x,y,w,h};
  }
  const cache={};
  window.EnglishSpyPixelRoom={
    draw(ctx,name){const s=cache[name]||(cache[name]=render(name));
      ctx.save();ctx.imageSmoothingEnabled=false;
      ctx.drawImage(s.canvas,s.x*SCALE,s.y*SCALE,s.w*SCALE,s.h*SCALE);
      ctx.restore();},
    resolution:{width:WIDTH,height:HEIGHT,scale:SCALE}
  };
})();
