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
