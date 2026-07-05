import { z } from 'zod';

export const listInvitationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  status: z.enum(['pending', 'accepted', 'revoked', 'expired']).optional(),
});

/**
 * Entrada del listado de invitaciones: paginación y filtro de estado desde
 * la querystring.
 *
 * @throws {ZodError} si la querystring no cumple el schema (la cadena de
 * errores responde 400).
 */
export class ListInvitationsDto {
  private constructor(
    public readonly limit: number | undefined,
    public readonly offset: number | undefined,
    public readonly status: 'pending' | 'accepted' | 'revoked' | 'expired' | undefined
  ) {}

  public static fromRequest(query: unknown): ListInvitationsDto {
    const parsed = listInvitationsSchema.parse(query);
    return new ListInvitationsDto(parsed.limit, parsed.offset, parsed.status);
  }
}
