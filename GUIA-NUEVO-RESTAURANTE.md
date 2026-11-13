# Guía: convertir esta plantilla en el restaurante de un cliente

Esta carpeta es la **plantilla maestra**. No se edita para cada cliente: se usa para
**crear instalaciones nuevas**. Cada instalación es independiente:

| Una instalación | Contiene |
| --- | --- |
| Una carpeta | `C:\Users\Usuario\Desktop\Restaurante <Nombre>` (configurable) |
| Una base de datos | `.local/restaurante.sqlite` |
| Una contraseña | `.local/acceso-local.json` |
| Un puerto | `restaurante.config.json` |
| Una carta | 16 platos de ejemplo, 4 secciones de comida y Bebidas vacía |

Nada de lo que hagas en una instalación afecta a la plantilla ni a otros restaurantes.

**Cada proyecto empieza por [PROTOCOLO.md](PROTOCOLO.md)**: respaldo en el Escritorio, repositorio propio en GitHub y autorización antes de tocar Cloudflare.

**La plantilla tiene su propia base de prueba** (`.local/`, contraseña `123456`) con 4 secciones de comida, 16 platos de ejemplo y Bebidas vacía. Sirve para ver cómo queda la carta y probar el administrador sin tocar a ningún cliente. Se recrea cuando quieras con `npm run demo -- --reset`, y **no se copia** a las instalaciones nuevas: cada restaurante recibe su base y su contraseña.

---

## 1. Crear el restaurante (2 minutos)

### Opción A · Doble clic (recomendada)

Doble clic en **`NUEVO-RESTAURANTE.cmd`**. El programa pregunta, una cosa por vez:

1. **¿Cómo se llama el restaurante?** (obligatorio)
2. **Eslogan** de la cabecera (Enter deja `COCINA CON PERSONALIDAD`, luego se cambia en `/admin`).
3. **Logo**: arrastra el archivo a la ventana o escribe su ruta (JPG, PNG o WebP de hasta 1 MiB). Enter si todavía no lo tienes.
4. **Cabecera**: la banda horizontal que va encima del nombre, mismo formato. Enter si no hay.
5. **Puerto**: Enter busca el primero libre desde el 4182; también puedes fijar uno.
6. **Carpeta donde guardar los restaurantes**: Enter acepta la de por defecto; si escribes otra, se recuerda para la próxima vez. La carpeta del restaurante se crea dentro con su nombre (`Restaurante Taro`, por ejemplo).
7. Antes de crear nada muestra un resumen y pide confirmación (`S`/`n`).

Al terminar te dice la carpeta, las direcciones y **la contraseña de administrador de ese
restaurante**. Anótala: se guarda en `.local/acceso-local.json`.

Las imágenes se colocan de verdad en la carta nueva (no son una copia de la plantilla) y
ambas quedan preparadas durante la creación. La identidad no se edita desde el admin del cliente.

### Opción B · Terminal

```text
npm run nuevo -- "La Brasa de Marta"
```

Así no se pregunta nada: todo lo que no se indique toma su valor por defecto. Para forzar
el cuestionario aunque escribas el nombre, añade `--interactivo`.

Opciones disponibles:

| Opción | Ejemplo | Para qué |
| --- | --- | --- |
| `--base <ruta>` | `--base C:\Clientes` | Carpeta donde se crearán los restaurantes |
| `--carpeta <ruta>` | `--carpeta C:\Clientes\LaBrasa` | Nombre exacto de la carpeta a crear |
| `--puerto <n>` | `--puerto 4200` | Fijar el puerto en vez de buscarlo |
| `--eslogan "..."` | `--eslogan "COCINA DE MERCADO"` | Eslogan inicial bajo el nombre |
| `--logo <ruta>` | `--logo C:\logos\taro.png` | Dejar el logo colocado |
| `--cabecera <ruta>` | `--cabecera C:\logos\banda.jpg` | Dejar la banda de cabecera colocada |
| `--interactivo` | | Preguntar aunque se pase el nombre |
| `--sin-inicializar` | | No crear la base todavía (no admite `--logo` ni `--cabecera`) |

También se puede llamar al script directamente:
`node scripts/nuevo-restaurante.mjs "Nombre del restaurante"`.

El nombre va entre comillas y **sin comillas dentro del texto**. Si el entrecomillado llega
roto (por ejemplo, un `--` suelto), el generador se detiene con un aviso en vez de crear
una carpeta con un nombre extraño.

