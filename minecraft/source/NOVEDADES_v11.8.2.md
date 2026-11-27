# 11.8.2 — Estabilidad

- Corrige la pérdida del índice de agua subterránea tras el primer paso; se conservan volúmenes y formato 19.
- Reutiliza el mapa de volúmenes sin copiarlo entero en cada paso.
- Separa las revisiones de agua y nieve; invalida la nieve al cargar/descargar chunks y conserva el tiempo de acumulación en columnas de cuenca.
- Las reconstrucciones de mallas hidráulicas comparten la cola deduplicada de cuencas; una reconstrucción en cada actualización activa. El estado físico se publica antes de la representación.
- Perfil táctil inicial: calidad baja, escala de píxel hasta 0,85, radio cercano 2, horizonte 6; preferencias locales separadas. Alta calidad seleccionable.
- Diagnóstico desde el menú y F3; registra fotogramas >=100 ms y cola de agua. Pausa el render con pestaña oculta o contexto WebGL perdido; deja a Three.js restaurar sus recursos.
- Generación: respeta ventanas idle cortas y retrasa fallback; todavía genera cada chunk de forma síncrona. No se migra el autoguardado en esta entrega para evitar cambios sin pruebas de persistencia.

Validación necesaria: npm ci, npm test, npm run build, prueba en Android/iOS (exploración, construcción junto a cascadas, nieve, volver de segundo plano, guardado y restauración). La acción de Pages compila y comprueba el código antes de publicar, sin reutilizar el bundle previo.
