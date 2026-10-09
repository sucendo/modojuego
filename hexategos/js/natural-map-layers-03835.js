'use strict';
/* HEXATEGOS 0.38.35 · Lectura segura de futuras capas de mapa.
   No añade overlays ni consultas globales por frame; cada hexágono sólo se
   consulta si una capa llega a utilizarse. Nunca revela depósitos ocultos. */
(() => {
  const TYPES=['agriculture','livestock','forestry','mining','energy','discovered'];
  function sample(cell,type){
    if(!TYPES.includes(type))return null;
    const natural=window.HexategosNaturalPotential03829;
    const profile=natural?.profile?.(Number(cell));
    if(!profile)return null;
    if(type==='discovered'){
      const api=window.HexategosProspection03831;
      const result=api?.result?.(Number(cell));
      return result?{status:'prospectado',resources:{...result}}:
        {status:'sin prospectar',resources:null};
    }
    const key={agriculture:'food',livestock:'livestock',
      forestry:'forest',mining:'mineral',energy:'energy'}[type];
    return {status:'estimación',category:natural.category(profile[key])};
  }
  window.HexategosNaturalMapLayers03835=Object.freeze({
    version:'0.38.35',layers:()=>TYPES.slice(),sample
  });
})();
