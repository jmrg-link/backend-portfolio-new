import { z } from 'zod';
import { keySchema, MAX_BULK_DELETE } from './storage.schemas';

export const bulkDeleteSchema = z.object({
  keys: z.array(keySchema).min(1).max(MAX_BULK_DELETE),
});

/**
 * Entrada del borrado masivo: entre 1 y 20 claves desde el body.
 *
 * @throws {ZodError} si el body no cumple el schema (la cadena de errores
 * responde 400).
 */
export class BulkDeleteDto {
  private constructor(public readonly keys: string[]) {}

  public static fromRequest(body: unknown): BulkDeleteDto {
    return new BulkDeleteDto(bulkDeleteSchema.parse(body).keys);
  }
}
