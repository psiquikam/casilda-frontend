import os
import re
import json
import base64
import urllib.request
import subprocess
import time
import sys

rootDir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Uso: python tools/compilar-manual-pdf.py [spyb|alma]   (por defecto, spyb)
MODULOS = {
    'spyb': {
        'base': 'manual-usuario-seguridad-personas-y-bienes',
        'titulo': 'Manual de Usuario — Seguridad a Personas y Bienes (SPyB)',
        'pie': 'Universidad de Antioquia · Sistema CASILDA · Módulo Seguridad a Personas y Bienes (SPyB) · Noviembre 2026',
        'diagramas': [
            ('diagrama-01-recepcion.svg', 'Diagrama 1: Flujo de Recepción y Verificación de Medidas'),
            ('diagrama-02-clasificacion.svg', 'Diagrama 2: Clasificación, Análisis y Despacho de Actuaciones'),
            ('diagrama-03-estados.svg', 'Diagrama 3: Ciclo de Vida y Estados del Registro SPyB')
        ]
    },
    'alma': {
        'base': 'manual-usuario-linea-alma-aph',
        'titulo': 'Manual de Usuario — Línea Alma (APH y Psicología)',
        'pie': 'Universidad de Antioquia · Sistema CASILDA · Módulo Línea Alma (APH y Psicología) · Noviembre 2026',
        'diagramas': [
            ('alma-diagrama-01-registro.svg', 'Diagrama 1: De la llegada al registro'),
            ('alma-diagrama-02-triaje-cierre.svg', 'Diagrama 2: Del triaje al cierre'),
            ('alma-diagrama-03-psicologia.svg', 'Diagrama 3: Flujo en Psicología'),
            ('alma-diagrama-04-estados.svg', 'Diagrama 4: Estados de una atención')
        ]
    }
}
modulo = sys.argv[1] if len(sys.argv) > 1 else 'spyb'
if modulo not in MODULOS:
    raise SystemExit('Módulo desconocido: use spyb o alma')
cfg = MODULOS[modulo]
tituloDoc = cfg['titulo']
pieDoc = cfg['pie']

mdPath = os.path.join(rootDir, 'docs', cfg['base'] + '.md')
htmlPath = os.path.join(rootDir, 'docs', cfg['base'] + '.html')
pdfPath = os.path.join(rootDir, 'docs', cfg['base'] + '.pdf')
imgDir = os.path.join(rootDir, 'docs', 'img')

os.makedirs(imgDir, exist_ok=True)

with open(mdPath, 'r', encoding='utf-8') as f:
    mdContent = f.read()

# Extraer diagramas mermaid y obtener SVGs
mermaidPattern = re.compile(r'```mermaid\n(.*?)\n```', re.DOTALL)
diagrams = mermaidPattern.findall(mdContent)

diagramNames = cfg['diagramas']

svgs = {}
for i, d in enumerate(diagrams):
    fileName, title = diagramNames[i]
    filePath = os.path.join(imgDir, fileName)
    print(f'Procesando {fileName}...')
    
    payload = {'code': d, 'mermaid': {'theme': 'default'}}
    b64 = base64.urlsafe_b64encode(json.dumps(payload).encode('utf-8')).decode('ascii')
    url = f'https://mermaid.ink/svg/{b64}'
    
    svgContent = None
    for intento in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=20) as resp:
                svgContent = resp.read().decode('utf-8')
            break
        except Exception as err:
            print(f'  Intento {intento + 1} fallido: {err}')
            time.sleep(4 * (intento + 1))
    if svgContent is None:
        if os.path.exists(filePath):
            print('  Servicio no disponible: se reutiliza el SVG ya generado.')
            with open(filePath, 'r', encoding='utf-8') as f:
                svgContent = f.read()
        else:
            raise SystemExit(f'No se pudo generar {fileName}')

    with open(filePath, 'w', encoding='utf-8') as f:
        f.write(svgContent)
    
    # Inserción en el HTML con contenedor visual estilizado
    svgs[i] = f'''<div class="diagrama-wrapper">
  <div class="diagrama-header">📊 {title.upper()}</div>
  <div class="diagrama-body">
    {svgContent}
  </div>
</div>'''

# Reemplazar los 3 bloques mermaid por los SVGs
index = 0
def replaceMermaid(match):
    global index
    res = svgs.get(index, '')
    index += 1
    return res

mdConDiagramas = mermaidPattern.sub(replaceMermaid, mdContent)

# Guardar un archivo temporal pre-procesado para pasarlo por marked
tempMdPath = os.path.join(rootDir, 'docs', 'manual-temp.md')
with open(tempMdPath, 'w', encoding='utf-8') as f:
    f.write(mdConDiagramas)

