import { HOME_MODE_DEFS } from "../modes/game-modes.js";

export function topicControlsHTML({ topics, items, uiState, filterByTopic, topicIndex, getCategoryOptions, norm }){
  if (!topics.length) return "";
  const byTopic = filterByTopic(items, uiState, topics, topicIndex);
  const categoryOptions = getCategoryOptions(byTopic, norm);
  const showCategory = categoryOptions.length > 0;
  if (showCategory && !categoryOptions.some(x => x.value === uiState.cat)){
    uiState.cat = "mix";
  } else if (!showCategory){
    uiState.cat = "mix";
  }
  const opts = ['<option value="all">Todos los temas</option>']
    .concat(topics.map(t => `<option value="${t.id}">${t.name}</option>`))
    .join("");

  return `
    <section class="controls2" aria-label="Configuración de práctica">
      <div class="controlsHead">
        <h3>Configura tu partida</h3>
        <p class="muted">Selecciona tema, dificultad y después el tipo de juego.</p>
      </div>
      <label class="lab">Tema
        <select id="selTopic" class="sel">${opts}</select>
      </label>
      <label class="lab">Rango
        <select id="selRange" class="sel">
          <option value="solo">Solo tema</option>
          <option value="hasta">Hasta tema</option>
        </select>
      </label>
      ${showCategory ? `
        <label class="lab">Bloque
          <select id="selCat" class="sel">
            <option value="mix">Mix</option>
            ${categoryOptions.map(c => `<option value="${c.value}">${c.label}</option>`).join("")}
          </select>
        </label>
      ` : ``}

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
    </section>
  `;
}

export function wireTopicControls({ root, topics, uiState, onChange }){
  if (!topics.length) return;
  const st = root.querySelector("#selTopic");
  const sr = root.querySelector("#selRange");
  const sca = root.querySelector("#selCat");
  const sd = root.querySelector("#selDiff");
  const sc = root.querySelector("#selCount");
  if (!st || !sr || !sd || !sc) return;

  st.value = uiState.topic;
  sr.value = uiState.range;
  if (sca) sca.value = uiState.cat;
  sd.value = uiState.diff;
  sc.value = String(uiState.count);

  st.onchange = () => { uiState.topic = st.value; onChange(); };
  sr.onchange = () => { uiState.range = sr.value; onChange(); };
  if (sca) sca.onchange = () => { uiState.cat = sca.value; onChange(); };
  sd.onchange = () => { uiState.diff = sd.value; onChange(); };
  sc.onchange = () => { uiState.count = parseInt(sc.value,10) || 15; };
}

export function buildHomeTilesHTML(avail, deckProgress){
  const enabledCount = HOME_MODE_DEFS.filter(m => avail[m.key]).length;
  const tiles = HOME_MODE_DEFS.map((mode) => {
    const isOn = !!avail[mode.key];
    const idAttr = isOn ? `id="${mode.id}"` : "";
    const state = isOn ? "Disponible" : "No disponible";
    const fallbackHint = mode.special === "errors"
      ? `${(deckProgress?.errorsRecent?.length||0)} pendientes`
      : `${avail.counts?.[mode.hintKey] ?? 0} ${mode.unit}`;
    const reason = !isOn && avail.reasons?.[mode.key] ? avail.reasons[mode.key] : fallbackHint;
    return `
      <button class="tile ${isOn ? "is-on" : "is-off"} ${mode.accent ? "is-accent" : ""}" ${idAttr} ${isOn ? "" : "disabled"} role="listitem" aria-label="${mode.tt}: ${mode.dd}. ${state}">
        <div class="tileHead">
          <div class="ico">${mode.ico}</div>
          <span class="tileBadge">${state}</span>
        </div>
        <div class="tt">${mode.tt}</div>
        <div class="dd muted">${mode.dd}</div>
        <div class="tileMeta">${reason}</div>
      </button>
    `;
  });

  if (!enabledCount){
    return `<div class="emptyBox">
      <div class="bigTitle">Sin contenido para esa selección</div>
      <div class="muted">Prueba a cambiar tema / “hasta tema” / dificultad.</div>
    </div>`;
  }
  return tiles.join("");
}
