import type { FastifyRequest } from 'fastify';
import { createClerkClient } from '@clerk/fastify';
import { env } from '@config/envs';
import type { ApiCaller, IAuthAdapter } from './types';

const EMAIL_CACHE_TTL_MS = 300_000;
const ACCEPTED_TOKENS = ['session_token', 'api_key', 'm2m_token'] as const;

/**
 * Autenticación de la API sobre Clerk: verifica el token de la petición
 * (sesión, API key o machine-to-machine) y resuelve el email principal
 * del usuario vía la Backend API.
 *
 * @remarks
 * createClerkClient usa las credenciales de `env.clerk` y la clave
 * pública PEM cuando está definida (verificación offline sin JWKS
 * remoto).
 */
export class ClerkAuthAdapter implements IAuthAdapter {
  private readonly client = createClerkClient({
    secretKey: env.clerk.secretKey,
    publishableKey: env.clerk.publishableKey,
    ...(env.clerk.publicKey !== undefined && { jwtKey: env.clerk.publicKey }),
  });

  private readonly emailCache = new Map<string, { email: string | null; expiresAt: number }>();

  /**
   * Verifica el token de la petición contra los tipos aceptados y
   * devuelve la identidad, o null si no hay token verificable.
   *
   * @remarks
   * El catch sin relanzar es deliberado: decodeJwt de @clerk/backend lanza
   * SyntaxError ante tokens malformados en lugar de resolver signed-out;
   * cualquier fallo de verificación equivale a identidad ausente — nunca
   * 500.
   */
  public async resolveCaller(request: FastifyRequest): Promise<ApiCaller | null> {
    try {
      const state = await this.client.authenticateRequest(ClerkAuthAdapter.toWebRequest(request), {
        acceptsToken: [...ACCEPTED_TOKENS],
      });
      const auth = state.toAuth();
      if (auth === null || !auth.isAuthenticated) return null;
      if (auth.tokenType === 'session_token') {
        return { tokenType: auth.tokenType, userId: auth.userId };
      }
      if (auth.tokenType === 'api_key' || auth.tokenType === 'm2m_token') {
        return { tokenType: auth.tokenType, userId: null };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Email principal del usuario vía la Backend API, con caché en memoria de
   * 5 minutos por userId.
   *
   * @remarks
   * El catch sin relanzar es deliberado y fail-closed: si la API no
   * responde no puede afirmarse la identidad del email y el consumidor
   * debe rechazar — un fallo del proveedor jamás abre acceso.
   */
  public async resolvePrimaryEmail(userId: string): Promise<string | null> {
    const cached = this.emailCache.get(userId);
    if (cached !== undefined && cached.expiresAt > Date.now()) return cached.email;
    try {
      const user = await this.client.users.getUser(userId);
      const email = user.primaryEmailAddress?.emailAddress.toLowerCase() ?? null;
      this.emailCache.set(userId, { email, expiresAt: Date.now() + EMAIL_CACHE_TTL_MS });
      return email;
    } catch {
      return null;
    }
  }

  /**
   * Reconstruye la petición como Request del estándar Fetch para
   * authenticateRequest, descartando los pseudo-headers de HTTP/2
   * (`:authority`, `:path`…), cuyos nombres son inválidos para la clase
   * Headers.
   *
   * @remarks
   * El origen es un host ficticio: Clerk solo necesita método, ruta y
   * headers (Authorization) para verificar el token.
   */
  private static toWebRequest(request: FastifyRequest): Request {
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value === undefined || key.startsWith(':')) continue;
      headers.set(key, Array.isArray(value) ? value.join(',') : value);
    }
    return new Request(new URL(request.url, `${request.protocol}://clerk-dummy`), {
      method: request.method,
      headers,
    });
  }
}
