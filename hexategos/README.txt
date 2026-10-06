HEXATEGOS 0.35.2 · MAPA GEOPOLÍTICO

Base:
- HEXATEGOS 0.35.1 Acerca de / Historial.
- HEXATEGOS 0.35.0 Doctrina Geopolítica.
- HEXATEGOS 0.34.2 Stability Update.

Novedades 0.35.2:
- Nuevo cuarto modo de mapa: GEOPOLÍTICA.
- El modo se integra en el botón Mapa existente: Político → Terreno → Suministro → Geopolítica.
- El jugador puede seleccionar cualquier nación y analizar el mundo desde su perspectiva.
- Colores por relación:
  * nación observada,
  * rival estratégico,
  * guerra,
  * alianza,
  * pacto de no agresión,
  * comercio,
  * estado tapón,
  * potencia a contener.
- Se dibuja el radio de influencia de la nación observada.
- Líneas sobre el globo muestran rivalidad, contención, estados tapón y hasta cuatro alianzas.
- Panel de lectura con doctrina, esfera regional, rival, estado tapón y tres prioridades nacionales.
- Si se observa una IA, el panel resume también su relación geopolítica con el jugador.
- El modo se conserva al guardar/cargar cuando corresponde y usa la infraestructura de modos de mapa existente.
- Diseño responsive para escritorio y móvil.

Diagnóstico de desarrollo:
- No hay botón visible para usuarios.
- Activación desde consola: HexategosGeoMap0352.debug(true)
- Desactivación: HexategosGeoMap0352.debug(false)
- Snapshot técnico: HexategosGeoMap0352.snapshot()
- Validación: HexategosGeoMap0352.validate()
- En diagnóstico se añaden potencia, contactos diplomáticos, amenaza, agravio y coste del overlay.

Rendimiento:
- No se añaden setInterval.
- No se añaden MutationObserver.
- La coloración reutiliza las celdas ya visibles del render.
- La paleta diplomática se cachea y se reconstruye solo cuando cambia la nación observada o el periodo de campaña.

Historial:
- Acerca de incorpora ya la entrada 0.35.2.

Ramas estables:
- hexategos-stable-0.33-r8
- hexategos-stable-0.34.2
- hexategos-stable-0.35.1
