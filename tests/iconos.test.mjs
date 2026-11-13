import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';
import {start} from '../scripts/local.mjs';

const activo=ruta=>fileURLToPath(new URL(`../public/assets/${ruta}`,import.meta.url));
const TEMPORAL=()=>mkdtemp(join(process.env.TMPDIR||tmpdir(),'iconos-'));

test('Iconos: el manifest y el icono salen del logo del restaurante',async()=>{
 const dir=await TEMPORAL();
 let app;
 try{
  app=await start({port:0,dataDir:dir,password:'qa-iconos'});
  const login=await fetch(app.url+'/api/login',{method:'POST',headers:{Origin:app.url,'Content-Type':'application/json'},body:JSON.stringify({password:'qa-iconos'})});
  const cookie=(login.headers.get('set-cookie')||'').split(';')[0];

  // Sin logo: manifest genérico y icono de la plantilla
  let manifiesto=await (await fetch(app.url+'/carta.webmanifest')).json();
  const restaurantName=(await (await fetch(app.url+'/api/menu')).json()).data.restaurant.name;assert.equal(manifiesto.name,restaurantName+' · Carta');
  assert.match(manifiesto.icons[0].src,/\/assets\/carta-192\.png/);
  let icono=await fetch(app.url+'/icon-180.png');
  assert.equal(icono.status,200);
  assert.equal(icono.headers.get('content-type'),'image/png');

  // Con logo: el manifest lo anuncia y el icono sirve exactamente ese PNG
  const bytes=await (await import('node:fs/promises')).readFile(activo('carta-512.png'));
  const subida=await fetch(app.url+'/api/admin/images',{method:'POST',headers:{Origin:app.url,Cookie:cookie,'Content-Type':'image/png'},body:bytes});
  const {src}=await subida.json();
  const estado=await (await fetch(app.url+'/api/admin/menu',{headers:{Cookie:cookie}})).json();
  const {diff}=await import('../public/domain.js');
  const siguiente=structuredClone(estado.data);
  siguiente.restaurant.logo=src;
  const parche=await fetch(app.url+'/api/admin/menu',{method:'PATCH',headers:{Origin:app.url,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({changes:diff(estado.data,siguiente)})});
  assert.equal(parche.status,200);

  manifiesto=await (await fetch(app.url+'/carta.webmanifest')).json();
  assert.equal(manifiesto.icons[0].src,'/icon-192.png');
  const servido=await fetch(app.url+'/icon-180.png');
  assert.equal(servido.status,200);
  const devuelto=Buffer.from(await servido.arrayBuffer());
  assert.equal(devuelto.length,bytes.length,'El icono debe ser el logo subido, no el genérico');
 }finally{if(app)await app.close();await rm(dir,{recursive:true,force:true});}
});
