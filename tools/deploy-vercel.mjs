/**
 * Publica el build de producción en el proyecto `casilda-preview` de Vercel.
 *
 * Se despliega la carpeta compilada (no el repositorio), así que:
 *  - `ng build` borra `dist/` en cada compilación y con ella el enlace `.vercel`
 *    que crea la CLI; aquí se restituye antes de desplegar.
 *  - El `vercel.json` de la raíz no viaja con el build; se copia al directorio
 *    de salida para conservar la reescritura `/(.*) → /index.html` del SPA.
 *
 * Uso: npm run deploy:vercel:preview   (compila y sube una vista previa)
 *      npm run deploy:vercel           (compila y sube a producción)
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT_DIR = join('dist', 'casilda-fnsp', 'browser');

// Identificadores públicos del proyecto de vista previa en Vercel (no son secretos).
const PROJECT_LINK = {
  projectId: 'prj_tYXcRGUqidME9eQvGikGOFVXXyeE',
  orgId: 'team_xjY8ldYht2YO5vzizbWUTgx9',
  projectName: 'casilda-preview',
};

mkdirSync(join(OUTPUT_DIR, '.vercel'), { recursive: true });
writeFileSync(
  join(OUTPUT_DIR, '.vercel', 'project.json'),
  `${JSON.stringify(PROJECT_LINK)}\n`,
);

// Solo las reescrituras aplican a un despliegue estático; el resto del
// vercel.json (buildCommand, installCommand…) describe el flujo desde Git.
const { rewrites } = JSON.parse(readFileSync('vercel.json', 'utf8'));
writeFileSync(
  join(OUTPUT_DIR, 'vercel.json'),
  `${JSON.stringify({ rewrites }, null, 2)}\n`,
);

const args = ['deploy', OUTPUT_DIR, '--yes', ...process.argv.slice(2)];
const resultado = spawnSync('vercel', args, { stdio: 'inherit', shell: true });

process.exit(resultado.status ?? 1);
