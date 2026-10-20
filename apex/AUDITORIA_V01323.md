# APEX v0.13.23 — Fase 7, primera revisión de conducción

Base: `main` en `8e71e2d0dba93cf4b6efbb97aba546f36278be6d` (v0.13.22), comprobada de nuevo antes de publicar. Se conservan los 28 fragmentos y los assets originales. Build actual: `2026.10.20.07`. Esta etapa corrige inconsistencias demostradas; no pretende reproducir fórmulas ni homologar sensaciones de GP4.

## Auditoría del modelo existente

| Área | Flujo y observaciones |
| --- | --- |
| Tiempo | `loop()` acumula tiempo rAF e integra `update()` a 100 Hz, hasta 12 pasos/frame. Descarta retraso excedente y lo contabiliza; no simula tiempo perdido ilimitadamente. Los trabajos pesados de IA se agrupan en el último paso. |
| Estado | `carAxes()`, velocidad longitudinal/lateral del chasis y guiñada; fuerza y momento integran orientación y velocidad mundial. La posición manual no se pega al centro de la pista. |
| Chasis | Modelo bicicleta de 800 kg, batalla 3,60 m, CG a 0,34 m, inercia de guiñada 1080 kg·m². Transferencia longitudinal estimada con la aceleración del paso anterior. No resuelve transferencia lateral entre cuatro ruedas. |
| Neumáticos | Rigidez dependiente de carga, deslizamientos por eje y saturación `tanh`; superficie y lluvia alteran agarre. No hay neumático Pacejka ni integración de velocidad de rueda. Bloqueo/patinaje son indicadores de demanda y saturación. |
| Motor/frenos | Tracción trasera, curva de aceleración dependiente de velocidad, frenada repartida, freno motor, drag, DRS, ERS, limitador. Se mantienen prestaciones y transmisión. |
| Dirección | Input y rampas por dispositivo/perfil, reducción de lock con velocidad, después fuerzas de contacto. No modifica directamente el rumbo en conducción manual. |
| Ayudas comunes | Amortiguación de guiñada, límites de seguridad y mezcla cinemática por debajo de 10 m/s incluso sin ayudas. No deben confundirse con un modelo de cuatro ruedas completamente libre de correcciones. Se conservan. |
| Perfiles | ASISTIDO: TC/ABS simplificados y amortiguación adicional; SIMULACIÓN y SIN AYUDAS: sin esas intervenciones, distintas rampas. Misma base física. No se duplican perfiles ni se cambian preferencias. |
| Suelo/colisiones | `syncPlayerTrack()`, `playerSurfaceState()` y `movePlayerWithWalls()`; perfiles de elevación/peralte y pose/contacto existentes. Conservados, fuera de esta revisión planar. |
| IA | Piloto automático del jugador utiliza su dinámica; recuperación automática tiene ayudas explícitas de rumbo/velocidad. Rivales usan dinámica híbrida en Frenet (`applyRivalNearDynamics`), no exactamente este solver. No se les añaden ventajas ni se cambia su planificador. |
| Cámara | `cameraLook`, respuesta de rasante y FOV se filtran a paso físico. No se cambian cámaras, balanceos ni geometría para ocultar problemas. |

## Problemas reproducidos y cambios

