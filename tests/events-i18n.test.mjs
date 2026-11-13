import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {parseEvents,localizeEvent,eventLink,eventShareText,eventDate,demoEvents,prepareDemoEventTranslations} from '../public/events.js';
import {start} from '../scripts/local.mjs';
import {nuevoRestaurante} from '../scripts/nuevo-restaurante.mjs';
import {exportar} from '../scripts/exportar.mjs';
const event=(extra={})=>({id:'qa-event',title:'Título español',description:'Descripción española',date:'2026-11-20',expiresOn:'',imageSrc:'',buttonLabel:'Reserva antigua',buttonUrl:'https://example.com/reserva',active:true,...extra});

test('Eventos traducidos: compatibilidad antigua, validación y alternativa por campo',()=>{
 const old=event();assert.deepEqual(parseEvents([old]),[old]);assert.equal(localizeEvent(old,'de').title,old.title);
 const e=event({translations:{en:{title:'English title',description:''},de:{title:'',description:'Deutsche Beschreibung'}}});
 assert.equal(localizeEvent(e,'en').description,e.description);assert.equal(localizeEvent(e,'de').title,e.title);assert.equal(localizeEvent(e,'de').description,'Deutsche Beschreibung');assert.equal(localizeEvent(e,'fr').title,e.title);
 assert.equal(eventLink('https://example.com',e.id,'de'),'https://example.com/eventos/qa-event?lang=de');assert.ok(eventLink('https://example.com',e.id,'fr').endsWith('?lang=es'));
 assert.match(eventShareText(e,'en'),/English title/);assert.ok(eventShareText(e,'de').includes(eventDate(e.date,'de')));assert.ok(!eventShareText(e,'en').includes(e.buttonUrl));
 for(const translations of [null,[],{fr:{}},{en:[]},{en:{title:123}},{de:{description:'x'.repeat(2001)}},{en:{title:'x'.repeat(121)}},{en:{other:'x'}}])assert.equal(parseEvents([event({translations})]),null);
});

test('Traducciones demo: solo campos ausentes originales, sin duplicar ni sobrescribir',()=>{
 const original=demoEvents.map(({translations,...e})=>event({...e,active:false,date:'2026-12-04',imageSrc:'/media/'+'a'.repeat(64)+'.png'}));
 const result=prepareDemoEventTranslations(original);assert.equal(result.length,2);
 for(let i=0;i<2;i++){assert.deepEqual(result[i].translations,demoEvents[i].translations);const {translations,...rest}=result[i];assert.deepEqual(rest,original[i]);}
 assert.equal(prepareDemoEventTranslations(result),result);
 const edited=structuredClone(original);edited[0].title='Texto del propietario';edited[0].translations={en:{title:'Owner title',description:''}};edited[1].description='Descripción propia';
 const migrated=prepareDemoEventTranslations(edited);assert.equal(migrated[0].translations.en.title,'Owner title');assert.equal(migrated[0].translations.en.description,'');assert.equal(migrated[0].translations.de.title,undefined);assert.equal(migrated[1].translations.en.description,undefined);
 assert.equal(prepareDemoEventTranslations([]).length,0);
});

