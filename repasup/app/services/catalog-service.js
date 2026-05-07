const SUBJECT_LABELS = {
  ingles: 'Inglés',
  english: 'Inglés',
  ciencias: 'Ciencias',
  naturales: 'Naturales',
  natural_science: 'Naturales',
  sociales: 'Sociales'
};

const SUBJECT_ICONS = {
  ingles: '📘',
  english: '📘',
  ciencias: '🌍',
  naturales: '🔬',
  natural_science: '🔬',
  sociales: '🧭'
};

function normSubject(value){
  return String(value || '').trim().toLowerCase();
}

function uniq(values){
  return [...new Set((values || []).filter(Boolean))];
}

function deriveModes(deck){
  const types = uniq((deck.items || []).map(item => item?.type || 'pair'));
  const modes = new Set(['flashcards', 'quiz']);
  if (types.includes('tf')) modes.add('true_false');
  if (types.includes('timeline')) modes.add('timeline');
  if (types.includes('classify')) modes.add('classify');
  if (types.includes('verb')) modes.add('verbs');
  if (types.includes('type') || types.includes('grammar_fix') || types.includes('sentence_builder')) modes.add('typing');
  return [...modes];
}

function labelFromModes(modes){
  return modes.slice(0, 4).map(mode => ({
    flashcards: 'Flashcards',
    quiz: 'Quiz',
    true_false: 'V/F',
    timeline: 'Timeline',
    classify: 'Clasificar',
    verbs: 'Verbos',
    typing: 'Escribir'
  }[mode] || mode));
}

export function normalizeDeckMeta(deck, fileName){
  const subject = normSubject(deck.subject);
  const modes = Array.isArray(deck.modes) && deck.modes.length ? deck.modes : deriveModes(deck);
  const langs = uniq(Array.isArray(deck.langs) ? deck.langs : (deck.lang ? [deck.lang] : []));
  const tags = uniq([...(deck.tags || []), ...labelFromModes(modes)]);
  return {
    id: String(deck.id || fileName.replace(/\.json$/i, '')),
    file: `./data/${fileName}`,
    fileName,
    title: deck.title || fileName.replace(/\.json$/i, ''),
    subject,
    subjectLabel: SUBJECT_LABELS[subject] || (subject ? subject[0].toUpperCase() + subject.slice(1) : 'General'),
    level: deck.level || deck.course || '—',
    langs,
    icon: deck.icon || SUBJECT_ICONS[subject] || '🎲',
    description: deck.description || deck.desc || 'Temario compatible con el motor común de repaso.',
    tags,
    order: Number.isFinite(Number(deck.order)) ? Number(deck.order) : 9999,
    published: deck.published !== false,
    itemCount: Array.isArray(deck.items) ? deck.items.length : 0,
    topicsCount: Array.isArray(deck.topics) ? deck.topics.length : 0,
    modes,
    raw: deck
  };
}

export async function loadCatalog(){
  const manifestRes = await fetch('./data/manifest.json', { cache: 'no-cache' });
  if (!manifestRes.ok) throw new Error(`No se pudo cargar data/manifest.json (${manifestRes.status}).`);
  const manifest = await manifestRes.json();
  const entries = Array.isArray(manifest?.decks) ? manifest.decks : [];
  const files = entries.map(entry => typeof entry === 'string' ? entry : entry?.file).filter(Boolean);

  const decks = await Promise.all(files.map(async (fileName) => {
    const response = await fetch(`./data/${fileName}`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`No se pudo cargar ${fileName} (${response.status}).`);
    const deck = await response.json();
    return normalizeDeckMeta(deck, fileName);
  }));

  return decks
    .filter(deck => deck.published)
    .sort((a,b) => (a.order - b.order) || a.title.localeCompare(b.title, 'es'));
}
