# System Forge

Generador 3D de sistemas planetarios con integración N-body simple.

## Incluye
- Preset Sistema Solar (Sol, 8 planetas y Luna).
- Preset Canopus / Arrakis.
- Creación de estrellas, planetas, lunas y cuerpos menores.
- Elementos orbitales editables.
- Integración N-body baricéntrica.
- Zona habitable visual.
- Cálculos de periodo, Hill, periastro, apoastro y temperatura de equilibrio.
- Indicador de energía y distancia mínima.
- Interfaz responsive.

## Uso
Abre `index.html` con conexión a Internet. La visualización 3D carga Three.js desde jsDelivr.
Para GitHub Pages basta con subir el contenido de esta carpeta a un repositorio y activar Pages.

## v1.1.0
- Etiquetas/nombres con interruptor en la vista 3D.
- Densidad física editable y densidad geométrica calculada.
- Albedo y presión superficial.
- Rotación sideral, oblicuidad axial y sentido prógrado/retrógrado.
- Gravedad superficial, velocidad de escape y velocidad ecuatorial calculadas.
- Marcador meridiano para hacer visible la rotación.
- Datos físicos/rotacionales ampliados en el preset del Sistema Solar.

## v1.2.0
- Radio físico mostrado y editado en kilómetros, con equivalencias R⊕ / R♃ / R☉.
- Ficha dinámica en tiempo real para el cuerpo seleccionado:
  distancia al padre, velocidades orbital y baricéntrica, elementos osculantes,
  periodo instantáneo, desviación respecto al periodo nominal y perturbador dominante.
- Ficha de rotación en tiempo real:
  periodo sideral, velocidad angular, velocidad ecuatorial, ángulo actual, oblicuidad y sentido.
- Preset del Sistema Solar ampliado con lunas principales:
  Luna, Phobos, Deimos, Io, Europa, Ganímedes, Calisto, Encélado, Tetis, Dione, Rea,
  Titán, Jápeto, Miranda, Ariel, Umbriel, Titania, Oberón y Tritón.
- Preset Canopus ampliado con dos lunas ficticias editables de Arrakis.
- Paso N-body adaptativo según el periodo orbital más corto para integrar lunas rápidas.

## v1.3.0
- Cámara centrada y con seguimiento automático del cuerpo seleccionado.
- Escala visual jerárquica: desde proporciones reales hasta modo legible que amplía sistemas de lunas.
- Escala temporal logarítmica desde 1 segundo simulado por segundo real hasta 1000 años por segundo.
  A velocidades por encima de la capacidad N-body en tiempo real se usa una vista Kepler rápida; el verificador permanece independiente.
- Masa, radio y densidad vinculados: la tercera magnitud se calcula a partir de las dos últimas editadas.
- Etiquetas sin caja, con filtros por estrellas, planetas, lunas, seleccionado, ninguna o selección individual.
- Exportación del sistema/preset a JSON y CSV.
- Verificador de estabilidad:
  chequeo Hill/Roche/orbit-crossing + prueba N-body asíncrona de estrellas y planetas.
- Paneles compactados y responsive móvil reforzado.

## v1.4.0
- Escala visual rediseñada:
  - Real 1:1: 1 UA física = 1 unidad de escena para todas las jerarquías.
  - Adaptativa: redistribuye logarítmicamente las órbitas para leer el sistema completo.
  - Local: amplifica específicamente el sistema del cuerpo seleccionado (p. ej. lunas de un planeta).
- Cámara local real: al seleccionar un planeta puede acercarse hasta las órbitas de sus lunas sin depender de deformarlas.
- Tamaños de cuerpos híbridos: recuperan su radio físico al acercarse y usan un marcador mínimo en pantalla cuando quedarían invisibles.
- Profundidad logarítmica y rango de cámara ampliado para pasar de sistemas estelares a pequeñas lunas.
- Botones rápidos Real / Local y estado de escala visible.

## v1.5.0
- Nuevo análisis temporal genérico para el cuerpo seleccionado.
- Arrakis conserva una referencia especial de 295 años y banda objetivo −353 / +595 días.
- Histórico de periodo osculante, Δ en días, semieje, excentricidad y distancia.
- Medición de revoluciones reales y periodo real medio/mínimo/máximo.
- Gráfica temporal con curva osculante, media móvil y puntos de años reales.
- Análisis científico largo N-body de 1 ka, 10 ka o 100 ka para planetas, separado de la animación.
- CSV del histórico temporal y JSON del sistema con toda la serie temporal.
- El análisis en vivo no registra la vista Kepler rápida como si fuera N-body.

