# System Forge

**System Forge v1.9.5.0** es un simulador astronómico 3D y un entorno de autoría de sistemas para Voyastris. Comparte un único núcleo físico para construir, simular, perturbar, analizar y validar sistemas estelares y planetarios.

## Capacidades principales

- Integración N-body baricéntrica Velocity Verlet y regímenes rápidos adaptativos.
- Estrellas simples, binarias, triples jerárquicas, planetas, planetas enanos, satélites naturales, vehículos espaciales, cuerpos menores y estructuras.
- Órbitas osculantes, trayectorias N-body, encuentros, capturas, escapes y cambios dinámicos de referencia.
- Análisis de Hill/Roche, estabilidad, resonancias, histórico temporal, resultados de experimentos y el instrumento relativo Medir A↔B.
- Escala 3D `1:1 → Adapt. → Local`, cámara libre/seguimiento, viaje progresivo y anillos seleccionables.
- Catálogo privado de Voyastris instalado localmente con validación reproducible.
- Presets detallados de Sistema Solar, Alpha Centauri y Canopus / Arrakis; el Solar incluye ISS, Hubble, Parker Solar Probe y Voyager 1/2.
- Etiquetas CF, Dune y Voyastris, además de etiquetas personalizadas.
- Interfaz responsive para escritorio y móvil.

## Uso

1. Abre `index.html` en un servidor web local o en el despliegue de System Forge.
2. Para instalar el catálogo privado de Voyastris en esta distribución, ejecuta una vez `setup-voyastris-offline.cmd` desde un equipo con un checkout autorizado de Voyastris.
3. Three.js continúa cargándose desde jsDelivr, por lo que la visualización 3D aún requiere conexión salvo que se empaquete esa dependencia localmente en una versión futura.

> Si publicas la carpeta `src/catalog/voyastris-source/` en un repositorio público, estarías publicando también la instantánea privada instalada del catálogo.

## v1.9.5.0 — Scientific Instruments I + Spacecraft I

Primera versión funcional de instrumentos científicos relativos y autoría de vehículos espaciales.

- Nueva herramienta **Medir A↔B**: distancia, tiempo-luz, velocidad relativa/radial/tangencial, energía y momento angular específicos, estado ligado/no ligado y elementos orbitales relativos.
- Línea 3D A↔B y etiqueta de distancia opcionales, actualizadas en el mismo frame final que cámara, iconos y etiquetas.
- `src/analysis/relative-measurement.js` y `src/ui/measurement-controller.js` mantienen el instrumento fuera del monolito y escuchan el EventBus de selección.
- **Crear cuerpo → Vehículo espacial** permite añadir satélites artificiales, sondas, naves tripuladas, estaciones, landers, rovers, observatorios y otros vehículos balísticos.
- Nueva capa y categoría de etiquetas **Vehículos espaciales**.
- Propiedades específicas: clase, misión, operador, estado, masa seca, propelente, tamaño, tripulación y propulsión.
- Preset Solar ampliado de 70 a **75 cuerpos** con ISS, Hubble, Parker Solar Probe, Voyager 1 y Voyager 2.
- Los estados de misión documentan su procedencia y limitaciones: TLE como condición inicial para ISS/Hubble; modelo orbital documentado para Parker; estados Voyager aproximados y explícitamente marcados como tales.
- Spacecraft I sigue siendo balístico: no modela todavía empuje activo, maniobras, consumo de propelente, drag ni reboost.
- Schema **22** sin cambios respecto a v1.9.4.4.
- Nuevas regresiones para medición relativa, preset de spacecraft y sincronización del instrumento con el frame final.

## Arquitectura

La arquitectura y las reglas para nuevas funciones están descritas en `docs/ARCHITECTURE.md`. Los subsistemas nuevos importantes deben nacer como módulos y no volver a engordar el script principal.

## Historial

Consulta `CHANGELOG.md` para el historial completo de versiones.
