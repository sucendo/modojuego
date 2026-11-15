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
| **Total** | **272** | **8.257** | |

Se seleccionan como máximo 27 jugadores por equipo para dejar tres fichas libres.
Esto deja 7.238 jugadores distribuidos en las plantillas iniciales.

## Qué es real y qué se simula

- Se conserva el nombre y la posición publicada y, cuando figura en la fuente,
  el dorsal o la edad. En datos independientes `rosterVerified` es `false`.
- La **valoración**, el **salario**, los **años de contrato** y cualquier
  **cláusula de rescisión** proceden del modelo económico de PC Fútbol, no de
  la fuente. Se marcan como estimaciones para evitar atribuirles precisión real.
- Una nueva partida comienza con las plantillas anteriores, sin aplicar las
  salidas o fichajes generados por IA de partidas anteriores. Durante la
  temporada, los traspasos simulados se limitan según el mercado conservador.
- Las listas publicadas son una instantánea de noviembre de 2026; futuros
  cambios reales no se incorporan automáticamente a partidas guardadas.

## Verificación

`node --test pcfutbol/tests/*.test.mjs`

Los tests verifican nombres de referencia, demarcaciones mínimas, cobertura
de las 272 plantillas y la distinción entre fuentes oficiales e independientes.
