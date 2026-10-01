# Satellite Pulse 1.0.2

## Interfaz
- Ocultado temporalmente el control **Aa** de etiquetas.
- Los mapas se muestran siempre con sus textos, incluso si una preferencia antigua había dejado las etiquetas desactivadas.

## Radar
- Corregido el aviso **Zoom level not supported** de RainViewer.
- La API pública de RainViewer admite un zoom máximo de **z=7**.
- El radar se oculta automáticamente al superar z=7 y vuelve a aparecer al alejar el mapa.
- No se solicitan teselas de radar por encima del nivel soportado.

## PWA
- Caché actualizada a `satellite-pulse-v1.0.2`.
