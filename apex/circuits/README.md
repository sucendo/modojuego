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

El manifiesto `manifest.json` apunta a `svg/apex26_14-madrid-spain_2026-10-28.svg`,
importada del original del usuario `apex26_14-spain_circuito_completo (14).svg`.
Es la versión que utiliza **Cargar versión guardada** desde el editor SVG
de Madrid. No sustituye ni modifica la BASE interna de APEX; la versión
anterior `svg/apex26_14-madrid-spain.svg` se conserva.

Para probarla, elige **Madrid** en el editor SVG y pulsa
**Cargar versión guardada**. La importación guarda el override del
circuito mediante el flujo habitual y respeta los pianos y las
superficies del SVG (incluidos los asfaltos coloreados). Si fuese necesario,
**Restaurar BASE** retira el override de Madrid.

Pruebas: `node apex/tests/madrid-saved-svg.cjs` valida la referencia del
manifiesto, ambos lados de pianos y las superficies asfaltadas coloreadas.
`node apex/tests/svg-import-materials-browser.cjs` utiliza, por defecto,
el SVG apuntado por el manifiesto y comprueba el importador en el navegador.
