# Funciones y arquitectura consolidada

## Runtime y archivos

JavaScript nativo ESM, sin React/Next ni dependencias de producción. Node 24 proporciona `node:sqlite`. `scripts/local.mjs` adapta SQLite a las consultas compartidas con `src/worker.js` y D1. `public/app.js` renderiza carta/admin; `domain.js` contiene semilla, traducciones, validación y diferencias. `style.css`/`template.css` conservan papel, tipografías y firma CUSAC. Los prefijos CSS `inch-` son históricos, no una conexión con otro restaurante.

`public/events.js` valida fechas/enlaces, `events-ui.js` su interfaz. `cloudflare/schema.sql` crea tablas; `events-socials.sql` es una migración aditiva histórica. `scripts/perfil.mjs` maneja perfil; `nuevo-restaurante.mjs`, `build.mjs` y `exportar.mjs` creación/empaquetado/exportación. Nunca sustituir datos existentes con la semilla.

## Carta y administrador

Búsqueda global, español/inglés/alemán, leyenda de 14 alérgenos, secciones y diseño móvil/escritorio. Traducciones manuales opcionales con alternativa española por campo. Aviso de demo, logo y cabecera opcional. Iconos/manifiestos separados carta/admin; sin service worker ni modo sin conexión.

Admin: Carta desplegable y pestañas **Platos · Bebidas · Secciones**. La identidad se prepara al crear la instalación, sin editor de identidad en el admin del cliente. Platos incluye comida; Bebidas es independiente. Secciones crea/renombra/traduce y cambia tipo persistente; no borrar secciones con productos y mantener al menos una. Máximo actual 31 secciones, para poder añadir Bebidas si una instalación antigua ya tenía 30.

Editor compartido: nombre, descripción, precio 0–99999,99, sección, foto, ocultación, alérgenos y traducciones. Un Guardar por formulario, Cancelar descarta la edición y Eliminar confirma. En Bebidas botón **Añadir**, títulos **Nueva bebida**/**Editar bebida**. Avisar de traducciones a medias. No inferir alérgenos por nombre ni presentar selección vacía como garantía de ausencia.

## Bebidas: datos y migración

`restaurant_state.payload` contiene `restaurant`, `categories`, `dishes` y marcador opcional `beveragesVersion`.

```js
// Sección
{id:'bebidas', name:'Bebidas', en:'Drinks', de:'Getränke', kind:'drinks',
 subcategories:[{id:'grupo-vinos',name:'Vinos',en:'Wines',de:'Weine'}]}
// kind: 'food' o ausente = comida.
// Producto: categoryId obligatorio, subcategoryId opcional o '' = sin asignar.
```

IDs únicos para secciones, productos y grupos en sus respectivos conjuntos; grupos verificados en toda la carta. Máximo 20 grupos/sección y 500 productos. Una subsección debe pertenecer a la categoría del producto. El servidor bloquea borrar secciones/grupos con referencias, incluidos ocultos. El editor limpia un grupo incompatible al trasladar; la API rechaza referencias inválidas.

Grupos iniciales **Refrescos y cervezas · Vinos · Combinados**. **Todas** es solo filtro e incluye sin grupo. Añadir desde un grupo lo preselecciona. Secciones → Bebidas permite crear/renombrar/traducir/quitar grupos vacíos. La carta pública excluye ocultos; buscar sigue recorriendo todo aunque haya grupo seleccionado. Cambiar sección reinicia grupo. Nombres/traducciones del dueño prevalecen sobre etiquetas iniciales.

`initializeBeverages` migra una vez, respeta tipos explícitos y solo entonces reconoce el nombre exacto Bebidas (sin distinguir mayúsculas) si faltaba tipo. Sin candidata añade una vacía con ID disponible. Conserva listas existentes, incluso `[]`; si faltaban crea los tres grupos. No deduce grupos por nombre de producto. Persiste `beveragesVersion:1`, por lo que reinicios no recrean grupos/secciones eliminados. Renombrar mantiene `kind`. Servidor usa revisión/CAS y arranque local la misma función. Exportación incluye marcador/grupos.

`diff`/`mergeChanges` normalizan opcionales al comparar/serializar: `kind`→`food`, `subcategories`→`[]`, `subcategoryId`→`''`. `undefined` desaparece por JSON y puede romper campos esperados en PATCH: probar ida y vuelta JSON con datos antiguos.

## Seguridad, fotos y concurrencia

Contraseña verificada en servidor, PBKDF2-SHA256, sesión HttpOnly/SameSite, validación de origen y límite de intentos. Sin claves de cliente embebidas en JS. PATCH con diferencias por entidad/campo y CAS de revisión: cambios independientes se conservan; conflictos devuelven 409 sin sobrescritura y retienen formulario. Eventos y redes tienen revisiones independientes.

JPG/PNG/WebP optimizados con canvas hasta 750 KiB; servidor hasta 1 MiB con firma binaria. `restaurant_images`: deduplicación SHA-256, máximo propio 100 MiB y URLs `/media/<hash>.<ext>`. Sustituir o quitar una foto del producto conserva el binario; no limpiar automáticamente. Mantener indicador de uso y validación de existencia en servidor.

## Eventos y redes

Hasta 20 eventos en `restaurant_events`, separados de carta. Título, descripción, fecha/retirada opcionales, foto, botón HTTPS/teléfono y mostrar/ocultar. Fecha ascendente, sin fecha al final. Retirada inclusiva en Europe/Madrid, revalidación cada 30 segundos y al recuperar foco. Acordar zona horaria si se adapta a otro país.

Destacado, detalle/listado y `/eventos/<id>` con metadatos Open Graph; 404 si oculto/caducado. Compartir nativo, copiar texto/enlace (alternativa seleccionable si falla portapapeles), descargar JPG. No abrir anuncios espontáneamente ni afirmar que se publicó en Instagram. `restaurant_socials` guarda Instagram/Facebook validando dominios.

Semilla nueva: 16 platos ficticios sin alérgenos asignados ni fotos, Bebidas vacía y eventos demo Conciertos/Cumpleaños ocultos, sin fechas/enlaces/fotos inventados. Instalaciones existentes conservan eventos y redes.
