import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { REGEX_LETRAS, REGEX_TELEFONO, noSoloEspacios } from '../../../../seguridad-personas-bienes/shared/spyb-validadores';
import { PersonaAtencionDto } from '../../types/alma-dto';
import { NombreCatalogo } from '../../types/alma.types';

/**
 * Definición **única** de las variables de caracterización de Línea Alma (RF-ALMA-006, Q5).
 *
 * La lista oficial de variables homologadas con Equipo de Atención aún no existe (pendiente Q5),
 * así que hoy se cubren los campos de `persona` del modelo de datos. Para extenderla basta con
 * añadir una fila aquí: el formulario, el DTO de guardado y el contrato se derivan de este
 * archivo, y Psicología (J-1.4) consume el mismo componente (frontera F4).
 */
export type ControlCaracterizacion =
  | 'primerNombre'
  | 'segundoNombre'
  | 'primerApellido'
  | 'segundoApellido'
  | 'fechaNacimiento'
  | 'identidadGenero'
  | 'vinculoUniversidad'
  | 'telefonoPrincipal'
  | 'correoPersonal'
  | 'ciudad'
  | 'estrato';

export interface CampoCaracterizacion {
  /** Nombre del control y del campo en `persona` del DTO. */
  readonly control: ControlCaracterizacion;
  readonly etiqueta: string;
  readonly tipo: 'texto' | 'nombre' | 'telefono' | 'correo' | 'catalogo' | 'fecha';
  readonly catalogo?: NombreCatalogo;
  /** Ayuda del campo: va en el tooltip «?» de la etiqueta (no en `placeholder`). */
  readonly ayuda?: string;
  /** Ejemplo que se ve dentro del campo vacío (como en Seguridad a personas y bienes). */
  readonly placeholder?: string;
  readonly maxLength?: number;
  readonly obligatorio: boolean;
}

/** Campos de la caracterización que el backend real aún no guarda (ver `environment.lineaAlma.extensiones`). */
export const CAMPOS_SIN_BACKEND: readonly ControlCaracterizacion[] = ['fechaNacimiento', 'identidadGenero', 'vinculoUniversidad'];

export const CAMPOS_CARACTERIZACION: readonly CampoCaracterizacion[] = [
  { control: 'primerNombre', etiqueta: 'Primer nombre', tipo: 'nombre', maxLength: 60, obligatorio: false, placeholder: 'Ej: Juan' },
  { control: 'segundoNombre', etiqueta: 'Segundo nombre', tipo: 'nombre', maxLength: 60, obligatorio: false, placeholder: 'Ej: Carlos' },
  { control: 'primerApellido', etiqueta: 'Primer apellido', tipo: 'nombre', maxLength: 60, obligatorio: false, placeholder: 'Ej: Pérez' },
  { control: 'segundoApellido', etiqueta: 'Segundo apellido', tipo: 'nombre', maxLength: 60, obligatorio: false, placeholder: 'Ej: Gómez' },
  { control: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha', obligatorio: false },
  { control: 'identidadGenero', etiqueta: 'Identidad de género', tipo: 'catalogo', catalogo: 'identidades-genero', obligatorio: false, ayuda: 'Como la persona se identifica. Es opcional.' },
  { control: 'vinculoUniversidad', etiqueta: 'Vínculo con la universidad', tipo: 'catalogo', catalogo: 'vinculos-udea', obligatorio: false, ayuda: 'Relación de la persona con la Universidad de Antioquia.' },
  { control: 'telefonoPrincipal', etiqueta: 'Celular o teléfono', tipo: 'telefono', maxLength: 12, obligatorio: true, placeholder: 'Ej: 3001234567', ayuda: 'Obligatorio: es el medio para que Psicología se comunique. Solo números, de 7 a 12 dígitos.' },
  { control: 'correoPersonal', etiqueta: 'Correo personal', tipo: 'correo', maxLength: 150, obligatorio: false, placeholder: 'Ej: nombre@correo.com' },
  { control: 'ciudad', etiqueta: 'Ciudad de residencia', tipo: 'texto', maxLength: 80, obligatorio: false, placeholder: 'Ej: Medellín' },
  { control: 'estrato', etiqueta: 'Estrato', tipo: 'catalogo', catalogo: 'estratos', obligatorio: false, ayuda: 'Estrato socioeconómico de la vivienda, de 1 a 6.' }
];

/** Une primer y segundo nombre (o apellido) en el texto que guarda el contrato: «Ana María». */
export function unirNombre(primero: string, segundo: string): string | null {
  const texto = [primero, segundo].map((t) => t.trim()).filter(Boolean).join(' ');
  return texto || null;
}

/** Camino inverso: separa el texto del contrato en primero y segundo. Unidos dan el mismo texto. */
export function separarNombre(texto: string | null | undefined): { primero: string; segundo: string } {
  const limpio = (texto ?? '').trim().replace(/\s+/g, ' ');
  const corte = limpio.indexOf(' ');
  return corte < 0 ? { primero: limpio, segundo: '' } : { primero: limpio.slice(0, corte), segundo: limpio.slice(corte + 1) };
}


/** La fecha de nacimiento no puede ser futura ni anterior a 1900. */
export function fechaNacimientoValida(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) return null;
  const fecha = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(fecha.getTime()) || fecha.getFullYear() < 1900) return { fechaInvalida: true };
  return fecha.getTime() > Date.now() ? { fechaFutura: true } : null;
}

