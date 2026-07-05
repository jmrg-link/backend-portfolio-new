import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '@config/envs';
import type { IAuthAdapter } from '@infrastructure/external-services/clerk';
import { authAdapter } from './auth-adapter';
import { sendProblemReply } from './problem-reply';

/**
 * Comprueba el email contra la allowlist de administración: las entradas
 * `@dominio` autorizan el dominio completo; el resto exige igualdad
 * exacta.
 */
function isAllowedAdminEmail(email: string, allowlist: readonly string[]): boolean {
  return allowlist.some(entry => (entry.startsWith('@') ? email.endsWith(entry) : email === entry));
}

/**
 * Construye el guard de administración sobre el adapter de autenticación
 * inyectado: exige que el guard global haya verificado una sesión de
 * usuario (401 con cualquier otra identidad o ninguna) cuyo email
 * pertenezca a la allowlist (403 si no pertenece).
 *
 * @remarks
 * Solo la sesión de un usuario administra — las API keys y los tokens
 * machine-to-machine dan acceso de servicio, nunca de administración. El
 * email se resuelve fail-closed: si el proveedor no responde, 403.
 */
export function buildAdminGuard(
  auth: IAuthAdapter,
  allowlist: readonly string[]
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request, reply) => {
    const caller = request.caller;
    if (caller === undefined || caller.tokenType !== 'session_token' || caller.userId === null) {
      await sendProblemReply(request, reply, 401, 'Unauthorized', 'No estas autenticado');
      return;
    }

    const email = await auth.resolvePrimaryEmail(caller.userId);
    if (email === null || !isAllowedAdminEmail(email, allowlist)) {
      await sendProblemReply(
        request,
        reply,
        403,
        'Forbidden',
        'Acceso restringido a administradores'
      );
      return;
    }
  };
}

/**
 * Guard de administración compuesto con el adapter compartido y la
 * allowlist del entorno; las rutas admin lo acoplan como preHandler.
 */
export const adminGuard = buildAdminGuard(authAdapter, env.clerk.adminEmailAllowlist);
