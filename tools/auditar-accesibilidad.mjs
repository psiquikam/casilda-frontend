#!/usr/bin/env node
/**
 * Auditoría estática de accesibilidad — Casilda frontend.
 *
 * Cuenta la deuda que el linter no detecta (ver plan_accesibilidad.md, Fase 0.3):
 *   - mat-icon-button sin nombre accesible (H-01)
 *   - <mat-icon> sin aria-hidden dentro de botones con nombre (H-01)
 *   - campos de filtro sin etiqueta programática (H-02)
 *   - `outline: none` sin reemplazo con :focus-visible (H-02)
 *   - rutas sin `title` (H-03)
 *   - font-size < 14 px (H-13)
 *   - usos de la paleta heredada `$purple-sys` / #348F41 (H-14)
 *   - console.error / console.warn (H-12)
 *
 * Uso:
 *   node tools/auditar-accesibilidad.mjs            # informe en consola
 *   node tools/auditar-accesibilidad.mjs --json     # salida JSON (para CI / evidencias)
 *   node tools/auditar-accesibilidad.mjs --strict   # código de salida 1 si hay deuda P0
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(RAIZ, 'src');
const args = new Set(process.argv.slice(2));

function recorrer(dir, filtro, acumulado = []) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) recorrer(ruta, filtro, acumulado);
    else if (filtro(ruta)) acumulado.push(ruta);
  }
  return acumulado;
}

const rel = (ruta) => relative(RAIZ, ruta).split(sep).join('/');
const html = recorrer(SRC, (r) => r.endsWith('.html'));
const scss = recorrer(SRC, (r) => r.endsWith('.scss'));
// main.ts queda fuera: si falla el arranque no hay UI en la que avisar.
const ts = recorrer(SRC, (r) => r.endsWith('.ts') && !r.endsWith('.spec.ts') && !r.endsWith('main.ts'));

/** Extrae cada etiqueta de apertura completa (puede ocupar varias líneas). */
function etiquetasApertura(contenido, nombre) {
  const re = new RegExp(`<${nombre}\\b[^>]*>`, 'gs');
  return [...contenido.matchAll(re)].map((m) => m[0]);
}

// `matTooltip` NO cuenta: Material lo expone como aria-describedby, no como nombre.
const tieneNombre = (tag) =>
  /(?:^|\s)(aria-label|aria-labelledby|\[attr\.aria-label\]|\[attr\.aria-labelledby\]|\[aria-label\])\s*=/.test(tag);

// ---------- H-01: botones de ícono sin nombre accesible ----------
const botonesSinNombre = [];
let botonesTotal = 0;
for (const archivo of html) {
  const contenido = readFileSync(archivo, 'utf8');
  for (const tag of etiquetasApertura(contenido, 'button')) {
    if (!/\bmat-icon-button\b/.test(tag)) continue;
    botonesTotal++;
    if (!tieneNombre(tag)) botonesSinNombre.push({ archivo: rel(archivo), tag: tag.replace(/\s+/g, ' ').slice(0, 90) });
  }
}

// ---------- H-01b: <mat-icon> sin aria-hidden (ni aria-label propio) ----------
const iconosExpuestos = [];
for (const archivo of html) {
  const contenido = readFileSync(archivo, 'utf8');
  for (const tag of etiquetasApertura(contenido, 'mat-icon')) {
    if (/aria-hidden|aria-label|role=/.test(tag)) continue;
    iconosExpuestos.push({ archivo: rel(archivo), tag: tag.replace(/\s+/g, ' ').slice(0, 90) });
  }
}

// ---------- H-02: inputs de filtro sin etiqueta ----------
const filtrosSinEtiqueta = [];
for (const archivo of html) {
  const contenido = readFileSync(archivo, 'utf8');
  for (const tag of etiquetasApertura(contenido, 'input')) {
    const esFiltro = /applyFilter|filtrar|placeholder="(Filtrar|\.\.\.|N°|Buscar)/i.test(tag);
    if (!esFiltro) continue;
    const conId = /\bid=|\[id\]=|\[attr\.id\]=/.test(tag);
    const conNombre = tieneNombre(tag) || /appFiltroColumna|matInput/.test(tag);
    if (!conId && !conNombre) filtrosSinEtiqueta.push({ archivo: rel(archivo), tag: tag.replace(/\s+/g, ' ').slice(0, 90) });
  }
}

// ---------- H-02: outline none sin reemplazo ----------
const outlineSinReemplazo = [];
for (const archivo of scss) {
  const contenido = readFileSync(archivo, 'utf8');
  if (!/outline\s*:\s*(none|0)\b/.test(contenido)) continue;
  if (!/focus-visible/.test(contenido)) outlineSinReemplazo.push(rel(archivo));
}

