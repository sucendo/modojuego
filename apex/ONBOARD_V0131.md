# APEX v0.13.1 — revisión del coche desde el piloto

Referencia: captura de APEX v0.13.0 aportada por el usuario (720 × 450).

## Mejoras
- Corrección del flanco del neumático: la franja de compuesto pasa de triángulos concéntricos con centro común a un anillo de anchura pequeña y no invade la llanta.
- Caras de llanta oscuras, tapas, radios y tuerca visibles según nivel de detalle.
- Cámara/posición relativa del monocasco: offset visual de 0,62 a 0,87 m. Sin alterar la localización del jugador ni el trazado.
- Ala con planos de ataque, láminas escalonadas, endplates y soportes angulados. Morro de tres secciones con resaltos.
- Horquillas de suspensión con tres tirantes no duplicados al subir LOD.
- Montante central del halo al 88% de la anchura previa y sombreado progresivo del borde de los pontones para suavizar unión WebGL/SVG.
- Catálogos A26/VXR/NOVA, equipos y emblemas ficticios sin cambios. Conservado fallback Canvas.

## QA
`apexOnboardV0131Audit()`, `apexPlayerSharedCarAudit()` y `apexCarVisualAuditV0122()`.
La prueba automática no sustituye la verificación real del aspecto y FPS en navegador, especialmente con 22 coches y lluvia.

## Sin cambios
Conducción, telemetría, interfaces, cronometraje, boxes, 23 circuitos, SVG de circuitos, guardados, IA y colisiones.
