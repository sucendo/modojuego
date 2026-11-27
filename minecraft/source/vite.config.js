/**
* @type {import('vite').UserConfig}
*/
export default {
  base: './',
  build: {
    sourcemap: true,
    rollupOptions: { input: { index: 'index.html', clima: 'clima.html' } }
  }
}