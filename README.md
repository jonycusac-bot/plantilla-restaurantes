# Plantilla Restaurantes

> **Antes de tocar cualquier proyecto, lee [PROTOCOLO.md](PROTOCOLO.md)**: respaldo obligatorio, un repositorio por proyecto y nada en Cloudflare sin autorización.

Plantilla reutilizable de carta digital para restaurantes, basada en la estética y funciones de la carta INCH, con catálogo ficticio y sin sus credenciales, recursos Cloudflare, fotografías ni historial Git. Sirve como **plantilla maestra**: cada restaurante se crea como una instalación nueva e independiente con `NUEVO-RESTAURANTE.cmd` (ver [GUIA-NUEVO-RESTAURANTE.md](GUIA-NUEVO-RESTAURANTE.md)).

## Abrir ahora
- Carta local: http://127.0.0.1:4182/
- Administración: http://127.0.0.1:4182/admin
- Contraseña LOCAL: **`123456`** en la base de prueba incluida. `npm run acceso` la recuerda. También es el campo `password` de `.local/acceso-local.json`. No publicar ni compartir ese archivo.
- El puerto puede cambiar si se edita `restaurante.config.json` (ver más abajo).

## Base de datos de prueba
La plantilla trae una base local ya preparada, para poder verla y probarla sin configurar nada:

- 4 secciones de comida con 4 platos de ejemplo cada una y una sección Bebidas vacía con tres subsecciones.
- Aviso de demostración activo, sin logo ni cabecera: así se ve qué falta por rellenar.
- Contraseña `123456`, solo válida para esta plantilla de prueba.

Comandos:

```text
npm run demo            muestra la base de prueba y su contraseña
npm run demo -- --reset la reconstruye desde cero (borra carta y fotos de prueba)
```

`npm run demo` crea la base si no existe. Esta base **nunca se copia a los restaurantes nuevos** (el generador excluye `.local/`) ni se publica con `npm run build`. Además `.local/` está ignorado por Git: si la carpeta se copia entera a un pendrive, la demo viaja; si se clona desde Git, se recrea con `npm run demo`.

## Arranque
Requisito: Node.js 24 o superior. La aplicación funciona sin instalar dependencias de producción.

```text
npm run dev
```
Mantener esa consola abierta. También se puede ejecutar `INICIAR.cmd`. El servidor solo escucha en este ordenador (127.0.0.1). No está accesible desde el iPhone por defecto: habilitar acceso por red local requerirá otra configuración y autorización. No confundir la emulación móvil con una prueba física.

`npm install` solo hace falta para las pruebas de navegador con Playwright, no para usar la carta.

## Incluido
- Base de datos de prueba incluida y reproducible con `npm run demo`, con contraseña conocida (`123456`) y sin tocar las instalaciones de clientes.
- Generador de instalaciones con cuestionario: `NUEVO-RESTAURANTE.cmd` pregunta nombre, eslogan, logo, cabecera, puerto y carpeta; `npm run nuevo -- "Nombre"` hace lo mismo sin preguntas y admite `--logo` y `--cabecera`. Copia solo lo reutilizable, asigna un puerto libre, crea base y contraseña nuevas y no sobrescribe nada.
- Banda de cabecera opcional sobre el nombre, con subida, adelanto y borrado desde el administrador.
- Aviso en el administrador cuando una traducción queda a medias (nombre sin descripción o al revés).
- Perfil por restaurante en `restaurante.config.json` (nombre, eslogan, puerto, host) con `restaurante.config.example.json` como referencia.
- Mismo estilo de papel, colores, tipografías, leyenda de alérgenos y firma CUSAC.
- Entrantes, Ensaladas, Principales y Postres con 16 platos de ejemplo. Bebidas vacía, con Refrescos y cervezas, Vinos y Combinados.
- Identidad preparada al crear la instalación; el administrador del cliente gestiona la carta y los eventos.
- Carta desplegable con gestión de secciones (añadir, renombrar y quitar secciones vacías) y edición de platos.
- Carta con búsqueda global y español/inglés/alemán.
- Alta, edición, cambio de sección, ocultación y eliminación de platos.
- Precios, descripciones, fotos y 14 alérgenos seleccionables.
- Traducciones manuales plegadas, con un idioma visible a la vez. No utiliza IA.
- Guardar único por formulario y publicación inmediata en la carta de esta instalación.
- Contraseña verificada en servidor, sesión HttpOnly, protección de origen y límite de intentos.
- Actualizaciones parciales: los cambios independientes de dos dispositivos se conservan; un conflicto en el mismo campo se rechaza sin sobrescribirlo.
- Fotos optimizadas antes de subirlas: máximo 750 KiB en el editor; servidor máximo 1 MiB. Almacenamiento binario separado, deduplicación SHA-256 y tope propio de 100 MiB.
- Indicador del espacio utilizado. Las fotos antiguas no se eliminan automáticamente.
- Iconos genéricos diferenciados Carta/Admin y manifiestos. Sin modo sin conexión ni service worker.
- Datos persistentes SQLite locales; código de API compatible con el adaptador D1 y empaquetado separado para Cloudflare Pages.

