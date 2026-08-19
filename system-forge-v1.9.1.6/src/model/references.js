(function(){
"use strict";
const core=window.SystemForgeCore=window.SystemForgeCore||{};
const uid=()=>crypto.randomUUID();
const cleanMembers=ids=>[...new Set((ids||[]).filter(Boolean))];

function createBarycenter(name,memberIds,extra={}){
  return {
    id:extra.id||uid(),type:"barycenter",
    name:(name||"Baricentro").trim()||"Baricentro",
    memberIds:cleanMembers(memberIds),
    notes:extra.notes||"",createdBy:extra.createdBy||"system-forge"
  };
}
function normalize(refs){
  const out=[];
  for(const r of refs||[]){
    if(!r)continue;
    const memberIds=cleanMembers(r.memberIds||r.members||r.orbitCenterIds);
    if(memberIds.length<2)continue;
    out.push(createBarycenter(r.name||"Baricentro",memberIds,{...r,id:r.id}));
  }
  return out;
}
function sameMembers(a,b){
  const aa=cleanMembers(a).sort(),bb=cleanMembers(b).sort();
  return aa.length===bb.length&&aa.every((x,i)=>x===bb[i]);
}
function ensureLegacyReferences(bodies,refs){
  const references=normalize(refs);
  for(const b of bodies||[]){
    const ids=cleanMembers(b.orbitCenterIds);
    if(ids.length<2)continue;
    let ref=references.find(r=>sameMembers(r.memberIds,ids));
    if(!ref){
      ref=createBarycenter(b.orbitReferenceName||"Baricentro",ids,{createdBy:"legacy-migration"});
      references.push(ref);
    }
    if(!b.orbitReferenceId)b.orbitReferenceId=ref.id;
    if(!b.orbitReferenceName)b.orbitReferenceName=ref.name;
  }
  return references;
}
function serialize(refs){
  return normalize(refs).map(r=>({
    id:r.id,type:"barycenter",name:r.name,memberIds:[...r.memberIds],
    notes:r.notes||"",createdBy:r.createdBy||"system-forge"
  }));
}
core.ReferenceRegistry={createBarycenter,normalize,ensureLegacyReferences,serialize,sameMembers};
})();