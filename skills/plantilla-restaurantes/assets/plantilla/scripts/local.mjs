import {createServer} from 'node:http';import {DatabaseSync} from 'node:sqlite';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {resolve,extname,join} from 'node:path';import {fileURLToPath} from 'node:url';import {randomBytes} from 'node:crypto';
import {initializeBeverages} from '../public/domain.js';
import worker,{passwordHash} from '../src/worker.js';import {loadProfile,seedState} from './perfil.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function start({port,host,dataDir=join(root,'.local'),password,profile}={}){
 const perfil=profile||await loadProfile(root);
 const listenPort=port??(process.env.PORT?Number(process.env.PORT):perfil.puerto);
 await mkdir(dataDir,{recursive:true});const configPath=join(dataDir,'acceso-local.json');let config,created=false;
 try{config=JSON.parse(await readFile(configPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;const pass=password||randomBytes(12).toString('base64url'),salt=randomBytes(20).toString('hex');config={ADMIN_SALT:salt,ADMIN_HASH:await passwordHash(pass,salt),password:pass};await writeFile(configPath,JSON.stringify(config,null,2),{flag:'wx'});created=true;}
 const db=new DatabaseSync(join(dataDir,'restaurante.sqlite'));db.exec('PRAGMA journal_mode=WAL;');db.exec(await readFile(join(root,'cloudflare/schema.sql'),'utf8'));
 db.prepare('INSERT OR IGNORE INTO restaurant_state(id,revision,payload) VALUES(1,1,?)').run(JSON.stringify(seedState(perfil)));
 const stored=db.prepare('SELECT payload FROM restaurant_state WHERE id=1').get();const original=JSON.parse(stored.payload),migrated=initializeBeverages(original);if(migrated!==original)db.prepare('UPDATE restaurant_state SET payload=?,revision=revision+1 WHERE id=1 AND payload=?').run(JSON.stringify(migrated),stored.payload);
 const DB={prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null;},async run(){const r=db.prepare(sql).run(...args.map(a=>a instanceof ArrayBuffer?new Uint8Array(a):a));return {meta:{changes:Number(r.changes)}};}};},async first(){return db.prepare(sql).get()||null;},async run(){const r=db.prepare(sql).run();return {meta:{changes:Number(r.changes)}};}};}};
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
 const ASSETS={async fetch(req){let path=decodeURIComponent(new URL(req.url).pathname);if(path==='/'||path==='/admin'||path==='/admin/')path='/index.html';if(path.split('/').some(s=>s.startsWith('.')||s.includes('\\')))return new Response('No encontrado',{status:404});const file=resolve(root,'public','.'+path);if(!file.startsWith(resolve(root,'public')+'/')&&!file.startsWith(resolve(root,'public')+'\\'))return new Response('No encontrado',{status:404});try{const bytes=await readFile(file);return new Response(req.method==='HEAD'?null:bytes,{headers:{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"}});}catch{return new Response('No encontrado',{status:404});}}};
 const server=createServer(async(req,res)=>{try{
  const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);headers.set('CF-Connecting-IP',req.socket.remoteAddress||'local');
  const url=`http://${req.headers.host}${req.url}`;const init={method:req.method,headers};if(!['GET','HEAD'].includes(req.method)){init.body=req;init.duplex='half';}
  const result=await worker.fetch(new Request(url,init),{DB,ASSETS,...config});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch{res.writeHead(500);res.end('Error local.');}});
 await new Promise((ok,no)=>{server.once('error',no);server.listen(listenPort,host||perfil.host,ok);});const actual=server.address().port;
 return {url:`http://127.0.0.1:${actual}`,configPath,perfil,created,password:created?config.password:undefined,async close(){await new Promise((ok,no)=>server.close(e=>e?no(e):ok()));db.close();}};
}
export async function accessInfo(dataDir=join(root,'.local')){
 const configPath=join(dataDir,'acceso-local.json');
 try{const config=JSON.parse(await readFile(configPath,'utf8'));const perfil=await loadProfile(root);return {url:`http://127.0.0.1:${perfil.puerto}`,configPath,password:config.password,perfil};}
 catch(e){if(e.code!=='ENOENT')throw e;return {url:`http://127.0.0.1:${(await loadProfile(root)).puerto}`,configPath,password:null,perfil:await loadProfile(root)};}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const perfil=await loadProfile(root);
 if(process.argv.includes('--acceso')){
  const info=await accessInfo();
  console.log(`Restaurante: ${perfil.nombre}\nCarta: ${info.url}\nAdministración: ${info.url}/admin`);
  console.log(info.password?`Contraseña local: ${info.password}`:`Todavía no hay contraseña. Arranca una vez con "npm run dev".\nArchivo privado: ${info.configPath}`);
  console.log(`Puerto configurado: ${perfil.puerto}`);
 }else{
  const app=await start({});
  try{process.title=`${app.perfil.nombre} · ${new URL(app.url).port}`;}catch{}
  console.log(`Restaurante: ${app.perfil.nombre}\nCarta: ${app.url}\nAdministración: ${app.url}/admin`);
  if(app.password)console.log(`Contraseña local de este restaurante: ${app.password}\nGuárdala y no la compartas.`);
  else console.log(`Contraseña local: "npm run acceso" o el campo password de ${app.configPath}`);
  console.log(`Acceso privado local: ${app.configPath}`);
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await app.close();process.exit(0);});
 }
}
