# PC Fútbol – Mapa de código JS y recomendaciones

_Generado: 2025-12-30 13:38_

## Cómo arranca la app

- `index.html` carga **un único entrypoint**: `js/main.js` (ES modules).
- `main.js` llama a `initUI()` desde `js/ui/index.js`.
- `js/ui/index.js` es una **fachada**; actualmente delega en `../ui.js`, que coordina pantallas, navegación, modales y el motor.
- El motor se “cablea” con `js/game/bootstrap.js` (inyección de dependencias para evitar ciclos).

## Estructura de archivos JS

```text
js/
  calendar_es_laLiga_2025_26.js
  data.js
  main.js
  saveLoad.js
  squads_en.js
  squads_es.js
  state.js
  ui-bck.js
  ui.js
  game/
    bootstrap.js
    selectors.js
    simulateMatchday.js
    club/
      conditioning.js
    match/
      advancedStats.js
      discipline.js
      effects.js
      events.js
      injuries.js
      postMatchday.js
      scoring.js
      selection.js
      simulateFixture.js
      statsPersist.js
    tactics/
      strength.js
    utils/
      availability.js
      fixtures.js
      index.js
      medical.js
      tacticsState.js
    world/
      quickSim.js
      sync.js
  ui/
    alignment.js
    calendarView.js
    competition.js
    dashboard.js
    index.js
    medical.js
    nav.js
    navigation.js
    negotiation.js
    nextMatchView.js
    playerActions.js
    resultsView.js
    saveLoadUI.js
    squad.js
    standings.js
    stats.js
    tactics.js
    modals/
      matchDetailModal.js
      matchModal.js
      playerModal.js
    utils/
      availability.js
      calendar.js
      coats.js
      competitions.js
      dom.js
      events.js
      flags.js
      format.js
      pcfParams.js
      players.js
      tacticsState.js
```

## Hotspots (archivos grandes / mantenimiento)

- `js/squads_es.js` — 17758 líneas

- `js/calendar_es_laLiga_2025_26.js` — 6150 líneas

- `js/squads_en.js` — 2524 líneas

- `js/ui-bck.js` — 1911 líneas

- `js/ui/stats.js` — 1472 líneas

- `js/state.js` — 1289 líneas

- `js/ui/nextMatchView.js` — 1052 líneas

- `js/data.js` — 1003 líneas


Recomendación rápida:
- `squads_es.js` y `calendar_es_laLiga_2025_26.js` conviene **trocearlos** (por liga/club/jornada) o moverlos a **JSON**/datos comprimidos para no penalizar carga y mantenibilidad.
- `ui-bck.js` parece un backup: mejor moverlo a `/legacy/` o excluirlo del build para evitar confusiones.

## Qué hace cada archivo (resumen)

### Core (/js/...)

- **`js/calendar_es_laLiga_2025_26.js`** (6150 líneas)
  - Qué hace: Calendario oficial (fixtures) para una competición/temporada concreta.
  - Exports: CALENDAR_ES_LALIGA_2025_26
  - Importa: —

- **`js/data.js`** (1003 líneas)
  - Qué hace: Datos base de ligas y clubs + generación de jugadores cuando no hay plantilla real; importa plantillas reales (squads_es/squads_en).
  - Exports: allLeagues, initialLeague
  - Importa: ./squads_es.js, ./squads_en.js

- **`js/main.js`** (8 líneas)
  - Qué hace: Entrypoint del navegador: espera a DOMContentLoaded e inicializa la UI.
  - Exports: (sin exports explícitos)
  - Importa: ./ui/index.js

- **`js/saveLoad.js`** (48 líneas)
  - Qué hace: Guardar/cargar partidas: exportar a JSON, importar desde fichero y compatibilidad de versiones.
  - Exports: exportGameToFile, importGameFromFile
  - Importa: ./state.js

- **`js/squads_en.js`** (2524 líneas)
  - Qué hace: Plantillas reales por club (jugadores reales) para reemplazar la generación automática.
  - Exports: realSquads
  - Importa: —

- **`js/squads_es.js`** (17758 líneas)
  - Qué hace: Plantillas reales por club (jugadores reales) para reemplazar la generación automática.
  - Exports: realSquads
  - Importa: —

