import {randomBytes} from 'node:crypto';import {exec} from 'node:child_process';import {promisify} from 'node:util';
import {passwordHash} from '../src/worker.js';
const ejecutar=promisify(exec);
const args=process.argv.slice(2);
const simular=args.includes('--simular');
const [clave,proyecto]=args.filter(a=>!a.startsWith('--'));

if(!clave||!proyecto){
 console.error('\nUso: npm run clave-nube -- "nueva-clave" nombre-del-proyecto [--simular]\n');
 console.error('Ejemplo: npm run clave-nube -- "clave-elegida-por-el-propietario" nombre-del-proyecto');
 console.error('Con --simular solo muestra los valores, sin tocar Cloudflare.\n');
 process.exit(1);
}
if(clave.length<8){
 console.error('\nLa clave debe tener al menos 8 caracteres. Para un cliente real, usa 16 o más.\n');
 process.exit(1);
}

const salt=randomBytes(20).toString('hex');
const hash=await passwordHash(clave,salt);
console.log(`\nProyecto: ${proyecto} · clave de ${clave.length} caracteres`);
if(simular){
 console.log('ADMIN_SALT =',salt);
 console.log('ADMIN_HASH =',hash);
 console.log('\n(--simular: no se ha tocado Cloudflare)\n');
 process.exit(0);
}
for(const [nombre,valor] of [['ADMIN_SALT',salt],['ADMIN_HASH',hash]]){
 try{
  const {stdout,stderr}=await ejecutar(`npx --yes wrangler@latest pages secret put ${nombre} --project-name ${proyecto}`,{input:valor,timeout:120000});
  if(/Success/i.test(stdout+stderr))console.log(`  ${nombre}: actualizado`);
  else console.log(`  ${nombre}: respuesta inesperada -> ${(stdout+stderr).slice(0,200)}`);
 }catch(e){
  console.error(`  ${nombre}: fallo -> ${((e.stdout||'')+(e.stderr||'')).slice(0,300)}`);
  process.exit(1);
 }
}
console.log('\nListo. Comprueba que entras en /admin con la clave nueva antes de entregar el proyecto.\n');
