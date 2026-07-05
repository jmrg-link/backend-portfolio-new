import type { FastifyReply, FastifyRequest } from 'fastify';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Middleware de paginación: si la querystring trae `page` o `limit`, cuelga
 * `request.pagination` con valores acotados (page ≥ 1, limit 1..100, default
 * 10) y el skip calculado; si no trae ninguno, la ruta responde plana.
 *
 * @remarks
 * Se acopla por ruta como preHandler en los listados. Valores no numéricos
 * caen a los defaults en silencio. `request.query` se tipa `unknown` en
 * Fastify: el cast a `Record<string, unknown>` permite leer `page`/`limit`
 * antes de normalizarlos.
 */
export async function paginationMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const query = request.query as Record<string, unknown>;
  const rawPage = query['page'];
  const rawLimit = query['limit'];

  if (rawPage === undefined && rawLimit === undefined) return;

  const page = Math.max(1, Number.parseInt(String(rawPage), 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(String(rawLimit), 10) || DEFAULT_LIMIT)
  );

  request.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
