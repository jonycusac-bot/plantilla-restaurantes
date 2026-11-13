import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {seed,initializeBeverages,validate,diff,mergeChanges} from '../public/domain.js';
import {start} from '../scripts/local.mjs';

test('Migración única: conserva carta, clasificación explícita y grupos eliminados',()=>{
 const old=seed();delete old.beveragesVersion;old.categories.pop();
 const original=structuredClone(old),next=initializeBeverages(old);
 assert.deepEqual(next.dishes,original.dishes);assert.deepEqual(next.restaurant,original.restaurant);
 assert.deepEqual(next.categories.slice(0,4),original.categories);
 assert.equal(next.categories.at(-1).subcategories.length,3);
 next.categories.at(-1).name='La bodega';next.categories.at(-1).subcategories=[];
 assert.deepEqual(initializeBeverages(JSON.parse(JSON.stringify(next))),next);
 const existing=structuredClone(old);existing.categories[0].name='Bebidas';
 const adapted=initializeBeverages(existing);assert.equal(adapted.categories.length,4);assert.equal(adapted.categories[0].kind,'drinks');
 assert.ok(adapted.dishes.every(d=>!d.subcategoryId));
 existing.categories[0].kind='food';assert.equal(initializeBeverages(existing).categories[0].kind,'food');
 const full=structuredClone(old);while(full.categories.length<30)full.categories.push({id:'extra-'+full.categories.length,name:'Propia',en:'',de:''});
 const migratedFull=initializeBeverages(full);assert.equal(migratedFull.categories.length,31);assert.deepEqual(migratedFull.categories.slice(0,30),full.categories);
});

test('JSON antiguo: campos opcionales, conflictos, referencias y límites',()=>{
 const base=seed(),edited=structuredClone(base);edited.categories[0].kind='drinks';edited.categories[0].subcategories=[{id:'manual',name:'Manual',en:'',de:''}];edited.dishes[0].subcategoryId='manual';
 const changes=JSON.parse(JSON.stringify(diff(base,edited)));
 const result=mergeChanges(base,changes);assert.equal(result.dishes[0].subcategoryId,'manual');
 const concurrent=structuredClone(base);concurrent.categories[0].kind='food';assert.deepEqual(mergeChanges(concurrent,changes),result);
 concurrent.categories[0].subcategories=[{id:'other',name:'Otro'}];assert.throws(()=>mergeChanges(concurrent,changes),/Conflicto/);
 const cleared=structuredClone(result);delete cleared.dishes[0].subcategoryId;
 assert.equal(mergeChanges(result,JSON.parse(JSON.stringify(diff(result,cleared)))).dishes[0].subcategoryId,'');
 for(const mutate of [d=>d.categories[0].subcategories=[],d=>d.dishes[0].categoryId='postres',d=>d.categories[0].subcategories.push({...d.categories[0].subcategories[0]}),d=>d.categories[0].subcategories=Array.from({length:21},(_,i)=>({id:'g'+i,name:'Grupo'})),d=>d.categories.splice(0,1),d=>d.categories=[]]){const invalid=structuredClone(result);mutate(invalid);assert.throws(()=>validate(invalid));}
 const duplicate=structuredClone(result);duplicate.categories[1].subcategories=[{id:'manual',name:'Duplicada'}];assert.throws(()=>validate(duplicate));
});

test('API bebidas: validación real, ocultos, persistencia y migración sin recreación',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'bebidas-'));let app;
 try{
 app=await start({port:0,dataDir:folder,password:'bebidas-test'});
 const login=await fetch(app.url+'/api/login',{method:'POST',headers:{Origin:app.url,'Content-Type':'application/json'},body:JSON.stringify({password:'bebidas-test'})});const cookie=login.headers.get('set-cookie').split(';')[0];
 const get=async()=> (await fetch(app.url+'/api/admin/menu',{headers:{Cookie:cookie}})).json();
 const patch=(base,next)=>fetch(app.url+'/api/admin/menu',{method:'PATCH',headers:{Cookie:cookie,Origin:app.url,'Content-Type':'application/json'},body:JSON.stringify({changes:diff(base,next)})});
 let base=(await get()).data,next=structuredClone(base),c=next.categories.at(-1);
 c.name='Bodega propia';next.dishes.push({...structuredClone(base.dishes[0]),id:'bebida-test',name:'Bebida QA',categoryId:c.id,subcategoryId:c.subcategories[0].id,hidden:true});
 assert.equal((await patch(base,next)).status,200);base=(await get()).data;
 let invalid=structuredClone(base);invalid.categories.at(-1).subcategories.shift();assert.equal((await patch(base,invalid)).status,400);
 invalid=structuredClone(base);invalid.dishes.at(-1).categoryId='postres';assert.equal((await patch(base,invalid)).status,400);
 const pub=await (await fetch(app.url+'/api/menu')).json();assert.ok(!pub.data.dishes.some(d=>d.id==='bebida-test'));
 next=structuredClone(base);next.dishes.at(-1).subcategoryId='';next.categories.at(-1).subcategories=[];assert.equal((await patch(base,next)).status,200);
 await app.close();app=null;
 app=await start({port:0,dataDir:folder});const restarted=await (await fetch(app.url+'/api/menu')).json();assert.equal(restarted.data.categories.at(-1).name,'Bodega propia');assert.deepEqual(restarted.data.categories.at(-1).subcategories,[]);assert.equal(restarted.data.categories.length,5);
 await app.close();app=null;
 // Exercise an actual old persisted installation, preserving independent features.
 const db=new DatabaseSync(join(folder,'restaurante.sqlite'));const old=seed();delete old.beveragesVersion;old.categories.pop();db.prepare('UPDATE restaurant_state SET payload=? WHERE id=1').run(JSON.stringify(old));db.close();
 app=await start({port:0,dataDir:folder});const migrated=await (await fetch(app.url+'/api/menu')).json();assert.equal(migrated.data.categories.length,5);assert.deepEqual(migrated.data.dishes,old.dishes);
 }finally{await app?.close();await rm(folder,{recursive:true,force:true});}
});
