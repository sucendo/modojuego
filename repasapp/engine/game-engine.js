// engine/game-engine.js
// Motor común (v1): Flashcards + Quiz (MCQ/Typing) + True/False
// Guarda estadísticas por jugador + deck en localStorage.

import { getActivePlayer, loadProgress, saveProgress, nowISO, norm, pickRandom, shuffle } from "./storage.js";

export async function loadDeck(url) {
  // Loader tolerante: fetch -> XHR
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } catch (e) {
    // Fallback XHR (a veces funciona donde fetch falla)
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

export 
function escapeHtml(s){
  // Prevent HTML injection when we render user/deck text inside template strings
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function getDeckItems(deck){
  return Array.isArray(deck.items) ? deck.items : [];
}

function ensureDeckProgress(progress, playerId, deckId){
  progress.players ||= {};
  progress.players[playerId] ||= { name: null, decks: {} };
  const p = progress.players[playerId];
  p.decks ||= {};
  p.decks[deckId] ||= {
    lastPlayedAt: null,
    timeSpentMs: 0,
    plays: 0,
    correct: 0,
    wrong: 0,
    bestStreak: 0,
    modeLast: null,
    itemStats: {},          // id -> {c,w,lastSeen,nextReview}
    errorsRecent: []        // ids
  };
  return p.decks[deckId];
}

function updateProgressAfterAnswer(dProg, itemId, ok){
  dProg.itemStats ||= {};
  const st = dProg.itemStats[itemId] || { c:0, w:0, lastSeen:null };
  if (ok) st.c++; else st.w++;
  st.lastSeen = nowISO();
  dProg.itemStats[itemId] = st;

  if (!ok){
    dProg.errorsRecent ||= [];
    dProg.errorsRecent.unshift(itemId);
    dProg.errorsRecent = Array.from(new Set(dProg.errorsRecent)).slice(0, 40);
  }
}

export function computeMastery(dProg){
  const c = dProg.correct || 0;
  const w = dProg.wrong || 0;
  const total = c + w;
  if (!total) return 0;
  return Math.round((c / total) * 100);
}

export function initUI(root){
  root.className = "app";
  root.innerHTML = `
    
      <header>
        <div class="title">
          <h1><span class="spark">🎮</span> <span id="title">Repaso</span></h1>
          <small id="subtitle">Motor común + temarios en JSON</small>
        </div>

        <div class="controls">
          <div class="player" id="playerBox"></div>
          <button class="btn btn-ghost" id="btnHome">Inicio</button>
          <button class="btn btn-a" id="btnStats">📊 Stats</button>
        </div>
      </header>

      <div class="main mainGrid">
        <section class="panel" id="panel"></section>
        <aside class="panel status" id="side"></aside>
      </div>

      <div class="footer">
        <div><span id="hint">Tip: crea jugadores desde el portal.</span></div>
        <div class="muted">Motor Repaso · v1</div>
      </div>


    <!-- Stats modal -->
    <div class="modalBack" id="modalBack" aria-hidden="true">
      <div class="modal" role="dialog" aria-modal="true">
        <header>
          <h3>📊 Perfil &amp; Progreso</h3>
          <button class="btn btn-ghost" id="closeModal">Cerrar</button>
        </header>
        <div class="body" id="modalBody"></div>
      </div>
    </div>
  `;
}

export async function runGame({ root, deckUrl }){
  const deck = await loadDeck(deckUrl);
  const items = getDeckItems(deck);

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

  function filterByCategory(src){
    const c = uiState.cat;
    if (!c || c === "mix") return src;
    return src.filter(it => (it.category || it.cat || "mix") === c);
  }

  function filterByDifficulty(src){
    const d = uiState.diff;
    if (!d || d === "mix") return src;
    const maxD = parseInt(d,10);
    if (!maxD) return src;
    return src.filter(it => (typeof it.difficulty === "number" ? it.difficulty : 1) <= maxD);
  }

  function getItemUnits(it){
    return it.units || (it.u) || (it.topic ? [it.topic] : []);
  }

  function filterByTopic(src){
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

  function topicControlsHTML(){
    if (!topics.length) return "";
    const opts = ['<option value="all">Todos los temas</option>']
      .concat(topics.map(t => `<option value="${t.id}">${t.name}</option>`))
      .join("");
    return `
      <div class="controls2">
        <label class="lab">Tema
          <select id="selTopic" class="sel">${opts}</select>
        </label>
        <label class="lab">Rango
          <select id="selRange" class="sel">
            <option value="solo">Solo tema</option>
            <option value="hasta">Hasta tema</option>
          </select>
        </label>
        <label class="lab">Bloque
          <select id="selCat" class="sel">
            <option value="mix" selected>Mix</option>
            <option value="verbs">Irregular Verbs</option>
            <option value="vocab">Vocabulary</option>
            <option value="grammar">Grammar</option>
          </select>
        </label>

        <label class="lab">Dificultad
          <select id="selDiff" class="sel">
            <option value="mix" selected>Mixto</option>
            <option value="1">Fácil</option>
            <option value="2">Medio</option>
            <option value="3">Difícil</option>
          </select>
        </label>
        <label class="lab">Examen
          <select id="selCount" class="sel">
            <option value="10">10 preguntas</option>
            <option value="15" selected>15 preguntas</option>
            <option value="20">20 preguntas</option>
          </select>
        </label>
      </div>
    `;
  }

  function wireTopicControls(){
    if (!topics.length) return;
    const st = root.querySelector("#selTopic");
    const sr = root.querySelector("#selRange");
    const sca = root.querySelector("#selCat");
    const sd = root.querySelector("#selDiff");
    const sc = root.querySelector("#selCount");
    if (!st || !sr || !sca || !sd || !sc) return;

    st.value = uiState.topic;
    sr.value = uiState.range;
    sca.value = uiState.cat;

    sd.value = uiState.diff;

    sc.value = String(uiState.count);

    st.onchange = () => { uiState.topic = st.value; renderHome(); };
    sr.onchange = () => { uiState.range = sr.value; renderHome(); };
    sca.onchange = () => { uiState.cat = sca.value; renderHome(); };
    sd.onchange = () => { uiState.diff = sd.value; renderHome(); };
    sc.onchange = () => { uiState.count = parseInt(sc.value,10) || 15; };
  }

  const active = getActivePlayer(); // from portal store
  const playerLabel = active?.name ? `👤 ${active.name}` : "👤 Invitado";
  root.querySelector("#title").textContent = deck.title || "Repaso";
  root.querySelector("#subtitle").textContent = `${deck.subject || ""} · ${deck.level || ""}`.replace(/\s+·\s+$/,"");
  root.querySelector("#playerBox").textContent = playerLabel;

  const panel = root.querySelector("#panel");
  const btnHome = root.querySelector("#btnHome");
  const btnStats = root.querySelector("#btnStats");

  const modalBack = root.querySelector("#modalBack");
  const modalBody = root.querySelector("#modalBody");
  const closeModal = root.querySelector("#closeModal");

  const session = makeSession(deck.id);
  let progress = loadProgress();
  let playerId = active?.id || null;

  // ----- Sidebar (right panel) -----
  function sideHTML(){
    return `

      <h2>Profile / Perfil <span class="badge">🏆</span></h2>

      <div class="pill"><span>Score / Puntuación</span><b id="sideScore">0</b></div>
      <div class="pill"><span>Correct / Aciertos</span><b id="sideCorrect">0</b></div>
      <div class="pill"><span>Wrong / Fallos</span><b id="sideWrong">0</b></div>
      <div class="pill"><span>Streak / Racha</span><b id="sideStreak">0</b></div>
      <div class="pill"><span>Best streak / Mejor racha</span><b id="sideBest">0</b></div>

      <div class="pill"><span>Items (set) / Ítems</span><b id="sideCount">0</b></div>
      <div class="pill"><span>Mastery / Dominio</span><b id="sideMastery">0%</b></div>
      <div class="pill"><span>Last time / Última vez</span><b id="sideLast">—</b></div>

      <div id="sideMsg" class="msg">Choose unit/topic &amp; mode · Elige unidad/tema y modo 🙂</div>

      <div class="card" style="padding:12px">
        <div class="tiny" style="text-align:center">
          Shortcuts / Atajos:
          <span class="kbd">N</span> next · <span class="kbd">S</span> speak ·
          <span class="kbd">R</span> reset · <span class="kbd">H</span> hint
        </div>
      </div>

      <div class="tiny" id="sideTip">Tip: the engine repeats what you miss · El motor repite lo que fallas.</div>

    `;
  }

  function computeScore(){
    // simple score to match your other games
    return Math.max(0, session.correct*10 - session.wrong*3 + Math.min(25, session.bestStreak*2));
  }

  function setSideMessage(text, type=""){
    const el = side?.querySelector("#sideMsg");
    if (!el) return;
    el.className = "msg" + (type ? " " + type : "");
    el.textContent = text;
  }

  function updateSidebar(extra={}){
    if (!side) return;
    if (!side.dataset.ready){
      side.innerHTML = sideHTML();
      side.dataset.ready = "1";
    }
    const dProg = currentDeckProgress();
    const mastery = dProg ? computeMastery(dProg) : 0;
    const count = (typeof extra.count==="number") ? extra.count : (extra.poolLen||0);

    const setText = (id, val)=>{
      const el = side.querySelector("#"+id);
      if (el) el.textContent = String(val);
    };

    setText("sideScore", computeScore());
    setText("sideCorrect", session.correct);
    setText("sideWrong", session.wrong);
    setText("sideStreak", session.streak);
    setText("sideBest", session.bestStreak);
    setText("sideCount", count || (dProg?.itemsTotal||0) || 0);

    const last = dProg?.lastPlayedAt ? new Date(dProg.lastPlayedAt).toLocaleString() : "—";
    setText("sideLast", last);
    const m01 = Math.max(0, Math.min(1, (mastery>1?mastery/100:mastery)));
    setText("sideMastery", Math.round(m01*100)+"%");

    // optional: show current difficulty
    if (extra.difficulty){
      const tip = side.querySelector("#sideTip");
      if (tip) tip.textContent = "Dificultad: " + extra.difficulty + " · Objetivo: variedad + repaso inteligente.";
    }
  }


  function currentDeckProgress(){
    if (!playerId){
      return null;
    }
    return ensureDeckProgress(progress, playerId, deck.id);
  }

  function saveTime(){
    if (!playerId) return;
    const dProg = currentDeckProgress();
    const elapsed = Math.max(0, Date.now() - session.startedAt);
    dProg.timeSpentMs += elapsed;
    session.startedAt = Date.now();
    saveProgress(progress);
  }

  
  function drawStatsChart(canvas, history){
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width = canvas.clientWidth * (window.devicePixelRatio||1);
    const H = canvas.height = canvas.clientHeight * (window.devicePixelRatio||1);
    const dpr = (window.devicePixelRatio||1);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0,0,w,h);

    const pad = 28;
    const xs = history.map((_,i)=>i);
    const mastery = history.map(ev => Math.max(0, Math.min(1, ev.mastery ?? 0)));
    const score = history.map(ev => Number(ev.score||0));

    const xMax = Math.max(1, xs.length-1);
    const yMaxScore = Math.max(10, ...score);
    // grid
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(15,23,42,.35)";
    for (let g=0; g<=4; g++){
      const y = pad + (h-2*pad) * (g/4);
      ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const xTo = (i)=> pad + (w-2*pad) * (i/xMax);
    const yToMastery = (m)=> pad + (h-2*pad) * (1-m);
    const yToScore = (s)=> pad + (h-2*pad) * (1-(s/yMaxScore));

    // mastery line (blue-ish)
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(99,102,241,.95)";
    ctx.beginPath();
    mastery.forEach((m,i)=>{
      const x=xTo(i), y=yToMastery(m);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();

    // score line (green-ish)
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(34,197,94,.95)";
    ctx.beginPath();
    score.forEach((s,i)=>{
      const x=xTo(i), y=yToScore(s);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();

    // legend
    ctx.fillStyle = "rgba(15,23,42,.85)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Mastery/Dominio", pad, 16);
    ctx.fillStyle = "rgba(99,102,241,.95)"; ctx.fillRect(pad+118, 7, 18, 3);
    ctx.fillStyle = "rgba(15,23,42,.85)"; ctx.fillText("Score", pad+150, 16);
    ctx.fillStyle = "rgba(34,197,94,.95)"; ctx.fillRect(pad+190, 7, 18, 3);
  }

function openStats(){
    const dProg = currentDeckProgress();
    if (!dProg){
      modalBody.innerHTML = `<p class="muted">Para ver estadísticas, elige/crea un jugador en el portal.</p>`;
    } else {
      const mastery01 = Math.max(0, Math.min(1, computeMastery(dProg)));
      const masteryPct = Math.round(mastery01*100);
      const mins = Math.round((dProg.timeSpentMs||0)/60000);
      const last = dProg.lastPlayedAt ? new Date(dProg.lastPlayedAt).toLocaleString() : "—";
      const err = (dProg.errorsRecent||[]).length;

      const hist = Array.isArray(dProg.history) ? dProg.history.slice(-40) : [];
      const histCount = hist.length;

      // last 7 sessions summary
      const last7 = hist.slice(-7);
      const avg = (arr, fn) => arr.length ? (arr.reduce((a,x)=>a+fn(x),0)/arr.length) : 0;
      const avgMastery = Math.round(avg(last7, x => (x.mastery||0))*100);
      const avgScore = Math.round(avg(last7, x => (x.score||0)));

      modalBody.innerHTML = `
        <div class="big" style="padding:0">
          <h2 style="margin:0 0 10px 0">📊 Stats · ${escapeHtml(active?.name||"Jugador")}</h2>

          <div class="statsGrid">
            <div class="card"><div class="k">Mastery / Dominio</div><div class="v">${masteryPct}%</div></div>
            <div class="card"><div class="k">Plays / Partidas</div><div class="v">${dProg.plays||0}</div></div>
            <div class="card"><div class="k">Correct</div><div class="v">${dProg.correct||0}</div></div>
            <div class="card"><div class="k">Wrong</div><div class="v">${dProg.wrong||0}</div></div>
            <div class="card"><div class="k">Best streak</div><div class="v">${dProg.bestStreak||0}</div></div>
            <div class="card"><div class="k">Time</div><div class="v">${mins} min</div></div>
            <div class="card wide"><div class="k">Last time / Última vez</div><div class="v">${last}</div></div>
          </div>

          <div class="card" style="margin-top:10px">
            <div class="k">Progression / Progresión</div>
            <div class="muted small">Últimas ${histCount} sesiones (Mastery y Score)</div>
            <div style="height:220px; margin-top:10px">
              <canvas id="statsChart" style="width:100%;height:100%"></canvas>
            </div>
            <div class="muted small" style="margin-top:8px">
              Media últimas 7: Dominio ${avgMastery}% · Score ${avgScore}
            </div>
          </div>

          <div class="card" style="margin-top:10px">
            <div class="k">Modes / Modos</div>
            <div class="chips">
              ${Object.entries(dProg.played||{}).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>`<span class="chip">${escapeHtml(k)}: ${v}</span>`).join("") || `<span class="chip">—</span>`}
            </div>
          </div>

          ${err ? `<div class="card" style="margin-top:10px">
              <div class="k">Mistakes / Errores pendientes</div>
              <div class="chips">${(dProg.errorsRecent||[]).slice(0,18).map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join("")}</div>
            </div>` : ``}
        </div>
      `;

      // draw chart
      const cv = modalBody.querySelector("#statsChart");
      // slight delay to ensure layout has sizes
      setTimeout(()=>{ try{ drawStatsChart(cv, hist); }catch(e){} }, 0);
    }
    modalBack.style.display = "flex";
    document.body.style.overflow = "hidden";
  }function closeStats(){
    modalBack.style.display = "none";
    document.body.style.overflow = "";
  }

  closeModal.addEventListener("click", closeStats);
  modalBack.addEventListener("click", (e)=>{ if (e.target === modalBack) closeStats(); });

  btnStats.addEventListener("click", openStats);
  btnHome.addEventListener("click", () => renderHome());

  function ensureCanSave(){
    if (!playerId){
      panel.innerHTML = `
        <div class="big">
          <h2>Necesitas un jugador</h2>
          <p class="muted">Para guardar progreso, crea/elige un jugador en el portal (index.html) y vuelve aquí.</p>
          <div class="row">
            <a class="btn" href="../index.html">Ir al portal</a>
            <button class="btn ghost" id="btnContinue">Seguir como invitado</button>
          </div>
        </div>
      `;
      panel.querySelector("#btnContinue").onclick = () => renderHome();
      return false;
    }
    return true;
  }

  
  function computeAvailableModes(base, dProg){
    const counts = {
      flash: base.length,
      tf: base.filter(x=>x.type==="tf").length,
      timeline: base.filter(x=>x.type==="timeline").length,
      classify: base.filter(x=>x.type==="classify").length,
      grammar: base.filter(x=>x.type==="grammar_fix").length,
      sentence: base.filter(x=>x.type==="sentence_builder").length,
      vocabOrVerb: base.filter(x=>x.type==="vocab" || x.type==="verb").length,
      pairs: toPairsForMemory(base).length,
      quizPool: buildQuizPool(base).length,
    };
    return {
      flash: counts.flash > 0,
      quiz: counts.quizPool > 0,
      spelling: counts.vocabOrVerb > 0,
      listening: counts.vocabOrVerb > 0,
      sentence: counts.sentence > 0,
      grammar: counts.grammar > 0,
      tf: counts.tf > 0,
      exam: counts.quizPool > 0,
      mixed: (counts.vocabOrVerb + counts.grammar + counts.sentence) > 0,
      memory: counts.pairs >= 3,
      timeline: counts.timeline > 0,
      classify: counts.classify > 0,
      errors: (dProg?.errorsRecent?.length || 0) > 0
    };
  }

  function buildHomeTilesHTML(avail, dProg){
    const tiles = [];
    const add = (id, ico, tt, dd) => {
      tiles.push(`
        <button class="tile" id="${id}">
          <div class="ico">${ico}</div>
          <div class="tt">${tt}</div>
          <div class="dd muted">${dd}</div>
        </button>
      `);
    };

    if (avail.flash) add("goFlash","🃏","Flashcards","Conceptos y definiciones");
    if (avail.quiz) add("goQuiz","🧠","Quiz","Test + escribir");
    if (avail.spelling) add("goSpelling","✍️","Spelling","ES → EN");
    if (avail.listening) add("goListening","🔊","Listening","Escucha y responde");
    if (avail.sentence) add("goSentence","🧱","Sentence Builder","Ordena palabras");
    if (avail.grammar) add("goGrammar","🛠️","Grammar Fix","Corrige la frase");
    if (avail.tf) add("goTF","✅","Verdadero/Falso","Rápido");
    if (avail.exam) add("goExam","📝","Examen","Mezclado (10/15/20)");
    if (avail.mixed) add("goMixed","🎯","Mixed Challenge","Mix inteligente");
    if (avail.memory) add("goMemory","🧩","Parejas","Memory (definición ↔ concepto)");
    if (avail.timeline) add("goTimeline","🕒","Línea del tiempo","Ordena eventos");
    if (avail.classify) add("goClassify","🗂️","Clasificar","Arrastra / asigna");
    if (avail.errors) add("goErrors","⚠️","Repasar errores", `${(dProg?.errorsRecent?.length||0)} pendientes`);

    if (!tiles.length){
      return `<div class="emptyBox">
        <div class="bigTitle">Sin contenido para esa selección</div>
        <div class="muted">Prueba a cambiar tema / “hasta tema” / dificultad.</div>
      </div>`;
    }
    return tiles.join("");
  }
function renderHome(){
    session.mode = "home";
    const dProg = currentDeckProgress();
    const mastery = dProg ? computeMastery(dProg) : 0;
    const last = dProg?.lastPlayedAt ? new Date(dProg.lastPlayedAt).toLocaleString() : "—";
    const baseSel = filterByDifficulty(filterByCategory(filterByTopic(items)));
    const avail = computeAvailableModes(baseSel, dProg);
    const tilesHTML = buildHomeTilesHTML(avail, dProg);
    panel.innerHTML = `
      <div class="home">
        <div class="hero">
          <div class="badge">Deck</div>
          <h2>${deck.title || "Repaso"}</h2>
          <p class="muted">${items.length} ítems · ${deck.modes?.join(" · ") || "—"}</p>
        </div>

        ${topicControlsHTML()}

        <div class="homeGrid">
          ${tilesHTML}
        </div>

        <div class="bar">
          <div><b>Dominio:</b> ${mastery}%</div>
          <div><b>Última vez:</b> ${last}</div>
        </div>
      </div>
    `;

    const _goFlash = panel.querySelector("#goFlash");
    if (_goFlash) _goFlash.onclick = () => { ensureCanSave(); startFlash(filterByDifficulty(filterByCategory(filterByTopic(items)))); };
    const _goQuiz = panel.querySelector("#goQuiz");
    if (_goQuiz) _goQuiz.onclick = () => { ensureCanSave(); startQuiz(filterByDifficulty(filterByCategory(filterByTopic(items)))); };
    const _goTF = panel.querySelector("#goTF");
    if (_goTF) _goTF.onclick = () => { ensureCanSave(); startTF(filterByDifficulty(filterByCategory(filterByTopic(items)))); };
    const _goSpelling = panel.querySelector("#goSpelling");
    if (_goSpelling) _goSpelling.onclick = () => { ensureCanSave(); startSpelling(filterByDifficulty(filterByCategory(filterByTopic(items)))); };
    const _goListening = panel.querySelector("#goListening");
    if (_goListening) _goListening.onclick = () => { ensureCanSave(); startListening(filterByDifficulty(filterByCategory(filterByTopic(items)))); };
    const _goSentence = panel.querySelector("#goSentence");
    if (_goSentence) _goSentence.onclick = () => { ensureCanSave(); startSentenceBuilder(filterByDifficulty(filterByCategory(filterByTopic(items)))); };
    const _goGrammar = panel.querySelector("#goGrammar");
    if (_goGrammar) _goGrammar.onclick = () => { ensureCanSave(); startGrammarFix(filterByDifficulty(filterByCategory(filterByTopic(items)))); };

    const _goExam = panel.querySelector("#goExam");
    if (_goExam) _goExam.onclick = () => { ensureCanSave(); startExam(filterByDifficulty(filterByCategory(filterByTopic(items))), uiState.count); };
    const _goMixed = panel.querySelector("#goMixed");
    if (_goMixed) _goMixed.onclick = () => { ensureCanSave(); startMixedChallenge(filterByDifficulty(filterByCategory(filterByTopic(items))), uiState.count); };
    const _goMemory = panel.querySelector("#goMemory");
    if (_goMemory) _goMemory.onclick = () => { ensureCanSave(); startMemory(filterByDifficulty(filterByCategory(filterByTopic(items)))); };
    const _goTimeline = panel.querySelector("#goTimeline");
    if (_goTimeline) _goTimeline.onclick = () => { ensureCanSave(); startTimeline(filterByDifficulty(filterByCategory(filterByTopic(items)))); };
    const _goClassify = panel.querySelector("#goClassify");
    if (_goClassify) _goClassify.onclick = () => { ensureCanSave(); startClassify(filterByDifficulty(filterByCategory(filterByTopic(items)))); };
    const _goErrors = panel.querySelector("#goErrors");
    if (_goErrors) _goErrors.onclick = () => { ensureCanSave(); startErrors(); };

    wireTopicControls();
  }

  function setPlayed(mode){
    if (!playerId) return;
    const dProg = currentDeckProgress();
    dProg.lastPlayedAt = nowISO();
    dProg.plays = (dProg.plays||0) + 1;
    dProg.modeLast = mode;
    saveProgress(progress);
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

          <button class="cardBig" id="card">
            <div class="small muted">${flipped ? "Respuesta" : "Pregunta"}</div>
            <div class="bigTxt">${flipped ? it.back : it.front}</div>
            <div class="small muted">Toca para girar</div>
          </button>

          <div class="row">
            <button class="btn bad" id="btnBad">No me sale</button>
            <button class="btn good" id="btnGood">Me lo sé</button>
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
    const mcqItems = items.filter(x => x.type === "mcq");
    const pairs = items.filter(x => x.type === "pair");
    const verbs = items.filter(x => x.type === "verb");
    const types = items.filter(x => x.type === "type");

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
    const pool = (typeof buildQuizPool==="function") ? buildQuizPool(base) : buildQuizFromItems(base);
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
    const pool = shuffle(base.filter(x=>x.type==="sentence_builder" && Array.isArray(x.words)));
    if (!pool.length){
      panel.innerHTML = `<div class="big"><h2>No hay Sentence Builder</h2><p class="muted">No se encontraron ítems de sentence_builder.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick=()=>renderHome();
      return;
    }
    let idx=0;
    const render=()=>{
      const it=pool[idx%pool.length];
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
    const pool = shuffle(base.filter(x=>x.type==="grammar_fix" && x.right));
    if (!pool.length){
      panel.innerHTML = `<div class="big"><h2>No hay Grammar Fix</h2><p class="muted">No se encontraron ítems de grammar_fix.</p><div class="row"><button class="btn" id="b">Volver</button></div></div>`;
      panel.querySelector("#b").onclick=()=>renderHome();
      return;
    }
    let idx=0;
    const render=()=>{
      const it=pool[idx%pool.length];
      const distract=shuffle(pool.filter(x=>x.id!==it.id)).slice(0,3).map(x=>x.right);
      const choices=shuffle([it.right, ...distract]);
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
            <div class="optGrid">
              ${choices.map(c=>`<button class="opt" data-v="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("")}
            </div>
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
      panel.querySelector("#skip").onclick=()=>{ idx++; render(); };
      panel.querySelector("#back").onclick=()=>{ saveTime(); renderHome(); };
    };
    render();
  }

  // ===== Mixed Challenge =====
  function startMixedChallenge(srcItems, count){
    session.mode = "mixed_challenge";
    setPlayed("mixed_challenge");
    const base = Array.isArray(srcItems)?srcItems:items;
    const poolAll = buildQuizPool(base);
    const n = Math.max(8, Math.min(40, count || 15));
    // include some typing tasks (spelling) too
    const voc = base.filter(x=>x.type==="vocab");
    const typing = shuffle(voc).slice(0, Math.min(6, voc.length)).map(v=>({type:"type", id:v.id, prompt:`Escribe en inglés: "${v.es}"`, answer:v.en}));
    const pool = shuffle(poolAll.concat(typing)).slice(0,n);
    // reuse startExam renderer with this pool by mapping to temporary base items:
    // We'll call a local exam renderer
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

          <div class="memGrid">
            ${cards.map((c,i)=>{
              const isOpen = open.includes(i);
              const isMatch = matched.has(c.key);
              const label = (isOpen || isMatch) ? c.text : "❓";
              return `<button class="memCard ${isMatch?'ok':''}" data-i="${i}">${label}</button>`;
            }).join("")}
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
    const pool = shuffle(base.filter(x=>x.type==="timeline"));
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
        const expected = it.events.slice().sort((a,b)=>a.year-b.year).map((e,i)=>it.events.indexOf(e));
        // Because expected built wrong above; instead compare years from ids using events lookup
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
    const pool = shuffle(base.filter(x=>x.type==="classify"));
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
    const pool = shuffle(base.filter(x=>x.type==="tf")).slice(0, 30);
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

          <button class="cardBig" id="card">
            <div class="small muted">${flipped ? "Respuesta" : "Pregunta"}</div>
            <div class="bigTxt">${flipped ? it.back : it.front}</div>
            <div class="small muted">Toca para girar</div>
          </button>

          <div class="row">
            <button class="btn bad" id="btnBad">Aún no</button>
            <button class="btn good" id="btnGood">Ya</button>
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
      dProg.correct += ok ? 1 : 0;
      dProg.wrong += ok ? 0 : 1;
      dProg.bestStreak = Math.max(dProg.bestStreak||0, session.bestStreak);
      dProg.lastPlayedAt = nowISO();
      updateProgressAfterAnswer(dProg, itemId, ok);
      saveProgress(progress);
    }

    try{ updateSidebar({}); }catch(e){}
    next?.();
  }

  // start
  renderHome();

  // init sidebar
  try{ updateSidebar({ count: (Array.isArray(items)?items.length:0) }); }catch(e){}

  // Auto refresh sidebar when main panel changes
  const obs = new MutationObserver(() => {
    try{
      // count best-effort: use current items length if available in scope
      updateSidebar({ count: (Array.isArray(items)?items.length:0) });
    }catch(e){}
  });
  try{ obs.observe(panel, {subtree:true, childList:true}); }catch(e){}

  // unload time save
  window.addEventListener("beforeunload", () => {
    try { saveTime(); } catch(e){}
  });
}
