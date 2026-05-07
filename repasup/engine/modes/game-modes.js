export function hasTimelinePayload(it){
  return it && it.type === "timeline" && Array.isArray(it.events) && it.events.length >= 3;
}

export function hasClassifyPayload(it){
  if (!it || it.type !== "classify") return false;
  if (Array.isArray(it.groups) && it.groups.length >= 2){
    return it.groups.every(g => g && g.name && Array.isArray(g.items) && g.items.length);
  }
  if (it.groups && typeof it.groups === "object"){
    const entries = Object.entries(it.groups).filter(([,arr]) => Array.isArray(arr) && arr.length);
    return entries.length >= 2;
  }
  return false;
}

export function validMixedEntry(entry){
  if (!entry || typeof entry !== "object") return false;
  if (entry.kind === "quiz"){
    return typeof entry.prompt === "string" && (
      (Array.isArray(entry.choices) && entry.choices.length >= 2 && entry.answer != null) ||
      (typeof entry.answer === "string" && entry.answer.trim())
    );
  }
  if (entry.kind === "sentence") return Array.isArray(entry.words) && entry.words.length >= 3 && entry.answer;
  if (entry.kind === "grammar") return entry.wrong && entry.right;
  if (entry.kind === "tf") return typeof entry.statement === "string" && typeof entry.answer === "boolean";
  return false;
}

export function buildMixedChallengePool(baseItems, count, { buildQuizFromItems, shuffle }){
  const quiz = buildQuizFromItems(baseItems).map(q => ({ kind: "quiz", ...q }));
  const sentence = baseItems
    .filter(x => x.type === "sentence_builder" && Array.isArray(x.words) && x.words.length >= 3 && x.answer)
    .map(x => ({ kind: "sentence", id: x.id, words: x.words, answer: x.answer, prompt: x.prompt || "Ordena la frase" }));
  const grammar = baseItems
    .filter(x => x.type === "grammar_fix" && x.wrong && x.right)
    .map(x => ({ kind: "grammar", id: x.id, wrong: x.wrong, right: x.right }));
  const tf = baseItems
    .filter(x => x.type === "tf" && typeof x.statement === "string" && typeof x.answer === "boolean")
    .map(x => ({ kind: "tf", id: x.id, statement: x.statement, answer: x.answer }));

  const pool = shuffle([].concat(quiz, sentence, grammar, tf)).filter(validMixedEntry);
  const limit = Math.max(8, Math.min(40, count || 15));
  return pool.slice(0, limit);
}