- **`js/state.js`** (1289 líneas)
  - Qué hace: Estado global del juego (GameState) + creación de partida nueva, inicialización de liga/clubs/fixtures y utilidades relacionadas.
  - Exports: GameState, advanceToNextSeason, applyLoadedState, applyStatsForFixtures, newGame, rebuildStatsFromFixtures, recomputeLeagueTable
  - Importa: ./data.js, ./calendar_es_laLiga_2025_26.js

- **`js/ui-bck.js`** (1911 líneas)
  - Qué hace: Archivo legacy/backup (no debería importarse en producción). Contiene implementaciones antiguas y duplicadas.
  - Exports: initUI
  - Importa: ./data.js, ./saveLoad.js, ./ui/nav.js, ./ui/navigation.js, ./ui/dashboard.js, ./ui/stats.js, ./ui/medical.js, ./ui/squad.js, ./ui/utils/calendar.js, ./ui/utils/flags.js, ./ui/alignment.js, ./game/utils/index.js, ./game/simulateMatchday.js, ./ui/saveLoadUI.js

- **`js/ui.js`** (454 líneas)
  - Qué hace: Orquestador UI: importa módulos de pantalla, conecta eventos de navegación, modales, simulado y refrescos de vistas.
  - Exports: initUI
  - Importa: ./state.js, ./data.js, ./saveLoad.js, ./ui/nav.js, ./ui/navigation.js, ./ui/dashboard.js, ./ui/standings.js, ./ui/stats.js, ./ui/medical.js, ./ui/squad.js, ./ui/utils/calendar.js, ./ui/alignment.js, ./ui/tactics.js, ./game/simulateMatchday.js, ./ui/saveLoadUI.js, ./ui/playerActions.js, ./ui/negotiation.js


### Motor (/js/game/...)

- **`js/game/bootstrap.js`** (28 líneas)
  - Qué hace: Boot del motor: inyección de dependencias para evitar ciclos (sync/quickSim/advancedStats) y side-effect de inicialización.
  - Exports: bootstrapGame
  - Importa: ./world/sync.js, ./world/quickSim.js, ./match/advancedStats.js, ./simulateMatchday.js

- **`js/game/club/conditioning.js`** (333 líneas)
  - Qué hace: Lógica de club entre partidos: condición física/forma/moral y progresión temporal.
  - Exports: GAME_CALENDAR, applyFitnessAndFormForClubBetweenMatches, applyMoraleForClubFixture, applyRestEffectsToClub, avgNums, computePlayerInjuryRiskMultiplier, getFixtureDayIndex, getNextFixtureDayIndexForClub, getPlayerAgeAtUTCDate, getPreviousFixtureDayIndexForClub, getRecoveryTarget, getSeasonStartUTC, pickWeighted
  - Importa: —

- **`js/game/match/advancedStats.js`** (480 líneas)
  - Qué hace: Lógica de partido: advancedStats (módulo especializado del motor).
  - Exports: generateAdvancedStatsForFixture
  - Importa: —

- **`js/game/match/discipline.js`** (48 líneas)
  - Qué hace: Lógica de partido: discipline (módulo especializado del motor).
  - Exports: applyCardsForPlayer, progressSanctionsForClub, recordCardEvent
  - Importa: —

- **`js/game/match/effects.js`** (295 líneas)
  - Qué hace: Lógica de partido: effects (módulo especializado del motor).
  - Exports: applyMatchEffectsToClub, maybeAddForcedSubstitution, pickRandomLineupPlayer
  - Importa: ../utils/medical.js, ../utils/index.js, ./statsPersist.js

- **`js/game/match/events.js`** (318 líneas)
  - Qué hace: Lógica de partido: events (módulo especializado del motor).
  - Exports: attachFixtureMeta, createFixtureMinutePicker, generateEventsForFixture, generateTacticalSubsForFixture, getPotentialAssistersForClub, getPotentialScorersForClub, pickRandomAssister, pickRandomScorer
  - Importa: —

- **`js/game/match/injuries.js`** (47 líneas)
  - Qué hace: Lógica de partido: injuries (módulo especializado del motor).
  - Exports: generateRandomInjury, progressInjuriesForClub
  - Importa: ../utils/medical.js

- **`js/game/match/postMatchday.js`** (94 líneas)
  - Qué hace: Lógica de partido: postMatchday (módulo especializado del motor).
  - Exports: applyPostMatchdayEffects
  - Importa: ../utils/index.js, ./statsPersist.js

