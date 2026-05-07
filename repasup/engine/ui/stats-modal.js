function renderStatsTile(icon, label, value, { wide = false, tone = "default" } = {}){
  return `
    <div class="card statTile statTone-${tone}${wide ? " wide" : ""}">
      <div class="statTileHead">
        <span class="statTileIcon" aria-hidden="true">${icon}</span>
        <div class="k">${label}</div>
      </div>
      <div class="v">${value}</div>
    </div>
  `;
}

export function setupStatsModal({
  hasStatsModal,
  modalBack,
  modalBody,
  closeModal,
  getDeckProgress,
  buildStats,
}){
  function closeStats(){
    if (!hasStatsModal) return;
    modalBack.style.display = "none";
    document.body.style.overflow = "";
  }

  function openStats(){
    if (!hasStatsModal) return;
    const deckProgress = getDeckProgress();
    if (!deckProgress){
      modalBody.innerHTML = `<p class="muted">Para ver estadísticas, elige/crea un jugador en el portal.</p>`;
    } else {
      const s = buildStats(deckProgress);
      const timeLabel = `${s.mins} min`;
      modalBody.innerHTML = `
        <div class="statsGrid statsDashboard">
          ${renderStatsTile("🎯", "Dominio", `${s.mastery}%`, { tone: "violet" })}
          ${renderStatsTile("🚀", "Sesiones iniciadas", s.sessionsStarted, { tone: "cyan" })}
          ${renderStatsTile("✅", "Sesiones completadas", s.sessionsCompleted, { tone: "green" })}
          ${renderStatsTile("👍", "Aciertos", s.correct, { tone: "green" })}
          ${renderStatsTile("🧩", "Fallos", s.wrong, { tone: "rose" })}

          ${renderStatsTile("📈", "Precisión", `${s.accuracy}%`, { tone: "cyan" })}
          ${renderStatsTile("📝", "Respuestas", s.totalAnswers, { tone: "amber" })}
          ${renderStatsTile("🔥", "Mejor racha", s.bestStreak, { tone: "amber" })}
          ${renderStatsTile("⚠️", "Errores pendientes", s.pendingErrors, { tone: "rose" })}
          ${renderStatsTile("⏱️", "Tiempo", timeLabel, { tone: "violet" })}

          ${renderStatsTile("🗓️", "Última vez", s.lastPlayedLabel, { wide: true, tone: "slate" })}
        </div>
      `;
    }
    modalBack.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  if (hasStatsModal){
    closeModal.onclick = closeStats;
    modalBack.onclick = (e)=>{ if (e.target === modalBack) closeStats(); };
    if (!document.__repasoStatsEscBound){
      document.addEventListener("keydown", (e) => {
        const statsBack = document.querySelector("#modalBack");
        if (e.key === "Escape" && statsBack && statsBack.style.display === "flex"){
          statsBack.style.display = "none";
          document.body.style.overflow = "";
        }
      });
      document.__repasoStatsEscBound = true;
    }
  }

  return { openStats, closeStats };
}