1. **Rigidez numérica a baja velocidad.** Euler explícito de los neumáticos puede alternar el signo de la guiñada cada 10 ms. Con 2 m/s, volante 0,3 y sin gas, el núcleo anterior presenta 499 cambios de signo en 500 pasos. Se introduce un paso linealmente implícito para velocidad lateral/guiñada: `(I − dt·w·J) Δ = dt·f`. El Jacobiano deriva de las fuerzas `tanh` existentes, con longitudinal fijo durante la linealización; resuelve un sistema 2×2, sin iteraciones. Peso completo hasta 6 m/s y transición continua a cero a 12 m/s. Por encima se conserva el paso explícito. El estado de equilibrio de fuerzas no cambia. La estabilización numérica es común a todos los perfiles; conserva las correcciones previas y no es una nueva ayuda de trayectoria.
2. **Volantazo fuera del scheduler.** `bt()` alteraba `player.steer` directamente al recibir `pointerdown` (16/28/62 % según perfil). Ahora registra sólo la intención; la rampa de 100 Hz aplica el volante. Latencia hasta un paso físico; deja de depender de cuántos eventos llegan entre frames. Se mantienen captura, cancelación, teclado, calibración/reset de gyro y rampas existentes.
3. **Dispositivo equivocado.** Un mando activo o giroscopio reciente imponía su configuración aunque quien girase fuese teclado/táctil. `apexSteeringInputDevice()` da prioridad a la entrada digital que efectivamente gira, igual que la selección de comando. Las entradas analógicas conservan su recorrido y centrado.
4. **Presupuesto de agarre inconsistente.** La fuerza longitudinal llegaba a 0,965 del pico, pero el consumo lateral se limitaba artificialmente a 0,93 y tenía un suelo. El barrido aislado alcanzaba 1,03263 del límite elíptico. Se calcula la capacidad lateral con el consumo longitudinal real, sin ese suelo: `latPeak·sqrt(1−longUse²)`. Se conservan picos, rigidez, masa, aero y saturación progresiva. A plena demanda longitudinal habrá menos capacidad de giro, justificadamente.
5. **Freno delantero en el marco incorrecto.** Se transforma también la fuerza longitudinal del freno desde la rueda girada al chasis y al momento de guiñada; antes sólo se transformaba la lateral. La dirección de oposición usa la velocidad del contacto delantero. Esto cambia la frenada en curva y necesita prueba de sensaciones; no cambia la frenada recta medida.
6. **Freno motor en reposo.** `Math.sign(u||1)` aplicaba fuerza hacia atrás desde parado y podía oscilar al cruzar cero. `apexEngineBrakeForce()` devuelve cero en reposo y limita la oposición al momento longitudinal disponible por paso, descontando el drag ya aplicado.

Funciones/archivos: helpers y selección de dirección en `parts/part-026.txt`; fuerzas, integración, indicadores y `bt()` en `parts/part-027.txt`; versión/build en `part-000.txt`. Sin cambios de coeficientes de prestaciones o configuraciones guardadas. `apexDrivingDiagnostics()` devuelve perfil/dispositivo, volante, ángulo físico, velocidad, guiñada, deslizamientos, utilización combinada, intervención TC/ABS y peso implícito. La norma de fuerza se calcula al consultar; el paso sólo almacena escalares. Un único `Float64Array(2)` reutilizado; sin nuevos timers, barridos de circuito, consultas de suelo o asignaciones por paso del solver.

## Pruebas ejecutadas y comparación

`node apex/tests/driving-audit.cjs --json` extrae y ejecuta los bloques de producción actuales y anteriores en VM Node. Aísla asfalto plano seco, daño ideal, sin colisiones, resistencia del terreno ni boost. Integra posición libre y estima `longG`; **no ejecuta una sesión de circuito completa**. El scheduler, rampas, pedales y callbacks táctiles reales se prueban con dependencias de entorno simuladas.

| Prueba aislada | Antes | Después |
| --- | ---: | ---: |
| Desplazamiento desde reposo, 2 s | −0,006500 m | 0 m |
| Cambios de signo de guiñada, 2 m/s, 5 s | 499 | 0 |
| Pico de guiñada en ese caso | 0,12645 rad/s | 0,04493 rad/s |
| Pico de uso combinado, 216 demandas/superficies | 1,03263 | 1,00000 |
| Frenada recta 70 → 0,5 m/s, pedal completo | 99,232 m; 3,16 s | 99,232 m; 3,16 s |
| Giro sin freno, inicial 20 y 70 m/s, 5 s | Referencia | Estados exactamente iguales |
| Scheduler a 15/30/60/144 FPS sintéticos, 800 ticks | — | Estados exactamente iguales |