function validadoresDe(campo: CampoCaracterizacion): ValidatorFn[] {
  const validadores: ValidatorFn[] = [];
  if (campo.obligatorio) validadores.push(Validators.required, noSoloEspacios);
  if (campo.tipo === 'nombre') validadores.push(Validators.pattern(REGEX_LETRAS));
  if (campo.maxLength) validadores.push(Validators.maxLength(campo.maxLength));
  if (campo.tipo === 'correo') validadores.push(Validators.email);
  if (campo.tipo === 'telefono') validadores.push(Validators.pattern(REGEX_TELEFONO));
  if (campo.tipo === 'fecha') validadores.push(fechaNacimientoValida);
  return validadores;
}

export type GrupoCaracterizacion = FormGroup<Record<ControlCaracterizacion, FormControl<string>>>;

/** Crea el `FormGroup` de la caracterización a partir de la definición. */
export function crearGrupoCaracterizacion(): GrupoCaracterizacion {
  const controles = Object.fromEntries(
    CAMPOS_CARACTERIZACION.map((campo) => [
      campo.control,
      new FormControl('', { nonNullable: true, validators: validadoresDe(campo) })
    ])
  ) as Record<ControlCaracterizacion, FormControl<string>>;
  return new FormGroup(controles);
}

const vacioNulo = (valor: string | null): string | null => ((valor ?? '').trim() ? (valor as string).trim() : null);

/** Valores del formulario de caracterización → `persona` del contrato (vacíos en `null`). */
export function construirPersona(car: Record<ControlCaracterizacion, string>): Omit<PersonaAtencionDto, 'tipoIdentificacion' | 'numeroIdentificacion'> {
  return {
    nombres: unirNombre(car.primerNombre, car.segundoNombre),
    apellidos: unirNombre(car.primerApellido, car.segundoApellido),
    primerNombre: vacioNulo(car.primerNombre),
    segundoNombre: vacioNulo(car.segundoNombre),
    primerApellido: vacioNulo(car.primerApellido),
    segundoApellido: vacioNulo(car.segundoApellido),
    fechaNacimiento: vacioNulo(car.fechaNacimiento),
    identidadGenero: vacioNulo(car.identidadGenero),
    vinculoUniversidad: vacioNulo(car.vinculoUniversidad),
    telefonoPrincipal: vacioNulo(car.telefonoPrincipal),
    correoPersonal: vacioNulo(car.correoPersonal),
    ciudad: vacioNulo(car.ciudad),
    estrato: car.estrato ? Number(car.estrato) : null
  };
}

/** `persona` del contrato → valores del formulario de caracterización. */
export function valoresCaracterizacion(p: PersonaAtencionDto): Record<ControlCaracterizacion, string> {
  const nombre = separarNombre(p.nombres);
  const apellido = separarNombre(p.apellidos);
  return {
    primerNombre: p.primerNombre ?? nombre.primero,
    segundoNombre: p.segundoNombre ?? nombre.segundo,
    primerApellido: p.primerApellido ?? apellido.primero,
    segundoApellido: p.segundoApellido ?? apellido.segundo,
    fechaNacimiento: p.fechaNacimiento ?? '',
    identidadGenero: p.identidadGenero ?? '',
    vinculoUniversidad: p.vinculoUniversidad ?? '',
    telefonoPrincipal: p.telefonoPrincipal ?? '',
    correoPersonal: p.correoPersonal ?? '',
    ciudad: p.ciudad ?? '',
    estrato: p.estrato === null || p.estrato === undefined ? '' : String(p.estrato)
  };
}