Los alérgenos de los ejemplos están SIN ASIGNAR. No inferirlos por el nombre. Una selección vacía no garantiza que el plato esté libre de alérgenos. Revisar todos los ejemplos, precios y traducciones antes de usarlos con clientes reales.

## Uso del administrador
1. Abrir `/admin` e introducir la contraseña local.
2. Desplegar **Carta → Secciones** para editar nombres y traducciones o añadir y quitar secciones. Pulsar **Guardar secciones**. Para quitar una sección con platos, moverlos primero desde sus editores; debe quedar al menos una sección (máximo 31).
3. Abrir **Carta → Platos** o **Carta → Bebidas**. Pulsar un producto para editarlo o **Añadir** para crear uno. Fotos, alérgenos y traducciones están en el mismo formulario.
4. Pulsar **Guardar**. **Cancelar** descarta la edición; **Eliminar** pide confirmación.
5. Abrir **Ver carta** y recargar para comprobar los cambios.
6. Si aparece un conflicto, conservar el texto que interesa y recargar la administración para revisar la versión actual antes de volver a editar. No hay sobrescritura forzada.

## Reutilizar para otro restaurante
Guía completa y detallada: [GUIA-NUEVO-RESTAURANTE.md](GUIA-NUEVO-RESTAURANTE.md).

Forma recomendada, una sola orden:

```text
npm run nuevo -- "La Brasa de Marta"
```

o doble clic en `NUEVO-RESTAURANTE.cmd`, que pregunta nombre, eslogan, logo, cabecera, puerto y carpeta. Crea la carpeta del restaurante (`C:\Users\Usuario\Desktop\Restaurante <Nombre>` por defecto, según `plantilla.config.json`) con:

- Copia solo de `public/`, `src/`, `scripts/`, `cloudflare/`, `tests/` y de `package.json`, `package-lock.json`, `.gitignore`, `README.md`, `INICIAR.cmd`, `NUEVO-RESTAURANTE.cmd`, `wrangler.example.jsonc`, `GUIA-NUEVO-RESTAURANTE.md` y `restaurante.config.example.json`.
- Nunca `.local/`, `.wrangler/`, `dist/`, `node_modules/`, `test-results/`, `.test-output/`, `.env*`, `.dev.vars*` ni `.git`.
- `restaurante.config.json` con el nombre, el eslogan y un puerto libre (desde 4182).
- Base de datos nueva sembrada con 4 secciones de comida, 16 ejemplos y Bebidas vacía, **contraseña aleatoria propia** y, si se indicaron, **logo y cabecera ya colocados**.
- Se detiene sin tocar nada si la carpeta de destino ya existe con contenido.

Opciones: `--carpeta <ruta>`, `--puerto <n>`, `--eslogan "..."`, `--logo <ruta>`, `--cabecera <ruta>`, `--interactivo`, `--sin-inicializar`.

