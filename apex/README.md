# APEX Formula 26

Versión de desarrollo: **v0.13.12 · PRE-RELEASE**

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
