import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {mkdtemp,rm,readFile,readdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {pathToFileURL,fileURLToPath} from 'node:url';
import {nuevoRestaurante,slug,nombreDeCarpeta,carpetaSugerida} from '../scripts/nuevo-restaurante.mjs';
const TEMPORAL=()=>mkdtemp(join(process.env.TMPDIR||tmpdir(),'restaurante-nuevo-'));
test('Generador: copia solo lo reutilizable y crea identidad, puerto y acceso propios',async()=>{
 const temp=await TEMPORAL();
 try{
  const carpeta=join(temp,'La Brasa de Marta');
  const resultado=await nuevoRestaurante({nombre:'La Brasa de Marta',carpeta});
  for(const archivo of ['public/index.html','public/app.js','public/style.css','src/worker.js','scripts/local.mjs','scripts/nuevo-restaurante.mjs','cloudflare/schema.sql','tests/api.test.mjs','INICIAR.cmd','NUEVO-RESTAURANTE.cmd','.gitignore','restaurante.config.json'])assert.ok(existsSync(join(carpeta,archivo)),`La copia debe incluir ${archivo}`);
  const copiado=await readdir(carpeta);
  for(const prohibido of ['node_modules','dist','.git','.wrangler','test-results','.test-output','playwright-report'])assert.ok(!copiado.includes(prohibido),`No debe copiarse ${prohibido}`);
  const config=JSON.parse(await readFile(join(carpeta,'restaurante.config.json'),'utf8'));
  assert.equal(config.nombre,'La Brasa de Marta');
  assert.ok(Number.isInteger(config.puerto)&&config.puerto>=4182,'Debe asignarse un puerto libre');
  assert.equal(config.host,'127.0.0.1');
  const acceso=JSON.parse(await readFile(join(carpeta,'.local','acceso-local.json'),'utf8'));
  assert.equal(acceso.password,resultado.password);
  assert.ok(acceso.password.length>=12);
  const maestro=await readFile(new URL('../.local/acceso-local.json',import.meta.url),'utf8').then(JSON.parse).catch(()=>null);
  if(maestro)assert.notEqual(acceso.password,maestro.password,'Cada restaurante necesita su propia contraseña');
  await assert.rejects(()=>nuevoRestaurante({nombre:'La Brasa de Marta',carpeta}),/ya existe/,'Nunca debe sobrescribir una instalación existente');
 }finally{await rm(temp,{recursive:true,force:true});}
});
test('Generador: la copia arranca sola con su nombre y su carta de 16 ejemplos',async()=>{
 const temp=await TEMPORAL();
 try{
  const carpeta=resolve(temp,'Casa Pepe');
  await nuevoRestaurante({nombre:'Casa Pepe',carpeta,eslogan:'COCINA DE MERCADO',inicializar:false});
  const copia=await import(pathToFileURL(join(carpeta,'scripts','local.mjs')).href);
  const app=await copia.start({port:0,host:'127.0.0.1'});
  try{
   const menu=await (await fetch(app.url+'/api/menu')).json();
   assert.equal(menu.data.restaurant.name,'Casa Pepe');
   assert.equal(menu.data.restaurant.tagline,'COCINA DE MERCADO');
   assert.equal(menu.data.dishes.length,16);
   assert.equal(menu.data.categories.length,5);
   assert.equal(app.created,true,'El primer arranque genera el acceso de ese restaurante');
   assert.ok(app.password&&app.password.length>=12);
   const archivo=JSON.parse(await readFile(join(carpeta,'.local','acceso-local.json'),'utf8'));
   assert.equal(archivo.password,app.password);
   assert.equal((await fetch(app.url+'/admin')).status,200);
  }finally{await app.close();}
 }finally{await rm(temp,{recursive:true,force:true});}
});
test('Generador: logo y cabecera del cuestionario quedan colocados y se sirven',async()=>{
 const temp=await TEMPORAL();
 try{
  const carpeta=resolve(temp,'Taro');
  const logo=fileURLToPath(new URL('../public/assets/carta-192.png',import.meta.url));
  const cabecera=fileURLToPath(new URL('../public/assets/admin-192.png',import.meta.url));
  const resultado=await nuevoRestaurante({nombre:'Taro',carpeta,logo,cabecera});
  assert.match(resultado.logoSrc,/^\/media\/[a-f0-9]{64}\.png$/);
  assert.match(resultado.cabeceraSrc,/^\/media\/[a-f0-9]{64}\.png$/);
  const copia=await import(pathToFileURL(join(carpeta,'scripts','local.mjs')).href);
  const app=await copia.start({port:0});
  try{
   const menu=await (await fetch(app.url+'/api/menu')).json();
   assert.equal(menu.data.restaurant.logo,resultado.logoSrc);
   assert.equal(menu.data.restaurant.headerArtwork,resultado.cabeceraSrc);
   const imagen=await fetch(app.url+resultado.cabeceraSrc);
   assert.equal(imagen.status,200);
   assert.equal(imagen.headers.get('content-type'),'image/png');
  }finally{await app.close();}
  await assert.rejects(()=>nuevoRestaurante({nombre:'Malo',carpeta:resolve(temp,'malo'),logo:fileURLToPath(new URL('../README.md',import.meta.url))}),/no es un JPG, PNG o WebP/);
  await assert.rejects(()=>nuevoRestaurante({nombre:'Malo',carpeta:resolve(temp,'malo'),inicializar:false,logo}),/quita --sin-inicializar/);
  assert.equal(existsSync(resolve(temp,'malo')),false,'No debe crearse la carpeta si una imagen no vale');
 }finally{await rm(temp,{recursive:true,force:true});}
});
test('Generador: la carpeta del restaurante es legible y sigue la configuración de la plantilla',()=>{
 assert.equal(nombreDeCarpeta('Taro','Restaurante '),'Restaurante Taro');
 assert.equal(nombreDeCarpeta('Taro',''),'Taro');
 assert.equal(nombreDeCarpeta('Bar / Pepe: "2"','Restaurante '),'Restaurante Bar Pepe 2');
 assert.equal(nombreDeCarpeta('***',''),'restaurante');
 assert.equal(carpetaSugerida('C:\\Clientes','La Brasa','Restaurante '),'C:\\Clientes\\Restaurante La Brasa');
});
test('Generador: nombres con acentos producen carpetas seguras y se rechazan destinos peligrosos',async()=>{
 assert.equal(slug('Café Ñandú 24h'),'cafe-nandu-24h');
 assert.equal(slug('***'),'restaurante');
 const temp=await TEMPORAL();
 try{
  const resultado=await nuevoRestaurante({nombre:'Café Ñandú',carpeta:join(temp,'instalacion'),inicializar:false});
  assert.equal(resultado.nombre,'Café Ñandú');
  await assert.rejects(()=>nuevoRestaurante({nombre:'X',carpeta:resolve(temp,'.local')}),/reservadas/);
  await assert.rejects(()=>nuevoRestaurante({nombre:'',carpeta:join(temp,'vacio')}),/nombre de restaurante/);
  await assert.rejects(()=>nuevoRestaurante({nombre:'"" Bar Pepe\\ --eslogan \\TAPAS\\"',carpeta:join(temp,'comillas')}),/Nombre no válido/,'Un entrecomillado roto no debe crear carpetas basura');
  await assert.rejects(()=>nuevoRestaurante({nombre:'Bar --x',carpeta:join(temp,'guiones')}),/Nombre no válido/);
  assert.equal(existsSync(join(temp,'comillas')),false);
 }finally{await rm(temp,{recursive:true,force:true});}
});
