import { z } from 'zod';

/**
 * Identidad verificada de la petición: tipo de token y, para sesiones de
 * usuario, su id y email (los tokens de máquina no representan a un usuario).
 */
export const authMeSchema = z.object({
  tokenType: z.enum(['session_token', 'api_key', 'm2m_token']),
  userId: z.string().nullable(),
  email: z.string().nullable(),
});

/**
 * Token de sesión del administrador emitido por la ruta de desarrollo.
 */
export const devTokenSchema = z.object({
  token: z.string(),
  expiresInSeconds: z.number().int(),
  userId: z.string(),
  email: z.string().nullable(),
});
