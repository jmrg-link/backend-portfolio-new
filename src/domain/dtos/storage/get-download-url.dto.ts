import { z } from 'zod';
import { keySchema } from './storage.schemas';

export const getDownloadUrlSchema = z.object({ key: keySchema });

/**
 * Entrada de la URL prefirmada de descarga: clave desde la querystring.
 *
 * @throws {ZodError} si la querystring no cumple el schema (la cadena de
 * errores responde 400).
 */
export class GetDownloadUrlDto {
  private constructor(public readonly key: string) {}

  public static fromRequest(query: unknown): GetDownloadUrlDto {
    return new GetDownloadUrlDto(getDownloadUrlSchema.parse(query).key);
  }
}
