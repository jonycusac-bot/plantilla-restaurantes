# Plantilla Restaurantes

Plantilla independiente basada en la estética y funciones de la carta INCH, con catálogo ficticio y sin sus credenciales, recursos Cloudflare, fotografías ni historial Git.

## Abrir ahora
- Carta local: http://127.0.0.1:4182/
- Administración: http://127.0.0.1:4182/admin
- Contraseña LOCAL: campo `password` del archivo `.local/acceso-local.json`. Se genera al arrancar por primera vez. No publicar ni compartir ese archivo.

## Arranque
Requisito: Node.js 24 o superior. La aplicación funciona sin instalar dependencias de producción.

```text
npm run dev
```
Mantener esa consola abierta. También se puede ejecutar `INICIAR.cmd`. El servidor solo escucha en este ordenador (127.0.0.1). No está accesible desde el iPhone por defecto: habilitar acceso por red local requerirá otra configuración y autorización. No confundir la emulación móvil con una prueba física.

## Incluido
- Mismo estilo de papel, colores, tipografías, leyenda de alérgenos y firma CUSAC.
- Cuatro secciones: Entrantes, Ensaladas, Principales y Postres. Cuatro ejemplos por sección: 16 platos.
- Nombre, eslogan, logo y nombres de secciones editables desde el administrador.
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
2. Desplegar **Identidad y secciones** para cambiar nombre, eslogan, logo y nombres de sección. Guardar.
3. Pulsar un plato para editarlo o **Añadir plato** para crear uno. Fotos, alérgenos y traducciones están en el mismo formulario.
4. Pulsar **Guardar**. **Cancelar** descarta la edición; **Eliminar** pide confirmación.
5. Abrir **Ver carta** y recargar para comprobar los cambios.
6. Si aparece un conflicto, conservar el texto que interesa y recargar la administración para revisar la versión actual antes de volver a editar. No hay sobrescritura forzada.

## Reutilizar para otro restaurante
Copiar únicamente estas carpetas y archivos a una carpeta nueva:

- `public/`, `src/`, `scripts/`, `cloudflare/`, `tests/`
- `package.json`, `package-lock.json`, `.gitignore`, `README.md`, `INICIAR.cmd`, `wrangler.example.jsonc`

**NO copiar** `.local/`, `.wrangler/`, `dist/`, `node_modules/`, `test-results/`, `.test-output/`, `.env*`, `.dev.vars*`, copias privadas o una carpeta `.git` de otro proyecto.

La primera ejecución crea una base nueva con los 16 ejemplos y una contraseña nueva. Los arranques posteriores NO reinician ni reemplazan lo editado. Cada restaurante debe tener su propia carpeta, base, acceso y puerto si se ejecutan a la vez (variable `PORT`).

Antes de personalizar la plantilla maestra, lo recomendable es trabajar en esa copia nueva. Para conservar una instalación local, cerrar su servidor y guardar una copia privada completa de `.local/`; no copiar SQLite mientras está escribiendo.

## Cloudflare: preparado, NO publicado
`npm run build` genera `dist/` con assets y Worker; nunca incluye `.local` ni secretos. Genera también `.local/seed-template.sql` con datos ficticios y `INSERT OR IGNORE`.

`wrangler.example.jsonc` es deliberadamente un EJEMPLO sin IDs válidos. No existe comando de publicación automática ni conexión a INCH. Para un cliente real hace falta autorización y:

1. Crear proyecto Pages y base D1 independientes, con identificadores nuevos.
2. Configurar binding `DB` y aplicar `cloudflare/schema.sql` exclusivamente en esa nueva base.
3. Inicializar la base nueva con el seed; nunca restaurar datos sobre otra instalación.
4. Configurar secretos `ADMIN_SALT` y `ADMIN_HASH` propios (PBKDF2-SHA256, 100000 iteraciones, 256 bits, hex). No reutilizar el acceso local ni el de otro restaurante.
5. Revisar cuotas, seguridad y efectuar pruebas con Wrangler/D1 antes de publicar.

**El runtime remoto D1 y el despliegue no están verificados en esta entrega local.** La API se ha ejercitado con SQLite local real y el paquete se comprueba mediante tests. El servidor local y el Worker comparten el código de rutas y las consultas SQL. La carta se carga mediante su API; esta plantilla no conserva el renderizador React/Next ni la instantánea HTML de INCH: es una adaptación ligera, no una copia completa del repositorio histórico.

## Comprobaciones

```text
npm ci
npm test
npm run check
npx playwright test tests/browser.spec.mjs --workers=1 --reporter=line
npm run build
```

Las pruebas de navegador utilizan Chrome instalado. Usan una base temporal aislada; no modifican la vista local del usuario ni la carta INCH. Evidencias en `.test-output/`.

## Estructura
- `public/domain.js`: catálogo ficticio, validación, traducciones y diferencias de edición.
- `public/app.js`: carta y administrador.
- `public/style.css`: estilo heredado; los prefijos CSS `inch-` son solo nombres de clases.
- `public/template.css`: ajustes genéricos y estilos del administrador.
- `src/worker.js`: API, autenticación, guardado e imágenes.
- `scripts/local.mjs`: servidor y SQLite aislados.
- `scripts/build.mjs`: paquete Cloudflare sin secretos.
- `cloudflare/schema.sql`: tablas de una nueva instalación.

Sin Git, sin despliegue y sin cambios en el proyecto original.
