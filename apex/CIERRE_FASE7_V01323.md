# Fase 7 — cierre técnico de la primera revisión de conducción

Versión `v0.13.23 · PRE-RELEASE`, build `2026.10.20.07`. Mantiene los 28 fragmentos, los 23 circuitos, archivos originales y formatos de partidas. Base main verificada antes de la revisión: `8e71e2d0dba93cf4b6efbb97aba546f36278be6d`.

## Qué faltaba para integrar

La validación del build 04 encontró coches automáticos casi detenidos, pero no permitía decidir si era una regresión. `tests/autopilot-audit.cjs` compara directamente los 28 fragmentos de main con los actuales en Chromium. Utiliza el loader, geometría, superficies, barreras, físicas, tráfico y cronometraje de producción; las dependencias de mundo no están simuladas. El test acelera el tiempo a pasos de 10 ms y agrupa IA/contactos cada cinco pasos, de forma idéntica para ambas versiones. Durante ese tramo suspende el rAF de producción y no mide render o FPS.

Cada sesión parte de la misma posición de parrilla, perfil asistido, seco y dificultad 1; se prueba con y sin los 21 rivales. El generador aleatorio se inicializa con una semilla fija al cargar el documento. Las interacciones de tráfico pueden divergir entre modelos físicos, por lo que no se exige igualdad de trazadas ni se interpreta cada metro de diferencia como una prestación.

## Causa demostrada del bloqueo