**Copia manual (alternativa):** replicar las mismas carpetas y archivos a mano, sin copiar
nunca `.local/`, `dist/`, `node_modules/`, `.wrangler/`, `test-results/`, `.test-output/`,
`.env*` ni `.git`. La primera ejecución crea base y contraseña; los arranques posteriores
no reinician ni reemplazan lo editado.

El nombre y el eslogan de `restaurante.config.json` solo se aplican al crear la base; después manda lo guardado en el administrador. Prioridad del puerto: `PORT` › `restaurante.config.json` › 4182. Para conservar una instalación local, cerrar su servidor y guardar una copia privada completa de `.local/`; no copiar SQLite mientras está escribiendo.

## Cloudflare: preparado, NO publicado
`npm run build` genera `dist/` con assets y Worker; nunca incluye `.local` ni secretos. Genera también `.local/seed-template.sql` con los datos ficticios, ya con el nombre y el eslogan de `restaurante.config.json`, y `INSERT OR IGNORE`.

`wrangler.example.jsonc` es deliberadamente un EJEMPLO sin IDs válidos. No existe comando de publicación automática ni conexión a INCH.

Cada cliente debe tener **su propia cuenta de Cloudflare** (dominio, consumo y factura a su nombre). Antes de publicar, `npm run comprobar` muestra la cuenta conectada y verifica que la base D1 contiene la carta de ese restaurante y no la de otro.

En la carpeta de un restaurante ya montado, `npm run exportar` deja el paquete listo en `deploy/` (esquema, carta real en SQL, las fotos y `DESPLIEGUE.md` con los comandos exactos) y crea un `wrangler.jsonc` real al que solo falta pegar el `database_id`:

1. `npx wrangler d1 create <proyecto>-db` y pegar el ID en `wrangler.jsonc`.
2. Aplicar `deploy/01-esquema.sql` y `deploy/02-carta.sql` en esa base nueva.
3. `node scripts/secretos.mjs "clave-larga"` y configurar `ADMIN_SALT` y `ADMIN_HASH` como secretos.
4. `npm run build` y `npx wrangler pages deploy dist --project-name <proyecto>`.
5. `node scripts/subir-fotos.mjs https://<proyecto>.pages.dev "clave-larga"`, que sube las fotos y comprueba que todas cargan.

Las fotos **no viajan dentro del SQL**: los binarios se corrompen al trocearlos (`bytes || X'...'` devuelve texto y corta en el primer byte nulo). Se suben por la API con los mismos bytes, así que el hash coincide y las direcciones de la carta funcionan.

**El runtime remoto D1 y el despliegue no están verificados en esta entrega local.** La API se ha ejercitado con SQLite local real y el paquete se comprueba mediante tests, incluido uno que reconstruye la carta desde el SQL exportado en una base limpia y verifica que las fotos pasan de 404 a 200 al subirlas. El servidor local y el Worker comparten el código de rutas y las consultas SQL. La carta se carga mediante su API; esta plantilla no conserva el renderizador React/Next ni la instantánea HTML de INCH: es una adaptación ligera, no una copia completa del repositorio histórico.

## Comprobaciones

```text
npm ci
npm test
npm run check
npx playwright test --workers=1 --reporter=line
npm run build
```

Las pruebas de navegador utilizan Chrome instalado. Usan una base temporal aislada; no modifican la vista local del usuario ni la carta INCH. Evidencias en `.test-output/`.

`npm test` incluye las pruebas del generador: comprueban que la copia no arrastra `.local`, `dist` ni `node_modules`, que cada instalación recibe contraseña propia y que la copia arranca con el nombre y los 16 ejemplos del restaurante.

