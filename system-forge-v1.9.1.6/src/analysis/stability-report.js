(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
core.buildStabilityReport=function(data){
  const issues=data.issues||[],warnings=data.warnings||[],notes=data.notes||[],resonances=data.resonances||[];
  let state="SIN CONFLICTOS GRAVES",cls="ok";
  if(issues.length){state="CONFLICTO FÍSICO";cls="bad"} else if(warnings.length){state="REVISAR MODELO";cls="warn"}
  return {state,cls,counts:{issues:issues.length,warnings:warnings.length,notes:notes.length,resonances:resonances.length},
    explanations:[...issues.map(text=>({level:"bad",text})),...warnings.map(text=>({level:"warn",text})),...notes.map(text=>({level:"info",text}))]};
};
})();