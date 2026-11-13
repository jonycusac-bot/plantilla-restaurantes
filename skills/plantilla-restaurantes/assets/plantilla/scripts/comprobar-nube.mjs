import {readFile} from 'node:fs/promises';import {join,resolve} from 'node:path';import {fileURLToPath} from 'node:url';import {exec} from 'node:child_process';import {promisify} from 'node:util';import {DatabaseSync} from 'node:sqlite';
const ejecutar=promisify(exec);
const OPCIONES={maxBuffer:16*1024*1024,timeout:120000};

async function wrangler(argumentos){
 try{const {stdout,stderr}=await ejecutar(`npx --yes wrangler@latest ${argumentos}`,OPCIONES);return stdout+stderr;}
 catch(e){throw new Error((e.stdout||'')+(e.stderr||'')||e.message);}
}

// Decide si los recursos remotos son de ESTE restaurante. Pura, para poder probarla sin nube.
export function problemasDeMezcla({nombreLocal,nombreRemoto,errorRemoto,databaseId}){
 const problemas=[];
 if(!nombreLocal)problemas.push('La carta local no tiene nombre.');
 if(errorRemoto)problemas.push(`No pude leer la carta remota: ${errorRemoto}`);
 else if(nombreLocal&&nombreRemoto!==nombreLocal)problemas.push(`La base remota es de "${nombreRemoto}" y la local de "${nombreLocal}". Estás a punto de mezclar dos restaurantes.`);
 if(databaseId==='REEMPLAZAR_POR_ID_NUEVO')problemas.push('wrangler.jsonc todavía tiene el identificador de ejemplo.');
 return problemas;
}

const esMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(esMain){
 const raiz=resolve(process.argv[2]||process.cwd());
 const local=join(raiz,'.local','restaurante.sqlite');
 let nombreLocal=null,platosLocal=null;
 try{
  const db=new DatabaseSync(local);
  const fila=db.prepare('SELECT payload FROM restaurant_state WHERE id=1').get();
  db.close();
  if(fila){const estado=JSON.parse(fila.payload);nombreLocal=estado.restaurant?.name||null;platosLocal=estado.dishes?.length??null;}
 }catch(e){console.error(`\nNo puedo leer la carta local en ${local}: ${e.message}\n`);process.exit(1);}

 let config;
 try{config=JSON.parse((await readFile(join(raiz,'wrangler.jsonc'),'utf8')).replace(/^\s*\/\/.*$/gm,''));}
 catch{console.error('\nNo encuentro wrangler.jsonc (o no es JSON válido). Ejecuta antes: npm run exportar\n');process.exit(1);}
 const base=config.d1_databases?.[0];
 if(!base||!base.database_name){console.error('\nwrangler.jsonc no tiene una base D1 configurada.\n');process.exit(1);}

 console.log('\n=== COMPROBACIÓN ANTES DE PUBLICAR ===\n');
 const quien=await wrangler('whoami');
 const correo=(quien.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)||[])[0];
 console.log('Cuenta conectada :',correo||'(no se pudo leer: revisa "wrangler whoami")');
 console.log('Proyecto         :',config.name||'(sin nombre)');
 console.log('Base D1          :',base.database_name,'· id',String(base.database_id).slice(0,8)+'…');
 console.log('Carta local      :',nombreLocal??'(vacía)','·',platosLocal??'?','platos');

 let nombreRemoto=null,platosRemoto=null,errorRemoto=null;
 try{
  const salida=await wrangler(`d1 execute ${base.database_name} --remote --json --command "SELECT payload FROM restaurant_state WHERE id=1"`);
  const datos=JSON.parse(salida.slice(salida.indexOf('['),salida.lastIndexOf(']')+1));
  const fila=datos?.[0]?.results?.[0];
  if(fila?.payload){const estado=JSON.parse(fila.payload);nombreRemoto=estado.restaurant?.name||null;platosRemoto=estado.dishes?.length??null;}
  else errorRemoto='la base remota no tiene carta';
 }catch(e){errorRemoto=e.message.split('\n').filter(Boolean)[0];}
 console.log('Carta remota     :',nombreRemoto??'(vacía)','·',platosRemoto??'?','platos');

 const problemas=problemasDeMezcla({nombreLocal,nombreRemoto,errorRemoto,databaseId:base.database_id});
 console.log('');
 if(problemas.length){
  for(const problema of problemas)console.log('  ✗ '+problema);
  console.log('\nNO PUBLIQUES todavía. Corrige lo anterior y vuelve a comprobar.\n');
  process.exitCode=1;
 }else{
  console.log(`  ✓ Todo cuadra: la base "${base.database_name}" contiene la carta de "${nombreLocal}" y el proyecto es "${config.name}".`);
  console.log('    Puedes desplegar.\n');
 }
}
