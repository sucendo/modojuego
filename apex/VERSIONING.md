# APEX Formula 26 — Versionado

## Estado actual

**v0.15.0 · PRE-RELEASE**

APEX todavía no se considera una versión pública estable. Mientras el proyecto siga en esta fase, todas las versiones permanecerán bajo la rama mayor `0.x`.

## Regla de versionado

Se utiliza un esquema simple `vMAJOR.MINOR.PATCH`:

- `v0.9.1`, `v0.9.2`…: correcciones, afinados y cambios compatibles dentro del mismo hito.
- `v0.10.0`, `v0.11.0`…: nuevos bloques funcionales importantes.
- `v1.0.0`: primera versión pública estable de APEX Formula 26.

Los identificadores históricos largos anteriores se conservan únicamente en el historial de Git y en nombres de copias de respaldo cuando sea necesario. No deben volver a utilizarse como versión visible de la aplicación.

## Build

La versión visible y el build interno son conceptos separados. `APP_VERSION` identifica la versión funcional; `APP_BUILD` identifica una compilación concreta para diagnóstico y telemetría.

Build actual: `2026.10.21.08D2` (v0.15.0).

Histórico del build `2026.10.20.07`: v0.13.23 mantiene los formatos guardados y los 28 fragmentos. Primera etapa de fase 7: consistencia de entradas/fuerzas e integración lateral estable, sin cambios de circuito ni contacto/suspensión. El build 04 añade selección estable de bloques de terreno móvil y validación Chromium mediante CI. Los builds 05–07 corrigen la comunicación de bloqueos SVG al automático y sus transiciones de recuperación; añaden comparación con main, pérdida/restauración WebGL y FP1/clasificación en Chromium. Véanse `AUDITORIA_V01323.md` y `CIERRE_FASE7_V01323.md` para resultados y límites de validación.

## v0.14.0

Build `2026.10.20.08A`: modelo de neumáticos integrado. Se mantienen esquema de guardado 4 y arquitectura de 28 fragmentos. La selección inicial usa `apex26.tyre.initial.v1`; los datos térmicos tienen esquema propio 1. Telemetría v24. Véase `FASE8A_NEUMATICOS.md` para pruebas y límites; no implica certificación de FPS o conducción real.

## v0.14.1

Build `2026.10.20.08B`: cambio efectivo de neumáticos en boxes, estrategia sin pausa y servicio único. Conserva esquema de guardado 4 y subesquema térmico 1; añade datos opcionales de boxes e historial en la instantánea final de sesión. Las carreras en curso no se reanudan al recargar.

## v0.14.2 · 21/10/2026

Fase 8C: distancias 25/50/75/100 %, meta del líder y llegada progresiva, resultados persistentes y desgaste común moderado (límite ×1,25 hasta 8D; ×1 al 100 %). Conserva 8B y el bloqueo geométrico de Spa.
