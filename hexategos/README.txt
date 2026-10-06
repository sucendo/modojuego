HEXATEGOS 0.35.3 · PANELES MOVIBLES

Base:
- HEXATEGOS 0.35.2 Mapa Geopolítico.
- HEXATEGOS 0.35.1 Acerca de / Historial.

Novedades 0.35.3:
- Se establece como norma de interfaz que los diálogos y paneles flotantes nuevos puedan reposicionarse.
- El panel del mapa Geopolítica es ahora arrastrable desde su cabecera.
- La ventana Acerca de también puede moverse.
- Las posiciones se guardan localmente.
- Los paneles se mantienen siempre dentro del viewport, también tras redimensionar la ventana.
- El encabezado geopolítico se vuelve a registrar tras cambiar de nación, por lo que no pierde la capacidad de arrastre.
- Nueva API reutilizable: HexategosMovablePanels0353.register(panel, handle, key).
- Sin MutationObserver y sin nuevos temporizadores periódicos.

Comportamiento del mapa Geopolítica:
- Si no hay otra nación seleccionada, el análisis usa la nación del jugador.
- Si se selecciona territorio de otra nación, el panel pasa a mostrar esa nación.
- El panel muestra doctrina, esfera, rival, estado tapón, prioridades y relación con el jugador.

Ramas estables:
- hexategos-stable-0.33-r8
- hexategos-stable-0.34.2
- hexategos-stable-0.35.1
- hexategos-stable-0.35.2
