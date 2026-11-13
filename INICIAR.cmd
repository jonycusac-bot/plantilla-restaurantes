@echo off
cd /d "%~dp0"
title Carta digital del restaurante
echo Arrancando la carta. Manten esta ventana abierta mientras la uses.
echo Para cerrar el servidor pulsa Ctrl+C en esta ventana.
echo.
node scripts/local.mjs
echo.
if errorlevel 1 echo El servidor se ha detenido con un error. Revisa el mensaje de arriba.
pause
