import { FormControl, FormGroup } from '@angular/forms';

import { enteroNoNegativo, finNoAnteriorA, textoConContenido } from './validadores-contenido';

describe('validadores del formulario de contenidos', () => {
  it('textoConContenido rechaza un texto de solo espacios y deja el vacío a required', () => {
    expect(textoConContenido(new FormControl('   '))).toEqual({ textoVacio: true });
    expect(textoConContenido(new FormControl(''))).toBeNull();
    expect(textoConContenido(new FormControl(' Línea Alma '))).toBeNull();
  });

  it('enteroNoNegativo acepta 0 y enteros positivos', () => {
    expect(enteroNoNegativo(new FormControl(0))).toBeNull();
    expect(enteroNoNegativo(new FormControl(12))).toBeNull();
    expect(enteroNoNegativo(new FormControl(null))).toBeNull();
    expect(enteroNoNegativo(new FormControl(-1))).toEqual({ entero: true });
    expect(enteroNoNegativo(new FormControl(1.5))).toEqual({ entero: true });
  });

  describe('finNoAnteriorA()', () => {
    const crearGrupo = (inicio: Date | null, fin: Date | null) => {
      const grupo = new FormGroup({
        inicio: new FormControl<Date | null>(inicio),
        fin: new FormControl<Date | null>(fin, finNoAnteriorA('inicio'))
      });
      // Al construirse, el control aún no conoce a su padre: se revalida ya montado.
      grupo.controls.fin.updateValueAndValidity();
      return grupo;
    };

    it('acepta un fin el mismo día del inicio: se guarda al final de ese día', () => {
      expect(crearGrupo(new Date(2026, 10, 3, 10), new Date(2026, 10, 3, 0)).controls.fin.errors).toBeNull();
    });

    it('rechaza un fin anterior al inicio', () => {
      expect(crearGrupo(new Date(2026, 10, 3), new Date(2026, 10, 2)).controls.fin.errors).toEqual({ finAnterior: true });
    });

    it('no opina si falta alguna de las fechas', () => {
      expect(crearGrupo(null, new Date(2026, 10, 2)).controls.fin.errors).toBeNull();
      expect(crearGrupo(new Date(2026, 10, 3), null).controls.fin.errors).toBeNull();
    });
  });
});
