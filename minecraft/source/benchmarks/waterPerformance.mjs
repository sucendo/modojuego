import {pathToFileURL} from 'node:url';
const sources=process.argv.slice(2);
if(!sources.length)sources.push(new URL('../scripts/basinHydrology.js',import.meta.url).pathname);
function fixture(Module){
 const chunks=new Map();let refreshes=0;
 for(let z=-1;z<=2;z++)for(let x=-1;x<=2;x++)chunks.set(`${x},${z}`,{loaded:true,position:{x:x*32,z:z*32},waterColumns:Array(1024),refreshWater(){refreshes++;}});
 const world={chunkSize:{width:32,height:128},getChunk:(x,z)=>chunks.get(`${x},${z}`)};
 const env={water:new Map(),columns:new Map(),revision:0};
 const b=new Module.BasinHydrology({world,environment:env,onChange(){}});
 for(let z=0;z<64;z++)for(let x=0;x<64;x++){
  const id=`${x},${z}`,chunk=world.getChunk(x>>5,z>>5);
  const c={x,z,bottom:10.5,roof:127.5,outdoor:true,volume:2+(x===32&&z===32?.3:0),kind:'lake',renderedVolume:2};
  const cave={x,z,bottom:.5,roof:4.5,outdoor:false,volume:0,kind:'lake'};
  b.nodes.set(`${id},10.5`,c);b.nodes.set(`${id},0.5`,cave);
  b.columns.set(id,{x,z,chunk,index:(z%32)*32+x%32,top:10,nodes:[c,cave]});
  env.water.set(`${id},0.5`,0);env.columns.set(id,{cavities:[cave],basinOwned:true});b.dirty.add(id);
 }
 return {b,env,refreshes:()=>refreshes};
}
for(const source of sources){
 const mod=await import(pathToFileURL(source));
 const {b,env,refreshes}=fixture(mod);let t=performance.now();b.publish();const publish=performance.now()-t;
 t=performance.now();for(let i=0;i<100;i++)b.update(.1);const update=(performance.now()-t)/100;
 console.log(JSON.stringify({source,columns:b.columns.size,nodes:b.nodes.size,publishMs:+publish.toFixed(2),updateMs:+update.toFixed(2),meshRebuilds:refreshes(),environmentRevisions:env.revision,balance:b.total()}));
}
