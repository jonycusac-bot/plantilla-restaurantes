# Eventos multilingües y editor simplificado · 13/11/2026

Incorporación exclusivamente local en Plantilla Restaurantes. Sin consultar o modificar TARO/INCH ni importar sus datos o credenciales. Los cambios locales anteriores se conservaron. No se publicó, ejecutó Wrangler ni hizo commit/push.

## Respaldo previo y conservación

`RESPALDOS/PLANTILLA/2026-11-13T19-33-55-280Z-previo-eventos-idiomas/` incluye código, documentación, configuración disponible, Skill local y `.local/` completo. No existían perfil real, wrangler real ni deploy. La ubicación está dentro de este proyecto por el alcance solicitado; no se ejecutaron los pasos de Git del protocolo por la prohibición expresa del usuario.

SQLite respaldado con `node:sqlite.backup`, abierto y verificado: `integrity_check=ok`, 16 platos, 5 secciones, 0 fotos y 2 eventos ocultos. `VERIFICACION.json` contiene recuentos, estado previo de eventos y hashes SHA-256. Son archivos privados de esta instalación, fuera de Git/generador/build.

La base maestra recibió solo las traducciones EN/DE de Conciertos y Cumpleaños. Se verificaron contra el respaldo todos los campos españoles, IDs, fechas, retirada, fotos, botones antiguos y visibilidad. Carta completa con su revisión, fotos y redes idénticas; acceso local idéntico por hash. Sigue habiendo 16 platos, 5 secciones, 0 fotos y 2 eventos ocultos, sin duplicados. Evidencia: `.test-output/migracion-eventos-idiomas.json`.

## Cambios por archivo

- `public/events.js`: modelo opcional `translations.en/de.title/description`, validación y localización por campo con español como alternativa. Enlaces con `?lang=es|en|de`, fechas y contenido compartido según idioma. Traducciones demo canónicas y preparación idempotente de campos ausentes.
- `public/events-ui.js`: apartado plegable Traducciones del evento con pestañas Inglés/Alemán. Retirados campos de texto/enlace del botón; los valores almacenados se conservan al editar y también al revisar un conflicto. Mostrar/Ocultar sigue siendo estado del formulario hasta Guardar. Franja, detalles, foto/alt y texto compartido localizados. Una sola acción Compartir evento; función nativa, copia automática de título/fecha/descripción/enlace como alternativa y selección manual si falla el portapapeles. Cancelar el diálogo nativo no dispara copia. Retirados etiquetas y controladores de copiar texto/enlace y descargar JPG. Los enlaces de acción antiguos, cuando existen, se conservan como enlaces separados de la acción de compartir.
- `public/app.js`: idioma inicial desde URL validado y conservación del idioma al cambiarlo. Abrir un enlace de evento usa su idioma; recargar lo conserva.
- `src/worker.js`: metadatos HTML/Open Graph, idioma del documento, título y descripción según el enlace, con escapado HTML. Compatibilidad con eventos antiguos; preserva traducciones y valores heredados cuando un cliente los omite. Preparación demo con compare-and-swap y aumento de revisión, manteniendo autenticación, origen, comprobación de fotos y conflictos. Límite del cuerpo de eventos ampliado a 250 KB para admitir traducciones de los 20 eventos; validación individual de campos permanece limitada.
- `public/template.css`: estilos limitados a eventos. Detalles con 20–32 px interiores, ancho limitado, desplazamiento vertical, Cerrar visible y acciones/textos largos ajustables. Sin cambiar estilos de carta/admin.
- `scripts/local.mjs`: prepara traducciones demo ausentes al arrancar sin resembrar ni reiniciar eventos.
- `cloudflare/schema.sql`: semilla de eventos demo ocultos con EN/DE completos para nuevas instalaciones; `INSERT OR IGNORE` no reemplaza instalaciones existentes.
- `scripts/exportar.mjs`: exporta también traducciones y prepara solo los campos demo compatibles en la instantánea de salida, sin modificar la base de origen. Mantiene foto/datos/eventos/redes en instantánea consistente.
- `playwright.config.mjs` y `scripts/nuevo-restaurante.mjs`: pruebas solo en `tests/**/*.spec.mjs`; el generador incluye la configuración para no descubrir copias de Skill u otros proyectos ni ejecutar los tests Node al descubrir navegador.
- Pruebas nuevas: `tests/events-i18n.test.mjs`, `tests/events-i18n.browser.spec.mjs`. Adaptada `tests/browser.spec.mjs` a la acción de compartir única. Las pruebas de identidad de `tests/iconos.test.mjs` y de navegador comparan el nombre real del perfil, para que se puedan ejecutar en instalaciones generadas con otro nombre.
- Documentación: README, guía del generador, continuidad, bitácora y este informe.

