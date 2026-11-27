import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {SHAPES} from './constructionShapes.js';
export function constructionGeometry(id){
 const s=SHAPES.get(id);
 if(s.kind==='slab'||s.kind==='stairs')return mergeGeometries(s.boxes.map(b=>new THREE.BoxGeometry(2*b.halfX,2*b.halfY,2*b.halfZ).translate(b.offsetX,b.offsetY,b.offsetZ)),false);
 const a=[-.5,-.5,-.5],b=[.5,-.5,-.5],c=[-.5,-.5,.5],d=[.5,-.5,.5];
 let faces;
 if(s.kind==='roof'){
  const e=[-.5,.5,.5],f=[.5,.5,.5];faces=[[a,c,d],[a,d,b],[a,b,f],[a,f,e],[a,e,c],[b,d,f],[c,e,f],[c,f,d]];
 }else{
  const i=[-.5,0,0],j=[.5,0,0];
  faces=[[a,c,d],[a,d,b],[a,b,j],[a,j,i],[i,j,d],[i,d,c],[a,i,c],[b,d,j]];
 }
 faces=faces.map(([a,b,c])=>[a,c,b]);
 const positions=faces.flat(2),uv=[];for(const face of faces)for(const [x,y,z] of face)uv.push(x+.5,z+.5+y*.2);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();geometry.rotateY(s.q*Math.PI/2);return geometry;
}
