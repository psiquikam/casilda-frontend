/**
 * Captura las pantallas del manual de Seguridad a personas y bienes (SPyB),
 * con marcadores numerados que señalan dónde actuar en cada pantalla.
 *
 * Requisitos: servidor de desarrollo corriendo (`npm start`, con los datos
 * simulados activos) y Google Chrome instalado. Usa el protocolo de depuración
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
const salida = path.join(raiz, 'docs', 'manual-seguridad-personas-bienes', 'img');
fs.mkdirSync(salida, { recursive: true });

const BASE = process.argv[2] || 'http://localhost:4200';
const FILTRO = process.argv[3] || '';
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PUERTO = 9333;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'analista', exp: 4102444800 })}.firma`;
const sesion = {
  nombre: 'Laura Estella Pineda Corcho',
  email: 'laura.pineda@udea.edu.co',
  rol: 'Administrador',
  roles: ['ADMIN', 'SPB_ANALISTA', 'SPB_CENTRAL', 'SPB_COORDINACION', 'SPB_VIGILANTE'],
  authorities: ['ROLE_ADMIN', 'ROLE_SPB_ANALISTA', 'ROLE_SPB_CENTRAL', 'ROLE_SPB_COORDINACION', 'ROLE_SPB_VIGILANTE'],
  foto: null,
  token
};

/* ---------- Pasos reutilizables (se ejecutan dentro de la página) ---------- */
const clicTexto = (sel, rx) => `(()=>{const e=[...document.querySelectorAll(${JSON.stringify(sel)})].find(x=>${rx}.test(x.textContent));e&&e.click()})()`;
const pestana = (rx) => clicTexto('[role=tab]', rx);
const menuFila = () => `document.querySelector('button[aria-label="Más opciones de gestión"]')?.click()`;
const opcionMenu = (rx) => clicTexto('[role=menuitem]', rx);
const elegir = (id, texto) => `__h.elegir(${JSON.stringify(id)}, ${JSON.stringify(texto)})`;
const escribir = (id, v) => `__h.escribir(${JSON.stringify(id)}, ${JSON.stringify(v)})`;

const ABRIR_MODAL = (rx) => [menuFila(), opcionMenu(rx)];

const diligenciarCentral = [
  pestana(/Registrar recepción/i),
  elegir('spyb-canalRecepcionCodigo', 'Línea de seguridad'),
  elegir('spyb-tipoRegistroCodigo', 'Novedad de seguridad'),
  elegir('spyb-campusId', 'Ciudad Universitaria'),
  escribir('spyb-lugarHechos', 'Bloque 22, pasillo del segundo piso'),
  elegir('spyb-rolPersonaCodigo', 'Víctima'),
  elegir('spyb-tipoIdentificacionId', 'Cédula de ciudadanía'),
  escribir('spyb-numeroDocumento', '1035987456'),
  escribir('spyb-primerNombre', 'Ana'),
  escribir('spyb-segundoNombre', 'María'),
  escribir('spyb-primerApellido', 'Gómez'),
  escribir('spyb-segundoApellido', 'Restrepo'),
  escribir('spyb-telefono', '3001234567'),
  elegir('spyb-vinculoUdeAId', 'Estudiante de pregrado'),
  escribir('spyb-descripcionHechos', 'La persona informa que fue seguida por un sujeto desde la biblioteca hasta el bloque 22.')
];

const diligenciarSolicitud = [
  `document.querySelector('#acomp-tipoReporte input[value="directa"]')?.click()`,
  `document.querySelector('#acomp-medioSolicitud input[value="virtual"]')?.click()`,
  `document.querySelector('#acomp-canalVirtual input[value="WHATSAPP"]')?.click()`,
  escribir('acomp-contactoVirtualTelefono', '3001234567')
];

