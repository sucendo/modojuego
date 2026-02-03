# Planeta procedural (Babylon.js) — v2 (mar encaja + suavizado + auto-LOD + colores por cota)

- Babylon.js UMD (sin bundler, ideal para WAMP)
- Planeta: IcoSphere deformada con:
  - Continentes (macro)
  - Montañas FBM
  - Picos ridged
  - Cráteres
- Mar: malla con el MISMO topo/indices que el planeta (encaja perfecto), sin z-fighting.
- Suavizado (Laplacian smoothing) configurable
- Auto-LOD por distancia de cámara (opcional)
- Colores por cota (beach/low/mid/high/snow) con controles

## Ejecutar en WAMP
1) Copia en: C:\wamp64\www\planet-babylon-terrain-v2\
2) Abre: http://localhost/planet-babylon-terrain-v2/

## Offline
Descarga babylon.js y dat.gui y ponlos en /vendor, luego cambia los <script src> en index.html.


## v3 fixes
- Soldado (weld) de vértices del IcoSphere para evitar grietas/vertices sueltos al deformar.
- Clamp de alturas para evitar picos extremos.
- Mar: zOffset configurable y modo 'hug coast' para que la línea de costa no parezca flotante.


## v4
- Nuevo modo de mar: `oceanMode = patch` construye el océano solo con triángulos bajo el nivel del mar.
  Esto elimina la sensación de esfera superpuesta. Ajusta `oceanCoastFill` para cubrir más/menos costa.
- Se mantiene `sphere` por si lo quieres.


## v5
- Océano (patch o sphere) ya NO se ve por la cara trasera:
  - backFaceCulling activado (por defecto) y opción `seaDoubleSided`.
  - `needDepthPrePass = true` para materiales con alpha, evita efecto rayos‑X.


## v6 (más tipo Tierra realista)
- Terreno en PBR (vertex colors) y mar en PBR con reflejos de environment.
- Erosión térmica opcional (reduce 'ruido' y crea geología más natural).
- Colores por cota mejorados: línea de nieve depende de la latitud (más nieve en polos) y roca en pendientes.


## v7 (agua menos plástica + sin 'ver a través' del terreno)
- Recomendación: `seaAlpha=1.0` por defecto (evita problemas de ordenación de transparencias).
  Si bajas alpha, el material fuerza `needDepthPrePass` + `forceDepthWrite` + `ALPHABLEND`.
- Oleaje procedural: ruido animado que desplaza vértices del océano (controles: waveAmp/Scale/Speed/Octaves).
- Reflejos/fresnel configurables: seaReflect, seaFresnelBias, seaFresnelPower.


## v7c (agua sin movimiento + sin verse detrás)
- Por defecto: `wavesEnabled=false` (sin deformación/oleaje).
- Por defecto: `seaAlpha=1.0` y `seaZOffset=0` para evitar que el agua se "cuele" por delante en el borde.
- Si haces el agua translúcida (alpha<1): se activa DepthPrePass automáticamente.


## v8 (agua mejorada)
- Agua PBR con ClearCoat configurable (menos "plástico").
- Color por profundidad (costa turquesa → mar profundo oscuro) usando vertex colors.
- Espuma en la orilla (banda) sin texturas.
- Sin animación de oleaje (sin mover geometría).


## v8b fix (mar no se ve a través del terreno)
- Babylon limpia el depth por defecto entre rendering groups. Como el mar está en `renderingGroupId=1`,
  se veía detrás/a través del planeta. Se desactiva con:
  `scene.setRenderingAutoClearDepthStencil(1, false);`


## v9
- Subdivisions máximo subido a 99 (GUI y clamping defensivo).


## v11 (sin luz ambiente)
- Se elimina Hemispheric / ambient fill.
- `scene.ambientColor = (0,0,0)`.
- IBL (environmentTexture) queda opcional y por defecto apagado (`iblEnabled=false`).
  Si lo activas, añade luz ambiental; si lo desactivas, la única luz es el Sol.


## v11b
- Fix: el panel IBL se crea después de inicializar `params`.


## v11c
- Fix definitivo: `params` se declara antes de usarse (IBL/env).


## v12 (exportar/importar planetas)
- Botones en GUI: Guardar JSON / Cargar JSON.
- También: Guardar/Cargar en localStorage del navegador.
- El JSON incluye todos los `params` actuales (generación, agua, atmósfera, luz, etc.).


## v12b
- Añadido panel **Guardar / Cargar** en la GUI para exportar/importar la configuración del planeta en JSON.
- Incluye guardar/cargar en localStorage.


## v12d
- Fix: export/import filtra solo parámetros del planeta (terreno+mar+colores+atmósfera/nubes).
- Arregla el error de sintaxis de v12c (duplicados).
