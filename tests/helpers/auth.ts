import type { FastifyInstance } from 'fastify';

let cachedToken: string | null = null;

/**
 * Devuelve un token de sesión del administrador para las suites
 * funcionales, emitido por la ruta de desarrollo y cacheado por fichero de
 * pruebas.
 *
 * @throws {Error} si la ruta de desarrollo no puede emitir el token.
 */
export async function adminToken(app: FastifyInstance): Promise<string> {
  if (cachedToken !== null) return cachedToken;
  const response = await app.inject({ method: 'GET', url: '/api/v1/auth/dev-token' });
  if (response.statusCode !== 200) {
    throw new Error(`dev-token respondió ${response.statusCode}: ${response.body}`);
  }
  cachedToken = response.json<{ token: string }>().token;
  return cachedToken;
}

/**
 * Cabecera Authorization lista para inyectar con el token de administrador.
 */
export async function adminHeaders(app: FastifyInstance): Promise<{ authorization: string }> {
  return { authorization: `Bearer ${await adminToken(app)}` };
}
