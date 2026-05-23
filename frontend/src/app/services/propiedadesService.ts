export type EstadoPropiedad = 'disponible' | 'alquilado' | 'reservado' | 'fuera_de_servicio';
export type Disposicion = 'FRENTE' | 'CONTRAFRENTE' | 'LATERAL' | 'INTERNO';
export type Perimetro = 'ALAMBRADO' | 'CERCADO' | 'SIN_CIERRE';
export type Amenity = 'PILETA' | 'GYM' | 'SUM' | 'PARRILLA' | 'SEGURIDAD_24H';

export interface DireccionPropiedadDTO {
  id?: number;
  calleRuta: string;
  alturaKm?: string;
  localidad: string;
  provincia: string;
  codigoPostal?: string;
}

export interface PropiedadDTO {
  id?: number;
  codigoRef: string;
  codigoCatastral?: string;
  estado: EstadoPropiedad;
  superficieTotal?: number;
  superficieCubierta?: number;
  direccion?: DireccionPropiedadDTO;
  dueniosIds?: number[];
}

export interface UnidadHabitacionalDTO extends PropiedadDTO {
  ambientesNum?: number;
  dormitoriosNum?: number;
  baniosNum?: number;
  mascotas?: boolean;
  aptoProfesional?: boolean;
  anioConstruccion?: number;
}

export interface CasaDTO extends UnidadHabitacionalDTO {
  plantasNum?: number;
  jardin?: boolean;
  cochera?: boolean;
  barrioCerrado?: boolean;
}

export interface DepartamentoDTO extends UnidadHabitacionalDTO {
  piso?: string;
  letraNumero?: string;
  expensasMonto?: number;
  disposicion?: Disposicion;
  amenities?: Amenity[];
}

export interface TerrenoDTO extends PropiedadDTO {
  aplicaRendimiento?: boolean;
  superficieProduccion?: number;
  perimetro?: Perimetro;
}

export type PropiedadUnificada =
  | (CasaDTO & { tipoProp: 'casa' })
  | (DepartamentoDTO & { tipoProp: 'departamento' })
  | (TerrenoDTO & { tipoProp: 'terreno' });

const BASE_URL = 'http://localhost:8080/api/v1';

// Helper for GET/POST/PUT calls to check status and parse JSON
const handleRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }
  return response.json();
};

// Helper for DELETE which may not return JSON
const handleDeleteRequest = async (url: string) => {
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }
  return true;
};

// CASAS
export const getCasas = (): Promise<CasaDTO[]> => handleRequest(`${BASE_URL}/casas`);

export const getCasaById = (id: number | string): Promise<CasaDTO> =>
  handleRequest(`${BASE_URL}/casas/${id}`);

export const createCasa = (dto: CasaDTO): Promise<CasaDTO> =>
  handleRequest(`${BASE_URL}/casas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

export const updateCasa = (id: number | string, dto: CasaDTO): Promise<CasaDTO> =>
  handleRequest(`${BASE_URL}/casas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

export const deleteCasa = (id: number | string): Promise<boolean> =>
  handleDeleteRequest(`${BASE_URL}/casas/${id}`);

// DEPARTAMENTOS
export const getDepartamentos = (): Promise<DepartamentoDTO[]> =>
  handleRequest(`${BASE_URL}/departamentos`);

export const getDepartamentoById = (id: number | string): Promise<DepartamentoDTO> =>
  handleRequest(`${BASE_URL}/departamentos/${id}`);

export const createDepartamento = (dto: DepartamentoDTO): Promise<DepartamentoDTO> =>
  handleRequest(`${BASE_URL}/departamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

export const updateDepartamento = (
  id: number | string,
  dto: DepartamentoDTO
): Promise<DepartamentoDTO> =>
  handleRequest(`${BASE_URL}/departamentos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

export const deleteDepartamento = (id: number | string): Promise<boolean> =>
  handleDeleteRequest(`${BASE_URL}/departamentos/${id}`);

// TERRENOS
export const getTerrenos = (): Promise<TerrenoDTO[]> => handleRequest(`${BASE_URL}/terrenos`);

export const getTerrenoById = (id: number | string): Promise<TerrenoDTO> =>
  handleRequest(`${BASE_URL}/terrenos/${id}`);

export const createTerreno = (dto: TerrenoDTO): Promise<TerrenoDTO> =>
  handleRequest(`${BASE_URL}/terrenos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

export const updateTerreno = (id: number | string, dto: TerrenoDTO): Promise<TerrenoDTO> =>
  handleRequest(`${BASE_URL}/terrenos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

export const deleteTerreno = (id: number | string): Promise<boolean> =>
  handleDeleteRequest(`${BASE_URL}/terrenos/${id}`);

// UNIFIED
export const getAllPropiedades = async (): Promise<PropiedadUnificada[]> => {
  const [casas, deptos, terrenos] = await Promise.all([
    getCasas(),
    getDepartamentos(),
    getTerrenos(),
  ]);

  const casasConTipo = casas.map((c) => ({ ...c, tipoProp: 'casa' as const }));
  const deptosConTipo = deptos.map((d) => ({ ...d, tipoProp: 'departamento' as const }));
  const terrenosConTipo = terrenos.map((t) => ({ ...t, tipoProp: 'terreno' as const }));

  return [...casasConTipo, ...deptosConTipo, ...terrenosConTipo];
};