test('API: traducciones, metadatos por idioma, enlaces antiguos conservados, ocultos y reinicio',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'event-i18n-'));let app;
 try{
 app=await start({port:0,dataDir:folder,password:'qa-events-i18n'});
 const login=await fetch(app.url+'/api/login',{method:'POST',headers:{Origin:app.url,'Content-Type':'application/json'},body:JSON.stringify({password:'qa-events-i18n'})});const cookie=login.headers.get('set-cookie').split(';')[0];
 const get=async()=> (await fetch(app.url+'/api/admin/events',{headers:{Cookie:cookie}})).json();
 const put=async events=>{const {revision}=await get();return fetch(app.url+'/api/admin/events',{method:'PUT',headers:{Origin:app.url,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({events,revision})});};
 const bytes=await readFile(new URL('../public/assets/carta-192.png',import.meta.url)),upload=await fetch(app.url+'/api/admin/images',{method:'POST',headers:{Origin:app.url,Cookie:cookie},body:bytes}),{src}=await upload.json();
 const menuBefore=await (await fetch(app.url+'/api/menu')).json();
 let e=event({imageSrc:src,translations:{en:{title:'English <title>',description:'English & description'},de:{title:'Deutscher Titel',description:''}}});assert.equal((await put([e])).status,200);
 for(const [lang,title,description] of [['es',e.title,e.description],['en','English &lt;title&gt;','English &amp; description'],['de','Deutscher Titel',e.description]]){const response=await fetch(app.url+'/eventos/qa-event?lang='+lang),html=await response.text();assert.equal(response.status,200);assert.ok(html.includes('<html lang="'+lang+'"'));assert.ok(html.includes('<title>'+title+'</title>'));assert.ok(html.includes('property="og:title" content="'+title+'"'));assert.ok(html.includes('property="og:description" content="'+description+'"'));assert.ok(html.includes('name="description" content="'+description+'"'));assert.ok(html.includes('/eventos/qa-event?lang='+lang));}
 assert.equal((await fetch(app.url+'/eventos/qa-event?lang=en',{method:'HEAD'})).status,200);
 const {buttonLabel,buttonUrl,translations,...oldClient}=e;assert.equal((await put([{...oldClient,description:'Cambio sin botones'}])).status,200);
 e=(await get()).events[0];assert.equal(e.buttonLabel,buttonLabel);assert.equal(e.buttonUrl,buttonUrl);assert.deepEqual(e.translations,translations);assert.equal(e.imageSrc,src);assert.equal(e.date,'2026-11-20');assert.equal(e.active,true);assert.deepEqual(await (await fetch(app.url+'/api/menu')).json(),menuBefore);
 await app.close();app=null;app=await start({port:0,dataDir:folder});const persisted=(await (await fetch(app.url+'/api/events')).json()).events[0];assert.deepEqual(persisted,e);assert.deepEqual(Buffer.from(await (await fetch(app.url+src)).arrayBuffer()),bytes);
 await app.close();app=null;const db=new DatabaseSync(join(folder,'restaurante.sqlite'));db.prepare('UPDATE restaurant_events SET payload=?,revision=revision+1 WHERE id=1').run(JSON.stringify([{...e,active:false}]));db.close();
 app=await start({port:0,dataDir:folder});for(const lang of ['es','en','de'])assert.equal((await fetch(app.url+'/eventos/qa-event?lang='+lang)).status,404);assert.deepEqual((await (await fetch(app.url+'/api/events')).json()).events,[]);
 }finally{await app?.close();await rm(folder,{recursive:true,force:true});}
});

test('Generador y exportación: eventos traducidos sin datos de clientes ni reinicialización',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'event-generator-'));let app;
 try{
 const target=join(folder,'Casa del Evento');await nuevoRestaurante({nombre:'Casa del Evento',carpeta:target});
 const db=new DatabaseSync(join(target,'.local/restaurante.sqlite'));const events=JSON.parse(db.prepare('SELECT payload FROM restaurant_events WHERE id=1').get().payload);assert.equal(events.length,2);for(const e of events){assert.equal(e.active,false);assert.ok(e.translations.en.title&&e.translations.de.description);}
 events[0].translations.en.title='Edited by owner';events[1].translations.de.description='';db.prepare('UPDATE restaurant_events SET payload=? WHERE id=1').run(JSON.stringify(events));db.close();
 await exportar({carpeta:target});const rebuilt=new DatabaseSync(':memory:');rebuilt.exec(await readFile(join(target,'deploy/01-esquema.sql'),'utf8'));rebuilt.exec(await readFile(join(target,'deploy/02-carta.sql'),'utf8'));assert.deepEqual(JSON.parse(rebuilt.prepare('SELECT payload FROM restaurant_events WHERE id=1').get().payload),events);rebuilt.close();
 app=await start({port:0,dataDir:join(target,'.local')});await app.close();app=null;const persisted=new DatabaseSync(join(target,'.local/restaurante.sqlite'),{readOnly:true});assert.deepEqual(JSON.parse(persisted.prepare('SELECT payload FROM restaurant_events WHERE id=1').get().payload),events);persisted.close();
 }finally{await app?.close();await rm(folder,{recursive:true,force:true});}
});
