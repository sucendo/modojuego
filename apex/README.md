# APEX Formula 26

Versión de desarrollo: **v0.13.19 · PRE-RELEASE**

Archivo fuente original:
`Apex_Formula_26_v5_230_62_8_6_7_6_4_17_CONTROL_CLASICO_GP4.html`

SHA-256 del HTML histórico (conservado como referencia):
`43753514205fac232d9b8c1d18765b712e61f4561ddb1388d764874df3b87384`

La versión web se reconstruye en el navegador desde los fragmentos exactos de `parts/` para evitar el límite de tamaño del conector de GitHub.

## Sistema visual v0.12.0

El mismo catálogo de 3 chasis (`A26`, `VXR`, `NOVA`) y 11 identidades APEX alimenta rivales WebGL y cockpit del jugador. En WebGL se mantienen coches 3D con 360° de giro, tres niveles de detalle, paneles de livery originales y detalles aerodinámicos. Los 16 ángulos de las láminas se conservan como referencias de validación, **no** como un atlas PNG instalado. El backend Canvas sigue siendo un fallback de tres orientaciones.

Pruebas de consola dentro del simulador: `apexCarVisualAudit()` y `apexCarVisualPipelineSelfTest()`.

## Geometría de coches v0.12.1

En el renderer WebGL2 los coches cercanos reciben morro alineado al alerón, pontones ampliados a proporciones coherentes, entradas laterales, fondo con deflectores, flaps, tirantes de suspensión inclinados, halo y difusor. Los LOD 0 y 1 siguen simplificados para móviles y parrillas de 22 vehículos. No se han modificado física, colisiones, IA ni los circuitos. Diagnóstico en consola: `apexCarGeometryV0121SelfTest()`.

## Referencias angulares v0.12.2

Render WebGL continuo y 16 referencias por coche; metadatos `viewIndex16`, `refAngle16`, `refAngle16Label`. Validaciones: `apexCarVisualAuditV0122()`, `apexCarAngleContinuityTest()`, `apexCarPerspectiveSymmetryTest()`, `apexCarAngleReferenceTable()`. Es una auditoría geométrica; las capturas WebGL y FPS siguen pendientes de validación manual.

## v0.13.0 · Chasis común jugador/rivales

WebGL dibuja morro, ala, ruedas y suspensiones del jugador utilizando la misma rutina geométrica `webglPushApexFrontAssembly()` que los rivales. El cockpit SVG mantiene el habitáculo, volante, espejos y controles; la vista Canvas conserva el gráfico anterior como respaldo. Colores y chasis se leen del catálogo compartido. Diagnóstico en consola: `apexPlayerSharedCarAudit()`. No se ha añadido una cámara exterior jugable ni se han cambiado física o colisiones. Pendiente inspección visual y FPS en dispositivos reales.

## v0.13.1 · Refinado de onboard

Corregida la llanta con anillo fino del compuesto en lugar de pintar el disco; neumático cilíndrico con bandas y radios, alerón delantero multielemento menos plano, tres tirantes inclinados de suspensión, morro mejor perfilado y menos piezas superpuestas. Cámara del jugador ligeramente más retrasada, pilar del halo adelgazado e integración de sombras del monocasco. Los 11 equipos mantienen sus colores y variantes; física, IA, circuitos y guardados sin cambios. Prueba geométrica: `apexOnboardV0131Audit()`. Requiere comprobación visual y de FPS en carrera.

## v0.13.2 · Cámaras

C activa CAM (piloto) → TV (cámara superior) → EXT (persecución elevada). También hay botón CAM en pantalla y acción en el menú Conducción. La cámara seleccionada se guarda en `apex26.camera.mode.v1`. Las cámaras externas sólo operan en WebGL2; Canvas conserva cockpit. Las cámaras del inspector no se modifican. Diagnóstico: `apexCameraRigSelfTest()`.

## v0.13.3 · Rendimiento de circuitos SVG complejos

A partir de esta versión, los muros estáticos importados se indexan en celdas espaciales de 192 m al compilar un circuito: las cámaras solo evalúan la región potencialmente visible, sin suprimir muros. La clasificación de celdas de terreno y la influencia de bocas de túnel quedan cacheadas por malla; los árboles de masas forestales usan descarte por esfera conservadora. No se modifican geometría SVG, JSON, hitboxes, IA, controles ni las tres cámaras. Diagnósticos en consola: `apexHeavyCircuitPerfDiagnostics()` y `apexExactWallSpatialDiagnostics()`. Validar visualmente el Madrid guardado e inspección 3D, además de medir FPS antes y después.

