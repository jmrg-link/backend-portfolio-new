import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '@config/envs';
import type { IAuthAdapter } from '@infrastructure/external-services/clerk';
import { authAdapter } from './auth-adapter';
import { sendProblemReply } from './problem-reply';

/**
 * Construye el guard global de la API sobre el adapter de autenticación
 * inyectado: toda petición exige un token Clerk válido (sesión, API key o
 * machine-to-machine) y cuelga la identidad verificada en
 * `request.caller`.
 *
 * @remarks
 * La API completa es privada: sin token válido se responde 401. Exentos: el
 * health check base (probes de vida), las peticiones OPTIONS (preflight
 * CORS, que no portan Authorization) y, solo en desarrollo, la documentación
 * OpenAPI (`/documentation`) y el emisor de token (`/auth/dev-token`).
 */
export function buildApiGuard(
  auth: IAuthAdapter
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  const healthPath = `${env.server.apiPrefix}/health`;
  return async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    const path = request.url.split('?')[0] ?? request.url;
    if (path === healthPath) return;
    if (env.server.isDevelopment && path.startsWith('/documentation')) return;
    if (env.server.isDevelopment && path.endsWith('/auth/dev-token')) return;

    const caller = await auth.resolveCaller(request);
    if (caller === null) {
      await sendProblemReply(request, reply, 401, 'Unauthorized', 'No estas autenticado');
      return;
    }
    request.caller = caller;
  };
}

/**
 * Guard global de API compuesto con el adapter compartido; el bootstrap
 * lo registra en onRequest para todas las rutas.
 */
export const apiGuard = buildApiGuard(authAdapter);
