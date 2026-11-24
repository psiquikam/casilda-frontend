/**
 * Captura las pantallas del manual de Línea Alma (APH y Psicología), con marcadores numerados que
 * señalan dónde actuar en cada pantalla. Adaptado de `capturar-pantallas-spyb.mjs`.
 *
 * Requisitos: servidor de desarrollo corriendo (`npm start`, con los datos
 * simulados de Línea Alma activos: `environment.lineaAlma.mocks`) y Google Chrome instalado. Usa el protocolo de depuración
 * de Chrome (CDP) para iniciar sesión, navegar, diligenciar, marcar y capturar.
 *
 * Uso: node tools/capturar-pantallas-spyb.mjs [http://localhost:4200] [filtro]
 *   `filtro` (opcional): captura solo los archivos cuyo nombre lo contenga.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const salida = path.join(raiz, 'docs', 'manual-linea-alma', 'img');
fs.mkdirSync(salida, { recursive: true });

const BASE = process.argv[2] || 'http://localhost:4200';
const FILTRO = process.argv[3] || '';
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PUERTO = 9334;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'analista', exp: 4102444800 })}.firma`;
const sesion = {
  nombre: 'Laura Estella Pineda Corcho',
  email: 'laura.pineda@udea.edu.co',
  rol: 'Administrador',
  roles: ['ADMIN'],
  authorities: ['ROLE_ADMIN'],
  foto: null,
  token
};

/* ---------- Pasos reutilizables (se ejecutan dentro de la página) ---------- */
const clicTexto = (sel, rx) => `(()=>{const e=[...document.querySelectorAll(${JSON.stringify(sel)})].find(x=>${rx}.test(x.textContent));e&&e.click()})()`;
const elegir = (id, texto) => `__h.elegir(${JSON.stringify(id)}, ${JSON.stringify(texto)})`;
const escribir = (id, v) => `__h.escribir(${JSON.stringify(id)}, ${JSON.stringify(v)})`;
// Todos los pasos de un stepper están en el DOM: se pulsa el botón que se ve, no el primero que coincida.
const boton = (rx) => `(()=>{const e=[...document.querySelectorAll('button, a')].filter(x=>{const r=x.getBoundingClientRect();return r.height>0&&r.width>0&&getComputedStyle(x).visibility!=='hidden'&&x.closest('[aria-hidden=true],[inert]')===null}).find(x=>${rx}.test(x.textContent));e&&e.click()})()`;
const radio = (rx) => `(()=>{const e=[...document.querySelectorAll('mat-radio-button')].find(x=>${rx}.test(x.textContent));e&&(e.querySelector('input')||e).click()})()`;
const paso = (rx) => clicTexto('[role=tab]', rx);

// Registrar nueva atención: recorrido por los cuatro pasos con datos ficticios.
const SOLICITUD = [elegir('nueva-ident-canalIngreso', 'Telefónico'), boton(/^\s*Continuar\s*$/)];
const PERSONA = [
  elegir('nueva-ident-tipoIdentificacion', 'Cédula de ciudadanía'),
  escribir('nueva-ident-numeroIdentificacion', '1000000011'),
  boton(/Consultar/),
  escribir('nueva-car-primerNombre', 'Persona'),
  escribir('nueva-car-primerApellido', 'De Prueba'),
  escribir('nueva-car-telefonoPrincipal', '3001234567'),
  escribir('nueva-sol-motivoConsulta', 'La persona cuenta que desde hace unas semanas se siente muy angustiada y quiere hablar con alguien.')
];
const A_TRIAJE = [...SOLICITUD, ...PERSONA, boton(/Guardar y continuar/)];
const TRIAJE_ALTO = [...A_TRIAJE, radio(/Alto/), boton(/Guardar triaje/)];
const A_REMISIONES = [...TRIAJE_ALTO, boton(/Continuar a remisiones/)];

