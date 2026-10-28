import { IMAGEN_RESPALDO, etiquetaDestino, seccionInfo } from './catalogo-contenidos';
import {
  esEnlaceInterno,
  estaVigente,
  estadoVigencia,
  finDelDia,
  inicioDelDia,
  mismoDia,
  resolverImagenContenido
} from './reglas-contenido';

describe('reglas del gestor de contenidos', () => {
  const ahora = new Date('2026-06-15T12:00:00Z');

  describe('estadoVigencia()', () => {
    it('es vigente si ya empezó y no tiene fin', () => {
      expect(estadoVigencia({ vigenciaInicio: '2026-01-01T00:00:00Z', vigenciaFin: null }, ahora)).toBe('vigente');
    });

    it('es programado si empieza en el futuro', () => {
      expect(estadoVigencia({ vigenciaInicio: '2026-07-01T00:00:00Z' }, ahora)).toBe('programado');
    });

    it('es vencido si el fin ya pasó', () => {
      expect(
        estadoVigencia({ vigenciaInicio: '2026-01-01T00:00:00Z', vigenciaFin: '2026-06-01T00:00:00Z' }, ahora)
      ).toBe('vencido');
    });

    it('incluye los extremos del rango (contrato §4)', () => {
      const exacto = ahora.toISOString();
      expect(estadoVigencia({ vigenciaInicio: exacto, vigenciaFin: exacto }, ahora)).toBe('vigente');
    });

    it('nunca publica algo con fecha de inicio ilegible', () => {
      expect(estadoVigencia({ vigenciaInicio: 'no-es-fecha' }, ahora)).toBe('programado');
      expect(estaVigente({ vigenciaInicio: '' }, ahora)).toBeFalse();
    });
  });

  describe('resolverImagenContenido()', () => {
    const api = 'https://api.ejemplo.edu.co/api-casilda';

    it('resuelve contra la API las imágenes subidas por el gestor', () => {
      expect(resolverImagenContenido('/contenidos/imagenes/a.svg', api)).toBe(`${api}/contenidos/imagenes/a.svg`);
      expect(resolverImagenContenido('/contenidos/imagenes/a.svg', `${api}/`)).toBe(`${api}/contenidos/imagenes/a.svg`);
    });

    it('deja intactas las rutas de assets, las absolutas y las vistas previas locales', () => {
      expect(resolverImagenContenido('assets/linea_alma.svg', api)).toBe('assets/linea_alma.svg');
      expect(resolverImagenContenido('https://cdn.udea.edu.co/x.png', api)).toBe('https://cdn.udea.edu.co/x.png');
      expect(resolverImagenContenido('blob:http://localhost/123', api)).toBe('blob:http://localhost/123');
    });

    it('usa el respaldo sin imagen o con una ruta no reconocida', () => {
      expect(resolverImagenContenido(null, api)).toBe(IMAGEN_RESPALDO);
      expect(resolverImagenContenido('   ', api)).toBe(IMAGEN_RESPALDO);
      expect(resolverImagenContenido('//otro-dominio.com/x.png', api)).toBe(IMAGEN_RESPALDO);
      expect(resolverImagenContenido('javascript:alert(1)', api)).toBe(IMAGEN_RESPALDO);
    });
  });

  describe('esEnlaceInterno()', () => {
    it('acepta rutas internas de la SPA', () => {
      expect(esEnlaceInterno('/formulario-anonimo')).toBeTrue();
      expect(esEnlaceInterno('/home')).toBeTrue();
    });

    it('rechaza vacíos, URLs externas y rutas relativas al protocolo', () => {
      for (const enlace of [null, undefined, '', 'https://sitio.com', '//sitio.com', 'home', '/con espacio']) {
        expect(esEnlaceInterno(enlace)).withContext(String(enlace)).toBeFalse();
      }
    });
  });

  describe('fechas por día', () => {
    const fecha = new Date(2026, 10, 30, 15, 45);

    it('el inicio es la medianoche y el fin el último instante del día local', () => {
      expect(inicioDelDia(fecha)).toEqual(new Date(2026, 10, 30, 0, 0, 0, 0));
      expect(finDelDia(fecha)).toEqual(new Date(2026, 10, 30, 23, 59, 59, 999));
    });

    it('compara por día calendario, sin importar la hora', () => {
      expect(mismoDia(fecha, new Date(2026, 10, 30, 1, 0))).toBeTrue();
      expect(mismoDia(fecha, new Date(2026, 11, 1, 0, 0))).toBeFalse();
    });
  });

  describe('catálogo', () => {
    it('solo reconoce las dos secciones del contrato', () => {
      expect(seccionInfo('acciones')?.titulo).toBe('Opciones de atención y gestión');
      expect(seccionInfo('informacion')?.titulo).toBe('Información de interés general');
      expect(seccionInfo('Acciones')).toBeUndefined();
    });

    it('nombra los destinos conocidos y conserva visible una ruta fuera del catálogo', () => {
      expect(etiquetaDestino('/formulario-anonimo')).toBe('Reporte anónimo de VBG');
      expect(etiquetaDestino(null)).toBe('Ninguno: tarjeta informativa');
      expect(etiquetaDestino('/ruta-vieja')).toBe('Otra ruta: /ruta-vieja');
    });
  });
});
