# Hexategos · Protocolo de estabilización

**Base funcional:** v0.38.15 (8 de octubre de 2026).
**Copia antes de los ajustes:** `hexategos/baseline-v0.38.15`.
**Objetivo:** consolidar diplomacia, industria, comercio, cartografía, guardados e IA de 150/250/350/500 naciones sin añadir mecánicas nuevas.

## Pruebas automáticas

La acción `Hexategos stability checks` comprueba la sintaxis de todos los archivos `hexategos/js/*.js` y ejecuta **todos** los `hexategos/tests/smoke-*.mjs` descubiertos en cada publicación; una prueba fallida impide considerar la versión estable.

```sh
for file in $(find hexategos/js -maxdepth 1 -name '*.js' | sort -V); do node --check "$file" || exit 1; done
for file in $(find hexategos/tests -maxdepth 1 -name 'smoke-*.mjs' | sort -V); do node "$file" || exit 1; done
```

## Validación manual antes de declarar «estable»

- [ ] Entrar en partida nueva con 150, 250, 350 y 500 naciones; observar errores en consola y fluidez durante 10 minutos por escala.
- [ ] Cargar una partida anterior y comprobar territorios, capitales, ciudades, tesoro, rutas, puertos y flotas.
- [ ] Guardar, recargar y volver a guardar; importar y exportar una partida portable.
- [ ] Construir dos instalaciones especializadas en el mismo hexágono con ciudad o puerto y, después, construir en otro hexágono sin bloqueos.
- [ ] Comprobar el transporte real de materias primas por carretera, puerto y ruta comercial hasta una industria transformadora.
- [ ] Comprobar electricidad, acero, manufactura civil, maquinaria y armamento cuando hay suministros suficientes e insuficientes.
- [ ] Verificar que las IA construyen, comercian, patrullan e invierten sin monopolizar los recursos del jugador.
- [ ] Comprobar en Sistemas las pestañas Economía, Comercio, Diplomacia, Gobierno, Investigación, Militar y Naval.
- [ ] Verificar decisiones Aceptar/Rechazar, botón Ver en mapa, cierres de diálogos y posición arrastrable.
- [ ] Inspeccionar iconos de ciudad/capital/puerto e industrias a diferentes niveles de zoom.
- [ ] Repetir en escritorio y móvil horizontal; comprobar letras escaladas, desplazamiento de diálogos y ausencia de desbordamientos.

**Estado:** candidato a estabilización. La automatización cubre regresiones unitarias, pero no sustituye una partida real prolongada ni una comprobación visual completa.

## Estabilización económica experimental · rama 0.38.24

**No fusionar aún con main.** La generación eléctrica se separa del combustible:
la central térmica consume combustible procesado y produce electricidad por ciclo;
las manufacturas consumen electricidad disponible en su componente viario.
El esquema portable `production0388` conserva su versión y estructura, por lo que
las partidas antiguas son legibles. Es posible que una partida anterior tenga
manufacturas sin central: estas quedarán sin electricidad hasta conectar generación.

Pruebas necesarias antes de fusionar:
- [ ] Abrir una partida antigua con industrias especializadas y comprobar cantidades, niveles e inventarios antes/después de recargar.
- [ ] Exportar e importar una partida con dos industrias por hexágono, central térmica y rutas marítimas.
- [ ] Medir consumo de combustible en central y energía suministrada a manufacturas.
- [ ] Comprobar que la manufactura sin central no consume energía ficticia.
- [ ] Probar redes aisladas: la central de una red no abastece a otra.
- [ ] Ejecutar smoke en CI y partidas prolongadas de 150 y 500 IA.


## Fase 2 · Industrialización material I–IV (0.38.25)

- Nivel I: incorpora carbón geológico con mina e inventario material. Cultivos y ganado
  producen físicamente fibras vegetales, lácteos, lana y pieles en la instalación;
  no se crean objetos de inventario por celda.
- Nivel II: refino, procesado de gas, siderurgia y metalurgia; acero y cobre refinado
  precisan electricidad. Hilandería, alimentación y curtido utilizan derivados.
- Nivel III: manufactura civil, maquinaria, textil, química y electrónica dependen
  de sus insumos y de electricidad. Los telares existentes pueden consumir fibras
  naturales con rendimiento inferior al material transformado.
- Nivel IV: centrales térmicas eligen **un** combustible disponible, por preferencia
  carbón, combustible refinado y gas procesado. Las armamentísticas necesitan
  acero, cobre refinado, maquinaria producida y electricidad.
- Electricidad: no se guarda como mercancía ni cruza redes de carreteras aisladas.
  Refino y procesado inicial preceden a generación; la generación precede a
  metalurgia y manufactura.
- UI: estado de cada instalación (produciendo, falta material, falta electricidad,
  aislamiento, almacén lleno o actividad reducida) y suministros recientes.
- IA: utiliza las mismas instalaciones y combustibles que el jugador, con análisis
  energético incremental y limitación del número de centrales por nación.
- Persistencia: `production0388` versión 2; acepta versiones antiguas sin
  `byproducts`. Mantiene los tipos y claves previos.
