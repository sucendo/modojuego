# SonusArca Android

Contenedor Android personal de SonusArca.

La app abre siempre la versión publicada en:
https://sucendo.github.io/modojuego/sonusarca/

Esto significa que la mayoría de mejoras HTML/CSS/JS se publican actualizando la carpeta
`sonusarca/` de GitHub Pages, sin necesidad de recompilar el APK.

El APK solo necesita una nueva compilación cuando cambian elementos nativos Android,
permisos, icono, versión del contenedor o el puente Android.

## Compilar localmente
Necesitas Android SDK 35, Java 17 y Gradle 8.9.

Debug:
  gradle :app:assembleDebug

Release firmada:
  define las variables SONUSARCA_KEYSTORE_PATH, SONUSARCA_KEYSTORE_PASSWORD,
  SONUSARCA_KEY_ALIAS, SONUSARCA_KEY_PASSWORD y ejecuta:
  gradle :app:assembleRelease
