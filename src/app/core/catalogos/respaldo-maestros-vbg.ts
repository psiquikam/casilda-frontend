import { MaestroDto, DEFAULT_MAESTROS } from '../../services/listas.service';
import {
  MODALIDADES_VIOLENCIA,
  VINCULO_UNIVERSIDAD,
  VINCULO_VICTIMA,
  FORMA_OCURRENCIA,
  LUGAR_OCURRENCIA,
  RELACION_MISIONAL,
  GRUPOS_ATENCION,
  raiz,
  hijosDe,
  type OpcionCatalogoVbg
} from './catalogo-vbg';

/**
 * Respaldo de los 31 catálogos que `registro-caso` y `registro-atencion`
 * cargan en `cargarListasMaestras()`.
 *
 * Se usa en dos momentos (ver `MaestrosVbgService`):
 * - **Modo de demostración** (`environment.datosDemostracion`): es la única
 *   fuente, no hay llamada de red.
 * - **Modo real**: es el respaldo si el backend falla, para que el módulo
 *   no quede con desplegables vacíos (EST-02 del diagnóstico).
 *
 * Los catálogos que gobierna la matriz usan sus etiquetas literales; los
 * demás son datos de demostración plausibles, sin ninguna persona real.
 */

function aMaestroDto(opciones: readonly OpcionCatalogoVbg[]): MaestroDto[] {
  return opciones.map((opcion, indice) => ({
    id: indice + 1,
    codigo: opcion.codigo,
    nombre: opcion.etiqueta
  }));
}

/**
 * Hojas de un subárbol completo (todos los descendientes, no solo los
 * hijos directos). La UI actual del módulo es plana; el árbol real se
 * consume desde `CatalogoVbgService` cuando una sección se reconstruya
 * como selector jerárquico (M2 en adelante).
 */
function descendientes(
  catalogo: readonly OpcionCatalogoVbg[],
  codigoRaiz: string
): OpcionCatalogoVbg[] {
  const directos = hijosDe(catalogo, codigoRaiz);
  return directos.flatMap((hijo) => [hijo, ...descendientes(catalogo, hijo.codigo)]);
}

