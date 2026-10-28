# Vehicle studio: team design references

The SVGs in `js/team-car-preview-9a.js` are original visual interpretations of the real-team references already assigned by `teamCatalog.inspiredBy`. They are not engineering replicas or a claim that these contours reproduce exact 2026 aerodynamic specifications. Some supplied references and launch imagery represent different car versions or seasons.

These designs apply only to the Vehicle / Team showroom. They do not modify the racing mesh, physics, performance, saved team keys, palette storage, or team logos.

| APEX team | Catalogue reference | Distinguishing showroom treatment |
| --- | --- | --- |
| McRaven Racing | McLaren | Broad curved downwash pods, dark inset surfaces, flowing edge stripe, long tapered nose, four wing blades. |
| Meridian Grand Prix | Mercedes | Narrower stepped shoulders, shelf-like pods, shallow slot inlets, central contrasting spine, longer nose. |
| Ferrazzi Corse | Ferrari | Full rounded primary-colour pods, wider engine shoulders and nose root, paired longitudinal lines, three wing blades. |
| Red Bison Racing | Red Bull Racing | Pinched engine tail, forward pod extension, high inlet cut, narrow nose, swept wing and chevron panels. |
| Racing Bisons | Racing Bulls | Oval extended pods, moderate engine waist, rectangular inlet lip, split paint panels and three wing blades. |
| Alpinor F1 Team | Alpine | Angular pod channels, diagonal inlet opening, full-width accent bands, narrow tip and wide nose shoulders. |
| Hassler Motorsport | Haas | Straighter box-like pod shoulders, rectangular inlets, broader short nose and transverse graphic blocks. |
| Auron Motorsport | Audi | Faceted pod outline, diagonal inlet lip and paint cuts, compact engine waist and three wing blades. |
| Willmont Racing | Williams | Smooth swept pods, rounded inlets, long nose, contrasting pod panels and fine longitudinal keylines. |
| Aston Marlow Racing | Aston Martin | Tight engine tail, deeply cut curved shoulders, shallow inlets, narrow nose and spear-shaped accents. |
| Cadara Racing | Cadillac | Broad conventional shoulders, square inlet lip, shorter wider nose and contrasting upper/lower body halves. |

All primary, secondary and accent paint masks use the existing palette roles. Silver, carbon and white finishes retain those roles. Tyres, carbon floor, suspension and the basic cockpit structure are shared components; body, pod, inlet, engine-cover, nose and wing treatments differ. Common rules and construction keep all cars recognisable as modern F1 cars.

## Visual references

The user supplied overhead McLaren, Ferrari, Red Bull and proposed McRaven showroom images. Additional team launch/car pages consulted:

