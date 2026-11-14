import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NombreCatalogo } from '../../types/alma.types';

/**
 * Definición **única** de las variables de caracterización de Línea Alma (RF-ALMA-006, Q5).
 *
 * La lista oficial de variables homologadas con Equipo de Atención aún no existe (pendiente Q5),
 * así que hoy se cubren los campos de `persona` del modelo de datos. Para extenderla basta con
 * añadir una fila aquí: el formulario, el DTO de guardado y el contrato se derivan de este
 * archivo, y Psicología (J-1.4) consume el mismo componente (frontera F4).
 */
export interface CampoCaracterizacion {
  /** Nombre del control y del campo en `persona` del DTO. */
  readonly control: 'nombres' | 'apellidos' | 'telefonoPrincipal' | 'correoPersonal' | 'ciudad' | 'estrato';
  readonly etiqueta: string;
  readonly tipo: 'texto' | 'telefono' | 'correo' | 'catalogo';
  readonly catalogo?: NombreCatalogo;
  /** Ayuda bajo el campo, en `mat-hint` (no en `placeholder`). */
  readonly ayuda?: string;
  readonly maxLength?: number;
  readonly obligatorio: boolean;
}

export const CAMPOS_CARACTERIZACION: readonly CampoCaracterizacion[] = [
  { control: 'nombres', etiqueta: 'Nombres', tipo: 'texto', maxLength: 100, obligatorio: false, ayuda: 'Si la persona prefiere no darlo, puede dejarlo vacío.' },
  { control: 'apellidos', etiqueta: 'Apellidos', tipo: 'texto', maxLength: 100, obligatorio: false },
  { control: 'telefonoPrincipal', etiqueta: 'Teléfono principal', tipo: 'telefono', maxLength: 15, obligatorio: false, ayuda: 'Solo números, con indicativo si no es de Colombia.' },
  { control: 'correoPersonal', etiqueta: 'Correo personal', tipo: 'correo', maxLength: 150, obligatorio: false },
  { control: 'ciudad', etiqueta: 'Ciudad de residencia', tipo: 'texto', maxLength: 80, obligatorio: false },
  { control: 'estrato', etiqueta: 'Estrato', tipo: 'catalogo', catalogo: 'estratos', obligatorio: false }
];

const PATRON_TELEFONO = /^\+?\d{7,15}$/;

function validadoresDe(campo: CampoCaracterizacion): ValidatorFn[] {
  const validadores: ValidatorFn[] = [];
  if (campo.obligatorio) validadores.push(Validators.required);
  if (campo.maxLength) validadores.push(Validators.maxLength(campo.maxLength));
  if (campo.tipo === 'correo') validadores.push(Validators.email);
  if (campo.tipo === 'telefono') validadores.push(Validators.pattern(PATRON_TELEFONO));
  return validadores;
}

export type GrupoCaracterizacion = FormGroup<Record<CampoCaracterizacion['control'], FormControl<string>>>;

/** Crea el `FormGroup` de la caracterización a partir de la definición. */
export function crearGrupoCaracterizacion(): GrupoCaracterizacion {
  const controles = Object.fromEntries(
    CAMPOS_CARACTERIZACION.map((campo) => [
      campo.control,
      new FormControl('', { nonNullable: true, validators: validadoresDe(campo) })
    ])
  ) as Record<CampoCaracterizacion['control'], FormControl<string>>;
  return new FormGroup(controles);
}