## v0.13.4 — Conducción fluida con circuitos cargados

Culling conservador de muros antes de proyectar vallas; selección espacial más cercana; cotas volumétricas para edificios fuera de cámara; presupuesto de escena reutilizado por fotograma; retrovisores con frecuencia adaptativa; corrección de la clave de caché en terreno a varias resoluciones. Sin modificaciones a física de 100 Hz, controles, circuitos, 3 cámaras ni guardados. Diagnóstico: apexPerformanceSummary(), renderProfilerSnapshot() y apexStaticOcclusionStatsSnapshot().

## v0.13.5 · Antitirones por resolución adaptativa

Cuando los FPS caen de forma sostenida, APEX reduce la resolución **interna** de WebGL/Canvas hasta 62%, sin alterar el tamaño visible, la física de 100 Hz, las colisiones o los guardados. Recupera calidad gradualmente cuando vuelve a ir fluido. Se refuerza el LOD lejano en PC. Función de diagnóstico: `apexDrivePerformanceDiagnostics()`.

## Cámara trasera EXT v0.13.6

La cámara está anclada al chasis: 5,7 m detrás y 2,88 m sobre la superficie. Se ha eliminado la interpolación en coordenadas del mundo que generaba una oscilación longitudinal y un salto tras fotogramas lentos. La geometría compartida del coche, física, IA, cronometraje y modos PILOTO/TV permanecen intactos. WebGL utiliza una única instantánea de cámara por fotograma.

Auditoría: `apexCameraRigSelfTest()` (6 casos sintéticos de posición y altura) y `apexChaseCameraDiagnostics()` (en carrera con EXT seleccionada).

## v0.13.7 — rendimiento en circuitos SVG completos

- Las vallas F1 exactas se dibujan una sola vez en WebGL2: se elimina el segundo dibujo duplicado, conservando el muro y la malla detallada.
- La malla de las vallas utiliza el índice espacial ya compilado y descarta los muros fuera del campo visual antes de proyectar todos los postes/hilos.
- Se evita preparar geometría de vallado redundante en la colección de muros WebGL, preservando Canvas2D.
- `apexHeavyCircuitPerfDiagnostics()` incorpora `wallPassMs`, `fencePassMs`, `fenceSourceSegments`, `fenceCandidates`, `fenceProjected`, `fenceDrawn` para medir Madrid cargado. Consultar también `apexPerformanceSummary()`.
- No se alteran JSON/SVG, simulación 100 Hz, IA, cámaras ni cronometraje.

## v0.13.8 — fluidez del escenario completo de Madrid

Se cachean las alturas de terreno y los recortes de bandas de gradas y edificios estáticos, sin cambiar la geometría de SVG ni la simulación. El presupuesto de LOD aplica 300 ms de persistencia para reducir detalle y 1400 ms para recuperarlo, evitando oscilaciones rápidas. Los ajustes automáticos de resolución requieren más muestras y dejan 10 s entre redimensiones para evitar tirones de reasignación del lienzo. Los diagnósticos disponibles incluyen `apexSceneryStaticCacheDiagnostics()`, `apexHeavyCircuitPerfDiagnostics()`, `apexDrivePerformanceDiagnostics()` y `apexPerformanceSummary()`. Queda pendiente medir los FPS reales con el modelo guardado de Madrid; no se cambia la física, IA, cámaras, cronometraje ni guardados.

## v0.13.9 — superficies SVG y apoyo en peraltes (fase 1)

- Los contornos SVG cóncavos de escapatoria y marcas se triangulan al compilar, en lugar de rellenarse como un abanico que invade el asfalto.
- Las marcas CROSSWALK/URBAN_STRIPES dejan de dibujarse como un bloque sólido cuando su polígono tiene longitud transversal suficiente; se rellenan con franjas recortadas dentro del contorno SVG.
- Las marcas rodables próximas a pista usan la cota de la superficie de conducción, no la del terreno natural. El resto conserva su altura original.
- El modelo WebGL del coche del jugador orienta su pendiente lateral conforme al signo real del peralte y a la dirección del monoplaza; no altera física ni colisiones.
- Prueba manual pendiente: los 6 puntos de las capturas de Madrid, particularmente transición pista–escapatoria, salida de túnel y pitlane. Esta fase no certifica esos tres puntos como solucionados; necesitan validación visual sobre el SVG guardado concreto y ajustes del cosido de superficies.
- Prueba de regresión matemática de polígono cóncavo incluida en validación de despliegue. Diagnóstico: `apexPlayerBankAlignmentDiagnostics()`.

