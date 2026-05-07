const STORE_KEY = "portal_juegos_store_v3";
const THEME_KEY = "repaso_theme_v1";
const AVATAR_KEY = "repaso_avatar_v1";
const DENSITY_KEY = "repaso_density_v1";

const DEFAULT_STORE = {
  currentPlayerId: null,
  players: {},
  globalUI: {
    theme: "pastel",
    avatar: "🎮",
    density: "normal"
  }
};

export const AVATARS = [
  "🦊","🐻","🐼","🐺","🦁","🐯","🐶","🐱","🐰","🐨","🦉","🐸","🐵","🦄","🦓",
  "🦒","🦘","🦥","🦔","🦜","🦋","🐙","🐢","🐹","🦝","🐮","🐷","🐭","🐬","🐧",
  "🎮","🧠","🚀","📚","🧩","⭐","🎨","🎯","🎵","💡","🏆","🛸","🏎️","🏍️","✈️"
];

export function loadStore(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(DEFAULT_STORE);
    const parsed = JSON.parse(raw);
    return {
      currentPlayerId: parsed.currentPlayerId || null,
      players: parsed.players && typeof parsed.players === 'object' ? parsed.players : {},
      globalUI: { ...DEFAULT_STORE.globalUI, ...(parsed.globalUI || {}) }
    };
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

export function saveStore(store){
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function newPlayerId(){
  return `p_${Math.random().toString(36).slice(2,10)}${Date.now().toString(36)}`;
}

export function getPlayer(store, playerId = store.currentPlayerId){
  if (!playerId) return null;
  return store.players?.[playerId] || null;
}

export function listPlayers(store){
  return Object.entries(store.players || {}).map(([id, player]) => ({ id, ...player }))
    .sort((a,b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));
}

export function getActiveAppearance(store){
  const player = getPlayer(store);
  const globalUI = store.globalUI || DEFAULT_STORE.globalUI;
  return {
    theme: player?.appearance?.theme || localStorage.getItem(THEME_KEY) || globalUI.theme || 'pastel',
    avatar: player?.appearance?.avatar || localStorage.getItem(AVATAR_KEY) || globalUI.avatar || '🎮',
    density: player?.appearance?.density || localStorage.getItem(DENSITY_KEY) || globalUI.density || 'normal'
  };
}

export function persistAppearance(store, patch){
  const player = getPlayer(store);
  const current = getActiveAppearance(store);
  const next = { ...current, ...patch };
  if (player){
    player.appearance ||= {};
    Object.assign(player.appearance, patch);
  } else {
    store.globalUI = { ...(store.globalUI || DEFAULT_STORE.globalUI), ...patch };
  }
  localStorage.setItem(THEME_KEY, next.theme);
  localStorage.setItem(AVATAR_KEY, next.avatar);
  localStorage.setItem(DENSITY_KEY, next.density);
  saveStore(store);
  return next;
}

export function applyAppearance(store){
  const appearance = getActiveAppearance(store);
  document.documentElement.setAttribute('data-theme', appearance.theme);
  document.body.dataset.density = appearance.density;
  localStorage.setItem(THEME_KEY, appearance.theme);
  localStorage.setItem(AVATAR_KEY, appearance.avatar);
  localStorage.setItem(DENSITY_KEY, appearance.density);
  return appearance;
}

export function ensurePlayer(store, { name, avatar = null }){
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('El nombre del jugador es obligatorio.');
  const id = newPlayerId();
  store.players[id] = { name: cleanName, favs: [], appearance: avatar ? { avatar } : {} };
  store.currentPlayerId = id;
  saveStore(store);
  return id;
}

export function renamePlayer(store, playerId, name){
  const player = getPlayer(store, playerId);
  if (!player) throw new Error('Jugador no encontrado.');
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('El nombre del jugador es obligatorio.');
  player.name = cleanName;
  saveStore(store);
}

export function deletePlayer(store, playerId){
  if (!store.players?.[playerId]) return;
  delete store.players[playerId];
  if (store.currentPlayerId === playerId){
    const ids = Object.keys(store.players);
    store.currentPlayerId = ids[0] || null;
  }
  saveStore(store);
}

export function setCurrentPlayer(store, playerId){
  if (playerId && !store.players?.[playerId]) throw new Error('Jugador no encontrado.');
  store.currentPlayerId = playerId || null;
  saveStore(store);
}

export function getFavorites(store){
  return new Set(getPlayer(store)?.favs || []);
}

export function toggleFavorite(store, deckId){
  const player = getPlayer(store);
  if (!player) throw new Error('Primero crea o elige un jugador.');
  const set = new Set(player.favs || []);
  if (set.has(deckId)) set.delete(deckId);
  else set.add(deckId);
  player.favs = [...set];
  saveStore(store);
  return set;
}
