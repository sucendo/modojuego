# APEX 8D.1 — Registro de implementación parcial
Base: main 9e6e2fcde708799b420774504c949f2589065573 (8C).

## Integrado en la rama de trabajo, NO en main
- `apexRivalPitEligibility`: rechaza carrera no activa, rival finalizado, ruta insegura, slot inválido y solicitud duplicada.
- `apexRivalPitRequest`: registra intención y compuesto sin modificar progreso, posición ni neumáticos.
- Prueba de guardas `node apex/tests/rival-pit-request-audit.cjs`.

## No terminado
El modelo rival es cinemático sobre coordenada de pista `rv.s`; el jugador usa coordenadas mundiales y `apexPitStopController`. Falta un controlador rival de trayectoria PIT real, render y contactos sobre la cinta del pit lane, anclaje continuo del progreso de carrera, parada en slot con duración, uso de `apexPitServiceBegin/Complete`, salida, límites de velocidad y regresión en los 23 circuitos.

No iniciar automáticamente solicitudes rivales ni conectar el servicio hasta que exista navegación física: hacerlo ahora provocaría paradas invisibles o teletransportes. Spa debe permanecer bloqueada hasta corregir la fuente SVG.

## Cierre obligatorio
Probar ciclos completos de rivales en Madrid, Mónaco, Monza y Suzuka; Spa rechaza. Verificar 22 coches, el cronometraje y colisiones, paradas sin salto, 8A/8B/8C, desktop/móvil. No fusionar sin verde CI.
