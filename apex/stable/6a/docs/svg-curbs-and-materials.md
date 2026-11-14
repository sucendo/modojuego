# Pianos y pintura de escapatorias importados desde SVG

La importación anterior convertía `curb-left`/`curb-right` en rangos longitudinales
para activar una banda automática junto a la pista. Por eso mover un piano
lateralmente, cambiar su forma o situarlo sobre otra parte de la escapatoria
no se reflejaba como en el dibujo. Las superficies sólo leían `data-apex-color`
y después imponían el color genérico del material, ignorando el `fill` de Boxy.

## Comportamiento corregido

- Los trazos activos con rol `curb-left`/`curb-right` guardan sus recorridos X/Z
  transformados, con extremos y subpaths separados. La biblioteca no se importa.
- `data-apex-width` define la anchura física en metros; si falta se usan 1,25 m.
  El dash SVG aporta la longitud de las franjas, con un intervalo de seguridad.
- Una malla de franjas rojas/blancas se compila una vez por sesión. Reutiliza
  rasante/peralte y los lotes de mundo existentes en WebGL y Canvas, sin rellenar
  el recinto accidental que encierra un path abierto ni duplicar el piano antiguo.
- Un índice espacial de 32 m permite consultar el contacto con el piano real.
  Se conservan los coeficientes de agarre existentes; cambia su ubicación para
  coincidir con el trazo, incluso si el piano se mueve dentro de la pista.
- Eliminar todos los pianos de `APEX_ACTIVE_CURBS`, o declarar
  `data-apex-curbs-authoritative="true"` en el SVG raíz, conserva su ausencia.
  Los SVG base sin autoría de pianos mantienen el fallback anterior.
- Las zonas `surfaceZone` leen `data-apex-color` y el `fill` computado del SVG
  (incluye estilo inline, clases e herencia). El material se sigue tomando de
  `data-apex-surface`: asfalto azul, rojo o amarillo sigue siendo ASFALTO.
- La opacidad decorativa del editor no cambia las propiedades físicas del suelo.
  `drivable-area` sigue siendo una máscara de área transitable, no pintura.

El perfil importado pasa a revisión 23091 y la caché compilada a 230685.
Los SVG de usuario ya guardados con su maestro en IndexedDB se vuelven a
interpretar automáticamente al cargar el circuito, conservando el archivo
original y los demás objetos. No requiere modificar el SVG ni borrar partidas.
Si la carrera ya estaba abierta, inicia otra sesión para cargar la geometría
actualizada; la pista física no se sustituye bajo un coche en marcha.

## Validación

`node apex/tests/svg-curbs-audit.cjs`: franjas, anchura, contacto, subpaths,
movimiento lateral, vacío explícito y sintaxis del simulador ensamblado.

Con el repositorio servido en :8765:
`node apex/tests/svg-import-materials-browser.cjs` prueba importación,
movimiento, color, tres cámaras, Canvas, persistencia/migración y borrado total.
`APEX_SVG_FIXTURE=/ruta/al/circuito.svg` permite ejecutar el caso con el SVG de
Madrid aportado: 33 pianos activos y escapatorias ASFALTO con los colores
`#2d50ac`, `#cf2830` y `#e0e65e`. `APEX_AUDIT_DEVICE=mobile` activa emulación móvil.
Las pruebas no sustituyen las mediciones en un dispositivo móvil físico.
