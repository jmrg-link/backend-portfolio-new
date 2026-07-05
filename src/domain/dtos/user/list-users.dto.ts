import { z } from 'zod';

export const listUsersSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  query: z.string().min(1).optional(),
});

/**
 * Entrada del listado de usuarios: paginación y búsqueda desde la
 * querystring.
 *
 * @throws {ZodError} si la querystring no cumple el schema (la cadena de
 * errores responde 400).
 */
export class ListUsersDto {
  private constructor(
    public readonly limit: number | undefined,
    public readonly offset: number | undefined,
    public readonly query: string | undefined
  ) {}

  public static fromRequest(query: unknown): ListUsersDto {
    const parsed = listUsersSchema.parse(query);
    return new ListUsersDto(parsed.limit, parsed.offset, parsed.query);
  }
}
