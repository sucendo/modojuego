// engine/filter-utils.js

export function getItemUnits(it){
  if (Array.isArray(it?.units) && it.units.length) return it.units;
  if (Array.isArray(it?.topics) && it.topics.length) return it.topics;
  if (Array.isArray(it?.u) && it.u.length) return it.u;
  if (it?.topic) return [it.topic];
  return [];
}

export function getItemCategory(it){
  const raw = it?.category ?? it?.cat ?? it?.block ?? it?.bloque ?? it?.tag ?? "";
  return String(raw || "").trim();
}

export function getCategoryOptions(src, normFn){
  const map = new Map();
  for (const it of src){
    const raw = getItemCategory(it);
    if (!raw) continue;
    const key = normFn(raw);
    if (!key) continue;
    if (!map.has(key)) map.set(key, raw);
  }
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
}

export function filterByTopic(src, uiState, topics, topicIndex){
  const t = uiState.topic;
  if (!t || t === "all" || !topics.length) return src;
  const selIdx = (topicIndex[t] ?? -1);
  if (selIdx < 0) return src;
  return src.filter(it => {
    const units = getItemUnits(it);
    if (!units || !units.length) return true;
    const best = units.map(u=>topicIndex[u]).filter(x=>typeof x==="number");
    if (!best.length) return false;
    const idx = Math.min(...best);
    if (uiState.range === "hasta") return idx <= selIdx;
    return units.includes(t);
  });
}

export function filterByCategory(src, uiState, normFn){
  const c = uiState.cat;
  if (!c || c === "mix") return src;
  return src.filter(it => normFn(getItemCategory(it)) === c);
}

export function filterByDifficulty(src, uiState){
  const d = uiState.diff;
  if (!d || d === "mix") return src;
  const maxD = parseInt(d,10);
  if (!maxD) return src;
  return src.filter(it => (typeof it.difficulty === "number" ? it.difficulty : 1) <= maxD);
}

export function applySelectionFilters(items, uiState, topics, topicIndex, normFn){
  return filterByDifficulty(
    filterByCategory(
      filterByTopic(items, uiState, topics, topicIndex),
      uiState,
      normFn
    ),
    uiState
  );
}
