import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm,readFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {DatabaseSync} from 'node:sqlite';
import {start} from '../scripts/local.mjs';import {parseEvents,activeEvents,madridDay,parseSocials} from '../public/events.js';import {exportar} from '../scripts/exportar.mjs';
const event=(changes={})=>({id:'test-event',title:'Evento',description:'Descripción',date:'',expiresOn:'',imageSrc:'',buttonLabel:'',buttonUrl:'',active:true,...changes});
test('Eventos: fechas reales, caducidad inclusiva Madrid, orden, visibilidad y enlaces seguros',()=>{
 assert.equal(parseEvents([event({date:'2026-02-30'})]),null);assert.equal(parseEvents([event({buttonLabel:'Ir',buttonUrl:'javascript:alert(1)'})]),null);
 assert.equal(parseEvents([event({imageSrc:'https://example.com/a.jpg'})]),null);assert.equal(parseEvents([event(),event()]),null);
 assert.equal(madridDay(Date.parse('2026-11-11T23:30:00Z')),'2026-11-12');
 const list=[event({id:'none'}),event({id:'future',date:'2026-11-20'}),event({id:'past',date:'2026-11-10',expiresOn:'2026-11-11'}),event({id:'hidden',active:false})];
 assert.deepEqual(activeEvents(list,Date.parse('2026-11-11T22:59:59Z')).map(e=>e.id),['past','future','none']);
 assert.deepEqual(activeEvents(list,Date.parse('2026-11-11T23:00:00Z')).map(e=>e.id),['future','none']);assert.equal(list[0].id,'none');
 assert.equal(parseSocials({instagram:'https://instagram.com.evil.test/a',facebook:''}),null);assert.equal(parseSocials({instagram:'https://u:p@instagram.com/a',facebook:''}),null);
 assert.ok(parseSocials({instagram:'https://www.instagram.com/demo/',facebook:''}));
});
test('API aislada: eventos/redes, CAS concurrente, origen/sesión, metadatos, exportación y carta intacta',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'plantilla-events-'));let app;
 try{app=await start({port:0,dataDir:join(folder,'.local'),password:'qa-events-only'});const origin=app.url;
 const login=await fetch(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({password:'qa-events-only'})});const cookie=login.headers.get('set-cookie').split(';')[0];
 const get=async path=>(await fetch(origin+path,{headers:{Cookie:cookie}})).json();
 const put=(kind,data,from=origin,auth=cookie)=>fetch(origin+'/api/admin/'+kind,{method:'PUT',headers:{Origin:from,Cookie:auth,'Content-Type':'application/json'},body:JSON.stringify(data)});
 const initial=await get('/api/admin/menu');assert.equal((await put('events',{events:[],revision:1},origin,'')).status,401);assert.equal((await put('events',{events:[],revision:1},'https://evil.test')).status,403);
 const e=event({title:'<script>alert("x")</script>',description:'Una & otra'}),body={events:[e],revision:1};
 const saves=await Promise.all([put('events',body),put('events',body)]);assert.deepEqual(saves.map(r=>r.status).sort(),[200,409]);
 assert.equal((await put('events',{events:[event({imageSrc:'/media/'+ 'a'.repeat(64)+'.png'})],revision:2})).status,422);
 const html=await (await fetch(origin+'/eventos/test-event')).text();assert.match(html,/og:title/);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script>alert('));assert.equal((await fetch(origin+'/eventos/missing')).status,404);
 assert.equal((await put('socials',{socials:{instagram:'https://instagram.com/demo/',facebook:''},revision:1})).status,200);assert.equal((await put('socials',{socials:{instagram:'',facebook:''},revision:1})).status,409);
 assert.equal((await get('/api/socials')).socials.instagram,'https://instagram.com/demo/');
 assert.deepEqual(await get('/api/admin/menu'),initial);
 // Export current events alongside menu; legacy DBs remain supported by the exporter.
 const {mkdir,cp}=await import('node:fs/promises');await mkdir(join(folder,'cloudflare'));await cp(new URL('../cloudflare/schema.sql',import.meta.url),join(folder,'cloudflare/schema.sql'));
 await exportar({carpeta:folder});const sql=await readFile(join(folder,'deploy/02-carta.sql'),'utf8');assert.match(sql,/INSERT OR REPLACE INTO restaurant_events/);assert.match(sql,/restaurant_socials/);
 assert.equal((await put('events',{events:[event({active:false})],revision:2})).status,200);assert.equal((await fetch(origin+'/eventos/test-event')).status,404);assert.deepEqual((await get('/api/events')).events,[]);
 await app.close();app=await start({port:0,dataDir:join(folder,'.local'),password:'qa-events-only'});const persisted=await (await fetch(app.url+'/api/socials')).json();assert.equal(persisted.socials.instagram,'https://instagram.com/demo/');
 }finally{await app?.close();await rm(folder,{recursive:true,force:true});}
});
