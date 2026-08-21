(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
class PreferenceStore{
  constructor({key,legacyKeys=[],defaults={},storage=null}={}){this.key=key||"system-forge-preferences";this.legacyKeys=[...legacyKeys];this.defaults={...defaults};this.storage=storage||globalThis.localStorage;this.values=this.load()}
  load(){let raw=null;try{raw=this.storage?.getItem?.(this.key)||null;if(!raw){for(const k of this.legacyKeys){raw=this.storage?.getItem?.(k)||null;if(raw)break}}const parsed=raw?JSON.parse(raw):null;return {...this.defaults,...(parsed&&typeof parsed==="object"?parsed:{})}}catch{return {...this.defaults}}}
  save(){try{this.storage?.setItem?.(this.key,JSON.stringify(this.values))}catch{}return this.values}
  get(key){return this.values[key]}
  set(key,value){this.values[key]=value;this.save();return value}
  setBoolean(key,value){return this.set(key,!!value)}
  setNumber(key,value,min=-Infinity,max=Infinity){const n=Number(value),fallback=Number(this.defaults[key]);const safe=Number.isFinite(n)?n:(Number.isFinite(fallback)?fallback:0);return this.set(key,Math.max(min,Math.min(max,safe)))}
  snapshot(){return {...this.values}}
}
core.PreferenceStore=PreferenceStore;
})();
