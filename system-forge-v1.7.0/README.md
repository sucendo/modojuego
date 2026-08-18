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
