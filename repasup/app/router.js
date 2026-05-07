export function parseRoute(hash = window.location.hash){
  const clean = String(hash || '').replace(/^#/, '') || '/';
  if (clean === '/' || clean === '') return { name: 'home' };
  const deckMatch = clean.match(/^\/deck\/([^/?#]+)/);
  if (deckMatch) return { name: 'deck', deckId: decodeURIComponent(deckMatch[1]) };
  return { name: 'home' };
}
export function goHome(){ window.location.hash = '#/'; }
export function goDeck(deckId){ window.location.hash = `#/deck/${encodeURIComponent(deckId)}`; }
