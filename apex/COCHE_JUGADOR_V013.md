# APEX Formula 26 · v0.13.0 · Coche del jugador y rivales

## Implementación
- Morro, ala delantera, ruedas delanteras y suspensión utilizan una sola función de geometría WebGL para ambos tipos de coche: `webglPushApexFrontAssembly()`.
- Los chasis A26/VXR/NOVA conservan sus propios coeficientes de proporción, desde `apexCarModelVisual()`.
- El jugador utiliza `webglRivalVariant(teamKey, specOverride)` con el `carSpec` real y los colores del catálogo o personalizados.
- Anclaje de cámara piloto: el eje visual del chasis está 0,62 m por delante de los ojos, sin desplazar el coche físico.
- El SVG se limita a cockpit interior, halo, espejos y volante funcional. El morro SVG redundante se elimina únicamente en WebGL.
- Si no hay WebGL2, la cabina y los neumáticos SVG anteriores continúan funcionando.
- Los logotipos siguen siendo los ficticios APEX. El diseño del interior se conecta al color, patrón y emblema de la escudería.
- Las 16 referencias de v0.12.2 siguen siendo metadatos y pruebas, no un atlas PNG publicado.

## Diagnóstico
```js
apexPlayerSharedCarAudit()
apexCarVisualAuditV0122()
```
## Limitaciones
Todavía queda trabajo en el interior detallado y los materiales, además de validar en ejecución las vistas WebGL y FPS. La representación del coche propio comparte la geometría frontal, pero el interior se mantiene en SVG por compatibilidad. No se ha incorporado un coche propio completo 3D visible desde cámaras exteriores (todavía no disponibles).
