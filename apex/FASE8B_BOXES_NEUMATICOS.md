# APEX Formula 26 — Fase 8B — v0.14.1 PRE-RELEASE

Base verificada: `main` en `e5c5578f470bbf7ee77bf703058e8d781f888dfe` (v0.14.0). Se conservan los 28 fragmentos y los cambios de controles, giroscopio, cámaras, superficies y neumáticos.

## Comprobación previa de 8A

GitHub Actions `39399959167`: isolated, autopilot, chromium (desktop) y chromium (mobile) finalizaron **success**. Incluye migración de guardados, 22 coches, tres cámaras, controles, fallback/restauración WebGL y comprobaciones de los 23 circuitos. La versión de 8A estaba pendiente cuando se redactó su informe; ese estado ya está resuelto respecto a estos tests automáticos. Sus frames con SwiftShader NO certifican el rendimiento de una GPU/teléfono físico.

## Arquitectura y cambios

- `part-026`: se reutiliza `apexPitStopController`, `apexPitRoutePlan`, `apexPitPathControl`, `apexPlayerClassificationS`, petición y botones existentes. No hay segunda máquina de estados ni timers nuevos.
- Se corrige el fallo preexistente que reiniciaba `serviceUntil` cada tick detenido: `apexPitServiceBegin` reclama el inicio una vez; `apexPitServiceComplete` valida el plazo y reclama la instalación una vez antes de llamar `apexTyreInstall`.
- El controlador se consulta desde el paso físico común también en manual. Ya no depende de entrar por `demoDriverControl`. En manual no dirige entrada/circulación/salida; ofrece ayuda de frenada y alineación sólo a baja velocidad junto al box, y retiene el coche durante SERVICE. No cambia `demoMode`, perfil, giroscopio, cámara ni el modo de ayuda seleccionado.
- AUTO recorre los mismos segmentos PIT, puertas y reincorporación con el controlador anterior. ASISTIDO conserva volante manual y aprovecha el control longitudinal de PIT.
- `part-024`: al detectar la entrada física a PIT, `apexPitClampSpeed` aplica el límite también en la transición posterior al movimiento, cerrando el pico de 86 km/h observado en la primera prueba real de Madrid.
- `part-027`: `apexPitLimitedVmax` limita la velocidad resultante con limitador o dentro de la red PIT, además del recorte previo de aceleración/frenado existente. No se fuerza una posición ni se omiten colisiones.
- La franja identificativa de las ruedas WebGL toma el color del compuesto del coche mediante su basis ya creado. Sin nuevas mallas, objetos de mecánicos, pases de render o consultas de coches fuera de cámara. HUD/torre también reflejan el cambio.
- La lógica sin solicitud activa retorna antes de consultar geometría. Slots/perfil/configuración se cachean en la ruta cargada. Telemetría por muestra usa un resumen compacto, no vuelve a clonar todo el historial a 5–10 Hz.

## Máquina de estados definitiva

`REQUESTED → APPROACH → IN_LANE → SERVICE → EXITING → MERGE_OUT → DONE`.

REQUESTED/APPROACH permiten cancelar mientras la puerta de entrada no se haya cruzado. Una vez comprometida la entrada no se cancela ni cambia de red por un clic. La selección de compuesto puede cambiar hasta SERVICE, momento en que se congela `lockedCompound`.

APPROACH cruza la puerta del extremo de la línea de pit real. IN_LANE utiliza el `runtimePitS` del slot correspondiente a la escudería (teamAssignment explícito o índice estable del catálogo). Se detiene dentro de la tolerancia longitudinal/lateral del slot. Si se supera el box por más de 6 m, sale sin prestar servicio; nunca cambia neumáticos ocultamente al detenerse en cualquier lugar del pit.

SERVICE retiene el coche y muestra compuesto/cuenta atrás. Al terminar instala exactamente un juego y pasa a EXITING. La puerta de salida restituye el estado anterior del limitador; MERGE_OUT sólo termina al estar físicamente dentro del carril de pista, sin el timeout antiguo que declaraba reincorporado un coche todavía fuera. DONE deja un aviso temporal y libera la solicitud.

## Transacción de neumáticos

`apexPitServiceComplete(car, st, now)` utiliza el compuesto seleccionado y llama a `apexTyreInstall`. Desgaste delantero/trasero y distancia pasan a cero; temperatura superficial/carcasa se inicializan con las reglas de 8A (óptimo menos 20°C), y se recalcula el agarre. No se crean coches ni se reinician vueltas, cronómetros, coordenadas, daños o ERS.