## v0.13.10 — pianos SVG autoritativos: un único render

- `curb-left` y `curb-right` del SVG continúan definiendo las zonas de piano `curbZones`, pero **sus polígonos no se pintan como un parche de suelo** en Canvas2D ni WebGL2.
- La franja visible la generan exclusivamente `drawRoadSegment` y `webglPushRoadSegment` con las mismas cotas, anchura, peralte y colores del render estándar de APEX.
- Los datos de geometría SVG y la exportación permanecen editables; se mantiene y corrige el rol de curbs en exportaciones antiguas sin `sourceRole`.
- Las cargas antiguas con marcadores de curb pero sin `curbZones` recuperan las zonas desde los puntos SVG al preparar el circuito.
- Se omite la compilación de superficies visuales para los marcadores de piano y se excluyen de las colas de escenarios, eliminando la gran mancha roja duplicada y reduciendo trabajo.
- Autoprueba de metadatos y ausencia de duplicación visible: `apexCurbAuthoringAudit()` desde la consola con un circuito cargado. No se alteran las físicas, el trazado, los muros, el cronometraje ni las escapatorias.

## v0.13.11 — Escapatorias, cebreados y bordes de pista

- **Escapatorias SVG:** triangulación de superficies cóncavas y recorte geométrico, compilado una sola vez, contra la banda real de asfalto + pianos mediante un índice espacial de triángulos. Evita que el relleno independiente invada o tape la pista. Incluso los polígonos degenerados ya no vuelven al relleno en abanico sobre la calzada. Canvas2D y WebGL2 utilizan las mismas mallas visibles; se conservan los datos SVG originales. El recorrido y los muros no se modifican.
- **Pasos de cebra:** las franjas se distribuyen sobre el eje longitudinal local de la pista, de modo que cada franja cruza perpendicularmente el asfalto, no según la orientación del contorno SVG. Los cebreados urbanos lejanos conservan orientación propia. Eliminadas las rayas dibujadas en coordenadas de pantalla en Canvas2D.
- **Bordes:** se elimina el desnivel artificial de 0,02 m entre borde de pista y comienzo del piano/escapatoria. Los triángulos de escapatoria recortados próximos al límite de la cinta heredan la altura del borde físico con 0,042 m de separación para evitar z-fighting.
- **Vegetación:** follaje de árboles oscurecido respecto al césped en WebGL2 y Canvas2D, incluidas importaciones SVG, con tonalidad de bosque base más profunda.
- **Caché:** revisión de compilación 230683, que impide reutilizar superficies estáticas de geometría previa. El coste de recorte es durante la carga, no por fotograma.
- **Auditoría:** `apexRunoffClipDiagnostics()` informa del tamaño de la geometría recortada. Se han probado sintaxis de funciones y casos geométricos aislados; queda inspección visual con el SVG/JSON completo de Madrid y verificación de FPS.

No se modifica el sistema de físicas, el coche, la IA, el cronometraje ni los 23 circuitos de origen.

## v0.13.12 — bordes y color de vegetación

La escapatoria recortada se une a la rasante/peralte de la pista con una transición lateral suave y una separación de profundidad ligeramente mayor para evitar que tape el asfalto. La orientación perpendicular de las franjas del cebreado se preserva mediante el cálculo actual de la tangente local de pista en X/Z; no se introducen rayas referidas a la pantalla. Se oscurece el verde de la zona forestal frente al de la hierba, sin alterar colores SVG explícitos. Se conservan el nivel de detalle, las cachés de terreno, el circuito, las físicas y los guardados. Validación visual con el Madrid completo pendiente.


### Afinado de rendimiento en la llegada a meta (v0.13.12)

