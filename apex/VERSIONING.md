# APEX Formula 26 — Versionado

## Estado actual

**v0.13.23 · PRE-RELEASE**

APEX todavía no se considera una versión pública estable. Mientras el proyecto siga en esta fase, todas las versiones permanecerán bajo la rama mayor `0.x`.

## Regla de versionado

Se utiliza un esquema simple `vMAJOR.MINOR.PATCH`:

- `v0.9.1`, `v0.9.2`…: correcciones, afinados y cambios compatibles dentro del mismo hito.
- `v0.10.0`, `v0.11.0`…: nuevos bloques funcionales importantes.
- `v1.0.0`: primera versión pública estable de APEX Formula 26.

Los identificadores históricos largos anteriores se conservan únicamente en el historial de Git y en nombres de copias de respaldo cuando sea necesario. No deben volver a utilizarse como versión visible de la aplicación.

## Build

La versión visible y el build interno son conceptos separados. `APP_VERSION` identifica la versión funcional; `APP_BUILD` identifica una compilación concreta para diagnóstico y telemetría.

Build actual: `2026.10.20.07`. v0.13.23 mantiene los formatos guardados y los 28 fragmentos. Primera etapa de fase 7: consistencia de entradas/fuerzas e integración lateral estable, sin cambios de circuito ni contacto/suspensión. El build 04 añade selección estable de bloques de terreno móvil y validación Chromium mediante CI. Los builds 05–07 corrigen la comunicación de bloqueos SVG al automático y sus transiciones de recuperación; añaden comparación con main, pérdida/restauración WebGL y FP1/clasificación en Chromium. Véanse `AUDITORIA_V01323.md` y `CIERRE_FASE7_V01323.md` para resultados y límites de validación.
