import { AlmaMockStore } from './alma-mock-store';

/** Grupos de endpoints con interruptor mock/real propio (`environment.lineaAlma.mocks`). */
export type GrupoMockAlma =
  | 'catalogos'
  | 'personas'
  | 'atencionesAph'
  | 'derivaciones'
  | 'bandejaAph'
  | 'contenciones'
  | 'auditoria';

export interface PeticionMock {
  readonly metodo: string;
  /** Ruta relativa a `{apiBaseUrl}/alma`, sin query. */
  readonly ruta: string;
  readonly query: URLSearchParams;
  readonly cuerpo: any;
  /** Nombre de la persona autenticada (para `autor` y `tomadaPor`). */
  readonly usuario: string;
  /** Segmentos capturados por el patrón de la ruta. */
  readonly parametros: readonly string[];
}

export interface RespuestaMock {
  readonly estado: number;
  readonly cuerpo: unknown;
}

export type ManejadorMock = (peticion: PeticionMock, store: AlmaMockStore) => RespuestaMock;

export interface RutaMock {
  readonly metodo: 'GET' | 'POST' | 'PUT' | 'PATCH';
  readonly patron: RegExp;
  readonly grupo: GrupoMockAlma;
  readonly manejador: ManejadorMock;
}

export function ok(cuerpo: unknown, estado = 200): RespuestaMock {
  return { estado, cuerpo };
}

/** Error con el formato estándar del contrato (A.1). */
export function errorMock(estado: number, codigo: string, mensaje: string, detalles: Record<string, unknown> = {}): RespuestaMock {
  return { estado, cuerpo: { codigo, mensaje, detalles } };
}

export function validacion(detalles: Record<string, string>): RespuestaMock {
  return errorMock(400, 'VALIDACION', 'Revise los datos marcados e intente de nuevo.', detalles);
}