## Compatibilidad y preparación de los ejemplos

No hay nuevas tablas ni columnas: traducciones opcionales dentro del payload JSON. Los eventos antiguos sin ellas se muestran en español. Cada traducción admite título de hasta 120 y descripción de hasta 2000 caracteres, y solo los idiomas EN/DE. Un campo vacío conserva la alternativa española.

La preparación identifica únicamente los IDs demo de esta plantilla. Añade un campo traducido solo si falta su propiedad y el campo español correspondiente coincide exactamente con el ejemplo original. No toca traducciones existentes, incluidos vacíos intencionales, ni traduce automáticamente textos del propietario. No crea eventos eliminados ni duplica IDs. Al editar, el formulario persiste vacíos como tales para que no se repongan al reiniciar. La revisión solo aumenta si se añade algo; lecturas/arranques posteriores no escriben de nuevo.

El idioma válido del enlace determina metadatos y texto público; valores desconocidos usan español. Eventos ocultos/caducados siguen excluidos de API pública y responden 404 en todos los idiomas. Las imágenes visibles conservan sus bytes y el circuito existente de optimización/subida.

El generador sigue creando base y contraseña propias. El build incorpora los módulos compartidos actualizados, y el exportador conserva JSON traducido y fotos separadas. No fue necesario cambiar `scripts/build.mjs`. La migración SQL histórica `events-socials.sql` sigue siendo aditiva y no se ejecutó en recursos remotos.

## Comprobaciones

- `npm test`: 22 pruebas correctas. Incluyen validación, eventos antiguos, alternativa por campo, protección de contenido propio y vacíos intencionales, enlace/metadatos ES/EN/DE, escapado HTML, conservación de enlaces antiguos, foto/fecha/visibilidad, reinicio, eventos ocultos, generador y reconstrucción del SQL exportado.
- `npx playwright test --workers=1 --reporter=line`: 5 pruebas correctas, sobre bases temporales aisladas. Regresiones de carta/bebidas/admin y eventos/redes/conflictos, más editor multilingüe, visibilidad solo al guardar, foto/fechas/botón heredado conservados, franja/detalles/compartir por idioma, alternativas, cancelación nativa y metadatos tras cambiar/recargar idioma.
- 320, 390 y 1440 px: margen interior medido de 20–32 px, diálogo dentro de pantalla, sin desbordamiento horizontal, Cerrar visible también tras desplazamiento, texto/acciones largos en alemán ajustados. Página individual comprobada en las mismas anchuras. Revisión visual de capturas de diálogo y acciones en móvil/escritorio.
- Evidencias: `.test-output/eventos-de-*.png`, `eventos-acciones-de-*.png`, `evento-pagina-de-*.png` y el JSON de migración. Las fotos utilizadas en QA son iconos genéricos y no se añadieron a la base maestra.
- Instalación nueva en `restaurantes/QA-Eventos-Idiomas-20261113`: sus 22 pruebas Node y build pasan; incluye configuración de navegador y eventos traducidos. Resultado en `.test-output/generador-eventos-idiomas.json`. La carpeta QA no se copia a clientes ni al paquete de publicación.
- `npm run check`, `npm run build` y `git diff --check`: correctos. Build local en `dist/`, sin publicación ni datos privados.

Las pruebas de API/navegador requirieron permiso de ejecución ampliado para loopback local. La primera ejecución de navegador descubrió también pruebas del Skill anterior; se añadió configuración explícita y se retiraron sus capturas generadas, verificando que el paquete del Skill sigue íntegro por hashes. Un primer fallo de la prueba alemana comparaba saltos de línea finales con un texto que el editor recorta: se corrigió el dato de prueba; el texto almacenado/compartido es el normalizado.

La función nativa se verificó mediante simulación controlada en Chrome, con sus alternativas reales de interfaz; no se ha probado en un teléfono físico ni publicado en redes. No se verificó D1 remoto. Si había un servidor anterior abierto, el propietario debe reiniciarlo para cargar el Worker nuevo; no se detuvieron sus servicios.

El Skill instalado globalmente y su ZIP/instantánea anterior no se actualizaron: esta intervención se limita al proyecto y su generador actual. Los respaldos conservan esa instantánea independiente.

Respaldo final verificado: `RESPALDOS/PLANTILLA/2026-11-13T19-46-24-172Z-final-eventos-idiomas`. Código/configuración/documentación, Skill local anterior y SQLite consistente, integridad correcta, 16 platos, 5 secciones, 0 fotos y 2 eventos ocultos con EN/DE. Inventario y hashes en VERIFICACION.json.