- **`js/game/match/scoring.js`** (57 líneas)
  - Qué hace: Lógica de partido: scoring (módulo especializado del motor).
  - Exports: computeMatchLambdas, sampleGoals
  - Importa: —

- **`js/game/match/selection.js`** (80 líneas)
  - Qué hace: Lógica de partido: selection (módulo especializado del motor).
  - Exports: getBenchForFixture, getBenchForFixturePro, getStartingXIForFixture
  - Importa: ../utils/index.js

- **`js/game/match/simulateFixture.js`** (69 líneas)
  - Qué hace: Simulación de un partido (sin DOM): orquesta selección XI, goles, eventos, disciplina, lesiones, stats, etc.
  - Exports: simulateFixture
  - Importa: ./advancedStats.js, ./events.js, ./selection.js, ../tactics/strength.js, ./scoring.js

- **`js/game/match/statsPersist.js`** (334 líneas)
  - Qué hace: Lógica de partido: statsPersist (módulo especializado del motor).
  - Exports: applyStatsForFixturesFallback, applyStatsForFixturesSafe, buildEventCountMap, computeMinutesForClubInFixture
  - Importa: —

- **`js/game/selectors.js`** (39 líneas)
  - Qué hace: Selectores del estado (buscar club/jugador/club usuario) para desacoplar UI de la estructura interna.
  - Exports: getClubById, getPlayerById, getUserClub, getUserClubId
  - Importa: —

- **`js/game/simulateMatchday.js`** (274 líneas)
  - Qué hace: Simulación de jornada: simula fixtures, avanza tiempo/estado y sincroniza ligas.
  - Exports: advanceToNextUserMatchPrep, simulateCurrentMatchday, syncMainLeagueUpTo
  - Importa: ./match/simulateFixture.js, ./match/postMatchday.js, ./match/statsPersist.js, ./match/effects.js, ./match/discipline.js, ./match/injuries.js, ./tactics/strength.js

- **`js/game/tactics/strength.js`** (78 líneas)
  - Qué hace: Cálculo de perfil de fuerza y agresividad táctica.
  - Exports: getClubStrengthProfile, getTacticalAggression
  - Importa: ../utils/index.js

- **`js/game/utils/availability.js`** (24 líneas)
  - Qué hace: Utilidades del motor (disponibilidad, tácticas, medical, fechas de fixtures, etc.).
  - Exports: isPlayerInjuredNow, isPlayerSuspendedNow, isPlayerUnavailable
  - Importa: —

- **`js/game/utils/fixtures.js`** (15 líneas)
  - Qué hace: Utilidades del motor (disponibilidad, tácticas, medical, fechas de fixtures, etc.).
  - Exports: getFixtureKickoffISO
  - Importa: —

- **`js/game/utils/index.js`** (6 líneas)
  - Qué hace: Utilidades del motor (disponibilidad, tácticas, medical, fechas de fixtures, etc.).
  - Exports: *
  - Importa: —

- **`js/game/utils/medical.js`** (27 líneas)
  - Qué hace: Utilidades del motor (disponibilidad, tácticas, medical, fechas de fixtures, etc.).
  - Exports: ensureClubMedical, getMedicalInjuryModifier, getPhysioRecoveryExtraChance
  - Importa: —

- **`js/game/utils/tacticsState.js`** (129 líneas)
  - Qué hace: Utilidades del motor (disponibilidad, tácticas, medical, fechas de fixtures, etc.).
  - Exports: assignPlayersToSlots, autoPickMatchdaySquad, ensureClubTactics, getFormationSlots
  - Importa: ./availability.js

- **`js/game/world/quickSim.js`** (255 líneas)
  - Qué hace: Simulación rápida y sincronización temporal para ligas 'WORLD' (no controladas por el usuario).
  - Exports: configureAdvancedStatsGenerator, simulateQuickWorldFixture
  - Importa: —

- **`js/game/world/sync.js`** (141 líneas)
  - Qué hace: Simulación rápida y sincronización temporal para ligas 'WORLD' (no controladas por el usuario).
  - Exports: computeGameNowISO, computeHorizonISOAfterMatchday, configureMainLeagueSync, configureWorldSimulateFixture, ensureGameTimeAndWorldSync, syncWorldLeaguesToNow, syncWorldLeaguesUpToTime
  - Importa: ../../state.js, ../utils/fixtures.js


