import { BorradorLocal, PREFIJO_BORRADOR, crearBorrador } from './borrador-local';

/** J-0.4 — el borrador no pierde datos, vive en la sesión y tolera un almacenamiento bloqueado. */
describe('BorradorLocal (Guardar progreso, RF-ALMA-005)', () => {
  interface Datos {
    nota: string;
    nivel: string | null;
  }

  afterEach(() => sessionStorage.clear());

  it('guarda y recupera los datos con la fecha y el paso', () => {
    const borrador = crearBorrador<Datos>('primer-contacto:ALMA-2026-000001');
    const guardado = borrador.guardar({ nota: 'Hola', nivel: null }, 2, new Date('2026-11-06T10:00:00Z'));
    expect(guardado.guardadoEn).toBe('2026-11-06T10:00:00.000Z');
    expect(borrador.leer()).toEqual({ datos: { nota: 'Hola', nivel: null }, guardadoEn: '2026-11-06T10:00:00.000Z', paso: 2 });
    expect(borrador.existe()).toBeTrue();
  });

  it('usa `sessionStorage` con el prefijo `casilda_` para que la Salida rápida lo borre', () => {
    crearBorrador<Datos>('x').guardar({ nota: 'a', nivel: 'ALTO' });
    const clave = `${PREFIJO_BORRADOR}x`;
    expect(clave.startsWith('casilda_')).toBeTrue();
    expect(sessionStorage.getItem(clave)).toContain('"nivel":"ALTO"');
    expect(localStorage.getItem(clave)).toBeNull();
  });

  it('`limpiar` elimina el borrador', () => {
    const borrador = crearBorrador<Datos>('y');
    borrador.guardar({ nota: 'a', nivel: null });
    borrador.limpiar();
    expect(borrador.existe()).toBeFalse();
    expect(sessionStorage.getItem(borrador.claveCompleta)).toBeNull();
  });

  it('descarta un borrador corrupto en vez de romper la pantalla', () => {
    const borrador = crearBorrador<Datos>('z');
    sessionStorage.setItem(borrador.claveCompleta, '{no es json');
    expect(borrador.leer()).toBeNull();
    expect(sessionStorage.getItem(borrador.claveCompleta)).toBeNull();
  });

  it('sin almacenamiento disponible conserva el borrador en memoria durante la sesión del componente', () => {
    const borrador = new BorradorLocal<Datos>('sin-storage', null);
    borrador.guardar({ nota: 'memoria', nivel: null });
    expect(borrador.leer()?.datos.nota).toBe('memoria');
  });

  it('si el almacenamiento lanza (cuota, modo privado) no propaga el error', () => {
    const roto = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      }
    } as unknown as Storage;
    const borrador = new BorradorLocal<Datos>('roto', roto);
    expect(() => borrador.guardar({ nota: 'a', nivel: null })).not.toThrow();
    expect(borrador.leer()?.datos.nota).toBe('a');
    expect(() => borrador.limpiar()).not.toThrow();
  });
});
