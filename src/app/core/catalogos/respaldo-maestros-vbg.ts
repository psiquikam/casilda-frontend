import { MaestroDto, DEFAULT_MAESTROS } from '../../services/listas.service';
import {
  MODALIDADES_VIOLENCIA,
  VINCULO_UNIVERSIDAD,
  VINCULO_VICTIMA,
  AMBITO_OCURRENCIA,
  FORMA_OCURRENCIA,
  LUGAR_OCURRENCIA,
  RELACION_MISIONAL,
  RUTAS_INTERNAS,
  RUTAS_EXTERNAS,
  ESPECIALIDADES_SEGUIMIENTO,
  ACCIONES_SEGUIMIENTO,
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

export const RESPALDO_MAESTROS_VBG: Record<string, MaestroDto[]> = {
  // --- Gobernados por la matriz ---
  'vinculos-udea': aMaestroDto(VINCULO_UNIVERSIDAD),
  'vinculos-agresor-victima': aMaestroDto(VINCULO_VICTIMA),
  'tipos-violencia': aMaestroDto(raiz(MODALIDADES_VIOLENCIA)),
  'formas-ocurrencia': aMaestroDto(FORMA_OCURRENCIA),
  'lugares-ocurrencia': aMaestroDto(LUGAR_OCURRENCIA),
  'ambito-ocurrencia': aMaestroDto(AMBITO_OCURRENCIA), // VBG-01-06, nuevo en M2
  // `actividades-misionales` queda para no romper `registro-atencion`, que
  // aún no restructura esta sección (fuera del alcance de M2). `registro-caso`
  // pasa a los dos niveles de abajo.
  'actividades-misionales': aMaestroDto(RELACION_MISIONAL),
  'relacion-misional/nivel-1': aMaestroDto(raiz(RELACION_MISIONAL)),
  'relacion-misional/nivel-2': aMaestroDto(hijosDe(RELACION_MISIONAL, 'misional')),
  'grupos-atencion': aMaestroDto(GRUPOS_ATENCION),
  // VBG-07-02/03: rutas internas y externas como dos grupos de checkboxes
  // (M4), en vez del selector dependiente anterior. «Protocolo de amenazas»
  // ya viene renombrado desde el catálogo (VBG-07-07).
  'rutas-internas': aMaestroDto(RUTAS_INTERNAS),
  'rutas-externas': aMaestroDto(RUTAS_EXTERNAS),
  // VBG-08-01..04: las cuatro especialidades de Seguimientos, y el catálogo
  // Acción → Actividad (decisión provisional del pendiente 15, M4).
  'especialidades-seguimiento': aMaestroDto(ESPECIALIDADES_SEGUIMIENTO),
  'acciones-seguimiento': aMaestroDto(raiz(ACCIONES_SEGUIMIENTO)),
  'acciones-seguimiento/padre/llamada-telefonica': aMaestroDto(hijosDe(ACCIONES_SEGUIMIENTO, 'llamada-telefonica')),
  'acciones-seguimiento/padre/sesion-presencial': aMaestroDto(hijosDe(ACCIONES_SEGUIMIENTO, 'sesion-presencial')),
  'acciones-seguimiento/padre/sesion-virtual': aMaestroDto(hijosDe(ACCIONES_SEGUIMIENTO, 'sesion-virtual')),
  'acciones-seguimiento/padre/gestion-documental': aMaestroDto(hijosDe(ACCIONES_SEGUIMIENTO, 'gestion-documental')),

  // Subcategorías por tipo. Solo Sexual (tipo 3) tiene hijos en la matriz
  // (decisión provisional del pendiente 8); los demás quedan vacíos: no se
  // inventan subcategorías que la matriz no define. Tipo 3 expone solo los
  // tres hijos directos seleccionables de Sexual (VBG-03-02): la rama
  // tecnológica (VBG-03-03) se anida visualmente bajo la misma tarjeta en
  // el formulario, pero se sirve aparte, en tipo 6 (VBG-03-06).
  'modalidades-violencia/tipo/1': [], // Psicológica
  'modalidades-violencia/tipo/2': [], // Física
  'modalidades-violencia/tipo/3': aMaestroDto(
    hijosDe(MODALIDADES_VIOLENCIA, 'sexual').filter((o) => o.codigo !== 'violencia-tecnologica')
  ),
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
  ],
  // Modalidad de contacto del seguimiento; no la gobierna la matriz (es
  // distinta de la especialidad VBG-08-01..04, ver `00-diagnostico-y-plan.md`).
  'tipos-seguimiento': [
    { id: 1, codigo: 'PRESENCIAL', nombre: 'Presencial' },
    { id: 2, codigo: 'TELEFONICO', nombre: 'Telefónico' },
    { id: 3, codigo: 'VIRTUAL-SEGUIMIENTO', nombre: 'Virtual' },
    { id: 4, codigo: 'VISITA-DOMICILIARIA', nombre: 'Visita Domiciliaria' }
  ]
};
