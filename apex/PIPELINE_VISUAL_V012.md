# APEX v0.12.0 — pipeline visual implementado (fase 1)

Fecha: 2026-10-15. Fuente: main actual. Estado: integración técnica, no equivalencia fotográfica.

## Qué cambia realmente

- Definición compartida `apexCarVisualBlueprint(teamKey)` (11 escuderías, 3 chasis, geometría y librea APEX).
- `playerCarVisualProfile()` consume ese catálogo (colores y geometría del coche del jugador).
- `webglRivalVariant()` consume el mismo catálogo. No se bifurca física ni IA.
- Paneles 3D de decoración, perfil aerodinámico, toma superior y aletas sólo en LOD2 de los rivales WebGL.
- Conserva el backend WebGL tridimensional continuo, sin carteles/logos oficiales.
- Indices de 16 ángulos disponibles como referencia/diagnóstico sobre el sistema 3D; Canvas de emergencia mantiene frontal/lateral/trasera.
- Se conserva el renderizado de cockpit original, con controles y telemetría.

## Limitaciones expresas

- Las láminas PNG suministradas **no** se integran como texturas ni se publican: contienen marcas reales y no corresponden a las marcas APEX.
- Todavía no hay exportación de un atlas final renderizado de 16 vistas ni cockpit fotorrealista reconstruido desde las fotos.
- No se cambia cámara/piloto ni se habilita una cámara exterior jugable en este commit.
- Integración estática sin un banco de capturas WebGL de los 23 circuitos: debe validarse visualmente en navegador.

## Contratos y pruebas manuales

1. En cada equipo, arrancar carrera y comprobar morro, pontones, alerones, casco, luz trasera y color.
2. Inspeccionar vistas frontal, lateral y trasera; confirmar ausencia de piezas sobrepuestas y de fugas de polígonos en LOD2.
3. Comparar cockpit propio con la livery seleccionada y con `apexCarVisualAudit()`.
4. Ejecutar `apexCarVisualPipelineSelfTest()` (11 equipos × 16 referencias = 176 orientaciones).
5. Revisar móviles/WebGL2 y fallback Canvas; medir FPS con 22 coches.
6. Verificar guardados, cronometraje y giroscopio; el sistema no altera dichos módulos.