// Psicología: tomar la novedad y abrir el primer contacto efectivo (6 pasos).
const CONTACTO = [boton(/Tomar esta novedad/), boton(/La persona contestó/)];
const CONSENTIR = [`document.querySelector('app-consentimiento-informado mat-checkbox input')?.click()`];
const HASTA_AGRESOR = [
  boton(/^\s*Siguiente\s*$/), // consentimiento
  escribir('pc-car-telefonoPrincipal', '3001234567'),
  boton(/^\s*Siguiente\s*$/), // caracterización
  radio(/Medio/),
  escribir('pc-val-descripcion', 'La persona refiere angustia y dificultad para dormir desde hace dos semanas.'),
  boton(/^\s*Siguiente\s*$/), // dimensiones
  boton(/^\s*Siguiente\s*$/)  // presunto agresor
];

const R = '/linea-alma';

/* ---------- Lista de capturas ---------- */
// marcas: { n, id | campo | sel | texto(+tag) }
const capturas = [
  {
    archivo: '01-menu.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 1250, sinRecorte: true,
    marcas: [
      { n: 1, sel: '#toggle-alma' },
      { n: 2, texto: /Registrar nueva atención/, tag: 'a' },
      { n: 3, texto: /Remisiones recibidas/, tag: 'a' },
      { n: 4, texto: /Pendientes atención por psicolog/, tag: 'a' },
      { n: 5, texto: /Recontactos/, tag: 'a' },
      { n: 6, texto: /Mi agenda/, tag: 'a' }
    ]
  },
  {
    archivo: '02-solicitud-directa.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 760,
    marcas: [
      { n: 1, sel: 'mat-stepper .mat-horizontal-stepper-header-container' },
      { n: 2, sel: 'fieldset.paso__grupo' },
      { n: 3, id: 'nueva-ident-canalIngreso' },
      { n: 4, texto: /^\s*Continuar\s*$/, tag: 'button' }
    ]
  },
  {
    archivo: '03-solicitud-indirecta.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 1000, completa: true,
    pasos: [radio(/Solicitud indirecta/), elegir('nueva-ident-canalIngreso', 'WhatsApp'), escribir('nueva-sol-solPrimerNombre', 'Juan'), elegir('nueva-sol-solParentesco', 'Madre')],
    marcas: [
      { n: 1, texto: /Solicitud indirecta/, tag: 'mat-radio-button' },
      { n: 2, sel: '#sec-solicitante' },
      { n: 3, id: 'nueva-sol-solPrimerNombre' },
      { n: 4, id: 'nueva-sol-solParentesco' },
      { n: 5, id: 'nueva-sol-solTelefono' }
    ]
  },
  {
    archivo: '04-persona.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 900, completa: true,
    pasos: SOLICITUD,
    marcas: [
      { n: 1, id: 'nueva-ident-tipoIdentificacion' },
      { n: 2, id: 'nueva-ident-numeroIdentificacion' },
      { n: 3, texto: /Consultar/, tag: 'button' },
      { n: 4, id: 'nueva-car-primerNombre' },
      { n: 5, id: 'nueva-car-telefonoPrincipal' }
    ]
  },
  {
    archivo: '05-alerta-seguimiento.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 900, completa: true,
    pasos: [...SOLICITUD, elegir('nueva-ident-tipoIdentificacion', 'Cédula de ciudadanía'), escribir('nueva-ident-numeroIdentificacion', '1000000002'), boton(/Consultar/)],
    marcas: [
      { n: 1, id: 'nueva-ident-numeroIdentificacion' },
      { n: 2, texto: /Consultar/, tag: 'button' },
      { n: 3, sel: 'app-alerta-seguimiento' }
    ]
  },
  {
    archivo: '06-hechos.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 900, completa: true,
    pasos: [...SOLICITUD, ...PERSONA],
    marcas: [
      { n: 1, sel: '#sec-hechos' },
      { n: 2, texto: /Lugar de ocurrencia/, tag: 'legend' },
      { n: 3, id: 'nueva-sol-motivoConsulta' },
      { n: 4, sel: 'app-evidencias-adjuntas' },
      { n: 5, id: 'nueva-aph-atiende' },
      { n: 6, texto: /Guardar y continuar/, tag: 'button' }
    ]
  },
  {
    archivo: '07-triaje.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 900, completa: true,
    pasos: [...A_TRIAJE, radio(/Medio/)],
    marcas: [
      { n: 1, sel: 'mat-radio-group.triaje__opciones' },
      { n: 2, texto: /Peligro inminente para la vida/, tag: 'mat-radio-button' },
      { n: 3, texto: /Guardar triaje/, tag: 'button' },
      { n: 4, id: 'nueva-val-notaAph' }
    ]
  },
  {
    archivo: '08-peligro-inminente.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 900, completa: true,
    pasos: [...A_TRIAJE, radio(/Peligro inminente/), escribir('triaje-justificacion', 'La persona refiere que está en riesgo en este momento y no puede esperar.')],
    marcas: [
      { n: 1, texto: /Peligro inminente para la vida/, tag: 'mat-radio-button' },
      { n: 2, id: 'triaje-justificacion' },
      { n: 3, texto: /Registrar omisión del triaje/, tag: 'button' }
    ]
  },
  {
    archivo: '09-remisiones.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 900, completa: true,
    pasos: A_REMISIONES,
    marcas: [
      { n: 1, sel: 'app-paso-derivacion' },
      { n: 2, sel: 'app-panel-derivaciones' },
      { n: 3, texto: /Agregar remisión interna/, tag: 'button' },
      { n: 4, texto: /Agregar remisión externa/, tag: 'button' }
    ]
  },
  {
    archivo: '10-derivacion-psicologia.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 900, completa: true,
    pasos: [...A_REMISIONES, radio(/Sí, desea/)],
    marcas: [
      { n: 1, texto: /Sí, desea atención psicológica/, tag: 'mat-radio-button' },
      { n: 2, sel: 'app-consentimiento-informado' },
      { n: 3, texto: /Derivar a Psicología/, tag: 'button' }
    ]
  },
  {
    archivo: '11-remision-interna.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 900, completa: true,
    pasos: [...A_REMISIONES, boton(/Agregar remisión interna/)],
    marcas: [
      { n: 1, id: 'der-destino' },
      { n: 2, id: 'der-motivo' },
      { n: 3, texto: /Registrar derivación/, tag: 'button' }
    ]
  },
  {
    archivo: '12-bandeja-remisiones.png', ruta: `${R}/aph/remisiones`, ancho: 1440, alto: 760,
    marcas: [
      { n: 1, sel: '.bandeja__vistas' },
      { n: 2, sel: '.bandeja__filtros' },
      { n: 3, texto: /Tomar remisión/, tag: 'button, a' },
      { n: 4, sel: 'table th:first-child' }
    ]
  },
  {
    archivo: '13-detalle-atencion.png', ruta: `${R}/aph/atenciones/ALMA-2026-000003`, ancho: 1440, alto: 900, completa: true,
    marcas: [
      { n: 1, sel: 'h1' },
      { n: 2, sel: '.detalle__bloque' },
      { n: 3, texto: /Cerrar la atención|Notas de APH/, tag: 'h2' }
    ]
  },
  {
    archivo: '14-bandeja-psicologia.png', ruta: `${R}/psicologia/bandeja`, ancho: 1440, alto: 760,
    marcas: [
      { n: 1, sel: '.bandeja__filtros' },
      { n: 2, sel: 'table th:first-child' },
      { n: 3, texto: /Tomar/, tag: 'button, a' }
    ]
  },
  {
    archivo: '15-novedad-intentos.png', ruta: `${R}/psicologia/novedades/ALMA-2026-000003`, ancho: 1440, alto: 900, completa: true,
    pasos: [boton(/Tomar esta novedad/)],
    marcas: [
      { n: 1, sel: '.nov__toma' },
      { n: 2, sel: '.nov__bloque' },
      { n: 3, texto: /Registrar intento/, tag: 'button' }
    ]
  },
  {
    archivo: '16-datos-persona.png', ruta: `${R}/psicologia/novedades/ALMA-2026-000003`, ancho: 1440, alto: 900, completa: true,
    pasos: [boton(/Tomar esta novedad/)],
    marcas: [
      { n: 1, sel: 'app-datos-persona' },
      { n: 2, texto: /Guardar datos/, tag: 'button' }
    ]
  },
  {
    archivo: '17-recontactos.png', ruta: `${R}/psicologia/recontactos`, ancho: 1440, alto: 900, completa: true,
    marcas: [
      { n: 1, sel: '.rec__lista' },
      { n: 2, sel: '.rec__comparativa' },
      { n: 3, sel: '.rec__form' }
    ]
  },
  {
    archivo: '18-expediente.png', ruta: `${R}/psicologia/casos/CAS-2026-000002`, ancho: 1440, alto: 900, completa: true,
    marcas: [
      { n: 1, sel: 'h1' },
      { n: 2, texto: /Seguimientos/, tag: 'h2' },
      { n: 3, texto: /Registrar seguimiento/, tag: 'button' }
    ]
  },
  {
    archivo: '20-intento.png', ruta: `${R}/psicologia/novedades/ALMA-2026-000003`, ancho: 1440, alto: 900, completa: true,
    pasos: [boton(/Tomar esta novedad/), boton(/Registrar intento 1 de 9/)],
    marcas: [
      { n: 1, sel: '#int-fechaHora' },
      { n: 2, sel: '#int-resultado' },
      { n: 3, sel: '#int-nota' },
      { n: 4, texto: /Guardar intento/, tag: 'button' }
    ]
  },
  {
    archivo: '21-primer-contacto-consentimiento.png', ruta: `${R}/psicologia/novedades/ALMA-2026-000003`, ancho: 1440, alto: 900, completa: true,
    pasos: [boton(/Tomar esta novedad/), boton(/La persona contestó/)],
    marcas: [
      { n: 1, sel: 'mat-stepper .mat-horizontal-stepper-header-container' },
      { n: 2, sel: 'app-consentimiento-informado' },
      { n: 3, texto: /^\s*Siguiente\s*$/, tag: 'button' }
    ]
  },
  {
    archivo: '22-primer-contacto-caracterizacion.png', ruta: `${R}/psicologia/novedades/ALMA-2026-000003`, ancho: 1440, alto: 900, completa: true,
    pasos: [...CONTACTO, ...CONSENTIR, boton(/^\s*Siguiente\s*$/)],
    marcas: [
      { n: 1, sel: 'app-caracterizacion-form' },
      { n: 2, texto: /^\s*Siguiente\s*$/, tag: 'button' }
    ]
  },
  {
    archivo: '23-primer-contacto-valoracion.png', ruta: `${R}/psicologia/novedades/ALMA-2026-000003`, ancho: 1440, alto: 900, completa: true,
    pasos: [...CONTACTO, ...CONSENTIR, boton(/^\s*Siguiente\s*$/), escribir('pc-car-telefonoPrincipal', '3001234567'), boton(/^\s*Siguiente\s*$/)],
    marcas: [
      { n: 1, sel: '.pc__triaje' },
      { n: 2, sel: '#pc-val-nivel' },
      { n: 3, sel: '#pc-val-descripcion' }
    ]
  },
  {
    archivo: '24-primer-contacto-agresor.png', ruta: `${R}/psicologia/novedades/ALMA-2026-000003`, ancho: 1440, alto: 900, completa: true,
    pasos: [...CONTACTO, ...CONSENTIR, ...HASTA_AGRESOR],
    marcas: [
      { n: 1, id: 'pc-agr-primerNombre' },
      { n: 2, id: 'pc-agr-primerApellido' },
      { n: 3, id: 'pc-agr-vinculo' },
      { n: 4, id: 'pc-agr-convivencia' }
    ]
  },
  {
    archivo: '25-primer-contacto-acuerdos.png', ruta: `${R}/psicologia/novedades/ALMA-2026-000003`, ancho: 1440, alto: 900, completa: true,
    pasos: [...CONTACTO, ...CONSENTIR, ...HASTA_AGRESOR, boton(/^\s*Siguiente\s*$/)],
    marcas: [
      { n: 1, sel: '#pc-acu-acuerdos' },
      { n: 2, sel: '#pc-acu-proximoControl' },
      { n: 3, texto: /Guardar y crear el caso|Crear el caso|Guardar/, tag: 'button' }
    ]
  },
  {
    archivo: '26-seguimiento.png', ruta: `${R}/psicologia/casos/CAS-2026-000002`, ancho: 1440, alto: 900, completa: true,
    pasos: [boton(/Registrar seguimiento/)],
    marcas: [
      { n: 1, sel: '#seg-nota' },
      { n: 2, sel: '#seg-valoracionRiesgo' },
      { n: 3, sel: '#seg-proximoControl' },
      { n: 4, texto: /Guardar seguimiento/, tag: 'button' }
    ]
  },
  {
    archivo: '27-cierre-caso.png', ruta: `${R}/psicologia/casos/CAS-2026-000002`, ancho: 1440, alto: 900,
    pasos: [boton(/Cerrar el caso/)],
    marcas: [
      { n: 1, sel: '#cierre-motivo' },
      { n: 2, sel: '#cierre-observacion' },
      { n: 3, texto: /^\s*Cerrar el caso\s*$/, tag: 'button' }
    ]
  },
  {
    archivo: '28-salir-sin-guardar.png', ruta: `${R}/aph/nueva`, ancho: 1440, alto: 900,
    pasos: [...SOLICITUD, clicTexto('a', /Remisiones recibidas/)],
    marcas: [
      { n: 1, texto: /Seguir editando/, tag: 'button' },
      { n: 2, texto: /Salir sin guardar/, tag: 'button' }
    ]
  },
  {
    archivo: '19-agenda.png', ruta: `${R}/psicologia/agenda`, ancho: 1440, alto: 760,
    marcas: [
      { n: 1, sel: '.agenda__filtros' },
      { n: 2, sel: '.agenda__lista' }
    ]
  }
];