- **Causa potencial identificada:** se reproyectaban cada fotograma todos los triángulos de una superficie SVG grande, incluso aquellos fuera del campo de visión. El índice por sectores descartaba objetos completos, pero no triángulos individuales dentro de una escapatoria extensa.
- **Solución:** cada triángulo recortado recibe una cota esférica al compilar el circuito. WebGL descarta fuera de cámara antes de transformar/proyectar sus tres vértices, respetando la malla y cotas originales. Canvas2D no se modifica.
- **Calentamiento de meta:** el warmup previo incluye vistas a unos 320 y 105 m antes de la línea de meta, además de los puntos del circuito existentes, para adelantar la primera reserva de buffer WebGL en áreas densas.
- **Diagnóstico en vivo:** `apexHeavyCircuitPerfDiagnostics()` informa de `landmarkPassMs`, `surfacePassMs`, `surfaceTrianglesTotal`, `surfaceTrianglesCulled`, `surfaceTrianglesSubmitted` y `landmarkCandidates`. Comparar también `renderProfilerSnapshot()` y `apexStaticBatchStatsSnapshot().bufferGrows`.
- **Validación:** sintaxis de las funciones modificadas y culling geométrico aislado comprobados. Sigue pendiente un perfil real de la recta final con el Madrid SVG almacenado en el navegador del usuario; no se afirma todavía que el tirón haya desaparecido.

## Apoyo visual del coche sobre escapatorias SVG

La cámara (piloto, T-CAM y externa), el coche 3D, los retrovisores y la telemetría ahora comparten `playerDriveSurfacePose()`. Sobre asfalto y piano mantienen `trackSurfacePoseAt()`. Fuera del piano se muestrea la altura y pendiente interpoladas del **mismo triángulo SVG** que se envía a WebGL (tras recortar la escapatoria); sin malla, se usa la explanación horizontal y, más lejos, el terreno. El pitlane exacto conserva prioridad.

Al compilar el circuito, `apexBuildRunoffDriveSurfaceIndex()` agrupa triángulos de escapatoria en celdas de 48 m: no se recorren miles de polígonos por fotograma. La caché de pose se invalida al cambiar la posición, la red pista/pitlane o recompilar la malla. No se modifican trazado, colisiones, agarre, guardados ni física de conducción.

En la consola, `apexVehicleSurfaceDiagnostics()` muestra `source` (`TRACK`, `PIT`, `SVG_RUNOFF`, `ROAD_RUNOFF` o `TERRAIN`), `playerY`, `roadY`, el desnivel entre ambos y las estadísticas del índice. Verificados sintaxis y casos sintéticos de triangulación, superposición, pista, explanación y terreno; **queda pendiente probar con el SVG/JSON de Madrid cargado en el navegador** para comprobar contacto visual y FPS reales.

## v0.13.13 — corrección de aparición de terreno SVG y vallas en móvil

- **Hallazgo tras el vídeo de Madrid:** la selección del escenario estaba vinculada al sector del `anchor.s` y al LOD de objeto, incluso para huellas SVG muy extensas. En móvil el rango adaptativo era menor y podía eliminar partes del suelo antes de que salieran de cámara. El recorte por triángulos no podía corregir una zona ya descartada por su ancla.
- **Solución:** nuevo índice espacial por caja X/Z de cada `surfaceZone`, `water`, `marking` y `forestZone`, elaborado durante la compilación en celdas de 256 m. La selección próxima utiliza la posición real del coche y una sobrecobertura para evitar pérdidas al cruzar celdas. Es independiente del sector de origen SVG. Se conservan los índices por sectores para decorados y estructuras no rodables.
- **WebGL:** las superficies seleccionadas no se descartan por distancia a su ancla ni por LOD=3; sólo se excluyen sus triángulos fuera de vista o del alcance visual. En móvil se limita prudentemente la distancia de dichos triángulos a 1450 m; en PC, 2100 m. Los datos SVG, la malla exacta y la altura de apoyo del coche permanecen intactos.
- **Vallas en móvil:** postes, pasamanos y coronaciones se mantienen, pero diagonales y alambres secundarios lejanos se omiten. Distancia de estructura de valla 650 m (820 m en PC); malla de detalle sólo visible a corta/media distancia, sin afectar colisión de muros ni seguridad física.
- **Diagnóstico:** `apexGroundSurfaceSpatialDiagnostics()`, `apexHeavyCircuitPerfDiagnostics()`, `apexDrivePerformanceDiagnostics()`.
- **Pruebas realizadas:** sintaxis de las rutinas modificadas y prueba aislada de una huella SVG larga con ancla en un sector distante, que ahora sigue seleccionada cuando el coche está sobre su geometría. **Sin medida real de FPS/temperatura del móvil ni prueba interactiva con la partida de Madrid del vídeo.**

