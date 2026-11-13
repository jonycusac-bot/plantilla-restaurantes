# Gestión independiente de bebidas · 13/11/2026

Trabajo exclusivamente local en Plantilla Restaurantes. No se han consultado ni modificado los proyectos TARO o INCH ni la carpeta de exportación histórica. No se han importado sus datos, fotografías, credenciales o configuración. Se conservaron los cambios locales anteriores a esta intervención.

## Respaldo

Previo: `RESPALDOS/PLANTILLA/2026-11-13T18-34-58-625Z/` dentro de este proyecto. Se eligió esta ubicación para respetar la instrucción de trabajar exclusivamente aquí, frente a la ubicación exterior indicada por PROTOCOLO.md. La prohibición expresa de commit/push prevalece sobre los pasos Git del protocolo.

Incluye código, documentación, configuración disponible y `.local/` completo. No existían `restaurante.config.json`, `wrangler.jsonc` ni `deploy/` en esta plantilla. SQLite se respaldó con la API de backup de SQLite, que incluye las transacciones confirmadas del WAL. Base copiada abierta y comprobada: `integrity_check=ok`, 16 platos, 4 secciones, 0 fotos. `VERIFICACION.json` contiene recuentos y hashes SHA-256 de los archivos. El respaldo contiene información privada de esta instalación y está excluido de Git, generador y build.

La primera comprobación consultó una tabla inexistente (`no such table: images`); se corrigió a `restaurant_images` antes de modificar código o datos.

## Implementación y migración

- `public/domain.js`: campos opcionales `kind`, `subcategories` y `subcategoryId`; validación compartida cliente/servidor y semilla nueva. Identificadores de grupos únicos en la carta, máximo 20 por sección, referencias verificadas contra su categoría. Ausencia de `kind` equivale a comida.
- `public/app.js`: pestañas Platos / Bebidas / Secciones, listados separados, tipo de sección, editor de grupos y traducciones, editor compartido de bebidas con sus títulos, filtro Todas sin almacenamiento y preselección al añadir. Trasladar un producto limpia el grupo incompatible. Fotografías mediante la optimización existente.
- `public/template.css`: segunda fila de filtros, editor de grupos y adaptación de las pestañas.
- `src/worker.js`: actualización compatible de estados antiguos con compare-and-swap y revisión incrementada. Conserva sesión, origen, control de imágenes y conflictos. La validación rechaza borrar grupos o secciones que aún tienen productos, incluidos los ocultos, o guardar una carta sin secciones.
- `scripts/local.mjs`: inicialización única del estado antiguo al arrancar, sin resembrar la carta.
- `scripts/exportar.mjs`: instantánea de lectura consistente de carta/fotos/eventos/redes y exportación del estado compatible con bebidas. No modifica la base de origen al exportar.
- `scripts/demo.mjs` y `scripts/nuevo-restaurante.mjs`: mensajes del catálogo actualizado (sin cambiar el mecanismo del generador).
- `.gitignore`: excluye los respaldos privados.
- Pruebas: nuevos `tests/bebidas.test.mjs` y `tests/bebidas.browser.spec.mjs`; adaptados `tests/domain.test.mjs`, `tests/browser.spec.mjs`, `tests/exportar.test.mjs` y `tests/generador.test.mjs` a la quinta sección vacía.
- Documentación: README, guía del generador, continuidad, esta entrega y bitácora.

El marcador persistente `beveragesVersion: 1` evita repetir la migración. En un estado antiguo se reconoce una sección ya clasificada como bebidas o una sección sin tipo cuyo nombre sea exactamente Bebidas (sin distinguir mayúsculas). Esta detección solo se usa en la migración inicial; después manda `kind`, aunque se renombre la sección. Una clasificación explícita `food` se respeta. Si no existe una candidata se añade una sección vacía con identificador disponible. No se interpreta el nombre de ningún producto ni se asignan grupos automáticamente. Las listas de grupos existentes, incluso vacías, se conservan. Los grupos eliminados después no se recrean.

El límite de secciones pasa de 30 a 31 para que una instalación antigua que ya tuviera 30 pueda incorporar Bebidas sin borrar ni reclasificar ninguna sección. El límite por sección continúa siendo de 20 subsecciones.

Los campos opcionales se normalizan explícitamente en las diferencias y comparaciones de conflictos (`food`, `[]`, `''`), evitando perder claves con `undefined` al serializar JSON sobre datos antiguos. Los cambios concurrentes incompatibles se siguen rechazando.

La semilla del generador y del build incluye Bebidas vacía con Refrescos y cervezas, Vinos y Combinados y sus traducciones. No se crean bebidas, precios ni fotos. Los módulos siguen viajando por las listas existentes del generador/build; no fue necesario duplicar código de empaquetado ni cambiar el esquema SQL.

La base maestra se migró con transacción local: conserva los 16 platos, identidad, fotos, eventos y redes comparados íntegramente contra el respaldo. Ahora tiene cinco secciones, Bebidas sin productos y tres grupos. Evidencia: `.test-output/migracion-bebidas.json`.

## Pruebas y evidencias

- `npm run check`: correcto.
- `npm test`: 18 pruebas correctas. API real, autenticación/origen, conflictos, campos opcionales tras JSON, referencias, límites, ocultos, migración y reinicio sin duplicados ni recreación; generador y reconstrucción desde SQL exportado con fotos.
- `npx playwright test tests/browser.spec.mjs tests/bebidas.browser.spec.mjs --workers=1 --reporter=line`: 4 pruebas correctas en Chrome instalado, con bases temporales aisladas.
- Chrome: orden de pestañas, separación de listados, alta/edición/borrado, precio, subida/sustitución/retirada de foto, visibilidad, alérgenos y traducciones. Grupos, preselección, productos sin grupo, bloqueo de borrado con ocultos, creación/renombrado/borrado de grupos, traslado con limpieza de grupo, búsqueda global y alternativa al español.
- Anchuras 320, 390 y 1280 sin desbordamientos en administrador y carta. Capturas `.test-output/bebidas-320.png`, `bebidas-390.png`, `bebidas-1280.png`; revisión visual de la captura móvil. Pruebas mediante emulación, no un teléfono físico.
- `npm run build`: paquete local correcto en `dist/`, sin publicación ni conexión remota.

Las pruebas de red local necesitaron ejecución ampliada debido a `connect EACCES 127.0.0.1` en el entorno restringido. Una primera pasada de navegador detectó un enlace de eventos incorrecto en los botones de categorías, corregido antes de la pasada completa satisfactoria.

No se ha publicado en Cloudflare ni hecho commit o push. Un servidor que estuviera abierto con el código anterior necesita reiniciarse por el propietario para cargar el Worker nuevo; no se han detenido servicios ajenos a las pruebas.

Respaldo final: `RESPALDOS/PLANTILLA/2026-11-13T18-44-11-622Z-final`. Código y configuración copiados, SQLite consistente, apertura y recuentos, verificación SHA-256 de cada archivo. 16 platos, 5 secciones, 0 fotos. El respaldo previo también se volvió a verificar por sus hashes.