`tyreSet` y `pitStops` se incrementan únicamente en esta transacción; `tyreAge` se deriva de `tyres.distance / 1000`, también para los rivales. `lastInstalledCompound` e historial registran la operación. El historial se acota a las últimas 64 paradas por coche.

Duración de servicio predeterminada: 2,8 s. Configurable en `pitLane.service.tyreChangeSeconds` del JSON, limitada a 2–4 s. No hay variación aleatoria ni errores de mecánicos.

Historial: entrada, inicio/fin del servicio, salida, tiempo parado/servicio, espera y circulación. La espera es cero en esta fase (no hay cola de mecánicos). El tiempo total en el pit se mide al salir. La pérdida frente a pista es **una estimación** usando longitud de pista entre conexiones y velocidad de referencia a la entrada; no es una vuelta contrafactual exacta, ni modifica clasificación. Puede ser negativa con geometrías modeladas o entradas lentas.

## Interfaz y persistencia

EST / Y abre un panel compacto dentro del HUD sin pausar. Selector nativo accesible con teclado/ratón/táctil; cinco compuestos, color, juego actual/desgaste/temperatura, asfalto/aire/agua y recomendación orientativa. La recomendación no cambia automáticamente la elección. El selector se bloquea durante el servicio/salida y el panel se reinicia al entrar en una sesión nueva.

La elección siguiente se guarda en `apex26.tyre.next.v1`. `save.lastTyreSession.pits` conserva selección, último compuesto, juegos, contadores e historial del jugador y rivales al terminar/salir. Exportación de telemetría incluye `pitState`; muestras incluyen estado compacto y el evento de instalación registra la operación. El esquema principal 4 y sus migraciones 2/3/4 se conservan; campos nuevos opcionales con valores seguros. **Recargar no reanuda carreras en curso**, igual que antes.

## Geometría y limitaciones

Se auditó el pit lane y los slots existentes en los 23 pares JSON/SVG. No se añadieron coordenadas ni se sustituyeron las geometrías. Se eliminó el uso del antiguo box genérico al 57%: sin slot autorado válido no se habilita la parada. Los perfiles antiguos o personalizados sin slots pueden seguir conduciéndose, pero no ofrecen cambio de neumáticos hasta completar su JSON. Se rechaza también una inversión de dirección superior a 120° en menos de 6 m en los vértices originales del pit SVG. Spa presenta un retorno de unos 147° en unos 3 m: la prueba real no pudo completarlo, así que **su servicio queda deshabilitado de forma segura, pendiente de corregir su geometría**. No se modifica ni se inventa el recorrido para ocultar ese fallo. Madrid, Mónaco, Monza y Suzuka sí completaron el ciclo completo en las pruebas reales.

Los slots heredados están modelados/provisionales, no medidos oficialmente. Se utiliza su estación longitudinal sobre el centro del carril PIT; no se fuerza el desplazamiento lateral hacia la fachada del garaje, que podría atravesar barreras/superficies. No se simula aún un carril de servicio separado ni ocupación de un box por compañeros. La geometría física y sus colisiones siguen mandando. La prueba real detectó que el polígono general de Spa omitía un tramo del carril PIT: para el jugador ya en PIT se une únicamente la anchura real de esa cinta autorada al área transitable, conservando las colisiones de barreras y el rechazo de puntos fuera del carril. No se añadieron coordenadas. Un perfil de velocidad PIT precalculado cada 4 m deriva la curvatura del trazado existente y anticipa frenadas en sus curvas estrechas; se mantiene el controlador y la física del coche. La clasificación se ancla al progreso aceptado al cruzar la entrada para evitar el salto de proyección entre pista y pit.