## v0.13.14 — Fase 1 de unificación: escapatoria SVG prioritaria

- En WebGL2 y Canvas2D, las franjas de escapatoria automática sólo se pintan donde **no** existan triángulos válidos de `surfaceZone` SVG. Cuando un SVG ocupa una porción de la franja, se recorta exactamente esa porción, sin suprimir el resto ni alterar pista y pianos. Se utiliza la malla SVG triangulada **después** del recorte de asfalto existente.
- Se aplica también al suelo de respaldo junto a la cámara y a la vista del inspector. Cuando hay recorte, se omite el detalle decorativo genérico del tramo en WebGL para evitar segundas capas sobre el SVG.
- El recorte de las franjas utiliza el índice de triángulos de 48 m compilado junto al circuito; los recortes de segmentos de geometría estable se cachean (máximo 1024). Sin `surfaceZone` compilada se conserva la ruta de renderizado anterior.
- No cambia la geometría de los 23 circuitos, la altura, los materiales de física, ni el guardado o la importación SVG/JSON. **Este es sólo el paso 1**, no todavía la malla continua de terreno de fases siguientes.
- Diagnóstico de consola con circuito cargado: `apexRunoffFallbackMaskDiagnostics()`. Validadas sintaxis de las seis funciones de dibujo y recorte y pruebas geométricas aisladas: superposición parcial, total, ausencia de superposición, un lateral intacto y reutilización de caché. **Pendiente** revisión visual con el Madrid completo y medición de FPS en móvil.

## v0.13.14 — hotfix de rendimiento del recorte de escapatorias

- **Regresión identificada:** `apexGenericRunoffMaskedPolys` guardaba únicamente los recortes positivos. Cuando NO existía coincidencia con una `surfaceZone`, repetía en todos los fotogramas la búsqueda de celdas, construcción de triángulos, intersección y resta poligonal. Ese caso negativo es precisamente el más habitual en tramos largos, especialmente en Madrid.
- **Solución:** memoización completa por tramo y lateral, incluyendo `null` (sin recorte), con retención de hasta 2048 tramos y poda gradual de 256 entradas; el caché pertenece al índice de geometría del circuito y se renueva con él. Diagnóstico `apexRunoffFallbackMaskDiagnostics()`: `cacheHits`, `unmaskedCached`, `masksComputed`.
- **Triángulos enormes:** un índice secundario de celdas de 384 m evita examinar globalmente todos los triángulos descartados del índice fino de 48 m. Se comparte con el apoyo del monoplaza, sin modificar su interpolación en altura.
- **Regresión aislada:** máscaras parciales, coincidencias ausentes, repetición de consulta negativa/positiva, triángulo gigante y consulta de altura. 30.000 consultas repetidas a tramos precalculados produjeron **cero** reconstrucciones de máscara. Esta prueba no es una medida de FPS del navegador ni garantiza por sí sola 30/60 FPS en el dispositivo.
- Conserva la sustitución geométrica exacta del paso 1 y no altera materiales, trazado, SVG originales, modelos ni física.

## v0.13.15 — Fase 2: consulta de terreno unificada

