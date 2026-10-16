# APEX v0.13.2 — Tres cámaras y refinamiento de cockpit

## Cámaras de conducción
- **CAM / Piloto:** posición original con volante y cockpit SVG funcional. Carrocería delantera WebGL compartida.
- **TV / T-cam:** altura visual 1,62 m, 0,35 m detrás, inclinación −7,2°. Muestra el coche 3D sin overlay de cabina.
- **EXT / Trasera elevada:** altura 2,88 m, 5,7 m detrás, inclinación −14°, posición suavizada y coche 3D completo.

## Controles
- Tecla C o botón CAM/TV/EXT del HUD, también en móviles.
- Menú CONDUCCIÓN / ATAJOS: Cambiar cámara ahora está activo.
- Preferencia recordada en localStorage \`apex26.camera.mode.v1\` entre sesiones.
- Si WebGL2 no está disponible, se conserva la cámara del piloto sobre Canvas2D.

## Geometría e integración
- \`driverCamera()\` usa un preset de cámara por vista. \`worldToCamera()\` calcula inclinación vertical alrededor del ojo físico, manteniendo el modo de inspección anterior.
- \`webglPushPlayerCameraCar3D()\` reutiliza \`webglPushRivalCar3D()\` para que las cámaras exteriores muestren el monoplaza completo.
- Interior: acabado adicional con carbono, líneas de pintura y remaches sobre los laterales en la cámara de piloto.
- Sin cambios de física, controles de conducción, cronometraje, colisiones, guardados de partida ni las 23 pistas.

## Comprobación
\`\`\`js
apexCameraRigSelfTest()
apexPlayerSharedCarAudit()
apexCarVisualAuditV0122()
\`\`\`

Validar manualmente los tres puntos de vista en varias curvas, horquillas, boxes y túneles con WebGL2 y móviles. Medir FPS con 22 rivales. Un test de sintaxis o geometría no sustituye la revisión visual del navegador.

## Limitaciones
No hay texturas fotorrealistas equivalentes a la referencia de cockpit. En una horquilla estrecha la cámara trasera puede necesitar detección de muros/terreno, pendiente de prueba y ajuste. El modo Canvas mantiene sólo cámara de piloto.
