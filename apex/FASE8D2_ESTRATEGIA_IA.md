# APEX 8D.2 — estrategia inicial de IA (pendiente de integración)

Base: `main` en `dbede97f38575c109d805885734ba8612d70251b` (8D.1).

La IA evalúa cada ~2–2,8 s simulados su juego real de neumáticos. En carrera con más de dos vueltas restantes, solicita una parada por desgaste >82% o incompatibilidad de compuesto con la humedad. Selección provisional: WET (>0,68 humedad), INTERMEDIATE (>0,19), y en seco HARD/MEDIUM/SOFT según distancia restante. Hay protección de solicitud duplicada, lap de última solicitud y cooldown; el servicio lo realiza el controlador físico 8D.1.

## Validación
- `node apex/tests/rival-tyre-strategy-audit.cjs` prueba desgaste, clima y limitaciones.
- `rival-pit-browser.cjs` conserva 8D.1 e incorpora escenario de Monza: cinco rivales comienzan con degradación elevada y deben decidir paradas automáticamente, conservar separación y completar el servicio una vez.
- Regresiones previas: Chromium desktop/móvil, autopilot y auditorías aisladas.

## Límite antes de integrar
El escenario de cinco rivales es una prueba dirigida, **no un GP completo de 21 rivales** con desgaste normal a lo largo de todas las vueltas. No declarar equilibrio estratégico, cambios meteorológicos dinámicos ni estrategias multistop probadas con este caso. Spa mantiene servicio bloqueado por geometría.

Integrar únicamente si el CI del último commit de la rama queda verde y se revisan los recibos del caso autónomo.