- `apexUnifiedSurfaceAtWorld(x,z,opts)` resuelve de forma única **cota, pendiente, normal, fuente, material y agarre**. La prioridad es PIT activo, asfalto/piano, escapatoria SVG triangulada, explanación lateral y terreno natural. La cota SVG es la de los triángulos de `surfaceZone` que ya utiliza el renderizado de la fase 1 (sin nueva malla o decal).
- `playerDriveSurfacePose()` comparte el resultado con `playerSurfaceState()` (física, cámaras, ruedas y telemetría); caché por posición, progreso, red PIT y referencias de los índices compilados. La simulación a 100 Hz no debe repetir el muestreo geométrico si esos datos no cambian.
- Material `surfaceKind` conservado por triángulo en el índice visual SVG; los recintos antiguos y el agua siguen accesibles mediante un índice X/Z de 128 m con la misma prioridad inversa del importador original, sin barrido global por consulta.
- Las reglas de agarre `TRACK`, `KERB`, `RUNOFF`, `PIT`, `WATER`, `OFF` y límites de `drivableArea` conservan sus coeficientes anteriores. No se ha modificado la conducción ni el formato de guardados.
- Diagnóstico: `apexUnifiedSurfaceDiagnostics()` bajo el coche; `apexUnifiedSurfaceDiagnostics(x,z)` para un punto del mundo. Devuelve `source`, `material`, `y`, `normal` y `grip`.
- Pruebas aisladas de integración: asfalto, piano, grava SVG, escapatoria de respaldo, agua, terreno, PIT y consulta repetida desde la física; 200 consultas repitieron **un único acceso** a la malla cuando la posición no cambió. **Pendiente** validación visual con Madrid y pruebas de regresión reales en los otros 22 circuitos.
- **Alcance:** esta fase unifica la *consulta física/visual*; todavía no fusiona toda la malla longitudinal del terreno en un solo buffer. La malla renderizada y su optimización estructural corresponden a la fase siguiente.

## v0.13.16 — Fase 3: geometría y render de suelo unificados

**Objetivo:** evitar que carretera, escapatoria SVG y terreno compitan como láminas superpuestas, y reutilizar el recorte geométrico sin empeorar el coste por fotograma.

- **Atlas de propiedad del suelo** (`apexBuildUnifiedGroundAtlas`): reutiliza el índice de triángulos SVG, la placa de relieve y paquetes cacheados por tramo. La geometría SVG sigue intacta; ningún rectángulo genérico tapa una escapatoria importada.
- **Pasada compartida Canvas/WebGL** (`apexUnifiedGroundDrawCorridor`): asfalto + pianos + escapatoria de respaldo se construyen/dibujan desde la misma referencia de bordes; conserva sombreado, pintura de frenada, agua, meteorología y marcadores posteriores. Se elimina la antigua rutina redundante de escapatoria.
- **Propiedad del suelo importado** (`apexRenderUnifiedAuthoredGround`): las `surfaceZone` trianguladas salen del bucle de decorado y se dibujan **una sola vez** tras el terreno y antes del asfalto. Visibilidad y descarte siguen siendo por triángulo, con límites adaptados a móvil/PC.
- **Relieve recortado realmente** (`apexUnifiedTerrainCellPieces`): tanto las zonas finas de la malla SVG como las celdas gruesas eliminan las porciones ocupadas por las escapatorias importadas; los resultados se cachean. Se aplica al inspector 3D.
- **Optimización móvil:** compilación cooperativa de hasta 1300 celdas próximas a escapatorias SVG, incluyendo sus celdas LOD de 2×2; cede control al navegador aproximadamente cada 12 ms durante la carga. Los restantes recortes se memoizan al visitarlos. Sin `surfaceZone`, se evita almacenar paquetes adicionales.
- **Caché persistente:** revisión del compilador elevada a `230684` para regenerar el relieve fino de los circuitos modificados, sin alterar el esquema de guardado de partidas ni el formato de circuitos.
- **Diagnóstico:** `apexUnifiedGroundAtlasDiagnostics()`, `apexRunoffFallbackMaskDiagnostics()`, `apexUnifiedSurfaceDiagnostics()` y `apexHeavyCircuitPerfDiagnostics()`.
- **Pruebas aisladas:** verificadas sintaxis de doce rutinas, conservación de 56 m² en una superficie de 64 m² con 8 m² de SVG, reutilización de paquetes comunes Canvas/WebGL, y precálculo de celdas con máscara total (20 celdas de prueba). **Falta** medir FPS reales con el circuito SVG completo de Madrid en móvil y validar visualmente los otros 22 circuitos.

**Límite de esta fase:** unifica la propiedad/recorte y las pasadas de dibujo del corredor y las zonas de suelo, pero no transforma aún todas las superficies procedurales lejanas y el escenario completo en una única malla/buffer WebGL.


## v0.13.17 — Fase 4: optimizacion estructural del render del suelo

**Implementado sobre la fase 3, sin alterar los SVG/JSON ni las físicas:**

