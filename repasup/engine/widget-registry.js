// engine/widget-registry.js

function esc(v){ return String(v ?? "—"); }
function clampPct(v){
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function renderMetricRows(rows){
  return `<div class="sideStats">${rows.map(r=>`<div><span>${r.k}</span><b>${esc(r.v)}</b></div>`).join("")}</div>`;
}

function renderBar(label, value, pct, variant = ""){
  const klass = variant === "warn" ? "barTrack warn" : "barTrack";
  return `
    <div class="barStat compact">
      <div class="barHead"><span>${label}</span><b>${esc(value)}</b></div>
      <div class="${klass}"><i style="width:${clampPct(pct)}%"></i></div>
    </div>
  `;
}

function renderMiniStat(label, value, wide = false){
  return `<div class="miniStat${wide ? ' wide' : ''}"><span>${label}</span><b>${esc(value)}</b></div>`;
}

function widget(title, body){
  return `<section class="sideWidget"><h4>${title}</h4>${body}</section>`;
}

function widgetPlayer(ctx){
  return widget("Jugador activo", renderMetricRows([
    { k:"Jugador", v: ctx.playerName },
    { k:"Modo", v: ctx.mode },
    { k:"Tema", v: ctx.theme },
  ]));
}

function widgetProgress(ctx){
  const s = ctx.stats || {};
  return widget("Progreso rápido", `
    <div class="quickBars">
      ${renderBar("Precisión", `${s.accuracy ?? 0}%`, s.accuracy)}
      ${renderBar("Dominio", `${s.mastery ?? 0}%`, s.mastery)}
      ${renderBar("Cobertura", `${s.coveragePct ?? 0}%`, s.coveragePct)}
      ${renderBar("Errores pendientes", s.pendingErrors ?? 0, s.pendingPct, "warn")}
    </div>
    <div class="miniStatsGrid">
      ${renderMiniStat("Aciertos", s.correct ?? 0)}
      ${renderMiniStat("Fallos", s.wrong ?? 0)}
      ${renderMiniStat("Racha", ctx.session.streak ?? 0)}
      ${renderMiniStat("Mejor racha", s.bestStreak ?? 0)}
      ${renderMiniStat("Respuestas", s.totalAnswers ?? 0)}
      ${renderMiniStat("Última vez", s.lastPlayedLabel || "—", true)}
    </div>
  `);
}

function widgetHints(ctx){
  const hints = {
    home: "Elige tema y modo antes de empezar.",
    quiz: "Lee bien todas las opciones antes de responder.",
    flashcards: "Marca como “No me sale” lo que quieras repasar luego.",
    exam: "Mantén ritmo: usa “Saltar” si te bloqueas.",
    tf: "Fíjate en palabras trampa como “siempre/nunca”.",
    memory: "Intenta recordar posiciones por parejas de significado.",
    listening: "Repite audio y compara con contextos.",
    spelling: "Escribe primero y corrige después con calma.",
    timeline: "Ordena por fechas clave y revisa extremos primero.",
    classify: "Asigna primero los elementos más evidentes.",
  };
  const hint = hints[ctx.mode] || "Practica de forma constante para mejorar dominio.";
  return widget("Ayuda contextual", `
    <div class="sideHint">${hint}</div>
    <div class="sideHint">Atajos: <span class="kbd">Esc</span> cerrar modal · <span class="kbd">Enter</span> comprobar en texto.</div>
  `);
}

function widgetErrors(ctx){
  return widget("Errores pendientes", `
    <div class="sideHint">${ctx.pendingErrors ? `Tienes ${ctx.pendingErrors} conceptos en repaso.` : "No hay errores pendientes. ¡Buen trabajo!"}</div>
  `);
}

const defaultWidgets = [widgetPlayer, widgetProgress, widgetHints, widgetErrors];

export const widgetRegistry = {
  home: [widgetPlayer, widgetProgress, widgetHints],
  quiz: defaultWidgets,
  flashcards: defaultWidgets,
  exam: defaultWidgets,
  tf: defaultWidgets,
  memory: defaultWidgets,
  timeline: defaultWidgets,
  classify: defaultWidgets,
  listening: defaultWidgets,
  spelling: defaultWidgets,
  sentence_builder: defaultWidgets,
  grammar_fix: defaultWidgets,
  mixed_challenge: defaultWidgets,
  errors: defaultWidgets,
};

export function renderWidgetsForMode(mode, ctx){
  const fns = widgetRegistry[mode] || defaultWidgets;
  return fns.map(fn => fn(ctx)).join("");
}
