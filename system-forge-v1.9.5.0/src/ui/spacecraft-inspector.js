(function(root){
  "use strict";
  const ns=root.SystemForgeCore=root.SystemForgeCore||{};
  class SpacecraftInspectorSupport{
    constructor({model,getElement,escapeHtml,earthRadiusKm}={}){Object.assign(this,{model,getElement,escapeHtml,earthRadiusKm})}
    render(b){
      const esc=this.escapeHtml||String,M=this.model;
      return `<div class="sourceCard" style="margin-top:8px"><b>Vehículo espacial · Spacecraft I · v1.9.5.0</b><div class="grid2" style="margin-top:7px"><div><label>Clase</label><select id="spacecraftClassSelect" class="field">${M.classes.map(([v,l])=>`<option value="${v}" ${(b.spacecraftClass||"other")===v?"selected":""}>${l}</option>`).join("")}</select></div><div><label>Estado misión</label><select id="missionStatusSelect" class="field">${[["planned","planificada"],["active","activa"],["inactive","inactiva"],["completed","completada"],["lost","perdida"]].map(([v,l])=>`<option value="${v}" ${(b.missionStatus||"planned")===v?"selected":""}>${l}</option>`).join("")}</select></div><div><label>Misión</label><input id="missionNameInput" class="field" value="${esc(b.missionName||"")}"></div><div><label>Operador</label><input id="operatorInput" class="field" value="${esc(b.operator||"")}"></div><div><label>Masa seca/base (kg)</label><input id="dryMassKgInput" class="field" type="number" step="any" value="${b.dryMassKg??0}"></div><div><label>Propelente (kg)</label><input id="propellantMassKgInput" class="field" type="number" step="any" value="${b.propellantMassKg??0}"></div><div><label>Tamaño característico (m)</label><input id="characteristicSizeMInput" class="field" type="number" step="any" value="${b.characteristicSizeM??10}"></div><div><label>Tripulación máxima</label><input id="crewCapacityInput" class="field" type="number" step="1" value="${b.crewCapacity??0}"></div><div class="full"><label>Propulsión</label><input id="propulsionTypeInput" class="field" value="${esc(b.propulsionType||"")}"></div></div><div class="miniNote">Spacecraft I: el vehículo ya participa como cuerpo balístico en la gravedad y fast-time. Maniobras, empuje, consumo dinámico de propelente, drag/reboost y assets 3D quedan para Spacecraft II.</div></div>`;
    }
    apply(b){
      const el=this.getElement,M=this.model;if(!b||b.kind!=="spacecraft"||!el?.("spacecraftClassSelect"))return false;
      b.spacecraftClass=el("spacecraftClassSelect").value;b.missionStatus=el("missionStatusSelect")?.value||"planned";b.missionName=el("missionNameInput")?.value.trim()||"";b.operator=el("operatorInput")?.value.trim()||"";b.dryMassKg=Math.max(0,+el("dryMassKgInput")?.value||0);b.propellantMassKg=Math.max(0,+el("propellantMassKgInput")?.value||0);b.characteristicSizeM=Math.max(.01,+el("characteristicSizeMInput")?.value||10);b.crewCapacity=Math.max(0,Math.round(+el("crewCapacityInput")?.value||0));b.propulsionType=el("propulsionTypeInput")?.value.trim()||"";b.massEarth=M.massEarthFromKg(M.totalMassKg(b));b.massSolar=null;b.radiusEarth=M.defaultRadiusKm(b)/this.earthRadiusKm;b.planetClass=M.classLabel(b.spacecraftClass);return true;
    }
  }
  ns.SpacecraftInspectorSupport=SpacecraftInspectorSupport;
})(window);
