export type GrupoMockSpyb =
  | 'catalogos'
  | 'registros'
  | 'bandejaAnalista'
  | 'medidas'
  | 'ordenes'
  | 'camaras'
  | 'remisiones'
  | 'indicadores';

export interface PeticionMockSpyb {
  metodo: string;
  ruta: string;
  query: URLSearchParams;
  cuerpo: unknown;
  usuario: string;
  parametros: string[];
}

export interface RespuestaMockSpyb {
  estado: number;
  cuerpo: unknown;
}

export interface RutaMockSpyb {
  grupo: GrupoMockSpyb;
  metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  patron: RegExp;
  manejador: (peticion: PeticionMockSpyb, store: unknown) => RespuestaMockSpyb;
}

