@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
where node >nul 2>nul || (
  echo ERROR: Node.js no esta disponible en PATH.
  pause
  exit /b 1
)
if not "%~1"=="" (
  node tools\install-voyastris-offline.mjs --voyastris "%~1"
) else (
  node tools\install-voyastris-offline.mjs
  if errorlevel 1 (
    echo.
    set /p VOYDIR=Ruta de tu carpeta voyastris: 
    if not "!VOYDIR!"=="" node tools\install-voyastris-offline.mjs --voyastris "!VOYDIR!"
  )
)
if errorlevel 1 (
  echo.
  echo No se ha instalado el catalogo.
  pause
  exit /b 1
)
node tools\smoke-test-voyastris.mjs
set ERR=%errorlevel%
echo.
if "%ERR%"=="0" echo System Forge v1.9.3.0 listo.
pause
exit /b %ERR%
