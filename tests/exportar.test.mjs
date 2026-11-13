import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm,readFile,writeFile,readdir,mkdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';import {DatabaseSync} from 'node:sqlite';
import {nuevoRestaurante} from '../scripts/nuevo-restaurante.mjs';
import {exportar} from '../scripts/exportar.mjs';
import {problemasDeMezcla} from '../scripts/comprobar-nube.mjs';
import {subirFotos} from '../scripts/subir-fotos.mjs';
import {start} from '../scripts/local.mjs';
import {passwordHash} from '../src/worker.js';

const TEMPORAL=()=>mkdtemp(join(process.env.TMPDIR||tmpdir(),'exportar-'));
const activo=ruta=>fileURLToPath(new URL(`../public/assets/${ruta}`,import.meta.url));

test('Comprobación anti-mezcla: distingue la carta correcta de otra base',()=>{
 assert.deepEqual(problemasDeMezcla({nombreLocal:'Taro',nombreRemoto:'Taro',databaseId:'b6d2d1f4-7034'}),[]);
 const otra=problemasDeMezcla({nombreLocal:'Taro',nombreRemoto:'La Brasa',databaseId:'b6d2d1f4-7034'});
 assert.equal(otra.length,1);
 assert.match(otra[0],/La base remota es de "La Brasa" y la local de "Taro"/);
 assert.match(problemasDeMezcla({nombreLocal:'Taro',nombreRemoto:null,errorRemoto:'no such table',databaseId:'x'})[0],/No pude leer la carta remota/);
 assert.match(problemasDeMezcla({nombreLocal:'Taro',nombreRemoto:'Taro',databaseId:'REEMPLAZAR_POR_ID_NUEVO'})[0],/identificador de ejemplo/);
 assert.match(problemasDeMezcla({nombreLocal:null,nombreRemoto:'Taro',databaseId:'x'})[0],/no tiene nombre/);
});

test('Exportación: la carta real y sus fotos llegan al paquete de despliegue',async()=>{
 const temp=await TEMPORAL();
 try{
  const carpeta=join(temp,'Restaurante Nube');
  await nuevoRestaurante({nombre:'Restaurante Nube',carpeta,logo:activo('carta-192.png'),cabecera:activo('admin-192.png')});
  const paquete=await exportar({carpeta});
  assert.equal(paquete.platos,16);
  assert.equal(paquete.secciones,5);
  assert.equal(paquete.imagenes,2);
  assert.equal(paquete.proyecto,'restaurante-nube');

  for(const archivo of ['01-esquema.sql','02-carta.sql','DESPLIEGUE.md'])assert.ok(await readFile(join(paquete.destino,archivo),'utf8'),`Falta ${archivo}`);
  const fotos=await readdir(join(paquete.destino,'fotos'));
  assert.equal(fotos.length,2);
  const carta=await readFile(paquete.carta,'utf8');
  assert.match(carta,/INSERT OR REPLACE INTO restaurant_state/);
  assert.match(carta,/Restaurante Nube/);
  assert.match(carta,/DELETE FROM restaurant_sessions/);
  const esquema=await readFile(join(paquete.destino,'01-esquema.sql'),'utf8');
  assert.match(esquema,/CREATE TABLE IF NOT EXISTS restaurant_state/);
  const wrangler=await readFile(join(carpeta,'wrangler.jsonc'),'utf8');
  assert.match(wrangler,/REEMPLAZAR_POR_ID_NUEVO/);
  assert.match(wrangler,/pages_build_output_dir/);
  const guia=await readFile(join(paquete.destino,'DESPLIEGUE.md'),'utf8');
  assert.match(guia,/subir-fotos/);
  assert.match(guia,/secretos\.mjs/);
 }finally{await rm(temp,{recursive:true,force:true});}
});

test('Exportación: el SQL reconstruye la misma carta en una base limpia y las fotos cargan',async()=>{
 const temp=await TEMPORAL();
 let app;
 try{
  const carpeta=join(temp,'Restaurante Ida');
  await nuevoRestaurante({nombre:'Restaurante Ida',carpeta,logo:activo('carta-512.png')});
  const paquete=await exportar({carpeta});

  // Simula la base D1 remota: SQL aplicado sobre una carpeta vacía
  const remota=join(temp,'d1-remota');
  await mkdir(remota,{recursive:true});
  const db=new DatabaseSync(join(remota,'restaurante.sqlite'));
  db.exec(await readFile(join(paquete.destino,'01-esquema.sql'),'utf8'));
  db.exec(await readFile(paquete.carta,'utf8'));
  db.close();
  const salt='qa-salt-1234567890';
  await writeFile(join(remota,'acceso-local.json'),JSON.stringify({ADMIN_SALT:salt,ADMIN_HASH:await passwordHash('clave-remota-qa',salt),password:'clave-remota-qa'}));

  app=await start({port:0,dataDir:remota});
  const menu=await (await fetch(app.url+'/api/menu')).json();
  assert.equal(menu.data.restaurant.name,'Restaurante Ida');
  assert.equal(menu.data.dishes.length,16);
  assert.ok(menu.data.restaurant.logo,'La carta exportada mantiene el logo');

  // Las fotos no están en el SQL: hasta subirlas, la referencia falla
  const antes=await fetch(app.url+menu.data.restaurant.logo,{method:'HEAD'});
  assert.equal(antes.status,404,'La foto no debe existir todavia');

  const subida=await subirFotos({url:app.url,password:'clave-remota-qa',carpeta});
  assert.equal(subida.subidas,1);
  assert.deepEqual(subida.rotas,[],'Todas las imágenes deben cargar tras subirlas');
  const despues=await fetch(app.url+menu.data.restaurant.logo,{method:'HEAD'});
  assert.equal(despues.status,200);
 }finally{if(app)await app.close();await rm(temp,{recursive:true,force:true});}
});
