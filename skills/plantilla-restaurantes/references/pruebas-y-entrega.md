# Pruebas y entrega

## Comprobaciones locales

En el destino, con bases temporales de tests y Node 24. Chrome/Playwright necesita dependencias de desarrollo: instalar solo si el entorno lo autoriza y es necesario. No instalar otro navegador silenciosamente si falta Chrome.

```text
npm run check
npm test
npx playwright test tests/browser.spec.mjs tests/bebidas.browser.spec.mjs --workers=1 --reporter=line
npm run build
```

Node cubre API/autenticación/origen, imágenes, conflictos/persistencia, eventos/redes, iconos, bebidas/migración, generador y exportación. Se reconstruye SQL exportado en una base limpia y se verifican fotos por API. Build separado de datos/accesos.

Chrome: tres idiomas; orden Platos/Bebidas/Secciones y separación; altas/edición/borrado, precios, visibilidad, alérgenos, traducciones, fotos; Todas/sin grupo/ocultos; filtros/preselección; crear/renombrar/quitar grupos, bloqueo con ocultos; renombrar sección conservando tipo; traslado limpiando grupo; búsqueda global; eventos/redes/compartir/JPG/conflictos. Anchuras 320/390/1280: revisar capturas y desbordamientos de carta, admin y formularios.

Migraciones: reinicio, no duplicados/recreación de grupos eliminados, clasificación explícita del dueño y opcionales sobre JSON antiguo. No usar base visible del propietario ni `demo --reset` para preparar pruebas. Si loopback falla con `connect EACCES 127.0.0.1`, usar el mecanismo autorizado del entorno; no desactivar autenticación ni cambiar Windows. Registrar pruebas que no se pudieron ejecutar.

## Portabilidad del skill

`node scripts/validar-paquete.mjs` comprueba manifiesto SHA-256, referencias, estructura y exclusión de datos privados. Usar también `quick_validate.py` de skill-creator si está disponible. No requiere directorios originales.

Ejecutar `node scripts/probar-portabilidad.mjs` para crear dos proyectos temporales, comprobar accesos distintos, bloqueo de sobrescritura, 18 pruebas Node y build. La prueba no imprime contraseñas y limpia solo su directorio temporal. Para comprobar manualmente `scripts/crear-proyecto.mjs`, usar un destino nuevo fuera de carpetas reservadas (`.test-output`, `.local`, `dist`, etc.). Verificar: base propia, clave aleatoria, identidad/perfil, 16 platos, cinco secciones, Bebidas vacía con tres grupos y eventos demo ocultos. Repetir sobre el mismo destino debe fallar sin tocarlo. Comprobar que viaja `PROTOCOLO.md` y no llegan datos/accesos/configuración de origen. Cerrar procesos de pruebas y limpiar únicamente su directorio temporal verificado.

La instantánea de origen del 13/11/2026 pasó 18 pruebas Node y 4 Chrome, check y build: antecedente, no resultado automático para futuros proyectos. `assets/manifest.json` identifica los archivos del paquete. Los tests locales no verifican D1 remoto.

## Cierre

Documentar archivos, migración/datos, respaldo previo/final y pruebas reales con límites. Comparar conservación contra respaldo al adaptar. No incluir secretos en bitácora/respuesta. Entregar ruta y arranque; si había servidor anterior, indicar necesidad de reinicio sin detenerlo por iniciativa propia.

Commit, push, repositorio y publicación son decisiones independientes con autorización específica. Expresar pendientes y no presentar exportación/build como despliegue.