export function computeAvailableModes(base, deckProgress, deps){
  const {
    buildPlayableQuizPool,
    toPairsForMemory,
    uiState,
    buildMixedChallengePool: buildMixed,
  } = deps;

  const vocabForSpelling = base.filter(x=>x.type==="vocab" && x.es && x.en).length;
  const vocabForListening = base.filter(x=>x.type==="vocab" && x.en).length;
  const sentencePool = base.filter(x=>x.type==="sentence_builder" && Array.isArray(x.words) && x.words.length >= 3 && x.answer);
  const grammarPool = base.filter(x=>x.type==="grammar_fix" && x.wrong && x.right);
  const tfPool = base.filter(x=>x.type==="tf" && typeof x.statement === "string" && typeof x.answer === "boolean");
  const timelinePool = base.filter(hasTimelinePayload);
  const classifyPool = base.filter(hasClassifyPayload);
  const quizPool = buildPlayableQuizPool(base);
  const memoryPairs = toPairsForMemory(base);
  const counts = {
    flash: base.length,
    tf: tfPool.length,
    timeline: timelinePool.length,
    classify: classifyPool.length,
    grammar: grammarPool.length,
    sentence: sentencePool.length,
    vocabOrVerb: base.filter(x=>x.type==="vocab" || x.type==="verb").length,
    vocabForSpelling,
    vocabForListening,
    pairs: memoryPairs.length,
    quizPool: quizPool.length,
    mixedPool: buildMixed(base, uiState.count).length,
  };

  const reasons = {
    flash: counts.flash ? "" : "No hay ítems seleccionados.",
    quiz: counts.quizPool ? "" : "No hay preguntas válidas (MCQ/typing) para esta selección.",
    spelling: counts.vocabForSpelling ? "" : "Necesita vocabulario con ES + EN.",
    listening: counts.vocabForListening ? "" : "Necesita vocabulario con EN.",
    sentence: counts.sentence ? "" : "Necesita frases con words[] y answer.",
    grammar: counts.grammar ? "" : "Necesita ejercicios grammar_fix con wrong/right.",
    tf: counts.tf ? "" : "Necesita items True/False válidos.",
    exam: counts.quizPool ? "" : "No hay pool suficiente para examen.",
    mixed: counts.mixedPool ? "" : "No hay mezcla válida para challenge con esta selección.",
    memory: counts.pairs >= 3 ? "" : "Se necesitan al menos 3 parejas compatibles.",
    timeline: counts.timeline ? "" : "Se necesitan timelines con 3+ eventos con año.",
    classify: counts.classify ? "" : "Se necesitan grupos válidos para clasificar.",
    errors: (deckProgress?.errorsRecent?.length || 0) ? "" : "No hay errores pendientes.",
  };

  return {
    flash: counts.flash > 0,
    quiz: counts.quizPool > 0,
    spelling: counts.vocabForSpelling > 0,
    listening: counts.vocabForListening > 0,
    sentence: counts.sentence > 0,
    grammar: counts.grammar > 0,
    tf: counts.tf > 0,
    exam: counts.quizPool > 0,
    mixed: counts.mixedPool > 0,
    memory: counts.pairs >= 3,
    timeline: counts.timeline > 0,
    classify: counts.classify > 0,
    errors: (deckProgress?.errorsRecent?.length || 0) > 0,
    counts,
    reasons,
  };
}

export const HOME_MODE_DEFS = [
  { key:"flash", id:"goFlash", ico:"🃏", tt:"Flashcards", dd:"Conceptos y definiciones", hintKey: "flash", unit: "ítems" },
  { key:"quiz", id:"goQuiz", ico:"🧠", tt:"Quiz", dd:"Test + escribir", hintKey: "quizPool", unit: "preguntas" },
  { key:"spelling", id:"goSpelling", ico:"✍️", tt:"Spelling", dd:"ES → EN", hintKey: "vocabForSpelling", unit: "ítems" },
  { key:"listening", id:"goListening", ico:"🔊", tt:"Listening", dd:"Escucha y responde", hintKey: "vocabForListening", unit: "ítems" },
  { key:"sentence", id:"goSentence", ico:"🧱", tt:"Sentence Builder", dd:"Ordena palabras", hintKey: "sentence", unit: "ejercicios" },
  { key:"grammar", id:"goGrammar", ico:"🛠️", tt:"Grammar Fix", dd:"Corrige la frase", hintKey: "grammar", unit: "ejercicios" },
  { key:"tf", id:"goTF", ico:"✅", tt:"Verdadero/Falso", dd:"Rápido", hintKey: "tf", unit: "preguntas" },
  { key:"exam", id:"goExam", ico:"📝", tt:"Examen", dd:"Mezclado (10/15/20)", hintKey: "quizPool", unit: "preguntas" },
  { key:"mixed", id:"goMixed", ico:"🎯", tt:"Mixed Challenge", dd:"Mix inteligente", hintKey: "mixedPool", unit: "retos" },
  { key:"memory", id:"goMemory", ico:"🧩", tt:"Parejas", dd:"Memory (definición ↔ concepto)", hintKey: "pairs", unit: "parejas" },
  { key:"timeline", id:"goTimeline", ico:"🕒", tt:"Línea del tiempo", dd:"Ordena eventos", hintKey: "timeline", unit: "actividades" },
  { key:"classify", id:"goClassify", ico:"🗂️", tt:"Clasificar", dd:"Arrastra / asigna", hintKey: "classify", unit: "actividades" },
  { key:"errors", id:"goErrors", ico:"⚠️", tt:"Repasar errores", dd:"Recupera los fallos pendientes", special: "errors", accent: true },
];
