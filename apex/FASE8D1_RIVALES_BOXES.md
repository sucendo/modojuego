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

## Prototipo de navegación en commit 92c4d625
- `apexRivalPitDrive` avanza por la cinta PIT autorada, limita velocidad, frena ante el box y reutiliza `apexPitServiceBegin` / `apexPitServiceComplete`.
- `rivalWorld` resuelve posición del rival por centro de PIT sólo en la fase activa. El progreso clasificatorio se proyecta de entrada a salida y conserva el cronometraje de vuelta existente.
- Protección contra salto al entrar: no se inicia la red PIT si el coche no está a menos de 2,4 metros del extremo de entrada. La salida exige una unión de menos de 2,5 metros con pista. Con geometrías que no cumplan, puede quedar bloqueado: es un prototipo, NO una validación de recorrido.
- Las solicitudes siguen siendo explícitas; sin automatismo de estrategia ni recorrido completo probado. Se requiere simulación de integración con prueba real antes de habilitarlo para toda la parrilla.
- Resta revisar contacto lateral, render y colisiones de rivales sobre PIT en todos los LOD. No cerrar ni fusionar hasta superar tests específicos.
