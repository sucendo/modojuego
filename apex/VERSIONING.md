# APEX Formula 26 — Versionado

## Estado actual

**v0.13.11 · PRE-RELEASE**

APEX todavía no se considera una versión pública estable. Mientras el proyecto siga en esta fase, todas las versiones permanecerán bajo la rama mayor `0.x`.

## Regla de versionado

Se utiliza un esquema simple `vMAJOR.MINOR.PATCH`:

- `v0.9.1`, `v0.9.2`…: correcciones, afinados y cambios compatibles dentro del mismo hito.
- `v0.10.0`, `v0.11.0`…: nuevos bloques funcionales importantes.
- `v1.0.0`: primera versión pública estable de APEX Formula 26.

Los identificadores históricos largos anteriores se conservan únicamente en el historial de Git y en nombres de copias de respaldo cuando sea necesario. No deben volver a utilizarse como versión visible de la aplicación.

## Build

La versión visible y el build interno son conceptos separados. `APP_VERSION` identifica la versión funcional; `APP_BUILD` identifica una compilación concreta para diagnóstico y telemetría.
