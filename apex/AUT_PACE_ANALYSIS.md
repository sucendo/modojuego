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

## Coste de planificación y medición A/B

La referencia de trazada del PR #113 ya se construye al preparar el circuito.
En conducción se repetían consultas de tangente del SVG, lecturas del entorno
para celdas de muro ya resueltas y cálculos del límite físico en vértices que
no podían reducir la velocidad objetivo. La tangente se guarda por segmento en
el circuito cargado. Las celdas de muro conservan el primer punto consultado y
las mismas reglas de colisión. La poda conserva esa secuencia de consultas y
descarta solo el cálculo de velocidad de curva cuando la distancia de frenada
ya impide bajar el objetivo. En el caso aislado de seco/mojado y tres niveles
de agarre se obtienen los mismos objetivos con 16 275 cálculos frente a 17 487.

El banco diferencial usa el reloj y los sectores de producción, el mismo SVG
guardado y la misma semilla. El JSONL registra velocidad, freno, acelerador,
distancia en planta, error lateral RMS, episodios fuera de pista y contactos
con muros. Las mínimas por curva se muestrean cada 0,5 s en las zonas de curva
del circuito. El umbral de tiempo por defecto exige paridad con la base del PR.
Para evaluar un cambio de ritmo, usar `APEX_AUTO_MIN_LAP_SAVING_SEC=.2` al
ejecutar el comparador.

```bash
# Servir el repositorio desde la raíz en 127.0.0.1:8765.
BASELINE_REF=a87a02c60 APEX_AUTO_CIRCUITS=14-spain APEX_AUTO_TRAFFIC=solo \
  APEX_AUTO_SECONDS=390 node apex/tests/autopilot-audit.cjs > madrid.jsonl
node apex/tests/autopilot-time-compare.cjs madrid.jsonl
```

Para medir el renderizado, repetir el banco con `APEX_AUTO_RENDER_SECONDS=12`.
El bloque de renderizado usa el bucle de producción por separado y recoge
percentiles de frame, tiempos de CPU por pasada, draw calls, triángulos y
memoria disponible del navegador. El tiempo del controlador se mide dentro de
la repetición acelerada. La memoria del heap es una instantánea aproximada y
los FPS de Chromium con SwiftShader describen renderizado por software.
