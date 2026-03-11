(function(global){
  "use strict";
  const BABYLON = global.BABYLON;
  const EPS=1e-6;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function buildOceanPatch(basePos, indices, radii, seaR){
    const outPos=[]; const outIdx=[]; const map=new Map(); let next=0;
    function addVert(oldI){
      let ni=map.get(oldI); if(ni!==undefined) return ni;
      const x=basePos[oldI*3], y=basePos[oldI*3+1], z=basePos[oldI*3+2];
      const inv=1/Math.max(EPS, Math.sqrt(x*x+y*y+z*z));
      outPos.push(x*inv*seaR, y*inv*seaR, z*inv*seaR);
      ni=next++; map.set(oldI,ni); return ni;
    }
    for(let t=0;t<indices.length;t+=3){
      const a=indices[t], b=indices[t+1], c=indices[t+2];
      if(radii[a]<=seaR && radii[b]<=seaR && radii[c]<=seaR){
        outIdx.push(addVert(a), addVert(b), addVert(c));
      }
    }
    return {positions:new Float32Array(outPos), indices:new Uint32Array(outIdx)};
  }

  function ensureOcean(gen){
    if(gen.seaMesh) return gen.seaMesh;
    const m=new BABYLON.Mesh("ocean", gen.scene);
    m.isPickable=false;
    m.renderingGroupId=1;

    const mat=new BABYLON.PBRMaterial("oceanMat", gen.scene);
    mat.metallic=0.0;
    mat.roughness=0.18;
    mat.specularIntensity=0.9;
    mat.alpha=1.0;
    mat.backFaceCulling=true;
    mat.clearCoat.isEnabled=true;
    mat.clearCoat.intensity=0.8;
    mat.clearCoat.roughness=0.12;
    mat.needDepthPrePass=true;
    if(typeof mat.forceDepthWrite!=="undefined") mat.forceDepthWrite=true;

    m.material=mat;
    gen.seaMesh=m;
    return m;
  }

  function updateSea(gen, params){
    if(!params.seaEnabled){ if(gen.seaMesh) gen.seaMesh.setEnabled(false); return; }
    const seaMesh=ensureOcean(gen);
    seaMesh.setEnabled(true);

    const seaR=gen.radius*(1+(params.seaLevel||0));
    const patch=buildOceanPatch(gen.basePositions, gen.indices, gen.vertexRadii, seaR);
    seaMesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, patch.positions, true);
    seaMesh.setIndices(Array.from(patch.indices));

    const nrm=new Float32Array(patch.positions.length);
    if(patch.indices.length>0) BABYLON.VertexData.ComputeNormals(patch.positions, patch.indices, nrm);
    seaMesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, nrm, true);

    const mat=seaMesh.material;
    mat.albedoColor = BABYLON.Color3.FromHexString(params.seaColor||"#10314a");
    mat.alpha = clamp(params.seaAlpha ?? 1.0, 0, 1);
    mat.roughness = clamp(params.seaRoughness ?? 0.18, 0.02, 1.0);
    mat.specularIntensity = clamp(params.seaSpecular ?? 0.9, 0, 2.0);
    mat.zOffset = (params.seaZOffset ?? 0);

    if(mat.alpha<0.999){
      mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHABLEND;
      mat.needDepthPrePass=true;
      if(typeof mat.forceDepthWrite!=="undefined") mat.forceDepthWrite=true;
    } else {
      mat.transparencyMode=BABYLON.Material.MATERIAL_OPAQUE;
    }

    if(params.seaRoughNoise>0){
      const n = (Math.sin(performance.now()*0.001*0.2)*0.5+0.5);
      mat.roughness = clamp(mat.roughness + (n-0.5)*params.seaRoughNoise, 0.02, 1.0);
    }
  }

  global.OceanSystem={ updateSea };
})(window);
