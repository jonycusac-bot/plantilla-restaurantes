# Nueva instalación independiente

Con Node 24+, ejecuta desde esta plantilla:

node scripts/nuevo-restaurante.mjs "Casa Olivo" --carpeta "RUTA-ABSOLUTA-DESTINO"

Nombre y carpeta corresponden al proyecto autorizado. Opcionales: --eslogan, --puerto, --logo, --cabecera. El destino no puede contener archivos existentes. Usa solo imágenes proporcionadas para ese restaurante.

El generador copia código y assets genéricos, nunca .local/, dist/, deploy/, node_modules/, .git/, accesos, respaldos o recursos remotos. Crea perfil, base y contraseña propios. No publiques contraseñas; consulta npm run acceso en la nueva carpeta.

La carta inicial tiene 16 ejemplos en cuatro secciones de comida, Bebidas vacía con Refrescos y cervezas / Vinos / Combinados, y dos eventos demo ocultos. Revisa los ejemplos y sus alérgenos; no hay bebidas ni fotos inventadas.

Arranca con INICIAR.cmd o npm run dev en el destino. Revisa PROTOCOLO.md y README.md. Para adaptar una instalación ya existente, respáldala y realiza integración selectiva; no uses este generador ni una semilla para reemplazar sus datos.