En la ejecución inicial [39378792023](https://github.com/sucendo/modojuego/actions/runs/39378792023), main ya se detiene en Spa sin rivales durante 46,62 s de una sesión de 60 s; el build 04 durante 46,67 s. Ambos terminan con `surfaceKind=BOUNDARY`, velocidad próxima a 0,03 m/s, freno casi cero, acelerador abierto y ningún impacto de muro registrado. Mónaco también reproduce el bloqueo en main. En Mónaco con tráfico, la trayectoria del build 04 queda atrapada antes, confirmando la necesidad de investigar antes de fusionar.

El SVG `drivableArea` es la autoridad para contener el escenario. Su rechazo de movimiento no equivalía a una barrera física ni tenía por qué coincidir con el ancho modelado de pista. `update()` reponía la posición anterior y amortiguaba velocidad, correctamente, pero no comunicaba ese rechazo a `autoRecoveryController()`. El automático podía clasificar la zona como pista, insistir con anti-stall y no ganar la velocidad necesaria para girar. Las puertas/cuerdas de recuperación comprobaban muros y ancho, pero podían ignorar el polígono o sus huecos.

## Corrección

- El rechazo existente registra `player.lastDrivableBoundaryHit`. La contención, posición, velocidad y fuerzas manuales conservan exactamente el comportamiento anterior; se añade un escalar de diagnóstico/control.
- El controlador existente considera el bloqueo reciente durante 0,8 s como situación de recuperación. A baja velocidad puede empezar su maniobra de marcha atrás ya existente. El estado se limpia al reiniciar el automático.
- Las puertas laterales y cuerdas de recuperación comprueban también el polígono autoritativo, incluidos sus huecos. La ausencia de polígono sigue siendo `null`, sin inventar un nuevo límite.
- La recuperación no se declara terminada mientras acaba de recibir un rechazo. Si escala a la maniobra de emergencia, un bloqueo reciente prioriza el centro sobre un borde modelado que puede quedar fuera del polígono.

No se añade teletransporte, fuerza nueva de rescate, modificación de alturas, agarre extra ni ventaja a rivales. Se reutilizan los estados, pedales y volante de la recuperación actual. Las consultas adicionales de polígono sólo se hacen al evaluar recorridos de recuperación, con los muestreos ya acotados, no mediante un barrido nuevo del circuito en cada tick.

Se conserva la pertenencia del episodio al límite aunque expire el último contacto. Una alineación inmóvil puede volver a la marcha atrás corta existente, conservando su orientación durante la maniobra si no hay un muro físico que aporte su normal. Después evalúa cuatro puntos cortos hacia el centro, con sus cuerdas comprobadas, para crear espacio de giro; no intenta alinearse indefinidamente pegado al borde. Si una colisión ha dejado el coche fuera, se permite la cuerda de entrada hasta alcanzar el interior, pero no volver a abandonarlo: la misma regla que usa la contención física. Al alcanzar asfalto válido, contenido y con menos de 40° de error de rumbo, pasa a alinear en el carril alcanzado: deja de perseguir un objetivo fijo que puede haber quedado atrás. La compuerta angular estable sigue siendo obligatoria antes de reanudar conducción normal. El HUD comunica la fase de recuperación efectiva.

`node apex/tests/auto-boundary-audit.cjs` verifica las funciones de producción: el caso estrecho no confundido con el ancho modelado, inicio de reversa sin cambiar posición/orientación, caducidad de la señal, huecos interiores, ausencia de polígono y obstáculos físicos. También exige que el paso a alineación no se active fuera del polígono ni con el coche cruzado. La auditoría de conducción conserva la comparación del bloque completo de integración/colisiones/cronometraje, descontando únicamente la nueva asignación escalar.

## Cobertura de cierre

Además de las regresiones gráficas y los 13 grupos físicos, el runner de Chromium prueba ahora pérdida de contexto WebGL mediante `WEBGL_lose_context`, fallback automático a Canvas y restauración real de WebGL, con estado finito y sin error GL al volver. Mónaco, Spa, Monza, Suzuka y Madrid detallado mantienen sus tres cámaras y entradas de teclado/táctil/mando/gyro sintéticas; Monza añade arranque y avance en FP1 y clasificación con rivales. Se conserva la migración/recarga del guardado antiguo y los autodiagnósticos del catálogo.

## Alcance

Cerrar esta revisión significa integrar una base física más estable con pruebas de regresión y el bloqueo encontrado diagnosticado. No significa homologar un monoplaza real, reproducir literalmente GP4 ni completar un modelo de suspensión, cuatro ruedas y transferencia lateral. Permanecen para validación humana las sensaciones, sensores físicos, Android real, GPU física y sesiones prolongadas; las muestras aceleradas no sustituyen vueltas humanas ni certifican cada elemento visual del circuito.

## Archivos y reproducción

- `parts/part-000.txt`: build visible de diagnóstico.
- `parts/part-025.txt`: cuadrícula móvil 2×2 estable (build 04).
- `parts/part-026.txt`: entradas, resolución de fuerzas, diagnóstico y controlador/puertas/cuerdas de recuperación; añade `autoBoundaryRejoinPoint()`.
- `parts/part-027.txt`: integración lateral/guiñada y registro del rechazo autoritativo existente en `update()`.
- `tests/driving-audit.cjs`, `tests/terrain-selection-audit.cjs`, `tests/auto-boundary-audit.cjs`: regresiones aisladas de funciones de producción.
- `tests/browser-audit.cjs` y `browser-hook.js`: sesiones de navegador, controles, cámaras, persistencia y ciclo de contexto.
- `tests/autopilot-audit.cjs` y `autopilot-hook.js`: comparación de la dinámica completa con main en Chromium.
- `.github/workflows/apex-audit.yml`: regresiones aisladas, Chromium escritorio/móvil y comparación automática, con logs como artefactos.

Comprobaciones locales ejecutadas satisfactoriamente:

```sh
node apex/tests/driving-audit.cjs --json
node apex/tests/render-audit.cjs
node apex/tests/terrain-selection-audit.cjs
node apex/tests/auto-boundary-audit.cjs
python3 apex/tests/circuit-assets-audit.py --json
node --check apex/tests/browser-audit.cjs
node --check apex/tests/browser-hook.js
node --check apex/tests/autopilot-audit.cjs
node --check apex/tests/autopilot-hook.js
git diff --check
```

Para reproducir el navegador: servir la raíz del repositorio por HTTP en el puerto 8765, instalar `playwright@1.62.1` y su Chromium, definir `PLAYWRIGHT_MODULE_PATH` si no está en la resolución normal de módulos y ejecutar los runners. `APEX_AUDIT_DEVICE=desktop|mobile` selecciona el perfil del runner gráfico; `SOFTWARE_GL=1` solicita SwiftShader. El comparador usa SwiftShader y la referencia main fija indicada arriba; `APEX_AUTO_CIRCUITS` y `APEX_AUTO_SECONDS` permiten ampliar casos/duración. Sólo el fixture estándar de 60 s aplica los watchdogs de menos de 8 s continuos a muy baja velocidad con demanda de movimiento y menos de 15 s sin mejorar el progreso un metro. Son presupuestos de comportamiento de esta regresión, no objetivos de FPS ni una garantía de completar cualquier carrera.

No se han modificado los SVG/JSON, la topología de suelo, túneles, peraltes, pit lane ni los esquemas de guardado. La inspección visual humana de todos esos elementos en los 23 circuitos sigue siendo distinta de estas comprobaciones automáticas.

## Resultado medido del build 07

[Actions 39381314529](https://github.com/sucendo/modojuego/actions/runs/39381314529), commit `868e8accc396ce54487fc096dff7f0c4a1efa24e`: cuatro jobs correctos (aisladas, Chromium escritorio, móvil emulado y comparación automática). Resultados: `tests/results/v01323-autopilot-closure.json` y `v01323-browser-closure.json`. El JSON de automático conserva puntos cada cinco segundos; el artefacto original conserva todos los puntos cada medio segundo. El diagnóstico inicial queda en `v01323-autopilot-before-boundary-fix.json`.

Máxima parada continua en 60 segundos simulados (`speed < 0,7 m/s`, demanda objetivo > 2 m/s):

| Circuito | Rivales | main (s) | build 07 (s) | Avance main → build 07 (m) |
|---|---|---:|---:|---:|
| Madrid detallado | No | 0,50 | 0,50 | 1045,2 → 1054,4 |
| Madrid detallado | 21 | 0,40 | 0,45 | 1144,0 → 1049,2 |
| Mónaco | No | 30,44 | 0,40 | 825,6 → 1337,5 |
| Mónaco | 21 | 1,67 | 2,22 | 1335,8 → 859,0 |
| Spa | No | 46,62 | 1,66 | 368,9 → 1751,1 |
| Spa | 21 | 38,88 | 0,89 | 353,6 → 1094,8 |
| Monza | No | 0,12 | 0,12 | 2273,0 → 2271,4 |
| Monza | 21 | 0,16 | 0,16 | 2181,7 → 2164,9 |
| Suzuka | No | 0,12 | 0,12 | 2264,9 → 2265,6 |
| Suzuka | 21 | 2,35 | 0,16 | 841,7 → 2225,7 |

El máximo de todos los casos actuales es 2,22 s detenido y 12,99 s sin mejorar el progreso un metro; estados finitos y cero fallos físicos registrados. No son tiempos de vuelta ni una promesa de ritmo superior en cada situación. Mónaco con tráfico sigue siendo peor en avance neto: la trayectoria actual sufre una colisión con suspensión trasera derecha al 56,7 % frente al 100 % en main. La recuperación termina antes del segundo 53 y al segundo 60 conduce a 24,26 m/s, en lugar de seguir en `PULL_IN` a 0,84 m/s como el build 06. Eso resuelve el bloqueo investigado, pero no demuestra paridad de tráfico ni elimina el coste de recuperarse de un accidente. Madrid sin tráfico termina en una recuperación activa pero moviéndose; Spa con tráfico inicia otra al final. Se conservan estos datos, sin seleccionar únicamente los casos favorables.

La regresión gráfica final ejecuta 30 ventanas de cámara, 40 comprobaciones de entradas, dos migraciones/recargas, dos cambios explícitos Canvas, dos pérdidas/restauraciones reales de contexto, cuatro arranques de FP1/clasificación y dos pasadas de autodiagnósticos del catálogo. No captura errores JavaScript ni errores GL en los puntos comprobados. Se observan tiempos de frame/CPU, bytes y heap en los JSON; son ventanas pequeñas en un runner compartido con SwiftShader. No se deduce un porcentaje de FPS ni se afirma que desaparezcan todos los picos. La mejora determinista de la cuadrícula móvil y las comparaciones de terreno anteriores permanecen documentadas en `AUDITORIA_V01323.md`.
