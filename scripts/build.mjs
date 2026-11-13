import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';import {resolve,join} from 'node:path';import {fileURLToPath} from 'node:url';import {loadProfile,seedState} from './perfil.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function build(output=join(root,'dist')){
 await mkdir(output,{recursive:true});await cp(join(root,'public'),output,{recursive:true});
 await mkdir(join(output,'_worker.js'),{recursive:true});
 const worker=await readFile(join(root,'src/worker.js'),'utf8');await writeFile(join(output,'_worker.js/index.js'),worker.replace("'../public/domain.js'","'./domain.js'").replace("'../public/events.js'","'./events.js'"));await cp(join(root,'public/domain.js'),join(output,'_worker.js/domain.js'));
 await cp(join(root,'public/events.js'),join(output,'_worker.js/events.js'));
 const html=await readFile(join(root,'public/index.html'),'utf8');await writeFile(join(output,'admin.html'),html.replaceAll('carta-','admin-').replace('/icon-32.png','/assets/admin-32.png').replace('/icon-180.png','/assets/admin-180.png').replace('/carta.webmanifest','/admin.webmanifest').replace('Tu restaurante · Carta','Administración · Restaurante'));
 await writeFile(join(output,'_routes.json'),JSON.stringify({version:1,include:['/eventos/*','/api/*','/media/*','/admin','/admin/','/carta.webmanifest','/admin.webmanifest','/icon-32.png','/icon-180.png','/icon-192.png','/icon-512.png'],exclude:[]}));
 await mkdir(join(root,'.local'),{recursive:true});await writeFile(join(root,'.local/seed-template.sql'),"INSERT OR IGNORE INTO restaurant_state(id,revision,payload) VALUES(1,1,'"+JSON.stringify(seedState(await loadProfile(root))).replaceAll("'","''")+"');\n");
 return output;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){console.log('Build local:',await build());console.log('No se ha publicado ni conectado ninguna base remota.');}
