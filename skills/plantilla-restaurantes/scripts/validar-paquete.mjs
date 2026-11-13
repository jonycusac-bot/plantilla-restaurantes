import {readFile,readdir,lstat} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const skill=resolve(fileURLToPath(new URL('../',import.meta.url)));
const forbidden=new Set(['.local','.git','.wrangler','node_modules','dist','deploy','RESPALDOS','restaurantes','test-results','.test-output','playwright-report','EXPORTACION-INCH-2026-11-11','acceso-local.json','restaurante.config.json','plantilla.config.json','wrangler.jsonc']);
const files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){assert.ok(!e.isSymbolicLink(),'No se admiten enlaces simbólicos');assert.ok(!forbidden.has(e.name),'Archivo privado o generado: '+e.name);assert.ok(!/\.(sqlite(?:-wal|-shm)?|db|pem|key)$/i.test(e.name)&&!/^\.(env|dev\.vars)/.test(e.name),'Datos privados: '+e.name);const p=join(dir,e.name);if(e.isDirectory())await walk(p);else files.push(p);}}
await walk(skill);
const manifest=JSON.parse(await readFile(join(skill,'assets/manifest.json'),'utf8')),assetRoot=join(skill,'assets/plantilla');
for(const f of manifest.files){const p=resolve(assetRoot,f.path),rel=relative(assetRoot,p);assert.ok(rel&&!rel.startsWith('..'+sep)&&!isAbsolute(rel),'Ruta fuera del paquete');assert.equal(createHash('sha256').update(await readFile(p)).digest('hex'),f.sha256,'Hash distinto: '+f.path);}
assert.equal(files.filter(p=>p.startsWith(assetRoot+sep)).length,manifest.files.length,'Archivos no inventariados');
for(const p of files.filter(p=>p.endsWith('.md')&&!p.startsWith(assetRoot+sep))){const content=await readFile(p,'utf8');for(const match of content.matchAll(/\]\(([^)]+)\)/g)){if(/^(?:https?:|#)/.test(match[1]))continue;const url=new URL(match[1],new URL('file:///'+p.replaceAll('\\','/')));await lstat(fileURLToPath(url));}}
const instructions=await readFile(join(skill,'SKILL.md'),'utf8');assert.match(instructions,/^---\r?\nname: plantilla-restaurantes\r?\ndescription: .+\r?\n---/);assert.ok(!instructions.includes('[TODO:'));
console.log(JSON.stringify({skill:'plantilla-restaurantes',archivos:files.length,assetsVerificados:manifest.files.length,datosPrivados:false,referencias:'correctas'}));