- Estado instantáneo ampliado con inclinación osculante y aceleración perturbadora.
- Detección de conjunciones del cuerpo seleccionado y marcas verticales en la gráfica temporal.

## v1.6.0
- Importación de sistemas desde JSON y CSV exportados por System Forge.
- Compatibilidad adicional con JSON del antiguo Canopus N-Body Lab.
- Exportación de preset limpio (sin historial) además de JSON completo y CSV.
- Los CSV incluyen id/parentId para reconstruir jerarquías sin ambigüedad.
- Asistente de sistemas binarios con masas, separación, excentricidad, inclinación y fase.
- Marcador de baricentro activable.
- Escala Auto contextual: estrella → sistema, planeta → satélites, luna → entorno local.
- Análisis temporal con segunda serie superpuesta y eje independiente.
- Verificador ampliado hasta 100 ka.
- Nombre de proyecto conservado en JSON y usado para nombres de archivo.

## v1.7.0
- Preset integrado de Próxima Centauri con b y d confirmados y c marcado explícitamente como candidato.
- Metadatos observacionales: disposición, masa mínima M·sin(i), fuente, periodo observado, temperatura de equilibrio y flujo estelar.
- Generador automático inicial alrededor de una estrella seleccionada con objetivo de ≥8 radios de Hill mutuos.
- Opción de forzar un planeta rocoso dentro de la zona habitable.
- Radios planetarios estimados mediante relación masa-radio simple para mundos generados.
- Zona habitable circumbinaria aproximada por luminosidad total además de las HZ individuales.
- El generador es una herramienta de diseño físico, no un modelo completo de formación planetaria.

## v1.7.1
- Sustituido el preset aislado de Próxima por **Alpha Centauri completo**.
- Jerarquía: Alpha Cen A+B (binaria interior) + Próxima/Alpha Cen C en órbita amplia alrededor del baricentro AB.
- Añadido soporte de referencia orbital virtual mediante `orbitCenterIds`, exportable/importable.
- Próxima b y d se incluyen como confirmados; Próxima c como candidato.
- Alpha Cen A b se incluye como candidato visual y partícula de prueba de masa 0 para no inventar su influencia gravitatoria.
- Alpha Cen B b no se instancia porque figura como falso positivo.

## v1.7.2 — Responsive móvil
- Interfaz móvil rediseñada en lugar de comprimir el escritorio.
- Árbol/construcción como drawer izquierdo con fondo modal.
- Propiedades como bottom-sheet de hasta 80% de la pantalla, con tirador visual y cierre.
- Selector de sistema/preset movido al drawer en móvil para liberar la cabecera.
- Cabecera reducida a navegación, proyecto y propiedades.
- Análisis temporal plegado por defecto y optimizado como overlay compacto.
- Estadísticas temporales en carrusel horizontal.
- Footer móvil de dos filas para tiempo y escala, con objetivos táctiles mayores.
- HUD reducido; se oculta ΔE en móvil para no saturar la escena.
- Soporte específico para teléfonos estrechos y orientación horizontal.
- Safe-area para iPhone/Android y overscroll/touch mejorados.

## v1.8.0 — Core & Analysis
- Modularización inicial real: schema/migrations, resonancias e informe de estabilidad en módulos externos.
- `schemaVersion: 2` y migración automática de proyectos JSON antiguos.
- Inspector global del sistema.
- Breadcrumb jerárquico con referencias baricéntricas.
- Resonancias simples + cadenas 4:2:1.
- Órbitas contextuales y centrado correcto de referencias baricéntricas virtuales.
- Informe explicativo de estabilidad con índice heurístico.
- Duplicado de cuerpos y borrado recursivo.
- Presets externos: Sistema Solar, Canopus/Arrakis y Alpha Centauri.

## v1.8.1 — Solar preset refinement
- Corregido el falso positivo de “encuentro crítico”.
- Roche mejorado: distinción entre límite fluido y rígido.
- Fondo de puntitos eliminado.
- Saturno con anillos.
- Añadidos Ceres, Plutón, Haumea y Eris con sus lunas principales.
- Añadidos Vesta, Pallas, Hygiea, Interamnia y Europa.
- Añadidos Halley y Hale-Bopp.
- Decoración con cinturón de asteroides, Kuiper y nube de Oort.

## v1.8.2 — Solar structures & controls
- Añadido Makemake y su luna provisional MK 2.
- Controles independientes para anillos, cinturón principal, Kuiper, Oort, cuerpos menores y cometas.
- Nube de Oort desactivada por defecto para evitar saturar la escena.
- Decoraciones de cinturones se reconstruyen al cambiar la escala visual.
- Asteroides y cometas usan geometría irregular en lugar de esferas perfectas.
- Sincronización del preset solar externo con el contenido ampliado del preset embebido.

