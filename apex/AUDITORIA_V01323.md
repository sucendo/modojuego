# APEX v0.13.23 — Fase 7, primera revisión de conducción

Base: `main` en `8e71e2d0dba93cf4b6efbb97aba546f36278be6d` (v0.13.22), comprobada de nuevo antes de publicar. Se conservan los 28 fragmentos y los assets originales. Esta etapa corrige inconsistencias demostradas; no pretende reproducir fórmulas ni homologar sensaciones de GP4.

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

## Validación pendiente y siguiente etapa

Chrome disponible en el entorno no arranca por `socket() failed: Operation not permitted`. No se atribuyen FPS, calidad de conducción, validación WebGL/Canvas o pruebas Android a esta revisión. El runner `tests/browser-audit.cjs` añade diagnóstico físico y Suzuka a Madrid detallado, Mónaco, Spa y Monza; emula móvil y escritorio, prueba tres cámaras y autodiagnósticos. `ALL_CIRCUITS=1` amplía a las 23 bases. Sigue pendiente ejecutarlo en un equipo con Chrome/Playwright.

Antes de homologar sensaciones: sesiones manuales con teclado, táctil, gyro y mando en esos cinco circuitos; comparación de frenada en apoyo y contravolante con/sin ayudas; superficies mojadas, pianos, cambios de rasante, túneles y pit lane; carreras/rivales, sectores, importaciones privadas y guardado/restauración de partidas antiguas. Los formatos y funciones se conservan, pero no se presenta esa inspección de código como prueba de ejecución. Medir física/render, FPS/p95/p99 y sesiones prolongadas en PC y Android físico.

Una fase siguiente puede calibrar respuesta con esas trazas y estudiar ruedas, transferencia lateral y contacto/suspensión. No se añaden ahora parámetros de agarre, sensibilidad o ayudas para perseguir una sensación subjetiva sin validación real. La reducción de saltos táctiles y de oscilación numérica es verificable; que el tacto final satisfaga la referencia GP4 sigue requiriendo conducción humana.