### Dónde se crean los restaurantes

Lo decide `plantilla.config.json`, en la raíz de la plantilla:

```json
{
  "carpetaRestaurantes": "C:\\Users\\Usuario\\Desktop",
  "prefijoCarpeta": "Restaurante "
}
```

Con eso, «La Brasa de Marta» se crea en `C:\Users\Usuario\Desktop\Restaurante La Brasa de Marta`.
Cada restaurante nuevo recibe su propia carpeta, base, contraseña y puerto; la plantilla no se toca.

- **Cambiar el destino**: edita `carpetaRestaurantes` (o escribe otra ruta cuando el cuestionario la pida; se guarda sola).
- **Caracteres no válidos** (`/ \ : * ? " < > |`) se eliminan del nombre de la carpeta; el nombre de la carta no cambia.
- El cuestionario **muestra la ruta final antes de confirmar**.
- Este archivo no se copia a los restaurantes: es preferencia de la fábrica, no del cliente.

### Qué hace el generador, exactamente

- **Copia** `public/`, `src/`, `scripts/`, `cloudflare/`, `tests/`, `package.json`,
  `package-lock.json`, `.gitignore`, `README.md`, `INICIAR.cmd`,
  `NUEVO-RESTAURANTE.cmd`, `wrangler.example.jsonc`, esta guía y el ejemplo de configuración.
- **Nunca copia** `.local/`, `dist/`, `node_modules/`, `.git/`, `.wrangler/`,
  `test-results/`, `.test-output/` ni `.env*`. Así no se heredan contraseñas, datos,
  fotos de otro restaurante ni historial de Git.
- **Nunca sobrescribe**: si la carpeta de destino ya existe y tiene contenido, se detiene.
- **Crea la carpeta del restaurante** en la carpeta base configurada, con el nombre del restaurante (`Restaurante <Nombre>`).
- **Elige un puerto libre** desde el 4182 hacia arriba y lo guarda en `restaurante.config.json`.
- **Crea una base nueva** con 4 secciones de comida, 16 platos de ejemplo y Bebidas vacía ya sembrados y
  **una contraseña aleatoria distinta** para ese restaurante.
- **Coloca el logo y la cabecera** subiéndolos por la API real, con las mismas validaciones
  que el administrador.
- **No cambia** la plantilla maestra.

---

## 2. Abrir el restaurante

Dentro de la carpeta nueva:

- Doble clic en **`INICIAR.cmd`**, o
- Terminal: `npm run dev`

La consola muestra el nombre del restaurante, la dirección de la carta y la de
administración. **Mantén esa ventana abierta** mientras se use la carta. Para cerrar
el servidor, pulsa `Ctrl+C` en esa ventana.

- Carta: `http://127.0.0.1:<puerto>/`
- Administración: `http://127.0.0.1:<puerto>/admin`

El servidor solo escucha en `127.0.0.1` (este ordenador). No es accesible desde otros
dispositivos por defecto.

### Si olvidas la contraseña

```text
npm run acceso
```

Muestra la carta, la administración y la contraseña local de esa instalación concreta.

Si además quieres **generar una contraseña nueva** (por ejemplo, porque se ha compartido
con alguien que ya no debe entrar): cierra el servidor, borra **solo**
`.local/acceso-local.json` y arranca otra vez. Se crea una contraseña nueva y la carta,
los platos y las fotos se conservan. No borres `restaurante.sqlite`.

---

## 3. Personalizar desde el administrador

1. Entra en `/admin` e introduce la contraseña.
2. Despliega **Carta → Secciones**: edita los nombres en español, inglés y alemán,
   añade secciones o quita las que estén vacías. Guarda con **Guardar secciones**.
   Si una sección tiene platos, muévelos primero a otra desde el editor de cada plato.
3. **Carta → Platos**: pulsa un plato para editarlo o **Añadir**. En el mismo formulario
   están el precio, la descripción, la foto, los 14 alérgenos y las traducciones.
4. **Guardar** aplica solo esa edición y se ve en la carta al recargar.
5. La identidad (nombre, eslogan, logo y cabecera) se prepara al crear el restaurante. La retirada del aviso de demostración se prepara como parte de la entrega, fuera del admin del cliente.

Las fotos se reducen solas antes de subirlas (máximo 750 KiB en el editor, 1 MiB en el
servidor). Si el logo no tiene fondo transparente, usa PNG o WebP: el JPG añade un fondo
blanco que se nota sobre el papel.