## v1.8.3 — poblaciones dinámicas e interfaz depurada
- Cinturón de asteroides, cinturón de Kuiper y nube de Oort convertidos en poblaciones sintéticas de cuerpos reales que sí perturban y son perturbados.
- Estas poblaciones se representan como puntos; sus órbitas individuales no se dibujan para no saturar la escena.
- Corregido el trazado de órbitas muy excéntricas (cometas) mediante muestreo por anomalía verdadera.
- Eliminados del encabezado los controles duplicados de nombres, HZ y órbitas.
- El tipo en el inspector derecho y las etiquetas del árbol se muestran en español.

## v1.8.4 — estructuras agregadas
- Asteroides, Kuiper y Oort son exactamente tres entidades físicas editables.
- Los puntos son solo render; no son cuerpos N-body.
- Campo medio para cinturones y distribución esférica para Oort.
- Nuevo botón + Estructura y editor dedicado.
- Capas y etiquetas reorganizadas por categorías.

## v1.8.5 — perfiles internos de estructuras
- Anillos de Saturno convertidos en una estructura física hija de Saturno.
- Masa de referencia Cassini: ~1.54e19 kg (~2.58e-6 M⊕).
- Perfil D/C/B/A/F con División de Cassini.
- Cinturón principal con huecos de Kirkwood 4:1, 3:1, 5:2, 7:3 y 2:1.
- Kuiper sigue siendo una sola estructura, pero visualiza clásicos fríos/calientes, resonantes 4:3/3:2/2:1 y disco disperso.
- Los perfiles internos también ponderan el campo gravitatorio medio sin añadir cuerpos.
- El editor de estructuras permite centro estrella/planeta y perfil interno.

## v1.8.6 — ring systems
- Corregida la rotación artificial de todas las estructuras: sus puntos ya no giran como un disco sólido.
- Saturno: D/C/B/A/F/G/E + anillo de Phoebe, División de Cassini, huecos Encke y Keeler.
- Añadidas Pan, Daphnis, Prometheus, Pandora, Aegaeon, Mimas y Phoebe; Enceladus documentado como fuente del E.
- Júpiter: halo, anillo principal y gossamer como una única estructura; añadidas Metis, Adrastea, Amalthea y Thebe.
- Urano: sus 13 anillos como una única estructura; Cordelia y Ophelia como pastoras del Epsilon.
- Neptuno: Galle, Le Verrier, Lassell, Arago y Adams con cuatro arcos; añadida Galatea.
- Júpiter/Urano/Neptuno conservan masa de anillos desconocida y gravedad desactivada por defecto, evitando inventar parámetros.

## v1.8.7 — consolidación
- Movimiento diferencial de puntos para cinturones, Kuiper y sistemas de anillos sin convertir puntos en cuerpos N-body.
- Actualización visual de estructuras a ~15–20 Hz y límite visual anti-aliasing.
- Oort permanece como distribución esférica estadística; no se fuerza un giro sólido.
- Visibilidad unificada: al ocultar cuerpos se ocultan también nombres y órbitas asociados.
- `Capas y etiquetas` reorganizado en Cuerpos, Estructuras, Capas y Nombres.
- Cinturones/nubes y anillos tienen controles independientes.
- Todos los botones de capas sincronizan estado visual y `aria-pressed`.
- Gravedad de estructuras cacheada y reacción aproximada sobre el cuerpo central.
- El diagnóstico energético vivo incorpora el potencial externo de estructuras.
- HUD dinámico limitado a ~8 Hz para reducir trabajo por frame.
- Eliminado del runtime el legado `ringSpec`, decoraciones solares y swarms sintéticos; los swarms antiguos se migran al importar.
- Schema v3 con campos explícitos para estructuras.
- El modo rápido se muestra como `Kepler · sin perturbaciones`.

## v1.8.8 — análisis científico unificado
- Inspector del sistema y verificador agrupados bajo `Análisis del sistema`.
- Veredicto N-body temporal separado de heurísticas instantáneas.
- Secciones: dinámica planetaria, resonancias, cuerpos menores/cometas, satélites/Roche, jerarquía y eventos críticos.
- Hill mutuo solo para pares planetarios suficientemente masivos, moderadamente excéntricos y aproximadamente coplanares.
- 8 R_H,m queda como objetivo conservador del generador, no frontera científica de estabilidad.
- Solapamientos radiales pasan a geometría/información; cuerpos menores y cometas no reciben Hill planetario.
- Roche fluido se presenta como condición de mareas; Roche rígido conserva severidad física.
- Eventos críticos guardan pareja, tiempo, distancia, radio combinado y velocidad relativa.
- Verificación larga incluye campos medios de estructuras masivas.
- Vista Kepler usa estado visual separado; al regresar a N-body adopta ese estado y reinicia la referencia energética para no fabricar ΔE.
- Styx, Nix, Kerberos e Hydra usan el baricentro Plutón–Caronte como referencia orbital física.
- Botón `Análisis JSON`; el JSON completo incorpora `systemAnalysis`.
- Schema v4.

