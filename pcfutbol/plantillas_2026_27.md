# Plantillas 2026/27: trazabilidad y límites

Las 14 ligas del simulador incluyen 272 clubes, todos con plantilla inicial
2026/27: **156** de fuentes oficiales de liga/club y **116** de publicaciones
independientes identificadas por URL en `squadReference`.

| Fuentes | Clubes | Registros de jugadores | Etiqueta interna |
| --- | ---: | ---: | --- |
| LaLiga, Premier League, Bundesliga, Eredivisie, Lega Serie A/B | 154 | 4.681 | `official-roster` |
| Webs del Sabadell y Celta Fortuna | 2 | 51 | `official-roster` |
| Fmag (Ligue 1 y Primeira Liga) | 36 | 932 | `published-roster` |
| PSRwatch (Championship) | 24 | 926 | `published-roster` |
| Voetbal International (Eerste Divisie) | 20 | 648 | `published-roster` |
| BallValue (Ligue 2 y Liga Portugal 2) | 36 | 1.019 | `published-roster` |
| Complementos de club, liga y UEFA (4 equipos ya contabilizados) | — | 18 | Se conserva la etiqueta original del club |
| **Total** | **272** | **8.275** | |

Se seleccionan como máximo 27 jugadores por equipo para dejar tres fichas libres.
Esto deja 7.248 jugadores distribuidos en las plantillas iniciales.
Los complementos recuperan atacantes ausentes de NEC y Willem II y porteros
suplentes de Marsella y Arouca, con referencias individuales en
`squadSupplements2026.js`. No alteran el número de equipos.

## Qué es real y qué se simula

- Se conserva el nombre y la posición publicada y, cuando figura en la fuente,
  el dorsal o la edad. En datos independientes `rosterVerified` es `false`.
- Cuando la fuente solo distingue **defensa, centrocampista o delantero**, el
  juego reparte las subposiciones en `RB/LB/CB`, `CDM/CM/CAM` y `RW/LW/ST`,
  priorizando una demarcación previa reconocible y los dorsales como indicio.
  La atribución más detallada es **una estimación**, identificada mediante
  `positionEstimated: true`: no debe presentarse como dato exacto del club.
  Las posiciones disponibles en el juego son `GK, RB, LB, CB, CDM, CM, CAM,
  RW, LW, ST`.
- La **valoración**, el **salario**, los **años de contrato** y cualquier
  **cláusula de rescisión** proceden del modelo económico de PC Fútbol, no de
  la fuente. Se marcan como estimaciones para evitar atribuirles precisión real.
- Una nueva partida comienza con las plantillas anteriores, sin aplicar las
  salidas o fichajes generados por IA de partidas anteriores. **Durante el
  mercado de verano 2026 la IA no mueve a ningún jugador**: las plantillas
  iniciales se conservan hasta la ventana de **enero de 2027**. Entonces la
  IA puede hacer como máximo dos fichajes y dos ventas por club en la primera
  temporada, manteniendo al menos 9 de sus 11 titulares originales. Las
  operaciones manuales que decida hacer el usuario con su club siguen disponibles.
- Las listas publicadas son una instantánea de noviembre de 2026; futuros
  cambios reales no se incorporan automáticamente a partidas guardadas.

## Verificación

`node --test pcfutbol/tests/*.test.mjs`

Los tests verifican nombres de referencia, demarcaciones mínimas, cobertura
de las 272 plantillas y la distinción entre fuentes oficiales e independientes.