Los 16 platos vienen con texto de ejemplo y **sin alérgenos asignados**: una selección
vacía no significa "sin alérgenos". Revísalos todos antes de usarla con clientes reales.

---

## 4. Varios restaurantes a la vez

Cada instalación tiene su puerto en `restaurante.config.json`, así que pueden convivir
sin chocar:

```json
{
  "nombre": "La Brasa de Marta",
  "eslogan": "COCINA DE MERCADO",
  "puerto": 4183,
  "host": "127.0.0.1"
}
```

- El generador ya elige uno libre; si quieres cambiarlo, edita `puerto` y arranca.
- El nombre y el eslogan del archivo **solo se aplican al crear la base**. Después manda
  lo que guardes en el administrador (que es lo correcto: el cliente puede cambiar su
  nombre sin tocar archivos).
- Por orden de prioridad: variable de entorno `PORT` › `restaurante.config.json` › 4182.

Si necesitas forzar el puerto solo en una ejecución:

- PowerShell: `$env:PORT=4200; npm run dev`
- Símbolo del sistema: `set PORT=4200 && npm run dev`

> En Windows **no** funciona `PORT=4200 npm run dev` (esa sintaxis es de Linux/macOS).

---

## 5. Ajustes que se hacen en el código (no en el administrador)

| Qué | Dónde |
| --- | --- |
| Firma **CUSAC** del pie de carta | `public/app.js`, función `footer()` |
| Colores (papel, tinta, rojo) | `public/style.css`, variables `--paper`, `--ink`, `--red` |
| Nombre de la app al instalarla en el móvil | `public/carta.webmanifest` y `public/admin.webmanifest` |
| Iconos de carta y de administración | `public/assets/carta-*.png` y `admin-*.png` |
| Lista de 14 alérgenos y sus nombres | `public/domain.js`, `allergens` |
| Platos y secciones de ejemplo | `public/domain.js`, función `seed()` |

Si cambias `seed()`, afecta a las instalaciones **nuevas**; las que ya existen conservan
su base de datos.

---

## 6. Publicar en Cloudflare (opcional)

Publicar significa salir de este ordenador: la carta deja de ser local y pasa a verse en
internet. Requiere cuenta de Cloudflare, autorización del propietario y cerrar antes tres
cosas: **contraseña fuerte** (no `123456`), **alérgenos revisados** y **aviso de demostración
desactivado**.

Dentro de la carpeta del restaurante, una sola orden prepara el paquete:

```text
npm run exportar
```

Genera `deploy/` con el esquema, **la carta real en SQL**, las fotos y `DESPLIEGUE.md` con
los comandos exactos; además crea un `wrangler.jsonc` real al que solo falta el identificador.

1. **Crear la base**: `npx wrangler d1 create <proyecto>-db` y pegar el `database_id` en `wrangler.jsonc`.
2. **Cargar esquema y carta**: `npx wrangler d1 execute <proyecto>-db --remote --file=deploy/01-esquema.sql` y lo mismo con `deploy/02-carta.sql`.
3. **Secretos**: `node scripts/secretos.mjs "clave-larga"` y configurar `ADMIN_SALT` y `ADMIN_HASH` en el proyecto Pages.
4. **Publicar**: `npm run build` y `npx wrangler pages deploy dist --project-name <proyecto>`.
5. **Fotos**: `node scripts/subir-fotos.mjs https://<proyecto>.pages.dev "clave-larga"`. Las sube por la API y comprueba que todas cargan.

Las fotos no van dentro del SQL porque los binarios se corrompen al trocearlos; se suben
con los mismos bytes, así que el hash coincide con el que ya referencia la carta.

### Una cuenta de Cloudflare por cliente

Cada restaurante va a **su propia cuenta**: el dominio, el consumo y la factura quedan a
nombre del cliente, y tus demos no se mezclan con sus datos.

1. El cliente crea la cuenta (o te invita a la suya). Gratis.
2. En la carpeta del restaurante: `npx wrangler logout` y luego `npx wrangler login` con **esa** cuenta.
3. `npm run comprobar` y confirma que el correo que muestra es el del cliente.
4. Sigue los pasos de `deploy/DESPLIEGUE.md`.
5. Al terminar, `npx wrangler logout` para no dejar la sesión del cliente activa en tu equipo.

