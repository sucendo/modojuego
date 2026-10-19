# APEX v0.13.22 — Fase 6, base de asfalto y pianos en GPU

Base: `main` en `ef8ce60249ccfef28d97d16650bf6e94eaa62b01`. Versión `v0.13.22 · PRE-RELEASE`, build `2026.10.20.02`.

## Resultado y límites de la evidencia

Se completa una etapa funcional de migración de **las bases opacas** de asfalto y pianos a vértices estáticos de mundo, con selección indexada reutilizable. Se conservan los 28 fragmentos, la geometría SVG/JSON, Canvas2D y la simulación a 100 Hz. No se migra todo el escenario ni se modifican física, IA, controles, cronometraje o formatos persistentes.

Las regresiones de producción aisladas, la comparación geométrica y la auditoría de fuentes de los 23 circuitos más Madrid detallado están aprobadas. **No hay FPS ni p95/p99 de navegador medidos en esta entrega.** Se intentó ejecutar Chrome con Playwright y volvió a abortar antes de abrir una página: `socket() failed: Operation not permitted`. Tampoco se ha probado Android físico. La confirmación del usuario sobre la fluidez de v0.13.21 se conserva como observación, no como benchmark numérico.

## Hallazgos y decisión de implementación

Después de la caché de nodos de v0.13.21, `apexUnifiedGroundDrawCorridor` aún construía los tres quads de asfalto y hasta dos de piano, los proyectaba a pantalla y enviaba 7 floats por vértice cada frame. Sus posiciones son inmutables; los colores no: dependen de distancia, alternancia, paleta, clima y configuración importada.

Por eso esta fase separa **posiciones estáticas** y **selección/material actual**. No congela el color del asfalto ni intenta convertir el suelo en un plano. El caso sintético confirma el tráfico evitado; no permite afirmar que la pista siga dominando la CPU del Madrid real. Se necesita el perfil real para establecer la siguiente prioridad entre decorado, composición, retrovisores y otros sistemas.

## Arquitectura implementada

- `apexRoadWorldNode`: extrae el paquete inmutable que ya utilizaba `apexWebglRoadStep`. Este último mantiene las siete transformaciones necesarias para la selección y las rutas CPU restantes. No se afirma que toda la pista haya dejado de usar CPU.
- `apexPhase6CompileRoadMesh`: se ejecuta durante la carga, cooperativamente, con cesiones aproximadamente cada 8 ms entre bloques. Por nodo conserva L, R, borde exterior de piano izquierdo/derecho y las interpolaciones exactas al 30/70 % del asfalto. Los sectores de 32 segmentos comparten nodos y disponen de cotas espaciales; el cierre de vuelta reutiliza el mismo nodo inicial. No hay reconstrucción global durante la conducción.
- Un VBO de posiciones y un EBO de selección se mantienen residentes. Se reutiliza el shader de mundo de fase 5, con color constante por grupo material. Los colores se calculan con las funciones existentes: `webglCircuitRoadColor`, `shadeColor` y `circuitCurbPair`. No se crean nuevos shaders de perspectiva.
- La selección se obtiene directamente de las ramas/nodos ya elegidos por el renderizador. No se recorre todo el circuito ni se dibujan sectores completos invisibles. Los descriptores de sector son cotas/organización, no un nuevo simplificador de geometría. La selección indexada conserva exactamente los segmentos solicitados, sin absorber huecos.
- La triangulación usa los índices originales de cada quad, también al recorrerlo en sentido inverso. No se asume que la diagonal inversa sea equivalente en un quad con torsión.
- Cada frame agrupa los índices por color opaco, reutilizando arrays acotados. Sólo sube índices si cambian. Una variación de color puede resolverse con constantes de material, sin retransmitir posiciones; cambios de agrupación pueden requerir índices nuevos.
- Los pianos aportan exclusivamente sus franjas. El modo de asfalto barato usa un único quad; el detallado usa tres bandas. Nunca se envían ambos a la vez.
- Extremos móviles, segmentos no adyacentes, vértices próximos al plano de recorte, inspección y materiales con transparencia permanecen en CPU. Las escapatorias SVG, su propiedad/recorte, los portales y el pit lane mantienen las rutas existentes.
- La base opaca se prepara antes de las marcas, brillo y lluvia. `webglSubmit` intercala `dinámico → terreno → dinámico → SVG → dinámico → base de pista → efectos dinámicos`, manteniendo una sola transferencia del VBO dinámico y el mismo depth buffer. Las bases CPU de respaldo se emiten antes de los efectos.
- Si falla la preparación o se excede un presupuesto, se conservan/reproducen por CPU las bases suprimidas, una sola vez y antes de los efectos. Tras un fallo se desactiva esa ruta en el contexto para evitar reintentos pesados continuos. La pérdida/restauración limpia también el nuevo VBO/EBO y permite recuperarlo.