## Estructura
- `public/domain.js`: catálogo ficticio, validación, traducciones y diferencias de edición.
- `public/app.js`: carta y administrador.
- `public/style.css`: estilo heredado; los prefijos CSS `inch-` son solo nombres de clases.
- `public/template.css`: ajustes genéricos y estilos del administrador.
- `src/worker.js`: API, autenticación, guardado e imágenes.
- `scripts/perfil.mjs`: lectura de `restaurante.config.json` y semilla con el nombre del restaurante.
- `scripts/local.mjs`: servidor y SQLite aislados; `--acceso` muestra la contraseña local.
- `scripts/demo.mjs`: crea o reconstruye la base de prueba de la plantilla (`npm run demo`).
- `scripts/nuevo-restaurante.mjs`: generador de instalaciones a partir de la plantilla.
- `scripts/build.mjs`: paquete Cloudflare sin secretos.
- `cloudflare/schema.sql`: tablas de una nueva instalación.
- `restaurante.config.example.json`: formato del perfil (se copia como `restaurante.config.json`).
- `plantilla.config.json`: preferencias de la fábrica (carpeta base y prefijo de las carpetas nuevas). No se copia a los restaurantes.
- `GUIA-NUEVO-RESTAURANTE.md`: procedimiento completo para abrir una carta de otro restaurante.

Sin despliegue y sin cambios en el proyecto original.

## Eventos y compartir

Administración incluye **Eventos y novedades** y **Redes sociales**. Los eventos se guardan por separado de la carta: hasta 20 anuncios, fecha y retirada opcionales, foto, enlace HTTPS/teléfono y botones Mostrar/Ocultar. La fecha ordena los anuncios; la retirada incluye todo el día indicado. Ocultar conserva el anuncio.

Cada evento visible tiene página `/eventos/<id>?lang=es|en|de` y una sola opción **Compartir evento**. Utiliza la función nativa o, si no está disponible, copia el título, descripción y enlace en el idioma seleccionado; si falla el portapapeles permite selección manual. Los perfiles Instagram/Facebook son enlaces públicos; la publicación en redes la confirma el usuario en su aplicación.

La base local se actualiza al arrancar. Para bases remotas existentes, `cloudflare/events-socials.sql` contiene únicamente tablas y valores iniciales de eventos/redes: requiere el respaldo y la autorización de PROTOCOLO.md. El generador y la exportación incluyen las nuevas funciones. No aplicar las migraciones del paquete INCH a esta plantilla.

Estado y próximos pasos: [CONTINUAR-MANANA.md](CONTINUAR-MANANA.md).

Las instalaciones nuevas incluyen dos eventos demo: Conciertos y Cumpleaños, ambos ocultos. Se editan en Administración → Eventos y novedades. Completa los datos reales y selecciona Mostrar y Guardar para publicarlos en la carta. No incluyen fechas, fotos ni enlaces inventados. Las instalaciones existentes conservan sus eventos.

## Gestión independiente de bebidas

Carta contiene las pestañas **Platos · Bebidas · Secciones**. En Secciones se elige el tipo persistente de cada sección; renombrarla conserva la clasificación. Las subsecciones de Bebidas se crean, traducen, renombran y quitan aquí. No se pueden quitar secciones o grupos con productos, incluidos los ocultos.

Bebidas reutiliza el editor de productos, fotos optimizadas, alérgenos y traducciones. Todas incluye las bebidas sin grupo. La búsqueda pública recorre toda la carta. Los grupos y traducciones se conservan en el generador y la exportación.

Migración y evidencias: [ENTREGA-BEBIDAS.md](ENTREGA-BEBIDAS.md).

### Eventos en tres idiomas

El editor incluye **Traducciones del evento**, plegado, con pestañas Inglés/Alemán. Español sigue siendo el texto principal; un campo traducido vacío utiliza el español. Las fechas, detalles, texto compartido y metadatos respetan el idioma seleccionado y los enlaces lo conservan. Mostrar/Ocultar solo se aplica al pulsar Guardar. Los campos de texto/enlace del botón ya no se editan; sus valores antiguos se conservan. Las fotos siguen visibles.

Los detalles tienen margen interior adaptable de 20–32 px, acciones que se ajustan al ancho y desplazamiento vertical. La inicialización completa solo traducciones ausentes de textos demo originales, sin duplicar eventos ni cambiar su visibilidad o contenido del propietario. Detalle y comprobaciones en [ENTREGA-EVENTOS-IDIOMAS.md](ENTREGA-EVENTOS-IDIOMAS.md).