/* ---------- Lista de capturas ---------- */
// marcas: { n, campo | sel | texto(+tag) }
const capturas = [
  {
    archivo: '01-menu-spyb.png', ruta: '/seguridad/bandeja', ancho: 1440, alto: 1250, sinRecorte: true,
    marcas: [
      { n: 1, sel: '#toggle-seguridad' },
      { n: 2, texto: /Bandeja del analista/, tag: 'a' },
      { n: 3, texto: /Central de monitoreo/, tag: 'a' },
      { n: 4, texto: /Registro de solicitud/, tag: 'a' },
      { n: 5, texto: /Reporte de vigilancia/, tag: 'a' },
      { n: 6, texto: /Indicadores SPyB/, tag: 'a' }
    ]
  },
  {
    archivo: '02-central-consulta.png', ruta: '/seguridad/central', ancho: 1440, alto: 700,
    marcas: [
      { n: 1, sel: '[role=tablist]' },
      { n: 2, campo: 'docConsulta' },
      { n: 3, texto: /Consultar medidas/, tag: 'button' }
    ]
  },
  {
    archivo: '03-central-alerta.png', ruta: '/seguridad/central', ancho: 1440, alto: 900,
    pasos: [escribir('spyb-docConsulta', '1035987456'), clicTexto('button', '/Consultar medidas/')],
    marcas: [
      { n: 1, sel: '.medida-activa-box .alerta-header' },
      { n: 2, sel: '.medida-header' },
      { n: 3, sel: '.medida-condiciones' },
      { n: 4, texto: /Emitir orden de acompañamiento inmediata/, tag: 'button' }
    ]
  },
  {
    archivo: '04-central-recepcion.png', ruta: '/seguridad/central', ancho: 1440, alto: 900, completa: true,
    pasos: diligenciarCentral,
    marcas: [
      { n: 1, campo: 'canalRecepcionCodigo' },
      { n: 2, campo: 'lugarHechos' },
      { n: 3, campo: 'rolPersonaCodigo' },
      { n: 4, campo: 'numeroDocumento' },
      { n: 5, campo: 'primerNombre' },
      { n: 6, campo: 'descripcionHechos' }
    ]
  },
  {
    archivo: '05-central-consentimiento.png', ruta: '/seguridad/central', ancho: 1440, alto: 900, completa: true,
    pasos: [...diligenciarCentral, `document.querySelectorAll('mat-slide-toggle button')[0]?.click()`, `document.querySelectorAll('mat-slide-toggle button')[1]?.click()`],
    marcas: [
      { n: 1, sel: '.consentimiento-box' },
      { n: 2, texto: /Radicar actuación en seguridad/, tag: 'button' }
    ]
  },
  {
    archivo: '06-central-exito.png', ruta: '/seguridad/central', ancho: 1440, alto: 900,
    pasos: [...diligenciarCentral, `document.querySelectorAll('mat-slide-toggle button')[0]?.click()`, `document.querySelectorAll('mat-slide-toggle button')[1]?.click()`, clicTexto('button', '/Radicar actuación en seguridad/')],
    marcas: [{ n: 1, sel: '.exito-banner' }]
  },
  {
    archivo: '07-reporte-vigilancia.png', ruta: '/seguridad/reportar', ancho: 1440, alto: 900, completa: true,
    marcas: [
      { n: 1, campo: 'cedulaSupervisor' },
      { n: 2, campo: 'campusId' },
      { n: 3, campo: 'rolPersonaCodigo' },
      { n: 4, campo: 'descripcionHechos' },
      { n: 5, texto: /Enviar reporte/, tag: 'button' }
    ]
  },
  {
    archivo: '08-ejecutar-orden.png', ruta: '/seguridad/orden/token-orden-demo-001', ancho: 1200, alto: 900, completa: true,
    marcas: [
      { n: 1, sel: 'mat-card' },
      { n: 2, texto: /1\. Vigilante responsable/, tag: 'div' },
      { n: 3, texto: /2\. Horarios y trayecto/, tag: 'div' },
      { n: 4, texto: /Diligenciamiento de informe/, tag: 'mat-card-title' }
    ]
  },
  {
    archivo: '09-bandeja.png', ruta: '/seguridad/bandeja', ancho: 1440, alto: 700,
    marcas: [
      { n: 1, texto: /Tablero de indicadores/, tag: 'a' },
      { n: 2, texto: /Registrar novedad/, tag: 'a' },
      { n: 3, sel: '[role=tablist]' },
      { n: 4, sel: 'table th:first-child' },
      { n: 5, sel: 'a[aria-label="Ver ficha y auditoría"]' },
      { n: 6, sel: 'button[aria-label="Más opciones de gestión"]' }
    ]
  },
  {
    archivo: '10-bandeja-menu.png', ruta: '/seguridad/bandeja', ancho: 1440, alto: 700,
    pasos: [menuFila()],
    marcas: [
      { n: 1, texto: /Vincular a caso/, tag: '[role=menuitem]', sinCaja: true },
      { n: 2, texto: /Emitir orden/, tag: '[role=menuitem]', sinCaja: true },
      { n: 3, texto: /Solicitar grabación/, tag: '[role=menuitem]', sinCaja: true },
      { n: 4, texto: /Remitir/, tag: '[role=menuitem]', sinCaja: true },
      { n: 5, texto: /Solicitar subsanación/, tag: '[role=menuitem]', sinCaja: true },
      { n: 6, texto: /Cerrar como actuación/, tag: '[role=menuitem]', sinCaja: true }
    ]
  },
  {
    archivo: '13-bandeja-acompanamientos.png', ruta: '/seguridad/bandeja', ancho: 1440, alto: 700,
    pasos: [pestana(/Acompañamientos/i)],
    marcas: [
      { n: 1, texto: /Emitir nueva orden/, tag: 'button' },
      { n: 2, sel: 'button[aria-label^="Copiar enlace"]' }
    ]
  },
  {
    archivo: '14-bandeja-camaras.png', ruta: '/seguridad/bandeja', ancho: 1440, alto: 700,
    pasos: [pestana(/Cámaras/i)],
    marcas: [{ n: 1, texto: /Nueva solicitud de extracción/, tag: 'button' }]
  },
  {
    archivo: '17-modal-vincular.png', ruta: '/seguridad/bandeja', ancho: 1440, alto: 1150,
    pasos: ABRIR_MODAL(/Vincular a caso/i),
    marcas: [
      { n: 1, sel: 'mat-dialog-content p:first-child' },
      { n: 2, texto: /CAS-2026-0012/, tag: 'strong, div, span' },
      { n: 3, campo: 'idCaso' },
      { n: 4, campo: 'criterioJustificacion' },
      { n: 5, texto: /Confirmar vinculación/, tag: 'button' }
    ]
  },
  {
    archivo: '18-modal-subsanacion.png', ruta: '/seguridad/bandeja', ancho: 1440, alto: 1150,
    pasos: ABRIR_MODAL(/Solicitar subsanación/i),
    marcas: [
      { n: 1, campo: 'motivoSubsanacion' },
      { n: 2, texto: /Enviar solicitud de subsanación/, tag: 'button' }
    ]
  },
  {
    archivo: '19-modal-orden.png', ruta: '/seguridad/bandeja', ancho: 1440, alto: 1150,
    pasos: ABRIR_MODAL(/Emitir orden/i),
    marcas: [
      { n: 1, campo: 'prioridad' },
      { n: 2, campo: 'fechaProgramada' },
      { n: 3, campo: 'lugarOrigen' },
      { n: 4, campo: 'personaAcompanada' },
      { n: 5, campo: 'condicionesOperativas' },
      { n: 6, texto: /Generar orden y token/, tag: 'button' }
    ]
  },
  {
    archivo: '20-modal-camara.png', ruta: '/seguridad/bandeja', ancho: 1440, alto: 1150,
    pasos: ABRIR_MODAL(/Solicitar grabación/i),
    marcas: [
      { n: 1, campo: 'ubicacionCamara' },
      { n: 2, campo: 'fechaHechos' },
      { n: 3, campo: 'horaInicioFranja' },
      { n: 4, campo: 'motivoSolicitud' },
      { n: 5, texto: /Radicar solicitud/, tag: 'button' }
    ]
  },
  {
    archivo: '21-modal-remision.png', ruta: '/seguridad/bandeja', ancho: 1440, alto: 1150,
    pasos: ABRIR_MODAL(/Remitir/i),
    marcas: [
      { n: 1, campo: 'destino' },
      { n: 2, campo: 'motivo' },
      { n: 3, texto: /Emitir remisión/, tag: 'button' }
    ]
  },
  {
    archivo: '22-detalle.png', ruta: '/seguridad/detalle/1', ancho: 1440, alto: 900, completa: true,
    marcas: [
      { n: 1, sel: '.titulo-detalle' },
      { n: 2, texto: /Vincular caso/, tag: 'button' },
      { n: 3, texto: /Orden acompañamiento/, tag: 'button' },
      { n: 4, texto: /Descripción de los hechos/, tag: 'h3' },
      { n: 5, texto: /Persona atendida/, tag: 'h3' }
    ]
  },
  {
    archivo: '23-indicadores.png', ruta: '/seguridad/indicadores', ancho: 1440, alto: 900, completa: true,
    marcas: [
      { n: 1, texto: /Distribución por tipo de registro/, tag: 'mat-card-title' },
      { n: 2, texto: /Canal de recepción/, tag: 'mat-card-title' },
      { n: 3, texto: /Trazabilidad de la regla/, tag: 'mat-card-title' }
    ]
  },
  {
    archivo: '24-registro-canal.png', ruta: '/seguridad/registro-solicitud', ancho: 1440, alto: 880,
    pasos: diligenciarSolicitud,
    marcas: [
      { n: 1, sel: '#acomp-tipoReporte' },
      { n: 2, sel: '#acomp-medioSolicitud' },
      { n: 3, sel: '#acomp-canalVirtual' },
      { n: 4, sel: 'mat-form-field:has(#acomp-contactoVirtualCorreo)' },
      { n: 5, sel: 'mat-form-field:has(#acomp-contactoVirtualTelefono)' }
    ]
  },
  {
    archivo: '25-registro-formulario.png', ruta: '/seguridad/registro-solicitud', ancho: 1440, alto: 1950,
    pasos: diligenciarSolicitud,
    marcas: [
      { n: 1, sel: 'mat-form-field:has(#acomp-numeroDocumento)' },
      { n: 2, sel: '.contacto-dual-grid' },
      { n: 3, sel: '.description-section' },
      { n: 4, sel: '.victimario-card-section h3' },
      { n: 5, sel: '.evidencias-card-section .upload-zone' },
      { n: 6, texto: /Enviar solicitud/, tag: 'button' }
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
    if (m.campo) { const l = document.querySelector('label[for="spyb-' + m.campo + '"]'); return l && (l.closest('.spyb-campo') || l); }
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
      if (m.campo) {
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
  `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'spyb-'))}`, 'about:blank'
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
