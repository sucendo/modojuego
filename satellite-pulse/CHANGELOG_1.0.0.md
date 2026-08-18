# Satellite Pulse 1.0.0

Primera versión estable del proyecto.

## Experiencia móvil

- Navegación inferior reorganizada en **Mapa / Satélites / Ficha / Capas / Tiempo**.
- **Satélites** agrupa en un único destino los satélites seguidos y el catálogo.
- Botón de **pantalla completa** disponible directamente en el encabezado móvil.
- El botón **☰** del encabezado muestra u oculta únicamente la navegación inferior, permitiendo un modo de mapa inmersivo.
- Botón flotante de **ubicación del observador** siempre accesible sobre el mapa.
- Indicador del número de satélites que están realmente dentro del viewport.
- La tarjeta compacta inferior permanece vinculada al satélite seleccionado; no cambia automáticamente a otro objeto.
- Deslizar la tarjeta seleccionada hacia arriba abre la ficha completa.
- Bottom-sheet de Satélites/Ficha con gesto vertical: deslizar hacia arriba amplía; deslizar hacia abajo reduce o cierra.
- Capas convertidas en una hoja inferior táctil y con controles etiquetados.
- Tiempo mantiene su panel independiente encima de la navegación inferior.
- Respeto de `safe-area-inset-bottom` y modo horizontal.

## Experiencia de selección

- Panel de situación del satélite con estado inmediato antes de los datos orbitales avanzados.
- Posición, altitud, velocidad, rumbo, cobertura, iluminación y relación con el observador.
- Próximo paso destacado y cálculo automático inicial cuando existe ubicación del observador.
- Meteorología y geometría de observación integradas.
- Cambio de color e imagen desde la ficha.
- Selección de observador por navegador, coordenadas o punto del mapa.

## Catálogo

- OMM de CelesTrak para propagación orbital.
- SATCAT para enriquecer la ficha con operador/propietario, lanzamiento, estado, RCS y otros datos disponibles.
- Clasificación funcional orientativa por grupos/nombre.
- Datos físicos curados únicamente cuando hay información fiable; no se infiere diámetro a partir de RCS.
- Soporte de snapshot generado por GitHub Actions y consulta online cuando un dato no está en el snapshot local.

## Identidad del producto

- Nombre definitivo: **Satellite Pulse**.
- PWA, título HTML, documentación, package, service worker y workflow de GitHub Pages actualizados con la nueva identidad.
- Nuevo namespace de almacenamiento `satellitePulse.v1` con migración automática desde la versión anterior para conservar configuración, satélites, colores, iconos y vista del mapa.
