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

El manifiesto `manifest.json` apunta a `svg/apex26_14-madrid-spain_2026-10-29.svg`,
una copia exacta del SVG `apex26_14-spain_circuito_completo (15).svg`
entregado por el usuario. Es la versión que utiliza **Cargar versión guardada**
desde el editor SVG de Madrid.

La edición (14) sigue disponible como `svg/apex26_14-madrid-spain_2026-10-28.svg`
y la BASE interna original permanece intacta en `svg/apex26_14-madrid-spain.svg`.
No se han reconstruido ni sustituido los elementos del nuevo SVG por datos de
la edición anterior.

Para probarla, elige **Madrid** en el editor SVG y pulsa
**Cargar versión guardada**. La importación guarda el override del
circuito mediante el flujo habitual y respeta los pianos y las
superficies del SVG (incluidos los asfaltos coloreados). Si fuese necesario,
**Restaurar BASE** retira el override de Madrid.

Pruebas: `node apex/tests/madrid-saved-svg.cjs` valida la referencia del
manifiesto, los pianos, escapatorias, carteles de frenada y el hash exacto del SVG del usuario.
`node apex/tests/svg-import-materials-browser.cjs` utiliza, por defecto,
el SVG apuntado por el manifiesto y comprueba el importador en el navegador.
