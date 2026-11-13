# Carta digital de restaurante

Proyecto independiente basado en plantilla-restaurantes. Node.js 24 o superior, sin dependencias de producción.

## Uso local

Ejecuta npm run dev o INICIAR.cmd. El puerto está en restaurante.config.json. Consulta tu contraseña propia con npm run acceso; se guarda en .local/acceso-local.json. No compartas ese archivo ni lo publiques.

## Funciones

Carta con búsqueda global e idiomas español/inglés/alemán, alérgenos y fotos optimizadas. Administración: Carta → Platos / Bebidas / Secciones, eventos y redes sociales. Bebidas tiene grupos editables y filtros; Todas incluye sin grupo. Un Guardar por formulario; Eliminar confirma. Una sección o grupo con productos, incluidos ocultos, no puede quitarse hasta trasladarlos.

La semilla incluye 16 platos ficticios, Bebidas vacía con tres grupos y dos eventos demo ocultos. Revisa carta, precios y alérgenos antes de uso real. No hay fotos o bebidas inventadas.

Identidad en restaurante.config.json solo al crear la base; los siguientes arranques conservan datos editados. Cada instalación tiene base y acceso propios. Lee PROTOCOLO.md antes de intervenir.

## Verificación

npm run check y npm test. Para navegador: instalar las dependencias de desarrollo autorizadas y usar npx playwright test tests/browser.spec.mjs tests/bebidas.browser.spec.mjs --workers=1 --reporter=line (Chrome instalado).

## Exportación

npm run build genera dist/ con semilla ficticia; no publica. npm run exportar genera deploy/ con la carta real y fotos, y wrangler.jsonc: revisar y respaldar antes. Publicar, consultar Cloudflare, cambiar secretos o subir fotos remotas requiere autorización específica. Las pruebas locales no validan D1 remoto.

Para otra instalación, consulta GUIA-NUEVO-RESTAURANTE.md. Nunca copies .local/, recursos remotos o secretos de un cliente a otro.
