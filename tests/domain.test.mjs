import test from 'node:test';
test('Guardar aplica diferencias, conserva cambios independientes y bloquea conflictos',async()=>{
 const m=await import('../public/domain.js');assert.equal(typeof m.mergeChanges,'function');
 const base=m.seed(), edited=structuredClone(base), concurrent=structuredClone(base);
 edited.dishes[0].price=19;edited.restaurant.name='Restaurante de prueba';edited.categories[0].name='Para compartir';
 concurrent.dishes[1].price=22;
 const changes=m.diff(base,edited); const result=m.mergeChanges(concurrent,changes);
 assert.equal(result.dishes[0].price,19);assert.equal(result.dishes[1].price,22);assert.equal(result.restaurant.name,edited.restaurant.name);assert.equal(result.categories[0].name,'Para compartir');
 concurrent.dishes[0].price=18;assert.throws(()=>m.mergeChanges(concurrent,changes),/conflicto/i);
 const bad=structuredClone(base);bad.dishes[0].imageSrc='javascript:alert(1)';assert.throws(()=>m.validate(bad));
 bad.dishes[0].imageSrc='';bad.dishes[0].allergens=['inventado'];assert.throws(()=>m.validate(bad));
 const tx=structuredClone(base);tx.dishes[0].translations.en.name='Manual name';assert.equal(m.localize(tx.dishes[0],'en').name,'Manual name');tx.dishes[0].translations.en.name='';assert.equal(m.localize(tx.dishes[0],'en').name,tx.dishes[0].name);
});
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const path=new URL('../public/domain.js',import.meta.url);
test('plantilla independiente: cuatro secciones, cuatro platos por sección y ninguna foto o marca de INCH',async()=>{
 assert.ok(existsSync(path),'Falta el catálogo genérico');
 const {seed}=await import(path); const data=seed();
 assert.equal(data.categories.length,4);assert.equal(data.dishes.length,16);
 for(const c of data.categories)assert.equal(data.dishes.filter(d=>d.categoryId===c.id).length,4);
 assert.equal(new Set(data.dishes.map(d=>d.id)).size,16);
 assert.ok(data.dishes.every(d=>!d.imageSrc&&d.allergens.length===0));
 assert.doesNotMatch(JSON.stringify(data),/inch|api.key|cloudflare/i);
});
