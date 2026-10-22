# APEX 26 — Recursos del menú 9A

Origen: `APEX_26_prototipo_actualizado_nuevas_imagenes.zip` suministrado para esta fase. Se han convertido/reescalado las 29 imágenes del prototipo a WebP para reducir las descargas y conservar la apariencia original. No se han utilizado capturas de pantallas completas como interfaz.

## Estructura

- `logo-apex26.webp`, `fondo-apex26.webp`: portada.
- `race-fast.webp`, `race-gp.webp`, `race-season.webp`, `race-practice.webp`: tarjetas de las cuatro modalidades.
- `tyre-soft.webp`, `tyre-medium.webp`, `tyre-hard.webp`, `tyre-intermediate.webp`, `tyre-wet.webp`: neumáticos con transparencia **RGBA**.
- `weather-clouds.webp`, `track-state-bg.webp`, `track-state-thumb.webp`: paneles de tiempo y superficie.
- `race-vehicle.webp`, `race-monaco.webp`, `prep-monaco.webp`: imágenes de apoyo.
- `team-01.webp` a `team-12.webp`: vehículos del prototipo; no alteran los chasis, el catálogo ni el motor de simulación.

Los circuitos no usan imágenes de trazados genéricos: la vista de información se obtiene del bloque existente del circuito seleccionado por APEX. Evitar mostrar la miniatura de Mónaco para otros trazados.

## Integración

- Menú: `apex/js/menu-9a.js` y `apex/css/menu-9a.css`.
- Preparación: `apex/js/preparation-9a.js` y `apex/css/preparation-9a.css`.
- Pruebas: `node apex/tests/menu-9a-assets.cjs` y `apex/tests/preparation-9a-browser.cjs`.

La preferencia de estrategia en esta fase no constituye un controlador automático de paradas. La elección de compuesto inicial se transmite al control nativo `#menuTyreCompound`.