- **LOD con ocupacion exacta:** mascara integral de la placa de relieve para descartar celdas sin terreno **antes** de llamar a `worldToCamera`. Los bloques 2x2 mixtos se desdoblan a resolucion 1x1 para no extender el suelo sobre huecos o limites de la base SVG. El recorte contra escapatorias sigue siendo el de la fase 3.
- **Malla por paquetes reutilizables:** `apexPhase4TerrainPacket` cachea las cuatro esquinas y alturas originales de cada celda o bloque de LOD, limitado a 2048 paquetes por circuito. La camara sigue proyectando estos vertices por fotograma; no se recompone su geometria estatica.
- **Grupos de triangulos SVG:** cada `surfaceZone` con 12 o mas triangulos genera grupos de hasta 24 triangulos y una esfera envolvente durante la compilacion. Fuera de vista, se omite el grupo completo sin proyectar ni comprobar uno a uno sus triangulos. Se mantiene el orden de las superficies y el descarte fino por triangulo.
- **WebGL2:** ruta rapida para poligonos ya enteramente delante del plano cercano (no ejecuta clipping innecesario). Terreno y asfalto reutilizan la misma lista ordenada por profundidad en un frame. **No se introduce una segunda pasada GPU ni se multiplican los draw calls:** el backend ya realizaba un unico `gl.drawArrays` para la escena.
- **Carga inicial del simulador:** `apex.html` descarga hasta cuatro fragmentos simultaneamente, ensambla las 28 partes en su orden original y evita las concatenaciones sucesivas de varios MB. No altera el HTML de juego reconstruido.
- **Instrumentacion:** `apexPhase4GroundDiagnostics()`, `apexUnifiedGroundAtlasDiagnostics()`, `apexHeavyCircuitPerfDiagnostics()` y `renderProfilerSnapshot()`. Autoprueba sin circuito: `apexPhase4GroundSelfTest()`.
- **Comprobaciones técnicas:** analisis sintactico de las funciones modificadas; prueba aislada de conservacion de mascara en 1x1 y 2x2 y reutilizacion de los vertices en cache. Autoprueba de mascara y alturas completada; verificado que el culling jerarquico omite dos triangulos invisibles de 26 y conserva los 24 visibles, con fallback de 26/26 al no existir grupos. El render no se ha ejecutado ni medido en un movil fisico.

**Validacion pendiente antes de darla por homologada:** ejecutar Madrid con su SVG/JSON completo en movil y PC, anotar FPS y `renderProfilerSnapshot()` en la recta de meta, las escapatorias y el tunel, y realizar una regresion visual en los otros 22 circuitos. No se prometen 60 FPS ni una ganancia porcentual sin mediciones reales.

**Limite tecnico:** esta fase consolida paquetes CPU e indices de visibilidad y evita reconstrucciones/recortes innecesarios. La migracion de *todas* las superficies lejanas a VBOs de geometria de mundo estaticos proyectados en GPU requeriria una arquitectura de shader distinta; no se presenta como realizada.


## v0.13.18 — Fase 5, primera migración GPU del suelo SVG

**Implementación real, aún pendiente de validación de FPS con Madrid en navegador móvil.**

- Las superficies `surfaceZone` SVG trianguladas se empaquetan UNA VEZ en `Float32Array` y se cargan en un VBO `STATIC_DRAW` independiente. La compilación se realiza al primer render WebGL (el calentamiento de carrera lo ejecuta antes de empezar). El índice y las alturas del SVG no se modifican.
- Un shader WebGL2 transforma coordenadas de mundo utilizando la cámara, FOV, altura del ojo, horizonte, inclinación, balanceo y profundidad de APEX. La proyección deja de reconstruirse por triángulo y fotograma en JavaScript para estas superficies.
- Se agrupa la geometría por lotes de 192 triángulos (móvil) / 256 (PC) y se descartan lotes no visibles por cota esférica. No se suben de nuevo al GPU en cada frame.
- El dibujo WebGL dinámico se separa en dos rangos de **un mismo buffer y una única actualización**: antes del suelo SVG y después. El VBO estático se intercala en su lugar original, compartiendo z-buffer y preservando el orden de transparencia/escapatorias/pista/pianos/coches.
- Fallback completo al dibujado CPU anterior para Canvas2D, WebGL no disponible, superficies con alfa, escenas pequeñas, límite de VRAM (16 MiB móvil / 48 MiB PC para estos triángulos) o error de shader. Si falla la GPU, se evita reintentar indefinidamente en ese contexto. La memoria del VBO se libera al cambiar de atlas.
- Diagnóstico de consola: `apexPhase5GpuDiagnostics()` proporciona `resident`, `bytes`, `triangles`, `chunks`, `visibleTriangles`, `drawCalls`, `culledChunks`, `compiled`, `failures`.
- Validación aislada: shader/proyección contrastados algebraicamente con la ruta original (error numérico inferior a 1e-9 en NDC en muestra sintética); VBO subido una sola vez en llamadas consecutivas; render comprobado en secuencia `dinámico → estático → dinámico`, conservando los dos rangos y la telemetría de triángulos. **No se ha podido ejecutar aún una prueba visual/FPS real del circuito completo en Chrome móvil.**

