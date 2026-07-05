import { createClerkClient } from '@clerk/fastify';
import { EmmettError } from '@event-driven-io/emmett';
import { env } from '@config/envs';

const DEV_TOKEN_TTL_SECONDS = 3600;

/**
 * Token de sesión de administrador emitido para desarrollo.
 */
export interface DevAdminToken {
  token: string;
  expiresInSeconds: number;
  userId: string;
  email: string | null;
}

/**
 * Emisor de tokens de sesión del administrador para desarrollo: crea una
 * sesión efímera del usuario admin y devuelve su JWT para autenticar
 * peticiones en herramientas como Postman o la UI de OpenAPI.
 *
 * @remarks
 * Solo se instancia en la ruta de desarrollo (`env.server.isDevelopment`);
 * evita la caducidad de ~60 s del token de sesión estándar. La emisión
 * depende de que el plan de Clerk permita `sessions.createSession`.
 */
export class ClerkDevTokenAdapter {
  private readonly client = createClerkClient({
    secretKey: env.clerk.secretKey,
    publishableKey: env.clerk.publishableKey,
  });

  /**
   * Emite un token de sesión del administrador de la allowlist.
   *
   * @throws {EmmettError} 404 si no existe el usuario administrador; 502 si
   * el proveedor no permite emitir la sesión.
   */
  public async issueAdminToken(): Promise<DevAdminToken> {
    try {
      const userId = await this.resolveAdminUserId();
      const session = await this.client.sessions.createSession({ userId });
      const token = await this.client.sessions.getToken(session.id, undefined, DEV_TOKEN_TTL_SECONDS);
      const user = await this.client.users.getUser(userId);
      return {
        token: token.jwt,
        expiresInSeconds: DEV_TOKEN_TTL_SECONDS,
        userId,
        email: user.primaryEmailAddress?.emailAddress ?? null,
      };
    } catch (error) {
      if (error instanceof EmmettError) throw error;
      throw new EmmettError({
        errorCode: 502,
        message:
          'createSession solo es válido contra una instancia de desarrollo de Clerk (claves pk_test/sk_test); la instancia configurada es de producción',
      });
    }
  }

  private async resolveAdminUserId(): Promise<string> {
    const exactEmail = env.clerk.adminEmailAllowlist.find(entry => !entry.startsWith('@'));
    const list =
      exactEmail !== undefined
        ? await this.client.users.getUserList({ emailAddress: [exactEmail], limit: 1 })
        : await this.client.users.getUserList({ limit: 1 });
    const user = list.data[0];
    if (user === undefined) {
      throw new EmmettError({ errorCode: 404, message: 'No hay usuario administrador para emitir el token' });
    }
    return user.id;
  }
}