/* ---------- Código que corre dentro de la página ---------- */
const AYUDANTES = `
window.__h = {
  esperar: (ms) => new Promise((r) => setTimeout(r, ms)),
  async elegir(id, texto) {
    const el = document.getElementById(id);
    (el.querySelector('.mat-mdc-select-trigger') || el).click();
    await this.esperar(450);
    const op = [...document.querySelectorAll('mat-option')].find((o) => o.textContent.includes(texto));
    if (op) op.click();
    await this.esperar(350);
  },
  escribir(id, valor) {
    const el = document.getElementById(id);
    el.focus(); el.value = valor;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur'));
  },
  buscar(m) {
    if (m.campo || m.id) { const l = document.querySelector('label[for="' + (m.id || 'spyb-' + m.campo) + '"]'); return l && (l.closest('.spyb-campo') || l); }
    if (m.sel) return document.querySelector(m.sel);
    if (m.texto) {
      const rx = new RegExp(m.texto.fuente, m.texto.banderas);
      return [...document.querySelectorAll(m.tag || '*')].filter((e) => rx.test(e.textContent)).sort((a, b) => a.textContent.length - b.textContent.length)[0];
    }
  },
  marcar(marcas) {
    document.getElementById('__marcas')?.remove();
    const capa = document.createElement('div');
    capa.id = '__marcas';
    capa.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000';
    for (const m of marcas) {
      const el = this.buscar(m);
      if (!el) { console.warn('sin elemento para la marca', JSON.stringify(m)); continue; }
      let r = el.getBoundingClientRect();
      if (m.campo || m.id) {
        const ctl = el.querySelector('.mat-mdc-form-field-flex');
        if (ctl) {
          const c = ctl.getBoundingClientRect();
          r = { left: Math.min(r.left, c.left), top: r.top, width: Math.max(r.width, c.width), height: c.bottom - r.top };
        }
      }
      if (!r.width || !r.height) continue;
      const caja = document.createElement('div');
      caja.style.cssText = 'position:fixed;left:' + (r.left - 4) + 'px;top:' + (r.top - 4) + 'px;width:' + (r.width + 8) + 'px;height:' + (r.height + 8) + 'px;border:2px solid #d9480f;border-radius:8px;box-sizing:border-box;background:rgba(217,72,15,.06)';
      const n = document.createElement('div');
      n.textContent = m.n;
      n.style.cssText = 'position:fixed;left:' + (r.left - 18) + 'px;top:' + (r.top - 18) + 'px;width:26px;height:26px;border-radius:50%;background:#d9480f;color:#fff;font:700 14px/26px Inter,Arial,sans-serif;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.35);border:2px solid #fff';
      if (!m.sinCaja) capa.append(caja);
      capa.append(n);
    }
    const contenedor = document.querySelector('mat-dialog-container') || document.body;
    contenedor.append(capa);
    // Si el contenedor tiene transform, «fixed» se mide contra él: se compensa.
    const o = capa.getBoundingClientRect();
    if (o.left || o.top) capa.style.transform = 'translate(' + (-o.left) + 'px,' + (-o.top) + 'px)';
  }
};
`;

