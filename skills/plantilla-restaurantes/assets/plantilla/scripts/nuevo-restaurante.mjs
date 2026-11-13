import {cp,mkdir,readdir,access,writeFile,readFile} from 'node:fs/promises';import {createServer} from 'node:net';import {createInterface} from 'node:readline/promises';import {resolve,join,sep,basename} from 'node:path';import {fileURLToPath} from 'node:url';
import {CONFIG_FILE,DEFAULT_PORT,loadTemplateConfig,saveTemplateConfig} from './perfil.mjs';import {start} from './local.mjs';import {diff} from '../public/domain.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const COPIAR=['PROTOCOLO.md','public','src','scripts','cloudflare','tests','package.json','package-lock.json','.gitignore','README.md','INICIAR.cmd','NUEVO-RESTAURANTE.cmd','wrangler.example.jsonc','GUIA-NUEVO-RESTAURANTE.md','restaurante.config.example.json'];
const OPCIONALES=new Set(['NUEVO-RESTAURANTE.cmd','package-lock.json','GUIA-NUEVO-RESTAURANTE.md','restaurante.config.example.json']);
const PROHIBIDO=['.local','.git','node_modules','dist','.wrangler','test-results','.test-output','playwright-report','.env','.dev.vars'];
const MAXIMO_IMAGEN=1048576;
const existe=async p=>{try{await access(p);return true;}catch{return false;}};
export function slug(nombre){return nombre.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'restaurante';}
// Nombre de carpeta legible, como "Restaurante Taro Cancelada", sin caracteres que Windows no admite.
export function nombreDeCarpeta(nombre,prefijo=''){
 const limpio=`${prefijo}${nombre}`.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'').replace(/\s+/g,' ').trim().slice(0,80);
 return limpio||slug(nombre);
}
export function carpetaSugerida(carpetaBase,nombre,prefijo=''){return join(carpetaBase,nombreDeCarpeta(nombre,prefijo));}
function libre(port,host){return new Promise(ok=>{const s=createServer();s.once('error',()=>ok(false));s.listen(port,host,()=>s.close(()=>ok(true)));});}
export async function puertoLibre(desde=DEFAULT_PORT,host='127.0.0.1',intentos=80){
 for(let p=desde;p<desde+intentos&&p<65536;p++)if(await libre(p,host))return p;
 throw new Error(`No hay ningún puerto libre entre ${desde} y ${desde+intentos-1}. Cierra otros servidores o indica --puerto.`);
}
function tipoImagen(bytes){
 if(bytes.length<16)return '';
 const ascii=(a,b)=>new TextDecoder().decode(bytes.subarray(a,b));
 if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')return 'image/webp';
 if(bytes[0]===137&&ascii(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10)return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 return '';
}
export async function leerImagen(entrada){
 if(entrada&&typeof entrada==='object'&&entrada.bytes)return entrada;
 const absoluta=resolve(String(entrada).trim().replace(/^["']|["']$/g,''));
 let bytes;try{bytes=await readFile(absoluta);}catch{throw new Error(`No encuentro la imagen: ${absoluta}`);}
 const tipo=tipoImagen(bytes);
 if(!tipo)throw new Error(`"${absoluta}" no es un JPG, PNG o WebP válido.`);
 if(bytes.length>MAXIMO_IMAGEN)throw new Error(`"${basename(absoluta)}" ocupa ${(bytes.length/1048576).toFixed(2)} MiB y el máximo del servidor es 1 MiB. Redúcela antes de continuar.`);
 return {bytes,tipo,ruta:absoluta,nombre:basename(absoluta),pesada:bytes.length>750*1024};
}
async function colocarImagenes(app,imagenes){
 if(!app.password)throw new Error('Esa carpeta ya tenía un acceso local: no se pueden colocar las imágenes sin la contraseña.');
 const sesion=await fetch(`${app.url}/api/login`,{method:'POST',headers:{Origin:app.url,'Content-Type':'application/json'},body:JSON.stringify({password:app.password})});
 if(!sesion.ok)throw new Error('No se pudo iniciar sesión en la instalación nueva para colocar las imágenes.');
 const cookie=(sesion.headers.get('set-cookie')||'').split(';')[0];
 const estado=await (await fetch(`${app.url}/api/admin/menu`,{headers:{Cookie:cookie}})).json();
 const siguiente=structuredClone(estado.data);
 const subir=async imagen=>{
  const respuesta=await fetch(`${app.url}/api/admin/images`,{method:'POST',headers:{Origin:app.url,Cookie:cookie,'Content-Type':imagen.tipo},body:imagen.bytes});
  const data=await respuesta.json().catch(()=>({}));
  if(!respuesta.ok)throw new Error(`No se pudo subir ${imagen.nombre}: ${data.error||'error del servidor'}.`);
  return data.src;
 };
 if(imagenes.logo)siguiente.restaurant.logo=await subir(imagenes.logo);
 if(imagenes.cabecera)siguiente.restaurant.headerArtwork=await subir(imagenes.cabecera);
 const cambios=diff(estado.data,siguiente);
 if(cambios.length){
  const respuesta=await fetch(`${app.url}/api/admin/menu`,{method:'PATCH',headers:{Origin:app.url,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({changes:cambios})});
  if(!respuesta.ok){const data=await respuesta.json().catch(()=>({}));throw new Error(`No se pudieron guardar las imágenes: ${data.error||'error del servidor'}.`);}
 }
 return {logo:siguiente.restaurant.logo||'',cabecera:siguiente.restaurant.headerArtwork||''};
}
export async function nuevoRestaurante({nombre,carpeta,puerto,eslogan,logo,cabecera,inicializar=true,host='127.0.0.1'}={}){
 const limpio=(typeof nombre==='string'?nombre.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' '):'').replace(/^["'\s]+|["'\s]+$/g,'').trim();
 if(limpio.length<1||limpio.length>100)throw new Error('Indica un nombre de restaurante de 1 a 100 caracteres.');
 if(/["]|--/.test(limpio))throw new Error(`Nombre no válido: "${limpio}". No uses comillas ni guiones dobles; escribe solo el nombre del restaurante entre comillas.`);
 const imagenes={logo:logo?await leerImagen(logo):null,cabecera:cabecera?await leerImagen(cabecera):null};
 if(!inicializar&&(imagenes.logo||imagenes.cabecera))throw new Error('Para colocar logo o cabecera hay que crear la base de datos: quita --sin-inicializar.');
 const plantilla=await loadTemplateConfig(root);
 const destino=resolve(carpeta||carpetaSugerida(plantilla.carpetaBase,limpio,plantilla.prefijo));
 if(destino===resolve(root))throw new Error('La carpeta de destino no puede ser la propia plantilla maestra.');
 if(destino.startsWith(resolve(root)+sep)&&!destino.startsWith(join(resolve(root),'restaurantes')+sep))throw new Error('Dentro de la plantilla maestra solo se crean instalaciones en la carpeta "restaurantes".');
 if(PROHIBIDO.some(name=>destino.split(sep).includes(name)))throw new Error(`La ruta no puede contener carpetas reservadas (${PROHIBIDO.join(', ')}).`);
 if(await existe(destino)){const items=await readdir(destino);if(items.length)throw new Error(`La carpeta ya existe y no está vacía: ${destino}\nNo se sobrescribe nada. Usa otro nombre o --carpeta.`);}
 const puertoFinal=puerto??await puertoLibre(DEFAULT_PORT,host);
 if(!Number.isInteger(puertoFinal)||puertoFinal<1||puertoFinal>65535)throw new Error('El puerto debe ser un número entre 1 y 65535.');
 await mkdir(destino,{recursive:true});
 for(const entry of COPIAR){
  const desde=join(root,entry);
  if(!await existe(desde)){if(OPCIONALES.has(entry))continue;throw new Error(`Falta "${entry}" en la plantilla. Instalación no creada.`);}
  await cp(desde,join(destino,entry),{recursive:true,force:false,errorOnExist:false});
 }
 for(const name of PROHIBIDO){const sobra=join(destino,name);if(await existe(sobra))throw new Error(`La copia incluye "${name}", que no debe reutilizarse: ${sobra}`);}
 const config={nombre:limpio,eslogan:(typeof eslogan==='string'&&eslogan.trim()?eslogan.trim():'COCINA CON PERSONALIDAD').slice(0,160),puerto:puertoFinal,host};
 await writeFile(join(destino,CONFIG_FILE),JSON.stringify(config,null,2)+'\n',{flag:'wx'});
 let password=null,logoSrc='',cabeceraSrc='';
 if(inicializar){
  const app=await start({port:0,dataDir:join(destino,'.local'),profile:{...config}});
  password=app.password;
  try{
   if(imagenes.logo||imagenes.cabecera){const puestas=await colocarImagenes(app,imagenes);logoSrc=puestas.logo;cabeceraSrc=puestas.cabecera;}
  }finally{await app.close();}
 }
 return {carpeta:destino,nombre:limpio,puerto:puertoFinal,password,logoSrc,cabeceraSrc,url:`http://127.0.0.1:${puertoFinal}`};
}
async function cuestionario(opciones){
 const rl=createInterface({input:process.stdin,output:process.stdout});
 let cerrado=false;
 const fin=new Promise(ok=>rl.once('close',()=>{cerrado=true;ok();}));
 const pregunta=async(texto,defecto='')=>{
  const respuesta=await Promise.race([rl.question(defecto?`${texto} [${defecto}]: `:`${texto}: `),fin.then(()=>Symbol.for('sin-entrada'))]);
  if(typeof respuesta==='symbol')throw Object.assign(new Error('Sin entrada'),{code:'CUESTIONARIO_CERRADO'});
  const limpia=String(respuesta).trim();
  return limpia||defecto;
 };
 const pedirImagen=async(etiqueta,defecto)=>{
  for(;;){
   const ruta=await pregunta(etiqueta,defecto);
   if(!ruta)return null;
   try{const imagen=await leerImagen(ruta);if(imagen.pesada)console.log(`   Aviso: ${imagen.nombre} supera 750 KiB. Se verá bien, pero conviene reducirla.`);return imagen;}
   catch(e){console.log(`   ${e.message}\n   Vuelve a intentarlo o pulsa Enter para dejarlo sin imagen.`);}
  }
 };
 try{
  if(cerrado)throw Object.assign(new Error('Sin entrada'),{code:'CUESTIONARIO_CERRADO'});
  console.log('\n=== NUEVO RESTAURANTE A PARTIR DE LA PLANTILLA ===\n');
  let nombre='';
  while(!nombre){nombre=await pregunta('1) ¿Cómo se llama el restaurante?');if(!nombre)console.log('   El nombre es obligatorio.');}
  const eslogan=await pregunta('2) Eslogan de la cabecera',opciones.eslogan||'COCINA CON PERSONALIDAD');
  console.log('3) Logo del restaurante: arrastra el archivo o escribe su ruta. Enter si todavía no lo tienes.');
  const logo=await pedirImagen('   Ruta del logo');
  console.log('4) Imagen de la cabecera (banda horizontal encima del nombre). Enter si no la tienes.');
  const cabecera=await pedirImagen('   Ruta de la cabecera');
  let puerto;
  for(;;){
   const texto=await pregunta('5) Puerto (Enter = primero libre desde 4182)');
   if(!texto){puerto=undefined;break;}
   const numero=Number(texto);
   if(Number.isInteger(numero)&&numero>=1&&numero<=65535){puerto=numero;break;}
   console.log('   Ese puerto no vale. Escribe un número entre 1 y 65535 o pulsa Enter.');
  }
  const plantilla=await loadTemplateConfig(root);
  let carpeta=opciones.carpeta;
  let nuevaBase=null;
  if(!carpeta){
   const base=await pregunta('6) Carpeta donde guardar los restaurantes',opciones.base||plantilla.carpetaBase);
   carpeta=carpetaSugerida(base,nombre,plantilla.prefijo);
   if(resolve(base)!==resolve(plantilla.carpetaBase))nuevaBase=base;
  }
  console.log('\n   Restaurante : '+nombre);
  console.log('   Eslogan     : '+eslogan);
  console.log('   Logo        : '+(logo?logo.nombre:'sin logo (se puede subir desde /admin)'));
  console.log('   Cabecera    : '+(cabecera?cabecera.nombre:'sin cabecera (se puede subir desde /admin)'));
  console.log('   Puerto      : '+(puerto??'automático'));
  console.log('   Carpeta     : '+resolve(carpeta));
  console.log('   Carta       : 4 secciones de comida con 4 ejemplos cada una y Bebidas vacía\n');
  const confirma=await pregunta('¿Crear el restaurante ahora? (S/n)','S');
  if(/^n/i.test(confirma))return null;
  if(nuevaBase){
   await saveTemplateConfig(root,{carpetaBase:nuevaBase,prefijo:plantilla.prefijo});
   console.log(`   Recordaré "${nuevaBase}" como carpeta de restaurantes.\n`);
  }
  return {nombre,eslogan,carpeta,puerto,logo,cabecera};
 }catch(e){
  if(e&&e.code==='CUESTIONARIO_CERRADO')return null;
  throw e;
 }finally{rl.close();}
}
const esMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(esMain){
 const args=process.argv.slice(2),posicionales=[],opciones={};
 for(let i=0;i<args.length;i++){
  const actual=args[i];if(!actual.startsWith('--')){posicionales.push(actual);continue;}
  const [clave,inline]=actual.split('=');
  if(inline!==undefined)opciones[clave.slice(2)]=inline;
  else if(['--carpeta','--base','--puerto','--eslogan','--logo','--cabecera'].includes(clave)&&args[i+1]&&!args[i+1].startsWith('--'))opciones[clave.slice(2)]=args[++i];
  else opciones[clave.slice(2)]=true;
 }
 const nombre=posicionales.join(' ').trim();
 try{
  let datos;
  if(nombre&&!opciones.interactivo){
   let carpeta=opciones.carpeta;
   if(!carpeta&&opciones.base){
    const plantilla=await loadTemplateConfig(root);
    carpeta=carpetaSugerida(opciones.base,nombre,plantilla.prefijo);
   }
   datos={nombre,carpeta,puerto:opciones.puerto?Number(opciones.puerto):undefined,eslogan:opciones.eslogan,logo:opciones.logo,cabecera:opciones.cabecera,inicializar:!opciones['sin-inicializar']};
  }else{
   datos=await cuestionario(opciones);
  }
  if(!datos){console.log('\nCancelado. No se ha creado nada.\n');}
  else{
   const resultado=await nuevoRestaurante(datos);
   console.log(`\nInstalación creada para "${resultado.nombre}".`);
   console.log(`Carpeta: ${resultado.carpeta}`);
   console.log(`Carta: ${resultado.url}/\nAdministración: ${resultado.url}/admin`);
   console.log(`Logo: ${resultado.logoSrc?'colocado':'sin logo'}\nCabecera: ${resultado.cabeceraSrc?'colocada':'sin cabecera'}`);
   console.log(resultado.password?`Contraseña local (nueva y única): ${resultado.password}\nGuárdala. También está en .local/acceso-local.json`:`Contraseña local: todavía no generada. Se crea en el primer arranque.`);
   console.log(`\nSiguiente paso: abre INICIAR.cmd en esa carpeta, o ejecuta "npm run dev" dentro de ella.`);
   console.log(`Recuerda: no copies .local/ de otra instalación para no reutilizar contraseña ni datos.\n`);
  }
 }catch(e){console.error(`\nNo se ha creado la instalación: ${e.message}\n`);process.exitCode=1;}
}
