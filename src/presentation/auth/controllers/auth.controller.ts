import type { FastifyReply, FastifyRequest } from 'fastify';
import type { IAuthAdapter } from '@infrastructure/external-services/clerk';
import { sendProblemReply } from '@presentation/bootstrap/middlewares';

/**
 * Frontera HTTP de autenticación: representa la identidad verificada de
 * la petición actual.
 *
 * @remarks
 * `request.caller` lo inyecta el guard global de API; el 401 defensivo
 * cubre una composición sin ese guard. El email solo existe para tokens
 * de sesión (los tokens de máquina no representan a un usuario).
 */
export class AuthController {
  public constructor(private readonly auth: IAuthAdapter) {}

  public readonly me = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const caller = request.caller;
    if (caller === undefined) {
      await sendProblemReply(request, reply, 401, 'Unauthorized', 'No estas autenticado');
      return;
    }
    const email =
      caller.userId === null ? null : await this.auth.resolvePrimaryEmail(caller.userId);
    await reply.send({ tokenType: caller.tokenType, userId: caller.userId, email });
  };
}