- [Mercedes W17](https://www.mercedesamgf1.com/car/2026) and [launch design](https://www.mercedesamgf1.com/news/mercedes-amg-f1-2026-challenger-w17-revealed).
- [Audi R26, including overhead studio view](https://www.audif1.com/en/audi-r26-car).
- [Aston Martin design discussion](https://www.astonmartinf1.com/en-GB/news/feature/undercut-adrian-newey-wants-you-to-keep-an-open-mind).
- [Williams FW48 gallery](https://www.williamsf1.com/articles/b299bc9b-de99-4e81-9675-851ac2ed0fed/discover-our-fw48-livery-up-close-and-claim-the-badge).
- [Alpine A526](https://www.alpinef1.com/news/introducing-the-a526).
- [Haas VF-26 launch](https://haasf1team.com/news/tgr-haas-f1-team-reveals-vf-26-design-livery).
- [Racing Bulls launch](https://www.visacashapprb.com/int-en/2026-car-reveal).
- [Cadillac launch](https://www.cadillacf1team.com/news/cadillac-formula-1-r-teams-2026-livery-debuts-on-track).

## Regression check

`tests/vehicle-studio-9a-browser.cjs` renders all 11 designs with an identical neutral palette and identical input dimensions, removes text, and compares all 55 image pairs. It also checks independently different pod, inlet, engine-cover, nose and front-wing path geometry, validates SVG parsing and bounds, and runs the existing selection, palette, finish, persistence and responsive-layout checks.

## Saved paint choice

The team's geometry is fixed by its catalogue key. Paint style changes cannot substitute another team's body, nose, pods, engine cover, wings, cockpit or tyres. The former `designKey` argument is ignored by `markup`, and `build` always uses the selected sporting team's geometry.

“Decoración del coche” offers Original de escudería, Liso, Franja central, Doble franja, Franjas diagonales, Rayas, Damero, Manchas, Jaspeado, Camuflaje and Ondas. All patterns are deterministic SVG paint tiles, clipped to the existing paintable body/pod/wing surfaces. They use the existing primary, secondary and accent colours. The original style retains the team's native livery masks.

Paint preferences are independent per team under `apex26.vehicle-studio.paint.v1`. The old `design.v1` body-swap preferences are ignored, without deleting the palette or changing its storage key. Unknown style/team keys default to the original paint. “Original” restores only the decoration; “Restaurar” in the colour controls restores only colours. “Guardar” saves both.

The browser regression verifies all 121 team/style combinations have exactly the same structural path/transform signatures as that team's original car, including when supplied a legacy foreign `designKey`. It also verifies independent paint choices on two teams after reload, old body-swap preferences cannot alter the car, and both restore actions preserve the other preference.

The SVG marks in the studio retain the catalogue's symbol identities (swoosh, star, shield, horns, bars, A, hash, ring, wave, leaf and crest) with original redrawn paths and negative space for small-card legibility. They do not replace in-race branding assets.

## Mechanical studio detail

The overhead preview uses tapered carbon wishbone arms, pushrods, front steering links and rear halfshafts rather than unconnected strokes. Four inboard uprights and short axle stubs are computed from the same native tyre dimensions, with small brake-duct openings. The top view intentionally does not show a complete side-on rim. Rubber grain, wing hardware and service-panel seams are shared finishing details; team body profiles and paint choices remain independent.

Browser checks verify all four mounts touch the inner tyre edges on every native team/model, along with suspension-component counts and the 121 paint/geometry invariants including the new mechanical paths.

## Sculpted body refinement

The central painted shoulders now surround a narrow tapered engine spine, with a larger rounded cockpit opening and halo. Nose stations taper progressively from the cockpit to a rounded narrow tip. McRaven's pod inset and curved accent follow the supplied overhead reference more closely. Wing blades use separate curved leading/trailing edges with open gaps and restrained edge highlights. Carbon wishbones have wider roots; paint shadows derive from the primary hue instead of turning every lower body edge into secondary paint. All geometry remains selected by team and invariant across paint patterns.

## Local surface lighting and cockpit depth

Transparent local reflections and undercut shading model the pods without changing their team-specific outlines or the paint underneath. The inlet mouths have a dark cavity, a rim and clipped internal ribs. Mirrors now sit ahead of the openings so they no longer cover the recesses. Cadara's upper secondary panel retains its original asymmetry and receives the same material layers as the other surfaces.

The cockpit has a shaded well, padded bucket and bolsters, restrained stitching, harnesses, a recessed steering display and switch caps. A short offset shadow lifts the carbon halo off the rim. The engine spine combines subtle weave and directional reflection. These are SVG paths, patterns and gradients; no raster assets, blur filters, animation or additional requests are introduced. Browser geometry invariants include the cockpit internals and inlet ribs across all paint styles.

## Wheel and suspension proportions

Slick tyres now use curved envelopes with rounded shoulders rather than nested rounded rectangles. Front footprints are longer and slimmer across the car than the rear footprints; upright contact positions derive from those same dimensions at each native wheel scale. The finish uses restrained mould seams, fine scuff marks and broad matte highlights.

The front wishbones form a diagonal/near-transverse pair with a clearer V layout. Wider carbon arms carry separate fine pushrods and steering links; the rear retains its halfshafts. Dark upright fairings and inner wheel faces replace bright exposed hub blocks. All links expose their actual construction anchors for browser checks: every body attachment must lie inside the body path and each outer joint inside an upright, including mirrored parts on all 11 models. Paint invariants and wheel-edge contact checks remain in place.

## McRaven integrated body revision

McRaven now has explicit upper/lower shell curves, a curved engine spine and a rounded rectangular cockpit with a painted surround. Its pods use a secondary-colour base with flowing primary panels rather than a primary border around a dark inset. The original accent is a single continuous curve on each side, drawn above the body and clipped to the union of the body and both pods. Direct transformed paths in the clip preserve the lower mirrored curve. Custom paint patterns still replace the original decoration without replacing any geometry.

These shell/cockpit overrides belong only to PAPAYA; other team definitions and the wheel/suspension revision are retained. The neutral browser render samples both accent curves at five stations to catch missing pixels caused by clipping, in addition to the 121 paint/geometry invariants, attachment and responsive/persistence tests.

## Full-grid shell review and McRaven wings

The other ten teams now have explicit, independently authored centre-body Bezier stations, curved engine-spine profiles and cockpit proportions. The shared assembler only reflects those stations across the centreline; it never substitutes another team's shape. Each pod outline has also been reviewed individually.

| APEX team | Refinement in this review |
| --- | --- |
| Meridian | Slimmer centre shoulders, longer shelf-like pod transition and compact cockpit. |
| Ferrazzi | Fuller rounded shoulders reaching rearward, broad central shell and a wider cockpit surround. |
| Red Bison | Pinched tail, forward shoulder volume, narrow engine spine and compact opening. |
| Racing Bisons | Smoother oval pod transition, intermediate engine waist and more rounded cockpit. |
| Alpinor | Faceted shoulder stations and stepped pod channels with an elongated spine. |
| Hassler | Straighter broad shoulders and smaller dark pod channel, avoiding a hollow white rim. |
| Auron | Squarer pod shelf, compact waist and tighter cockpit proportions. |
| Willmont | Progressive curved pod taper and long, narrow central surfaces. |
| Aston Marlow | Stronger rear pinch and high forward shoulder volume with a compact cockpit. |
| Cadara | Full conventional shoulders, rounded shell and retained asymmetric paint treatment. |

These remain original showroom interpretations: supplied reference photos and launch galleries do not all show the same year, angle or aerodynamic specification. Ferrari/Red Bull overhead references were supplied by the user. Mercedes, Audi, Williams and Haas official car/launch galleries were consulted again; the supplied multi-team image and the Alpine/Racing Bulls/Aston Martin launch pages guide the remaining visual interpretation. The Cadillac team article was unavailable (403), so its [official F1 launch gallery](https://www.formula1.com/en/latest/article/gallery-see-all-the-angles-of-cadillacs-2026-livery.7oVj9gp6OSXescXdqEQVCt.7oVj9gp6OSXescXdqEQVCt) is retained as the alternative reference. No source photos are embedded in the application.

McRaven has four separately drawn front-wing profiles with changing chord, compound curves, open slots and shaped endplates. Rear-wing tips are curved and the primary highlight is narrower. Every blade is part of the paint/geometry invariant. Cockpit padding and controls are clipped inside each team's own opening. Neutral render checks now require eleven unique centre-body and cockpit paths as well as pods, inlets, spines, noses and wings.

## Front-wing centre joints

Each wing element now has a central joining section derived from its own upper-half root coordinates, using the same team-specific wing transform. It overlaps the mirrored halves by one SVG unit to avoid a visible antialiasing crack. The nose is drawn above the joints. Original materials and custom-paint masks follow the corresponding blade. This closes the formerly open centre without replacing a team's wing contours.

Browser checks require one joining section per element and sample fill membership at the upper attachment, centreline and mirrored lower attachment on all eleven native models. The joints are also included in all 121 paint/geometry invariants.

## Rear axle, tail and diffuser integration

The supplied crop highlights the open mechanical space between the rear wing and the narrowing painted tail. The painted shell ends close to the rear axle, with a team-dependent root; the engine spine tapers into it. A dark gearbox housing occupies the axle centre and carries two near-transverse halfshafts. Rear wishbones and pushrods connect to the housing or painted chassis rather than converging into a long painted block.

A low carbon wing, paired rear-wing pylons and a restrained central outlet complete that space. The floor recedes around the suspension, with only the upper rear ledges and small diffuser-edge details visible. The underside reference informs those connections; the wooden plank and hidden underside tunnels are not shown through the top-view body. This does not add an underside camera or change the racing mesh.

Attachment checks now accept the visible gearbox as a chassis attachment. Browser regressions verify the painted tail sits close to the rear axle, the housing spans the axle centre, halfshafts run transversely, pylons/low wing are present, and the floor/rear assembly remain identical across all 121 paint choices.

## Proportion correction against the supplied overhead image

The earlier rear revision over-narrowed the painted root, and earlier tyre/front-wing work left elongated tyres and a nose that ended behind the wing centre. This revision corrects the common tyre footprints, narrower rear track and nose reach while retaining team nose-width/length differences. Tail roots sit near the rear axle with fuller widths, rather than being required to start strictly ahead of it. The low rear wing moves towards that axle and the gearbox/outlet occupy less of the wing-to-tail gap.

McRaven is calibrated specifically against the supplied `image(20261027-150309).png`, using approximate pixel landmarks rather than engineering dimensions: rear/front axle centres at x≈188/870 (wheelbase≈682 px), nose tip x≈1099, rear-wing trailing edge x≈113, tyre lengths≈145/139 px and painted rear-root width≈66 px. Ratios are normalised by wheelbase so image size does not determine the result. Its rear wing receives a corrected chord/position, the cockpit opening becomes shorter and moves forward, and the airbox follows its rear edge. The accent patch moves towards the tip while the number remains behind it.

| Landmark ratio | Reference, approximately | McRaven SVG, unscaled blueprint |
| --- | --- | --- |
| Nose beyond front axle / wheelbase | 0.336 | 0.337 |
| Rear track / wheelbase | 0.43 | 0.426 |
| Rear tyre length / wheelbase | 0.213 | 0.216 |
| Front tyre length / wheelbase | 0.204 | 0.206 |
| Painted tail-root width / wheelbase | 0.097 | 0.092 |
| Rear-wing trailing edge to rear axle / wheelbase | 0.110 | 0.110 |

Browser checks use intervals around these relationships and verify the nose lies ahead of the front-wing centre on every team. This is a visual proportion correction to the showroom, not a claim of an exact replica.

## Superficies y volumen del estudio (v19)

La comparación aportada por Samuel (`image(20261027-212518).png`, referencia
arriba y SVG anterior abajo) mostraba hombros demasiado anchos, pontones con
aspecto de óvalo plano y un halo sobredimensionado.

- McRaven tiene nuevos hombros y una franja exterior elevada más estrecha.
- Las otras diez carrocerías conservan sus estaciones propias. Cada una aplica
  su ajuste de hombros antes de reflejar las curvas, sin escalar el coche entero.
- Los once modelos tienen un canal longitudinal por pontón, con estaciones
  derivadas de su cintura y hombro, recortado al contorno de su propio pontón.
- Las superficies de los canales, los hombros y las láminas de los alerones
  usan luces y sombras transparentes independientes de la decoración.
- El cockpit es más compacto y el halo más fino; se separan las tres carcasas
  del conjunto de admisión/cámaras. Los slick tienen marcas de hombro y
  reflejos menos uniformes, conservando las proporciones y sus anclajes.
- El carbono utiliza una trama más fina. No hay imágenes raster, filtros,
  animaciones ni peticiones de red nuevas en el SVG.

La prueba del estudio comprueba las once geometrías también con paleta neutra,
los dos canales por coche, los perfiles de ambos alerones y las 121 combinaciones
escudería/decoración. Incluye las superficies nuevas en la firma que debe
permanecer igual al cambiar de pintura. La personalización y el guardado siguen
siendo los del panel existente. Esto modifica exclusivamente el estudio de
Vehículo / Escudería; no sustituye la malla de carrera ni sus físicas.

El resultado sigue siendo una interpretación vectorial cenital: las pruebas de
geometría y funcionamiento no acreditan equivalencia fotográfica con la imagen.

## Conjunto trasero y suelo del estudio (v20)

La zona entre la cola y el alerón se organiza ahora alrededor de la caja de
cambios: carcasa perfilada, hombros y bridas, soportes de suspensión, escape
axial hueco, dos pilones del alerón y plano inferior separado. Solo se muestra
el labio superior visible de la salida del difusor, sin dibujar el fondo del
coche a través de la carrocería.

Los anclajes delanteros de los brazos traseros, su sección y la anchura de la
carcasa se derivan de las estaciones de cada escudería. El alerón inferior y
los pilones se sitúan respecto al borde real de su alerón trasero. Se conservan
la batalla, las huellas de los slick, los semiejes transversales y la cola junto
al eje. Las geometrías siguen siendo invariantes entre decoraciones.

El suelo solicitado se aplica únicamente a `.apexStudioStage`: losas gris
oscuro, juntas, textura estática muy fina y luz neutra. Una pequeña textura SVG
embebida y gradientes CSS evitan descargas de imágenes, ruido animado o filtros
de textura. Se reduce la sombra del coche para acercarlo al suelo. No se
modifica el suelo de los circuitos ni el layout Circuito/Vehículo.

La validación del estudio incluye las once carcasas distintas, los nuevos
soportes, la salida del difusor, el suelo, las 121 decoraciones y la persistencia.

## Cuatro láminas delanteras en todo el catálogo (v21)

Meridian, Ferrazzi, Racing Bisons, Hassler, Auron y Cadara conservaban el valor
`3` en el número de láminas de su alerón delantero: el elemento más adelantado
no se generaba. No se trataba de una cuarta pieza coincidente. Se corrigen las
seis configuraciones a cuatro; se mantienen sus barridos, anchuras y escalas.
La lámina añadida reutiliza la unión central, el sombreado y el acabado de borde.

La regresión exige cuatro láminas por mitad y cuatro uniones centrales para
los once modelos. Además del recuento, mide la cuerda exclusiva de cada lámina
en tres estaciones del semialerón, para detectar elementos superpuestos aunque
existan cuatro nodos SVG. Se mantienen las comprobaciones de pintura, formas,
proporciones, persistencia y layout en escritorio/móvil.

## Escala métrica y adaptación 2026 (v22, sustituye las cotas visuales anteriores)

Se utiliza la imagen acotada de Giorgio Piola aportada por Samuel
(`f1-fia-medidas.webp`), su comparación de alerones y neumáticos, el render FIA y
los ejemplos de McLaren, Mercedes, Ferrari, Red Bull, Audi y el concepto rojo.
Las fotos sirven para conservar identidad de formas/materiales por escudería;
no se copian sus patrocinadores. Algunas imágenes son de generaciones distintas.

Cotas nominales de esta interpretación, comunes a las once escuderías:

| Cota | mm | Origen |
| --- | ---: | --- |
| Batalla | 3400 | Imagen acotada / máximo C2.3.3 |
| Voladizo delantero | 1300 | Imagen acotada |
| Voladizo trasero | 750 | Imagen acotada |
| Longitud geométrica total | 5450 | Suma de batalla y voladizos |
| Anchura exterior con neumáticos | 1900 | Imagen acotada |
| Alerón delantero | 1800 | Comparación frontal aportada |
| Alerón trasero | 1150 | Imagen acotada |
| Diámetro nominal de slick | 710 | Lámina de neumáticos aportada |
| Anchura de slick delantero / trasero | 275 / 375 | Lámina de neumáticos aportada |

La escala es `3400 / 564` mm por unidad SVG. Las ruedas se construyen con esas
huellas y sus centros se calculan desde la anchura exterior. Sus caras internas
siguen alimentando las suspensiones y bujes; no se desplazan ruedas aisladas
sin adaptar las conexiones. Las pequeñas variaciones nativas de escala de ruedas
no se aplican al estudio calibrado. Las siluetas propias de carrocería, morro,
pontones, cockpit y barridos de alerón siguen diferenciadas.

Los alerones se normalizan por sus extremos geométricos completos, incluidos
los endplates. La posición trasera se calcula desde el eje, y la punta del morro
desde el delantero. El viewBox pasa a 1040×470 para alojar el voladizo sin recorte.
`ApexTeamCarPreview9A.dimensions`, el resultado de `build` y `data-mm-per-unit`
permiten auditar la conversión. No se cambia el panel ni la física de carrera.

Se contrastó la edición 21 de la sección C del reglamento FIA (19/10/2026):
https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_21_-_2026-10-19.pdf
C3.10.1 admite hasta tres perfiles delanteros; C3.11.1, hasta tres traseros.
Se sustituyen los cuatro perfiles del dibujo anterior por tres, manteniendo
uniones centrales y cuerda visible. También se retira el beam wing, de acuerdo
con la explicación FIA del cambio de generación:
https://www.fia.com/news/f1s-new-era-everything-you-need-know-about-how-fia-making-formula-1-more-competitive-more
Se conservan transmisión, suspensiones, pilones y labio visible de difusor.

Esta es una calibración dimensional y visual del estudio, no una homologación
FIA: no valida volúmenes 3D, alturas, radios ni todos los artículos del reglamento.
Las cotas de la infografía se identifican como referencias de diseño, no como
límites reglamentarios universales; 1900 mm de carrocería tampoco sustituye las
reglas específicas de ruedas y neumáticos. Las mediciones del test son de
geometría SVG, sin sumar el espesor de los trazos gráficos.

La prueba mide las diez cotas en cada uno de los once SVG con tolerancia de
1 mm, comprueba tres perfiles delanteros/traseros, ausencia de beam wing,
contactos mecánicos y las 121 decoraciones sin cambiar la geometría. Mantiene
las pruebas de guardado/restauración, paleta, escritorio 50/50 y móvil.