## v1.8.9 — cierre del núcleo
- Baricentros/referencias orbitales genéricos como nodos virtuales reutilizables.
- Constructor de baricentros con 2+ miembros y asignación desde el inspector de cada cuerpo.
- El árbol muestra referencias explícitas sin convertirlas en cuerpos N-body.
- `orbitCenterIds` antiguos se migran automáticamente: Plutón–Caronte y Alpha Centauri aparecen como referencias reutilizables.
- Un sistema binario nuevo crea automáticamente `Baricentro A–B`.
- Exportación/importación incorpora `references` y `orbitReferenceId`; schema v5.
- Separación física/render reforzada con `RenderStateCache`: las posiciones visuales se calculan una vez por revisión y se reutilizan.
- El preview Kepler sigue separado del estado N-body y resuelve también referencias genéricas.
- Monitor opcional: FPS, tiempo de frame, física, estructuras, render y pasos N-body/s.
- Calidad `Auto / Alta / Normal / Ahorro`. Auto ajusta solo carga visual (frecuencia de estructuras/pixel ratio), nunca precisión física.
- Modularización ampliada con `model/references.js`, `renderer/render-state.js` y `performance/monitor.js`.

## v1.9.0 — resonancias y dinámica orbital avanzada
- Nuevo análisis orbital avanzado bajo demanda; no añade coste continuo al render ni a la simulación normal.
- MOID aproximada para pares cuerpo menor/cometa–planeta con rangos orbitales solapados.
- La MOID usa órbitas osculantes 3D, muestreo angular y refinamiento local; se etiqueta explícitamente como aproximación geométrica, no como solución certificada ni con covarianzas.
- `osculatingElements()` ahora obtiene también Ω, ω, M, ϖ y longitud media λ desde el estado cartesiano.
- Resonancias dinámicas: para candidatos de razón de periodos se integran los ángulos resonantes de tipo pλ_outer − qλ_inner − (p−q)ϖ.
- Se prueban las ramas con periastro del cuerpo exterior e interior y se clasifica `libración compatible`, `posible libración`, `circulación` o `indeterminado`.
- Evolución secular básica por cuerpo: rangos de a, e, i y arco recorrido por ϖ durante la integración.
- El análisis dinámico integra estrellas, planetas y cuerpos menores, incluyendo los campos medios de estructuras masivas.
- Horizonte configurable: 1 ka, 10 ka o 50 ka; límite de pasos y ejecución por chunks para mantener utilizable el navegador.
- Nuevo export independiente `Dinámica JSON`; `Análisis JSON` y el proyecto completo incluyen también `advancedDynamics`.
- Detector de resonancias actualizado para `orbitReferenceId` y razones adicionales 1:1, 7:3 y 7:4.
- Nuevo módulo `src/analysis/orbital-dynamics.js`.
- Schema v6.

## v1.9.1 — Encounters & Scenarios
- Motor de escenarios: asteroide gigante, cometa interestelar, planeta errante, estrella visitante y Gliese 710.
- Trayectorias hiperbólicas/parabólicas a partir de periastro, v∞, distancia inicial y orientación.
- Estado cartesiano XYZ (UA) + VXYZ (km/s) editable.
- Objetos entrantes son cuerpos N-body reales; registro de máxima aproximación temporal con distancia, tiempo y velocidad relativa.
- Trazadores gravitatorios sin masa para estructuras; no interaccionan entre sí ni aumentan el N-body N².
- Clasificación: estables, perturbados, inyectados, expulsados y capturados.
- Promoción del trazador más perturbado a cuerpo N-body real.
- Preset integrado `Sistema Solar + Gliese 710`; Oort activa 1.200 trazadores.
- Ayuda integrada `?`, glosario, ayudas `ⓘ` y recorrido guiado de siete pasos.
- Módulos nuevos: `physics/encounters.js`, `physics/tracer-integrator.js`, `ui/help.js`.
- Schema v7.

- El preset JSON externo de Gliese 710 incluye el cuerpo visitante y su estado cartesiano inicial, no solo la plantilla del escenario.

