(function(root){
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  class OverlayPriorityResolver{
    constructor({state,categoryVisible,isDwarfPlanet,isCometMinor,massSolar}={}){
      this.state=state;
      this.categoryVisible=categoryVisible;
      this.isDwarfPlanet=isDwarfPlanet;
      this.isCometMinor=isCometMinor;
      this.massSolar=massSolar;
    }
    categoryKey(b){
      if(b?.kind==="star")return "stars";
      if(b?.kind==="planet")return this.isDwarfPlanet?.(b)?"dwarfs":"planets";
      if(b?.kind==="moon")return "moons";
      if(b?.kind==="spacecraft")return "spacecraft";
      if(this.isCometMinor?.(b))return "comets";
      if(b?.kind==="minor")return "minors";
      return null;
    }
    labelVisible(b){
      const s=this.state;
      if(!b||b.kind==="structure"||b.hideInTree||!s?.showLabels||!this.categoryVisible?.(b))return false;
      if(b.id===s.selected&&s.labelCategories?.has("selected"))return true;
      const key=this.categoryKey(b);return !!key&&s.labelCategories?.has(key);
    }
    markerCategoryVisible(b){
      const s=this.state;
      if(!b||b.kind==="structure"||!this.categoryVisible?.(b))return false;
      if(b.id===s.selected&&s.labelCategories?.has("selected"))return true;
      const key=this.categoryKey(b);return !!key&&s.labelCategories?.has(key);
    }
    descendantCount(id){
      const bodies=this.state?.bodies||[];let count=0,front=[id],seen=new Set([id]);
      while(front.length){const cur=front.pop();for(const x of bodies){if(x.parent===cur&&!seen.has(x.id)){seen.add(x.id);front.push(x.id);count++}}}
      return count;
    }
    priority(b){
      const s=this.state,bodies=s?.bodies||[];
      if(!b)return -Infinity;
      if(b.id===s?.selected)return 1e12;
      const descendants=this.descendantCount(b.id),direct=bodies.filter(x=>x.parent===b.id).length;
      const kindRank=b.kind==="star"?5:b.kind==="planet"?(this.isDwarfPlanet?.(b)?3.6:4):b.kind==="moon"?2:b.kind==="spacecraft"?1.5:b.kind==="minor"?1:0;
      const mass=Number(this.massSolar?.(b))||0,massRank=Math.log10(Math.max(1e-15,mass)+1e-15);
      return descendants*1e7+direct*1e6+kindRank*1e5+massRank*10;
    }
    boxesOverlap(a,b,pad=4){return OverlayPriorityResolver.boxesOverlap(a,b,pad)}
    static boxesOverlap(a,b,pad=4){return !(a.r+pad<b.l||b.r+pad<a.l||a.b+pad<b.t||b.b+pad<a.t)}
  }
  ns.OverlayPriorityResolver=OverlayPriorityResolver;
})(window);
