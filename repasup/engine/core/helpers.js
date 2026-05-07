export function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

export function clampPct(value){
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function toast(message){
  const text = String(message ?? "").trim();
  if (!text) return;
  let el = document.getElementById("gameToast");
  if (!el){
    el = document.createElement("div");
    el.id = "gameToast";
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "16px";
    el.style.transform = "translateX(-50%)";
    el.style.zIndex = "1200";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "999px";
    el.style.border = "2px solid var(--line-soft)";
    el.style.background = "var(--surface-soft)";
    el.style.backdropFilter = "blur(6px)";
    el.style.boxShadow = "0 16px 34px rgba(2,6,23,.18)";
    el.style.fontWeight = "950";
    el.style.color = "var(--ink)";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.style.display = "none"; }, 1600);
}
