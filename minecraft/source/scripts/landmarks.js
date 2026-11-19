// Sparse, repeatable points of interest. One candidate per 6×6 chunks; all
// calculations are seed-derived, independent of render order and RNG state.
export const LANDMARK_SPACING=6;
export const LANDMARK_TYPES=Object.freeze(['ruin','tower','camp']);
export function hashLandmark(seed,x,z){
  let h=(Math.imul(x,374761393)^Math.imul(z,668265263)^Math.imul(seed+1,1442695041))|0;
  h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;
}
export function candidateForCell(seed,cellX,cellZ){
  const h=hashLandmark(seed,cellX,cellZ);
  const cx=cellX*LANDMARK_SPACING+1+(h%4);
  const cz=cellZ*LANDMARK_SPACING+1+((h>>>8)%4);
  // Don't disturb the spawn or the immediate surroundings.
  if(Math.abs(cx)<=1&&Math.abs(cz)<=1)return null;
  const type=LANDMARK_TYPES[(h>>>17)%LANDMARK_TYPES.length];
  return {id:`poi:${cx}:${cz}:${type}`,cx,cz,x:cx*32+16,z:cz*32+16,type};
}
export function landmarkForChunk(seed,cx,cz){
  const p=candidateForCell(seed,Math.floor(cx/LANDMARK_SPACING),Math.floor(cz/LANDMARK_SPACING));
  return p?.cx===cx && p.cz===cz ? p : null;
}
export function landmarksInArea(seed,minX,minZ,maxX,maxZ){
  const results=[];
  const minCx=Math.floor(minX/(32*LANDMARK_SPACING)),maxCx=Math.floor(maxX/(32*LANDMARK_SPACING));
  const minCz=Math.floor(minZ/(32*LANDMARK_SPACING)),maxCz=Math.floor(maxZ/(32*LANDMARK_SPACING));
  for(let cx=minCx;cx<=maxCx;cx++)for(let cz=minCz;cz<=maxCz;cz++){
    const p=candidateForCell(seed,cx,cz);
    if(p&&p.x>=minX&&p.x<=maxX&&p.z>=minZ&&p.z<=maxZ)results.push(p);
  }
  return results;
}
// Paint into the chunk's existing voxel data; edits are loaded *after* these
// structures so any player-changed blocks take precedence.
export function paintLandmark(set,cx,cy,cz,type,stoneId=16,woodId=15,torchId=21){
  const floor=type==='camp'?woodId:stoneId;
  const width=type==='tower'?2:3;
  for(let dx=-width;dx<=width;dx++)for(let dz=-width;dz<=width;dz++){
    set(cx+dx,cy,cz+dz,floor);
    // A short base hides uneven terrain without modifying terrain generation.
    for(let down=1;down<=2;down++)set(cx+dx,cy-down,cz+dz,floor);
  }
  if(type==='ruin'){
    for(let dy=1;dy<=3;dy++){
      for(const [dx,dz] of [[-3,-3],[-3,3],[3,-3],[3,3],[-3,0],[3,0]]){
        if(dy===3 && (dx===-3&&dz===0))continue;
        set(cx+dx,cy+dy,cz+dz,stoneId);
      }
    }
    for(let dx=-2;dx<=2;dx++){set(cx+dx,cy+1,cz-3,stoneId);if(dx!==0)set(cx+dx,cy+1,cz+3,stoneId);}
  }else if(type==='tower'){
    for(let dy=1;dy<=5;dy++)for(const [dx,dz] of [[-2,-2],[-2,2],[2,-2],[2,2]])set(cx+dx,cy+dy,cz+dz,woodId);
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)set(cx+dx,cy+5,cz+dz,woodId);
    set(cx,cy+6,cz,torchId);
  }else{
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
      if(Math.abs(dx)===2 || Math.abs(dz)===2)set(cx+dx,cy+1,cz+dz,woodId);
    }
    set(cx,cy+1,cz,torchId);
  }
}
