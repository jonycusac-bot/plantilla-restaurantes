import {readFile,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {seed} from '../public/domain.js';
export const CONFIG_FILE='restaurante.config.json';export const TEMPLATE_CONFIG_FILE='plantilla.config.json';export const DEFAULT_PORT=4182;
const DEFAULTS={nombre:'Tu restaurante',eslogan:'COCINA CON PERSONALIDAD',host:'127.0.0.1'};
export async function loadProfile(root){
 let raw={};
 try{raw=JSON.parse(await readFile(join(root,CONFIG_FILE),'utf8'));}catch(e){if(e.code!=='ENOENT')throw new Error(`No se pudo leer ${CONFIG_FILE}: ${e.message}`);}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${CONFIG_FILE} debe contener un objeto JSON.`);
 const nombre=typeof raw.nombre==='string'?raw.nombre.trim():'';
 const eslogan=typeof raw.eslogan==='string'?raw.eslogan.trim():DEFAULTS.eslogan;
 const puerto=Number.isInteger(raw.puerto)&&raw.puerto>=1&&raw.puerto<=65535?raw.puerto:DEFAULT_PORT;
 const host=typeof raw.host==='string'&&raw.host.trim()?raw.host.trim():DEFAULTS.host;
 return {nombre:nombre.slice(0,100)||DEFAULTS.nombre,eslogan:eslogan.slice(0,160),puerto,host};
}
export function seedState(profile){
 const state=seed();state.restaurant.name=profile.nombre;state.restaurant.tagline=profile.eslogan;return state;
}
// Preferencias de la plantilla maestra: dónde se crean los restaurantes y con qué prefijo.
export async function loadTemplateConfig(root){
 let raw={};
 try{raw=JSON.parse(await readFile(join(root,TEMPLATE_CONFIG_FILE),'utf8'));}catch(e){if(e.code!=='ENOENT')throw new Error(`No se pudo leer ${TEMPLATE_CONFIG_FILE}: ${e.message}`);}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${TEMPLATE_CONFIG_FILE} debe contener un objeto JSON.`);
 const carpetaBase=typeof raw.carpetaRestaurantes==='string'&&raw.carpetaRestaurantes.trim()?raw.carpetaRestaurantes.trim():join(root,'restaurantes');
 const prefijo=typeof raw.prefijoCarpeta==='string'?raw.prefijoCarpeta.slice(0,40):'';
 return {carpetaBase,prefijo};
}
export async function saveTemplateConfig(root,{carpetaBase,prefijo}){
 const destino=join(root,TEMPLATE_CONFIG_FILE);
 await writeFile(destino,JSON.stringify({carpetaRestaurantes:carpetaBase,prefijoCarpeta:prefijo},null,2)+'\n');
 return destino;
}