| Circuito | Longitud pit modelada m | Slots | Calidad de box heredada |
|---|---:|---:|---|
| 01-australia | 490.982 | 11 | MODELED_POSITION |
| 02-china | 581.073 | 11 | MODELED_POSITION |
| 03-japan | 459.286 | 11 | MODELED_POSITION |
| 04-miami | 537.088 | 11 | MODELED_POSITION |
| 05-canada | 424.411 | 11 | MODELED_POSITION |
| 06-monaco | 326.462 | 11 | MODELED_POSITION |
| 07-barcelona-catalunya | 530.979 | 11 | MODELED_POSITION |
| 08-austria | 421.032 | 11 | MODELED_POSITION |
| 09-great-britain | 652.698 | 11 | MODELED_POSITION |
| 10-belgium | 581.878 | 11 | MODELED_POSITION |
| 11-hungary | 466.257 | 11 | MODELED_POSITION |
| 12-netherlands | 451.005 | 11 | MODELED_POSITION |
| 13-italy | 524.875 | 11 | MODELED_POSITION |
| 14-spain | 915.624 | 11 | PROVISIONAL_POSITION |
| 15-azerbaijan | 554.056 | 11 | MODELED_POSITION |
| 16-bahrain | 575.979 | 11 | MODELED_POSITION |
| 17-singapore | 464.188 | 11 | MODELED_POSITION |
| 18-united-states | 536.902 | 11 | MODELED_POSITION |
| 19-mexico | 482.091 | 11 | MODELED_POSITION |
| 20-sao-paulo | 479.847 | 11 | MODELED_POSITION |
| 21-las-vegas | 566.873 | 11 | MODELED_POSITION |
| 22-qatar | 550.971 | 11 | MODELED_POSITION |
| 23-abu-dhabi | 532.491 | 11 | MODELED_POSITION |

## IA

Los 21 rivales mantienen el modelo híbrido existente, sin una ruta de entrada a boxes equivalente a la del jugador. Se inicializan selección/último compuesto/historial/contadores y comparten la transacción `apexPitServiceBegin` / `apexPitServiceComplete`, probada con 22 coches. **No se han añadido paradas instantáneas ocultas** ni renovación de neumáticos por distancia. La navegación y las decisiones de parar de IA quedan para 8D, junto con la ocupación compartida de los boxes.

## Pruebas y resultados

Pruebas numéricas locales aprobadas:

- `pit-tyres-audit.cjs`: 19 grupos, cinco compuestos, retención/cambio de selección, cancelación/compromiso, S→H, reinicio térmico/desgaste/agarre, idempotencia, contadores, estados de carrera, manual, limitador, box superado, salida y proyección por meta, 22 coches, lluvia y datos antiguos/incompletos.
- `pit-geometry-audit.py`: 23 perfiles con SVG de pit y 11 slots válidos cada uno. No sustituye prueba de trayectoria/colisiones.
- `tyres-audit.cjs`: 16 grupos del motor de 8A y migración de guardado.
- `driving-audit.cjs`: 14 grupos de fuerzas, controles, scheduler y estabilidad. Se cargó el nuevo limitador real en el fixture, sin sustituirlo por una copia.
- `render-audit.cjs`, `terrain-selection-audit.cjs`, `auto-boundary-audit.cjs`, `circuit-assets-audit.py`: aprobados; sin cambios de JSON/SVG base.
- Sintaxis de los runners/hooks y `git diff --check`: aprobados.

Benchmark local del controlador sin parada: un millón de llamadas, mediana de cinco rondas. Referencia v0.14.0: 378.73 ms; candidato: 277.36 ms. Es microbenchmark de Node/VM, no un resultado de FPS.

### Validación Chromium de trayectoria y render

PENDIENTE DE RESULTADOS DEL CI DE ESTA REVISIÓN. `pit-tyres-browser.cjs` utiliza los 28 fragmentos reales, circuitos cargados, paredes, superficies y `update()` a 100 Hz. La posición se fija sólo como condición inicial antes de pedir la parada; después se prohíben saltos y se comprueban servicio, pit speed, cronometraje y salida real. Madrid, Mónaco, Monza y Suzuka con 22 coches; Spa comprueba la negativa segura por geometría defectuosa; Monza con lluvia. Añade servicios manuales con entradas sintéticas de teclado/táctil/giroscopio y compara frames de v0.14.0 frente al candidato en el mismo runner.

Las capturas y logs se guardan como artefactos de CI. Un fallo de trayectoria bloquea la integración y el cierre de 8B; no se considera superado con los tests de transacción.

## Próximos pasos

8C puede añadir duración de carrera sin tocar la transacción de servicio: definir vueltas del 25/50/75/100%, redondeo mínimo y política explícita de escalado de desgaste/temperatura. No se han introducido porcentajes, safety car, penalizaciones, inventario limitado ni nuevo motor meteorológico. Cerrar antes los resultados de trayectoria/CI de este documento.