### UI screens (/js/ui/...)

- **`js/ui/alignment.js`** (895 líneas)
  - Qué hace: Pantalla Alineación: XI titular, banquillo, disponibilidad, validaciones y eventos de cambios.
  - Exports: initAlignmentUI, updateAlignmentView
  - Importa: ../state.js, ../game/selectors.js, ./utils/flags.js, ./utils/calendar.js

- **`js/ui/calendarView.js`** (268 líneas)
  - Qué hace: Pantalla Calendario: lista de partidos por jornada/fechas, navegación entre jornadas.
  - Exports: initCalendarUI, updateCalendarView
  - Importa: ./utils/coats.js

- **`js/ui/competition.js`** (262 líneas)
  - Qué hace: Módulo JS.
  - Exports: getCompetitionSelectedMatchday, initCompetitionUI, setCompetitionSelectedMatchday, updateCompetitionView
  - Importa: ../state.js, ./utils/calendar.js, ./utils/coats.js

- **`js/ui/dashboard.js`** (301 líneas)
  - Qué hace: Pantalla Dashboard/HUB: pinta resumen de club, próximo partido, noticias rápidas, etc.
  - Exports: updateDashboard
  - Importa: ../state.js, ../game/selectors.js, ./medical.js, ./utils/calendar.js, ./utils/coats.js

- **`js/ui/index.js`** (22 líneas)
  - Qué hace: Fachada/entrypoint de UI (pensado para migración). Actualmente delega en ../ui.js.
  - Exports: *, initUI
  - Importa: ../ui.js

- **`js/ui/medical.js`** (278 líneas)
  - Qué hace: Pantalla Medical: lesiones, sanciones, mejora del cuerpo médico y notas rápidas.
  - Exports: initMedicalUI, updateMedicalView, updateQuickNotes, upgradeMedical
  - Importa: ../state.js, ../game/selectors.js, ../game/utils/medical.js, ../game/utils/index.js

- **`js/ui/nav.js`** (92 líneas)
  - Qué hace: Helpers para mostrar el dashboard y activar/ocultar sub-vistas.
  - Exports: setActiveSubview, showDashboard
  - Importa: —

- **`js/ui/navigation.js`** (77 líneas)
  - Qué hace: Binding de navegación: conecta botones del menú/top-bar con setActiveSubview y acciones contextuales.
  - Exports: initNavigation
  - Importa: ./nav.js

- **`js/ui/negotiation.js`** (127 líneas)
  - Qué hace: UI de negociaciones/renovaciones: preparar ofertas, enviar oferta, y anclar sección.
  - Exports: attemptRenewal, initNegotiationUI, prepareNegotiationUI, scrollToNegotiationSection
  - Importa: ./utils/calendar.js

- **`js/ui/nextMatchView.js`** (1052 líneas)
  - Qué hace: Pantalla Próximo partido: preparación, simulación, resumen y navegación post-partido.
  - Exports: initNextMatchUI, setLastSimulatedMatchday, updateNextMatchView
  - Importa: ../state.js, ../game/selectors.js, ../game/simulateMatchday.js, ./utils/coats.js

- **`js/ui/playerActions.js`** (65 líneas)
  - Qué hace: Acciones sobre jugador desde UI (poner en lista de transferibles, etc.) y helpers de acceso a datos.
  - Exports: getPlayerById, getUserClub, handlePlayerAction, toggleTransferListed
  - Importa: ../state.js, ../game/selectors.js

- **`js/ui/resultsView.js`** (221 líneas)
  - Qué hace: Pantalla Resultados: resultados por jornada y acceso a detalles de partido.
  - Exports: initResultsUI, updateResultsView
  - Importa: ./utils/calendar.js, ./utils/coats.js

- **`js/ui/saveLoadUI.js`** (38 líneas)
  - Qué hace: UI de carga: manejador de input[type=file] para importar partidas.
  - Exports: handleFileInput
  - Importa: ../state.js, ../saveLoad.js

- **`js/ui/squad.js`** (229 líneas)
  - Qué hace: Pantalla Plantilla: listado de jugadores, filtros/acciones, y enlace a modal de jugador.
  - Exports: bindSquadActions, initSquadUI, updateSquadView
  - Importa: ../state.js, ../game/selectors.js, ./utils/calendar.js, ./utils/flags.js, ../game/utils/index.js, ./utils/pcfParams.js

