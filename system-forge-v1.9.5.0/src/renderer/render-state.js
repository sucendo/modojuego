(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
class RenderStateCache{
  constructor(){this.key=null;this.value=null}
  invalidate(){this.key=null;this.value=null}
  get(key,builder){
    if(this.key===key&&this.value)return this.value;
    this.key=key;this.value=builder();return this.value;
  }
}
core.RenderStateCache=RenderStateCache;
})();