Pasan 13 grupos: reposo, maniobras lentas, giro rápido, barrido de elipse, frenada parcial/intensa/en curva, bloqueo y liberación, TC/ABS diferenciados, arranque y salida de curva, simetría izquierda/derecha, contravolante y slalom, energía pasiva en los casos definidos, 10.000 pasos de estados variados finitos (incluida marcha atrás), controles de cuatro dispositivos/tres perfiles, pedales, scheduler real y convergencia. El error de estado agregado contra pasos de 1 ms baja de 0,01824 a 0,00824 al pasar de 100 a 200 Hz en el caso de convergencia; métrica numérica mixta, no error en metros. Producción sigue a 100 Hz. Los umbrales son regresiones numéricas, no prestaciones oficiales F1 ni certificación de energía en todas las situaciones.

El test comprueba además que el scheduler, configuración de perfiles, consulta de superficies, integración con barreras/cronometraje y dinámica de rivales conservan el código anterior. Pruebas gráficas anteriores: `node apex/tests/render-audit.cjs`, incluidas GPU simulada, proyección, atlas, clipping, reciclado y asfalto/pianos indexados: pasan. `python apex/tests/circuit-assets-audit.py --json`: pasan los 23 pares base y el SVG Madrid detallado, byte a byte sin cambios. Sintaxis de scripts ensamblados/runner y `git diff --check`: pasan. Resultados completos en `tests/results/v01323-*`.

### Coste

| Núcleo aislado, mediana µs/paso | v0.13.22 | v0.13.23 |
| --- | ---: | ---: |
| Inicial 4 m/s | 21.286 | 23.357 |
| Inicial 60 m/s | 21.117 | 21.189 |

El microbenchmark incluido calienta el núcleo, ejecuta siete rondas de 3.000 pasos y conserva escenarios de baja/alta velocidad mediante reinicios periódicos. Sus medianas y extremos quedan en `v01323-driving.json`. Es Node VM, incluye acceso a globals y no modela JIT, GPU, rAF, memoria total ni Android del simulador. Hay un pequeño aumento del coste por paso por la resolución implícita y los escalares diagnósticos; se comunica en lugar de prometer coste cero. No se cambia el renderer ni su preparación geométrica. No se puede certificar ausencia de regresión de FPS sin ejecutar el juego en navegador real.

## Estado inicial del build 03 y validación pendiente

Chrome disponible en el entorno no arranca por `socket() failed: Operation not permitted`. No se atribuyen FPS, calidad de conducción, validación WebGL/Canvas o pruebas Android a esta revisión. El runner `tests/browser-audit.cjs` añade diagnóstico físico y Suzuka a Madrid detallado, Mónaco, Spa y Monza; emula móvil y escritorio, prueba tres cámaras y autodiagnósticos. `ALL_CIRCUITS=1` amplía a las 23 bases. Sigue pendiente ejecutarlo en un equipo con Chrome/Playwright.

Antes de homologar sensaciones: sesiones manuales con teclado, táctil, gyro y mando en esos cinco circuitos; comparación de frenada en apoyo y contravolante con/sin ayudas; superficies mojadas, pianos, cambios de rasante, túneles y pit lane; carreras/rivales, sectores, importaciones privadas y guardado/restauración de partidas antiguas. Los formatos y funciones se conservan, pero no se presenta esa inspección de código como prueba de ejecución. Medir física/render, FPS/p95/p99 y sesiones prolongadas en PC y Android físico.

Una fase siguiente puede calibrar respuesta con esas trazas y estudiar ruedas, transferencia lateral y contacto/suspensión. No se añaden ahora parámetros de agarre, sensibilidad o ayudas para perseguir una sensación subjetiva sin validación real. La reducción de saltos táctiles y de oscilación numérica es verificable; que el tacto final satisfaga la referencia GP4 sigue requiriendo conducción humana.


## Continuación: validación automatizada del juego completo

