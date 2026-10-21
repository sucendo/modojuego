# APEX Formula 26 — Fase 8C — v0.14.2 PRE-RELEASE

Base: `main` en `36fd9f591f6c2c26d7946a551e45d7108369678a` (8B, PR #32). Rama `apex/phase-8c-race-distance`.

## Auditoría y decisiones

El motor ya separaba `timing.startS` (parrilla) y `timing.finishS` (control/meta), contaba la primera vuelta con `apexGridControlRule`, y proyectaba la circulación en PIT sobre el progreso de pista. No se sustituyen esos sistemas. Antes, Carrera rápida y GP utilizaban 2/3/5 vueltas y Temporada 3. El jugador llamaba a `finishRace` al alcanzar su límite, cerrando también la simulación de rivales pendientes; los rivales se marcaban terminados sólo al alcanzar el mismo número de vueltas. No existía una llegada progresiva de doblados tras la bandera.

Los 23 JSON base ya contienen `race.laps`, `race.totalLaps` y `grandPrix.totalLaps`. Se reutilizan sin cambiar geometrías, coordenadas ni las fichas originales. La distancia oficial no se deduce de 305 km: Mónaco conserva 78 vueltas. El identificador histórico `16-bahrain` representa Sepang en los datos APEX: conserva 56 vueltas de ese trazado, no se sustituye por las de Sakhir. Esa asociación forma parte del calendario del simulador y no se certifica aquí como cambio del calendario FIA real.

Comprobación adicional de las referencias representativas: [Madrid (57)](https://www.formula1.com/en/latest/article/formula-1-tag-heuer-gran-premio-de-espana-2026.3EpMV9Idk1jwxq3KtxcC6x), [Mónaco (78)](https://www.formula1.com/en/racing/2026/monaco), [Suzuka (53)](https://www.formula1.com/en/racing/2026/japan), [Monza](https://www.formula1.com/en/racing/2026/italy), [Spa](https://www.formula1.com/en/racing/2026/belgium). Los metadatos heredados no se convierten en nuevas mediciones de distancia: longitud modelada, distancia nominal y longitud oficial publicada pueden diferir.

## Vueltas y configuración

Fórmula única: `max(1, ceil(vueltasCompletas * porcentaje / 100))`. Siempre se redondea hacia arriba. El porcentaje se guarda en `apex26.race.percent.v1`; selección inicial 25 %. Carrera rápida, GP y Temporada comparten preferencia. El menú muestra porcentaje, vueltas y multiplicador. La opción se congela al iniciar la carrera en `trackData.raceConfig` y en el registro de sesión; cambiar después la preferencia sólo afecta a futuras sesiones. El fin de semana de Temporada conserva también la selección.

Prioridad de vueltas: JSON efectivo `race.totalLaps`, `race.laps`, `grandPrix.totalLaps`; después metadatos base del mismo ID y, al preparar sesión, `loaded.laps` heredado. Sólo enteros positivos finitos hasta 10000. Circuitos personalizados sin vueltas declaradas conservan FP y necesitan completar su JSON para Carrera: se informa y se deshabilita el inicio desde el menú, sin inventar una distancia oficial. FP y Qualy mantienen su duración y reglas anteriores.

| Circuito | 100 % | 25 % | 50 % | 75 % |
|---|---:|---:|---:|---:|
| Australia | 58 | 15 | 29 | 44 |
| China | 56 | 14 | 28 | 42 |
| Suzuka | 53 | 14 | 27 | 40 |
| Miami | 57 | 15 | 29 | 43 |
| Canadá | 70 | 18 | 35 | 53 |
| Mónaco | 78 | 20 | 39 | 59 |
| Barcelona | 66 | 17 | 33 | 50 |
| Austria | 71 | 18 | 36 | 54 |
| Silverstone | 52 | 13 | 26 | 39 |
| Spa | 44 | 11 | 22 | 33 |
| Hungría | 70 | 18 | 35 | 53 |
| Zandvoort | 72 | 18 | 36 | 54 |
| Monza | 53 | 14 | 27 | 40 |
| Madrid | 57 | 15 | 29 | 43 |
| Bakú | 51 | 13 | 26 | 39 |
| Sepang (`16-bahrain`) | 56 | 14 | 28 | 42 |
| Singapur | 62 | 16 | 31 | 47 |
| Austin | 56 | 14 | 28 | 42 |
| México | 71 | 18 | 36 | 54 |
| São Paulo | 71 | 18 | 36 | 54 |
| Las Vegas | 50 | 13 | 25 | 38 |
| Catar | 57 | 15 | 29 | 43 |
| Abu Dabi | 58 | 15 | 29 | 44 |

## Desgaste proporcional: límite provisional común

Se calcula `requestedWearMultiplier = 100 / porcentaje`, pero 8C aplica **`min(requestedWearMultiplier, 1.25)`** a todos los coches. Factores efectivos: 25/50/75 % → 1,25; 100 % → 1,00. Es una política conservadora de jugabilidad, no una ley física ni el escalado inverso completo propuesto. Queda expresamente limitada hasta disponer de navegación estratégica de IA a boxes en 8D.

La auditoría de 8A muestra vidas base de 115/160/205 km para S/M/H, reducidas por cargas/abrasión/calor. Aplicar ×4 en una carrera al 25 % equivale al desgaste de un GP entero: los 21 rivales no pueden cambiar neumáticos, mientras el jugador sí. Eso amplifica su desventaja. El límite 1,25 da un aumento moderado sin adelantar todo ese desgaste a carreras cortas; NO certifica equilibrio competitivo perfecto de tandas largas. Al 100 % no se cambia el modelo previo, incluida su limitación de IA sin paradas.

El factor sólo multiplica la suma de desgaste en `apexTyreEvolveAxle`, una vez. `t.distance`, `tyreAge`, dt, cronometraje, temperaturas de superficie/carcasa y cambios reales de 8B no se multiplican. El agarre sigue derivándose de compuesto/temperatura/humedad/desgaste con la curva continua original. Al terminar cada coche se congela la evolución de su juego. No hay neumáticos nuevos ocultos, compensaciones por piloto ni paradas falsas. La comparación numérica del 100 % frente a 8B exige igualdad exacta en los cinco compuestos.

## Meta, clasificación y resultados

Se conservan `updateLapValidation`, `updateRivalLapTiming`, `crossedTimingLine` y la regla de primera vuelta. Cada cruce aceptado añade un evento pequeño; la cadencia pesada existente ordena únicamente esos eventos por instante interpolado dentro del paso físico. El instante de IA se refiere a su subpaso dentro del bloque acumulado. Así el orden de iteración jugador/rivales no decide el ganador si cruzan durante el mismo bloque.

El primer cruce que alcanza las vueltas previstas activa la bandera a cuadros. Cada participante restante termina en su siguiente cruce válido, incluidos doblados. Vueltas y tiempo de cada coche quedan fijados. El orden final usa vueltas descendentes y tiempo de llegada para coches en la misma vuelta. Las vueltas/posición no se reinician al cambiar de red PIT. La primera vuelta puede no constituir una vuelta rápida completa según la regla heredada, y se mantiene sin inventarle tiempo homologado.

El registro de llegada captura también paradas y compuesto en ese instante. Resultados: posición, piloto, escudería con su identidad visual, vueltas, tiempo/diferencia o vueltas perdidas, paradas, compuesto y mejor vuelta medida. Sin lectura se muestra `—`. La pantalla final se abre cuando llegan todos; tras la bandera se puede consultar la clasificación provisional y volver a la conducción. El menú permite consultar de nuevo el último resultado final, incluso después de recargar.

No se generan abandonos por timeout, posiciones ficticias ni tiempos estimados para cerrar un coche atascado. El modelo anterior no ofrecía un estado de abandono deportivo fiable. Si un participante no cruza, su fila sigue `EN PISTA`; la clasificación provisional y la salida al menú siguen disponibles. El control manual/asistido/automático y las tres cámaras no se cambian al recibir bandera.

## Guardado, rendimiento y compatibilidad

Esquema principal 4 y migraciones 2/3/4 intactos. Campos opcionales: `lastRaceSession` (configuración fijada, longitud nominal y de control, estado, ganador, tiempo y filas) y `lastRaceResult` (último final). Se conservan `lastTyreSession`, juegos, contadores e historial real de 8B. Recargar NO reanuda carreras en curso: se conserva el informe, no se implementa un snapshot de conducción. Los resultados finales sí se pueden consultar tras recarga.

Sin timers nuevos, sin cambios de frecuencia física (100 Hz), geometría, cámaras, render, cachés, resolución adaptativa o LOD. Resolución de vueltas/factores al configurar/iniciar. En cada paso sólo se anotan dos tiempos por coche; sin cruce, la función de llegada sale comprobando una cola vacía. Sólo se construyen resultados al solicitarlos, guardar o terminar. La ordenación de eventos sólo sucede en cruces reales, no hay clasificación completa adicional cada frame.

## Validación reproducible

- `node apex/tests/race-distance-audit.cjs`: matriz 23×4, personalizados/JSON antiguos, configuración fijada, sectores, marcha atrás/proyección, primera vuelta antes/después/coincidente, llegada por orden temporal, doblados, 22 coches, resultados y guardado, FP/Qualy, desgaste/metros/temperaturas y comparación exacta 100 % con 8B.
- Auditorías existentes de conducción, neumáticos, boxes, geometría PIT, render, superficies, límites automáticos y 23 activos: se reproducen sin quitar sus comprobaciones.
- `race-distance-browser.cjs`: Chromium escritorio/móvil emulado, selección/persistencia, matriz, fixtures de llegada con actualización física real en Madrid/Mónaco/Monza/Suzuka/Spa, consulta posterior; además GP reducido completo de Monza desde parrilla con 22 coches, sin colocar coches ni forzar vueltas durante esa carrera.
- `pit-tyres-browser.cjs`: paradas reales de 8B al 25 %, lluvia y controles, bloqueo seguro de Spa; benchmark comparable al 100 % frente al commit base de 8B.
- CI mantiene las auditorías de conducción automática, escritorio y móvil; añade las comprobaciones 8C.

Los fixtures de llegada NO equivalen a conducir un GP completo en cada circuito. Chromium móvil emulado y SwiftShader NO son un teléfono físico ni certifican FPS en GPU real. Los recibos finales, métricas y limitaciones se incorporan tras ejecutar la candidata.

## Pendientes y 8D

Implementar decisiones y navegación real de los rivales a boxes, ocupación compartida y estrategia antes de activar el factor inverso completo. Reparar el SVG de Spa con una fuente válida antes de habilitar su servicio. Verificar tacto de conducción y rendimiento en Android físico. Reanudación de carreras, nuevos abandonos deportivos, penalizaciones y safety car quedan fuera de 8C.
