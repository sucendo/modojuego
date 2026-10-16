# APEX v0.13.5 — Rendimiento y respuesta de conducción

## Cambios
- Escalado automático de resolución interna: 100% → 87% → 74% → 62% según sobrecarga sostenida; no cambia el tamaño CSS del juego.
- Lectura de FPS, coste de render y física cada ~900 ms desde el bucle de animación existente, sin timers nuevos.
- Recuperación lenta e histéresis para evitar oscilaciones entre resoluciones.
- Presión de LOD distante en ordenador más agresiva con caídas de fotogramas.
- Simulación del vehículo sin modificar: se conserva la física fija a 100 Hz, colisiones y cronometraje.
- `apexDrivePerformanceDiagnostics()`, `renderProfilerSnapshot()` y `apexHeavyCircuitPerfDiagnostics()` permiten detectar si el problema es CPU o GPU.

## Comprobaciones pendientes en Madrid completo
- Probar CAM/TV/EXT, volante/giroscopio, boxes y túneles y comparar FPS/latencia a misma escena.
- Evitar cambios bruscos de tamaño del HUD durante descenso de resolución.
- Medir latencia con 22 rivales, particularmente si el tiempo de física también excede el presupuesto.
- La estrategia reduce carga gráfica, pero no puede garantizar 60 FPS si el cuello de botella es únicamente la física o la geometría CPU.
