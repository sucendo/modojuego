export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const rad = d => d * Math.PI / 180;
export const deg = r => r * 180 / Math.PI;
export const normLon = d => ((d + 180) % 360 + 360) % 360 - 180;
export const pad2 = n => String(n).padStart(2, '0');
export const isFiniteNumber = v => Number.isFinite(Number(v));
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function debounce(fn, ms = 250){
  let t = 0;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function toLocalInputValue(date){
  const d = new Date(date);
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function formatUtc(date, withSeconds = true){
  const d = new Date(date);
  const opts = {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'};
  if (withSeconds) opts.second = '2-digit';
  return new Intl.DateTimeFormat('es-ES', opts).format(d) + ' UTC';
}

export function formatLocal(date, withSeconds = false){
  const opts = {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false};
  if (withSeconds) opts.second = '2-digit';
  return new Intl.DateTimeFormat('es-ES', opts).format(new Date(date));
}

export function formatDuration(seconds){
  if (!Number.isFinite(seconds)) return '—';
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s/60), r = s%60;
  return `${m}m ${String(r).padStart(2,'0')}s`;
}

export function formatAge(ms){
  if (!Number.isFinite(ms)) return '—';
  const abs = Math.abs(ms);
  const h = abs / 3600000;
  if (h < 1) return `${Math.round(abs/60000)} min`;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} h`;
  return `${(h/24).toFixed(1)} días`;
}

export function bearingLabel(degrees){
  if (!Number.isFinite(degrees)) return '—';
  const dirs = ['N','NE','E','SE','S','SO','O','NO'];
  return `${Math.round((degrees+360)%360)}° ${dirs[Math.round(((degrees%360)+360)%360/45)%8]}`;
}

export function hashColor(key){
  const palette = ['#ff4f64','#6aa8ff','#54d4a3','#f1c75b','#b48cff','#4dd3e8','#ff9b55','#e971b8'];
  let h = 0;
  for (const ch of String(key)) h = ((h<<5)-h + ch.charCodeAt(0))|0;
  return palette[Math.abs(h)%palette.length];
}

export function uid(prefix='sat'){
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

export function safeText(value){ return value == null ? '' : String(value); }

export function createEl(tag, attrs = {}, ...children){
  const el = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)){
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'text') el.textContent = safeText(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const child of children.flat()){
    if (child == null) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export async function fetchJson(url, options = {}){
  const res = await fetch(url, options);
  if (!res.ok){
    const text = await res.text().catch(()=> '');
    const err = new Error(`HTTP ${res.status}${text ? `: ${text.slice(0,160)}` : ''}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