// ---------- H-03: rutas sin title ----------
const rutas = readFileSync(join(SRC, 'app', 'app.routes.ts'), 'utf8');
const bloques = rutas.split(/\n\s*\{\s*\n/).slice(1);
let rutasConComponente = 0;
const rutasSinTitulo = [];
for (const bloque of bloques) {
  if (!/loadComponent/.test(bloque)) continue;
  rutasConComponente++;
  if (!/\btitle\s*:/.test(bloque)) {
    const path = bloque.match(/path:\s*'([^']*)'/)?.[1] ?? '?';
    rutasSinTitulo.push(path);
  }
}

// ---------- H-13: font-size < 14px ----------
const fuentesPequenas = [];
for (const archivo of scss) {
  const lineas = readFileSync(archivo, 'utf8').split(/\r?\n/);
  lineas.forEach((linea, i) => {
    const m = linea.match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/);
    if (!m || Number(m[1]) >= 14) return;
    // En un ícono, font-size es el tamaño del glifo, no de texto: se excluye.
    const selector = [...lineas.slice(Math.max(0, i - 4), i)].reverse().find((l) => l.includes('{')) ?? '';
    if (/icon/i.test(selector) || /icon/i.test(linea)) return;
    fuentesPequenas.push({ archivo: rel(archivo), valor: `${m[1]}px` });
  });
}

// ---------- H-14: paleta heredada ----------
let paletaHeredada = 0;
const scssConLiterales = new Set();
for (const archivo of scss) {
  if (rel(archivo).endsWith('_tokens.scss')) continue;
  const contenido = readFileSync(archivo, 'utf8');
  paletaHeredada += (contenido.match(/\$purple-sys|#348f41/gi) ?? []).length;
  if (/#[0-9a-f]{3,8}\b/i.test(contenido.replace(/\/\/.*$/gm, ''))) scssConLiterales.add(rel(archivo));
}

// ---------- H-12: console.error / warn ----------
let consolaSilenciosa = 0;
for (const archivo of ts) {
  consolaSilenciosa += (readFileSync(archivo, 'utf8').match(/console\.(error|warn)\(/g) ?? []).length;
}

const resumen = {
  fecha: new Date().toISOString().slice(0, 10),
  'H-01 botones de ícono sin nombre': `${botonesSinNombre.length} de ${botonesTotal}`,
  'H-01 <mat-icon> sin aria-hidden': iconosExpuestos.length,
  'H-02 filtros sin etiqueta': filtrosSinEtiqueta.length,
  'H-02 SCSS con outline:none sin reemplazo': outlineSinReemplazo.length,
  'H-03 rutas sin title': `${rutasSinTitulo.length} de ${rutasConComponente}`,
  'H-12 console.error/warn': consolaSilenciosa,
  'H-13 font-size < 14px': fuentesPequenas.length,
  'H-14 usos de paleta heredada': paletaHeredada,
  'H-14 SCSS con colores literales': `${scssConLiterales.size} de ${scss.length}`
};

if (args.has('--json')) {
  console.log(JSON.stringify({ resumen, detalle: { botonesSinNombre, iconosExpuestos, filtrosSinEtiqueta, outlineSinReemplazo, rutasSinTitulo, fuentesPequenas } }, null, 2));
} else {
  console.log('\nAuditoría estática de accesibilidad — Casilda\n');
  for (const [k, v] of Object.entries(resumen)) console.log(`  ${k.padEnd(44)} ${v}`);
  if (args.has('--detalle')) {
    const agrupar = (lista) => Object.entries(lista.reduce((acc, { archivo }) => ((acc[archivo] = (acc[archivo] ?? 0) + 1), acc), {}))
      .sort((a, b) => b[1] - a[1]);
    console.log('\nBotones sin nombre por archivo:');
    for (const [a, n] of agrupar(botonesSinNombre)) console.log(`  ${n.toString().padStart(3)}  ${a}`);
    console.log('\n<mat-icon> sin aria-hidden por archivo:');
    for (const [a, n] of agrupar(iconosExpuestos)) console.log(`  ${n.toString().padStart(3)}  ${a}`);
    console.log('\nFiltros sin etiqueta por archivo:');
    for (const [a, n] of agrupar(filtrosSinEtiqueta)) console.log(`  ${n.toString().padStart(3)}  ${a}`);
    console.log('\noutline:none sin reemplazo:');
    for (const a of outlineSinReemplazo) console.log(`       ${a}`);
    console.log('\nRutas sin title:', rutasSinTitulo.join(', ') || '—');
    console.log('\nfont-size < 14px por archivo:');
    for (const [a, n] of agrupar(fuentesPequenas)) console.log(`  ${n.toString().padStart(3)}  ${a}`);
  }
  console.log('');
}

if (args.has('--strict')) {
  const deudaP0 = botonesSinNombre.length + filtrosSinEtiqueta.length + outlineSinReemplazo.length + rutasSinTitulo.length;
  if (deudaP0 > 0) {
    console.error(`Deuda P0 pendiente: ${deudaP0} hallazgo(s). Ejecuta con --detalle para verlos.`);
    process.exit(1);
  }
}