Se incorpora `.github/workflows/apex-audit.yml` a las PR que cambian APEX y a los pushes de APEX a main. Tres jobs: regresiones aisladas y dos ejecuciones de Chromium (escritorio/emulación móvil). Instala Playwright 1.62.1 fuera del árbol del proyecto y utiliza SwiftShader para WebGL2. El workflow sólo necesita lectura del repositorio y conserva logs/JSON como artefactos de Actions. No cambia los 28 fragmentos de producción ni sus assets.

El runner arranca desde `apex/apex.html`, usando el loader real. Inyecta un hook de pruebas al ensamblar el último fragmento, sin desplegarlo en el simulador. En cada contexto nuevo crea un guardado mínimo de esquema 2 con ronda/puntos conocidos: verifica migración a esquema 4, persistencia y recarga. La fixture no toca las partidas de ningún usuario.

Después carga Madrid detallado importado, Mónaco, Spa, Monza y Suzuka con rivales, recorre las tres cámaras, recoge diagnóstico físico/render y comprueba estado finito, avance de tiempo simulado y errores GL. Los eventos de teclado/táctiles y muestras analógicas sintéticas atraviesan el camino real de inputs; no certifican un sensor ni un mando físico. Monza incluye ida/vuelta a Canvas. Volver al menú comprueba liberación de buffers; finalmente se ejecutan los autodiagnósticos de loader, cronometraje y mallas de las 23 entradas del catálogo. Madrid mantiene en ese recorrido su override importado; la auditoría offline valida por separado los 23 SVG/JSON base.

Para repetir localmente, servir la raíz del repositorio con `python3 -m http.server 8765` y ejecutar `node apex/tests/browser-audit.cjs`. Variables opcionales: `CHROME_EXECUTABLE`, `PLAYWRIGHT_MODULE_PATH`, `APEX_AUDIT_DEVICE=desktop|mobile`, `SOFTWARE_GL=1` y `ALL_CIRCUITS=1`. La versión móvil emulada y los FPS de software en un runner compartido no representan Android físico ni una GPU de PC. Este smoke test tampoco garantiza cobertura de cada curva, túnel, colisión o vuelta completa.


### Resultado de la primera ejecución completa

