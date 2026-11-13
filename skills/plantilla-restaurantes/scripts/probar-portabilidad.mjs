import {mkdtemp,readFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute,sep} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const skill=fileURLToPath(new URL('../',import.meta.url));
const temp=await mkdtemp(join(tmpdir(),'skill-restaurantes-'));
const run=(args,cwd)=>{const result=spawnSync(process.execPath,args,{cwd,encoding:'utf8'});if(result.error)throw result.error;return result;};
let app;
try{
 const create=(name,path)=>run([join(skill,'scripts/crear-proyecto.mjs'),'--nombre',name,'--carpeta',path],temp);
 const first=join(temp,'Casa Olivo'),second=join(temp,'Casa Laurel');
 const a=create('Casa Olivo',first),b=create('Casa Laurel',second);assert.equal(a.status,0,a.stderr);assert.equal(b.status,0,b.stderr);
 const accessA=JSON.parse(await readFile(join(first,'.local/acceso-local.json'),'utf8')),accessB=JSON.parse(await readFile(join(second,'.local/acceso-local.json'),'utf8'));assert.notEqual(accessA.password,accessB.password);assert.notEqual(accessA.password,'123456');assert.ok(accessA.password.length>=12);assert.ok(!a.stdout.includes(accessA.password));
 const before=await readFile(join(first,'.local/restaurante.sqlite'));
 assert.notEqual(create('No sobrescribir',first).status,0);assert.deepEqual(await readFile(join(first,'.local/restaurante.sqlite')),before);
 assert.notEqual(create('Dentro del skill',join(skill,'proyecto-prohibido')).status,0);
 const contents=await readdir(first);for(const item of ['PROTOCOLO.md','BITACORA.md','README.md','restaurante.config.json'])assert.ok(contents.includes(item));for(const item of ['.git','RESPALDOS','deploy','dist','node_modules','plantilla.config.json','wrangler.jsonc'])assert.ok(!contents.includes(item));
 const {start}=await import(pathToFileURL(join(first,'scripts/local.mjs')).href);app=await start({port:0});
 const menu=await (await fetch(app.url+'/api/menu')).json();assert.equal(menu.data.restaurant.name,'Casa Olivo');assert.equal(menu.data.dishes.length,16);assert.equal(menu.data.categories.length,5);const drinks=menu.data.categories.find(c=>c.kind==='drinks');assert.equal(drinks.subcategories.length,3);assert.equal(menu.data.dishes.filter(d=>d.categoryId===drinks.id).length,0);assert.deepEqual((await (await fetch(app.url+'/api/events')).json()).events,[]);
 await app.close();app=null;
 const tests=(await readdir(join(first,'tests'))).filter(p=>p.endsWith('.test.mjs')).map(p=>join('tests',p));const result=run(['--test',...tests],first);assert.equal(result.status,0,result.stdout+result.stderr);
 const {build}=await import(pathToFileURL(join(first,'scripts/build.mjs')).href);await build();
 console.log(JSON.stringify({instalacionesIndependientes:2,accesosPropios:true,sobrescrituraBloqueada:true,datosDeOrigen:false,protocoloIncluido:true,platos:16,bebidas:0,subsecciones:3,testsNode:18,build:'correcto'}));
}finally{
 await app?.close();
 const root=resolve(tmpdir()),target=resolve(temp),rel=relative(root,target);assert.ok(rel&&!rel.startsWith('..'+sep)&&!isAbsolute(rel)&&rel.startsWith('skill-restaurantes-'));
 await rm(target,{recursive:true,force:true});
}
