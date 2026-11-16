# Posiciones, afinidades y media efectiva · temporada 2026/27

## Demarcaciones disponibles

El motor diferencia **15 puestos**: GK (portero), CB (central), RB/LB
(laterales), RWB/LWB (carrileros), CDM (pivote), CM (mediocentro),
CAM (mediapunta), RM/LM (interiores de banda), RW/LW (extremos),
ST (delantero centro) y SS (segundo delantero). Los códigos antiguos
(POR, DFC, MCD, MCO, ED, EI, DC, CF, etc.) siguen siendo compatibles.

## Base de datos y procedencia

- Se amplía cada jugador de los 272 clubes con `primaryPosition`,
  `primaryPositionSource`, `secondaryPositions`, `versatility`,
  `versatilitySource` y `positionExperience`.
- Las fuentes de plantillas 2026/27 contienen frecuentemente categorías
  genéricas (portero, defensa, centrocampista y delantero) o una única
  demarcación. **No se presentan como verificadas** las secundarias que
  no están acreditadas: el juego las genera como compatibilidades
  *estimadas* (`sourceType: estimated-compatible`). La versatilidad
  creada sin dato externo también se etiqueta como *simulada*.
- El puesto principal previo se conserva. Las posiciones secundarias
  explícitas ya presentes en una partida se respetan y normalizan.
- La plantilla inicial 2026/27 se mantiene congelada hasta el mercado
  de invierno de 2027, según las reglas de la temporada. Este cambio
  no añade fichajes ni altera contratos, salarios o cláusulas.

## Penalización por jugar fuera de puesto

La media original no cambia. Para la demarcación asignada, el juego
calcula `media efectiva = redondear(media original × afinidad)`, con:

| Situación | Afinidad aproximada | Consecuencia |
| --- | --- | --- |
| Puesto natural | 100 % | Sin penalización |
| Secundaria compatible inferida | 88–96 % | Penalización leve |
| Demarcación relacionada | 61–93 % | Variable por salto posicional |
| Demarcación no relacionada | 60 % | Penalización importante |
| Portero como jugador de campo, o viceversa | 3 % | No viable |

La versatilidad matiza mínimamente los desplazamientos. La experiencia
en un puesto alternativo puede recuperar **hasta 4,5 puntos de afinidad**
sin superar nunca el rendimiento de la posición natural. Los once
titulares ganan experiencia al jugar partidos completos o periodos
modelados del encuentro. Cada partido solo otorga experiencia una vez;
no se inventan minutos ni puestos para los suplentes sin registro.

La simulación aplica la pérdida sobre el componente ofensivo/defensivo
que corresponde al futbolista y **no suma una segunda penalización**
genérica por inadaptación. La decisión de alineación optimiza la media
efectiva, no la ficha bruta del jugador.

## Interfaz y compatibilidad

- La pantalla de tácticas muestra puesto asignado, media efectiva,
  media original, afinidad, puesto principal, secundarias y versatilidad.
- La pantalla de alineación muestra la **media efectiva** para los
  titulares; reservas y no convocados conservan su media original.
- Al cargar partidas antiguas se generan los nuevos metadatos que
  falten sin reiniciar plantillas, medias ni contratos. El progreso
  posicional queda guardado con el jugador.

## Alcance de la actualización

Las 15 posiciones y su penalización están implementadas, pero las
secundarias y los nuevos roles detallados de cada futbolista no se
considerarán datos reales confirmados hasta contrastarlos individualmente
con fuentes fiables. La inferencia es una regla explícita del simulador,
no una afirmación biográfica.