- **`js/ui/standings.js`** (372 líneas)
  - Qué hace: Pantalla Clasificación: tabla por jornada y recordatorio de últimos 5 partidos.
  - Exports: initStandingsUI, setStandingsSelectedMatchday, updateStandingsView
  - Importa: ../state.js, ./utils/coats.js

- **`js/ui/stats.js`** (1472 líneas)
  - Qué hace: Pantalla Estadísticas: estadísticas de jugadores/equipos por competición y jornada.
  - Exports: initStatsUI, updateStatsView
  - Importa: ../state.js, ./utils/calendar.js, ./utils/coats.js

- **`js/ui/tactics.js`** (777 líneas)
  - Qué hace: Pantalla Tácticas: formación, roles, sliders/ajustes y persistencia en el estado.
  - Exports: initTacticsUI, updateTacticsView
  - Importa: ../state.js, ../game/selectors.js, ./utils/flags.js, ../game/utils/index.js


### UI modals (/js/ui/modals/...)

- **`js/ui/modals/matchDetailModal.js`** (233 líneas)
  - Qué hace: Modales UI (detalle de partido, partido, jugador): render, abrir/cerrar, acciones.
  - Exports: closeMatchDetailModal, initMatchDetailModal, openMatchDetailModal
  - Importa: ../../state.js, ../utils/calendar.js, ../utils/competitions.js

- **`js/ui/modals/matchModal.js`** (7 líneas)
  - Qué hace: Modales UI (detalle de partido, partido, jugador): render, abrir/cerrar, acciones.
  - Exports: initMatchModal
  - Importa: —

- **`js/ui/modals/playerModal.js`** (343 líneas)
  - Qué hace: Modales UI (detalle de partido, partido, jugador): render, abrir/cerrar, acciones.
  - Exports: closePlayerModal, initPlayerModal, openPlayerModal
  - Importa: ../../state.js, ../utils/calendar.js, ../utils/flags.js, ../../game/utils/index.js


### UI utils (/js/ui/utils/...)

- **`js/ui/utils/availability.js`** (8 líneas)
  - Qué hace: Shim UI: reexporta utilidades del motor para mantener compatibilidad de imports.
  - Exports: *, isPlayerInjuredNow, isPlayerSuspendedNow, isPlayerUnavailable
  - Importa: —

- **`js/ui/utils/calendar.js`** (94 líneas)
  - Qué hace: Utilidades UI reutilizables (DOM, formato, banderas/escudos, calendario UI, etc.).
  - Exports: GAME_CALENDAR, formatFixtureKickoffLabel, formatGameDateLabel, getCurrentGameDate, getFixtureKickoffDate, getGameDateFor, getPlayerGameAge
  - Importa: ../../state.js

- **`js/ui/utils/coats.js`** (310 líneas)
  - Qué hace: Utilidades UI reutilizables (DOM, formato, banderas/escudos, calendario UI, etc.).
  - Exports: createCoatImgElement, getCoatUrlForClubId
  - Importa: —

- **`js/ui/utils/competitions.js`** (83 líneas)
  - Qué hace: Utilidades UI reutilizables (DOM, formato, banderas/escudos, calendario UI, etc.).
  - Exports: buildClubIndex, computeMaxMatchday, findFixtureInCompetition, getCompetitionById, getCompetitions, getDefaultCompetitionId, getUserClubId
  - Importa: ../../state.js

- **`js/ui/utils/dom.js`** (71 líneas)
  - Qué hace: Utilidades UI reutilizables (DOM, formato, banderas/escudos, calendario UI, etc.).
  - Exports: createEl, delegate, escapeHtml, hide, qs, qsa, setHTML, setText, show
  - Importa: —

- **`js/ui/utils/events.js`** (28 líneas)
  - Qué hace: Utilidades UI reutilizables (DOM, formato, banderas/escudos, calendario UI, etc.).
  - Exports: emit, off, on
  - Importa: —

- **`js/ui/utils/flags.js`** (123 líneas)
  - Qué hace: Utilidades UI reutilizables (DOM, formato, banderas/escudos, calendario UI, etc.).
  - Exports: createFlagImgElement, getFlagUrlForNationality
  - Importa: —

- **`js/ui/utils/format.js`** (32 líneas)
  - Qué hace: Utilidades UI reutilizables (DOM, formato, banderas/escudos, calendario UI, etc.).
  - Exports: clamp, formatCurrency, formatDateDMY, formatPercent
  - Importa: —

