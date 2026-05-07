// engine/game-engine.js
// Motor común (v1): Flashcards + Quiz (MCQ/Typing) + True/False
// Guarda estadísticas por jugador + deck en localStorage.

import { getActivePlayer, loadProgress, saveProgress, nowISO, norm, pickRandom, shuffle } from "./storage.js";
import { loadDeck, normalizeDeckSchema, getDeckItems } from "./deck-utils.js";
import { ensureDeckProgress, updateProgressAfterAnswer, computeMastery, toSafeInt } from "./progress-utils.js";
import { filterByTopic, getCategoryOptions, applySelectionFilters } from "./filter-utils.js";
import { renderWidgetsForMode } from "./widget-registry.js";
import { escapeHtml, toast } from "./core/helpers.js";
import { buildDeckStatsSnapshot } from "./stats/stats-model.js";
import { setupStatsModal } from "./ui/stats-modal.js";
import { topicControlsHTML, wireTopicControls, buildHomeTilesHTML } from "./ui/deck-home.js";
import { computeAvailableModes, hasTimelinePayload, hasClassifyPayload, buildMixedChallengePool } from "./modes/game-modes.js";

export function makeSession(deckId){
  return {
    deckId,
    startedAt: Date.now(),
    mode: "home",
    correct: 0,
    wrong: 0,
    streak: 0,
    bestStreak: 0,
    lastItemId: null
  };
}

export { computeMastery };

