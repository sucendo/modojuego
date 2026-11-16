@echo off
setlocal EnableExtensions
cd /d "%~dp0"

rem Solo se abre un servidor en este ordenador (127.0.0.1).
set "PCF_URL=http://127.0.0.1:8765/"
set "PHP_EXE="

where php >nul 2>&1 && set "PHP_EXE=php"
if not defined PHP_EXE (
  for /d %%P in ("%SystemDrive%\wamp64\bin\php\php*") do (
    if exist "%%~fP\php.exe" set "PHP_EXE=%%~fP\php.exe"
  )
)

if defined PHP_EXE (
  echo Iniciando PC Futbol en %PCF_URL%
  echo Manten esta ventana abierta mientras juegas.
  start "" "%PCF_URL%"
  "%PHP_EXE%" -S 127.0.0.1:8765
  goto :end
)

where py >nul 2>&1
if not errorlevel 1 (
  echo Iniciando PC Futbol en %PCF_URL%
  echo Manten esta ventana abierta mientras juegas.
  start "" "%PCF_URL%"
  py -3 -m http.server 8765 --bind 127.0.0.1
  goto :end
)

where python >nul 2>&1
if not errorlevel 1 (
  echo Iniciando PC Futbol en %PCF_URL%
  echo Manten esta ventana abierta mientras juegas.
  start "" "%PCF_URL%"
  python -m http.server 8765 --bind 127.0.0.1
  goto :end
)

echo No se ha encontrado PHP ni Python instalados.
echo Puedes copiar la carpeta a www de WAMP y abrir http://localhost/pcfutbol/
pause

:end
endlocal
