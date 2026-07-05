import { z } from 'zod';

/**
 * Representación de salida de un usuario en las respuestas de la API.
 */
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  username: z.string().nullable(),
  imageUrl: z.string(),
  banned: z.boolean(),
  locked: z.boolean(),
  publicMetadata: z.record(z.string(), z.unknown()),
  createdAt: z.number(),
  lastSignInAt: z.number().nullable(),
});

/**
 * Representación de salida de una invitación en las respuestas de la API.
 */
export const invitationResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: z.string(),
  url: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * Página de usuarios: elementos y total sin paginar (paginación de Clerk).
 */
export const paginatedUsersSchema = z.object({
  data: z.array(userResponseSchema),
  totalCount: z.number().int(),
});

/**
 * Página de invitaciones: elementos y total sin paginar.
 */
export const paginatedInvitationsSchema = z.object({
  data: z.array(invitationResponseSchema),
  totalCount: z.number().int(),
});

/**
 * Recuento de usuarios.
 */
export const userCountSchema = z.object({ totalCount: z.number().int() });
