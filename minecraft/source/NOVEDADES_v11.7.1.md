# Minecraft.js 11.7.1 · Vista de prueba sin WebGL

La apertura de la vista publicada permitió verificar que el navegador remoto de revisión tiene WebGL deshabilitado y no puede crear el renderer. La página quedaba sin escena ni interacción.

La vista de prueba captura ese error y carga una alternativa isométrica Canvas 2D, conservando exactamente el modelo `WaterEnvironment`, el clima seleccionado y las acciones `clearSurface` de escoba/pico. Cambia la indicación de controles: esa alternativa permite seleccionar losetas, pero no girar la cámara. Con WebGL disponible continúa usando la escena 3D y el dibujo real de capas del juego. No modifica el renderer del juego completo ni ninguna partida.

Se recompilan ambas entradas. La física, el guardado y las herramientas mantienen las 406 pruebas superadas de 11.7.0. La verificación del 3D y los FPS en el móvil siguen pendientes.