# Ejecutar script node que invoca marked con HTML habilitado
nodeScript = f'''
import fs from 'fs';
import {{ marked }} from 'marked';

const content = fs.readFileSync({json.dumps(tempMdPath)}, 'utf8');
marked.setOptions({{ gfm: true, breaks: false }});
const html = marked.parse(content);

const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>{tituloDoc}</title>
  <style>
    @page {{
      size: letter;
      margin: 13mm 13mm 13mm 13mm;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1f2937;
      line-height: 1.5;
      font-size: 12px;
      line-height: 1.42;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }}
    h1 {{
      font-size: 24px;
      color: #1b5e20;
      border-bottom: 2px solid #2e7d32;
      padding-bottom: 6px;
      margin-top: 20px;
    }}
    h2 {{
      font-size: 17px;
      color: #0d47a1;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
      margin-top: 16px;
      page-break-after: avoid;
    }}
    h3 {{
      font-size: 15px;
      color: #1565c0;
      margin-top: 18px;
      page-break-after: avoid;
    }}
    h4 {{
      font-size: 13.5px;
      color: #374151;
      margin-top: 14px;
      page-break-after: avoid;
    }}
    p {{
      margin: 8px 0;
      text-align: justify;
    }}
    blockquote {{
      margin: 14px 0;
      padding: 10px 16px;
      color: #1f2937;
      background-color: #f0fdf4;
      border-left: 4px solid #16a34a;
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid;
    }}
    blockquote p {{
      margin: 4px 0;
    }}
    table {{
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
      font-size: 11px;
    }}
    tr {{
      page-break-inside: avoid;
    }}
    th, td {{
      border: 1px solid #d1d5db;
      padding: 4px 8px;
      text-align: left;
    }}
    th {{
      background-color: #f3f4f6;
      font-weight: 600;
      color: #111827;
    }}
    tr:nth-child(even) {{
      background-color: #f9fafb;
    }}
    code {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      background-color: #f3f4f6;
      padding: 2px 5px;
      border-radius: 4px;
      color: #b91c1c;
    }}
    pre {{
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      overflow-x: auto;
      font-size: 11.5px;
      line-height: 1.45;
      page-break-inside: avoid;
    }}
    .diagrama-wrapper {{
      margin: 10px 0;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #f8fafc;
      overflow: hidden;
      page-break-inside: avoid;
    }}
    .diagrama-header {{
      background: #e2e8f0;
      color: #1e293b;
      font-weight: 600;
      font-size: 11px;
      padding: 6px 14px;
      letter-spacing: 0.5px;
    }}
    .diagrama-body {{
      background: #ffffff;
      padding: 8px;
      text-align: center;
      display: flex;
      justify-content: center;
    }}
    .diagrama-body svg {{
      max-width: 100%;
      max-height: 430px;
      width: auto;
      height: auto !important;
      display: block;
      margin: 0 auto;
    }}
    img {{
      max-width: 100%;
      max-height: 500px;
      object-fit: contain;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
      display: block;
      margin: 8px auto 4px auto;
      page-break-inside: avoid;
    }}
    img[src*="modal"] {{
      max-height: 360px;
    }}
    p:has(img) {{
      page-break-inside: avoid;
      text-align: center;
      margin: 8px 0 2px 0;
    }}
    p:has(img) + p {{
      text-align: center;
      margin-top: 2px;
      margin-bottom: 8px;
    }}
    p:has(img) + p em {{
      font-size: 11px;
      color: #4b5563;
      font-weight: 500;
    }}
    hr {{
      border: none;
      height: 1px;
      background-color: #e5e7eb;
      margin: 14px 0;
    }}
    ul, ol {{
      padding-left: 22px;
      margin: 8px 0;
    }}
    li {{
      margin: 4px 0;
    }}
    .footer {{
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #6b7280;
      text-align: center;
    }}
  </style>
</head>
<body>
  ${{html}}
  <div class="footer">
    {pieDoc}
  </div>
</body>
</html>`;

fs.writeFileSync({json.dumps(htmlPath)}, fullHtml, 'utf8');
'''

tempJsPath = os.path.join(rootDir, 'tools', 'temp-runner.mjs')
with open(tempJsPath, 'w', encoding='utf-8') as f:
    f.write(nodeScript)

subprocess.run(['node', tempJsPath], check=True)
os.remove(tempJsPath)
os.remove(tempMdPath)
print('HTML con diagramas SVG generado en:', htmlPath)

# Generar PDF con Chrome directamente
chromePath = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
chromeArgs = [
    chromePath,
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    f'--print-to-pdf={pdfPath}',
    htmlPath
]

print('Compilando PDF con Google Chrome...')
subprocess.run(chromeArgs, check=True)

if os.path.exists(pdfPath):
    sizeMb = os.path.getsize(pdfPath) / (1024 * 1024)
    print(f'PDF generado con éxito: {pdfPath} ({sizeMb:.2f} MB)')

