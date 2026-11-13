# Skill reutilizable: plantilla-restaurantes

Creado e instalado el 13/11/2026.

- Instalado: C:/Users/Usuario/.codex/skills/plantilla-restaurantes
- Fuente mantenible: skills/plantilla-restaurantes/
- Paquete transportable: skills/plantilla-restaurantes.zip (77 archivos verificados por hash).
- Invocación: Usa $plantilla-restaurantes para crear un restaurante independiente llamado Casa Olivo en la carpeta que indique.

Incluye instrucciones, protocolos y referencias de carta/administración, bebidas y subsecciones, eventos/redes, idiomas, fotos optimizadas, autenticación/origen/conflictos, respaldos, migraciones, generador, build/exportación y pruebas. Lleva 68 archivos de plantilla limpia, independientes de la carpeta original. No contiene bases, accesos locales, credenciales, recursos Cloudflare ni fotografías de clientes. Los ejemplos de prueba y la contraseña deliberada de demo forman parte del código genérico; cada instalación generada usa un acceso aleatorio propio.

El generador del paquete incorpora PROTOCOLO.md; las pruebas de identidad se adaptaron al nombre del restaurante y el ejemplo de clave-nube es genérico. La documentación empaquetada se redactó sin historial, rutas privadas ni configuración real. La plantilla origen no se modificó para estas adaptaciones.

Scripts: crear-proyecto.mjs, validar-paquete.mjs y probar-portabilidad.mjs. El primero exige nombre/destino absoluto y no sobrescribe carpetas con contenido, crea dentro del skill ni imprime la contraseña. El segundo comprueba hashes/referencias y exclusión de datos privados. El tercero prueba dos instalaciones temporales, claves diferentes, bloqueo de sobrescritura, 18 pruebas Node y build.

Validación: quick_validate.py correcto; manifiesto/estructura/referencias correctos en fuente e instalación global; prueba de portabilidad correcta desde ambas ubicaciones; 18 pruebas Node y build del proyecto generado; 4 pruebas Chrome sobre una instalación con nombre propio. La prueba detectó dos supuestos de nombre fijo en tests y se corrigieron en el paquete. Para la QA de navegador se utilizó restaurantes/QA-Skill-20261113, excluido de Git y del paquete, con bases temporales. No quedó un servidor iniciado por las pruebas.

Código y tablas de carta/fotos/eventos/redes de la plantilla origen comparados con el respaldo previo: sin cambios durante la conversión. Archivos nuevos: skills/ y este informe; registro añadido a BITACORA.md. Sin modificación TARO/INCH, publicación, commit ni push.

Respaldo previo verificado: RESPALDOS/PLANTILLA/2026-11-13T18-47-02-696Z-previo-skill (16 platos, 5 secciones, 0 fotos). Respaldo final: RESPALDOS/PLANTILLA/2026-11-13T18-56-14-832Z-skill-final (incluye skill y ZIP, código/configuración y SQLite consistente, con integridad/recuentos/hashes).

El skill es una instantánea: las mejoras futuras de la plantilla no se incorporan automáticamente. Actualizar la fuente del skill, regenerar assets/manifest.json, validar, probar y reemplazar la instalación solo cuando se autorice actualizarla. El ZIP contiene la carpeta completa para copiarla al directorio de skills de otro entorno compatible.
