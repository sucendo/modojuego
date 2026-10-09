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
