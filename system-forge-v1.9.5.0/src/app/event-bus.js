(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
class EventBus{
  constructor(){this._listeners=new Map()}
  on(type,fn){if(typeof fn!=="function")return()=>{};if(!this._listeners.has(type))this._listeners.set(type,new Set());this._listeners.get(type).add(fn);return()=>this.off(type,fn)}
  once(type,fn){const off=this.on(type,payload=>{off();fn(payload)});return off}
  off(type,fn){const set=this._listeners.get(type);if(!set)return;set.delete(fn);if(!set.size)this._listeners.delete(type)}
  emit(type,payload){const set=this._listeners.get(type);if(!set)return;for(const fn of [...set]){try{fn(payload)}catch(err){console.error(`System Forge event '${type}'`,err)}}}
  clear(type=null){if(type==null)this._listeners.clear();else this._listeners.delete(type)}
}
core.EventBus=EventBus;
})();
