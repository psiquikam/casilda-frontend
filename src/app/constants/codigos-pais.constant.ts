export interface CodigoPais {
  codigo: string;
  nombre: string;
  region?: string;
}

/**
 * Catálogo de códigos de país según estándar ISO 3166-1 alpha-3 para documentos de identidad extranjeros.
 * Incluye la abreviatura 'VNZ' conforme a la Matriz Técnica VBG institucional (ej. VNZ123456)
 * junto con la codificación internacional estándar.
 */
export const CATALOGO_CODIGOS_PAIS: CodigoPais[] = [
  { codigo: 'VNZ', nombre: 'Venezuela (VNZ)', region: 'América del Sur' },
  { codigo: 'VEN', nombre: 'Venezuela (ISO VEN)', region: 'América del Sur' },
  { codigo: 'COL', nombre: 'Colombia', region: 'América del Sur' },
  { codigo: 'ECU', nombre: 'Ecuador', region: 'América del Sur' },
  { codigo: 'PER', nombre: 'Perú', region: 'América del Sur' },
  { codigo: 'ARG', nombre: 'Argentina', region: 'América del Sur' },
  { codigo: 'BOL', nombre: 'Bolivia', region: 'América del Sur' },
  { codigo: 'BRA', nombre: 'Brasil', region: 'América del Sur' },
  { codigo: 'CHL', nombre: 'Chile', region: 'América del Sur' },
  { codigo: 'PRY', nombre: 'Paraguay', region: 'América del Sur' },
  { codigo: 'URY', nombre: 'Uruguay', region: 'América del Sur' },
  { codigo: 'PAN', nombre: 'Panamá', region: 'América Central' },
  { codigo: 'CRI', nombre: 'Costa Rica', region: 'América Central' },
  { codigo: 'NIC', nombre: 'Nicaragua', region: 'América Central' },
  { codigo: 'HND', nombre: 'Honduras', region: 'América Central' },
  { codigo: 'SLV', nombre: 'El Salvador', region: 'América Central' },
  { codigo: 'GTM', nombre: 'Guatemala', region: 'América Central' },
  { codigo: 'MEX', nombre: 'México', region: 'América del Norte' },
  { codigo: 'USA', nombre: 'Estados Unidos', region: 'América del Norte' },
  { codigo: 'CAN', nombre: 'Canadá', region: 'América del Norte' },
  { codigo: 'CUB', nombre: 'Cuba', region: 'El Caribe' },
  { codigo: 'DOM', nombre: 'República Dominicana', region: 'El Caribe' },
  { codigo: 'HTI', nombre: 'Haití', region: 'El Caribe' },
  { codigo: 'ESP', nombre: 'España', region: 'Europa' },
  { codigo: 'FRA', nombre: 'Francia', region: 'Europa' },
  { codigo: 'DEU', nombre: 'Alemania', region: 'Europa' },
  { codigo: 'ITA', nombre: 'Italia', region: 'Europa' },
  { codigo: 'GBR', nombre: 'Reino Unido', region: 'Europa' },
  { codigo: 'PRT', nombre: 'Portugal', region: 'Europa' },
  { codigo: 'NLD', nombre: 'Países Bajos', region: 'Europa' },
  { codigo: 'CHN', nombre: 'China', region: 'Asia' },
  { codigo: 'JPN', nombre: 'Japón', region: 'Asia' },
  { codigo: 'AUS', nombre: 'Australia', region: 'Oceanía' },
  { codigo: 'EXT', nombre: 'Otro país extranjero', region: 'Otros' }
];