export const RESPALDO_MAESTROS_VBG: Record<string, MaestroDto[]> = {
  // --- Gobernados por la matriz ---
  'vinculos-udea': aMaestroDto(VINCULO_UNIVERSIDAD),
  'vinculos-agresor-victima': aMaestroDto(VINCULO_VICTIMA),
  'tipos-violencia': aMaestroDto(raiz(MODALIDADES_VIOLENCIA)),
  'formas-ocurrencia': aMaestroDto(FORMA_OCURRENCIA),
  'lugares-ocurrencia': aMaestroDto(LUGAR_OCURRENCIA),
  'actividades-misionales': aMaestroDto(RELACION_MISIONAL),
  'grupos-atencion': aMaestroDto(GRUPOS_ATENCION),

  // Subcategorías por tipo. Solo Sexual (tipo 3) tiene hijos en la matriz
  // (decisión provisional del pendiente 8); los demás quedan vacíos: no se
  // inventan subcategorías que la matriz no define.
  'modalidades-violencia/tipo/1': [], // Psicológica
  'modalidades-violencia/tipo/2': [], // Física
  'modalidades-violencia/tipo/3': aMaestroDto(descendientes(MODALIDADES_VIOLENCIA, 'sexual')),
  'modalidades-violencia/tipo/4': [], // Institucional
  'modalidades-violencia/tipo/5': [], // Patrimonial
  // El backend expone "Informática" como tipo 6 de primer nivel; la matriz
  // la anida bajo Sexual como "Violencia facilitada por nuevas tecnologías"
  // (VBG-03-06). Decisión P-VBG-06: se resuelve aquí con el mismo mapeo,
  // y se reporta la discrepancia al equipo de backend (ver glosario).
  'modalidades-violencia/tipo/6': aMaestroDto(hijosDe(MODALIDADES_VIOLENCIA, 'violencia-tecnologica')),
  'modalidades-violencia/tipo/7': [], // Por prejuicio

  // --- No gobernados por la matriz: datos de demostración plausibles ---
  sexos: [
    { id: 1, codigo: 'F', nombre: 'Femenino' },
    { id: 2, codigo: 'M', nombre: 'Masculino' },
    { id: 3, codigo: 'I', nombre: 'Intersexual' }
  ],
  etnias: [
    { id: 1, codigo: 'NINGUNA', nombre: 'Ninguna' },
    { id: 2, codigo: 'INDIGENA', nombre: 'Indígena' },
    { id: 3, codigo: 'AFRO', nombre: 'Negra, afrocolombiana, raizal o palenquera' },
    { id: 4, codigo: 'ROM', nombre: 'Rrom / Gitana' }
  ],
  programas: [
    { id: 1, codigo: 'DEMO-MED', nombre: 'Medicina (demostración)' },
    { id: 2, codigo: 'DEMO-ING-SIS', nombre: 'Ingeniería de Sistemas (demostración)' },
    { id: 3, codigo: 'DEMO-DER', nombre: 'Derecho (demostración)' }
  ],
  'orientaciones-sexuales': [
    { id: 1, codigo: 'HETERO', nombre: 'Heterosexual' },
    { id: 2, codigo: 'HOMO', nombre: 'Homosexual' },
    { id: 3, codigo: 'BI', nombre: 'Bisexual' },
    { id: 4, codigo: 'OTRA-OS', nombre: 'Otra' }
  ],
  'unidades-administrativas': DEFAULT_MAESTROS.unidadesAdministrativas,
  'tipos-solicitud': DEFAULT_MAESTROS.tiposSolicitud,
  departamentos: [
    { id: 1, codigo: 'ANT', nombre: 'Antioquia' },
    { id: 2, codigo: 'CUN', nombre: 'Cundinamarca' },
    { id: 3, codigo: 'VAL', nombre: 'Valle del Cauca' }
  ],
  regimenes: [
    { id: 1, codigo: 'CONTRIB', nombre: 'Contributivo' },
    { id: 2, codigo: 'SUBSID', nombre: 'Subsidiado' },
    { id: 3, codigo: 'ESPECIAL', nombre: 'Especial / Exceptuado' }
  ],
  eps: [
    { id: 1, codigo: 'DEMO-EPS-1', nombre: 'EPS Demostración 1' },
    { id: 2, codigo: 'DEMO-EPS-2', nombre: 'EPS Demostración 2' }
  ],
  'tipos-servicio': [
    { id: 1, codigo: 'PSICOSOCIAL', nombre: 'Psicosocial' },
    { id: 2, codigo: 'JURIDICO', nombre: 'Jurídico' },
    { id: 3, codigo: 'PSICOLOGICO', nombre: 'Psicológico' }
  ],
  'tipos-identificacion': DEFAULT_MAESTROS.tiposDocumento,
  campus: DEFAULT_MAESTROS.campus,
  'unidades-academicas': DEFAULT_MAESTROS.unidadesAcademicas,
  'identidades-genero': DEFAULT_MAESTROS.identidadesGenero,
  'estados-caso': [
    { id: 1, codigo: 'ABIERTO', nombre: 'Abierto' },
    { id: 2, codigo: 'EN-SEGUIMIENTO', nombre: 'En seguimiento' },
    { id: 3, codigo: 'CERRADO', nombre: 'Cerrado' }
  ],
  'tiempos-ocurrido-unidad': [
    { id: 1, codigo: 'DIAS', nombre: 'Días' },
    { id: 2, codigo: 'SEMANAS', nombre: 'Semanas' },
    { id: 3, codigo: 'MESES', nombre: 'Meses' },
    { id: 4, codigo: 'ANIOS', nombre: 'Años' }
  ],
  'lugares-entrevista': [
    { id: 1, codigo: 'OFICINA', nombre: 'Oficina de Casilda' },
    { id: 2, codigo: 'VIRTUAL-ENTREVISTA', nombre: 'Virtual' }
  ]
};
