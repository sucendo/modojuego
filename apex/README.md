# APEX Formula 26

Versión de desarrollo: **v0.13.2 · PRE-RELEASE**

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

## v0.13.0 · Chasis común jugador/rivales

WebGL dibuja morro, ala, ruedas y suspensiones del jugador utilizando la misma rutina geométrica `webglPushApexFrontAssembly()` que los rivales. El cockpit SVG mantiene el habitáculo, volante, espejos y controles; la vista Canvas conserva el gráfico anterior como respaldo. Colores y chasis se leen del catálogo compartido. Diagnóstico en consola: `apexPlayerSharedCarAudit()`. No se ha añadido una cámara exterior jugable ni se han cambiado física o colisiones. Pendiente inspección visual y FPS en dispositivos reales.

## v0.13.1 · Refinado de onboard

Corregida la llanta con anillo fino del compuesto en lugar de pintar el disco; neumático cilíndrico con bandas y radios, alerón delantero multielemento menos plano, tres tirantes inclinados de suspensión, morro mejor perfilado y menos piezas superpuestas. Cámara del jugador ligeramente más retrasada, pilar del halo adelgazado e integración de sombras del monocasco. Los 11 equipos mantienen sus colores y variantes; física, IA, circuitos y guardados sin cambios. Prueba geométrica: `apexOnboardV0131Audit()`. Requiere comprobación visual y de FPS en carrera.

## v0.13.2 · Cámaras

C activa CAM (piloto) → TV (cámara superior) → EXT (persecución elevada). También hay botón CAM en pantalla y acción en el menú Conducción. La cámara seleccionada se guarda en `apex26.camera.mode.v1`. Las cámaras externas sólo operan en WebGL2; Canvas conserva cockpit. Las cámaras del inspector no se modifican. Diagnóstico: `apexCameraRigSelfTest()`.
