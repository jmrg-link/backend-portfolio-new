import { z } from 'zod';
import { ALLOWED_MIME_TYPES, UPLOAD_KEY_REGEX } from './storage.schemas';

export const getUploadUrlSchema = z.object({
  key: z.string().min(1).regex(UPLOAD_KEY_REGEX, 'Invalid S3 key format'),
  contentType: z.enum(ALLOWED_MIME_TYPES),
});

/**
 * Entrada de la URL prefirmada de subida: clave con extensión y tipo MIME
 * de la allowlist de imágenes, desde el body.
 *
 * @throws {ZodError} si el body no cumple el schema (la cadena de errores
 * responde 400).
 */
export class GetUploadUrlDto {
  private constructor(
    public readonly key: string,
    public readonly contentType: string
  ) {}

  public static fromRequest(body: unknown): GetUploadUrlDto {
    const parsed = getUploadUrlSchema.parse(body);
    return new GetUploadUrlDto(parsed.key, parsed.contentType);
  }
}