El comando `npm run comprobar` es el candado: verifica la cuenta conectada, el nombre del
proyecto y que la base D1 remota contiene la carta de este restaurante y no la de otro.
Si algo no cuadra, se detiene en vez de publicar la carta equivocada.
**El despliegue remoto y el runtime D1 no están verificados** en esta entrega: se ha probado
en local que el SQL exportado reconstruye la carta y que las fotos quedan servidas.

---
## 6 bis. Antes de entregar el proyecto al cliente

Mientras se enseña, se puede usar una clave sencilla. El día de la entrega hay que cambiarla:

```text
npm run clave-nube -- "UnaClaveLarga2026" taro
```

Deja la clave nueva configurada en Cloudflare. Después, comprueba que entras en `/admin` con ella antes de dar el proyecto por entregado.

La carta mantiene una etiqueta `noindex` para que los buscadores no la listen mientras es una propuesta.
## 7. Copias de seguridad

1. Cierra el servidor (`Ctrl+C`).
2. Copia la **carpeta completa** del restaurante, con `.local/` dentro, a un disco o
   carpeta privada (`backups-private/` está ignorada por Git).

Así se guardan la carta, las fotos y la contraseña. **No copies `.local/` de un
restaurante a otro**: heredaría sus datos y su contraseña.

---

## 8. Problemas frecuentes

| Mensaje o síntoma | Causa y solución |
| --- | --- |
| `La carpeta ya existe y no está vacía` | Protección para no sobrescribir. Usa otro nombre u `--carpeta`. |
| `Nombre no válido: ...` | El nombre llegó con comillas o guiones dobles (entrecomillado roto en la consola). Repite la orden escribiendo solo el nombre entre comillas. |
| `No hay ningún puerto libre entre 4182 y ...` | Cierra otras cartas abiertas o indica `--puerto 4300`. |
| La carta no abre y la consola está cerrada | El servidor solo funciona con esa ventana abierta. Vuelve a `INICIAR.cmd`. |
| `EADDRINUSE` al arrancar | Otro programa usa ese puerto. Cambia `puerto` en `restaurante.config.json`. |
| No recuerdo la contraseña | `npm run acceso`. |
| Quiero reiniciar la carta de ejemplo | Cierra el servidor, guarda una copia de `.local/` y borra solo `restaurante.sqlite` (y sus `-wal`/`-shm`). Al arrancar se siembra de nuevo. |

---

## 9. Correcciones respecto a la nota anterior (`Para crear y configurar un nuevo re.txt`)

Esa nota describía el procedimiento manual y tenía tres errores que ya están resueltos:

1. **`PORT=4183 npm run dev` no funciona en Windows.** Es sintaxis de Linux/macOS. Aquí: `$env:PORT=4183; npm run dev` (PowerShell) o `set PORT=4183 && npm run dev` (CMD), y lo normal es no tocarlo porque el generador asigna el puerto.
2. **`npm install` no es necesario para usar la carta.** La aplicación solo usa módulos
   internos de Node.js 24. `npm install` solo hace falta para las pruebas de navegador
   con Playwright.
3. **Copiar carpetas a mano era fácil de equivocar** y podía arrastrar `.local/`,
   `dist/` o `node_modules/` de otro restaurante. Ahora el generador copia solo lo
   reutilizable, se niega a sobrescribir y crea la contraseña y la base por ti.

### Bebidas (13/11/2026)

Las nuevas instalaciones incluyen Bebidas vacía y los grupos Refrescos y cervezas, Vinos y Combinados, además de las cuatro secciones de comida y sus 16 ejemplos. No se generan bebidas, precios ni fotos. Carta → Secciones permite cambiar tipos y gestionar grupos; Carta → Bebidas gestiona sus productos. El generador copia el código actualizado, no la base, credenciales, fotos ni respaldos de esta plantilla.

### Eventos multilingües y compartir (13/11/2026)

Las instalaciones nuevas incorporan traducciones manuales de eventos al inglés y alemán, con español como alternativa por campo. Conciertos y Cumpleaños incluyen las traducciones completas y permanecen ocultos. El editor conserva valores antiguos de botones sin mostrar sus campos. Una sola acción Compartir evento utiliza compartición nativa o copia, y conserva el idioma del enlace. Los detalles son adaptables de 320 a 1440 px. El generador incluye playwright.config.mjs para limitar las pruebas de navegador a tests/*.spec.mjs.