- Prueba nueva: `hexategos/tests/smoke-03825.mjs` cubre combustibles,
  transporte de carbón por mar, redes eléctricas aisladas, metales, derivados,
  armamento, guardados del navegador y archivos portables.

**Atención a partidas antiguas:** las industrias se conservan, pero ciertas
recetas pasan a exigir electricidad o productos intermedios. Una armamentística
sin maquinaria o una siderurgia sin suministro eléctrico puede quedar parada
hasta completar su cadena. Esto es un cambio de reglas, no pérdida del edificio.

**Pendiente de certificación manual:** partidas reales prolongadas con 150/250/
350/500 IA, prueba de ida y vuelta de archivo .hexategos en navegador y
observación de la interfaz móvil con partidas previas.


## Bloque I · Consolidación integral de la capa física 0.38.37

Auditoría sobre `main`: los módulos `world-core-03828`, `natural-potential-03829`,
`geology-03830`, `prospection-03831`, `agronomy-03832`, `production-0388`
y `natural-map-03836` comparten una semilla física independiente de `owner6`.
La capa de geología permanece determinista; las explotaciones históricas preservan
un mínimo `legacyQuality`, y los resultados concretos permanecen ocultos hasta
que `geological-prospection` registra el estudio.

**Protección incorporada:** `HexategosWorldCore03828.restore()` conserva una
instantánea de las capas y deshace los cambios si un módulo lanza un error
durante su restauración. Se ejecuta únicamente al cargar, importar o reiniciar,
no en cada tick. Continúan vigentes las versiones de esquema, las claves de
guardado y los envoltorios de exportación existentes.

**Prueba integrada:** `smoke-03837.mjs` carga juntos los módulos reales y verifica
semilla, propiedad política, trabajo pendiente, avance del scheduler,
resultados completados, persistencia local, exportación, importación,
partida antigua sin módulos naturales, protección ante instantáneas corruptas y
acciones de IA en configuraciones de 150, 250, 350 y 500 facciones.

**Puertas de calidad antes de nuevas capas:**
- Ejecutar `node --check` en los módulos JavaScript y todos los `smoke-*.mjs`.
- Verificar manualmente una partida antigua con mina, industria textil, comercio,
  carretera, puerto y flota; comparar tras guardar/cargar y exportar/importar.
- Verificar en navegador que un estudio iniciado, completado y exportado mantiene
  semilla, conocimiento y costes al regresar a la partida.
- Probar varios minutos con 150, 250, 350 y 500 naciones en hardware real,
  observando tiempos de renderizado y simulación. El smoke de 500 facciones no
  sustituye esta prueba prolongada.

No se ha cambiado ninguna receta, coste, rendimiento industrial ni estructura
del terreno en este bloque.


## 0.38.38 · Balance económico incremental y comercio físico

La economía conserva los cinco inventarios agregados históricos
(`food/raw/fuel/goods/military`), por compatibilidad. El nuevo
`economic-balance-03838.js` deriva cada ciclo comercial el saldo
producción-demanda, escasez, excedentes disponibles, flujos de importación
y exportación, y necesidades de insumos específicos. Para esto consulta
únicamente `resourceNation03720`, rutas ya calculadas y las instalaciones
de `production-0388`; NO mantiene segundo inventario, ni introduce
yacimientos, modificaciones en `.hexategos` ni nuevos intervalos.

**Cambio económico:** el ingreso directo generado por una ruta depende
del volumen real que ha movido (`cargo03720` y
`productionCargo0388`). Una ruta operativa sin mercancías no obtiene
ingresos comerciales directos; el transporte doméstico redistribuye stocks,
pero no genera ingreso internacional ficticio. Las bonificaciones
residuales por relaciones diplomáticas siguen limitadas por el sistema
anterior. La planificación comercial de la IA combina los indicadores
heredados con los excedentes y necesidades materiales nuevos, sin acceder
a la geología oculta.

**Importante:** los agregados históricos siguen siendo aproximados y
no deben sumarse a los inventarios especializados (contabilización doble).
Esto NO implanta todavía mercado de precios, comercio pagado por partida
de mercancía, tiempos físicos de tránsito ni sustitución completa de
la generación territorial agregada. Son mejoras reservadas para una
iteración posterior, tras comprobar el equilibrio en partidas prolongadas.

Validaciones: `smoke-03838.mjs` comprueba que el balance no modifica
mercancías, que los ingresos exigen cargamento, que el excedente de un
exportador cubre la escasez del importador, que hay contabilización de
fletes de acero, que el acceso público es inmutable y que soporta
500 facciones sin recorrer el mapa. `smoke-03825.mjs` valida que el
balance industrial refleja las existencias reales de cultivos, lana,
combustible, hierro y siderurgia y sobrevive al guardado del navegador.

Prueba manual recomendada antes de calibrar precios: partida antigua
con textil + mina + carretera + dos puertos, cerrar y reabrir, exportar
e importar; observar que una ruta entre naciones solo genera ingreso al
transportar mercancías y que una ruta interna redistribuye sin duplicar
los ingresos. Revisar la IA comercial a 150/250/350/500 facciones.
