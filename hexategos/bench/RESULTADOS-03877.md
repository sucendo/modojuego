# HEXATEGOS · Calibración de la expansión territorial IA · 0.38.77

**Rama experimental:** `fix/hexategos-fase1-industria-20261010`  
**Malla real utilizada:** 510.762 hexágonos · 148.680 terrestres · 362.082 marinos · 3.064.560 enlaces de vecindad.  
**Ejecución automática:** https://github.com/sucendo/modojuego/actions/runs/38378835144  
**Resultado:** 77 smoke tests, 0 fallos.

## Resultados en tiempo de campaña

| Naciones | Antes a 5 min (0.38.76) | Ahora a 5 min (0.38.77) | Ahora a 10 min | Ahora a 20 min |
|--:|--:|--:|--:|--:|
| 150 | 2,12 % | 56,24 % | 94,34 % | 97,15 % |
| 250 | 2,59 % | 58,24 % | 96,32 % | 97,72 % |
| 350 | 3,06 % | 62,09 % | 97,14 % | 98,08 % |
| 500 | 3,16 % | 59,52 % | 96,64 % | 98,35 % |

### Qué mide y qué no mide

El benchmark lee y descomprime los archivos de topología **reales** de la malla L8 del proyecto, ejecuta **el mismo módulo `ai-expansion-03876.js` cargado por el navegador** y simula 1.200 segundos de campaña. Valora selección de frontera, asignación de territorio neutral, gasto de oro, bajas de escoltas y presupuesto CPU de la capa de colonización. Comprueba también los hitos de 5, 10 y 20 minutos.

**No es una partida completa del navegador.** Los capitales iniciales se distribuyen de forma determinista en tierra; el banco asigna 650 de oro y 250 soldados por nación e ingresos simulados de 0,70 oro/s. No simula la economía industrial completa, combates, guerras, diplomacia, carreteras, renderizado del mapa ni condiciones de un teléfono de gama baja. Por tanto, los porcentajes **no son una garantía** de que una partida real obtenga exactamente esa cobertura. La velocidad podría bajar cuando la tesorería, las tropas o el rendimiento se agoten.

### Optimizaciones incorporadas

- La colonización se limita a hexágonos neutrales conectados físicamente a una nación.
- La IA selecciona la frontera por relieve visible, accesibilidad costera, vecindad propia y compacidad; no consulta reservas geológicas, ni resultados agronómicos ajenos, ni recursos por descubrir.
- Presupuestos conservados: por colonización, 0,42 oro y 0,10 soldados de escolta, sin generar nuevos efectivos ni créditos. Se detiene al llegar a la reserva mínima.
- Búsqueda sobre fronteras recientes y muestras del snapshot compartido, sin barridos de 510.762 hexágonos por nación ni temporizadores propios.
- El número de naciones servidas y el máximo de asentamientos por visita se adaptan a los 148.680 hexágonos terrestres y a 150/250/350/500 naciones; tiempo de CPU adicional limitado a aproximadamente 3,1 ms por ciclo.
- Observaciones en los hitos de cinco, diez y veinte minutos mediante el snapshot estratégico preexistente. Se consultan desde **Acerca de** cuando está abierta una partida y se exponen por `window.HexategosExpansion03876.stats()`. El indicador del mapa puede llevar unos segundos de retraso.
- Al iniciar o cargar otra partida se limpian las colas incrementales, sin modificar el formato de guardado.

### Reproducción

Desde la raíz de `hexategos/`:

```sh
node bench/expansion-03877.mjs
```

Este benchmark forma parte también de `tests/smoke-03877.mjs`. Impone umbrales de regresión **únicamente al escenario del banco**: al menos 40 % terrestre a los 5 minutos, 75 % a los 10 y 85 % a los 20.

### Validación pendiente antes de integrar en main

1. Partida real de 5/10/20 minutos en navegador (no solo banco): comparar las mediciones de `Acerca de` con economía, reclutamiento, caminos, comercio y frentes activos.
2. Verificar fluidez móvil y tiempo del renderizado con cada configuración, especialmente 500 naciones.
3. Confirmar que pueden guardarse, exportarse, continuar y reimportarse las partidas avanzadas.
4. Recalibrar costes o límites si la nueva colonización desequilibra la economía, la diplomacia o la guerra frente al jugador.

No integrar `main/hexategos` sin esta validación interactiva.