export function initUI(root, options = {}){
  const embedded = Boolean(options.embedded);
  if (embedded){
    root.innerHTML = `
      <div class="main embeddedMain">
        <section class="panel" id="panel"></section>
        <aside class="panel sidePanel" id="sidePanel" aria-live="polite"></aside>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="app">
      <header>
        <div class="title">
          <h1><span class="spark">🎮</span> <span id="title">Repaso</span></h1>
          <small id="subtitle">Motor común + temarios en JSON</small>
        </div>

        <div class="controls">
          <div class="player" id="playerBox"></div>
          <button class="btn btn-a" id="btnStats">📊 Stats</button>
        </div>
      </header>

      <div class="main">
        <section class="panel" id="panel"></section>
        <aside class="panel sidePanel" id="sidePanel" aria-live="polite"></aside>
      </div>

      <div class="footer">
        <div><span id="hint">Tip: crea jugadores desde el portal.</span></div>
        <div class="muted">Motor Repaso · v1</div>
      </div>
    </div>
  `;
}

export async function runGame({ root, deckUrl, externalControls = null }){
  const rawDeck = await loadDeck(deckUrl);
  const normalized = normalizeDeckSchema(rawDeck, deckUrl);
  const deck = normalized.deck;
  if (normalized.warnings.length){
    console.warn(`[Repaso] Deck \"${deck.id}\" con avisos de schema:`, normalized.warnings);
  }
  const items = getDeckItems(deck);
  const deckId = String(deck.id || deck.slug || deck.title || deckUrl || "deck_default");

  // ===== Topic selection (Solo tema / Hasta tema) =====
  const topics = Array.isArray(deck.topics) ? deck.topics : [];
  const topicOrder = topics.map(t => t.id);
  const topicIndex = Object.fromEntries(topicOrder.map((id,i)=>[id,i]));

  const uiState = {
    topic: "all",   // "all" or topic id
    range: "solo",  // "solo" | "hasta"
    count: 15,      // for exam
    diff: "mix",
    cat: "mix"   // mix | 1 | 2 | 3
  };

  const active = getActivePlayer(); // from portal store
  const activeAvatar = (() => { try { return localStorage.getItem("repaso_avatar_v1") || "👤"; } catch(e){ return "👤"; } })();
  const playerLabel = active?.name ? `${activeAvatar} ${active.name}` : `${activeAvatar} Invitado`;

  const titleEl = root.querySelector("#title") || externalControls?.titleEl || null;
  const subtitleEl = root.querySelector("#subtitle") || externalControls?.subtitleEl || null;
  const playerBoxEl = root.querySelector("#playerBox") || externalControls?.playerBoxEl || null;
  if (titleEl) titleEl.textContent = deck.title || "Repaso";
  if (subtitleEl) subtitleEl.textContent = `${deck.subject || ""} · ${deck.level || deck.course || ""}`.replace(/\s+·\s+$/,"");
  if (playerBoxEl) playerBoxEl.textContent = playerLabel;

  const panel = root.querySelector("#panel");
  const btnHome = root.querySelector("#btnHome") || externalControls?.homeBtn || null;
  const btnStats = root.querySelector("#btnStats") || externalControls?.statsBtn || null;
  const sidePanel = root.querySelector("#sidePanel");
  const portalHref = externalControls?.portalHref || "index.html";

  const modalBack = document.querySelector("#modalBack");
  const modalBody = document.querySelector("#modalBody");
  const closeModal = document.querySelector("#closeModal");
  const hasStatsModal = Boolean(modalBack && modalBody && closeModal);

  const session = makeSession(deckId);
  let modeStartedAt = Date.now();
  let modeAnswersAtStart = 0;
  let modeCountedCompletion = false;
  let progress = loadProgress();
  let playerId = active?.id || null;
  const THEME_KEY = "repaso_theme_v1";

  function applyTheme(theme){
    const valid = ["pastel","aurora","ocean","forest","sunset","midnight"];
    const chosen = valid.includes(theme) ? theme : "pastel";
    document.documentElement.setAttribute("data-theme", chosen);
    try{ localStorage.setItem(THEME_KEY, chosen); }catch(e){}
  }

  function loadTheme(){
    let saved = "pastel";
    try { saved = localStorage.getItem(THEME_KEY) || "pastel"; } catch(e){}
    applyTheme(saved);
  }

  function updateSidePanel(){
    if (!sidePanel) return;
    const dProg = currentDeckProgress();
    const stats = buildDeckStatsSnapshot({
      deckProgress: dProg,
      session,
      itemsCount: items.length,
      computeMastery,
      toSafeInt,
    });
    const widgetHTML = renderWidgetsForMode(session.mode, {
      mode: session.mode || "home",
      theme: document.documentElement.getAttribute("data-theme") || "pastel",
      playerName: active?.name || "Invitado",
      session,
      deckProgress: dProg,
      mastery: stats.mastery,
      totalAnswers: stats.totalAnswers,
      pendingErrors: stats.pendingErrors,
      lastPlayedLabel: stats.lastPlayedLabel,
      stats,
    });
    sidePanel.innerHTML = `
      <div class="sideBox">
        <h3>📌 Widgets de sesión</h3>
        ${widgetHTML}
      </div>
    `;
  }

  function currentDeckProgress(){
    if (!playerId){
      return null;
    }
    return ensureDeckProgress(progress, playerId, deckId);
  }
  
  function saveTime(){
    if (!playerId) return;
    maybeCompleteMode();
    const dProg = currentDeckProgress();
    const elapsed = Math.max(0, Date.now() - session.startedAt);
    dProg.timeSpentMs += elapsed;
    session.startedAt = Date.now();
    saveProgress(progress);
    updateSidePanel();
  }

  const statsModal = setupStatsModal({
    hasStatsModal,
    modalBack,
    modalBody,
    closeModal,
    getDeckProgress: currentDeckProgress,
    buildStats: (deckProgress) => buildDeckStatsSnapshot({
      deckProgress,
      session,
      itemsCount: items.length,
      computeMastery,
      toSafeInt,
    }),
  });

  if (btnStats) btnStats.onclick = statsModal.openStats;
  const onDeckHomeRequest = () => {
    if (session.mode !== "home") saveTime();
    renderHome();
  };
  if (btnHome) btnHome.onclick = onDeckHomeRequest;
  window.addEventListener("repaso:deck-home", onDeckHomeRequest);
  loadTheme();

  function ensureCanSave(){
    if (!playerId){
      panel.innerHTML = `
        <div class="big">
          <h2>Necesitas un jugador</h2>
          <p class="muted">Para guardar progreso, crea/elige un jugador en el portal (index.html) y vuelve aquí.</p>
          <div class="row">
            <a class="btn" href="${portalHref}">Ir al portal</a>
            <button class="btn ghost" id="btnContinue">Seguir como invitado</button>
          </div>
        </div>
      `;
      panel.querySelector("#btnContinue").onclick = () => renderHome();
      return false;
    }
    return true;
  }

  function runIfCanSave(startFn){
    if (!ensureCanSave()) return;
    startFn();
  }

  
  function renderHome(){
    session.mode = "home";
    updateSidePanel();
    const dProg = currentDeckProgress();
    const mastery = dProg ? computeMastery(dProg) : 0;
    const last = dProg?.lastPlayedAt ? new Date(dProg.lastPlayedAt).toLocaleString() : "—";
    const pendingErrors = dProg?.errorsRecent?.length || 0;
    const totalAnswers = dProg ? ((dProg.correct || 0) + (dProg.wrong || 0)) : 0;
    const baseSel = applySelectionFilters(items, uiState, topics, topicIndex, norm);
    const avail = computeAvailableModes(baseSel, dProg, {
      buildPlayableQuizPool,
      toPairsForMemory,
      uiState,
      buildMixedChallengePool: (baseItems, count) => buildMixedChallengePool(baseItems, count, {
        buildQuizFromItems,
        shuffle,
      }),
    });
    const tilesHTML = buildHomeTilesHTML(avail, dProg);
    panel.innerHTML = `
      <div class="home">
        <div class="hero">
          <div class="heroTop">
            <div class="badge">Temario activo</div>
            <div class="heroKpis">
              <span class="heroPill">👤 ${active?.name || "Invitado"}</span>
              <span class="heroPill">📚 ${baseSel.length}/${items.length} ítems</span>
            </div>
          </div>
          <h2>${deck.title || "Repaso"}</h2>
          <p class="heroSub muted">${[deck.subject, deck.level, deck.course].filter(Boolean).join(" · ") || "Practica por tema, bloque y modo de juego."}</p>
          <div class="selectionSummary" aria-label="Resumen de selección actual">
            <span class="helpTag">Tema: ${uiState.topic === "all" ? "Todos" : (topics.find(t => t.id === uiState.topic)?.name || "Personalizado")}</span>
            <span class="helpTag">Rango: ${uiState.range === "hasta" ? "Hasta tema" : "Solo tema"}</span>
            <span class="helpTag">Bloque: ${uiState.cat === "mix" ? "Mixto" : uiState.cat}</span>
            <span class="helpTag">Dificultad: ${uiState.diff === "mix" ? "Mixta" : uiState.diff}</span>
            <span class="helpTag">Examen: ${uiState.count} preguntas</span>
          </div>
        </div>

        <section class="homeSection">
          <div class="sectionHead">
            <h3>⚙️ Configuración de la partida</h3>
            <p class="muted">Ajusta filtros y luego elige un modo de juego.</p>
          </div>
          ${topicControlsHTML({ topics, items, uiState, filterByTopic, topicIndex, getCategoryOptions, norm })}
        </section>

        <section class="homeSection">
          <div class="sectionHead">
            <h3>🎮 Modos de juego</h3>
            <p class="muted">Los modos desactivados se habilitan automáticamente cuando hay contenido compatible.</p>
          </div>
          <div class="homeGrid" role="list" aria-label="Tipos de juego disponibles">
            ${tilesHTML}
          </div>
        </section>

        <section class="homeSection">
          <div class="sectionHead">
            <h3>📈 Estado actual</h3>
          </div>
          <div class="statusCards">
            <div class="statusCard"><span class="k">Dominio</span><b>${mastery}%</b></div>
            <div class="statusCard"><span class="k">Respuestas</span><b>${totalAnswers}</b></div>
            <div class="statusCard"><span class="k">Errores pendientes</span><b>${pendingErrors}</b></div>
            <div class="statusCard wide"><span class="k">Última vez jugada</span><b>${last}</b></div>
          </div>
        </section>
      </div>
    `;

    const selectedItems = () => applySelectionFilters(items, uiState, topics, topicIndex, norm);
    const _goFlash = panel.querySelector("#goFlash");
    if (_goFlash) _goFlash.onclick = () => runIfCanSave(() => startFlash(selectedItems()));
    const _goQuiz = panel.querySelector("#goQuiz");
    if (_goQuiz) _goQuiz.onclick = () => runIfCanSave(() => startQuiz(selectedItems()));
    const _goTF = panel.querySelector("#goTF");
    if (_goTF) _goTF.onclick = () => runIfCanSave(() => startTF(selectedItems()));
    const _goSpelling = panel.querySelector("#goSpelling");
    if (_goSpelling) _goSpelling.onclick = () => runIfCanSave(() => startSpelling(selectedItems()));
    const _goListening = panel.querySelector("#goListening");
    if (_goListening) _goListening.onclick = () => runIfCanSave(() => startListening(selectedItems()));
    const _goSentence = panel.querySelector("#goSentence");
    if (_goSentence) _goSentence.onclick = () => runIfCanSave(() => startSentenceBuilder(selectedItems()));
    const _goGrammar = panel.querySelector("#goGrammar");
    if (_goGrammar) _goGrammar.onclick = () => runIfCanSave(() => startGrammarFix(selectedItems()));

    const _goExam = panel.querySelector("#goExam");
    if (_goExam) _goExam.onclick = () => runIfCanSave(() => startExam(selectedItems(), uiState.count));
    const _goMixed = panel.querySelector("#goMixed");
    if (_goMixed) _goMixed.onclick = () => runIfCanSave(() => startMixedChallenge(selectedItems(), uiState.count));
    const _goMemory = panel.querySelector("#goMemory");
    if (_goMemory) _goMemory.onclick = () => runIfCanSave(() => startMemory(selectedItems()));
    const _goTimeline = panel.querySelector("#goTimeline");
    if (_goTimeline) _goTimeline.onclick = () => runIfCanSave(() => startTimeline(selectedItems()));
    const _goClassify = panel.querySelector("#goClassify");
    if (_goClassify) _goClassify.onclick = () => runIfCanSave(() => startClassify(selectedItems()));
    const _goErrors = panel.querySelector("#goErrors");
    if (_goErrors) _goErrors.onclick = () => runIfCanSave(() => startErrors());

    wireTopicControls({ root, topics, uiState, onChange: renderHome });
    updateSidePanel();
  }

  function setPlayed(mode){
    if (!playerId){ updateSidePanel(); return; }
    const dProg = currentDeckProgress();
    modeStartedAt = Date.now();
    modeAnswersAtStart = session.correct + session.wrong;
    modeCountedCompletion = false;
    dProg.lastPlayedAt = nowISO();
    dProg.sessionsStarted = toSafeInt(dProg.sessionsStarted, 0) + 1;
    dProg.modeLast = mode;
    dProg.plays = toSafeInt(dProg.sessionsCompleted, 0);
    saveProgress(progress);
    updateSidePanel();
  }

  function maybeCompleteMode(){
    if (!playerId || modeCountedCompletion) return;
    if (session.mode === "home") return;
    const answeredNow = (session.correct + session.wrong) - modeAnswersAtStart;
    const elapsedMode = Date.now() - modeStartedAt;
    if (answeredNow > 0 || elapsedMode > 15000){
      const dProg = currentDeckProgress();
      dProg.sessionsCompleted = toSafeInt(dProg.sessionsCompleted, 0) + 1;
      dProg.plays = dProg.sessionsCompleted;
      modeCountedCompletion = true;
      saveProgress(progress);
    }
  }

  // ===== Flashcards =====
  function toFlashcardItem(it){
    if (it.type === "pair") return { id: it.id, front: it.front, back: it.back };
    if (it.type === "verb") return { id: it.id, front: `${it.base}`, back: `${it.past} · ${it.pp}${it.es ? " · "+it.es : ""}` };
    // fallback from mcq/type/tf
    if (it.type === "mcq") return { id: it.id, front: it.question, back: it.answer };
    if (it.type === "type") return { id: it.id, front: it.prompt, back: it.answer };
    if (it.type === "tf") return { id: it.id, front: it.statement, back: String(it.answer) };
    return { id: it.id, front: it.id, back: "" };
  }

  function startFlash(srcItems){
    session.mode = "flashcards";
    setPlayed("flashcards");

    const pool = (Array.isArray(srcItems)?srcItems:items).map(toFlashcardItem);
    let idx = 0;
    let flipped = false;

    function render(){
      const it = pool[idx];
      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Flashcards · ${idx+1}/${pool.length}</div>
            <div class="row">
              <button class="btn ghost" id="btnPrev">←</button>
              <button class="btn ghost" id="btnNext">→</button>
            </div>
          </div>

          <div class="qBox">
            <button class="cardBig" id="card">
              <div class="small muted">${flipped ? "Respuesta" : "Pregunta"}</div>
              <div class="bigTxt">${flipped ? it.back : it.front}</div>
              <div class="small muted">Toca para girar</div>
            </button>

            <div class="row">
              <button class="btn bad" id="btnBad">No me sale</button>
              <button class="btn good" id="btnGood">Me lo sé</button>
            </div>
          </div>

          <button class="btn ghost" id="btnExit">Volver</button>
        </div>
      `;

      panel.querySelector("#card").onclick = () => { flipped = !flipped; render(); };
      panel.querySelector("#btnPrev").onclick = () => { idx = (idx-1+pool.length)%pool.length; flipped=false; render(); };
      panel.querySelector("#btnNext").onclick = () => { idx = (idx+1)%pool.length; flipped=false; render(); };

      panel.querySelector("#btnGood").onclick = () => answer(it.id, true, () => { idx = (idx+1)%pool.length; flipped=false; render(); });
      panel.querySelector("#btnBad").onclick = () => answer(it.id, false, () => { idx = (idx+1)%pool.length; flipped=false; render(); });

      panel.querySelector("#btnExit").onclick = () => { saveTime(); renderHome(); };
    }
    render();
  }

  // ===== Quiz =====
  function buildQuizFromItems(baseItems){
    const base = Array.isArray(baseItems) ? baseItems : items;
    const mcqItems = base.filter(x => x.type === "mcq");
    const pairs = base.filter(x => x.type === "pair");
    const verbs = base.filter(x => x.type === "verb");
    const types = base.filter(x => x.type === "type");

    const generated = [];

    // from pairs -> mcq
    for (const p of pairs){
      const others = pickRandom(pairs.filter(x=>x.id!==p.id), 3);
      const choices = shuffle([p.back, ...others.map(o=>o.back)]);
      generated.push({ id: "gen_"+p.id, type:"mcq", question: p.front, choices, answer: p.back });
    }
    // from verbs -> mcq base->past
    for (const v of verbs){
      const others = pickRandom(verbs.filter(x=>x.id!==v.id), 3);
      const choices = shuffle([v.past, ...others.map(o=>o.past)]);
      generated.push({ id: "gen_"+v.id, type:"mcq", question: `Past simple de "${v.base}"`, choices, answer: v.past });
    }
    // typing from type items
    for (const t of types){
      generated.push({ id: t.id, type:"type", prompt: t.prompt, answer: t.answer });
    }

    return shuffle([...mcqItems, ...generated]).slice(0, 30);
  }

  function startQuiz(srcItems){
    session.mode = "quiz";
    setPlayed("quiz");

    const base = Array.isArray(srcItems)?srcItems:items;
    const pool = buildPlayableQuizPool(base);
    if (!pool.length){
      panel.innerHTML = `
        <div class="big">
          <h2>No hay preguntas de quiz</h2>
          <p class="muted">No se encontraron preguntas compatibles para esta selección.</p>
          <div class="row"><button class="btn" id="b">Volver</button></div>
        </div>
      `;
      panel.querySelector("#b").onclick = () => renderHome();
      return;
    }    
	let idx = 0;

    function render(){
      const it = pool[idx];
      const isMcq = it.type === "mcq";
      const isType = it.type === "type";

      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Quiz · ${idx+1}/${pool.length}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">${isMcq ? it.question : it.prompt}</div>

            ${isMcq ? `
              <div class="optGrid">
                ${it.choices.map((c,i)=>`<button class="opt" data-i="${i}">${c}</button>`).join("")}
              </div>
            ` : ``}

            ${isType ? `
              <div class="row">
                <input id="ans" class="inp" placeholder="Escribe la respuesta…" autocomplete="off"/>
                <button class="btn" id="btnCheck">Comprobar</button>
              </div>
              <div class="muted small">Consejo: no importa mayúsculas ni tildes (en la corrección básica).</div>
            ` : ``}
          </div>

          <div class="row">
            <button class="btn ghost" id="btnExit">Volver</button>
            <button class="btn ghost" id="btnSkip">Saltar</button>
          </div>
        </div>
      `;

      panel.querySelector("#btnExit").onclick = () => { saveTime(); renderHome(); };
      panel.querySelector("#btnSkip").onclick = () => { idx = (idx+1)%pool.length; render(); };

      if (isMcq){
        panel.querySelectorAll(".opt").forEach(btn=>{
          btn.onclick = () => {
            const choice = btn.textContent;
            const ok = norm(choice) === norm(it.answer);
            btn.classList.add(ok ? "ok" : "no");
            setTimeout(()=> answer(it.id, ok, () => { idx = (idx+1)%pool.length; render(); }), 250);
          };
        });
      }
      if (isType){
        const inp = panel.querySelector("#ans");
        const check = () => {
          const ok = norm(inp.value) === norm(it.answer);
          panel.querySelector("#btnCheck").classList.add(ok ? "good" : "bad");
          answer(it.id, ok, () => { idx = (idx+1)%pool.length; render(); });
        };
        panel.querySelector("#btnCheck").onclick = check;
        inp.addEventListener("keydown", (e)=>{ if (e.key==="Enter") check(); });
        inp.focus();
      }
    }
    render();
  }



  // ===== Helpers for English decks =====
  function toPairsForMemory(base){
    const pairs = [];
    for (const it of base){
      if (it.type==="pair"){
        pairs.push({ id: it.id, a: it.front, b: it.back });
      } else if (it.type==="vocab"){
        pairs.push({ id: it.id, a: it.en, b: it.es || "" });
      } else if (it.type==="verb"){
        pairs.push({ id: it.id, a: it.base, b: `${it.past} · ${it.pp}${it.es ? " · "+it.es : ""}` });
      }
    }
    return pairs.filter(p=>p.a && p.b);
  }

  function buildQuizPool(base){
    const pool = [];
    const voc = base.filter(x=>x.type==="vocab");
    const verbs = base.filter(x=>x.type==="verb");
    const gram = base.filter(x=>x.type==="grammar_fix");
    const sent = base.filter(x=>x.type==="sentence_builder");

    // Vocab MCQ: ES -> EN
    for (const v of voc){
      const distract = shuffle(voc.filter(x=>x.id!==v.id)).slice(0,3).map(x=>x.en);
      const choices = shuffle([v.en, ...distract]);
      pool.push({ type:"mcq", id:v.id, question:`¿Cómo se dice "${v.es}" en inglés?`, choices, answer:v.en });
    }

    // Verbs MCQ: base -> past
    for (const vb of verbs){
      const distract = shuffle(verbs.filter(x=>x.id!==vb.id)).slice(0,3).map(x=>x.past);
      const choices = shuffle([vb.past, ...distract]);
      pool.push({ type:"mcq", id:vb.id, question:`Past Simple de "${vb.base}"`, choices, answer:vb.past });
    }

    // Grammar Fix: choose correct sentence (right + 3 wrongs)
    for (const g of gram){
      const distract = shuffle(gram.filter(x=>x.id!==g.id)).slice(0,3).map(x=>x.right);
      const choices = shuffle([g.right, ...distract]);
      pool.push({ type:"mcq", id:g.id, question:`Corrige: ${g.wrong}\n\n(${g.tag})`, choices, answer:g.right, note:g.hint_es||"" });
    }

    // Sentence builder as MCQ (pick correct full sentence)
    for (const s of sent){
      const distract = shuffle(sent.filter(x=>x.id!==s.id)).slice(0,3).map(x=>x.answer);
      const choices = shuffle([s.answer, ...distract]);
      pool.push({ type:"mcq", id:s.id, question:`Elige la frase correcta:`, choices, answer:s.answer, note:s.hint||"" });
    }

    return shuffle(pool);
  }
  
  function buildPlayableQuizPool(base){
    const safeBase = Array.isArray(base) ? base : items;

    const generalPool = buildQuizFromItems(safeBase);
    const englishPool = buildQuizPool(safeBase);

    const merged = [];
    const seen = new Set();

    for (const q of [...generalPool, ...englishPool]) {
      if (!q) continue;

      const key = [
        q.type || "",
        q.id || "",
        q.question || "",
        q.prompt || "",
        q.answer || ""
      ].join("::");

      if (seen.has(key)) continue;

      if (q.type === "mcq") {
        if (!Array.isArray(q.choices) || q.choices.length < 2) continue;
      }

      if (q.type === "type") {
        if (!q.answer) continue;
      }

      seen.add(key);
      merged.push(q);
    }

    return shuffle(merged);
  }

  function speak(text){
    try{
      if (!("speechSynthesis" in window)) return false;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-GB";
      u.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return true;
    }catch(e){ return false; }
  }

  // ===== Spelling =====
  function startSpelling(srcItems){
    session.mode = "spelling";
    setPlayed("spelling");
    const base = Array.isArray(srcItems)?srcItems:items;
    const voc = shuffle(base.filter(x=>x.type==="vocab" && x.es && x.en));
    if (!voc.length){
      panel.innerHTML = `<div class="big"><h2>No hay vocabulario</h2><p class="muted">No se encontraron ítems para Spelling.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick=()=>renderHome();
      return;
    }
    let i=0;
    const render=()=>{
      const it=voc[i%voc.length];
      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Spelling · ${i+1}/${voc.length}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">Escribe en inglés:</div>
            <div class="bigWord">“${it.es}”</div>
            <div class="row">
              <input id="ans" class="inp" placeholder="Type…" autocomplete="off"/>
              <button class="btn" id="chk">Comprobar</button>
            </div>
            <p class="muted small">${it.example ? "Ejemplo: "+it.example : ""}</p>
          </div>

          <div class="row">
            <button class="btn ghost" id="back">Volver</button>
            <button class="btn ghost" id="skip">Saltar</button>
          </div>
        </div>`;
      const inp=panel.querySelector("#ans");
      const check=()=>{
        const ok = norm(inp.value)===norm(it.en);
        answer(it.id, ok, ()=>{ i++; render(); });
      };
      panel.querySelector("#chk").onclick=check;
      inp.addEventListener("keydown",(e)=>{ if(e.key==="Enter") check(); });
      panel.querySelector("#skip").onclick=()=>{ i++; render(); };
      panel.querySelector("#back").onclick=()=>{ saveTime(); renderHome(); };
      inp.focus();
    };
    render();
  }

  // ===== Listening =====
  function startListening(srcItems){
    session.mode = "listening";
    setPlayed("listening");
    const base = Array.isArray(srcItems)?srcItems:items;
    const voc = shuffle(base.filter(x=>x.type==="vocab" && x.en));
    if (!voc.length){
      panel.innerHTML = `<div class="big"><h2>No hay vocabulario</h2><p class="muted">No se encontraron ítems para Listening.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick=()=>renderHome();
      return;
    }
    let i=0;
    const render=()=>{
      const it=voc[i%voc.length];
      const distract = shuffle(voc.filter(x=>x.id!==it.id)).slice(0,3).map(x=>x.es||x.en);
      const choices = shuffle([it.es||it.en, ...distract]);
      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Listening · ${i+1}/${voc.length}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">Escucha y elige el significado:</div>
            <div class="row">
              <button class="btn" id="play">🔊 Play</button>
              <button class="btn ghost" id="replay">Repetir</button>
            </div>
            <div class="optGrid">
              ${choices.map(c=>`<button class="opt" data-v="${c}">${c}</button>`).join("")}
            </div>
          </div>

          <div class="row">
            <button class="btn ghost" id="back">Volver</button>
            <button class="btn ghost" id="skip">Saltar</button>
          </div>
        </div>`;
      const doSpeak=()=>{ 
        const ok = speak(it.en);
        if (!ok) toast("⚠️ TTS no disponible en este navegador");
      };
      panel.querySelector("#play").onclick=doSpeak;
      panel.querySelector("#replay").onclick=doSpeak;
      doSpeak();
      panel.querySelectorAll(".opt").forEach(b=>{
        b.onclick=()=>{
          const chosen=b.dataset.v;
          const ok = norm(chosen)===norm(it.es||it.en);
          answer(it.id, ok, ()=>{ i++; render(); });
        };
      });
      panel.querySelector("#skip").onclick=()=>{ i++; render(); };
      panel.querySelector("#back").onclick=()=>{ saveTime(); renderHome(); };
    };
    render();
  }

  // ===== Sentence Builder =====
  function startSentenceBuilder(srcItems){
    session.mode = "sentence_builder";
    setPlayed("sentence_builder");
    const base = Array.isArray(srcItems)?srcItems:items;
    const pool = shuffle(base
      .filter(x=>x.type==="sentence_builder" && Array.isArray(x.words))
      .map(it => ({
        ...it,
        words: it.words.map(w => String(w ?? "").trim()).filter(Boolean),
        answer: String(it.answer ?? "").trim(),
        hint: String(it.hint ?? "").trim(),
      }))
      .filter(it => it.words.length >= 3 && it.answer)
    );
    if (!pool.length){
      panel.innerHTML = `<div class="big"><h2>No hay Sentence Builder</h2><p class="muted">No se encontraron ítems de sentence_builder.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick=()=>renderHome();
      return;
    }
    let idx=0;
    const render=()=>{
      const it=pool[idx%pool.length];
      if (!it || !Array.isArray(it.words) || it.words.length < 3 || !it.answer){
        idx++;
        if (idx >= pool.length){
          panel.innerHTML = `<div class="big"><h2>Sentence Builder no disponible</h2><p class="muted">Los ejercicios actuales no son válidos para renderizar.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
          panel.querySelector("#b").onclick=()=>renderHome();
          return;
        }
        render();
        return;
      }
      let order=shuffle(it.words.slice());
      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Sentence Builder · ${idx+1}/${pool.length}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">Ordena las palabras para formar una frase:</div>
            <p class="muted small">${it.hint || ""}</p>
            <ul class="tlList" id="sbList">
              ${order.map((w,i)=>`
                <li class="tlItem" draggable="true" data-w="${escapeHtml(w)}">
                  <span class="tlGrip">⋮⋮</span>
                  <span class="tlLbl">${escapeHtml(w)}</span>
                  <div class="tlBtns">
                    <button class="mini" data-up="${i}">↑</button>
                    <button class="mini" data-dn="${i}">↓</button>
                  </div>
                </li>
              `).join("")}
            </ul>

            <div class="row">
              <button class="btn" id="chk">Comprobar</button>
              <button class="btn ghost" id="mix">Mezclar</button>
            </div>
          </div>

          <div class="row">
            <button class="btn ghost" id="back">Volver</button>
            <button class="btn ghost" id="next">Siguiente</button>
          </div>
        </div>`;
      const list=panel.querySelector("#sbList");
      let drag=null;
      list.querySelectorAll(".tlItem").forEach(li=>{
        li.addEventListener("dragstart",()=>{ drag=li; li.classList.add("drag");});
        li.addEventListener("dragend",()=>{ li.classList.remove("drag"); drag=null;});
        li.addEventListener("dragover",(e)=>e.preventDefault());
        li.addEventListener("drop",(e)=>{e.preventDefault(); if(!drag||drag===li) return;
          const rect=li.getBoundingClientRect();
          const after=(e.clientY-rect.top)>(rect.height/2);
          list.insertBefore(drag, after?li.nextSibling:li);
        });
      });
      list.querySelectorAll(".mini").forEach(b=>{
        b.onclick=()=>{
          const up=b.dataset.up, dn=b.dataset.dn;
          const items=Array.from(list.children);
          if (up!==undefined){
            const i=parseInt(up,10); if(i>0) list.insertBefore(items[i], items[i-1]);
          } else if (dn!==undefined){
            const i=parseInt(dn,10); if(i<items.length-1) list.insertBefore(items[i+1], items[i]);
          }
        };
      });
      panel.querySelector("#mix").onclick=()=>render();
      panel.querySelector("#back").onclick=()=>{ saveTime(); renderHome(); };
      panel.querySelector("#next").onclick=()=>{ idx++; render(); };
      panel.querySelector("#chk").onclick=()=>{
        const sent = Array.from(list.querySelectorAll(".tlItem .tlLbl")).map(x=>x.textContent).join(" ").replace(/\s+/g," ").trim();
        const ok = norm(sent)===norm(it.answer);
        answer(it.id, ok, ()=>{ idx++; render(); });
      };
    };
    render();
  }

  // ===== Grammar Fix =====
  function startGrammarFix(srcItems){
    session.mode = "grammar_fix";
    setPlayed("grammar_fix");
    const base = Array.isArray(srcItems)?srcItems:items;
    const pool = shuffle(base
      .filter(x=>x.type==="grammar_fix")
      .map(it => ({
        ...it,
        wrong: String(it.wrong ?? "").trim(),
        right: String(it.right ?? "").trim(),
        tag: String(it.tag ?? "Corrige la frase").trim(),
        hint_es: String(it.hint_es ?? "").trim(),
      }))
      .filter(it => it.wrong && it.right)
    );
    if (!pool.length){
      panel.innerHTML = `<div class="big"><h2>No hay Grammar Fix</h2><p class="muted">No se encontraron ítems de grammar_fix.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick=()=>renderHome();
      return;
    }
    let idx=0;
    const render=()=>{
      const it=pool[idx%pool.length];
      if (!it || !it.right || !it.wrong){
        idx++;
        if (idx >= pool.length){
          panel.innerHTML = `<div class="big"><h2>Grammar Fix no disponible</h2><p class="muted">Los ejercicios actuales no son válidos para renderizar.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
          panel.querySelector("#b").onclick=()=>renderHome();
          return;
        }
        render();
        return;
      }
      const distract=shuffle(pool.filter(x=>x.id!==it.id)).slice(0,3).map(x=>x.right);
      const choices=shuffle(Array.from(new Set([it.right, ...distract].filter(Boolean))));
      const canRenderMcq = choices.length >= 2;
      panel.innerHTML=`
        <div class="game">
          <div class="topBar">
            <div class="muted">Grammar Fix · ${idx+1}/${pool.length}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">${it.tag || "Corrige la frase"}</div>
            <p class="muted small">${it.hint_es || ""}</p>
            <div class="badBox">❌ ${escapeHtml(it.wrong)}</div>
            ${canRenderMcq ? `
              <div class="optGrid">
                ${choices.map(c=>`<button class="opt" data-v="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("")}
              </div>
            ` : `
              <div class="row">
                <input id="ans" class="inp" placeholder="Escribe la frase correcta…" autocomplete="off"/>
                <button class="btn" id="chk">Comprobar</button>
              </div>
            `}
          </div>

          <div class="row">
            <button class="btn ghost" id="back">Volver</button>
            <button class="btn ghost" id="skip">Saltar</button>
          </div>
        </div>`;
      panel.querySelectorAll(".opt").forEach(b=>{
        b.onclick=()=>{
          const chosen=b.textContent;
          const ok = norm(chosen)===norm(it.right);
          answer(it.id, ok, ()=>{ idx++; render(); });
        };
      });
      if (!canRenderMcq){
        const inp = panel.querySelector("#ans");
        const check = () => {
          const ok = norm(inp.value) === norm(it.right);
          answer(it.id, ok, ()=>{ idx++; render(); });
        };
        panel.querySelector("#chk").onclick = check;
        inp.addEventListener("keydown",(e)=>{ if(e.key==="Enter") check(); });
      }
      panel.querySelector("#skip").onclick=()=>{ idx++; render(); };
      panel.querySelector("#back").onclick=()=>{ saveTime(); renderHome(); };
    };
    render();
  }

  // ===== Mixed Challenge =====
  function startMixedChallenge(srcItems, count){
    session.mode = "mixed_challenge";
    setPlayed("mixed_challenge");
    const pool = buildMixedChallengePool(srcItems, count, { buildQuizFromItems, shuffle });
    startExamFromPool(pool);
  }

  function startExamFromPool(pool){
    if (!pool || !pool.length){
      panel.innerHTML = `<div class="big"><h2>No hay preguntas</h2><p class="muted">No hay preguntas para este filtro.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick=()=>renderHome();
      return;
    }
    let idx=0;
    const render=()=>{
      const it=pool[idx];
      const isMcq = it.type==="mcq";
      const isType = it.type==="type";
      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Challenge · ${idx+1}/${pool.length}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">${escapeHtml(it.question || it.prompt || "")}</div>
            ${it.note ? `<p class="muted small">${escapeHtml(it.note)}</p>` : ``}

            ${isMcq ? `
              <div class="optGrid">
                ${it.choices.map((c,i)=>`<button class="opt" data-i="${i}">${escapeHtml(c)}</button>`).join("")}
              </div>
            ` : ``}

            ${isType ? `
              <div class="row">
                <input id="ans" class="inp" placeholder="Type…" autocomplete="off"/>
                <button class="btn" id="chk">Comprobar</button>
              </div>
            ` : ``}
          </div>

          <div class="row">
            <button class="btn ghost" id="exit">Volver</button>
            <button class="btn ghost" id="skip">Saltar</button>
          </div>
        </div>
      `;
      panel.querySelector("#exit").onclick=()=>{ saveTime(); renderHome(); };
      panel.querySelector("#skip").onclick=()=>{ idx=(idx+1)%pool.length; render(); };

      if (isMcq){
        panel.querySelectorAll(".opt").forEach(btn=>{
          btn.onclick=()=>{
            const choice=btn.textContent;
            const ok = norm(choice)===norm(it.answer);
            answer(it.id, ok, ()=>{ idx=(idx+1)%pool.length; render(); });
          };
        });
      }
      if (isType){
        const inp=panel.querySelector("#ans");
        const check=()=>{
          const ok = norm(inp.value)===norm(it.answer);
          answer(it.id, ok, ()=>{ idx=(idx+1)%pool.length; render(); });
        };
        panel.querySelector("#chk").onclick=check;
        inp.addEventListener("keydown",(e)=>{ if(e.key==="Enter") check(); });
        inp.focus();
      }
    };
    render();
  }

  // ===== Examen (mezclado) =====
  function startExam(srcItems, count){
    session.mode = "exam";
    setPlayed("exam");

    const base = Array.isArray(srcItems)?srcItems:items;
    const poolAll = [];

    // If deck has rich generators (English), use them
    if (typeof buildQuizPool==="function"){
      for (const q of buildQuizPool(base)) poolAll.push(q);
    }

    // MCQ (native)
    for (const it of base.filter(x=>x.type==="mcq")){
      poolAll.push({ type:"mcq", id: it.id, question: it.question, choices: it.choices, answer: it.answer });
    }
    // Typing
    for (const it of base.filter(x=>x.type==="type")){
      poolAll.push({ type:"type", id: it.id, prompt: it.prompt, answer: it.answer });
    }
    // TF
    for (const it of base.filter(x=>x.type==="tf")){
      poolAll.push({ type:"tf", id: it.id, statement: it.statement, answer: !!it.answer });
    }

    const n = Math.max(5, Math.min(40, count || 15));
    const pool = shuffle(poolAll).slice(0, n);
    if (!pool.length){
      panel.innerHTML = `<div class="big"><h2>No hay preguntas</h2><p class="muted">No se han encontrado ítems para este tema/rango.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick = () => renderHome();
      return;
    }

    let idx = 0;

    function render(){
      const it = pool[idx];
      const isMcq = it.type==="mcq";
      const isType = it.type==="type";
      const isTF  = it.type==="tf";

      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Examen · ${idx+1}/${pool.length}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">${isMcq ? it.question : (isType ? it.prompt : it.statement)}</div>

            ${isMcq ? `
              <div class="optGrid">
                ${it.choices.map((c,i)=>`<button class="opt" data-i="${i}">${c}</button>`).join("")}
              </div>
            ` : ``}

            ${isTF ? `
              <div class="row">
                <button class="btn" id="tfT">Verdadero</button>
                <button class="btn ghost" id="tfF">Falso</button>
              </div>
            ` : ``}

            ${isType ? `
              <div class="row">
                <input id="ans" class="inp" placeholder="Escribe la respuesta…" autocomplete="off"/>
                <button class="btn" id="btnCheck">Comprobar</button>
              </div>
              <div class="muted small">No importa mayúsculas ni tildes (corrección básica).</div>
            ` : ``}
          </div>

          <div class="row">
            <button class="btn ghost" id="btnExit">Volver</button>
            <button class="btn ghost" id="btnSkip">Saltar</button>
          </div>
        </div>
      `;

      panel.querySelector("#btnExit").onclick = () => { saveTime(); renderHome(); };
      panel.querySelector("#btnSkip").onclick = () => { idx = (idx+1)%pool.length; render(); };

      if (isMcq){
        panel.querySelectorAll(".opt").forEach(btn=>{
          btn.onclick = () => {
            const choice = btn.textContent;
            const ok = norm(choice) === norm(it.answer);
            btn.classList.add(ok ? "ok" : "no");
            setTimeout(()=> answer(it.id, ok, () => { idx = (idx+1)%pool.length; render(); }), 250);
          };
        });
      }
      if (isTF){
        panel.querySelector("#tfT").onclick = () => {
          const ok = (it.answer === true);
          answer(it.id, ok, () => { idx = (idx+1)%pool.length; render(); });
        };
        panel.querySelector("#tfF").onclick = () => {
          const ok = (it.answer === false);
          answer(it.id, ok, () => { idx = (idx+1)%pool.length; render(); });
        };
      }
      if (isType){
        const inp = panel.querySelector("#ans");
        const check = () => {
          const ok = norm(inp.value) === norm(it.answer);
          panel.querySelector("#btnCheck").classList.add(ok ? "good" : "bad");
          answer(it.id, ok, () => { idx = (idx+1)%pool.length; render(); });
        };
        panel.querySelector("#btnCheck").onclick = check;
        inp.addEventListener("keydown", (e)=>{ if (e.key==="Enter") check(); });
        inp.focus();
      }
    }

    render();
  }

  // ===== Parejas / Memory =====
  function startMemory(srcItems){
    session.mode = "memory";
    setPlayed("memory");

    const base = Array.isArray(srcItems)?srcItems:items;
    const pairs = toPairsForMemory(base);

    if (pairs.length < 3){
      panel.innerHTML = `<div class="big"><h2>No hay suficientes parejas</h2><p class="muted">Necesitas al menos 3 tarjetas de tipo “pair/flashcard”.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick = () => renderHome();
      return;
    }

    const pick = shuffle(pairs).slice(0, Math.min(8, Math.max(3, Math.floor(pairs.length/2))));
    const cards = shuffle(pick.flatMap(p => ([
      { key: p.id, side:"a", text:p.a },
      { key: p.id, side:"b", text:p.b }
    ])));

    let open = [];
    let matched = new Set();

    function render(){
      const totalPairs = pick.length;
      const done = matched.size;
      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Parejas · ${done}/${totalPairs}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">Encuentra las parejas correctas</div>
            <div class="memGrid">
              ${cards.map((c,i)=>{
                const isOpen = open.includes(i);
                const isMatch = matched.has(c.key);
                const label = (isOpen || isMatch) ? c.text : "❓";
                return `<button class="memCard ${isMatch?'ok':''}" data-i="${i}">${label}</button>`;
              }).join("")}
            </div>
          </div>

          <div class="row">
            <button class="btn ghost" id="btnExit">Volver</button>
            <button class="btn ghost" id="btnReset">Reiniciar</button>
          </div>
        </div>
      `;

      panel.querySelector("#btnExit").onclick = () => { saveTime(); renderHome(); };
      panel.querySelector("#btnReset").onclick = () => startMemory(srcItems);

      panel.querySelectorAll(".memCard").forEach(btn=>{
        btn.onclick = () => {
          const i = parseInt(btn.dataset.i,10);
          if (matched.has(cards[i].key)) return;
          if (open.includes(i)) return;
          if (open.length >= 2) return;

          open.push(i);
          render();

          if (open.length === 2){
            const [a,b] = open;
            const ok = cards[a].key === cards[b].key;
            const itemId = cards[a].key;
            setTimeout(()=>{
              if (ok){
                matched.add(itemId);
                answer(itemId, true, ()=>{});
              } else {
                answer(itemId, false, ()=>{});
              }
              open = [];
              if (matched.size === totalPairs){
                // finish
                setTimeout(()=>toast("🎉 ¡Completado!"), 50);
              }
              render();
            }, 450);
          }
        };
      });
    }

    render();
  }


  // ===== Línea del tiempo =====
  function startTimeline(srcItems){
    session.mode = "timeline";
    setPlayed("timeline");

    const base = Array.isArray(srcItems)?srcItems:items;
    const pool = shuffle(base.filter(hasTimelinePayload));
    if (!pool.length){
      panel.innerHTML = `<div class="big"><h2>No hay líneas del tiempo</h2><p class="muted">No se han encontrado ítems de tipo “timeline” para este tema/rango.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick = () => renderHome();
      return;
    }

    let idx = 0;
    let order = [];

    const render = () => {
      const it = pool[idx];
      order = shuffle(it.events.map((e,i)=>({i, ...e})));

      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Línea del tiempo · ${idx+1}/${pool.length}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">${it.prompt}</div>
            <p class="muted small">Arrastra para ordenar (o usa ↑↓ en móvil) y pulsa “Comprobar”.</p>

            <ul class="tlList" id="tlList">
              ${order.map((e,pi)=>`
                <li class="tlItem" draggable="true" data-i="${e.i}">
                  <span class="tlGrip">⋮⋮</span>
                  <span class="tlLbl">${e.label}</span>
                  <div class="tlBtns">
                    <button class="mini" data-up="${pi}">↑</button>
                    <button class="mini" data-dn="${pi}">↓</button>
                  </div>
                </li>
              `).join("")}
            </ul>

            <div class="row">
              <button class="btn" id="btnCheck">Comprobar</button>
              <button class="btn ghost" id="btnShuffle">Mezclar</button>
            </div>
          </div>

          <div class="row">
            <button class="btn ghost" id="btnExit">Volver</button>
            <button class="btn ghost" id="btnNext">Siguiente</button>
          </div>
        </div>
      `;

      // drag reorder
      const list = panel.querySelector("#tlList");
      let dragEl = null;
      list.querySelectorAll(".tlItem").forEach(li=>{
        li.addEventListener("dragstart", ()=>{ dragEl = li; li.classList.add("drag"); });
        li.addEventListener("dragend", ()=>{ li.classList.remove("drag"); dragEl = null; });
        li.addEventListener("dragover", (e)=>{ e.preventDefault(); });
        li.addEventListener("drop", (e)=>{ 
          e.preventDefault();
          if (!dragEl || dragEl === li) return;
          const rect = li.getBoundingClientRect();
          const after = (e.clientY - rect.top) > (rect.height/2);
          list.insertBefore(dragEl, after ? li.nextSibling : li);
        });
      });

      // up/down buttons
      list.querySelectorAll(".mini").forEach(b=>{
        b.onclick = () => {
          const up = b.dataset.up;
          const dn = b.dataset.dn;
          const items = Array.from(list.children);
          if (up !== undefined){
            const i = parseInt(up,10);
            if (i>0) list.insertBefore(items[i], items[i-1]);
          } else if (dn !== undefined){
            const i = parseInt(dn,10);
            if (i < items.length-1) list.insertBefore(items[i+1], items[i]);
          }
        };
      });

      panel.querySelector("#btnShuffle").onclick = () => render();
      panel.querySelector("#btnExit").onclick = () => { saveTime(); renderHome(); };
      panel.querySelector("#btnNext").onclick = () => { idx = (idx+1)%pool.length; render(); };

      panel.querySelector("#btnCheck").onclick = () => {
        const ids = Array.from(list.querySelectorAll(".tlItem")).map(li=>parseInt(li.dataset.i,10));
        const orderedYears = ids.map(i=>it.events[i].year);
        const sortedYears = [...orderedYears].slice().sort((a,b)=>a-b);
        const ok = orderedYears.every((y,ii)=>y===sortedYears[ii]);

        answer(it.id, ok, ()=>{});
        toast(ok ? "✅ ¡Correcto!" : "❌ Revisa el orden");
        if (!ok){
          // show years hint
          Array.from(list.querySelectorAll(".tlItem")).forEach(li=>{
            const i = parseInt(li.dataset.i,10);
            li.querySelector(".tlLbl").textContent = `${it.events[i].label} (${it.events[i].year})`;
          });
        }
      };
    };

    render();
  }

  // ===== Clasificar =====
  function startClassify(srcItems){
    session.mode = "classify";
    setPlayed("classify");

    const base = Array.isArray(srcItems)?srcItems:items;
    const pool = shuffle(base.filter(hasClassifyPayload));
    if (!pool.length){
      panel.innerHTML = `<div class="big"><h2>No hay ejercicios de clasificar</h2><p class="muted">No se han encontrado ítems de tipo “classify” para este tema/rango.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick = () => renderHome();
      return;
    }

    let idx = 0;

    const render = () => {
      const it = pool[idx];
      const groupNames = Object.keys(it.groups || {});
      const all = [];
      for (const g of groupNames){
        for (const x of it.groups[g]){
          all.push({text:x, group:g});
        }
      }
      const shuffled = shuffle(all);
      const assigned = {}; // text -> group chosen
      let open = shuffled.map(x=>x.text);

      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Clasificar · ${idx+1}/${pool.length}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">${it.prompt}</div>
            <p class="muted small">Toca un elemento y luego el grupo donde va (modo móvil-friendly).</p>

            <div class="chipsRow" id="pickRow">
              ${open.map(t=>`<button class="pick" data-t="${t}">${t}</button>`).join("")}
            </div>

            <div class="clsGrid">
              ${groupNames.map(g=>`
                <div class="clsCol" data-g="${g}">
                  <div class="clsHead">${g}</div>
                  <div class="clsBox" id="box_${g.replace(/[^a-z0-9]/gi,'_')}"></div>
                </div>
              `).join("")}
            </div>

            <div class="row">
              <button class="btn" id="btnCheck">Comprobar</button>
              <button class="btn ghost" id="btnReset">Reiniciar</button>
            </div>
          </div>

          <div class="row">
            <button class="btn ghost" id="btnExit">Volver</button>
            <button class="btn ghost" id="btnNext">Siguiente</button>
          </div>
        </div>
      `;

      let selected = null;

      const rerenderPick = () => {
        const row = panel.querySelector("#pickRow");
        row.innerHTML = open.map(t=>`<button class="pick ${selected===t?'on':''}" data-t="${t}">${t}</button>`).join("");
        row.querySelectorAll(".pick").forEach(b=>{
          b.onclick = () => { selected = b.dataset.t; rerenderPick(); };
        });
      };

      rerenderPick();

      panel.querySelectorAll(".clsCol").forEach(col=>{
        col.onclick = () => {
          if (!selected) return;
          const g = col.dataset.g;
          assigned[selected] = g;
          // move chip to column
          open = open.filter(x=>x!==selected);
          const box = col.querySelector(".clsBox");
          const chip = document.createElement("div");
          chip.className = "clsItem";
          chip.textContent = selected;
          chip.dataset.t = selected;
          chip.onclick = (e)=>{ e.stopPropagation(); // unassign
            delete assigned[selected];
            open.push(selected);
            chip.remove();
            selected = null;
            rerenderPick();
          };
          box.appendChild(chip);
          selected = null;
          rerenderPick();
        };
      });

      panel.querySelector("#btnReset").onclick = () => render();
      panel.querySelector("#btnExit").onclick = () => { saveTime(); renderHome(); };
      panel.querySelector("#btnNext").onclick = () => { idx = (idx+1)%pool.length; render(); };

      panel.querySelector("#btnCheck").onclick = () => {
        const total = all.length;
        let okCount = 0;
        for (const x of all){
          if (assigned[x.text] === x.group) okCount++;
        }
        const ok = (okCount === total) && (Object.keys(assigned).length === total);
        answer(it.id, ok, ()=>{});
        toast(ok ? "✅ ¡Perfecto!" : `❌ ${okCount}/${total} correctas`);

        // mark wrongs
        panel.querySelectorAll(".clsItem").forEach(el=>{
          const t = el.dataset.t;
          const correctG = all.find(a=>a.text===t)?.group;
          const chosen = assigned[t];
          if (chosen !== correctG){
            el.classList.add("bad");
            el.title = `Correcto: ${correctG}`;
          } else {
            el.classList.add("ok");
          }
        });
      };
    };

    render();
  }

  // ===== True/False =====
  function startTF(srcItems){
    session.mode = "tf";
    setPlayed("tf");

    const base = Array.isArray(srcItems)?srcItems:items;
    const pool = shuffle(base.filter(x=>x.type==="tf" && typeof x.statement === "string" && typeof x.answer === "boolean")).slice(0, 30);
    if (!pool.length){
      panel.innerHTML = `<div class="big"><h2>No hay True/False en este deck</h2><button class="btn ghost" id="btnBack">Volver</button></div>`;
      panel.querySelector("#btnBack").onclick = ()=>renderHome();
      return;
    }
    let idx = 0;

    function render(){
      const it = pool[idx];
      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">True/False · ${idx+1}/${pool.length}</div>
            <div class="muted">Aciertos ${session.correct} · Fallos ${session.wrong} · Racha ${session.streak}</div>
          </div>

          <div class="qBox">
            <div class="qText">${it.statement}</div>
            <div class="row">
              <button class="btn good" id="btnTrue">Verdadero</button>
              <button class="btn bad" id="btnFalse">Falso</button>
            </div>
          </div>

          <div class="row">
            <button class="btn ghost" id="btnExit">Volver</button>
          </div>
        </div>
      `;
      panel.querySelector("#btnExit").onclick = () => { saveTime(); renderHome(); };
      panel.querySelector("#btnTrue").onclick = () => answer(it.id, it.answer===true, () => { idx=(idx+1)%pool.length; render(); });
      panel.querySelector("#btnFalse").onclick = () => answer(it.id, it.answer===false, () => { idx=(idx+1)%pool.length; render(); });
    }
    render();
  }

  // ===== Errors =====
  function startErrors(){
    session.mode = "errors";
    setPlayed("errors");

    const dProg = currentDeckProgress();
    const err = dProg?.errorsRecent || [];
    if (!err.length){
      panel.innerHTML = `<div class="big"><h2>No hay errores pendientes</h2><p class="muted">¡Genial! Vuelve al inicio para seguir repasando.</p><button class="btn ghost" id="btnBack">Volver</button></div>`;
      panel.querySelector("#btnBack").onclick = ()=>renderHome();
      return;
    }
    // build flashcards from error ids
    const map = new Map(items.map(x=>[x.id,x]));
    const pool = err.map(id=>map.get(id)).filter(Boolean).map(toFlashcardItem);
    let idx = 0;
    let flipped = false;

    function render(){
      const it = pool[idx];
      panel.innerHTML = `
        <div class="game">
          <div class="topBar">
            <div class="muted">Repasar errores · ${idx+1}/${pool.length}</div>
            <div class="row">
              <button class="btn ghost" id="btnPrev">←</button>
              <button class="btn ghost" id="btnNext">→</button>
            </div>
          </div>

          <div class="qBox">
            <button class="cardBig" id="card">
              <div class="small muted">${flipped ? "Respuesta" : "Pregunta"}</div>
              <div class="bigTxt">${flipped ? it.back : it.front}</div>
              <div class="small muted">Toca para girar</div>
            </button>

            <div class="row">
              <button class="btn bad" id="btnBad">Aún no</button>
              <button class="btn good" id="btnGood">Ya</button>
            </div>
          </div>

          <button class="btn ghost" id="btnExit">Volver</button>
        </div>
      `;

      panel.querySelector("#card").onclick = () => { flipped = !flipped; render(); };
      panel.querySelector("#btnPrev").onclick = () => { idx = (idx-1+pool.length)%pool.length; flipped=false; render(); };
      panel.querySelector("#btnNext").onclick = () => { idx = (idx+1)%pool.length; flipped=false; render(); };

      panel.querySelector("#btnGood").onclick = () => answer(it.id, true, () => { idx = (idx+1)%pool.length; flipped=false; render(); });
      panel.querySelector("#btnBad").onclick = () => answer(it.id, false, () => { idx = (idx+1)%pool.length; flipped=false; render(); });

      panel.querySelector("#btnExit").onclick = () => { saveTime(); renderHome(); };
    }
    render();
  }

  // ===== Answer common =====
  function answer(itemId, ok, next){
    session.lastItemId = itemId;
    if (ok){
      session.correct++;
      session.streak++;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
    } else {
      session.wrong++;
      session.streak = 0;
    }

    if (playerId){
      const dProg = currentDeckProgress();
      dProg.correct = toSafeInt(dProg.correct, 0) + (ok ? 1 : 0);
      dProg.wrong = toSafeInt(dProg.wrong, 0) + (ok ? 0 : 1);
      dProg.totalAnswers = toSafeInt(dProg.totalAnswers, 0) + 1;
      dProg.bestStreak = Math.max(dProg.bestStreak||0, session.bestStreak);
      dProg.lastPlayedAt = nowISO();
      updateProgressAfterAnswer(dProg, itemId, ok);
      saveProgress(progress);
    }
    updateSidePanel();

    next?.();
  }

  // start
  renderHome();
  updateSidePanel();

  // unload time save
  window.addEventListener("beforeunload", () => {
    try { saveTime(); } catch(e){}
  });

  const prevCleanup = root.__repasoCleanup;
  root.__repasoCleanup = () => {
    try { window.removeEventListener("repaso:deck-home", onDeckHomeRequest); } catch(e){}
    if (typeof prevCleanup === "function") prevCleanup();
  };
}
