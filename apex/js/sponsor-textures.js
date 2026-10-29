/* APEX 26: sponsor SVGs are sources only; race panels use rasterized,
 * mipmapped images on two textured triangles. No SVG triangulation on frame. */
(function(global){
'use strict';
const ASSETS=Object.freeze({
 'team-equipalia':['team-equipalia.svg',1024,171],
 'sct':['sct.svg',512,485],
 'mdtel':['mdtel.svg',768,368],
 'sct-wall':['sct-wall-24m.svg',2048,114],
 'apex26-start-finish':['apex26-start-finish.svg',1536,205],
 'radiquero-pedestrian-bridge':['radiquero-pedestrian-bridge.svg',1536,213],
 'mdtel-white-24m':['mdtel-white-24m.svg',2048,239]
});
const entries=new Map();const state={loaded:0,failed:0,uploads:0,bytes:0,textureTriangles:0,textureQuads:0,drawCalls:0,missing:0};
function entry(key){return entries.get(key)||null;}
function load(key){
 if(entries.has(key))return entries.get(key);
 const spec=ASSETS[key];if(!spec)return null;
 const item={key,status:'loading',image:null,canvas:null,error:null,gl:null,texture:null,width:spec[1],height:spec[2]};
 entries.set(key,item);
 if(typeof Image==='undefined')return item;
 const img=new Image();item.image=img;img.decoding='async';
 img.onload=()=>{
  try{
   const cv=document.createElement('canvas');cv.width=spec[1];cv.height=spec[2];
   const c=cv.getContext('2d',{alpha:true});if(!c)throw Error('Sponsor canvas unavailable');
   c.clearRect(0,0,cv.width,cv.height);c.drawImage(img,0,0,cv.width,cv.height);
   item.canvas=cv;item.status='ready';state.loaded++;
  }catch(e){item.error=String(e);item.status='error';state.failed++;}
 };
 img.onerror=()=>{item.status='error';item.error='Sponsor source unavailable: '+spec[0];state.failed++;};
 img.src='assets/sponsors/'+spec[0];
 return item;
}
function ensureTexture(gl,key){
 const e=load(key);if(!e||e.status!=='ready'||!e.canvas){state.missing++;return null;}
 if(e.texture&&e.gl===gl)return e.texture;
 if(e.texture&&e.gl&&e.gl!==gl){e.texture=null;e.gl=null;}
 const tx=gl.createTexture();if(!tx){state.failed++;return null;}
 const old=gl.getParameter(gl.TEXTURE_BINDING_2D);
 gl.bindTexture(gl.TEXTURE_2D,tx);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);
 gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,0);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,e.canvas);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 // The walls use continuous u values across physical segments. The image
 // is periodic in X but never repeats vertically.
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.generateMipmap(gl.TEXTURE_2D);
 const ext=gl.getExtension('EXT_texture_filter_anisotropic')||
   gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
 if(ext)gl.texParameterf(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT,
   Math.min(4,gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)||1));
 gl.bindTexture(gl.TEXTURE_2D,old);
 e.texture=tx;e.gl=gl;state.uploads++;state.bytes+=Math.ceil(e.width*e.height*4*4/3);
 return tx;
}
function resetGl(gl){
 for(const e of entries.values()){
  if(e.texture&&e.gl===gl){try{gl.deleteTexture(e.texture);}catch(_e){}e.texture=null;e.gl=null;}
 }
}
function beginFrame(){state.textureTriangles=0;state.textureQuads=0;state.drawCalls=0;state.missing=0;}
function accounting(triangles,quads){state.textureTriangles+=triangles;state.textureQuads+=quads;}
global.ApexSponsorTextures=Object.freeze({assets:ASSETS,entry,load,ensureTexture,resetGl,beginFrame,accounting,state});
// Fetch while in menus: rasterize each vector once, not on the racing loop.
for(const key of Object.keys(ASSETS))load(key);
})(window);
