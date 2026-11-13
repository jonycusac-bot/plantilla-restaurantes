import {readFile,readdir} from 'node:fs/promises';import {join,resolve,extname} from 'node:path';import {fileURLToPath} from 'node:url';

const TIPOS={'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg'};

export async function subirFotos({url,password,carpeta=process.cwd()}){
 if(!url||!password)throw new Error('Faltan la dirección del sitio o la contraseña.');
 let origen;
 try{origen=new URL(url).origin;}catch{throw new Error(`Dirección no válida: ${url}`);}
 const carpetaFotos=join(resolve(carpeta),'deploy','fotos');
 let archivos;
 try{archivos=await readdir(carpetaFotos);}catch{throw new Error(`No encuentro las fotos en ${carpetaFotos}.\nEjecuta antes: npm run exportar`);}
 archivos=archivos.filter(a=>TIPOS[extname(a).toLowerCase()]).sort();
 if(!archivos.length)throw new Error('No hay fotos que subir en deploy/fotos.');

 const sesion=await fetch(`${origen}/api/login`,{method:'POST',headers:{Origin:origen,'Content-Type':'application/json'},body:JSON.stringify({password})});
 if(!sesion.ok)throw new Error(`No se pudo entrar en ${origen} (HTTP ${sesion.status}). Revisa la contraseña remota.`);
 const cookie=(sesion.headers.get('set-cookie')||'').split(';')[0];

 let subidas=0;
 for(const archivo of archivos){
  const bytes=await readFile(join(carpetaFotos,archivo));
  const tipo=TIPOS[extname(archivo).toLowerCase()];
  const respuesta=await fetch(`${origen}/api/admin/images`,{method:'POST',headers:{Origin:origen,Cookie:cookie,'Content-Type':tipo},body:bytes});
  if(!respuesta.ok){const dato=await respuesta.json().catch(()=>({}));throw new Error(`Fallo subiendo ${archivo}: ${dato.error||respuesta.status}`);}
  subidas++;
 }

 const menu=await (await fetch(`${origen}/api/menu`)).json();
 const referencias=[...new Set([menu.data.restaurant.logo,menu.data.restaurant.headerArtwork,...menu.data.dishes.map(d=>d.imageSrc)].filter(Boolean))];
 const rotas=[];
 for(const referencia of referencias){
  const respuesta=await fetch(`${origen}${referencia}`,{method:'HEAD'});
  if(!respuesta.ok)rotas.push(referencia);
 }
 return {subidas,referencias:referencias.length,rotas};
}

const esMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(esMain){
 const [url,password]=process.argv.slice(2);
 const i=process.argv.indexOf('--carpeta');
 const carpeta=i>0?process.argv[i+1]:process.cwd();
 try{
  const r=await subirFotos({url,password,carpeta});
  console.log(`\nSubidas ${r.subidas} fotos a ${url}`);
  console.log(`La carta remota referencia ${r.referencias} imágenes · ${r.rotas.length} sin cargar`);
  if(r.rotas.length){console.log('Faltan estas:');for(const f of r.rotas)console.log('  '+f);process.exitCode=1;}
  else console.log('Todas las fotos de la carta cargan correctamente.\n');
 }catch(e){console.error(`\nNo se pudieron subir: ${e.message}\n`);process.exitCode=1;}
}
