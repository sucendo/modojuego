(function(root){
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  class LabelLayer{
    constructor({state,camera,canvas,getLayer,resolver,categoryVisible}={}){
      this.state=state;this.camera=camera;this.canvas=canvas;this.getLayer=getLayer;this.resolver=resolver;this.categoryVisible=categoryVisible;
    }
    update(){
      const s=this.state,layer=this.getLayer?.();if(!layer)return 0;
      layer.style.display=s.showLabels?"block":"none";
      if(!s.showLabels)return 0;
      const rect=this.canvas.getBoundingClientRect(),candidates=[];
      for(const b of s.bodies||[]){
        if(!b.label||!b.mesh)continue;
        const p=b.mesh.position.clone().project(this.camera),visible=this.categoryVisible?.(b)&&this.resolver.labelVisible(b)&&p.z>-1&&p.z<1&&Math.abs(p.x)<1.15&&Math.abs(p.y)<1.15;
        b.label.style.display="none";if(!visible)continue;
        const x=(p.x*.5+.5)*rect.width,y=(-p.y*.5+.5)*rect.height;
        b.label.textContent=b.name;b.label.className=`bodyLabel ${b.kind==="star"?"star":""} ${s.selected===b.id?"selected":""}`;
        const w=Math.max(30,Math.min(220,String(b.name||"").length*7.2+8)),h=17;
        candidates.push({b,x,y,priority:this.resolver.priority(b),box:{l:x-w/2,r:x+w/2,t:y-h-8,b:y+2}});
      }
      candidates.sort((a,b)=>b.priority-a.priority);
      const accepted=[];
      for(const c of candidates){
        const collision=accepted.some(a=>this.resolver.boxesOverlap(c.box,a.box));
        if(collision&&c.b.id!==s.selected){c.b.label.style.display="none";continue}
        c.b.label.style.display="block";c.b.label.style.left=`${c.x}px`;c.b.label.style.top=`${c.y}px`;accepted.push(c);
      }
      return accepted.length;
    }
  }
  ns.LabelLayer=LabelLayer;
})(window);
