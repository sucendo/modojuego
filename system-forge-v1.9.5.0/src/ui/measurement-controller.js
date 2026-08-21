(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  class MeasurementController{
    constructor(ctx={}){
      Object.assign(this,ctx);this.aId=null;this.bId=null;this.pickMode=null;this.visible=false;this.line=null;this.lastResult=null;this._offSelect=null;this._bodySignature="";
    }
    el(id){return this.getElement?.(id)}
    bodies(){return (this.state?.bodies||[]).filter(b=>b.kind!=="structure"&&!b.hideInTree)}
    body(id){return this.state?.bodies?.find(b=>b.id===id)||null}
    fmtDistance(km){
      if(!Number.isFinite(km))return "—";
      if(km<1)return `${(km*1000).toLocaleString("es-ES",{maximumFractionDigits:0})} m`;
      if(km<1e6)return `${km.toLocaleString("es-ES",{maximumFractionDigits:1})} km`;
      const au=km/this.AU_KM;if(au<.1)return `${(km/1e6).toLocaleString("es-ES",{maximumFractionDigits:3})} M km`;
      return `${au.toLocaleString("es-ES",{maximumFractionDigits:6})} UA`;
    }
    fmtLight(sec){
      if(!Number.isFinite(sec))return "—";if(sec<60)return `${sec.toLocaleString("es-ES",{maximumFractionDigits:3})} s`;
      if(sec<3600)return `${(sec/60).toLocaleString("es-ES",{maximumFractionDigits:2})} min`;
      if(sec<86400)return `${(sec/3600).toLocaleString("es-ES",{maximumFractionDigits:2})} h`;
      return `${(sec/86400).toLocaleString("es-ES",{maximumFractionDigits:2})} días`;
    }
    fmtSpeed(v){return Number.isFinite(v)?`${v.toLocaleString("es-ES",{maximumFractionDigits:4})} km/s`:"—"}
    fmtAU(v){return Number.isFinite(v)?`${v.toLocaleString("es-ES",{maximumFractionDigits:7})} UA`:"—"}
    fmtYears(v){
      if(!Number.isFinite(v))return "—";if(v<1/365.25)return `${(v*365.25*24).toLocaleString("es-ES",{maximumFractionDigits:2})} h`;
      if(v<1)return `${(v*365.25).toLocaleString("es-ES",{maximumFractionDigits:3})} d`;
      return `${v.toLocaleString("es-ES",{maximumFractionDigits:5})} años`;
    }
    refreshOptions(){
      const bodies=this.bodies(),make=id=>bodies.map(b=>`<option value="${b.id}" ${b.id===id?"selected":""}>${b.name}</option>`).join("");
      const A=this.el("measureASelect"),B=this.el("measureBSelect");if(A)A.innerHTML=make(this.aId);if(B)B.innerHTML=make(this.bId);
      if(A&&this.aId)A.value=this.aId;if(B&&this.bId)B.value=this.bId;
      this._bodySignature=bodies.map(b=>b.id).join("|");
    }
    syncBodies(){
      const bodies=this.bodies(),signature=bodies.map(b=>b.id).join("|");
      if(signature===this._bodySignature)return;
      const ids=new Set(bodies.map(b=>b.id));
      if(!ids.has(this.aId))this.aId=null;if(!ids.has(this.bId))this.bId=null;
      this.chooseDefaults();
      if(this.aId===this.bId)this.bId=bodies.find(x=>x.id!==this.aId)?.id||null;
      this.refreshOptions();
    }
    chooseDefaults(){
      const selected=this.body(this.state?.selected),bodies=this.bodies();if(!bodies.length)return;
      if(!this.aId&&!this.bId&&selected){const p=selected.parent?this.body(selected.parent):null;if(p){this.aId=p.id;this.bId=selected.id}else{this.aId=selected.id;this.bId=bodies.find(x=>x.id!==selected.id)?.id||null}}
      if(!this.aId)this.aId=bodies[0]?.id||null;if(!this.bId)this.bId=bodies.find(x=>x.id!==this.aId)?.id||null;
    }
    setPair(a,b){if(a)this.aId=a;if(b)this.bId=b;if(this.aId===this.bId){this.bId=this.bodies().find(x=>x.id!==this.aId)?.id||null}this.refreshOptions();this.update()}
    open(){this.onOpen?.();this.visible=true;this.chooseDefaults();this.refreshOptions();this.el("measurementPanel")?.classList.add("open");this.update()}
    close(){this.visible=false;this.pickMode=null;this.el("measurementPanel")?.classList.remove("open");this.el("measureLineLabel")?.classList.remove("open");if(this.line)this.line.visible=false;this.syncPickButtons()}
    arm(side){this.pickMode=this.pickMode===side?null:side;this.syncPickButtons()}
    syncPickButtons(){for(const side of ["A","B"]){const n=this.el(`measurePick${side}`);if(n){const on=this.pickMode===side;n.classList.toggle("primary",on);n.textContent=on?`Selecciona ${side}…`:`${side} ← selección`}}}
    install(){
      this.el("openMeasureTool")?.addEventListener("click",()=>this.open());this.el("measurementClose")?.addEventListener("click",()=>this.close());
      this.el("measureASelect")?.addEventListener("change",e=>{this.aId=e.target.value;this.update()});this.el("measureBSelect")?.addEventListener("change",e=>{this.bId=e.target.value;this.update()});
      this.el("measurePickA")?.addEventListener("click",()=>this.arm("A"));this.el("measurePickB")?.addEventListener("click",()=>this.arm("B"));
      this.el("measureSwap")?.addEventListener("click",()=>{[this.aId,this.bId]=[this.bId,this.aId];this.refreshOptions();this.update()});
      this.el("measureCenterA")?.addEventListener("click",()=>this.aId&&this.focusBody?.(this.aId,true));this.el("measureCenterB")?.addEventListener("click",()=>this.bId&&this.focusBody?.(this.bId,true));
      this._offSelect=this.appEvents?.on?.("body:selected",p=>{if(!this.pickMode||!p?.id)return;const side=this.pickMode;this.pickMode=null;if(side==="A")this.aId=p.id;else this.bId=p.id;if(this.aId===this.bId){if(side==="A")this.bId=this.bodies().find(x=>x.id!==this.aId)?.id||null;else this.aId=this.bodies().find(x=>x.id!==this.bId)?.id||null}this.refreshOptions();this.syncPickButtons();this.update()});
      this.syncPickButtons();
    }
    ensureLine(){
      if(this.line)return this.line;const geometry=new this.THREE.BufferGeometry().setFromPoints([new this.THREE.Vector3(),new this.THREE.Vector3()]);const material=new this.THREE.LineBasicMaterial({color:0x79d4ff,transparent:true,opacity:.78,depthTest:false,depthWrite:false});this.line=new this.THREE.Line(geometry,material);this.line.renderOrder=999;this.line.userData.selectable3D=false;this.scene.add(this.line);return this.line;
    }
    renderResult(r){
      const set=(id,v)=>{const n=this.el(id);if(n)n.textContent=v};const e=r?.elements;
      set("measureDistance",r?this.fmtDistance(r.distanceKm):"—");set("measureLight",r?this.fmtLight(r.lightTimeSeconds):"—");set("measureRelativeSpeed",r?this.fmtSpeed(r.relativeSpeedKms):"—");set("measureRadialSpeed",r?this.fmtSpeed(r.radialSpeedKms):"—");set("measureTangentialSpeed",r?this.fmtSpeed(r.tangentialSpeedKms):"—");
      set("measureBound",r?(r.totalMassSolar<=0?"sin masa de referencia":r.bound?"Ligado":"No ligado / escape"):"—");
      set("measureEnergy",r&&Number.isFinite(r.specificEnergyKm2S2)?`${r.specificEnergyKm2S2.toLocaleString("es-ES",{maximumSignificantDigits:6})} km²/s²`:"—");
      set("measureAngular",r&&Number.isFinite(r.specificAngularMomentumKm2S)?`${r.specificAngularMomentumKm2S.toLocaleString("es-ES",{maximumSignificantDigits:6})} km²/s`:"—");
      set("measureA",e?this.fmtAU(e.aAU):"—");set("measureE",e?e.e.toLocaleString("es-ES",{maximumFractionDigits:7}):"—");set("measureI",e?`${e.iDeg.toLocaleString("es-ES",{maximumFractionDigits:4})}°`:"—");set("measurePeri",e?this.fmtAU(e.periAU):"—");set("measureApo",e?.apoAU!=null?this.fmtAU(e.apoAU):"—");set("measurePeriod",e?.periodYears?this.fmtYears(e.periodYears):"—");
      const state=this.el("measureBound");if(state){state.classList.toggle("ok",!!r?.bound);state.classList.toggle("warn",!!r&&!r.bound)}
    }
    updateLine(a,b,r){
      const show=!!this.el("measureShowLine")?.checked;if(!this.visible||!show||!a||!b){if(this.line)this.line.visible=false;this.el("measureLineLabel")?.classList.remove("open");return}
      const disp=this.computeDisplayPositions?.(),pa=disp?.get(a.id),pb=disp?.get(b.id);if(!pa||!pb)return;
      const line=this.ensureLine();line.geometry.setFromPoints([pa,pb]);line.visible=true;
      const label=this.el("measureLineLabel"),showLabel=!!this.el("measureShowLabel")?.checked;if(!label||!showLabel){label?.classList.remove("open");return}
      const mid=pa.clone().add(pb).multiplyScalar(.5).project(this.camera),rect=this.canvas.getBoundingClientRect();if(mid.z<-1||mid.z>1){label.classList.remove("open");return}label.textContent=this.fmtDistance(r.distanceKm);label.style.left=`${(mid.x*.5+.5)*rect.width}px`;label.style.top=`${(-mid.y*.5+.5)*rect.height}px`;label.classList.add("open");
    }
    update(){
      if(!this.visible)return null;this.syncBodies();const a=this.body(this.aId),b=this.body(this.bId);if(!a||!b||a===b){this.renderResult(null);this.updateLine(null,null,null);return null}
      const r=this.engine.compute(a,b);this.lastResult=r;this.renderResult(r);this.updateLine(a,b,r);return r;
    }
  }
  ns.MeasurementController=MeasurementController;
})(window);
