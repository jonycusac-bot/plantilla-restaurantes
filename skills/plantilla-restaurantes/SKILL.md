---
name: plantilla-restaurantes
description: Crea instalaciones independientes o adapta proyectos de carta digital de restaurantes usando esta plantilla de JavaScript, SQLite y Worker D1. Incluye administrador, platos, bebidas, subsecciones, idiomas, fotos, eventos, generador y exportación. Úsala para reutilizar esta plantilla o mantener sus funciones; no para modificar otros restaurantes por asociación.
---

# Plantilla de restaurantes

Usa la instantánea limpia de `assets/plantilla/` como punto de partida ejecutable. Contiene código, iconos genéricos y pruebas, sin bases, accesos locales, fotos de clientes ni recursos remotos. No necesita la carpeta original. Lee [operacion.md](references/operacion.md) antes de intervenir y [funciones-y-arquitectura.md](references/funciones-y-arquitectura.md) antes de cambiar comportamiento o datos.

## Crear un proyecto nuevo

Identifica nombre y carpeta de destino a partir del pedido. Pregunta solo por lo necesario que falte; eslogan, logo y cabecera pueden quedar pendientes. El puerto se asigna automáticamente. Requiere Node.js 24 o superior. Mantén `127.0.0.1` salvo autorización para acceso de red.

Desde cualquier directorio, sustituye la ruta del skill y utiliza una carpeta absoluta del proyecto solicitado:

```powershell
node "RUTA-DEL-SKILL/scripts/crear-proyecto.mjs" --nombre "Casa Olivo" --carpeta "C:/Proyectos/Casa Olivo" --eslogan "COCINA DE TEMPORADA"
```

El script usa el generador incluido y crea configuración, SQLite y contraseña aleatoria propias. No sobrescribe carpetas con contenido ni acepta crear dentro del skill. Opcionales: `--puerto`, `--logo`, `--cabecera`. No publiques contraseñas en la respuesta: indica el archivo privado `.local/acceso-local.json` y el comando `npm run acceso`.

La instalación inicial trae cuatro secciones de comida con 16 platos ficticios, Bebidas vacía con tres grupos y dos eventos demo ocultos. No inventes bebidas, fotos, precios reales, redes o alérgenos. Mantén el aviso de demo hasta la revisión del propietario. Usa solo imágenes proporcionadas para ese proyecto.

Trabaja desde entonces en el destino, no en los assets del skill. Lee su `PROTOCOLO.md`, prepara su bitácora y verifica con [pruebas-y-entrega.md](references/pruebas-y-entrega.md).

## Adaptar una instalación existente

Identifica el directorio objetivo; lee sus instrucciones y respalda consistentemente código, configuración y base antes de editar. Revisa su arquitectura y funciones para evitar duplicaciones. No ejecutes el generador sobre ella ni sustituyas su `.local/`, perfil o base. Integra lo solicitado; en otra arquitectura adapta los contratos en lugar de imponer este runtime.

Para bebidas conserva `kind`, `subcategories`, `subcategoryId`, el marcador de migración y los valores opcionales compatibles con JSON. No clasifiques productos por nombre. Para eventos conserva sus tablas y revisiones independientes. Consulta límites y contratos en [funciones-y-arquitectura.md](references/funciones-y-arquitectura.md).

Respeta identidad, carta, fotos, eventos, traducciones y configuración existentes. No accedas a TARO, INCH ni otro proyecto para buscar datos o credenciales. No transfieras a un cliente datos de otro.

## Entrega y autorizaciones

Prueba con bases aisladas, conserva evidencias y documenta archivos, migraciones, respaldo y resultados reales. Build y exportación locales no son publicación. Vuelve a probar el destino: los resultados históricos del paquete no demuestran su estado actual.

Publicar, crear recursos remotos, cambiar secretos, hacer commit/push o crear repositorios requiere autorización específica. Usar el skill no la concede. Si se autoriza despliegue, sigue la identificación cuenta/directorio/destino de [operacion.md](references/operacion.md). No ejecutes `npm run comprobar` en una tarea exclusivamente local: consulta Cloudflare.

Al actualizar este skill incorpora solo código genérico revisado; nunca `.local/`, `.git/`, respaldos, `dist/`, `deploy/`, credenciales o configuración real. Regenera el manifiesto y prueba el generador. La instantánea no se sincroniza automáticamente con la plantilla original.
