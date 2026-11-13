import {parseEvents,activeEvents,parseSocials,eventLink,eventLanguage,localizeEvent,prepareDemoEventTranslations} from '../public/events.js';
import {mergeChanges,initializeBeverages} from '../public/domain.js';
const encoder=new TextEncoder();
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export const digest=async value=>hex(await crypto.subtle.digest('SHA-256',typeof value==='string'?encoder.encode(value):value));
export async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256));}
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;};
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const reject=(message,status=400)=>{const e=new Error(message);e.status=status;throw e;};
async function body(request,max=2000000){const reader=request.body?.getReader();if(!reader)return new Uint8Array();let size=0;const chunks=[];for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();reject('Archivo o petición demasiado grande.',413);}chunks.push(value);}const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;}
async function jsonBody(request,max){try{return JSON.parse(new TextDecoder().decode(await body(request,max)));}catch(e){if(e.status)throw e;reject('Petición JSON inválida.');}}
async function authenticated(request,env){const token=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)restaurant_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return false;return !!await env.DB.prepare('SELECT token FROM restaurant_sessions WHERE token=? AND expires>?').bind(await digest(token),Date.now()).first();}
async function current(env){
 for(let tries=0;tries<3;tries++){
 const row=await env.DB.prepare('SELECT payload,revision FROM restaurant_state WHERE id=1').first();if(!row)reject('Inicializa la base de datos de este restaurante.',503);
 const original=JSON.parse(row.payload),data=initializeBeverages(original);
 if(data===original)return {data,revision:row.revision};
 const result=await env.DB.prepare('UPDATE restaurant_state SET payload=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(data),row.revision).run();
 if(result.meta.changes)return {data,revision:row.revision+1};
 }reject('Otro dispositivo está guardando; vuelve a intentar.',409);
}

async function feature(env,kind){
 try{for(let tries=0;tries<3;tries++){
  const row=await env.DB.prepare('SELECT payload,revision FROM restaurant_'+kind+' WHERE id=1').first();if(!row)return {[kind]:kind==='events'?[]:{instagram:'',facebook:''},revision:0};
  const original=JSON.parse(row.payload),data=kind==='events'?prepareDemoEventTranslations(original):original;
  if(data===original)return {[kind]:data,revision:row.revision};
  const result=await env.DB.prepare('UPDATE restaurant_events SET payload=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(data),row.revision).run();if(result.meta.changes)return {events:data,revision:row.revision+1};
 }reject('Otro dispositivo está guardando; vuelve a intentar.',409);}
 catch(e){if(!/no such table: (?:main\.)?restaurant_(events|socials)/i.test(e.message))throw e;return {[kind]:kind==='events'?[]:{instagram:'',facebook:''},revision:0};}
}
const htmlEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function handle(request,env){
 const url=new URL(request.url),path=url.pathname,method=request.method;
 if(!['GET','HEAD'].includes(method)&&request.headers.get('Origin')!==url.origin)reject('Origen no autorizado.',403);
 if(path==='/api/login'&&method==='POST'){
  if(!env.ADMIN_HASH||!env.ADMIN_SALT)reject('Falta configurar el acceso del administrador.',503);
  const now=Date.now(),key=await digest((request.headers.get('CF-Connecting-IP')||'local')+env.ADMIN_SALT);
  await env.DB.prepare('DELETE FROM restaurant_attempts WHERE expires<?').bind(now).run();
  await env.DB.prepare('INSERT INTO restaurant_attempts(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1').bind(key,now+300000).run();
  const attempt=await env.DB.prepare('SELECT count FROM restaurant_attempts WHERE id=?').bind(key).first();if(attempt.count>8)reject('Demasiados intentos. Espera cinco minutos.',429);
  const input=await jsonBody(request,1024);if(typeof input.password!=='string'||input.password.length>200||!equal(await passwordHash(input.password,env.ADMIN_SALT),env.ADMIN_HASH))reject('Contraseña incorrecta.',401);
  await env.DB.prepare('DELETE FROM restaurant_attempts WHERE id=?').bind(key).run();
  await env.DB.prepare('DELETE FROM restaurant_sessions WHERE expires<?').bind(now).run();
  const token=random();await env.DB.prepare('INSERT INTO restaurant_sessions(token,expires) VALUES(?,?)').bind(await digest(token),now+28800000).run();
  return json({ok:true},200,{'Set-Cookie':`restaurant_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${url.protocol==='https:'?'; Secure':''}`});
 }
 if(path==='/api/logout'&&method==='POST'){
  const token=(request.headers.get('Cookie')||'').match(/restaurant_session=([a-f0-9]{64})/)?.[1];if(token)await env.DB.prepare('DELETE FROM restaurant_sessions WHERE token=?').bind(await digest(token)).run();
  return json({ok:true},200,{'Set-Cookie':'restaurant_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
 }
 if(path==='/api/menu'&&method==='GET'){const state=await current(env);state.data.dishes=state.data.dishes.filter(d=>!d.hidden);return json(state);}
 if(path==='/api/events'&&method==='GET'){const snapshot=await feature(env,'events');return json({...snapshot,events:activeEvents(snapshot.events,Date.now())});}
 if(path==='/api/socials'&&method==='GET')return json(await feature(env,'socials'));
 if(path.startsWith('/eventos/')&&['GET','HEAD'].includes(method)){
  const snapshot=await feature(env,'events'),language=eventLanguage(url.searchParams.get('lang')),original=activeEvents(snapshot.events,Date.now()).find(e=>e.id===path.slice(9)),event=original?localizeEvent(original,language):null;
  if(!event)return new Response('Evento no disponible',{status:404,headers:{'Cache-Control':'no-store'}});
  const response=await env.ASSETS.fetch(new Request(new URL('/',url))),html=await response.text();
  const meta='<meta property="og:locale" content="'+({es:'es_ES',en:'en_GB',de:'de_DE'})[language]+'"><meta property="og:type" content="article"><meta property="og:title" content="'+htmlEscape(event.title)+'"><meta property="og:description" content="'+htmlEscape(event.description)+'"><meta property="og:url" content="'+htmlEscape(eventLink(url.origin,event.id,language))+'">'+(event.imageSrc?'<meta property="og:image" content="'+htmlEscape(url.origin+event.imageSrc)+'">':'');
  return new Response(method==='HEAD'?null:html.replace(/<html lang="[^"]*"/,()=>'<html lang="'+language+'"').replace(/<meta name="description" content="[^"]*">/,()=>'<meta name="description" content="'+htmlEscape(event.description)+'">').replace(/<title>[^<]*<\/title>/,()=>'<title>'+htmlEscape(event.title)+'</title>').replace('</head>',()=>meta+'</head>'),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff'}});
 }
 if(path.startsWith('/api/admin/')){
  if(!await authenticated(request,env))reject('Inicia sesión para administrar.',401);
  const kind=path==='/api/admin/events'?'events':path==='/api/admin/socials'?'socials':null;
  if(kind&&method==='GET')return json(await feature(env,kind));
  if(kind&&method==='PUT'){
   const input=await jsonBody(request,kind==='events'?250000:100000);
   let proposed=input.events;
   if(kind==='events'&&Array.isArray(proposed)){const current=await feature(env,'events');proposed=proposed.map(e=>{const old=current.events.find(x=>x.id===e?.id);return e&&typeof e==='object'?{...e,buttonLabel:e.buttonLabel??old?.buttonLabel??'',buttonUrl:e.buttonUrl??old?.buttonUrl??'',...(!Object.hasOwn(e,'translations')&&old?.translations?{translations:old.translations}:{})}:e;});}
   const data=kind==='events'?parseEvents(proposed):parseSocials(input.socials);
   if(!data||!Number.isSafeInteger(input.revision)||input.revision<1)reject('Datos inválidos o esquema pendiente de actualizar.',422);
   if(kind==='events')for(const event of data)if(event.imageSrc&&!await env.DB.prepare('SELECT id FROM restaurant_images WHERE id=?').bind(event.imageSrc.split('/').pop().split('.')[0]).first())reject('La imagen no existe. Vuelve a subirla.',422);
   const result=await env.DB.prepare('UPDATE restaurant_'+kind+' SET payload=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(data),input.revision).run();
   if(!result.meta.changes)reject('Otro dispositivo ha guardado cambios. Tu formulario se conserva; revisa la versión actual antes de guardar.',409);
   return json({[kind]:data,revision:input.revision+1});
  }
  if(path==='/api/admin/storage'&&method==='GET'){const info=await env.DB.prepare('SELECT count(*) AS count,coalesce(sum(length(bytes)),0) AS bytes FROM restaurant_images').first();return json({...info,limit:104857600});}
  if(path==='/api/admin/images'&&method==='POST'){
   const bytes=await body(request,1048576);let ext='';
   if(bytes.length>=16){const ascii=(a,b)=>new TextDecoder().decode(bytes.slice(a,b));if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')ext='webp';else if(bytes[0]===137&&ascii(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10)ext='png';else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)ext='jpg';}
   if(!ext)reject('Solo se admiten imágenes JPG, PNG y WebP válidas.',422);
   const id=await digest(bytes),mime='image/'+(ext==='jpg'?'jpeg':ext);
   await env.DB.prepare('INSERT INTO restaurant_images(id,mime,bytes) SELECT ?,?,? WHERE (SELECT coalesce(sum(length(bytes)),0) FROM restaurant_images)+?<=104857600 ON CONFLICT(id) DO NOTHING').bind(id,mime,bytes.buffer,bytes.length).run();
   if(!await env.DB.prepare('SELECT id FROM restaurant_images WHERE id=?').bind(id).first())reject('Se ha alcanzado el límite de fotos (100 MiB).',413);
   return json({src:`/media/${id}.${ext}`});
  }
  if(path==='/api/admin/menu'&&method==='GET')return json(await current(env));
  if(path==='/api/admin/menu'&&method==='PATCH'){
   const input=await jsonBody(request);
   for(let tries=0;tries<3;tries++){
    const state=await current(env),data=mergeChanges(state.data,input.changes);
    const images=new Set([data.restaurant.logo,data.restaurant.headerArtwork,...data.dishes.map(d=>d.imageSrc)].filter(Boolean));
    for(const image of images)if(!await env.DB.prepare('SELECT id FROM restaurant_images WHERE id=?').bind(image.split('/').pop().split('.')[0]).first())reject('La imagen no existe. Vuelve a subirla.');
    const result=await env.DB.prepare('UPDATE restaurant_state SET payload=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(data),state.revision).run();
    if(result.meta.changes)return json({data,revision:state.revision+1});
   }reject('Otro dispositivo está guardando. Tu edición se conserva; vuelve a intentar.',409);
  }
 }
 if(path==='/admin.webmanifest'&&['GET','HEAD'].includes(method)){
  const {data}=await current(env);
  const nombre=data.restaurant.name||'Restaurante';
  const manifiesto={name:`${nombre} · Admin`,short_name:`${nombre.slice(0,14)} Admin`,start_url:'/admin',scope:'/',display:'standalone',background_color:'#f5f0e6',theme_color:'#f5f0e6',icons:[{src:'/assets/admin-192.png',sizes:'192x192',type:'image/png'},{src:'/assets/admin-512.png',sizes:'512x512',type:'image/png'}]};
  return new Response(method==='HEAD'?null:JSON.stringify(manifiesto),{headers:{'Content-Type':'application/manifest+json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }
 if(path==='/carta.webmanifest'&&['GET','HEAD'].includes(method)){
  const {data}=await current(env);
  const nombre=data.restaurant.name||'Carta';
  const iconos=data.restaurant.logo&&data.restaurant.logo.startsWith('/media/')
   ?[{src:'/icon-192.png',sizes:'any',type:'image/png'},{src:'/icon-512.png',sizes:'any',type:'image/png'}]
   :[{src:'/assets/carta-192.png',sizes:'192x192',type:'image/png'},{src:'/assets/carta-512.png',sizes:'512x512',type:'image/png'}];
  const manifiesto={name:`${nombre} · Carta`,short_name:nombre.slice(0,20),start_url:'/',scope:'/',display:'standalone',background_color:'#f5f0e6',theme_color:'#f5f0e6',icons:iconos};
  return new Response(method==='HEAD'?null:JSON.stringify(manifiesto),{headers:{'Content-Type':'application/manifest+json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }
 // Icono de la app: el logo del restaurante tal cual. iOS necesita PNG o JPG, así que si el logo es WebP se usa el genérico.
 const icono=path.match(/^\/icon-(32|180|192|512)\.png$/);
 if(icono&&['GET','HEAD'].includes(method)){
  const {data}=await current(env);
  const logo=data.restaurant.logo||'';
  const partes=logo.match(/^\/media\/([a-f0-9]{64})\.(webp|jpg|png)$/);
  if(partes){
   const imagen=await env.DB.prepare('SELECT mime,bytes FROM restaurant_images WHERE id=?').bind(partes[1]).first();
   if(imagen&&['image/png','image/jpeg'].includes(imagen.mime))return new Response(method==='HEAD'?null:new Uint8Array(imagen.bytes),{headers:{'Content-Type':imagen.mime,'Cache-Control':'public, max-age=600','X-Content-Type-Options':'nosniff'}});
  }
  return env.ASSETS.fetch(new Request(new URL(`/assets/carta-${icono[1]}.png`,url),{method:method==='HEAD'?'HEAD':'GET'}));
 }
 if(path.startsWith('/media/')&&['GET','HEAD'].includes(method)){
  const match=path.match(/^\/media\/([a-f0-9]{64})\.(webp|jpg|png)$/);if(!match)return new Response('No encontrado',{status:404});
  const image=await env.DB.prepare('SELECT mime,bytes FROM restaurant_images WHERE id=?').bind(match[1]).first();
  if(!image||image.mime!=='image/'+(match[2]==='jpg'?'jpeg':match[2]))return new Response('No encontrado',{status:404});
  return new Response(method==='HEAD'?null:new Uint8Array(image.bytes),{headers:{'Content-Type':image.mime,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'"}});
 }
 if(path.startsWith('/api/'))return json({error:'Ruta no disponible.'},404);
 if(['GET','HEAD'].includes(method))return env.ASSETS.fetch(request);
 return json({error:'Método no permitido.'},405);
}
export default {async fetch(request,env){try{return await handle(request,env);}catch(e){return json({error:e.status?e.message:(e.message?.startsWith('Datos inválidos')?e.message:'No se pudo completar la operación.')},e.status||400);}}};
