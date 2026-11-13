import {randomBytes} from 'node:crypto';import {passwordHash} from '../src/worker.js';
const clave=process.argv[2];
if(!clave||clave.length<8){
 console.error('\nUso: node scripts/secretos.mjs "una-clave-larga"\n');
 console.error('Genera los dos secretos del administrador remoto (PBKDF2-SHA256, 100000 iteraciones, 256 bits).');
 console.error('No reutilices la contraseña local ni algo como 123456: en internet se prueba sola.\n');
 process.exit(1);
}
const salt=randomBytes(20).toString('hex');
const hash=await passwordHash(clave,salt);
console.log(`\nClave elegida: ${clave.length} caracteres (no se guarda en ningún archivo ni se envía)\n`);
console.log(`ADMIN_SALT=${salt}`);
console.log(`ADMIN_HASH=${hash}`);
console.log('\nConfigúralos como secretos del proyecto Pages:');
console.log('  npx wrangler pages secret put ADMIN_SALT --project-name <proyecto>');
console.log('  npx wrangler pages secret put ADMIN_HASH --project-name <proyecto>\n');
console.log('Guarda la clave: la necesitarás para entrar en /admin y para subir fotos.\n');
