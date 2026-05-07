// engine/deck-utils.js

export const SUPPORTED_ITEM_TYPES = new Set([
  "pair", "mcq", "type", "tf", "timeline", "classify", "verb", "vocab", "grammar_fix", "sentence_builder"
]);

export async function loadDeck(url) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } catch (e) {
    return await new Promise((resolve, reject) => {
      try{
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = () => {
          if (xhr.readyState !== 4) return;
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch (err){ reject(err); }
          } else {
            reject(new Error("No se pudo cargar el JSON. Si estás en file://, abre con un servidor local (http://localhost)."));
          }
        };
        xhr.send();
      }catch(err){ reject(err); }
    });
  }
}

function toNumberDifficulty(v){
  const d = Number(v);
  if (!Number.isFinite(d)) return 1;
  return Math.max(1, Math.min(3, Math.floor(d)));
}

function inferType(item){
  if (item?.type) return String(item.type);
  if (item?.question && Array.isArray(item?.choices)) return "mcq";
  if (item?.prompt && item?.answer !== undefined) return "type";
  if (item?.statement && typeof item?.answer === "boolean") return "tf";
  if (item?.front && item?.back) return "pair";
  return "pair";
}

function normalizeItem(item, idx){
  const src = (item && typeof item === "object") ? item : {};
  const type = inferType(src);
  const id = src.id ? String(src.id) : `auto_${idx+1}`;
  const tags = Array.isArray(src.tags) ? src.tags : [src.tag, src.category, src.cat].filter(Boolean);
  const units = Array.isArray(src.units) ? src.units : (Array.isArray(src.topics) ? src.topics : (src.topic ? [src.topic] : []));

  return {
    ...src,
    id,
    type,
    tags: tags.map(x => String(x)).filter(Boolean),
    units,
    topic: src.topic || units[0] || null,
    difficulty: toNumberDifficulty(src.difficulty),
    category: src.category ?? src.cat ?? src.block ?? src.bloque ?? src.tag ?? null,
    langs: Array.isArray(src.langs) ? src.langs : (src.lang ? [src.lang] : [])
  };
}

export function normalizeDeckSchema(rawDeck, sourceLabel = "deck"){
  const deck = (rawDeck && typeof rawDeck === "object") ? rawDeck : {};
  const itemsRaw = Array.isArray(deck.items) ? deck.items : [];
  const items = itemsRaw.map((it, idx) => normalizeItem(it, idx));

  const normalized = {
    ...deck,
    id: String(deck.id || deck.slug || deck.title || sourceLabel || "deck_default"),
    title: deck.title || "Repaso",
    subject: deck.subject || "",
    level: deck.level || "",
    topics: Array.isArray(deck.topics) ? deck.topics : [],
    modes: Array.isArray(deck.modes) ? deck.modes : [],
    items
  };

  const warnings = validateDeckSchema(normalized);
  return { deck: normalized, warnings };
}

export function validateDeckSchema(deck){
  const warnings = [];
  if (!Array.isArray(deck.items) || !deck.items.length){
    warnings.push("Deck sin items utilizables.");
    return warnings;
  }

  const ids = new Set();
  deck.items.forEach((it, idx) => {
    if (!it.id) warnings.push(`Item #${idx+1} sin id; se generó uno automático.`);
    if (ids.has(it.id)) warnings.push(`ID duplicado detectado: ${it.id}`);
    ids.add(it.id);

    if (!SUPPORTED_ITEM_TYPES.has(it.type)) warnings.push(`Tipo no soportado en ${it.id}: ${it.type}`);

    if (it.type === "mcq" && (!it.question || !Array.isArray(it.choices) || !it.choices.length)) warnings.push(`MCQ inválido en ${it.id}`);
    if (it.type === "type" && (!it.prompt || it.answer === undefined)) warnings.push(`TYPE inválido en ${it.id}`);
    if (it.type === "tf" && (typeof it.answer !== "boolean" || !it.statement)) warnings.push(`TF inválido en ${it.id}`);
    if (it.type === "timeline" && (!Array.isArray(it.events) || !it.events.length)) warnings.push(`TIMELINE inválido en ${it.id}`);
    if (it.type === "classify" && (!it.groups || !Object.keys(it.groups).length)) warnings.push(`CLASSIFY inválido en ${it.id}`);
  });

  return warnings;
}

export function getDeckItems(deck){
  return Array.isArray(deck?.items) ? deck.items : [];
}
