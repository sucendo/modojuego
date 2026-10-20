# APEX Formula 26 — Fase 8A — v0.14.0 PRE-RELEASE

Base comprobada: `main` en `24219c4e43eb1f4831a499983c2558fe383a8e2a` (giroscopio móvil). Implementación y pruebas numéricas preparadas para integración autorizada en `main` el 20 de octubre de 2026. **Fase pendiente de validación de navegador, conducción y FPS; la subida no certifica la fase como terminada.**

## Auditoría e integración

- Se conservan `apex.html`, 28 fragmentos, scheduler del jugador a 100 Hz, cámaras y giroscopio. No hay temporizadores nuevos.
- `part-027`: modelo bicicleta del jugador, carga aerodinámica/transferencia, saturación longitudinal y lateral, elipse de fricción. `gripFront` y `gripRear` multiplican las capacidades existentes antes de TC/ABS y de saturación. No se sustituye la suspensión, el contacto, los peraltes ni los materiales físicos existentes.
- `part-026`: rivales preexistentes híbridos Frenet/cinemáticos, con LOD de planificación. Se aplica el mismo modelo térmico/desgaste y los mismos factores de agarre a TODOS, visibles o no. Frenada, tracción y envolventes de curva utilizan su propio neumático. Se reutiliza el scheduler de IA. La planificación geométrica ya existente aporta curvatura: no se duplican geometrías SVG/JSON ni se añaden barridos de circuito.
- La IA NO ejecuta el modelo bicicleta completo del jugador. Sus demandas longitudinales se derivan de la aceleración efectiva y las laterales de velocidad/curvatura; deslizamiento de yaw/velocidad lateral y bloqueos de sus incidentes existentes. Igualdad de fórmula y parámetros, sin bonificaciones de desgaste. Esto no certifica igualdad exacta del esfuerzo entre ambos modelos ni de ritmo de carrera: requiere conducción comparada.
- `part-022` ya contiene lluvia, transición gradual y humedad acumulada. Se reutiliza sin ampliar su motor. La interfaz de neumáticos cachea aire/asfalto/lluvia/humedad a 5 Hz; el asfalto es una estimación térmica suave, no una medición. El clima existente y los errores de IA usan semillas/aleatoriedad anteriores; sólo se afirma determinismo del neumático ante las mismas entradas y condiciones.

## Estado y parámetros

`car.tyres`: esquema 1, compuesto, distancia en metros, ejes delantero/trasero con desgaste 0–1, temperatura superficial y de carcasa en °C, agarre cacheado. `apexTyreInstall` instala un juego nuevo preservando vueltas, daño y cronometraje; todavía no se llama desde boxes. `apexTyreSnapshot`/`apexTyreRestore` serializan y normalizan estados ausentes o inválidos.

Los parámetros de diseño están centralizados en `APEX_TYRE_COMPOUNDS`. No son datos oficiales de Pirelli. Salida precalentada a óptimo menos 20°C (aproximación a mantas); los juegos fríos siguen teniendo modelo funcional.

| Compuesto | Color | Pico relativo seco | Óptimo °C | Banda ±°C | Escala base desgaste km |
|---|---|---:|---:|---:|---:|
| SOFT | Rojo | 1,035 | 90 | 15 | 115 |
| MEDIUM | Amarillo | 1 | 95 | 17 | 160 |
| HARD | Blanco | 0,975 | 100 | 18 | 205 |
| INTERMEDIATE | Verde | 0,94 | 70 | 15 | 135 |
| WET | Azul | 0,88 | 60 | 14 | 115 |

La escala base NO es una duración garantizada: abrasividad, esfuerzos y calor reducen la vida efectiva. Frío y sobrecalentamiento modifican agarre de forma continua. El desgaste reduce agarre con una curva cuadrática suave; no hay umbral brusco. Humedad continua favorece intermedios en húmedo y lluvia en agua abundante. Intermedios/lluvia pagan calentamiento y desgaste extra en seco. Bloqueos y derrapes penalizan según parámetros de compuesto. Coche parado: enfría, pero distancia y desgaste permanecen en cero. No se simulan pinchazos, presión ni cuatro ruedas independientes.