- **`js/ui/utils/pcfParams.js`** (59 líneas)
  - Qué hace: Utilidades UI reutilizables (DOM, formato, banderas/escudos, calendario UI, etc.).
  - Exports: computePCFParams, getDemarcation, getRoleFromPosition
  - Importa: —

- **`js/ui/utils/players.js`** (98 líneas)
  - Qué hace: Utilidades UI reutilizables (DOM, formato, banderas/escudos, calendario UI, etc.).
  - Exports: createFlagNode, flagEmojiFallback, getDemarcation, getFlagUrlFromGlobalMap, getPositionGroup, getRoleFromPosition, isoToFlagEmoji
  - Importa: —

- **`js/ui/utils/tacticsState.js`** (9 líneas)
  - Qué hace: Shim UI: reexporta utilidades del motor para mantener compatibilidad de imports.
  - Exports: *, assignPlayersToSlots, autoPickMatchdaySquad, ensureClubTactics, getFormationSlots
  - Importa: —


## Funciones duplicadas / candidatos a centralizar

He encontrado varios nombres repetidos en múltiples archivos. No siempre es un problema (pueden ser helpers locales), pero en general **conviene tener una única implementación** para evitar divergencias.

- `escapeHtml` aparece en: `js/ui-bck.js`, `js/ui/calendarView.js`, `js/ui/competition.js`, `js/ui/modals/playerModal.js`, `js/ui/nextMatchView.js`, `js/ui/resultsView.js`, `js/ui/standings.js`, `js/ui/utils/dom.js`

- `clamp` aparece en: `js/game/match/advancedStats.js`, `js/ui/alignment.js`, `js/ui/nextMatchView.js`, `js/ui/tactics.js`, `js/ui/utils/format.js`, `js/ui/utils/pcfParams.js`

- `formatCurrency` aparece en: `js/ui-bck.js`, `js/ui/dashboard.js`, `js/ui/medical.js`, `js/ui/modals/playerModal.js`, `js/ui/squad.js`, `js/ui/utils/format.js`

- `clampN` aparece en: `js/game/club/conditioning.js`, `js/game/match/effects.js`, `js/game/match/events.js`, `js/game/match/scoring.js`

- `ensureBindings` aparece en: `js/ui/calendarView.js`, `js/ui/nextMatchView.js`, `js/ui/resultsView.js`, `js/ui/stats.js`

- `formatAttr` aparece en: `js/ui-bck.js`, `js/ui/alignment.js`, `js/ui/modals/playerModal.js`, `js/ui/tactics.js`

- `getDemarcation` aparece en: `js/ui/alignment.js`, `js/ui/tactics.js`, `js/ui/utils/pcfParams.js`, `js/ui/utils/players.js`

- `getPositionGroup` aparece en: `js/game/utils/tacticsState.js`, `js/ui-bck.js`, `js/ui/squad.js`, `js/ui/utils/players.js`

- `getRoleFromPosition` aparece en: `js/ui/alignment.js`, `js/ui/tactics.js`, `js/ui/utils/pcfParams.js`, `js/ui/utils/players.js`

- `buildClubIndex` aparece en: `js/ui/dashboard.js`, `js/ui/nextMatchView.js`, `js/ui/utils/competitions.js`

- `clamp01` aparece en: `js/game/club/conditioning.js`, `js/game/match/effects.js`, `js/ui-bck.js`

- `closeMatchDetailModal` aparece en: `js/ui-bck.js`, `js/ui.js`, `js/ui/modals/matchDetailModal.js`


Sugerencia práctica:
- Para UI: centraliza en `js/ui/utils/*` (por ejemplo `escapeHtml` en `utils/dom.js`, `clamp/formatCurrency` en `utils/format.js`).
- Para motor: centraliza en `js/game/utils/*` y reexporta con el barrel `js/game/utils/index.js`.

## Mejoras para optimizar y escalar sin perder funcionalidad

### 1) Separación clara Motor vs UI
- El motor ya está bastante bien aislado (módulos en `js/game/...` sin DOM). Mantén esta regla: **el motor no importa nada de UI**.
- La UI debería hablar con el motor a través de:
  - `selectors` (`js/game/selectors.js`)
  - funciones puras del motor (simulateFixture/simulateMatchday) y utilidades de `js/game/utils/*`.