## v1.9.1.1 — Observational & Encounter Fix
- Tour rehecho con highlight `fixed` propio y z-index alto; ya no depende del stacking context del elemento señalado.
- Guía ampliada a 12 pasos.
- Datos observacionales editables en cada cuerpo: estado, naturaleza de masa/radio/periodo/temperatura, fuente, época, catálogo, método, año, URL y notas.
- Estados: confirmado, candidato, provisional, hipotético, discutido, refutado/retirado y modelo.
- El árbol muestra estados relevantes distintos de confirmado/modelo.
- Nuevo modo rápido de encuentro: cuando existe un visitante y la velocidad supera el N-body completo, se usa N-body para estrellas/planetas/cuerpos menores y lunas como seguidores Keplerianos.
- La velocidad del encuentro se limita automáticamente al acercarse el visitante para no saltarse el periastro.
- El HUD identifica explícitamente `Encuentro N-body planetario`; ΔE no se mezcla con el diagnóstico del N-body completo.
- Schema v8.

## v1.9.1.4 — Dynamic Orbits, Trails & Physical Barycenters
- La órbita dibujada deja de estar congelada en los elementos iniciales: por defecto se usa la órbita osculante actual derivada de posición/velocidad N-body.
- Selector de geometría: `Osculante actual`, `Inicial / nominal`, `Inicial + actual`.
- Trayectoria real N-body independiente: seleccionada, contextual, todas o desactivada; historial limitado a 300/600/1200 muestras.
- Las órbitas osculantes se redibujan de forma adaptativa solo cuando cambian apreciablemente a/e/i/Ω/ω y con cadencia ligada al modo de rendimiento.
- Soporte visual de elipses y trayectorias abiertas osculantes; una captura pasa de trayectoria abierta a órbita ligada y una eyección puede volver a conica abierta.
- Los trails se muestrean desde el estado físico, no desde la previsualización Kepler. Al confirmar una previsualización rápida se limpian para no inventar una trayectoria N-body que no se integró.
- Los baricentros globales y virtuales se calculan primero en coordenadas físicas N-body y después se proyectan al espacio visual.
- Un baricentro virtual seleccionado puede ser seguido por la cámara y el marcador de baricentro se mueve con él.
- `computeDisplayPositions()` entiende referencias baricéntricas explícitas al posicionar cuerpos, mejorando la alineación cuerpo–órbita–baricentro.
- Preferencias de órbitas/trails se guardan en JSON de proyecto.
- Schema v11.

## v1.9.1.5 — Dynamic Architecture & Perturbable Structures
- Diagnóstico orbital vivo desde el estado N-body: S-type excitada, pérdida del vínculo nominal, transferencia tentativa, transición P-type/circumbinaria y candidato a eyección.
- `Reestructuración dinámica severa` prevalece sobre un diagnóstico/verificación antiguo que ya no describa el estado actual.
- Cinturones y nubes perturbables activan trazadores gravitatorios sin masa automáticamente cuando el índice de marea supera el umbral.
- Anillos planetarios usan una deformación tidal ligera y acumulativa para evitar el coste de integrar miles de partículas con periodos de horas/días.
- Las estructuras no se seleccionan desde el mapa 3D; se editan desde el árbol.
- Árbol plegable por ramas, con botones `Plegar` / `Abrir`; referencias también plegables.
- Schema v12.

## v1.9.1.6 — Fast-Time Continuity & Temporal Toggle
- Corregido el salto al acelerar: la previsualización Kepler ya no reconstruye cuerpos desde `a/e/i/Ω/ω/M₀` nominales.
- La vista rápida parte de elementos osculantes calculados desde la posición/velocidad N-body exacta del instante de entrada; estados no ligados continúan linealmente en vez de reaparecer en su órbita inicial.
- Al salir de la vista rápida se conservan `unstable`, eventos críticos y reestructuración dinámica. Ya no se “reordena” artificialmente el sistema.
- Sistemas con más de una estrella, visitantes, colisiones/inestabilidad o reestructuración orbital severa no usan Kepler a alta velocidad: pasan a `N-body rápido planetario`.
- El N-body rápido adapta el paso también a la separación y escala orbital actual de estrellas/planetas, incluso sin un objeto marcado como visitante.
- Nuevo botón `Temporal ON/OFF`: pausa completamente el muestreo temporal live sin borrar el historial.
- El seguimiento de revoluciones reales se desacopla de cada subpaso N-body (~720 muestras por órbita, acotado), reduciendo coste a velocidades altas.
- El gráfico temporal solo se redibuja periódicamente si el panel está abierto y el registro live está activo.
- Schema v13.
