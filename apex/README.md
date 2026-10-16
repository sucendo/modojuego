# APEX Formula 26

Versión de desarrollo: **v0.12.2 · PRE-RELEASE**

Archivo fuente original:
`Apex_Formula_26_v5_230_62_8_6_7_6_4_17_CONTROL_CLASICO_GP4.html`

SHA-256 del HTML histórico (conservado como referencia):
`43753514205fac232d9b8c1d18765b712e61f4561ddb1388d764874df3b87384`

La versión web se reconstruye en el navegador desde los fragmentos exactos de `parts/` para evitar el límite de tamaño del conector de GitHub.

## Sistema visual v0.12.0

El mismo catálogo de 3 chasis (`A26`, `VXR`, `NOVA`) y 11 identidades APEX alimenta rivales WebGL y cockpit del jugador. En WebGL se mantienen coches 3D con 360° de giro, tres niveles de detalle, paneles de livery originales y detalles aerodinámicos. Los 16 ángulos de las láminas se conservan como referencias de validación, **no** como un atlas PNG instalado. El backend Canvas sigue siendo un fallback de tres orientaciones.

Pruebas de consola dentro del simulador: `apexCarVisualAudit()` y `apexCarVisualPipelineSelfTest()`.

## Geometría de coches v0.12.1

En el renderer WebGL2 los coches cercanos reciben morro alineado al alerón, pontones ampliados a proporciones coherentes, entradas laterales, fondo con deflectores, flaps, tirantes de suspensión inclinados, halo y difusor. Los LOD 0 y 1 siguen simplificados para móviles y parrillas de 22 vehículos. No se han modificado física, colisiones, IA ni los circuitos. Diagnóstico en consola: `apexCarGeometryV0121SelfTest()`.

## Referencias angulares v0.12.2

Render WebGL continuo y 16 referencias por coche; metadatos `viewIndex16`, `refAngle16`, `refAngle16Label`. Validaciones: `apexCarVisualAuditV0122()`, `apexCarAngleContinuityTest()`, `apexCarPerspectiveSymmetryTest()`, `apexCarAngleReferenceTable()`. Es una auditoría geométrica; las capturas WebGL y FPS siguen pendientes de validación manual.