### 2) Unificar helpers y evitar “copypaste”
- Crea (o refuerza) un paquete de helpers:
  - UI: `js/ui/utils/dom.js`, `format.js`, `players.js`, `calendar.js`.
  - Motor: `js/game/utils/index.js` como punto de entrada.
- Sustituye implementaciones locales duplicadas por imports (ej.: `escapeHtml`, `clamp`, `buildClubIndex`, `getRoleFromPosition`).

### 3) Datos grandes: split + carga diferida
- `squads_es.js` (≈17k líneas) y calendarios son el principal cuello:
  - Dividir por competición (`squads/es/*.js`, `squads/en/*.js`) o por club.
  - O convertir a JSON y **cargar bajo demanda** (cuando el usuario elige liga/competición), para reducir el tiempo de arranque.

### 4) Índices y caché
- Veo varias funciones que construyen índices (`buildPlayerIndex`, `buildClubIndex`, `buildGoalsIndexFromFixtures`).
- Para escalar: crea un módulo `js/game/indexes.js` o `js/ui/cache.js` que:
  - genere los índices una vez por jornada/competición
  - invalide cuando cambie `GameState.fixtures`, traspasos, sanciones, etc.

### 5) Robustez y deuda técnica
- Añade un `VERSION` de schema en partidas guardadas y migraciones explícitas.
- Añade `eslint` + `prettier` (aunque no uses bundler) para evitar divergencias.
- Introduce un RNG determinista opcional en el motor (semilla) para reproducibilidad de simulaciones.

## Propuesta para mejorar el Dashboard y el menú (estilo imagen)

Tu `#view-dashboard` ya está muy cerca del concepto del screenshot (dos columnas + centro). Para que “se parezca” más, yo haría:
1) **Fondo**: una capa con imagen/gradiente azul oscuro + blur.
2) **Paneles**: cajas translúcidas con borde fino, sombra y título en “caps”.
3) **Items**: botones tipo lista con icono a la izquierda, texto, y un indicador de foco/hover.
4) **Estado activo**: mismo estilo que en el screenshot (barra/luz lateral + glow).
5) **Header superior**: barra fina con “COMPETICIONES / CLUB Y ESTADIO / MERCADO…” y el perfil.

### CSS (líneas guía)
En `css/styles.css` (bloque HUB), refuerza:
- `.pcf-hub` para fondo + overlay.
- `.pcf-panel` para glassmorphism.
- `.pcf-linkbtn` para iconos, alineación, hover/active.

Ejemplo de patrones (no es un diff, son ideas para aplicar):
```css
.pcf-hub{
  background: radial-gradient(circle at 40% 20%, rgba(80,140,255,.35), rgba(0,0,0,.85) 60%),
              url('../img/resources/dashboard-bg.jpg') center/cover no-repeat;
}
.pcf-panel{
  background: rgba(0,0,0,.45);
  border: 1px solid rgba(255,255,255,.12);
  backdrop-filter: blur(10px);
}
.pcf-linkbtn{
  display:flex; align-items:center; gap:10px;
  justify-content:space-between;
}
.pcf-linkbtn.is-active{ box-shadow: 0 0 0 1px rgba(80,140,255,.55), 0 10px 24px rgba(0,0,0,.35); }
```

### HTML (mínimo)
- Mantén tu estructura actual, pero en cada botón añade:
  - un `span` para icono (emoji temporal o `<img>`),
  - y un `span` final para un chevron `›`.
- Usa `data-nav-target` como ya haces; solo cambia markup/estilos.

### JS
- En `js/ui/navigation.js` / `js/ui/nav.js`: cuando activas una subvista, añade/quita clase `.is-active` a los botones dentro de `#view-dashboard` (además del top-bar), para que el hub refleje el foco como en el screenshot.

## Siguientes pasos recomendados (sin romper nada)
1) Mover `ui-bck.js` a `/legacy/` y asegurarte de que nadie lo importa.
2) Elegir 3 helpers y centralizarlos (por ejemplo `escapeHtml`, `clamp`, `formatCurrency`) y actualizar imports.
3) Split de datos: empezar por `squads_es.js` (por liga/club) para que el repo sea manejable.
4) Una vez estabilizado, aplicar el rediseño del hub (solo CSS + pequeñas clases active).