[Actions 39342418521](https://github.com/sucendo/modojuego/actions/runs/39342418521), commit `3aba7cb01b9f5e55d3139c7bde8b87cadc1210e3`, build 03: los tres jobs pasan. Entre escritorio y móvil emulado: 30 muestras de render/rAF, 40 comprobaciones de inputs, dos migraciones/recargas, dos pruebas Canvas y dos recorridos de autodiagnósticos del catálogo. Estados finitos y `gl.getError()===0` en los puntos comprobados; sin errores JS capturados. Son sesiones cortas con piloto automático y muestras de controles sintéticas, no vueltas completas ni ensayos físicos de sensores.

Evidencia resumida en `tests/results/v01323-browser-ci-before-terrain-fix.json`; logs completos y artefactos enlazados desde Actions. SwiftShader da FPS muy bajos y variables, especialmente a resolución de escritorio: no se trasladan a Android ni se comparan como prestaciones de una GPU física. La física agrupada por frame también se encarece al acumular hasta 12 pasos; sus tiempos no son tiempos por tick.

En el Madrid móvil, una muestra contiene un frame con 3.359,3 ms atribuidos a terreno. Esa observación no demuestra por sí sola una causa única. Al revisar el camino se detecta, independientemente, una inconsistencia reproducible de caché: el compilador precalcula bloques 2×2 de origen par; `apexCollectTerrainPlateCells()` iniciaba la cuadrícula desde un mínimo relativo a cámara, que podía ser impar. Al cruzar un límite cambiaba todos los bloques de paridad y no encontraba los propietarios precalculados.

### Corrección del build 04: selección móvil estable

Se alinea el inicio del barrido con la misma cuadrícula fija del compilador: `min − min % step`. A paso 1 de escritorio es idéntico. Se conservan límites de radio/frustum, presupuestos, priorización cercana, subdivisión de máscaras parciales y detalle de portales. No hay cambios en el SVG, alturas de vértices ni algoritmo de recorte; se eligen los bloques ya previstos por la precarga. No se invalida la caché compilada, pues sus bloques pares existentes son precisamente los correctos.

`node apex/tests/terrain-selection-audit.cjs`: las funciones de selección y caché de producción se ejecutan antes/después con una cuadrícula sintética y clipping instrumentado. Desplazamiento de 2 cm en límite X: 229 → 5 nuevas claves gruesas; límite Z: 230 → 13. En una región precargada, 230 → 0 llamadas nuevas al recorte. La prueba verifica ausencia de bloques seleccionados superpuestos, máscaras parciales, extremos de grid, portales finos, selección de escritorio idéntica y función propietaria sin cambios. Esto mide reutilización de claves, no tiempo de recorte ni FPS.

La segunda ejecución CI contrasta el build 04 con el juego completo. No se promete que esta única corrección elimine todos los tirones: hay geometría dinámica de coches/decorados, recortes finos y costes de driver que siguen presentes.

También aparecen velocidades casi nulas en algunas instantáneas del piloto automático de Mónaco/Spa/Monza. El smoke test comprueba estado finito e inputs y no exige completar una vuelta: ese comportamiento quedó pendiente en el build 04 y se investiga y corrige en los builds 05–07, documentados en [CIERRE_FASE7_V01323.md](CIERRE_FASE7_V01323.md). No se presenta la ejecución verde como homologación de la IA o de la conducción.


### Observación posterior en Chromium móvil emulado

La segunda ejecución vuelve a pasar los cinco circuitos y las comprobaciones de inputs/guardado/Canvas en el perfil móvil. En las nuevas ventanas de Madrid el terreno promedia 1,038 / 1,282 / 0,895 ms por frame (cockpit / T-cam / chase), frente a 480,886 / 23,361 / 0,922 ms en la primera ejecución. El primer promedio anterior estaba dominado por un único frame de terreno de 3.359,3 ms y sólo contenía siete frames; no es una mediana robusta. El peor render total de las nuevas ventanas es 100 / 154,7 / 165,3 ms. Hay otros bloqueos: el observador de long tasks llega a 572 ms en cockpit, y aún hay costes de coches/decorados y del driver.

Son dos ejecuciones de un runner compartido con recorridos/velocidades y muestras diferentes; no se infiere una aceleración porcentual controlada ni un FPS objetivo. La regresión determinista de las claves sí demuestra que la cuadrícula ya utiliza los recortes precalculados. No se afirma que hayan desaparecido todos los picos ni que el motor alcance 30/60 FPS en hardware real.

[Actions 39343172461](https://github.com/sucendo/modojuego/actions/runs/39343172461), commit `4d48b6e09c2b0ccc63c11a7e2e2207a1965be765`, build 04: también pasan los tres jobs, incluido escritorio. Chromium 151.0.7922.34 / Node 22.23.3 / SwiftShader. Se conservan las 30 muestras, 40 comprobaciones de entradas, dos migraciones/recargas, dos cambios Canvas y autodiagnósticos del catálogo; sin errores JS capturados ni GL en los puntos medidos. Resultado reproducible resumido: `tests/results/v01323-browser-ci.json`. El script añade observación de long tasks y heap y tiempos máximos de carga/autodiagnóstico para que un bloqueo falle con una etapa identificable. El JSON identifica el commit exacto probado; los cambios posteriores de documentación no se presentan como otra medición.

## Cierre de la primera etapa

El diagnóstico comparativo, la corrección de bloqueos del límite SVG, las transiciones de recuperación, las pruebas adicionales y las limitaciones restantes se registran en [CIERRE_FASE7_V01323.md](CIERRE_FASE7_V01323.md). Los resultados anteriores se conservan con su build y commit originales; no se atribuyen a la compilación final.