## Circuitos

Los 23 SVG/JSON incrustados y el override de Madrid se auditaron con el test existente. Se conserva la geometría y la información física de curvas. Los nuevos coeficientes son estimaciones explícitas, no mediciones oficiales: geometría alimenta la carga instantánea y estos coeficientes ajustan material/estrés relativo. El identificador real `16-bahrain` corresponde a Sepang/Malasia en este calendario y se ha tratado así, no como Sakhir.

Se resuelven una vez al arrancar en `trackData.tyreProfile`. Personalizados/antiguos: 1 en todos los coeficientes. Autoría en `JSON.track.tyres`, con claves `trackAbrasion`, `trackTyreStressFront`, `trackTyreStressRear`, `trackBrakeStress`, `trackTractionStress`, `trackLateralStress`; valores válidos 0,4–2. El exportador JSON incluye los parámetros y respeta overrides. No se modificaron los SVG ni las fichas incrustadas para duplicar información.

| Circuito | Abrasión | Del. | Tras. | Frenada | Tracción | Lateral |
|---|---:|---:|---:|---:|---:|---:|
| 01-australia | 1 | 1 | 1 | 1.05 | 1.05 | 1 |
| 02-china | 1.12 | 1.12 | 1 | 1.05 | 1 | 1.12 |
| 03-japan | 1.2 | 1.15 | 1 | 0.95 | 1 | 1.2 |
| 04-miami | 0.9 | 1 | 1.05 | 1.1 | 1.1 | 0.95 |
| 05-canada | 0.85 | 0.95 | 1.1 | 1.2 | 1.18 | 0.9 |
| 06-monaco | 0.72 | 1 | 1.05 | 1.1 | 1.12 | 0.85 |
| 07-barcelona-catalunya | 1.22 | 1.15 | 1.05 | 1 | 1 | 1.2 |
| 08-austria | 1.02 | 1 | 1.12 | 1.15 | 1.15 | 0.95 |
| 09-great-britain | 1.25 | 1.12 | 1.05 | 0.9 | 0.95 | 1.25 |
| 10-belgium | 1.15 | 1.08 | 1.05 | 1.05 | 1 | 1.18 |
| 11-hungary | 1.08 | 1.12 | 1.05 | 0.95 | 1.05 | 1.15 |
| 12-netherlands | 1.18 | 1.12 | 1.08 | 0.95 | 1.05 | 1.2 |
| 13-italy | 0.82 | 0.95 | 1 | 1.2 | 1.05 | 0.85 |
| 14-spain | 1.02 | 1.08 | 1 | 1.12 | 1.1 | 1 |
| 15-azerbaijan | 0.78 | 0.95 | 1.05 | 1.15 | 1.12 | 0.82 |
| 16-bahrain | 1.18 | 1.08 | 1.12 | 1.08 | 1.12 | 1.15 |
| 17-singapore | 0.95 | 1.05 | 1.12 | 1.15 | 1.18 | 1 |
| 18-united-states | 1.2 | 1.12 | 1.08 | 1.08 | 1.05 | 1.18 |
| 19-mexico | 0.85 | 1 | 1.08 | 1.15 | 1.12 | 0.95 |
| 20-sao-paulo | 1.12 | 1.05 | 1.12 | 1.05 | 1.12 | 1.08 |
| 21-las-vegas | 0.75 | 0.95 | 1.08 | 1.15 | 1.15 | 0.85 |
| 22-qatar | 1.3 | 1.15 | 1.08 | 0.9 | 1 | 1.3 |
| 23-abu-dhabi | 0.95 | 1.02 | 1.08 | 1.08 | 1.12 | 1 |

## Interfaz y persistencia

Selección inicial para todas las sesiones en Coche y conducción, con código/color/condiciones recomendadas. Rivales: selección estable por identidad y condiciones (blando en clasificación seca; reparto S/M/H en otras sesiones secas; I/W según humedad). No se cambia compuesto automáticamente al variar el tiempo.

