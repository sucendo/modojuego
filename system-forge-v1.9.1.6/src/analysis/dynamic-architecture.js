(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{},G=4*Math.PI*Math.PI;
const norm=a=>Math.hypot(a[0],a[1],a[2]),sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mass=b=>Number(b.massSolar)||0;
function barycenter(items){let M=0,p=[0,0,0],v=[0,0,0];for(const b of items){const m=mass(b);if(!(m>0))continue;M+=m;for(let k=0;k<3;k++){p[k]+=b.pos[k]*m;v[k]+=b.vel[k]*m}}if(M)for(let k=0;k<3;k++){p[k]/=M;v[k]/=M}return{mass:M,pos:p,vel:v}}
function energyTo(b,h){const r=sub(b.pos,h.pos),v=sub(b.vel,h.vel),R=norm(r);return R>0&&h.mass>0?.5*(v[0]**2+v[1]**2+v[2]**2)-G*(h.mass+mass(b))/R:Infinity}
function elemsTo(b,h){const OD=core.OrbitalDynamics;if(!OD)return null;return OD.elementsFromState(sub(b.pos,h.pos),sub(b.vel,h.vel),G*(h.mass+mass(b)))}
function maxStarSeparation(stars){let m=0;for(let i=0;i<stars.length;i++)for(let j=i+1;j<stars.length;j++)m=Math.max(m,norm(sub(stars[i].pos,stars[j].pos)));return m}
function classify(input){
  const bodies=input.bodies||[],byId=new Map(bodies.map(b=>[b.id,b])),stars=bodies.filter(b=>b.kind==="star"&&mass(b)>0),items=[],bc=stars.length?barycenter(stars):null,maxSep=maxStarSeparation(stars);
  for(const b of bodies){
    if(!["planet","moon"].includes(b.kind))continue;
    const parent=byId.get(b.parent);if(!parent||!(mass(parent)>0))continue;
    const host={mass:mass(parent),pos:parent.pos,vel:parent.vel,name:parent.name,id:parent.id},E=energyTo(b,host),el=elemsTo(b,host),bound=E<0&&el&&el.aAU>0&&el.e<1;
    if(parent.kind==="star"){
      if(bound){
        if(stars.length>1){
          let sep=Infinity;for(const s of stars)if(s.id!==parent.id)sep=Math.min(sep,norm(sub(parent.pos,s.pos)));
          if(Number.isFinite(sep)&&sep>0&&Number.isFinite(el.apoAU)){
            const ratio=el.apoAU/sep;
            if(ratio>.35)items.push({bodyId:b.id,body:b.name,level:"bad",type:"s-type-severe",short:"S-type excitada",ratio,text:`${b.name}: órbita S-type gravemente excitada; el apoastro osculante alcanza ${(ratio*100).toFixed(0)} % de la separación estelar actual.`});
            else if(ratio>.22)items.push({bodyId:b.id,body:b.name,level:"warn",type:"s-type-edge",short:"S-type límite",ratio,text:`${b.name}: órbita S-type cerca de una región fuertemente perturbada; el apoastro alcanza ${(ratio*100).toFixed(0)} % de la separación estelar actual.`});
          }
        }
        continue;
      }
      let alt=null;
      for(const s of stars){
        if(s.id===parent.id)continue;
        const hs={mass:mass(s),pos:s.pos,vel:s.vel,name:s.name,id:s.id},Ee=energyTo(b,hs),ee=elemsTo(b,hs),d=norm(sub(b.pos,s.pos));
        if(Ee<0&&ee&&ee.aAU>0&&ee.e<1&&(!alt||Ee<alt.energy))alt={star:s,energy:Ee,elements:ee,distanceAU:d};
      }
      const global=bc&&bc.mass>0?{mass:bc.mass,pos:bc.pos,vel:bc.vel,name:"baricentro estelar"}:null,Eg=global?energyTo(b,global):Infinity,eg=global?elemsTo(b,global):null,rG=global?norm(sub(b.pos,global.pos)):Infinity;
      if(alt&&maxSep>0&&alt.distanceAU<.30*maxSep)items.push({bodyId:b.id,body:b.name,level:"bad",type:"stellar-transfer",short:`→ ${alt.star.name}`,text:`${b.name}: ha perdido el vínculo con ${parent.name} y es compatible con una transferencia temporal hacia ${alt.star.name}.`});
      else if(Eg<0&&eg&&eg.aAU>0&&eg.e<1)items.push({bodyId:b.id,body:b.name,level:"bad",type:"circumstellar-to-barycentric",short:"P-type ?",text:`${b.name}: ya no está ligado a ${parent.name}; permanece ligado al sistema estelar en aproximación baricéntrica${maxSep>0&&rG/maxSep>1.5?", compatible con una transición P-type/circumbinaria":""}.`});
      else{
        const rv=global?sub(b.pos,global.pos):sub(b.pos,parent.pos),vv=global?sub(b.vel,global.vel):sub(b.vel,parent.vel),R=norm(rv),radial=R>0?(rv[0]*vv[0]+rv[1]*vv[1]+rv[2]*vv[2])/R:0;
        items.push({bodyId:b.id,body:b.name,level:"bad",type:"system-ejection",short:"eyección ?",text:`${b.name}: no está ligado a ${parent.name} ni al conjunto estelar en la aproximación baricéntrica; ${radial>0?"se aleja y ":""}es candidato a eyección del sistema.`});
      }
    }else if(parent.kind==="planet"&&!bound)items.push({bodyId:b.id,body:b.name,level:"bad",type:"satellite-unbound",short:"satélite desligado",text:`${b.name}: el estado N-body actual ya no corresponde a una órbita ligada alrededor de ${parent.name}.`});
  }
  return{items,bad:items.filter(x=>x.level==="bad").length,warn:items.filter(x=>x.level==="warn").length,severe:items.some(x=>x.level==="bad")};
}
core.DynamicArchitecture={classify,barycenter,energyTo};
})();