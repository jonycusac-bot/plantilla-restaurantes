import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
test('API real aislada: acceso privado, Guardar, publicación inmediata, persistencia y conflictos',async()=>{
 const modulePath=new URL('../scripts/local.mjs',import.meta.url);assert.ok(existsSync(modulePath),'Falta el servidor local independiente');
 const {start}=await import(modulePath);const folder=await mkdtemp(join(process.env.TMPDIR||tmpdir(),'plantilla-test-'));
 let app;try{
 app=await start({port:0,dataDir:folder,password:'test-only-password'});const origin=app.url;
 const call=(path,body,cookie='')=>fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await call('/')).status,200,'La carta debe servirse');assert.equal((await call('/admin')).status,200,'El acceso admin debe servirse');
 let res=await call('/api/menu');const initial=await res.json();assert.equal(initial.data.dishes.length,16);
 assert.equal((await call('/api/admin/menu')).status,401);
 assert.equal((await call('/api/login',{password:'incorrecta'})).status,401);
 res=await call('/api/login',{password:'test-only-password'});assert.equal(res.status,200);const cookie=res.headers.get('set-cookie').split(';')[0];assert.match(res.headers.get('set-cookie'),/HttpOnly/);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1cAAAAASUVORK5CYII=','base64');
 const upload=()=>fetch(origin+'/api/admin/images',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'image/png'},body:png});
 const imgResponse=await upload();assert.equal(imgResponse.status,200);const img=await imgResponse.json();assert.match(img.src,/^\/media\/[a-f0-9]{64}\.png$/);
 assert.equal((await upload()).status,200);assert.equal((await (await call('/api/admin/storage',null,cookie)).json()).count,1);
 assert.equal((await fetch(origin+img.src)).headers.get('Content-Type'),'image/png');
 assert.equal((await fetch(origin+'/api/admin/images',{method:'POST',headers:{Origin:origin,Cookie:cookie},body:'<svg onload="alert(1)"/>'})).status,422);
 const snapshot=await (await call('/api/admin/menu',null,cookie)).json();
 const {diff}=await import('../public/domain.js');const edited=structuredClone(snapshot.data);edited.restaurant.name='QA Restaurante';edited.categories[0].name='Compartir';edited.dishes[0].price=23;edited.dishes[0].allergens=['gluten'];edited.dishes[0].translations.en.name='QA dish';
 const save=(changes,originHeader=origin)=>fetch(origin+'/api/admin/menu',{method:'PATCH',headers:{Origin:originHeader,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({changes})});
 assert.equal((await save(diff(snapshot.data,edited),'https://evil.example')).status,403);
 assert.equal((await save(diff(snapshot.data,edited))).status,200);
 const pub=await (await call('/api/menu')).json();assert.equal(pub.data.restaurant.name,'QA Restaurante');assert.equal(pub.data.dishes[0].price,23);assert.deepEqual(pub.data.dishes[0].allergens,['gluten']);assert.equal(pub.data.categories[0].name,'Compartir');
 edited.dishes[0].price=25;assert.equal((await save(diff(snapshot.data,edited))).status,409);
 await app.close();app=await start({port:0,dataDir:folder,password:'test-only-password'});assert.equal((await (await fetch(app.url+'/api/menu')).json()).data.dishes[0].price,23);
 }finally{if(app)await app.close();await rm(folder,{recursive:true,force:true});}
});
