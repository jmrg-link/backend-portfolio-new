/**
 * Parámetros de paginación normalizados que el middleware cuelga del
 * request: página 1-indexada, límite acotado y skip ya calculado para Mongo.
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Metadatos de una respuesta paginada.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  countTotal: number;
  nextPage: boolean;
  previousPage: boolean;
}

/**
 * Envelope de colección paginada: los datos y su meta.
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Colección con su total real (countDocuments) para construir la meta de
 * paginación.
 */
export interface ListResult<T> {
  items: T[];
  countTotal: number;
}

/**
 * Criterios comunes de los listados por idioma: locale opcional (ausente
 * significa todos) y ventana de lectura.
 */
export interface LocaleListOptions {
  locale?: string | undefined;
  skip?: number | undefined;
  limit?: number | undefined;
}

/**
 * Resuelve un listado según la petición: sin paginación lee la colección
 * completa y el total es su longitud; con ella lee la ventana y cuenta el
 * total real en paralelo.
 */
export async function resolveListResult<T>(
  pagination: PaginationParams | undefined,
  fetchWindow: (window?: { skip: number; limit: number }) => Promise<T[]>,
  count: () => Promise<number>
): Promise<ListResult<T>> {
  if (pagination === undefined) {
    const items = await fetchWindow();
    return { items, countTotal: items.length };
  }
  const [items, countTotal] = await Promise.all([
    fetchWindow({ skip: pagination.skip, limit: pagination.limit }),
    count(),
  ]);
  return { items, countTotal };
}

/**
 * Construye los metadatos a partir de los parámetros y el total real de
 * documentos (countDocuments).
 */
function buildPaginationMeta(params: PaginationParams, countTotal: number): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    countTotal,
    nextPage: params.page * params.limit < countTotal,
    previousPage: params.page > 1,
  };
}

/**
 * Representa una colección según la petición: array plano sin paginación,
 * o envelope `{data, meta}` cuando el middleware activó
 * `request.pagination`.
 */
export function buildListBody<T>(
  data: T[],
  countTotal: number,
  pagination?: PaginationParams
): T[] | PaginatedResult<T> {
  if (pagination === undefined) return data;
  return { data, meta: buildPaginationMeta(pagination, countTotal) };
}