## LOD y memoria

El detalle móvil del asfalto añade histéresis: entra en la variante barata por encima de 48 m y presión inferior a .30; vuelve a la detallada por debajo de 36 m o presión superior a .38. La decisión inicial conserva el criterio anterior de 42 m/.34. El límite lejano de visibilidad de pianos utiliza ±10 m de margen. Ninguno desplaza vértices ni cambia la física. Es una revisión de estas dos transiciones; no se da por estabilizado todo el LOD de decorados/terreno.

La preparación de posiciones se admite hasta 6 MiB en móvil y 18 MiB en escritorio. El EBO queda limitado a 2200/4400 segmentos seleccionados × 36 índices; ante exceso se usa CPU, sin omitir pista. Los grupos se limitan a 64 y su capacidad de arrays se acota por bytes; no se conservan mapas históricos de cada color climático. Hay dos arrays de selección y grupos reutilizables; se informan por separado VRAM estimada y bytes CPU de índices.

La primera reserva/subida de posiciones y la creación del programa se producen durante el warmup normal del renderizador. Cambiar de backend por primera vez durante una sesión puede exigir esa preparación. Los arrays de grupos pueden crecer hasta su límite durante los primeros usos; `cpuIndexGrows` lo registra. No se promete eliminar toda asignación o recopilación de basura de los demás subsistemas.

El cambio de GP, la recompilación, la vuelta al menú y la pérdida de contexto liberan/invalida los recursos de esta ruta. El modelo no añade referencias circulares a `trackData`. La física de 100 Hz y el límite de recuperación de 12 pasos no cambian.

## Pruebas ejecutadas y resultados reproducibles

Desde la raíz del repositorio:

```sh
node apex/tests/render-audit.cjs
python apex/tests/circuit-assets-audit.py --json
node --check apex/tests/browser-audit.cjs
git diff --check
```

Se conservan los resultados en:

- `apex/tests/results/v01322-synthetic.txt`
- `apex/tests/results/v01322-assets.json`

`render-audit.cjs` conserva las regresiones de v0.13.21 y ejecuta `phase6-road-audit.cjs`. Éste utiliza las funciones de producción con GL/dependencias controlados, comparadas con el render anterior del commit base. Comprueba elevación/peralte, continuidad de sectores y pianos, colores, diagonales en ambos sentidos, cierre de vuelta, modo barato sin duplicación de asfalto, transparencia personalizada, extremos móviles, clipping cercano, fallo de subida con replay CPU, liberación, histéresis y orden de pasadas. El test anterior mantiene sus 900 comparaciones algebraicas de proyección/depth, recuperación de contexto y pruebas de terreno.

La comparación de triángulos se hace después de la conversión a Float32 utilizada por el VBO; no supone igualdad bit a bit con proyección CPU en doble precisión antes de su conversión final a NDC. La auditoría de runtime incluida informa también del error de redondeo en metros.

### Comparación sintética

128 segmentos con elevación y peralte, ambos pianos activos, tres bandas de asfalto:

| Métrica de las bases | v0.13.21 | v0.13.22 |
|---|---:|---:|
| Triángulos | 1280 | 1280 |
| Datos dinámicos de vértices por frame | 107.520 bytes | 0 para las bases migradas |
| Índices de una selección nueva | No aplica | 15.360 bytes |
| Posiciones estáticas iniciales | No aplica | 9.288 bytes, una vez |
| Transferencias nuevas con selección estable durante 1000 frames | Vértices de base cada frame | Ninguna de posiciones/índices |
| Nuevas reservas de buffers/arrays de índices tras calentamiento en ese caso | No comparado | 0 |
| Llamadas de dibujo para esas bases | Compartían el lote dinámico | 8 grupos de material |

El intercambio es explícito: algunas llamadas adicionales a cambio de eliminar proyecciones/emisión de quads y reducir el tráfico. No equivale a una ganancia de FPS ni demuestra un p95 menor. El test de 1000 frames no representa una sesión prolongada en Android: no ejecuta GC, compositor, driver, física o IA reales.

### Los 23 circuitos

La auditoría offline aprobó **24 juegos de fuentes**: los 23 pares base y el SVG detallado de Madrid del repositorio. Verifica XML, polilíneas autoritativas y su cierre, números finitos, altimetría periódica ordenada, los modos de peralte admitidos, pianos, pit lane, salida/meta y continuidad de sectores JSON. Compara las 23 fuentes SVG/JSON y el Madrid detallado con el commit base para confirmar que no se han alterado.

