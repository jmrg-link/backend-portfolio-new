import type { FastifyInstance } from 'fastify';

interface PageEnvelope {
  data: { _id: string }[];
  meta: { countTotal: number };
}

/**
 * Recorre todas las páginas de un listado paginado y devuelve los `_id`
 * en el orden servido, para afirmar que la paginación ni duplica ni
 * omite documentos entre páginas.
 */
export const collectPaginatedIds = async (
  app: FastifyInstance,
  url: string,
  limit: number,
  headers: { authorization: string }
): Promise<string[]> => {
  const first = await app.inject({ method: 'GET', url: `${url}?page=1&limit=${limit}`, headers });
  const firstBody = first.json<PageEnvelope>();
  const totalPages = Math.ceil(firstBody.meta.countTotal / limit);
  const ids = firstBody.data.map(item => item._id);
  for (let page = 2; page <= totalPages; page += 1) {
    const response = await app.inject({
      method: 'GET',
      url: `${url}?page=${page}&limit=${limit}`,
      headers,
    });
    ids.push(...response.json<PageEnvelope>().data.map(item => item._id));
  }
  return ids;
};
