@echo off
cd /d "%~dp0"
title Nuevo restaurante
chcp 65001 >nul 2>&1
node scripts/nuevo-restaurante.mjs
echo.
pause
