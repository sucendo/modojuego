// engine/storage.js
// Reutiliza el sistema de jugadores del portal (portal_juegos_store_v3).
// Progreso de aprendizaje se guarda en repaso_progress_v1.

const PORTAL_STORE_KEY = "portal_juegos_store_v3";
const PROGRESS_KEY = "repaso_progress_v1";

export function nowISO(){ return new Date().toISOString(); }

export function getActivePlayer(){
  try{
    const raw = localStorage.getItem(PORTAL_STORE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw);
    const id = store.currentPlayerId;
    if (!id || !store.players || !store.players[id]) return null;
    return { id, name: store.players[id].name || null };
  }catch(e){ return null; }
}

export function loadProgress(){
  try{
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : { players:{} };
  }catch(e){
    return { players:{} };
  }
}
export function saveProgress(obj){
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(obj));
}

export function norm(s){
  return String(s||"")
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu,"")
    .replace(/\s+/g," ")
    .trim();
}

export function shuffle(arr){
  const a = arr.slice();
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

export function pickRandom(arr, n){
  if (!arr.length) return [];
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}
