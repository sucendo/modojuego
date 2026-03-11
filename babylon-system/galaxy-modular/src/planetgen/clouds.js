(function(global){
  "use strict";
  const BABYLON=global.BABYLON;
  const EPS=1e-6;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function ensureCloudLayer(gen, params){
    if(!params.cloudLayerEnabled){ if(gen.cloudMesh) gen.cloudMesh.setEnabled(false); return; }
    const scene=gen.scene;

    if(!gen.cloudMesh){
      gen.cloudMesh = BABYLON.MeshBuilder.CreateIcoSphere("cloudLayer", {radius:1, subdivisions:clamp(params.cloudSubdiv??5,2,8), updatable:false}, scene);
      gen.cloudMesh.isPickable=false;
      gen.cloudMesh.renderingGroupId=2;
      gen.cloudMesh.alwaysSelectAsActiveMesh=true;
      if(gen.planetMesh){ gen.cloudMesh.parent=gen.planetMesh; gen.cloudMesh.position.set(0,0,0); }

      const mat=new BABYLON.StandardMaterial("cloudMat", scene);
      mat.backFaceCulling=true;
      mat.specularColor=new BABYLON.Color3(0,0,0);
      mat.needDepthPrePass=true;
      mat.transparencyMode=BABYLON.Material.MATERIAL_ALPHATESTANDBLEND;
      mat.useAlphaFromDiffuseTexture=true;
      mat.alphaCutOff=clamp(params.cloudAlphaCutoff??0.35,0.05,0.95);
      if(typeof mat.forceDepthWrite!=="undefined") mat.forceDepthWrite=true;
      gen.cloudMesh.material=mat;
    }

    const r=gen.radius;
    const seaR=r*(1+(params.seaEnabled?(params.seaLevel||0):0));
    const minCloudR=seaR*1.004;
    const targetR=Math.max(r*(params.cloudLayerMul||1.02), minCloudR);
    gen.cloudMesh.scaling.setAll(targetR);
    gen.cloudMesh.setEnabled(true);

    const key=[params.seed|0,(params.cloudCoverage??0.55).toFixed(3),(params.cloudSharpness??2.4).toFixed(3),(params.cloudNoiseScale??2.8).toFixed(3),(params.cloudDetailScale??10).toFixed(3),(params.cloudDetail??0.35).toFixed(3),String(params.cloudTint||"#eef6ff")].join("|");
    if(gen._cloudTexKey!==key){ gen._cloudTexKey=key; rebuildTexture(gen, params); }

    const mat=gen.cloudMesh.material;
    mat.alpha=clamp(params.cloudLayerAlpha??0.75,0,1);
    mat.alphaCutOff=clamp(params.cloudAlphaCutoff??0.35,0.05,0.95);
  }

  function rebuildTexture(gen, params){
    const scene=gen.scene;
    const W=1024,H=512;
    if(!gen._cloudTex){
      gen._cloudTex=new BABYLON.DynamicTexture("cloudDT",{width:W,height:H},scene,false);
      gen._cloudTex.hasAlpha=true;
      gen._cloudTex.wrapU=BABYLON.Texture.WRAP_ADDRESSMODE;
      gen._cloudTex.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;
    }
    const dt=gen._cloudTex;
    const ctx=dt.getContext();
    const img=ctx.createImageData(W,H);
    const data=img.data;

    const cov=clamp(params.cloudCoverage??0.55,0.05,0.95);
    const sharp=Math.max(EPS, params.cloudSharpness??2.4);
    const s1=Math.max(EPS, params.cloudNoiseScale??2.8);
    const s2=Math.max(EPS, params.cloudDetailScale??10.0);
    const det=clamp(params.cloudDetail??0.35,0,1);
    const col=BABYLON.Color3.FromHexString(params.cloudTint||"#eef6ff");
    const n=gen.cloudNoise;

    function fbm(x,y,z, base){
      let amp=0.55,freq=1,sum=0,norm=0;
      for(let o=0;o<5;o++){ sum+=amp*n.noise3D(x*base*freq,y*base*freq,z*base*freq); norm+=amp; amp*=0.55; freq*=2.02; }
      return 0.5+0.5*(sum/Math.max(EPS,norm));
    }

    for(let y=0;y<H;y++){
      const v=(y+0.5)/H; const phi=v*Math.PI; const sp=Math.sin(phi), cp=Math.cos(phi);
      for(let x=0;x<W;x++){
        const u=(x+0.5)/W; const th=u*Math.PI*2; const ct=Math.cos(th), st=Math.sin(th);
        const dx=sp*ct, dy=cp, dz=sp*st;
        const a=fbm(dx,dy,dz,s1), b=fbm(dx,dy,dz,s2);
        let v0=a*(1-det)+b*det;
        const thresh=1-cov;
        let alpha=(v0-thresh)/Math.max(EPS,(1-thresh));
        alpha=clamp(alpha,0,1);
        alpha=Math.pow(alpha,sharp);
        alpha=alpha*alpha*(3-2*alpha);
        const i=(y*W+x)*4;
        data[i]=Math.floor(col.r*255); data[i+1]=Math.floor(col.g*255); data[i+2]=Math.floor(col.b*255); data[i+3]=Math.floor(alpha*255);
      }
    }
    ctx.putImageData(img,0,0); dt.update(false);

    const mat=gen.cloudMesh.material;
    mat.diffuseTexture=dt;
    mat.opacityTexture=dt;
    mat.useAlphaFromDiffuseTexture=true;
    mat.emissiveColor=col.scale(0.18);
  }

  function updateClouds(gen, dtMs, params){
    if(!gen.cloudMesh || !gen.cloudMesh.isEnabled()) return;
    const dts=dtMs*0.001;
    gen.cloudMesh.rotation.y += (params.cloudRotSpeed??0.06)*dts;
    if(gen._cloudTex){
      const wx=params.cloudWindX??0.02, wz=params.cloudWindZ??0.012;
      gen._cloudTex.uOffset=(gen._cloudTex.uOffset + wx*dts*0.02)%1.0;
      gen._cloudTex.vOffset=(gen._cloudTex.vOffset + wz*dts*0.02)%1.0;
    }
  }

  global.CloudSystem={ ensureCloudLayer, updateClouds };
})(window);