HUD compacto en el bloque de barras: compuesto, desgaste, temperatura. La torre muestra el compuesto real de cada piloto. Telemetría: desgaste/temperaturas de ambos ejes y estado; muestras FULL incluyen instantáneas del jugador, exportación v24 incluye estados actuales de los 22 coches y entorno. Textos en la cadencia de HUD existente; sin recreación de DOM nueva por neumático.

El guardado previo es campeonato/fines de semana/récords, NO un snapshot reanudable de carrera. Se conserva esquema 4 y migración 2/3/4. La selección se guarda en `apex26.tyre.initial.v1`; al terminar o salir se conserva `save.lastTyreSession` con estados de jugador/rivales/entorno para inspección y futura reanudación. No se reutiliza el juego usado al iniciar una sesión nueva. Recargar no reanuda una carrera en curso (misma limitación previa). Los contadores legacy de boxes no reinician el nuevo desgaste; la nueva mecánica/cambio de compuesto quedan para 8B.

## Validación local

Resultados reproducibles en `tests/results/phase8a/`:

- `node apex/tests/tyres-audit.cjs`: **16 grupos aprobados**. Cinco compuestos, tanda prolongada, abrasión, sobrecalentamiento, frío/calor progresivo, humedad, WET en seco, bloqueos/derrapes, fórmula común, determinismo y subpasos, normalización y roundtrip, estados finitos, 23 perfiles, continuidad del desgaste, instalación sin reinicio y migraciones de guardado reales 2/3/4. Compila todos los scripts del HTML ensamblado.
- `node apex/tests/driving-audit.cjs --json`: **14 grupos aprobados** sobre fuerzas/entradas/scheduler de producción. Nueva prueba confirma que el estado altera fuerza de frenada y lateral reales. La prueba histórica con neumáticos ausentes conserva compatibilidad; no es una prueba de una carrera completa. El guard de IA sólo admite el cambio previsto de coeficiente de agarre.
- `node apex/tests/render-audit.cjs`: aprobado, incluyendo geometría/pipeline/terreno/carretera de fase 6.
- `node apex/tests/terrain-selection-audit.cjs`: aprobado.
- `node apex/tests/auto-boundary-audit.cjs`: aprobado.
- `python apex/tests/circuit-assets-audit.py --json`: aprobado, 23 pares incrustados y override de Madrid.
- Sintaxis de runners/hooks de navegador y `git diff --check`: aprobado.

Rendimiento: el benchmark aislado adicional de neumáticos para 22 coches a 100 Hz tarda aproximadamente 810 ms por 100 segundos simulados en este entorno. Es coste incremental del subsistema, NO FPS. El benchmark de física histórica antes/después queda en `driving.json`; usa referencia histórica v0.13.22 y no puede interpretarse como comparación de FPS de 8A.

## Pendientes y límites para cerrar 8A

1. Ejecutar el runner Chromium ampliado (escritorio/móvil emulado, cámaras/controles, 22 estados finitos, HUD y migraciones). Se añadió a la integración existente y el modelo numérico a CI, pero no se ha ejecutado: este entorno no tiene Chromium y su descarga devuelve un archivo inválido.
2. Comparar FPS/frame time/IA antes y después del main base, mismos ajustes/circuito/22 coches, especialmente Madrid cargado y móvil horizontal. No se ha medido ni certificado ausencia de regresión de FPS.
3. Validar visualmente selección, HUD/telémetría y conducción real; revisar temperatura de equilibrio, vida de tandas y ritmo IA frente al jugador. Los tests sintéticos no sustituyen esta revisión.
4. La autorización explícita del usuario permite integrar en `main`. La revisión inicial de autorización queda resuelta; comprobar los resultados de CI del commit publicado antes de certificar navegador y rendimiento.

## Fase 8B recomendada

Tras cerrar las validaciones anteriores: selección del siguiente compuesto, entrada/servicio/salida de boxes y llamada a `apexTyreInstall` únicamente al completar el cambio real, conservando posición, daño y cronometraje. Después introducir distancias 25/50/75/100% y decidir explícitamente si el desgaste se escala con la duración. Sin mecánicos animados, safety car o motor meteorológico nuevo en este bloque.
