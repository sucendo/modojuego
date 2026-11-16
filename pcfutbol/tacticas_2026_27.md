# Identidad táctica inicial · PC Fútbol 2026/27

La base de esta entrega es el PR #173 de plantillas. Los 272 clubes de 14
ligas reciben un **sistema principal**, un **sistema alternativo**, mentalidad,
presión, ritmo, estilo de juego y dos rasgos de entrenador (riesgo y adaptación).
Todos estos rasgos se mantienen al guardar/cargar la partida y se generan de
forma determinista, para que comenzar otra partida no cambie arbitrariamente
la identidad de un equipo.

## Trazabilidad: observación frente a estimación

**Ampliación PR #175:** 48 clubes tienen formaciones contrastadas con
registros de varios partidos de 2026/27 (20 en LaLiga y 28 europeos).
Los 224 restantes emplean `sourceType: 'estimated-from-roster'`.
La relación de encuentros, recuentos, excepciones por empate y enlaces
individuales está en [tacticas_observadas_2026_27.md](tacticas_observadas_2026_27.md).
Ni un esquema observado ni la distribución de posiciones prueban la presión,
el estilo, el ritmo o el comportamiento de un entrenador: esos rasgos son
**simulados**, no biografías reales.

## Nueve sistemas y su representación

`4-4-2`, `4-3-3`, `4-2-3-1`, `3-5-2`, `3-4-3`, `5-3-2`,
`5-4-1`, `4-1-4-1`, `4-5-1`.

La posición de cada jugador sobre el campo tiene una demarcación concreta.
El motor ajusta moderadamente ataque/defensa al sistema, la mentalidad, el
ritmo, la presión y la afinidad posicional. Se evita que un simple cambio de
formación convierta un equipo débil en uno excepcional.

La selección automática de titulares busca jugadores adecuados para cada
posición, garantiza un solo guardameta y conserva las alineaciones manuales
y los onces guardados existentes.

## Cambios de la IA durante el partido

- Antes de empezar, un entrenador muy adaptable puede reforzar la defensa
  ante un rival sensiblemente superior, si su sistema alternativo lo permite.
- En el minuto 65, si va perdiendo, puede subir ritmo y presión o pasar a una
  variante más ofensiva, según el perfil de riesgo.
- Si va ganando, puede proteger la ventaja y reducir presión/ritmo, según el
  perfil del entrenador.
- **El equipo del usuario no cambia de táctica por iniciativa de la IA.**
- Los cambios son **temporales para ese partido**; el siguiente arranca con
  la identidad habitual del club. Las decisiones quedan en `tacticalPhases`
  y `tacticalChanges` en el partido guardado; los goles se distribuyen en sus
  fases para mantener coherencia cronológica. El resumen posterior del partido
  muestra la formación inicial y los ajustes del entrenador.

Las **ligas paralelas** también emplean las identidades y los cambios tácticos
en su simulador rápido; sus onces ya no se construyen sencillamente con los
once jugadores de mayor valoración (que podían incluir varios porteros).

No se realiza ningún traspaso por estas decisiones. Permanece intacta la
restricción del PR #173: la IA no modifica plantillas hasta enero de 2027.

## Verificación

`node --test pcfutbol/tests/*.test.mjs`

Las pruebas comprueban nueve formaciones válidas, los 272 onces de inicio,
preservación del equipo humano, efectos modestos en ataque/defensa, cambios
al ir perdiendo, guardado de decisiones y eventos de gol por fase.
