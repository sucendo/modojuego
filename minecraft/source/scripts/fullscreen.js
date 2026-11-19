// Fullscreen must be requested directly from a user gesture. Unsupported or
// refused requests leave the game playable in its normal browser viewport.
export function fullscreenSupported(doc = document) {
  return !!(doc.documentElement?.requestFullscreen || doc.documentElement?.webkitRequestFullscreen);
}
export function isFullscreen(doc = document) {
  return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
}
export async function enterFullscreen(doc = document) {
  if (isFullscreen(doc)) return true;
  const root=doc.documentElement;
  const request=root?.requestFullscreen || root?.webkitRequestFullscreen;
  if (!request) return false;
  try { await request.call(root); return true; }
  catch { return false; }
}
export async function toggleFullscreen(doc = document) {
  if (!isFullscreen(doc)) return enterFullscreen(doc);
  const exit=doc.exitFullscreen || doc.webkitExitFullscreen;
  if (!exit) return false;
  try { await exit.call(doc); return true; }
  catch { return false; }
}
