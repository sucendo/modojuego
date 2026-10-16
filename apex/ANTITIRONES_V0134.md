# APEX v0.13.4 — Estabilización con Madrid completo

### Implementación
- Muros SVG: rango conservador reducido y descarte de polígonos totalmente fuera del frustum.
- Edificios: bounding sphere precompilada con margen y descarte conservador antes de la proyección exacta.
- Presupuesto de escena reutilizado por fotograma (en lugar de recalcularlo para cada elemento).
- Retrovisores: frecuencia de refresco entre 9 y 27 Hz, atendiendo a coste y FPS.
- Caché de terreno: clave que distingue las posiciones de muestreo y cambios de LOD.
- Física 100 Hz, IA, trazado SVG/JSON, cámaras, controles y guardados inalterados.

### Diagnóstico en navegador
apexPerformanceSummary()
renderProfilerSnapshot()
apexHeavyCircuitPerfDiagnostics()
apexStaticOcclusionStatsSnapshot()

**Pendiente:** contraste del FPS real, latencia de dirección y geometría de todo Madrid en navegador; no hay acceso directo al guardado local del usuario.