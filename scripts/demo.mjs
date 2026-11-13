import {readFile,writeFile,access} from 'node:fs/promises';import {join} from 'node:path';import {fileURLToPath} from 'node:url';import {randomBytes} from 'node:crypto';import {DatabaseSync} from 'node:sqlite';
import {start} from './local.mjs';import {loadProfile,seedState,CONFIG_FILE} from './perfil.mjs';import {passwordHash} from '../src/worker.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const dataDir=join(root,'.local');
const base=join(dataDir,'restaurante.sqlite');
const acceso=join(dataDir,'acceso-local.json');
const CLAVE_PRUEBA='123456';
const reiniciar=process.argv.includes('--reset');
const existe=async ruta=>{try{await access(ruta);return true;}catch{return false;}};

// Solo la plantilla maestra puede tener base de prueba. Una instalación de cliente
// tiene restaurante.config.json, y aquí se borraría su carta.
if(await existe(join(root,CONFIG_FILE))){
 console.error(`\nEste comando es solo para la plantilla maestra.\n"${CONFIG_FILE}" indica que esta carpeta es la instalación de un restaurante y reconstruir la base borraría su carta.\nPara ver la contraseña de esta instalación: npm run acceso\n`);
 process.exit(1);
}

const perfil=await loadProfile(root);
if(await existe(acceso)&&!reiniciar){
 const actual=JSON.parse(await readFile(acceso,'utf8'));
 console.log(`\nLa base de prueba ya existe en ${dataDir}`);
 console.log(`Restaurante: ${perfil.nombre}`);
 console.log(`Carta: http://127.0.0.1:${perfil.puerto}/`);
 console.log(`Contraseña: ${actual.password}`);
 console.log('\nPara reconstruirla desde cero (borra la carta y las fotos de prueba):');
 console.log('  npm run demo -- --reset\n');
}else{
 if(!await existe(base)){const app=await start({port:0,dataDir,password:CLAVE_PRUEBA});await app.close();}
 const db=new DatabaseSync(base);
 db.exec('PRAGMA journal_mode=WAL;');
 for(const tabla of ['restaurant_sessions','restaurant_attempts','restaurant_images'])db.exec(`DELETE FROM ${tabla}`);
 const estado=JSON.stringify(seedState(perfil));
 if(db.prepare('SELECT count(*) AS n FROM restaurant_state WHERE id=1').get().n)db.prepare('UPDATE restaurant_state SET payload=?,revision=1 WHERE id=1').run(estado);
 else db.prepare('INSERT INTO restaurant_state(id,revision,payload) VALUES(1,1,?)').run(estado);
 db.close();
 const salt=randomBytes(20).toString('hex');
 const hash=await passwordHash(CLAVE_PRUEBA,salt);
 await writeFile(acceso,JSON.stringify({ADMIN_SALT:salt,ADMIN_HASH:hash,password:CLAVE_PRUEBA},null,2)+'\n');
 console.log(`\nBase de prueba ${reiniciar?'reconstruida':'creada'} en ${dataDir}`);
 console.log(`Restaurante: ${perfil.nombre} · ${perfil.eslogan}`);
 console.log('Contenido: 4 secciones de comida, Bebidas vacía y 16 platos de ejemplo, aviso de demostración activo, sin logo ni cabecera.');
 console.log(`Carta: http://127.0.0.1:${perfil.puerto}/`);
 console.log(`Contraseña: ${CLAVE_PRUEBA}`);
 console.log('\nSolo para probar la plantilla: esta base NO se copia a los restaurantes nuevos.');
 console.log('Arranca con "npm run dev" (o INICIAR.cmd).\n');
}
