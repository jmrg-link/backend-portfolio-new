import { z } from 'zod';
import { S3_KEY_REGEX } from './storage.schemas';

export const copyObjectSchema = z.object({
  sourceKey: z.string().min(1).regex(S3_KEY_REGEX, 'Invalid source key'),
  destKey: z.string().min(1).regex(S3_KEY_REGEX, 'Invalid destination key'),
});

/**
 * Entrada de la copia de un objeto: claves origen y destino desde el body.
 *
 * @throws {ZodError} si el body no cumple el schema (la cadena de errores
 * responde 400).
 */
export class CopyObjectDto {
  private constructor(
    public readonly sourceKey: string,
    public readonly destKey: string
  ) {}

  public static fromRequest(body: unknown): CopyObjectDto {
    const parsed = copyObjectSchema.parse(body);
    return new CopyObjectDto(parsed.sourceKey, parsed.destKey);
  }
}
