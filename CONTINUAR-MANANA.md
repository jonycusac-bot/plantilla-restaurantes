# Continuar mañana — 12/11/2026

Actualización admin 13/11/2026: eliminada Identidad y secciones del admin del cliente. Carta es un desplegable cerrado al entrar, con Secciones de la carta (añadir, renombrar y quitar secciones vacías, entre 1 y 30) y Platos de la carta (editor actual). Los desplegables conservan su apertura al guardar o cambiar de sección. Los datos de identidad se preparan al crear el restaurante. Cambios realizados solo en la plantilla maestra; TARO existente requiere una adaptación separada. Respaldo previo en RESPALDOS/PLANTILLA/20261113-admin-carta-1794590540201. Sintaxis, 15 pruebas y 3 pruebas Chrome correctas.

Actualización 13/11/2026: añadidos por petición del dueño dos eventos demo, Conciertos y Cumpleaños, ambos ocultos, en la plantilla local y en las instalaciones nuevas. Disponibles en Administración → Eventos y novedades. Completar datos reales antes de Mostrar y Guardar. Carta intacta; sintaxis, 15 pruebas y 3 pruebas Chrome correctas. Respaldo y detalle en BITACORA.md. El estado vacío descrito a continuación corresponde al cierre histórico del 11/11.

## Estado guardado el 11/11/2026

Proyecto: C:/Users/Usuario/Desktop/Business/Plantilla Restaurantes.
Leer PROTOCOLO.md antes de intervenir. La autorización de esta sesión comprende respaldo, commits locales, integración y pruebas locales. Publicar o hacer push requiere autorización aparte.

Integrados en JavaScript nativo, sin sustituir la carta por el código React de INCH:
- Eventos y novedades: hasta 20 anuncios, título, descripción, fecha/retirada opcionales, foto comprimida, enlace HTTPS o teléfono, botones Mostrar/Ocultar y Guardar.
- Orden por fecha ascendente, sin fecha al final. Retirada inclusiva según Europe/Madrid, revisión cada 30 segundos y al recuperar foco. Ninguna ventana se abre automáticamente.
- Destacado, Ver detalles, Ver todos y página propia /eventos/<id>, con metadatos Open Graph y 404 si está oculto o caducado.
- Compartir mediante el dispositivo, copiar texto/enlace y descargar JPG. Si falla el portapapeles se ofrece texto seleccionable. No se publica automáticamente ni se afirma que una publicación se haya completado.
- Perfiles públicos Instagram/Facebook con validación de dominio.
- Tablas y revisiones independientes de la carta, sesión/origen y conflictos 409 con conservación del formulario.
- Esquema local actualizado sin cambiar la carta: 16 platos, 0 fotos; eventos y redes vacíos, sin importar datos de INCH.
- Generador conserva sus funciones y copia los módulos nuevos. Exportación SQL incluye eventos/redes y las fotos siguen usando el mecanismo actual.

## Comprobaciones

`npm run check`, `npm test` (15 pruebas), `npm run build` y `npx playwright test tests/browser.spec.mjs --workers=1 --reporter=line` (3 pruebas).
Las pruebas usan bases temporales independientes. Chrome comprueba carta, administración, foto, idiomas, responsive, conflictos y descarga con cabecera JPEG válida. Las restricciones de loopback del entorno requieren ejecutar las pruebas con permisos de ejecución ampliados.
Captura local: .test-output/evento-mobile.png.

## Pendiente para mañana

1. Abrir la plantilla con INICIAR.cmd o `npm run dev` y revisar juntos la apariencia de Eventos y novedades y Redes sociales. Si ya existe un proceso local anterior, habrá que reiniciarlo para cargar el Worker nuevo; esta sesión no detuvo servicios existentes.
2. Elegir los eventos y perfiles reales. No se han inventado cuentas ni conservado anuncios de QA en la base maestra.
3. Revisar Compartir en un móvil real. El menú nativo depende del navegador y las aplicaciones instaladas; Instagram puede requerir descargar la foto y pegar el texto por separado.
4. Solo si el propietario quiere publicar: seguir la autorización exacta de PROTOCOLO.md, identificar directorio/cuenta/destino y respaldar la base remota actual. Para una base existente, adaptar/aplicar exclusivamente cloudflare/events-socials.sql; no resembrar la carta ni importar migraciones INCH. Ejecutar npm run comprobar antes de subir.
5. Tras un despliegue autorizado, probar enlaces HTTPS y vistas previas desde otro dispositivo. Las redes gestionan su propia caché de Open Graph.
6. Push a GitHub pendiente de autorización. Los commits de esta sesión son locales.

## Respaldos y código

Respaldo previo verificado: C:/Users/Usuario/Desktop/RESPALDOS/PLANTILLA/20261111205917.
SQLite consistente: restaurante-verificado.sqlite; comprobación de integridad correcta, 16 platos y 0 fotos.
Commit previo: 8b71bf6.
El respaldo final y el cierre de integración se registran en BITACORA.md y Git.

Archivos centrales: public/events.js (validación/fechas), public/events-ui.js (interfaz), public/app.js (integración), src/worker.js (API/páginas), cloudflare/events-socials.sql (actualización aditiva), scripts/build.mjs y scripts/exportar.mjs (paquetes).
La exportación EXPORTACION-INCH-2026-11-11 permanece como referencia, sin editar sus fuentes.

Actualización 13/11/2026 · Bebidas integrada localmente. Carta: Platos / Bebidas / Secciones; tipos persistentes, subsecciones, filtros públicos, migración única y compatibilidad del generador/exportación. Base maestra migrada: 16 platos conservados, Bebidas vacía, 5 secciones, integridad correcta; eventos/redes/fotos verificados contra respaldo. Ver ENTREGA-BEBIDAS.md. Sin commit, push ni publicación.

Actualización 13/11/2026 · Eventos ES/EN/DE integrados solo en esta plantilla. Traducciones manuales, enlaces y metadatos con idioma, editor sin campos de botón (valores antiguos conservados), una acción Compartir con alternativas, detalles con márgenes 20–32 px. Conciertos/Cumpleaños traducidos sin duplicar ni mostrar. 22 pruebas Node + 5 Chrome, check/build correctos. Detalle y respaldos en ENTREGA-EVENTOS-IDIOMAS.md. No se actualizó el Skill instalado ni su instantánea anterior: esta intervención está limitada al proyecto.
