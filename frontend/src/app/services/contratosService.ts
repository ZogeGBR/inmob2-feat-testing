export type EstadoContrato = 'BORRADOR' | 'VIGENTE' | 'FINALIZADO' | 'EN_MORA';
export type IndiceAjuste = 'ICL' | 'IPC';
export type TipoMoneda = 'ARS' | 'USD';

export interface ContratoDTO {
  id?: number;
  contratoNumero: string;
  fechaFirma: string; // 'YYYY-MM-DD'
  fechaInicio: string; // 'YYYY-MM-DD'
  fechaFinal: string; // 'YYYY-MM-DD'
  contratoEstado: EstadoContrato;
  montoBase: number;
  tipoMoneda: TipoMoneda;
  aplicaProdCarne?: boolean;
  cantidadCarne?: number;
  diaVencimientoPago?: number;
  porcentajeComision?: number;
  montoDeposito?: number;
  monedaDeposito?: TipoMoneda;
  observacionesGarantia?: string;
  indiceAjuste?: IndiceAjuste;
  frecuenciaAjuste?: number;
  mesProximoAjuste?: string; // 'YYYY-MM-DD'
  propiedadAlquiladaId: number;
  propietariosIds: number[];
  inquilinosIds: number[];
  garantesIds?: number[];
}

const BASE_URL = 'http://localhost:8080/api/v1/contratos';

const handleRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }
  return response.json();
};

const handleDeleteRequest = async (url: string) => {
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }
  return true;
};

export const getContratos = (): Promise<ContratoDTO[]> => handleRequest(BASE_URL);

export const getContratoById = (id: number | string): Promise<ContratoDTO> =>
  handleRequest(`${BASE_URL}/${id}`);

export const createContrato = (dto: ContratoDTO): Promise<ContratoDTO> =>
  handleRequest(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

export const updateContrato = (id: number | string, dto: ContratoDTO): Promise<ContratoDTO> =>
  handleRequest(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

export const deleteContrato = (id: number | string): Promise<boolean> =>
  handleDeleteRequest(`${BASE_URL}/${id}`);
