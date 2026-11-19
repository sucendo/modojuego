# Minecraft.js 11.5.1

Versión publicada para GitHub Pages. Abre `index.html` desde un servidor HTTP.

El código editable está en `source/`. Para actualizar la publicación:

```sh
cd source
npm ci
npm test
npm run build
cp -R dist/. ../
```

La compilación usa rutas relativas para funcionar en `/modojuego/minecraft/`.

Validación: 328 pruebas superadas y compilación de producción correcta. La revisión visual de la partida del usuario sigue pendiente.