/* ---------- Chrome + CDP ---------- */
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PUERTO}`,
  `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'alma-'))}`, 'about:blank'
], { stdio: 'ignore' });

async function conectar() {
  for (let i = 0; i < 40; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json();
      const pag = lista.find((t) => t.type === 'page');
      if (pag) return pag.webSocketDebuggerUrl;
    } catch { /* aún no responde */ }
    await dormir(250);
  }
  throw new Error('No se pudo conectar con Chrome');
}

const ws = new WebSocket(await conectar());
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pendientes = new Map();
// Catálogos de la plataforma (`/maestros/*`): se responden aquí para no depender del backend ni de una sesión real.
const MAESTROS = {
  'tipos-identificacion': [
    { id: 1, codigo: 'CC', nombre: 'Cédula de ciudadanía' }, { id: 2, codigo: 'TI', nombre: 'Tarjeta de identidad' },
    { id: 3, codigo: 'CE', nombre: 'Cédula de extranjería' }, { id: 4, codigo: 'PAS', nombre: 'Pasaporte' }
  ],
  campus: [
    { id: 1, codigo: 'CU', nombre: 'Medellín - Ciudad Universitaria' }, { id: 2, codigo: 'ROB', nombre: 'Robledo' },
    { id: 3, codigo: 'ORI', nombre: 'Seccional Oriente' }, { id: 4, codigo: 'URA', nombre: 'Seccional Urabá' }
  ],
  'vinculos-udea': [
    { id: 1, codigo: 'EST_PRE', nombre: 'Estudiante de pregrado' }, { id: 2, codigo: 'EST_POS', nombre: 'Estudiante de posgrado' },
    { id: 3, codigo: 'DOC', nombre: 'Docente' }, { id: 4, codigo: 'ADM', nombre: 'Empleado administrativo' },
    { id: 5, codigo: 'EGR', nombre: 'Egresado' }
  ]
};
const CORS = [
  { name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Headers', value: '*' },
  { name: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' }
];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pendientes.has(m.id)) { pendientes.get(m.id)(m.result ?? m.error); pendientes.delete(m.id); }
  if (m.method === 'Fetch.requestPaused') {
    const { requestId, request } = m.params;
    const clave = request.url.split('/maestros/')[1]?.split('?')[0];
    const cuerpo = Buffer.from(JSON.stringify(MAESTROS[clave] ?? [])).toString('base64');
    ws.send(JSON.stringify({
      id: ++id, method: 'Fetch.fulfillRequest',
      params: request.method === 'OPTIONS'
        ? { requestId, responseCode: 204, responseHeaders: CORS }
        : { requestId, responseCode: 200, responseHeaders: [...CORS, { name: 'Content-Type', value: 'application/json' }], body: cuerpo }
    }));
  }
};
const cdp = (method, params = {}) => new Promise((res) => { const n = ++id; pendientes.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const evalJs = (expression) => cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });

await cdp('Page.enable');
await cdp('Fetch.enable', { patterns: [{ urlPattern: '*/maestros/*' }] });
await cdp('Page.addScriptToEvaluateOnNewDocument', {
  source: `localStorage.setItem('userSession', ${JSON.stringify(JSON.stringify(sesion))});`
});

const aSerializable = (m) => ({
  ...m,
  texto: m.texto ? { fuente: m.texto.source, banderas: m.texto.flags } : undefined
});

try {
  for (const c of capturas.filter((x) => x.archivo.includes(FILTRO))) {
    await cdp('Emulation.setDeviceMetricsOverride', { width: c.ancho, height: c.alto, deviceScaleFactor: 1, mobile: false });
    // Los borradores locales (`casilda_*` en sessionStorage) no deben pasar de una captura a la siguiente.
    await evalJs('sessionStorage.clear()');
    await cdp('Page.navigate', { url: BASE + c.ruta });
    await dormir(3500);
    await evalJs(AYUDANTES);
    for (const paso of c.pasos ?? []) {
      const r = await evalJs(`(async()=>{ ${paso.startsWith('__h') ? 'await ' : ''}${paso} })()`);
      if (r?.exceptionDetails) console.warn('  paso con error:', paso.slice(0, 60), r.exceptionDetails.exception?.description?.split('\n')[0]);
      await dormir(700);
    }
    await dormir(800);
    if (c.completa) {
      const alto = (await evalJs('Math.max(document.body.scrollHeight, document.querySelector("mat-sidenav-content")?.scrollHeight||0, document.documentElement.scrollHeight)')).result?.value;
      await cdp('Emulation.setDeviceMetricsOverride', { width: c.ancho, height: Math.min(Math.max(alto || c.alto, c.alto), 3400), deviceScaleFactor: 1, mobile: false });
      await dormir(700);
    }
    await evalJs('window.scrollTo(0,0); document.querySelectorAll("mat-sidenav-content, .mat-drawer-content, main").forEach(e=>e.scrollTop=0)');
    await dormir(400);
    if (process.env.DEBUG_DOM) console.log(' DOM:', (await evalJs(`[...document.querySelectorAll('dialog, mat-dialog-container, .cdk-overlay-container, .cdk-overlay-pane')].map(e=>e.tagName+'.'+e.className.toString().slice(0,60)+' open='+e.open+' popover='+e.popover+' z='+getComputedStyle(e).zIndex+' pos='+getComputedStyle(e).position).join(' | ')`)).result?.value);
    if (c.marcas?.length) {
      const rm = await evalJs(`__h.marcar(${JSON.stringify(c.marcas.map(aSerializable))}); document.getElementById('__marcas').children.length + ' elementos; primera: ' + (document.getElementById('__marcas').firstChild?.style.cssText||'')`);
      if (process.env.DEBUG_MARCAS) console.log('  marcas:', rm.result?.value, rm.exceptionDetails?.exception?.description);
      await dormir(200);
      if (process.env.DEBUG_DOM) console.log(' top:', (await evalJs(`(()=>{const e=document.elementFromPoint(430,200);const c=document.getElementById('__marcas');return (e&&e.tagName+'.'+e.className)+' | capa parent='+c.parentElement.className+' rect='+JSON.stringify(c.getBoundingClientRect())+' vis='+getComputedStyle(c).visibility+' disp='+getComputedStyle(c).display+' op='+getComputedStyle(c).opacity})()`)).result?.value);
    }
    // Recorte: por defecto solo el área de contenido (sin menú lateral ni cabecera); en los modales, solo el diálogo.
    let clip;
    const caja = await evalJs(`(()=>{const d=document.querySelector('mat-dialog-container'); if(!d) return null; const r=d.getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}})()`);
    if (caja.result?.value) {
      const { x, y, w, h } = caja.result.value;
      clip = { x: Math.max(0, x - 28), y: Math.max(0, y - 28), width: w + 56, height: h + 56, scale: 1 };
    } else if (!c.sinRecorte) {
      const alto = (await evalJs('window.innerHeight')).result?.value ?? c.alto;
      clip = { x: 262, y: 64, width: c.ancho - 262, height: alto - 64, scale: 1 };
    }
    const r = await cdp('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) });
    fs.writeFileSync(path.join(salida, c.archivo), Buffer.from(r.data, 'base64'));
    console.log(`OK ${c.ruta} -> ${c.archivo}`);
  }
} finally {
  ws.close();
  chrome.kill();
}
process.exit(0);
