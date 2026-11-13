import {prepareDemoEventTranslations} from '../public/events.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {join,resolve} from 'node:path';import {fileURLToPath} from 'node:url';import {DatabaseSync} from 'node:sqlite';
import {initializeBeverages} from '../public/domain.js';
import {loadProfile} from './perfil.mjs';

const EXTENSIONES={'image/png':'png','image/webp':'webp','image/jpeg':'jpg'};
const escapar=texto=>String(texto).replace(/'/g,"''");
const slugProyecto=n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'restaurante';

export async function exportar({carpeta=process.cwd(),salida}={}){
 const raiz=resolve(carpeta);
 const base=join(raiz,'.local','restaurante.sqlite');
 let db;
 try{db=new DatabaseSync(base);}
 catch{throw new Error(`No encuentro la base de este restaurante en ${base}\nArranca la carta al menos una vez (npm run dev) antes de exportarla.`);}
 let fila,imagenes;const extras=[];
 try{
  db.exec('BEGIN');
  fila=db.prepare('SELECT payload,revision FROM restaurant_state WHERE id=1').get();
  for(const kind of ['events','socials']){const table='restaurant_'+kind;if(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)){const row=db.prepare('SELECT payload,revision FROM '+table+' WHERE id=1').get();if(row){if(kind==='events')row.payload=JSON.stringify(prepareDemoEventTranslations(JSON.parse(row.payload)));extras.push({table,...row});}}}
  imagenes=db.prepare('SELECT id,mime,bytes FROM restaurant_images ORDER BY id').all();
 }finally{db.exec('ROLLBACK');db.close();}
 if(!fila)throw new Error('La base existe pero no tiene carta. Arranca la carta una vez y vuelve a intentarlo.');
 let estado;
 try{estado=initializeBeverages(JSON.parse(fila.payload));fila.payload=JSON.stringify(estado);}catch{throw new Error('La carta guardada no es JSON válido; no se exporta nada.');}

 const perfil=await loadProfile(raiz);
 const nombre=estado.restaurant?.name||perfil.nombre;
 const proyecto=slugProyecto(nombre);
 const destino=resolve(salida||join(raiz,'deploy'));
 await mkdir(join(destino,'fotos'),{recursive:true});

 await writeFile(join(destino,'01-esquema.sql'),await readFile(join(raiz,'cloudflare','schema.sql'),'utf8'));

 const sentencias=[
  `-- Carta real de "${nombre}" exportada el ${new Date().toISOString().slice(0,10)}`,
  `-- ${estado.dishes.length} platos · ${estado.categories.length} secciones · ${imagenes.length} fotos`,
  '-- Aplicar con: npx wrangler d1 execute <base> --remote --file=deploy/02-carta.sql',
  'DELETE FROM restaurant_sessions;',
  'DELETE FROM restaurant_attempts;',
  `INSERT OR REPLACE INTO restaurant_state(id,revision,payload) VALUES(1,${Number(fila.revision)||1},'${escapar(fila.payload)}');`
 ];
 for(const row of extras)sentencias.push("INSERT OR REPLACE INTO "+row.table+"(id,revision,payload) VALUES(1,"+Number(row.revision)+",'"+escapar(row.payload)+"');");
 await writeFile(join(destino,'02-carta.sql'),sentencias.join('\n')+'\n');

 const fotos=[];
 for(const imagen of imagenes){
  const archivo=`${imagen.id}.${EXTENSIONES[imagen.mime]||'bin'}`;
  await writeFile(join(destino,'fotos',archivo),Buffer.from(imagen.bytes));
  fotos.push({archivo,bytes:imagen.bytes.length});
 }

 const wrangler={
  "$schema":"node_modules/wrangler/config-schema.json",
  name:proyecto,
  pages_build_output_dir:"./dist",
  compatibility_date:new Date().toISOString().slice(0,10),
  d1_databases:[{binding:'DB',database_name:`${proyecto}-db`,database_id:'REEMPLAZAR_POR_ID_NUEVO'}]
 };
 // Si ya hay un wrangler.jsonc de este mismo proyecto con una base real, no se pierde el identificador.
 try{
  const previo=JSON.parse((await readFile(join(raiz,'wrangler.jsonc'),'utf8')).replace(/^\s*\/\/.*$/gm,''));
  const basePrevia=previo.d1_databases?.[0];
  if(previo.name===proyecto&&basePrevia?.database_id&&basePrevia.database_id!=='REEMPLAZAR_POR_ID_NUEVO'){
   wrangler.d1_databases[0].database_id=basePrevia.database_id;
   wrangler.d1_databases[0].database_name=basePrevia.database_name||`${proyecto}-db`;
  }
 }catch{}
 await writeFile(join(raiz,'wrangler.jsonc'),
  '// Generado por "npm run exportar". Rellena database_id con el de TU base D1.\n'+JSON.stringify(wrangler,null,2)+'\n');

 const kb=(fotos.reduce((t,f)=>t+f.bytes,0)/1024).toFixed(0);
 await writeFile(join(destino,'DESPLIEGUE.md'),`# Despliegue en Cloudflare — ${nombre}

Generado el ${new Date().toISOString().slice(0,16).replace('T',' ')} desde esta instalación.

- Carta: **${estado.dishes.length} platos** en ${estado.categories.length} secciones
- Fotos: **${imagenes.length}** (${kb} KB), en \`deploy/fotos/\`
- Base D1 propuesta: \`${proyecto}-db\`
- Requiere: Node 24, cuenta de Cloudflare y **autorización del propietario**

## 0. Comprobar que no se mezclan restaurantes

\`\`\`text
npm run comprobar
\`\`\`

Muestra con qué cuenta de Cloudflare estás conectado y verifica que la base D1 contiene
la carta de **este** restaurante. Si la base es de otro, se detiene y no hay que seguir.

## 1. Crear la base D1

\`\`\`text
npx wrangler d1 create ${proyecto}-db
\`\`\`

Copia el \`database_id\` que devuelve en \`wrangler.jsonc\` (sustituye \`REEMPLAZAR_POR_ID_NUEVO\`).

## 2. Aplicar esquema y carta

\`\`\`text
npx wrangler d1 execute ${proyecto}-db --remote --file=deploy/01-esquema.sql
npx wrangler d1 execute ${proyecto}-db --remote --file=deploy/02-carta.sql
\`\`\`

## 3. Generar los secretos del administrador

No reutilices la contraseña local. Elige una larga (mínimo 16 caracteres):

\`\`\`text
node scripts/secretos.mjs "una-clave-larga"
\`\`\`

Copia los dos valores:

\`\`\`text
npx wrangler pages secret put ADMIN_SALT --project-name ${proyecto}
npx wrangler pages secret put ADMIN_HASH --project-name ${proyecto}
\`\`\`

## 4. Publicar

\`\`\`text
npm run build
npx wrangler pages deploy dist --project-name ${proyecto}
\`\`\`

## 5. Subir las fotos a la base remota

Las fotos no viajan en el SQL: los binarios se corrompen al trocearlos. Se suben por la API con los mismos bytes, así que el hash coincide y las direcciones de la carta funcionan:

\`\`\`text
node scripts/subir-fotos.mjs https://${proyecto}.pages.dev "la-clave-del-paso-3"
\`\`\`

## 6. Antes de dar por bueno

- [ ] La carta carga con los ${estado.dishes.length} platos reales
- [ ] Todas las fotos se ven (el paso 5 lo comprueba solo)
- [ ] Entra en \`/admin\` con la clave del paso 3
- [ ] Quita el aviso de demostración si sigue activo
- [ ] Revisa alérgenos y precios antes de que lo vea el cliente
`);
 return {destino,carta:join(destino,'02-carta.sql'),fotos:join(destino,'fotos'),proyecto,platos:estado.dishes.length,secciones:estado.categories.length,imagenes:imagenes.length,bytesFotos:fotos.reduce((t,f)=>t+f.bytes,0)};
}

const esMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(esMain){
 const i=process.argv.indexOf('--carpeta');
 const carpeta=i>0?process.argv[i+1]:process.cwd();
 try{
  const r=await exportar({carpeta});
  console.log(`\nPaquete de despliegue listo en: ${r.destino}`);
  console.log(`Proyecto: ${r.proyecto} · ${r.platos} platos · ${r.secciones} secciones · ${r.imagenes} fotos (${(r.bytesFotos/1024).toFixed(0)} KB)`);
  console.log('Incluye: 01-esquema.sql, 02-carta.sql, fotos/ y DESPLIEGUE.md');
  console.log(`Además: ${join(resolve(carpeta),'wrangler.jsonc')} (falta pegar el database_id).\n`);
 }catch(e){console.error(`\nNo se pudo exportar: ${e.message}\n`);process.exitCode=1;}
}
