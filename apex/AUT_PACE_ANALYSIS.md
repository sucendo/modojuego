# APEX AUT — primera fase de optimización de tiempos (03-11-2026)

## Estado
Esta fase **mide**, no incrementa la potencia, cambia la física ni modifica la trazada.
La referencia universal introducida en el main anterior sigue intacta.
El objetivo de Madrid es una **vuelta lanzada cercana a 120 s**, no una vuelta desde parado.

## Cómo tomar una medición
1. Entra a **Entrenamiento** sin tráfico y usa la misma configuración de coche, ruedas, combustible, clima y dificultad.
2. Activa conducción automática y cambia el botón de grabación de TEL a **COMPLETA**; **EVENTOS** no registra muestras suficientes para medir sectores.
3. Completa al menos tres vueltas (la primera es desde parado; las siguientes son lanzadas).
4. Exporta **TEL → EXPORTAR SESIÓN · JSON**.

## Datos nuevos
- `autPaceAnalysis.available`: indica si hay muestras FULL de AUT para el informe.
- `autPaceAnalysis.intervals`: intervalos de 100 metros con velocidad promedio observada, tiempo observado, distancia cubierta, causa dominante y reducción del objetivo.
- `autPaceAnalysis.hotspots`: 12 tramos con mayor exposición a limitadores de velocidad, ordenados por `limiterReductionKphSeconds`.
- `autPaceAnalysis.stageReductionKphSeconds`: reducciones **incrementales** atribuidas a GEOMETRY, LOCAL_RISK, STABILITY, TRAFFIC y BRAKE_COMMIT. No suma la misma caída cinco veces.
- `autPaceAnalysis.completedFlyingLaps`: tiempo **muestreado** y cobertura por vuelta lanzada. Se incluyen solo vueltas a partir de la segunda con >=85% de cobertura de pista. Para cronometrar oficialmente deben usarse los eventos de meta y el tiempo de sesión.
- `autPaceAnalysis.fastestSampledFlyingLap`: referencia comparativa de los tramos medidos, **no** cronometraje oficial ni predicción de 2:00.
- `samples[].preCommitTargetKph`: objetivo de velocidad antes de la retención temporal de frenada.
- `summary.autPaceAnalysis`: resumen pequeño del resultado.

`kph·s` (reducción en km/h integrada durante segundos) es una métrica de **intensidad y persistencia**. **No equivale a segundos recuperables**. Una limitación puede ser indispensable por agarre, muro, lluvia, tráfico o estabilidad.

## Puertas de validación
- `node apex/tests/autopilot-pace-analysis.cjs`: datos válidos, vueltas lanzadas y distancia medida; EVENTOS/OFF, pausas y marcha atrás; suma de contribuciones sin doble contabilización.
- CI existente: verificación de referencia universal en cinco circuitos, auditoría diferencial en Chromium y resistencia Madrid en entrenamientos a FPS bajos.
- Hasta disponer de evidencia de telemetría de vueltas completas, **no** retirar `MADRID_COMPLEX`, relajar la frenada a ciegas ni declarar la meta de 120 s conseguida.

## Siguiente fase
Comparar los `hotspots` en Madrid, Mónaco, Spa, Monza y Suzuka. Después calibrar **de forma universal** una envolvente de velocidad de curvatura + agarre, recorridos hacia atrás (frenada) y hacia delante (aceleración), y una trazada que optimice tiempo en vez de solo curvatura. Hacer A/B contra main bajo condiciones idénticas y descartar ajustes que aumenten repetidamente impactos o no terminen las vueltas.
