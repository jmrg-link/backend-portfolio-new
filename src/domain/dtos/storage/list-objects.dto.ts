import { z } from 'zod';

export const listObjectsSchema = z.object({
  prefix: z.string().default(''),
  continuationToken: z.string().optional(),
  maxKeys: z.coerce.number().min(1).max(200).default(100),
});

/**
 * Entrada del listado de objetos: prefijo, token de continuación y tamaño
 * de página desde la querystring.
 *
 * @throws {ZodError} si la querystring no cumple el schema (la cadena de
 * errores responde 400).
 */
export class ListObjectsDto {
  private constructor(
    public readonly prefix: string,
    public readonly continuationToken: string | undefined,
    public readonly maxKeys: number
  ) {}

  public static fromRequest(query: unknown): ListObjectsDto {
    const parsed = listObjectsSchema.parse(query);
    return new ListObjectsDto(parsed.prefix, parsed.continuationToken, parsed.maxKeys);
  }
}
