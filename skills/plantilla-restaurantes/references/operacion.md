# Operación y protocolo

## Aislamiento

Un restaurante tiene su propia carpeta, base, contraseña, configuración y, si se publica, cuenta y recursos identificados expresamente. Leer las instrucciones del destino. El pedido autoriza su alcance concreto; no se extiende a proyectos vecinos, cuentas, archivos de Windows, instalación de programas o detención de servicios. Las instrucciones actuales del usuario prevalecen sobre procedimientos históricos. Un respaldo o cierre no autoriza commit, push o publicación.

## Respaldo consistente

Antes de modificar una instalación existente, guardar código, documentación, configuración disponible (`restaurante.config.json`, `wrangler.jsonc`, `deploy/`) y `.local/` completo en una carpeta nueva fechada sin sobrescribir. Preferir un destino de respaldos autorizado; si se limita el trabajo al proyecto, usar `RESPALDOS/` dentro de él y excluirlo de Git, generador y build. Anotar ubicación y resultados en `BITACORA.md`.

No copiar únicamente el archivo SQLite mientras se escribe en WAL: puede faltar información confirmada. Usar `backup` de `node:sqlite` para obtener una instantánea consistente; abrir la copia, ejecutar `PRAGMA integrity_check`, leer `restaurant_state` y contar productos, secciones y filas de `restaurant_images` (fotos BLOB). Conservar accesos locales privados sin imprimirlos. Verificar hashes de código/configuración y comparar carta/identidad/fotos/eventos/redes antes y después. Coordinar una pausa de edición si se escriben código/configuración durante el respaldo; no parar servidores sin autorización.

## Uso local

Node 24 o superior, sin dependencias de producción. En el destino: `npm run dev` arranca el servidor y `npm run acceso` permite al propietario consultar su acceso. La contraseña nueva está en `.local/acceso-local.json`, no se comparte ni publica. La clave conocida `123456` solo corresponde a la demo deliberada de la plantilla cuando se usa `npm run demo`; el generador crea una aleatoria por cliente.

`npm run demo -- --reset` borra datos/fotos y cambia el acceso de la demo: no usar para adaptar, reparar o migrar. El bloqueo cuando existe perfil de cliente no sustituye al respaldo. El perfil aplica identidad al crear la base; una base existente conserva su identidad guardada. Puerto: `PORT`, perfil, 4182. El generador busca uno libre. Red distinta de loopback requiere decisión explícita; emular móvil no prueba un teléfono físico.

## Exportación y nube

`npm run build` genera `dist/` y `.local/seed-template.sql` con semilla ficticia; no exporta la carta real ni publica. `npm run exportar` lee la base real y escribe `deploy/` y `wrangler.jsonc`: respaldar y revisar la configuración existente. No aplicar su SQL sobre datos que haya que conservar: sustituye el estado.

Las fotos no viajan como binarios SQL. El paquete incluye `deploy/fotos/`; se suben por API conservando hashes. No concatenar BLOB con `bytes || X'...'`: se observó conversión a texto y corrupción por bytes nulos. Utilizar los scripts y comprobar imágenes por API.

Antes de cualquier operación Cloudflare identificar directorio, cuenta y destino nuevo o existente, y obtener autorización correspondiente. Solo entonces realizar consultas remotas. `npm run comprobar` consulta cuenta y D1 para detectar mezcla de restaurantes; no es local. `clave-nube`, `subir-fotos`, Wrangler, creación de recursos y cambios de contraseña tampoco se ejecutan por iniciativa propia.

En publicación autorizada: respaldo del destino existente, revisar paquete, comprobar cuenta/identidad/base, aplicar solo migraciones pertinentes, desplegar y verificar HTTPS del proyecto autorizado. Registrar lo creado/modificado y límites. Los tests SQLite no validan D1 remoto. Compartir desde redes o el dispositivo no equivale a publicar automáticamente; no enviar mensajes a terceros sin instrucciones explícitas.
