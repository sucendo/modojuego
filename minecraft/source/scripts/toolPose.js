// Camera-local first-person grip transforms, distinct from the original pickaxe GLB.
// Tools point along +Y in their model space. The previous universal pickaxe pose
// rotated sword/saw into an almost horizontal and partially clipped position.
export const TOOL_VIEW_POSES = Object.freeze({
  pickaxe: Object.freeze({ position: [0.60,-0.30,-0.50], scale: 0.50, rotation: [0, Math.PI+0.2, Math.PI/2], swing: 0.32 }),
  sword: Object.freeze({ position: [0.67,-0.53,-0.96], scale: 0.56, rotation: [-0.18,-0.34,-0.22], swing: 0.46 }),
  saw: Object.freeze({ position: [0.67,-0.51,-0.92], scale: 0.59, rotation: [-0.36,-0.30,-0.33], swing: 0.42 })
});
export function viewPoseFor(kind) { return TOOL_VIEW_POSES[kind] || TOOL_VIEW_POSES.pickaxe; }