**Alcance pendiente de fase 5:** terreno de placas y malla longitudinal de asfalto/pianos todavía utilizan parte de la proyección por CPU. Su migración a geometría GPU estática necesita el mismo tratamiento de recortes, túneles, editor, sectores, LOD y compatibilidad. Esta entrega NO afirma que toda la escena use VBOs estáticos ni que hayan desaparecido los tirones de Madrid.


## v0.13.19 — Fase 5, segunda migración: terreno de placas en GPU

**Meta:** reducir las proyecciones en JavaScript del relieve normal de Madrid y circuitos con `terrainBase`, sin sustituir geometrías de túneles ni introducir planos superpuestos.

- **Ruta WebGL estática para celdas ordinarias:** `webglPushTerrainPlateMesh` separa las celdas gruesas de las celdas estructurales. Las primeras se convierten a triángulos en coordenadas de mundo y se envían mediante un VBO `STATIC_DRAW`; las celdas detalladas de pista, portales y túneles conservan el render exacto original.
- **Superficies conservadas:** el mismo recorte `apexUnifiedTerrainCellPieces` determina qué porciones del terreno dejan sitio a escapatorias SVG. No se cambia el relieve, los valores del grid, los JSON/SVG ni el guardado.
- **LOD intacto:** selección original de celdas 1×1/2×2, presupuesto móvil, límites del polígono y frustum. Las celdas próximas al ojo permanecen en la ruta CPU para mantener el recorte cercano.
- **Caché doble:** paquetes `Float32Array` por celda (hasta 3072) para evitar retriangulaciones, más un VBO por conjunto de celdas visibles. El orden de compilación es espacial y no cambia por la orientación de la cámara; un giro que conserve el conjunto reutiliza el buffer sin transferencia.
- **Composición de profundidad:** el envío WebGL intercalado conserva el orden de escena: decorado inicial → terreno detallado → terreno GPU → resto del entorno → escapatorias SVG GPU → pista, pianos y coches. Los vértices dinámicos se transfieren una sola vez por fotograma; las dos mallas estáticas usan el mismo depth buffer.
- **Compatibilidad y fallos:** la ruta Canvas2D, los modos de inspección y los circuitos sin placa siguen utilizando el trazado anterior. Si no hay GPU o falla la creación del buffer/shader, las celdas omitidas se proyectan por CPU en el mismo fotograma. No se intenta recompilar indefinidamente en un contexto fallido. Presupuesto de VBO por vista: 8 MiB móvil y 24 MiB escritorio.
- **Diagnóstico:** `apexPhase5TerrainDiagnostics()` muestra `resident`, `bytes`, `triangles`, `gpuCells`, `uploads`, `reuses`, `packets`, `packetHits`, `packetMisses`, `failures`; complementarlo con `apexPerformanceSummary()` y `apexPhase5GpuDiagnostics()`.
- **Pruebas aisladas:** compilación sintáctica del bloque GPU; carga única para una selección estable, cambio de orden sin nueva subida, reutilización de tres paquetes entre selecciones; comprobación del orden de pasadas dinámico → terreno GPU → dinámico → SVG GPU → dinámico y sus contadores de triángulos.

**Pendiente de homologación:** verificar visualmente el Madrid SVG/JSON completo (túneles, alturas, escapatorias, bordes, cámara) y medir FPS/tirones en PC y móvil. La migración de la cinta longitudinal de asfalto/pianos y otros decorados estructurales NO está incluida en esta entrega. No se afirma un porcentaje de mejora sin perfilado real.
