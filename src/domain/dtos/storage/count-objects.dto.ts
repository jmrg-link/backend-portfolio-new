import { z } from 'zod';

export const countObjectsSchema = z.object({ prefix: z.string().default('') });

/**
 * Entrada del recuento de objetos: prefijo desde la querystring.
 *
 * @throws {ZodError} si la querystring no cumple el schema (la cadena de
 * errores responde 400).
 */
export class CountObjectsDto {
  private constructor(public readonly prefix: string) {}

  public static fromRequest(query: unknown): CountObjectsDto {
    return new CountObjectsDto(countObjectsSchema.parse(query).prefix);
  }
}
