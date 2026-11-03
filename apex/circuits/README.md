# Circuitos APEX Formula 26

Esta carpeta contiene las versiones editables y progresivamente completadas de los circuitos usados por APEX Formula 26.

## Estructura

- `svg/`: geometría y elementos visuales/físicos de cada circuito.
- `json/`: datos estructurados del circuito: altimetría, anchura, peralte, pit lane, boxes, timing, curvas, cartelería, zonas transitables y otros metadatos.

## Convención recomendada

Usar el mismo identificador base para el SVG y el JSON de un mismo circuito.

Ejemplo:

- `svg/apex26_14-spain.svg`
- `json/apex26_14-spain.json`

Cuando trabajemos sobre una revisión intermedia, podremos conservar temporalmente un sufijo de versión hasta validarla.

## Madrid: versión guardada seleccionada

El manifiesto `manifest.json` apunta al SVG
`svg/apex26_14-madrid-spain_2026-11-03.svg`, obtenido de
`apex26_14-spain_circuito_completo (16).svg` entregado el 03/11/2026.
Es la versión que utiliza **Cargar versión guardada** desde el editor de
Madrid. La única modificación del SVG almacenado es la adición del atributo
de raíz `data-apex-brake-boards-authoritative="true"`, que no altera
su dibujo, geometría ni los carteles de la edición original.

El archivo contiene **34 carteles de frenada activos** y 4 plantillas en
la biblioteca del SVG (38 elementos con role `distance-board` en total).
La anterior edición (15) contenía **92 carteles activos**, por lo que
esta nueva edición elimina 58. Los activos son ahora autoritativos:
APEX no recuperará automáticamente los carteles borrados ni los
sustituirá con series generadas. El importador respeta igualmente
las ediciones que contengan carteles pero no el atributo, y la
exportación conserva la autoría para permitir borrar incluso todos.

El manifiesto mantiene el JSON de Madrid
`json/apex26_14-madrid-spain_2026-10-29.json`. La carga aplica
**primero el JSON y después el SVG (16)**, conservando los colores
amarillo `#f2c500` y rojo `#d51f27` de los pianos, y el
peralte progresivo de La Monumental (T12) hasta **13,4957°**.

La edición anterior (15) se conserva en
`svg/apex26_14-madrid-spain_2026-10-29.svg`; la (14), en
`svg/apex26_14-madrid-spain_2026-10-28.svg`, y la BASE, en
`svg/apex26_14-madrid-spain.svg`.

Para probarla, elige **Madrid** en el editor SVG y pulsa
**Cargar versión guardada**. La importación guarda el override del
circuito mediante el flujo habitual y respeta los pianos y las
superficies del SVG (incluidos los asfaltos coloreados). Si fuese necesario,
**Restaurar BASE** retira el override de Madrid.

Pruebas: `node apex/tests/madrid-saved-svg.cjs` valida la referencia del
manifiesto, los pianos, escapatorias, carteles de frenada y el hash exacto del SVG del usuario.
`node apex/tests/svg-import-materials-browser.cjs` utiliza, por defecto,
el SVG apuntado por el manifiesto y comprueba el importador en el navegador.
Las pruebas de integración verifican que solo aparecen 34 carteles activos,
que no reaparecen los 58 eliminados y que el estado sobrevive una recarga.
