import {resolve,relative,isAbsolute,sep,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {nuevoRestaurante} from '../assets/plantilla/scripts/nuevo-restaurante.mjs';
const skill=resolve(fileURLToPath(new URL('../',import.meta.url)));
const allowed=new Set(['nombre','carpeta','eslogan','puerto','logo','cabecera']);
async function main(){
 const args=process.argv.slice(2),options={};
 if(args.length===1&&args[0]==='--help'){console.log('Node 24+. Uso: node crear-proyecto.mjs --nombre "Casa Olivo" --carpeta "C:/Proyectos/Casa Olivo" [--eslogan texto] [--puerto número] [--logo ruta] [--cabecera ruta]');return;}
 for(let i=0;i<args.length;i+=2){const key=args[i].slice(2);if(!args[i].startsWith('--')||!allowed.has(key)||!args[i+1]||Object.hasOwn(options,key))throw Error('Opciones inválidas. Consulta --help.');options[key]=args[i+1];}
 if(!options.nombre||!options.carpeta||!isAbsolute(options.carpeta))throw Error('Indica --nombre y una --carpeta absoluta.');
 const destination=resolve(options.carpeta),rel=relative(skill,destination);
 if(!rel||(!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel)))throw Error('El proyecto debe estar fuera del skill.');
 // Also prevent selecting an ancestor of the installed skill as destination.
 const ancestor=relative(destination,skill);if(!ancestor||(!ancestor.startsWith('..'+sep)&&ancestor!=='..'&&!isAbsolute(ancestor)))throw Error('La carpeta de destino no puede contener el skill.');
 const result=await nuevoRestaurante({...options,carpeta:destination,puerto:options.puerto?Number(options.puerto):undefined});
 await writeFile(join(destination,'BITACORA.md'),`# Bitácora\n\n${new Date().toISOString()} · Instalación independiente creada desde plantilla-restaurantes. Base y acceso nuevos; no se importaron datos de otro proyecto. Sin publicación, commit ni push.\n`,{flag:'wx'});
 console.log(JSON.stringify({carpeta:result.carpeta,nombre:result.nombre,url:result.url,administracion:result.url+'/admin',accesoPrivado:join(destination,'.local/acceso-local.json'),arranque:'npm run dev',publicado:false},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
