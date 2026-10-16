# APEX Formula 26 · v0.12.2 — Perspectivas de monoplazas

## Objetivo
Auditar 16 orientaciones referenciales para las 11 escuderías (176 combinaciones) sin sustituir el giro WebGL continuo por sprites.

## Cambios técnicos
- `apex/parts/part-025.txt`: índice angular, etiqueta, metadatos asociados a rivales.
- `apex/parts/part-026.txt`: comprobaciones de simetría, proporciones y muestreo del círculo cada 0,5°.
- `apex/parts/part-023.txt`: auditoría consolidada.
- No modificar física, colisiones, IA, guardados, cámara ni SVG/JSON de circuitos.

## Validación en consola
```js
apexCarAngleReferenceTable()
apexCarPerspectiveMetrics('PAPAYA')
apexCarPerspectiveSymmetryTest()
apexCarAngleContinuityTest()
apexCarVisualAuditV0122() // ok: true esperado
```

La prueba geométrica no acredita una revisión fotográfica de los 176 ángulos. Faltan inspección visual real WebGL y mediciones de FPS con 22 coches.
