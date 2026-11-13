# Protocolo de trabajo — Director de proyectos

Documento de obligado cumplimiento para cualquier proyecto que salga de esta plantilla.
Se escribe **antes** de tocar nada y se aplica proyecto a proyecto.

## Regla de oro

**Ningún proyecto se toca sin respaldo previo y sin permiso explícito. Ningún proyecto se toca por trabajar en otro.**

Si hay duda, se pregunta. Si no hay respuesta, no se hace.

## Papeles

| Quién | Qué hace |
| --- | --- |
| **Tú** | Eres el dueño de las cuentas, los repositorios y las decisiones. Creas los repos y autorizas cada paso sensible |
| **Yo (Director)** | Ejecuto, verifico y documento. Pregunto antes de cada acción que salga de la carpeta del proyecto. Nunca improviso fuera de lo autorizado |

## 1. Antes de tocar un proyecto (obligatorio)

### 1.1 Respaldo en el Escritorio

```
C:\Users\Usuario\Desktop\RESPALDOS\<Proyecto>\AAAAMMDD-HHMM\
```

Contenido del respaldo:

- `.local\` completo: base SQLite, `acceso-local.json` y las fotos dentro de la base
- `restaurante.config.json`
- `wrangler.jsonc` (si existe)
- `deploy\` (si existe)

Reglas del respaldo:

- **Nunca se sobrescribe**: cada respaldo es una carpeta nueva con fecha y hora
- **Se verifica**: abro la base copiada y cuento platos y fotos; no basta con copiar archivos
- Se anota la ruta y el resultado en la bitácora del proyecto

### 1.2 Repositorio en GitHub

- **Un repositorio privado por proyecto**, creado por ti: `restaurante-<nombre>`
- Me pasas la URL y hago el primer commit **antes** de cambiar nada
- **Sí va al repo**: código, documentación, configuración y `deploy/`
- **No va al repo**: `.local/` (contraseña, base y fotos). GitHub guarda el código; **el respaldo de los datos es la carpeta del Escritorio**

### 1.3 Solo entonces se empieza a trabajar

## 2. Cloudflare

**Nada** —crear proyectos, crear bases, desplegar, borrar, tocar secretos— sin tu OK escrito.
Y antes de cualquier subida, **siempre pregunto**, proyecto y directorio incluidos.

### 2.1 La pregunta obligatoria antes de subir

> ¿Quieres subir **[proyecto]** a Cloudflare?
> · **Directorio local:** [ruta exacta]
> · **Cuenta:** [correo]
> · **Destino:** ¿uno **nuevo** o uno que **ya existe**?
> · Si es nuevo: dime el nombre y la dirección y **lo creo solo entonces**.
> · Si ya existe: pásame la dirección y **no toco ningún otro**.

Sin respuesta, no se sube nada.

### 2.2 Reglas de la subida

- **Nunca toco proyectos que ya están hechos.** Ni para «comprobar», ni para reutilizar, ni para borrar.
- **Si hace falta un recurso nuevo, primero pregunto** y espero tu nombre y tu dirección. No creo nada por iniciativa propia.
- **Un proyecto, una carpeta, una cuenta.** Nunca dos restaurantes en el mismo proyecto ni en la misma base.
- Cada subida lleva su **respaldo previo** (punto 1.1) y su línea en la bitácora.
- Al terminar te digo exactamente qué se creó (nombre, identificador y dirección) y qué quedó publicado.
- Antes de desplegar se ejecuta `npm run comprobar`, que verifica cuenta, proyecto y que la base remota contiene la carta correcta.
- **Una cuenta por cliente** a partir del siguiente proyecto; las demos se quedan aparte.

## 3. Lo que no haré sin pedirlo

- Tocar otro proyecto, otro repositorio u otra cuenta
- Modificar archivos de Windows (como el archivo `hosts`), instalar programas o parar servicios
- Borrar carpetas, bases de datos o recursos en la nube
- Hacer `commit`, `push` o crear repositorios
- Cambiar contraseñas o secretos

## 4. Cómo pido permiso

Formato fijo, una sola pregunta:

> Voy a **[acción]** en **[ruta o recurso]** de la cuenta **[correo]**.
> Afecta a: **[alcance]**. Reversible: **[sí/no y cómo]**. Respaldo: **[ruta]**.
> ¿Lo hago?

Sin respuesta, no se hace.

## 5. Bitácora

Cada proyecto lleva un `BITACORA.md` con una línea por intervención:

```
2026-11-07 22:40 · respaldo creado en RESPALDOS\Taro\20261107-2240 · verificado: 10 platos, 11 fotos
2026-11-07 22:45 · carta exportada a deploy\ · sin cambios en Cloudflare
```

## 6. Si algo falla

1. Digo el error **literal**, sin adornos ni interpretaciones
2. No improviso arreglos que toquen otras cosas
3. Primero aseguro el estado (respaldo), luego diagnostico, luego propongo
4. Nada de cambios «de paso» mientras se arregla otra cosa

## 7. Cierre de proyecto

- Respaldo final del Escritorio
- Commit y `push` al repositorio del proyecto
- Resumen para ti: qué quedó publicado, en qué cuenta, con qué claves y dónde están los respaldos

## 8. Antecedentes que originan este protocolo

Un despliegue en Cloudflare se hizo sin pedir permiso previo y sin respaldo del proyecto
vecino. Aunque el proyecto no se modificó, la coincidencia de fechas generó una situación
que se podía haber evitado con dos preguntas y una copia. Este documento existe para que no
vuelva a ocurrir.