Incluye Australia, China, Suzuka, Miami, Canadá, Mónaco, Barcelona, Austria, Silverstone, Spa, Hungría, Zandvoort, Monza, Madrid, Bakú, la entrada de calendario `16-bahrain` (Sepang), Singapur, Austin, México, São Paulo, Las Vegas, Qatar y Abu Dhabi.

Los 22 circuitos distintos de Madrid usan configuración `MODEL_CAP`, no una lista de peraltes por curva: se valida ese formato existente. La última muestra de altimetría de Madrid es periódica y anterior a la fracción 1; el intervalo final se cierra por el modelo existente. Los elementos que sólo figuran en la biblioteca de plantillas se excluyen del conteo de objetos activos.

Las bases no contienen necesariamente muros, escapatorias ni edificios de boxes explícitos. El informe lo registra como avisos de representación procedural pendiente de runtime, no como prueba de que falten en el juego. Madrid detallado contiene 37 tramos de piano, 6 escapatorias, 3 túneles y 1 puente explícitos en la fuente, sin certificar sus píxeles.

## Diagnóstico y navegador

- `apexPhase6RoadDiagnostics()`: residencia, sectores/vértices, bytes GPU, bytes CPU de índices, segmentos CPU/GPU, triángulos, llamadas, subidas, crecimiento de arrays y transiciones LOD.
- `renderProfilerSnapshot()`: `roadGpu`, tiempos RAW de `roadGpuPrepareMs`, `roadPrepareMs` y `roadDrawMs`, además de los diagnósticos existentes.
- `apexPhase6AuditBaseCircuits()`: desde el menú, usa el loader/modelo real y compila las mallas de las 23 bases; informa de error Float32, apoyo de pianos y datos de timing/pit. No se ha ejecutado en este entorno.
- `browser-audit.cjs`: usa el scheduler de producción. Por defecto incluye Madrid importado, Mónaco, Spa y otro circuito base, con tres cámaras, además de autopruebas de las 23 bases. `ALL_CIRCUITS=1` solicita render de todas las entradas. Registra driver, emulación móvil, FPS/percentiles y errores GL/JS cuando puede ejecutarse.

```sh
python -m http.server 8765
# Otra terminal con Playwright y Chrome instalados:
CHROME_EXECUTABLE=/ruta/a/chrome ALL_CIRCUITS=1 node apex/tests/browser-audit.cjs
```

El runner tiene sintaxis verificada, pero la ejecución aquí falla en el arranque de Chrome. Emulación móvil no equivale a un teléfono Android. El SVG de Madrid del repositorio no garantiza reproducir el JSON/escenario privado guardado por el usuario.

## Matriz pendiente de homologación real

| Área | Evidencia obtenida | Pendiente |
|---|---|---|
| 23 circuitos | Fuentes SVG/JSON e inmutabilidad aprobadas | Carga/modelo/render reales con runner |
| Sectores, peraltes, alturas, pianos | Equivalencia de recetas de triángulos en escena sintética | Inspección visual de límites, cerca del coche y con cámaras inclinadas |
| Madrid, Mónaco, Spa | Fuentes auditadas, casos del runner preparados | Vueltas completas, meta, túneles, puentes, escapatorias |
| Pit lane/boxes/parrilla/timing | Rutas sin cambios; fuentes y diagnósticos preparados | Entradas/salidas de boxes, parrilla y cronometraje en sesiones reales |
| LOD/cámaras | Histéresis y selección estable probadas aisladamente | Giros rápidos y distancias límite en móvil/PC |
| Recursos | Presupuestos, replay y liberación probados con GL simulado | VRAM y recuperación en driver real, cambios repetidos de circuito |
| Sesiones prolongadas | 1000 frames de selección estable sintéticos | Consumo/GC/p95/p99 durante 10–20 minutos reales |
| Guardados, SVG/JSON antiguos, controles y modos | Formatos/rutas conservados | Guardar/restaurar, importar/exportar, táctil/giroscopio y FP/qualy/carrera end-to-end |
| Rendimiento | Bytes, geometría y llamadas sintéticos reproducibles | Comparación antes/después en el mismo dispositivo, cámara y escenario |

Esta revisión no cambia resolución interna/DPR, frecuencias de espejos, IA o física para aparentar una mejora. El próximo cambio debe decidirse con mediciones reales de la nueva ruta; la mejora de conducción queda fuera de esta entrega.
